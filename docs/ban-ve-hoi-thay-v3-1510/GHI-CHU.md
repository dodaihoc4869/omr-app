# Hỏi Thầy v3: câu trả lời theo Ý EM HỎI (bản vẽ 15/10/2026, CHỜ THẦY DUYỆT)

Thầy (15/10): "giao diện hỏi thầy vẫn chưa được linh hoạt để học sinh hiểu rõ nhất, bạn thử vẽ lại sự linh hoạt trước khi tôi duyệt build nhé".

- Bản vẽ: `hoi-thay-v3.html`, mở bằng `?k=sai` · `?k=goi-y` · `?k=vi-sao` · `?k=dung-sai` · `?k=tinh`. Thêm `&kiem=dung|sai` để chọn sẵn câu Thầy hỏi lại, `&thu=dung` để có sẵn kết quả em thử, `&mo=3` để mở đủ 3 gợi ý.
- Bản vẽ dùng CSS THẬT của app, gồm cả khối v2 (`khoi-tra-loi.css`). Bấm thử được: mở gợi ý, chọn câu Thầy hỏi lại, nhập số rồi Kiểm tra.
- Ảnh: `anh/` chụp bằng `node scripts/chup-ban-ve-hoi-thay-v3-1510.mjs` (Chromium thật, 360/390 dọc, ngang, máy tính, sáng/tối). Video thao tác: `anh/15-thao-tac-hoat-canh.webm`.
- Chưa sửa dòng nào trong `src/` hay `server/`.

## Vì sao v2 chưa đủ

- v2 thêm khối hình (thí nghiệm, phương trình, tính nhanh) vào MỘT khuôn cố định: em vẫn đọc một tấm thẻ dài từ trên xuống.
- Đo 14/10: 99 câu trả lời đầu chỉ 7 câu có khối, vì Gemini tự quyết có vẽ khối hay không.
- Em không điều khiển được độ sâu. Em cũng không có cách biết mình đã hiểu thật chưa.

## 1. Mục tiêu sư phạm, ai dùng

Học sinh (app em). Câu trả lời đổi **hình dạng** theo ý em hỏi; em **tự mở dần** từng phần; cuối thẻ Thầy **hỏi lại 1 câu** để em biết mình hiểu chưa.

| Tình huống | Khuôn (nhãn đầu thẻ) | Phần chính | Ai chọn khuôn |
|---|---|---|---|
| Em đã làm SAI câu này, hoặc hỏi "sao em ra…" | **Chỉ chỗ sai** | Bảng "Em làm / Đúng là", dòng lệch đầu tiên đánh dấu đỏ–xanh, các dòng sau gạch nhẹ (sai kéo theo); ô "Vì sao em nhầm"; Thầy hỏi lại 1 câu cùng lỗi | Máy chủ (dữ liệu ghi em SAI) |
| Em ĐANG LÀM, chưa nộp | **Gợi ý từng nấc** | 3 nấc, em bấm mở từng nấc (thí nghiệm ảo nằm trong nấc 2); dòng "Đáp án: nộp bài rồi xem" khoá | Máy chủ (đang làm) |
| "Vì sao / khác nhau thế nào" | **Giải thích** | 1 câu ngắn → thang xếp hạng có vạch ngưỡng (ví dụ: tính base, ngưỡng đổi màu quỳ) → hình vẽ sẵn → bảng đối chiếu (gập) → Thầy hỏi lại | Gemini |
| Câu Đúng/Sai đã nộp | **Từng ý a–d** | "Em đúng 2/4 ý"; ý em sai nổi lên; mỗi ý có "Em: …" và "Đáp án: …" kèm một lý do | Máy chủ (phần II, đã nộp) |
| "Tính thế nào" (đã nộp) | **Tính từng bước** | Phương trình → bước 1 → bước 2 **em thử tính** rồi Kiểm tra → mở bước 3 | Gemini (câu có số) |

Phần chung ở mọi khuôn:
- **Em chưa hiểu chỗ nào? Chạm để hỏi Thầy**: 2–3 chạm có sẵn ("Chỗ lệch", "Vì sao M = 82?"). Chạm là gửi đúng câu đó.
- **Giải thích dễ hơn**, **Cho ví dụ khác**.
- Phần phụ gập lại (phương trình đầy đủ, ghi nhớ, đối chiếu chi tiết): em mở khi cần (luật C5 hé lộ dần).

## 2. Bố cục

