# Việc: VẼ LẠI hình của đề thành cảnh JSON (app vẽ bằng SVG) — thầy Đỗ Đại Học chốt 03/11

Ảnh trong `vao/img/<bam>.png`; `vao/<bam>.json` có `de` (ngữ cảnh), `phienAm` = chữ chép nguyên văn từ ảnh (nguồn chữ DUY NHẤT được dùng).
Với MỖI ảnh: mở bằng Read, chọn khuôn, ghi `ra/<bam>.json`, rồi chạy `node kiem.mjs` tới khi ĐẠT.

## Năm khuôn (thầy 03/11: hình trong SGK vẽ lại thoải mái — khuôn thứ 5 «svg» nhận MỌI hình còn lại; **KHÔNG ĐƯỢC giữ ảnh gốc: thầy yêu cầu «không hình nào được dùng hình cũ». Mọi ảnh đều phải ra cảnh**)
- **so-do** (sơ đồ khối / chuyển hoá): `{ "tieuDe", "canh": { "loai": "so-do", "o": [{ "id","chu","x","y" }…], "noi": [{ "tu": [id…], "den": id, "nhan"?, "so"? }…] } }`.
  `x`,`y` là % khung 0–100: x trong **[22, 78]** (ô rộng ~38 %), y theo hàng từ trên xuống, cách nhau ≥ 18. `noi.tu` 1–3 ô nguồn (2–3 nguồn = gộp vào một ô đích). `so` = số bước «(1)» viết «1»; `nhan` = điều kiện trên mũi tên.
- **do-thi** (phổ khối lượng, đồ thị cột / que): `{ "loai": "do-thi", "truc": { "x","y","xMin","xMax","yMax","xVach":[…],"yVach":[…] }, "que": [{ "x","y","nhan"? }…] }`. `xMin/xMax` chừa lề 0,5 đơn vị; `yMax` ≥ mọi que; số trên trục chép đúng như ảnh.
- **thi-nghiem** (CHỈ bộ chưng cất: bình cầu + sinh hàn + bình hứng): `{ "loai": "thi-nghiem", "khuon": "chung-cat", "nhan": { "binh","luoi","sinhHan","vao","ra","hung" } }` — nhãn chép đúng từ ảnh.
- **fischer** (công thức chiếu Fischer): `{ "loai": "fischer", "dau": nhóm trên cùng, "cuoi": nhóm dưới cùng, "hang": [[trái, phải]…] }` từ trên xuống.
- **svg** (VẼ TỰ DO — mô hình nguyên tử / vỏ electron, cấu tạo phân tử, thu khí, chuẩn độ, phễu chiết, pin, điện phân, mô hình mạng tinh thể, sơ đồ bất kì): `{ "tieuDe", "canh": { "loai": "svg", "rong": 360, "cao": 240, "svg": "<g>…</g>" } }`. `rong` 100–800, `cao` 60–800 (giữ tỉ lệ ảnh gốc). Trường `svg` là nội dung BÊN TRONG thẻ svg, toạ độ theo khung rong×cao. VẼ NÉT SIÊU NÉT, hình khối đầy đủ, bố cục giống ảnh gốc, nhãn chữ đặt cạnh phần nó chỉ vào, KHÔNG đè lên hình hay lên nhau (chừa ≥ 14 đơn vị giữa hai nhãn).
  - Thẻ cho phép: `g path line rect circle ellipse polygon polyline text tspan`. Thuộc tính: `x y x1 y1 x2 y2 cx cy r rx ry width height stroke-width opacity font-size` (số, ≤ 900), `d` (path), `points`, `transform` (chỉ translate / rotate / scale), `text-anchor`, `stroke-dasharray`, `class`. CẤM style, fill, stroke, href, image, script, foreignObject, use, defs, gradient — **màu CHỈ qua `class`** (bảng màu app):
    · tô `f-khong f-nen f-chu f-xam f-hs f-hs-nhat f-tin f-tin-nhat f-sao f-sao-nhat f-sai f-sai-nhat f-dung f-dung-nhat f-tim f-tim-nhat` · viền `s-chu s-chu-2 s-mo s-hs s-tin s-sao s-sai s-dung s-tim s-nen` kèm `nc` (nét 2) · nét đứt `net-dut` · chữ `t-chu t-chu-2 t-hs t-tin t-sao t-sai t-dung t-tim` + cỡ `t-dam t-nho t-lon`.
    · Mọi hình khối: `class="f-… s-chu nc"`; đường nối: `class="f-khong s-chu nc"`; chữ: `<text x y text-anchor="middle" class="t-chu t-dam">…</text>`.
  - **ĐẸP + DỄ ĐỌC (thầy yêu cầu «màu mè đẹp», «vector siêu nét»)**: `rong` ≤ 420 (hình rộng hơn thì thu nhỏ toạ độ cho vừa 420 — app co hình theo khung nên canvas rộng làm chữ bé); cỡ chữ ≥ 15 (`font-size="15"`, nhãn chính `t-lon` = 16); nét `nc`; chỉ số dưới / trên viết bằng KÍ TỰ UNICODE (NH₃, H₂O, Br₂, SO₄²⁻, CH₃COOH) — không viết «NH3»; TÔ MÀU có ý nghĩa: nước / dung dịch `f-tin-nhat`, lửa / nhiệt `f-sao`, khí `f-hs-nhat`, thuỷ tinh `f-nen` + viền `s-chu-2`, kết tủa `f-sai-nhat`, giá đỡ `f-xam`; nguyên tử trong mô hình phân tử: O `f-sai`, N `f-hs`, C `f-chu`, H `f-nen`, S `f-sao`, hạt nhân `f-sao`, electron `f-tin`; vùng nền nhạt đặt dưới cùng. Chữ không đè hình.
  - Mỗi nhãn chữ là MỘT thẻ text; chữ nằm trong `phienAm` (luật 1). Hạt electron / hạt nhân / dấu cộng–trừ vẽ bằng hình (circle, path), KHÔNG tạo chữ mới ngoài ảnh.
  - Tối đa 400 thẻ, 24 KB, 60 nhãn. Vẽ xong HÃY mở lại ảnh gốc đối chiếu: đủ thành phần, đúng số lượng (vd số electron mỗi lớp), đúng vị trí tương đối; thiếu / sai ⇒ sửa.
