// TÊN NGUỒN HỌC SINH NHÌN THẤY — MỘT bộ tên cho mọi màn học sinh (Câu đã làm, Tu luyện, Tự chữa lỗi).
// Thầy 12/10: "thay những từ đảo, đoàn, bia bằng những từ phù hợp" ⇒ mã nội bộ của máy chủ giữ nguyên (`dao`, `doan`, `bia`…),
// chữ hiện ra là tên việc học, không tên trò chơi. Tách khỏi `components/hoa2/api.ts` (12/10) để tệp nhẹ như `tu-luyen/nguon-cau-sai.ts`
// dùng được mà không kéo cả lớp gọi máy chủ; `hoa2/api.ts` xuất lại đúng hai tên này ⇒ mọi chỗ cũ không đổi.

/** Nơi em làm lần đó (máy chủ gắn): Bi-a Phản Ứng / Đoàn Hộ Tống / Bát Linh Đảo / Ca kiểm tra / Lên bảng / Kiểm tra đầu giờ; nguồn khác hoặc bản máy chủ cũ ⇒ vắng. */
export type NguonLanLam = 'bia' | 'doan' | 'dao' | 'thi' | 'len_bang' | 'dau_gio'
export const NHAN_NGUON_LAN: Record<NguonLanLam, string> = { bia: 'Luyện tập trước đây', doan: 'Ôn theo kế hoạch', dao: 'Học theo kế hoạch', thi: 'Ca kiểm tra', len_bang: 'Lên bảng', dau_gio: 'Kiểm tra đầu giờ' }

/** Tên trò chơi cũ (máy chủ còn viết sẵn trong vài dòng chữ, vd "Sai gốc: … · Đoàn Hộ Tống · 30/09") ⇒ tên nguồn chuẩn ở trên.
 *  Dài trước ngắn sau ("Bi-a Phản Ứng" trước "Bi-a"); chỉ thay cụm đứng riêng, không chạm chữ khác. */
const TEN_CU: readonly [RegExp, string][] = [
  [/Bát Linh Đảo/g, NHAN_NGUON_LAN.dao],
  [/Đoàn Hộ Tống/g, NHAN_NGUON_LAN.doan],
  [/Bi-a Phản Ứng/g, NHAN_NGUON_LAN.bia],
  [/(^|[^\p{L}-])Bi-a(?![\p{L}-])/gu, `$1${NHAN_NGUON_LAN.bia}`],
]
export function doiTenNguonCu(chu: string): string {
  let s = chu
  for (const [mau, moi] of TEN_CU) s = s.replace(mau, moi)
  return s
}
