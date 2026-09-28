# Tối ưu phía app — 28/09 (nhánh `toi-uu-app`, gốc `origin/gop-man-thi` 3fa12fd)

Đo: `vite build --manifest` + bao đóng nhập tĩnh từ `index.html` (và mảnh màn của từng đường vào), gzip -9. Script: `scratchpad/app/do-goi.mjs`.

## Gói đầu từng app (KB gzip)

| Đường vào | Trước | Sau | Ghi chú |
|---|---|---|---|
| `/gv` (màn khoá thầy) | 591 (69 tệp) | **251** (32 tệp) | −58 % |
| `/ph` cổng phụ huynh | 617 | **287** | + KaTeX 90 tải lúc rảnh sau khi trang hiện |
| `/hs` cổng học sinh | 591 | **415** + KaTeX 90 = 505 | KaTeX tải ngay, song song |
| `/t/<mã ca>` màn thi | 591 | **315** + KaTeX 90 = 405 | KaTeX tải ngay, song song |

Theo từng việc (gói vào chung `index.html`): 591 → 540 (html-phieu lười) → 342 (màn thi + cổng HS lười; gom biểu tượng lucide) → 251 (KaTeX lười).

## Precache (dist/sw.js)

| | Trước | Sau |
|---|---|---|
| Mục | 178 | **161** |
| Tệp duy nhất | 164 | 161 (0 trùng) |
| Plugin báo | 2850 KiB | 2687 KiB |
| `kiem-sw` | 13/13 | **13/13** (161/170 tệp, 2868/3000 KB) |

Màn thi, cổng HS, cổng PH, KaTeX (js+css) VẪN trong precache ⇒ mất mạng vẫn mở được màn thi.

## Ảnh game

- 10 ảnh đang dùng (atlas tiến hoá `-cutout` + 8 tia chiêu thức) có bản `.webp` q82: **25,1 MB → 5,3 MB** (−79 %). App đọc WebP, lỗi thì đổi về PNG.
- Xoá 3 ảnh không nơi dùng: 8,3 MB. `public/than-thu-v2/`: 55 MB → 53 MB (+5,3 MB webp, −8,3 MB). Giữ `combat/*.png` (nguồn của `scripts/cat-anh-than-thu.mjs`).

## Mã chết
Xoá 6 tệp; 90 tệp chỉ test dùng: giữ — xem `MA-CHET.md`.

## Kiểm
- `tsc -b` app + `tsc -p server` : sạch. `check:mau`: sạch. `build:cf`: 13/13.
- Toàn bộ vitest (852 tệp): gốc 143 đỏ, sau 132 đỏ; **0 đỏ mới** (2 tên chỉ có ở bản sau chạy riêng: một tệp rỗng sẵn có đỏ ở cả hai, một tệp đỏ do máy tải nặng — chạy riêng xanh).
- Chụp so sánh bản gốc/bản mới (390×844): `/t/123456` vào đề 260 công thức, `/hs`, `/ph`, `/gv` — trùng từng điểm ảnh, trừ ô đồng hồ đếm ngược.

## Còn để ý
- CSS của màn thi/cổng HS nay nạp sau `gv-mau.css` (mảnh riêng). `gv-mau` chỉ tác dụng dưới `.vo-thay` nên không va; ảnh chụp trùng khớp.
- Công thức hiện nguyên văn một nhịp nếu KaTeX chưa về (chỉ ở cổng PH / màn thầy khi mở ngay lúc đầu).
