# RESET TOÀN APP 00:01 thứ Hai 21/09/2026 — vận hành và CÁCH KHÔI PHỤC

Người viết: Code 3 (máy chủ). Mã: `server/src/reset-toan-app.ts` (job), `tests/reset-toan-app-1909.test.ts` (23 test SQLite thật, 20 đột biến). Hợp đồng cho máy khách: `docs/moc-reset-1909.md`.
Thầy chốt (19/09): "reset toàn app xoá hết ca thi và toàn bộ dữ liệu vào 00:01 thứ 2 để app mới hoàn toàn công bằng cho học sinh".

## 1. Job làm gì, đúng một lần

**AN TOÀN MẶC ĐỊNH — cờ "lên đạn".** Job CHỈ chạy (và cổng đóng băng CHỈ bật) khi `cau_hinh.reset_20260921_cho_phep` = `true`. Không có cờ ⇒ 00:01 thứ Hai KHÔNG xoá gì, KHÔNG đóng băng gì, `/reset/dry-run` vẫn chạy. Chỉ bật sau khi: export xong + dryRun khớp + 0.Planer báo thầy. Cờ HUỶ (`reset_20260921_huy`) THẮNG cờ cho phép.

Bật cờ: `cd server && npx wrangler d1 execute omr --remote -y --command "INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_20260921_cho_phep','true','2026-09-20T15:00:00Z')"`. Tắt: đổi giá trị thành `false` hoặc xoá dòng.

Cron `1 17 * * *` (00:01 VN) và cron mỗi phút cùng gọi `chayResetNeuDenGio` TRƯỚC mọi việc khác của cron. Chạy khi: có cờ cho phép, không có cờ huỷ, đã tới `2026-09-20T17:01:00Z`, còn trong hạn `2026-09-20T18:00:00Z` (01:00 VN), khoá chưa `xong`, và giành/nhận được khoá.

**Chia bước, ≤ 40 truy vấn D1 mỗi lượt gọi Worker** (đúng cho cả gói Free 50 lẫn Paid 1000). Mọi truy vấn đi qua bộ đếm; hết ngân sách thì ghi `cho_tiep` và lượt cron phút sau tiếp tục NGAY (chạy khoảng 3–4 lượt, vài phút). Các bước theo thứ tự (`buoc` trong khoá):
1. **Giành khoá** `cau_hinh.reset_20260921` bằng `INSERT OR IGNORE` (chỉ một lượt nhận `changes=1`). Khoá ghi `batDauLuc` (mốc D1 Time Travel), `demTruoc` (số dòng từng bảng), `muaCu`, `expMoiCu`.
2. `nap_ma`: nạp tập MÃ ĐÃ DÙNG vào `ma_da_dung` (mã ca, mã BTVN, id bài Mẹ giao không phải UUID) — TRƯỚC khi xoá. Chưa có bảng `ma_da_dung` thì DỪNG, không xoá gì (dryRun đã báo `sanSang:false` trước đó).
3. `xoa`: xoá từng bảng trong `BANG_XOA`, mỗi truy vấn một lô 4000 dòng (`DELETE … WHERE rowid IN (SELECT rowid … LIMIT 4000)`); bảng khai `WITHOUT ROWID` (đọc từ `sqlite_master.sql` thật) xoá bằng `DELETE FROM "bảng"` thẳng. Bảng chưa tồn tại thì bỏ qua.
4. `chot`: đổi `game_v2_settings.season` sang `{"id":"2026-09-21-mua-1","startedAt":"2026-09-20T17:01:00.000Z"}` và `cau_hinh.exp_moi` = `{"tu":"2026-09-20T17:01:00.000Z","toanBo":true}` (mọi em cùng vạch xuất phát; bỏ cờ riêng 12121212); đếm lại (`demSau`); ghi `trangThai:"xong"` + `xongLuc` + `soEm`. Từ lúc này: mở băng, máy chủ bắt đầu gửi `mocReset`.

Trạng thái khoá: `dang_chay` (nhịp tim cũ quá 3 phút = chết, lượt sau tiếp tục), `cho_tiep` (đã nhường, lượt sau tiếp tục NGAY), `xong` (không bao giờ chạy lại), `qua_gio` (xem dưới). Trong lúc job làm, các việc cron khác (kế hoạch ngày, tin phụ huynh, vinh danh) nghỉ lượt đó.

