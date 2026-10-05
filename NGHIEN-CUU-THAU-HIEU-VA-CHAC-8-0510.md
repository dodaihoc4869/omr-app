# NGHIÊN CỨU — "ĐƯỢC THẤU HIỂU TỘT CÙNG" VÀ "CHẮC 8+ TRONG ÍT NHẤT 7 NGÀY": NÂNG OMNI LÊN BẢN 3

Soạn 05/10/2026 · **Chưa build.** Nối tiếp `DE-XUAT-KET-HOP-ALCHEMY-OMNI-0510.md` (bản 2) và `prompt-tick-bai-tu-giao.md`. Tiếp thu bản tham khảo thầy gửi 05/10 (DINA · độ trôi chảy · nhịp sinh học · động cơ 7 ngày), có đối chiếu văn liệu và mã thật; chỗ nào bản tham khảo nói chưa đúng thì ghi thẳng ở mục 7.

---

## 0. KẾT LUẬN MỘT TRANG

**1. "Chắc chắn đạt trên 8" chỉ có một nghĩa trung thực: một chứng chỉ đo được, trên phạm vi đã học, kiểm bằng đề lạ, kèm độ tin.** Mọi cam kết "100 %, không sai số" là nói dối học sinh và phụ huynh, và trái luật A1.7 của app ("chỉ hứa điều chắc chắn xảy ra"). Bản này định nghĩa: em **Sẵn sàng 8+ cho Bài N** khi xác suất mô hình em đạt ≥ 8 trên một đề 28 câu đúng khung thi, lấy từ câu **chưa gặp** trong phạm vi bài, ≥ 0,90, **và** ca chốt thật trên đề lạ xác nhận. Thời gian là biến số, mức nắm là hằng số (Carroll 1963; Bloom 1968): 7 ngày là sàn, em nào chưa đủ thì kéo dài theo nhịp riêng, không hạ chuẩn.

**2. Phát hiện quan trọng nhất của bản này nằm ở toán của đề thi, không ở học máy.** Phần II (Đúng–sai) chấm 0,1 · 0,25 · 0,5 · 1,0 theo số ý đúng, nên điểm kỳ vọng phi tuyến theo độ chính xác từng ý: đúng 85 % mỗi ý chỉ mang về 2,93/4, đúng 90 % mang 3,26/4, đúng 95 % mang 3,61/4. **Mốc "vững" cho ý Đúng–sai phải là ≥ 0,93, không phải 0,90, và phải đo ở cấp Ý, không ở cấp câu.** App đã lưu kết quả từng ý (`subitem_json`) nên làm được ngay.

**3. "Được thấu hiểu" là ba điều đo được, không phải lời lẽ:** (a) máy biết em sai **ở vi kỹ năng nào** và nói đúng tên nó; (b) máy **nhớ** và nhắc lại đúng chỗ ("Thứ Ba em vướng bước cân bằng, hôm nay 3/3"); (c) máy phản ứng **đúng trạng thái** của em: chắc mà sai, đúng mà chậm, sai quá nhanh, 3 sai liền, học lúc đã mệt, vắng rồi quay lại. Mỗi điều là một mô-đun tất định trong mục 4–5.

**4. Lấy từ bản tham khảo:** chẩn đoán vi kỹ năng theo ma trận Q với cổng AND có nhiễu (DINA) **ghép vào BKT** làm mô hình gán lỗi; độ trôi chảy đo bằng mô hình thời gian lognormal (van der Linden 2006) với tham số tốc độ riêng từng em; hồ sơ mệt theo giờ **của riêng em, có co Bayes**, chỉ gợi ý không khoá; đan xen bài cũ ngày 4–5; luyện trong điều kiện thi ngày 6. **Sửa lại ba chỗ:** không có "cam kết toán học tuyệt đối"; app **chưa có** 3PL-IRT (bản 2 đã quyết không hiệu chuẩn 3PL vì 1/814 câu đủ mẫu); "cất câu khó đi" không được là khoá cứng mà là đổi thứ tự trong kế hoạch đã chốt, em được từ chối.

**5. Bốn nâng cấp mô hình, mỗi cái một dòng:** P theo **vi kỹ năng** với cổng AND thay P theo dạng (gán lỗi đúng chỗ) · quyết định "vững" bằng **SPRT** có sai số kiểm soát thay ngưỡng cứng · thêm **một chạm tự tin** sau mỗi câu (tách đoán mò khỏi biết, tách sơ ý khỏi hiểu sai; hiệu ứng siêu sửa lỗi) · **ngân sách thời gian thi 50 phút** đưa vào dự báo (con đường 8 phải khả thi về thời gian, không chỉ về kiến thức).

**6. Chu trình 7 ngày "chắc 8"** (mục 6): Ngày 0 kiểm tra đầu vào ở lớp · Ngày 1–2 tiếp nhận có ví dụ mẫu dần rút cho vi kỹ năng yếu, mục tiêu đúng 80–85 % · Ngày 3–4 củng cố cách quãng, đóng lỗi bằng song sinh, SPRT · Ngày 4–5 đan xen bài cũ · Ngày 6 luyện trong điều kiện thi (25 phút, 14 câu lạ) · Ngày 7 ca chốt 28 câu lạ → chứng chỉ hoặc kéo dài riêng.

