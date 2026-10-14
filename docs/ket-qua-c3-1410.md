# Kết quả C2/C3 · Thêm/Bớt em trong Tick bài · PR291

**Đã phát hành PR291 + bản sửa vận hành PR295**, mã sống `f1e3d6098d17c67be359297ba276b56160bdb149`, Actions38491930339 SUCCESS. Worker/Pages cùng SHA lúc07:48 VN;5đường/2cổng quyền đạt. [JSON kiểm sống chỉ aggregate](kiem-c3-doc-lap-1410/phat-hanh-song.json).

Thầy đã duyệt bản vẽ bằng **“Ok chốt”**. Bản thay thế nằm tại **Tick bài vừa dạy → Bài đang giao → Thêm/Bớt em**, cạnh Sửa hạn. Lưu tại chỗ, hiện Đã lưu sau ACK hợp lệ; cập nhật số em đúng dòng, không tải lại lịch sử hay đổi màn.

## Thay đổi cuối

- Thêm em nhận cùng Gói 7, tập câu/phiên bản, ngày bắt đầu và hạn đang dùng. Bớt em ngừng nhận câu mới bền qua cron/đồng bộ, kể cả đường dự phòng Hành trình; câu đã gặp vẫn ôn/sửa. Giữ quyền tiếp tục/nộp phiên đã cấp, điểm/lời chữa/lịch sử và đề kiểm tra đã công bố.
- Tick mới lưu đúng tập em được chọn. Tick cũ chưa có quyết định riêng giữ mặc định cũ. Một nguồn policy áp ở đọc gói, tạo/auto-enroll, kế hoạch, tổng hợp, deadline liên quan KTCN và bước vận hành phát hành.
- Lưu danh sách dùng revision SHA-256, CAS và batch nguyên tử, biên nhận bất biến theo requestId. Chuyển lớp/khóa em/bỏ tick/cờ tắt/ca mở ở thời điểm ghi từ chối cả lượt. Mất ACK khóa sửa nháp cho tới khi đọc lại kết quả cùng yêu cầu; xung đột giữ nháp và yêu cầu đối chiếu rõ ràng.
- Tấm nạp lười; vỏ chờ hiện ngay, tìm tên/SBD, cuộn riêng, focus/ESC/Enter/đích chạm ≥48px. Bớt hết vẫn giữ tick. Số chưa tải hoặc lỗi hiện nhãn tương ứng, không giả 0.
- Gỡ bốn nguồn giao diện Sửa em cũ và API chỉ dùng bởi nó; giữ Hành trình/Ca kiểm tra/Cài đặt. Helper server còn dùng được chuyển nguyên byte sang `server/src/`, không gỡ hành vi học tập. [Kiểm kê và hash](don-game-1410/C2-thay-the-kiem-ke.json); mixed tests giữ các ca còn dùng, không thêm skip.
- Schema chỉ-thêm bốn bảng quyết định/phiên bản/biên nhận và ba chỉ mục ghép. Không xóa bảng/dòng lịch sử D1, không thao tác danh sách/hạn nộp thật thay thầy. Thuật toán `chonGoi7`, quota và chấm thi giữ nguyên; thay đổi đầu vào quyền nhận. [Sáu lõi bằng byte với main](kiem-c3-doc-lap-1410/loi-hoc-tap-giu-nguyen.json).

## Mã đã kiểm và kết quả

Main nền mới nhất: `2f91f0e402b9a737bca370236d492cf86f27dc4b` (giữ PR292 Hỏi Thầy/TramGemini và PR294 thẻ KTCN của Claude). Nguồn tích hợp đóng băng cuối: `a2da228b154a44b494aa770ae411f14104566210`. Lượt trước439 đã phát hiện lỗi và không được phát hành. Các commit sau chỉ công cụ/bằng chứng/tài liệu; đối chiếu byte `src`, `server`, `tests`, Vite/package trước phát hành.

