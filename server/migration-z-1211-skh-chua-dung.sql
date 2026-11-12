-- H1 (12/11, hoá đơn D1 — đợt 3): CHỈ MỤC BỘ PHẬN «lượt CHƯA ĐÚNG» của sổ học (ket_qua 0 hoặc trống). Chỉ chứa dòng ket_qua IS NOT 1 ⇒ ghi thêm
-- MỘT dòng chỉ mục cho mỗi lượt sai / bỏ trống / lượt không chấm (lượt đúng không tốn gì).
-- Phục vụ ba câu đọc nợ của kế hoạch ngày (mỗi câu trước đây đọc MỌI dòng sổ của em, ~1,9–2,3 nghìn hàng/lượt, ~14–16 nghìn lượt/ngày):
--   · docQidSaiTaiLop (srs2-d1.ts) — Lên bảng / đầu giờ sai: dò (sbd, nguon, ket_qua = 0), PHỦ (qid, luc) ⇒ chỉ đọc đúng dòng sai tại lớp;
--   · docQidSaiCaDaCongBo (srs2-d1.ts) — ca thi sai/trống: dò (sbd, nguon = 'thi'), chỉ dòng chưa đúng;
--   · docQidSaiV2 (hang-chua-loi.ts) — sai tự làm mọi kênh: chỉ dòng chưa đúng của em.
-- Câu đọc ghi THÊM đúng điều kiện `ket_qua IS NOT 1` (điều kiện cũ đã kéo theo nó ⇒ kết quả không đổi) để SQLite được dùng chỉ mục bộ phận.
-- CHỈ THÊM. Bảng lớn (~508 nghìn dòng) ⇒ dựng ở cron đêm 00:01 VN (CHI_MUC_CRON_DEM, chi-muc-luc-chay.ts) hoặc chạy tay ngoài giờ học.
CREATE INDEX IF NOT EXISTS idx_skh_em_chua_dung ON su_kien_hoc(sbd, nguon, ket_qua, qid, luc, ma_nguon) WHERE ket_qua IS NOT 1;
