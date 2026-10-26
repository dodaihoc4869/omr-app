# Kiểm kê màn app học sinh (25/10)

Dưới đây là bản kiểm kê màn hình học sinh (`/hs`) theo nội dung hiển thị. Nhãn để nguyên văn tiếng Việt. Ghi chú "chưa chắc" nằm ở cuối.

**1. dang-nhap** (`/home/user/omr-app/src/screens/DangNhapHocSinh.tsx:143-283`)
- Vào: `/hs` khi chưa có phiên.
- Tiêu đề "Hành trình giỏi Hóa". Ô "Số báo danh (SBD)" (placeholder "Ví dụ: 110234 hoặc 12026"), ô "Mật khẩu" (gợi ý "(Lần đầu chưa có để trống để đặt)"), nút "Đăng nhập", chữ "Quên mật khẩu: nhắn thầy để đặt lại."
- Lần đầu: "Mật khẩu mới", "Xác nhận mật khẩu", "Quay lại", "Xác nhận & Đăng nhập".
- Lỗi: "Em nhập số báo danh (SBD).", "Mật khẩu mới phải có tối thiểu 6 ký tự", "Xác nhận mật khẩu không khớp".

**2. hom-nay** (`/home/user/omr-app/src/components/hoc-tap/HocTapHomNay.tsx:146-170`, khung trong `src/screens/StudentPortalScreen.tsx:899`)
- Thanh điều hướng `aria-label="Điều hướng học sinh"` có 4 mục: Hôm nay · Hành trình · Ôn & sửa · Kết quả.
- Thanh trên: "Vào ca kiểm tra", nút "Cập nhật bài học", ảnh đại diện "Của em", chuông thông báo.
- Tiêu đề "Chào {tên}" và dòng "Thứ … dd/mm · lớp".
- Thẻ lịch riêng: `TheKiemTraCaNhan.tsx`, nhãn "Lịch dành riêng cho em", tiêu đề "Kiểm tra ôn tập", chip "Đang chuẩn bị" hoặc "Làm bài kiểm tra". Có số "câu / phút / bài đã học".
- Thẻ chính "Hôm nay · {thứ dd/mm}" (`TheHomNayEm.tsx`): "Đủ mức hôm nay" hoặc "Còn N câu", "Đã làm x/M câu hôm nay", vạch "Tiến độ hôm nay", "Xong x/y chặng", "mỗi chặng tối đa 6 câu".
- Nút chính: "Bắt đầu học", "Học tiếp · N câu", "Học thêm", "Đã làm hết câu được giao", "Hôm nay còn N câu chờ thầy bổ sung".
- Nhịp học "Nhịp học của em": chip Chăm / Chưa đều / Lười / Chưa đủ dữ liệu, "Việc tiếp:", "Ra khỏi nhóm Lười:", "Thầy cũng thấy bảng này.", nút "Xem hồ sơ làm bài của em".
- "Bài học trong 7 ngày" (`TheGoi7.tsx`): "Gặp câu gốc: x/y câu", "Câu mới hôm nay: a/b", "Còn N câu trong bài", "Đã qua hạn; …".
- Thẻ mời "Tự sửa lỗi" (`TheMoiTuSua`, chỉ hiện khi còn câu cần sửa), nút "Sửa lỗi ngay".
- Nhóm "Ôn và sửa": "Tự sửa lỗi", "Câu đã làm", "Bài tập về nhà" (kèm "Thầy đang giao" hoặc "Xem lại bài đã nộp").
- Tấm "Của em": "Bài gia đình giao", "Thông tin từ gia đình", "Đăng xuất".
- Trạng thái: "App đang làm mới, khoảng 1–5 phút…", lỗi kèm "Thử lại", khung xương khi đang tải.
- "Bài hằng ngày" không có nhãn riêng ở học sinh. Gần nhất là "Bài học trong 7 ngày".

**3. hanh-trinh** (`src/components/hoc-tap/HanhTrinhOnSua.tsx:143-161`)
- "Thang 4 tầng của mỗi bài": Nền · Hiểu · Vận dụng · Tổng hợp. Trạng thái "Đã vững", "Đang luyện", "Còn khoá".
- "Em đang luyện tầng {X}", "Bài đang luyện · N bài". Mỗi bài có "Gặp câu gốc x/y câu" và "Bộ bài đang chờ đủ nguồn". Trống: "Chưa có bài đang luyện."
- Nút: "Học tiếp · N câu".

