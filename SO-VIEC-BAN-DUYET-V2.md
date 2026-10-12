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
