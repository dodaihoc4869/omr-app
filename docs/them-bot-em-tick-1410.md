# Thêm / Bớt em trong Tick bài — đặc tả đã chốt 14/10/2026

Trạng thái: thầy đã duyệt bằng “Ok chốt”. Codex đã build giao diện và máy chủ trong PR291, thay **Sửa em** cũ cùng lượt. Nguồn được kiểm cuối: `a2da228b`; kết quả và giới hạn trong [báo cáo C3](ket-qua-c3-1410.md). Không sửa danh sách/hạn nộp thật thay thầy. Claude được thông báo qua nhật ký và PR; chưa có xác nhận soát của Claude.

## 1. Mục tiêu và người dùng

Thầy chỉnh những em nhận một bài đã tick ngay tại bước **Tick bài vừa dạy**, theo từng bài và lớp. Thêm em cho em nhận đúng Gói 7 của lớp; bớt em ngừng giao thêm câu từ gói đó. Giữ kết quả đã làm, điểm, lời chữa, đề kiểm tra đã công bố và kế hoạch của mọi em còn lại. Không đổi thuật toán `chonGoi7`, quota hay quy tắc chấm.

## 2. Bố cục

- Trong dòng bài/lớp ở **Bài đang giao**, nút **Thêm / Bớt em** cạnh **Sửa hạn**. Dòng chỉ có một cửa chỉnh danh sách nhận bài.
- Mở tấm **Em nhận Bài 8. Amine**, ghi rõ lớp và số em đang nhận. Tái dùng `ChonEmGiao` với danh sách được giới hạn đúng lớp của gói, có tìm tên/SBD, chọn từng em/cả lớp.
- Dưới bộ chọn: **Thêm N em · Bớt N em · Sẽ nhận N em**, hiện tên những em thay đổi. Nút chính **Lưu danh sách**, nút phụ **Hủy**. Chưa có thay đổi thì không lưu.
- Điện thoại dọc: tấm vừa chiều rộng, nội dung cuộn, nút lưu ở đáy trong tấm. Điện thoại ngang: phần tóm tắt và bộ chọn đặt cạnh nhau; danh sách cuộn riêng. Máy tính: tấm giữa màn, đủ khoảng cho tên dài. Mọi vùng chạm ít nhất 48 px.

## 3. Trạng thái

- Đang đọc: mở tấm và khung xương ngay, chưa cho sửa/lưu.
- Có dữ liệu: chọn sẵn đúng membership Gói 7 hiện tại, không suy từ chiến dịch cũ hoặc mặc định cả lớp.
- Rỗng: **Chưa em nào nhận bài**; cho thêm từ danh sách lớp. Bỏ hết em giữ tick và lịch sử, không hủy bài.
- Không có em hợp lệ trong lớp: giải thích và chỉ đường kiểm danh sách lớp, không hiện thành 0% tiến độ.
- Đang lưu: khóa bộ chọn/nút lưu, giữ nguyên tấm và nháp. Chỉ hiện **Đã lưu danh sách** khi ACK xác nhận đúng toàn bộ tập em và phiên bản mới.
- Lỗi/mất mạng: giữ nháp và chỉ rõ chưa xác nhận được; **Thử lưu lại** dùng cùng mã yêu cầu để không áp dụng hai lần.
- Máy khác vừa sửa/bỏ tick/đổi lớp: báo xung đột, cho **Đọc danh sách mới**; giữ phần thêm/bớt thầy đang chọn để đối chiếu, không tự ghi đè danh sách mới.

## 4. Dữ liệu và contract đã triển khai

### Hiện trạng trước thay đổi (main bd4c5086)

`/gv/bai-da-day tick` nhận `sbd`, nhưng ghi lựa chọn vào chiến dịch cũ. `dongBoGoi7` (`server/src/goi-bai-7.ts`) tạo membership bằng toàn bộ em của lớp tại dòng 84 và tự thêm em cả lớp tại dòng 104–105. Bộ đọc Gói 7 dựa vào `goi_bai_7_em` và lớp hiện tại. **Sửa em** hiện mở `SuaChienDich`, không sửa membership Gói 7. Vì vậy xóa membership riêng lẻ sẽ bị đồng bộ nền thêm lại; cần nguồn quyết định nhận/ngừng nhận bền vững.

### Đọc: `POST /gv/goi-bai-7`, `action: 'doc_em'` (lệnh mới)

Thân `{ action: 'doc_em', goiId }`. Sau cổng giáo viên, trả `{ ok, serverNow, goiId, tickId, lop, ten, revision, em, nhan }`, với:

- `em: Array<{ sbd, hoTen, khoi, tenLop, duocThem }>`: ứng viên đúng lớp hiện tại; em khóa hoặc không hợp lệ không được thêm. Không trả câu hỏi, đáp án hay lịch sử học.
- `nhan: string[]`: các em đang nhận gói. Em đã chuyển lớp không được tính là đang nhận; cần trả thông tin đủ để thầy thấy thay đổi lớp, không âm thầm đưa sang lớp khác.
- `revision`: phiên bản membership có thể so sánh khi ghi. Revision là SHA-256 gồm phiên bản, danh sách lớp và membership; API thiếu hoặc phản hồi sai contract thì tấm giữ lỗi tại chỗ, không cho lưu.

### Ghi: cùng endpoint, `action: 'sua_em'` (lệnh mới)

Thân `{ action: 'sua_em', goiId, revision, requestId, them: string[], bot: string[] }`. Tập thêm/bớt không trùng nhau, không có SBD lặp, có giới hạn theo sĩ số lớp. Máy chủ kiểm lớp, khóa em, gói còn tick, cờ Gói 7 và ca kiểm tra đang mở **ở thời điểm ghi**; một mục sai thì từ chối toàn lượt.

