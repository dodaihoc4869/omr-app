# ĐỀ BÀI — XEM ĐIỂM SAU KIỂM TRA + MỌI BÁO CÁO CHI TIẾT, bản 2 (cả 3 app) — VẼ MẪU TRƯỚC, THẦY DUYỆT RỒI MỚI BUILD

Người viết: Boss · 21/09/2026. Thầy lệnh: "màn xem điểm sau thi thiết kế lại cho phù hợp với tất cả thuật toán và giao diện 3 app hiện tại, hiển thị thông tin, làm lại mọi báo cáo chi tiết rất đẹp mắt, trực quan ở cả 3 app, vẽ mẫu cho tôi trước khi duyệt."

## 1 · HIỆN TRẠNG (đã kiểm kê 21/09 — đừng khám phá lại)
- HS: kết quả ngay sau nộp nằm trong `ExamTakeScreen.tsx` (~2900–3110); báo cáo 4 tab `BaoCaoCaThiHocSinhModal.tsx`; danh sách ca `bang-nhiem-vu/LichSuCaM3.tsx` (+ nhánh trùng lặp không-M3 trong `StudentPortalScreen.tsx` ~1437–1520).
- PH: `BaoCaoCaThiPhuHuynhModal.tsx`; tab Xem điểm trong `ParentPortalScreen.tsx` (~750–830).
- Dùng chung: `TheTienBo.tsx` + `BieuDoTienBoGoogle.tsx` (SVG tự vẽ; KHÔNG có thư viện biểu đồ — giữ vậy), `PhieuScreen.tsx` (báo cáo in được).
- GV: `ExamMonitorScreen.tsx` (chi tiết ca, bảng điểm), `LichSuCaScreen.tsx`, `ResultsScreen.tsx`, `HocSinhScreen` + `HoSoEmView` + `KhoiHoSoHocTap`, `ToanCanhEmScreen`.
- BỐN LỖI THẬT phải hết ở bản 2: (a) tab "Mức độ nhận thức" của hai modal đang dùng TỔNG CỨNG 12/12/10/6 thay vì số thật của ca; (b) `BieuDoTienBoGoogle.tsx:310,368` còn in "Hạng x/sĩ số" trên màn HS/PH (cấm so em với em); (c) cổng HS/PH gọi thẳng `hsLichSuCaApi` + `hsCauSaiApi` mà không đọc luật công bố `CongBoDiem` — chỉ trông vào máy chủ (Code 3 xác nhận máy chủ chặn đủ; máy em cũng phải hiện đúng trạng thái "chưa công bố"); (d) `CardCaThiGanNhat.tsx` mồ côi, JSX ca trùng lặp ở cổng HS.
- Dữ liệu ĐÃ CÓ mà báo cáo chưa dùng: bậc thang theo dạng (`nam_kt_dang.bac`), số lần sai từng câu, lịch ôn 1·3·7 (`moc_on_ke`), thời gian từng câu (`giay`), tiến bộ so với ca trước CỦA CHÍNH EM theo dạng, khắc phục luôn, EXP.

## 2 · MỘT BỘ XƯƠNG BÁO CÁO cho cả 3 app (khác nhau ở giọng và độ sâu, không khác cấu trúc)
1. **Kết quả**: điểm/10 thật to + đúng x/y câu + thời gian làm; so với LẦN TRƯỚC CỦA CHÍNH EM (mũi tên + số). Không xếp hạng, không xếp loại năng lực ở HS/PH.
2. **Ba phần I · II · III**: ba thanh (đúng/tổng, điểm phần), chạm mở danh sách câu của phần.
3. **Theo dạng bài**: mỗi dạng một dòng — tên dạng (không mã), đúng/tổng trong ca này, BẬC của em ở dạng đó (Biết · Hiểu · Vận dụng) và có đổi bậc sau ca không. Dạng vấp xếp trên.
4. **Câu cần xem lại**: câu sai + câu đúng nhưng làm rất lâu; mỗi câu: đề rút gọn, em chọn gì, đáp án, lời giải (chỉ khi ĐÃ công bố), thời gian làm, và dòng "Máy đã xếp câu này vào lịch ôn ngày dd/mm".
5. **Bước tiếp theo máy đã lo**: "Bài tập về nhà tới ưu tiên dạng …", "Mai ôn lại N câu", "+N EXP" — chỉ nói điều CHẮC CHẮN xảy ra (luật Bộ não).
6. **Tiến bộ qua các ca**: đường điểm của chính em + 3 dạng tiến bộ nhất. Bỏ hạng.
- HS: giọng "em", khích lệ bằng số thật. PH: tiếng thường, không mã, không thuật ngữ, thêm "Anh/chị có thể làm gì" (1–2 gợi ý). GV: thêm lớp — phổ điểm, câu sai nhiều nhất, dạng cả lớp vấp, em cần để ý, "điểm phần chung", nút sang Buổi chữa xếp sẵn / Toàn cảnh một em; ở GV được so sánh trong lớp.
- Trạng thái theo luật công bố: `khong` ⇒ "Thầy chưa công bố điểm"; `ca_lop_xong` ⇒ "Đã nộp a/b em — điểm hiện khi cả lớp nộp"; tuyệt đối không lộ đáp án/lời giải trước công bố.

## 3 · VIỆC VẼ MẪU (chưa build, chưa đụng mã chạy thật)
- Mẫu = trang HTML tĩnh tự chứa (dữ liệu giả hợp lý, tên giả) trong `docs/ban-ve-xem-diem-2109/`, dùng đúng token màu + kiểu M3 của app, chụp JPG ≤ 150 KB: **390 và 1440, sáng và tối**.
- **Code 2** vẽ: HS-1 kết quả ngay sau nộp (3 trạng thái công bố) · HS-2 báo cáo chi tiết (một trang cuộn dọc có mục lục dính, thay 4 tab) · HS-3 danh sách ca ở tab Xem điểm · PH-1 báo cáo cho phụ huynh · PH-2 danh sách ca · bản in A4 (PhieuScreen).
- **Code 4** vẽ (SAU bản mẫu bảng tin bản 3): GV-1 chi tiết ca (tổng quan lớp + bảng em) · GV-2 báo cáo một em trong ca · GV-3 lịch sử ca.
- Code 2 vẽ TRƯỚC bộ thành phần chung (số lớn, thanh phần, dòng dạng + huy hiệu bậc, thẻ câu, thẻ "máy đã lo") thành `docs/ban-ve-xem-diem-2109/bo-thanh-phan.html`; Code 4 dùng lại đúng bộ đó.
- Luật: `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` (kể cả mục LUẬT THÂN THIỆN mới), mọi con số có nhãn, không emoji, không "nắm chắc", không nhãn năng lực, đích chạm ≥ 48, tương phản ≥ 4,5:1.
- Gửi Boss: danh sách ảnh + 5 dòng "bản 2 khác bản cũ ở đâu". Boss gom gửi thầy duyệt. **KHÔNG build trước khi thầy duyệt.**

## 4 · KHI BUILD (sau duyệt) — rào
`ExamTakeScreen`: CHỈ đổi phần nhìn khối kết quả sau nộp; không đổi luật công bố, luật chấm, câu chữ cảnh báo, tín hiệu rời màn. Đáp án không xuống máy em trước khi được phép. Test khoá chữ/cấu trúc báo cáo (19 tệp, xem kiểm kê của Boss trong Nhật ký) sửa CÓ CHỦ Ý, liệt kê. Code 3: xác nhận máy chủ chặn `hsCauSaiApi`/lời giải theo luật công bố + trả thêm trường cần cho mục 3–5 (chỉ-thêm).
