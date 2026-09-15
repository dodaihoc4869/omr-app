-- ĐỒNG BỘ THẦN THÚ ĐA THIẾT BỊ — 15-09-2026
--
-- Thầy bắt được: "trên điện thoại vẫn là trứng, trên web thì là có sừng".
-- Hồ sơ thần thú trước nay chỉ nằm trong localStorage từng máy, nên mỗi máy
-- nuôi một con khác nhau.
--
-- CHỈ THÊM MỘT BẢNG. Không sửa, không xoá bảng nào đang phục vụ ca thi.
--
-- TẦNG ĐỎ: bảng này KHÔNG chứa tên, không số điện thoại, không điểm thi, không
-- ảnh bài. Chỉ chứa tiến trình game: thần thú đã chọn, cấp, EXP, tầng tháp.
-- Máy chủ lọc lại từng trường khi ghi (xem `thanThuGhi`), không tin máy em gửi
-- gì cũng lưu.
CREATE TABLE IF NOT EXISTS than_thu (
  sbd           TEXT PRIMARY KEY,
  -- Hồ sơ game dạng JSON, đã qua bộ lọc trường của máy chủ.
  du_lieu_json  TEXT NOT NULL,
  -- Tổng EXP em đã kiếm từ trước tới nay. ĐƠN ĐIỆU TĂNG, nên dùng làm mốc hoà
  -- giải khi hai máy ghi lệch nhau — chắc hơn so đồng hồ, vì đồng hồ máy em
  -- có thể lệch hàng giờ.
  tong_exp      INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_than_thu_cap_nhat ON than_thu (cap_nhat_luc DESC);
