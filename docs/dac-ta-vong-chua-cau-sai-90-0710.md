# Đặc tả vòng chữa câu sai theo từng bước

Ngày: 07/10/2026, giờ Việt Nam. Dự án: `omr-app`. Mã nguồn được đối chiếu tại commit `2e47db85`.

Tài liệu giao Claude triển khai vòng chữa câu sai trong app Hoá: xác định bước học sinh mắc, chữa đúng bước, cho em ghép lại cả bài và kiểm tra tự làm ở lần gặp lại thứ hai. Mục tiêu sản phẩm là hướng tới ít nhất 90% lỗi được tự sửa; việc đạt tỷ lệ này phải được kiểm chứng bằng dữ liệu học sinh thật. Không thay kết quả thực tế bằng tỷ lệ mô phỏng hoặc hạ tiêu chuẩn đóng lỗi.

**Yêu cầu bổ sung bắt buộc:** học sinh cảm thấy được hiểu đúng chỗ vướng, hiểu từng bước sai và muốn tiếp tục sửa. Claude phải triển khai cả cách dạy lẫn trải nghiệm; một chuỗi “sai → hiện lời giải → chọn lại” chưa đạt. Các mục 5.5–5.6, 6.4, 11.6–11.9, 12.4, 13.6–13.7 và 14.5 quy định chi tiết yêu cầu này.

## 1. Yêu cầu của người dùng và quyết định triển khai

Người dùng yêu cầu quét toàn bộ vòng xử lý câu sai, muốn học sinh khắc phục 90% câu sai, biết em mắc ở đâu khi gặp lại và giúp từng bước tới khi làm được ở lần gặp lại thứ hai. Sau đó người dùng yêu cầu viết đặc tả cho Claude code.

Các quyết định trong tài liệu này là mặc định triển khai cho yêu cầu trên. Claude không cần hỏi lại các lựa chọn kỹ thuật thông thường đã được quy định. Nếu mã thực tế khác bản đối chiếu, cập nhật điểm nối nhưng giữ các bất biến về dữ liệu, chấm bài và đo kết quả.

1. **Lần làm ban đầu** là lượt em làm sai và tạo đợt lỗi.
2. **Gặp lại 1** là lượt chữa đầu tiên sau đó: chẩn đoán, sửa bước, luyện nền cần thiết, ghép lại cả bài. Các câu nhỏ trong lượt này không tăng số lần gặp lại.
3. **Gặp lại 2** là lượt kiểm chứng tiếp theo, sau một khoảng cách thời gian, bằng bản tương đương chưa lộ đáp án. Nộp lại do lỗi mạng, tải lại trang, mở ở máy khác không tạo lượt mới.
4. **Đã tự sửa** nghĩa là có bằng chứng tự giải đúng cả câu. **Đã đóng lỗi** nghĩa là đạt luật đóng lỗi chung. Hai khái niệm phải có nhãn riêng.
5. Dùng chung trạng thái lỗi giữa các kênh. Điểm bài cũ, cách chấm Phần I/II/III và thưởng game giữ luật hiện có.
6. Thử nghiệm có công tắc, triển khai theo giai đoạn. Không kích hoạt toàn trường ngay sau khi viết xong mã.
7. **Hiểu bước sai** phải có bằng chứng em phân biệt được hai cách nghĩ và làm được bài mới; bấm “Em hiểu rồi”, đọc lâu hoặc chép lại lời giải không đủ.
8. **Hấp dẫn** phải được đánh giá qua trải nghiệm học sinh thật, mức tự nguyện tiếp tục và kết quả học. Không nghiệm thu chỉ bằng giao diện đẹp, hiệu ứng hay số lần bấm.

## 2. Hiện trạng cần sửa

| Điểm nối hiện có | Hành vi đã xác minh | Thay đổi cần triển khai |
| --- | --- | --- |
| `server/src/su-kien-hoc.ts` | Sổ chung và hàm `ghiSuKien`; có hỗ trợ, mục đích, visibility, raw JSON | Nối kết quả Tu luyện và bằng chứng chữa vào sổ theo quy tắc mục 9 |
| `server/src/loi-hoc-luat.ts` | Từ 29/09; đúng hai ngày, lượt cuối cách sai ít nhất ba ngày; chặn hỗ trợ 12 giờ; duy trì 14/30 ngày | Giữ lõi đóng lỗi, mở rộng nhận diện hỗ trợ và bằng chứng tương đương |
| `server/src/hang-chua-loi.ts` | Gom câu sai nhiều kênh, áp luật chung lên SRS2 | Dùng cùng danh mục lỗi và phép quy về câu gốc với vòng chữa mới |
| `server/src/chan-doan-buoc-sai.ts` | Chọn nền nghi yếu, hoặc chìa khoá + hai ý; chẩn đoán thay chỗ câu sửa trong Đảo/Đoàn | Gắn chẩn đoán vào lượt chữa chứa cả phần ghép bài; không kết thúc lượt chỉ vì đã trả lời câu chẩn đoán |
| `server/src/omni-buoc-sai-uu-tien.ts` | Ưu tiên bước tự khai gần đây rồi xác suất kỹ năng | Dùng để xếp giả thuyết cần kiểm, không dùng như kết luận nguyên nhân |
| `server/src/cau-bo-tro.ts` | Có `song_sinh`, `cau_kiem`, `nhan_nen`, các bước lời giải | Thêm bản đồ bước, quan hệ tiên quyết, câu kiểm mới và kiểu lỗi |
| `server/src/cau-anh-em.ts`, `ban-khac-ao.ts` | Song sinh → biến thể/ý mới → câu anh em → xáo → nguyên văn | Phân biệt bản tương đương đủ dùng để kiểm chứng với bản chỉ phục vụ luyện |
| `server/src/lam-lai-so.ts` | `tc` nối kết quả bản khác về câu lỗi; `xt` quy lựa chọn về gốc | Tái sử dụng, thêm chứng cứ tương đương; không tự phân tích qid ở từng kênh |
| `server/src/tu-luyen.ts` | Kết quả chỉ ở bảng Tu luyện; chưa ghi `su_kien_hoc` | Bật đồng bộ bằng cờ thử nghiệm, giữ không thưởng EXP từ nguồn này |
| `server/src/tu-luyen-cau-sai.ts` | Kho nhận ca/game/luyện đề/Tu luyện; đúng hai ngày là rời kho | Khi cờ mới bật, trạng thái khắc phục lấy từ luật chung, bao phủ nguồn chung |
| `server/src/ho-so-nam-kt.ts`, `ho-so-cau-hinh.ts` | Hồ sơ dùng ba ngày đúng để gắn đã khắc phục; lịch nhớ FSRS | Thống nhất nhãn lỗi, giữ FSRS là mô hình lịch nhớ riêng |
| `server/src/thang-tu-go.ts` | Câu kiểm, luyện nền, cổng nỗ lực gửi thầy | Tái sử dụng bộ chấm và hỗ trợ thầy; bổ sung đường chuyển thầy cho phiên chữa thực sự bế tắc |
| `server/src/srs2-loi.ts` | Sai từ bốn lần, lần cuối sai thì cắt tỉa sang cần thầy dạy lại | Giữ lỗi trong danh mục cần xử lý; chỉ dừng tự phát câu khó, không coi lỗi là xong |

`src/lib/lich-on-lai.ts` có lịch theo buổi nhưng chưa thấy nơi gọi các hàm ghi sai/đúng trong `src`. Không dùng tệp đó làm nguồn trạng thái mới. Nhãn FSRS hoặc lịch 1/3/7 không được thay luật chứng minh đã sửa lỗi.

## 3. Phạm vi và bất biến

### 3.1 Phạm vi đợt lỗi

Một đơn vị xử lý là `(học sinh, câu chuẩn, đợt lỗi)`. Cùng một nội dung được chép ở nhiều tờ phải được gộp theo nhóm nội dung đã xác minh. Không gộp tất cả câu cùng dạng: hai câu cùng dạng có thể yêu cầu những bước khác nhau.

Đợt lỗi mở khi có lượt sai tự làm hợp lệ; bỏ trống tính theo quy tắc nguồn hiện có. Ca thi chỉ hiện trong vòng chữa sau công bố. Lượt đọc lời giải, lướt, câu chẩn đoán và bài nhỏ có hỗ trợ không mở lỗi của cả câu gốc. Sai tiếp khi lỗi còn mở cập nhật lần sai cuối trong cùng đợt; sai lại sau đóng lỗi tạo đợt mới.

Học sinh không bị mất lỗi chỉ vì câu ngoài kho game, thiếu học liệu, đổi phạm vi đã dạy, bị nghi đáp án hoặc cần thầy dạy lại. Các trường hợp đó phải có trạng thái và việc xử lý tương ứng.

### 3.2 Bất biến bắt buộc

- Đáp án, lời giải, giá trị đúng, hoán vị bí mật và kết quả chưa nộp chỉ ở máy chủ. Serializer dùng danh sách trường cho phép.
- Token xác định học sinh. Không nhận SBD của máy khách làm quyền đọc hoặc nộp bài.
- Đề đang bảo vệ, câu sai khối, câu nghi đáp án, câu tự luận và phạm vi cá nhân đi qua cổng hiện có ở cả phát, tiếp tục phiên và chấm.
- Chấm theo bản đề lúc phát. Kho hoặc bộ sinh thay phiên bản thì không chấm bằng đáp án mới.
- Bản ghi kết quả lần nộp đầu không sửa sau khi em đã thấy phản hồi.
- Lượt có hỗ trợ được ghi là có hỗ trợ. Không cộng mốc tự làm dù đáp án cuối đúng.
- Câu chẩn đoán và câu nhỏ không làm tăng số lần sai của câu gốc, không làm em bị cắt tỉa oan.
- Refresh, mạng chậm, hai tab và gửi lại cùng thao tác không tạo thêm lượt, EXP, thẻ thầy hoặc bằng chứng đúng.
- Tất cả phép đếm theo ngày dùng giờ Việt Nam từ thời gian máy chủ. Thời gian máy khách chỉ là thông tin đo, có kẹp.
- Không xoá dữ liệu thật hoặc viết lại điểm bài cũ để triển khai thử nghiệm.

## 4. Luồng học sinh

### 4.1 Ngay sau lượt sai

Lưu lựa chọn, phần/ý sai, kết quả trung gian nếu em đã nhập, thời gian, mức hỗ trợ máy chủ đã cấp và phiên bản câu. Tự khai “em mắc bước nào” và mức tự tin là dữ liệu bổ sung, không bắt buộc.

Đề xuất nút **Sửa từng bước** trong màn xem lại câu sai ngoài giờ kiểm tra. Không bật tấm chữa tự động khi em đang đánh Bi-a hoặc đang làm câu khác. Trong ca thi chỉ ghi sự kiện; không hiện gợi ý hay nút chữa.

Nếu em chưa được xem nội dung ca hoặc câu đang bị nghi đáp án, trả lý do cụ thể. Không âm thầm đổi câu hoặc ghi rằng em đã khắc phục.

### 4.2 Gặp lại 1

1. Hiện lại đầy đủ đề, hình/bảng và lựa chọn đã làm. Không tự mở lời giải trọn bài trước chẩn đoán.
2. Hỏi một câu ngắn để kiểm giả thuyết về bước vướng. Nếu lời giải đã lộ trước đó, ghi chẩn đoán có hỗ trợ; kết quả vẫn giúp hướng dạy nhưng không chứng minh tự làm.
3. Tìm bước đầu tiên hỏng trong chuỗi phụ thuộc. Cần thì kiểm một bước tiên quyết để phân biệt nguyên nhân.
4. Cho em đối chiếu cách nghĩ cũ với quan hệ đúng, tự dự đoán/kiểm một điểm quyết định, rồi giải thích đúng chỗ vướng. Cho một bài nhỏ dữ kiện mới theo mục 5.5.
5. Sau khi bài nhỏ đạt, quay lại bước tương ứng trong bài lớn. Không yêu cầu đọc lại mọi bước đã qua.
6. Kiểm các bước còn lại mà em chưa chứng minh được. Phần II chỉ cần sửa ý sai và bước dùng chung, sau đó làm lại đủ bốn ý ở bài lớn.
7. Cho em ghép lại cả bài trên bản tương đương dành cho luyện. Phần này vẫn thuộc gặp lại 1 và được ghi có hỗ trợ nếu em vừa được giúp.
8. Hiện thay đổi có bằng chứng: trước em vướng ở đâu, nay tự làm được phần nào, còn việc gì. Kết thúc bằng “Đã làm được với hướng dẫn. Em sẽ tự làm lại vào …” hoặc chuyển thầy có bằng chứng. Chưa ghi đóng lỗi.

### 4.3 Gặp lại 2

- Phục vụ bản tương đương chưa lộ đáp án, đủ dữ kiện và không thấp hơn đáng kể về yêu cầu tư duy.
- Bắt đầu không sớm hơn `max(kết thúc gặp lại 1 + 24 giờ, hỗ trợ gần nhất cùng cụm chữa + thời gian cấm hỗ trợ)`.
- Thời gian cấm hỗ trợ lấy tham số luật của học sinh; mặc định 12 giờ. Không hardcode lại khi luật đã được hiệu chỉnh.
- Không có lời giải, gợi ý hoặc kết quả trung gian được điền sẵn. Có nút “Em cần gợi ý”; bấm thì chuyển lượt thành hỗ trợ và đánh dấu chưa đạt chỉ số tự sửa ở lần hai.
- Cho tự giải cả câu; máy chủ khóa lần nộp đầu. Với trắc nghiệm, có thể yêu cầu thêm một câu kiểm phương pháp không tiết lộ đáp án trước khi em nộp câu chính.
- Đúng và đủ bằng chứng: nhãn “Đã tự sửa”, hẹn kiểm chứng tiếp theo theo luật chung.
- Sai: phản hồi bước có bằng chứng hỏng, chuyển về vòng hỗ trợ; kết quả lần hai vẫn giữ sai. Không cho nộp lại nhiều lần để biến chỉ số lần hai thành đúng.

