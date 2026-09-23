# Sửa 3 app — đặc tả nghiệm thu 23/09/2026

Yêu cầu: sửa lỗi tràn, mở ca trên máy khác, chấm sai; rút câu theo phần từng em đã học; ôn giãn cách giảm lặp; đoàn hộ tống vừa sức và đủ thời gian; giảm tải máy chủ.

## Phân công và phạm vi

| Người thực hiện | Trách nhiệm | Vùng sở hữu |
|---|---|---|
| Boss | Đặc tả, nghiên cứu, đối chiếu app thật, kiểm tra tích hợp | Tài liệu nghiệm thu; không sửa đè vùng người khác |
| Code 1 | Kết nối nhiều máy, chấm điểm | Cấu hình/API/ca thi/grading; `server/src/index.ts` |
| Code 2 | Phạm vi học, chọn câu, lịch ôn, độ khó và giờ game | `server/src/game-v2*`, thuật toán chọn câu, logic game; tránh hàm grade nếu Code 1 cần |
| Code 3 | Hiệu năng máy chủ | Đọc tổng hợp GV/PH, giảm truy vấn; phối hợp trước khi sửa cache chung |
| Agent giao diện | Tái hiện và sửa tràn | CSS/layout, fixture và đo viewport |

Mọi thay đổi phải giữ các sửa có sẵn trong workspace. Không đổi điểm cũ, tạo ca thật hay chạy thử tải lên dữ liệu thật. Các agent không tự phát hành. Nghiệm thu phải phân biệt kiểm thử local, kiểm tra chỉ đọc trên bản đang chạy và xác minh sau phát hành.

## 1. Giao diện

- Kiểm tra GV/HS/PH tại 320, 390, 768, 1280 px; nội dung dài, bảng, công thức, ảnh, hộp thoại và thanh tác vụ.
- Không có cuộn ngang ở trang chính; nội dung cần chiều rộng có vùng cuộn riêng nhìn thấy và thao tác được.
- Nút đóng, xác nhận, nộp bài không nằm ngoài vùng truy cập. Hộp thoại cao có cuộn dọc; không che lỗi bằng cắt toàn bộ nội dung.
- Bằng chứng: màn/fixture tái hiện trước, số đo sau và ảnh kiểm tra.

## 2. Ca thi trên máy khác

- Máy mới, trình duyệt mới và dữ liệu lưu cũ phải chọn được máy chủ hợp lệ từ cấu hình chung; không phụ thuộc localStorage của máy tạo ca.
- Phân biệt thiếu cấu hình, lỗi xác thực, lỗi mạng và ca không tồn tại. Giữ cơ chế đăng nhập và quyền hiện hành.
- Tái hiện luồng cấu hình → mở/đọc ca → học sinh truy cập bằng các ngữ cảnh lưu trữ độc lập, dùng dữ liệu kiểm thử.
- Không kết luận mạng nhiều máy đã đạt chỉ từ unit test hay một tab đăng nhập.

## 3. Chấm điểm

- Theo vết đáp án nguồn → xáo đề/ý → hiển thị → gửi → chấm server → hiển thị kết quả.
- Kiểm tra trắc nghiệm, đúng-sai từng ý, đáp số; dấu phẩy/chấm, khoảng trắng, dấu âm, số 0, bỏ trống, dữ liệu sai cấu trúc.
- Chuẩn hóa tương đương chỉ khi định dạng đó được đề cho phép; không nhận đáp án rác, không nới sai số tùy tiện.
- Câu có khóa đáp án lỗi phải được nhận diện; không đổ lỗi thành câu sai của học sinh. Không tự động sửa điểm thật.
- Server/client cho cùng kết quả; đáp án và lời giải không lọt ra trước thời điểm được công bố.

## 4. Phần đã học theo từng em

- Mọi câu tự động có bằng chứng phạm vi của chính học sinh: nội dung đã học/được xác nhận phù hợp; không suy ra đã học từ việc bạn cùng lớp từng gặp câu.
- Lọc nội dung và khối trước xếp hạng độ khó. Dữ liệu thiếu không được tự mở rộng cả chương/cả lớp.
- Câu nhiều kiến thức chỉ được chọn khi mọi thành phần bắt buộc đã nằm trong phạm vi; khóa nhận dạng chuẩn, tránh khớp tên mơ hồ.
- Không đủ câu thì giảm số lượng hoặc thông báo đúng lý do. Không lấy câu vượt phạm vi để bù đủ.
- Kiểm tra hai em cùng lớp, khác lịch sử; học sinh mới; nội dung chưa học; câu thiếu metadata; cache và lịch sử không lẫn giữa em.

