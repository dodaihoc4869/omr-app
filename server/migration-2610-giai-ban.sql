-- CHỈ THÊM (26/10/2026): THƯỞNG PHẠT PHẦN B — GIẢI TUẦN + HỌC CÙNG BẠN (thầy chốt bản vẽ 26/10; đặc tả docs/ban-ve-thuong-phat-2610/DAC-TA-THUONG-PHAT-2610.md §4.5).
-- Chạy lại được (IF NOT EXISTS / INSERT OR IGNORE). Không sửa/xoá bảng/cột đang chạy. Bảng của phần A (thong_bao_thuong, huy_hieu_em, …) ở migration-2610-thuong-phat.sql.
--
-- giai_tuan: MỘT dòng mỗi (tuần, em) — tuần = thứ Hai giờ VN (YYYY-MM-DD). Dòng sinh khi em có nguyên tử ĐẦU TIÊN trong tuần (trigger dưới), nhóm gán sau
--   (nhom = '' ⇒ chờ xếp; '-' ⇒ không xếp: tài khoản thử / đã khoá). nguyen_tu / nguyen_tu_ho_tro = CỘNG SẴN theo tuần mỗi lần ghi exp_so (không quét sổ khi
--   đọc bảng giải). Chốt thứ Hai 00:05: nguyen_tu_that, thu_hang_chot, hang_sau, chot_luc.
CREATE TABLE IF NOT EXISTS giai_tuan (
  tuan              TEXT NOT NULL,
  em                TEXT NOT NULL,
  hang              TEXT NOT NULL DEFAULT 'sat',
  nhom              TEXT NOT NULL DEFAULT '',
  nguyen_tu         INTEGER NOT NULL DEFAULT 0,
  nguyen_tu_ho_tro  INTEGER NOT NULL DEFAULT 0,
  nguyen_tu_that    INTEGER,
  thu_hang_chot     INTEGER,
  hang_sau          TEXT,
  vao_luc           TEXT NOT NULL,
  chot_luc          TEXT,
  PRIMARY KEY (tuan, em)
);
CREATE INDEX IF NOT EXISTS idx_giai_tuan_nhom ON giai_tuan(tuan, nhom);
CREATE INDEX IF NOT EXISTS idx_giai_tuan_em ON giai_tuan(em, tuan);

-- CỘNG SẴN nguyên tử tuần: mỗi dòng exp_so MỚI (INSERT OR IGNORE trùng khoá ⇒ không chạy) cộng vào dòng tuần của em. Khoản sau CN 22:00 VN không tính.
-- Hạng của tuần = hạng sau chốt của tuần gần nhất trước đó (mặc định Sắt). Tuần đã chốt ⇒ không cộng nữa.
-- nguyen_tu_ho_tro: khoản «đúng có hỗ trợ» — bảng giải trừ ra (chỉ lượt Học thật). Phần A (exp-hoc-tap.ts) ghi khoản này loai 'cau' với ghi_chu
--   bắt đầu «Câu đúng có hỗ trợ»; nhận cả loai 'cau_ho_tro' nếu sau này A tách loại. Khớp `laKhoanHoTro` trong thuong-giai-tuan.ts.
CREATE TRIGGER IF NOT EXISTS trg_exp_so_giai_tuan AFTER INSERT ON exp_so
WHEN NEW.exp > 0 AND NOT (strftime('%w', NEW.ngay_vn) = '0' AND NEW.luc >= NEW.ngay_vn || 'T15:00:00')
BEGIN
  INSERT INTO giai_tuan (tuan, em, hang, nhom, nguyen_tu, nguyen_tu_ho_tro, vao_luc)
  VALUES (
    date(NEW.ngay_vn, '-6 days', 'weekday 1'),
    NEW.sbd,
    COALESCE((SELECT COALESCE(g.hang_sau, g.hang) FROM giai_tuan g WHERE g.em = NEW.sbd AND g.tuan < date(NEW.ngay_vn, '-6 days', 'weekday 1') ORDER BY g.tuan DESC LIMIT 1), 'sat'),
    '',
    NEW.exp,
    CASE WHEN NEW.loai = 'cau_ho_tro' OR (NEW.loai = 'cau' AND NEW.ghi_chu LIKE 'Câu đúng có hỗ trợ%') THEN NEW.exp ELSE 0 END,
    NEW.luc
  )
  ON CONFLICT(tuan, em) DO UPDATE SET nguyen_tu = giai_tuan.nguyen_tu + excluded.nguyen_tu, nguyen_tu_ho_tro = giai_tuan.nguyen_tu_ho_tro + excluded.nguyen_tu_ho_tro
  WHERE giai_tuan.chot_luc IS NULL;
END;

