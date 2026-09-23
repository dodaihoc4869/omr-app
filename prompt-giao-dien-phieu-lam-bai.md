# Giao việc — Thiết kế lại giao diện PHIẾU LÀM BÀI HTML của học sinh (Material 3)

Soạn 19/09/2026 bởi 0.Planer theo lệnh thầy. Người làm: phiên **Code 2 - Giao diện**, SAU KHI xong và commit việc "Bảng nhiệm vụ".

Nguyên văn thầy: "thiết kế lại toàn bộ giao diện của html các bài làm học sinh bấm lên làm. Tôi muốn nó cũng xuất sắc đẹp đỉnh, học sinh nhìn vào là muốn làm bài tập. Giữ nguyên cách hiển thị lời giải và công thức câu hỏi các thứ như bản này, đổi giao diện làm bài cho kích thích và chuẩn Google."

## Góc nhìn

Phiếu là nơi em **nộp bài thật**. Đẹp mà làm mất một đáp án đã chọn là thất bại. Vì vậy đây là việc **thay áo, không thay xương**: toàn bộ phần nhìn nằm trong hằng `CSS_PHIEU` (`src/lib/html-phieu.ts:183-1180`), tách khỏi phần dựng nội dung (`chuHtml`, `doanHtml`, `muiTenHtml`, `bangHtml`, `anhHtml`, `hinhTaiViTri`, `oGiaiHtml`) và phần hành vi (`JS_PHIEU`, dòng 1666-2305). 41 tệp test đang soi id/class/câu chữ của phiếu — coi chúng là hợp đồng.

Thứ làm em "muốn làm bài" không phải màu, mà là **cảm giác tiến lên**: thấy rõ còn mấy câu, chạm một phát là chọn được, chọn xong có phản hồi ngay, xong lô có khoảnh khắc ghi nhận.

## Phạm vi

- **Đổi**: giao diện trên MÀN HÌNH của phiếu ở chế độ học sinh làm/nộp: BTVN (`laBtvn`), phiếu khắc phục, bài Mẹ giao, "đề + lời giải của em" — tức mọi lượt `dungPhieu` có `tuyChon.nop` hoặc `laBtvn`, và bản xem lại sau nộp của chính các phiếu đó.
- **Không đổi**: bản in (`@media print` giữ nguyên từng byte), tờ máy chiếu (`html-may-chieu.ts`), phiếu giáo viên in giấy/PDF (`bai-tap-pdf.ts`), màn thi `ExamTakeScreen`.
- Cách cô lập: thêm MỘT lớp vào `<body>` (đề nghị `gd-m3`) qua tham số `lopBody` sẵn có của `taiLieuHtml`, chỉ khi ở chế độ học sinh nêu trên; mọi luật CSS mới viết dưới `.gd-m3 …`. Không có lớp đó thì phiếu ra y như cũ.

## GIỮ NGUYÊN TUYỆT ĐỐI

1. Đầu ra của `chuHtml`, `doanHtml`, `muiTenHtml`, `bangHtml`, `anhHtml`, `hinhTaiViTri`, `dapAnChu`, `oGiaiHtml`: công thức, chỉ số trên/dưới, mũi tên phản ứng, bảng, hình, thứ tự và câu chữ lời giải. Chỉ được đổi KHUNG bao ngoài (nền, bo góc, khoảng cách), không đổi nội dung bên trong.
2. Toàn bộ hành vi `JS_PHIEU`: chọn/bỏ chọn, lưu nháp localStorage (`KHOA_LUU`, `.cho`), nộp, nộp lại, khoá sau nộp, mở lời giải sau nộp, `postMessage` (`ddh-btvn-xong-lo`, các tin khác), vân tay, đếm câu, lưới số câu, nút "Hiện tất cả câu". Được THÊM hành vi thuần trang trí (thanh tiến độ, lớp trạng thái), không được sửa luồng dữ liệu.
3. Mọi `id`, `class`, thuộc tính `data-*`, và câu chữ mà test đang soi, ví dụ: `thanh-phan-tang-btvn`, `nut-mo-het-cau`, `q-card-active`, `q-card-dimmed`, `dimmed-pacing-banner`, `du-nop`, `vong-btvn vong-1/2/3`, chuỗi `Hôm nay em làm <b>N</b> câu sáng`, `<b>M</b> câu còn lại mở dần theo ngày/giờ`, `Câu thuộc lô tiếp theo`, banner `THUẬT TOÁN 3 VÒNG…`, `function vanTayBo(`. Trước khi đổi một dòng markup: `grep -rn "<chuỗi>" tests/`.
4. Gói `#du-nop` (kể cả trường `dapAn` — việc gỡ nó thuộc GĐ 3 cá nhân hoá, KHÔNG làm ở đây).
5. Phiếu là MỘT tệp HTML tự đứng: không thêm thư viện, không thêm yêu cầu mạng (không Google Fonts qua mạng; dùng đúng phông phiếu đang dùng, dự phòng hệ thống).