## 5. Lặp lại có mục đích

- Khử trùng trong một lượt theo ID và nội dung; ưu tiên câu mới phù hợp khi câu cũ chưa đến hạn.
- Câu sai hoặc đến hạn được ưu tiên ôn, có khoảng cách và phản hồi; không lặp liên tục một câu chỉ vì pool nhỏ.
- Lịch theo học sinh × câu/nhóm nội dung, thời gian và kết quả thực. Gửi lại cùng lượt không tạo thêm một lần ôn.
- Cơ sở chọn: FSRS là ứng viên thực dụng có triển khai TypeScript; dùng tham số mặc định khi dữ liệu cá nhân chưa đủ. Không gọi lịch thủ công là FSRS, không khẳng định tốt nhất thế giới cho bài tính Hóa.
- Nếu dùng FSRS: trả lời sai → Again; đúng đã xác minh → Good; không suy luận Easy đơn thuần từ thời gian trả lời. Mức nhớ mục tiêu ban đầu 0,90 là cấu hình thử, cần theo dõi độ chính xác và số lần ôn.
- Đo tính hợp lệ phạm vi, tỉ lệ lặp, số câu đến hạn được phục vụ và số query với dữ liệu giả lập; đo kết quả học tập dài hạn là việc sau phát hành.

## 6. Đoàn hộ tống

- Độ khó theo lịch sử học đúng chủ đề của mỗi em; không lấy cấp thú/tài sản làm năng lực học.
- Nhóm làm câu chung phải dùng giao phần đã học của thành viên hoặc cơ chế câu riêng được giao rõ ràng; không hợp nhất kiến thức của cả đội rồi đưa cho tất cả.
- Tránh câu tính nặng cho em chưa đủ nền. Thiếu bằng chứng thì bắt đầu thận trọng và tăng dần theo kết quả.
- Thay thời hạn cố định 30 giây bằng hạn theo loại câu và độ khó; mốc khởi đầu cần kiểm chứng: 60–180 giây. Server là nguồn hạn cuối; client hiển thị cùng hạn, tải lại không reset hay rút thời gian sai.
- Kiểm tra hết giờ, reconnect, tải chậm, câu đúng, câu sai và gửi lặp; không phát sinh thưởng/phạt trùng.

## 7. Hiệu năng và kiểm tra cuối

- Tối ưu hotspot có bằng chứng, không viết lại toàn hệ thống. Ghi workload, số query/đọc, thời gian trước/sau, lạnh/ấm nếu đo được.
- Ưu tiên batch, cache phạm vi đúng, hợp nhất request đồng thời; không trả kết quả HS A cho B, không mất invalidation sau thay đổi.
- Chạy test hồi quy mục tiêu trước; toàn bộ bộ test theo README và build trước bàn giao. Phân biệt lỗi nền, lỗi do thay đổi, test chưa chạy.
- Không tuyên bố server nhanh nhất hoặc hết mọi lỗi nếu chưa có dữ liệu; kết luận theo số đo và luồng đã xác minh.

## Nguồn nghiên cứu

- SRS Benchmark: https://github.com/open-spaced-repetition/srs-benchmark — đánh giá dự đoán nhớ theo lịch sử flashcard; không phải thử nghiệm trực tiếp môn Hóa.
- ts-fsrs: https://github.com/open-spaced-repetition/ts-fsrs — triển khai TypeScript cho lịch FSRS.
- Nghiên cứu lịch ôn thích nghi so với cố định: https://pmc.ncbi.nlm.nih.gov/articles/PMC6028005/ — cơ sở xem xét thời điểm và kết quả ôn, không chứng minh một thuật toán tối ưu mọi hoàn cảnh.

## Bằng chứng ban đầu

- Workspace: `/Volumes/SSD NGOÀI/omr-app`; app đang chạy: `https://omr-app-b3u.pages.dev/gv`.
- Bảng tin và danh sách ca tải được trên phiên giáo viên đã đăng nhập. Chưa xác minh lỗi trên thiết bị thứ hai.
- Code 2 đã phát hiện luồng gom dạng cả lớp rồi đưa vào pool cá nhân; đang sửa và bổ sung test.
