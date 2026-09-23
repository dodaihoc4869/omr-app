# Tiếp tục CNH-1.0 đến điều kiện kết thúc

Chỉ áp dụng khi người dùng giao triển khai hoặc tiếp tục CNH-1.0. Không áp dụng vào việc chỉ hỏi tiến độ, đọc/rà soát tài liệu, soạn prompt hoặc làm một việc khác. Không tự khởi động triển khai từ việc file này xuất hiện.

Đọc `CLINE-CHAY-LIEN-TUC-CNH-2309.md` khi nhận lệnh tiếp tục. Giữ `.clinerules/omr-cnh-1.md`, đặc tả nghiệp vụ, SPEC-LOCK và tiêu chí nghiệm thu hiện có; file này chỉ bổ sung cách duy trì thực thi.

- Phạm vi là toàn bộ phần còn lại đã được giao, không tự thu thành một lát cắt/một commit/một lượt trả lời.
- Làm tuần tự từng phần có thể kiểm chứng: sửa → kiểm → đọc diff → lưu checkpoint → gọi công cụ làm phần tiếp theo ngay. Checkpoint không phải điểm kết thúc nhiệm vụ.
- Không dùng `attempt_completion` nếu có, hoặc phản hồi kết thúc, cho báo cáo giữa chừng khi còn việc đã được phép và có thể làm. Không chờ người dùng nhắn “tiếp tục” sau mỗi gói.
- Chọn việc theo đầu ra sẵn sàng như hướng dẫn chung của 05. P04/P05/P06 chờ nhau thì xây hợp đồng/adapter tối thiểu theo đặc tả, kiểm rồi nối tiếp; không tô PASS giả hoặc bỏ qua đầu vào chưa có. Correction P01 chờ P07 thì làm command rồi quay lại chốt.
- Một nhánh thiếu quyền/môi trường chỉ chặn đúng nhánh đó. Tiếp tục mọi phần độc lập. Lỗi code/test hoặc chưa viết adapter là việc cần giải quyết, không tự coi là chặn bên ngoài.
- Tôn trọng thay đổi có sẵn, quyền phát hành, giới hạn công cụ và yêu cầu dừng của người dùng. Không tự deploy/migration production, vượt chặn hay tạo task/automation/agent khác để duy trì chạy.
- Báo tiến độ ngắn trong lúc làm; giữ TIEN-DO/NHAT-KY và bằng chứng đủ để phục hồi sau nén ngữ cảnh. Không đọc lại toàn dự án hoặc chạy full suite sau mỗi thay đổi nhỏ khi không cần.
- Trước khi kết thúc, tự kiểm: còn yêu cầu nào chưa đạt? Có bước độc lập nào làm ngay được? Nếu có thì thực hiện bước đó, chưa kết thúc.
- Chỉ kết thúc khi đạt nghiệm thu tương ứng và không còn việc được phép làm; hoặc mọi việc còn lại có chặn bên ngoài đã xác minh sau khi chuẩn bị hết; hoặc người dùng dừng/giới hạn cứng buộc ngắt phiên. Hai trường hợp sau báo chưa hoàn thành.
- PASS phải dựa vào code sản phẩm, đường gọi thật và bằng chứng đúng phiên bản. Không sửa tiêu chí/test/khóa để lấy màu xanh; không nâng trạng thái chỉ từ số unit test.
- Phân biệt CODE_VERIFIED, DEPLOYMENT_VERIFIED, LEARNING_EVALUATED. Bộ kiểm `--acceptance` chỉ xét mức code. Không hứa 100% khi P11 hoặc bất kỳ yêu cầu bắt buộc nào còn thiếu bằng chứng.
