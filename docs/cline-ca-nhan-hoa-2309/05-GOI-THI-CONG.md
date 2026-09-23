# 12 gói thi công, thực hiện tuần tự

## Cách dùng chung cho mọi gói

Mỗi gói có thể cần nhiều task Cline nhỏ. Không ép hoàn thành cả gói trong một lần trả lời. Mỗi task: đọc phần cần thiết → nêu thay đổi dự kiến ngắn → viết/sửa test ý nghĩa → sửa một phần → chạy → đọc diff → cập nhật nhật ký. Tự tiếp tục phần đã được giao, chỉ dừng nhánh phụ thuộc nếu thật sự thiếu thông tin hoặc môi trường; vẫn làm phần độc lập.

Tạo thư mục bằng chứng `docs/cline-ca-nhan-hoa-2309/evidence/` khi bắt đầu thực thi. Đặt log theo gói, không chép token/bí mật/dữ liệu thật. `TIEN-DO.json` là bảng theo dõi, không phải quyền tự chứng nhận. P00 chưa hoàn tất thì không tự coi các báo cáo cũ là baseline hiện tại.

Các test xuyên nhiều gói chỉ có thể PASS toàn bộ ở gói chịu trách nhiệm ghi trong 06. Một gói nền được đánh dấu PASS khi đầu ra thuộc phạm vi gói đã kiểm xong; phần kiểm liên quan gói sau ghi đang chờ, không tự PASS test/requirement đầy đủ. Ví dụ P03 kiểm event idempotent, nhưng T14 còn chờ phần tiền ở P07; P00 lưu baseline của T48, còn T48 chỉ kết luận ở P10. Phụ thuộc giữa gói dùng sự sẵn sàng của đầu ra, không tạo vòng chờ vì test tích hợp tương lai.

## P00 — Baseline và đường gọi thật

**Phụ thuộc:** không. **Đọc:** 00, 01, bản kiểm toán và scripts hiện có.

1. Ghi git HEAD/status, phiên bản Node/package manager/Cline/provider; không xuất khóa API. Nhận diện thay đổi có sẵn của người dùng.
2. Đọc package.json, cấu hình Vite/Vitest, server/tsconfig, migration và cờ. Ghi rõ cờ production nào chưa có quyền đọc hoặc chưa xác minh.
3. Lập ROUTE-MAPPING và bảng toàn bộ nơi chọn câu/ghi điểm/ghi EXP. Có cột đang chạy, cờ nào, ai gọi; không sửa mã chết như thể đó là đường production.
4. Chạy kiểm toán A01–A08 nếu script còn tương thích. Nếu code đã thay đổi thì ghi kết quả mới; không sửa assertion về lỗi cũ để giả tái hiện được.
5. Chạy typecheck/build và full test một lần lấy baseline, lưu mọi lỗi cũ theo test ID và nguyên nhân đã biết. Không bỏ lỗi cũ khỏi báo cáo. Thử tải tổng hợp lấy CPU/query/payload/p95 ban đầu.
6. Tạo dữ liệu test tổng hợp: hai em cùng lớp khác scope, ít/nhiều lịch sử, yếu/mạnh, thiếu family, ví và khiên cũ đầy đủ/thiếu sổ.

**Đầu ra:** BASELINE.md, ROUTE-MAPPING.md, trạng thái test nền, tập dữ liệu tổng hợp tái lập. **Gate:** R01; T48 phần baseline. Gói này không được tự báo đã sửa A01–A08.

## P01 — Hợp đồng câu, policy và chấm

**Phụ thuộc:** P00. **Đọc:** 01; 02 mục 1; 04 mục 1–3; 06 T19/T20/T33/T34.

**Tệp định hướng:** `src/lib/cham-so.ts`, `src/engine/score.ts`, `server/src/btvn-grading.ts`, `server/src/cham-lai-ca.ts`, `server/src/cau-theo-qid.ts`, nơi grade thực tế trong ROUTE-MAPPING.

1. Tạo types/runtime validators và một module policy CNH-1.0; chưa bật reward mới.
2. Lập SCHEMA-MAPPING, chỉ thêm cột/bảng thiếu. Lưu version/answer policy/content group/quality; family chưa biết giữ null.
3. Test numeric-format/units/tolerance và partial II qua **tất cả** grading adapters có thể chạy, không chỉ một helper.
4. Chốt snapshot đề lúc giao; test đổi đáp án/đảo lựa chọn giữa lúc làm.
5. Correction có reference, rebuild và bù một lần; phần bù nối command ở P07 khi chưa có, không để placeholder bị coi là hoàn thành.

