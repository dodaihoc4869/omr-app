# Thẩm định đợt 4b (29/09/2026)

Đầu vào là `sua-kho-4b.json`, gồm 142 mục `sua` thuộc 31 đề; `dapAnSai` rỗng. Kết quả nằm ở `ke-hoach-dot-4b.json`: **138 mục DUYỆT, 4 mục LOẠI**.

## Kiểm máy
- Đã đọc đề thật bằng `/kho/lay`. Cả 142 mục đều sửa trường là chuỗi (`de`, `pa.X`, `y.x`), không có mục nào sửa `bang`.
- Đoạn `truoc` xuất hiện **đúng 1 lần** trong trường. Khi một trường có nhiều mục, đã áp lần lượt theo thứ tự trong tệp và vẫn đúng 1 lần.

## Mục LOẠI

| # | qid | trường | Lý do loại |
|---|---|---|---|
| 32 | DH-10-C2-B5-III-21 | de | Bản sửa chèn thẻ HTML `<sub>…</sub>`. Cả 31 đề trong kho không đề nào dùng thẻ HTML (0 lần `<sub>`, `<sup>`, `<br>`), và bộ hiển thị `chem-format` không đọc thẻ nên màn thi có thể hiện nguyên chữ `<sub>`. Nếu muốn sửa thì viết chữ thường, ví dụ "Z(A) = 6" hoặc "A (Z = 6)". |
| 91 | DH-11-C2-B7-I-48 | de | Cùng lý do: chèn `Δ<sub>r</sub>H<sup>o</sup><sub>298</sub>`. Nên dùng dạng Unicode mà kho đang dùng: `ΔrH°₂₉₈`. Mục #90 (`2SO₂ g)` → `2SO₂ (g)`) không phụ thuộc mục này nên vẫn duyệt. |
| 95 | DH-11-C2-B7-I-55 | de | Chèn `<br>`, mà kho xuống dòng bằng `\n`. Nên thay bằng `"…\n(e) Thành phần chính"`. |
| 136 | DH-11-C2-B8-III-5 | de | Sửa (d)→(4) và mũi tên là đúng, nhưng bản sửa có `<br>`. Nên làm lại thành `"2SO₂+O₂ →(t°, V₂O₅) 2SO₃\n(4)"`. |

## Mục đổi nghĩa hoặc sửa lỗi đề đã soát và DUYỆT
- **#24, DH-10-C1-B1-III-34** (thêm "Lấy π = 3,14."): với π = 3,14 thì D = 7,838 khi N_A = 6,022.10²³ và 7,840 khi N_A = 6,02.10²³, cả hai đều ra 7,84, khớp kho. Nếu dùng π đầy đủ với N_A = 6,022 thì ra 7,83.
- **#25, DH-10-C1-B2-II-13 y.d**: %³⁷Cl = 18,82%, nên ghi "khoảng 19%" thì hợp hơn; ý này vẫn Đúng.
- **#29, DH-10-C2-B5-I-30**: thêm "trong vỏ" để đáp án O (ô 8) là duy nhất.
- **#31, DH-10-C2-B5-I-56**: X là Al (26 hạt mang điện). Nếu "nhiều hơn" thì Y là Cl và cả 4 nhận định đều đúng. Nếu "ít hơn" thì Y là F, chỉ A sai, khớp đáp án A.
- **#36, DH-10-C2-B6-II-14**: khi chỉ cốc calcium hồng thì c Sai và d Đúng, khớp SSSD.
- **#42 và #50** (5 mol → 5.10⁻³ mol): khớp với đồ thị và đáp án 8,64.10⁻³ M.
- **#45, DH-11-C1-B2-III-53**: V = 0,067/0,48 = 0,1396, ghi "hàng phần trăm" thì ra 0,14, khớp kho.
- **#65 đến #69**: sửa thành nitrogen monoxide và hạ chỉ số N₂, O₂. Đáp án A vẫn giữ.
- **#109 đến #112**: sửa SO₃→SO₃ thành SO₂→SO₃. D (FeS₂) vẫn đúng.
- **#134, DH-11-C2-B8-III-20**: đổi m của SO₂ thành x. Tính ra Fe = 8,4 g và SO₂ = 14,4 g, khớp kho.
- **#135**: 750 kg FeS₂ cho 12,5 kmol H₂SO₄; nhân hiệu suất 80% rồi chia cho nồng độ 98% được 1000 kg, khớp kho.
