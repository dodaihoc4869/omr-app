# Bằng chứng P05 lát cắt 5 — GIỮ CHỖ có UNIQUENESS/CAS (P05 mục 4)

Ngày chạy: 2026-09-23 (20:37 +07:00). `sourceFingerprint`: `9e50dc31f6b04fe7e8377c77eeae2ecf492f85573502752b4465fada4dec4f4e`

| Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|
| `vitest run tests/cnh-1-0-giu-cho.test.ts` | 0 | **7 PASS** (D1 thật) | `p05e-vitest-giu-cho.log` — `3bd0e8e5a9e625d174d7e6684206d616a3a4ddc9f29223f9511c9f1efd420e11` |
| nhóm (reset, cnh-1-0, game, ke-hoach, ho-so) | 0 | **446 PASS / 0 đỏ** | `p05e-vitest-nhom.log` — `a5a79a74a15b7b10e00aa3dd4f830ce4d7b2701d284e0c001d294dfe0b6f6289` |
| chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05e-vitest-t05-t06.log` — `9b26b9c1afee18cd0baf910069376a306649873ead8f9e70cda84a54dfbdf18c` · `p05e-vitest-t32.log` — `a32a74f938c2b900d66a05bb4e79eb498b46f7a4b462bdee1e6113ec44ffd4a6` |
| `tsc -b` + `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |

## Đã chứng minh (04 §4.1/§5 — reserve nguyên tử)

- **Giành chỗ = một câu lệnh nguyên tử**: `INSERT OR IGNORE` + `meta.changes = 1` mới là thắng; `changes = 0` ⇒ **đã có người giữ** (không dùng `INSERT OR IGNORE` để suy cả lượt thành công — 04 §5 cấm).
- **Lượt thua chỉ chọn lại phần CHƯA chốt**: lượt B xin `[Q2, Q3]` khi A đang giữ `Q2` ⇒ B thắng `Q3`, thua `Q2` và biết `dangGiu['Q2'] = 'T-A'`.
- **Hết hạn thì TIẾP QUẢN bằng CAS**: `UPDATE … WHERE lease_until < now` — một câu lệnh, không đọc-rồi-ghi; hạn mới được ghi đúng.
- **Chưa hết hạn thì không tiếp quản được** (điều kiện hạn chính là phần CAS).
- **Nhả chỗ theo đúng task**: nhả `Q1` của `T-A` không mở `Q2` của `T-A` hay `Q3` của `T-B`.
- **Tách theo NGÀY và theo EM**: cùng qid ở ngày khác/em khác vẫn giành được (không khoá chéo).
- **Chưa áp migration ⇒ coi như KHÔNG giữ được** (không tự cho là đã chốt), và `docCho`/`nhaCho` trả rỗng/0.
- Bảng `giu_cho` đã phân loại vào `BANG_XOA` của job reset (test reset 45 ca vẫn xanh).

## CHƯA làm (P05 vẫn IN_PROGRESS)

- Chưa NỐI `giuCho` vào đường phát câu thật (game/kế hoạch ngày): hiện là API + test; việc nối thuộc bước "một plan/ngày + task pool + resume" của P05 (đang làm tiếp).
- Còn pipeline hard filter §7.1 đầy đủ, một plan/ngày + rubric đóng băng + carry-over + assignment quá tải giữ hạn gốc, ghép mẫu tốc độ theo part/mức.
- T08/T09/T10/T13/T40/T41 chưa PASS.