**Đầu ra:** hợp đồng và bộ chấm thống nhất, migration bổ sung, test T19/T33/T34. R04 correction chỉ PASS sau tích hợp P07/P08.

## P02 — Phạm vi học, chất lượng kho và bảo vệ đề

**Phụ thuộc:** P01. **Đọc:** 02 mục 1–2,7; 04 mục 6–7.

**Tệp:** `server/src/game-v2-bank.ts`, `server/src/parent-news-nguon-cau.ts`, `server/src/btvn-nang-do-d1.ts`, các nguồn đề bảo vệ trong route map.

1. Một hàm eligibility thuần cùng adapter đọc scope thật.
2. Mọi skill/prerequisite đều taught; không đồng nhất lớp và em. Ghi encountered riêng.
3. Kiểm qid/version/content_group protected, quyền full curriculum và ngoại lệ teacher assignment.
4. Báo kho thiếu nhãn/nguồn, hỗ trợ giáo viên xác nhận theo em; không tự tạo family giả.
5. Kiểm lại scope/protection revision trước phát; kiểm cache cũ.

**Gate:** T01–T04, T11–T12, T40. **Không làm:** chữa thiếu kho bằng fallback sang lớp/toàn ngân hàng.

## P03 — Sổ học và hồ sơ năng lực

**Phụ thuộc:** P02. **Đọc:** 02 mục 3; 04 đầy đủ phần event/CAS/outbox.

**Tệp:** `server/src/su-kien-hoc.ts`, `server/src/ho-so-nam-kt.ts`, `server/src/ho-so-cau-hinh.ts`, `server/src/game-v2-ho-so.ts`, `src/game/than-thu-v2/core.ts`.

1. Event chuẩn, attempt key, assistance và embargo; bảo toàn raw data.
2. Reducer tất định cho independent family/day, validated/working/confidence, episode lifecycle.
3. Snapshot/cursor, correction replay; so replay đầy đủ và tăng dần.
4. DTO chung cho cả ba app; bỏ cách tính bac/yếu khác nhau trong từng game.
5. Tái hiện bốn câu dễ cùng ngày, ba lỗi rồi phục hồi, gợi ý qua màn khác.

**Gate:** T05–T06, T14, T29, T32, T47. Các side effect reward để P07 nhưng event/data phải đủ.

## P04 — FSRS và chống lặp

**Phụ thuộc:** P03. **Đọc:** 02 mục 4 và ngân sách retry.

**Tệp:** `server/src/lich-on-fsrs.ts`, `server/src/game-v2-ho-so.ts`, các cooldown trong game/parent/challenge.

1. Giữ model/cấu hình đã khóa, lưu đủ state, memory key dùng content_group/version.
2. Một quan sát độc lập/ngày, Again thắng, assisted retry không đẩy due.
3. Một module repeat eligibility; due không bị cooldown 3/14/30 sai chặn.
4. Family spacing và repair exceptions có lý do; không có đủ nguồn thì giảm lượt.

**Gate:** T04,T06,T07,T17,T29,T41. **Không làm:** nâng thư viện/FSRS-7 hoặc tự tuning cùng gói.

## P05 — Kế hoạch ngày, bộ chọn và giữ chỗ

**Phụ thuộc:** P04. **Đọc:** 02 mục 5–7; 04 mục 3–6.

**Tệp:** `server/src/ke-hoach-ngay.ts`, `server/src/ke-hoach-ngay-d1.ts`, `src/lib/dat-nhiem-vu-ngay.ts`, selector thật trong route map.

1. Ước lượng thời gian với fallback và sample filtering đúng đặc tả.
2. Một plan/task pool ngày; core role/rubric đóng băng, không ép sàn số câu.
3. Pipeline hard filter, score tất định, time-fit, family-spacing và mã lý do thiếu.
4. Reserve bằng SQL có uniqueness/CAS; race thua chỉ chọn lại phần chưa chốt.
5. Giữ assignment giáo viên quá tải cùng hạn gốc, báo phần chặng/deferred; mục tiêu đạt không tăng ngầm.
6. Carry-over ngày mới theo 03; không tính cùng một bài cho hai ngày.

**Gate:** T07–T10,T12–T13,T27,T40. Dữ liệu 600 giây/240+60 phải nhận đúng tối đa 2 câu.

