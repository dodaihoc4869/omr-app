# Màn thi đứng máy khi ngồi yên — sửa gốc (28/09)

Nguồn: báo cáo soát FE 28/09 mục 1–2, 6. Nhánh `toi-uu-man-thi`.

## Nguyên nhân gốc
- Đồng hồ 1 giây gọi `setRemaining` ở GỐC `ExamTakeScreen` ⇒ cả đề vẽ lại mỗi giây. Mỗi `ChemFormula` chạy lại `katex.renderToString` (~260 công thức/đề).
- Lỗi tương tự: `LuyenDeChuan` (`setSeconds` 1 s ở gốc), `StudentPortalScreen` (`setGiayConLaiMom` 1 s ⇒ cả cổng học sinh vẽ lại suốt 2 tiếng làm bài gia đình giao).

## Đã sửa
1. **Kho giờ** `src/lib/dong-ho-thi.ts`: giữ giây còn lại, 1 nhịp/giây (chỉ chạy khi có người nghe). Giờ lấy lại từ `gioMayChu()` mỗi nhịp, trừ vào mốc hết giờ tuyệt đối (không cộng dồn).
   - Nút lá (`SoDongHo`, `NhanNopCho`, `OGioSong` ở bố cục ngang, `DongHoLuyen`, `DemGioMom`) nghe **giây**.
   - Gốc màn chỉ nghe **mốc**: thường / gấp ≤ 5' / cuối ≤ 1' / hết. Gốc chỉ vẽ lại khi qua mốc: rung + đổi màu khi còn 5 phút, mở khoá nút nộp "1 phút cuối", tự nộp khi hết giờ.
   - Bố cục ngang giữ đổi màu 10/5 phút (`mucDongHo`) trong nút lá.
   - Lưu tạm và báo trạng thái không đổi.
2. **`ChemText` + `ChemFormula` bọc `memo`** (props đều là chuỗi ⇒ so nông là đủ). Kết quả KaTeX được nhớ kiểu LRU 2000 mục theo `(t, latex gốc)`.
   - HTML khớp từng ký tự với bản cũ trên 340 dòng mẫu: đề thật `de-thpt-2026-ma100.txt` và 32 ca khó (sơ đồ có điều kiện, ion, chỉ số, `\ce`, `$…$`, phương trình dài, lỗi cú pháp).
   - Mẫu chụp HTML cũ: `tests/fixtures/chem-html-truoc-2809.json`.
3. **`content-visibility: auto` — THỬ RỒI BỎ.**
   - Lợi thêm nhỏ: ngồi yên ×4 từ 1,2 s còn 0,75 s/10 s; vào đề từ ~370 ms còn ~230 ms.
   - Nhưng làm hỏng cuộn tới câu: nhảy xa lần đầu (câu 1 → câu 25) dừng lệch **2 537 px** (thẻ chưa hiện dùng cỡ ước lượng). Bản không dùng thì trúng 72 px, tức ngay dưới thanh trên.
   - Không áp dụng. "Câu đã làm" (`hoa2/CauDaLam.tsx`) cũng không áp dụng: cùng rủi ro cuộn, và tệp thuộc làn Sảnh HS.

## Số đo (Chromium 1194, `vite preview`, dữ liệu giả `mock-thi.mjs` 28 câu / 260 KaTeX / ~10 900 nút; 3 lượt mỗi ô, số là khoảng)
| Chỉ số | Trước (origin/main 87ce9bb) | Sau |
|---|---|---|
| Dọc 390×844 · ngồi yên 10 s, CPU ×4 · bận (TaskDuration) | 7,96–9,17 s | **1,13–1,19 s** |
| … tổng tác vụ dài (> 50 ms) / dài nhất | 7,4–8,3 s / 701–871 ms | **0,11–0,34 s / 58–96 ms** |
| Dọc · chấm 12 đáp án (CPU ×1) · bận | 4,8–5,6 s | **1,02–1,15 s** |
| … tác vụ dài | 34–39 khối / 3,9–4,8 s | **1 khối / 91–139 ms** |
| Ngang 1280×800 · ngồi yên 10 s, CPU ×4 · bận | 8,1–9,2 s | **1,29–1,37 s** |
| … tác vụ dài / dài nhất | 7,6–8,7 s / 605–702 ms | **0,40–0,56 s / 89–152 ms** |
| Ngang · chấm 12 đáp án · tác vụ dài | 33–38 khối / 4,5–5,4 s | **4 khối / 0,57–0,65 s** |
| Cuộn tới câu 25/10/3/18 (đỉnh thẻ, px) | 72 | 72 (không đổi) |

Còn lại (ngoài phạm vi):
- Ở bố cục ngang, mỗi lần chọn đáp án vẫn vẽ lại thân `LamBaiNgang` và mọi thẻ câu, vì mảng `cau` được dựng mới mỗi lần. Hướng sửa: `memo` cho `TheCau` và giữ ổn định callback.
- `DanhSachNhiemVu` vẫn có vòng 1 s (bảng nhiệm vụ, làn Sảnh HS).

Kịch bản đo: `scratchpad/do-thi/probe*.mjs` (bản sao `toi-uu/probe-thi-thu.mjs` + đo TaskDuration qua CDP).

## Kiểm
- `tests/man-thi-dong-ho-2809.test.tsx` (14 test), gồm:
  - kho giờ với fake timers: mốc, giờ máy chủ, tắt nhịp;
  - đếm lượt vẽ: gốc vẽ 1 lần trong 20 s, chỉ vẽ lại khi qua mốc 5'/1'/hết, tự nộp;
  - bố cục ngang 10:05 → vàng → đỏ, thân không vẽ lại trong 305 s;
  - HTML công thức khớp y hệt; memo (KaTeX không chạy lại);
  - LuyenDeChuan hết giờ tự nộp.
- Khoá nguồn cũ cập nhật theo tên mới: `man-thi-tren-m3-1909`, `them-phut-1909`, `nhip-bang-2109` (xếp loại `dong-ho-thi.ts`).
