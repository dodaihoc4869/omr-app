-- 12/11 tối (H3 đợt 3 giảm chi phí D1). CHỈ-THÊM, chạy lại vô hại. TÁCH RIÊNG vì su_kien_hoc là bảng LỚN NHẤT (~vài trăm nghìn dòng): lần dựng đầu đọc cả
-- bảng và ghi một dòng chỉ mục cho mỗi dòng sổ học (trừ thi / lên bảng) — chạy NGOÀI 18–24h VN, hoặc để cron 00:01 VN tự dựng (CHI_MUC_CRON_DEM, chi-muc-luc-chay.ts).
-- (Q8) Dòng thời gian em ở màn thầy (server/src/gv-hom-nay-v2.ts DONG_THOI_GIAN): đo 24h 1.308 lượt × ~6.494 hàng — nhánh sổ học đọc mọi dòng su_kien_hoc của em
-- qua chỉ mục rồi tra bảng. Chỉ mục PHỦ BỘ PHẬN: GROUP BY theo thứ tự chỉ mục, không chạm bảng. Điều kiện `nguon NOT IN ('thi','len_bang')` chỉ câu này có ⇒ câu khác
-- trên su_kien_hoc không đổi kế hoạch. Ghi thêm: một dòng chỉ mục cho mỗi dòng sổ học (trừ thi / lên bảng).
CREATE INDEX IF NOT EXISTS skh_em_dong_tg ON su_kien_hoc(sbd, nguon, ma_nguon, ngay_vn, luc, ket_qua, giay) WHERE nguon NOT IN ('thi','len_bang');
