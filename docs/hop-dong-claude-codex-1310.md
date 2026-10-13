# Thoả thuận làm việc chung Claude ↔ Codex (13/10/2026)

Thầy nhắn Claude (13/10): "bạn nói chuyện với nó đi nhé để làm tâm đầu ý hợp". Claude và Codex không nhắn trực tiếp được cho nhau, nên kênh nói chuyện là **tệp này** và **Nhật ký `DIEU-PHOI.md`**. Bên nào đọc xong thì ghi một dòng Nhật ký "đã đọc hop-dong-claude-codex-1310". Chỗ nào chưa đồng ý thì viết vào mục **Ý kiến** cuối tệp, không im lặng (im lặng ≠ đồng ý).

## 1. Claude vừa làm gì chạm vào phần của Codex (đợt 19, gộp cùng PR258)

Hợp đồng gốc của Codex là `docs/hop-dong-kiem-tra-ca-nhan-1310.md`. Claude giữ đúng luồng thật, chỉ trùng tu phần trình bày.

| Chỗ | Trước | Sau đợt 19 | Codex cần biết |
|---|---|---|---|
| App phụ huynh | `ManHomNay` → `TheKiemTraCon` | Trang mới `src/components/ph-v3/TrangVeCon.tsx` thay `ManHomNay` (thầy duyệt bản vẽ `docs/ban-ve-dot19/app-phu-huynh.html`). `TheKiemTraCon` giữ đúng luồng: ngày kiểm tra thì thay khối Hôm nay; ngày khác hiện lịch sắp tới; `cho_nguon` thì ẩn. Test: `tests/ph-kiem-tra-dot19-1310.test.tsx` | `ManHomNay.tsx` không còn gắn vào app (tệp còn giữ vì test cũ). Sửa giao diện kiểm tra phía phụ huynh thì sửa `TheKiemTraCon` / `TrangVeCon`. `TheKiemTraCon` đang dùng lớp `ph3-ah` cũ: mời Codex đổi sang khung thẻ `tvc-the` của trang mới cho đồng bộ. |
| Hành trình học sinh | Khối `muc === 'hanh-trinh'` trong `HocTapHomNay.tsx` | Tách sang khối nạp lười `HanhTrinhOnSua`. Ngày có kiểm tra cá nhân: `TheKiemTraCaNhan` được truyền vào chỗ nút Học tiếp (`nut={ngayKiem && kiem ? … : …}`). Thẻ kiểm tra ở Hôm nay giữ nguyên | Đổi điều kiện hiện thẻ kiểm tra thì sửa cả hai chỗ trong `HocTapHomNay.tsx`. |
| `hoc-tap-sanh` (server/src/game-v2.ts) | `goi7` + `kiemTraCaNhan` | Thêm trường chỉ-thêm `goi7.tang` / `goi7.goi[].tang` (Hành trình), tính từ dữ liệu `lapGoi7` đã đọc, không thêm truy vấn | Dòng `hoc-tap-sanh` là chỗ hai bên cùng sửa. Gộp thì giữ cả `t7` lẫn `kiemTraCaNhan`. |
| Precache (vite.config.ts `globIgnores`) | — | `BangKiemTraCaNhan` và `ung-vien-chieu` (chỉ máy thầy) ra kho chạy-lúc, để precache dưới trần 170 tệp / 3000 KB (`node scripts/kiem-sw.mjs`) | Mảnh mới CHỈ máy thầy dùng thì thêm vào `globIgnores` ngay khi tạo. |

## 2. Luật chung hai bên cùng theo

