// XEM LẠI LIVE — LỆNH MÁY CHỦ (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.7; hợp đồng src/lib/live/xem-lai-kieu.ts).
// Mọi lệnh ở đây đi THẲNG từ ws-thang.ts (một dòng), không làm index.ts to thêm, không đụng 4 lệnh nóng:
//   POST /bpu/live/ghi?ve&phien&stt[&bu=1]   máy thầy tải khúc 10 giây — vé `bpu|` vai thầy, 0 D1, 1 ghi R2 (trùng `stt` ⇒ ghi đè)
//   GET|POST /hs/live-ds                     buổi em được xem — 1 đợt D1 (cùng đợt với kiểm mật khẩu), kèm vé tệp
//   GET|POST /hs/live-buoi?id                kết quả RIÊNG của em trong buổi — 1 đợt D1
//   GET /live-tep/<id>/<tệp>?ve              buoi.json · net.bin · tieng.mp3 — 0 D1, 1 đọc R2, có `Range` ⇒ 206; `su-kien.json` KHÔNG phục vụ
//   GET|POST /gv/live-ds · POST /gv/live-doi-ten · /gv/live-xoa · /gv/live-dat · /gv/live-dung-lai   (mã bí mật của thầy)
// Lệnh đọc nhận cả GET (`?token=` / đầu mục `x-ma-bi-mat`) lẫn POST thân JSON (`{ token }` / `{ secret }`) như các lệnh khác của app.
// QUYỀN XEM (điểm quyết 3): em thuộc lớp của buổi kể cả em vắng; buổi «mọi lớp» hoặc thầy đặt `diem_danh` ⇒ em đã điểm danh buổi đó.
// VÉ TỆP: HMAC bằng mã bí mật đang có, tiền tố riêng `live|` — `live|<id>|<sbd>|<hạn>|<bản>`; không thêm bí mật mới. Hạn 6 giờ, làm tròn lên đầu giờ
// (vé ổn định trong một giờ ⇒ trình duyệt dùng lại đệm riêng tư); bản dựng mới ⇒ vé mới ⇒ không dính đệm cũ.
import type { Env, ExecutionContext } from './kieu'
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { bpuBat, kiemVeBpu } from './phong-binh-phan-ung'
import { damBaoBangLive, khoaTep, tienToLive, xoaTienTo } from './live-xem-lai'
import { LIVE_TOI_THIEU_MS } from '../../src/lib/live/xem-lai-dung'
import { KHUC_TOI_DA, PHIEN_GHI, dauGon, docKhuc, khoaKhuc } from '../../src/lib/live/xem-lai-khuc'
import { TEP_LIVE, type BuoiLiveDs, type BuoiLiveJson, type QuyenBuoiLive, type TrangThaiBuoiLive } from '../../src/lib/live/xem-lai-kieu'
import { tachKhung } from '../../src/lib/live/xem-lai-mp3'
import { chuanTenThay, soCauTuTenDoan } from '../../src/lib/live/xem-lai-ten'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const so = (v: unknown): number => Number(v) || 0
const CORS: Record<string, string> = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS', 'access-control-allow-headers': 'content-type, x-ma-bi-mat, range', 'access-control-max-age': '86400' }
const json = (v: unknown, status = 200): Response => new Response(JSON.stringify(v), { status, headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store', ...CORS } })
const buoiHop = (id: unknown): string => { const s = str(id).trim(); return /^[A-Za-z0-9_-]{1,64}$/.test(s) ? s : '' }
export const SBD_THAY = '*gv'
export const HAN_VE_LIVE_MS = 6 * 3_600_000
/** Vé thầy quá hạn tối đa ngần này vẫn được TẢI BÙ khúc kẹt (chỉ ghi khúc vào đúng buổi của vé — đặc tả: mở lại app trong 24 giờ). */
const HAN_TAI_BU_MS = 24 * 3_600_000

// ── Vé tệp ──
const enc = new TextEncoder()
const b64 = (b: Uint8Array): string => { let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const tuB64 = (s: string): Uint8Array<ArrayBuffer> => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b }
/** Khoá HMAC dựng MỘT lần cho mỗi mã bí mật (danh sách 80–500 buổi ký 80–500 vé: trước đây dựng lại khoá từng vé). Mã đổi ⇒ dựng khoá mới. */
let khoaDem: { biMat: string; khoa: Promise<CryptoKey> } | null = null
const khoaVe = (biMat: string): Promise<CryptoKey> => {
  if (khoaDem?.biMat !== biMat) khoaDem = { biMat, khoa: crypto.subtle.importKey('raw', enc.encode(`live|${biMat}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']) }
  return khoaDem.khoa
}
const thanVe = (id: string, sbd: string, han: number, ban: number): Uint8Array<ArrayBuffer> => enc.encode(`live|${id}|${sbd}|${han}|${ban}`)
export const hanVeLive = (nay: number): number => Math.ceil((nay + HAN_VE_LIVE_MS) / 3_600_000) * 3_600_000
export async function kyVeLive(biMat: string, id: string, sbd: string, han: number, ban: number): Promise<string> {
  return `${b64(enc.encode(sbd))}.${han.toString(36)}.${ban}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC', await khoaVe(biMat), thanVe(id, sbd, han, ban))))}`
}
export async function kiemVeLive(biMat: string, id: string, ve: unknown, nay = Date.now()): Promise<{ sbd: string; han: number; ban: number } | null> {
  if (!biMat || !id || typeof ve !== 'string' || ve.length > 400) return null
  const p = ve.split('.')
  if (p.length !== 4) return null
  try {
    const sbd = new TextDecoder().decode(tuB64(p[0]!)), han = parseInt(p[1]!, 36), ban = Number(p[2])
    if (!sbd || !Number.isFinite(han) || han < nay || !Number.isInteger(ban) || ban < 0) return null
    if (!(await crypto.subtle.verify('HMAC', await khoaVe(biMat), tuB64(p[3]!), thanVe(id, sbd, han, ban)))) return null
    return { sbd, han, ban }
  } catch { return null }
}

// ── Dùng chung ──
const laThay = (req: Request, env: Env, b: Row): boolean => { const gui = str(b.secret ?? req.headers.get('x-ma-bi-mat') ?? req.headers.get('x-omr-secret')).trim(); return gui.length > 0 && gui === str(env.MA_BI_MAT).trim() }
async function than(req: Request, url: URL): Promise<Row> {
  const b: Row = Object.fromEntries(url.searchParams)
  if (req.method === 'POST') { try { const chu = await req.text(); if (chu && chu.length <= 20_000) Object.assign(b, JSON.parse(chu) as Row) } catch { /* thân hỏng ⇒ chỉ dùng tham số */ } }
  return b
}
const goiPhong = async (env: Env, id: string, duong: string, b: Row = {}): Promise<Row> => {
  if (!env.PHONG_BPU) return { ok: false, lyDo: 'khong-phong' }
  try {
    const r = await env.PHONG_BPU.get(env.PHONG_BPU.idFromName(`bpu:${id}`), { locationHint: 'apac' }).fetch(new Request(`https://bpu${duong}`, { method: 'POST', body: JSON.stringify(b), headers: { 'content-type': 'application/json' } }))
    return ((await r.json().catch(() => null)) ?? { ok: false }) as Row
  } catch { return { ok: false, lyDo: 'phong-loi' } }
}
const COT = 'id, lop, ngay, bat_luc, ten_tu_dong, ten_thay, so_cau, so_doan, giay_live, giay_doan, trang_thai, tien_do, ban, byte, quyen'
const dongBuoi = (r: Row): BuoiLiveDs => ({
  id: str(r.id), ngay: str(r.ngay), lop: str(r.lop), batLuc: str(r.bat_luc), tenTuDong: str(r.ten_tu_dong), tenThay: str(r.ten_thay).trim() || null, soCau: so(r.so_cau), soDoan: so(r.so_doan),
  giayLive: so(r.giay_live), giayDoan: so(r.giay_doan), trangThai: str(r.trang_thai) as TrangThaiBuoiLive, tienDo: so(r.tien_do), ban: so(r.ban),
})
/** Tên lớp hiệu lực của em trong SQL — đúng luật `tenLopCuaEm` (ten-lop.ts), như phòng Bình Phản Ứng. */
const SQL_TEN_LOP = "CASE WHEN TRIM(COALESCE(h.ten_lop, '')) <> '' THEN TRIM(h.ten_lop) WHEN TRIM(COALESCE(h.lop, '')) = '12' THEN '12 - Lớp Thường' WHEN TRIM(COALESCE(h.lop, '')) = '' THEN 'Chưa xếp lớp' ELSE TRIM(h.lop) END"
/** Điều kiện «em ?1 được xem buổi b» (điểm quyết 3). */
const SQL_DUOC_XEM = `((b.quyen = 'lop' AND b.lop <> '' AND b.lop = (SELECT ${SQL_TEN_LOP} FROM hoc_sinh h WHERE h.sbd = ?1 AND COALESCE(h.trang_thai, '') <> 'khoa'))
  OR EXISTS (SELECT 1 FROM buoi_hoc_diem_danh d WHERE d.buoi_id = b.id AND d.sbd = ?1 AND d.trang_thai = 'co_mat'))`

// ── POST /bpu/live/ghi ──
async function ghiKhucLenh(req: Request, env: Env, url: URL): Promise<Response> {
  if (!bpuBat(env)) return json({ ok: false, lyDo: 'tat' })
  const q = url.searchParams, bu = q.get('bu') === '1', nay = Date.now()
  const ve = await kiemVeBpu(env.MA_BI_MAT, q.get('ve'), bu ? nay - HAN_TAI_BU_MS : nay)
  if (!ve || ve.v !== 'gv') return json({ ok: false, lyDo: 've' }, 403)
  const phien = q.get('phien') ?? '', stt = Number(q.get('stt'))
  if (!PHIEN_GHI.test(phien) || !Number.isInteger(stt) || stt < 0 || stt > 99_999) return json({ ok: false, lyDo: 'tham-so' }, 400)
  if (Number(req.headers.get('content-length') ?? 0) > KHUC_TOI_DA) return json({ ok: false, lyDo: 'qua-to' }, 413)
  const b = new Uint8Array(await req.arrayBuffer())
  const k = docKhuc(b)
  if (!k) return json({ ok: false, lyDo: 'khuc-hong' }, 400)
  k.dau.kh = tachKhung(k.mp3).khung.length // tin số khung thật của thân, không tin con số máy khách ghi
  if (!env.DE) return json({ ok: false, lyDo: 'khong-r2' }, 503)
  const khoa = khoaKhuc(ve.b, phien, stt)
  await env.DE.put(khoa, b, { httpMetadata: { contentType: 'application/octet-stream' }, customMetadata: { d: dauGon(k.dau) } })
  if (bu) {
    // Khúc tải bù (sau khi buổi đã chốt): báo phòng dựng lại; phòng đã dọn khúc gốc ⇒ khúc này vô dụng, xoá luôn.
    const r = await goiPhong(env, ve.b, '/xl-bu')
    if (r.lyDo === 'da-don') { await env.DE.delete(khoa).catch(() => undefined); return json({ ok: false, lyDo: 'da-don' }) }
  }
  return json({ ok: true })
}

// ── GET /live-tep/<id>/<tệp>?ve= ──
const KIEU_TEP: Record<string, string> = { [TEP_LIVE.buoi]: 'application/json;charset=utf-8', [TEP_LIVE.net]: 'application/octet-stream', [TEP_LIVE.tieng]: 'audio/mpeg' }
const DAU_TEP = { ...CORS, 'access-control-expose-headers': 'content-range, accept-ranges, content-length, etag', 'accept-ranges': 'bytes', 'cache-control': 'private, max-age=3600' }
/** `Range: bytes=a-b | a- | -n` ⇒ khoảng đọc của R2 (một lần đọc, không cần biết cỡ tệp trước); không có / sai dạng ⇒ null (trả cả tệp). */
export function docRange(dau: string | null): { offset: number; length?: number } | { suffix: number } | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec((dau ?? '').trim())
  if (!m || (!m[1] && !m[2])) return null
  if (!m[1]) return { suffix: Number(m[2]) }
  const a = Number(m[1])
  return m[2] ? { offset: a, length: Math.max(0, Number(m[2]) - a + 1) } : { offset: a }
}
async function tepLenh(req: Request, env: Env, url: URL): Promise<Response> {
  const p = url.pathname.split('/') // ['', 'live-tep', id, tệp]
  const id = buoiHop(p[2]), tep = p.length === 4 ? decodeURIComponent(p[3] ?? '') : ''
  if (!id || !KIEU_TEP[tep]) return json({ ok: false, lyDo: 'khong-co' }, 404)
  if (!(await kiemVeLive(env.MA_BI_MAT, id, url.searchParams.get('ve')))) return json({ ok: false, lyDo: 've' }, 403)
  if (!env.DE) return json({ ok: false, lyDo: 'khong-r2' }, 503)
  const r = docRange(req.headers.get('range'))
  const ngoai = (co: number | null): Response => new Response(null, { status: 416, headers: { ...DAU_TEP, 'content-range': `bytes */${co ?? '*'}` } })
  if (r && (('suffix' in r && r.suffix <= 0) || ('length' in r && r.length === 0))) return ngoai(null)
  let o
  try { o = await env.DE.get(khoaTep(id, tep), r ? { range: r } : undefined) } catch { return ngoai(null) } // R2 ném lỗi khi khoảng nằm ngoài tệp
  if (!o) return json({ ok: false, lyDo: 'khong-co' }, 404)
  const co = o.size ?? 0, dau = new Headers({ ...DAU_TEP, 'content-type': KIEU_TEP[tep]!, etag: o.httpEtag })
  if (r) {
    const a = 'suffix' in r ? Math.max(0, co - r.suffix) : r.offset
    const z = 'suffix' in r || r.length == null ? co - 1 : Math.min(co - 1, a + r.length - 1)
    if (a >= co || z < a) return ngoai(co)
    dau.set('content-range', `bytes ${a}-${z}/${co}`); dau.set('content-length', String(z - a + 1))
    return new Response(req.method === 'HEAD' ? null : o.body, { status: 206, headers: dau })
  }
  if (co) dau.set('content-length', String(co))
  return new Response(req.method === 'HEAD' ? null : o.body, { status: 200, headers: dau })
}

// ── /hs/live-* ──
async function hsLenh(env: Env, p: string, b: Row, nay: number): Promise<Response> {
  let buoc: { sbd: string; xong: Promise<string> }
  try { buoc = await gameIdentityHaiBuoc(env, b) } catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' }, 401) }
  const sbd = buoc.sbd, han = hanVeLive(nay)
  // Các lượt ĐỌC bắt đầu cùng đợt với lượt kiểm mật khẩu (một đợt chờ D1); chỉ trả kết quả sau khi mật khẩu qua.
  const xacThuc = buoc.xong.then(() => null, (e: unknown) => (e instanceof Error ? e.message : 'Em đăng nhập lại.'))
  if (p === '/hs/live-ds') {
    const doc = env.DB.batch([
      env.DB.prepare(`SELECT ${COT.split(', ').map((c) => `b.${c}`).join(', ')} FROM live_buoi b WHERE (b.trang_thai = 'dang_xu_ly' OR (b.trang_thai = 'xong' AND b.so_doan > 0)) AND ${SQL_DUOC_XEM} ORDER BY b.bat_luc DESC LIMIT 80`).bind(sbd),
      env.DB.prepare('SELECT buoi_id, ten FROM live_doan WHERE sbd_len_bang = ?').bind(sbd),
    ]).then((r) => r as unknown as { results?: Row[] }[], () => [{ results: [] as Row[] }, { results: [] as Row[] }])
    const [loi, [buoiR, doanR]] = await Promise.all([xacThuc, doc])
    if (loi) return json({ ok: false, error: loi }, 401)
    const lenBang = new Map<string, number[]>()
    for (const d of doanR?.results ?? []) { const n = soCauTuTenDoan(str(d.ten)); if (!n) continue; const ds = lenBang.get(str(d.buoi_id)) ?? []; if (!ds.includes(n)) ds.push(n); lenBang.set(str(d.buoi_id), ds) }
    const buoi = await Promise.all((buoiR?.results ?? []).map(async (r) => {
      const d = dongBuoi(r)
      return { ...d, lenBang: (lenBang.get(d.id) ?? []).sort((x, y) => x - y), ve: d.trangThai === 'xong' ? await kyVeLive(env.MA_BI_MAT, d.id, sbd, han, d.ban) : null }
    }))
    return json({ ok: true, buoi })
  }
  const id = buoiHop(b.id)
  if (!id) return json({ ok: false, lyDo: 'khong-co' }, 404)
  const cauBuoi = () => env.DB.prepare(`SELECT b.id, b.ban FROM live_buoi b WHERE b.id = ?2 AND b.trang_thai = 'xong' AND b.so_doan > 0 AND ${SQL_DUOC_XEM}`).bind(sbd, id)
  const doc = env.DB.batch([cauBuoi(), env.DB.prepare('SELECT luot, dung, len_bang FROM bpu_luot WHERE buoi_id = ? AND sbd = ?').bind(id, sbd)])
    .then((r) => r as unknown as { results?: Row[] }[])
    // Bảng `bpu_luot` chưa có (chưa buổi nào kết thúc) ⇒ chỉ hỏi quyền.
    .catch(() => cauBuoi().all<Row>().then((r) => [r as { results?: Row[] }, { results: [] as Row[] }], () => [{ results: [] as Row[] }, { results: [] as Row[] }]))
  const [loi, [buoiR, luotR]] = await Promise.all([xacThuc, doc])
  if (loi) return json({ ok: false, error: loi }, 401)
  const dong = buoiR?.results?.[0]
  if (!dong) return json({ ok: false, lyDo: 'khong-co' }, 404)
  const ketQua: Record<number, { dung: boolean }> = {}, lenBang: number[] = []
  for (const l of luotR?.results ?? []) { ketQua[so(l.luot)] = { dung: so(l.dung) === 1 }; if (so(l.len_bang) > 0) lenBang.push(so(l.luot)) }
  return json({ ok: true, id, ban: so(dong.ban), ve: await kyVeLive(env.MA_BI_MAT, id, sbd, han, so(dong.ban)), ketQua, lenBang: lenBang.sort((x, y) => x - y) })
}

// ── /gv/live-* ──
/** Xoá hẳn các buổi đã đánh dấu `dang_xoa`: R2 theo tiền tố ⇒ báo phòng dọn nhật ký ⇒ xoá hai bảng. Đứt giữa chừng ⇒ buổi còn `dang_xoa`, cron chạy tiếp.
 *  KHÔNG đụng `bpu_luot`, `buoi_hoc`, `buoi_hoc_diem_danh`. Trả các buổi đã xoá hẳn + buổi còn dở. */
export async function xoaBuoiDanhDau(env: Env, ids: readonly string[], hanMs = 20_000): Promise<{ xoa: string[]; conDo: string[] }> {
  const xoa: string[] = [], conDo: string[] = [], dau = Date.now()
  for (const id of ids) {
    if (Date.now() - dau > hanMs) { conDo.push(id); continue }
    try {
      await xoaTienTo(env, tienToLive(id))
      if (env.DE?.list && (await env.DE.list({ prefix: tienToLive(id), limit: 1 })).objects.length) { conDo.push(id); continue }
      await goiPhong(env, id, '/xl-don', { xoa: true })
      await env.DB.batch([env.DB.prepare('DELETE FROM live_doan WHERE buoi_id = ?').bind(id), env.DB.prepare("DELETE FROM live_buoi WHERE id = ? AND trang_thai = 'dang_xoa'").bind(id)])
      xoa.push(id)
    } catch (e) { console.error('[live-xem-lai] xoá buổi lỗi:', id, e instanceof Error ? e.message : e); conDo.push(id) }
  }
  return { xoa, conDo }
}
async function gvLenh(env: Env, p: string, b: Row, nay: number, ctx?: ExecutionContext): Promise<Response> {
  await damBaoBangLive(env).catch(() => undefined)
  const iso = new Date(nay).toISOString()
  if (p === '/gv/live-ds') {
    // Cột `ly_do` (11/11, chỉ-thêm, thêm lười lúc chốt buổi 0 đoạn đầu tiên) có thể CHƯA có ⇒ `SELECT *` lấy cột ấy khi có, không có thì thôi: luôn MỘT câu đọc
    // (trước: chưa có cột ⇒ câu thứ nhất lỗi rồi đọc lại câu thứ hai = 2 vòng chờ nối tiếp mỗi lần mở Lịch sử Live).
    const r = await env.DB.prepare("SELECT * FROM live_buoi WHERE trang_thai <> 'dang_xoa' ORDER BY bat_luc DESC LIMIT 500").all<Row>().then((x) => x.results ?? []).catch(() => [] as Row[])
    const han = hanVeLive(nay)
    const buoi = await Promise.all(r.map(async (x) => {
      const d = dongBuoi(x), ly = str(x.ly_do)
      // Lý do chỉ có nghĩa ở buổi ĐÃ XONG mà 0 đoạn (buổi dựng lại ra đoạn thì cột cũ không còn được đọc).
      if (d.trangThai === 'xong' && d.soDoan === 0) d.lyDo = ly === 'ngan' || ly === 'khong-cau' || ly === 'khong-tieng-net' || ly === 'khong-doan' ? ly : d.giayLive < LIVE_TOI_THIEU_MS / 1000 ? 'ngan' : d.soCau === 0 ? 'khong-cau' : 'khong-doan'
      return { ...d, byte: so(x.byte), quyen: (str(x.quyen) === 'diem_danh' ? 'diem_danh' : 'lop') as QuyenBuoiLive, ve: d.trangThai === 'xong' && d.soDoan > 0 ? await kyVeLive(env.MA_BI_MAT, d.id, SBD_THAY, han, d.ban) : null }
    }))
    return json({ ok: true, buoi, tongByte: buoi.reduce((s, x) => s + x.byte, 0) })
  }
  if (p === '/gv/live-xoa') {
    const ids = [...new Set((Array.isArray(b.ids) ? b.ids : []).map(buoiHop).filter(Boolean))].slice(0, 100)
    if (!ids.length) return json({ ok: false, error: 'Chưa chọn buổi nào.' }, 400)
    const ds = JSON.stringify(ids)
    // Một lô: đánh dấu trước (ẩn với em ngay) + đọc dung lượng.
    const [, byteR] = (await env.DB.batch([
      env.DB.prepare("UPDATE live_buoi SET trang_thai = 'dang_xoa', cap_nhat = ? WHERE id IN (SELECT value FROM json_each(?))").bind(iso, ds),
      env.DB.prepare('SELECT id, byte FROM live_buoi WHERE id IN (SELECT value FROM json_each(?))').bind(ds),
    ])) as unknown as { results?: Row[] }[]
    const byteCua = new Map((byteR?.results ?? []).map((x) => [str(x.id), so(x.byte)]))
    const kq = await xoaBuoiDanhDau(env, ids.filter((id) => byteCua.has(id)))
    return json({ ok: true, xoa: kq.xoa, conDo: kq.conDo, byte: kq.xoa.reduce((s, id) => s + (byteCua.get(id) ?? 0), 0) })
  }
  const id = buoiHop(b.id)
  if (!id) return json({ ok: false, error: 'Thiếu buổi live.' }, 400)
  if (p === '/gv/live-doi-ten') {
    const ten = chuanTenThay(b.ten)
    const r = await env.DB.prepare("UPDATE live_buoi SET ten_thay = ?, cap_nhat = ? WHERE id = ? AND trang_thai <> 'dang_xoa'").bind(ten, iso, id).run()
    if (!r.meta?.changes) return json({ ok: false, lyDo: 'khong-co', error: 'Không tìm thấy buổi live này.' }, 404)
    // Việc phụ sau phản hồi: chép tên mới vào chỉ mục trang (máy em đọc tên từ danh sách D1; chỉ mục giữ cho khớp).
    const viec = (async () => {
      const o = await env.DE?.get(khoaTep(id, TEP_LIVE.buoi))
      if (!o?.arrayBuffer) return
      const j = JSON.parse(new TextDecoder().decode(await o.arrayBuffer())) as BuoiLiveJson
      j.tenThay = ten
      await env.DE.put(khoaTep(id, TEP_LIVE.buoi), JSON.stringify(j), { httpMetadata: { contentType: 'application/json' } })
    })().catch(() => undefined)
    if (ctx) ctx.waitUntil(viec); else await viec
    return json({ ok: true, id, tenThay: ten })
  }
  if (p === '/gv/live-dat') {
    const quyen = b.quyen === 'diem_danh' ? 'diem_danh' : b.quyen === 'lop' ? 'lop' : ''
    if (!quyen) return json({ ok: false, error: 'Thiếu lựa chọn ai xem được.' }, 400)
    const r = await env.DB.prepare("UPDATE live_buoi SET quyen = ?, cap_nhat = ? WHERE id = ? AND trang_thai <> 'dang_xoa'").bind(quyen, iso, id).run()
    return r.meta?.changes ? json({ ok: true, id, quyen }) : json({ ok: false, lyDo: 'khong-co', error: 'Không tìm thấy buổi live này.' }, 404)
  }
  if (p === '/gv/live-dung-lai') {
    const r = await env.DB.prepare("UPDATE live_buoi SET trang_thai = 'dang_xu_ly', tien_do = 5, cap_nhat = ? WHERE id = ? AND trang_thai IN ('loi', 'xong', 'dang_xu_ly')").bind(iso, id).run()
    if (!r.meta?.changes) return json({ ok: false, lyDo: 'khong-co', error: 'Không tìm thấy buổi live này.' }, 404)
    const kq = await goiPhong(env, id, '/xl-chot', { ep: true })
    if (kq.ok === false) await env.DB.prepare("UPDATE live_buoi SET trang_thai = 'loi', cap_nhat = ? WHERE id = ? AND trang_thai = 'dang_xu_ly'").bind(new Date().toISOString(), id).run().catch(() => undefined)
    return json({ ok: kq.ok !== false, id, ...(kq.ok === false ? { lyDo: str(kq.lyDo), error: str(kq.error) || 'Chưa dựng lại được buổi này.' } : {}) })
  }
  return json({ ok: false, error: 'Không có lệnh này.' }, 404)
}

/** Cửa đi thẳng (ws-thang.ts gọi đầu tiên). Không phải lệnh của Xem lại Live ⇒ null (rẻ: một lần dò chuỗi). */
export function cuaXemLai(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> | null {
  const u = req.url
  if (!u.includes('/live-') && !u.includes('/bpu/live/ghi')) return null
  const url = new URL(u), p = url.pathname, m = req.method
  const laGhi = p === '/bpu/live/ghi', laTep = p.startsWith('/live-tep/')
  const laLenh = p === '/hs/live-ds' || p === '/hs/live-buoi' || p === '/gv/live-ds' || p === '/gv/live-doi-ten' || p === '/gv/live-xoa' || p === '/gv/live-dat' || p === '/gv/live-dung-lai'
  if (!laGhi && !laTep && !laLenh) return null
  if (m === 'OPTIONS') return Promise.resolve(new Response(null, { status: 204, headers: CORS }))
  const bat = (f: () => Promise<Response>): Promise<Response> => f().catch((e) => { console.error('[live-xem-lai] lệnh lỗi:', p, e instanceof Error ? e.message : e); return json({ ok: false, error: 'Máy chủ chưa làm được việc này. Thử lại sau ít phút.' }, 500) })
  if (laGhi) return m === 'POST' ? bat(() => ghiKhucLenh(req, env, url)) : null
  if (laTep) return m === 'GET' || m === 'HEAD' ? bat(() => tepLenh(req, env, url)) : null
  if (m !== 'GET' && m !== 'POST') return null
  return bat(async () => {
    const b = await than(req, url), nay = Date.now()
    if (p.startsWith('/hs/')) return hsLenh(env, p, b, nay)
    if (!laThay(req, env, b)) return json({ ok: false, error: 'Sai mã bí mật' }, 403)
    if (p !== '/gv/live-ds' && m !== 'POST') return json({ ok: false, error: 'Lệnh này cần POST.' }, 405)
    return gvLenh(env, p, b, nay, ctx)
  })
}

/** Cron mỗi phút (lưới đỡ; thường ngày MỘT câu đọc nhẹ): buổi `dang_ghi` ⇒ phòng soát máy thầy còn nối không · `dang_xu_ly` quá 5 phút ⇒ chốt lại ·
 *  `dang_xoa` ⇒ xoá tiếp · buổi xong đã tắt live tròn 24 giờ ⇒ dọn khúc thô + nhật ký của phòng. Bảng chưa có ⇒ thôi. */
export async function cronLiveXemLai(env: Env, nay = Date.now()): Promise<{ soat: number; chot: number; xoa: number; don: number }> {
  const ra = { soat: 0, chot: 0, xoa: 0, don: 0 }
  const gio = (ms: number): string => new Date(ms).toISOString()
  let ds: Row[]
  try {
    ds = (await env.DB.prepare(`SELECT id, trang_thai, cap_nhat FROM live_buoi WHERE trang_thai IN ('dang_ghi', 'dang_xu_ly', 'dang_xoa')
      OR (trang_thai = 'xong' AND tat_luc IS NOT NULL AND tat_luc < ?1 AND tat_luc >= ?2) LIMIT 12`).bind(gio(nay - 24 * 3_600_000), gio(nay - 24 * 3_600_000 - 10 * 60_000)).all<Row>()).results ?? []
  } catch { return ra }
  const canXoa: string[] = []
  for (const r of ds) {
    const id = buoiHop(r.id), tt = str(r.trang_thai), tuoi = nay - Date.parse(str(r.cap_nhat))
    if (!id) continue
    if (tt === 'dang_ghi') { await goiPhong(env, id, '/xl-soat'); ra.soat += 1 }
    else if (tt === 'dang_xu_ly' && tuoi > 5 * 60_000) {
      const kq = await goiPhong(env, id, '/xl-chot'); ra.chot += 1
      // Phòng không còn gì để dựng (chưa từng mở / đã dọn) ⇒ đánh dấu lỗi để khỏi quét mãi.
      if (kq.ok === false && kq.lyDo !== 'dang-live') await env.DB.prepare("UPDATE live_buoi SET trang_thai = 'loi', cap_nhat = ? WHERE id = ? AND trang_thai = 'dang_xu_ly'").bind(gio(nay), id).run().catch(() => undefined)
    } else if (tt === 'dang_xoa' && tuoi > 60_000) canXoa.push(id)
    else if (tt === 'xong') { await goiPhong(env, id, '/xl-don'); ra.don += 1 }
  }
  if (canXoa.length) ra.xoa = (await xoaBuoiDanhDau(env, canXoa)).xoa.length
  return ra
}
/** Lời gọi gọn cho cron mỗi phút của index.ts (tệp ấy không được to thêm): chạy lưới đỡ, ghi nhật ký khi có việc, không ném lỗi. */
export async function cronLive(env: Env): Promise<void> {
  try { const r = await cronLiveXemLai(env, Date.now()); if (r.chot || r.xoa || r.don) console.log('[live-xem-lai] cron', JSON.stringify(r)) } catch (e) { console.error('[live-xem-lai] cron lỗi:', e instanceof Error ? e.message : e) }
}
