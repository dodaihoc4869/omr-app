# Ma trận nghiệm thu CNH-1.0

## 1. Quy tắc bằng chứng

Có 42 yêu cầu: 38 thuộc CODE_VERIFIED, 3 thuộc DEPLOYMENT_VERIFIED và 1 thuộc LEARNING_EVALUATED. Có 50 tình huống; mỗi tình huống có thể cần nhiều test case nhỏ. Các test T01–T32 kế thừa và làm cụ thể bộ đề xuất; T33–T50 bổ sung giao diện, hạ tầng, model/version và vận hành.

Trạng thái: NOT_RUN, IN_PROGRESS, PASS, FAIL, BLOCKED. Không dùng SKIP như PASS. PASS phải có source fingerprint, thời điểm, lệnh hoặc quy trình thực chạy, exit code và file bằng chứng. Ràng buộc nguồn code là dấu phát hiện bằng chứng cũ, không phải chữ ký chứng minh test tốt. Người nghiệm thu cần đọc test/log và chạy lại các điểm trọng yếu.

Test unit phải import hàm sản phẩm. Integration phải đi route/adapter thật với auth/DTO; DB integration phải dùng schema và SQL thật trên D1 runtime tương ứng, không mock việc CAS/batch thành luôn thành công. UI phải render/mở màn thật, không chỉ tìm một chuỗi trong source. Visual có ảnh hoặc log kiểm overflow. Hai browser context trên cùng máy là kiểm đồng thời hữu ích nhưng không thay T37 hai thiết bị/mạng thật.

Test mới cần chứng minh thất bại trước bản sửa nếu lỗi hiện còn tái hiện được. Khi code hiện tại đã sửa hành vi đó, thêm regression test đúng và ghi không có red tái hiện, không cố tình gây lỗi cho đẹp quy trình. Test baseline đang xác nhận lỗi cũ không chứng minh đã sửa.

## 2. Yêu cầu → gói → kiểm thử

