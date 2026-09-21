# Hôm nay thuật toán đổi gì — 21/09/2026

Một trang cho thầy. Mỗi việc hai dòng: dòng đầu "trước → sau", dòng sau một con số thật.
**Không đổi:** hạn nộp, điểm, luật chấm, luật kiểm tra.

**1. Hạn nộp buổi trưa**
Trước: bài hạn 12:00 vẫn đếm cả tối ngày hạn để xếp chặng, nên chặng cuối mở lúc 00:00 ngày hạn và em chỉ còn buổi sáng để làm → Sau: chỉ đếm những tối còn trọn trước hạn, chặng cuối mở chậm nhất tối hôm trước.
Số thật: bài giao 20:30 ngày 21/09, hạn 12:00 ngày 24/09 — từ 4 buổi tối xuống 3 buổi tối.

**2. Em mở bài muộn không bị dồn thêm**
Trước: em mở bài muộn hơn có khi nhận NHIỀU câu hơn em mở sớm (vô lý) → Sau: mở muộn không bao giờ nhận nhiều hơn mở sớm; câu bắt buộc chung vẫn đủ.
Số thật: bài 113 câu, hạn 12:00 ngày 24/09, em mở tối 21 → 22 → 23: cũ 36 → 60 → 30 câu, mới 36 → 24 → 12 câu.

**3. Câu bắt buộc đúng bậc của em**
Trước: câu bắt buộc chung giống hệt mọi em và luôn là câu mức thấp nhất của dạng, kể cả em đã ổn ở bậc Hiểu hay Vận dụng → Sau: mỗi dạng vẫn có ít nhất một câu bắt buộc, nhưng em đã ổn thì nhận câu cùng dạng đúng bậc của em; tổng số câu không đổi.
Số thật (mô phỏng 200 em giả): bài 113 câu, mở ngay tối giao — số em nhận ít nhất một câu đúng bậc từ 40 % lên 99 %.

**4. Thử thách riêng hôm nay (lượt chiều)**
Trước: em chỉ nhận lời nhắn chung, chưa có việc cụ thể riêng cho từng em → Sau: em có tín hiệu học gần đây (làm bài hôm qua hoặc mấy ngày qua, không vắng) nhận một thẻ 3–8 câu chọn theo dạng của em, không bắt buộc, không hạn; có bước xem trước, đọc xong mới nộp.
Số thật (lượt chạy thử 21/09): lấy 60 em trong 134 em đủ điều kiện (265 em có thẻ); 52 lời đạt, 8 lời bị máy loại.

**5. Giao thêm bài cho con (phụ huynh)**
Trước: phụ huynh có 4 đường giao bài khác nhau, tự chọn → Sau: một nút, máy tính số câu theo con (ôn đến lịch → dạng con vấp → câu từng sai); tối đa 3 lượt mỗi ngày; con còn việc bắt buộc, gói trước chưa xong, hoặc ngoài 05:00–22:30 thì từ chối và không mất lượt.
Số thật: tổng giao thêm tối đa 16 câu mỗi ngày, lượt đầu 4–10 câu; kiểm 6.000 tình huống, 0 lần vượt.

*Việc nào đã lên máy chủ thật thì Boss hoặc Code 3 báo riêng; tệp này chỉ nói thuật toán đổi gì. "Em giả" là mô phỏng, con số tuyệt đối chỉ để so trước và sau.*

## Tình trạng trên bản sống (Boss ghi, 21/09 13:13)
| Việc | Đã sống chưa |
|---|---|
| 1.3 · Lịch chặng khi hạn rơi buổi trưa | ĐÃ SỐNG từ trưa 21/09 (máy chủ); em đã mở bài trước đó được dời lịch sớm hơn cho các chặng chưa mở |
| 1.4 · Trần số câu khi hạn ngắn | ĐÃ SỐNG từ trưa 21/09 |
| Lõi đúng bậc | ĐÃ SỐNG cho em mở bài từ 12:07 ngày 21/09; em mở trước đó giữ bộ cũ |
| Thử thách riêng hôm nay | Máy chủ + thẻ ở app học sinh ĐÃ SỐNG; lời mời đầu tiên được nộp tối 21/09 sau khi Boss đọc bản xem trước |
| Giao thêm bài cho con (phụ huynh) | CHƯA — thuật toán đã xong và soát; chờ lệnh máy chủ (Code 3) và nút ở app phụ huynh (Code 2) |

