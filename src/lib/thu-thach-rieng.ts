// "THỬ THÁCH RIÊNG HÔM NAY" — lời mời riêng của Bộ não A.I cho từng em (thầy chốt 21/09; đề `DE-XUAT-BO-NAO-VAI-TRO-MOI-2109.md` V1 + V2).
// Hợp đồng máy chủ (Code 3): `docs/hop-dong-thu-thach-rieng-2109.md` mục 3–4 — `POST /hs/thu-thach-hom-nay {}` trả `{ok, co, loiMoi, soCau, dang, bac, trangThai,
// soDaLam, thanThu, cau[công khai, KHÔNG đáp án], daNop, thieu?}`; nộp `POST /hs/thu-thach-hom-nay/nop` (trả y hệt `/hs/on-lai/nop`). Bộ não chỉ chọn dạng + số câu + bậc và
// viết `loiMoi`; MÁY CHỦ chọn và CHỐT câu (không tự luận, chưa làm trong 14 ngày, không vượt bậc + 1).
// THUẦN: không mạng, không đồng hồ. Đọc CHẶT: `co !== true`, thiếu lời mời, hoặc chưa xong mà không có câu nào ⇒ null ⇒ KHÔNG dựng thẻ (im lặng, không lỗi đỏ, không khung rỗng).
// Chỉ nói con số máy chủ trả (đúng x/y câu, còn bao nhiêu EXP…): trường nào thiếu/không hợp lệ thì bỏ dòng đó, không đoán.
import { lamSachLoi } from './bo-nao-hien-thi'
import { chanCauTuLuan } from './cau-tu-luan-may-hs'

export const TOI_DA_LOI_MOI = 200
export const TOI_DA_CAU_THU_THACH = 8

/** Số THẬT của thần thú tại lúc gọi (máy chủ tính lại; app không sao chép lời Bộ não). Trường vắng = `null`. */
export interface ThanThuThuThach {
  /** Tên loài thú, đúng chữ máy chủ gửi. */
  ten: string
  cap: number | null
  expConThieu: number | null
  manhKhien: number | null
  manhKhienTong: number | null
  chuoiNgay: number | null
}

/** Câu công khai (hình dạng `publicQuestion` của game v2, KHÔNG đáp án) — cùng kiểu với màn ôn câu. */
export interface CauThuThach {
  qid: string
  phan: 'I' | 'II' | 'III'
  text: string
  [khoa: string]: unknown
}

export interface ThuThachRieng {
  ngay: string
  /** Lời mời NGUYÊN VĂN của Bộ não (đã làm sạch, ≤ 200 ký tự). */
  loiMoi: string
  /** Số câu đã CHỐT cho hôm nay (gồm câu đã làm). */
  soCau: number
  dang: { ma: string; ten: string }[]
  trangThai: 'chua_lam' | 'dang_lam' | 'xong'
  soDaLam: number
  thanThu: ThanThuThuThach | null
  /** Câu CHƯA làm (máy chủ không lặp lại câu đã nộp). Rỗng khi đã xong. */
  cau: CauThuThach[]
  daNop: { qid: string; dung: boolean }[]
  /** Chỉ khi máy chủ chọn được ÍT hơn số câu Bộ não muốn. */
  thieu: { soCau: number; lyDo: string } | null
}

const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const soNguyenKhongAm = (x: unknown): number | null => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : null)
const chuoi = (x: unknown, tran: number): string => (typeof x === 'string' || typeof x === 'number' ? lamSachLoi(String(x), tran).replace(/\s*\n+\s*/g, ' ') : '')

function docThanThu(x: unknown): ThanThuThuThach | null {
  if (!laDoiTuong(x)) return null
  const ten = chuoi(x.ten, 40)
  if (!ten) return null
  const cap = soNguyenKhongAm(x.cap)
  const tong = soNguyenKhongAm(x.manhKhienTong)
  const manh = soNguyenKhongAm(x.manhKhien)
  return {
    ten,
    cap: cap !== null && cap >= 1 ? cap : null,
    expConThieu: soNguyenKhongAm(x.expConThieu),
    manhKhien: manh !== null && tong !== null && tong >= 1 && manh <= tong ? manh : null,
    manhKhienTong: manh !== null && tong !== null && tong >= 1 && manh <= tong ? tong : null,
    chuoiNgay: soNguyenKhongAm(x.chuoiNgay),
  }
}

const laCauCongKhai = (c: unknown): c is CauThuThach =>
  laDoiTuong(c) && typeof c.qid === 'string' && c.qid.trim() !== '' && (c.phan === 'I' || c.phan === 'II' || c.phan === 'III') && typeof c.text === 'string'