| Cổng | Bằng chứng |
|---|---|
| Frontend/server TypeScript | `npx tsc -b`; `npx tsc --noEmit -p server/tsconfig.json`: đạt |
| Build/tốc độ | 0 đỏ; mốc chỉ hạ. Sảnh đầu 30→29 đợt, 37→36 lệnh; mở chặng 17→16 lệnh, số đợt giữ 10. Byte mở ba app nằm trong dung sai 1KB của cổng, **không tuyên bố C3 làm byte mở giảm**. [Log](kiem-c3-doc-lap-1410/cong-toc-do.txt) |
| SQL cục bộ | 500 câu/5.000 lượt/5.000 lần gặp: p50 truy vấn chưa có ba chỉ mục 347,17ms→1,94ms; cùng 500 kết quả. Đây là SQLite fixture, không phải tốc độ D1 sống. [Đo và EXPLAIN](kiem-c3-doc-lap-1410/toc-do-sqlite.json) |
| Màu | check:mau và kiem:mau-giu 0; ngoại lệ chỉ bốn tệp gỡ đúng hash. [Log](kiem-c3-doc-lap-1410/cong-mau-giu.txt) |
| Service Worker | 13/13;169 tệp/2896KB dưới trần170/3000. [Log](kiem-c3-doc-lap-1410/cong-sw.txt) |
| Chromium độc lập | 22/22 tình huống feature;18/18 tổ hợp ba app +11 kiểm URL cũ/public/offline/SW. Không lỗi JS/tràn/đích chạm dưới48px ở phạm vi kiểm. [24 ảnh và JSON](kiem-c3-doc-lap-1410/README.md) |
| Bước vận hành | 10/10 SQL nguyên văn, hai agent đối chiếu; node24 bundle đạt. [Bằng chứng](kiem-c3-doc-lap-1410/buoc-van-hanh.json) |
| SQL độc lập | 18/18 membership; agent khác soát toàn tuyến19/19, gồm fallback, phiên bản câu, deadline gói khác, CAS ở thời điểm ghi. [Báo cáo tuyến](kiem-c3-doc-lap-1410/soat-tuyen-may-chu.json) |
| Full Vitest | Mã a2: **14353đạt/120đỏ nền/27pending**, main2f14293/120/27. **0 tên lỗi mới (đếm cả tên trùng),0 tệp lỗi mới,0 suite rỗng lỗi mới,0 skip mới**;59 tệp lỗi cùng nền. [Đối chiếu cuối](kiem-c3-doc-lap-1410/full-cuoi.json). Tám ca giao diện cũ gỡ/viết lại đúng kiểm kê, giữ các ca server/mixed còn dùng |
| CI/kiểm ca/phát hành | CI head45465f44 run38489782261 SUCCESS; schemaG7 20 lệnh chỉ-thêm áp thành công; ca mọi cổng0/0. **Deploy38491930339 SUCCESS**, Worker/Pages cùngf1e3d609;5đường/2cổng quyền đạt. Gói7:5gói/262em đang nhận/263từng nhận/609câu,0thiếuquota/nguồn/chưađủnguồn/câu chưaduyệt/em hợp lệ chưa nhận |

## Lỗi thực tế phát hiện và sửa

1. Bớt hết G7 rồi `hoc-tap-start` dự phòng vẫn cấp lại câu mới của bài đã bớt; đã áp policy chung, Sảnh cũng không hứa số câu sai.
2. Lượt làm câu v1 bị dùng để mở v2 chưa gặp; bằng chứng gặp nay gắn phiên bản qua phiên sở hữu đúng em. QID đồng thời còn nhận ở gói khác vẫn mở, không bị gói cũ chặn.
3. Sửa hạn gói đã bớt làm mất mức chốt của gói khác còn nhận; chỉ invalidate em đang nhận hợp lệ.
4. Lỗi tải CSS mảnh làm hiện tấm thiếu kiểu; giữ lỗi tại bảng cho tới khi thầy chủ động Tải lại app. Lỗi đến sau Hủy không tự điều hướng.
5. Lưu UUID trần và `Array.at` không dùng được trên iPhone cũ; đổi sang helper có dự phòng và chỉ số mảng, thêm ca máy thiếu UUID/giữ mã retry.
6. Đọc cờ Gói7 trong đường Hành trình trùng với nhóm cờ OMNI đang đọc: tái dùng Promise đọc cấu hình, nạp mô-đun song song. Hai cổng chi phí cũ xanh mà không nâng trần. Giữ khoảng trắng tiền tố SQL BTVN để fault-injection kiểm chính xác hai đường lỗi, không nới kiểm che câu.
7. Bước `ap-goi7-song` trước sửa đếm toàn membership vật lý, có thể bù quota em đã loại/báo em không được chọn là thiếu; sửa đọc cùng policy nhận, giữ số lịch sử bằng nhãn riêng.

