# Đồng bộ giờ phòng thi — đã triển khai ngày 18/09/2026

Công tắc ở màn Chi tiết ca, trong khung phòng chờ, trước Bắt đầu thi. Mặc định tắt. Lựa chọn được gửi và lưu cùng thao tác bắt đầu; không thay đổi ca đã bắt đầu.

Bật: mọi lượt dùng mốc bắt đầu của ca cộng số phút của ca. Vào muộn còn thời gian chung. Khôi phục dùng mốc đã lưu; không cộng giờ. Lượt thi lại trong ca dùng cùng mốc, hết giờ không tạo lượt mới. Lượt đang làm được khôi phục để nộp phần bài đã lưu.

Tắt hoặc app cũ không gửi lựa chọn: giữ cách tính theo giờ vào của mỗi em. BTVN không đổi. Thuật toán rút câu, chấm điểm và giao diện còn lại không đổi.

## Triển khai sau khi được duyệt

1. Áp dụng riêng `server/migration-1809-dong-bo-gio.sql` vào D1 (thêm cột mặc định 0). Không chạy migration study-plan đang có trong workspace.
2. Triển khai Worker có hỗ trợ trường mới.
3. Triển khai Pages và xác minh bản mới. Không chỉ đẩy Pages vì Worker cũ không hiểu lựa chọn này.

Đã được thầy duyệt và triển khai: migration đồng bộ giờ, Worker `4db5cfa6-a1c7-4893-8ac3-d65cc5955c97`, Pages `a639a12b`. Bao gồm bản sửa tương phản phiếu làm bài và vùng nút đóng. Kiểm tra bằng SQLite trong bộ nhớ và giao diện với dữ liệu thử; không thao tác ca thi thật.
