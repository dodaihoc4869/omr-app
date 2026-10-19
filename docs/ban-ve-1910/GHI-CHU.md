# Bản vẽ 19/10 — (F1) Nút "Chữa tất cả" sau điểm danh · (F2) Thang xoá lỗi trong Tự sửa lỗi

Thầy 19/10: "Trong mục chữa câu khó và tính toán, sau khi điểm danh xong cho tôi 1 nút chữa tất cả những câu sai nhiều nhất (sắp xếp từ nhiều nhất tới ít nhất), những câu học sinh chưa làm tới, những câu tính toán khó và tất cả những câu khó của những học sinh đã điểm danh đó."
Thầy 19/10: "Phần tự sửa lỗi phải có cơ chế giảm câu để cho học sinh biết, ví dụ làm câu này bao nhiêu lần nữa ở thời điểm nào thì câu này được xoá, sửa lại cơ chế giảm lỗi thông minh hiệu quả hơn nhé"

Quy trình 4 bước (`docs/quy-trinh-4-buoc-1310.md`): đây là bước 2 (đặc tả + bản vẽ). Số trong ảnh là số GIẢ. Chưa sửa `src/`. Thầy duyệt ảnh thì mới dựng.

---
## F1 · "Chữa tất cả" cho các em có mặt (app thầy · Hành trình › Chữa bài › khối "Chữa câu khó & tính toán")

1. **Mục tiêu · ai dùng.** Thầy, đầu giờ / buổi chữa. Điểm danh xong bấm MỘT nút là có cả danh sách câu cần chữa của đúng các em có mặt, theo thứ tự ưu tiên, chiếu lên bảng liền mạch (không phải chọn từng bài, từng tờ).
2. **Bố cục.** Thẻ mới đứng ĐẦU khối "Chữa câu khó & tính toán" (trên phần chọn bài như cũ):
   - Dòng đầu: "Chữa tất cả · 18 em có mặt".
   - 4 ô số có nhãn: **Sai nhiều nhất** · **Chưa làm tới** · **Tính toán khó** · **Câu khó**; dòng tổng "Tổng 47 câu (câu trùng chỉ tính một lần)".
   - Đúng MỘT nút chính "Chiếu tất cả · 47 câu"; nút chữ "Xem thứ tự 47 câu" mở danh sách xem trước (mỗi dòng: thứ tự · tên dạng · nhóm · "7/18 em sai" hoặc "5 em chưa làm").
   - Chưa điểm danh: thẻ mờ "Điểm danh xong là chiếu tất cả được" + nút chữ "Mở điểm danh".
   - Dọc: một cột; ngang / máy tính: 4 ô số một hàng.
   **Thứ tự chiếu (không trùng câu — câu đứng ở nhóm đầu tiên nó thuộc):**
   1. Sai nhiều nhất: câu ≥ 1 em có mặt làm sai (lần gần nhất), xếp số em có mặt sai GIẢM DẦN; hoà ⇒ tỉ lệ sai cao hơn ⇒ bài mới giao hơn.
   2. Chưa làm tới: câu của bài đang giao (Gói 7) mà em có mặt chưa gặp, xếp số em chưa gặp giảm dần.
   3. Tính toán khó: Phần III hoặc câu có tính toán, VÀ khó (≥ 2 sao hoặc Vận dụng cao).
   4. Câu khó còn lại (≥ 2 sao hoặc Vận dụng cao).
   Phạm vi câu: câu của các bài đang giao cho lớp (Gói 7 còn hạn hoặc quá hạn ≤ 7 ngày). Không lấy câu tự luận (luật rút đề tự động).
