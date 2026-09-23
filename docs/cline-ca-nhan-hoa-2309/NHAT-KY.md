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


## Phiên P01 hoàn tất phần snapshot — 23/09/2026 (Cline, tiếp)

Ngày giờ: 23/09/2026 (tiếp phiên trước) · HEAD vào phiên `79a2b16`
Gói: **P01 (IN_PROGRESS — T33 + T34 PASS)** · P00 vẫn còn 1 mục BLOCKED (staging)
Fingerprint code lúc ghi bằng chứng: `fe72c5bb09429cc8ca85bf6ac495b4433617979b18ab43670a2c56f895c1c153`

### Lỗ hổng đã tái hiện và chữa

**Lỗ hổng (T34):** lúc NỘP, `/hs/on-lai/nop` gọi `layCauChoEm` để ĐỌC LẠI KHO ĐANG SỐNG rồi chấm bằng
`chamMotCau(x, q)` (`q.correct` lấy từ kho lúc nộp). Thầy sửa đáp án / đảo lựa chọn trong lúc em đang làm
⇒ máy chủ chấm ĐỀ CŨ bằng ĐÁP ÁN MỚI. Không có chỗ nào ghi "câu này lúc giao có đáp án gì".

**Cách chữa (đã làm):**

- `server/migration-2309-cnh1-cau-snapshot.sql`: bảng `cau_snapshot` (thêm bảng thuần, không DROP, không sửa cột cũ).
- `server/src/cau-snapshot.ts`: `taoSnapshot` (ảnh chụp bất biến: phiên bản câu, nhóm nội dung, đáp án phía máy chủ,
  policy, version chính sách), `quyetDinhSnapshot` (tạo mới / dùng lại / THU HỒI theo 4 lý do), `chamTheoSnapshot`
  (ĐÚNG MỘT luật chấm `isAnswerCorrect`, chỉ đổi NGUỒN ĐÁP ÁN), `docSnapshot`/`docSnapshotNhieu`/`ghiSnapshot`.
- Nối vào hai đường THẬT: `/hs/cau-theo-qid` chốt ảnh chụp NGAY LÚC GIAO; `/hs/on-lai/nop` chấm theo ảnh chụp
  hoặc trả `thuHoi[{qid, lyDo}]` (KHÔNG ghi sổ, KHÔNG EXP, KHÔNG lộ đáp án/lời giải).
- **Cờ `cau_hinh.cau_snapshot` MẶC ĐỊNH TẮT** ⇒ chưa áp migration + chưa bật thì hành vi production KHÔNG đổi.

### Sửa gốc hai hồi quy đo được (sửa CODE, KHÔNG sửa test)

1. `tests/cau-theo-qid-1909.test.ts` (mục "chi phí") yêu cầu **đúng 3 truy vấn D1**. Bản đầu của tôi đọc cờ bằng
   một truy vấn riêng ⇒ 4 truy vấn ⇒ ĐỎ. **Sửa gốc:** đọc cờ GỘP vào chính truy vấn 1 sẵn có của `layCauChoEm`
   (thêm một CỘT, không thêm truy vấn); cả hai đường dùng lại `snapshotBat` từ đó. Không nới ngân sách, không sửa test.
2. `tests/reset-toan-app-1909.test.ts` yêu cầu **mọi bảng của lược đồ phải được phân loại XOÁ/GIỮ**. **Sửa gốc:**
   thêm `cau_snapshot` vào `BANG_GIU` kèm lý do — đúng luật "thêm bảng mới là buộc phải quyết" của chính job đó.

### Kiểm thử thực chạy

| Lệnh | Exit | Kết quả | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-snapshot-t34.test.ts` | 0 | **21/21 PASS** (lần chạy đầu) | — |
| 8 file: T34 + `on-lai-nop` + `cau-theo-qid` + `reset-toan-app` + `on-lai-phuc-vu-duoc` + `thu-thach-rieng-may-chu` + `cam-tu-luan-may-chu` + `lam-cau-on` | 0 | tất cả PASS | `p01b-vitest-t34.log` |
| 5 file chấm số (T33) | 0 | tất cả PASS | `p01b-vitest-cham-so.log` |
| `vitest run` (toàn bộ 726 file) | 1 | 81 đỏ / 11 149 đạt / 1 bỏ qua | `p01b-vitest-full.log` |
| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 lỗi | — |
| `npm run build` | 0 | build xong | `p01b-build.log` |
| `npm run lint` | 1 | **nền cũ**; 0 mục thuộc tệp mới | `p01b-lint.log` |
| `kiem-tra-bo-ban-giao.mjs` | 0 | bộ bàn giao hợp lệ | — |
| `... --acceptance` | 1 | đúng dự kiến: 49 mục còn thiếu; **T33/T34 không bị báo lỗi** | — |

### Hồi quy

`p01b-so-sanh-do.log`: **0 test mới đỏ, 0 file mới đỏ** so với nền P00 (82 đỏ/35 file) VÀ so với lượt p01a (81 đỏ/34 file).
Kiểm D1 THẬT + Worker THẬT: cờ TẮT (đường cũ nguyên vẹn); cờ BẬT (chấm theo ảnh chụp v1 khi kho đổi đáp án cùng phiên bản);
kho TĂNG phiên bản (thu hồi có lý do, không ghi sổ, không lộ đáp án); thiếu ảnh chụp (thu hồi `thieu-snapshot`);
mở lại câu sau khi kho đổi (ảnh chụp làm mới theo bản mới).

### Lỗi còn lại / điều chưa xác minh

- **Cờ CHƯA bật ở production**: chưa áp migration lên D1 thật và chưa có phép phát hành ⇒ phần "chạy thật trên máy chủ"
  của T34 **CHƯA xác minh** (mới chứng minh trên D1 thật cục bộ + worker thật).
- R04 (correction, bù một lần) chờ P07/P08. R02 chờ T40/T50. R03 chờ phần `core raw=4` của T19 (P07).
- P00 vẫn BLOCKED phần baseline tải (thiếu staging).

### Bước tiếp theo chính xác

1. **P02** (P01 đã đủ đầu ra): bảng `learner_scope` + một hàm eligibility thuần, gắn bộ lọc
   scope/prerequisite/protection vào MỌI đường chọn câu trong ROUTE-MAPPING; test T01–T04, T11–T12, T40.
2. Trước P11: áp migration, bật cờ theo canary 5% (07 §3), đo p95 và chuẩn bị rollback.


## Phiên P02 (phần lõi) — 23/09/2026 (Cline, tiếp)

Gói: **P02 IN_PROGRESS** · HEAD vào phiên `636e34f` · Fingerprint khi chạy test: xem `evidence/p02-so-sanh-do.log`

### Lỗ hổng đã chữa (lõi)

Đặc tả 02 §2 buộc bộ chọn tự động chỉ phát câu khi `approved ∧ mọi skill_ids taught ∧ mọi prerequisite_ids taught ∧ ¬protected`.
Repo **không có chỗ nào ghi "kỹ năng này đã được DẠY cho em"** (chỉ có năng lực `nam_kt_*` và "đã gặp" suy từ `su_kien_hoc`)
⇒ không có cách nào loại câu ngoài phạm vi. Đã thêm:

- `server/migration-2309-cnh1-learner-scope.sql`: bảng `learner_scope(sbd, skill_id, state, source, evidence_ref, revision, cap_nhat_luc)`, PK `sbd+skill_id`, chỉ mục theo trạng thái. Thêm bảng thuần.
- `server/src/pham-vi-hoc.ts`: `eligibleScope` **thuần** đúng công thức §2 (thứ tự cố định duyệt → nhãn → taught → nền → bảo vệ), mã lý do `NEED_TAUGHT_SCOPE`/`THIEU_NHAN`/`CHUA_DUYET`/`DE_BAO_VE`, `locTheoPhamVi`, `tomTatLyDo`; adapter D1 `docPhamVi`/`docPhamViNhieu`/`revisionPhamVi`/`docMotScope`; ghi `ghiEncountered` (import CHỈ `encountered`, không hạ bậc `taught`/`revoked`), `ghiTaught` (TỪ CHỐI nguồn `import` + bắt buộc tham chiếu), `thuHoiPhamVi`; cờ `cau_hinh.pham_vi_hoc` **mặc định TẮT** (đệm isolate 30 giây).
- Thêm `learner_scope` vào `BANG_GIU` của `reset-toan-app.ts` (thêm bảng là buộc phải quyết).

### Kiểm thử

| Lệnh | Exit | Kết quả | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-pham-vi-hoc.test.ts` | 0 | **18/18 PASS** (T01/T02/T03/T11, D1 thật) | `p02-vitest-t01-t11.log` |
| `vitest run tests/reset-toan-app-1909.test.ts tests/cnh-1-0-snapshot-t34.test.ts` | 0 | PASS | — |
| `vitest run` (toàn bộ 727 file) | 1 | 81 đỏ / 11 167 đạt | `p02-vitest-full.log` |
| `npm run build` | 0 | build xong | `p02-build.log` |
| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 lỗi | — |

