# Bản vẽ app học sinh · phong cách retro "giấy ô li" · 15/10/2026

Thầy gửi ảnh "Hộp thư Zalo" và dặn: "bạn thử vẽ giao diện học sinh theo phong cách restro này, nhưng cải tiến đẹp hơn, thân thiện hơn và thích mắt hơn, vẽ trước khi tôi quyết định build nhé".

- Bản vẽ: `hs-retro.html` (mở với `?m=hom-nay` · `lam-cau` · `lam-cau&kq=sai` · `dung-sai` · `tra-loi-ngan` · `xong-chang` · `hanh-trinh` · `trang-thai` · `tong-quan`).
- Ảnh: 20 ảnh Chromium thật trong `anh/`, chụp bằng `node scripts/chup-ban-ve-hs-retro-1510.mjs`.
- Soát máy: **0 lỗi trang · 0 tràn ngang · 0 đích chạm dưới 44 px** ở cả 20 khung.
- Số liệu trong ảnh là số GIẢ. **Chưa sửa `src/`.** Chưa build cho tới khi thầy duyệt.

## Lấy gì từ ảnh mẫu, cải tiến gì cho học sinh

**Giữ từ ảnh mẫu:**
- Nền kem.
- Viền mực dày 2 px, bóng cứng lệch 4 px.
- Nhãn IN HOA giãn chữ có vạch kẻ ngang.
- Chip viền liền và chip viền đứt.
- Băng hồng báo mất kết nối.

**Cải tiến cho học sinh:**

| Cải tiến | Để làm gì |
|---|---|
| Nền **ô li** mờ (lưới 22 px) | Gợi cảm giác vở học, không làm nhiễu chữ |
| **Nút cam quýt** là nút chính duy nhất mỗi màn; bấm thì nút "lún xuống" (bóng thu về 0) | Biết ngay phải bấm gì; có phản hồi khi chạm |
| Màu theo nghĩa, luôn kèm chữ: **bạc hà** = đúng/xong · **hồng** = sai/lỗi · **vàng bơ** = cần chú ý · **đào** = đang làm · **oải hương** = trả lời ngắn | Nhìn màu là hiểu, nhưng không chỉ dựa vào màu |
| **"Đoàn tàu chặng"**: 4 toa, toa xong có dấu ✓, toa đang học kẻ sọc | Điểm nhấn duy nhất của màn Hôm nay |
| **Bậc thang 4 tầng** Nền · Hiểu · Vận dụng · Tổng hợp cao dần | Thấy mình đang ở bậc nào |
| Nhãn dán nghiêng "Đã lưu chặng 3", vài mảnh giấy màu | Mừng nhẹ sau chặng, không nhấp nháy |
| Bản tối "đêm ô li": nền mực, viền kem, bóng nâu ấm | Bóng cứng vẫn thấy rõ trên nền tối |

