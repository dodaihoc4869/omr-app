# Giao việc — Trùng tu MÀN CHIẾU LÊN BẢNG + thuật toán buổi chữa

Soạn 19/09/2026 bởi 0.Planer. Người làm: phiên **Code 1** (làn giáo viên). Thầy đã CHỐT bản vẽ ("Chốt thiết kế lên bảng").

Nguyên văn thầy: "Màn chiếu lên bảng bạn trùng tu giao diện lại cho tôi, khi chiếu lên học sinh phải không mỏi mắt, câu dài thì tự động lấy 2/3 bảng để hiển thị (làm lại thuật toán chỗ này cho chuẩn, để phải hiển thị đầy đủ trên bảng không phải cuộn bất kể câu nào). 1/3 bảng còn lại để học sinh lên làm bài. Thiết kế lại thẻ tên và hiệu ứng hiển thị thần thú cho đẹp hơn kích thích hơn. Dựa vào độ khó và đề dài hay ngắn tính toán lại hết thời gian lên bảng, chữa bài. Đảm bảo chất lượng tốt nhất cho buổi chữa đó học sinh học nhiều kiến thức nhất, nếu không chữa hết tự động tiếp tục được vào buổi sau. Thuật toán phải sửa lại thật thông minh và tối ưu vì phần này tôi dùng nhiều nhất."

## Bản vẽ đã chốt

Canvas https://claude.ai/artifact/RFUcbWFDRPQ9PPY7EPAYnK, hàng thứ tư — đọc bằng Artifact tool:
- `project/ChieuHaiEm.dc.html` — hai em, mỗi em 1/2 bảng: thẻ tên (thần thú + hào quang theo hệ, tên 30 px, "cấp · lần lên bảng thứ N", chip số câu) → đề trên nền giấy ấm → vùng làm bài TẮT SÁNG có nhãn mờ + hai nút Đạt / Chưa đạt trung tính; thanh dưới: đợt k/n, pha ĐANG LÀM BÀI / ĐANG CHỮA, đồng hồ, tiến độ, "buổi x/90 phút".
- `project/ChieuCauDai.dc.html` — câu dài: đề 2/3 (trái), 1/3 phải = thẻ tên + vùng làm bài.
- `project/ChieuGoiTen.dc.html` — màn gọi tên (thần thú lớn, hào quang, tên 44 px) và trạng thái ăn mừng khi Đạt.
Màu: nền bảng #15181c (tắt sáng), giấy ấm #f4efe4, chữ #22262b, phụ #5b6168; nhấn dùng bảng M3 đã chốt. Chữ đề: phông có chân đang dùng (`--mc-serif`); chữ giao diện: `--mc-sans`.

## Hiện trạng (Code 1 đã đọc mã)

Trang lật ngang `.mc-ray`; đợt thường = lưới 1fr/1fr; câu dài theo `laCauDai` (đoán bằng ký tự/ảnh/bảng) = 2fr/1fr; cỡ chữ `clamp(24px,2.05vw,34px) × hệ số thầy chọn`, KHÔNG co theo độ dài; nửa bảng có CUỘN dọc. Giây lên bảng Engine E chỉ theo sao `{2:300,1:180,0:120}`; chế độ dạy học có `thoiGianDayHoc()` riêng. Trạng thái buổi chỉ ở state React — tắt app là mất. Ảnh thần thú: `thanThuV2ChoToChieu()` (đã tách nền). Cầu nối nút bấm `src/lib/to-chieu-cau-noi.ts` Code 1 đã viết ~70%.

## Việc — 6 mốc, MỖI MỐC một commit, nhắn 0.Planer soát trước khi lên máy chủ

