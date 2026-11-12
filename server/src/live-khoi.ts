// LIVE THEO KHỐI (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md; hợp đồng src/lib/live-khoi/kieu.ts).
// Lịch live nằm trong MỘT dòng `cau_hinh` (khoá `live_khoi`, JSON ≤ 30 buổi) ⇒ không bảng mới, không migration. Mỗi buổi live của khối dùng chính
// buổi học + phòng Bình Phản Ứng sẵn có: em bấm «Tham gia» ⇒ ghi điểm danh `cach = 'live'` + báo phòng ⇒ em vào phòng như em có mặt (đội, kJ, trả lời).
// Chi phí: thẻ Live máy em = 1 lệnh đọc khoá chính (+1 lệnh đọc khối của em CHỈ khi đang có lịch); thầy bấm = 1 đọc + 1 ghi.
import type { Env } from './kieu'
type Row = Record<string, unknown>
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { gvBuoiHoc } from './buoi-hoc'
import { baoPhongVaoLop } from './phong-binh-phan-ung'
import { baoMayCacEm } from './ngan-hoc-sinh'

export const KHOA_LIVE_KHOI = 'live_khoi'
const TOI_DA_LICH = 30
/** TÀI KHOẢN THỬ của thầy (thầy 12/11: «cho sbd này test mọi lớp»): thấy và vào được live của MỌI khối, kể cả khi hồ sơ không có lớp. */
const SBD_THU = new Set(['12121212'])
/** Phòng chờ / đang live quá 6 giờ không ai đụng ⇒ coi như đã xong (thầy quên bấm kết thúc). */
const HAN_PHONG_MS = 6 * 3_600_000
/** Lịch hẹn quá giờ 30 phút mà thầy chưa mở ⇒ máy em thôi hiện; quá 24 giờ ⇒ gỡ khỏi danh sách. */
const HEN_TRE_MS = 30 * 60_000
const HEN_GO_MS = 24 * 3_600_000
type TrangThai = 'hen' | 'cho' | 'dang' | 'xong'
export interface LichLiveMc { id: string; khoi: 10 | 11 | 12; batDau: number; ten: string; trangThai: TrangThai; buoiId?: string; luc: number }

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
const khoiHop = (v: unknown): 10 | 11 | 12 | null => { const k = Number(v); return k === 10 || k === 11 || k === 12 ? k : null }
/** Khối của em từ `hoc_sinh.lop` («12», «12A1», «Lớp 11 …») — số 10 / 11 / 12 đầu tiên trong chuỗi. */
export const khoiTuLop = (lop: unknown): 10 | 11 | 12 | null => khoiHop(/(?:^|\D)(1[0-2])(?:\D|$)/.exec(str(lop))?.[1])

export function docDsLich(v: unknown): LichLiveMc[] {
  let a: unknown
  try { a = typeof v === 'string' ? JSON.parse(v) : v } catch { return [] }
  if (!Array.isArray(a)) return []
  const ra: LichLiveMc[] = []
  for (const x of a as Row[]) {
    const khoi = khoiHop(x?.khoi), batDau = Number(x?.batDau), tt = str(x?.trangThai) as TrangThai
    if (!x || !str(x.id) || !khoi || !Number.isFinite(batDau) || !['hen', 'cho', 'dang', 'xong'].includes(tt)) continue
    ra.push({ id: str(x.id), khoi, batDau, ten: str(x.ten).slice(0, 60), trangThai: tt, ...(str(x.buoiId) ? { buoiId: str(x.buoiId) } : {}), luc: Number(x.luc) || batDau })
  }
  return ra
}
/** Dọn theo giờ: phòng bỏ quên ⇒ xong; lịch hẹn quá hạn ⇒ gỡ; buổi xong ⇒ gỡ. Giữ thứ tự theo giờ bắt đầu. THUẦN. */
export function donLich(ds: readonly LichLiveMc[], nay: number): LichLiveMc[] {
  return ds
    .filter((x) => x.trangThai !== 'xong')
    .filter((x) => (x.trangThai === 'hen' ? nay - x.batDau < HEN_GO_MS : nay - x.luc < HAN_PHONG_MS))
    .sort((a, b) => a.batDau - b.batDau)
    .slice(0, TOI_DA_LICH)
}
/** Buổi máy em của khối `khoi` được thấy lúc `nay`: phòng đang mở trước, rồi lịch hẹn gần nhất chưa trễ quá 30 phút. `khoi = null` = tài khoản thử (mọi khối). THUẦN. */
export function lichChoEm(ds: readonly LichLiveMc[], khoi: number | null, nay: number): LichLiveMc | null {
  const cua = donLich(ds, nay).filter((x) => khoi === null || x.khoi === khoi)
  return cua.find((x) => x.trangThai === 'dang') ?? cua.find((x) => x.trangThai === 'cho') ?? cua.find((x) => x.trangThai === 'hen' && nay - x.batDau < HEN_TRE_MS) ?? null
}
const raLich = (x: LichLiveMc): Row => ({ id: x.id, khoi: x.khoi, batDau: x.batDau, ten: x.ten, trangThai: x.trangThai, ...(x.buoiId ? { buoiId: x.buoiId } : {}) })

