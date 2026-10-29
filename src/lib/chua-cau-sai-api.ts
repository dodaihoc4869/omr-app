// CLIENT API — vòng chữa câu sai (đặc tả §10, 07/10/2026).
// Pattern: POST với token trong body (y hệt tu-luyen/api.ts).
// BẢO MẬT: không nhận/trả đáp án, không nhận sbd từ client.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import type { HinhAnh } from '../data/examContent'

// ---------------------------------------------------------------------------
// Kiểu công khai (mirror server/src/chua-cau-sai-kieu.ts phần public)
// ---------------------------------------------------------------------------
export type TrangThaiChua =
  | 'can_chan_doan'
  | 'dang_chua_buoc'
  | 'dang_ghep_bai'
  | 'cho_gap_lai_2'
  | 'dang_kiem_chung'
  | 'da_tu_sua'
  | 'can_thay'
  | 'thieu_hoc_lieu'
  | 'tam_khoa'
  | 'cau_thay_doi'

export type KieuItem = 'so' | 'chon' | 'ds' | 'chon_ly_do' | 'tu_nhap'

export interface LuaChonItem {
  ky: string
  noi: string
}

export interface ItemCongKhai {
  id: string
  loai: string
  buocSo?: number
  tieuDe: string
  kieu: KieuItem
  hoi: string
  luaChon: LuaChonItem[] | null
  mucHoTro?: number
  donVi?: string
  bang?: string[][]
  y?: string[]
  hinhAnh?: HinhAnh[]
}

export interface TienDoChua {
  soBuocDaQua: number
  soBuocCanKiem: number
}

export interface KetQuaDot {
  ok: boolean
  dotId?: string
  /** Lệnh mở đợt báo «chưa có lỗi đang mở»: máy chủ có đóng đợt vì sổ học đã đóng lỗi không (không đóng = sổ chưa thấy lần sai nào). */
  daDong?: boolean
  trangThai?: TrangThaiChua
  lyDoThieu?: string
  coHocLieu?: boolean
  phienId?: string
  revision?: number
  traLoiDaNop?: string
  loiThay?: string
  canNghi?: boolean
  cauGoc?: {
    phan: string
    text: string
    table?: string[][]
    choices?: string[]
    ideas?: string[]
    thanCauImg?: string
    imageDataUrl?: string
    choiceImgs?: (string | undefined)[]
    ideaImgs?: (string | undefined)[]
    hinhAnh?: HinhAnh[]
  } | null
  tienDoChiTiet?: { buocId: string; tieuDe: string; trangThai: string }[]
  phanHoiTruoc?: KetQuaNop | null
  item?: ItemCongKhai
  tienDo?: TienDoChua
  lanGapLai?: number
  denHan?: string
  ma?: string
  loi?: string
}

export interface KetQuaNop {
  dieuCanHieu?: {
    mucTieu: string
    yNghiaDaiLuong: string
    viSaoCanBuoc: string
    dieuKienApDung: string
    noiVoiBuocSau: string
  }
  ok: boolean
  dung?: boolean
  idempotent?: boolean
  hanhDongTiep?: string
  phanGiuDuoc?: string
  diemlech?: string
  giaThiet?: string
  trangThaiMoi?: TrangThaiChua
  /** Hẹn lần gặp lại 2 (ISO) khi đợt vừa chuyển sang chờ bản mới. */
  denHan?: string
  ma?: string
  loi?: string
}

