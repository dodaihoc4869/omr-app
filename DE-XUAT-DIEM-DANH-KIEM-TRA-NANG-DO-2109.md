# ĐỀ XUẤT — ĐIỂM DANH mỗi buổi + KIỂM TRA NÂNG ĐỠ 15 phút / 50 phút, đề riêng cho từng em có mặt

Người viết: Boss · 21/09/2026 · CHỜ THẦY ĐỌC VÀ CHỐT (chưa build gì).
Thầy lệnh: nút điểm danh trên app học sinh mỗi buổi học → có danh sách em có mặt → thầy bấm "Kiểm tra 15 phút" hoặc "50 phút (chuẩn cấu trúc)" → máy quét dữ liệu từng em, tự tạo đề phù hợp nâng đỡ từng em → popup "Vào thi" bật lên máy học sinh. "Buổi học nào cũng kiểm tra."

## 1 · Ý TƯỞNG MỘT CÂU
Mỗi buổi học là một vòng khép kín **Điểm danh → Kiểm tra vừa sức → Chữa đúng chỗ sai → Ôn lại theo lịch**: em nào có mặt cũng nhận một đề CÙNG cấu trúc, CÙNG thời gian, nhưng câu hỏi chọn theo đúng hồ sơ của em — nên em yếu làm được và tiến lên, em khá không chán, và hai em ngồi cạnh nhau không chép được bài nhau.

## 2 · DÙNG LẠI NHỮNG GÌ APP ĐÃ CÓ (không làm lại luồng thi)
Luồng thi thật giữ NGUYÊN: mã ca, link `/t/<mã>`, phòng chờ + đồng bộ giờ cả phòng, vân tay máy, giữ-để-đọc, cảnh báo rời màn, đáp án không xuống máy em, công bố điểm khi cả lớp nộp. Đã có sẵn: đề riêng từng em trong MỘT ca (`boTheoEm`), rút đề chuẩn cấu trúc 2026 (18 trắc nghiệm · 4 đúng–sai · 6 trả lời ngắn · 50 phút), hồ sơ từng câu/từng dạng + bậc Biết/Hiểu/Vận dụng, lịch ôn 1·3·7, cấm câu tự luận, nút "Chiếu mã vào thi", thông báo đẩy tới app học sinh. Việc MỚI chỉ là: điểm danh, bộ chọn đề kiểm tra theo em, và popup vào thi.

## 3 · ĐIỂM DANH
- **Thầy**: màn Hôm nay có nút **"Bắt đầu buổi học"** → chọn lớp → máy chiếu hiện **MÃ BUỔI HỌC 4 số ĐỔI MỖI 30 GIÂY** (kèm QR). Danh sách có mặt nhảy số trực tiếp; thầy thêm/bớt tay được (em quên điện thoại). Nút "Chốt điểm danh".
- **Học sinh**: đầu Bảng nhiệm vụ hiện thẻ **"Điểm danh buổi học hôm nay"** → nhập mã đang chiếu (hoặc quét QR) → "Đã điểm danh 18:02". Sau đó app vào **chế độ trong buổi học** (hỏi máy chủ mỗi ~10 giây để popup bật tức thì).
- **Chống điểm danh hộ** (không dùng GPS — kém chính xác và đụng riêng tư): mã đổi 30 giây chỉ thấy được trong lớp · mỗi MÁY chỉ điểm danh cho MỘT em mỗi buổi (dùng mã máy sẵn có) · điểm danh ngoài khung giờ buổi học bị từ chối · thầy thấy cờ "cùng máy", "điểm danh muộn".
- **Dữ liệu sinh ra**: bảng `buoi_hoc`, `diem_danh` (chỉ-thêm). Phụ huynh thấy "Con đã điểm danh 18:02 · buổi 21/09"; em vắng buổi ⇒ vào bản tin của thầy và hồ sơ em; Bộ não A.I đọc được chuyên cần.

## 4 · NÚT "KIỂM TRA 15 PHÚT" / "KIỂM TRA 50 PHÚT"
Sau khi có danh sách có mặt, màn buổi học hiện hai nút lớn. Bấm một nút ⇒ máy làm hết trong vài giây:
1. **Phạm vi nội dung tự trộn** (thầy đổi được, có thể ghim tờ đề nguồn): ~50 % bài ĐANG HỌC (lấy từ tờ đề/BTVN thầy giao gần nhất của lớp) · ~30 % dạng EM đang yếu (kể cả chương trước) · ~20 % câu ôn giãn cách đã tới hạn của em.
2. **Khung đề giống nhau cho mọi em** — công bằng về hình thức: **50 phút = đúng cấu trúc 18 · 4 · 6 (28 câu)**; **15 phút = 8 trắc nghiệm · 1 đúng–sai (4 ý) · 1 trả lời ngắn (10 câu)**. Cùng số câu từng phần, cùng thang điểm 10, cùng giờ bắt đầu/kết thúc (đồng bộ giờ).
3. **Chọn câu theo từng em** (dùng chung lõi thuật toán với BTVN nâng đỡ, chạy trên máy thầy rồi gửi lên như một ca "đề riêng" bình thường):
   - **Phần chung ≈ 40 %**: các câu cốt lõi giống nhau ở mọi em (để so lớp, để chữa chung, để bộ chống chép có mẫu).
   - **Phần riêng ≈ 60 %**: đúng bậc thang của em ở từng dạng — em ở bậc Biết KHÔNG nhận câu Vận dụng của dạng đó; mỗi dạng em yếu ≥ 1–2 câu đúng bậc; câu em từng sai mà chưa đúng lại được ưu tiên; em khá nhận câu cao hơn một bậc; 1–2 câu "thử thách — sai không sao" ở cuối phần.
   - Không lặp câu em đã làm trong 14 ngày; không bao giờ có câu tự luận; hai em bất kỳ khác nhau ≥ 50 % câu ⇒ ngồi cạnh cũng không chép được.
   - Em CHƯA có hồ sơ ⇒ đề chẩn đoán cân bằng Biết/Hiểu.
