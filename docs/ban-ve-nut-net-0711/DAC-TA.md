# Đặc tả — App học sinh: màu tươi hơn + NÚT SIÊU NÉT kiểu Duolingo (07/11)

> **BẢN v2** (thầy: «tươi hơn nữa và sắc nét hơn nữa, tươi hết mức có thể») — ảnh `v2/`, CSS `v2/proto-nut-net-v2.css`. Xem mục «v2» cuối tệp; bảng màu dưới đây là v1.

Thầy 07/11: «màu toàn app sáng hơn tươi hơn xuất sắc hơn nữa, quan trọng là các nút phải siêu nét, làm mọi cách vẽ siêu nét như doligo. Vẽ cho tôi xem trước rồi build.»

Bản vẽ = app THẬT (bản dựng main d55a122) chạy với máy chủ giả, CSS thử nghiệm `proto-nut-net.css` chèn lúc chụp. Chromium 360×740, 390×844, 768×1024, sáng + tối.

| Ảnh | Nội dung |
|---|---|
| `01-truoc-sau-hom-nay-va-cau-390-sang.jpg` | Hôm nay + màn làm câu: TRƯỚC · SAU · TRƯỚC · SAU |
| `02-truoc-sau-ket-qua-390-sang-toi.jpg` | Dải kết quả «Chính xác!»: trước/sau, sáng rồi tối |
| `03-truoc-sau-toi-390.jpg` | Chế độ tối: Hôm nay + làm câu, trước/sau |
| `04`–`09-sau-<khổ>-<sáng|tối>-3-man.jpg` | Bản SAU đủ 3 màn ở 3 khổ, sáng và tối |

## 1. Mục tiêu + ai dùng
Học sinh. Mỗi nút trông «bấm được» rõ ràng, mép sắc, không nhoè. Bấm có cảm giác lún xuống như phím thật. Màu sáng và tươi hơn.

Vì sao nút đang mờ:
- mặt nút bán trong suốt, pha với nền loang;
- viền lẻ 1,5 px, nằm giữa hai điểm ảnh nên nhoè;
- bóng tỏa mờ (`0 18px 32px`) thay cho gờ cứng.

## 2. Bố cục
KHÔNG đổi vị trí, cỡ hay thứ tự gì. Chỉ đổi «mặt» nút. Dọc, ngang và máy tính giữ nguyên luật bố cục hiện có (ảnh 768).

## 3. Trạng thái và cách vẽ
| Loại | Cách vẽ |
|---|---|
| Nút chính («Bắt đầu · Chặng», «KIỂM TRA») | Mặt chàm đặc `#6c71ff` (cũ `#5a5ae9`), GỜ CỨNG 3D `0 5–6px 0 #4d4bd1` (không bóng mờ), bo 16–20 px, chữ 900. «KIỂM TRA / TIẾP TỤC» viết HOA, giãn chữ 0,06em như Duolingo |
| Bấm | Lún 5–6 px, mất gờ (80 ms) |
| Tắt (chưa chọn đáp án) | Mặt xám `#e4e4eb`, gờ `#d6d6df`, chữ xám |
| Đúng | Nút «TIẾP TỤC» lục `#00c289`, gờ `#00976b`; ô đúng nền lục nhạt, viền 2 px + gờ 4 px lục |
| Sai | Nút hồng đỏ `#f13972`, gờ `#be2357`; ô sai viền + gờ cùng màu |
| Ô phương án | Mặt TRẮNG ĐẶC (bỏ kính), viền 2 px nguyên điểm ảnh + gờ 4 px xám; đang chọn: nền chàm nhạt, viền + gờ chàm; ô chữ A/B/C viền 2 px |
| Nút phụ (chuông, X, Trợ giúp, Hỏi thầy, chip 12 ngày / 147 / 245) | Mặt trắng đặc, viền 2 px + gờ 3 px |
| Thẻ lớn (Tổng câu, Việc hôm nay) | Vẫn kính, nhưng mép thành viền 2 px + gờ 4 px |
| Thanh dưới | Mục đang mở: ô chàm nhạt viền 2 px chàm |
| Biểu tượng trong nút | Nét 2,75 |
| Nền | Trắng hẳn `#ffffff` (cũ `#fafaff`); tối `#16161f` |
| Chế độ tối | Mặt nút chàm sáng `#7c80ff`, viền `#3a3a50`, gờ `#272737` |

Đang tải, rỗng, lỗi, mất mạng: không đổi chữ hay bố cục, chỉ đổi mặt nút như trên.

## 4. Dữ liệu
Chỉ CSS, không đổi dữ liệu, không thêm lệnh máy chủ.

