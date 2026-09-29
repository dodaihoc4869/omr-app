# Việc: soạn HỒ SƠ LỜI GIẢI cho một câu Hoá (khuôn v1)

Bạn soạn lời giải cho học sinh lớp 12 luyện thi (chương trình Hoá phổ thông 2018 của Việt Nam, dùng tên chất theo IUPAC tiếng Anh như đề: ethyl acetate, acetic acid…). Kết quả là MỘT tệp JSON, được khung trình bày cố định của app hiển thị. Bạn chỉ viết dữ liệu; không viết HTML ngoài các thẻ cho phép bên dưới, không viết JavaScript.

## Đầu vào
- Tệp câu hỏi (JSON): `qid`, `so`, `nguon`, `dang`, `chuong`, `de` (đề nguyên văn, HTML), `y` (các ý/nhận định/phát biểu, nguyên văn), `dapAn` (ĐÁP ÁN CHÍNH THỨC từng ý: "D" đúng, "S" sai), có thể có `mc` (câu hỏi chốt + các lựa chọn + `dapAn`).
- `bo-chia-khoa-ester.json`: bộ 6 chìa khoá của chương (id k1…k6, quy tắc), 7 kiểu bẫy (id), danh sách biểu tượng, danh sách phòng thí nghiệm có sẵn (id).
- `vi-du-mau.json`: MỘT hồ sơ mẫu hoàn chỉnh. Bắt chước đúng cấu trúc, độ dài và giọng văn.

## Đầu ra: JSON với đúng các trường
- Chép nguyên: `qid`, `so`, `nguon`, `dang`, `chuong`, `de`.
- `ten`: tiêu đề ngắn, tối đa 70 kí tự, nói đúng nội dung thí nghiệm hoặc chủ đề.
- `keys`: các id chìa khoá mà câu dùng, theo thứ tự xuất hiện.
- `dung`: 2–5 bước (nhịp DỰNG). Mỗi bước có:
  - `ic`: một id trong danh sách biểu tượng;
  - `t`: tiêu đề ≤ 40 kí tự;
  - `p`: mô tả 1–2 câu;
  - `io`: mảng cặp `["in"|"out", "nhãn ngắn"]`, có thể rỗng. `in` là thứ giữ lại hoặc có trong bình, `out` là thứ bị loại bỏ hoặc thoát ra.
  Với câu cấu tạo hoặc lí thuyết, DỰNG là dựng phân tử hoặc dựng hai yếu tố cần so sánh.
- `y`: giữ nguyên `id` và `t` (nguyên văn ý). Thêm các trường sau:
  - `d`: PHẢI trùng `dapAn[id]`.
  - `k`: một id chìa khoá.
  - `bay`: id kiểu bẫy nếu ý SAI vì bẫy đó. Ý ĐÚNG thì để `null`.
  - `soi`: 1 câu. Chữ nào trong ý cần soi, và vì sao.
  - `g`: đúng 3 gợi ý, bậc sau lộ nhiều hơn bậc trước. `g[0]` gọi tên chìa khoá và quy tắc cần dùng, bắt đầu bằng `Chìa khoá <b>Tên</b>`. `g[1]` chỉ đúng dữ kiện hoặc chỗ cần nhìn. `g[2]` là phép kiểm quyết định (số hoặc lí lẽ), chưa nói thẳng "đúng/sai".
  - `giai`: bắt đầu bằng "Đúng." hoặc "Sai.", sau đó 1–3 câu giải thích bản chất.
  - `lab`: `[idChiaKhoa, idPreset]` lấy trong danh sách phòng thí nghiệm, hoặc `null` nếu không có preset hợp.
- `mc` (chỉ khi đầu vào có): chép `hoi` và `o`, trường `d` = `mc.dapAn`.
- `ket`: với dạng `ds` là chuỗi `"a Đ – b S – c Đ – d Đ"`. Với dạng `dem`/`sai` là 1 câu chốt đáp án lựa chọn.
- `nho`: 1 câu cần nhớ, ≤ 120 kí tự.
- `phepTinh`: MỌI con số mà lời giải tính ra (số mol, khối lượng, hiệu suất, hiệu số…). Mỗi phép tính là một mục `{ "ten", "bieuThuc", "ketQua", "lamTron" }`:
  - `bieuThuc`: biểu thức chỉ gồm số thập phân dấu chấm, + - * / và ngoặc;
  - `ketQua`: số đã làm tròn;
  - `lamTron`: số chữ số thập phân.
  Máy sẽ tự tính lại. Lệch là hồ sơ bị trả về. Câu không có tính toán thì để `[]`.
- `tuongTu`: 1–2 ý Đúng/Sai MỚI cùng dạng nhưng đổi chất hoặc đổi số, để học sinh tự thử. Mỗi ý có `{ "t", "d", "giai", "phepTinh" }`. Nếu có số thì cũng phải có `phepTinh`.
- `canThayChot`: mảng lí do. Điền khi có chỗ đáp án chính thức có thể tranh luận, đề in sai, hoặc bạn không chắc chắn. Không có thì để `[]`.

