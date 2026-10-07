# Việc: soạn HỒ SƠ LỜI GIẢI cho một lô câu Hoá (khuôn 1.2)

Chỉ xử lý câu Phần I, II và III thuộc lý thuyết hoặc tính toán; tuyệt đối không sinh học liệu cho câu tự luận. Mục tiêu mỗi câu là sáu bản khác đã kiểm; Phần II cần 24 ý mới để tạo sáu bộ bốn ý không trùng nhau. Không tính việc chỉ xáo đáp án hoặc sửa vài chữ là bản khác đạt chuẩn.

Bạn soạn lời giải từng bước cho học sinh luyện thi (chương trình Hoá phổ thông 2018 của Việt Nam; tên chất theo IUPAC tiếng Anh như đề: ethyl acetate, glucose, saccharose…). Mỗi câu ra MỘT tệp JSON. Khung trình bày cố định của app vẽ tệp ấy. Bạn chỉ viết dữ liệu: không viết HTML ngoài các thẻ cho phép, không viết JavaScript.

## Thư mục làm việc (đã có sẵn)
- `vao/*.json`: các câu cần soạn, CÙNG MỘT CHƯƠNG. Mỗi tệp có:
  - `qid`, `bam` (dấu vân tay nội dung đề), `dang` (`tn` trắc nghiệm · `ds` Đúng/Sai · `tln` trả lời ngắn), `bo` (mã chương), `tang` (`gon` · `du` · `sau`);
  - `de` (đề, HTML), `hinh` (đường dẫn ảnh trong `vao/img/`), `y` (ý a–d hoặc phương án A–D, nguyên văn);
  - `dapAn`: ĐÁP ÁN CHÍNH THỨC của kho. Với `ds`/`tn`: `"D"` là đúng / được chọn, `"S"` là sai / bị loại. Với `tln`: `{ "kq": "<đáp số>" }`.
  - `mc` (chỉ `tn`): các phương án + `dapAn`;
  - `loiGiaiCo`: lời giải chữ đã có trong kho (`chot`, `tung`, `buoc`, `ket_qua`, `trang_thai`; `"khop"` = đã đối chiếu đáp án tác giả);
  - `ghiChuThay` (có thể có): thầy đã TRẢ LẠI bản trước, đây là chỗ thầy yêu cầu sửa. BẮT BUỘC làm theo.
  - (05/10) `can`: việc của câu này — `hoSo` (true ⇒ soạn hồ sơ `ra/`; false ⇒ câu đã có hồ sơ, KHÔNG viết `ra/`), `banKhac` (số bản khác cần soạn), `kieuBan` (`so` · `ly_thuyet` · `tu_chon`), `yDs` (số ý Đúng–Sai mới cần soạn). Xem mục "Học liệu thêm".
  - (05/10) `deTho` (đề nguyên chữ kho), `bang`, `phan` (`I` · `II` · `III`), `kieuKho` (`bai_tap` = câu tính toán · `ly_thuyet`), `daCo` (bản khác + ý mới ĐÃ có — không soạn trùng).
