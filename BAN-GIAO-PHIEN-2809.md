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
- 19:24 · Deploy #541 THÀNH CÔNG: PR #43 lượt 4 Bi-a GĐ1 · main bfc5ddf · lùi: git revert -m 1 bfc5ddf. 19:29 thầy lệnh bật cả trung tâm ⇒ bia-co-luu {bat:true, lop:[], sbd:[]}, đọc lại bat:true (tắt: cùng lệnh bat:false). 0 ca mở lúc bật.
- 19:50 · Deploy #542 THÀNH CÔNG: PR #44 nút Dịu mắt màn thi · main 91dea91 · lùi: git revert -m 1 91dea91. Đang: hop-thoai-app (thay nốt 2 confirm html-phieu), hs-lich-su-ca (thay báo cáo cũ bằng bản mới), thanh-thao-chot.
- 20:09 · Deploy #543 THÀNH CÔNG: PR #45 Bi-a âm thanh phá bàn (chỉ tiếng bi chạm bi) · main 7a60f32 · lùi: git revert -m 1 7a60f32.
- 20:35 · Deploy #544 THÀNH CÔNG: PR #46 luật thành thạo lần đầu (P1 + giảm đoán mò) · main 9828882 · lùi: git revert -m 1 9828882. 20:42 merge PR #47 (lịch sử ca HS + báo cáo bản mới + hộp thoại app) main 677b1b1, đang deploy.
- 20:53 · Deploy #545 THÀNH CÔNG: PR #47 lịch sử ca HS + báo cáo bản mới + hộp thoại app · main 677b1b1 · lùi: git revert -m 1 677b1b1. Chờ: xoa-bao-cao-cu, Code 1 Bi-a Câu đã làm, ngay-bat-dau-cd.
- 21:13 · Deploy #546 THÀNH CÔNG: PR #48 ngày bắt đầu chiến dịch · main 9fcef48 · lùi: git revert -m 1 9fcef48. 21:25 merge PR #49 xoá báo cáo HS cũ (main 2e41cfb), đang deploy.
- 21:37 · Deploy #547 THÀNH CÔNG: PR #49 xoá báo cáo HS cũ · main 2e41cfb · lùi: git revert -m 1 2e41cfb.
- 21:51 · Deploy #548 THÀNH CÔNG: PR #50 đổi tên thần thú · main 7ff811e · lùi: git revert -m 1 7ff811e.
- 22:09 · Deploy #549 THÀNH CÔNG: PR #51 Bi-a GĐ2 Đấu với bạn (DO BanBiA) · main abea3ea · lùi: git revert -m 1 abea3ea. Còn: Code 1 chưa làm Bi-a → Câu đã làm.
- 22:38 · Deploy #550 THÀNH CÔNG: PR #52 Câu đã làm hiện câu ôn từ ca (Bi-a/Đoàn) + nguồn từng lần · main 87ce9bb · lùi: git revert -m 1 87ce9bb. Chờ: len-bang-day-hoc; tối ưu FE/BE (scratchpad/toi-uu).
- 23:30 · Deploy #551 THÀNH CÔNG: PR #53 bảng DẠY HỌC (điểm danh, cây DẠY HỌC, chiếu đủ, chọn em) · main f1c0704 · lùi: git revert -m 1 f1c0704. Đang: toi-uu-man-thi, toi-uu-may-chu; FE còn lại chờ.
- 00:30 · Deploy #552 THÀNH CÔNG: PR #54 màn thi hết đứng máy · main 25042c8 · lùi: git revert -m 1 25042c8.
- 00:48 · Deploy #553 THÀNH CÔNG: PR #55 tối ưu máy chủ · main 4570868 · lùi: git revert -m 1 4570868. Đo sau: /ca/danh-sach 1,34–1,64 s (trước ~1,6), /gv/chien-dich thongKe 1,78–1,97 s (trước ~2,1); bia-co-doc ok.
- 01:04 · Deploy #554 THÀNH CÔNG: PR #56 tối ưu app (gói đầu gv 591→251 KB, WebP 25→5 MB, precache 161, dọn ảnh/mã) · main c1fd22c · lùi: git revert -m 1 c1fd22c. HẾT ĐỢT TỐI ƯU 28/09.
- 06:36 (29/09) · Deploy #555 THÀNH CÔNG: PR #57 DẠY HỌC Khối 10 + thêm em tay · main 9b88cb3 · lùi: git revert -m 1 9b88cb3.
- 08:00 (29/09) · Deploy #556 THÀNH CÔNG: PR #58 Ca kiểm tra 'Không rút câu sai' · main 93461ca · lùi: git revert -m 1 93461ca. A so-no-thuat-toan 257562e sẵn sàng; B kiem-tra-dau-gio đang gộp A.
- 08:00 · Deploy #557 THÀNH CÔNG: PR #59 màu chữ nút Bi-a · main 5accee3 · lùi: git revert -m 1 5accee3.
- 08:15 · merge PR #60 Sổ nợ + đan xen + Kiểm tra đầu giờ (main 4f9b28d), đang deploy.
- 08:26 · Deploy #558 THÀNH CÔNG: PR #60 Sổ nợ + đầu giờ · main 4f9b28d · thử /gv/dau-gio + /gv/chien-dich OK · lùi: git revert -m 1 4f9b28d.
- 08:39 · Deploy #559 THÀNH CÔNG: PR #61 vá lộ đáp án (cauKhacPhuc/deTheoDangBai) · main 005f3ae · 0 ca mở lúc gộp · lùi: git revert -m 1 005f3ae.
- 10:03 · Gộp PR #63 (Chậm nhịp chung + 3 bảng lời giải GIỮ trong reset) · main cd5a2de · 0 ca mở · lùi: git revert -m 1 cd5a2de. Nạp hàng lời giải khối 12: 149 đề, 4363 câu duy nhất vào hàng.
- 10:12 · Deploy #562 THÀNH CÔNG: PR #63 · main cd5a2de · máy chủ thật: 4 chiến dịch ngày 1 đều Đúng nhịp. 10:14 mở phiên Code 4b soạn lời giải khối 12 (4363 câu).
- 11:10 · Deploy #563 THÀNH CÔNG: PR #65 nút Điểm danh gọn · main 4546a97 · lùi: git revert -m 1 4546a97. 11:13 gộp PR #66 máy tự duyệt lời giải (main 8c84047, 0 ca mở) — chờ deploy rồi chạy may-duyet-bu.
- 11:25 · Deploy #564 THÀNH CÔNG: PR #66 máy tự duyệt · main 8c84047 · lùi: git revert -m 1 8c84047. Duyệt bù 500 hồ sơ sạch; tiến độ lời giải 12: 535 xong / 4363, 534 đã duyệt, 1 còn cờ đáp án, 2 trượt.
- 11:46 · Deploy #565 THÀNH CÔNG: PR #67 sửa sập Cổng HS iOS<16.4 (lookbehind) · main cec4371 · lùi: git revert -m 1 cec4371. 11:48 gộp PR #68 hộp kéo chiến dịch Tổng quan (main 140afea, 0 ca mở).
- 12:15 · Deploy #567 THÀNH CÔNG: PR #69 tab Điểm danh dọc mép trái · main 511048c · lùi: git revert -m 1 511048c. (#566 PR #68 hộp kéo 140afea THÀNH CÔNG.) 12:18 gộp PR #70 tối ưu máy yếu (main b654155, 0 ca mở). Hàng chờ: #71, #72.
- 12:28 · Deploy #568 THÀNH CÔNG: PR #70 tối ưu máy yếu · main b654155 · lùi: git revert -m 1 b654155. 12:39 gộp PR #71 nút Hỏi thầy trong game (main 5683fc1, 0 ca mở). Chờ: #72.
- 12:48 · Deploy #569 THÀNH CÔNG: PR #71 nút Hỏi thầy trong game · main 5683fc1 · lùi: git revert -m 1 5683fc1. 12:52 gộp PR #72 Hỏi thầy báo 'đang soạn' (main d51fb06, 0 ca mở).
- 13:03 · Deploy #570 THÀNH CÔNG: PR #72 Hỏi thầy 'đang soạn' · main d51fb06 · lùi: git revert -m 1 d51fb06. 13:07 gộp PR #73 Bi-a mượt (main b51090f, 0 ca mở).
- 13:16 · Deploy #571 THÀNH CÔNG: PR #73 Bi-a mượt · main b51090f · lùi: git revert -m 1 b51090f.
- 13:16 · Deploy #571 PR #73 Bi-a xong. 13:31 gộp PR #75 Đảo 2 cảnh trận dính đầu màn (main acef1e2, 0 ca mở) · lùi: git revert -m 1 acef1e2. PR #74 EXP v4 đang bổ sung hiệu ứng game.
- 13:47 · Deploy #572 THÀNH CÔNG: PR #75 Đảo 2 cảnh trận dính · main acef1e2 · lùi: git revert -m 1 acef1e2. 13:51 gộp PR #76 lời giải thẳng dòng (đổi .lg-chu→.lg-van, main 35ac8ee, 0 ca mở).
- 14:02 · Deploy #573 THÀNH CÔNG: PR #76 lời giải thẳng dòng · main 35ac8ee · lùi: git revert -m 1 35ac8ee. 14:08 gộp PR #74 EXP v4 (nạp tự do, cấp 10 ngày 21, vàng 1/5, khiên 21 ngày, trần kiếm, hiệu ứng +EXP) · main 7942012 · 0 ca mở · 221 test EXP/reset xanh, precache 170/170 · chuyển dữ liệu lười từng em (có truocSiet4 để lùi) · P08 vẫn đóng. Lùi: git revert -m 1 7942012.
- 14:16 · Deploy #574 THÀNH CÔNG: PR #74 EXP v4 · main 7942012 · thử máy chủ: /khoe 200, chiến dịch + lời giải OK · lùi: git revert -m 1 7942012.
- 15:03 · Gộp PR #79 tối ưu máy yếu toàn app (màn thi 127→75 ms/chạm, /hs 5,72→4,81 s; precache 170/2930 KB) · main b12ad34 · 0 ca mở · lùi: git revert -m 1 b12ad34. PR #78 nháp (EXP câu game) sẽ thay bằng PR v5.
- 15:08 · Deploy #575 THÀNH CÔNG: PR #79 máy yếu toàn app · main b12ad34 · lùi: git revert -m 1 b12ad34. 15:15 gộp PR #77 sửa ghép Đ/S bộ kiểm lời giải + tu-sua-kho.mjs + sao lưu đợt 1 (main 4dc991d, 0 ca mở).
- 15:20 · Deploy #576 THÀNH CÔNG: PR #77 · main 4dc991d · lùi: git revert -m 1 4dc991d. 15:33 gộp PR #80 EXP v5 (bỏ mọi trần ngày; cấp cần EXP + ngày đạt; tràn → vàng/mảnh; khiên ngày 36; EXP câu game; số bay vào thú) · main 6c333f3 · 0 ca mở · 243 test xanh · precache 170/2756 KB · đóng PR nháp #78. Lùi: git revert -m 1 6c333f3.
- 15:41 · Deploy #577 THÀNH CÔNG: PR #80 EXP v5 · main 6c333f3 · /khoe 200, chiến dịch OK · lùi: git revert -m 1 6c333f3.
- 15:50 · Gộp PR #81 13 bộ chìa khoá lớp 10–11 + chương thiếu lớp 12 + nhật ký tự sửa đợt 1b/2 (main 179505e, 0 ca mở) · lùi: git revert -m 1 179505e.
- 16:42 · Gộp PR #82 máy yếu đợt 2 (vào đề 1,33→0,32 s; tờ chiếu 5,4→3,6 s; precache 163/2925 KB) · main a72d513 · thầy cho đẩy trước ca 12L2-L1 bắt đầu 17:30 · lùi: git revert -m 1 a72d513.
- 16:49 · Deploy #579 THÀNH CÔNG: PR #82 máy yếu đợt 2 · main a72d513 · /khoe 200 · lùi: git revert -m 1 a72d513. NGỪNG đưa lên tới khi ca 12L2-L1 (147227, 17:30, 15 phút) đóng + công bố. Code 4b hoãn ghi kho đợt 3 (88 sửa đề + 3 đổi đáp án) tới lúc đó.
- 19:25 · Gộp PR #83 màn theo dõi ca gọn + nhịp 3 s (/ca/nhip, ~80 truy vấn D1/phút/100 em) · main 59abb58 · 0 ca mở · lùi: git revert -m 1 59abb58.
- 19:29 · Deploy #580 THÀNH CÔNG: PR #83 · main 59abb58 · /ca/nhip thử OK · lùi: git revert -m 1 59abb58. Thầy đổi ý: bỏ cả thẻ Thời gian trở xuống — đang làm PR mới.
- 19:52 · Gộp PR #84 màn thi điện thoại xoay ngang (bỏ phiếu điền ô, câu dài chia 2 cột + thanh kéo, thanh trên 32 px; dọc/máy tính giữ nguyên) · main 1dc3912 · 0 ca mở · 224 test màn thi xanh · lùi: git revert -m 1 1dc3912.
- 19:50 · Deploy #581 THÀNH CÔNG: PR #84 màn thi ngang · main 1dc3912 · lùi: git revert -m 1 1dc3912.
- 20:28 · Boss · merge PR #85 Bi-a mắt thần luôn bật + Trả lời câu hỏi (merge 40786b5) · không ca mở · lùi: git revert -m1 40786b5
- 20:37 · deploy #85 xanh (run 582)
- 20:41 · Boss · merge PR #86 Theo dõi ca chỉ khu trên + công tắc Giao chiến dịch + bỏ khối Câu hỏi của em (merge afbb205) · không ca mở · lùi: git revert -m1 afbb205
- 20:53 · deploy #86 xanh (run 583)
- 20:58 · Boss · merge PR #87 Bi-a cầm gậy xoay (merge d9da4f8) · không ca mở · lùi: git revert -m1 d9da4f8
- 21:11 · deploy #87 xanh (run 584)
- 22:05 · Boss · merge PR #88 chấm trả lời ngắn ×10ⁿ (merge 6dc00e7) · không ca mở · lùi: git revert -m1 6dc00e7
- 22:17 · deploy #88 xanh (run 585)
- 22:3x · Boss · merge PR #89 version câu tất định (merge 7e56d8a) · 181 test xanh · không ca mở · lùi: git revert -m1 7e56d8a
- 22:29 · deploy #89 xanh (run 586)
- 22:36 · Boss · merge PR #90 Đảo báo nhầm ca (9b37f2e) + PR #91 mốc khoá ca 29/09 thầy xác nhận (6721255) · không ca mở · lùi: git revert -m1 6721255 && git revert -m1 9b37f2e
- 22:43 · deploy 6721255 (#90+#91) xanh (run 588; run 587 bị huỷ do cancel-in-progress, đã gồm trong 588)
- 00:10 30/09 · Boss · merge PR #92 Tu luyện (da77410) + PR #93 tối ưu máy chủ cao điểm (b287087) · test vùng: chỉ đỏ nền (luyen-dang-bai ×5, doan-khoan-exp, doan-rut-cau-moi — đỏ sẵn trên main) · không ca mở · lùi: git revert -m1 b287087 && git revert -m1 da77410
