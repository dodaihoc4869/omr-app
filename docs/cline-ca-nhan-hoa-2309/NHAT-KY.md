# Nhật ký triển khai CNH-1.0

## Khởi tạo bộ bàn giao — 23/09/2026

- Đã tạo bộ đặc tả, prompt, tham số, kết quả mẫu và bảng nghiệm thu.
- HEAD được đọc khi lập bộ: `8b67a00`; kiểm toán cũ dùng `36b83dd`.
- Đây là công việc soạn bàn giao. Chưa thực thi P00–P11, chưa sửa code sản phẩm theo CNH-1.0.
- Không có bằng chứng test sản phẩm/production mới trong bộ này. Tất cả test và yêu cầu bắt đầu NOT_RUN.
- Bước tiếp theo: Cline chạy P00, ghi baseline hiện tại và bản đồ các đường gọi.

## Kiểm tra chất lượng bộ bàn giao

- Kiểm cú pháp Node của công cụ: đạt.
- Kiểm hash đặc tả, danh mục và cấu trúc: đạt; 42 yêu cầu, 50 tình huống, 48 vector.
- Tự kiểm 36 vector số học: đạt. 12 vector grading là đầu vào nghiệm thu cho code sản phẩm, chưa chạy bộ chấm sản phẩm trong lượt soạn tài liệu.
- Kiểm liên kết tương đối và cặp code fence của các file bàn giao: đạt.
- Chạy chế độ `--acceptance`: trả exit code 1 đúng dự kiến vì 11 gói code và 38 yêu cầu code chưa có bằng chứng. Đây là kiểm rằng công cụ không báo hoàn thành khi công việc chưa được thực thi.
- Đã rà lại và sửa quy tắc chuyển khiên: giữ cả khiên quà và mảnh thực sự chưa tiêu theo luật cũ; không hồi tố trừ mảnh để ép lịch sử theo luật mới.
- Không thay trạng thái NOT_RUN của kiểm thử sản phẩm thành PASS từ những kiểm tra tài liệu này.

## Phiên P00 + P01 — 23/09/2026 (Cline)

Ngày giờ: 23/09/2026 · HEAD vào phiên `539cd99` (bộ đặc tả ghi `8b67a00` — hai mốc KHÁC nhau, đã chạy lại toàn bộ)
Gói: **P00 (IN_PROGRESS)** · **P01 (IN_PROGRESS, T33 PASS)**
Fingerprint code lúc ghi bằng chứng: `29b2552bc23cf3cc2ac37167d6f92a102b7bff6906d5e5e8933e8f1e928fe5ec`

### Đã làm

**P00 — Baseline và bản đồ đường gọi**

