# Sửa ba app — kết quả tích hợp ngày 23/09/2026

Bản sửa nằm trong workspace `/Volumes/SSD NGOÀI/omr-app`. Chưa commit, push hay phát hành Cloudflare Pages/Worker; chưa thay dữ liệu học sinh thật. Báo cáo này cập nhật kết quả sau các báo cáo chẩn đoán đầu ngày.

## 1. Lên bảng chỉ bằng nút bấm

Theo yêu cầu cuối của thầy, màn chiếu dạy học và chữa bài đã bỏ đồng hồ, đếm ngược và tự gọi theo thời gian. Mỗi lượt chờ nút **Lên bảng**; bấm mới hiện thần thú và thẻ tên. Chuyển lượt rồi quay lại vẫn phải bấm. Trang chỉ có đáp án không hiện nút gọi học sinh. Hiệu ứng thần thú vẫn có thời gian hoạt ảnh riêng.

Kiểm tra trình duyệt cho cả hai chế độ: chờ giả lập 30 phút không tự gọi; bấm hiện thần thú/thẻ tên; lượt tiếp theo trở lại trạng thái chờ. Màn này không gửi số giây làm bài lên thuật toán hiệu chỉnh thời gian nữa.

## 2. Kết nối và chấm bài

- Giáo viên, học sinh và phụ huynh dùng cùng bộ nạp địa chỉ Worker HTTPS từ cấu hình công khai. Máy sạch không cần cấu hình lưu sẵn trong trình duyệt. Lần tải cấu hình thất bại có thể thử lại, không giữ mãi trạng thái lỗi; bỏ đường dự phòng localhost/Apps Script cũ không phù hợp.
- Kiểm tra công khai: cấu hình tại `https://omr-app-b3u.pages.dev/cau-hinh.json` tải được; Worker phản hồi OPTIONS cho đường vào ca với CORS. Đây chưa phải nghiệm thu một ca thi thật từ hai máy khác nhau.
- Chuẩn hóa khoảng trắng, dấu trừ Unicode và dấu phẩy/chấm ở đáp án số. Khóa đáp án thiếu hoặc sai định dạng không bị ngầm đổi thành A.
- Giữ chính sách chữ số có nghĩa của bài thi: `0.80` và `0.8` có thể khác theo yêu cầu đề; bài Mom/BTVN dùng so sánh giá trị số. Không sửa hàng loạt điểm đã lưu.
- Bài Mom lấy câu và khóa từ kho máy chủ, kiểm lại phạm vi của chính học sinh; không tin khóa hoặc cờ xác minh do trình duyệt gửi. Trước nộp chỉ trả nội dung đề; sau nộp mới xem lời giải. Bài cũ chưa xác minh được thì giữ câu trả lời để kiểm tra lại.
- Nộp lại giữ kết quả đã chốt và khôi phục sự kiện học/EXP nếu request trước bị dừng sau bước lưu bài. Đáp án gửi ở lần thử lại không thay kết quả lần đầu.

## 3. Rút câu theo từng học sinh

Phạm vi tự động lấy từ câu đã làm của chính em, không mở rộng chỉ vì bạn cùng lớp đã học. Câu mở rộng phải cùng mã dạng và đủ toàn bộ kiến thức nền đã có bằng chứng. Trùng tên chuyên đề không được coi là cùng dạng. Nếu qid trùng giữa các đề và lịch sử không xác định được nguồn, máy chủ không dùng qid đó để mở phạm vi.

| Kênh | Quy tắc sau sửa |
|---|---|
| Đảo thần thú | Phạm vi cá nhân; ưu tiên điểm yếu, câu tới hạn và câu chưa gặp; thử thách có giới hạn theo bậc. |
| Đoàn — câu cá nhân | Không vượt mức của em; từng làm sai câu khó không tự nâng bậc; thiếu nguồn thì giảm số câu. |
| Đoàn — câu trùm | Dạng và mọi kiến thức nền phù hợp với tất cả thành viên thật; độ khó không vượt mức vừa sức thấp nhất của đội. |
| Bài hằng ngày cho phụ huynh | Chỉ bù trong phạm vi em đã học; chống trùng nhóm nội dung và câu mới làm. |
| Phụ huynh giao thêm | Lọc lại tại máy chủ; tránh bài chưa nộp, câu vừa làm và bản sao; câu tới hạn được ôn đúng lịch. |
| Thử thách riêng | Đề xuất từ AI không tự mở khóa; máy chủ kiểm bằng chứng, độ khó và câu đã duyệt. |
| Thử sức/khắc phục cũ trong portal | Dùng bài/kế hoạch do máy chủ chốt thay vì lấy các câu đầu kho local. |
| Phiếu khắc phục/chọn câu sai | Phân bổ đúng tổng số yêu cầu; khử trùng mã và nội dung; không tự thêm câu khi yêu cầu 0 hoặc vượt số đã chọn. |
| Ôn cá nhân/kế hoạch ngày | Đọc hồ sơ đúng SBD và lịch tới hạn; không dùng kết quả của cả lớp. |
| BTVN/đề do giáo viên giao | Giữ phạm vi thầy đã giao; đây là lựa chọn giảng dạy trực tiếp, không phải tự động mở rộng. |
| Công cụ rút đề của giáo viên | Giữ chuyên đề thầy chọn; không áp phạm vi của một học sinh khi chưa chọn học sinh. |

