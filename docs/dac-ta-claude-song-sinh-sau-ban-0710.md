# Giao việc cho Claude: hoàn thiện kho sáu câu song sinh bằng gói đang đăng nhập

Bạn là Claude Code làm việc trong repository `dodaihoc4869/omr-app`. Thực thi công việc bên dưới bằng Claude CLI đã đăng nhập qua gói Claude của chủ tài khoản. Không dùng khóa Anthropic/OpenAI API, Bedrock, Vertex, Foundry hoặc dịch vụ AI tính phí API riêng. Không yêu cầu người dùng mua khóa API. Claude CLI vẫn dùng kết nối mạng và giới hạn sử dụng của gói đã đăng nhập.

Người dùng đã cho phép thực thi. Bạn được đọc kho và soạn học liệu, nhưng đầu ra của nhiệm vụ này phải chờ Codex kiểm tra lại trước khi nạp vào dữ liệu học sinh. Không được tự tuyên bố đúng chuyên môn tuyệt đối 100% vì hai phiên AI đồng ý.

## 1. Mục tiêu và số liệu nền

- Mỗi câu hợp lệ trong kho có ít nhất **sáu bản song sinh khác nhau đã được kiểm**; gồm cả lý thuyết và tính toán ở I/II/III.
- Loại toàn bộ tự luận khỏi sinh, dùng chính `laCauTuLuan` trong `src/lib/cau-tu-luan.ts`. Không xóa câu gốc hay lịch sử làm bài.
- I: sáu câu trắc nghiệm, mỗi câu bốn lựa chọn và một đáp án đúng duy nhất.
- III: sáu câu trả lời ngắn số học; đáp án theo định dạng và quy tắc làm tròn của ứng dụng.
- II: 24 ý mới khác nhau có cùng đề dẫn, đủ sáu nhóm bốn ý không lặp; mỗi ý có Đ/S và lý do. Đề dẫn phải đủ dữ kiện cho từng ý.
- Quét D1 lúc `2026-10-07T00:15:37Z`: 15.359 qid, loại 531 tự luận, còn 14.828 câu (I: 8.766; II: 2.467; III: 3.595), 6.784 nhóm nội dung đã ánh xạ, 11 câu hợp lệ chưa ánh xạ, **0 câu đủ sáu bản**. Đây là số liệu nền, phải quét lại khi chạy, không ép báo cáo mới khớp số cũ.
- Đảo thứ tự phương án, đổi tên người, sửa vài chữ hoặc sao chép câu gốc không được tính là bản mới.

## 2. Đọc mã và chuẩn bị môi trường

Đọc `CLAUDE.md`, `DIEU-PHOI.md` và nhánh `codex/sau-song-sinh-0710` (PR185). Không ghi đè thay đổi của phiên khác; dùng worktree riêng. Các tệp cần hiểu:

1. `scripts/loi-giai/may-soan.mjs`: chạy `claude -p`, dựng lô, giải mù, ghép bằng chứng.
2. `scripts/loi-giai/goi-may-soan.md`, `goi-kiem-mu.md`, `vi-du-bo-tro.json`: khuôn nội dung và đầu ra.
3. `server/src/may-soan-kiem.ts`: bộ kiểm câu, số lượng, tính toán, trùng nội dung, giải mù và bằng chứng.
4. `server/src/hoc-lieu-may-soan.ts`, `cau-y-ds.ts`: hàng việc, nạp kết quả và vị trí lịch sử.
5. `scripts/loi-giai/kiem-sau-ban-0710.ts`: quét số lượng khác nhau và bằng chứng đã lưu.

Kiểm tra `claude --version` và trạng thái đăng nhập. Nếu CLI chưa đăng nhập, dùng luồng `claude auth login` của gói Claude; chỉ yêu cầu người dùng hoàn tất đăng nhập khi công cụ không thể làm thay. Không chuyển sang API để vượt hạn mức. Nếu gói hết lượt, lưu checkpoint và tiếp tục khi có lượt.

