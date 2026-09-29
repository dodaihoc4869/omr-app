-- CHỈ-THÊM (29/09, tối ưu cao điểm 20h–24h). Chạy: npx wrangler d1 execute <DB> --remote --file=server/migration-2909-chi-muc-cao-diem.sql
-- Tập câu bảo vệ ca thi (`protectedQuestions`, game-v2-bank.ts) chạy trên MỌI lệnh Sảnh / start / chốt đáp án (đệm 5 s mỗi isolate) và đếm lượt
-- `da_nop` / `dang_lam` từng ca bằng truy vấn con. Chỉ mục cũ `idx_luot_em(ma_ca, sbd, lan_thu)` phải đọc từng DÒNG luot để lọc trang_thai;
-- chỉ mục này PHỦ cả ba điều kiện (EXPLAIN: "SEARCH l USING COVERING INDEX idx_luot_ca_tt (ma_ca=? AND trang_thai=?)") ⇒ không đọc dòng bảng.
CREATE INDEX IF NOT EXISTS idx_luot_ca_tt ON luot(ma_ca, trang_thai, het_gio_luc);
