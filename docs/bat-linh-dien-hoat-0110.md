# Ghép diễn hoạt Bát Linh vào Đảo và Đoàn · 01/10/2026

**Trạng thái khôi phục:** người dùng yêu cầu quay lại bản cũ sau lần phát hành dưới đây. Đã khôi phục mã và tài nguyên game về `b21a251e`; đang kiểm tra để phát hành lại. Nội dung bên dưới lưu lại bộ diễn hoạt đã rút.

Đã nối bộ tranh vào cảnh trong ải Đảo 2.0, cảnh chiến đấu Đoàn 2.0 và màn tung chưởng cuối hiệp của Đoàn. Đã phát hành lên Cloudflare Pages lúc 20:35 ngày 01/10/2026 (giờ Việt Nam), nguồn `8dc77630`; bước Worker cũng thành công. Cảnh chiến đấu của giao diện đời cũ và Võ đài chưa chuyển sang bộ diễn hoạt này.

[Mở app học sinh](https://omr-app-b3u.pages.dev/hs) · [Quy trình phát hành thành công](https://github.com/dodaihoc4869/omr-app/actions/runs/36868247959) · [Bằng chứng phát hành](bat-linh-dien-hoat-0110/phat-hanh.json). Xác nhận qua trạng thái hai bước đẩy Cloudflare trên GitHub; mạng workspace chặn truy cập trực tiếp `pages.dev`, nên chưa kiểm tra tài nguyên từ website thật sau phát hành.

## Hành vi

- Tám thú có chạy vào sân, đứng thở, lấy đà, phóng chiêu và trúng đòn. Đoàn cuối hiệp có đoạn đấm lấy đà trước chưởng thường.
- Tám hình chưởng riêng: tinh thể đất, thuỷ văn, vòng lửa, phong diệp, tinh đồ, hoa ái, lộc diệp, minh vũ. Có tụ lực, vệt bay, hạt sáng và va chạm. Cuồng nộ/Liên Kích dùng bản mạnh hơn.
- Vị trí theo video: sân ngang 1100×580, thú chính tại x=275, quái x=851; kích thước 335/220. Sân dọc dùng hệ 680×550, x=175/527 và kích thước 285/175. Chiều cao và tỉ lệ tiếp tục co theo khung thật, chân được neo ở 85,2% chiều cao sân. Đồng đội đứng sau, cùng quay về phía quái.
- Cảnh Đảo diễn đòn mới sau kết quả chấm, rồi mở lời giải: thường 2,24 giây, Cuồng nộ 3,13 giây, bản nhẹ 450 ms. Có thể bấm xem lời giải ngay. Gói kết quả gửi lại không kéo dài thời gian chờ; mở lại chuyến không bắn lại.
- Đoàn giữa hiệp đọc kết quả chấm của em; chọn Chắn dựng vòng giáp. Cuối hiệp đọc `KhungNhinHiep`, chỉ thú thực sự ra đòn mới có chưởng. Màn giữ thời hạn ba giây, bỏ qua bằng chạm/nút/Escape như trước.
- Giữ công thức máu Đảo, số máu/sát thương/EXP máy chủ và các lời giải. Bộ vẽ không nhận đáp án và không ghi dữ liệu học tập.

## Tài nguyên và hiệu suất

32 WebP RGBA 1536×1024 trong `public/bat-linh/dien-hoat/`, khoảng 14 MiB cho toàn bộ tám thú. Chỉ tải thú đang có mặt; ảnh gốc PNG không đưa vào bản game. Manifest giữ biên cắt bất đối xứng và đường cắt chéo ở hai tư thế Tinh Lang để không cắt chân/cánh.

Canvas giới hạn độ phân giải, giảm tần suất khi đứng chờ, dừng khi ngoài màn hình hoặc tab ẩn. Giảm chuyển động, máy yếu hoặc lựa chọn giảm hiệu ứng của game dùng hình tĩnh, không tải bảng lớn. Ảnh diễn hoạt lỗi có hình tĩnh dự phòng; trình duyệt thiếu Canvas vẫn giữ hình thú/quái.

## Kiểm chứng

- 11 tệp Vitest liên quan: **78/78 đạt**. Kiểm cả đòn đúng/sai, Cuồng nộ, bỏ qua, mở lại câu, gói chấm lặp, Chắn và số máu thật.
- Chromium: **130 kiểm tra** tám thú ở màn 390/1440; **28 kiểm tra** luồng Đảo ở 360/390/768/844/1440, giảm chuyển động, đổi tùy chọn lúc chơi, dừng vẽ ngoài màn hình, lỗi ảnh và thiếu Canvas. Màn ngang thấp 844×390 đã soi thêm Đoàn và tấm phủ: bảng giải thích đứng cạnh sân.
- 32 ảnh đạt kích thước, kênh RGBA và nền trong suốt. TypeScript, build production và kiểm màu đạt. Trước phát hành đã chạy toàn bộ Vitest: 13.154 ca, 12.997 đạt, 129 lỗi cũ, 28 bỏ qua. Đối chứng 60 tệp lỗi trên main gốc `b21a251e`: đúng 129 ca lỗi theo từng tên, không có lỗi mới. [Báo cáo đối chứng](bat-linh-dien-hoat-0110/hoi-quy-phat-hanh.json).
- Ảnh bằng chứng: [Đảo dọc](bat-linh-dien-hoat-0110/dao-doc.jpg), [Đảo ngang](bat-linh-dien-hoat-0110/dao-ngang.jpg), [Đoàn dọc](bat-linh-dien-hoat-0110/doan-chuong-doc.jpg), [Đoàn ngang](bat-linh-dien-hoat-0110/doan-chuong-ngang.jpg). Mỗi JPG dưới 150 KiB.
- Video quay component thật với máy chủ giả nằm ở `/workspace/scratch/dien-hoat-kiem/dao-doan-dien-hoat.mp4` (H.264, 13,04 giây). Trang xem thử không nằm trong bản build.

Chạy lại kiểm tra trình duyệt khi Vite đang phục vụ kho mã:

```sh
node scripts/kiem-dien-hoat-bat-linh.mjs http://127.0.0.1:5173
node scripts/kiem-luong-dien-hoat-bat-linh.mjs http://127.0.0.1:5173
```

Phần dùng chung: `src/game/than-thu-v2/dien-hoat/`. Muốn đổi mốc phóng/trúng phải đồng bộ tư thế trong `SanDauDienHoat`, hình học `chuong.ts`, âm thanh và các biến thời gian trên HUD; không đổi riêng thời gian mở lời giải.
