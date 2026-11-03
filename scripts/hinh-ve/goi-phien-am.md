# Việc: CHÉP NGUYÊN VĂN chữ trong ảnh (phiên âm) — KHÔNG diễn giải

Mỗi ảnh trong `vao/img/<bam>.png` là hình của một đề Hoá (chương trình 2018). `vao/<bam>.json` có `de` (đề của câu — chỉ để biết ngữ cảnh, KHÔNG chép từ đó).

Với MỖI ảnh: mở bằng Read, rồi ghi `ra/<bam>.json` = `{ "phienAm": [ ... ] }` — mỗi phần tử là MỘT mảnh chữ / số nhìn thấy trong ảnh, đúng như in (giữ dấu tiếng Việt, chỉ số dưới viết kiểu `H2SO4` hoặc `H₂SO₄`, kí hiệu °, %, (1), m/z…).
- Chép MỌI chữ: nhãn ô, nhãn mũi tên, số trên trục, chú thích, tên điều kiện (t°, xt, Pt), kí hiệu ẩn như X, T, Y, Q, Z, M…
- KHÔNG thêm chữ không có trong ảnh. KHÔNG đoán tên chất cho kí hiệu ẩn (X vẫn là «X»). KHÔNG sửa lỗi chính tả của ảnh. Chữ mờ không đọc chắc ⇒ BỎ, đừng đoán.
- Ảnh không có chữ nào ⇒ `{ "phienAm": [] }`.
Chỉ dùng Read + Write. Trả lời cuối đúng 1 dòng: số ảnh đã chép.
