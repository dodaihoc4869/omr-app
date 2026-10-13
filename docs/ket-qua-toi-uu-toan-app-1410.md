# Tối ưu ba app và dọn mã đã ngừng — 14/10/2026

Nhánh `codex/don-ma-sau-00-1410`, nền main `58d34a69`. Sáu làn độc lập có worktree riêng; Codex tích hợp app và cổng, Claude phụ trách máy chủ. Không gọi lượt này là kiểm từng dòng hay đã hết mọi lỗi. PR máy chủ của Claude #288/#289 và bản sửa Tick #285 đã lên main trước đợt này; không phát hành song song.

## Tick bài đã phát hành trước

PR #285, mã sống `58d34a699ca95511a367136bfeba4869f28ee6d3`, Actions `38444623860` SUCCESS. Worker/Pages cùng SHA, 5 đường giao diện và 2 cổng quyền đạt. Kiểm ca ngay trước đổi bản: 0 ca mở / 0 lượt đang làm. Đọc Gói 7 sau phát hành: 5 gói / 263 học sinh / 609 mục câu, 0 thiếu quota/nguồn/chưa duyệt/em chưa nhận gói; giữ kết quả đã nộp. Không sửa hạn thật thay thầy.

- Bảng Bài đang giao dùng một lệnh tổng hợp giới hạn 12 dòng, thay chuỗi 1+N lần gọi. Máy chủ dùng 2 truy vấn theo lô. SQLite fixture 65 gói / 135.720 sự kiện: 45 truy vấn khoảng 160 ms → 2 truy vấn khoảng 49 ms; không suy thành thời gian D1 production.
- Có khung tải ngay; làm mới lỗi vẫn giữ bảng và nháp. Tick lỗi đọc kho có thể thử lại, không lưu kho rỗng làm kết quả vĩnh viễn.
- Lưu hạn từng lớp giữ màn và cuộn, hiện **Đã lưu** sau ACK đúng yêu cầu. Sửa hàng loạt dùng CAS/giao dịch: một dòng xung đột thì không lưu nửa lượt. Giữ kết quả, nháp và đề kiểm tra đã công bố.
- Đợt này thêm cập nhật tổng hợp nhẹ, có giới hạn, sau tick/bỏ tick để bắt Gói 7 tạo nền. Không tự gọi đồng bộ nặng từ màn hình hoặc lặp vô hạn.

## Số đo trước/sau

| Đo | Trước | Sau | Phạm vi |
| --- | ---: | ---: | --- |
| Mã mở app giáo viên (gzip) | 275.655 | 270.801 | Cổng build, không phải LCP |
| Mã mở app học sinh (gzip) | 336.111 | 330.331 | Cổng build |
| Mã mở app phụ huynh (gzip) | 273.054 | 265.731 | 27 → 24 tệp |
| Đọc 120 bank ca trên máy thầy | 121 giao dịch | 1 giao dịch | IDB, Chromium thật, cùng snapshot |
| Hai caller đồng bộ 901 ca | 6 lệnh | 3 lệnh | Gộp lượt đang chạy; lỗi được thử lại |
| Mở trang phụ huynh | 9 lượt gọi | 5 lượt gọi | Giữ làm mới thật và trạng thái lỗi từng phần |
| Đồng hồ kiểm tra trong 5 giây | 5 lần dựng lại câu | 0 | Đồng hồ tách riêng; giờ máy chủ/chốt hạn giữ nguyên |

Số byte là phần HTML/JS/CSS theo cổng tải, không phải tổng mọi ảnh/phông hay LCP. Byte lấy từ hai build cùng quy trình; nhãn ngày/SHA có thể làm gzip lệch vài byte. Mốc tốc độ chỉ hạ. Số JSON và đồ thị ở `docs/don-game-1410/`; đo IDB CPU chậm 6 lần có hai lượt ghép độc lập, không quy độ trễ fixture thành độ trễ bản sống.

Rà lỗi nền tìm và sửa ba lỗi thật: IndexedDB open/read/write treo, click đáp án không gọi lưu do đọc kết quả ngoài React updater, và gói đề có headers nhưng JSON treo. Kho có hạn chờ3giây, late upgrade/connection bị hủy/đóng trước mutation; đọc nháp lỗi phải reject, không giả kho rỗng. Nộp lỗi lưu cục bộ giữ snapshot/đáp án/mốc nộp để thử lại; ACK máy chủ vẫn là đã nộp thật, pending cũ replay idempotent. Gói đề có hạn25giây bao fetch+body, hủy luồng khi quá hạn; vào lại giữ cùng lượt/mốc giờ/qid. 11 kiểm storage/ExamTake và 6 kiểm gói đề mới đạt; soát độc lập bắt transaction upgrade đã bắt đầu nhưng chưa commit trước timeout, đã sửa abort active đúng một lần và clear theo done, thêm 3 counterexample độc lập đều đạt; không thay payload hoặc chấm. Tên/lớp rất dài được ngắt đúng khối,16/16 Chromiumstress đạt và đủ245ký tự; giữ màu/chữ, không che overflow.

Học sinh đọc lịch sử/BTVN song song và giữ kết quả phần còn tốt khi một phần lỗi; nạp màn thi lúc rảnh sau xác thực. Lỗi tự chốt kiểm tra khi mạng hỏng từng gửi ít nhất 4 lần/giây đã tái hiện và sửa thành lùi 2/4/8/16/tối đa 30 giây; thử lại bằng tay vẫn ngay. Giữ nháp, thế hệ phiên, revision và luật chấm. Phụ huynh đổi/xóa phiên hủy dữ liệu cũ; hook lỗi mạng giữ dữ liệu đang có, không coi lỗi là chưa có bài.

