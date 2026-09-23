# Chấm, cá nhân hóa, thời gian và chọn câu — CNH-1.0

## 1. Chấm và dữ liệu câu

### 1.1. Hợp đồng câu đủ điều kiện

Câu tự động phải có qid, version, content_group, part, đáp án đã duyệt, chính sách chấm, difficulty, skill_ids không rỗng, prerequisite_ids được xác nhận (cho phép [] khi chuyên môn xác nhận không cần nền bổ sung), quality_status=approved. Câu thiếu family vẫn có thể dùng để luyện/ôn sau duyệt; không dùng để chứng nhận chuyển giao/tăng bậc. Không dùng `family_id=qid` để giả vờ đã phân nhóm.

Phần II lưu từng ý: subitem_id, key, skill_ids, prerequisite_ids. Khi chỉ có nhãn tổng, có thể chấm điểm nhưng không gán sai cả câu thành sai tất cả kỹ năng. Ghi bằng chứng năng lực chưa đủ chi tiết; đưa vào danh sách cần gắn nhãn. Bản đề bảo vệ phải kiểm cả qid, version và content_group.

Mọi lần phát câu lưu snapshot bất biến gồm nội dung, thứ tự lựa chọn, đáp án hoặc tham chiếu đáp án phía server, chính sách chấm và mục đích. Đáp án không nằm trong JSON gửi học sinh trước quyền công bố.

### 1.2. Chính sách chấm số v1

Giữ hàm chuẩn hóa dùng chung; không tạo bộ chấm thứ tư. Xem `src/lib/cham-so.ts`, `src/engine/score.ts`, `server/src/btvn-grading.ts` và các nơi gọi hiện hành. Bổ sung policy theo version, không đổi toàn kho bằng một phép thay chuỗi.

| Policy | Quy tắc |
|---|---|
| `numeric-value-v1` | So giá trị sau chuẩn hóa; sai số tuyệt đối **nhỏ hơn** 0,0001. `0,540` = `0.54`; không dùng so chuỗi |
| `numeric-rounded-v1` | Chỉ dùng khi metadata ghi số chữ số thập phân d; so kết quả làm tròn half-away-from-zero bằng số thập phân chính xác |
| `numeric-unit-v1` | Có đơn vị được khai báo; chỉ chấp nhận đơn vị đích hoặc chuyển đổi nằm trong bảng đơn vị của policy |
| `literal-v1` | Câu mà ký hiệu/chữ số có nghĩa là mục tiêu: danh sách biểu diễn chấp nhận được do thầy duyệt; không tự bật cho mọi câu số |

Phần III cũ không có policy: chuyển sang `numeric-value-v1` theo chủ trương dùng chung hiện tại. Nếu câu nêu đơn vị nhưng metadata không đủ để xác minh, đánh dấu cần duyệt, không suy rằng mọi chuỗi có cùng số đều đúng. Câu đang làm dùng snapshot/policy đã cấp; câu xác nhận đáp án lỗi được xử lý correction.

Chuẩn hóa: Unicode NFKC, dấu trừ Unicode, chữ số toàn chiều rộng, dấu phẩy thập phân, khoảng trắng Unicode; số khoa học như `2,5×10^-3`; dấu chấm kết câu sau số hợp lệ. Parser phải nhận toàn bộ chuỗi; không `parseFloat('12abc') → 12`. Cho phép phân số a/b khi policy cho phép, b≠0. Không dùng eval hoặc Function cho biểu thức. Không tự xóa mọi chữ/đơn vị để lấy số. Các biểu thức phức tạp ngoài grammar trả unsupported-format, giữ bài để sửa nhập, không ghi là sai kiến thức trước khi có đáp án hợp lệ.

So sánh biên thập phân phải chính xác theo giá trị biểu diễn: chênh đúng 0,0001 bị loại. Dùng số thập phân/rational có kiểm soát hoặc cách so đã được kiểm chứng; không để sai số nhị phân khiến `1.0001` so với `1` thành đúng. Input unsupported-format trả lỗi validation 422, chưa tiêu attempt và chưa tạo event sai; đáp án hợp lệ nhưng sai giá trị/đơn vị mới được ghi sai.