## BẢN VẼ THẦY ĐÃ CHỐT (19/09: "ôi đẹp quá, tôi chốt thiết kế này")

Canvas https://claude.ai/artifact/RFUcbWFDRPQ9PPY7EPAYnK, hàng thứ hai. Đọc bằng Artifact tool, giao diện build ra phải khớp:
- `project/PhieuLamBai.dc.html` — đang làm bài (sáng): thanh trên dính + tiến độ + lời khích lệ; banner lô; Phần I hàng chọn 52 px; Phần II nút Đ | S liền nhau; Phần III ô nhập viền nổi; câu lô sau mờ 38% có khoá; thanh dưới dính + nút Nộp.
- `project/PhieuSauNop.dc.html` — sau nộp: thẻ kết quả "5/6 câu đúng" + EXP + 3 ô Đúng/Sai/Chưa làm; câu đúng thu gọn; câu sai mở với "Em điền / Đáp án" + khối Lời giải.
- `project/PhieuLuoiCau.dc.html` — tối: hộp xác nhận nộp + tấm lưới số câu trượt từ dưới.
Công thức/mũi tên/lời giải trong bản vẽ chỉ là MINH HOẠ; bản thật lấy nguyên đầu ra của `chuHtml`/`doanHtml`/`oGiaiHtml` hiện có.

## THIẾT KẾ (cùng bảng màu với Bảng nhiệm vụ)

- **Token M3 một chỗ**: khối biến CSS đầu phần `.gd-m3` (sáng + `prefers-color-scheme: dark`), đúng bảng màu đã dùng: primary #0b57d0/#a8c7fa · primaryContainer #d3e3fd/#0842a0 · secondaryContainer #c2e7ff/#004a77 · tertiaryContainer #c4eed0/#0f5223 · errorContainer #f9dedc/#8c1d18 · surface #fdfbff/#131314 · surfaceContainer #f0f4f9/#1e1f20 · surfaceContainerHigh #e9eef6/#282a2c. Ngoài khối này, phần `.gd-m3` không có mã màu cứng.
- **Thanh trên dính**: tên bài + hạn (giờ VN) + "Đã làm X/N" + thanh tiến độ tuyến tính M3; cuộn thì thu gọn còn tiến độ.
- **Thẻ câu**: surfaceContainer, bo 20 px, số câu dạng chip tròn, nhãn phần/mức độ dạng chip tonal; câu đang làm có viền nhấn primary 2 px (không dùng viền trái màu).
- **Phương án Phần I**: mỗi phương án là một hàng chọn M3, cao ≥ 48 px, chữ cái trong vòng tròn; chọn → nền primaryContainer + dấu tích, có lớp trạng thái khi chạm (8%); không dịch bố cục khi chọn.
- **Phần II (Đúng/Sai 4 ý)**: mỗi ý một hàng, bên phải là nút phân đoạn Đ | S kiểu M3 segmented button, ≥ 48 px.
- **Phần III (điền số)**: ô nhập M3 outlined, bàn phím số, nhãn nổi, gợi ý định dạng thập phân dấu phẩy.
- **Lô mờ**: giữ `q-card-dimmed` 38% + khoá + dòng "Mở sau khi xong…"; banner lô là thẻ tertiaryContainer.
- **Lưới số câu**: bottom sheet M3 mở từ nút ở thanh trên; ô: chưa làm (outline), đã làm (primaryContainer), đang xem (primary), bị khoá (mờ).
- **Nộp bài**: nút filled ở thanh dưới dính, kèm "còn N câu chưa làm" nếu có; hộp xác nhận kiểu M3 dialog. Hành vi nộp không đổi.
- **Sau nộp / lời giải**: thẻ kết quả (đúng/sai/chưa làm bằng 3 màu vai trò), mỗi câu có dải trạng thái; khối lời giải là surfaceContainerHigh bo 16 px với tiêu đề "Lời giải" — NỘI DUNG bên trong giữ nguyên.
- **Cảm giác tiến lên** (thuần CSS + vài dòng JS trang trí, tất định): chọn đáp án → thẻ nảy nhẹ 120 ms và tiến độ chạy; qua mốc 50% và 100% câu sáng → một dòng khích lệ cố định theo mốc ("Được nửa đường rồi", "Xong lô hôm nay"); xong hết → thẻ hoàn thành phóng nhẹ 1 lần. Không pháo giấy, không âm thanh, không hiệu ứng lặp vô hạn. Tắt hết khi `prefers-reduced-motion`.
- **Tiếp cận**: tương phản ≥ 4,5:1 cả sáng/tối (giữ xanh `tests/phieu-tuong-phan-trinh-duyet.test.ts`), đích chạm ≥ 48 px, vùng an toàn iOS, cỡ chữ hệ thống 130% không vỡ.

