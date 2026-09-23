# Bằng chứng P05 — lát cắt ƯỚC LƯỢNG THỜI GIAN (02 §5.1–5.2), gói CHƯA PASS

Ngày chạy: 2026-09-23 (18:59 +07:00).
`sourceFingerprint`: `a5f0fd05d790ae2e0570f663ce4881de9fa4b2374087a07357b32fec599f3f62`

## Lệnh đã chạy

| # | Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|---|
| 1 | `npm exec -- vitest run tests/cnh-1-0-thoi-gian-t08.test.ts` | 0 | **9 PASS** | `p05-vitest-t08.log` — `39578c836908205c282b229756feefd24a470bae8f3b980603ee0067976cd8af` |
| 2 | `npm exec -- vitest run tests/cnh-1-0 tests/ke-hoach tests/lich-on tests/ho-so tests/game` | 0 | 27 tệp · **379 PASS / 0 đỏ** | `p05-vitest-nhom.log` — `44f68362cec272ac81817f105e56044eeef8ca027b30247733154950fbe0cba7` |
| 3 | `npm exec -- tsc -b` + `npm exec -- tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| 4 | `vitest run tests/cnh-1-0-nang-luc-t05-t06.test.ts` (chạy LẠI theo fingerprint mới) | 0 | 21 PASS | `p05-vitest-t05-t06.log` — `912fd5398600c586dad7dda517d710806556adcae17b4d2a47e6e0e3d915c19c` |
| 5 | `vitest run tests/cnh-1-0-replay-t32.test.ts` (chạy LẠI) | 0 | 6 PASS | `p05-vitest-t32.log` — `90a9a2239e37fa5f1647f74cd76367e76948b151efb0a975c1cefa563eee15f9` |

## Đã chứng minh (T08 và luật §5.1)

- **Ví dụ của T08 đúng từng số**: câu Phần II mức Vận dụng có base 300 giây; với hệ số đo 0,8 ⇒ `solve=240`, `feedback=60`, `task=300`; ngân sách **600 nhận ĐÚNG 2 câu, tổng 600**, phần còn lại trả `BUDGET_EXHAUSTED` — **không ép sàn 4/8 câu**, không cắt thời gian phản hồi để nhét thêm câu.
- **Bảng giây gốc** khớp THAM-SO `planning.baseSeconds`; **đọc đề** (≤300 ký tự không cộng; mỗi 120 ký tự +10 giây; trần 120) và **bảng/hình** (30 giây/cái; trần 90).
- **Mẫu ít (<5)** ⇒ hệ số 1 và `ghiChu` nói rõ số mẫu (không giả vờ đo được); hệ số bị **kẹp [0,75 · 2]**.
- **Lọc mẫu** đúng luật: bỏ mẫu có hỗ trợ, chưa nộp, gián đoạn, ngoài 10–900 giây, quá 30 ngày; chỉ lấy **20 mẫu mới nhất**, đúng part × mức.
- **Chữa lỗi có bài mẫu** cộng 90 giây; **biến thể kiểm tự làm** cộng riêng thời gian của nó.
- **Hàm thuần**: cùng đầu vào ⇒ cùng kết quả (không đọc đồng hồ, không random).

## CHƯA làm (vì sao gói P05 vẫn IN_PROGRESS, T08 chưa PASS)

1. **Chưa nối vào kế hoạch ngày/bộ chọn thật**: đường đang chạy (`ke-hoach-ngay.ts::tinhVanToc`) vẫn dùng "trung vị giây/câu"; muốn dùng công thức §5.1 phải có `part` + số ký tự nhìn thấy + số bảng/hình **từ kho** cho từng ứng viên.
2. **Pipeline hard filter + score tất định §7.2** (hash SHA-256 `student|day|plan_version|qid|question_version`) chưa làm.
3. **Giữ chỗ bằng SQL có uniqueness/CAS** + race thua chỉ chọn lại phần chưa chốt chưa làm.
4. **Một plan/ngày + rubric đóng băng + carry-over + assignment quá tải giữ hạn gốc** (`deferred_count`, `over_budget_seconds`) chưa làm.
5. T08/T10/T13/T40 chưa PASS; T07/T12 (P05) chưa làm.
