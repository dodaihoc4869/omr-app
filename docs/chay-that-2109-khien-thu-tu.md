# GÓI KHIÊN — thứ tự chạy THẬT (Code 3, 21/09/2026) · chờ Boss soát + thầy bấm quyền

Việc: thầy lệnh (1) "ít nhất học đều 36 ngày mới lấy được khiên đầu tiên", (2) "RESET lại hết mảnh khiên và mốc ban đầu cho công bằng", (3) "mất chuỗi bao nhiêu ngày sẽ bị mất 1 khiên" (Boss chốt 7 ngày).
Mã: `44be961` (36 mảnh) + gói này. Đặc tả: `DE-XUAT-EXP-MANH-KHIEN-1909.md` mục 4. Tất cả ở D1 THẬT phải qua Boss soát và lời thầy trong khung chat; sao lưu TRƯỚC.

## Số liệu thật lúc chuẩn bị (đọc chỉ-đọc 21/09 ~13:15)
94 hồ sơ game · 38 em có `khienRen` (đều có mảnh > 0) · tổng mảnh 174 · khiên rèn đã rèn 17 (đều CHƯA dùng) · khiên đã dùng 0 · cấp cao nhất 7 (chưa ai tới mốc quà cấp 10) · `manh_khien_so` 207 dòng, TẤT CẢ ngày 21/09: 36 dòng `dat` (36 em, +1) và 171 dòng `dang` (29 em, +2 = 342 mảnh). **Vì vậy khi có mốc, máy chủ chỉ đếm dòng `loai = 'dat'`** (nếu không, 342 mảnh `dang` của hôm nay sẽ được cộng lại ngay sau reset).
Hệ quả mong đợi: 174 mảnh và 17 khiên rèn chưa dùng về 0; 36 em đã đạt hôm nay sẽ hiện 1/36 ở lần cộng kế (mỗi lần em mở kế hoạch ngày / nộp bài).

## Thứ tự (KHÔNG đảo)
1. **Sao lưu D1**: `cd server && npx wrangler d1 export omr --remote --output="/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-<ngày-giờ>-truoc-khien.sql"` (kiểm kích thước ≈ 100 MB).
2. **Migration chỉ-thêm** `server/migration-2109-khien.sql` (`wrangler d1 execute omr --file=migration-2109-khien.sql --remote -y`): 2 bảng mới `khien_truoc_reset_2109`, `khien_mat_so`.
3. **Worker gói khiên** từ worktree sạch ở commit Boss đã soát (`./DAY-MAY-CHU.command </dev/null`). Từ lúc này máy chủ đọc `cau_hinh.khien_moc`; CHƯA có mốc ⇒ đếm mọi dòng như cũ.
4. **NGAY SAU ĐÓ (vài phút, để các em không thấy 11/36 rồi về 0)**: `wrangler d1 execute omr --file=dat-2109-khien-moc.sql --remote -y`. Thứ tự trong tệp: mốc `khien_moc = 2026-09-21` → chép lưu → đặt lại → 1 tin/em → marker `khien_reset_da_chay`. Chạy lại tệp an toàn (không đặt lại lần hai).
5. Câu kiểm (chỉ-đọc, bên dưới) ⇒ báo Boss số trước / sau.

## Câu kiểm
```sql
-- TRƯỚC và SAU (so sánh)
SELECT COUNT(*) AS ho_so,
       SUM(CASE WHEN COALESCE(json_extract(json,'$.khienRen.manh'),0) > 0 THEN 1 ELSE 0 END) AS em_co_manh,
       COALESCE(SUM(json_extract(json,'$.khienRen.manh')),0) AS tong_manh,
       COALESCE(SUM(json_extract(json,'$.khienRen.daRen')),0) AS tong_da_ren,
       COALESCE(SUM(json_extract(json,'$.shields.used')),0) AS tong_da_dung
  FROM game_v2_profile;
-- SAU: bản lưu và tin
SELECT COUNT(*) AS so_dong_luu, SUM(manh) AS tong_manh_cu, SUM(da_ren) AS tong_da_ren_cu, SUM(da_ren - da_ren_moi) AS khien_ren_chua_dung_bi_dat_lai FROM khien_truoc_reset_2109;
SELECT COUNT(*) AS so_tin FROM student_notice WHERE target = 'khien';
SELECT gia_tri FROM cau_hinh WHERE khoa IN ('khien_moc','khien_reset_da_chay');
```
Mong đợi SAU: `em_co_manh = 0`, `tong_manh = 0`, `tong_da_ren = 0` (đã dùng 0 nên toàn bộ 17 khiên rèn chưa dùng về 0), `tong_da_dung` giữ 0; `so_dong_luu = 94`, `tong_manh_cu = 174`, `tong_da_ren_cu = 17`, `so_tin = 94`.

## Lùi (theo lệnh Boss)
`wrangler d1 execute omr --file=dat-2109-khien-moc-lui.sql --remote -y`: trả mảnh, khiên rèn, khiên đã dùng, bộ đếm mảnh về đúng số trong bản lưu; xoá tin; bỏ `khien_moc` + marker. Mảnh kiếm SAU mốc nằm trong `manh_khien_so` nên được cộng bù khi mốc bị bỏ. Bảng lưu và sổ `khien_mat_so` để lại đối soát. Lùi Worker: `wrangler rollback <bản trước>`.

## Luật đi kèm (đã ở mã)
- `MANH_MOI_KHIEN = 36`; nguồn mảnh duy nhất = đạt nhiệm vụ ngày +1; chuỗi bội 7 / dạng rời yếu = 0 (giữ khoá sổ).
- Khiên QUÀ tiến hoá ĐẦU (mốc cấp 10) chỉ mở khi em có ≥ 36 ngày đạt tính từ mốc (`expMoi.ngayDat`, hồ sơ game trả `soNgayDat`); máy chủ là nguồn duy nhất của "khiên còn lại" (`khienRen.conLai`) — máy em chỉ hiển thị số đó.
- Vắng `KHIEN_MAT_KHI_VANG_NGAY = 7` ngày liên tiếp không đạt nhiệm vụ ngày ⇒ mất 1 khiên (cron 00:01, sau khi chốt "đạt ngày" hôm qua): khiên rèn chưa dùng trước, hết thì khiên quà chưa dùng; mảnh không bị trừ; ngày nghỉ hợp lệ (`cau_hinh.ngay_nghi`) không tính là vắng; sau khi trừ đếm lại từ 0; ngày vắng thứ `KHIEN_BAO_VANG_NGAY = 5` báo em MỘT tin (chỉ em đang có khiên). Sổ `khien_mat_so` (khoá `khien|mat|<sbd>|<ngày>`); dòng "A.I Đỗ Đại Học đã trừ 1 khiên của N em…" ở `mayDaLam` của bảng tin thầy.
- Không đếm vắng trước mốc: sớm nhất em mất khiên là 00:01 ngày 28/09 (vắng 21→27/09).
