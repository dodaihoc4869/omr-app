// BÀI HÔM NAY (OMNI 3 · tick bài đã dạy — DAC-TA-BUILD-OMNI-3-0510.md mục 1 bước 1, prompt-tick-bai-tu-giao.md mục A) — phần THUẦN của bước
// "Bài hôm nay" trong bảng Dạy học: lấy danh sách bài của MỘT khối từ cây DẠY HỌC (`dungCay` trên `locDeDayHoc` — thứ tự cây = thứ tự SGK),
// khoá bài ổn định, tờ vào bài luyện (mặc định bỏ "Ví dụ minh hoạ"), phạm vi = mọi bài đứng TRƯỚC, chữ trạng thái từng bài.
// Không IO, không đọc đồng hồ (nơi gọi đưa `homNay`). Có test (`tests/omni-3-thay-bai-hom-nay.test.tsx`).
import { tongCau, type Nut } from './cay-chon-de'
import { goMaDeTachRa } from './tach-phan-de'

export const NHAN_VI_DU = 'Ví dụ minh hoạ'
/** Nhắc thầy từ ngày chờ thứ 3 (prompt tick bài mục D3): "Lớp 12A1: 3 ngày chưa có bài mới". */
export const NGAY_NHAC_CHO_BAI_MOI = 3

/** Một tờ của bài (lá tầng "dang" của cây). */
export interface ToBai {
  maDe: string
  nhan: string
  soCau: number
  laViDu: boolean
}
/** Một bài trong cây DẠY HỌC của khối. */
export interface BaiCay {
  /** Khoá ổn định gửi máy chủ: mã gốc chung của các tờ (vd `DH-12-C1-B1`); không có mã chung ⇒ đường dẫn nút trong cây. */
  khoaBai: string
  tenBai: string
  /** Vị trí trong khối (1, 2, 3…) theo thứ tự cây. */
  viTri: number
  chuong: string
  soCau: number
  to: ToBai[]
}

const laTenViDu = (n: Pick<Nut, 'nhan' | 'maDe'>) => n.nhan === NHAN_VI_DU || /-(?:VD|VDMH)$/i.test(goMaDeTachRa(n.maDe ?? '').goc)

/** Mã gốc của bài: bỏ hậu tố phần (-TN/-DS/-TLN), mục đặc biệt (-VD/-VDMH/-DT/-DTTT) và đuôi cắt bài lớn (-D1, -D2). */
export function maGocBai(maDe: string): string {
  return goMaDeTachRa(maDe.trim()).goc.replace(/-(?:VD|VDMH|DT|DTTT)$/i, '').replace(/-D\d+$/i, '')
}

/** Khoá bài: mọi tờ chung MỘT mã gốc ⇒ mã ấy; lệch nhau (kho đặt mã lạ) ⇒ khoá nút trong cây (vẫn ổn định khi kho không đổi tên). */
export function khoaBaiCua(nut: Pick<Nut, 'khoa' | 'laMa'>): string {
  const goc = new Set(nut.laMa.map(maGocBai).filter(Boolean))
  return goc.size === 1 ? [...goc][0]! : nut.khoa
}

/** Khối "10" | "11" | "12" của một tên lớp ("12A1", "12 - Tinh Hoa"); không rõ ⇒ ''. */
export function khoiCuaTenLop(lop: string): string {
  const m = lop.trim().match(/^(10|11|12)(?!\d)/)
  return m ? m[1]! : ''
}

/** Tìm nút KHỐI trong cây (thư mục DẠY HỌC ▸ khối, hoặc khối đứng ngoài cùng). */
function timKhoi(cay: readonly Nut[], khoi: string): Nut | null {
  for (const n of cay) {
    if (n.tang === 'khoi' && (n.nhan === `Khối ${khoi}` || n.khoa === khoi || n.khoa.endsWith(`/${khoi}`))) return n
    if (n.tang === 'thumuc') {
      const k = timKhoi(n.con, khoi)
      if (k) return k
    }
  }
  return null
}

/** Danh sách bài của một khối, đúng thứ tự cây (chương → bài). Khối không có trong cây ⇒ []. */
export function dsBaiCuaKhoi(cay: readonly Nut[], khoi: string): BaiCay[] {
  const nutKhoi = khoi ? timKhoi(cay, khoi) : null
  if (!nutKhoi) return []
  const ra: BaiCay[] = []
  for (const chuong of nutKhoi.con) {
    const dsBai = chuong.tang === 'bai' ? [chuong] : chuong.con.filter((b) => b.tang === 'bai')
    for (const bai of dsBai) {
      const to: ToBai[] = bai.con
        .filter((l) => !!l.maDe)
        .map((l) => ({ maDe: l.maDe!, nhan: l.nhan, soCau: tongCau(l.soCau), laViDu: laTenViDu(l) }))
      ra.push({ khoaBai: khoaBaiCua(bai), tenBai: bai.nhan, viTri: ra.length + 1, chuong: chuong.tang === 'bai' ? '' : chuong.nhan, soCau: tongCau(bai.soCau), to })
    }
  }
  return ra
}

