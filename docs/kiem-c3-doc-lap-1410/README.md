# Kiểm C3 độc lập · 14/10/2026

Mã nguồn và dấu phiên bản build: **439a6f29be18ae38dc3ea44e4fe71da06dccfeb7**. Agent riêng kiểm qua entry app đã build, không sửa `src/`/`server/`, không gọi API production, không ghi D1/R2 thật. Dữ liệu tên, lớp, câu hỏi, mã xác thực đều giả cục bộ.

## Kết quả

| Phép kiểm mới | Kết quả và phạm vi |
|---|---|
| Thêm/Bớt em trên Chromium thật | 22/22 tình huống; trong đó 6 tổ hợp 360×800 / 800×390 / 1280×800 × sáng/tối. 0 lỗi JS, tràn ngang, đích chạm dưới 48 px, chữ dưới ngưỡng tương phản đã kiểm, API giả thiếu, yêu cầu bên ngoài hoặc thiếu header giáo viên. |
| Tấm và lưu tại chỗ | Mở/tìm/chọn, thêm/bớt đúng tập, ACK thiếu/sai/trùng không báo Đã lưu; mất mạng hoặc mất ACK sau commit vẫn giữ nháp/mã yêu cầu; xung đột đọc lại không tự ghi; ca mở từ chối; bấm lặp chỉ một ghi; Esc/Hủy/focus/Enter; bớt hết vẫn giữ dòng tick; phản hồi tổng hợp cũ không đè ACK. |
| Tải mảnh lần đầu | Vỏ chờ hiện trước JS, khóa cuộn/focus; Hủy rồi lỗi JS đến muộn không tự điều hướng. Lỗi JS/CSS đều ở lại bảng. CSS thiếu không dựng tấm chưa có kiểu dáng. |
| Ba app qua entry `/gv`, `/hs`, `/ph` | 18/18 tổ hợp; 0 JS/tràn/API giả thiếu/yêu cầu bên ngoài/tệp mất. Giữ bốn URL game cũ về Hôm nay, mở câu học công khai không có key đáp án trong phản hồi giả. |
| PWA | Ba vỏ app mở ngoại tuyến; SW đổi bản giữ marker IndexedDB. Tệp public câu hỏi giả và ảnh được kiểm trong cùng bộ smoke. |
| SQL membership độc lập | 18/18 trên SQLite `:memory:` thật, chạy SQL source qua Vite. CAS hai lượt một phiên chỉ một thắng; năm loại thay đổi quyền giữa đọc/ghi từ chối nguyên tử; idempotency/chống đổi payload; rollback khi lỗi statement 4; không tự thêm lại sau 5 lượt auto-enroll; thêm lại chủ đích; chọn em lúc tick; dữ liệu chín bảng gói/câu/chữa/lịch sử/phiên/lượt/điểm/đề đã công bố giữ byte, quota em không đổi giữ nguyên. Đọc tấm sau DDL chỉ một query. |

Số đo vỏ chờ 119 ms trong một lượt Chromium cục bộ, có cả chi phí thao tác Playwright; không phải LCP hoặc độ trễ production.

## Giới hạn đã kiểm được

API của bộ Chromium là fixture; bộ SQL kiểm logic bằng SQLite cục bộ, không phải Workerd/D1 thật. Không chứng minh tải giờ cao điểm, mọi màn, Safari/iOS hoặc mọi trường hợp lỗi. Quyền giáo viên ở HTTP Worker và toàn tuyến giao câu được kiểm bằng bộ máy chủ của root/agent SQL khác, không suy ra từ fixture UI này.

Chromium giữ lỗi tải module/CSS sau thất bại lần đầu. Trong hai ca ép lỗi JS/CSS, nút **Thử mở danh sách lại** tiếp tục báo tại bảng, không tự tải lại toàn app; **Tải lại app** là hành động chủ động để nhận lại tài nguyên. Không coi hai ca đó là đã phục hồi tải mảnh tự động. Lỗi API đọc/lưu riêng vẫn thử lại được và giữ nháp như các ca đã đạt.

## Bằng chứng và lệnh tái hiện

- [22 tình huống + đo hình học](runtime-them-bot-em.json)
- [18 tổ hợp ba app + 11 kiểm bổ sung](runtime-ba-app.json)
- [18 phép SQL membership](sqlite-membership.json)

```sh
node scripts/kiem-runtime-c3-1410.mjs --repo=/worktree-439a6f29 --dist=/dist-439a6f29 --hash=439a6f29be18ae38dc3ea44e4fe71da06dccfeb7 --out=/tmp/c3-runtime
node scripts/kiem-runtime-3app-1410.mjs --repo=/worktree-439a6f29 --dist=/dist-439a6f29 --hash=439a6f29be18ae38dc3ea44e4fe71da06dccfeb7 --out=/tmp/c3-3app
node scripts/kiem-may-chu-c3-doc-lap-1410.mjs --repo=/worktree-439a6f29 --out=/tmp/c3-sqlite.json
```

Ảnh dưới dùng tên rất dài để kiểm cuộn nội bộ; cả 24 ảnh đều dưới 150.000 byte. Sáu ảnh tính năng được chụp trước ACK để thấy tập thêm/bớt; dữ liệu giả được ghi trong tiêu đề bài.

| Khổ | Sáng | Tối |
|---|---|---|
| Dọc | [360×800](360x800-light.jpg) | [360×800](360x800-dark.jpg) |
| Ngang | [800×390](800x390-light.jpg) | [800×390](800x390-dark.jpg) |
| Máy tính | [1280×800](1280x800-light.jpg) | [1280×800](1280x800-dark.jpg) |
