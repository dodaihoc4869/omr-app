# Ghép Chuyến bay hóa học vào phòng chờ thật · 01/10/2026

Đã phát hành lúc21:51 ngày01/10/2026 (VN), nguồn d66e2603; [Actions36877799904](https://github.com/dodaihoc4869/omr-app/actions/runs/36877799904) tổng Success. Cloudflare Pages hoàn tất14:51:35Z, Worker14:51:44Z, đều success. App: https://omr-app-b3u.pages.dev/hs. Bằng chứng `phat-hanh.json`. Xác nhận qua GitHub; proxy workspace chặn truy cập pages.dev nên chưa kiểm tra trực tiếp website thật.

Người dùng duyệt mẫu bằng yêu cầu “đẩy lên app đi nhé”. `PhongChoGame` nay hiển thị dữ liệu ca/lớp/thời lượng và lỗi kết nối từ props thật; giữ câu “Đang chờ Thầy bấm bắt đầu”. Mini-game vẽ dù, phi công, hạt hóa học, điểm cục bộ và mẩu kiến thức bằng Canvas, có kéo/chạm, phím trái/phải, tạm dừng và sáng/tối. Mã `ExamTakeScreen`, nhịp hỏi máy chủ, luật vào thi và dữ liệu máy chủ không đổi.

Chỉ tải `ChuyenBay` khi màn chờ xuất hiện, có trạng thái tải riêng. Canvas dừng khi pause, tab ẩn hoặc ngoài màn; giảm chuyển động/máy yếu dùng nhặt hạt bằng chạm. Đổi nền không đặt lại điểm. Thiếu Canvas vẫn giữ thông báo chờ. Khi cha chuyển vào bài, mini-game được tháo và huỷ vòng vẽ/listener.

Rào lỗi riêng của ô chơi giữ màn chờ nếu mảnh JS/CSS mini-game không tải được. Hai ca chặn yêu cầu tải ChuyenBay đã đạt: thông báo chờ còn hiện, cha vẫn chuyển vào bài. Kết quả `kiem-loi-tai.json`; tổng kiểm trình duyệt27 ca. Chạy lại122 ca liên quan và build sau bổ sung rào đều đạt.

CSS có biến và bộ chọn riêng của phòng chờ; không thay nền hay kiểu nút toàn app. Không thêm ảnh lớn, không ghi điểm/EXP, không có nút mô phỏng hay dữ liệu ca mẫu trong entry app thật.

- 122/122 ca liên quan đạt; sau tách tải lười, chạy lại nhóm A2/phòng chờ 16/16 đạt.
- 25 kiểm Chromium với component thật và props mẫu: 360/390/768/844/1440, pause dừng vẽ, nhặt tăng điểm, đổi nền giữ điểm, lỗi kết nối, chuyển vào bài khi pause, cleanup, giảm chuyển động, máy yếu, thiếu Canvas và ngoài màn. Hộp kiểm mô phỏng cha chuyển màn; không gọi ca thi thật.
- TypeScript, build, kiểm màu đạt. SW13/13,163 tệp2996 KiB; mảnh JS/CSS ChuyenBay nằm ngoài precache, dùng cache chạy-lúc hiện có. Toàn Vitest trên mã phòng chờ cuối24006b6b:13.148 ca,12.993 đạt/127 lỗi/28 bỏ qua;127 tên lỗi trùng nền,không có lỗi mới. Chi tiết `hoi-quy-phat-hanh.json`. CI cũng kiểm toàn bộ trước bước đẩy Cloudflare.
- Vòng toàn bộ đầu phát hiện CSS tương thích chưa sinh lại sau đổi lớp của PhongChoGame. Đã chạy trình sinh chính thức, bỏ15 luật cũ không còn trong danh sách nguồn; nhóm M3 A2/B/C36/36 đạt. Build lại sau sinh CSS đạt; toàn bộ trên mã cuối đã đối chiếu nền,không có lỗi mới.
- Ảnh component thật: `app-doc.jpg`, `app-ngang.jpg`, `app-toi.jpg`; kết quả trình duyệt `kiem-that.json`.

Phát hành từ worktree sạch theo `.github/workflows/deploy.yml`. Mốc lùi: `1eed4375` (mã triển khai trước `bb31ac4d`, Actions36870909750). Bản xem trước eb3c1584 được giữ riêng; README mẫu ghi đúng trạng thái tại thời điểm xem mẫu.

Bản main d66e2603 gộp cập nhật khác đã hủy lượt24006b6b theo quy tắc concurrency; mã PhongChoGame và ChuyenBay không đổi. Đã kiểm lại122/122 liên quan và build/TypeScript/SW13/13 trên mã gộp,163 tệp2991 KB. Lượt thay thế: Actions36877799904/job110421834074. Các thay đổi khác của bản gộp không thuộc phần phòng chờ.
