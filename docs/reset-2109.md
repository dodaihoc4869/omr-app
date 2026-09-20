# RESET TOÀN APP — chạy THEO LỆNH, GIỮ hồ sơ mạnh yếu và MỌI CA THI đã thi — vận hành và CÁCH KHÔI PHỤC

Người viết: Code 3 (máy chủ). Mã: `server/src/reset-toan-app.ts` (job), `tests/reset-toan-app-1909.test.ts` (43 test SQLite thật + bộ đột biến). Hợp đồng cho máy khách: `docs/moc-reset-1909.md`.

Thầy chốt lần đầu (19/09): xoá hết ca thi và dữ liệu để app mới hoàn toàn công bằng cho học sinh. **Thầy ĐỔI lúc 21/09 00:08**: "tiến hành reset luôn, tôi muốn bạn cho chọn lại thú, xoá hết mọi ca thi và btvn nhưng GIỮ LẠI toàn bộ hồ sơ mạnh yếu của học sinh đã kiểm tra trước đó". Nên không còn mốc 00:01 cố định: job chạy khi có lệnh (cờ "lên đạn"). **Thầy ĐỔI TIẾP lúc 21/09 ~01:30**: "khi reset giữ lại toàn bộ ca thi đã thi" — 14 bảng ca thi chuyển từ XOÁ sang GIỮ.

## 1. Xoá gì, giữ gì

**XOÁ (32 bảng, `BANG_XOA`)**: BTVN (`btvn`, `btvn_em`, `btvn_em_lich_su`), bài Mẹ giao (`mom_bai`), luyện đề, yêu cầu giao bài, nháp, `ke_hoach_ngay`, `len_bang`, trao đổi (`tin_nhan`, `cau_hoi_em`, thông báo, đẩy), game và thần thú (`game_v2_profile`, `game_v2_attempt`, `game_v2_reward`, `game_v2_room`, `game_v2_session`, `game_v2_task`, `than_thu`, `vo_dai_*`), EXP và mảnh khiên (`exp_so`, `manh_khien_so`), Đoàn Hộ Tống (`doan_chang`, `doan_luot`, `doan_tiep_suc`, `doan_ve_so`, `doan_trum_lop`, `doan_trum_cau`), vinh danh, bảng tin phụ huynh. Em vào game phải CHỌN LẠI THÚ.

**GIỮ (34 bảng, `BANG_GIU`)**: tài khoản và mật khẩu (`hoc_sinh`), danh sách lớp, phụ huynh, kho đề và câu hỏi, chỉ mục game, cấu hình, cài đặt em, đăng ký đẩy, thống kê dùng app, `ma_da_dung`, `ph_truy_cap`; **SỔ + HỒ SƠ MẠNH YẾU**: `su_kien_hoc`, `nam_kt_cau`, `nam_kt_dang`, `tien_do_hs`, `qid_da_lam`; và **MỌI CA THI đã thi**: `ca`, `luot`, `chi_tiet_cau`, `ban_do_sai`, `phong_cho`, `chan_vao`, `trang_thai`, `phieu`, `kho_ca_them`, `nhan_xet`, `de_rieng`, `dong_bo`, `nop_khac_phuc`, `tien_do_ca`.

Vì sao `su_kien_hoc` (sổ) bắt buộc phải giữ: hồ sơ (`nam_kt_cau`, `nam_kt_dang`) được DỰNG LẠI từ sổ sau mỗi lần em nộp (`dungLaiHoSo` xoá hồ sơ của em rồi phát lại sổ). Xoá sổ mà giữ hồ sơ thì lần nộp đầu tiên xoá sạch hồ sơ của em. Test khoá điều này: sau reset, dựng lại hồ sơ từ sổ ra đúng hồ sơ cũ.

Bảng nào có trong D1 mà chưa được phân loại (`chuaPhanLoai`) thì KHÔNG bị đụng và được báo. Test khoá "mọi bảng của lược đồ phải được phân loại": thêm bảng mới là buộc người thêm phải quyết XOÁ hay GIỮ (bài học 21/09: `doan_ve_so`, `doan_trum_lop` của Code 5 mới thêm đã làm test đỏ, đã xếp vào XOÁ).

## 2. Hệ thống còn chạy đúng khi "hồ sơ và ca thi còn, BTVN/Mẹ giao/game trống"

Đã rà mọi chỗ nối sổ hoặc hồ sơ với ca, lượt, BTVN. Vì ca thi được GIỮ nên mọi luật liên quan ca hành xử NHƯ TRƯỚC reset; các luật "ca không còn trong bảng" chỉ còn dùng khi thầy xoá cứng ca. Kết quả và test (mục "CA THI VÀ HỒ SƠ ĐƯỢC GIỮ" trong `tests/reset-toan-app-1909.test.ts`):

