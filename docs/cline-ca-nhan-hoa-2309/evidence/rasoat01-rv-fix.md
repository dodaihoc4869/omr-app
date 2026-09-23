## Ghi chú về LOG BẰNG CHỨNG (phát hiện trong lượt này)

`.gitignore` (dòng 25) chặn `*.log` ⇒ **các log bằng chứng của các lượt trước CHỈ nằm trên máy này**, không có
trong repo (kiểm: `git ls-files docs/cline-ca-nhan-hoa-2309/evidence | grep '\.log$'` = rỗng). Vì vậy người
giám sát KHÔNG thể tải các log cũ từ repo — chỉ có sha256 + lệnh + exit code ghi trong `p0X*-tom-tat-bang-chung.md`.
Từ lượt này: 4 log của RV (`rasoat01-*.log`) được **thêm cưỡng bộ** (`git add -f`) để bằng chứng có thật trong repo;
các lượt sau sẽ ghi bằng chứng ở dạng `.md` (không bị chặn) hoặc force-add tường minh.

# Rà soát độc lập 01 — trạng thái xử lý RV01–RV06 (FIXED_PENDING_REVIEW)

Ngày 2026-09-23. Đối chiếu báo cáo `/Volumes/SSD NGOÀI/CLINE-GIAM-SAT-CNH-2309/BAO-CAO-RA-SOAT-01.md`.
Commit chứa bản sửa: **66af333** (nối tiếp `cb39cb7`). `sourceFingerprint` tại lượt kiểm:
`18f2299012454da4b63b5ec3e7297c0f85164e7171f577f756167d3d392c8d53`
(`--acceptance` chưa chạy lại ở mức đầy đủ trong lượt này; `kiem-tra-bo-ban-giao.mjs` exit 0)

| RV | Trạng thái | Sửa ở đâu (đường gọi thật) | Regression test | Runtime bộ kiểm |
|---|---|---|---|---|
| **RV01** | **FIXED_PENDING_REVIEW** | `server/migration-2309-cnh1-giu-cho_nhom.sql` (thêm `content_group`, `het_han_task`; backfill `qid:<qid>`; **UNIQUE(sbd,ngay,content_group)**) + `server/src/giu-cho.ts` (`nhomTheoQid`, khoá theo đơn vị nội dung) + `game-v2.ts` truyền nhóm thật của từng câu khi giành chỗ | `tests/cnh-1-0-giu-cho.test.ts` — 2 ca đầu (hai qid cùng nhóm khác kênh; câu không nhãn ⇒ `qid:<qid>`) | node:sqlite trong bộ nhớ (**KHÔNG phải D1**) |
| **RV02** | **FIXED_PENDING_REVIEW** | `giu-cho.ts`: tách `lease_until` (thiết bị) khỏi `het_han_task` (nhiệm vụ); hết lease mà nhiệm vụ còn hiệu lực ⇒ trả `dangMo` (RESUME), chỉ tiếp quản bằng CAS khi `het_han_task <= now`; `bo-chon-that.ts` trả `dungLaiTask`; `game-v2.ts` trả `giuChoDangMo` | `tests/cnh-1-0-giu-cho.test.ts` — 3 ca (STILL-ISSUED giữ nguyên; tiếp quản khi task kết thúc; **xen kẽ luồng**) + `tests/cnh-1-0-bo-chon-that.test.ts` ca “nhiệm vụ mở ⇒ trả lại task cũ” | node:sqlite + bọc `env.DB` nhường luồng trước **mỗi** câu lệnh |
| **RV03** | **FIXED_PENDING_REVIEW** | `bo-chon-that.ts::locTheoLuatLap` nay gọi **chính sách thuần** `chong-lap.ts::chonTheoLuatChongLap` (trần 1 câu/family, trần **1 câu chưa gán family**/lượt, ngoại lệ có `repeat_reason`); nhãn family đọc từ kho qua `familyTuNhan` + `game-v2-bank.ts` (index, `CO_NHE`) + `core.ts` | `tests/cnh-1-0-bo-chon-that.test.ts` — 2 ca (3 câu chưa nhãn ⇒ 1 câu; 3 family khác nhau ⇒ 3, cùng family ⇒ 1) + `tests/cnh-1-0-ngan-sach-luot-t09.test.ts` ca “kho chưa nhãn ⇒ lượt 1 câu” | node:sqlite + Worker thật (worker handler chạy trong Node) |
| **RV04** | **FIXED_PENDING_REVIEW** | `bo-chon-that.ts::mucDangLuyen`: xét **mọi** kỹ năng; thiếu hồ sơ = **mức 0**; NaN/không nguyên/ngoài miền ⇒ 0 | `tests/cnh-1-0-bo-chon-that.test.ts` — ca RV04 (10 tổ hợp gồm `[2,missing]`, `[2,0]`, toàn missing, NaN, 2.5, 5, −1) | hàm thuần (không I/O) |
| **RV05** | **FIXED_PENDING_REVIEW** | `bo-chon-that.ts::chonCauChoLuot`: bỏ bước cắt trần trước lọc; hard filter độ khó + luật lặp chạy **trong vòng lặp greedy** trên toàn bộ ứng viên; trần câu chỉ áp lên **kết quả cuối**; `game-v2.ts` (cả hai đường) đưa `eligible` — **không còn** `chooseLuotMoi` cắt trước rồi gọi đó là pipeline đầy đủ | `tests/cnh-1-0-bo-chon-that.test.ts` — ca RV05 (6 câu đầu quá khó, 2 câu cuối phù hợp ⇒ vẫn chọn được 2) | node:sqlite |
| **RV06** | **FIXED_PENDING_REVIEW (một phần)** | `tests/_d1-that.ts` ghi rõ **runtime = node:sqlite trong bộ nhớ, KHÔNG phải D1/workerd**; tiêu đề T09 bổ sung nhãn runtime; test giữ chỗ thêm **harness xen kẽ luồng** (nhường luồng trước mỗi câu lệnh) | `tests/cnh-1-0-giu-cho.test.ts` ca “HAI luồng XEN KẼ ⇒ đúng một luồng thắng” | node:sqlite + xen kẽ microtask |

