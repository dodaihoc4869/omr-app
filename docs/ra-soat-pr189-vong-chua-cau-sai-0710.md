# Rà soát độc lập PR #189 — vòng chữa câu sai

Ngày 07/10/2026. PR: https://github.com/dodaihoc4869/omr-app/pull/189.

Bản được kiểm: `fff2fae1306d5fc95f92c0fc90c87c57903b71c2` (chứa mã `bfaa5eaf` trong ảnh). Main tại lượt kiểm: `a4c566944e4d35044ed6ee75a4af6a0da59eff75`.

**Kết luận: chưa đủ điều kiện merge hoặc bật pilot.** Có mã giao diện và các hàm FSM, nhưng đường API thật chưa thực hiện được vòng chữa. Migration thành công và test đơn vị xanh không chứng minh trải nghiệm đã hoạt động.

## 1. Bằng chứng kiểm tra

| Việc kiểm | Kết quả |
| --- | --- |
| Workflow migration run `37562494559` | GitHub báo thành công, bước chạy migration D1 thật thành công. Đây là bằng chứng workflow; chưa truy vấn trực tiếp D1 sản xuất |
| `tests/chua-cau-sai-0710.test.ts` | 33/33 đạt; chủ yếu kiểm hàm/fixture, không gọi API với lược đồ migration |
| 12 ca hợp đồng bổ sung | 12/12 thất bại khi chạy API trên SQLite, nạp schema và migration của repo, dùng token thật do `gameToken` cấp |
| `npm run build` | Đạt build giao diện/PWA; không thay việc kiểm TypeScript riêng của Worker |
| `npx tsc --noEmit -p server/tsconfig.json` | 7 lỗi trong tệp mới `server/src/chua-cau-sai.ts` |
| Khả năng merge | GitHub: `mergeable=false`, `mergeable_state=dirty`; `git merge-tree` tái hiện conflict ở `DIEU-PHOI.md` |
| Kiểm màu với main mới nhất | Báo 19 khác biệt ở `src/components/dai-cau-thay.css`, thuộc phần main đi trước nhánh PR. Không quy các khác biệt này thành lỗi CSS mới của vòng chữa; phải kiểm lại sau đồng bộ main |

Bộ kiểm bổ sung là các ca được chọn để kiểm hợp đồng, không phải mẫu thống kê hiệu quả học. SQLite kiểm lược đồ và ngữ nghĩa SQL, không chứng minh hành vi đồng thời của runtime D1. Không merge, bật cờ, sửa điểm hay ghi dữ liệu học sinh thật trong lượt rà soát này.

## 2. Các lỗi chặn nghiệm thu

### R1 · P1 · API không khớp migration đã chạy

`server/src/chua-cau-sai.ts:77` chèn `ly_do_thieu` vào `chua_loi_dot`, nhưng migration không tạo cột đó. Mở một câu sai có receipt hợp lệ ném `table chua_loi_dot has no column named ly_do_thieu`.

`server/src/chua-cau-sai.ts:365` chèn `tieu_de` và `cap_nhat_luc` vào `chua_loi_item`, nhưng bảng không có các cột đó. Câu SQL cũng thiếu các cột bắt buộc `thu_tu` và `phat_luc`. Lượt phát câu bị lỗi; thêm một cột riêng lẻ chưa đủ sửa.

`server/src/chua-cau-sai.ts:466` cập nhật `muc_ho_tro_cao_nhat` và `cap_nhat_luc` không có trong bảng item. Xin gợi ý ném `no such column: muc_ho_tro_cao_nhat`.

**Cần sửa:** thống nhất hợp đồng bảng/handler, cấp đủ trường bắt buộc, tạo phiên trước item. D1 thật đã có bảng nên chỉ sửa `CREATE TABLE IF NOT EXISTS` trong migration cũ sẽ không thêm cột. Nếu cần thêm cột, dùng migration chỉ-thêm mới tương thích dữ liệu đã có; không DROP hoặc tạo lại bảng. Kiểm từ mở đợt đến nộp/gợi ý bằng đúng schema đã triển khai.

### R2 · P1 · Nộp câu không vận hành vòng chữa

