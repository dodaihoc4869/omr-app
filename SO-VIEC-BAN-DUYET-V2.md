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
- [ ] Build giao diện GV theo bản vẽ (5 mục: Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề + Cài đặt) | bằng chứng: (chưa có)
- [x] Sửa 4 lỗi đã thấy ở bản V2 (rương lặp số, khối Hành trình vẽ 2 lần, bước "Thử thách +1 bậc", 2 nút Vào thi) | bằng chứng: 6f5fc95 (Sảnh V2 viết lại theo bản vẽ: một khối Hành trình, rương không lặp số câu hôm nay, bỏ bước 3, một nút Vào thi).
- [ ] Đẩy luôn: kiểm không có ca thi mở → PR vào main → Actions phát hành Pages + Worker | bằng chứng: (chưa có)
