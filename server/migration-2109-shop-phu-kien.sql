-- CHỈ THÊM (21/09/2026): CỬA HÀNG PHỤ KIỆN THẦN THÚ — sổ vàng, đồ đã mua, đồ đang mặc (hợp đồng docs/hop-dong-shop-phu-kien-2109.md mục 6; Boss chốt làm 21/09). Chạy lại được (IF NOT EXISTS).
-- `vang_so`: sổ cái CHỈ THÊM DÒNG (không UPDATE/DELETE). Số dư của em = SUM(so_vang). loai: doi (đổi EXP thừa lấy vàng: so_vang > 0, exp_tru = số EXP đã trừ ở ống nghiệm), mua (so_vang < 0), hoan (chỉ Boss sửa lỗi máy chủ).
--   UNIQUE(sbd, khoa_yeu_cau) chống bấm lặp và cũng là chỉ mục tra theo em (tiền tố sbd) nên không thêm chỉ mục riêng.
-- `phu_kien_so_huu`: em đã mua món nào (một em một món một lần; mua rồi giữ mãi, không trả lại). Chỉ mục (ma_mon, mua) để đếm số cái đã bán của món giới hạn số lượng.
-- `phu_kien_dang_mac`: mỗi chỗ đeo của em đang mặc món nào (5 chỗ đeo: hao-quang · vet · khung · dau · co-lung).
-- Vàng và đồ là tài sản em đã kiếm ⇒ GIỮ khi reset toàn app (server/src/reset-toan-app.ts BANG_GIU).
-- Lùi: server/lui-2109-shop-phu-kien.sql (MẤT sổ vàng và đồ đã mua — chỉ khi Boss + thầy cùng ra lệnh).
CREATE TABLE IF NOT EXISTS vang_so (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sbd           TEXT NOT NULL,
  loai          TEXT NOT NULL CHECK (loai IN ('doi', 'mua', 'hoan')),
  so_vang       INTEGER NOT NULL,
  exp_tru       INTEGER NOT NULL DEFAULT 0,
  ma_mon        TEXT,
  khoa_yeu_cau  TEXT NOT NULL,
  luc           TEXT NOT NULL,
  UNIQUE (sbd, khoa_yeu_cau)
);
CREATE TABLE IF NOT EXISTS phu_kien_so_huu (
  sbd           TEXT NOT NULL,
  ma_mon        TEXT NOT NULL,
  mua           TEXT NOT NULL,
  gia           INTEGER NOT NULL,
  khoa_yeu_cau  TEXT NOT NULL,
  luc           TEXT NOT NULL,
  PRIMARY KEY (sbd, ma_mon)
);
CREATE INDEX IF NOT EXISTS idx_phu_kien_so_huu_mon ON phu_kien_so_huu(ma_mon, mua);
CREATE TABLE IF NOT EXISTS phu_kien_dang_mac (
  sbd     TEXT NOT NULL,
  o_gan   TEXT NOT NULL CHECK (o_gan IN ('hao-quang', 'vet', 'khung', 'dau', 'co-lung')),
  ma_mon  TEXT NOT NULL,
  luc     TEXT NOT NULL,
  PRIMARY KEY (sbd, o_gan)
);
