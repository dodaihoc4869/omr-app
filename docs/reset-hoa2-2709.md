# RESET LẦN 2 — "GAME HÓA 2.0" (27/09/2026): về 0, chọn lại thú, GIỮ hồ sơ, XOÁ mọi ca thi cũ — đề xuất, vận hành, khôi phục

Người viết: Code 3 (máy chủ). Mã: `server/src/reset-hoa2.ts` (danh sách + điều kiện hoãn + lệnh tay), máy móc dùng chung ở `server/src/reset-toan-app.ts` (đã tổng quát hoá, lần 21/09 giữ nguyên hành vi), nối ở `server/src/index.ts` (cron + 1 dòng định tuyến). Test: `tests/reset-hoa2-2709.test.ts` (17 test trên SQLite thật với lược đồ + mọi migration). Lần trước: `docs/reset-2109.md`.

**CHƯA CHẠY trên D1 thật.** Job chỉ chạy khi Boss/thầy đặt cờ `reset_hoa2_cho_phep` (mục 5).

## 1. Lệnh của thầy (nguyên văn)

- 27/09/2026, sau khi build xong Game Hóa 2.0: *"reset lại toàn bộ về 0, chọn lại thần thú. Giữ lại toàn bộ hồ sơ dữ liệu của từng học sinh, xoá toàn bộ các ca thi cũ."* và *"Bỏ hẳn BTVN"*, *"bỏ app phụ huynh"*.
- 27/09/2026, thầy chốt câu hỏi "về 0 có gồm vàng và phụ kiện không": *"xoá cả vàng và phụ kiện luôn nhé vì cho chọn lại thần thú từ đầu chơi cho công bằng"*. ⇒ `vang_so`, `phu_kien_so_huu`, `phu_kien_dang_mac` chuyển sang XOÁ; không còn danh sách chờ chốt.

## 2. Xoá gì, giữ gì (mọi bảng của lược đồ đều đã phân loại — test khoá)

**XOÁ — 76 bảng (`BANG_XOA_HOA2`)**, theo thứ tự xoá:
1. **Mọi bảng XOÁ của lần 21/09** (58 bảng, `BANG_XOA`): BTVN (`btvn`, `btvn_em`, `btvn_em_lich_su`, `btvn_cau`, `btvn_em_cau`), bài Mẹ giao, luyện đề, yêu cầu giao bài, nháp, kế hoạch ngày cũ, lên bảng, giữ chỗ câu, trao đổi (`tin_nhan`, `cau_hoi_em`, thông báo, đẩy, cảnh báo thầy), game + thần thú (`game_v2_profile/attempt/reward/room/session/task`, `than_thu`, `vo_dai_*`), EXP + khiên (`exp_so`, `manh_khien_so`, `khien_mat_so`), `ph_giao_them`, `lop_da_hoc`, Đoàn Hộ Tống (`doan_*`), ví CNH-1.0 (`cnh_exp_*` 19 bảng), vinh danh, tin phụ huynh.
2. **Game Hóa 2.0**: `srs2_ke_hoach` (kế hoạch ngày đã chốt — chỉ là đệm, ngày sau lập lại từ sổ), `ruong_bat_linh` (rương đã mở — trạng thái chơi).
3. **Vàng + phụ kiện** (thầy chốt 27/09): `vang_so`, `phu_kien_so_huu`, `phu_kien_dang_mac`.
4. **13 bảng CA THI** — đã soát từng bảng trong `schema.sql`/migration, bảng nào cũng khoá theo `ma_ca` hoặc là dữ liệu của một lượt thi: `luot`, `chi_tiet_cau` (điểm từng câu), `ban_do_sai`, `phong_cho`, `chan_vao`, `trang_thai` (em đang làm bài, thời gian thực), `phieu` (SỔ TRA phiếu; nội dung phiếu ở R2 giữ nguyên, đường `/phieu/<mã>` đọc thẳng R2 nên liên kết cũ vẫn mở được), `kho_ca_them`, `nhan_xet` (điểm/xếp loại ghi lúc chấm một lượt — `goi-cu.ts` ghi kèm `ma_ca`; lệnh xoá cứng ca cũng xoá bảng này), `de_rieng`, `nop_khac_phuc` (nộp phiếu khắc phục của ca; kết quả học đã vào sổ), `tien_do_ca`, và **`ca` xoá CUỐI** (xoá dở giữa chừng thì ca còn để kiểm "ca đang mở" và nạp mã lại).

