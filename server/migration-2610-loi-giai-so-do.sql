-- LỜI GIẢI KIỂU SƠ ĐỒ CỦA THẦY + GỢI Ý 3 TẦNG (thầy chốt build 26/10). Hợp đồng dữ liệu: src/lib/goi-y-cham/kieu.ts (`BanSoDo`, `KetQuaCong`).
-- CHỈ THÊM: một bảng mới + một chỉ mục; không đụng bảng nào đang có. Dữ liệu cũ (`game_v2_question.json.$.solution`) KHÔNG bị ghi đè.
-- Một dòng cho mỗi câu (qid của kho). `ban_json` = BanSoDo đủ (kể cả `ketQua`); máy chủ cắt `ketQua` trước khi em nộp (server/src/so-do-cong.ts `catTruocNop`).
-- `cong` = kết quả cổng kiểm số lúc lưu ('dat' | 'lech' | 'khong_kiem_duoc' | 'lo_dap_an'); CHỈ 'dat' mới được trả cho em (server/src/loi-giai-so-do.ts).
-- `nguon` = ai soạn (vd 'may-soan:<lô>'); `tao_luc` / `cap_nhat_luc` = mili-giây Unix.
CREATE TABLE IF NOT EXISTS loi_giai_so_do(qid TEXT PRIMARY KEY, phien_ban INTEGER, ban_json TEXT, cong TEXT, ly_do TEXT, nguon TEXT, tao_luc INTEGER, cap_nhat_luc INTEGER);
-- Máy soạn / màn thầy đếm và lọc theo kết quả cổng (đọc của em đi theo khoá chính qid).
CREATE INDEX IF NOT EXISTS loi_giai_so_do_cong ON loi_giai_so_do(cong);
