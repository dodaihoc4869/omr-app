-- GĐ 2 — KẾ HOẠCH NGÀY (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.3).
--
-- Mỗi (em, ngày VN) một dòng: mục tiêu câu, việc đã xếp, cảnh báo, và — khi ngày đã chốt — kết quả để tính chuỗi
-- ngày tiến bộ. Chỉ THÊM bảng; không đụng bảng nào đang chạy. Kế hoạch tính THUẦN từ dữ liệu có sẵn nên mất bảng
-- này chỉ mất lịch sử kết quả từng ngày, không mất bài của ai.
--
--   ket_qua      NULL = ngày đang diễn ra (hoặc ngày nghỉ) · dat · mot_phan · khong
--   Ngày đã chốt (`ket_qua` khác NULL) KHÔNG bị ghi đè — để chuỗi ngày đọc được từ lịch sử.
--   so_su_kien   số dòng `su_kien_hoc` của em lúc lập kế hoạch: khác số hiện tại ⇒ hồ sơ phải dựng lại
CREATE TABLE IF NOT EXISTS ke_hoach_ngay (
  khoa           TEXT PRIMARY KEY,
  sbd            TEXT NOT NULL,
  ngay           TEXT NOT NULL,
  phien_ban      INTEGER NOT NULL,
  seed           INTEGER NOT NULL,
  ngan_sach_json TEXT NOT NULL,
  viec_json      TEXT NOT NULL,
  canh_bao_json  TEXT NOT NULL,
  ket_qua        TEXT,
  so_cau_da_lam  INTEGER NOT NULL DEFAULT 0,
  so_cau_len_bac INTEGER NOT NULL DEFAULT 0,
  so_cau_tut_bac INTEGER NOT NULL DEFAULT 0,
  la_ngay_nghi   INTEGER NOT NULL DEFAULT 0,
  so_su_kien     INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_khn_em_ngay ON ke_hoach_ngay(sbd, ngay);
CREATE INDEX IF NOT EXISTS idx_khn_ngay ON ke_hoach_ngay(ngay, ket_qua);
