# Thẩm định đợt 3 (29/09/2026)

Đầu vào: `sua-kho-3.json` gồm 88 mục `sua` và 3 mục `dapAnSai` (`chuaChot` rỗng). Kết quả nằm ở `ke-hoach-dot-3.json`, có 91 việc: 88 việc `thay` và 3 việc `dapAn`.

## Kiểm máy (toàn bộ 88 mục sua)
- Đọc đề thật bằng `/kho/lay`. Cả 88 mục đều có trường là chuỗi, và đoạn `truoc` xuất hiện **đúng 1 lần** trong trường.
- Không có mục nào sửa `bang`, cũng không có cặp sửa phụ thuộc nhau.

## Mục sua: LOẠI
Không có.

## Mục sua: GIỮ NGUYÊN (không duyệt)
Không có. Cả 88 mục đều **DUYỆT**. Những mục cần soát nội dung được ghi dưới đây:

| qid | Soát |
|---|---|
| 12-C2-B6-D2-I-32, DB-12-B6-D3-I-13 | Ý (a) sau khi đổi a→α vẫn sai (cellulose là β-glucose, β-1,4). Còn (b), (c), (d) đúng, tức 3 ý đúng, khớp D. |
| 12-C2-B6-D2-II-39, DB-12-B4-D3-II-114 (y.a, y.b) | Đổi b→β, a→α. Amylose từ β-glucose là sai, cellulose từ α-glucose là sai, khớp SS ở đầu khoá SSDD. |
| 12-C2-B6-D2-II-36 y.d | α-amylase trong nước bọt là đúng, khớp D. |
| 12-KT-C56-D2-II-2 y.d (loi-de) | Nếu giữ chữ "chuẩn" thì phát biểu hiểu theo đúng chữ là ĐÚNG, vì E° là hằng số, trái với khoá S. Bỏ "chuẩn" (và sửa "là"→"và") thì câu thành "sức điện động 1,10 V không đổi", SAI chắc chắn vì nồng độ Cu²⁺ giảm, Zn²⁺ tăng nên E giảm. Đề khớp khoá DDSS. |
| 12-KT-C2-D2-I-10, DB-12-B4-D1-I-107 | Bỏ "Mã đề thi: 212", PA D thành "4". Cả (1)–(4) đều đúng nên khoá D đúng. |
| 12-KT-C6-D4-I-16 | Xoá phần dẫn câu 17–18 dính vào cuối PA D, PA D còn "(c), (d)". Khoá A = (a), (b), (c) đúng; (d) sai vì tinh chế đồng dùng điện phân chứ không dùng thuỷ luyện. |
| 12-KT-C3-D4-I-14, DB-12-B9-P1-D2-I-75 | "3)-b" thành "3)-b)", đúng định dạng các PA khác. Khoá C: Gly 6,02; Lys 10,24; Glu 2,33. |
| 12-KT-C5-D4/D5-I-7 | "Platinium" thành "platinum" (SGK 2018). PA A vẫn sai (tinh chế Cu cần anode bằng Cu thô), khoá D không đổi. |
| 12-C6-B20-I-9 | "khối lớp rắn" thành "khối lượng lớp vỏ rắn". Chỉ là câu dẫn, không ảnh hưởng khoá B (Al₂O₃). |
| DH-12-C2-B7-D1-I-1 (pa.A/B/C) | Đổi "m" thành "ₘ", giống cách viết Cₙ(H₂O)ₘ ở đề khác trong kho. |
| DB-12-B1-P1-D2-II-100, DH-12-C1-B1-P1-II-33 | Thêm câu dẫn "Mỗi phát biểu sau đây là đúng hay sai?" (`<br>` tự đổi thành xuống dòng). `truoc` nằm ở cuối đề. |

Ghi chú ngoài phạm vi: ở **12-C7-B24-I-51**, phương án A cũng in "M g(OH ) 2" nhưng đầu vào chỉ đề xuất sửa trường `de`. Nên đưa `pa.A` → "Mg(OH)₂" vào đợt sau.

## Mục dapAnSai: quyết định

| qid | Kho | Quyết định | Lập luận (tự giải độc lập) |
|---|---|---|---|
| 12-C5-B16-I-50 | B | **Đổi → D** | Đề ghi điện cực trơ. (a) Ion di chuyển về điện cực trái dấu: đúng. (b) Anode trơ chỉ oxi hoá anion hoặc H₂O: đúng (SGK). (c) Cathode khử cation (H⁺ cũng là cation) hoặc H₂O: đúng. (d) Kim loại bám cathode hoặc khí thoát ra nên khối lượng dung dịch giảm: đúng. Có 4 ý đúng, chọn D. Lời giải kho bác (b), (c) bằng anode tan, trái với điều kiện đề. |
| 12-KT-C2-D2-I-8 | A | **Đổi → B** | Đã xem 4 hình (hình gắn đúng từng PA, tệp I_8_A..D). D-fructose: C2 là C=O; –OH ở C3 trái, C4 phải, C5 phải. Hình A có C5 trái (L-sorbose). **B** khớp. C: C3 phải, C5 trái. D: C3 phải, C4 trái, C5 phải (D-sorbose). Chỉ B đúng. |
| DB-12-B4-D3-I-152 | A | **Đổi → B** | Hình giống hệt câu trên (cùng md5), lập luận như trên. |
