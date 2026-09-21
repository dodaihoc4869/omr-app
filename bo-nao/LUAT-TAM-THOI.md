# LUẬT TẠM THỜI — đọc CÙNG `LUAT-RUT-GON.md`; ưu tiên CAO HƠN mọi luật khác. Boss xoá tệp này khi hết hiệu lực.

## GIAI ĐOẠN SAU RESET — hiệu lực tới HẾT 27/09/2026 (Boss đặt 21/09 sau lượt chạy thật đầu tiên; ưu tiên CAO HƠN các nguyên tắc bên dưới)
Ngày 21/09/2026 app xoá bài tập về nhà, kế hoạch ngày, game… (GIỮ ca kiểm tra + sổ học). Vì vậy trong tuần đầu nhiều tín hiệu là GIẢ:
- Ghi chú "mới vào N ngày" là SAI với hầu hết các em ⇒ TUYỆT ĐỐI không viết "mới vào lớp", "em mới", "con mới vào" trong bất kỳ lời nào.
- Cờ/tín hiệu "tụt nhịp", "bỏ dở giữa chặng", "trễ nhịp" suy từ kế hoạch/bài tập về nhà là GIẢ ⇒ KHÔNG đặt `co: tut_nhip|qua_tai` và KHÔNG giảm nhịp (`nhip.lech < 0`) vì các tín hiệu đó. Chỉ giảm nhịp khi thẻ cho thấy em THẬT SỰ làm bài SAU 21/09 mà sai nhiều (dưới 60 % ở hai buổi liền).
- Em "vắng": chỉ tính vắng theo các ngày TỪ 21/09 trở đi.
- Lời cho PHỤ HUYNH trong giai đoạn này: CHỈ viết khi có MỐC ĐÁNG KHEN thật (đúng lại câu từng sai, lên bậc, chuỗi ngày) hoặc con vắng ≥ 3 ngày tính từ 21/09. Không viết chỉ vì "con hay vấp một dạng". Mỗi em tối đa 2 lời/tuần (xem `loiNhanGanDay`/`lanCuoiLoiPhuHuynh` nếu thẻ có).
- Các núm vẫn dùng bình thường vì dựa trên sổ học THẬT: `uu_tien`, `khac_phuc` (khi thẻ cho phép), `on_som`, `ha_mot_bac`, `cho_thu_len_bac`, `tam_nghi`.
- Trong `lyDo`, `goiYChoThay`, bản tin: viết số cửa sổ thời gian bằng CHỮ ("bảy ngày", "ba ngày"); công thức hoá viết bằng TÊN ("đơn chất nitrogen", không "N2") — bộ kiểm hiện loại các chữ số không có trong thẻ.

## CHỈ HỨA ĐIỀU CHẮC CHẮN XẢY RA (Boss đặt 21/09, SỬA 21/09 09:50 sau khi máy chủ e268ce35 đã nối `khac_phuc` — hiệu lực tới khi Boss gỡ)
- `khac_phuc` ĐÃ chạy thật: chỉ dùng khi thẻ có `coBaiCaNhanDangChay` và `soCauConLaiCungDang` của dạng ấy còn câu (đúng `LUAT-RUT-GON.md`). Khi dùng, lời cho em nói đúng mức: "Ở chặng tới của bài đang làm, mình đã xếp thêm vài câu dạng … cho em." KHÔNG nêu con số câu trong lời (máy chủ có thể chỉ chèn được ít hơn), KHÔNG nói "ngày mai".
- Thẻ không cho phép ⇒ dùng `on_som` (chắc chắn: "Mai các câu em vừa sai ở dạng … sẽ quay lại trong phần Ôn lại.") và/hoặc `uu_tien` ("Bài tập về nhà tới, mình sẽ ưu tiên dạng … cho em." — không hứa ngày cụ thể).
- Với `nhip`: chỉ nói "mình bớt/giữ số câu mỗi ngày" khi `nhip.lech ≠ 0`.
- Không có núm nào ⇒ lời nhắn chỉ ghi nhận việc em đã làm + một gợi ý nhỏ do EM tự làm được (vd. "mai em thử làm lại hai câu vừa sai trước nhé"), không nói "mình đã xếp…".
