// Đồ dùng chung cho các test XEM LẠI LIVE (11/11): R2 giả (Range, siêu dữ liệu, liệt kê theo tiền tố, tải nhiều phần), khúc tiếng giả có đánh số từng khung
// (để soi đúng khung nào còn / bị cắt trong `tieng.mp3`), và phòng thật của Bình Phản Ứng chạy trên kho giả (tests/_live-phong-gia.ts) với công tắc Xem lại Live bật.
import { ghiKhuc, dauGon, docKhuc, khoaKhuc, type DauKhuc } from '../src/lib/live/xem-lai-khuc'
import { BYTE_MOI_KHUNG, MS_MOI_KHUNG, tachKhung } from '../src/lib/live/xem-lai-mp3'
import { maBangMoi, maNetXong } from '../src/lib/live/ma-net'
import type { NetBut } from '../src/lib/but-bang-loi'
import { datWebSocketPairGia, taoPhongGia, type PhongGia, type WsGia } from './_live-phong-gia'

export interface TepGia { b: Uint8Array; meta?: Record<string, string>; kieu?: string }
export function taoR2Gia() {
  const du = new Map<string, TepGia>()
  const dem = { get: 0, put: 0, list: 0, del: 0, phan: 0 }
  const tai = new Map<string, { khoa: string; phan: Map<number, Uint8Array>; kieu?: string }>()
  let soTai = 0
  const sangByte = async (v: unknown): Promise<Uint8Array> => (typeof v === 'string' ? new TextEncoder().encode(v) : v instanceof Uint8Array ? v.slice() : v instanceof ArrayBuffer ? new Uint8Array(v.slice(0)) : ArrayBuffer.isView(v) ? new Uint8Array(v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength)) : new Uint8Array(await new Response(v as ReadableStream).arrayBuffer()))
  const nhieuPhan = (id: string) => ({
    uploadId: id,
    async uploadPart(so: number, than: ArrayBuffer | ArrayBufferView) { dem.phan += 1; tai.get(id)!.phan.set(so, await sangByte(than)); return { partNumber: so, etag: `e${so}` } },
    async complete(phan: { partNumber: number; etag: string }[]) {
      const t = tai.get(id)!, ds = phan.map((p) => t.phan.get(p.partNumber)!)
      // như R2 thật: mọi phần trừ phần cuối phải cùng cỡ và ≥ 5 MiB
      for (const x of ds.slice(0, -1)) if (x.length !== ds[0]!.length || x.length < 5 * 1024 * 1024) throw new Error('R2: phần tải lên không cùng cỡ / nhỏ hơn 5 MiB')
      const ra = new Uint8Array(ds.reduce((s, x) => s + x.length, 0)); let o = 0
      for (const x of ds) { ra.set(x, o); o += x.length }
      du.set(t.khoa, { b: ra, kieu: t.kieu }); tai.delete(id)
      return {}
    },
    async abort() { tai.delete(id) },
  })
  const be = {
    async get(khoa: string, opts?: { range?: { offset?: number; length?: number; suffix?: number } }) {
      dem.get += 1
      const t = du.get(khoa)
      if (!t) return null
      let b = t.b
      const r = opts?.range
      if (r) {
        const a = r.suffix != null ? Math.max(0, t.b.length - r.suffix) : (r.offset ?? 0)
        if (a >= t.b.length) throw new RangeError('The requested range is not satisfiable')
        b = t.b.subarray(a, r.suffix != null || r.length == null ? t.b.length : Math.min(t.b.length, a + r.length))
      }
      const ban = b.slice()
      return { body: new Response(ban).body!, httpEtag: `"${khoa}:${t.b.length}"`, httpMetadata: { contentType: t.kieu }, size: t.b.length, customMetadata: t.meta, arrayBuffer: async () => ban.buffer as ArrayBuffer, range: r }
    },
    async put(khoa: string, v: unknown, opts?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }) { dem.put += 1; du.set(khoa, { b: await sangByte(v), meta: opts?.customMetadata, kieu: opts?.httpMetadata?.contentType }); return {} },
    async head(khoa: string) { const t = du.get(khoa); return t ? { key: khoa, size: t.b.length } : null },
    async delete(khoa: string | string[]) { dem.del += 1; for (const k of Array.isArray(khoa) ? khoa : [khoa]) du.delete(k) },
    async list(o: { prefix?: string; cursor?: string; limit?: number; include?: string[] }) {
      dem.list += 1
      const tat = [...du.keys()].filter((k) => k.startsWith(o.prefix ?? '')).sort()
      const tu = o.cursor ? Number(o.cursor) : 0, gioi = Math.min(o.limit ?? 1000, 1000), phan = tat.slice(tu, tu + gioi)
      return { objects: phan.map((key) => ({ key, size: du.get(key)!.b.length, ...(o.include?.includes('customMetadata') ? { customMetadata: du.get(key)!.meta } : {}) })), truncated: tu + gioi < tat.length, cursor: tu + gioi < tat.length ? String(tu + gioi) : undefined }
    },
    async createMultipartUpload(khoa: string, opts?: { httpMetadata?: { contentType?: string } }) { const id = `t${++soTai}`; tai.set(id, { khoa, phan: new Map(), kieu: opts?.httpMetadata?.contentType }); return nhieuPhan(id) },
    resumeMultipartUpload(_khoa: string, id: string) { return nhieuPhan(id) },
  }
  return { be, du, dem, tai }
}
export type R2Gia = ReturnType<typeof taoR2Gia>

