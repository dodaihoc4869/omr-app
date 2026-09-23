# ĐỀ XUẤT TRIỂN KHAI TỪNG BƯỚC: CÁ NHÂN HÓA RÚT CÂU, ÔN TẬP VÀ EXP CHO BA APP

> **Bản giao cho Cline + DeepSeek:** dùng [prompt bắt đầu CNH-1.0](CLINE-BAT-DAU-CA-NHAN-HOA-2309.md) và [bộ đặc tả đã chốt](docs/cline-ca-nhan-hoa-2309/00-HUONG-DAN.md). Bộ này cụ thể hóa các phương án bên dưới thành 12 gói thi công, 42 yêu cầu, 50 tình huống kiểm thử và 48 bộ kết quả mẫu. Khi triển khai CNH-1.0, các quyết định trong bộ đó thay cho những lựa chọn chưa chốt của bản đề xuất này; phần giải thích và nghiên cứu bên dưới được giữ làm căn cứ. Chưa áp dụng code mới chỉ từ việc tạo tài liệu.

**Dành cho:** app Giáo viên, Học sinh, Phụ huynh của Thầy Đỗ Đại Học.

**Ngày lập:** 23/09/2026. **Phiên bản tài liệu:** 1.0.

**Trạng thái:** đề xuất để xem xét và làm căn cứ triển khai; các luật mới trong tài liệu chưa được áp dụng cho học sinh. Căn cứ hiện trạng là cuộc kiểm toán mã nguồn tại commit `36b83dd` và các phép thử tổng hợp đã chạy. Khi bắt đầu sửa, phải đối chiếu lại phiên bản mã và cờ máy chủ thực tế.

**Mục tiêu:** mỗi học sinh nhận bài thuộc phần mình đã học, có mức thử thách phù hợp, ôn đúng nhu cầu, nhìn thấy tiến bộ từng ngày và có lý do muốn quay lại. Học sinh chăm chỉ từ tài khoản mới không lên cấp 10 trước 12 ngày học đủ điều kiện; khiên đầu không mở trước 21 ngày đạt. EXP dư có công dụng rõ, đồng thời bảo vệ tiến trình học và quyền lợi đã tích lũy.

Tài liệu tự chứa các quyết định, công thức, thứ tự thực hiện và tiêu chí nghiệm thu. Các liên kết cuối tài liệu là bằng chứng bổ sung. Đây không phải cam kết một thuật toán bảo đảm mọi học sinh luôn hứng thú; hiệu quả phải được đo bằng việc nhớ lâu, tự giải được bài mới, tải học vừa sức và mức quay lại có học thật.

## Mục lục

