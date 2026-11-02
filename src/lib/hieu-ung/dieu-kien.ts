// BỘ HIỆU ỨNG ĂN MỪNG (thầy chốt 02/11: «Chốt Mol sống động và hiệu ứng gắn luôn vào app, đảm bảo máy siêu yếu cũng hoạt động được, tải luôn hiệu ứng
// sẵn cho máy yếu nhé») — phần THUẦN: chọn chế độ theo máy, thông số từng chế độ, điều kiện kích từng hiệu ứng. Không DOM, không React ⇒ test được,
// và nằm cùng mảnh nhỏ với bộ nạp (nap.ts) — mã vẽ nặng ở mảnh nạp lười riêng `hieu-ung-an-mung` (nạp trước lúc app rảnh).
import type { CheDoHieuUng } from '../hieu-ung-exp-cau'

/** Cùng ba mức với hiệu ứng EXP câu: đầy đủ · gọn (máy yếu) · tĩnh (xin giảm chuyển động). */
export type CheDoAnMung = CheDoHieuUng

/** Xin giảm chuyển động ⇒ tĩnh (chỉ đổi màu / nảy nhẹ); máy yếu (`ddh.mayYeu`, lớp `may-yeu`) ⇒ gọn; còn lại đầy đủ. */
export function cheDoAnMung(o: { mayYeu: boolean; giamChuyenDong: boolean }): CheDoAnMung {
  if (o.giamChuyenDong) return 'tinh'
  return o.mayYeu ? 'gon' : 'day-du'
}

export interface ThongSoAnMung {
  /** Nhân số hạt (gọn ≤ 1/4, tĩnh 0). */
  heSoHat: number
  /** Được dùng MỘT canvas phủ toàn màn (gọn: canvas nhỏ quanh chỗ nổ, hoặc không canvas). */
  canvasToanMan: boolean
  /** Loé màn / tối màn / rung màn (gọn, tĩnh: không). */
  loeRungMan: boolean
  /** Khoảng tối thiểu giữa hai lần vẽ (ms): 0 = theo màn (60 khung/s); gọn = 33 ms (30 khung/s). */
  khungMs: number
  /** Nhân thời lượng (gọn ngắn hơn). */
  heSoThoiGian: number
  /** Trần điểm ảnh thật / điểm CSS của canvas. */
  dprToiDa: number
}

const THONG_SO: Record<CheDoAnMung, ThongSoAnMung> = {
  'day-du': { heSoHat: 1, canvasToanMan: true, loeRungMan: true, khungMs: 0, heSoThoiGian: 1, dprToiDa: 2 },
  gon: { heSoHat: 0.25, canvasToanMan: false, loeRungMan: false, khungMs: 1000 / 30, heSoThoiGian: 0.7, dprToiDa: 1 },
  tinh: { heSoHat: 0, canvasToanMan: false, loeRungMan: false, khungMs: 0, heSoThoiGian: 0.5, dprToiDa: 1 },
}
export const thongSo = (che: CheDoAnMung): ThongSoAnMung => THONG_SO[che]

/** Số hạt thật của một lớp hạt `n` (bản đầy đủ): gọn ⇒ ⌊n/4⌋ (ít nhất 1), tĩnh ⇒ 0. */
export function soHat(n: number, che: CheDoAnMung): number {
  const k = THONG_SO[che].heSoHat
  if (k <= 0 || !(n > 0)) return 0
  return Math.max(1, Math.floor(n * k))
}

/** Thời lượng thật (ms) của một nhịp `ms` theo chế độ. */
export const thoiGian = (ms: number, che: CheDoAnMung): number => Math.round(ms * THONG_SO[che].heSoThoiGian)

// ───────────────────────────── điều kiện kích từng hiệu ứng

/** Chuỗi câu đúng liền SAU câu vừa chấm: câu đúng, tự làm, được tính ⇒ +1; còn lại (sai, có hỗ trợ, chưa được tính) ⇒ về 0. */
export function chuoiSauCau(truoc: number, cau: { dung: boolean; tuLam?: boolean; tinh?: boolean }): number {
  return cau.dung && cau.tuLam !== false && cau.tinh !== false ? Math.max(0, Math.floor(truoc)) + 1 : 0
}