/** Một khung MP3 hợp lệ (48 kb/s, mono, 24 kHz) mang SỐ THỨ TỰ ở byte 20..23 — soi được khung nào còn trong tệp ghép. */
export function khungSo(so: number): Uint8Array { const k = new Uint8Array(BYTE_MOI_KHUNG); k.set([0xff, 0xf3, 0x64, 0xc4]); new DataView(k.buffer).setUint32(20, so >>> 0, true); return k }
/** Số thứ tự của mọi khung trong một tệp MP3 giả (khung câm lấp chỗ thiếu ⇒ 0). */
export function soKhungTrong(b: Uint8Array): number[] { const dv = new DataView(b.buffer, b.byteOffset, b.byteLength); return tachKhung(b).khung.map((k) => dv.getUint32(k.vt + 20, true)) }
/** Một khúc tiếng giả: `kh` khung liền nhau, khung thứ i mang số `soDau + i`. `t0` = giờ MÁY THẦY của khung đầu. */
export function khucGia(o: { t0: number; kh?: number; soDau: number; muc?: number; net?: [string, number][] }): Uint8Array {
  const kh = o.kh ?? 417, mp3 = new Uint8Array(kh * BYTE_MOI_KHUNG)
  for (let i = 0; i < kh; i++) mp3.set(khungSo(o.soDau + i), i * BYTE_MOI_KHUNG)
  const dau: DauKhuc = { v: 1, t0: o.t0, kh, tm: o.t0, muc: Array.from({ length: Math.ceil((kh * MS_MOI_KHUNG) / 500) }, () => o.muc ?? 200), net: o.net ?? [] }
  return ghiKhuc(dau, mp3)
}
/** Cất khúc vào R2 giả đúng như cửa `/bpu/live/ghi` của Worker làm (kèm phần đầu gọn trong siêu dữ liệu). */
export async function datKhuc(r2: R2Gia, buoi: string, phien: string, stt: number, khuc: Uint8Array): Promise<void> {
  const k = docKhuc(khuc)!
  await r2.be.put(khoaKhuc(buoi, phien, stt), khuc, { customMetadata: { d: dauGon(k.dau) } })
}

export const netGia = (id: string, soDiem = 6, msMoiDiem = 100): NetBut => ({ id, cong: 'but', mau: '#fff', co: 3, diem: Array.from({ length: soDiem }, (_, i) => [0.1 + i * 0.01, 0.2, 0.5, i * msMoiDiem] as [number, number, number, number]) })
export const CAU_GIA = (qid: string): Record<string, unknown> => ({ qid, phan: 'I', tuLuan: false, cau: { qid, text: `Đề của ${qid}`, choices: ['A1', 'B1', 'C1', 'D1'] }, dung: 'A', hanGiay: 0, giai: { solution: `Lời giải ${qid}`, anh: [] } })

/** Phòng thật + R2 giả (+ D1 nếu truyền), công tắc Xem lại Live bật, có đồng hồ điều khiển bằng `vi.setSystemTime`. */
export async function taoBuoiGia(o: { r2: R2Gia; DB?: unknown; soEm?: number; lop?: string; envThem?: Record<string, unknown> }) {
  datWebSocketPairGia()
  const ph = taoPhongGia(null, { DE: o.r2.be, ...(o.DB ? { DB: o.DB } : {}), ...o.envThem })
  const em = Array.from({ length: o.soEm ?? 12 }, (_, i) => ({ sbd: `e${String(i + 1).padStart(2, '0')}`, ten: `Nguyễn Văn Em ${i + 1}` }))
  await ph.post('/khoi', { buoiId: 'b1', lop: o.lop ?? '12A1', ds: em.map((x, i) => ({ ...x, coMat: true, luc: i + 1 })), live: { cho: true, sfu: false }, xl: { bat: true, lop: o.lop ?? '12A1' } })
  const gv = await ph.noi('gv'), hs: WsGia[] = []
  for (const e of em) hs.push(await ph.noi('hs', e.sbd))
  await ph.gui(gv, { t: 'chao' })
  for (const w of hs) await ph.gui(w, { t: 'chao' })
  return { ph, gv, hs, em }
}
export type BuoiGia = Awaited<ReturnType<typeof taoBuoiGia>>

/** Chờ phòng xử lý hết việc nền của Xem lại Live rồi chốt ngay (không đợi hẹn giờ). */
export async function choXl(ph: PhongGia): Promise<void> {
  const xl = (ph.p as unknown as { xl: { xong(): Promise<void> } }).xl
  for (let i = 0; i < 3; i++) { await xl.xong(); await ph.choNen() }
}
export async function chot(ph: PhongGia, b: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  await choXl(ph)
  const r = await ph.post('/xl-chot', b)
  await choXl(ph)
  return r
}
export const huyHen = (ph: PhongGia): void => { (ph.p as unknown as { xl: { huyHen(): void } }).xl.huyHen() }
export const guiNet = (ph: PhongGia, gv: WsGia, n: NetBut): Promise<void> => ph.guiNp(gv, maNetXong(n)[0]!)
export const guiBangMoi = (ph: PhongGia, gv: WsGia, trang = 'c1~5,9,661,919,667,18,995,919~s'): Promise<void> => ph.guiNp(gv, maBangMoi(trang, 16 / 9))
