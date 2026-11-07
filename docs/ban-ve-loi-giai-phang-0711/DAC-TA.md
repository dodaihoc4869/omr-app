# Lời giải Kính PHẲNG — bản vẽ chờ thầy duyệt (07/11)

Thầy 07/11: «Lời giải kính điều chỉnh lại cỡ chữ mọi thứ giống với app hs đã điều chỉnh, vẽ lại giao diện phẳng siêu đẹp vẽ cho tôi xem».

| Ảnh | Nội dung |
|---|---|
| `01-dien-thoai-toi.jpg` | 360×740 tối: TRƯỚC (kính) / SAU (phẳng). Ba chỗ cuộn: đầu, giữa, cuối. |
| `02-dien-thoai-sang.jpg` | Như trên, chế độ sáng. |
| `03-may-tinh.jpg` | 1280×800, tối và sáng, trước / sau. Tấm lời giải nằm bên phải. |
| `04-can-canh-toi.jpg` | Cận cảnh bản SAU tối, đủ to để đọc chữ. |
| `proto-loi-giai.css` | CSS bản thử. |

Các ảnh chụp trên Chromium, bản build `dist-phang` (app phẳng, nền xanh than). Phông DDH Rounded đã nạp sẵn, đúng như máy em đã từng mở app. Câu sai mẫu là B, đáp án A. Dùng bản Kính mẫu 1 (`scripts/loi-giai-kinh/vi-du-kinh.json`).

## 1. Mục tiêu
Lời giải Kính cùng một ngôn ngữ với app HS phẳng vừa chốt: phẳng, gọn, cỡ chữ như màn làm câu. Nội dung lời giải giữ nguyên.

## 2. Người dùng / bối cảnh
Học sinh, ngay sau khi bấm «Kiểm tra» rồi bấm «Lời giải», trên điện thoại dọc, máy tính và máy tính bảng, sáng và tối.

## 3. Bố cục
- **Tấm lời giải:** không đổi chỗ. Điện thoại là tấm trượt từ dưới lên; máy tính là cột bên phải.
- **Thanh đầu:** đặc, một vạch mảnh dưới. Bên trái «Lời giải · Câu N» 16/800. Bên phải «Lời giải thu gọn» và nút ×, cả hai là viên đặc.
- **Thứ tự thẻ:** giữ nguyên.

## 4. Thành phần và trạng thái
- **Thẻ:** mặt `--tr-mat` đặc, không viền, không bóng, không làm mờ phía sau. Bo 20, đệm 16, các thẻ cách nhau 12.
- **Nhãn mục:** 13/700 chữ in hoa, màu `--tr-chu-3`. Nhãn sai màu `--tr-sai-chu`.
- **Kết quả em:** dải tô nhạt (sai hồng nhạt, đúng lục nhạt), không vòng. Biểu tượng tròn 36.
- **Kiến thức cốt lõi:**
  - Công thức 28–34 px, trước là 34–46 px.
  - Câu chốt 17/700, trước là 22/800.
  - Chip là viên xám `--tr-mat-2`, bo 10, chữ 14/600.
- **Thầy dẫn từng bước:**
  - Ô hình 52 px, bo 16.
  - Số bước là vòng tròn nhỏ tô nhạt: nền `--tr-mat`, chữ `--tr-hs-chu`, viền `--tr-hs-nhat`.
  - Chữ bước 16/600, cao dòng 1,5.
- **Nút phụ (Dừng, Xem câu trả lời, phép thử):** tô xám `--tr-mat-2`, bo 12, chữ 15/700 màu `--tr-hs-chu`. Khi chọn, nền `--tr-hs-nut`.
- **Vì sao chọn · vì sao không:**
  - Hàng tô nhạt: đúng là lục nhạt, em chọn sai là hồng nhạt, còn lại xám. Không vòng.
  - Ô chữ cái 32; ô đúng / sai giữ màu đặc.
  - Chữ 15–16, cao dòng 1,5.
- **Chỗ hay nhầm, Em tự trả lời, Thẻ nhớ:** bo 16, nền tô nhạt phẳng. Câu trả lời thẻ nhớ 19 px. Bỏ dải chuyển màu và bóng của thẻ lật.
- **Khối tính / sơ đồ** (sơ đồ chất, phương trình, chuyển dịch cân bằng, ống nghiệm): mặt phụ `--tr-mat-2`, bo 16, không vòng.
- **«Hỏi thầy» trong tấm:** nút phụ tô xám.

## 5. Màu
Chỉ biến có sẵn: `--tr-nen`, `--tr-mat`, `--tr-mat-2`, `--tr-mat-3`, `--tr-chu*`, `--tr-hs-*`, `--tr-dung-*`, `--tr-sai-*`. Bỏ dải loang bốn màu sau tấm lời giải. Tối và sáng tự đổi theo token (nền tối xanh than).

## 6. Hiệu năng
- **Nhẹ hơn:** bỏ toàn bộ `backdrop-filter` (blur 26 px), các bóng nhiều lớp và dải loang radial phía sau tấm.
- **Không thêm:** hoạt ảnh hay ảnh mới.
- **Máy yếu:** nhận đúng bản phẳng này, không có nhánh riêng.

## 7. Nghiệm thu khi build
- Chuyển luật vào `src/components/loi-giai-kinh/loi-giai-kinh.css`: đổi tại chỗ các biến `--lgk-*` và luật thẻ, không đè bằng `:not(#_)`. Cổng `kiem:co-tep` tính từ mốc của tệp đó.
- Các cổng phải xanh: `check:mau`, `kiem:mau-giu` (ngoại lệ ghi vào `docs/ban-ve-nut-net-0711/mau-doi-duyet.json`), `kiem:toc-do`, `kiem-sw`.
- Các test cũng phải xanh: `tests/loi-giai-kinh-*.test.*` và `tests/kinh-chieu-0311.test.ts`.
- Chụp lại 360 / 1280, sáng / tối, so với bản vẽ này.