- Điện thoại dọc (360–390 px): hộp sát đáy như bản đã chốt. Bảng "Em làm / Đúng là" giữ 2 cột (vừa 360 px). Thang xếp hạng **dọc**, mạnh ở trên, vạch ngưỡng nằm giữa (dàn ngang thì công thức bị ngắt dòng).
- Ngang và máy tính: hộp giữa màn rộng tối đa ~560 px, nội dung y như dọc.
- Mỗi thẻ tối đa **một nút chính** (luật C2): "Mở gợi ý 3" ở khuôn Gợi ý, "Kiểm tra" ở khuôn Tính. Còn lại là nút phụ. Đích chạm ≥ 48 px (luật C9).

## 3. Trạng thái

| Phần | Trạng thái |
|---|---|
| Gợi ý từng nấc | đã mở n/3 (thanh tiến độ 3 vạch); bấm mở nấc kế (hiện dần ≤ 250 ms); nấc cuối mở rồi thì nút biến mất; đáp án khoá tới khi nộp |
| Thầy hỏi lại 1 câu | chưa chọn · chọn đúng (xanh + một câu vì sao) · chọn sai (đỏ + gợi ý, chọn lại được) |
| Em thử tính | chưa nhập · sai (gợi ý chỗ sai, nhập lại) · đúng (mở nút bước kế, ẩn "Xem luôn") · "Xem luôn bước 2" để bỏ qua |
| Phần gập | đóng mặc định, chạm mở/đóng |
| Câu trả lời cũ (v2, chữ phẳng) | vẽ như hiện nay |
| Máy giảm chuyển động | không hiện dần, ống nghiệm đứng ở trạng thái cuối |

Mở gợi ý, Thầy hỏi lại, em thử: chạy **trên máy em**, không gọi máy chủ, không tốn lượt.

## 4. Dữ liệu

Thêm vào `CauTrucTraLoi` (đều tuỳ chọn, trường v2 giữ nguyên):

```ts
khuon: 'cho-sai' | 'goi-y' | 'giai-thich' | 'tung-y' | 'tinh'   // máy chủ đặt trước theo dữ liệu; Gemini chỉ chọn khi máy chủ chưa đặt
soSanh?: { em: string; dung: string; lech?: boolean }[]           // ≤ 5 dòng, đúng 1 dòng lech (dòng lệch đầu tiên)
nac?: { ten: string; chu: string; khoi?: 'thiNghiem' | 'nhanBiet' | 'soDo' }[]  // 2–3 nấc; khối v2 gắn vào nấc
xepHang?: { tieuChi: string; chat: { ct: string; ten: string }[]; hoi?: number; nguong?: { sau: number; tren: string; duoi: string } }  // mạnh → yếu, ≤ 5 chất
hinhDung?: 'cap-e-amine' | 'lien-ket-hydrogen' | 'glucose-mach-ho' | 'xa-phong-hoa'  // hình VẼ SẴN, danh sách đóng
doiChieu?: { cot: [string, string]; dong: { tieuChi: string; a: string; b: string }[] }  // ≤ 4 dòng
yDS?: { y: 'a' | 'b' | 'c' | 'd'; lyDo: string }[]               // "Em:" và "Đáp án:" do MÁY CHỦ điền từ bài nộp + kho
buocThu?: { buoc: number; hoi: string; dap: string; goiYSai: string }  // một bước giữa cho em thử, chỉ khi đã nộp
kiemLai?: { hoi: string; lua: [string, string, string]; dung: 0 | 1 | 2; vi: string; goiYSai: string }
chuaHieu?: string[]                                              // ≤ 3 chạm, mỗi chạm ≤ 24 ký tự
```

- Máy chủ chọn khuôn trước khi gọi Gemini, theo dữ liệu đang có:
  - em đang làm ⇒ `goi-y`;
  - phần II đã nộp ⇒ `tung-y`;
  - em SAI hoặc câu hỏi có số em ra ⇒ `cho-sai`.
  - Còn lại thì Gemini chọn `giai-thich` hoặc `tinh`. Chỉ dẫn gửi Gemini ghi rõ khuôn đã chọn và các phần BẮT BUỘC của khuôn đó.
- Đúng/Sai từng ý: máy chủ lấy từ đáp án kho và bài em nộp. Gemini chỉ viết lý do, không tự đoán đúng/sai.
- Hình vẽ sẵn: máy em vẽ bằng SVG có sẵn trong mảnh lười. Bắt đầu với 4 hình, thêm dần theo chương. Gemini chỉ gửi mã hình.
- Số em thử: máy em so sau khi chuẩn hoá (dấu "." hay "," đều được, lệch ≤ 1% vì làm tròn).

## 5. Ngoại lệ

