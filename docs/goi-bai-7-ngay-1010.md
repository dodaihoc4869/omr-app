# Bài mới trong 7 ngày · 10/10/2026

Thầy chọn bài gần nhất của từng lớp để bắt đầu từ ngày kích hoạt; bài cũ tiếp tục ôn. Các lần chọn bài mới sau thời điểm kích hoạt tự tạo gói riêng. Chỉ mục lấy đúng toàn bộ câu gốc của các tờ trắc nghiệm, đúng–sai, trả lời ngắn được chọn; không rút tự luận tự động.

## Phân ngày và đợt

Quota câu gốc mới = làm tròn lên (số câu chưa gặp / số ngày còn lại, gồm hôm nay). Ví dụ 127 câu trong 7 ngày cần ít nhất 19/18/18/18/18/18/18 lượt gặp mới nếu học đều. Sàn học hiện có 24/30/36 theo tầng của em bao gồm câu mới, sửa lỗi, ôn và học có hỗ trợ. Một đợt tối đa 6 câu; quota từng gói được giữ trước khi phân ôn/sửa. Khi có nhiều gói, hạn gần được xét trước; một câu chung có thể phủ cả hai gói.

Ngày chưa hoàn thành không được đánh dấu xong. Ngày kế tiếp chia lại phần chưa gặp cho số ngày còn lại; hết hạn vẫn còn nợ và thông báo cần thầy hỗ trợ. Không tự sinh bằng chứng đã làm để đủ số.

## Bằng chứng học

- Gặp câu: đúng qid gốc và phiên bản hiện hành, từ bài nộp hợp lệ/đã công bố hoặc hành động học có hỗ trợ/nhờ thầy chữa trong phiên của chính em. Biến thể không tăng giả độ phủ câu gốc.
- Tự làm: chấm máy chủ theo phiên có quyền; xem chữa không ghi đúng/sai hay đạt kỹ năng. Thiếu lời giải cho phép nhờ thầy chữa, không trả đáp án. Khi thầy lưu phần chữa, câu được giao lại.
- Đạt kỹ năng: giữ hồ sơ OMNI/SPRT và vòng sửa lỗi sẵn có. Gốc đã gặp qua hỗ trợ vẫn được giao ôn khi đến hạn và sẵn sàng; sau xem chữa ít nhất 12 giờ mới dùng làm bằng chứng tự kiểm. Sửa lỗi dùng lại bộ chọn song sinh/biến thể/câu anh em/hoán vị máy chủ của hệ thống.

Phần ôn cũ tính trên toàn bộ kỹ năng trong phạm vi bài đã dạy; kỹ năng chưa có bằng chứng được tính chưa đạt. Câu chưa gắn ma trận dùng dạng/câu làm mẫu số dự phòng, không thu hẹp mẫu để báo đủ 80%.

## Giáo viên và tự kiểm

Bảng Hành trình → Bài mới trong 7 ngày hiển thị từng em còn thiếu câu nào, nhờ chữa câu nào, cần kiểm lại câu nào. Câu khó/tính toán được đưa lên trước từ đầu; nhãn nhiều học sinh sai chỉ dựa lần tự làm đầu, tối thiểu 5 em và tỷ lệ sai ít nhất 30%. Thầy xem và duyệt lời giải có sẵn hoặc viết phần chữa; không có nút xác nhận cả lớp đã hiểu.

Tự kiểm lấy đầy đủ từng tờ được chọn, không lấy mẫu vài câu để tuyên bố đạt cả tờ. Ưu tiên biến thể đã xác thực khi có; số câu mới và phần kiểm trí nhớ được ghi rõ. Đúng–sai chấm phi tuyến 0/0,1/0,25/0,5/1; trả lời ngắn dùng quy tắc chấm số của ca thi. Điểm mỗi tờ chuẩn hoá về 10, không gọi là dự báo điểm thi. Phải trả lời đủ trước khi nhận đáp án; gửi lại giữ kết quả đầu. Khi nguồn đổi, điểm cũ giữ trong lịch sử nhưng không xác nhận đạt bản mới.

Màn học cũng chấm trả lời ngắn bằng `khopPhanIII`, giống ca thi/tự kiểm: `4` và `4,0` cùng giá trị được chấp nhận. Chỉ phiên học do máy chủ đánh dấu `hocTap` áp quy tắc này; game cũ giữ chính sách chữ số có nghĩa và bản nộp đã chốt không đổi khi gửi lại. Câu chẩn đoán giữ quy tắc riêng đã có.

Mục tiêu ≥7/10 bài mới và ≥80% kiến thức cũ là mục tiêu cần kiểm chứng, không phải cam kết mọi em tự động đạt. Độ phủ 7 ngày cần học sinh thực sự vào học và nguồn đã duyệt sẵn sàng; câu thiếu nguồn/bị giữ cho ca thi được báo rõ cho thầy.

## Triển khai và giữ dữ liệu

7 bảng `goi_bai_7*` chỉ thêm, đều thuộc danh sách GIỮ khi reset. Cờ `cau_hinh.goi_bai_7_v1` chốt ngày/giờ kích hoạt một lần. Trước schema, Worker và áp lịch đều kiểm ca mở/lượt đang làm. Nguồn R2 chỉ đọc; chỉ mục game là dữ liệu dẫn xuất được dựng lại bằng hàm chuẩn khi lệch nguồn, không sửa bài nộp/điểm/sổ học. Câu đang giữ cho ca, BTVN chưa nộp, khác khối và câu chưa duyệt không được phát đáp án.

Áp lịch chốt quota hôm nay cho mọi em của lớp, gồm em chưa mở app; kiểm số gói/em/câu/quota thiếu trên D1, không in danh tính hay đáp án. Lùi mã bằng revert bản gộp, giữ bảng/sổ và tắt cờ khi cần; không reset dữ liệu thật.

Chỉ chốt phạm vi khi nguồn của mọi tờ đã chọn còn tồn tại và chỉ mục khớp phiên bản R2. Thiếu một tờ không nhận các tờ còn lại là toàn bộ bộ bài: giữ sổ và manifest cũ, báo nguồn chưa đủ ở cả ba app, ngừng xác nhận điểm tự kiểm của bộ đó. Khi đủ nguồn, tự dựng lại đầy đủ và giữ những câu gốc cùng phiên bản đã thực sự gặp. Công cụ áp lịch báo riêng số gói còn thiếu nguồn.

Kiểm chứng: toàn repo được đối chiếu theo tên lỗi với main; kiểm liên quan là cổng bắt buộc. Chromium đã kiểm 30 tổ hợp HS/làm bài/tự kiểm/GV/PH ở 390×844, 844×390, 1440×900 và sáng/tối, không tràn ngang hay lỗi trang. Chi tiết kết quả chốt/phát hành ghi ở DIEU-PHOI.md.
