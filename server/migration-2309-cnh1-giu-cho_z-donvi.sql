-- CNH-1.0 (P05 mục 4) — SỬA RV01-followup: khoá theo ĐƠN VỊ NỘI DUNG ĐANG HOẠT ĐỘNG, XUYÊN NGÀY.
--
-- LỖI BỔ SUNG (rà soát độc lập, `review-rv01-followup`): khoá cũ `(sbd, ngay, content_group)` vẫn cho HAI nhiệm vụ
-- cùng đơn vị nội dung khi nhiệm vụ trước CÒN HIỆU LỰC mà qua nửa đêm VN (ngày đổi ⇒ khoá đổi). 04 §2 nói đơn vị
-- đang phát giữ nguyên cho tới khi nhiệm vụ kết thúc, không phụ thuộc ngày lịch.
--
-- CÁCH SỬA: bảng giữ MỘT DÒNG cho mỗi đơn vị nội dung: PK `(sbd, content_group)`; `ngay` chỉ là ngày HOẠT ĐỘNG
-- GẦN NHẤT (cập nhật khi chuyển chủ), không còn nằm trong khoá. Thêm `revision` để CAS gia hạn kiểm đúng chủ.
--
-- BẢO TOÀN DỮ LIỆU: dựng bảng mới rồi sao chép (khử trùng theo đơn vị, giữ dòng có lease xa nhất), rồi đổi tên.
-- Tên tệp `_z-` để chạy SAU `..._giu-cho_nhom.sql` (đã thêm cột) — SQLite chạy migration theo thứ tự tên.
CREATE TABLE IF NOT EXISTS giu_cho_donvi (
  sbd           TEXT NOT NULL,
  content_group TEXT NOT NULL,
  qid           TEXT NOT NULL,
  task_id       TEXT NOT NULL,
  nguon         TEXT NOT NULL DEFAULT '',
  ngay          TEXT NOT NULL DEFAULT '',
  lease_until   INTEGER NOT NULL,
  het_han_task  INTEGER NOT NULL DEFAULT 0,
  revision      INTEGER NOT NULL DEFAULT 1,
  cap_nhat_luc  TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (sbd, content_group)
);

INSERT OR IGNORE INTO giu_cho_donvi (sbd, content_group, qid, task_id, nguon, ngay, lease_until, het_han_task, revision, cap_nhat_luc)
  SELECT sbd,
         CASE WHEN COALESCE(content_group, '') = '' THEN 'qid:' || qid ELSE content_group END,
         qid, task_id, nguon, ngay, lease_until, COALESCE(het_han_task, 0), 1, cap_nhat_luc
    FROM giu_cho
   ORDER BY lease_until DESC;

DROP TABLE giu_cho;
ALTER TABLE giu_cho_donvi RENAME TO giu_cho;
CREATE INDEX IF NOT EXISTS giu_cho_lease ON giu_cho(lease_until);
CREATE INDEX IF NOT EXISTS giu_cho_han_task ON giu_cho(het_han_task);
