-- H1 (12/11, hoá đơn D1 — đợt 3): «SỐ DÒNG SỔ + MỐC TIẾP NHẬN LỚN NHẤT của từng em» TÍNH SẴN. Câu khoá đệm sổ OMNI `demSoDong` (server/src/omni-d1.ts)
-- trước đây `SELECT sbd, COUNT(*), MAX(COALESCE(received_at,0)) FROM su_kien_hoc WHERE sbd IN (…) GROUP BY sbd` — đọc MỌI dòng chỉ mục của em mỗi lượt
-- (~1,8 nghìn hàng × 23,6 nghìn lượt/ngày ≈ 42,5 triệu). Nay đọc bảng này: MỘT dòng mỗi em.
-- ĐÚNG ĐẮN: ba trigger trên su_kien_hoc giữ (n, r) = (COUNT(*), MAX(COALESCE(received_at,0))) của sổ, CÙNG giao dịch với mọi lệnh ghi sổ:
--   INSERT ⇒ n + 1, r = max(r, mốc mới); UPDATE đổi sbd / received_at (ON CONFLICT DO UPDATE chấm lại ca) hoặc DELETE ⇒ trừ / cộng n và TÍNH LẠI r bằng MỘT
--   lượt dò chỉ mục (sbd, received_at) — không bao giờ COUNT trong trigger. (Tính lại r = mốc lớn nhất khác NULL, không có thì 0 — chỉ khác MAX(COALESCE)
--   khi mọi mốc khác NULL đều ÂM, điều không xảy ra: mốc là mili-giây Date.)
-- Thứ tự trong tệp: bảng → trigger → nạp (GHI ĐÈ n, r bằng số đếm thật — chạy lại vô hại; lượt ghi sổ chen giữa trigger và nạp đã nằm trong số đếm).
-- DẤU «đã nạp» = dòng sbd '*' — ở TỆP RIÊNG migration-z-1211-dau-so-em-dem.sql, chạy SAU khi tệp này xong trọn và đã soát. Chưa có dấu ⇒ câu đọc tính
--   thẳng từ sổ như cũ (cùng một lệnh). Nạp quá giờ một câu D1 ⇒ chạy lại theo khoảng sbd (thêm `AND sbd >= ? AND sbd < ?` vào câu nạp).
-- CHI PHÍ GHI: mỗi dòng sổ mới ghi thêm MỘT dòng ở đây (cập nhật dòng của em). Không thêm vòng chờ D1.
-- CHỈ THÊM. Reset: GIỮ (dẫn xuất từ sổ — sổ cũng GIỮ). Đổi SBD: trigger tự chuyển số sang SBD mới.
-- ⚠️ KHÔNG BAO GIỜ `DROP TABLE so_em_dem` khi chưa DROP ba trigger `so_em_dem_sau_*` (trigger trỏ tới bảng mất ⇒ MỌI lệnh ghi sổ lỗi).
--    Muốn dựng lại: DELETE dấu ('*') trước (câu đọc về đường cũ), rồi chạy lại câu nạp, rồi ghi dấu.
CREATE TABLE IF NOT EXISTS so_em_dem (sbd TEXT NOT NULL PRIMARY KEY, n INTEGER NOT NULL, r INTEGER NOT NULL) WITHOUT ROWID;
CREATE TRIGGER IF NOT EXISTS so_em_dem_sau_them AFTER INSERT ON su_kien_hoc BEGIN
  INSERT INTO so_em_dem (sbd, n, r) VALUES (NEW.sbd, 1, COALESCE(NEW.received_at, 0)) ON CONFLICT (sbd) DO UPDATE SET n = n + 1, r = max(r, excluded.r);
END;
CREATE TRIGGER IF NOT EXISTS so_em_dem_sau_sua AFTER UPDATE ON su_kien_hoc WHEN OLD.sbd IS NOT NEW.sbd OR OLD.received_at IS NOT NEW.received_at BEGIN
  UPDATE so_em_dem SET n = n - 1, r = COALESCE((SELECT received_at FROM su_kien_hoc WHERE sbd = OLD.sbd AND received_at IS NOT NULL ORDER BY received_at DESC LIMIT 1), 0) WHERE sbd = OLD.sbd;
  INSERT INTO so_em_dem (sbd, n, r) VALUES (NEW.sbd, 1, COALESCE((SELECT received_at FROM su_kien_hoc WHERE sbd = NEW.sbd AND received_at IS NOT NULL ORDER BY received_at DESC LIMIT 1), 0))
    ON CONFLICT (sbd) DO UPDATE SET n = n + 1, r = excluded.r;
END;
CREATE TRIGGER IF NOT EXISTS so_em_dem_sau_xoa AFTER DELETE ON su_kien_hoc BEGIN
  UPDATE so_em_dem SET n = n - 1, r = COALESCE((SELECT received_at FROM su_kien_hoc WHERE sbd = OLD.sbd AND received_at IS NOT NULL ORDER BY received_at DESC LIMIT 1), 0) WHERE sbd = OLD.sbd;
END;
INSERT INTO so_em_dem (sbd, n, r) SELECT sbd, COUNT(*), MAX(COALESCE(received_at, 0)) FROM su_kien_hoc WHERE 1 GROUP BY sbd
  ON CONFLICT (sbd) DO UPDATE SET n = excluded.n, r = excluded.r;
