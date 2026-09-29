# Thẩm định đợt 4a (29/09/2026)

Đầu vào: `sua-kho-4a.json`, gồm 142 mục `sua` (`dapAnSai` rỗng). Kết quả ghi ở `ke-hoach-dot-4a.json`: **141 việc `thay` được DUYỆT, 1 mục bị LOẠI**.

## Kiểm máy
- Đã đọc đề thật của 44 mã đề bằng `/kho/lay`. Cả 142 mục đều sửa vào trường dạng chuỗi (`de`, `pa`, `y`), không mục nào sửa `bang`. Đoạn `truoc` có mặt **đúng 1 lần** trong trường, kể cả khi áp lần lượt nhiều mục vào cùng một trường (DB-11-B8-D3-I-9: 2 mục; DB-11-B6-D2-I-49: 3 mục; DB-11-B2-D5-II-46, DB-11-B2-D5-III-59, DB-11-B5-D2-I-42: mỗi đề 2 mục).
- Đã mở hình đồ thị của DB-11-B1-D1-III-217. Trục tung ghi đơn vị 10⁻³ M, nồng độ đầu là 5, lúc cân bằng HI = 8,64 và H₂ = 0,68. Vậy 4 mục sửa "5 mol" thành "5.10⁻³ mol" làm đề khớp với đáp án trong kho.

## Mục LOẠI

| # | qid | Trường | Đề xuất | Lý do loại |
|---|-----|--------|---------|------------|
| 53 | DB-10-B8-D2-II-32 | de | "màu hồng trong cả hai cốc" → "màu hồng chỉ trong cốc chứa calcium" | Bản sửa đổi nội dung thí nghiệm, dựa trên phỏng đoán về đề gốc nên không chắc đúng. Nếu sửa, cách hiểu các ý c và d có thể lệch khỏi đáp án SSSD trong kho. Cần thầy xem nguồn gốc của đề. |

## Mục DUYỆT nhưng đã chỉnh `sau` (kho không dùng HTML)
- 11-C2-B5-II-1, DB-11-B5-D1-II-2, DB-11-B8-D3-I-9: đổi `Δ<sub>r</sub>H<sup>o</sup><sub>298</sub>` thành `ΔrH°₂₉₈`.
- DB-10-B5-D1-III-95: đổi `Z<sub>A</sub>…` thành `ZA = 6, ZB = 14, ZC = 19, ZD = 20`, cùng cách viết với ZB, ZC, ZD.
- DB-11-B8-D3-I-11, DB-11-B8-D3-III-39: đổi `<br>` thành ký tự xuống dòng.

## Soát nội dung các mục đổi nghĩa (đều giữ nguyên đáp án kho)
- 11-C4-B16-II-1 ý d: X là C₄H₈. Phần trăm khối lượng H = 8/56 = 14,28%, nên ý d vẫn Đúng.
- DB-10-B5-D1-I-58: nếu "ít hơn" thì Y là F và chỉ có A sai. Khớp đáp án A.
- DB-10-B5-D1-I-36: thêm "trong vỏ", đáp án ô 8 (oxygen) vẫn đúng.
- DB-10-B1-D2-III-10: thêm "Lấy π = 3,14", ra D = 7,84.
- DB-10-B2-D2-II-99 ý d: ³⁷Cl trong MgCl₂ chiếm 18,8%, sửa chữ thành "khoảng 19%", ý d vẫn Đúng.
- DB-11-B2-D3-III-173: V = 0,067/0,48 = 0,1396, làm tròn đến hàng phần trăm được 0,14.
- DB-11-B8-D2-III-30: Fe = 8,4 g và SO₂ = 14,4 g. Đặt khối lượng SO₂ là x, đáp án 14,4 không đổi.
- DB-11-B8-D3-I-31: sửa "SO₃→SO₃" thành "SO₂→SO₃" ở cả 4 phương án, đáp án vẫn là D (FeS₂).
- DB-11-B6-D2-I-26: sửa "dioxide" thành "monoxide". Đổi N², O² thành N₂, O₂ ở 4 phương án, đáp án A không đổi.
