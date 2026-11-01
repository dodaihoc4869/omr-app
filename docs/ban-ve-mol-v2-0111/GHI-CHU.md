# Mol v2 · ống nghiệm lùn mập có cánh (bản vẽ chờ thầy duyệt, 01/11/2026 tối)

**Thầy góp ý 01/11 tối, theo thứ tự:**
1. «Phối màu lại cho phù hợp nhất với app… mịn màng… theo kích thước của con cú».
2. «Làm cảm xúc hình dạng ống nghiệm y hệt như thế này» (gửi ảnh bảng cảm xúc mẫu).
3. «Phần cáu bỏ miệng răng đi, làm cho tinh tế giống con cú cáu ấy».
4. «Thử thay tay bằng cánh… Cho lùn hơn chiều ngang to hơn».
5. Thêm dòng số Avogadro lên Mol «thật tinh tế đẹp mắt» — thầy chốt **6,022·10²³** (SGK 2018).

⇒ Mol là nhân vật TOÀN THÂN hình ỐNG NGHIỆM lùn mập, có hai cánh nhỏ, khắc mờ số Avogadro trên thân. Hướng «mặt cú khối vuông» đã bỏ.

- **Bản vẽ:** `mol-v2.html` (SVG thuần, màu = biến CSS chép giá trị token thật). Mở thường là bản sáng; `?toi` là bản tối; `?dien-thoai` là ảnh ngữ cảnh.
- **Chụp lại:** `node docs/ban-ve-mol-v2-0111/chup.cjs` (cần `node_modules` của repo + `/opt/pw-browsers/chromium`).
- **Ảnh** (`anh/`, mỗi ảnh ≤ 150 KB):

  | Ảnh | Nội dung |
  |---|---|
  | `so-sanh-cu-moi.jpg` | Mol cũ · cú Lửa · Mol mới, cùng khung 200 × 230 |
  | `3-phuong-an-mau-sang.jpg`, `3-phuong-an-mau-toi.jpg` | 3 phương án màu, cạnh nút chính, nút chặng, bong bóng lời |
  | `cam-xuc-A-sang.jpg`, `cam-xuc-A-toi.jpg` | 14 cảm xúc của phương án A, có tên dưới mỗi hình |
  | `gian-truoc-sau.jpg` | Dỗi · bực · cáu · rất cáu: trước góp ý (miệng răng) và sau (tinh tế) |
  | `so-avogadro-can-canh.jpg` | Chữ khắc: 2 phương án vị trí, cận cảnh + khi giận + 64 / 40 px |
  | `co-nho.jpg` | Cỡ 28 / 40 / 64 px trên nền sáng và tối (toàn thân, nửa trên, vòng Mục tiêu, biểu tượng tab) |
  | `ngu-canh-dien-thoai.jpg` | Màn Lộ trình 390 × 844: Mol vẫy cánh chào dưới bong bóng lời, Mol nhỏ ở vòng Mục tiêu |

## Thiết kế
- **Thân:** ống nghiệm LÙN MẬP, rộng 136 × cao 156 (cao : rộng ≈ 1,15 : 1) trong khung 200 × 230. Vành miệng ống rộng theo thân, đáy tròn to (bán kính 68), chân ngắn sát đáy, bóng elip mờ.
- **Mặt:** mảng trắng hai thuỳ ôm hai mắt to (mắt mực có hai đốm sáng) ở nửa trên. Mũi tròn cam của Mol, má hồng, miệng đổi theo cảm xúc.
- **Cánh** (thay tay): hai cánh chim non bo tròn, không vẽ lông, màu thân đậm hơn một chút, có vệt sáng mép trên.
  - Gốc cánh nấp sau mép thân.
  - Dáng khép trước bụng / che má thì vẽ đè lên thân.
