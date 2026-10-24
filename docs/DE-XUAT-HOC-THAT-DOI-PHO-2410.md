# ĐỀ XUẤT — Xếp học sinh: Học thật · Đối phó · Không dạy nổi — 24/10/2026

Trạng thái: **BƯỚC 2a — LOGIC, CHỜ THẦY DUYỆT.** Chưa sửa `src/`, `server/`. Bản vẽ (3 khổ, sáng/tối) làm SAU khi thầy chốt logic.
Thầy 24/10: «Đề xuất mọi phép đo, mọi tính toán và dữ liệu trong app để đưa ra các mức độ chính xác nhất có thể: Học thật, Đối phó, Không dạy nổi (đuổi). Đề xuất cho tôi trước khi build.»

Số liệu thật dùng để đặt ngưỡng: workflow chỉ đọc `.github/workflows/do-phan-loai-hoc-that-2410.yml` (run 40081568928, 24/10 16:21 VN, 14 ngày gần nhất, chỉ số đếm gộp).

---

## 0. SOÁT LẠI MỨC LÀM 1–4 TRƯỚC KHI CHỐT (thầy 24/10: «quét lại… đo giây đọc đề cá nhân hoá chính xác cho từng hs chưa?», «tính thêm các câu hs lặp lại thì được đọc nhanh hơn bao nhiêu»)

Nguồn: `.github/workflows/do-giay-doc-ca-nhan-2410.yml` (run 40083002666), 14 ngày, 17.476 lượt có đồng hồ mới, bỏ lượt treo.

### 0.1 Mã hiện tại: CHƯA cá nhân hoá
1. `muc-lam.ts` có chỗ nhân «hệ số đọc của em» (`heSoDoc`), nhưng **không nơi nào truyền vào** ⇒ mọi em = 1,0.
2. «Thời gian thường» (ranh Mức 4) gọi `msKyVong(β, 0, …)` với **τ = 0** (`muc-lam-so.ts:87`) ⇒ là số của cả lớp. τ riêng đã có cho 265 em nhưng không dùng.
3. **Không phân biệt câu mới với câu đã gặp, cũng không phân biệt câu song sinh.** Toàn bộ lượt có đồng hồ là câu ôn (`maintenance`); 74% là câu đã gặp hoặc song sinh.

### 0.2 Câu lặp lại nhanh hơn bao nhiêu (giây TB của lượt ĐÚNG)
| Loại câu | Phần I | Phần II | Phần III | Đúng (Phần I) |
|---|---|---|---|---|
| Mới thật (chưa gặp, không song sinh) | 38,3 s | 78,1 s | 58,0 s | 75% |
| Song sinh (bản khác của câu từng sai) | 19,7 s (×0,51) | 50,1 s (×0,64) | 24,4 s (×0,42) | 76% |
| Gặp lần 2 | 14,7 s (×0,38) | 50,4 s (×0,65) | 20,3 s (×0,35) | 86% |
| Gặp lần 3 | 11,3 s (×0,30) | 37,1 s (×0,48) | 14,3 s (×0,25) | 90% |
| Gặp lần 4 trở lên | 8,6 s (×0,22) | 19,2 s (×0,25) | 10,5 s (×0,18) | 96% |

Theo khoảng cách từ lần gặp trước (Phần I, đúng):

| Khoảng cách | Giây TB | Đúng |
|---|---|---|
| < 1 giờ | 8,7 s | 98% |
| Cùng ngày | 8,9 s | 97% |
| 1–3 ngày | 9,3 s | 95% |
| 4–7 ngày | 10,6 s | 91% |
| > 7 ngày | 15,0 s | 84% |

Sau 1 tuần em bắt đầu quên: chậm hơn khoảng 1,6 lần và sai nhiều hơn.

Theo từng em (116 em đủ mẫu): câu đã gặp mất trung bình **0,41** lần thời gian câu mới.
- 52 em dưới 0,3 lần (thuộc rất nhanh).
- 7 em **không nhanh hơn** khi gặp lại (chưa thuộc gì).

