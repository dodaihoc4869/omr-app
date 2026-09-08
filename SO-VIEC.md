# SỔ VIỆC — phiên 08/09/2026

Repo `dodaihoc4869/omr-app`. Mốc trước khi sửa: `2358409`.
Đã đẩy: `5c7374d` rồi `6b2956a` (trên máy thầy, sau rebase).
Bản live: `assets/index-B037iNu4.js`. Apps Script **v63**.
Lùi: `git revert 6b2956a` (và `git revert 5c7374d` nếu muốn lùi cả đợt trước).

## Dòng việc

- [x] "làm cho chọn luôn các nut trên bài làm không cần tạo thêm dòng e chọn nữa" | bằng chứng: `npx vitest run tests/nop-phieu-khac-phuc.test.ts` → 34 passed; commit `2358409`
- [x] "bạn chưa gắn nhãn những câu sai rút lại" | bằng chứng: đọc máy chủ ca 845853 thấy bản đồ đủ nhưng đề em xếp I-36 trước I-30 ⇒ máy em cắt theo hash; sửa `vaoThi` gửi kèm bản đồ; `tests/ban-do-de-rieng-toi-may-em.test.ts` 10 passed; Apps Script v62; commit `5c7374d`
- [x] "ca mới vừa tạo vẫn bị lỗi mở câu khắc phục chưa đóng lời giải" | bằng chứng: `tests/nam-loi-0809-dot3.test.ts` 4 phép kiểm khối "PHIẾU KHẮC PHỤC: chờ xin xong mã rồi mới dựng" đạt
- [x] "vẫn chưa bấm chọn đáp án ngay trên đề được" | bằng chứng: `tests/bam-chon-tren-de.test.ts` — nạp phiếu vào DOM thật, BẤM thật: Phần I chọn/bỏ chọn, Phần II Đ/S, Phần III gõ, đếm "đã làm" nhảy đúng; 5 passed
- [x] "tôi chọn rút ca gần nhất nhưng chỗ này báo là rút 3 ca gần nhất" | bằng chứng: đọc máy chủ ca 638242 → `phamVi: gan_nhat`, máy RÚT ĐÚNG một ca; chỉ dòng nhãn ghi sai. Sửa nhãn + in ca thật sự lấy của từng em; 3 phép kiểm "BIÊN BẢN nói đúng phạm vi" đạt
- [x] "chỗ rút 3 ca bạn rút ngẫu nhiên 3 ca trước đó bất kì không cần gần nhất nhé" | bằng chứng: `chonCaTheoPhamVi`; 7 phép kiểm "PHẠM VI RÚT CÂU HỎI LẠI" đạt, gồm "bốc đúng 3 ca và KHÔNG phải 3 ca gần nhất"
- [x] "học sinh thi xong nhưng chưa thống kê là đã làm sai câu trước" | bằng chứng: `dungPhieuMayEm` nhận `lapCua`, máy chủ gửi `demLap`; 5 phép kiểm "BÁO CÁO SAU THI" đạt
- [x] "màu của phiếu html … 7 màu 7 sắc cầu vồng để hiển thị lần lượt rồi quay vòng" | bằng chứng: 7 khối `body[data-mau]`; `tests/bam-chon-tren-de.test.ts` chạy thật: mở lần 2 nhích đúng 1 sắc, mở đủ 7 lần quay về đúng sắc cũ
- [x] (tự phát sinh) Cập nhật nhật ký app `claude/OMR-APP-build-status.md` | bằng chứng: đã ghi mục 08/09/2026
- [!] Hai lần chạy toàn bộ test có một phép kiểm lẻ trượt rồi tự xanh lại (`co-len-bang`, `khong-dung-bien-truoc-khi-khai`) | KẸT: chạy riêng đều đạt, hai lượt chạy toàn bộ liên tiếp sau đó đều 1981/1981 — nghi chập chờn do máy tải nặng, CHƯA truy được nguyên nhân gốc
- [x] (tự phát sinh) Màn Ca thi chấm bằng bản đồ của riêng máy đã bấm Bắt đầu ⇒ mở ca ở máy khác thì khối "câu em sai buổi trước" đếm ra 0 và điểm lệch | bằng chứng: `chiTietCa` trả `boTheoEmCa`; cả màn dùng một `boTheoEmDung`; 2 phép kiểm "MÀN CA THI chấm bằng bản đồ MÁY CHỦ" đạt

### Đợt 4 — thầy nhắn 08/09 sau khi xem lại

- [x] "câu em từng sai không nằm trong kho ca này nghĩa là như thế nào?" | bằng chứng: đọc ca 638242 — đề 12 câu (I:8 II:2 III:2), em cần 9 câu lặp mà cả 8 chỗ phần I đã kín ⇒ NHÃN GÁN SAI, đúng ra là "hết chỗ" chứ không phải "ngoài kho". Thêm lý do `het_cho`; 3 phép kiểm đạt
- [x] "rút ra 8 câu làm sai lần 2 có 1 câu là chính xác chưa?" | bằng chứng: CHƯA CHÍNH XÁC. Chấm lại 8 câu từ đáp án thật: 3 đúng · 4 sai · 1 bỏ trống. Màn hình đếm ra 1 vì chấm bằng bản đồ của riêng máy đã bấm Bắt đầu — đã sửa ở `6b2956a`
- [x] "video nút đúng sai bấm không nhạy, nút Đ bấm mãi không được" | bằng chứng: HAI nguyên nhân — ô 34×30px (dưới ngưỡng ngón tay) và trình duyệt huỷ click khi ngón tay xê. Nay ô 46×44, nhận cú chạm ở pointerup. Chromium thật 360px có cảm ứng: 7 phép chạm đều đúng
- [x] "ý của tôi là đổi màu cả 2 chỗ này nữa" (bìa phiếu + khối Tổng quan đề bài) | bằng chứng: hai dải màu gõ cứng mã navy, không dùng biến. Đo trên Chromium: bìa và khối Tổng quan nay ra rgb(127,29,29) theo sắc 1

## Năm cổng bắt buộc trước khi đẩy

- [x] `npx tsc -b` — sạch
- [x] `npx vitest run` — 1981 passed / 131 tệp
- [x] `npm run check:mau` — không mã màu ngoài tokens.css
- [x] `npm run kiem:hien-thi` — ĐẠT 18/18
- [x] `npm run build` — built in 1.84s
- [x] Không có ca thi nào đang chạy: 11 ca, ca mới nhất (638242) hết hạn vào lúc 04:55Z, mọi ca đều daVao = daNop
- [x] Bản live đã ra và mang đủ thay đổi: `assets/index-B037iNu4.js` có `xinLink`, `doi-mau`, 7 khối `data-mau`, `3 ca ngẫu nhiên`, `hoi-lai:`, `lấy từ ca`, `boCuaEm`, `demLap`, `boTheoEmCa`
- [x] Apps Script v63 sống: POST 6 lệnh đều ok, cổng mã bí mật vẫn chặn, ID triển khai không đổi

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