---

## 1. HAI MỤC TIÊU, ĐỊNH NGHĨA ĐO ĐƯỢC

### 1.1 "Chắc 8+ với kiến thức đã tích trong ≥ 7 ngày"

- **Phạm vi**: các bài đã tick của lớp (prompt tick bài). Chứng chỉ cấp theo **bài**, tích luỹ theo chương.
- **Tiêu chí mô hình**: Monte Carlo 2 000 lần (tất định theo seed `sbd|bài|ngày`) từ P của từng ô (phần × vi kỹ năng) kèm bất định Beta theo cỡ mẫu → P(điểm ≥ 8) ≥ 0,90 trên khung 18 + 4 + 6.
- **Tiêu chí thực nghiệm**: ca chốt 28 câu **chưa gặp** đúng khung thi, điểm ≥ 8,0. Hai tiêu chí phải cùng đạt.
- **Chữ hiện**: "Bài 6 · Sẵn sàng 8+ · độ tin 92 % · kiểm bằng 28 câu lạ ngày 12/10". Không bao giờ hiện 100 %.
- **Chưa đạt**: "Còn 1 vi kỹ năng và 3 ý Đúng–sai · ước 3 ngày theo nhịp của em" và kế hoạch kéo dài riêng, không hạ chuẩn, không đổi hạn của lớp.

### 1.2 "Được thấu hiểu tột cùng"

Ba tầng, mỗi tầng có phép đo:

| Tầng | Máy làm gì | Đo bằng |
|---|---|---|
| Biết **ở đâu, vì sao** | Gán lỗi về vi kỹ năng (mục 4.1), gọi đúng tên lỗi theo thư viện lỗi của dạng | % lượt sai được gán vi kỹ năng với độ tin ≥ 0,7; % em làm đúng câu nền ngay sau khi được gán |
| **Nhớ và nhắc đúng chỗ** | Nhật ký của em 3 dòng/ngày từ dữ liệu; thẻ cuối ngày so với chính em hôm qua | Tỉ lệ mở thẻ; câu hỏi 1 chạm mỗi tuần "App có chọn đúng câu em cần không?" ba mức |
| Phản ứng **đúng trạng thái** | Chắc-mà-sai → lời giải trước; đúng-mà-chậm → chưa tính vững; sai-quá-nhanh → lướt; 3 sai liền → trạm; muộn-và-mệt → đổi thứ tự; vắng → ngày nhẹ | Tỉ lệ bỏ chuyến giữa đường; tỉ lệ quay lại sau 3 ngày; số lượt lướt/ngày |

Nền lý thuyết: ba nhu cầu của thuyết tự quyết — năng lực, tự chủ, gắn kết (Ryan & Deci 2000). Năng lực = tiến bộ nhìn thấy theo vi kỹ năng; tự chủ = vé thử thách, từ chối "chế độ muộn", chọn mục tiêu 8 hay 9; gắn kết = lời gỡ của thầy gắn đúng bước (đã có `ban-go-nut-that.ts`) và một dòng thầy gửi mỗi tuần do máy gợi từ số.

---

## 2. CƠ SỞ VĂN LIỆU → THAY ĐỔI CỤ THỂ TRONG APP

