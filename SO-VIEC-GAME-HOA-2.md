# SỔ VIỆC — Game Hóa 2.0 (phiên cloud, nhánh `claude/loving-babbage-9i6b83`)

Chỉ GHI THÊM ở cuối. Mỗi dòng: `- [ ]` chưa · `- [x]` xong + bằng chứng · `- [!]` kẹt + lý do.

## Lời thầy (nguyên văn, theo thứ tự)

- [x] "bạn hãy đọc đặc tả này và tối ưu tốt nhất cho tôi" | bằng chứng: bảng 9 lỗi + bản tối ưu + mô phỏng 300 lần (scratchpad/mo-phong.mjs, kq3.txt)
- [x] "bạn hiển thị tối ưu cho tôi trước rồi tôi xác nhận mới build nhé" | bằng chứng: đã trình trong hội thoại, chưa build tới khi thầy chốt
- [x] "đề xuất một bản thiết kế hoàn hảo … Tôi đọc trước rồi build" | bằng chứng: prompt-game-hoa-2-0.md (commit 363479d)
- [x] "vẽ hiển thị giao diện của 3 app cho tôi xem trước" | bằng chứng: canvas https://claude.ai/artifact/Defd4pkQJz3hTvsY6ZQEzE (23 màn)
- [x] "vẽ cả bên trong game nhé, giữ nguyên cách chơi game hiện tại" | bằng chứng: hàng "Trong game — giao diện hiện tại" 6 màn
- [x] "Làm cho màn chơi game bát linh đảo và hộ tống đoàn đẹp hơn … vẽ lại thiết kế trong game đỉnh của chop" | bằng chứng: hàng "THIẾT KẾ MỚI" 7 màn
- [x] "lời giải ở mọi chỗ phải hiển thị đúng chuẩn lời giải trong app trước đó" (bản vẽ) | bằng chứng: Câu đã làm, PDF, ải, màn lời giải theo mẫu TheCau
- [ ] "lời giải ở mọi chỗ phải hiển thị đúng chuẩn" — ÁP DỤNG CẢ KHI BUILD (dùng lại TheCau/khối .loi-giai, không tự vẽ bản thứ hai) | bằng chứng: (chưa có)

## Thầy chốt 27/09 (nguyên văn)

- [ ] "1. Game dùng thiết kế mới hoàn toàn" | bằng chứng: (chưa có)
- [ ] "2. Sảnh dùng bản đồ bát linh" | bằng chứng: (chưa có)
- [ ] "3. Ok đồng ý" (Rương Bát Linh: xong 40/40 câu/ngày → rương phụ kiện, không cộng EXP ngoài trần 120) | bằng chứng: (chưa có)
- [ ] "4. Bỏ hẳn BTVN" | bằng chứng: (chưa có)
- [ ] "4. … bỏ mọi thứ chỉ để lại game như bạn đã thiết kế" | bằng chứng: (chưa có)
- [ ] "5. Bỏ hết" (app phụ huynh bỏ hẳn; BTVN đang mở bỏ luôn) | bằng chứng: (chưa có)
- [ ] "sau khi build xong cho reset lại toàn bộ về 0, chọn lại thần thú" | bằng chứng: (chưa có) — DANH SÁCH ĐỎ: chạy trên D1 thật chỉ sau khi thầy duyệt bảng XOÁ/GIỮ cụ thể
- [ ] "Giữ lại toàn bộ hồ sơ dữ liệu của từng học sinh" | bằng chứng: (chưa có)
- [ ] "xoá toàn bộ các ca thi cũ" | bằng chứng: (chưa có) — DANH SÁCH ĐỎ, như trên

## Việc phát sinh

- [x] Cài thư viện (`npm ci`) để chạy test trong phiên cloud | bằng chứng: exit 0
- [!] Đẩy Worker/Pages từ phiên cloud | KẸT: phiên này không có khoá Cloudflare (0 biến CLOUDFLARE*) → đẩy nhánh, nhờ phiên máy thầy (Code 3 / Code 2) phát hành
- [ ] Giả định: 4 điểm tối ưu thuật toán (thứ tự ôn gần chín +80/vừa sai +60, Huyết Chiến trần 80, EXP giữ luật cũ + câu 41 trở đi 0 EXP, sai ≥4 → Cần thầy dạy lại) GIỮ NGUYÊN — "Bỏ hết" hiểu là bỏ tính năng, không bỏ các bản sửa lỗi thuật toán | bằng chứng: ghi vào prompt + báo thầy
- [ ] Giả định: vé Đoàn — chặng có câu ôn miễn phí; +1 vé mỗi ngày xong kế hoạch 40 câu (thay nguồn vé từ BTVN) | bằng chứng: (chưa có)

## Định nghĩa hoàn thành (chép từ NGHIỆM THU của prompt-game-hoa-2-0.md, cập nhật theo quyết định 27/09)

- [ ] N1. Công tắc bật: học sinh đăng nhập → Sảnh bản đồ; không còn đường vào BTVN/Bảng tin/Bảng nhiệm vụ; dải "Vào thi" hiện khi có ca mở, ẩn khi không
- [ ] N2. Mô phỏng tự động 300 lần (kho 150 câu, 14 ngày, 40 câu/ngày): cọ xát = 100% tại hạn nộp; Thành thạo cao hơn thuật toán đặc tả gốc
- [ ] N3. Trạng thái câu dựng lại từ su_kien_hoc khớp 100% (test)
- [ ] N4. Công tắc tắt: toàn bộ vitest không thêm tên test đỏ so với nền; app như cũ
- [ ] N5. "Tải PDF" Câu đã làm có công thức mhchem ra đúng (ảnh chụp)
- [ ] N6. Hết hạn chiến dịch: Lên bảng tự mở Buổi chữa, mỗi em có mặt ≥ 1 lượt, tổng ≤ 90 phút
- [ ] N7. Mỗi luật ở mục B của prompt có ≥ 1 test tự động
