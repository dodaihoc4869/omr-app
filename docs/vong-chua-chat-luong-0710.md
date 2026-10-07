# Vòng chữa câu sai: vận hành toàn trường và nghiệm thu chất lượng

Phạm vi đã được thầy chọn: **tất cả học sinh**. Đích học tập: em hiểu chỗ sai, giải thích được quan hệ đúng, vận dụng vào bài mới và tự làm được bản tương đương ở lần gặp lại thứ hai. 90% là mục tiêu cần đo bằng học sinh thật; kiểm thử phần mềm không chứng minh tỷ lệ này.

## Luồng đã triển khai trong PR

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
 K -->|chưa làm được| M[Gom bước cuối vào buổi chữa trên lớp]
 E -->|vẫn mắc sau vòng tự gỡ| M
 M --> N[Thầy chữa chung cho các em có mặt]
 N --> E
```

Mỗi màn chỉ hỏi một việc. Phản hồi ở lại để em đọc, chỉ chuyển khi em bấm tiếp. Sau câu phân biệt, em có thể mở phần “Hiểu bước này trong bài”: mục tiêu, ý nghĩa đại lượng, lý do, điều kiện áp dụng và mối nối sang bước sau. Một đáp án sai chỉ tạo giả thuyết; chỉ câu xác nhận phù hợp mới được dùng để gọi tên nguyên nhân. Đúng chẩn đoán chưa được xem là hiểu bước.

Bằng chứng hiểu bước cần câu kiểm lý do và câu chuyển giao mới không có gợi ý ở câu đó. Gợi ý tăng lần lượt ba mức, retry giữ nguyên mức và thời điểm; câu đã lộ không được dùng lại để tạo bằng chứng. Khi làm sai ở vòng kiểm bước, hệ thống tự đối chiếu điều kiện áp dụng, mở ví dụ đã duyệt và cho em thử lại bằng câu mới. Nếu vẫn mắc sau số vòng hỗ trợ cho phép hoặc chưa nối được bài tổng hợp, hệ thống tự xếp vào buổi chữa trên lớp. Không có nút gửi riêng cho thầy ở giữa vòng tự chữa.

## Thầy chỉ chữa bước cuối ở mục chiếu lên bảng

**Lên bảng → Câu cần chữa → Chiếu lên bảng câu cần chữa.** Tổng quan chỉ có số liệu và nút dẫn tới đúng thẻ này; đã bỏ ô trả lời riêng từng học sinh. Route hàng thầy cũ chỉ đọc, không nhận gửi lời gỡ/mở lại cá nhân.

1. Dùng bước Điểm danh có sẵn của Lên bảng. Hàng chữa gom theo lớp, nhóm nội dung đã xác minh, phiên bản, bước và nguyên nhân đã xác nhận; ưu tiên nhóm ảnh hưởng nhiều em rồi đến nhóm chờ lâu. Cùng câu nhưng khác chỗ mắc được chữa riêng. Không gán nguyên nhân khi chưa đủ bằng chứng.
2. Màn riêng của thầy có câu vừa làm, đáp án em gửi, số vòng hỗ trợ và các bước đã hiểu. Tờ chiếu chỉ có đề gốc, bảng/ảnh/lựa chọn và quan hệ cần nối. Không chiếu tên em, đáp án sai cá nhân hoặc bảng xếp hạng; lời gỡ chỉ mở khi thầy bấm. Mỗi nhóm một tờ, có khoảng trống viết bảng.
3. Với câu tổng hợp, thầy chọn bước cần gỡ từ bằng chứng trước khi mở tờ. Với lỗi bước đã xác định, app chọn đúng bước. Thầy bấm **Thầy chữa** ngay trên tờ. Chỉ những em có mặt trong buổi được mở lại bước; các em vắng giữ hàng chữa. App tự chia lô tối đa sáu em để nằm trong ngân sách D1; mất mạng giữa lô thì thử lại bằng đúng receipt đã lưu.
4. Xác nhận buổi chữa không biến thành “đã hiểu” hoặc “đã tự sửa”. Chỉ bước vừa chữa được đặt lại để em tự kiểm lý do, làm một bước mới, chuyển giao, ghép bài và kiểm chứng sau ít nhất 24 giờ; bước đã hiểu ở đúng bản được giữ. Học sinh mở lại câu đang chữa để tiếp tục. Kết quả gặp thứ ba không sửa lại KPI gặp thứ hai đã thất bại.
5. Hết câu mới thì lưu lý do trong hàng chuẩn bị học liệu, không hỏi lại câu đã lộ và không bắt thầy nhắn riêng cho em. Khi nội dung bổ sung được duyệt đúng phiên bản, em mở lại là hệ thống tự tiếp, giữ bằng chứng/đáp án/ngày giao cũ. Chuẩn bị và duyệt học liệu là công việc chuyên môn dùng chung trước buổi, không phải chữa tay từng em.

API giáo viên: `POST /gv/chua-cau-sai/hang-chieu` và `POST /gv/chua-cau-sai/da-chua-tren-lop`. Lệnh ghi xác minh buổi còn mở, điểm danh từ máy chủ, nhóm câu/bước, revision và phạm vi sử dụng; lưu `chua_loi_chua_lop` cùng thay đổi tiến độ/hàng chữa trong một batch. Receipt lớp chỉ ghi đã chữa; không ghi điểm đạt hoặc EXP.


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
| Reset | Giữ chín bảng `chua_loi_*` và lịch sử `loi_giai_hoi`, cùng hồ sơ học tập. |

## Học liệu và độ phủ

Học liệu được nhập tại màn vận hành giáo viên. JSON phải có đúng version câu gốc, 1–8 bước theo thứ tự và tiên quyết; mục tiêu/đại lượng/lý do/điều kiện/mối nối; chẩn đoán và câu phân biệt giả thuyết; gợi ý 1/2/3; ít nhất hai câu kiểm lý do, hai câu kiểm lại, hai câu chuyển giao; ít nhất hai bản ghép và hai bản kiểm chứng mới. Bộ kiểm cấu trúc từ chối sai kiểu JSON, đáp án không chấm được, thiếu ý, lý do chỉ là phép tính, trùng nội dung hoặc bản toàn bài thiếu kỹ năng. Phần I/II/III toàn bài giữ định dạng câu gốc. Ảnh/bảng/đề và các lựa chọn gốc được giữ khi học sinh xem lại.

Học liệu cần người duyệt chuyên môn kiểm đáp án, nhiễu, độ khó, điều kiện áp dụng và tính tương đương. Kiểm cấu trúc không thay thế việc này. Mẫu kỹ thuật đầy đủ ở `tests/_chua-cau-sai-fixture.ts::hocLieuMau`; đây là dữ liệu tổng hợp cho kiểm thử, **không được đăng nguyên mẫu làm học liệu cho kho thật**. Thầy lấy đúng đề/lời giải/version qua nút “Lấy đề gốc để soạn”, chuẩn bị theo cấu trúc và duyệt rồi nhập. Câu chưa đủ học liệu chuyển về hàng ưu tiên theo số em ảnh hưởng và hạn đo; không đưa câu chưa được kiểm cho em làm.

Không tự duyệt học liệu bằng tên thầy. Không sinh câu mới trong đường chấm, không đổi câu đang học khi bản học liệu mới được duyệt. Phiên dùng ảnh chụp đã lưu. Muốn bổ sung câu cho một bước hết bài mới: duyệt phần bổ sung dùng chung; em mở lại thì tự tiếp, bước đã hiểu giữ đúng nội dung cũ.

## Áp schema và bật cho tất cả học sinh

1. Chạy kiểm CI của PR. Với D1 thật, kiểm các migration CNH-1 đã có `su_kien_hoc.assistance/purpose/visibility/raw_json`, bảng kho/chỉ mục, ca và Tu luyện. Không coi việc năm bảng PR189 có mặt là đã đủ schema.
2. Chạy workflow **“Áp schema vòng chữa câu sai”** trên commit đã soát. Script `scripts/ap-migration-chua.mjs --remote` chỉ dùng ba tệp cố định: `migration-0710-chua-cau-sai.sql`, `migration-0710-vong-chua-chat-luong.sql`, `migration-z-0710-chua-giao-tu-so.sql`. Chỉ ADD cột chưa có, CREATE IF NOT EXISTS và kiểm hai trigger. Có thể chạy lại; không xoá/sửa dữ liệu cũ hoặc bật cờ. Workflow chỉ-thêm cũ từ chối chữ UPDATE trong trigger nên không dùng workflow đó cho tệp trigger này.
3. Phát hành Worker và Pages cùng commit. Workflow phát hành kiểm 0 ca mở, áp phần schema còn thiếu, đẩy Worker trước Pages, gắn tag commit và đọc lại hai bản sống. Workflow **Bật vòng chữa cho tất cả học sinh** chỉ chạy sau khi có mã lượt phát hành thành công + đúng commit trong `docs/phat-hanh-vong-chua-0710.json`; kiểm lại bản sống rồi bật toàn trường và bù lịch sử bằng chính hàm máy chủ. Receipt giữ vị trí tiếp và không tự bật lại sau khi thầy đã tắt. Phạm vi này đã được thầy cho phép; không chuyển về pilot giới hạn lớp/SBD.
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
npx vitest run tests/chua-cau-sai-chieu.test.ts tests/chua-cau-sai-chieu-giao-dien.test.tsx tests/chua-cau-sai-chat-luong.test.ts tests/chua-cau-sai-giao-dien.test.tsx tests/chua-cau-sai-0710.test.ts
npx vitest run --config vitest.config.d1.ts tests/d1-runtime-chua-cau-sai.test.ts
npx vitest run tests/migration-chua-cli.test.ts
node scripts/kiem-chua-trinh-duyet.mjs
```