export interface KetQuaGoiY {
  ok: boolean
  mucHoTro?: number
  noiDungGoiY?: string | null
  dacBiet?: string
  ma?: string
  loi?: string
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
type Obj = Record<string, unknown>

const LOI_MANG = 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.'
const chu = (v: unknown) => (typeof v === 'string' ? v : String(v ?? ''))

async function goi(
  lenh: string,
  token: string,
  du: Obj = {},
): Promise<Obj | null> {
  const dk = new AbortController()
  const t = setTimeout(() => dk.abort(), 20_000)
  try {
    const goc = await layDiaChiMayChu()
    if (!goc) return null
    const r = await fetch(`${goc}/hs/chua-cau-sai/${lenh}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...du, token }),
      signal: dk.signal,
    })
    return (await r.json()) as Obj
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

const loiCua = (j: Obj | null): string =>
  j
    ? chu(j.mo ?? j.error ?? 'Máy chủ chưa trả lời được. Em thử lại.')
    : LOI_MANG

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Mở/lấy đợt lỗi theo qid câu sai đã nộp. `phat` (13/10 — thầy: "chỗ này mở câu quá lâu"): xin máy chủ phát luôn bước đầu trong CÙNG lượt ⇒ kết
 *  quả nằm ở `phat` (màn đọc bằng `docPhatKem` trong ManChuaCauSai); máy chủ bản cũ không trả `phat` ⇒ nơi gọi tự gọi `apiPhatItem` như trước.
 *  Mặc định bật khi mở từ màn Sửa từng bước (không `nguonSai`); lượt ghi nhận lỗi từ nơi khác (`nguonSai`) không cần bước đầu. */
export async function apiMoDot(
  token: string,
  qid: string,
  nguonSai?: string,
  phat = nguonSai === undefined,
  /** 27/10 tốc độ: máy chủ mở luôn bản làm lại (gon-mo) trong CÙNG lượt, trả ở `gon`. Máy chủ cũ bỏ qua cờ ⇒ `gon` vắng, nơi gọi gọi gon-mo như trước. */
  gon = false,
): Promise<KetQuaDot & { phat?: unknown; gon?: KetQuaGon }> {
  const j = await goi('mo-dot', token, {
    qid,
    ...(nguonSai ? { nguonSai } : {}),
    ...(phat ? { phat: true } : {}),
    ...(gon ? { gon: true } : {}),
  })
  // 24/10: «chưa có lỗi đang mở» kèm mã đợt = sổ học đã đóng lỗi (máy chủ đã đóng đợt) ⇒ màn chữa tính xong phần thay vì dừng ở lỗi.
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma), ...(j?.dotId ? { dotId: chu(j.dotId), daDong: j.daDong === true } : {}) }
  const g = j.gon && typeof j.gon === 'object' ? docGon(j.gon as Obj) : undefined
  return { ...(j as unknown as KetQuaDot & { phat?: unknown }), ...(g ? { gon: g } : {}) }
}

/** Lấy item hiện tại (hoặc tạo mới) cho đợt. */
export async function apiPhatItem(
  token: string,
  dotId: string,
  tiep = false,
  tiepDoan = false,
): Promise<KetQuaDot> {
  const j = await goi('phat-item', token, { dotId, tiep, tiepDoan })
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma) }
  return j as unknown as KetQuaDot
}

/** Nộp đáp án item (idempotent theo attemptId). */
export async function apiNopItem(
  token: string,
  dotId: string,
  itemId: string,
  traLoi: string,
  attemptId: string,
  giay = 0,
): Promise<KetQuaNop> {
  const j = await goi('nop-item', token, {
    dotId,
    itemId,
    traLoi,
    attemptId,
    giay,
  })
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma) }
  return j as unknown as KetQuaNop
}

/** Xin gợi ý — tăng mức hỗ trợ cho item hiện tại. */
export async function apiXinGoiY(
  token: string,
  dotId: string,
  itemId: string,
  mucHoTro = 1,
): Promise<KetQuaGoiY> {
  const j = await goi('xin-goi-y', token, { dotId, itemId, mucHoTro })
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma) }
  return j as unknown as KetQuaGoiY
}

const demCo = new Map<string, { den: number; p: Promise<boolean> }>()
export function apiCoChua(token: string): Promise<boolean> {
  const hit = demCo.get(token)
  if (hit && hit.den > Date.now()) return hit.p
  const p = goi('co', token).then((j) => j?.ok === true)
  if (demCo.size > 5) demCo.clear()
  demCo.set(token, { den: Date.now() + 15000, p })
  return p
}
export async function apiDanhSachChua(
  token: string,
): Promise<{ qid: string; trangThai: string; denHan?: string }[]> {
  const j = await goi('danh-sach', token)
  return j?.ok && Array.isArray(j.ds)
    ? (j.ds as { qid: string; trangThai: string; denHan?: string }[])
    : []
}

// ---------------------------------------------------------------------------
// Danh sách "Tự chữa lỗi" (12/10): phân biệt BA kết cục để màn nói thật — vòng chữa chưa mở cho em · lỗi mạng/máy chủ (có Thử lại) ·
// danh sách (có thể rỗng). `apiDanhSachChua` ở trên trả [] cho mọi lỗi nên màn không biết là "không có câu" hay "chưa tải được".
// ---------------------------------------------------------------------------
export interface MucChua {
  dotId?: string
  qid: string
  trangThai: string
  denHan?: string
  lanGapLai?: number
  /** Đã có lần tự kiểm sau Hỏi thầy; mở kiểm lại trực tiếp, không cần hỏi AI lại. */
  kiemHoiThay?: boolean
  /** Lần sai cuối của đợt (ms) — Việc hôm nay xếp câu sai TRƯỚC hôm nay lên đầu (chữa câu gọn 25/10). */
  saiLuc?: number
}
/** `xongHomNay`: số câu ĐÃ TỰ SỬA hôm nay (giờ VN), máy chủ đếm (chữa câu gọn 25/10). */
export interface DemDanhSachChua { tong: number; can: number; cho: number; xong: number; xongHomNay?: number }
export interface MocDanhSachChua { hang: number; giaoLuc: number; dotId: string; nay: string }
export interface LichKiemLaiHoiThay { qid: string; ten: string; phan: string; trangThai: 'dang_lam' | 'den_han' | 'cho_kiem_lai'; denHan?: string }
/** Việc hôm nay của Tự sửa lỗi máy chủ đang giữ (28/10, server/src/tu-sua-viec-ngay.ts): ngày VN · mục đã chọn · khoá câu đã xong phần · số chặng thêm. */
export interface MucViecNgay { q: string; d?: string; t: string; h?: string; l: 'gan' | 'dang' | 'moi' | 'goc' }
/** `mt` = số câu mục tiêu của phần ngày khi máy chủ lập hơn 12 câu (Sửa lỗi 12–36 câu/ngày, 29/10); vắng = 12. */
export interface ViecNgayMayChu { n: string; m: MucViecNgay[]; x: string[]; them: number; mt?: number }
/** Kế hoạch ngày máy chủ lập (29/10): số câu mục tiêu `n` (12…36) + câu bổ sung theo thứ tự chọn (đủ dạng, đủ mức). Chỉ có khi việc hôm nay chưa lập / còn thiếu. */
export interface KeSuaNgay { n: number; ung: MucViecNgay[] }
export type KetQuaDanhSachChua =
  | { trangThai: 'bat'; ds: MucChua[]; dem?: DemDanhSachChua; sau?: MocDanhSachChua; kiemLaiHoiThay?: LichKiemLaiHoiThay[]; viecNgay?: ViecNgayMayChu; ke?: KeSuaNgay }
  | { trangThai: 'tat' }
  | { trangThai: 'loi'; loi: string }
/** Máy em có cần máy chủ lập kế hoạch ngày (Sửa lỗi 12–36 câu) không: chưa có việc hôm nay, hoặc có mà chưa nhớ mục tiêu `mt` và chưa làm câu nào / thêm chặng.
 *  Đọc thẳng nhật ký trên máy (khoá viết thẳng như tu-sua-viec-hom-nay.ts — mảnh ấy nạp lười). Lỗi đọc ⇒ xin (không hại: máy chủ chỉ trả `ke` khi cần). */
function canXinKe(): boolean {
  try {
    const sbd = (JSON.parse(localStorage.getItem('omr_student_portal_auth') || 'null') as { sbd?: unknown } | null)?.sbd
    if (typeof sbd !== 'string' || !sbd.trim()) return false
    const nk = JSON.parse(localStorage.getItem(`omr_tu_sua_hom_nay_${sbd.trim()}`) || 'null') as { n?: unknown; m?: unknown; x?: unknown; them?: unknown; mt?: unknown } | null
    const homNay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
    if (!nk || nk.n !== homNay || !Array.isArray(nk.m) || nk.m.length === 0) return true
    return !(Number(nk.mt) >= 12) && Array.isArray(nk.x) && nk.x.length === 0 && !(Number(nk.them) > 0)
  } catch { return true }
}
export async function apiDanhSachTuChua(token: string, sau?: MocDanhSachChua): Promise<KetQuaDanhSachChua> {
  // 29/10: BỎ lượt hỏi cờ `co` đi TRƯỚC (một vòng đi-về + một lượt xác thực/đọc cờ máy chủ chỉ để biết vòng chữa bật hay tắt): chính `danh-sach` kiểm cờ ngay đầu lệnh
  // (`quyen`) và trả FEATURE_TAT khi tắt — em tắt vẫn chỉ tốn một lượt nhẹ, em bật nhanh hơn một vòng đi-về (số «Sửa lỗi» trên Lộ trình, thẻ Hôm nay, màn Tự sửa lỗi).
  const j = await goi('danh-sach', token, sau ? { sau } : canXinKe() ? { ke: 1 } : {})
  if (!j) return { trangThai: 'loi', loi: LOI_MANG }
  if (j.ma === 'FEATURE_TAT') return { trangThai: 'tat' }
  if (!j?.ok || !Array.isArray(j.ds)) return { trangThai: 'loi', loi: loiCua(j) }
  const ds = (j.ds as Obj[])
    .filter((x) => !!x && typeof x.qid === 'string' && !!x.qid)
    .map((x) => ({
      ...(typeof x.dotId === 'string' ? { dotId: x.dotId } : {}),
      qid: chu(x.qid),
      trangThai: chu(x.trangThai),
      ...(typeof x.denHan === 'string' && x.denHan ? { denHan: x.denHan } : {}),
      ...(typeof x.lanGapLai === 'number' ? { lanGapLai: x.lanGapLai } : {}),
      ...(typeof x.kiemHoiThay === 'boolean' || typeof x.kiemHoiThay === 'number' ? { kiemHoiThay: x.kiemHoiThay === true || x.kiemHoiThay === 1 } : {}),
      ...(Number.isSafeInteger(x.saiLuc) && Number(x.saiLuc) > 0 ? { saiLuc: Number(x.saiLuc) } : {}),
    }))
  const dem = j.dem && typeof j.dem === 'object' ? j.dem as Obj : null
  const moc = j.sau && typeof j.sau === 'object' ? j.sau as Obj : null
  const demDung = dem && ['tong', 'can', 'cho', 'xong'].every((k) => Number.isSafeInteger(dem[k]) && Number(dem[k]) >= 0)
    && Number(dem.can) + Number(dem.cho) + Number(dem.xong) === dem.tong
  const lich = new Map<string, LichKiemLaiHoiThay>()
  if (Array.isArray(j.kiemLaiHoiThay)) for (const x of j.kiemLaiHoiThay.slice(0, 12) as Obj[]) {
    if (!x || typeof x.qid !== 'string' || !x.qid) continue
    lich.set(x.qid, { qid: x.qid, ten: chu(x.ten), phan: chu(x.phan),
      trangThai: x.trangThai === 'dang_lam' || x.trangThai === 'den_han' ? x.trangThai : 'cho_kiem_lai',
      ...(typeof x.denHan === 'string' ? { denHan: x.denHan } : {}),
    })
  }
  const vn = docViecNgay(j.viecNgay)
  const ke = docKeSuaNgay(j.ke)
  return { trangThai: 'bat', ds,
    ...(vn ? { viecNgay: vn } : {}),
    ...(ke ? { ke } : {}),
    ...(Array.isArray(j.kiemLaiHoiThay) ? { kiemLaiHoiThay: [...lich.values()] } : {}),
    ...(demDung ? { dem: { tong: Number(dem.tong), can: Number(dem.can), cho: Number(dem.cho), xong: Number(dem.xong),
      ...(Number.isSafeInteger(dem.xongHomNay) && Number(dem.xongHomNay) >= 0 ? { xongHomNay: Number(dem.xongHomNay) } : {}) } } : {}),
    ...(moc && [0, 1, 2].includes(Number(moc.hang)) && Number.isSafeInteger(moc.giaoLuc) && typeof moc.dotId === 'string' && typeof moc.nay === 'string'
      ? { sau: { hang: Number(moc.hang), giaoLuc: Number(moc.giaoLuc), dotId: moc.dotId, nay: moc.nay } } : {}),
  }
}

const LOAI_VIEC = new Set(['gan', 'dang', 'moi', 'goc'])
const docMuc = (a: unknown): MucViecNgay[] => (Array.isArray(a) ? a as Obj[] : []).filter((x) => !!x && typeof x.q === 'string' && !!x.q && typeof x.t === 'string' && LOAI_VIEC.has(chu(x.l)))
  .map((x): MucViecNgay => ({ q: chu(x.q), ...(typeof x.d === 'string' && x.d ? { d: x.d } : {}), t: chu(x.t), ...(typeof x.h === 'string' && x.h ? { h: x.h } : {}), l: chu(x.l) as MucViecNgay['l'] }))
/** Số câu mục tiêu hợp lệ (12…36) hoặc 0. */
const docMucTieu = (v: unknown): number => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 12 ? Math.min(36, n) : 0 }
/** Đọc `viecNgay` của máy chủ; hỏng / vắng ⇒ null (máy em dùng bản đệm trên máy). */
export function docViecNgay(v: unknown): ViecNgayMayChu | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Obj
  if (typeof o.n !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.n)) return null
  const x = (Array.isArray(o.x) ? o.x : []).filter((k): k is string => typeof k === 'string' && !!k)
  const mt = docMucTieu(o.mt)
  return { n: o.n, m: docMuc(o.m), x, them: Math.max(0, Math.floor(Number(o.them) || 0)), ...(mt ? { mt } : {}) }
}
/** Đọc `ke` (kế hoạch ngày) của máy chủ; hỏng / vắng ⇒ null (máy em chọn 12 câu như cũ). */
export function docKeSuaNgay(v: unknown): KeSuaNgay | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Obj
  const n = Math.floor(Number(o.n))
  return Number.isFinite(n) && n >= 12 ? { n: Math.min(36, n), ung: docMuc(o.ung).slice(0, 36) } : null
}
/** Gửi NỀN việc hôm nay lên máy chủ (đổi máy vẫn cùng 12 câu). Lỗi ⇒ bỏ qua (bản đệm trên máy vẫn đúng). */
export async function apiGhiViecNgay(token: string, v: ViecNgayMayChu, khoa = false): Promise<boolean> {
  // `khoa` (28/10): Lộ trình đang khoá các chặng sau nút Tự sửa lỗi ⇒ máy chủ ghi một dòng / ngày để chặn mở chặng bằng lối khác (TU_SUA_TRUOC)
  const j = await goi('viec-ngay', token, { ngay: v.n, m: v.m, x: v.x, them: v.them, ...(v.mt ? { mt: v.mt } : {}), ...(khoa ? { khoa: true } : {}) })
  return j?.ok === true
}

// ---------------------------------------------------------------------------
// CHỮA CÂU GỌN (thầy 25/10, server/src/chua-gon-lenh.ts): mở bản làm lại (KHÔNG đáp án) · nộp (máy chủ chấm). Đáp án + lời giải chỉ về SAU khi nộp.
// ---------------------------------------------------------------------------
export type KetGon = 'tu_sua' | 'xong_phan' | 'goi_y' | 'loi_giai'
export interface DeGon {
  qid: string; phan: 'I' | 'II' | 'III'; text: string; choices?: string[]; ideas?: string[]; table?: string[][]
  thanCauImg?: string; imageDataUrl?: string; choiceImgs?: (string | undefined)[]; ideaImgs?: (string | undefined)[]
  hinhAnh?: { src: string; viTri: string; alt?: string }[]; tenDang?: string; soO?: number
}
export interface KetQuaGon {
  ok: boolean
  ma?: string
  loi?: string
  dotId?: string
  /** Đợt đã tự sửa (mở lại câu đã xong). */
  trangThai?: string
  lan?: number
  ban?: string
  banKhac?: boolean
  /** Đúng ở lần này có tính "Đã tự sửa" không (luật tự làm). */
  tuSuaNeuDung?: boolean
  de?: DeGon
  dung?: boolean
  ket?: KetGon
  lyDo?: 'co_goi_y' | 'doc_loi_giai' | 'cung_ngay'
  goiY?: string
  /** Đề đầy đủ + đáp án + lời giải — chỉ có sau khi nộp (đúng, hoặc đã hết lần thử). Đọc bằng `docChiTiet`. */
  chiTiet?: unknown
  daKhepHomNay?: boolean
  /** (28/10) nguyên tử vừa cộng vì câu ra khỏi hàng (+2; vắng khi không cộng — trần ngày, câu đã đúng hôm nay, EXP chưa bật). */
  nguyenTu?: number
}
const docGon = (j: Obj | null): KetQuaGon => (j?.ok ? (j as unknown as KetQuaGon) : { ok: false, loi: loiCua(j), ...(j?.ma ? { ma: chu(j.ma) } : {}) })
/** `qid` (29/10): mã câu GỐC của đợt — gợi ý để máy chủ nạp sẵn câu song song với việc đọc đợt (câu nguội mất 4–6 đợt D1 nối tiếp). Máy chủ vẫn kiểm đợt thuộc về em và khớp mã câu. */
export async function apiGonMo(token: string, dotId: string, qid?: string): Promise<KetQuaGon> {
  return docGon(await goi('gon-mo', token, { dotId, ...(qid ? { qid } : {}) }))
}
export async function apiGonNop(token: string, dotId: string, ban: string, traLoi: string, khoa: string, qid?: string): Promise<KetQuaGon> {
  return docGon(await goi('gon-nop', token, { dotId, ban, traLoi, khoa, ...(qid ? { qid } : {}) }))
}
