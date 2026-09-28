// Thầy 28/09: app học sinh + phụ huynh KHÔNG dùng chữ "A.I Đỗ Đại Học" / "Bộ não A.I …" — người nói với học sinh, phụ huynh là "Thầy Đỗ Đại Học".
// Áp cho MỌI chữ máy chủ đã lưu/soạn rồi hiện nguyên văn (thông báo cũ trong student_notice, thư tuần, lời nhắn, cảnh báo, nhận xét).
// Chữ của chính app viết thẳng "Thầy Đỗ Đại Học". Dùng chung cho app (src/) và máy chủ (server/src/notifications.ts).

export function chuThay(s: string): string {
  return s
    .replace(/Bộ não A\.?I\.? hỗ trợ riêng (?:em|con)(?: \p{Lu}\p{L}*)*/gu, 'Thầy Đỗ Đại Học')
    .replace(/Bộ não A\.?I\.?/gu, 'Thầy Đỗ Đại Học')
    .replace(/A\.I Đỗ Đại Học/g, 'Thầy Đỗ Đại Học')
}
