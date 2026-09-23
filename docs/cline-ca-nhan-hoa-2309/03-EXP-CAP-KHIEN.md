# EXP, cấp, khiên và quyền lợi cũ — CNH-1.0

## 1. Các con số có một nguồn

Đọc `THAM-SO.json`; đưa giá trị vào một module policy dùng chung phía server. Client nhận policy/display DTO từ server, không giữ một bảng giá có thể trả tiền độc lập. EXP, vàng, mảnh, số lần dùng hạn mức là số nguyên không âm trong miền safe integer; từ chối NaN, số âm, số thập phân hoặc tràn. Điểm thi có thể là số thập phân nhưng không dùng trực tiếp làm tiền.

`earned_exp` là EXP mới kiếm, `wallet_exp` là ví chưa hấp thụ, `invested_exp` là EXP đã hấp thụ, `gold` là vàng đã đổi. Chúng không phải bốn tên cho cùng số.

## 2. Xếp nguồn vào đúng quỹ

Quỹ được ghi khi server giao nhiệm vụ, không do client chọn lúc nộp. Một event chỉ có một primary reward purpose. Một câu BTVN đồng thời là câu ôn không nhận hai giá câu.

| Nguồn cũ | Cách xử lý v1 |
|---|---|
| Đúng câu ở ôn, Mom, BTVN, game, lên bảng | Nếu task thuộc core: giá core; ngoài core: giá optional hợp lệ |
| Đạt ngày +80; đúng đầu ngày +10; chuỗi ngày | Thay bằng quyền core tới tổng 220; không cộng chồng các khoản cũ |
| Xong lô/bài BTVN, xong Mom | Cập nhật công việc/mục tiêu; không trả thêm ngoài tổng core |
| Ôn “lên bậc” +6 do từng sai | Bỏ điều kiện cũ; dùng due thật hoặc transfer/repair có mã cơ hội |
| Thưởng nấc game, thắng Đoàn, vỡ giáp | Hình ảnh/thành tích giữ; tiền chỉ xuất phát từ công việc hợp lệ trong quỹ |
| Tiếp sức | 5 EXP/sự kiện được xác minh, tối đa 5/ngày, vẫn nằm trong 120 optional |
| Lên bảng đạt/chưa đạt 15/5 | Giá nhiệm vụ đã cấp hoặc xác nhận bước tự làm; không trả thêm 15/5 độc lập |
| Điểm ca ×3 | Không cộng thêm tiền theo tổng điểm. Trả quyền task hợp lệ theo quỹ khi được phép công bố |
| Trở lại +30 | Chặng return hoàn thành tới core 220, không thêm +30 ngoài trần |
| Đường EXP cũ 100/ngày | Chỉ chạy trước cutover của em; sau đó không cùng ghi với v1 |
| Bù lỗi lịch sử | Ledger loại compensation có reference riêng; không tính earned_exp ngày, không vượt hấp thụ |

Không phải mọi câu đúng ngoài plan đều được thưởng. Cần một task/opportunity hợp lệ được server cấp trước khi làm. Luyện tự do không task có thể học bình thường nhưng không tự tạo tiền khi client gửi qid đúng.

## 3. Giá core và công thức trả

### 3.1. Giá một nhiệm vụ lần đầu

Mỗi nhiệm vụ chỉ nhận một khoản raw; hoàn tất nhưng sai được ghi 2 EXP để ghi nhận công. Câu đúng dùng tổng giá sau, **đã gồm 2**, không cộng 2 lần nữa:

| Phần | Biết (0) | Hiểu (1) | Vận dụng (2) |
|---|---:|---:|---:|
| I | 2 | 3 | 5 |
| II — đúng toàn bộ | 3 | 5 | 8 |
| III | 4 | 6 | 10 |

Phần II có k ý đúng trong m ý bắt buộc (thường m=4): `2 + floor((fullCorrectPrice - 2) * k / m)`. Ví dụ mức 1, k=3,m=4 → 4 EXP. Thi vẫn chấm theo scoring policy của đề, không dùng công thức EXP để thay điểm.

Đúng sau đã được hỗ trợ: raw=2; không dùng phần đúng để chứng nhận năng lực. Xem lời giải mà chưa có valid_attempt: raw=0. Retry content_group đã có raw cùng ngày: 0, kể cả đổi qid/màn. Nhiệm vụ bước tự làm do giáo viên xác nhận: raw=2, khóa step_id/ngày. Nhiệm vụ bị nghi vấn còn pending chỉ trả phần chắc chắn hợp lệ; không đánh đồng làm nhanh với gian lận.

