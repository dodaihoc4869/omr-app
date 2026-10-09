# Hành trình giỏi hoá — ba khối, kế hoạch mỗi ngày

Lệnh người dùng ngày 09/10/2026: gộp toàn bộ chiến dịch thành ba Hành trình khối 10, 11, 12; giáo viên chỉ bổ sung kiến thức. Mức tối thiểu/ngày là 24 câu nền, 30 câu hiểu, 36 câu vận dụng; tổng hợp giữ 36 câu. Không cộng các tầng thành 90 câu.

## Hành vi triển khai

- Cron đầu tiên sau phát hành tạo ba chiến dịch `hanh-trinh-v3-khoi-10/11/12`, sao lưu chiến dịch nguồn đang chạy và đóng nguồn trong một batch. Không sửa/xoá sổ học, điểm hoặc nội dung nguồn. Mốc lịch sử giữ từ chiến dịch sớm nhất.
- Ca đang mở thì hoãn. CHECK trong batch kiểm lại ca; CAS kiểm trạng thái/danh sách nguồn để tránh gộp từ ảnh chụp cũ. Tài khoản hiện có chưa rõ khối thì không gộp. Tham chiếu nguồn không còn tài khoản được giữ nguyên trong bản sao/lịch sử, không tự tạo tài khoản hoặc giao câu cho mã đó; biên nhận ghi số tham chiếu này.
- Kho được đồng bộ tối đa mỗi 5 phút: câu đã duyệt, không tự luận, xác định đúng khối; học sinh chưa khoá có khối rõ ràng được nhận vào Hành trình đúng khối. Không cần tạo chiến dịch mới hay bấm giao.
- Chỉ nạp tối đa 96 ứng viên mỗi tầng cho mỗi em/ngày, cộng câu trong kế hoạch và lỗi cần xử lý; không nạp toàn bộ kho vào mỗi lần mở Sảnh. Kho ứng viên xoay theo em/ngày. Chọn cuối cùng theo trạng thái, lịch ôn, tầng sẵn sàng và trọng số OMNI.
- Tầng nội dung khác với hạng năng lực L1–L4 cũ: nền = NB/biet, hiểu = TH/hieu, vận dụng = VD/van_dung sao 0–1, tổng hợp = VDC/sao ≥2. Câu chưa rõ mức không tự coi là nền.
- Mở tầng theo từng bài khi ≥80% nhóm nội dung ở tầng trước đã vững; dạng vững OMNI dùng SPRT, câu dùng luật thành thạo/đóng lỗi hiện có. Không có bằng chứng tầng trước thì không tự mở. Một bài lên tầng cao không mở các bài khác.
- Chốt mức tối thiểu đầu ngày. Sau mỗi chặng 6 câu chọn lại phần chưa làm; không đổi phần đã làm hoặc nhân chỉ tiêu khi mở hai máy. Khi em đã làm hết số câu hiện có mà còn thiếu sàn, nội dung mới được lấy ngay trong ngày, không chờ chặng đủ 6 hoặc ngày sau. Câu bị bảo vệ/rút khỏi kho được xử lý ngay. Đảo và Đoàn đã có chuyến/chặng 6 câu.
- Mỗi nội dung chỉ tính một lần/ngày. Nộp hợp lệ tính lượt dù sai; lượt dùng hỗ trợ tính hoạt động nhưng không thay luật bằng chứng thành thạo. Đọc lời giải, lướt, chẩn đoán bước sai không được tính như lượt câu gốc. Ca chưa công bố không tính.
- Thiếu câu đủ điều kiện thì báo số thiếu; không lặp hoặc kéo ôn sớm để đủ chỉ tiêu. Không tự Huyết Chiến để gấp đôi khối lượng.
- Sảnh và bảng thầy hiển thị tiến độ hôm nay/chặng/số thiếu. Bảng Hành trình chỉ đọc kế hoạch ngày, tránh replay toàn kho × toàn khối. Nguồn đóng vẫn đọc được qua mã chiến dịch cũ để xem lịch sử.

## Động cơ v4 — bổ sung ngày 09/10

