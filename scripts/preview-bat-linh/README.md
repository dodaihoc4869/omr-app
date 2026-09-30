# Xem thử Bát Linh tại máy

Đây là bộ xem thử riêng cho giao diện học sinh, phụ huynh và game. Dùng component thật với **dữ liệu mẫu**, không phải tài khoản hay kết quả học tập thật. Không đưa các trang này vào bản phát hành chính.

```sh
npx vite --config scripts/preview-bat-linh/vite.config.mjs --host 127.0.0.1 --port 5173
```

Mở đường dẫn trên máy đang chạy Vite:

- `/scripts/preview-bat-linh/trang.html?man=sanh`: học sinh.
- `/scripts/preview-bat-linh/trang.html?man=ph`: phụ huynh, đủ các tab.
- `/scripts/preview-bat-linh/trang.html?man=tl`: tự luyện.
- `/scripts/preview-bat-linh/trang.html?man=hs-login` hoặc `ph-login`: đăng nhập.
- `/scripts/preview-bat-linh/games.html?game=dao&thu=1&cap=50`: đảo, bắt đầu chuyến để xem trận/lời giải.
- `/scripts/preview-bat-linh/games.html?game=doan&man=sanh`: Hộ Tống. Các trạng thái khác: `tran`, `trum`, `cot-loi`, `ket-qua`, `tiep-suc`, `thang`, `thua`, `sanh-het`.
- `/scripts/preview-bat-linh/games.html?game=thu&man=chon`: chọn thú. Các màn: `dao`, `so-tay`, `tui`.
- `/scripts/preview-bat-linh/games.html?game=shop&pet=1&cap=50&man=thu-do`: cửa hàng/thử đồ/tủ đồ. Các nút công tắc phía trên là công cụ kiểm thử, không nằm trong sản phẩm.
- `/scripts/preview-bat-linh/games.html?game=chuong`: tung chưởng (giữ màn để xem); thêm `&boss` để xem hiệp trùm.
- `/scripts/preview-bat-linh/games.html?game=bia`: Bi-a.

Kiểm tra và chụp ảnh tự động (cần Chromium, mặc định `/usr/bin/chromium`; có thể đặt `PW_CHROMIUM`):

```sh
node scripts/preview-bat-linh/check.mjs http://127.0.0.1:5173 /workspace/bat-linh-preview
node scripts/preview-bat-linh/check-games.mjs http://127.0.0.1:5173 /workspace/bat-linh-preview
```

Các phép kiểm chặn yêu cầu ra ngoài origin xem thử. Chúng kiểm tra lỗi JavaScript, ảnh hỏng, tràn ngang và các luồng thao tác. Ảnh trong SVG đợi tải xong trước khi chụp. Bộ mẫu không dùng để thẩm định nội dung học thuật.


Bổ sung 30/09: `games.html?game=bieu-cam` có đủ 8 thú × 6 nét và thanh kiểm tra máu xe; `trang.html?man=cau-da-lam` có lịch sử câu với lời giải mẫu. `muc-luc.html` là mục lục 30 màn; sao chép thành `index.html` ở gốc thư mục build riêng.

Kiểm tra bổ sung: `check-bieu-cam.mjs` (19 trường hợp), `check-muc-luc.mjs` (30 màn đóng gói tại port 5174), `chot-anh.mjs` (ảnh cuối và màu nút đọc lời giải). `dong-goi-ngoai-tuyen.py` nhúng 37 ảnh chụp + atlas biểu cảm vào một HTML ngoại tuyến; đây là bản xem bằng ảnh, không thay thế app chạy tương tác.