**Hồi quy:** `p02-so-sanh-do.log` — **0 test mới đỏ, 0 file mới đỏ** so với nền P00.
Test của tôi có 1 ca tự tính sai số đếm lý do (Q2 chưa duyệt bị xếp `CHUA_DUYET` đúng theo thứ tự đặc tả); đã sửa **số liệu kỳ vọng của test**, không đụng logic sản phẩm.

### Điều CHƯA làm (phần còn thiếu để đạt gate P02)

**Chưa nối bộ lọc vào các bộ chọn TỰ ĐỘNG** trong `ROUTE-MAPPING.md` (`game-v2-bank.ts`, `ke-hoach-ngay*.ts`, `btvn-nang-do-d1.ts`, `parent-news-nguon-cau.ts`). Vì vậy T01/T02/T03/T11 đang ở **IN_PROGRESS** (đã chứng minh ở cổng quyết định + D1 thật, CHƯA chứng minh "ở mọi kênh tự động"), và P02 **chưa PASS**. Cũng chưa làm T04 (P04), T12/T40 (P05).
Lý do dừng: gói này cần sửa các mô-đun chọn câu lớn (240–1405 dòng) có đệm nhiều lớp và nhiều test khoá chi phí truy vấn; làm dở sẽ để lại cây mã hỏng — tôi dừng ở điểm sạch thay vì tô xanh.

### Bước tiếp theo chính xác

1. Nối `locTheoPhamVi` vào `game-v2-bank.ts` **sau cờ** (đọc cờ gộp một cột vào truy vấn `phienBanKho` để không thêm truy vấn khi cờ TẮT), ánh xạ `kienThuc`→skill_ids và `reviewed`→approved (ghi rõ đây là ánh xạ tạm, cần thầy xác nhận nhãn kỹ năng).
2. Nối tương tự vào `ke-hoach-ngay*.ts` cho câu tự động, kèm `revisionPhamVi` so lại trước khi phát (T12).
3. Chạy lại nhóm test game-v2/kế hoạch ngày; sau đó mới xét PASS P02.


## P02 tiep - noi bo loc vao game-v2-bank (sau co)

Da noi locTheoPhamVi vao docKhoCau (game-v2-bank.ts): co pham_vi_hoc doc GOP mot cot vao truy van phienBanKho => co TAT thi KHONG them truy van D1 nao. Anh xa tam kienThuc -> skill_ids, reviewed -> approved, prerequisite rong (cho thay gan nhan).

Bang chung: tsc server 0 loi; nhom test game-v2/ke hoach/bo chon 16 file xanh, 3 file do deu CO SAN trong nen P00 (cau-da-lam 1, chon-luot 4, parent-news-d1 2) => 0 test moi do. Log: evidence/p02-vitest-game-plan.log.

CON THIEU: ke-hoach-ngay*.ts (kem revisionPhamVi cho T12) va parent-news-nguon-cau.ts. Vi chua du moi kenh tu dong, T01/T02/T03/T11/T12 giu IN_PROGRESS va P02 CHUA PASS - khong to xanh.

### P02 tiep - noi bo loc vao kenh 5 (parent-news-nguon-cau.ts)

Chen hopPhamVi(q) vao diem loc "nap" (da co cauHopKhoi + daHocCau) => kenh tu dong thu 2 duoc kiem pham vi.

Bang chung: tsc server 0 loi; 3/4 file xanh, file parent-news-d1-1909 do DUNG 2 test DA CO trong nen P00 => 0 test moi do. Log: evidence/p02c-vitest-kenh5.log.

Da noi 2/3 duong tu dong (game-v2-bank, parent-news-nguon-cau). Con thieu ke-hoach-ngay*.ts (kem revisionPhamVi cho T12).

### P02 - noi not duong tu dong thu 3 + PASS T02/T03

Them locPhamViChoKeHoach vao ke-hoach-ngay-d1.ts, chen vao ca hai danh sach tu dong (cau toi han va cau on thi). Co doc 1 lan cho ca luot.

Bang chung: 24/24 test cnh-1-0-pham-vi-hoc xanh tren D1 that (them 6 ca cho cong ke hoach: T01 A/B khac pham vi, T03 thieu nhan/chua duyet, cau ngoai chi muc, thu hoi lam loai ngay, lo rong). Log p02d-vitest-phamvi.log. Nhom ke-hoach/cau-da-lam/dieu-7: 17 file xanh, 2 test do deu CO NGUYEN VAN trong nen P00 => 0 test moi do.

Da noi 3/3 kenh tu dong: game-v2-bank, parent-news-nguon-cau, ke-hoach-ngay-d1.

### P02 - T01/T11 PASS voi phep chung minh END-TO-END

Them 4 ca test chay readScope THAT (ham route game goi) tren D1 that: co TAT thi cau vao pool; co BAT + chua taught thi cau ROI KHOI pool kem ma ly do NEED_TAUGHT_SCOPE; co BAT + da taught thi cau vao binh thuong; thu hoi quyen thi cau roi pool ngay luot sau. 28/28 test xanh. Log p02e-vitest-end2end.log.

### P02 XONG (PASS) - them quyen may chu + bao thieu nhan

- Bang quyen_hoc_sinh (migration-2309-cnh1-quyen-hoc-sinh.sql) + choPhepToanChuongTrinh/coQuyen/capQuyen/thuHoiQuyen/quyenMayChuBat + baoThieuNhan.
- luyen-de.ts: cong luyen de toan chuong trinh doi QUYEN MAY CHU khi co quyen_toan_chuong_trinh BAT; cu TAT thi giu cong cu (khuyen nghi: daHocXong do may em khai KHONG con gia tri khi BAT).
- Bang chung: 32/32 test pham vi xanh tren D1 that (them 4 ca quyen + bao thieu nhan). Log p02f-vitest-quyen.log.

### P02 chot - kiem full suite sau khi noi het

Ket qua full suite 727 file: 82 do / 691 xanh / 1 bo qua - TONG SO DO DUNG BANG NEN P00 (82/35 file). Tap hop lech nhau o HAI test UI DAO DONG: escort-context-menu.test.tsx (do o luot nay) thay cho bang-tin-san-chong-chu-trinh-duyet-2109 (xanh o luot nay).

Da kiem: escort-context-menu chay rieng 3 lan deu PASS 1/1 => la test dao dong (render bat dong bo), KHONG phai hoi quy cua thay doi P02. Ghi lai de nguoi nghiem thu khong hieu nham.

Trang thai chot luot: P02 PASS, R05 PASS, T01/T02/T03/T11 PASS (32 test pham vi tren D1 that, gom 4 ca end-to-end qua readScope).

