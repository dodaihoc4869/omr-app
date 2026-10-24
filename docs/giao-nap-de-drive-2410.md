# GIAO VIỆC 24/10 — Nạp đề mới từ thư mục «DẠY HỌC» (Google Drive) lên kho đề

Thầy 24/10: «Giao cho các phiên quét thư mục dạy học trên google drive ở máy tính, soạn và đẩy lên kho đề những đề mới, làm chuẩn mọi nguyên tắc từ trước tới giờ để đẩy chuẩn kho đề lên app nhé».

Người giao: Boss (phiên đám mây `omr-app`). Người làm: phiên trên máy Mac của thầy, có thư mục Google Drive đồng bộ, pipeline «Nạp đề mới» (Cowork, `NAPDETUDONG.md`) và mã bí mật ghi kho.

## 1. Kho đang có (đọc D1 chỉ-đọc 24/10, 268 đề — KHÔNG đẩy lại)
- Thư mục `DAY_HOC`, mã theo mẫu `DH-<lớp>-C<chương>-B<bài>`. Ôn tập thêm `-D1`/`-D2`. Bài chia phần thêm `-P1`/`-P2`.
- Đã có đủ: Lớp 10 chương 1–2 (Bài 1–9); Lớp 11 chương 1–2 (Bài 1–9); Lớp 12 chương 1–3 (Bài 1–11).
- Các dạng phụ của bài: `-DT` (Các dạng toán), `-VD` (Ví dụ minh hoạ) — làm như bài cũ cùng chương.

## 2. Việc cần nạp (MỚI — chưa có trong kho)
Thư mục gốc Drive «DẠY HỌC» (trên máy: thư mục Google Drive › DẠY HỌC). Mã tệp Drive từng dòng nằm trong tin nhắn giao việc (repo công khai nên không ghi ở đây).

| Lớp | Chương (tên `chuyen_de`) | Tệp nguồn | Mã đề đề xuất |
|---|---|---|---|
| 10 | Liên kết hoá học | Bài 10. Quy tắc octet — GV, HS | DH-10-C3-B10 |
| 10 | Liên kết hoá học | Bài 11. Liên kết ion — GV, HS | DH-10-C3-B11 |
| 10 | Liên kết hoá học | Bài 12. Liên kết cộng hóa trị — GV, HS | DH-10-C3-B12 |
| 10 | Liên kết hoá học | Bài 13. Liên kết hydrogen và tương tác van der Waals — GV, HS | DH-10-C3-B13 |
| 10 | Liên kết hoá học | Bài 14. Đề ôn tập chương 3 (Đề 1) · (Đề 2) | DH-10-C3-B14-D1 / -D2 |
| 11 | Đại cương hoá học hữu cơ | Bài 10. Hợp chất hữu cơ và hoá học hữu cơ — GV, HS | DH-11-C3-B10 |
| 11 | Đại cương hoá học hữu cơ | Bài 11. Phương pháp tách biệt và tinh chế — GV, HS | DH-11-C3-B11 |
| 11 | Đại cương hoá học hữu cơ | Bài 12. Công thức phân tử hợp chất hữu cơ — GV, HS | DH-11-C3-B12 |
| 11 | Đại cương hoá học hữu cơ | Bài 13. Cấu tạo hoá học hợp chất hữu cơ — GV, HS | DH-11-C3-B13 |
| 11 | Đại cương hoá học hữu cơ | Bài 14. Ôn tập chương 3 (đề 1) · (Đề 2) | DH-11-C3-B14-D1 / -D2 |
| 12 | Polymer | Bài 12. Đại cương polymer (zip — giải nén, làm như bài nhiều tệp ở chương 1–2) | DH-12-C4-B12 |
| 12 | Polymer | Bài 13. Vật liệu polymer (zip) | DH-12-C4-B13 |
| 12 | Polymer | Bài 14. Đề ôn tập chương 4 (đề 1) · (Đề 2) | DH-12-C4-B14-D1 / -D2 |

Tên đề (`ten_de`) giữ đúng tên thư mục/tệp của thầy (vd «Bài 10. Quy tắc octet»). Mã đề đề xuất theo đúng mẫu cũ; trước khi đẩy tra lại kho, có mã trùng thì DỪNG báo Boss.

**Không đẩy đè:** «Lớp 12 / Chương 3 / Bài 11. Ôn tập chương 3 (Đề 1).docx» được thầy sửa 21/10, SAU lần nạp `DH-12-C3-B11-D1` (01/10). Đẩy lại là ghi đè đề đang có lượt làm thật. Chỉ soạn bảng khác biệt (câu nào đổi, đổi gì) rồi báo Boss; chưa đẩy.

