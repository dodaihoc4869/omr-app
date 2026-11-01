# Mol v2 · ống nghiệm toàn thân (bản vẽ chờ thầy duyệt, 01/11/2026 tối)

Thầy 01/11 tối: «Linh vật bạn thử phối màu lại cho phù hợp nhất với app và đẹp hơn nữa mịn màng… Làm theo kích thước của con cú». Sau đó thầy gửi ảnh bảng cảm xúc mẫu: «Làm cảm xúc hình dạng ống nghiệm y hệt như thế này».
⇒ Mol thành nhân vật TOÀN THÂN hình ỐNG NGHIỆM. Đứng cả người như cú Lửa nên vừa đúng các chỗ cú đứng trước đây. Bỏ hướng «mặt cú khối vuông» (chưa vẽ).

- **Bản vẽ:** `mol-v2.html` (SVG thuần, màu = biến CSS chép giá trị token thật). Mở thường là bản sáng; `?toi` là bản tối; `?dien-thoai` là ảnh ngữ cảnh.
- **Chụp lại:** `node docs/ban-ve-mol-v2-0111/chup.cjs` (cần `node_modules` của repo + `/opt/pw-browsers/chromium`).
- **Ảnh** (`anh/`, mỗi ảnh ≤ 150 KB):

  | Ảnh | Nội dung |
  |---|---|
  | `so-sanh-cu-moi.jpg` | Mol cũ · cú Lửa · Mol mới, cùng khung 200 × 230 |
  | `3-phuong-an-mau-sang.jpg`, `3-phuong-an-mau-toi.jpg` | 3 phương án màu, đặt cạnh nút chính, nút chặng và bong bóng lời |
  | `cam-xuc-A-sang.jpg`, `cam-xuc-A-toi.jpg` | 14 cảm xúc của phương án A, có tên dưới mỗi hình |
  | `co-nho.jpg` | Cỡ 28 / 40 / 64 px trên nền sáng và tối (toàn thân, nửa trên, vòng Mục tiêu, biểu tượng tab) |
  | `ngu-canh-dien-thoai.jpg` | Màn Lộ trình 390 × 844: Mol vẫy chào dưới bong bóng lời, Mol nhỏ ở vòng Mục tiêu |

## Thiết kế
- **Thân:** ống nghiệm dựng đứng, mập (rộng 108, cao 180 trong khung 200 × 230). Đỉnh có vành miệng ống, đáy bo tròn hình chữ U.
- **Mặt:** mảng trắng hai thuỳ ôm hai mắt to (mắt mực có hai đốm sáng), mũi tròn cam của Mol, má hồng. Miệng đổi theo cảm xúc.
- **Dung dịch:** chiếm nửa dưới, mặt sóng sáng, có bọt khí.
- **Tay, chân, bóng:** hai tay nét tròn dày có bàn tay tròn, hai bàn chân bo, bóng elip mờ dưới chân.
- **Mịn màng:**
  - thân chuyển màu ngang (sáng trái → đậm phải) nên đọc ra khối trụ thuỷ tinh;
  - vệt sáng dọc ở vai ống, vệt sáng cong trong dung dịch;
  - mảng mặt chuyển rất nhẹ xuống dưới, bóng trụ mờ phủ mép phải;
  - KHÔNG viền đen, KHÔNG bộ lọc (filter) — chỉ gradient nên nhẹ máy.
- **Giận:** giữ luật Mol cũ, dung dịch hoá đỏ (`--tr-sai`), dâng lên và sôi.
  - cáu: đỏ cam, dâng tới miệng, 2 cụm hơi nước khỏi miệng ống;
  - rất cáu: đỏ, dâng tới mũi, nhiều hơi nước, vạch rung, nắm tay giơ.
- **Bản quyền (bắt buộc):** KHÔNG chép cú Duolingo: không lông/chỏm tai, không mỏ, không màu xanh lá của Duo, không đường nét lông ở ngực. Mol là ống nghiệm của app, màu theo token app. Chỉ học «ngôn ngữ dáng» (nhảy, vẫy, chống cằm…) của bảng mẫu, không chép nhân vật.

## Ba phương án màu (đều là token có sẵn của app học sinh «Chất chỉ thị», `src/styles/trong-hs-mau.css`)

**Phần chung cả ba phương án:**
- mảng mặt `--btg-chu-doan-dam`;
- mắt và miệng `--tr-hs-day` pha `--btg-chu-doan`;
- má `--tr-tim`, lưỡi `--tr-sai`, lấp lánh `--tr-sao`;
- nước mắt `--tr-tin`;
- giận `--tr-sai` / `--tr-sai-day` (cáu pha `--tr-chu-y`).

| | Thân | Dung dịch | Mũi | Nhận xét |
|---|---|---|---|---|
| **A · Chàm + Ngọc lam (đề xuất)** | `--tr-hs` → `--tr-hs-nut` / `--tr-hs-day` | `--tr-tin` / `--tr-tin-day` | `--tr-chu-y` | Đúng màu chính app học sinh (như cú Lửa, nút chặng, nút Tiếp tục). Ngọc lam ↔ đỏ khi giận đổi rõ nhất, kể cả ở 28 px. Cam ở mũi giữ chất Mol |
| B · Chàm + Cam | như A | `--tr-chu-y` / `--tr-chu-y-day` | `--tr-chu-y-nut` | Giữ dung dịch cam quen của Mol cũ; nhưng cam → đỏ khi giận đổi ít, khó thấy ở cỡ nhỏ |
| C · Ngọc lam + Hồng chỉ thị | `--tr-tin` / `--tr-tin-day` | `--tr-tim` / `--tr-tim-day` (phenolphtalein) | `--tr-chu-y` | Tươi, đậm chất «chất chỉ thị»; nhưng lệch màu chính chàm của app, hồng → đỏ gần nhau |

