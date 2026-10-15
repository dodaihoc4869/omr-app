// CỬA VÀO ĐƯỜNG /hoi-thay (15/10/2026): main.tsx nạp tệp nhỏ này thay vì nạp thẳng HoiThayScreen — danh sách mảnh cần tải trước của màn
// hỏi Thầy (hộp, khung lời giải, đăng nhập…) nằm ở đây chứ không nằm trong gói mở app (index.js) mà cả ba app đều tải (luật tốc độ 13/10).
export const napHoiThay = () => import('./HoiThayScreen')