Nếu em quay lại quá sớm, cho tiếp tục luyện có hỗ trợ hoặc xem lịch; không tính thành lượt kiểm chứng thứ hai. Nếu em bỏ dở bài kiểm, giữ bài chưa hoàn thành và mẫu đo chưa đạt, không đổi sang một bản dễ hơn để tăng tỷ lệ.

### 4.4 Sau gặp lại 2

Đúng một lần độc lập chưa đủ đóng lỗi. Giữ luật hiện có: ít nhất hai ngày đúng tự làm sau lần sai cuối, lượt đóng cách lần sai cuối đủ số ngày, bằng chứng bản khác khi có; rồi kiểm duy trì theo mốc 14 và 30 ngày mặc định tính từ ngày đóng. Lượt chữa có hỗ trợ của gặp lại 1 không được biến thành ngày đúng thứ nhất.

Vì vậy học sinh có thể “đã tự sửa ở gặp lại 2” và vẫn “chờ kiểm chứng”. Giao diện phải giải thích ngắn, không hiện hai nhãn mâu thuẫn “đã khắc phục” và “còn sai”.

## 5. Chẩn đoán bước sai

### 5.1 Bản đồ giải

Mỗi câu có 2–6 bước thiết yếu theo mặc định; bài dài hơn được chia thành cụm. Không chia thành hàng chục thao tác bấm. Bước có ID ổn định theo phiên bản, câu hỏi kiểm, kỹ năng liên quan, bước tiên quyết, cách giải thích, lỗi thường gặp và cách kiểm lại.

Các nhóm nguyên nhân:

| Mã | Ý nghĩa | Bằng chứng cần có |
| --- | --- | --- |
| `doc_de` | Đọc nhầm yêu cầu hoặc thiếu điều kiện | Trả lời sai câu hỏi về dữ kiện/điều kiện trước khi được chỉ |
| `kien_thuc` | Thiếu khái niệm hoặc quy tắc | Sai câu kiểm kiến thức riêng và một câu phân biệt phù hợp |
| `phuong_phap` | Chọn quan hệ hoặc bước tiếp theo sai | Biết tiên quyết nhưng chọn sai cách nối vào bài |
| `tinh_toan` | Sai phép tính, dấu, đơn vị, làm tròn | Chọn đúng quan hệ, nhập sai kết quả trung gian; phải xét chuẩn hóa số |
| `chua_xac_dinh` | Bằng chứng chưa đủ hoặc mâu thuẫn | Không gán nhãn chắc chắn chỉ từ đáp án cuối/thời gian/tự khai |

`so_y` không phải kết luận mặc định từ tốc độ. Có thể hiển thị lời nhắc soát lại khi có bằng chứng, nhưng không dùng nhãn này thay chẩn đoán.

### 5.2 Thứ tự kiểm

1. Phần/ý sai và giá trị trung gian cụ thể của lượt này.
2. Lỗi đã có bằng chứng ở đúng câu trong đợt này.
3. Bước học sinh tự khai.
4. Dữ liệu vi kỹ năng gần đây, bao gồm OMNI.
5. Kiểm từ bước nền đầu tiên chưa được chứng minh.

Các nguồn 3–4 chỉ xếp giả thuyết. Một đáp án nhiễu chỉ là tín hiệu, trừ khi câu đã có ánh xạ lỗi được kiểm định. Không nạp “chìa khoá” chứa quy tắc cần kiểm rồi coi câu sau đó là chẩn đoán độc lập.

Lưu mức kết luận `gia_thuyet`, `co_bang_chung` hoặc `chua_xac_dinh`, cùng IDs của các receipt hỗ trợ kết luận. Không đặt phần trăm tin cậy chẩn đoán giả. Nếu câu hỏi chỉ kiểm “đổi gam thành mol”, kết luận giới hạn ở kỹ năng đó; muốn kết luận cụ thể em nhầm nguyên tử khối với khối lượng mol phải có câu phân biệt tương ứng.

Bước downstream sai do số upstream sai không tạo thêm kết luận mất kiến thức downstream. Nếu em dùng đúng quan hệ với số của em, ghi bước ấy có phương pháp đúng và chữa upstream trước.

### 5.3 Điều kiện qua bước

- Đúng ngay câu chẩn đoán lần đầu: có thể qua bước hoặc dùng một câu phân biệt nếu chọn ngẫu nhiên còn dễ.
- Sai rồi được giải thích: phải đúng câu kiểm mới cùng kỹ năng, không lặp nguyên câu đã thấy đáp án.
- Với câu chọn hai phương án/Đ–S đơn lẻ, yêu cầu hai câu mới khác nội dung hoặc một câu tự nhập/giải thích có rubric kiểm được; không lấy một lần đoán đúng làm đủ.
- Bước đã qua giữ kết quả trong phiên. Có bằng chứng sai lại mới mở bước ấy; không reset mọi bước khi chỉ lỗi tính cuối.
- Thiếu câu kiểm mới: ghi thiếu học liệu, cho hỗ trợ hiện có hoặc thầy; không tự tuyên bố bước đã đạt.

### 5.4 Các mức hỗ trợ

| Mức | Cách giúp | Phần học sinh phải làm |
| --- | --- | --- |
| 0 | Chỉ câu hỏi, dữ kiện và đơn vị | Tự chọn cách và trả lời |
| 1 | Nhắc điều kiện/quy tắc liên quan | Tự viết quan hệ hoặc tính |
| 2 | Khung làm còn chỗ trống | Điền phần quyết định và giải thích nếu cần |
| 3 | Ví dụ khác được giải ngắn | Tự làm một bài mới rồi quay lại bước gốc |

Không cấp tất cả mức trong một lần. Mỗi lần thất bại chọn mức kế tiếp hoặc kiểm lại tiên quyết. Tối đa hai vòng “giải thích → bài mới” cho cùng bước trong một lượt, mặc định tối đa bốn câu chẩn đoán và 10 phút/lượt chữa. Hết ngân sách lưu tiến độ, đề nghị nghỉ hoặc chuyển thầy; đây là giới hạn tải nhận thức, không phải thời gian thi và không có đếm ngược gây áp lực.

### 5.5 Vòng hiểu một bước sai

Mỗi bước cần chữa có sáu thành phần dưới đây. Chúng là cấu trúc học liệu và các nhánh tương tác, không phải sáu màn hoặc sáu câu bắt buộc. Bộ điều phối bỏ thành phần đã có bằng chứng, gộp các câu kiểm khi phù hợp và tuân thủ ngân sách mục 5.4.

| Thành phần | Học sinh trải nghiệm | Điều máy chủ phải lưu/kiểm |
| --- | --- | --- |
| Nhận đúng cách em đã nghĩ | “Em đã dùng 23 cho NaOH. Mình kiểm xem 23 đang chỉ điều gì nhé.” | Dùng đáp án/diễn giải em thực sự đã đưa; chưa đủ bằng chứng thì hỏi, không bịa suy nghĩ |
| Tìm điểm rẽ | Em chọn đại lượng, điều kiện hoặc phép nối ở đúng chỗ quyết định | Receipt của câu phân biệt; tách sai khái niệm, sai áp dụng và sai tính |
| Thấy vì sao | Em dự đoán rồi đối chiếu một biểu diễn, ví dụ hoặc phản ví dụ ngắn | Học liệu có quan hệ nhân quả và ý nghĩa đại lượng; không chỉ đưa công thức |
| Tự sửa quan hệ | Em tự chọn/điền phần quyết định trong cách làm đúng | Bộ chấm xác định, lưu mức hỗ trợ; không điền sẵn toàn bộ rồi yêu cầu bấm tiếp |
| Dùng vào bài mới | Em giải một câu chưa lộ, khác dữ kiện nhưng giữ kỹ năng | Khóa lần nộp đầu, xác minh bản mới; giải thích vừa nhận vẫn tính là học có hỗ trợ |
| Nối lại bài lớn | Em chỉ ra bước này giúp tìm gì tiếp theo và ghép lời giải | Giữ các bước đã qua; vẫn cần kiểm cả câu theo mục 4 |

Học liệu phải giúp em trả lời được: **đại lượng này nghĩa là gì; vì sao phải làm bước này; cách cũ sai ở đâu; quy tắc đúng dùng trong điều kiện nào; bước tiếp theo dựa vào kết quả này ra sao.** Chỉ trình bày nội dung liên quan đến chỗ vướng hiện tại, có nút xem thêm cho em muốn đào sâu.

Mẫu phản hồi sau nộp: **ghi nhận phần đúng → chỉ đúng điểm lệch → giải thích hệ quả → giao một hành động em tự làm**. Ví dụ có bằng chứng: “Em đã chọn đúng n = m/M. Số 23 đang là nguyên tử khối Na, còn đề cho NaOH. Nếu dùng 23, em đang coi phần O và H không đóng góp vào khối lượng. Em thử tính M cho cả NaOH nhé.” Nếu chưa xác nhận nguyên nhân, dùng “Mình kiểm xem em đang dùng M của chất nào nhé”, không kết luận em nhầm.

Để xác nhận bước đã hiểu trong phiên, cần bằng chứng phân biệt cách nghĩ đúng/sai **và** câu chuyển giao mới theo mục 5.3. Có thể dùng một bài nhỏ chấm được cả quan hệ và kết quả, hoặc câu chọn lý do kèm câu số mới. Đáp án “vì công thức là vậy” hay lặp nguyên lời app không được gắn nhãn hiểu nguyên nhân. Không bắt mọi em viết đoạn văn; dùng chọn lý do/phản ví dụ, số hoặc quan hệ có rubric xác định. Lời tự giải thích tự do được lưu cho thầy nhưng không tự chấm đúng bằng LLM.

Trạng thái bước phải tách `da_lam_dung_trong_phien` và `co_bang_chung_hieu_trong_phien`; thiếu bằng chứng lý do thì không giả định đã hiểu. Hai trạng thái này thuộc dạy học, không thay bằng chứng độc lập ở gặp lại 2 hoặc luật đóng lỗi. Bài kiểm trì hoãn cần kiểm lại quan hệ quyết định bằng rubric đã khóa khi phát; nếu thêm câu kiểm phương pháp thì khóa câu chính trước khi phản hồi, để câu phụ không tiết lộ cách làm câu chính.

### 5.6 Cá nhân hóa cách gỡ và giảm dần trợ giúp

- Biết khái niệm, chọn đúng quan hệ, sai phép tính: chữa phép tính/đơn vị và cách tự soát; không bắt học lại kiến thức đã chứng minh.
- Sai tiên quyết: gỡ tiên quyết gần nhất; không dùng ví dụ đòi hỏi thêm kiến thức em chưa có. Sai do đọc điều kiện thì giúp em nhận điều kiện trước khi dạy công thức.
- Sai lại sau cùng lời nhắc: đổi biểu diễn hoặc kiểm giả thuyết khác. Không hiện nguyên lời giải cũ thêm lần nữa rồi hỏi cùng một câu.
- Qua bước: giảm trợ giúp ở câu mới và để em tự chọn bước tiếp. Không để khung điền sẵn tồn tại trong bài kiểm độc lập.
- Có cách giải khác hợp lệ: chấm bằng rubric/cách giải đã kiểm hoặc chuyển xem xét, không đánh sai chỉ vì khác thứ tự mẫu. Thiếu bộ chấm cho cách tự do thì nói rõ giới hạn, không suy diễn em mất kiến thức.
- Kết quả nhanh/chậm không quyết định nhãn hiểu. Học sinh cần hỗ trợ đọc, bàn phím hoặc diễn đạt vẫn có đường kiểm cùng kiến thức và tiêu chuẩn.
- Hai vòng chưa gỡ được: giữ những bước em đã qua, mô tả đúng điểm còn vướng để thầy tiếp tục. “Em đã làm đúng phần đổi mol; mình cần thêm cách giải thích tỉ lệ phản ứng” chỉ được hiện khi có receipt tương ứng.

## 6. Học liệu và bản tương đương

### 6.1 Hợp đồng học liệu mới

Bổ sung cấu trúc theo phiên bản, tương thích dữ liệu `cau_bo_tro` cũ. Đề xuất kiểu TypeScript trên máy chủ:

```ts
interface BuocChua {
  id: string;
  thuTu: number;
  tieuDe: string;
  tienQuyet: string[];
  viKyNang: string[];
  yApDung?: number[]; // chỉ số ý Phần II, 0..3
  chanDoan: ProbeRef[];
  phanBiet: ProbeRef[];
  kiemLai: ProbeRef[];
  hieuBuoc?: HieuBuoc; // bắt buộc với học liệu chữa mới; dữ liệu cũ có thể thiếu
  hoTro: { muc: 1 | 2 | 3; noiDung: string; viDuRef?: string }[];
  loiThuongGap: { ma: string; loai: LoaiLoi; tinHieu: string; probeXacNhan: string }[];
}
interface HieuBuoc {
  mucTieu: string; // kết quả em có thể tự làm và giải thích ở bước này
  yNghiaDaiLuong: string;
  viSaoCanBuoc: string;
  dieuKienApDung: string;
  noiVoiBuocSau: string;
  doiChieu: {
    maLoi: string;
    probeXacNhan: ProbeRef;
    cachNghiCu: string; // chỉ trình bày như cách của em sau khi có bằng chứng
    diemLech: string;
    heQua: string;
    cachDung: string;
  }[];
  bieuDien?: {
    loai: 'cong_thuc' | 'so_do' | 'bang' | 'don_vi';
    noiDung: string;
    moTaVanBan: string;
    hienSau: 'nop_chan_doan' | 'xin_ho_tro';
  };
  kiemLyDo: ProbeRef[];
  chuyenGiao: ProbeRef[];
  phanViDu?: ProbeRef[]; // kiểm ranh giới áp dụng khi cần, không hỏi cho đủ số màn
}
interface HocLieuChua {
  schemaVersion: 1;
  contentVersion: string;
  qidGoc: string;
  buoc: BuocChua[];
  banGhepBai: VariantRef[];
  banKiemChung: VariantRef[];
}
```

