// BÌNH PHẢN ỨNG — phòng cả lớp cùng làm câu thầy đang chiếu (thầy 06/11 «build luôn đẩy lên bản sống»; đặc tả docs/ban-ve-binh-phan-ung-0611/GHI-CHU.md).
// MỘT Durable Object mỗi buổi học (`idFromName('bpu:<buoiId>')`, gợi ý châu Á – Thái Bình Dương), WebSocket NGỦ ĐÔNG, lớp SQLite; trạng thái lưu `ctx.storage`
// (sống qua lúc phòng ngủ). Luật thuần ở src/lib/bpu/phong.ts (test được không cần Cloudflare).
// AN TOÀN ĐÁP ÁN: máy em chỉ nhận `viewEm` — không có đáp án tới khi thầy mở (khoá nhận bài TRƯỚC khi phát). Ngoại lệ niêm phong câu luyện tập KHÔNG áp dụng.
// VAI: quyết định bằng VÉ (HMAC tiền tố riêng `bpu|`): vé thầy chỉ phát ở `/gv/bpu/mo` (sau chốt mã bí mật), vé em ở `/hs/bpu/ve` (token em). Cửa WebSocket
// `/bpu/phong?ve=` nằm NGOÀI `/hs/` (như `/dau-ion/`), Worker kiểm vé rồi mới chuyển vào phòng ⇒ em không thể nhận vai thầy.
// D1: mở phòng 1 đợt chờ (batch), mỗi lượt đọc câu + kiểm câu bảo vệ song song, KẾT THÚC buổi 1 batch ghi `bpu_luot` (bảng tạo lười). Công tắc: `TAT_BPU`.
import type { DurableObjectState, Env, WsMayChu } from './kieu'
import * as L from '../../src/lib/bpu/phong'
import { grade, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { gameIdentity } from './game-v2-auth'
import { tenLopCuaEm } from './ten-lop'
import { TU_CHI_MUC_GAME, cauCongKhai, qidPhucVuDuoc } from './cau-theo-qid'
import { baoMayCacEm } from './ngan-hoc-sinh'

declare const WebSocketPair: { new (): { 0: WsMayChu; 1: WsMayChu } }
declare const WebSocketRequestResponsePair: { new (yeuCau: string, traLoi: string): unknown }

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
export const DUONG_PHONG_BPU = '/bpu/phong'
/** Phòng tự kết thúc + ghi kết quả sau 45 phút không ai thao tác. */
export const NGHI_MS = 45 * 60_000
export const HAN_VE_BPU_MS = 6 * 3_600_000
export const bpuBat = (env: Env): boolean => !!env.PHONG_BPU && !env.TAT_BPU && !!env.MA_BI_MAT

// ── Vé ──
export interface VeBpu { b: string; s: string; v: 'gv' | 'hs'; h: number }
const TIEN_TO = 'bpu|'
const enc = new TextEncoder()
const b64 = (b: Uint8Array) => { let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const tuB64 = (s: string) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b }
const khoa = (biMat: string) => crypto.subtle.importKey('raw', enc.encode(TIEN_TO + biMat), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
export async function kyVeBpu(biMat: string, ve: VeBpu): Promise<string> {
  const than = b64(enc.encode(JSON.stringify({ b: ve.b, s: ve.s, v: ve.v, h: ve.h })))
  return `${than}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC', await khoa(biMat), enc.encode(TIEN_TO + than))))}`
}
export async function kiemVeBpu(biMat: string, chuoi: unknown, nay = Date.now()): Promise<VeBpu | null> {
  if (!biMat || typeof chuoi !== 'string' || chuoi.length > 700) return null
  const [than, ky] = chuoi.split('.')
  if (!than || !ky) return null
  try {
    if (!(await crypto.subtle.verify('HMAC', await khoa(biMat), tuB64(ky), enc.encode(TIEN_TO + than)))) return null
    const v = JSON.parse(new TextDecoder().decode(tuB64(than))) as VeBpu
    if (typeof v.b !== 'string' || !v.b || typeof v.s !== 'string' || (v.v !== 'gv' && v.v !== 'hs') || typeof v.h !== 'number' || v.h < nay) return null
    if (v.v === 'hs' && !v.s) return null
    return { b: v.b, s: v.s, v: v.v, h: v.h }
  } catch { return null }
}

const buoiHop = (id: unknown): string => { const s = str(id).trim(); return /^[A-Za-z0-9_-]{1,64}$/.test(s) ? s : '' }
const phongCua = (env: Env, buoiId: string) => env.PHONG_BPU!.get(env.PHONG_BPU!.idFromName(`bpu:${buoiId}`), { locationHint: 'apac' })
async function goiPhong(env: Env, buoiId: string, duong: string, than: unknown): Promise<Row> {
  const r = await phongCua(env, buoiId).fetch(new Request(`https://bpu${duong}`, { method: 'POST', body: JSON.stringify(than), headers: { 'content-type': 'application/json' } }))
  return (await r.json().catch(() => ({ ok: false, error: 'Phòng không trả lời.' }))) as Row
}

// ── Lệnh Worker ──
/** `POST /gv/bpu/mo { buoiId }` (sau chốt mã bí mật): dựng / cập nhật phòng của buổi từ danh sách lớp + điểm danh (MỘT batch D1), chặn khi lớp có ca kiểm tra mở. */
export async function gvBpuMo(env: Env, b: Row, nay = Date.now()): Promise<Row> {
  if (!bpuBat(env)) return { ok: false, lyDo: 'tat', error: 'Bình Phản Ứng đang tắt.' }
  const buoiId = buoiHop(b.buoiId)
  if (!buoiId) return { ok: false, error: 'Chưa có buổi học. Thầy mở điểm danh trước.' }
  const [buoiR, hsR, ddR, caR] = await env.DB.batch([
    env.DB.prepare('SELECT id, ten, lop, dong_luc, het_han FROM buoi_hoc WHERE id = ?').bind(buoiId),
    env.DB.prepare("SELECT sbd, ho_ten, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'"),
    env.DB.prepare('SELECT d.sbd, d.luc, d.trang_thai, h.ho_ten, h.lop, h.ten_lop FROM buoi_hoc_diem_danh d LEFT JOIN hoc_sinh h ON h.sbd = d.sbd WHERE d.buoi_id = ?').bind(buoiId),
    env.DB.prepare("SELECT ma_ca, TRIM(COALESCE(lop, '')) AS lop FROM ca WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi'"),
  ]) as unknown as { results?: Row[] }[]
  const buoi = buoiR?.results?.[0]
  if (!buoi) return { ok: false, error: 'Không tìm thấy buổi học này.' }
  if (buoi.dong_luc) return { ok: false, error: 'Buổi học này đã kết thúc.' }
  const lopBuoi = str(buoi.lop).trim()
  const lopTheoSbd = new Map<string, string>()
  const ds = new Map<string, { sbd: string; ten: string; coMat: boolean; luc: number | null }>()
  for (const h of hsR?.results ?? []) {
    lopTheoSbd.set(str(h.sbd), str(h.lop).trim())
    if (lopBuoi && tenLopCuaEm(h.lop, h.ten_lop) === lopBuoi) ds.set(str(h.sbd), { sbd: str(h.sbd), ten: str(h.ho_ten) || str(h.sbd), coMat: false, luc: null })
  }
  for (const d of ddR?.results ?? []) {
    const sbd = str(d.sbd); if (!sbd) continue
    const coMat = str(d.trang_thai) === 'co_mat', luc = Date.parse(str(d.luc))
    const cu = ds.get(sbd)
    if (cu) { cu.coMat = coMat; cu.luc = Number.isFinite(luc) ? luc : null }
    else if (str(d.trang_thai) !== 'bo') { ds.set(sbd, { sbd, ten: str(d.ho_ten) || sbd, coMat, luc: Number.isFinite(luc) ? luc : null }); lopTheoSbd.set(sbd, str(d.lop).trim()) }
  }
  const lopEm = new Set([...ds.keys()].map((s) => lopTheoSbd.get(s) ?? '').filter(Boolean))
  const caMo = (caR?.results ?? []).find((c) => lopEm.has(str(c.lop)) || (lopBuoi && str(c.lop) === lopBuoi))
  if (caMo) return { ok: false, lyDo: 'ca-mo', error: `Lớp đang có ca kiểm tra mở (${str(caMo.ma_ca)}). Gửi câu xuống máy lúc này sẽ làm gián đoạn bài thi của các em. Ca đóng xong thầy mở lại.` }
  const r = await goiPhong(env, buoiId, '/khoi', { buoiId, lop: lopBuoi || str(buoi.ten), ds: [...ds.values()] })
  if (!r.ok) return r
  // Em đã điểm danh trước khi thầy mở bảng ⇒ kênh đẩy mở màn chờ trên máy các em.
  await baoMayCacEm(env, [...ds.values()].filter((x) => x.coMat).map((x) => x.sbd), 'bpu').catch(() => 0)
  return { ok: true, buoiId, ve: await kyVeBpu(env.MA_BI_MAT, { b: buoiId, s: '', v: 'gv', h: nay + HAN_VE_BPU_MS }), soEm: ds.size }
}

/** `POST /gv/bpu/luot { buoiId, qid, hanGiay }`: đọc câu đầy đủ từ chỉ mục kho + kiểm câu bảo vệ (song song), mở lượt mới, báo máy các em có mặt. */
export async function gvBpuLuot(env: Env, b: Row): Promise<Row> {
  if (!bpuBat(env)) return { ok: false, lyDo: 'tat', error: 'Bình Phản Ứng đang tắt.' }
  const buoiId = buoiHop(b.buoiId), qid = str(b.qid).trim().slice(0, 200)
  if (!buoiId || !qid) return { ok: false, error: 'Thiếu buổi hoặc câu.' }
  const hanGiay = Math.max(0, Math.min(600, Math.round(Number(b.hanGiay) || 0)))
  const [dong, phucVu, dangThi] = await Promise.all([
    env.DB.prepare(`SELECT q.json AS json ${TU_CHI_MUC_GAME} LIMIT 1`).bind(JSON.stringify([qid])).first<Row>(),
    qidPhucVuDuoc(env, [qid]),
    env.DB.prepare("SELECT DISTINCT sbd FROM luot WHERE trang_thai = 'dang_lam'").all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  if (!dong?.json) return { ok: false, lyDo: 'khong-co', error: 'Câu này không có trong kho của app nên chưa gửi xuống máy em được. Thầy vẫn chiếu và chữa như thường.' }
  if (phucVu.biBaoVe.includes(qid) || !phucVu.kiemDuocBaoVe) return { ok: false, lyDo: 'bao-ve', error: 'Câu này đang được giữ cho ca kiểm tra nên chưa gửi xuống máy em được.' }
  let q: PrivateQuestion
  try { q = JSON.parse(str(dong.json)) as PrivateQuestion } catch { return { ok: false, error: 'Không đọc được câu này.' } }
  const tuLuan = phucVu.tuLuan.includes(qid)
  const r = await goiPhong(env, buoiId, '/luot', { qid, phan: q.phan, tuLuan, cau: cauCongKhai(q), dung: tuLuan ? '' : str(q.correct), hanGiay: tuLuan ? 0 : hanGiay })
  if (!r.ok) return r
  const tru = new Set((dangThi.results ?? []).map((x) => str(x.sbd)))
  const coMat = (Array.isArray(r.coMat) ? (r.coMat as unknown[]).map(str) : []).filter((s) => !tru.has(s))
  await baoMayCacEm(env, coMat, 'bpu').catch(() => 0)
  return { ok: true, so: r.so, tuLuan, daBao: coMat.length }
}

/** `POST /hs/bpu/ve { token, buoiId }`: vé vào phòng của buổi (kiểm chữ ký token, 0 lệnh D1). Phòng tự kiểm em có thuộc lớp không. */
export async function hsBpuVe(env: Env, b: Row, nay = Date.now()): Promise<Row> {
  if (!bpuBat(env)) return { ok: false, lyDo: 'tat' }
  const buoiId = buoiHop(b.buoiId)
  if (!buoiId) return { ok: false, error: 'Thiếu buổi học.' }
  let sbd: string
  try { sbd = await gameIdentity(env, b) } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' } }
  return { ok: true, buoiId, ve: await kyVeBpu(env.MA_BI_MAT, { b: buoiId, s: sbd, v: 'hs', h: nay + HAN_VE_BPU_MS }) }
}

/** `POST /hs/bpu/cua-em { token }`: buổi đang mở hôm nay mà em CÓ MẶT (một lệnh D1) + vé. Máy em gọi khi kênh đẩy báo `bpu`. */
export async function hsBpuCuaEm(env: Env, b: Row, nay = Date.now()): Promise<Row> {
  if (!bpuBat(env)) return { ok: false, lyDo: 'tat' }
  let sbd: string
  try { sbd = await gameIdentity(env, b) } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' } }
  const r = await env.DB.prepare(`SELECT d.buoi_id FROM buoi_hoc_diem_danh d JOIN buoi_hoc bh ON bh.id = d.buoi_id
      WHERE d.sbd = ? AND d.trang_thai = 'co_mat' AND bh.dong_luc IS NULL AND bh.het_han > ? ORDER BY bh.mo_luc DESC LIMIT 1`).bind(sbd, new Date(nay).toISOString()).first<Row>().catch(() => null)
  const buoiId = buoiHop(r?.buoi_id)
  if (!buoiId) return { ok: true, buoiId: null }
  return { ok: true, buoiId, ve: await kyVeBpu(env.MA_BI_MAT, { b: buoiId, s: sbd, v: 'hs', h: nay + HAN_VE_BPU_MS }) }
}

/** Em vừa điểm danh bằng mã ⇒ báo phòng của buổi (nếu đang mở) để bảng hiện em vào lớp NGAY, rồi qua kênh đẩy mở màn chờ Bình Phản Ứng trên máy em
 *  (máy em không phải sửa gì ở phần điểm danh). Phòng chưa mở ⇒ thôi. Không lỗi ra ngoài. */
export async function baoPhongVaoLop(env: Env, buoiId: unknown, sbd: string): Promise<void> {
  const id = buoiHop(buoiId)
  if (!bpuBat(env) || !id || !sbd) return
  await goiPhong(env, id, '/vao', { sbd }).catch(() => null)
}
/** Kết thúc phòng của buổi (thầy kết thúc buổi học). Phòng chưa từng mở ⇒ không làm gì. */
export async function dongPhongBpu(env: Env, buoiId: unknown): Promise<void> {
  const id = buoiHop(buoiId)
  if (!env.PHONG_BPU || !id) return
  await goiPhong(env, id, '/dong', {}).catch(() => null)
}

/** `GET /bpu/phong?ve=…` (nâng cấp WebSocket): kiểm vé ở Worker rồi chuyển vào phòng với vai đã kiểm. */
export async function vaoPhongBpu(req: Request, env: Env): Promise<Response> {
  if (!bpuBat(env)) return new Response('Bình Phản Ứng đang tắt', { status: 410 })
  if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('Cần WebSocket', { status: 426 })
  const ve = await kiemVeBpu(env.MA_BI_MAT, new URL(req.url).searchParams.get('ve'))
  if (!ve) return new Response('Vé không hợp lệ', { status: 403 })
  const h = new Headers({ upgrade: 'websocket', 'x-bpu-vai': ve.v, 'x-bpu-sbd': ve.s })
  return phongCua(env, ve.b).fetch(new Request(`https://bpu${DUONG_PHONG_BPU}`, { method: 'GET', headers: h }))
}

// ── Durable Object ──
const chamSo = (traLoi: string, dapAn: string): boolean => grade({ phan: 'III', correct: dapAn }, traLoi)
interface KemBpu { v: 'gv' | 'hs'; s: string }
interface DongGhi { buoi_id: string; sbd: string; qid: string; luot: number; chon: string; dung: number; giay: number; kj: number; doi: number; roi: number; len_bang: number; luc: string }

export class PhongBinhPhanUng {
  private st: L.TrangThaiPhong | null | undefined = undefined
  private henGui: ReturnType<typeof setTimeout> | null = null

  constructor(private ctx: DurableObjectState, private env: Env) {
    try { ctx.setWebSocketAutoResponse?.(new WebSocketRequestResponsePair('{"t":"ping"}', '{"t":"pong"}')) } catch { /* môi trường test */ }
  }

  private async doc(): Promise<L.TrangThaiPhong | null> {
    if (this.st === undefined) this.st = (await this.ctx.storage.get<L.TrangThaiPhong>('st')) ?? null
    return this.st
  }
  /** Lưu trạng thái; `henNghi` = việc của THẦY (mở phòng, mở lượt, lệnh bảng) ⇒ hẹn lại mốc tự kết thúc 45 phút. Việc của em (gửi, rời màn, tiếp sức) KHÔNG
   *  kéo dài phòng — thầy quên đóng thì phòng vẫn tự kết thúc, máy em không bị giữ. */
  private async luu(henNghi = true): Promise<void> {
    if (!this.st) return
    await this.ctx.storage.put('st', this.st)
    if (henNghi && !this.st.ketThuc) await this.ctx.storage.setAlarm(Date.now() + NGHI_MS)
  }
  private gui(ws: WsMayChu, d: string): void { try { ws.send(d) } catch { /* kết nối vừa đóng */ } }
  private phat(): void {
    const st = this.st
    if (!st) return
    const bang = JSON.stringify(L.viewBang(st))
    for (const ws of this.ctx.getWebSockets('gv')) this.gui(ws, bang)
    for (const ws of this.ctx.getWebSockets('hs')) { const a = ws.deserializeAttachment() as KemBpu | null; if (a?.s) this.gui(ws, JSON.stringify(L.viewEm(st, a.s))) }
  }
  /** Gom tin (tiếp sức, đoán): tối đa ~4 lần/giây tới mọi máy. */
  private phatSau(): void {
    if (this.henGui) return
    this.henGui = setTimeout(() => { this.henGui = null; this.phat() }, 250)
  }

  /** Ghi các dòng của lượt vừa mở đáp án vào hàng chờ (lưu storage); kết thúc buổi mới ghi D1 một lần. */
  private async xepGhi(st: L.TrangThaiPhong): Promise<void> {
    const l = st.luot
    if (!l || !l.ketQua) return
    const luc = new Date().toISOString(), cu = (await this.ctx.storage.get<DongGhi[]>('ghi')) ?? []
    for (const e of st.ds) {
      const t = l.tra[e.sbd]
      if (!t) continue
      const k = l.ketQua[e.sbd]
      cu.push({ buoi_id: st.buoiId, sbd: e.sbd, qid: l.qid, luot: l.so, chon: t.chon, dung: k?.dung ? 1 : 0, giay: Math.round(t.t / 100) / 10, kj: k?.kj ?? 0, doi: e.doi, roi: l.roiMe.includes(e.sbd) ? 1 : 0, len_bang: l.goi?.sbd === e.sbd ? (l.goi.dat ? 2 : 1) : 0, luc })
    }
    await this.ctx.storage.put('ghi', cu.slice(-4000))
  }
  private async ghiD1(): Promise<void> {
    const ds = (await this.ctx.storage.get<DongGhi[]>('ghi')) ?? []
    if (!ds.length || !this.env.DB) return
    try {
      await this.env.DB.prepare(`CREATE TABLE IF NOT EXISTS bpu_luot (buoi_id TEXT NOT NULL, sbd TEXT NOT NULL, qid TEXT NOT NULL, luot INTEGER NOT NULL, chon TEXT, dung INTEGER NOT NULL DEFAULT 0,
        giay REAL, kj INTEGER NOT NULL DEFAULT 0, doi INTEGER, roi INTEGER NOT NULL DEFAULT 0, len_bang INTEGER NOT NULL DEFAULT 0, luc TEXT NOT NULL, PRIMARY KEY (buoi_id, sbd, luot))`).run()
      const cau = this.env.DB.prepare('INSERT OR REPLACE INTO bpu_luot (buoi_id, sbd, qid, luot, chon, dung, giay, kj, doi, roi, len_bang, luc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      for (let i = 0; i < ds.length; i += 50) await this.env.DB.batch(ds.slice(i, i + 50).map((d) => cau.bind(d.buoi_id, d.sbd, d.qid, d.luot, d.chon, d.dung, d.giay, d.kj, d.doi, d.roi, d.len_bang, d.luc)))
      await this.ctx.storage.delete('ghi')
    } catch (e) { console.error('[bpu] ghi D1 lỗi:', e instanceof Error ? e.message : e) }
  }
  private async ketThucBuoi(): Promise<void> {
    const st = await this.doc()
    if (!st || st.ketThuc) return
    L.ketThuc(st, Date.now())
    await this.ctx.storage.put('st', st)
    this.phat()
    await this.ghiD1()
  }

  async fetch(req: Request): Promise<Response> {
    const u = new URL(req.url)
    const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'content-type': 'application/json' } })
    if (req.method === 'GET' && u.pathname === DUONG_PHONG_BPU) {
      if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('Cần WebSocket', { status: 426 })
      const v = req.headers.get('x-bpu-vai') === 'gv' ? 'gv' : 'hs', s = req.headers.get('x-bpu-sbd') ?? ''
      const cap = new WebSocketPair()
      this.ctx.acceptWebSocket(cap[1], [v])
      cap[1].serializeAttachment({ v, s } satisfies KemBpu)
      return new Response(null, { status: 101, webSocket: cap[0] } as ResponseInit)
    }
    if (req.method !== 'POST') return json({ ok: false }, 405)
    const b = (await req.json().catch(() => ({}))) as Row
    const nay = Date.now()
    if (u.pathname === '/khoi') {
      const ds = (Array.isArray(b.ds) ? b.ds : []) as { sbd: string; ten: string; coMat: boolean; luc: number | null }[]
      let st = await this.doc()
      if (!st || st.ketThuc || st.buoiId !== str(b.buoiId)) {
        if (st?.ketThuc) await this.ghiD1()
        st = L.taoPhong({ buoiId: str(b.buoiId), lop: str(b.lop), nay, ds })
      } else for (const x of ds) { if (!st.ds.some((e) => e.sbd === x.sbd)) L.vaoLop(st, x.sbd, x.luc ?? nay, x.ten); if (x.coMat) L.vaoLop(st, x.sbd, x.luc ?? nay) }
      this.st = st
      await this.luu(); this.phat()
      return json({ ok: true })
    }
    const st = await this.doc()
    if (!st || st.ketThuc) return json({ ok: false, lyDo: 'chua-mo', error: 'Phòng chưa mở. Thầy bấm mở Bình Phản Ứng trước.' })
    if (u.pathname === '/vao') {
      const co = L.vaoLop(st, str(b.sbd), nay)
      // Em vừa điểm danh ⇒ kênh đẩy mở màn chờ trên máy em (phòng gửi — không phải ngăn của em gọi lại chính nó).
      if (co) { await this.luu(false); this.phat(); this.ctx.waitUntil(baoMayCacEm(this.env, [str(b.sbd)], 'bpu').catch(() => 0)) }
      return json({ ok: co })
    }
    if (u.pathname === '/luot') {
      const l = L.moLuot(st, { qid: str(b.qid), phan: (b.phan === 'II' || b.phan === 'III' ? b.phan : 'I'), tuLuan: b.tuLuan === true, cau: (b.cau ?? {}) as Row, dung: str(b.dung), hanGiay: Number(b.hanGiay) || null }, nay)
      await this.luu(); this.phat()
      return json({ ok: true, so: l.so, coMat: st.ds.filter((e) => e.vao).map((e) => e.sbd) })
    }
    if (u.pathname === '/dong') { await this.ketThucBuoi(); return json({ ok: true }) }
    return json({ ok: false }, 404)
  }

  async webSocketMessage(ws: WsMayChu, goi: string | ArrayBuffer): Promise<void> {
    if (typeof goi !== 'string' || goi.length > 2000) return
    let j: Row
    try { j = JSON.parse(goi) as Row } catch { return }
    const a = (ws.deserializeAttachment() ?? {}) as KemBpu
    const st = await this.doc()
    if (!st) { this.gui(ws, JSON.stringify({ t: 'chua-mo' })); return }
    const nay = Date.now()
    if (j.t === 'chao') { this.gui(ws, JSON.stringify(a.v === 'gv' ? L.viewBang(st) : L.viewEm(st, a.s))); return }
    if (st.ketThuc) return
    let doi = false, gom = false
    if (a.v === 'hs') {
      const s = a.s
      if (j.t === 'tra') {
        const r = L.nhanTra(st, s, str(j.chon), nay)
        this.gui(ws, JSON.stringify({ t: 'tra-kq', ...r }))
        doi = r.ok
      } else if (j.t === 'roi') doi = L.roiMan(st, s, nay)
      else if (j.t === 'doan') doi = L.duDoan(st, s, j.v ? 1 : 0, nay)
      else if (j.t === 'tiep') { doi = L.tiepSuc(st, s, nay); gom = true }
      else if (j.t === 'vao') doi = L.vaoLop(st, s, nay)
    } else if (a.v === 'gv') {
      if (j.t === 'goi') doi = L.goiLenBang(st, str(j.sbd), Array.isArray(j.lyDo) ? (j.lyDo as unknown[]).map(str) : [], nay)
      else if (j.t === 'lam-bang') doi = L.lamBang(st, nay)
      else if (j.t === 'dat') doi = L.chamLenBang(st, j.v === true, nay)
      else if (j.t === 'mo') { doi = L.moDapAn(st, nay, chamSo); if (doi) await this.xepGhi(st) }
      else if (j.t === 'ket-thuc') { await this.ketThucBuoi(); return }
    }
    if (!doi) return
    await this.luu(a.v === 'gv')
    if (gom) this.phatSau(); else this.phat()
  }

  async webSocketClose(): Promise<void> { /* rời màn do máy em tự báo; mất mạng không bị tính */ }
  async webSocketError(): Promise<void> { /* như trên */ }
  async alarm(): Promise<void> { await this.ketThucBuoi() }
}
