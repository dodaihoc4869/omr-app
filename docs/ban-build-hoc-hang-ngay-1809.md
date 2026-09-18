# Bản build giao diện học hằng ngày, 18/09/2026

Đã build tại máy. Chưa phát hành lên app đang dùng.

- Học sinh: đưa việc cần làm lên trước vinh danh và thần thú; ưu tiên bài gần hạn, mỗi bài một ô. BTVN quá hạn hướng dẫn báo Thầy gia hạn; bài gia đình giao hết giờ hướng dẫn hoàn tất nộp phần đã lưu. Giữ nút xem bài đã nộp.
- Phụ huynh: hiển thị hạn bài gia đình giao, phân biệt chưa bắt đầu, đang làm và đã nộp. Bỏ nhận xét nắm chắc kiến thức chỉ dựa vào một điểm cao. Phần này chưa tổng hợp BTVN Thầy giao.
- Giáo viên: mở mục bài đã giao trước, đếm lượt bài chưa nộp gần hạn/quá hạn, sắp theo hạn. Nhập và sửa hạn theo giờ Việt Nam; từ chối ngày không hợp lệ hoặc đã qua.
- Chuỗi ngày học tính từ ngày nộp thật, không suy ra từ số bài thi. Thiếu số câu thì không tự cộng 10 câu. Mốc luyện thêm không thay yêu cầu bài được giao.
- Bài gia đình giao giữ luật máy chủ: 120 phút từ lúc bắt đầu. Không thay luật nộp, chấm, phần thưởng hoặc thuật toán rút câu. Payload mở bài và các vòng giữ nguyên.

## Kiểm tra

Build thành công. 119 kiểm tra trong 11 tệp đạt, gồm hạn nộp, ngày Việt Nam, cập nhật hạn khi đang mở màn, payload mở bài, rút câu và nộp bài.

Bộ man-phan-cong-btvn-1209 có 12 lỗi; đối chiếu mã HEAD trước khi sửa cũng có đúng 12 lỗi đó. Không sửa các kiểm tra cũ ngoài phạm vi.

Hai bảng học sinh/phụ huynh đã kiểm tra bằng Chromium ở 360px và 1280px, không tràn ngang. Dữ liệu xem thử là dữ liệu mẫu; chưa kiểm thử tài khoản thật hoặc nộp bài lên máy chủ.

## Phạm vi còn lại

Chưa xây dựng hồ sơ mức độ nắm kiến thức dùng chung trên máy chủ, lịch ôn giãn cách đồng bộ ba app hoặc đánh giá hiệu quả học tập qua thử nghiệm lớp. Không coi số câu đã nộp là bằng chứng đã nắm chắc kiến thức.

## Đã phát hành 18/09/2026

Đã cập nhật 12 phép kiểm giao bài cũ theo cấu trúc hiện tại. Sửa lỗi chuyển tab khi giao thất bại, thêm hướng dẫn khi kho trống và thống nhất giờ Việt Nam trong thông báo giao bài.

160 kiểm tra liên quan đạt; thêm 1 kiểm tra nhãn làm lại đạt. Build thành công, service worker 10/10. Chạy rộng ghi nhận 106 lỗi trước khi cập nhật kiểm tra; đối chiếu HEAD xác nhận 105 lỗi đã có sẵn, lỗi thêm là nhãn đã đổi và đã được cập nhật. Chưa xử lý toàn bộ lỗi cũ ngoài phạm vi.

Đã phát hành Cloudflare Pages: https://23a7efd4.omr-app-b3u.pages.dev . Địa chỉ chính: https://omr-app-b3u.pages.dev . Tem bản dựng: 1789711340. Bản trước: 260fbdb6-148a-411f-b6a1-6c29119f8c75.

Không thay đổi hoặc triển khai lại Worker xử lý bài; không sửa thuật toán rút câu, dữ liệu bài làm hay cơ sở dữ liệu.