`server/src/chua-cau-sai.ts:114` chỉ chấm, chèn receipt và đánh dấu item đã nộp. `chuyenTrang` được import nhưng không được gọi. Không có đường ghi tiến độ phiên, tạo phiên chữa, cập nhật trạng thái dạy, số lần gặp lại, lịch kiểm hoặc ghi kết quả chữa vào `su_kien_hoc`.

Ca kiểm nộp đúng trả `dung=true` nhưng `receiptChanDoan` trong tiến độ vẫn trống. `taoItemMoi` lại chọn `chanDoan[0]`: em gặp lại câu nhỏ cũ thay vì đi tiếp. Với đợt `cho_gap_lai_2` đã đến hạn, `phatItem` vẫn trả trạng thái chờ và không phát bài kiểm (`chua-cau-sai.ts:410`).

**Cần sửa:** nối FSM vào API thật, ghi receipt/tiến độ/state nguyên tử hoặc outbox đúng đặc tả. Chẩn đoán sai phải dẫn đến phân biệt/hỗ trợ phù hợp; không đòi em trả lời đúng câu đang vướng mới được giúp. Hoàn tất đường ghép bài → lịch → phát kiểm lần hai, xác minh hỗ trợ gần nhất/bản mới và khóa lần nộp đầu. Thêm kiểm thử xuyên luồng có request thật, không chỉ gọi trực tiếp `chuyenTrang`.

### R3 · P1 · Thiếu kiểm quyền và ca đang mở

`tienDo` (`chua-cau-sai.ts:179`) nhận SBD từ query, không xác thực token. Route ở `index.ts:3668` nằm trước cổng thầy và truyền query trực tiếp. Ca POST không token có SBD và dotId trả 200 thay vì 401.

Các handler chữa không dùng cổng ca đang mở/khối/đề bảo vệ hiện có. Ca kiểm xác nhận `coCaDangMo=true` rồi gọi `phatItem` vẫn nhận câu chữa. Nhãn `tam_khoa` trên UI không tạo ra việc chặn ở máy chủ.

**Cần sửa:** danh tính từ token ở mọi đường học sinh; kiểm sở hữu item/phien/dot và quan hệ giữa chúng. Áp cổng ca/bảo vệ/khối/phiên bản cả lúc mở, tiếp tục, xin hỗ trợ và chấm. Không dùng SBD máy khách làm quyền truy cập.

### R4 · P1 · Bằng chứng có trợ giúp đang bị ghi như tự làm

`nopItem` không lấy `co_ho_tro` của item để ghi receipt. INSERT nộp bỏ `co_ho_tro`/`muc_ho_tro`, nên mặc định là 0. Ca item đã có `co_ho_tro=1` nộp đúng vẫn tạo receipt có `co_ho_tro=0`. `xinGoiY` cũng chưa cập nhật dấu hỗ trợ và thời gian lộ theo hợp đồng.

**Cần sửa:** máy chủ suy mức hỗ trợ từ bằng chứng cấp hỗ trợ/snapshot trong cụm chữa, giữ qua retry và đổi máy. Câu đúng sau giúp không được đi vào KPI tự sửa hay ngày đúng độc lập. Kiểm cả ghi sổ và reader, không chỉ boolean trong UI.

### R5 · P1 · Lệnh “bật pilot” mở cho mọi học sinh

`chua-cau-sai-cau-hinh.ts:42` trả true khi cả `lop` và `sbd` rỗng. SQL trong mô tả PR chỉ đặt `bat=true` và `cohort`, vì vậy thực tế mở toàn trường. Đặc tả yêu cầu pilot có phạm vi không rỗng. `cohort` cũng khác tên cấu hình `cohortId` mà mã đọc.

Mở đợt chỉ truyền `{sbd}` cho `tinhNangBat`; cấu hình chỉ có `lop` chưa được đối chiếu với lớp lấy từ dữ liệu máy chủ.

**Cần sửa:** cấu hình bật thiếu phạm vi phải từ chối; kiểm/chuẩn hóa kiểu dữ liệu và giới hạn tham số. Lấy lớp ở máy chủ, hỗ trợ đúng allowlist lớp/SBD. Sửa hướng dẫn bật cờ để dùng đúng `cohortId` và nhóm học sinh/lớp đã chọn; không chạy lệnh trong PR trước khi sửa. Phiên đã phát cần quy tắc tiếp tục an toàn khi tắt cờ theo đặc tả.

