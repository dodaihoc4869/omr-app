# Đối chiếu C2/C3 trước và sau thay thế · 14/10/2026

Bản đối chiếu ban đầu dùng main `bd4c5086b53f7ce8a01543a6f6b171f39ed745e3`, mã sống PR290 `1b597a08`. Phần bên dưới lưu nguyên bằng chứng trước sửa; trạng thái mới ở đoạn cập nhật và [báo cáo C3](ket-qua-c3-1410.md). Có một agent rà soát độc lập chỉ đọc; kết luận dưới đây được đối chiếu với source. Không tạo đợt phát hành khác hoặc sửa D1 thật.

## Trạng thái cập nhật sau thầy chốt

Thầy đã duyệt “Ok chốt”; Codex build đủ doc_em/sua_em, CAS/biên nhận và quyền nhận bền, nối giao diện nạp lười, gỡ Sửa em cũ cùng PR291. Đã gộp main `2f91f0e4` và giữ Hỏi Thầy/KTCN của Claude. Chromium22/22 +18 tổ hợp ba app +11 ca PWA/URL cũ, SQL độc lập18/18 và soát toàn tuyến19/19 đạt. TS/build/tốc độ/màu/SW đạt trên nguồn `a2da228b`; full theo tên và trạng thái phát hành ghi trong báo cáo. Các kết luận “chưa API/chưa duyệt” dưới đây chỉ đúng tại thời điểm đối chiếu ban đầu. Không suy bằng chứng local thành kiểm D1 thật.

## Phạm vi tại lần đối chiếu ban đầu

- **C1:** đã phát hành PR290; không dọn lại những tệp đã gỡ. Bằng chứng đồ thị, byte tải, TypeScript, màu, SW, Chromium và đối chiếu full theo tên nằm trong [báo cáo phát hành](ket-qua-toi-uu-toan-app-1410.md).
- **C2:** đã gỡ phần không còn dùng. Giữ `SuaChienDich`, `HopChon`, CSS/helper/API của nó và nút **Sửa em** vì còn caller thật. Gỡ chúng cùng bản phát hành Thêm/Bớt em mới, sau khi bản thay thế đã được duyệt và kiểm đạt.
- **C3:** tải tổng hợp nhẹ, lưu hạn tại chỗ và sửa hạn hàng loạt đã phát hành PR285; cập nhật nhẹ sau tick đã phát hành PR290. Chạy lại 3 tệp giao diện ngày 14/10: **50/50 đạt** (`tick-han-phan-hoi-1310`, `tick-bang-tu-cap-nhat-1410`, `omni-3-thay-bai-hom-nay`).

## Việc còn lại, có thể nghiệm thu

1. Thầy duyệt [bản vẽ 6 tổ hợp](ban-ve-tick-em-1410/README.md) theo AGENTS mục 3. Cổng bản vẽ vừa chạy lại: 6/6, không lỗi trang/tràn/đích bấm nhỏ/chữ dưới ngưỡng tương phản đã kiểm/nút Lưu bị che. Dữ liệu giả; chưa nối API thật.
2. Claude thực hiện máy chủ theo [đặc tả 7 mục và hợp đồng đọc/ghi](them-bot-em-tick-1410.md). Nhánh máy chủ riêng, báo trước khi chạm `goi-bai-7.ts`; không triển khai song song với nhánh giao diện.
3. Codex nối giao diện nạp lười vào **Bài đang giao**, kiểm ACK/retry/xung đột/giữ nháp và kế hoạch từng em; chỉ gỡ phần C2 đang giữ trong cùng bản thay thế. Chạy đủ cổng trên mã cuối, soát chéo và kiểm ca mở trước phát hành.

## Máy chủ hiện tại chưa cung cấp membership mới

