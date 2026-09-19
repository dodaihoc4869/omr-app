# Bộ logo ĐỖ ĐẠI HỌC — thầy CHỐT 19/09/2026 ("Chốt logo quá đẹp")

Bản vẽ: `ban-ve-da-chot.jpg`. Mã sinh: `sinh-logo.py` (chạy `python3 sinh-logo.py` → thư mục `out/` + `board.html`).

| Tệp | Dùng cho |
|---|---|
| `logo-{gv,hs,ph}.svg` | Logo thường (nền trong suốt ngoài hình khối) — trong app ở cỡ > 40 px, màn đăng nhập, trang cài app |
| `logo-{gv,hs,ph}-nho.svg` | Bản NÉT ĐẬM, bỏ chi tiết phụ — cỡ ≤ 40 px (thanh trên, favicon, thông báo) |
| `logo-{gv,hs,ph}-day.svg` | Bản TRÀN NỀN (nền đậm kín ô vuông, hình khối nằm trong vùng an toàn 80%) — icon cài máy: apple-touch-icon, maskable 512, PNG 192/512 của manifest |
| `logo-don-sac.svg` | Chữ A một màu — in ấn, phiếu, chỗ cần đơn sắc |

Dấu hiệu từng app: Giáo viên = vuông bo, xanh dương chủ đạo, quỹ đạo electron · Học sinh = bánh quy 12 múi, xanh lá, sao tiến bộ, gạch rời vàng · Phụ huynh = ngôi nhà bo góc, cam ấm, hai chấm lớn–nhỏ.
Chữ đi kèm (thanh trên, màn đăng nhập): "ĐỖ ĐẠI HỌC" đậm + nhãn vai trò dạng viên thuốc + dòng `6,022 · 10²³` chữ nghiêng có chân (Didot, 'Bodoni 72', Georgia, serif). KHÔNG nhét con số vào icon.
Luật: logo trong app là tệp SVG tĩnh ở `public/` dùng qua `<img>` (không nhúng hex vào TSX — `check:mau`); PNG các cỡ sinh TỪ SVG bằng script trong `scripts/`; đổi tên tệp (`-v3`) để phá cache service worker; màn thi thật chỉ đổi đúng thẻ logo.
