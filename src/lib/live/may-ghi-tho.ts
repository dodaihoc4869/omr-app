/// <reference lib="webworker" />
// XEM LẠI LIVE — MÁY GHI, LUỒNG THỢ (Web Worker; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.2, 5). Mọi việc nặng nằm NGOÀI luồng chính của tờ chiếu:
// nhận mẫu thẳng từ AudioWorklet qua MessagePort ⇒ mã hoá MP3 CBR 48 kb/s mono 24 kHz bằng LAME (tệp wasm tách rời, nạp lúc chạy — gói wasm-media-encoders)
// ⇒ cắt khúc 10 giây theo số mẫu (may-ghi-cat.ts) ⇒ cất IndexedDB ⇒ tải `POST /bpu/live/ghi`. Mất mạng ⇒ khúc nằm hàng chờ, có mạng tải bù theo thứ tự,
// kể cả lần mở app sau (≤ 24 giờ, kèm `bu=1`). Trần hàng chờ 60 phút tiếng (360 khúc). Lỗi ở đây chỉ báo về luồng chính — KHÔNG BAO GIỜ chặn live.
import { createEncoder } from 'wasm-media-encoders'
import { BoCatKhuc, type KhucRa } from './may-ghi-cat'
import { ghiKhuc } from './xem-lai-khuc'
import { HZ_LIVE, KB_LIVE } from './xem-lai-mp3'

declare const self: DedicatedWorkerGlobalScope
interface MucCho { k: string; goc: string; ve: string; buoi: string; phien: string; stt: number; than: ArrayBuffer; luc: number }
export type TinVaoTho =
  | { l: 'mo'; goc: string; ve: string; buoi: string; phien: string; hz: number; wasm: string; cong: MessagePort }
  | { l: 'net'; id: string; t: number }
  | { l: 'dong' }
  | { l: 'bu' }
export type TinRaTho =
  | { l: 'tt'; tt: 'dang-ghi' | 'loi'; ket: number; lyDo?: string }
  | { l: 'khuc'; stt: number; kh: number; byte: number; t0: number; ok: boolean }
  | { l: 'xong'; ket: number }

const TEN_DB = 'ddh-live-ghi', KHO = 'khuc'
const HAN_CHO_MS = 24 * 3_600_000, TRAN_CHO = 360, LOI_SAU_MS = 120_000
const bao = (t: TinRaTho): void => { try { self.postMessage(t) } catch { /* luồng chính đã đóng */ } }

// ── Hàng chờ (IndexedDB; không có ⇒ giữ trong bộ nhớ) ──
let db: IDBDatabase | null | undefined
const nho = new Map<string, MucCho>()
function moDb(): Promise<IDBDatabase | null> {
  if (db !== undefined) return Promise.resolve(db)
  return new Promise((xong) => {
    try {
      const r = indexedDB.open(TEN_DB, 1)
      r.onupgradeneeded = () => { r.result.createObjectStore(KHO, { keyPath: 'k' }) }
      r.onsuccess = () => { db = r.result; xong(db) }
      r.onerror = r.onblocked = () => { db = null; xong(null) }
    } catch { db = null; xong(null) }
  })
}
const chay = <T,>(che: IDBTransactionMode, f: (k: IDBObjectStore) => IDBRequest<T>): Promise<T | null> => moDb().then((d) => (d ? new Promise<T | null>((xong) => {
  try { const r = f(d.transaction(KHO, che).objectStore(KHO)); r.onsuccess = () => xong(r.result); r.onerror = () => xong(null) } catch { xong(null) }
}) : null))
async function cat(m: MucCho): Promise<void> { nho.set(m.k, m); if ((await chay('readwrite', (k) => k.put(m))) != null) nho.delete(m.k) }
async function bo(k: string): Promise<void> { nho.delete(k); await chay('readwrite', (s) => s.delete(k)) }
async function dsKhoa(): Promise<string[]> { return [...new Set([...((await chay('readonly', (k) => k.getAllKeys())) ?? []).map(String), ...nho.keys()])].sort() }
async function lay(k: string): Promise<MucCho | null> { return nho.get(k) ?? ((await chay<MucCho | undefined>('readonly', (s) => s.get(k) as IDBRequest<MucCho | undefined>)) ?? null) }

