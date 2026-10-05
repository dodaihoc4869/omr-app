-- OMNI 3 (05/10/2026) — migration CHỈ-THÊM. Không sửa, không xoá bảng nào đang có; KHÔNG ALTER bảng cũ.
-- Máy chủ cũng tự tạo các bảng này lần đầu dùng (CI không chạy migration). Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md mục 3.
-- Lùi: DROP TABLE các bảng dưới đây; DELETE FROM cau_hinh WHERE khoa IN ('omni','the_luc_lop','ma_tran_thi_2026','omni_tham_so');
--
-- Thời lượng làm câu, tự tin, nhãn tốc độ: ghi trong su_kien_hoc.raw_json ({chon, ms, tt, td}); lướt: purpose = 'luot', ket_qua = NULL.
-- Mọi bảng omni_* (trừ omni_xac_nhan, omni_ca_chot, omni_ve, omni_de_thu là sự kiện gốc) là ĐỆM: xoá đi dựng lại 100 % từ sổ.

-- Phạm vi đã dạy (tick bài)
CREATE TABLE IF NOT EXISTS bai_da_day (
  id            TEXT PRIMARY KEY,
  lop           TEXT NOT NULL,
  khoa_bai      TEXT NOT NULL,
  ten_bai       TEXT NOT NULL,
  vi_tri        INTEGER NOT NULL,
  ma_to_json    TEXT NOT NULL,
  tick_luc      TEXT NOT NULL,
  nguoi         TEXT,
  chien_dich_id TEXT,
  bo_tick_luc   TEXT
);
CREATE INDEX IF NOT EXISTS bai_da_day_lop ON bai_da_day(lop, vi_tri);
-- Một tick ĐANG HIỆU LỰC cho mỗi (lớp, bài): hai lượt bấm đồng thời không tạo hai chiến dịch (bai-da-day.ts SQL_CHI_MUC_MOT_TICK, cũng tạo lúc chạy).
CREATE UNIQUE INDEX IF NOT EXISTS bai_da_day_mot ON bai_da_day(lop, khoa_bai) WHERE bo_tick_luc IS NULL;
CREATE TABLE IF NOT EXISTS pham_vi_lop (
  lop          TEXT NOT NULL,
  khoa_bai     TEXT NOT NULL,
  ten_bai      TEXT NOT NULL,
  vi_tri       INTEGER NOT NULL,
  ma_de_json   TEXT NOT NULL,
  nguon        TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL,
  PRIMARY KEY (lop, khoa_bai)
);
-- Thư mục mục đích của tờ đề
CREATE TABLE IF NOT EXISTS de_kho_thu_muc (ma_de TEXT PRIMARY KEY, thu_muc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL);
-- Vi kỹ năng + ma trận Q
CREATE TABLE IF NOT EXISTS omni_vkn (id TEXT PRIMARY KEY, ma_dang TEXT NOT NULL, ten TEXT NOT NULL, ten_loi TEXT, nhan_nen TEXT, thu_tu INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS omni_vkn_dang ON omni_vkn(ma_dang, thu_tu);
CREATE TABLE IF NOT EXISTS omni_q (qid TEXT NOT NULL, y INTEGER NOT NULL DEFAULT -1, vkn_json TEXT NOT NULL, nguon TEXT NOT NULL, duyet_luc TEXT, PRIMARY KEY (qid, y));
-- Hồ sơ (ĐỆM)
CREATE TABLE IF NOT EXISTS omni_em (sbd TEXT PRIMARY KEY, n_vung INTEGER NOT NULL DEFAULT 0, n_sai_vung INTEGER NOT NULL DEFAULT 0, s_uoc REAL NOT NULL,
  tau REAL NOT NULL DEFAULT 0, n_tau INTEGER NOT NULL DEFAULT 0, khung_gio_json TEXT, gio_hoc TEXT, muc_tieu REAL NOT NULL DEFAULT 8, cursor TEXT, phien_ban TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS omni_p_vkn (sbd TEXT NOT NULL, vkn_id TEXT NOT NULL, p REAL NOT NULL, n_tu_lam INTEGER NOT NULL, n_cau INTEGER NOT NULL DEFAULT 0, n_ngay INTEGER NOT NULL,
  n_troi_chay INTEGER NOT NULL DEFAULT 0, n_cau_la_dung INTEGER NOT NULL DEFAULT 0, diem_sprt REAL NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL, day_lai INTEGER NOT NULL DEFAULT 0,
  phien_ban TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (sbd, vkn_id));
CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS omni_du_bao (sbd TEXT NOT NULL, pham_vi TEXT NOT NULL, ky_vong REAL NOT NULL, p8 REAL NOT NULL, sai_so REAL NOT NULL, s_dung REAL NOT NULL,
  con_duong TEXT, con_thieu_json TEXT, so_bang_chung INTEGER NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (sbd, pham_vi));
-- Kế hoạch ngày nhiều bài ĐÃ CHỐT (ĐỆM, lập lại từ sổ; đúng câu lệnh srs2-d1.ts LENH_TAO_BANG_KE_HOACH_OMNI, cũng tạo lúc chạy)
CREATE TABLE IF NOT EXISTS srs2_ke_hoach_omni (sbd TEXT NOT NULL, ngay TEXT NOT NULL, chien_dich_json TEXT, on_bai_cu_json TEXT, met_gio TEXT, cap_nhat_luc TEXT, PRIMARY KEY (sbd, ngay));
-- Sự kiện gốc / ghi nhận (chỉ-thêm)
CREATE TABLE IF NOT EXISTS omni_chung_chi (sbd TEXT NOT NULL, chien_dich_id TEXT NOT NULL, cap_luc TEXT NOT NULL, do_tin REAL NOT NULL, diem_ca_chot REAL, ma_ca TEXT, PRIMARY KEY (sbd, chien_dich_id));
CREATE TABLE IF NOT EXISTS omni_xac_nhan (sbd TEXT NOT NULL, ma_dang TEXT NOT NULL, ket TEXT NOT NULL, luc TEXT NOT NULL, nguoi TEXT, PRIMARY KEY (sbd, ma_dang, luc));
CREATE TABLE IF NOT EXISTS omni_ca_chot (chien_dich_id TEXT NOT NULL, ma_ca TEXT NOT NULL, luc TEXT NOT NULL, qid_la_json TEXT, PRIMARY KEY (chien_dich_id, ma_ca));
CREATE TABLE IF NOT EXISTS omni_lo_dien (qid TEXT NOT NULL, ngay_vn TEXT NOT NULL, so_em INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (qid, ngay_vn));
CREATE TABLE IF NOT EXISTS omni_ve (sbd TEXT NOT NULL, tuan TEXT NOT NULL, da_dung INTEGER NOT NULL DEFAULT 0, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (sbd, tuan));
CREATE TABLE IF NOT EXISTS omni_de_thu (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, qid_json TEXT NOT NULL, tao_luc TEXT NOT NULL, het_luc TEXT NOT NULL, nop_luc TEXT, diem REAL);
CREATE INDEX IF NOT EXISTS omni_de_thu_em ON omni_de_thu(sbd, tao_luc);