| ID | Yêu cầu | Gói | Mức | Test |
|---|---|---|---|---|
| R01 | Baseline và bản đồ tất cả đường gọi | P00 | code | T48 |
| R02 | Hợp đồng có version, runtime validation, tham số thống nhất | P01 | code | T34, T40, T50 |
| R03 | Chấm tương đương số và từng ý đúng chính sách | P01 | code | T19, T33 |
| R04 | Sửa điểm, hồ sơ và bù quyền đúng một lần | P07 | code | T20, T32 |
| R05 | Phạm vi cá nhân và toàn bộ kiến thức nền | P02 | code | T01, T02 |
| R06 | Chất lượng kho, bản sao và family trung thực | P02 | code | T03, T04, T40 |
| R07 | Bảo vệ đề/bản sao/cache và quyền công bố | P02 | code | T11, T12, T47 |
| R08 | Sổ học chuẩn, độc lập với thiết bị và nguồn | P03 | code | T14, T29, T32 |
| R09 | Năng lực theo mức/family/ngày, không theo cấp thú | P03 | code | T05, T06 |
| R10 | Đợt cần dạy lại có đường phục hồi | P03 | code | T06, T17 |
| R11 | FSRS-6 state đủ, một quan sát độc lập/ngày | P04 | code | T29, T41 |
| R12 | Lặp có mục đích và không thưởng lại lỗi cũ | P04 | code | T04, T07, T17, T41 |
| R13 | Ngân sách thời gian gồm phản hồi, không sàn số câu | P05 | code | T08, T09 |
| R14 | Một kế hoạch ngày, mục tiêu không tăng ngầm | P05 | code | T13, T27, T40 |
| R15 | Đạt/có học/chưa học theo rubric đã chốt | P05 | code | T07, T22, T40 |
| R16 | Bộ chọn tất định, fallback không nới quyền/mức | P05 | code | T10, T12, T42 |
| R17 | Giữ chỗ, resume và nộp qua hai client | P05 | code | T13, T28, T43 |
| R18 | Mọi kênh và cờ lùi đang chạy được nối | P06 | code | T42 |
| R19 | Ngoại lệ bài thầy giao/thi thật không mở kho tự động | P06 | code | T01, T02, T42 |
| R20 | Đoàn theo cá nhân, hạn mềm, không phạt timeout như sai | P06 | code | T38 |
| R21 | Trợ giúp qua server, không giả bằng chứng độc lập | P06 | code | T29, T39 |
| R22 | Quỹ core tới tổng220, giá từng loại rõ | P07 | code | T15, T16, T19 |
| R23 | Optional120, một purpose, chống cày liên màn | P07 | code | T16, T17, T18, T39 |
| R24 | Ledger/ví/caps/receipt nguyên tử và retry an toàn | P07 | code | T14, T15, T28, T43 |
| R25 | Ngày VN, sự kiện muộn và embargo | P07 | code | T27, T47 |
| R26 | Hấp thụ200/120/0, cấp10 sớm nhất ngày12 | P08 | code | T21, T22 |
| R27 | Một quyền khiên mỗi21mảnh, first từ21ngày | P08 | code | T23, T24, T25 |
| R28 | Dự trữ400, rèn300, đổi vàng/mua nguyên tử | P08 | code | T25, T26 |
| R29 | Không phạt vắng bằng mất tài sản, giữ kho cũ | P08 | code | T30, T31 |
| R30 | Migration mọi nhánh legacy, rerun và CAS | P08 | code | T31, T45 |
| R31 | Snapshot/correction bằng full replay | P10 | code | T32, T41 |
| R32 | Trải nghiệm ba app, quay lại, tuần và nhắc có điều kiện | P09 | code | T30, T46 |
| R33 | Nút gọi lên bảng, không timer tự gọi | P09 | code | T35 |
| R34 | Giao diện không tràn trên ba app | P09 | code | T36 |
| R35 | Ca/API server chung, cấu hình production hợp lệ | P09 | code | T13, T48 |
| R36 | Hiệu năng có số đo và không đổi tính đúng | P10 | code | T44 |
| R37 | Restore và rollback tương thích bảo toàn giao dịch | P10 | code | T45 |
| R38 | Tích hợp, build, typecheck và kiểm thử không bỏ sót | P10 | code | T42, T48, T50 |
| R39 | Mở/nộp ca trên hai thiết bị và mạng khác thật | P11 | deployment | T37 |
| R40 | Version triển khai và dữ liệu cũ đối chiếu thật | P11 | deployment | T31, T45 |
| R41 | Ba app, hiệu năng/canary/rollback bản phát hành đã xác minh | P11 | deployment | T37, T44, T46 |
| R42 | Hiệu quả học tập được đánh giá đúng dữ liệu và giới hạn | P11 | learning | T49 |

## 3. Tình huống cụ thể

### T01 — Phạm vi từng em

- Gói chịu trách nhiệm: P02; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: A và B cùng lớp; A taught S1,S2; B chỉ S1; câu Q cần S2.
- Kết quả bắt buộc: A có thể nhận Q; B không nhận Q ở mọi kênh tự động, reason NEED_TAUGHT_SCOPE.

### T02 — Đủ tất cả nền

- Gói chịu trách nhiệm: P02; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Q có prerequisites P1,P2; em chỉ taught P1.
- Kết quả bắt buộc: Q bị loại; không dùng OR giữa các nền; teacher assignment override không mở game.

### T03 — Kho thiếu nhãn/thu hồi

- Gói chịu trách nhiệm: P02; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Q1 thiếu skill, Q2 unapproved, Q3 revoked; không còn Q tốt.
- Kết quả bắt buộc: 0 câu, mã lý do đúng; không phát Q xấu để đủ lượt.

### T04 — Bản sao và family

- Gói chịu trách nhiệm: P04; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Q1/Q2 khác qid cùng content_group; Q3 khác content cùng family.
- Kết quả bắt buộc: Q1/Q2 không thành hai thưởng/card/bằng chứng; Q3 chịu family spacing.

### T05 — Không nhảy bậc từ câu dễ

- Gói chịu trách nhiệm: P03; mức: code; phương pháp: unit.
- Dữ liệu/thao tác: 4 câu Biết đúng cùng ngày; thêm fixture 5 family đúng mức 1 qua 2 ngày.
- Kết quả bắt buộc: Fixture đầu chưa xác nhận Vận dụng; fixture sau chỉ xác nhận mức 1 khi đạt 4/5 và nền hợp lệ.

