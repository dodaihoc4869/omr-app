# Hỏi thêm Thầy (AI Gemini) — hướng dẫn thầy · 13/10/2026

Mọi câu em làm ngoài giờ kiểm tra và ngoài Gọi lên bảng có hai nút: **Hỏi thầy** (nổi bật) mở hộp thoại nảy lên có đề câu và ô nhắn; **Lời giải từng bước** mở khung lời giải như cũ. Em nhắn, Gemini trả lời đúng giọng Thầy Đỗ Đại Học (xưng "Thầy", gọi "em", theo quy tắc viết của Thầy), căn cứ trọn đề (chữ, phương án/ý, bảng, hình) và trọn lời giải (kho, lời giải từng bước, lời Thầy gỡ, học liệu). Em chưa làm câu đó thì Thầy gợi hướng trước, em hỏi thẳng đáp án mới nêu. Mã: `server/src/hoi-tro-ly.ts`, `src/components/loi-giai/NutHoiThay.tsx`, `HopHoiThay.tsx`, `HoiThemThay.tsx`.

## Bật
1. aistudio.google.com → Get API key → Create API key (nên dùng dự án Google Cloud đã bật thanh toán: tầng miễn phí cho Google dùng nội dung để cải thiện sản phẩm — kiểm lại điều khoản lúc bật).
2. dash.cloudflare.com → Workers & Pages → `omr` → Settings → Variables and Secrets → Add → Type **Secret**, Name `GEMINI_API_KEY`, dán khoá → Deploy. KHÔNG dán khoá vào chat, repo hay tệp nào.
3. Có khoá là bật cho mọi em. Chưa có khoá ⇒ ô hỏi tự ẩn.

## Tuỳ chỉnh (không cần phát hành lại) — `cau_hinh.khoa = 'hoi_tro_ly'`, giá trị JSON, mọi khoá tuỳ chọn
`{"bat": true, "lop": ["12A1"], "sbd": [], "model": "gemini-3.1-flash-lite", "tranNgay": 12, "tranCau": 6, "thinkingBudget": 1024, "nhietDo": 0.3}`
- `bat:false` tắt hẳn · `lop`/`sbd` chỉ mở cho lớp/em đó (chạy thử) · `tranNgay` câu hỏi/em/ngày · `tranCau` lần hỏi/câu/ngày.
- Mặc định `gemini-3.1-flash-lite` (thầy tối 13/10: "chuyển xuống mô hình 3.1 flash lite"; trước đó 3.5 Flash-Lite). Google báo 404/410 (model ngừng cấp cho khoá mới / đã gỡ) ⇒ máy chủ tự thử `gemini-3.5-flash-lite`, rồi `gemini-flash-lite-latest`, `gemini-flash-latest`; sổ ghi đúng model đã trả lời. `thinkingBudget` chỉ gửi cho model 2.5 (`null` = không gửi).

## Luật máy chủ (không tin máy em)
- Cùng cổng chặn nút Hỏi thầy: em có ca kiểm tra mở ⇒ khoá; câu thuộc ca chưa công bố (kể cả bản chép ở tờ khác) ⇒ khoá.
- Em phải bấm Hỏi thầy câu đó trong 24 giờ qua (đã tính "có trợ giúp" như hiện nay); game: hỏi được Thầy ở câu chưa có lời giải từng bước cũng tính có trợ giúp.
- Ngoài phạm vi câu đang xem ⇒ máy chủ trả câu cố định, bỏ chữ của AI (cờ `lienQuan` trong đầu ra JSON).
- Không gửi tên, SBD sang Google. Lịch sử hội thoại đọc từ sổ máy chủ (3 lượt gần nhất, cùng câu), không nhận lịch sử máy em gửi.

## Xem lại
Bảng D1 `hoi_tro_ly`: sbd, qid, câu hỏi, trả lời, `lien_quan`, model, token vào/ra, thời gian, lỗi. Lỗi Gemini không trừ lượt của em. Chi phí: nhân số token với bảng giá hiện hành tại ai.google.dev/pricing.

## Nút Hỏi thầy ở mọi câu (thầy 13/10)
Thầy: "Nút hỏi bài phải đặt ở tất cả các câu, trừ các câu trong màn kiểm tra và gọi lên bảng. Đặt ở vị trí để học sinh dễ nhìn thấy thuận tiện ưu tiên hỏi bài thầy mọi lúc nếu cần."
- Vị trí: ngay DƯỚI phần trả lời của thẻ câu (TheCau, phiếu HTML, Ôn câu, Bài hằng ngày), luôn hiện, không phải mở lời giải.
- Em ĐANG LÀM (chưa trả lời/nộp): chỉ nút Hỏi thầy. Máy chủ trả đề KHÔNG đáp án (`/hs/hoi-thay` + `chiHoi`), Thầy chỉ gợi hướng (`/hs/hoi-tro-ly` + `dangLam`); máy chủ lọc thêm mọi câu lộ đáp án (`chanLoDapAn`). Game: Thầy trả lời ⇒ bật "có trợ giúp"; Ôn câu ⇒ lần làm hôm nay "có trợ giúp"; ghi `loi_giai_hoi` ⇒ kiểm tra cá nhân vẫn chặn câu này 12 giờ.
- Sau khi trả lời/nộp: Hỏi thầy + Lời giải từng bước (như trước).
- KHÔNG có nút: màn thi (ExamTakeScreen), Gọi lên bảng, lúc làm kiểm tra cá nhân, Đề thử có giờ (Đảo 2), Tám câu Bi-a có giờ, Đoàn Hộ Tống lúc đang đấu đội, bài gia đình giao có giờ.