## 0. Kiểm đủ công cụ TRƯỚC (thiếu một thứ ⇒ báo Boss rồi DỪNG)
Trả lời có/không từng ý:
- thư mục DẠY HỌC đã đồng bộ trên máy;
- có pipeline Cowork «Nạp đề mới» và `NAPDETUDONG.md`;
- có đường ghi `/kho/day` với mã bí mật đang chạy được;
- có bản omr-app `git pull` được để đọc các tệp luật dưới đây.

Thiếu thì KHÔNG tự chế đường ghi khác: không `wrangler d1` trực tiếp, không chèn JSON tay vào D1, không đi vòng qua giao diện app.

## 3. Nguyên tắc bắt buộc (đã chốt từ trước — làm đủ, không bỏ bước)
1. **Nguồn là Word có MathType (3 chương mới không có PDF).**
   - Đi đúng đường đã dùng cho Lớp 12 chương 2 (`DH-12-C2-B4…B7`, cũng chỉ có docx).
   - Không tìm thấy đường đó thì xuất PDF bằng Word trên máy để MathType hiện đúng. Soát tay công thức vài câu trước khi chạy pipeline.
   - Mẫu bài 2 tệp HS/GV: theo Lớp 10/11 chương 2 Bài 5–8.
2. Theo `NAPDETUDONG.md` (pipeline «Nạp đề mới»):
   - đọc tệp GV (có đáp án/lời giải) bằng thị giác, đối chiếu với tệp HS;
   - giải mù từng câu, rồi đối chiếu với đáp án in trong đề. **Đáp án đề là đáp án chấm** (`dap_an_de`): không đổi đáp án, không bịa số;
   - lệch đáp án hoặc không chắc ⇒ ghi «câu nghi» và đánh dấu `can_xem`, không đoán.
3. Khuôn JSON theo `src/lib/exam-kho-de-import.ts` (gói có `cau[]`). Mỗi câu có `phan` (I/II/III/IV), `so`, đáp án, lời giải dạng `chot` + `tung_pa`/`tung_y`/`buoc`. Giới hạn: chốt ≤ 45 từ, mỗi «vì sao» ≤ 35 từ. Công thức trong `{}`.
4. Gói phải qua cổng `kiemGoiDe` (`src/lib/kiem-goi-de.ts`): 0 lỗi chặn.
   - Phương án A–D, ý a–d. Phần II ghép đáp án Đ/S theo a,b,c,d.
   - Phần III đáp án phải là số máy chấm đọc được; không đọc được thì gắn `can_xem`.
5. **Tự luận là Phần IV.** Không đưa vào kênh rút đề tự động (`src/lib/cau-tu-luan.ts`).
6. Ảnh và hình vẽ đưa vào dạng data-URI, đúng vị trí (`sau_de`, `sau_pa_X`, `sau_y_x`, `cuoi_cau`, `sau_loi_giai`). Không bỏ hình của câu có hình.
7. Gắn nhãn như các bài đã nạp: `lop`, `chuyen_de` (= tên chương), thư mục `DAY_HOC`, dạng/mức độ, sao như cách nạp chương 1–2.
8. Trùng câu với kho thì theo luật `src/lib/khu-trung-cau.ts` (giữ bản trong «Bộ đề»).
9. **Đáp án không bao giờ xuống máy học sinh trước khi nộp.** JSON có đáp án KHÔNG commit lên git (repo công khai, `kho-de/**` đã bị chặn), chỉ đẩy qua `/kho/day`.
10. Chỉ THÊM đề mới. Không xoá, không ghi đè đề đang có. Gặp việc phải ghi đè thì DỪNG báo Boss.
11. **Giờ đẩy:** trước khi đẩy kiểm ca thi mở = 0. Tránh 19:00–23:30 VN (giờ cao điểm, máy chủ đang đông). Chạy «Nạp đề mới» bằng tay ban ngày; không để tệp chờ lượt tự chạy 22:00.
12. Không commit gì lên `main` cho việc này: commit lên `main` làm mọi máy tải lại app. Báo cáo gửi bằng tin nhắn.

## 4. Báo lại Boss (≤ 150 từ) — Boss tự đọc lại kho để xác minh (workflow `do-kho-de-hien-co-2410.yml`)
- Mỗi đề đã đẩy: mã đề · số câu (I/II/III/IV) · số câu `can_xem` · số câu nghi.
- Danh sách câu nghi (mã đề + số câu + lý do) để thầy xem.
- Bảng khác biệt của «DH-12-C3-B11-D1».
- Lỗi cổng `kiemGoiDe` nếu có, và đã sửa thế nào.
