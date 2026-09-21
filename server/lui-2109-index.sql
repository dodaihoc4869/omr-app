-- LÙI migration-2109-index.sql (chỉ bỏ hai chỉ mục mới; dữ liệu không đổi).
DROP INDEX IF EXISTS idx_skh_em_qid_ngay;
DROP INDEX IF EXISTS idx_skh_em_ngay_qid;
