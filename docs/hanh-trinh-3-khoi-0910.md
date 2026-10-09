# Hành trình giỏi hoá — ba khối, kế hoạch mỗi ngày

Lệnh người dùng ngày 09/10/2026: gộp toàn bộ chiến dịch thành ba Hành trình khối 10, 11, 12; giáo viên chỉ bổ sung kiến thức. Mức tối thiểu/ngày là 24 câu nền, 30 câu hiểu, 36 câu vận dụng; tổng hợp giữ 36 câu. Không cộng các tầng thành 90 câu.

## Hành vi triển khai

- Cron đầu tiên sau phát hành tạo ba chiến dịch `hanh-trinh-v3-khoi-10/11/12`, sao lưu chiến dịch nguồn đang chạy và đóng nguồn trong một batch. Không sửa/xoá sổ học, điểm hoặc nội dung nguồn. Mốc lịch sử giữ từ chiến dịch sớm nhất.
- Ca đang mở thì hoãn. CHECK trong batch kiểm lại ca; CAS kiểm trạng thái/danh sách nguồn để tránh gộp từ ảnh chụp cũ. Tài khoản hiện có chưa rõ khối thì không gộp. Tham chiếu nguồn không còn tài khoản được giữ nguyên trong bản sao/lịch sử, không tự tạo tài khoản hoặc giao câu cho mã đó; biên nhận ghi số tham chiếu này.
- Kho được đồng bộ tối đa mỗi 5 phút: câu đã duyệt, không tự luận, xác định đúng khối; học sinh chưa khoá có khối rõ ràng được nhận vào Hành trình đúng khối. Không cần tạo chiến dịch mới hay bấm giao.
- Chỉ nạp tối đa 96 ứng viên mỗi tầng cho mỗi em/ngày, cộng câu trong kế hoạch và lỗi cần xử lý; không nạp toàn bộ kho vào mỗi lần mở Sảnh. Kho ứng viên xoay theo em/ngày. Chọn cuối cùng theo trạng thái, lịch ôn, tầng sẵn sàng và trọng số OMNI.
- Tầng nội dung khác với hạng năng lực L1–L4 cũ: nền = NB/biet, hiểu = TH/hieu, vận dụng = VD/van_dung sao 0–1, tổng hợp = VDC/sao ≥2. Câu chưa rõ mức không tự coi là nền.
- Mở tầng theo từng bài khi ≥80% nhóm nội dung ở tầng trước đã vững; dạng vững OMNI dùng SPRT, câu dùng luật thành thạo/đóng lỗi hiện có. Không có bằng chứng tầng trước thì không tự mở. Một bài lên tầng cao không mở các bài khác.
- Chốt mức tối thiểu đầu ngày. Sau mỗi chặng 6 câu chọn lại phần chưa làm; không đổi phần đã làm hoặc nhân chỉ tiêu khi mở hai máy. Câu bị bảo vệ/rút khỏi kho được xử lý ngay. Đảo và Đoàn đã có chuyến/chặng 6 câu.
- Mỗi nội dung chỉ tính một lần/ngày. Nộp hợp lệ tính lượt dù sai; lượt dùng hỗ trợ tính hoạt động nhưng không thay luật bằng chứng thành thạo. Đọc lời giải, lướt, chẩn đoán bước sai không được tính như lượt câu gốc. Ca chưa công bố không tính.
- Thiếu câu đủ điều kiện thì báo số thiếu; không lặp hoặc kéo ôn sớm để đủ chỉ tiêu. Không tự Huyết Chiến để gấp đôi khối lượng.
- Sảnh và bảng thầy hiển thị tiến độ hôm nay/chặng/số thiếu. Bảng Hành trình chỉ đọc kế hoạch ngày, tránh replay toàn kho × toàn khối. Nguồn đóng vẫn đọc được qua mã chiến dịch cũ để xem lịch sử.

## Giới hạn được giữ rõ

Đây là triển khai ba Hành trình và kế hoạch 24/30/36 dựa trên OMNI, luật đóng lỗi và lịch nhớ hiện có. Chưa thay FSRS bằng hồi quy half-life, chưa có contextual bandit hoặc đồ thị vi kỹ năng tự học; các đề xuất nghiên cứu đó không được coi là đã triển khai. Cổng tầng hiện tại ở mức bài, chưa phải đồ thị tiên quyết tới từng vi kỹ năng. Tập ứng viên có giới hạn nên số thiếu cũng có thể do chưa đủ ứng viên trong cửa sổ ngày, không khẳng định toàn kho hết câu.

## Phát hành / đối chiếu

Chỉ phát hành từ main qua workflow hiện có, sau build app + tsc server + test. Cron ghi mốc `cau_hinh.hanh_trinh_3_0910_v1`. Kiểm ba dòng đang chạy, nguồn đã đóng có bản sao, sổ học/điểm không thay đổi. Nếu ca mở, trạng thái chuyển tiếp chờ cron sau, không coi là đã gộp.

Lùi mã bằng revert commit; dữ liệu nguồn được lưu nguyên JSON ở `hanh_trinh_v3_nguon`. Việc mở lại nguồn cần kế hoạch phục hồi riêng, đối chiếu dữ liệu mới phát sinh, không tự khôi phục chồng lên Hành trình đang có học sinh làm.

Kiểm tra: 16 kiểm riêng (gộp nguyên tử, kho nhiều trang, học sinh khoá/chưa rõ khối, hai máy, tầng/sàn/chặng, bảng thầy); hồi quy kế hoạch/UI 103 kiểm đạt. Full vitest được chạy; đối chiếu các tệp đỏ trên bản gốc và bản mới còn cùng 127 lỗi nền, gồm nhóm timeout không ổn định. TypeScript app/server, build Cloudflare và SW 13/13, kiểm màu/giữ màu, soi giao diện không có lỗi. Chưa có ảnh Chromium thật vì môi trường chặn CDN tải trình duyệt.
