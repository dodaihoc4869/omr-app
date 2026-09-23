# P00 — BASELINE (CNH-1.0)

Ghi ngày 23/09/2026 theo yêu cầu P00 (05-GOI-THI-CONG.md mục "P00 — Baseline và đường gọi thật").
Mọi số liệu dưới đây lấy từ lần chạy thật trong phiên này; log nằm cùng thư mục `evidence/`.

## 1. Mốc phiên bản và môi trường

| Mục | Giá trị | Bằng chứng |
|---|---|---|
| Git HEAD khi bắt đầu P00 | `539cd99` — "Bổ sung kiểm tra trình duyệt và giờ phát hành thực tế" | `p00-git-head.txt` |
| Nhánh | `main` (trùng `origin/main`) | `p00-git-status.txt` |
| Node | v24.20.0 | `p00-env.txt` |
| npm | 11.19.0 | `p00-env.txt` |
| Trình quản lý gói | npm (`package-lock.json` có trong repo) | `package.json` |
| Test runner | vitest 4.1.11 (`vitest.config.ts`, include `tests/**/*.test.ts(x)`) | — |
| Provider/model Cline–DeepSeek | Không đọc được từ trong repo. Không xác minh; KHÔNG suy phiên bản từ nhãn. | chưa có bằng chứng |

Bộ đặc tả tự khai `inspectedCommit = 8b67a00`; HEAD thật khi bắt đầu P00 là `539cd99`.
Hai mốc KHÔNG phải cùng phiên bản — mọi kết luận cũ phải chạy lại (đúng cảnh báo trong 00-HUONG-DAN.md mục 1).

## 2. Thay đổi có sẵn của người dùng (giữ nguyên, không ghi đè)

`git status --porcelain` lúc bắt đầu:

```text
 M src/lib/day-ca-may-chu-moi.ts          (đã sửa, chưa commit — GIỮ NGUYÊN)
?? .claude/  ?? .clinerules/  ?? .dist-old-1789778214/  ?? CLINE-BAT-DAU-CA-NHAN-HOA-2309.md
?? DE-XUAT-CA-NHAN-HOA-RUT-CAU-EXP-TUNG-BUOC-2309.md  ?? chu-hien.txt
?? docs/cline-ca-nhan-hoa-2309/  ?? docs/kiem-toan-ca-nhan-hoa-2309/
?? ket-qua.json  ?? scripts/kiem-toan-ca-nhan-hoa-2309.mjs  ?? src/lib/gui-ca-trinh-duyet.ts
```

Ghi chú: `src/lib/gui-ca-trinh-duyet.ts` là mã đang làm dở của phiên trước và có test
`tests/bang-tin-san-chong-chu-trinh-duyet-2109.test.ts` đang đỏ. Không thuộc phạm vi CNH-1.0.

## 3. Tham số đã khóa — đối chiếu với `THAM-SO.json`

| Nội dung | THAM-SO.json | Code hiện tại (baseline) | Lệch? |
|---|---|---|---|
| `coreCap` | 220 | Chưa có khái niệm hai quỹ trong `server/src/exp-*` | CÓ (P07) |
| `optionalCap` | 120 | chưa có | CÓ (P07) |
| `reserveExp` | 400 | chưa có | CÓ (P08) |
| `firstNineBars` tổng | 2400 | `src/game/than-thu-hoa-hoc/kinh-nghiem.ts` tổng tới cấp 10 = 2400 (kiểm toán A05 xác nhận) | khớp |
| `enable365DayCurve` | false | không tồn tại cờ này | khớp (chưa bật) |
| `memory.libraryVersion` | ts-fsrs 5.4.2 | `package.json` ghi `ts-fsrs: 5.4.2` | khớp |
| `memory.enableFSRS7` | false | không có FSRS-7 trong code | khớp |
| `planning.defaultSeconds` | 1200 | chưa có | CÓ (P05) |
| `boardTrigger` | manual-only | CÒN timer/auto gọi lên bảng (P09 phải bỏ) | CÓ (P09) |
| Bảng cấp 11–120 | giữ bảng hiện hành | giữ nguyên | khớp |

## 4. Cờ production

**Không xác minh được cờ production trong phiên này** (không có quyền đọc cấu hình môi trường
Cloudflare: `env.DB`, `env.DE`, biến `MA_BI_MAT`, cờ cohort). Đây là phần **chưa có bằng chứng**,
không phải "đã đạt". Danh sách cờ logic cần có theo 07-PHAT-HANH-VA-DO-LUONG.md mục 3
(`scope_selector_v1`, `learner_profile_v1`, `daily_plan_v1`, `economy_v1`, `escort_soft_time_v1`,
`return_experience_v1`) hiện **chưa tồn tại trong repo** — cần thêm ở các gói P02/P03/P05/P07/P08/P09.