### 3.2. Quyền core

```text
raw_core = SUM(raw đủ điều kiện, đã khử trùng)
core_entitlement = achieved ? 220 : min(220, raw_core)
grant_now = max(0, core_entitlement - core_paid)
```

Hoàn thành sau khi đã nhận 136 thì bù 84. Hoàn thành sau 190 thì bù 30. Đã nhận 220 thì bù 0. Tất cả xử lý trong giao dịch có receipt; hai request cùng hoàn tất không cùng trả 84. `core_paid` tăng đúng grant và ví tăng đúng grant trong cùng lần ghi.

Quyền core không tự mở lại khi đổi mục tiêu, chốt lại ngày, đổi thú hoặc thêm một assignment. Đã chạm 220 nhưng chưa achieved vẫn chỉ là studied; tiền và đạt ngày là hai điều khác nhau.

Correction chấm sai phải tính lại **tổng quyền của ngày gốc** theo policy gốc rồi trừ tổng đã trả, gồm cả compensation liên quan đã trả trước. Chỉ bù phần dương còn thiếu. Ví dụ ngày đã được trả core 220 thì sửa một câu từ raw 2 lên raw 5 không bù thêm 3. Nếu correction làm ngày cũ từ studied thành achieved, bù tới 220 và mảnh của ngày đó một lần. Khoản bù lỗi hệ thống đặc biệt ngoài quyền ngày phải có mã quyết định riêng, không suy ra tự động từ chênh raw.

## 4. Giá optional và chống cày

Mỗi task được chọn **một** purpose khi giao. Server không đổi purpose sau khi biết đáp án để lấy mức cao nhất.

| Purpose | Điều kiện | Tổng EXP |
|---|---|---:|
| `due_review` | Tự làm đúng card thực sự due tại lúc giao; không trùng bản sao/ngày | 6 |
| `transfer` | Tự giải đúng content_group chưa làm của family đã luyện; opportunity đã cấp; đúng mức | 10 |
| `repair_complete` | Episode chuyển sang recovered theo 02 | 20 |
| `peer_help` | Help-event được xác minh theo 02; không tự giúp, một người nhận/task chỉ trả một lượt giúp | 5 |
| `consolidation` | Tự làm đúng task hợp lệ chưa được trả, đúng scope/mức, không nằm trong bốn purpose trên | Giá câu đúng trong bảng core |
| `speed_practice`, xem lời giải, retry không độc lập | Có thể ghi thành tích/tập luyện; không đủ điều kiện tiền riêng | 0 |

Phần II optional consolidation: chỉ trả khi đúng toàn bộ để khóa đơn giản v1; vẫn giữ bằng chứng từng ý. Các nhiệm vụ phần II được chia thành ý độc lập phải có giá và task type riêng trước khi giao; không tách sau nộp để nhân tiền.

`grant_optional = min(price, max(0,120-optional_paid))`. Phần vượt trần không nợ sang ngày sau; ledger ghi priced_amount và granted_amount để giải thích. Làm thêm vẫn ghi học tập. Nếu quỹ còn 3 và task đáng 10 thì trả 3, không 10.

Khóa học thuật: student + content_group + learning_day ngăn hai task cùng câu nhận hai giá. Khóa transfer: student + family + difficulty + learning_day ngăn đổi số liên tục cùng family; một cơ hội = một attempt, sai hết cơ hội ngày đó. Khóa repair: episode_id duy nhất suốt đời episode. Khóa help: recipient_task_id + helper_id, cùng ràng buộc tối đa một help được trả/recipient_task; count helper/ngày ≤5.

Nếu một câu transfer đồng thời là bước đóng episode: purpose đã ghi quyết định khoản; nếu purpose=repair_complete thì tổng 20, không 10+20. Không tạo một event “cột mốc” khác để lách khóa này.

## 5. Ngày Việt Nam, công bố điểm và chốt quỹ

