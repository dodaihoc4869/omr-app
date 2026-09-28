# RÀ SOÁT APP GIÁO VIÊN — chế độ Game Hóa 2.0 (28/09/2026)

Thầy lệnh 28/09: "thiết kế lại app gv chuyên nghiệp… bỏ hết những phần không liên quan, bỏ cả ảnh mở ca đầu tiên, đổi tên cho phù hợp ngữ cảnh dễ hiểu. Vẽ trước tôi chốt rồi mới build."
Phạm vi: mọi thứ thầy NHÌN THẤY khi công tắc `game_hoa_2` bật (desktop ≥ 1100 px, rail 880–1100 px, điện thoại < 880 px).
Thước đo: phần tử có phục vụ MỘT trong ba việc chính không — (1) mở / theo dõi **Ca kiểm tra**, (2) giao **Chiến dịch luyện**, (3) **Chữa trên lớp** theo chiến dịch.
Không đề xuất xoá dữ liệu. "Bỏ" = gỡ khỏi giao diện 2.0 (mã và dữ liệu giữ nguyên, tắt 2.0 là hiện lại). "Cất" = đưa vào Cài đặt › Công cụ kỹ thuật (thu gọn, mặc định đóng).
Luồng thi thật (`ExamTakeScreen`, phòng chờ, cảnh báo rời màn, giữ-để-đọc, cổng mã bí mật) — KHÔNG đụng (luật C-RÀO).

## 1. Khung app (thanh bên · rail · thanh đáy · logo)
| Màn | Phần tử | Quyết định | Tên mới | Lý do |
|---|---|---|---|---|
| Thanh bên | Logo + dòng "6,022 · 10²³" | Đổi | Logo + "Đỗ Đại Học · Giáo viên" | Hằng số Avogadro là trang trí, không mang thông tin (C3). Giữ ở màn đăng nhập. |
| Thanh bên | Nút lớn "Mở ca kiểm tra" | Giữ | "Mở ca kiểm tra" | Việc chính 1; đường vào ca không được mất (C-RÀO). |
| Thanh bên | (mới) Tổng quan | Thêm | Tổng quan | Trang chủ "hôm nay có gì": ca đang mở, chiến dịch đang chạy, việc cần làm (C1). |
| Thanh bên | Ca kiểm tra | Giữ | Ca kiểm tra | Việc chính 1. Bỏ khối chiến dịch đang nằm lẫn trong màn này. |
| Thanh bên | (mới) Chiến dịch | Tách | Chiến dịch luyện | "Giao chiến dịch mới" + danh sách chiến dịch hiện nằm TRONG màn Ca kiểm tra — một việc một đường vào (C4). |
| Thanh bên | Lên bảng | Đổi tên | Chữa trên lớp | "Lên bảng" chỉ tả hành động của em; thầy vào đây để CHỮA: bảng chiến dịch, buổi chữa, tờ máy chiếu. |
| Thanh bên | Nhãn nhóm "Thêm…" | Bỏ | — | Nhãn không mang thông tin; mục phụ xếp thẳng dưới vạch (C3). |
| Thanh bên | Học sinh | Giữ (nhóm phụ) | Học sinh | Xem hồ sơ từng em theo dạng. |
| Thanh bên | Ngân hàng đề | Đổi tên, hạ xuống đáy | Kho đề | Chỉ dùng khi thêm tờ đề; tên ngắn. |
| Thanh bên | Cài đặt | Giữ, đặt ở đáy | Cài đặt | Chỗ kín cho công cụ kỹ thuật. |
| Thanh đáy (< 880) | Ca kiểm tra · Lên bảng · Thêm | Đổi | Tổng quan · Ca kiểm tra · Chiến dịch · Chữa bài · Học sinh | ≤ 5 mục, 1–2 chữ (C6); Kho đề + Cài đặt vào nút bánh răng trên thanh trên. |
| Thanh đáy | Nút nổi "Mở ca" | Giữ | Mở ca | Vẫn ẩn ở màn Theo dõi ca và Mở ca như hiện nay. |

