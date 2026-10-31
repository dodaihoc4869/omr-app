# Máy chủ cho 100.000 em cùng lúc — số đo và thiết kế (31/10)

Thầy 31/10: «Máy chủ này chạy cả trăm ngàn cùng lúc được. Tối ưu triệt để. Duolingo là bao nhiêu thì phải làm tới mức đó hoặc hơn.»

## 1. Số đo (thử tải trên D1 thử `omr-thu`, dữ liệu giả 500 lớp × 100 em)

| lượt | mã | 2.000 em | 10.000 em mở app dồn (ramp 120 s) |
|---|---|---|---|
| 12 | #666 | 0% lỗi, p95 ổn định 0,53 s | dừng sau ~20 s, lỗi 23% (`MAY_CHU_BAN`) |
| 13 | #668 β nhớ theo câu, #669 bảng tra chiến dịch | — | dừng sau ~70 s, lỗi 11%; D1 bận ~44% thời gian chạy câu, 293.667 câu |
| 14 | #670 bỏ DDL mỗi isolate lạnh | 0% lỗi, ramp p95 0,71 s | dừng sau ~16 s; D1 theo phút: ~500–600 **lượt gửi**/s lúc dồn, mỗi lượt chỉ 0,5–5 ms ⇒ trần là SỐ LƯỢT GỬI |
| 15 | #671 ngăn gom D1 liên isolate (bật trên máy thử) | — | hỏng từ 500 em: đầu nối dùng chéo ngăn (sửa #672) |
| 16 | #672 ngăn gom (bật trên máy thử) | 0% lỗi, lượt gửi −25% | dừng sau ~70 s: lỗi HẾT GIỜ 30 s — 8 ngăn gom thành chỗ nghẽn mới (mỗi ngăn chỉ giữ vài lượt D1 cùng lúc) ⇒ GIỮ TẮT trên bản sống |

- Câu đọc chiến dịch cả dòng (53% thời gian D1 ở lượt 12) biến mất ở lượt 13.
- Đo từng lệnh với dữ liệu giống thật (`scratchpad/bao-cao-lenh-nong.md`):
  - Sảnh lạnh: 151 câu / 23 lượt gửi, trong đó 59 câu là DDL (đã bỏ ở #670).
  - Trả lời: 33–45 câu cho mỗi lần (5–6 câu ghi). 16–20 câu lặp y hệt lần trả lời trước.
  - Kế hoạch ngày lần đầu trong ngày: 44 câu.

## 1b. Bài học lượt 14–16

- Trần D1 là **số lượt gửi** (≈ 300/s an toàn, ≈ 500/s lỗi), không phải thời gian chạy câu.
- Gom liên isolate qua vài ngăn gom: giảm được lượt gửi, nhưng ngăn gom tự thành nút thắt (hàng chờ, hết giờ).
  - Muốn dùng phải: nhiều ngăn hơn, lô lớn hơn khi đông, giới hạn hàng chờ.
  - Không phải lời giải chính.
- ⇒ Lời giải chính vẫn là bớt hẳn câu / lượt gửi theo từng em: B2–B4 (ngăn em giữ dữ liệu của em).

## 2. Kết luận từ số đo

- D1 nghẽn vì **số câu dồn** (khoảng 4.000 câu/giây), không phải câu nặng.
  - Ở lượt 13, câu tốn nhất chỉ 0,6 ms và thời gian chạy câu chỉ chiếm ~44%.
- Mỗi em gửi trung bình 3,66 lệnh/phút. 100.000 em là khoảng **6.100 lệnh/giây**.
  - Dù mỗi lệnh chỉ còn **1 câu D1**, một D1 vẫn không chịu nổi.
- ⇒ **Phải chia tải khỏi một D1.** Tối ưu từng câu chỉ đưa lên được cỡ 10–20 nghìn em.
- Mỗi em một ngăn (#661) làm đệm theo isolate bị chia nhỏ: khoảng 4–5 em mỗi isolate.
  - Dữ liệu chung đọc theo isolate nhân lên theo số isolate.
  - ⇒ Dữ liệu chung cũng phải đi đường khác.

## 3. Thiết kế (ba tầng, như các app lớn)

1. **Ngăn em giữ dữ liệu riêng của em** (SQLite trong Durable Object; đã có `KHO_EM` cho sổ làm bài).
   - Gồm hồ sơ game, phiên, lượt làm, thưởng, nắm kiến thức, kế hoạch ngày, Gói 7 của em.
   - Đọc và ghi tại chỗ (~0 ms), không qua D1.
   - Lần đầu ngăn thức thì nạp phần của em từ D1 bằng một lô.
2. **Ngăn gom** (vài chục DO) nhận bản sao các dòng ngăn em vừa ghi.
   - Ghi D1 theo lô lớn: một câu `json_each` cho hàng trăm dòng, mỗi 1–2 s.
   - App thầy đọc D1 như cũ, trễ vài giây.
   - Lệnh thầy hoặc cron ghi vào dữ liệu riêng của em (chấm, giao bài, khoá, đổi lớp, cron đêm) phải báo ngăn em, để ngăn em không dùng bản cũ.
3. **Dữ liệu chung** (cấu hình, kho câu, lớp, chiến dịch, ca thi) đi qua **ảnh chụp có phiên bản**, không đọc D1 theo từng em.
   - Ca thi mở hoặc đóng phải tới em ngay: dấu phiên bản đọc mỗi lệnh, hoặc đẩy.

## 4. Các bước (mỗi bước có công tắc tắt, test so khớp y hệt, cổng tốc độ, thử tải)

| bước | việc | trạng thái |
|---|---|---|
| B0 | β nhớ theo câu (#668), bảng tra chiến dịch (#669), bỏ DDL mỗi isolate lạnh (#670) | xong 31/10 |
| B1 | Cấu hình gộp một ảnh chụp; kho câu, β, `cau_meta` theo phiên bản kho | |
| B2 | Lệnh «trả lời» chạy trong ngăn: hồ sơ + phiên + lượt làm + thưởng ở ngăn, D1 nhận lô gom. Chạy bóng (so khớp với đường cũ) trước khi bật | |
| B3 | Sảnh, kế hoạch ngày, Gói 7 đọc từ ngăn; lệnh thầy / cron báo ngăn | |
| B4 | Ngăn gom ghi sổ theo lô cho mọi bảng riêng của em | |
| B5 | Thử tải 50.000 rồi 100.000 em (máy thử 20–40 lát) | |

Luật giữ nguyên: đáp án không xuống máy em trước khi nộp; không xoá hay ghi đè dữ liệu thật; schema chỉ thêm.
