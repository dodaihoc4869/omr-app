# Hỏi thầy cá nhân — vòng hỏi, tự thử và kiểm lại (16/10/2026)

Thầy đã duyệt đề xuất trong chat và yêu cầu **build, phát hành luôn**, giữ tốc độ và độ ổn định. Yêu cầu trực tiếp này cho phép triển khai ngay; ảnh Chromium ba khổ/sáng–tối là bằng chứng nghiệm thu trong PR. Không cần thêm vòng xin duyệt ảnh. Mốc đối chiếu: main `60ade92052f0915acf52877796d291275c870ac8`.

## 1. Mục tiêu và người dùng

- Học sinh nhận hướng dẫn theo kỹ năng liên quan, bằng chứng đã làm và mức hỗ trợ; không gán nhãn cố định yếu/giỏi.
- Hỏi xong có thể tự làm một câu tương đương **đã được duyệt**. Trả lời AI hay bấm hiểu không tự trở thành bằng chứng thành thạo.
- Thầy nhìn thấy các em cần giúp và những câu nhiều em cùng mắc. Giữ sổ hỏi hiện có.
- Giữ luật chấm, ca thi, dữ liệu học thật và tổng khối lượng ngày. Kiểm lại đi qua sổ/lịch ôn chung.

## 2. Bố cục

- Giữ hộp Hỏi thầy, màu và năm khuôn hiện có; phần mới chỉ nạp cùng hộp, không đi vào đường mở app.
- Một chỗ cần hiểu mỗi lần; em mở thêm minh hoạ hoặc gợi ý. Nhãn nhỏ “Trợ giảng AI của thầy Học”.
- Sau phản hồi hợp lệ, khi đã nộp câu gốc: “Tự làm một câu tương đương”; em đang làm chỉ nhận gợi ý.
- Câu kiểm vẽ bằng thẻ câu/ô số dùng chung; đang gửi khoá nút, xong có lời xác nhận đúng trạng thái máy chủ.
- Kiểm lại ở Tự sửa lỗi đi thẳng vào câu đã duyệt, không yêu cầu hỏi AI lại. Câu chưa có đợt lỗi nằm trong khu riêng, không tăng bộ đếm lỗi.
- Có đường “Cần thầy hỗ trợ”, báo đã gửi sau khi máy chủ thực sự lưu.
- Màn thầy: danh sách cần giúp nhóm theo câu, số em và kết quả tự thử, mở theo nhu cầu; không tải thêm khi mở app.

## 3. Trạng thái

- Đang tải, có câu, chưa có nguồn tương đương đã duyệt, đang gửi, lỗi/mất mạng, chờ kiểm lại, đã xác nhận theo luật, cần thầy.
- Trạng thái tiến bộ phân biệt đã được hướng dẫn, tự làm được trong phiên, chờ kiểm lại và khắc phục được xác nhận.
- Nhận trợ giúp hoặc kiểm ngay sau hướng dẫn là `assisted`; không tăng SPRT/đóng lỗi như một lần tự làm độc lập.
- Bản kiểm ở ngày khác phải qua cửa sổ không hỗ trợ và luật đóng lỗi hiện hành; không hạ chuẩn hai ngày/độ trễ/câu tương đương.

## 4. Dữ liệu và API

