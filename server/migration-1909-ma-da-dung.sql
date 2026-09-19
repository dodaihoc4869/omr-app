-- CHỈ THÊM (19/09/2026): TẬP MÃ ĐÃ DÙNG, để RESET TOÀN APP (00:01 thứ Hai 21/09) không làm mã cũ được cấp lại.
--
-- Máy học sinh giữ bài làm dở/nháp trong IndexedDB/localStorage theo MÃ CA, mã bài Mẹ giao, mã BTVN. Sau khi máy chủ xoá bảng `ca`, nếu một ca MỚI trùng mã
-- một ca cũ thì máy em có thể "khôi phục" bài của ca cũ vào ca mới — lỗi luồng thi thật. Job reset nạp các mã cũ vào bảng này TRƯỚC khi xoá; đường tạo ca
-- (`publish`) và tạo bài Mẹ giao từ chối mã nằm trong bảng; đường đẩy tờ đáp án (`capNhatKeyBank`, `noiKhoCa`) từ chối mã ca cũ không còn trong `ca`.
--
--   loai  ca | btvn | mom      ma  mã đã dùng      xoa_luc  ISO lúc job nạp
-- Bảng CHỈ THÊM dòng, KHÔNG BAO GIỜ bị reset xoá (nhóm GIỮ). Chưa có bảng thì mọi kiểm tra bỏ qua (đường cũ chạy như trước).
CREATE TABLE IF NOT EXISTS ma_da_dung (
  loai    TEXT NOT NULL,
  ma      TEXT NOT NULL,
  xoa_luc TEXT NOT NULL,
  PRIMARY KEY (loai, ma)
);
