# Mol v2 — HƯỚNG HIỆN TẠI: GIỮ BÌNH CẦU, sửa thẳng mã thật (01/11 tối, chưa PR)

Thầy: «Giữ nguyên hình cầu đi, điều chỉnh lại cảm xúc cho dễ thương, thêm 6,022, phối màu lại cho đẹp mịn siêu dễ thương».
⇒ Bỏ hướng ống nghiệm (phần dưới tệp này + `mol-v2.html`, `huong-phong-cach.html` chỉ còn để tham khảo).

## Mã đã sửa (nhánh `claude/mol-v2-0111`)

| Tệp | Đổi gì |
|---|---|
| `src/components/linh-vat/mol-dong.ts` | Vẽ lại bình cầu (giữ cầu + cổ + vành, khung 200 × 230, API `<Bi …>` y nguyên) |
| `src/styles/mol.css` | Bảng màu mới + lớp gradient + hoạt ảnh lửa / nút bấc |
| `src/components/linh-vat/Bi.tsx` | `data-nho` khi < 64 px (ẩn chữ khắc); đổi khoá ảnh tĩnh `ddh.bi-tinh-mol2` để máy em không dùng ảnh Mol cũ |
| `src/lib/khung-tinh-hs.ts` | Ảnh tĩnh / biểu tượng tab ghi thêm `stop-color`, `stop-opacity` (không thì gradient ra đen) |

- **Màu (tổ hợp 1 — chọn):** thân chàm sáng `--tr-hs-nut`, gradient tròn từ `--tr-hs` pha trắng (trên-trái) → `--tr-hs-day` (dưới-phải). Đã thử 3 tổ hợp: `anh/binh-cau-mau.jpg`.
  - dung dịch ngọc lam `--tr-tin`;
  - mũi `--tr-chu-y`, má hồng phấn `--tr-tim` (gradient tròn);
  - nút bấc `--tr-sao` pha `--tr-chu-y-day`.
- **Mắt:** tròng tròn to, con ngươi to, đốm sáng to + nhỏ. Cười = mí dưới cong; chán / giận = mí trên sụp nghiêng. Mày chỉ dùng khi cảm xúc cần; miệng nhỏ.
- **Giận:** không răng.
  - Dỗi / bực chỉ ửng má.
  - Cáu / rất cáu: cả bình đổi sắc đỏ sẫm, tròng hồng đỏ, con ngươi nhỏ, rất cáu có ánh đỏ.
  - Nút bấc bung lơ lửng trên ngọn lửa hai lưỡi; dung dịch đỏ dâng.
- **Chữ khắc 6,022·10²³:** cong theo vai bình ngay dưới cổ, ẩn khi < 64 px.
- **Mặt phương án** (chưa gắn trạng thái nào): ngượng · mê · vui nhảy · tự tin.
- **Ảnh** (Chromium, từ mã thật; chụp lại: `node docs/ban-ve-mol-v2-0111/chup-binh-cau.cjs`):

  | Ảnh | Nội dung |
  |---|---|
  | `binh-cau-cu-moi.jpg` | Mol cũ / mới, cùng 5 mặt |
  | `binh-cau-cam-xuc-sang.jpg`, `binh-cau-cam-xuc-toi.jpg` | 15 mặt, nền sáng / tối |
  | `binh-cau-mau.jpg` | 3 tổ hợp màu đã thử |
  | `binh-cau-lo-trinh-toi.jpg` | Màn Lộ trình nền tối, mặt cáu + bong bóng lời |
  | `binh-cau-co-nho.jpg` | 28 / 40 / 64 px + vòng 40 px, nền sáng / tối |

  Bong bóng trên Lộ trình mới vẽ trong trang chụp; build sau khi thầy duyệt.
- **Màu cũ đổi (thầy ra lệnh):** ngoại lệ ĐÓNG `docs/mol-doi-mau-0111.json` (15 khai báo cũ), nạp ở `scripts/kiem-mau-giu-nguyen.mjs`.
- **Cổng đã chạy:**
  - test Mol / Bi / lớp giận / khung tĩnh / màu: xanh;
  - `check:mau` sạch; `kiem:mau-giu` (so điểm rẽ nhánh `3f0a74e`) 0 vi phạm; `tsc` sạch;
  - `build` + byte tải xanh (học sinh 232,0 KB, mốc 232,1);
  - test máy chủ `nop-cau` 10 / 9 đợt D1 đỏ có sẵn từ gốc, nhánh không đổi `server/`.

---