3. **Trạng thái.** Chưa điểm danh · đang tải · rỗng ("Các em có mặt không còn câu sai, câu chưa làm tới hay câu khó trong bài đang giao.") · lỗi tải (lý do + Thử lại) · có dữ liệu · điểm danh vừa đổi ("Điểm danh vừa đổi · Cập nhật danh sách").
4. **Dữ liệu (API thật).** Có sẵn: `/gv/buoi-hoc` (em có mặt), `/gv/goi-bai-7` (`cau[].chuaGap` theo em), `/gv/ai-sai-nhieu-cau` (em sai từng câu, lần gần nhất), siêu dữ liệu câu (phần, sao, mức độ, có tính toán). Cần thêm máy chủ: MỘT lệnh `/gv/chua-tat-ca` (lớp + danh sách em có mặt) đọc song song các nguồn trên, trả danh sách đã xếp và 4 số đếm — máy thầy không gọi nhiều lệnh.
5. **Ngoại lệ.** Điểm danh đổi sau khi mở · em vắng không tính · lớp > 200 em (tách lô như hiện tại) · câu thầy vừa rút / sửa (bỏ, như cổng chiếu hiện có) · câu song sinh gộp về câu gốc · bấm lặp (khoá nút khi đang tải) · danh sách dài (chiếu liền, thầy dừng lúc nào cũng được — các nút Đạt / Chưa đạt / Gọi em khác giữ nguyên).
6. **Chi phí máy chủ.** 1 lệnh khi thầy bấm, ~4 lượt đọc song song (1 đợt chờ), không ghi. Không đổi gì ở app học sinh.
7. **Nghiệm thu đo bằng máy.** `tests/chua-tat-ca-1910.test.ts` (đúng 4 nhóm, đúng thứ tự giảm dần, chỉ em có mặt, bỏ tự luận, không trùng) · `tests/chua-tat-ca-giao-dien-1910.test.tsx` (chưa điểm danh / rỗng / lỗi / có dữ liệu, một nút chính) · `npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · ảnh Chromium 0 lỗi trang / 0 tràn / 0 đích bấm < 44 px.
   **Làn:** "chiếu chữa ưu tiên" là làn Codex (`docs/hop-dong-claude-codex-1310.md` mục 3). Thầy duyệt xong: Claude dựng kèm dòng Nhật ký "định sửa" + test khoá luật thứ tự của Codex, hoặc giao Codex.

---
## F2 · Thang xoá lỗi (app học sinh · Tự sửa lỗi)

1. **Mục tiêu · ai dùng.** Học sinh (phụ huynh xem cùng số). Mỗi lỗi nói rõ **còn mấy lần làm đúng** và **từ lúc nào làm được lần tới** thì lỗi được XOÁ khỏi danh sách; danh sách giảm thật khi em làm đúng. Một luật duy nhất (hôm nay có ba luật lệch nhau: danh sách báo "Đã tự sửa" sau một lần kiểm 24 giờ trong khi hồ sơ vẫn coi lỗi còn mở; lỗi đã sửa không bao giờ rời danh sách).
   **Luật đề xuất (thầy chốt):**
   - Bước 1 · **Sửa**: làm luồng Tự sửa từng bước như hiện nay.
   - Bước 2 · **Gặp lại lần 1**: từ HÔM SAU (≥ 24 giờ sau khi sửa xong), tự làm đúng bản mới — không gợi ý, không xem lời giải trong 12 giờ trước.
   - Bước 3 · **Gặp lại lần 2**: khác ngày bước 2 và cách lần sai cuối ≥ N ngày (N riêng từng em 2–7, mặc định 3 — luật đang chạy ở máy chủ); câu có bản song sinh thì một trong hai lần phải là bản khác.
   - Đủ 3 bước ⇒ **XOÁ khỏi danh sách** (vào mục "Đã xoá" gập lại). App tự kiểm nhẹ sau 14 và 30 ngày trong chặng học, không hiện thành lỗi.
   - Sai ở bước 2 hoặc 3 ⇒ về bước 2 (giữ bước 1 — em đã hiểu cách làm), hẹn lại từ hôm sau. Sai 2 lần liền sau khi đã sửa ⇒ về bước 1 và vào danh sách "Cần thầy chữa".
   - Lần gặp lại **tự vào chặng học** hằng ngày (chỗ dành cho sửa lỗi trong kế hoạch, tối đa 4 câu/ngày như hiện nay) — em không phải tự nhớ.
2. **Bố cục.** Thẻ tổng đầu màn: số lớn "Còn 12 lỗi" + 3 dòng có nhãn: "3 lỗi làm được ngay" · "5 lỗi xoá được trong 3 ngày tới nếu em làm đúng" · "Tuần này đã xoá 18 lỗi"; MỘT nút chính "Sửa lỗi đến lượt · 3".
   Thẻ từng lỗi: tên dạng · phần · "Sai 3 lần · gần nhất 18/10"; **thang 3 chấm** Sửa ● — Gặp lại 1 ● — Gặp lại 2 ○; dòng chính:
   - đến lượt: "Còn 1 lần làm đúng là xoá · làm ngay" (nút "Làm");
   - chưa tới: "Còn 2 lần làm đúng · lần tới từ 19:30 Thứ Ba 21/10" (khoá mờ, có giờ);
   - đã xoá: "Đã xoá 18/10 · kiểm nhẹ lại 01/11".
   Nhóm: **Làm được ngay** · **Chờ tới lượt** (xếp theo giờ mở) · **Đã xoá** (gập). Dọc một cột; ngang / máy tính hai cột (thẻ tổng trái, danh sách phải).
3. **Trạng thái.** Đang tải · rỗng ("Không còn lỗi nào cần sửa. Lỗi mới hiện ở đây sau khi em làm sai.") · lỗi tải (+ Thử lại) · mất mạng (giữ bản vừa xem + dải "Đang mất mạng") · có dữ liệu · riêng: đến lượt / chờ / đã xoá / cần thầy chữa / câu vừa được thầy sửa (sửa trên câu gốc).
4. **Dữ liệu.** `chua-cau-sai/danh-sach` hiện trả `dotId, qid, trangThai, lanGapLai, denHan`. Cần thêm (CHỈ-THÊM) mỗi mục: `buoc` (1–3), `conLan` (0–2), `moLuc` (lúc làm được lần tới), `soLanSai`, `canBanKhac`; cấp trên: `daXoaTuan`, `xoaTrong3Ngay`, `serverNow`. Tính bằng luật đóng lỗi đang có (`server/src/loi-hoc-luat.ts`) trên sổ của em — thêm MỘT lượt đọc `su_kien_hoc` theo (em, các câu trong trang) SONG SONG lượt đọc hiện có.
   Lỗi trước đây báo "Đã tự sửa" mà luật đóng lỗi chưa đóng sẽ hiện lại "Còn 1 lần" — không xoá dữ liệu nào, chỉ tính lại cho đúng.
5. **Ngoại lệ.** Đồng hồ máy em lệch (đếm theo `serverNow`) · qua 0 giờ · làm trên hai máy · câu chưa có bản song sinh (bỏ điều kiện bản khác) · thầy sửa / rút câu · mạng chập giữa lúc nộp (nộp tự gửi lại — đã làm 19/10) · danh sách dài (phân trang hiện có).
6. **Chi phí máy chủ.** +1 lượt đọc song song (không thêm đợt chờ), không ghi thêm; tính luật ở máy chủ vài ms/em. Không có đáp án nào xuống máy trước khi nộp.
7. **Nghiệm thu đo bằng máy.** `tests/tu-sua-thang-xoa-loi-1910.test.ts` (3 bước · sai về bước 2 · sai 2 lần liền ⇒ cần thầy · đủ 3 bước ⇒ rời nhóm còn lỗi · đếm "làm được ngay / xoá trong 3 ngày" đúng) · `tests/tu-sua-thang-xoa-loi-giao-dien-1910.test.tsx` · `npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · ảnh Chromium 0 lỗi / 0 tràn / 0 đích < 44 px.
   **Làn:** Tự sửa lỗi là làn Claude.