/** Đọc phản hồi `POST /hs/thu-thach-hom-nay`. Không có thử thách / sai dạng ⇒ null (không thẻ). */
export function docThuThachRieng(raw: unknown): ThuThachRieng | null {
  if (!laDoiTuong(raw) || raw.ok !== true || raw.co !== true) return null
  const loiMoi = lamSachLoi(raw.loiMoi, TOI_DA_LOI_MOI).replace(/\s*\n+\s*/g, ' ')
  if (!loiMoi) return null
  const trangThai = raw.trangThai === 'xong' ? 'xong' : raw.trangThai === 'dang_lam' ? 'dang_lam' : 'chua_lam'
  // Chốt chặn cuối: câu tự luận KHÔNG bao giờ vào màn làm (máy chủ đã lọc; đây chỉ để chắc).
  const cau = chanCauTuLuan((Array.isArray(raw.cau) ? raw.cau : []).filter(laCauCongKhai), 'thu-thach-hom-nay').slice(0, TOI_DA_CAU_THU_THACH)
  // Chưa xong mà không còn câu nào để làm ⇒ không có gì để mời.
  if (trangThai !== 'xong' && cau.length === 0) return null
  const daNop: { qid: string; dung: boolean }[] = []
  for (const d of Array.isArray(raw.daNop) ? raw.daNop : []) {
    if (laDoiTuong(d) && typeof d.qid === 'string' && d.qid.trim() && typeof d.dung === 'boolean' && !daNop.some((x) => x.qid === d.qid)) daNop.push({ qid: d.qid.trim(), dung: d.dung })
  }
  const soDaLam = Math.max(soNguyenKhongAm(raw.soDaLam) ?? 0, daNop.length)
  const soCauChot = soNguyenKhongAm(raw.soCau)
  const soCau = Math.max(soCauChot ?? 0, soDaLam + cau.length)
  const dang: { ma: string; ten: string }[] = []
  for (const d of Array.isArray(raw.dang) ? raw.dang : []) {
    if (!laDoiTuong(d)) continue
    const ma = chuoi(d.ma, 60)
    const ten = chuoi(d.ten, 80)
    if (ma && ten) dang.push({ ma, ten })
    if (dang.length >= 2) break
  }
  const thieu = laDoiTuong(raw.thieu) && soNguyenKhongAm(raw.thieu.soCau) !== null ? { soCau: soNguyenKhongAm(raw.thieu.soCau) as number, lyDo: chuoi(raw.thieu.lyDo, 160) } : null
  return {
    ngay: typeof raw.ngay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.ngay) ? raw.ngay : '',
    loiMoi,
    soCau,
    dang,
    trangThai,
    soDaLam,
    thanThu: docThanThu(raw.thanThu),
    cau,
    daNop,
    thieu,
  }
}

/** "6 câu" · "Không bắt buộc, không có hạn". */
export const chuSoCau = (n: number): string => `${n} câu`
export const CHU_KHONG_BAT_BUOC = 'Không bắt buộc, không có hạn'
/** Số câu còn phải làm cho hôm nay (câu chưa nộp). */
export const soCauConLai = (t: ThuThachRieng): number => t.cau.length

/** Dòng kết quả khi đã xong: "Em đã xong thử thách hôm nay · đúng 5 trong 6 câu" (số đúng/tổng lấy từ `daNop` máy chủ trả). */
export function chuDaXong(t: ThuThachRieng): string {
  const tong = t.daNop.length
  const dung = t.daNop.filter((x) => x.dung).length
  return `Em đã xong thử thách hôm nay${tong > 0 ? ` · đúng ${dung} trong ${tong} câu` : ''}`
}

/** Dòng đang làm dở: "Em đã làm 2/6 câu của thử thách hôm nay". */
export const chuDangLam = (t: ThuThachRieng): string => `Em đã làm ${t.soDaLam}/${t.soCau} câu của thử thách hôm nay`

/** Dòng SỐ THẬT của thần thú (chỉ khi máy chủ trả): tên loài + cấp + EXP còn thiếu. Thiếu ⇒ rỗng. (Chuỗi ngày đã có ở đầu trang nên KHÔNG lặp lại ở thẻ; mảnh khiên vẽ thành thanh riêng.) */
export function chuExpThanThu(t: ThuThachRieng): string {
  const th = t.thanThu
  if (!th || th.expConThieu === null) return ''
  const cap = th.cap !== null ? ` · cấp ${th.cap}` : ''
  return th.expConThieu === 0 ? `${th.ten}${cap} · đã đủ EXP để lên cấp kế` : `${th.ten}${cap} · còn ${th.expConThieu} EXP nữa để lên cấp kế`
}
/** Nhãn thanh mảnh khiên: "Mảnh khiên 3/12" (chỉ khi máy chủ trả đủ hai số hợp lệ). */
export function chuManhKhien(t: ThuThachRieng): string {
  const th = t.thanThu
  return th && th.manhKhien !== null && th.manhKhienTong !== null ? `Mảnh khiên ${th.manhKhien}/${th.manhKhienTong}` : ''
}

// ── "Để sau": ẩn thẻ tới ngày mai, không hỏi lại ─────────────────────────────
const khoaDeSau = (sbd: string) => `omr_thu_thach_de_sau:${sbd || 'khach'}`

/** Ngày (YYYY-MM-DD giờ VN) em bấm "Để sau"; rỗng nếu chưa. */
export function docDeSau(sbd: string): string {
  try {
    return localStorage.getItem(khoaDeSau(sbd)) ?? ''
  } catch {
    return ''
  }
}
export function luuDeSau(sbd: string, ngayVn: string): void {
  try {
    localStorage.setItem(khoaDeSau(sbd), ngayVn)
  } catch {
    /* máy chặn lưu: thẻ vẫn ẩn tới khi tải lại trang */
  }
}
/** Chỉ ẩn khi CÙNG ngày đã bấm "Để sau"; sang ngày mới (thử thách mới) là hiện lại. Đã xong thì màn cha không hỏi. */
export const dangDeSau = (daLuu: string, ngayThuThach: string, ngayHomNayVn: string): boolean => daLuu !== '' && daLuu === (ngayThuThach || ngayHomNayVn)
