# Bản vẽ Mức làm 6 mức · bảng điểm danh và tờ chiếu «Ai đã sai?» · 22/10/2026

Đây là phần của Code app 2 trong Đợt 2. Đặc tả 7 mục nằm ở `DAC-TA.md`. Chưa sửa `src/`, chưa sửa `server/`. Mọi ảnh đều có nhãn **"Minh hoạ — số giả"**, tên em cũng là tên giả.

## Dựng lại
`node scripts/dung-ban-ve-muc-lam-6-muc-2210.mjs && node scripts/chup-ban-ve-muc-lam-6-muc-2210.mjs`
- Mọi con số trên bản vẽ đều tính từ bảng dữ liệu ở đầu script dựng, không gõ tay.
- Bảng điểm danh nạp thẳng tệp màu thật `src/styles/tokens.css` và chỉ dùng biến `--gvm-*`. Bản 2 dùng 3 nhóm màu có nghĩa, đều là biến đã có: Vội `--gvm-hp`, Có nghĩ `--gvm-xl`, Treo máy `--gvm-ho` có sọc, Cố tình treo máy `--gvm-ho-dam`.
- Tờ chiếu dùng lại nguyên CSS của bản vẽ 21/10 đã duyệt, rồi thêm phần Treo máy bằng màu xám `--m0` có sọc, đều là màu đã có của tờ.

## Ảnh
**Bảng điểm danh** có 3 khổ: `doc` 390×844, `ngang` 844×390, `may-tinh` 1440×900. Mỗi khổ có ảnh `sang` và ảnh `toi`, chụp toàn trang.

| Khung | Tệp | Lúc nào |
|---|---|---|
| 01 | `anh/01-diem-danh-6-muc-*` | Sau khi Đợt 1 lên bản thật (bản 2, theo góp ý của Boss): dòng tổng có 4 nút lọc; cột thẳng hàng gồm Em (cờ Cố tình nằm trên tên) · **% Sai vì vội** (số lớn) · thanh 3 nhóm Vội / Có nghĩ / Treo · Treo máy; dưới danh sách là chú thích chung |
| 02 | `anh/02-ngay-dau-chua-do-treo-*` | **Tuần đầu (trạng thái chính):** chưa lượt nào đo treo máy. Dòng tổng ghi "Treo máy: đo từ lượt làm sau 23/10" |
| 03 | `anh/03-loc-treo-may-*` | Thầy bấm "Treo máy": danh sách chỉ còn 6 em có ít nhất 1 lượt treo, gồm cả em cố tình và em chỉ treo 1 lượt (em ấy chưa gắn chip) |
| 04 | `anh/04-dang-do-va-loi-*` | Một dòng đang đo, một dòng không tải được và có nút Thử tải lại. Các dòng khác vẫn đúng |

**Tờ chiếu** chỉ có nền tối, vì tờ chiếu thật luôn nền tối nên không có ảnh sáng. Có 3 khổ máy chiếu: 1920×1080, 1280×720 và 1024×768 (máy 4:3).

| Khung | Tệp | Lúc nào |
|---|---|---|
| 11 | `anh/11-ai-sai-co-treo-may-*` | Có làn "Treo máy". Trên tờ chiếu mọi lượt treo đều hiện là "Treo máy", máy chủ đã hạ Mức 6 trước khi gửi. Hai lượt đánh dấu cố tình trong dữ liệu giả chỉ để thử phép hạ; theo lõi 71520b89, một lượt đơn lẻ không bao giờ là Mức 6 |
| 12 | `anh/12-ai-sai-ca-lop-dong-*` | Lớp đông (27 em sai, khoảng 40 lượt). Tờ tự chọn số cột thẻ tên. Khổ 1024 hiện một thẻ, phím L để chuyển thẻ |
| 13 | `anh/13-ai-sai-chua-do-treo-*` | Tuần đầu: làn Treo máy nét đứt, ghi "Chưa đo" |

**Hiện trạng** nằm ở `hien-trang/`, là màn thật trên main `a9411a5`, chụp bằng bộ chụp của app.
- `diem-danh-*`: ở khổ máy tính, tên em trong "Vừa điểm danh" **bị ép mất**. Đây là lỗi đang có, bản vẽ sửa luôn, xem mục 2a của đặc tả.
- `ai-sai-*`: tờ chiếu hiện tại.
- Lệnh chụp lại:
  - Điểm danh: `npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <tạm> && node scripts/chup-v2/chup.mjs <tạm> <ra> 85-dd12c-muc-lam-may-tinh`. Thao tác `dd12c:*` đã sửa để mở lại bước 1, vì trang Hành trình 4 bước gập bước 1 khi đã có em điểm danh.
  - Tờ chiếu: `scripts/chup-muc-lam-2110/chup-chieu.mjs`.

## Kết quả soát bằng máy (33 ảnh bản vẽ)
0 lỗi trang · 0 tràn ngang · 0 ô chồng nhau trong dòng em · 0 đích chạm < 44 px · 0 chữ < 12 px · 0 tương phản < 4,5:1 · 0 thẻ chiếu bị cắt · 0 tên "…" · 0 chữ "Cố tình" trên tờ chiếu.

Nhãn viền đứt "Giữ nguyên / Đổi / Đổi chỗ" chỉ để thầy đọc bản vẽ, app không có các nhãn này.

## Ảnh MÀN THẬT sau khi build (thầy duyệt 22/10) — `anh-that/`
Chụp bằng component thật và máy chủ giả. Số và tên em trong ảnh là số giả.
- **Điểm danh:** `npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <tạm> && node scripts/chup-v2/chup.mjs <tạm> docs/ban-ve-muc-lam-6-muc-2210/anh-that 85-dd12c-muc-lam-may-tinh,…`.
  - `85-…`: có số, 3 khổ (`may-tinh` 1440 · `ngang` 844 · `dien-thoai` 390) × sáng/tối.
  - `86-…`: những ngày đầu, chưa đo treo máy.
  - `87-…`: đang lọc «Treo máy».
  - `88-…`: lệnh lô hỏng (bản vẽ khung 04), có lý do thật và nút «Thử tải lại», 3 khổ × sáng/tối. Ảnh chụp với `&mlo=loi`.
- **Tờ chiếu:** `npx vite build --config scripts/chup-muc-lam-2110/vite.config.mjs --outDir <tạm> && node scripts/chup-muc-lam-2110/chup-chieu.mjs <tạm> docs/ban-ve-muc-lam-6-muc-2210/anh-that`. Gồm 6 cảnh: `ai-sai`, `ai-sai-dong-em`, `ai-sai-ngay-dau`, `ai-sai-chua-diem-danh`, `chi-tiet-em`, `chi-tiet-em-chua-do`. Mỗi cảnh chụp ở 1920, 1280 và 1024.
- **Soát:** 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px · 0 thẻ chiếu bị cắt · 0 tên bị cắt. Lớp đông ở khổ 1280 không còn tên nào bị "…"; bản đang chạy trên app còn 7 tên.
- **Hai chỗ khác bản vẽ, đều có lý do:**
  1. Phím chuyển thẻ trên máy chiếu 4:3 là **S**, không phải L. Phím L của tờ chiếu đã dùng cho lệnh "gọi lên bảng".
  2. Ô "những ngày đầu" ghi «Treo máy: đo từ các lượt làm mới, lượt cũ chưa đo» thay cho một ngày cụ thể. App không biết chắc ngày phát hành, nên không đoán ngày.