Browser dùng Chromium thật ở 360/430/1280px với API fixture để kiểm bố cục, bàn phím, khung dialog, mất mạng và payload retry. Kiểm API/SQL dùng token thật với SQLite schema thật; kiểm D1 concurrency dùng workerd binding cục bộ. Đây là ba lớp bằng chứng riêng, không mô tả fixture browser là dữ liệu production hay kiểm thử với học sinh thật. Ảnh browser nằm ở thư mục `CHUA_ARTIFACT_DIR` (mặc định `/tmp/chua-browser`); CI lưu artifact.

Trạng thái phát hành, số kiểm thử và hạn chế còn lại được ghi ở `DIEU-PHOI.md` và mô tả PR. Không ghi “đã đạt 90%”, “đã lên D1 thật” hay “hoàn hảo thương mại” khi chỉ mới có kiểm thử kỹ thuật.

## Bằng chứng kỹ thuật của bản bàn giao 07/10

- Bộ kiểm tra liên quan gồm vòng chữa, Tu luyện, reset, Hỏi thầy, sổ chung, đồng bộ thi và cầu nối tờ chiếu: **363/363 đạt, 22 tệp**. Sau tối ưu tách mảnh Tổng quan và hủy phản hồi tải cũ: chạy lại 16 kiểm tra giao diện liên quan, đều đạt.
- Runtime workerd/D1 cục bộ: **4/4 đạt**, gồm tám lần phát, tám lần nộp và tám xác nhận Thầy chữa đồng thời, chỉ một receipt thắng.
- Wrangler/D1 cục bộ: nâng từ năm bảng PR189, chạy migration hai lần và giữ dữ liệu cũ: **1/1 đạt**.
- Chromium thật ở 360/430/1280 px: bố cục/phím/khung tự chữa, retry mất mạng và tờ chữa chung; nút Thầy chữa ghi qua cầu nối iframe thật. Ảnh `chua-lop-*` dùng dữ liệu tổng hợp.
- TypeScript server/app, build và kiểm màu đạt. Bộ lint phạm vi vòng chữa không có lỗi.
- Lượt toàn bộ của bản vòng tự chữa trước khi nối thẻ Câu cần chữa: 14.676 kiểm tra, 112 thất bại; **không có tên thất bại mới so với nền** (nền a4c56694 có 114). Hai kiểm tra cũ ở `giao-dien-to-chieu-1909.test.ts` về nhãn vùng làm bài cá nhân và hiệu ứng Đạt cũng đã thất bại trên nền. Bản nối màn chiếu được kiểm bằng bộ liên quan ở trên; không ghi rằng toàn repo xanh hoặc đã kiểm học sinh thật.

