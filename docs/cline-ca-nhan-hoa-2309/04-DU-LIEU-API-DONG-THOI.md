# Hợp đồng dữ liệu, API và giao dịch — CNH-1.0

## 1. Quy tắc tích hợp

Repo đang có Worker/D1, ledger `su-kien-hoc`, `exp_so`, profile JSON kèm revision. Tái sử dụng chức năng phù hợp, không tạo hai nguồn số dư. Tên bên dưới là hợp đồng logic bắt buộc. P00/P01 phải lập `evidence/SCHEMA-MAPPING.md`: tên logic → bảng/cột/type thật → migration cần thêm. Đổi tên vật lý để khớp repo được phép; thay nghĩa, khóa duy nhất hoặc transaction boundary thì không.

API mới có thể được gắn vào route hiện có. Trước khi sửa caller, xuất `evidence/ROUTE-MAPPING.md` với method/path hiện hành, auth, request/response và handler. Không đoán tên endpoint từ file. Tất cả route ghi điểm/tiền/giữ chỗ cũ phải được nối hoặc đóng sau cutover.

## 2. Kiểu dữ liệu logic

```ts
type Difficulty = 0 | 1 | 2;
type DayState = 'none' | 'studied' | 'achieved';
type Bucket = 'core' | 'optional';
type Purpose = 'maintenance' | 'consolidation' | 'repair'
  | 'homework_slice' | 'return' | 'probe' | 'due_review'
  | 'transfer' | 'repair_complete' | 'peer_help' | 'speed_practice';

interface PolicyRef {
  version: 'CNH-1.0';
  curriculumRevision: number;
  bankRevision: number;
  protectionRevision: number;
  learnerRevision: number;
}
interface AssignmentSnapshot {
  taskId: string; attemptId: string; studentId: string;
  qid: string; questionVersion: string; contentGroup: string;
  familyId: string | null; skillIds: string[];
  difficulty: Difficulty; part: 'I' | 'II' | 'III';
  purpose: Purpose; bucket: Bucket;
  planId: string; planRevision: number; policy: PolicyRef;
  issuedAt: number; expiresAt: number; expectedSeconds: number;
  // key, key-order mapping và gradingPolicy chỉ phía server
}
interface LearningEvent {
  eventId: string; attemptId: string; studentId: string;
  receivedAt: number; learningDay: string; source: string;
  snapshotId: string; answerPayload: unknown;
  subitemResults: Array<{id: string; correct: boolean; skillIds: string[]}>;
  correct: boolean; assistance: 'none' | 'assisted' | 'unknown';
  activeSeconds: number | null;
  visibility: 'embargoed' | 'released';
  correctionOf: string | null; policyVersion: string;
}
interface EconomyReceipt {
  receiptId: string; requestId: string; commandType: string;
  policyVersion: string; learningDay: string; learnerRevision: number;
  coreGranted: number; optionalGranted: number; compensation: number;
  absorbed: number; fragmentDelta: number; shieldDelta: number;
  walletAfter: number; goldAfter: number;
}
```

Code thật phải có runtime validation, không ép `as` để hợp thức hóa JSON. Các thời điểm server là epoch milliseconds; ngày có định dạng chuẩn. Client DTO không chứa đáp án, dữ liệu học sinh khác hoặc nguyên nhân lộ nguồn đề bảo vệ. Auth phải suy studentId từ phiên được phép; parent chỉ thao tác đúng con đã liên kết, teacher đúng phạm vi được cấp.

## 3. Bảng và khóa tối thiểu

| Tên logic | Dữ liệu cần lưu | Khóa/chỉ mục bắt buộc |
|---|---|---|
| learner_scope | state, evidence, revision | PK student+skill; index student+state |
| learning_event | event bất biến, payload hash, correction | UNIQUE attempt+event_kind+correction_version; index student+received_at+event_id |
| memory_snapshot | Card, state đầu ngày, model version, cursor | PK student+content_group+memory_version; index student+due |
| skill_snapshot | working/validated/confidence, evidence refs, episode | PK student+skill+policy; cursor/revision |
| daily_plan | goal, rubric, tasks, budget, policy, revision | UNIQUE student+day+policy; index student+day |
| task_snapshot | câu/mục đích immutable, hints/reveal, status | PK task; UNIQUE attempt; index student+state |
| active_reservation | task, content_group, lease/revision | UNIQUE student+content_group với giữ chỗ đang hiệu lực |
| day_account | core_paid, optional_paid, absorbed, state | PK student+learning_day; 0≤core≤220, 0≤optional≤120 |
| reward_ledger | source/event/purpose, priced/granted, bucket | UNIQUE semantic_reward_key; index student+day |
| shield_claim | claim_index, cost, fragments, migrated ref | UNIQUE student+claim_index; UNIQUE legacy_resolution_id khi có |
| fragment_ledger | ngày hoặc adjustment, delta, reference | UNIQUE student+day+earned; UNIQUE adjustment_id |
| command_receipt | request hash, execution id, response, commit version | UNIQUE student+command_type+request_id |
| outbox | event, projection/job, cursor, attempts | UNIQUE source_event+job_kind+version; index state+retry_at |
| migration_receipt | before/after, source rev, applied rev, unresolved | UNIQUE student+migration_version |