**GIỮ — 36 bảng (`BANG_GIU_HOA2`)**:
- Tài khoản, lớp, phụ huynh (bỏ app PH là việc giao diện; tài khoản giữ để khôi phục được), kho đề, câu hỏi, chỉ mục game, `cau_hinh`, `game_v2_settings`, `game_v2_scope`, cài đặt em, đăng ký đẩy, thống kê dùng app, `ma_da_dung`, `khien_truoc_reset_2109` (bảng sao lưu), `ph_truy_cap`.
- **SỔ + HỒ SƠ của từng em** (thầy: "giữ lại toàn bộ hồ sơ dữ liệu của từng học sinh"): `su_kien_hoc` (NGUỒN — hồ sơ dựng lại từ sổ), `nam_kt_cau`, `nam_kt_dang`, `tien_do_hs`, `qid_da_lam`, `skill_snapshot`, `nang_luc_cursor`, `learner_scope`, `quyen_hoc_sinh`, `cau_snapshot`.
- **`dong_bo` — GIỮ, KHÔNG phải dữ liệu ca** (khác đề bài ban đầu): đây là DẤU `ca_day_du` = "D1 đã đủ dữ liệu ca". App thầy (`src/lib/man-ca-may-chu-moi.ts` `danhSachCaMoi`) CHỈ đọc danh sách ca từ D1 khi có dấu này; không có dấu ⇒ app quay về Apps Script/Google Sheet — nơi CÒN NGUYÊN mọi ca cũ ⇒ **ca cũ hiện lại** trên màn Ca thi. App chỉ kiểm có dấu (không so số `so_ca`/`so_luot`), nên giữ dấu sau khi xoá ca là đúng.
- **Game Hóa 2.0 do thầy chủ động tạo**: `chien_dich` (chiến dịch luyện; cột `ma_ca` có thể trỏ tới ca đã xoá — chỉ là nhãn, `srs2-*.ts` không dùng để tra), `srs2_day_lai` (mốc "Chữa xong" của buổi chữa).
- Bảng vận hành đã GIỮ lần 21/09: `ai_ho_so_ngay`, `ai_dieu_chinh`, `ai_ban_tin`, `hoc_sinh_da_go`, `danh_sach_da_go`, `nhat_ky_may`, `thu_thach_rieng`.

`cau_hinh` và `game_v2_settings` chỉ bị GHI đúng vài dòng ở bước chốt (mục 4). Cờ các tính năng (`game_hoa_2`, `doan_ho_tong`…) SỐNG QUA reset.

## 3. Sự kiện `thi` của ca bị xoá vẫn "đã công bố" và vẫn vào hồ sơ — KẾT LUẬN (đọc mã + test)

| Chỗ | Cách đọc | Sau khi xoá ca |
|---|---|---|
| `ho-so-nam-kt.ts` `dungLaiHoSo` | phát lại MỌI sự kiện trong sổ, không nối bảng `ca` | hồ sơ dựng lại y nguyên (test so từng dòng, trừ `cap_nhat_luc`) |
| `exp-d1.ts` `capNhatCoTu` | sự kiện `thi` chỉ tính khi ca đã công bố — NGOẠI LỆ: ca **không còn** trong bảng `ca` coi là ĐÃ công bố | tính. Sổ cũ trước `exp_moi.tu` không sinh EXP; câu thi từng sai nay làm đúng được "lên bậc" (test: cả ca đã và chưa công bố) |
| `game-v2-bank.ts` `readScope` | bằng chứng từ hồ sơ lấy câu có sự kiện `thi` của ca **không còn** trong `ca` (`NOT EXISTS`) | vào bằng chứng game (test: `wrong: true`) |
| `srs2-d1.ts` `docLanLam` (Game Hóa 2.0) | đọc thẳng `su_kien_hoc`, chỉ bỏ `visibility = 'embargoed'`; không nối `ca` | vào (test). Hiện KHÔNG đường ghi nào đặt `embargoed` trong `su_kien_hoc` |

