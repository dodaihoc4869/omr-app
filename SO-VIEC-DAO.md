# SỔ VIỆC — ĐẢO THẦN THÚ bản mới (phiên Code 6 · đề bài `prompt-dao-than-thu-moi.md`)

Worktree `busy-austin-a4ab8b`, nhánh `claude/confident-dhawan-e9fbb6` (Boss gộp). Làn: `src/game/than-thu-v2/dao/**`, `scripts/cat-anh-than-thu.mjs`, `public/than-thu-v2/nho/**`, `tests/dao-*`, `docs/anh-dao-than-thu-2109/`, `docs/hop-dong-dao-than-thu-prop-2109.md`, tệp này. KHÔNG sửa `Game.tsx` (Code 5 nối theo hợp đồng prop).

## Bảng việc
| # | Việc | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Script cắt ảnh nhẹ + ảnh `nho/` | XONG | `f9e7547` · `tests/dao-anh-nho.test.ts` 5/5 · `--kiem` khớp từng byte |
| 2 | Màn Chọn bạn đồng hành | XONG | commit màn 1 · `tests/dao-chon-ban-dong-hanh.test.tsx` 8/8 · ảnh `docs/anh-dao-than-thu-2109/1-*` |
| 3 | Hòn đảo của em + Túi đồ + lõi `dao-core` (vỏ `DaoThanThu` + thanh dưới: commit nối cuối) | XONG phần màn | commit màn 2 · `tests/dao-cua-em.test.tsx` 13/13 · ảnh `2-*` |
| 4 | Chuyến thám hiểm 6 ải | XONG phần màn | commit màn 3 · `tests/dao-tham-hiem.test.tsx` 8/8 · ảnh `3-*` |
| 5 | Sổ tay dạng bài | XONG phần màn | commit màn 4 · `tests/dao-so-tay.test.tsx` 5/5 · ảnh `4-so-tay-390.jpg` |
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

## 21/09 · Màn 2 — Hòn đảo của em (`dao/DaoCuaEm.tsx`, `dao/TuiDo.tsx`, `dao/dao-core.ts`, `dao/kieu.ts`)
- Thú thật (ảnh nhẹ đúng dạng tiến hoá của cấp) + vòng EXP = `profile.exp / thanhExp(cap)` + "còn N EXP lên cấp". Đo Chromium 390: ảnh nạp lần đầu 51 KB (1 ảnh thú + 3 ảnh bé).
- MỘT thẻ "Chuyến thám hiểm hôm nay": 4 nhóm ải 2·1·2·1 (`NHOM_AI` = suất của `chooseSession`, test khoá); dòng mô tả in TÊN DẠNG thật từ lệnh `recommendations` (vắng thì nói công thức bằng lời học sinh); hết 200 câu ⇒ khoá nút. MỘT nút LÊN ĐƯỜNG.
- 3 mục tiêu gần nhất từ hồ sơ thật: lên cấp · dạng nhiều sao nhất dưới 3 · rèn khiên (`exp.manhKhien` → không có thì `profile.khienRen` → vẫn không có thì thay bằng mốc tiến hoá kế, KHÔNG bịa).
- Đường tiến hoá 6 dạng (ảnh bé 96 px, dạng chưa tới "?"). Chip chuỗi ngày / EXP hôm nay chỉ hiện khi có prop (Code 5 xác nhận cây Game hiện chưa có hai số này).
- Túi đồ: dùng NGUYÊN `ImmortalShield` (giữ tác dụng + màn 10 giây, cùng lệnh `shield-use`), mặc lại vỏ nền tối; mảnh khiên; "Trang phục · SẮP MỞ" có khoá; lối sang Tiến bộ / Võ đài. GHI CHÚ cho Code 5: `ImmortalShield.tsx` còn 2 emoji trong chữ (ngoài làn em).
- THÊM so với bản vẽ: nút "Nạp N EXP cho <tên>" trên đảo khi `wallet > 0` (lệnh `invest` cũ — bản vẽ không có chỗ nạp, thiếu thì EXP kẹt trong kho); bút đổi tên cạnh tên thú; thẻ "Gia đình nhắc em ôn".
- Xem thử: `?man=dao[&thu=5&cap=72&vi=300&khongexp&khongchuoi&khongkhien&nhac&het]`, `?man=tui`.

