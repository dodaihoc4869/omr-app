-- CHỈ MỤC ĐỢT CHỮA THEO EM + NHÓM NỘI DUNG (12/11/2026, hoá đơn D1 hàng đọc) — CHỈ-THÊM, chạy lại vô hại.
-- Các câu «đợt của em cho câu này HOẶC cùng nhóm» (chua-cau-sai.ts mở câu, hoi-thay-dong-bo-sua.ts, hoi-thay-kiem-chung-metadata.ts) cũ dùng
-- `sbd=? AND (qid_chuan=? OR content_group=?)` ⇒ chỉ dùng được cột sbd ⇒ quét mọi đợt của em (~290 hàng/lượt, ~300 triệu hàng/ngày).
-- Nay tách hai nhánh (chua-dot-nhom-sql.ts): nhánh câu đi idx_cld_sbd_qid, nhánh nhóm đi chỉ mục dưới đây (dong_luc kèm theo ⇒ «còn mở» lọc ngay trên chỉ mục).
-- Thiếu chỉ mục này mã mới vẫn đúng (nhánh nhóm lùi về quét theo sbd như cũ). Bản sao trong CHI_MUC_CRON_DEM (chi-muc-luc-chay.ts).
-- Chạy: npx wrangler d1 execute omr --file=migration-1211-chua-dot-nhom.sql --remote -y
-- Lùi: DROP INDEX IF EXISTS idx_cld_sbd_nhom
CREATE INDEX IF NOT EXISTS idx_cld_sbd_nhom ON chua_loi_dot(sbd, content_group, dong_luc);