Mol cũ dùng `--tr-gv` (xanh app THẦY), lệch với bảng chàm của app học sinh. Đó là lý do đổi màu.

## Cảm xúc (phương án A)

**Giữ đủ 11 mặt đang có** — vui · khen · chào · nghĩ · ngạc nhiên · buồn · ngủ · 2 dỗi · 3 bực · 4 cáu · 5 rất cáu:

| Cảm xúc | Dáng |
|---|---|
| khen | nhảy lên, dang hai tay, miệng há |
| chào | vẫy một tay, nháy mắt |
| nghĩ | tay chống cằm, dấu «?» |
| ngạc nhiên | mắt to tròn, hai tay giơ |
| buồn | mắt rưng nước mắt xanh |
| ngủ | mắt nhắm, «z» |
| dỗi | mí sụp nửa, phụng phịu |
| bực | lông mày chau, khoanh tay |

**3 cảm xúc MỚI để thầy chọn** (đánh dấu «mới» trên ảnh):

| Cảm xúc | Dáng | Gợi ý dùng |
|---|---|---|
| ngượng | hai tay ôm má, má đỏ, lấp lánh | được khen / nhận quà |
| mê | mắt trái tim, tim bay quanh | mở rương / thành tích |
| vui nhảy | nghiêng người, co chân, nốt nhạc | giữ chuỗi ngày (`covu`) |

## Cỡ nhỏ (đề xuất)
- **Từ 48 px trở lên:** vẽ toàn thân (khung 200 × 230 như cũ).
- **Dưới 48 px** (vòng Mục tiêu 40 px, biểu tượng tab): chỉ hiện NỬA TRÊN.
  - Dùng viewBox `20 -4 160 160` và cắt tràn: thấy miệng ống, mặt, vai.
  - Ở 28 px nửa trên vẫn rõ mắt, miệng và màu dung dịch; toàn thân 28 px chỉ còn đọc được dáng.

## Kế hoạch build (sau khi thầy chốt — CHƯA sửa `src/`)

1. **`src/components/linh-vat/mol-dong.ts`:**
   - thay `svgMol` bằng bộ vẽ ống nghiệm (chép từ `<script>` của `mol-v2.html`: `TU`, `NA`, `mat`, `mi`, `TAY`, `DANG`, `SOI`);
   - giữ nguyên `VIEWBOX_MOL = '0 -26 200 230'`, kiểu `Lua`, `taoLua`, `datCap`, `noi`, `cham`, `MOL_DANG_SONG` ⇒ `<Bi …>` và mọi chỗ gọi không đổi;
   - `MatMol` thêm `nguong | me | nhay` nếu thầy duyệt;
   - map trạng thái cũ ⇒ mặt mới: `combo`/`cuoi` → khen, `covu` → vui nhảy (hoặc khen), `choc` → ngạc nhiên, cấp 2–5 → dỗi / bực / cáu / rất cáu;
   - **id duy nhất mỗi hình:** gradient + clip mí phải khác hậu tố. Bản vẽ đã gặp lỗi trùng `…b` ⇒ mí phải lộ khối trắng.
2. **`src/styles/mol.css`:**
   - bảng `--mol-*` phương án A (chỉ `color-mix` token sẵn có, không mã màu thô), lớp `stop-color` cho gradient, nét tay;
   - chuyển động CSS (không rAF):
     - thở nhẹ, chớp mắt, bọt nổi (giận ⇒ sôi nhanh);
     - nhảy khi khen, vẫy tay quanh vai khi chào, lắc khi vui nhảy, run khi rất cáu, hơi nước bốc khỏi miệng ống;
   - giảm chuyển động / máy yếu ⇒ đứng yên.
3. **Cỡ nhỏ:**
   - `Bi.tsx` gắn `data-nho` khi `size < 48` ⇒ viewBox nửa trên + `overflow: hidden`;
   - vòng Mục tiêu dùng cùng khung cắt;
   - `datIconTabMol` đổi vùng cắt `drawImage` theo khung nửa trên (x 20…180, y −4…156).
4. **Cổng phải qua:**
   - test: `tests/mol-0111.test.tsx`, `tests/bi-2610.test.tsx`, `tests/lua-cap-ve-3110.test.ts`;
   - `npm run check:mau`, `npm run kiem:mau-giu`, `npm run build && npm run kiem:toc-do`;
   - số nút SVG: bản vẽ đo được 53–76 nút mỗi hình (kể cả 5 gradient ≈ 20 nút). Mol cũ 26–46, cú Lửa ~120. Giữ ≤ 80 nút, không filter. Nếu cần nhẹ hơn: gộp gradient dùng chung một `<defs>` cho cả trang;
   - chạy tác tử `toc-do` sau gộp.
