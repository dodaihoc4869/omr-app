# Kiểm gói song sinh Claude bàn giao ngày 07/10/2026

**Kết luận: chưa đạt nghiệm thu, chưa nạp D1.** Đây là lô mẫu bốn câu gốc, 18 bản I/III và 24 ý Đ/S; chưa phải kho 14.828 câu. Báo cáo tự khai PASS trong manifest không thay kết quả kiểm lại.

## Kết quả đã kiểm

| Nhóm | Ứng viên | Bộ kiểm máy chủ nhận | Kết luận nội dung |
|---|---:|---:|---|
| Gly-Ala-Glu, `12-C3-B9-D2-I-43` | 6 | 6 | Đáp số đúng 6/6, nhưng cả sáu lời giải đếm sai số nhóm COOH tự do của peptide; phải sửa. Bản 6 nên bổ sung yêu cầu làm tròn. |
| Thomson, `10-C1-B1-I-1` | 6 | 6 | Cần sửa phạm vi kiến thức, mốc lịch sử và lý do so khối lượng. |
| Protein, `12-C3-B10-D2-III-3` | 6 | 3 | Cần sửa điều kiện độ tan và ba đáp số bị cổng hiện tại loại. |
| Kẽm, `12-KT-C6-D5-II-4` | 24 | 24 | Các phép tính đã tính lại đúng theo quy ước đề; cần sửa mô tả công nghệ, chuẩn hóa lời giải và chạy lại kiểm mù đủ đề dẫn. |
| Tổng | **42** | **39** | **39 là số qua cổng cấu trúc/bằng chứng, không phải số được duyệt chuyên môn.** |

Đã chạy đúng `kiemBanKhac`, `kiemYMoi`, `nhanBanKhacNop`, `nhanYMoiNop` từ bundle của PR185. Không thực thi mã nào trong ZIP. Chương trình kiểm và kết quả nằm cạnh báo cáo: `kiem-goi.mjs`, `kiem-tu-dong.json`, `kiem-so-hoc.py`, `kiem-so-hoc.json`, `ket-qua-kiem-42-muc.json`.

Đã tính lại bam bằng hàm chuẩn: 4/4 khớp. Cả bốn qid/bam cũng khớp ánh xạ trong báo cáo D1 trước đó. Chưa đọc lại phiên bản câu gốc D1 hiện tại, nên chưa chứng nhận snapshot vẫn là phiên bản mới nhất.

Đã so toàn bộ `pass1-soan` với ứng viên bỏ trường `kiem`: 42/42 khớp. Toàn bộ đáp án/lý do/xác nhận trong `bo-tro` khớp `pass2-ra`; đầu vào giải mù không có các khóa đáp án/lời giải. Tuy nhiên, gói không có lệnh chạy, định danh phiên, log cách ly hoặc checksum snapshot gốc để kiểm chứng hai lượt thật sự tách biệt. Không kết luận các tệp bị giả tạo; chỉ kết luận bằng chứng hiện có chưa đủ xác minh việc thực thi.

## Những điểm bắt buộc sửa

### 0. Gly-Ala-Glu: đúng đáp số nhưng sai cách giải thích

Cả sáu bản ghi “4 nhóm -COOH mỗi phân tử peptide”. Gly-Ala-Glu nguyên vẹn có **hai liên kết peptide và hai nhóm COOH tự do** (một ở đầu C và một ở mạch bên của Glu), không phải bốn nhóm COOH tự do. Thủy phân hai liên kết cần 2 mol KOH; trung hòa hai nhóm COOH tự do cần thêm 2 mol KOH. Tổng vẫn là 4 mol KOH/mol peptide nên đáp số đúng, nhưng bước giải thích hiện tại phải sửa ở cả sáu bản. Có thể đếm tổng nhóm carboxyl của các amino acid sau thủy phân, nhưng phải nói rõ đây là các sản phẩm sau thủy phân, không phải nhóm tự do trong peptide nguyên vẹn.


### 1. Protein: tính chất bị khái quát quá mức

