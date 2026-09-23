# Lệnh tiếp tục CNH-1.0 đến khi đủ điều kiện nghiệm thu

Ngày soạn: 23/09/2026. Dùng trong workspace `omr-app` và task đang triển khai CNH-1.0.

## Thầy dán đoạn này vào task đang làm

```text
Đọc CLINE-CHAY-LIEN-TUC-CNH-2309.md và .clinerules/omr-cnh-1-tiep-tuc.md trong workspace omr-app. Thực thi toàn bộ mục “CHỈ THỊ THỰC THI” ngay, tiếp tục từ code và tiến độ hiện có. Đây là lệnh làm tiếp toàn bộ phần còn lại của CNH-1.0, không phải yêu cầu viết kế hoạch hay chỉ hoàn thành thêm một lát cắt.

Sau mỗi phần: kiểm thử, lưu checkpoint rồi gọi công cụ làm phần tiếp theo ngay trong task hiện tại. Không gọi attempt_completion hoặc kết thúc phản hồi chỉ vì vừa sửa xong một phần, có test xanh, tạo commit hay cập nhật nhật ký. Chỉ kết thúc khi đạt điều kiện nghiệm thu trong file, hoặc mọi công việc còn lại đều có chặn bên ngoài đã xác minh và không còn phần độc lập làm được. Không cần đợi tôi nhắn “tiếp tục” giữa các gói. Bắt đầu bằng việc đọc trạng thái trên đĩa và xử lý phần còn thiếu của P04/P05/P06 theo phụ thuộc dữ liệu thật.
```

Đoạn trên yêu cầu agent đọc file tại máy này. Nếu chạy ở máy khác, chuyển cả file này và bộ `docs/cline-ca-nhan-hoa-2309` sang workspace đó trước.

## Vì sao cần lệnh này

Ảnh bàn giao ghi “COMPLETED” nhưng nội dung mới chốt một phần của P05. Đối chiếu repo khi soạn: HEAD `e295650`; P02/P03 PASS; P00/P01/P04/P05 IN_PROGRESS; P06–P11 NOT_RUN; 2/42 yêu cầu và 9/50 tình huống nghiệm thu PASS. Đây là ảnh chụp trạng thái, không phải bằng chứng rằng code hiện tại đúng; khi bắt đầu phải đọc lại vì dự án có thể đã thay đổi.

702 test nhỏ xanh trong báo cáo P05 không thay thế 42 yêu cầu và 50 tình huống nghiệm thu. Quy tắc mới phân biệt **kết thúc một phần việc** với **kết thúc toàn bộ nhiệm vụ**.

File này chỉ bổ sung cách tiếp tục công việc. Không đổi luật học, EXP, dữ liệu, tiêu chí nghiệm thu hay quyền phát hành của CNH-1.0. Các file chuẩn trong `SPEC-LOCK.json` được giữ nguyên.

## CHỈ THỊ THỰC THI

### 1. Mục tiêu và quyền chủ động

Hoàn thành toàn bộ phần còn lại của CNH-1.0 có thể thực hiện với quyền và môi trường hiện có. Giữ mục tiêu đầy đủ 42 yêu cầu; tách rõ 38 yêu cầu code, 3 yêu cầu triển khai và 1 yêu cầu đánh giá học tập. Không thu hẹp mục tiêu thành “thêm một module”, “thêm một commit” hoặc “thêm một lượt kiểm thử”.

Tự đọc, sửa code, thêm hoặc sửa kiểm thử cần thiết, sửa lỗi, kiểm diff và lưu bằng chứng trong phạm vi đã giao. Không hỏi lại các quyết định triển khai thông thường đã được đặc tả chốt. Nếu người dùng hỏi tiến độ giữa lúc làm, trả lời ngắn rồi tiếp tục công việc còn được phép.

Yêu cầu “chạy liên tục” không tự cấp thêm quyền deploy, migration production, bật cờ thật, dùng dữ liệu thật hay gửi thông báo cho học sinh. Thực hiện các bước đó theo quyền rõ ràng đã có trong phiên làm việc; nếu thiếu, hoàn thành mọi chuẩn bị cụ thể và mọi phần độc lập trước khi nêu phần cần người dùng xử lý. Không lấy một chặn phát hành làm lý do dừng viết và kiểm thử code cục bộ.

