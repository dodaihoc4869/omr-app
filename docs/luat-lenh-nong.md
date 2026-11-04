# Luật các lệnh nóng của máy chủ

MÁY CHỦ MỚI — bốn lệnh nóng lúc thi (MAY-CHU-MOI.md).

BA LUẬT KHÔNG ĐƯỢC PHÁ:
  1. Mỗi endpoint dùng 1–3 câu truy vấn. Trần D1 miễn phí là 50 câu một lượt
     gọi Worker, và vòng lặp truy vấn theo số em là đường chắc chắn chạm trần.
  2. Gói đề KHÔNG nằm trong D1 (trần 2 MB một dòng, kho thầy đã 2,1 MB) —
     nằm ở R2, D1 chỉ giữ khoá đối tượng.
  3. Lệnh của HỌC SINH không đòi mã bí mật (giống Apps Script hiện nay);
     lệnh của THẦY thì đòi. Không nới luật này ở bất kỳ đâu.
