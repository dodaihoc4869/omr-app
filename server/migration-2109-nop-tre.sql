-- CHỈ THÊM (21/09/2026): NỘP TRỄ bài tập về nhà (Dồn về đích, Điều 4 = B — thầy chốt 14:13). Qua hạn nộp em VẪN làm nốt và nộp được; lượt nộp ghi `nop_tre = 1` + `gio_tre` (số giờ trễ, làm tròn LÊN, tối thiểu 1).
-- Hạn nộp KHÔNG đổi; nộp trễ không có EXP đúng hạn / đúng nhịp / vé Đoàn; điểm chấm như thường. Máy chủ ghi hai cột này SAU khi nộp thành công (lỗi/thiếu cột ⇒ bỏ qua, việc nộp vẫn chạy).
-- Chạy MỘT lần (SQLite không có ADD COLUMN IF NOT EXISTS: chạy lại báo "duplicate column name", vô hại). Lùi: ALTER TABLE btvn_em DROP COLUMN nop_tre; ALTER TABLE btvn_em DROP COLUMN gio_tre;
ALTER TABLE btvn_em ADD COLUMN nop_tre INTEGER NOT NULL DEFAULT 0;
ALTER TABLE btvn_em ADD COLUMN gio_tre INTEGER;
