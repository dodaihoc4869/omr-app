-- 12/11 ĐỢT 3 · NHÓM H2 (hoá đơn D1 hàng đọc — câu GỌI RẤT NHIỀU, mỗi lượt đọc vài chục–vài trăm hàng). CHỈ-THÊM, chạy lại vô hại.
-- Tên «z-» để D1 giả trong test (tests/_d1-that.ts nạp migration theo thứ tự tên) dựng SAU mọi bảng mà trigger bên dưới trỏ tới.
-- Test khoá: tests/h2-goi-nhieu-1211.test.ts.

-- (2) `SELECT COUNT(*) AS n FROM ca WHERE trang_thai='mo'` (goi-bai-7.ts dongBoThat7, 493 nghìn lượt × 41 hàng) và mọi `EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`
--     (chặn ghi khi có ca thi mở): bảng `ca` không có chỉ mục nào ngoài khoá chính ⇒ quét cả bảng. Nay SEARCH theo trạng thái (đọc đúng số ca đang mở).
CREATE INDEX IF NOT EXISTS idx_ca_trang_thai ON ca(trang_thai);
-- (3) caDangBaoVe (game-v2-bank.ts, 371 nghìn lượt × 41 hàng): chỉ mục BỘ PHẬN chỉ chứa ca CÓ THỂ còn bảo vệ đề — bỏ ca đã xoá và ca ĐÃ ĐÓNG đã công bố
--     (cong_bo ngay / ca_lop_xong — đúng nhánh `released` của bộ lọc JS, ca đóng thì canStillTest=false). Câu SQL chép NGUYÊN VĂN hai điều kiện này.
CREATE INDEX IF NOT EXISTS idx_ca_bao_ve ON ca(ma_ca) WHERE trang_thai<>'da_xoa' AND (trang_thai<>'dong' OR COALESCE(cong_bo,'') NOT IN ('ngay','ca_lop_xong'));

-- (4) ddl-mot-lan.ts: bản sao DÙNG CHUNG danh sách tên đối tượng lược đồ (một dòng) — thay cho mỗi isolate mới đọc cả sqlite_master (~760 hàng).
--     Cron mỗi 10 phút chép lại (`lamMoiTenDoiTuongChung`); chưa có dòng ⇒ đọc sqlite_master như cũ (không chép ở đây: D1 giả của test dựng bảng sau migration).
CREATE TABLE IF NOT EXISTS ddl_ten_chung (id INTEGER PRIMARY KEY CHECK (id = 1), ten_json TEXT NOT NULL, luc INTEGER NOT NULL);