`ProbeRef`/`VariantRef` là tham chiếu đến câu kho hoặc bộ sinh có phiên bản, kèm metadata để máy chủ kiểm phù hợp. Không gửi ref chứa seed có thể suy đáp án hoặc rubric riêng xuống máy em. ID bài trên máy em là ID opaque của item đã phát.

### 6.2 Kiểm học liệu

Máy soạn tạo học liệu trước, bộ kiểm kiểm lại đáp án và tương đương trước khi phục vụ. Không gọi LLM tùy ý để sinh đáp án rồi tin kết quả trên đường học sinh đang nộp.

Phải kiểm: đồ thị bước không có chu trình; ref tiên quyết tồn tại; câu hỏi đủ đề/hình/bảng; đáp án đúng định dạng phần; bộ sinh có phiên bản; lời gợi ý không trả lời trực tiếp câu kiểm chưa nộp; các câu kiểm mới không trùng nội dung đã lộ; phương án nhiễu có ý nghĩa; khối đúng; câu không nghi đáp án.

Nếu dùng AI để phân loại lời giải em tự viết, chỉ lưu nhận xét/hypothesis; bản đầu tiên dùng câu số/chọn có bộ chấm xác định làm chứng cứ đóng lỗi. Không dùng tự nhận xét “đúng” của AI làm kết quả điểm.

### 6.3 Thế nào là bản tương đương dùng để kiểm chứng

Cùng các vi kỹ năng thiết yếu, cùng cấu trúc phụ thuộc, cùng yêu cầu lập luận và độ khó phù hợp. Dạng bài và phần giống nhau là cần nhưng chưa đủ. Khi thiếu metadata chứng minh tương đương, câu anh em chỉ dùng để luyện, không chứng minh đã sửa câu gốc.

Phần I đổi dữ kiện/ngữ cảnh và đáp án thực; Phần II bộ ý mới phải vẫn kiểm các ý/kỹ năng cần sửa, sau cùng chấm đủ bốn ý; Phần III đổi số liệu với đáp án được tính và kiểm độc lập. Không tự sinh câu tự luận vào kênh chấm tự động.

Xáo phương án, xáo ý hoặc đưa lại nguyên văn chỉ được tính luyện. Không tính đạt chỉ số lần hai bằng những bản này. Nếu chỉ có nguyên văn, hiển thị tiến độ luyện và trạng thái thiếu bản kiểm chứng. Câu gốc vẫn có thể dùng ở lượt kiểm trì hoãn theo luật đang có, nhưng báo cáo phải tách khỏi KPI bản tương đương.

Máy chủ khóa ít nhất hai bản riêng: một bản ghép bài có hướng dẫn, một bản kiểm chứng chưa lộ. Sau khi kiểm chứng sai và trả lời giải, bản đó được coi đã lộ; lần kiểm tiếp theo phải dùng bản khác.

### 6.4 Học liệu phải dạy được, không chỉ chấm được

Validator cấu trúc kiểm đủ trường `hieuBuoc` cho học liệu mới, ref tồn tại và không trùng nội dung đã lộ. Người duyệt học liệu kiểm ý nghĩa khoa học, điểm lệch và phạm vi áp dụng. Có metadata người/phiên bản duyệt; không coi đủ trường JSON là đã bảo đảm chất lượng dạy.

Một học liệu đạt cần: tín hiệu sai có câu phân biệt; giải thích rõ vì sao kết quả sai; ít nhất một câu mới kiểm cách nghĩ, không chỉ thay số vào khung; nối được với bài gốc; bản kiểm chứng giữ cùng yêu cầu; ít nhất một cách giúp khác khi cách đầu thất bại. Không dùng một template lời động viên cho mọi lỗi làm nội dung chữa.

Biểu diễn phải phục vụ khái niệm thật. Ví dụ NaOH dùng Na/O/H và đơn vị g/mol, gọi đúng “đơn vị công thức”; không mô tả chất ion thành một phân tử tùy tiện. Hình kéo/thả nếu có phải có lựa chọn/ô nhập tương đương dùng được với bàn phím và trình đọc màn hình. Dùng renderer và token hiện có; bản đầu không cần engine hoạt hình hay dịch vụ mới.

`hieuBuoc`, đối chiếu và ref riêng chứa nội dung có thể tiết lộ đáp án. Serializer chỉ phát phần phù hợp thời điểm. Không gửi toàn bộ rồi dùng CSS giấu. Câu giải thích đã xem phải đi vào log hỗ trợ; câu kiểm lý do/chuyển giao sắp phát vẫn không lộ đáp án. Học liệu cũ thiếu các trường này được báo thiếu độ phủ hiểu bước, có thể phục vụ hỗ trợ cũ nhưng không tự gắn nhãn trải nghiệm mới đã hoàn chỉnh.

## 7. Mô hình trạng thái

### 7.1 Tách trạng thái dạy và trạng thái lỗi

**Trạng thái dạy:** `can_chan_doan → dang_chua_buoc → dang_ghep_bai → cho_gap_lai_2 → dang_kiem_chung → da_tu_sua`. Nhánh ngoại lệ: `can_thay`, `thieu_hoc_lieu`, `tam_khoa`, `cau_thay_doi`.

**Trạng thái lỗi:** tiếp tục dùng `khong_loi`, `mo`, `cho_kiem`, `dong`, `duy_tri` từ `phatLaiLoi`. Không viết một luật đóng lỗi khác trong component, bảng Tu luyện hoặc bộ báo cáo.

Kết thúc hỗ trợ có thể đổi trạng thái dạy nhưng không đóng lỗi. Hai ngày tự làm đúng hợp lệ mới đổi trạng thái lỗi. Có lỗi mới thì trạng thái dạy được cập nhật theo bước có bằng chứng; không lấy `da_tu_sua` cũ để ẩn lỗi mới.

Một bài kiểm độc lập đã được cấp qua kênh khác có thể hoàn thành gặp lại 2 nếu máy chủ đã gắn item vào đợt trước khi nộp và item đáp ứng đầy đủ lịch, hỗ trợ và tương đương. Không chọn hồi tố một câu đã đúng để làm “lần hai”, bỏ qua câu sai trước đó hoặc đếm bản đã được cấp trong game và bài kiểm mới thành hai ngày đúng. Resume và chuyển kênh giữ cùng receipt/item khi đó là cùng một bài.

### 7.2 Chuyển trạng thái quan trọng

| Sự kiện | Chuyển trạng thái | Ghi nhận |
| --- | --- | --- |
| Sai tự làm hợp lệ | Mở/cập nhật đợt lỗi | Lượt sai gốc trong sổ |
| Mở phiên chữa | `can_chan_doan` hoặc tiếp tục bước đang làm | Cùng phiên, không tăng lượt khi refresh |
| Sai probe | Giữ bước; chọn phân biệt/hỗ trợ | Bằng chứng bước, không sai cả câu gốc |
| Qua kiểm lại bước | Bước đạt; chọn bước tiếp | Mức hỗ trợ và probe mới đã dùng |
| Ghép bài đúng có hỗ trợ | `cho_gap_lai_2` | Đạt có hướng dẫn, lịch kiểm độc lập |
| Hết ngân sách, vẫn bế tắc | `can_thay` hoặc tạm nghỉ có lịch | Bằng chứng và việc tiếp theo |
| Kiểm lần hai đúng độc lập | `da_tu_sua`; lỗi còn chờ kiểm nếu chưa đủ | Kết quả lần đầu, bằng chứng tương đương |
| Kiểm lần hai sai/cần gợi ý | Về chữa bước | KPI lần hai không đạt, không ghi đè |
| Đủ bằng chứng chung | Lỗi `dong` | Ngày đóng, lịch duy trì |
| Sai tự làm sau đóng | Đợt lỗi mới | Đợt trước giữ lịch sử |

Không tạo đợt lỗi mới bằng mỗi câu nhỏ sai. Với lỗi đang mở, các sai gốc tiếp theo giữ episode ID; cập nhật `saiCuoi` và tiến độ đóng theo luật chung, không đổi cohort cũ để đẩy hạn đo mãi về sau.

## 8. Dữ liệu và phiên bản

### 8.1 Bảng chỉ thêm

Tên dưới đây là tên đề xuất, Claude có thể điều chỉnh khi cần tránh trùng nhưng phải giữ cấu trúc và hợp đồng hành vi.

| Bảng | Khóa và chỉ mục | Nội dung |
| --- | --- | --- |
| `chua_loi_dot` | PK `id`; index `(sbd, trang_thai, den_han)`; unique đợt đang mở được kiểm trong giao dịch | `sbd`, `qid_chuan`, `content_group`, sự kiện mở, `mo_luc`, `sai_cuoi`, nguồn, cohort/cờ thí nghiệm, trạng thái dạy, lịch gặp lại, version, revision |
| `chua_loi_phien` | PK `id`; index `(sbd, dot_id)`; unique `(dot_id, loai_luot, so_luot)` | Loại gặp lại 1/kiểm lần 2/kiểm sau đó, version snapshot, item đang phát, trạng thái, hỗ trợ gần nhất, bắt đầu/kết thúc, JSON tiến độ bước, revision |
| `chua_loi_item` | PK `id`; unique `(phien_id, thu_tu)` | Ref riêng + snapshot riêng máy chủ, loại item, bước, mức hỗ trợ, public JSON riêng, đã phát lúc nào, đã lộ lúc nào |
| `chua_loi_nop` | PK `id`; unique `(item_id, lan_nop)`; unique `(sbd, attempt_id)` | Đáp án khóa lần đầu, kết quả, thời gian máy chủ, mức hỗ trợ, bằng chứng lỗi/tương đương, response receipt, ledger key |
| `chua_loi_hoc_lieu` | PK `(bam, content_version)` | Bản đồ bước và bản tương đương đã kiểm; trạng thái dùng được, lý do thiếu/hỏng, bộ sinh phiên bản |

Trạng thái phiên/đợt là projection để tiếp tục giao diện. Bằng chứng nộp và `su_kien_hoc` là nguồn sự thật; phải có đường dựng lại projection và kiểm đối chiếu. Không xóa receipt lịch sử khi sửa bản đồ bước.

Có thể lưu snapshot item trong JSON của phiên nếu bảo đảm khóa bất biến, giao dịch và truy vấn lịch sử; không bắt buộc mỗi JSON có một bảng. Đừng thiết kế chỉ với localStorage: em đổi máy vẫn phải tiếp tục đúng phiên và số lượt.

Trường schema phải tách `trang_thai_day` và projection `trang_thai_loi`, hoặc có tên tương đương rõ ràng; không dùng một cột chứa lẫn `dang_chua_buoc` và `dong`. Unique đợt mở dùng khóa câu chuẩn ổn định và trường `dong_luc`/`dang_mo`, được kiểm nguyên tử; trạng thái `can_thay` và `thieu_hoc_lieu` vẫn là đợt mở.

Tiến độ từng bước bổ sung `maLoiDaXacNhan`, `receiptChanDoan`, `receiptLyDo`, `receiptChuyenGiao`, `mucHoTroCaoNhat` và kết luận hiểu trong phiên. Các receipt phải liên quan đúng bước/version; một receipt có thể chứng minh nhiều tiêu chí khi rubric cho phép. Bảng gốc hoặc JSON đều được, nhưng phải dựng lại được từ bằng chứng. Kết luận này không được tự viết thành một lượt đúng độc lập của câu gốc.

Đo trải nghiệm dùng event tối thiểu như `de_nghi_chua_da_hien`, `bat_dau_chua`, `tieptuc_tu_nguyen`, `tam_dung` và phản hồi rõ/chưa rõ tùy chọn. Client báo được nhìn thấy lời mời; event UI chỉ đo trải nghiệm, không chấm kiến thức. Dedupe theo học sinh/đợt/phiên/action, dùng thời gian máy chủ và quyền hiện có. Không thu màn hình, nội dung ngoài app hay từng phím bấm; giữ giải thích tự viết trong dữ liệu có quyền của thầy.

### 8.2 Quy câu gốc

Một hàm dùng chung xử lý `#n`, `~ss`, `~bt`, `~yd`, `tc` và trùng nội dung. Tái sử dụng `tachSongSinh`, `lanLamTuDongTc`, `sqlQidHoacTc` thay vì thêm regex ở từng đường.

Nếu làm câu anh em S thay cho Q: sổ ghi qid thật S, `raw.tc = Q`; kết quả đồng thời là lần làm S, nhưng thống kê lỗi/bài không đếm đôi. Chỉ dùng làm bằng chứng chuyển giao của Q khi có metadata tương đương đã kiểm. Liên kết phục vụ `tc` đơn thuần không tự biến mọi câu cùng dạng thành bằng chứng.

Cụm theo dõi lộ hỗ trợ gồm Q và các item/bản khác đã được nối vào đợt Q, cùng các bản trùng nội dung. Không lấy toàn bộ chương hoặc toàn bộ dạng để cấm tự làm một cách quá rộng.

### 8.3 Snapshot và thay kho

Item giữ phiên bản nội dung, bản học liệu, bộ sinh và tham số chấm lúc phát. Khi tiếp tục/chấm, đối chiếu quyền hiện tại và version. Nếu câu rút khỏi kho, thay đáp án, mất dữ kiện hoặc nghi đáp án mới: trả `cau_thay_doi`, giữ đợt lỗi, không ghi sai, không trả đáp án sai phiên bản. Tạo item thay hợp lệ; việc thu hồi được đếm trong báo cáo.

