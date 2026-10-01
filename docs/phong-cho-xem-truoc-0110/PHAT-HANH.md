# Ghép Chuyến bay hóa học vào phòng chờ thật · 01/10/2026

Người dùng duyệt mẫu bằng yêu cầu “đẩy lên app đi nhé”. `PhongChoGame` nay hiển thị dữ liệu ca/lớp/thời lượng và lỗi kết nối từ props thật; giữ câu “Đang chờ Thầy bấm bắt đầu”. Mini-game vẽ dù, phi công, hạt hóa học, điểm cục bộ và mẩu kiến thức bằng Canvas, có kéo/chạm, phím trái/phải, tạm dừng và sáng/tối. Mã `ExamTakeScreen`, nhịp hỏi máy chủ, luật vào thi và dữ liệu máy chủ không đổi.

Chỉ tải `ChuyenBay` khi màn chờ xuất hiện, có trạng thái tải riêng. Canvas dừng khi pause, tab ẩn hoặc ngoài màn; giảm chuyển động/máy yếu dùng nhặt hạt bằng chạm. Đổi nền không đặt lại điểm. Thiếu Canvas vẫn giữ thông báo chờ. Khi cha chuyển vào bài, mini-game được tháo và huỷ vòng vẽ/listener.

CSS có biến và bộ chọn riêng của phòng chờ; không thay nền hay kiểu nút toàn app. Không thêm ảnh lớn, không ghi điểm/EXP, không có nút mô phỏng hay dữ liệu ca mẫu trong entry app thật.

- 122/122 ca liên quan đạt; sau tách tải lười, chạy lại nhóm A2/phòng chờ 16/16 đạt.
- 25 kiểm Chromium với component thật và props mẫu: 360/390/768/844/1440, pause dừng vẽ, nhặt tăng điểm, đổi nền giữ điểm, lỗi kết nối, chuyển vào bài khi pause, cleanup, giảm chuyển động, máy yếu, thiếu Canvas và ngoài màn. Hộp kiểm mô phỏng cha chuyển màn; không gọi ca thi thật.
- TypeScript, build, kiểm màu đạt. SW13/13,163 tệp2996 KiB; mảnh JS/CSS ChuyenBay nằm ngoài precache, dùng cache chạy-lúc hiện có. Toàn Vitest đang chạy; CI cũng kiểm toàn bộ trước bước đẩy Cloudflare.
- Ảnh component thật: `app-doc.jpg`, `app-ngang.jpg`, `app-toi.jpg`; kết quả trình duyệt `kiem-that.json`.

Phát hành từ worktree sạch theo `.github/workflows/deploy.yml`. Mốc lùi: `1eed4375` (mã triển khai trước `bb31ac4d`, Actions36870909750). Bản xem trước eb3c1584 được giữ riêng; README mẫu ghi đúng trạng thái tại thời điểm xem mẫu.
