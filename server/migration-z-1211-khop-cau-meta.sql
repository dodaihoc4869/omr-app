-- G5 (12/11, hoá đơn D1): điều kiện KHỚP của bảng siêu dữ liệu câu (`KHOP`, server/src/cau-meta.ts) trước đây quét CẢ `game_v2_index` (+ dò cau_meta_to
-- từng tờ) MỖI lần đọc — srs2 docMetaCauD1 ~2.644 hàng/lượt × 36 nghìn lượt/ngày. Nay KHỚP = hai dòng DẤU (`'*'` cũ + `'*k'` mới, dò khoá chính).
-- Dấu `'*k'` chỉ cron ghi (một câu INSERT … SELECT … WHERE <điều kiện khớp đầy đủ> — nguyên tử) và trigger dưới XOÁ nó trong CÙNG giao dịch với mọi
-- lệnh ghi `game_v2_index` ⇒ còn `'*k'` thì điều kiện khớp đầy đủ đúng. Bản sao trong `SQL_CAU_META` (cron dựng lúc chạy).
-- CHỈ THÊM. Tên `z-` để chạy SAU migration-1609 (game_v2_index) và migration-z-1510-cau-meta.sql (cau_meta_to) khi nạp theo thứ tự tên.
-- ⚠️ KHÔNG BAO GIỜ DROP TABLE cau_meta_to khi chưa DROP ba trigger `cau_meta_khop_sau_*` (trigger trỏ tới bảng mất ⇒ mọi lệnh ghi game_v2_index lỗi).
CREATE TABLE IF NOT EXISTS cau_meta_to(ma_de TEXT PRIMARY KEY,indexed_at TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS cau_meta_khop_sau_them AFTER INSERT ON game_v2_index BEGIN
  DELETE FROM cau_meta_to WHERE ma_de = '*k';
END;
CREATE TRIGGER IF NOT EXISTS cau_meta_khop_sau_sua AFTER UPDATE ON game_v2_index WHEN OLD.ma_de IS NOT NEW.ma_de OR OLD.indexed_at IS NOT NEW.indexed_at BEGIN
  DELETE FROM cau_meta_to WHERE ma_de = '*k';
END;
CREATE TRIGGER IF NOT EXISTS cau_meta_khop_sau_xoa AFTER DELETE ON game_v2_index BEGIN
  DELETE FROM cau_meta_to WHERE ma_de = '*k';
END;