**Cần biết:** ca ĐÃ ĐÓNG mà CHƯA công bố lúc reset ⇒ sau reset kết quả từng câu của ca ấy coi như đã công bố (game/EXP lên bậc dùng được) — cùng luật với "thầy xoá cứng ca" đã chốt 21/09; Game Hóa 2.0 vốn đã không lọc công bố. Muốn tránh: trước khi lên đạn, công bố hoặc chấp nhận. Xem danh sách: `SELECT ma_ca, ten_ca, cong_bo FROM ca WHERE trang_thai='dong' AND COALESCE(cong_bo,'') NOT IN ('ngay')`.

## 4. Máy móc (giống 21/09, khác ở chỗ in đậm)

- **Khoá riêng**: cờ lên đạn `cau_hinh.reset_hoa2_cho_phep`, cờ huỷ `reset_hoa2_huy` (thắng cờ lên đạn), khoá trạng thái `reset_hoa2` (giành bằng INSERT OR IGNORE; `xong` thì không bao giờ chạy lại). Cờ/khoá của lần 21/09 không kích hoạt lần 2 và ngược lại.
- Cửa sổ tự chạy 60 phút kể từ lúc lên đạn; quá hạn mà chưa xong ⇒ `qua_gio`, không tự chạy; **lên đạn LẠI để làm tiếp** (lần 2 không có lệnh `chay-tiep` tay).
- ≤ 40 truy vấn D1 mỗi lượt cron, chia bước, `cho_tiep` thì phút sau làm tiếp. Đo trong test: mỗi lượt ≤ 40.
- **HOÃN khi có ca mở** (`ca.trang_thai = 'mo'`, mọi loại kể cả ca bài tập, TRỪ ca đo tải `DOTAI`): kiểm trước khi giành khoá; có ca mở ⇒ lượt cron trả `hoan` kèm mã ca, KHÔNG ghi gì, KHÔNG đóng băng (em đang thi vẫn nộp bài được), việc cron thường lệ vẫn chạy. Đóng hết ca thì phút sau job tự chạy (trong cửa sổ). Không đọc được bảng `ca` ⇒ hoãn cho chắc.
- **ĐÓNG BĂNG CHỈ KHI JOB GIỮ KHOÁ** (`dang_chay`/`cho_tiep`), không phải ngay lúc lên đạn như 21/09. Cổng `dangLamMoi` đọc cờ + khoá của CẢ HAI job trong MỘT truy vấn (đệm 30 giây/isolate).
- **Bước `cho_bang`**: giành khoá xong CHỜ ≥ 35 giây (hết đệm 30 giây của cổng ở mọi isolate) rồi kiểm ca mở LẦN NỮA ngay trước khi xoá. Ca mở lọt qua khe đệm ⇒ chưa xoá gì thì TRẢ KHOÁ (về "đã lên đạn, chưa bắt đầu", mở băng); đã xoá dở (làm tiếp sau `qua_gio`) thì khoá ghi `hoan` + mở băng, hết ca mở thì cron làm tiếp.
- `nap_ma`: nạp `ma_da_dung` **loại `ca` (mọi mã ca)** + `btvn` + `mom` (id không phải UUID) TRƯỚC khi xoá. Máy thầy còn bộ nhớ đệm/hàng đợi đẩy ca cũ: `publish`, `capNhatKeyBank`, `noiKhoCa`, `/ca/nhieu` từ chối mã ca đã dùng mà không còn trong `ca` (`maCaDaDung:true` / `boQuaMaCu`). Ca đo tải `DOTAI` được "Mở sẵn ca đo" dựng lại thẳng bằng SQL, không bị chặn.
- `xoa` → `chot`: mùa game `<ngày VN lúc bắt đầu>-mua-1`, `exp_moi = {"tu": batDauLuc, "toanBo": true}`, xoá khoá lắp đặt P08 (`p08_setup*`, vì ví CNH bị xoá), đếm lại (`demSau`), `xong` + `mocReset` = ngày VN lúc xong.
- **CHỌN LẠI THÚ**: `game_v2_profile` + `than_thu` bị xoá và mùa mới được đặt ⇒ lần mở game đầu tiên `loadProfile` tạo hồ sơ TRẮNG `choice: true`, `pet: 'dat_quy'`, cấp 1, 0 EXP, 0 ví (test).
- **`mocReset`**: trả mốc của job XONG MUỘN NHẤT ⇒ sau lần 2, máy khách thấy mốc KHÁC mốc 21/09 đã lưu và dọn lại một lần.

