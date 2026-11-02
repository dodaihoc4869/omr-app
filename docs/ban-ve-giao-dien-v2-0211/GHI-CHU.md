# Giao diện v2 · MÀN THỬ «làm câu của chặng» (bản vẽ 02/11)

Thầy: «đẹp như Duolingo, mọi thứ xịn nhất», rồi «thử vẽ trước đi».

**Đây CHỈ LÀ BẢN VẼ.** Không sửa `src/`, không PR, không phát hành. Thầy duyệt ảnh xong mới build (quy trình 4 bước).

Bản vẽ học **nguyên tắc** của Duolingo, không chép giao diện, nhân vật hay tài sản của họ:
- mỗi màn một việc;
- nút dày, có gờ, lún xuống khi bấm;
- phản hồi tức thì: nảy khi đúng, rung khi sai;
- thanh tiến độ chạy mượt;
- linh vật phản ứng theo kết quả;
- màu chỉ để mang nghĩa.

## Ảnh và video (`anh/`)

Chụp bằng Chromium thật. Mọi JPG ≤ 150 KB. Dữ liệu là giả, nhưng câu Hoá là câu thật, đáp án đã tính lại tay.

| Tệp | Nội dung |
|---|---|
| `cau-chon-390-sang.jpg` | Câu trắc nghiệm ester, đang chọn B (390×844) |
| `cau-dung-390-sang.jpg` | Đã kiểm tra, ĐÚNG: dải lục ngọc «Chính xác!», +2 nguyên tử, «3 câu đúng liền», nút «Tiếp tục». Mol khen |
| `cau-sai-390-sang.jpg` | Câu amine, chọn 3, SAI: dải hồng «Chưa đúng», «Đáp án đúng: D. 4», một dòng gợi ý, chip lịch ôn, nút «Hỏi thầy» và «Tiếp tục». Mol buồn |
| `tra-loi-ngan-390-sang.jpg` | Trả lời ngắn: 4 ô số (8 , 2 \_) và bàn phím số dày. Vừa một màn |
| `cau-chon-390-toi.jpg` | Ảnh 1, nền tối |
| `de-dai-zfold-904-sang.jpg` | Z Fold mở 904×690, hai cột. Trái để ĐỌC: đề chuẩn độ FeSO₄ / KMnO₄, khối phương trình, bảng 3 lần đo. Phải để LÀM: Mol, lệnh, phương án, Kiểm tra |
| `may-tinh-1440-sang.jpg` | Máy tính 1440×900, một cột giữa màn, phương án lưới 2 × 2, dải ĐÚNG kéo hết bề ngang |
| `bo-thanh-phan.jpg` | Bảng hệ thiết kế: màu, chữ, nút, thẻ phương án, thanh tiến độ, chip, ô số, bo góc / khoảng cách, biểu tượng, nền tối, Mol 11 cảm xúc |
| `truoc-sau-390.jpg` | Màn hiện tại (bản build chụp `scripts/chup-v2`) đặt cạnh màn mới: cùng câu amine, cùng lúc đã chọn C |
| `hieu-ung.webm` | 12,4 giây, 711 KB, 390×844, ghi bằng Playwright `recordVideo`. Trình tự: chọn A, đổi sang B (nút lún) → Kiểm tra → ĐÚNG (thẻ nảy, hạt sáng, Mol nhún khen, thanh tiến độ chạy, số nguyên tử đếm lên) → Tiếp tục → câu sau trượt vào → chọn 3 → Kiểm tra → SAI (thẻ rung, Mol buồn chùng xuống, hiện đáp án đúng) |

Đáp án đã kiểm:
- **Ester:** CH₃COOCH₃.
- **Amine:** C₄H₁₁N, chỉ amine bậc một C₄H₉NH₂ tạo alcohol với HNO₂ ⇒ **4 đồng phân**.
- **Trả lời ngắn:** n(ester) = 8,8 : 88 = 0,1 mol ⇒ m(CH₃COONa) = 0,1 × 82 = **8,2 g**.
- **Chuẩn độ:** V trung bình = 13,20 mL. n(FeSO₄) = 5 × 0,0100 × 0,01320 × 10 = 6,6·10⁻³ mol ⇒ 1,0032 g ⇒ **50,16 %**. Phương án nhiễu 10,03 % là quên ×5; 5,02 % là quên ×10.

