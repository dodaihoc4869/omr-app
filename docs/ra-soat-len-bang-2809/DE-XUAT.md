# Rà soát màn chiếu "Gọi lên bảng" — 28/09/2026

Chỉ đọc + chụp, KHÔNG sửa mã app. Bản chạy: `main` @ d56a32d. Tờ chiếu dựng thật bằng `taoHtmlMayChieu` (esbuild) rồi mở trong Chromium 1194.
Dữ liệu mẫu: Câu 3 (Phần I, có công thức + hình 640×300), Câu 17 (Phần II, 4 ý dài), Câu 22 (Phần III, lời giải 6 bước).

Ảnh (JPG ≤ 150 KB, cùng thư mục):
- `1920-dot1-de.jpg` — Phần I, 2/3 bảng, trước khi gọi em.
- `1920-dot1-loi-giai.jpg` — cùng đợt, đã bấm "Hiện lời giải".
- `1920-dot2-de.jpg` — Phần II rơi xuống bậc 5 (toàn bảng) kèm cảnh báo "quá dài".
- `1920-dot2-len-bang.jpg` — Phần II sau khi bấm "Lên bảng": thẻ tên đè lên nút lời giải.
- `1366-dot1-de.jpg` — Phần I ở 1366×768: phương án chia 2 cột, phương trình bị ngắt dòng.
- `1366-dot3-loi-giai.jpg` — Phần III, lời giải 6 bước ở 1366.

## (a) Luồng và thuật toán hiển thị hiện tại

1. App thầy `GoiLenBangScreen.tsx` gồm nút "Chiếu lên bảng" (dòng 2052/2149), `moMayChieu` (dòng 1040). Nút này dựng `OBang[]`, gọi `taoHtmlMayChieu` (dòng 1187)
   rồi mở HTML trong `KhungXemPhieu` (dòng 2352). Các câu chỉ đọc đáp án được gom thành trang đáp án, mỗi trang 12 câu.
2. `html-may-chieu.ts` xếp ĐỢT: có `bacUoc` thì chỉ ghép đôi hai câu bậc 1 (tìm bạn trong 6 câu kế tiếp); không có thì đoán bằng `laCauDai` (đếm ký tự).
   Các đợt nằm trên một ray lật ngang (`scroll-snap`). Chuyển đợt bằng ◂ ▸, phím ←/→ và PageUp/PageDown.
3. `bo-cuc-to-chieu.ts` (`jsBoCuc`) ĐO THẬT từng đợt và leo bậc: 1 đôi ½ bảng → 2 đơn 2/3 + 1/3 → 3 chia 2 cột phương án, hình co tới 40%
   → **5 toàn bảng**. Chú thích đầu tệp còn ghi bậc 4 "co chữ tới sàn 24 px", nhưng mã đã bỏ bậc 4 (dòng 114). Tới bậc 5 thì trả luôn `vua:false`, không đo thêm.
4. Cỡ chữ: `--mc-co` = 30/1280 × bề ngang × `--mc-scale` (Cài đặt: 0.85/1/1.2/1.4), ra 45 px ở 1920 và 32 px ở 1366. Phương án = 0.93 × cỡ chữ đề.
   Có 4 nền giấy (`data-projector`), lưu trong localStorage.
5. Lời giải (`oGiaiHtml`) là lớp PHỦ `position:absolute; inset:0` đè lên vùng đề (dòng 143). `vuaLoiGiai` co chữ từng 1 px xuống sàn, hết chỗ thì cuộn.
   Mỗi lần bấm là mở CẢ khối: đáp án, cốt lõi, lý do từng ý, các bước.
6. Pha: CHỜ THẦY GỌI → bấm "Lên bảng" (màn gọi tên, thẻ tên em + thần thú) → ĐANG CHỮA. Nút Đạt/Không đạt ghi về app thầy qua `to-chieu-cau-noi.ts`.
7. Công thức KHÔNG dùng KaTeX: `chuHtml` tách chỉ số thành `<sub>/<sup>`, mũi tên vẽ bằng viền CSS (`html-phieu.ts` 817–823).

Số đo (1920×1080): đề 45 px, phương án 41.9 px, chỉ số 32.4 px, lời giải P.III 39 px. Thanh dưới "Đợt 1/3" chỉ 17 px.
Mũi tên rộng 20 px, nét 1.4 px, đầu 4 px. 40 câu dựng + đo xong trong 0.62 s (40 đợt, 3 382 nút DOM), nên hiệu năng **không** phải vấn đề.

## (b) Hạn chế tìm thấy

