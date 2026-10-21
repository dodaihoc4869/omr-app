# Đặc tả · Gọi lên bảng "xổ số có phân tầng" · 21/10/2026

Lỗi thầy báo 21/10: "phần gọi lên bảng hôm nay chỉ gọi đúng 2 bạn". Gốc lỗi đọc từ mã như sau:
- `/gv/ung-vien-chieu` bỏ hẳn em chưa từng làm đúng câu và chưa có số đo kỹ năng.
- `src/lib/ung-vien-chieu.ts` xếp "đã làm đúng" trước, rồi theo xác suất đúng giảm dần. Luật rải đều chỉ dùng khi hai em bằng điểm nhau.
- Kết quả: em giỏi nhất thắng gần như mọi câu.

Bộ chọn này dùng chung cho Dạy học, Chữa câu trên lớp, Thầy tự chữa, tờ chiếu chiến dịch và màn Gọi lên bảng. Kiểm tra đầu giờ (`chonLuotDauGio`) đã ngẫu nhiên nhưng chỉ trong số em có câu từng làm đúng.

Thầy chốt 3 điều (21/10):
1. Câu dễ gọi em yếu, câu khó gọi em giỏi.
2. Mặc định là chế độ "Trộn".
3. Chip tầng ghi "Khá · Trung bình · Cần kèm".

Thầy bảo "làm hết luôn", nên phiên này làm tất cả các kênh, kể cả làn Codex (chiếu chữa / người gọi) và làn giáo viên (GoiLenBangScreen), theo lệnh trực tiếp của thầy. Bố cục trang thuộc phiên Code app 2 (`docs/dac-ta-hanh-trinh-1-trang-2110.md`).

## 1. Mục tiêu sư phạm + ai dùng
Mục tiêu là cả giỏi lẫn yếu đều lên bảng. Em yếu nhận câu vừa sức để thành công. Không em nào bị bỏ quên, không em nào bị gọi mãi.

Người dùng là thầy trên lớp. Tầng chỉ hiện trên màn thầy, không bao giờ hiện trên bản chiếu.

## 2. Bố cục (bản vẽ `docs/ban-ve-goi-len-bang-2110/`)
Trong mỗi bước có gọi em:
- Khối "Cách chọn em": công tắc 3 chế độ, gồm **Trộn giỏi – yếu** (mặc định), **Chắc đúng** (như cũ) và **Ngẫu nhiên**. Kèm một câu giải thích và nút "Cách app chọn em ›".
- Ô "Phân bố": ba ô tầng ghi số lượt, số em và thanh tỉ lệ. Kèm một dòng kiểm: số em khác nhau, có em nào lên hai lần, có ai bị gọi hai câu liền nhau.
- Từng dòng gọi em: tên + chip tầng (ký hiệu 1–3 vạch, chữ, màu là kênh phụ) + lý do ("Câu dễ → em Cần kèm · 9 ngày chưa lên bảng") + nút "Đổi em".
- Bước 4 Chữa câu: mỗi câu hai vai, **Lên bảng làm** (em đã sai câu ấy) và **Giảng lại cho lớp** (em đã sửa đúng hoặc làm đúng), mỗi vai có nút Đổi em riêng.

Khổ màn:
- Điện thoại: các ô xếp dọc, công tắc ẩn dòng phụ.
- Máy tính: dùng khung 4 bước của Code app 2.

## 3. Trạng thái
- **Đang tải:** dùng khung xương của bước.
- **Thiếu dữ liệu tầng:** máy chủ cũ hoặc lỗi đọc thì vẫn chọn theo chế độ "Ngẫu nhiên", kèm câu báo thật.
- **Lớp ít em** (dưới 3 em có mặt): không chia tầng, rút thăm đều.
- **Hết em chưa lên:** lần hai được phép, ghi rõ "lên lần 2".
- **Thầy Đổi em:** rút em khác cùng tầng; tầng hết em thì lấy tầng kề.
- **Mở lại tờ chiếu:** giữ đúng danh sách đã rút, nhớ theo buổi như hiện nay.

## 4. Dữ liệu
- **Máy chủ `/gv/ung-vien-chieu`** (chỉ thêm trường):
  - Trả ĐỦ mọi em có mặt (không bỏ em thiếu dữ liệu), kèm `p` (tỉ lệ đúng câu ấy; thiếu thì `null`), `daDung`, `daSai` (cho bước 4), `soLanLenBang14` và `lanCuoiLenBang`.
  - Hai trường cuối đọc từ `len_bang` theo `sbd IN …` trong CÙNG `Promise.all` của lệnh. Không thêm vòng chờ.