### R6 · P1 · KPI 90% dùng mẫu số làm đẹp kết quả

`chua-cau-sai.ts:230` chỉ đếm đợt `lan_gap_lai>=2`. Đợt bỏ dở và thiếu học liệu bị loại, trái mẫu số toàn bộ đợt hợp lệ đã giao, đủ cửa sổ bảy ngày.

Ca kiểm có ba đợt trưởng thành: một tự sửa, một chưa tham gia hết, một thiếu học liệu. API trả mẫu số 1 và 100%; kết quả đúng theo đặc tả là 1/3, khoảng 33,3%.

Tử số cũng dựa vào trạng thái hiện tại và một receipt đúng bất kỳ trong đợt, không khóa chứng cứ lần nộp đầu của bài cả câu ở gặp lại 2/bản tương đương đã kiểm. Chưa có mốc giao đo bất biến và cửa sổ trưởng thành đầy đủ.

**Cần sửa:** đăng ký cohort/mốc giao đo/hạn bảy ngày bất biến, giữ bỏ dở/thiếu học liệu/cần thầy trong mẫu số; chỉ đếm receipt chính xác của bài kiểm lần hai đầu tiên, đúng độc lập, có bằng chứng tương đương. Tách nhóm chưa trưởng thành. Không công bố đã đạt 90% từ widget hiện tại.

## 3. Các điểm còn thiếu trực tiếp ảnh hưởng học sinh

### R7 · P1 · Điểm thử Tu luyện chưa được nối dữ liệu

PR thêm nút ở màn kết quả nhưng không đổi `server/src/tu-luyen.ts` để ghi kết quả vào sổ chung hoặc nối luật khắc phục. `docTrangThaiLoiDau` chỉ đọc `su_kien_hoc`. Nếu em chỉ sai câu đó ở Tu luyện, nút mới sẽ gặp “chưa có lần sai đã công bố”, vì lượt sai vẫn nằm ở các bảng Tu luyện riêng. Màn chấm từng câu cũng chưa được nối nút chữa.

**Cần sửa:** ghi receipt Tu luyện idempotent khi cờ bật, giữ không EXP, nối cả chấm từng câu và nộp lượt mà không đếm đôi. Truyền ref nguồn thật; phân biệt S hiển thị và Q mục tiêu, bảo đảm đọc học liệu đúng dữ kiện. Kiểm một lỗi phát sinh chỉ từ Tu luyện chế độ 2–4. Việc thêm tên `tu_luyen` vào union nguồn chưa thực hiện đồng bộ.

### R8 · P1 · Chưa đạt yêu cầu thấu hiểu từng bước

`nopItem` gọi `xayPhanHoi(..., null)` nên phản hồi sai không có điểm lệch hoặc đối chiếu cách nghĩ. UI chủ yếu hiện “Đúng rồi!”/“Chưa đúng”. Sau 800ms tự gọi câu tiếp và xóa phản hồi (`ManChuaCauSai.tsx:198`), không để em chủ động đọc và hiểu.

Chưa có đường sử dụng các trường ý nghĩa, điều kiện, đối chiếu, xác nhận nguyên nhân, thẻ tiến bộ từ receipt hoặc hai nhánh cá nhân hóa trong API/UI thực. Hai fixture test khác nhau không chứng minh app chọn đúng cách giúp cho hai học sinh. Nội dung câu được render bằng đoạn text/ô nhập riêng, chưa tái sử dụng renderer Hoá/bảng/hình và bộ nhập chuẩn. Kiểu `chon_ly_do`/`ds` không có tương tác lựa chọn tương ứng.

**Cần sửa:** thực hiện mục 5.5–5.6, 6.4, 11.6–11.9 và 14.5 của đặc tả trong luồng chạy được. Chẩn đoán có bằng chứng → giúp đúng điểm lệch → kiểm lý do và chuyển giao mới → ghép bài. Cho nút tiếp sau phản hồi; không tự chuyển sau 0,8 giây. Tạo/duyệt học liệu phục vụ được qua API, không để fixture chỉ nằm trong test. Dạy cách khác khi giúp lần đầu không hiệu quả; chưa có quan sát học sinh thì ghi rõ chưa nghiệm thu sức hút.

### R9 · P2 · Bộ chấm số chưa dùng giá trị số

