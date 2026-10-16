# Hỏi thầy cá nhân — kết quả kiểm 16/10/2026

PR [318](https://github.com/dodaihoc4869/omr-app/pull/318), đối chiếu main `60ade920`. Mã chạy đã chốt `d5f88086`; chưa phát hành tại thời điểm viết mục này. Thầy đã duyệt đề xuất và yêu cầu build/phát hành khi cổng tốc độ, ổn định và ca thi đạt. [Đặc tả](hoi-thay-ca-nhan-1610.md), [ảnh và kiểm giao diện](hoi-thay-ca-nhan-1610/ket-qua-giao-dien.md).

## Thay đổi

- Trợ giảng đọc tối đa tám kỹ năng và tám lần làm liên quan của chính em, song song với dữ liệu câu. Dữ liệu thiếu/cũ được đánh dấu chưa chắc; chỉ có đáp án cuối thì không bịa bước sai. Giữ một lượt gọi mô hình cho một lần hỏi thông thường.
- Hỏi xong có câu tương đương từ học liệu đã duyệt. Máy chủ giữ snapshot và lần trả lời đầu; không đưa đáp án xuống trước nộp, không dùng câu AI chưa kiểm duyệt để xác nhận khắc phục.
- Kiểm lại ở ngày khác mở thẳng từ Tự sửa lỗi, không buộc hỏi AI lại. Câu chưa có đợt sai nằm trong khu riêng, không cộng vào số lỗi. Hỗ trợ thật, bao gồm lời giải sau nộp, không được nhầm thành bằng chứng độc lập của lần sau.
- Lượt kiểm riêng hoặc ôn chung đúng phiên bản có thể khép vòng khi đủ luật hiện hành: ngày độc lập, độ trễ, biến thể khi có và không vừa nhận hỗ trợ. Chỉ giao dịch có kiểm revision/watermark mới đóng đợt và dọn lịch đặc biệt; không sửa điểm lịch sử.
- Kiểm đến hạn chỉ thay slot ôn/sửa sẵn có. Câu mới, can thiệp/chẩn đoán và vai trò L4 được giữ; hết chỗ thì giữ hàng đợi. Không tăng tổng bắt buộc mỗi ngày.
- Thầy mở **Cài đặt → Hỏi Thầy (AI) → Chỗ cần thầy giúp** để xem theo lớp/câu và gửi hướng dẫn cho nhóm. Gửi có biên nhận, cập nhật tại chỗ; gửi hướng dẫn chưa tự xác nhận học sinh đã hiểu.
- Số Tự sửa lỗi lấy tổng toàn bộ, không kẹt ở 100; danh sách có phân trang chống trùng. Ba bảng mới chỉ-thêm và thuộc danh sách **GIỮ** của cả hai công cụ reset; không chạy reset hoặc xoá dữ liệu thật trong đợt này.

## Bằng chứng đã đạt

- Chromium: 78 trạng thái Hỏi thầy/Tự sửa lỗi/bảng thầy, ba khổ × sáng/tối; 36 ảnh, không lỗi JavaScript hoặc tràn ngang. Dùng linh kiện thật và API giả.
- Bản đóng gói cuối `d5f88086`: ba app qua entry thật, 18 tổ hợp và 11 tình huống bổ sung/PWA, không lỗi JavaScript, thiếu tệp, yêu cầu mạng ngoài fixture hoặc lộ đáp án.
- workerd/D1 cục bộ: 3/3, gồm tám mở/tám nộp cạnh tranh và phát lại biên nhận. Đây không phải thử tải production.
- Soát độc lập hai lõi chọn câu: 1.500 seed và fixture lỗi cũ, giữ toàn bộ mã câu mới, tổng câu, nhóm, can thiệp/chẩn đoán, vai trò L4 và cắt tỉa. Băm nguồn trước/sau giữ nguyên.
- Đã tái hiện và sửa: CAS lời thầy cùng mili giây; lấy nhầm bản câu cũ; bản tương đương trùng nguyên văn; lịch kiểm bị bỏ ngoài mẫu 96; ôn kiểm chiếm slot câu mới khi nợ trùng nhóm; đồng bộ dù ledger ghi lỗi; dấu hỗ trợ sau chấm; API mới trên iPhone cũ; thiếu phân loại giữ bảng mới.
- Sau hai sửa tương thích cuối: 99/99 test liên quan và 234/234 test thuộc bước CI từng đỏ đều đạt. Không bỏ/skip test. Các thay đổi kỳ vọng lời hướng dẫn/nguồn trợ giúp trong test cũ được ghi chú có chủ đích.
- Kiểm thêm 78 trạng thái Chromium khi chủ động bỏ API `crypto.randomUUID`: nộp/gửi lại vẫn chạy. Đây là mô phỏng thiếu API trên Chromium, không phải đo Safari/iPhone thật.
- Lọc lời gỡ cũ khỏi response của câu kiểm độc lập, giữ ở trạng thái hỗ trợ/chờ; 51/51 test các caller và 3/3 workerd/D1 đạt sau sửa. Không thay giao diện.
- Worker đóng gói thử thành công: 3.725,06 KiB, gzip 979,08 KiB ở `d5f88086`.

## Cổng cuối

Toàn bộ vitest trên `d5f88086` chạy 838 giây: **14.542 đạt / 122 đỏ / 27 bỏ qua**, so nền cùng môi trường **14.358 / 122 / 27**. Theo tên có 121 lỗi trùng nền và một lỗi mới ở test thứ tự khối `hoi-thay-khoi-giao-dien-1410`: kỳ vọng cũ chưa tính nhãn “Trợ giảng AI của thầy Học” đã được duyệt. Đối chứng đúng tệp: main 6/6, nhánh 5/6. Sửa có chủ đích duy nhất kỳ vọng này, thêm assert nhãn, không bỏ/skip test và không sửa mã chạy; **37/37 đạt** khi chạy lại tệp sửa cùng ba tệp TraLoiThay/Hỏi thêm liên quan. Theo tên không còn lỗi mới chưa xử lý; 121 lỗi còn lại trùng nền. Đây là lượt chạy riêng sau sửa test, không thay số 122 đỏ trong kết quả full gốc.

Một test đồng hồ KTCN đỏ trên nền nhưng đạt trong lượt full nhánh; không kết luận nâng cấp này sửa được lỗi đó. Một tên test đổi từ nhãn Thầy sang Trợ giảng theo giao diện đã duyệt; test tương ứng vẫn đạt, không mất tệp hoặc thêm skip. Hai lỗi khởi chạy Playwright thiếu trình duyệt vẫn là giới hạn môi trường. Không ghi đè JSON full gốc, không gọi toàn bộ bộ kiểm là xanh.

Cổng cuối trên `d5f88086` đã đạt: TS app/server, build:cf, `kiem:toc-do`, màu/giữ màu 0 vi phạm, SW13/13 (170 tệp / 2.895 KB). Không nâng mốc. Những lượt full đã dừng để sửa lỗi không được dùng làm kết quả cuối.

| Luồng máy chủ | Đợt D1 / số lệnh, trước và sau |
|---|---:|
| Sảnh lần đầu | 13 / 26 |
| Sảnh lần sau | 5 / 7 |
| Mở chặng | 6 / 13 |
| Nộp câu thường | 7 / 9 |
| Đếm hôm nay | 1 / 1 |

| Mở app | Main, byte gzip | Bản mới, byte gzip | Chênh |
|---|---:|---:|---:|
| Giáo viên | 258.654 | 258.794 | +140 |
| Học sinh | 291.049 | 290.961 | −88 |
| Phụ huynh | 249.218 | 249.360 | +142 |

Số tệp mở app giữ 21/43/26; cả ba nằm trong dung sai 1 KB hiện hành. Đây là số byte cần mở app, không phải khẳng định mọi mạng đều nhanh hơn.

## Giới hạn

Ảnh và kiểm trình duyệt dùng dữ liệu giả; các số đo D1 ở đây là số lệnh/đợt chờ local, không chứng minh độ trễ trên mọi mạng hoặc tải cao điểm thật. Chưa đủ thời gian đo hiệu quả học 7/14 ngày nên chưa kết luận tăng điểm. Khi thiếu câu tương đương đã duyệt, app báo đúng trạng thái và cho gửi thầy, không tạo bằng chứng giả.

Claude đã được mời soát trên PR qua kênh repository; chưa có xác nhận của Claude. Có soát độc lập trong nhóm Codex, không ghi thay tên người chưa soát.

## Vận hành

Phát hành qua `deploy.yml` từ main, một hàng chờ duy nhất. Runner Hỏi thầy chỉ nhận DDL tạo ba bảng/chỉ mục riêng, kiểm ca thường và chặng kiểm cá nhân đang làm trước khi áp qua API. Không thêm chỉ mục trên `su_kien_hoc`, không nhập `--file` cho schema mới. Worker lên trước, Pages theo sau; bước cuối xác minh hai nơi cùng SHA.

Lùi bằng revert merge PR318 sau khi qua cổng ca, giữ nguyên bảng/biên nhận và lịch sử đã ghi. Chưa gọi lệnh lùi trong đợt này.
