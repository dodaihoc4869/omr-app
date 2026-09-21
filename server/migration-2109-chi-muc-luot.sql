-- CHỈ THÊM (21/09/2026, hạ tải D1): chỉ mục cho các truy vấn đọc `luot` theo em (Code 1 đo bằng EXPLAIN trên bản sao lưu thật: 5 lệnh của em — kế hoạch ngày, academic-sync, xem lượt… — đang `SCAN l` cả bảng `luot`).
-- `luot` lớn lên theo (số ca × số em); mỗi kỳ thi thêm hàng nghìn dòng. Chạy lại được (IF NOT EXISTS). Lùi: server/lui-2109-chi-muc-luot.sql. CHƯA chạy --remote (chờ Boss soát + lời thầy).
CREATE INDEX IF NOT EXISTS idx_luot_sbd_nop ON luot(sbd, trang_thai, nop_luc);