// ── Tải lên ──
let phienNay = '', dangGhi = false, dangTai = false, henTai: ReturnType<typeof setTimeout> | null = null, lui = 0, loiMaHoa = ''
let ketTu: number | null = null
/** Lúc dừng ghi: khúc cuối tải ngay sau đó KHÔNG tính là tải bù; quá 30 giây ⇒ tải bù (máy chủ dựng lại buổi). */
let dongLuc: number | null = null
async function tai(): Promise<void> {
  if (dangTai) return
  dangTai = true
  if (henTai) { clearTimeout(henTai); henTai = null }
  let ket = 0
  try {
    let ds = await dsKhoa()
    // trần hàng chờ: bỏ khúc cũ nhất
    while (ds.length > TRAN_CHO) await bo(ds.shift()!)
    for (const k of ds) {
      const m = await lay(k)
      if (!m) continue
      if (Date.now() - m.luc > HAN_CHO_MS) { await bo(k); continue }
      const bu = m.phien !== phienNay || (!dangGhi && (dongLuc == null || Date.now() - dongLuc > 30_000))
      let giu = false, tra = 0
      try {
        const r = await fetch(`${m.goc}/bpu/live/ghi?phien=${m.phien}&stt=${m.stt}${bu ? '&bu=1' : ''}&ve=${encodeURIComponent(m.ve)}`, { method: 'POST', body: m.than })
        tra = r.status
        const j = (await r.json().catch(() => null)) as { ok?: boolean; lyDo?: string } | null
        // mạng / máy chủ bận ⇒ giữ để tải bù; máy chủ từ chối hẳn (vé, khúc hỏng, buổi đã dọn) ⇒ bỏ
        giu = !(r.ok && j?.ok) && (r.status >= 500 || r.status === 429 || (r.ok && j?.lyDo === 'tat'))
      } catch { giu = true }
      if (m.phien === phienNay) bao({ l: 'khuc', stt: m.stt, kh: 0, byte: m.than.byteLength, t0: 0, ok: !giu && tra === 200 })
      if (giu) { ket = ds.length - ds.indexOf(k); break }
      await bo(k)
    }
  } finally { dangTai = false }
  if (ket) { ketTu ??= Date.now(); lui = Math.min(lui + 1, 5); henTai = setTimeout(() => void tai(), [2000, 3000, 5000, 10_000, 20_000][lui - 1]!) } else { ketTu = null; lui = 0 }
  baoTt(ket)
}
function baoTt(ket: number): void {
  const loi = loiMaHoa || (ketTu != null && Date.now() - ketTu > LOI_SAU_MS ? 'tai-len' : '')
  bao({ l: 'tt', tt: loi ? 'loi' : 'dang-ghi', ket, ...(loi ? { lyDo: loi } : {}) })
}

// ── Ghi ──
let cat0: BoCatKhuc | null = null
let netCho: [string, number][] = []
async function mo(t: Extract<TinVaoTho, { l: 'mo' }>): Promise<void> {
  phienNay = t.phien; dangGhi = true; dongLuc = null
  try {
    const wasm = await (await fetch(t.wasm)).arrayBuffer()
    const ma = await createEncoder('audio/mpeg', wasm)
    ma.configure({ sampleRate: t.hz, channels: 1, bitrate: KB_LIVE, outputSampleRate: HZ_LIVE })
    const khiKhuc = (k: KhucRa): void => {
      const than = ghiKhuc(k.dau, k.mp3).buffer
      bao({ l: 'khuc', stt: k.stt, kh: k.dau.kh, byte: than.byteLength, t0: k.dau.t0, ok: false })
      void cat({ k: `${t.buoi}|${t.phien}|${String(k.stt).padStart(5, '0')}`, goc: t.goc, ve: t.ve, buoi: t.buoi, phien: t.phien, stt: k.stt, than, luc: Date.now() }).then(() => tai())
    }
    cat0 = new BoCatKhuc(t.hz, { maHoa: (pcm) => ma.encode([pcm]).slice(), ketThuc: () => ma.finalize().slice() }, khiKhuc)
    for (const [id, luc] of netCho) cat0.danhDau(id, luc)
    netCho = []
    t.cong.onmessage = (e: MessageEvent<{ b: Float32Array; f: number; luc: number }>) => {
      const d = e.data
      if (!cat0 || !d?.b) return
      try { cat0.datMoc(d.f, d.b.length, d.luc); cat0.nap(d.b) } catch (loi) { loiMaHoa = loi instanceof Error ? loi.message : 'ma-hoa'; baoTt(0) }
    }
    baoTt(0)
  } catch (e) { loiMaHoa = e instanceof Error ? e.message : 'khoi-dong'; baoTt(0) }
  void tai()
}
self.onmessage = (e: MessageEvent<TinVaoTho>) => {
  const t = e.data
  if (t.l === 'mo') void mo(t)
  else if (t.l === 'net') { if (cat0) cat0.danhDau(t.id, t.t); else if (netCho.length < 200) netCho.push([t.id, t.t]) }
  else if (t.l === 'bu') void tai().then(async () => bao({ l: 'xong', ket: (await dsKhoa()).length }))
  else if (t.l === 'dong') {
    try { cat0?.dong() } catch { /* bộ mã hoá đã hỏng */ }
    cat0 = null; dangGhi = false; dongLuc = Date.now()
    // chờ khúc cuối vào hàng rồi tải; báo xong kèm số khúc còn kẹt (luồng chính giữ thợ sống để tải bù tiếp)
    setTimeout(() => { void (async () => { for (let i = 0; i < 20 && dangTai; i++) await new Promise((r) => setTimeout(r, 200)); await tai(); bao({ l: 'xong', ket: (await dsKhoa()).length }) })() }, 50)
  }
}
