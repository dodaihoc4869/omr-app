-- ĐO TREO MÁY CA THI (thầy 22/10, docs/dac-ta-muc-lam-6-muc-2210.md mục 3) — CHỈ THÊM.
-- Lệnh nộp ca (/nop) lưu cụm `doGiay` đã làm sạch (`lamSachDo`: {qid: {giay, treo: {v, a, l, n, w}, dh}}) cạnh giay_cau_json; bước chấm đọc lại để
-- ghi vào sổ sự kiện. PHẢI chạy TRƯỚC khi Worker có mã ghi cột này (workflow "Chạy migration chỉ-thêm").
ALTER TABLE luot ADD COLUMN do_giay_json TEXT;
