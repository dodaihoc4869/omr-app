# Việc: VẼ LẠI hình của đề thành cảnh JSON (app vẽ bằng SVG) — thầy Đỗ Đại Học chốt 03/11

Ảnh trong `vao/img/<bam>.png`; `vao/<bam>.json` có `de` (ngữ cảnh), `phienAm` = chữ chép nguyên văn từ ảnh (nguồn chữ DUY NHẤT được dùng).
Với MỖI ảnh: mở bằng Read, chọn khuôn, ghi `ra/<bam>.json`, rồi chạy `node kiem.mjs` tới khi ĐẠT.

## Bốn khuôn (chưa hợp khuôn nào ⇒ `{ "giuGoc": true, "lyDo": "…" }`, app giữ ảnh gốc — đừng ép)
- **so-do** (sơ đồ khối / chuyển hoá): `{ "tieuDe", "canh": { "loai": "so-do", "o": [{ "id","chu","x","y" }…], "noi": [{ "tu": [id…], "den": id, "nhan"?, "so"? }…] } }`.
  `x`,`y` là % khung 0–100: x trong **[22, 78]** (ô rộng ~38 %), y theo hàng từ trên xuống, cách nhau ≥ 18. `noi.tu` 1–3 ô nguồn (2–3 nguồn = gộp vào một ô đích). `so` = số bước «(1)» viết «1»; `nhan` = điều kiện trên mũi tên.
- **do-thi** (phổ khối lượng, đồ thị cột / que): `{ "loai": "do-thi", "truc": { "x","y","xMin","xMax","yMax","xVach":[…],"yVach":[…] }, "que": [{ "x","y","nhan"? }…] }`. `xMin/xMax` chừa lề 0,5 đơn vị; `yMax` ≥ mọi que; số trên trục chép đúng như ảnh.
- **thi-nghiem** (CHỈ bộ chưng cất: bình cầu + sinh hàn + bình hứng): `{ "loai": "thi-nghiem", "khuon": "chung-cat", "nhan": { "binh","luoi","sinhHan","vao","ra","hung" } }` — nhãn chép đúng từ ảnh.
- **fischer** (công thức chiếu Fischer): `{ "loai": "fischer", "dau": nhóm trên cùng, "cuoi": nhóm dưới cùng, "hang": [[trái, phải]…] }` từ trên xuống.
Dụng cụ khác (thu khí, chuẩn độ, phễu chiết, pin, điện phân, ảnh chụp thật, cấu trúc phân tử, bảng) ⇒ `giuGoc`.

## LUẬT AN TOÀN (máy chủ kiểm — sai là bỏ cảnh)
1. MỌI chữ / số trong cảnh phải nằm trong `phienAm` của ảnh. KHÔNG thêm thông tin, KHÔNG «đoán» ẩn: X, T, Y, Q, Z giữ nguyên; không viết tên chất mà ảnh không ghi.
2. `tieuDe`: dùng đúng tiêu đề chung của khuôn («Sơ đồ chuyển hoá», «Đồ thị», «Bộ dụng cụ chưng cất», «Công thức chiếu Fischer») HOẶC chép nguyên văn chú thích có trong ảnh. Không tự đặt.
3. Số đo (độ cao que, vị trí) đọc từ ảnh cho sát; nhãn số trong ảnh là chuẩn.
4. Chữ trong cảnh không đè nhau: app tự xếp nhãn, bạn chỉ cần chia ô thưa (khoảng cách hàng ≥ 18 %).
5. Đọc `vi-du-hinh.json` (4 mẫu thầy duyệt) một lần trước khi làm.
Chỉ dùng Read, Write, Edit và `node kiem.mjs`. Trả lời cuối đúng 1 dòng: số ảnh ĐẠT / giữ gốc.