/** Đếm chuỗi đúng liền ở CUỐI dãy kết quả (dãy theo thứ tự câu). */
export function demChuoiDung(ds: readonly { dung: boolean; tuLam?: boolean; tinh?: boolean }[]): number {
  return ds.reduce((n, c) => chuoiSauCau(n, c), 0)
}

/** SÉT ĐÁNH: đúng 5 câu liền, rồi 10, 15, 20 … (mỗi 5 câu một lần — 3 câu liền chỉ có băng chữ + chuông, không sét). */
export const kichSet = (chuoi: number): boolean => Number.isInteger(chuoi) && chuoi >= 5 && chuoi % 5 === 0

/** Mức sét theo chuỗi: 5 ⇒ 1 · 10 ⇒ 2 · ≥ 15 ⇒ 3 (số tia nhánh, tia lửa). */
export const mucSet = (chuoi: number): 1 | 2 | 3 => (chuoi >= 15 ? 3 : chuoi >= 10 ? 2 : 1)

/** +NGUYÊN TỬ bay vào bộ đếm: câu được tính và máy chủ cộng N > 0 (số lấy NGUYÊN từ máy chủ, máy em không tự tính). */
export const kichNguyenTu = (N: number | null | undefined): boolean => typeof N === 'number' && Number.isFinite(N) && N > 0

/** Số nguyên tử bay theo N và chế độ: 6–10 hạt (bản đầy đủ), gọn ⇒ ≤ 1/4. */
export function soNguyenTuBay(N: number, che: CheDoAnMung): number {
  if (!kichNguyenTu(N)) return 0
  return soHat(Math.max(6, Math.min(10, Math.round(N / 2))), che)
}

/** Hiệu ứng thẻ đáp án sau khi chấm: em đúng ⇒ «đúng» trên thẻ đúng; em sai ⇒ «sai» trên thẻ em chọn; câu nhờ hỗ trợ (chờ thầy / học cách giải) ⇒ không. */
export function kieuThe(o: { coKetQua: boolean; dung: boolean; hoTro: boolean }): 'dung' | 'sai' | null {
  if (!o.coKetQua || o.hoTro) return null
  return o.dung ? 'dung' : 'sai'
}

/** LỬA CHUỖI NGÀY: chuỗi ngày vừa TĂNG (số mới > số cũ, số mới ≥ 1). */
export const kichLuaChuoi = (truoc: number | null | undefined, sau: number | null | undefined): boolean =>
  typeof sau === 'number' && sau >= 1 && (typeof truoc !== 'number' || sau > truoc)

/** …hoặc vừa ĐỦ MỨC hôm nay: trước câu này chưa đủ, sau câu này đủ (mức > 0). */
export const kichDuMuc = (o: { truoc: number; sau: number; muc: number }): boolean => o.muc > 0 && o.truoc < o.muc && o.sau >= o.muc

/** XONG CHẶNG: màn kết chặng hiện lần đầu (không chạy lại khi vẽ lại). */
export const kichXongChang = (o: { xong: boolean; daChay: boolean }): boolean => o.xong && !o.daChay

/** MỞ RƯƠNG trên Lộ trình: rương đã sáng (xong cả các chặng hôm nay) và em chạm vào rương. */
export const kichRuong = (o: { duMo: boolean; cham: boolean }): boolean => o.duMo && o.cham

// ───────────────────────────── âm thanh / rung

/** Công tắc «Tiếng ăn mừng» ở menu app học sinh: localStorage = 'bat' mới kêu. MẶC ĐỊNH TẮT (chưa đặt ⇒ im). */
export const KHOA_AM_AN_MUNG = 'ddh.am-an-mung'

/** Tiếng ăn mừng (sét nổ, kèn xong chặng, lách cách rương…) chỉ kêu khi: em BẬT «Tiếng ăn mừng», KHÔNG tắt «Âm thanh» chung, và không ở màn kiểm tra. */
export function amAnMungBat(o: { am: string | null; anMung: string | null; dangThi: boolean }): boolean {
  return !o.dangThi && o.am !== 'tat' && o.anMung === 'bat'
}
