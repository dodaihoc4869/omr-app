# Bản vẽ Tự sửa lỗi (app học sinh) · 20/10/2026

Thầy dặn: "học sinh phải cực kì hứng thú và thấy ý nghĩa với việc sửa lỗi … vẽ cho tôi xem trước khi chốt build" (kèm ảnh thẻ "155 câu đang chờ em sửa" ở Hôm nay).

Đặc tả đầy đủ và các quyết định cần thầy chốt: `docs/dac-ta-tu-sua-y-nghia-2010.md`. Chưa sửa `src/`. Số liệu trong ảnh là số GIẢ.

Bản vẽ ở `tu-sua.html`, ảnh Chromium thật ở `anh/` (chụp bằng `node scripts/chup-ban-ve-tu-sua-2010.mjs`). Mỗi khung có 3 khổ (`doc` 390 · `ngang` 844 · `may-tinh` 1440) × `sang` / `toi`.

| Khung | Tệp ảnh bắt đầu bằng | Là gì |
|---|---|---|
| 1 | `01-hom-nay-` | Hôm nay với thẻ mới "Hôm nay sửa 3 câu" |
| 2 | `02-bang-the-` | Bốn trạng thái của thẻ (chưa làm · gần xong · đang làm dở · xong hôm nay) |
| 3 | `03-viec-hom-nay-` | Màn Tự sửa lỗi: Việc hôm nay + tiến độ + 7 ngày gần đây |
| 4 | `04-ban-moi-` | Lần gặp lại 2: làm bản mới, có đúng một dòng điều kiện |
| 5 | `05-da-sua-` | "Em đã tự sửa xong câu này": 4 mốc, chỗ từng vướng, tiến độ của dạng |
| 6 | `06-theo-dang-` | Sửa theo dạng: 9 dạng, mỗi dạng một thanh tiến độ |

Soát bằng máy: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ hơn 44 px. Màu chỉ dùng biến chuẩn của `src/styles/tokens.css`, không thêm màu mới.
