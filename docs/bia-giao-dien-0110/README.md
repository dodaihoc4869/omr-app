# Giao diện Bi-a và tiếng chạm bi — 01/10/2026

Phạm vi: bàn, bố cục, màu, bánh răng, thanh lực và âm thanh. Giữ nguyên vật lý, A.I, luật, điểm/EXP, API và dữ liệu học sinh. Mã trước: `a4787721`; mã giao diện cuối: `b2d67cac`.

## Thiết kế

- Nỉ xanh ngọc sáng, viền champagne, gỗ mật ong và lỗ có viền vàng. Hoa văn Hoá học nhẹ hơn; trang trí dựng vào ảnh nền một lần mỗi cỡ, giữ bộ vẽ vùng bẩn/ảnh bi đã tối ưu.
- Máy tính: cột điều khiển 52 px, bỏ cột diễn biến cố định 292 px; nhật ký/phím tắt mở qua nút riêng hoặc Tuỳ chỉnh. Đọc nhật ký bằng bàn phím không xoay gậy; đóng xong trả focus về Tuỳ chỉnh.
- Dọc: giảm lề và hàng điều khiển; thanh lực cao bằng bàn. Ngang: giữ hai cột an toàn 48 px, bỏ nền tối bắt buộc, tự theo màu toàn app. Giữ tỉ lệ bàn để bi/đường ngắm không bị kéo giãn.
- Bánh răng có răng vát kim loại, ánh sáng trục, biểu tượng bánh răng; đã bỏ chữ “Tinh chỉnh”. Bước vân 13 px và bộ xử lý kéo/chạm giữ nguyên. Tay kéo có viền champagne và ba rãnh nhỏ; số % trên máy tính hiện về phía bàn.
- Màu xanh ngọc/kem/vàng Bát Linh, theo sáng/tối tự động. Không thêm blur vào màn chơi; vùng chạm chính từ 44 px.
- Không đổi kích thước vật lý W = 500, H = 900, T = 26, toạ độ/lỗ bi hay ma trận đổi vị trí con trỏ.

## Âm thanh

Ba mẫu va chạm phenolic 48 ms dựng sẵn bằng Web Audio: đầu tiếng rộng dải, thân tiếng tắt nhanh; lực va chạm quyết định độ to/cao. Cú phá bàn vẫn khô, không tiếng lăn liên tục; giới hạn 5 tiếng bi + 3 tiếng băng/khung, tắt/bật theo cài đặt chung. Không tải tệp âm thanh mới, không DSP theo khung hình. `cham-bi-moi.wav` xuất từ chính bộ phát của game bằng OfflineAudioContext, lần lượt lực nhẹ/vừa/mạnh; không phải bản thu từ bàn thật.

## Bằng chứng

`kiem-tra.json`: Chromium ở 360×740, 390×844, 768×1024, 844×390, 1280×800, 1440×900; sáng/tối. Cả 9 kịch bản không lỗi JS, không tràn ngang; nút tròn nhỏ nhất 44 px. JPG dưới 150 KB/ảnh. Trang thử chạy BiaGame thật, API giả và CSS cổng học sinh; không gửi yêu cầu tới máy chủ thật.

`thao-tac-am-thanh.json`: cùng một ván đổi 390→844→1440→390, trạng thái bi/góc/số cú giữ nguyên; tay trái/phải, nhật ký + Esc, kéo lực rồi Huỷ đúng. Tấm câu hiển thị vừa màn hình dọc/ngang; kiểm giảm chuyển động. Ba mức lực phát âm thanh tăng dần, không vượt biên gây vỡ tiếng. Các test luật, vật lý, shader/ảnh bi và tương tác giữ lại.

Lặp kiểm giao diện: chạy Vite ở cổng 4176 rồi `PW_CHROMIUM=/usr/bin/chromium node docs/bia-giao-dien-0110/kiem-giao-dien.mjs`. Chromium dùng trình duyệt đã cài.

## Kiểm phát hành

