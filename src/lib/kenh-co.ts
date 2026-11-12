// KÊNH ĐẨY ĐANG MỞ ⇒ VÒNG LƯỚI AN TOÀN THƯA RA (12/11 giảm chi phí Cloudflare — Worker 650 nghìn lượt/ngày, Durable Object 115 nghìn; gói ~333 / ~33 nghìn).
// lib/kenh-day.ts đặt `globalThis.ddhKenh = 1` khi WebSocket nối được, gỡ khi đứt / đóng — đọc ở đây KHÔNG nạp mảnh lười của kênh (biến toàn cục: ngắn nhất).
// Thứ kênh đã báo tức thì (thầy hẹn / mở / bắt đầu / kết thúc live — tin `live`) ⇒ vòng nền của thẻ Live chỉ còn là lưới an toàn: hẹn không sớm hơn 6 phút khi kênh
// mở; kênh đứt ⇒ nhịp cũ ở lần hẹn kế (nối lại lúc app đang hiện ⇒ thẻ hỏi lại ngay). Quay lại app vẫn hỏi ngay (chặn dội như cũ).
// Đi qua `datGio` của batNhipBenVung ⇒ lõi nhịp dùng chung (app phụ huynh, màn thi) không mang thêm byte nào. Dùng thêm cho vòng khác (kế hoạch ngày, EXP) cần bù
// ~25 byte nén ở mảnh nạp sẵn của cổng em (cổng `npm run kiem:toc-do`, 12/11 đo: chỉ riêng vòng kế hoạch ngày +21 byte ⇒ vượt dung sai 64 byte).
/** `datGio` cho `batNhipBenVung`: kênh đẩy đang mở ⇒ hẹn không sớm hơn 6 phút. */
export const henKhiCoKenh = (f: () => void, ms: number) => setTimeout(f, (globalThis as { ddhKenh?: 1 }).ddhKenh ? Math.max(ms, 36e4) : ms)