## 2. Ca kiểm tra (`LichSuCaScreen`)
| Màn | Phần tử | Quyết định | Tên mới | Lý do |
|---|---|---|---|---|
| Ca kiểm tra | Ô biểu tượng + phụ đề "Quản lý, tìm kiếm và chi tiết các ca kiểm tra" | Bỏ phụ đề | — | Câu mô tả lặp tiêu đề (C3). |
| Ca kiểm tra | Nút "Giao chiến dịch mới" + khung Giao chiến dịch + "Chiến dịch đã giao" | Chuyển | sang màn Chiến dịch luyện | Không phải việc của danh sách ca (C4). |
| Ca kiểm tra | Khối "Đồng bộ lại phiếu mọi ca" (`NutDongBoMoiCa`) | Cất | Cài đặt › Công cụ kỹ thuật | Công cụ sửa sự cố, không dùng hằng ngày. Sửa kèm 2 câu trong `KhoiBaiLuyen.tsx` đang chỉ "Lịch sử ca". |
| Ca kiểm tra | Trạng thái trống: nút lớn "Mở ca kiểm tra đầu tiên" | Bỏ | Một dòng chữ: "Chưa có ca kiểm tra nào. Mở ca bằng nút Mở ca kiểm tra ở thanh bên." | Lặp nút thanh bên (C4); thầy yêu cầu bỏ. Không ảnh minh hoạ. |
| Ca kiểm tra | Lưới thẻ gom "thư mục năm sinh" | Đổi | Bảng gọn: Tên ca · Lớp · Bắt đầu · Vào/Mời · Nộp/Vào · Điểm TB · Trạng thái | Thẻ không so sánh được số; bảng đọc dọc (C1). Nhóm năm sinh thành bộ lọc Khối. |
| Ca kiểm tra | Mã ca dạng `DH-12-C2-B6` | Giữ, hạ cấp | chữ nhỏ dòng phụ dưới tên ca | Thầy vẫn cần gõ mã; không làm tên chính (A1-4). |
| Ca kiểm tra | Nhãn "Điểm hiện khi cả lớp nộp xong"… trên từng thẻ | Gộp | cột "Công bố điểm" (chữ ngắn) | Bớt một dòng mỗi ca. |
| Ca kiểm tra | "Chọn ca để xoá", "Ca đã xoá", Tải lại | Giữ | "Chọn để xoá" · "Ca đã xoá" | Cần thiết; xoá là xoá mềm. |
| Ca kiểm tra | Ca loại `baitap` (BTVN) trong danh sách | Ẩn khỏi mặc định | bộ lọc "Loại: Bài tập về nhà (cũ)" | Thầy "bỏ hẳn BTVN"; dữ liệu giữ, lọc ra được. |

## 3. Mở ca (`ExamSetupScreen`) và Theo dõi ca (`ExamMonitorScreen`)
| Màn | Phần tử | Quyết định | Tên mới | Lý do |
|---|---|---|---|---|
| Mở ca | Chọn đề / Rút câu / Lớp / Thời gian / Mật khẩu / Phòng chờ / Giữ để đọc / Công bố điểm | Giữ | — | Luồng ca thật (C-RÀO). |
| Mở ca | "Quy định quyền truy cập: Tự do / SBD cả lớp" | Đổi tên | "Ai được vào: Mọi em có link / Chỉ em trong danh sách lớp" | "Quyền truy cập" là chữ kỹ thuật. |
| Mở ca | "Đồng bộ giờ cả phòng" | Giữ, dời vào "Tuỳ chọn nâng cao" | — | Ít dùng. |
| Mở ca | "Copy link mời vào thi" | Đổi tên | "Chép link vào thi" | Tiếng Việt đời thường. |
| Theo dõi ca | Bảng em · tab trạng thái · Khoá ca · Dừng và nộp bài | Giữ | — | Việc chính 1. |
| Theo dõi ca | Cột "CHỐNG GIAN LẬN" | Đổi tên | "Rời màn" | Tên cột nói đúng cái đo. |
| Theo dõi ca | Ô "Nội dung tin báo phụ huynh" | Bỏ (2.0) | — | App phụ huynh đang tắt ở 2.0; tin không tới ai. |
| Theo dõi ca | "Lịch sử ca" (nút quay lại) | Đổi tên | "← Ca kiểm tra" | Một khái niệm một từ (A1-3). |
| Theo dõi ca | "BƯỚC TIẾP THEO · Giao chiến dịch luyện" | Giữ | "Giao chiến dịch luyện từ ca này" | Nối việc 1 → việc 2. |