- **Lõi thuần mới `src/lib/chon-em-phan-tang.ts`** (một chỗ cho mọi kênh):
  - Chia tầng theo phân vị 1/3 của `p` trong các em có mặt; `p` null xếp tầng dưới.
  - Ghép tầng theo mức độ câu: biết → Cần kèm, hiểu → Trung bình, VD/VDC → Khá; tầng kế là dự phòng.
  - Hạn mức buổi: mỗi tầng khoảng N/3 lượt.
  - Trọng số rút thăm: ×3 nếu chưa lên lần nào trong 14 ngày, ×1,5 nếu lên 1 lần, ×1 nếu lên 2 lần, ×0,7 nếu lên từ 3 lần.
  - Luật cứng: mỗi em 1 lần cho tới khi hết em; không gọi hai câu liền nhau.
  - Hạt giống rút thăm theo buổi, nên rút lại giống hệt khi mở lại tờ.
  - Ba chế độ là ba đường trong cùng hàm.
- **Kênh dùng lõi này:**
  - Dạy học (`day-hoc-len-bang.ts`, `DayHocLenBang.tsx`).
  - Kiểm tra đầu giờ: đổi `chonLuotDauGio` thành rút theo tầng, 6 em đủ ba tầng, giữ luật câu từng làm đúng.
  - Chữa câu trên lớp (`CauCanChuaTrenLop.tsx`, vai lên bảng = em đã sai).
  - Thầy tự chữa (`ThayTuChua.tsx`, `thay-tu-chua-to.ts`).
  - Tờ chiếu chiến dịch (`to-chieu.ts`).
  - Gọi lên bảng (`GoiLenBangScreen.tsx`).
- **Chế độ thầy chọn:** nhớ trên máy thầy theo từng kênh, mặc định Trộn.

## 5. Ngoại lệ
- Em vừa thêm tay ở điểm danh: vào tầng theo `p` như mọi em.
- Em vắng giữa buổi (bị bớt khỏi danh sách): không được gọi.
- Câu không có mức độ: coi như "hiểu".
- Lớp toàn em chưa có dữ liệu: rút thăm đều, có trọng số theo số lần lên bảng.
- Bấm "Đổi em" liên tục: đi vòng hết tầng rồi quay lại.
- Bản chiếu không nhận trường tầng nào: dữ liệu gửi xuống tờ chiếu chỉ có tên và SBD như cũ.

## 6. Chi phí máy chủ
- Không thêm lệnh, không thêm vòng chờ: `len_bang` đọc cùng đợt với các truy vấn sẵn có của `/gv/ung-vien-chieu`, đi chỉ mục `idx_lb_em (sbd, luc)`.
- Đáp án không đổi đường đi.

## 7. Nghiệm thu đo bằng máy
- **Test mới `tests/chon-em-phan-tang-2110.test.ts`:**
  - 22 em, 23 câu: cả 22 em được gọi trước khi có lần 2.
  - Ba tầng mỗi tầng khoảng 1/3 lượt.
  - Câu biết vào Cần kèm, câu VD vào Khá.
  - Không gọi một em hai câu liền nhau.
  - Cùng hạt giống cho cùng kết quả.
  - Chế độ "Chắc đúng" giống hệt bản cũ.
  - Lớp ít em và em thiếu dữ liệu vẫn được gọi.
- **Test kênh:**
  - Kiểm tra đầu giờ 6 em đủ ba tầng.
  - Bước 4: vai lên bảng là em đã sai câu ấy, vai giảng lại là em đã đúng.
  - Tờ chiếu không có chữ tầng.
- **Máy chủ:** `/gv/ung-vien-chieu` trả đủ em kèm số lần lên bảng; cổng tốc độ máy chủ không thêm đợt D1.
- **Cổng:** `tsc` sạch · `npm run build && npm run kiem:toc-do` 0 đỏ · `kiem:mau-giu` 0 · `kiem-sw` đạt · toàn bộ vitest so TÊN với `main`.
- **Phát hành:** chỉ gộp `main` ngoài giờ dạy, vì mỗi lần gộp Pages đổi bản và máy tự tải lại.