**4. on-lai** (`HanhTrinhOnSua.tsx:124-138`)
- Thẻ "Tự sửa lỗi" với "Câu đang chờ em sửa" / "Không còn câu cần sửa" / "Câu em làm sai", nút "Sửa lỗi ngay".
- "Câu đã làm" ("Lời giải và lịch ôn từng câu"), "Tu luyện" ("Luyện thêm theo chương, dạng, mức"), "Luyện lại từ bài kiểm tra" ("Câu sai trong các bài kiểm tra").

**5. tu-sua-loi** (`src/components/hoc-tap/ManTuChua.tsx`, khung "Quay lại" trỏ về "Hôm nay")
- Tiêu đề "Tự sửa lỗi". Con số lớn "N câu cần sửa" + "Sửa lại câu em làm sai".
- "Đã tự sửa: x/y câu", "Chờ lần gặp lại: N câu".
- Nhóm: "Cần sửa" ("Tất cả câu cần sửa"), "Đang chờ lần gặp lại", "Đã tự sửa".
- Mục "Kiểm lại sau Hỏi thầy" ("N câu") với "Làm tiếp", "Kiểm lại", "Xem lịch".
- Nút: "Bắt đầu sửa", "Sửa tiếp", "Xem tiến độ sửa", "Tải thêm câu cần sửa", "Xem tiếp các câu", "Về Hôm nay", "Luyện thêm ở Tu luyện".
- Trạng thái từng câu: "Chưa bắt đầu", "Đang sửa từng bước", "Đang ghép lại cả bài", "Chờ chữa trên lớp · em sửa trước được", "Sửa trên câu gốc", "Tạm khoá · tiến độ được giữ", "Đã tự sửa".
- Trống: "Em không còn câu nào cần sửa". Lỗi: "Chưa tải được câu cần sửa" + "Thử lại". Tắt: "Tự sửa lỗi chưa mở cho em".

**6. chua-cau-sai** (không có tệp tên `ChuaGon`. Màn thực là `src/components/chua-cau-sai/ManChuaCauSai.tsx`)
- Nhãn: "Chữa câu sai", tiêu đề là tên câu hoặc "Sửa câu này", thẻ "Sửa trên câu gốc" / "Sửa từng bước".
- Cột phụ: "Đường tự gỡ" ("x/y bước"), "Xem lại đề gốc", "Những bước đã kiểm".
- Khu làm: "Bước đang luyện", "Thầy cùng em gỡ", "Một gợi mở", "Hiểu bước này trong bài". Bước: "Tìm chỗ vướng", "Hiểu cách làm", "Vì sao cách này đúng?", "Thử điều vừa hiểu với bài mới".
- Kết thúc: "Em đã tự sửa xong câu này", "Câu này không cần sửa nữa". Lỗi: "Chưa mở được câu này", "Đang lưu…".

**7. tu-luyen** (`src/components/tu-luyen/ManTuLuyen.tsx`, `TongHopTuLuyen.tsx`, `LuyenDeCauTruc.tsx`)
- Ba thẻ con: "Luyện" / "Tổng hợp" / "Luyện đề cấu trúc".
- Bốn chế độ: "Sửa câu sai" (Làm lại câu em đã sai từ 29/09), "Dạng câu sai" (Câu mới cùng dạng với câu em sai), "Dạng bài" (Chọn Lớp → Bài → Dạng để luyện sâu), "Tự do" (Rút ngẫu nhiên, lọc theo sao và loại câu). Có "Đang khoá".
- Bộ lọc: "Số câu", "Lớp", "Bài", "Dạng bài", "Loại câu" (Ngẫu nhiên · 2 sao · 1 sao · Lý thuyết). Nút "Bắt đầu luyện · N câu", "Luyện N câu sai".
- Chấm: "Chấm từng câu" hoặc "Làm hết rồi nộp cả lượt". Trong bài: "Kiểm tra câu này", "Câu tiếp", "Nộp bài". Hộp xác nhận: "Nộp bài tu luyện?", "Bỏ bài đang làm?" ("Bỏ bài", "Làm tiếp").
- Tổng hợp: "Tổng quan" (Lượt đã nộp, Chuỗi ngày, Chuỗi dài nhất, Thời gian luyện), "Tỉ lệ đúng theo tuần", "Nên luyện tiếp", "Theo dạng bài", "Theo mức sao của câu", "Theo phần", "Lượt gần đây" ("Xem lại"), "Khắc phục câu sai từ 29/09".
- Luyện đề cấu trúc: "Đề đã nộp", "Điểm gần nhất / cao nhất / trung bình", "Mở Luyện đề cấu trúc".

**8. ket-qua** (`HocTapHomNay.tsx:181-185`)
- "Điểm thầy đã công bố". Hai mục: "Ca kiểm tra" ("Điểm và lời giải ca đã công bố") và "Kết quả bài đã nộp" ("Điểm và báo cáo đã công bố").

