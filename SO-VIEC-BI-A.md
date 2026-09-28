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
- [x] Phát hành: xếp hàng deploy của phiên Code app (không tự gộp main). | bằng chứng: Code app gộp PR #43, deploy #541 (GĐ1 lên bản sống)
- [x] Thầy bật thử cho một lớp ở Cài đặt → Bi-a Phản Ứng. | bằng chứng: thầy lệnh bật cho tất cả, Code app đã bật cờ `bi_a`

## GĐ2 — lệnh thầy 28/09: "hãy thực thi giai đoạn 2 luôn"
Đích (đặc tả §11 dòng GĐ2 + §12 "GĐ2 thêm" + §6.2, §6.3, §8.2, G7, G14):
- [x] Phòng đấu Durable Object `BanBiA` (SQLite, WebSocket Hibernation), khoá theo mã ván | bằng chứng: `server/src/bi-a-phong.ts`; `wrangler dev --local` (workerd thật) chạy 3 ván qua phòng; `tests/bi-a-phong.test.ts` 9 test
- [x] Đấu đơn online với bạn (2 người) | bằng chứng: 2 Chromium thật + workerd: S1 mở bàn → mời S2 → Nhận → trọn ván 31 cú (15/16), S2 thắng; ảnh `anh-e2e/02…08`
- [x] Đánh đôi online tối đa 4 người + phòng chờ 4 ghế (thêm A.I ghế trống, đổi chỗ, Bắt đầu khi đủ 4) | bằng chứng: `bi-a-phong` (ghế/đổi chỗ/Bắt đầu), `bi-a-van-mang` đánh đôi 2 người + 2 A.I hết ván, `bi-a-ban-online` Phòng chờ đôi (Thêm A.I/Bỏ A.I/Đổi chỗ/Bắt đầu)
- [x] A.I ở ghế trống chạy trên máy chủ bàn; chủ bàn rớt ⇒ ghế nhỏ nhất còn lại chạy A.I | bằng chứng: `bi-a-van-mang` đôi: chủ bàn rớt 40 giây ⇒ máy B chạy A.I (A.I vẫn đánh), vào lại ⇒ đổi về; lộ + sửa lỗi đứng hình khi đổi máy chủ bàn (3df8f75)
- [x] Mời bạn cùng lớp đang ở Sảnh Bi-a (thấy trong 20 giây), lời mời hết hạn 60 giây, Nhận/Từ chối | bằng chứng: `bi-a-sanh-online` (20 giây/60 giây), `bi-a-ban-online` (tấm Nhận/Từ chối); chạy thật: lời mời tới máy bạn sau 2,9–3,4 giây
- [x] Mã bàn 4 chữ số (tạo / nhập) | bằng chứng: `bi-a-sanh-online`, `bi-a-ban-online` (chỉ nhận số, đủ 4 mới bấm); chạy thật: S4 vào bàn S3 bằng mã 9825
- [x] Nối lại (nhận trạng thái đầy đủ) — nghiệm thu: nối lại sau 10 giây | bằng chứng: `bi-a-phong`, `bi-a-van-mang` (nối lại sau 10 giây, gói đầy đủ = trạng thái phòng; cú mất cùng kết nối cũ không treo máy), `bi-a-ket-noi`; chạy thật: S2 mất mạng 10 giây, S1 thấy "đang nối lại", S2 nối lại rồi khớp băm tới hết ván
- [x] Rớt mạng > 60 giây: đơn ⇒ người còn lại thắng; đôi ⇒ ghế chuyển A.I, ván không tính Điểm bàn (G14) | bằng chứng: `bi-a-tran`, `bi-a-phong`; THÊM mất tín hiệu câm (không gói đóng): phòng đóng sau 70 giây không ping, tính rời từ ping cuối — workerd thật: máy câm đóng ở giây 70, máy ping đều giữ 150 giây (2261b1e)
- [x] 6 câu nhắn soạn sẵn | bằng chứng: `bi-a-phong`, `bi-a-van-mang`, `bi-a-ban-online` (Nhắn → gói nhan, bong bóng ghế bạn); ảnh Nhắn ở 390×844, 844×390, 1280×800 (`anh-e2e/10-nhan-*`)
- [x] Bàn giao hữu với bạn (mọi em đã xong kế hoạch, còn lượt; không câu, không Điểm bàn) | bằng chứng: `bi-a-tran`, `bi-a-sanh-online`, `bi-a-ban-online` (nút "Bàn giao hữu với bạn" tạo bàn loai giao_huu)
- [x] Điểm bàn Elo K = 24, khởi đầu 1000, chỉ ván online với bạn toàn người | bằng chứng: `bi-a-tran`, `bi-a-phong` (±12), `bi-a-van-mang` (đôi có A.I ⇒ 0 dòng); D1 cục bộ sau ván thật: S1 976→966, S2 1024→1034 = tính tay round(24×(0−0,4314)) = −10
- [x] Phòng mô phỏng lại mọi cú (vat-ly + luat), 2 máy đánh hết 1 ván, băm trùng sau mỗi cú | bằng chứng: `bi-a-tran`, `bi-a-phong`, `bi-a-van-mang` (VanMang từng khung 1/60 giây, lech 0); chạy thật 2 Chromium: 31 cú, lech 0 cả hai máy, băm cuối trùng 6cae5cfa
- [x] Gói cau_xong giả (attempt không có hoặc sai) bị từ chối | bằng chứng: `bi-a-phong` (không có lượt trả lời / sai mã câu / trả lời thay bạn)
- [x] Số lần đọc D1 mỗi ván ≤ số câu đã trả lời + 2 | bằng chứng: `bi-a-phong` đếm first/all trên D1 thật (node:sqlite) cả ván
- [x] Câu sai: phòng đổi lượt ngay khi nhận cau_xong sai | bằng chứng: `bi-a-phong`, `bi-a-tran`
- [x] Sảnh Bi-a §8.2: nút "Đấu đơn với bạn", "Đánh đôi 2 đấu 2", "Nhập mã bàn", "Tự chơi với A.I"; danh sách bạn đang ở Sảnh + "Mời"; tấm lời mời đến | bằng chứng: `bi-a-ban-online` 8 test; ảnh `anh-e2e/02-sanh-bia-online`, `04-loi-moi`
- [x] Không phá GĐ1 (ván A.I, giao hữu A.I chạy như cũ) + tsc + check:mau + build:cf 13/13 + toàn bộ vitest 0 đỏ mới so với main | bằng chứng: toàn bộ vitest nhánh 2261b1e vs main 677b1b1: 128 đỏ = 128 đỏ, trùng TÊN, 0 đỏ mới (nhánh 12 134 test, thêm 41); sau gộp main 7ff811e: tsc sạch, build:cf ĐẠT 13/13 (164 tệp / 2 855 KB), 34 tệp test liên quan: 6 đỏ đều đỏ sẵn trên main (khac-phuc-*); check:mau sạch
- [x] Đẩy nhánh, báo Code app xếp lượt deploy (Worker có DO mới) | bằng chứng: đẩy `claude/fervent-edison-otwz9p` (xem Nhật ký DIEU-PHOI 28/09), nhắn phiên Code app qua trigger một lần

## Việc thêm giữa chừng
- [x] Thầy 28/09: "cho tôi thêm đặt thời gian bắt đầu chiến dịch nhé." | ĐÃ XONG ở làn Code app: commit cec9583 "Chiến dịch: đặt NGÀY BẮT ĐẦU" (PR #48 đã vào main). Ghi chú cũ — CHUYỂN LÀN: thuộc làn chiến dịch của phiên Code app (đang sửa src/components/chien-dich/*, srs2-sua.ts) — đã gửi nguyên văn + thiết kế (bảng phụ chien_dich_bat_dau, mốc = max(tao_luc, bat_dau), kế hoạch bỏ qua chiến dịch chưa tới ngày) qua trig_01WcrzMzpquwxrjoywqfDmta lúc 13:03 UTC; Code app báo thầy khi xong.