## P06 — Nối mọi kênh và Đoàn

**Phụ thuộc:** P05. **Đọc:** 02 mục 8, route map; 04 API.

**Tệp:** `server/src/parent-news-chon-cau.ts`, `server/src/thu-thach-rieng.ts`, `server/src/luyen-de.ts`, `server/src/game-v2.ts`, `server/src/game-v2-doan.ts`, `server/src/game-v2-escort.ts`, `src/game/than-thu-v2/doan-core.ts`, các màn đang gọi.

1. Thay từng adapter BTVN/Mom/parent/Đảo/Đoàn/repair/tower/arena/Linh Tâm/luyện tự do/thi thử có thưởng; đánh dấu rõ cờ lùi còn hoạt động.
2. Giữ ma trận/điểm thi thật riêng; teacher override không nới kho game.
3. Đoàn theo năng lực cá nhân, hạn mềm, chặng ngắn, continuing task, không ghi timeout sai.
4. Server ghi hint/help, session/receipt qua hai máy; tắt AI vẫn làm bài được.
5. Dùng cùng bộ test contract theo danh sách **mọi kênh route map**, thiếu adapter phải fail.

**Gate:** T09–T14,T29,T38–T39,T42. **Không làm:** chỉ thay một helper nhưng giữ nhánh fallback cũ đang chạy.

## P07 — EXP và command nguyên tử

**Phụ thuộc:** P06. **Đọc:** 03 mục 1–5; 04 mục 4–6.

**Tệp:** `server/src/exp-cau-hinh.ts`, `server/src/exp-hoc-tap.ts`, `server/src/exp-chuyen-trang-thai.ts`, `server/src/exp-d1.ts`, `server/src/game-v2-academic.ts`, nguồn thưởng Đoàn/lên bảng/ca.

1. Module price/entitlement thuần; raw core, two buckets, purpose precedence và semantic keys.
2. Command D1 claim/CAS/ledger/day/profile/receipt/outbox; test inject failure từng statement, không chỉ happy path.
3. Nối mọi nguồn cũ theo bảng 03, cắt double-write với cron SUM(sổ)/profile cũ; bật theo cutover.
4. Grading correction bù một lần; embargo không lộ kết quả; late event không mở lại cap hôm nay.
5. Test đồng thời: 20 request cùng completion; request_id khác cùng event; payload khác cùng request_id; quỹ optional còn 3.

**Gate:** T14–T20,T27–T29,T39,T43,T47. Chưa có integration SQL thật thì chưa PASS phần giao dịch.

## P08 — Cấp, khiên, ví và migration

**Phụ thuộc:** P07. **Đọc:** 03 mục 6–10; 04; 07 mục migration.

**Tệp:** `src/lib/hap-thu-ngay.ts`, `src/game/than-thu-hoa-hoc/kinh-nghiem.ts`, `server/src/game-v2-hap-thu.ts`, `server/src/exp-ho-so-game.ts`, `src/lib/kinh-te-game.ts`, `server/src/game-v2-shop.ts`, cron giảm khiên.

1. Hấp thụ chung, 120→200 chỉ thêm 80, level cap; first/later một command, trần unused total.
2. Bỏ phạt vắng bằng mất khiên; không đổi tác dụng khi chủ động dùng khiên.
3. Reserve 400 khi tiêu EXP; mua vàng sẵn có không bị chặn nhầm.
4. Migration dry-run/rerun/CAS; ma trận legacy đầy đủ; không reset ngày/cấp/ví.
5. Nối vectors MAU-KET-QUA vào **production functions**; mô phỏng đến ngày 42 và nhiều lịch gián đoạn.
6. Rollback reader hiểu dữ liệu mới; không đưa writer cũ không hiểu policy trở lại.

**Gate:** T21–T28,T30–T31,T39,T43,T45. Đường cấp 365 ngày phải giữ tắt.

## P09 — Ba app, lên bảng và động lực học

**Phụ thuộc:** P08. **Đọc:** 02 mục 9; 03 display; 06 UI cases.

**Tệp:** portal/màn giáo viên–học sinh–phụ huynh tìm qua route map; `src/screens/GoiLenBangScreen.tsx`, `src/lib/html-may-chieu.ts`, `src/lib/goi-len-bang.ts`; ca thi `src/screens/ExamSetupScreen.tsx` và API config thật.