ACK `{ ok, goiId, requestId, revision, them, bot, nhan, serverNow }` trả các tập đã chốt đầy đủ. `requestId` cùng payload được trả lại cùng kết quả nếu client thử lại sau mất mạng; cùng mã với payload khác bị từ chối. UI không suy thành công từ HTTP 200 hoặc số đếm.

### Bất biến máy chủ

1. Có override/ngừng nhận bền theo **gói × SBD** bằng dữ liệu chỉ-thêm; Schema chỉ-thêm: `goi_bai_7_tick_em`, `goi_bai_7_chon_em`, `goi_bai_7_revision`, `goi_bai_7_sua_em`. Giữ các bảng/lượt học cũ. Không chỉ xóa `goi_bai_7_em`.
2. Áp cùng nguồn membership trong tạo gói, đồng bộ nền, tự thêm em chuyển/đăng ký, đọc gói của em, lập kế hoạch và thống kê của thầy. Em bị bớt không được tự thêm lại; thêm lại có chủ đích gỡ ngừng nhận.
3. Em mới thêm nhận **cùng `goiId`, tập câu, phiên bản, ngày bắt đầu/hạn hiện tại**. Không tạo gói khác, không gọi thuật toán phân câu khác. Lịch kiểm tra/quota riêng theo em vẫn do thuật toán hiện tại quyết định.
4. Chỉ tính lại cache kế hoạch cho các SBD thực sự thay đổi. Không xóa cache cả lớp/gói hoặc làm đổi kế hoạch em cũ. Không sửa tiến độ, lượt gặp, lời chữa, bài đang làm hay đề kiểm tra đã công bố.
5. Ghi membership, override và revision/biên nhận trong một giao dịch có CAS; không lưu một nửa. Có ca kiểm tra mở thì từ chối sửa, như sửa hạn hiện tại.
6. Khi tạo tick mới có lựa chọn `sbd`, Máy chủ nối lựa chọn ấy với membership Gói 7. Tick cũ không có quyết định riêng giữ mặc định hiện tại; không chuyển hàng loạt dữ liệu cũ theo suy đoán.

## 5. Ngoại lệ

Tên dài/SBD dài vẫn đọc được và có tìm không dấu. Chọn hết/bỏ hết chỉ tác động ứng viên của đúng lớp, kể cả khi tìm kiếm. Xung đột khi em chuyển lớp được báo với tên em. Đóng tấm khi có nháp hỏi giữ hay bỏ nháp; Esc trả focus về nút mở. Lưu/Enter không submit form cha hoặc đổi màn. Sau thêm/bớt, cập nhật số em đúng dòng bằng ACK và đọc tổng hợp nền; phản hồi đọc cũ không được đè danh sách vừa ACK. Khi chưa tạo xong Gói 7 sau tick, nói đang chuẩn bị và thử lại có giới hạn, không coi bảng rỗng là đã hoàn tất.

## 6. Chi phí máy chủ

Một API đọc cho tấm, metadata/membership/ứng viên nhỏ đọc song song hoặc D1 batch; không gọi lại toàn bộ lịch sử, chi tiết từng câu hay danh sách toàn trung tâm. Ghi một batch nguyên tử sau kiểm đầu vào nhẹ, không vòng lặp một truy vấn mỗi em. Tổng hợp bảng giữ giới hạn 12 dòng của PR285. Tấm nạp lười khi bấm để không tăng byte tải mở app. Không thêm đệm lớn trong isolate.

## 7. Nghiệm thu đo bằng máy

- UI: `tests/tick-em-giao-dien-1410.test.tsx`: mở/tìm/chọn đúng lớp; không đổi màn sau Lưu/Enter; ACK thiếu/trùng/sai revision không hiện Đã lưu; lỗi giữ nháp; phản hồi cũ không đè ACK; bấm lặp chỉ một ghi; hủy/bàn phím; rỗng và chặn lưu khi API chưa có hoặc sai contract.
- Worker: `tests/goi7-membership-1410.test.ts`: thêm em có gói đúng, bớt em không nhận câu mới, chạy đồng bộ nền nhiều lần không thêm lại, thêm lại có chủ đích, chuyển lớp/khóa/cờ tắt/ca mở/CAS race/idempotency, một mục sai không ghi một phần.
- So kế hoạch **theo từng em** trước/sau thêm/bớt: em cũ không thay qid/thứ tự/quota; lịch sử/đề công bố/nháp giữ nguyên. Bài bớt hết vẫn còn tick.
- Cổng sau build thật: TS, tests liên quan, build/tốc độ 0 đỏ và mốc chỉ hạ, màu 0, SW 13/13; full vitest theo tên do root thực hiện trước tích hợp/phát hành.
- Bản vẽ Chromium: 360×800, 800×390, 1280×800 × sáng/tối; dữ liệu giả được ghi rõ trên trang chụp. Không có yêu cầu tới API thật. Kết quả và ảnh ở `docs/ban-ve-tick-em-1410/`.

Giới hạn: bản vẽ dùng fixture; Chromium và SQL độc lập đã chạy trên mã thật nhưng SQL ở SQLite cục bộ, chưa chứng minh tải D1 cao điểm hoặc Safari/iOS. Khi lần đầu tải JS/CSS bị lỗi, thông báo ở tại bảng; cache trình duyệt có thể cần nút **Tải lại app** chủ động. Lưu API vẫn thử lại cùng mã và giữ nháp. Xem [bằng chứng độc lập](kiem-c3-doc-lap-1410/README.md).
