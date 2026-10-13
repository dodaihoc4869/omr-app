# Bỏ mẫu Mom tự chấm sai, giữ màu app

Thầy yêu cầu tự sửa lỗi và bỏ mã không còn phù hợp. Mẫu `htmlKetQua` trong `nopBaiCuaMom` của StudentPortal tự dựng điểm/lời giải từ đáp án mặc định A; câu công khai không có đáp án nên có thể khác kết quả máy chủ. Bản sửa bỏ mẫu này, dùng `momReviewHtml(review)` đã có sau khi máy chủ xác nhận nộp. Các khai báo CSS, biến màu, trạng thái và bảng màu của ba app giữ nguyên.

Máy kiểm màu so văn bản nên coi các màu trong mẫu sai đã bỏ là đổi màu. Ngoại lệ chỉ trừ khai báo màu nằm trong **toàn initializer** `htmlKetQua` của đúng hàm và đúng tệp trên, khi initializer không còn tồn tại. Chỉ áp cho trạng thái sửa `M` và hash SHA256 chính xác của initializer legacy; không lấy mẫu từ hàm con. Không bỏ qua toàn tệp, không cho màu thô mới; đổi màu ngoài mẫu, sửa một phần mẫu, mẫu khác hoặc xoá cả tệp vẫn bị chặn. Bảy kiểm thực thi CLI với repo giả khoá phạm vi này. Soát độc lập đã bắt và khóa ba phạm vi hở trước khi phát hành.

Mốc `origin/main` sau khi đã bỏ mẫu không còn initializer nên ngoại lệ tự hết tác dụng. Không nhét CSS chết vào app chỉ để vượt cổng. Đây là sửa kết quả sai, không phải thay thiết kế/bảng màu của ba app.