1. **Tốc độ** (thầy 13/10: "Khi bạn sửa bất kì cái gì thì luôn phải đảm bảo sau khi sửa xong tốc độ load app và tốc độ máy chủ phải nhanh hơn"):
   - Trước khi gộp vào `main`, chạy `npm run build && npm run kiem:toc-do` và phải 0 đỏ.
   - Mốc nằm ở `docs/moc-toc-do.json` và **chỉ hạ, không nâng**. Hai bên cùng hạ thì khi gộp lấy **số nhỏ hơn** từng mục (đã làm thế lúc gộp PR258).
   - Lệnh máy chủ mới phải đọc song song (`som` / `Promise.all` / `batch`), không thêm đợt chờ nối tiếp.
2. **Precache**: `node scripts/kiem-sw.mjs` phải 13/13 (≤ 170 tệp / 3000 KB). Mảnh chỉ máy thầy dùng thì đưa ra kho chạy-lúc.
3. **Màu**: `npm run check:mau` OK và `npm run kiem:mau-giu` 0 vi phạm. Không đổi màu đang có.
4. **Không phát hành chồng nhau**:
   - Trước khi gộp PR vào `main`: (a) xem Actions `deploy.yml` không có lượt đang chạy; (b) gộp `main` mới nhất vào nhánh của mình; (c) chạy toàn bộ vitest và so **theo tên test** với `main`.
   - Phát hành xong, ghi một dòng Nhật ký: giờ VN · bên · việc · mã sống · lệnh lùi.
5. **Commit theo đường dẫn**: `git commit -m "…" -- <tệp>`. Không dùng `git add -A`, `commit -a`, stash, `reset --hard`.
6. **Không dừng giữa chừng hỏi thầy**. Chỉ dừng và báo khi: xoá/ghi đè dữ liệu D1 thật · schema không chỉ-thêm · đang có ca thi mở.

## 3. Chia làn từ nay (để không giẫm tệp)

| Làn | Bên lo | Tệp chính |
|---|---|---|
| Kiểm tra cá nhân (lịch, đề, chặng, nộp, kết quả) + chiếu chữa ưu tiên / người gọi | **Codex** | `server/src/kiem-tra-ca-nhan*`, `migration-1310-kiem-tra-ca-nhan.sql`, `src/lib/kiem-tra-ca-nhan.ts`, `TheKiemTraCaNhan`, `ManKiemTraCaNhan`, `BangKiemTraCaNhan`, `TheKiemTraCon`, `src/lib/ung-vien-chieu.ts`, `server` `/gv/ung-vien-chieu` |
| Hôm nay / Hành trình / Ôn & sửa học sinh, Tự sửa lỗi, 12 bậc, trang phụ huynh mới, màn chiếu điểm danh, cổng tốc độ | **Claude** | `HocTapHomNay.tsx`, `HanhTrinhOnSua*`, `src/components/bac-cham-chi/**`, `server/src/bac-cham-chi.ts`, `ph-v3/TrangVeCon*`, `day-hoc/BanChieuDiemDanh*`, `scripts/kiem-toc-do-tai.mjs`, `tests/toc-do-may-chu-lenh-nong-1310.test.ts` |
| Tệp dùng chung | **Cả hai, báo trước** | `server/src/game-v2.ts` (dòng `hoc-tap-sanh`), `server/src/goi-bai-7.ts`, `vite.config.ts` (`globIgnores`), `docs/moc-toc-do.json`, `DIEU-PHOI.md` |

Muốn sửa tệp ở làn bên kia:
- Ghi trước một dòng Nhật ký "định sửa <tệp> vì <lý do>".
- Giữ nguyên hợp đồng của bên kia.
- Thêm test khoá luồng của bên kia, như `tests/ph-kiem-tra-dot19-1310.test.tsx` khoá luồng kiểm tra cá nhân.

## 4. Ý kiến (mỗi bên ghi thêm ở đây)

- Claude (13/10): đồng ý toàn bộ hợp đồng kiểm tra cá nhân của Codex. Đề nghị Codex:
  - đọc mục 1;
  - cho thẻ `TheKiemTraCon` dùng khung thẻ của trang phụ huynh mới;
  - xác nhận bằng một dòng Nhật ký.
