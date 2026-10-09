# Giao diện đầy đủ ba app · 09/10/2026

Lệnh mới của thầy: “đẩy hết giao diện mới”. Bộ 38 bản vẽ được ánh xạ vào màn và trạng thái thật bên dưới; không tạo 38 tuyến độc lập hoặc đưa số minh họa vào sản phẩm. Màu dùng nguyên token hiện hành.

## Thay đổi nhìn thấy

- Học sinh: kế hoạch và nút học tiếp trước ba bước; bốn mục Hôm nay / Hành trình / Ôn lại / Của em; bốn tầng có diễn giải; ba cửa trò chơi dùng khóa thật. Câu hỏi và chữa câu có vùng đọc trái trên khổ rộng, tiến độ và thao tác phải, kéo đổi độ rộng vẫn được lưu.

- Phụ huynh: bốn mục Hôm nay / Tiến bộ / Lịch sử / Lời thầy; gợi ý hỗ trợ gia đình ghi rõ là gợi ý chung; lịch sử lọc trong tập ca thực nhận; thông tin tài khoản; đọc tầng đã chốt khi kế hoạch đúng Hành trình, không lập kế hoạch thay con.

- Giáo viên: ba thẻ Hành trình và đường bổ sung bài; cây kho khối–bài–dạng; hồ sơ mở nhịp học/dòng thời gian tại chỗ; tác vụ phụ từng em thu gọn; duyệt đề và lời giải cạnh nhau; bàn gỡ chọn nhóm giữ bản nháp; mở ca theo bốn bước và giữ các giá trị đã chọn.

Các lớp phụ dùng `src/styles/giao-dien-day-du.css`, `ph-v3/giao-dien-day-du.css`, `sanh-v2.css`, `gv-v2.css`, `gv-hom-nay.css` và `dao2/tran-v2.css`. Màn thi thật tiếp tục dùng các cảnh báo, đồng hồ, điều kiện nộp và quyền công bố hiện hành.

## Ánh xạ đủ bộ bản vẽ

