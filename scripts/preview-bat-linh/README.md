# Xem thử học tập tại máy

Bộ xem thử giao diện học sinh, phụ huynh và thầy dùng component thật với **dữ liệu mẫu**, không phải tài khoản hay kết quả học tập thật. Các trang này không vào bản phát hành chính. Đợt dọn 14/10 đã bỏ gallery Game; biểu cảm đang dùng trong app phụ huynh vẫn giữ.

```sh
npx vite --config scripts/preview-bat-linh/vite.config.mjs --host 127.0.0.1 --port 5173
```

Các đường dẫn cục bộ:

- `/scripts/preview-bat-linh/trang.html?man=hoc-tap`: màn học tập hiện tại; `man=sanh` cũ cũng mở màn này.
- `/scripts/preview-bat-linh/trang.html?man=xong`: học tập đã hoàn thành mức hôm nay.
- `/scripts/preview-bat-linh/trang.html?man=ph` hoặc `ph-empty`: phụ huynh đủ các tab hoặc chưa có dữ liệu.
- `/scripts/preview-bat-linh/trang.html?man=tl`: tự luyện, chọn/làm/nộp/xem lời giải.
- `/scripts/preview-bat-linh/trang.html?man=cau-da-lam`: lịch sử câu và lời giải mẫu.
- `/scripts/preview-bat-linh/trang.html?man=hs-login` hoặc `ph-login`: đăng nhập.
- `/scripts/preview-bat-linh/teacher.html`: ứng dụng thầy.

```sh
node scripts/preview-bat-linh/check.mjs http://127.0.0.1:5173 /workspace/bat-linh-preview
node scripts/preview-bat-linh/check-theme.mjs http://127.0.0.1:5173 /workspace/bat-linh-dark-preview
node scripts/preview-bat-linh/check-bieu-cam.mjs http://127.0.0.1:5173
```

Các phép kiểm giữ lỗi JavaScript, ảnh hỏng, tràn ngang, đổi sáng/tối và thao tác học tập/PH. `check-bieu-cam.mjs` giữ phép kiểm **Câu đã làm** từ bộ kiểm hỗn hợp cũ; nhánh biểu cảm xe/trận đã ngừng được bỏ. `check-teacher-modern.mjs` giữ kiểm giao diện thầy. Mọi yêu cầu phải ở origin cục bộ; bộ mẫu không dùng để thẩm định nội dung học thuật.

`muc-luc.html` có tám màn học tập/PH; sao chép thành `index.html` ở gốc thư mục build riêng để dùng `check-muc-luc.mjs`. `dong-goi-ngoai-tuyen.py` đóng gói các ảnh học tập/PH còn dùng và atlas biểu cảm hiện tại; không còn đòi ảnh chụp Game.