Bản 1, 4, 5 đếm insulin là tan trong nước chỉ vì dạng hình cầu, không nêu pH hay môi trường. [Tài liệu kỹ thuật của Sigma-Aldrich](https://www.sigmaaldrich.com/deepweb/assets/sigmaaldrich/product/documents/406/440/i2767pis.pdf) mô tả insulin ít tan ở pH trung tính, phải dùng điều kiện thích hợp để hòa tan. Không được suy độ tan chỉ từ hình dạng.

Bản 2, 6 dùng tên chung globulin và mặc định tan trong nước. [Nghiên cứu thực nghiệm về độ tan protein](https://pubmed.ncbi.nlm.nih.gov/19871969/) cho thấy độ tan của globulin huyết thanh tinh sạch phụ thuộc trạng thái và môi trường. Tên nhóm protein chung không đủ để gán chắc chắn một đáp số đếm protein tan.

Cổng hiện tại loại **bản 2, 5, 6** vì đáp số trùng câu gốc/bản khác. Đây là luật chống nhớ đáp số của phần mềm, không có nghĩa phép đếm sai chỉ vì hai câu cùng đáp án. Nếu cần đổi chính sách cho câu lý thuyết đếm, phải xử lý như thay đổi bộ kiểm riêng, không bỏ qua cổng rồi khai PASS. Với bản giao này, chưa đủ sáu bản mà máy chủ nhận.

Sửa bằng cách nêu rõ môi trường/điều kiện hoặc cung cấp bảng dữ liệu độ tan có nguồn để học sinh suy luận; không bịa tính chất. Chuẩn hóa lời giải của cả sáu bản, tránh phát biểu tuyệt đối “protein hình cầu tan trong nước”.

### 2. Kẽm: ý 16 và đầu vào giải mù

Ý 16 tự khai đúng và giải thích SO3 được hấp thụ trực tiếp vào nước như phương pháp tiếp xúc. Phải phân biệt phương trình tạo acid với bước công nghệ: phương pháp tiếp xúc thông dụng hấp thụ SO3 vào H2SO4 đặc rồi pha loãng, thay vì đưa trực tiếp vào nước. [Tài liệu RSC cho giáo viên](https://edu.rsc.org/download?ac=11174) mô tả tháp hấp thụ được phủ acid; [tài liệu RSC về quy trình](https://edu.rsc.org/download?ac=12434) nêu bước oleum. Viết lại phát biểu và lý do cho chính xác rồi giải mù lại; không tự đổi đáp án để ép khớp.

`pass2-vao.json` của nhóm Đ/S chỉ giữ tiêu đề “Sản xuất kẽm điện phân từ quặng sphalerite 3 giai đoạn”, làm mất đề dẫn cụ thể về ZnSO4, điện cực trơ và ba giai đoạn. Các ý tham chiếu “giai đoạn 3” vì thế không có đủ ngữ cảnh gốc. Phải dùng lại **đầy đủ đề dẫn**, rồi giải mù 24 ý ở phiên mới.

Ý 6 và 21 cần thống nhất cách mô tả zincate trong dung dịch với các ý 23–24 dùng tetrahydroxozincate; nêu rõ môi trường/quy ước nếu dùng công thức Na2ZnO2. Các ý tính số 13, 19, 20 cần ghi quy ước khối lượng mol và hằng số Faraday để đáp số không phụ thuộc bộ hằng số khác.

### 3. Thomson: tương đương kiến thức và lịch sử

Bản 2, 3, 4 chuyển sang Millikan, Rutherford, Chadwick. Chúng cùng chương nhưng chưa kiểm cùng nội dung cụ thể của câu gốc “Thomson phát hiện electron nhờ thí nghiệm nào”. Cần xác định rõ phạm vi tương đương hoặc sinh lại biến thể thật sự kiểm thí nghiệm tia âm cực và kết luận về electron.

Lý do kiểm mù bản 1 nói electron nhẹ hơn “hạt nhân” khoảng 1800 lần. Mức xấp xỉ này chỉ phù hợp khi so với proton/hạt nhân hydrogen, không phải mọi hạt nhân. Viết lại, tránh đưa kiến thức sai vào lời giải dù chọn A phù hợp.

Bản 3, 6 gắn năm 1911 với thí nghiệm lá vàng. Nên viết rõ mô hình Rutherford được công bố năm 1911 dựa trên thí nghiệm tán xạ, phân biệt với loạt thí nghiệm Geiger–Marsden năm 1909. [RSC về Rutherford](https://www.rsc.org/images/RUTHERFORD-SANGER%20FEATURE_tcm18-134357.pdf) nêu mốc 1909; tài liệu tìm kiếm đã đọc được đoạn này, nhưng việc mở trực tiếp PDF gặp lỗi. Tránh câu hỏi sai/đúng bị mơ hồ chỉ vì mốc lịch sử. Chuẩn hóa viết hoa đầu câu và tên riêng.

## Số học độc lập

Với peptide, 1 mol Gly-Ala-Glu cần 4 mol KOH: hai liên kết peptide, một nhóm carboxyl đầu mạch và một nhóm carboxyl bên của Glu. Dùng `x=4n/V` với V tính bằng lít, sáu đáp số lần lượt là **3,00; 3,20; 10,00; 1,00; 3,20; 3,33 M**, đúng các lựa chọn đã gán.

Với kẽm, dùng Zn=65, S=32, O=16, F=96500: ý 13 là 19300 C, ý 17 là 600 kg, ý 18 thực tế 540 kg (nên S), ý 19 là 4,8 kg O2, ý 20 cần 200 lít (nên S). Điều này chứng minh số học theo bộ hằng số đó, không thay kiểm định dữ kiện/điều kiện của đề.

## Giao Claude sửa và bàn giao lại

Giữ nguyên gói gốc. Tạo gói v0.2 kèm danh sách thay đổi từng `_id`, sửa các điểm trên, chạy bộ kiểm chuẩn đầy đủ thay vì chỉ kiểm trường `BangChung2Luot`, giải mù lại mục đổi nội dung và cả 24 ý Đ/S với đề dẫn đầy đủ. Kèm log lệnh/định danh phiên tách biệt (đã loại khóa bí mật), phiên bản nguồn, checksum và kết quả từng cổng. Báo rõ câu nào còn thiếu sáu; chưa được ghi 4/4 câu PASS khi chưa đủ điều kiện. Chưa nạp D1.
