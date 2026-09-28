# Bản vẽ ngang app học sinh (28/09/2026) — máy tính + xoay ngang

Chỉ là BẢN VẼ để thầy duyệt, chưa sửa mã app. Mỗi màn: `<tên>.dc.html` (tự chứa, chỉ gọi Google Fonts) + ảnh `<tên>.jpg` chụp Chromium 1440×900. Cùng phong cách bản vẽ dọc `docs/ban-ve-game-hoa-2-2709/`: nền biển đêm `#071229`, vàng `#FFC940`, ngọc `#37E2D5`, kính mờ, Baloo 2 (tiêu đề) + Be Vietnam Pro (chữ thân).

## Danh sách (14 tệp)
Sảnh & học: `Ngang-Sanh` · `Ngang-CauDaLam` · `Ngang-XongHomNay`
Đảo thần thú: `Ngang-DaoBanDo` · `Ngang-DaoAi` · `Ngang-DaoLoiGiai` · `Ngang-DaoTrum` (ải 6, trả lời ngắn + phím số) · `Ngang-DaoXong`
Đoàn Hộ Tống: `Ngang-DoanSanh` · `Ngang-DoanTran` · `Ngang-DoanLoiGiai` · `Ngang-DoanTrum` (4 ý đúng–sai, giáp 4 mảnh) · `Ngang-DoanKetChang` · `Ngang-TungChuong-TiepSuc` (2 tấm phủ, 2 khung 1440×900 chồng dọc, ảnh 1440×1800)

## Nguyên tắc bố cục ngang
1. **Lưới 12 cột**, lề 32 px, khe 24 px. Thanh trên cao 64 px (top 16), vùng nội dung từ 96 px tới cách đáy 54 px.
2. **Hai cột 7/5**: cột 7 cho thứ cần NHÌN hoặc ĐỌC nhiều nhất (bản đồ, chiến trường, đề dài/4 ý đúng–sai); cột 5 cho điều khiển + tiến độ, nút chính luôn ở ĐÁY cột 5 (ngón cái phải, chuột dễ tới). Câu 4 phương án ngắn → đề ở cột 5, chiến trường cột 7 (`DoanTran`); đề 4 ý dài → đề cột 7 (`DaoAi`, `DoanTrum`).
3. **Màn chơi không cuộn trong 900 px**: mọi màn game vừa khít 1440×900 (đã đo bằng Chromium: 0 phần tử tràn). Chỉ `CauDaLam` (không phải màn chơi) cho cột chi tiết tự cuộn.
4. **Lời giải đứng yên, không đồng hồ**: khối chuẩn LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓✗, nằm cả trong cột 5; nút TIẾP TỤC / ĐÁNH TIẾP ngay dưới.
5. Một nút chính mỗi màn; đích chạm ≥ 44 px (đo: 0 nút nhỏ hơn); chữ thân ≥ 14 px, đề 19–20 px; con số nào cũng có nhãn.
6. Tấm phủ ngang = **tấm bên phải** rộng 5 cột (Tiếp sức) hoặc phủ toàn màn có cột 5 tóm tắt (Tung chưởng), không dùng tấm trượt từ đáy.

## Điểm ngắt
- `< 700 px` ngang, hoặc điện thoại dọc: giữ bản dọc hiện có.
- Điện thoại xoay ngang `≥ 700 px` và chiều cao `≤ 500 px`: bố cục 7/5 nhưng thu tỉ lệ (`zoom`/`scale` theo chiều cao, khung chuẩn 1440×900), ẩn dòng phụ.
- `≥ 1024 px` (máy tính bảng ngang, máy tính): bố cục 7/5 đầy đủ như bản vẽ; `≥ 1600 px` giữ khung tối đa 1440 ở giữa.
- Gợi ý CSS: `@media (orientation: landscape) and (min-width: 700px)` + `(min-width: 1024px)`.

## Chuyển từ dọc sang ngang
- Tấm đáy của bản dọc (thẻ chiến dịch, nút chính) → **cột 5**; phần hình (bản đồ, trận) → **cột 7** cao hết vùng nội dung.
- Thanh trên dọc (thần thú, Thể lực, Chuỗi ngày, lối tắt) → một hàng ngang; một thông tin chỉ hiện một chỗ.
- Danh sách + chi tiết (Câu đã làm): dọc là hai trang, ngang là **danh sách trái – chi tiết phải** cùng lúc.
- Phương án trắc nghiệm giữ một cột (dễ đọc); hàng đúng–sai có nút Đúng/Sai 104×56 ở mép phải.
- Giữ nguyên chữ, dữ liệu và luồng; chỉ đổi sắp đặt. Không thêm luật chơi mới.