# (Tham khảo) Mol v2 · ống nghiệm lùn mập có nắp, cánh có ngón (bản vẽ cũ, 01/11/2026 tối)

**Thầy góp ý 01/11 tối, theo thứ tự:**
1. Phối màu hợp app, mịn màng, theo kích thước cú.
2. «Cảm xúc hình dạng ống nghiệm».
3. «Cáu bỏ miệng răng, tinh tế».
4. «Thay tay bằng cánh, lùn hơn ngang to hơn».
5. Khắc số Avogadro **6,022·10²³** (SGK 2018), chốt «lên đầu gần mép miệng ống».
6. «Cánh to có ngón như cánh cú, xếp bậc, xoè được», thêm «chống nạnh», cáu / rất cáu «bốc lửa lên đầu».
7. «Chân đẹp hơn, hợp thân».
8. «Ống nghiệm có nắp đóng… cáu, rất cáu nắp bung lơ lửng trên lửa; có thể khắc 6.022 trên nắp».
9. «Cáu theo kiểu icon của Duolingo» ⇒ giận ĐỔI SẮC TOÀN THÂN (chỉ học cách đổi sắc, không chép nhân vật).
10. «Phần Mol cáu chữ hiện bong bóng trên đầu Mol… bong bóng đổi màu theo cảm xúc» (thay thẻ riêng ở trên màn Lộ trình).

- **Bản vẽ:** `mol-v2.html` (SVG thuần, màu = biến CSS chép giá trị token thật). Mở thường là bản sáng; `?toi` là bản tối; `?dien-thoai` là ảnh ngữ cảnh.
- **Chụp lại:** `node docs/ban-ve-mol-v2-0111/chup.cjs` (cần `node_modules` của repo + `/opt/pw-browsers/chromium`; ảnh tĩnh chụp ở chế độ giảm chuyển động).
- **Ảnh** (`anh/`, mỗi ảnh ≤ 150 KB):

  | Ảnh | Nội dung |
  |---|---|
  | `so-sanh-cu-moi.jpg` | Mol cũ · cú Lửa · Mol mới, cùng khung 200 × 230 |
  | `3-phuong-an-mau-sang.jpg`, `3-phuong-an-mau-toi.jpg` | 3 phương án màu cạnh nút / chặng / bong bóng lời |
  | `cam-xuc-A-sang.jpg`, `cam-xuc-A-toi.jpg` | 15 cảm xúc (11 cũ + 4 mới), có tên |
  | `gian-truoc-sau.jpg` | Dỗi · bực · cáu · rất cáu: trước (miệng răng) và sau |
  | `canh-chan-can-canh.jpg` | Cánh khép / xoè, đôi chân, chống nạnh, kiễng, nhấc chân, chân khép |
  | `nap-can-canh.jpg` | Nắp đóng · khen · cáu · rất cáu · hai vị trí chữ (+ 64 px) |
  | `so-avogadro-can-canh.jpg` | Chữ khắc hai vị trí, cận cảnh, khi giận, 64 / 40 px |
  | `co-nho.jpg` | 28 / 40 / 64 px, sáng / tối |
  | `ngu-canh-dien-thoai.jpg` | Lộ trình 390 × 844, Mol vẫy chào + bong bóng trên đầu |
  | `bong-bong-lo-trinh-sang.jpg`, `bong-bong-lo-trinh-toi.jpg` | Hai điện thoại 390 × 844: cáu · rất cáu, bong bóng trên đầu Mol, KHÔNG còn thẻ riêng |
  | `bong-bong-mau.jpg` | Bong bóng 15 cảm xúc cạnh mặt Mol, sáng + tối |

## Thiết kế
- **Thân:** ống nghiệm LÙN MẬP, rộng 136 × cao 156 (cao : rộng ≈ 1,15 : 1). Vành miệng ống rộng, đáy tròn to.
  - Mảng mặt trắng hai thuỳ, hai mắt to, mũi tròn cam, má hồng.
  - Dung dịch ở đáy có bọt.
  - Thân chuyển màu ngang như khối trụ thuỷ tinh, vệt sáng, bóng trụ mờ; không viền đen, không filter.
- **Nắp:** nút cao su hơi hình nấm, vành dưới khít miệng ống, một rãnh ngang, núm tròn nhỏ trên đỉnh (như một nguyên tử).
  - Màu `--tr-tim` (hồng chỉ thị), bóng pha `--tr-hs-day`. Hồng tách khỏi lửa cam–đỏ nên nắp bay vẫn rõ, hợp má hồng. Phương án C (dung dịch hồng) dùng nắp `--tr-chu-y`.
  - Mặt thường: đóng. Khen / ngạc nhiên / vui nhảy: nắp nảy nhẹ (đề xuất).
  - Cáu: nắp bật lên nghiêng, lơ lửng trên ngọn lửa. Rất cáu: bay cao hơn, nghiêng nhiều, vài tia lửa nhỏ.
  - Nắp bung vượt khung 200 × 230 phía trên khoảng 10–20 px; `mol.css` đã `overflow: visible`.
