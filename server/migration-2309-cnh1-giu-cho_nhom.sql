-- CNH-1.0 (P05 mục 4) — SỬA RV01 + RV02 của rà soát độc lập 01.
--
-- RV01: giữ chỗ phải theo ĐƠN VỊ NỘI DUNG (`content_group`), không chỉ theo `qid` — hai qid KHÁC nhau
--   nhưng cùng `content_group` là MỘT đơn vị (04 §2), nếu khoá theo qid thì hai task nhận hai bản sao cùng lúc.
-- RV02: hết LEASE THIẾT BỊ không được sinh attempt/task MỚI khi nhiệm vụ còn hiệu lực (04 §2). Cần cột
--   `het_han_task` (hạn của NHIỆM VỤ) tách khỏi `lease_until` (hạn của THIẾT BỊ đang giữ).
--
-- BẢO TOÀN DỮ LIỆU: cột mới có DEFAULT; dòng cũ được suy `content_group` theo qid (mỗi câu một đơn vị —
-- KHÔNG bịa nhóm) và `het_han_task = 0` (coi như theo lease) để không chặn oan dữ liệu cũ.
ALTER TABLE giu_cho ADD COLUMN content_group TEXT NOT NULL DEFAULT '';
ALTER TABLE giu_cho ADD COLUMN het_han_task INTEGER NOT NULL DEFAULT 0;
UPDATE giu_cho SET content_group = 'qid:' || qid WHERE COALESCE(content_group, '') = '';

-- KHOÁ DUY NHẤT theo ĐƠN VỊ NỘI DUNG: một `content_group` chỉ thuộc MỘT nhiệm vụ trong một ngày của một em.
CREATE UNIQUE INDEX IF NOT EXISTS giu_cho_nhom ON giu_cho(sbd, ngay, content_group);
CREATE INDEX IF NOT EXISTS giu_cho_han_task ON giu_cho(ngay, het_han_task);
