# Bằng chứng P05 lát cắt 6 — GIỮ CHỖ đã nối vào lượt phát câu thật

Ngày chạy: 2026-09-23 (20:38–20:39 +07:00). `sourceFingerprint`: `cd73b1482604a5fcaf1692d27ad928d310e5296914bea2432ea5588ea1cbaf5b`

| Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|
| `vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | **6 PASS** (end-to-end qua Worker thật) | `p05f-vitest-t09.log` — `9a9c3952b079f2a35b3010daef8e82db83b884dd8f4c93583f61302553bdd268` |
| nhóm (cnh-1-0, game, tran-ngay, doan, ke-hoach, lich-on, ho-so, chong-lap, reset) | 0 | 53 tệp · **764 PASS / 0 đỏ** | `p05f-vitest-nhom.log` — `d1efd1b55d75992160de0d4b647756d8c4aecb8467e5891ccbb850c1d3cdee0a` |
| chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05f-vitest-t05-t06.log` — `6f93dd222f628a567dfa1bcdcaf51fcee1c1bae3220d18fd986ef7277727dc47` · `p05f-vitest-t32.log` — `fcdaffbb374ead78af024babfc3df8f76e7a4475dc4f005be79596ae41858edb` |
| `tsc -b` + `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |

## Đã chứng minh (end-to-end qua `/game-v2/start`)

- **Giành chỗ ngay trong lượt**: `startLuotMoi` gọi `giuCho` với `taskId` = **chính id phiên** cho các câu của lượt (sau khi đã lọc luật lặp + chấm điểm §7.2 + cắt ngân sách).
- **Câu đã bị lượt khác giữ ⇒ lượt này KHÔNG nhận**: đặt trước chỗ của `Q5` bởi task khác (còn hạn) rồi gọi `/game-v2/start` ⇒ `Q5` KHÔNG có trong lượt; nếu nó lọt vào danh sách chọn thì phản hồi mang `giuChoThua: ['Q5']` (rút ngắn, không nới bảo vệ).
- **Không chiếm chỗ của lượt khác**: dòng giữ chỗ `Q5` vẫn thuộc `T-KHAC` sau khi lượt mới chạy.
- **Nhả chỗ mở lại**: sau `nhaCho('T-KHAC')`, lượt khác giành được `Q5` — đúng luồng "thua thì chọn lại phần chưa chốt".
- **Cờ TẮT (mặc định)**: không gọi giữ chỗ, hành vi cũ nguyên vẹn (test "cờ TẮT" vẫn 6 câu, không có `nganSach`/`giuChoThua`).

## Chưa làm (P05 vẫn IN_PROGRESS)

- **Nhả chỗ khi lượt kết thúc**: hiện dựa vào HẠN (`lease_until`, 900 giây mặc định). Nối `nhaCho` vào lúc nộp/xong lượt thuộc P07 (kết thúc command) — ghi rõ, không tô xong.
- **Bộ chọn kế hoạch ngày** (`ke-hoach-ngay-d1.ts`) chưa dùng `xepLuotTheoChinhSach`/`locTheoLuatLap`/`giuCho` (mới nối cho lượt game).
- Còn: pipeline hard filter §7.1 đầy đủ, một plan/ngày + rubric đóng băng + carry-over + assignment quá tải giữ hạn gốc, ghép mẫu tốc độ theo part/mức; T08/T09/T10/T13/T40/T41 chưa PASS.
