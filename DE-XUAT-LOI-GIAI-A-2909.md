# PHƯƠNG ÁN A — Kho lời giải duyệt sẵn (bản tính kĩ)

29/09/2026 · CHỜ THẦY CHỐT (chưa build vào app hay máy chủ). Tiếp nối `DE-XUAT-HOI-BAI-FILE-GIAI-2809.md`.

Phạm vi: **chỉ Đúng/Sai, trắc nghiệm, trả lời ngắn. Bỏ tự luận** (thầy chốt 29/09).

Xem thử 15 hồ sơ do máy soạn: https://claude.ai/artifact/S4kqYzjU9eiWgXSR5wX4dh (riêng tư). Bộ thử nằm ở `docs/loi-giai-a/`.

## 0. Tóm tắt con số

| Mục | Số | Nguồn |
|---|---|---|
| Kho hiện có | 268 đề · 15.359 câu | rà soát kho 28/09 (`docs/ra-soat-hien-thi-de-2809/tom-tat.json`) |
| Cần soạn, sau khi bỏ tự luận và gộp câu trùng | **≈ 8.400 câu** (cận trên 12.100) | suy từ mẫu 799 câu thật; số chính xác chờ quét toàn kho |
| Máy soạn, chế độ lô | **68 giây/câu** · ≈ 20 nghìn token/câu | đo 29/09, 7 câu kho thật |
| Máy soạn, từng câu lẻ | 190 giây/câu · ≈ 78 nghìn token/câu | đo 29/09, 8 câu thí nghiệm |
| Qua đủ khoá tự động | **15/15** · đáp án khớp 15/15 · số khớp 15/15 | `kiem-ho-so.cjs` |
| Thời gian máy cho cả kho | ≈ 159 giờ nếu chạy 1 luồng. Với 4 phiên song song ≈ 40 giờ ≈ **2 ngày** (cận trên ≈ 3 ngày) | tính ở mục 4 |
| Câu mới nạp lên | 1 đề 40 câu có sẵn file giải sau **≈ 9 phút** (4 phiên) hoặc ≈ 35 phút (1 phiên) | tính ở mục 4 |
| Chi phí API | 0 đ, vì chạy trên máy thầy bằng gói Claude đang dùng | quyết định ngày 21/09 |

## 1. Chạy thử (bằng chứng)

**Đợt 1: 8 câu thí nghiệm của thầy, mỗi câu một phiên, soạn từ đầu.**
- 8/8 qua mọi khoá.
- Thời gian 157–231 giây/câu.
- Máy **tự phát hiện đủ 3 chỗ tranh luận** thầy đã biết: câu 80 ý (2), câu 8 ý b, câu 50.
- Máy thêm 2 chỗ mới:
  - Câu 34 ý d: "hao hụt tối đa 6%" thì thể tích đúng ra phải là "ít nhất 10,4 mL".
  - Câu 33: đề gọi ethyl acetate "không phân cực" là chưa chính xác.

**Đợt 2: 7 câu kho thật, một phiên soạn liền cả lô, dùng lời giải chữ có sẵn làm điểm xuất phát.**
- Gồm 3 trắc nghiệm, 2 Đúng/Sai, 2 trả lời ngắn; 2 câu có hình.
- 7/7 đạt ngay lần đầu, không phải sửa lần nào.
- Thời gian 53–91 giây/câu, trung bình 68 giây. Câu có hình chậm hơn khoảng 20 giây.
- Không câu nào nghi đáp án sai.
- Máy chỉ ra **lỗi hiển thị có sẵn trong kho** ở 5/7 câu:
  - "cồn 90o" thay cho 90°;
  - "(0C)" thay cho (°C);
  - đề còn sót "HẾT – Thí sinh không sử dụng tài liệu…";
  - bảng bị lặp lại dưới dạng chữ;
  - **hình bộ đun hồi lưu vẽ nước vào ở đầu trên**, ngược quy tắc.

**Khoá tự động đã thử bằng hồ sơ cố tình sai.** Đổi đáp án, sửa một con số, chèn `<script>`: cả 3 đều bị chặn.

## 2. Quét thử mẫu 799 câu thật (`docs/loi-giai-a/quet-kho.mjs --sao-luu …`)

- **Tự luận: 12 câu, đã bỏ.** Còn 787 câu thuộc phạm vi: 264 trắc nghiệm, 173 Đúng/Sai, 350 trả lời ngắn.
- **Câu trùng nội dung: 352/787 (45%)**, do cùng một câu nằm ở nhiều đề (tờ dạng bài `DB-…` chép lại câu của đề khác). Còn **435 câu duy nhất**.
- **Lời giải chữ có sẵn: 100%.** Trạng thái "khớp đáp án tác giả": 727/799. Các trạng thái khác (thầy nên xem): `soan-lai` 24, `khong_co_dap_an_de` 24, `lech` 10.
- **Có hình: 6,6%.** Có tính toán: 45%.
- **218 dạng bài.** 619 câu thuộc dạng có từ 3 câu trở lên, dùng chung khuôn được.
- **Tầng soạn** (mục 5): gọn 40, đủ 186, sâu 209.
- **Lưu ý:** mẫu này là 799 câu từng phải sửa định dạng, nên nghiêng về câu dài và câu tính toán. Số thật chờ **quét toàn kho**: thêm token Cloudflare chỉ đọc, rồi chạy `node docs/loi-giai-a/quet-kho.mjs --cloudflare`.

