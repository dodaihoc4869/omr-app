# Bình Phản Ứng: nền dịu mắt, chữ to, lên bảng dùng tờ chiếu cũ

Bản vẽ ngày 08/11/2026, đang chờ thầy duyệt.

Thầy (ảnh máy chiếu buổi 08/11): «Chữ quá nhỏ, tôi muốn màn hình điểm danh nền phải dịu mắt giống với màn chiếu cũ, đo chính xác, khi gọi hs lên bảng thì chuyển về màn chiếu cũ (bỏ màn chiếu mới đi) khi bấm đạt hoặc ko đạt thì tự động chuyển sang bình phản ứng. Vẽ trước tôi duyệt.»

## 1. Màu nền: đúng bảng màu tờ chiếu cũ

Các giá trị lấy thẳng từ `src/lib/giao-dien-to-chieu.ts`, không pha màu mới:

| Phần | Màu |
|---|---|
| Nền bảng «tắt sáng» | `#15181c` |
| Giấy ấm | `#f4efe4` |
| Chữ | `#22262b` |
| Chữ phụ | `#5b6168` |
| Thẻ | `#e7e1d3` |
| Màu nhấn | `#0b57d0` (nền sáng), `#a8c7fa` (nền tối) |

Bảng màu này cố định cho máy chiếu: không đổi theo chế độ sáng / tối của máy thầy.

Hai phương án để thầy chọn:

- **A: Giấy ấm toàn màn.** Cả màn là tấm giấy kem của tờ cũ, chữ sẫm.
- **B: Bảng tối + tấm giấy.** Giống y tờ cũ: nền tối, đề và thẻ tên em là tấm giấy ấm. Ống nghiệm, bình và ngọn lửa đội nổi rõ trên nền tối.

## 2. Chữ to

Số đo ở khổ 1920 px:

| Phần | Trước | Sau |
|---|---|---|
| Ý đúng–sai / phương án | 30 × k px (khoảng 22 px trên máy chiếu thầy) | 46 × k px, bằng cỡ đề |
| Đề | 50 × k px | 46 × k px, nét thường cho dễ đọc |
| Tên em trên ô | khoảng 22–24 px | 36 px; tên dài vẫn tự co vừa ô |
| Nhãn đầu màn (Lượt, lớp) | 26 px | 30 px |

Đề dài thì có thanh cuộn như cũ.

## 3. Gọi em lên bảng: dùng tờ chiếu cũ

1. **Bình Phản Ứng:** thầy bấm Space, máy chọn em như cũ (ô tên sáng lên).
2. **Bảng tự ẩn, hiện tờ chiếu cũ** ở đúng câu đó:
   - màn «Mời em lên bảng · tên em» (vòng vàng);
   - sau đó đề chiếm 2/3 màn, cột 1/3 tối để em viết, thẻ tên ở góc.
   - Màn gọi tên mới và vùng viết mới của bảng bị bỏ.
3. **Chấm:** thầy bấm D (Đạt) hoặc K (Chưa đạt) trên tờ, hoặc bấm nút. Tờ báo về bảng, bảng tự hiện lại và mở đáp án. Dải «Lên bảng: Thu Hà · Đạt · Đội Kali +200» giữ nguyên.
4. **Ghi kết quả:** chỉ ghi một lần, qua Bình Phản Ứng (`chamLenBang`), để đội được cộng kJ. Tờ không ghi thêm lần thứ hai.

## 4. Ảnh

Ảnh chụp từ giao diện thật bằng Chromium, khổ 1920×1080.

- `1-so-sanh-nen-chu.jpg`: hiện tại / A / B, ở màn trả lời (đã bấm M) và màn điểm danh.
- `2-luong-len-bang.jpg`: bốn bước gọi lên bảng.
- `A-*.jpg`, `B-*.jpg`: từng màn ở khổ lớn.