| App | Màn / trạng thái | Nguồn đang chạy |
|---|---|---|
| Giáo viên | Tổng quan | `src/screens/GvHomNayScreen.tsx` |
| Giáo viên | Ba hành trình | `src/components/chien-dich/HanhTrinhV2.tsx` |
| Giáo viên | Hành trình · Khối 12 | `src/components/chien-dich/HanhTrinhV2.tsx` |
| Giáo viên | Học sinh | `src/screens/HocSinhScreen.tsx` |
| Giáo viên | Hồ sơ một em | `src/screens/HocSinhScreen.tsx + src/screens/ToanCanhEmScreen.tsx` |
| Giáo viên | Kho kiến thức | `src/screens/NganHangDeScreen.tsx + src/components/KhoKienThucCay.tsx` |
| Giáo viên | Duyệt câu & lời giải | `src/screens/DuyetLoiGiaiScreen.tsx` |
| Giáo viên | Bài hôm nay / Chữa trên lớp | `src/components/day-hoc/DayHocLenBang.tsx` |
| Giáo viên | Bàn gỡ nút thắt | `src/screens/BanGoNutThatScreen.tsx` |
| Giáo viên | Ca kiểm tra | `src/screens/LichSuCaScreen.tsx` |
| Giáo viên | Mở ca kiểm tra | `src/screens/ExamSetupScreen.tsx` |
| Giáo viên | Theo dõi ca | `src/screens/ExamMonitorScreen.tsx` |
| Giáo viên | Cài đặt & công cụ | `src/screens/CaiDatScreen.tsx` |
| Giáo viên | Cổng giáo viên | `src/screens/KhoaMayThayScreen.tsx + src/screens/KhoaAppScreen.tsx` |
| Học sinh | Hôm nay | `src/components/ban-duyet-v2/SanhV2.tsx` |
| Học sinh | Hành trình bốn tầng | `src/components/ban-duyet-v2/SanhV2.tsx` |
| Học sinh | Làm chặng 6 câu | `src/game/than-thu-v2/dao2/TrongAi.tsx + src/game/than-thu-v2/DoanTran.tsx` |
| Học sinh | Chữa câu vừa làm | `src/game/than-thu-v2/dao2/TrongAi.tsx + src/game/than-thu-v2/DoanTran.tsx` |
| Học sinh | Trạm hồi phục | `src/components/loi-giai/ThanhThangGo.tsx` |
| Học sinh | Xong chặng | `src/game/than-thu-v2/dao2/XongChuyen.tsx + src/game/than-thu-v2/doan2/KetChang2.tsx` |
| Học sinh | Tổng hợp cho học sinh sẵn sàng | `src/components/ban-duyet-v2/SanhV2.tsx` |
| Học sinh | Ôn lại | `src/components/ban-duyet-v2/SanhV2.tsx` |
| Học sinh | Tu luyện | `src/components/tu-luyen/ManTuLuyen.tsx` |
| Học sinh | Đảo · Đoàn · Bi-a | `src/components/ban-duyet-v2/SanhV2.tsx` |
| Học sinh | Ca kiểm tra / Đề thử | `src/screens/ExamTakeScreen.tsx + src/game/than-thu-v2/dao2/DeThu.tsx` |
| Học sinh | Kết quả đã công bố | `src/components/hoa2/LichSuCaEm.tsx` |
| Học sinh | Sổ học / Câu đã làm | `src/components/hoa2/CauDaLam.tsx` |
| Học sinh | Thần thú / Túi đồ | `src/game/than-thu-v2/dao/ThanThuV2.tsx` |
| Học sinh | Cửa hàng | `src/game/than-thu-v2/shop/ManShop.tsx` |
| Học sinh | Của em / Thiết lập | `src/components/ban-duyet-v2/SanhV2.tsx` |
| Học sinh | Đăng nhập học sinh | `src/screens/DangNhapHocSinh.tsx` |
| Phụ huynh | Hôm nay | `src/components/ph-v3/ManHomNay.tsx` |
| Phụ huynh | Tiến bộ | `src/components/ph-v3/ManTienBo.tsx` |
| Phụ huynh | Lịch sử | `src/components/ph-v3/ManDiemSo.tsx` |
| Phụ huynh | Chi tiết ca kiểm tra | `src/components/ph-v3/ManChiTietCa.tsx` |
| Phụ huynh | Lời thầy | `src/components/ph-v3/ManLoiThay.tsx` |
| Phụ huynh | Thông tin & giao diện | `src/components/ph-v3/AppPhuHuynh.tsx` |
| Phụ huynh | Cổng phụ huynh | `src/screens/ParentPortalScreen.tsx` |

## Dữ liệu và kiểm chứng

Không có ước lượng phút học, lý do chọn câu hoặc bằng chứng “tự đúng lại tuần này” khi API chưa cung cấp. Tầng sẵn sàng của từng bài không suy từ số câu đã làm. L4 và Bi-a giữ cổng máy chủ; câu chưa được công bố không đưa đáp án xuống máy.

Cổng phụ huynh chỉ thêm SELECT theo đúng SBD/ngày cho kế hoạch Hành trình đã chốt. Snapshot của chiến dịch cũ không được dùng. Thiếu bảng hoặc dữ liệu thì bỏ khối; không DDL, không fit, không ghi/chốt kế hoạch.

Bộ chụp Chromium mở component thật với máy chủ giả ở harness riêng, chặn mọi yêu cầu ra ngoài. Ảnh không phải dữ liệu sản xuất. Các kiểm tra gồm đọc/chọn đáp án, xoay thiết bị giữ nháp, chuyển câu và focus, chuyển mục; mỗi JPG ≤150 KB. Danh sách ca trong harness có cả nguồn vắng: không dùng ảnh đó để kết luận dữ liệu thật đầy đủ.

Kết quả toàn repo được so theo tên test với main `4c07da39`; không báo toàn repo xanh khi có nền đỏ. Chi tiết kết quả cuối và mã phát hành ghi trong DIEU-PHOI.md.