Điểm Phần I/II/III giữ scoring policy của đề. Với Phần II, kết quả từng ý được lưu dù điểm toàn câu dùng quy tắc không tuyến tính. `true/false`, mã chọn và thứ tự đảo đáp án được giải qua snapshot server, không qua thứ tự hiện tại trong kho.

### 1.3. Sửa điểm

Teacher xác nhận lỗi tạo correction_id liên kết event_id gốc, version chấm cũ/mới, lý do và tác giả. Dựng lại trạng thái chịu tác động. Thêm khoản bù dương còn thiếu đúng một lần; lỗi hệ thống không tự thu hồi EXP/khiên đã tiêu. Không để cùng correction chạy lại tạo hai khoản. Với gian lận xác minh cần quy trình riêng, không gộp vào sửa đáp án.

## 2. Phạm vi học cá nhân

Nguồn mở kỹ năng: xác nhận của giáo viên cho đúng em; xác nhận học bù; dữ liệu bài học/đề đã công bố có bằng chứng độc lập được chính sách nhập cho phép. V1 **không** tự mở toàn kỹ năng chỉ vì gặp một câu hoặc đúng một câu trắc nghiệm. Import chỉ đánh dấu `encountered`; giáo viên xác nhận `taught` trước khi mở tự động. Không lấy membership lớp làm taught.

Trạng thái mỗi học sinh/kỹ năng: `unknown`, `encountered`, `taught`, `revoked`; nguồn bằng chứng và revision bắt buộc. Năng lực là bảng khác; một em taught vẫn có thể cần dạy lại.

```text
eligibleScope(q, student) =
  q.approved
  AND every(q.skill_ids, state == taught)
  AND every(q.prerequisite_ids, state == taught)
  AND NOT protected(q.qid, q.version, q.content_group)
```

Override giáo viên chỉ thuộc bài giáo viên chủ động giao, ghi teacher_id, assignment_id và lý do; không ghi taught ngầm. Bài đang bảo vệ được phát trong đúng bài đó, không có lời giải cho đến khi có quyền. Luyện đề toàn chương trình cần quyền `full_curriculum_practice` do server xác nhận; checkbox tự khai không cấp quyền.

Học sinh mới: working_level=0 trong phần taught, chẩn đoán tối đa 4 câu đầu, rồi tối đa 2 câu bổ sung ở lần sau nếu cần và đủ thời gian. Không có taught thì trả `NEED_TAUGHT_SCOPE`; vẫn truy cập được bài giáo viên giao. Không mở kho lớp làm fallback.

## 3. Bằng chứng năng lực

### 3.1. Một đơn vị bằng chứng

Lấy câu/ý đã chấm có skill mapping được duyệt. Một skill × difficulty × family × learning_day chỉ lấy **lần độc lập đầu tiên**, không đổi một lần sai thành đúng bằng retry cùng family. Câu nhiều kỹ năng chỉ cập nhật kết quả cho kỹ năng được ánh xạ rõ; không nhân trọng lượng bằng số nhãn. Bản sao không tính thêm. Bằng chứng assisted/unknown-assistance được giữ cho hỗ trợ, không vào mẫu tăng bậc.

Tính trên cửa sổ 30 ngày VN gần nhất theo server time. Sắp `(received_at, event_id)` tăng dần để replay ổn định. `recent5` là năm family khác nhau có bằng chứng gần nhất ở đúng skill và đúng difficulty; với mỗi family lấy bằng chứng ngày gần nhất trong cửa sổ. Ghi event_id đã chọn để giải thích.

### 3.2. Bậc, độ tin và thăm dò

