# Bát Linh — giao diện học sinh và phụ huynh

Triển khai tại workspace ngày 30/09/2026. **Chưa push, chưa triển khai máy chủ.**

## Phạm vi

- Hệ màu xanh ngọc, ngà, vàng; phông tiếng Việt có sẵn, thẻ nội dung rõ nét, nút chính dễ thấy.
- Học sinh: đăng nhập, sảnh và kế hoạch hôm nay, trạng thái hoàn thành, tự luyện, câu hỏi, nộp bài, lời giải, tổng hợp, báo cáo, hộp thoại.
- Phụ huynh: đăng nhập, tổng quan, điểm, tiến bộ, lời thầy, chi tiết bài kiểm tra.
- Game: Hộ Tống (sảnh/trận/trùm/gợi ý/lời giải/tiếp sức/thắng/thua), Đảo (bản đồ/trận/lời giải/kết thúc), chọn thú, đảo cá nhân, sổ tay, túi đồ, cửa hàng/thử đồ/tủ đồ, Bi-a và các vùng giao diện game cũ còn được hỗ trợ.
- Bản đồ Đảo đã thay cảnh SVG cũ bằng tranh sơn thủy riêng. Mốc ải khớp các bậc đá. Sương, vị trí thú, dấu đúng/sai, đền thành thạo và tiến độ vẫn dùng dữ liệu thật. Không đổi điều kiện mở đảo, giá, EXP hay logic chấm bài.
- Quái và trùm: atlas trong suốt vẽ riêng, dùng chung qua `QuaiSonThuy.tsx` cho các nhánh Đảo, Hộ Tống và tung chưởng. Màn tung chưởng có vòng phép, bố cục dọc/ngang, thẻ giải thích màu ngà; giữ thời lượng và thao tác bỏ qua có sẵn.
- Biểu cảm: 48 chân dung (8 thú × 6 nét: chào đón, suy nghĩ, vui khi đúng, động viên khi sai, quyết tâm, ăn mừng). Khung cận mặt dùng chung `BieuCamThu`, đặt cạnh hình toàn thân đúng cấp. Gắn ở sảnh, đảo cá nhân, trận đảo, phản hồi đáp án, hộ tống, tung chưởng và kết quả. Không thay trực tiếp mặt trên mọi khung tiến hoá; không suy đoán kết quả của bạn học. Phản ứng ngắn, tôn trọng giảm chuyển động.
- Xe Linh Tâm: tranh mới gỗ/ngọc/vàng, bánh và bệ đồng bộ; vòng máu lấy dữ liệu thật, ngưỡng thấp ≤25% đổi sang màu hổ phách. Các quả cầu Linh Tâm nhỏ dùng cùng bảng màu.
- Áp dụng qua component dùng chung cho các lớp; không gắn giao diện vào một tên lớp/chương hay khối 10/11/12 cụ thể.

## Tổ chức mã

`src/components/bat-linh/BatLinhShell.tsx` đặt phạm vi giao diện trên body để các dialog/game tạo bằng portal vẫn được đồng bộ. Marker được dọn khi rời route. App giáo viên không nhận marker.

Bốn tệp CSS mới tập trung nền tảng, học sinh, phụ huynh và các trạng thái game. Không thêm thư viện runtime. Hình mới trong `public/bat-linh/` là tranh tạo riêng; mỗi cảnh có WebP cho màn nhỏ và bản lớn. Bản đồ mới không dùng canvas hoặc vòng lặp thị sai, tôn trọng giảm chuyển động. Thần thú dùng ảnh có sẵn, đúng dạng tiến hóa theo cấp.

Ảnh nạp theo nhu cầu và dùng cơ chế cache ảnh hiện có. Không đưa tranh lớn vào precache bắt buộc. Khi offline ngay lần mở đầu, tranh chưa cache có thể không hiện; các màu nền và thông tin vẫn còn.

## Xem trước và xác minh

Xem `scripts/preview-bat-linh/README.md`. Bộ chụp ảnh chạy component thật với API mẫu, không thao tác tài khoản thật. Ảnh và kết quả tại `/workspace/bat-linh-preview`; bản build tại `/workspace/bat-linh-build`.

- TypeScript và Vite production build.
- Kiểm màu `npm run check:mau`.
- Kiểm service worker `node scripts/kiem-sw.mjs /workspace/bat-linh-build/sw.js`.
- Các test hiện có về sảnh, đảo, Hộ Tống, cửa hàng, tự luyện, phụ huynh.
- Chromium: 360px/390px, màn ngang 844×390, desktop 1440×900, giao diện hệ thống tối; các luồng tự luyện, báo cáo phụ huynh, trả lời và xem lời giải trong đảo.

Lint các tệp thay đổi còn cảnh báo có sẵn về hook và Fast Refresh trong các màn cũ; không mở rộng sửa logic ngoài phạm vi thiết kế. Kiểm thử trình duyệt hiện dùng Chromium; chưa xác minh trên Safari/iPhone thật. Không có phép đo chứng minh tốc độ tăng 5 lần hoặc doanh thu/giữ chân học sinh.