async function doc(env: Env): Promise<LichLiveMc[]> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_LIVE_KHOI).first<Row>().catch(() => null)
  return docDsLich(r?.gia_tri)
}
const ghi = (env: Env, ds: readonly LichLiveMc[], nay: number) =>
  env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(KHOA_LIVE_KHOI, JSON.stringify(ds), new Date(nay).toISOString()).run()
/** Sĩ số + số báo danh từng khối (em chưa khoá). Một lệnh D1. */
async function emTheoKhoi(env: Env): Promise<Record<10 | 11 | 12, string[]>> {
  const ra: Record<10 | 11 | 12, string[]> = { 10: [], 11: [], 12: [] }
  const r = await env.DB.prepare("SELECT sbd, lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'").all<Row>().then((x) => x.results ?? []).catch(() => [] as Row[])
  for (const h of r) { const k = khoiTuLop(h.lop); if (k && str(h.sbd)) ra[k].push(str(h.sbd)) }
  return ra
}
const traDs = (ds: readonly LichLiveMc[], em: Record<10 | 11 | 12, string[]>): Row => ({ ok: true, lich: ds.map(raLich), soEm: { 10: em[10].length, 11: em[11].length, 12: em[12].length } })
const taoId = (nay: number): string => `lk${nay.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`

/** `/gv/bpu/khoi-*` (sau chốt mã bí mật của thầy). */
export async function gvLiveKhoi(env: Env, p: string, b: Row, nay = Date.now()): Promise<Row> {
  const [tho, em] = await Promise.all([doc(env), emTheoKhoi(env)])
  let ds = donLich(tho, nay)
  if (p === '/gv/bpu/khoi-ds') return traDs(ds, em)
  if (p === '/gv/bpu/khoi-hen') {
    const khoi = khoiHop(b.khoi), batDau = Math.round(Number(b.batDau)), ten = str(b.ten).trim().slice(0, 60), id = str(b.id)
    if (!khoi) return { ok: false, error: 'Thầy chọn khối trước.' }
    if (!Number.isFinite(batDau) || batDau <= nay) return { ok: false, error: 'Giờ hẹn phải ở sau bây giờ.' }
    const cu = id ? ds.find((x) => x.id === id) : null
    if (id && (!cu || cu.trangThai !== 'hen')) return { ok: false, error: 'Buổi này không còn sửa được.' }
    if (cu) { cu.khoi = khoi; cu.batDau = batDau; cu.ten = ten; cu.luc = nay }
    else {
      if (ds.length >= TOI_DA_LICH) return { ok: false, error: 'Đã có quá nhiều lịch hẹn. Thầy huỷ bớt lịch cũ.' }
      ds.push({ id: taoId(nay), khoi, batDau, ten, trangThai: 'hen', luc: nay })
    }
    ds = donLich(ds, nay)
    await ghi(env, ds, nay)
    await baoMayCacEm(env, em[khoi], 'live').catch(() => 0)
    return traDs(ds, em)
  }
  if (p === '/gv/bpu/khoi-huy') {
    const x = ds.find((y) => y.id === str(b.id))
    if (!x) return traDs(ds, em)
    if (x.trangThai !== 'hen') return { ok: false, error: 'Phòng đang mở. Thầy bấm Kết thúc live để đóng.' }
    ds = ds.filter((y) => y !== x)
    await ghi(env, ds, nay)
    await baoMayCacEm(env, em[x.khoi], 'live').catch(() => 0)
    return traDs(ds, em)
  }
  if (p === '/gv/bpu/khoi-mo') {
    const id = str(b.id)
    let x = id ? ds.find((y) => y.id === id) ?? null : null
    const khoi = x?.khoi ?? khoiHop(b.khoi)
    if (!khoi) return { ok: false, error: 'Thầy chọn khối trước.' }
    const dangMo = ds.find((y) => (y.trangThai === 'cho' || y.trangThai === 'dang') && y !== x)
    // Một lúc một phòng. Mở lại đúng khối đang mở ⇒ vào lại phòng đó.
    if (dangMo && dangMo.khoi !== khoi) return { ok: false, error: `Đang có phòng live Khối ${dangMo.khoi}. Thầy kết thúc phòng đó trước.` }
    if (dangMo) x = dangMo
    // Khối đang có ca kiểm tra mở ⇒ không mở live (CLAUDE.md «đang có ca thi mở»).
    const ca = await env.DB.prepare("SELECT ma_ca, TRIM(COALESCE(lop, '')) AS lop FROM ca WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi'").all<Row>().then((r) => r.results ?? []).catch(() => [] as Row[])
    const caMo = ca.find((c) => khoiTuLop(c.lop) === khoi)
    if (caMo) return { ok: false, lyDo: 'ca-mo', error: `Khối ${khoi} đang có ca kiểm tra mở (${str(caMo.ma_ca)}). Ca đóng xong thầy mở live.` }
    let ma = ''
    if (!x?.buoiId) {
      const ngay = new Date(nay + 7 * 3_600_000).toISOString().slice(5, 10).split('-').reverse().join('/')
      const ten = (x?.ten || str(b.ten).trim().slice(0, 60)) || `Live Khối ${khoi}`
      const r = await gvBuoiHoc(env, { action: 'mo', lop: '', ten: `${ten} · ${ngay}`.slice(0, 80) }, nay)
      const buoi = (r.buoi ?? null) as Row | null
      if (r.ok !== true || !buoi || !str(buoi.id)) return { ok: false, error: str(r.error) || 'Chưa mở được buổi live. Thầy thử lại.' }
      ma = str(buoi.ma)
      if (x) { x.buoiId = str(buoi.id); x.ten = x.ten || ten }
      else { x = { id: taoId(nay), khoi, batDau: nay, ten, trangThai: 'cho', buoiId: str(buoi.id), luc: nay }; ds.push(x) }
    }
    if (x.trangThai === 'hen') x.trangThai = 'cho'
    x.luc = nay
    ds = donLich(ds, nay)
    await ghi(env, ds, nay)
    await baoMayCacEm(env, em[khoi], 'live').catch(() => 0)
    return { ...traDs(ds, em), lich: raLich(x), buoiId: x.buoiId, ma }
  }
  if (p === '/gv/bpu/khoi-bat-dau' || p === '/gv/bpu/khoi-xong') {
    const x = ds.find((y) => y.id === str(b.id))
    if (!x || x.trangThai === 'hen') return traDs(ds, em)
    x.trangThai = p.endsWith('xong') ? 'xong' : 'dang'
    x.luc = nay
    const khoi = x.khoi
    ds = donLich(ds, nay)
    await ghi(env, ds, nay)
    await baoMayCacEm(env, em[khoi], 'live').catch(() => 0)
    return traDs(ds, em)
  }
  return { ok: false, error: 'Không có lệnh này.' }
}