- Học và trả tiền dùng `learning_day = VN(first server accepted submission time)`. Gửi lại dùng thời điểm đã lưu, không tính lại ngày.
- Bài nộp server lúc 23:59:59 nhưng job xử lý lúc 00:00:01 vẫn thuộc ngày cũ. Bài offline đến server lần đầu lúc 00:00:01 thuộc ngày mới, dù client khai hôm qua.
- Task/plan cũ qua 0 giờ vẫn chấm theo snapshot. Server liên kết công việc chưa nộp sang plan ngày mới trước khi xét đạt/quỹ; giữ attempt_id, content_group và trợ giúp đã có. Không phát lại đề/lời giải như một cơ hội độc lập mới. Không hoàn thành cả hai ngày từ cùng lần nộp.
- Khi có plan ngày mới đang chạy, việc carry-over có thể thay một task chưa mở cùng mục tiêu/bằng hoặc ít thời gian hơn; nếu không thể thì thành optional theo quyền đã cấp, không tự tăng core target. Server trả rõ reward_bucket cuối trước bước nộp sau khi tải lại; nếu sự kiện đã tới lúc rollover mà client chưa tải lại, chọn quyền core có lợi đã cấp trong phạm vi 220, ghi adjustment, không nhận cả hai quỹ.
- Ngày đã chốt có event server nhận trước hạn nhưng xử lý muộn: mở lại projection để ghi khoản của ngày cũ đúng trần; ví hiện tại nhận phần còn thiếu. Không cho dùng bù hạn mức hấp thụ đã bỏ qua ngày cũ. Mảnh của ngày cũ được bù một lần nếu ngày đó thật sự đạt.
- Thi chưa công bố: lưu grading/evidence nội bộ ở trạng thái embargoed; không lộ đúng/sai qua EXP, bậc, thông báo, due hoặc chênh ví. Đến khi được công bố, materialize quyền theo ngày gốc và trần gốc; không nhân phần tiền hôm nay. Client trước công bố chỉ thấy trạng thái đã nộp/chờ công bố.

## 6. Hấp thụ và đường cấp

Chín thanh: `[120,150,180,220,260,300,350,390,430]`, tổng 2.400 từ cấp 1 đến cấp 10. Sau đó giữ bảng cấp đang dùng theo version hiện tại; không bật đường 365 ngày.

```text
dailyLimit = achieved ? 200 : studied ? 120 : 0
available = max(0, dailyLimit - absorbed_today)
take = min(wallet_exp, available, exp_missing_to_level_120)
```

Thao tác hấp thụ cùng lúc cập nhật wallet, invested/progress/level, absorbed_today và receipt. Khi vượt một thanh, chuyển phần dư sang thanh tiếp theo trong vòng lặp bị chặn ở level 120. Cấp 120: không hấp thụ thêm, ví giữ nguyên. Không chia cho thanh 0. Không thể dùng đổi vàng, quà hoặc admin top-up để tăng level trực tiếp.

Studied đã hấp thụ 120, sau đó achieved: còn 80, không 200. Chưa đủ ví thì chỉ hấp thụ phần có. Thu nhập nhiều không tăng dailyLimit. Ngày dùng UTC+7; mốc 12 là 12 ngày lịch VN có hấp thụ hợp lệ, không khẳng định đã qua 12×24 giờ từ đăng ký.

Mặc định hấp thụ bằng thao tác học sinh. Nếu tính năng tự hấp thụ đã có thì chỉ giữ khi có opt-in và vẫn qua cùng command. Không tự mua/rèn. Không reset absorbed_today khi đổi mùa/cờ/migration.

## 7. Mảnh và khiên

### 7.1. Quyền mới

Mỗi ngày achieved tạo một fragment ledger khóa `(student_id, learning_day, achieved_fragment)`; khi có correction hợp lệ trả lại cùng quyền, không tạo ngày thứ hai. studied không cho mảnh.

Đổi khiên được mô tả bởi một API/command `claim_shield`; các nút quà/rèn chỉ là adapter vào command này.

```text
common = level>=10 AND fragments>=21 AND unused_shields<5
first  = common AND achieved_days>=21 AND first_shield_claimed=false
later  = common AND first_shield_claimed=true AND wallet_exp>=700
```

First: fragments−21, unused+1, first_shield_claimed=true, wallet giữ nguyên. Later: fragments−21, wallet−300, unused+1. Ghi claim_index và receipt duy nhất. Đủ 42 ngày và 42 mảnh mà chưa nhận lần nào có thể nhận lần đầu rồi lần tiếp theo nếu đủ ví; không có luật phải đợi 21 ngày kể từ lần bấm trước. Điều kiện là 21 mảnh chưa tiêu mỗi khiên.