Nếu D1 không phù hợp unique partial index cho active reservation, dùng bảng riêng chỉ chứa reservation active; lịch sử nằm ở task_snapshot. Lease=15 phút và heartbeat gia hạn khi mở; hết lease không biến task đã phát thành câu mới được thưởng. Task đã trả lời vẫn nằm trong lịch sử anti-repeat; task chưa hết session có thể được resume cùng attempt trên thiết bị khác. Lease chỉ quản lý quyền giữ của client; trạng thái issued/continuing chưa hết session vẫn ngăn phát content_group đó thành attempt khác. Client mới giành lease phải tiếp tục task cũ.

Không thêm bảng ví thứ hai. Nếu giữ `game_v2_profile.json` làm ví authoritative thì mọi cập nhật tiền/cấp/khiên chỉ qua một module command/CAS. Snapshot học thuật có thể cập nhật bất đồng bộ, nhưng giao câu cần biết projection đang tới cursor nào và bảo vệ mới nhất.

## 4. Hợp đồng các lệnh

### 4.1. Lấy kế hoạch / chọn lượt

Input: authenticated student, mode, optional requestedSeconds, request_id, known_revision. Server xác định day, policy, scope, caps. Output:

```text
plan_id, revision, day, policy_version, goal/rubric,
budget_seconds, planned_seconds, completed_seconds_estimate,
tasks[], shortfall{count,reasons[]}, learner_state, economy_display
```

GET thuần đọc không được cộng tiền. Nếu cần tạo plan/giữ chỗ dùng command POST rõ. Retry cùng command trả cùng plan/tasks/receipt; mở màn khác cùng intent có thể trả plan hiện có. Nếu revision cũ và thay đổi ảnh hưởng đề bảo vệ/scope, trả `409 REVISION_CHANGED` cùng revision mới và buộc refresh, không phát cache cũ.

### 4.2. Nộp bài

Input: attempt_id, answer, request_id, known_revision, telemetry tùy chọn. Không nhận `isCorrect`, `exp`, `grade`, `taught`, `day` làm sự thật. Server kiểm owner, session, snapshot, tình trạng bảo vệ/thu hồi, trợ giúp đã cấp; chấm; lưu event và quyền tiền; trả receipt.

Cùng attempt nhưng request_id khác vẫn chỉ một kết quả. Nếu request_id cũ/payload giống thì replay receipt. Cùng request_id nhưng hash payload khác: `409 IDEMPOTENCY_CONFLICT`. Attempt đã nộp với đáp án khác: `409 ATTEMPT_ALREADY_SUBMITTED`, cho xem kết quả cũ khi có quyền. Không biến lần sửa đáp án client thành correction giáo viên.

### 4.3. Gợi ý và lời giải

Gọi hint/reveal phải qua server: kiểm quyền → ghi assistance/reveal receipt → mới trả nội dung. Trợ giúp gắn attempt và content_group learning exposure, để mở màn khác không biến thành independent. Nếu request trả nội dung lỗi/mất mạng sau khi server ghi hỗ trợ thì vẫn giữ assisted; client có thể lấy lại nội dung qua receipt.

### 4.4. Hấp thụ / đổi vàng / rèn / mua

Input: command_type, request_id, expected_revision, các giá trị người dùng được chọn (số đổi/item_id). Server lấy giá, điều kiện, số dư, dailyLimit. Output receipt và profile revision mới. Nếu không đủ điều kiện thì error code cụ thể và không ghi một phần; không trả `success:true` với phần tiền chưa ghi.

Mã lỗi ổn định: `NOT_AUTHORIZED`, `SCOPE_CHANGED`, `QUESTION_REVOKED`, `SESSION_EXPIRED`, `INSUFFICIENT_FUNDS`, `RESERVE_REQUIRED`, `SHIELD_CAP`, `NOT_ELIGIBLE`, `LEGACY_REVIEW_REQUIRED`, `REVISION_CHANGED`, `IDEMPOTENCY_CONFLICT`, `RETRYABLE_CONFLICT`. Lỗi thiếu kho không là lỗi máy chủ 500.

## 5. Giao dịch D1 có thể kiểm chứng