## Đợt chiều 21/09 · thuật toán đổi thêm (thầy chốt 13:36–14:13)
Cùng cách đọc: dòng đầu "trước → sau", dòng sau một con số thật. Việc nào đã sống thì Boss ghi vào bảng trên.

**6. Thú lên cấp theo NGÀY HỌC ĐỀU**
Trước: thú ăn hết EXP em kiếm ngay, em chăm cày một buổi tối lên cấp 7 → Sau: mỗi ngày thú ăn tối đa 200 EXP khi em đạt nhiệm vụ ngày (120 khi làm ≥ 4 câu, 0 khi không học); EXP dư nằm trong ống nghiệm.
Số thật: cấp 10 từ 1 630 EXP thành 4 200 EXP nên sớm nhất ngày 21; cấp 120 sớm nhất ngày 1 200. Đã chuyển 102/102 hồ sơ, cấp cao nhất sau chuyển là 2, không em nào tăng cấp.

**7. "Đạt nhiệm vụ ngày" cần làm ĐÚNG (từ 22/09)**
Trước: làm 4 câu sai hết vẫn được tính đạt → Sau: cần đúng ít nhất một nửa số câu tối thiểu, vẫn giữ luật "có câu tới hạn ôn thì phải ôn".
Số thật: mức tối thiểu 4 câu ⇒ phải đúng ≥ 2 câu; đạt là nguồn mảnh khiên duy nhất nên luật này chặn cách lấy khiên bằng bấm bừa.

**8. Rút câu thần thú: kho rộng, không lặp**
Trước: chỉ mở dạng chính em có bằng chứng, câu sai quay lại sau 20 phút → Sau: kho là mọi dạng lớp đã học; mỗi lượt ≥ 4 câu chưa từng gặp, tối đa 2 câu cũ; câu sai quay lại sớm nhất hôm sau; sai 3 lần thì đổi câu khác; câu đúng nghỉ 30 ngày; không bao giờ vượt bậc của em + 1.
Số thật: kho 15 359 câu; 3 lượt sẵn, tối đa 6 lượt = 36 câu mỗi ngày (thêm lượt khi xong chặng bài tập về nhà, khi đạt nhiệm vụ ngày, và Lượt trùm khi đúng ≥ 80 % trong ≥ 12 câu).

**9. EXP trong game và Đoàn Hộ Tống cân lại**
Trước: chỉ chơi game đã kiếm trên 200 EXP một ngày, việc học thật không còn nghĩa với cấp → Sau: game góp tối đa 120 EXP mỗi ngày; nấc dạng 20/40/40 thành 10/20/30; thắng chặng Đoàn 5/10/15 EXP (chặng sau một nửa); vỡ giáp trùm +3 mỗi trùm.
Số thật: EXP học tập không bị trần; bảng giá học tập từ 22/09: đạt nhiệm vụ ngày 20 → 80, xong chặng đúng nhịp 10 → 20, nộp đúng hạn 15 → 30. Em yếu mà chăm từ 165 lên 242 EXP/ngày, tới cấp 10 từ ngày 26 về ngày 21.

**10. Chặng bài tập về nhà: đúng nhiều thì được mở sớm**
Trước: chặng kế chỉ mở 00:00 hôm sau, em chăm làm xong không có đường làm tiếp → Sau: đúng từ 80 % chặng vừa xong thì mở sớm đúng 1 chặng kế trong ngày; hạn nộp không đổi.
Số thật: đúng 9/10 câu ⇒ được mở sớm; đúng 7/10 ⇒ chặng kế vẫn mở 00:00 ngày mai và em được mời sang Đảo thần thú luyện thêm.

**11. "Dồn về đích": việc chưa xong hôm trước hiện đủ, tính theo giờ**
Trước: chặng lỡ chỉ hiện đúng một chặng cũ kèm chữ nhỏ "đã trễ nhịp", không ai dồn việc về trước hạn → Sau: sổ nợ theo ngày; mỗi buổi tối xếp tối đa 2 chặng / 30 câu / 60 phút, nợ trước rồi tới chặng hôm nay, xong trước hạn nộp, không xếp sau 22:30 và không xếp vào giờ có ca kiểm tra; không kịp thì nói thật và chỉ rút phần làm thêm, lõi giữ nguyên.
Số thật: "còn 46 giờ tới hạn 12:00 Thứ Sáu, 3 chặng, 41 câu ⇒ tối nay 2 chặng (bắt đầu muộn nhất 21:48), tối mai 1 chặng"; qua hạn vẫn làm nốt và ghi "nộp trễ".
