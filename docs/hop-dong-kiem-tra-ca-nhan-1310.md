# Kiểm tra và lịch riêng từng học sinh — bàn giao Claude

## Phạm vi đã xây

Lõi ở `server/src/kiem-tra-ca-nhan-loi.ts`, điều phối/D1 ở `kiem-tra-ca-nhan.ts`. Schema chỉ-thêm ở `migration-1310-kiem-tra-ca-nhan.sql`. Giữ nguyên ca chính thức, điểm đã nộp, lịch sử và ba Hành trình.

Mỗi em có ngày riêng, không có ngày Chủ nhật chung. Lần đầu hẹn trong 3–7 ngày: nhu cầu kiểm chứng, lịch sử kỹ năng, nhịp ngày học và tránh hai ngày cuối hạn gói mới. Học sinh cùng hồ sơ được rải theo mã em. Các kỳ tiếp theo mặc định cách 7 ngày; mô hình half-life chỉ khi đã qua cổng kiểm có thể đưa về ngày 5–7. Đây là chính sách khởi đầu cần hiệu chỉnh bằng kết quả, không chứng nhận thuật toán tối ưu toàn cầu.

Ngày kiểm tra sở hữu toàn ngày VN, cửa sổ 00:00 đến 00:00 ngày sau. Ngày ấy không phát chặng thường; nộp sớm cũng không phát thêm. Câu mới gói 7 chia trên những ngày học còn lại, giữ hạn gốc. Mức ngày đã chốt không được đổi giữa ngày. Ngày học có giữ chỗ cho câu ôn phù hợp và lỗi cần sửa khi cờ mới bật.

## Chọn đề và bằng chứng

Đơn vị: bài × kỹ năng × mức yêu cầu. Dựng bộ phủ cứng bằng greedy số đơn vị chưa phủ/phút, rồi thêm câu khác nhóm để kiểm chứng những mục chưa vững. Thời gian theo loại câu và mẫu tự làm đúng của em, co về mức mặc định khi ít mẫu, cộng dự phòng 20%. Không hardcode 36/44/52. Mỗi chặng tối đa 6 câu.

Nguồn phải còn chỉ mục, được duyệt, đúng khối, không bị giữ cho ca/BTVN hoặc giới hạn của thầy. Câu thiếu ma trận không được biến thành kỹ năng giả từ qid. Thiếu nguồn -> `cho_nguon`, không chiếm ngày học; giữ mục thiếu, không báo 100%. Phạm vi được làm mới trước ngày kiểm tra; đã mở thì không đổi đề, N hay thời gian.

100% phủ đề khác với đã trả lời, đã đạt và còn nhớ. Kết quả API hiện ghi “Đúng lần này”; không gọi số đó là đã vững 90%. Mục tiêu 90% phải kiểm chứng bằng hồ sơ độc lập, câu khác và khoảng nghỉ. Không tăng số câu đang làm sau một lượt sai. Sửa lỗi `dat`/`vung` ở thống kê gói 7, không đổi trạng thái hay điểm thật hàng loạt.

## API để đấu giao diện

Tất cả lệnh học sinh dùng `POST /game-v2/<action>` qua `goiHoa2`, token từ phiên em. Không gửi SBD để xác định quyền. `id` là bài của chính em, được kiểm lớp hiện tại.