/** `/hs/bpu/khoi-cua-em` · `/hs/bpu/khoi-vao` (token em). */
export async function hsLiveKhoi(env: Env, p: string, b: Row, nay = Date.now()): Promise<Row> {
  // Đọc lịch (cau_hinh) chạy CÙNG đợt với kiểm mật khẩu (D1) — một đợt chờ thay vì hai; token sai vẫn ném trước, không tốn lượt đọc nào.
  let sbd: string, dsGoc: Promise<LichLiveMc[]>
  try {
    const hb = await gameIdentityHaiBuoc(env, b)
    dsGoc = doc(env); dsGoc.catch(() => 0)
    sbd = await hb.xong
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' } }
  const ds = donLich(await dsGoc, nay)
  if (!ds.length) return p.endsWith('khoi-vao') ? { ok: false, error: 'Thầy chưa mở live.' } : { ok: true, trangThai: 'khong' }
  const h = await env.DB.prepare("SELECT lop, ho_ten FROM hoc_sinh WHERE sbd = ? AND COALESCE(trang_thai, '') <> 'khoa' LIMIT 1").bind(sbd).first<Row>().catch(() => null)
  // Hồ sơ không có lớp ⇒ đọc lớp ở danh sách cổng (em mới chỉ có trong danh sách đăng nhập).
  const thu = SBD_THU.has(sbd)
  const lopCong = h?.lop || thu ? null : await env.DB.prepare('SELECT lop FROM danh_sach WHERE sbd = ? LIMIT 1').bind(sbd).first<Row>().catch(() => null)
  const khoi = khoiTuLop(h?.lop) ?? khoiTuLop(lopCong?.lop), x = thu ? lichChoEm(ds, null, nay) : khoi ? lichChoEm(ds, khoi, nay) : null
  if (p === '/hs/bpu/khoi-cua-em') return x ? { ok: true, trangThai: x.trangThai, khoi: x.khoi, ten: x.ten, batDau: x.batDau } : { ok: true, trangThai: 'khong' }
  if (p === '/hs/bpu/khoi-vao') {
    if (!x || x.trangThai === 'hen' || !x.buoiId) return { ok: false, error: x ? 'Chưa tới giờ. Thầy mở phòng là em vào được.' : 'Không có live cho khối của em.' }
    const gio = new Date(nay).toISOString()
    // Thầy đã bỏ tên em khỏi buổi ⇒ giữ nguyên (không tự thêm lại); còn lại ⇒ có mặt.
    await env.DB.prepare("INSERT INTO buoi_hoc_diem_danh (buoi_id, sbd, luc, cach, trang_thai, cap_nhat_luc) VALUES (?,?,?,'live','co_mat',?) ON CONFLICT(buoi_id, sbd) DO UPDATE SET trang_thai = CASE WHEN buoi_hoc_diem_danh.trang_thai = 'bo' THEN 'bo' ELSE 'co_mat' END, cap_nhat_luc = excluded.cap_nhat_luc")
      .bind(x.buoiId, sbd, gio, gio).run()
    await baoPhongVaoLop(env, x.buoiId, sbd)
    return { ok: true, buoiId: x.buoiId, trangThai: x.trangThai }
  }
  return { ok: false, error: 'Không có lệnh này.' }
}
