# Đặc tả · Hành trình giỏi Hóa thành MỘT TRANG 4 BƯỚC · 21/10/2026

Thầy dặn (21/10, kèm ảnh màn hiện tại): "phần này tôi muốn bỏ thẻ dạy học và đầu giờ và thẻ chữa bài đi, phần này sẽ theo tiến trình từ trên xuống dưới, 1 điểm danh, 2 là gọi lên bảng đầu giờ, 3 dạy học, 4 chữa câu khó và tính toán, thiết kế lại đẹp mắt hơn, gọn gàng và khoa học thân thiện nhất có thể, vẽ trước khi tôi duyệt build nhé."

Bản vẽ: `docs/ban-ve-hanh-trinh-2110/` (đọc `GHI-CHU.md`). **Chưa sửa `src/`.** Số trong ảnh là số GIẢ.

## 1. Mục tiêu + ai dùng
- Người dùng: thầy, trên lớp, máy tính nối máy chiếu (có lúc cầm điện thoại).
- Mở màn là biết ngay buổi đang ở bước nào, việc tiếp theo là gì. Không còn phải chọn giữa hai thẻ.
- Thứ tự đúng nhịp một buổi dạy: **1 Điểm danh → 2 Gọi lên bảng đầu giờ → 3 Dạy học → 4 Chữa câu khó & tính toán**.

## 2. Bố cục
- **Bỏ** hai nút thẻ "Dạy học & đầu giờ" và "Chữa bài". **Bỏ** thanh chip bốn bước cũ nằm ngang trên đầu.
- **Thước tiến trình** là MỘT điều khiển duy nhất cho cả màn:
  - Máy tính (≥ 1180 px): cột trái dính khi cuộn. Trên cùng là ô "Buổi dạy hôm nay" (lớp, giờ mở). Dưới là 4 bước dọc nối bằng đường kẻ; đoạn đã xong tô xanh lá. Mỗi bước có một dòng trạng thái ("Xong · 22/24 em", "Đang làm", "Chưa tới").
  - Điện thoại và màn ngang: một hàng 4 ô dính trên đầu, tên ngắn: Điểm danh · Đầu giờ · Dạy học · Chữa câu.
  - Bấm một bước trên thước thì cuộn tới bước ấy và mở nó ra.
- **Thẻ bước**, xếp dọc từ trên xuống:
  - Bước **đang làm**: mở rộng, viền xanh lam 2 px. Chỉ bước này có **nút chính** tô màu.
  - Bước **đã xong**: thu thành một dòng (dấu tích xanh, tên bước, tóm tắt) kèm nút chữ "Mở lại".
  - Bước **chưa tới**: một dòng xám, nói cần làm gì trước.
  - Bước 4 **mở lúc nào cũng được**: số tròn màu hổ phách, kèm "12 chỗ học sinh cần chữa" và nút viền "Mở". Bước này không phụ thuộc điểm danh.
- **Bước 3 "Dạy học"** gộp bước 3 và 4 cũ, trên xuống dưới gồm:
  - bài đang dạy, nút "Đổi bài", "Hiện lời giải tất cả";
  - dải em được gọi lên bảng;
  - danh sách câu, nút "Xem đủ N câu";
  - nút chính "Chiếu lên bảng";
  - ngăn cách, rồi "Tick bài vừa dạy" với nút viền "Tick bài hôm nay";
  - dòng gập "Bài đang giao · N lớp".
- **Bước 4 "Chữa câu khó & tính toán"** có hai khối:
  - (A) **Câu khó & tính toán**: thầy chọn lớp, chọn bài trong kho Dạy học, công tắc "Chỉ câu có tính toán". Mỗi câu có tỉ lệ sai và em được gọi lên bảng. Nút chính "Chiếu lên bảng · N câu".
  - (B) **Câu học sinh cần chữa**: giữ nguyên đủ chức năng của thẻ Chữa bài cũ (lọc theo khối, lý do, số em, Chiếu lên bảng / Gỡ nút thắt / Xem các em, Làm mới).
- **Kiểm tra ôn tập**: giữ lại, dời xuống cuối màn thành một dòng gập "Xem". Không thuộc buổi dạy nên không đánh số.

## 3. Trạng thái
- **Tiến trình:** bước 1 xong khi buổi đã mở và có em có mặt (luật cũ). Bước 2 xong khi `onXong` báo. Bước 3 xong khi đã chiếu **và** đã tick bài (`onTrangThai` cũ: `day && tick`). Bước 4 không có trạng thái "xong" bắt buộc; về 0 chỗ thì ghi "Không còn chỗ cần chữa".
- **Chưa mở buổi:** bước 1 mở, có ô "Lớp học hôm nay" và nút chính "Điểm danh". Thước ghi "Chưa mở buổi".
- **Nhiều buổi đang mở:** ô "Buổi dạy hôm nay" trên thước thành ô chọn buổi.
- **Đang tải:** mỗi bước có khung xương đúng hình (`.tt-xuong`), không chữ "Đang mở…".
- **Lỗi / mất mạng:** báo lỗi nằm trong đúng bước bị lỗi, kèm "Thử lại". Các bước khác vẫn dùng được.
- **Buổi đã kết thúc:** bước 1 ghi "Đã kết thúc", bước 2 và 3 thu lại. Bước 4 vẫn mở được.

