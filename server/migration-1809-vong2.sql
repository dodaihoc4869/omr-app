-- Mốc "xong Vòng 1" của BTVN — dùng để tính hạn mềm cho Vòng 2 (KIEM-TRA-VONG-2.md).
-- Không đụng cột cũ, không tạo bảng mới. NULL = chưa xong Vòng 1.
ALTER TABLE btvn_em ADD COLUMN xong_vong1_luc TEXT;
