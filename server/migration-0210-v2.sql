-- VÒNG HỌC KHÉP KÍN v2 (02/10/2026) — CHỈ THÊM. Máy chủ cũng tự tạo lần đầu dùng (cau-bo-tro.ts, nut-that.ts).
-- Học liệu bổ trợ từng câu (theo băm nội dung): câu song sinh, câu kiểm từng bước, nhãn kiến thức nền.
CREATE TABLE IF NOT EXISTS cau_bo_tro (bam TEXT PRIMARY KEY, qid_mau TEXT NOT NULL, song_sinh_json TEXT, cau_kiem_json TEXT, nhan_nen_json TEXT, buoc_json TEXT, cap_nhat_luc TEXT NOT NULL);
-- Thẻ nút thắt em gửi thầy; lời thầy gỡ gắn vào (câu, bước); câu kiểm từng bước em đã trả lời.
CREATE TABLE IF NOT EXISTS nut_that (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, qid TEXT NOT NULL, bam TEXT NOT NULL, buoc INTEGER NOT NULL, viet TEXT, bang_chung_json TEXT, gui_luc TEXT NOT NULL, ngay_vn TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'cho', go_id TEXT, cap_nhat_luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS nut_that_cho ON nut_that(trang_thai, bam, buoc);
CREATE INDEX IF NOT EXISTS nut_that_em ON nut_that(sbd, ngay_vn);
CREATE TABLE IF NOT EXISTS loi_go (id TEXT PRIMARY KEY, bam TEXT NOT NULL, buoc INTEGER NOT NULL, kieu TEXT NOT NULL, noi_dung TEXT, tep_khoa TEXT, buoi_hoc TEXT, luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS loi_go_cau ON loi_go(bam, buoc);
CREATE TABLE IF NOT EXISTS cau_kiem_lam (id INTEGER PRIMARY KEY AUTOINCREMENT, sbd TEXT NOT NULL, qid TEXT NOT NULL, bam TEXT NOT NULL, buoc INTEGER NOT NULL, tra_loi TEXT, dung INTEGER NOT NULL, giay INTEGER NOT NULL DEFAULT 0, luc TEXT NOT NULL, ngay_vn TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS cau_kiem_lam_em ON cau_kiem_lam(sbd, qid);
-- Ngân hàng câu kiến thức nền của thang tự gỡ (server/src/thang-tu-go.ts): mỗi câu một nhãn nền, nạp qua /kho/nen/day.
CREATE TABLE IF NOT EXISTS cau_nen (id TEXT PRIMARY KEY, nhan TEXT NOT NULL, muc INTEGER NOT NULL DEFAULT 1, kieu TEXT NOT NULL, de TEXT NOT NULL, pa_json TEXT, dap_an TEXT NOT NULL, gia_tri_dung TEXT, giai_json TEXT, meo TEXT, cap_nhat_luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS cau_nen_nhan ON cau_nen(nhan, muc);