### 0.3 Phát hiện quyết định: trên dữ liệu game, NHANH không đi kèm SAI
Chỉ xét câu mới thật, Phần I:

| Tỉ lệ giây / T_đọc | Đúng |
|---|---|
| Dưới 0,25 lần T_đọc | 88% |
| 0,25–1 lần | 74–75% |
| 1–2,5 lần | 74–77% |
| Trên 2,5 lần (chậm nhất) | 72% |

Theo giây tuyệt đối: ≤ 3 giây đúng 95%; 4–6 giây đúng 87%.

Thử «sàn đọc riêng từng em» (học trên nửa lượt, thử trên nửa còn lại, 63 em):
- Lượt dưới sàn riêng đúng 73–81%.
- Lượt trên sàn đúng 81%.
- ⇒ Chỉ cá nhân hoá thời gian đọc **vẫn không bắt được** em bấm bừa.

Lý do khả dĩ:
- Câu game ngắn (TB 18–34 từ).
- Nhiều câu ở các tờ khác nhau trùng nội dung nhưng khác mã, nên «mới thật» theo mã thực ra em đã gặp.

⇒ Mức 1 «Chưa đọc xong đề» chỉ dựa vào giây đang **gắn oan cho em đã thuộc**.

### 0.4 Cách đo mới (đề xuất, thay Mức làm 1–4 hiện tại)
1. **«Đã gặp» tính theo NỘI DUNG câu** (`bamCau`, đã có ở `src/lib/loi-giai-kiem`) cộng quan hệ song sinh (`raw_json.tc`), không theo mã câu.
2. **T_đọc riêng = T_đọc chung × hệ số lặp × hệ số em.**
   - Hệ số lặp lấy theo bảng 0.2 (theo phần, số lần gặp, khoảng cách; > 7 ngày nhân thêm 1,6).
   - Hệ số em = e^(−τ), kẹp 0,6–1,6, từ τ OMNI đã có. Em chưa có τ thì lấy 1,0.
   - Ranh Mức 3/4 dùng τ thật (sửa `msKyVong(β, τ_em)`).
3. **Mức làm theo cả GIÂY lẫn KẾT QUẢ**, vì số liệu cho thấy giây một mình không đủ:

   | Mức mới | Điều kiện | Nghĩa |
   |---|---|---|
   | **Thuộc** | dưới T_đọc riêng VÀ đúng | tốt, không phạt |
   | **Mức 1 · Bấm vội** | dưới T_đọc riêng VÀ sai | dấu hiệu đối phó |
   | Mức 2 · Đọc vội | dưới T_đọc + sàn nghĩ | trung tính |
   | Mức 3 · Có nghĩ | như cũ, ranh theo τ riêng | |
   | Mức 4 · Làm kỹ | như cũ, ranh theo τ riêng | |
   | Mức 5–6 | giữ nguyên | |

4. **Đối phó vì tốc độ = so em với CHÍNH EM:** tỉ lệ đúng ở 30% lượt nhanh nhất của em, so với các lượt còn lại của em (cận dưới Wilson). Gắn cờ khi:
   - lượt nhanh đúng < 45%, VÀ
   - thấp hơn lượt chậm của chính em ≥ 20 điểm %.

   Em giỏi làm nhanh mà vẫn đúng thì không bao giờ bị gắn.
5. **Kiểm sau khi build:**
   - Lượt «Mức 1 · Bấm vội» phải có tỉ lệ đúng = 0 (theo định nghĩa).
   - Số em bị cờ «tốc độ không đi kèm hiểu» phải nhỏ (dự kiến < 5%).
   - Đối chiếu với nhãn mù 30 em của thầy.

---

## 1. Mục tiêu + ai dùng

