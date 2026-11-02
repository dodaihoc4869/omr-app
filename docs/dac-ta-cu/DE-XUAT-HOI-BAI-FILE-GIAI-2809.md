# ĐỀ XUẤT — Học sinh hỏi bài → nhận "file giải" kiểu Phòng thí nghiệm Ester

28/09/2026 · CHỜ THẦY CHỐT (chưa build gì). Mẫu tham chiếu: `docs/hoc-lieu/ester-thi-nghiem.html`.

## 0. Kết luận
Không để AI viết nguyên một trang HTML cho mỗi câu. Tách làm hai phần:
- **Một khung trình bày cố định**, kiểm thử một lần, dùng cho mọi câu.
- **Một hồ sơ dữ liệu nhỏ cho từng câu**, chỉ có chữ, số, đáp án và tên hoạt hoạ.

Quy trình:
1. Claude chạy trên máy thầy (đúng như thầy chốt ngày 21/09, không dùng API trả tiền) điền hồ sơ.
2. Máy tự kiểm đáp án và con số.
3. Thầy bấm Duyệt.
4. Học sinh bấm "Hỏi bài" ở câu nào thì nhận đúng hồ sơ của câu đó, tra theo mã câu `qid`.

Vì sao không để AI viết thẳng HTML như bản Ester:
- Mỗi file nặng khoảng 265 KB.
- Mỗi file một kiểu, không đồng bộ.
- Máy không kiểm được đúng sai.
- AI viết mã chạy trong app là rủi ro bảo mật.
- Lỗi hiển thị như thẻ "Vai trò hoá chất" hôm 28/09, nếu nằm trong 1.000 file riêng thì phải sửa 1.000 lần. Với khung chung, sửa một lần là xong cho mọi câu.

## 1. Hiện trạng (đã soát mã)
- **"Hỏi bài" đã có, nhưng chỉ một chiều.** Sau khi nộp bài, học sinh gửi câu hỏi qua `TamTruotHoiBai` → `guiCauHoi` (`server/src/goi-cu.ts:407`), dữ liệu vào bảng `cau_hoi_em`. Thầy xem ở `CauHoiScreen`. Học sinh không nhận lại gì.
- **Câu hỏi định danh bằng `qid`.** Nội dung và lời giải dạng chữ nằm ở R2 `kho/<ma_de>.json`. Đáp án ca thi để riêng ở `key/<maCa>.json`.
- **Cổng "đáp án không xuống máy trước khi nộp" đã có:** `laSanSangCongBo`, `cauCongKhai`, `ketQuaCuaEm`.
- **Máy chủ không còn gọi AI nào.** Bộ não A.I đã gỡ ngày 28/09. Chữ phía học sinh ký "Thầy Đỗ Đại Học".
- **Khung xem HTML hiện có** (`KhungXemPhieu`, iframe `srcDoc`) **chưa có `sandbox`.** Nội dung do AI soạn bắt buộc phải chạy trong khung có sandbox.
- **Web push đã có** (`server/src/notifications.ts`), dùng được để báo cho học sinh.

## 2. Ba phương án

| | A. Kho duyệt sẵn | B. Hàng chờ theo yêu cầu | C. Gọi API tức thì |
|---|---|---|---|
| Học sinh nhận | Ngay lập tức | Khi thầy duyệt xong (máy soạn trong khoảng 30–60 phút) + báo đẩy | 30–90 giây |
| Độ đúng | Đã duyệt | Đã duyệt | Chưa duyệt, có thể sai |
| Chi phí | 0 đ API (máy thầy) | 0 đ API | Ước tính 0,15–0,25 USD/câu (Claude Opus 5) |
| Công build | ≈ 2,5 ngày | Thêm ≈ 0,5 ngày trên A | ≈ 2 ngày, cộng khoá API và giới hạn chi |
| Nhận xét | Nhanh nhất cho học sinh | Chỉ soạn câu thật sự được hỏi | Trái quyết định 21/09 và việc gỡ Bộ não 28/09 |

**Khuyên dùng: A và B chạy chung một dây chuyền** (cùng khung, cùng hồ sơ, cùng cổng duyệt). Chỉ khác lúc kích hoạt:
- A: thầy bấm "Soạn lời giải cả đề" trước khi giao.
- B: học sinh hỏi câu chưa có hồ sơ.

## 3. Dây chuyền
1. Học sinh làm xong, bấm **Hỏi bài** ở một câu (nút có sẵn).
2. Máy chủ kiểm tra:
   - Chưa nộp hoặc điểm chưa công bố → không xem được.
   - Có hồ sơ **đã duyệt** của `qid` → trả ngay, mở khung lời giải.
   - Chưa có hồ sơ → ghi vào hàng chờ (`cau_hoi_em`, có sẵn). Học sinh thấy "Thầy đang soạn lời giải câu này".
3. Phiên Claude trên máy thầy (hẹn giờ quét hàng chờ, hoặc thầy bấm "Soạn ngay"):
   - Soạn hồ sơ theo khuôn.
   - Tự chạy bộ kiểm (mục 4).
   - Đẩy lên trạng thái "chờ duyệt".