**HẠN TỰ CHẠY 01:00 VN.** Cron chỉ được bắt đầu/tiếp tục trong [00:01, 01:00]. Quá 01:00 mà chưa `xong` ⇒ khoá ghi `trangThai:'qua_gio'`, KHÔNG tự chạy nữa, mở băng (job tự tiếp tục lúc 08:00 sẽ xoá bài các em vừa làm sáng thứ Hai). Muốn chạy tiếp phải gọi TAY lệnh của thầy `POST /reset/chay-tiep` (kèm `x-ma-bi-mat`; vẫn cần cờ cho phép và không cờ huỷ): mỗi lần một lượt ≤ 40 truy vấn, gọi lặp tới khi `trangThai.trangThai === "xong"`. Chỉ làm khi 0.Planer/thầy quyết.

**Không đụng**: `hoc_sinh` (mật khẩu/token), `danh_sach`, `phu_huynh`, `de_kho`, `cau_hoi`, `game_v2_question`, `game_v2_index`, `game_v2_scope`, `study_preferences`, `student_push`, `app_presence`, `ma_da_dung`, schema/migration, R2. `cau_hinh` và `game_v2_settings` chỉ bị GHI đúng các dòng nêu ở bước 4 + khoá. Bảng nào có trong D1 mà chưa phân loại (`chuaPhanLoai`) thì KHÔNG bị đụng; test khoá "mọi bảng của lược đồ phải được phân loại".

Danh sách XOÁ (48 bảng) và GIỮ (14 bảng): xem `BANG_XOA`/`BANG_GIU` trong mã.

Lưu ý cờ của các tính năng thử nằm trong `cau_hinh` (bảng GIỮ) nên SỐNG QUA reset: `cau_hinh.doan_ho_tong` = `{"dsSbd":["12121212"],"toanBo":false}` (cờ mở game Đoàn Hộ Tống riêng tài khoản thầy) giữ nguyên để 12121212 vẫn thử được sau thứ Hai; job chỉ ghi lại đúng `exp_moi`, `reset_20260921*` và `game_v2_settings.season`.

## 2. Đóng băng, huỷ, chạy thử

- Đóng băng ghi từ 00:00 tới khi job `xong` HOẶC 01:00 giờ VN (không mở băng giữa chừng lúc 00:20 khi job có thể còn xoá dở; mở NGAY khi xong hoặc `qua_gio`), CHỈ khi có cờ cho phép và không huỷ: mọi lệnh (trừ `/khoe` và chuyển hướng) trả `{ok:false, error:"Hệ thống đang làm mới, thử lại sau 1 phút", dangLamMoi:true}` (HTTP 200).
- **HUỶ** (trước giờ G): `cd server && npx wrangler d1 execute omr --remote -y --command "INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_20260921_huy','true','2026-09-20T00:00:00Z')"`. Thắng cờ cho phép; có tác dụng nếu đặt TRƯỚC khi job giành khoá. Bỏ huỷ: đổi giá trị thành `false` hoặc xoá dòng.
- **CHẠY THỬ** (chỉ đếm, không ghi gì, ≤ 40 truy vấn): lệnh của thầy `POST /reset/dry-run` (kèm `x-ma-bi-mat`) → `{ sanSang, lyDo[], choPhep, huy, daXong, xoa:[{bang,dong}], giu:[…], khongCoBang, chuaPhanLoai, tongDongSeXoa, tongDongGiu, maSeGiuLai, hanTuChay, trangThaiKhoa, soTruyVan }`. `sanSang:false` kèm `lyDo` (ví dụ chưa chạy migration `ma_da_dung`) cho biết NGAY thay vì đợi tới 00:01.
- **ĐO GIỚI HẠN TRUY VẤN** của gói đang dùng (chỉ đọc): `POST /reset/do-gioi-han` → số truy vấn `SELECT 1` chạy được trong MỘT lượt gọi (Free 50 / Paid 1000).

## 3. Ba lớp sao lưu

**(a) Bản export .sql tối Chủ nhật 20/09 ~22:00** (ngoài D1, trên đĩa): 
```
mkdir -p "/Volumes/SSD NGOÀI/omr-saoluu"
cd server && npx wrangler d1 export omr --remote --output="/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-20260920-2200.sql"
```
Kiểm đếm dòng từng bảng khớp bản thật (số `COUNT(*)` từng bảng từ dryRun so với số `INSERT` trong tệp) và ghi vào SO-VIEC.md.

**(b) Trong job**: khoá `cau_hinh.reset_20260921` ghi `batDauLuc` + `demTruoc`; D1 Time Travel giữ lịch sử 30 ngày. Lấy mốc gần giờ G: `cd server && npx wrangler d1 time-travel info omr` (ghi bookmark lúc 23:59 Chủ nhật vào sổ).