## Luật bắt buộc
1. KHÔNG được đổi đáp án. Nếu bạn tin `dapAn` sai, vẫn giữ `d = dapAn`, viết lời giải theo hướng bảo vệ được đáp án đó nếu hợp lí, và ghi rõ lí do vào `canThayChot`.
2. KHÔNG bịa số liệu. Chỉ dùng số trong đề hoặc hằng số phổ thông (khối lượng nguyên tử H = 1, C = 12, O = 16, N = 14, Na = 23, Cl = 35,5…). Dùng số ngoài đề thì ghi "khoảng" và nêu ở `canThayChot`.
3. Công thức hoá học viết trong ngoặc nhọn để khung tự hạ chỉ số: `{H2SO4}`, `{CH3COOC2H5}`. Thẻ HTML chỉ được dùng `<b>`, `<i>`, `<sub>`, `<sup>`, `<br>`.
4. Viết tiếng Việt, câu ngắn, thẳng vào bản chất. Không rào đón, không khen sáo, không dùng chữ "AI". Thuật ngữ đúng chương trình (ester hoá, thuỷ phân, xà phòng hoá, liên kết hydrogen, chưng cất phân đoạn…).
5. Số thập phân trong chữ dùng dấu phẩy (10,4 mL). Trong `bieuThuc` dùng dấu chấm.

## Cách làm
Đọc 3 tệp đầu vào, tự giải từng ý trước, rồi mới viết JSON. Ghi đúng một tệp theo đường dẫn được giao, bằng công cụ Write. Trả lời cuối: 1 dòng tóm tắt và số mục `canThayChot`.

---
# Bổ sung khuôn v1.1: câu thật trong kho (đầu vào có thêm trường)
- `loiGiaiCo`: lời giải dạng chữ đã có trong kho.
  - Có các trường `chot`, `tung` (từng phương án hoặc từng ý: `dung`, `vi_sao`), `buoc`, `ket_qua`.
  - `trang_thai = "khop"` nghĩa là đã đối chiếu với đáp án tác giả.
  - DÙNG LÀM ĐIỂM XUẤT PHÁT: giữ lập luận đúng, chuyển sang khuôn 4 nhịp, bổ sung chỗ còn thiếu. Không phải giải lại từ đầu.
  - Thấy lời giải cũ sai hoặc thiếu thì ghi vào `canThayChot`.
- `hinh`: đường dẫn ảnh PNG trong đề. BẮT BUỘC mở xem bằng công cụ Read trước khi soạn.
- `mucDo` (`biet` | `hieu` | `van_dung`), `dangBai` (mã dạng bài): dùng để chọn độ sâu.
  - `biet`: gọn. DỰNG 2 bước, 1 ý tương tự.
  - `hieu` và `van_dung`: đủ. DỰNG 3–5 bước, 2 ý tương tự.
- Công thức trong đề kho đã là chữ số dưới Unicode (C₃H₆O₂). Trong phần bạn viết vẫn dùng `{C3H6O2}`.

## Dạng `tn` (trắc nghiệm 4 phương án)
- `y`: đúng 4 mục A–D, giữ nguyên `id` và `t`. Mỗi mục có:
  - `d = dapAn[id]`: `"D"` là phương án được CHỌN (đáp án), `"S"` là phương án bị LOẠI.
  - `giai`: mở đầu bằng "Chọn." hoặc "Loại.", rồi 1–2 câu nêu lí do.
  - `g`: 3 gợi ý cho phương án được chọn; 1–2 gợi ý cho mỗi phương án bị loại.
  - `bay`: với phương án bị loại, là kiểu bẫy khiến học sinh dễ chọn nhầm nó (hoặc `null`). Với phương án được chọn, để `null`.
- `mc`: `{ "hoi": "Chọn đáp án", "o": [...chép nguyên...], "d": mc.dapAn }`.
- `ket`: `"Đáp án X"`.
- `tuongTu`: 1–2 ý Đúng/Sai (không phải câu 4 phương án).

## Dạng `tln` (trả lời ngắn, đáp số là một số)
- `y`: `[]`.
- `tl`: `{ "dapAn", "donVi", "k", "bay", "soi", "g", "giai" }`.
  - `dapAn`: chép nguyên `dapAn.kq`.
  - `donVi`: đơn vị, hoặc `""`.
  - `bay`: lỗi học sinh hay mắc (id kiểu bẫy), hoặc `null`.
  - `g`: đúng 3 gợi ý.
  - `giai`: mở đầu bằng "Đáp số: <dapAn>.", rồi các bước ngắn gọn.
- `phepTinh`: chuỗi tính đầy đủ theo thứ tự. Mục cuối có thêm `"laDapSo": true`, và `ketQua` của mục đó (làm tròn như đề yêu cầu) phải bằng đáp số.
- `ket`: `"Đáp số: <dapAn>"`.