### 2. Đọc đủ để tiếp tục, không khởi động lại dự án

Đọc theo thứ tự:

1. `.clinerules/omr-cnh-1.md` và `.clinerules/omr-cnh-1-tiep-tuc.md`.
2. `docs/cline-ca-nhan-hoa-2309/00-HUONG-DAN.md` và `01-QUYET-DINH-DA-CHOT.md`.
3. `TIEN-DO.json`, `05-GOI-THI-CONG.md` và các mục nhật ký liên quan trong `NHAT-KY.md` cùng thư mục.
4. `evidence/ROUTE-MAPPING.md`, `evidence/SCHEMA-MAPPING.md`, bằng chứng gần nhất của phần đang làm.
5. Các mục tương ứng trong 02/03/04/06/07, tham số và kết quả mẫu cần cho phần việc đã chọn.

Đọc `git status`, HEAD và diff trước khi sửa. Giữ thay đổi có sẵn của người dùng. Không reset/clean, không gom tất cả file bằng `git add .`, không ghi đè thay đổi chưa rõ tác giả. Commit/push theo quyền đã có, không xem chúng là điều kiện bắt buộc để làm tiếp. Không mở thêm agent hoặc task khác chỉ để kéo dài việc chạy.

Không quét lại cả ổ SSD, không đọc toàn bộ nhật ký sau mỗi lần sửa, không nghiên cứu lại thuật toán đã chốt. Nhật ký có thể chứa bước tiếp theo đã cũ; kiểm code và trạng thái hiện tại trước khi chọn việc.

### 3. Vòng làm việc bắt buộc

Lặp vòng dưới đây cho đến khi thỏa điều kiện kết thúc ở mục 9:

1. **Chọn việc:** từ yêu cầu chưa đạt, chọn phần tạo ra hành vi sản phẩm còn thiếu và có đầu vào sẵn sàng. Ưu tiên tháo phụ thuộc của các phần sau.
2. **Xác định tiêu chí:** ghi ngắn ID yêu cầu/test, đường gọi thật, hành vi cần đạt và cách kiểm. Không dừng ở bản kế hoạch.
3. **Thực hiện:** sửa một phần có thể kiểm chứng; nối vào nơi gọi thật; giữ tương thích dữ liệu và cờ theo đặc tả.
4. **Kiểm:** chạy kiểm thử liên quan trên code sản phẩm, đọc lỗi, sửa rồi chạy lại. Kiểm SQL/CAS/đồng thời bằng runtime D1 phù hợp, không mô phỏng chính cơ chế cần chứng minh.
5. **Đối chiếu:** xem diff, kiểm các nhánh khác dùng cùng logic, tìm TODO/placeholder/đầu vào hằng số làm vô hiệu chức năng vừa viết. Hàm thuần đúng nhưng không có dữ liệu thật truyền vào chưa hoàn thành tính năng.
6. **Lưu checkpoint:** cập nhật tiến độ, nhật ký và bằng chứng thật. Một phần gói đã đúng thì ghi đúng phần đó; không tô PASS cả gói/test tích hợp còn thiếu.
7. **Tiếp tục ngay:** chọn và gọi công cụ cho việc tiếp theo. Checkpoint là điểm lưu để phục hồi, không phải điểm trả quyền điều khiển và chờ thầy nhắn tiếp.

Thông báo tiến độ ngắn khi có kết quả đáng kể hoặc sau khoảng một phút đang làm, nếu công cụ cho phép. Dùng dạng: “Đã kiểm X. Đang sửa Y. Tiếp theo Z.” Sau thông báo tiếp tục công cụ, không kết thúc nhiệm vụ.

Không dùng công cụ hoàn tất nhiệm vụ của môi trường, chẳng hạn `attempt_completion` nếu có trong Cline, cho báo cáo giữa chừng. Không viết “phần còn lại thầy bảo tôi làm tiếp”, “đã xong lượt này” hoặc “còn P06–P11” rồi tự dừng khi các phần đó vẫn làm được.

### 4. Gỡ phụ thuộc P04/P05/P06 bằng đầu ra thật

Áp dụng đúng phần hướng dẫn chung của 05: phụ thuộc dựa vào **sự sẵn sàng của đầu ra**, không tạo vòng chờ vì test tích hợp tương lai. Giữ nguyên danh mục gói và trạng thái trung thực.