### T06 — Phục hồi sau ba lỗi

- Gói chịu trách nhiệm: P03; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: 3 lỗi độc lập, >=2 family trong 7 ngày; dạy lại; biến thể đúng sau đủ giãn.
- Kết quả bắt buộc: needs_teaching→practicing→recovered; không bị lỗi cũ chặn; stable chỉ sau đúng ngày khác >=24h.

### T07 — Ôn duy trì được đạt

- Gói chịu trách nhiệm: P05; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Core maintenance n=5; độc lập đúng 4, không câu nào từng sai.
- Kết quả bắt buộc: achieved, core entitlement 220, một mảnh; 3/5 chỉ studied.

### T08 — 600 giây không thành 32 phút

- Gói chịu trách nhiệm: P05; mức: code; phương pháp: unit.
- Dữ liệu/thao tác: budget=600; mỗi câu solve=240 feedback=60.
- Kết quả bắt buộc: Tối đa 2 câu, tổng<=600; không ép sàn 4/8; mẫu thời gian ít dùng fallback.

### T09 — Game dùng phần còn lại

- Gói chịu trách nhiệm: P06; mức: code; phương pháp: integration.
- Dữ liệu/thao tác: Plan còn 600 giây; game chuẩn 6 câu nhưng mỗi câu cần 300 giây.
- Kết quả bắt buộc: Tối đa 2 câu; Mom/ôn/game dùng chung tổng tải.

### T10 — Fallback không tăng khó

- Gói chịu trách nhiệm: P05; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: working=0, còn duy nhất câu difficulty=1, không có probe.
- Kết quả bắt buộc: 0 câu hoặc skill taught khác đúng mức; không rút câu 1 để bù.

### T11 — Bảo vệ bản sao BTVN

- Gói chịu trách nhiệm: P02; mức: code; phương pháp: integration.
- Dữ liệu/thao tác: BTVN chưa nộp có Q1; game có Q2 cùng content_group.
- Kết quả bắt buộc: Q2 không phát/lộ lời giải; quyền giáo viên đúng assignment vẫn hoạt động.

### T12 — Cache cũ

- Gói chịu trách nhiệm: P05; mức: code; phương pháp: integration.
- Dữ liệu/thao tác: Cache plan, sau đó revoke scope hoặc bảo vệ content_group trước reserve.
- Kết quả bắt buộc: Server từ chối phần stale, refresh revision; không vượt quyền vì TTL chưa hết.

### T13 — Hai app đồng thời

- Gói chịu trách nhiệm: P05; mức: code; phương pháp: D1+integration.
- Dữ liệu/thao tác: Hai client cùng em mở intent/plan, reserve cùng thời điểm.
- Kết quả bắt buộc: Một plan pool; task được resume hoặc reserve không trùng; không thêm core target.

### T14 — Idempotency ngữ nghĩa

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: D1.
- Dữ liệu/thao tác: Gửi lại cùng request; request khác cùng attempt; cùng key nhưng payload khác.
- Kết quả bắt buộc: Một event/quyền; replay receipt gốc; payload khác trả 409; không đổi đáp án đã chốt.

### T15 — Bù core đồng thời

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: D1.
- Dữ liệu/thao tác: core_paid=136; 20 request completion đồng thời, gồm các key khác nhau.
- Kết quả bắt buộc: Tổng grant=84, core_paid=220, ví chỉ tăng 84, một mảnh/ngày.

### T16 — Trần hai quỹ

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: unit+D1.
- Dữ liệu/thao tác: core_paid=220, optional_paid=120; thêm nhiều task. Fixture khác: optional_paid=117, task giá 10.
- Kết quả bắt buộc: Fixture đầu grant=0; fixture sau grant=3; không nợ 7 sang ngày sau.

### T17 — Không thưởng vì lỗi cũ

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Từng sai 20 ngày trước, đã phục hồi, chưa due; lặp đúng ngày sau.
- Kết quả bắt buộc: Không tự +6 hoặc +20; không mở lại episode từ lịch sử cũ.

