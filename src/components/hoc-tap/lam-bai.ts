// MÀN LÀM BÀI CỦA HỌC SINH (thầy 12/10 duyệt bản vẽ dot13: "trùng tu lại giao diện làm bài … tối ưu tối đa cho màn hình dọc") — các phép THUẦN
// (không React, không DOM) để test kỹ: bàn phím số của ô Trả lời ngắn, số "đã làm/M câu hôm nay" lấy từ Sảnh, chữ phản hồi sau khi nộp.
import type { KetQuaSanh } from '../hoa2/api'
import { DAU_AM, coPhay, doiDau, laAm } from '../../lib/nhap-dap-so'

// ───────────────────────────── Ô TRẢ LỜI NGẮN: 4 ô như phiếu + bàn phím số riêng ─────────────────────────────

/** Phiếu Phần III có 4 ô: mỗi chữ số, dấu phẩy, dấu trừ chiếm một ô. */
export const TOI_DA_KY_TU = 4
export type PhimSo = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | '-' | 'xoa' | 'xoa-het'
export const LA_CHU_SO = (p: PhimSo) => p.length === 1 && p >= '0' && p <= '9'

/**
 * Một lần bấm phím → chuỗi mới. ĐÚNG quy ước của ô đáp số cũ (`OSoTraLoi chuanViet` + `src/lib/nhap-dap-so.ts`): dấu âm là "-" (U+002D) ở ĐẦU số,
 * dấu thập phân là "," và chỉ MỘT dấu; không tự chuẩn hoá thêm (em bấm gì gửi nấy, máy chủ chấm bằng `khopPhanIII`).
 *  · chữ số / "," nối vào cuối khi còn chỗ (≤ 4 kí tự); "," chỉ khi chưa có dấu thập phân;
 *  · "-" BẬT/TẮT dấu âm ở đầu (bấm "1" rồi "−" ⇒ "-1", bấm lại ⇒ "1"); thêm dấu mà vượt 4 kí tự ⇒ giữ nguyên;
 *  · "xoa" xoá một kí tự cuối; "xoa-het" xoá hết.
 */
export function nhanPhim(v: string, phim: PhimSo): string {
  const s = String(v ?? '')
  if (phim === 'xoa') return s.slice(0, -1)
  if (phim === 'xoa-het') return ''
  if (phim === '-') {
    const moi = doiDau(s)
    return laAm(s) || moi.length <= TOI_DA_KY_TU ? moi : s
  }
  if (s.length >= TOI_DA_KY_TU) return s
  if (phim === ',') return coPhay(s) ? s : s + ','
  return s + phim
}

/** Phím này bấm có đổi được gì không (để làm mờ phím hết tác dụng). */
export function phimCoTacDung(v: string, phim: PhimSo): boolean {
  return nhanPhim(v, phim) !== String(v ?? '')
}

/** Phím của máy tính → phím của bàn phím số (gõ số trên máy tính vẫn nhập được). Không phải phím của ô ⇒ null. */
export function phimTuBanPhim(key: string): PhimSo | null {
  if (/^[0-9]$/.test(key)) return key as PhimSo
  if (key === ',' || key === '.' || key === 'Decimal') return ','
  if (key === '-' || key === '−' || key === 'Subtract') return '-'
  if (key === 'Backspace') return 'xoa'
  if (key === 'Delete') return 'xoa-het'
  return null
}

/** Chữ hiện trong từng ô: dấu trừ in "−" (U+2212) cho dễ nhìn, giá trị gửi đi vẫn "-". */
export const kyTuHien = (c: string) => (c === DAU_AM ? '−' : c)

/** Đủ điều kiện bấm "Nộp câu" ở màn luyện: như `duTraLoi` + Phần III phải có ít nhất một chữ số (không nộp "-" hay "," trơn). */
export function coChuSo(v: string): boolean {
  return /\d/.test(v)
}

// ───────────────────────────── SỐ "ĐÃ LÀM/M CÂU HÔM NAY" — đúng như vòng tròn Hôm nay (HocTapHomNay.tsx) ─────────────────────────────

export interface SoHomNay {
  /** Số câu đã làm hôm nay. */
  daLam: number
  /** Mức tối thiểu hôm nay (M). */
  muc: number
  /** Chặng em đang ở (1…soChang) — null khi không suy được từ dữ liệu. */
  chang: number | null
  /** Số chặng của hôm nay (mỗi chặng tối đa 6 câu). */
  soChang: number
}
/** Mỗi chặng tối đa 6 câu — cùng hằng với máy chủ (`server/src/hanh-trinh-ngay.ts` CAU_MOI_CHANG) và vạch chặng ở Hôm nay. */
export const CAU_MOI_CHANG = 6

/**
 * Cùng chuỗi nguồn với vòng tròn Hôm nay: Gói 7 ngày (`goi7.daLamHomNay`/`toiThieu`) → Hành trình (`hanhTrinh.daLam`/`toiThieu`) → thể lực của Sảnh
 * → tiến độ kế hoạch ngày cũ. Thiếu số (hoặc M ≤ 0) ⇒ null (màn ẩn ô ấy — không bịa). Chặng: Hành trình có `changHienTai` của máy chủ;
 * nguồn khác suy đúng như vạch chặng ở Hôm nay (xong chặng i khi đã làm ≥ 6·i câu).
 * KHẨN 12/10 21h30 (thầy: "lúc chiều thì hiện 31 câu giờ lại hiện 2 chặng"):
 *  · Ở nhánh Gói 7, `theLuc.tong` KHÔNG phải mức ngày — nó là đã làm + số việc kế hoạch XẾP ĐƯỢC (kho thiếu câu ⇒ 7 + 1 = 8 thay vì M = 32). Sảnh có
 *    `goi7` thô mà cốt lõi hỏng thì `docSanh` đã trả LỖI, nên tới đây Sảnh nhánh gói luôn có `goi7` và M lấy từ `goi7.toiThieu`.
 *  · `tienDoCu` (mức kế hoạch ngày cũ, kẹp 8–16 câu) CHỈ dùng khi Sảnh ĐÃ VỀ và không có số Sảnh (chế độ cũ). Sảnh chưa về / lỗi lần đầu ⇒ chưa biết
 *    em học Gói 7 hay Hành trình ⇒ null (khung xương / "Thử lại"), không vẽ "7/8" của kế hoạch cũ thành số hôm nay.
 */
