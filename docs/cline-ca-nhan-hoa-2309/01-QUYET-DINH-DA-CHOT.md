# Quyết định bắt buộc CNH-1.0

## 1. Phạm vi chốt

Các giá trị dưới đây là quyết định thiết kế cho bản triển khai v1, được chốt để Cline không chọn tùy ý giữa các phương án của bản đề xuất. Chúng không phải những hằng số được nghiên cứu chứng minh tối ưu cho mọi học sinh. Chủ dự án có thể thay đổi bằng yêu cầu mới; khi đó tăng phiên bản, sửa đồng bộ đặc tả, JSON và test.

| Nội dung | Quyết định v1 |
|---|---|
| Cấp 10 | Giữ 2.400 EXP tích lũy; tài khoản mới sớm nhất ngày học hợp lệ thứ 12 |
| Khiên đầu | Cấp ≥10, ≥21 ngày đạt; tiêu 21 mảnh; không trừ EXP |
| Khiên sau | Mỗi khiên cần 21 mảnh mới và 300 EXP; sau chi còn ≥400 |
| Kho khiên | Tối đa 5 khiên chưa dùng tổng cộng; giữ số cũ vượt 5 nhưng chưa cấp thêm khi còn ≥5 |
| Bỏ học một thời gian | Không mất khiên, thú, cấp, đồ, tiền vì vắng; tạo mục tiêu quay lại |
| EXP ngày | Cốt lõi tối đa 220, tự chọn tối đa 120 trên toàn bộ nguồn; tổng tối đa 340 |
| Hấp thụ | Đạt: 200/ngày; có học chưa đạt: 120/ngày; chưa học: 0; cần đủ ví |
| Dự trữ | Đổi EXP sang vàng/rèn phải giữ ≥400; hấp thụ được dùng dự trữ |
| Đường cấp 11–120 | GIỮ bảng hiện hành; phương án 365 ngày CHƯA áp dụng trong v1 |
| Lịch nhớ | Giữ ts-fsrs 5.4.2, FSRS-6, retention 0,9; fuzz và short-term tắt |
| FSRS-7, IRT, tự tối ưu trọng số | Ngoài v1; không cần triển khai để hoàn thành CODE_VERIFIED |
| Năng lực | Quy tắc bằng chứng theo family/ngày/mức; không lấy cấp thú thay năng lực |
| Giờ học mặc định | 1.200 giây; lựa chọn 300/480/600/900/1.200/1.800 giây |
| Quay lại | Sau ≥3 ngày lịch VN không có bằng chứng học: gợi ý buổi 480 giây; học sinh được chọn thời lượng khác |
| Thử thách | Tự chọn, tối đa 1 trên mỗi lượt tối đa 6 câu; không bắt buộc để đạt ngày |
| Gọi lên bảng | Chỉ nút bấm; bỏ timer và mọi kích hoạt tự động gọi, giữ thần thú và thẻ tên |
| Thi thật/thi thử theo ma trận | Được giữ độ khó và thời lượng đề riêng; không tự biến thành đề dễ cá nhân |
| LLM lúc học | Không là phụ thuộc bắt buộc của chấm, chọn câu, ghi tiền hoặc mở ca |

Không đổi bảng cấp sau cấp 10 là lựa chọn triển khai có chủ đích để tránh trộn một thay đổi kinh tế lớn vào đợt này. Phương án 365 ngày được giữ nguyên trong tài liệu gốc để quyết định sau, không được âm thầm xóa khỏi lịch sử đề xuất.

## 2. Thuật ngữ và kiểu giá trị