### T18 — Một purpose

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: unit+D1.
- Dữ liệu/thao tác: Task primary=repair_complete đồng thời phù hợp transfer/due.
- Kết quả bắt buộc: Tối đa 20 trong quỹ còn lại, không 20+10+6; đổi màn không đổi purpose.

### T19 — Phần II từng ý

- Gói chịu trách nhiệm: P01; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Mức 1, bốn ý, đúng ba ý; policy điểm đề có sẵn.
- Kết quả bắt buộc: Lưu kết quả từng ý; điểm đúng policy đề; core raw=4; không hạ mọi skill vì một ý sai.

### T20 — Sửa đáp án

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: D1+integration.
- Dữ liệu/thao tác: Correction xác nhận đáp án sai; xử lý hai lần, làm projection rebuild.
- Kết quả bắt buộc: Điểm/hồ sơ được sửa; bù dương còn thiếu đúng một lần; không thu hồi tài sản vì lỗi hệ thống.

### T21 — Cấp 10 không sớm

- Gói chịu trách nhiệm: P08; mức: code; phương pháp: unit+D1.
- Dữ liệu/thao tác: Tài khoản mới, earn=340/ngày; thêm compensation lớn ngày 1.
- Kết quả bắt buộc: Ngày 11 invested≤2.200 và level<10; ngày 12 invested=2.400 đủ cấp 10; không nguồn nào vượt 200/ngày.

### T22 — Studied rồi achieved

- Gói chịu trách nhiệm: P08; mức: code; phương pháp: unit+D1.
- Dữ liệu/thao tác: Ví đủ, studied đã hấp thụ 120, sau đó goal hoàn thành.
- Kết quả bắt buộc: Chỉ thêm 80; tổng 200; retry không thêm; ví thiếu chỉ dùng phần có.

### T23 — Mốc 21 ngày

- Gói chịu trách nhiệm: P08; mức: code; phương pháp: unit+D1.
- Dữ liệu/thao tác: Level=10, ngày đạt 20/mảnh=20 rồi ngày đạt 21/mảnh=21.
- Kết quả bắt buộc: Ngày 20 từ chối; ngày 21 nhận một khiên đầu, mảnh=0, ví không trừ.

### T24 — Quà và rèn cùng quyền

- Gói chịu trách nhiệm: P08; mức: code; phương pháp: D1.
- Dữ liệu/thao tác: Ngày đạt 21, level=10, mảnh=21, ví=700; gọi hai adapter đồng thời.
- Kết quả bắt buộc: Một khiên, một claim, mảnh=0, ví=700; không rèn khiên thứ hai bằng cùng mảnh.

### T25 — Khiên tiếp theo

- Gói chịu trách nhiệm: P08; mức: code; phương pháp: unit+D1.
- Dữ liệu/thao tác: Đã nhận khiên đầu, 21 mảnh, ví=700; claim rồi retry.
- Kết quả bắt buộc: Một khiên mới, ví=400, mảnh=0; ví=699 không được claim.

### T26 — Dự trữ và loại tiền

- Gói chịu trách nhiệm: P08; mức: code; phương pháp: D1.
- Dữ liệu/thao tác: Ví=700; hai lệnh đổi 200 đồng thời. Fixture khác: vàng=100, ví=0, mua đồ giá 50 vàng.
- Kết quả bắt buộc: Chỉ một đổi thành công, ví=500; mua bằng vàng sẵn có vẫn hợp lệ, vàng còn 50.

### T27 — 0 giờ và sự kiện muộn

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: unit+D1.
- Dữ liệu/thao tác: Accepted trước 0 giờ nhưng job xử lý sau; offline accepted sau 0 giờ; retry ngày sau.
- Kết quả bắt buộc: Ngày/quỹ theo server accepted lần đầu; không nhân dailyLimit; cùng attempt chỉ đóng góp một ngày.

### T28 — Mất mạng sau commit

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: D1+integration.
- Dữ liệu/thao tác: Cắt HTTP sau batch thành công, outbox chưa xử lý; client retry.
- Kết quả bắt buộc: Receipt cũ trả lại; event/tiền không trùng; outbox phục hồi projection.

### T29 — Gợi ý qua màn khác

