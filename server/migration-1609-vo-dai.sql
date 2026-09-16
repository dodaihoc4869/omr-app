-- ĐẤU TRƯỜNG CHÂN LÝ — PHÒNG SÁU NGƯỜI, 16-09-2026
--
-- Thầy chốt 15-09: "bấm vào võ đài xếp hạng thì phải hiện ra đấu trường chân
-- lý luôn, chọn cửa mời số báo danh tối đa được 6 người chơi cùng lúc".
--
-- CHỈ THÊM HAI BẢNG. Không sửa, không xoá bảng nào đang phục vụ ca thi.
--
-- TẦNG ĐỎ: hai bảng này KHÔNG chứa tên, số điện thoại, điểm thi hay ảnh bài.
-- Số báo danh có mặt vì nó là CÁCH MỜI NHAU — thầy chốt "chọn cửa mời số báo
-- danh". Máy chủ KHÔNG trả số báo danh của bạn cùng phòng về máy em: mỗi người
-- chỉ hiện ra bằng BIỆT DANH (tên thần thú). Xem `voDaiXem`.
--
-- MÁY CHỦ KHÔNG XỬ TRẬN. Trận đánh do `dau-truong-chan-ly.ts` tính trên máy
-- em, và nó TẤT ĐỊNH: cùng mã phòng, cùng vòng, cùng các đội hình đã nộp thì
-- mọi máy ra cùng một kết quả. Máy chủ chỉ là chỗ cất đội hình đã nộp. Nhờ vậy
-- không phải chép bộ luật sang Worker rồi sống với hai bản luật lệch nhau.
CREATE TABLE IF NOT EXISTS vo_dai_phong (
  ma            TEXT PRIMARY KEY,      -- bốn ký tự, chữ IN và số
  chu_sbd       TEXT NOT NULL,         -- ai mở phòng; chỉ người này bấm bắt đầu
  trang_thai    TEXT NOT NULL,         -- 'cho' | 'dang_choi' | 'xong'
  vong          INTEGER NOT NULL DEFAULT 0,
  du_lieu_json  TEXT NOT NULL,         -- người trong phòng + đội hình đã nộp
  tao_luc       TEXT NOT NULL,
  cap_nhat_luc  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vo_dai_phong_luc ON vo_dai_phong (cap_nhat_luc DESC);

-- LỜI MỜI. Một dòng là một lần chủ phòng mời một số báo danh.
CREATE TABLE IF NOT EXISTS vo_dai_moi (
  sbd     TEXT NOT NULL,               -- người được mời
  ma      TEXT NOT NULL,               -- mã phòng
  moi_luc TEXT NOT NULL,
  PRIMARY KEY (sbd, ma)
);

CREATE INDEX IF NOT EXISTS idx_vo_dai_moi_sbd ON vo_dai_moi (sbd, moi_luc DESC);
