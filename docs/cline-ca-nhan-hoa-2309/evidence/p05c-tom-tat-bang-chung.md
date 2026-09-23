# Bằng chứng P05 — lát cắt 3: ĐIỂM CHỌN §7.2 + SẮP XẾP TẤT ĐỊNH (đã nối vào lượt game), gói chưa PASS

Ngày chạy: 2026-09-23 (20:15–20:17 +07:00).
`sourceFingerprint`: `ea17abcc4da3f5388853831cc1a452c0e3b16375522787b86ae8d1c265ca96b4`

## Lệnh đã chạy

| # | Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|---|
| 1 | `npm exec -- vitest run tests/cnh-1-0-diem-chon-p05.test.ts` | 0 | **12 PASS** (từng số hạng §7.2 + hash) | `p05c-vitest-diem-chon.log` — `a641f1b394da23ba8a44a798f18de616bd7240b113be0067b1a7b7f8c6fde227` |
| 2 | `npm exec -- vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | **5 PASS** (end-to-end qua Worker thật) | `p05c-vitest-t09.log` — `45524817b98eb83f0d68528ebe32e8c33f0d46712503f592384f18969abe17c5` |
| 3 | nhóm (cnh-1-0, game, tran-ngay, doan, ke-hoach, lich-on, ho-so, chong-lap) | 0 | 51 tệp · **702 PASS / 0 đỏ** | `p05c-vitest-nhom.log` — `2282231dee49b7a3ce663eddadbe0d485cf6e22d485187ecc48044c4ab956e2a` |
| 4 | `tsc -b` + `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| 5 | chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05c-vitest-t05-t06.log` — `f743efa61b1874f138462cdc2d0bef6f7c3122acee3189a15d3216dd7a49fc43` · `p05c-vitest-t32.log` — `9c487753d2bf3e5c1c3d74a0aa7a1b6cba19cc9e2a1fba641762dba80bc7f085` |

## Hai LỖI THẬT của sản phẩm do test bắt được và đã sửa (ghi theo .clinerules)

1. **Câu chưa đến hạn bị cộng nền 0,5** ⇒ `reviewNeed` sai (0,333 thay vì 0). Yêu cầu: 02 §7.2 "câu chưa due = 0". Hành vi cũ: chỉ kẹp phần trễ về 0 rồi vẫn cộng nền. Thay thế: trả 0 ngay khi `now < due`.
2. **Lẫn đơn vị giây/mili-giây ở sàn khoảng ôn** ⇒ khi khoảng ôn nhỏ, `reviewNeed` nhảy lên 1. Hành vi cũ: `max(intervalMs, 86400)` (so ms với giây). Thay thế: `max(intervalMs, 86400 × 1000)` và ghi rõ đơn vị trong chú thích hàm.

## Đã chứng minh

- **§7.2 từng số hạng**: `repairNeed` 1 / 0,5 / 0 · `reviewNeed` 0 khi chưa due, công thức khi due (kẹp 1, sàn khoảng 1 ngày) · `transferValue` 1 / 0,5 / 0 (family lạ = 0, không gọi là chuyển giao) · `fit` 1 / 0,8 / 0,6 / probe 0,5 · `coverage` 1/(1+n) · `fatigue` ≤ 0,4 · điểm tổng khớp công thức bằng số cụ thể.
- **Trọng số lấy từ THAM-SO** `planning.scoreWeights` (0,30 · 0,25 · 0,20 · 0,15 · 0,10).
- **Sắp xếp tất định**: điểm giảm dần → SHA-256(`student|day|plan_version|qid|version`) **tăng theo byte** → qid tăng; hash ở sản phẩm **bằng** SHA-256 của `node:crypto` trên cùng khoá; đảo thứ tự đầu vào ⇒ cùng kết quả; đổi ngày/phiên bản ⇒ đổi khoá; không gọi `Math.random`.
- **Đã nối vào đường thật**: khi cờ `ngan_sach_luot` BẬT, **thứ tự câu trong lượt game** (đọc qua Worker thật) đúng thứ tự hash §7.2 (kiểm bằng `node:crypto` độc lập) và lặp lại cho cùng kết quả.

## CHƯA làm (vì sao P05 vẫn IN_PROGRESS)

1. **Đẩy ĐỦ điểm §7.2 vào đường thật**: hiện nhánh sắp xếp chạy trên cùng một điểm vì đường game **chưa cấp** được `repairNeed`/`reviewNeed`/`transferValue`/`fit` cho từng câu (cần mục đích–role, `working_level`, `due` theo câu ⇒ P06 nối).
2. Pipeline hard filter đầy đủ theo §7.1 (active reservations, thứ tự cố định) và **giữ chỗ bằng SQL uniqueness/CAS + race thua** chưa làm.
3. **Một plan/ngày + rubric đóng băng + carry-over + assignment quá tải giữ hạn gốc** (`deferred_count`, `over_budget_seconds`) chưa làm.
4. **Mẫu tốc độ theo part/mức** chưa ghép (đang rỗng ⇒ hệ số 1, đúng luật "n<5 ⇒ 1").
5. T08/T09/T10/T13/T40 chưa PASS.