| Phát hiện | Nguồn | Đổi gì |
|---|---|---|
| Học theo mức nắm (mastery learning) nâng điểm thi ≈ 0,52 độ lệch chuẩn trên 108 nghiên cứu | Kulik, Kulik & Bangert-Drowns 1990, *Rev. Educ. Res.* | Chứng chỉ theo bài là hằng số; thời gian của em là biến số (mục 6) |
| Dạy kèm theo **bước** đạt ≈ 0,76 so với 0,79 của người dạy kèm; theo đáp án chỉ ≈ 0,31 | VanLehn 2011, *Educ. Psychologist* | Giữ và mở rộng câu kiểm từng bước (`cau_kiem`), gán lỗi theo bước, câu nền theo bước |
| Nhớ bền nhất khi **nhớ lại đúng 3 lần ở 3 phiên cách nhau**; 3 lần trong một phiên kém xa (68 % so 26 % sau một tuần) | Rawson & Dunlosky 2011 | "Vững" đòi ≥ 3 lần đúng tự làm ở ≥ 3 ngày khác nhau cho vi kỹ năng cốt lõi (hiện 2 ngày) |
| Khoảng cách ôn tối ưu ≈ 20–40 % của khoảng cần nhớ khi cần nhớ 1 tuần, giảm còn ≈ 5–10 % khi cần nhớ 1 năm | Cepeda, Vul, Rohrer, Wixted & Pashler 2008, *Psych. Sci.* | Trong 7 ngày: mốc 1–2–3 ngày là đúng; FSRS lo phần sau hạn; không kéo mốc xa trong chiến dịch |
| Tỉ lệ sai tối ưu cho tốc độ học ≈ 15,9 % (quy tắc 85 %) với lớp thuật toán học theo độ dốc và mạng sinh học | Wilson, Shenhav, Straccia & Cohen 2019, *Nat. Commun.* | Chọn câu **để học** ở vùng P(đúng) dự đoán 0,75–0,90; vùng 0,5 chỉ dùng để **đo** (thử thách, probe). Fisher information tối ưu cho đo, không cho học |
| Ví dụ mẫu lợi cho người mới, hại cho người đã khá (hiệu ứng đảo ngược chuyên môn); ví dụ mẫu **rút dần** | Sweller; Kalyuga, Ayres, Chandler & Sweller 2003; Renkl & Atkinson 2003 | Vi kỹ năng P < 0,4 ⇒ "Ví dụ minh hoạ" đi trước, có câu kiểm từng bước, rồi bài hoàn thiện (song sinh có sẵn bước), rồi bài đủ |
| Lỗi mắc **khi đang chắc** được sửa bền hơn (siêu sửa lỗi) | Butterfield & Metcalfe 2001 | Một chạm "Chắc / Chưa chắc" sau mỗi câu; chắc-mà-sai ⇒ mở lời giải chủ động ngay, ưu tiên ôn |
| Đoán mò / sơ ý **theo ngữ cảnh** chính xác hơn tham số cố định | Baker, Corbett & Aleven 2008 | Chạm tự tin + thời gian làm là ngữ cảnh: đúng-không-chắc nâng xác suất đoán; sai-nhanh nâng xác suất sơ ý |
| Câu nhiều kỹ năng: gán lỗi theo cổng AND (DINA; truy vết kiến thức hội) | de la Torre 2009; Koedinger, Pavlik, Stamper, Nixon & Ritter 2011 | P theo vi kỹ năng với ma trận Q, quan sát qua cổng AND có nhiễu (mục 4.1) |
| Tốc độ học và prior **riêng từng em** cải thiện dự báo | Pardos & Heffernan 2010; Yudelson, Koedinger & Gordon 2013 | T riêng từng em co về lớp (cách `ca-nhan-hoa-v2.ts` đã dùng) |
| Thời gian trả lời theo mô hình lognormal: log t = cường độ câu − tốc độ em + nhiễu | van der Linden 2006, *J. Educ. Behav. Stat.* | Độ trôi chảy đo bằng tốc độ riêng, không bằng giây tuyệt đối (mục 4.2) |
| Quyết định phân loại tuần tự với sai số kiểm soát | Wald 1945; Eggen 1999 (SPRT trong trắc nghiệm thích ứng) | "Vững / chưa vững / chưa đủ bằng chứng" bằng SPRT (mục 4.4) |
| Đan xen dạng tốt hơn luyện theo khối cho bài tập toán | Rohrer, Dedrick & Stershic 2015, *J. Educ. Psychol.* | Ngày 4–5 trộn 40 % câu bài cũ cùng chương vào chuyến |
| Kiểm tra bằng bài test và luyện cách quãng là hai kỹ thuật "lợi ích cao"; đọc lại, tô đậm "lợi ích thấp" | Dunlosky, Rawson, Marsh, Nathan & Willingham 2013 | Giữ mọi thứ là làm-rồi-mới-xem-lời-giải; không thêm chế độ "đọc tài liệu" |
| Chronotype thiếu niên lệch muộn; năng lực nhận thức dao động theo giờ **khác nhau giữa người** | Carskadon 2011; Schmidt, Collette, Cajochen & Peigneux 2007 | Hồ sơ mệt theo giờ **của riêng em**, không đặt giờ chung 22:30 cho cả lớp (mục 4.5) |
| Thói quen hình thành trung vị ≈ 66 ngày; ý định thực thi "nếu … thì …" tăng tỉ lệ làm | Lally, van Jaarsveld, Potts & Wardle 2010; Gollwitzer 1999 | Em chọn giờ học cố định; nhắc đúng giờ ấy; chuỗi ngày đã có |

---

## 3. TOÁN CỦA ĐIỂM 8 — CÁI QUYẾT ĐỊNH MỌI NGƯỠNG

### 3.1 Phần II là "phần chính xác"

Mỗi câu Đúng–sai 4 ý, điểm theo số ý đúng 1/2/3/4 = 0,1/0,25/0,5/1,0 (`diemDungSai`, `src/lib/tu-luyen.ts:97`). Nếu em đúng mỗi ý độc lập với xác suất p:

| p mỗi ý | P(đủ 4) | Điểm kỳ vọng / câu | 4 câu Phần II |
|---|---|---|---|
| 0,75 | 0,32 | 0,58 | 2,34 |
| 0,85 | 0,52 | 0,73 | 2,93 |
| 0,90 | 0,66 | 0,81 | 3,26 |
| 0,95 | 0,81 | 0,90 | 3,61 |
| 0,98 | 0,92 | 0,96 | 3,84 |

Hệ quả: (1) **mốc vững cho ý Đúng–sai = 0,93**, cao hơn mốc 0,90 chung; (2) P phải theo **ý** (mỗi ý thường một vi kỹ năng/khẳng định), không theo câu; (3) một câu Đúng–sai đủ 4 ý = 4 quan sát ⇒ bằng chứng tích luỹ nhanh gấp 4 (mục 4.4).