-- Lấp tuần đang chạy (một lần lúc chạy migration): nguyên tử đã ghi từ thứ Hai tới giờ.
INSERT OR IGNORE INTO giai_tuan (tuan, em, hang, nhom, nguyen_tu, nguyen_tu_ho_tro, vao_luc)
SELECT date(ngay_vn, '-6 days', 'weekday 1'), sbd, 'sat', '', SUM(exp), SUM(CASE WHEN loai = 'cau_ho_tro' OR (loai = 'cau' AND ghi_chu LIKE 'Câu đúng có hỗ trợ%') THEN exp ELSE 0 END), MIN(luc)
  FROM exp_so
 WHERE ngay_vn >= date('now', '+7 hours', '-6 days', 'weekday 1') AND exp > 0
   AND NOT (strftime('%w', ngay_vn) = '0' AND luc >= ngay_vn || 'T15:00:00')
 GROUP BY date(ngay_vn, '-6 days', 'weekday 1'), sbd;

-- ban_hoc: một cặp (em_a < em_b theo sbd). trang_thai: cho (đã mời, chờ đồng ý) | dong_y | tu_choi | thoi. nguoi_moi = sbd người mời.
--   chuoi_doi = số ngày CẢ HAI cùng xong ≥ 1 bài, tính tới hết ngày `ngay_tinh` (cron 00:10). moc_da = mốc đôi lớn nhất đã thưởng (7/30/100).
CREATE TABLE IF NOT EXISTS ban_hoc (
  em_a          TEXT NOT NULL,
  em_b          TEXT NOT NULL,
  trang_thai    TEXT NOT NULL DEFAULT 'cho',
  nguoi_moi     TEXT NOT NULL,
  tu_ngay       TEXT,
  chuoi_doi     INTEGER NOT NULL DEFAULT 0,
  ngay_tinh     TEXT,
  moc_da        INTEGER NOT NULL DEFAULT 0,
  moi_luc       TEXT NOT NULL,
  cap_nhat_luc  TEXT NOT NULL,
  PRIMARY KEY (em_a, em_b)
);
CREATE INDEX IF NOT EXISTS idx_ban_hoc_b ON ban_hoc(em_b, trang_thai);
CREATE INDEX IF NOT EXISTS idx_ban_hoc_tinh ON ban_hoc(trang_thai, ngay_tinh);

-- go_cua: em gõ cửa nhắc bạn — một lần mỗi ngày mỗi bạn (khoá chính chống lặp).
CREATE TABLE IF NOT EXISTS go_cua (
  ngay    TEXT NOT NULL,
  tu_em   TEXT NOT NULL,
  toi_em  TEXT NOT NULL,
  luc     TEXT NOT NULL,
  PRIMARY KEY (ngay, tu_em, toi_em)
);
CREATE INDEX IF NOT EXISTS idx_go_cua_toi ON go_cua(toi_em, ngay);

-- Bảng xếp học sinh (danh-gia-hoc-that-d1.ts dựng lúc chạy) — CÙNG câu DDL, để bảng giải đọc `bac` cả khi cron xếp chưa từng chạy.
CREATE TABLE IF NOT EXISTS danh_gia_em_tuan (sbd TEXT NOT NULL, tuan TEXT NOT NULL, diem REAL NOT NULL, bac_tuan INTEGER NOT NULL, bac INTEGER NOT NULL,
     co_do INTEGER NOT NULL DEFAULT 0, du_du_lieu INTEGER NOT NULL DEFAULT 1, phat_json TEXT, so_lieu_json TEXT, tien_bo_json TEXT, ly_do_json TEXT, viec TEXT,
     bang_chung_json TEXT, co_do_nang_json TEXT, tinh_luc TEXT NOT NULL, PRIMARY KEY (sbd, tuan));

-- Bình mua của B3 (chuoi-ngay-bai-d1.ts tạo lúc chạy khi cộng bình lần đầu) — CÙNG câu DDL, để câu đọc nhật ký chuỗi của phần B (một batch) luôn chạy.
CREATE TABLE IF NOT EXISTS chuoi_binh_mua (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, so INTEGER NOT NULL, nguon TEXT NOT NULL, luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_chuoi_binh_mua_sbd ON chuoi_binh_mua (sbd, luc);

-- Ngày vắng có phép tra theo em (bảng thầy cả lớp / cron chuỗi đôi / phụ huynh): điểm danh chỉ có PK (buoi_id, sbd) ⇒ thêm chỉ mục theo em (chỉ thêm).
-- Hai bảng điểm danh: CÙNG câu DDL của migration-2809-buoi-hoc.sql (D1 thật đã có ⇒ không làm gì; chỉ để tệp này chạy được độc lập thứ tự).
CREATE TABLE IF NOT EXISTS buoi_hoc (id TEXT PRIMARY KEY, ten TEXT NOT NULL, lop TEXT NOT NULL DEFAULT '', bi_mat TEXT NOT NULL, mo_luc TEXT NOT NULL, het_han TEXT NOT NULL, dong_luc TEXT, cap_nhat_luc TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS buoi_hoc_diem_danh (buoi_id TEXT NOT NULL, sbd TEXT NOT NULL, luc TEXT NOT NULL, cach TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'co_mat', cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (buoi_id, sbd));
CREATE INDEX IF NOT EXISTS idx_bhdd_sbd_tt ON buoi_hoc_diem_danh(sbd, trang_thai);