## Mã đã gỡ và mã còn dùng

Đồ thị import trước/sau chứng minh 203 tệp nguồn Đảo/Đoàn/Bi-a và 5 tệp giao diện chiến dịch cũ không còn đường từ entry đang chạy. Gỡ 46 ảnh riêng của game (47.262.113 byte), 4 CLI và 8 tệp gallery game không còn caller. Sáu công cụ chụp/đo hỗn hợp đã khép 26 import gãy → 0/186 tệp script quét AST (import local dạng literal), giữ fixture và chức năng học tập. Không chạy toàn bộ 192 tổ hợp stress hỗn hợp hoặc benchmark heap/Slow 4G dài. Ảnh gỡ là kích thước trong repo, không phải lượng tải mở app tiết kiệm thêm. Xem `C1-kiem-ke.json`, `C2-do-thi.json`, `README-tools.md` và kết quả soát độc lập.

Giữ lõi học, cá nhân hóa, Hôm nay/Hành trình/Ôn & sửa, ca kiểm tra, tiến độ, login/ảnh phụ huynh còn dùng. Giữ Three vì Hôm nay của thầy vẫn có bản đồ lớp đang dùng. Nhánh này không thay server, schema hoặc dữ liệu D1/R2; lớp/ràng buộc Durable Object `BAN_BIA` của Claude vẫn còn. Cổng màu chỉ miễn đúng 208 tệp trạng thái D có SHA snapshot đã soát và đúng thẻ chiến dịch bị gỡ nguyên khối; các màu còn dùng và sửa một phần vẫn kiểm.

Giữ **Sửa em** cũ và các hàm dùng chung cho đến khi bản Thêm/Bớt em mới đủ điều kiện. Bản đặc tả 7 mục + 6 ảnh Chromium thật ở `docs/them-bot-em-tick-1410.md`; chưa build tính năng. API Gói 7 hiện tự thêm cả lớp, cần Claude nối membership/ngừng nhận bền trước; xóa membership trực tiếp sẽ bị thêm lại. Theo `AGENTS.md` mục 3 và quy trình 4 bước: “Thầy duyệt rồi mới build”. Đây là giới hạn riêng của tính năng mới, không chặn các sửa lỗi đã được ủy quyền.

## Cổng và giới hạn

- Frontend/server TypeScript, build, tốc độ 0 đỏ; mốc chỉ hạ. SW 13/13, 168 tệp / 2.707,58 KiB theo Workbox, 2.888 KB theo cách đếm của cổng, đều dưới trần. Đã thêm kiểm đóng đủ import tĩnh của ba cửa app: bản trước thiếu 6 helper nên /gv và /ph cold-offline trắng, nay đủ; không tăng byte mở app.
- Chromium từ entry build thật `3148468b`: 18/18 tổ hợp (3 app × 3 khổ × sáng/tối), 0 lỗi JS/tràn/tài nguyên mất/API fixture thiếu/mạng ngoài. Link game cũ về Hôm nay. Ba vai mở được khi mất mạng, cập nhật SW giữ marker IDB. Chỉ dữ liệu giả, không chấm/nộp bài thật; không xác nhận mọi màn, Safari hoặc tốc độ production.
- Đợt full đầu đã tìm ra test còn giữ caller game và suite rỗng. Đã sửa caller hiện tại, chỉ gỡ suite thuần game, giữ nguyên byte-body 115 test học tập và khôi phục hai case dùng chung. 14/14 tệp liên quan: 145/145 đạt, 0 skip/pending. Bộ ảnh còn dùng: 6/6 đạt, 96 thumb còn nguyên. Full trước khi sửa IDB: 14.249 đạt / 124 đỏ / 27 pending; 3 tên đỏ mới là 2 fixture PWA đã cập nhật (54/54), 1 test dùng thời gian thật vượt TTL250ms đã khóa thời điểm và kiểm expiry (28/28). Full trên829e5105:14.277 đạt/125đỏ/27pending,5 tên mới chỉ assertion nguồn sau tách helper — đã cập nhật85/86,1đỏ còn lại cùng nền. Full cuối runtime3148468b/head708ead01: **14.284 đạt / 120 đỏ / 27 pending**, nền main58d34a69 (cây runtime/test bằng19840386):15.453đạt/125đỏ/28pending. **0 tên lỗi mới,0 tệp lỗi mới,0 suite rỗng lỗi mới**; so cả tên và trạng thái tệp. Chỉ gỡ pending/test thuần game đã nghỉ, không thêm skip. Chi tiết doi-chieu-vitest-cuoi.json. Không gọi toàn repo xanh.
- Nền main vẫn có test đỏ cũ. Không dùng số test ít hơn sau gỡ game để tuyên bố toàn repo xanh. Full baseline `19840386` có cây mã chạy/test bằng main `58d34a69`; readonly workflow khác không ảnh hưởng test.
- Công cụ hỗn hợp đã sửa import và compile riêng; không xóa công cụ/fixture học tập. Các smoke có phạm vi cụ thể trong README-tools, không tuyên bố mọi chế độ của mọi công cụ đã chạy. Số đo giờ cao điểm sau bản vá bộ nhớ của Claude chưa có trong lượt này; không tuyên bố đã hết `exceededMemory`. Đã báo Claude kiểm peak bộ nhớ qua kênh PR #285.
- Đã soát độc lập sáu làn và gửi Claude qua PR290; Claude chưa trả lời soát đợt này; các bình luận/nhật ký là bằng chứng phối hợp, không phải bằng chứng Claude đã duyệt. Phát hành chỉ sau cổng cuối và kiểm ca mới, nối sau #285.
