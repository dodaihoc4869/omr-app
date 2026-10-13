# Bản vẽ Hỏi Thầy: đề chuẩn và câu trả lời có cấu trúc (13/10)

Thầy yêu cầu: "Tôi muốn giao diện đề chuẩn theo hiển thị của đề bài. Phần hướng dẫn lời giải phải hiển thị khoa học hơn, ngắt câu tô đậm, bạn hãy thiết kế hiển thị câu trả lời thật xịn xò khoa học thân thiện sao cho hs đọc cái hiểu ngay".

Đây là bước 2 của quy trình 4 bước (`docs/quy-trinh-4-buoc-1310.md`). Chưa sửa `src/`. Thầy duyệt ảnh rồi mới dựng.

- Bản vẽ: `hoi-thay.html`. Nạp đúng CSS thật của app (`m3-theme.css`, `loi-giai.css`, `hop-hoi-thay.css`); phần mới chỉ dùng biến M3 có sẵn.
- Ảnh: `anh/01…08`, chụp bằng `node scripts/chup-ban-ve-hoi-thay-1310.mjs`. Soát: 0 lỗi trang, 0 tràn ngang, 0 đích chạm < 44 px.

| Ảnh | Nội dung |
|---|---|
| 01, 03 | Câu trả lời ngắn (câu amine thầy gửi), điện thoại dọc, tối và sáng. Sau khi Thầy trả lời, đề gập thành một dòng. |
| 02 | Như 01 nhưng mở đề, hiện toàn bộ câu trả lời. |
| 04 | Trắc nghiệm: đề chuẩn có 4 phương án A–D; em hỏi vì sao một phương án sai. |
| 05 | Đúng/Sai khi em ĐANG LÀM: Thầy chỉ gợi hướng (nhãn "Gợi hướng"), không nói đáp án. |
| 06 | Điện thoại ngang. |
| 07, 08 | Máy tính, sáng và tối. |

## Đặc tả 7 mục

### 1. Mục tiêu sư phạm và người dùng
Học sinh hỏi Thầy về một câu và đọc là hiểu ngay. Thứ tự đọc:
1. Ý chính: một câu, cụm quan trọng tô đậm, đáp số làm nổi.
2. Tối đa 4 bước ngắn, mỗi bước có tên in đậm.
3. Bảng nhanh, khi phải so nhiều chất hoặc nhiều số.
4. Ghi nhớ: một câu kiến thức cốt lõi.
5. Hai nút "hỏi tiếp" gợi ý câu hỏi kế.

Đề trong hộp hiển thị y như màn làm bài:
- "Câu n." đậm màu nhấn, cỡ chữ 17;
- công thức hạ chỉ số;
- phương án A–D và ý a–d trình bày như phiếu.

### 2. Bố cục
- **Điện thoại dọc:** thẻ nảy từ đáy, cao 92%.
- **Ngang và máy tính:** hộp giữa màn. Trên máy tính đề xuất rộng 640 px thay vì 560 px, để bảng không chật.
- **Thứ tự trong hộp:** đầu hộp → đề → hội thoại → ô nhắn.
- **Đề:**
  - mở sẵn khi em chưa hỏi;
  - Thầy trả lời câu đầu thì đề tự gập thành một dòng (tóm tắt đề + loại câu), chạm để mở lại.

### 3. Trạng thái
- Chưa hỏi: đề mở, ô nhắn.
- Đang trả lời: ba chấm như hiện nay.
- Có trả lời: dạng có cấu trúc như ảnh 01–04.
- Gợi hướng (em đang làm): nhãn "Gợi hướng". Ý chính và các bước chỉ hướng tư duy; KHÔNG có đáp số, KHÔNG có bảng kết luận đúng/sai.
- Ngoài phạm vi, lỗi, hết lượt: giữ như hiện nay.
- Câu trả lời cũ (dạng chữ thường, trước bản này): hiện thành đoạn như hiện nay.

### 4. Dữ liệu (API thật: `/hs/hoi-tro-ly`, `server/src/hoi-tro-ly.ts`)
- **Lược đồ JSON trả về của Gemini** đổi từ `{lienQuan, traLoi}` thành:
  - `lienQuan`;
  - `yChinh` (≤ 160 ký tự);
  - `buoc[]`: 0–4 phần tử `{ten ≤ 40, chu ≤ 240}`;
  - `bang?`: `{cot[2–3], dong[] ≤ 8}`;
  - `ghiNho?` (≤ 160 ký tự);
  - `hoiTiep[]`: ≤ 2 câu, mỗi câu ≤ 60 ký tự.
- **Định dạng chữ:**
  - `**…**` tô đậm, tối đa 4 cụm;
  - `==…==` làm nổi, tối đa 1 cụm (đáp số);
  - máy chủ cắt độ dài và bỏ mọi HTML.
- **Máy chủ trả về:**
  - `traLoi`: chuỗi phẳng, để các bản app cũ vẫn chạy;
  - `cauTruc`: JSON đã làm sạch.
- **Bảng `hoi_tro_ly`:** thêm cột chỉ-thêm `cau_truc_json`.
- **Chế độ đang làm:** lời dặn mô hình cấm đưa đáp số vào `yChinh`, `ghiNho` và `bang`; máy chủ kiểm lại bằng chữ đáp án của câu.
- **Đề:** dùng `cau` đã có (`de`, `y`) và thêm `phan` (loại câu). Dựng bằng `ChemText` và tách dòng theo ý, như `DeCau` ở màn làm bài, thay cho HTML thô.

### 5. Ngoại lệ
- Mô hình trả thiếu trường: hiện phần có được. Không có cấu trúc thì hiện chữ phẳng.
- Bảng rộng hoặc công thức dài: cuộn ngang trong bảng, không tràn hộp.
- Câu có hình: đề hiện hình như màn làm bài.
- Chậm quá 30 giây hoặc mất mạng: báo lỗi như hiện nay.
- Bấm "hỏi tiếp" khi đang gửi: nút bị khoá.
- Hết lượt: ẩn các nút "hỏi tiếp".

### 6. Chi phí máy chủ
- Không thêm lệnh D1: vẫn một lượt ghi, chỉ thêm 1 cột.
- Không thêm vòng chờ.
- Token trả về tăng khoảng 30–60% vì JSON có cấu trúc. Vẫn dùng `gemini-3.5-flash-lite`, mỗi lượt khoảng 1,5–2 giây.
- Phần giao diện mới nằm trong mảnh tải lười của hộp, không vào lượt mở app.

### 7. Nghiệm thu đo bằng máy
- **Test máy chủ:**
  - làm sạch và cắt độ dài;
  - tô đậm, làm nổi đúng số cụm cho phép;
  - chế độ gợi hướng không lộ đáp số.
- **Test giao diện:**
  - dựng đúng ý chính, các bước, bảng, ghi nhớ;
  - câu trả lời cũ dạng chữ vẫn hiện;
  - đề có A–D và a–d.
- **Cổng:** `npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0.
- **Ảnh Chromium app thật:** 0 lỗi trang, 0 tràn, 0 đích chạm < 44 px.

## Làn làm việc
Hộp Hỏi Thầy (`HopHoiThay`, `HoiThemThay`, `hoi-tro-ly.ts`) do phiên Heisenberg đang làm (PR271/272). Thầy duyệt xong thì dựng trên `main` mới nhất, ghi một dòng vào DIEU-PHOI trước khi sửa để hai phiên không giẫm tệp.