Trạng thái production sau bàn giao được ghi dưới đây; kiểm độ phủ học liệu và đo kết quả học sinh vẫn là điều kiện nghiệm thu chất lượng học tập, không được thay bằng dấu tích kiểm thử.

## Phát hành production 07/10

- Schema đã áp trên D1 thật: **9 bảng và 2 trigger**, chạy lại không xoá dữ liệu cũ. Run schema [37571086570](https://github.com/dodaihoc4869/omr-app/actions/runs/37571086570) thành công.
- Bản sống **5db00607750d19246a16922745eba71c054b71f9**: [run phát hành 37576102693](https://github.com/dodaihoc4869/omr-app/actions/runs/37576102693) thành công lúc 05:25 UTC (12:25 VN). Worker **db889489-c99a-4e84-9c01-d2b648975c64**, Pages **1c0b3b80**; đọc tag Worker và commit Pages đều khớp. `/`, `/hs`, `/ph`, `/gv` trả HTML app thật; phiên bản SW hợp lệ; hai cổng vòng chữa chưa đăng nhập trả 401/403 đúng quyền. 0 ca thi mở và 0 lượt đang làm tại cổng phát hành.
- CI đúng nguồn [37575854474](https://github.com/dodaihoc4869/omr-app/actions/runs/37575854474): 237 kiểm liên quan, 4 runtime D1, 1 migration CLI, 11 kiểm vận hành/Pages và trình duyệt thật 360/430/1280 px đều đạt. Đợt phát hành kiểm thêm 17/17, TypeScript/build/màu và SW **13/13**; precache **2.997 KB**. Cloudflare có thể truyền bản mới chậm: cổng kiểm chờ có giới hạn, vẫn từ chối 200 chứa trang lỗi và kiểm lại bản sống không đổi.
- Lượt toàn bộ ở bản **163572f0** (cùng cây app/server với bản **5db00607**): Node 22 ghi 14.634 kiểm, 14.496 đạt, 110 thất bại, 28 bỏ qua và 8 suite lỗi nạp/môi trường. 108 tên thất bại có trong nền; hợp đồng tab Lên bảng đã cập nhật để tính **Câu cần chữa**, kiểm thời gian Đoàn chạy lại đạt. CI hiện dùng Node 24 và kiểm D1 qua môi trường riêng; **không ghi toàn repo xanh**.
- [Run bật toàn trường 37576222174](https://github.com/dodaihoc4869/omr-app/actions/runs/37576222174) dùng receipt và đúng mã máy chủ đã phát hành. Đọc riêng D1 lúc 05:28 UTC: `bat:true`, `phamVi:tat_ca`; đồng bộ cũ đang chạy. Cập nhật kết quả cuối sau khi run kết thúc.

Bổ sung hiệu năng **7bdcfc8a** ([run 37577477241](https://github.com/dodaihoc4869/omr-app/actions/runs/37577477241), thành công 05:42 UTC): Worker **38a09832-7b13-485d-9b34-990aee155de1**, Pages **8caba84b**, đủ 9 bảng/2 trigger và năm đường sống đúng commit. Đồng bộ Tu luyện gom tối đa sáu cặp receipt/sổ: 13 câu dùng ba batch 12/12/2 lệnh. 69 kiểm liên quan và 6 runtime D1 cục bộ đạt; CI37577089807 đạt 237 kiểm liên quan, 6 D1, migration và Chromium. Lỗi giữa lô rollback cả receipt/sổ; receipt đã chấm riêng giữa lô và retry giữ đáp án/giờ đầu. Lần bù lịch sử tiếp theo đo 10 lượt trong khoảng 24–29 giây, trước đó khoảng 44–94 giây; đây là đo vận hành các lô khác nhau, không phải cam kết tốc độ toàn app.

**Lỗi cổng CI đã phát hiện và sửa:** điều kiện dùng `rg` trên runner không có lệnh này đã báo sai “không đổi mã chạy” ở các run đóng gói, gồm 37577477241. PR198 dùng Bash `[[ -s ]]` và coi thay đổi workflow phát hành là cần kiểm toàn bộ. Bảy kiểm chạy chính shell của workflow bằng git thật, PATH chỉ có git, đều đạt; lỗi đọc mốc hoặc workflow_dispatch vẫn chạy toàn bộ. Run **37577856730** đã chạy toàn repo Node 24 trên cây mã gom lô: **14.732 kiểm, 14.596 đạt, 108 thất bại, 28 bỏ qua; 3 suite lỗi nạp/môi trường**. Đối chiếu đủ 108 tên với nền114: **0 tên mới**. Ba suite `bang-tin-san-chong-chu-trinh-duyet-2109`, `cnh-1-0-job030-tro-giup`, `phieu-tuong-phan-trinh-duyet` cũng đã lỗi ở lượt trước. Không ghi toàn repo xanh; không dùng “success” của run đóng gói để nói bộ toàn repo đã đạt.

**Bản phát hành cuối 7cfe9466fb5fb4bf6ba80d6fa913967bf9ab5711:** run37577856730 thành công 05:57 UTC (12:57 VN), Worker **69e22330-d5e5-4744-a778-78abec6a89dd**, Pages **f7ec021a**, tag/commit cùng nguồn. Gate thật: năm đường giao diện/SW, hai cổng quyền, 9 bảng/2 trigger, 0 ca mở/0 lượt đang làm. SW13/13, cache2997KB. CI37577852272 cũng đạt 237 kiểm liên quan, 6 D1, migration, 11 kiểm vận hành/Pages và Chromium 360/430/1280. Run đồng bộ **37577943436** chạy tiếp từ receipt, giữ release đầu và ghi riêng `releaseHienTai` đã xác minh; kết quả dữ liệu thật được bổ sung sau khi run hoàn tất. Bản lùi trước đợt cuối: 7bdcfc8a / Worker38a09832-7b13-485d-9b34-990aee155de1 / Pages8caba84b.

## Hoàn tất bật toàn trường và rà dữ liệu cũ

Cờ production đã đọc riêng: `bat:true`, `phamVi:tat_ca`, `dongBoTuLuyen:true`. Đã đồng bộ đủ **474/474 lượt tự luyện**, giữ **6.381 receipt** cùng đáp án/giờ/ngày gốc. Không dùng dữ liệu do trình duyệt khai để viết lại kết quả cũ.

Tập giao lịch sử có hơn 13.000 cặp em/câu và tiếp tục nhận sự kiện mới qua trigger. Job chọn một lần từ sổ máy chủ với đúng điều kiện của `giaoPilot` toàn trường (công bố, ngày bắt đầu, em còn trong danh sách, lượt độc lập, loại chẩn đoán và trợ giúp); kiểm đối chiếu tập chọn với `giaoPilot` bằng SQL thật. Danh sách chỉ giữ trong bộ nhớ job, không in hay đính kèm mã em/câu vào nhật ký công khai. Worker riêng dùng một lần gọi đúng `giaoDotCuaEm` cho từng cặp và kiểm lại lỗi/công bố trước ghi. Cửa sổ tối đa 48 request độc lập chỉ ghi checkpoint khi tất cả đã trả thành công; lỗi giữa cửa sổ đợi các request còn lại xong rồi giữ checkpoint để retry idempotent. Không đổi ngày giao/hạn đo, không ghi điểm/EXP/kết quả học giả. Cổng riêng yêu cầu secret 256 bit có hạn dùng, chỉ nhận cặp em/câu từ job đã xác thực, không nhận SQL/đáp án và chỉ trả số tổng hợp. Có ca mở hoặc cờ tắt thì dừng. Worker được xoá sau job; bước `always` dọn đúng Worker của lượt bị huỷ. Công cụ lượt cũ chỉ dọn sau khi xác minh đúng nguồn/run_attempt và Actions đã dừng. Thay đổi này không thêm cổng vào Worker học sinh/giáo viên đang dùng.

26 kiểm vận hành (gồm tập chọn, chốt cửa sổ và chạy nguyên CLI đọc lại với API tổng hợp) và 8 runtime workerd/D1 đạt. Node fixture/SQLite không được ghi thành kiểm production. CI37582567042 đạt 237 kiểm liên quan, 7 D1, migration CLI, 30 vận hành/Pages và Chromium. CI37583565218 và37585399535 đã đạt (237 liên quan, 8 D1, migration, 33 vận hành/Pages và Chromium). Cây `src/` và `server/` của công cụ không đổi so với bản sống7cfe9466. Các lượt chuyển cách rà giữ checkpoint; bước dọn khi huỷ37582563038 đã đọc log thành công, không còn Worker cũ của lượt ấy.

**Kết quả cuối cần ghi sau khi Actions37585394077 kết thúc:** đọc lại cờ, hai receipt `tuXong/giaoXong`, bản Worker/Pages, số đợt đang mở và số Worker tạm còn lại. Không ghi đồng bộ hoàn tất nếu chỉ đọc được cờ đã bật.

**Mốc thiếu nội dung khi vừa bật:** kho mới có **0 học liệu `du_dung`**. Ngày07/10 lúc07:15UTC, Actions37586139922 đã nạp/đọc lại **1 bộ thật** được máy tính độc lập theo mẫu: 3 bước/28 probe/4 bản toàn bài; hồ sơ ghi máy, không gán thầy duyệt. Quy trình soạn/giải mù/soát chuyên môn cho các câu còn thiếu ở PR200. Chưa hoàn thành toàn hàng. Các đợt đủ quyền đã giao đang chờ học liệu; việc bật toàn trường không có nghĩa học sinh đã được phục vụ đầy đủ vòng chẩn đoán/tự gỡ/gặp lại. Không tự gán “thầy duyệt”, không đăng fixture kiểm thử làm nội dung thật. Cần chạy máy soạn đã đăng nhập để kiểm học liệu đúng phiên bản cho hàng câu sai ưu tiên, đọc lại đủ độ phủ rồi đo học sinh thật. Thầy đã giao máy tự kiểm, không chờ thầy duyệt từng câu. **Chưa đạt nghiệm thu thương mại về kết quả học tập và chưa chứng minh 90%.**

Tắt tính năng qua cấu hình vòng chữa (`bat:false`), giữ nguyên schema/receipt/điểm; không tự bật lại bằng chạy lại script. Bản đóng gói trước đợt này: `cb7b1f94`, Worker `d9efc0df-576b-4538-8ac5-0e9943cd4cb6`, Pages `c11083fa`. Khi lùi phải giữ Worker/Pages cùng nguồn; không DROP bảng hoặc chấm lại dữ liệu thật.