- Gói chịu trách nhiệm: P03; mức: code; phương pháp: integration.
- Dữ liệu/thao tác: Server cấp hint ở parent/game; học sinh mở lại ở màn khác và nộp đúng.
- Kết quả bắt buộc: Ghi assisted; raw core=2 nếu hợp lệ; không independent, không FSRS Good hoặc transfer 10.

### T30 — Quay lại không mất tài sản

- Gói chịu trách nhiệm: P09; mức: code; phương pháp: integration+UI.
- Dữ liệu/thao tác: Em nghỉ 3, 7 và 30 ngày; có khiên/đồ/ví.
- Kết quả bắt buộc: Tài sản nguyên; gợi ý 480 giây; không cron trừ khiên; không buộc trả backlog mới được đạt.

### T31 — Migration đầy đủ các nhánh

- Gói chịu trách nhiệm: P08; mức: code; phương pháp: D1.
- Dữ liệu/thao tác: Mỗi hàng ma trận legacy trong tài liệu 03 có fixture; thiếu sổ; hơn 5 khiên; CAS thua; chạy hai lần.
- Kết quả bắt buộc: Giữ tài sản; mảnh spent/spendable/pending đối chiếu; không phát lại first; rerun không tăng tiền.

### T32 — Replay và correction

- Gói chịu trách nhiệm: P03; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: 3.000 events, đảo thứ tự nhận, thêm correction ở quá khứ.
- Kết quả bắt buộc: Projection incremental sau rebuild bằng full replay; không bỏ corrections trước cursor.

### T33 — Số/đơn vị/biên chấm

- Gói chịu trách nhiệm: P01; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Các vector grading trong MAU-KET-QUA; thêm Unicode/scientific/fraction/invalid/unit.
- Kết quả bắt buộc: Tất cả adapter chấm cùng policy; không eval; sai đơn vị không thành đúng vì bỏ chữ; biên 1e-4 đúng quy ước.

### T34 — Snapshot và version

- Gói chịu trách nhiệm: P01; mức: code; phương pháp: integration.
- Dữ liệu/thao tác: Mở câu v1/thứ tự ABCD, đổi kho v2 và đảo đáp án khi đang làm.
- Kết quả bắt buộc: Chấm theo snapshot v1 hoặc thu hồi có reason; không trộn đề cũ/đáp án mới.

### T35 — Gọi lên bảng thủ công

- Gói chịu trách nhiệm: P09; mức: code; phương pháp: UI+integration.
- Dữ liệu/thao tác: Fake clock chạy một giờ ở waiting; message đồng hồ; click rồi double-click.
- Kết quả bắt buộc: Không tự called; click đầu hiện thú/thẻ; click lặp không tạo lượt/reward; không hiện countdown.

### T36 — Không tràn ba app

- Gói chịu trách nhiệm: P09; mức: code; phương pháp: Playwright+visual.
- Dữ liệu/thao tác: Viewport 320/375/768/1.024/1.440; zoom chữ 200%; công thức/bảng/đáp án dài/modal.
- Kết quả bắt buộc: Trang không tràn ngang; nội dung rộng cuộn cục bộ, nút/đáp án không bị cắt.

### T37 — Ca thi mạng khác

- Gói chịu trách nhiệm: P11; mức: deployment; phương pháp: two-device-live.
- Dữ liệu/thao tác: Thầy tạo ca server; máy thứ hai có storage trống; ít nhất một máy qua mạng khác.
- Kết quả bắt buộc: Vào/nộp ca thành công qua HTTPS công khai, auth/CORS đúng, không cần localhost máy thầy.

### T38 — Đoàn vừa mức/vừa thời gian

- Gói chịu trách nhiệm: P06; mức: code; phương pháp: integration+UI.
- Dữ liệu/thao tác: Hai thành viên khác scope/mức/tốc độ; task dài hơn 300 giây; hiệp hết.
- Kết quả bắt buộc: Mỗi em nhận đúng scope/mức; hạn mềm cá nhân; task dài được continuing; timeout không thành sai.