1. `validated_level=null` lúc mới; không hiển thị null thành “không biết gì”. `working_level=0` hoặc mức teacher explicitly xác nhận.
2. Xác nhận mức d khi có ≥5 family ở chính mức d, bằng chứng qua ≥2 ngày VN, ít nhất 4/5 recent5 đúng, không có đợt cần dạy lại đang mở ở skill hoặc nền của câu. Mức 2 chỉ xác nhận bằng dữ liệu mức 2.
3. Mở probe d+1 khi d đã đủ tiêu chí trên; tối đa một probe cho skill/ngày và phải có người học chọn thử thách. Nếu chưa có family đã duyệt hoặc hết ngân sách thì không probe.
4. Probe độc lập đúng cho phép working_level=d+1 ở buổi sau, chưa xác nhận validated_level mới. Sai probe giữ working_level; không làm mất đạt ngày vì probe tự chọn.
5. `confidence = min(family_count/5, 1) × min(distinct_days/2, 1)` với family_count là số family trong cửa sổ ở mức đang đánh giá. Đây là **độ đủ bằng chứng**, không phải xác suất làm đúng; UI gọi đúng tên.
6. Bằng chứng quá 30 ngày: giữ mức đã từng xác nhận cùng `last_validated_at`, nhưng đánh dấu cần kiểm lại; không xóa thành tích. Trong luyện tự động, dùng min(working_level, mức gần nhất có bằng chứng còn hạn); nếu không có thì bắt đầu một mức thấp hơn, tối thiểu 0, để chẩn đoán lại.

Không dùng Beta–Binomial/IRT để tăng mức trong v1. Các tỷ lệ 80–90% chỉ là mục tiêu đo, chưa là xác suất do code tự bịa.

### 3.3. Đợt cần hỗ trợ và phục hồi

Đếm lỗi trên ba cơ hội độc lập gần nhất ở cùng skill trong 7 ngày, khác content_group; ít nhất hai family đã xác minh. Ba lỗi đó phải chưa có một lần tự làm đúng biến thể mới ở mức phù hợp ở giữa. Đủ điều kiện mở `repair_episode`, tối đa một episode mở/skill. Những lỗi cũ đã thuộc episode đóng không được mở lại cùng episode.

Sau **hai câu chính liên tiếp sai trong lượt**, đổi phần chưa mở sang mức nền thấp hơn một bậc (min 0), thêm hướng dẫn; không hạ validated_level. Bỏ trống vì mạng/hết giờ không là sai.

Episode: `needs_teaching → practicing → recovered → stable`.

- needs_teaching: ba lỗi độc lập theo quy tắc trên.
- practicing: hoàn thành bài mẫu hoặc giáo viên xác nhận đã hướng dẫn.
- recovered: tự làm đúng một biến thể không trùng content_group đã xem lời giải, cùng kỹ năng ở working_level đã điều chỉnh; cách lần hướng dẫn ≥2 nhiệm vụ khác hoàn tất **hoặc** ≥300 giây hoạt động hợp lệ. Nếu buổi không còn thời gian, hẹn buổi khác.
- stable: có thêm một lần độc lập đúng ở ngày khác, cách recovered ≥24 giờ, cùng mức hoặc cao hơn, không phải bản sao. Kho không đủ thì giữ recovered, không chặn học, không giả stable.

Hết needs_teaching ngay khi recovered; lịch ôn vẫn tiếp tục. Reward phục hồi trả một lần tại recovered, không trả thêm cho stable. Lỗi mới sau recovered tạo episode mới chỉ khi lại thỏa quy tắc; không phát thưởng chỉ vì cờ “từng sai” còn true.

## 4. Lịch nhớ và chống lặp

### 4.1. FSRS và khóa trí nhớ

Giữ cấu hình tại 01. Mỗi card gắn học sinh × content_group × memory_version. Bản sao nguyên nội dung dùng chung card. Đổi đáp án/nội dung có ý nghĩa tạo memory_version mới; thay lỗi chính tả đã duyệt là tương đương có thể giữ card qua mapping.

V1 vẫn gộp tối đa một quan sát độc lập mỗi card/ngày VN. Các quan sát độc lập trong ngày được dựng từ state đầu ngày; nếu có sai hợp lệ thì Again thắng, chỉ đúng thì Good. Lần làm lại assisted không thêm Good và không kéo mốc xa. Thiếu trả lời không cập nhật card. Không suy Easy/Hard từ tốc độ.

