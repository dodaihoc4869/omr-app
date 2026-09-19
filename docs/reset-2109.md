# RESET TOÀN APP 00:01 thứ Hai 21/09/2026 — vận hành và CÁCH KHÔI PHỤC

Người viết: Code 3 (máy chủ). Mã: `server/src/reset-toan-app.ts` (job), `tests/reset-toan-app-1909.test.ts` (23 test SQLite thật, 20 đột biến). Hợp đồng cho máy khách: `docs/moc-reset-1909.md`.
Thầy chốt (19/09): "reset toàn app xoá hết ca thi và toàn bộ dữ liệu vào 00:01 thứ 2 để app mới hoàn toàn công bằng cho học sinh".

## 1. Job làm gì, đúng một lần

Cron `1 17 * * *` (00:01 VN) và cron mỗi phút cùng gọi `chayResetNeuDenGio` TRƯỚC mọi việc khác của cron. Chạy khi: đã tới `2026-09-20T17:01:00Z`, không có cờ huỷ, khoá chưa `xong`, và giành được khoá.

1. Giành khoá `cau_hinh.reset_20260921` bằng `INSERT OR IGNORE` (chỉ một lượt nhận `changes=1`). Khoá ghi ngay `batDauLuc` (mốc D1 Time Travel), `demTruoc` (số dòng từng bảng), `muaCu`, `expMoiCu`.
2. Nạp tập MÃ ĐÃ DÙNG vào `ma_da_dung` (mã ca, mã BTVN, id bài Mẹ giao không phải UUID) — TRƯỚC khi xoá. Chưa có bảng `ma_da_dung` thì DỪNG, không xoá gì.
3. Xoá từng bảng trong `BANG_XOA`, mỗi lô 4000 dòng (`DELETE … WHERE rowid IN (SELECT rowid … LIMIT 4000)`), sau mỗi bảng ghi nhịp tim vào khoá. Bảng chưa tồn tại thì bỏ qua.
4. Đổi `game_v2_settings.season` sang `{"id":"2026-09-21-mua-1","startedAt":"2026-09-20T17:01:00.000Z"}` và `cau_hinh.exp_moi` = `{"tu":"2026-09-20T17:01:00.000Z","toanBo":true}` (mọi em cùng vạch xuất phát; bỏ cờ riêng 12121212).
5. Đếm lại (`demSau`), ghi `trangThai:"xong"` + `xongLuc` + `soEm`. Từ lúc này: mở băng, máy chủ bắt đầu gửi `mocReset`.

Chết giữa chừng: khoá còn `dang_chay` với nhịp tim cũ hơn 3 phút → lượt cron sau (mỗi phút) TIẾP TỤC (mọi bước lặp lại được; bảng đã rỗng thì xoá 0 dòng). Không bao giờ chạy lại sau khi `xong`.

**Không đụng**: `hoc_sinh` (mật khẩu/token), `danh_sach`, `phu_huynh`, `de_kho`, `cau_hoi`, `game_v2_question`, `game_v2_index`, `game_v2_scope`, `study_preferences`, `student_push`, `app_presence`, `ma_da_dung`, schema/migration, R2. `cau_hinh` và `game_v2_settings` chỉ bị GHI đúng các dòng nêu ở bước 4 + khoá. Bảng nào có trong D1 mà chưa phân loại (`chuaPhanLoai`) thì KHÔNG bị đụng; test khoá "mọi bảng của lược đồ phải được phân loại".

Danh sách XOÁ (48 bảng) và GIỮ (14 bảng): xem `BANG_XOA`/`BANG_GIU` trong mã; bản cập nhật bảng đếm dòng ở `docs`/báo cáo dryRun.

## 2. Đóng băng và huỷ

- Đóng băng ghi 00:00–00:20 giờ VN khi job chưa `xong` (mở ngay khi xong): mọi lệnh trả `{ok:false, error:"Hệ thống đang làm mới, thử lại sau 1 phút", dangLamMoi:true}`.
- **HUỶ** (trước giờ G): `INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_20260921_huy','true',datetime('now'));` — chạy bằng
  `cd server && npx wrangler d1 execute omr --remote -y --command "INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_20260921_huy','true','2026-09-20T00:00:00Z')"`.
  Huỷ có tác dụng nếu đặt TRƯỚC khi job giành khoá (job chỉ đọc cờ lúc bắt đầu). Bỏ huỷ: đổi giá trị thành `false` hoặc xoá dòng.
- **CHẠY THỬ** (chỉ đếm, không ghi gì): lệnh của thầy `POST /reset/dry-run` (kèm `x-ma-bi-mat`) → `{ xoa:[{bang,dong}], giu:[…], khongCoBang, chuaPhanLoai, tongDongSeXoa, tongDongGiu, maSeGiuLai, trangThaiKhoa }`.

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
