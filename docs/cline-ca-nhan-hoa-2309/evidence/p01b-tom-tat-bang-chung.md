# Tóm tắt bằng chứng P01 (T33 + T34) — 23/09/2026

**Vì sao có tệp này:** repo này là PUBLIC và `.gitignore` (dòng 25) chặn `*.log` một cách có chủ đích.
Vì vậy các tệp log chạy thật **không được commit**; chúng nằm cạnh tệp này trên máy đã chạy.
Tệp này ghi lại **đúng lệnh, mã thoát, fingerprint mã nguồn và SHA-256 của từng log** để người nghiệm thu:
(1) chạy lại được đúng lệnh, (2) đối chiếu được byte của log nếu có bản log, (3) biết chính xác bằng chứng nào
tương ứng phiên bản mã nào.

- `sourceFingerprint` (lệnh `node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs --fingerprint`):
  `fe72c5bb09429cc8ca85bf6ac495b4433617979b18ab43670a2c56f895c1c153`
- HEAD lúc ghi bằng chứng: xem `NHAT-KY.md` (mục "Phiên P01 hoàn tất phần snapshot").

## T33 — Số/đơn vị/biên chấm (PASS)

| Mục | Giá trị |
|---|---|
| command | `npm exec -- vitest run tests/cnh-1-0-cham-so-policy.test.ts tests/cham-so-2109.test.ts tests/cham-tai-cho-dung-luat-2109.test.ts tests/dau-tru-phan-ba-1009.test.ts tests/o-nhap-dap-so-cac-noi-2109.test.tsx` |
| exitCode | **0** |
| kết quả | `Test Files 5 passed (5)` |
| artifact | `docs/cline-ca-nhan-hoa-2309/evidence/p01b-vitest-cham-so.log` |
| sha256 | `c3a3601b7dd151e288daf9145c45a3d20e4e183531d47c09dfc5efdd668e65c5` |
| kích thước | 2 164 byte |

## T34 — Snapshot và version (PASS)

| Mục | Giá trị |
|---|---|
| command | `npm exec -- vitest run tests/cnh-1-0-snapshot-t34.test.ts tests/on-lai-nop-1909.test.ts tests/cau-theo-qid-1909.test.ts tests/reset-toan-app-1909.test.ts tests/on-lai-phuc-vu-duoc-1909.test.ts tests/thu-thach-rieng-may-chu-2109.test.ts tests/cam-tu-luan-may-chu-2109.test.ts tests/lam-cau-on-1909.test.tsx` |
| exitCode | **0** |
| kết quả | `Test Files 8 passed (8)` |
| artifact | `docs/cline-ca-nhan-hoa-2309/evidence/p01b-vitest-t34.log` |
| sha256 | `d964645d5f3629cc7ffc5e6695ac9fb3af0b81436485b8bf322c0b49c93ab75b` |
| kích thước | 6 203 byte |

Test T34 (`tests/cnh-1-0-snapshot-t34.test.ts`, 21 ca) chạy trên **D1 THẬT** (`node:sqlite` nạp đúng
`server/schema.sql` + mọi `server/migration-*.sql`, gồm `migration-2309-cnh1-cau-snapshot.sql` mới) và
**Worker THẬT** qua `tests/_d1-that.ts` — không mock CAS/SQL/batch.

## Chạy toàn bộ (không phải bằng chứng PASS — còn 81 test đỏ nền)

| Mục | Giá trị |
|---|---|
| command | `npm exec -- vitest run --reporter=default` |
| exitCode | 1 (do 81 test nền, KHÔNG có test nào của CNH-1.0 đỏ) |
| kết quả | `Test Files 34 failed | 691 passed | 1 skipped (726)` · `Tests 81 failed | 11149 passed | 1 skipped (11231)` |
| artifact | `docs/cline-ca-nhan-hoa-2309/evidence/p01b-vitest-full.log` |
| sha256 | `56a377d4d09a1ff5c86f31ac8cfc00d18c88c64079000a6c719027818f0eece7` |
| kích thước | 2 685 824 byte |

So sánh danh sách đỏ với nền P00: `p01b-so-sanh-do.log`
(sha256 `6af155cec4fa04f26e08a784a1012bdfe6284486dfd1ee7b5d51e074593620cc`) — **0 test mới đỏ, 0 file mới đỏ**.

## Build / lint / kiểm bộ bàn giao

| Lệnh | Exit | Ghi chú | Artifact (sha256) |
|---|---|---|---|
| `npm run build` | 0 | build xong | `p01b-build.log` (`6fe3e1e32a2b7ea8a402e920d20d99f351dd2636e65811b1a09b145730d543f2`) |
| `npm run lint` | 1 | **nền cũ**: 2 870 cảnh báo / 260 lỗi; **0 mục thuộc tệp mới** | `p01b-lint.log` (`02b98d903336696b64be283f407f5e9b38ade1a1e4993f652da257f27fb8676e`) |
| `node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs` | 0 | bộ bàn giao hợp lệ | — |
| `... --acceptance` | 1 | đúng dự kiến: 49 mục còn thiếu; **T33/T34 không bị báo lỗi bằng chứng** | — |

## Phần CHƯA xác minh của T34 (ghi đúng, không suy diễn)

Cờ `cau_hinh.cau_snapshot` **chưa bật ở production** và `migration-2309-cnh1-cau-snapshot.sql` **chưa áp lên D1 thật**
⇒ T34 mới chứng minh trên D1 thật cục bộ + worker thật, **chưa** phải trên máy chủ đang chạy.
Đây là phần chờ P11 (cần môi trường và quyền phát hành), không phải "đã triển khai".
