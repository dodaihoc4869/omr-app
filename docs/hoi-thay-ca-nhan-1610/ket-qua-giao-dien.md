# Hỏi thầy cá nhân · kiểm giao diện 16/10/2026

Phạm vi: phần hỏi của học sinh, câu tự làm từ kho, lời thầy trực tiếp và thao tác hỗ trợ nhóm của giáo viên. Giao diện giữ bảng màu hiện tại; khối tự làm tải riêng sau khi nhận hướng dẫn. Báo cáo này không thay báo cáo kiểm máy chủ, D1, tốc độ mở app hoặc phát hành của lượt chung.

## Hành vi đã kiểm

- Mở hộp và nhận trả lời không tự gọi các lệnh kiểm chứng. Sau trả lời đúng phạm vi mới có lời mời; em đang làm câu chưa nộp không có lời mời này.
- Bấm tự làm mới lấy câu từ kho. Trắc nghiệm, đúng–sai và trả lời ngắn dùng `TheCau`/`OSoTraLoi` chung, không truyền đáp án đúng hay lời giải. Hướng dẫn, ô hỏi tiếp và nút mở lời giải được thu khi em tự làm.
- Câu luyện nhanh của AI ghi rõ chưa tính xác nhận khắc phục. Chỉ biên nhận máy chủ quyết định trạng thái; làm được trong phiên không được tự nâng thành xác nhận độc lập.
- Nhấp kép không gửi hai lần. Sau lỗi mạng, bài và `attemptId` của lần gửi đầu được giữ nguyên. Các lỗi phiên hết hạn, câu đổi hoặc đã nộp có nút lấy lại trạng thái từ máy chủ.
- Đóng/đổi câu khi phản hồi chưa về không làm câu cũ xuất hiện ở câu mới. Không ghi đề, bài làm hay đáp án vào localStorage/sessionStorage.
- Gửi thầy tại chỗ hiện “Đã gửi thầy”; lời thầy gửi qua máy chủ hiển thị bằng `ChemText`, kể cả lúc chưa có nguồn kiểm chứng. Gửi thành công và nộp thành công tải mới số Tự sửa lỗi bằng hàm dùng chung.
- Đến lịch kiểm lại, hàng có phiên Hỏi thầy trong Tự sửa lỗi mở thẳng câu kho bằng một lần bấm, không yêu cầu hỏi AI hoặc xem lại hướng dẫn. Mở trực tiếp theo mã câu cũng dùng đúng đường này; không có phiên thì giữ luồng sửa từng bước. Dùng token của màn, không bắt buộc trình duyệt lưu được phiên. Quay lại tải mới tiến độ và khôi phục chỗ cuộn/tiêu điểm khi câu đổi nhóm.
- Bảng giáo viên chỉ tải sau nút. Gom cùng lớp/cùng câu; gửi hướng dẫn có biên nhận và cập nhật nhóm tại chỗ, không xác nhận thay học sinh đã hiểu.

## Kiểm tự động

```sh
npx vitest run tests/hoi-thay-kiem-chung-giao-dien-1610.test.tsx tests/hoi-them-thay-giao-dien-1310.test.tsx tests/hoi-thay-tra-loi-giao-dien-1310.test.tsx tests/hoi-thay-khuon-giao-dien-1510.test.tsx --reporter=dot
npx vitest run tests/tu-sua-loi-kiem-hoi-thay-1610.test.tsx --reporter=dot
npx tsc -b
node scripts/kiem-hoi-thay-ca-nhan-1610.mjs
```

Nhóm giao diện gồm kiểm mới và tương thích các khuôn cũ. Chỉ thay kỳ vọng nhãn trợ giảng AI theo đề xuất thầy duyệt 16/10; không bỏ test cũ.

## Chromium thật

Script dùng linh kiện React thật và API giả được Playwright chặn; không dùng dữ liệu học sinh, không ghi D1. Ba khổ 390×844, 844×390 và 1440×900, mỗi khổ sáng/tối.

- 30 trạng thái học sinh: mời tự làm, mở câu, mất phản hồi nộp, nhận biên nhận, đã gửi thầy.
- 12 trạng thái giáo viên: tải 8 yêu cầu thuộc 3 nhóm, gửi hướng dẫn cho nhóm 5 em rồi cập nhật tại chỗ.
- 12 trạng thái Tự sửa lỗi: trang đầu tải 100 mục nhưng thẻ ghi đúng 102 câu cần sửa trên 104 câu; trang sau có 4 mục và một mục lặp, tải xong có đúng 104 mục duy nhất, tổng cần sửa vẫn 102.
- 12 trạng thái kiểm lại trực tiếp từ danh sách: không gọi AI mới; nộp được nhận biên nhận, quay về tổng cần sửa cập nhật 102 xuống 101 theo máy chủ giả.
- 12 trạng thái kiểm lại riêng cho câu chưa từng có đợt lỗi: khu riêng không tăng số lỗi, mở trực tiếp đúng câu và không gọi AI lại.
- 78 trạng thái đạt: không lỗi JavaScript, không tràn ngang. Nút mới của học sinh và giáo viên cao ít nhất 48 px.
- 36 ảnh JPG, từng ảnh dưới 150 KB (lớn nhất 73.173 byte); [số đo từng trạng thái](anh/ket-qua.json). Fixture trong `giao-vien/` và `tu-sua-loi/` chỉ dùng kiểm Vite, không vào bản build.

## Giới hạn cần giữ khi phát hành

Các ảnh chứng minh cách hiển thị và hành vi khách với hợp đồng API; không chứng minh chất lượng câu trong kho hoặc tốc độ D1 thật. Hệ thống vẫn phải xác nhận bằng chứng độc lập ở máy chủ vì học sinh có thể đóng hộp, xem hướng dẫn từ kênh khác rồi quay lại. Kiểm TS, tốc độ, màu, SW, toàn bộ test và ca kiểm tra mở do lượt phát hành chung thực hiện.
