-- BẢNG TRA «EM THUỘC CHIẾN DỊCH NÀO» (31/10, server/src/chien-dich-tv.ts) — CHỈ THÊM. Cron mỗi phút cũng tự tạo (CREATE … IF NOT EXISTS, một lô) rồi lập chỉ mục.
-- Trigger chỉ XOÁ DẤU «đã lập chỉ mục» của đúng chiến dịch vừa thêm / xoá / đổi sbd_json (không đụng dữ liệu nào khác).
CREATE TABLE IF NOT EXISTS chien_dich_tv (sbd TEXT NOT NULL, chien_dich_id TEXT NOT NULL, PRIMARY KEY (sbd, chien_dich_id));
CREATE INDEX IF NOT EXISTS idx_chien_dich_tv_cd ON chien_dich_tv(chien_dich_id);
CREATE TABLE IF NOT EXISTS chien_dich_tv_dau (chien_dich_id TEXT PRIMARY KEY, luc TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS chien_dich_tv_sau_them AFTER INSERT ON chien_dich BEGIN
  DELETE FROM chien_dich_tv_dau WHERE chien_dich_id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS chien_dich_tv_sau_sua AFTER UPDATE ON chien_dich WHEN OLD.id IS NOT NEW.id OR OLD.sbd_json IS NOT NEW.sbd_json BEGIN
  DELETE FROM chien_dich_tv_dau WHERE chien_dich_id IN (OLD.id, NEW.id);
END;
CREATE TRIGGER IF NOT EXISTS chien_dich_tv_sau_xoa AFTER DELETE ON chien_dich BEGIN
  DELETE FROM chien_dich_tv_dau WHERE chien_dich_id = OLD.id;
END;