---
## Ảnh
Bản vẽ: `chua-tat-ca.html` (F1, chỉ bảng `--gvm-*` của app thầy) · `thang-xoa-loi.html` (F2, đúng bộ biến `tokens.css` mà `tu-chua.css` đang dùng). Ảnh trong `anh/`, chụp bằng `node scripts/chup-ban-ve-1910.mjs` (Chromium thật). Số trong ảnh là số GIẢ.

- `01-chua-tat-ca-may-tinh.jpg` — máy tính 1440, sáng: thẻ "Chữa tất cả · 18 em có mặt" đầu khối, 4 ô số một hàng, mở "thứ tự 47 câu" (thấy nhóm 1 và 2).
- `02-chua-tat-ca-may-tinh-toi.jpg` — như 01, nền tối.
- `03-chua-tat-ca-doc.jpg` — điện thoại dọc 390, sáng, chụp cả trang: 4 ô số xếp dọc, nút chính, danh sách xem trước đủ 4 nhóm, phần "Hoặc chiếu từng bài" bên dưới.
- `04-chua-tat-ca-ngang.jpg` — điện thoại ngang 844×390, sáng: cuộn tới thẻ, 4 ô số một hàng, danh sách đang gập.
- `05-chua-tat-ca-chua-diem-danh-doc.jpg` — điện thoại dọc: chưa điểm danh, thẻ mờ "Điểm danh xong là chiếu tất cả được" + nút chữ "Mở điểm danh".
- `06-chua-tat-ca-rong-doc-toi.jpg` — điện thoại dọc, tối: rỗng ("Các em có mặt không còn câu sai…").
- `07-thang-xoa-loi-doc.jpg` — điện thoại dọc 390, sáng, cả trang: thẻ tổng "Còn 12 lỗi" + 3 dòng + nút "Sửa lỗi đến lượt · 3"; nhóm Làm được ngay (3), Chờ tới lượt (3/9 thẻ), Đã xoá (gập).
- `08-thang-xoa-loi-doc-toi.jpg` — như 07, nền tối.
- `09-thang-xoa-loi-ngang.jpg` — điện thoại ngang 844×390: hai cột, thẻ tổng trái (nút chính trong màn đầu), danh sách phải.
- `10-thang-xoa-loi-may-tinh.jpg` — máy tính 1440, cả trang: hai cột, thang 3 chấm cạnh dòng chính; nhóm Đã xoá mở để thấy dòng "Đã xoá 18/10 · kiểm nhẹ lại 01/11".
- `11-thang-xoa-loi-rong-doc.jpg` — điện thoại dọc: rỗng ("Không còn lỗi nào cần sửa. Lỗi mới hiện ở đây sau khi em làm sai.").
- `12-thang-xoa-loi-mat-mang-doc-toi.jpg` — điện thoại dọc, tối: dải "Đang mất mạng", giữ bản vừa xem.