## KHÔNG ĐƯỢC LÀM

- Không sửa `@media print`, `html-may-chieu.ts`, `bai-tap-pdf.ts`, `ExamTakeScreen.tsx`, `server/**`, `tro-ly-ca-nhan.ts`, `lich-lo-btvn.ts`, `btvn-cho-em.ts` (trừ đúng chỗ truyền `lopBody` nếu bắt buộc — báo 0.Planer trước).
- Không đổi/xoá id, class, chuỗi test đang soi; không đổi cấu trúc `#du-nop`; không đổi khoá localStorage.
- Không thêm thư viện, không thêm yêu cầu mạng, không emoji; biểu tượng là SVG nét nội tuyến.
- Không tăng kích thước phiếu quá 25 KB (gzip) so với hiện tại.
- Không phát hành. Không hỏi thầy — hỏi 0.Planer.

## ĐẦU RA

1. Sửa `src/lib/html-phieu.ts` (khối `.gd-m3` trong `CSS_PHIEU`, markup bao ngoài tối thiểu, JS trang trí) và đúng các chỗ gọi cần truyền lớp body.
2. `tests/phieu-m3-1909.test.ts`: (a) lớp `gd-m3` chỉ có ở chế độ học sinh, phiếu in/máy chiếu không có; (b) khối `@media print` trước/sau giống hệt (so chuỗi); (c) ngoài khối token, phần `.gd-m3` không có `#[0-9a-f]{6}`; (d) các id/class/chuỗi ở mục GIỮ NGUYÊN còn đủ; (e) có khối `prefers-reduced-motion` và `prefers-color-scheme: dark`; (f) đầu ra `oGiaiHtml`/`chuHtml` của 3 câu mẫu không đổi so với trước.
3. Ảnh chụp Chromium 360/390/430 px, sáng + tối, cho 5 trạng thái: BTVN đang làm có lô mờ · Phần II · Phần III · hộp xác nhận nộp · sau nộp có lời giải. Lưu `docs/anh-phieu-m3-1909/`, kèm 2 ảnh "trước" để so.
4. Ghi `SO-VIEC-GIAO-DIEN.md`; commit chỉ tệp của mình; nhắn 0.Planer: commit, số test, kích thước phiếu trước/sau.

## NGHIỆM THU

- 41 tệp test đang soi phiếu: không tệp nào đỏ thêm so với nền (nền toàn bộ 98 đỏ/43 tệp; riêng `nop-phieu-khac-phuc.test.ts` đang có 2 đỏ sẵn).
- Làm thử một BTVN 12 câu trên Chromium 390 px: chọn đủ 3 dạng câu, tải lại trang → đáp án còn nguyên; nộp → máy chủ nhận đúng gói như trước (so JSON `#du-nop` trước/sau đổi giao diện: giống hệt).
- In thử (Ctrl+P) phiếu giáo viên: giống hệt bản cũ.
- Bật Reduce motion: không còn chuyển động nào.