### M1 · Thời gian theo độ khó × độ dài × em (hàm thuần, một nguồn)
Tệp mới `src/lib/thoi-gian-len-bang.ts`, hằng số trong `len-bang-cau-hinh.ts` (một nguồn sự thật):
`T = T_đọc + T_làm + T_chữa`
- `T_đọc = 8 + 0,35 × sốTừ(đề + phương án/ý) + (có hình/bảng ? 10 : 0)` giây.
- `T_làm = nền[phần] × hệSốSao × (1 + 0,5 × tỉLệLớpSai) × hệSốBậcEm`; nền I 45 · II 120 · III 150; sao 0 ×1,0 · 1 ×1,5 · 2 ×2,2; bậc biết ×1,25 · hiểu ×1,0 · vận dụng ×0,85 (không có bậc → 1,0; không có tỉ lệ lớp sai → 0).
- `T_chữa = 30 + 25 × sốBước(lời giải, kẹp 1..6)`; ×1,3 nếu tỉ lệ lớp sai ≥ 0,5; không có lời giải → 1 bước.
- Kẹp 60..480 s, làm tròn 15 s. Hai em song song: `T_đợt = max(T_đọc+T_làm của 2 em) + T_chữa_A + T_chữa_B`.
- TƯƠNG THÍCH: câu không có văn bản (test cũ dựng CauChua tối giản) → rơi về `GIAY_LEN_BANG_THEO_SAO` hiện có; KHÔNG đổi giá trị 300/180/120 (test `xep-buoi-chua-1409` khoá). `thoiGianDayHoc()` của tờ chiếu gọi chung hàm mới (bỏ công thức thứ hai), giữ kẹp riêng của chế độ dạy học nếu test khoá.
- Engine E (`xep-buoi-chua.ts`) dùng `T` mới làm chi phí; tổng ≤ ngân sách 4.920 s như cũ; sàn 20 em, bắt buộc trước, 2>1>0 sao, không 2 em một câu, tất định — giữ nguyên.

### M2 · Bố cục ĐO THẬT, không bao giờ cuộn
- Trong tờ chiếu: sau khi dựng mỗi đợt, JS đo `scrollHeight` vùng đề so với chiều cao vùng; leo bậc cho tới khi vừa: (1) đôi 1/2 → (2) đơn 2/3 + 1/3 → (3) 2/3 với phương án/ý chia 2 cột, hình `max-height` giảm dần tới 40% vùng → (4) co chữ từng 1 px từ cỡ chuẩn xuống SÀN 24 px (ở 1920×1080; quy đổi theo bề ngang) → (5) TOÀN BẢNG (không còn vùng làm bài, hiện nhãn "em làm ở bảng phụ"). Không bậc nào được để `overflow` cuộn; `.mc-nua{overflow-y:auto}` bị gỡ.
- Đo lại khi đổi kích thước cửa sổ/toàn màn hình/đổi hệ số chữ của thầy. Tắt hẳn transition trong lúc đo.
- Lúc XẾP BUỔI (màn giáo viên): ước lượng bậc bằng cùng thước đo chạy trong iframe ẩn 1920×1080 (hoặc hàm ước lượng thuần đã hiệu chỉnh bằng phép đo, sai lệch ≤ 1 bậc — có test); chỉ ghép ĐÔI khi cả hai câu đạt bậc (1); câu bậc (5) được cảnh báo trong `canhBao` của buổi. Đợt đôi mà lúc chiếu đo lại không vừa → tự tách thành hai đợt đơn và cộng thời gian, có ghi chú cho thầy.
- Thay `laCauDai` đoán-bằng-ký-tự bằng kết quả đo; giữ hàm cũ làm dự phòng khi không đo được (in/PDF).

### M3 · Giao diện mới + thẻ tên + thần thú + nút chấm
- Dựng đúng 3 bản vẽ. Vùng làm bài nền #15181c, không chữ sáng lớn. KHÔNG chiếu `viSao` (lý do gọi em) lên tờ chiếu — chỉ còn ở màn giáo viên.
- Màn gọi tên đầu mỗi đợt 2,5 s (bấm phím/chạm để bỏ qua), rồi thu về thẻ tên nhỏ. Thần thú: ảnh tách nền hiện có, hào quang `radial-gradient` theo hệ, bóng elip dưới chân; chuyển động chỉ ở màn gọi tên và lúc ăn mừng — TRONG LÚC ĐỌC ĐỀ KHÔNG CÓ GÌ CHUYỂN ĐỘNG. `prefers-reduced-motion` → tắt hết.
- Nút Đạt / Chưa đạt qua cầu nối đã viết (`to-chieu-cau-noi.ts`): một đường ghi `ghiTheoKhoa`, chống ghi đôi dùng chung khoá `sbd|qid`, 8 s không phản hồi = lỗi, mã phiên + kiểm nguồn; không có cầu nối → ẩn nút. Đạt → thần thú ăn mừng 1,5 s + thẻ tên xanh "Làm tốt lắm"; Chưa đạt → nhãn trung tính "Đã ghi", KHÔNG hiệu ứng, KHÔNG chữ/màu đỏ cạnh tên em.
- Thanh dưới: pha LÀM BÀI → CHỮA tự chuyển theo `T_đọc+T_làm` rồi `T_chữa`; thầy bấm sang đợt kế bất cứ lúc nào; hết giờ chỉ đổi màu đồng hồ, không tự lật trang.
- Giữ: bản in (`@media print`), trang đáp án 12 câu/trang, 2 em/đợt, lẻ em để trống không bịa, mọi test `may-chieu-len-bang-1409*`, `btvn-len-bang-1409*`. Không thư viện, không yêu cầu mạng, không emoji.