### 3.2 Ba con đường tới 8,0 và "con đường rẻ nhất"

| Đường | Phần I (18 × 0,25) | Phần II | Phần III (6 × 0,25) | Tổng |
|---|---|---|---|---|
| A | đúng 90 % → 4,05 | ý 0,90 → 3,26 | 3/6 → 0,75 | 8,06 |
| B | đúng 95 % → 4,28 | ý 0,85 → 2,93 | 4/6 → 1,00 | 8,21 |
| C | đúng 85 % → 3,83 | ý 0,95 → 3,61 | 3/6 → 0,75 | 8,19 |

Máy chọn cho từng em **đường rẻ nhất**: tối thiểu số lượt dự kiến để các ô đạt mốc của đường đó (mục 4.4 cho số lượt). Em mạnh lý thuyết đi đường B, em cẩn thận đi đường C. Đây là "mục tiêu riêng" ở mức thấp nhất; mục tiêu 9 chỉ đổi hằng số.

### 3.3 Ngân sách thời gian thi: 50 phút cho 28 câu

Trung bình 107 giây/câu. Phân bổ tham chiếu: Phần I 18 × 60 s = 18 phút · Phần II 4 × 3 phút = 12 phút · Phần III 6 × 2,5 phút = 15 phút · 5 phút soát. Em có tốc độ riêng τ (mục 4.2) chậm hơn 1,6 lần ở Phần III sẽ **không kịp** 6 câu: dự báo phải tính trên **tập câu khả thi về thời gian** (ví dụ 4/6 Phần III), và con đường 8 của em ấy phải dồn sang Phần I và II. Đây là chỗ bản 2 còn thiếu: biết mà không kịp làm thì không có điểm.

---

## 4. MÔ HÌNH HỌC SINH BẢN 3 — SÁU THAY ĐỔI, TẤT CẢ TẤT ĐỊNH VÀ PHÁT LẠI TỪ SỔ

### 4.1 Vi kỹ năng + ma trận Q + cổng AND có nhiễu (DINA ghép BKT) — gán lỗi đúng chỗ

- **Đơn vị**: vi kỹ năng k (3–6 cho mỗi dạng; ví dụ dạng "Thuỷ phân ester": viết đúng phương trình · tỉ lệ mol ester–NaOH kể cả ester của phenol · bảo toàn khối lượng · xử lý hỗn hợp hai ester · tính hiệu suất). **Ma trận Q**: câu j cần tập K_j ⊆ vi kỹ năng. Nguồn gắn: nhãn `kienThuc[]` và `nhan_nen` theo bước đã có trong kho (`cau-bo-tro.ts`), máy gợi, **thầy duyệt theo lô** trên kho DẠY HỌC trước (≈ 3 400 câu), TU LUYỆN sau.
- **Quan sát**: P(đúng | α) = (1 − S_j) nếu em có **đủ** mọi k ∈ K_j, bằng G_j nếu thiếu bất kỳ k nào. G_j theo phần (0,25 · 0,0625 · 0,01), S_j = 0,10 khởi đầu — đúng ràng buộc bản 2.
- **Cập nhật** (truy vết kiến thức hội, hàm thuần): giữ P_k riêng từng vi kỹ năng; khi em **sai** câu j, phần "trách" chia cho các k ∈ K_j **tỉ lệ nghịch với P_k hiện tại** (vi kỹ năng em yếu nhất nhận nhiều trách nhất); khi em **đúng**, mọi k ∈ K_j cùng được tăng (vì cổng AND đòi đủ). Mỗi k nhận một lượt học T như BKT. Không cần liệt kê 2^K cấu hình: xấp xỉ tích độc lập, kẹp [0,02; 0,98].
- **Chẩn đoán cho Trạm hồi phục**: 3 câu sai liền ⇒ lấy giao K của ba câu; vi kỹ năng có P thấp nhất trong giao là **tên lỗi**; câu nền theo nhãn ấy (`cau_nen`). Chữ trên màn theo bảng từ chuẩn, không kết luận năng lực: *"3 câu em vừa sai đều cần bước **cân bằng hệ số**. Làm 3 câu nhỏ về cân bằng trước, rồi quay lại."*
- **P nắm dạng** (cho dự báo điểm) = Π_k P_k trên K của dạng ở mức độ đang xét — cổng AND nhất quán với quan sát.
- **Kiểm ma trận Q**: câu nào quan sát thật lệch xa dự đoán cổng AND (sai nhiều ở em đã vững mọi k) ⇒ nghi Q thiếu vi kỹ năng hoặc đáp án sai ⇒ vào `cau_nghi_dap_an` đã có. (de la Torre 2008 về kiểm định Q.)

### 4.2 Độ trôi chảy — mô hình thời gian lognormal, tốc độ riêng từng em

