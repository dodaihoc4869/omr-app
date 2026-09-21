-- LÙI migration-2109-shop-phu-kien.sql. NGUY HIỂM: xoá sổ vàng và đồ em đã mua (tài sản em đã kiếm, không khôi phục được ngoài Time Travel). CHỈ chạy khi Boss VÀ thầy cùng ra lệnh; trước đó ghi mốc Time Travel.
-- Chưa ai mua gì (cờ shop_phu_kien tắt từ đầu) thì lùi không mất gì.
DROP INDEX IF EXISTS idx_phu_kien_so_huu_mon;
DROP TABLE IF EXISTS phu_kien_dang_mac;
DROP TABLE IF EXISTS phu_kien_so_huu;
DROP TABLE IF EXISTS vang_so;