1. UI cùng plan/status/receipt, lý do thiếu nguồn dễ hiểu; không hiện technical policy strings cho học sinh.
2. Nút Lên bảng là trigger duy nhất; bỏ countdown/auto transition kể cả HTML trình chiếu khác cửa sổ.
3. Màn nhỏ/công thức/Phần II/modal/zoom; không dùng overflow hidden để giấu câu trả lời.
4. API HTTPS và ca server; test state trình duyệt trống, service worker bản cũ, CORS/auth.
5. Tuần 5/7, mục tiêu quay lại, phụ kiện khởi đầu từ catalog thật, nhắc có opt-in và dừng sau đạt. Thông báo trong test dùng sink giả, không gửi cho học sinh thật.

**Gate:** T30,T35–T36,T46,T48. T37 production chỉ kiểm khi có môi trường; không đánh dấu bằng test localhost.

## P10 — Tích hợp, hiệu năng và bản phát hành

**Phụ thuộc:** P09. **Đọc:** 06,07 và mọi requirement chưa PASS.

1. Chạy full regression, build và server typecheck. Phân loại test cũ cần đổi do policy; giữ test tương ứng hành vi mới, không xóa để giảm số fail.
2. Test workload/latency/query/payload cold/warm với cùng dataset baseline. Đọc bottleneck, sửa có đo; không cache bỏ qua bảo vệ.
3. Restore drill snapshot tổng hợp; dry-run migration lớn; kiểm cũ/mới cùng session và rollback theo cờ.
4. Review độc lập bằng prompt nghiệm thu; đối chiếu mọi requirement với code, gọi lại test nhạy cảm.
5. Chốt artifact Worker/frontend/schema/flags cùng manifest version; ghi lỗi baseline còn lại. Chỉ CODE_VERIFIED khi lỗi quan trọng trong phạm vi đã hết và test bắt buộc đạt.

**Gate:** toàn bộ yêu cầu code; T32,T40–T45,T48. Chạy `kiem-tra-bo-ban-giao.mjs --acceptance`; đọc kỹ log, không dùng nó thay test sản phẩm.

## P11 — Xác minh triển khai và theo dõi học tập

**Phụ thuộc:** P10; cần môi trường và quyền phát hành tương ứng.

1. Thực hiện phát hành theo 07, đối chiếu migration; giữ danh sách unresolved legacy riêng.
2. Hai thiết bị, mạng khác, ba tài khoản vai trò, mở ca/nộp/nhận EXP/hấp thụ/đổi vàng/rèn bằng tài khoản thử.
3. Xác minh version thực, flags, cache, hiệu năng thật và rollback. Ghi DEPLOYMENT_VERIFIED khi đủ bằng chứng, không trước đó.
4. Thu thập chỉ số và đánh giá học tập theo khoảng thời gian ở 07. Không giả số liệu. Task code không cần thức chờ sáu tuần; bàn giao chủ sở hữu và quy trình đo, trạng thái đánh giá vẫn pending.

**Gate:** R39–R42. Không tự tạo automation/nhắc định kỳ bên ngoài nếu chủ dự án chưa yêu cầu.

## Lệnh kiểm phù hợp repo lúc lập bộ

Chạy từ gốc repo; trước khi dùng kiểm lại scripts/package manager trong P00:

```sh
npm exec -- tsc -b
npm exec -- tsc -p server/tsconfig.json --noEmit
npm exec -- vitest run
npm run build
npm run lint
node scripts/kiem-toan-ca-nhan-hoa-2309.mjs
```

Vitest theo tập file liên quan chạy sau từng thay đổi; full suite ở P00/P10 và khi một thay đổi xuyên nhiều module có lý do. Script kiểm toán cuối danh sách xác nhận hành vi lịch sử, **không** là test chứng minh bản sửa. D1 integration cần runtime local/staging có schema thật; Playwright có sẵn trong package nhưng phải tìm/thêm harness đúng dự án, không giả có `npm run e2e`.

## Nội dung nhật ký cuối mỗi gói

```text
Gói / thời điểm / source fingerprint:
Yêu cầu xử lý:
File và hành vi thay đổi:
Kiểm thử thực chạy, command, exit code, artifact:
Kết quả / lỗi chưa hết / cờ chưa xác minh:
Tài liệu hoặc test cũ đổi vì yêu cầu nào:
Bước tiếp theo chính xác:
```

Không ghi chain-of-thought; chỉ ghi quyết định kỹ thuật, bằng chứng và trạng thái công việc.