Lưu đủ Card và dữ liệu gộp đầu ngày đang có trong `LichOnFsrs`, thời điểm gốc, phiên bản thư viện/cấu hình, cursor. Replay phải cho cùng due ở dữ liệu kiểm thử đã khóa. Không chỉ lưu một cột due rồi gọi đó là full state.

### 4.2. Thứ tự ưu tiên quy tắc lặp

1. An toàn nội dung, phạm vi và quyền công bố luôn áp dụng.
2. Đã được cấp trong nhiệm vụ đang làm thì trả lại cùng task, không giao một bản khác ở màn khác.
3. Cùng content_group đã trả lời hôm nay bị chặn, trừ task `repair_retry` được server tạo rõ. Retry đó không nhận lại EXP câu và không nâng FSRS.
4. Card đã đến hạn (`due <= now`) được ôn; bỏ các cooldown 3/14/30 ngày trái lịch. “Đến hạn” không vượt được quy tắc 1–3.
5. Câu chưa đến hạn không dùng nguyên văn để lấp số. Một biến thể khác content_group có thể dùng cho transfer/consolidation, theo family và mục tiêu.
6. Trong một lượt tối đa 6 câu: mỗi family tối đa 1 câu thường. Chỉ repair có thể 2, và giữa hai câu phải có ≥2 nhiệm vụ khác hoặc ≥300 giây hoạt động. Không có family: không lấy nhiều hơn 1 câu chưa gán family trong một lượt.
7. Family vừa làm được nghỉ tối thiểu 1 ngày VN đối với consolidation mới; ngoại lệ: card đến hạn, repair có mục đích, bài giáo viên giao và probe tự chọn. Mỗi ngoại lệ phải có `repeat_reason`.
8. Không đủ câu: rút ngắn, đổi sang skill đã học khác trong mục tiêu, hoặc dừng. Không giảm các bảo vệ để đủ lượt.

Không cam kết mọi buổi đều mới; UI phân biệt “ôn để nhớ” và “biến thể luyện cách giải”. Đổi qid hoặc đảo lựa chọn không được ghi là biến thể mới.

## 5. Ước lượng thời gian

### 5.1. Công thức v1 có thể tính lại

```text
baseSeconds(I,d)   = [75, 105, 150][d]
baseSeconds(II,d)  = [150, 210, 300][d]   # toàn bộ bốn ý
baseSeconds(III,d) = [120, 180, 240][d]
readingExtra      = min(120, max(0, ceil((visibleChars - 300) / 120)) * 10)
mediaExtra        = min(90, 30 * tableOrFigureCount)
base              = baseSeconds + readingExtra + mediaExtra
```

Lấy 20 lần gần nhất trong 30 ngày, cùng part và difficulty, độc lập, đã nộp, không gián đoạn; thời gian hợp lệ 10–900 giây. Với n<5, factor=1. Với n≥5, factor=clamp(median(activeSeconds/base), 0,75, 2). Không dùng mẫu sai định dạng/bỏ tab làm thời gian giải.

```text
solveSeconds = ceil(base × factor)
feedbackSeconds = max(30, ceil(solveSeconds × 0,25))
taskSeconds = solveSeconds + feedbackSeconds
```

Nếu task là chữa lỗi có bài mẫu: cộng 90 giây bài mẫu; nếu có biến thể kiểm tự làm thì cộng taskSeconds của biến thể riêng. Phần II tách ý chỉ khi nội dung có thể tách độc lập đã được giáo viên duyệt; không tự chia 300 giây cho 4 bất chấp đề chung.

Ngày có thời gian tương tác thực tế ngắn hơn dự kiến không làm giảm công; số thực dùng để cập nhật dự báo. Active time dùng heartbeat/visibility để ước lượng và có giới hạn phía server; không phải chứng cứ chắc chắn về sự chăm chỉ.

### 5.2. Ràng buộc kế hoạch