- `vi-du-bo-tro.json`: ba tệp học liệu mẫu đúng khuôn (bản khác đổi số Phần III, biến thể lí thuyết Phần I, ý Đúng–Sai mới Phần II).
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
- `phepTinh`: MỌI con số lời giải tính ra. Mỗi mục `{ "ten", "bieuThuc", "ketQua", "lamTron" }`: biểu thức chỉ gồm số dấu chấm, `+ - * /` và ngoặc; `ketQua` đã làm tròn `lamTron` chữ số. Máy tính lại, lệch là trượt. Dạng `tln`: mục cuối có `"laDapSo": true` và `ketQua` bằng đúng đáp số. Đáp số dạng a.10ⁿ (vd "1,2.10²³", "1,3.10⁻³"): viết số khoa học trong biểu thức như `6.02e23`, `1.3e-3`; `bieuThuc` tính ra CẢ con số (vd `0.2*6.02e23`), `ketQua` = con số đầy đủ (vd `1.2e23`, `0.0013`), `lamTron` = số chữ số thập phân của phần a — KHÔNG ghi riêng phần a. Không tính toán thì `[]`.
- `tuongTu`: ý Đúng/Sai MỚI cùng dạng (đổi chất hoặc đổi số) để học sinh tự thử. Tầng `gon` 1 ý, `du`/`sau` 2 ý. Mỗi ý `{ "t", "d", "giai", "phepTinh" }`, `giai` mở đầu "Đúng." / "Sai.". Có số thì phải có `phepTinh`.
- `co`: mảng cờ, không có thì `[]`. Mỗi cờ `{ "loai", "ghi" }`:
  - `dapAn`: bạn nghi đáp án kho sai, hoặc đáp án có chỗ tranh luận. Không ai duyệt tay (thầy 05/10): phiên CHỐT giải lại, rồi một lượt máy KHÁC giải lại độc lập không thấy đáp án — khớp đáp án kho ⇒ hồ sơ công bố; vẫn lệch ⇒ câu tạm bị loại khỏi các kênh tự động. Chỉ ghi khi thật sự nghi.
  - `hienThi`: lỗi trình bày trong kho (chỉ số, mũi tên, bảng vỡ, lời giải chữ cũ sai chính tả…).
  - `loiDe`: đề in sai (thiếu dữ kiện, số vô lí, hình không khớp).
  - Với `hienThi` / `loiDe`, nếu biết chính xác chỗ sửa thì thêm `"sua": { "truong": "de" | "pa.A"… | "y.a"… | "bang", "truoc": "<đoạn NGUYÊN VĂN trong đề>", "sau": "<đoạn thay>" }` để app gom thành danh sách sửa kho.
  - Cờ `dapAn` sẽ được một phiên CHỐT giải lại và một lượt kiểm mù giải lại độc lập (thầy giao máy tự xử), nên ghi rõ chỗ tranh luận và lập luận của bạn.

## Học liệu thêm (05/10): `bo-tro/<cùng tên tệp>.json` theo `vao.can`
Mục đích: học sinh làm lại câu sai bằng một BẢN KHÁC (không học thuộc đáp án được). Mỗi mục bạn viết sẽ bị một lượt máy THỨ HAI giải lại ĐỘC LẬP (không thấy đáp án của bạn); lệch hoặc mơ hồ là bị bỏ. Không ai duyệt tay. Tệp chỉ có `qid`, `bam` (chép từ vao) và `songSinh` HOẶC `yMoi`. KHÔNG chép học liệu thêm vào hồ sơ `ra/`.

**`can.banKhac = n > 0` (Phần I / III): viết ĐÚNG n bản vào `songSinh`.** Mỗi bản `{ "kieu", "cach", "de", "pa", "bang", "dap_an", "buoc", "chot", "phepTinh" }`:
- `kieu: "so"` — câu TÍNH TOÁN (`kieuKho = "bai_tap"`): giữ nguyên cách giải, ĐỔI SỐ LIỆU. Mỗi bản một bộ số riêng, khác đề gốc và khác nhau; số phải hợp lí (hiệu suất < 100 %, chất thiếu vẫn là chất thiếu…). `phepTinh` bắt buộc (khuôn như hồ sơ), mục cuối `"laDapSo": true`:
  - Phần III: `dap_an` là đáp số dạng `"54"` hoặc `"3,36"` (dấu phẩy) = đúng `ketQua` của phép tính cuối; đáp số các bản khác nhau và khác đáp số gốc.
  - Phần I: phương án đúng chứa đúng số tính ra; ba phương án nhiễu là số sai do bẫy thường gặp; KHÔNG phương án nhiễu nào trùng số đúng.
  - `cach: "doi_so"`.
- `kieu: "ly_thuyet"` — câu LÍ THUYẾT (`kieuKho = "ly_thuyet"`): `cach` là một trong `doi_chat` (đổi chất cùng loại) · `dao_chieu` (đảo chiều hỏi) · `dung_sai` (hỏi phát biểu đúng ↔ sai) · `doi_nhieu` (đổi phương án nhiễu). `phepTinh` không cần.
- `kieuBan = "tu_chon"`: câu có số liệu để đổi thì dùng `so`, không thì `ly_thuyet`.
- `de`: chữ thường như đề kho (`deTho`): công thức gõ như kho (H2SO4, Fe^3+, \ce{…}); KHÔNG thẻ HTML, KHÔNG kiểu `{H2O}` của hồ sơ. Đề nhắc tới bảng thì PHẢI kèm `bang` (mảng hàng × cột, hàng đầu là tiêu đề) — không mượn bảng / hình của đề gốc.
- `pa` (chỉ Phần I): `{ "A", "B", "C", "D" }` đủ bốn, không trùng nhau. Phần III không có `pa`.
- Phần I: xếp đáp án đúng ở các chữ KHÁC nhau giữa các bản (không để cả bộ cùng một chữ).
- `buoc`: 2–5 bước giải ngắn (một câu mỗi bước, có số thì ghi số); `chot`: một câu chốt cách giải.
- KHÔNG ghi các chữ "song sinh", "biến thể", "bản khác", "câu gốc", "đề gốc" trong đề / phương án / lời giải (học sinh đọc).
- Không trùng `vao.daCo.banKhac` (các bản đã có).