- **Cánh có ngón:** thân cánh giọt dài áp hông + 4 lông bo tròn ở đuôi cánh.
  - Lông ngoài dài nhất, vào trong ngắn dần, sáng dần (xếp bậc).
  - Khép: lông sát nhau. Xoè (khen, ngạc nhiên, vui nhảy, chào): lông toả rời.
  - Màu thân đậm (`--tr-hs-nut` pha `--tr-hs-day`), lông trong pha sáng dần về `--tr-hs`.
- **Chân:** ống chân ngắn mập, gốc chìm vào đáy tròn; bàn chân bo + 3 ngón tròn xếp bậc (cùng ngôn ngữ với cánh).
  - Màu cùng họ cánh. Cam để dành riêng cho mũi và lửa ⇒ một điểm nhấn, không loạn.
  - Dáng đổi theo cảm xúc: đứng tách vững; chống nạnh chân rộng; buồn / ngủ chân khép; khen / ngạc nhiên kiễng; vui nhảy một chân nhấc.
- **Chữ khắc «6,022·10²³»** (dấu phẩy thập phân, chấm giữa, mũ 23 thật): khắc mờ, nét trắng bán trong + bóng chìm, cong nhẹ, cân giữa, không khung nhãn.
  - **B · dưới vành miệng ống (ĐỀ XUẤT):** trên thân chàm có bóng vành ⇒ tương phản tốt hơn, không nghiêng khi nắp bung; lửa và cánh không che.
  - **A · trên nắp:** xinh, bay theo nắp; nhưng chữ trắng trên hồng kém tương phản hơn, nghiêng / bay khỏi khung khi giận.
  - Từ 64 px hiện chữ; nhỏ hơn chỉ giữ vạch.
- **Giận đổi sắc toàn thân** (bản mới; `gian-truoc-sau.jpg` có 3 cột: miệng răng · tinh tế · đổi sắc):
  - **dỗi (2) / bực (3):** chỉ ửng má (`--tr-sai` pha trắng 50 % / 68 %), thân giữ màu.
  - **cáu (4):** thân sẫm vừa, chuyển gradient sang tím đỏ — `--tr-sai` pha `--tr-hs-day` / `--tr-hs`, mép tối pha mực.
    - Tròng mắt đỏ hồng (`--tr-sai` 38 % trắng), con ngươi nhỏ nhìn trừng.
    - Mí trên sập nặng màu thân sẫm, nghiêng gắt; quầng tối quanh mắt (`--tr-sai-day` pha mực).
    - Má đỏ `--tr-sai`; cánh, chân sẫm theo.
  - **rất cáu (5):** sẫm hẳn, đỏ rực, mép trong tối dày hơn, tròng đỏ đậm, ánh đỏ mờ quanh mắt (gradient tròn `--tr-sai` → trong suốt, không filter).
  - Cả cáu và rất cáu giữ nắp bung + lửa.
  - Cách làm: cả hình bọc trong nhóm `.gian4` / `.gian5` đặt lại biến `--mol-*` ⇒ stop gradient kế thừa, không cần vẽ hình thứ hai.
- **Giận tinh tế:** không răng, không gân đỏ.

  | Mức | Mặt | Dáng | Lửa / dung dịch |
  |---|---|---|---|
  | bực | mày chau che nửa trên con ngươi, mí dưới nheo, miệng khép thành nét ngắn | chống nạnh | — |
  | cáu | như bực | chống nạnh | một ngọn lửa cam–đỏ đỡ nắp, dung dịch hơi đỏ |
  | rất cáu | như bực | cánh nắm sát thân, rung nhẹ | lửa to ba lưỡi đỏ đậm, nắp bay cao, dung dịch đỏ dâng |

  - Lửa ba lớp: ngoài `--tr-sai` (cáu pha `--tr-chu-y`) → giữa `--tr-chu-y` → lõi `--tr-sao` pha trắng. Bản tối tự sáng theo token.
- **Bản quyền (bắt buộc):** KHÔNG chép cú Duolingo: không lông/chỏm tai, không mỏ, không màu xanh lá của Duo, không đường nét lông ở ngực. Mol là ống nghiệm của app, màu theo token app. Chỉ học «ngôn ngữ biểu cảm / dáng», không chép nhân vật.

