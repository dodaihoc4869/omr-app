# CNH-1.0 — hướng dẫn thực hiện bằng Cline và DeepSeek Flash

## 1. Bộ này làm gì

Chuyển bản đề xuất 18 bước thành yêu cầu có thể triển khai và nghiệm thu. Ngày lập 23/09/2026; HEAD lúc đọc là `8b67a00`. Kiểm toán trước dùng `36b83dd`; không coi hai mốc là cùng phiên bản. Bộ bàn giao không xác nhận code sản phẩm đã được sửa theo luật mới.

| Tệp | Dùng khi nào |
|---|---|
| `01-QUYET-DINH-DA-CHOT.md` | Luôn đọc; phạm vi, thuật ngữ, quyết định bắt buộc |
| `02-HOC-TAP-VA-RUT-CAU.md` | Chấm, phạm vi, hồ sơ, FSRS, thời gian, chọn câu, Đoàn |
| `03-EXP-CAP-KHIEN.md` | Thưởng, đạt ngày, cấp, khiên, cửa hàng, chuyển dữ liệu |
| `04-DU-LIEU-API-DONG-THOI.md` | Kiểu dữ liệu, hợp đồng API, giao dịch, revision, bảo vệ đề |
| `05-GOI-THI-CONG.md` | Thứ tự, phụ thuộc, tệp cần đọc và đầu ra từng gói |
| `06-NGHIEM-THU.md` | Các tình huống bắt buộc, mức bằng chứng và cách chấm hoàn thành |
| `07-PHAT-HANH-VA-DO-LUONG.md` | Hiệu năng, chuyển đổi, canary, rollback, đo học tập |
| `THAM-SO.json` | Giá trị máy đọc được; đồng bộ với 01–04 |
| `MAU-KET-QUA.json` | Đầu vào và đầu ra số học cố định, độc lập với code sản phẩm |
| `SPEC-LOCK.json` | Hash nội dung chuẩn và danh mục yêu cầu; phát hiện thay đổi vô ý, không phải chữ ký bảo đảm chống sửa |
| `TIEN-DO.json`, `NHAT-KY.md` | Trạng thái bền qua nhiều task; ban đầu toàn bộ chưa kiểm |
| `kiem-tra-bo-ban-giao.mjs` | Kiểm cấu trúc, phép tính mẫu và hồ sơ bằng chứng; không thay bộ test sản phẩm |

File Markdown dùng đường dẫn tương đối trong bộ để có thể chuyển sang máy khác. Các đường dẫn code trong tài liệu tính từ gốc repo `omr-app`.

## 2. Cấu hình DeepSeek và Cline

### 2.1. Xác nhận mô hình thật

