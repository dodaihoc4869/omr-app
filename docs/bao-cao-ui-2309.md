# Sửa tràn giao diện ba app — 23/09/2026

## Kết quả và phạm vi

Đã sửa ba nguyên nhân ở CSS. Không sửa API, cách chấm, chọn câu, luật thi, dữ liệu hay TSX game; không commit/push/deploy. Bản sửa hiện nằm trong thư mục làm việc dùng chung. Giữ nguyên các tệp dirty đã có trước khi nhận việc.

| Lỗi tái hiện | Nguyên nhân | Sửa |
|---|---|---|
| Hộp xác nhận GV dài cao hơn màn; ở 320×720, mép trên khoảng −928 px, mép dưới 1648 px. Không cuộn tới đủ tiêu đề và nút. | `.hxn-hop` được căn giữa nhưng không giới hạn chiều cao hoặc có vùng cuộn. | `src/components/hop-xac-nhan.css`: giới hạn `100dvh − 32px`, dự phòng `100vh`, cuộn trong hộp; ngắt chuỗi dài; ô nhập/nút co theo hộp. Sau sửa hộp nằm trong y=16…704. |
| Tên bài liền dài trong mô tả nhiệm vụ HS bị cắt mất phần cuối. Bỏ lớp che trong phép đo thì trang 320 px rộng thành 2354 px. | `.bnv-the-ten` có ngắt từ nhưng `.bnv-the-mo-ta` chưa có; `overflow-x:hidden` gốc bảng che lỗi. | `src/components/bang-nhiem-vu/bang-nhiem-vu.css`: cho mô tả ngắt token dài, bỏ `overflow-x:hidden` gốc bảng. Trang trở lại đúng 320 px. Nền trang trí vẫn có khung cắt riêng. |
| Vỏ GV desktop không còn khoảng trống 12 px bên phải. | Grid child rộng `100%` track rồi cộng thêm margin 12 px. | `src/styles/vo-thay.css`: desktop dùng `width:auto` để grid trừ margin. Ở viewport 1280, mép phải khung đúng 1268. |

App PH được khảo sát bằng component thật: màn chính và bảng “Mọi thứ về con”, bộ dữ liệu đầy đủ có sẵn, tên dài/số lớn. Chưa tái hiện lỗi mới trong các cảnh này nên không đổi CSS PH. Thẻ câu thật đã kiểm nội dung dài, công thức KaTeX, bảng 11 cột và ảnh 1400×400; không sửa khi không có lỗi.

## Kiểm chứng

- `node scripts/kiem-tran-giao-dien-2309.mjs`: **96 cảnh đạt** = 6 màn × 4 viewport (320, 390, 768, 1280) × chữ 100/115% × sáng/tối. Thêm hộp thoại ở chiều cao 320 px.
- Sáu màn: Mở ca GV, thẻ câu, hộp xác nhận GV, màn chính PH, bảng PH, bảng nhiệm vụ HS. Chỉ mount component thật với dữ liệu giả trong trình duyệt riêng.
- Đo cả khung phần tử và range của chữ sau khi tắt các lớp che tràn gốc bằng CSS kiểm thử; không chỉ dựa vào `document.scrollWidth`. Bỏ qua SVG trang trí, nội dung trợ năng ẩn, vùng cuộn có chủ đích và nhãn ellipsis.
- Kiểm nút xác nhận cuộn tới được, ảnh tải đúng kích thước tự nhiên, KaTeX tồn tại, bảng rộng cuộn trong khung riêng, mép phải grid GV đúng 12 px. Không click gửi hoặc tạo ca.
- Mọi request ngoài origin dev local bị chặn. WebSocket HMR bị chặn để phiên khác sửa mã không thay fixture giữa phép đo. Dev server bắt buộc localhost/127.0.0.1.
- `npx vitest run tests/hop-xac-nhan-2109.test.tsx tests/bang-nhiem-vu-1909.test.tsx tests/ca-thi-m3-2109.test.tsx --reporter=dot`: **103/103 đạt**. Có cảnh báo React `act` từ test cũ, không có test thất bại.
- `node scripts/soi-giao-dien.mjs --tep src/components/hop-xac-nhan.css --tep src/styles/vo-thay.css --tep src/components/bang-nhiem-vu/bang-nhiem-vu.css --chi-loi`: **0 lỗi, 0 cảnh báo**.
- `git diff --check` trên ba CSS và script: đạt. Full build/tích hợp được để cho phiên phụ trách tích hợp theo phân công Boss.

## Tái chạy và bằng chứng

Mở dev bằng `npm run dev -- --host 127.0.0.1 --port 5173`, rồi `node scripts/kiem-tran-giao-dien-2309.mjs`. Có thể đổi cổng bằng biến `GOC_XEM_THU`. Mặc định ảnh kiểm thử nằm ở `/tmp/omr-ui-2309`; đổi thư mục bằng `UI_OUTPUT`.

Bốn ảnh đã giữ trong `docs/anh-ui-2309/` (JPG mỗi ảnh dưới 150 KB): `hop-390-light.jpg`, `hop-1280-dark.jpg`, `hs-390-light.jpg`, `hs-1280-dark.jpg`. Ảnh hộp là lúc cuộn tới ô nhập/nút; tiêu đề ở đầu vùng cuộn, được kiểm riêng trong script.

## Giới hạn

Đây là kiểm thử Chromium local và component thật bằng dữ liệu giả, không chứng minh mọi trang/tài khoản production đều hết lỗi. Không chạy ca thi thật hoặc tạo dữ liệu thật. Không kiểm thiết bị Safari/iOS vật lý hoặc bàn phím phần mềm thật. Game kết chuyến đã khảo sát sơ bộ ở bốn viewport; phần gameplay/Đoàn Hộ Tống do Code 2 phụ trách, không được nhận là đã kiểm toàn bộ tại báo cáo này. Các lớp che tràn cũ của body/vỏ GV/PH chưa bị xoá hàng loạt; script chủ động vô hiệu chúng trong phép đo để không che lỗi ở các cảnh đã kiểm.