- **Em đang làm**: không có `soSanh`, `yDS`, `buocThu`, `kiemLai`. Nấc cuối qua bộ chặn lộ đáp án hiện có; nấc nào lộ thì bỏ nấc đó.
- **Thầy hỏi lại**: máy chủ bỏ câu hỏi lại nếu nó lặp chính đề đang hỏi. Lựa chọn có chung chất với phương án thì giữ, vì cùng chủ đề hay có chung chất và câu hỏi lại chỉ có khi em đã nộp (build 15/10).
- **Gemini trả thiếu phần bắt buộc của khuôn**: vẽ các phần có được. Thiếu cả phần chính thì quay về khuôn v2 (ý chính + khối + bước).
- **Chạm "Em chưa hiểu…" khi hết lượt / mất mạng**: báo như khi gửi câu thường.
- **Chữ hoặc công thức dài**: bảng 2 cột tự xuống dòng; thang dọc mỗi chất một dòng; công thức không ngắt giữa.
- **Máy yếu**: không thư viện mới; SVG và CSS có sẵn.

## 6. Chi phí máy chủ

- **0 lượt đọc/ghi D1 thêm.** Khuôn chọn từ dữ liệu đã đọc sẵn (đang làm, kết quả em, phần câu). Mốc tốc độ Hỏi Thầy giữ nguyên (mở 5/2, đang làm 4/2, gửi 3/3).
- Gemini: vẫn **1 lượt gọi** mỗi câu hỏi, mô hình giữ 3.1 flash-lite. Câu trả lời dài thêm khoảng 200–400 token.
- Chạm "Em chưa hiểu…", "Giải thích dễ hơn": mỗi chạm là **1 lượt hỏi** (trần 36/ngày). Mở gợi ý, Thầy hỏi lại, em thử: 0 lượt.
- Máy em: mã vẽ mới nằm trong mảnh tải lười của hộp Hỏi Thầy, biểu tượng vẽ tại chỗ ⇒ byte mở 3 app không tăng (`npm run kiem:toc-do`).

## 7. Nghiệm thu đo bằng máy

- `tests/hoi-thay-khuon-may-chu-1510.test.ts`:
  - máy chủ chọn đúng khuôn theo dữ liệu (đang làm / phần II đã nộp / em sai);
  - Đúng/Sai từng ý lấy từ kho chứ không lấy từ Gemini;
  - đang làm thì không có `soSanh`, `yDS`, `buocThu`, `kiemLai`;
  - câu hỏi lại lặp chính đề bị bỏ;
  - chữ phẳng có chữ các phần mới.
- `tests/hoi-thay-khuon-giao-dien-1510.test.tsx`:
  - đủ 5 khuôn vẽ đúng thứ tự;
  - mở nấc cập nhật tiến độ;
  - Thầy hỏi lại: đúng / sai / chọn lại;
  - em thử: so "0.16" = "0,16", sai thì có gợi ý, đúng thì mở bước kế;
  - chạm "Em chưa hiểu…" gửi đúng chữ;
  - câu trả lời v2 vẫn vẽ như cũ.
- Test cũ xanh: các tệp `tests/hoi-thay-*`, `tests/hoi-them-thay-*`, `tests/toc-do-mo-hoi-thay-1310.test.ts`.
- `npm run build && npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · `npm run check:mau` sạch.
- Ảnh Chromium sau build (360/390, ngang, máy tính, sáng/tối): 0 lỗi trang, 0 tràn, 0 đích bấm < 48 px ở phần mới. Bản vẽ này đã đạt: `SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ`.

## Giả định đã dùng (thầy sửa một dòng là xong)

- **Thầy hỏi lại 1 câu** chỉ để em tự biết mình hiểu chưa. Không chấm điểm, không lưu. Nếu thầy muốn xem em nào đã hiểu, cần thêm một cột ghi kết quả (migration chỉ thêm), làm sau khi thầy chốt.
- **Hình vẽ sẵn** bắt đầu với 4 hình: cặp electron của N (amine/aniline), liên kết hydrogen (nhiệt độ sôi), glucose mạch hở, xà phòng hoá ester. Gemini không tự vẽ hình.
- **Mỗi chạm "Em chưa hiểu…"** tính 1 lượt như một câu hỏi thường.
- Nội dung trong bản vẽ là mẫu, các số đã tính lại:
  - 18 : 180 = 0,1 mol → 0,16 mol CO₂ → 3,97 L ở điều kiện chuẩn (24,79 L/mol);
  - methyl propionate + NaOH → C₂H₅COONa;
  - thứ tự tính base: aniline < NH₃ < methylamine < dimethylamine.
