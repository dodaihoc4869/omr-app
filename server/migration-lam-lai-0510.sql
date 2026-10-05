-- CHỈ THÊM (05/10/2026 · "làm lại câu sai bằng bản khác", server/src/cau-anh-em.ts + lam-lai-so.ts): CHỈ MỤC BIỂU THỨC một phần trên
-- su_kien_hoc(sbd, json_extract(raw_json,'$.tc')) — dòng câu ANH EM làm thay câu gốc (`raw_json.tc = <qid gốc>`). docLanLam (srs2-d1) và
-- lanLamCaLop (srs2-gv) đọc sổ bằng HAI nhánh UNION ALL (`sqlQidHoacTc`): nhánh qid đi chỉ mục (sbd, qid) sẵn có, nhánh "thay cho" đi chỉ mục này.
-- Thiếu chỉ mục thì nhánh "thay cho" quét các dòng của em (vẫn đúng, chỉ chậm hơn) — đo EXPLAIN QUERY PLAN: tests/lam-lai-cau-sai-0510-d1.test.ts.
-- Vế WHERE của chỉ mục lặp đúng chữ `json_extract(raw_json,'$.tc') IS NOT NULL` như trong truy vấn (SQLite chỉ dùng chỉ mục một phần khi
-- chứng minh được điều kiện ấy). Không đổi bảng, không đổi dữ liệu; chạy lại vô hại (IF NOT EXISTS).
-- Tên tệp xếp SAU migration-1909-su-kien-hoc.sql và migration-2309-cnh1-su-kien-chuan.sql (bảng + cột raw_json phải có trước; tests/_d1-that.ts nạp theo tên).
-- Kho thật (từ thư mục server/, như các migration chỉ-thêm trước): npx wrangler d1 execute omr --file=migration-lam-lai-0510.sql --remote -y
-- (CHƯA chạy — phiên 05/10 không chạm D1 thật; lùi: DROP INDEX IF EXISTS idx_skh_em_tc).
CREATE INDEX IF NOT EXISTS idx_skh_em_tc ON su_kien_hoc(sbd, json_extract(raw_json,'$.tc')) WHERE json_extract(raw_json,'$.tc') IS NOT NULL;