- Giữ `/hs/hoi-thay`, `/hs/hoi-tro-ly`; thêm ngữ cảnh vkn giới hạn theo đúng câu, đọc song song với dữ liệu đã có. Không gọi phát lại toàn bộ hồ sơ.
- Mọi kết quả chỉ từ token, không tin SBD hoặc lịch sử do máy em gửi. Không gửi tên/SBD sang mô hình.
- `/hs/hoi-tro-ly/kiem/mo`: phát hoặc khôi phục câu tương đương; chỉ trả whitelist đề, không đáp án hay cờ duyệt.
- `/hs/hoi-tro-ly/kiem/nop`: chấm snapshot máy chủ, khoá lần trả lời đầu, receipt idempotent; câu/version/assistance do máy chủ quyết định.
- `/hs/hoi-tro-ly/kiem/gui-thay`: yêu cầu giúp gắn đúng câu em được phép hỏi, lưu rồi mới báo thành công.
- `/gv/hoi-tro-ly/can-giup`: dữ liệu nhóm câu/em, sau cổng thầy. Lời thầy hỗ trợ dùng luồng được kiểm quyền, không tự đóng lỗi.
- Bảng mới chỉ-thêm để giữ snapshot/receipt/trạng thái yêu cầu giúp. Không thêm chỉ mục trên `su_kien_hoc` vì rủi ro đổi kế hoạch các truy vấn nóng (nhật ký 15/10).

## 5. Ngoại lệ

- Bấm lặp/mất phản hồi: cùng attempt trả đúng receipt cũ; payload khác bị từ chối; tranh chấp chỉ một lần được ghi.
- Đổi câu/đóng hộp: phản hồi cũ không cập nhật câu mới. Tải lại khôi phục từ máy chủ, không lưu đáp án riêng vào trình duyệt.
- Đề đổi phiên bản, câu nghi sai, khác khối/phạm vi, ca kiểm tra mở/chưa công bố: từ chối an toàn, không chấm bằng đáp án khác.
- Chưa có học liệu được duyệt: hiện đúng lý do và đường nhờ thầy; không sinh câu AI rồi coi là kiểm chứng chính thức.
- Chỉ có đáp án cuối: không bịa các bước em đã làm hoặc kết luận nguyên nhân; hỏi ngắn để phân biệt giả thuyết.

## 6. Chi phí và phát hành

- Không thêm D1, vòng nền hoặc nội dung nặng vào Hôm nay/sảnh/ca thi. Chỉ mở câu kiểm khi em bấm.
- Hồ sơ câu/skills có trần, không quét JSON toàn đề/sổ; không N+1. Hướng dẫn vẫn một lời gọi mô hình thông thường.
- Tận dụng bộ chấm, sổ học và luật ôn chung, không lập bộ bài giao thứ hai.
- Lịch kiểm đến hạn chỉ ưu tiên trong chỗ ôn/sửa hiện có, giữ câu mới và các cổng sẵn sàng. Hết chỗ thì giữ hàng đợi, không tăng tổng ngày. Các lượt ôn chung đúng phiên bản cũng được dùng làm bằng chứng; đủ chuẩn thì dọn lịch đặc biệt trong giao dịch được bảo vệ.
- Schema chỉ-thêm áp từng lệnh DDL qua API, sau cổng ca và trước Worker; không dùng nhập `--file` gây D1 ngừng phục vụ.
- Phát hành duy nhất từ nhánh sạch, PR, main mới nhất, không chồng lượt Claude; cổng ca dừng khi có ca mở.
- Lùi mã bằng revert PR; giữ toàn bộ bảng và receipt đã có dữ liệu thật.

## 7. Nghiệm thu

- Các bộ test mới: ngữ cảnh cá nhân/không bịa bước, quyền/khác em/đáp án ẩn, snapshot/lần nộp đầu/retry, hỗ trợ/đúng hạn/đóng lỗi, mất mạng/giao diện, nhóm cần thầy.
- TS app + server; vitest liên quan; toàn bộ vitest so **tên test** với main, không có đỏ mới.
- Build, `kiem:toc-do` 0 đỏ, màu 0, giữ màu 0, SW13/13; không nâng mốc.
- Đo riêng số đợt D1/ngân sách câu hỏi; ảnh Chromium ba khổ (dọc, ngang, desktop) sáng/tối, không lỗi/tràn, đích bấm đủ lớn.
- Sau phát hành: Worker/Pages cùng SHA, cổng quyền đúng, không có lỗi mới từ đường đọc và receipt, ghi giới hạn thực tế. Chưa đủ thời gian kiểm lại 7/14 ngày thì không tuyên bố đã tăng điểm.
