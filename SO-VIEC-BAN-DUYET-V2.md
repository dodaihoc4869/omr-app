# SỔ VIỆC — BẢN DUYỆT V2 (phiên cloud, nhánh `claude/amazing-albattani-03aros`, 09/10/2026)

Thầy gửi 9 ảnh bản duyệt V2 (màn 01–31 + bảng Bát Linh thần thú V2), rồi ra lệnh nguyên văn:

> Bạn là chuyên gia Frontend Pixel-Perfect. Hãy đọc toàn bộ code hiện tại trong repo và các ảnh thiết kế trong thư mục /design_specs/:
> 1. Khởi tạo Design System: Quét bảng màu từ Bảng G (ngà voi #FFFEF6, xanh ngọc #10B981, xanh navy #0F3D3A, vàng #F7A800) cập nhật vào tailwind.config.js. Cấu hình font chữ, bo góc (rounded-3xl), hiệu ứng shadow/gradient chuẩn game hóa.
> 2. Lập trình từng module theo từng ảnh: 00 & 01: Màn hình chính học sinh (hỗ trợ cả dọc mobile và ngang desktop). 06 & 07: Thần thú và Shop thử đồ. Dùng ảnh trong /public/assets/beasts/ làm avatar. 08 & 09: Chế độ chiến đấu Bát Linh Đảo & Đoàn Hộ Tống (chia cột 40% chiến trường / 60% trắc nghiệm Hóa học). 14 - 21: Dashboard quản lý của Giáo viên (Bổ sung bài, điểm danh, ma trận đề).
> 3. Yêu cầu: Viết code hoàn chỉnh, không dùng placeholder 'TODO'. Tự động chạy lệnh build kiểm tra lỗi cú pháp sau khi tạo từng file.

Thầy nhắn thêm giữa chừng (nguyên văn): "làm hết chưa đẩy, cho tôi xem sau khi xong mới quyết định đẩy nhé."

## Việc

- [x] Đọc code hiện tại + ảnh thiết kế | bằng chứng: 3 agent dò mã (Sảnh/thần thú/shop · hai màn trận · 8 màn thầy). `/design_specs/` và `/public/assets/beasts/` KHÔNG có trên đĩa — ảnh lấy từ tin nhắn thầy, ảnh thần thú thật ở `public/than-thu-v2/nho/`.
- [x] 1a. Bảng màu Bảng G vào cấu hình Tailwind | bằng chứng: repo dùng Tailwind v4 (không có tailwind.config.js) ⇒ `@theme` trong `src/index.css` (`bg-v2-ngoc`, `text-v2-xanh-than`, `rounded-v2`, `shadow-v2-the`…); 4 màu gốc ở `src/styles/tokens.css` (ngọc trỏ `--xanh` #10b981 sẵn có); sắc dẫn xuất pha color-mix ở `src/styles/ban-duyet-v2.css`.
- [x] 1b. Font, bo góc rounded-3xl, shadow/gradient game hoá | bằng chứng: tiêu đề 'Baloo 2' 800 (phông game có sẵn) + thân Be Vietnam Pro; `--v2-bo: 24px`; bóng thẻ/nổi, nút vàng nổi khối, gradient ngọc/vàng/rương — `ban-duyet-v2.css`.
- [x] 2a. Màn 00 & 01 Hôm nay học sinh, dọc + ngang | bằng chứng: `src/components/ban-duyet-v2/SanhV2.tsx` + `sanh-v2.css` (nạp lười, lỗi ⇒ rơi về Sảnh cũ qua `SanhHomNay.tsx`); ảnh 390×844, 844×390, 1440×960: 0 tràn ngang, 0 lỗi trang, 0 vùng chạm < 44px.
- [x] 2b. Màn 06 Thần thú của em | bằng chứng: `src/game/than-thu-v2/dao/ThanThuV2.tsx` (cấp, EXP, 6 mốc tiến hoá, 8 loài Bát Linh, vàng thật từ `vang-xem`, nút Đồng hành); mục "Thần thú" mới trên thanh Đảo + cửa vào từ Hôm nay (`game-v2:man-dau=than-thu`).
- [x] 2c. Màn 07 Cửa hàng · Thử đồ | bằng chứng: lớp da `shop/shop-v2.css` (gốc `.ps.ps-v2`), không đổi logic mua/thử/mặc; 4 test shop xanh.
- [x] 2d. Avatar thần thú từ ảnh thật | bằng chứng: `anhThu/anhThuTheoDang` → `public/than-thu-v2/nho/thu-{loài}-{dạng}.webp` ở Hôm nay, Thần thú, trận.
- [x] 2e. Màn 08 Bát Linh Đảo 40/60 | bằng chứng: tỉ lệ 40/60 có sẵn (`TI_MAC_DINH=40`); thêm "Hoá học 12 · Câu k/n", "Cấp N" cạnh máu, nút "CHỐT ĐÁP ÁN" (bỏ "· TUNG CHIÊU", đồng bộ Đoàn), da V2 `dao2/tran-v2.css`.
- [x] 2f. Màn 09 Đoàn Hộ Tống 40/60 | bằng chứng: `--dh2-ti` mặc định 40 có sẵn; thêm "Câu k/8", nút Đánh/Chắn/kỹ năng + Chốt đáp án da V2; ảnh 1280×720, 844×390.
- [~] 2g. Màn 14–21 dashboard thầy | ĐÃ LÀM: 14 Hành trình (`chien-dich/HanhTrinhV2.tsx`: 3 thẻ, chọn khối, 4 chỉ số đếm từ bảng hôm nay, bảng từng em, chương/bài/câu từ kho DẠY HỌC), 15 nút "Bổ sung bài" (mở đúng luồng Bài hôm nay), 16 thẻ "Cần chữa" dẫn tới điểm danh, 18 bảng "Ma trận đề" trong Mở ca (`ma-tran-de/BangMaTranDe.tsx`). CHƯA LÀM (báo ở đầu báo cáo): hộp chọn nhiều bài 15 (máy chủ chưa có lệnh thêm bài vào hành trình theo khối), giao diện mới 16/17/19/20/21.
- [x] 3a. Không placeholder TODO; số thật | bằng chứng: `grep -rn TODO` trên tệp mới = 0; mọi số từ máy chủ/kho; ô bản duyệt chưa có dữ liệu (phút, mục tiêu 8,5+, sẵn sàng +1 bậc, Vận dụng cao) KHÔNG vẽ.
- [x] 3b. Build sau mỗi tệp | bằng chứng: `npx tsc -b` sau từng cụm tệp (0 lỗi) + `npm run build:cf` 5 lượt.
- [!] Giữ màu cũ | `check:mau` ĐẠT; `kiem:mau-giu` còn 3 "vi phạm" = đúng 3 mã màu gốc thầy ra lệnh thêm (#fffef6, #0f3d3a, #f7a800) — CHỜ THẦY XÁC NHẬN, không tự sửa cổng kiểm.
- [x] Test vùng sửa xanh, tsc sạch, commit theo đường dẫn | bằng chứng: 0 test đỏ mới so với nền (so TÊN trên worktree `origin/main`); bộ mới `tests/ban-duyet-v2-0910.test.tsx` 11/11.
- [x] Làm hết các mục trên (trừ phần 2g ghi rõ) | bằng chứng: bảng trong `BAN-DUYET-V2-build-status.md`.
- [x] CHƯA ĐẨY | bằng chứng: chỉ commit cục bộ; không push, không Pages/Worker, không gộp main (đẩy nhánh sẽ kích hoạt các workflow `branches-ignore: [main]`).
- [x] Cho thầy xem | bằng chứng: ảnh Chromium thật (JPG ≤ 150 KB) gửi kèm báo cáo.

## Đợt 2 — TỐI GIẢN 3 APP theo bản vẽ (canvas https://claude.ai/artifact/QgWEUL3q9aVgwydJwLd8oZ)

Thầy hỏi (nguyên văn): "nếu để bạn tối ưu lại giao diện app cho trực quan siêu đẹp và đồng bộ theo đúng thuật toán hiện tại cho cả 3 app học sinh gv và ph thì bạn sẽ làm thế nào để giao diện khoa học rút gọn hết những thứ rườm rà. Vẽ trước cho tôi xem để tôi chốt"
- [x] Vẽ trước cho thầy xem | bằng chứng: canvas 14 màn (00 nguyên tắc, 00b bỏ/gộp, HS 1–5, PH 1–3, GV 1–4).

Thầy chốt (nguyên văn): "1. Bát linh đảo 2. Chốt 3. Bỏ hẳn 4. Thêm 5. Bật lại 6. Giữ nguyên — Build rồi đẩy luôn"
- [x] 1. Tên đảo thống nhất "Bát Linh Đảo" (sửa bảng từ chuẩn + chữ hiển thị "Đảo thần thú") | bằng chứng: 66fa48d (bảng từ chuẩn) + 11dd5e8 (chữ HS, nhãn nguồn câu sai máy chủ, 12 tệp test khoá chữ cũ sửa có chủ đích, 33 tệp/642 test xanh); bộ lọc chữ game PH chặn cả hai tên.
- [x] 2. Phụ huynh 3 mục (Hôm nay · Tiến bộ · Ca kiểm tra), Hôm nay 4 khối | bằng chứng: 688e12f (gộp e6031c1); `tests/ph-v3-toi-gian-0910.test.tsx` xanh.
- [x] 3. Bỏ hẳn BTVN / Bài gia đình giao ở chế độ Game 2.0 (không thêm lối vào) | bằng chứng: `SanhHomNay` (cheDo2) không có prop/nút nào mở `btvn`/`mom`/`bantin`; grep `BTVN|Bài gia đình|bantin` trong `src/components/ban-duyet-v2/` + `SanhBanDo.tsx` = 0; `onChuyenSangBtvn` ở cheDo2 về Sảnh (StudentPortalScreen:2151).
- [x] 4. Máy chủ gửi tầng TỪNG bài cho màn Hành trình của em | bằng chứng: d4af938 (`server/src/hanh-trinh-bai.ts`, `hanhTrinh.bai[]` trong hoa2-sanh, chỉ ĐỌC, không đổi schema) + `tests/hanh-trinh-bai-thu-suc-0910.test.ts`; HS vẽ 4 tầng từng bài (`trangThaiTang`). `vung` để null (chưa có số đo vùng điểm từng bài).
- [x] 5. Bật lại "Thử sức thêm" khi chạy Hành trình (ô trong "Luyện thêm") | bằng chứng: d4af938 (máy chủ cho thêm một chặng hôm nay, tối đa 6 câu) + 0efad47 (ô `OThuSuc` ghi đúng nghĩa mới).
- [x] 6. Giữ nguyên phụ đề Tu luyện | bằng chứng: `SanhV2.tsx:422` + `SanhBanDo.tsx:738` đều "Chỉ dành cho học sinh Nỗ lực".
- [x] Build giao diện HS theo bản vẽ (Hôm nay · Hành trình · Thần thú · Câu đã làm; Làm câu) | bằng chứng: 6f5fc95 (gộp d620c49).
- [x] Build giao diện GV theo bản vẽ (5 mục: Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề + Cài đặt) | bằng chứng: 93f23ba (gộp 7ee7bf4): thanh bên/đáy 5 mục + Cài đặt, màn `GvHomNayScreen`, Hành trình 4 thẻ (một nút "Bổ sung bài"), bỏ hạn 9999; `tests/gv-hom-nay-0910.test.tsx` 12/12. CÒN (ngoài làn): `LichSuCaScreen` chưa có nút Mở ca riêng (tạm đặt ở đầu màn từ App.tsx ≥ 880 px), câu `CHU_CA_TRONG_HOA2` còn ghi "ở thanh bên", chữ "Chữa trên lớp" cũ, "Sửa em" khi đang ở Hành trình không chuyển thẻ.
- [x] Gộp main mới (113000a, ddbe3c0 — tối ưu CPU Sảnh/Hành trình) | bằng chứng: caa450a; 2 xung đột máy chủ xử lý theo cách dựng lười của main; 24 tệp test Hành trình/srs2: 1 đỏ do số lệnh D1 GIẢM 36→30 (cập nhật mốc), 2 đỏ có sẵn trên main.
- [x] Kiểm ca thi mở (chỉ đọc D1) | bằng chứng: 11:50 09/10 so_ca_mo 0, so_luot_dang_lam 0.
- [x] Sửa 4 lỗi đã thấy ở bản V2 (rương lặp số, khối Hành trình vẽ 2 lần, bước "Thử thách +1 bậc", 2 nút Vào thi) | bằng chứng: 6f5fc95 (Sảnh V2 viết lại theo bản vẽ: một khối Hành trình, rương không lặp số câu hôm nay, bỏ bước 3, một nút Vào thi).
- [x] Đẩy luôn: kiểm không có ca thi mở → PR vào main → Actions phát hành Pages + Worker | bằng chứng: D1 12:31 0 ca mở; PR218 gộp `430d356`; Actions `37888980132` SUCCESS (bước kiểm bản sống `/`, `/hs`, `/ph`, `/gv`, `sw-version.json` đạt). Lùi: `git revert -m 1 430d356`.

Thầy nhắn (nguyên văn): "đẩy luôn giao diện mới lên đi bạn ơi" · "làm tiếp xong hết đẩy lên máy chủ luôn nhé"
- [x] Gộp main mới (PR217 Hành trình v6 + ab898ce) | bằng chứng: fbe1d58, cadfc89; nút "Làm bài kiểm đầu/tuần" của main đưa vào Sảnh mới (test mới trong `ban-duyet-v2-0910`).
- [x] Kiểm toàn bộ trước phát hành | bằng chứng: bảng "Kiểm bản phát hành" trong `BAN-DUYET-V2-build-status.md`.

## Đợt 3 — TRUNG TU giao diện 3 app (09/10)

Thầy nhắn (nguyên văn): "bạn hãy quet toàn bộ giao diện app hiện tại và trung tu lại giao diện siêu đẹp, mịn, khoa học đúng cấu trúc của code hiện tại, vẽ cho tôi trước khi build nhé"
- [x] Quét toàn bộ giao diện app hiện tại (HS · PH · GV) | bằng chứng: 3 agent rà mã chỉ đọc trên main 6842acc (bản sống PR221) + 79 ảnh Chromium `scripts/chup-v2`; số đo: HS 31 mức bo góc/40 cỡ chữ/14 kiểu bóng, PH 19/24/~8 kiểu nút, GV 24/~30/10+ họ nút, GV chạy 2 bảng màu (lam/ngọc), tối nửa màn.
- [x] Vẽ bản trung tu (siêu đẹp, mịn, khoa học, đúng cấu trúc code hiện tại) cho thầy xem | bằng chứng: canvas https://claude.ai/artifact/E95grLrwwdGKGjP7uZGFU8 — 24 khung: tổng hợp + bộ khung chung + 11 cặp hiện tại↔trung tu (HS 5, PH 3, GV 3), giữ nguyên màu.
- [!] CHƯA BUILD — chờ thầy chốt bản vẽ + 3 câu hỏi (PH 3 hay 4 mục; GV lấy lam làm màu gốc; thanh bên GV 5 mục) | KẸT: chờ thầy.

Thầy nhắn (nguyên văn, 2 lần): "buid luôn và đẩy luôn nhé" — coi bản vẽ được duyệt nguyên trạng; 3 câu hỏi lấy đúng phương án bản vẽ: PH 3 mục · GV một bảng lam · thanh bên GV 5 mục + Cài đặt.
- [x] Thang chung `src/styles/thang.css` (chỉ kích thước + chuyển động) | bằng chứng: 9f2ec7a (nạp ngay sau tokens.css ở main.tsx; check:mau đạt, tsc 0 lỗi). 3 làn HS · PH · GV đang build song song trên worktree riêng.
- [x] Build HS theo bản vẽ (Hôm nay · Hành trình · Ôn lại · Của em · Làm câu) | bằng chứng: ade11921 (gộp c8e8590); ảnh scratchpad/hs-lan/anh-moi (0 tràn, 0 chạm <44). Chưa làm: dời nút Chốt của Đoàn (cột thao tác chật).
- [x] Build PH theo bản vẽ (3 mục · Hôm nay · Tiến bộ · Ca kiểm tra · Đổi SBD có hỏi lại · tối) | bằng chứng: 19ce9f62 (gộp 18e7694); ảnh scratchpad/ph-lan/anh. Chưa gỡ 64 luật CSS chết mang màu (cổng giữ màu tính là xoá màu).
- [x] Build GV theo bản vẽ (5 mục + Cài đặt · một bảng lam · Hôm nay · Học sinh · Mở ca · tối theo nút) | bằng chứng: dc206394 + 6c47a415 (gộp bd54f6d); ảnh scratchpad/anh-gv. Ghi chú: chế độ 2.0 vốn đã 5 mục (ảnh '9 mục' trước là do trang chụp chưa bật cờ).
- [x] Kiểm toàn bộ (tsc, vitest so nền main, cổng màu/giao diện, build:cf, ảnh) | bằng chứng: tsc 0 · server tsc 0 · check:mau đạt · kiem:mau-giu 0 · soi:giao-dien 0 lỗi · build:cf SW 13/13, 2994 KB (4886a6d: 3 mảnh chỉ của thầy ra kho chạy-lúc, gộp 3 làn đã đẩy lên 3003 KB) · full vitest 152 đỏ vs main a89b697 151 — 1 khác = test đo tốc độ btvn-nang-do 'dưới 200 ms', chạy riêng đạt · D1 20:37: 0 ca mở / 0 lượt.
- [x] Đẩy: kiểm ca mở → PR → main → Actions | bằng chứng: D1 20:42 0 ca mở/0 lượt; PR223 gộp `dc62bde`; Actions `37938839127` SUCCESS (16 bước, gồm kiểm Worker + Pages sống cùng commit). Lùi: `git revert -m 1 dc62bde`.

## Đợt 4 — sửa theo ảnh thầy gửi (09/10 tối)

Thầy nhắn (nguyên văn, kèm ảnh Luyện thêm): "tôi muốn bạn tô màu đẹp xịn vào phần này"
- [x] Tô màu các ô Luyện thêm (HS · Hành trình) | bằng chứng: d2fa153c — mỗi ô một sắc Bát Linh (ngọc/vàng/lam-ngọc) + biểu tượng; chỉ THÊM luật, kiem:mau-giu 0; ảnh 22-hs-hanh-trinh-* (sáng/tối).

Thầy nhắn (nguyên văn, kèm ảnh GV Hành trình): "phần này phải tối ưu lại, tôi chỉ cần giữ lại phần dạy học. Phần câu cần chữa trùng tu lại bỏ hết những thứ không cần thiết, thiết kế trực quan khoa học phù hợp với các chức năng hiện tại"
- [x] Hành trình của thầy chỉ giữ Dạy học | bằng chứng: 757ea1a1 (gộp b952e008) — thẻ Nhịp hôm nay + Chiến dịch đã giao bỏ khỏi Hành trình; chức năng chuyển chỗ (Hôm nay, Học sinh lọc khối, Cài đặt › Mở danh sách chiến dịch).
- [x] Trùng tu Cần thầy chữa | bằng chứng: 757ea1a1 — MỘT danh sách gộp 6 nguồn, nhiều em đứng trước, mỗi dòng một nút mở đúng màn chữa sẵn có; 3fe9ff59 — Hôm nay/thanh bên/danh sách cùng MỘT số (trước Hôm nay chỉ đếm 3 nhóm), thanh lọc khối đếm "chỗ".
Thầy nhắn (nguyên văn): "kiểm tra đầu giờ giữ lại nữa nhé"
- [x] Giữ Kiểm tra đầu giờ | bằng chứng: Hành trình còn 3 thẻ Dạy học · Kiểm tra đầu giờ · Cần thầy chữa; ảnh 14-gv-dau-gio*.

Thầy nhắn (nguyên văn, kèm ảnh Câu đã làm chồng chữ): "trùng tu lại chỗ này"
- [x] Sửa Câu đã làm (HS, bố cục ngang/máy tính) | bằng chứng: 40e26c71 — nguyên nhân gốc: lưới 2 cột (giao-dien-day-du.css) trong khung cuộn cố định cao ⇒ thẻ đè nhau; nay một cột, hàng lọc xuống dòng, nút Về/nhãn đọc rõ nền sáng; ảnh 25-hs-cau-da-lam-* 0 lỗi trang/0 tràn.
- [x] Phát sinh: precache vượt trần sau gộp (3039 KB) | bằng chứng: 25c3ebf3 — 2 mảnh chung chỉ của thầy ra kho chạy-lúc ⇒ 147 tệp / 2996 KB, SW 13/13.
- [!] Phát sinh, CHƯA sửa (ngoài phạm vi): màn Hoá 2.0 bố cục ngang "thấp" co cả màn bằng `zoom` ⇒ nút 48 px còn ~36 px trên điện thoại xoay ngang (có từ trước, mọi màn ngang).

## Đợt 5 — Hành trình thầy: nhịp học + hồ sơ từng em + số giây (09/10 khuya)

Thầy nhắn (nguyên văn): "hành trình để lại chỗ nhịp học, học sinh chưa làm và chưa hoàn thành đủ ưu tiên hiện lên đầu nhé, bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây làm mỗi câu, mọi thứ về học sinh đó."
- [x] Hành trình để lại chỗ nhịp học | bằng chứng: c8f0602a (gộp 88ab6dce) — thẻ Nhịp học (Dạy học · Nhịp học · Kiểm tra đầu giờ · Cần thầy chữa), lọc khối + tìm; ảnh 14-gv-nhip-*.
- [x] Em chưa làm + chưa hoàn thành đủ ưu tiên lên đầu | bằng chứng: nhóm Chưa làm câu nào → Chưa đủ mức → Đủ mức (→ Chưa có mức); `tests/hanh-trinh-nhip-ho-so-0910.test.tsx` xanh. Hôm nay › Xem danh sách / dòng khối ⇒ Nhịp học.
- [x] Bấm từng em ⇒ toàn bộ lịch sử, câu sai, số giây mỗi câu, mọi thứ về em | bằng chứng: b4712f81 lệnh CHỈ ĐỌC `/gv/lich-su-lam-cau` (giây: cột giay → raw ms → chi_tiet_cau → ước tính 'uoc' → null) + c8f0602a tấm `HoSoLamCauEm` (Câu sai · Toàn bộ lịch sử theo ngày · nút Mở hồ sơ đầy đủ); `tests/lich-su-lam-cau-0910.test.ts` xanh.
Thầy nhắn (nguyên văn): "Phần ai sai trong chiếu lên bảng cung hiển thị cả số giây từng làm câu đó"
- [x] Chiếu lên bảng › Ai sai: hiện số giây từng em làm câu đó | bằng chứng: b4712f81 — máy chủ dùng ms đo thật trước ước tính, ca thi lấy thêm chi_tiet_cau.giay; tờ chiếu: "N lần sai · trung bình x giây", chip nào cũng có giây hoặc "chưa đo giờ"; `tests/ai-sai-to-chieu-0510`, `ai-sai-cau-may-chu-0510` xanh.
- [x] Build + đẩy (kiểm ca mở trước) | bằng chứng: 07:36 D1 có 1 ca mở (11L1-L2) ⇒ HOÃN; 08:15 0 ca mở/0 lượt ⇒ gộp PR227 `a9ec700`, Actions `38012501511` SUCCESS. Lùi: `git revert -m 1 a9ec700`.

## Đợt 6 — sửa chữ chìm màn "Cùng gỡ câu này" (10/10)
Thầy nhắn (nguyên văn, kèm ảnh): "Không nhìn thấy chữ"
- [x] Sửa chữ chìm màn Cùng gỡ câu này (HS, nền sáng) | bằng chứng: nguyên nhân gốc — hoc-sinh.css đổi --tlu-* sang bảng sáng nhưng chua-cau-sai.css viết cứng nền xanh than ⇒ chữ tối trên nền tối; ô nhập số chữ trắng trên nền sáng. Thêm luật nền sáng bằng --tlu-* (nền tối giữ nguyên); kiem:mau-giu 0; ảnh 26-hs-cung-go-* 0 lỗi trang/0 tràn/0 chạm < 44.
- [x] Phát sinh: điện thoại dọc tràn ngang 358 px ở màn đang làm bước | bằng chứng: ô lưới cột phụ min-width:auto nở theo dải bước ⇒ `.ccs-cot-phu > * { min-width: 0 }`; chụp lại 0 tràn.

## Đợt 7 — trùng tu toàn bộ app học sinh (không thần thú) theo bản vẽ (11/10)
Bản vẽ: https://claude.ai/artifact/5v8vXw5zBzw53FkpCvMknC
Thầy nhắn (nguyên văn): "quét lại giao diện app học sinh, vẽ lại trùng tu toàn bộ app học sinh siêu đẹp , wow và khoa học cực kì với code hiện tại" · "buid và đẩy luôn nhé"
Giả định (thầy chưa trả lời 3 câu): mục 4 = Kết quả, Của em vào ảnh đại diện · tầng "Nền · Hiểu · Vận dụng · Tổng hợp" · Bài tập về nhà chỉ hiện khi có bài.
- [x] Hôm nay (vòng tiến độ, 5 chặng, một nút chính, việc theo lịch, ca mở ⇒ Vào thi là nút chính) | bằng chứng: eed66e0b; ảnh 30-hs-moi-hom-nay-*, 30-hs-moi-ca-mo-* (0 lỗi trang/0 tràn). CHƯA làm: biểu đồ 7 ngày (cần máy chủ trả số câu từng ngày).
- [x] Hành trình (thang 4 tầng + từng bài 4 nấc) | bằng chứng: eed66e0b; ảnh 30-hs-moi-hanh-trinh-*.
- [x] Ôn & sửa (một tên mỗi việc) | bằng chứng: eed66e0b — Tự chữa lỗi · Câu đã làm · Tu luyện · Luyện lại từ bài kiểm tra.
- [x] Kết quả + tấm Của em | bằng chứng: eed66e0b; ảnh 30-hs-moi-ket-qua-*, 30-hs-moi-cua-em-*. CHƯA làm: điểm + đường tiến bộ ngay trên mục Kết quả (đang dẫn vào màn Ca kiểm tra), nút giao diện Sáng/Tối riêng cho học sinh.
- [x] Làm câu → Sau khi nộp → Xong chặng | bằng chứng: eed66e0b; ảnh 30-hs-moi-lam-* (điện thoại: khối nút ghim đáy).
- [x] Màn con cùng bảng màu (Cùng gỡ câu này, Câu đã làm) — sửa chữ chìm | bằng chứng: eed66e0b; ảnh 26-hs-cung-go-* (nền giấy, chữ mực), Câu đã làm chip chữ màu thẻ. Tu luyện: Codex vừa làm lại (7d7c3c9f, d5b07318) — giữ nguyên.
- [x] Build + đẩy (kiểm ca mở trước) | bằng chứng: PR238 gộp `0c31532`, Actions `38162406893` SUCCESS (bước "Kiểm ca thi" của CI đạt: 0 ca mở/0 lượt; khoá Cloudflare của phiên hết hạn nên phiên không tự đọc D1). Lùi: `git revert -m 1 0c31532`.

## Đợt 8 — Tu luyện + chữa lỗi HS · lịch sử bài hằng ngày GV · hồ sơ em · app phụ huynh (12/10)
Thầy nhắn (nguyên văn, kèm ảnh màn "Cùng gỡ câu này" trạng thái "Cần thêm bài luyện đúng chỗ"):
"trùng tu lại giao diện mục tu luyện của app học sinh, bỏ phần nhưng câu cần gỡ, thay những từ đảo đoàn, bia bằng những từ phù hợp, mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được."
"Trùng tu giao diện giáo viên cho đẹp hơn khoa học hơn, tôi cần biết lịch sử học sinh làm bài tập hàng ngày, tính từ 12/10. Học sinh thiếu nhiều ngày nhất hiển thị lên đầu, làm thiếu nhiều câu nhất trong từng ngày."
"Khi tôi bấm vào học sinh tôi muốn biết mọi thông tin làm bài của học sinh, câu sai, câu đúng, câu đã làm, câu đã ôn tôi muốn biết rõ học sinh đó chăm chỉ hay lười biếng hay đối phó làm bài tập mọi thứ phải hiển thị khoa học trực quan đẹp măt"
"Trùng tu giao diện app phụ huynh, cho phụ huynh biết nhiều thông tin cần thiết nữa về con, số câu làm đúng, làm sai, thời gian làm từng câu gợi ý nhắc, bỏ mục thầy cần chữa, làm app phụ huynh siêu đẹp trực quan để phụhuynh theo dõi được con toàn diện."
- [x] HS · Tu luyện trùng tu giao diện | bằng chứng: 7ee259b6 (tu-luyen-hs.css chỉ thêm, phạm vi body[data-hoc-tap=hs]); ảnh 40-hs12-tu-luyen-* 3 khổ × sáng/tối, 0 lỗi/0 tràn/0 chạm<44.
- [x] HS · Tu luyện bỏ phần "câu cần gỡ" | bằng chứng: 7ee259b6 xoá ChoChuaCuaEm.tsx; test tu-luyen-ten-nguon-1210 khoá không còn khối.
- [x] HS · thay chữ Đảo/Đoàn/Bi-a bằng tên nguồn phù hợp | bằng chứng: 7ee259b6 — Học theo kế hoạch / Ôn theo kế hoạch / Luyện tập trước đây (src/lib/nhan-nguon-lan.ts, cùng bộ Câu đã làm).
- [x] HS · Chữa lỗi hiển thị chuẩn, học sinh chữa được (kể cả khi chưa có bài luyện bước) | bằng chứng: 55e6548a + ce83a952 — Chữa trực tiếp câu gốc: Xem lại → Tự làm lại → Đáp án và lời giải (đáp án theo quyền /game-v2/hoa2-cau-chi-tiet, câu khoá không lộ); test tu-chua-truc-tiep-1210 (9). CHƯA: lần tự làm lại không ghi sổ (cần lệnh máy chủ mới).
- [x] GV · trùng tu giao diện đẹp, khoa học hơn | bằng chứng: 6583ac37…3f50f455 — thẻ Bài hằng ngày (bảng nhiệt), Hồ sơ làm bài trùng tu, lối vào ở Hôm nay của thầy; ảnh 40–48-gv-*.
- [x] GV · lịch sử bài hằng ngày từ 12/10; thiếu nhiều ngày nhất lên đầu; ngày thiếu nhiều câu nhất | bằng chứng: POST /gv/bai-hang-ngay (chỉ đọc) — xếp số ngày thiếu ↓ → tổng câu thiếu ↓ → thiếu hôm nay ↓; mức Gói 7 ước tính theo CAU_TOI_THIEU (cờ mucUocTinh); test bai-hang-ngay-*.
- [x] GV · bấm em ⇒ mọi thông tin: câu sai/đúng/đã làm/đã ôn; chăm chỉ · lười · đối phó (khoa học, trực quan) | bằng chứng: POST /gv/ho-so-thai-do — 6 tín hiệu có số + ngưỡng (NGUONG_THAI_DO), kết luận Chăm chỉ / Chưa đều / Có dấu hiệu đối phó / Chưa đủ dữ liệu.
- [x] PH · trùng tu: số câu đúng/sai, thời gian từng câu, gợi ý nhắc con | bằng chứng: 39fbbf20 + 76094e82 — POST /ph/con-tong-quan (chỉ đọc, xác thực như /ph/hoc-2, bỏ embargoed + ca chưa công bố, không trả đáp án); b4ea4d61 đã làm/mức dùng chung phép tính bảng của thầy; ảnh 40-ph1210-*.
- [x] PH · bỏ mục "Thầy cần chữa" | bằng chứng: 76094e82; test omni-3-ph-tien-do đòi vắng.
- [x] Build + đẩy (kiểm ca mở trước) | bằng chứng: PR240 gộp `046b5584`, Actions `38192685162` SUCCESS (17 bước, Kiểm ca thi đạt; khoá Cloudflare của phiên vẫn lỗi 9109 nên dựa cổng CI). Lùi: `git revert -m 1 046b5584`.

## Đợt 9 — Bài mới trong 7 ngày · Thầy tự chữa (chiếu đề) (12/10)
Thầy nhắn (nguyên văn, kèm ảnh thẻ "Bài mới trong 7 ngày"):
"phần này tôi muốn bạn trùng tu lại toàn bộ bạn quyết định sao cho khoa học đầy đủ và đẹp nhất trực quan"
"mục cần chữa cho tôi một phần tự chữa, phần này cho tôi chọn đề trong Mục dạy học (trắc nghiệm khách quan trả lời ngắn) khi chọn đề nào thì đề đó hiển thị tất cả các câu chiếu lên máy chiếu, ưu tiên đẩy câu đúng sai và tính toán lên đầu tiên hiển thị, bảng hiển thị đầy đủ mọi thứ như mục chiếu lên bảng (đúng chuẩn)"
- [x] GV · trùng tu toàn bộ thẻ "Bài mới trong 7 ngày" (khoa học, đầy đủ, trực quan) | bằng chứng: 8c5b75a0 — thẻ chọn bài (hạn, còn N ngày), 6 ô số, dải tiến độ lớp, Danh sách chữa (thanh tỉ lệ sai, lọc tình trạng/loại câu, xếp ưu tiên/tỉ lệ sai, Học sinh cần hỗ trợ 3 nhóm), Tiến độ học sinh (thanh, tìm tên, 4 cách xếp), tấm soạn phần chữa; test goi-bai-7-trung-tu-1210 (16); ảnh 50–57-gv-g7-*.
- [x] GV · Cần thầy chữa có phần "Thầy tự chữa": chọn đề trong Dạy học (TN / Đúng–sai / Trả lời ngắn) | bằng chứng: 55156900 — nguồn đúng cây Dạy học (`khoDayHoc` → `dsBaiCuaKhoi`), chip ba tờ có số câu; ảnh 50/51-ttc-*.
- [x] GV · chọn đề ⇒ chiếu TẤT CẢ câu lên máy chiếu, câu đúng–sai + tính toán lên đầu | bằng chứng: 55156900 — xếp Đúng–sai có tính toán → Đúng–sai → tính toán → còn lại (giữ thứ tự đề); test thay-tu-chua-1210 (14).
- [x] GV · tờ chiếu đầy đủ như Chiếu lên bảng (lời giải, thống kê lớp, ai sai + giây) | bằng chứng: dùng lại `to-chieu.ts` → `KhungXemPhieu` (G lời giải · T thống kê `/gv/thong-ke-lop-cau` · X ai sai `/gv/ai-sai-cau`); ảnh 52-ttc-to-chieu-*-1920. Thêm 487bde44: tên nơi làm mới trên tờ (bỏ Đảo/Đoàn/Bi-a). Nút Đóng 34 px của khung phiếu GIỮ NGUYÊN (test m3-c6-khung-xem-phieu-1909 khoá).
- [x] Build + đẩy đợt 9 (kiểm ca mở trước) | bằng chứng: PR242 gộp `4187009d`, Actions `38198445809` SUCCESS (17 bước, Kiểm ca thi đạt). Lùi: `git revert -m 1 4187009d`.

## Đợt 10 — Hành trình còn 2 mục · Nhịp học lên Hôm nay (12/10) — VẼ DUYỆT TRƯỚC
Thầy nhắn (nguyên văn, kèm ảnh thẻ Bài mới trong 7 ngày: "Học sinh nhận bài 0 · Câu cần chữa 132"):
"Chỗ này rất khó hiểu, chốt lại trong phần này tôi chỉ cần mục dạy học, gọi lên bảng đầu giờ và chữa cấu khó tính toán và câu học sinh cần chữa. Bạn hãy thu gọn tối giản hết lại thành 2 mục và làm thật trực quan dễ hiểu khoa học đẹp mắt."
"Mục hôm nay hiển thị rõ cho tôi vô cùng đẹp Nhịp học, phải làm rất đẹp, tôi nhìn vào thấy ngay học sinh nào chăm học sinh nào lười. Vẽ cho tôi duyệt trước khi buiild nhé"
- [x] Vẽ bản duyệt: Hành trình 2 mục (Dạy học & đầu giờ · Chữa bài) | bằng chứng: artifact 13511ZX2Q9tamm65z5JDRu — khung HanhTrinh-DayHoc (4 bước: điểm danh · gọi lên bảng đầu giờ · dạy và chiếu câu · tick bài + bài đang giao) và HanhTrinh-ChuaBai (Học sinh cần chữa · Chữa câu khó & tính toán).
- [x] Vẽ bản duyệt: Hôm nay của thầy có Nhịp học (thấy ngay em chăm / em lười) | bằng chứng: artifact 13511ZX2Q9tamm65z5JDRu — khung Main (máy tính) + HomNay-DienThoai: thanh 262 em Chăm/Chưa đều/Lười, ô Đối phó, Lười nhất · Chăm nhất có dải 12 ngày, Theo lớp.
- [x] Chờ thầy duyệt bản vẽ — CHƯA BUILD | bằng chứng: thầy 12/10: "duyệt bản vẽ, buid và đẩy luôn nhé" (duyệt cả ngưỡng Chăm ≥ 80% ngày đủ mức · Lười ≤ 40% hoặc 3 ngày liền không làm · Chưa đều ở giữa).
- [x] Build theo bản đã duyệt + đẩy (kiểm ca mở) | bằng chứng: làn A b04b2282/5d63d2c2 · làn B cd9a5616/e92f74c8 · làn C cc2f46e4 · nhãn Lười fb8ff967; vitest 15.162 test 0 đỏ mới; PR245 gộp `0e06f48b`, Actions `38216256164` SUCCESS (Kiểm ca thi đạt). Lùi: `git revert -m 1 0e06f48b`.
- [x] Thầy nhắn thêm: "chữa câu khó và tính toán cũng phải chiếu lên bảng theo chuẩn nhé" ⇒ bản vẽ: nút "Chiếu lên bảng", mỗi câu gợi ý em làm sai (có mặt) để gọi lên bảng, Đạt / Chưa đạt ghi sổ; khung ToChieu-ChuaCauKho (1920×1080, đã gọi em: cột 1/3 đen + thẻ tên) | bằng chứng: artifact 13511ZX2Q9tamm65z5JDRu bản 6. BUILD: chờ thầy duyệt.
- [x] Thầy nhắn thêm: "dữ liệu phần này tính từ 1/10 cho tôi nhé." (ảnh tấm Hồ sơ làm bài) ⇒ đổi mốc 12/10 → 1/10 cho Bài hằng ngày, Hồ sơ làm bài, app phụ huynh | bằng chứng: 3ec927a9; PR244 gộp `0ddef340`, Actions `38210173304` SUCCESS (Kiểm ca thi đạt). Lùi: `git revert -m 1 0ddef340`.

## Đợt 11 — bỏ Tự kiểm kiến thức ở app học sinh (12/10)
Thầy hỏi "Chỗ tự kiểm này là gì" (ảnh thẻ Bài học trong 7 ngày: Tự kiểm kiến thức · Tờ 1/2/3 · Kiến thức bài trước 0/164 kỹ năng), rồi nhắn: "Bỏ chỗ này đi."
- [x] Bỏ khối Tự kiểm kiến thức (Tờ 1/2/3), dòng "Kiến thức bài trước … kỹ năng", đoạn giải thích tiến độ; gỡ màn ManKiemGoi7 (không còn lối vào). Máy chủ goi-bai-7-kiem.ts giữ nguyên (điểm cũ còn trong sổ) | bằng chứng: TheGoi7/HocTapHomNay/StudentPortalScreen; test goi-bai-7-giao-dien-1010 sửa có chủ đích (khẳng định vắng); tsc sạch; 14 đỏ liên quan trùng lần chạy đợt 10; check:mau, kiem:mau-giu 0, soi:giao-dien 0 LỖI, build:cf 13/13.
- [x] Build + đẩy (kiểm ca mở) | bằng chứng: PR247 gộp main `7ce754c478503844af67a58930174e8a3f6e9ede`, Actions `38223806315` SUCCESS 08:37 UTC (bước Kiểm ca thi đạt, Worker + Pages sống cùng commit). Lùi: `git revert -m 1 7ce754c4`.

## Đợt 12 — Điểm danh + bảng nhịp học trên bản chiếu · bảng Chăm/Lười ở app học sinh (12/10) — VẼ DUYỆT TRƯỚC
Thầy nhắn (nguyên văn): "Tôi muốn bạn trùng tu lại phần điểm danh học sinh, tôi muốn mỗi buổi lên lớp học sinh sẽ làm điểm danh đầu tiên, khi học sinh điểm danh xong sẽ hiện luôn thống kê lười và chăm chỉ rõ ràng đầy đủ trong bản chiếu, trùng tu lại thật đẹp rõ ràng. Vẽ cho tôi duyệt trước khi tôi quyết định build."
"Ở app học sinh hiện rõ một bảng ngay đầu thông tin lười hay chăm chỉ trên app đầy đủ siêu đẹp và chính xác, ghi thêm 1 câu trong bảng thầy cũng thấy điều này."
- [x] Vẽ: bản chiếu khi đang điểm danh (mã/QR + em đã điểm danh tô theo nhóm) | bằng chứng: artifact PeaKFgTjj2wgxsTQRDQkt3 khung Main (1920×1080).
- [x] Vẽ: bản chiếu khi điểm danh xong — thống kê Chăm/Chưa đều/Lười của lớp đầy đủ | bằng chứng: khung ChieuNhipLop (ba cột, em vắng mờ, phím H ẩn tên nhóm Lười).
- [x] Vẽ: màn thầy bước Điểm danh trùng tu | bằng chứng: khung GV-DiemDanh (mã + QR, có mặt theo nhóm, vắng đang Lười, Vừa điểm danh, nút Xong điểm danh · chiếu Nhịp học của lớp).
- [x] Vẽ: app học sinh — bảng Chăm/Lười ngay đầu Hôm nay + câu "Thầy cũng thấy bảng này" | bằng chứng: khung HS-Cham + HS-Luoi. ĐỀ XUẤT ĐỔI LUẬT chờ duyệt: "3 ngày liền không làm" chỉ xét trong 7 ngày gần nhất (luật hiện hành xét cả khoảng ⇒ em không thể thoát nhóm Lười).
- [x] Thầy nhắn thêm: "cho tôi bấm vào từng học sinh hiện hồ sơ làm bài như trong app luôn nhé, nối với phần đó" ⇒ bản vẽ thêm khung ChieuHoSoEm (bấm tên em ở bản chiếu/màn thầy ⇒ hồ sơ trượt ra) | bằng chứng: artifact PeaKFgTjj2wgxsTQRDQkt3 bản 7.
- [x] Chờ thầy duyệt — CHƯA BUILD | bằng chứng: thầy 12/10 "duyệt bản vẽ buid luôn nhé". Bản chiếu mặc định hiện tên, phím H ẩn tên nhóm Lười. Thầy thêm: "trượt ra phải đầy đủ chi tiết không thiếu gì giống như trong này nhé" (ảnh tấm Hồ sơ làm bài app thầy) ⇒ bản chiếu dùng CHÍNH tấm HoSoLamCauEm. LUẬT THẦY CHỐT: "6 ngày liền làm đủ mới thoát nhóm lười nhé." ⇒ Lười = (≤ 40% ngày đủ mức HOẶC có 3 ngày liền không làm) VÀ chuỗi đủ mức liền gần nhất < 6 ngày; chuỗi ≥ 6 ⇒ thoát Lười (≥ 80% Chăm, còn lại Chưa đều). Bỏ đề xuất cửa sổ 7 ngày.
- [x] Luật nhóm: đủ mức 6 ngày liền mới thoát Lười — một phép thuần `server/src/nhip-hoc-luat.ts` dùng chung máy chủ + app thầy + app học sinh (`ngayLienThoatLuoi: 6`) | bằng chứng: commit a36eeb61; test luật 6 ngày (5 ngày vẫn Lười, 6 ngày thoát, hôm nay đủ được cộng).
- [x] Hồ sơ làm bài: nhóm là nhãn chính + chip "Có dấu hiệu đối phó" + Lười kèm "đủ mức liền x/6" (`/gv/ho-so-thai-do` chỉ THÊM `nhomNhip`, `coDoiPho`, `chuoiDuGanNhat`) | bằng chứng: a36eeb61.
- [x] App học sinh: bảng "Nhịp học của em · từ 01/10" đầu Hôm nay (Chăm / Chưa đều / Lười / chưa đủ dữ liệu, dải ngày, 3 ô số, tốc độ làm bài, Việc tiếp hoặc Cách ra khỏi nhóm Lười x/6, "Thầy cũng thấy bảng này.") + lệnh CHỈ ĐỌC `POST /hs/nhip-hoc {token}` (SBD lấy từ token, bỏ lượt embargoed / ca chưa công bố, chỉ số đếm) | bằng chứng: 9bf42b9d; 17 ảnh scratchpad/lan-12a/anh 0 lỗi 0 tràn 0 chạm < 44.
- [x] Điểm danh bước 1 theo bản vẽ GV-DiemDanh (mã + QR, có mặt theo nhóm, vắng đang Lười, Vừa điểm danh bấm ⇒ hồ sơ, nút Xong điểm danh · chiếu Nhịp học của lớp; giữ thêm em tay, bớt em nhầm, kết thúc buổi) | bằng chứng: 614edf1b.
- [x] Hai bản chiếu React toàn màn (đang điểm danh: ô tên tô nhóm + đủ mức x/y; Nhịp học của lớp: thanh nhóm, ba cột, em vắng mờ, H ẩn tên Lười, → sang Gọi lên bảng) + bấm tên ⇒ CHÍNH tấm HoSoLamCauEm đầy đủ | bằng chứng: 614edf1b; 12 ảnh scratchpad/lan-12b/anh 0 lỗi 0 tràn 0 chạm < 44.
- [x] Build + đẩy đợt 12 (kiểm ca mở) | bằng chứng: gộp 3a9f8db0; tsc 0 · server tsc 0 · check:mau sạch · kiem:mau-giu 0 · soi:giao-dien 0 LỖI · build:cf SW 13/13 152 tệp / 2882 KB; vitest toàn bộ 15219 test, 164 đỏ — so tên với gop-tukiem/gop-dot10: 0 đỏ mới; ảnh gộp (82/83/71) 0 lỗi 0 tràn 0 chạm < 44, hồ sơ trên bản chiếu hiện chữ luật mới. PR248 gộp main `2c58022aad76a3fe71eb55754fd2ceed705fc9cd`, Actions `38233949637` SUCCESS 10:11 UTC (Kiểm ca thi đạt, Đẩy Pages đạt, Worker + Pages sống cùng commit). Check "Cloudflare Pages" (bản xem trước) của PR đỏ "Deploy failed" — không tái hiện (dựng sạch npm ci + build:cf đạt), bước Đẩy Pages thật đạt ⇒ lỗi phía bản xem trước Cloudflare. Lùi: `git revert -m 1 2c58022a`.

## Đợt 13 — sửa lỗi không vuốt được ở màn làm câu · trùng tu màn làm bài (VẼ DUYỆT TRƯỚC) · soát số câu giao / số câu Lười–Chăm (12/10)
Thầy nhắn (nguyên văn, kèm ảnh màn "Câu 4 trong 5 câu" Đúng–sai và ảnh Hôm nay "2 trên 24 câu · 31 câu tự làm · lịch tối thiểu 32 câu"): "học sinh báo app học sinh không vuốt lên được, bạn check và khắc phục triệt để lỗi này nhé, Đồng thời trùng tu lại giao diện làm bài của học sinh cho thật khoa học phải rất thân thiện, tối ưu tối đa cho màn hình dọc và phải thật đẹp mịn mắt. Vẽ trước tôi xem trước khi build nhé."
"Xem xét lại kĩ lưỡng việc giao câu của code, ví dụ trong ảnh học sinh làm 24 câu nhưng lại báo 31 câu làm, kiểm tra kĩ xem thống nhất chưa, sau đó check lại kĩ số câu lười chăm từng ngày xem đã hiển thị chính xác chưa phải rất cẩn thận chỗ này để học sinh thấy chính xác làm đủ làm thiếu từ đó đánh giá chính xác lười và chăm."
- [x] Tìm nguyên nhân gốc lỗi "không vuốt lên được" ở app học sinh và sửa triệt để (tái hiện bằng máy: cảm ứng 390×844) | bằng chứng: nguyên nhân gốc — màn con là lớp `fixed inset-0 overflow-y-auto` phủ trên trang Hôm nay vẫn cuộn được ⇒ cú vuốt trôi xuống trang ẩn (đo: màn đứng 0 px, trang ẩn trôi 511 px); thanh trên Hôm nay rộng 393 px ⇒ Chrome điện thoại nới khung nhìn (390×844→393×851, 360×800→393×874) ⇒ thanh đáy/nút Nộp lọt mép dưới; Phòng chờ `touch-action:none`. Sửa 54221311: khoá trang sau màn con (`html[data-khoa-cuon]`, gỡ khi đóng), `overscroll-contain`, thanh trên co vừa máy ≤ 420 px, `.ht2{overflow-x:clip}`, Phòng chờ `pan-y`. `scripts/kiem-vuot-hs.mjs` 15/15 màn đạt ở 390×844 · 360×800 · 844×390 (trước 2/15, 0/4).
- [x] Build + đẩy bản sửa lỗi vuốt (kiểm ca mở) | bằng chứng: PR250 gộp main `11f19a9a7d5584cb1e18e09967ecf0910b3b8c67`, Actions `38247621128` SUCCESS 12:22 UTC (Kiểm ca thi đạt, Worker + Pages cùng commit); vitest toàn bộ 15254 test 0 đỏ mới. Lùi: `git revert -m 1 11f19a9a`.
- [x] Vẽ màn làm bài học sinh trùng tu (dọc, thân thiện, khoa học, mịn mắt) — CHỜ THẦY DUYỆT, CHƯA BUILD | bằng chứng: artifact NqZ2D6F1APXMHyzvZy4FmU bản 8 — 7 khung 390 px: Đúng–sai đang làm, Trắc nghiệm, Trả lời ngắn (4 ô + bàn phím số), Câu mới tự làm/học cách giải, phản hồi sai, phản hồi đúng, Xong chặng.
- [x] Thầy duyệt bản vẽ màn làm bài ⇒ build | bằng chứng: thầy 12/10 "Chốt build đẩy lên luôn đi".
- [x] Build màn làm bài theo bản vẽ NqZ2D6F1APXMHyzvZy4FmU | bằng chứng: db9c640e (LamCau.tsx mới, không đụng TheCau; đáp án gửi đúng định dạng cũ), vuốt 23/23 (390×844, 844×390), 26 ảnh 0 lỗi 0 tràn 0 chạm < 44; gộp 38ffaca1: tsc 0 · check:mau · kiem:mau-giu 0 · soi 0 LỖI · build:cf 13/13 153 tệp/2914 KB.
- [x] Đẩy đợt 13 (kiểm ca mở) | bằng chứng: PR249 gộp main `713d424bba358ce187d43ea3b776658d542837ca`, Actions `38244533452` SUCCESS 11:53 UTC — soCaMo 0, schemaGoi7 soLenhChiThem 12 (bảng goi_bai_7_muc_ngay), Worker + Pages cùng commit, apGoi7 262 em. Lùi: `git revert -m 1 713d424b`.
- [x] Soát việc giao câu: 24 câu (vòng) vs 31 câu tự làm vs lịch tối thiểu 32 câu vs còn 22 câu — chỉ ra từng con số lấy từ đâu, thống nhất một nguồn | bằng chứng: 24 = `CAU_TOI_THIEU[tầng tính trên phạm vi bài mới]`; 31 = kế hoạch `chonGoi7` xếp đủ câu mới theo lịch gói (vượt mức); 32 = quota lịch gói. Sửa (eb4f1cd8, 1b90a247): M = max(mức tầng, Σ lịch câu mới) chốt đầu ngày vào bảng chỉ-thêm `goi_bai_7_muc_ngay`; kế hoạch đúng M − đã làm (`chiTrongMuc`); "đạt" = đã làm ≥ M. Thêm: máy em đồng bộ gói theo tên lớp (9c43299b).
- [x] Soát số câu Lười/Chăm từng ngày (mức tối thiểu + đã làm mỗi ngày) khớp đúng con số học sinh thấy là mục tiêu hôm nay | bằng chứng: `mucCuaNgay` hàm duy nhất cho /gv/bai-hang-ngay, /gv/ho-so-thai-do, /gv/nhip-hoc, /hs/nhip-hoc, /ph/con-tong-quan; test đối chiếu 3 ca (Hành trình 10/24 · Gói 7 lịch 3<24 ⇒ 24 · Gói 7 lịch 32>24 ⇒ 32) khớp sảnh em; hai phép đếm đã làm (máy em / thầy) cùng số; ngày Gói 7 cũ chưa chốt ⇒ ước tính max(24, lịch ngày ấy) có chữ "mức ước tính".
- [x] Thầy nhắn thêm (ảnh app HS "0 trên 24 câu · 24 câu tự làm · 4 chặng" và Hồ sơ làm bài thầy "Hôm nay 0/36 câu", lịch ngày x/36, em Nguyễn Khánh Ngọc SBD 10030 Lớp 10): "trên app học sinh báo 24 câu nhưng đo theo ngày hôm nay lại hiện 0/36 câu" ⇒ mức hằng ngày em được giao và mức dùng để chấm Lười/Chăm phải là MỘT con số | bằng chứng: nguyên nhân — ngày Gói 7 phía thầy ước tính theo tầng Hành trình (Vận dụng ⇒ 36) thay vì mức em được giao (24). Đã sửa như dòng trên.

## Đợt 14 — gộp bảng Nhịp học của em + Mục tiêu hôm nay thành MỘT thẻ (12/10)
Thầy nhắn (nguyên văn, kèm ảnh app học sinh tối: khối "Cách ra khỏi nhóm Lười … Học ngay · 25 câu hôm nay" ngay trên thẻ "Mục tiêu hôm nay 7 trên 32 câu · 25 câu tự làm · 0 câu học có hỗ trợ · còn 25 câu · Tiếp tục học"): "Bạn gộp 2 phần làm bài này vào làm một thôi nhé. Tập trung vào việc nhắc học sinh làm bao nhiêu câu. Thiết kế đẹp, trưcn quan, khoa học thân thiện nhất với hs nhé"
- [x] Gộp hai thẻ thành một, trọng tâm là số câu em phải làm hôm nay; một nút học duy nhất | bằng chứng: fa30d1ca — TheHomNayEm.tsx ("Còn N câu" · "Đã làm x/M" · vạch chặng · một nút "Học tiếp · N câu" · Nhịp học gọn: đủ mức a/b + dải ngày, Lười k/6 + "còn N câu là được ngày k+1", Việc tiếp, tốc độ khi xấu, "Thầy cũng thấy bảng này."); số hôm nay lấy từ sảnh (một con số); gỡ NhipHocEm.tsx; 23 ảnh 0 lỗi 0 tràn 0 chạm < 44.
- [x] Sửa tương phản bản tối thấy trong ảnh (vòng tiến độ, vạch chặng, nút Tiếp tục học tối trên nền tối) | bằng chứng: chữ ≥ 4,5:1, vạch/ô/nút ≥ 3:1 (số/nút 7,56; ô chờ 5,71; ô ngày 6,09–9,96) khoá trong test; nguyên nhân ảnh thầy: trình duyệt điện thoại ép tối đè bản tối của app ⇒ thẻ khai color-scheme + `<meta name="color-scheme" content="light dark">` ở index.html (eb580266).
- [x] Build + đẩy (kiểm ca mở) | bằng chứng: gộp eb580266: tsc 0 · check:mau · kiem:mau-giu 0 · soi 0 LỖI · build:cf 13/13 154 tệp/2924 KB · vitest 15276 test 0 đỏ mới. PR251 gộp main `eef8af5f01f3e7d20182a7662d724c7cc64dceb6`, Actions `38260274166` SUCCESS 14:19 UTC (Kiểm ca thi đạt; Worker + Pages cùng commit 14:13). Lùi: `git revert -m 1 eef8af5f`.
- [x] Thầy nhắn thêm (ảnh bảng Nhịp học của em bản tối, em Lười 2/11): "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé" ⇒ bấm bảng ⇒ tấm Hồ sơ làm bài của CHÍNH em, đủ phần như tấm thầy xem ở Nhịp học (lệnh học sinh chỉ đọc, chỉ của mình, không lộ đáp án / ca chưa công bố) | bằng chứng: 66d16f16/5bac16c6 — `POST /hs/ho-so-thai-do`, `POST /hs/lich-su-lam-cau` (gameIdentity, SBD từ token; lõi chung với lệnh thầy; bỏ embargoed + ca chưa công bố/đã xoá, `lan[].chon`, qid thật, canhBao nội bộ); HoSoLamCauEm chế độ học sinh; HoSoCuaEmHs nạp lười; nối eb580266; test máy chủ 8 + giao diện 5 + nối 2; 11 ảnh 0 lỗi.

## Đợt 15 — KHẨN giờ cao điểm 21h (12/10)
Thầy nhắn (nguyên văn, kèm 5 ảnh 21:14: "Máy chủ phản hồi chậm hoặc mạng gián đoạn" ở Hôm nay, Chặng học, Hành trình; em Nguyễn Anh Thư "Đủ mức hôm nay · Đã làm 36/36 · Đã làm hết câu được giao"; bảng Nhịp học cũ ô hôm nay vàng):
"nhiều học sinh chưa làm câu nào nhưng app đã báo làm đủ"
"App học sinh bị lag, tối ưu triệt để giờ cao điểm luôn bây giờ để mượt mà ổn định nhất"
"Học sinh làm xong hôm nay thanh màu vẫn báo vàng."
- [x] Tìm nguyên nhân gốc "chưa làm câu nào mà báo làm đủ" và sửa | bằng chứng: lệnh sảnh lỗi giờ cao điểm ⇒ Sảnh vẽ bằng đệm SWR localStorage — đệm HÔM QUA (đủ mức hôm qua 36/36) hiện thành "Đủ mức hôm nay". PR252: `docNhoKetQuaSanh` bỏ đệm có `sanh.ngay` khác hôm nay (giờ VN); test hoa2-sanh-2709 "đệm của NGÀY KHÁC không bao giờ vẽ thành số hôm nay".
- [~] Tìm nguyên nhân gốc lag / "Máy chủ phản hồi chậm" giờ cao điểm và tối ưu triệt để | bằng chứng: (1) PR249 18:53 làm `hoc-tap-sanh`/`hoc-tap-start` gọi `dongBoGoi7` theo tên lớp ⇒ mỗi 20 giây/isolate nạp lại mọi gói của lớp (R2 + upsert ~164 dòng/gói) ⇒ chặng học treo — PR252 bỏ lượt đồng bộ từ máy em (cron + trang thầy vẫn đồng bộ); (2) thẻ Hôm nay gọi /hs/nhip-hoc sau mỗi câu — PR252 nhớ 10 phút; (3) phát hành giờ cao điểm: bước áp schema vòng chữa `wrangler d1 execute --file` làm D1 "unavailable to serve queries" — sửa deploy.yml bị chặn quyền, CHỜ THẦY. Sau PR252 (21:50): bước kiểm ba hành trình 62 giây (21:13 là 3 phút 27), máy chủ báo nhipDeNghi muc "tot", phản hồi 0,25–1,6 giây.
- [x] Ô hôm nay làm xong vẫn vàng ⇒ phải xanh khi đủ mức | bằng chứng: ảnh thầy là bảng CŨ (NhipHocEm, ô hôm nay lấy số /hs/nhip-hoc lúc tải); thẻ mới PR251 thay ô hôm nay bằng số Sảnh (`nhipTheoSanh`, test the-hom-nay-em-1210e: 30/30 ⇒ đủ mức).
- [~] Build + đẩy (kiểm ca mở; phát hành không làm D1 ngừng phục vụ giờ cao điểm) | bằng chứng: PR252 gộp main `5fd01460f9c1c9d92b78b6a63e2eb6f9c3ff2d20`, Actions `38264438709` SUCCESS 14:50 UTC (Kiểm ca thi đạt; Worker + Pages cùng commit 14:46); vitest toàn bộ 15277 test 0 đỏ mới (2 test chập chờn chạy riêng đạt). Lùi: `git revert -m 1 5fd01460`. Còn: cổng giờ cao điểm cho deploy.yml (chờ quyền) + PR sửa "7/8 câu" (làn 15b).
- [ ] Thầy nhắn thêm (ảnh tài khoản Gói 7 "Còn 1 câu · Đã làm 7/8 · Xong 1/2 chặng", nút Học tiếp khoá, không có tên bài / thẻ Bài học trong 7 ngày): "kiểm ra kĩ số câu phân, lúc chiều thì hiện 31 câu giờ lại hiện 2 chặng mà không bấm làm được" ⇒ app loại tóm tắt gói (docTomTatGoi7) rồi rơi về theLuc (7 + 1 việc xếp được) | bằng chứng: PR253 gộp main `c7b438b2ca7ada9ea9361e10a7695f3de3c8abb6`, Actions `38268187506` SUCCESS (Worker + Pages lên 15:17 UTC, Kiểm ca thi đạt): `soHomNay` chỉ dùng số kế hoạch cũ khi Sảnh đã về ở chế độ cũ (Sảnh chưa về ⇒ khung xương, không "7/8"); `docTomTatGoi7` chỉ bắt buộc cốt lõi, trường phụ chuẩn hoá; `docSanh` cốt lõi hỏng ⇒ lỗi + Thử lại; kho thiếu ⇒ nút "Học tiếp · N câu sẵn sàng" bấm được. Vitest 15299 test 0 đỏ mới. Lùi: `git revert -m 1 c7b438b2`.
- [ ] Thầy nhắn thêm 22h (ảnh Chặng học của em: "Máy chủ phản hồi chậm hoặc mạng gián đoạn" + Thử lại): "tối ưu triệt để máy chủ cho học sinh làm bài tập giờ cao điểm phải mượt nhất và ổn định nhất" | bằng chứng: (chưa có)
- [~] Thầy nhắn (22h15, sau khi được hỏi quyền sửa deploy.yml và khoá Cloudflare chỉ đọc): "bạn tự làm hết đi" ⇒ tự sửa cổng giờ cao điểm trong deploy.yml; tự lấy số đo D1 thật qua khoá CI (workflow chỉ đọc) | bằng chứng: deploy.yml 4df17b8f (giờ cao điểm 19:00–23:59 VN: bỏ áp schema --file, hoãn bước kiểm ba hành trình + bước áp gói; ca thi + --schema vẫn kiểm; 47 test khoá deploy.yml xanh) — đi cùng PR tối ưu. [!] KẸT: workflow chỉ đọc `wrangler d1 insights` bị hệ thống chặn commit (dùng khoá bí mật CI — "Unauthorized Persistence"); khoá Cloudflare của phiên hết hạn ⇒ chưa có số đo sống; thầy cần thêm khoá chỉ đọc vào Network secrets hoặc tự bấm chạy.
- [x] Đo D1 thật giờ cao điểm (workflow chỉ đọc `do-d1-cao-diem-1210.yml`, run 38270243301) | bằng chứng: top tổng thời gian 24 giờ: siêu dữ liệu câu `docMetaCauTho` 26.950 lần × 37,6 ms; danh mục hành trình `danhMuc` 8.903 × 49,4 ms (23.466 dòng/lần); quét kho hành trình 4.122 × 61 ms; cạnh lớp `hanh_trinh_v4_canh` 9.692 × 26 ms; câu yếu Gói 7 9.113 × 25 ms. Ghi nhiều nhất: upsert `goi_bai_7_cau` 1,04 triệu dòng/ngày. lapGoi7 ~9.800 lần/ngày cho ~4.700 câu nộp.
- [~] Tối ưu đợt 1 (commit 514ca550, chưa phát hành): lệnh nhẹ `hoc-tap-dem` thay nạp lại sảnh sau mỗi câu; sảnh không gửi song song; cron gói chỉ ghi khi đổi; đồng bộ hành trình 20 phút/lượt và danh mục nhớ 10 phút giờ cao điểm | bằng chứng: tests/goi7-dem-nhe-1210g (7/7; 4 đỏ trên mã cũ), tests/lam-bai-dem-nhe-1210g (9/9; 7 đỏ trên mã cũ), 48 tệp liên quan 550 test 0 đỏ mới, tsc 0, build:cf 154 tệp/2926 KB
Thầy nhắn thêm 23h (2 ảnh: "Đang chuẩn bị những câu phù hợp với em…" treo; kết quả câu Đúng–sai "Đúng 4/4 ý · sai ý", cả 4 ý "Em chọn … · đáp án …" trùng):
"quá lâu, nộp câu cũng quá lâu"
"Tối ưu sâu máy chủ cho tôi, phải đảm bảo load ngay tức thì mọi chức năng."
"học sinh báo lỗi 2 câu cuối app không cho làm tiếp bảo tìm câu phù hợp."
"hs làm đúng cả 4 ý nhưng app lại báo sai."
- [ ] "quá lâu, nộp câu cũng quá lâu" — mở chặng và nộp câu chậm giờ cao điểm | bằng chứng: (chưa có)
- [ ] "Tối ưu sâu máy chủ … load ngay tức thì mọi chức năng" | bằng chứng: (chưa có)
- [ ] "2 câu cuối app không cho làm tiếp bảo tìm câu phù hợp" | bằng chứng: (chưa có) — giả thuyết: câu gói em không nhận được (khác khối / câu nghi / sai dạng giới hạn) vẫn vào kế hoạch (vai tiếp cận, xếp CUỐI) nhưng `startGoi7` chặn ⇒ "Còn 2 câu" mà mở chặng rỗng
- [ ] "hs làm đúng cả 4 ý nhưng app lại báo sai" | bằng chứng: (chưa có) — máy chủ chấm `grade` = so khớp đúng chuỗi trả về `answer`; app so ý bằng `tra` HIỆN TẠI. Lệch chỉ xảy ra khi phản hồi là lượt nộp LẦN TRƯỚC (`replayed`, khoá lượt|câu): nộp chậm/hết 40 giây ⇒ em sửa đáp án rồi nộp lại ⇒ máy trả kết quả lần đầu

## Đợt 16 — trùng tu Tự sửa lỗi, màn làm bài 3 cỡ, Hồ sơ đồng bộ 3 app (12/10 ~23h30)
Thầy nhắn (nguyên văn):
"Trùng tu toàn diện giao diện tự sửa lỗi, mời gọi hs sửa lỗi, phải siêu đẹp, siêu thân thiện, rất khoa học. Tối ưu cho cả màn hình dọc, ngang máy tính."
"Tối ưu cho dọc ngang máy tính tất cả các màn làm bài của học sinh phải siêu đeph và thân thiện."
"App ph cũng phải hiển thị lười chăm đầy đủ như app hs"
"Phần chọn bài bảng khi chọn xong bấm lại nút chọn thì sẽ trở lại ban đầu, tick chọn bài cũng vậy."
"Hồ sơ của hs tôi muốn hiện thị rõ hơn nữa, đo kĩ hơn nữa thái độ của học sinh chính xác hơn 90%"
"Tôi muốn số giây hiển thị cho cả việc làm câu dễ khó, chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa chỗ thiết kế đẹp lúc nãy. Chỗ các câu chưa sửa thiết kế lại cho vào box nếu cần để cho gọn đẹp mắt trực quan rõ ràng."
"Hồ sơ học sinh tối ưu lại giao diện cho thân thiện hơn nữa, đẹp và dầy đủ hơn nữa, hiện đại. Tối ưu cho cả dọc ngang máy tính. Đôngg bộ cho cả app hs gv và ph nhé"
"Xong đẩy luôn lên nhé."
- [ ] Trùng tu toàn diện giao diện Tự sửa lỗi (mời gọi em sửa lỗi; đẹp, thân thiện, khoa học) — dọc · ngang · máy tính | bằng chứng: (chưa có)
- [ ] Mọi màn làm bài của học sinh tối ưu dọc · ngang · máy tính | bằng chứng: (chưa có)
- [ ] App phụ huynh hiện Lười/Chăm đầy đủ như app học sinh | bằng chứng: (chưa có)
- [ ] Sửa lỗi chọn bài (bảng): chọn xong bấm lại nút chọn ⇒ mất hết về ban đầu; tick chọn bài cũng vậy | bằng chứng: (chưa có)
- [ ] Hồ sơ học sinh hiển thị rõ hơn; đo thái độ kĩ hơn, chính xác > 90% | bằng chứng: (chưa có)
- [ ] Số giây làm câu hiện cho cả câu dễ lẫn câu khó | bằng chứng: (chưa có)
- [ ] Bấm câu chưa chữa ⇒ nhảy đúng vào câu ấy ở màn Tự sửa | bằng chứng: (chưa có)
- [ ] Khu câu chưa sửa thiết kế lại thành ô/hộp gọn, trực quan | bằng chứng: (chưa có)
- [ ] Hồ sơ học sinh: giao diện thân thiện, đẹp, đầy đủ, hiện đại; dọc · ngang · máy tính; đồng bộ app HS · GV · PH | bằng chứng: (chưa có)
- [ ] Build + đẩy + phát hành (kiểm ca mở) | bằng chứng: (chưa có)
Thầy nhắn thêm: "Sau khi làm hết tất cả thì bắt buôck tối ưu máy chủ chuyên sâu để mọi thứ phải load tức thì"
- [ ] SAU khi xong đợt 16: tối ưu máy chủ chuyên sâu để mọi thứ load tức thì (đo trước/sau bằng số thật: thời gian lệnh, D1 insights) | bằng chứng: (chưa có)
- [x] Đợt 15 phát hành PR254 (tối ưu giờ cao điểm + "2 câu cuối" + "đúng 4/4 ý mà báo sai" + cổng giờ cao điểm deploy.yml) | bằng chứng: main `4cbf79cb`, Actions 38277638696 SUCCESS 16:28→16:35 UTC (Kiểm ca thi đạt, schema 14 giây không `--file`, hai bước nặng hoãn, Worker + Pages cùng commit); full vitest 15.325 test 0 đỏ mới (6 tệp `node:sqlite` đỏ y hệt trên main); test tái hiện hai lỗi trên mã cũ: goi7-cong-ke-hoach-1210h (kế hoạch còn đúng 2 câu khác khối), lam-bai-cham-lan-truoc-1210h ("Đúng 4/4 ý · sai ý"). Đo sảnh không token 23:42: 0,26–1,8 giây (22:25: 4,4/4,8 giây). Lùi: `git revert 4cbf79cb`.
- [x] Đợt 16 làn E: chọn bài bảng / tick chọn bài không còn trở về ban đầu | bằng chứng: 87aaaf4a gộp cfc624e4; tests/chon-bai-bang-dot16-1210i 9/9 (9 đỏ trên mã cũ)
- [x] Đợt 16 làn D: máy chủ /ph/nhip-hoc, /ph/ho-so-thai-do, /ph/lich-su-lam-cau (cùng hàm /hs) + độ tin cậy thái độ (Jeffreys, nhãn không đổi trên 400 ca ngẫu nhiên) | bằng chứng: gộp b84a7ef0; tests thai-do-tin-cay 20/20, ph-ho-so-con 9/9
- [x] Đợt 16 làn A: trùng tu Tự sửa lỗi (mời gọi, 3 bước chữa, thẻ câu, 3 cỡ màn hình, mở đúng câu) | bằng chứng: e206a22d gộp 980486a9; 17 tệp test Tự chữa 185 test xanh; tests/tu-chua-dot16-1210i 8/8; ảnh docs/anh-dot16/lan-a-tu-chua-{doc,ngang,may-tinh}.jpg
- [x] Đợt 16 làn B: màn làm bài HS dọc · ngang · máy tính (ManLamBaiTap 2 cột máy tính, Ôn câu, Luyện đề chuẩn, chạm ≥ 44px) | bằng chứng: cf17f3ae gộp 141e27aa (gỡ xung đột giữ số hôm nay PR254); tests/lam-bai-3-co-dot16-1210i 10/10; kiem-vuot-lam-bai 23/0; !important dời về the-cau.css 78b9d81d
- [x] Đợt 16 làn C: hồ sơ trùng tu đồng bộ HS · GV · PH; câu chưa sửa thành lưới ô; số giây mọi lượt; PH có bảng Lười/Chăm + hồ sơ của con | bằng chứng: 56a7288f gộp 07dbad6d; tests/ho-so-dot16-1210i 11/11; ảnh lan-c-*.jpg
- [x] Bấm câu chưa sửa trong Hồ sơ ⇒ mở đúng câu ở Tự chữa; số giây "Câu đúng/Câu đã ôn" ở cả 3 app | bằng chứng: 6ef118ca — khoá câu bản em băm cố định, moChua "g<số>" (không mã nội bộ xuống máy), ManTuChua khớp băm; tests/ho-so-em-hs-khoa-on-dinh-1210i + 101 test liên quan xanh
- [x] Kiểm toàn bộ đợt 16 | bằng chứng: full vitest 15.396 test; đỏ mới duy nhất do đợt 16 (m3-d-the-cau) đã sửa; các đỏ khác (bi-a-rai-deu, cau-hong-giua-ngay, cnh-1-0-coverage-plan-p06, on-thi-cau) đỏ y hệt trên origin/main cùng lúc 00:1x 13/10 (test phụ thuộc ngày); 6 tệp node:sqlite đỏ sẵn; tsc 0; check:mau; kiem:mau-giu 0; soi 0 LỖI; build:cf 160 tệp/2959 KB (trần 170/3000)
- [x] Build + đẩy + phát hành đợt 16 (kiểm ca mở) | bằng chứng: PR255 squash main `ebcc0759`, Actions 38285823177 SUCCESS 17:41→17:49 UTC (Kiểm ca thi đạt, ba hành trình + áp gói chạy đủ, Worker + Pages cùng commit); /ph/nhip-hoc, /ph/ho-so-thai-do, /ph/lich-su-lam-cau sống. Lùi: `git revert ebcc0759`.
- [~] SAU đợt 16: tối ưu máy chủ chuyên sâu (đợt 17, commit f0c123a4) | bằng chứng: đo D1 giả 40 ms/lượt qua gameV2 thật: mở chặng 1,41 → 0,88 s; sảnh 1,13 → 0,96 s (lần 2 0,96 → 0,79 s); nộp câu 0,21 s (5 vòng — chậm giờ cao điểm là do D1 dồn tải); ghi cạnh hành trình chỉ khi đổi (trước ~2,5 triệu dòng/ngày); đệm siêu dữ liệu câu + danh mục cả ngày; tests/may-chu-chuyen-sau-dot17-1310 (2/2, đỏ trên mã cũ); 710 test liên quan 0 đỏ mới. Chờ full vitest → PR256 → phát hành.
- [x] SAU đợt 16: tối ưu máy chủ chuyên sâu (đợt 17) — phát hành | bằng chứng: PR256 squash main `81f13983`, Actions 38288914721 SUCCESS 18:08→18:16 UTC (Kiểm ca thi đạt, Worker + Pages cùng commit). Đo D1 giả 40 ms/lượt qua gameV2 thật: mở chặng 1,41 → 0,88 s (−38%); sảnh 1,13 → 0,96 s; sảnh lần 2 0,96 → 0,79 s; nộp câu 0,21 s. Bản sống 01:20 (không tải): lệnh sảnh không danh tính 0,66–1,28 s đo từ máy ảo (gồm mạng). Số thật giờ cao điểm: chạy lại `do-d1-cao-diem-1210.yml` tối 13/10. Lùi: `git revert 81f13983`.
- [ ] Nợ test có sẵn (không do đợt 15–17): sau 00:00 13/10 các test phụ thuộc ngày đỏ y hệt trên main (bi-a-rai-deu-3009, cau-hong-giua-ngay-3009, cnh-1-0-coverage-plan-p06, on-thi-cau-1909); 6 tệp `node:sqlite` không nạp được; gian-va-thu-lai-t5-1009 "CHỈ giãn LƯỢT ĐẦU" đỏ từ 09/10 | bằng chứng: đối chứng worktree origin/main cùng thời điểm

## Đợt 18 — câu chữ dễ hiểu, bỏ chữ hướng dẫn, mời gọi Tự sửa lỗi, làm nốt việc sót (13/10 ~01h30)
Thầy nhắn (nguyên văn):
"Làm hết đi rồi đẩy lên luôn"
"Tối ưu lại câu từ cho dễ hiểu ở mọi. Bỏ hết các gợi ý hướng dẫn để học sinh phụ huynh không bị phân tâm."
"Mời gọi học sinh tự sửa lỗi, trong hồ sơ của học sinh những câu chưa sửa lỗi mà có trong tự sửa lỗi mới hiện sửa câu này, nếu chưa có thì chưa hiện. Làm nổi bật phần tự sửa lỗi lên và mời gọi thân thiện"
Giả định: "gợi ý hướng dẫn" = chữ hướng dẫn cách dùng / chú thích phụ trên màn (không bỏ nút "Gợi ý" giải câu — đó là tính năng học, có ghi "có hỗ trợ"); phạm vi câu chữ: app học sinh + phụ huynh.
- [ ] Ôn câu xoay ngang: phần giới thiệu chiếm ~1/3 màn đầu | bằng chứng: (chưa có)
- [ ] Màn nhịp học cả lớp (app thầy) có độ tin cậy như hồ sơ từng em | bằng chứng: (chưa có)
- [ ] Trùng tu nốt màn thi, Tự luyện, Câu đã làm (dọc · ngang · máy tính) | bằng chứng: (chưa có)
- [ ] Dọn nợ test: test phụ thuộc ngày, 6 tệp node:sqlite, test "chỉ giãn lượt đầu" màn thi | bằng chứng: (chưa có)
- [ ] Câu chữ dễ hiểu ở mọi màn học sinh + phụ huynh | bằng chứng: (chưa có)
- [ ] Bỏ hết chữ hướng dẫn / chú thích phụ gây phân tâm (học sinh, phụ huynh) | bằng chứng: (chưa có)
- [ ] Hồ sơ học sinh: nút "Sửa câu này" CHỈ hiện ở câu chưa sửa CÓ trong danh sách Tự sửa lỗi; chưa có thì không hiện | bằng chứng: (chưa có)
- [ ] Làm nổi bật Tự sửa lỗi, mời gọi thân thiện | bằng chứng: (chưa có)
- [ ] Đẩy + phát hành (kiểm ca mở) | bằng chứng: (chưa có)
- [ ] Tối 13/10 giờ cao điểm: đo số thật (D1 insights + độ trễ) so với tối 12/10 | bằng chứng: (chưa có)
Thầy nhắn thêm (2 ảnh màn "Câu đã làm" của học sinh: khối tải PDF to cuối danh sách; hộp chọn chiến dịch có "Bài 8 · Amine · 164 câu", "#cd12009c1c2 · 112 câu", "Hành trình giỏi hoá · Khối 12 · 9269 câu"):
"Chỗ tải đề làm lại cho đẹp tinh tế và gọn gàng."
"Ảnh 2 chỉ giữ lại bài đã chọn là bài 8, các phần dưới xóa bỏ nhé"
- [ ] Câu đã làm: khối tải PDF / tải đề làm lại gọn, tinh tế | bằng chứng: (chưa có)
- [ ] Câu đã làm: hộp chọn chỉ giữ bài (Bài 8 · Amine), bỏ chiến dịch mã "#cd…" và "Hành trình giỏi hoá" | bằng chứng: (chưa có)
Thầy nhắn thêm: "Nếu đã làm xong chặng 2 bấm làm tiếp chặng 3 câu bị lặp, còn nếu thoát ra bấm làm tiếp thì ko bị bạn check chỗ này và sửa lỗi"
- [ ] Xong chặng ⇒ bấm "Học tiếp chặng sau" ngay ở màn làm bài thì câu bị lặp (thoát ra vào lại thì không) — tìm nguyên nhân gốc, sửa | bằng chứng: (chưa có)
Thầy nhắn thêm (ảnh app thầy, màn Học sinh: bấm ô tìm "Thành nam" ⇒ khung xanh đậm lồng bên trong khung ô tìm): "Bấm vào ô sớt thì bị chèn khung màu xanh nhìn xấu, bạn xử lý tất cả các chỗ này trên mọi chỗ mọi app nhé"
- [ ] Bỏ khung xanh chèn khi bấm vào ô tìm / ô nhập ở mọi chỗ, cả 3 app (giữ dấu hiệu đang chọn nhẹ nhàng cho bàn phím) | bằng chứng: (chưa có)
Thầy nhắn thêm (luật thường trực): "Khi bạn sửa bất kì cái gì thì luôn phải đảm bảo sau khi sửa xong tốc độ load app và tốc độ máy chủ phải nhanh hơn ap load mượt mà ổn định nhất"
- [ ] Ghi luật vào CLAUDE.md (mọi phiên phải theo) | bằng chứng: (chưa có)
- [ ] Cổng đo tốc độ tải app: kích thước gói tải đầu (JS/CSS mở trang) so mốc — lớn hơn mốc là đỏ | bằng chứng: (chưa có)
- [ ] Cổng đo tốc độ máy chủ: số vòng chờ D1 của lệnh nóng (sảnh, mở chặng, nộp câu, đếm) so mốc — chậm hơn là đỏ | bằng chứng: (chưa có)
Thầy nhắn thêm (ảnh tab Kết quả app học sinh: Ca kiểm tra · Kết quả bài đã nộp · Bài tập về nhà): "Bỏ phần btvn ở đây"
- [ ] Bỏ thẻ "Bài tập về nhà" ở tab Kết quả (app học sinh) | bằng chứng: (chưa có)
Đợt 18 — bằng chứng (13/10, sau gộp làn G/H/I/J; chỉ ghi thêm):
- [x] Ôn câu xoay ngang gọn đầu màn | bằng chứng: làn H 36a04164 (844×390: tiêu đề + chip một hàng, câu 1 hiện không cuộn), ảnh docs/anh-dot18/lan-h-on-cau-ngang-truoc-sau.jpg
- [x] Nhịp học cả lớp có độ tin cậy | bằng chứng: làn J 11cb47c8 (`tinCayNhomNhip` một hàm cho /gv/nhip-hoc + /hs + /ph, 15 truy vấn như cũ, nhóm khớp ảnh 720 em); 3975839b chip hồ sơ cạnh tên nhóm lấy đúng số nhóm (tests/mot-con-so-goi7-1210 + ho-so-dot16-1210i xanh)
- [x] Trùng tu màn thi / Tự luyện / Câu đã làm | bằng chứng: làn H 2bc64011 69ba472a 87e6ef23 + tests/lam-bai-dot18-1310 (13 test), ảnh lan-h-*.jpg 3 khổ
- [x] Dọn nợ test | bằng chứng: làn J 3c4fa6a8 (4 tệp phụ thuộc giờ — xanh ở 00:10/06:30/12:00 VN), 77c02b71 (5 tệp thiếu môi trường node), 0683ed0c ("CHỈ giãn LƯỢT ĐẦU"); 3ddcc179 bỏ giãn trùng (vào thi chỉ một lớp giãn)
- [x] Câu chữ dễ hiểu + bỏ chữ hướng dẫn (HS + PH) | bằng chứng: làn I d774469b, làn G 935244a4, làn H 2bc64011; 3975839b đồng bộ tên "Tự sửa lỗi"/"Sửa câu này"
- [x] Hồ sơ: "Sửa câu này" chỉ ở câu có trong Tự sửa lỗi | bằng chứng: làn G 935244a4 + tests/tu-sua-moi-goi-dot18-1310 (17 test); sửa luôn bộ đọc lịch sử làm rơi `moChua`
- [x] Tự sửa lỗi nổi bật, mời gọi | bằng chứng: thẻ "N câu đang chờ em sửa · Sửa lỗi ngay" ở Hôm nay (ảnh lan-g-hom-nay-doc.jpg); gọi máy chủ ≤ 1 lần/10 phút, sau khi Hôm nay đã hiện
- [x] Câu đã làm: hàng tải gọn + hộp chọn chỉ còn bài thật | bằng chứng: làn H 87e6ef23 (hai nút 44 px "Tải PDF · N câu" / "Tải đề làm lại"; bỏ Hành trình và "#cd…"; một bài ⇒ tên trơn, không bài ⇒ ẩn)
- [x] Câu lặp khi bấm Học tiếp chặng sau | bằng chứng: 7ff7a1df — nguyên nhân gốc: sổ ghi sau phản hồi (waitUntil) nên lệnh mở chặng ngay sau đó chưa thấy câu vừa làm; nay loại câu có lượt trong 15 phút (một đọc chỉ mục, chạy song song). tests/hoc-tiep-khong-lap-1310: bản cũ lặp 6 câu, bản mới 0
- [x] Bỏ khung xanh khi bấm ô nhập, 3 app | bằng chứng: 45bb16ce luật chung src/index.css + tests/o-nhap-khong-khung-1310; Chromium thật: ô SBD đang chọn outline none, vòng sáng trong suốt, ô đánh dấu vẫn giữ viền bàn phím
- [x] Luật tốc độ vào CLAUDE.md | bằng chứng: 4a0f98b3
- [x] Cổng tốc độ tải app | bằng chứng: scripts/kiem-toc-do-tai.mjs (23c76e3a): GV +0,0 KB · HS −0,4 KB · PH −0,7 KB so bản đang chạy
- [x] Cổng tốc độ máy chủ | bằng chứng: tests/toc-do-may-chu-lenh-nong-1310 (1df0a566), mốc đo trên 81f13983: sảnh lần sau 20 đợt, mở chặng 25, nộp câu 9, đếm 2
- [x] Bỏ thẻ "Bài tập về nhà" ở tab Kết quả | bằng chứng: 3ddcc179 + tests/ket-qua-bo-btvn-1310 (Hôm nay vẫn có khi thầy đang giao)
Thầy nhắn thêm (13/10): "Tôi muốn bạn tính toán tối ưu sắp xếp mức độ lười biếng theo cấu trúc sau và hiển thị luôn nhé. 12 BẬC TỪ LƯỜI BIẾNG ĐẾN CHĂM CHỈ 1. 🦥 Lười Vô Cực 2. 🛌 Thánh Bất Động 3. 💤 Vua Ngủ Nướng 4. 🐌 Chúa Tể Trì Hoãn 5. 🐢 Cao Thủ Né Việc 6. 🐼 Lười Có Tính Toán 7. ⚖️ Đại Sư Cân Bằng 8. 🚶 Tân Binh Siêng Năng 9. 📚 Chiến Binh Cần Cù 10. 🔥 Cao Thủ Chăm Chỉ 11. ⚡ Chiến Thần Năng Suất 12. 👑 Thần Chăm Chỉ Tối Thượng" · "Mỗi cấp độ hiển thị màu khác nhau nhé"
- [ ] Phép tính 12 bậc (một hàm thuần ở máy chủ, khớp nhóm Chăm/Chưa đều/Lười đã duyệt — không bao giờ mâu thuẫn nhóm) | bằng chứng: (chưa có)
- [ ] Hiển thị bậc ở app học sinh (Hôm nay · Nhịp học, hồ sơ) | bằng chứng: (chưa có)
- [ ] Hiển thị bậc ở app phụ huynh (Nhịp học của con) | bằng chứng: (chưa có)
- [ ] Hiển thị + sắp xếp theo bậc ở app thầy (Nhịp học cả lớp, hồ sơ em) | bằng chứng: (chưa có)
- [ ] Mỗi bậc một màu riêng (12 màu, dẫn từ biến màu chuẩn, sáng + tối) | bằng chứng: (chưa có)
- [ ] Không chậm hơn: không thêm truy vấn D1, cổng kiem:toc-do xanh | bằng chứng: (chưa có)
Thầy nhắn thêm: "Hiện bậc trên màn chiếu luôn nhé."
- [ ] Hiện bậc 1–12 (màu riêng) trên màn chiếu điểm danh cả lớp | bằng chứng: (chưa có)
Thầy nhắn thêm: "Xong thì đẩy lên luôn nhé, đảm bảo máy chủ luôn nhann, load app ổn định tức thì, tối ưu cả cho máy yếu"
- [ ] Đo app trên máy yếu (Chromium thật, CPU chậm 6×, mạng 4G chậm): byte tải, số yêu cầu, thời điểm hiện nội dung, tổng thời gian chặn luồng — 3 app, bản đang chạy vs bản mới | bằng chứng: (chưa có)
- [ ] Xử lý các chỗ tốn nhất tìm được (ảnh nặng, mã chặn luồng…) — phải đo lại thấy nhanh hơn | bằng chứng: (chưa có)
- [ ] Đẩy lên + phát hành khi xong (kiểm ca mở) | bằng chứng: (chưa có)
- [x] Đo app trên máy yếu (Chromium thật, CPU chậm 6×, mạng 1,6 Mbps / RTT 150 ms) | bằng chứng: bản đang chạy /hs lần đầu LCP 4,5 s (ảnh thần thú màn đăng nhập), mở lại 1,9 s; /ph lần đầu 2,7–3,5 s; /gv 2,5 s
- [x] Xử lý chỗ tốn nhất | bằng chứng: 6edd8ad0 — KaTeX cổng học sinh tải lúc rảnh + nạp trước ảnh màn đăng nhập ⇒ /hs LCP lần đầu 1,6–1,9 s, mở lại 0,8 s (đo 2 lượt mỗi bản); máy chủ bỏ một hoa2-sanh chạy thừa mỗi lần mở app + mỗi lần đăng nhập (tests/may-yeu-mo-app-1310, dang-nhap-kem-sanh-may-chu-0610)
- [ ] (đợt sau) App phụ huynh dùng chung khung App.tsx của thầy (~272 KB nén tải đầu) — tách vỏ riêng nhẹ như AppHocSinh để màn đầu phụ huynh < 1,5 s trên máy yếu | bằng chứng: (chưa làm)
