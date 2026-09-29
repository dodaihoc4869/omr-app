# Việc: CHỐT các cờ "đáp án" trong hồ sơ lời giải (thầy giao máy tự chốt, 29/09/2026)

Thầy không duyệt từng điểm tranh luận nữa: bạn là người chốt. Chốt nghĩa là ra quyết định cuối cùng, có lí do, rồi sửa hồ sơ theo quyết định ấy. Không để lại câu "thầy xem", "cần thầy chốt".

## Đầu vào (thư mục hiện tại)
- `vao/<tệp>.json`: câu gốc + `dapAn` chính thức của kho (xem `goi-may-soan.md` để biết các trường).
- `ra/<tệp>.json`: hồ sơ đã soạn, qua bộ kiểm, còn cờ `{ "loai": "dapAn", … }` trong `co`.
- `chot.txt`: danh sách các tệp cần chốt.
- `bo.json`, `goi-may-soan.md`, `kiem.mjs` như lúc soạn.

## Với MỖI cờ `dapAn`: giải lại ĐỘC LẬP câu ấy từ đầu (không đọc lời giải cũ trước), rồi chọn đúng một trong ba
1. **Đáp án kho đứng được** (chỗ tranh luận chỉ là cách hiểu, đề thi và SGK đều theo đáp án này):
   chuyển cờ từ `co` sang mảng `daChot` (tạo nếu chưa có): `{ "ghi": "<nội dung cờ cũ>", "chot": "Giữ đáp án kho: <lí do ngắn>" }`. Nếu cần, thêm MỘT câu vào `giai` của ý đó để chặn cách hiểu sai.
2. **Đề in sai, thiếu hoặc lệch chữ, nhưng đáp án vẫn đúng**:
   - đổi `loai` thành `loiDe`, hoặc `hienThi` nếu chỉ sai trình bày;
   - thêm `"sua": { "truong", "truoc", "sau" }`:
     - `truong`: `de`, `pa.A`–`pa.D`, `y.a`–`y.d` hoặc `bang`;
     - `truoc`: đoạn chép NGUYÊN VĂN từ `de` / `y` của `vao` (đúng từng kí tự, ngắn nhất đủ duy nhất);
     - `sau`: đoạn thay.
   - Viết lời giải theo bản ĐÃ SỬA của đề, vì kho sẽ được sửa theo `sua`.
3. **Đáp án kho sai thật, hoặc có hai đáp án cùng đúng**:
   - giữ `loai: "dapAn"`;
   - thêm `"chot": "Đáp án đúng là … vì …"`.
   Không đổi `d`: bộ kiểm khoá đáp án kho. Hồ sơ này sẽ không công bố cho tới khi kho sửa đáp án; câu tự vào lại hàng soạn sau khi sửa.

Cờ `hienThi`, `loiDe` đã có sẵn: nếu viết được `sua` chính xác thì thêm vào; không thì để nguyên.

## Luật
Giữ nguyên mọi luật của `goi-may-soan.md`: không đổi `d`, không bịa số, công thức trong `{…}`, chỉ các thẻ HTML cho phép. Chọn 3 chỉ khi bạn chắc chắn sau khi đã giải lại; còn phân vân thì theo SGK Hoá 12 chương trình 2018 và cách ra đề thi tốt nghiệp.

## Kết thúc
Ghi đè `ra/<tệp>.json`. Chạy `node kiem.mjs`, mọi tệp phải ĐẠT. Trả lời 1 dòng: số cờ đã xoá / đã đổi sang sửa đề / giữ vì đáp án kho sai.