- **Mục tiêu:** tách em **làm thật** (kể cả em yếu) khỏi em **làm cho có**, và chỉ ra em **đã can thiệp nhiều lần mà không đổi** để thầy quyết cho nghỉ. Mỗi nhãn phải kèm **lý do bằng số** («14 câu trả lời trước khi đọc xong đề, sai 11»), không phán chung chung.
- **Thầy:** thấy cả 3 nhãn + lý do + hồ sơ bằng chứng.
- **Học sinh, phụ huynh:** xem mục 8, thầy quyết.
- **«Không dạy nổi» không bao giờ tự động.** Máy chỉ báo «Đủ điều kiện xem xét», thầy bấm quyết.

## 2. Ba điều số liệu thật nói (đổi cách làm)

1. **Nhanh ≠ đối phó.** 100% lượt có đồng hồ mới (17.476 lượt) là câu ÔN LẠI (`purpose = maintenance`), tức câu em đã gặp.
   - Lượt «trả lời trước khi đọc xong đề» (Mức làm 1) **đúng 85%** (10.056/11.814).
   - Lượt chậm hơn chỉ **đúng 70%** (3.992/5.662).
   - ⇒ Em nhanh vì **đã thuộc**. Nếu lấy Mức 1 làm tiêu chí, 189/261 em (72%) bị gắn đối phó oan.
   - ⇒ Tiêu chí đúng là **«nhanh MÀ SAI»**. Trong 245 em có Mức 1 ≥ 40% số lượt, chỉ 7 em có tỉ lệ đúng chung dưới 50%.
2. **Ca thi, KTCN, tự luyện, lên bảng CHƯA có giây từng câu theo đồng hồ mới.** Trong 14 ngày có 2.016 lượt thi, 1.937 lượt tự luyện và 190 lượt lên bảng, tất cả có `dh` = 0. Đây là chỗ thiếu lớn nhất (mục 5).
3. **Có sẵn một tín hiệu «học thật» rất mạnh:** làm **bản khác** của câu từng sai (`raw_json.tc`). Có 15.589 lượt, đủ 263/263 em, đúng 67%.
   - Em đúng câu gốc mà sai bản khác là **thuộc đáp án, chưa hiểu**.

Các số đếm khác (14 ngày):
- Có làm bài ≥ 11/14 ngày: 241/263 em. «Làm hằng ngày» gần như ai cũng đạt, nên ít giá trị phân loại.
- Treo máy: 44/261 em có ít nhất 1 lượt; 6 em ở mức 5–15% số lượt.
- KTCN: nộp 506 (điểm TB 7,8), **bỏ hết hạn 179 = 26%** (112 em có ít nhất 1 lần bỏ).
- Đi muộn ≥ 30 phút: 39/485 lượt điểm danh (8%). **19/19 buổi học không gắn lớp** ⇒ chưa tính được «vắng».
- Cảnh báo thầy (`canh_bao_thay`) từ 10/10: **0 dòng**, vì gắn với BTVN đã bỏ ⇒ chưa có nhật ký can thiệp.

## 3. Ba trục đo (mỗi em, cửa sổ 14 ngày, tính lại bất cứ lúc nào từ sổ gốc)

Mọi ngưỡng dưới đây là **TẠM**, chỉnh theo nhãn mù của thầy (mục 7). Lấy từ `NGUONG_THAI_DO` đang dùng khi có sẵn.

### Trục A — CÓ LÀM (chuyên cần)
| Đo | Nguồn có sẵn | Xấu khi |
|---|---|---|
| A1. Bỏ KTCN | `kiem_tra_ca_nhan` het_han / (da_nop + het_han) | ≥ 50% (≥ 4 bài) |
| A2. Ngày đủ mức Bài hằng ngày | `mucCuaNgay` (bai-hang-ngay.ts) | < 50% ngày (luật Lười cũ giữ nguyên) |
| A3. Có mặt buổi học | `buoi_hoc_diem_danh` ÷ buổi của lớp em | < 70%. **Cần gắn lớp cho buổi** (mục 5) |
| A4. Đi muộn ≥ 15 phút | `luc − mo_luc` | ≥ 3 lần / 14 ngày (chỉ «chú ý») |

