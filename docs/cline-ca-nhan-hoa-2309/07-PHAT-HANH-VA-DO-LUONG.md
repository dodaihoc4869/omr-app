# Hiệu năng, phát hành và đo học tập

## 1. Đo tốc độ bằng cùng một bộ tải

P00 lưu baseline. P10 dùng cùng dữ liệu tổng hợp, seed, vùng runtime, số worker và cấu hình để so trước/sau. Không gọi nhanh nhất nếu chỉ đo trên máy dev hoặc một request.

Ba mức dataset: 100/1.000/10.000 học sinh giả; ngân hàng 1.000/10.000/50.000 câu metadata; mỗi em 0/100/3.000 events. Sinh phân bố taught/due/episode/protected và điểm nộp đồng thời, không dùng thông tin học sinh thật.

Workload: đọc plan 50%, reserve/resume 20%, submit 20%, profile/economy 10%; thêm bài riêng 20 nộp đồng thời cùng attempt và 20 completion khác nhau cùng em. Warm-up 1 phút, đo 5 phút mỗi mức 10/50/100 người dùng đồng thời. Đây là workload nghiệm thu ban đầu, phải ghi thêm quy mô giờ học thật để chọn mức triển khai. Không bắn tải vào production khi chưa được cho phép.

Mục tiêu khởi đầu ở staging cùng vùng: p95 plan warm ≤300 ms, cold ≤1.000 ms; submit ≤500 ms; lỗi hệ thống <0,5%, không tính 409 tranh chấp được xử lý đúng là lỗi mất dữ liệu. p99 không tăng >20% so baseline cùng tải. Đây là target, chưa phải kết quả đã đo.

Nếu SLO chưa đạt: lưu trace CPU/query/rows read/payload, xác định nút thắt, tiếp tục tối ưu; không tự đổi target để báo PASS. Nếu giới hạn hạ tầng không đủ, ghi BLOCKED cùng số đo và phương án cụ thể. Không đổi tính đúng lấy latency.

Các bất biến hiệu năng kiểm bằng code: plan sạch không replay toàn bộ 3.000 events; metadata query dùng index; R2 body chỉ nạp câu được chọn; request thông thường không có N+1 theo tổng số câu ứng viên. Snapshot/cache phải gắn version và quyền; invalidation T12 vẫn qua sau tối ưu.

## 2. Migration và restore drill

1. Schema bổ sung tương thích trước; không DROP dữ liệu cũ ở đợt đầu.
2. Backup rõ project/database/bucket/version/time; dùng tập sao chép phù hợp cho dry-run.
3. Restore vào môi trường tách biệt và so row counts, checksum/số dư/cấp/khiên. Có backup mà chưa restore thử chưa đạt.
4. Xuất bảng trước/sau từng em và invariants tổng; pending legacy có lý do riêng, không điền 0 vào chỗ thiếu.
5. Rerun dry-run hai lần và thật theo CAS. Trường hợp revision thay đổi đưa vào lượt sau.
6. Cutover lúc 00:00 VN như 03, giữ request đang xử lý theo policy gốc. Đóng đường double-write cũ trước khi bật quyền mới.
7. Không báo toàn bộ dữ liệu cũ đã đối chiếu khi còn unresolved; hồ sơ đó vẫn có thể học và kiếm quyền mới theo nhánh đã chốt.

## 3. Bật tính năng theo lớp rủi ro

Flag có policy version, cohort và thời điểm hiệu lực. Tách `scope_selector_v1`, `learner_profile_v1`, `daily_plan_v1`, `economy_v1`, `escort_soft_time_v1`, `return_experience_v1`. Dependency guard: không cho bật economy nếu chưa có ledger/plan/day policy/migration hợp lệ. Không bật model FSRS mới hay curve 365 ngày.

Thứ tự: schema → Worker tương thích → frontend tương thích → shadow đọc → cohort thử tổng hợp/nội bộ → cohort có quyền thử → mở rộng. UI có thể đọc DTO cũ qua adapter trong thời gian tương thích; không tự tính tiền cũ khi Worker mới.

Canary khởi đầu 5% học sinh đủ điều kiện hoặc một lớp thử do thầy chỉ định, chọn theo hash ổn định; nhóm quá nhỏ ghi là thử kỹ thuật, không suy ra hiệu quả học tập. Cố định cohort trong một đợt, không đổi luật giữa buổi.

Rollback ngay nhánh mới nếu có bất kỳ lỗi xác nhận nào: phát câu chưa học/đề bảo vệ, chấm sai do code mới, trùng thưởng, ví âm/mất tài sản, hoặc mất biên nhận nộp. Hiệu năng: rollback khi lỗi hệ thống ≥1% hoặc p95 >2×baseline cùng tải trong 15 phút và có liên quan bản mới. Sau rollback vẫn giữ ledger/events/receipts hợp lệ.

