-- LÙI của server/dat-2109-dong-2-ca-treo.sql: mở lại đúng 2 ca (đặt trang_thai = 'mo'). Không đụng lượt, điểm, đáp án, cong_bo.
-- Lưu ý: nếu lúc đó có em còn đang làm bị nộp hộ (lệnh đóng ca nói "mong đợi 0 dòng" nên thường không có) thì lượt của họ đã 'da_nop' — lùi này KHÔNG trả lượt về 'dang_lam'.
UPDATE ca SET trang_thai='mo', cap_nhat_luc='2026-09-21T06:43:28.000Z' WHERE ma_ca IN ('118019','543998') AND trang_thai='dong';   -- mong đợi 2 dòng