- Ghi thời gian làm từng câu (bản 2: `msLam`, kẹp [0, 900 s], chỉ để tha, không để phạt — giữ).
- **Mô hình**: ln t_ij = β_j − τ_i + ε. β_j = trung vị log-thời gian của lớp trên câu j (thiếu ⇒ `uoc-luong-thoi-gian.ts` theo phần × mức × độ dài đã có); τ_i = tốc độ riêng của em, ước từ 20 lượt gần nhất **đúng và tự làm**, co về 0 khi ít mẫu.
- **Ba nhãn** cho một lượt đúng: **trôi chảy** nếu t ≤ 1,25 × e^{β_j − τ_i}; **chậm** nếu t > 2,0 ×; ở giữa là **bình thường**. Lượt **sai** với t rất ngắn vẫn là lướt (bản 2).
- **Luật**: đúng-chậm **vẫn là đúng** cho đóng lỗi và FSRS (không phạt), nhưng "vững" đòi ≥ 2 lượt trôi chảy ở 2 ngày; thẻ cuối câu: *"Đúng rồi, nhưng em mất 3 phút 10 giây. Mai gặp lại một câu tương tự để làm nhanh hơn."* Chữ nói số thật của em, không so với bạn.
- **Vào dự báo**: τ_i quyết tập câu khả thi trong 50 phút (3.3). Em chậm ở Phần III được dự báo đúng là "chưa kịp", không phải "chưa biết".

### 4.3 Một chạm tự tin — tách đoán mò khỏi biết, sơ ý khỏi hiểu sai

- Sau khi chọn đáp án, trước khi xem kết quả: hai nút **Chắc** / **Chưa chắc** (mặc định Chắc nếu em bấm thẳng; không bắt buộc). Chi phí: < 1 giây.
- **Bốn ô** và cách dùng (Baker et al. 2008; Butterfield & Metcalfe 2001):

| | Chắc | Chưa chắc |
|---|---|---|
| **Đúng** | Bằng chứng mạnh; FSRS Good (Easy nếu trôi chảy) | Nghi đoán: G câu này nhân 2 trong cập nhật; FSRS Hard; câu hẹn sớm |
| **Sai** | Hiểu sai thật ⇒ mở lời giải chủ động + câu kiểm ngay (siêu sửa lỗi); ưu tiên ôn cao nhất | Lỗ hổng ⇒ gán lỗi vi kỹ năng như thường |

- Bỏ qua chạm ⇒ coi "Chắc". Em không bị trừ gì vì "Chưa chắc"; chữ giải thích một lần: "Bấm Chưa chắc giúp máy chọn đúng câu cho em hơn."

### 4.4 Quyết định "vững" bằng SPRT — ba trạng thái, sai số kiểm soát

- Mỗi vi kỹ năng (hoặc ý Đúng–sai) gom quan sát tự làm độc lập (một/câu/ngày). H0: p ≤ 0,70 (chưa vững) · H1: p ≥ 0,90 (vững; **0,93** cho ý Đúng–sai). α = 0,10 (khai vững oan), β = 0,20.
- Điểm bằng chứng cộng dồn: đúng **+0,25**, sai **−1,10** (log tỉ số hợp lý với 0,7/0,9). Vượt **+2,08** ⇒ **vững**; dưới **−1,39** ⇒ **chưa vững** (vào trạm/đợt dạy lại); ở giữa ⇒ **chưa đủ bằng chứng** — trạng thái thứ ba được phép nói ra.
- Nghĩa thực tế: 9 lượt đúng liên tiếp, hoặc 13 đúng + 1 sai. Với ý Đúng–sai, **3 câu đủ 4/4** = 12 quan sát ⇒ đủ. Cộng thêm điều kiện bản 2: ≥ 3 ngày khác nhau (Rawson & Dunlosky), ≥ 2 câu chưa gặp từ bài khác, ≥ 2 lượt trôi chảy, không đợt dạy lại mở.
- Thầy xác nhận dạng (bản 2) = cộng thẳng +2,08 cho mọi vi kỹ năng của dạng (ghi sổ, phát lại được).

### 4.5 Hồ sơ mệt theo giờ — của riêng em, gợi ý không khoá

- Chia giờ VN thành 5 khung: trước 18h · 18–20 · 20–22 · 22–24 · sau 24h. Với mỗi em, mỗi khung: tỉ lệ **sai-nhanh (lướt) + sai-khi-chắc** trên lượt tự làm, co Bayes về tỉ lệ của lớp bằng 20 lượt ảo (cùng cách `LUOT_AO` của `ca-nhan-hoa-v2.ts`). Chỉ lưu **số gộp theo khung**, không lưu mốc giờ từng lượt ngoài sổ đã có.
- **Kích hoạt** khi khung hiện tại có tỉ lệ ≥ 2 × khung tốt nhất của em **và** ≥ 20 lượt thật trong khung. Hành động: **đổi thứ tự** trong kế hoạch đã chốt — câu ôn nhẹ và câu đã vững lên trước, câu mới khó của hôm nay xuống cuối; nếu còn D − 3 ≥ 1 ngày thì đề nghị **dời** câu mới khó sang ngày mai (em bấm "Để mai" hoặc "Làm luôn"). Không khoá, không trừ gì, không gửi phụ huynh.
- **Chữ**: *"Giờ này em hay sai nhanh hơn lúc 20 giờ (12 % so 4 %). 5 câu ôn nhẹ trước; 10 câu mới khó để mai, hoặc em bấm Làm luôn."* Số là của em. Không viết "não bộ", không viết "đi ngủ".
- Vì chronotype khác nhau (Carskadon 2011), khung "tốt nhất" của em A có thể là 22–24. Luật chung giờ cho cả lớp là sai.

