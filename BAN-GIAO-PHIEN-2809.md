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
