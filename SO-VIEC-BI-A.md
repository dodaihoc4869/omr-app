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
- [x] Thầy lệnh 28/09 (nhắc 3 lần): phá bàn chỉ còn tiếng bi chạm bi. Gốc tiếng "lăn lẫn trong phá bàn": (1) bản vẽ còn nguyên tiếng lăn + nút thử "Phá bàn" gọi tiếng lăn; (2) đuôi vang phòng 0,9 s của hàng chục tiếng bi chồng nhau thành tiếng xào xạo. Đã: gỡ tiếng lăn khỏi bản vẽ, phá bàn (game + bản vẽ) chỉ phát tiếng bi chạm bi KHÔ, không gậy/băng/lỗ; bỏ tiếng ầm 0,7 s của rơi lỗ. Đo trên bản vẽ: nút Phá bàn 17 tiếng đều bi-khô; phá bàn thật 22 tiếng đều bi-khô. Test khoá: `tests/bi-a-am-thanh.test.ts`.
- [ ] Phát hành: xếp hàng deploy của phiên Code app (không tự gộp main).
- [ ] Thầy bật thử cho một lớp ở Cài đặt → Bi-a Phản Ứng.

## GĐ2 (chưa làm)
Đấu với bạn, Nhập mã bàn, lời mời, bảng điểm bàn — hai nút đang hiện "Sắp mở".

## GĐ2 — lệnh thầy 28/09: "hãy thực thi giai đoạn 2 luôn"
Đích (đặc tả §11 dòng GĐ2 + §12 "GĐ2 thêm" + §6.2, §6.3, §8.2, G7, G14):
- [ ] Phòng đấu Durable Object `BanBiA` (SQLite, WebSocket Hibernation), khoá theo mã ván | bằng chứng: (chưa có)
- [ ] Đấu đơn online với bạn (2 người) | bằng chứng: (chưa có)
- [ ] Đánh đôi online tối đa 4 người + phòng chờ 4 ghế (thêm A.I ghế trống, đổi chỗ, Bắt đầu khi đủ 4) | bằng chứng: (chưa có)
- [ ] A.I ở ghế trống chạy trên máy chủ bàn; chủ bàn rớt ⇒ ghế nhỏ nhất còn lại chạy A.I | bằng chứng: (chưa có)
- [ ] Mời bạn cùng lớp đang ở Sảnh Bi-a (thấy trong 20 giây), lời mời hết hạn 60 giây, Nhận/Từ chối | bằng chứng: (chưa có)
- [ ] Mã bàn 4 chữ số (tạo / nhập) | bằng chứng: (chưa có)
- [ ] Nối lại (nhận trạng thái đầy đủ) — nghiệm thu: nối lại sau 10 giây | bằng chứng: (chưa có)
- [ ] Rớt mạng > 60 giây: đơn ⇒ người còn lại thắng; đôi ⇒ ghế chuyển A.I, ván không tính Điểm bàn (G14) | bằng chứng: (chưa có)
- [ ] 6 câu nhắn soạn sẵn | bằng chứng: (chưa có)
- [ ] Bàn giao hữu với bạn (mọi em đã xong kế hoạch, còn lượt; không câu, không Điểm bàn) | bằng chứng: (chưa có)
- [ ] Điểm bàn Elo K = 24, khởi đầu 1000, chỉ ván online với bạn toàn người | bằng chứng: (chưa có)
- [ ] Phòng mô phỏng lại mọi cú (vat-ly + luat), 2 máy đánh hết 1 ván, băm trùng sau mỗi cú | bằng chứng: (chưa có)
- [ ] Gói cau_xong giả (attempt không có hoặc sai) bị từ chối | bằng chứng: (chưa có)
- [ ] Số lần đọc D1 mỗi ván ≤ số câu đã trả lời + 2 | bằng chứng: (chưa có)
- [ ] Câu sai: phòng đổi lượt ngay khi nhận cau_xong sai | bằng chứng: (chưa có)
- [ ] Sảnh Bi-a §8.2: nút "Đấu đơn với bạn", "Đánh đôi 2 đấu 2", "Nhập mã bàn", "Tự chơi với A.I"; danh sách bạn đang ở Sảnh + "Mời"; tấm lời mời đến | bằng chứng: (chưa có)
- [ ] Không phá GĐ1 (ván A.I, giao hữu A.I chạy như cũ) + tsc + check:mau + build:cf 13/13 + toàn bộ vitest 0 đỏ mới so với main | bằng chứng: (chưa có)
- [ ] Đẩy nhánh, báo Code app xếp lượt deploy (Worker có DO mới) | bằng chứng: (chưa có)

## Việc thêm giữa chừng
- [!] Thầy 28/09: "cho tôi thêm đặt thời gian bắt đầu chiến dịch nhé." | CHUYỂN LÀN: thuộc làn chiến dịch của phiên Code app (đang sửa src/components/chien-dich/*, srs2-sua.ts) — đã gửi nguyên văn + thiết kế (bảng phụ chien_dich_bat_dau, mốc = max(tao_luc, bat_dau), kế hoạch bỏ qua chiến dịch chưa tới ngày) qua trig_01WcrzMzpquwxrjoywqfDmta lúc 13:03 UTC; Code app báo thầy khi xong.