| Chỗ | Trước | Sau reset |
|---|---|---|
| Sự kiện `thi` trong sổ, lọc "ca đã công bố" ở EXP (`exp-d1.ts`) | ca chưa công bố thì ẩn | không đổi (ca còn nên ca chưa công bố vẫn ẩn). Chỉ khi thầy xoá cứng một ca: ca KHÔNG còn trong bảng `ca` thì coi là ĐÃ công bố (không ẩn vĩnh viễn). Không đọc được bảng `ca` thì vẫn đóng cửa (coi ca còn) |
| Bằng chứng game từ hồ sơ (`readScope`, `game-v2-bank.ts`) | câu chỉ thi ở ca còn thì ẩn | như trên |
| Câu bị bảo vệ (`protectedQuestions`) | đề của ca đang mở | không đổi: đề của ca đang mở vẫn được bảo vệ |
| Kế hoạch ngày (`lapKeHoachNgay`), `qidPhucVuDuoc`, `cau-theo-qid` | đọc hồ sơ + kho | chạy trên hồ sơ, không cần ca |
| `hoSoLopLenBang`, `hoSoOnCa` | đọc hồ sơ | `hoSoLopLenBang` và `hoSoOnCa` trả đúng như trước reset (test so sánh); `ban_do_sai` được giữ |
| `dungLaiHoSo` sau reset | | ra đúng hồ sơ cũ (từng dòng, trừ `cap_nhat_luc`) |

**EXP sau reset.** `exp_moi.tu` = lúc job BẮT ĐẦU. Mọi so sánh `luc >= tu` bỏ qua sổ cũ, nên sổ cũ NGUYÊN mà tổng EXP sau reset = 0 (test đo trước reset có EXP, sau reset bằng 0). Điểm ca thi đã nộp trước reset (`luot.nop_luc` < `tu`) cũng KHÔNG sinh EXP `diem_ca`, và đường EXP cũ của game đọc mốc từ `game_v2_settings.season.startedAt` (= lúc bắt đầu) nên cũng bỏ qua. Câu cũ từng sai nay làm đúng vẫn được "lên bậc" +6; câu sai ở ca thi chưa công bố chỉ lên bậc sau khi ca công bố.

## 3. Cách chạy: lệnh lên đạn, cửa sổ 60 phút

**AN TOÀN MẶC ĐỊNH.** Job CHỈ chạy (và cổng đóng băng CHỈ bật) khi `cau_hinh.reset_toan_app_cho_phep` = `true`. Không cờ ⇒ không xoá, không đóng băng. Cờ HUỶ `cau_hinh.reset_toan_app_huy` THẮNG cờ cho phép. `cap_nhat_luc` của dòng cờ = **lúc lên đạn** (bắt buộc ghi giờ UTC thật; đọc không được thì job coi như chưa lên đạn).

**LÊN ĐẠN** (chỉ khi Boss/thầy ra lệnh, sau khi export xong và dryRun khớp):
```
cd server && npx wrangler d1 execute omr --remote -y --command "INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_toan_app_cho_phep','true',strftime('%Y-%m-%dT%H:%M:%SZ','now'))"
```
**HUỶ**: đặt `reset_toan_app_huy` = `true` (có tác dụng nếu đặt TRƯỚC khi job giành khoá) và/hoặc đổi cờ cho phép thành `false`:
```
cd server && npx wrangler d1 execute omr --remote -y --command "INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_toan_app_huy','true',strftime('%Y-%m-%dT%H:%M:%SZ','now'))"
```

Cron mỗi phút gọi `chayResetNeuDenGio` TRƯỚC mọi việc khác của cron; phút kế tiếp sau khi lên đạn job bắt đầu. **Cửa sổ tự chạy và đóng băng = 60 phút kể từ lúc lên đạn.** Xong sớm thì mở băng sớm. Quá 60 phút mà chưa `xong` ⇒ khoá ghi `qua_gio`, KHÔNG tự chạy nữa (chạy muộn là xoá bài các em vừa làm), mở băng; chỉ chạy tiếp bằng lệnh TAY.