**9. ho-so-lam-bai** (`src/components/hoc-tap/HoSoCuaEmHs.tsx`, nội dung từ `src/components/chien-dich/HoSoLamCauEm.tsx`)
- Tấm trượt, tiêu đề "Hồ sơ làm bài của em", "Cách em học 14 ngày qua".
- Nhãn "Học thật" hoặc "Thầy xếp em vào nhóm Đối phó" (kèm lý do).
- Khối: "Làm bài 7 ngày", "Câu từng sai", "Lịch làm bài theo ngày", "Số giây theo mức độ câu", "Lọc lượt" (tablist).
- Khối Mức làm 6 mức: "Mức 5" là Treo máy. Mức 6 "Cố tình treo máy" chỉ hiện ở màn thầy.
- Nút "Mở Bài tập về nhà" khi hồ sơ trống.
- Chưa xác minh tên Mức 1–4.

**10. cau-da-lam** (`src/components/hoa2/CauDaLam.tsx`, mở từ "Câu đã làm")
- Tiêu đề "Câu đã làm", "Về Hôm nay", "Danh sách câu", "Chi tiết câu", "Xem lời giải", "Lịch sử làm câu này".
- Bộ lọc: "Tất cả", "Sai lần gần nhất", "Cần ôn", "Thành thạo", "Cần thầy dạy lại".
- "Tất cả các bài" trong ô chọn bài. Trống: "Mục Câu đã làm chưa mở cho em."

**11. lich-su-ca** (`StudentPortalScreen.tsx:1040-1160`, `LichSuCaM3`)
- "Xem Điểm & Lịch Sử Ca Kiểm Tra", "Lịch sử ca kiểm tra & Báo cáo kết quả", nút "Xem báo cáo".
- Ô điểm theo phần: "Phần I (TN)", "Phần II (Đ/S)", "Phần III (Trả lời)".

**12. hoc-tiep** (`src/components/hoc-tap/ManLamBaiTap.tsx`, mở từ "Học tiếp")
- Tiêu đề "Chặng học của em", "Chặng N · Câu x/y", "Xong chặng N".
- Nút: "Nộp câu", "Còn N ý chưa chọn", "Câu tiếp theo", "Kết thúc chặng", "Học tiếp chặng N", "Tự làm câu này", "Sửa câu này", "Học cách giải", "Chưa làm được? Học cách giải", "Xem lời giải đầy đủ", "Nghỉ và về Hôm nay", "Thử lại".
- Trạng thái câu: "tự làm đúng", "sai", "có hỗ trợ", "đang làm", "chưa làm". Gợi ý: "Gợi ý".

**13. kiem-tra-ca-nhan** (`src/components/hoc-tap/ManKiemTraCaNhan.tsx`)
- Hai nhãn chính: "Bài dành riêng cho em", "Kiểm tra ôn tập".
- Danh sách chặng: "Chặng N", "Làm chặng N", "Làm tiếp chặng N", "Đã chốt", "Nộp chặng N", "Nộp toàn bài", "Làm tiếp". Hộp: "Nộp bài kiểm tra?", "Nộp chặng N?". Lưu: "Đã lưu trên máy chủ".

**14. btvn** (`StudentPortalScreen.tsx:1179-1400`)
- "Bài Tập Về Nhà". Ba bước: "CHẶNG ĐANG MỞ", "CHẶNG SAU", "NỘP BÀI".
- Nút: "Vào làm bài", "Xem lại bài", "Làm lại bài tập về nhà này (còn x/3 lượt)", "Tải lại danh sách". Trạng thái: "Đã hết hạn. Em báo Thầy để được gia hạn."

**15. mom** (`StudentPortalScreen.tsx:1402-1730`)
- "Bài gia đình giao (120 phút từ khi bắt đầu)". Các nút: "Danh sách bài", "Tạm dừng", "Nộp bài gia đình giao", "Nộp bài ngay", "Xem kết quả & Lời giải HTML". Thời gian làm 2 giờ.

**16. khac-phuc** (`StudentPortalScreen.tsx:1732`)
- "Khắc Phục Lỗi Sai & Luyện Đề". Mở từ "Luyện lại từ bài kiểm tra".

**17. vao-thi** (`StudentPortalScreen.tsx:1761-1830`, màn thi `ExamTakeScreen.tsx:2794-2950`)
- "Vào Phòng Thi Trực Tuyến". Nhãn "Mã ca kiểm tra", "Mật khẩu ca kiểm tra", nút "Vào ca kiểm tra". Thoát: "Đóng phòng thi, về cổng học sinh".
- Màn thi: "Bắt đầu", "Xem điểm của em", nhắc "Bật Không làm phiền", "Bật toàn màn hình".

