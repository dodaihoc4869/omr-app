// PHƯƠNG ÁN CHỈ LÀ ẢNH (thầy 01/10: "gắn thẳng ảnh vào đáp án cho cân đối, bỏ tất cả dòng chữ xem hình A").
//
// Kho đề ghi chữ giữ chỗ ở ô phương án khi phương án là ảnh: "(xem hình phương án A)", "(xem hình)", "(xem hình A)", "." —
// 95 câu / 57 bộ đề (quét 01/10). Ảnh nằm ở `hinh[]` với vị trí `sau_pa_A`… nên trước đây ô phương án hiện dòng chữ
// giữ chỗ còn ảnh rơi xuống DƯỚI ô. Hàm này cho mọi màn biết: chữ đó chỉ là giữ chỗ ⇒ bỏ chữ, đặt ảnh vào TRONG ô.
// Sửa ở lúc hiển thị (không sửa kho) để ca đã mở, gói đề cũ và đề nạp sau đều đúng như nhau.

const CHU_GIU_CHO = /^\s*(?:\(?\s*(?:xem\s+)?hình(?:\s+(?:phương\s+án|pa))?\s*[A-Da-d]?\s*\)?)?\s*[.:…]?\s*$/i

/** Chữ ô phương án chỉ là chữ giữ chỗ cho ảnh (hoặc rỗng). */
export function laChuGiuCho(chu: unknown): boolean {
  return CHU_GIU_CHO.test(String(chu ?? ''))
}

/** Chữ hiện trong ô phương án: có ảnh của ô mà chữ chỉ là giữ chỗ ⇒ "". */
export function chuPhuongAn(chu: string, coAnh: boolean): string {
  return coAnh && laChuGiuCho(chu) ? '' : chu
}
