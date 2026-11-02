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
  /** Được bắn hạt khắp màn (pháo giấy từ hai góc dưới + mưa giấy). Gọn: không — chỉ quanh chỗ nổ. */
  toanMan: boolean
  /** Loé màn / tối màn / rung màn (gọn, tĩnh: không). */
  loeRungMan: boolean
  /** Khoảng giữa hai mẫu khung hình của hạt (ms): 0 = nội suy mượt theo màn; gọn = 33 ms giữ nguyên giữa hai mẫu (30 khung/giây thật). */
  khungMs: number
  /** Nhân thời lượng (gọn ngắn hơn). */
  heSoThoiGian: number
}

const THONG_SO: Record<CheDoAnMung, ThongSoAnMung> = {
  'day-du': { heSoHat: 1, toanMan: true, loeRungMan: true, khungMs: 0, heSoThoiGian: 1 },
  gon: { heSoHat: 0.25, toanMan: false, loeRungMan: false, khungMs: 1000 / 30, heSoThoiGian: 0.7 },
  tinh: { heSoHat: 0, toanMan: false, loeRungMan: false, khungMs: 0, heSoThoiGian: 0.5 },
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

/** Số nguyên tử bay theo N và chế độ: ~N/2, trong 3–8 hạt (bản đầy đủ: +2 ⇒ 3, +12 ⇒ 6, +20 ⇒ 8), gọn ⇒ ≤ 1/4. */
export function soNguyenTuBay(N: number, che: CheDoAnMung): number {
  if (!kichNguyenTu(N)) return 0
  return soHat(Math.max(3, Math.min(8, Math.round(N / 2))), che)
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

// ───────────────────────────── tự hạ xuống bản gọn
/** Ngưỡng khung chậm (ms) khi hiệu ứng bản đầy đủ đang chạy. */
export const KHUNG_CHAM_MS = 40
/** Khoảng cách giữa các khung (ms) đo trong lúc hiệu ứng bản đầy đủ chạy ⇒ máy này không kham nổi ⇒ hạ xuống bản GỌN cho cả phiên dùng app: bỏ 2 khung đầu
 *  (khung dựng dải kết quả), bỏ khoảng > 1 s (tab ẩn); còn ≥ 2 khung > 40 ms, hoặc 1 khung > 70 ms. */
export function nenHaGon(khoang: readonly number[]): boolean {
  const ds = khoang.slice(2).filter((x) => x > 0 && x < 1000)
  return ds.filter((x) => x > KHUNG_CHAM_MS).length >= 2 || ds.some((x) => x > 70)
}

// ───────────────────────────── âm thanh / rung

/** Công tắc «Tiếng ăn mừng» ở menu app học sinh: localStorage = 'bat' mới kêu. MẶC ĐỊNH TẮT (chưa đặt ⇒ im). */
export const KHOA_AM_AN_MUNG = 'ddh.am-an-mung'

/** Tiếng ăn mừng (sét nổ, kèn xong chặng, lách cách rương…) chỉ kêu khi: em BẬT «Tiếng ăn mừng», KHÔNG tắt «Âm thanh» chung, và không ở màn kiểm tra. */
export function amAnMungBat(o: { am: string | null; anMung: string | null; dangThi: boolean }): boolean {
  return !o.dangThi && o.am !== 'tat' && o.anMung === 'bat'
}
