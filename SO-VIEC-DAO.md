# SỔ VIỆC — ĐẢO THẦN THÚ bản mới (phiên Code 6 · đề bài `prompt-dao-than-thu-moi.md`)

Worktree `busy-austin-a4ab8b`, nhánh `claude/confident-dhawan-e9fbb6` (Boss gộp). Làn: `src/game/than-thu-v2/dao/**`, `scripts/cat-anh-than-thu.mjs`, `public/than-thu-v2/nho/**`, `tests/dao-*`, `docs/anh-dao-than-thu-2109/`, `docs/hop-dong-dao-than-thu-prop-2109.md`, tệp này. KHÔNG sửa `Game.tsx` (Code 5 nối theo hợp đồng prop).

## Bảng việc
| # | Việc | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Script cắt ảnh nhẹ + ảnh `nho/` | XONG | `f9e7547` · `tests/dao-anh-nho.test.ts` 5/5 · `--kiem` khớp từng byte |
| 2 | Màn Chọn bạn đồng hành | XONG | commit màn 1 · `tests/dao-chon-ban-dong-hanh.test.tsx` 8/8 · ảnh `docs/anh-dao-than-thu-2109/1-*` |
| 3 | Hòn đảo của em + vỏ `DaoThanThu` + thanh dưới + Túi đồ | chưa | |
| 4 | Chuyến thám hiểm 6 ải | chưa | |
| 5 | Sổ tay dạng bài | chưa | |
| 6 | Hợp đồng prop cho Code 5 | bản đầu đã gửi | `docs/hop-dong-dao-than-thu-prop-2109.md` |
| 7 | Nghiệm thu 6 điều (đo ảnh ≤ 400 KB bằng Chromium, 360×740, console sạch, so tên vitest) | chưa | |

## 21/09 · Mục 1 — ảnh nhẹ
- `node scripts/cat-anh-than-thu.mjs` (ghi) · `--kiem` (so byte) · `--xem <tệp.jpg>` (tờ soát mắt). Công cụ: Chromium của Playwright, không thêm phụ thuộc.
- Ra 112 tệp WebP, tổng 3,0 MB: 48 `thu-<thú>-<dạng>.webp` 288 px (nặng nhất 54 KB), 48 `…-be.webp` 96 px (≤ 11 KB), 16 `the-<thú>-{binh-thuong,cuong-no}.webp` 512 px (nặng nhất 87 KB).
- Ô tiến hoá: KHÔNG phóng/thu (giữ tương quan lớn dần), căn giữa theo hộp bao alpha, chân chạm đáy; ô Thạch Quy dạng 3 lật sẵn. Bảng toạ độ chép từ `evolution.ts`, test so đủ 48 ô.
- Thẻ tranh: né tên hệ (Ái Hồ chữ "TÌNH YÊU" thấp hơn ⇒ y=208), lùi khung Tinh Lang/Minh Linh khỏi vạch chia lệch, tô đè dải chữ trang trí ở mép tấm Minh Linh.
- CÓ THỂ BỎ SAU (chưa xoá; màn cũ/màn chiếu/Đoàn còn dùng — chỉ xoá khi grep không còn ai nạp): `public/than-thu-v2/combat/0..7.png` (19 MB, chưa màn nào nạp — nay đã có thẻ nhẹ), `bat-linh.png` (3 MB, không ai nạp), `evolution-elements.png` + `evolution-virtues.png` (5,4 MB bản CHƯA tách nền), `evolution-*-cutout.png` (6 MB — `Spirit2D` còn nạp; bỏ được khi `Spirit2D` chuyển sang `dao/anh.ts`). Mã chết: `Spirit3D.tsx`, `spirit-model.ts`, mode `tower`.
- Service worker: `vite.config.ts` đã `globIgnores: **/than-thu-v2/**` ⇒ ảnh mới KHÔNG vào precache.

## 21/09 · Màn 1 — Chọn bạn đồng hành (`dao/ChonBanDongHanh.tsx`, `dao/dao.css`, `dao/anh.ts`)
- Băng chuyền cuộn-bám gốc trình duyệt (không thư viện), thẻ giữa sáng viền màu hệ, hai thẻ kề nghiêng ±9°; chạm thẻ giữa = lật 3D xem CUỒNG NỘ (tranh Cuồng nộ chỉ nạp lúc lật); chạm thẻ bên/chấm = trượt tới. MỘT chạm nút vàng = chọn.
- Lần mở đầu chỉ nạp 3 thẻ: đo Chromium 390×844 = 143 KB ảnh (trần 400 KB). 360×740 không cuộn. Console 0 lỗi.
- Tên: chuẩn hoá bằng `normalizePetName` TRƯỚC khi gọi `choose` (tên sai ⇒ báo tại chỗ, chưa chọn); nút gợi ý xoay vòng 4 tên/thú.
- QUYẾT ĐỊNH ĐÃ DÙNG (báo Boss): (a) bản vẽ ghi "đổi thần thú sau vẫn giữ cấp" nhưng máy chủ chỉ cho `choose` MỘT lần ⇒ đổi câu thành "tên thì đổi lại lúc nào cũng được", có test chặn chữ "đổi thần thú"; (b) thẻ mở đầu theo SBD (`theMoDau`, 1..6) để cả lớp không dồn vào Viêm Sư vì nút vàng một chạm; (c) giảm chuyển động ⇒ không xoay 3D, đổi tranh tức thì.
- BẪY CSS: `game.css` có `.spirit-game button:hover:not(:disabled){background;transform;box-shadow}` (0,3,1), hover dính sau chạm ⇒ mọi nút của đảo đặt nền/chữ/bóng/dịch chuyển qua biến `--nut-*`, luật nút viết `.dao button.<lớp>`.
- Xem thử: `npm run dev` → `/src/game/than-thu-v2/dao/xem-thu.html?man=chon[&dau=2][&doan][&loi=…]` (trang dev, không vào build).