## P03 XONG (PASS) — So hoc va ho so nang luc

Ngay: 23/09/2026 (buoi chieu). HEAD vao phien: `3be54e4` (dung moc ban giao). `sourceFingerprint` khi ghi bang chung: `b4a33d6293b80bf25951ed563b33a70aa4488faadaa0adf45f95ab64537ae382`.

### Lo hong da chua (doc code that truoc khi sua)

1. **So thieu cot chuan** — `su_kien_hoc` chi co khoa + ket qua, nen: (a) luot co HO TRO bi bo HAN khoi so (game-v2.ts bo qua `attempt.assisted`), (b) khong the che ket qua ca chua cong bo, (c) khong lien ket duoc mot su kien sua diem voi su kien goc, (d) khong giu du lieu tho de dung lai.
2. **Ho so nang luc khong theo bang chung** — `nam_kt_*` chi dem lan gap/sai theo CAU va nang bac DANG bang mot luat rieng; khong co `validated_level`/`working_level`/`confidence`, khong co "mot lan doc lap moi family/ngay", khong co dot day lai `needs_teaching -> ... -> stable`.
3. **Replay khong co con tro, khong co correction** — `dungLaiHoSo` dung lai toan bo moi lan; khong co khai niem "snapshot sach" va khong ap dung dong sua diem.
4. **Ba app tu suy bac/yeu khac nhau** — game doc `nam_kt_dang.bac` qua `masteryTheoHoSo`, lop doc `SO_CAU_DU_TIN_DANG`, ho so doc `dangYeu`.

### Da lam (5/5 viec cua 05-P03)

- **Event chuan**: `server/migration-2309-cnh1-su-kien-chuan.sql` CHI THEM cot (`attempt_id`, `assistance`, `visibility`, `correction_of`, `policy_version`, `purpose`, `raw_json`, `subitem_json`, `received_at`) + hai bang `skill_snapshot`, `nang_luc_cursor`. KHONG doi khoa `khoa` (nguon|ma_nguon|sbd|qid|lan) va khong doi ranh gioi giao dich. `ghiSuKien` ghi du cot moi va **co duong LUI**: D1 chua ap migration (`no such column` / `has no column named`) thi tu chay cau SQL cu => su kien KHONG bi mat (test khoa bang cach bo cot roi ghi lai).
- **Reducer tat dinh** `server/src/nang-luc.ts` (thuan): don vi = skill x difficulty x family x ngay, chi lan DOC LAP dau; cua so 30 ngay VN; `recent5` ghi `event_id`; `confidence = min(family/5,1) x min(ngay/2,1)` (khop V47/V48); xac nhan muc can >=5 family dung muc + >=2 ngay + >=4/5 recent5 + khong co dot mo o skill/NEN; probe dung o bac tren moi nang `working_level`; bang chung qua 30 ngay giu muc da xac nhan + co `canKiemLai`; episode `needs_teaching -> practicing -> recovered -> stable` voi luat 3 loi (khac content_group, >=2 family, trong 7 ngay, khong co lan tu dung bien the moi o giua) va moc phuc hoi (>=2 nhiem vu khac HOAC >=300 giay).
- **Snapshot/cursor + correction replay**: `skill_snapshot` + `nang_luc_cursor` luu con tro `(received_at, event_id)`, so dong + bam so => **so khong doi thi khong doc lai dong nao**; correction/toi muon/doi embargo lam DO dung ky nang do va dung lai tu SO (thieu so ⇒ NEM LOI). `apDungSuaDiem` thay ket qua dong goc, GIU vi tri thoi gian cua bai nop, dong goc bat bien.
- **DTO chung** `server/src/ho-so-dto.ts` cho ca ba app + MOT cho noi ly do chua xac nhan muc (`THIEU_FAMILY`/`THIEU_NGAY`/`RECENT5_CHUA_DU`/`DOT_DANG_MO`/`NEN_DANG_MO`); DTO khong chua dap an, khong co cap thu.
- **Noi duong**: lenh `/ho-so/nang-luc` (doc + dung lai) va `/ho-so/cong-bo` (embargo -> released) sau ma bi mat cua thay; game-v2 ghi su kien HANH TRO khi `cau_hinh.nang_luc_v1` BAT — co TAT (mac dinh) thi giu nguyen hanh vi cu tung dong. Hai bang moi duoc phan loai trong `BANG_GIU` cua `reset-toan-app.ts`.

### Kiem thu thuc chay

| Lenh | Exit | Ket qua | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0` | 0 | 6 tep, **106 test PASS** (69 cu + 37 moi) | `p03-vitest-cnh1.log` |
| `vitest run tests/cnh-1-0-nang-luc-t05-t06.test.ts` | 0 | **21 PASS** (T05+T06) | `p03-vitest-t05-t06.log` |
| `vitest run tests/cnh-1-0-su-kien-chuan.test.ts` | 0 | **10 PASS** (T14 phan event, T29 phan du lieu, T47 phan ho so, duong lui) | `p03-vitest-su-kien.log` |
| `vitest run tests/cnh-1-0-replay-t32.test.ts` | 0 | **6 PASS** (T32: 3.000 su kien, correction qua khu, cursor tren D1 that) | `p03-vitest-t32.log` |
| `vitest run` (toan bo 730 tep) | 1 | 81 do / 695 xanh / 1 bo qua; test 81 do / 11 218 dat | `p03-vitest-full.log` |
| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 loi | — |
| `kiem-tra-bo-ban-giao.mjs` | 0 | bo ban giao hop le | — |
| `... --acceptance` | 1 | dung du kien: 48 -> **47 muc thieu**; P02/P03 khong con trong danh sach loi, **T05/T06/T32/R09 khong bi bao loi bang chung** | — |

### Hoi quy

`p00` 82 do / 35 tep · `p03` **81 do / 34 tep**. `p03-so-sanh-do.log`: **FILE MOI DO: [] · TEST MOI DO: []**.
Tep het do: `tests/bang-tin-san-chong-chu-trinh-duyet-2109.test.ts` — test UI Chromium da duoc ghi la **DAO DONG** tu phien P02, khong phai hoi quy.
Nhom lien quan khac: `tests/cnh-1-0 tests/su-kien tests/ho-so tests/reset-toan-app-1909` = 16 tep / 294 test PASS; nhom game/ke hoach/exp = 18 tep, 1 test do CO SAN trong nen P00 (`cau-da-lam-2109.test.ts`, dong 10 cua `p00-vitest-fail-tests.txt`).

### Loi con lai / dieu CHUA xac minh (khong duoc doc la da xong)

- **T29/T14/T47 moi xong PHAN DU LIEU** (su kien + ho so), nen GIU `IN_PROGRESS`; phan thuong (receipt, `raw core=2`, khong FSRS Good/transfer 10, vi, thong bao) thuoc **P07** => R08 va R10 cung chua PASS.
- **Cach bieu dien DONG SUA DIEM trong so** (dong rieng + `correction_of`) do **lenh correction cua P07 (R04)** chot; P03 chi dinh nghia luat ap dung va kiem bang fixture.
- **Kho that chua gan nhan `family`** => `familyId` luon `null`, nen tren du lieu THAT chua xac nhan duoc muc nao (dung nhu thiet ke: khong bia family). Can thay gan nhan (P02 `baoThieuNhan` da liet ke).

## P04 (LAT CAT LOI) — lich nho FSRS: khoa tri nho, state du, ho tro khong day due

Ngay: 23/09/2026 (buoi chieu, tiep P03). `sourceFingerprint`: `24ed5c2bfd791a8d35937aeda7813054b825c27f4d99bc07361378463cc36eee`.
**GOI P04 CHUA PASS** — moi xong lat cat loi (ghi ro o muc "Con lai").

### Da lam

- `server/src/lich-on-fsrs.ts`: `PHIEN_BAN_FSRS = fsrs6-ts5.4.2-ret0.9-cfg1`; `khoaTriNho(contentGroup, version)` = `content_group#memory_version`; `LichOnFsrs` them `khoa/phienBan/lucGoc/cursor/docLap/soLanHoTro`; tham so quan sat `{docLap, khoa, cursor}`; state cua **phien ban lich khac bi DUNG LAI**; **ho tro (`docLap:false`) khong them Good, khong keo moc xa** (chi dem + giu cursor).
- `server/src/ho-so-nam-kt.ts`: doc them cot `assistance` (co DUONG LUI khi D1 chua ap migration, khong lam hong ke hoach ngay); lan co HO TRO khong tang `dung_lien_tiep`/`ngay_dung_khac_nhau`, khong doi `trang_thai`, khong nang bac dang, **khong go nhan `can_day_lai`** (dung R21: tro giup khong gia bang chung doc lap).
- `tests/cnh-1-0-fsrs-t41.test.ts` (11 ca moi): mot quan sat/card/ngay · Again thang (tinh tren state dau ngay) · ban sao chung mot card · doi version => card moi · bo trong khong cap nhat card · phien ban lich khac => dung lai · tat dinh · moc khop thu vien chinh thuc khi co su kien ho tro xen giua.

