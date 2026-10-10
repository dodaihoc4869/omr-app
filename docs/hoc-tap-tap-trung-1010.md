# App học sinh tập trung học — 10/10/2026

Theo lệnh thầy, app học sinh bỏ tất cả cửa/màn game khỏi cây điều hướng: thần thú, Đảo, Đoàn, võ đài, Bi-a, túi đồ, cửa hàng, thưởng và rương. Các mô-đun cũ vẫn được giữ trong kho mã để không phá dữ liệu lịch sử, app thầy/phụ huynh và khả năng lùi bản; học sinh không còn đường mở chúng từ cổng hiện hành.

## Giao diện

- Hôm nay: mục tiêu thật, tiến độ thật, một nút học tiếp, đợt tối đa 6 câu, báo thiếu câu/giữ câu cho ca thi đúng dữ liệu.
- Hành trình: bài được giao, tầng đang mở; máy chủ vẫn quyết định quyền từng câu.
- Ôn & sửa: kế hoạch ôn, câu đã làm, vòng tự chữa hiện có. Chưa bật chữa thì giải thích rõ và giữ quyền xem lại hiện hành.
- Của em: bài được giao, bài gia đình giao, lịch sử kiểm tra, đăng xuất.
- Màn làm bài: dùng TheCau chuẩn I/II/III; chưa nộp không có đáp án/lời giải. Sau nộp nhận phản hồi máy chủ. Nháp theo SBD × qid × phiên bản; mạng lỗi không mất nháp, gửi lại cùng phiên không tạo thêm lượt.
- Điện thoại dọc: thanh điều hướng dưới; xoay ngang và máy tính: khu câu hỏi + bảng điều khiển riêng. Nút ≥48px, focus rõ, màu sáng/tối theo bảng chung.

## Kết nối và giới hạn

`hoc-tap-sanh` đọc cùng kế hoạch; không yêu cầu chọn thần thú. `hoc-tap-start` dùng cùng bộ chọn/chấm hiện hành, gộp các câu ôn Đoàn và câu mới/ôn Đảo trong một đợt. Phiên mới đánh dấu `hocTap:1`, tách phiên game chờ cũ. Mở học tập đóng bàn Bi-a cũ của chính em để nhả câu, không xoá lịch sử/điểm. `answer` giữ xác thực, phiên bản, ca thi và tính lại idempotent như trước.

Không đổi sàn 24/30/36/36, tiên quyết, lịch ôn, bằng chứng độc lập hay hạn giao bài. Lượt có gợi ý vẫn được tính có hỗ trợ theo hợp đồng hiện hành. Hoàn thành số câu và thành thạo kiến thức được trình bày riêng. Rời giữa đợt giữ lịch sử từng câu; vào lại lấy phần kế hoạch còn lại, không hứa khôi phục nguyên thứ tự đợt cũ. Khi cờ kế hoạch 2.0 tắt, màn học dùng bộ chọn cũ với quyền cũ; chưa đủ nguồn hợp lệ vẫn báo thật.

## Xác minh

Kiểm D1 thực: không cần chọn thú, không tin SBD khách gửi, không lộ đáp án trước nộp, cùng answer không nhân đôi lượt, nhả bàn cũ, giữ câu thuộc ca mở cả khi đợt đã tạo trước. Kiểm React: dữ liệu thật trên kế hoạch, không cửa game, giữ nháp khi lỗi, chấm máy chủ và bốn ý đúng-sai. Chromium với dữ liệu minh hoạ ở 390×844,844×390,1440×900: mở/chọn/nộp/phản hồi, không tràn ngang và không lỗi JavaScript. Ảnh minh hoạ không phải dữ liệu học sinh thật.

Phát hành đi qua cổng ca thi hiện hành; không reset dữ liệu, không migration mới.

Cổng giữ các lối học thuật cũ trong Của em và Ôn & sửa: bài gia đình giao, kết quả bài đã nộp, luyện lại từ bài kiểm tra và thông tin gia đình. Nhập mã ca vẫn có dù chưa phát hiện ca mở. Khi hệ thống đang làm mới dữ liệu, giao diện báo trạng thái và giữ nháp/phiên; phiên lưu cũ thiếu token quay về đăng nhập.

Các kiểm tra buộc cổng mở Đoàn/Bi-a/thần thú/toàn màn hình hoặc menu nhiệm vụ cũ được thay bằng hợp đồng học tập hiện hành. Giữ kiểm thư viện game lưu trữ, API/hook kế hoạch, chấm, quyền và lịch sử; các kiểm bài gia đình/BTVN/phòng thi chỉ đổi bước điều hướng. Không bỏ qua kiểm lỗi nền hoặc gọi toàn repo xanh khi còn lỗi. Bộ full đầu chạy trong lúc gộp main; dùng đối chiếu bản main sạch và chạy lại tất cả tệp đỏ ở bản cuối để tách lỗi thực khỏi hợp đồng đã gỡ và lỗi thời điểm.

Bản chốt đối chiếu tất cả tệp đỏ: 1.613 kiểm đạt, 164 lỗi trùng tên trên main sạch 35ca06e7, không lỗi mới. Các tệp còn lại đã qua lượt full đầu. Không gọi toàn repo xanh. Bảng tin gia đình trong cổng HS bật tapTrungHoc, ẩn thẻ thần thú và vinh danh game; ứng dụng PH giữ hành vi hiện hành. Kiểm hai màn dùng chung 19/19 đạt; buildCF/SW13/13 và màu 0 vi phạm.
