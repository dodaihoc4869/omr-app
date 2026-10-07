# Việc: GIẢI ĐỘC LẬP từng mục (lượt kiểm mù — máy soạn 05/10)

Bạn là người giải thứ hai, độc lập. Thư mục này chỉ có đề: KHÔNG có đáp án, lời giải hay ý kiến của ai khác — và bạn không cần tìm. Mỗi mục bạn giải ra sẽ được so với đáp án của lượt soạn: khớp thì mục được dùng cho học sinh luyện, lệch thì bị bỏ. Vì vậy chỉ trả lời khi CHẮC; phân vân thì trả lời "?" — một mục bị bỏ nhầm không hại gì, một đáp án sai đến tay học sinh thì có hại.

Chương trình Hoá học phổ thông 2018 của Việt Nam (SGK hiện hành, cách ra đề thi tốt nghiệp THPT). Tên chất theo IUPAC tiếng Anh như đề. Nguyên tử khối và hằng số phổ thông (H = 1, C = 12, N = 14, O = 16, Na = 23, Cl = 35,5…) trừ khi đề cho khác.

## Đầu vào: `vao/<tệp>.json` (tên các tệp có trong lời nhắc và trong `danh-sach.txt`)
- `cau`: đề dẫn của câu (`de`, có thể có `bang` = mảng hàng × cột, `hinh` = ảnh trong `vao/img/` — BẮT BUỘC mở bằng Read trước khi giải mục dùng đề dẫn).
- `muc`: các mục cần giải, mỗi mục có `id`, `loai`, `dang`:
  - `loai: "ban_khac"` — một câu HOÀN CHỈNH, tự đủ dữ kiện (`de`, có thể có `pa` A–D và `bang`). KHÔNG dùng đề dẫn `cau` cho mục này.
    - `dang: "tn"` ⇒ chọn một phương án: `d` = `"A"` … `"D"`.
    - `dang: "tln"` ⇒ tính đáp số: `d` = số, dấu phẩy thập phân, làm tròn đúng như đề yêu cầu (đề không nói ⇒ tối đa 2 chữ số thập phân), ví dụ `"54"`, `"3,36"`. Không ghi đơn vị.
  - `loai: "y"` — một PHÁT BIỂU về đề dẫn `cau` (chữ ở `t`): `d` = `"D"` (đúng) hoặc `"S"` (sai).
  - `loai: "goc"` — chính câu của đề dẫn `cau`:
    - `dang: "tn"` ⇒ chọn một trong `pa`: `d` = `"A"` … `"D"`;
    - `dang: "ds"` ⇒ xét bốn ý `y` (a, b, c, d theo thứ tự): `d` = bốn chữ D/S liền nhau theo thứ tự a–d, ví dụ `"DSSD"`;
    - `dang: "tln"` ⇒ đáp số như trên.

## Đầu ra: `ra/<cùng tên tệp>.json`
```json
{ "tra": [ { "id": "ss1", "d": "B", "lyDo": "một dòng: vì sao", "chac": true } ] }
```
- Mỗi mục trong `muc` đúng một dòng trong `tra`, cùng `id`.
- `d = "?"` và `chac: false` khi: đề thiếu / mâu thuẫn dữ kiện; có từ hai đáp án cùng bảo vệ được; Đ/S phụ thuộc quy ước, cách hiểu chữ hoặc phiên bản sách; cần dữ kiện ngoài đề; bạn tính ra số không khớp phương án nào. Ghi lí do vào `lyDo`.
- `chac: true` chỉ khi bạn tự giải ra và chắc chắn.

## Cách làm
1. Mở từng tệp `vao/`, mở ảnh nếu có, giải từng mục từ đầu (tính ra giấy nháp trong đầu, kiểm lại phép tính).
2. Ghi `ra/<tệp>.json` bằng công cụ Write. Không có công cụ nào khác; không viết script.
3. Trả lời cuối đúng 1 dòng: số mục đã giải / số mục "?".

## Kiểm định từng mục
Tự giải lại từ dữ kiện đề, không đoán theo đáp án hay suy từ các mục khác. Kiểm đơn vị, điều kiện phản ứng, giới hạn vật lý và mức làm tròn. Với lý thuyết, kiểm từng phương án, các từ tuyệt đối và khả năng nhiều đáp án đúng. Phải viết lý do cho từng kết luận; nếu thiếu dữ kiện hoặc không chắc, ghi `chac: false` và nêu lý do, không cố chọn để đủ số lượng.
