-- LỜI GIẢI KIỂU SƠ ĐỒ CỦA THẦY + GỢI Ý 3 TẦNG (thầy chốt build 26/10). Hợp đồng dữ liệu: src/lib/goi-y-cham/kieu.ts (`BanSoDo`, `KetQuaCong`).
-- CHỈ THÊM: một bảng mới + một chỉ mục; không đụng bảng nào đang có. Dữ liệu cũ (`game_v2_question.json.$.solution`) KHÔNG bị ghi đè.
-- Một dòng cho mỗi câu (qid của kho). `ban_json` = BanSoDo đủ (kể cả `ketQua`); máy chủ cắt `ketQua` trước khi em nộp (server/src/so-do-cong.ts `catTruocNop`).
-- `cong` = kết quả cổng kiểm số lúc lưu ('dat' | 'lech' | 'khong_kiem_duoc' | 'lo_dap_an'); CHỈ 'dat' mới được trả cho em (server/src/loi-giai-so-do.ts).
-- Cột của máy soạn (server/src/soan-so-do.ts, cùng câu CREATE ở SQL_BANG_SO_DO): ma_de/version = câu kho lúc soạn; gia_tri = giá trị chuỗi tính được;
-- so_lan = số lần gọi mô hình; model/token_* = chi phí; tao_luc/cap_nhat_luc = ISO.
CREATE TABLE IF NOT EXISTS loi_giai_so_do (qid TEXT PRIMARY KEY, ma_de TEXT NOT NULL, version TEXT NOT NULL, phien_ban INTEGER NOT NULL,
    ban_json TEXT NOT NULL, cong TEXT NOT NULL, ly_do TEXT, gia_tri TEXT, so_lan INTEGER NOT NULL DEFAULT 1, model TEXT,
    token_vao INTEGER NOT NULL DEFAULT 0, token_ra INTEGER NOT NULL DEFAULT 0, tao_luc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL);
-- Máy soạn / màn thầy đếm và lọc theo kết quả cổng (đọc của em đi theo khoá chính qid).
CREATE INDEX IF NOT EXISTS loi_giai_so_do_cong ON loi_giai_so_do(cong);
