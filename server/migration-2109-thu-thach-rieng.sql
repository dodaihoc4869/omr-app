-- CHỈ THÊM (21/09/2026): THỬ THÁCH RIÊNG HÔM NAY (Bộ não A.I Nấc 1, thầy chốt 11:31; docs/hop-dong-thu-thach-rieng-2109.md).
-- Mỗi (em, ngày) MỘT dòng: các câu máy chủ đã CHỐT cho thẻ thử thách của em hôm ấy (chốt một lần/ngày, gọi lại trả đúng các câu này). Kết quả làm bài KHÔNG lặp ở đây — lấy từ sổ `su_kien_hoc`
-- (nguon = 'thu_thach_rieng', ma_nguon = 'thu_thach:<ngày>'). Không đáp án, không tên em. Chưa chạy migration thì `/hs/thu-thach-hom-nay` trả `co:false` (thẻ ẩn), mọi lệnh khác chạy như cũ.
-- Lùi: DROP TABLE thu_thach_rieng.
CREATE TABLE IF NOT EXISTS thu_thach_rieng (
  sbd       TEXT NOT NULL,
  ngay      TEXT NOT NULL,             -- YYYY-MM-DD giờ Việt Nam
  dang_json TEXT NOT NULL,             -- ["ESTE.THUY_PHAN", …] (1–2 mã dạng, theo Bộ não)
  bac       TEXT NOT NULL,             -- dung_bac | thap_hon_mot_bac | cao_hon_mot_bac
  so_cau    INTEGER NOT NULL,          -- số câu ĐÃ chốt (≤ soCau của Bộ não)
  so_cau_muon INTEGER NOT NULL,        -- số câu Bộ não MUỐN (3–8); so_cau < so_cau_muon ⇒ thiếu câu, thẻ báo `thieu`
  qid_json  TEXT NOT NULL,             -- ["qid", …] thứ tự hiển thị
  loi_moi   TEXT NOT NULL DEFAULT '',  -- chép lời mời của Bộ não lúc chốt
  tao_luc   TEXT NOT NULL,
  PRIMARY KEY (sbd, ngay)
);
CREATE INDEX IF NOT EXISTS idx_thu_thach_rieng_ngay ON thu_thach_rieng(ngay);
