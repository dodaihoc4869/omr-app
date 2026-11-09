# Bình Phản Ứng — màn MÁY EM (thầy 09/11)

Thầy: «Thiết kế màn làm bài bình phản ứng của học sinh hấp dẫn hơn, có logo ngọn lửa của đội cháy, chọn đúng màu xanh, chọn sai màu đỏ, khi nộp bài điện thoại tự che lại học sinh không mở được khi thầy đẩy câu mới» · «khi nộp bài hs phải tập trung lên bảng để chữa bài» · «hiệu ứng ở máy học sinh cực đẹp hơn, lung linh hơn».

Mã: `src/components/bpu/ManBinhPhanUng.tsx`, `src/components/bpu/bpu-hs.css`. Test: `tests/bpu-giao-dien-0611.test.tsx`, nhóm «máy em · thầy 09/11».

## 1. Đầu màn
Ngọn lửa màu đội ba lớp (`--doi` = `DOI_BPU[doi].mau`, lõi pha `--tr-sao` và `--giay`) lay nhẹ, đốm than bay lên. Chỉ dùng transform và opacity. Máy yếu (`html.may-yeu`) hoặc máy bật giảm chuyển động thì lửa đứng yên.
Bên cạnh là tên đội, dòng «Bình Phản Ứng · Lượt N», và ô «kJ đội».

## 2. Hiệu ứng gửi (khoảng 1,15 s)
Thứ tự: phương án em chọn bừng sáng màu đội → sóng tròn và 14 tia lửa màu đội / vàng vụt lên đầu màn như bay lên bảng → lớp che hiện, ngọn lửa bùng một nhịp. Máy có rung thì rung nhẹ (`navigator.vibrate`).
Máy yếu hoặc giảm chuyển động: không có tia, lớp che hiện ngay.
Ảnh `2a-gui-bay-giua-*`, `2b-gui-bung-lua-*`.

## 3. Lớp che sau khi gửi
- Che ngay khi em bấm, không chờ phòng báo lại. Mất mạng vẫn che, đáp án nằm hàng chờ.
- Kín cả màn. Không còn đề, không còn phương án, không có nút mở ra.
- Nội dung: «Đã gửi», «Đã gửi sau N giây · x/y bạn đã gửi», «Nhìn lên bảng để chữa bài».
- Chỉ mở khi thầy đẩy CÂU MỚI (số lượt `luot.so` đổi).
- Ảnh `3-da-gui-che-*`.

## 4. Thầy mở đáp án
Màn vẫn che. Lớp che đổi sang nền xanh «Chính xác!» kèm dấu ✓, hoặc nền đỏ «Chưa đúng» kèm dấu ✗. Có dòng kJ, nhanh thứ mấy cả lớp, hạng.
Bốn ô A–D:
- Ô em chọn mà sai: ĐỎ, ghi «Em chọn».
- Đáp án đúng: luôn XANH, ghi «Đáp án đúng», hoặc «Em chọn» nếu em chọn đúng.

Câu Đúng–sai: mỗi ý một dòng «Em: Đúng ✓ / Sai ✗», kèm đáp án nếu em sai. Câu trả lời ngắn: «Em ghi» và «Đáp án đúng».
Không hiện lại đề, không hiện lời giải trên lớp che. Có nút chữ nhỏ «Rời Bình Phản Ứng» (cao ≥ 44 px) để em không kẹt nếu thầy quên kết thúc buổi.
Ảnh `4-mo-dap-an-dung-*`, `5-mo-dap-an-sai-*`.

**Thầy quyết khi duyệt:** em KHÔNG gửi kịp thì không bị che (em chưa có gì để giữ). Khi thầy mở đáp án, em ấy vẫn thấy đề, đáp án đúng tô xanh ngay dưới, kèm lời giải như cũ. Muốn che cả em chưa gửi thì báo.

## 5. Rời màn
Thầy đã bỏ trừ kJ. Máy em vẫn gửi `{ t: 'roi' }` khi ẩn app từ 2 giây trở lên, hoặc khi đóng trang. Khi app hiện lại sau một lần đã báo rời, máy gửi THÊM `{ t: 've' }`, kể cả khi lúc đó thầy đã mở đáp án.
Chữ cảnh báo trên máy em: «Bảng đang báo tên em — quay lại tập trung lên bảng.»
**Việc của phòng (người khác làm):** nhận `ve` để gỡ em khỏi danh sách «đang rời», và bỏ −20 kJ.

## 6. Giữ nguyên
- Đáp án không xuống máy em trước khi thầy mở (máy chỉ nhận `viewEm`).
- Không có nút thoát giữa lượt. Mất mạng không tính là rời màn.
- Bảng chiếu và luật phòng không đổi.

## 7. Ảnh (390×844, Chromium thật, sáng và tối)
`1-dang-lam` · `2a-gui-bay-giua` · `2b-gui-bung-lua` · `3-da-gui-che` · `4-mo-dap-an-dung` · `5-mo-dap-an-sai`
Đo trên ảnh: không cuộn ngang, 0 nút thấp hơn 44 px, 0 lỗi trang.
