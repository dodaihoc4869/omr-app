# Sổ việc · Bi-a Phản Ứng (GĐ1)

Lệnh thầy 28/09: "HÃY THỰC THI PROMPT NÀY" — build GĐ1 theo `prompt-bi-a-phan-ung.md` + `DAC-TA-BI-A-PHAN-UNG-2809.md` (đặc tả thắng khi vênh).
Phiên: cloud, nhánh `claude/fervent-edison-otwz9p`. Không có khoá Cloudflare ⇒ phát hành nhờ Code 3 (Worker + migration) và Code 2 (Pages).

## Việc
- [x] Máy chủ: `server/src/bi-a.ts` (bia-sanh / bia-xep-ban / bia-doi-cau / bia-ket-van), trần 40% mỗi phần, cờ `cau_hinh.bi_a`, khoá khi có ca, Bàn giao hữu ≤ 2 ván/ngày.
- [x] Chống lẫn Đảo/Đoàn: `resume` bỏ phiên Bi-a; `dieuKienLoaiPhien('dao')` loại `$.bia`; `startDao2`/`startDoan2` chặn câu đang giữ trong ván Bi-a mở.
- [x] Bảng `bi_a_van`, `bi_a_ghe` (+ 3 bảng GĐ2) — `server/migration-2809-bi-a.sql`, CHỈ THÊM. Reset Hóa 2.0 xoá; reset toàn app giữ.
- [x] Công tắc thầy ở Cài đặt (`CongTacBia.tsx`, `bia-co-doc`/`bia-co-luu`). Mặc định TẮT.
- [x] Lõi game thuần TS `src/game/bi-a/`: nguyên tố, vật lý (bước 1/240 s, tất định), luật đơn/đôi, A.I, dự đoán Mắt thần, bố cục 3 kiểu, vẽ bi, âm thanh tổng hợp 15 tiếng.
- [x] Giao diện: Sảnh Bi-a, màn chơi, tấm câu dùng `TheCauAi`/`KhoiLoiGiai` của Đảo 2.0, câu sai sang lượt ngay, "Đã đọc lời giải", "Xem lại câu sai", toàn màn hình, rời ván, kết ván.
- [x] Nối app: cửa thứ ba trên Sảnh Bát Linh (`NutBia`), tab `bia` ở `StudentPortalScreen` (tải lười).
- [x] Trang thử `src/game/bi-a/xem-thu.html` (máy chủ giả, chỉ `npm run dev`).
- [x] Chạy thật bằng Playwright: đơn 360/390/1280, đôi 390/844×390/1440 — trọn ván tới kết ván, 0 lỗi JS, không tràn ngang; toàn màn hình vào/ra ở 390, 844×390, 1280.
- [x] Sửa sau chạy thật: (1) đang mở Xem lại câu sai mà đồng đội A.I đánh bi của em vào lỗ ⇒ tấm xem lại che tấm câu, em không bấm được — nay tự đóng; (2) câu hết giờ chưa chọn đủ (không gửi máy chủ) bị đếm là câu sai "đã vào lịch ôn" — nay không đếm; (3) lớp phủ tấm câu lộ chữ màn chơi — nền mờ + thanh đầu đặc; (4) chip toàn màn hình dọc bị cắt chữ — rút gọn khi hẹp.
- [x] Cập nhật đặc tả theo chỗ làm khác (bia-xep-ban trả danh sách câu, bia-doi-cau nhận `qidCu`+`chot`, luật hết giờ, cách xét ca) + `docs/hop-dong-bi-a.md`.
- [x] Precache PWA về lại 146 tệp / 2 901 KB (kiem-sw ĐẠT): loại `BiaGame`, `TrongAi`, `ngang` khỏi precache (`vite.config.ts` globIgnores) — phiên Code app nhắc trần 3 000 KB lúc 11:25 UTC.
- [x] Phiên Code app kiểm thử gộp (11:29 UTC) ⇒ đã: gộp `origin/main` 441cc5e (gỡ 3 xung đột), precache 169 / 2 941 KB (`build:cf` 13/13), bảng `bi_a_*` tự dựng lúc chạy (CI không chạy migration), tên đối thủ "A.I" thay "A.I Đỗ Đại Học" (test khoá `chu-thay-hoc-sinh-2809`).
- [x] Thầy lệnh 28/09: bỏ hẳn tiếng bi lăn trên nỉ.
- [ ] Phát hành: xếp hàng deploy của phiên Code app (không tự gộp main).
- [ ] Thầy bật thử cho một lớp ở Cài đặt → Bi-a Phản Ứng.

## GĐ2 (chưa làm)
Đấu với bạn, Nhập mã bàn, lời mời, bảng điểm bàn — hai nút đang hiện "Sắp mở".
