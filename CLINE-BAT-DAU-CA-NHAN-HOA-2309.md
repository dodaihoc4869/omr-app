# Giao việc cho Cline + DeepSeek Flash

Phiên bản bàn giao: `CNH-1.0`, ngày 23/09/2026. Mở workspace **omr-app**, không mở cả ổ SSD làm gốc dự án.

## Thầy dùng như sau

1. Mở Cline tại thư mục chứa file này.
2. Đọc [hướng dẫn cấu hình và cách chạy](docs/cline-ca-nhan-hoa-2309/00-HUONG-DAN.md).
3. Dán nguyên prompt bên dưới. Cline bắt đầu P00, rồi làm tuần tự những gói đủ điều kiện. Khi cần đổi task, dùng prompt tiếp tục ở cuối file.
4. Xem `docs/cline-ca-nhan-hoa-2309/TIEN-DO.json` và bằng chứng đi kèm. Chỉ có lời báo “xong” chưa phải nghiệm thu.

## Prompt bắt đầu — sao chép nguyên khối

```text
Triển khai CNH-1.0 cho ba app giáo viên, học sinh và phụ huynh trong workspace này.

Đọc theo thứ tự:
1. .clinerules/omr-cnh-1.md
2. docs/cline-ca-nhan-hoa-2309/00-HUONG-DAN.md
3. docs/cline-ca-nhan-hoa-2309/01-QUYET-DINH-DA-CHOT.md
4. docs/cline-ca-nhan-hoa-2309/05-GOI-THI-CONG.md
5. docs/cline-ca-nhan-hoa-2309/TIEN-DO.json

Bắt đầu P00 nếu chưa có bằng chứng P00. Sau đó chọn gói đầu tiên chưa đạt mà các phụ thuộc đã đạt. Đọc đủ tài liệu, quy tắc và test được gán cho gói đó trước khi sửa. Làm một gói tại một thời điểm; trong gói, chia thành thay đổi nhỏ có kiểm thử. Được tiếp tục các gói tiếp theo khi đủ điều kiện, không chỉ đưa kế hoạch rồi dừng.

Đối chiếu code hiện tại; commit kiểm toán cũ chỉ là bằng chứng lịch sử. Giữ thay đổi có sẵn của người dùng. Không viết lại toàn dự án, không tạo engine song song bỏ quên nơi gọi cũ. Không tự nới phạm vi học, độ khó, trần thưởng hoặc tiêu chí kiểm thử để làm cho test qua. Không sửa tài liệu chuẩn và kết quả mẫu để hợp thức hóa code.

Mọi quyết định nghiệp vụ áp dụng theo 01, 02, 03, 04. Mọi tiêu chí nghiệm thu áp dụng theo 06. Những lựa chọn nghiên cứu ghi ngoài phạm vi CNH-1.0 phải giữ tắt. Nếu dữ liệu thực tế thiếu, dùng nhánh xử lý thiếu dữ liệu đã quy định; không bịa dữ liệu hay kết quả.

Với mỗi gói: xác định đường gọi thật → tái hiện lỗi khi có → viết kiểm thử kết quả mong muốn → sửa → chạy kiểm thử liên quan → đọc diff → cập nhật TIEN-DO.json, NHAT-KY.md và bằng chứng. Kiểm thử phải gọi code sản phẩm, không sao chép công thức vào test rồi tự so với chính nó.

Khi gần hết ngữ cảnh hoặc bị gián đoạn, ghi chính xác file đã sửa, test đã chạy, lỗi còn lại và bước tiếp theo vào NHAT-KY.md. Khi tiếp tục phải đọc lại trạng thái trên đĩa. Không được biến việc mất ngữ cảnh thành lý do đổi yêu cầu.

Mục tiêu là hoàn thành đủ yêu cầu có bằng chứng. Báo riêng: hoàn thành code; xác minh triển khai; đo hiệu quả học tập. Không gọi ba mức đó là một. Chỉ ghi PASS cho một kiểm thử khi có kết quả chạy thật đúng phiên bản code. Nếu chưa có môi trường hoặc dữ liệu để kiểm tra, ghi BLOCKED/NOT_RUN và tiếp tục phần độc lập làm được.

Không triển khai hay thao tác dữ liệu thật chỉ để thử nghiệm. Chuẩn bị đầy đủ bản phát hành, chuyển dữ liệu, rollback và bằng chứng trước; thực hiện phát hành theo phạm vi đã được chủ dự án cho phép. Không tự phát sinh yêu cầu xin phép cho các bước đọc/sửa/kiểm thử cục bộ đã được giao.
```

## Prompt tiếp tục sau khi đổi task hoặc hết ngữ cảnh

```text
Tiếp tục triển khai CNH-1.0 trong workspace hiện tại. Đọc CLINE-BAT-DAU-CA-NHAN-HOA-2309.md, .clinerules/omr-cnh-1.md, docs/cline-ca-nhan-hoa-2309/TIEN-DO.json và NHAT-KY.md. Kiểm git diff và bằng chứng đang có. Chọn gói đầu tiên chưa đạt có đủ phụ thuộc trong 05-GOI-THI-CONG.md; đọc đặc tả tương ứng rồi thực hiện. Không làm lại phần đã được kiểm chứng nếu code không thay đổi; không coi trạng thái cũ là PASS nếu bằng chứng đã lỗi thời. Tiếp tục tới khi xong các phần làm được và báo đúng phần còn thiếu.
```

## Prompt rà soát độc lập trước nghiệm thu

```text
Rà soát CNH-1.0 với vai trò người nghiệm thu. Chưa sửa code trong lượt rà soát đầu tiên. Đọc 01, 06, TIEN-DO.json; đối chiếu từng yêu cầu với code sản phẩm, nơi gọi thật và test. Tìm đường bỏ qua bộ lọc, đếm EXP hai lần, CAS thất bại nhưng ledger vẫn ghi, fallback nới khó, dữ liệu cũ mất quyền, chấm sai tương đương số, timer gọi lên bảng còn hoạt động. Chạy lại các kiểm thử quan trọng. Báo lỗi với file/dòng, tình huống tái hiện và yêu cầu bị vi phạm. Phân biệt bằng chứng chưa có với lỗi đã chứng minh. Không tự nâng trạng thái PASS vì tác giả code nói đã xong.
```

## Lưu ý về “100%”

Bộ này khóa yêu cầu và cách kiểm tra để giảm tối đa việc mô hình tự đoán. Không prompt nào bảo đảm một mô hình luôn viết code không lỗi. “Đủ 100% yêu cầu CNH-1.0” chỉ được báo khi toàn bộ yêu cầu bắt buộc có bằng chứng tương ứng; hiệu quả sư phạm dài hạn vẫn cần thời gian đo thật.