1. [Các nguyên tắc và quyết định đề nghị](#nguyen-tac)
2. [Những vấn đề đã tái hiện](#hien-trang)
3. [Bước 01 — Chốt mốc đối chiếu và bản đồ các luồng](#buoc-01)
4. [Bước 02 — Chuẩn hóa câu hỏi và bảo đảm kết quả chấm](#buoc-02)
5. [Bước 03 — Xác định đúng phần đã học của từng em](#buoc-03)
6. [Bước 04 — Hợp nhất sự kiện học và hồ sơ cá nhân](#buoc-04)
7. [Bước 05 — Thống nhất cách xác định mức vừa sức](#buoc-05)
8. [Bước 06 — Thống nhất lịch ôn và chống lặp](#buoc-06)
9. [Bước 07 — Lập kế hoạch theo thời gian thực tế](#buoc-07)
10. [Bước 08 — Xây bộ chọn câu chung](#buoc-08)
11. [Bước 09 — Nối tất cả kênh và cả ba app](#buoc-09)
12. [Bước 10 — Điều chỉnh Đoàn Hộ Tống](#buoc-10)
13. [Bước 11 — Thiết kế trải nghiệm quay lại mỗi ngày](#buoc-11)
14. [Bước 12 — Hợp nhất EXP và thưởng tiến bộ](#buoc-12)
15. [Bước 13 — Lên cấp, khiên, mua đồ và EXP dư](#buoc-13)
16. [Bước 14 — Tối ưu máy chủ và đồng bộ nhiều thiết bị](#buoc-14)
17. [Bước 15 — Chuyển dữ liệu và bảo toàn quyền lợi](#buoc-15)
18. [Bước 16 — Kiểm thử và nghiệm thu](#buoc-16)
19. [Bước 17 — Chạy đối chiếu và thử nghiệm có kiểm soát](#buoc-17)
20. [Bước 18 — Phát hành theo đợt và theo dõi](#buoc-18)
21. [Bản đồ tệp và thứ tự thực hiện](#ban-do)
22. [Bằng chứng, mô phỏng và nghiên cứu](#nguon)

<a id="nguyen-tac"></a>
## 1. Các nguyên tắc và quyết định đề nghị

### 1.1. Điều phải giữ trong toàn bộ thiết kế

1. Phạm vi học của em được xác minh trước khi xếp độ khó; cùng lớp không đồng nghĩa với đã học giống nhau.
2. Nhớ lại một đáp án, hiểu cách giải và vận dụng sang bài mới là ba loại bằng chứng khác nhau.
3. Năng lực học quyết định độ khó; cấp thần thú quyết định tiến trình hình ảnh và phần thưởng.
4. Mọi bài tự động cùng dùng một ngân sách ngày, một hồ sơ và một lịch sử giao câu.
5. Thời gian tính cả làm bài, đọc phản hồi và chữa sai. Không ép số câu tối thiểu bất chấp tốc độ.
6. Lặp lại có mục đích; không phát lại bản sao chỉ để lấp đủ số câu hoặc tạo EXP.
7. Khi học sinh sai, hệ thống phải đổi cách hỗ trợ và có đường quay lại sau khi em hiểu.
8. Thầy có quyền giao bài mới, bài chung hoặc bài kiểm tra. Các bài đó được gắn mục đích rõ, không lẫn với bài ôn tự động.
9. Điểm thi, hồ sơ học và EXP có chức năng khác nhau, nhưng đều dùng cùng kết quả chấm đã xác minh.
10. Máy chủ xác định kết quả, thời điểm ghi nhận, quyền nhận thưởng và hạn mức. Ba app chỉ trình bày cùng trạng thái đó.
11. Không reset cấp, đồ, EXP hay thành tích đã có khi đổi thuật toán. Mọi chuyển đổi phải đối chiếu được.
12. Giữ yêu cầu gọi lên bảng bằng nút bấm, không đưa thời gian tự gọi trở lại. Thời gian lập kế hoạch học là cơ chế khác.

### 1.2. Cấu hình khởi đầu được đề nghị

Các giá trị trong bảng là đề xuất sản phẩm, trừ hai mốc tối thiểu thầy đã yêu cầu. Chúng cần có phiên bản để thử nghiệm và điều chỉnh.

| Nội dung | Đề nghị | Ý nghĩa |
|---|---|---|
| Thời gian mặc định | 20 phút/ngày; có lựa chọn buổi ngắn khi cần | Số câu thay đổi theo câu và theo em |
| Bài chính | Nhắm khoảng 80–90% khả năng tự làm đúng khi mô hình đã đủ tin cậy | Chưa đủ dữ liệu thì dùng quy tắc bảo thủ, không bịa xác suất |
| Nâng đỡ | Bắt đầu dễ hơn, khoảng 85–95% nếu có ước lượng đáng tin | Đưa em về bước nền còn làm được |
| Thử thách | Thường tối đa 1 câu trong lượt 6 câu, tự chọn | Không dùng kết quả câu này để tước đạt ngày |
| Lịch nhớ | FSRS hiện có là chuẩn đối chứng; kiểm tra mô hình mới riêng | Không đồng nhất lịch nhớ với độ khó |
| Thu nhập cốt lõi | Tổng 220 EXP khi hoàn thành kế hoạch hợp lệ | Bao gồm thưởng sự kiện và phần bù, không cộng chồng |
| Thu nhập tự chọn | Trần 120 EXP/ngày trên tất cả kênh | Chỉ trả cho học thêm có giá trị được xác minh |
| Hấp thụ lên cấp | Tối đa 200/ngày đạt; 120/ngày có học hợp lệ chưa đạt | Cần có EXP trong ví; đây là trần tiêu thụ |
| Cấp 10 | 2.400 EXP; sớm nhất 12 ngày hấp thụ tối đa | Không mua lượt vượt trần |
| Khiên đầu | Cấp ≥10 và 21 ngày đạt; dùng 21 mảnh, không mất EXP | Một quyền nhận chung cho quà và rèn |
| Khiên tiếp theo | Thêm 21 mảnh +300 EXP; sau chi còn ít nhất 400 | Không nhân đôi khiên ở cùng mốc |
| Dự trữ | 400 EXP trước khi đổi vàng hoặc rèn | Tách số dư ví với số có thể tiêu |
| Gián đoạn | Giữ thành tích và tài sản; có kế hoạch quay lại | Đề xuất bỏ mất khiên chỉ vì vắng/chưa đạt |
| Sau cấp 10 | Có phương án đường cấp 120 trong khoảng 365 ngày học đủ | Lựa chọn riêng, không tự động gộp vào đợt sửa lỗi |

Các tỷ lệ thành công, trọng số chọn câu, ngưỡng tăng bậc và phần thưởng mới phải được gọi là tham số thử nghiệm. Không ghi chúng thành “mức tối ưu được khoa học bảo đảm”.

<a id="hien-trang"></a>
## 2. Những vấn đề đã tái hiện

Tám phép thử dưới đây dùng hàm sản phẩm và dữ liệu giả lập. Chúng chứng minh hành vi của mã tại mốc kiểm toán, chưa xác định số học sinh thật bị ảnh hưởng.

| Mã | Hành vi đã tái hiện | Bước xử lý |
|---|---|---|
| A01 | Đặt 10 phút, tốc độ 240 giây/câu → mục tiêu 8 câu, ước tính 32 phút | 07 |
| A02 | Câu có 3 lỗi cũ vẫn bị game loại sau khi đã đúng lại và đến hạn | 05–06 |
| A03 | Bốn câu dễ đúng cùng ngày → bậc hồ sơ 2, trong khi bậc game vẫn 0 | 04–05 |
| A04 | Câu từng sai từ lâu tiếp tục đủ điều kiện +6 “lên bậc” ở các ngày đúng sau | 12 |
| A05 | Nhánh bù của phụ huynh có thể chọn câu Hiểu cho dạng đang bậc Biết | 08–09 |
| A06 | Ngày đạt thứ 21, cấp 10, 21 mảnh và ví 700 → có thể có cả khiên quà lẫn khiên rèn | 13 |
| A07 | Ngân sách 8 câu nhưng ghép 4 câu Mom +3 câu ôn +6 câu game thành 13 | 07–09 |
| A08 | Ôn đúng câu đến hạn chưa từng sai có thể vẫn bị báo thiếu “lên bậc” để đạt ngày | 07–12 |

A06 là điểm cần chọn chính sách: nhận hai khiên vào ngày 21 không vi phạm riêng yêu cầu “khiên đầu không trước ngày 21”. Đề xuất trong tài liệu siết hơn: mỗi khiên mới tiêu thụ 21 mảnh từ ngày đạt, để tiến trình dễ hiểu và không trả hai lần cho cùng mốc.

<a id="buoc-01"></a>
## Bước 01 — Chốt mốc đối chiếu và bản đồ các luồng

**Mục đích:** sửa đúng đường đang chạy và có cơ sở đối chiếu trước/sau.

**Đầu vào:** phiên bản mã hiện tại, cấu hình môi trường, danh sách cờ bật theo học sinh/lớp, các đường giao bài và ghi sổ.

**Thực hiện:**

1. Ghi commit, phiên bản Worker, phiên bản ba app và schema dữ liệu. Phân biệt bản cục bộ với bản đã phát hành.
2. Lập bảng từng kênh: nơi lấy ứng viên, nơi lọc phạm vi, nơi quyết độ khó, chống lặp, giữ bài đang mở, chấm, ghi tiến bộ, ghi EXP.
3. Bao gồm Đảo mới, Đoàn, repair/tower/arena/Linh Tâm và các nhánh cờ lùi; không chỉ kiểm một màn học sinh.
4. Tách bài tự động cá nhân khỏi đề thầy chủ động rút, gọi lên bảng và đề thi thử toàn chương trình.
5. Ghi cờ đang bật và mốc chuyển EXP của từng nhóm. Cờ chưa đọc thực tế phải để trạng thái chưa xác minh.
6. Lưu kết quả tám phép thử A01–A08 làm bộ tái hiện trước khi sửa. Khi sửa xong, bổ sung kiểm thử hành vi mong muốn; chương trình kiểm toán hiện tại đang xác nhận hành vi cũ nên không được coi là bộ test “đã sửa”.
7. Đo một tập dữ liệu tổng hợp đại diện hồ sơ ít/nhiều lịch sử, kho nhỏ/lớn để có mốc CPU, số truy vấn và lượng dữ liệu đọc.

**Đầu ra:** bảng luồng đang dùng, bảng cờ, bằng chứng trước sửa và danh sách tệp bị tác động.

**Nghiệm thu:** mỗi kênh có điểm vào, bộ chọn và nguồn thưởng xác định; không ghi mã cũ không có nơi gọi thành lỗi của màn hiện tại.

<a id="buoc-02"></a>
## Bước 02 — Chuẩn hóa câu hỏi và bảo đảm kết quả chấm

**Mục đích:** cá nhân hóa từ dữ liệu đáng tin. Nếu đáp án hoặc nhãn sai thì mô hình tốt vẫn đưa ra quyết định sai.

### 02.1. Chuẩn hóa cấu trúc

| Trường | Chức năng |
|---|---|
| `qid` | Mã câu ổn định |
| `question_version` | Phiên bản nội dung và đáp án |
| `content_group` | Nhận diện bản sao cùng nội dung |
| `family_id` | Nhóm bài cùng cấu trúc/phương pháp giải |
| `skill_ids` | Kỹ năng thực sự được kiểm tra |
| `prerequisite_ids` | Những kiến thức nền cần có |
| `difficulty_label` | Biết/Hiểu/Vận dụng do chuyên môn gắn |
| `part`, `subitems` | Phần I/II/III; các ý riêng của Phần II |
| `answer_policy_version` | Quy tắc chấm, làm tròn, đơn vị, biểu thức được chấp nhận |
| `quality_status` | Đã duyệt/thiếu nhãn/cần kiểm tra/tạm ngừng |
| `time_features` | Độ dài, số bước ước tính, hình/bảng và số ý |

Tên trường là thiết kế đề xuất, không khẳng định các cột đều đã tồn tại.

### 02.2. Làm theo thứ tự

1. Thống kê tỷ lệ thiếu dạng, thiếu kiến thức nền, thiếu đáp án, nhãn mâu thuẫn và câu trùng.
2. Chuẩn hóa `content_group`; giữ phân biệt với `family_id`. Đổi số hoặc đổi tên chất có thể vẫn cùng phương pháp, chưa đủ coi là một bằng chứng độc lập hoàn toàn.
3. Gán family trước cho nhóm câu thường được rút và nhóm gây lặp nhiều. Câu chưa rõ family không dùng để chứng nhận chuyển giao; chỉ rút bảo thủ sau kiểm tra nội dung.
4. Kiểm các đáp án mẫu gồm dấu phẩy/chấm thập phân, Unicode, phân số, phép tính, đơn vị và làm tròn. Chế độ thi có thể nghiêm hơn chế độ luyện, nhưng phải là chính sách có phiên bản và được thể hiện rõ.
5. Lưu riêng kết quả từng ý Phần II để sửa đúng kiến thức. Điểm thi vẫn theo quy chế chấm của đề; không suy toàn bộ em “không biết” chỉ vì sai một ý.
6. Câu có báo cáo lỗi được thầy xét. Khi xác nhận đáp án sai: phát sự kiện sửa điểm, dựng lại hồ sơ liên quan và bù quyền lợi đúng một lần.
7. Nếu nội dung/đáp án đổi khi bài đang mở, phục vụ và chấm theo snapshot hợp lệ của lượt hoặc hủy câu có giải thích; không chấm đáp án cũ bằng đề mới.

**Đầu ra:** kho câu có trạng thái chất lượng, danh sách cần duyệt và bảng liên kết câu–family–kỹ năng.

**Nghiệm thu:** câu chưa đủ điều kiện không lọt vào bài tự động; bản sao không tăng số bằng chứng; chấm sửa có đường phục hồi hồ sơ và EXP.

<a id="buoc-03"></a>
## Bước 03 — Xác định đúng phần đã học của từng em

**Mục đích:** không suy “cả lớp đã học” thành “em này đã học”, và không suy “đã gặp” thành “đã hiểu”.

**Thực hiện:**

1. Lập hồ sơ phạm vi theo học sinh × kỹ năng, lưu nguồn, thời điểm và phiên bản xác nhận.
2. Phân biệt bốn tình trạng: chưa có dữ liệu; đã được dạy/đã học có bằng chứng; đang cần hỗ trợ; có bằng chứng tự làm ở mức cụ thể.
3. Thầy có thể xác nhận nội dung cho nhóm học sinh; hệ thống giữ thành danh sách cá nhân và hỗ trợ ngoại lệ em nghỉ, chưa học bù hoặc học khác tiến độ.
4. Kết quả bài thi/BTVN được dùng làm bằng chứng “đã gặp”. Với câu sai, chỉ mở đường chẩn đoán và hỗ trợ phù hợp; không dùng nó để mặc định mở toàn bộ mức khó.
5. Câu tự động mới phải thỏa toàn bộ kiến thức tiên quyết trong chính hồ sơ em. Chỉ chung tên chương không đủ.
6. Câu trộn nhiều kỹ năng chỉ được rút khi tất cả kỹ năng nền hợp lệ. Nếu thiếu nhãn thì loại khỏi chọn tự động và báo thiếu nguồn.
7. Đề chưa công bố, câu bảo vệ, BTVN chưa nộp và bản sao nội dung phải được kiểm ở máy chủ trước khi phát câu có lời giải.
8. Với học sinh mới, lấy 4–6 câu chẩn đoán ngắn trong phần thầy xác nhận đã học; chia qua nhiều buổi nếu ngân sách không đủ. Nếu chưa có xác nhận phạm vi thì hướng về bài thầy giao, không mở ngẫu nhiên kho lớp.
9. Luyện đề toàn chương trình cần một quyền riêng trên máy chủ. Tự đánh dấu “đã học xong” ở trình duyệt chưa phải bằng chứng đủ để tự động mở toàn bộ nội dung.

**Đầu ra:** một hàm kiểm phạm vi dùng chung, trả `được phép/không được phép` và lý do.

**Nghiệm thu:** kiểm được trường hợp hai em cùng lớp học khác phần; một em nghỉ bài mới; câu tích hợp có một kiến thức nền chưa học; cập nhật phạm vi giữa hai thiết bị.

<a id="buoc-04"></a>
## Bước 04 — Hợp nhất sự kiện học và hồ sơ cá nhân

**Mục đích:** mọi kênh phản ánh cùng một học sinh; làm ở game hoặc phụ huynh đều bổ sung cùng hồ sơ.

### 04.1. Sự kiện học tối thiểu

Mỗi sự kiện cần chứa: mã học sinh, mã lần làm, nguồn, câu và phiên bản, family, kỹ năng, mục đích câu, kế hoạch/lượt liên quan, giờ máy chủ, ngày Việt Nam, đáp án và kết quả từng phần, mức trợ giúp, việc đã xem lời giải, thời gian làm hợp lệ, phiên bản chấm và chính sách chọn.

Các trường quan trọng phải được máy chủ xác minh. Không chỉ tin cờ trình duyệt tự khai là “không dùng gợi ý”. Nếu máy chủ đã phát lời giải/gợi ý cho lần làm thì bằng chứng tương ứng phải giữ trạng thái có hỗ trợ.

### 04.2. Thực hiện

1. Lập các bộ chuyển đổi nguồn thi, BTVN, ôn, Mom, lên bảng, game, thử thách về cùng định dạng sự kiện.
2. Mỗi lần làm có khóa duy nhất. Gửi lại cùng yêu cầu sau mất mạng trả lại kết quả cũ, không tạo lần làm mới.
3. Một lần chấm sửa là sự kiện điều chỉnh có liên kết tới bản gốc; không âm thầm sửa lịch sử mà mất dấu.
4. Dựng bốn phần hồ sơ riêng: phạm vi học; trí nhớ từng câu; năng lực từng kỹ năng/family; tải và thời gian.
5. Tách bằng chứng tự làm lần đầu khỏi làm lại sau gợi ý/xem lời giải. Cả hai có ích nhưng không có trọng lượng đánh giá như nhau.
6. Lưu snapshot kèm con trỏ sự kiện và phiên bản mô hình. Cùng lịch sử và phiên bản phải dựng ra cùng kết quả.
7. Khi sự kiện tới muộn hoặc bị chấm sửa, phát lại phần bị ảnh hưởng theo thứ tự chuẩn, không chỉ cộng trừ vài bộ đếm gần nhất.
8. Dùng một bảng trạng thái dạng chung cho giáo viên, học sinh và phụ huynh; không giữ định nghĩa “yếu” khác nhau trong game.

**Đầu ra:** sổ học hợp nhất, bộ dựng hồ sơ và dữ liệu kiểm tra bằng chứng.

**Nghiệm thu:** một em với cùng sự kiện có cùng hồ sơ ở ba app; đảo thứ tự nhận qua mạng không làm đổi kết quả cuối; trợ giúp không trở thành bằng chứng độc lập.

<a id="buoc-05"></a>
## Bước 05 — Thống nhất cách xác định mức vừa sức

**Mục đích:** khắc phục A02–A03 và tránh nhảy bậc chỉ nhờ làm đúng vài câu dễ.

### 05.1. Tách ba con số

- `working_level`: mức câu đang dùng để luyện hôm nay.
- `validated_level`: mức đã có bằng chứng tự giải phù hợp.
- `confidence`: mức đủ dữ liệu để tin đánh giá; không được trình bày như điểm năng lực tuyệt đối khi mẫu ít.

Cấp thần thú không được đưa vào công thức này.

### 05.2. Quy tắc khởi đầu có thể kiểm tra

1. Khi ít dữ liệu, bắt đầu từ mức thấp trong phần đã học hoặc mức thầy xác nhận; dùng câu chẩn đoán để điều chỉnh.
2. Đếm thành công theo các family độc lập; nhiều bản sao đúng không làm tăng độ tin cậy tương ứng nhiều câu mới.
3. Đề nghị mở một câu thăm dò bậc kế tiếp khi đã có ít nhất 5 family ở bậc đang luyện, qua ít nhất 2 ngày học, đúng ít nhất 4/5 bằng chứng gần nhất và không có lỗi nền chưa xử lý. Đây là ngưỡng ban đầu cần thử nghiệm, chưa phải chuẩn khoa học cố định.
4. Đúng một câu thăm dò chỉ mở cơ hội luyện bậc mới; để xác nhận bậc mới phải có bằng chứng ở chính bậc đó qua nhiều family và ngày khác nhau. Không suy Vận dụng từ toàn câu Biết.
5. Sau hai lỗi liên tiếp trong lượt, kiểm xem lỗi do kiến thức, đọc đề, thao tác hay giới hạn thời gian. Chuyển sang hỗ trợ nếu cần; không hạ vĩnh viễn toàn bộ hồ sơ vì hai lần sai.
6. Sau ba lỗi độc lập chưa được chữa của cùng vấn đề trong một đợt, chuyển sang trạng thái cần dạy lại. Cho bài mẫu/kiến thức nền, rồi một biến thể tự làm để mở trạng thái đang phục hồi.
7. Khi có bằng chứng phục hồi, bỏ chặn theo lỗi cũ. Việc nhớ lâu được kiểm tiếp bằng lịch ôn; một câu đúng ngay sau bài mẫu chưa đủ chứng nhận ổn định lâu dài.
8. Đặt trọng lượng lớn hơn cho bằng chứng gần đây, độc lập và chuyển giao. Giữ lịch sử cũ để đối chiếu nhưng không để lỗi nhiều tháng trước luôn chiếm suất “yếu”.

### 05.3. Nâng cấp mô hình khi đủ dữ liệu

Ban đầu dùng các quy tắc minh bạch và ước lượng có co về mức chung khi ít mẫu. Có thể dùng Beta–Binomial cho thống kê theo kỹ năng/bậc; về sau dùng mô hình logistic/IRT đã hiệu chỉnh với độ khó câu. Đánh giá trên dữ liệu đến sau thời điểm huấn luyện; tránh dùng tương lai để dự đoán quá khứ.

Xác suất giải đúng bài mới khác xác suất nhớ lại của FSRS. Chỉ đưa tỷ lệ 80–90% vào quyết định khi đã kiểm tra sai lệch dự báo theo nhóm học sinh và loại câu. Khi chưa đủ tin, quay về nhãn chuyên môn và ngưỡng bằng chứng.

**Đầu ra:** một hàm đánh giá mức dùng chung, giải thích được bằng câu và lần làm cụ thể.

**Nghiệm thu:** bốn câu dễ không tự xác nhận Vận dụng; lỗi cũ đã phục hồi không chặn mãi; học sinh mới chọn thú nhưng đã có năng lực không bị giới hạn học theo cấp thú.

<a id="buoc-06"></a>
## Bước 06 — Thống nhất lịch ôn và chống lặp

**Mục đích:** phân biệt ôn để nhớ, luyện để hiểu và luyện lại sau lỗi; xử lý A02 mà vẫn hạn chế học thuộc đáp án.

### 06.1. Quy tắc theo tình trạng

| Tình trạng | Cách chọn | Cách ghi nhận |
|---|---|---|
| Tự làm đúng, chưa đến hạn | Không ưu tiên lại nguyên câu | Không tạo thưởng ôn đến hạn |
| Đến hạn | Đưa vào hàng ôn chung của em | Đúng được tính ôn duy trì, kể cả chưa từng sai |
| Vừa sai | Phản hồi đúng chỗ vướng, có gợi ý/bài nền | Giữ kết quả đầu làm bằng chứng |
| Làm lại sau hướng dẫn trong buổi | Có thể quay lại sau vài câu xen giữa khi còn thời gian | Ghi học lại ngắn hạn; không nhân mốc nhớ dài hạn |
| Sai nhiều chưa phục hồi | Tạm ngừng cùng câu, chuyển nhiệm vụ dạy lại | Có tiêu chí ra khỏi trạng thái, không cấm vô thời hạn |
| Làm đúng biến thể mới | Cập nhật kỹ năng/family | Không tự ghi rằng em vừa ôn chính câu gốc |
| Kho nhỏ | Giảm số câu, đổi dạng phù hợp hoặc kết thúc | Không lấy câu chưa học/quá khó để lấp |

### 06.2. Triển khai theo thứ tự

1. Giữ FSRS-6 hiện có làm chuẩn đối chứng; không đồng thời đổi mô hình, dữ liệu và phần thưởng ngay trong một đợt khó tách nguyên nhân.
2. Lưu đủ trạng thái mô hình, thời điểm quan sát và phiên bản; không chỉ lưu ngày ôn tiếp theo.
3. Giai đoạn đầu giữ cách gộp tối đa một quan sát độc lập mỗi câu/ngày Việt Nam; làm lại sau xem lời giải không được kéo xa mốc. Cần kiểm các nguồn đều truyền đúng trạng thái hỗ trợ.
4. Đưa điều kiện đúng nghỉ 30 ngày, chặn 3 ngày/14 ngày về cùng mô-đun quyết định. Các chế độ có mục tiêu khác vẫn có ngoại lệ có tên và lý do; câu đến lịch không bị lệnh cấm cũ chặn vô tình.
5. Dùng `content_group` ngăn bản sao nguyên nội dung; dùng `family_id` để tránh nhiều bài cùng cấu trúc liên tiếp.
6. Trong lượt thường 6 câu: mặc định tối đa một câu mỗi family; cho phép hai khi đang chữa lỗi có chủ đích, có câu khác xen giữa và còn ngân sách.
7. Lượt thử lại trong cùng buổi có thể bắt đầu với 2–4 câu xen giữa hoặc khoảng 5–10 phút; đây là giả thuyết thiết kế, không là lịch cố định bắt buộc cho mọi buổi.
8. Khi backlog ôn lớn, chọn theo nguy cơ quên, mức quan trọng và thời gian; chia qua các ngày. Ghi rõ phần còn lại, không yêu cầu học sinh trả hết nợ ôn để được công nhận hôm nay.
9. Mô hình lịch mới, gồm FSRS-7, chỉ được chạy đối chiếu trên bản sao dữ liệu trước. So độ chính xác dự báo, số phút ôn và độ ổn định lịch, rồi mới cân nhắc chuyển.

**Đầu ra:** bộ lập lịch chung và quy tắc lặp có lý do; dữ liệu tách nhớ câu với chuyển giao kỹ năng.

**Nghiệm thu:** câu đến hạn không bị chặn bởi cooldown sai; bản sao không thành câu mới; một em dùng nhiều màn không nhận cùng câu ngoài chủ đích; có đường phục hồi sau ba lỗi.

<a id="buoc-07"></a>
## Bước 07 — Lập kế hoạch theo thời gian thực tế

**Mục đích:** giải quyết A01, A07, A08; mỗi ngày có mục tiêu khả thi và điểm kết thúc rõ.

### 07.1. Tính ngân sách

1. Lấy số phút em/phụ huynh đã chọn; mặc định 20 phút. Buổi ngắn có thể 5–8 phút, không ép sàn 8 câu.
2. Ước lượng thời gian câu theo phần, số ý, độ dài, hình/bảng, bậc và tốc độ gần đây của em. Chưa đủ mẫu thì dùng mức chung bảo thủ của loại câu.
3. Tách thời gian đang tương tác khỏi thời gian tab nền, mất kết nối hoặc tạm dừng. Không dùng tốc độ làm bằng chứng duy nhất về hiểu bài.
4. Cộng dự kiến thời gian phản hồi và chữa sai. Với dữ liệu mới có thể dành khoảng 20–30% buổi cho phần này rồi điều chỉnh bằng quan sát; tỷ lệ là giả định khởi đầu.
5. Quy định bất biến: tổng thời gian kế hoạch tự động, gồm phản hồi, không vượt ngân sách đã chọn. Đếm câu để trình bày, không dùng số câu thay thời gian.
6. Nếu chưa có câu nào vừa khoảng còn lại, dừng hoặc chọn nhiệm vụ ngắn hợp lệ; không thêm nguyên lượt game 6 câu chỉ vì còn một ít chỗ.

Ví dụ: buổi 10 phút, mỗi câu cần 4 phút. Nếu thêm phản hồi thì 2 câu đã có thể gần hết buổi; không thể đặt mục tiêu 8 câu rồi ghi là phù hợp 10 phút.

### 07.2. Phối hợp với bài thầy giao

1. Gom BTVN, Mom, ôn đến hạn và mục tiêu kỹ năng của hôm nay; khử trùng công việc theo câu/family trước khi tính tải.
2. Đưa chặng bài thầy giao phù hợp vào phần cốt lõi trước. Một câu trong BTVN cũng có thể đáp ứng mục tiêu ôn, nhưng chỉ tính một lần làm và một phần thưởng.
3. Nếu việc bắt buộc vượt thời gian, giữ nguyên bài và hạn gốc, thể hiện phần vượt cho thầy; đề nghị chia chặng/gia hạn. Không tự xóa nghĩa vụ của em.
4. Mục tiêu tiến bộ trong ngày tính trên chặng khả thi đã chốt. Bài tồn quá tải cần xử lý riêng, không tạo điều kiện khiến em không bao giờ đạt ngày dù đang tiến bộ.
5. Bài phụ huynh tự giao thêm dùng phần còn lại; khi hết ngân sách, gợi ý để ngày sau. Nếu thầy/phụ huynh chủ động tăng tải, ghi rõ quyết định và tổng thời gian mới.
6. Kế hoạch đang làm chỉ điều chỉnh phần chưa mở. Mục tiêu không được âm thầm tăng thêm ngay khi em sắp hoàn thành.

### 07.3. Định nghĩa đạt ngày

Một kế hoạch phải chốt trước: mục tiêu, công việc cốt lõi, tiêu chí bằng chứng, thời gian dự kiến và những gì được tính là hoàn thành.

| Loại mục tiêu | Bằng chứng hoàn thành đề nghị |
|---|---|
| Ôn duy trì | Hoàn tất tập ôn đã chốt và tự nhớ được phần yêu cầu; không cần từng sai |
| Chữa lỗi | Qua bước hướng dẫn cần thiết, sau đó tự giải được ít nhất một biến thể phù hợp |
| Củng cố dạng | Tự làm những câu thuộc mức đang luyện, đủ tiêu chí đã chốt theo số cơ hội thực tế |
| Chặng BTVN | Hoàn thành chặng khả thi và có bằng chứng học hợp lệ; bài đang tranh chấp đáp án không làm em mất quyền lợi |
| Buổi quay lại | Hoàn thành mục tiêu phục hồi ngắn đã chốt; không yêu cầu trả hết backlog |

Không đặt một tỷ lệ đúng tuyệt đối cho mọi loại mục tiêu. Với dạng mới hoặc buổi chữa lỗi, tiến bộ có thể là tự thực hiện được một bước trước đó chưa làm được. Lần bấm ngẫu nhiên, xem lời giải rồi chép hoặc chỉ hết giờ không đủ để hoàn thành. Ngày toàn sai được ghi công học hợp lệ và cần hỗ trợ; chưa tự gán bằng chứng đã tự làm được.

Cần có ba trạng thái rõ: **đạt / có học chưa đạt / chưa có bằng chứng học**. Trạng thái có học phải dựa trên công việc hợp lệ của kế hoạch, thay cho sàn 4 qid áp dụng bất kể câu dài hay ngắn. Các trường hợp nghi vấn hoặc thiếu dữ liệu không tự kết luận gian lận, cần giữ trạng thái chờ xác minh.

**Đầu ra:** kế hoạch ngày có phiên bản, mục tiêu khả thi, lý do chọn và tiêu chí đạt.

**Nghiệm thu:** A01 không vượt thời gian; A07 không ghép thừa lượt; A08 công nhận ôn duy trì; buổi yếu cần hỗ trợ và buổi khá giỏi có mức thử thách khác nhưng cùng cách ghi nhận hoàn thành cá nhân.

<a id="buoc-08"></a>
## Bước 08 — Xây bộ chọn câu chung

**Mục đích:** một nơi quyết định chọn câu; các màn cung cấp mục đích và cách trình bày.

### 08.1. Đầu vào và đầu ra

Đầu vào: học sinh, phạm vi học, hồ sơ kỹ năng, lịch nhớ, kế hoạch còn lại, nguồn câu, câu đang bảo vệ/giữ chỗ, lịch sử gần đây, chế độ học và phiên bản chính sách.

Đầu ra mỗi câu: qid, phiên bản, mục đích, kỹ năng/family, thời gian dự kiến, mức phù hợp, lý do chọn, mã giữ chỗ. Thiếu câu thì trả số thiếu và nguyên nhân cụ thể, không báo “quá khó” cho mọi trường hợp.

### 08.2. Thứ tự xử lý bắt buộc

1. Loại câu chưa duyệt, đáp án lỗi, không phục vụ được hoặc phiên bản không khớp.
2. Lọc phạm vi cá nhân và toàn bộ kiến thức nền.
3. Chặn đề bảo vệ, bản sao đề bảo vệ, BTVN chưa nộp có nguy cơ lộ lời giải.
4. Lọc giữ chỗ đang hiệu lực và câu đã làm hôm nay, trừ mục đích luyện lại được khai báo rõ.
5. Chia ứng viên theo mục đích: ôn đến hạn, chữa lỗi, củng cố, chuyển giao, thử thách.
6. Áp trần độ khó của từng kỹ năng cho từng mục đích. Nhánh bù luôn giữ trần; không lén tăng một bậc để đủ số.
7. Chấm điểm trong tập hợp hợp lệ và chọn dưới ngân sách thời gian.
8. Kiểm tỷ lệ family, thứ tự xen kẽ và phần dài/ngắn theo năng lực và thời gian.
9. Giữ chỗ nguyên tử rồi mới trả câu. Yêu cầu đồng thời thua giữ chỗ phải chọn lại phần chưa chốt.
10. Chỉ nạp đầy đủ nội dung những câu đã được chọn; ghi lý do và phiên bản để kiểm toán.

### 08.3. Công thức khởi đầu

Các thành phần chuẩn hóa về 0–1:

```text
điểm chọn = 0,30 × nhu cầu sửa lỗi
           + 0,25 × nhu cầu ôn
           + 0,20 × giá trị chuyển giao
           + 0,15 × độ phù hợp với khả năng tự làm
           + 0,10 × thiếu độ phủ
           − mức trùng lặp
           − mức mệt/tải không phù hợp
```

Đây là công thức để thử có đối chứng. Nguy cơ quên và mức quan trọng cùng quyết định nhu cầu ôn; số ngày quá hạn chỉ là một tín hiệu. Không cho điểm mới lạ bù cho việc chưa học kiến thức nền.

Có thể dùng chọn tham lam theo giá trị trên thời gian sau khi đã giữ các mục tiêu cần thiết. Không phải cứ câu ngắn sẽ tốt hơn: cần kiểm độ phủ mục tiêu và tránh toàn câu dễ để tăng số lượng. Khi bằng điểm, dùng seed theo em/ngày/phiên bản để ổn định qua hai máy.

### 08.4. Khi không đủ câu

Thứ tự đề nghị: cùng kỹ năng đúng mức → cùng kỹ năng thấp hơn nếu giúp mục tiêu → kỹ năng đã học khác trong kế hoạch → lượt ngắn hơn. Không mở rộng sang phần chưa học. Câu khó hơn chỉ xuất hiện trong phần thử thách tự chọn, có kiểm tra nền tảng.

**Đầu ra:** bộ chọn chung có lý do, các bộ chuyển đổi cho từng kênh và danh sách nguyên nhân thiếu nguồn.

**Nghiệm thu:** A05 hết tăng bậc ở nhánh bù; cùng dữ liệu và phiên bản cho cùng lựa chọn; mọi câu có lý do; không đổi phạm vi khi kho nhỏ.

<a id="buoc-09"></a>
## Bước 09 — Nối tất cả kênh và cả ba app

**Mục đích:** tránh có thuật toán chung nhưng một màn vẫn đi đường riêng.

| Kênh | Thay đổi cần làm |
|---|---|
| BTVN nâng đỡ | Giữ lõi/ghim thầy chủ động chọn; phần riêng dùng hồ sơ chung; thích nghi chỉ phần chưa mở; tính tải theo thời gian |
| Ôn hằng ngày | Dùng hàng đến hạn chung, tính cả duy trì và chữa lỗi |
| Phụ huynh hằng ngày | Lấy phần còn lại của kế hoạch; giữ chỗ trước khi phát; không tự bù lên bậc |
| Bài phụ huynh giao thêm | Hiện tổng tải; phần tự động không vượt ngân sách; bài chủ động thêm được ghi nguồn |
| Thử thách riêng | Đi qua bộ chọn chung và hạn mức; AI chỉ gợi ý mục tiêu |
| Đảo | Dùng câu và vai từ kế hoạch; hỗ trợ lượt ngắn khi thiếu thời gian/câu |
| Đoàn | Câu cá nhân và mục tiêu nhóm được kiểm riêng; sự kiện trở về hồ sơ chung |
| Repair/tower/arena/Linh Tâm | Chuyển đủ từng đường và cờ lùi; kiểm thời gian và chống lặp tương ứng |
| Luyện tự chọn theo dạng | App gửi ý định luyện; máy chủ chọn và giữ bài khi có ghi tiến độ/thưởng |
| Thi thử toàn chương trình | Giữ ma trận và thời gian riêng; có quyền mở phù hợp; không ép đề thi phải dễ theo cá nhân |
| Giáo viên rút đề/phiếu chữa | Có chế độ chủ động; khi chọn “cá nhân” thì dùng hồ sơ chung và nêu lý do |
| Lên bảng | Giữ nút gọi thủ công; kết quả học dùng chung sổ, không thêm đồng hồ tự gọi |

**Thứ tự nối:** ôn + kế hoạch → phụ huynh → phần riêng BTVN → Đảo → Đoàn → các chế độ còn lại. Mỗi kênh có cờ chuyển riêng nhưng quyền nhận thưởng chỉ có một nơi quyết định.

Trên app giáo viên cần xem: em được chọn câu vì lý do gì, thiếu nhãn/kho ở đâu, em nào cần dạy lại, bài nào vượt thời gian. App học sinh xem: việc hôm nay, tiến bộ, phần còn lại và số thưởng thật. App phụ huynh xem: kế hoạch và thành quả của con, không tạo một chỉ tiêu khác với app học sinh.

**Nghiệm thu:** bảng đường gọi không còn kênh tự động bị bỏ sót; làm cùng bài ở hai máy không tạo hai bộ câu hay hai lần thưởng; tắt tầng AI vẫn học được theo bộ chọn tất định.

<a id="buoc-10"></a>
## Bước 10 — Điều chỉnh Đoàn Hộ Tống

**Mục đích:** học sinh ở mức khác nhau đều đóng góp được, không bị nhịp game ép trả lời trước khi kịp giải.

### 10.1. Chọn câu

1. Câu cá nhân dùng mức đang luyện của chính em, phần lớn là củng cố/ôn vừa sức.
2. Không lấy cấp thú làm đại diện cho năng lực Hóa.
3. Câu nhóm dùng phần kiến thức đã học chung; nếu không có giao đủ phù hợp thì dùng các nhiệm vụ cá nhân cùng đóng góp vào mục tiêu đội.
4. Câu thử thách nhóm có thể chia vai/ý theo khả năng, nhưng kết quả cá nhân vẫn chấm và ghi riêng.
5. Thiếu câu thì rút ngắn chặng hoặc đổi mục tiêu phù hợp; không bắt đủ sáu câu bằng bài khó hơn.

### 10.2. Thời gian và trợ giúp

1. Mã đã có thời gian theo phần/bậc/độ dài và giới hạn tới 180 giây ở đường có metadata. Cần đo thời gian thật theo em, không chỉ thay hằng số 30 thành một số cố định lớn hơn.
2. Chế độ thường nên có hạn mềm. Hết hạn mềm không tự kết luận học sinh yếu; phân biệt chưa trả lời, gián đoạn mạng và sai kiến thức.
3. Nhịp đội đủ cho thành viên cần thời gian dài nhất trong phạm vi mục tiêu. Có thể để em hoàn tất phần cá nhân sau khi hiệp chung chuyển, với phần thưởng theo việc học đã xác minh.
4. Nếu vượt thời gian chặng quá nhiều, giảm số câu/độ dài ở lượt sau. Không tạo hiệp kéo dài bất tận.
5. Có chế độ hẹn giờ tự chọn dành cho luyện tốc độ. Kết quả tốc độ không thay thế đánh giá hiểu bài.
6. Ghi trợ giúp ngay khi máy chủ cấp gợi ý. Đồng đội hỗ trợ có công, người được giúp có tiến bộ học, nhưng đáp án được giúp không thành bằng chứng tự giải.
7. Sau hai lần vướng trong lượt, chuyển sang vai/bài nền phù hợp; em vẫn có việc đóng góp thay vì ngồi chờ các bạn.

**Đầu ra:** bộ chọn và bộ định thời gian theo cá nhân, quy tắc nhịp đội, dữ liệu trợ giúp và cách kết thúc chặng.

**Nghiệm thu:** em làm chậm có cơ hội hoàn tất; đội không bị buộc giải phần chưa học; thiếu thời gian không bị ghi như lỗi kiến thức; trợ giúp không làm sai hồ sơ hoặc nhân EXP.

<a id="buoc-11"></a>
## Bước 11 — Thiết kế trải nghiệm quay lại mỗi ngày

**Mục đích:** tạo động lực từ tiến bộ thật, quyền lựa chọn và kết nối với bạn học.

### 11.1. Trình tự một buổi

1. Mở app thấy một mục tiêu hôm nay và thời gian dự kiến, không mở đầu bằng một danh sách nợ dài.
2. Nếu có hai lựa chọn tương đương về mục tiêu và độ khó, cho em chọn; lựa chọn vẫn nằm trong kế hoạch chung.
3. Câu đầu tạo điểm vào vừa sức, ưu tiên điều em đã có nền để bắt đầu.
4. Phần chính kết hợp ôn và tiến thêm một bước. Khi sai, phản hồi một chỗ cần sửa, tránh dồn toàn lời giải dài ngay lập tức.
5. Kết thúc cho biết em đã tự làm được gì, đã nhớ được gì sau khoảng nghỉ và bước tiếp theo là gì. Các con số phải xuất phát từ sự kiện thật.
6. Hiện EXP, hấp thụ, mảnh và ví đúng trạng thái máy chủ. Cho kết thúc rõ; phần thêm là lựa chọn.

### 11.2. Nhịp tuần và nội dung

- Có mục tiêu tuần phù hợp, ví dụ học 5 trong 7 ngày. Ngày đạt để mở khiên vẫn cộng dồn; nghỉ hai ngày không tạo thêm mảnh và không xóa ngày đã tích lũy.
- Luân phiên hình thức kiểm tra trong phần đã học: nhận diện điều kiện, chọn cách giải, tìm lỗi, tính toán, giải thích lựa chọn.
- Đổi bối cảnh/nhiệm vụ Đoàn và cho chọn phụ kiện có lịch rõ. Không cần tạo nhiều dạng tiền tệ mới.
- Quà tuần đầu có thể là phụ kiện khởi đầu từ danh mục riêng, không cần tiêu dự trữ nuôi thú.
- Theo dõi bản thân và đóng góp nhóm; không dùng bảng xếp hạng công khai lỗi cá nhân để gây áp lực.
- Học sinh quay lại sau nghỉ nhận mục tiêu phục hồi ngắn; giữ thú, đồ và thành tích đã kiếm. Đề nghị bỏ luật mất khiên chỉ vì vắng/chưa đạt.
- Nhắc trong khung giờ đã chọn, tối đa một nhắc học hữu ích/ngày; học xong thì dừng. Tách tin học khỏi thông báo kỹ thuật cần thiết.

### 11.3. Điều phải đo

Tỷ lệ quay lại có học, hoàn thành vừa thời gian, bỏ dở sau lỗi, tự giải biến thể sau 7/21 ngày, phản hồi chán/lặp và khác biệt giữa nhóm cần nâng đỡ với nhóm mạnh. Lượt mở app hoặc tổng thời gian chơi chỉ là chỉ số phụ.

**Đầu ra:** thiết kế màn theo hành trình học, cơ chế mục tiêu tuần và nguyên tắc nhắc.

**Nghiệm thu:** mỗi phần thưởng có việc học tương ứng; em có thể kết thúc sau phần cốt lõi; không có thông báo mất thành tích chỉ vì nghỉ; thống kê tiến bộ không lấy số lần bấm thay khả năng tự làm.

<a id="buoc-12"></a>
## Bước 12 — Hợp nhất EXP và thưởng tiến bộ

**Mục đích:** người chăm học có nhịp tăng trưởng ổn định; không cần cày nhiều lượt game hoặc tìm câu từng sai để nhận thưởng.

### 12.1. Kiểm các nguồn đang tồn tại

| Nguồn hiện tại trong mã kiểm toán | Mức |
|---|---|
| Câu đúng Phần I theo sao 0/1/2 | 2 / 3 / 5 |
| Câu đúng Phần II theo sao 0/1/2 | 3 / 5 / 8, hiện cần đúng cả 4 ý |
| Câu đúng Phần III theo sao 0/1/2 | 4 / 6 / 10 |
| Sau trần mềm câu | Qua 2 × mục tiêu câu/ngày: 25%, làm tròn lên, ít nhất 1 |
| Đúng đầu ngày / đạt ngày | 10 / 80 |
| Chuỗi ngày đạt | 2 × min(chuỗi, 10), tối đa 20 |
| Xong lô BTVN đúng nhịp / trễ | 20 / 8 |
| Nộp cả BTVN đúng hạn / xong Mom | 30 / 10 |
| Ôn “lên bậc” / chuyển sang khắc phục | 6 / 30 |
| Lên bảng đạt / chưa đạt | 15 / 5 |
| Điểm ca | 3 × điểm làm tròn, tối đa 30 |
| Trở lại sau gián đoạn | 30, có điều kiện 3 ngày vắng và khoảng cách thưởng 14 ngày |
| Game đạt ba nấc | 10 / 20 / 30 |
| Đoàn tiếp sức | 5/lần, tối đa 5 lần/ngày |
| Đoàn kết chặng | Lần thắng đầu ngày 5/10/15; lần sau 3/5/8; vỡ giáp +3/trùm |

Game có trần 120/ngày. Một số khoản học tập theo việc không nằm dưới cùng trần câu. Đường EXP cũ có trần 100/ngày và mốc ngừng trả riêng cho từng em; phải đọc cờ thực tế trước khi chuyển, không cộng cả luật cũ lẫn mới sau cùng một mốc.

### 12.2. Tách hai quỹ theo mục đích

**Quỹ cốt lõi:** tối đa và tổng hoàn thành là 220 EXP/ngày.

**Quỹ tự chọn:** tối đa 120 EXP/ngày trên tất cả màn.

Nguồn giao diện không quyết định quỹ. Một câu game nằm trong kế hoạch cốt lõi được tính vào quỹ cốt lõi; một bài ôn thêm hợp lệ sau kế hoạch mới thuộc tự chọn. Mỗi công việc/sự kiện chỉ thuộc một quỹ thưởng cho cùng mục đích. Một khoản thưởng nấc hoặc kết chặng phải được tính vào tổng quyền nhận của công việc, không cộng thêm ngoài quỹ.

### 12.3. Công thức phần cốt lõi

Đặt:

- `raw_core`: tổng giá trị các sự kiện cốt lõi hợp lệ theo bảng giá có phiên bản.
- `core_completed`: đã đạt tiêu chí kế hoạch ngày hay chưa.
- `core_paid`: tổng đã trả từ quỹ cốt lõi của ngày.

```text
core_entitlement = core_completed ? 220 : min(220, raw_core)
grant_now = max(0, core_entitlement - core_paid)
```

Ví dụ em đã nhận 136 thì lúc đạt nhận bù 84; đã nhận 190 thì bù 30. Đã đủ 220 thì không nhận thêm cốt lõi dù mở lại bài hay hoàn thành khoản khác của cùng kế hoạch. Nếu `raw_core` đã chạm 220 trước khi đạt thì có thể đã đủ EXP cốt lõi nhưng vẫn chưa có quyền hấp thụ 200/mảnh; thu nhập và hoàn thành là hai trạng thái khác nhau.

Thưởng hoàn thành là phần còn thiếu tới tổng 220, không phải một khoản +220 độc lập. Khi nhiều sự kiện cùng đến, quyền nhận phải được tính và ghi nguyên tử trên cùng hàng tổng ngày. Không lưu một khóa “đã bù” rồi bỏ qua trường hợp phần bù bị ghi thất bại.

Giữ công học đã kiếm khi em sai câu tiếp theo. Nếu phát hiện lỗi hệ thống/chấm sai, dùng sự kiện điều chỉnh có đối chiếu; không âm thầm sửa số dư hoặc phát bù nhiều lần.

### 12.4. Phần tự chọn và thưởng chất lượng

Các mức khởi đầu đề nghị, cùng nằm trong 120:

| Hành vi | EXP đề nghị | Khóa chống lặp |
|---|---:|---|
| Tự nhớ đúng một câu thực sự đến hạn | 6 | Quan sát độc lập hợp lệ × câu/bản sao × ngày |
| Tự giải một biến thể chuyển giao được giao có chủ đích | 10 | Cơ hội chuyển giao × family × mức; không chỉ đổi qid |
| Hoàn tất một đợt phục hồi có bằng chứng | 20 | Mã đợt lỗi; không trả lại mỗi ngày vì từng sai |
| Trợ giúp đồng đội hữu ích được xác minh | 5 | Sự kiện trợ giúp, tối đa 5/ngày |

Đây là bảng giá thử nghiệm. Một câu đáp ứng nhiều mô tả không tự được cộng tất cả; máy chủ chọn mục đích chính đã ghi lúc giao. Khi có cột mốc riêng, phần cột mốc cũng phải nằm trong quỹ còn lại và khóa theo chuyển trạng thái thực.

Sau khi kỹ năng đã qua nấc cao nhất, ôn duy trì đúng hạn vẫn có thể được thưởng. Bỏ thưởng +6 chỉ dựa vào “từng sai ở bất kỳ ngày cũ nào”. Một câu chưa đến hạn hoặc bản sao đã thưởng hôm nay không tạo khoản mới.

Tổng EXP mới kiếm được theo chính sách đề nghị không quá 340/ngày (220 +120), trừ bút toán bù quyền lợi lịch sử được ghi riêng và không được dùng để vượt trần hấp thụ. Không thưởng đăng nhập để lấp số.

### 12.5. Triển khai sổ thưởng

1. Định nghĩa quyền nhận theo sự kiện được xác minh; giữ `policy_version`, ngày ghi nhận, mục đích và khóa duy nhất.
2. Lập bảng ánh xạ mọi nguồn cũ vào một quỹ. Không để lên bảng, thi, Mom hoặc hỗ trợ nhóm nằm ngoài kiểm soát.
3. Ghi khoản, tổng ngày, số dư ví và biên nhận trong cùng giao dịch/cơ chế nguyên tử phù hợp.
4. Khi gửi lại yêu cầu, trả đúng biên nhận cũ. Hai máy đồng thời không nhận hai phần bù 84.
5. Câu thi chưa công bố không được làm rò kết quả qua số EXP hay trạng thái kỹ năng trước thời điểm cho phép.
6. Sự kiện tới muộn dùng thời điểm học đã xác minh theo chính sách; không tin ngày do máy khách tự gửi. Không mở lại trần hấp thụ hôm nay bằng một sự kiện hôm qua.
7. Công bố/hiển thị số thật: kiếm được, đã hấp thụ, còn trong ví, hôm nay còn được hấp thụ và phần có thể tiêu.

**Đầu ra:** bảng giá có phiên bản, sổ thưởng duy nhất, bộ tính quyền nhận và cơ chế gửi lại an toàn.

**Nghiệm thu:** A04 không còn thưởng lên bậc giả; ôn duy trì được tính; tổng ngày đúng 220/120; gửi trùng, chia bài, đổi màn, đổi máy không tăng quyền nhận.

<a id="buoc-13"></a>
## Bước 13 — Lên cấp, khiên, mua đồ và EXP dư

### 13.1. Giữ mốc cấp 10

Chín thanh đầu đề nghị giữ nguyên:

```text
120 + 150 + 180 + 220 + 260 + 300 + 350 + 390 + 430 = 2.400 EXP
```

Tài khoản mới bắt đầu cấp 1, EXP trong cấp bằng 0. Mỗi ngày đạt hấp thụ tối đa 200; có học hợp lệ chưa đạt tối đa 120; chưa có bằng chứng học thì 0. Đạt sau khi đã hấp thụ 120 chỉ mở thêm 80 trong ngày, không nhận lại 200.

```text
hấp thụ lần này = min(
  EXP có trong ví,
  trần hôm nay − số đã hấp thụ hôm nay,
  phần còn thiếu tới cấp tối đa
)
```

Ngày dùng múi giờ Việt Nam và thời gian máy chủ. Mốc 12/21 là số ngày học/đạt hợp lệ theo quy tắc ngày, không phải số lượt; nếu muốn đủ 12 ×24 giờ thực từ khi tạo tài khoản thì cần thêm điều kiện thời gian riêng. Tài liệu này dùng cách đếm ngày học theo lịch Việt Nam.

Quà tặng, thưởng thi, bù EXP, chuyển mùa và thao tác quản trị thông thường cũng không được nạp thẳng vượt cổng hấp thụ. Hồ sơ cũ được xử lý bằng chuyển đổi có đối chiếu, không ép quay về tài khoản mới.

### 13.2. Một quyền nhận khiên

Với tài khoản mới:

1. Một ngày đạt → đúng một mảnh, không nhân theo số app hoặc số bài.
2. Khiên đầu cần cấp ≥10 và ít nhất 21 ngày đạt; đổi 21 mảnh lấy một khiên, không trừ EXP.
3. Những khiên sau cần thêm 21 mảnh và 300 EXP, sau rèn còn tối thiểu 400 trong ví.
4. Ngày 21 đã nhận khiên đầu thì 21 mảnh được dùng; không thể dùng chính mốc đó để rèn khiên thứ hai.
5. Quà tiến hóa không tự cấp thêm khiên ngoài cùng quyền nhận. Có thể chuyển quà tiến hóa thành ngoại hình/huy hiệu phù hợp.
6. Đề nghị giữ tối đa 5 khiên chưa dùng tổng cộng; mảnh không mất khi chạm giới hạn.
7. Không trừ khiên đã kiếm do gián đoạn học. Cơ chế sử dụng khiên trong game vẫn ghi rõ tác dụng và lần đã dùng.

Nghỉ giữa các ngày không xóa ngày đạt. Học 5 ngày/tuần sẽ cần nhiều ngày lịch hơn nhưng cùng 21 ngày đạt để mở khiên.

### 13.3. Dùng EXP dư thông minh

Thứ tự gợi ý là hấp thụ phần được phép → giữ dự trữ → cân nhắc mua hoặc rèn. Học sinh chủ động bấm; nếu có tự động hấp thụ thì cần là tùy chọn rõ, không kèm tự mua/rèn.

```text
EXP có thể tiêu = max(0, ví − 400)
```

Giữ tỷ lệ đang có 1 EXP dư = 1 vàng. Tách rõ ví EXP và số vàng đã đổi; giao dịch đổi phải trừ ví và cộng vàng cùng một lần. Đồ mỹ thuật không tăng điểm chấm, xác suất nhận câu dễ hay khả năng vượt trần cấp.

Trước khi mua: hiện giá, số dư sau mua và dự trữ còn lại. Có thể cho chọn mục tiêu tiết kiệm một món; tiền chưa bị khóa hoặc tự tiêu. Ước tính số ngày mua được dựa trên thu nhập thực gần đây và ghi là ước tính.

Với thu nhập cốt lõi 220 và hấp thụ 200, mỗi ngày còn 20. Ngày 21 ví có 420, có thể tiêu 20; vì vậy nên có một món khởi đầu miễn phí ở mục tiêu tuần đầu để em sớm có lựa chọn ngoại hình mà không phải cày.

### 13.4. Mô phỏng đã tính

Giả định tài khoản mới, ví đầu 0; mỗi ngày học trong bảng đều đạt và hấp thụ đủ 200; chưa mua đồ; rèn khi đủ điều kiện. Không giả định mọi học sinh thật sẽ đạt như vậy.

| Kịch bản | Cấp 10 | Khiên đầu | Ví ở ngày đạt 12 | Ví ở ngày đạt 21 | Ví sau nhận khiên thứ hai ngày đạt 42 |
|---|---:|---:|---:|---:|---:|
| Cốt lõi 220/ngày, học mỗi ngày | Ngày lịch 12 | Ngày lịch 21 | 240 | 420 | 540 |
| Cốt lõi +40 tự chọn/ngày | Ngày lịch 12 | Ngày lịch 21 | 720 | 1.260 | 2.220 |
| Cốt lõi 5 ngày/tuần, bắt đầu thứ Hai | Ngày lịch 16 | Ngày lịch 29 | 240 | 420 | 540, ở ngày lịch 58 |

Kiểm phép tính: 42 ×20 −300 =540; 42 ×60 −300 =2.220. Khiên đầu không mất EXP, khiên thứ hai mất 300. Mua đồ có thể làm ngày rèn sau muộn hơn nhưng mảnh vẫn giữ.

### 13.5. Lựa chọn riêng cho cấp 11–120

Đường hiện tại cần 238.200 EXP tới cấp 120, sớm nhất 1.191 ngày hấp thụ đủ 200. Thanh từ cấp 9 là 430, thanh từ cấp 10 lên 1.000. Điều này có thể làm nhịp tiến trình chậm mạnh sau cột mốc đầu.

Phương án đề nghị để xem xét: giữ chín thanh đầu, từ cấp `c=10..119`:

```text
EXP từ cấp c lên c+1 = 10 × round((450 + 3,5 × (c−10)) / 10)
```

Tổng là 72.900 EXP, sớm nhất 365 ngày học đủ; thanh từ 450 tăng dần tới 830. Đây là lựa chọn thiết kế tiến trình, không phải kết quả nghiên cứu về trí nhớ. Mốc cấp 10 vẫn ngày 12.

Nên tách quyết định đường cấp khỏi đợt sửa lỗi P0. Nếu chưa đổi, giữ bảng hiện có và bổ sung hành trình kỹ năng 4–6 tuần để học sinh vẫn có thành quả ngắn hạn. Nếu đổi, phải có phép chuyển đổi bảo toàn cấp, tiền và đồ ở Bước 15.

**Đầu ra:** công thức lên cấp, sổ quyền khiên, quy tắc chi tiêu và bảng mô phỏng.

**Nghiệm thu:** không lên cấp 10 trước ngày học thứ 12; khiên đầu không trước ngày đạt thứ 21; ngày 21 không cấp hai khiên từ một quyền; mọi lần mua/rèn giữ dự trữ và gửi lại an toàn.

<a id="buoc-14"></a>
## Bước 14 — Tối ưu máy chủ và đồng bộ nhiều thiết bị

**Mục đích:** giảm đọc lại và tính lại, vẫn giữ kết quả đúng khi nhiều yêu cầu đến cùng lúc.

### 14.1. Thiết kế dữ liệu phục vụ nhanh

Các bảng/chỉ mục sau là thiết kế logic; cần đối chiếu schema hiện có để mở rộng, tránh tạo bảng trùng chức năng.

| Nhóm dữ liệu | Khóa/chỉ mục cần xem xét | Công dụng |
|---|---|---|
| Phạm vi cá nhân | Học sinh +kỹ năng +phiên bản | Kiểm kiến thức đã học |
| Snapshot trí nhớ | Học sinh +câu/phiên bản; học sinh +ngày đến hạn | Đọc nhanh câu cần ôn |
| Tổng hợp kỹ năng | Học sinh +kỹ năng +mức | Chọn độ khó không quét toàn bộ sổ |
| Kế hoạch ngày | Học sinh +ngày; revision và policy version | Một kế hoạch qua nhiều thiết bị |
| Dòng công việc | Kế hoạch +task; qid/family/mục đích | Theo dõi hoàn thành và phần chưa mở |
| Giữ chỗ câu | Học sinh +nhóm nội dung +trạng thái/ngày | Tránh giao trùng đồng thời |
| Sự kiện học | Khóa duy nhất; học sinh +thời điểm | Dựng lại khi chấm sửa hoặc đổi mô hình |
| Sổ thưởng | Khóa quyền nhận; học sinh +ngày +quỹ | Chống trả trùng và vượt trần |
| Giao dịch tài sản | Mã yêu cầu duy nhất; học sinh +thời điểm | Ví, vàng, mảnh, khiên và đồ |

Không thêm mọi chỉ mục theo phỏng đoán. Chọn từ truy vấn thực, kiểm kế hoạch truy vấn, đo chi phí đọc và ghi sau khi thêm.

### 14.2. Giảm chi phí theo thứ tự

1. Đo đường mở kế hoạch, mở lượt, nộp bài, lấy hồ sơ và đồng bộ EXP. Ghi CPU, số lượt D1/R2, rows đọc, bytes trả, cache hit và lỗi.
2. Tạo tổng hợp tăng dần từ sự kiện mới. Đường mở app thông thường đọc snapshot thay vì phát lại toàn bộ lịch sử.
3. Giữ đầy đủ sổ gốc để phát lại khi chấm sửa/đổi phiên bản; không cắt lịch sử rồi làm mất bằng chứng lâu dài.
4. Tính sẵn đặc trưng câu và nhóm ứng viên theo kỹ năng/bậc. Mỗi lượt tạo map một lần, tránh `filter` toàn lịch sử cho từng ứng viên.
5. Lọc trên metadata nhẹ, nạp nội dung đầy đủ chỉ sau khi chọn. Câu có hình không cần tải ảnh để quyết định đủ điều kiện.
6. Gộp đọc độc lập và dùng batch phù hợp. Với thao tác ghi tiền/hạn mức, phải dùng cơ chế nguyên tử đã được kiểm chứng, không coi nhiều lệnh gửi song song là một giao dịch.
7. Cache kho theo phiên bản nội dung; cache hồ sơ theo học sinh và revision. Không dùng chung cache cá nhân giữa hai em.
8. Khi thầy bảo vệ đề/thu hồi câu/đổi phạm vi, vô hiệu hóa cache liên quan; kiểm lại khi phát và khi nộp.
9. AI chạy nền để gợi ý mục tiêu hoặc phân tích lỗi, không nằm trên đường bắt buộc cho mỗi câu. Lỗi AI không làm ngừng bộ chọn đã có quy tắc.
10. Sau tối ưu, so kết quả câu được chọn và lý do trên cùng đầu vào; chỉ chấp nhận khác biệt do chính sách đã định, không vì thứ tự truy vấn không ổn định.

### 14.3. Quy trình an toàn khi hai máy cùng thao tác

**Mở lượt:** đọc kế hoạch/revision → kiểm phạm vi → chọn ứng viên → ghi giữ chỗ và lượt bằng điều kiện phiên bản → thành công thì trả đúng snapshot; thua cuộc đua thì đọc lượt đã chốt hoặc chọn lại phần chưa giữ.

**Nộp câu:** xác thực học sinh/lượt → đọc phiên bản câu đã phát → chấm → ghi kết quả và khóa sự kiện → cập nhật quyền thưởng/số dư có điều kiện → trả biên nhận. Gửi lại cùng mã chỉ đọc biên nhận.

**Hậu xử lý:** nếu thông báo, tổng hợp hoặc cập nhật hiển thị chưa hoàn tất sau khi bài đã nộp, ghi công việc phục hồi/outbox. Retry xử lý phần còn thiếu, không chấm lại thành một lần làm mới.

**Mua/rèn:** số dư, giá, điều kiện và số lượng đều do máy chủ kiểm; khóa theo yêu cầu; trừ tiền, cấp đồ/khiên, trừ mảnh và ghi biên nhận phải đi cùng nhau.

### 14.4. Mục tiêu đo ban đầu

| Thao tác | Mục tiêu đề nghị, chưa phải kết quả đã đạt |
|---|---|
| Lập lượt từ dữ liệu đã cache | p95 dưới 300 ms tại máy chủ |
| Lập lượt cần đọc kho | p95 dưới 1 giây tại vùng triển khai |
| Chấm và ghi nhận | p95 dưới 500 ms tại máy chủ |
| Đồng bộ hai thiết bị | Kết quả và số dư hội tụ đúng, không nhân thưởng |

Đo thêm p99 và tỷ lệ lỗi; ghi riêng mạng phía học sinh. Ngưỡng phải được điều chỉnh theo hạ tầng thật. Không suy tốc độ production từ thời gian một phép thử trên máy phát triển.

**Đầu ra:** truy vấn được đo, snapshot tăng dần, giữ chỗ/biên nhận và báo cáo trước/sau tối ưu.

**Nghiệm thu:** tải đồng thời không phát trùng/quá trần; incremental khớp full replay; cache không lộ dữ liệu hoặc đề bảo vệ; đủ số đo để kết luận nhanh hơn ở đường cụ thể.

<a id="buoc-15"></a>
## Bước 15 — Chuyển dữ liệu và bảo toàn quyền lợi

**Mục đích:** luật mới không làm học sinh mất cấp, tiền, đồ, khiên hoặc lịch sử học.

### 15.1. Chuẩn bị và chạy thử

1. Chụp mốc dữ liệu theo học sinh: cấp, EXP trong cấp, ví, vàng, đồ, khiên đã nhận/đã dùng, mảnh, tổng ngày đạt, trần đã dùng hôm nay và phiên bản luật.
2. Lưu phiên bản ứng dụng/Worker/schema tương ứng; kiểm khả năng phục hồi bản sao, không chỉ xác nhận đã có một file sao lưu.
3. Tạo bảng đối chiếu trước/sau trên dữ liệu sao chép. Mỗi thay đổi phải có lý do và mã chuyển đổi.
4. Chạy chuyển đổi thử nhiều lần; lần thứ hai không thay đổi thêm số dư hay quyền nhận.
5. Khi triển khai thật, dùng kiểm tra revision; hồ sơ đang được học sinh cập nhật thì không ghi đè, đưa vào lượt xử lý sau.

### 15.2. Chuyển hồ sơ học và FSRS

1. Giữ nguyên sự kiện gốc; chuẩn hóa nguồn và dấu hỗ trợ bằng dữ liệu có thể xác minh.
2. Những sự kiện cũ không biết đã xem lời giải hay chưa được đánh dấu thiếu thông tin; không tự gán là tự làm chắc chắn.
3. Dựng snapshot mới ở phiên bản riêng, đối chiếu một tập hồ sơ và lịch đến hạn trước khi dùng.
4. Khi thay mô hình lịch nhớ, dựng trạng thái từ lịch sử theo đúng thuật toán mới hoặc phương án chuyển đã kiểm chứng. Không chỉ đổi số phiên bản rồi dùng tham số cũ như thể tương thích.
5. Giữ bài/lượt đang làm theo snapshot hợp lệ; áp chính sách mới cho phần chưa mở hoặc ngày kế tiếp theo quy tắc thống nhất.

### 15.3. Chuyển EXP và quỹ ngày

1. Chọn mốc hiệu lực theo máy chủ. Không cho cùng sự kiện chạy qua cả luật cũ và luật mới.
2. Nếu đổi giữa ngày, phải đưa số đã thưởng trong ngày vào hạn mức mới hoặc chuyển hiệu lực từ ngày tiếp theo. Đề nghị ngày tiếp theo để dễ giải thích và đối chiếu.
3. Giữ ví, vàng và đồ đã có. EXP bù do sửa lỗi có bút toán riêng, không xóa lịch sử cũ.
4. Giữ nguyên số đã hấp thụ hôm nay; chuyển luật không tạo thêm một “ngày” nhận 200.
5. Các khoản pending được xử lý theo phiên bản quyền nhận của sự kiện; không dùng luật nào có lợi hơn tùy lần retry.

### 15.4. Nếu chọn đổi đường cấp sau cấp 10

Đề nghị giữ cấp hiện tại và tỷ lệ tiến độ trong cấp, hoàn lại chênh giá vào ví. Ví dụ công thức chuyển ở cấp `c<120`:

```text
exp_moi_trong_cap = min(
  gia_thanh_moi(c) − 1,
  floor(exp_cu_trong_cap × gia_thanh_moi(c) / gia_thanh_cu(c))
)

I_cu  = tổng EXP theo bảng cũ tới cấp c + exp_cu_trong_cap
I_moi = tổng EXP theo bảng mới tới cấp c + exp_moi_trong_cap
chenh_hoan = I_cu − I_moi
vi_moi = vi_cu + chenh_hoan
```

Chỉ dùng khi đã xác minh bảng cũ đúng với phiên bản của hồ sơ và `chenh_hoan ≥0`. Cấp tối đa xử lý riêng, không chia cho thanh EXP bằng 0. Đối chiếu bất biến `I_cu + vi_cu = I_moi + vi_moi`. Hoàn chênh không được tính là EXP mới kiếm trong ngày, không tăng mảnh và không mở lại hạn mức hấp thụ.

Nếu dữ liệu cũ không khớp sổ/phiên bản, đưa vào danh sách đối chiếu; không đoán rồi cắt tiền. Cần mô phỏng tác động lượng EXP hoàn về ví tới cửa hàng, vì bảo toàn quyền lợi có thể làm nhu cầu mua đồ tăng mạnh ở nhóm đã chơi lâu.

### 15.5. Chuyển khiên

1. Đóng băng quyền đã có: số khiên hợp lệ còn dùng được, số đã dùng, mảnh và ngày đạt đã ghi nhận.
2. Tạo sổ quyền nhận để biết mốc nào đã cấp khiên qua quà, rèn hoặc chuyển đổi; không chỉ nhìn số khiên đang cầm.
3. Giữ quyền cũ đã kiếm. Không lấy lại khiên vì luật mới chỉ cấp một khiên tại mốc 21.
4. Không tặng lại “khiên đầu” cho em đã nhận trước đó. Các quyền cũ chưa nhận nhưng đã đủ điều kiện phải được đối chiếu riêng.
5. Mảnh cũ không bị xóa; khi chuyển sang quyền mới cần chỉ rõ mảnh nào đã được dùng cho quyền nào. Không âm thầm dùng lại mảnh đã rèn trong quá khứ.
6. Nếu lịch sử không đủ để ghép quyền, giữ phần quyền cũ trong số dư chuyển tiếp và áp bộ đếm mới cho phát sinh sau mốc; không tự phát khiên dựa trên phép suy thiếu bằng chứng. Trường hợp này cần bảng xử lý cụ thể trước phát hành.

### 15.6. Quay lui khi có lỗi

Quay lui bộ chọn theo cờ có phiên bản, vẫn đọc được phiên đang làm. Giữ sổ sự kiện và sổ tiền chỉ bổ sung; không xóa các khoản hợp lệ đã phát theo luật mới. Worker phục hồi phải còn hiểu dữ liệu mới hoặc có bộ chuyển đổi tương thích. Không chạy một lệnh reset toàn bộ số dư để quay lại.

**Đầu ra:** kế hoạch chuyển đổi, bản thử trước/sau, cơ chế chạy lại và phương án quay lui.

**Nghiệm thu:** không mất cấp/tiền/đồ/quyền; chạy lại không nhân tiền; người đang làm bài không bị ghi đè; hồ sơ chưa đối chiếu được không bị chuyển bằng giá trị phỏng đoán.

<a id="buoc-16"></a>
## Bước 16 — Kiểm thử và nghiệm thu

**Mục đích:** kiểm những điều quyết định học sinh có được giao đúng bài, được chấm đúng và nhận đúng quyền lợi.

### 16.1. Bộ tình huống tối thiểu

| Mã | Tình huống | Kết quả phải đạt |
|---|---|---|
| T01 | Hai học sinh cùng lớp, một em chưa học kỹ năng mới | Em chưa học không nhận câu tự động có kỹ năng đó |
| T02 | Câu cần hai kiến thức nền, em mới có một | Câu bị loại khỏi bài tự động |
| T03 | Kho thiếu nhãn hoặc câu bị thu hồi | Không phát nhầm; báo nguyên nhân thiếu nguồn |
| T04 | Hai qid là cùng bản sao nội dung | Không tính thành hai bằng chứng/hai thưởng cùng mục đích |
| T05 | Bốn câu Biết đúng cùng ngày | Không tự xác nhận bậc Vận dụng |
| T06 | Sai ba lần, được dạy lại và tự giải biến thể | Ra khỏi trạng thái chặn; vẫn còn lịch kiểm tra duy trì |
| T07 | Ôn đúng câu đến hạn chưa từng sai | Có thể hoàn thành mục tiêu ôn/đạt ngày, không thiếu “từng sai” |
| T08 | Đặt 10 phút, 240 giây/câu | Tổng dự kiến gồm phản hồi không vượt 10 phút |
| T09 | Chỉ còn chỗ cho 2 câu, lượt game chuẩn 6 | Nhận lượt ngắn phù hợp hoặc dừng, không cộng thừa |
| T10 | Nhánh bù chỉ còn câu cao hơn mức | Không tự tăng độ khó |
| T11 | BTVN chưa nộp có bản sao trong kho game | Không phát lời giải qua bản sao |
| T12 | Đổi phạm vi/bảo vệ đề sau khi đã cache | Cache cũ không vượt được kiểm máy chủ |
| T13 | Phụ huynh và học sinh cùng mở bài trên hai máy | Kế hoạch/giữ chỗ nhất quán, không giao trùng ngoài chủ đích |
| T14 | Hai lần nộp cùng một request | Một kết quả, một sự kiện, một quyền thưởng |
| T15 | Đã nhận 136 cốt lõi, hoàn thành đồng thời ở hai máy | Chỉ cộng tổng 84, đạt 220 |
| T16 | Cốt lõi đã 220, tự chọn đã 120 | Khoản học tiếp không vượt quỹ |
| T17 | Làm câu từng sai rất lâu nhưng chưa đến hạn | Không tự nhận +6 “lên bậc” như một tiến bộ mới |
| T18 | Một sự kiện đủ điều kiện ôn và chuyển giao | Thưởng đúng mục đích đã giao, không cộng chồng vô hạn |
| T19 | Phần II đúng ba ý, sai một ý | Điểm theo quy tắc đề; hồ sơ biết đúng ý nào, sai kiến thức nào |
| T20 | Đáp án được xác nhận sai sau khi em nộp | Sửa điểm/hồ sơ và bù một lần; gửi lại không bù lần nữa |
| T21 | Tài khoản mới, kiếm rất nhiều EXP trong ngày | Không hấp thụ quá 200; không cấp 10 trước ngày học 12 |
| T22 | Có học đã hấp thụ 120, sau đó đạt | Chỉ hấp thụ thêm tối đa 80 |
| T23 | Đạt ngày 20 rồi ngày 21 | Chưa có khiên trước 21; ngày 21 một quyền, dùng 21 mảnh |
| T24 | Nhận khiên quà và rèn được gọi đồng thời | Không cấp hai khiên từ một quyền |
| T25 | Đã có khiên đầu, đủ 21 mảnh mới, ví 700; rèn 300 và gửi lại request | Ví còn 400, chỉ một khiên, chỉ trừ 21 mảnh một lần |
| T26 | Mua đồ làm ví sau mua dưới 400 | Không thực hiện; số dư không đổi |
| T27 | Sự kiện tới muộn qua 0 giờ Việt Nam | Ngày/quỹ đúng chính sách; không đặt lại trần ngày hiện tại |
| T28 | Mất mạng sau khi bài đã chốt | Lấy lại biên nhận; hậu xử lý được phục hồi |
| T29 | Em được gợi ý rồi trả lời đúng | Ghi có hỗ trợ; không coi là tự giải độc lập |
| T30 | Em gián đoạn rồi quay lại | Tài sản còn nguyên; kế hoạch phục hồi vừa sức |
| T31 | Chuyển luật hai lần | Số dư sau lần 2 bằng sau lần 1 |
| T32 | Lịch sử dài, sự kiện chấm sửa ở quá khứ | Snapshot tăng dần sau phục hồi khớp full replay |

### 16.2. Trình tự chạy

1. Kiểm hàm thuần: phạm vi, bậc, lịch, thời gian, chọn, đạt ngày, quỹ, cấp và khiên.
2. Kiểm dữ liệu/Worker: giao dịch, cờ phiên bản, truy vấn bảo vệ đề, retry, giữ chỗ và chuyển đổi.
3. Kiểm luồng thật của từng app, gồm tải lại, đổi màn, mất mạng và hai thiết bị.
4. Kiểm hiển thị trên màn nhỏ: nội dung dài, Phần II, bảng/hình, lý do thiếu câu, ví và thưởng. Giao diện không tràn khi thêm các thông tin mới.
5. Kiểm tải tại mức đồng thời đại diện giờ học; so p95/p99, lỗi và chi phí với mốc Bước 01.
6. Chạy đối chiếu hồ sơ trước/sau trên tập dữ liệu đã khử thông tin nhận diện phù hợp; kiểm riêng nhóm yếu, mới và có nhiều lịch sử.

### 16.3. Điều kiện không được kết luận đã xong

- Test chỉ qua ở một bộ chọn nhưng còn đường cũ đang hoạt động chưa được nối.
- Đúng ở hàm thuần nhưng chưa kiểm D1/Worker và gửi trùng.
- Đã sửa local nhưng chưa xác minh bản được triển khai.
- Chưa đối chiếu số dư/quyền của tài khoản cũ.
- Không biết cờ đang bật trên máy chủ hoặc vẫn có lỗi quan trọng chưa phân loại.

**Đầu ra:** báo cáo nghiệm thu theo kênh, phiên bản, kết quả, lỗi còn lại và bằng chứng hai thiết bị.

<a id="buoc-17"></a>
## Bước 17 — Chạy đối chiếu và thử nghiệm có kiểm soát

**Mục đích:** biết chính sách nào giúp học sinh tiến bộ thật, không chỉ làm biểu đồ lượt chơi tăng.

### 17.1. Giai đoạn đối chiếu, đề nghị khoảng hai tuần

1. Bộ mới nhận cùng đầu vào nhưng chưa phát câu/EXP mới cho học sinh.
2. Ghi câu nó sẽ chọn, lý do, thời gian dự kiến, bậc, độ trùng và quyền thưởng dự kiến.
3. So với bộ đang phục vụ và kiểm mẫu bằng chuyên môn thầy.
4. Tìm trường hợp quá ít nguồn, nhãn gây loại sai, lịch ôn dồn, thu nhập giảm ở nhóm yếu hoặc tải tăng.
5. Hiệu chỉnh quy tắc và đóng băng một phiên bản trước khi thử thật.

Chế độ đối chiếu chỉ kiểm được tính hợp lệ, chi phí và độ khác lựa chọn. Nó không chứng minh tác dụng học tập của câu chưa được phát; không được lấy dự báo đó làm kết quả học đã xảy ra.

### 17.2. Giai đoạn thử thật, đề nghị khoảng sáu tuần

1. Sửa lỗi đúng/sai và quyền lợi rõ ràng cho mọi nhóm; không giữ lỗi đã biết chỉ để làm nhóm đối chứng.
2. Chỉ so các chính sách đều hợp lệ. Phân tầng theo mức ban đầu và tiến độ học.
3. Chọn đơn vị chia nhóm phù hợp; game hợp tác có thể cần chia theo lớp/nhóm để giảm tác động chéo.
4. Tách thử chính sách chọn câu với thử mô hình nhớ hoặc bảng EXP khi cần biết nguyên nhân. Đổi tất cả cùng lúc có thể đo hiệu quả gói tổng thể nhưng khó kết luận thành phần nào tạo khác biệt.
5. Xác định cỡ mẫu từ quy mô thật, độ biến thiên và mức cải thiện cần phát hiện. Nhóm nhỏ có thể dùng tìm lỗi trải nghiệm, không tự khẳng định đủ để chứng minh hiệu quả.
6. Đo trước, trong và sau; câu đo chuyển giao phải chưa được luyện nguyên văn. Bảo vệ các câu này khỏi bộ chọn và phản hồi trước bài đo.
7. Ghi mục tiêu và tiêu chí dừng trước khi xem kết quả. Nếu một nhóm bị tăng lỗi, tăng tải hoặc giảm quyền lợi do lỗi hệ thống thì dừng nhánh đó để xử lý.

### 17.3. Chỉ số quyết định

| Nhóm | Chỉ số chính | Cách tránh hiểu sai |
|---|---|---|
| Nhớ lâu | Tự nhớ ở các cửa sổ đo sau 7/21 ngày | Đây là cửa sổ đánh giá, không ép mọi câu ôn theo lịch 7/21 |
| Chuyển giao | Tự giải biến thể/family mới phù hợp | Không dùng bản sao chỉ đổi qid |
| Hiệu quả thời gian | Tiến bộ kiểm chứng được trên mỗi phút học | Tách tab nền và gián đoạn |
| Nâng đỡ | Hoàn thành, phục hồi lỗi, bỏ dở của nhóm cần hỗ trợ | Không chỉ báo trung bình cả lớp |
| Phù hợp bài | Câu ngoài phạm vi, quá khó, không đủ nhãn | Mục tiêu lỗi phạm vi/bảo vệ đề bằng0 |
| Trải nghiệm | Quay lại có học ngày 7/28, chán/lặp, dừng sau 2 lỗi | Lượt mở app không bằng học hiệu quả |
| Kinh tế game | Thu nhập, mức hấp thụ, ngày lên cấp, ngày nhận khiên | Phân biệt tiền kiếm được và trần có thể hấp thụ |
| Máy chủ | p95/p99, tỷ lệ lỗi, rows D1/R2, lượng dữ liệu | Tách thời gian mạng máy học sinh |

**Đầu ra:** kết quả có đối chứng, phân tích theo nhóm, đề nghị giữ/đổi từng tham số và mức độ chắc chắn.

**Nghiệm thu:** có bằng chứng học và tải phù hợp; không kết luận từ riêng thời gian chơi hay mức thưởng. Những kết quả chưa đủ dữ liệu được ghi đúng là chưa đủ.

<a id="buoc-18"></a>
## Bước 18 — Phát hành theo đợt và theo dõi

**Mục đích:** đưa luật mới vào dùng có thể kiểm tra và quay lui từng phần.

### 18.1. Thứ tự đề nghị

| Đợt | Nội dung | Điều kiện chuyển tiếp |
|---|---|---|
| P0 | Sửa A01–A05, A07–A08; bảo đảm chấm, phạm vi và lời giải | Các lỗi có kiểm thử mới qua, đường liên quan đã được kiểm |
| P1 | Hồ sơ chung, bộ chọn, kế hoạch thời gian và giữ chỗ liên kênh | Ba app cùng trạng thái, không giao chồng |
| P2 | Quỹ 220/120, quyền khiên, ví/cửa hàng và chuyển đổi | Sổ đối chiếu đúng, tài khoản cũ được bảo toàn |
| P3 | Đoàn theo khả năng, trải nghiệm tuần và đo kết quả | Qua kiểm thử và nhóm thử phù hợp |
| P4 | Mô hình nhớ mới hoặc đường cấp sau 10 nếu được chọn | Có kết quả đối chiếu riêng và phương án chuyển |

P0 gồm sửa lỗi đã có bằng chứng. P2/P4 là đổi chính sách, không được ghi như thể đó là cách duy nhất sửa lỗi kỹ thuật.

### 18.2. Quy trình mỗi đợt

1. Chuẩn bị bản hoàn chỉnh có thể xem: thay đổi mã, schema, cấu hình, kiểm thử, chuyển đổi thử và hướng dẫn quay lui.
2. Xác định nhóm áp dụng ban đầu bằng cấu hình phía máy chủ; phiên bản ứng dụng phải tương thích.
3. Phát hành schema theo hướng bổ sung trước, sau đó Worker và giao diện tương thích, cuối cùng mới bật luật cho nhóm.
4. Kiểm một chu trình thật: mở kế hoạch → làm/nộp → nhận tiến bộ → nhận EXP → hấp thụ → đồng bộ máy thứ hai.
5. Kiểm thêm giao dịch mua/rèn với tài khoản thử có dữ liệu tổng hợp, không thao tác tiền/quyền của học sinh thật để thử.
6. Theo dõi sai phạm vi, thiếu câu bất thường, vượt thời gian, số dư lệch, trùng quyền nhận và lỗi tải.
7. Mở rộng nhóm khi số liệu ổn và kiểm chuyên môn đạt. Có lịch xem lại sau 24 giờ, 7 ngày, 21 ngày; đây là kế hoạch vận hành, tài liệu này không tự tạo tác vụ theo dõi.
8. Khi quay lui, ghi phiên bản và nguyên nhân; giữ sự kiện/quyền hợp lệ đã phát, xử lý khoản sai có đối chiếu.

**Đầu ra cuối:** bộ luật có phiên bản, tài liệu vận hành, báo cáo nghiệm thu từng đợt và số liệu tác động học tập.

**Định nghĩa hoàn thành toàn bộ:** các kênh tự động đã dùng hồ sơ và quy tắc chung; ba app đồng bộ; kiểm thử học thuật/tài sản/đồng thời qua; dữ liệu cũ đối chiếu đúng; bản triển khai được xác minh; các thông số thử nghiệm có số liệu theo dõi và người chịu trách nhiệm.

<a id="ban-do"></a>
## 3. Bản đồ tệp và thứ tự thực hiện

### 3.1. Các vị trí hiện có để đối chiếu khi bắt đầu sửa

| Nhóm | Tệp hiện có | Bước liên quan |
|---|---|---|
| Phạm vi và kho | [game-v2-bank.ts](</Volumes/SSD NGOÀI/omr-app/server/src/game-v2-bank.ts>) | 02–03,08,14 |
| Hồ sơ và trạng thái | [ho-so-nam-kt.ts](</Volumes/SSD NGOÀI/omr-app/server/src/ho-so-nam-kt.ts>), [ho-so-cau-hinh.ts](</Volumes/SSD NGOÀI/omr-app/server/src/ho-so-cau-hinh.ts>) | 04–05 |
| Lịch nhớ | [lich-on-fsrs.ts](</Volumes/SSD NGOÀI/omr-app/server/src/lich-on-fsrs.ts>), [game-v2-ho-so.ts](</Volumes/SSD NGOÀI/omr-app/server/src/game-v2-ho-so.ts>) | 06 |
| Kế hoạch | [ke-hoach-ngay.ts](</Volumes/SSD NGOÀI/omr-app/server/src/ke-hoach-ngay.ts>), [ke-hoach-ngay-d1.ts](</Volumes/SSD NGOÀI/omr-app/server/src/ke-hoach-ngay-d1.ts>) | 07 |
| Đạt ngày | [dat-nhiem-vu-ngay.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/dat-nhiem-vu-ngay.ts>) | 07,12 |
| Chọn và nấc game | [core.ts](</Volumes/SSD NGOÀI/omr-app/src/game/than-thu-v2/core.ts>), [game-v2.ts](</Volumes/SSD NGOÀI/omr-app/server/src/game-v2.ts>) | 05–06,08–10,12 |
| BTVN | [btvn-nang-do.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/btvn-nang-do.ts>), [btvn-nang-do-d1.ts](</Volumes/SSD NGOÀI/omr-app/server/src/btvn-nang-do-d1.ts>) | 07–09 |
| Phụ huynh | [parent-news-chon-cau.ts](</Volumes/SSD NGOÀI/omr-app/server/src/parent-news-chon-cau.ts>), [parent-news-nguon-cau.ts](</Volumes/SSD NGOÀI/omr-app/server/src/parent-news-nguon-cau.ts>) | 08–09 |
| Thử thách | [thu-thach-rieng.ts](</Volumes/SSD NGOÀI/omr-app/server/src/thu-thach-rieng.ts>) | 08–09 |
| Luyện đề | [luyen-de.ts](</Volumes/SSD NGOÀI/omr-app/server/src/luyen-de.ts>), [ma-tran-hoa-2026.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/ma-tran-hoa-2026.ts>) | 03,09 |
| Đoàn | [game-v2-doan.ts](</Volumes/SSD NGOÀI/omr-app/server/src/game-v2-doan.ts>), [doan-core.ts](</Volumes/SSD NGOÀI/omr-app/src/game/than-thu-v2/doan-core.ts>) | 10 |
| Sổ học | [su-kien-hoc.ts](</Volumes/SSD NGOÀI/omr-app/server/src/su-kien-hoc.ts>) | 04,12,14 |
| EXP | [exp-cau-hinh.ts](</Volumes/SSD NGOÀI/omr-app/server/src/exp-cau-hinh.ts>), [exp-hoc-tap.ts](</Volumes/SSD NGOÀI/omr-app/server/src/exp-hoc-tap.ts>), [exp-chuyen-trang-thai.ts](</Volumes/SSD NGOÀI/omr-app/server/src/exp-chuyen-trang-thai.ts>), [exp-d1.ts](</Volumes/SSD NGOÀI/omr-app/server/src/exp-d1.ts>) | 12 |
| Đường cũ của EXP | [game-v2-academic.ts](</Volumes/SSD NGOÀI/omr-app/server/src/game-v2-academic.ts>) | 01,12,15 |
| Cấp và hấp thụ | [hap-thu-ngay.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/hap-thu-ngay.ts>), [kinh-nghiem.ts](</Volumes/SSD NGOÀI/omr-app/src/game/than-thu-hoa-hoc/kinh-nghiem.ts>), [game-v2-hap-thu.ts](</Volumes/SSD NGOÀI/omr-app/server/src/game-v2-hap-thu.ts>) | 13,15 |
| Khiên, dự trữ | [exp-ho-so-game.ts](</Volumes/SSD NGOÀI/omr-app/server/src/exp-ho-so-game.ts>), [kinh-te-game.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/kinh-te-game.ts>) | 13,15 |
| Cửa hàng | [game-v2-shop.ts](</Volumes/SSD NGOÀI/omr-app/server/src/game-v2-shop.ts>), [phu-kien-danh-muc.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/phu-kien-danh-muc.ts>) | 13–15 |
| Giáo viên và phiếu chữa | [rut-de.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/rut-de.ts>), [rut-de-chua.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/rut-de-chua.ts>), [thuat-toan-rut-cau-sai.ts](</Volumes/SSD NGOÀI/omr-app/src/lib/thuat-toan-rut-cau-sai.ts>) | 08–09 |

Các liên kết trỏ tới tệp thật trong dự án. Đây là bản đồ định hướng từ mốc kiểm toán; phải tìm lại nơi gọi trên mã hiện tại trước khi sửa.

Mô-đun mới nên tách theo trách nhiệm: điều kiện phạm vi, đánh giá mức, lịch nhớ, chọn câu, kế hoạch, quyền thưởng và chuyển đổi. Tên cuối cùng theo quy ước kho mã; không tạo một tệp khổng lồ chứa toàn bộ chính sách.

### 3.2. Phụ thuộc công việc

```text
01 Chốt mốc và luồng
  → 02 Chất lượng câu + 03 Phạm vi cá nhân
  → 04 Sổ học và hồ sơ chung
  → 05 Mức vừa sức + 06 Lịch ôn
  → 07 Kế hoạch thời gian
  → 08 Bộ chọn chung
  → 09 Nối ba app
  → 10 Đoàn + 11 Trải nghiệm

04 + 07 → 12 EXP → 13 Cấp/khiên/cửa hàng

14 Hiệu năng được đo từ01 và tối ưu khi luồng đã đúng
15 Chuyển đổi được chuẩn bị trước khi bật 12–13
16 Kiểm thử theo từng bước, không để cuối mới bắt đầu
17 Đối chiếu/thử nghiệm → 18 Phát hành có đo lường
```

Không cần chờ toàn bộ nghiên cứu xong mới sửa A01–A05/A07–A08. Các thay đổi có phạm vi rõ và kiểm thử đủ có thể triển khai trước; giữ việc đo tác động cho các lựa chọn mới về mô hình, EXP và trải nghiệm.

### 3.3. Danh sách bàn giao cuối

- [ ] Bảng các luồng/cờ thực tế và phiên bản đã kiểm.
- [ ] Danh sách chất lượng kho câu, family và phạm vi từng em.
- [ ] Bộ quy tắc chung, lý do chọn và cấu hình có phiên bản.
- [ ] Một định nghĩa đạt ngày trên cả ba app.
- [ ] Bảng EXP cốt lõi/tự chọn và ánh xạ tất cả nguồn thưởng.
- [ ] Mô phỏng cấp 10/ngày 12, khiên/ngày 21 và ví/mua/rèn.
- [ ] Kế hoạch chuyển dữ liệu cùng bảng số dư trước/sau.
- [ ] Bằng chứng kiểm thử hai thiết bị, mất mạng, qua 0 giờ và gửi trùng.
- [ ] Báo cáo hiệu năng trước/sau tại môi trường đại diện.
- [ ] Báo cáo đối chiếu/thử nghiệm học tập, có kết quả riêng nhóm cần nâng đỡ.
- [ ] Hướng dẫn bật/tắt từng đợt và quay lui không mất quyền lợi.
- [ ] Xác nhận bản đã phát hành thực tế; liệt kê phần còn chưa áp dụng.

<a id="nguon"></a>
## 4. Bằng chứng, mô phỏng và nghiên cứu

### 4.1. Tài liệu và phép tính đã có trong dự án

- [Bản kiểm toán chi tiết ngày 23/09](</Volumes/SSD NGOÀI/omr-app/docs/kiem-toan-ca-nhan-hoa-2309/de-xuat-ca-nhan-hoa-va-exp.md>).
- [Chương trình tái hiện 8 tình huống và mô phỏng kinh tế](</Volumes/SSD NGOÀI/omr-app/scripts/kiem-toan-ca-nhan-hoa-2309.mjs>).
- [Kết quả JSON đã lưu](</Volumes/SSD NGOÀI/omr-app/docs/kiem-toan-ca-nhan-hoa-2309/bang-chung-va-mo-phong.json>).

Lệnh tái hiện tại thư mục dự án: `node scripts/kiem-toan-ca-nhan-hoa-2309.mjs`. Chương trình dùng dữ liệu tổng hợp và hàm thuần, không đọc hồ sơ thật hay ghi D1/R2. Nó xác nhận những tình huống của mã ở mốc kiểm toán và tính mô phỏng; không thay thế bộ test sản phẩm sau sửa, không đo hiệu quả học tập thực.

### 4.2. Nghiên cứu dùng làm cơ sở định hướng

| Nguồn | Điều có thể dùng | Giới hạn khi áp dụng |
|---|---|---|
| [Karpicke & Blunt, 2011](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf) | Cho học sinh tự gợi nhớ trước khi mở lời giải; kiểm tra hiểu và suy luận | Nghiên cứu trên học nội dung khoa học, không tự chứng minh mọi dạng tính Hóa có cùng mức lợi ích |
| [Rohrer và cộng sự, 2019](https://gwern.net/doc/psychology/spaced-repetition/2019-rohrer.pdf) | Xen kẽ phương pháp sau khi đã có nền để luyện nhận ra cách giải | Bằng chứng thực nghiệm ở Toán 7; cần đo khi đưa vào lớp Hóa |
| [Wilson và cộng sự, 2019](https://www.nature.com/articles/s41467-019-12552-4) | Độ khó phù hợp đáng được điều chỉnh; tránh quá dễ/quá khó | Quy tắc 85% dựa trên những điều kiện mô hình cụ thể, không là định luật cho mọi học sinh |
| [Ryan & Deci, 2020](https://selfdeterminationtheory.org/wp-content/uploads/2020/06/2020_RyanDeci_IntrinsicandExtrinsic.pdf) | Quyền lựa chọn, cảm nhận làm được và kết nối hỗ trợ chất lượng động lực | Là tổng quan của các tác giả; không chứng minh riêng mức EXP hay thiết kế game này |
| [Benchmark chính thức của Open Spaced Repetition](https://github.com/open-spaced-repetition/srs-benchmark) | Đối chiếu mô hình dự báo khả năng nhớ, gồm FSRS-6/7 tại thời điểm tra cứu | Thứ hạng dự báo trên dữ liệu benchmark không là kết luận tốt nhất cho học Hóa hoặc chống nhàm chán |

Các lịch ngắn trong buổi, tỷ lệ câu thử thách, ngưỡng lên bậc, trọng số 0,30/0,25/0,20/0,15/0,10, mức 220 EXP và đường 365 ngày là **đề xuất thiết kế trong tài liệu này**. Chúng cần được kiểm tra bằng dữ liệu của app; không gán cho các nghiên cứu trên như thể tác giả đã xác nhận.

### 4.3. Kết quả cần hướng tới

Sau triển khai, mỗi câu được giao có thể trả lời bốn câu hỏi: **em đã học nền chưa; vì sao câu này phù hợp hôm nay; nó giúp nhớ hay giúp tiến thêm điều gì; kết quả làm bài sẽ thay đổi kế hoạch và quyền nhận thưởng ra sao**.

Mỗi ngày học sinh có một mục tiêu khả thi, được hỗ trợ khi mắc lỗi và thấy thành quả kiểm chứng được. Giáo viên có thông tin để can thiệp; phụ huynh hiểu tiến độ mà không vô tình giao chồng tải. EXP và game phục vụ nhịp tiến bộ đó, còn chất lượng được quyết định bằng khả năng nhớ và tự giải bài mới của từng em.