**18. man-thi** (`src/screens/ExamTakeScreen.tsx`)
- Thanh trên: "Đã làm x/N", đồng hồ, "Danh sách câu" (lưới: "Đã làm x/N", "Chỉ nộp bài trong 1 phút cuối").
- Nút: "Nộp bài" hoặc "Nộp bài (còn m:ss)". Hộp "Đang làm bài, không thoát được. Nộp bài luôn?" có "Tiếp tục làm" và "Nộp bài".
- Phần: "Phần I", "Phần II", "Phần III" (Trắc nghiệm · Đúng–sai · Trả lời ngắn). Hạn bài tập: "Bài tập", "Hạn …".
- Sau nộp: "Đã nộp bài" (lần x), "Số báo danh:", "Mã ca:", "Giờ nộp:", "Số câu đã làm: x/N". Đang gửi: "Đang gửi lên hệ thống… đừng tắt trình duyệt", "Gửi lại ngay".
- Kết quả (`src/components/xem-diem/KetQuaSauNop.tsx`): "Em đã nộp bài", "Ba phần của bài", "Từng câu" (đúng · sai · đúng một phần · bỏ trống), "Thầy Đỗ Đại Học đã lo cho em", "Kết quả bài thi", "Đúng hết tất cả các câu!". Nút: "Xem báo cáo học tập", "Xem đề & lời giải", "Xem lại lời giải", "Hỏi thầy".
- Ba trạng thái công bố: "Không công bố trên máy em", "Xem điểm khi cả lớp xong", đã công bố.
- Khoá: "BÀI THI ĐÃ KHOÁ", "Em giơ tay gọi Thầy".

**19. bong-bong-ai** (`src/components/ai-ddh/BongBongAiDdh.tsx`)
- Nút nổi "Mở A.I Đỗ Đại Học (giữ và kéo để đổi chỗ)". Khung "A.I Đỗ Đại Học", trạng thái "Đang trực, nhắn gì cũng được" / "Đang nghỉ, tin vẫn được giữ".
- Lời chào "Chào {tên}! Có gì cứ nói với mình nha." Nút "Chụp ảnh đề", "Chọn ảnh có sẵn", "Dán đề bài". Ô "Nhắn gì cũng được…", nút "Gửi", "Hôm nay bạn còn N/M lượt nhắn".
- Khoá: "Bạn đang có bài kiểm tra mở" ("Tự khoá khi bạn đang làm bài kiểm tra.").

**20. khoa-khi-thi**
- Khoá bài thật ở `ExamTakeScreen.tsx` (rời màn hình là khoá). `src/screens/KhoaAppScreen.tsx` là màn khoá của thầy, không phải của học sinh.

**21. bang-tin** (`src/components/BangTinPhuHuynh.tsx`, tab `bantin`)
- "Bài hôm nay", "Câu cần ôn", "Câu đang chờ làm". Các ô: "Xem điểm", "BTVN", "Bài gia đình giao", "Luyện đề", "Vào thi", "Thần thú của em".
- Có "Bảng vinh danh" (`src/components/BangVinhDanh.tsx`): "Vinh danh hôm nay · Chốt lúc 00:01".

**22. thong-bao** (`src/components/ThongBaoHocSinh.tsx`)
- Nhãn "Thông báo, N chưa đọc", hộp "Thông báo".

**23. game** (không hiện được)
- `StudentPortalScreen.tsx:311` chuyển tab `thanthu` và `bia` về `hoctap`. Ô "Thần thú của em" trong bang-tin thực tế mở Học tiếp.
- Không tìm thấy `Game.tsx` hay `Doan*.tsx` trong `src/`. Chỉ có `src/game/than-thu-v2/BieuCamThu.tsx` và `Reports.tsx`.

**Mã có thể đã chết**
- Không thấy nơi gọi từ ngoài thư mục: `src/components/bang-nhiem-vu/DanhSachNhiemVu.tsx`, `NutVaoThi.tsx`, `OThiDua.tsx` ("Thi đua hôm nay"), `TheChoAn.tsx`, `TheVeDich.tsx`, `TheLamNgay.tsx`.

**Chưa chắc**
- Tên Mức làm 1–4.
- Nhãn nút trong `LamBaiNgang.tsx`/`LamBaiNgangGon.tsx` chưa đọc.
- Đường vào `bantin` từ chuông thông báo chưa kiểm chi tiết.
- Chữ nút "Về" ở màn kết quả chưa đọc.