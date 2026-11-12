// (Tách khỏi index.ts 12/11 — giữ index.ts dưới trần cỡ tệp; nội dung không đổi.)
// CORS — app chạy ở `dodaihoc4869.github.io`, Worker ở `workers.dev`, nên MỌI
// lượt gọi đều là chéo nguồn. Thiếu mấy dòng này là trình duyệt chặn sạch và
// máy em chỉ thấy "lỗi mạng" — không có cách nào đoán ra từ phía em.
//
// Mở cho mọi nguồn, đúng như Apps Script đang làm: lệnh của học sinh vốn không
// đòi mã bí mật, khoá theo nguồn không thêm an toàn mà chỉ thêm chỗ hỏng.
export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-ma-bi-mat',
  'access-control-max-age': '86400',
}
