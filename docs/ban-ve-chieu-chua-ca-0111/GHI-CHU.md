# Chiếu chữa bài sau ca kiểm tra — đặc tả 7 mục + bản vẽ (01/11/2026, chờ thầy duyệt)

Thầy 01/11: «Khi ca kiểm tra kết thúc, có nút chiếu lên bảng, bấm nút này màn chiếu chuẩn xuất hiện chiếu câu sai từ khó đến dễ, từ sai nhiều tới sai ít để tôi
chữa bài cho hs, hiện tên hs làm sai ở góc chỗ chiếu tên nhé. Vẽ tôi duyệt rồi build.»

Ảnh: `anh/` (Chromium thật). Màn app là `KetThucCa` THẬT + nút mới; màn chiếu là tờ chiếu THẬT (`taoHtmlMayChieu`) + nguyên mẫu thẻ tên (`nguyen-mau.js`).
Chụp lại: `npm run build && node docs/ban-ve-chieu-chua-ca-0111/chup.mjs`.

## 1. Mục tiêu + ai dùng
- Thầy, ngay khi ca vừa kết thúc, chữa bài trên lớp. Một nút, không phải chọn gì.
- Câu khó và câu nhiều em sai lên trước. Em sai câu nào thấy tên mình ở góc, biết phải nghe kỹ câu đó.

## 2. Bố cục
**App thầy — màn «Ca đã kết thúc»** (`01-app-*`)
- Nút chính «Chiếu chữa bài · N câu» ở đầu màn.
  - Máy tính: bên phải, cạnh «Xem báo cáo chi tiết».
  - Điện thoại: nút đầu tiên, rộng hết hàng.
- Dưới nút có một dòng nhỏ ghi luật xếp.

**Màn chiếu** (`03`–`07`): đúng khuôn tờ «Chiếu lên bảng», mỗi trang một câu.
- Trái 2/3: đề trên nền giấy.
- Cột phải 1/3:
  - Góc trên (chỗ thẻ tên em lên bảng): thẻ «21/32 em chưa đúng câu này» + tên em (hai chữ cuối), 2–3 cột tuỳ số em.
  - Phần dưới để trống, làm chỗ thầy viết khi chữa.
- Đầu đề thêm chip mức độ (Vận dụng / Hiểu / Biết) để thầy thấy vì sao câu đứng ở đó.
- Thanh dưới:
  - Hiện «Câu 1/9» và chữ «CHỮA BÀI».
  - Giữ nguyên các phím: G Giải, T Thống kê lớp, B Bút, Tab Tổng quan, ? Phím, Cài đặt (nền máy chiếu, cỡ chữ).
  - Bỏ nút «Lên bảng».
  - Thêm phím **H «Ẩn tên»** (bấm lại thì hiện).
- Tên em màu trung tính, không chữ hay màu đỏ (luật tế nhị trước lớp).

**Luật xếp**
1. Mức độ khó → dễ: Vận dụng → Hiểu → Biết.
2. Cùng mức: số em sai nhiều → ít.
3. Bằng nhau: số câu nhỏ trước.
- Chỉ chiếu câu có ít nhất 1 em chưa đúng. Bỏ trống tính là chưa đúng.
- Phần II: sai ít nhất 1 ý là chưa đúng.

## 3. Trạng thái
| Trạng thái | Nút | Dòng dưới nút | Ảnh |
|---|---|---|---|
| Có câu sai | «Chiếu chữa bài · 9 câu» | «Xếp khó → dễ, cùng mức thì sai nhiều → ít» | `01-*` |
| Cả lớp đúng hết | mờ | «Cả lớp đúng hết · không có câu cần chữa» | `02-…-dung-het` |
| Máy chưa có đề có đáp án của ca | mờ | «Máy này chưa có đề có đáp án của ca» | `02-…-khong-de` |
| Còn em đang làm / được làm lại | bấm được | «2 em còn đang làm — chiếu lúc này các em ấy thấy đề và lời giải» | `02-…-con-em` |
| Đang tổng hợp kết quả | mờ | «Đang tổng hợp…» | — |

- Câu thiếu nội dung trên máy: trang ghi «Nội dung câu hỏi N» như tờ chiếu hiện nay, vẫn có tên em.
- Mất mạng: không ảnh hưởng, vì mọi thứ đã có trên máy thầy.

## 4. Dữ liệu — không thêm lệnh máy chủ
- **Ai sai câu nào:** bảng chấm từng câu của từng em đã có trên máy thầy (`taoChiTietCau` → `ChiTietCauRow{qid, phan, soCau, mucDo, dapAnChon, dapAnDung, dungSai}`). Cùng nguồn với khối «Câu cả lớp sai nhiều nhất».
- **Nội dung câu và lời giải:** ngân hàng có đáp án của ca trên máy thầy (`teacherBank` → `mergeKeepAnswers`).
- **Thống kê (phím T):** `thongKeLopCau(phan, bài làm của ca)`, hàm đã có.
  - Phần I: tỉ lệ chọn từng phương án.
  - Phần II: tỉ lệ đúng từng ý.
  - Phần III: đáp số sai hay gặp.
- **Ca đề riêng:** gộp mọi câu đã ra. Mỗi câu chỉ đếm em được giao câu đó («n/số em làm câu này»).
- **Tên:** lấy từ danh sách ca. Tờ chiếu chỉ in hai chữ cuối; hai em trùng thì in đủ ba chữ.

## 5. Ngoại lệ
- Hơn 30 em sai một câu: hiện 29 tên + «+n em».
- Câu dài, có ảnh hoặc bảng: dùng bộ đo bố cục sẵn có của tờ chiếu.
- Bấm nút hai lần: chỉ mở một tờ.
- Máy yếu: tờ chiếu nạp lười (mảnh riêng, đã có). Màn kết thúc ca không nặng thêm.
- Điểm chưa công bố: vẫn chiếu được. Tên trên bảng là thầy chủ động cho xem, phím H ẩn ngay.

## 6. Chi phí máy chủ
- 0 lượt đọc/ghi D1 mới, 0 vòng chờ: tờ dựng hoàn toàn trên máy thầy.
- Đáp án và lời giải chỉ nằm trên tờ chiếu ở máy thầy, hiện khi thầy bấm G. Không xuống máy học sinh.

## 7. Nghiệm thu đo bằng máy
- `tests/chieu-chua-ca-0111.test.ts`:
  - luật xếp; chỉ câu có em sai; bỏ trống = chưa đúng; Phần II sai 1 ý;
  - đếm theo câu với ca đề riêng; tên hai chữ cuối và trùng tên; quá 30 em;
  - tờ chiếu có thẻ tên, «Câu n/N», phím H, không có «Lên bảng».
- `tests/ket-thuc-ca-nut-chieu-0111.test.tsx`: 4 trạng thái nút.
- Cổng: `npm run build && node scripts/kiem-toc-do-tai.mjs` 0 đỏ; `npm run kiem:mau-giu` 0.
- Ảnh Chromium: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px. Bản vẽ này đã soát: `SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích bấm nhỏ`.
