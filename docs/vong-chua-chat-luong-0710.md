# Vòng chữa câu sai: vận hành toàn trường và nghiệm thu chất lượng

Phạm vi đã được thầy chọn: **tất cả học sinh**. Đích học tập: em hiểu chỗ sai, giải thích được quan hệ đúng, vận dụng vào bài mới và tự làm được bản tương đương ở lần gặp lại thứ hai. 90% là mục tiêu cần đo bằng học sinh thật; kiểm thử phần mềm không chứng minh tỷ lệ này.

## Luồng đang được triển khai

```mermaid
flowchart LR
 A[Sai đã công bố từ sổ chung] --> B[Giao đợt và cố định hạn đo]
 B --> C[Kiểm một bước ngắn]
 C -->|sai| D[Câu phân biệt cách em nghĩ]
 C -->|đúng| E[Kiểm vì sao cách đó đúng]
 D --> E
 E --> F[Bài kiểm lại mới]
 F --> G[Vận dụng vào câu mới]
 G -->|có bằng chứng hiểu| H[Bước tiếp theo]
 H --> I[Ghép toàn bài]
 I --> J[Nghỉ ít nhất 24 giờ]
 J --> K[Lần gặp 2: tự làm bản mới]
 K -->|đúng độc lập| L[Đạt lần kiểm đầu; tiếp ôn bền vững]
 K -->|chưa làm được| M[Thầy gỡ đúng bước; giữ bước đã hiểu]
 M --> E
```

Mỗi màn chỉ hỏi một việc. Phản hồi ở lại để em đọc, chỉ chuyển khi em bấm tiếp. Sau câu phân biệt, em có thể mở phần “Hiểu bước này trong bài”: mục tiêu, ý nghĩa đại lượng, lý do, điều kiện áp dụng và mối nối sang bước sau. Một đáp án sai chỉ tạo giả thuyết; chỉ câu xác nhận phù hợp mới được dùng để gọi tên nguyên nhân. Đúng chẩn đoán chưa được xem là hiểu bước.

Bằng chứng hiểu bước cần câu kiểm lý do và câu chuyển giao mới không có gợi ý ở câu đó. Gợi ý tăng lần lượt ba mức, retry giữ nguyên mức và thời điểm; câu đã lộ không được dùng lại để tạo bằng chứng. Khi vẫn sai sau số vòng hỗ trợ cho phép, em được nối với thầy thay vì bị hỏi vô hạn. Thầy nhận được câu em làm, đáp án em gửi, bước đã hiểu và điểm đang vướng; gửi lời gỡ và mở lại đúng bước bằng học liệu đã duyệt. Kết quả đạt ở lần gặp thứ ba vẫn được ghi, kết quả đo lần gặp thứ hai không bị viết lại.

Đợt có giới hạn thời gian/số câu chẩn đoán mỗi đoạn. Em chủ động nghỉ hoặc tiếp; không có đếm ngược gây áp lực. Tiến độ lưu ở máy chủ; payload chưa xác nhận lưu ở máy em để retry nguyên lần nộp. Đáp án, lời giải riêng và học liệu đầy đủ chỉ ở máy chủ.

## Những quyết định phải giữ khi sửa tiếp

| Vấn đề | Hợp đồng |
|---|---|
| Danh tính | SBD từ token, không từ body/query của học sinh. Mọi route giáo viên ở sau `laThay`. |
| Thi đang diễn ra | Chặn cấp câu/chấm/gợi ý khi em đang có ca kiểm tra; không kiểm được lịch thi thì dừng và giữ tiến độ. |
| Bảo vệ kho | Câu gốc qua đường phục vụ câu dùng chung, kiểm khối/phạm vi/câu nghi sai/bảo vệ; đổi version hoặc content group thì không chấm bằng đáp án mới. |
| Chấm | Số theo bộ chấm Phần III chung; Phần II toàn bài đủ bốn ý; không chấm tự luận bằng so chuỗi hoặc mô hình. |
| Nộp | Receipt đầu bất biến; cùng attempt + payload trả receipt cũ, payload khác bị 409. Item/phiên/đợt/chủ sở hữu khớp nhau. |
| Nguyên tử | CAS revision, receipt, item, tiến độ, sổ và yêu cầu thầy trong một D1 batch. Lỗi sổ rollback, không báo đã lưu giả. |
| Nhiều thiết bị | Một item hiện tại/một receipt; thiết bị thua tải lại bản đã khoá. |
| Sổ chung | Micro ghi `purpose=chua_buoc`, bị loại khỏi phép tính thành công toàn bài. Bản ghép có hỗ trợ; kiểm chứng mới được xét độc lập. Không cấp EXP/vàng. |
| Trợ giúp | Cửa sổ hỗ trợ dùng luật cá nhân chung; snapshot trong phiên. Lời thầy không hiển thị lại trong phần tự kiểm độc lập. |
| Tu luyện | Nối từ receipt máy chủ, ưu tiên lần chấm từng câu, giữ giờ/đáp án đầu, retry không ghi hai lần. Lưu trạng thái nộp và các câu trong một batch. |
| Đóng lỗi | Dùng sổ và luật lỗi chung theo các ngày khác nhau, bản tương đương và ôn duy trì. “Tự làm được bản mới” chưa phải “đã đóng lỗi”. |
| Reset | Giữ tám bảng `chua_loi_*` và lịch sử `loi_giai_hoi`, cùng hồ sơ học tập. |

