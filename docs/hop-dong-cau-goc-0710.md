# Hợp đồng — Ô ghi chú câu thay gọn + nút "Xem câu gốc" (ca "Kiểm chứng câu đã đúng", thầy 07/10)

Thầy 07/10 (kèm ảnh thẻ câu 1): *"chỗ xem lại sau và chỗ ghi chú câu lý thuyết thay … đang bị chèn nhau, chỉnh lại kích thước cho tinh tế, đẹp mắt, tôi muốn một nút nhỏ tinh tế đẹp mắt hiển thị cùng ô chỗ câu lý thuyết thay … hiển thị câu gốc đã đúng để học sinh có thể đối chiếu kiến thức của câu thay thế, bạn rút gọn ý nghĩa của phần ghi chú này lại nhé."*

Giả định đã dùng: "câu gốc" = câu em ĐÃ LÀM ĐÚNG mà câu thay (thay số / cùng dạng) thế chỗ; "hiển thị" = bung ngay trong ô khi em bấm, **không đáp án, không lời giải**, không tính điểm; "rút gọn" = dòng đậm ngắn + dòng phụ (nơi · ngày · mức), bỏ vế "(cùng dạng bài, nội dung khác)".

## 1. Máy em — ô ghi chú dưới số câu (`src/components/DaiCauThay.tsx`, `dai-cau-thay.css`)

| Câu | Ô hiện |
|---|---|
| Thay số | **Thay số từ câu em đã đúng** + dòng phụ `<nơi · dd/mm · mức>` + nút **Xem câu gốc** |
| Câu lý thuyết thay | **Thay cho câu lý thuyết em đã đúng** + dòng phụ + nút |
| Câu cùng dạng khác | **Thay cho câu em đã đúng** + dòng phụ + nút |
| Nguyên văn (không có bản thay) | `Em đã làm đúng: <nơi · dd/mm · mức>` (chữ cũ), KHÔNG nút |

- Một khối bo tròn, thụt vào hai bên, cách đầu thẻ 6 px; nút cao 32 px (vùng chạm 48 px bằng `::after`), cùng ô với ghi chú.
- Nút **Xem lại sau** thu về 36 px thẳng hàng với chip số câu (trước 48 px, thò xuống 8 px đè ô ghi chú); vùng chạm vẫn ≥ 48 px (`::after` 36 + 2×6) — `src/screens/man-thi-m3.css`.
- Bấm **Xem câu gốc** → khung **Câu gốc em đã làm đúng** bung dưới hai dòng (đề · bảng · hình · phương án A–D / ý a–d), cuối khung `Chỉ để đối chiếu, không tính điểm.`; nút thành **Ẩn câu gốc**. Tải một lần, nhớ cả phiên (`ExamTakeScreen`: ref + một hàm bền `layCauGoc`, nên thẻ `memo` không vẽ lại cả đề).
- Báo thật: `Đang tải câu gốc…` · `Chưa có câu gốc để xem ở lúc này. Em cứ làm câu bên dưới.` (máy chủ không có câu / đề đang bảo vệ…) · `Chưa tải được câu gốc lúc này.` + **Tải lại** (lỗi không được nhớ).
- Điện thoại xoay ngang (chế độ ngang gọn, câu chia đôi): khung câu gốc có trần cao 38vh + cuộn riêng để không ép thân câu (đo: 148 px / thân câu còn 86 px; không trần thì còn 33 px).
- Chữ đầy đủ `Câu này thay số của câu em đã đúng ở …` vẫn là chữ LƯU trong ca và hiện ở báo cáo cuối bài của thầy; máy em tách nó bằng `tachNhanThay` nên ca đã mở trước 07/10 cũng hiện bản gọn.

## 2. Dữ liệu — khoá `~goc:<qid câu thay>` trong bản đồ nhãn của em

Máy thầy / máy chủ (em vào muộn) ghi thêm vào CHÍNH `daDung[<sbd>]`: `"~goc:<qid câu thay>": "<qid câu gốc>"` cho mỗi câu THAY (`banDoDaDung`; câu nguyên văn và câu bù không có). Không khoá mới trong gói đề, không sửa đường cất/cắt của máy chủ (`daDung` được cắt nguyên văn), máy em cũ bỏ qua khoá lạ. Chỉ là ánh xạ qid → qid (vài chục byte một câu); nội dung câu gốc KHÔNG đi trong gói đề cả lớp.
Ca đã chốt (Bắt đầu) trước 07/10 chưa có khoá này ⇒ câu thay vẫn hiện nhãn gọn nhưng không có nút; em vào muộn ở ca ấy thì có (máy chủ lấp bằng mã mới).