## 5. Cách chạy (chỉ khi Boss/thầy ra lệnh — xoá dữ liệu thật)

1. **Chạy thử** (chỉ đếm, ≤ 40 truy vấn): `POST /reset-hoa2/chay-thu` kèm `x-ma-bi-mat` → `{ sanSang, lyDo[], choPhep, huy, daXong, lenDanLuc, hanTuChay, xoa[], giu[], khongCoBang, chuaPhanLoai, tongDongSeXoa, tongDongGiu, maSeGiuLai:{ca,btvn,mom}, hoan, soTruyVan }`. Phải: `sanSang:true`, `chuaPhanLoai:[]`, `hoan:null`.
2. **Trạng thái** (2 truy vấn): `POST /reset-hoa2/trang-thai` kèm `x-ma-bi-mat` → `{ choPhep, huy, lenDanLuc, hanTuChay, khoa, hoan, tomTat }` (`tomTat` là một câu: chưa lên đạn / HOÃN: ca nào mở / đang chạy bước gì / quá giờ / đã xong). Trong lúc đóng băng (vài phút job chạy) mọi lệnh kể cả hai lệnh này trả `dangLamMoi:true` — đọc khoá bằng `wrangler d1 execute omr --remote --command "SELECT gia_tri FROM cau_hinh WHERE khoa='reset_hoa2'"`.
3. **Sao lưu** (như `docs/reset-2109.md` mục 5): `npx wrangler d1 export omr --remote --output=…/omr-d1-<ngày>-<giờ>.sql`, đối chiếu số dòng với chạy thử; ghi bookmark `npx wrangler d1 time-travel info omr` vào sổ việc.
4. **LÊN ĐẠN**:
   ```
   cd server && npx wrangler d1 execute omr --remote -y --command "INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_hoa2_cho_phep','true',strftime('%Y-%m-%dT%H:%M:%SZ','now'))"
   ```
   Cron phút sau: có ca mở ⇒ hoãn (log `[reset-hoa2] cron … "lyDo":"hoan"`); không ⇒ giành khoá, đóng băng, ~1 phút sau bắt đầu xoá, vài phút là xong.
5. **HUỶ** (có tác dụng trước khi xoá):
   ```
   cd server && npx wrangler d1 execute omr --remote -y --command "INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('reset_hoa2_huy','true',strftime('%Y-%m-%dT%H:%M:%SZ','now'))"
   ```

## 6. Khôi phục

Như `docs/reset-2109.md` mục 6, đổi khoá: (1) đặt `reset_hoa2_huy = true`; (2) `SELECT gia_tri FROM cau_hinh WHERE khoa='reset_hoa2'` lấy `batDauLuc`; (3) `npx wrangler d1 time-travel restore omr --timestamp=<batDauLuc trừ 1 giây>` (hoặc `--bookmark`); (4) bỏ chặn mã cũ: `DELETE FROM ma_da_dung WHERE xoa_luc = '<batDauLuc>'` (chỉ các mã lần 2 nạp); (5) muốn chạy lại job: `DELETE FROM cau_hinh WHERE khoa IN ('reset_hoa2','reset_hoa2_cho_phep')`. Khoá ghi `muaCu`, `expMoiCu` (giá trị trước reset), `demTruoc`, `maDaDung`.

