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

## Duyệt — máy tự duyệt (thầy chốt 29/09: "máy duyệt luôn, tôi không làm gì cả")

- Hồ sơ **sạch** (qua đủ 6 khoá, không còn cờ đáp án) ⇒ máy chủ duyệt ngay lúc nộp, ghi giờ duyệt + ghi chú "máy duyệt". Học sinh thấy luôn.
- Hồ sơ **còn cờ đáp án** (máy kết luận đáp án kho sai, hoặc phiên chốt chưa kết luận) ⇒ không duyệt, không hiện với học sinh.
  Danh sách lấy từ lệnh `/gv/loi-giai/sua-kho`: `dapAnSai` (đã chốt đáp án đúng), `chuaChot` (chưa kết luận), `sua` (sửa chữ trong đề). Cuối đợt Boss báo thầy.
- Hồ sơ sạch nộp **trước** khi có máy duyệt: chạy một lần lệnh `/gv/loi-giai/may-duyet-bu` (gửi `{"thu":true}` để đếm trước). Lệnh chỉ đổi trạng thái chờ ⇒ đã duyệt, không xoá gì; chạy lại vô hại.
- Màn **Duyệt lời giải** (Kho đề ⇒ Duyệt lời giải) vẫn dùng được để xem lại hoặc trả lại một câu cho máy soạn làm lại.
