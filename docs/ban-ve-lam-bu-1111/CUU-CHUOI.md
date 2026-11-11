# LÀM BÙ CỨU CHUỖI (11/11/2026)

Thầy 11/11: «phần làm bù cứu chuỗi bạn tính toán thông minh nhất hiệu quả nhất cho từng học sinh để học sinh mất chuỗi có thể làm bù cứu chuỗi. Áp dụng luôn cho tất cả hs mất chuỗi từ hôm qua nhé».

Mã: `server/src/chuoi-ngay-bai.ts` (hàm thuần `chuoiNgayCuaEm`, khối `NGAY_CUU_BU`), đọc D1 `server/src/chuoi-ngay-bai-d1.ts` + `thuong-ngay-hoc.ts`, màn `src/components/thuong/ManChuoi.tsx`. Ảnh thật: `cuu-chuoi/` (`node docs/ban-ve-lam-bu-1111/chup-cuu-chuoi.mjs <thư mục build chup-v2>`).

## Luật cũ (trước 11/11) và vì sao đổi
Lỡ một ngày, hết bình ⇒ chỉ cứu được ĐÚNG ngày hôm sau, phải làm đủ mức + 12 câu, mỗi tuần một lần. Em thiếu 2 câu cũng phải bù 12; em bận đúng hôm sau thì mất hẳn.

## Luật mới — thiếu bao nhiêu, bù bấy nhiêu
| | |
|---|---|
| Áp cho | Ngày lỡ từ **09/11** (em mất chuỗi hôm qua 10/11 là em lỡ ngày 09/11 hoặc 10/11). Ngày lỡ trước đó giữ luật cũ, chuỗi cũ không đổi. |
| Phải bù | Đúng số câu em còn thiếu của ngày lỡ: mức gốc của ngày − số câu đã làm. Thiếu 8 bù 8; nghỉ cả ngày bù 28; lỡ bài Kiểm tra ôn tập bù 28. |
| Câu bù là | Câu em làm VƯỢT mức gốc của một ngày sau đó. Câu **trả nợ câu** chính là câu bù (mức gốc = mức hôm ấy − phần trả nợ). Em không có nợ câu thì bù bằng «Học thêm» sau khi đủ bài (hết câu mới thì máy phát câu ôn / câu sửa). |
| Hạn | Hết ngày thứ **4** sau ngày lỡ — khớp nợ câu (3 lần trả tối thiểu, lần thứ tư trả hết). Bù rải nhiều ngày được; màn ghi «mỗi ngày bù N câu là kịp». |
| Nhiều ngày lỡ | Ngày cũ nhất được bù trước. Ngày nào bù xong thì thành «cứu»; ngày nào quá hạn thì tắt, chỉ mất phần chuỗi trước nó. |
| Trong lúc chờ | Số chuỗi hiện = số ngày đạt chắc chắn còn; màn cứu ghi chuỗi sẽ nối lại bao nhiêu ngày nếu bù kịp. |
| Giới hạn | Không còn «mỗi tuần một lần», không tốn tinh thể. Còn bình thì bình vẫn tự đỡ trước như cũ. Luật cũ (hôm sau đủ mức + 12 câu) vẫn được nhận ⇒ không em nào thiệt so với trước. |

Ví dụ: chuỗi 5 ngày, ngày 09/11 làm 20/28 (thiếu 8), ngày 10/11 đủ. Hôm nay 11/11 chuỗi hiện 1, màn cứu «Cứu chuỗi 6 ngày · làm bù 8 câu trước 24:00 ngày 13/11». Em làm 36 câu hôm nay (28 + 8) ⇒ chuỗi 7 ngày.

## Sửa kèm: ngày Kiểm tra ôn tập
Từ 11/11 ngày Kiểm tra ôn tập chỉ còn 28 câu kiểm tra (bỏ 12 câu bài tập), mà chuỗi không đếm câu kiểm tra ⇒ em nào có bài kiểm tra cũng bị tính lỡ ngày. Nay: **đã nộp bài Kiểm tra ôn tập là ngày đạt** (kể cả nộp bài trắng); chưa nộp là ngày lỡ, bù 28 câu. Chuỗi tính lại từ sổ mỗi lần đọc nên các em nộp bài hôm nay 11/11 không mất gì.

## Điều chưa làm / cần biết
- Thưởng chốt theo ngày lúc 00:10 (thăng hoa, cược) của các ngày đã qua KHÔNG tính lại khi ngày ấy được cứu sau.
- Đọc nhiều em (lửa đôi, bảng thầy, phụ huynh): ngày Kiểm tra ôn tập chỉ được nhận là «đã nộp» khi sổ học có ít nhất một dòng của ngày ấy (em nộp bài trắng hoàn toàn thì ở các bảng này vẫn là lỡ; chuỗi của chính em thì đúng).
- App bản cũ còn trong bộ nhớ đệm máy em sẽ vẽ màn cứu theo đơn vị «chặng» cho tới khi tự cập nhật.
- Test: `tests/cuu-chuoi-lam-bu-1111.test.ts` (9 kịch bản luật thuần), `tests/cuu-chuoi-d1-1111.test.ts` (nối D1, nợ câu, kiểm tra ôn tập, một em = nhiều em), thêm ca trong `tests/thuong-giao-dien-hs-2610.test.tsx`.
