# Học liệu vòng chữa tự kiểm — 07/10/2026

Thầy đã giao máy soạn, không duyệt từng câu; thầy chỉ chữa bước cuối ở **Lên bảng → Câu cần chữa → Chiếu lên bảng**. Bộ mới không được giả tên người duyệt hoặc coi đồng thuận hai đáp án là bằng chứng đạt 90%.

## Luồng đã phát hành

Máy soạn nhận nguồn thật qua `/kho/may-soan/vong-chua-viec` sau cổng mã bí mật giáo viên. Chỉ chọn câu gốc đã kiểm, chỉ mục khớp kho đang dùng, có đợt lỗi mở và chưa có học liệu đủ dùng đúng phiên bản. Không trả tên, SBD hoặc bài làm học sinh.

Một phiên soạn học liệu đầy đủ: chẩn đoán → xác nhận nguyên nhân → hỗ trợ ba mức → kiểm lại → kiểm hiểu lý do → chuyển giao → hai bản ghép và hai bản kiểm chứng mới. Một phiên riêng chỉ nhận đề/bảng/hình/lựa chọn/đơn vị, tự giải từng câu. Kết quả mù được đóng lại trước khi một phiên soát riêng đánh giá khoa học, thứ tự bước, độ khó và tính tương đương.

Cổng máy chủ đối chiếu SHA-256 của từng đề đầy đủ, mã/phiên bản, đáp án, lý do, độ chắc và kết luận chuyên môn. Thiếu/thừa/trùng câu, đổi dữ kiện sau giải mù, lệch đáp án hoặc chưa chắc đều bị từ chối. Hồ sơ ghi **máy kiểm độc lập · v1**, giữ bằng chứng ở phần riêng của học liệu. Tên thầy không được tự điền. Dấu vân tay nội dung học liệu giữ nguyên khi chạy lại; nạp lại cùng nội dung không tạo dòng thứ hai.

**Giới hạn của kiểm máy:** hai lượt có thể cùng mắc một lỗi khoa học. Cần kiểm số học độc lập khi có bộ giải, giữ đầu vào/đầu ra để soát, theo dõi phản hồi và loại học liệu có lỗi. Chưa có đủ bằng chứng để chứng nhận mọi câu đúng hoặc mọi em sửa được.

## Vận hành máy soạn

Máy cần Claude Code đã đăng nhập và mã giáo viên sẵn có (`OMR_MA_BI_MAT` hoặc `~/.omr-ma-bi-mat`). Không đưa mã này vào phiên Claude soạn/kiểm.

```
node scripts/loi-giai/may-soan-vong-chua.mjs --mot-lan
```

Chạy không có `--mot-lan` để tiếp tục hỏi hàng mới. `--thu` soạn/kiểm một câu, không nạp. Mã máy soạn cũ `may-soan.mjs` mặc định dành một luồng trong tổng số luồng hiện có cho vòng chữa mới (khi có từ hai luồng, không ở chế độ thử); không tăng tổng số luồng. `--khong-vong-chua` giữ chế độ cũ. Tất cả chế độ thống kê/nạp hàng cũ vẫn chỉ làm đúng công việc đó.

Hồ sơ ở `.may-soan-vong-chua/` bị loại khỏi git. Thư mục kiểm mù tách riêng và được dọn sau khi sao kết quả vào hồ sơ. Luồng thiếu dữ kiện/không giải được không tự gắn nhãn đạt, còn được làm lại ở lần chạy sau.

## Lời nhắn để phiên Claude thực thi

> Đọc DIEU-PHOI.md và docs/hoc-lieu-vong-chua-tu-dong-0710.md từ main hiện tại. Giữ công việc đang có; nếu đang ở nhánh cũ, tạo checkout sạch từ main thay vì đẩy bản cũ lên app. Kiểm Claude Code đã đăng nhập và mã giáo viên đã cấu hình, không in mã ra chat/log và không đưa vào phiên soạn. Chạy `node scripts/loi-giai/may-soan-vong-chua.mjs --mot-lan` để xử lý hàng học liệu vòng chữa. Thầy đã giao tự soạn/tự kiểm, không cần thầy duyệt từng câu. Giữ nguyên cổng giải mù, soát chuyên môn và kiểm máy chủ; không bỏ kiểm để tăng số lượng. Giữ hồ sơ các câu bị loại để sửa ở lượt sau. Báo riêng số bộ đã nạp, số câu còn thiếu/bị loại/nguồn chưa hỗ trợ. “Hết hàng trong lượt” chỉ nói về các việc máy lấy được, không chứng minh toàn kho đã phủ hoặc học sinh đạt90%. Thầy chỉ chữa bước cuối ở Lên bảng → Câu cần chữa → Chiếu lên bảng.