## 3. Dây chuyền A: từ lúc nạp câu đến lúc học sinh xem

1. **Nạp đề.** Có hai đường, cả hai đều tự đưa câu vào hàng việc soạn:
   - **Máy thầy** ("Nạp đề mới" → `nap-de-may-chu-moi.py`): nối thêm bước cuối "soạn lời giải" ngay sau khi đẩy lên. Nạp xong là máy soạn luôn.
   - **App** (`luuDe` / `/kho/day`): cả hai đều đi qua **một điểm ghi duy nhất** là `dayDeKho` (`server/src/index.ts:2099–2163`). Thêm một móc chỉ-thêm ở đó để ghi `loi_giai_viec` cho câu **mới hoặc đổi nội dung** (so dấu vân tay), bỏ qua tự luận. Máy thầy quét hàng việc 30 phút một lần.
2. **Gộp trùng.** Hồ sơ lưu theo **dấu vân tay nội dung** (`giai/<bam>.json`). Câu trùng ở đề khác dùng chung file, không soạn lại.
3. **Soạn theo lô.** Mỗi phiên nhận 10–20 câu **cùng chương** (đọc bộ chìa khoá một lần) và nhóm theo dạng bài. Hồ sơ đầu tiên đã duyệt của một dạng làm ví dụ mẫu cho các câu cùng dạng.
4. **Bộ kiểm 6 khoá** chạy ngay trên máy thầy. Hồ sơ trượt thì máy sửa tối đa 2 lần, vẫn trượt thì đẩy về cho thầy.
5. **Cờ phân loại.** Mỗi ghi chú của máy gắn một trong ba loại:
   - `dapAn`: nghi đáp án hoặc có chỗ tranh luận. **Chỉ loại này bắt thầy phải xem.**
   - `hienThi`: lỗi hiển thị trong kho. Tự vào danh sách "sửa kho", không chặn duyệt.
   - `loiDe`: đề in sai.
6. **Duyệt.** Cách duyệt do thầy chọn ở mục 6.
7. **Học sinh.**
   - Sau khi nộp và điểm được công bố, bấm "Lời giải từng bước". Khung chạy trong `iframe sandbox`.
   - Câu chưa duyệt thì vẫn hiện lời giải chữ đang có, nên không ai bị thiếu lời giải.
   - Thầy sửa đề thì hồ sơ tự hết hiệu lực và câu vào lại hàng việc.

## 4. Thời gian hoàn thành cả kho

Công thức: **giờ máy = (số câu duy nhất × 68 giây) ÷ số phiên song song**. Máy thầy chạy 20 giờ/ngày.

| Số câu duy nhất | 1 phiên | 2 phiên | 4 phiên |
|---|---|---|---|
| 8.400 (tỉ lệ trùng như mẫu) | 159 giờ ≈ 8 ngày | 79 giờ ≈ 4 ngày | **40 giờ ≈ 2 ngày** |
| 12.100 (cận trên, trùng chỉ 20%) | 229 giờ ≈ 11,4 ngày | 114 giờ ≈ 5,7 ngày | 57 giờ ≈ 3 ngày |

- **Giới hạn thật là hạn mức gói Claude** trên máy thầy: khoảng 165–240 triệu token cho cả kho. Tôi chưa đo được hạn mức gói của thầy. **Ngày đầu chạy thử 4 phiên sẽ biết tốc độ thật.** Vì hàng việc xếp theo ưu tiên (mục 5.6), dù chạy chậm thì phần đáng giá nhất vẫn xong trước.
- **Câu mới:** 1 đề 40 câu, sau khi gộp trùng còn khoảng 30 câu mới, mất ≈ 35 phút (1 phiên) hoặc ≈ 9 phút (4 phiên).
- **Tham khảo:** nếu có lúc cần dùng API, ước tính 0,1–0,2 USD/câu. Tôi không khuyên dùng, vì trái quyết định ngày 21/09.

## 5. Tối ưu để mỗi câu đạt hiệu quả cao nhất

1. **Soạn theo lô:** 190 → 68 giây/câu (nhanh gấp 2,8 lần), 78 → 20 nghìn token/câu (ít hơn 4 lần). Số đo thật.
2. **Gộp câu trùng:** bớt 45% số câu phải soạn (theo mẫu).
3. **Nâng cấp lời giải có sẵn** thay vì giải lại. 100% câu đã có lời giải, 91% đã khớp đáp án tác giả. Nhờ vậy nhanh hơn, và đáp án được kiểm hai lần.
4. **Ba tầng soạn:**
   - **Gọn** (mức biết): dựng 2 bước, 1 câu tương tự.
   - **Đủ** (hiểu, vận dụng): dựng 3–5 bước, 2 câu tương tự.
   - **Sâu** (vận dụng tính nhiều bước, hoặc đáng chữa 2 sao): thêm chuỗi tính, phòng thí nghiệm nếu có.