Phiên gốc vẫn đọc được lịch sử sau khi bộ sinh mới được triển khai. Tái sử dụng cơ chế `btv`/snapshot hiện có; không chấm phiên cũ bằng bộ sinh mới nhất.

### 8.4 Chống nộp trùng và cạnh tranh

Máy khách gửi `attemptId` và `expectedRevision`. Máy chủ giữ receipt theo học sinh/item và CAS revision. Cùng attempt/cùng payload trả lại receipt cũ; cùng attempt/payload khác trả xung đột, không sửa đáp án. Item đã khóa thì lần gửi khác không tạo lần đầu thứ hai.

Ghi receipt, chuyển trạng thái và event chung cần nhất quán. Ưu tiên batch D1 nguyên tử với điều kiện SQL phù hợp; D1 không cung cấp API `transaction()` giống một số ORM, không giả định có. Nếu phải dùng outbox, receipt và outbox ghi nguyên tử, phát sổ bằng khóa idempotent; chưa phát được thì báo pending, không trả đạt độc lập/KPI đã hoàn thành. Có job đối soát/retry và test lỗi ở từng ranh giới.

Không đổi `assisted` thành `none` khi retry. Không dùng thời gian retry làm thời gian nộp gốc. Cơ chế khóa phải giữ đúng dưới hai request đồng thời từ hai tab.

## 9. Nối sổ học và thống nhất khắc phục

### 9.1 Tu luyện

Trong phạm vi cờ mới bật, các lượt Tu luyện đã chấm hợp lệ phải ghi vào sổ chung, kể cả chế độ 2–4, để không còn câu sai chỉ tồn tại trong bảng riêng. Thêm nguồn `tu_luyen` vào kiểu/danh sách nguồn và rà mọi bộ đọc phân nhánh nguồn; không giả danh `game`, `luyen` hoặc `on_lai` để tránh sai quota/thưởng.

- `maNguon = tu_luyen:<luotId>`; một event mỗi lần nộp đầu của item, khóa ổn định.
- `qid` là câu thực sự hiển thị và được chấm; `raw.tc` về câu lỗi khi có thay, `chon` theo khung gốc nếu xáo.
- Bản thân mã câu trong Tu luyện có thể vẫn là Q trong khi nội dung là S. Phải lấy `hien`/snapshot để ghi S, không lấy Q rồi ghép đáp án S vào Q.
- Phải lưu đủ ref/hoán vị cho câu đã xáo. Hiện phần riêng chỉ có nhãn `bac` trong một số đường; bổ sung ref riêng trước khi phát, không suy hoán vị từ đáp án sau nộp.
- Chấm từng câu ghi một lần; nộp cả lượt đọc lại kết quả đã khóa và không ghi thêm. Các bản lặp trong cùng lượt giữ item key khác nhưng không tăng ngày đúng.
- Lời giải mở ở Tu luyện phải có dấu hỗ trợ máy chủ. `coGoiY` máy khách chỉ bổ sung, không được xóa hỗ trợ đã lưu.
- Không thưởng EXP, vàng, mảnh cho nguồn Tu luyện trong phiên bản này. Cập nhật tất cả reader EXP để không cộng gián tiếp khi sổ có thêm dòng; thêm test khóa điều này.
- Chế độ mới cho phép tiến độ sửa ảnh hưởng danh mục lỗi và lịch ôn chung. Dòng “không đổi câu trong game” phải cập nhật đúng: “Tu luyện không tính EXP. Kết quả sửa câu sai được cập nhật vào tiến độ học.”

Cờ tắt giữ hợp đồng Tu luyện cũ, bao gồm không ghi nguồn mới. Dữ liệu đã phát sinh khi cờ bật vẫn giữ; tắt cờ không xóa sự thật hoặc chạy lại bài cũ.

### 9.2 Các loại event chữa

| Loại | Nguồn và purpose đề xuất | Có tính cả câu gốc/đóng lỗi? |
| --- | --- | --- |
| Chẩn đoán bước | `nguon='tu_luyen'` hoặc nguồn phiên; `purpose='chan_doan'` | Không; chỉ quan sát kỹ năng, phải ghi mức hỗ trợ thực |
| Bài nhỏ/hỗ trợ bước | `purpose='chua_buoc'`, `assistance='assisted'` khi đã cấp gợi ý | Không; dù đúng hoặc sai |
| Đọc hướng dẫn/lời giải | Purpose đọc lời giải hiện có + exposure riêng của phiên | Không |
| Ghép bài có hỗ trợ | Purpose sửa cả câu phù hợp; `assistance='assisted'` | Là một lần luyện có hỗ trợ; không tính mốc độc lập |
| Kiểm cả câu độc lập | `purpose='repair'` hoặc giá trị tương thích hiện có; `assistance='none'` sau kiểm quyền/hỗ trợ | Có, khi bản tương đương được kiểm và đủ điều kiện |

Nếu thêm `chua_buoc`, cập nhật `SQL_LA_LAN_LAM` và mọi reader không dùng hằng này để loại bài nhỏ khỏi lần làm cả câu. Tách chẩn đoán có hỗ trợ khỏi chẩn đoán độc lập trong OMNI; không cấp tăng mastery từ câu đã hiển thị chìa khoá.

Raw event thêm namespace `chua` theo schema có phiên bản: `dotId`, `phienId`, `itemId`, `loai`, `buocId`, `mucHoTro`, `banTuongDuongDaKiem`, `version`, `lanGapLai`. Đây là dữ liệu máy chủ xác định, không chép nguyên JSON do máy khách gửi.

Trong thử nghiệm, `assistance='unknown'` hoặc thiếu bằng chứng thời gian lộ hỗ trợ không đủ để công nhận độc lập. Không chuyển dữ liệu cũ thiếu metadata thành `none` để làm KPI đẹp. Giữ tương thích phát lại dữ liệu ngoài phạm vi cờ nhưng ghi rõ phần lịch sử chưa thể phân loại.

### 9.3 Một phép đọc trạng thái lỗi

Tạo adapter trả kết quả lỗi chung cho mọi màn: trạng thái từ `phatLaiLoi`, đã tự sửa/lần hai từ bằng chứng nộp, lịch kế, trạng thái cần thầy/thiếu học liệu. `tu_luyen_khac_phuc` và nhãn hồ sơ `nam_kt_cau` không còn tự quyết đã khắc phục khi cờ mới bật.

Giữ FSRS để xếp ngày và mô hình nhớ; giữ SRS2 để chọn lịch/nguồn/ngân sách. Định nghĩa đóng lỗi duy nhất là luật chung. “Đã vững dạng” của OMNI là mức kỹ năng/dạng khác cấp độ, không đổi thành “mọi câu sai trong dạng đã đóng”.

Rà tối thiểu các reader: `docKhoCauSai`, `docQidSaiV2`, `docLanLam`, `docHoSo2`, thống kê chiến dịch/lớp, báo cáo học sinh/phụ huynh, API mồ côi, EXP, bộ chọn câu, `thang-tu-go`, thống kê ngày và bộ tự hoàn thiện. Bản khác/`tc` phải được gộp theo cùng luật. Mốc cấm hỗ trợ phải đọc cả các bản trùng và item đã nối vào cụm Q, không chỉ marker của qid nguyên văn.

Với cờ mới, adapter bằng chứng chỉ đặt `songSinh=true` cho mục tiêu Q từ lượt có `banTuongDuongDaKiem` hợp lệ; quan hệ `tc` chỉ để phục vụ luyện không tự thỏa điều kiện bản khác. Các đường cũ ngoài phạm vi thử giữ semantics hiện có. Luật ngày của `phatLaiLoi` vẫn được gọi chung, không sao chép thành một phiên bản khác trong adapter.

### 9.4 Nạp lỗi đã có

Đợt đầu có thể nạp lỗi tự làm chưa đóng từ 29/09/2026; xây danh mục/projection từ event gốc và kết quả Tu luyện thực đã lưu. Không tạo kết quả giả tại thời gian hiện tại, không chép lại đúng/sai cũ làm quan sát mới và không đổi điểm ca.

Nạp lỗi cũ vào cohort lịch sử riêng; KPI lần hai của thí nghiệm chỉ đo các đợt được giao thử từ ngày kích hoạt. Giữ cả nhóm lỗi cũ để đánh giá độ phủ. Backfill chia lô có cursor, idempotent, báo số thiếu metadata; có dry run. Không gộp trạng thái hai ngày cũ của Tu luyện thành một sự kiện “đóng lỗi” mới.

## 10. Hợp đồng API

Đề xuất namespace `/hs/chua-cau-sai/*`, POST JSON như các endpoint HS hiện có. Hợp đồng dưới đây là hành vi bắt buộc; có thể gom endpoint nếu không mất khóa/idempotency. Định tuyến phải qua cùng cổng xác thực, reset/bảo trì và lỗi máy chủ hiện có.

### 10.1 Danh sách và tiếp tục

`POST /hs/chua-cau-sai/danh-sach`

Request: `{token, cursor?, limit?}`; mặc định 20, tối đa 50. Response: các đợt của chính em, trạng thái dễ hiểu, lịch kế, hành động được phép, `nextCursor`, thống kê có mẫu số. Không cần trả nội dung/đáp án mọi câu để vẽ danh sách.

`POST /hs/chua-cau-sai/mo`

Request: `{token, dotId?, nguonRef?}`. `nguonRef` có thể là `{loai:'tu_luyen', luotId, itemId}` hoặc ref kết quả game/ca. Máy chủ truy vết kết quả đã chấm của đúng em; qid/SBD/ketQua từ máy khách không đủ quyền. Nếu đợt đang có phiên thì trả đúng phiên để resume. Nếu gặp lại 1 đã xong thì trả lịch gặp lại 2, không tạo lại gặp lại 1.

### 10.2 Payload công khai của phiên

Ví dụ khuôn mới; các tên trạng thái kỹ thuật chỉ để client xử lý, không hiện cho học sinh:

```json
{
  "ok": true,
  "serverNow": "2026-10-07T03:00:00.000Z",
  "dotId": "opaque-dot-id",
  "phienId": "opaque-session-id",
  "revision": 4,
  "trangThai": "dang_chua_buoc",
  "lanGapLai": 1,
  "tienDo": {"soBuocDaQua": 1, "soBuocCanKiem": 3},
  "cauGoc": {"phan":"III", "text":"Đề đầy đủ", "table":null},
  "item": {
    "id":"opaque-item-id",
    "loai":"kiem_buoc",
    "buocSo":2,
    "tieuDe":"Đổi khối lượng thành số mol",
    "kieu":"so",
    "hoi":"Em tính số mol bằng bao nhiêu?",
    "luaChon":null,
    "donVi":"mol"
  },
  "hanhDong": {"coTheNop":true, "coTheXinGoiY":true},
  "phanHoiTruoc": null
}
```

Payload câu cả bài dùng serializer câu công khai hiện có, đủ ảnh/bảng và ý. Public payload không có `correct`, `dap_an`, `gia_tri_dung`, `solution`, ref riêng, seed, đáp án câu kế tiếp hoặc một biến thể chưa nộp. Phản hồi trước được phép có giải thích của item đã khóa; không nhét lời giải item kế vào cùng payload.

### 10.3 Nộp item

`POST /hs/chua-cau-sai/nop`

Request:

```json
{
  "token":"student-token",
  "phienId":"opaque-session-id",
  "itemId":"opaque-item-id",
  "attemptId":"client-uuid",
  "expectedRevision":4,
  "traLoi":"0,10",
  "giay":35
}
```

Server kiểm item đang được phát cho đúng em, revision, phiên bản, quyền kho và thời gian lịch. `giay` kẹp theo hợp đồng hiện có; lượt trống ngoài thi không ghi sai để học sinh làm tiếp. Câu cả bài dùng bộ chấm chung đúng phần; Phần II phải đủ bốn ý.

Response trả receipt, kết quả item đã nộp, phản hồi ngắn, bước có bằng chứng vướng, mức hỗ trợ thực, trạng thái phiên sau nộp và item/hành động tiếp theo. Không gửi đáp án item tiếp theo. Nếu ghi chưa hoàn thành trả `pending:true`, trạng thái tiếp tục bị khóa tới khi đối soát xong.

### 10.4 Xin gợi ý và bước tiếp

`POST /hs/chua-cau-sai/goi-y`: `{token, phienId, itemId, attemptId, expectedRevision}`. Ghi exposure trước khi trả nội dung. Khi item đang là kiểm chứng, chuyển nó thành có hỗ trợ; KPI độc lập không thể đạt từ item đó nữa.

`POST /hs/chua-cau-sai/tiep`: `{token, phienId, expectedRevision}`. Chỉ cho chuyển sau receipt hợp lệ hoặc khi quy tắc dạy cho phép; không nhận chỉ số bước muốn nhảy qua từ client. Trả item cũ nếu lặp do mạng; không cấp hàng loạt câu và lời giải.

### 10.5 Bắt đầu gặp lại 2

`POST /hs/chua-cau-sai/kiem-lai`: `{token, dotId}`. Server xác định lịch đủ, chưa có first attempt của gặp lại 2, bản kiểm chứng chưa lộ, phiên bản/khối/quyền còn hợp lệ. Có phiên đang dở thì tiếp tục đúng item; không cấp một bài kiểm mới trên mỗi lần mở.

Nếu chưa tới giờ, trả lịch thật và hành động luyện có hỗ trợ. Nếu thiếu bản tương đương, trả thiếu học liệu và đưa vào hàng soạn; lỗi vẫn có trong mẫu số. Không nới nguyên văn để làm KPI đạt.

### 10.6 Chuyển thầy và báo cáo

`POST /hs/chua-cau-sai/gui-thay`: `{token, phienId, expectedRevision, noiDung?}`. Server xác nhận trạng thái bế tắc từ receipt, trần thẻ và ca đang mở, gắn bằng chứng vào `nut_that` hoặc cấu trúc thầy hiện có. Tạo một thẻ hoạt động cho cùng em/cụm/bước; bấm lặp không tạo nhiều thẻ.