## 21/09 · Sửa lỗi test chập chờn (Boss + Code 5 báo) — `0995bd1`
- Ca "vuốt sang thẻ khác" đợi `requestAnimationFrame` + `waitFor` 1 giây theo giờ thật ⇒ đỏ oan khi máy tải nặng. Nay thay rAF bằng hàm chạy ngay trong sự kiện cuộn, không còn chờ đồng hồ. Chạy 3 lượt liền 26/26.

## 21/09 · Màn 3 — Chuyến thám hiểm (`dao/ThamHiem.tsx`: `DaiAi`, `SanDau`, `ThamHiem`)
- Dải ải trên cùng theo `role` máy chủ trả (thiếu `role` — Worker cũ / lệnh resume — coi là "Luyện đều"); ô Trùm ải hình trám vàng.
- Trận: máu hai bên, sát thương, hồi máu, cuồng nộ đều lấy từ `learningBattle()` cũ (test so từng số). 3 đúng liền ⇒ nền đỏ + tia xoay + TRANH cuồng nộ thật (`the-<thú>-cuong-no.webp`, nạp trước khi chuỗi = 2) + "−34" (×2). Thường ngày dùng ảnh thú đúng dạng tiến hoá (36 KB), KHÔNG nạp atlas 3 MB như `Spirit2D`. Giữ tiếng trận (`battle-audio`) + nút tắt tiếng.
- Lý do thưởng: một dòng ngay DƯỚI sân đấu (trên câu hỏi) — luôn trong tầm mắt nên KHÔNG cần tự cuộn; in nguyên `lyDoThuong.chu` của máy chủ, số EXP tách ra huy hiệu; vắng trường thì `lyDoThuongTuKetQua` (cùng câu chữ với `ly-do-thuong.ts` của Code 5; đổi sang import khi tệp đó lên main).
- Bỏ `scrollIntoView` (test đếm 0 lần + quét mã nguồn). Nút "Trả lời · tung chưởng" chỉ NỔI ở đáy khi em đã chọn xong ⇒ chưa chọn thì không che phương án. `.dao` đổi `overflow:hidden` → `clip` (kèm hidden dự phòng) để `position:sticky` chạy.
- 360×740: đáy phần trận + câu trắc nghiệm = 650 px (< 740, không cuộn); thẻ câu dùng chung `TheCau` được nén qua token `--k5/--k3` và ẩn thanh tiêu đề trùng với nhãn ải. Console 0 lỗi ở cả 3 trạng thái.
- Giữ ô "Em có dùng tài liệu hoặc được trợ giúp" (luật chấm `assisted` của máy chủ) và chặn nộp khi hình của câu lỗi.
- Xem thử: `?man=tham&buoc=cau|no|sai|xong[&phan=II]`.

## 21/09 · Màn 4 — Sổ tay dạng bài (`dao/SoTay.tsx`, `soTay()` trong `dao-core.ts`)
- Sao của ô = `mastery[].stage` (20/40/40 = sao 1/2/3); dòng giải thích 3 sao ở đầu trang; nhãn "tới hạn ôn" khi `due ≤ now`.
- Gom theo `chuong` của lệnh đọc-chỉ `POST /game-v2/so-tay` (Code 5 đã viết, mục 4 hợp đồng máy chủ): dạng em ĐƯỢC PHÉP làm mà chưa có trong `mastery[]` ⇒ ô "???" (test chặn lộ tên). Kho không có TÊN chương ⇒ tiêu đề "Nhóm <mã>" (prop `tenChuong` để sau này ai có bảng tên thì truyền vào). Worker cũ chưa có lệnh ⇒ một nhóm "Dạng em đã gặp", tên lấy từ `tenDang` của các câu em làm trong phiên.
- Thẻ "N dạng đang yếu" = dạng đã gặp mà 0 sao (chưa lần nào tự làm đúng); hồ sơ trống sau reset ⇒ lời mời LÊN ĐƯỜNG, không màn trắng.
- Ô "trang phục Hoả Diệm" của bản vẽ ⇒ "Phần thưởng thành thạo trọn chương · SẮP MỞ" có khoá (test chặn chữ trang phục).
- Xem thử: `?man=so-tay[&khongdanhmuc]`.