Mỗi màn có một việc chính và một điểm nhấn (theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`, B18 · C2). Chữ dùng đúng bảng từ chuẩn: Chặng, Hạn, Tự sửa lỗi, Bài tập về nhà, Vào ca kiểm tra…

## Đặc tả 7 mục

### 1. Mục tiêu + ai dùng
- Học sinh mở app mỗi ngày, 5 giây biết: **còn mấy câu, bấm đâu để học tiếp**.
- Cảm giác cần đạt: vui mắt, gần gũi như vở ô li; không trẻ con, không doạ.

### 2. Bố cục
- **Điện thoại dọc (390):**
  - Thanh đáy 4 mục giữ nguyên: Hôm nay · Hành trình · Ôn & sửa · Kết quả.
  - Hôm nay xếp theo đúng thứ tự app đang chạy: Việc hôm nay → Tự sửa lỗi → Bài học trong 7 ngày → Ôn và sửa.
  - "Vào ca kiểm tra" nằm cùng hàng ngày tháng.
- **Ngang (844 × 390):** câu bên trái, phần trả lời bên phải, nút nộp ở thanh đáy. Câu Đúng–sai hiện đủ 4 ý trong một màn.
- **Máy tính (1440):**
  - Cột trái là menu + "Vào ca kiểm tra".
  - Hôm nay chia 2 cột: trái là việc hôm nay + bài 7 ngày; phải là tầng đang luyện + Tự sửa lỗi + Ôn và sửa.
  - Làm câu có cột phải: bản đồ 6 câu của chặng + "19/24 câu hôm nay".

### 3. Trạng thái (ảnh 14, 15)
- **Đang tải:** khung xương kẻ sọc, đúng hình các khối thật.
- **Mất mạng:** băng hồng "Mất kết nối mạng. Em kiểm tra wifi hoặc 4G rồi bấm Thử lại." + nút Thử lại; nội dung cũ mờ đi.
- **Lỗi:** nói lý do + "Các câu em đã nộp vẫn được giữ." + Thử lại.
- **Đủ mức hôm nay:** nhãn dán "Đủ mức hôm nay", 24/24, nút phụ "Học thêm".
- **Sau khi nộp câu:**
  - Đúng: dải xanh "Đúng · tự làm".
  - Sai: dải hồng "Chưa đúng · đáp án C · câu này vào lịch ôn 1 · 3 · 7 ngày". Đánh dấu "Em chọn" và "Đáp án" ngay trên phương án.

### 4. Dữ liệu — không thêm lệnh máy chủ nào
Mọi con số đều là trường app đang có:
- `soHomNay {daLam, muc, chang, soChang}`.
- `goi7 {daLamHomNay, toiThieu, tuLamCon, tiepCanCon, goi[].{ten, han, daGap, tong, gapHomNay, quota, con}}`.
- `hanhTrinh {tang, changHienTai, soChang, bai[].{ten, tangMo}}`.
- Dải kết quả và bàn phím trả lời ngắn của `ManLamBaiTap`.

Chỉ đổi khung và màu, không đổi luồng.

Thần thú **không** đưa lại màn Hôm nay (đã gỡ trước đây). Bảng nhịp học (`BangNhipHoc`) giữ nguyên nội dung, chỉ đổi khung.

### 5. Ngoại lệ
- **Tên bài dài** ("Bài 6 · Tinh bột và cellulose"): xuống dòng, không vỡ khung.
- **Công thức có chỉ số dưới:** đã soát; bản vẽ đầu bị tách "CH 3 NH 2" và đã sửa.
- **Bấm lặp nút Nộp:** giữ chặn "Đang nộp…" như hiện tại.
- **Máy yếu:**
  - Bóng là `box-shadow` phẳng, không mờ.
  - Hoạt ảnh duy nhất là nút lún 120 ms.
  - Tắt khi máy bật giảm chuyển động.
- **Đổi tab rồi quay lại:** không đổi gì so với hiện tại.

### 6. Chi phí máy chủ và tải
- **D1:** 0 lượt đọc/ghi thêm, 0 vòng chờ thêm.
- **Phông:** bản vẽ chỉ dùng đúng Be Vietnam Pro 400/600/700 mà app đang nạp, **0 byte phông mới**. Đã bỏ phông số tròn Baloo 2 khỏi bản vẽ, vì thêm nó tốn khoảng 18,6 KB.
- **CSS:** toàn bộ CSS của bản vẽ (mọi màn) đo được 18,2 KB, nén còn 4,4 KB. Nếu chỉ cộng thêm thì vượt dung sai 1 KB của `npm run kiem:toc-do`. Khi build phải **thay**, tức gỡ CSS cũ của chính các khối được vẽ lại, để cổng vẫn 0 đỏ (mốc chỉ hạ).

### 7. Nghiệm thu đo bằng máy (khi build)
- `npx tsc -b` sạch.
- Test hiện có của Hôm nay / làm câu / Hành trình xanh, so theo tên với `main`. Thêm test mới:
  - thứ tự khối Hôm nay;
  - đúng 1 nút chính mỗi màn;
  - nhãn "Em chọn / Đáp án" sau khi nộp.
- `npm run build && npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` (xem quyết định 1) · `node scripts/kiem-sw.mjs` 13/13.
- Ảnh Chromium của **app thật** (không phải bản vẽ) ở 390 / 844 ngang / 1440, sáng + tối: 0 lỗi trang, 0 tràn, 0 đích chạm dưới 44 px.

## Thầy cần quyết trước khi build
1. **Luật màu 05/10.** Thầy dặn "giữ nguyên mọi màu sắc các lớp trong 3 app". Retro đổi màu nền (kem / mực) và màu nhấn (cam quýt) của app học sinh, nên `kiem:mau-giu` sẽ báo đỏ. Hai cách:
   - **(a)** Thầy cho phép đổi bảng màu **riêng app học sinh** theo bản vẽ.
   - **(b)** Giữ bảng màu cũ, chỉ lấy viền mực, bóng cứng, nền ô li, nhãn in hoa.
2. **Phạm vi đợt 1.** Đề xuất làm 4 màn trong ảnh (Hôm nay · Làm câu 3 phần · Xong chặng · Hành trình) và các trạng thái.
   - Ôn & sửa, Kết quả làm đợt sau, theo cùng bộ khung.
   - **Không đổi** màn ca kiểm tra và phòng chờ (luồng thi thật, C-RÀO).
3. **"Tự sửa lỗi" đang xuất hiện 2 chỗ trên Hôm nay** (thẻ riêng và ô trong nhóm "Ôn và sửa"). Bản vẽ chỉ giữ thẻ riêng (luật C4 "không lặp"). Thầy đồng ý thì bỏ ô trùng.