## Tệp nguồn của bản vẽ

| Tệp | Vai trò |
|---|---|
| `v2.css` | Toàn bộ token và thành phần. Màn chỉ đọc `--v2-*` / `--tr-*` |
| `man.html` | Màn làm câu, có tham số: `?cau=ester\|amine\|tln\|dai&chon=1&tt=dung\|sai&bo=doc\|hai-cot\|rong`. Có JS cho chọn / kiểm tra / tiếp tục |
| `bo-thanh-phan.html` | Bảng hệ thiết kế |
| `truoc-sau.html` | Trang ghép ảnh trước / sau |
| `tai-san.js` | Tự sinh bởi `dung.mjs`. Mol = chuỗi `svgMol()` của **mã thật** `src/components/linh-vat/mol-dong.ts` (gói bằng esbuild), không vẽ tay. Kèm biểu tượng Phosphor |
| `mol.css` | Bản sao `src/styles/mol.css` |
| `phong/` | Phông tập con và giấy phép OFL. Tạo lại bằng `tao-phong.sh` |
| `bieu-tuong/` | SVG Phosphor đang dùng và `LICENSE-phosphor.txt` (MIT) |
| `do-tuong-phan.py` | Đo tương phản các cặp chữ / nền, sáng và tối |
| `chup.mjs` | Chụp mọi ảnh và video. Có tự soát: tràn ngang, cuộn, đích chạm, cỡ chữ |

Chụp lại:
1. `node docs/ban-ve-giao-dien-v2-0211/dung.mjs <@phosphor-icons/core/assets>`
2. `npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>`
3. `TRUOC=<dist> node docs/ban-ve-giao-dien-v2-0211/chup.mjs`

## Token

### Màu

Giữ NGUYÊN bảng `--tr-*` của app học sinh (`src/styles/trong-hs-mau.css`, bộ B «Chất chỉ thị», cả sáng lẫn tối). Không thêm mã màu thô nào.

Tên vai (màn chỉ dùng các tên này):

| Vai | Token | Dùng cho |
|---|---|---|
| Việc chính | `--tr-hs-nut` mặt, `--tr-hs-day` gờ, `--tr-hs-nhat` nền chọn, `--tr-hs-chu` chữ chọn, `--tr-hs` viền chọn | nút Kiểm tra, thẻ đang chọn, ô số đã nhập, từ khoá đề |
| Đúng | `--tr-dung` (thanh tiến độ, viền), `--tr-dung-nut` / `-day` (nút Tiếp tục), `--tr-dung-nhat` (dải), `--tr-dung-chu` (chữ) | |
| Sai | `--tr-sai` / `-day` (nút), `--tr-sai-nhat` (dải), `--tr-sai-chu` (chữ) | |
| Nguyên tử | `--tr-tin`, `--tr-tin-chu` | |
| Đúng liền | `--tr-chu-y`, `--tr-chu-y-chu` | |
| Gợi ý | `--tr-sao`, `--tr-sao-chu` | |
| Nền / chữ / viền | `--tr-mat` (nền màn sáng), `--tr-nen` (nền màn tối), `--tr-mat-2` / `-3`, `--tr-vien` / `-2`, `--tr-chu` / `-2` / `-3` | |

**Đề xuất mới.** Chỉ pha (`color-mix`) từ token sẵn có:
- `--v2-khoa-chu`: chữ nút khoá = chu-3 82 % + mat-3.
- `--v2-anh`: vệt sáng trên nút và thanh tiến độ = trắng cố định 42 %.
- `--v2-bong-tam`: bóng mềm của tấm kết quả = chữ đậm 28 %, nhoè 24 px. Đây là bóng mờ duy nhất của màn.
- Biểu tượng gợi ý vẽ **hai lớp**: mặt `--tr-sao`, viền `--tr-sao-chu`. Nhờ vậy biểu tượng đạt ≥ 3:1 trên nền trắng.