Loại khỏi môi trường của phiên con các khóa API, token quản trị, token GitHub/Cloudflare và cấu hình backend AI khác; chỉ giữ thông tin cần cho phiên Claude đăng nhập theo gói. Đặc biệt không để `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL` hoặc các cờ backend Bedrock/Vertex/Foundry điều hướng sang API trả tiền riêng. Không in giá trị bí mật.

## 3. Đầu vào thật và chế độ chỉ soạn

Phải lấy câu gốc từ kho thật qua quyền đọc đã có. Không lấy ví dụ minh họa trong repository làm thay cho toàn kho. Lưu snapshot riêng ngoài Git có câu gốc, đáp án kho, ảnh/bảng, học liệu hiện có, qid và bam. Ghi thời điểm, phiên bản, checksum và số lượng; bảo vệ dữ liệu đáp án, không commit snapshot vào repository công khai.

Nếu không có quyền đọc kho, trả danh sách thông tin truy cập còn thiếu và các bước đã thử; không bịa câu để đạt số lượng. Nếu chưa có `OMR_MA_BI_MAT`, vẫn có thể soạn từ snapshot đọc được; không tự đổi mã quản trị của Worker.

**Không chạy thẳng lệnh sau để soạn thử trên dữ liệu thật:**

```sh
node scripts/loi-giai/may-soan.mjs --nap-song-sinh-toan-kho --lop tat-ca --mot-lan
```

Lệnh hiện có tự nộp các lô đạt vào máy chủ. `--thu` chỉ xử lý một lô ba câu, không phải chế độ soạn toàn kho.

Trước khi soạn toàn kho, bổ sung hoặc dùng một runner ngoại tuyến có chế độ **chỉ sinh và xuất gói**, tái sử dụng đúng bộ kiểm hiện có; không gọi các tuyến nạp, lấy lease hàng thật, sửa chỉ mục hoặc cập nhật D1. Chế độ phải hỗ trợ snapshot, resume và chỉ xuất tệp. Nếu sửa runner, thêm kiểm thử chứng minh chế độ này không nộp dữ liệu. Không dùng `--nap-hang` để lập lại chỉ mục.

## 4. Chiến lược hoàn thành nhanh

- Gộp theo bam, soạn một lần cho nội dung thật sự trùng; giữ danh sách toàn bộ qid được phủ. Kiểm tra phạm vi phần/lớp và nội dung trước khi dùng chung kết quả.
- Giải quyết 11 câu hợp lệ thiếu ánh xạ bằng cách tính bam theo hàm chuẩn trong repository. Xuất đề xuất ánh xạ, không ghi đè chỉ mục thật.
- Ưu tiên câu học sinh đã sai, câu chưa có bản nào, rồi câu thiếu một phần; nhưng cuối cùng phải phủ toàn bộ lớp, không chỉ lớp 12.
- Tái sử dụng bản cũ sau khi kiểm lại. Bản đủ cấu trúc nhưng chưa có bằng chứng không được tính đã kiểm. Xuất chứng cứ bổ sung theo vị trí cũ; không đánh dấu đại trà.
- Bắt đầu bằng lô mẫu bao phủ cả I/II/III, lý thuyết/tính toán, ảnh/bảng và câu nghi đáp án; kiểm qua lô mẫu rồi mở rộng.
- Gom lô cùng chương, khoảng 3–6 câu/lô khi mỗi câu có nhiều bản; mặc định tối đa bốn phiên Claude đồng thời, giảm khi gói giới hạn. Không tăng song song chỉ để vượt hạn mức.
- Sau mỗi lô lưu checkpoint theo bam và checksum câu gốc. Chạy lại phải bỏ qua đúng lô đã hoàn tất; câu gốc đổi thì kiểm lại.

## 5. Tiêu chuẩn nội dung

### Tính toán

Giữ cùng kiến thức và phương pháp của câu gốc, đổi bộ số thực sự. Tự tính lại mọi bước, đơn vị, phương trình phản ứng/định luật, điều kiện áp dụng, chất giới hạn, dấu, miền giá trị và làm tròn. Kết quả và dữ kiện phải hợp lý vật lý/hóa học. Không chọn số dẫn đến trường hợp suy biến hoặc đáp án mơ hồ.