- `hoc-tap-sanh`: trường chỉ-thêm `kiemTraCaNhan`; ngày kiểm tra không có gói/kế hoạch bài ngày. Đừng gọi `hoc-tap-start` để làm bài kiểm tra.
- `hoc-tap-ktcn-trang-thai {id}`: `kiemTra` và `chang[]` gồm `stt` bắt đầu 0, `soCau`, `giay`, `han`, `daChot`. Xem trạng thái không bắt đầu đồng hồ.
- `hoc-tap-ktcn-start {id, chang}`: `questions` đã bỏ đáp án/lời giải, `tra` đã lưu, `revision`, `hanChang`, `daChot`, `kiemTra`. Gọi lại không reset giờ. Chỉ một chặng mở.
- `hoc-tap-ktcn-luu {id, chang, tra, revision}`: patch bản nháp. Đọc `revision` mới, `daLuu`, `daChot`, `kiemTra` từ phản hồi. Serialize các lượt lưu. Xung đột phiên bản -> tải lại, không ghi đè nháp mới hơn.
- `hoc-tap-ktcn-chot-chang`: cùng payload lưu; chốt chặng một lần. Hết giờ chỉ dùng nháp đã lưu đúng giờ; không nhận nháp muộn.
- `hoc-tap-ktcn-nop {id}`: chốt nháp máy chủ; KHÔNG gửi toàn đáp án lần nữa để lách giờ. Chặng đang chạy phải chốt trước. Có thể nộp khi còn bỏ trống.
- `hoc-tap-ktcn-ket-qua {id}`: chỉ sau toàn bài chốt; trả `kiemTra`, `ketQua.bai[]`, `ketQua.cau[]`, `daGhiSo`. Phần chữa vẫn chịu cổng bảo vệ ca chính thức.
- `POST /gv/kiem-tra-ca-nhan {lop?,sbd?}`: cổng giáo viên hiện có, chỉ đọc `em[]` với tên/lớp và `kiemTra`; không tạo đề khi thầy mở trang.
- `POST /ph/hoc-2`: cổng phụ huynh hiện có; thêm `kiemTraCaNhan`, số `homNay` của bài tuần, không sàn bài ngày.

`TomTatKiemTra` và bộ đọc chặt ở `src/lib/kiem-tra-ca-nhan.ts`. Các trường:
`id,ngay,moLuc,hanLuc,serverNow,trangThai,homNay,tong,daTra,con,soChang,phut,soBai,tongKienThuc,phuDe,nguonDayDu,lyDo,thieuNguon,diem,nopLuc`.

Trạng thái: `cho_nguon/sap_den/can_lam/da_nop/het_han`. Giờ là epoch ms; ngày là VN. `con=tong-daTra`. Câu tự chốt bỏ trống không thành đã trả lời. Điểm giữ lần chốt đầu; sự kiện sổ học có receipt cố định. Lỗi ghi sổ có thể retry/cron hồi phục.

## Giao diện hiện đã nối

- Học sinh: `HocTapHomNay` -> `TheKiemTraCaNhan`, màn riêng `ManKiemTraCaNhan`, lối vào `StudentPortalScreen` tab `kiemtra`.
- Giáo viên: `BangKiemTraCaNhan` dưới Dạy học & đầu giờ, không tạo thêm nhiều tab; tìm theo tên/lớp, 20 dòng/trang.
- Phụ huynh: `ManHomNay` -> `TheKiemTraCon` hiển thị lịch sắp tới và bài kiểm tra đúng N khi đến lịch; bộ đọc `ph-v3/du-lieu` nhận cùng hợp đồng.

Claude có thể trùng tu trình bày nhưng phải giữ luồng thật. Thiết kế học sinh thưa, một hành động chính; thầy đủ thông tin, bảng trên máy tính và thẻ trên điện thoại; phụ huynh ngắn, không lộ mã kỹ năng. Giữ bảng màu hiện có, nhãn/đơn vị cho mọi số, đích chạm >=48px, focus rõ, sáng/tối và 390/844 ngang/1440 không tràn. Phân biệt hạn 24 giờ và thời gian chặng; không đếm ngược gây áp lực ở lịch tương lai.

## Chữa và chiếu — chỉ đạo mới nhất của thầy

Trong Chữa câu khó & tính toán: gom câu tính toán, câu khó và câu lớp sai nhiều vào MỘT nhóm ưu tiên, trộn theo seed của buổi bằng Fisher–Yates; các câu khác sau. Không chia lần lượt tính toán -> khó -> sai nhiều. Khử trùng theo qid, không bỏ câu còn lại. Có ít nhất 5 em đã làm và >=30% sai mới dùng tín hiệu “nhiều em sai”; mẫu nhỏ vẫn hiện số thực. Xem trước và tờ chiếu phải cùng thứ tự đã chốt. Thống kê đọc theo lô hết danh sách, không chỉ 120 câu đầu.