### Trục B — LÀM THẬT (độ thật, quyết định Đối phó)
| Đo | Nguồn | Xấu khi |
|---|---|---|
| B1. **Nhanh mà sai** | lượt Mức làm 1 VÀ sai (`muc-lam.ts` + `ket_qua = 0`) | ≥ 30% số lượt đo, cần ≥ 20 lượt. Câu ôn lại nhanh mà đúng **không phạt** |
| B2. Bấm lặp | ≥ 6 lượt liền cùng chữ (`doiPhoCuaEm`) | luật cũ |
| B3. Treo máy | Mức làm 5 / Mức 6 (`muc-lam.ts`) | ≥ 15% lượt, HOẶC có Mức 6 ở ≥ 2 ngày |
| B4. Xem lời giải trước khi thử | tín hiệu `goi-y` (`ketLuanThaiDo`) | luật cũ: xấu và xu hướng không tốt |
| B5. **Thuộc mà không hiểu** | đúng câu gốc − đúng bản khác (`raw_json.tc`) | chênh ≥ 30 điểm %, cần ≥ 10 cặp |
| B6. Thi/KTCN: rời màn | `luot.so_lan_roi_man`, `tong_giay_roi_man` | ≥ 3 lần hoặc ≥ 60 giây mỗi bài, ≥ 2 bài |
| B7. Thi/KTCN: trùng lỗi sai với bạn | MỚI: mở rộng `gian-lan-btvn.ts` cho ca thi + KTCN | ≥ 5 câu sai giống hệt cùng một bạn, cùng ca |
| B8. Dồn bài khuya | luật cũ | chỉ «chú ý», không đủ để gắn Đối phó |

### Trục C — TIẾN BỘ THẬT (không dùng để gắn Đối phó, em yếu vẫn là Học thật)
| Đo | Nguồn |
|---|---|
| C1. Đúng bản khác của câu từng sai | `raw_json.tc` (đang có 67% toàn trung tâm) |
| C2. Khắc phục bền (đúng 2 lần ở 2 ngày khác) | `tu_luyen_khac_phuc`, `nam_kt_cau` |
| C3. Điểm KTCN so với chính em 4 bài trước | `kiem_tra_ca_nhan.diem` (không so với bạn) |
| C4. Lên bảng đạt | `len_bang.dat` |

**Không đưa vào (mặc định, thầy bật lại được):**
- Điểm cao/thấp: không bao giờ là lý do Đối phó.
- Học phí: không phải chuyện học, lại không có hạn nộp.
- Phụ huynh mở app (`ph_truy_cap`): app PH đã bỏ 27/09, số không đáng tin.
- BTVN: chỉ còn là dữ liệu cũ.
- EXP, vàng, game: chơi, dễ «câu».

## 4. Luật gắn nhãn (một nguồn duy nhất, thay `ketLuanThaiDo`)

1. **Chưa đủ dữ liệu:** dưới 20 lượt đo VÀ dưới 3 bài thi/KTCN trong 14 ngày.
2. **Đối phó:** có ít nhất **1 tín hiệu B xấu** (B1–B7), HOẶC trục A xấu nặng (A1 bỏ KTCN ≥ 50%, hoặc Lười theo luật cũ).
   - Ghi kèm loại: «không làm» (A) / «làm cho có» (B1–B4) / «thuộc không hiểu» (B5) / «gian lận» (B6–B7).
3. **Cần theo dõi** (vùng đệm, chỉ thầy thấy): không B nào xấu nhưng có ≥ 2 tín hiệu «chú ý». Có vùng này để tránh nhảy nhãn qua lại mỗi ngày.
4. **Học thật:** còn lại. Hiện kèm trục C: «đang tiến» / «đứng yên» / «đi lùi».
5. **Không dạy nổi — Đủ điều kiện xem xét** (chỉ thầy): ĐỦ CẢ 4 điều kiện:
   1. Đối phó ở ≥ 3 trong 4 tuần gần nhất.
   2. Có **≥ 2 lần can thiệp được ghi** mà **em đã xem** (và PH đã xem nếu có gửi). Dùng nhật ký mới, mục 5.
   3. Trong 7 ngày sau mỗi lần can thiệp, trục B **không khá lên** (số tín hiệu xấu không giảm).
   4. Trục C không tiến: C1 < 40% VÀ điểm KTCN không tăng.

   Cờ đỏ cộng thêm (đủ 1–3 + một cờ đỏ là đủ, khỏi cần điều kiện 4): Mức 6 ở ≥ 2 tuần; gian lận B7 thầy đã xác nhận.
   - Máy dựng **hồ sơ bằng chứng**: các tuần, các lần can thiệp, số đo trước và sau. Thầy bấm «Cho nghỉ» hoặc «Cho thêm 2 tuần».