4. **Xem nhanh trước khi phát** (5 giây, không bắt buộc): "32 em · mỗi em 10 câu · chung 4 · riêng 6 · 3 em chưa có hồ sơ". Nút **"Phát đề"**.
5. **Popup vào thi**: máy mọi em đã điểm danh bật tấm phủ **"Thầy vừa mở bài kiểm tra 15 phút — Vào thi"** (kèm rung/thông báo đẩy nếu em bật) → một chạm vào thẳng màn thi, không phải nhập mã. Em vào muộn: điểm danh xong là có đề ngay, dùng chung giờ kết thúc với cả phòng.

## 5 · ĐIỂM SỐ — nói thẳng một điều quan trọng
Đề của mỗi em khó dễ khác nhau ⇒ **điểm bài nâng đỡ KHÔNG dùng để xếp hạng em với em**. Đây là bài kiểm tra ĐỂ HỌC: mỗi em thấy điểm của mình + thẻ "hôm nay em tiến thêm gì"; thầy thấy thêm **"điểm phần chung"** (so được giữa các em) và bản đồ dạng sai của lớp. Vinh danh trong buổi tính theo TIẾN BỘ, không theo điểm thô. Khi thầy cần bài xếp hạng thật ⇒ dùng ca kiểm tra ĐỀ CHUNG như hiện nay (một công tắc "Đề chung cả lớp / Đề nâng đỡ từng em", mặc định nâng đỡ).

## 6 · SAU KHI NỘP — tự động hết
Chấm tức thì → câu sai vào lịch ôn 1·3·7 → hồ sơ + bậc thang cập nhật → **buổi chữa xếp sẵn ngay trong buổi**: "3 dạng sai nhiều nhất · gợi ý 5 em lên bảng" (nối màn Gọi lên bảng) → phụ huynh nhận "Con đã điểm danh · làm bài kiểm tra 15 phút: x/10, đúng lại 2 câu từng sai" → đêm đó Bộ não A.I dùng kết quả để chỉnh bài tập về nhà của em.

## 7 · RỦI RO + CÁCH CHẶN
Mạng lớp yếu ⇒ đề của em tải về ngay lúc phát, làm bài không cần mạng liên tục (luồng thi đã vậy). Kho câu mỏng ở một dạng ⇒ thuật toán nới sang dạng gần + báo thầy "kho thiếu câu dạng X". Em không có điện thoại ⇒ thầy điểm danh tay, em làm bản in (in được từ đề của em). Lạm dụng điểm danh hộ ⇒ mục 3. Thêm ~2 lệnh máy chủ chỉ-thêm; KHÔNG đổi luật chấm, luật vào thi hay chống gian lận.

## 8 · LÀM THEO BA NẤC (nấc nào cũng dùng được ngay)
- **Nấc 1**: Điểm danh (mã đổi 30 giây, danh sách trực tiếp, phụ huynh thấy). 
- **Nấc 2**: Hai nút kiểm tra nâng đỡ + popup vào thi + thẻ tiến bộ + buổi chữa xếp sẵn sau bài.
- **Nấc 3**: Thời khoá biểu theo lớp ⇒ buổi học TỰ mở trước giờ 10 phút, thầy không phải bấm "Bắt đầu buổi học"; báo cáo chuyên cần tuần cho phụ huynh.
Vẽ mẫu 4 màn cho thầy duyệt trước khi build: màn buổi học của thầy (mã + danh sách + hai nút) · xem nhanh trước khi phát · thẻ điểm danh + popup vào thi của học sinh · kết quả sau bài.

## 9 · BỐN ĐIỀU XIN THẦY CHỐT (kèm khuyến nghị)
1. Chống điểm danh hộ bằng **mã 4 số đổi mỗi 30 giây chiếu trên màn** + mỗi máy một em, KHÔNG dùng GPS — khuyên: CÓ.
2. Bài nâng đỡ **không xếp hạng theo điểm thô**; thầy có thêm "điểm phần chung" để so; bài xếp hạng dùng đề chung — khuyên: CÓ.
3. Cấu trúc **15 phút = 8 · 1 · 1 (10 câu)**; 50 phút = 18 · 4 · 6 đúng chuẩn — khuyên: CÓ (thầy sửa số được).
4. Nội dung mặc định **tự trộn 50 % bài đang học · 30 % dạng em yếu · 20 % ôn giãn cách**, thầy ghim tờ đề nguồn khi muốn — khuyên: CÓ.