5. **Khuôn theo dạng bài:** 218 dạng. Các câu cùng dạng soạn liền nhau, giọng và cách giải thống nhất.
6. **Thứ tự ưu tiên trong hàng việc:**
   1. câu trong đề sắp giao hoặc đang giao;
   2. câu học sinh sai nhiều (`ban_do_sai`);
   3. khối 12;
   4. đáng chữa 2 sao;
   5. vận dụng → hiểu → biết.
7. **Bộ chìa khoá theo chương:**
   - Ester đã có. Còn 20 chương.
   - Mỗi chương máy soạn một bộ 5–7 chìa khoá, dựa trên mã dạng bài có sẵn. Thầy duyệt khoảng 10 phút một chương, trước khi chạy chương đó.
   - Phòng thí nghiệm dùng lại 6 phòng hiện có, rồi thêm dần phòng dùng chung (cân bằng hoá học, pin điện – điện phân…) cho các chương đông câu. Câu chưa có phòng hợp thì vẫn đủ 4 nhịp, chỉ không có nút mở phòng.
8. **Hồ sơ không chép đề:** tham chiếu mã câu và dấu vân tay, nên mỗi file chỉ còn 5–9 KB. Đề có hình không bị nhân đôi.
9. **Lợi ích phụ:** mỗi lượt soạn đồng thời **soát lỗi kho**. Đợt 2 bắt được lỗi hiển thị ở 5/7 câu.

## 6. Cách duyệt (thầy chọn)

| Cách | Thời gian của thầy | Học sinh thấy file mới khi nào |
|---|---|---|
| (1) Duyệt từng câu cả kho | ≈ 58 giờ (≈ 25 giây/câu) | Khi thầy duyệt tới câu đó |
| **(2) Duyệt theo đề lúc giao** (khuyên dùng lúc đầu) | ≈ 15 phút mỗi đề 40 câu | Ngay với đề thầy giao; đề khác hiện lời giải chữ cũ |
| (3) Tự duyệt hồ sơ "sạch", thầy xem mẫu | ≈ 3 giờ xem mẫu 5% mỗi chương, cộng các cờ `dapAn` (ước ≈ 5% số câu) | Gần như ngay |

"Sạch" nghĩa là: qua 6 khoá, không có cờ `dapAn`, và lời giải cũ đã "khớp". Tôi khuyên bắt đầu bằng cách (2). Sau 2 chương mà mẫu kiểm không phát hiện lỗi nào, thầy có thể bật thêm cách (3).

## 7. Việc build khi thầy chốt (≈ 3–4 ngày làm)

1. **Khuôn và bộ kiểm chính thức:** lấy từ bộ thử, thêm cờ phân loại, bỏ việc chép đề, và hiển thị qua bộ định dạng công thức có sẵn của app (`chem-format`). ≈ 0,5 ngày.
2. **Máy chủ:** ≈ 1 ngày.
   - Bảng `loi_giai` và `loi_giai_viec` (migration chỉ-thêm), R2 `giai/<bam>.json`.
   - Móc ở `dayDeKho`.
   - Ba lệnh `/hs/loi-giai`, `/gv/loi-giai/cho-duyet`, `/gv/loi-giai/duyet`, gắn vào cổng công bố.
3. **App học sinh:** nút "Lời giải từng bước" ở màn Hỏi bài và màn Câu cần chữa. ≈ 0,5 ngày.
4. **App thầy:** màn duyệt theo đề (lướt, duyệt cả lô, lọc theo cờ) và danh sách "sửa kho". ≈ 0,5–1 ngày.
5. **Máy thầy:** ≈ 0,5 ngày.
   - Kĩ năng "soạn lời giải".
   - Chạy theo lô và song song.
   - Nối vào script nạp đề.
   - Hẹn giờ quét hàng việc.
6. **Bộ chìa khoá 20 chương:** máy soạn khoảng 1 ngày; thầy duyệt 20 × 10 phút.

Sau đó chạy cả kho mất 2–3 ngày máy (4 phiên). Học sinh thấy dần các đề đã duyệt.

## 8. Thầy cần chốt

1. **Cách duyệt:** (2) như tôi khuyên, hay (1), hay (3)?
2. **Số phiên song song trên máy thầy** (2 hay 4), và máy có bật liên tục không?
3. **Thứ tự chương:** khối 12 theo số câu (Ester – lipid, Carbohydrate, Hợp chất chứa nitrogen…), hay theo lịch dạy?
4. **Token Cloudflare chỉ đọc**, để quét toàn kho ra số thật trước khi chạy. Hướng dẫn đã gửi trong phiên 29/09.