## 3. Lệnh máy chủ — `POST /hs/cau-goc` (`server/src/cau-goc.ts`)

Vào: `{ maCa, sbd, qid: [qid câu GỐC] (≤ 4) }`. Ra: `{ ok, cau: { <qid gốc>: { qid, phan, text, choices, ideas, table, thanCauImg, imageDataUrl, choiceImgs, ideaImgs, hinhAnh } }, khongCo: [qid không phát được] }`; lỗi tạm / không kiểm được đề bảo vệ ⇒ `ok:false` (máy em cho bấm lại).

**Ai xem được câu nào** (một tập nhỏ): giá trị các khoá `~goc:…` của CHÍNH em ở CHÍNH ca (`bo_theo_em_json -> '$.daDung."<sbd>"'`, cắt ngay trong D1) và em phải có lượt ở ca. Câu của em khác, câu có trong kho nhưng không gắn, câu không tồn tại, câu thay của đề đang làm ⇒ cùng một dáng `khongCo` (không dò được kho). Xin > 4 câu / thiếu mã ca / SBD lạ ⇒ lỗi hoặc `khongCo`.

**LUẬT ĐỎ không đáp án**: đầu ra đi qua `cauCongKhai` (whitelist, bỏ ảnh `sau_loi_giai`) rồi thu hẹp thêm — không `correct`, `solution`, `reviewed`, `version`, `group`, mức độ, dạng, kiến thức. Máy em đọc lại bằng `docCauGoc` (whitelist thứ hai, nguồn ảnh chỉ `data:image/`, `http(s)://`, `/`).

**Các cổng "câu phục vụ cho em" giữ**: có trong chỉ mục game + tờ kho còn · không tự luận · không khác khối em (luật thầy 05/10, kênh `cau_goc`, `chanKhacKhoiEm`) · đề đang bảo vệ (`protectedQuestions`) — NGOẠI LỆ duy nhất: câu chỉ dính bảo vệ vì nằm trong đề của chính ca này (bản của em khác giữ nguyên câu ấy; `protectedQuestionsTruCa` bỏ đề của ca này, các ca khác vẫn giữ) vì với em xin xem đó là câu em đã đúng từ trước. Không kiểm được đề bảo vệ ⇒ đóng cửa.
**Không áp** các cổng chỉ có nghĩa với việc LUYỆN: kho đề giao theo tuần, phạm vi cá nhân, bộ chọn chung, ảnh chụp câu — câu gốc chỉ để đối chiếu, không phải việc em được giao.

Chi phí: đường thường **4 truy vấn D1** (bản đồ+lượt · nội dung · danh sách ca bảo vệ · khối em), 0 lần đọc R2 kho; xin câu không được phép dừng sau **1** truy vấn. Chỉ đọc (không ghi D1/R2). Không có công tắc riêng: nút chỉ hiện khi bản đồ có khoá `~goc:`; lùi = revert commit.

## 4. Kiểm
`tests/cau-goc-0710.test.ts` (máy chủ trên D1 thật: đề công khai, không lộ đáp án, tập được xem, lượt, SBD lạ, tự luận, khác khối, đề bảo vệ + ngoại lệ trừ ca + nhóm nội dung, đóng cửa, chi phí) · `tests/cau-goc-may-em-0710.test.ts` (tách nhãn, khoá `~goc:`, `docCauGoc`, gói hỏi máy chủ) · `tests/dai-cau-thay-0710.test.tsx` (ô: nhãn gọn, nút, tải một lần, lỗi + Tải lại, không đáp án, nối màn thi) · cập nhật `tests/che-do-da-dung-thay-so-0610.test.ts`, `…-man.test.tsx`, `tests/man-thi-than-m3-1909.test.tsx` (nhãn gọn; nút "Xem lại sau" 36 px + vùng chạm 48 px). Kiểm đột biến: `docs/kiem-dot-bien-cau-goc-0710.md`.