| # | Hạn chế | Bằng chứng | Mức |
|---|---|---|---|
| H1 | Câu Phần II 4 ý dài bị đẩy lên bậc 5 (toàn bảng), **mất hẳn 1/3 bảng cho em làm**, dù co chữ 45→~36 px thì vừa 2/3. Nguyên nhân: bậc 4 "co chữ" đã bị bỏ | `bo-cuc-to-chieu.ts:110-117`; `1920-dot2-de.jpg`, `1920-dot2-len-bang.jpg` | nặng |
| H2 | Ở bậc 5, sau khi bấm "Lên bảng", thẻ tên **đè lên nút "Hiện lời giải"**: `elementFromPoint` ở tâm nút trả về `.mc-ten`. Thầy không bấm được lời giải, mà cũng không có phím tắt nào thay | `bo-cuc-to-chieu.ts:169` (nút và thẻ tên cùng `grid-row:1`); `1920-dot2-len-bang.jpg` | nặng |
| H3 | Lời giải PHỦ KÍN đề: mở ra là mất đề, mất phương án và hình, không đối chiếu được "đề ↔ bước giải" | `bo-cuc-to-chieu.ts:143-144`; `1920-dot1-loi-giai.jpg` | nặng |
| H4 | Lời giải mở một lần ra hết (đáp án + lý do 4 ý + 6 bước). Không hiện được từng bước hay từng ý a/b/c/d, trong khi chữa bài cần dẫn từng bước | `html-may-chieu.ts:867-879`; `1366-dot3-loi-giai.jpg` | nặng |
| H5 | Cảnh báo "Câu này quá dài để vừa bảng" **báo oan**: bậc 5 luôn trả `vua:false` mà không đo. Thực tế vùng đề vừa khít (scrollHeight 900 = clientHeight 900) | `bo-cuc-to-chieu.ts:117,349`; thanh dưới của `1920-dot2-de.jpg` | vừa |
| H6 | Bậc 3 chia 2 cột phương án làm **ngắt phương trình giữa chừng** ("… + CO₂ +" rồi xuống dòng "H₂O") ở 1366 | `bo-cuc-to-chieu.ts:160`; `1366-dot1-de.jpg` | vừa |
| H7 | Mũi tên phản ứng quá nhỏ và dính chữ (nét 1.4 px, đầu 4 px, không theo cỡ chữ 45 px, không có khoảng cách hai bên). Nhìn từ cuối lớp gần như không thấy | `html-phieu.ts:822-823`; `1920-dot1-de.jpg` (A–D) | vừa |
| H8 | Hình giữ cỡ gốc (640×300 trên vùng 1240 px), trần 30vh, không bấm phóng được. Chữ trong hình ~20 px, nhỏ hơn nửa chữ đề | CSS `max-height: calc(30vh*…)` `bo-cuc-to-chieu.ts:138`; `1920-dot1-de.jpg` | vừa |
| H9 | Không nhảy nhanh tới đợt/câu: chỉ ← →. Buổi 40 đợt muốn tới đợt 25 phải bấm 24 lần. Không có lưới tổng quan | `html-may-chieu.ts:840-845` | vừa |
| H10 | Không có phím tắt cho Lên bảng / Hiện lời giải / Đạt; bấm chuột vào nút 12–22 px trên máy chiếu | `html-may-chieu.ts:840-845` (chỉ Escape, mũi tên, Page) | vừa |
| H11 | Không có lớp bút để khoanh hay gạch lên đề chiếu (không có canvas/pointer nào trong tờ) | grep `canvas|pointer` trong `html-may-chieu.ts` = 0 | vừa |
| H12 | Không hiện tỉ lệ lớp chọn A/B/C/D hay đúng/sai từng ý. `tiLeLopSai` chỉ dùng để tính giờ | `html-may-chieu.ts:52-54,319-328` | vừa |
| H13 | Chữ lời giải nhỏ hơn chữ đề (39 so với 45 px ở 1920, 25 so với 32 px ở 1366) dù vẫn còn trống ~90 px ở đáy. Do `padding-bottom: clamp(56px,5.6vw,92px)` luôn giữ chỗ cho nút | `giao-dien-to-chieu.ts:137`; `1366-dot3-loi-giai.jpg` | nhẹ |
| H14 | Thanh điều khiển chữ 17 px, số đợt màu nhạt, khó đọc từ xa (với thầy đứng ở bảng) | `1920-*.jpg` đáy | nhẹ |
| H15 | Thẻ tên khi em chưa có thần thú: dòng "lần lên bảng thứ 1" thụt lệch ~130 px so với tên | `1920-dot2-len-bang.jpg` | nhẹ |
| H16 | Chú thích đầu `bo-cuc-to-chieu.ts` (bậc 4, đáy 18 px, "không bao giờ cuộn") mâu thuẫn với mã (bỏ bậc 4, bậc 5 `overflow-y:auto`), dễ khiến phiên sau sửa sai | `bo-cuc-to-chieu.ts:9-15` so với `110-117,170` | nhẹ |

Không thấy: chỉ số bị cắt, ảnh vỡ, tràn ngang, hay chậm khi nhiều câu (40 câu dựng 0.62 s). Tương phản nền giấy ấm và chữ đậm đạt yêu cầu.

## (c) Đề xuất, xếp ưu tiên

