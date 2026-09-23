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
