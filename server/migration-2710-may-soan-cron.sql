-- MÁY SOẠN «LỜI GIẢI KIỂU SƠ ĐỒ» CHẠY BẰNG CRON SẴN CÓ (27/10). Mã: server/src/may-soan-cron.ts (cùng câu CREATE ở SQL_BANG_MAY_SOAN, tự tạo lúc chạy).
-- CHỈ THÊM: một bảng mới, một dòng (id = 1); không đụng bảng nào đang có.
-- vong = 'chinh' (quét kho) | 'sua' (soạn lại câu lech / lo_dap_an) | 'xong'; con_tro = chỗ dừng lượt trước; dang_chay_den = khoá chạy (ms, cũng là thẻ sở hữu);
-- so_loi_lien_tiep / nghi_den (ms) = tự hãm khi Gemini hết hạn mức; ly_do = chữ do cron tự viết (không chứa đáp án); dem_json = số đếm cộng dồn.
CREATE TABLE IF NOT EXISTS may_soan_trang_thai (id INTEGER PRIMARY KEY, vong TEXT NOT NULL, con_tro TEXT NOT NULL DEFAULT '',
    dang_chay_den INTEGER NOT NULL DEFAULT 0, so_loi_lien_tiep INTEGER NOT NULL DEFAULT 0, nghi_den INTEGER NOT NULL DEFAULT 0, ly_do TEXT,
    dem_json TEXT NOT NULL DEFAULT '{}', cap_nhat_luc TEXT);
INSERT OR IGNORE INTO may_soan_trang_thai (id, vong, con_tro, dang_chay_den, so_loi_lien_tiep, nghi_den, dem_json) VALUES (1, 'chinh', '', 0, 0, 0, '{}');