Tổng taskSeconds của nhiệm vụ tự động đã chốt ≤ budgetSeconds. Không có sàn 4/8 câu. Ví dụ budget=600, solve=240, feedback=60 ⇒ tối đa 2 câu, tổng 600.

Mỗi ngày một plan theo student/day/policy, nhiều task có thể hiển thị ở các màn. Server giữ một danh sách work units chung; “4 Mom +3 ôn +6 game” không tạo 13 việc nếu ngân sách chỉ chứa 8.

Ưu tiên chặng BTVN giáo viên giao đến hạn, rồi repair đang mở, ôn đến hạn, consolidation/transfer. Từng mức ưu tiên vẫn phải vừa thời gian. BTVN vượt tải còn nguyên assignment/hạn gốc; plan ghi deferred_count và over_budget_seconds để thầy thấy. Phụ huynh thêm bài chủ động có nguồn riêng; muốn tăng ngân sách phải thao tác rõ và tạo revision, không tự cộng thêm lượt game.

Chốt mục tiêu và task đầu buổi. Điều chỉnh phần chưa mở có thể thay bằng nhiệm vụ bằng/ít thời gian hơn hoặc loại câu bị thu hồi. Không tăng target sau khi em gần xong. Người học chủ động đổi ngân sách sau bắt đầu chỉ thêm việc **optional**, không làm tăng điều kiện đạt của core đã chốt.

## 6. Đạt ngày — quy tắc đủ cụ thể để kiểm thử

Plan chỉ có **một mục tiêu core chính** có role, required_task_ids, min_success và policy version. Các việc còn lại có role hỗ trợ, không tự thêm điều kiện đạt. Số n dưới đây là số câu/đơn vị có cơ hội độc lập trong required_task_ids, không đếm bài mẫu, retry, probe hoặc câu tranh chấp bị loại.

| Role core | Điều kiện hoàn thành đã khóa lúc giao |
|---|---|
| `maintenance` | Nộp đủ n nhiệm vụ; độc lập đúng ≥ceil(0,8n). Câu đúng vốn chưa từng sai vẫn tính |
| `consolidation` | Nộp đủ n; độc lập đúng ≥ceil(0,6n); ít nhất 1 family xác minh nếu kho có family |
| `repair` | Hoàn thành hướng dẫn cần thiết và một kiểm tra biến thể độc lập đúng theo mục 3.3; task kiểm tra phải được dành thời gian trong plan |
| `homework_slice` | Nộp đủ chặng đã chốt, và ít nhất 1 đơn vị độc lập đúng hoặc 1 bước tự làm do giáo viên xác nhận; không bắt nộp cả bài quá tải mới được đạt |
| `return` | Nộp đủ chặng ngắn đã chốt và ≥1 đơn vị độc lập đúng; không cần trả hết backlog |

Chọn role: return nếu có gián đoạn ≥3 ngày và người học nhận chặng quay lại; nếu không thì homework_slice khi có BTVN đến hạn đủ nguồn; tiếp repair khi có episode và đủ ngân sách; tiếp maintenance nếu có card due; cuối consolidation. Với repair không đủ chỗ cho bài mẫu+kiểm tra, chuyển mục tiêu sang bước nền độc lập ngắn hơn nếu kho có; không tạo mục tiêu bất khả thi.

Một bước giáo viên xác nhận cần step_id, skill_id, rubric_id, teacher_id, event_id; không có nút “cho đạt tất cả” không lưu chứng cứ. Lần làm assisted được ghi hoàn tất việc nhưng không vào số độc lập đúng.

Ngày: `achieved` nếu role hoàn thành; `studied` nếu chưa hoàn thành nhưng có ≥1 verified_learning; `none` nếu chưa có. Một trường hợp đang chờ xác minh được giữ nhãn `pending_review` riêng, không tự suy gian lận và không tính bằng chứng độc lập chưa được xác minh. Công hợp lệ còn lại vẫn được tính bình thường.