- `evidence/BASELINE.md`: HEAD, Node v24.20.0, npm 11.19.0, thay đổi có sẵn của người dùng, đối chiếu THAM-SO với code, danh sách cờ chưa xác minh.
- `evidence/ROUTE-MAPPING.md`: bảng đường gọi thật của `server/src/index.ts` + bảng "một việc → nhiều chỗ đang chạy".
- `evidence/SCHEMA-MAPPING.md`: tên logic CNH-1.0 → bảng D1 thật; nêu rõ bảng phải thêm (`learner_scope`) và chỗ CHƯA xác minh (state FSRS).
- Sinh tập dữ liệu tổng hợp tái lập (`evidence/tao-du-lieu-tong-hop.mjs` → `du-lieu-tong-hop.json`, seed `23092026`): hai em **cùng lớp khác phạm vi**, một em nhiều lịch sử/mạnh, một em ít lịch sử/yếu/**thiếu family** (để null, không bịa), ví 700/399, khiên 2/0, mảnh 7/20, cộng mốc biên 399/400/699/700 · 20/21/42 · 4/5/6.
- Chạy lại kiểm toán A01–A08 trên code hiện tại: exit 0, các lỗ hổng cũ **còn nguyên** (A02 câu đã phục hồi bị khóa, A03 hai cách tính bậc lệch, A07 hiển thị nhiều câu hơn ngân sách, A08 chưa nhận "lên bậc").

**P01 — Hợp đồng chấm có version (phần policy)**

- Thêm `src/lib/cham-so-policy.ts`: `POLICY_VERSION='CNH-1.0'`, `parseChamInput` kiểm kiểu lúc chạy (`ChamInputError`), bốn policy v1 `numeric-value-v1` / `numeric-rounded-v1` / `numeric-unit-v1` / `literal-v1`, so sánh trên **số hữu tỉ BigInt** nên biên 1e-4 đúng quy ước "nhỏ hơn", danh mục **đơn vị đóng**.
- `src/lib/cham-so.ts` thành lớp mỏng gọi lại module policy; giữ nguyên tên `chuanHoaSoNhap`, `soKhopSo`, `khopPhanIII` nên mọi nơi gọi cũ không đổi. Chính sách `'chat'` của game **giữ nguyên**.
- Ba lỗi đã đo được vá bằng policy: `parseFloat('12abc') → 12` (nay `unsupported-format`), biên 1e-4 với dấu phẩy động (nay chính xác), bỏ qua đơn vị khác nhau.

### Kiểm thử thực chạy

| Lệnh | Exit | Ghi chú | Log |
|---|---|---|---|
| `npm exec -- tsc -b` | 0 | 0 lỗi | `p00-tsc-client.log` |
| `npm exec -- tsc -p server/tsconfig.json --noEmit` | 0 | 0 lỗi | `p00-tsc-server.log` |
| `npm exec -- vitest run --reporter=default` (toàn bộ) | 1 | 81 đỏ / 11 128 đạt / 1 bỏ qua (725 file) | `p01-vitest-full.log` |
| 5 file test chấm số (mới + 4 file cũ) | 0 | **91 test PASS** | `p01-vitest-cham-so.log` |
| `npm run build` | 0 | build xong, PWA precache 183 mục | `p01-build.log` |
| `npm run lint` | 1 | **nền cũ**: 2 870 cảnh báo / 260 lỗi; **không có mục nào thuộc hai tệp mới** | `p01-lint.log` |
| `node docs/.../kiem-tra-bo-ban-giao.mjs` | 0 | bộ bàn giao hợp lệ | — |
| `... --acceptance` | 1 | **đúng dự kiến**: 49 mục còn thiếu bằng chứng; T33 **không** bị báo lỗi | — |

### Hồi quy

`p01-so-sanh-do.log`: **0 test mới đỏ**, 0 file mới đỏ so với nền 82 test/35 file.
Một test **hết đỏ**: `tests/bang-tin-san-chong-chu-trinh-duyet-2109.test.ts > … 1280×800 trong vỏ app` (Chromium). Đây là test trình duyệt/đợt màn hình, **không liên quan** thay đổi chấm số — ghi là **dao động**, KHÔNG nhận là do bản sửa này.

### Lỗi còn lại / điều chưa xác minh

- P00: **không** đo được baseline tải (CPU/query/payload/p95) — thiếu môi trường staging cùng vùng; 07 cấm bắn tải vào production ⇒ ghi BLOCKED.
- P00: **không** đọc được cờ/cấu hình production (không có phiên Cloudflare) ⇒ chưa xác minh.
- P01: chưa làm **snapshot đề lúc giao** + đổi đáp án giữa lúc làm (T34) ⇒ R02 chưa PASS.
- P01: correction/bù một lần (R04) chờ P07/P08.
- T19: mới chứng minh phần **từng ý + điểm theo policy**; phần `core raw = 4` thuộc P07 nên chưa PASS ⇒ R03 chưa PASS.
- 81 test đỏ **vẫn là nền**: giao diện thần thú/3D, màn khắc phục/BTVN giáo viên, bộ não đọc, bảng tin sàn. **Không** liên quan CNH-1.0.

### Quyết định và lý do kiểm tra được

- Chỉ tiêu chuẩn hoá `so_hoc` được đổi sang policy `numeric-value-v1`; `'chat'` của game giữ nguyên để **không nới** luật học (đặc tả 01 mục 4: không tự nới tiêu chí).
- Danh mục đơn vị là **đóng** theo đặc tả ("không tự xóa mọi chữ/đơn vị để lấy số"); đánh đổi là một số hậu tố chữ lạ nay bị coi `unsupported-format` — đúng ý đồ chặn `12abc` = `12`. Rủi ro này đã đo bằng full suite: **0 hồi quy**.
- `allowedConversions` của `numeric-unit-v1` hiểu là danh sách **tên đơn vị tương đương (hệ số 1)** vì 01–04 không định nghĩa bảng quy đổi có hệ số. Ghi rõ trong mã là **giả định**, không tự bịa hệ số.

### Bước tiếp theo chính xác

1. P01 phần còn lại: snapshot đề bất biến lúc giao + test đổi đáp án/đảo lựa chọn giữa lúc làm (T34) → cập nhật `ROUTE-MAPPING`/`SCHEMA-MAPPING` khi thêm cột.
2. P02: bảng `learner_scope` + một hàm eligibility thuần, gắn bộ lọc scope/prerequisite/protection vào mọi đường chọn câu.
3. P00 phần còn thiếu: khi có staging, đo baseline tải bằng `scripts/ban-tai-gia/` với seed đã lưu rồi lặp lại đúng cấu hình ở P10.

