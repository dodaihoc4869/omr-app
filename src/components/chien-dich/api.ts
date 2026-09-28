// GỌI LỆNH `/gv/chien-dich` CỦA MÁY CHỦ (Game Hóa 2.0 — hợp đồng `docs/hop-dong-game-hoa-2.md` mục B).
// Một cửa duy nhất cho mọi màn chiến dịch của app thầy: công tắc, giao chiến dịch (đồng hồ sức chứa), bảng chiến dịch,
// buổi chữa, "Chữa xong". Không ném lỗi — trả `KetQuaLenh` với MỘT câu nói thật (màn hiện đúng câu ấy).
import { goiLenh, type KetQuaLenh } from '../../lib/goi-lenh-thay'

export const DUONG_CHIEN_DICH = '/gv/chien-dich'
const CHU_CHUA_CO_LENH = 'Máy chủ chưa có lệnh Chiến dịch (Game Hóa 2.0) — cần đẩy bản máy chủ mới.'

/** Công tắc Game Hóa 2.0: `bat` + (tuỳ chọn) chỉ áp cho vài lớp / vài em. */
export interface CoHoa2 {
  bat: boolean
  lop: string[]
  sbd: string[]
}

export type TrangThaiChienDich = 'dang_chay' | 'da_dong' | 'da_huy'

export interface ChienDichTom {
  id: string
  ten: string
  lop: string | null
  maDe: string[]
  /** Ngày `YYYY-MM-DD` (giờ Việt Nam); hạn nộp hết lúc 23:59 ngày này. */
  hanNop: string
  theLucNgay: number
  huyetChien: boolean
  maCa: string | null
  taoLuc: string
  trangThai: TrangThaiChienDich
  soCau: number
  soEm: number
  hetHan: boolean
  /** Số liệu lớp (chỉ khi xin `thongKe`; máy chủ cũ / quá 20 chiến dịch mới nhất ⇒ vắng hoặc null). */
  thongKe?: ThongKeChienDich | null
}

/** Số liệu lớp gọn của một chiến dịch — bảng "Chiến dịch đã giao" (bản vẽ GV-ChienDichDaGiao 28/09). */
export interface ThongKeChienDich {
  /** Tỉ lệ (0–1) câu đã làm qua, trung bình lớp. */
  coXat: number
  thanhThao: number
  /** Số em đúng nhịp (kể cả vượt nhịp). */
  dungNhip: number
  /** Số em làm qua đủ mọi câu. */
  emLamQuaDu: number
  /** Số em quá tải hôm nay (phải làm vượt số lượt/ngày để kịp hạn). */
  quaTai: number
  canDayLaiCau: number
  canDayLaiLuot: number
  /** Mức "đã làm qua" lớp cần đạt hết hôm nay (0–1). */
  mucCanHomNay: number
}

export interface DanhSachChienDich {
  homNay: string
  chienDich: ChienDichTom[]
}

export type MucSucChua = 'xanh' | 'vang' | 'do'

export interface SucChua {
  soCau: number
  /** Thể lực/ngày nhỏ nhất bảo đảm mục tiêu (em giữa lớp ≤ 70%, không em nào quá tải) — nút gạt "Tự động". Máy chủ cũ không có. */
  theLucDeXuat?: number
  /** Số câu dùng được MỖI tờ góp vào (đã bỏ trùng, tự luận, chưa duyệt) — cộng lại = soCau. Máy chủ cũ không có. */
  soCauTheoTo?: Record<string, number>
  /** Số câu theo mức độ (Nhận biết / Thông hiểu / Vận dụng…) — cộng lại = soCau. Máy chủ cũ không có. */
  soCauTheoMucDo?: Record<string, number>
  soEm: number
  /** Số ngày còn lại tính cả hôm nay. */
  D: number
  /** D × thể lực/ngày (lượt). */
  sucChua: number
  /** Số lượt em ở giữa lớp cần. */
  khoiLuongTrungVi: number
  /** Lượt của em ở giữa lớp = câu mới × 2 + lượt ôn (null khi không có em đúng bằng trung vị; máy chủ cũ không có). */
  tachGiua?: { cauMoi: number; luotOn: number } | null
  tiLe: number
  muc: MucSucChua
  soEmQuaTai: number
  goiY: { rutCon: { soCau: number; tiLe: number } | null; luiHan: { hanNop: string; tiLe: number } | null } | null
}

