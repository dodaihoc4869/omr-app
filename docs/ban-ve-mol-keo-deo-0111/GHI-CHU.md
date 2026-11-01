# Mol ống nghiệm «kẹo dẻo» — bản vẽ chờ thầy duyệt (01/11/2026)

Bản để thầy so với Mol bình cầu (phiên khác vẽ). Chỉ là bản vẽ: chưa đụng `src/`.

- **Bản vẽ:** `mol-keo-deo.html` (SVG thuần). Mở thường là nền sáng; `?toi` là nền tối; `?lo-trinh&toi` là điện thoại Lộ trình.
- **Chụp lại:** `node docs/ban-ve-mol-keo-deo-0111/chup.cjs`
  - Cần `node_modules` của repo và `/opt/pw-browsers/chromium`.
  - Ảnh `cu-moi` lấy bản cũ thẳng từ nhánh `origin/claude/mol-v2-0111`.

## Ảnh (`anh/`, mỗi ảnh ≤ 150 KB)

| Ảnh | Nội dung |
|---|---|
| `cu-moi.jpg` | Ống nghiệm cũ bị chê · kẹo dẻo mới: vui, khen, buồn, cáu; hàng dưới cỡ 64 px |
| `mau-thu.jpg` | Ba màu đã thử: ngọc lam (chọn), hồng kẹo, chàm app — nền sáng và tối |
| `cam-xuc-sang.jpg`, `cam-xuc-toi.jpg` | 11 mặt đang dùng + 4 phương án (ngượng · mê · vui nhảy · tự tin) |
| `co-nho.jpg` | 28 / 40 / 64 px, ô tròn nửa trên, nền sáng và tối |
| `lo-trinh-toi.jpg` | Lộ trình 390 × 844 nền tối: Mol rất cáu cạnh nút chặng, bong bóng «Cáu lắm rồi! 5 câu liền chưa tính — đọc kĩ đề nhé» |

## Thiết kế
- **Dáng:** khối kẹo dẻo mập, vai bo tròn, hông phình, đáy tròn to. Vành miệng ống sáng, nắp vòm bo tròn.
  - Khung 200 × 230 như `mol-dong.ts` ⇒ khung chứa trong app không đổi.
- **Màu:** một màu chủ đạo + một sắc đậm cùng họ (cánh, nắp, mép bóng phải-dưới) + bụng sáng + một vệt bóng trắng.
  - Cam chỉ dùng cho mũi và chân. Không gradient, không viền đen, không filter.
- **Mặt:** không mặt nạ trắng. Chỉ hai mắt trắng to sát nhau (mỗi mắt ~1/3 bề ngang), vòng sáng mảnh quanh mắt.
  - Con ngươi đen to, hai đốm sáng. Mũi tròn cam nhỏ, miệng nhỏ.
  - Cảm xúc chủ yếu do **mí mắt**: sụp phẳng (dỗi), xếch vào trong (bực / cáu), xệ ra ngoài (buồn), cong vầng trăng (khen / vui nhảy), khép «‿» (ngủ).
- **Cánh:** mập bo tròn, mép dưới 3 khía. Thả, giơ, chống hông, chạm cằm, chắp trước bụng.
- **Chân:** cam, mập, ngắn.
- **Cả thân theo cảm xúc:**
  - Khen / vui nhảy: bật lên, vươn dài, bóng đất thu nhỏ.
  - Buồn / ngủ: lún bẹt, nghiêng.
  - Các mặt thường nghiêng 5–10°.
- **Giận leo thang bằng nắp:** dỗi (2) mí sụp, liếc ngang · bực (3) mày chau, nắp hé xì hơi · cáu (4) · rất cáu (5).
  - Cáu: thân đổi **đỏ sẫm**, tròng hồng đỏ, nắp bung lơ lửng trên lửa.
  - Rất cáu: sẫm hơn, lửa to, nắp bay cao, cánh giơ, vạch rung.
  - Không răng, không gân 💢.
- **Chữ 6,022·10²³:** một dòng nhỏ trên nắp, chỉ hiện khi Mol rộng từ 96 px.
- **Bong bóng lời** trên đầu Mol đổi màu theo cảm xúc. Rất cáu: nền `--tr-sai-day`, chữ trắng.
- **Bản quyền:** không chỏm tai, không mỏ, không lông ngực, không xanh lá Duo. Chỉ học cách dùng mí mắt và đổi sắc khi giận.

## Màu chọn: NGỌC LAM `--tr-tin` (đậm `--tr-tin-day`)
- **Vì sao:**
  - Tươi và trong nhất, đúng chất «kẹo dẻo».
  - Trái màu với cam ⇒ mũi và chân nổi.
  - Đỏ sẫm khi giận đổi hẳn sắc ⇒ đọc cảm xúc ngay.
  - Xa xanh lá Duo, khác xanh Mol bình cầu (`--tr-gv`).
- **Hai màu không chọn:**
  - Hồng `--tr-tim`: gần đỏ giận.
  - Chàm `--tr-hs-nut`: chìm vào nút chặng chàm, gần lối «tím đục» bị chê.

## Token đã dùng
- **Màu Mol:** `--tr-tin`, `--tr-tin-day`, `--tr-chu-y`, `--tr-chu-y-nut`, `--tr-sai`, `--tr-sai-day`, `--tr-sao`, `--tr-tim`, `--tr-tim-day`, `--tr-hs-nut`, `--tr-hs-day`.
- **Trắng / mực cố định:** `--btg-chu-doan-dam` / `--btg-chu-doan`.
- **Màu phụ:** pha bằng `color-mix` từ các token trên.
- **Nền trang và bong bóng:** token `--tr-*` của app học sinh (chép từ `src/styles/trong-hs-mau.css`).

## Khi build (sau khi thầy chọn)
- Thay hình trong `src/components/linh-vat/mol-dong.ts`, giữ nguyên API `<Bi …>`, `MatMol` và `MAT_THEO_CAP`.
- Thêm biến `--k-*` vào `src/styles/mol.css`.
