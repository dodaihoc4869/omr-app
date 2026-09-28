# Bi-a Phản Ứng · trạng thái build GĐ1 (28/09/2026)

**Đã build xong GĐ1, chưa phát hành.** Cờ `bi_a` mặc định TẮT ⇒ đẩy lên cũng chưa em nào thấy cho tới khi thầy bật ở Cài đặt.

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
- Toàn bộ vitest, so theo TÊN test với commit gốc `d3439e8` (worktree sạch): gốc có sẵn 150 test đỏ / 12 235. Bản này lúc đầu 153 đỏ: 150 trùng tên với gốc, 3 mới là test khoá nguồn, đã sửa (tách dòng `useToanManHinhGame(tab === 'bia')`; xếp loại 2 `setInterval` không gọi máy chủ vào `tests/nhip-bang-2109.test.ts` + `SO-VIEC-GIAO-DIEN.md`). Chạy lại 3 tệp đó: 49/49 xanh.
- Chạy thật trong Chromium (máy chủ giả, `xem-thu.html`): đấu đơn 360×780, 390×844, 1280×800; đánh đôi 390×844, 844×390, 1440×900 — mỗi cỡ chơi trọn một ván tới "Kết thúc ván", 0 lỗi JS, không tràn ngang; câu sai ⇒ sang lượt A.I trong < 0,7 s khi tấm lời giải vẫn mở; "Đã đọc lời giải" đóng tấm; nút "Xem lại câu sai" hiện lúc chờ, tự đóng khi tới lượt em; toàn màn hình vào/ra ở 390, 844×390, 1280. Ảnh: `docs/anh-bi-a-2809/`.

## Chỗ làm khác đặc tả (đã ghi vào đặc tả)
1. `bia-xep-ban` trả danh sách câu; máy khách gán cho bi.
2. `bia-doi-cau` nhận `{ session, qidCu, chot }`.
3. Hết giờ mà chưa chọn đủ ⇒ không gửi máy chủ, câu chưa tính, bi giữ câu cũ.
4. Khoá khi có ca: xét ca `mo` của lớp em, không xét phạm vi khối (chặt hơn một chút).
5. Bi của A.I có mức độ giả lập để tính điểm ván (A.I không rút câu thật).

## Việc còn lại (người khác)
- **Code 3**: đẩy Worker từ worktree sạch tại commit của phiên này; chạy `wrangler d1 execute … --remote --file=server/migration-2809-bi-a.sql` (CHỈ THÊM 5 bảng). Kiểm trước: Nhật ký 25/09 ghi Worker sống có thể build từ `omr-hotfix-2409` chứ không phải `omr-app` — đẩy từ `omr-app` có thể ghi đè bản vá của nhánh kia.
- **Code 2**: đẩy Pages.
- **Thầy**: Cài đặt → Bi-a Phản Ứng → Bật theo lớp (thử một lớp trước).

## GĐ2 (chưa làm)
Đấu với bạn · Nhập mã bàn · lời mời · bảng điểm bàn (bảng đã dựng sẵn).