export function soHomNay(kq: KetQuaSanh | null | undefined, tienDoCu?: { daLam: number; mucTieu: number }): SoHomNay | null {
  const sanh = kq && kq.cheDo2 && 'sanh' in kq ? kq.sanh : null
  const goi7 = sanh?.goi7
  const ht = sanh?.hanhTrinh
  const cu = kq ? tienDoCu : undefined
  const daLam = goi7?.daLamHomNay ?? ht?.daLam ?? (sanh ? Math.max(0, sanh.theLuc.tong - sanh.theLuc.con) : cu?.daLam ?? null)
  const muc = goi7?.toiThieu ?? ht?.toiThieu ?? sanh?.theLuc.tong ?? cu?.mucTieu ?? null
  if (daLam === null || muc === null || !Number.isFinite(daLam) || !Number.isFinite(muc) || muc <= 0) return null
  // Số chặng đi CÙNG nguồn với M: Gói 7 ⇒ ceil(M/6) (12/10E: Sảnh có cả Hành trình lẫn Gói 7 thì trước đây lấy số chặng của Hành trình — "1/5 chặng" khi
  // M = 32 cần 6 chặng); Hành trình ⇒ số chặng máy chủ xếp.
  const soChang = goi7 ? Math.ceil(muc / CAU_MOI_CHANG) : (ht?.soChang ?? Math.ceil(muc / CAU_MOI_CHANG))
  const chang = soChang <= 0 ? null : ht && !goi7 ? (ht.changHienTai >= 1 ? Math.min(ht.changHienTai, soChang) : null) : Math.min(soChang, Math.floor(daLam / CAU_MOI_CHANG) + 1)
  return { daLam, muc, chang, soChang }
}

/**
 * Số hôm nay nhánh Gói 7 từ HAI con số máy chủ (đã làm, M) — đúng luật nhánh `goi7` của `soHomNay` (chặng = ⌈M/6⌉, đang ở chặng ⌊đã làm/6⌋ + 1).
 * Màn làm bài dùng với số của `hoc-tap-start` (lúc mở chặng) và lệnh nhẹ `hoc-tap-dem` (sau mỗi câu) — không nạp lại cả sảnh sau mỗi câu.
 */
export function soHomNayGoi7(daLam: number, muc: number): SoHomNay | null {
  if (!Number.isFinite(daLam) || daLam < 0 || !Number.isFinite(muc) || muc <= 0) return null
  const soChang = Math.ceil(muc / CAU_MOI_CHANG)
  return { daLam, muc, chang: Math.min(soChang, Math.floor(daLam / CAU_MOI_CHANG) + 1), soChang }
}

/** Số chặng đã xong hôm nay — cùng luật vạch chặng ở Hôm nay. */
export function soChangXong(s: SoHomNay): number {
  return Array.from({ length: s.soChang }, (_, i) => s.daLam >= Math.min((i + 1) * CAU_MOI_CHANG, s.muc)).filter(Boolean).length
}

// ───────────────────────────── CHỮ PHẢN HỒI ─────────────────────────────

/** "Làm trong 41 giây" · "Làm trong 1 phút 05 giây". Không đo được ⇒ ''. */
export function chuThoiGian(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return ''
  const g = Math.max(1, Math.round(ms / 1000))
  if (g < 60) return `Làm trong ${g} giây`
  return `Làm trong ${Math.floor(g / 60)} phút ${String(g % 60).padStart(2, '0')} giây`
}

/** Danh sách số câu thành chữ: [2] ⇒ "Câu 2" · [2, 4] ⇒ "Câu 2 và 4" · [1, 2, 4] ⇒ "Câu 1, 2 và 4". */
export function chuDanhSachCau(so: number[]): string {
  if (!so.length) return ''
  if (so.length === 1) return `Câu ${so[0]}`
  return `Câu ${so.slice(0, -1).join(', ')} và ${so[so.length - 1]}`
}

export interface YSoSanh {
  /** Chữ cái ý: a b c d. */
  chu: 'a' | 'b' | 'c' | 'd'
  /** Em chọn (null khi em chưa chọn — ví dụ câu học cách giải). */
  chon: 'D' | 'S' | null
  dapAn: 'D' | 'S' | null
  dung: boolean
}
/** Đúng–sai: so từng ý em chọn với đáp án máy chủ trả SAU khi nộp ("DSDS"). */
export function soSanhDungSai(tra: string, dapAn: string): YSoSanh[] {
  const da = String(dapAn ?? '').toUpperCase().replace(/Đ/g, 'D')
  return (['a', 'b', 'c', 'd'] as const).map((chu, i) => {
    const c = tra[i] === 'D' || tra[i] === 'S' ? (tra[i] as 'D' | 'S') : null
    const d = da[i] === 'D' || da[i] === 'S' ? (da[i] as 'D' | 'S') : null
    return { chu, chon: c, dapAn: d, dung: c !== null && c === d }
  })
}
export const chuDS = (v: 'D' | 'S' | null) => (v === 'D' ? 'Đúng' : v === 'S' ? 'Sai' : '')