## 4. Chiến dịch luyện (`GiaoChienDich`, `ChonEmGiao`, `DongHoSucChua`, `DsChienDichDaGiao`)
| Màn | Phần tử | Quyết định | Tên mới | Lý do |
|---|---|---|---|---|
| Giao chiến dịch | Chọn em "Toàn khối / Theo lớp / Từng em" trải hết | Đổi | MỘT ô chọn nhiều tầng Khối › Lớp › Em (tấm bật ra, có đếm, tích cả nhánh) | Khung dài vô ích; thầy thường chọn cả lớp (C5). |
| Giao chiến dịch | Cây tờ đề trải hết | Đổi | Ô tìm + cây thu gọn theo chuyên đề, chỉ mở nhánh đang chọn | Gọn. |
| Giao chiến dịch | "Thể lực mỗi ngày (lượt câu)" + "Tự động: máy tính…" | Đổi tên | "Số lượt câu mỗi ngày (một em)" + nút gạt "Tự tính" — "A.I Đỗ Đại Học tính số nhỏ nhất đủ kịp hạn" | "Thể lực" là chữ game của em; thầy cần đơn vị thật. Chủ ngữ theo bảng A2. |
| Giao chiến dịch | "Sức chứa tới hạn nộp" | Đổi tên | "Khối lượng so với thời gian còn lại" · Vừa sức / Sát / Quá tải | Nói rõ phép so. |
| Giao chiến dịch | Tóm tắt | Thêm | Cột phải luôn hiện: tờ đề, số câu, số em, hạn, lượt/ngày, khối lượng | Thấy đủ trước khi bấm "Giao chiến dịch". |
| Danh sách chiến dịch | Thẻ "Chiến dịch đã giao" | Đổi | Bảng: Tên · Lớp · Số em · Đã làm qua · Thành thạo · Quá tải · Hạn nộp · Trạng thái | So sánh được (C1). |
| Mọi màn chiến dịch | "Cọ xát" | Đổi tên | "Đã làm qua" (chú thích: câu em đã làm ít nhất 1 lần) | "Cọ xát" không tự giải thích. |
| Mọi màn chiến dịch | "Thành thạo" | Giữ + chú thích | "Thành thạo" (đúng đủ lịch ôn, lần cuối đúng) | Chữ quen; thêm một dòng chú thích. |
| Mọi màn chiến dịch | "Em đang Huyết Chiến" | Đổi tên (app thầy) | "Quá tải hôm nay" (phải làm vượt số lượt/ngày để kịp hạn) | Tên game giữ ở app em; thầy cần nghĩa. |
| Mọi màn chiến dịch | "Trễ nhịp" | Giữ | "Trễ nhịp N ngày" | Đã có trong bảng A2. |

## 5. Chữa trên lớp (`GoiLenBangScreen` → `LenBangChienDich`, `BangChienDich`, `BuoiChua`)
| Màn | Phần tử | Quyết định | Tên mới | Lý do |
|---|---|---|---|---|
| Chữa trên lớp | Nút "Cách cũ" (`onCheDoCu`, Gọi lên bảng theo ca) | Cất | Cài đặt › Công cụ kỹ thuật › "Gọi lên bảng theo ca (cách cũ)" | Đường phụ, dễ lẫn. |
| Bảng chiến dịch | 4 ô số | Đổi | 5 thẻ số có mẫu số + so với hôm qua: Đã làm qua · Thành thạo · Đúng nhịp · Quá tải · Cần dạy lại | Số có nhãn + đơn vị + so sánh. |
| Bảng chiến dịch | Bảng em × cột màu đỏ/vàng/xanh | Đổi | Heatmap em × dạng, MỘT dải màu (nhạt → đậm) + số % trong ô; hạng Yếu / Trung bình / Khá / Giỏi theo dạng | Thang tuần tự đọc đúng độ lớn; màu không là kênh duy nhất. Ngưỡng mới cần thầy chốt (xem README). |
| Bảng chiến dịch | "Cần thầy dạy lại" | Giữ | — | Việc chính 3. |
| Buổi chữa | "Hết hạn nộp · buổi chữa xếp sẵn" | Giữ | tiêu đề "Buổi chữa · Carbohydrate" | — |
| Buổi chữa | Cột "Điểm chữa" | Giữ + chú thích | "Điểm chữa = số em chưa thành thạo + 2 × số em cần dạy lại" | Công thức hiện ngay dưới tiêu đề cột. |
| Tờ máy chiếu | Đạt / Chưa đạt | Giữ | — | Đã chốt 27/09. |

