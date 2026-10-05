# App học sinh giữ nguyên giao diện — so điểm ảnh (05/10)

Thầy: "app của học sinh giữ nguyên mọi thứ giao diện, hình nền màu nhé" (kèm ảnh Sảnh bản đang chạy).

**Cách đo.** Bản build THẬT của app (không phải trang chụp thử): main `c74100ef` (bản đang chạy) và nhánh OMNI 3 (sau khi hoàn nguyên hai
chỉnh màu/chữ của điều phối ở Đảo). Chromium, khổ 360×740 ×2, máy chủ giả của `scripts/do-app-hs.mjs` (không dữ liệu thật), cùng một giờ
đóng băng (`page.clock.setFixedTime 2026-09-30T03:00Z`), tắt hoạt ảnh CHỈ lúc bấm chụp. So từng điểm ảnh bằng canvas của Chromium.
Phép so tự thử: đưa hai màn khác nhau ⇒ 770 127 điểm khác (máy bắt được).

## OMNI tắt (giống bản đang chạy của mọi lớp hôm nay)

| Màn | Điểm ảnh | Khác |
|---|---:|---:|
| Đăng nhập | 1 065 600 | **0** |
| Sảnh (tranh nền đảo, thần thú, khung đầu) | 1 065 600 | **0** |
| Đảo · bản đồ | 1 065 600 | **0** |
| Đảo · trận (đề + 4 phương án) | 1 065 600 | **0** |
| Đảo · đã chọn đáp án | 1 065 600 | **0** |
| Đảo · lời giải + nút Hỏi thầy | 1 065 600 | **0** |
| Câu đã làm | 1 065 600 | **0** |
| Đoàn Hộ Tống · trận | 1 065 600 | **0** |
| Tu luyện | 1 065 600 | **0** |

## OMNI bật (máy chủ giả trả thêm phần `omni`)

| Màn | Kết quả |
|---|---|
| Đảo · trận | Khác đúng một vùng x 176–449, y 1208–1295 = chip **"Chưa chắc"** mới thêm; tranh nền, thẻ câu, màu trùng khít (`that-dao-omni-bat-vung-khac-360.jpg`, vùng đỏ) |
| Sảnh · phần trên | 16 080 điểm lệch **1/255** (mắt không thấy — nhiễu dựng lớp vì bên dưới có thêm 3 dòng OMNI); không điểm nào lệch quá 1 |

Ảnh: `that-sanh-ban-dang-chay-360.jpg` (main) · `that-sanh-nhanh-omni-tat-360.jpg` (nhánh) · `that-dao-loi-giai-hoi-thay-360.jpg` (nút Hỏi thầy đúng màu đang chạy).

Ảnh Sảnh ở `docs/omni-0510/anh-build/` là TRANG CHỤP THỬ (component rời): trang ấy không dựng được tranh nền đảo nên phần đầu trông vỡ chữ —
không phải app thật. App thật xem `that-sanh-*.jpg` ở thư mục này.
