# Kính lóng lánh + khung mảnh — chuẩn chung toàn app học sinh (thầy chốt 07/11, phát hành khẩn)

Thầy 07/11: «Chuẩn hóa toàn bộ khung mảnh kính lóng lánh, khung mảnh vẽ lại cho siêu nét, áp dụng mảnh và kính lóng lánh cho tất cả các nút các màn» + «Cả bong bóng của mol cũng đồng bộ» ⇒ bản vẽ `01`–`09` ⇒ «Chốt build và đẩy luôn, phát hành khẩn».

**Công thức chung** (`src/styles/kinh-toan-hs.css`, biến `--kt-*`, nạp bằng `@import` đầu `bo-cuc-hn.css` — mảnh TrongHs):
- mặt kính trong 52 % (tối 60 %); ánh tím–lam–hồng 13 %; vệt sáng chéo;
- mép vát sáng 1 px trên/dưới;
- KHUNG MẢNH 1 px màu đặc (`--kt-net` = chàm 24 % pha viền) — siêu nét;
- bóng mềm. Không gờ, không làm mờ phía sau.

**Áp cho:**
- **Khung:** thẻ Hôm nay, Việc hôm nay, rương, điểm danh, khung đề, khung Đúng–sai, phòng thi, tấm Thêm.
- **Nút phụ:** X, bóng đèn, chuông, chip, ô tấm Thêm, chặng, Hỏi thầy, phím số, ô phương án.
- **Đang chọn:** khung mảnh chàm 1,5 px.
- **Đúng / Sai:** cặp nút trong một rãnh kính.
- **Nút chính:** giữ màu riêng (chàm / lục / hồng) dưới lớp kính, khung mảnh sẫm, quầng mềm. Bấm thì co .98 thay lún.
- **Bong bóng:** Mol theo cảm xúc giữ hình khung, viền 1 px (cáu 2 px); giám thị bỏ gờ đáy.

Màn thi link `/t` không đổi.

**Nghiệm thu:**
- Cổng đạt: `check:mau`, `kiem:mau-giu` (chỉ thêm), `kiem:co-tep`, `kiem:toc-do` (bằng mốc mọi đường), `kiem-sw` 14/14.
- 69/70 tệp test liên quan đạt. Tệp còn lại là test trình duyệt nằm sẵn trong nền đỏ `docs/nen-vitest-do.json`.
- Ảnh soát bản dựng thật: `v11-kiem.jpg`.
