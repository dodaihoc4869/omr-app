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