## Mẫu có bộ giải tính riêng

Một mẫu hiệu suất ester chỉ nhận đúng câu gốc/phiên bản đã soát, có ba bước, 28 đề kiểm duy nhất và bốn bản toàn bài. Bộ giải riêng nhận đầu vào mù, đọc lại số/đơn vị/hệ số trong đề, tính lại đáp án; trắc nghiệm chọn theo nội dung thay vì mã A/B/C/D cố định. Đổi dữ kiện phải ra kết quả mới; đề ngoài phạm vi hoặc H>100% bị loại. Kiểm lý do dùng các mệnh đề chuẩn đã soát của mẫu. Đây là kiểm theo mẫu bằng mã, không phải phiên Claude hay người thầy duyệt.

Workflow `nap-hoc-lieu-chua.yml` kiểm ca thi, schema và đúng bản sống trước khi nạp mẫu; nạp bằng cùng hàm nhận học liệu, chỉ ghi bảng học liệu, đọc lại hồ sơ kiểm ngay sau ghi. Không sửa điểm, EXP hoặc ghi kết quả học sinh.

## Mốc kiểm nguồn và chất lượng

Nguồn đọc ngày 07/10 có **793 câu gốc hợp lệ** trong đợt lỗi mở tại thời điểm quét; **239** câu có ít nhất bốn biến thể cũ và **127** câu có dữ liệu bước. Những con số này thay đổi khi lịch sử tiếp tục đồng bộ. Có biến thể cũ chưa đồng nghĩa đã có học liệu vòng chữa đầy đủ.

Môi trường Codex hiện không có Claude Code, khóa API hoặc máy soạn được cấu hình. Việc hoàn tất toàn hàng cần chạy máy soạn ở nơi đã đăng nhập; phần mềm không tự giả bằng chứng kiểm để lấp chỗ trống. Khi chưa đọc lại đủ độ phủ và kết quả học sinh, trạng thái nghiệm thu thương mại và mục tiêu 90% vẫn **chưa đạt**.

Kiểm cục bộ: 103 kiểm thử liên quan đạt, 9 kiểm thử workerd/D1 đạt, TypeScript và build đạt. CI37586996454 thành công: 237 kiểm vòng chữa,9 D1,15 migration/học liệu,33 vận hành và Chromium360/430/1280 đạt.

Mẫu đã nạp production: Actions37586139922/job112676589229 thành công07:15:21UTC; đọc lại đủ28 probe,3 bước,4 bản toàn bài và provenance máy. Độ phủ đọc lúc đó là1 câu; chưa phải hoàn tất793 câu nguồn hoặc các câu bổ sung khi backfill tiếp tục.

Đã kiểm thêm luồng ba bước bằng học sinh tổng hợp trên SQLite: sai chẩn đoán → chọn câu xác nhận sai → phản hồi đúng lỗi đơn vị → tự trả lời câu mới/lý do/chuyển giao → ghép bài → chờ24h → giải độc lập bản gặp lần hai; đủ3 bước và chỉ sau bài mới mới đóng lỗi. Bộ giải dùng dữ kiện công khai, không đọc đáp án phiên. Đây là mô phỏng kỹ thuật, không phải tỷ lệ học sinh thật.

## Bản sống đã đọc lại lúc14:43VN

PR200 đã merge; Actions37587516607 thành công, nguồn **afd15234332f4c14577a4232b3c19acdca10c9b2**, Worker **930a44f3-131f-4716-b549-701d5b352533**, Pages **ec433d8c**. Đọc lại Worker/Pages cùng nguồn,5 đường app và2 cổng quyền; D1 đủ9 bảng/2 trigger,0 ca mở/0 lượt đang làm. Bộ toàn repo Node24:14.768 kiểm,14.632 đạt,108 lỗi,28 bỏ qua và3 suite lỗi môi trường cũ. So108 tên với nền114:0 tên mới; không ghi toàn repo xanh. SW13/13 đạt.

Đọc độc lập sau backfill:13.460 cặp đã đồng bộ,477/477 lượt tự luyện,7.245 đợt mở/258 em/1.370 câu; công cụ giao tạm còn0. Hiện chỉ1 câu có học liệu đủ dùng. Phần mềm đã phát hành; toàn hàng học liệu vẫn chưa hoàn tất vì chưa có máy Claude đăng nhập trong phiên Codex. Chưa có kết quả học sinh thật để nghiệm thu90%.
