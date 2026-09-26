/**
 * HỆ THỐNG KINH NGHIỆM VÀ CẤP ĐỘ (GAME 2.0)
 * 
 * Công thức: EXP cần để thăng cấp = 700 + (Cấp * 60)
 * Yêu cầu:
 * - Cấp 10: 9,000 EXP (~22.5 ngày nếu max 40 câu/ngày)
 * - Cấp 120: 511,700 EXP (~1279 ngày nếu max 40 câu/ngày)
 */

export const EXP_BASE = 700;
export const EXP_INCREMENT = 60;
export const EXP_PER_CORRECT = 10;
export const EXP_BONUS_THONG_THAO = 20;

/**
 * Tính tổng EXP cần thiết để ĐẠT ĐƯỢC một cấp độ nhất định.
 * Công thức tổng: Sum = (L-1)*Base + (L-1)*L/2 * Increment
 */
export function tinhTongExpCuaCap(capDo: number): number {
  if (capDo <= 1) return 0;
  const l = capDo - 1;
  return l * EXP_BASE + (l * capDo * EXP_INCREMENT) / 2;
}

/**
 * Tính số lượng EXP cần thiết để từ cấp hiện tại tiến lên cấp tiếp theo.
 */
export function tinhExpLenCapTiepTheo(capHienTai: number): number {
  return EXP_BASE + capHienTai * EXP_INCREMENT;
}

/**
 * Dựa vào TỔNG EXP hiện có của học sinh, tính ra Cấp Độ hiện tại
 * và số EXP đang có dư trong thanh tiến trình của cấp đó.
 */
export function tinhCapDoTuTongExp(tongExp: number): { capDo: number; expHienTaiCuaCap: number; expCanDeLenCap: number } {
  // Vì không có giới hạn cấp độ, ta có thể dùng vòng lặp để tìm cấp độ hiện tại (rất nhanh vì số cấp nhỏ)
  // Hoặc giải phương trình bậc 2. Giải phương trình bậc 2 O(1):
  // (Increment/2) * L^2 + (Base - Increment/2) * L - (TongExp + Base) = 0
  // Để đơn giản và an toàn với số nguyên, dùng vòng lặp dò cấp:
  
  let capDo = 1;
  let expDeLenCap = tinhExpLenCapTiepTheo(capDo);
  let expDu = tongExp;

  while (expDu >= expDeLenCap) {
    expDu -= expDeLenCap;
    capDo++;
    expDeLenCap = tinhExpLenCapTiepTheo(capDo);
  }

  return {
    capDo,
    expHienTaiCuaCap: expDu,
    expCanDeLenCap: expDeLenCap
  };
}