## Bong bóng lời trên đầu Mol (thay thẻ riêng ở trên)
- **Hình:**
  - gọn ≤ 2 dòng, rộng ≤ 220 px, chữ 14,5 px đậm vừa, bo 16 px, viền 2 px, gờ dưới 3 px;
  - đuôi nhọn bo chỉ xuống đầu Mol, lệch ~24 px khỏi tâm để tránh nắp / lửa.
- **Tự căn:** `trái = kẹp(tâm Mol − rộng/2, 12, màn − 12 − rộng)`; đuôi = tâm Mol − 24 − trái ⇒ Mol sát phải thì bong bóng lệch trái, đuôi vẫn chỉ đúng Mol.
  - Đáy bong bóng = đỉnh hình Mol − 12 px. Khi nắp bung, đỉnh hình cao hơn nên bong bóng lên theo.
- **Hiện:** nảy nhẹ (scale 0,85 → 1, 0,5 s). Câu dài rút ý chính, vd. «Cáu lắm rồi! 5 câu liền chưa tính — đọc kĩ đề nhé».
- **Đổi màu theo cảm xúc:** `transition` 0,35 s cho nền, viền, chữ. Rất cáu thêm viền nhấp nháy rất nhẹ (vòng 4 px `--tr-sai` 30 %). Giảm chuyển động ⇒ đứng yên.

  | Cảm xúc | Nền | Viền | Chữ |
  |---|---|---|---|
  | vui | `--tr-hs-nhat` | `--tr-hs` | `--tr-hs-chu` |
  | khen, vui nhảy | `--tr-tin-nhat` | `--tr-tin` | `--tr-tin-chu` |
  | chào, tự tin | `--tr-hs-day` | `--tr-hs-chu` | `--tr-hs-tren` |
  | nghĩ, ngủ (xám xanh) | `--tr-mat-2` | `--tr-vien-2` | `--tr-chu-2` |
  | ngạc nhiên | `--tr-sao-nhat` | `--tr-sao` | `--tr-sao-chu` |
  | buồn (xanh lam nhạt) | `--tr-gv-nhat` | `--tr-gv` | `--tr-gv-chu` |
  | dỗi, ngượng, mê (tím nhạt) | `--tr-tim` 15 % trên `--tr-mat` | `--tr-tim` | `--tr-tim-chu` |
  | bực (cam nhạt) | `--tr-chu-y-nhat` | `--tr-chu-y` | `--tr-chu-y-chu` |
  | cáu (đỏ cam) | `--tr-sai-nhat` | `--tr-sai` pha `--tr-chu-y` | `--tr-sai-chu` |
  | rất cáu (đỏ đậm) | `--tr-sai-chu` | `--tr-sai-day` | `--tr-trang` |

  Mọi cặp chữ / nền ≥ 4,5 ở nền sáng (chào dùng `--tr-hs-day` thay `--tr-hs-nut` cho đủ tương phản). Nền tối các token tự đổi.
- **Build:**
  - thẻ lời Mol hiện ở trên Lộ trình (`bi-loi`) chuyển thành bong bóng neo theo khung Mol, gắn `data-cx` = mặt đang vẽ;
  - CSS ở `mol.css` hoặc tờ của Lộ trình;
  - đo vị trí bằng `getBoundingClientRect` của khung Mol một lần khi hiện (không theo dõi liên tục).

## Ba phương án màu (token có sẵn «Chất chỉ thị», `src/styles/trong-hs-mau.css`)

**Phần chung cả ba phương án:**
- mặt `--btg-chu-doan-dam`;
- mắt và miệng `--tr-hs-day` pha `--btg-chu-doan`;
- má `--tr-tim`, lưỡi `--tr-sai`, lấp lánh `--tr-sao`;
- giận / lửa `--tr-sai` · `--tr-chu-y` · `--tr-sao`.

| | Thân + cánh + chân | Dung dịch | Mũi | Nắp | Nhận xét |
|---|---|---|---|---|---|
| **A · Chàm + Ngọc lam (đề xuất)** | `--tr-hs` / `--tr-hs-nut` / `--tr-hs-day` | `--tr-tin` / `--tr-tin-day` | `--tr-chu-y` | `--tr-tim` | Đúng màu chính app học sinh; ngọc lam ↔ đỏ khi giận rõ nhất |
| B · Chàm + Cam | như A | `--tr-chu-y` / `--tr-chu-y-day` | `--tr-chu-y-nut` | `--tr-tim` | Giữ cam Mol cũ; cam → đỏ đổi ít |
| C · Ngọc lam + Hồng chỉ thị | `--tr-tin` / `--tr-tin-day` | `--tr-tim` / `--tr-tim-day` | `--tr-chu-y` | `--tr-chu-y` | Tươi; lệch màu chính chàm |