### T39 — Giúp bạn và farm nhiều màn

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: D1+integration.
- Dữ liệu/thao tác: Sáu help-events của một helper, có trùng recipient-task; chuyển màn lấy reward.
- Kết quả bắt buộc: Tối đa 5 lượt hợp lệ, 25 EXP trong quỹ 120; tự giúp/trùng recipient không trả; tổng ngày≤340.

### T40 — Kho nhỏ/mục tiêu không tăng

- Gói chịu trách nhiệm: P05; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: n=2, câu lỗi bị loại; case n=0; người dùng đổi thời gian sau bắt đầu.
- Kết quả bắt buộc: Tính rubric theo revision có lý do; n=0 không tự achieved; phần thêm optional; không gán family giả.

### T41 — FSRS ngày/card

- Gói chịu trách nhiệm: P04; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Good rồi Again cùng ngày; assisted retry; qid bản sao; due bị cooldown cũ.
- Kết quả bắt buộc: Một quan sát/ngày, Again thắng; due đúng snapshot; bản sao chung card; due hợp lệ không bị 30 ngày chặn.

### T42 — Không sót đường gọi

- Gói chịu trách nhiệm: P06; mức: code; phương pháp: integration.
- Dữ liệu/thao tác: Lặp bộ contract scope/difficulty/repeat/budget trên mọi active route/flag trong route map.
- Kết quả bắt buộc: Mọi adapter đi shared engine hoặc ngoại lệ teacher/exam có tên; tắt AI vẫn học được.

### T43 — D1 thất bại từng bước

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: D1.
- Dữ liệu/thao tác: Inject lỗi sau claim/ledger/day/profile/receipt, CAS ảnh hưởng 0 dòng; 20 command đồng thời.
- Kết quả bắt buộc: Tất cả hoặc không; không receipt success thiếu tiền; không ledger orphan; test dùng D1 runtime.

### T44 — Tải và chi phí

- Gói chịu trách nhiệm: P10; mức: code; phương pháp: benchmark.
- Dữ liệu/thao tác: Workload/dataset/warm-cold theo tài liệu 07 và cùng baseline.
- Kết quả bắt buộc: Đạt SLO đã khóa, query/payload đo được; không full replay/N+1; test protection vẫn đạt.

### T45 — Restore/rollback

- Gói chịu trách nhiệm: P10; mức: code; phương pháp: D1+staging-drill.
- Dữ liệu/thao tác: Migration vào DB bản sao, tạo giao dịch mới, bật rollback tương thích.
- Kết quả bắt buộc: Restore đối chiếu đúng; rollback giữ events/tiền/receipts; writer cũ không double-write.

### T46 — Động lực có công học

- Gói chịu trách nhiệm: P09; mức: code; phương pháp: integration+UI.
- Dữ liệu/thao tác: Mục tiêu tuần 5/7, quà đầu tuần, nhắc đã opt-in, achieved, hai app.
- Kết quả bắt buộc: Một quà không sinh tiền mới; dừng nhắc sau đạt; cùng plan/số thưởng; tiến bộ có event tham chiếu.

### T47 — Không lộ điểm trước công bố

- Gói chịu trách nhiệm: P07; mức: code; phương pháp: integration+D1.
- Dữ liệu/thao tác: Nộp đúng/sai trong ca embargoed; đọc ví/skill/due/notification trước và sau release.
- Kết quả bắt buộc: Trước công bố không suy được đáp án từ side effects; sau công bố ghi ngày/quỹ gốc một lần.

### T48 — Toàn dự án và cấu hình

- Gói chịu trách nhiệm: P10; mức: code; phương pháp: build+regression.
- Dữ liệu/thao tác: Build, typecheck client/server, lint, full tests; rà routes API/config.
- Kết quả bắt buộc: Không lỗi mới trong phạm vi; lỗi baseline phân loại; không localhost trong đường production; nơi gọi thật đã kiểm.

### T49 — Đánh giá học tập thật

- Gói chịu trách nhiệm: P11; mức: learning; phương pháp: field-evaluation.
- Dữ liệu/thao tác: Theo kế hoạch 07, dữ liệu đủ cửa sổ 7/21 ngày và đợt thử đã định.
- Kết quả bắt buộc: Báo cáo mẫu/nhóm/bất định/chuyển giao; không lấy shadow hoặc lượt mở app thay học tốt.

