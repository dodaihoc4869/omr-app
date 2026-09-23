# Bằng chứng P05 — lát cắt 2: NỐI NGÂN SÁCH NGÀY VÀO ĐƯỜNG PHÁT CÂU THẬT (T09), gói chưa PASS

Ngày chạy: 2026-09-23 (19:49–19:50 +07:00).
`sourceFingerprint`: `e0e863d22108e25901c73a5e04e5c2e7d3d0c9cfcaafe8d9fb88e34e2c7ac1b5`

## Lệnh đã chạy

| # | Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|---|
| 1 | `npm exec -- vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | **4 PASS** (end-to-end qua Worker thật) | `p05b-vitest-t09.log` — `a9f828014e7a5d69e50f2b3fcb5c01fa20bb1ea6da7d6df6f88e74fff3562c5b` |
| 2 | `npm exec -- vitest run tests/cnh-1-0 tests/game tests/tran-ngay tests/doan tests/ke-hoach tests/lich-on tests/ho-so tests/chong-lap` | 0 | 50 tệp · **689 PASS / 0 đỏ** | `p05b-vitest-nhom.log` — `eccb5515dffc4e5e6138c4d3347e06cc63034db7e301ed5f1e762f37b02a99d2` |
| 3 | `npm exec -- tsc -b` + `npm exec -- tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| 4 | chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05b-vitest-t05-t06.log`, `p05b-vitest-t32.log` |

## Đã nối vào đường thật (không còn là module rời)

- `server/src/ngan-sach-luot.ts`: đọc `ke_hoach_ngay.ngan_sach_json.phutNgay` × 60 = **ngân sách ngày**, trừ tổng `su_kien_hoc.giay` **đã dùng HÔM NAY**; cờ `cau_hinh.ngan_sach_luot` (**mặc định TẮT**, có đệm 30 giây như các cờ khác).
- `server/src/game-v2.ts`: **cả hai đường phát câu** của game (`startLuotMoi` — đường đang chạy mặc định — và đường cũ) đều cắt lượt theo **phần còn lại**, dùng `uocLuongMotCau` (giây thật theo part × mức + phản hồi) rồi `xepVuaNganSach`. Trả thêm `nganSach:{conLaiGiay,soCauBoQua}` và lý do `het_ngan_sach_ngay` khi hết giờ.
- **Chứng minh end-to-end qua Worker thật (`/game-v2/start`)**:
  1. cờ TẮT ⇒ lượt vẫn 6 câu, **không** có trường `nganSach` (hành vi cũ nguyên vẹn);
  2. cờ BẬT + ngân sách 600 giây, câu Phần I mức Hiểu (105 + 30 = 135 giây) ⇒ **đúng 4 câu**, `soCauBoQua: 2`;
  3. đã dùng 500 giây hôm nay ⇒ còn 100 giây ⇒ **0 câu** kèm `lyDo: 'het_ngan_sach_ngay'` (không nhét câu cho đủ lượt);
  4. chưa có kế hoạch ngày ⇒ adapter trả `null`, **không bịa ngân sách**, đường cũ giữ nguyên.

## CHƯA làm (P05 vẫn IN_PROGRESS, T08/T09/T10/T13/T40 chưa PASS)

1. **Pipeline hard filter + score tất định §7.2** (fit/coverage/repairNeed/reviewNeed/transferValue/fatigue + sắp bằng hash SHA-256) chưa làm.
2. **Giữ chỗ bằng SQL có uniqueness/CAS** và "race thua chỉ chọn lại phần chưa chốt" chưa làm.
3. **Một plan/ngày + rubric đóng băng + carry-over + assignment quá tải giữ hạn gốc** (`deferred_count`, `over_budget_seconds`) chưa làm.
4. **Mẫu tốc độ theo part/mức** chưa ghép vào adapter (đang để rỗng ⇒ hệ số 1, đúng luật "n<5 ⇒ factor=1" nhưng chưa dùng dữ liệu thật).
5. Tương tự cho các kênh khác (Mom/BTVN/ôn) — dùng chung ngân sách là việc của P06.