## Sửa cổng vận hành sau gộp

Cổng cũ `ap-migration-goi7.ts` chỉ nhận tên `goi_bai_7`, nên chặn chỉ mục đã duyệt trên `game_v2_attempt`. Thay bằng `scripts/cong-migration-goi7.mjs`: chỉ nhận một CREATE TABLE/INDEX đúng namespace Gói7; ngoại lệ duy nhất ngoài namespace khớp **nguyên văn** DDL index `game_v2_attempt_sbd_qid` đúng bảng/cột. Giữ preflight ca và vòng query nguyên trạng, không mở regex cho mọi bảng game hoặc nới sang DROP/ALTER/DML.

`node scripts/kiem-cong-migration-goi7-1410.mjs`:20/20 DDL thật đạt,83/83 trường hợp suffixSQL/đổi tên/target/lệnh sai bị chặn, không kết nối dữ liệu. Bản sửa chỉ scripts/tài liệu, `src/server/tests/public/Vite/package` bằng byte với a2: kế thừa full và cổng của đúng cây mã chạy, không gọi đây là full mới. Đã áp lại thành công38491930339; giữ lần thất bại38490438544 làm bằng chứng trước sửa. Agent SQL khác kiểm thêm15ca biên đều bị chặn; không có kết nối/ghi dữ liệu trong proof validator.

## Tái hiện đối chiếu full

Chạy `npx vitest run --reporter=json --outputFile=/tmp/main.json` trên main2f và tương tự `/tmp/head.json` trên mã a2; cổng full có lỗi nền nên exit1 ở cả hai. Sau đó:

```sh
node scripts/doi-chieu-vitest-theo-ten.mjs /tmp/main.json /tmp/head.json /tmp/so-full.json 2f91f0e402b9a737bca370236d492cf86f27dc4b a2da228b154a44b494aa770ae411f14104566210
```

CLI exit0 khi không có tên/tệp/suite lỗi hoặc skip mới. Lượt trước439 có7 tên lỗi mới được lưu [nguyên kết quả so](kiem-c3-doc-lap-1410/full-truoc-khi-sua.json); không dùng lượt lỗi đó để phát hành.

## Bản lùi

Mã trước C3 là `2f91f0e4`. Lệnh lùi code: `git revert -m 1 c2f0e407`, **chỉ dùng sau kiểm ca0/0 và xác nhận chưa có tick mới/sửa danh sách bằng C3**. Giữ bốn bảng/quyết định/biên nhận, không DROP/DELETE D1. Nếu thầy đã dùng Thêm/Bớt em, giữ máy chủ policy/CAS/biên nhận và lùi phần giao diện theo đường dẫn; không cho code cũ bỏ qua quyết định ngừng nhận rồi tự thêm lại. Chạy cổng và đối chiếu kế hoạch em trước phát hành lùi. Không thực hiện lệnh lùi trong lượt này.

## Phối hợp và giới hạn

Đã báo trước tệp dùng chung và máy chủ trong DIEU-PHOI/PR291, tích hợp main sau các lượt Claude và không chạy deploy song song. Claude được nhờ soát trên PR; **chưa có xác nhận soát**, không coi im lặng là duyệt. Rà soát bởi các agent độc lập được ghi bằng bằng chứng ở trên.

Chromium dùng API giả; SQL dùng SQLite cục bộ. Chưa kiểm Safari/iOS, mọi màn hoặc tải production cao điểm. Hai ca ép lỗi JS/CSS có thể cần nút **Tải lại app** chủ động do cache module; không gọi đó là retry tài nguyên tự phục hồi. Không tuyên bố kiểm từng dòng/hết mọi lỗi. Kiểm D1 thật trước và sau phát hành qua workflow chuẩn đã được ủy quyền, không đổi membership/hạn thật để chứng minh tính năng. Chốt lịch ngày giữ kết quả đã nộp;262 em đang nhận và263 từng nhận được báo riêng. KTCN:772lịch/262em,câu ít/nhất nhiều/nhất28,0lịch thiếu số tính sẵn;122dòng cho_nguon cũ tiếp tục giữ/ẩn như main, không tuyên bố mọi lịch đều sẵn sàng. Chưa thao tác Thêm/Bớt em trên học sinh thật để kiểm giao dịch.
