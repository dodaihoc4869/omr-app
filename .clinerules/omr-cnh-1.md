# Quy tắc cho nhiệm vụ CNH-1.0

Áp dụng khi triển khai bộ `docs/cline-ca-nhan-hoa-2309`; không tự mở rộng các nhiệm vụ khác thành dự án này.

- Đọc `00-HUONG-DAN.md`, `01-QUYET-DINH-DA-CHOT.md`, `05-GOI-THI-CONG.md`, `TIEN-DO.json`; chỉ nạp tiếp tài liệu và code của gói hiện tại. Yêu cầu trực tiếp mới nhất của chủ dự án có ưu tiên cao hơn bộ này.
- 01–04 là đặc tả CNH-1.0; bản DE-XUAT dài là nguồn giải thích. Phần còn là lựa chọn trong bản đề xuất đã được chốt ở 01; không tự bật phần nghiên cứu ngoài phạm vi.
- Mỗi lần chỉ sửa một gói đủ phụ thuộc. Đọc code và nơi gọi trước khi chỉnh. Giữ các thay đổi có sẵn, không reset/clean ghi đè.
- Không bỏ qua kiểm phạm vi cá nhân, câu bảo vệ, trợ giúp, phiên bản, ngân sách hoặc trần thưởng trong bất kỳ fallback nào.
- Máy chủ quyết định câu, kết quả, ngày Việt Nam, trạng thái học, quyền thưởng và giao dịch. Không tin điểm/EXP/ngày/đã học do client khai.
- Test phải gọi code sản phẩm thật; test SQL đồng thời phải dùng runtime D1 tương ứng. Không mock chính phần đang cần chứng minh.
- Không sửa kết quả mẫu, bỏ test, skip test hoặc hạ tiêu chí để lấy trạng thái xanh. Được sửa test cũ trái đặc tả mới khi ghi rõ yêu cầu, hành vi cũ và thay thế tương ứng.
- Sau mỗi gói cập nhật `TIEN-DO.json` và `NHAT-KY.md` với bằng chứng thật. Không có log là NOT_RUN, không phải PASS.
- Không để lộ bí mật cấu hình hoặc dữ liệu nhận diện học sinh trong prompt/log. Dùng dữ liệu tổng hợp cho thử nghiệm.
- Có thể đọc/sửa/kiểm thử cục bộ trong phạm vi đã giao mà không hỏi lại. Phát hành theo quyền đã có; chuẩn bị kết quả cụ thể trước bước duyệt cuối nếu còn cần.
- Không tự khẳng định đã triển khai, đã kiểm hai thiết bị hoặc đã cải thiện học tập khi mới sửa code.