/** Tờ vào bài luyện mặc định: mọi tờ trừ "Ví dụ minh hoạ" (thầy tích thêm được). */
export function maDeMacDinh(bai: Pick<BaiCay, 'to'>): string[] {
  return bai.to.filter((t) => !t.laViDu).map((t) => t.maDe)
}

/** Phạm vi đã dạy gửi kèm `tick`: mọi bài đứng TRƯỚC bài này trong cây cùng khối, kèm tờ của chúng (bỏ "Ví dụ minh hoạ" như bài luyện). */
export function phamViTruoc(dsBai: readonly BaiCay[], viTri: number): { khoaBai: string; tenBai: string; viTri: number; maDe: string[] }[] {
  return dsBai.filter((b) => b.viTri < viTri).map((b) => ({ khoaBai: b.khoaBai, tenBai: b.tenBai, viTri: b.viTri, maDe: maDeMacDinh(b) }))
}

/** "Bài 6" từ "Bài 6. Tinh bột và cellulose"; tên không bắt đầu bằng "Bài <số>" ⇒ nguyên tên. Dùng trên nút "Giao Bài 6 cho 12A1". */
export function tenNganBai(tenBai: string): string {
  const m = /^\s*Bài\s+(\d+[a-z]?)/i.exec(tenBai)
  return m ? `Bài ${m[1]}` : tenBai.trim()
}

/** "05/10" từ thời điểm ISO (giờ Việt Nam). Hỏng ⇒ ''. */
export function ngayThangVn(iso: string): string {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return ''
  const d = new Date(ms + 7 * 3_600_000)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export type KieuTrangThaiBai = 'da_day' | 'dang_luyen' | 'hom_nay' | 'chua_day'
/** Bài đã tick theo máy chủ (phần cần cho chữ trạng thái). */
export interface TickTom {
  trangThai: 'dang_luyen' | 'da_day'
  tickLuc: string
  conNgay: number | null
  chungChi: { dat: number; tong: number } | null
}

/** Chip trạng thái của một bài: "Đã dạy dd/mm · chứng chỉ a/b" · "Đang luyện · còn N ngày" · "Bài hôm nay" (đang chọn, chưa tick) · "Chưa dạy". */
export function trangThaiBai(tick: TickTom | null | undefined, dangChon: boolean): { kieu: KieuTrangThaiBai; chu: string } {
  if (tick?.trangThai === 'dang_luyen') {
    const con = tick.conNgay
    return { kieu: 'dang_luyen', chu: typeof con === 'number' && con >= 0 ? `Đang luyện · còn ${con} ngày` : 'Đang luyện' }
  }
  if (tick) {
    const ngay = ngayThangVn(tick.tickLuc)
    const cc = tick.chungChi && tick.chungChi.tong > 0 ? ` · chứng chỉ ${tick.chungChi.dat}/${tick.chungChi.tong}` : ''
    return { kieu: 'da_day', chu: `Đã dạy${ngay ? ` ${ngay}` : ''}${cc}` }
  }
  return dangChon ? { kieu: 'hom_nay', chu: 'Bài hôm nay' } : { kieu: 'chua_day', chu: 'Chưa dạy' }
}

/** Dòng nhắc ở đầu bảng Dạy học khi lớp chờ bài mới từ 3 ngày; chưa tới ngưỡng / không chờ ⇒ null. */
export function chuChoBaiMoi(lop: string, choBaiMoi: { soNgay: number } | null | undefined): string | null {
  const n = choBaiMoi?.soNgay
  if (!lop.trim() || typeof n !== 'number' || n < NGAY_NHAC_CHO_BAI_MOI) return null
  return `Lớp ${lop.trim()}: ${n} ngày chưa có bài mới`
}

/** Khoá phiên (sessionStorage): nút "Giao theo bài" ở mục Chiến dịch luyện nhờ mục Lên bảng mở sẵn thẻ Dạy học (bước Bài hôm nay). Đọc một lần rồi xoá. */
export const KHOA_MO_THE_DAY_HOC = 'ddh.moTheDayHoc'
/** Đọc (và xoá) yêu cầu mở sẵn thẻ Dạy học. Máy chặn bộ nhớ / không có ⇒ false (mở thẻ thứ nhất như cũ). */
export function docMoTheDayHoc(kho: Pick<Storage, 'getItem' | 'removeItem'> | undefined = globalThis.sessionStorage): boolean {
  try {
    const v = kho?.getItem(KHOA_MO_THE_DAY_HOC)
    if (v) kho?.removeItem(KHOA_MO_THE_DAY_HOC)
    return v === '1'
  } catch {
    return false
  }
}
