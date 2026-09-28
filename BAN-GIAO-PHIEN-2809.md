# BÀN GIAO PHIÊN 28/09/2026 — đọc tệp này đầu tiên ở phiên mới

Phiên mới: đọc `CLAUDE.md` → `DIEU-PHOI.md` → tệp này. Sổ việc chi tiết: `SO-VIEC-GAME-HOA-2.md` (80 dòng cuối).

## Đã xong và đang chạy thật (main, tự phát hành qua GitHub Actions khi merge)
- PR #1–#15 đã merge. Reset lần 2 xong 27/09 (`mocReset` 2026-09-28). `game_hoa_2` bật cho cả trung tâm.
- Giao chiến dịch: chọn Toàn khối / Theo lớp / Từng em (có tài khoản test Đỗ Đại Học 12121212); thể lực gõ số + nút gạt Tự động; Huyết Chiến = 2× thể lực; bỏ "Rút còn" và "Lùi hạn nộp"; khung "Chiến dịch đã giao".
- Không có câu ôn trước chiến dịch; kế hoạch ngày lập lại khi đổi chiến dịch.
- Đoàn: lời giải đứng yên tới khi em bấm ĐÁNH TIẾP. Câu đã làm + tải PDF. Sửa phông chữ "Ổ".
- Thuật toán cá nhân hoá (PR #15): p=(đúng+2)/(gặp+4); mốc <40% L1, 40–65 L2, 65–85 L3, >85 L4; ải 1–2 dễ nhất, ải trùm khó nhất.

## ĐANG LÀM (thầy "Chốt build tất cả") — nhánh đã đẩy lên origin
| Việc | Nhánh | Bản vẽ gốc |
|---|---|---|
| HS ngang: Sảnh, Câu đã làm, màn Xong | `build-ngang-sanh` | `docs/ban-ve-ngang-2809/` (nhánh `ban-ve-ngang`) |
| HS ngang: game Bát Linh Đảo | `build-ngang-dao` | như trên |
| HS ngang: game Đoàn Hộ Tống | `build-ngang-doan` | như trên |
| GV: khung, Tổng quan, Ca, bỏ thừa, bỏ ảnh mở ca | `build-gv-khung` | `docs/ban-ve-gv-2809/` (nhánh `ban-ve-gv`, có `RA-SOAT.md`) |
| GV: màn chiến dịch + số liệu | `build-gv-chien-dich` | như trên |

Phiên mới: `git fetch origin` rồi xem từng nhánh. Nhánh nào mới chỉ có commit "Merge branch …" ⇒ việc chưa lưu, phải làm lại từ bản vẽ.

### Khi gộp 5 nhánh — BẮT BUỘC sửa
1. Mốc hạng đúng 40/65/85 (không phải số khác trong bản vẽ).
2. Không còn chữ/nút "Rút còn".
3. Dùng hình thần thú THẬT của em đã chọn (bản vẽ vẽ tạm hình khác).
4. Nhãn máu quái không bị che.
Quy trình: gộp vào một nhánh → `npx vitest run` so tên với nền đỏ (199 test, tệp `scratchpad/do-truoc.ten` đã mất theo máy — chạy lại nền trên main trước để so) → `npm run build:cf` → kiểm precache (≤170 tệp/3000 KB, thêm `globIgnores` nếu vượt) → kiểm KHÔNG có ca thi mở → PR vào main → merge (tự phát hành ~12 phút) → báo thầy kèm ảnh.

## VIỆC MỚI NHẤT — chờ thầy chốt, CHƯA build
Thầy: "cái màn này (Sảnh) có thể thiết kế sống động, đỉnh cao cực kì cuốn hút… hiệu ứng động lung linh mê hoặc. Vẽ trước khi tôi chốt nhé".
- Bản vẽ động HTML: `docs/ban-ve-sanh-dong-2809/Sanh-Dong.html`, nhánh `ban-ve-sanh-dong`. Có dọc 390 + ngang 1440, 3 trạng thái (còn ổ phục kích / hết ổ – KHÁM PHÁ · 47 câu / xong hôm nay – rương), cảnh mở màn, biển, sương tan theo %, cầu hạ, xe hàng + Linh Tâm, nút vàng ánh quét, prefers-reduced-motion.
- Nếu tệp chưa có trên nhánh ⇒ vẽ lại theo mô tả trên. Có rồi ⇒ xuất bản Artifact (tệp HTML tự chứa) gửi link cho thầy xem. Thầy chốt mới đưa vào `src/components/hoa2/SanhBanDo.tsx` (sau khi gộp `build-ngang-sanh`).

## Lưu ý kỹ thuật
- Mạng máy cloud: chỉ gọi được `omr.ttadodaihoc.workers.dev`; `pages.dev` bị chặn. Không dùng vòng lặp chờ curl (thầy cấm).
- Mã bí mật: KHÔNG ghi vào tệp/commit; nếu cần gọi API quản trị, xin thầy dán lại trong phiên.
- Tín dụng cloud còn ít: hạn chế chạy nhiều trợ lý song song; đẩy nhánh thường xuyên.

## Cập nhật
- `build-ngang-dao` XONG: commit `0aa00e1` (đã đẩy). 96/96 test, tsc 0 lỗi, build:cf 13/13. Game bên trái, câu hỏi bên phải. Chưa làm bàn phím số cho ải Trùm (vẫn dùng ô nhập cũ). Màn 900×420: riêng màn đảo khoá cuộn thêm 33 px.
- `build-ngang-doan` XONG: `af12f40` (đã đẩy). Test mới 7/7, build:cf 13/13. Còn: Tung chưởng chưa thành tấm bên phải (bảng "Vì sao" vẫn ở giữa đáy). Test đỏ có sẵn `tu-ngu-cum7` (chữ "XEM KẾT QUẢ CHẶNG") — sửa khi gộp.
- `build-ngang-sanh` XONG: `cc1a5f8` (đã đẩy). tsc 0, `tests/hoa2-` 39/39. CHƯA chạy build:cf. Lỗi còn: màn 844×390 thu nhỏ 0,75 ⇒ nút < 44 px — sửa khi gộp.
- Bản vẽ Sảnh động bản 2 (hoàng hôn sáng, 2.5D, thị sai) XONG: nhánh `ban-ve-sanh-dong` commit `9cc4be1` (đã đẩy). Link xem: https://claude.ai/artifact/XzDYtWoFJfnB6zr6PZKmJh — CHỜ THẦY CHỐT, chưa build.
- `build-gv-khung` XONG: `7175290` (đã đẩy). build:cf 13/13 (precache 2982/3000 KB — sát trần!). Sửa ngoài làn: `appStore.ts` (+2 ScreenId), `vite.config.ts` globIgnores. Còn: "Mã dạng" vẫn ở Kho đề; chưa đưa "Gọi lên bảng cách cũ" vào Cài đặt; chữ `KhoiBaiLuyen.tsx` chưa sửa — làm khi gộp (có thể xung đột với `build-gv-chien-dich`).
- `build-gv-chien-dich` XONG: `71fba26` (đã đẩy). Máy chủ `srs2-gv.ts` thêm trường (chỉ thêm) — Worker CHƯA đẩy (CI tự đẩy khi merge main). vitest 132/132, build:cf 13/13.
- BƯỚC TIẾP: gộp 5 nhánh vào `gop-ngang-gv-2809` (từ origin/main) → sửa việc tồn → test → PR → merge.
- THẦY ĐÃ CHỐT Sảnh 3D tươi sáng (bản vẽ `9cc4be1`). Đang build ở nhánh `sanh-3d` (tách từ `gop-ngang-gv-2809` @ `d25724e`). Nhánh gộp 5 phần: `gop-ngang-gv-2809` (đã đẩy), đang chạy toàn bộ vitest so nền main.
- Kế hoạch phát hành: gộp `sanh-3d` vào `gop-ngang-gv-2809` → test → PR vào main → merge (một lượt phát hành).
- ĐÃ PHÁT HÀNH 5 phần: PR #16 merge → main `8906461` (CI tự đẩy Pages + Worker ~12 phút). Lùi: `git revert -m 1 8906461`. Lúc phát hành 0 ca thi.
- CÒN: Sảnh 3D (nhánh `sanh-3d`, trợ lý đang làm; nếu phiên chết thì làm lại theo bản vẽ `9cc4be1:docs/ban-ve-sanh-dong-2809/Sanh-Dong.html`, giữ số thật + `anhThu`). Xong ⇒ PR riêng vào main.
- ĐÃ PHÁT HÀNH Sảnh 3D: PR #17 (nhánh `sanh-3d` `fe0478b`). Chưa chạy toàn bộ vitest (hết tín dụng). VIỆC SAU: chạy toàn bộ vitest so nền; thêm trôi tự động thị sai, đếm số tăng, nét đứt chạy, sửa 844×390 phải cuộn cột phải, nạp lười cảnh.
- Sửa Đảo ngang lời giải: PR #18 (tự cuộn tới LỜI GIẢI) + PR #19 `f68e54a` (thẻ câu overflow:hidden bị flex ép lùn ⇒ không cuộn; thêm flex-shrink:0). CẦN KIỂM Đoàn ngang có cùng lỗi không (cột phải XemLaiChuan).
- VIỆC MỚI (thầy 28/09): "Sổ tay, túi đồ, cửa hàng làm cả giao diện xoay ngang luôn nhé" — nhánh `ngang-so-tay-tui-cua-hang`. Theo phong cách bản ngang đã phát hành (Sảnh 3D sáng, kính sáng chữ tối; ≥1024 px hoặc xoay ngang ≥700 px), dọc giữ nguyên.
- ĐÃ PHÁT HÀNH: PR #20 thanh kéo cột Đảo ngang (`95a3404`); PR #21 ngang Sổ tay/Túi đồ/Cửa hàng (`f9f6ee1`). Còn: chưa xem thật 844×390; chạy toàn bộ vitest so nền.
- ĐÃ PHÁT HÀNH PR #22 Thử đồ ngang (`f2a2d8f`) — chưa có test riêng, chưa xem trình duyệt thật.
- ĐÃ PHÁT HÀNH PR #23 Đoàn ngang thanh kéo cột + cột lời giải cuộn (`301ed39`).
- BẢN VẼ app GV nhiều màu (Material 3): `docs/ban-ve-gv-mau-2809/GV-TongQuan-Mau.html`, link https://claude.ai/artifact/1D6kCkQWqZRUNFPcdbhi1t — CHỜ THẦY CHỐT rồi mới build (áp cho cả app GV).
- THẦY CHỐT phong cách màu GV cho toàn app ("thiết kế full app mọi lớp màu sắc chuẩn như vậy"). Đang build ở nhánh `gv-mau-m3` (token M3 trong tokens.css, rail, thẻ số theo nghĩa màu, thẻ chiến dịch ngang). Xong ⇒ PR vào main.
- ĐÃ PHÁT HÀNH PR #24 (`d56a32d`): bỏ tự toàn màn hình khi vào game; nút toàn màn hình kính tròn góc dưới phải (NutToanManHinh).
- ĐANG CHẠY: (1) màu M3 toàn app GV — nhánh `gv-mau-m3`; (2) game sáng/tối theo hệ thống — nhánh `game-sang-toi`; (3) rà soát màn chiếu Gọi lên bảng + đề xuất — nhánh `ra-soat-len-bang` (`docs/ra-soat-len-bang-2809/DE-XUAT.md`), CHỈ đề xuất, chờ thầy chốt.
- ĐÃ PHÁT HÀNH PR #25 ô "có trợ giúp" thẻ công tắc. RÀ SOÁT lên bảng xong: `docs/ra-soat-len-bang-2809/DE-XUAT.md` (16 hạn chế, 10 đề xuất P1–P10) — CHỜ THẦY CHỐT.
- ĐÃ PHÁT HÀNH PR #26 PDF chỉ đề + nét hơn (`a3f6521`); PR #27 màu M3 toàn app GV (`4232ea5`). Còn chạy: game sáng/tối (`game-sang-toi`). Chờ thầy chốt: đề xuất màn chiếu lên bảng P1–P10.