`chua-cau-sai.ts:152` so chuỗi `trim().toLowerCase()` cho mọi loại câu. Ca đáp án `0.1`, em nhập `0,10` bị chấm sai.

**Cần sửa:** dùng chuẩn hóa số/sai số/rubric của loại câu và bộ chấm chuẩn cho Phần I/II/III. Chọn lý do và các cách giải hợp lệ có rubric đã kiểm; không dùng so văn bản làm bộ chấm số hoặc câu nhiều ý.

### R10 · P2 · Nhãn tự sửa đang nói đã đóng lỗi quá sớm

`ManChuaCauSai.tsx:285` nói “lỗi này đã được đóng” khi `lanGapLai>=2`. Một lần đúng độc lập ở gặp lại 2 chưa đạt luật đóng lỗi chung hai ngày và khoảng cách từ lần sai cuối. Không dùng số lần gặp lại để suy đóng lỗi.

**Cần sửa:** đọc projection luật chung và tách nhãn đã tự sửa/chờ kiểm chứng/đã đóng. Không thay luật bằng câu chữ UI.

### R11 · P2 · Widget thầy gọi sai HTTP và thiếu xác thực thầy

`KpiChuaCauSai.tsx:33` gọi GET. `index.ts:3797` chỉ định tuyến endpoint trong nhánh POST và sau cổng `laThay`. GET trả 405 trong ca kiểm. POST không mã thầy cũng bị 403. Khẳng định “endpoint không cần auth” trong mô tả PR không khớp mã.

**Cần sửa:** dùng hợp đồng HTTP thống nhất và cơ chế gọi API thầy hiện có. Giữ bảo vệ báo cáo; không sửa bằng cách bỏ xác thực.

## 4. Build, merge và cách nghiệm thu lại

7 lỗi TypeScript Worker hiện có: `chuyenTrang`, `PhienResponse`, `CauHinhChuaCauSai`, `hocLieu`, `probeJsonDapAn`, biến `b` chưa được dùng và khai báo `dung` bị ghi hai lần trong object response. Nối đầy đủ luồng rồi xử lý lỗi; xóa import FSM để xanh typecheck sẽ không sửa R2.

Đồng bộ main và giải conflict `DIEU-PHOI.md`, giữ ghi chú của cả hai phía. Chạy lại kiểm màu trên nhánh đã đồng bộ. Không tuyên bố PR sẵn sàng merge khi GitHub còn báo dirty.

Các ca kiểm thất bại bổ sung gồm: mở đợt, phát item, lưu tiến độ sau nộp, xin gợi ý, giữ hỗ trợ, chuẩn hóa số, phạm vi pilot, quyền xem tiến độ, chặn ca đang mở, gặp lại 2 đến hạn, mẫu số KPI và HTTP widget thầy.

Bộ tái hiện được bàn giao dưới dạng tệp text `docs/ra-soat-pr189/chua-cau-sai-pr189-review.test.ts.txt`. Chép vào `tests/chua-cau-sai-pr189-review.test.ts` trên nhánh có implementation, chạy từ gốc repo:

```bash
npx vitest run tests/chua-cau-sai-0710.test.ts tests/chua-cau-sai-pr189-review.test.ts --reporter=verbose
npx tsc --noEmit -p server/tsconfig.json
npm run build
npm run kiem:mau-giu
```

Fixture tái hiện chỉ dựng dữ liệu tối thiểu để cô lập lỗi của API và dùng schema thật trong SQLite. Sau khi bổ sung cổng kho/khối, hoàn thiện fixture câu kho và dữ kiện tương đương cho kiểm xuyên luồng; không bỏ assertion hoặc bỏ cổng để làm test xanh. Ca đồng thời/CAS cần bộ kiểm runtime D1 riêng.

Trước bật pilot, cần có một luồng thật Tu luyện sai → xác định bước → chữa có kiểm lý do/chuyển giao → ghép bài → hẹn → tự làm bản mới; kiểm đổi máy và lỗi mạng; đối soát sổ; nhóm pilot xác định và học liệu đủ dùng. Sau đó quan sát học sinh theo đặc tả và theo dõi cohort trưởng thành. Hoàn thành mã không đồng nghĩa đạt 90% hoặc học sinh đã thấy hấp dẫn.
