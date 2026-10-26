# Kiểm kê màn app thầy (25/10)

Đây là bản kê nội dung các màn thầy truy cập được, theo trạng thái mã hiện tại. Phần còn lại chưa đọc kỹ được ghi ở mục cuối.

**Hai bộ menu (cờ Game Hóa 2.0)** (`/home/user/omr-app/src/components/ThanhBenTrai.tsx:45-68`)
- 2.0 bật: Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề; đáy: Cài đặt.
- 2.0 tắt: Hôm nay · Học sinh · Ca kiểm tra · Ngân hàng đề · Giao bài tập về nhà · Gọi lên bảng · Học sinh hỏi · Giao đề theo tuần · Cài đặt, cùng nút "Mở ca kiểm tra". Gỡ nút thắt chỉ có ở 2.0.
- Không rõ cờ nào đang chạy thật trên máy thầy.

**Hôm nay (2.0), `tongquan` → `GvHomNayScreen.tsx:316-556`**
- Tiêu đề "Hôm nay của thầy"; dòng phụ "[ngày] · N em · cập nhật HH:MM".
- Nút chính góc phải: "Theo dõi ca đang mở" hoặc "Bổ sung bài hôm nay".
- Khối "Việc cần thầy", mỗi thẻ một nút: "Ca đang mở" → Theo dõi; "Cần thầy chữa · N chỗ" → Chữa bài; "Học sinh hỏi · N lượt" → Xem; "Lớp chưa có bài mới" → Bổ sung bài; lỗi tải → Thử lại; không có việc → "Không có chỗ cần thầy chữa hôm nay."
- Khối Nhịp học (`components/hom-nay-thay/NhipHocThay.tsx`): lọc Khối "Tất cả / 10 / 11 / 12", ô Lớp, "Tìm tên hoặc số báo danh…"; nhóm "Chăm · Chưa đều · Lười · Đối phó"; "12 bậc từ Lười đến Chăm"; cách xếp "Theo nhóm / Theo bậc"; "Xem bảng từng ngày ›"; "Xem đủ N em ›".
- Trạng thái: khung xương khi tải; lỗi nói từng phần kèm Thử lại; bản lưu trong máy tối đa 3 giờ được vẽ ngay.

**Hôm nay (cờ tắt), `examhub` → `HomNayScreen.tsx` → Bảng tin**
- Tiêu đề "Bảng tin"; các khối: "Nhịp học trực tiếp", "Bản đồ lớp", "Bài tập về nhà đang chạy", "Dẫn đầu hôm nay", "Em cần thầy để ý", "App đã tự làm hôm nay", "Dạng cả lớp đang vấp", "Bản đồ nhiệt".
- Nút "Tìm học sinh". Lỗi: "Chưa đọc được bảng tin".
- Rơi về `HomNayCu.tsx` khi máy chủ thiếu lệnh.

**Hành trình, `chiendich` → `ChienDichScreen.tsx` → `components/chien-dich/HanhTrinhV2.tsx:68`**
- Tiêu đề "Hành trình giỏi Hóa"; thước "Buổi dạy hôm nay" với 4 bước: Điểm danh · Gọi lên bảng đầu giờ · Dạy học · Chữa câu khó & tính toán (trạng thái: đã xong / đang mở / chưa làm).
- Thẻ "Kiểm tra ôn tập".
- Bước 1: "Điểm danh" với mã 6 số và QR, "Tự cập nhật mỗi 5 giây".

**Ca kiểm tra, `lichsuca` → `LichSuCaScreen.tsx:218-545`**
- Tiêu đề "Ca kiểm tra" (hoặc "Ca đã xoá"). Nút "Mở ca kiểm tra" khi 2.0 (`App.tsx:461`).
- Ba thẻ số: "Ca trong tháng N", "Bài đã nộp tháng N", "Rời màn trong tháng N".
- Thanh tìm; nút "Chọn để xoá" / "Xong", "Ca đã xoá" / "Về danh sách ca", "Tải lại".
- Lọc: Tất cả · Đang mở · Đã đóng; lọc Lớp.
- Bảng "Danh sách ca kiểm tra": Tên ca · Lớp · Bắt đầu · Công bố điểm · Trạng thái (hoặc Việc ở mục đã xoá). Bấm một dòng mở chi tiết ca.
- Hành động: "Xoá N", "Khôi phục N", "Xoá vĩnh viễn N", "Xoá vĩnh viễn tất cả (N ca)".
- Trống: "Chưa có ca kiểm tra nào. Bấm Mở ca kiểm tra để mở ca đầu tiên."

