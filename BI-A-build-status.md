# Bi-a Phản Ứng · trạng thái build (cập nhật 28/09/2026)

**GĐ1 đã phát hành** (Code app gộp PR #43, deploy #541; cờ `bi_a` đã bật theo lệnh thầy). **GĐ2 đã build, chờ xếp lượt deploy** — xem mục GĐ2 cuối tệp.

## Có gì
| Phần | Tệp chính |
|---|---|
| Máy chủ 4 lệnh `bia-*`, trần 40%, cờ, khoá khi có ca, giao hữu | `server/src/bi-a.ts`, sửa nhỏ `game-v2.ts`, `game-v2-luot.ts`, `srs2-game.ts`, `srs2-gv.ts`, `reset-hoa2.ts`, `reset-toan-app.ts` |
| Bảng mới (chỉ thêm) | `server/migration-2809-bi-a.sql` |
| Lõi game (vật lý, luật đơn/đôi, A.I, Mắt thần, âm thanh) | `src/game/bi-a/*.ts` |
| Giao diện (Sảnh Bi-a, màn chơi, tấm câu, xem lại câu sai, toàn màn hình) | `src/game/bi-a/*.tsx`, `bi-a.css` |
| Cửa trên Sảnh Bát Linh + tab | `src/components/hoa2/SanhBanDo.tsx`, `api.ts`, `src/screens/StudentPortalScreen.tsx` |
| Công tắc thầy | `src/components/chien-dich/CongTacBia.tsx` → Cài đặt |
| Trang thử (chỉ dev) | `src/game/bi-a/xem-thu.html` |
| Hợp đồng API | `docs/hop-dong-bi-a.md` |

## Bằng chứng
- Test Bi-a: 6 tệp, 60 test xanh — `tests/bi-a-{may-chu,vat-ly,luat,man-choi,am-thanh,cua-sanh}.test.*`.
- `tsc` app + máy chủ sạch; `npm run check:mau` sạch; `npm run build` xanh (Bi-a là gói tải lười riêng 84 KB, nén 29 KB).
- Precache PWA: `scripts/kiem-sw.mjs` ĐẠT 13/13 — 146 tệp / 2 901 KB (gốc 146 / 2 899 KB, trần 170 / 3 000). Lần build đầu TRƯỢT (151 tệp / 3 069 KB) vì BiaGame + hai mảnh dùng chung với Đảo 2.0 (`TrongAi`, `ngang`) lọt vào precache ⇒ đã thêm vào `globIgnores` của `vite.config.ts` (tải lúc mở game, cất kho chạy-lúc như các game khác).
- Toàn bộ vitest, so theo TÊN test với commit gốc `d3439e8` (worktree sạch): gốc có sẵn 150 test đỏ / 12 235. Bản này lúc đầu 153 đỏ: 150 trùng tên với gốc, 3 mới là test khoá nguồn, đã sửa (tách dòng `useToanManHinhGame(tab === 'bia')`; xếp loại 2 `setInterval` không gọi máy chủ vào `tests/nhip-bang-2109.test.ts` + `SO-VIEC-GIAO-DIEN.md`). Chạy lại 3 tệp đó: 49/49 xanh.
- Chạy thật trong Chromium (máy chủ giả, `xem-thu.html`): đấu đơn 360×780, 390×844, 1280×800; đánh đôi 390×844, 844×390, 1440×900 — mỗi cỡ chơi trọn một ván tới "Kết thúc ván", 0 lỗi JS, không tràn ngang; câu sai ⇒ sang lượt A.I trong < 0,7 s khi tấm lời giải vẫn mở; "Đã đọc lời giải" đóng tấm; nút "Xem lại câu sai" hiện lúc chờ, tự đóng khi tới lượt em; toàn màn hình vào/ra ở 390, 844×390, 1280. Ảnh: `docs/anh-bi-a-2809/`.

## Chỗ làm khác đặc tả (đã ghi vào đặc tả)
1. `bia-xep-ban` trả danh sách câu; máy khách gán cho bi.
2. `bia-doi-cau` nhận `{ session, qidCu, chot }`.
3. Hết giờ mà chưa chọn đủ ⇒ không gửi máy chủ, câu chưa tính, bi giữ câu cũ.
4. Khoá khi có ca: xét ca `mo` của lớp em, không xét phạm vi khối (chặt hơn một chút).
5. Bi của A.I có mức độ giả lập để tính điểm ván (A.I không rút câu thật).
6. Tên đối thủ máy là "A.I" / "A.I 1–3" (không dùng "A.I Đỗ Đại Học": thầy đã đổi chữ đó thành "Thầy Đỗ Đại Học" bên học sinh).
7. Không có tiếng bi lăn trên nỉ (thầy bỏ 28/09).
8. Bảng `bi_a_*` tự dựng lúc chạy (CI không chạy migration).

## Việc còn lại (người khác)
- **Phát hành**: theo hàng đợi deploy của phiên Code app (CI `deploy.yml` khi gộp main). Bảng `bi_a_*` tự dựng lúc chạy (`CREATE TABLE IF NOT EXISTS`), KHÔNG cần chạy migration tay. Kiểm trước: Nhật ký 25/09 ghi Worker sống có thể build từ `omr-hotfix-2409`.
- Đã gộp `origin/main` (441cc5e) vào nhánh: 3 xung đột thêm song song đã gỡ; precache sau gộp 169 tệp / 2 941 KB (main 169 / 2 940), `build:cf` ĐẠT 13/13.
- **Thầy**: Cài đặt → Bi-a Phản Ứng → Bật theo lớp (thử một lớp trước).

## GĐ2 · Đấu với bạn (lệnh thầy 28/09 "hãy thực thi giai đoạn 2 luôn")
**Đã build + chạy thật trên workerd, chưa phát hành** (chờ Code app xếp lượt deploy: Worker có lớp Durable Object mới `BanBiA`, migration DO `bia-v1`).

| Phần | Tệp |
|---|---|
| Lõi trận dùng chung phòng/máy em (bước chuẩn, luật, băm, Elo) | `src/game/bi-a/tran.ts` |
| Phòng đấu Durable Object (WebSocket Hibernation, alarm, 1 lô D1 khi kết ván, soát mất tín hiệu câm) | `server/src/bi-a-phong.ts`, `server/src/bi-a-ve.ts`, `server/wrangler.toml`, `server/src/index.ts` |
| Lệnh sảnh online (tạo bàn, mã bàn, mời, có mặt, xếp câu theo ghế) | `server/src/bi-a.ts` |
| Máy em: kết nối, ván online, phòng chờ, Sảnh online | `src/game/bi-a/{ket-noi.ts,dieu-khien-mang.ts,BanOnline.tsx,PhongCho.tsx,BiaGame.tsx,ManChoi.tsx,api.ts}` |
| Hợp đồng | `docs/hop-dong-bi-a.md` mục GĐ2 |

### Bằng chứng
- Test Bi-a 13 tệp / 127 test xanh (thêm `bi-a-van-mang` — VanMang thật + phòng thật từng khung 1/60 giây, `bi-a-ket-noi`, `bi-a-ban-online`).
- Chạy thật: `wrangler dev --local` (workerd + DO + D1 cục bộ, dữ liệu mẫu) + 2 Chromium: mời → Nhận (2,9–3,4 giây) → trọn ván 31 cú, lệch băm 0 cả hai máy, băm cuối trùng; S2 mất mạng 10 giây rồi nối lại; kết ván D1 đúng (xong, 2 ghế, đúng/sai khớp số bấm, Elo 976→966 / 1024→1034 khớp tính tay). Vào bàn bằng mã 4 chữ số. Máy câm bị phòng đóng ở giây 70; máy ping đều giữ 150 giây.
- Lỗi lộ ra khi chạy thật/test và đã sửa: (1) đổi máy chủ bàn giữa lúc A.I đang ngắm ⇒ máy đứng hình (3df8f75); (2) cú của em mất cùng kết nối cũ ⇒ đứng "Đang chờ phòng đấu…" (3465263); (3) ping không khớp chuỗi tự trả lời ⇒ phòng không phát hiện mất tín hiệu câm (2261b1e); (4) A.I máy chủ bàn không giải trước khi người khác đang nhắm (3465263).
- `tsc` app + máy chủ sạch; `check:mau` sạch; sau gộp main 7ff811e `build:cf` ĐẠT 13/13 (164 tệp / 2 855 KB); `wrangler deploy --dry-run` thấy binding `BAN_BIA (BanBiA)`.
- Toàn bộ vitest nhánh (2261b1e) vs main (677b1b1), so theo TÊN: 128 đỏ = 128 đỏ, 0 đỏ mới; nhánh có 12 134 test (thêm 41).

### Khác đặc tả
Xếp ghế phòng chờ qua WebSocket (gói `ghe`) thay lệnh HTTP; có mặt gửi kèm số câu còn từ máy em; thêm soát mất tín hiệu câm 70 giây (đặc tả chỉ nói rời > 60 giây).

### Phát hành / lùi
- Code app đẩy Worker như thường (CI `wrangler deploy` tự áp migration DO `bia-v1`). Bảng `bi_a_*` đã tự dựng lúc chạy từ GĐ1.
- Lùi: `git revert` các commit GĐ2; Worker không có binding `BAN_BIA` ⇒ Sảnh tự về nút "Sắp mở".

## Sửa 28/09: câu làm trong Bi-a hiện ở "Câu đã làm"
Gốc: Bi-a/Đoàn phát câu ôn nguồn `ca_sai` (ngoài chiến dịch), `hoa2-cau-da-lam` chỉ liệt kê câu chiến dịch. Sửa 5229bbf (nhóm "Câu sai trong ca kiểm tra" + nguồn từng lần làm). **Đã lên**: PR #52, deploy #550 (main 87ce9bb). Lùi: `git revert 5229bbf`.