- `level` của thú: số nguyên 1–120; độc lập với `difficulty` câu.
- `difficulty`: 0=Biết, 1=Hiểu, 2=Vận dụng. `validated_level` có thể null khi chưa đủ bằng chứng; `working_level` khởi đầu 0 trong phần đã học.
- `qid + question_version`: một phiên bản câu. Đổi đáp án/nội dung phải tạo version mới.
- `content_group`: các bản sao tương đương nội dung/đáp án; đổi qid không tạo bằng chứng mới.
- `family_id`: cùng cấu trúc/phương pháp. Một family có thể có nhiều biến thể không phải bản sao. Family chưa xác minh không được dùng chứng nhận tăng bậc/chuyển giao.
- `skill_id`: kỹ năng; câu nhiều kỹ năng phải có nhãn từng ý hoặc quy tắc ánh xạ đã duyệt.
- `attempt_id`: cơ hội làm do server cấp, độc lập với `request_id` của thao tác gửi lại.
- `learning_day`: ngày YYYY-MM-DD theo Asia/Ho_Chi_Minh từ thời điểm server tiếp nhận lần nộp đầu hợp lệ; không dùng đồng hồ máy khách.
- `independent`: lần trả lời đầu, chưa được cấp gợi ý/lời giải, không thuộc luyện lại sau vừa xem lời giải; quyền đọc lời giải trên mọi màn đều được kiểm.
- `valid_attempt`: server đã giao đúng phiên bản, đúng người, có đủ câu trả lời bắt buộc theo phần, chưa nộp trước, không ở trạng thái đề lỗi/bị thu hồi. Đúng/sai đều có thể là lần làm hợp lệ. Không kết tội đoán mò chỉ từ làm nhanh; nghi vấn có quy trình xem xét, không tự tước thưởng đã có.
- `verified_learning`: ít nhất một valid_attempt của nhiệm vụ ngày hoặc một bước tự làm được giáo viên xác nhận bằng sự kiện. Mở app, mở lời giải hoặc bấm nhận thưởng không đủ.
- `assisted`: đã được server cấp hỗ trợ; vẫn ghi công học và chữa bài, không thành bằng chứng độc lập.

## 3. Bất biến áp dụng trên mọi đường gọi

1. Bộ chọn tự động không phát câu ngoài phạm vi cá nhân, thiếu kiến thức nền, có bản sao đề bảo vệ, hoặc quá trần độ khó của mục đích. Thiếu kho phải trả thiếu, không lách lọc.
2. Cùng lịch sử chuẩn hóa và cùng phiên bản cho cùng hồ sơ. Ba app dùng cùng trạng thái server.
3. Cùng một lần làm chỉ có một kết quả hiệu lực và một mục đích thưởng. Sửa điểm là sự kiện bổ sung liên kết bản gốc.
4. Quyền nhận, ledger, ví, số đã dùng hạn mức và receipt không được lệch nhau khi retry, mất mạng hoặc hai thiết bị.
5. Mọi nguồn vào EXP ngày đều qua một sổ và hai quỹ. Admin/đền bù không được vượt trần hấp thụ.
6. Ngân sách áp dụng toàn bộ nhiệm vụ tự động; phân biệt BTVN giáo viên chủ động giao có hạn riêng. Không tự xóa bài quá tải.
7. Sau khi bắt đầu, không tăng mục tiêu ngày âm thầm. Phần chưa mở được đổi bằng revision; công đã làm được giữ.
8. Các quyết định phạm vi, bảo vệ đề và nhận thưởng phải được kiểm lại lúc phát/nộp, không chỉ dựa cache.
9. Trạng thái đã đạt chỉ bị sửa do correction có đối chiếu. Lỗi câu do hệ thống không tự lấy lại tiền/khiên của học sinh.
10. Đọc log/test không được đánh dấu là đã chạy test. Đã sửa local không được ghi là đã phát hành.

## 4. Ranh giới không được tự suy

- Không có “phương pháp tốt nhất thế giới” áp dụng mặc định; v1 triển khai lịch ôn hiện có với dữ liệu tốt hơn, chống lặp và đo tác dụng.
- Không tự gán family/kỹ năng/nền học bằng LLM rồi coi là đã duyệt. Được tạo gợi ý để giáo viên duyệt.
- Không dùng tỷ lệ 85% như điều kiện duy nhất chọn câu khi chưa hiệu chỉnh xác suất trên dữ liệu thật.
- Không đổi luật điểm thi theo luật EXP; hai số khác mục đích.
- Không ép thuật toán chẩn đoán/phạm vi của luyện tập lên đề giáo viên chủ động giao; phải ghi nguồn override và bảo vệ lời giải.
- Không giảm quyền học vì chọn thú khác, cấp thú thấp, không mua đồ hoặc nghỉ học.

## 5. Quyết định nghiệp vụ so với quyền phát hành

Bộ này chốt hành vi để viết code và kiểm thử. Không tự suy rằng có quyền xóa dữ liệu thật, thử giao dịch trên tài khoản học sinh thật hoặc thay cấu hình API của thầy. Khi đã được giao quyền phát hành trong phiên làm việc thì dùng quyền đó, không hỏi lại; thiếu bằng chứng vận hành thì ghi đúng thiếu.
