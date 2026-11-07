# Bố cục màn làm câu XOAY NGANG (điện thoại, cao ≤ 500 px) — thầy chốt 07/11

Thầy: «Phần đề xoay ngang làm lại bố cục cho tinh tế đẹp mắt chuyên nghiệp» ⇒ bản vẽ `01`–`03` ⇒ «Chốt tất build và đẩy đi».

Luật sửa tại chỗ trong `src/styles/trong-chang-ngang.css`, khối `@media (orientation: landscape) and (min-width: 640px) and (max-height: 500px)`:
- **Hai cột:** đều nhau `1fr | minmax(300px, 1fr)`, khe 24 px.
- **Đầu cột đề gọn:** dòng lệnh 15 px, chữ phụ. Lời giám thị NỔI (absolute), không giữ khoảng trống 40 px trên đề. Lúc giám thị nói, hàng nhãn «Trắc nghiệm · chương» ẩn đi để không bị đè.
- **Giám thị nhỏ:** 72 px. Chữ đề 16 px, dòng 1,5.
- **Phương án gọn:** cao tối thiểu 50 px, chữ 16 px, ô chữ cái 34 px, khe 8 px. Thường đủ 4 ô + KIỂM TRA trong một khung.
- **KIỂM TRA:** rộng đúng cột trả lời, cùng mép với phương án (chừa rãnh thanh cuộn 8 px).
- **Không đổi:** điện thoại dọc, máy gập / máy tính (cao > 500), dải kết quả.

Nghiệm thu:
- Cổng đạt: `kiem:co-tep`, `kiem:mau-giu`, `check:mau`, `kiem:toc-do` (bằng mốc), `kiem-sw`.
- 9 tệp test bố cục ngang / làm câu đạt.
- Ảnh soát bản dựng thật: `04`.
