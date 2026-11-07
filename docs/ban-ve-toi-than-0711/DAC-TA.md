# Nền tối xanh than kiểu Duolingo + chuẩn độ rõ chữ (thầy 07/11)

Thầy 07/11:
- «Làm nền tối theo màu kiểu này để nhìn dịu mắt, vẫn giữ nguyên kính nhưng nền theo màu như này».
- «Đo độ tương phản chữ, độ rõ của chữ Duolingo áp dụng chuẩn vào app ở mọi chỗ».
- «Đo thật kĩ để app phải sáng rõ nét căng màu tươi tắn y như thế này».

## Số đo ảnh Duolingo tối thầy gửi (điểm ảnh)

| Phần | Màu | Tương phản |
|---|---|---|
| Nền trang / thẻ | #141e24 | — |
| Viền thẻ | #39464a | — |
| Mục chọn: nền / viền | #202f35 / #436d81 | — |
| Chữ chính | #effafd | 15,9:1 |
| Chữ phụ | #dae4ea | 13,1:1 |
| Chữ màu: lam / lục / tím | #52bcec / #5fc61b / #c889f2 | 7,8 / 7,7 / 6,7:1 |
| Chữ trắng trên dải tiêu đề lục (banner) | — | 2,1:1 |
| Chữ trên NÚT hành động («Tạo hồ sơ») | chữ SẪM #0f2412 trên lục #94d434 | 9,2:1 |
| Nút | lục #92d332 · lam #48bff9, gờ sẫm hơn | — |

## Áp vào app học sinh (tối)
- **Nền / thẻ / viền:** --tr-nen #141e24 · --tr-mat #202f36 · --tr-mat-2 #263840 · --tr-mat-3 / --tr-vien #37464f. Sửa ở trong-hs-mau.css; trong.css (lượt mở) sửa cùng số byte.
- **Chữ:** --tr-chu #f1f7fb · --tr-chu-2 #dce6ec · --tr-chu-3 #c4d0d6.
- **Màu nhấn:** giữ rực như cũ, nút chàm không làm sẫm (Duolingo cũng giữ màu tươi).
- **Kính:** giữ nguyên. Dải loang dưới nền tối dịu xuống còn khoảng 40 % (html:root trong kinh-toan-hs.css) để tông xanh than lộ ra. Khung mảnh sáng như viền Duolingo.
- **Thanh điều hướng:** mục đang chọn dùng chữ --tr-hs-chu (8:1, cũ 3,6:1).
- **Sáng:** --tr-chu-3 đổi #4f4d75 → #47456d (≥ 7:1 trên kính).

## Đo trên app thật
Bộ đo chạy ở scratchpad (tp-kich.cjs + tp-do.py): nền lấy từ ảnh đã ẩn chữ, màu chữ trộn đúng độ mờ.
- **Kết quả:** chữ thường trên thẻ / trang ≥ 7:1 ở mọi chỗ. Chữ màu đậm từ 6,2:1 trở lên.
- **CHƯA đạt chuẩn Duolingo (chờ thầy chọn):** chữ trắng đậm trên nút / bong bóng tô chàm rực đạt 3,2–4,2:1. Nút hành động Duolingo dùng mặt sáng + chữ SẪM (9,2:1). Cách gần Duolingo nhất là mặt chàm sáng hơn + chữ sẫm, đổi hình rõ nên phải vẽ cho thầy chọn trước.
- **Ảnh tối trong docs/ban-ve-phang-0711 và docs/ban-ve-bo-cuc-rong-0711:** chụp trên bản cũ nền tím, CHƯA phải nền xanh than.