## 5. Baseline kiểm thử (chạy thật)

| Lệnh | Exit | Kết quả | Log |
|---|---|---|---|
| `npm exec -- tsc -b` | 0 | 0 lỗi | `p00-tsc-client.log` |
| `npm exec -- tsc -p server/tsconfig.json --noEmit` | 0 | 0 lỗi | `p00-tsc-server.log` |
| `npm exec -- vitest run` | 1 | **35 file đỏ / 688 đạt / 1 bỏ qua (724)**; **82 test đỏ / 11 111 đạt / 1 bỏ qua (11 194)** | `p00-vitest-full.log` |
| `node scripts/kiem-toan-ca-nhan-hoa-2309.mjs` (A01–A08) | 0 | Tái hiện đủ 8 phát hiện lịch sử trên code hiện tại | `p00-kiem-toan-a01-a08.log` |

**82 test đỏ là NỀN (baseline), không phải lỗi mới của CNH-1.0.** Chúng nằm ở các nhóm:
giao diện thần thú/3D (`ten-than-thu-1609`, `than-thu-3d`, `than-thu-dong-bo-*`, `than-thu-chon-mot-lan`),
màn khắc phục/BTVN giáo viên (`luyen-khac-phuc`, `nop-phieu-khac-phuc`, `giao-btvn-tung-hoc-sinh`, `btvn-ui-1609`),
bộ não đọc (`bo-nao-doc-2109`), bảng tin sàn (`bang-tin-san-chong-chu-trinh-duyet-2109` — mã `src/lib/gui-ca-trinh-duyet.ts` đang làm dở),
và một số test ma sát chuỗi (`khong-dung-bien-truoc-khi-khai`).
Danh sách file đỏ đầy đủ: `p00-vitest-fail-files.txt`.

Lệnh `npm run lint` (oxlint) và `npm run build`: **xem `P01`**, ghi bổ sung ở mục bằng chứng P01.

## 6. Kiểm toán A01–A08 — tái hiện trên code hiện tại

Script `scripts/kiem-toan-ca-nhan-hoa-2309.mjs` chạy được, exit 0, ghi `docs/kiem-toan-ca-nhan-hoa-2309/bang-chung-va-mo-phong.json`.
Nội dung `findings` xác nhận các lỗ hổng CNH phải xử lý vẫn còn:

- A01 — ngân sách 10 phút × 240 s/câu ⇒ mục tiêu 8 câu (tham chiếu thời gian).
- A02 — câu đã phục hồi mà còn 2 lỗi cũ ⇒ bị bộ chọn khóa (không chọn lại) — lệch yêu cầu R12.
- A03 — bốn câu dễ đúng khác nhau: hồ sơ học thuật lên bậc 2 nhưng game tính bậc 0 ⇒ hai cách tính lệch nhau (R09).
- A05 — bảng cấp hiện hành tới cấp 10 = 2400 EXP (khớp quyết định v1).
- A07 — bảng nhiệm vụ có thể hiển thị nhiều câu hơn ngân sách (4 bắt buộc + 3 ôn + game 6 > mục tiêu) (R13/R14).
- A08 — 8 câu đúng vẫn bị coi "chưa lên bậc" (R15).

Đây là **bằng chứng lịch sử còn hiệu lực**, KHÔNG phải bằng chứng đã sửa.

## 7. Phần chưa làm được trong P00 (ghi đúng, không suy diễn)

| Việc | Trạng thái | Lý do | Bước tiếp theo cụ thể |
|---|---|---|---|
| Đọc cờ/cấu hình production | BLOCKED | Không có phiên đăng nhập Cloudflare trong môi trường Cline | Chạy trên máy có quyền: `npx wrangler d1 execute` + đọc biến môi trường, ghi log đã che bí mật |
| Baseline tải tổng hợp 100/1.000/10.000 học sinh (07 mục 1) | NOT_RUN | 07 cấm bắn tải vào production; cần môi trường staging cùng vùng | Dựng staging, dùng `scripts/ban-tai-gia/` với seed đã lưu, lặp lại đúng cấu hình ở P10 |
| Ghi CPU/query/payload/p95 ban đầu | NOT_RUN | Phụ thuộc mục trên | Đo cùng bộ tải ở P10 để so trước/sau |

P00 KHÔNG tự báo đã sửa A01–A08. P00 không tự nhận PASS cho T48 (T48 chỉ kết luận ở P10).