## 7. Sau khi xong: kiểm nhanh
- Khoá `reset_hoa2`: `trangThai:"xong"`, `demSau` bảng XOÁ = 0 (dòng ghi trong lúc chạy nằm ở `xoaConDu`), `demSau` bảng GIỮ = `demTruoc` (trừ `cau_hinh`, `ma_da_dung`), `maDaDung.ca` = số ca trước reset.
- `/hs/ke-hoach-ngay` của 12121212: có `mocReset` mới; mở game ⇒ màn chọn thú; đăng nhập mật khẩu cũ được.

## 8. Ảnh hưởng tới làn khác (máy chủ đã an toàn; giao diện cần phiên chủ làn quyết)
- **App thầy (Code 1)**: `src/lib/exam-db.ts` `STORE_DON_KHI_RESET` đang RỖNG (21/09 giữ ca). Lần này ca bị xoá ⇒ nên thêm bộ nhớ ca/bank/lượt (`STORE_SESSION_CACHE`, `STORE_SESSION_BANK_TEACHER`, `STORE_ATTEMPTS`) để máy thầy dọn theo `mocReset` mới. Không thêm thì máy chủ vẫn chặn đẩy lại mã ca cũ (mục 4), chỉ là màn hình còn ca cũ trong bộ nhớ máy.
- **Apps Script/Google Sheet** còn nguyên ca cũ: app thầy chỉ quay về đó khi máy chủ mới lỗi hoặc mất dấu `dong_bo` (đã GIỮ).
- **Game cũ** (`game-v2-luot.ts` `lop_da_hoc`, khi tắt `game_hoa_2`): "dạng lớp đã học" tính từ BTVN + `chi_tiet_cau`⋈`ca` ⇒ sau reset rỗng, game cũ rút theo bằng chứng riêng của em. Game Hóa 2.0 dùng `chien_dich` + sổ ⇒ không ảnh hưởng.
- **Gọi lên bảng**: `ban_do_sai` của ca cũ mất; hồ sơ `nam_kt_cau` còn.
- Bảng mới thêm về sau: test "mọi bảng … được phân loại" của CẢ `tests/reset-toan-app-1909.test.ts` và `tests/reset-hoa2-2709.test.ts` đỏ tới khi người thêm quyết XOÁ/GIỮ.

## 9. Số liệu kiểm (27/09, worktree Code 3)
- `tests/reset-hoa2-2709.test.ts`: 17/17 xanh — phân loại đủ mọi bảng; chạy thử không đổi một byte, ≤ 40 truy vấn; chạy thật xoá sạch 76 bảng (có vàng + phụ kiện), 36 bảng GIỮ y nguyên từng byte (`su_kien_hoc`, `hoc_sinh`, `chien_dich`, `dong_bo` cùng số dòng), mọi mã ca vào `ma_da_dung`, hồ sơ game tạo lại `choice:true`; không cờ ⇒ không làm gì; cờ huỷ thắng; ca mở ⇒ hoãn không đóng băng; ca mở lọt khe ⇒ trả khoá; xoá dở + quá giờ + ca mở ⇒ `hoan` rồi làm tiếp tới xong; một lần; hai cron chồng nhau; sự kiện `thi` của ca đã xoá vào hồ sơ/game/2.0/EXP.
- `tests/reset-toan-app-1909.test.ts` (lần 21/09): 45/45 xanh khi nạp được `index.ts` (trước đó 3 đỏ vì 4 bảng 2.0 chưa phân loại — nay xếp GIỮ cho job cũ, không đổi hành vi vì job đã `xong`). Trong repo hiện tại tệp này KHÔNG nạp được vì `index.ts` thiếu `btvn-lifecycle`, `btvn-snapshot`, `game-v2-scope-projection` (của phiên khác).