### 4.6 FSRS bốn mức từ tự tin + thời gian

Hiện FSRS chỉ nhận Again/Good. Bản 3: sai = Again · đúng-chưa-chắc = Hard · đúng-chắc = Good · đúng-chắc-trôi-chảy = Easy. Vẫn một quan sát/ngày, lượt có hỗ trợ không đẩy mốc (giữ `lich-on-fsrs.ts`). Tăng `PHIEN_BAN_FSRS` để dựng lại state.

---

## 5. TRẢI NGHIỆM "ĐƯỢC THẤU HIỂU" — TỪNG TÌNH HUỐNG, TỪNG CÂU CHỮ

| Tình huống | Máy làm | Em thấy (chữ theo bảng từ chuẩn, số là của em) |
|---|---|---|
| Sai 3 câu liền, giao vi kỹ năng chung | Trạm hồi phục theo vi kỹ năng (4.1) | "3 câu em vừa sai đều cần bước cân bằng hệ số. Làm 3 câu nhỏ về cân bằng trước, rồi quay lại. Không mất Máu." |
| Sai 3 câu liền, không có vi kỹ năng chung | Trạm hồi phục theo nhãn nền của câu cuối | "Ba câu ba lỗi khác nhau — nghỉ một nhịp với 3 câu nền của câu cuối." |
| Đúng nhưng chậm | Nhãn "chậm", hẹn lại câu tương tự | "Đúng rồi, nhưng em mất 3 phút 10 giây. Mai gặp một câu tương tự để làm nhanh hơn." |
| Chắc mà sai | Lời giải chủ động ngay, ưu tiên ôn | "Em chắc mà sai — đây là chỗ đáng xem nhất hôm nay. Mở lời giải từng bước." |
| Đúng nhưng chưa chắc | Không tính vững, hẹn sớm | "Đúng. Em nói chưa chắc nên câu này sẽ quay lại sớm cho chắc hẳn." |
| Sai dưới 3 giây | Lướt | "Câu này em bấm nhanh quá, chưa tính. Mai làm lại." |
| Mở app lúc em hay mệt | Đổi thứ tự, đề nghị dời | Mục 4.5 |
| Vắng 3 ngày quay lại | Ngày nhẹ 60 %, thưởng trở lại (đã có) | "Ba ngày em nghỉ, hôm nay nhẹ: 12 câu ôn, không câu mới." |
| Dạng vừa vững | Thẻ mừng, câu mới dư thành tuỳ chọn | "Hiệu suất ester hoá: vững. 11 câu tự làm, 3 ngày, 2 câu lạ đúng. 6 câu còn lại thành Thử sức thêm." |
| Cuối ngày | Nhật ký 3 dòng từ sổ | "Hôm nay 34 câu · 2 vi kỹ năng lên · Thứ Ba em vướng cân bằng, nay 3/3." |
| Thầy một dòng/tuần | Máy gợi từ số, thầy bấm gửi | "Thầy Đỗ Đại Học: tuần này em đóng được 7 lỗi, dạng Hiệu suất đã vững." |

Rào giữ nguyên: không so em với em, không nhãn năng lực, không doạ, không hứa 100 %, đáp án không xuống máy trước khi nộp.

---

## 6. CHU TRÌNH 7 NGÀY "CHẮC 8" — THỜI GIAN LÀ BIẾN SỐ

| Ngày | Việc | Luật |
|---|---|---|
| **0** (ở lớp) | Kiểm tra đầu vào bài (ca kiểm tra, đã có) | Prior P_k từ kết quả của chính em; hiệu ứng tiền kiểm (Richland, Kornell & Kao 2009) |
| **1–2** Tiếp nhận | Vi kỹ năng P < 0,4: Ví dụ minh hoạ + câu kiểm từng bước → bài hoàn thiện → bài đủ. Chọn câu ở vùng P(đúng) 0,75–0,90 | Quy tắc 85 %; ví dụ mẫu rút dần; đan xen dạng trong chuyến |
| **3–4** Củng cố | Câu sai quay lại bằng song sinh; mốc 1–2–3 ngày; SPRT bắt đầu kết luận; chạm tự tin lọc đoán mò | Rawson & Dunlosky; Cepeda |
| **4–5** Đan xen | 40 % lượt là câu **bài cũ cùng chương** trộn vào chuyến, không báo trước dạng | Rohrer et al. 2015 |
| **6** Điều kiện thi | "Đề thử nửa": 14 câu **lạ** (DẠY HỌC bài cũ + bài này), 25 phút, đồng hồ thật, không gợi ý, xáo phương án. Chỉ đo, không phạt | Luyện trong điều kiện thi; đo trôi chảy dưới thời gian thật |
| **7** Ca chốt | 28 câu lạ đúng khung 18 + 4 + 6 (nửa song sinh câu bài, nửa TU LUYỆN cùng ô), 50 phút | Chứng chỉ nếu mô hình ≥ 0,90 **và** điểm ≥ 8,0 |
| **Sau 7** | Chưa đạt: kế hoạch kéo dài **riêng em** — chỉ vi kỹ năng/ý còn thiếu, thời gian ước theo nhịp riêng; hạn lớp không đổi | Mastery learning: chuẩn giữ, thời gian giãn |
| **Duy trì** | FSRS 4 mức; kiểm lại 14 và 30 ngày (đã có) | Cepeda: mốc giãn theo khoảng cần nhớ tới kỳ thi |