**Đổi một chỗ so với app hiện tại.** Thẻ đang chọn đổi từ ngọc lam (`--tr-tin`) sang **chàm**, cùng màu với nút chính. Thầy cần quyết điểm này (xem cuối tệp).

Tương phản (`do-tuong-phan.py`), tất cả đều đạt:

| Cặp chữ / nền | Sáng | Tối | Mức cần |
|---|---|---|---|
| Chữ trên nút chàm | 3,39 | 8,24 | 3 (chữ lớn) |
| Chữ trên nút Tiếp tục đúng | 3,05 | 8,88 | 3 |
| Chữ trên nút Tiếp tục sai | 3,56 | 5,15 | 3 |
| Thẻ chọn | 5,05 | 6,93 | 4,5 |
| Thẻ đúng | 4,68 | 7,36 | 4,5 |
| Thẻ sai | 4,66 | 6,78 | 4,5 |
| Gợi ý trên dải sai | 7,51 | 8,68 | 4,5 |
| Nút khoá | 3,71 | 3,58 | 3 |

Chữ trên nút đạt mức «chữ lớn» vì cỡ chữ nút là **19 px đậm** (≥ 18,7 px).

### Chữ

Hai phông:
- **Nunito 800**: tiêu đề, nút, nhãn, chip, số.
- **Be Vietnam Pro**: đề (400), phương án (600), từ khoá / câu hỏi cuối / đáp án đúng (700).

| Vai | Phông · cỡ · cao dòng |
|---|---|
| Lệnh câu, tiêu đề dải kết quả | Nunito 800 · 24 · 1,25 (máy tính 30) |
| Nút | Nunito 800 · 19 · IN HOA, giãn chữ .035em |
| Nhãn, chip | Nunito 800 · 14 |
| Số trong ô trả lời ngắn | Nunito 800 · 30. Phương án số: Nunito 800 · 26 |
| Đề | Be Vietnam Pro 400 · 17 · 1,6 (Z Fold 16, máy tính 20) |
| Phương án chữ | Be Vietnam Pro 600 · 17 · 1,35 |
| Gợi ý, chú thích | Be Vietnam Pro 400 · 15 / 14 (không chữ nào dưới 12 px, trừ chỉ số dưới / trên) |

Công thức hoá học:
- Kho vẫn ghi chỉ số dưới bằng Unicode (C₂H₅OH). Khi hiện ra đổi sang `<sub>` / `<sup>` cỡ .72em, như `ChemText` của app đang làm. Mỗi công thức là một khối không gãy dòng.
- Mũi tên phương trình vẽ bằng CSS, giống `.mt` của app.
- Lý do: cả ba phông đều không có glyph ₂ hay →. Nếu dùng Unicode thì chữ rơi sang phông máy.

### Bo góc · gờ · bóng · khoảng cách · chuyển động

- **Bo góc:** 8 (ô chữ cái) · 12 (khối, bảng) · 16 (nút, thẻ) · 20 (bóng lời) · tròn (thanh, chip).
- **Gờ:** 4 px đặc, cùng họ màu (`box-shadow: 0 4px 0`). Bấm thì lún hết gờ trong 90 ms. Nhấn nhanh vẫn giữ trạng thái lún ít nhất 140 ms. Viền thẻ 2 px.
- **Bóng:** không có bóng mờ cho nút / thẻ. Bóng mềm duy nhất là của tấm kết quả.
- **Khoảng cách:** 4 / 8 / 12 / 16 / 24 / 32. Lề màn điện thoại 16.
- **Đích chạm:** ≥ 44 px. Nút cao 52, thẻ 60–68, phím 56.
- **Chuyển động:** chỉ dùng transform / opacity.
  - đổi trạng thái 220 ms;
  - thẻ đúng nảy, thẻ sai rung: 300 ms;
  - thanh tiến độ 300 ms, kiểu lò xo nhẹ;
  - tấm kết quả trượt lên 260 ms.
- **Giảm chuyển động** (`prefers-reduced-motion`): tắt sạch, kể cả Mol.

## Mol

