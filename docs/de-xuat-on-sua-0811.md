# ĐỀ XUẤT — ÔN BÀI CŨ & SỬA CÂU SAI theo bằng chứng nghiên cứu (08/11/2026)

Trạng thái: **ĐỀ XUẤT, CHƯA BUILD.** Thay phần Ôn / Sửa trong `docs/de-xuat-phan-bo-28-cau-0811.md` (v4); phần câu mới, 28 câu/ngày, ma trận giữ nguyên.

## 1. Thế giới làm thế nào (đã đối chiếu nguồn)

| Phương pháp | Bằng chứng | Dùng vào đâu |
|---|---|---|
| **Tự kiểm tra** (practice testing) và **ôn giãn cách** (distributed practice) | Hai kỹ thuật DUY NHẤT được xếp «hiệu quả cao» trong tổng quan 10 kỹ thuật học (Dunlosky và cộng sự, 2013). Đọc lại, gạch chân: hiệu quả thấp. | Ôn = làm đề, không đọc lại lời giải |
| **Ôn trộn** nhiều bài (interleaving) | Thử nghiệm ngẫu nhiên 54 lớp, 787 học sinh lớp 7, bài tập toán trộn so với theo từng bài: kiểm tra bất ngờ sau 1 tháng **61 % so với 38 %**, d = 0,83 (Rohrer và cộng sự, 2020; WWC công nhận đạt chuẩn). | Đề Ôn trộn cả 8 bài cũ, không ôn từng bài một |
| **Khoảng cách ôn tăng theo thời gian cần nhớ** | Hơn 1 350 người, kiểm tra tới 1 năm sau: khoảng cách tốt nhất tăng theo thời gian cần nhớ; nhớ 1 năm thì khoảng cách tốt nhất ≈ 20 % thời gian đó (Cepeda và cộng sự, 2008). | Dạng càng vững thì càng giãn |
| **Máy dự báo khả năng nhớ** từng mục rồi ôn mục sắp quên | Duolingo: p = 2^(−Δ/h), h = «nửa đời» trí nhớ; giảm sai số dự báo hơn 45 % so với cách cũ (Settles & Meeder, 2016). FSRS: R(t, S) = (1 + 19/81 · t/S)^(−0,5), S = số ngày đến khi còn nhớ 90 %; Anki dùng từ bản 23.10 (10/2023); trong thử nghiệm mở ~350 triệu lượt ôn, dự báo sát hơn thuật toán SM-2 cũ ở hầu hết bộ dữ liệu (97–99 % tuỳ cách so). | Mỗi em × mỗi dạng có một con số độ bền |
| **Sai phải xem đáp án đúng** | Chỉ báo đúng/sai: không hơn gì không báo; báo đáp án sau khi sai: giúp rõ (Pashler và cộng sự, 2005). Làm sai rồi được xem đáp án không hại, còn giúp nhớ (Kornell, Hays & Bjork, 2009). | Sai là hiện đáp án + lời giải ngay |
| **Học lại nhiều lượt** (successive relearning) | Làm đến đúng trong mỗi buổi, lặp ở nhiều buổi giãn cách ⇒ nhớ bền 1–4 tháng; khoảng 3 buổi là đủ phần lớn lợi ích (Rawson & Dunlosky, 2011); đã thử trên lớp đại học thật (Rawson, Dunlosky & Sciartelli, 2013). | Câu sai chưa «xong» khi mới đúng 1 lần |
| **Sai mà rất chắc** dễ sửa hơn (hypercorrection) | Butterfield & Metcalfe (2001); nhưng dễ tái phạm nếu quên (Butler, Fazio & Marsh). | Ghi để sau, không bắt buộc |

## 2. Toán học dùng — MỘT con số cho mỗi em × mỗi dạng
- **Độ bền h** (ngày): sau h ngày không gặp, khả năng em còn làm được dạng đó còn một nửa.
- **Khả năng nhớ hôm nay: R = 2^(−t / h)** (t = số ngày từ lần làm gần nhất). Ví dụ h = 10: sau 5 ngày R = 71 %, sau 10 ngày R = 50 %, sau 20 ngày R = 25 %.
- **Mỗi lần em làm một câu của dạng** (ngày nào cũng tính):
  - đúng ⇒ h ← h × (1,5 + 3 × (1 − R)) — nhớ lại được lúc sắp quên thì tăng mạnh: R = 90 % ⇒ ×1,8; R = 50 % ⇒ ×3,0;
  - sai ⇒ h ← max(1; 0,6 × h) và dạng thành **lỗi**.
- Lần đầu gặp dạng: h = 2.
- Các hằng số 2 / 1,5 / 3 / 0,6 là **giá trị khởi đầu**. Máy có sẵn lịch sử từng câu từng em (`su_kien_hoc`) ⇒ mỗi tháng tự tính lại hằng số cho khớp dữ liệu thật của trung tâm (cách FSRS / Duolingo làm), báo độ khớp dự báo cho thầy. Chưa đủ dữ liệu thì giữ giá trị khởi đầu.

## 3. ÔN — ví dụ thầy chọn bài 9, em đã học 8 bài
**Một luật:** đề Ôn 28 câu đúng ma trận, trộn cả 8 bài; ở mỗi vị trí chọn **dạng em sắp quên nhất** (R thấp nhất), lấy câu song sinh của dạng đó (không có thì câu đã làm lâu nhất).

