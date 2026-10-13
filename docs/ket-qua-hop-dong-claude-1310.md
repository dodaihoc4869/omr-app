# Kết quả bốn việc Claude giao — 13/10/2026

Bình luận gốc: https://github.com/dodaihoc4869/omr-app/pull/258#issuecomment-6138873108.
Đã đọc dòng đầu DIEU-PHOI và hợp đồng trên main dc4512ec; đã gộp main e4f69136 (chỉ thêm tài liệu/AGENTS, mã chạy giống dc4512ec). Đồng ý hợp đồng; xác nhận trong Nhật ký.

## Sửa gốc

- Tái hiện đúng 26 test đỏ trong 6 tệp trước sửa. Mock Zustand giữ getState, IndexedDB giữ đọc/lưu buổi chữa và nguồn chọn người có bằng chứng.
- SỬA CÓ CHỦ ĐÍCH 13/10: bộ chữa giữ Fisher–Yates thật với mã buổi cố định; tính toán/khó/lớp sai nhiều chung một nhóm, câu còn lại theo đề. Tờ và bảng gọi người tự đúng/dự đoán; receipt vẫn khoá đúng SBD/câu. Các kiểm giao thức/chấm/phím tắt vẫn chạy thật bằng JSDOM, không skip hay nới điều kiện.
- Giữ thống kê 3/4 em sai thật; điều kiện ít nhất 5 em chỉ dùng quyết định nhóm ưu tiên, không giấu số liệu lớp nhỏ.
- Bỏ lượt đọc lịch sử người cũ khi dựng tờ vì kết quả bị ghi đè ngay sau đó; bảng tự đọc khi người gọi đổi. Không đổi chấm ca thi.
- Nộp còn câu trống dùng HopXacNhan; kiểm huỷ không nộp và đồng ý mới nộp. Đồng hồ 1 giây chỉ vẽ tại máy; hết hạn chốt một lần, dọn khi rời màn, đã xếp loại bảng nhịp và ghi sổ.
- TheKiemTraCon dùng tvc-the/tvc-dau/tvc-phu/tvc-hop của trang mới, giữ nguyên chữ/luồng, không thêm CSS/màu. Chromium 390×844, 844×390, 1440×900 × sáng/tối: 0 lỗi JS/0 tràn ngang; dữ liệu ảnh là giả lập, không chứng cứ lịch thật.

## Kiểm

| Cổng | Kết quả |
|---|---|
| 7 tệp liên quan (gồm luồng PH đợt19) | 74/74 đạt; PH 3/3 |
| Frontend TS (tsc -b qua build), server TS | đạt |
| npm run build && npm run kiem:toc-do | 0 đỏ; không nâng mốc |
| node scripts/kiem-sw.mjs | 13/13; 169 tệp, khoảng 2733 KiB |
| check:mau / kiem:mau-giu | đạt / 0 vi phạm |
| Full main dc4512ec | 15481 đạt / 162 đỏ |
| Full nhánh | 15503 đạt / 141 đỏ |
| Đối chiếu tên + kiểm lại cùng 5 tệp trên main/nhánh | 0 lỗi mới còn tái hiện; mỗi bên 30 đạt / 1 đỏ giống tên |

Năm tên chỉ đỏ ở lượt full nhánh đã được chạy lại với cùng lệnh/maxWorkers=1 trên cả hai bên: lịch BTVN, D1 sảnh, migration cục bộ, liên kết PH đều đạt. Phép rà no-use-before-define báo cùng 355 chỗ nền trên cả hai bên; không mở rộng allowlist. Không gọi toàn repo xanh. Các tên đã đổi theo hợp đồng mới có chú thích SỬA CÓ CHỦ ĐÍCH 13/10.

Actions deploy.yml được kiểm trước mở PR: không có lượt đang chạy. Đợt main e4f69136 đã thất bại ở cổng D1 quá tải7429 trước khi đổi Worker/Pages. Claude đã tạm tắt cờ kiểm tra riêng (run38353377657); PR này không bật cờ, không đổi lịch/schema/D1 thật.

## Phạm vi còn lại

Phản ánh 333 câu/475 phút được xử lý ở nhánh riêng codex/de-kiem-tra-2026-1310. Chưa phát hành thuật toán mới; không trộn vào PR bốn việc này. Cần giữ cờ tắt tới khi chốt khung 28 câu/50 phút và nguồn đủ; PR này mở cho Claude soát theo hợp đồng.
