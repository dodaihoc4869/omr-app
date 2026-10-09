-- KIỂM CA THI ĐANG MỞ — CHỈ ĐỌC (một câu SELECT, hai con số đếm; không mã ca, không tên em: repo công khai, nhật ký chạy ai cũng đọc được).
-- Dùng bởi .github/workflows/kiem-ca-mo.yml trước mỗi lần phát hành (luật: không phát hành khi đang có ca thi mở).
SELECT
  -- Ca hẹn giờ tương lai chưa mở thực sự. Mốc thiếu/hỏng vẫn chặn.
  (SELECT COUNT(*) FROM ca WHERE trang_thai = 'mo'
    AND COALESCE(julianday(bat_dau), 0) <= julianday('now')) AS so_ca_mo,
  (SELECT COUNT(*) FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca WHERE c.trang_thai = 'mo' AND l.trang_thai = 'dang_lam') AS so_luot_dang_lam;
