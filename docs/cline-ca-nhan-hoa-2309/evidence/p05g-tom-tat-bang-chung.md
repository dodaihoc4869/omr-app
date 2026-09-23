# Bằng chứng P05 lát cắt 7 — PIPELINE §7.1 ĐẦY ĐỦ + T08/T10/T12

Ngày chạy: 2026-09-23 (20:55–20:57 +07:00). `sourceFingerprint`: `1c913f0c43dc6256659b6da78b1372ecb5cfc63413890f98d7e2bda344a60060`

| Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|
| `vitest run tests/cnh-1-0-bo-chon-that.test.ts` | 0 | **14 PASS** (T08/T10/T12 + luật lặp + điểm §7.2, trên D1 thật) | `p05g-vitest-bo-chon-that.log` — `2d392964058d6bdbc1c7a5fae7f64ded537b56e5f5d11ffd4a77b76e352f805f` |
| `vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | 7 PASS (end-to-end qua Worker thật) | `p05g-vitest-t09.log` — `825ad43a130464f54f7d888c2facac192758acaaef0770d81d749f4dc8bfdd3e` |
| nhóm (cnh-1-0, game, tran-ngay, doan, ke-hoach, ho-so, lich-on) | 0 | 53 tệp · **724 PASS / 0 đỏ** | `p05g-vitest-nhom.log` — `0351f3691d4fe393023b0031e038c3afadd0741f931040ef240fc0b52b90659a` |
| `tsc -b` / `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05g-vitest-t05-t06.log` — `1663acf38280ac9d0c7e3a85ea124c705ab2c44bc27c17941b2b59ec4bada931` · `p05g-vitest-t32.log` — `0b0f1076a7cdd1c7f3198e4f2b559d0d308cac84c89cf7534b74e8bc9accaba0` |

## Đã nối vào đường thật

`server/src/bo-chon-that.ts` → `chonCauChoLuot` chạy **đúng thứ tự hard filter §7.1** cho một lượt:
1. **Giữ chỗ hiệu lực + lượt làm hôm nay** (`RESERVATION_CONFLICT`, `REPEAT_LIMIT`) — trước khi chấm điểm, không phải sau.
2. **Trần độ khó theo mức đang luyện** (min của các skill; probe hợp lệ = +1 và không quá 2) → `DIFFICULTY_LIMIT`.
3. **Điểm §7.2 trên dữ liệu thật** rồi **greedy từng câu vừa ngân sách**, tính lại coverage/fatigue sau mỗi lựa chọn.
4. **Atomic reserve** do nơi gọi làm sau khi có danh sách (`giuCho`).
Trả `lyDo` đếm theo nguyên nhân + `deferredCount`/`overBudgetSeconds`; cả hai đường phát câu của game trả `chonLyDo`/`hoanLuot`.

## Đã chứng minh

- **T08**: ngân sách 600 giây, mỗi câu **solve 240 + feedback 60 = 300** ⇒ đúng **2 câu**, tổng **600**, không sàn 4/8; ngân sách 599 ⇒ 1 câu + hoãn 1 câu (`over_budget_seconds` = 300).
- **T10**: mức đang luyện 0 + chỉ có câu difficulty 1 + **không probe** ⇒ **0 câu** với lý do `DIFFICULTY_LIMIT` (không rút câu 1 để bù); probe hợp lệ chỉ mở đúng +1.
- **T12/T13 (phần bộ chọn)**: câu đang bị giữ chỗ (còn hạn) bị loại **trước** khi chấm điểm; hết hạn thì không chặn.
- **Trần gói ≤6 câu** áp trước ngân sách: 8 ứng viên ⇒ 2 câu loại vì `TRAN_LUOT`, 4 câu hoãn vì ngân sách.

## Sửa test cũ theo đặc tả mới (ghi rõ lý do)

- Fixture T09: thêm dòng `skill_snapshot` (mức 2) vì **luật mới §7.1** chặn câu difficulty 1 khi mức chưa có hồ sơ (=0) — phép đo NGÂN SÁCH của T09 phải tách khỏi phép đo TRẦN ĐỘ KHÓ (có test riêng T10).
- Tên lý do `DA_LAM_HOM_NAY` → **`REPEAT_LIMIT`** theo danh mục lý do §7.2.

## Chưa làm (P05 vẫn IN_PROGRESS)

- **Một plan/ngày + rubric đóng băng + revision + carry-over** và **assignment quá tải giữ hạn gốc** (T13/T40 phần plan; hiện `deferred_count`/`over_budget_seconds` đã có ở tầng bộ chọn nhưng chưa ghi vào plan ngày).
- Nhả chỗ khi lượt kết thúc (nối `nhaCho` vào P07).
- Ghép **mẫu tốc độ theo part/mức** vào adapter ngân sách (`mauTocDo` đã có đường truyền, `docNganSachConLai` trả `mau`).