## 4. Dữ liệu (dùng lại hết, KHÔNG thêm lệnh máy chủ)
- Bước 1: `useDiemDanhBuoi()` gồm `dsBuoiMo`, `tt`, `coMat`, sĩ số, tên em vắng (cho dòng tóm tắt "22/24 em có mặt · Vắng: …").
- Bước 2: `KiemTraDauGio` đã có "Đã gọi N · Đạt · Chưa đạt". Cần cho thành phần này **báo số ấy lên** (thêm một callback, chỉ ở phía giao diện) để làm dòng tóm tắt khi đã thu lại.
- Bước 3: `onTrangThai` chỉ có `{ day, tick }` (đúng/sai). Dòng tóm tắt vì vậy chỉ ghi "Đã chiếu câu · đã tick bài hôm nay", **không ghi số bài** vì chưa có dữ liệu ấy.
- Bước 4: số "N chỗ" lấy từ `useSoDemGv().canThayChua`, số đang có sẵn trong bộ nhớ. Mở bước ra thì `TheCanThayChua` đọc danh sách và `onDem` → `datSo` như cũ, nên số ở thanh bên vẫn khớp một con số.

## 5. Ngoại lệ
- **Lối vào cũ không gãy:** khoá `can-chua` (Hôm nay › Cần thầy chữa) cuộn tới bước 4 và mở nó. Các khoá `dau-gio`, `goi-7`, `nhip`, `bai-hang-ngay` vào bước tương ứng.
- **"Bổ sung bài"** (`boSungBai`): cuộn tới phần "Tick bài vừa dạy" trong bước 3.
- **Phím → trên bản chiếu Nhịp học** (`sangDauGio`): mở bước 2 trước, rồi mới bấm nút "Chiếu lên bảng" của bước đó.
- **Đổi chữ:** dòng chân "Câu nhiều em sai … nằm ở mục Chữa bài ›" trong Bài đang giao đổi thành "… ở bước 4 Chữa câu khó ›" và cuộn tới bước 4.
- Thầy bấm "Mở lại" một bước đã xong: bước ấy mở ra, bước đang làm vẫn giữ viền xanh lam. Hai bước mở cùng lúc được.
- Tên bài, đề hoá học dài: cắt 2 dòng (`line-clamp`), bấm để xem đủ. Có `min-width: 0` khắp nơi.
- Bấm lặp nút chiếu: nút khoá trong lúc dựng tờ chiếu (giữ như cũ).

## 6. Chi phí máy chủ + tốc độ
- **0 lệnh máy chủ mới, 0 vòng chờ D1 thêm.**
- Bước 4 **không tải lúc mở màn**. Phần thân (`TheCanThayChua` + `ThayTuChua`) chỉ nạp lười khi thầy bấm mở bước 4, hoặc bấm "Chữa câu" trên thước, hoặc vào bằng khoá `can-chua`. Như vậy số byte và số lượt đọc lúc mở màn **không tăng** so với mục mặc định "Dạy học & đầu giờ" hiện nay.
- Kiểm tra ôn tập (`BangKiemTraCaNhan`) đang tải ngay lúc mở; sau này chỉ tải khi bấm "Xem", nên giảm được một lượt đọc lúc mở màn.
- Đáp án không đổi đường đi. Lời giải chỉ hiện trên máy thầy như cũ.

## 7. Nghiệm thu đo bằng máy
- Test vitest:
  - sửa các test đang dò hai thẻ `gvv2-muc-nut` (tìm bằng `grep -rl "gvv2-muc\|THE_HANH_TRINH" tests`);
  - thêm `tests/hanh-trinh-mot-trang-2110.test.ts`: đủ 4 bước theo đúng thứ tự; không còn `role="tab"`; chỉ một `.nut-chinh` ở bước đang làm; khoá `can-chua` mở bước 4; bước 4 không nạp mảnh khi chưa mở.
- `npx tsc --noEmit` sạch. `npm run build && npm run kiem:toc-do` 0 đỏ. `npm run kiem:mau-giu` 0. `node scripts/kiem-sw.mjs` đạt.
- Ảnh Chromium màn thật 390 / 844 / 1440, sáng và tối: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px.

## Cần thầy chốt
1. **Bước 4 gồm hai khối** như bản vẽ: (A) câu khó & tính toán thầy tự chọn, rồi (B) câu học sinh cần chữa (12 chỗ). Hay thầy chỉ muốn khối (A)? Nếu bỏ (B) thì con số "cần chữa" ở thanh bên mất chỗ để bấm vào.
2. **Kiểm tra ôn tập** dời xuống cuối thành một dòng gập. Giữ như vậy, hay chuyển sang màn khác?