Dùng đúng Mol bình cầu đang chạy: hàm `svgMol` của mã thật, CSS thật. Mol đứng **cạnh đề** (92 px trên điện thoại, 150 px trên máy tính) và phản ứng ngay tại chỗ. Không thêm Mol thứ hai trong dải kết quả, vì một thông tin chỉ hiện một chỗ.

| Lúc | Mặt Mol |
|---|---|
| Mở câu | vui (trả lời ngắn: nghĩ) |
| Đã chọn | vui |
| Đúng | khen: nhún 3 nhịp, có sao |
| Sai | buồn: chùng xuống, có giọt lệ |

Sau này làm bằng **Rive**, cùng dáng và màu, cùng các trạng thái trên:
- Mol SVG hiện tại vẫn là khung giữ chỗ, cùng cỡ ⇒ màn không xô lệch khi Rive tải xong.
- Runtime Rive chỉ nạp lười, sau khi màn đã chạm được, và chỉ trên máy khoẻ. Máy yếu (`ddh.mayYeu`) hoặc bật giảm chuyển động thì giữ SVG.
- Runtime Rive là gói WASM, nặng hơn nhiều so với Mol SVG hiện tại. Phải đo thật trước khi chốt.

## Phông và dung lượng (tập con woff2, tự chứa, không CDN)

Mỗi phông có hai mảnh, latin và vietnamese, chia bằng `unicode-range`. Đã bỏ hinting.

| Phông | latin | vietnamese | Tổng |
|---|---|---|---|
| **Nunito 800 (chọn)** | 13 332 B | 5 480 B | **18,4 KB** |
| Baloo 2 800 (phương án) | 16 408 B | 4 264 B | 20,2 KB |
| Be Vietnam Pro 400 | 10 532 B | 4 208 B | 14,4 KB |
| Be Vietnam Pro 600 | 11 148 B | 4 600 B | 15,4 KB |
| Be Vietnam Pro 700 | 11 124 B | 4 628 B | 15,4 KB |

So với app hiện tại:
- ĐĐH Rounded (phông riêng app học sinh, 4 tệp) = **33,9 KB**.
- Be Vietnam Pro 400 / 600 / 700 bản fontsource đầy đủ mà `main.tsx` đang nạp = **99,1 KB** nếu tải đủ ba độ đậm.
- Máy mới (đăng nhập rồi làm câu): hiện tại tối đa 133 KB, v2 là **63,6 KB** ⇒ **nhẹ hơn khoảng 69 KB**.
- Máy đã có phông cũ trong kho đệm: lần mở đầu sau khi phát hành tải phông mới **một lần**, rồi lại 0.

## Kế hoạch dựng thật (sau khi thầy duyệt)

1. **Biến, không đổi logic:**
   - Thêm `src/styles/v2-token.css` (vai `--v2-*` pha từ `--tr-*`), nạp lười cùng `trong-hs.css`. App thầy và phụ huynh không tải byte nào.
   - Sửa CSS các lớp đang có (`.duo-tren`, `.duo-thanh`, `.duo-nhan`, `.duo-lenh`, `.ht2-lam-de`, `.ht2-lam-tn [role=radio]`, `.duo-nut`, `.duo-day`, `.duo-ket`, `.ht2-lam-phim`) theo bảng token.
   - DOM chỉ thêm chỗ đặt Mol cạnh đề. Thay nhân vật minh hoạ cũ bằng `<Bi>` đã nạp lười.
   - Chạy `npm run kiem:mau-giu` (0 vi phạm) và `npm run check:mau`.
2. **Phông:**
   - Chép tập con Nunito 800 vào `src/styles/phong-v2/`, ghi `@font-face` + `font-display: swap` + `unicode-range` vào `trong-hs.css`.
   - Đổi `main.tsx` từ fontsource Be Vietnam Pro đầy đủ sang tập con cùng ba độ đậm.
   - Bỏ ĐĐH Rounded khi thầy đồng ý.
   - Không đưa vào precache. Máy đã đăng nhập nạp trước như `phongHs` trong `vite.config.ts`.
