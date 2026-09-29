# Chạy máy soạn lời giải trên máy thầy

Máy soạn dùng gói Claude đang có trên máy thầy nên không tốn tiền API.

## Làm một lần

1. Mở Terminal tại thư mục `omr-app`. Chạy `git pull`, rồi `npm install` nếu máy chưa cài.
2. Lưu mã bí mật của thầy vào tệp `~/.omr-ma-bi-mat`, chỉ một dòng. Tệp này nằm ngoài repo và máy soạn không in mã ra.
3. Xếp cả kho cũ vào hàng việc:
   ```bash
   node scripts/loi-giai/may-soan.mjs --nap-hang --lop tat-ca
   ```
   Đề mới nạp sau này tự vào hàng, không cần chạy lại bước này.

## Hằng ngày

```bash
node scripts/loi-giai/may-soan.mjs
```
- Chạy 4 luồng, khối 12 trước. Để Terminal mở.
- Hết việc thì cứ 30 phút máy tự hỏi lại.
- Bấm Ctrl+C một lần để dừng sau khi các lô đang soạn xong.

## Đề sắp giao, cần soạn gấp

```bash
node scripts/loi-giai/may-soan.mjs --de <mã đề> --mot-lan
```

## Xem tiến độ

```bash
node scripts/loi-giai/may-soan.mjs --tong
```

Nhật ký từng lô nằm ở `.may-soan/nhat-ky.jsonl`.

## Duyệt

Vào app thầy, chọn Kho đề (Ngân hàng đề), rồi chọn **Duyệt lời giải**. Nhập mã đề, rồi bấm **Duyệt N câu sạch**.

Máy đã tự chốt các chỗ tranh luận về đáp án. Câu mà máy kết luận "đáp án kho sai" không được công bố. Danh sách sửa kho lấy từ lệnh `/gv/loi-giai/sua-kho`.