Ví dụ (giả định thứ tự bài lớp 12): bài 1–2 Ester – lipid, 3–4 Carbohydrate, 5–7 Hợp chất nitrogen, 8 Polymer ⇒ 4 chương đã học.
- 28 vị trí blueprint: 4 chương này có sẵn 10 vị trí (Ester 3, Carbohydrate 2, Nitrogen 3, Polymer 2).
- 18 vị trí của chương chưa học chuyển cho 4 chương trên, **giữ đúng phần × mức**, chương em yếu nhất (R trung bình thấp nhất) nhận trước: Phần I Biết 9, Phần I Hiểu 2, Phần I VD 2, Phần II Hiểu 1, Phần II VD 1, Phần III Hiểu 1, Phần III VD 2.
- Trong mỗi vị trí: dạng R thấp nhất của mọi bài thuộc chương đó ⇒ bài 1 học từ lâu, em quên nhiều thì tự lên trước; bài vừa học, em còn nhớ thì chưa gọi.
- Kết quả: đề 28 câu đúng 7 ô, chỉ từ 8 bài đã học, mỗi câu nhắm đúng chỗ em đang quên. Hai em cùng lớp nhận hai đề khác nhau.

**Số ngày Ôn trong chu kỳ bài 9** = ⌈số dạng của 8 bài cũ có R < 70 % khi em làm xong câu mới / 28⌉, tối thiểu 1. Máy biết chính xác con số này cho từng em.
- Ví dụ (số giả định): 224 dạng cũ, 61 dạng dưới 70 % ⇒ ⌈61/28⌉ = 3 ngày Ôn; em khác 20 dạng ⇒ 1 ngày.
- Thay cho «R = 1 xoay vòng» và hai phương án A/B ở v4.

## 4. SỬA — 3 bước, «xong» khi đúng ở 2 ngày khác nhau
1. **Lúc sai** (ngày Mới, Sửa chấm tức thì; đề Ôn chấm sau khi nộp): hiện đáp án + lời giải ngay; em chạm chọn **sai ở bước nào** (dùng chẩn đoán bước sai đã có: `chan-doan-buoc-sai.ts`, `omni_buoc_sai`).
2. **Ngày Sửa** (1–3 ngày sau): mỗi **nhóm lỗi** (cùng bài + cùng dạng + cùng ô) làm một câu song sinh, không xem lời giải trước. Đúng = **lượt 1**; máy đặt h = 5 ⇒ dạng sẽ xuống dưới 70 % sau ~2,6 ngày.
3. **Lượt 2 do đề Ôn gọi lại** đúng lúc đó (dạng R thấp được chọn trước). Đúng ⇒ **sửa xong**; từ đây dạng chạy theo h như mọi dạng khác (đó là lượt 3, 4 … của học lại nhiều lượt). Sai ⇒ quay về ngày Sửa.
- Sai 3 lần cùng nhóm ⇒ thầy chữa trực tiếp (danh sách trên app thầy).
- Lý do 2 lượt chứ không 3: nghiên cứu cho thấy khoảng 3 buổi là đủ; lượt 3 trở đi đề Ôn tự lo, không tốn ngày Sửa.

## 5. Vì sao đơn giản
- Học sinh, phụ huynh thấy: «Ôn: 28 câu, chỗ con sắp quên» · «Sửa: làm lại kiểu câu đã sai».
- Máy chỉ giữ cho mỗi em × mỗi dạng: h, ngày làm gần nhất, số lượt đúng sau lỗi.
- Một công thức nhớ cho cả Ôn lẫn Sửa; ma trận vẫn tuyệt đối ở từng đề.

## 6. Nói thẳng
- Em đã thử giả lập trí nhớ tự dựng để so các cách, nhưng mô hình ấy không đủ tin (kết quả phụ thuộc thông số em tự đặt) ⇒ **không dùng làm căn cứ**. Lựa chọn trên dựa vào nghiên cứu ở mục 1; hiệu quả thật đo bằng dữ liệu trung tâm sau khi chạy: máy so khả năng nhớ dự báo với kết quả đề Ôn thật.
- Bằng chứng ôn trộn mạnh nhất là ở môn toán lớp 7 (một học khu ở Mỹ); học lại nhiều lượt chủ yếu thử ở đại học. Áp vào Hoá luyện thi là suy luận hợp lý, chưa có thử nghiệm riêng.
- Một nghiên cứu sau cho thấy làm sai rồi xem đáp án còn có thể hại khi câu hỏi và đáp án không liên quan nghĩa với nhau (Knight và cộng sự, 2012) ⇒ lời giải phải chỉ đúng bước sai.

## 7. Nguồn
- Dunlosky et al. 2013, Psychological Science in the Public Interest 14(1): https://www.sciencedaily.com/releases/2013/01/130110111734.htm
- Rohrer, Dedrick, Hartwig & Cheung 2020, J. Educational Psychology 112(1): https://ies.ed.gov/ncee/wwc/Study/88770
- Cepeda, Vul, Rohrer, Wixted & Pashler 2008, Psychological Science: https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf
- Settles & Meeder 2016, ACL (half-life regression): https://www.github.com/duolingo/halflife-regression
- FSRS: https://expertium.github.io/Algorithm.html · thử nghiệm mở: https://expertium.github.io/Benchmark.html
- Pashler et al. 2005: https://digitalcommons.usf.edu/psy_facpub/1773
- Kornell, Hays & Bjork 2009: https://pubmed.ncbi.nlm.nih.gov/19586265/
- Rawson & Dunlosky 2011; Rawson, Dunlosky & Sciartelli 2013: https://openscholarship.wustl.edu/circle_book/8 · https://www.retrievalpractice.org/archive/2018/successive-relearning
- Butterfield & Metcalfe 2001: https://en.wikipedia.org/wiki/Hypercorrection_(psychology)