Nhiệm vụ lỗi được loại khỏi mẫu số bằng revision có lý do. n mới=0 và không còn bằng chứng học thì không cấp ngày miễn phí; trả `NO_VALID_CORE_TASKS`, tạo chặng thay thế nếu vừa thời gian hoặc chờ thầy. Nếu trước đó đã achieved thì giữ quyền đã kiếm vì lỗi hệ thống, ghi adjustment; không lấy lại mảnh.

Điều kiện ngày chỉ phụ thuộc mục tiêu đã chốt, không phụ thuộc đang có bao nhiêu câu quá hạn ngoài core. Thi thử và probe optional không làm mất achieved.

## 7. Bộ chọn chung

### 7.1. Pipeline và tính tất định

```text
metadata candidates
→ quality/version/servable
→ scope + all prerequisites
→ protected content + permissions
→ active reservations + today's attempts
→ role-specific difficulty cap
→ repeat/family rules
→ deterministic priority
→ fit time budget
→ atomic reserve
→ hydrate only selected content
```

Thứ tự hard filter không được thay bằng điểm thưởng. Năng lực câu nhiều skill bị chặn nếu difficulty > min(working_level của các skill), trừ probe đúng quyền đã cấp, tối đa +1 và không quá 2. Parent fallback dùng cùng trần này. Câu teacher-pinned vào đúng assignment có ngoại lệ được ghi, không lan sang game.

### 7.2. Điểm số v1 đã định nghĩa

Trong mỗi nhóm ưu tiên ở mục 5.2, tính:

- repairNeed=1 nếu câu phục vụ episode đang needs_teaching/practicing, 0,5 nếu recovered chưa stable, còn lại 0.
- reviewNeed=clamp((now−due)/max(intervalSeconds,86400),0,1) khi due, cộng nền 0,5 rồi chia 1,5; câu chưa due=0. intervalSeconds là khoảng giữa lần review trước và due, tối thiểu 86400.
- transferValue=1 nếu có cơ hội transfer do server cấp và content_group mới, family đã biết; 0,5 nếu family đã duyệt nhưng em chưa gặp; còn lại 0. Family hoàn toàn mới không được gọi là bằng chứng chuyển giao trong cùng family.
- fit=1 khi difficulty=working_level; 0,8 khi thấp hơn một mức; 0,6 khi thấp hơn hai mức; probe hợp lệ=0,5.
- coverage=1/(1+ số task cùng skill đã hoàn tất hoặc giữ chỗ trong plan hôm nay).
- fatigue=0,2 nếu cùng part với hai task liền trước, cộng 0,2 nếu solveSeconds>180 và task trước cũng >180; tối đa 0,4.

```text
score = 0,30*repairNeed + 0,25*reviewNeed + 0,20*transferValue
      + 0,15*fit + 0,10*coverage - fatigue
```

Trùng content/family vượt giới hạn đã bị loại cứng; không thêm “điểm mới lạ” để chuộc lại. Sắp score giảm dần, rồi hash SHA-256 của `student_id|day|plan_version|qid|question_version` tăng theo byte, rồi qid tăng. Chọn greedy từng câu vừa remainingSeconds, kiểm lại coverage/family sau mỗi lựa chọn; không chia score cho thời gian trong v1 để tránh thiên vị toàn câu ngắn. Không dùng Math.random.

Gói <=6 câu, có thể ít hơn. Nếu thiếu: cùng skill thấp hơn hợp mục tiêu → skill đã taught khác có trong plan → ngắn lượt. Trả reason cụ thể: `NEED_TAUGHT_SCOPE`, `NO_APPROVED_ITEMS`, `PROTECTED_ITEMS`, `DIFFICULTY_LIMIT`, `REPEAT_LIMIT`, `BUDGET_EXHAUSTED`, `RESERVATION_CONFLICT`. Có số ứng viên bị loại theo nguyên nhân cho giáo viên, không lộ qid đề bảo vệ cho học sinh.

## 8. Đoàn Hộ Tống