Không đòi hai lần tự làm sai cả câu khi chính vòng chữa đã có hai vòng hỗ trợ thất bại ở cùng bước. Đường gửi thầy cũ giữ cổng cũ; đường mới cần bằng chứng phiên, không phải bypass chỉ vì client nói `can_thay`.

`POST /gv/chua-cau-sai/bao-cao`: quyền giáo viên hiện có; bộ lọc lớp, cohort, khoảng ngày, dạng; phân trang. Trả độ phủ, kết quả lần hai, tỷ lệ đóng lỗi, sai lại, nhóm em cần thầy và lỗi thiếu học liệu. Endpoint đọc này không tự tạo bài hay gửi thông báo.

### 10.7 Lỗi và trạng thái trống

| Mã hợp đồng | Xử lý giao diện |
| --- | --- |
| `CAN_DANG_NHAP` | Đăng nhập lại; không bỏ nháp |
| `DANG_KIEM_TRA` | Báo chữa tạm khóa trong ca mở |
| `CHUA_CONG_BO` / `CAU_BI_BAO_VE` | Không trả nội dung cần bảo vệ |
| `CHUA_DEN_HAN` | Hiện lịch và tiếp tục luyện nếu được phép |
| `THIEU_HOC_LIEU` | Nêu thiếu câu luyện/bản kiểm, giữ câu trong danh mục, nút xem hỗ trợ/thầy |
| `CAU_THAY_DOI` | Thu hồi item; không tính sai; lấy item hợp lệ theo trạng thái |
| `XUNG_DOT_PHIEN` | Tải lại trạng thái phiên; giữ đáp án đã chốt |
| `CHO_GHI_SO` | Báo đang lưu; poll có giới hạn; không nộp item mới |
| Lỗi mạng | Giữ nháp và attempt ID, retry cùng thao tác |

Không tiết lộ tồn tại câu hoặc tên học sinh khác qua thông báo truy cập sai. Dùng HTTP status tương thích cổng hiện có; phân biệt rõ lỗi nội dung, conflict và tạm thời để client không retry vô hạn.

## 11. Giao diện và điểm nối các kênh

### 11.1 Thành phần dùng chung

Đề xuất `src/components/chua-cau-sai/` gồm màn chữa, bước kiểm, tiến độ và kết quả; client API ở `src/lib/chua-cau-sai-api.ts`, kiểu hợp đồng công khai ở tệp dùng chung. Không import đáp án/rubric/học liệu riêng máy chủ vào bundle app.

Tái sử dụng `TheCau`, `OSoTraLoi`, `ChemText`, `QuestionMedia`, khối lời giải chuẩn và token màu hiện có. Không tạo renderer thứ hai thiếu bảng/ảnh hoặc sai định dạng Đ–S. Một nút chính mỗi trạng thái; chạm tối thiểu 48px; nhãn ô rõ; Escape đóng tấm phủ; focus trả về nơi mở; Tab được giữ trong dialog. Luôn có nút thoát, tiến độ lưu máy chủ.

Hiện “Bước 2/3 · Đổi khối lượng thành số mol”, “Em đã qua bước này”, “Đã làm được với hướng dẫn”, “Đã tự sửa · chờ kiểm chứng tiếp”, “Cần thầy giúp bước này”. Chỉ nêu số lượt kiểm còn lại khi trạng thái thực tế xác định được. Không hiện mã `nen:*`, `qid`, xác suất kỹ năng hoặc lời hứa “em chắc chắn sẽ đạt 90%”.

### 11.2 Tu luyện là điểm thử đầu tiên

Nối vào cả màn chấm từng câu và màn kết quả. Chỉ hiện nút chữa khi đã có kết quả sai khóa trên máy chủ; khi em vừa chưa trả lời thì không gọi nhầm là sai. Ref nguồn phải chứa lượt và item thực tế, không chỉ qid.

`TheCauXem` trong `ManTuLuyen.tsx` hiện truyền qid gốc vào Hỏi thầy. Với câu hiển thị là S thay Q, chữa nội dung phải tìm học liệu của S; đợt lỗi mục tiêu có thể là Q. Cần phân biệt `qidHienThi`, `qidMucTieu`, `sourceItemId` trên máy chủ. Không áp nguyên câu kiểm của Q lên dữ kiện S. Nếu chưa có ánh xạ học liệu đúng S, dùng bài nền phù hợp và báo thiếu bản đồ cụ thể.

Danh sách “Sửa câu sai” không còn loại câu đã đúng hai ngày nhưng chưa đạt đóng lỗi chung. Hiện rõ chờ kiểm và ngày gặp lại. Các câu thiếu học liệu/cần thầy có khu vực riêng với số lượng; không làm nghèo mẫu số bằng cách ẩn chúng.

### 11.3 Đảo và Đoàn

Chẩn đoán là subflow của một lượt chữa, không tự tính câu gốc đã xong trong ngày. Sau probe, quay lại ghép cả bài trong cùng phiên chữa. Một cụm chữa chiếm một nhiệm vụ trong ngân sách; các bài nhỏ ghi riêng để đo thời gian nhưng không tăng quota câu cả bài hoặc thưởng game.

Giữ độ dài/chế độ trận và trạng thái mạng hiện có. Không kéo trận đồng đội chờ 10 phút vì một em đang chữa: cho kết thúc phần trận theo luật cũ, lưu việc chữa để em thực hiện ngoài trận hoặc ở Trạm. Khi em chọn chữa ở Trạm, tiếp tục đúng phiên. Câu cuối/Trùm không bị thay bằng một probe dễ rồi tính hoàn thành Trùm.

Cần cập nhật `docDemHomNay` hoặc bộ tương đương để dòng chẩn đoán không tiêu hết lượt sửa cả câu. Không bỏ hết chẩn đoán khỏi thống kê thời gian học; tách “câu cả bài” và “câu nhỏ”.

### 11.4 Bi-a

Nút chữa đặt trong xem lại câu sai hoặc kết thúc ván; không giữ lượt đối thủ chờ bài chữa. Câu đang giữ trên bàn và qid gốc mục tiêu vẫn được chặn ở các kênh khác. Câu chữa không đổi điểm ván đã kết thúc. Kết quả học tập chung được ghi theo receipt mới.

### 11.5 Ca thi, BTVN, ôn lại, Lên bảng, đầu giờ

Sau khi ca công bố hoặc bài đã chấm, đưa lỗi hợp lệ vào cùng danh mục. Không đổi luồng thi thật. Thầy có thể chọn chữa trên lớp từ danh sách bước nhiều em mắc; đánh dấu thầy đã dạy không tự đóng lỗi. Sau chữa vẫn có lượt tự làm trì hoãn.

API ôn lại đang khóa lần đầu theo qid/ngày. Không dùng lại khóa đó cho nhiều probe của một phiên; probe có item key riêng. Câu cả bài giữ semantics đóng lỗi theo ngày, không tăng chứng cứ vì em làm nhiều lần trong một ngày.

### 11.6 Trải nghiệm khiến em muốn bắt đầu

Danh sách lỗi giới thiệu một việc cụ thể, ví dụ “Gỡ bước đổi gam thành mol”, kèm lý do ưu tiên khi có dữ liệu. Không biến màn thành một bức tường dấu đỏ hoặc “em yếu nhiều chỗ”. Học sinh được chọn lỗi khác, chữa tiếp phiên dở hoặc để sau; mặc định đề xuất lỗi có ích và đủ học liệu, nhưng vẫn hiện số lỗi thiếu học liệu/cần thầy.

Lời mời trước chẩn đoán chưa được khẳng định nguyên nhân. Dùng “Mình tìm chỗ vướng trong câu này nhé”; sau khi xác nhận mới dùng “Mình gỡ chỗ chọn M của chất nhé”. Không bắt em khai lại mọi thông tin app đã có hoặc đọc một hướng dẫn dài trước thao tác đầu.

Thử thiết kế để trong phút đầu em có một hành động liên quan trực tiếp cách mình đã làm và nhận được phản hồi hữu ích. Đây là mục tiêu đo ở pilot, không phải ép em trả lời trong 60 giây. Hiển thị thời lượng ước lượng chỉ khi đã có dữ liệu phiên tương tự hoặc ghi rõ ước lượng; không hứa “30 giây là hết sai”.

### 11.7 Nhịp chữa và cảm giác tiến bộ

Một màn có đề/dữ kiện cần thiết, một nhiệm vụ nhận thức và một nút chính. Đề lớn thu gọn/mở lại được, vẫn giữ hình/bảng liên quan. Khi nộp xong, phản hồi cụ thể và hành động tiếp ở cùng vùng nhìn; không điều hướng em qua nhiều popup.

Tiến độ hiển thị các bước **đã chứng minh**, bước đang gỡ và bước chưa kiểm. Nếu chẩn đoán mới làm đổi số bước cần gỡ, giải thích ngắn; không tăng thanh phần trăm vì em bấm tiếp. Dùng “Đã kiểm được 2 bước · đang gỡ tỉ lệ phản ứng” thay cho phần trăm hiểu kiến thức giả. Học sinh có thể xem bước đã qua, nhưng đáp án bước/câu chưa nộp không đi kèm.

Tương tác gắn với điều em cần hiểu: chọn đúng đại lượng và đơn vị; ghép các thành phần trong công thức; so hai quan hệ; dự đoán kết quả khi một điều kiện thay đổi; tự điền điểm quyết định. Mỗi tương tác phải tạo bằng chứng hoặc giúp hiểu, có phương án thao tác đơn giản tương đương. Không thêm thao tác kéo vật, trò chơi hoặc animation khiến câu chữa dài hơn mà không giúp nhận ra lỗi.

Phản hồi thành công mô tả đúng việc em vừa làm: “Em đã tính M(KOH) từ cả K, O và H.” Phản hồi sai ghi rõ phần giữ được và việc cần thử; không luôn phát cùng câu “Cố lên!”. Không nói “rất dễ”, “em lại sai nữa”, gán nhãn năng lực, chê hoặc so sánh công khai với bạn.

Hiệu ứng xác nhận ngắn, dùng token hiện có, có chế độ giảm chuyển động và không phụ thuộc âm thanh/màu. Không đổi EXP, tiền/vật phẩm game hoặc luật thưởng. Điểm hấp dẫn chính là em tự phát hiện, vượt được một chỗ vướng và thấy chứng cứ; không tạo streak phạt nghỉ hay phần thưởng ngẫu nhiên buộc chữa tiếp.

### 11.8 Kết thúc có ý nghĩa và muốn quay lại

Màn kết thúc là thẻ “Em vừa gỡ được gì”, có tối đa ba ý từ receipt thật: cách cũ, điều em đã tự làm ở bài mới, điều kiện cần nhớ. Không bịa lời tự giải thích của em. Ví dụ “Trước em dùng 23 cho NaOH. Sau đó em tự tính đúng M của KOH từ cả công thức.” Nhãn vẫn là kết quả trong phiên có hướng dẫn.

Cho em chọn hoặc viết một câu nhắc của mình nếu muốn; có mẫu đúng đã duyệt nhưng không bắt chép. Lưu trong app, không tự gửi cho phụ huynh/bạn. Thẻ này xem lại được khi luyện, nhưng khi mở trong cửa sổ kiểm độc lập thì phải ghi hỗ trợ và tính lại điều kiện phục vụ; không để thẻ thành đường lộ công thức mà vẫn tính tự làm.

Một nút chính “Xong lượt chữa”; lịch kiểm tiếp theo nói rõ ngày/giờ và lý do “để xem em tự làm được sau khi đã nghỉ”. Một lựa chọn phụ tự nguyện chữa lỗi khác, không tự mở vòng dài vô hạn. Thoát ở giữa lưu tiến độ; quay lại đi đúng điểm còn dở, không bắt xem lại toàn bộ hay mất thành quả đã kiểm.

Sau gặp lại 2 thành công, nhấn mạnh bằng chứng “Em đã tự giải một bản mới”; nhãn còn lượt kiểm chứng phải rõ. Khi lần hai sai, dùng kết quả thật để chọn bước cần gỡ lại, giữ các kỹ năng đã có bằng chứng; không hiện “đã hiểu hết” hoặc trao nhãn đã đóng.

### 11.9 Khi em vẫn không hiểu

Sau phản hồi có lựa chọn phụ “Em vẫn chưa rõ chỗ này”. Bấm lưu tín hiệu, thử biểu diễn khác/kiểm tiên quyết trong ngân sách; không tự ghi sai và không tự cộng một lượt độc lập. Câu hỏi tự khai “giờ em thấy rõ vì sao sai chưa?” là tùy chọn sau lượt, không thay bài kiểm và không chặn thoát.

Khi chuyển thầy, gửi bài làm thật, giả thuyết đã kiểm/loại, bước đã qua, cách giải thích đã thử và điểm còn vướng. Học sinh thấy cụ thể thầy sẽ giúp gì; không phải làm lại một bảng kê nỗ lực hoặc nhập mười từ nếu phiên đã có đầy đủ bằng chứng bế tắc theo cổng được phê duyệt.

Không mất tiến độ vì nghỉ, không ép đếm ngược chữa và không thông báo dồn dập. Nếu app chưa có nhắc lịch được người dùng bật, chỉ dùng lịch/nhiệm vụ trong app; yêu cầu này không tự cho phép gửi tin nhắn ra kênh khác.

## 12. Đo mục tiêu 90 phần trăm

### 12.1 Đơn vị và mẫu số

Đơn vị chính là đợt lỗi của một học sinh với một câu chuẩn. Đợt lỗi được giao thử lưu `cohortId`, thời gian giao và mốc chốt đo ngay khi vào thử nghiệm. Mẫu số không thay đổi vì em sai thêm, đổi khối, bỏ dở hoặc thiếu học liệu.