- `do-thi-tien-quyet.ts`: mỗi vi kỹ năng có tầng L1–L4; câu trên tầng nền cần mọi kỹ năng ở tầng trước qua SPRT, nền `nen:*` cần hồ sơ vững. Cổng 80% theo bài vẫn giữ, cổng vi kỹ năng kiểm thêm từng câu. Kế hoạch cũ được kiểm lại khi mở lần đầu trên bản mới; tính lại sau 6 câu hoặc ngay khi có lần sai mới. Không đổi phần đã làm.
- Cạnh mềm từ nhãn nền và kỹ năng cùng câu được học từ dữ liệu độc lập 60 ngày. Tối thiểu 20 em và 30 quan sát ở mỗi cohort; khoảng Wilson phải tách nhau. Cạnh mất bằng chứng tự rút; chỉ ảnh hưởng ưu tiên, không được coi tương quan là bằng chứng nhân quả để khoá bài. Không tìm thấy `tien-quyet.json`/21 nút/36 cạnh trong repo nên không bịa đồ thị chuyên đề.
- `half-life.ts`: log2 chu kỳ bán rã = prior + hệ số riêng em + hệ số riêng kỹ năng, cập nhật SGD có co về prior. Một câu/ngày, câu trùng cùng nhóm không nhân mẫu, bốn ý cùng câu gộp thận trọng. Đo log-loss trước mỗi cập nhật; chỉ dùng lịch mới khi từng kỹ năng có ít nhất 8 lượt kiểm dự đoán và sai số không cao hơn FSRS chạy trên cùng sổ. Dữ liệu ít/chưa tốt hơn vẫn dùng FSRS.
- `bandit.ts`: contextual Thompson sampling Beta-Bernoulli phân tầng theo loại kỹ năng, vùng năng lực và tầng mắc kẹt; chọn trong hai hành động có câu thật, đã đủ điều kiện: ôn nền hoặc ví dụ dễ thấp tầng. Ưu tiên một câu cứu trong sàn hiện có, không cộng thêm khối lượng. Không có câu hợp lệ thì không tạo can thiệp giả; chưa đưa video/giải thích lại/gợi ý tuần tự vào bandit.
- Receipt phân biệt đề nghị, thực sự làm và kết quả kiểm. Reward từ lần tự làm đầu tiên của nhóm nội dung mới cùng kỹ năng, sau ít nhất 24 giờ và trong 14 ngày; nhóm từng gặp/xem đáp án/có hỗ trợ không là câu mới. Một câu kiểm chỉ thưởng một can thiệp, bốn ý không nhân mẫu, đọc lại/hai máy không tăng số mẫu. Thiếu quan sát giữ pending, không gán thất bại. Xác suất chọn lưu bằng Monte Carlo để đối chiếu policy.
- Điểm chọn kết hợp kỹ năng yếu nhất, vùng xác suất đúng quanh 0,8, mới/chưa gặp, điểm của phần và phút kỳ vọng từ β thời gian hiện có. Trọng số áp cả câu mới/ôn và phân xử nợ cùng độ ưu tiên. Dự báo `omni_du_bao` được ghi cho phạm vi **ứng viên của ngày**, không coi đây là xác suất đã hiệu chuẩn của đề thi thật.
- Bốn bảng mới chỉ lưu mô hình/receipt, không thay điểm, EXP, sổ học hoặc đáp án. Mọi lệnh ghi bộ đệm/receipt kiểm lại không có ca mở. Bộ kiểm phát hành đọc em có lịch sử lớn nhất, chỉ in số tổng hợp và không giao câu/ghi mô hình.

## Giới hạn được giữ rõ

Không có tuyên bố “tốt nhất thế giới” khi chưa có dữ liệu đánh giá. Cạnh học là tương quan quan sát, bandit hiện có hai hành động thực sự phục vụ được, HLR chỉ thay FSRS khi đạt cổng kiểm. Chưa có thử nghiệm A/B chứng minh điểm thi/phút học cao hơn; chưa tự tối ưu toàn bộ ngưỡng SPRT/trọng số theo mục tiêu điểm. Cửa sổ ứng viên còn giới hạn nên số thiếu không khẳng định toàn kho hết câu. Độ khó β trong bộ chọn hiện là β **thời gian**, chưa phải tham số IRT/Elo độ khó cho toàn kho.

## Phát hành / đối chiếu

Chỉ phát hành từ main qua workflow hiện có, sau build app + tsc server + test. Cron ghi mốc `cau_hinh.hanh_trinh_3_0910_v1`. Kiểm ba dòng đang chạy, nguồn đã đóng có bản sao, sổ học/điểm không thay đổi. Nếu ca mở, trạng thái chuyển tiếp chờ cron sau, không coi là đã gộp.

Lùi mã bằng revert commit; dữ liệu nguồn được lưu nguyên JSON ở `hanh_trinh_v3_nguon`. Việc mở lại nguồn cần kế hoạch phục hồi riêng, đối chiếu dữ liệu mới phát sinh, không tự khôi phục chồng lên Hành trình đang có học sinh làm.

Kiểm tra: 16 kiểm riêng (gộp nguyên tử, kho nhiều trang, học sinh khoá/chưa rõ khối, hai máy, tầng/sàn/chặng, bảng thầy); hồi quy kế hoạch/UI 103 kiểm đạt. Full vitest được chạy; đối chiếu các tệp đỏ trên bản gốc và bản mới còn cùng 127 lỗi nền, gồm nhóm timeout không ổn định. TypeScript app/server, build Cloudflare và SW 13/13, kiểm màu/giữ màu, soi giao diện không có lỗi. Chưa có ảnh Chromium thật vì môi trường chặn CDN tải trình duyệt.

Đợt v4: 29 kiểm ba máy/kế hoạch đạt; 88 kiểm hồi quy OMNI/FSRS/kế hoạch/UI và 67 kiểm cổng phát hành đạt trước lần thêm kiểm chuỗi sai; TypeScript máy chủ, build Cloudflare/SW13/13, màu và lint đạt. Full vitest đang chạy đối chiếu nền, không tuyên bố toàn bộ xanh.