Hai máy gọi quà/rèn ngày 21 chỉ nhận 1 khiên. Số fragment và ngày đạt chỉ lấy từ ledger server. Khi kho đã có 5, không trừ mảnh/tiền; retry sau khi dùng khiên cần request mới nhưng không tái sử dụng quyền đã tiêu.

### 7.2. Khi vắng học

Bỏ mọi cron/luồng giảm khiên chỉ vì vắng hoặc chưa achieved. Chỉ trừ khiên do tác dụng game được người chơi dùng, với usage receipt. Khiên không tự bảo vệ/quy đổi thành ngày đạt hay thêm mảnh.

## 8. Ví, vàng và mua đồ

`spendable_exp=max(0,wallet_exp-400)`. Đổi x EXP sang vàng yêu cầu số nguyên x>0 và x≤spendable_exp; trừ x ví và cộng x vàng cùng giao dịch. Vàng đã sở hữu dùng mua đồ theo bảng giá hiện tại, không bị kiểm lại “ví EXP phải ≥400” nếu mua thuần vàng: dự trữ chỉ bảo vệ hành động tiêu EXP. Không được đổi vàng ngược thành EXP nếu hệ thống chưa có chính sách đó.

Rèn later cần ví≥700. Mua bằng EXP trực tiếp (nếu còn đường cũ) phải đi qua kiểm dự trữ tương đương; ưu tiên gộp thành đổi vàng + mua trong một command nếu UI giữ cách cũ, không để bước đổi thành công mà bước mua lỗi mất quyền lựa chọn.

Hai thao tác đổi 200 từ ví 700 đồng thời: chỉ một được thực hiện, ví cuối 500; không cho cả hai làm ví 300. Retry cùng request giữ kết quả cũ. Item cấp một lần thì có khóa sở hữu; item cho mua nhiều dùng catalog rule hiện có. Mỹ thuật không tác động điểm, bộ lọc, dailyLimit hoặc lịch ôn.

## 9. Chuyển dữ liệu — quy tắc cụ thể

### 9.1. Cutover và bằng chứng

Hiệu lực lúc 00:00 ngày VN kế tiếp sau khi sẵn sàng migration của học sinh. Policy decision lưu `(student_id, effective_at, old_policy, new_policy, migration_id)`. Một event dùng đúng phiên bản theo ngày gốc; retry không đổi version. Không reset hạn mức đã dùng trong ngày.

Snapshot trước chuyển: level, progress, wallet, gold, items, unused_shields, used_shields, fragment_balance, achieved_days, absorbed_today, revision, pending receipts và nguồn sổ. Chạy dry-run, kiểm tổng, rồi CAS. CAS thua thì đọc lại và tính lại, không ghi đè.

V1 không đổi bảng cấp nên giữ level/progress/wallet nguyên giá trị. Không thực hiện công thức hoàn chênh cấp 365 ngày. Item IDs và vàng giữ nguyên. Giữ mọi khiên cũ, kể cả vượt 5; chỉ chặn cấp thêm lúc đang ≥5.

### 9.2. Ma trận khiên cũ

| Dữ liệu chứng minh được | Xử lý |
|---|---|
| Chưa từng nhận, ngày đạt/mảnh có sổ đầy đủ | Map mảnh chưa tiêu sang spendable fragments; first=false; giữ ngày đạt. Đủ điều kiện thì được first theo cùng command |
| Đã từng nhận bất kỳ khiên quà/rèn, còn hoặc đã dùng | first=true. Giữ khiên còn. Chỉ mảnh chứng minh chưa tiêu mới sang spendable |
| Đã nhận quà mốc 21 nhưng quà không trừ mảnh theo luật cũ | Giữ khiên và toàn bộ mảnh chưa tiêu có chứng cứ; first=true. Không hồi tố coi 21 mảnh là đã tiêu nếu luật cũ không tiêu chúng. Em có thể dùng mảnh cũ rèn một khiên tiêu chuẩn theo giá/dự trữ mới; đây là bảo toàn quyền cũ, không phải nhận lại quà first |
| Có số dư mảnh đáng tin nhưng không ghép được quà/rèn | Giữ nguyên trong `legacy_pending_fragments`, không xóa và không tự tiêu. Mảnh phát sinh sau cutover dùng sổ v1 riêng |
| Có khiên còn nhưng thiếu lịch sử nhận | Giữ khiên; first=true vì có bằng chứng đã sở hữu. Khiên đã dùng không biết số lượng thì dùng null, không tự gán 0 |
| Không biết đã từng nhận, không có khiên hiện tại | `first_claim_status=legacy_unresolved`; giữ quyền first chưa rõ trong hồ sơ chờ đối chiếu. Không tự phát lại first. Cho nhận khiên tiêu chuẩn từ 21 mảnh mới +300 EXP khi đủ ví/cấp; quyền first cũ vẫn chờ, không bị xóa bởi thao tác này |
| Khoản pending hoặc sổ/số dư mâu thuẫn | Giữ tài sản snapshot; chưa chuyển quyền chưa rõ sang spendable; tiếp tục học và thu mảnh mới, đưa hồ sơ vào danh sách đối chiếu |

