# Việc: soạn HỒ SƠ LỜI GIẢI cho một lô câu Hoá (khuôn 1.2)

Bạn soạn lời giải từng bước cho học sinh luyện thi (chương trình Hoá phổ thông 2018 của Việt Nam; tên chất theo IUPAC tiếng Anh như đề: ethyl acetate, glucose, saccharose…). Mỗi câu ra MỘT tệp JSON. Khung trình bày cố định của app vẽ tệp ấy. Bạn chỉ viết dữ liệu: không viết HTML ngoài các thẻ cho phép, không viết JavaScript.

## Thư mục làm việc (đã có sẵn)
- `vao/*.json`: các câu cần soạn, CÙNG MỘT CHƯƠNG. Mỗi tệp có:
  - `qid`, `bam` (dấu vân tay nội dung đề), `dang` (`tn` trắc nghiệm · `ds` Đúng/Sai · `tln` trả lời ngắn), `bo` (mã chương), `tang` (`gon` · `du` · `sau`);
  - `de` (đề, HTML), `hinh` (đường dẫn ảnh trong `vao/img/`), `y` (ý a–d hoặc phương án A–D, nguyên văn);
  - `dapAn`: ĐÁP ÁN CHÍNH THỨC của kho. Với `ds`/`tn`: `"D"` là đúng / được chọn, `"S"` là sai / bị loại. Với `tln`: `{ "kq": "<đáp số>" }`.
  - `mc` (chỉ `tn`): các phương án + `dapAn`;
  - `loiGiaiCo`: lời giải chữ đã có trong kho (`chot`, `tung`, `buoc`, `ket_qua`, `trang_thai`; `"khop"` = đã đối chiếu đáp án tác giả);
  - `ghiChuThay` (có thể có): thầy đã TRẢ LẠI bản trước, đây là chỗ thầy yêu cầu sửa. BẮT BUỘC làm theo.
- `bo.json`: bộ chìa khoá của chương: `KEYS` (id k1…k7 + quy tắc), `TRAPS_THEM` (bẫy riêng chương). Bẫy dùng chung mọi chương: `nguyennhan` (sai nguyên nhân), `tuyetdoi` (tuyệt đối hoá), `xuhuong` (ngoại suy xu hướng), `conso` (con số cài sẵn), `doivai` (đổi vai), `antoan` (bẫy an toàn), `tengoi` (nhầm khái niệm). `LAB_PRESETS` chỉ có ở chương Ester.
- `vi-du-mau.json`: MỘT hồ sơ mẫu hoàn chỉnh khuôn 1.2 (dạng `ds`). Bắt chước đúng cấu trúc, độ dài, giọng văn.
- `kiem.mjs`: bộ kiểm, ĐÚNG hàm máy chủ dùng khi nhận hồ sơ.

## Đầu ra: `ra/<cùng tên tệp đầu vào>.json`, đúng các trường
- Chép nguyên từ đầu vào: `qid`, `bam`, `dang`. KHÔNG chép `de`, `so`, `nguon`, chữ của ý (`t`): app tự lấy đề từ kho.
- `ten`: tiêu đề ngắn ≤ 70 kí tự, nói đúng nội dung câu.
- `keys`: các id chìa khoá câu dùng, theo thứ tự xuất hiện.
- `dung`: nhịp DỰNG. Tầng `gon` 2 bước, `du`/`sau` 3–5 bước. Mỗi bước `{ "ic", "t", "p", "io" }`:
  - `ic`: một trong `i-flask i-funnel i-reflux i-distill i-bubbles i-salt i-dry i-ice i-filter i-crystal i-scale i-ir i-heat i-chart i-hex i-thermo i-lens i-bolt i-battery i-chain i-atom`;
  - `t`: tiêu đề ≤ 40 kí tự; `p`: 1–2 câu;
  - `io`: mảng cặp `["in"|"out", "nhãn ngắn"]`, có thể rỗng (`in` = giữ lại / có trong hệ; `out` = bị loại / thoát ra).
  - Câu lí thuyết: DỰNG là dựng phân tử, dựng sơ đồ, hoặc dựng hai vế cần so sánh.
- `y` (dạng `ds`, `tn`): đúng thứ tự và `id` của đầu vào. Mỗi mục `{ "id", "d", "k", "bay", "soi", "g", "giai", "lab" }`:
  - `d` PHẢI trùng `dapAn[id]`;
  - `k`: một id chìa khoá; `bay`: id kiểu bẫy nếu ý SAI / phương án bị loại vì bẫy đó, ngược lại `null`;
  - `soi`: 1 câu. Chữ nào trong ý cần soi, và vì sao;
  - `g`: gợi ý tăng dần. `g[0]` mở đầu bằng `Chìa khoá <b>Tên</b>` và nêu quy tắc; `g[1]` chỉ đúng dữ kiện; `g[2]` là phép kiểm quyết định, chưa nói thẳng đúng/sai. Dạng `ds` và phương án được chọn của `tn`: đúng 3 gợi ý. Phương án bị loại của `tn`: 1–3 gợi ý;
  - `giai`: `ds` mở đầu "Đúng." hoặc "Sai."; `tn` mở đầu "Chọn." hoặc "Loại.". Sau đó 1–3 câu nói bản chất;
  - `lab`: `[idChiaKhoa, idPreset]` trong `LAB_PRESETS`, hoặc `null` (mọi chương ngoài Ester: luôn `null`).
