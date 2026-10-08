-- 08/10/2026 — Một Hành trình giỏi Hóa sống lâu cho mỗi khối.
-- Chỉ thêm bảng phụ; dữ liệu chiến dịch/sự kiện cũ không bị xoá.
CREATE TABLE IF NOT EXISTS hanh_trinh_gioi_hoa (
  khoi TEXT PRIMARY KEY,
  chien_dich_id TEXT NOT NULL UNIQUE,
  phien_ban INTEGER NOT NULL DEFAULT 1,
  tao_luc TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hanh_trinh_hop_nhat (
  chien_dich_cu TEXT PRIMARY KEY,
  chien_dich_moi TEXT NOT NULL,
  khoi TEXT NOT NULL,
  hop_nhat_luc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS srs2_ke_hoach_phut (
  sbd TEXT NOT NULL,
  ngay TEXT NOT NULL,
  phien_ban TEXT NOT NULL,
  nguon_hash TEXT NOT NULL,
  chien_dich_json TEXT NOT NULL,
  ngan_sach_giay INTEGER NOT NULL,
  du_kien_giay INTEGER NOT NULL,
  hoan_cau INTEGER NOT NULL,
  qua_tai_giay INTEGER NOT NULL,
  muc_json TEXT NOT NULL,
  trang_thai TEXT NOT NULL,
  tao_luc TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL,
  PRIMARY KEY (sbd, ngay)
);