**Nhãn cũ đi đâu:**
- `doi-pho` → Đối phó.
- `cham-chi` → Học thật.
- `luoi` → Đối phó · loại «không làm».
- `chua-deu` → Cần theo dõi.
- `chua-du-du-lieu` → giữ.
- Bậc chăm chỉ 12 bậc và nhóm Nhịp học giữ nguyên cho game và màn Hôm nay, không trùng chữ với nhãn mới.

## 4b. BẢN SỬA 24/10 — THANG 5 BẬC CÓ MỨC ĐUỔI (thầy: «Phải có cả mức ĐUỔI… tính toán mọi thứ đề xuất thông minh nhất»)

Bản này thay mục 4 ở chỗ nào hai bên khác nhau.

### Điểm Thật tuần (0–100), tính mỗi sáng thứ Hai trên 14 ngày gần nhất
`Điểm Thật = 100 − Σ phạt`, mỗi phạt có trần. Trọng số là TẠM, chỉnh theo nhãn mù của thầy.

| Phạt | Tính | Tối đa |
|---|---|---|
| Nhanh mà sai (B1) | 100 × cận dưới Wilson 90% của tỉ lệ «Mức 1 VÀ sai» × hệ số độ dễ. Sai câu dễ (lớp đúng ≥ 80%) nặng gấp 1,5; sai câu khó (lớp đúng < 40%) không tính | 30 |
| Bấm lặp (B2) | 10 × số chuỗi xấu | 20 |
| Treo máy (B3) | 100 × cận dưới Wilson tỉ lệ Mức 5; +10 mỗi ngày có Mức 6 | 25 |
| Xem lời giải trước khi thử (B4) | theo luật `goi-y` cũ: xấu = 10 | 10 |
| Thuộc mà không hiểu (B5) | (đúng câu gốc − đúng bản khác) − 20, đơn vị điểm %, nếu dương | 15 |
| Rời màn / trùng lỗi sai khi thi (B6, B7) | 10 mỗi bài vượt ngưỡng; trùng lỗi sai thầy đã xác nhận = 40 | 40 |
| Bỏ KTCN (A1) | 40 × tỉ lệ bỏ | 20 |
| Vắng không phép (A3) | 30 × tỉ lệ vắng không phép | 15 |

Vì sao «thông minh» hơn đếm thẳng:
1. **Cận dưới Wilson:** em ít lượt không bị phạt oan vì 2–3 lần trượt tay. Ví dụ 3/5 lượt xấu cho cận dưới khoảng 27%, còn 30/50 lượt xấu cho khoảng 48%.
2. **Hệ số độ dễ:** sai câu dễ mới là dấu hiệu đối phó. Sai câu khó là chuyện bình thường.
3. **Nhanh mà ĐÚNG ở câu ôn không bao giờ bị phạt.** Số liệu thật: lượt nhanh đúng 85%, cao hơn lượt chậm.
4. **So với chính em:** hồ sơ hiện thêm «tuần này so với trung bình 4 tuần trước của em». Bậc chỉ đổi khi điểm lệch rõ, không nhảy vì một ngày.
5. **Câu có đáp án «cần xem»** không tính sai.

