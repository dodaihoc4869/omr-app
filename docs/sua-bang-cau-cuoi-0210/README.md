# Sửa bảng bị ẩn và câu ôn cuối — 02/10/2026

Theo yêu cầu thầy sửa và phát hành ngay. Nền: `1211ef8302f6408363e5b4f057a7235a5f5468fc`.

## Nguyên nhân và bản sửa

- Khung bảng `.cau-bang` là con của thẻ câu flex dọc, mặc định co được và có overflow. Khi đề dài, trình duyệt co khung xuống **0 px** dù bảng thật cao 79 px. Giữ `flex-shrink: 0` tại bộ hiển thị chung; thẻ câu cuộn dọc, bảng cuộn ngang. Kiểm trên Chromium thật, 390/1440 px, sáng/tối: sau sửa đủ 79/79 px, đủ 10 ô, không tràn cả trang. Số liệu trong ảnh thử được ghi rõ là minh hoạ, không nạp vào kho thật.
- Kế hoạch ngày lưu mã câu gốc nhưng sổ học ghi biến thể `~ss0`/`~ss1`. Bộ đếm cũ không cộng vào nhiệm vụ gốc, khiến còn một câu và vẫn khoá Đảo. Cộng các lượt theo mã gốc khi đọc kế hoạch. Không sửa điểm, lịch sử hay luật thành thạo. Kiểm tích hợp SQLite: còn 1 câu → làm biến thể → sảnh còn 0 → mở Đảo và rút được câu mới; nhiệm vụ lặp `#2` vẫn đếm đủ hai lượt.
- Khâu nạp/phủ câu biến thể bỏ bảng/ảnh, cả đường game và dựng đề riêng. Giữ đúng bảng/ảnh của biến thể xuyên suốt tới màn học sinh. Câu nhắc bảng mà không có dữ kiện không được chọn; quay về câu gốc đầy đủ theo đường dự phòng sẵn có. Không mượn bảng gốc cho số mới và không tự đoán ô thiếu. Chỉ số chọn biến thể giữ nguyên vị trí gốc sau lọc.

## Rà kho thật, chỉ đọc

Actions [37024301410](https://github.com/dodaihoc4869/omr-app/actions/runs/37024301410): quét 15.359 câu gốc, 379 câu có bảng, 1.912 biến thể. Các câu dầu hướng dương liên quan ảnh gửi đều **có bảng trong chỉ mục**: lỗi trình bày tái hiện được ở trên.

Phát hiện 6 biến thể nhắc bảng nhưng không mang bảng/ảnh: `DH-12-C1-B1-P2-DT-I-1~ss0/1`, `DH-11-C2-B5-III-24~ss0/1`, `DH-10-C2-B6-III-14~ss0/1`. Bản sửa loại chúng khỏi lượt chọn cho tới khi có dữ kiện đầy đủ.

Hai câu gốc nghi thiếu dữ liệu theo tìm từ khoá: `DB-10-B7-D1-I-73`, `DH-10-C2-B8-I-29`. Chưa kết luận thiếu bảng thật: đối chiếu gói R2 qua API hiện có trả HTTP 403. Không sửa hoặc tạo số liệu cho hai câu này. Đây là giới hạn rà soát nội dung, không phải lý do bỏ sửa lỗi hiển thị chung. Workflow kiểm kho không ghi D1/R2 và không in đề/đáp án/thông tin học sinh.

## Kiểm chứng

- 57/57 kiểm thử liên quan đạt, gồm nạp → phủ → dựng đề → hiển thị bảng, không lộ đáp án và tiến trình câu cuối.
- Toàn bộ 13.302 kiểm thử: 13.146 đạt, 128 lỗi nền, 28 bỏ qua. So **tên lỗi** với bản gốc 13.294 kiểm thử: không có tên lỗi mới. Xem `doi-chieu-test.json`.
- TypeScript app, kiểm màu, build Cloudflare và Service Worker 13/13 đạt.
- `bang-truoc.json` / `bang-sau.json`: đo trình duyệt trước/sau; ảnh JPG <150 KB. Chạy lại với Vite cổng 5197 và `node scripts/kiem-bang-trinh-duyet-0210.mjs`.
- Tự soát thay đổi phần đề dùng chung: chỉ chuyển thêm bảng/ảnh riêng của biến thể, không đổi đáp án, cách chấm, phạm vi kiến thức hoặc ma trận rút đề. Không migration, không ghi đè dữ liệu thật.

## Phát hành

Đẩy qua quy trình GitHub Actions hiện có: checkout sạch đúng commit → kiểm thử/build → Pages → Worker. Sẽ ghi mã phát hành sau khi Cloudflare xác nhận thành công. Workspace không mở trực tiếp được pages.dev; không coi ảnh thử cục bộ là ảnh production.
