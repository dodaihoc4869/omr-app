# Báo cáo Code 1 — kết nối ca và chấm điểm, 23/09/2026

## Nguyên nhân đã xác nhận

- Máy mới không có cấu hình Worker trong IndexedDB. Nếu lượt đọc `cau-hinh.json` lúc khởi động trượt, lời hứa nạp bị giữ mãi và API ca thi chỉ đọc cấu hình rỗng; máy khác không mở được ca dù máy thầy có địa chỉ.
- Địa chỉ Worker được đọc theo nhiều đường với luật khác nhau; URL cũ trong `scriptUrl` hoặc địa chỉ đã nhớ có thể lấn cấu hình mới. Ô cài đặt cũ cũng lưu `scriptUrl` mà không đồng bộ `mayChuMoi`.
- Phần III có nhiều chỗ tự so đáp án nên trạng thái đúng/sai, danh sách câu sai và điểm có thể lệch nhau. Khóa đáp án rỗng/hỏng không được nhận diện; Mom từng dùng mặc định `A` khi khóa thiếu.

## Đã sửa

- Cho phép nạp lại địa chỉ sau lượt khởi động lỗi; API dùng cùng bộ tìm địa chỉ Worker, đọc lại cấu hình công khai trên máy sạch. URL mới trong cấu hình thắng địa chỉ đã nhớ. Chỉ nhận URL HTTPS có thể dùng trên máy khác; từ chối localhost, loopback và Google.
- Ô lưu URL cũ đồng bộ vào cấu hình Worker, thông báo lỗi nhập URL trước khi lưu. `loadScriptUrl()` trả địa chỉ hợp lệ của cấu hình chung trước, rồi mới xét khóa cũ.
- Chuẩn hóa đáp số III thống nhất cho dấu trừ, khoảng trắng Unicode, dấu phẩy/chấm; vẫn phân biệt chữ số có nghĩa (`0,80` khác `0,8`). Khóa I/II/III sai khuôn khiến lượt chấm báo lỗi. Danh sách câu sai lấy trực tiếp từ kết quả chấm; chi tiết câu, thẻ xem lại và phiếu HTML không nhận đáp án rỗng là đúng.
- Mom không còn suy ra `A`; khi tạo bài từ khóa lỗi thì từ chối, khi nộp bài cũ có khóa lỗi thì lưu câu trả lời nhưng không chốt điểm. Cờ đúng/sai từng câu và sổ sự kiện dùng cùng khóa đã kiểm tra.

## Kiểm tra

- `npx vitest run tests/cham-ca-code1-2309.test.ts tests/review-cham-ket-noi-2309.test.ts tests/review-ket-noi-2309.test.ts tests/cham-so-2109.test.ts tests/mom-delivery.test.ts tests/cam-tu-luan-may-chu-2109.test.ts tests/dia-chi-may-chu-mot-nguon-1509.test.ts tests/ket-noi-ca-may-sach-2309.test.ts tests/dau-tru-phan-ba-1009.test.ts tests/cham-tai-cho-dung-luat-2109.test.ts`: **10 tệp, 120/120 test đạt**.
- `npx tsc -b --pretty false`: **đạt**.
- Test mới bao phủ máy sạch, nạp lại sau lỗi, ưu tiên URL mới, chặn URL không dùng chung, đáp số 0/rỗng/dấu Unicode, khóa sai ở cả ba phần và Mom giữ bài làm khi khóa lỗi.

## Giới hạn và bàn giao

- Đây là kiểm thử local với dữ liệu giả lập. Chưa xác minh bằng hai thiết bị/mạng độc lập hoặc ca thật; không đổi điểm cũ, không tạo ca thật, không phát hành.
- Code 3 cần chạy bộ test và build toàn dự án sau khi các vùng edit khác chốt. Boss kiểm tra luồng hai thiết bị sau phát hành bằng ca thử riêng trước khi kết luận lỗi kết nối đã hết trên môi trường chạy.