`server/src/goi-bai-7-thay.ts:10–40` không xử lý `doc_em`/`sua_em`. Action không nhận diện còn rơi vào đọc chi tiết từ dòng 41 và có thể trả `ok:true`. **HTTP 200 hoặc `ok:true` không chứng minh API mới sẵn sàng.** Giao diện thật phải kiểm đủ `goiId`, phiên bản, tập em và xác nhận tương ứng yêu cầu; không dò API bằng đọc nặng khi mở app.

Nút **Sửa em** hiện mở `SuaChienDich` từ `src/components/day-hoc/BaiHomNay.tsx`; API cũ ở `chien-dich/api.ts` gọi `/gv/chien-dich/sua`. `server/src/srs2-sua.ts:218` ghi `chien_dich.sbd_json`, không sửa membership Gói 7. Tạo gói ở `goi-bai-7.ts:84` và tự thêm em ở `104–105` đều chọn cả lớp: chỉ xóa một dòng membership sẽ bị đồng bộ nền thêm lại.

### Những đường phải cùng đọc quyết định nhận/ngừng nhận

| Đường hiện tại | Vị trí trên main đã đối chiếu |
|---|---|
| Tạo gói, tự thêm em mới/chuyển lớp | `server/src/goi-bai-7.ts:84,104` |
| Đọc gói, quota và kế hoạch | `server/src/goi-bai-7.ts:152`; quota `199–206` |
| Danh sách em và thống kê chữa | `server/src/goi-bai-7-thay.ts:46`, cả subquery `48,51` |
| Bảng tổng hợp nhẹ | `server/src/goi-bai-7-tong-hop.ts:22` |
| Kế hoạch ngày phía thầy/phụ huynh | `server/src/bai-hang-ngay.ts:311` |
| Hạn bài ảnh hưởng lịch kiểm tra cá nhân | `server/src/kiem-tra-ca-nhan.ts:147` |
| Danh sách em khi tick bài | `server/src/bai-da-day.ts:340,587` đang nối chiến dịch cũ |

Nguồn quyết định bền theo **gói × SBD** cần được áp ở các đường giao câu mới này; giữ lịch sử ngày bắt đầu ở `server/src/nhip-hoc.ts:65`. Không xóa hay suy diễn lại sổ học từ membership hiện tại.

### Hai đường giữ bài đang làm cần kiểm riêng

- `startGoi7` (`server/src/goi-bai-7.ts:509`) ưu tiên tiếp tục câu của phiên cũ. Phải phân biệt **tiếp tục phiên đã cấp** với **giao câu mới** sau khi bớt em.
- `kiemGoi7` (`server/src/goi-bai-7-kiem.ts:23`) kiểm membership trước cả nộp bài. Không để việc bớt em làm mất quyền nộp phiên tự kiểm đã cấp hợp lệ. Giữ nháp, payload, điểm và quy tắc chấm; kiểm quyền phiên gốc, không cấp phiên mới sau khi ngừng nhận.

Kiểm máy chủ phải có: bớt → chạy đồng bộ nhiều lần vẫn không giao câu mới; thêm lại có chủ đích; em còn lại giữ đúng qid/thứ tự/quota; bài đang làm vẫn nộp được; CAS cạnh tranh/idempotency/ca mở/lớp đổi/khóa em từ chối đúng và không ghi một phần. Các mục này là nghiệm thu phải làm, không phải đã đạt.

## Giới hạn kiểm của lượt đối chiếu

Lượt này chỉ thêm tài liệu và chụp lại bản vẽ. `src/`, `server/`, `public/`, `tests/`, `scripts/`, package và Vite bằng byte với mã sống PR290; dùng lại bằng chứng TS/build/tốc độ/màu/SW/full của đúng cây mã đó, không gọi đây là full mới chạy. Đã chạy mới 50 test giao diện và 6 ảnh Chromium. Chưa có API membership, chưa kiểm D1 cho tính năng mới, chưa có xác nhận duyệt ảnh hoặc Claude soát. Vì vậy C2/C3 tiếp tục ghi `[!]` ở phần còn thiếu; không đánh dấu xong hoặc phát hành lại mã cũ.