**`can.yDs = n > 0` (Phần II): viết ĐÚNG `n` ý MỚI vào `yMoi`,** cùng đề dẫn `vao.de` (+ bảng, hình) — ngoài 4 ý gốc và `vao.daCo.yDs`. Mỗi ý `{ "t": "<phát biểu>", "d": "D" | "S", "lyDo": "<lí do 1 dòng>" }`:
- Mỗi giá trị Đúng / Sai chiếm ít nhất 1/4 số ý (kho lệch một phía thì học sinh đoán được).
- Chỉ viết ý mà Đ/S là CHẮC theo SGK Hoá chương trình 2018 và dữ kiện trong đề. Ý mơ hồ, phụ thuộc quy ước / cách hiểu, hoặc cần dữ kiện ngoài đề ⇒ KHÔNG viết.
- Ý phải đọc độc lập (không "ý trên", "câu a"), chữ thường như đề kho, không thẻ HTML; `lyDo` một dòng, nói bản chất.

`node kiem.mjs` kiểm cả `bo-tro/` (dòng "Học liệu thêm đạt"). Sửa mọi dòng TRƯỢT như với hồ sơ.

## Luật bắt buộc
1. KHÔNG đổi đáp án. Tin `dapAn` sai thì vẫn giữ `d = dapAn`, viết lời giải bảo vệ được đáp án nếu hợp lí, và ghi cờ `dapAn`.
2. KHÔNG bịa số liệu. Chỉ dùng số trong đề hoặc hằng số phổ thông (H = 1, C = 12, N = 14, O = 16, Na = 23, Cl = 35,5; F = 96500 C/mol trừ khi đề cho khác…). Dùng số ngoài đề thì ghi "khoảng" và ghi cờ `dapAn`.
3. Công thức hoá học trong phần bạn viết đặt trong ngoặc nhọn MỘT tầng để khung hạ chỉ số: `{H2SO4}`, `{C6H12O6}`. Điện tích ion: `{Fe}<sup>3+</sup>`. Thẻ HTML chỉ được `<b> <i> <sub> <sup> <br>`, KHÔNG thuộc tính.
4. Tiếng Việt, câu ngắn, thẳng vào bản chất. Không rào đón, không khen sáo, không dùng chữ "AI". Thuật ngữ đúng chương trình 2018.
5. Số thập phân trong chữ dùng dấu phẩy (10,4 mL). Trong `bieuThuc` dùng dấu chấm.
6. Ảnh trong `hinh`: BẮT BUỘC mở bằng công cụ Read trước khi soạn câu đó.

## Cách làm cả lô
1. Đọc `bo.json`, `vi-du-mau.json` và `vi-du-bo-tro.json` một lần. Đọc lướt mọi câu, gom các câu cùng dạng để giọng và cách giải thống nhất.
2. Từng câu: tự giải trước (dùng `loiGiaiCo` làm điểm xuất phát, giữ lập luận đúng, bổ sung chỗ thiếu), rồi mới viết JSON bằng công cụ Write.
   Ghi TỪNG tệp `ra/<tên>.json` (khi `can.hoSo` khác false) và `bo-tro/<tên>.json` (khi `can.banKhac` hoặc `can.yDs` > 0) trực tiếp bằng Write, đường dẫn tương đối trong thư mục lô. KHÔNG viết script sinh tệp (gen.mjs…): Bash chỉ chạy được `node kiem.mjs`, script khác bị chặn và cả lô mất trắng.
3. Chạy `node kiem.mjs`. Sửa mọi dòng TRƯỢT rồi chạy lại, tối đa 2 vòng sửa cho mỗi tệp. Còn trượt thì để nguyên (máy chủ trả câu về hàng).
4. Trả lời cuối đúng 1 dòng: số câu ĐẠT / tổng, số cờ `dapAn`, số bản khác / ý mới đã viết.