MỌI phần chiếu, TRỪ Kiểm tra đầu giờ: ưu tiên gọi em có bằng chứng tự làm đúng đúng câu/phiên bản; nếu không có, chọn em có xác suất theo kỹ năng cao nhất trong danh sách lớp/có mặt. Có mặt là phạm vi cứng khi đã điểm danh. Trong nhóm đã đúng rải người gọi; trong nhóm dự đoán giữ khả năng làm được trước. Không gọi em vắng. Thiếu dữ liệu thì nói thật, không gán nhãn đã đúng.

API `POST /gv/ung-vien-chieu {qids,sbd,lop?}` chỉ đọc. Kết quả `cau[qid]` là danh sách `sbd,ten,loai:'da_dung'|'du_bao',p,luc`. Bộ đọc/gọi `src/lib/ung-vien-chieu.ts`.

Lỗi đọc người phù hợp: báo thầy và chiếu đủ câu để chữa chung, không giữ người gọi cũ hoặc gán nhãn đúng giả. Báo cáo lịch dùng số tổng hợp tại D1, không tải toàn bộ đề riêng của mọi học sinh vào bộ nhớ Worker.

Nhãn thẻ tên: “Đã tự làm đúng câu này” hoặc “Dự kiến làm được câu này”. Không đổi kết quả cũ thành đúng vì được gọi. Khi đổi người, cầu nối Đạt/Chưa đạt phải trỏ người mới. Chữa chung bước cuối vẫn là chữa nhóm, không dùng kết quả của em minh hoạ để công nhận cả nhóm đã đạt.

Bảng gọi tên của Dạy học và bảng phân công cũ được đồng bộ với em thực tế trên tờ, để nút ghi ngoài tờ cũng ghi đúng người. Nút Đổi em loại những em thầy đã bỏ qua rồi chọn lại theo cùng ưu tiên.

Kiểm tra đầu giờ dùng `dungToChieuDayHoc(..., nutAiSai=true)`; không gọi bộ chọn mới, giữ thuật toán/người/phạm vi kiểm tra đầu giờ.

## Triển khai, kiểm và cách lùi

Cờ `cau_hinh.kiem_tra_ca_nhan_v1={bat:true}`. Migration riêng chỉ tạo ba bảng và chỉ mục (bài, chặng, nhịp thử lập), không bật cờ. Workflow áp schema trước Worker, bật sau xác nhận bản sống qua `scripts/ap-ktcn-song.ts`; chuyển lần đầu chuẩn bị các lô nhỏ tuần tự đến hết hàng đợi hiện tại, cron tiếp tục cho em mới/kỳ tiếp theo. Em tạm dừng/nguồn lỗi có thời gian thử lại 6 giờ và không chặn các em kế tiếp. Có ca chính thức mở -> dừng phát hành theo quy trình repo.

Thẻ và màn kiểm tra nạp khi có lịch/cần mở, dùng kho chạy-lúc của service worker. Nháp chưa đồng bộ có nút khôi phục trong đúng chặng còn giờ; máy chủ luôn là bản chính. Tắt cờ không biến các ngày kiểm tra đã nộp thành ngày thiếu bài tập thường.

Không bỏ kiểm: ngày riêng không phân bài ngày, nộp sớm, đồng hồ/retry/revision, bỏ trống, nguồn thiếu, lớp thay đổi, quyền của em, cùng số ba app, nguồn ca bị bảo vệ, trạng thái vung, nhóm ưu tiên trộn và gọi em đã đúng/dự đoán, ngoại lệ đầu giờ.

Tắt cờ để lùi luồng, giữ bảng/bài nộp/sổ. Không xoá dữ liệu hoặc sửa điểm thật. Đọc CLAUDE.md và điều phối trước khi sửa. Không tuyên bố đã lên production khi chỉ có build local; bàn giao commit, kiểm chứng và các giới hạn còn thực tế.
