# Bản vẽ app giáo viên — Game Hóa 2.0 (28/09/2026) — CHỜ THẦY CHỐT, chưa build

Lệnh thầy 28/09: thiết kế lại app giáo viên chuyên nghiệp, số liệu khoa học, bỏ phần không liên quan, đổi tên dễ hiểu. Rà soát chi tiết: `RA-SOAT.md`.
Mỗi màn một tệp HTML tự chứa 1440×900 (`GV-*.dc.html`) + ảnh Chromium thật cùng tên (`.jpg`).

| Tệp | Màn |
|---|---|
| GV-TongQuan | Trang đầu mới: ca đang mở, chiến dịch đang chạy, việc cần làm, xu hướng 14 ngày |
| GV-CaKiemTra | Danh sách ca dạng bảng + mẫu trạng thái trống (một dòng chữ, không ảnh) |
| GV-GiaoChienDich | 3 bước: tờ đề (cây thu gọn) · chọn em (ô nhiều tầng Khối › Lớp › Em) · hạn + lượt/ngày; tóm tắt cố định bên phải |
| GV-ChienDichDaGiao | Bảng mọi chiến dịch: đã làm qua, thành thạo, đúng nhịp, quá tải, cần dạy lại, hạn |
| GV-BangChienDich | Thẻ số · heatmap em × dạng · nhịp lớp · cần thầy dạy lại · hạng theo dạng |
| GV-BuoiChua | Hết hạn: câu chữa theo điểm chữa, người lên bảng, Đạt / Chưa đạt, tờ máy chiếu |
| GV-HocSinh | Hồ sơ một em: năng lực theo dạng, theo mức độ, điểm ca, chiến dịch của em |
| GV-ThanhBen | Ngăn kéo · rail · điện thoại 390 px + bảng Trước → Sau + Cài đặt gọn |

## Nguyên tắc
1. **Lưới**: thanh bên 240 px; vùng chính lề 28 px; khoảng cách 12/16 px; thẻ bo 12 px, viền 1 px, không bóng. Hàng thẻ số (KPI) luôn ở trên, bảng/biểu đồ bên dưới, cột phải 310–372 px cho việc cần làm.
2. **Một nút chính mỗi màn** (xanh đặc): Mở ca kiểm tra (thanh bên), Giao chiến dịch, Chiếu câu lên bảng, Mở tờ máy chiếu. Còn lại là nút viền hoặc chữ.
3. **Cách hiện số**: luôn có NHÃN + ĐƠN VỊ + MẪU SỐ (`39 / 44 em`, `6,8 / 10`, `84 / 90 phút`) và một dòng SO SÁNH (hôm qua, tuần trước, trung bình lớp, mức cần hôm nay). Số dùng `tabular-nums`, dấu phẩy thập phân, dấu chấm hàng nghìn (`4.812`).
4. **Màu trạng thái** (kèm chữ, không bao giờ chỉ màu): xanh lá = đúng nhịp / đạt · vàng = sát / chờ buổi chữa / trễ 1–2 ngày · đỏ = chậm nhịp / chưa đạt / trễ từ 3 ngày / cần dạy lại · xám = đã đóng / chưa chữa · xanh dương = hành động, đang chiếu.
5. **Độ lớn dùng MỘT dải xanh dương nhạt → đậm** (heatmap, hạng theo dạng, mức độ). Hạng: Yếu < 40% · Trung bình 40–59% · Khá 60–79% · Giỏi ≥ 80%; ô "Chưa làm" gạch chéo. Số % luôn in trong ô.
6. **Vạch đen trên thanh** = mức lớp cần đạt hôm nay (tiến độ) hoặc trung bình lớp (hồ sơ em).
7. **Không mã nội bộ làm tên**: mã ca chỉ ở dòng phụ chữ nhỏ; không qid, không mã tờ đề.
8. **Tên mới**: Tổng quan · Chiến dịch luyện · Chữa trên lớp (thanh đáy: Chữa bài) · Kho đề · Đã làm qua (thay Cọ xát) · Quá tải hôm nay (thay Huyết Chiến ở app thầy) · Số lượt câu mỗi ngày (thay Thể lực).
9. Màu lấy từ `src/styles/tokens.css` (`--bts-*` bản sáng) và `m3-theme.css` (`--m3-primary*`); phông Be Vietnam Pro.

## Cần thầy chốt
- Ngưỡng màu ô heatmap đổi từ 4 mức cũ (≥70 / 40–69 / 20–39 / <20, xanh–vàng–đỏ) sang 4 hạng Yếu/Trung bình/Khá/Giỏi một dải màu.
- "Lên bảng" → "Chữa trên lớp"; "Cọ xát" → "Đã làm qua"; "Huyết Chiến" (app thầy) → "Quá tải hôm nay".
- Ngân hàng đề (đổi tên Kho đề) ở đáy thanh bên, hay cất hẳn vào Cài đặt.