Ảnh chụp thật / tranh phức tạp / bảng dày chữ: vẽ lại dạng MINH HOẠ ĐƠN GIẢN (nét phẳng) giữ đủ thành phần và nhãn chữ của ảnh. Ảnh KHÔNG có chữ: `svg` không có thẻ text, `tieuDe` = «Hình minh hoạ». Bảng chữ nhiều ô: dựng bảng bằng rect + text (≤ 60 nhãn; quá thì gộp ô bằng cách chia hai hình không được — vẫn vẽ phần quan trọng nhất và các nhãn có trong phiên âm).

## LUẬT AN TOÀN (máy chủ kiểm — sai là bỏ cảnh)
1. MỌI chữ / số trong cảnh phải nằm trong `phienAm` của ảnh. KHÔNG thêm thông tin, KHÔNG «đoán» ẩn: X, T, Y, Q, Z giữ nguyên; không viết tên chất mà ảnh không ghi.
2. `tieuDe`: dùng đúng tiêu đề chung của khuôn («Sơ đồ chuyển hoá», «Đồ thị», «Bộ dụng cụ chưng cất», «Công thức chiếu Fischer») HOẶC chép nguyên văn chú thích có trong ảnh. Không tự đặt.
3. Số đo (độ cao que, vị trí) đọc từ ảnh cho sát; nhãn số trong ảnh là chuẩn.
4. Chữ trong cảnh không đè nhau: app tự xếp nhãn, bạn chỉ cần chia ô thưa (khoảng cách hàng ≥ 18 %).
5. Đọc `vi-du-hinh.json` (4 mẫu thầy duyệt) một lần trước khi làm.
Không dùng `giuGoc` (máy chủ sẽ phát lại ảnh đó). Chỉ dùng Read, Write, Edit và `node kiem.mjs`. Trả lời cuối đúng 1 dòng: số ảnh ĐẠT / giữ gốc.
