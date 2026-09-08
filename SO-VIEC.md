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
- [x] Test `co-len-bang` chập chờn | bằng chứng: TRUY RA GỐC — tick chip chỉ đổi `cheDo`, phải qua hai hiệu ứng nữa (rút bộ câu → báo lên màn) thì cờ `lenBang` mới tới; bấm Mở ca ngay là gói gửi đi mang giá trị chế độ CŨ. Thêm `waitFor` chờ chip `aria-checked=true`, KHÔNG đổi điều kiện kiểm. Ba lượt chạy toàn bộ liên tiếp: 1999/1999
- [x] (tự phát sinh) Màn Ca thi chấm bằng bản đồ của riêng máy đã bấm Bắt đầu ⇒ mở ca ở máy khác thì khối "câu em sai buổi trước" đếm ra 0 và điểm lệch | bằng chứng: `chiTietCa` trả `boTheoEmCa`; cả màn dùng một `boTheoEmDung`; 2 phép kiểm "MÀN CA THI chấm bằng bản đồ MÁY CHỦ" đạt

### Đợt 4 — thầy nhắn 08/09 sau khi xem lại

- [x] "câu em từng sai không nằm trong kho ca này nghĩa là như thế nào?" | bằng chứng: đọc ca 638242 — đề 12 câu (I:8 II:2 III:2), em cần 9 câu lặp mà cả 8 chỗ phần I đã kín ⇒ NHÃN GÁN SAI, đúng ra là "hết chỗ" chứ không phải "ngoài kho". Thêm lý do `het_cho`; 3 phép kiểm đạt
- [x] "rút ra 8 câu làm sai lần 2 có 1 câu là chính xác chưa?" | bằng chứng: CHƯA CHÍNH XÁC. Chấm lại 8 câu từ đáp án thật: 3 đúng · 4 sai · 1 bỏ trống. Màn hình đếm ra 1 vì chấm bằng bản đồ của riêng máy đã bấm Bắt đầu — đã sửa ở `6b2956a`
- [x] "nút chọn đáp án đúng sai bấm cũng không nhạy" (thầy nhắc lại) | bằng chứng: chính bản vá dưới đây; thêm nhận cú chạm ở pointerup
- [!] Video còn một dấu hiệu nữa: lựa chọn ý a BIẾN MẤT ở cuối video | KẸT: đã bóc 22 khung hình xem kỹ, đã tái hiện bằng Chromium có cảm ứng trên CẢ bản cũ lẫn bản mới với đúng kịch bản (a=S, c=Đ, b=Đ, d=Đ, đổi a=Đ) — không dựng lại được, `lam` lưu đúng "S---" → "SDDD" → "DDDD". CHƯA truy được nguyên nhân gốc, không sửa mò
- [x] "video nút đúng sai bấm không nhạy, nút Đ bấm mãi không được" | bằng chứng: HAI nguyên nhân — ô 34×30px (dưới ngưỡng ngón tay) và trình duyệt huỷ click khi ngón tay xê. Nay ô 46×44, nhận cú chạm ở pointerup. Chromium thật 360px có cảm ứng: 7 phép chạm đều đúng
- [x] "ý của tôi là đổi màu cả 2 chỗ này nữa" (bìa phiếu + khối Tổng quan đề bài) | bằng chứng: hai dải màu gõ cứng mã navy, không dùng biến. Đo trên Chromium: bìa và khối Tổng quan nay ra rgb(127,29,29) theo sắc 1

### Đợt 5 — thầy nhắn 08/09

- [ ] "bạn đồng bộ sang tất cả các máy cho tôi" | bằng chứng: (chưa có)
- [ ] (tự phát sinh) Hai con số vênh trên cùng màn: biên bản "rút được 8" nhưng khối đỏ "hỏi lại 9 câu" | bằng chứng: (chưa có)
- [ ] (tự phát sinh) Biên bản CŨ vẫn hiện "lấy từ ca —" và nhãn "ngoài kho" sai, vì cất trước khi có `tuCaCua`/`phamVi`/`het_cho` | bằng chứng: (chưa có)

- [x] "các nút bấm vẫn không bấm được, nút bấm được nút không, bạn sửa triệt để đi" | bằng chứng: ghi nhật ký từng sự kiện trong Chromium có cảm ứng — tay xê ~18px thì Chromium HUỶ cả pointerup lẫn click, chỉ còn touchend. Chuyển sang nghe touchstart/touchend + hit-test toạ độ + mốc cuộn; khoá chống-ăn-hai-lần gắn theo ĐÚNG ô. Đo lại: xê ngang 8/18/22px đều ăn, xê dọc 6/15px đều ăn, kéo dọc 60px vẫn là cuộn