**Mở ca kiểm tra, `examsetup` → `ExamSetupScreen.tsx`**
- Breadcrumb "Ca kiểm tra › Mở ca mới", tiêu đề "Mở ca kiểm tra".
- Bốn bước: "1. Đề", "2. Ai làm", "3. Giờ", "4. Luật"; nút "Bước trước" / "Bước tiếp".
- Đề: "Chọn đề kiểm tra" / "Đổi đề khác"; chip "Phần I/II/III · n câu"; "Chuẩn cấu trúc 2026 · 50 phút"; "Cách ra đề".
- Ai làm: lớp, "Ai được vào".
- Giờ: "Thời gian làm bài", "Lúc bắt đầu và hạn vào phòng", nút "Bắt đầu ngay".
- Luật: "Công bố điểm" ("Không công bố trên máy em" / "Xem điểm ngay khi nộp" / "Xem điểm khi cả lớp xong"); "Thêm tuỳ chọn…" gồm Tên ca, Phòng chờ phát đề, Chống chụp ảnh đề, Đồng bộ giờ cả phòng, Mật khẩu ca, Chỉ nộp trong 3 phút cuối.
- Khung "Xem trước · ca sẽ mở" (Cách ra đề · Số câu · Ai làm · Thời gian · Công bố điểm). Nút chính "Mở ca kiểm tra ngay"; sau khi mở có link mời và chép link.

**Theo dõi ca, `exammonitor` → `ExamMonitorScreen.tsx:324` + `components/ca-thi/TheoDoiCa.tsx`**
- Khối: "Việc nhanh", "Cần thầy xử lý", "Từng em".
- Lọc: Tất cả · Đang làm · Phòng chờ · Đã nộp · Chưa vào.
- Cột: HỌC SINH · TRẠNG THÁI · TIẾN ĐỘ · ĐIỂM. Nhãn: Đang chờ, Đang làm, Rời màn N lần, Đã nộp, Bị khoá, Chờ thi lại.
- Nút: "Làm mới ca kiểm tra", "Bắt đầu thi", "Huỷ ca kiểm tra", "Mở ca cho em vào", "Kết thúc ca", "Link vào thi", "Link xem điểm", "Chiếu mã vào thi", "Xoá ca này" (gõ lại mã ca).
- Trong hồ sơ em: "Báo phụ huynh", "Cho vào bằng máy khác", "Cho thi lại", "Mở khoá".
- Trống: "Chưa em nào đứng ở phòng chờ."

**Học sinh, `hocsinh` → `HocSinhScreen.tsx`**
- Cờ 2.0 dùng `HocSinhDanhSachV2.tsx:189-266`: tiêu đề "Học sinh"; lọc Khối / Lớp / Học phí; bảng Em · Lớp · Hôm nay · Ca gần nhất · Học phí · Thao tác; 25 em mỗi trang; nút "⋯" gồm Mở hồ sơ · Báo cáo · Lịch sử ca · Học phí · Đặt lại mật khẩu.
- Cờ tắt: danh sách cũ, có "Thao tác với học sinh" và "Xếp học sinh: Học thật · Đối phó".
- Hồ sơ em: tab "Báo cáo" / "Lịch sử ca kiểm tra (n)"; mục "Nhịp học, kiến thức và dòng thời gian", "Học thật và can thiệp"; nút "Nghỉ học", đổi tên, chuyển lớp, xoá em.

**Toàn cảnh một em, `toancanh` → `ToanCanhEmScreen.tsx:129-243` + `components/toan-canh/CacKhoi.tsx`**
- Tên em; chip "#SBD", "Lớp", "Thần thú", "Chuỗi N ngày", "Hoạt động cuối", "Phụ huynh xem app".
- Nút: "Giao bài riêng" (ẩn khi 2.0), "Cho thi lại", "Xem hồ sơ học sinh", "Hồ sơ làm bài".
- Số: "ĐIỂM CA KIỂM TRA GẦN NHẤT", "EXP HÔM NAY".
- Mục: "Dòng thời gian · mọi việc em đã làm" (lọc "Tất cả"), "Bản đồ dạng", "Nhịp học 30 ngày", "Phụ huynh".
- Trạng thái: "Đang tải toàn cảnh của em…"; "Chưa có số liệu nhịp học 30 ngày."

**Kho đề (`nganhangde`), `NganHangDeScreen.tsx:381-466`**
- Tiêu đề "Kho đề" (2.0) / "Ngân hàng câu hỏi" (cũ); nút "Duyệt lời giải".
- Tổng "N đề · M câu", nhãn "N câu cần thầy quyết".
- Ba thẻ: "Đồng bộ ngay", "Đẩy file JSON", "Duyệt hết N câu".
- "Danh sách đề" (thẻ đề: "N chờ quyết" / "đáp án đủ", "Chi tiết đề", "Xoá đề").
- Mục khác: "Em báo lỗi câu" (2.0), "Công cụ kỹ thuật · Mã dạng, thống kê và kiểm tra".
- Trống: "Chưa có đề nào."

**Duyệt lời giải, `duyetloigiai` → `DuyetLoiGiaiScreen.tsx`**
- Vào từ nút "Duyệt lời giải" trên Kho đề, hoặc `#duyet-loi-giai`.
- Tiêu đề "Duyệt lời giải"; ô "Mã đề trong kho".
- Bốn thẻ: "Đã duyệt", "Chờ duyệt", "Máy đang soạn", "Chờ sửa kho".
- Danh sách "Danh sách câu chờ duyệt": "Xem lời giải", "Trả lại cho máy soạn" → "Trả lại câu này" / "Thôi".