## Cảm xúc (phương án A) và chỗ dùng
- **11 mặt đang có:** vui · khen · chào · nghĩ · ngạc nhiên · buồn · ngủ · 2 dỗi · 3 bực · 4 cáu · 5 rất cáu.
- **4 mặt MỚI để thầy chọn:**

  | Mặt mới | Gợi ý dùng |
  |---|---|
  | ngượng | được khen / nhận quà |
  | mê | mở rương / thành tích |
  | vui nhảy | giữ chuỗi ngày (`covu`) |
  | **tự tin (chống nạnh, cười nhếch)** | đủ mức hôm nay / lên hạng giải tuần |

  Bực và cáu cũng dùng dáng chống nạnh.

## Cỡ nhỏ (đề xuất)
- **Từ 48 px:** toàn thân.
- **Dưới 48 px:** NỬA TRÊN — viewBox `20 -2 160 160`, cắt tràn.
- **Chữ khắc** chỉ hiện từ 64 px.

## Kế hoạch build (sau khi thầy chốt — CHƯA sửa `src/`)

1. **`src/components/linh-vat/mol-dong.ts`:**
   - chép bộ vẽ trong `<script>` của `mol-v2.html` (`TU`, `NA`, `mat`, `mi`, `canhHinh`/`canh`/`CANH`, `chanVe`/`CHAN`, `napVe`/`NAP_DANG`, `LUA`, `SOI`, `khacVe`, `DANG`);
   - giữ `VIEWBOX_MOL = '0 -26 200 230'`, kiểu `Lua`, `taoLua`, `datCap`, `noi`, `cham`, `MOL_DANG_SONG` ⇒ `<Bi …>` không đổi;
   - `MatMol` thêm `nguong | me | nhay | tuTin` nếu duyệt;
   - map trạng thái cũ ⇒ mặt mới: `combo`/`cuoi` → khen, `covu` → vui nhảy, `choc` → ngạc nhiên, cấp 2–5 → dỗi / bực / cáu / rất cáu;
   - **id duy nhất mỗi hình** (gradient thân / vành / mặt / dung dịch / trụ / nắp, clip mí `…ma`/`…mb`, đường chữ `…k`/`…kn`): bản vẽ từng gặp lỗi trùng hậu tố ⇒ mí lộ khối trắng.
2. **`src/styles/mol.css`:**
   - bảng `--mol-*` phương án A (chỉ `color-mix` token sẵn có);
   - lớp `stop-color`, `.m-canh`/`.m-ngon*`, `.m-nap*`, `.m-lua*`, `.m-khac`, `.m-vach`;
   - chuyển động CSS (không rAF):
     - lửa: `.mol-lua` scaleY 0,92 ↔ 1,06 + skewX ±4°, gốc ở đáy lửa; cáu 0,9 s, rất cáu 0,45 s; lớp giữa lệch pha;
     - nắp: `.mol-nap` nhấp nhô theo lửa, translateY 0 ↔ −3 px + rotate ±3°;
     - cánh: vỗ khi khen (xoay nhóm cánh quanh gốc), vẫy khi chào;
     - thở, chớp mắt, bọt nổi, rung nhẹ khi rất cáu;
   - giảm chuyển động / máy yếu ⇒ đứng yên.
3. **Cỡ nhỏ:**
   - `Bi.tsx` gắn `data-nho` khi `size < 48` (viewBox nửa trên + `overflow: hidden`);
   - ẩn chữ khắc khi < 64 px;
   - `datIconTabMol` đổi vùng cắt theo khung nửa trên.
4. **Cổng phải qua:**
   - test: `tests/mol-0111.test.tsx`, `tests/bi-2610.test.tsx`, `tests/lua-cap-ve-3110.test.ts`;
   - `npm run check:mau`, `npm run kiem:mau-giu`, `npm run build && npm run kiem:toc-do`;
   - số nút SVG: bản vẽ thêm nắp, cánh có ngón, chân có ngón ⇒ đo trên bản vẽ 95–120 nút mỗi hình. Mol cũ 26–46, cú Lửa ~120. Không filter. Có thể gộp gradient chung một `<defs>` / dùng `<use>` cho ngón để nhẹ hơn;
   - chạy tác tử `toc-do` sau gộp.