## Học liệu và độ phủ

Học liệu được nhập tại màn vận hành giáo viên. JSON phải có đúng version câu gốc, 1–8 bước theo thứ tự và tiên quyết; mục tiêu/đại lượng/lý do/điều kiện/mối nối; chẩn đoán và câu phân biệt giả thuyết; gợi ý 1/2/3; ít nhất hai câu kiểm lý do, hai câu kiểm lại, hai câu chuyển giao; ít nhất hai bản ghép và hai bản kiểm chứng mới. Bộ kiểm cấu trúc từ chối sai kiểu JSON, đáp án không chấm được, thiếu ý, lý do chỉ là phép tính, trùng nội dung hoặc bản toàn bài thiếu kỹ năng. Phần I/II/III toàn bài giữ định dạng câu gốc. Ảnh/bảng/đề và các lựa chọn gốc được giữ khi học sinh xem lại.

Học liệu cần người duyệt chuyên môn kiểm đáp án, nhiễu, độ khó, điều kiện áp dụng và tính tương đương. Kiểm cấu trúc không thay thế việc này. Mẫu kỹ thuật đầy đủ ở `tests/_chua-cau-sai-fixture.ts::hocLieuMau`; đây là dữ liệu tổng hợp cho kiểm thử, **không được đăng nguyên mẫu làm học liệu cho kho thật**. Thầy lấy đúng đề/lời giải/version qua nút “Lấy đề gốc để soạn”, chuẩn bị theo cấu trúc và duyệt rồi nhập. Câu chưa đủ học liệu chuyển về hàng ưu tiên theo số em ảnh hưởng và hạn đo; không đưa câu chưa được kiểm cho em làm.

Không tự duyệt học liệu bằng tên thầy. Không sinh câu mới trong đường chấm, không đổi câu đang học khi bản học liệu mới được duyệt. Phiên dùng ảnh chụp đã lưu. Muốn bổ sung câu cho một bước hết bài mới: duyệt bản mới và mở lại qua hàng thầy; bước đã hiểu giữ đúng nội dung cũ.

## Áp schema và bật cho tất cả học sinh

1. Chạy kiểm CI của PR. Với D1 thật, kiểm các migration CNH-1 đã có `su_kien_hoc.assistance/purpose/visibility/raw_json`, bảng kho/chỉ mục, ca và Tu luyện. Không coi việc năm bảng PR189 có mặt là đã đủ schema.
2. Chạy workflow **“Áp schema vòng chữa câu sai”** trên commit đã soát. Script `scripts/ap-migration-chua.mjs --remote` chỉ dùng ba tệp cố định: `migration-0710-chua-cau-sai.sql`, `migration-0710-vong-chua-chat-luong.sql`, `migration-z-0710-chua-giao-tu-so.sql`. Chỉ ADD cột chưa có, CREATE IF NOT EXISTS và kiểm hai trigger. Có thể chạy lại; không xoá/sửa dữ liệu cũ hoặc bật cờ. Workflow chỉ-thêm cũ từ chối chữ UPDATE trong trigger nên không dùng workflow đó cho tệp trigger này.
3. Phát hành Worker và Pages cùng commit. Mở màn vận hành giáo viên, chọn **Dùng cho tất cả học sinh**, mã đợt theo dõi riêng, rồi lưu cấu hình. Phạm vi này đã được thầy cho phép; không chuyển về pilot giới hạn lớp/SBD.
4. Bù Tu luyện cũ bằng nút **Đồng bộ kết quả Tu luyện cũ**, rồi **Giao mọi câu sai hợp lệ**. Các lô có vị trí tiếp được lưu, có thể tiếp sau mất mạng; chỉ kết quả hợp lệ đã công bố từ 29/09 trở đi. Kiểm lại hàng học liệu cho mọi câu đang chờ.
5. Từ đó, trigger giao đợt sai mới trong cùng giao dịch ghi sổ hoặc công bố sự kiện, kể cả em chưa mở màn chữa. Các ca đã phát điểm theo quy tắc riêng cũng được rà bằng bước giao lịch sử, không bỏ qua chứng cứ chưa công bố.