[D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/) thực thi các statement trong batch theo giao dịch; không giả định API hỗ trợ transaction tương tác kiểu BEGIN → await đọc → COMMIT. Phải kiểm hành vi bằng runtime D1 dự án thực dùng. `UPDATE ... WHERE revision=?` có thể ảnh hưởng 0 dòng mà không ném lỗi; chỉ gọi batch chưa đủ chứng minh mọi phép cộng/trừ cùng thắng.

Mẫu command bắt buộc về ngữ nghĩa:

1. Đọc receipt theo idempotency key; cùng hash trả receipt cũ, khác hash 409.
2. Đọc state authoritative và revision; tính new state bằng hàm thuần.
3. Tạo execution_id mới cho **mỗi lần thử CAS**, không dùng lại execution_id của lệnh đã thành công.
4. Trong một batch: claim command bằng INSERT có UNIQUE request key và guard revision; mọi mutation tiếp theo đều có guard `command.execution_id == execution_id của lần này`.
5. Trong cùng batch ghi event/reward/day account/profile/reservation/receipt/outbox cần thiết. Mỗi mutation khóa đúng student/revision/semantic key; không chỉ khóa request_id vì một event có thể được gọi từ nhiều endpoint.
6. Có kiểm bất biến trong giao dịch để rollback nếu command đã claim nhưng mutation quan trọng không đạt số dòng mong đợi. Có thể dùng bảng guard với CHECK hoặc cấu trúc SQL bảo đảm các thay đổi cùng điều kiện; phải đưa SQL cụ thể và test thất bại từng bước. Không chỉ kiểm `meta.changes` sau commit rồi hy vọng bù được.
7. Command không claim thì toàn bộ statement sau phải no-op; đọc receipt/revision mới và retry tối đa 5 lần với backoff 20/40/80/160/320 ms có jitter nhỏ. Hết lần trả retryable, không báo 0 EXP thành công.
8. Batch thành công nhưng HTTP mất: lần sau đọc receipt đã commit. Outbox có thể replay, nhưng không trả tiền lại.

`INSERT OR IGNORE` nuốt lỗi unique không được dùng như tín hiệu chắc rằng cả command thành công. Không dùng một boolean “đã trả” độc lập với ledger để chặn mất phần tiền chưa ghi. Nếu ledger theo event và ví theo projection cũ còn tồn tại, chuyển về một mô hình authority trước khi bật v1; không vừa cộng ledger trực tiếp vừa chạy cron SUM(sổ) cộng lại.

Kiểm các thao tác cũ trong `exp-d1.ts`, `game-v2.ts`, `game-v2-hap-thu.ts`, `game-v2-shop.ts` đều có đường duy nhất sau cutover. Read-after-write trả revision committed; nếu dùng D1 read replicas/sessions, phải giữ bookmark/consistency phù hợp, không render số dư cũ như kết quả mới.

## 6. Cache, replay và hai thiết bị

- Cache key gồm policy, bank, protection, curriculum, learner revision và intent/day. Cache metadata chung không chứa hồ sơ/câu trả lời riêng.
- Lúc reserve và submit luôn kiểm những revision bảo vệ cần thiết; TTL không đủ thay invalidation.
- Projection tăng dần xử lý các event mới sau cursor, theo `(received_at,event_id)`. Correction hoặc event tới muộn đánh dấu dirty từ thời điểm liên quan, dựng lại phần skill/card/day bị tác động. Snapshot sau dựng lại phải bằng full replay trong test.
- Tách snapshot trí nhớ/cá nhân và projection ví. Không full replay 3.000 lịch sử mỗi lần mở màn nếu snapshot sạch.
- R2 chỉ nạp body cho tập qid đã chọn; query metadata theo index/batch. Không tải cả kho để chọn sáu câu.
- Hai thiết bị cùng em dùng chung plan/task, receipt; stale cache không tạo một plan riêng. Device id phục vụ chẩn đoán, không tạo hạn mức riêng.
- Mất mạng trước server accepted không tạo event. Sau server accepted có receipt dù UI chưa biết. Luồng retry phân biệt hai trường hợp bằng request/attempt key.

## 7. Ca thi qua các máy

Ca và bộ đề phải tồn tại phía server theo auth hợp lệ. Máy khác đọc được ca theo ID/quyền mà không cần IndexedDB của máy tạo. URL API production HTTPS công khai được cấu hình chung; không lưu localhost/127.0.0.1/IP riêng vào link mời người ở mạng khác. Giữ môi trường dev localhost riêng.

Không sửa CORS thành cho mọi origin có credentials để chữa triệu chứng. Xác minh origin của ba app, OPTIONS/preflight, phiên đăng nhập/cookie/token, HTTPS, Worker route, cờ môi trường và Service Worker cache. Không gửi đáp án cùng dữ liệu kết nối. Kiểm từ máy không có state đăng nhập của máy giáo viên và ít nhất một mạng khác trước DEPLOYMENT_VERIFIED.
