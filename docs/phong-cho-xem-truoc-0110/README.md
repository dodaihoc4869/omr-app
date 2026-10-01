# Xem trước game phòng chờ · 01/10/2026

Người dùng yêu cầu làm mini-game phòng chờ học sinh hấp dẫn hơn nhưng vẫn đơn giản, và xem trước khi build. Mẫu này chạy độc lập bằng Vite dev với dữ liệu ca mẫu; chưa build, chưa ghép vào `PhongChoGame` hay luồng thi, chưa phát hành.

Hướng thiết kế: “Chuyến bay hóa học”, trời xanh ngọc, đồi dịu và phi công dù hai màu. Một khung chơi, một điểm số, một mẩu kiến thức khi nhặt hạt. Thông báo chờ Thầy bắt đầu, tên ca/lớp/thời lượng nằm trên game. Có kéo/chạm, phím trái/phải, nút tạm dừng, nền sáng/tối. Điểm chơi chỉ giữ trong lượt xem thử; không ghi điểm/EXP/hồ sơ học sinh.

Toàn cảnh và nhân vật vẽ Canvas, không cần thêm ảnh lớn. Vẽ khoảng 30 FPS, tối đa 6 hạt, DPR ≤ 1,5, nền tĩnh lưu riêng; dừng khi tab ẩn hoặc tạm dừng. Giảm chuyển động dùng hình tĩnh và nhặt bằng chạm. Đây là thiết kế dự kiến; chưa đo hiệu năng trên thiết bị học sinh thật.

Kiểm Chromium: 15 ca đạt, gồm 360/390/768/844/1440 không tràn ngang, không lỗi JS, nhặt tăng điểm thật, dừng hình, giảm chuyển động vẫn chơi được. Nút mô phỏng Thầy bắt đầu tháo game khỏi màn: không phải nối thử vào ca thi thật.

Ảnh chụp từ mẫu đang chạy: `may-tinh.jpg`, `dien-thoai.jpg`, `nen-toi.jpg`, mỗi ảnh < 150 KiB. `choi-thu.mp4` quay thao tác thật, ghi nhận điểm chơi tăng lên 10.

Chạy lại:

```sh
npm run dev -- --host 0.0.0.0 --port 5186
```

Mở `/src/components/phong-cho-xem-truoc/xem-truoc.html`, thêm `?nen=toi` để xem nền tối. Mã mẫu ở `src/components/phong-cho-xem-truoc/`; không có đường import từ app chính. Chỉ ghép vào component thật sau khi người dùng xem và duyệt mẫu.