Mặc định cửa sổ kết quả là **bảy ngày từ thời điểm giao xử lý đợt lỗi**. Sau bảy ngày, đợt chưa hoàn thành vẫn thuộc mẫu số và chưa đạt. Đợt chưa đủ bảy ngày được hiển thị đang theo dõi, tách khỏi cohort đã trưởng thành; không dùng trạng thái chưa trưởng thành để che các đợt trễ. Đợt lịch sử giữ cohort riêng.

Câu lỗi đề/đáp án được xác minh có thể loại khỏi mẫu hợp lệ, nhưng phải lưu lý do, người/cơ chế xác minh, thời gian và thống kê riêng. “Câu khó”, “chưa có bản khác”, “không quay lại” không phải lý do loại.

### 12.2 Chỉ số bắt buộc

| Chỉ số | Tử số / mẫu số | Công dụng |
| --- | --- | --- |
| Tự sửa ở gặp lại 2 | Đợt đúng ở lần nộp đầu của gặp lại 2, độc lập và bản tương đương đã kiểm / toàn bộ đợt hợp lệ đã giao trong cohort trưởng thành | KPI chính, mục tiêu ≥90% |
| Tham gia chữa | Đợt đã bắt đầu gặp lại 1 / toàn bộ đợt đã giao | Tách bỏ dở khỏi hiệu quả nội dung |
| Hoàn thành có hướng dẫn | Đợt ghép bài đạt sau hỗ trợ / toàn bộ đợt đã giao | Đo quá trình, không gọi là tự sửa |
| Thành công trong nhóm đã kiểm | Đợt đạt lần hai / đợt có bài kiểm lần hai hợp lệ | Chỉ số phụ; không dùng thay KPI chính |
| Đóng lỗi trong 14 ngày | Đợt đạt `phatLaiLoi='dong'` hoặc duy trì / đợt đã đủ 14 ngày | Độ bền theo luật chung |
| Giữ được sau kiểm trì hoãn | Đợt đúng độc lập ở bài kiểm được giao / toàn bộ đợt đã giao bài kiểm đến hạn trong cohort trưởng thành | Không loại các em không quay lại |
| Sai lại sau đóng | Đợt mở lại / đợt đã đóng có đủ cửa sổ theo dõi | Kiểm chất lượng đóng lỗi |
| Độ phủ học liệu | Đợt có bản đồ bước, bài mới, bản kiểm chứng hợp lệ / toàn bộ đợt hợp lệ | Phân biệt giới hạn học liệu |

Hiện số tuyệt đối cùng tỷ lệ, ví dụ “18/25 câu tự sửa ở lần hai · 72%”. Mẫu số 0 hiện “Chưa có dữ liệu”, không hiện 100%. Phần II phải đúng cả bốn ý để tính câu đạt; đúng 3/4 ý chỉ tính tiến bộ từng ý.

Đếm hỗ trợ từ log máy chủ, bao gồm Hỏi thầy, đọc lời giải, gợi ý và lời thầy gỡ của cụm liên quan. Một lượt đúng nhưng đã được giúp trong cửa sổ cấm chỉ tính hỗ trợ. Đáp án đúng nguyên văn/đảo A–D không tính KPI bản tương đương.

### 12.3 Thiết kế thử nghiệm

Thử ở một nhóm học sinh/lớp xác định, phân nhóm theo học sinh để tránh em dùng cả hai cách chữa cho cùng đợt. Ghi cờ phân nhóm trên máy chủ, phân tầng theo khối và mức trước thử, so sánh với vòng hiện có. Nếu chỉ đủ điều kiện pilot một nhóm, gọi là pilot và báo trước/sau có giới hạn, không tuyên bố quan hệ nhân quả.

Mức đọc ban đầu đề xuất: ít nhất 30 học sinh và 300 đợt đã trưởng thành; đây là ngưỡng vận hành để có dữ liệu, không phải bảo đảm đủ lực thống kê. Báo theo từng học sinh, lớp, dạng, mức khó, nguồn và độ phủ học liệu. Khi ước lượng khoảng tin cậy, xét cụm theo học sinh vì nhiều đợt của cùng em không độc lập.

Tỷ lệ tổng đạt 90% không đồng nghĩa mỗi học sinh đạt 90%. Dashboard phải chỉ ra những em và dạng dưới mục tiêu. Kiểm thử tự động chỉ xác minh phép đo/luật; không thể chứng minh hiệu quả học 90% trên người thật.

Nếu không đạt mục tiêu, ưu tiên phân tích: không tham gia → thiếu học liệu → chẩn đoán không tìm đúng bước → bài nhỏ đạt nhưng không ghép được → đúng ngắn hạn nhưng sai lại. Dùng receipt và bước lỗi để cải tiến; không tự tăng hỗ trợ trong bài kiểm hoặc đổi mẫu số cho đạt chỉ tiêu.

### 12.4 Đo thấu hiểu và sức hút

Các chỉ số sau bổ sung cho KPI chính, không thay mẫu số mục 12.1. Đăng ký phiên bản định nghĩa và cửa sổ đo trước pilot.

| Chỉ số | Định nghĩa và giới hạn |
| --- | --- |
| Hiểu bước trong phiên | Bước cần chữa đạt cả kiểm lý do/quan hệ và chuyển giao mới / toàn bộ bước cần chữa đã xác định của các đợt cohort trưởng thành. Thiếu học liệu/bỏ dở chưa đạt; ghi riêng số đợt chưa xác định được bước để không che ca chưa chẩn đoán |
| Giữ cách nghĩ sau trì hoãn | Đợt đạt cả bài mới và rubric kiểm quan hệ quyết định ở gặp lại 2 / toàn bộ đợt hợp lệ đã giao trong cohort trưởng thành. Bài/quan hệ phải khóa trước phản hồi theo mục 5.5; thiếu kiểm quan hệ ghi chưa có bằng chứng |
| Tự nguyện bắt đầu | Đợt được em tự mở chữa / đợt có lời mời thực sự được hiển thị, đủ cửa sổ bảy ngày. Tách nhiệm vụ bắt buộc do thầy giao; UI event không làm thay đổi mẫu số KPI học tập |
| Tự nguyện tiếp tục | Học sinh chọn bắt đầu một lỗi khác sau khi có lựa chọn kết thúc / học sinh đã thấy màn kết thúc có lựa chọn đó, đủ cửa sổ bảy ngày. Đếm mỗi học sinh một lần mỗi cohort, tách lượt bắt buộc |
| Quay lại kiểm đúng hạn | Đợt bắt đầu gặp lại 2 trong cửa sổ đo / toàn bộ đợt được hẹn đến hạn trong nhóm đủ cửa sổ. Không chỉ đo trên các em đã quay lại |
| Em thấy được hiểu/rõ hơn | Phản hồi tùy chọn sau lượt về app có giúp đúng chỗ vướng và em còn chưa rõ gì. Hiện số người được hỏi, số phản hồi và phân bố; không gọi phản hồi tích cực là chứng minh hiểu |
| Tải chữa và bỏ dở | Số item, số lần trợ giúp, thời gian hoạt động có kẹp, bước cuối trước thoát và lý do tự khai nếu có. Không coi ở lại lâu, click nhiều hoặc chữa liên tục là thành công |

Trước pilot rộng, làm buổi quan sát với tối thiểu 8 học sinh ở ít nhất hai mức học lực, bao gồm em hay bỏ chữa và em cần hỗ trợ đọc. Mỗi em có một câu thật đã sai phù hợp quyền xem, thử trên điện thoại. Người quan sát để em nghĩ thành tiếng, không gợi đáp án thay app; mọi giúp đỡ ngoài app được ghi để không tính là độc lập. Nếu không có học sinh thật trong môi trường code, bàn giao kịch bản này và đánh dấu chưa nghiệm thu, không tạo log đóng vai thành dữ liệu pilot.

Ghi bốn điểm: em có tìm được chỗ vướng bằng lời/cách chọn của mình; có hiểu ý nghĩa chứ không chỉ nhắc công thức; có làm được bài mới; có biết việc cần làm tiếp và tự muốn làm hay chỉ đang làm theo yêu cầu. Kiểm định lỗi tương tác và sửa mọi đường khiến em lạc, bị ép hoặc bị kết luận sai. Mục tiêu vòng đầu: ít nhất 6/8 em hoàn tất lượt chữa không cần người quan sát hướng dẫn thao tác và chỉ ra đúng điểm lệch bằng rubric. Đây là cổng usability đề xuất, không ước lượng tỷ lệ toàn bộ học sinh hay chứng minh KPI 90%.

Sau đó dùng pilot mục 12.3 để xem sức hút và hiểu có tăng cùng kết quả độc lập không, với chuẩn chấm/thời gian giữ nguyên. Nếu muốn đánh giá tác động của phần trải nghiệm riêng, phân nhóm theo học sinh giữa hai phiên bản cùng học liệu/luật chấm. Chọn phiên bản bằng số đo và phản hồi thực; không cam kết “cực kỳ hấp dẫn” chỉ từ bản demo của người lớn.

## 13. Ví dụ nghiệm thu xuyên suốt

### 13.1 Đổi khối lượng thành mol và áp dụng tỉ lệ phản ứng

Đề luyện minh họa: thủy phân hoàn toàn ester X dạng RCOOR′, R′ là gốc alkyl, không có nhóm khác phản ứng với NaOH, bằng vừa đủ 4,0 gam NaOH. Hỏi số mol X. Học liệu đã kiểm xác định NaOH có M = 40 g/mol, số mol NaOH = 0,10 mol, tỉ lệ ester này : NaOH = 1 : 1, nên n(X) = 0,10 mol. Giữ rõ điều kiện ester của alcohol đơn chức và vừa đủ; không suy 1:1 cho mọi ester đơn chức.

**Lần sai ban đầu:** em chọn/nhập kết quả sai, lưu bằng chứng thật.

**Gặp lại 1:**

1. Hỏi “Khối lượng mol NaOH bằng bao nhiêu?” trước khi cho công thức tính. Em trả lời 23.
2. Dùng câu phân biệt để xác nhận em lấy nguyên tử khối Na cho cả NaOH, không tự kết luận chỉ từ một số.
3. Nhắc cách cộng theo công thức hóa học; cho ví dụ khác. Em tự tính M(KOH) với dữ kiện nguyên tử khối phù hợp; không đưa sẵn kết quả cần kiểm.
4. Hỏi bài mới đổi gam thành mol. Em đạt rồi mới quay về quan hệ n = m/M của bài ester.
5. Kiểm tỉ lệ phản ứng. Nếu em biết 1:1, qua bước này; nếu không biết, chữa điều kiện ester đơn chức và phản ứng thủy phân trước.
6. Cho ghép lại cả bài trên dữ kiện mới, ghi mức hỗ trợ thực. Hẹn bài kiểm độc lập.

**Gặp lại 2:** bản khác đã kiểm có 6,0 gam NaOH, giữ đầy đủ điều kiện về ester và vừa đủ nêu trên; đáp số 0,15 mol. Không cho nhắc M, công thức hoặc quan hệ trước nộp. Em làm đúng lần đầu đủ bằng chứng → ghi đã tự sửa; em dùng gợi ý → chỉ ghi hỗ trợ; em sai → khóa sai lần hai và quay lại bước có bằng chứng hỏng.

Đây là bộ fixture minh họa cho test, không phải dữ liệu thực nghiệm đạt 90%. Với ester của phenol, ester đa chức hoặc chất có nhóm phản ứng khác phải có bản đồ và tỉ lệ phù hợp; không áp 1:1 một cách máy móc.

### 13.2 Phần II chỉ sai một ý

Em đúng a/b/d, sai c. Chẩn đoán quy tắc làm sai c và kỹ năng dùng chung liên quan; không bắt luyện lại ba ý đã chứng minh. Bài kiểm lần hai có bốn ý mới tương đương. Đúng ba ý vẫn không đạt cả câu, nhưng dashboard lưu rằng em đã sửa được kỹ năng của c nếu có bằng chứng; không ép hai chỉ số thành một.

### 13.3 Câu không có học liệu

Lỗi vẫn trong danh sách và mẫu số. Máy chủ ghi thiếu bản đồ/thiếu probe/thiếu bản kiểm; ưu tiên hàng soạn câu này vì có học sinh thật đang vướng. Cho xem hỗ trợ đã có hoặc chuyển thầy. Không phục vụ nguyên văn rồi tính KPI bản tương đương đạt.

### 13.4 Tu luyện hiển thị câu S thay Q

Q là câu cần sửa, S là câu anh em trong phần riêng. Khi em nộp S, bộ chấm dùng đáp án S, sổ ghi S và `tc=Q`. Chữa từng bước dùng đề/học liệu S, hoặc ánh xạ bản đồ đã kiểm của Q sang S. Không dùng số liệu Q để kiểm câu S. Nếu chỉ cùng dạng mà chưa có chứng cứ tương đương, lần làm S giúp luyện nhưng chưa chứng minh sửa Q.

### 13.5 Mạng đứt sau khi chấm

Receipt đã ghi nhưng response mất. Em mở lại và gửi cùng attempt ID; nhận đúng kết quả cũ, tiếp tục bước đang dở. Sổ chỉ có một event. Nếu receipt đang chờ phát sổ, giao diện báo đang lưu và không cho em đi tiếp như đã đạt. Nếu câu kho đổi giữa phát và nộp, thu hồi item, không đánh sai và không lộ đáp án phiên bản khác.

### 13.6 Kịch bản đối thoại giúp em tự phát hiện

Tiếp tục fixture 13.1. Các giá trị/kết luận đúng trong bảng dành cho tác giả và test, không đồng nghĩa đều được gửi xuống trước nộp. Có số liệu nguyên tử khối ở đề khi cần; mỗi lần trả lời đều có receipt và mức hỗ trợ.