Hai bài chạy song song (prompt tick bài) thì mỗi bài giữ chu trình riêng; thể lực chung theo ngân sách phút của em (quyết định số 8 bản 2).

---

## 7. ĐỐI CHIẾU BẢN THAM KHẢO THẦY GỬI — LẤY GÌ, SỬA GÌ

| Bản tham khảo nói | Đánh giá | Bản 3 làm |
|---|---|---|
| DINA + ma trận Q để biết vì sao sai | **Đúng và đáng lấy nhất.** Chi phí thật là gắn Q cho kho; thuật toán rẻ | Mục 4.1; gắn Q trên DẠY HỌC trước, thầy duyệt theo lô; kiểm Q bằng dữ liệu |
| "Lognormal RT-IRT" đo ngập ngừng | **Đúng về hướng**, nhưng không cần IRT: mô hình lognormal độc lập (van der Linden 2006) đủ, hiệu chuẩn từ trung vị lớp | Mục 4.2; đúng-chậm không bị phạt, chỉ chưa tính vững |
| Hồ sơ mệt, "sau 22:30 slip 40 %", cất câu khó đi | **Đúng ý, sai cách**: giờ xấu khác nhau giữa em (chronotype), và cả lớp học dồn 20–24 giờ; khoá là tước tự chủ | Mục 4.5: khung giờ riêng, co Bayes, đổi thứ tự + đề nghị dời, em quyết |
| Ngày 4–5 đan xen bài cũ | **Đúng**, có bằng chứng | Mục 6 |
| Ngày 6 "ép đồng hồ nhanh hơn 20 %" là "khó khăn mong muốn" | Khó khăn mong muốn (Bjork) là cách quãng, đan xen, tự nhớ lại — **không phải** đồng hồ nhanh. Nhưng luyện **đúng điều kiện thi** thì có lý | Mục 6 ngày 6: đồng hồ **thật** của đề thi, không nhanh hơn, không phạt |
| "Ngày 7: cam kết toán học tuyệt đối, không có sai số" | **Sai.** Không mô hình nào làm được; nói thế là hứa điều không chắc với học sinh | Mục 1.1: độ tin ≥ 0,90 + ca chốt thật; chữ hiện có con số độ tin |
| "Bạn đã có 3PL IRT" | **Chưa có.** Bản 2 đã quyết không hiệu chuẩn 3PL vì 1/814 câu đủ mẫu | Giữ: sao thầy + độ khó Wilson + độ tăng P kỳ vọng; thêm β_j thời gian |
| "Em sẽ nổi da gà vì hệ thống đọc vị" | Mục tiêu đúng, nhưng chữ phải nói **sự kiện**, không nói "thầy biết em đã nắm bản chất" (nhãn năng lực) | Mục 5: mọi câu chữ nêu số và bước, không kết luận |

---

## 8. DỮ LIỆU PHẢI GẮN THÊM VÀ GIÁ CỦA NÓ

| Dữ liệu | Có chưa | Cách có | Giá |
|---|---|---|---|
| Kết quả từng ý Đúng–sai | **Có** (`subitem_json`) | Đọc ra, không cần ghi mới | 0 |
| Thời gian làm từng câu game | Chưa | `msLam` trong `/game-v2/answer` (bản 2) | 1 cột, 1 trường |
| Chạm tự tin | Chưa | Hai nút trong `TheCau`/Đảo/Đoàn, 1 cột `tu_tin` | Nhỏ |
| Ma trận Q cho DẠY HỌC ≈ 3 400 câu | Một phần (`kienThuc[]`, `nhan_nen` theo bước) | Máy gợi K_j từ nhãn có sẵn + lời giải từng bước; thầy duyệt theo lô 50 câu/lần, ~15 phút/lô | **Lớn nhất**: ≈ 70 lô, 2–3 tuần rải |
| Thư viện tên lỗi theo dạng | Chưa | 3–6 tên/dạng, viết một lần cùng Q | Vừa |
| β_j thời gian câu | Chưa | Trung vị log-thời gian lớp, tính đêm | 0 công thầy |
| Hồ sơ mệt theo khung giờ | Chưa | Tính đêm từ sổ | 0 công thầy |

Không có Q thì mô-đun 4.1 lùi về P theo dạng của bản 2 — không chờ nhau.

---

## 9. LỘ TRÌNH BẢN 3 (xếp sau GĐ1–2 của bản 2 và GĐ1–2 của prompt tick bài)

