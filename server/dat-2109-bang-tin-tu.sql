-- GHI CẤU HÌNH THẬT MỘT LẦN (21/09/2026, thầy lệnh qua Boss): mốc BẢNG TIN CỦA THẦY = 12:00 trưa 21/09 giờ VN (`cau_hinh.bang_tin_tu`). KHÔNG nằm trong danh sách migration-*.sql.
-- Mốc CHỈ LỌC HIỂN THỊ của `/gv/bang-tin`: không xoá, không sửa dòng dữ liệu nào; cá nhân hoá vẫn dùng toàn bộ lịch sử. Chạy lại an toàn (ghi đè cùng giá trị).
-- Kiểm sau khi chạy: SELECT khoa, gia_tri FROM cau_hinh WHERE khoa = 'bang_tin_tu';  (mong đúng một dòng, gia_tri = 2026-09-21T05:00:00.000Z)  ·  POST /gv/bang-tin ⇒ tuDangAp = true.
-- Lùi: server/dat-2109-bang-tin-tu-lui.sql (xoá khoá ⇒ bảng tin tính từ 00:00 hôm nay).
INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('bang_tin_tu', '2026-09-21T05:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc;