### T50 — Version và phương án chưa bật

- Gói chịu trách nhiệm: P10; mức: code; phương pháp: unit+integration.
- Dữ liệu/thao tác: Đọc policy server/client, THAM-SO; rollover/cutover; cờ 365 ngày/FSRS-7.
- Kết quả bắt buộc: Một bộ hằng số; đường cấp hiện hành; FSRS-6; không reset cap; không tự bật nghiên cứu.


## 4. Các thuộc tính nên sinh nhiều dữ liệu để kiểm

1. Với mọi chuỗi event hợp lệ và mọi cách chia retry, core_paid≤220, optional_paid≤120, absorbed_today≤limit của trạng thái ngày; tiền/mảnh không âm.
2. Hoán đổi thứ tự nhận các event có received_at/event_id cố định không đổi kết quả replay cuối; correction được áp theo version.
3. Thay student_id khác scope hoặc tăng protection revision không được giữ câu cache trái quyền.
4. Cùng content_group đổi qid không tăng bằng chứng/card/thưởng; purpose không đổi theo cách gọi adapter.
5. Với mọi budget, tổng taskSeconds≤budget; thiếu kho không mở rộng hard filters.
6. Với mọi lịch tài khoản mới, trước 12 ngày có hấp thụ hợp lệ không đạt cấp 10; trước 21 ngày achieved không có khiên đầu. Compensation lớn không phá hai tính chất này.
7. Mọi command crash ở từng điểm commit giữ toàn bộ hoặc không; retry cùng semantic key không phát sinh delta thứ hai.
8. Migration giữ tài sản có chứng cứ và phân tách pending, chạy lại không đổi quyền đã ghi; rollback không xóa giao dịch sau migration.

Các phép sinh dùng seed được lưu. Cần thử nhiều seed nhưng không dùng một con số test lớn như bảo đảm không còn bug. Biên số, mốc 0 giờ, cấp 120, ví 399/400/699/700, mảnh 20/21/42, kho 4/5/6, n=0/1/5 phải có case cố định.

## 5. Hồ sơ PASS cần điền

Trong TIEN-DO.json, mỗi test có status và evidence array. Mỗi evidence gồm command, executedAt (ISO timestamp), exitCode, sourceFingerprint và artifacts [{path, sha256}]. Đường dẫn artifact tương đối từ gốc repo. Dùng lệnh --fingerprint của script để lấy hash hiện tại; dùng SHA-256 thật của file log. Không tự điền chuỗi giả như pending/todo vào một PASS.

Mỗi requirement PASS phải có sourceRefs trỏ file triển khai thật, notes giải thích đường gọi và toàn bộ tests đã PASS. Requirement deployment/learning có evidence riêng chứng minh môi trường/cửa sổ đo, không chỉ dẫn lại test local. Các trường mapping/template ban đầu rỗng là việc phải làm ở gói tương ứng; không phải mặc định đạt.

Khi code đổi, bằng chứng test cũ có fingerprint khác phải chạy lại hoặc xác minh phạm vi ảnh hưởng theo review có tài liệu. Bộ kiểm nghiêm ở lần chốt CODE_VERIFIED: bằng chứng bắt buộc cần khớp fingerprint cuối. Có thể chạy suite cuối một lần, dùng chung log cho nhiều test khi log chỉ rõ các test đó thực sự chạy.

## 6. Không được hợp thức hóa hoàn thành

- Không sửa required=true thành false, đổi mức code thành research, hoặc xóa test để đủ100%.
- Không sửa expected trong MAU-KET-QUA theo output hiện có. Thay đổi yêu cầu cần chủ dự án quyết định và version mới.
- Không bỏ lỗi tích hợp/SQL vì unit test xanh; không dùng build thành công thay kiểm tính đúng.
- Không gọi PASS cho hồ sơ legacy còn chưa đối chiếu trên bản phát hành. Code xử lý pending đúng vẫn có thể đạt CODE_VERIFIED, còn R40 vẫn chờ.
- Không coi --acceptance qua là đã kiểm ý nghĩa mọi log. Script chỉ kiểm độ đầy đủ/cập nhật/hợp lệ file bằng chứng; cần review nội dung.