Mỗi bản lưu `phepTinh` có biểu thức tính lại được, kết quả, mức làm tròn và biểu thức đáp số. Bộ kiểm biểu thức chỉ kiểm số học; phải đối chiếu riêng xem công thức thực sự xuất phát từ đề. Không nhập sẵn đáp số vào biểu thức để giả kiểm chứng. Với I, ba phương án nhiễu phải sai rõ ràng và không trùng đáp án sau làm tròn.

### Lý thuyết

Giữ mục tiêu kiến thức, độ khó và phạm vi chương trình. Có thể đổi chất cùng loại khi tính chất phù hợp, đổi chiều hỏi hoặc phương án nhiễu. Giải thích vì sao từng lựa chọn đúng/sai; kiểm những từ “luôn”, “chỉ”, “mọi”, “không bao giờ”, điều kiện phản ứng và ngoại lệ. Không thay chất rồi giữ nguyên lời giải nếu tính chất đã đổi.

Dựa trên nguồn học liệu đã được phép dùng; ghi căn cứ trong hồ sơ kiểm. Không bịa trích dẫn, không dựa vào kiến thức ngoài đề khi câu cần số liệu bảng. Nguồn mâu thuẫn, thiếu dữ kiện hoặc nhiều đáp án bảo vệ được thì đưa vào danh sách cần xử lý, không cố hoàn thành đủ sáu.

### Đúng/sai

Mỗi ý mới đủ nghĩa, khác cả bốn ý gốc, khác ý đã lưu và khác ý cùng lô. Kiểm Đ/S và giải thích riêng từng ý. Kiểm mỗi nhóm bốn ý dùng được độc lập với đề dẫn/ảnh/bảng; phối hợp Đ/S hợp lý, tuân thủ bộ kiểm, không tạo kho một phía dễ đoán. Đủ 24 chuỗi khác nhau chưa tự chứng minh sáu nhóm chất lượng.

## 6. Ba bước kiểm trước khi bàn giao

1. **Lượt soạn:** tạo câu, phương án, đáp án, lời giải, phép tính và căn cứ. Kiểm cấu trúc và tính toán bằng `kiem.bundle.mjs` được dựng từ nguồn hiện tại.
2. **Lượt giải mù:** mở phiên Claude mới trong thư mục riêng, chỉ có đề, phương án/ý và ảnh/bảng cần thiết. Không thấy đáp án đề xuất, lời giải, phép tính, đáp án kho hoặc bản mẫu. Tự giải từng mục; ghi `{id,d,lyDo,chac}`. Không chắc thì `chac:false` hoặc `d:"?"` và lý do. Không chạy soạn và kiểm trong cùng ngữ cảnh.
3. **Đối chiếu tự động:** dùng `ghepHaiLuot`, `nhanBanKhacNop`/`nhanYMoiNop` và bộ kiểm chuẩn. Chỉ mục đáp án khớp, `chac:true`, lý do có nội dung và các kiểm chuyên môn đạt mới vào gói ứng viên. Lệch thì sửa rồi giải mù lại; giữ lịch sử mọi lần bị loại.

Không tự bịa `kiem.d2`, không sao chép lời giải lượt soạn làm `lyDo2`, không sửa kết quả giải mù để khớp đáp án. Bằng chứng lưu tối thiểu `kiem:{d2,lyDo2,chac:true}` cùng đầu vào và đầu ra gốc của hai lượt. Chữ chắc chắn do AI tự khai không thay cho kiểm tra của Codex.

## 7. Gói bàn giao cho Codex

Đặt dưới thư mục riêng ngoài Git, ví dụ `.may-soan/ban-giao-sau-ban/`; không commit dữ liệu đáp án. Gói gồm:

```text
manifest.json              # phiên bản, snapshot, checksum, phạm vi, thống kê
anh-xa-de-xuat.json         # 11 câu thiếu ánh xạ hoặc số mới sau quét
noi-dung/<bam>/goc.json
noi-dung/<bam>/da-co.json
noi-dung/<bam>/soan.json
noi-dung/<bam>/kiem-mu-vao.json
noi-dung/<bam>/kiem-mu-ra.json
noi-dung/<bam>/ung-vien.json
noi-dung/<bam>/kiem-chuyen-mon.json
noi-dung/<bam>/nhat-ky-loai.json
do-phu-qid.json             # mỗi qid: bam, phần, số bản cấu trúc, số đã kiểm, trạng thái
can-xu-ly.json              # thiếu nguồn/ảnh, nghi đáp án, vị trí lịch sử hết chỗ…
bao-cao-kiem.json           # lệnh kiểm, kết quả, lỗi và phạm vi kiểm
checkpoint.json
```

Trong `kiem-chuyen-mon.json` phải có kết luận riêng về dữ kiện, phương pháp, đơn vị/làm tròn hoặc từng lựa chọn lý thuyết, căn cứ và vấn đề chưa chắc. `manifest.json` không chứa khóa bí mật; ghi chính xác số câu gốc, tự luận loại, nhóm bam, đủ sáu, thiếu và chưa ánh xạ. Thống kê phải khớp `do-phu-qid.json`, không dùng số nhóm thay số qid.

Khuôn ứng viên giữ nguyên khuôn đang dùng: `{qid,bam,songSinh:[...]}` cho I/III hoặc `{qid,bam,yMoi:[...]}` cho II. Không tự tạo kiểu dữ liệu máy chủ không nhận. Bản cũ giữ vị trí; bằng chứng kiểm lại bản cũ xuất riêng, không đảo/xóa để nhét bản mới. Nếu hết 12 vị trí lịch sử mà chưa đủ sáu bản dùng được, báo thiếu; không đổi nghĩa qid `~ssN`.

Đầu ra bàn giao là **ứng viên đã tự kiểm**, chưa là học liệu phát hành. Trả đường dẫn gói, checksum, báo cáo và một lô mẫu để Codex bắt đầu kiểm; tiếp tục hoàn thiện phần còn thiếu.

## 8. Cổng kiểm và nghiệm thu

Chạy kiểm thử liên quan, TypeScript và kiểm bundle khi sửa công cụ. Cổng hiện có:

```sh
node scripts/loi-giai/dung-kiem.mjs
npx tsc --noEmit -p server/tsconfig.json
npx vitest run tests/song-sinh-sau-ban-0710.test.ts tests/hang-song-sinh-toan-kho-0710.test.ts tests/kiem-sau-ban-0710.test.ts tests/may-soan-hoc-lieu-0510.test.ts --reporter=dot
```

Codex sẽ đối chiếu snapshot, chạy lại bộ kiểm trên **toàn bộ ứng viên**, kiểm độc lập kết quả tính toán và tính hợp lệ của câu lý thuyết, rà câu trùng/ảnh/bảng/nguồn. Lô mẫu không thay thế kiểm toàn bộ. Chỉ các mục đạt mới được nạp bằng đường nhận chuẩn; mọi mục không đủ căn cứ phải giữ ở trạng thái chưa đạt.

Sau khi Codex nạp, quét lại D1 thật bằng `kiem-sau-ban-0710.ts`. Hoàn thành chỉ khi mọi qid hợp lệ đủ sáu bản khác nhau có bằng chứng, không thiếu ánh xạ, không còn lỗi chặn và báo cáo phủ khớp kho thật. Việc từng biểu thức tính đúng không đủ chứng minh đề đúng; có sáu bản không đủ chứng minh đúng kiến thức. Không tuyên bố “100% chuẩn” chỉ từ hai lượt AI hoặc kiểm thử mã nguồn xanh.

**Bắt đầu thực thi ngay phần đọc, chuẩn bị lô mẫu và soạn từ đầu vào thật có quyền truy cập. Không gọi AI API; không nạp học liệu vào D1 trước khi Codex kiểm lại.**
