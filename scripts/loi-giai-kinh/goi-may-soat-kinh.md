# Việc: SOÁT lời giải Kính đã đạt — có giải ĐÚNG và ĐỦ theo bài giảng của thầy cho dạng bài này không (thầy Đỗ Đại Học, 03/11/2026)

Thầy: «Tôi thấy có câu xác định nhóm trong bảng tuần hoàn ko đưa kiến thức này vào. Bạn soát lại kĩ một lượt xem có phần nào mà chưa giải theo kiến thức
thầy dạy tương ứng thì thêm vào đủ nhé.»

Mỗi bản trong lô ĐÃ qua máy kiểm (đủ khối, khớp đáp án kho, số tính lại đúng). Việc của bạn là soát NỘI DUNG DẠY: bản có dạy đúng cách thầy dạy dạng bài này không.
Đọc `goi-may-soan-kinh.md` trước (khuôn, luật chữ, mục TRA BÀI GIẢNG) — mọi luật trong đó vẫn áp dụng khi bạn soạn lại.

## Thư mục lô
- `vao/<tên>.json`: câu (đề, phương án / ý, đáp án kho, hình). `vao/<tên>.ban.json`: BẢN HIỆN TẠI học sinh đang thấy.
- `vao/<tên>.muc.json`, `muc-luc.txt`, `lay-muc.mjs`, `than-chu.json`, `vi-du-kinh.json`, `tu-duy-day-hoa.md`, `kiem.mjs`: như `goi-may-soan-kinh.md`.

## Soát từng câu
1. Đọc câu + bản hiện tại (+ ảnh). Gọi tên DẠNG BÀI.
2. TRA BÀI GIẢNG: Grep `muc-luc.txt` ít nhất 2 cụm từ khoá của dạng bài; `node lay-muc.mjs <tên tệp> <mã…>` lấy MỌI mục quy định cách làm dạng này (bài lớp 10–12 và
   bản 2007 / 2008 / [2009]). Đó là các MỤC CHỦ ĐẠO. Mục chỉ dính chữ mà không nói cách làm dạng này thì không tính.
3. Với từng mục chủ đạo: bản hiện tại có ÁP DỤNG không (quy tắc / bước của thầy có mặt ở `cotLoi`, `phim`, `lyDo`, `hayNham` hoặc `theNho`, đúng thứ tự `buoc`)?
   Ví dụ dạng xác định vị trí trong bảng tuần hoàn: phải có quy tắc thầy — nhóm A = tổng electron lớp ngoài cùng; nhóm B tính a + b của (n−1)dᵃnsᵇ (3–7 ⇒ a + b;
   8–10 ⇒ VIIIB; 11–12 ⇒ a + b − 10); chu kì = số lớp; ô = Z. Bản chỉ nói «thuộc nhóm VIB» mà không dạy cách ra ⇒ THIẾU.
4. Soát phát biểu khoa học: câu nào sai SGK Kết nối tri thức (kể cả câu chép từ lời thầy nhưng dùng sai phạm vi — xem mục 5 TRA BÀI GIẢNG) ⇒ SAI.
5. Kết luận:
   - **giu**: MỌI mục chủ đạo đã áp dụng và không có phát biểu sai. Đừng giữ cho nhanh: thiếu một quy tắc thầy dạy là phải sửa.
   - **sua**: soạn lại TOÀN BẢN theo `goi-may-soan-kinh.md`, giữ chỗ tốt của bản cũ, thêm đủ cách thầy dạy (cotLoi nêu quy tắc, phim đi đúng bước, hayNham từ `nham`,
     thêm thẻ nhớ cho quy tắc). Ghi `ra/<tên>.json`, chạy `node kiem.mjs` tới khi ĐẠT. Không đạt sau 3 vòng ⇒ vẫn ghi `ket: "sua"`, máy chủ sẽ giữ bản cũ.
   - Câu hỏi SỐ electron hoá trị của Fe, Co, Ni (nhóm VIIIB) hoặc chỗ lời thầy và SGK vênh mà bạn không chắc: KHÔNG tự sửa phần đó — ghi `canThay` mô tả ngắn để thầy quyết.

## Đầu ra soát: `soat/<tên>.json` (MỌI câu đều phải có)
```json
{ "ket": "giu" | "sua",
  "dang": "tên dạng bài",
  "muc": [ { "id": "M…", "ten": "tên mục", "apDung": true, "o": "cotLoi · phim · lyDo · hayNham · theNho" },
           { "id": "M…", "ten": "tên mục", "apDung": false, "thieu": "quy tắc / bước chưa có trong bản" } ],
  "saiKhoaHoc": "phát biểu sai (nếu có)",
  "canThay": "chỗ cần thầy quyết (nếu có)",
  "ghi": "≤ 200 ký tự: vì sao giữ / đã sửa gì" }
```
`ket: "giu"` chỉ khi mọi `muc[].apDung` là true và không có `saiKhoaHoc`.

## Cách làm cả lô
1. Đọc `goi-may-soan-kinh.md`, `vi-du-kinh.json`, `than-chu.json`, `tu-duy-day-hoa.md` một lần.
2. Từng câu theo mục Soát. Viết tệp bằng Write (không viết script; Bash chỉ chạy `node kiem.mjs`, `node lay-muc.mjs`).
3. Chạy `node kiem.mjs` khi có bản sửa (dòng của câu không sửa báo «CHƯA CÓ» là bình thường).
4. Trả lời cuối đúng 1 dòng: số câu giữ / sửa / cần thầy.
