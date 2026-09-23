# Bằng chứng P05 lát cắt 10 — CHỐT NGÀY THEO MỤC TIÊU CORE ĐÃ ĐÓNG BĂNG (T40)

Ngày chạy: 2026-09-23 (21:20–21:23 +07:00). `sourceFingerprint`: `f0cac3799b8995db0890cda5d738b618e3275edd0886dd847741f0e10a204c57`

| Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|
| `vitest run tests/cnh-1-0-muc-tieu-plan-p05.test.ts` | 0 | **4 PASS** (D1 thật: đóng băng · không tăng ngầm · vượt tải · chốt ngày) | `p05j-vitest-muc-tieu-plan.log` — `7c918feb6bd70dfb09d1c06d811423ca538985fcb4a20f589a6d96ae1dea97bd` |
| nhóm (cnh-1-0, ke-hoach, ho-so, game, tran-ngay, doan, lich-on, reset) | 0 | 57 tệp · **TEST XANH / 0 đỏ** | `p05j-vitest-nhom.log` — `d60c6119e123d6535a1cc78f3ad9818505ea83616d1ed68fbc3f0e81eb6c4950` |
| `tsc -b` / `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05j-vitest-t05-t36.log` (xem sha) · `p05j-vitest-t32.log` — `f10c8f7f315b5a8021eb1e0e1a90453327caac9e49766ae831ef3346b2baa180` |

> Log T05/T06 của lát cắt này: `p05j-vitest-t05-t06.log` — `37be47296b18161ab954f8e475c365bfdc5c610650882b575bd8c85c02089541`.

## Đã chứng minh

- `danhGiaMucTieuNgay` ánh xạ **sổ thật** → từng việc core: việc có `chiTiet.qid` (ôn/ôn thi) theo **qid**;
  việc BTVN/Mom (không có qid trong kế hoạch) gộp theo **`(nguon, ma_nguon)`** trong ngày. Việc không có
  bằng chứng ⇒ **không** tính là xong.
- `chotNgayCu` gọi hàm này và ghi kết quả vào **cột riêng** `muc_tieu_ket_qua_json` ⇒ **không đổi nghĩa**
  `ket_qua` cũ (đang nuôi chuỗi đạt/EXP/khiên).
- Ba nhánh đo được trên D1 thật: **không có gì ⇒ `none`** · **chỉ có câu làm CÓ TRỢ GIÚP ⇒ `studied` với `dung = 0`** ·
  **có câu ĐỘC LẬP đúng ⇒ `achieved`** (kèm `luc`).

## Còn lại của P05

- Revision khi có mục lỗi chưa nối vào command giáo viên (P07).
- Nhả chỗ khi lượt kết thúc (P07).
