# Rà soát giao diện 3 ứng dụng — 07/10/2026

Phạm vi tự động gồm cổng giáo viên (`/gv`), học sinh (`/hs`) và phụ huynh (`/ph`) ở 360, 390, 768 và 1440 px; mỗi kích thước được kiểm tra trong chế độ sáng và tối. Báo cáo đo tràn ngang, nhãn điều khiển, vùng chạm và lỗi JavaScript trên trang.

Chạy lại khi máy phát triển đang mở ở cổng 5198:

```bash
node scripts/kiem-3-app.mjs
```

Kết quả máy đọc nằm trong `ket-qua.json`; ảnh thật được lưu cho khung 390 và 1440 px của cả hai chế độ màu.

## Kết quả

- Quét tĩnh 880 tệp: 0 lỗi, 0 cảnh báo giao diện.
- Kiểm tra trình duyệt 24 tổ hợp: 0 tràn ngang, 0 điều khiển thiếu nhãn, 0 vùng chạm nhỏ, 0 lỗi JavaScript.
- Kiểm tra màu: không có mã màu hex ngoài tệp token; bảng màu đang dùng được giữ nguyên.
- Kiểm tra hiển thị câu hỏi: 18/18 phép đạt; vùng chạm của phiếu câu hỏi đạt tối thiểu 48 px.
- Bản dựng Cloudflare đạt; service worker đạt 13/13 phép.

Các thay đổi tập trung vào nhãn trợ năng, tiêu điểm bàn phím, giờ 24 tiếng, ảnh có kích thước giữ chỗ, chuyển động tôn trọng chế độ giảm hiệu ứng, vùng chạm 44 px, thuật ngữ “ca/bài kiểm tra” và loại các câu hướng dẫn lặp lại thao tác đã thể hiện bằng nút.