### Bang chung

| Lenh | Exit | Ket qua | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-fsrs-t41.test.ts` | 0 | **11 PASS** | `p04-vitest-t41.log` |

## P04 (LAT CAT 2) — module chong lap theo 02 §4.2 (gói vẫn IN_PROGRESS)

Ngay: 23/09/2026 (tiep lat cat 1). `sourceFingerprint`: `c80eb18dafa3387faa4311c8d1204e45a8b6b21b1c29d6a8a4afe13bebe07fea`.

### Da lam

- **`server/src/chong-lap.ts` (moi, HÀM THUẦN)**: `xetChongLap` + `chonTheoLuatChongLap` + `tomTatLyDoChongLap` theo dung thu tu uu tien 02 §4.2:
  1. pham vi/quyen cong bo (`ngoaiPhamVi`) THANG moi thu — khong ngoai le nao bo qua duoc;
  2. nhiem vu DANG MO ⇒ tra lai CUNG task (`dungLaiTask`), khong phat ban khac o man khac;
  3. cung `content_group` da lam HOM NAY ⇒ chan, TRU `repair_retry` do may chu tao ro — va retry do `khongNhanExpCau` + `khongNangFsrs`;
  4. card DEN HAN duoc on; chua den han thi khong dung nguyen van de lap so (chi transfer/consolidation) — **module khong co bat ky cooldown 3/14/30 ngay nao (test khoa dieu nay)**;
  5. giai family 1 ngay VN cho consolidation MOI, voi 4 ngoai le deu ghi `repeat_reason` (DUE_REVIEW · REPAIR · TEACHER_ASSIGNMENT · PROBE);
  6. toi da 6 cau/luot; moi family 1 cau thuong; repair toi da 2 cau va phai cach >=2 nhiem vu khac HOAC >=300 giay; cau chua gan family toi da 1/luot;
  7. thieu ung vien ⇒ **RUT NGAN** (bao `thieu`), khong noi long bao ve.
- **Adapter doc D1 that**: `docDaLamHomNay` (content_group co ket qua hom nay, di chi muc theo ngay) va `familyLanCuoiTuSuKien` (family tu SU KIEN — kho that chua gan nhan family nen khong bia).
- `tests/cnh-1-0-chong-lap-p04.test.ts`: **17 ca**, gom 2 ca tren D1 that.

### Bang chung

| Lenh | Exit | Ket qua | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-chong-lap-p04.test.ts` | 0 | **17 PASS** | `p04b-vitest-chong-lap.log` |
| nhom (cnh-1-0, chong-lap, game, ke-hoach, lich-on, ho-so) | 0 | 26 tep · **370 PASS / 0 do** | `p04b-vitest-nhom.log` |

## P05 (LAT CAT 1) — uoc luong thoi gian §5.1-5.2 + xep vua ngan sach (goi IN_PROGRESS)

Ngay: 23/09/2026 (tiep P04). `sourceFingerprint`: `a5f0fd05d790ae2e0570f663ce4881de9fa4b2374087a07357b32fec599f3f62`.

### Da lam

- **`server/src/uoc-luong-thoi-gian.ts` (moi, HÀM THUẦN)** theo 02 §5.1: bang giay goc theo PART × muc do; cong thoi gian DOC de va BANG/HINH; **he so toc do ca nhan** = 1 khi <5 mau hop le, nguoc lai `clamp(trung vi(activeSeconds/base), 0,75, 2)` voi mau loc dung luat (cung part+muc, doc lap, da nop, khong gian doan, 10-900 giay, 20 mau moi nhat trong 30 ngay); `solve=ceil(base×factor)`, `feedback=max(30, ceil(solve×0,25))`, `task=solve+feedback`; chua loi co bai mau cong 90 giay va bien the kiem tu lam cong rieng.
- **`xepVuaNganSach`** (§5.2): chon greedy theo dung thu tu uu tien, **khong san 4/8 cau**, het cho tra `BUDGET_EXHAUSTED`, khong cat thoi gian phan hoi de nhet them cau.
- Hang so mot nguon trong `ho-so-cau-hinh.ts` (khong tron voi bo `VAN_TOC_*` cu dang chay).
- `tests/cnh-1-0-thoi-gian-t08.test.ts`: **9 ca**, trong do dung vi du T08 (base 300, factor 0,8 ⇒ solve 240 + feedback 60; ngan sach 600 ⇒ dung 2 cau, tong 600).

### Bang chung

