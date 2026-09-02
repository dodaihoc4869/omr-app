// CHỐNG GIAN LẬN THEO MỨC (QUANLYCATHI.md mục 6) — thuần logic, dùng trong
// ExamTakeScreen. Web KHÔNG phát hiện được chụp màn hình / app nổi đè; chỉ đo
// được rời tab, mất tiêu điểm, thoát toàn màn hình. Khoá ngay lần đầu là SAI
// (cuộc gọi đến, pin yếu cũng gây blur) → xử lý theo mức:
//   lần 1: ghi log + dải cảnh báo nhẹ · lần 2: cảnh báo đậm + rung ·
//   lần thứ `lan` (mặc định 3): khoá, tự nộp · rời quá `giay` (mặc định 30 s)
//   một lần: khoá ngay bất kể lần thứ mấy.
// Ngưỡng do thầy đặt khi mở ca (máy chủ trả về trong vaoThi). Sau khi thầy
// MỞ KHOÁ, đếm lại từ mốc `mocMoKhoa` (số lần rời màn lúc mở khoá) — lịch sử
// vẫn giữ nguyên để ghi lên Sheet.

export interface NguongGianLan {
  /** Số lần rời màn (kể từ lần mở khoá gần nhất) thì khoá bài. */
  lan: number
  /** Một lần rời quá số giây này thì khoá ngay. */
  giay: number
}

export const NGUONG_MAC_DINH: NguongGianLan = { lan: 3, giay: 30 }

export type MucCanhBao = 'nhe' | 'dam' | 'khoa'

export function chuanHoaNguong(n?: Partial<NguongGianLan> | null): NguongGianLan {
  const lan = Number(n?.lan)
  const giay = Number(n?.giay)
  return {
    lan: Number.isFinite(lan) && lan >= 1 ? Math.floor(lan) : NGUONG_MAC_DINH.lan,
    giay: Number.isFinite(giay) && giay >= 5 ? Math.floor(giay) : NGUONG_MAC_DINH.giay,
  }
}

/** Số lần rời màn TÍNH TỪ lần mở khoá gần nhất. */
export function soLanTinhTu(leaveCount: number, mocMoKhoa = 0): number {
  return Math.max(0, leaveCount - Math.max(0, mocMoKhoa))
}

/** Em vừa RỜI màn (hidden/blur/thoát toàn màn hình) lần thứ `leaveCountMoi`
 * (đã cộng 1). Trả về mức xử lý cho lần này. */
export function mucKhiRoiMan(leaveCountMoi: number, mocMoKhoa: number, nguong: NguongGianLan): MucCanhBao {
  const n = soLanTinhTu(leaveCountMoi, mocMoKhoa)
  if (n >= nguong.lan) return 'khoa'
  return n >= 2 ? 'dam' : 'nhe'
}

/** Em QUAY LẠI sau `giayRoi` giây (hoặc đồng hồ chờ khi còn ẩn tới ngưỡng): khoá nếu rời quá lâu. */
export function khoaViRoiLau(giayRoi: number, nguong: NguongGianLan): boolean {
  return giayRoi > nguong.giay
}

/** Câu chữ trên dải cảnh báo — thẳng, không doạ quá mức (người dùng vị thành niên). */
export function loiCanhBao(muc: Exclude<MucCanhBao, 'khoa'>, soLan: number, nguong: NguongGianLan): string {
  if (muc === 'nhe') return `Em vừa rời khỏi bài làm (lần ${soLan}). Thầy sẽ thấy điều này.`
  const conLai = Math.max(0, nguong.lan - soLan)
  return conLai > 0
    ? `Rời khỏi bài làm lần ${soLan}. Còn ${conLai} lần nữa là bài bị khoá — rời quá ${nguong.giay} giây cũng khoá.`
    : `Rời khỏi bài làm lần ${soLan}. Lần sau bài bị khoá.`
}
