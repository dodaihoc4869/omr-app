-- B1 (thầy 15/10 "làm cả đợt 1 và 2" — docs/de-xuat-toi-uu-1510.md): 3 chỉ mục còn thiếu cho truy vấn nóng giờ cao điểm. CHỈ THÊM.
-- 1) Nhãn nền của câu bổ trợ (omni-d1.ts nhanNenCau: `WHERE qid_mau IN (…)`) — bảng chỉ có khoá `bam` ⇒ đang quét cả bảng mỗi lần.
CREATE INDEX IF NOT EXISTS idx_cau_bo_tro_mau ON cau_bo_tro(qid_mau);
-- 2) Cạnh tiên quyết cả lớp (hanh-trinh-dong-co.ts SQL_CANH_LOP): chỉ mục PHỦ — đọc đủ cột từ chỉ mục, không quay lại bảng từng dòng.
CREATE INDEX IF NOT EXISTS hanh_trinh_v4_canh_den_phu ON hanh_trinh_v4_canh(den,cap_nhat_luc,tu,sbd,n_co,dung_co,n_chua,dung_chua);
-- (Chỉ mục thứ ba idx_skh_em_luc(sbd,luc,khoa) cho exp-d1 docSo ĐÃ GỠ cùng ngày: D1 không có sqlite_stat1 nên bộ lập kế hoạch lấy nó cho câu
--  "lần làm" sbd + qid + luc thay chỉ mục (sbd, qid) / idx_skh_em_tc ⇒ chậm hơn. Xem .github/workflows/go-chi-muc-skh-luc-1510.yml.)
