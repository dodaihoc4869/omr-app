# Hỏi thêm Thầy (AI Gemini) — hướng dẫn thầy · 13/10/2026

Trong khung **Hỏi thầy** (mọi câu ngoài giờ kiểm tra), dưới lời giải có ô **"Em còn chỗ chưa hiểu? Nhắn hỏi Thầy"**. Em nhắn, Gemini trả lời đúng giọng Thầy Đỗ Đại Học (xưng "Thầy", gọi "em", theo quy tắc viết của Thầy), căn cứ trọn đề (chữ, phương án/ý, bảng, hình) và trọn lời giải (kho, lời giải từng bước, lời Thầy gỡ, học liệu). Mã: `server/src/hoi-tro-ly.ts`, `src/components/loi-giai/HoiThemThay.tsx`.

## Bật
1. aistudio.google.com → Get API key → Create API key (nên dùng dự án Google Cloud đã bật thanh toán: tầng miễn phí cho Google dùng nội dung để cải thiện sản phẩm — kiểm lại điều khoản lúc bật).
2. dash.cloudflare.com → Workers & Pages → `omr` → Settings → Variables and Secrets → Add → Type **Secret**, Name `GEMINI_API_KEY`, dán khoá → Deploy. KHÔNG dán khoá vào chat, repo hay tệp nào.
3. Có khoá là bật cho mọi em. Chưa có khoá ⇒ ô hỏi tự ẩn.

## Tuỳ chỉnh (không cần phát hành lại) — `cau_hinh.khoa = 'hoi_tro_ly'`, giá trị JSON, mọi khoá tuỳ chọn
`{"bat": true, "lop": ["12A1"], "sbd": [], "model": "gemini-2.5-flash", "tranNgay": 20, "tranCau": 6, "thinkingBudget": 1024, "nhietDo": 0.3}`
- `bat:false` tắt hẳn · `lop`/`sbd` chỉ mở cho lớp/em đó (chạy thử) · `tranNgay` câu hỏi/em/ngày · `tranCau` lần hỏi/câu/ngày.
- Đổi `model` sang bản mạnh hơn khi cần; `thinkingBudget` chỉ gửi cho model 2.5 (`null` = không gửi).

## Luật máy chủ (không tin máy em)
- Cùng cổng chặn nút Hỏi thầy: em có ca kiểm tra mở ⇒ khoá; câu thuộc ca chưa công bố (kể cả bản chép ở tờ khác) ⇒ khoá.
- Em phải bấm Hỏi thầy câu đó trong 24 giờ qua (đã tính "có trợ giúp" như hiện nay); game: hỏi được Thầy ở câu chưa có lời giải từng bước cũng tính có trợ giúp.
- Ngoài phạm vi câu đang xem ⇒ máy chủ trả câu cố định, bỏ chữ của AI (cờ `lienQuan` trong đầu ra JSON).
- Không gửi tên, SBD sang Google. Lịch sử hội thoại đọc từ sổ máy chủ (3 lượt gần nhất, cùng câu), không nhận lịch sử máy em gửi.

## Xem lại
Bảng D1 `hoi_tro_ly`: sbd, qid, câu hỏi, trả lời, `lien_quan`, model, token vào/ra, thời gian, lỗi. Lỗi Gemini không trừ lượt của em. Chi phí: nhân số token với bảng giá hiện hành tại ai.google.dev/pricing.