- Câu mỗi thành viên đi qua selector trên, mục đích phần lớn maintenance/consolidation; game level không tham gia trần difficulty hoặc base time.
- Bình thường dùng hạn mềm = ceil(1,25 × solveSeconds), tối thiểu 60 giây; không chặn cứng ở 180 giây nếu dự báo cá nhân cần lâu hơn. Không hiển thị 30 giây như thời hạn mặc định cho mọi câu.
- Đồng hồ đội dùng max soft time của các nhiệm vụ đang mở, tối đa 300 giây/hiệp. Nếu task cần >300 giây, giao vai cá nhân dài có thể hoàn tất sau hiệp; không ghi timeout thành sai, không phát lại cùng câu cho em.
- Khi hiệp chuyển, task cá nhân chuyển `continuing`, vẫn nộp được đến hạn session (24 giờ từ lúc phát); điểm đóng góp đội sau kết hiệp không sửa thứ hạng đã chốt, nhưng công học và thưởng hợp lệ vẫn ghi theo quy tắc ngày lúc nộp.
- Hết session mà chưa nộp là `expired_unanswered`, không cập nhật lỗi học thuật. Mở lại cần một attempt được server kiểm phạm vi mới.
- Hai lỗi chính liên tiếp: vai hỗ trợ/bài nền như mục 3.3. Không loại thành viên ra ngồi chờ.
- Team question dùng giao scope taught của toàn bộ người phải trả lời. Không có giao hợp lệ thì mỗi thành viên làm nhiệm vụ riêng đóng góp cùng mục tiêu.
- Hỗ trợ đồng đội: người nhận yêu cầu hỗ trợ, server xác nhận một người giúp; tối đa một help-event được trả cho mỗi recipient-task, không tự giúp mình. Người nhận được gắn assisted ngay khi server cấp nội dung hỗ trợ. Kết quả đúng sau đó không là independent.
- Timed mode tự chọn dùng thời hạn công khai nhưng timeout chỉ là kết quả tốc độ. Không lấy timeout thay đáp án sai để hạ bậc/FSRS.

## 9. Trải nghiệm ba app và lên bảng

Học sinh thấy mục tiêu, thời gian ước tính, tiến bộ có bằng chứng, điểm kết thúc và tùy chọn học thêm. Phụ huynh thấy đúng plan và số thưởng đó, không có chỉ tiêu song song. Giáo viên thấy lý do rút câu, nguồn thiếu, các episode và tải BTVN; có quyền xác nhận taught và xử lý câu lỗi.

Chuỗi tuần là 5 ngày có học trong 7 ngày lịch VN, hiển thị tiến độ, không phát EXP ngoài quỹ. Mốc đầu 5 ngày có học phát một phụ kiện khởi đầu đã có trong catalog với giá 0 qua một receipt; chọn ID thực trong P09, không sinh loại tiền mới. Nghỉ không reset tổng thành tích/mảnh. Nhắc học chỉ khi người dùng đã bật khung giờ, tối đa một nhắc học/ngày; achieved thì hủy nhắc còn chờ. Không tự gửi tin ngoài hệ thống để thử.

Lên bảng: trạng thái `waiting → called` chỉ bởi click “Lên bảng”. Click đầu hiển thị thần thú và thẻ tên như hiện tại; click lặp cùng lượt không tạo lượt/phần thưởng mới. Không có countdown, setTimeout/setInterval, elapsed-time, scheduler hoặc message từ đồng hồ kích hoạt called. Timer kỹ thuật phục vụ heartbeat/đồng bộ không được thay đổi trạng thái called. Chuyển sang lượt mới có thể về waiting nhưng không tự gọi. Giữ các dữ liệu trình chiếu và phím tắt đã có chỉ khi chúng là thao tác người dùng rõ ràng.

Kiểm viewport 320/375/768/1.024/1.440 px: trang không tràn ngang; bảng/công thức rộng có vùng cuộn cục bộ; modal và nút chính trong vùng thao tác; zoom chữ 200%; không chữa bằng cách ẩn cắt đáp án. Ca thi phải dùng API HTTPS dùng chung, không dựa localhost/IndexedDB của máy giáo viên để thiết bị khác truy cập. Chi tiết nghiệm thu T33–T40.
