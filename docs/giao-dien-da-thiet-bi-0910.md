# Giao diện ba app trên điện thoại, xoay ngang và máy tính — 09/10/2026

Tiếp tục trên main `973ddded` (PR218/219), giữ bản duyệt V2 đã chạy: thầy có năm mục, phụ huynh có ba mục, học sinh có bốn mục. Không thay số liệu bằng số mẫu, không đổi bảng màu hoặc luật học/chấm.

- Thầy: nhịp học hiển thị thành thẻ có nhãn trên điện thoại, bảng trên màn rộng. Cùng dữ liệu và trạng thái tìm kiếm. Bốn mục Hành trình chia hai hàng trên điện thoại; mục tiêu chạm tối thiểu 48 px. Hôm nay và Hành trình có hai vùng ở ngang thấp khi đủ chiều rộng.
- Học sinh: sảnh máy tính đặt tiến độ ngày và việc tiếp theo cạnh nhau. Đề thử có bản đồ câu đã/chưa làm, chuyển câu đưa focus đến đúng câu; màn ngang/máy tính giữ bản đồ, đồng hồ và nút nộp bên cạnh đề. Điện thoại đặt bản đồ trước đề. Đổi khổ không remount câu hỏi hoặc xoá nháp. Hạn nộp, tự nộp, xác nhận nộp và đáp án sau nộp giữ nguyên.
- Phụ huynh: khi nguồn không làm mới được, giữ báo cáo đã tải và hiện lỗi cùng nút thử lại. Đổi SBD tạo phiên đọc mới; hook xoá báo cáo em trước, bỏ phản hồi đến muộn. Lời thầy chỉ nhận lượt đọc mới nhất. Không bổ sung quyền giao bài hoặc ghi dữ liệu học tập.

## Kiểm chứng

Bản build chụp ảnh dùng component thật, IO giả và chặn mạng ra ngoài; fixture chỉ nằm trong `scripts/chup-v2`, không đưa vào bản phát hành. Chromium kiểm dọc 390, ngang 844, máy tính 1440, sáng/tối; chọn câu, xoay giữ đáp án, chuyển câu và focus. Bằng chứng tại thư mục ngoài repo `/workspace/ui-da-thiet-bi-0910`.

90 kiểm liên quan đạt; 2 hồi quy đổi con/làm mới đạt; 29 kiểm ngang/game/hồi quy đạt. `build:cf` đạt, SW 13/13, precache 148 tệp/2981 KB; giữ màu 0 vi phạm. Toàn repo đang chạy và đối chiếu tên lỗi với main trước khi phát hành; không tuyên bố toàn repo xanh khi còn lỗi nền.

Không đổi máy chủ/schema/sổ/điểm. Phát hành qua `deploy.yml`, kiểm ca mở và lượt đang làm trước Worker/Pages, rồi kiểm bản sống cùng commit. Lùi bằng revert commit giao diện này; giữ dữ liệu học tập.