**Giao bài tập về nhà, `giaobtvn` → `PhanCongScreen.tsx` (tệp tên "PhanCong", nội dung là BTVN)**
- Ẩn khi 2.0 bật. Tab "Giao bài mới" | "Bài tập về nhà đã giao".
- Tab đã giao: khối "Cần thầy để ý" (Em chưa mở bài · Em chậm nhịp · Em chưa nộp quá hạn · Hạn gần nhất); menu bài: "Đổi hạn nộp", "Xem bài làm", "Chi tiết bài", "Thu hồi"; "Lưu hạn".
- Tab giao mới: chọn lớp / ca / học sinh; "Hạn nộp (giờ Việt Nam)"; "Xem trước phân bổ"; nút "Giao bài tập về nhà (N câu)".

**Giao đề theo tuần, `khodegiao` → `GiaoDeTheoTuanScreen.tsx:79-123`**
- Ẩn khi 2.0 bật. Tiêu đề "Giao đề theo tuần"; chip "Khối 10 / 11 / 12"; "Lớp (khối N)"; "Em khối N (n đã tick)"; "Nguồn đề khối N (n đã tick)"; "Hạn nộp (tối thiểu 7 ngày kể từ lúc giao):"; nút "Lưu lại".

**Gọi lên bảng, `goilenbang` → `GoiLenBangScreen.tsx:236-257`**
- Tab "Cách lên bảng": "Chiến dịch" (2.0) hoặc "Theo ca kiểm tra" (cũ) · "Dạy học" · "Kiểm tra đầu giờ" · "Câu cần chữa".
- Vào từ "Đưa vào buổi chữa" (`components/hom-nay/EmCanGiup.tsx`).

**Học sinh hỏi, `cauhoi` → `CauHoiScreen.tsx:170-350`**
- Tiêu đề "Học sinh hỏi" hoặc "Thùng rác câu hỏi"; dòng phụ "N ca có câu hỏi · M em chờ Thầy chữa".
- Danh sách ca: tên ca, "N em hỏi · M câu", badge số chờ chữa.
- Hành động: "Chọn tất cả", "Bỏ N ca vào thùng rác", "Khôi phục N ca", "Khôi phục tất cả".
- Vào từ Hôm nay › "Việc cần thầy". Trống: "Chưa em nào gửi câu hỏi…".

**Gỡ nút thắt, `bangonutthat` → `BanGoNutThatScreen.tsx:84-222`**
- Tiêu đề "Bàn gỡ nút thắt"; thẻ "Thẻ đang chờ", "Cần gỡ"; khối "Kèm riêng trên lớp · N em", "Cùng kiến thức nền".
- Nhóm "Chọn nhóm cần gỡ"; "Buổi học sẽ dạy"; nút "Thôi".

**Cài đặt, `caidat` → `CaiDatScreen.tsx:31-129`**
- Tiêu đề "Cài đặt"; "Giao diện" (Sáng · Tối · Theo máy); "Kết nối máy chủ"; "Cập nhật app".
- Mục "Công cụ kỹ thuật": Kết nối máy chủ · Mật khẩu mở app · Cập nhật app · Đồng bộ lại phiếu mọi ca · Đồng bộ danh sách lớp.

**Không phải màn thầy, hoặc không có lối vào**
- Khoá: `KhoaMayThayScreen.tsx` và `KhoaAppScreen.tsx` là cổng khoá tự hiện, không có mục riêng.
- Điều khiển tờ chiếu: `DieuKhienToChieuScreen.tsx:198` (tiêu đề "Điều khiển Máy chiếu"), chỉ mở qua `?remote=`, không có trên thanh bên.
- Ai đã sai?: hộp chiếu tạo bằng HTML trong `src/lib/len-bang-moi-to-chieu.ts:1045`, không phải màn React.
- Điểm danh: nằm trong bước 1 của Hành trình (`components/day-hoc/`).
- Phiếu (`PhieuScreen.tsx`, `PhieuV3.tsx`): phiếu phụ huynh và học sinh.
- Phân công: không có màn riêng; `PhanCongScreen.tsx` là Giao BTVN.

**Đã bỏ qua hoặc không dùng**
- `ClassListScreen.tsx` (`classlist`): không có lệnh nào mở, chỉ được tô sáng cạnh Học sinh.
- `AppDaChuyenScreen.tsx`: không có nơi nào import.
- Của phía học sinh, không phải màn thầy: `ThongBaoThiM3`, `DaiCauChuaLamM3`, `LamBaiNgang*`, `HoiThay*`.
- Tệp `*Cu.tsx` và CSS: bỏ qua.

**Chưa chắc**
- Lối vào Gỡ nút thắt: không thấy `setScreen('bangonutthat')`; có thể qua một nhánh khác.
- Nhãn hai nút chuyển của Học sinh hỏi chưa đọc được.
- Chưa đọc chi tiết: bước Điểm danh, Kiểm tra đầu giờ, các hộp học phí, nút khoá máy thầy.