**(c) R2 giữ nguyên** (job không xoá object nào; mồ côi cũng được, coi như sao lưu): `key/<mã ca>.json`, `de/…`, ảnh, `mom/…`, `phieu/…`, `luyen-de-2026/…`.

## 4. CÁCH KHÔI PHỤC (từng bước)

Khôi phục TOÀN BỘ về trước reset (mất mọi thứ học sinh làm SAU reset — làm sớm thì mất ít):
1. Tạm huỷ job nếu chưa chạy hoặc để nó xong (không chạy lại được sau `xong`). Nếu đang lo job chạy lần nữa: giữ cờ huỷ = `true`.
2. Đọc mốc: `SELECT gia_tri FROM cau_hinh WHERE khoa='reset_20260921'` → lấy `batDauLuc`. Trừ 1 giây.
3. Time Travel (khuyến nghị, một lệnh): `cd server && npx wrangler d1 time-travel restore omr --timestamp=<batDauLuc trừ 1 giây, ISO/UNIX>`. Lệnh này đưa CẢ D1 về đúng thời điểm đó (kể cả `cau_hinh`, `game_v2_settings`, mọi bảng học). Wrangler in bookmark hiện tại trước khi khôi phục: giữ lại để hoàn tác việc khôi phục nếu cần.
4. Xoá tập mã đã dùng nếu không muốn chặn mã cũ nữa: `DELETE FROM ma_da_dung` (dữ liệu cũ đã trở lại, các mã ấy lại tồn tại trong `ca`).
5. Nếu muốn cho phép chạy lại job sau này: `DELETE FROM cau_hinh WHERE khoa='reset_20260921'` (chỉ khi thật sự muốn chạy lại).

Khôi phục MỘT VÀI BẢNG từ bản export .sql (không đụng phần còn lại): tách các dòng `INSERT INTO "<bảng>"` của tệp export, rồi
```
grep '^INSERT INTO "su_kien_hoc"' "/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-20260920-2200.sql" > /tmp/su_kien_hoc.sql
cd server && npx wrangler d1 execute omr --remote -y --file=/tmp/su_kien_hoc.sql
```
(chỉ chèn thêm; bảng phải đang rỗng hoặc chấp nhận trùng khoá bị từ chối).

Đưa cấu hình về cũ sau khôi phục một phần: `muaCu` và `expMoiCu` trong khoá `reset_20260921` là giá trị TRƯỚC reset của `game_v2_settings.season` và `cau_hinh.exp_moi`.

## 5. Sau khi job xong — kiểm nhanh
- `SELECT gia_tri FROM cau_hinh WHERE khoa='reset_20260921'` → `trangThai:"xong"`, `demSau` các bảng XOÁ = 0 (bảng có dòng do em ghi trong lúc chạy nằm ở `xoaConDu`), `demSau` các bảng GIỮ = `demTruoc`.
- `/hs/ke-hoach-ngay` của 12121212: `thanThu:null`, có `mocReset:"2026-09-21"`; đăng nhập mật khẩu cũ được.

## 6. Thêm bảng mới về sau
Test `tests/reset-toan-app-1909.test.ts` ("mọi bảng … được phân loại") sẽ đỏ nếu thêm bảng mà không đưa vào `BANG_XOA` hoặc `BANG_GIU` ở `server/src/reset-toan-app.ts`. Người thêm bảng phải quyết.

## 7. Nhật ký sao lưu đã làm

**Export thử 19/09/2026 ~17:00 giờ VN** → `/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-thu-20260919.sql` (104.571.167 byte). `wrangler d1 export omr --remote` mất **15 giây** (D1 bị khoá trong chốc lát). Kiểm: tệp nạp được vào SQLite bộ nhớ trong 0,7 giây; 62 bảng; số dòng nạp của từng bảng = số câu `INSERT` của bảng ấy; so với D1 thật ngay sau đó chỉ lệch dữ liệu mới trong lúc export (`app_presence` +2, `su_kien_hoc` +3). Bookmark Time Travel lúc đó: `00000239-0000dca7-000050eb-e227f43314180c70f139eb8b6e3a5cd3` (khôi phục về đúng thời điểm ấy: `cd server && npx wrangler d1 time-travel restore omr --bookmark=00000239-0000dca7-000050eb-e227f43314180c70f139eb8b6e3a5cd3`; Time Travel giữ 30 ngày).

**Export CHÍNH THỨC 20/09/2026 22:20** (0.Planer nhắn): tên tệp `omr-d1-20260920-2220.sql` cùng thư mục — kết quả ghi thêm ở đây sau khi làm.

