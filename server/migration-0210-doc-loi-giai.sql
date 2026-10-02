-- GĐ1 "Vòng học khép kín v2" (02/10/2026): em đọc lời giải thế nào. CHỈ THÊM. Máy chủ cũng tự tạo lần đầu dùng (loi-giai.ts).
CREATE TABLE IF NOT EXISTS doc_loi_giai (id INTEGER PRIMARY KEY AUTOINCREMENT, sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT, luc TEXT NOT NULL, ngay_vn TEXT NOT NULL, giay INTEGER NOT NULL DEFAULT 0, so_su_kien INTEGER NOT NULL DEFAULT 0, tom_tat_json TEXT, su_kien_json TEXT);
CREATE INDEX IF NOT EXISTS doc_loi_giai_sbd_qid ON doc_loi_giai(sbd, qid);