/** Đầu vào chung của `suc-chua` và `tao`. */
export interface DauVaoGiao {
  ten?: string
  lop?: string
  sbd?: string[]
  maDe: string[]
  hanNop: string
  theLucNgay?: number
  huyetChien?: boolean
  maCa?: string
  /** Trường cũ của máy chủ (rút bớt số câu) — giao diện KHÔNG còn nút này (thầy 28/09); giữ kiểu để khớp hợp đồng API. */
  rutCon?: number
}

export interface EmBang {
  sbd: string
  ten: string
  /** Số câu đã cọ xát (đã làm ít nhất một lần). */
  coXat: number
  thanhThao: number
  canDayLai: number
  /** Số ngày liền chưa làm câu nào; `null` = chưa làm câu nào của chiến dịch. */
  treNhip: number | null
  huyetChien: boolean
  /** Tỉ lệ câu thành thạo theo dạng (0–1); `null` = dạng không có câu. */
  theoDang: Record<string, number | null>
  /** Sức học của em theo dạng (máy dùng để bốc câu mới): L1 Yếu · L2 Trung bình · L3 Khá · L4 Giỏi. Máy chủ cũ không gửi ⇒ vắng. */
  hangTheoDang?: Record<string, HangEm>
  /** Tỉ lệ câu ĐÃ LÀM QUA theo dạng (0 ⇒ ô "Chưa làm"). Máy chủ cũ không gửi. */
  daLamTheoDang?: Record<string, number | null>
  /** Nhịp của em hôm nay. Máy chủ cũ không gửi. */
  nhip?: NhipEm
  /** Số ngày liền không làm câu nào (chưa làm ⇒ tính từ ngày giao). */
  soNgayTre?: number
}

export type HangEm = 'L1' | 'L2' | 'L3' | 'L4'
export type NhipEm = 'vuot' | 'dung' | 'tre12' | 'tre3'

export interface CauCanDayLai {
  qid: string
  stt: number
  dang: string
  soEm: number
  mucDo?: string | null
}

export interface BangChienDich {
  chienDich: Omit<ChienDichTom, 'hetHan'>
  homNay: string
  hetHan: boolean
  lop: {
    coXat: number
    thanhThao: number
    /** Số em quá tải hôm nay (tên cũ phía máy chủ: Huyết Chiến). */
    huyetChien: number
    canDayLaiCau: number
    canDayLaiLuot: number
    // ---- chỉ-thêm 28/09 (máy chủ cũ không gửi) ----
    homQua?: { coXat: number; thanhThao: number }
    nhip?: Record<NhipEm, number>
    dungNhip?: number
    mucCanHomNay?: number
    ngayThu?: number
    tongNgay?: number
    theoDang?: Record<string, number | null>
    hangTheoDang?: Record<string, HangEm>
  }
  dang: string[]
  em: EmBang[]
  canDayLai: CauCanDayLai[]
}

export interface EmTen {
  sbd: string
  ten: string
}

export interface CauBuoiChua {
  qid: string
  stt: number
  dang: string
  phan: 'I' | 'II' | 'III'
  mucDo: string | null
  soChuaThanhThao: number
  soCanDayLai: number
  diemChua: number
  giaiMau: EmTen | null
  emSua: EmTen[]
}

export interface BuoiChuaMayChu {
  chienDich: { id: string; ten: string; hanNop: string; lop: string | null }
  hetHan: boolean
  soEm: number
  lop: { coXat: number; thanhThao: number }
  cau: CauBuoiChua[]
}

export interface KetQuaChuaXong {
  soLuot: number
  ngayOnLai: string
}

/** Gọi một `action` của `/gv/chien-dich`. */
export async function goiChienDich<T>(action: string, body: Record<string, unknown> = {}): Promise<KetQuaLenh<T>> {
  const r = await goiLenh(DUONG_CHIEN_DICH, { ...body, action }, CHU_CHUA_CO_LENH)
  if (!r.ok) return r
  return { ok: true, du: r.du as unknown as T }
}