### M4 · Lưu buổi + TỰ NỐI BUỔI SAU
- Lưu kế hoạch buổi + ô đã ghi vào IndexedDB máy thầy (store MỚI, thêm vào `exam-db.ts` kiểu chỉ-thêm, nâng version an toàn), khoá `(lớp | mã tờ đề/mã ca)`; ghi mỗi khi xếp/ghi kết quả.
- Mở lại cùng lớp + cùng tờ: thẻ "Tiếp tục buổi trước · còn N câu (đã chữa M)"; phần CÒN LẠI = kế hoạch đã lưu − ô đã có kết quả (đối chiếu thêm `lichSuLenBang` máy chủ để không mất khi đổi máy); XẾP LẠI theo em CÓ MẶT hôm nay (em vắng → thay em hợp nhất theo `diemHopCau`), câu bắt buộc chưa chữa lên đầu. Hết hạn 14 ngày. Thầy bấm "Bắt đầu buổi mới" thì bỏ qua phần dở (không xoá lịch sử máy chủ).

### M5 · Tối ưu "học nhiều nhất trong buổi"
- Giá trị câu: `v = tỉLệLớpSai × (1 + 0,5 × [dạng lớp yếu CHƯA được chữa trong buổi]) × (bắt buộc ? ∞ : 1)`; chọn theo mật độ `v / T` trong từng tầng ưu tiên đã chốt (bắt buộc → 2 sao → 1 sao → 0 sao). Ràng buộc mới: mỗi dạng lớp yếu (định nghĩa `nam_kt_dang`: ≥ 4 câu, < 0,7) có ≥ 1 câu trước khi chữa câu thứ hai cùng dạng. Ghép song song hai câu bậc (1) để tăng số lượt em.
- Báo cho thầy: tổng giá trị, số dạng yếu được phủ, số em lên bảng, số câu dời buổi sau — mọi con số đo được, không chữ "nắm chắc".

### M6 · Tự hiệu chỉnh từ giây thật
- Mỗi lần bấm Đạt/Chưa đạt, gửi kèm `giayThuc` (từ lúc đợt hiện tới lúc bấm; 20..1800 s, ngoài khoảng → bỏ). Máy chủ cần cột chỉ-thêm `len_bang.giay_thuc` — VIẾT HỢP ĐỒNG vào `docs/hop-dong-giay-thuc-len-bang-1909.md` và nhắn phiên "Code 3"; chưa có cột → client lưu tạm IndexedDB.
- Hệ số hiệu chỉnh theo `(phần, sao)` = trung vị(giây thật / T dự tính) sau ≥ 8 mẫu, kẹp 0,6..1,4; tất định theo dữ liệu đã lưu.

## Cấm
Không sửa `server/**`, `html-phieu.ts` (Code 2), các màn học sinh/phụ huynh, `ExamTakeScreen.tsx`, `de-rieng*.ts`. Không đổi giá trị hằng số mà test khoá; cần đổi test → hỏi 0.Planer trước. Không phát hành (app giáo viên nằm trong gói Pages; mỗi commit cần dòng "0.Planer đã soát"). Không hỏi thầy — hỏi 0.Planer.

## Nghiệm thu
- 40 câu mẫu đủ loại (ngắn, Phần II 4 ý dài, có hình, có bảng, lời dẫn 120 từ) ở 1280×720 và 1920×1080: 0 vùng đề có `scrollHeight > clientHeight`; cỡ chữ ≥ sàn; ảnh chụp 6 đợt tiêu biểu vào `docs/anh-man-chieu-1909/`.
- T mới: test bảng giá trị (I-0 sao-20 từ; II-2 sao-90 từ-lớp sai 60%-bậc biết; III-1 sao-có hình…) và test "câu thiếu văn bản → đúng 300/180/120".
- Buổi 90 phút mẫu: tổng ≤ 4.920 s; sàn 20 em khi đủ điều kiện như test cũ; mọi dạng lớp yếu được phủ trước khi lặp.
- Tắt app giữa buổi → mở lại: "Tiếp tục buổi trước" đúng số câu còn lại; em vắng được thay; ô đã ghi không bị hỏi lại.
- Bấm Chưa đạt: HTML tờ chiếu không chứa chuỗi "Không đạt"/"Chưa đạt" cạnh tên em sau khi ghi; không có hiệu ứng.
- Toàn vitest: không tăng so nền (97 đỏ / 42 tệp tại 19/09 tối).