- [x] "điểm ở trong ca thi và mục học sinh chưa đồng bộ" | bằng chứng: ĐO THẬT trên máy chủ — lấy `chiTietCa` kèm keyBank của 11 ca rồi chấm lại từng lượt bằng CHÍNH `gradeSubmissionFull` của app, so với ô `Tong` trên `LuotThi`. 47 lượt đã nộp: 42 KHỚP, 5 LỆCH. Cả 5 đều của SBD 12121212 (thầy tự thi thử), KHÔNG lượt nào của học sinh thật lệch. Chi tiết: 638242 0,40→2,39 · 789053 1,10→2,39 · 845853 0,35→0,75 · 845856 0,76→0,56 · 933467 1,25→2,69. NGUYÊN NHÂN: điểm cũ ghi lúc máy chấm chưa nhận đủ `soCau` của ca (ca 8/2/2 mà chấm theo luật cũ 18/4/6 thì mẫu số sai — tái hiện đúng 1,10 và 1,25 khi bỏ `soCau`) và/hoặc chưa nhận bản đồ đề riêng (tái hiện đúng 0,76 khi bỏ bản đồ). Hai lỗi đó đã sửa, nhưng số CŨ vẫn nằm trên Sheet mà màn Học sinh, bảng điểm, Excel và phiếu phụ huynh đều đọc ô đó. Màn Ca thi vẫn tự ghi đè điểm mới mỗi lần mở ra — nên mở lại 5 ca ấy là hết lệch. SỬA THÊM: ghi đè thì PHẢI BÁO, không được lặng lẽ. `src/lib/lech-diem.ts` + 10 phép kiểm dùng ĐÚNG 5 cặp số đo được

- [x] "nút bấm vẫn vậy không bấm được, có cái nhận có cái không" (lần 4) | ĐỔI CÁCH theo luật giậm chân: ô chọn nay là thẻ <button> THẬT (nền), cộng lưới an toàn touchend (bắt ca trình duyệt huỷ click). Đo trên Chromium có cảm ứng: chạm sạch, xê ngang 18px, xê dọc 15px, bàn phím Enter, chọn-rồi-bỏ-chọn — tất cả đúng; kéo dọc 90px vẫn là cuộn. KHAI RÕ: mọi phép đo của tôi chạy trên Chromium giả lập cảm ứng, KHÔNG phải Samsung Internet trên máy thầy

- [x] "tôi thấy … lựa chọn A chưa bao giờ bấm được" | bằng chứng: TRUY RA GỐC — cú chạm LUÔN ăn (aria bật, đếm lên, lưu ra {"q1":"A"}), chỉ MÀU không đổi: luật giấu đáp án `body.chua-nop .q-opt.dung {…!important}` đè lên màu ô đang chọn. Ô đáp án đúng vì thế trông y như chưa bấm, thầy bấm lại là BỎ chọn. Thêm `:not([aria-checked="true"])` vào cả 6 luật giấu (3 ở `chua-nop`, 3 ở `chi-de`)
- [x] "lần này bạn làm phải bấm ngon trong mọi máy" | bằng chứng: tìm thêm một đường ăn hai lần còn sót — `preventDefault` chỉ chặn được click giả khi touchend CÒN huỷ được; máy đang cuộn thì trình duyệt phát touchend KHÔNG huỷ được, click vẫn tới và ô bị chọn rồi bỏ chọn ngay trong một cú chạm (đúng "có cái nhận có cái không"). Thêm tem chống ăn hai lần, nuốt ĐÚNG MỘT cú click rồi tự xoá nên chạm lại vẫn bỏ chọn được. 5 phép kiểm mới trong `tests/bam-chon-tren-de.test.ts`; tắt thử tem thì 2 phép kiểm ĐỎ ngay
- [x] (tự phát sinh) Phép kiểm bấm-thật ĐANG NÓI DỐI: jsdom giữ nguyên `document` giữa các phép kiểm nên mỗi lần nạp phiếu là chồng thêm một bộ nghe sự kiện, bộ CŨ lật ngược kết quả của bộ mới; bài làm lại cất chung khoá `ddh.lam.abcd1234` nên trạng thái rò từ phép kiểm này sang phép kiểm khác. Đã gỡ cả hai trong `moPhieu`
- [x] "Sau đó làm luôn đồng bộ phiên bản sang mọi máy" | bằng chứng: máy đã có đủ ba lớp (skipWaiting, đẩy bản nằm chờ, tự tải lại khi đổi bản). LỖ HỔNG còn lại: trong lúc em thi thì `hoi()` bỏ qua, mà NỘP XONG không có gì đánh thức nó — em vẫn mở app nên `visibilitychange`/`focus` không bắn, nhịp 30 phút có thể còn xa, máy giữ bản cũ tới hết buổi. Nay rời màn làm bài là hỏi ngay; 2 phép kiểm mới trong `tests/cap-nhat-app.test.ts`

### Đợt 4 — bằng chứng phát hành

- [x] `npx tsc -b` sạch · `npx vitest run` 1996 passed/132 tệp · `check:mau` đạt · `kiem:hien-thi` ĐẠT 18/18 · `build` 2.34s
- [x] Đẩy lúc 11 ca đều daVao=daNop, không ca nào còn hạn vào (đo lúc 06:44Z)
- [x] Commit `2374f12`; bản live `assets/index-AI381o3z.js` mang đủ 6 dấu hiệu
- [x] Cập nhật nhật ký app `claude/OMR-APP-build-status.md`

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
