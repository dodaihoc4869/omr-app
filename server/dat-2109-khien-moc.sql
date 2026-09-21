-- GHI DỮ LIỆU THẬT MỘT LẦN (21/09/2026, thầy lệnh: "lên độ khó của khiên, RESET lại hết mảnh khiên và mốc ban đầu cho công bằng"). KHÔNG xoá sổ, KHÔNG đụng EXP, cấp, thần thú, chuỗi ngày, vé, điểm.
-- Đọc docs/chay-that-2109-khien-thu-tu.md TRƯỚC: SAO LƯU D1 → migration-2109-khien.sql → Worker gói khiên → TỆP NÀY → câu kiểm. Lùi: server/dat-2109-khien-moc-lui.sql. Chạy lại tệp này an toàn (marker `khien_reset_da_chay`).
-- Đặt tên KHÔNG bắt đầu bằng "migration-" (bộ test nạp mọi migration-*.sql vào D1 giả).

-- BƯỚC 1 · MỐC (PHẢI đứng đầu: máy chủ đọc mốc trước khi hồ sơ về 0, để không cộng lại mảnh cũ). Dòng `manh_khien_so` cũ GIỮ NGUYÊN, chỉ không được đếm.
INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('khien_moc', '2026-09-21', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc;

-- BƯỚC 2 · CHÉP LƯU hồ sơ khiên của từng em (INSERT OR IGNORE: bản gốc không bị ghi đè khi chạy lại) + tính sẵn `da_ren_moi` = daRen − khiên rèn CHƯA dùng theo luật MỚI
-- (khiên quà tiến hoá đầu, mốc cấp 10, khoá tới đủ 36 ngày đạt ⇒ quà = entitlement(cấp) − (cấp ≥ 10 ? 1 : 0); còn lại = quà + daRen − used; chưa dùng = min(daRen, còn lại)).
INSERT OR IGNORE INTO khien_truoc_reset_2109 (sbd, manh, da_ren, da_dung, exp_manh_da_tinh, exp_ngay_dat, cap, da_ren_moi, revision, chep_luc)
SELECT sbd, manh, r, u, mdt, ndat, cap,
       r - MIN(r, MAX(0, (CASE WHEN cap >= 100 THEN 12 WHEN cap >= 70 THEN 9 WHEN cap >= 50 THEN 6 WHEN cap >= 30 THEN 3 WHEN cap >= 10 THEN 1 ELSE 0 END) - (CASE WHEN cap >= 10 THEN 1 ELSE 0 END) + r - u)),
       revision, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  FROM (SELECT sbd, revision,
               CAST(COALESCE(json_extract(json, '$.cap'), 1) AS INTEGER) AS cap,
               CAST(COALESCE(json_extract(json, '$.khienRen.manh'), 0) AS INTEGER) AS manh,
               CAST(COALESCE(json_extract(json, '$.khienRen.daRen'), 0) AS INTEGER) AS r,
               CAST(COALESCE(json_extract(json, '$.shields.used'), 0) AS INTEGER) AS u,
               CAST(COALESCE(json_extract(json, '$.expMoi.manhDaTinh'), 0) AS INTEGER) AS mdt,
               json_extract(json, '$.expMoi.ngayDat') AS ndat
          FROM game_v2_profile);

-- BƯỚC 3 · ĐẶT LẠI: mảnh = 0, khiên rèn CHƯA dùng = 0 (giữ phần đã dùng), bộ đếm mảnh đã tính về 0, số ngày đạt tính lại từ mốc. Chỉ em ĐÃ có `khienRen`; chỉ MỘT lần (marker).
UPDATE game_v2_profile
   SET json = json_set(json,
         '$.khienRen.manh', 0,
         '$.khienRen.daRen', (SELECT b.da_ren_moi FROM khien_truoc_reset_2109 b WHERE b.sbd = game_v2_profile.sbd),
         '$.expMoi.manhDaTinh', 0,
         '$.expMoi.ngayDat', 0),
       revision = revision + 1
 WHERE json_extract(json, '$.khienRen') IS NOT NULL
   AND sbd IN (SELECT sbd FROM khien_truoc_reset_2109)
   AND NOT EXISTS (SELECT 1 FROM cau_hinh WHERE khoa = 'khien_reset_da_chay');

-- BƯỚC 4 · MỘT TIN trong app cho mỗi em có hồ sơ game (INSERT OR IGNORE theo id ⇒ chạy lại không gửi đôi; nằm trong danh sách thông báo hiện có).
INSERT OR IGNORE INTO student_notice (id, sbd, title, body, target, created_at)
SELECT 'khien|reset|' || sbd || '|2026-09-21', sbd, 'A.I Đỗ Đại Học · Khiên của em',
       'A.I Đỗ Đại Học báo em: từ hôm nay khiên được rèn theo luật mới cho mọi bạn. Mỗi ngày đạt nhiệm vụ được 1 mảnh, đủ 36 mảnh rèn một khiên. Mảnh của tất cả các bạn cùng bắt đầu lại từ 0.',
       'khien', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  FROM khien_truoc_reset_2109;

-- BƯỚC 5 · MARKER: đã đặt lại (chạy lại tệp này không đặt lại lần nữa, không xoá mảnh em vừa kiếm).
INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('khien_reset_da_chay', '2026-09-21', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