| Ưu tiên | Cho | Đề xuất | Cỡ | Nghiệm thu đo được |
|---|---|---|---|---|
| P1 | H1, H5, H16 | Khôi phục **bậc 4**: co chữ 1 px/lần từ cỡ chuẩn xuống sàn (24 px@1920) ở bố cục 2/3 trước khi lên bậc 5. Bậc 5 phải ĐO thật và chỉ cảnh báo khi đáy 18 px vẫn tràn. Sửa lại chú thích đầu tệp | S | Câu 17 mẫu ở 1920: `data-bac` ≤ 4, cột làm bài rộng ≥ 30% bảng, không có ghi chú "quá dài"; test `bo-cuc-to-chieu-1909` thêm ca P.II 4 ý |
| P2 | H2 | Tách hàng nút lời giải khỏi hàng thẻ tên ở bậc 5 (nút xuống đáy vùng đề, hoặc `z-index` cao hơn `.mc-em`) | S | Mọi bậc × pha cho/goi/chua: `elementFromPoint(tâm nút)` là chính nút (test Playwright) |
| P3 | H3 | Lời giải thành **cột cạnh đề**: đề thu về 1/2 (hoặc chỉ giữ đề + hình ở cột trái), lời giải ở cột phải hoặc chiếm cột làm bài 1/3. Giữ chế độ phủ làm tuỳ chọn | M | Khi mở lời giải, ≥ 80% chữ đề vẫn hiện (đo diện tích `.mc-de` trong khung); chữ đề ≥ 24 px@1920 |
| P4 | H4, H10 | **Hiện dần**: phím Space / → trong đợt mở từng mục (đáp án → cốt lõi → ý a, b, c, d → bước 1..n), bước cũ mờ dần. Phím tắt: `L` lên bảng, `G` lời giải, `D` đạt, số `1–9` chọn ô | M | Câu P.III mẫu: 8 lần Space mở đủ 6 bước và kết quả; không cần chuột cho cả vòng một đợt |
| P5 | H9 | Phím `G`/`Home`/`End` và **lưới tổng quan** (Tab): thẻ nhỏ từng đợt (số câu, tên em, trạng thái đã chữa). Gõ số rồi Enter để nhảy | S | Từ đợt 1 tới đợt 25/40 trong ≤ 3 thao tác |
| P6 | H7, H6 | Mũi tên theo `em`: nét `0.06em`, đầu `0.18em`, rộng tối thiểu `1.6em`, lề `0.2em`. Bậc 3: phương án là phương trình thì giữ 1 cột, hoặc `white-space:nowrap` từng vế, co chữ thay vì chia cột | S | Ở 45 px, mũi tên rộng ≥ 70 px, nét ≥ 2.5 px; 1366 không phương án nào ngắt giữa hai vế (đo số dòng của `.mc-pa-chu` ≤ số dòng tự nhiên) |
| P7 | H8 | Hình phóng tới trần vùng trống (không giới hạn 30vh khi còn chỗ, `min-width` 50% vùng đề nếu hình có chữ). Bấm hình thì phóng toàn màn, Esc để đóng | S | Hình mẫu ≥ 900 px bề ngang ở 1920 mà vùng đề không tràn; chữ trong hình ≥ 28 px hiệu dụng |
| P8 | H12 | Dải **thống kê lớp** ẩn/hiện bằng phím `T`: % chọn A–D (P.I), % đúng từng ý (P.II), 3 đáp số sai hay gặp (P.III). Lấy từ bài làm ca đã có, chỉ hiện số gộp, không tên em | M | Có dữ liệu thì dải hiện ≤ 1 dòng, cao ≤ 8% bảng, không đổi `data-bac` |
| P9 | H11 | Lớp bút vẽ (canvas phủ, phím `B`): 3 màu, tẩy, xoá khi đổi đợt; dùng được với bút cảm ứng hoặc chuột | M | Vẽ được trên cả 5 bậc, không chặn nút; đổi đợt thì sạch |
| P10 | H13, H14, H15 | Bỏ khoảng giữ chỗ cho nút khi nút không đè chữ. Chữ lời giải không nhỏ hơn đề khi còn chỗ. Thanh dưới ≥ 22 px@1920, số đợt đậm. Căn "lần lên bảng" thẳng cột với tên khi không có thú | S | Lời giải P.III mẫu = cỡ đề (45 px@1920); thanh dưới ≥ 22 px; lệch cột tên ≤ 4 px |

Thứ tự làm gợi ý: P1 + P2 (sửa lỗi, nửa ngày) → P6 + P10 (đánh bóng) → P4 + P5 (điều khiển không chuột) → P3 → P7 → P8 → P9.
Cách tái hiện: kịch bản dựng + chụp nằm ngoài repo (thư mục nháp của phiên). Dựng lại bằng esbuild bundle `taoHtmlMayChieu` với 3 câu mẫu ở trên, rồi mở bằng Playwright `executablePath /opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