## Giới hạn còn lại (không tự nhận PASS)

- **RV06 vẫn CHƯA có runtime Cloudflare**: máy này **không cài** `wrangler`/`miniflare`/`@cloudflare/vitest-pool-workers`
  (đã kiểm `package.json` + `node_modules`), nên bộ kiểm chưa chạy trên workerd/D1 thật. Cần thầy cho phép cài dev-dependency
  hoặc môi trường có wrangler để chạy integration thật (đồng thời/cas/revision trên runtime D1). Không đánh dấu PASS cho
  yêu cầu đồng thời chỉ bằng SQLite.
- **RV01/RV02 chưa có kiểm end-to-end hai thiết bị** (cần hai client thật): đã kiểm ở tầng bảng + đường gọi + xen kẽ luồng.
- **RV03 hệ quả nghiệp vụ**: kho thật chưa gắn nhãn family ⇒ khi bật cờ, lượt rút xuống **1 câu**; đây là luật §4.2.6
  (không bỏ luật vì thiếu dữ liệu). Thầy cần gắn nhãn `family` cho kho để lượt trở lại nhiều câu.

## Lệnh kiểm của lượt này (exit code thật)

| Lệnh | Exit | Artifact |
|---|---|---|
| `vitest run tests/cnh-1-0-giu-cho.test.ts` (9 ca) | 0 | `rasoat01-giu-cho.log` — `ce315c1c7ebcb94febcb141c0e87c34bfe598573a2618e9fc62df13ac98658e4` |
| `vitest run tests/cnh-1-0-bo-chon-that.test.ts` (16 ca) | 0 | `rasoat01-bo-chon-that.log` — `5b949094c7521f5a2e8c5108a1fe37dc52dbecc3bf40b6e9ce8be3d11d14b246` |
| `vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` (7 ca) | 0 | `rasoat01-t09.log` — `dc026df2e9537c81d936b0882fb71e8a40e84015eb0b9e909322529356b41309` |
| nhóm (cnh-1-0, game, tran-ngay, doan, ke-hoach, ho-so, lich-on, reset) | 0 | 59 tệp xanh |
| `vitest run` (toàn suite) | 1 | `rasoat01-vitest-full.log` — `ab2541a410077ae684dd6ea7caaa91a470f33622e0da9dfad4ebe70801e89f94`: **706 xanh · 35 đỏ · 1 skip**; 34/35 tệp đỏ **trùng bộ nợ cũ P00–P03**, 1 tệp là UI nặng (`bang-tin-san-chong-chu-trinh-duyet-2109`) **pass khi chạy riêng** (flaky do tải, không phải hồi quy) |
| `tsc -b` + `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | — |
| `kiem-tra-bo-ban-giao.mjs` | 0 | — |