- **Dung dịch:** đáy tròn, mặt sóng sáng, có bọt khí.
- **Chữ khắc «6,022·10²³»:**
  - khắc MỜ trên thuỷ tinh: nét trắng bán trong + bóng chìm 0,7 px, cỡ nhỏ, không khung nhãn;
  - cạnh 3 vạch chia mảnh như ống đong;
  - mũ «23» là chữ số mũ thật (tspan nâng chân chữ), dấu phẩy thập phân, chấm giữa.
  - **Vị trí A (đề xuất):** ngang bụng, cong nhẹ theo thân, ngay trên mặt dung dịch, dưới mặt. Đọc thẳng, cân đối.
  - **Vị trí B:** dọc mép phải theo vạch chia. Kín đáo hơn nhưng phải nghiêng đầu mới đọc, dễ bị cánh che.
  - **Cỡ:** từ 64 px trở lên hiện chữ; nhỏ hơn ẩn chữ, giữ vạch.
  - **Giận:** dung dịch đỏ dâng qua chữ, chữ trắng vẫn đọc được.
- **Mịn màng:**
  - thân chuyển màu ngang (sáng trái → đậm phải) nên đọc ra khối trụ thuỷ tinh;
  - vệt sáng ở vai ống và trong đáy, bóng trụ mờ mép phải;
  - KHÔNG viền đen, KHÔNG bộ lọc (filter).
- **Giận tinh tế** (thầy: bỏ miệng răng):
  - **mặt:** mày chau nghiêng che nửa trên con ngươi, mí dưới nheo, miệng khép thành nét ngắn; mũi cam giữ nguyên;
  - **bực:** cánh khép chéo trước bụng;
  - **cáu:** chống hông, làn hơi mảnh bốc khỏi miệng ống, dung dịch hơi đỏ;
  - **rất cáu:** hơi đậm hơn, dung dịch đỏ dâng cao, rung nhẹ.
  - Không răng, không gân đỏ, đứng thẳng.
- **Bản quyền (bắt buộc):** KHÔNG chép cú Duolingo: không lông/chỏm tai, không mỏ, không màu xanh lá của Duo, không đường nét lông ở ngực. Mol là ống nghiệm của app, màu theo token app. Chỉ học «ngôn ngữ biểu cảm / dáng» (nhảy, vẫy, chống cằm…) của bảng mẫu, không chép nhân vật.

## Ba phương án màu (token có sẵn của app học sinh «Chất chỉ thị», `src/styles/trong-hs-mau.css`)

**Phần chung cả ba phương án:**
- mảng mặt `--btg-chu-doan-dam`;
- mắt và miệng `--tr-hs-day` pha `--btg-chu-doan`;
- má `--tr-tim`, lưỡi `--tr-sai`, lấp lánh `--tr-sao`;
- nước mắt `--tr-tin`;
- chữ khắc / vạch `--btg-chu-doan-dam` (mờ) + bóng chìm màu thân đậm;
- giận `--tr-sai` / `--tr-sai-day` (cáu pha `--tr-chu-y`).

| | Thân + cánh | Dung dịch | Mũi | Nhận xét |
|---|---|---|---|---|
| **A · Chàm + Ngọc lam (đề xuất)** | `--tr-hs` → `--tr-hs-nut` / `--tr-hs-day` | `--tr-tin` / `--tr-tin-day` | `--tr-chu-y` | Đúng màu chính app học sinh (như cú Lửa, nút chặng, nút Tiếp tục). Ngọc lam ↔ đỏ khi giận đổi rõ nhất, kể cả ở 28 px |
| B · Chàm + Cam | như A | `--tr-chu-y` / `--tr-chu-y-day` | `--tr-chu-y-nut` | Giữ dung dịch cam của Mol cũ; nhưng cam → đỏ khi giận đổi ít |
| C · Ngọc lam + Hồng chỉ thị | `--tr-tin` / `--tr-tin-day` | `--tr-tim` / `--tr-tim-day` (phenolphtalein) | `--tr-chu-y` | Tươi, đậm chất «chất chỉ thị»; lệch màu chính chàm, hồng → đỏ gần nhau |

Mol cũ dùng `--tr-gv` (xanh app THẦY), lệch với bảng chàm của app học sinh. Đó là lý do đổi màu.

## Cảm xúc (phương án A)

**Giữ đủ 11 mặt đang có:**

| Cảm xúc | Dáng |
|---|---|
| vui | đứng cười, cánh thả |
| khen | nhảy, hai cánh xoè vỗ lên |
| chào | một cánh vẫy, nháy mắt |
| nghĩ | đầu cánh chạm cằm, «?» |
| ngạc nhiên | mắt to, cánh xoè |
| buồn | cánh rủ, mắt rưng nước mắt xanh |
| ngủ | mắt nhắm, «z» |
| 2 dỗi | mí sụp nửa |
| 3 bực | cánh khép chéo |
| 4 cáu | chống hông, hơi mảnh |
| 5 rất cáu | cánh nắm chặt, rung, đỏ dâng |

