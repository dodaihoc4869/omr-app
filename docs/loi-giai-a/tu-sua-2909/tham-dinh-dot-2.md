# Thẩm định đợt 2 (29/09/2026)

Đầu vào: `sua-kho-2.json`, gồm 60 mục `sua` và 6 mục `dapAnSai`. Đề thật đọc qua `/kho/lay` (chỉ đọc).
Kết quả: `ke-hoach-dot-2.json`, gồm 63 việc: 57 sửa đề duyệt từ `sua`, 4 sửa đề tối thiểu từ `dapAnSai` và 2 đổi đáp án.

## Mục `sua`: 57 duyệt, 3 loại

Các mục được duyệt có đoạn `truoc` xuất hiện đúng một lần. Chúng chỉ sửa chính tả, thuật ngữ hoặc trình bày và không làm đổi đáp án kho.
Nhóm "hao hụt tối đa 6%" (12-C1-B1-D2 II.9, DB-12-B1-P1-D2 II.28/II.98, DH-12-C1-B1-P1 II.22) được duyệt. Cách tính: n alcohol = 12,15/88 = 0,138 mol, ít hơn n acid = 0,175 mol, nên m = 0,138·130·0,54·0,94 = 9,11 g và V = 10,4 mL. Như vậy ý d có giá trị 10,8 mL là Sai, khớp với đáp án kho.

| # | Câu | Trường | Quyết định | Lý do |
|---|---|---|---|---|
| 32 | 12-KT-C56-D1 III.4 | de | LOẠI | Không tìm thấy đoạn `truoc` "3H₂O(g) (e) Al(s)" vì đề trong kho đã tách (d), (e) thành hai dòng riêng. Không cần sửa. |
| 33 | 12-KT-C56-D1 III.4 | de | LOẠI | Không tìm thấy đoạn "3Ag(s) (g) 2NH₃(g)" vì trong kho (e), (g) đã nằm ở hai dòng riêng. |
| 53 | DH-12-C1-B1-P1 II.26 | de | LOẠI | "2960" không có trong trường `de`; ô này nằm trong `bang`. Lỗi có thật: trường `de` thừa đuôi "\n– 2850", còn ô C–H trong `bang` thiếu "– 2850". Đề nghị một đợt sau sửa hai việc: (1) trường `bang`, đổi ô "2960" thành "2960 – 2850"; (2) trường `de`, xoá "\n– 2850" ở cuối. |

## Mục `dapAnSai`: quyết định từng câu

| Câu | Kho | Quyết định | Lập luận |
|---|---|---|---|
| 12-BD7-18 I.2 | B | Sửa đề tối thiểu (pa.D), giữ B | Cả B và D cũ đều đúng: maltose còn nhóm –OH hemiacetal nên trong dung dịch có cân bằng dạng vòng ⇌ dạng mạch hở. Không ghi được hai đáp án, nên đổi D thành "Maltose chỉ tồn tại ở dạng mạch hở trong dung dịch." (sai). |
| DB-12-B5-D2 I.163 | B | Sửa đề tối thiểu (pa.D), giữ B | Câu này giống hệt câu trên và được sửa theo cùng cách. |
| 12-KT-C4-D4 I.11 | D | Sửa đề tối thiểu (pa.A và pa.C), giữ D | A cũ đúng vì nền có thể là chất dẻo hoặc cao su. C cũ cũng đúng vì cốt làm tăng tính chất cơ lí. Sửa A thành "Vật liệu nền chỉ có thể là chất dẻo", sai vì theo SGK nền còn có thể là kim loại hoặc gốm. Sửa C thành "…để làm giảm độ bền cơ học của vật liệu" (sai). B vẫn sai vì liên kết các thành phần là vai trò của nền. Sau khi sửa, chỉ còn D đúng. |
| DB-12-B5-D2 III.255 | 6,67 | ĐỔI thành 2 | Trong dãy chỉ glucose và fructose là monosaccharide. Maltose, saccharose là disaccharide; tinh bột, cellulose là polysaccharide. Đáp số đếm phải là số nguyên. |
| DH-12-C2-B4 III.2 | 6,67 | ĐỔI thành 2 | Câu này giống hệt câu trên. |
| DH-12-C1-B1-P2 I.56 | C (6) | GIỮ NGUYÊN | Không đồng ý với kết luận của phiên chốt. Triester tạo từ glycerol và hai acid béo có tối đa 2²·3/2 = 6 đồng phân cấu tạo. Cụ thể: PPP, OOO (hai chất chỉ có một loại gốc), PPO, POP, OOP, OPO. Đề không ghi "chứa đồng thời hai gốc", nên đây là kết quả chuẩn trong đề thi. Phiên chốt cho rằng số 6 là do cộng thêm đối quang; cách hiểu đó sai. Hai hình trong đề là một phần lời giải của đề gốc, chỉ vẽ 4 chất hỗn tạp. Ghi chú của lời giải cho thấy đề gốc còn có (R₁COO)₃C₃H₅ và (R₂COO)₃C₃H₅. Việc nên làm sau: xem có nên gỡ hai hình này khỏi thân đề hay không, vì chúng lộ lời giải và dễ khiến học sinh chọn 4. Đợt này không sửa. |
