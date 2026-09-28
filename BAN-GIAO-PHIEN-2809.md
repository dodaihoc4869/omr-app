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
- LUẬT THẦY CHỐT màn chiếu: KHÔNG BAO GIỜ thu nhỏ chữ; câu dài ⇒ lật nhiều trang cùng câu (ngắt theo khối, "Trang 1/2 của Câu N", Space/↓ lật trong câu, ←/→ đổi đợt), giữ cột làm bài 1/3. Bảng chi tiết HS: mục "Câu này" lên đầu (số lần làm/đúng/sai + từng lần ngày giờ, đáp án, trợ giúp, nguồn).
- Bổ sung: KHI ĐÃ GỌI LÊN BẢNG (thẻ tên hiện) ⇒ mọi câu dài/quá dài về vùng 2/3 trái TỰ CUỘN (chữ giữ cỡ), 1/3 phải trống cho em làm bài; trước khi gọi vẫn lật trang.
- LỖI QUY TRÌNH 28/09: từ PR #17 tới #26 MỌI lượt deploy bị HUỶ (concurrency cancel-in-progress, em merge dồn dập) ⇒ bản sống vẫn là PR #16. Lượt PR #27 (`4232ea5`, gồm tất cả) đang chạy. LUẬT: chờ lượt deploy xong (success) rồi mới merge PR kế. `game-sang-toi` (`9481a7c`) đã đẩy, CHỜ merge sau khi #27 xanh.
- 12:42 PR #27 deploy SUCCESS (bản sống có mọi thứ tới #27). PR #28 sáng/tối merge `c5e0ea4` (deploy đang chạy). Đang làm: nhánh `de-toi-da` — nút toàn màn hình vào thanh đầu, ô trợ giúp 1 dòng, vùng đề lớn nhất mọi màn game (không giảm cỡ chữ). CHỜ deploy #28 xong mới merge.
- BẢN VẼ màn chiếu lên bảng mới: nhánh `ban-ve-len-bang` `dbb60c3`, link https://claude.ai/artifact/R4AeUhvavEGCWHKfqKfHxU — CHỜ THẦY CHỐT. Cần thêm API khi build: đọc lần làm theo em+câu; lưu đáp án em chọn (cột mới, chỉ-thêm); đúng/sai 14 ngày cho GV; 5 câu sai gần nhất; lịch sử lên bảng.
- THẦY CHỐT build màn chiếu lên bảng (bảng chi tiết HIỆN TRÊN MÁY CHIẾU). Đang build: nhánh `build-len-bang` (tờ chiếu + API hồ sơ em chỉ-thêm + migration cột đáp án chọn nếu cần). Nhãn Đạt/Chưa đạt thẻ tên: viên thuốc 1 dòng.
- PR #29 vùng đề/nút merge `2b22e57` 13:00 (deploy đang chạy, hẹn kiểm 13:14).
- VIỆC MỚI: rà soát + vẽ lại luồng ca kiểm tra (mở ca, theo dõi, kết thúc, BÁO CÁO CHI TIẾT thay toàn bộ, màn HS xem kết quả) — nhánh `ban-ve-ca-thi`, `docs/ban-ve-ca-thi-2809/`. CHỜ THẦY CHỐT mới build.
- 13:11 PR #29 deploy SUCCESS. PR #30 (`7049bee`): lối vào Ca kiểm tra ở Sảnh + câu ngắn thẻ đề gọn — deploy đang chạy, hẹn kiểm 13:30.
- Bản vẽ ca kiểm tra: `ban-ve-ca-thi` `d1d9092`, link https://claude.ai/artifact/EZWNwNRXNeNqpxqawCYsoh — CHỜ CHỐT. API cần: /gv/cong-bo-ca, tbCaTruoc, /gv/nhan-xet-ca-em, maTran trong /gv/bao-cao-ca. Nhánh `chip-gon` (ee59c6d) chờ merge sau deploy #30.
- THẦY CHỐT build ca kiểm tra + báo cáo mới: nhánh `build-ca-thi` (a–e + API /gv/cong-bo-ca, tbCaTruoc, /gv/nhan-xet-ca-em, maTran). Đang build.
- THẦY: Đảo 3D vẽ xong BUILD LUÔN + phát hành + báo cáo. Trợ lý vẽ tiếp tục build ở nhánh `build-dao-3d`.
- 13:35 PR #31 lên bảng merge `4370dea` (deploy đang chạy). THẦY CHỐT: câu sai ca đã công bố tự vào Đoàn (nguồn ca_sai), vào kế hoạch từ NGÀY HÔM SAU, không phá kế hoạch hôm nay — giao cho trợ lý build-ca-thi.
- 13:44 PR #31 lên bảng deploy SUCCESS. PR #32 thẻ lọc gọn toàn app merge `536c590` (deploy đang chạy). Đảo 3D: `build-dao-3d` `b8d40f4` (đã commit + build:cf đạt) chờ merge sau #32 (hẹn 14:02). Đang chạy: build-ca-thi (+ câu sai ca vào Đoàn), hien-thi-de (rà + TỰ SỬA kho đề, thầy cho phép, có sao lưu).
- 13:57 PR #32 thẻ lọc SUCCESS. 14:06 PR #33 Đảo 3D merge `63188d6` (deploy chạy). build-ca-thi `26faa44` đã gộp main + build:cf đạt (146 tệp/2945 KB) — chờ merge 14:20. nhan_xet_ca_em tự tạo bảng ở máy chủ (CI không chạy migration).
- hien-thi-de `da3429f` đã đẩy: bộ hiển thị sơ đồ/công thức (chem-format-so-do.ts) — chờ merge sau ca-thi. Rà 15.359 câu: 882 trường/799 câu cần sửa trình bày; 88 mục cần thầy xem. GHI KHO ĐỀ BỊ HỆ THỐNG QUYỀN CHẶN (Modify Shared Resources) ⇒ 0 câu đã sửa; chờ thầy xác nhận trực tiếp. Sao lưu + lệnh áp/lùi: docs/ra-soat-hien-thi-de-2809/ap-dung.md.
- 14:16 PR #33 Đảo 3D SUCCESS. 14:23 PR #34 ca thi merge `240e021`, 14:24 PR #35 hiển thị đề merge `81f95f5` (một lượt deploy gồm cả hai; hẹn kiểm 14:38 rồi gửi BÁO CÁO TỔNG).
- 14:36 PR #35 deploy SUCCESS (gồm #34 ca thi). Máy chủ trả 200. ĐÃ GỬI BÁO CÁO TỔNG. Chờ thầy: xác nhận trực tiếp ghi sửa 799 câu kho đề.
- THẦY: "Tất cả các phần còn thiếu với bản vẽ hoàn thành luôn" ⇒ trợ lý nhánh `hoan-thien-ban-ve` (Đóng cửa vào, bỏ Khoá ca, gộp modal, EXP HS; lên bảng 1 em/đợt, EXP, thống kê lớp mọi buổi; nút toàn màn hình Xong chuyến/Cửa hàng). THẦY ĐỒNG Ý TRỰC TIẾP ghi sửa 799 câu. Phát hiện /kho/day dựng lại cau_hoi (chuyen_de dùng rút khắc phục) ⇒ thêm /kho/chi-muc-lay (PR #36 `bee47dc`) + ap-dung.py giữ nguyên chỉ mục cũ; chạy sau khi #36 deploy (hẹn 15:0x).
- 16:37 · Deploy #535 THÀNH CÔNG: PR #37 hoàn thiện bản vẽ (Đóng cửa vào, Ca đã mở, Chiếu mã 5 s, Lên bảng 1 em/đợt, nút toàn màn hình) · main 499ef50 · lùi: git revert -m 1 499ef50. Kho đề: 799 câu/882 trường áp xong (nhánh hien-thi-de f424709). Đang chờ so test đỏ: sua-chien-dich 0d63b6a, chuong-tran-dau 7791cbc.
- 18:05 · Deploy #536 THÀNH CÔNG: PR #38 lượt 1 (bắn chưởng, Đoàn hết câu, phòng chờ 5 s, sửa chiến dịch) · main 240eddb · lùi: git revert -m 1 240eddb. Chờ: lượt 2 (ban-ve-lam-bai-ngang abd21b0 + sua-tran-chu), lượt 3 go-bo-nao 6857060.
- 18:39 · Deploy #538 THÀNH CÔNG: main 441cc5e = lượt 2 (PR #40: làm bài ngang, ô Phần III, tràn chữ, nền hộp CD; run #537 bị huỷ nhưng #538 gồm #40) + PR #39 của Code 2 (app PH ph-v3, chữ Thầy Đỗ Đại Học ở HS/PH) · lùi: git revert -m 1 441cc5e (PR39), git revert -m 1 b333770 (lượt 2). Đang: sửa gấp đồng hồ đè nút Nộp (sua-cum-nop-ngang), go-bo-nao gộp main, bi-a chờ Code 1 sửa precache/migration.
- 19:11 · Deploy #540 THÀNH CÔNG: PR #42 lượt 3 gỡ Bộ não AI · main 0afe3de · lùi: git revert -m 1 0afe3de. Trước đó #539 THÀNH CÔNG PR #41 sửa cụm Nộp/đồng hồ (8a9067a).
- (chép hộ Code 1) Bi-a claude/fervent-edison-otwz9p @ 1fa3634: đủ 4 điểm (gộp main, precache 13/13, bảng tự dựng, đối thủ 'A.I'); Code app gộp main 0afe3de ⇒ nhánh gop-bia-2809 c69fa49, build 13/13 (167/2910 KB), đang chạy toàn bộ vitest.