**3 cảm xúc MỚI để thầy chọn:**

| Cảm xúc | Dáng | Gợi ý dùng |
|---|---|---|
| ngượng | hai cánh che má, lấp lánh | được khen / nhận quà |
| mê | mắt trái tim, tim bay | mở rương / thành tích |
| vui nhảy | nghiêng người, cánh dang nghiêng, nốt nhạc | giữ chuỗi ngày (`covu`) |

## Cỡ nhỏ (đề xuất)
- **Từ 48 px trở lên:** vẽ toàn thân (khung 200 × 230 như cũ).
- **Dưới 48 px** (vòng Mục tiêu 40 px, biểu tượng tab): chỉ hiện NỬA TRÊN — viewBox `20 -2 160 160`, cắt tràn: thấy miệng ống, mặt, vai cánh.
- **Chữ khắc** chỉ hiện từ 64 px.

## Kế hoạch build (sau khi thầy chốt — CHƯA sửa `src/`)

1. **`src/components/linh-vat/mol-dong.ts`:**
   - thay `svgMol` bằng bộ vẽ trong `<script>` của `mol-v2.html` (`TU`, `NA`, `mat`, `mi`, `CANH`, `DANG`, `SOI`, `HOI`, `khacVe`);
   - giữ nguyên `VIEWBOX_MOL = '0 -26 200 230'`, kiểu `Lua`, `taoLua`, `datCap`, `noi`, `cham`, `MOL_DANG_SONG` ⇒ `<Bi …>` và mọi chỗ gọi không đổi;
   - `MatMol` thêm `nguong | me | nhay` nếu thầy duyệt;
   - map trạng thái cũ ⇒ mặt mới: `combo`/`cuoi` → khen, `covu` → vui nhảy (hoặc khen), `choc` → ngạc nhiên, cấp 2–5 → dỗi / bực / cáu / rất cáu;
   - **id duy nhất mỗi hình** (gradient, clip mí `…ma`/`…mb`, đường chữ khắc `…k`): bản vẽ đã gặp lỗi trùng hậu tố `…b` ⇒ mí phải lộ khối trắng.
2. **`src/styles/mol.css`:**
   - bảng `--mol-*` phương án A (chỉ `color-mix` token sẵn có, không mã màu thô), lớp `stop-color`, `.m-canh`, `.m-khac`, `.m-vach`, `.m-hoi-n`;
   - ẩn chữ khắc khi `Bi` nhỏ hơn 64 px: `.bi[data-nho] .m-khac` hoặc thuộc tính cỡ;
   - chuyển động CSS (không rAF):
     - thở nhẹ, chớp mắt, bọt nổi;
     - vỗ cánh khi khen (xoay nhóm cánh quanh gốc), vẫy cánh khi chào;
     - làn hơi bay lên + mờ dần khi cáu / rất cáu, rung nhẹ khi rất cáu;
   - giảm chuyển động / máy yếu ⇒ đứng yên.
3. **Cỡ nhỏ:**
   - `Bi.tsx` gắn `data-nho` khi `size < 48` ⇒ viewBox nửa trên + `overflow: hidden`;
   - vòng Mục tiêu dùng cùng khung cắt;
   - `datIconTabMol` đổi vùng cắt `drawImage` theo khung nửa trên (x 20…180, y −2…158).
4. **Cổng phải qua:**
   - test: `tests/mol-0111.test.tsx`, `tests/bi-2610.test.tsx`, `tests/lua-cap-ve-3110.test.ts`;
   - `npm run check:mau`, `npm run kiem:mau-giu`, `npm run build && npm run kiem:toc-do`;
   - số nút SVG: bản vẽ đo được 63–81 nút mỗi hình (kể cả 5 gradient ≈ 20 nút + chữ khắc 6 nút). Mol cũ 26–46, cú Lửa ~120. Không filter. Nếu cần nhẹ hơn: gộp gradient dùng chung một `<defs>` cho cả trang, bỏ lớp bóng chìm của chữ;
   - chạy tác tử `toc-do` sau gộp.
