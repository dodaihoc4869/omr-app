// LUẬT "CHẬM NHỊP" CỦA CHIẾN DỊCH — MỘT nơi cho mọi màn (Tổng quan, Chiến dịch đã giao). Đồng bộ 29/09/2026.
// Máy chủ tính theo NGÀY VN (server/src/srs2-gv.ts · mocNhip): ngày thứ `ngayThu` / `tongNgay` ngày tới hạn;
// "mức cần hôm nay" = phần đã làm qua phải đạt khi HẾT hôm nay ⇒ trong ngày chưa thể tụt so với nó.
// Chậm nhịp = đã làm qua thấp hơn mức cần tới HẾT HÔM QUA từ 10 điểm % ⇒ ngày đầu chiến dịch không bao giờ Chậm nhịp.

export const NGUONG_CHAM_NHIP = 0.1

export interface MocNhip {
  mucCanHomNay?: number
  ngayThu?: number
  tongNgay?: number
}

/** Mức "đã làm qua" lớp phải đạt khi hết hôm qua (0–1). Máy chủ cũ không gửi ngày ⇒ lùi về mức cần hôm nay. */
export function mucCanHetHomQua(m: MocNhip): number {
  if (typeof m.ngayThu === 'number' && typeof m.tongNgay === 'number' && m.tongNgay > 0) return Math.max(0, (m.ngayThu - 1) / m.tongNgay)
  return typeof m.mucCanHomNay === 'number' ? m.mucCanHomNay : 0
}

/** Lớp đã làm qua `lamQua` (0–1) có Chậm nhịp không. */
export function laChamNhip(lamQua: number, m: MocNhip): boolean {
  return lamQua < mucCanHetHomQua(m) - NGUONG_CHAM_NHIP
}
