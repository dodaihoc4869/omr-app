# Bình Phản Ứng trùng tu: điểm danh → chọn câu → lên bảng, một luồng liền

Ngày 09/11/2026. Ảnh chụp từ giao diện thật bằng Chromium, phòng và kho câu đều là dữ liệu giả. Bảng chiếu dùng bảng màu cố định của tờ chiếu cũ, nên máy thầy để sáng hay tối thì ảnh vẫn như nhau.

**Chờ thầy duyệt.** Mã nằm trên nhánh `claude/jolly-curie-hwmquj`. Thầy chưa duyệt thì chưa đẩy lên bản sống.

## Thầy yêu cầu

1. «Khi chiếu điểm danh lên bảng, có nút xong điểm danh rồi chọn câu chiếu ngay trên màn điểm danh đó.»
2. «Khi gọi lên bảng thì lập tức chuyển về màn chiếu chuẩn cũ, bấm đạt hoặc không đạt lập tức trở về bình phản ứng; hiệu ứng thu nhỏ luôn vào màn chiếu chuẩn trước đó.»
3. «Chọn phông chữ phù hợp nhất để chiếu lên bảng.»
4. «Chuyển nút điểm danh ra màn hôm nay, bỏ hẳn thẻ hành trình. Khi bấm nút điểm danh tự động hiện ra mọi thứ.»
5. «Thu hết các nút lại, chỉ để nút gọi lên bảng thôi.»

## 1. Luồng mới

| Bước | Thầy làm | Màn chiếu | Ảnh |
|---|---|---|---|
| 1 | Bấm **Điểm danh** ở đầu màn Hôm nay | Bảng Bình Phản Ứng hiện mã, QR, ngọn lửa các đội. Có buổi mở trong 4 giờ gần nhất thì dùng tiếp; chưa có thì mở buổi mới (dạy nhiều lớp thì app hỏi lớp). | `1-diem-danh.jpg` |
| 2 | Bấm **Xong điểm danh · Chọn câu** (hoặc Enter) | Bảng chọn câu hiện ngay trên màn chiếu. Bên trái là các bài: «Câu đã chọn cho buổi này» đứng đầu, rồi các bài theo chương, có lọc theo khối và ô tìm. Bên phải là thẻ câu của bài. | `2-chon-cau.jpg` |
| 3 | Bấm một thẻ câu | Câu lên bảng và tự gửi xuống máy các em có mặt. «Câu tiếp» đi tiếp các câu sau của bài. | `3-ca-lop-lam.jpg` |
| 4 | Bấm **Gọi lên bảng** (hoặc Space) | Ô tên em được chọn bừng sáng một nhịp, rồi bảng **thu nhỏ về giữa và mờ dần**, để lộ tờ chiếu cũ nằm ngay dưới. | `4a`, `4b`, `4c` |
| 5 | (tờ cũ) | Màn «Mời em lên bảng» của tờ cũ, sau đó đề chiếm 2/3 màn, cột đen bên phải để em viết. | `5`, `6` |
| 6 | Bấm **D** (Đạt) / **K** (Chưa đạt), hoặc nút trên tờ | Bảng **phóng lại từ giữa**, ghi kết quả (đội +200 kJ khi Đạt) và mở đáp án. Nút chính đổi thành «Câu tiếp». | `7-phong-lai.jpg`, `8-mo-dap-an.jpg` |

## 2. Nút

Thanh trên mỗi màn chỉ còn **một nút chính**:

| Màn | Nút |
|---|---|
| Điểm danh | Xong điểm danh · Chọn câu |
| Cả lớp đang làm | Gọi lên bảng |
| Đã mở đáp án | Câu tiếp |

Các việc khác vẫn làm được bằng phím (bấm `?` để hiện bảng phím):

| Phím | Việc |
|---|---|
| M | Phương án |
| G | Lời giải |
| C | Chọn câu khác |
| → / ← | Câu tiếp / câu trước |
| O | Mở đáp án ngay |
| F | Toàn màn hình |
| V | Vinh danh |
| H | Ẩn tên |
| Esc | Đóng |

Cạnh tên lớp có chip «Mã 842517», tự đổi mỗi phút, để em đến muộn vẫn vào được.

## 3. Màn Hôm nay và Hành trình

- Đầu màn Hôm nay có nút **Điểm danh**. Đây là nút chính; khi có ca kiểm tra đang mở thì «Theo dõi ca» là nút chính, Điểm danh thành nút viền bên cạnh. «Bổ sung bài hôm nay» là nút viền.
- Bỏ mục **Hành trình** khỏi thanh bên và thanh đáy. Số «Cần thầy chữa» nay hiện cạnh mục Hôm nay.
- Không mất chức năng nào. Màn cũ (Kiểm tra đầu giờ, Chữa câu khó, Cần thầy chữa, Kiểm tra ôn tập) vẫn mở được từ các việc trong «Việc cần thầy» của Hôm nay.

## 4. Phông chữ

Giữ **Be Vietnam Pro**, phông thầy chốt ngày 08/11 cho cả ba app. Đây là phông thiết kế riêng cho dấu tiếng Việt, mặt chữ rộng, nét mở, nên chiếu xa vẫn đọc rõ. Phần chỉnh thêm cho máy chiếu:

- Đề dùng nét **500**: đủ dày để không bị máy chiếu làm nhạt, không chói như nét đậm.
- Nhãn dùng nét 600–700. Số và tên em dùng nét **800** (trước đây trình duyệt phải vay nét 700).
- Số luôn đều cột (tabular), nên đếm «11/15» không nhảy.
- Hai nét 500 và 800 chỉ tải khi bảng mở, không làm app mở chậm hơn.

## 5. Chuyển động

- Thu nhỏ: 0,5 giây, co còn 80 %, mờ dần, bo góc.
- Phóng lại: 0,46 giây.
- Đổi màn lớn (điểm danh ⇄ câu ⇄ câu khác) thì màn mới hiện rõ dần và trồi nhẹ. Trong cùng một câu, đổi pha không làm đề chớp.
- Chỉ dùng transform và opacity, nên máy chiếu yếu vẫn mượt. Máy yếu hoặc chế độ giảm chuyển động thì ẩn và hiện tức thì.
- Lúc bảng ẩn dưới tờ, bảng dừng vẽ hiệu ứng để không tốn máy.

## 6. Lỗi cũ đã sửa

- Bản 08/11 có lỗi: gọi em lên bảng xong thì bảng **không ẩn được**. Bảng vẽ ra ngoài khung bọc, nên lệnh ẩn khung không có tác dụng, và tờ cũ bị che. Thầy chỉ thấy màn lên bảng của Bình Phản Ứng chứ không thấy màn chiếu chuẩn cũ.
- Nay bảng nằm trong đúng khung, nên thu và ẩn đúng.
- Bảng điểm danh và bảng câu nay là **một bảng**. Chỉ nối phòng một lần, không dựng lại, không chớp «Đang mở…» khi chuyển từ điểm danh sang câu.

## 7. Kiểm

| Hạng mục | Kết quả |
|---|---|
| tsc | sạch |
| check:mau, kiem:mau-giu, kiem:co-tep | 0 vi phạm |
| Precache | giữ trần 170 tệp |
| Byte tải mở | app thầy 176,4 KB (mốc 176,5); app học sinh và phụ huynh bằng mốc |
| Test | test Bình Phản Ứng, điểm danh, thanh điều hướng xanh; thêm `tests/diem-danh-hom-nay-0911.test.ts` |