**Chia bước, ≤ 40 truy vấn D1 mỗi lượt gọi Worker** (đúng cho cả gói Free 50 lẫn Paid 1000; đã đo ≥ 1100 truy vấn/lượt chạy được nên gói đang là Paid). Mọi truy vấn đi qua bộ đếm; hết ngân sách thì ghi `cho_tiep` và lượt cron phút sau tiếp tục NGAY (vài lượt). Các bước (`buoc` trong khoá `cau_hinh.reset_toan_app`):
1. **Giành khoá** bằng `INSERT OR IGNORE` (chỉ một lượt nhận `changes=1`). Khoá ghi `batDauLuc` (mốc thật, cũng là mốc D1 Time Travel), `lenDanLuc`, `demTruoc` (số dòng từng bảng), `muaCu`, `expMoiCu`.
2. `nap_ma`: nạp tập MÃ ĐÃ DÙNG vào `ma_da_dung` (mã BTVN, id bài Mẹ giao không phải UUID) TRƯỚC khi xoá. KHÔNG nạp mã ca: ca được giữ nguyên trong bảng `ca`. Các nơi chặn "mã ca đã dùng mà không còn trong ca" (publish, capNhatKeyBank, noiKhoCa, /ca/nhieu) vẫn còn, và KHÔNG bao giờ chặn ca còn trong bảng. Chưa có bảng `ma_da_dung` thì DỪNG, không xoá gì (dryRun báo `sanSang:false` từ trước).
3. `xoa`: xoá từng bảng trong `BANG_XOA`, mỗi truy vấn một lô 4000 dòng; bảng `WITHOUT ROWID` xoá bằng `DELETE FROM "bảng"` thẳng. Bảng chưa tồn tại thì bỏ qua. Bảng GIỮ không bao giờ vào SQL xoá (tên bảng chỉ lấy từ hằng số có kiểm định dạng).
4. `chot`: `game_v2_settings.season` = `{"id":"<ngày VN lúc bắt đầu>-mua-1","startedAt":"<batDauLuc>"}`; `cau_hinh.exp_moi` = `{"tu":"<batDauLuc>","toanBo":true}` (mọi em cùng vạch xuất phát, bỏ cờ riêng `dsSbd`/`tuDsSbd`); đếm lại (`demSau`); ghi `trangThai:"xong"`, `xongLuc`, `soEm` và **`mocReset` = ngày VN LÚC XONG** (`YYYY-MM-DD`). Từ lúc này mở băng và máy chủ bắt đầu gửi `mocReset`.

Trạng thái khoá: `dang_chay` (nhịp tim cũ quá 3 phút = chết, lượt sau tiếp tục), `cho_tiep` (lượt sau tiếp tục NGAY), `xong` (KHÔNG BAO GIỜ chạy lại, kể cả lên đạn lại), `qua_gio`. Trong lúc job làm, các việc cron khác (kế hoạch ngày, tin phụ huynh, vinh danh) nghỉ lượt đó.

**Lệnh TAY** `POST /reset/chay-tiep` (kèm `x-ma-bi-mat`): bỏ qua hạn 60 phút; vẫn cần cờ cho phép và không cờ huỷ; mỗi lần một lượt ≤ 40 truy vấn, gọi lặp tới khi `trangThai.trangThai === "xong"`. Chỉ làm khi Boss/thầy quyết.

**Không đụng**: bảng GIỮ (mục 1), schema/migration, R2. `cau_hinh` và `game_v2_settings` chỉ bị GHI đúng các dòng ở bước 4 và khoá. Cờ các tính năng thử nằm trong `cau_hinh` nên SỐNG QUA reset (ví dụ `doan_ho_tong` = `{"dsSbd":["12121212"],"toanBo":false}`).

## 4. Đóng băng, huỷ, chạy thử

- Đóng băng ghi từ lúc lên đạn tới khi job `xong` HOẶC hết 60 phút, CHỈ khi có cờ cho phép và không huỷ; không mở băng giữa chừng khi job có thể còn xoá dở. Mọi lệnh (trừ `/khoe` và chuyển hướng) trả `{ok:false, error:"Hệ thống đang làm mới, thử lại sau 1 phút", dangLamMoi:true}` (HTTP 200). Đọc cờ có bộ nhớ đệm 3 giây trong isolate: đóng băng bắt đầu và mở băng trễ tối đa 3 giây.
- **CHẠY THỬ** (chỉ đếm, không ghi gì, ≤ 40 truy vấn): `POST /reset/dry-run` (kèm `x-ma-bi-mat`) → `{ sanSang, lyDo[], choPhep, huy, daXong, lenDanLuc, hanTuChay, xoa:[{bang,dong}], giu:[…], khongCoBang, chuaPhanLoai, tongDongSeXoa, tongDongGiu, maSeGiuLai, trangThaiKhoa, soTruyVan }`. `sanSang:false` kèm `lyDo` cho biết NGAY (ví dụ chưa chạy migration `ma_da_dung`).
- **ĐO GIỚI HẠN TRUY VẤN** (chỉ đọc): `POST /reset/do-gioi-han` → số truy vấn `SELECT 1` chạy được trong MỘT lượt gọi.

## 5. Ba lớp sao lưu

**(a) Bản export .sql trước khi lên đạn** (ngoài D1, trên đĩa, Boss ra lệnh):
```
mkdir -p "/Volumes/SSD NGOÀI/omr-saoluu"
cd server && npx wrangler d1 export omr --remote --output="/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-<ngày>-<giờ>.sql"
```
Kiểm đếm dòng từng bảng khớp dryRun và ghi vào SO-VIEC.md. Export mất khoảng 15 giây và khoá D1 trong chốc lát: làm lúc không có ca thi mở.