| GĐ | Việc | Nghiệm thu |
|---|---|---|
| **3.0 Đo** | Đọc `subitem_json` 83 k dòng: độ chính xác từng ý theo em theo dạng; phân bố thời gian ca thi theo phần; tỉ lệ sai-nhanh theo khung giờ của lớp | Bảng số trước khi viết luật |
| **3.1 Ý + SPRT** | P theo ý Đúng–sai; SPRT ba trạng thái; mốc 0,93; dự báo Phần II phi tuyến | Bảng 3.1 tái lập từ mô phỏng; dự báo so ca chốt cũ |
| **3.2 Thời gian** | `msLam`, β_j, τ_i, nhãn trôi chảy; ngân sách 50 phút vào dự báo; thẻ "đúng nhưng chậm" | Em chậm Phần III được dự báo "chưa kịp", không "chưa biết" |
| **3.3 Tự tin** | Hai nút; bốn ô; FSRS 4 mức; siêu sửa lỗi | Chắc-mà-sai mở lời giải ngay; đúng-chưa-chắc không tính vững |
| **3.4 Q + vi kỹ năng** | Công cụ duyệt Q theo lô cho thầy; truy vết hội; Trạm hồi phục theo vi kỹ năng; thư viện tên lỗi | 3 câu sai chung vi kỹ năng ⇒ đúng tên lỗi, đúng câu nền |
| **3.5 Giờ + chu trình** | Hồ sơ mệt; đổi thứ tự có từ chối; đan xen ngày 4–5; đề thử nửa ngày 6; chứng chỉ bài | Chứng chỉ chỉ cấp khi hai tiêu chí cùng đạt |
| **3.6 Chạy thử** | 1 lớp, 2 bài, so với lớp đối chứng cùng khối theo ca chốt; đo Brier của dự báo; tỉ lệ chứng chỉ ở ngày 7/10/14; nhớ sau 30 ngày; 1 câu "được hiểu" mỗi tuần | Báo cáo số, không báo cảm nhận |

---

## 10. GIẢ ĐỊNH ĐÃ DÙNG

1. Mốc vững: 0,90 cho vi kỹ năng Phần I/III, 0,93 cho ý Đúng–sai; SPRT 0,70/0,90, α 0,10, β 0,20.
2. Trôi chảy ≤ 1,25 × thời gian kỳ vọng riêng; chậm > 2,0 ×; vững đòi ≥ 2 lượt trôi chảy ở 2 ngày.
3. Chạm tự tin không bắt buộc, bỏ qua = Chắc; đúng-chưa-chắc nhân G lên 2.
4. Gán trách khi sai: tỉ lệ nghịch với P_k; xấp xỉ tích độc lập, kẹp [0,02; 0,98].
5. Hồ sơ mệt: 5 khung giờ, co Bayes 20 lượt ảo, kích hoạt khi ≥ 2 × khung tốt nhất và ≥ 20 lượt thật; chỉ đổi thứ tự và đề nghị dời.
6. Chứng chỉ: Monte Carlo 2 000 lần, P(≥ 8) ≥ 0,90, cộng ca chốt ≥ 8,0 trên câu lạ.
7. Đề thử nửa ngày 6: 14 câu, 25 phút, chỉ đo.
8. Ma trận Q gắn trên DẠY HỌC trước; không có Q thì lùi về P theo dạng.
9. Mục tiêu mặc định 8,0; em hoặc thầy đổi 9,0 chỉ đổi hằng số.

## 11. ĐIỀU THẦY CẦN CHỐT

| # | Câu hỏi | Đề nghị |
|---|---|---|
| 1 | "Chắc 8+" hiểu là chứng chỉ độ tin ≥ 90 % + ca chốt đề lạ ≥ 8, **không bao giờ hiện 100 %**? | **CÓ** |
| 2 | Mốc vững ý Đúng–sai 0,93 và P theo ý? | **CÓ** |
| 3 | Thầy bỏ ~15 phút/lô × ~70 lô duyệt ma trận Q cho kho DẠY HỌC (rải 2–3 tuần)? | **CÓ, bắt đầu từ chương đang dạy** |
| 4 | Thêm hai nút Chắc/Chưa chắc sau mỗi câu? | **CÓ** |
| 5 | Đúng-chậm không tính vững nhưng không phạt; hiện thời gian thật của em? | **CÓ** |
| 6 | Hồ sơ mệt theo giờ **gợi ý và đổi thứ tự**, không khoá, không báo phụ huynh? | **CÓ** |
| 7 | Ngày 6 "đề thử nửa" 14 câu 25 phút đồng hồ thật (không nhanh hơn 20 %)? | **CÓ** |
| 8 | Em chưa đạt ngày 7: kéo dài riêng theo nhịp em, hạn lớp không đổi, chuẩn không hạ? | **CÓ** |
| 9 | Thầy gửi 1 dòng/tuần/em do máy gợi từ số (thầy bấm gửi, sửa được)? | **CÓ** |
| 10 | Cho em chọn mục tiêu 9,0 khi đã có chứng chỉ 8+ của ≥ 3 bài? | **CÓ** |