Tại thời điểm soạn, P04 có module chống lặp nhưng cần P05 nối; P05 cần dữ liệu từng câu mà nhật ký đang để P06 nối. Xử lý như sau:

1. Xác nhận hợp đồng đầu vào của bộ chọn: scope/revision, trạng thái bảo vệ, content_group/version, family, working_level, due/card, purpose/role, task đang mở, reservation, lịch sử và mẫu tốc độ. Đọc 02/04 trước khi đặt tên hoặc thêm trường.
2. Hoàn thành adapter đọc dữ liệu tối thiểu cần cho P05 và phần nối tương ứng của P06. Ghi rõ phần nào thuộc gói nào; vẫn sửa từng phần có kiểm thử, không mở rộng thành viết lại toàn hệ thống.
3. Nối chống lặp P04 vào pipeline P05, truyền đủ dữ liệu vào score và budget. Không cho mọi câu cùng điểm vì thiếu adapter rồi nhận là đã cá nhân hóa.
4. Kiểm luồng thật và hoàn tất các đầu ra P04/P05 đã đủ điều kiện; sau đó mở rộng P06 sang toàn bộ kênh.

Tương tự, correction của P01 chờ command P07 thì hoàn thiện command rồi quay lại chốt correction. Không quay về làm lại P01 từ đầu, không ép P01 PASS trước khi phần bù tồn tại.

Một nhãn `IN_PROGRESS` của gói trước không tự chặn mọi việc phía sau. Một đầu vào thật chưa tồn tại thì phải triển khai đầu vào đó trước; không bỏ qua kiểm phạm vi/quyền/cấp độ để phá vòng chờ.

### 5. Hàng đợi cần xử lý, đối chiếu lại với repo trước khi làm

Đây là danh sách ưu tiên, không thay thế đặc tả:

| Phần | Kết quả phải đi đến |
|---|---|
| P04/P05 | Chống lặp nối đường thật; dữ liệu đủ cho score §7.2; hard filter §7.1; time-fit với mẫu tốc độ hợp lệ; SQL uniqueness/CAS cho reservation và chọn lại phần chưa chốt khi thua tranh chấp. |
| P05 | Một plan/ngày, rubric đóng băng, resume, carry-over, assignment quá tải giữ hạn gốc; báo `deferred_count`/`over_budget_seconds` đúng hợp đồng. |
| P06 | Mọi route/adapter/cờ trong route map dùng hợp đồng chung hoặc ngoại lệ có tên; Đoàn đúng mức cá nhân, hạn mềm, continuing task, không chấm sai vì timeout. |
| P07 + phần P01 còn thiếu | EXP, ledger/day/profile/receipt/outbox nguyên tử; idempotency, giới hạn ngày, correction bù đúng một lần, embargo và sự kiện muộn. |
| P08 | Hấp thụ/cấp/khiên/ví theo tham số chốt; học sinh mới không lên cấp 10 trước ngày 12, khiên đầu không trước 21 ngày; migration/rollback và nhánh legacy đúng. Không reset quyền cũ để ép hai mốc này. |
| P09 | Ba app nhất quán; không tràn; cấu hình ca/API server; phần lên bảng bỏ thời gian/countdown tự gọi, chỉ bấm nút mới hiện thần thú và thẻ tên. Áp dụng cả cửa sổ trình chiếu. |
| P00/P10 còn thiếu | Hoàn thiện baseline, kiểm tích hợp, hiệu năng, restore, manifest; chốt bằng chứng trên phiên bản cuối. Không biến số đo local thành số đo staging. |
| P11 | Chuẩn bị và thực hiện xác minh triển khai theo quyền/môi trường; đo học tập theo cửa sổ thật, không giả kết quả hoặc chờ thụ động nhiều tuần trong task code. |

Giữ luật EXP và cá nhân hóa theo 01–04/THAM-SO. Không tự đổi thuật toán, giá đồ, mô hình FSRS hay đường cấp để dễ làm xong.

### 6. Chặn công việc phải có bằng chứng, không phải lý do chung chung

Lỗi biên dịch, test đỏ, thiếu adapter, thiếu test harness cục bộ, thiếu module hay chưa hiểu đường gọi thường là việc cần giải quyết. Đọc lỗi, tra code/tài liệu phù hợp, sửa hoặc xây phần còn thiếu trong phạm vi. Không chỉ ghi BLOCKED rồi bỏ qua.