## 5. Ngoại lệ
- **Chữ dài** (nút «Bắt đầu · Chặng 3» hai dòng, tên chương dài): giữ cách xuống dòng cũ; gờ đi theo chiều cao nút.
- **Chữ HOA có dấu** («KIỂM TRA», «TIẾP TỤC»): đủ khoảng dòng, không cắt dấu.
- **Máy yếu**: nút bỏ hẳn kính mờ ⇒ nhẹ hơn hiện tại.
- **Giảm chuyển động**: bỏ hiệu ứng lún.
- **Bấm lặp**: không đổi.
- **Tương phản**:
  - Chữ trắng trên nút chàm: 3,86:1, đạt chuẩn chữ đậm lớn ≥ 3:1 (cũ 5,15:1).
  - Chữ trắng trên nút lục: 2,31:1, ngang Duolingo (xanh lá của họ 2,09:1) nhưng dưới 3:1. Nếu thầy muốn chắc mắt hơn: lục `#00b47f` (2,68:1).

## 6. Chi phí máy chủ
0, không đụng máy chủ.

Byte tải: khi build sẽ SỬA THẲNG các luật nút đang có, thay bóng mờ bằng gờ, không chồng thêm luật. Mục tiêu đường mở `/hs` không vượt mốc. Luật màn làm câu nằm ở `trong-lam-bai.css` nạp lười, không tính vào đường mở.

## 7. Nghiệm thu đo bằng máy
- Test: cập nhật `tests/mau-tuoi-hs-2710.test.ts`, `tests/mau-chat-chi-thi-hs-2710.test.ts` và `tests/toan-man-hs-2810.test.ts` theo màu mới; test mới `tests/nut-net-hs-0711.test.ts` khoá: gờ không mờ (blur 0), viền số nguyên px, mặt nút không trong suốt.
- `npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0; `scripts/do-tuong-phan-hs.mjs` đạt (trừ ngoại lệ lục ở mục 5 nếu thầy chốt màu Duolingo).
- Ảnh Chromium: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px.
- Tác tử tốc độ: cuộn và bấm không chậm hơn bản trước.

## v2 — tươi hết mức + sắc nét hơn (thầy 07/11, sau v1)

| Ảnh `v2/` | Nội dung |
|---|---|
| `01`–`03-truoc-v1-v2-*.jpg` | TRƯỚC · v1 · v2 (Hôm nay, làm câu, kết quả), 390 sáng |
| `04-truoc-v2-toi-390.jpg` | Tối: trước · v2 (3 màn) |
| `05`–`08-v2-<360|768>-<sáng|tối>-3-man.jpg` | v2 đủ 3 màn ở khổ 360 và 768 |

**Màu: độ tươi đẩy tới mép gam sRGB (màu tươi nhất màn hình hiển thị được ở đúng độ sáng ấy).**

| Vai | v1 | v2 |
|---|---|---|
| Chàm chính (nút, chọn, tiến độ) | `#6c71ff` | `#584dff` (5,4:1 với chữ trắng) |
| Gờ chàm | `#4d4bd1` | `#3f00dc` |
| Lục đúng | `#00c289` | `#00ca85` (≈ xanh lá Duolingo) |
| Đỏ sai | `#f13972` | `#f9006c` |
| Lam ngọc / vàng / hồng | màu cũ | `#00dffe`, `#feba00`, `#ff3fd0` |
| Nền nhạt khi chọn / đúng / sai | màu cũ | `#e6eaff`, `#c2ffdd`, `#ffe3e7` |

Màu dùng chung (dấu tích, vòng tiến độ, chấm) cũng đổi sang chàm điện, cho đồng bộ. Nền loang đậm màu hơn (55 / 50 / 45 / 38 %).

**Nét:**
- Viền xám sẫm hơn `#d9d9e5`, gờ `#c6c6d4`, để mép tách hẳn khỏi nền.
- Thẻ lớn và khung đề: mặt gần đặc (94 %), BỎ làm mờ phía sau. Lớp mờ là thứ làm mép nhoè.
- Biểu tượng trong nút: nét 3.
- Chữ nút: 900.
- Dải kết quả có vạch màu 2 px ở mép trên.

Lưu ý:
- **Xanh lá:** muốn tươi hơn `#00ca85` nữa thì chữ trắng trên nút «TIẾP TỤC» gần như không đọc được (1,6–1,8:1).
- **Thanh công cụ nổi:** vẫn là kính (thầy chốt 02/11), không đổi.
- **Bộ màu B:** thầy đã duyệt 27/10 và có test khoá độ sáng ±0,03 theo Duolingo. v2 sẽ cập nhật test theo màu mới khi thầy chốt.