Không quay về Worker cũ không đọc được schema/receipt mới. Chuẩn bị compatibility release chứa parser và command fence; selector có thể quay về đường hợp lệ nhưng reward writer vẫn giữ policy theo event. Nếu writer lỗi nghiêm trọng, tạm ngừng giao dịch tiền với thông báo rõ, vẫn nhận bài vào outbox bền; không trả thành công giả rồi bỏ quyền.

## 4. Kiểm bản chạy thật

Ghi frontend build, Worker version, schema version, policy flags, thời điểm, URL môi trường, trình duyệt/thiết bị. Không đưa khóa vào báo cáo.

| Hành trình | Bằng chứng |
|---|---|
| Thầy mở ca, máy khác vào/nộp | Máy thứ hai có storage trống, mạng khác; video/ảnh và request log đã che bí mật |
| Học sinh và phụ huynh mở cùng ngày | Cùng plan/revision; không thêm tải/trùng thưởng |
| Gọi lên bảng | Đợi không tự gọi; click mới hiện thú/thẻ; click đôi không nhân lượt |
| Core hoàn thành/hấp thụ/khiên | Receipt và DB projection khớp; hai máy cùng thao tác đúng |
| Nộp rồi mất mạng | Lấy lại receipt, không event/tiền trùng |
| App cũ/Service Worker cũ | Nâng bản/refresh không treo, không ghi luật thưởng sai |

Không dùng dữ liệu/tài sản thật của học sinh làm vật thử. Các tài khoản tổng hợp phải được tách khỏi thống kê học tập.

## 5. Đo chất lượng giáo dục

Shadow khoảng 2 tuần để kiểm hợp lệ, độ khác bộ chọn, tải dự kiến và chi phí. Nó không chứng minh câu chưa phát đã giúp học sinh học tốt hơn.

Sau ổn định kỹ thuật, thử các chính sách đều an toàn trong khoảng 6 tuần; quyết định cỡ mẫu từ số học sinh thật và biến thiên, không lấy “6 tuần” thay power analysis. Chia nhóm phù hợp, cân bằng mức ban đầu; với Đoàn cân nhắc theo lớp/nhóm để hạn chế tác động chéo. Không giữ bug đã biết trong nhóm đối chứng.

Chỉ số chính: tự giải biến thể mới ở mốc đo 7/21 ngày, nhớ lâu, tỷ lệ hoàn thành trong thời gian chọn, tiến bộ theo phút học, bỏ dở sau lỗi. Chỉ số trải nghiệm: quay lại có học, báo chán/lặp, nhu cầu trợ giúp. Lượt mở app/thời gian ở màn game là phụ; không tối ưu chúng bằng cách kéo dài buổi.

Định nghĩa trước khi đo:

- Repeat exposure: tỉ lệ content_group lặp trong 7 ngày, tách due/repair hợp lệ và lặp không lý do; mục tiêu lặp **không lý do=0**, không phải mọi lặp=0.
- Scope violation: số câu tự động sai taught/prerequisite/protection / số câu tự động; mục tiêu 0.
- Fit: tỷ lệ đúng độc lập câu chính theo nhóm mức, không gồm probe/assisted; vùng 80–90% là mục tiêu theo dõi chứ không lý do sửa điểm.
- Transfer: đúng độc lập biến thể chưa luyện nguyên văn; bộ đo không được lọt vào kho luyện có lời giải trước đo.
- Equity: báo riêng nhóm yếu, mới, kho nhỏ, mạng chậm và ít ngày học. Không tuyên bố cải thiện chung nếu nhóm cần nâng đỡ chịu tải tăng rõ.

Đợt đo kết thúc có báo cáo cỡ mẫu, khoảng bất định, thiếu dữ liệu, thay đổi policy và kết quả theo nhóm. Không hứa “tuyệt đối không nhàm chán”; mục tiêu là đo được lặp đúng mục đích, tiến bộ và trải nghiệm tốt hơn.

## 6. Nghiên cứu và phạm vi kết luận

Các cơ sở khoa học và giới hạn đã nêu trong [bản đề xuất gốc](../../DE-XUAT-CA-NHAN-HOA-RUT-CAU-EXP-TUNG-BUOC-2309.md). V1 giữ hướng retrieval practice, ôn cách quãng, xen kẽ và nâng đỡ; các hằng số tiền, số family, tỷ lệ đạt ngày và trọng số selector là quyết định sản phẩm cần đo.

Tài liệu kỹ thuật tham chiếu khi lập bộ: [Cline tasks](https://docs.cline.bot/core-workflows/task-management), [Cline rules](https://docs.cline.bot/customization/cline-rules), [DeepSeek thinking](https://api-docs.deepseek.com/guides/thinking_mode/), [DeepSeek cập nhật model](https://api-docs.deepseek.com/updates/), [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/). Nếu API/tool thay đổi, điều chỉnh adapter theo tài liệu chính thức và kiểm thử, không tự đổi luật học/tiền.