- `mc` (chỉ `tn`): `{ "d": "<mc.dapAn>" }`.
- `tl` (chỉ `tln`, khi đó `y` = `[]`): `{ "dapAn", "donVi", "k", "bay", "soi", "g", "giai" }`. `dapAn` chép nguyên `dapAn.kq`; `g` đúng 3 gợi ý; `giai` mở đầu "Đáp số: <dapAn>." rồi các bước ngắn.
- `ket`: `ds` là `"a Đ – b S – c Đ – d Đ"` (Đ/S theo đáp án); `tn` là `"Đáp án X"`; `tln` là `"Đáp số: <dapAn>"` (có thể thêm đơn vị).
- `nho`: 1 câu cần nhớ, ≤ 120 kí tự.
- `phepTinh`: MỌI con số lời giải tính ra. Mỗi mục `{ "ten", "bieuThuc", "ketQua", "lamTron" }`: biểu thức chỉ gồm số dấu chấm, `+ - * /` và ngoặc; `ketQua` đã làm tròn `lamTron` chữ số. Máy tính lại, lệch là trượt. Dạng `tln`: mục cuối có `"laDapSo": true` và `ketQua` bằng đúng đáp số. Không tính toán thì `[]`.
- `tuongTu`: ý Đúng/Sai MỚI cùng dạng (đổi chất hoặc đổi số) để học sinh tự thử. Tầng `gon` 1 ý, `du`/`sau` 2 ý. Mỗi ý `{ "t", "d", "giai", "phepTinh" }`, `giai` mở đầu "Đúng." / "Sai.". Có số thì phải có `phepTinh`.
- `co`: mảng cờ, không có thì `[]`. Mỗi cờ `{ "loai", "ghi" }`:
  - `dapAn`: bạn nghi đáp án kho sai, hoặc đáp án có chỗ tranh luận. Chỉ loại này bắt thầy phải xem.
  - `hienThi`: lỗi trình bày trong kho (chỉ số, mũi tên, bảng vỡ, lời giải chữ cũ sai chính tả…).
  - `loiDe`: đề in sai (thiếu dữ kiện, số vô lí, hình không khớp).
  - Với `hienThi` / `loiDe`, nếu biết chính xác chỗ sửa thì thêm `"sua": { "truong": "de" | "pa.A"… | "y.a"… | "bang", "truoc": "<đoạn NGUYÊN VĂN trong đề>", "sau": "<đoạn thay>" }` để app gom thành danh sách sửa kho.
  - Cờ `dapAn` sẽ được một phiên CHỐT giải lại độc lập và ra quyết định cuối (thầy giao máy tự chốt), nên ghi rõ chỗ tranh luận và lập luận của bạn.

## Luật bắt buộc
1. KHÔNG đổi đáp án. Tin `dapAn` sai thì vẫn giữ `d = dapAn`, viết lời giải bảo vệ được đáp án nếu hợp lí, và ghi cờ `dapAn`.
2. KHÔNG bịa số liệu. Chỉ dùng số trong đề hoặc hằng số phổ thông (H = 1, C = 12, N = 14, O = 16, Na = 23, Cl = 35,5; F = 96500 C/mol trừ khi đề cho khác…). Dùng số ngoài đề thì ghi "khoảng" và ghi cờ `dapAn`.
3. Công thức hoá học trong phần bạn viết đặt trong ngoặc nhọn MỘT tầng để khung hạ chỉ số: `{H2SO4}`, `{C6H12O6}`. Điện tích ion: `{Fe}<sup>3+</sup>`. Thẻ HTML chỉ được `<b> <i> <sub> <sup> <br>`, KHÔNG thuộc tính.
4. Tiếng Việt, câu ngắn, thẳng vào bản chất. Không rào đón, không khen sáo, không dùng chữ "AI". Thuật ngữ đúng chương trình 2018.
5. Số thập phân trong chữ dùng dấu phẩy (10,4 mL). Trong `bieuThuc` dùng dấu chấm.
6. Ảnh trong `hinh`: BẮT BUỘC mở bằng công cụ Read trước khi soạn câu đó.

## Cách làm cả lô
1. Đọc `bo.json` và `vi-du-mau.json` một lần. Đọc lướt mọi câu, gom các câu cùng dạng để giọng và cách giải thống nhất.
2. Từng câu: tự giải trước (dùng `loiGiaiCo` làm điểm xuất phát, giữ lập luận đúng, bổ sung chỗ thiếu), rồi mới viết JSON bằng công cụ Write.
   Ghi TỪNG tệp `ra/<tên>.json` trực tiếp bằng Write, đường dẫn tương đối trong thư mục lô. KHÔNG viết script sinh tệp (gen.mjs…): Bash chỉ chạy được `node kiem.mjs`, script khác bị chặn và cả lô mất trắng.
3. Chạy `node kiem.mjs`. Sửa mọi dòng TRƯỢT rồi chạy lại, tối đa 2 vòng sửa cho mỗi tệp. Còn trượt thì để nguyên (máy chủ trả câu về hàng).
4. Trả lời cuối đúng 1 dòng: số câu ĐẠT / tổng, số cờ `dapAn`.