-- (11)(7)(9)(12)(1) DẤU BẢNG do TRIGGER giữ (server/src/dau-bang.ts): đọc «bảng X đã đổi chưa» = MỘT hàng theo khoá chính, thay cho COUNT(*)/MAX(...) quét cả bảng
--     (dấu kho `COUNT(*)||'|'||MAX(indexed_at)` đọc mọi dòng game_v2_index; vân tay Hành trình đọc cả cau_hoi + chien_dich: 11.604 hàng/lượt).
--  · game_v2_index: dấu = ĐÚNG chuỗi cũ `COUNT(*)||'|'||COALESCE(MAX(indexed_at),'')`, tính lại trong trigger (bảng nhỏ, chỉ ghi khi lập chỉ mục tờ) ⇒ mọi nơi
--    so dấu kho / dauTruocLucDoc / kho_chup giữ nguyên giá trị.
--  · cau_hoi, chien_dich: SỐ PHIÊN tăng 1 mỗi dòng ghi (mồi bằng mốc ms ⇒ xoá dòng dấu rồi mồi lại không bao giờ trùng số cũ); chien_dich chỉ theo đúng các
--    cột vân tay Hành trình đọc (SQL_CD_VT) + thêm/xoá dòng. Hai bảng ít ghi (nhập đề / gộp chiến dịch) ⇒ thêm ít hàng ghi.
--  · omni_q, omni_beta_cau: KHÔNG trigger theo dòng (GHI đắt gấp 1.000 ĐỌC — omni_q / β ghi theo lô nhiều dòng): số phiên do NƠI GHI tăng một lần mỗi lô
--    (kho-chung.ts boKhoChup sau mọi lô ghi omni_q; omni-d1.ts tinhBetaMoiCau trong lô cuối), dấu đọc kèm MAX(rowid) của bảng (xoá hết / thêm dòng ⇒ đổi).
--  · game_v2_question: KHÔNG trigger — chỉ ghi CÙNG LÔ với game_v2_index (lapChiMucTo, danhCoTuLuanKho; test khoá danh sách nơi ghi) ⇒ dùng dấu game_v2_index.
--  TRIGGER TẠO TRƯỚC, MỒI SAU: lượt ghi chen giữa hai bước chỉ cập nhật 0 dòng, rồi phần mồi tính từ dữ liệu hiện tại ⇒ không lỡ thay đổi nào.
--  Mã không bao giờ tự tạo trigger (thiếu bảng dau_bang mà có trigger ⇒ mọi lượt ghi bảng nguồn lỗi): bảng + trigger + mồi chỉ ở tệp này.
CREATE TABLE IF NOT EXISTS dau_bang (ten TEXT PRIMARY KEY, dau TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS dau_bang_gvi_them AFTER INSERT ON game_v2_index BEGIN UPDATE dau_bang SET dau = (SELECT COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') FROM game_v2_index) WHERE ten = 'game_v2_index'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_gvi_sua AFTER UPDATE ON game_v2_index BEGIN UPDATE dau_bang SET dau = (SELECT COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') FROM game_v2_index) WHERE ten = 'game_v2_index'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_gvi_xoa AFTER DELETE ON game_v2_index BEGIN UPDATE dau_bang SET dau = (SELECT COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') FROM game_v2_index) WHERE ten = 'game_v2_index'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_ch_them AFTER INSERT ON cau_hoi BEGIN UPDATE dau_bang SET dau = CAST(dau AS INTEGER) + 1 WHERE ten = 'cau_hoi'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_ch_sua AFTER UPDATE ON cau_hoi BEGIN UPDATE dau_bang SET dau = CAST(dau AS INTEGER) + 1 WHERE ten = 'cau_hoi'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_ch_xoa AFTER DELETE ON cau_hoi BEGIN UPDATE dau_bang SET dau = CAST(dau AS INTEGER) + 1 WHERE ten = 'cau_hoi'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_cd_them AFTER INSERT ON chien_dich BEGIN UPDATE dau_bang SET dau = CAST(dau AS INTEGER) + 1 WHERE ten = 'chien_dich'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_cd_sua AFTER UPDATE OF id, trang_thai, tao_luc, han_nop, the_luc_ngay, huyet_chien ON chien_dich BEGIN UPDATE dau_bang SET dau = CAST(dau AS INTEGER) + 1 WHERE ten = 'chien_dich'; END;
CREATE TRIGGER IF NOT EXISTS dau_bang_cd_xoa AFTER DELETE ON chien_dich BEGIN UPDATE dau_bang SET dau = CAST(dau AS INTEGER) + 1 WHERE ten = 'chien_dich'; END;
INSERT OR REPLACE INTO dau_bang (ten, dau) SELECT 'game_v2_index', COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') FROM game_v2_index;
INSERT OR IGNORE INTO dau_bang (ten, dau) SELECT x.value, CAST(CAST(strftime('%s','now') AS INTEGER) * 1000 AS TEXT) FROM json_each('["cau_hoi","chien_dich","omni_q","omni_beta_cau"]') x;

-- (9)(1)(12)(7) BẢN TÍNH SẴN DÙNG CHUNG (server/src/bang-tinh-chung.ts): kết quả thô của câu đọc kho, một dòng mỗi (câu, tham số), gắn dấu các bảng nguồn ở trên.
CREATE TABLE IF NOT EXISTS bang_tinh_chung (khoa TEXT PRIMARY KEY, dau TEXT NOT NULL, json TEXT NOT NULL, luc INTEGER NOT NULL);
