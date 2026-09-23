# Phạm vi cá nhân ngoài game — 23/09/2026

## Đã sửa

- `server/src/parent-news-nguon-cau.ts`: bài hằng ngày PH bỏ bù cả chuyên đề/cả lớp. Chỉ dùng các dạng có hồ sơ của chính em và lọc lại bằng bằng chứng câu học thật.
- `server/src/parent-news-chon-cau.ts`: bù chỉ trong allowlist dạng cá nhân; thiếu metadata không đoán; khử trùng `content_group` trong lượt, loại bản sao của câu mới làm. Câu đến hạn được ưu tiên; thiếu nguồn thì giảm số câu.
- `server/src/ph-giao-them.ts`: áp bộ lọc chung `readScope` + `learnedQuestionFilter`; câu cùng dạng nhưng thêm kiến thức chưa học bị loại. Chặn bản sao nội dung trong lượt, trong 14 ngày, bài đang giao và lần giao hôm nay. Câu thực sự đến lịch vẫn được ôn; đã làm hôm nay thì không giao lại.
- `server/src/thu-thach-rieng.ts`: đề xuất dạng của AI không tự mở khóa nội dung. Lọc bằng chứng riêng, trạng thái đã duyệt, đủ toàn bộ kiến thức trước khi xếp độ khó; khử bản sao và bản sao của bài đang giao/câu đã làm 14 ngày. Câu chốt từ bản cũ được kiểm lại trước khi hiện và nộp, không tự thêm câu thay thế, không ghi lại kết quả cũ.
- `src/screens/StudentPortalScreen.tsx`: nhánh “Thử sức” cũ dùng bài server đã chốt thay vì 2 câu vận dụng đầu kho local; nhánh “Khắc phục” cũ dùng kế hoạch ôn server thay vì luôn lấy 3–5 câu sai đầu danh sách. Cả hai dùng màn làm/nộp server hiện có.

## Luật phạm vi dùng chung

`readScope(env,sbd)` chỉ đọc bằng chứng em đó, không truyền `dangLop`. `learnedQuestionFilter` cho phép qid đã gặp hoặc cùng mã dạng với đầy đủ kiến thức bắt buộc thuộc bằng chứng cá nhân. Lọc khối và đề được bảo vệ vẫn giữ. Không suy ra đã học từ `nam_kt_dang` hoặc tên chuyên đề đơn lẻ.

Không sửa BTVN/đề mà giáo viên giao rõ: đó là phạm vi được thầy chọn hợp lệ, kể cả khi học sinh chưa có lịch sử. Không đổi điểm thật, không phát hành, không truy cập production trong phần này.

## Kiểm tra

- 75/75 test, 6 tệp: `pham-vi-ca-nhan-2309`, `parent-news-chon-cau-1909`, `ph-giao-them-may-chu-2109`, `thu-thach-rieng-may-chu-2109`, `khoi-cau-may-chu-kenh-phu-2109`, `thu-thach-chon-cau-2109`.
- Frontend `tsc -b` và server `tsc -p server/tsconfig.json` đạt ở lượt kiểm cuối.
- Fixture hồi quy cũ chỉ chèn hồ sơ tổng hợp được bổ sung một câu đã làm trong ca công bố của chính em (`tests/_pham-vi-ca-nhan.ts`). Không nới lại luật mới để chiều fixture.
- Regression mới: HS mới, hai em cùng lớp khác dạng, thiếu câu không bù, câu phối hợp thêm kiến thức chưa học, bản sao qid khác, đề chốt từ bản cũ, PH/giao-thêm thực, chuyển hai đường legacy sang server.
- Workload SQLite giả lập: 1 em, 1 bằng chứng, 25 và 250 ứng viên cùng dạng; 16/16 lệnh prepare cho `chonCauBaiHangNgay`, cache kho có phiên bản riêng. Đây là đo số truy vấn, không phải latency production. Mỗi endpoint đọc scope một lần; việc kiểm phạm vi thêm chi phí đọc so với trước, không có truy vấn riêng từng ứng viên.

## Kiểm toán kênh chưa sửa trong phần này

- Kế hoạch ngày/ôn lại lấy qid từ `nam_kt_cau` đúng SBD; không thấy hợp nhất lớp. Đọc/nộp có gate bằng chứng `su_kien_hoc`. Lịch đến hạn được FSRS agent xử lý riêng. Khử bản sao giữa các qid đã có trong hồ sơ/kế hoạch ôn là điểm cần đánh giá thêm trong kiểm toán tổng thể.
- BTVN nâng đỡ lấy trong `btvn_cau` của bài thầy giao; hồ sơ dùng SBD riêng. Thiếu bằng chứng thì thận trọng độ khó nhưng vẫn giữ phạm vi thầy giao, không coi đây là lỗi mở khóa lớp.
- `/kho/rut-cau` nhận chuyên đề do giáo viên chọn; không có SBD vì đây là công cụ tạo bài của thầy, không phải auto-extra cá nhân.
- Hàm local `src/lib/thu-thach-chon-cau.ts` còn giữ để tương thích/test cũ nhưng màn học sinh không còn gọi; đường thực đã chuyển sang server.

Bảng kiểm toàn bộ kênh và kết quả tích hợp: [báo cáo sửa ba app](bao-cao-hoan-thien-3-app-2309.md).