**Soát máy (19/10, 12 khung): 0 lỗi trang · 0 tràn · 0 đích < 44 px** · mỗi khung đúng 1 nút chính.

Ghi chú khi vẽ (thầy xem khi duyệt):
- Ngày: đặc tả ghi "19:30 Thứ Ba 21/10", nhưng 21/10/2026 là Thứ Tư. Bản vẽ lấy "bây giờ" là 21:05 Thứ Hai 19/10 và ghi "19:30 Thứ Ba 20/10".
- F1: thẻ có dữ liệu mà thầy lại chọn một bài ở "Hoặc chiếu từng bài" thì nút "Chiếu lên bảng" phải đổi thành nút viền (mỗi màn một nút chính). Ảnh vẽ lúc chưa chọn bài. Khối A "Học sinh cần chữa" (nằm trên khối này) không vẽ.
- F1: danh sách xem trước hiện 2–3 câu đầu mỗi nhóm, dòng "Còn N câu nữa" và nút "Xem đủ 47 câu". Lúc mở, nút chữ đổi thành "Ẩn thứ tự 47 câu" (đặc tả chưa ghi chữ này). Nhóm 3–4 ghi mức khó + "18/18 em làm đúng" thay cho số em sai.
- F2: 3 lỗi làm được ngay gồm 1 lỗi "Thầy sẽ chữa trên lớp" (sai 2 lần liền ⇒ về bước Sửa). Nhóm Chờ tới lượt hiện 3/9 thẻ + nút "Xem cả 9 lỗi đang chờ".
- Chưa vẽ: đang tải, lỗi tải, "Điểm danh vừa đổi" (F1); đang tải, lỗi tải, "câu vừa được thầy sửa" (F2).