## Trước khi phát hành sau này

Chỉ triển khai khi người dùng yêu cầu. Cần chạy lại build/check service worker tại thời điểm đó và kiểm tra đăng nhập, làm bài, đồng bộ trên môi trường thật theo quy trình phát hành hiện có. Không dùng trang dữ liệu mẫu làm bản ứng dụng phát hành.

## Kết quả tại thời điểm bàn giao

- TypeScript: đạt. Kiểm màu: đạt. Lint các tệp thay đổi: không lỗi, còn cảnh báo hook/Fast Refresh đã nêu.
- Kiểm tra hình ảnh/thao tác Chromium: 52 trường hợp giao diện chung + 52 trường hợp game = 104 lượt đạt.
- 6 tệp test liên quan lượt sửa quái/tung chưởng: 56 test đạt. 3 tệp test bản đồ/luồng đảo/bố cục: 14 test đạt. Trước đó bộ kiểm hồi quy 17 tệp giao diện học sinh/phụ huynh/game đạt 149 test; số liệu giữa các lượt có trùng test, không cộng thành tổng.
- Bộ ảnh: `/workspace/bat-linh-preview/index.html`. Nhật ký JSON: `verification.json`, `game-states.json` cùng thư mục.
- Build sạch dùng `--emptyOutDir` cho thư mục artifact riêng; kiểm service worker đạt 13/13. Tranh WebP không thuộc precache bắt buộc.

## Bổ sung xe và biểu cảm

- Chromium: 104 kiểm tra chung/game, thêm 19 kiểm tra biểu cảm/xe/phản hồi và 30 màn đóng gói trong mục lục đều đạt. Kiểm tra đúng/sai dùng thao tác trả lời, sau đó xác nhận nét mặt trở lại suy nghĩ ở câu kế tiếp.
- Bộ 6 tệp liên quan đảo/hộ tống: 56 test đạt. Build + kiểm service worker 13/13 đạt.
- Bản xem thử tương tác: `/workspace/bat-linh-review-site/dist`, mở bằng HTTP, có 30 mục; các bước làm bài và tab phụ huynh mở tiếp trong từng mục. Dữ liệu hoàn toàn minh hoạ; một số nút phụ trong fixture chưa giả lập đầy đủ nghiệp vụ.
- Site riêng đã đăng ký, chưa triển khai: `appgprj_6abd28f189988191afd2c4bdd4887d27`. Không đăng ký lại Site. Manifest ở `/workspace/bat-linh-review-site/.openai/hosting.json`. Git push tới nguồn của Site bị proxy chặn `CONNECT tunnel failed, response 403` tại `git.chatgpt-team.site`. Cần mở miền này qua cấu hình mạng được hỗ trợ rồi cấp lại credential ngắn hạn, push nguồn chính xác, đóng gói và gọi save/deploy private. Không có deployment ID hay URL đã xác nhận.
- Repo app gốc chưa commit/push/deploy; không sửa cấu hình máy chủ thật. Checkout Site riêng chỉ chứa bản minh hoạ đóng gói.

### Bản HTML một tệp

`/workspace/bat-linh-preview/Bat-Linh-Xem-Giao-Dien.html` (~4,2 MB) chứa 37 ảnh chụp và bộ chọn 48 nét mặt, mọi ảnh nhúng sẵn. Đây là tài liệu xem thiết kế, không phải bản app tương tác đầy đủ. Đã kiểm tra các ảnh và nút biểu cảm khi browser không có mạng. Runtime Chromium cấm mở URL `file://`, nên kiểm thử nội dung bằng `setContent`; không khẳng định đã kiểm tra giao thức `file://` trên máy này.

Thử gửi tệp qua Google Drive cũng bị từ chối: `ACCESS_TOKEN_SCOPE_INSUFFICIENT` / `insufficient authentication scopes` (403), không tạo được tệp Drive hay link tải. Cần cấu hình mạng cho Site hoặc cấp quyền tải tệp cho kết nối Drive qua quy trình chuẩn; không đi vòng giới hạn quyền.

## Lệnh phát hành 2026-09-30 15:49 UTC

Người dùng đã yêu cầu đẩy lên máy chủ app thật. Đã ghép lên main 4ee968a1 trong worktree riêng; mã giao diện 74bd9ec5. Kiểm tra bản ghép: build và SW 13/13 đạt, 104 kiểm tra trình duyệt đạt, các cổng biên dịch /hs /ph /?vai=gv mở đúng. Full suite 13.093 test có 129 lỗi; 127 lỗi tái hiện trên main, hai kiểm tra còn ràng buộc thiết kế cũ đã được cập nhật và chạy lại đạt. Các bản xem thử không nằm trong entry build phát hành. Dùng workflow hiện có `.github/workflows/deploy.yml`; giữ nguyên server/schema/dữ liệu. Mốc khôi phục: Pages a6fedac0 / main 4ee968a1.