Theo [thông báo chính thức DeepSeek ngày 10/09/2026](https://api-docs.deepseek.com/updates/), trên API trực tiếp DeepSeek, tên cũ `deepseek-v4-flash` hiện được chuyển sang V4.1 Flash; tên gọi hiện hành là `deepseek-flash`. Nếu đang dùng nhà cung cấp trung gian, quy tắc tên và định tuyến có thể khác. Ghi endpoint, provider, model ID được yêu cầu và phiên bản trả về nếu có; không suy phiên bản chỉ từ nhãn Cline. Không cần đổi một kết nối đang chạy trước khi xác minh.

Cấu hình provider theo [DeepSeek trong Cline](https://docs.cline.bot/provider-config/deepseek). Nếu provider có sẵn chưa hỗ trợ ID cần dùng, kiểm khả năng của [OpenAI Compatible](https://docs.cline.bot/provider-config/openai-compatible): base URL, model ID và khả năng tool call phải khớp endpoint thật. Giữ khóa API trong phần cài đặt bí mật, không chép vào repo.

### 2.2. Chọn chế độ để viết code

- Bật thinking nếu tích hợp hiện tại hỗ trợ. Khuyến nghị kỹ thuật của bộ này: `high` cho phần thông thường; `max` cho dữ liệu, giao dịch, EXP và rà soát. Không tự đổi mô hình của thầy.
- Theo [DeepSeek Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/), thinking hỗ trợ tool calls; `temperature` không có tác dụng ở chế độ này. Vì vậy không dùng “temperature = 0” như một bảo đảm chính xác. Tích hợp phải xử lý đúng trạng thái reasoning của API qua các lần gọi; không yêu cầu mô hình in suy nghĩ nội bộ vào tài liệu nghiệm thu.
- Không tự nhập giới hạn context/output quá lớn chỉ vì endpoint quảng cáo hỗ trợ. Kiểm giới hạn của provider/Cline đang dùng; giữ mặc định hợp lệ, tăng output chỉ khi bị cắt giữa bản vá. Mỗi bản vá nên nhỏ để còn đủ dung lượng đọc lỗi và sửa.
- Trước P00, thử một nhiệm vụ nhỏ: đọc một file, nêu tên hàm có thật, chạy lệnh chỉ đọc. Nếu tool call lỗi, xử lý kết nối trước khi giao migration.
- Plan dùng để khóa tác động của gói; Act dùng để thực hiện. Chỉ ngồi Plan không hoàn thành code. Cách gọi/nút tùy phiên bản Cline đang cài; không giả định có một menu chưa kiểm.

### 2.3. Ngữ cảnh và cách chia việc

[Tài liệu Cline](https://docs.cline.bot/core-workflows/task-management) khuyến nghị task có mục tiêu rõ; hội thoại dài có thể bị nén mất chi tiết. Bộ này dùng một gói tại một thời điểm, checkpoint sau gói, trạng thái lưu trên đĩa. Không nạp cả ổ SSD, kho media, build cũ hoặc toàn bộ lịch sử trò chuyện.

[Cline Rules](https://docs.cline.bot/customization/cline-rules) hỗ trợ quy tắc ở `.clinerules/`. Kiểm file `omr-cnh-1.md` được bật. Nếu phiên bản Cline không nạp nó, đưa đường dẫn vào prompt và yêu cầu đọc trực tiếp. Không cần cài plugin hay workflow riêng để dùng bộ này.

## 3. Thứ tự ưu tiên tài liệu

1. Yêu cầu trực tiếp mới nhất của chủ dự án.
2. Quyết định CNH-1.0 trong 01–04 và giá trị THAM-SO.json.
3. Kết quả mong đợi trong 06 và MAU-KET-QUA.json.
4. Kế hoạch triển khai 05, vận hành 07.
5. Bản đề xuất 18 bước và kiểm toán cũ để hiểu lý do.

Nếu 01–04, JSON và test mẫu mâu thuẫn: ghi lỗi đặc tả cùng ví dụ, không lặng lẽ sửa một bên. Tiếp tục các phần độc lập. Việc tên hàm/bảng ở code thay đổi chỉ cần cập nhật ánh xạ kỹ thuật, không được tự đổi quy tắc nghiệp vụ.

## 4. Ba mức hoàn thành

- **CODE_VERIFIED:** các yêu cầu thuộc code có test thật, không còn đường gọi bị bỏ sót, build/typecheck và các kiểm thử liên quan đạt, dữ liệu giả lập chuyển đổi đúng. Không đồng nghĩa production đã chạy.
- **DEPLOYMENT_VERIFIED:** đúng phiên bản đã phát hành, chuyển dữ liệu và đối chiếu đạt, ba app/hai thiết bị/mạng ngoài máy giáo viên đã kiểm. Nếu thiếu môi trường, trạng thái này chưa đạt.
- **LEARNING_EVALUATED:** thu thập đủ dữ liệu đo theo 07; có báo cáo hiệu quả và giới hạn. Không thể hoàn tất ngay trong một phiên code.

Không tính nghiên cứu chưa đến ngày đo thành lỗi lập trình; cũng không gọi triển khai là đã chứng minh hiệu quả sư phạm. Mục tiêu “100%” phải gắn với một trong ba mức trên và danh sách yêu cầu cụ thể.

## 5. Lệnh kiểm bộ bàn giao

Chạy từ gốc repo:

```sh
node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs
node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs --acceptance
```

Lệnh đầu kiểm chính bộ đặc tả và phép tính mẫu. Lệnh thứ hai cố ý thất bại khi yêu cầu code còn NOT_RUN/FAIL/BLOCKED hoặc thiếu bằng chứng. Không được báo code đã đạt chỉ vì lệnh đầu xanh. Bộ kiểm chỉ đối chiếu hồ sơ và file; người rà soát vẫn phải đọc nội dung bằng chứng, xác nhận test gọi đúng code và chạy lại.

Lấy fingerprint để ghi evidence bằng `node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs --fingerprint`. SPEC-LOCK khóa 01–07, tham số, kết quả mẫu, prompt và bộ kiểm; không khóa nhật ký/tiến độ đang cập nhật. Chỉ cập nhật khóa khi có thay đổi đặc tả được chủ dự án quyết định, kèm version và lý do. Không cập nhật khóa chỉ để lệnh kiểm hết báo lỗi.