Cấu hình toàn trường:

```json
{
  "bat": true,
  "phamVi": "tat_ca",
  "lop": [],
  "sbd": [],
  "dongBoTuLuyen": true,
  "kiemLaiSauGio": 24,
  "chanDoanToiDa": 4,
  "vongHoTroToiDaMoiBuoc": 2,
  "phutToiDaMotLuot": 10,
  "cuaSoDoNgay": 7,
  "cohortId": "toan-truong-chua-0710"
}
```

`bat:true` với danh sách rỗng và **không** có `phamVi:tat_ca` vẫn đóng. Cấu hình hỏng cũng đóng. Mã đợt/hạn đo giữ cố định trong một đợt đánh giá. Tắt khẩn qua màn cấu hình; cache hết sau tối đa 15 giây. Giữ bảng và receipt khi lùi code; không DROP hay làm lại điểm ca thi.

## Nghiệm thu kết quả học tập

Chỉ số chính = số đợt tự giải đúng bản mới, không hỗ trợ, ở **lần kiểm chứng thứ hai đầu tiên** trong cửa sổ đo / **mọi đợt đã giao đủ cửa sổ đo**. Mẫu số giữ bỏ dở, thiếu học liệu, cần thầy và không quay lại. Không tính micro, bản ghép có giúp hoặc lần thử thứ ba thành thành công lần hai. Chưa có mẫu trưởng thành trả `null`, không ghi 0%/100% giả.

30 học sinh và 300 đợt trưởng thành là ngưỡng theo dõi vận hành, không phải chứng minh thống kê. Để gọi là đạt thương mại, cần đồng thời:

- Kiểm quyền, không lộ đáp án, chấm, retry/rollback và nhiều thiết bị đạt trên D1; Worker/Pages đúng commit và schema thật được xác nhận.
- Độ phủ học liệu đủ cho nhóm câu đang giao; không có nhóm học sinh bị kẹt do thiếu học liệu mà bị bỏ khỏi báo cáo.
- KPI đo thật ≥90%, báo cả số HS, số đợt và số bỏ dở; phân tích theo khối, dạng, mức khó và nhóm cần nhiều hỗ trợ để phát hiện kết quả gộp che nhóm yếu. Nếu đưa cam kết quảng cáo, đánh giá độ bất định theo cụm học sinh, không coi nhiều câu của một em là quan sát độc lập.
- Quan sát học sinh thật: em nói lại được vì sao sai/điều kiện dùng cách đúng, tự làm bản mới mà không nhớ đáp án; thấy tiến bộ và muốn quay lại. Đo tỷ lệ mở–bắt đầu–hoàn thành–quay lại cùng thời gian chờ thầy và câu bị hết học liệu.

Nếu chưa đạt, ưu tiên đúng nguyên nhân: thiếu phủ → bổ sung/duyệt học liệu; câu phân biệt không nhận đúng cách nghĩ → sửa nhiễu; em đúng số nhưng không hiểu → sửa câu lý do/biểu diễn; em không chuyển giao → thêm cầu nối/biến thể; bỏ dở → giảm tải và quan sát trải nghiệm; chờ thầy → tổ chức hỗ trợ. Không kéo dài cửa sổ đo, đổi mẫu số hoặc nới điều kiện độc lập để làm đẹp số.

## Kiểm tra kỹ thuật có thể chạy lại

```bash
npx tsc --noEmit -p server/tsconfig.json
npm run build
npm run kiem:mau-giu
npx vitest run tests/chua-cau-sai-chat-luong.test.ts tests/chua-cau-sai-giao-dien.test.tsx tests/chua-cau-sai-0710.test.ts
npx vitest run --config vitest.config.d1.ts tests/d1-runtime-chua-cau-sai.test.ts
npx vitest run tests/migration-chua-cli.test.ts
node scripts/kiem-chua-trinh-duyet.mjs
```

Browser dùng Chromium thật ở 360/430/1280px với API fixture để kiểm bố cục, bàn phím, khung dialog, mất mạng và payload retry. Kiểm API/SQL dùng token thật với SQLite schema thật; kiểm D1 concurrency dùng workerd binding cục bộ. Đây là ba lớp bằng chứng riêng, không mô tả fixture browser là dữ liệu production hay kiểm thử với học sinh thật. Ảnh browser nằm ở thư mục `CHUA_ARTIFACT_DIR` (mặc định `/tmp/chua-browser`); CI lưu artifact.

Trạng thái phát hành, số kiểm thử và hạn chế còn lại được ghi ở `DIEU-PHOI.md` và mô tả PR. Không ghi “đã đạt 90%”, “đã lên D1 thật” hay “hoàn hảo thương mại” khi chỉ mới có kiểm thử kỹ thuật.
