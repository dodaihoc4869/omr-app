# SỔ VIỆC — phiên 08/09/2026

Repo `dodaihoc4869/omr-app`. Mốc trước khi sửa: `2358409`.
Lùi cả loạt này: `git revert <mã commit sẽ ghi ở cuối>`.

## Dòng việc

- [x] "làm cho chọn luôn các nut trên bài làm không cần tạo thêm dòng e chọn nữa" | bằng chứng: `npx vitest run tests/nop-phieu-khac-phuc.test.ts` → 34 passed; commit `2358409`
- [x] "bạn chưa gắn nhãn những câu sai rút lại" | bằng chứng: đọc máy chủ ca 845853 thấy bản đồ đủ nhưng đề em xếp I-36 trước I-30 ⇒ máy em cắt theo hash; sửa `vaoThi` gửi kèm bản đồ; `tests/ban-do-de-rieng-toi-may-em.test.ts` 10 passed; Apps Script v62; commit `5c7374d`
- [x] "ca mới vừa tạo vẫn bị lỗi mở câu khắc phục chưa đóng lời giải" | bằng chứng: `tests/nam-loi-0809-dot3.test.ts` 4 phép kiểm khối "PHIẾU KHẮC PHỤC: chờ xin xong mã rồi mới dựng" đạt
- [x] "vẫn chưa bấm chọn đáp án ngay trên đề được" | bằng chứng: `tests/bam-chon-tren-de.test.ts` — nạp phiếu vào DOM thật, BẤM thật: Phần I chọn/bỏ chọn, Phần II Đ/S, Phần III gõ, đếm "đã làm" nhảy đúng; 5 passed
- [x] "tôi chọn rút ca gần nhất nhưng chỗ này báo là rút 3 ca gần nhất" | bằng chứng: đọc máy chủ ca 638242 → `phamVi: gan_nhat`, máy RÚT ĐÚNG một ca; chỉ dòng nhãn ghi sai. Sửa nhãn + in ca thật sự lấy của từng em; 3 phép kiểm "BIÊN BẢN nói đúng phạm vi" đạt
- [x] "chỗ rút 3 ca bạn rút ngẫu nhiên 3 ca trước đó bất kì không cần gần nhất nhé" | bằng chứng: `chonCaTheoPhamVi`; 7 phép kiểm "PHẠM VI RÚT CÂU HỎI LẠI" đạt, gồm "bốc đúng 3 ca và KHÔNG phải 3 ca gần nhất"
- [x] "học sinh thi xong nhưng chưa thống kê là đã làm sai câu trước" | bằng chứng: `dungPhieuMayEm` nhận `lapCua`, máy chủ gửi `demLap`; 5 phép kiểm "BÁO CÁO SAU THI" đạt
- [x] "màu của phiếu html … 7 màu 7 sắc cầu vồng để hiển thị lần lượt rồi quay vòng" | bằng chứng: 7 khối `body[data-mau]`; `tests/bam-chon-tren-de.test.ts` chạy thật: mở lần 2 nhích đúng 1 sắc, mở đủ 7 lần quay về đúng sắc cũ
- [x] (tự phát sinh) Màn Ca thi chấm bằng bản đồ của riêng máy đã bấm Bắt đầu ⇒ mở ca ở máy khác thì khối "câu em sai buổi trước" đếm ra 0 và điểm lệch | bằng chứng: `chiTietCa` trả `boTheoEmCa`; cả màn dùng một `boTheoEmDung`; 2 phép kiểm "MÀN CA THI chấm bằng bản đồ MÁY CHỦ" đạt

## Năm cổng bắt buộc trước khi đẩy

- [x] `npx tsc -b` — sạch
- [x] `npx vitest run` — 1981 passed / 131 tệp
- [x] `npm run check:mau` — không mã màu ngoài tokens.css
- [x] `npm run kiem:hien-thi` — ĐẠT 18/18
- [x] `npm run build` — built in 1.84s
- [x] Không có ca thi nào đang chạy: 11 ca, ca mới nhất (638242) hết hạn vào lúc 04:55Z, mọi ca đều daVao = daNop

## Nguyên nhân gốc đã tìm ra

1. **Phiếu khắc phục không khoá lời giải / không bấm chọn được**: cả hai đều do `nop`
   rỗng lúc dựng phiếu. `nop` cần `linkBaiTap`, mà link phải đi xin máy chủ nên về SAU
   khi màn hình đã hiện. `KhoiBaiLuyen` dựng HTML một lần rồi giữ nguyên, em bấm nhanh
   hơn mạng là dựng ra phiếu không mã. Sửa: bấm thì CHỜ xin xong mới dựng.
2. **Biên bản ghi sai phạm vi**: dòng nhãn ghi cứng "quét N ca gần nhất" cho cả hai chế
   độ. Quét mấy ca là chuyện dò tìm ca em có nộp; LẤY mấy ca mới là điều thầy chốt.
3. **Chế độ 3 ca**: `docCacCaTruoc` luôn `slice(0, 3)` theo thứ tự mới nhất. Thầy chốt
   phải bốc ngẫu nhiên 3 ca bất kỳ.
4. **Báo cáo sau thi thiếu thống kê**: `dungPhieuMayEm` không nhận `lapCua`, và `vaoThi`
   không gửi bản đồ số lần sai về máy em.