## Tốc độ mở hộp + ô nhắn mới (thầy 13/10)
Thầy: "chỉnh lại ô này cho thật đẹp, tinh tế, câu slogan ở dưới chỉnh vào giữa nổi bật chút nhé. Tốc độ bấm vào hỏi thầy hơi chậm tối ưu lại tốc độ nhanh nhất nhé".
- Bấm "Hỏi thầy" ⇒ hộp nảy lên NGAY (ba vạch chờ thay chỗ đề), đề câu tới sau; máy chủ từ chối (ca kiểm tra, câu chưa công bố) thì hộp đóng, báo đúng lý do như cũ. Mảnh hộp tải sẵn lúc máy rảnh.
- Máy chủ `/hs/hoi-thay`: các lượt đọc độc lập chạy cùng một đợt, việc ghi sổ chạy sau phản hồi. Đo bằng `tests/toc-do-mo-hoi-thay-1310.test.ts`: có lời giải 12 → 5 đợt D1 (lần sau 6 → 2), đang làm 8 → 4 (3 → 2).
- Ô nhắn: một khung bo tròn (ô gõ tự giãn, cỡ chữ 16 để iPhone không phóng to; chip "Còn N câu hỏi hôm nay", số ký tự, nút gửi trong khung). Khẩu hiệu căn giữa, chữ đậm màu nhấn, một dòng trên điện thoại. CSS ở `hop-hoi-thay.css` (mảnh lười).
- Lệnh của thầy (duyệt lời giải) tách sang `src/lib/loi-giai-gv-api.ts`: máy học sinh/phụ huynh không tải phần ấy lúc mở app.
- Lỗi "Thầy trả lời chưa kịp" (ảnh thầy gửi 13/10): sổ `hoi_tro_ly` 15 lượt gần nhất Gemini chỉ 1,4–3,9 s, lượt lỗi không có dòng nào ⇒ máy em hết 45 s chờ, máy chủ bị cắt trước khi ghi sổ. Phần chậm là máy chủ: `/hs/hoi-tro-ly` 13 / 12 đợt D1 nối tiếp ⇒ nay 3 / 3 (đọc song song trong `traLoiHoiThem` + `nguCanhHoiTroLy`, ba lượt ghi cùng đợt).
- Gọi kép Gemini (`taoGoiGemini`, `CHO_GOI_KEP_MS` = 8 s): lượt đầu quá 8 s chưa về ⇒ bắn thêm một lượt y hệt, lấy lượt về trước, huỷ lượt kia. Trần 25 s / 20 s ⇒ máy chủ luôn trả lời hoặc ghi lỗi `cham` vào sổ trước khi máy em hết 45 s.
- Hộp mở sớm (đề chưa về): em gõ trước được, nút Gửi mở khi đề đã về.
- Xem thời gian từng lượt: workflow "Hỏi thêm Thầy — đọc lỗi Gemini (chỉ đọc)" in 15 lượt gần nhất (giờ, model, ms, token; không SBD, không câu hỏi).
- Điện tích ion (ảnh thầy 13/10 "CO3(2-)"): Gemini hay viết điện tích trong ngoặc ⇒ `chuHoa` (TraLoiThay.tsx) đổi `CO3(2-)`, `Fe(3+)`, `NH4(+)` thành mũ `^{…}` (đọc được cả câu trả lời cũ trong sổ); chỉ dẫn gửi Gemini dặn viết `CO3^2-`, `Fe^3+`. Giữ nguyên `Fe(III)`, `(1)`, `Fe2(SO4)3`.
- Sổ hỏi Thầy (thầy 13/10 khuya: "bao nhiêu lượt hỏi, từ những số báo danh nào, hỏi câu gì"): app thầy · Cài đặt · Hỏi Thầy (AI) · "Xem sổ hỏi Thầy" — tổng số lượt, từng em (SBD, tên, lớp, số lượt, số câu), 100 lượt gần nhất (câu hỏi + trả lời rút gọn). Máy chủ `/gv/hoi-tro-ly/so` (chỉ đọc, sau cổng mã bí mật, một đợt D1). Repo công khai nên workflow chỉ in số đếm.
- Lỗi "Phần hỏi thêm Thầy đang gặp lỗi" (ảnh thầy 14/10): sổ ghi `HTTP 400 User location is not supported for the API use.` lúc 04:22 và 05:52. Nguyên nhân: Worker để `placement = "smart"`, lúc vắng chạy sát D1 (APAC, trạm Hồng Kông), Gemini API không phục vụ Hồng Kông. Sửa: KHÔNG dời cả máy chủ (mọi lệnh D1 sẽ chậm); chỉ khi Google chặn vị trí thì lượt gọi Gemini đi qua Durable Object `TramGemini` (server/src/tram-gemini.ts) ghim châu Đại Dương (`locationHint: 'oc'`), dự phòng Tây Bắc Mỹ (`wnam`); 10 phút sau lần bị chặn đi thẳng qua trạm. Trạm chỉ gọi được qua binding nội bộ, chỉ chuyển tới generativelanguage.googleapis.com.