| Lenh | Exit | Ket qua | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-thoi-gian-t08.test.ts` | 0 | **9 PASS** | `p05-vitest-t08.log` |
| nhom (cnh-1-0, ke-hoach, lich-on, ho-so, game) | 0 | 27 tep · **379 PASS / 0 do** | `p05-vitest-nhom.log` |
| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 loi | — |
| chay LAI T05/T06 + T32 theo fingerprint moi | 0 | 21 + 6 PASS | `p05-vitest-t05-t06.log`, `p05-vitest-t32.log` |

### Vi sao goi VAN IN_PROGRESS

Chua NOI cong thuc nay vao ke hoach ngay/bo chon that (duong dang chay van dung trung vi giay/cau; muon dung §5.1 phai co `part` + so ky tu nhin thay + so bang hinh tu kho cho tung ung vien). Con lai cua P05: pipeline hard filter + score tat dinh §7.2, giu cho bang SQL co uniqueness/CAS, mot plan/ngay + rubric dong bang + carry-over + assignment qua tai giu han goc. **T08/T10/T13/T40 chua PASS.**

Trang thai that: phases PASS **2/12** (P02, P03) · IN_PROGRESS **P00, P01, P04, P05** · requirements PASS **2/42** (R05, R09) · tests PASS **9/50** (+ IN_PROGRESS: T04, T08, T12, T19, T29, T41).

| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 loi | — |
| chay LAI T05/T06 + T32 (them tep moi lam fingerprint doi) | 0 | 21 + 6 PASS — bang chung P03 cap nhat theo fingerprint cuoi | `p04c-vitest-t05-t06.log`, `p04c-vitest-t32.log` |

### Vi sao GOI VAN IN_PROGRESS (khong to xanh)

## P05 (LAT CAT 2) — NGAN SACH NGAY DA NOI VAO DUONG PHAT CAU THAT (T09)

Ngay: 23/09/2026 (tiep lat cat 1). `sourceFingerprint`: `e0e863d22108e25901c73a5e04e5c2e7d3d0c9cfcaafe8d9fb88e34e2c7ac1b5`.

### Da lam (day la lan dau tien NOI vao duong hoc that, khong con module roi)

- `server/src/ngan-sach-luot.ts`: ngan sach ngay = `ke_hoach_ngay.ngan_sach_json.phutNgay` × 60, tru tong `su_kien_hoc.giay` da dung HOM NAY; co `cau_hinh.ngan_sach_luot` **MAC DINH TAT** (dem 30 giay trong isolate nhu cac co khac).
- `server/src/game-v2.ts`: **CA HAI duong phat cau cua game** (duong moi `startLuotMoi` dang chay mac dinh + duong cu) deu cat luot theo phan CON LAI bang `uocLuongMotCau` + `xepVuaNganSach`; tra them `nganSach:{conLaiGiay,soCauBoQua}` va ly do `het_ngan_sach_ngay`.
- **Chung minh END-TO-END qua Worker that** (`/game-v2/start`, D1 that): co TAT ⇒ 6 cau nhu cu, khong co truong `nganSach`; co BAT + ngan sach 600 giay, cau 135 giay ⇒ **dung 4 cau** (bo 2); da dung 500 giay ⇒ **0 cau** + `lyDo: het_ngan_sach_ngay`; chua co ke hoach ngay ⇒ khong bia ngan sach.

### Bang chung

| Lenh | Exit | Ket qua | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | **4 PASS** | `p05b-vitest-t09.log` |
| nhom (cnh-1-0, game, tran-ngay, doan, ke-hoach, lich-on, ho-so, chong-lap) | 0 | 50 tep · **689 PASS / 0 do** | `p05b-vitest-nhom.log` |
| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 loi | — |
| chay LAI T05/T06 + T32 theo fingerprint moi | 0 | 21 + 6 PASS | `p05b-vitest-t05-t06.log`, `p05b-vitest-t32.log` |

### Vi sao P05 VAN IN_PROGRESS

Con: pipeline hard filter + score tat dinh §7.2; giu cho bang SQL co uniqueness/CAS + race thua; mot plan/ngay + rubric dong bang + carry-over + assignment qua tai giu han goc; ghep mau toc do theo part/muc; va cho cac kenh khac (Mom/BTVN/on) dung chung ngan sach (P06). **T08/T09/T10/T13/T40 chua PASS.**

Trang thai that: phases PASS **2/12** (P02, P03) · IN_PROGRESS **P00, P01, P04, P05** · requirements PASS **2/42** · tests PASS **9/50** (+ IN_PROGRESS: T04, T08, T09, T12, T19, T29, T41).


- Module CHUA DUOC NOI VAO DUONG HOC NAO: theo `05-P05` muc 3, viec ghep pipeline hard-filter + family-spacing + ma ly do thieu thuoc **P05** (can `content_group`/`family` tu kho va danh sach task dang mo tu D1). API thuan + adapter da san sang nhung chua co noi goi ⇒ chuong trinh chua doi hanh vi that.
- T41/T04 chua PASS; T07 (P05), T17/T29 (P07).
- Chua ap migration len D1 that, co chua bat, chua deploy.

Trang thai that sau luot nay: phases PASS **2/12** (P02, P03) · requirements PASS **2/42** (R05, R09) · tests PASS **9/50** (T01 T02 T03 T05 T06 T11 T32 T33 T34) · them T04/T41 IN_PROGRESS.


## P05 (LAT CAT 3) — DIEM CHON §7.2 + SAP XEP TAT DINH (da noi vao luot game)

Ngay: 23/09/2026 (tiep lat cat 2). `sourceFingerprint`: `ea17abcc4da3f5388853831cc1a452c0e3b16375522787b86ae8d1c265ca96b4`.

### Da lam

- **`server/src/bo-chon-diem.ts` (moi, ham thuan)**: §7.2 tung so hang — `repairNeed` (1/0,5/0), `reviewNeed` (0 khi chua due; khi due thi `(clamp(tre/khoang,0,1)+0,5)/1,5` voi san khoang 1 ngay), `transferValue` (family la = 0, KHONG goi la chuyen giao), `fit` (1/0,8/0,6/probe 0,5), `coverage` = 1/(1+n), `fatigue` ≤ 0,4; trong so lay tu THAM-SO. Sap **TAT DINH**: diem giam dan → SHA-256 `student|day|plan_version|qid|question_version` tang theo byte → qid tang, **khong `Math.random`**.
- **Da noi vao duong that**: khi co `cau_hinh.ngan_sach_luot` BAT, **CA HAI duong phat cau cua game** sap theo nhanh tat dinh §7.2 roi moi cat theo phan ngan sach con lai. Co TAT ⇒ hanh vi cu nguyen ven.
- **Test doc lap**: `tests/cnh-1-0-ngan-sach-luot-t09.test.ts` (5 ca) kiem thu tu cau trong luot that bang SHA-256 cua `node:crypto` (khong dung chinh ham san pham dang kiem).

### HAI LOI THAT cua san pham do test bat duoc va DA SUA (ghi ro theo .clinerules)

1. **Cau chua den han bi cong nen 0,5** ⇒ `reviewNeed` = 0,333 thay vi 0. Yeu cau: 02 §7.2 "cau chua due = 0". Hanh vi cu: chi kep phan tre ve 0 roi van cong nen. Thay the: tra 0 ngay khi `now < due`.
2. **Lan don vi giay/ms o san khoang on** ⇒ khoang on nho lam `reviewNeed` nhay len 1. Hanh vi cu: `max(intervalMs, 86400)` (so ms voi giay). Thay the: `max(intervalMs, 86400 × 1000)`, ghi ro don vi trong chu thich ham.

### Bang chung

| Lenh | Exit | Ket qua | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-diem-chon-p05.test.ts` | 0 | **12 PASS** | `p05c-vitest-diem-chon.log` |
| `vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | **5 PASS** | `p05c-vitest-t09.log` |
| nhom (cnh-1-0, game, tran-ngay, doan, ke-hoach, lich-on, ho-so, chong-lap) | 0 | 51 tep · **702 PASS / 0 do** | `p05c-vitest-nhom.log` |
| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 loi | — |
| chay LAI T05/T06 + T32 theo fingerprint moi | 0 | 21 + 6 PASS | `p05c-vitest-t05-t06.log`, `p05c-vitest-t32.log` |

### Vi sao P05 VAN IN_PROGRESS

Duong that CHUA cap duoc cac dau vao diem §7.2 cho tung cau (muc dich/role, `working_level`, `due`) nen hien chi chay nhanh sap xep tat dinh; con pipeline hard filter §7.1 day du, giu cho SQL uniqueness/CAS + race thua, mot plan/ngay + rubric dong bang + carry-over + assignment qua tai, va ghep mau toc do theo part/muc. **T08/T09/T10/T13/T40 chua PASS.**

Trang thai that: phases PASS **2/12** (P02, P03) · IN_PROGRESS **P00, P01, P04, P05** · requirements PASS **2/42** · tests PASS **9/50** (+ IN_PROGRESS: T04, T08, T09, T12, T19, T29, T41).

| nhom lien quan (cnh-1-0, ho-so, lich-on, ke-hoach, exp, dem-ke-hoach, cau-da-lam, game) | 1 | 33 tep · **496 PASS / 1 do CO SAN trong nen P00** (khong hoi quy moi) | `p04-vitest-nhom.log` |
| `tsc -b` + `tsc -p server/tsconfig.json` | 0 / 0 | 0 loi | — |
| chay LAI 3 tep P03 (T05/T06/T32 + su kien) | 0 | 21 + 6 + 10 PASS — bang chung P03 cap nhat theo fingerprint MOI | `p04-vitest-t05-t06.log`, `p04-vitest-t32.log`, `p04-vitest-su-kien.log` |

Luu y da ghi trong `evidence/p04-tom-tat-bang-chung.md`: sua code P04 lam **fingerprint doi**, nen bang chung P03 (T05/T06/T32/R09) da duoc chay lai va cap nhat; giu log cu se la "bang chung khac phien ban code".

### Con lai cua P04 (ly do giu IN_PROGRESS)

1. **Module chong lap** theo 02 §4.2: "due hop le khong bi 30 ngay chan"; cung `content_group` trong ngay bi chan tru `repair_retry`; toi da 6 cau/luot; moi family 1 cau thuong, repair toi da 2 cau khi >=2 nhiem vu hoac >=300 giay; family vua lam nghi toi thieu 1 ngay VN voi ngoai le co `repeat_reason`.
2. **Family spacing + ngoai le repair co ly do**; thieu nguon thi giam luot (khong noi long bao ve).
3. **Noi `khoaTriNho` vao kenh that**: can `content_group` tu kho — hien `docSuKienDoc` chua lay truong nay, nen tren duong that moi `qid` van mot khoa (tier ham thuan da dung).
4. T17/T29 (phan thuong) thuoc P07; T07 thuoc P05.


CHECKPOINT CNH-1.0
Thời điểm, HEAD và source fingerprint thực tại thời điểm ghi: 23/09/2026 ~20:40 +07:00 · HEAD (chờ commit ngay sau checkpoint) · `sourceFingerprint = 0c3ad9d0ac426997fc247cc3237a2c24b54e48080a4a1f509f4af5acd8b90cdb`
Yêu cầu/test đang xử lý: P04 (R08/R10 phần dữ liệu) + P05 (R13–R16) — nối DỮ LIỆU THẬT vào điểm §7.2 và luật lặp; T04/T08/T09/T41/T40 còn IN_PROGRESS.
Hành vi vừa hoàn thành và đường gọi thật:
 · `server/src/bo-chon-that.ts` (mới): `docHoSoCau` (đọc `nam_kt_cau` của câu ứng viên) · `mucTheoKyNangCuaEm` (bản dựng P03 `skill_snapshot`) · `xepLuotTheoChinhSach` (chấm §7.2 rồi sắp tất định) · `locTheoLuatLap` (chặn `content_group` đã làm hôm nay + trần câu/lượt).
 · `server/src/game-v2.ts`: CẢ HAI đường phát câu (`startLuotMoi` mặc định và đường cũ) chạy: lọc luật lặp (P04) → chấm điểm §7.2 trên dữ liệu thật → cắt theo ngân sách còn lại (P05), tất cả sau cờ `cau_hinh.ngan_sach_luot` (MẶC ĐỊNH TẮT).
 · Trả thêm `nganSach:{conLaiGiay,soCauBoQua}` và `lyDo:'het_ngan_sach_ngay'`.
File đã sửa; thay đổi người dùng cần giữ: `server/src/bo-chon-that.ts`, `server/src/game-v2.ts`, `tests/cnh-1-0-bo-chon-that.test.ts`, `tests/cnh-1-0-ngan-sach-luot-t09.test.ts`, `docs/cline-ca-nhan-hoa-2309/{TIEN-DO.json,NHAT-KY.md,evidence/p04c-*,p05d-*}`. **KHÔNG đụng** `src/lib/day-ca-may-chu-moi.ts`, `src/lib/gui-ca-trinh-duyet.ts` (WIP của thầy).
Lệnh kiểm đã chạy, exit code, đường dẫn log: xem bảng trong `evidence/p05d-tom-tat-bang-chung.md` và `evidence/p04c-tom-tat-bang-chung.md` (9 + 5 + 711 test xanh; tsc 0 lỗi; T05/T06/T32 chạy lại theo fingerprint mới).
Phần chưa xong và blocker đã xác minh:
 · Luật FAMILY của §4.2.6–4.2.7 KHÔNG áp được vì kho thật chưa gắn nhãn family (P02 ghi nhận) — cần thầy gắn nhãn; đã có test khoá hành vi hiện tại.
 · P05 còn: pipeline hard filter §7.1 đầy đủ, giữ chỗ SQL uniqueness/CAS + race thua, một plan/ngày + rubric đóng băng + carry-over, ghép mẫu tốc độ theo part/mức.
 · T14/T29/T47 (phần thưởng/receipt/ví) thuộc P07; P11 chưa có quyền deploy.
Việc kế tiếp làm ngay, file/hàm cần mở, tiêu chí kiểm: mở `server/src/ke-hoach-ngay-d1.ts` + `server/src/ke-hoach-ngay.ts` để (a) đưa `xepLuotTheoChinhSach` + `locTheoLuatLap` vào bộ chọn KẾ HOẠCH NGÀY (câu tới hạn/ôn thi) và (b) thêm giữ chỗ có uniqueness/CAS (`UNIQUE(sbd, ngay, qid)` + INSERT … ON CONFLICT DO NOTHING rồi đếm số dòng thắng); tiêu chí: test D1 thật chứng minh hai lượt chốt đồng thời không chốt trùng và lượt thua chỉ chọn lại phần chưa chốt.
Các phụ thuộc đã sẵn sàng; phần chờ gói khác: `nang-luc.ts`/`skill_snapshot` (P03) đã có ⇒ `fit` dùng được; `chong-lap.ts` + `uoc-luong-thoi-gian.ts` (P04/P05) đã có ⇒ pipeline chạy; chờ P06 để nhân ra các kênh Mom/BTVN/ôn; chờ P07 cho phần thưởng/idempotency tiền.

Trang thai that sau luot nay: phases PASS **2/12** (P02, P03) · requirements PASS **2/42** (R05, R09) · tests PASS **9/50** (T01 T02 T03 T05 T06 T11 T32 T33 T34) · them T04/T41 = IN_PROGRESS.

- Migration `migration-2309-cnh1-su-kien-chuan.sql` **CHUA ap** len D1 that; co `cau_hinh.nang_luc_v1` **MAC DINH TAT**; **chua deploy** (khong nhan DEPLOYMENT_VERIFIED).

### Buoc tiep theo chinh xac

CHECKPOINT CNH-1.0 — RÀ SOÁT ĐỘC LẬP 01 (RV01–RV06)
Thời điểm, HEAD và source fingerprint: 23/09/2026 (22:0x +07:00) · HEAD `66af333` (đã push) · `sourceFingerprint = 18f2299012454da4b63b5ec3e7297c0f85164e7171f577f756167d3d392c8d53`
Yêu cầu/test đang xử lý: RV01–RV06 của `BAO-CAO-RA-SOAT-01.md` (giám sát độc lập) — ưu tiên trước khi công nhận P05/pipeline đạt.
Hành vi vừa hoàn thành và đường gọi thật:
 · RV01 giữ chỗ theo ĐƠN VỊ NỘI DUNG: `migration-2309-cnh1-giu-cho_nhom.sql` (content_group + het_han_task + UNIQUE(sbd,ngay,content_group), backfill `qid:<qid>`), `giu-cho.ts::giuCho(nhomTheoQid)`, `game-v2.ts` truyền nhóm thật.
 · RV02 tách lifecycle: hết lease mà nhiệm vụ còn hiệu lực ⇒ KHÔNG sinh task mới, trả `dangMo`/`dungLaiTask`/`giuChoDangMo` để RESUME; tiếp quản chỉ khi `het_han_task <= now` (CAS).
 · RV03 luật family THẬT: `locTheoLuatLap` gọi `chong-lap.ts::chonTheoLuatChongLap` (1 câu/family · 1 câu chưa nhãn/lượt · ngoại lệ có repeat_reason); nhãn đọc từ kho qua `familyTuNhan` + index/`CO_NHE`/`core.ts`.
 · RV04 `mucDangLuyen` xét MỌI kỹ năng, thiếu hồ sơ = 0, dữ liệu hỏng = 0.
 · RV05 bỏ cắt 6 trước lọc: hard filter + luật lặp trong vòng lặp greedy trên toàn bộ ứng viên; trần chỉ áp kết quả cuối; game đưa `eligible`.
 · RV06 mô tả runtime trung thực (`_d1-that.ts` = node:sqlite, KHÔNG phải D1) + harness XEN KẼ luồng cho test giữ chỗ.
File đã sửa; thay đổi người dùng cần giữ: `server/src/{bo-chon-that,giu-cho,game-v2,game-v2-bank,cau-theo-qid,hop-dong-chung}.ts`, `server/migration-2309-cnh1-giu-cho_nhom.sql`, `src/game/than-thu-v2/core.ts`, `tests/{_d1-that,cnh-1-0-giu-cho,cnh-1-0-bo-chon-that,cnh-1-0-ngan-sach-luot-t09}.ts`; **KHÔNG đụng** `src/lib/day-ca-may-chu-moi.ts`, `src/lib/gui-ca-trinh-duyet.ts` (WIP của thầy).
Lệnh kiểm đã chạy, exit code, log: xem bảng trong `evidence/rasoat01-rv-fix.md` (giữ chỗ 9 ca · bộ chọn 16 ca · T09 7 ca · nhóm 59 tệp xanh · tsc 0/0 · toàn suite 706 xanh/35 đỏ nợ cũ + 1 UI flaky pass khi chạy riêng).
Phần chưa xong và blocker đã xác minh:
 · RV06 CHƯA có runtime Cloudflare (máy không có wrangler/miniflare/@cloudflare/vitest-pool-workers — đã kiểm package.json + node_modules) ⇒ cần thầy cho phép cài dev-dep hoặc môi trường có wrangler.
 · RV01/RV02 chưa kiểm hai thiết bị thật (end-to-end) — đã kiểm tầng bảng + đường gọi + xen kẽ luồng.
 · Kho thật chưa gắn nhãn `family` ⇒ theo luật §4.2.6 lượt rút còn 1 câu khi bật cờ; cần thầy gắn nhãn.
Việc kế tiếp làm ngay: tiếp tục P06 (Mom/ôn/thử thách dùng chung tổng tải; Đoàn mức cá nhân + hạn mềm + continuing task), rồi P07 (EXP/ledger/receipt/outbox + idempotency + nhaCho khi lượt kết thúc), P08→P10; P11 chỉ chuẩn bị + ghi CHƯA XÁC MINH.
Các phụ thuộc đã sẵn sàng; phần chờ gói khác: P07 cho nhaCho/receipt; P06 cho các kênh khác dùng chung ngân sách.


1. **P04** (P03 da du dau ra): FSRS + chong lap — `server/src/lich-on-fsrs.ts` phai DU STATE (Card, state dau ngay, model/config version, cursor) va mot quan sat doc lap/ngay, Again thang, assisted retry khong day due; mot module repeat-eligibility de due khong bi cooldown 3/14/30 chan sai; gate T04, T06, T07, T17, T29, T41.
2. Truoc P11: ap migration len D1 that theo canary 5% (07 §3), bat `nang_luc_v1` cho mot nhom nho, do p95 va chuan bi rollback.




CHECKPOINT CNH-1.0 — RÀ SOÁT 01 BỔ SUNG (RV01/RV02-followup)
Thời điểm/HEAD: 23/09/2026 (22:3x +07:00) · HEAD `9de7b11` (đã push). Bản sửa nối tiếp `207e9fe` (nhả chỗ khi lượt kết thúc).
Yêu cầu/test đang xử lý: hai lỗi BỔ SUNG của RV01/RV02 do giám sát tái hiện trên snapshot WIP (`review-rv01-followup`, hash trong `SNAPSHOT.json`).
Hành vi vừa hoàn thành và đường gọi thật:
 · RV01-followup: `migration-2309-cnh1-giu-cho_z-donvi.sql` dựng lại bảng giữ chỗ — PK `(sbd, content_group)`, một dòng cho MỘT đơn vị nội dung, XUYÊN NGÀY; `ngay` chỉ là ngày hoạt động gần nhất; thêm `revision`; giữ dữ liệu cũ.
 · RV02-followup: gia hạn là MỘT câu CAS có predicates (`task_id`, `het_han_task > now`, `revision` khi có), thắng ⇔ `changes = 1`; tiếp quản thêm `AND task_id <> ?` (không hồi sinh task hết hạn); gia hạn KHÔNG ghi `het_han_task` (hạn nộp đã chốt từ lúc phát không bị kéo dài).
 · API bỏ `ngay`: `nhaCho(env,sbd,taskId,qids?)`, `docTheoNhom(env,sbd,nhom)`, `docCho(env,sbd,nowMs)`, `docMotCho(env,sbd,qid)`; `game-v2` gọi `nhaCho(env,sbd,id)` khi lượt kết thúc.
File đã sửa; thay đổi người dùng cần giữ: `server/src/{giu-cho,bo-chon-that,game-v2}.ts`, `server/migration-2309-cnh1-giu-cho_z-donvi.sql`, `tests/cnh-1-0-giu-cho.test.ts`, `scripts/tai-hien-rv01-followup.mjs`, `docs/.../evidence/rasoat01-rv-fix.md`; KHÔNG đụng WIP thầy.
Lệnh kiểm (exit code thật): `tsc -b` 0 · `tsc -p server` 0 · `vitest run tests/cnh-1-0-giu-cho.test.ts` 12 ca **exit 0** · `node --experimental-strip-types scripts/tai-hien-rv01-followup.mjs` **exit 0** (không còn tái hiện) · nhóm 58 tệp xanh · toàn suite 707 xanh / 34 đỏ (= bộ nợ cũ) / 1 skip. Log: `evidence/rasoat01b-*.log`.
Phần chưa xong và blocker đã xác minh: RV06 (runtime Cloudflare) vẫn mở — máy không có wrangler/miniflare/@cloudflare/vitest-pool-workers; RV01/RV02 chưa kiểm hai thiết bị thật; kho thật chưa gắn nhãn `family` ⇒ lượt rút còn 1 câu theo §4.2.6 (cần thầy gắn nhãn).
Việc kế tiếp làm ngay: tiếp P06 còn lại (Mom/ôn/thử thách dùng CHUNG tổng tải; Đoàn đúng mức cá nhân + hạn mềm + continuing task), rồi P07 (EXP/ledger/receipt/outbox + idempotency), P08→P10; P11 chỉ chuẩn bị + ghi CHƯA XÁC MINH.
Các phụ thuộc đã sẵn sàng; phần chờ gói khác: P07 cho receipt/correction; P06 cho các kênh khác dùng chung ngân sách.


CHECKPOINT CNH-1.0 — RÀ SOÁT 01 BỔ SUNG LẦN 2 (RV05 + RV03 `familyLanCuoi`)
HEAD `e37ac50` (đã push). Log: `evidence/rasoat01c-*.log`.
Kết luận của giám sát (đã kiểm và thấy ĐÚNG): `chonCauChoLuot` gọi policy **trước** khi chấm điểm mà policy lại chọn TUẦN TỰ + áp trần lượt ⇒ vòng đầu chỉ 6 câu đầu được chấm; đại diện family bị chọn theo thứ tự pool; `familyLanCuoi` luôn rỗng.
Đã sửa:
 · `chong-lap.ts`: cờ `khongApTranLuot` + `lietKeUngVienHopLe` (xét từng ứng viên ĐỘC LẬP với `daChon` THỰC, không cộng dồn, không áp trần).
 · `bo-chon-that.ts`: `locTheoLuatLap` dùng `lietKeUngVienHopLe`, trả thêm `ung` (family/purpose thật) cho `daChon`; vòng lặp chấm điểm toàn bộ ứng viên hợp lệ rồi chọn 1 câu vừa ngân sách tốt nhất; trần 6 do vòng lặp giữ.
 · `docNguCanhChongLap(env,sbd,ngay,nowMs,familyCuaUngVien)`: nối lịch sử family THẬT từ sổ (chỉ khi ứng viên có nhãn).
Test: `tests/cnh-1-0-bo-chon-that.test.ts` **20 ca xanh** (thêm RV05a đảo thứ tự pool · RV05b câu thứ 7 vừa ngân sách · RV05c cùng family câu điểm cao đứng sau thắng · RV03 lịch sử family thật).
Red-before-fix đã chứng minh: tạm dùng lại policy tuần tự ⇒ **4/4 ca RV05 ĐỎ**; bản sửa ⇒ 4/4 xanh.
Lệnh kiểm: `tsc -b` 0 · `tsc -p server` 0 · nhóm 58 tệp xanh · `scripts/tai-hien-rv01-followup.mjs` exit 0 · toàn suite 707 xanh / 34 đỏ (= nợ cũ) / 1 skip.
Còn OPEN: **RV06** (runtime Cloudflare: máy không có wrangler/miniflare/@cloudflare/vitest-pool-workers) · RV01/RV02 chưa kiểm hai thiết bị thật · kho thật chưa gắn nhãn `family` (lượt rút còn 1 câu theo §4.2.6 khi bật cờ).
Việc kế tiếp: tiếp P06 còn lại (Mom/ôn/thử thách dùng chung tổng tải; Đoàn mức cá nhân + hạn mềm + continuing task) → P07 (EXP/ledger/receipt/outbox + idempotency) → P08 → P09 → P10; P11 chỉ chuẩn bị + ghi CHƯA XÁC MINH.


CHECKPOINT CNH-1.0 — P06 (thử thách chung ngân sách + Đoàn hạn mềm §8) và RV06 trên runtime D1 THẬT
HEAD `198a778` (đã push). Mốc trong lượt này: `849ea0e` (RV06 + RV03b) · `6700bbe` (thử thách) · `198a778` (Đoàn).
RV06 ĐÃ CÓ RUNTIME THẬT: cài dev-dependency chính thức `@cloudflare/vitest-pool-workers@0.22.0` (peer `vitest ^4.1`, khớp vitest 4.1.11)
+ `wrangler@4`, ghi vào `package.json` + `package-lock.json`; cấu hình riêng `vitest.config.d1.ts` + `wrangler.d1-test.toml`
(binding D1 cục bộ, `compatibility_date 2026-08-01` khớp binary workerd đang có) + `tests/_d1-runtime-stub.ts`; script `npm run test:d1`.
Bộ `tests/d1-runtime-rv06.test.ts` chạy TRONG isolate workerd, dữ liệu TỔNG HỢP, KHÔNG deploy/không dữ liệu thật: 8 lời gọi ĐỒNG THỜI cùng
một đơn vị nội dung ⇒ đúng MỘT thắng; xuyên nửa đêm VN; chủ đổi giữa hai lượt ⇒ gia hạn KHÔNG báo thắng; gia hạn không kéo dài `het_han_task`;
nhả chỗ khi lượt kết thúc (xuyên ngày). Log `evidence/rv06-d1-runtime.log`; `npm run test:d1` exit 0 (5 ca xanh).
RV03 (sót nhỏ): `SQL_NHAN_FAMILY` dùng chung cho mọi truy vấn lịch sử family (`family` → `familyId`) + ca regression kho ghi `familyId`.
P06: thử thách dùng chung ngân sách ngày (cờ `ngan_sach_luot`); Đoàn `hanMemMotCau` = max(60, ceil(1,25×solveSeconds)) — KHÔNG trần 180,
đồng hồ đội = min(300, max các nhiệm vụ đang mở) có tính câu trùm, bảng giây gốc dùng chung `src/lib/giay-co-so.ts` + test chống trôi số.
RED-BEFORE-FIX (RV05, lượt trước): bản cũ ⇒ 4/4 ca RV05 ĐỎ; bản sửa ⇒ XANH.
Còn OPEN: RV06 phần còn lại (mới kiểm nhóm GIỮ CHỖ trên D1; chưa chạy worker end-to-end trên workerd/Đoàn trên D1);
RV01/RV02 chưa kiểm hai thiết bị thật; kho thật chưa gắn nhãn `family` (lượt rút còn 1 câu theo §4.2.6 khi bật cờ).
P06 còn lại: continuing task + hạn session 24 giờ + `expired_unanswered` + không ghi timeout thành sai; hai lỗi chính liên tiếp ⇒ vai hỗ trợ.
Việc kế tiếp: P07 (EXP/ledger/receipt/outbox nguyên tử + idempotency + correction) → P08 → P09 → P10 → P11 (chuẩn bị + ghi CHƯA XÁC MINH);
bổ sung dần bằng chứng D1-runtime cho các nhóm CAS/đồng thời còn lại.


CHECKPOINT CNH-1.0 — RV07 (nối DỮ LIỆU THẬT cho điểm chọn câu §7.2)
HEAD `2e57bc9` (đã push). Ánh xạ đầy đủ: `evidence/rv07-anh-xa-dieu-khoan.md`.
ĐÃ NỐI (kèm test): `intervalMs` thật từ sổ+hồ sơ (`docKhoangOnTheoNhom`; nhóm thiếu bằng chứng ⇒ fallback sàn 1 ngày, ghi rõ);
`transferValue` với family em đã gặp (`docFamilyDaGap`, nhãn đọc bằng `SQL_NHAN_FAMILY`) + `transferChoPhep` đúng §7.2 (1/0,5/0);
`plan_version` THẬT trong khoá hash (từ `ke_hoach_ngay.phien_ban`, hai đường game truyền vào — không còn 0 cứng);
`coverage` tính CẢ PLAN (`docCoverageTheoPlan`: việc có `chiTiet.qid` + giữ chỗ + sổ hôm nay);
`repairNeed` theo KỸ NĂNG (`docRepairTheoKyNang` đọc P03 `skill_snapshot.episode_state`, ưu tiên hơn `nam_kt_cau`).
Test: `tests/cnh-1-0-bo-chon-that-rv07.test.ts` **13 ca xanh** (interval 1 vs 30 ngày · family đã gặp/mới/không cơ hội ·
plan version + replay · coverage plan · repair kỹ năng · hai em khác hồ sơ qua pipeline §7.1 · 4 ca đọc nguồn thật trên D1).
CÒN THIẾU (ghi rõ, KHÔNG tự nới luật): (a) nhãn “family đã DUYỆT” chưa có bảng/nguồn ⇒ hiện dùng nhãn kho;
(b) nơi CẤP `transferChoPhep` chưa nối ⇒ mặc định rỗng ⇒ transferValue = 0 (đúng “0 nếu không có cơ hội”);
(c) việc kế hoạch BTVN/Mom không mang qid ⇒ chưa vào `coverage`;
(d) **bộ chọn KẾ HOẠCH NGÀY + đường ôn (`/hs/cau-theo-qid`) chưa đi qua `chonCauChoLuot`** ⇒ §7.1 chưa áp cho hai đường này;
(e) RV06 mới có bằng chứng D1-runtime cho nhóm giữ chỗ, chưa cho bộ chọn/Đoàn trên workerd; chưa kiểm hai thiết bị thật.
Lệnh kiểm lượt này: `tsc -b` 0 · `tsc -p server` 0 · nhóm 62 tệp xanh · `npm run test:d1` exit 0 (5 ca).
Việc kế tiếp NGAY: (1) nối bộ chọn vào KẾ HOẠCH NGÀY (hai danh sách tự động) + đường ôn, giữ `qidPhucVuDuoc`/bảo vệ;
(2) nối nguồn `transferChoPhep` + qid cho việc BTVN/Mom để coverage đủ; (3) tiếp P06 còn lại (continuing task · hạn session 24h · `expired_unanswered`);
(4) P07 → P08 → P09 → P10; P11 chuẩn bị + ghi CHƯA XÁC MINH.
