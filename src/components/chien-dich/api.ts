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
  /** "Rút còn N câu" (giữ câu cả lớp sai nhiều) — chỉ `tao` áp; gửi kèm `suc-chua` cho máy chủ đời sau. */
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
  hangTheoDang?: Record<string, 'L1' | 'L2' | 'L3' | 'L4'>
}

export interface CauCanDayLai {
  qid: string
  stt: number
  dang: string
  soEm: number
}

export interface BangChienDich {
  chienDich: Omit<ChienDichTom, 'hetHan'>
  homNay: string
  hetHan: boolean
  lop: { coXat: number; thanhThao: number; huyetChien: number; canDayLaiCau: number; canDayLaiLuot: number }
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
/** Danh sách học sinh máy chủ (sbd, họ tên, lớp) cho bộ chọn khối → lớp → em. */
export const docDsEm = () => goiChienDich<{ em: { sbd: string; hoTen: string; lop: string }[] }>('ds-em', {})
export const tinhSucChua = (dv: DauVaoGiao) => goiChienDich<SucChua>('suc-chua', { ...dv })
export const taoChienDich = (dv: DauVaoGiao & { ten: string }) => goiChienDich<{ id: string; soCau: number; soEm: number }>('tao', { ...dv })
export const huyChienDich = (id: string) => goiChienDich<{ ok: true }>('huy', { id })
export const dongChienDich = (id: string) => goiChienDich<{ ok: true }>('dong', { id })
export const docBang = (id: string) => goiChienDich<BangChienDich>('bang', { id })
export const docBuoiChua = (id: string, coMat?: string[]) => goiChienDich<BuoiChuaMayChu>('buoi-chua', coMat && coMat.length ? { id, coMat } : { id })
export const chuaXong = (id: string, qids?: string[]) => goiChienDich<KetQuaChuaXong>('chua-xong', qids && qids.length ? { id, qids } : { id })
