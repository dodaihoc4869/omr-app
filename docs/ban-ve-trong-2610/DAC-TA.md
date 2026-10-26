# Đặc tả giao diện «Trong» cho app học sinh và app thầy (26/10)

Thầy yêu cầu ngày 26/10:

> «dùng toàn bộ tài năng và thẩm mỹ … học hỏi tối đa các app giáo dục … tạo ra một giao diện đẹp nhất, thân thiện nhất, khoa học nhất cho app hs và gv … tối ưu lại hiển thị bố cục … gọn gàng đơn giản tinh tế … Cho tôi xem bản vẽ trước khi chốt.»

Bản vẽ nằm trong `docs/ban-ve-trong-2610/`:
- tấm ghép từng màn ở `bang/`: máy tính, điện thoại sáng, điện thoại tối;
- ảnh đủ 3 khổ × sáng/tối ở `anh/`.

## 1. Mục tiêu và người dùng

**Học sinh** (lớp 10–12, dùng điện thoại là chính)
- Mở app là biết ngay việc tiếp theo: một khối «Hôm nay» với vòng mục tiêu câu/ngày, chặng và một nút «Học tiếp».
- Tiến bộ nhìn thấy được: chuỗi ngày, thang 4 tầng, lịch 14 ngày.
- Lúc làm bài thì màn sạch, chỉ có câu hỏi.

**Thầy** (máy tính trên lớp và ở nhà, điện thoại khi đi lại)
- Bảng điều khiển trả lời ba câu hỏi: hôm nay bao nhiêu em đã học, việc gì cần thầy làm ngay, em nào cần để ý.
- Con số nào cũng có nút đi kèm để xử lý.

**Cảm giác cần đạt:** sáng, nhẹ, gọn, đáng tin, giống một sản phẩm công nghệ tốt. Không ồn ào.

**Học từ các app tốt nhất**

| App | Học được gì |
|---|---|
| Duolingo | Một việc tiếp theo, chuỗi ngày, nút to |
| Khan Academy | Thang thành thạo (ứng với thang 4 tầng) |
| Brilliant | Màn làm bài tập trung, nhiều khoảng thở |
| Apple Fitness | Vòng mục tiêu ngày |
| Google Classroom, Linear | Bảng điều khiển gọn, số có nhãn, việc rõ ràng |

**Hệ thiết kế**
- **Phông:** một phông Be Vietnam Pro (vẽ riêng cho tiếng Việt, app đã có sẵn) ⇒ không tải thêm phông nào.
- **Nền, thẻ, bóng:** nền xám rất nhạt; thẻ trắng viền mảnh, bo 20px; bóng rất nhẹ.
- **Màu chính theo vai, lấy đúng màu logo thầy đã chốt 19/09:**
  - học sinh: xanh lá;
  - thầy: xanh dương.
- **Màu nghĩa cố định:**

  | Màu | Nghĩa |
  |---|---|
  | Xanh lá | Đúng, xong |
  | Đỏ | Sai, Lười |
  | Hổ phách | Cần để ý |
  | Chàm | Kiểm tra |
  | Vàng sao | Thành tích, chuỗi ngày |

- **Nền tối:** đủ, đã soát trên ảnh.

## 2. Bố cục

**Điện thoại dọc (390px)**
- Một cột.
- Thứ tự theo mức quan trọng: (1) việc gấp, ví dụ ca đang mở; (2) việc chính hôm nay; (3) thông tin phụ.
- Thanh dưới: học sinh có 4 mục, thầy có 5 mục. Thanh dưới nền đặc.
- Nút A.I nổi ở góc dưới phải; màn làm bài không có nút này.

**Điện thoại ngang và máy tính bảng (844px)**
- Thầy: thanh bên thu thành dải biểu tượng.
- Lưới 2 cột ở những chỗ có lợi.

**Máy tính (1440px)**
- Học sinh: thanh trên có 4 thẻ điều hướng; nội dung rộng tối đa 1160px, chia 2 cột (chính + phụ).
- Thầy: thanh bên trái 248px; ô tìm kiếm ⌘K ở đầu trang; nút chính góc phải tiêu đề.

