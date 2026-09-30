# Trang sức, app giáo viên và tối ưu · 01/10/2026

Đợt tiếp theo trên nền production 36ee817f. Bảng giá m1-v2 đã phát hành trước, không thay số dư, giao dịch, điều kiện học/cấp hoặc mở 16 món đợt hai.

## Thay đổi

- 32 hình SVG dùng chất liệu kim loại, ngọc, pha lê chung; giữ hình dáng, màu nhận diện và điểm neo từng món. Tám khung tên thêm viền trang sức và mặt đá dưới tên. Không phủ đá lên mặt thú, không thêm blur/filter/hoạt ảnh tốn máy.
- Thẻ cửa hàng dùng cùng hình với món thực sự đeo trên thú. Tải lười hình gần vùng nhìn, thay placeholder cũ; bản điện thoại 390 px chỉ tải bốn mảnh hình đầu thay vì 16 mảnh SVG đang mở bán. Cuộn xuống vẫn nạp hình. Không ép tải ảnh của món đợt hai chưa mở.
- Thử đồ dùng một cấu trúc cho màn dọc/ngang: thú lớn hơn, đủ chỗ khung tên; món đang thử, điều kiện mua và nút mua rõ. Thông tin hoá học/giá/ví/giới hạn nằm trong mục mở rộng; không thay protocol mua, xác nhận hay chống bấm đúp.
- Toàn vỏ giáo viên có lớp hoàn thiện bề mặt, khoảng cách, thứ bậc số liệu, bảng, nút và trạng thái focus. Phạm vi `.m3.vo-thay`, tiếp tục màu theo nghĩa, chế độ sáng/tối và lựa chọn giao diện cũ.
- Tổng quan tải ca và chiến dịch song song, tối đa bốn lượt đọc bảng chiến dịch cùng lúc; không để phản hồi cũ ghi đè lần tải mới, dừng cập nhật khi rời màn và xử lý lỗi từng nguồn riêng.
- Bi-a đệm màu/chiếu sáng nền cầu theo loại/cỡ; chỉ tính lại phần thật sự đổi khi lăn. WeakMap tối đa bốn ảnh nhỏ theo bóng, thu hồi được. Không đổi vật lý, quaternion, luật thi, đề, đáp án hoặc chấm điểm.
- Worker chia sẻ **chỉ truy vấn D1 đang chạy** cho trạng thái phòng chờ công khai, giới hạn 128 ca đang đọc mỗi binding/isolate. Không TTL: promise xong là bỏ; nhịp sau đọc mới. Không dùng cách này cho đề, quyền vào thi, đáp án, nộp bài hoặc dữ liệu người dùng.

## Đo và giới hạn

Chromium CPU chậm sáu lần; riêng tô pixel bi, 3.000 lượt/lần, năm lần xen kẽ cũ/mới, lấy trung vị. Tệp tham chiếu `scripts/preview-bat-linh/ve-bi-baseline.ts` lấy nguyên bản 36ee817f. Kết quả nhanh **1,27–1,87 lần** ở cỡ 20/32/48 và bốn loại bi, không phải toàn game. Test đối chiếu byte RGBA bao phủ 576 tổ hợp, thêm đổi kiểu/chữ trên cùng bóng.

Đo build toàn màn bằng script máy yếu sẵn có, ba lượt lấy trung vị: vào sảnh và mở đấu A.I. Bản cũ 39 FPS thao tác, bản mới 41 FPS; TBT 976→605 ms. **Chạy cùng lúc với hồi quy nên đây chỉ là số quan sát có nhiễu**, chưa dùng để kết luận mức cải thiện toàn game. Script chưa mô phỏng cả ván/thiết bị Android thật. Không cam kết tốc độ, mượt hay ổn định toàn app gấp năm lần.

SQLite cục bộ: 300 yêu cầu đồng thời cùng ca/isolate dùng một SELECT; 5.000 yêu cầu chia mười isolate dùng mười SELECT. Đã kiểm route Worker trả đúng trạng thái, không đề/đáp án, nhịp sau thấy lúc bắt đầu. Đây là đếm truy vấn khi chồng thời gian; không phải 5.000 học sinh thi thật, không phải đo độ trễ D1/Cloudflare hay năng lực nộp bài ở production.

## Tái kiểm tra

- `npx vite --config scripts/preview-bat-linh/vite.config.mjs --host 127.0.0.1 --port 5183` (nếu node_modules là symlink cần `server.fs.allow` tới thư mục thật).
- `node scripts/preview-bat-linh/check-shop-luxury.mjs http://127.0.0.1:5183 /tmp/luxury-preview`
- `node scripts/preview-bat-linh/check-teacher-modern.mjs http://127.0.0.1:5183 /tmp/luxury-preview`
- `node scripts/do-bi-a-trang-suc.mjs http://127.0.0.1:5183 /tmp/luxury-shader.json`
- `PW_CHROMIUM=/usr/bin/chromium npx vitest run tests/phu-kien-dat-do-trinh-duyet-2109.test.ts tests/phu-kien-mac-do-trinh-duyet-2109.test.ts`

Trình duyệt: 20/20 bài kiểm điểm neo mọi loài/giai đoạn/hướng; cửa hàng/thử đồ sáu khổ sáng/tối; bốn màn giáo viên chính × hai khổ × sáng/tối =16 trường hợp. Dữ liệu fixture, chặn yêu cầu ra máy chủ thật. Không kiểm giao dịch bằng tài khoản thật.

Hồi quy đầy đủ: 13.115 test, 12.954 đạt, 133 đỏ, 28 bỏ qua. Đối chiếu tên với bản giá trước: một lỗi mới duy nhất là timeout bài so byte bi (deep equality quá chậm), đã đổi sang Buffer.compare đối chiếu byte chính xác và chạy lại đạt. Còn 132 tên lỗi nền đã xuất hiện ở lần chạy trước; không có lỗi hành vi mới sau rerun. Kiểm lại riêng 168 bài shop/UI/hợp đồng nguồn và 30 bài Bi-a/phòng chờ/luồng ca/giới hạn tải đạt. Hai ca burst mới chạy thêm sau full suite đã đạt. Không che lỗi bằng thay đổi kỳ vọng chức năng.

## Phát hành

Đang kiểm hồi quy trước phát hành. Mốc lùi: main 36ee817f, Pages dfb4593e, Worker c3cdceeb-c987-4d01-b468-e52beae812c5, Actions 36749269228. Mạng workspace chặn CONNECT tới pages.dev; kiểm UI bằng trình duyệt cục bộ và xác nhận phát hành bằng log GitHub Actions/Cloudflare, không tuyên bố đã kiểm HTTP trên bản sống.
