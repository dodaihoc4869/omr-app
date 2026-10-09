# Nguồn câu dự phòng cho ba Hành trình · 09/10/2026

Học sinh có thể thiếu câu khi kho trong phạm vi đã dạy quá nhỏ hoặc phần còn lại chưa đủ tiên quyết. Kế hoạch giữ mức tối thiểu ngày 24/30/36/36 câu, chia chặng 6 câu. Không nâng tầng hoặc ép ôn trước hạn để lấp chỉ tiêu.

Trước khi báo thiếu, máy tìm hết nguồn được phép trong kho đã phân, giữ cổng khối, bài đã dạy, câu tự luận, nghi đáp án và câu bảo vệ cho ca. Câu mới/ôn đúng hạn đi qua bộ chọn hiện có. Nếu còn thiếu, dùng song sinh đã có học liệu hợp lệ hoặc bộ sinh biến thể có kiểm tra; dựng lại câu trên máy chủ, loại bản thiếu dữ liệu và trùng nội dung. Tối đa hai nhiệm vụ cùng nhóm nội dung trong ngày. Không gọi AI tạo và giao câu chưa kiểm chứng.

Máy chuẩn bị thêm tối đa một mức tối thiểu làm dự phòng; không tăng nghĩa vụ học sinh. Khi chọn lại sau chặng, các nguồn dự phòng được nạp cùng quyền hiện hành và kiểm lại. Lần chuẩn bị đầu giữa chặng giữ câu đang giao còn hợp lệ. Phần đã hoàn thành được giữ; ghi kế hoạch dùng so-khớp để hai thiết bị không ghi đè nhau.

Bản được giao riêng có qid riêng và chỉ tăng tiến độ một lần. Báo cáo phụ huynh đọc cùng định danh nhiệm vụ, kiểm metadata trên bản sao hồ sơ, không lập kế hoạch và không nhân đôi thống kê kỹ năng. Lịch sử vẫn giữ câu gốc/contentGroup: cùng nhóm cùng ngày không trở thành nhiều bằng chứng thành thạo độc lập. Nạp, tiếp tục và chấm dùng luồng máy chủ hiện có; đáp án không gửi xuống trước khi nộp.

Bảng `hanh_trinh_nguon_cau` chỉ thêm: lưu dự phòng, thiếu nguồn, mức tối thiểu, số câu đã xếp và thời điểm chuẩn bị theo học sinh × ngày. App thầy hiện số dự phòng và danh sách dạng trong kho cần bổ sung/củng cố nền, kèm số thiếu thực. Danh sách này là dấu hiệu theo các ứng viên hiện có, chưa phải kiểm kê toàn bộ kỹ năng không có câu.

Cron chuẩn bị tối đa hai em chưa có nguồn hôm nay mỗi phút, nghỉ trong ca mở và giờ cao điểm 20–23 giờ Việt Nam. Kế hoạch vẫn được cập nhật khi học sinh học; cron không ghi đáp án hay điểm. Khi không có cả câu gốc lẫn mẫu hợp lệ, hệ thống báo thiếu thật. Muốn mọi em đủ câu cần bổ sung nguồn đã kiểm chứng đúng những dạng thiếu; phần mềm không bảo đảm vô điều kiện từ kho rỗng.

Triển khai: migration chỉ thêm chạy trước Worker; kiểm bắt buộc gồm kiểm nguồn câu và kiểm bảng mới trên D1 thật. Lùi mã về mốc trước khi phát hành, giữ bảng mới và lịch sử học tập.