**Luật chung:** mỗi màn đúng một nút chính (màu của app). Các hành động khác là nút thường hoặc liên kết.

## 3. Trạng thái

Giữ đủ các trạng thái app đang có, chỉ đổi cách trình bày.
- **Đang tải:** khung xương `.xuong`, cùng bố cục với nội dung thật nên không nhảy chỗ.
- **Rỗng:** khối `.rong`, một câu giải thích kèm đúng một nút.
- **Lỗi, mất mạng:** khối `.ghi-chu.sai` hoặc `.ghi-chu.chu-y` kèm nút «Thử lại»; phần đã có vẫn hiện.
- **Riêng từng tính năng:** ca mở, đã nộp, chờ công bố, khoá bài, hết hạn… Đã vẽ trong các màn tương ứng.

## 4. Dữ liệu

- KHÔNG đổi API, KHÔNG thêm lệnh máy chủ. Mọi số trên bản vẽ lấy từ trường app đang hiện, theo kiểm kê nhãn thật `KIEM-KE-HS.md` và `KIEM-KE-GV.md`.
- Bản vẽ dùng số giả nhưng khớp nhau (tổng bằng cộng các phần).
- Không bịa tính năng. Chỗ nào bản vẽ gom hoặc ẩn khối thì ghi trong chú thích `GỌN HƠN` đầu mỗi tệp.

## 5. Ngoại lệ

- **Chữ dài** (tên lớp, tên ca, tên chất): cắt «…» ở danh sách, xuống dòng đẹp ở tiêu đề.
- **Công thức hoá học:** chỉ số dưới đúng, không cắt.
- **Số lớn:** ví dụ 262 em, 8 430 câu; chữ số bằng nhau (tabular).
- **Máy yếu:** không hiệu ứng nặng; chỉ còn bóng mờ của thanh trên, và tự tắt ở chế độ máy yếu.
- **Đổi tab, mất mạng giữa bài thi:** giữ nguyên hành vi hiện tại, không đổi luồng.

## 6. Chi phí máy chủ

- 0 lệnh mới, 0 vòng chờ D1 thêm (chỉ đổi trình bày).
- Tốc độ tải: dùng lại phông Be Vietnam Pro đã có, không thêm tệp phông.
- CSS mới thay CSS cũ theo từng màn chứ không chồng thêm một lớp, nên mục tiêu tải không nặng hơn bản đang chạy. `kiem:toc-do` phải 0 đỏ, không nâng mốc.
- Đáp án vẫn không xuống máy học sinh trước khi nộp. Không đổi luồng dữ liệu.

## 7. Nghiệm thu bằng máy

- `tsc`; toàn bộ vitest, so theo tên với main (0 đỏ mới).
- `npm run build && npm run kiem:toc-do`: 0 đỏ, KHÔNG nâng mốc.
- `npm run kiem:mau-giu`: 0. Màu mới chỉ qua token. Bảng màu mới phải được thầy duyệt bằng chính bản vẽ này.
- `node scripts/kiem-sw.mjs`: 13/13.
- Ảnh Chromium mọi màn ở 3 khổ × sáng/tối: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44px.

## Cách build sau khi thầy chốt (đề xuất)

**Rút kinh nghiệm lần «Khối đậm»:** không chồng một lớp CSS đè lên toàn app. Đổi trình bày THẲNG ở từng màn, theo từng đợt nhỏ, mỗi đợt có ảnh so sánh:
1. Hệ token và khung (thanh trên, thanh dưới, thanh bên).
2. Học sinh: Hôm nay, Hành trình, Ôn & sửa, Kết quả.
3. Học sinh: làm câu, màn thi, kết quả sau nộp.
4. Thầy: Hôm nay, Ca kiểm tra, Theo dõi ca, Học sinh.
5. Các màn còn lại.

Mỗi đợt phát hành riêng và lùi riêng được.
