# Sửa mở ca trên máy khác — 23/09/2026

Phạm vi: nạp địa chỉ máy chủ và gửi ca; không sửa Worker, D1, luật chấm hay luật vào thi.

## Các lỗi tái hiện được

- Máy mới tải được cấu hình nhưng chờ ghi IndexedDB không bao giờ xong, nên không gửi ca.
- Lượt nạp nền đã xong nhưng lượt gọi đang chờ bỏ kết quả, tải lại cấu hình và có thể treo ở lần tải thứ hai.
- Đọc IndexedDB hoặc đọc thân JSON không có giới hạn chờ ở một số nhánh.
- Đường trực tiếp trả HTML 403 bị coi là mật khẩu sai; HTML 200 cũng làm dừng đường dự phòng. Đây là mô phỏng lỗi mạng, chưa có nhật ký từ máy bị lỗi của thầy.

## Thay đổi

Commit mã: 12f1958. Commit kiểm thử: 8b67a00.
Đọc cấu hình cục bộ tối đa 1,5 giây; tải cấu hình tối đa 6 giây và hủy yêu cầu khi quá hạn. Lượt nạp chia sẻ kết quả trong bộ nhớ, lưu bản sao ở nền. Địa chỉ riêng hợp lệ vẫn được ưu tiên. Mật khẩu sai do Worker xác nhận vẫn bị từ chối. HTML từ đường kết nối được thử qua proxy cùng tên miền app.

## Bằng chứng

- 4 trường hợp trong tests/mo-ca-may-khac-2309.test.ts đều thất bại trên cba5c45 và đều đạt trên bản sửa.
- 2 trường hợp HTML 403/200 đều thất bại trước sửa và đạt sau sửa.
- Nhóm 6 tệp liên quan: 53/53 đạt; tệp co-may-chu-toi-may-em-1109: 26/26 đạt.
- TypeScript, bản dựng, service worker 13/13 đạt.
- Toàn bộ 11.194 phép kiểm trên worktree sạch 8b67a00: 97 lỗi / 36 tệp, tất cả có sẵn trong bản đối chứng cba5c45 (99 lỗi / 37 tệp). Không có tên phép kiểm lỗi mới.
- Đã phát hành Pages 2bf68171, sw-version 1790146160. `/`, `/hs`, `/ph` trả 200; SHA-256 gói JavaScript chính khớp bản dựng; hai đường proxy vẫn trả 403 khi không có mã xác thực.

## Giới hạn xác minh

Đường thật Pages và Worker phản hồi; trình duyệt mới đến được màn đăng nhập giáo viên. Không dùng hoặc đoán mật khẩu, không tạo ca thật trong D1. Chưa trực tiếp thao tác được trên thiết bị khác đang lỗi của thầy.

## Bản lùi

Pages trước sửa: 9a865c9a-bd26-42d9-bb41-a4ca2846becf, mã db9839f, sw-version 1790143322.
