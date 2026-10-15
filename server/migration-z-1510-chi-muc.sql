-- B1 (thầy 15/10 "làm cả đợt 1 và 2" — docs/de-xuat-toi-uu-1510.md): 3 chỉ mục còn thiếu cho truy vấn nóng giờ cao điểm. CHỈ THÊM.
-- 1) Nhãn nền của câu bổ trợ (omni-d1.ts nhanNenCau: `WHERE qid_mau IN (…)`) — bảng chỉ có khoá `bam` ⇒ đang quét cả bảng mỗi lần.
CREATE INDEX IF NOT EXISTS idx_cau_bo_tro_mau ON cau_bo_tro(qid_mau);
-- 2) Cạnh tiên quyết cả lớp (hanh-trinh-dong-co.ts SQL_CANH_LOP): chỉ mục PHỦ — đọc đủ cột từ chỉ mục, không quay lại bảng từng dòng.
CREATE INDEX IF NOT EXISTS hanh_trinh_v4_canh_den_phu ON hanh_trinh_v4_canh(den,cap_nhat_luc,tu,sbd,n_co,dung_co,n_chua,dung_chua);
-- 3) Sổ học một em theo thời gian (exp-d1.ts docSo: `WHERE sbd=? ORDER BY luc, khoa`) — bỏ bước sắp xếp tạm.
CREATE INDEX IF NOT EXISTS idx_skh_em_luc ON su_kien_hoc(sbd,luc,khoa);