| Điểm tương tác | Lời thoại/nhiệm vụ | Nhánh và bằng chứng |
| --- | --- | --- |
| Vào lượt | “Mình tìm chỗ vướng trong câu này nhé.” Hiện câu và đáp án thật của em; hỏi M(NaOH) nếu chưa có dữ liệu trung gian | Không mở lời giải cả bài. Nếu M đúng, chuyển kiểm quan hệ/tính, không ép theo nhánh 23 |
| Em nhập 23 | “23 đang ứng với Na, NaOH hay đại lượng khác?” | Chỉ khi em xác nhận lấy M của Na cho NaOH mới gán lỗi đó; chọn khác thì kiểm giả thuyết phù hợp |
| Tự nhìn điểm lệch | Hiện Na/O/H và nguyên tử khối 23/16/1 sau chẩn đoán, hỏi “M của NaOH cần tính phần nào?” Em chọn/điền các phần | Phản hồi sau nộp: “23 mới tính phần Na. O và H cũng góp vào khối lượng của NaOH.” Biểu diễn có bản văn bản, không phụ thuộc kéo thả |
| Kiểm cách nghĩ trên chất mới | “Với KOH, em tìm M từ những thành phần nào và được bao nhiêu?” Đề cho K=39, O=16, H=1 | Em tự làm; rubric kiểm quan hệ và kết quả 56 g/mol. Trả lời 39 thì vẫn chưa qua; không dùng nút tự nhận hiểu |
| Kiểm giới hạn nếu vẫn chưa phân biệt | “Ở Mg(OH)₂, phần trong ngoặc xuất hiện mấy lần? Em tính M với Mg=24, O=16, H=1.” | Chỉ phát khi cần trong ngân sách, không bắt mọi em. Kết quả 58 g/mol; qua bài này không tự chứng minh em đã biết phản ứng ester |
| Nối ý nghĩa về bài lớn | “M cho biết khối lượng một mol chất. Đề cho gam; em dùng quan hệ nào để tìm mol?” Sau nộp mới phản hồi | Kiểm n=m/M, ý nghĩa đơn vị. Có thể ghép câu số mới 2,8 gam KOH để kiểm cả quan hệ và 0,05 mol; không hiện mẫu đã tính sẵn |
| Quan hệ phản ứng và ghép | Kiểm tỉ lệ dựa trên phản ứng và điều kiện ester; sau đó một bản luyện đủ bài với dữ kiện mới | Bước đã biết đi nhanh; bước chưa biết cần chữa. Chấm cả câu, giữ mức hỗ trợ; không chấm xong chỉ từ bài mol |
| Kết thúc | “Trước em dùng M của Na cho NaOH. Em vừa tự tính M của KOH từ cả công thức và dùng vào bài mới. Lượt tới em tự giải cả câu.” | Chỉ hiện các vế có receipt. Hẹn kiểm, nút kết thúc rõ, sửa lỗi khác là tự nguyện |

Không phát thêm mọi dòng trong bảng nếu đã đủ bằng chứng. Các câu phân biệt trước giải thích thuộc giới hạn chẩn đoán; câu chuyển giao thuộc ngân sách hỗ trợ, tất cả tính vào thời lượng lượt. Nếu câu kiểm mới sai, phản hồi đúng phần sai, thử cách giúp khác một lần trong ngân sách rồi lưu/chuyển thầy. Không tự thêm bài để ép em luôn kết thúc bằng đáp án đúng.

### 13.7 Cùng đáp án sai nhưng cách giúp phải khác

Em xác định M(NaOH)=40, chọn đúng n=m/M và viết 4/40 nhưng nhập 0,01. Sau chuẩn hóa và câu kiểm xác minh, app có bằng chứng lỗi tính, chưa có bằng chứng thiếu khái niệm mol.

Phản hồi: “Em đã chọn đúng quan hệ và đúng M. Mình kiểm phép chia này: nếu n=0,01 mol, nhân lại với 40 g/mol được bao nhiêu gam?” Em tự tính 0,4 gam và đối chiếu với 4,0 gam đã cho. Sau đó tính lại và dùng cách nhân ngược trên một dữ kiện mới. Không hiện trước kết quả phép nhân mà vẫn coi em tự phát hiện.

Nếu em qua, giữ các bước M/quan hệ đã chứng minh và kiểm phần phản ứng/ghép bài còn cần. Nếu em không biết vì sao được nhân ngược, kiểm tiên quyết đơn vị/quan hệ, không kết luận “chỉ bất cẩn”. Thẻ kết thúc nhắc phương pháp tự soát đã thực sự được em dùng. Ca này phải có nhánh riêng trong fixture và giao diện; dùng một bài giảng NaOH cho cả hai học sinh là không đạt yêu cầu cá nhân hóa.

## 14. Kiểm thử và tiêu chí nghiệm thu

### 14.1 Bộ kiểm thử mới tối thiểu

| Nhóm | Ca bắt buộc |
| --- | --- |
| Chẩn đoán | Tự khai sai nhưng probe chỉ ra bước khác; downstream sai do số upstream; không đủ bằng chứng → chưa xác định; lời giải đã lộ → chẩn đoán hỗ trợ |
| Chữa bước | Sai → giúp → câu mới; không dùng lại câu đã lộ; đúng một Đ–S chưa tự qua bước; qua bước vẫn giữ khi resume; hết hai vòng → thầy/lịch nghỉ |
| Hiểu bước | Có kết quả đúng nhưng chưa có bằng chứng lý do; lý do đúng nhưng chuyển giao sai; lý do lặp lại lời đã xem; rubric kiểm quan hệ và kết quả; không cộng hiểu trong phiên vào ngày đúng độc lập |
| Cá nhân hóa | Nhầm M và sai phép chia có hai nhánh; không bịa cách nghĩ khi mới có giả thuyết; cách giải khác hợp lệ; sai sau cùng gợi ý chọn biểu diễn khác; không ép luyện bước đã có bằng chứng |
| Ghép bài | Đúng probe không hoàn thành bài gốc; sau chẩn đoán có phần ghép bài cùng lượt; sai bước cuối không reset mọi bước |
| Gặp lại 2 | Mở sớm bị chặn; đủ 24h nhưng vừa đọc lời giải vẫn bị chặn độc lập; đủ lịch phát đúng bản chưa lộ; gợi ý đổi assistance; lần đầu sai không biến thành đúng sau retry |
| Luật đóng lỗi | Hai ngày và khoảng cách ba ngày mặc định; đúng hỗ trợ không tính; đúng lần hai chỉ có một ngày → chờ kiểm; duy trì 14/30; sai lại mở đợt mới |
| Bản tương đương | Chỉ cùng dạng chưa đủ; xáo/nguyên văn không đạt KPI; đúng Phần II 3/4 không đạt câu; đủ hình/bảng; đúng khối; giữ phiên bản bộ sinh |
| Tu luyện | S/Q/`tc` đúng; xáo quy chon về gốc; chấm từng câu + nộp lượt không đếm đôi; lặp cùng ngày không thêm mốc; các chế độ 2–4 sai vào danh mục chung khi bật cờ |
| Quyền truy cập | Token giả, sửa SBD/dot/item của người khác, câu chưa công bố, ca đang mở ở giữa phiên, khối đổi, câu nghi đáp án, tự luận, mất quyền trong lúc resume |
| Rò đáp án | Public payload ban đầu và item kế sạch; không seed/rubric/giải; bước gợi ý chưa nộp không nhét đáp số; ảnh lời giải bị loại trước nộp |
| Giao dịch | Hai tab cùng nộp; attempt ID lặp khác payload; CAS thua; lỗi DB trước/sau receipt/outbox; retry không thêm sự kiện/thẻ/thưởng; pending không được tính đạt |
| KPI | Bỏ dở, thiếu học liệu, chờ thầy vẫn trong mẫu; cohort chưa trưởng thành tách; sai thêm không đẩy hạn đo; đợt mở lại đếm riêng; mẫu số 0; gộp bản trùng; không gộp cùng dạng |
| Tương thích | Cờ tắt giữ JSON/hành vi cũ; hồ sơ học liệu cũ không crash; source mới không làm EXP tăng; thống kê ngày phân biệt bài nhỏ và cả câu |
| Giao diện | Đang tải/trống/lỗi/offline/có dữ liệu; giữ nháp; focus/Escape; khóa nút khi nộp; không mở dialog giữa lượt game; 390px/1440px sáng/tối không tràn |
| Trải nghiệm | Phản hồi/thẻ tiến bộ chỉ dùng receipt thật; thoát rồi tiếp tục không reset; tắt hiệu ứng/âm thanh vẫn hiểu; “chưa rõ” không tự ghi sai; lựa chọn tiếp tự nguyện; mở thẻ nhắc được ghi hỗ trợ |
| Phép đo sức hút | UI event trùng; chỉ đề nghị đã hiển thị mới vào mẫu phụ; nhiệm vụ bắt buộc tách; khảo sát không trả lời có mẫu riêng; không đổi mẫu số chính; không tính thời gian tab ẩn thành thời gian học |

Test phải kiểm hành vi và dữ liệu thật sau request, không chỉ mock rằng một hàm đã được gọi. Dùng harness SQLite thật của `tests/_d1-that.ts` cho hợp đồng Worker và đối chiếu hàng D1; có test runtime D1 riêng cho batch/CAS nếu SQL mới dựa vào đặc tính giao dịch. Test mô phỏng chỉ kiểm FSM và công thức đo, không gọi tỷ lệ đạt giả là hiệu quả học tập.

### 14.2 Các test hiện có cần chạy và cập nhật có chủ ý

Các tệp đã có:

- `tests/loi-hoc-luat-0210.test.ts`
- `tests/hang-chua-loi-0210.test.ts`
- `tests/thang-tu-go-0210.test.ts`
- `tests/thang-tu-go-khung-0210.test.tsx`
- `tests/chan-doan-buoc-sai-0610.test.ts`
- `tests/chan-doan-buoc-sai-0610-tram.test.ts`
- `tests/chan-doan-buoc-sai-0610-song-sinh.test.ts`
- `tests/chan-doan-buoc-sai-0610-bt-phien-ban.test.ts`
- `tests/lam-lai-cau-sai-0610-tu-luyen.test.ts`
- `tests/lam-lai-cau-sai-0610-bi-a.test.ts`
- `tests/lam-lai-cau-sai-0610-tram.test.ts`
- `tests/tu-luyen-sua-cau-sai-3009.test.ts`
- `tests/tu-luyen-kho-sai-chung-3009.test.ts`
- `tests/srs2-d1-2709.test.ts`
- `tests/ho-so-nam-kt-1909.test.ts`

Thêm test các reader EXP, game, báo cáo và lịch bị tác động. Các test cũ khẳng định “Tu luyện không ghi sổ” phải giữ cho cờ tắt và bổ sung ca cờ bật; không xóa toàn bộ test vì hành vi thí nghiệm mới. Các snapshot chữ đổi phải có giải thích gắn thay đổi sản phẩm, không cập nhật hàng loạt cho xanh.

### 14.3 Lệnh kiểm tra

```bash
# Chạy từng nhóm liên quan khi phát triển; Claude điền các tệp mới thật vào lệnh.
npx vitest run tests/loi-hoc-luat-0210.test.ts tests/hang-chua-loi-0210.test.ts tests/tu-luyen-sua-cau-sai-3009.test.ts --reporter=dot
npx tsc -p server/tsconfig.json --noEmit
npm run build
npm run check:mau
npm run kiem:mau-giu
```

Trước khi gộp/phát hành thay đổi sổ chung và reader dùng chung, chạy toàn bộ Vitest theo cấu hình thường; kiểm runtime D1 bằng cấu hình riêng khi liên quan. Lưu log dài ra tệp, phân biệt lỗi nền đã có và lỗi mới bằng tên test, không chỉ so tổng số đỏ. Không tuyên bố đã kiểm giao diện chỉ từ build; cần ảnh Chromium tại kích thước và theme yêu cầu.

### 14.4 Nghiệm thu kỹ thuật

1. Học sinh có thể đi đầy đủ sai → chẩn đoán → chữa bước → ghép bài → hẹn → kiểm lần hai trong app, không chỉ có endpoint hoặc bản vẽ.
2. Đổi máy/refresh tiếp tục đúng bước, đúng bản câu và đúng số lượt.
3. Các nguồn kết quả được nối đúng, mọi màn đọc nhãn đóng lỗi cùng một luật khi cờ mới bật.
4. Có báo cáo mẫu số, receipt và phân biệt hỗ trợ/độc lập, không tạo tỷ lệ giả.
5. Không thay điểm ca, không rò đáp án, không rút sai khối/đề đang bảo vệ, không tăng EXP từ Tu luyện.
6. Thiếu học liệu/cần thầy/lỗi mạng có luồng hoàn chỉnh và không làm biến mất lỗi.
7. Có migration chỉ thêm, cờ tắt quay được về luồng cũ, job đối soát và hướng dẫn vận hành.
8. Test liên quan, typecheck và build đạt; lỗi nền và hạn chế học liệu được báo rõ.

Nghiệm thu kỹ thuật không đồng nghĩa đã đạt 90% trên học sinh thật. Nghiệm thu mục tiêu học tập dùng báo cáo cohort trưởng thành ở mục 12.

### 14.5 Nghiệm thu hiểu và hấp dẫn

Claude phải bàn giao luồng UI hoạt động và bộ fixture cho cả hai học sinh ở mục 13.6–13.7. Người nghiệm thu chạy được các tiêu chí sau:

1. Màn đầu dùng đúng bài/đáp án thật của em, cho hành động có ích ngay và không kết luận nguyên nhân trước bằng chứng.
2. Chỉ đúng điểm lệch; em thấy rõ phần mình đã làm đúng được giữ lại.
3. Có giải thích ý nghĩa và vì sao, điều kiện áp dụng; không chỉ hiện công thức/đáp số.
4. Có thao tác em tự dự đoán, phân biệt hoặc kiểm lại; đáp án thao tác chưa nộp được bảo vệ.
5. Có câu mới kiểm quan hệ/lý do và chuyển giao; “Em hiểu rồi” không tự qua bước.
6. Hai nguyên nhân khác nhau ở mục 13 tạo hai nhánh giúp khác nhau, tránh dạy lại phần em đã chứng minh.
7. Thấy tiến bộ thật từ receipt, ghép lại cả bài, rồi biết khi nào và vì sao cần kiểm trì hoãn.
8. “Em vẫn chưa rõ”, tạm dừng, resume và chuyển thầy có đường hoàn chỉnh; không ép làm thêm để tạo kết quả đẹp.
9. Trên điện thoại, dùng bàn phím/trình đọc màn hình/giảm chuyển động vẫn làm được nhiệm vụ; không cần âm thanh hoặc thao tác kéo chính xác.
10. Có kịch bản và báo cáo quan sát học sinh thật theo mục 12.4, hoặc ghi rõ chưa quan sát. Test UI/fixture chỉ nghiệm thu triển khai, không thay xác nhận học sinh thấy thấu hiểu và thích chữa.

Sản phẩm chưa đạt nếu chỉ thêm mascot, confetti, huy hiệu, lời động viên hoặc thanh tiến độ vào vòng đọc lời giải/chọn lại cũ. Muốn nghiệm thu trải nghiệm phải có đủ cơ chế trên và chứng cứ sử dụng; không tự tuyên bố “tối ưu hoàn hảo”.

## 15. Kế hoạch triển khai và công tắc

### 15.1 Cấu hình đề xuất

Khóa `cau_hinh`: `chua_cau_sai_v1`.

```json
{
  "bat": false,
  "lop": [],
  "sbd": [],
  "dongBoTuLuyen": true,
  "kiemLaiSauGio": 24,
  "chanDoanToiDa": 4,
  "vongHoTroToiDaMoiBuoc": 2,
  "phutToiDaMotLuot": 10,
  "cuaSoDoNgay": 7,
  "cohortId": "pilot-chua-cau-sai-v1"
}
```

Vắng cấu hình: tắt tính năng mới. Khi bật phải có phạm vi pilot không rỗng; tránh vô tình coi mảng rỗng là toàn trường. Server kiểm phạm vi mọi request, client chỉ dùng capabilities trả về. Tham số số có kẹp và version; tham số đóng lỗi/hỗ trợ không ghi đè cấu hình `v2_tham_so` của từng em.

Lưu policy snapshot trên đợt/phiên để cấu hình thay đổi không viết lại KPI hoặc chuẩn nộp của item cũ. Tắt cờ ngừng tạo phiên mới; phiên đã phát có quyền được đọc receipt/nháp và phải có cách hoàn tất an toàn hoặc hẹn tiếp, không trở thành item không chấm được. Không xóa sự kiện sổ đã ghi.

### 15.2 Thứ tự công việc

**Giai đoạn A — Sổ và phép đo:** thêm cờ, migration, quy về câu chuẩn, ghi Tu luyện idempotent, reader nguồn, adapter trạng thái lỗi, cohort và thống kê mẫu số. Cờ tắt giữ tương thích. Khóa test không thưởng EXP.

**Giai đoạn B — Học liệu và bộ điều phối:** chuẩn học liệu, validator, snapshot item, FSM, chẩn đoán từng bước, vòng hiểu bước, kiểm lý do/chuyển giao, giảm trợ giúp, ghép bài, timer và ranh giới chuyển thầy. Tạo fixture Hoá có đáp án kiểm chứng và ít nhất hai nhánh nguyên nhân mục 13.6–13.7, không cần LLM runtime để chạy test.

**Giai đoạn C — Giao diện thử Tu luyện:** nối cả chấm từng câu và kết quả, phiên lưu máy chủ, trải nghiệm mục 11.6–11.9, thẻ tiến bộ thật, gặp lại 2, trạng thái trống/thiếu học liệu/cần thầy/offline. Đây là lát cắt đầu tiên có thể nghiệm thu từ đầu đến cuối; phải đạt tiêu chí cơ chế ở mục 14.5.

**Giai đoạn D — Các kênh còn lại:** Đảo/Đoàn, Trạm, Bi-a, ca đã công bố/BTVN/ôn lại/Lên bảng/đầu giờ; đảm bảo bài nhỏ không chiếm hoàn thành cả câu hoặc giữ trận đồng đội chờ.

**Giai đoạn E — Đối soát và pilot:** so sánh sổ/projection, độ phủ học liệu, dashboard theo em/dạng, quan sát học sinh và sửa trải nghiệm theo mục 12.4, kích hoạt nhóm thử, theo dõi cohort trưởng thành. Báo riêng bằng chứng hiểu, sức hút và kết quả độc lập rồi mới mở rộng.

Không kết thúc ở giai đoạn A/B và gọi đó là đã có vòng chữa. Bàn giao từng giai đoạn có commit, test và luồng xem được; mục tiêu cuối là toàn bộ A–E.

### 15.3 Triển khai dữ liệu

- Schema chỉ thêm, có SQL migration và `CREATE IF NOT EXISTS` nhất quán với phong cách dự án nếu cần.
- Thử migration trên bản dữ liệu test/sao lưu phù hợp trước; có dry run nạp projection lỗi cũ, cursor và báo đối soát.
- Đọc hướng dẫn repo hiện tại trước phát hành. Không triển khai trong lúc có ca thi mở; không dùng quyền lịch sử trong tài liệu để bỏ kiểm tra thực tế.
- Chỉ phát hành bản mã sạch đã kiểm theo quy trình dự án; không chạy reset hoặc sửa điểm để làm sạch dữ liệu thử.
- Bản lùi dùng tắt cờ và phiên bản mã đã lưu; giữ mọi receipt và event đã phát sinh. Xử lý tiến trình đang dở trước khi bỏ endpoint.

## 16. Hiệu năng và vận hành

Không dựng toàn bộ hồ sơ/lịch sử mọi kênh sau mỗi probe. Phiên chứa snapshot và tiến độ đủ để xử lý bước kế; tra quyền/ca/bảo vệ cần thiết, dùng đệm hiện có đúng phạm vi. Bộ reader cohort phân trang/lô, không quét mọi học sinh trên mỗi render.

Đặt ngân sách đo trước/sau trên harness và staging: số round trip D1, số hàng đọc/ghi, độ dài payload, p50/p95 mỗi action, lỗi retry/CAS/outbox. Mục tiêu mặc định probe submit không cần thêm hơn một đợt đọc và một batch ghi sau các kiểm quyền bắt buộc; nếu không đạt, ghi số đo và tối ưu theo bằng chứng. Không hi sinh snapshot, quyền hoặc receipt để đạt số truy vấn.

Ghi log kỹ thuật bằng opaque IDs, action, version và reason code; không dump token, đáp án riêng trước nộp hoặc toàn bộ dữ liệu em vào log công khai. Báo cáo thầy truy cập có quyền mới xem bài làm và bằng chứng cần dạy.

Job đối soát tối thiểu: receipt chưa vào sổ; event trùng; phiên có revision không khớp item; lỗi còn mở nhưng mất lịch/không có hành động; đã tự sửa nhưng chưa có bằng chứng độc lập; item bị thu hồi; đợt thiếu học liệu; chờ thầy quá lâu. Job sửa projection từ sự thật, không tự đặt đúng hoặc đóng lỗi để giải quyết số lệch.

Học liệu thiếu của đợt lỗi thật được ưu tiên hàng soạn; lưu loại thiếu và số em ảnh hưởng. Khi bổ sung học liệu, tiếp tục đợt cũ, không xóa cohort và tạo đợt mới để bắt đầu đo lại.

## 17. Bàn giao cho Claude

### 17.1 Tệp cần đọc trước

Đọc `CLAUDE.md`, phần điều phối đang có hiệu lực của `DIEU-PHOI.md` và `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`. Những ghi chú người dùng mới về mục tiêu vòng chữa trong đặc tả này là yêu cầu thay đổi có chủ ý; ví dụ Tu luyện đồng bộ tiến độ khi cờ mới bật thay cho quy tắc độc lập cũ. Không hỏi lại chỉ vì chú thích cũ nói không ghi sổ.

Sau đó đọc có mục tiêu các tệp ở mục 2 và:

- `server/src/chan-khac-khoi.ts`, `cau-theo-qid.ts`, `cau-snapshot.ts`, `game-v2-bank.ts` để giữ quyền, khối, đề bảo vệ và snapshot.
- `server/src/omni-kieu.ts`, `omni-d1.ts` để phân loại purpose và kỹ năng đúng.
- `src/lib/tu-luyen.ts`, `src/components/tu-luyen/ManTuLuyen.tsx`, `src/components/tu-luyen/api.ts` để nối câu hiển thị, kết quả và ref nguồn.
- `src/components/loi-giai/ThanhThangGo.tsx`, `KhungLoiGiai.tsx`, `NutHoiThay.tsx`, `src/lib/loi-giai-api.ts` để tái sử dụng hỗ trợ và ghi nhận lộ lời giải.
- `src/game/than-thu-v2/dao2/TramHoiPhuc.tsx`, `TrongAi.tsx`, `src/game/bi-a/XemLaiCauSai.tsx` để nối game mà không chặn trận.
- `server/src/nut-that.ts`, `ban-go-nut-that.ts`, `tu-hoan-thien.ts` để nối thầy và đối soát.

Chỉ đọc tài liệu dài theo mục liên quan; không quét toàn bộ `node_modules`, bản build cũ hoặc sổ việc nhiều trăm KB. Tệp đề xuất mới như `chua-cau-sai-api.ts` chưa tồn tại tại thời điểm viết đặc tả và phải được tạo khi triển khai.

### 17.2 Đầu ra phải bàn giao

1. Mã nguồn và migration của A–D, cờ pilot, validator học liệu và fixture hai nhánh nguyên nhân chạy được; học liệu có đủ ý nghĩa, điểm lệch và giới hạn áp dụng.
2. Hợp đồng API dùng thật, không còn ví dụ khác tên payload implementation.
3. Test có ca lỗi/chống trùng/rò đáp án/hiểu bước, typecheck, build, ảnh luồng học sinh và lời thoại thực tế theo mục 14.5.
4. Báo cáo đối soát, cách chạy pilot, kịch bản quan sát và KPI hiểu/sức hút/tự sửa tính từ receipt thật; đánh dấu rõ chưa có quan sát hoặc cohort trưởng thành nếu chưa thực hiện/đủ thời gian.
5. Danh sách học liệu còn thiếu và tác động lên tỷ lệ bao phủ.
6. Hướng dẫn phát hành/tắt cờ/tiếp tục phiên cũ, commit và phạm vi thay đổi.

Không báo “đã đạt 90%” chỉ vì test xanh, fixture làm được hoặc mô phỏng tạo tỷ lệ đó. Nếu chỉ làm xong lát cắt thử, nêu chính xác kênh nào đã nối và kênh nào còn thiếu.

### 17.3 Lệnh giao việc có thể sao chép

```text
Hãy đọc CLAUDE.md, các chỉ dẫn dự án hiện hành và docs/dac-ta-vong-chua-cau-sai-90-0710.md, rồi triển khai đặc tả này trong omr-app.

Thực hiện theo giai đoạn A–E, bắt đầu bằng sổ chung/phép đo và hoàn thành một luồng Tu luyện từ sai → xác định bước vướng → chữa bước → ghép bài → gặp lại 2 tự làm. Sau đó nối các kênh còn lại. Quyết định kỹ thuật thông thường dùng mặc định trong đặc tả, không dừng ở kế hoạch hoặc API chưa có giao diện.

Yêu cầu bắt buộc: học sinh hiểu đúng cách mình đã sai, vì sao cách đúng dùng được, làm được bài mới và muốn tiếp tục chữa. Triển khai mục 5.5–5.6, 6.4, 11.6–11.9 và tiêu chí 14.5; dùng hai kịch bản 13.6–13.7 để chứng minh cá nhân hóa. Không thay bằng chuỗi đọc lời giải/chọn lại hoặc chỉ thêm hiệu ứng và huy hiệu.

Giữ điểm thi, quyền truy cập, đúng khối, đề bảo vệ, snapshot và luật đóng lỗi chung. Kết quả hỗ trợ không được tính độc lập; Tu luyện không tăng EXP. Có cờ pilot, receipt idempotent, bằng chứng tương đương và KPI giữ đúng mẫu số cả học sinh bỏ dở/câu thiếu học liệu.

Chạy kiểm thử có ý nghĩa, typecheck, build và kiểm giao diện; bàn giao mã, migration, hợp đồng API, bằng chứng và cách chạy thử. Phân biệt hoàn thành kỹ thuật với đạt 90% trên dữ liệu thật. Không tạo kết quả giả, không tự đóng lỗi hoặc giảm chuẩn để đạt chỉ tiêu.
```

### 17.4 Lấy đặc tả khi phiên Claude chưa có tệp

Bản đặc tả được bàn giao trên nhánh `codex/dac-ta-chua-cau-sai-0710` của `dodaihoc4869/omr-app`, đường dẫn `docs/dac-ta-vong-chua-cau-sai-90-0710.md`. Nhánh này dành cho tài liệu; không cần chuyển toàn bộ nhánh code đang làm sang nhánh đặc tả.

Claude có thể fetch nhánh rồi đọc riêng tệp bằng `git show` vào tệp tạm, đọc theo khoảng dòng vì tài liệu dài. Không reset, stash, ghi đè thay đổi đang dở hoặc merge cả nhánh chỉ để lấy một tài liệu. Nếu chưa có quyền fetch, đọc bản Markdown do người dùng đính kèm hoặc URL GitHub của nhánh; không đoán đặc tả từ tên tệp và không báo mất tệp chỉ vì main chưa có.