Khi một hướng sửa không hiệu quả, dùng log để đổi giả thuyết; không lặp mãi cùng lệnh không tạo thông tin mới. Khi công cụ từ chối vì quyền hoặc chính sách, tôn trọng giới hạn đó; không đổi công cụ nhằm vượt chặn.

Chặn bên ngoài hợp lệ có thể là: thiếu quyền/môi trường staging bắt buộc, cần thao tác thiết bị thật chưa có, dữ liệu cần chủ dự án xác nhận, mâu thuẫn nghiệp vụ chưa có quyết định, hoặc giới hạn API/runtime không thể xử lý trong phiên.

Với mỗi chặn, ghi:

- ID yêu cầu/test bị ảnh hưởng và phần đã làm xong.
- Điều kiện thiếu cụ thể, lệnh/log hoặc bằng chứng xác nhận.
- Những bước kiểm tra phù hợp đã làm; không tự tạo quyền hoặc dữ liệu thay thế.
- Việc chính xác cần từ người dùng/môi trường để mở chặn.
- Các phần độc lập sẽ tiếp tục ngay.

Chỉ chặn đúng nhánh phụ thuộc. P11 chưa được phép deploy không chặn P06/P07/P08/P09. Tuy nhiên, P00/P10 có tiêu chí staging bắt buộc thì thiếu staging cũng có thể khiến CODE_VERIFIED chưa đạt; không tự hạ tiêu chí để tuyên bố code 100%.

### 7. Bằng chứng và kiểm thử, tránh chạy lại vô ích

Sau mỗi thay đổi, chạy nhóm kiểm thử bị ảnh hưởng. Full regression/build/typecheck/lint ở mốc tích hợp cuối, hoặc sớm hơn nếu phạm vi thay đổi có lý do. Không chạy lại toàn bộ suite và cập nhật mọi hash sau từng chỉnh sửa nhỏ chỉ để báo số test lớn.

Kiểm tra scripts hiện tại trước khi chạy. Các lệnh có trong bộ bàn giao:

```sh
npm exec -- tsc -b
npm exec -- tsc -p server/tsconfig.json --noEmit
npm exec -- vitest run
npm run build
npm run lint
node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs
node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs --fingerprint
node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs --acceptance
```

Các lệnh này không tự thay thế test D1, trình duyệt, benchmark và kiểm thiết bị thật. Dùng harness tương ứng hoặc bổ sung harness còn thiếu trong phạm vi đã giao.

Phân biệt lỗi nền với hồi quy. Lỗi nền thuộc phạm vi yêu cầu vẫn phải sửa để đạt yêu cầu đó; lỗi ngoài phạm vi cần báo riêng, không được sửa bộ test thành xanh giả. Không bỏ assertion, skip test, đổi vector chuẩn hoặc sửa SPEC-LOCK để hợp thức hóa code.

Khi chốt bản cuối, lấy fingerprint thực, chạy các kiểm thử bắt buộc trên đúng code đó, lưu lệnh/thời điểm/exit code/artifact/hash và ánh xạ R/T sang đường gọi thật. Không chép fingerprint mới vào log cũ. Nếu code đổi sau lượt nghiệm thu cuối, kiểm lại phạm vi bị ảnh hưởng và đáp ứng quy tắc fingerprint nghiêm của bộ kiểm trước khi kết luận.

`--acceptance` hiện xét các gói P00–P10 và yêu cầu mức code; nó không chứng nhận P11 hoặc hiệu quả học tập. Lệnh không có `--acceptance` chỉ kiểm bộ bàn giao và phép tính mẫu. Không dùng một trong hai để thay việc đọc ý nghĩa test và kiểm luồng sản phẩm.

### 8. Checkpoint đủ để tiếp tục sau nén ngữ cảnh hoặc gián đoạn

Giữ `TIEN-DO.json` theo schema hiện có. Không thêm trạng thái tùy ý hoặc sửa danh mục chuẩn. Sau mỗi phần có ý nghĩa, nối một checkpoint vào `NHAT-KY.md`:

```text
CHECKPOINT CNH-1.0
Thời điểm, HEAD và source fingerprint thực tại thời điểm ghi:
Yêu cầu/test đang xử lý:
Hành vi vừa hoàn thành và đường gọi thật:
File đã sửa; thay đổi người dùng cần giữ:
Lệnh kiểm đã chạy, exit code, đường dẫn log:
Phần chưa xong và blocker đã xác minh:
Việc kế tiếp làm ngay, file/hàm cần mở, tiêu chí kiểm:
Các phụ thuộc đã sẵn sàng; phần chờ gói khác:
```

Sau checkpoint, tiếp tục công cụ ngay nếu phiên còn chạy được. Khi ngữ cảnh bị nén, đọc lại checkpoint và code liên quan rồi nối việc; không kể lại toàn bộ dự án hoặc làm lại phần đã có bằng chứng hợp lệ.

Không tự kết thúc sớm chỉ vì task dài hoặc đã có nhiều thay đổi. Nếu gặp giới hạn cứng của API/ứng dụng, lưu checkpoint khi còn có thể và báo đúng giới hạn, không gọi đó là hoàn thành. Không có prompt nào khiến một ứng dụng đã ngắt phiên tự chạy tiếp khi không còn quyền thực thi.

### 9. Điều kiện duy nhất để kết thúc nhiệm vụ

Chỉ gửi báo cáo kết thúc khi rơi vào một trong các trường hợp sau:

**A. Đã đạt mức nghiệm thu tương ứng.** P00–P10 và toàn bộ yêu cầu code đạt đủ điều kiện, test/bằng chứng hợp lệ, `--acceptance` exit 0, đã rà soát đường gọi và diff. Ghi CODE_VERIFIED. Nếu còn việc P11 đã có quyền và môi trường thì tiếp tục P11, chưa kết thúc chỉ vì code đã đạt. Chỉ ghi DEPLOYMENT_VERIFIED hoặc LEARNING_EVALUATED khi có bằng chứng riêng tương ứng.

**B. Không còn việc độc lập làm được.** Mọi phần còn lại đều có chặn bên ngoài đã xác minh; toàn bộ phần chuẩn bị và kiểm cục bộ khả thi đã hoàn thành. Báo CHƯA HOÀN THÀNH, liệt kê chính xác ID còn thiếu và hành động cần để tiếp tục. Trước khi kết luận, rà lại P00–P11 để chắc chắn không bỏ sót phần có thể làm ngay.

**C. Người dùng yêu cầu dừng/tạm dừng hoặc có giới hạn cứng của môi trường.** Tôn trọng yêu cầu/giới hạn, giữ checkpoint, không tự giả định đã có lệnh tiếp tục hay quyền mới.

Ngoài ba trường hợp này, tiếp tục thực hiện. “Vừa push”, “702 test xanh”, “đã cập nhật nhật ký”, “đã xong lát cắt 4” hoặc “gói sau nhiều việc” không phải điều kiện kết thúc.

Báo cáo cuối phải nêu số yêu cầu đạt theo từng mức, số test nghiệm thu đạt theo từng mức, những thay đổi chính, bằng chứng, tình trạng phát hành và chặn còn lại. Tính từ hồ sơ hiện tại; không dùng số trong ảnh cũ. Không gọi 100% toàn dự án nếu còn yêu cầu chưa đạt, cũng không dùng 100% CODE_VERIFIED thay cho triển khai hoặc hiệu quả học tập.

### 10. Hành động đầu tiên ngay sau khi đọc

Đọc trạng thái repo và checkpoint hiện có, xác nhận đầu ra còn thiếu, chọn một phần P04/P05/P06 có thể thực hiện ngay, rồi mở code và bắt đầu sửa/kiểm. Nếu những phần đó đã xong, chọn yêu cầu chưa đạt tiếp theo theo đầu vào sẵn sàng. Không trả lời chỉ bằng việc nhắc lại chỉ thị này.

## Nếu phiên bị ứng dụng ngắt hẳn

Dán lại đoạn lệnh đầu file trong task hiện tại, hoặc task tiếp tục do thầy chủ động mở. Agent phải nối từ checkpoint. Không cần giao lại đặc tả hoặc xóa lịch sử dự án.

Quy tắc này xử lý việc agent tự dừng giữa chừng. Nó không bỏ được giới hạn token, lỗi nhà cung cấp, hộp thoại quyền hay việc cần kiểm trên thiết bị thật. “100%” là kết quả phải chứng minh, không phải lời hứa do prompt tạo ra.
