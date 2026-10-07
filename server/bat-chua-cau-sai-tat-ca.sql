-- Bật vòng chữa câu sai cho TOÀN BỘ học sinh (07/10/2026).
-- CHỈ THÊM — INSERT (row chưa tồn tại lần đầu bật).
INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc)
VALUES (
  'chua_cau_sai_v1',
  '{"bat":true,"tatCa":true,"lop":[],"sbd":[],"dongBoTuLuyen":true,"kiemLaiSauGio":24,"chanDoanToiDa":4,"vongHoTroToiDaMoiBuoc":2,"phutToiDaMotLuot":10,"cuaSoDoNgay":7,"cohortId":"pilot-chua-cau-sai-v1"}',
  strftime('%s','now')
);
