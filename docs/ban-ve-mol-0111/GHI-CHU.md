# Mol — linh vật mới (bản vẽ chờ thầy duyệt, 01/11/2026)

Thầy 01/11: «Vẽ lại linh vật chỉ có mặt giống Duolingo, 2 mắt to, đơn giản đẹp tinh tế như Duolingo. Mặt kết hợp của Doraemon và hoá học, lấy màu xanh dương chủ đạo
của app và màu cam. Vẽ cho tôi duyệt trước khi build. Đặt tên linh vật là Mol.»

Bản vẽ: `mol.html` (SVG thuần, mở bằng trình duyệt), ảnh Chromium ở `anh/` (máy tính / điện thoại × sáng / tối, `mol-ba-phuong-an.png`).
Chụp lại: `node docs/ban-ve-mol-0111/chup.cjs`.

## Thiết kế
- **Chỉ có mặt:** đầu tròn xanh app `#2563EB`, mặt trắng, hai mắt to sát nhau (kiểu Duolingo), mũi tròn cam `#F59E0B`, miệng cười lưỡi cam.
  - Nét phẳng, không viền dày, không đổ bóng.
  - Một vệt sáng nhẹ trên đầu.
- **Ba phương án** (khác nhau ở «chất hoá học» trên đầu) — thầy chọn một:
  - **A · Mol Nguyên tử** (em đề xuất): vòng quỹ đạo cam quanh đỉnh đầu có một electron. Ria là các liên kết hoá học (vạch + chấm nguyên tử).
  - **B · Mol Bình cầu:** đầu là bình cầu thí nghiệm có cổ bình; dung dịch cam ở cằm, bọt khí.
  - **C · Mol Phân tử:** hai «tai» là hai nguyên tử cam nối liên kết vào đầu, dáng H₂O.
- **Bảy cảm xúc** (chỉ đổi mắt, miệng, vài nét nhỏ):
  - Vui (mặc định), Khen (đúng / chuỗi), Chào (mở app), Nghĩ (gợi ý);
  - Ngạc nhiên (kỷ lục), Buồn (khi sai), Ngủ (lâu không học).
- **Cỡ nhỏ:** 28 / 40 / 64 px và biểu tượng app vẫn rõ trên nền sáng và tối.
- **Bản quyền:** Mol là hình VẼ MỚI. Chỉ gợi tinh thần Doraemon (đầu tròn xanh, mặt trắng); không có chuông, vòng cổ, mũi đỏ hay ria mèo của Doraemon. Ria của Mol là liên kết hoá học. App dùng tự do, không vướng bản quyền.

## Khi build (sau khi thầy chốt phương án)
- **Thay linh vật «Lửa» (cú ngọc) ở mọi chỗ của app học sinh:**
  - giữ nguyên API `<Bi cam size …>` nên chỗ gọi không đổi;
  - tên trên màn đổi thành «Mol» (`TEN_LINH_VAT`).
- **Map cảm xúc cũ ⇒ Mol:**

  | Cảm xúc cũ | Mol |
  |---|---|
  | chào | Chào |
  | vui | Vui |
  | nghĩ | Nghĩ |
  | sai | Buồn |
  | mừng | Khen |
  | ngủ | Ngủ |
  | lửa (chuỗi ngày) | Khen |

  - Bộ «Lửa đổi cảm xúc 6 cấp» (31/10) cần thêm 3 mặt Mol: dỗi · bực · giận. Em sẽ vẽ thêm khi build, cùng khuôn.
- **Hình và chuyển động:**
  - Mol là SVG nội tuyến nhỏ (vài KB), không tải ảnh;
  - chuyển động nhẹ: chớp mắt, electron chạy vòng, nảy khi khen;
  - tắt chuyển động khi máy yếu hoặc khi giảm chuyển động.
- **Tốc độ:** app học sinh nhẹ đi vì bỏ mảnh vẽ cú ngọc. Cổng `kiem-toc-do-tai` 0 đỏ, `kiem:mau-giu` 0 (thêm màu Mol vào tokens nếu cần).
- **Test:** đổi tên linh vật, đủ 7 cảm xúc + 3 cấp giận, đứng tĩnh khi máy yếu, không vỡ bố cục chỗ đặt cũ.

## Đã build (01/11, thầy «Chọn mol bình cầu, thêm cả cáu rất cáu nữa nhé»)
- Hình: `src/components/linh-vat/mol-dong.ts` (11 mặt: vui · khen · chào · nghĩ · ngạc nhiên · buồn · ngủ · 2 dỗi · 3 bực · 4 cáu · 5 rất cáu), màu + chuyển động `src/styles/mol.css` (chỉ token có sẵn).
- Giận = dung dịch trong bình hoá đỏ, dâng lên và sôi: cáu tới miệng, răng nghiến; rất cáu sát mắt, miệng há răng cưa, hơi nước phụt khỏi cổ bình, run. Đầu vẫn xanh của app.
- Biểu tượng tab cấp 4–5 chụp từ chính Mol (`datIconTabMol`).
- Chữ trên màn: «Mol vui lắm», «Mol bực / giận / cáu lắm rồi!», «Cùng Mol ôn lại nhé!». Giữ «Lửa đôi» và ngọn lửa chuỗi ngày.
- Ảnh thật (Chromium, token thật, sáng / tối): `anh/mol-that-11-mat-sang.jpg`, `anh/mol-that-11-mat-toi.jpg` (hàng dưới: biểu tượng tab cấp 4, 5).
- Tốc độ: app học sinh nhẹ đi 2,9 KB nén (232,1 so với 235,0 KB); mỗi mặt 26–46 nút SVG (cú ngọc ~120). Mốc `docs/moc-toc-do.json` hạ theo.
- Hình cú ngọc (`lua-dong.ts`, `lua-gian.ts`) giữ lại làm kiểu `Lua` + đường lùi; không còn được nạp.
