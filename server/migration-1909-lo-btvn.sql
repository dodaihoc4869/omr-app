-- LÔ BTVN THEO NGÀY/GIỜ thay Vòng 1/Vòng 2 (mục 3 SO-VIEC.md 19/09).
-- Không đụng cột cũ: `xong_vong1_luc` giữ nguyên làm dữ liệu lịch sử, không
-- đọc nữa. Lịch lô (ngày/giờ mở từng lô) tính THUẦN từ giao_luc/han_nop/so_cau
-- (xem src/lib/lich-lo-btvn.ts) — không lưu, vì tính lại lúc nào cũng ra đúng
-- một kết quả. Chỉ cần lưu DUY NHẤT tiến độ: đã xong bao nhiêu lô.
ALTER TABLE btvn_em ADD COLUMN lo_da_xong INTEGER NOT NULL DEFAULT 0;