## 6. Học sinh (`HocSinhScreen`, `ToanCanhEmScreen`, `ClassListScreen`)
| Màn | Phần tử | Quyết định | Tên mới | Lý do |
|---|---|---|---|---|
| Học sinh | "Hướng dẫn quản lý học sinh theo lớp" | Bỏ | — | Hộp hướng dẫn dài (C3). |
| Học sinh | Tab "Báo cáo / Lịch sử ca" | Đổi | Hồ sơ một trang: Năng lực theo dạng · Chiến dịch · Ca kiểm tra · Xu hướng | Một màn, không tab. |
| Học sinh | Nút "Bài tập PDF" (`NutBaiTapPdf`) | Bỏ (2.0) | — | Thuộc BTVN. |
| Học sinh | `BieuDoTienBoGoogle` + `KhoiTienBo` | Gộp | một biểu đồ xu hướng: điểm ca + % thành thạo | Hai biểu đồ cùng nói tiến bộ (C4). |
| Học sinh | "Nhật ký điều chỉnh", "Đặt lại mật khẩu", Đổi lớp, Đổi tên | Giữ, dồn vào menu "Quản lý em" | — | Cần nhưng ít dùng (C5). |
| Học sinh | "Đồng bộ danh sách" (Google Sheet) | Cất | Cài đặt › Công cụ kỹ thuật | Công cụ kỹ thuật. "Thêm em" giữ trong menu. |
| Học sinh | Giao chiến dịch từ hồ sơ em | Giữ | "Giao chiến dịch cho em này" | Đường tắt hợp lệ. |

## 7. Kho đề (`NganHangDeScreen`) và Cài đặt (`CaiDatScreen`)
| Màn | Phần tử | Quyết định | Tên mới | Lý do |
|---|---|---|---|---|
| Kho đề | Danh sách đề · Chi tiết đề · Thầy chốt đáp án | Giữ | — | Nguồn tờ đề cho chiến dịch/ca. |
| Kho đề | "Phản hồi câu hỏi từ Thần thú" | Đổi tên | "Em báo lỗi câu" | Nói đúng việc. |
| Kho đề | "Mã dạng · Thống kê và kiểm tra" | Cất | Cài đặt › Công cụ kỹ thuật | Công cụ soát dữ liệu. |
| Cài đặt | Giao diện · Game Hóa 2.0 | Giữ | — | — |
| Cài đặt | Bộ não A.I | Giữ | "Bộ não A.I hỗ trợ riêng từng em" | Bảng A2. |
| Cài đặt | Kết nối máy chủ · Máy chủ mới · Mật khẩu mở app · Cập nhật app | Gộp | nhóm thu gọn "Công cụ kỹ thuật" (mặc định đóng) cùng: Đồng bộ lại phiếu mọi ca · Đồng bộ danh sách lớp · Mã dạng · Gọi lên bảng cách cũ | Một chỗ kín cho mọi thứ kỹ thuật (lệnh thầy). |

## 8. Đã ẩn sẵn ở 2.0 — giữ ẩn, bịt lối lọt
Hôm nay cũ (`examhub`), Giao bài tập về nhà (`giaobtvn`), Học sinh hỏi (`cauhoi`), Giao đề theo tuần (`khodegiao`) — `MAN_AN_KHI_HOA2`. Lối lọt còn lại: chữ "Lịch sử ca" trong `KhoiBaiLuyen.tsx` (2 chỗ), nút "Bài tập PDF" ở Học sinh, tin phụ huynh ở Theo dõi ca; logo bấm về Ca kiểm tra → đổi về Tổng quan.

## 9. Năm điểm quan trọng nhất
1. Trang chủ mới **Tổng quan** thay Ca kiểm tra; thanh bên còn 4 việc + 2 mục đáy, bỏ nhãn "Thêm…" và "6,022 · 10²³".
2. **Chiến dịch luyện** thành mục riêng; "Giao chiến dịch" gọn 3 bước + ô chọn em nhiều tầng + tóm tắt cố định.
3. **"Lên bảng" → "Chữa trên lớp"**; "Cọ xát" → "Đã làm qua"; "Huyết Chiến" (app thầy) → "Quá tải hôm nay"; "Thể lực" → "Số lượt câu mỗi ngày".
4. Bỏ nút "Mở ca kiểm tra đầu tiên" + khối "Đồng bộ lại phiếu mọi ca" khỏi Ca kiểm tra; danh sách ca thành bảng số liệu.
5. Mọi công cụ kỹ thuật dồn vào **Cài đặt › Công cụ kỹ thuật** (thu gọn).