### Thang 5 bậc
| Bậc | Điều kiện vào | Máy tự làm | Ai thấy |
|---|---|---|---|
| **1 · Học thật** | Điểm Thật ≥ 75, không cờ đỏ | — | thầy · em · PH |
| **2 · Cần theo dõi** | 60–74 | — | chỉ thầy |
| **3 · Đối phó** | < 60, HOẶC có 1 cờ đỏ (gian lận thi xác nhận, Mức 6) | Tuần đầu: **tự nhắc em** kèm lý do bằng số. Tuần thứ 2 liền: **tự nhắn PH**. Mỗi lần nhắc ghi vào nhật ký can thiệp | thầy · em · PH |
| **4 · Không dạy nổi** | Đối phó ≥ 3 trong 4 tuần, VÀ ≥ 2 lần can thiệp em/PH đã xem, VÀ trong 7 ngày sau mỗi lần Điểm Thật không tăng ≥ 10, VÀ không tiến bộ thật (đúng bản khác < 40%, KTCN không tăng) | Báo thầy: **«Gọi PH, mở 14 ngày cam kết»**. Thầy bấm ⇒ ghi mốc cam kết | chỉ thầy (PH chỉ nhận lời thầy) |
| **5 · ĐUỔI** | **Đường thường:** hết 14 ngày cam kết mà Điểm Thật TB < 60 hoặc thấp hơn trước cam kết. **Đường tắt (cờ đỏ nặng):** gian lận thi thầy xác nhận ≥ 2 lần trong 4 tuần; HOẶC Mức 6 (cố tình treo máy) ở ≥ 3 trong 4 tuần; HOẶC bỏ ≥ 75% KTCN VÀ vắng không phép ≥ 50% suốt 4 tuần | Máy **kết luận ĐUỔI** + dựng hồ sơ bằng chứng (từng tuần, từng lần nhắc, số đo trước/sau, câu gian lận). Soạn sẵn tin cho PH | chỉ thầy. **Tin cho PH chỉ gửi khi thầy bấm «Xác nhận cho nghỉ»** |

**Đi xuống bậc:** 2 tuần liền Điểm Thật ≥ 75 thì xuống một bậc. Không bao giờ nhảy thẳng từ ĐUỔI về Học thật.

**Vì sao ĐUỔI vẫn cần thầy bấm một lần:** đây là việc không rút lại được, gửi ra ngoài cho phụ huynh, và có thể sai vì lỗi đo (mạng, máy yếu). Máy kết luận và soạn sẵn hết, thầy chỉ đọc hồ sơ rồi bấm.

**Mốc sớm nhất:**
- Đường thường: 4 tuần để lên Không dạy nổi, cộng 14 ngày cam kết. Nếu nhật ký can thiệp chạy từ 27/10 thì ĐUỔI sớm nhất khoảng **08/12**.
- Đường tắt (gian lận ×2): ngay khi đủ bằng chứng.

## 5. Phải đo thêm (không có thì không chính xác được)

| # | Thiếu | Làm gì | Ảnh hưởng nếu không làm |
|---|---|---|---|
| 1 | Giây từng câu ở **ca thi, KTCN, tự luyện, lên bảng** | Phát hành Đợt 1 đồng hồ mới cho các màn này (đã có trong `docs/dac-ta-muc-lam-6-muc-2210.md`, chưa lên) | B1, B3 chỉ dựa vào câu ôn lại. Câu MỚI mới lộ rõ đối phó |
| 2 | **Lớp của buổi học** (19/19 buổi lớp rỗng) | Chọn lớp khi mở buổi (bắt buộc), sửa lùi được bằng tay | Không tính được vắng (A3) |
| 3 | **Nhật ký can thiệp** | Bảng chỉ-thêm `can_thiep_em`: thầy nhắc / gọi PH / cảnh báo, lúc gửi, em xem lúc, PH xem lúc. Nút «Nhắc em» ngay trên nhãn Đối phó | Không có thì không bao giờ đủ điều kiện «Không dạy nổi» |
| 4 | Trùng lỗi sai giữa bạn ở **ca thi / KTCN** | Mở rộng `phanTichGianLanBtvn` (đang chỉ chạy BTVN) | Thiếu B7 |
| 5 | Vắng có phép | Nút «Có phép» trên dòng vắng ở điểm danh | Em ốm bị tính vắng |
| 6 | Lưu nhãn theo ngày | Bảng chỉ-thêm `danh_gia_em_ngay` (bộ đệm; tính lại được từ sổ) | Không xem được diễn biến 4 tuần |