Không rút câu đang được bảo vệ bởi ca thi hoặc bài chưa nộp qua các đường tự động liên quan. Các bộ chọn khử trùng mã/nhóm nội dung trong lượt; không cố lấp đủ bằng câu ngoài phạm vi. Độ chính xác phụ thuộc metadata dạng/kiến thức nền của kho; thiếu bằng chứng thì trả ít câu và báo thiếu.

## 4. Lịch lặp và Đoàn Hộ Tống

Đã thay lịch cố định bằng **FSRS-6**, qua `ts-fsrs` 5.4.2, mức nhớ mục tiêu 90%. Mỗi học sinh × qid có lịch riêng. Sai dùng Again, đúng dùng Good; không đoán độ khó từ tốc độ. Mỗi câu chỉ có một quan sát trong ngày; nếu có sai thì lần đúng lặp dồn trong ngày không đẩy lịch xa thêm. Câu bỏ trống không bị coi là đã học thành công.

Chọn dựa trên [thư viện chính thức](https://github.com/open-spaced-repetition/ts-fsrs) và [benchmark SRS](https://github.com/open-spaced-repetition/srs-benchmark). Đây là lựa chọn có cơ sở, chưa phải bằng chứng tối ưu mọi bài Hóa. Chưa huấn luyện trọng số cá nhân khi chưa có đủ dữ liệu. Hồ sơ cũ được dựng lại khi đổi phiên bản kế hoạch, không xóa sổ học.

Đoàn dùng 90/120/150 giây cho Phần I và 120/150/180 giây cho Phần III theo mức câu; trùm Phần II 180 giây. Cả hiệp dùng mức đủ cho câu lâu nhất và hạn do máy chủ giữ. Yêu cầu bỏ thời gian mới nhất áp dụng cho **lên bảng**, không bỏ hạn chơi Đoàn.

Giới hạn: lịch FSRS vẫn theo qid, chưa gộp mọi biến thể tương đương thành một thẻ ôn. Nhóm nội dung giúp giảm lặp nhưng không nhận diện được mọi biến thể ngữ nghĩa.

## 5. EXP, cấp 10 và khiên

| Thành phần | Luật áp dụng |
|---|---|
| Cấp 1 → 10 | Tổng 2.400 EXP đã hấp thụ. |
| Trần hấp thụ | 200/ngày đạt nhiệm vụ; 120/ngày có ít nhất 4 câu khác nhau đã có kết quả; 0 khi chưa đủ điều kiện. |
| Sớm nhất lên cấp 10 | 12 ngày đạt và có đủ EXP trong ví. Học thêm trong cùng ngày không vượt trần. |
| Khiên tặng đầu tiên | Đạt cấp 10 và ít nhất 21 ngày đạt nhiệm vụ. Không yêu cầu học sinh yếu phải thắng game. |
| Rèn thêm một khiên | 21 mảnh + 300 EXP; phải đạt mốc 21 ngày, còn ít nhất 400 EXP sau rèn, và chưa có 5 khiên rèn chưa dùng. |
| EXP dự trữ | Giữ 400 EXP trong ví khi đổi vàng hoặc rèn, tương ứng hai ngày hấp thụ tối đa. |
| EXP dư | Giữ trong ví; đổi vàng mua đồ hoặc chủ động rèn khiên. Không tự đốt EXP/mảnh khi vừa đủ ngưỡng. |

Khiên tặng và khiên rèn là hai khoản riêng: ở ngày đạt thứ 21, em đủ mảnh và ví có ít nhất 700 EXP có thể nhận khiên tặng rồi rèn thêm. Mốc 21 ngày là cổng tối thiểu cho khiên đầu tiên, không phải khoảng chờ bắt buộc giữa mọi lần rèn.

Chuyển luật giữ cấp đang có, giữ phần trần đã dùng trong ngày và hoàn chênh lệch giá cấp vào ví; chạy lại không hoàn lần hai. Không kéo tụt học sinh cũ về cấp 1. Vì vậy mốc 12 ngày là giới hạn cho tiến trình mới, không phải lệnh thu hồi cấp đã đạt.

Sửa thêm: ghi thưởng/trần game cùng giao dịch, chống hai request trùng tiêu trần hai lần; lưu trần theo ngày để thưởng bù ngày cũ không mở lại trần hôm nay; đếm chuỗi quá 7 ngày đúng; tổng EXP hôm nay gồm thưởng nấc game; khôi phục hậu xử lý khi gửi lại câu trả lời game. Hấp thụ, đổi vàng và rèn đều kiểm số dư phía máy chủ.

## 6. Giao diện và hiệu năng

- Sửa co giãn nội dung, nút, bảng và hộp thoại trên giáo viên/học sinh/phụ huynh. Sửa riêng bảng tin giáo viên bị cắt hàng ở 1280×800 do ngưỡng CSS không khớp chiều rộng thực sau padding.
- Thông báo học sinh: fixture 71 truy vấn xuống 1; cron 141 xuống 1 nhờ INSERT…SELECT theo lô.
- Kho câu dùng dữ liệu nhẹ để lọc, chỉ tải đầy đủ câu được chọn; chuẩn bị bộ lọc phạm vi một lần cho mỗi lượt. Fixture phụ huynh tăng từ 25 lên 250 ứng viên vẫn 16 truy vấn.
- FSRS tốn thêm CPU so với cộng ngày cố định: phép đo cục bộ trước đó 13,39 → 33,99 ms cho 10.000 log. Không thêm truy vấn từng câu; chỉ dựng lại khi sổ/phiên bản đổi. Không gọi đây là cải thiện CPU hay khẳng định máy chủ nhanh nhất.

## 7. Kiểm chứng và giới hạn phát hành

Các phép thử dùng dữ liệu giả lập/SQLite cục bộ, không tạo ca hay sửa điểm trên production.

| Kiểm tra | Kết quả |
|---|---|
| Build production (gồm TypeScript frontend) | Đạt. |
| TypeScript server | Đạt. |
| 37 file kiểm thử tập trung cho các sửa đổi và hợp đồng liền kề | **782/782 đạt**. |
| Lên bảng trong Chromium | Hai chế độ đạt; chờ 30 phút không tự gọi, bấm hiện thần thú/thẻ tên, lượt mới chờ bấm. |
| Tràn giao diện | **96 cảnh đạt**: 6 màn, 4 bề rộng, chữ 100/115%, sáng/tối; thêm hộp thoại thấp 320px. |
| Bảng tin giáo viên trong Chromium | **16/16 đạt**, gồm 1280×800 và các màn điện thoại. |
| `git diff --check` | Đạt. |

**Toàn bộ bộ kiểm thử chưa xanh.** Lượt chạy cuối có 11.082 đạt, 83 không đạt, 1 bỏ qua. Một ca cấm tự luận còn dùng fixture trùm Vận dụng cho học sinh mức Biết đã được sửa fixture; chạy lại cả file đạt 32/32. Tổng hợp sau lượt kiểm lại: **11.083 đạt, 82 không đạt, 1 bỏ qua**. Các kiểm thử còn đỏ được giữ nguyên và liệt kê trong [danh sách còn tồn](kiem-thu-con-ton-2309.md). Nhiều ca gắn với hợp đồng cũ hoặc thay đổi có sẵn trước lượt sửa này; chưa kết luận mọi ca còn lại đều chỉ do kiểm thử. Không coi build thành công là toàn bộ sản phẩm đã được nghiệm thu.

Nhật ký trên máy: `/tmp/omr-final4-tests-2309.json`, `/tmp/omr-cam-tu-luan-final-2309.json`, `/tmp/omr-build-final-2309.log`, `/tmp/omr-ts-final-2309.log`, `/tmp/omr-board-final-2309.log`, `/tmp/omr-ui-final-2309.log`. Ảnh màn lên bảng nằm ở `/tmp/omr-len-bang-2309/`.

Các giới hạn còn phải nghiệm thu khi phát hành: một ca thật từ hai thiết bị; độ trễ Worker/D1 với tải thực; chất lượng metadata và mức lặp trên dữ liệu học sinh thật; kết quả học dài hạn của lịch FSRS. Không suy kết quả thử nghiệm cục bộ thành những nghiệm thu này.
