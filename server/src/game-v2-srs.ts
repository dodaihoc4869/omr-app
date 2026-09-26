/**
 * HỆ THỐNG SPACED REPETITION (KHO ĐỀ GIAO 26/09/2026)
 *
 * Nhiệm vụ: Quản lý lịch ôn tập (Đoàn Hộ Tống) và bốc câu mới (Bát Linh Đảo).
 * Luật:
 * - Thông thạo: Cần đúng 2 lần liên tiếp. (Ngưỡng 90% kho).
 * - Lịch ôn:
 *   + Trả lời đúng: +3 ngày, +7 ngày, +14 ngày.
 *   + Trả lời sai: +1 ngày, +3 ngày, +7 ngày.
 */

export interface SrsRecord {
  qid: string;
  ngayGapLanCuoi: number; // timestamp
  soLanDungLienTiep: number;
  ngayOnKe: number; // timestamp khi nào cần ôn lại
}

export function tinhNgayOnKe(dung: boolean, soLanDungLienTiep: number, now: number): number {
  const NGAY = 24 * 3600 * 1000;
  if (dung) {
    if (soLanDungLienTiep === 1) return now + 3 * NGAY;
    if (soLanDungLienTiep === 2) return now + 7 * NGAY;
    return now + 14 * NGAY;
  } else {
    // Nếu sai, reset chuỗi đúng và xếp lịch ôn gần hơn
    if (soLanDungLienTiep === 0) return now + 1 * NGAY;
    if (soLanDungLienTiep === 1) return now + 3 * NGAY;
    return now + 7 * NGAY;
  }
}

export function capNhatSrs(record: SrsRecord | null, qid: string, dung: boolean, now: number): SrsRecord {
  const soLanDungCu = dung ? ((record?.soLanDungLienTiep || 0) + 1) : 0;
  return {
    qid,
    ngayGapLanCuoi: now,
    soLanDungLienTiep: soLanDungCu,
    ngayOnKe: tinhNgayOnKe(dung, record?.soLanDungLienTiep || 0, now)
  };
}