Build từ worktree sạch, giữ nguyên byte public/sw-version.json trong nguồn; kiểm màu và Service Worker 13/13, precache 165 tệp / 2988 KB (trần 170 / 3000). Hồi quy toàn bộ đối chiếu từng tên lỗi với bản đã phát hành trước, không chỉ số lượng. Kết quả cuối và mã Pages/Worker ghi sau khi xác minh phát hành.

Đo FPS cục bộ dùng trang thử production, CPU chậm 6×, không chạy cùng hồi quy nặng. Đây là kiểm tránh giảm độ mượt khi đổi đồ hoạ, không phải chứng minh toàn app nhanh hơn 5×. Static preview có thông báo 404 tài nguyên phụ ở cả bản trước/sau; kiểm giao diện Vite riêng không lỗi JS. Không gửi tải giả hoặc sửa dữ liệu trên app thật.

Mốc quay lại: Pages a7447334, Worker a780651e-2306-4b7c-8d13-ee6973ee76e6 (nguồn trước thay đổi). Workflow hiện tại phát hành cả Pages và Worker; server/ không thay đổi trong đợt giao diện này. Workspace chặn kết nối trực tiếp tới Pages/Worker, nên xác minh qua log GitHub Actions/Cloudflare, không nhận là đã đăng nhập kiểm trên app thật.

## Kết quả kiểm cuối

- Nguồn cố định: b2d67cac5d193f814559544cafd1d5fe42588e7e, worktree sạch omr-bia-ui-final2.
- Vitest: 13.133 test; 12.978 đạt, 127 lỗi có sẵn, 28 bỏ qua. Không có tên lỗi mới so với bản trước; hoi-quy.json ghi đối chiếu. Test nhật ký mới đạt, kiểm cả trả focus sau đóng.
- Kiểm màu đạt; build đạt; SW 13/13 và precache 165 tệp / 2988 KB. Lint 4 tệp chính có 13 chẩn đoán nền, không thêm chẩn đoán mới.
- Chromium kiểm toàn màn hình và đổi sáng/tối ngay khi đang chơi, không làm đổi ván.
- Đo cuối (do-may-yeu-cuoi-0 = trước, -1 = sau), CPU 6×, một mẫu/kịch bản, cùng seed, chạy sau khi hồi quy hoàn tất. Dọc thường: FPS bi đang lăn 59,7 → 59,7; p95 khung 16,7 → 16,7 ms; p95 kéo 37,7 → 37,6 ms. Ngang máy yếu: FPS bi lăn 59,7 → 59,8; p95 khung 16,8 → 16,7 ms; p95 kéo 37,2 → 38,3 ms.
- Mặt bàn dọc rộng hơn; CPU luồng chính tăng 35,4 → 40,2% (dọc), 27 → 30,3% (ngang yếu); vào bàn 614,3 → 651,8 ms và 466,7 → 556 ms. Không nhận là nhanh hơn. Một mẫu cục bộ không dự báo mọi điện thoại; FPS và độ trễ kéo gần mức trước. Các thông báo 404 ở static preview có số lượng giống bản trước, không dùng làm lỗi runtime của app thật.

## Đã phát hành

- GitHub Actions [36813231243](https://github.com/dodaihoc4869/omr-app/actions/runs/36813231243), job 110212633313: thành công.
- Pages c2e03065, lúc 11:15:39 ngày 01/10 (giờ Việt Nam). Worker ba6114c9-d2b7-4b91-9e5d-fa6be9f68b20, lúc 11:15:45. Nguồn runtime b2d67cac; chỉ có giao diện/âm thanh, không sửa server/.
- CI: 13.053 test (khác local vì các suite không nạp được trên runner); 12.899 đạt, 126 lỗi nền, 28 bỏ qua. Đối chiếu từng dòng FAIL với lần CI trước: 0 dòng lỗi mới (133 dòng sau, 134 dòng trước, gồm cả lỗi nạp suite). Không coi CI xanh là toàn bộ test xanh; workflow có continue-on-error cho nền đỏ cũ.
- Không truy cập trực tiếp app sống từ workspace bị chặn mạng; mã phát hành/thời điểm xác nhận bằng log Cloudflare.
- Tài liệu/chứng cứ bổ sung bằng commit [skip ci] để không tạo thêm một đợt phát hành.