export const docCo = async (): Promise<KetQuaLenh<CoHoa2>> => {
  const r = await goiChienDich<{ co?: Partial<CoHoa2> }>('co-doc')
  if (!r.ok) return r
  const co = r.du.co ?? {}
  return { ok: true, du: { bat: co.bat === true, lop: Array.isArray(co.lop) ? co.lop.map(String) : [], sbd: Array.isArray(co.sbd) ? co.sbd.map(String) : [] } }
}
export const luuCo = async (co: CoHoa2): Promise<KetQuaLenh<CoHoa2>> => {
  const r = await goiChienDich<{ co?: CoHoa2 }>('co-luu', { bat: co.bat, lop: co.lop, sbd: co.sbd })
  if (!r.ok) return r
  return { ok: true, du: r.du.co ?? co }
}
export const danhSach = () => goiChienDich<DanhSachChienDich>('danh-sach')
/** Danh sách kèm số liệu lớp từng chiến dịch (bảng Chiến dịch đã giao). */
export const danhSachThongKe = () => goiChienDich<DanhSachChienDich>('danh-sach', { thongKe: true })
/** Danh sách học sinh máy chủ (sbd, họ tên, lớp) cho bộ chọn khối → lớp → em. */
export const docDsEm = () => goiChienDich<{ em: { sbd: string; hoTen: string; lop: string; khoi?: string; tenLop?: string }[] }>('ds-em', {})
export const tinhSucChua = (dv: DauVaoGiao) => goiChienDich<SucChua>('suc-chua', { ...dv })
export const taoChienDich = (dv: DauVaoGiao & { ten: string }) => goiChienDich<{ id: string; soCau: number; soEm: number }>('tao', { ...dv })
export const huyChienDich = (id: string) => goiChienDich<{ ok: true }>('huy', { id })
export const dongChienDich = (id: string) => goiChienDich<{ ok: true }>('dong', { id })
export const docBang = (id: string) => goiChienDich<BangChienDich>('bang', { id })
export const docBuoiChua = (id: string, coMat?: string[]) => goiChienDich<BuoiChuaMayChu>('buoi-chua', coMat && coMat.length ? { id, coMat } : { id })
export const chuaXong = (id: string, qids?: string[]) => goiChienDich<KetQuaChuaXong>('chua-xong', qids && qids.length ? { id, qids } : { id })

// ---------------------------------------------------------------- SỬA CHIẾN DỊCH ĐANG MỞ (thầy 28/09, máy chủ `srs2-sua.ts`)
export const DUONG_SUA_CHIEN_DICH = '/gv/chien-dich/sua'

export interface ChienDichDeSua {
  id: string
  ten: string
  lop: string | null
  maDe: string[]
  sbd: string[]
  hanNop: string
  /** Số câu/ngày (một em) hiện tại. */
  theLucNgay: number
  trangThai: TrangThaiChienDich
  soCau: number
  soEm: number
  hetHan: boolean
}
export interface DongNhatKySua {
  luc: string
  ai: string
  tomTat: string
}
/** Đầu vào sửa: chỉ gửi phần thay đổi. */
export interface ThayDoiGui {
  themMaDe?: string[]
  themSbd?: string[]
  botSbd?: string[]
  hanNop?: string
  /** Thầy nhập tay số câu/ngày (vắng = máy tự nâng khi cần, không tự hạ). */
  theLucNgay?: number
}
/** Kết quả `xem-truoc` / `luu` (máy chủ tính, cùng một hàm). */
export interface KetQuaSua {
  tomTat: string
  themMaDe: string[]
  /** Tờ thầy chọn mà không góp câu mới (trùng câu đã có, tự luận, chưa duyệt). */
  toKhongCoCauMoi: string[]
  soCauTheoTo: Record<string, number>
  soCauCu: number
  soCauThem: number
  soCauSau: number
  themSbd: string[]
  botSbd: string[]
  soEmSau: number
  hanCu: string
  hanNop: string
  /** Chiến dịch đã hết hạn / đã kết thúc được mở lại. */
  moLai: boolean
  /** Số câu/ngày cũ → sau khi lưu; mức cần để em nhiều câu chưa làm nhất kịp hạn. Máy chủ cũ không gửi. */
  theLucCu?: number
  theLucNgay?: number
  theLucCan?: number
  tuNang?: boolean
  chuaKipHan?: boolean
}

async function goiSua<T>(action: string, body: Record<string, unknown>): Promise<KetQuaLenh<T>> {
  const r = await goiLenh(DUONG_SUA_CHIEN_DICH, { ...body, action }, 'Máy chủ chưa có lệnh Sửa chiến dịch — cần đẩy bản máy chủ mới.')
  if (!r.ok) return r
  return { ok: true, du: r.du as unknown as T }
}
export const docChienDichDeSua = (id: string) => goiSua<{ homNay: string; chienDich: ChienDichDeSua; nhatKy: DongNhatKySua[] }>('doc', { id })
export const xemTruocSua = (id: string, t: ThayDoiGui) => goiSua<KetQuaSua>('xem-truoc', { id, ...t })
export const luuSuaChienDich = (id: string, t: ThayDoiGui) => goiSua<KetQuaSua & { id: string }>('luu', { id, ...t })
