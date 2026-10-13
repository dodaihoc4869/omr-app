# Phân loại lỗi nền phía học sinh — 14/10

Nguồn: `/tmp/tick-1410-moi-full.json`, 15.606 test, 125 assertion đỏ. Soát tên/thông báo của các nhóm liên quan học sinh, đối chiếu mã đang dùng; không kết luận đã sửa 125 lỗi. Không chạy full, build hoặc gọi D1 thật trong lượt soát này.

## Ba rủi ro ưu tiên

1. **P1 — IndexedDB treo giữ màn vào thi ở trạng thái chờ.** `getDb()` và các lượt đọc nháp/cached không có hạn; `handleJoin` chờ đọc nháp trước `vaoThi`. Mô phỏng `openDB` không trả: sau 6 giây cả nháp, đề cached và cấu hình vẫn chưa trả. Đây là lỗi thật; hai assertion khác gọi export `khongTreo` đã bỏ là test cũ, không cùng nguyên nhân.
   - Nguồn: [exam-db.ts](../src/lib/exam-db.ts), [ExamTakeScreen.tsx](../src/screens/ExamTakeScreen.tsx).
   - Sửa trong `bf926076`: mở/đọc/ghi quan trọng có hạn 3 giây; abort transaction, chặn late upgrade trước mutation và đóng connection về muộn. Lỗi đọc nháp không được đổi thành `undefined`; UI cho thử lại, giữ pending draft.
   - Kiểm: [kho-thi-khong-treo-1410.test.ts](../tests/kho-thi-khong-treo-1410.test.ts) 5/5; [man-thi-kho-loi-1410.test.tsx](../tests/man-thi-kho-loi-1410.test.tsx) 4/4. Log trước: `/tmp/kho-thi-before.log`.

2. **P1 — chọn đáp án chưa gọi lưu ngay do React chạy updater trễ.** Đây là lỗi nền tìm thêm khi khóa trạng thái pending/ACK, không phải một assertion đã có trong 125 lỗi. `updateAndSave` gán `nextVal` trong updater rồi đọc nó ngoài updater; React có thể chưa chạy updater khi kiểm `nextVal`.
   - Tái hiện bằng màn thi thật: sau mở bài có 1 lượt ghi; bấm chọn vẫn chỉ có 1 lượt, dù đáp án đã đổi. Log: `/tmp/man-thi-nhap-click.log`.
   - Sửa trong `bf926076`: tính nháp mới từ `attemptRef`, đổi state và gọi lưu đúng một lần. Hai click liền trên hai câu sinh 2 lượt lưu; nháp cuối giữ cả hai câu. Khi đã chốt nộp không sửa snapshot; retry dùng cùng đáp án/mốc nộp/khoá lượt. ACK cũ không xóa lỗi nháp mới, pending không báo “đã lưu”.
   - Kiểm: 4/4 test màn thi thật; log `/tmp/man-thi-kho-final.log`. ACK từ máy chủ vẫn là đã nộp thật nếu ghi ACK local ở nền lỗi; pending local cũ được giữ để replay idempotent.

3. **P2 cần xử lý tiếp — tải gói đề không có hạn cho fetch và thân JSON.** [exam-api.ts](../src/lib/exam-api.ts), `vaoThiQuaMayChuMoi`: lượt `/vao-thi` có hạn, nhưng đoạn tải `deUrl` gọi `fetch` rồi `res.json()` trực tiếp.
   - Tái hiện hàm `vaoThi` thật với metadata/deUrl hợp lệ; giả mạng trả header rồi `json()` không kết thúc. Sau 30 giây hàm vẫn pending, chỉ 1 fetch. Log: `/tmp/triage-goi-de-1410.log`.
   - Không có bằng chứng sự cố production trong lượt soát này. Chưa sửa nguồn `exam-api.ts` vì nhánh phát hành đang khóa; đã báo root trước mutation. Cần đặt hạn bao gồm cả header/body và abort, giữ nguyên đề/khoá lượt/cách chấm.

## Các nhóm đỏ cần tách khỏi lỗi runtime

- `nap-manh.test.ts` 4 assertion: mock `location` chỉ có `reload`, thiếu `href`; nguồn nay dùng `new URL(location.href)` và `replace` sau kiểm SW. `Invalid URL` từ mock không chứng minh URL thật trên trình duyệt bị hỏng.
- `vao-thi-may-chu-moi-1109.test.ts` 10 assertion: giả cấu hình/địa chỉ theo luật cũ, nhưng nguồn dùng gợi ý địa chỉ trước. Cần đổi fixture để kiểm contract hiện hành; không dùng các assertion này để kết luận đang gửi tới Apps Script thật. Rủi ro tải thân đề ở mục 3 được kiểm riêng.
- `btvn-ca-nhan-em-2109` 2 + `nhiem-vu-ca-nhan-2109` 5: fixture tạo `new Date(y,m,d,23,59)` theo timezone máy UTC rồi kỳ vọng 23:59 Việt Nam; formatter hiện đổi đúng +07 nên ra 06:59 hôm sau. Chưa tái hiện hạn máy chủ bị đổi sai; không sửa hạn thật để chiều fixture.
- `ios-pwa-chuyen-man` 2: kỳ vọng `standalone` trong khi manifest đã dùng `fullscreen`; `bang-nhiem-vu-may-chu` 1 tìm nhãn “Vào kiểm tra” cũ. Lỗi nhãn/thiết kế cần đối chiếu hợp đồng, không phải bằng chứng mất lối vào thi.
- Khắc phục/Luyện dạng bài có nhiều assertion ghim chuỗi source/modal cũ. Nguồn hiện cho người không có câu sai chọn luyện độc lập, nên kỳ vọng chỉ có nút Đóng không còn đúng. Không bỏ các test bảo vệ danh sách câu/chấm/nộp.
- Các test Đảo/Đoàn/Bi-a/chiến dịch đã nghỉ thuộc việc dọn caller/game; không suy lỗi luồng Hôm nay/Gói 7/KTCN từ màn đã gỡ.

## Kiểm của leaf sửa kho/nháp

Frontend TypeScript sạch. Vùng 9 tệp: 106/107 xanh; 1 assertion source `co-may-chu-toi-may-em` tìm tên `luuTamMoi(chMoi, …)` đã đỏ trong JSON nền. Test màn thi bổ sung cuối: 4/4 xanh. Ba mock IndexedDB được bổ sung transaction đúng; production không có nhánh dành riêng cho mock. Không khôi phục export `khongTreo` chỉ để đổi màu test cũ.

Build, full-suite, byte tải và runtime tích hợp do root kiểm sau khi lấy leaf. Chưa tuyên bố phát hành hoặc sửa hết lỗi nền.