4. Trên app thầy: xem trước đúng như học sinh sẽ thấy, rồi chọn **Duyệt / Sửa chữ / Soạn lại**.
5. Duyệt xong:
   - Báo đẩy cho mọi học sinh đã hỏi câu đó.
   - Học sinh hỏi câu đó về sau nhận ngay.

## 4. Sáu khoá "đúng câu, đúng file, đúng đáp án"
1. **Khoá mã câu:** tra theo `qid`, không đoán theo chữ.
2. **Khoá dấu vân tay:** hồ sơ gắn với mã băm nội dung câu. Thầy sửa đề thì hồ sơ cũ tự hết hiệu lực, phải soạn lại.
3. **Khoá đáp án:** Đ/S từng ý, đáp án A–D và số trả lời ngắn trong hồ sơ phải trùng khoá đáp án trong kho. Lệch thì máy chặn, không cho duyệt.
4. **Khoá con số:** phép tính ghi dưới dạng dữ kiện, khung tự tính lại. Số AI ghi lệch với số máy tính thì chặn.
5. **Khoá duyệt:** chỉ hồ sơ "đã duyệt" xuống máy học sinh. Không có chế độ xem bản nháp.
6. **Khoá thời điểm:** dùng đúng cổng công bố hiện có.

Thêm hai lớp an toàn:
- AI chỉ viết **dữ liệu** (chữ, số, tên hoạt hoạ trong danh sách cho phép), **không viết mã**.
- Khung chạy trong `iframe sandbox="allow-scripts"`, không có `allow-same-origin`, nên không đọc được phiên đăng nhập của học sinh.

## 5. Khuôn hồ sơ lời giải (rút từ bản Ester)
- **Định danh:** `qid`, `bam` (dấu vân tay nội dung), `dang` (`tn` | `ds` | `tln`: đúng 3 dạng app cho mở ca, không có tự luận), `chuong`, `phienBan`.
- **`dung[]`:** các bước dòng chảy thí nghiệm hoặc dựng phân tử, gồm biểu tượng, tiêu đề, mô tả, "giữ/bỏ".
- **`y[]`:** mỗi ý hoặc mỗi lựa chọn gồm chìa khoá, kiểu bẫy, "soi", 3 bậc gợi ý (Gắn / Soi / Chốt), đáp án, lời chốt.
- **`phepTinh[]`:** dữ kiện (V, D, m, M, H, hao hụt…). Khung tự chạy chuỗi tính và hiện từng bước.
- **`hoatHoa[]`:** tên và tham số lấy trong danh sách cho phép: `tach-chat`, `ban-thi-nghiem`, `chuoi-hieu-suat`, `do-thi-bang`, `soi-phan-tu`, `acid-beo`, `pho-ir`…
- **`tuongTu[]`:** 1–2 câu tương tự, có đáp án (cũng đi qua khoá 3 và 4).
- **`nho`:** một câu cần nhớ.

Kích thước khoảng 3–8 KB mỗi câu. Khung tải một lần rồi lưu trong bộ nhớ đệm chạy-lúc, **không** đưa vào precache của app (trần precache 3000 KB).

Phần dùng chung và phần riêng:
- **4 nhịp và 7 kiểu bẫy** dùng chung cho mọi chương.
- **Bộ chìa khoá** riêng theo chương: ester đã có 6, các chương khác soạn dần.

## 6. Lộ trình (khi thầy chốt)
1. **≈ 1 ngày.** Tách khung một câu từ bản Ester, viết khuôn và bộ kiểm. Chuyển 8 câu Ester thành hồ sơ, so khớp với bản hiện tại.
2. **≈ 0,5 ngày.** Máy chủ:
   - Bảng `loi_giai` (chỉ-thêm) và R2 `giai/<qid>.json`.
   - Ba lệnh: `/hs/loi-giai`, `/gv/loi-giai/cho-duyet`, `/gv/loi-giai/duyet`.
   - Gắn vào cổng công bố hiện có.
3. **≈ 0,5 ngày.** App:
   - Nút "Xem lời giải" ở màn Hỏi bài và Câu cần chữa.
   - Màn duyệt trên app thầy (dùng được trên điện thoại).
4. **≈ 0,5 ngày.** Kĩ năng "soạn hồ sơ lời giải" cho phiên máy thầy, hẹn giờ quét hàng chờ, báo đẩy.

**Nghiệm thu:**
- 8 câu Ester qua đủ 6 khoá.
- Cố tình ghi sai đáp án hoặc sai số thì bị chặn.
- Học sinh chưa nộp thì không xem được.
- Điện thoại 390 px không vỡ, không cuộn ngang.
- Không lỗi JavaScript.

## 7. Thầy cần chốt
1. Chạy A + B như khuyên, hay thêm C?
2. Soạn trước cả ngân hàng, hay chỉ đề sắp giao + câu được hỏi? (Khuyên: chỉ đề sắp giao + câu được hỏi.)
3. Nhịp quét hàng chờ 30 phút hay 60 phút? Máy thầy có bật liên tục không?
4. Đề chụp ảnh từ sách ngoài app có để sang giai đoạn 2 không? (Khuyên: có. Khi làm thì máy tìm câu trùng trong kho trước, không có mới soạn mới.)
