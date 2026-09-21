-- LÙI dữ liệu của server/dat-2109-khien-moc.sql (chỉ dùng khi thầy/Boss yêu cầu). Thứ tự: khôi phục hồ sơ → xoá tin → bỏ mốc + marker. KHÔNG xoá bảng lưu `khien_truoc_reset_2109` và sổ `khien_mat_so` (để đối soát).
-- Khôi phục: mảnh, khiên rèn, khiên đã dùng (gồm cả phần bị trừ vì vắng), bộ đếm mảnh đã tính, số ngày đạt. Mảnh kiếm được SAU mốc nằm trong `manh_khien_so` nên sẽ được cộng bù tự động khi mốc bị bỏ.
UPDATE game_v2_profile
   SET json = json_set(json,
         '$.khienRen.manh', (SELECT b.manh FROM khien_truoc_reset_2109 b WHERE b.sbd = game_v2_profile.sbd),
         '$.khienRen.daRen', (SELECT b.da_ren FROM khien_truoc_reset_2109 b WHERE b.sbd = game_v2_profile.sbd),
         '$.shields.used', (SELECT b.da_dung FROM khien_truoc_reset_2109 b WHERE b.sbd = game_v2_profile.sbd),
         '$.expMoi.manhDaTinh', (SELECT b.exp_manh_da_tinh FROM khien_truoc_reset_2109 b WHERE b.sbd = game_v2_profile.sbd)),
       revision = revision + 1
 WHERE json_extract(json, '$.khienRen') IS NOT NULL
   AND sbd IN (SELECT sbd FROM khien_truoc_reset_2109);
UPDATE game_v2_profile
   SET json = json_set(json, '$.expMoi.ngayDat', (SELECT b.exp_ngay_dat FROM khien_truoc_reset_2109 b WHERE b.sbd = game_v2_profile.sbd))
 WHERE sbd IN (SELECT sbd FROM khien_truoc_reset_2109 WHERE exp_ngay_dat IS NOT NULL) AND json_extract(json, '$.khienRen') IS NOT NULL;
UPDATE game_v2_profile
   SET json = json_remove(json, '$.expMoi.ngayDat')
 WHERE sbd IN (SELECT sbd FROM khien_truoc_reset_2109 WHERE exp_ngay_dat IS NULL) AND json_extract(json, '$.expMoi.ngayDat') IS NOT NULL;
DELETE FROM student_notice WHERE id LIKE 'khien|reset|%|2026-09-21';
DELETE FROM cau_hinh WHERE khoa IN ('khien_moc', 'khien_reset_da_chay');
