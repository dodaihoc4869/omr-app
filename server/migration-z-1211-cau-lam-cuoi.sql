-- G5 (12/11, hoá đơn D1): «lần cuối em làm mỗi câu» TÍNH SẴN. Câu đọc `docCauDaLamMoiNguon` (server/src/game-v2-cau-moi.ts, Đoàn Hộ Tống / thử thách OMNI)
-- trước đây `SELECT qid, MAX(luc) FROM su_kien_hoc WHERE sbd = ? GROUP BY qid` — đọc MỌI dòng sổ của em mỗi lượt (~1.863 hàng × 54 nghìn lượt/ngày ≈ 100 triệu).
-- Nay đọc bảng này: MỘT dòng mỗi (em, câu).
-- ĐÚNG ĐẮN: ba trigger trên su_kien_hoc giữ bảng = `SELECT sbd, qid, MAX(luc) … GROUP BY sbd, qid` của sổ, CÙNG giao dịch với mọi lệnh ghi sổ
--   (INSERT: cộng dồn MAX; UPDATE đổi sbd/qid/luc hoặc DELETE: tính lại đúng (em, câu) cũ từ sổ — dò chỉ mục (sbd, qid)). Sổ chỉ ghi bằng INSERT OR IGNORE,
--   ON CONFLICT DO UPDATE và UPDATE (không có REPLACE — REPLACE không gọi trigger xoá).
-- DẤU «đã nạp» = dòng (sbd '*', qid '*'), ghi SAU khi trigger đã có và đã nạp hết sổ cũ. Câu đọc chỉ dùng bảng khi có dấu; chưa có (D1 chưa chạy tệp này)
--   ⇒ cùng câu SQL tính thẳng từ sổ như cũ. Thứ tự trong tệp: bảng → trigger → nạp (cộng dồn MAX, chạy lại vô hại) → dấu.
-- CHI PHÍ: nạp một lần = đọc cả sổ một lượt + ghi một dòng mỗi (em, câu) đã có; sau đó mỗi dòng sổ ghi thêm MỘT dòng ở đây (không thêm vòng chờ D1).
-- CHỈ THÊM. Tên `z-` để chạy sau migration-1909-su-kien-hoc.sql khi nạp theo thứ tự tên. Reset: bảng xếp GIỮ (dẫn xuất từ sổ — sổ cũng GIỮ).
-- ⚠️ KHÔNG BAO GIỜ `DROP TABLE cau_lam_cuoi` khi chưa DROP ba trigger `cau_lam_cuoi_sau_*` (trigger trỏ tới bảng mất ⇒ MỌI lệnh ghi sổ lỗi).
--    Muốn dựng lại: DELETE dấu ('*','*') trước (câu đọc về đường cũ), rồi DELETE + nạp lại, rồi ghi dấu.
CREATE TABLE IF NOT EXISTS cau_lam_cuoi (sbd TEXT NOT NULL, qid TEXT NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (sbd, qid)) WITHOUT ROWID;
CREATE TRIGGER IF NOT EXISTS cau_lam_cuoi_sau_them AFTER INSERT ON su_kien_hoc BEGIN
  INSERT INTO cau_lam_cuoi (sbd, qid, luc) VALUES (NEW.sbd, NEW.qid, NEW.luc) ON CONFLICT (sbd, qid) DO UPDATE SET luc = max(luc, excluded.luc);
END;
CREATE TRIGGER IF NOT EXISTS cau_lam_cuoi_sau_sua AFTER UPDATE ON su_kien_hoc WHEN OLD.sbd IS NOT NEW.sbd OR OLD.qid IS NOT NEW.qid OR OLD.luc IS NOT NEW.luc BEGIN
  DELETE FROM cau_lam_cuoi WHERE sbd = OLD.sbd AND qid = OLD.qid;
  INSERT INTO cau_lam_cuoi (sbd, qid, luc) SELECT sbd, qid, MAX(luc) FROM su_kien_hoc WHERE sbd = OLD.sbd AND qid = OLD.qid GROUP BY sbd, qid;
  INSERT INTO cau_lam_cuoi (sbd, qid, luc) VALUES (NEW.sbd, NEW.qid, NEW.luc) ON CONFLICT (sbd, qid) DO UPDATE SET luc = max(luc, excluded.luc);
END;
CREATE TRIGGER IF NOT EXISTS cau_lam_cuoi_sau_xoa AFTER DELETE ON su_kien_hoc BEGIN
  DELETE FROM cau_lam_cuoi WHERE sbd = OLD.sbd AND qid = OLD.qid;
  INSERT INTO cau_lam_cuoi (sbd, qid, luc) SELECT sbd, qid, MAX(luc) FROM su_kien_hoc WHERE sbd = OLD.sbd AND qid = OLD.qid GROUP BY sbd, qid;
END;
INSERT INTO cau_lam_cuoi (sbd, qid, luc) SELECT sbd, qid, MAX(luc) FROM su_kien_hoc WHERE 1 GROUP BY sbd, qid
  ON CONFLICT (sbd, qid) DO UPDATE SET luc = max(luc, excluded.luc);
INSERT INTO cau_lam_cuoi (sbd, qid, luc) VALUES ('*', '*', '') ON CONFLICT (sbd, qid) DO NOTHING;