**(b) Trong job**: khoá ghi `batDauLuc` và `demTruoc`; D1 Time Travel giữ lịch sử 30 ngày. Lấy bookmark ngay trước khi lên đạn: `cd server && npx wrangler d1 time-travel info omr`, ghi vào sổ.

**(c) R2 giữ nguyên** (job không xoá object nào; mồ côi cũng được, coi như sao lưu): `key/<mã ca>.json`, `de/…`, ảnh, `mom/…`, `phieu/…`, `luyen-de-2026/…`.

## 6. CÁCH KHÔI PHỤC (từng bước)

Khôi phục TOÀN BỘ về trước reset (mất mọi thứ học sinh làm SAU reset, làm sớm thì mất ít):
1. Đặt cờ huỷ = `true` để job không chạy lại.
2. Đọc mốc: `SELECT gia_tri FROM cau_hinh WHERE khoa='reset_toan_app'` → lấy `batDauLuc`, trừ 1 giây.
3. Time Travel (một lệnh): `cd server && npx wrangler d1 time-travel restore omr --timestamp=<batDauLuc trừ 1 giây>` hoặc `--bookmark=<bookmark đã ghi>`. Đưa CẢ D1 về thời điểm đó (kể cả `cau_hinh`, `game_v2_settings`, mọi bảng học). Wrangler in bookmark hiện tại trước khi khôi phục: giữ lại để hoàn tác.
4. Nếu không muốn chặn mã cũ nữa: `DELETE FROM ma_da_dung` (dữ liệu cũ đã trở lại, các mã ấy lại tồn tại trong `ca`).
5. Muốn cho phép chạy lại job sau này: `DELETE FROM cau_hinh WHERE khoa IN ('reset_toan_app','reset_toan_app_cho_phep')` (chỉ khi thật sự muốn chạy lại).

Khôi phục MỘT VÀI BẢNG từ bản export .sql: tách các dòng `INSERT INTO "<bảng>"` của tệp export, rồi
```
grep '^INSERT INTO "ca"' "/Volumes/SSD NGOÀI/omr-saoluu/<tệp>.sql" > /tmp/ca.sql
cd server && npx wrangler d1 execute omr --remote -y --file=/tmp/ca.sql
```
(chỉ chèn thêm; bảng phải đang rỗng hoặc chấp nhận trùng khoá bị từ chối).

`muaCu` và `expMoiCu` trong khoá `reset_toan_app` là giá trị TRƯỚC reset của `game_v2_settings.season` và `cau_hinh.exp_moi`.

## 7. Sau khi job xong: kiểm nhanh
- `SELECT gia_tri FROM cau_hinh WHERE khoa='reset_toan_app'` → `trangThai:"xong"`, `demSau` các bảng XOÁ = 0 (bảng có dòng do em ghi trong lúc chạy nằm ở `xoaConDu`), `demSau` các bảng GIỮ (nhất là 5 bảng sổ + hồ sơ và 14 bảng ca thi) = `demTruoc`.
- `/hs/ke-hoach-ngay` của 12121212: `thanThu:null`, có `mocReset` = ngày VN lúc xong; đăng nhập mật khẩu cũ được.

## 8. Thêm bảng mới về sau
Test "mọi bảng … được phân loại" đỏ nếu thêm bảng mà không đưa vào `BANG_XOA` hoặc `BANG_GIU`. Người thêm bảng phải quyết. Bảng nào dẫn xuất từ `exp_so`/`su_kien_hoc` thì hỏi: xoá `exp_so` mà giữ bảng ấy có lệch không?

## 9. Nhật ký sao lưu đã làm

**Export thử 19/09/2026 ~17:00 giờ VN** → `/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-thu-20260919.sql` (104.571.167 byte). `wrangler d1 export omr --remote` mất **15 giây**. Kiểm: nạp được vào SQLite bộ nhớ trong 0,7 giây; 62 bảng; số dòng nạp của từng bảng = số câu `INSERT`; so với D1 thật ngay sau đó chỉ lệch dữ liệu mới trong lúc export. Bookmark Time Travel lúc đó: `00000239-0000dca7-000050eb-e227f43314180c70f139eb8b6e3a5cd3` (khôi phục: `cd server && npx wrangler d1 time-travel restore omr --bookmark=00000239-0000dca7-000050eb-e227f43314180c70f139eb8b6e3a5cd3`; giữ 30 ngày).

**Export CHÍNH THỨC**: CHƯA làm (máy ngủ tối 20/09). Boss sẽ ra lệnh khi "MỌI VIỆC XONG": tên tệp `omr-d1-<ngày>-<giờ>.sql` cùng thư mục, ghi kết quả ở đây.
