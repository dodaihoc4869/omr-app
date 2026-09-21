// ĐỘ CHỤM CỦA ĐÁP ÁN SAI — phần DUY NHẤT còn sống của `phan-cau-len-bang.ts` cũ (Code 1, 21/09/2026, gỡ mã chết).
//
// Bản cũ ("phân câu gọi lên bảng duyệt theo CÂU": phanCauLenBang, phanMotLuot, xepCau, diemCau, tiLeDungLop, chiDocDapAn, nhacHieuNhamChung, bangChu, dungDuLieuTuCa…) giả định MỌI EM LÀM CÙNG MỘT ĐỀ; ca chẩn đoán
// và màn Gọi lên bảng nay dùng `phan-cong.ts` / `buoi-chua.ts`, nên cả chuỗi ấy không còn nơi nhập (chỉ test của chính nó chạm) và đã bị xoá cùng test. Còn lại `doChum` vì
// `chan-doan.ts` DÙNG LẠI hàm này (cấm viết bản thứ hai — hai cách đo độ chụm sẽ lệch nhau; test `chan-doan-nguyen-nhan` khoá dòng nhập).
//
// Hàm thuần, không đụng DOM, không gọi mạng.

/**
 * ĐỘ CHỤM — trong số em LÀM SAI, tỉ lệ em cùng chọn một phương án.
 *
 * 12/12 em sai cùng chọn B là cả lớp mắc chung một hiểu nhầm: chữa câu đó là
 * gỡ được cho cả lớp. 12 em sai mỗi em một kiểu là sai do ẩu, chữa một câu
 * không gỡ được gì.
 *
 * Không em nào sai → 0.
 */
export function doChum(dapAnSai: string[]): number {
  const co = dapAnSai.map((x) => (x ?? '').trim()).filter(Boolean)
  if (co.length === 0) return 0
  const dem = new Map<string, number>()
  for (const d of co) dem.set(d, (dem.get(d) ?? 0) + 1)
  return Math.max(...dem.values()) / co.length
}