## 6. Mốc thời gian thật (không hứa sớm hơn số liệu)

| Trục / nhãn | Có dữ liệu từ | Chạy được từ |
|---|---|---|
| B1, B3 (câu ôn lại) | 20–22/10 | ngay (đủ 14 ngày ≈ 04/11) |
| B1, B3 (câu mới: thi/KTCN) | ngày phát hành mục 5.1 | + 14 ngày |
| B5, C1 (bản khác câu sai) | đã có | ngay |
| A1, C3 (KTCN) | 13/10 | ngay |
| A3 (vắng) | ngày gắn lớp cho buổi | + 14 ngày |
| **Không dạy nổi** | ngày có nhật ký can thiệp (mục 5.3) | **sớm nhất + 4 tuần**: nếu phát hành 27/10 thì khoảng **24/11** |

## 7. Hiệu chỉnh (để «chính xác nhất», không chỉ đoán ngưỡng)

1. **Chạy ngầm 1 tuần:** máy tính nhãn, lưu lại, KHÔNG hiện cho ai.
2. **Thầy gán nhãn mù 30 em** trước khi xem nhãn máy (10 em thầy chắc là Học thật, 10 Đối phó, 10 nghi Không dạy nổi). Màn gán nhãn đơn giản, không hiện số đo để thầy khỏi bị kéo theo.
3. **Đối chiếu:**
   - Yêu cầu cứng: **0 em thầy cho là Học thật bị máy xếp Đối phó nặng hoặc Không dạy nổi**.
   - Khớp Học thật/Đối phó ≥ 80%.
   - Lệch ở đâu thì chỉnh ngưỡng đó, ghi lại vì sao.
4. Mỗi tháng đối chiếu lại 10 em.

## 8. Chi phí máy chủ · Ngoại lệ · Nghiệm thu

**Chi phí máy chủ:**
- Một lệnh `/gv/danh-gia-em` đọc song song (`Promise.all`) 5 câu gộp theo em, 14 ngày, dùng `idx_skh_em_ngay`. Không thêm vòng chờ nối tiếp.
- Danh sách cả lớp đọc từ bộ đệm `danh_gia_em_ngay` (cron đêm + tính lại khi thầy mở hồ sơ em).

**Ngoại lệ:**
- Em mới vào (< 14 ngày): luôn «Chưa đủ dữ liệu».
- Máy yếu hoặc mất mạng làm treo: lượt mất mạng không tính Mức 5 (đã có cờ `w`/`a`).
- Câu có đáp án «cần xem»: không tính B1 khi sai.

**Nghiệm thu (test):**
- `tests/danh-gia-hoc-that-2410.test.ts`:
  - nhanh mà đúng ở câu ôn ⇒ không Đối phó;
  - nhanh mà sai ≥ 30% ⇒ Đối phó;
  - Không dạy nổi thiếu can thiệp đã xem ⇒ không bao giờ bật;
  - em yếu điểm thấp, không tín hiệu B ⇒ Học thật.
- `kiem:toc-do` 0 đỏ; nhãn «Không dạy nổi» không có trong bản build app HS/PH (test quét chuỗi).

## 9. Thầy quyết (mặc định em đề xuất in đậm)

1. **Học sinh thấy gì?**
   - **Thấy nhãn Học thật / Đối phó của mình kèm lý do bằng số, để tự sửa.**
   - Không bao giờ thấy «Cần theo dõi» và «Không dạy nổi».
2. **Phụ huynh:** **nhận tin khi em Đối phó 2 tuần liền**. Tin này cũng ghi vào nhật ký can thiệp.
3. **Cửa sổ:** **14 ngày cho nhãn, 4 tuần cho Không dạy nổi.**
4. **Hiệu chỉnh:** **thầy gán nhãn mù 30 em trong tuần chạy ngầm.**
