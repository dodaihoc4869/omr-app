# Đồng bộ giao diện V2 — 08/10/2026

## Phạm vi

- Đối chiếu ba bản vẽ V2 đã duyệt: giáo viên xanh lam / trắng; học sinh và phụ huynh kem / ngọc / vàng.
- Áp bảng màu gốc khi khởi động, cả CSS nạp muộn; không để chế độ tối của thiết bị ghi đè V2. Giữ lựa chọn cũ trong bộ nhớ, không xóa dữ liệu người dùng.
- Đồng bộ nền, chữ, thẻ, nút, trường nhập, bảng cuộn, hộp thoại và trạng thái phản hồi. Không thay thuật toán phân câu hay kết quả học tập.
- Giáo viên: thẻ chỉ số, chọn khối, nhịp học, danh sách bài; rút gọn hướng dẫn. Hành trình dài hạn không hiển thị hạn nộp giả hàng trăm nghìn ngày.
- Học sinh: tiêu đề hành trình, tiến độ hôm nay, ba chặng học, sửa sai, đảo / đoàn, responsive dọc–ngang–desktop.
- Phụ huynh: thẻ nền sáng, biểu đồ lấy điểm đã công bố, ẩn biểu đồ khi chưa đủ hai điểm. Không dựng số liệu hoặc dự báo giả.

## Kiểm chứng trước phát hành

- 89 kiểm thử / 10 tệp đạt: theme, app phụ huynh, sửa sai, sảnh học sinh, thử sức thêm, điều hướng và hợp đồng vận hành / phân bổ.
- Quét tĩnh 897 tệp: 0 lỗi, 0 cảnh báo (1 miễn trừ có sẵn).
- Kiểm màu và `git diff --check` đạt.
- Bộ chụp `scripts/kiem-v2-ba-app.mjs`: component thật + dữ liệu mô phỏng, chặn mạng ngoài localhost, ba kích thước 390×844 / 844×390 / 1440×960, thiết bị giả lập chế độ tối.
- Lượt đầu 33 tổ hợp màn/kích thước không lỗi JavaScript, không tràn ngang trang. Lượt bổ sung kiểm màn sửa sai, hộp chọn bài và tab phụ huynh. Ảnh không phải dữ liệu học sinh trên production.

## Giới hạn cần nói rõ

Đây là triển khai hệ thiết kế V2 trên dữ liệu và component thật, không phải chứng nhận pixel-perfect 100% mọi trạng thái. Bộ minh họa thần thú hiện có được giữ lại; chưa thay bằng bộ hình mới giống hệt minh họa concept V2. Các chỉ số chưa có API tương ứng không được gán số minh họa của bản vẽ.
