# Bản vẽ · Các bước buổi dạy sau điểm danh · 07/11/2026 (CHỜ THẦY DUYỆT)

Thầy dặn (07/11):
- «Điểm danh xong bấm Xong thì hiện các tuỳ chọn: chiếu lên bảng, dạy học, kiểm tra đầu giờ, chữa câu khó tính toán. Tôi chọn xong thì hiện nút Chiếu lên bảng. Làm theo từng bước cho thống nhất, dễ dùng.»
- «Load lại thì phải giữ nguyên, đồng bộ mọi thiết bị, cho đến khi tôi bấm Kết thúc buổi học.»
- «Bấm chuyển câu thì mọi thứ tự động. Thời gian tự tính cho từng câu, tối đa 3 phút. Tự gửi xuống máy học sinh.»

Đây chỉ là bản vẽ. Chưa sửa `src/`. Số trong ảnh là số GIẢ. Màu chỉ dùng biến `--gvm-*` của `src/styles/tokens.css`, cả sáng lẫn tối.

- Ảnh: `anh/`, 6 màn × 3 khổ × sáng/tối = 36 ảnh, cộng `anh/tong-quan.jpg`.
- Chụp lại: `node docs/ban-ve-buoc-day-0711/chup.mjs`.
- Mở một màn: `nguyen-mau.html?man=1..6&toi=1`.
- Soát bằng máy: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px.

| Màn | Ảnh | Nội dung |
|---|---|---|
| 1 | `01-diem-danh-*` | Mã + QR, «Chiếu mã lên bảng». Đếm 41/68. Lưới tên gọi (Học, Nguyên…) của em vừa vào và em chưa vào. Thanh dưới có nút «Xong điểm danh». |
| 2 | `02-chon-hoat-dong-*` | «Hôm nay làm gì?»: 4 thẻ lớn, mỗi thẻ có mô tả một dòng và số câu sẵn có. Hoạt động đã làm có dấu «✓ Đã làm 08:15». |
| 3 | `03-chon-cau-*` | Câu app chọn sẵn, bỏ tích được. Mỗi câu có số em sai và đồng hồ tự tính. Khung tóm tắt có nút lớn «Chiếu lên bảng». |
| 4 | `04-dang-chieu-*` | Máy thầy khi đang chiếu: vòng giờ, «Câu 3/8», số máy đã nhận và số em đã gửi, chấm các câu. Nút chính «Câu tiếp →», nút phụ «← Câu trước» và «Về chọn hoạt động». |
| 5 | `05-man-chieu-*` | Minh hoạ màn chiếu khi bấm Câu tiếp: báo «Câu 4 đã gửi xuống 41 máy em», đồng hồ «tự tính · tối đa 3:00». Phím → cũng là Câu tiếp. |
| 6 | `06-ket-thuc-buoi-*` | Hộp xác nhận «Kết thúc buổi học?». Đây là chỗ DUY NHẤT để kết thúc buổi. |

## 1. Mục tiêu + ai dùng
- **Ai dùng:** thầy, trên máy tính nối máy chiếu, máy tính bảng hoặc điện thoại.
- **Đi một đường thẳng 4 bước:** Điểm danh → Chọn hoạt động → Chọn câu → Chiếu lên bảng. Trên lớp, thầy chỉ còn một việc là bấm «Câu tiếp».
- **Thanh bước luôn hiện:** cho biết đang ở bước nào. Bấm bước đã qua để quay lại.
- **Một chỗ kết thúc:** nút «Kết thúc buổi học» trên đầu trang. Bỏ phím X «Kết thúc buổi chơi» trên bảng chiếu.

## 2. Bố cục
- **Máy tính 1440:**
  - Đầu trang: tên buổi, dải «Đồng bộ mọi máy», nút «Kết thúc buổi học».
  - Dưới đầu trang là thước 4 bước.
  - Màn 3 và 4 chia hai cột: nội dung bên trái; bên phải là tóm tắt hoặc phần «app tự làm».
  - Nút chính nằm ở thanh dưới dính (màn 1, 2) hoặc ở khung tóm tắt (màn 3, 4).
- **Máy tính bảng 1024:** một cột. Khung tóm tắt nằm dưới danh sách.
- **Điện thoại 390:**
  - Thước bước chỉ hiện tên ngắn, không có dòng phụ.
  - 4 thẻ hoạt động xếp một cột.
  - «Câu tiếp» là nút cao 72 px, nằm ngay dưới vòng giờ.

