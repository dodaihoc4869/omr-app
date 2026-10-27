# ĐĐH Rounded (tên kĩ thuật: DDH Rounded)

Phông riêng của app học sinh (thầy chốt 27/10/2026: «tự tạo font riêng», đẹp như chữ Duolingo).

**ĐĐH Rounded dẫn xuất từ M PLUS Rounded 1c (SIL Open Font License 1.1), © 2016 The Rounded M+ Project Authors.**
Phông gốc không có Reserved Font Name; bản sửa đổi vẫn đổi tên theo tinh thần OFL. Bản sửa đổi phát hành dưới cùng giấy phép OFL 1.1 (`OFL.txt`).
Không dùng, không chép đường nét của phông Duolingo (Feather, DIN Next Rounded).

| Tệp | Kiểu | Dùng cho |
| --- | --- | --- |
| `ddh-rounded-de-{latin,vietnamese}.woff2` | Đề (gốc Regular 400 làm đậm 3/1000 em, `font-weight: 100 549`) | chữ đề, phương án, chữ thân |
| `ddh-rounded-dam-{latin,vietnamese}.woff2` | Đậm (gốc Bold 700 làm đậm 8/1000 em, `font-weight: 550 1000`) | tiêu đề, nút, nhãn, số, chữ chạm được |

Độ đậm hiệu chỉnh theo số đo trên ảnh Duolingo: tỉ lệ «bề dày nét đứng / chiều cao chữ x» (chữ IN HOA, số: / chiều cao chữ hoa)
Đề 0,157 (Duolingo 0,157), Đậm 0,261 tiêu đề / 0,199 nút IN HOA (Duolingo 0,257 / 0,202). Gốc M+ không nội suy được giữa các độ đậm ⇒
làm đậm bằng dời đường viền đều hai phía.

Sửa khác so với gốc: Đề rộng ×1,03, khoảng chữ +1,2 %, «l» có đuôi, «1» có chân; Đậm hẹp ×0,96, khoảng chữ −1,5 %, «l» có đuôi qua `ss01`;
cả hai: chữ thường cao +3 %, chỉ số dưới hạ dưới chân dòng, mũi tên → ← ↑ ↓ ⇄ ⇌ vẽ lại đầu tròn; bỏ hinting, kí tự hiếm và cặp kern < 0,022 em;
chia mảnh latin / vietnamese.

Tạo lại: `python3 scripts/tao-phong-ddh-rounded.py <thư mục TTF gốc> src/styles/phong-ddh` (cần fonttools, brotli, skia-pathops;
TTF gốc: github.com/google/fonts, `ofl/mplusrounded1c/MPLUSRounded1c-Regular.ttf`, `-Bold.ttf`). Khai báo `@font-face`: `src/styles/trong-hs.css`.
