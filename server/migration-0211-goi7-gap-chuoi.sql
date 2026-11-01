-- CHỈ-THÊM (02/11): chuỗi ngày đếm thêm CÂU HỌC CÁCH GIẢI (`goi_bai_7_gap`) như màn «Đủ x/y câu» — SQL_SO_CAU_MUC / sqlDaDuMuc (server/src/chuoi-ngay-bai.ts).
-- Bảng vốn tạo lúc chạy (SQL_GOI7, server/src/goi-bai-7-schema.ts; deploy áp mỗi lần qua scripts/ap-migration-goi7.ts) ⇒ D1 thật ĐÃ CÓ, chạy lại không đổi gì.
-- Khai ở đây để mọi nơi dựng lược đồ từ migration (D1 giả của test) cũng có bảng — câu chuỗi không lỗi «no such table». DDL y hệt SQL_GOI7.
CREATE TABLE IF NOT EXISTS goi_bai_7_gap (receipt TEXT PRIMARY KEY,goi_id TEXT NOT NULL,sbd TEXT NOT NULL,qid TEXT NOT NULL,version TEXT NOT NULL,kieu TEXT NOT NULL,luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS goi_bai_7_gap_em ON goi_bai_7_gap(goi_id,sbd,qid,version);
CREATE INDEX IF NOT EXISTS goi_bai_7_gap_sbd_qid ON goi_bai_7_gap(sbd,qid,version);
CREATE INDEX IF NOT EXISTS goi_bai_7_gap_sbd_luc ON goi_bai_7_gap(sbd,luc);