## 3. Trạng thái
- **Đang tải:** hiện khung xương của bước đang mở.
- **Chưa có buổi:** chỉ hiện bước 1, nút «Bắt đầu điểm danh» (như hiện nay).
- **Rỗng:** hoạt động không có câu thì thẻ ghi «Chưa có câu» và không chọn được.
- **Mất mạng:** dải đồng bộ chuyển màu hổ phách: «Mất kết nối · đang thử lại». Mọi nút giữ nguyên. Lệnh «Câu tiếp» xếp chờ, có mạng thì gửi.
- **Đang chiếu:** chấm đỏ «ĐANG CHIẾU».
- **Hết câu:** «Câu tiếp» đổi thành «Xong · về chọn hoạt động».
- **Đã kết thúc buổi:** mọi máy cùng về màn chưa mở buổi.

## 4. Dữ liệu
- **Buổi + có mặt:** `/gv/buoi-hoc` (`dang-mo`, `xem`, `dong`), đã có.
- **Đồng bộ mọi máy:** CẦN THÊM trạng thái buổi trên máy chủ, cột chỉ-thêm `buoi_hoc.tien_trinh` (JSON):
  - nội dung: `{ buoc, hoatDong, dsQid, chiSo, dangChieu }`;
  - mỗi máy đọc kèm nhịp `xem` 5 giây đang có, không thêm lệnh;
  - thay cho localStorage `ddh.hanhTrinh.buoc.*` và `ddh.dayHoc.*` (hiện chỉ lưu từng máy).
- **Số câu sẵn có trên thẻ:**
  - Gọi lên bảng / Dạy học: kế hoạch dạy học đang có (`DayHocLenBang`).
  - Kiểm tra đầu giờ: `/gv/dau-gio`.
  - Chữa câu khó: `goiChuaThay('hang-chieu')`.
- **Đồng hồ:** `thoiGianDayHoc` (`src/lib/html-may-chieu.ts`), kẹp 60–180 giây; máy chủ kẹp lại lần nữa.
- **Câu tiếp:** gửi `/gv/bpu/luot`. Phòng tự mở đáp án câu cũ, gửi câu mới xuống máy em có mặt.

## 5. Ngoại lệ
- **Bấm Câu tiếp liên tục:** khoá 1 giây; lần sau chỉ chạy khi lần trước đã xong.
- **Câu bị giữ cho ca kiểm tra, hoặc lớp có ca mở:** không gửi xuống máy; bảng báo một dòng; thầy vẫn chiếu và chữa.
- **Câu tự luận:** không chấm, không đồng hồ, em bấm «Em làm xong».
- **Hai máy thầy cùng bấm:** máy chủ nhận theo thứ tự; mọi máy thấy cùng `chiSo`.
- **Tải lại giữa câu:** về đúng bước 4, đúng câu, đồng hồ chạy tiếp theo giờ máy chủ.
- **Đề dài hoặc có hình:** màn chiếu cuộn trong khung đề; nút Câu tiếp không bị che.
- **Máy yếu:** tắt vòng quay và hạt.

## 6. Chi phí máy chủ
- **Ghi:** mỗi lần đổi bước hoặc bấm Câu tiếp ghi `tien_trinh` một lần, cùng lô với lệnh đang có.
- **Đọc:** đi kèm nhịp `xem` sẵn có, không thêm vòng chờ nối tiếp.
- **Đáp án:** chỉ nằm trong phòng (Durable Object), không xuống máy em trước khi mở. Câu thi và câu kiểm tra không đi đường này.

## 7. Nghiệm thu đo bằng máy
- **Test vitest mới:**
  - `buoc-day-dong-bo-0711`: tải lại / máy khác giữ đúng bước và câu;
  - `bpu-tu-dong-0711`: Câu tiếp ⇒ mở đáp án câu cũ + gửi câu mới, giờ 60–180 giây;
  - `bpu-luoi-ten-0711`: lưới tên 30 / 48 / 68 / 90 em không chồng thanh phím.
- **Cổng:** `npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0.
- **Ảnh Chromium thật:** 0 lỗi trang, 0 tràn, 0 đích chạm < 44 px.