Trong nhánh unresolved, `claim_index` và `first_claim_status` tách riêng: nhận khiên tiêu chuẩn mới không tự quyết định việc đã từng nhận quà đầu. Giáo viên đối chiếu có evidence và `legacy_resolution_id`: nếu chứng minh quyền free còn thiếu, cấp một voucher free theo mốc lịch sử đủ điều kiện, không đụng mảnh mới; nếu đã nhận thì đóng pending. Voucher chỉ cấp một lần và vẫn tôn trọng kho 5. Nếu thiếu bằng chứng mãi, giữ pending; không báo migration toàn bộ đã đối chiếu xong.

Hồ sơ quà + rèn trùng mốc trước đây đã xảy ra không thu hồi khiên/tiền. Khi dựng số dư mảnh từ ledger chỉ trừ những lần **thực sự đã tiêu theo luật cũ** có chứng cứ, đúng một lần; nếu snapshot đã là số dư sau tiêu thì không trừ lại. Xuất bảng: số cũ, số đã tiêu có chứng cứ, số spendable mới, số pending, lý do. Không lấy `achieved_days/21` rồi đoán tất cả lịch sử rèn. Nhóm quyền cũ chuyển tiếp có thể khác nhịp 21 mảnh của tài khoản mới; báo rõ ngoại lệ có migration receipt, không âm thầm thu hẹp quyền để làm số liệu đẹp.

### 9.3. Chuyển hồ sơ học

Sự kiện không biết trợ giúp → unknown_assistance. Có thể phục vụ lịch ôn kế thừa ở trạng thái chất lượng dữ liệu thấp, không dùng xác nhận level mới. Card FSRS lưu đủ state được dựng lại theo chính xác cấu hình hiện hành. Các thiếu nhãn family/taught được báo riêng, không tự gán thông tin để khỏi trống plan.

Migration id duy nhất theo student/version. Chạy lần hai không đổi tài sản/projection đã đúng. Nếu có sự kiện mới, chỉ replay phần mới bằng cursor; không cộng lại số dư mở đầu.

## 10. Mô phỏng chuẩn

Tài khoản mới, ví 0, học achieved mỗi ngày, hấp thụ tối đa, không mua đồ; first nhận ngày 21, later đầu ngày 42 sau thu/hấp thụ:

| Earn/ngày | Ví ngày 12 | Ví ngày 21 | Ví ngày 42 sau rèn | Level 10 | First |
|---|---:|---:|---:|---|---|
| 220 | 240 | 420 | 540 | ngày học 12 | ngày đạt 21 |
| 260 | 720 | 1.260 | 2.220 | ngày học 12 | ngày đạt 21 |
| 340 | 1.680 | 2.940 | 5.580 | ngày học 12 | ngày đạt 21 |

Học thứ Hai–thứ Sáu, bắt đầu thứ Hai: ngày học 12 = ngày lịch 16; ngày đạt 21 = lịch 29; ngày đạt 42 = lịch 58. Không quảng cáo “21 ngày lịch chắc chắn có khiên” cho lịch học 5 ngày/tuần.

`MAU-KET-QUA.json` chứa đầu vào/đầu ra số học. Cline phải nối những vector này vào hàm sản phẩm qua adapter mỏng, không viết lại engine trong adapter chỉ để qua test.
