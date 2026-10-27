# ĐĐH Rounded (tên kĩ thuật: DDH Rounded)

Phông riêng của app học sinh (thầy chốt 27/10/2026: «tự tạo font riêng», đẹp như chữ Duolingo).

**ĐĐH Rounded dẫn xuất từ M PLUS Rounded 1c (SIL Open Font License 1.1), © 2016 The Rounded M+ Project Authors.**
Phông gốc không có Reserved Font Name; bản sửa đổi vẫn đổi tên theo tinh thần OFL. Bản sửa đổi phát hành dưới cùng giấy phép OFL 1.1 (`OFL.txt`).
Không dùng, không chép đường nét của phông Duolingo (Feather, DIN Next Rounded).

| Tệp | Kiểu | Dùng cho |
| --- | --- | --- |
| `ddh-rounded-de-{latin,vietnamese}.woff2` | Đề (gốc Medium 500, `font-weight: 100 599`) | chữ đề, phương án, chữ thân |
| `ddh-rounded-nhan-{latin,vietnamese}.woff2` | Nhấn (gốc Bold 700, `font-weight: 600 749`) | chữ chạm được (tô màu), nhãn đậm vừa |
| `ddh-rounded-dam-{latin,vietnamese}.woff2` | Đậm (gốc Black 900, `font-weight: 750 1000`) | tiêu đề, nút, số |

Sửa so với gốc: Đề / Nhấn rộng ×1,03, khoảng chữ +1,2 %, «l» có đuôi, «1» có chân; Đậm hẹp ×0,96, khoảng chữ −1,5 %, «l» có đuôi qua `ss01`;
cả ba: chữ thường cao +3 %, chỉ số dưới hạ dưới chân dòng, mũi tên → ← ↑ ↓ ⇄ ⇌ vẽ lại đầu tròn; bỏ hinting, kí tự hiếm và cặp kern < 0,022 em; chia mảnh latin / vietnamese.

Tạo lại: `python3 scripts/tao-phong-ddh-rounded.py <thư mục TTF gốc> src/styles/phong-ddh` (cần fonttools, brotli, skia-pathops;
TTF gốc: github.com/google/fonts, `ofl/mplusrounded1c/MPLUSRounded1c-Medium.ttf`, `-Bold.ttf`, `-Black.ttf`). Khai báo `@font-face`: `src/styles/trong-hs.css`.