3. **Biểu tượng:** một tệp nhỏ chứa đường vẽ Phosphor (chỉ khoảng 24 biểu tượng đang dùng) thay lucide ở màn học sinh, đổi dần từng màn. Không thêm gói npm chạy lúc.
4. **Hiệu ứng:**
   - Nảy, rung, lún, thanh tiến độ: CSS thuần. Không vòng rAF chạy mãi (chỉ đếm số nguyên tử 450 ms), không filter (trừ chớp sáng thanh tiến độ 600 ms).
   - Máy yếu / giảm chuyển động: tắt hết.
5. **Cổng tốc độ:**
   - `npm run build && npm run kiem:toc-do`: 0 đỏ, mốc chỉ hạ.
   - Sau khi gộp: chạy tác tử `toc-do` (bấm phương án, chuyển câu, khung cuộn ở CPU ×4 / ×6).
   - Chưa nhanh hơn bản trước thì chưa báo xong.

## Áp dụng theo đợt

1. **Đợt 1 (màn thử này):** màn làm câu của chặng: `ManLamBaiTap.tsx`, `LamCau.tsx`, `trong-lam-bai.css`, `trong-chang-ngang.css`. Kéo theo Làm lại, Gói 7, sửa câu (cùng thành phần).
2. **Đợt 2:** kết thúc chặng, lời giải từng bước, tấm Hỏi thầy, Tự sửa lỗi.
3. **Đợt 3:** Lộ trình (nút chặng, vòng Mục tiêu, bong bóng Mol), menu, rương.
4. **Đợt 4:** Tu luyện, chữa câu sai, kiểm tra ôn tập, thẻ câu trong Bát Linh Đảo / Đoàn Hộ Tống.
5. **KHÔNG đụng:** màn thi thật (`ExamTakeScreen`, phòng chờ: C-RÀO), app thầy, app phụ huynh.

## Chi phí công cụ

- **Figma** (lưu bộ token / thành phần): có gói miễn phí, gói trả phí xem trang hãng.
- **Rive** (Mol cử động): có gói miễn phí, gói trả phí xem trang hãng.
- **Recraft** (vẽ minh hoạ / biểu tượng bổ sung): có gói miễn phí, gói trả phí xem trang hãng.

Bản vẽ này không dùng công cụ trả phí nào. Phông là OFL, biểu tượng là MIT, Mol là mã của app.

## Tự soát (chạy trong `chup.mjs`, đối chiếu `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`)

- **Ở 390×844:** cả bốn màn (chọn, đúng, sai, trả lời ngắn) và màn tối đều **vừa một màn, không cuộn, không tràn ngang**. Z Fold và máy tính cũng không cuộn.
- **Đích chạm:** 0 nút dưới 44 px.
- **Cỡ chữ:** 0 chữ dưới 12 px (trừ chỉ số dưới / trên của công thức).
- **Tương phản:** bảng ở trên, tất cả đạt.
- **Từ ngữ đúng bảng chuẩn:** «Chặng», «Làm lại», «Lộ trình» (nút đóng: «Lưu và về Lộ trình»), «nguyên tử», «Hỏi thầy», «Lời giải», «Vào lịch ôn 1 · 3 · 7 ngày». Con số nào cũng có nhãn. Không emoji. Biểu tượng nào cũng kèm chữ hoặc `aria-label`.
- **Còn thiếu (làm khi build):** trạng thái đang tải / lỗi / mất mạng của màn (đã có sẵn trong app, giữ nguyên); tấm lời giải và Hỏi thầy theo thành phần v2 (đợt 2).
- **Cố vấn:** phiên này không có công cụ cố vấn ⇒ **chưa tham vấn được cố vấn**.

## Cần thầy quyết

1. **Phông tròn:** Nunito (đề xuất: dấu tiếng Việt gọn, nhẹ 18,4 KB) hay Baloo 2 (tròn và «game» hơn, 20,2 KB)?
2. **Có bỏ ĐĐH Rounded** (phông riêng thầy duyệt 27/10) để thay bằng phông tròn trên + Be Vietnam Pro không?
3. **Mol cạnh đề ở mọi câu** (như ảnh), thay nhân vật minh hoạ hiện tại?
4. **Thẻ đang chọn đổi sang chàm** (cùng màu nút chính, ảnh trước / sau)?
5. Duyệt thì build **đợt 1**.
