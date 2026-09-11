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

- [x] "bạn đồng bộ sang tất cả các máy cho tôi" (biên bản CŨ nói sai) | bằng chứng: `src/lib/va-bien-ban-cu.ts` — VÁ LÚC ĐỌC, không sửa bản đã cất (bản cất là bằng chứng của lượt rút). Điền `phamVi` từ bản ghi ca; tính lại nhãn `ngoai_kho` → `het_cho` bằng đúng luật hiện hành (câu CÓ trong kho mà vẫn không vào được đề là hết chỗ); `tuCaCua` không suy lại được nên KHÔNG in dấu gạch giả vờ đã tra. 12 phép kiểm, dựng theo đúng hình dạng biên bản ca 638242
- [x] (tự phát sinh) Hai con số vênh trên cùng màn: biên bản "rút được 8" nhưng khối đỏ "hỏi lại 9 câu" | bằng chứng: CẢ HAI ĐỀU ĐÚNG, đếm hai tập khác nhau — "rút được 8" là câu máy CHỦ ĐỘNG rút lại; "9" là câu trong đề của em mà em từng sai, gồm cả `12-C1-B1-II-3` tự vào đề theo lượt rút thường. Sai ở NHÃN: hai chỗ cùng gọi "câu hỏi lại". Sửa bằng gọi đúng tên, KHÔNG ép hai số bằng nhau. `src/lib/dem-cau-hoi-lai.ts`, 5 phép kiểm
- [x] (gộp vào dòng trên) Biên bản CŨ hiện "lấy từ ca —" và nhãn "ngoài kho" sai | bằng chứng: `va-bien-ban-cu.ts`

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

### Đợt 5 — bằng chứng phát hành

- [x] `npx tsc -b` sạch · `npx vitest run` **2037 passed / 135 tệp** · `check:mau` đạt · `kiem:hien-thi` ĐẠT 18/18 · `build` 2,21s
- [x] Đẩy lúc 11 ca đều daVao = daNop, không ca nào còn hạn vào (đo 09:11Z)
- [x] Ba commit: `e1dcf5e` · `c0925d1` · `015e983` (Apps Script KHÔNG đổi, vẫn v63)
- [x] Bản live `assets/index-DfLGupCV.js` mang đủ 7 dấu hiệu: `:not([aria-checked="true"])` · `temCham` · `Đã đồng bộ điểm` · `câu em từng sai có trong đề này` · `câu còn lại tự vào đề` · `còn sai lại câu từng sai` · `đề không đủ chỗ`
- [x] Đo cảm ứng thật trên Chromium 360×780 `hasTouch`, phiếu do CHÍNH `dungPhieu` dựng: ô đáp án đúng và ô sai giống hệt nhau TRƯỚC khi bấm (vẫn giấu đáp án); chạm ô đúng → nền đổi `rgb(248,250,252)` → `rgb(239,242,246)`, aria bật, đếm 1, lưu `{"q1":"A"}`; chạm lại → bỏ chọn; xê ngang 18px ăn; xê dọc 15px ăn; kéo dọc 90px vẫn là cuộn; ô Đ/S 46×44, ô phương án 311×44 (đều trên ngưỡng ngón tay 44px)

## Phiên 08/09 tối — 17/36 em bị chặn vào thi

- [x] "17 bạn học sinh/ 36 bạn bị lỗi này… khắc phục triệt để" | bằng chứng: sửa HAI TẦNG — máy em: hàng rào tại nguồn trong `handleJoin` (chưa xác nhận thì quay về bước 1) + phím Enter đi đúng đường của nút; máy chủ: tách hàm thuần `khopHoSoDanhSach_`, thêm vế "máy không gửi thì không có gì để so". `tests/chan-vao-thi-0809.test.ts` 15 phép kiểm, chạy CHÍNH hàm trong .gs, dựng từ 3 dòng thật của sổ ChanVao. Phá mã 3 lần, cả 3 đều đỏ đúng chỗ

### NGUYÊN NHÂN GỐC — đọc sổ ChanVao của ca 447479 trên máy chủ

40 dòng chặn, 24 số báo danh khác nhau. Phân bố:
- `hoTenGoi` **RỖNG ở 37/40 dòng**; `namSinhGoi` **RỖNG ở 40/40 dòng**.
- Lý do: `lech_ho_ten` 33 · `lech_nam_sinh` 3 · `khong_co_sbd` 4 (SBD "121" và "12129", gõ nhầm thật).

Máy em gửi họ tên và năm sinh là chuỗi RỖNG, không phải gửi sai.

Vì sao rỗng: hai ô "họ tên" và "năm sinh" ĐÃ GỠ khỏi màn nhập ngày 07/09, thay bằng
màn xác nhận bằng mắt. Cổng máy chủ từ đó chỉ mở khi client gửi `xacNhanTen: true`,
tức em phải đi qua bước 1 (`traTenRoiHoi` → hiện tên → bấm Bắt đầu).

NHƯNG `handleJoin` còn MỘT LỐI VÀO không qua bước 1: **phím Enter trong ô số báo
danh** (`onKeyDown` → `handleJoin()` thẳng). Ở lối đó `xacNhan === null` nên client
gửi `xacNhanTen: false` cùng `hoTen: ''`, `namSinh: ''`; máy chủ so chuỗi rỗng với
tên trong danh sách, thấy lệch, chặn.

Đó là "17/36": em bấm nút "Vào thi" thì qua, em bấm Enter/Go/Xong trên bàn phím thì
bị chặn. Ba dòng `lech_nam_sinh` là em còn `hoTen` nhớ trong localStorage từ bản cũ
nhưng không có năm sinh.

Lối Enter còn bỏ qua luôn điều kiện toàn màn hình mà nút "Vào thi" có (`disabled`).
- [ ] "bạn hãy đồng bôn tên học sinh theo số báo danh vào ca 447479 cho tôi luôn nhé" | bằng chứng: (chưa có)
- [x] "thi thật hôm nay lúc học sinh xem báo cáo, có nhiều máy lấy nhầm báo cáo của phụ huynh" | bằng chứng: NGUYÊN NHÂN GỐC — `phieu-ca-ca.ts` ghi cứng `xung: \'con\'` rồi CẤT chuỗi nhận xét vào phiếu trên máy chủ; `PhieuV3` đổi được khung bằng `laCuaEm` nhưng không đổi được chuỗi đã cất, nên báo cáo của em ra nửa "em" nửa "con". Thêm `doiXungVeEm`, áp lúc HIỆN nên chữa được cả phiếu cũ đã cất (36 em tối nay không phải dựng lại). `tests/bao-cao-cua-em-0809.test.ts`: đổi ngược bản "con" ra ĐÚNG bản sinh thẳng "em" trên **1 344 tổ hợp**. Phá mã 2 lần, cả 2 đều đỏ
- [x] "đs bấm 1 đáp án ra hết 4 đáp án luôn thầy" (LỘ ĐÁP ÁN) | bằng chứng: HỒI QUY DO CHÍNH BẢN VÁ TRƯA NAY. Bản trưa thêm `:not([aria-checked="true"])` vào luật giấu, tức TẮT luật giấu cho ô đang chọn; ô đáp án ĐÚNG khi chọn rơi về style `.dung` (xanh lá) còn ô sai rơi về style chọn thường (xám). Đo Chromium TRƯỚC khi sửa: ô đúng `rgb(215,250,232)`, ô sai `rgb(239,243,247)`. SAU khi sửa: cả hai `rgb(238,242,246)`, mà vẫn khác màu lúc chưa bấm `rgb(248,250,252)`. Cách đúng là ĐÈ LÊN luật giấu chứ không tắt nó. Phá mã 3 lần; lần 2 LỌT vì phép kiểm dùng `toContain` trần trong khi chuỗi còn ở luật con — đã siết sang bắt nguyên khối bằng regex, phá lại thì đỏ
- [x] "phiếu dựng vẫn bị lỗi có thêm lời giải" (phần còn lại) | bằng chứng: cùng một gốc với dòng trên — đã sửa
- [x] "rút câu luyện của học sinh bị lỗi lời giải" | bằng chứng: NGUYÊN NHÂN GỐC — `KhoiBaiLuyen` gọi `dungPhieu(..., { nop })` cả khi `nop` là null (xin mã hỏng/thiếu SBD/mất link). `nop` null thì body KHÔNG mang `chua-nop` lẫn `chi-de`, mà không lớp nào thì không luật giấu nào chạy: đáp án tô sẵn, lời giải mở được — phiếu tụt về BẢN ĐẦY ĐỦ của thầy. Nay bản của EM mà không nộp được thì dựng phiếu CHỈ ĐỀ (`anGiai`). 3 phép kiểm mới; phá mã thì đỏ
- [x] "Đồng bộ tên học sinh trong ca thi mới nhất" (ca 447479) | bằng chứng: chạy `dongBoTenCa` — điền 22 tên, giữ nguyên 14, sửa 0, không SBD nào tra không ra. Đọc lại `chiTietCa`: 36/36 lượt CÓ TÊN, còn thiếu 0. Không đụng điểm (12052 vẫn 2,25 · 12037 vẫn 4,50)

## Phiên 11/09 trưa — chuyển 100% sang máy chủ mới

- [x] "tất cả làm trên máy chủ mới bỏ hẳn app scrip" → **Apps Script v73 đã triển khai** lúc 11:45, ID triển khai giữ nguyên `AKfycbyrnfvuVqJuI_...PmyZPcvvi` | bằng chứng: hộp thoại "Đã cập nhật thành công hoạt động triển khai. Phiên bản 73 lúc 11:45, 11 thg 9, 2026"
- [x] Tạo bảng `danh_sach` trên D1 thật | bằng chứng: D1 Console — trước `/tables` ra `ca · luot · phong_cho · trang_thai`; sau hai câu CREATE ra `ca · danh_sach · luot · phong_cho · trang_thai`, cả hai câu "This query successfully executed"
- [x] Sửa lỗi gán nhầm họ tên ở cổng danh sách máy chủ mới | bằng chứng: commit `937ae71`, `tests/danh-sach-len-may-chu-moi-1109.test.ts` 11/11 xanh, trong đó một phép TÁI HIỆN đúng lỗi cũ
- [x] Năm cửa trên đúng cây mã sẽ phát hành (`937ae71`) | bằng chứng: `tsc` app + server sạch · **208 tệp / 3 080 phép kiểm / 0 đỏ** · `check:mau` sạch · `kiem:hien-thi` **ĐẠT 18/18** · build Pages OK
- [x] Sửa ba lỗi trong `CHUYEN-SANG-MAY-CHU-MOI.command` sau log 11:47 của thầy | bằng chứng: `{...} | tee` làm mất TTY ⇒ bọc `script`; `wrangler whoami` thoát 0 dù chưa đăng nhập ⇒ đọc chữ; `workers_dev` đứng sau `[[r2_buckets]]` ⇒ chuyển lên phần gốc (commit `fed7e5b`)
- [x] **Phát hành Worker** | bằng chứng: version `83a8a467-f31b-4f72-8311-352a544c1752`, ràng buộc `env.DB (omr)` D1 + `env.DE (omr-de)` R2. Đo lại từ tab app: `/khoe` coDB/coR2/coMat đều true · `/ten-theo-sbd` 200 (trước phát hành 405) · `/phieu/:ma` 404 (trước 405)
  - Ô soạn thảo Worker trên dashboard TRẮNG TRƠN, thử 2 phiên (tải lại · nới cửa sổ · vào lại từ nút "Edit code"). Bỏ hẳn đường dán tay, chuyển sang `wrangler deploy` từ mã nguồn — chắc hơn vì không dán thiếu ký tự được
- [x] Đẩy `may-chu-moi` → `main` | bằng chứng: `3622cf0..a68f05a  may-chu-moi -> main`; Actions #297 dựng 2m46s; bó mã live `index-D3ifpgC1.js` có đủ chuỗi mới `MÁY CHỦ MỚI CHƯA NHẬN` và `máy chủ mới đã nhận`
- [x] Đồng bộ danh sách lớp lên D1 | bằng chứng: `SELECT COUNT(*) FROM danh_sach` → **257 em · 4 lớp · 0 em thiếu tên · cập nhật 2026-09-11T05:04:16.573Z**. Lượt bấm đầu KHÔNG tới nơi (0 dòng) vì cờ còn tắt — xem dòng dưới
- [x] Sửa lỗi NUỐT kết quả đẩy danh sách sang máy chủ mới | bằng chứng: commit `dee50ef`, 14 phép kiểm; nay mỗi lượt đồng bộ kết luận `tat`/`ok`/`hong`, `hong` thì nút ĐỎ
- [x] Miễn cổng danh sách cho ca đo tải | bằng chứng: cùng commit; trang `/do-tai` chạy lại được sau khi bảng có 257 dòng thật
- [x] Đo tải thật trên máy chủ vừa phát hành | bằng chứng: 10/20/30/50 đồng thời, mỗi em ảo đủ ba bước — **0 lỗi ở cả 12 dòng**; 50 em xong cả ba bước trong **1.430 ms** (hôm qua 1.723 ms, dù nay thêm một lượt tra cổng). Dọn sạch ngay: `luot` ca DOTAI = 0, `luot` ca thật = 0, `danh_sach` vẫn 257
- [ ] Mở ca 18h và kiểm ca đã lên D1 trước khi em vào — nay `số ca = 1` và ca đó là ca đo | bằng chứng: (chưa có)
- [ ] Đổi `MA_BI_MAT` (giá trị cũ đã lọt vào ảnh chụp 10/09) | bằng chứng: (chưa có)
- [ ] Xây mục **Phân công** (Giao BTVN + Gọi lên bảng) theo `claude/PHAN-CONG-GIAO-BTVN.md` — hoãn sau ca thi | bằng chứng: (chưa có)

### Ghi chú phải nhớ

Tab Google Sheet của thầy bị tôi điều hướng sang D1 Console. Mở lại bằng:
`https://docs.google.com/spreadsheets/d/1w_yOiMX01jdnTh7uIBYrBcT4k_sAJIkAfBIa_Ptx_mg/edit`

### Phiên 11/09 chiều — chuyển tiếp sang máy chủ mới

- [x] "ca thi vẫn tải trên google sheet, chuyển hết sang máy chủ mới đi cho nhanh" | bằng chứng: commit `8ff3c74`. Đo trước khi sửa, từ trình duyệt của thầy: Apps Script gọi một lệnh KHÔNG tồn tại mất **1.552 / 1.666 / 1.798 ms**; máy chủ mới `/khoe` **109 / 333 / 547 ms**. Worker thêm `/ca/nhieu`, `/ca/danh-sach`, `/dong-bo/dau`; D1 thêm 4 cột vào `ca` + bảng `dong_bo` (chạy thẳng trên D1 Console, cả 5 câu "successfully executed"). **23 phép kiểm mới.** Sáu cửa tại `8ff3c74`: 211 tệp / 3.135 phép kiểm / 0 đỏ
- [x] Chặn cú treo cả lớp ở phòng chờ | bằng chứng: commit `d8a9c3c`, 18 phép kiểm, 210 tệp / 3.112 phép kiểm / 0 đỏ
- [x] Kiểm bản GỘP với phiên Claude khác trước mỗi lượt đẩy | bằng chứng: `7561882` → 211 tệp / 3.138 phép kiểm / 0 đỏ; `cf552af` → 211 tệp / 3.139 phép kiểm / 0 đỏ. Cả hai đều `tsc` sạch, check:mau sạch, hiển thị ĐẠT 18/18, build Pages OK
- [x] Phát hành | bằng chứng: Worker `d005192f` rồi `70c98113`; `origin/main = cf552af`
- [ ] Thầy bấm "Chuyển ca cũ sang máy chủ mới" | bằng chứng: (chưa có) — đếm trên D1 lúc 15h00 vẫn `so_ca 1 · so_luot 0 · dau null`
- [ ] Bật cờ máy chủ mới TRÊN MÁY THẦY DÙNG TỐI NAY | bằng chứng: (chưa có)
- [ ] Mở ca 18h rồi đếm ca trên D1 trước khi em vào | bằng chứng: (chưa có)
- [ ] Mục Phân công + giao BTVN theo `claude/PHAN-CONG-GIAO-BTVN.md` — hoãn tới sau ca | bằng chứng: (chưa có)

### Hai điều phải nhớ

**Cấu hình máy chủ mới nằm trên TỪNG MÁY** (IndexedDB `omr-exam/settings` khoá
`mayChuMoi`), không nằm trên máy chủ. Thầy điều khiển ca ở máy nào thì phải bật
cờ ở đúng máy ấy. Đợt sau nên đưa cấu hình này lên máy chủ.

**Có phiên Claude khác cùng sửa kho mã** (cây chọn đề: `cay-chon-de.ts`,
`HopChonDe.tsx`, `tests/cay-chon-de.test.tsx`). Luật từ nay: chỉ `git add` đúng
tệp mình sửa, và **chạy lại đủ sáu cửa trên bản GỘP** trước mỗi lượt đẩy, không
chỉ trên phần của mình. Cây kiểm lấy bằng `git archive HEAD` nên không dính sửa
đổi dở dang của phiên kia.

### 11/09 16h10 — màn Ca thi: KẸT ở bước đối chiếu, hoãn tới sau ca 18h

- [x] Chuyển dữ liệu ca cũ sang D1 | bằng chứng: đếm trên D1 **84 ca · 282 lượt**, không xoá gì ở Sheet
- [!] **KẸT: dấu `ca_day_du` không được ghi.** Lời báo: *"CHƯA khớp — 83 ca · 282 lượt · HỎNG 12 ca: 999950, 999904, 984033, 164909, 701254 · lệch 83 ca · thiếu 282 lượt"*
  - `lệch 83 ca` và `thiếu 282 lượt` nghĩa là `soCaD1 = 0` và `soLuotD1 = 0` — lượt ĐỌC LẠI từ `/ca/danh-sach` trả về **rỗng hoàn toàn**, không phải thiếu một ít
  - Nhật ký Worker: **0 lỗi** trong cả giờ đó, và thấy đúng hai lượt `/ca/danh-sach` ở ĐẦU lượt chạy (do `danhSachCaThat` nay hỏi máy chủ mới trước) — chưa thấy hai lượt ở CUỐI vì trang nhật ký bị đệm, chưa làm mới được
  - **CHƯA xác định** là endpoint trả rỗng hay lượt gọi cuối không tới nơi. Không đoán rồi vá mò
- [!] Luật `hong.length === 0` quá chặt: 12 ca hỏng đều là **ca đã xoá** trong thùng rác, đọc chi tiết hỏng là chuyện thường. Phải cho phép ca `da_xoa` hỏng mà vẫn khớp
- [x] Đã sửa phép đếm theo TẬP KHOÁ (commit `46b4c83`) — cần, nhưng chưa đủ để mở cổng

**Việc tiếp, sau ca 18h:**
1. Cho Worker trả lý do khi `/ca/danh-sach` ra rỗng, và cho app in lý do ấy ra.
2. Nới luật: ca `da_xoa` đọc hỏng thì bỏ qua, ca đang sống hỏng thì vẫn chặn.
3. Chạy lại, đối chiếu, rồi mới mở cổng.

### 11/09 17h15 — màn Ca thi ĐÃ sang máy chủ mới

- [x] "sửa luôn ca thi. chuyển sang hết cho tôi" | bằng chứng: commit `1d57d3c`, dấu `ca_day_du` trên D1 ghi **"da doi chieu · 85 ca · 277 lượt"**; bảng `ca` 86 dòng (85 ca thật + ca đo), tổng đã vào 277, đã nộp 275
- [x] NGUYÊN NHÂN GỐC của hai lượt chuyển hỏng trước: tôi đi **đếm lại** một thứ Apps Script **đã đếm sẵn**. `danhSachCa` trả về ba số đã vào / đã nộp / cảnh báo cho mọi ca trong đúng một lượt gọi; tôi lại mở chi tiết từng ca — 83 lượt gọi × 1,5–8 s = hơn 10 phút, chạy trong tab của thầy, chết lặng lúc 15h46 sau đúng 6 ca (đọc từ nhật ký Worker)
- [x] Bốn chỗ vá kèm: chốt chống bấm chồng · lượt chuyển ép đọc Apps Script (đọc D1 rồi ghi lại vào D1 là tự soi gương) · máy chủ không trả lời lượt đối chiếu thì NÉM LỖI · Worker lấy số lớn hơn giữa đếm sống và số chụp
- [x] Sáu cửa tại `1d57d3c`: `tsc` app + server sạch · **211 tệp / 3.144 phép kiểm / 0 đỏ** · check:mau sạch · hiển thị ĐẠT 18/18 · build Pages OK
- [ ] Mở ca 18h rồi đếm ca trên D1 trước khi em vào | bằng chứng: (chưa có)
- [ ] Mục Phân công + giao BTVN theo `claude/PHAN-CONG-GIAO-BTVN.md` — sau ca | bằng chứng: (chưa có)
- [ ] Đổi `MA_BI_MAT` — sau ca | bằng chứng: (chưa có)

**Bài học ghi to:** trước khi viết vòng lặp gọi máy chủ N lần, hỏi xem máy chủ
đã trả sẵn thứ mình định tự tính chưa. Ở đây câu trả lời là **rồi**, và nó nằm
ngay trong lượt gọi đầu tiên.

### 11/09 16h40 — PHÁT HIỆN LỚN: học sinh chưa bao giờ chạm máy chủ mới

Tra ca thật 237124 đang chạy:

```
ca có trên D1 : có    mốc bắt đầu : 16h10:24 (đã sang)    trạng thái : mở
lượt thi trên D1 : 0    em ở phòng chờ : 0    báo trạng thái : 0
```

**NGUYÊN NHÂN GỐC:** `MAC_DINH_MAY_CHU.BAT = false`, và chỗ DUY NHẤT ghi cấu
hình là `KhoiMayChuMoi.tsx` — màn Cài đặt trong app của thầy. Không có đường nào
đưa cấu hình ấy sang máy học sinh. Nên với mọi máy của em, cờ luôn TẮT và
`vaoThiQuaMayChuMoi` trả `null` ngay dòng đầu (`if (!ch.BAT) return null`).

**Toàn bộ phần tăng tốc của ngày 11/09 chưa tới được học sinh một giây nào.**
Máy chủ mới tới giờ chỉ phục vụ: lượt thầy đẩy ca, và các lượt đo tải.

**Vì sao tôi không thấy sớm hơn:** tôi đo bằng trang `/do-tai` do chính Worker
phục vụ — nó gọi thẳng Worker nên lúc nào cũng 0 lỗi, và che mất câu hỏi đáng
lẽ phải hỏi từ sáng: *máy của em lấy địa chỉ máy chủ mới ở đâu?* Câu trả lời là
**không ở đâu cả**.

**Cách chữa:** link mời đã mang sẵn `?examCode=...&api=<Apps Script>`, và
`ExamTakeScreen` đọc tham số `api` rồi `saveScriptUrl`. Thêm địa chỉ máy chủ mới
vào link y hệt cách ấy là mọi máy em tự có. Một tham số.

- [ ] Đưa địa chỉ máy chủ mới vào link của em (làm TRƯỚC mọi việc khác) | bằng chứng: (chưa có)
- [ ] Chuyển `chiTietCa` sang D1 — thầy báo 16h30 "vào chi tiết ca vẫn chậm" | bằng chứng: (chưa có)
- [ ] Mục Phân công + giao BTVN | bằng chứng: (chưa có)

**Bài học ghi to thứ hai trong ngày:** đo bằng công cụ chạy trên máy chủ thì chỉ
chứng minh máy chủ sống. Muốn biết NGƯỜI DÙNG có đi qua đó không thì phải đếm ở
chỗ dữ liệu của người dùng đọng lại — ở đây là bảng `luot` và `phong_cho`.

### 11/09 17h25 — ĐỢT 5C: địa chỉ tới máy em · xoá ca không ăn

**Việc 1 — địa chỉ máy chủ mới tới máy em.** Không đi đường link mời như dự
tính: link chỉ tới máy em, còn **máy phụ huynh** mở `/p#<mã>` thì không có tham
số nào cả, mà phiếu cũng đã nằm trên R2. Nên nạp từ `public/cau-hinh.json` —
đúng đường máy em vẫn dùng để biết link Apps Script.

Vòng 1 sai và **phép kiểm bắt được**: bản đầu tải tệp ấy NGAY TRONG lượt gọi máy
chủ, tức cộng một vòng mạng vào đúng lượt vào thi và nhân lên 135 nhịp lưu tạm
mỗi em. 14 phép kiểm đỏ ở 5 tệp, tất cả đều là phép đếm số lượt gọi. Sửa: nạp
**một lần lúc khởi động** (`main.tsx`), cất vào IndexedDB; đường nóng chỉ đọc
IndexedDB.

Vòng 2 sai và **phép kiểm khác bắt được**: `dangNap` bị dùng trước dòng khai báo
(`tests/khong-dung-bien-truoc-khi-khai.test.ts`). Đổi thứ tự.

- [x] Đưa địa chỉ máy chủ mới tới máy em VÀ máy phụ huynh | bằng chứng: `cbca67b`, 3190/3190 phép kiểm đạt
- [x] Lượt gọi đầu tiên của phụ huynh/của em không thua cuộc đua nạp địa chỉ (`xongNapDiaChi`) | bằng chứng: 4 phép kiểm mới trong `co-may-chu-toi-may-em-1109.test.ts`

**Việc 2 — "tôi không xoá được ca này" (ca 432566).** Tra thẳng D1:

```
ma_ca 432566 · ten_ca "2011 - Lớp 1 - L1 (bù)" · trang_thai 'mo' · xoa_luc ''
```

**NGUYÊN NHÂN GỐC:** màn Ca thi đã đọc `/ca/danh-sach` trên D1 từ sáng, nhưng
`xoaCa` vẫn CHỈ ghi sang Apps Script. Sheet đánh dấu `da_xoa` đúng như mọi khi,
D1 không biết gì, và ca vẫn nằm nguyên trên màn hình. Bấm mười lần cũng vậy — vì
lần nào cũng xoá thành công ở chỗ không ai nhìn.

Cùng lỗ hổng có **năm cửa**, không phải một: xoá · khôi phục · khoá · mở khoá ·
đổi tên. Chữa bằng đường `/ca/sua` trên Worker (chỉ `UPDATE`, danh sách trắng 7
ô) và `soiCaSangMayChuMoi` gọi sau mỗi lượt Apps Script trả `ok`.

- [x] Xoá/khôi phục/khoá/mở khoá/đổi tên ca soi sang D1 | bằng chứng: `tests/soi-thao-tac-ca-sang-may-chu-moi-1109.test.ts` 13/13 đạt
- [ ] Thầy bấm Xoá lại ca 432566 sau khi phát hành — lần này phải biến mất | bằng chứng: (chưa có)

**Bài học ghi to thứ ba trong ngày:** chuyển một màn sang đọc nguồn mới thì phải
rà **mọi lệnh GHI** vào nguồn cũ mà màn ấy hiển thị. Đọc và ghi lệch nguồn là
thao tác của thầy thành công ở chỗ không ai nhìn thấy.

### Còn lại

- [ ] `chiTietCa` sang D1 — thầy báo "vào chi tiết ca vẫn chậm". Kẹt thật: D1 chưa có `hoTen`, `diemI/II/III`, `tong`, `duyetBoi/Luc` của lượt; chép sang là một lượt chuyển dữ liệu điểm nữa | bằng chứng: (chưa có)
- [ ] Mở ca / bấm Bắt đầu chậm — `publishSession` vẫn ghi đề vào Sheet trước | bằng chứng: (chưa có)
- [!] "Sửa phần tin nhắn gửi cho phụ huynh" — CHƯA RÕ sửa gì. Đã đọc `src/lib/phieu-zalo.ts`, không tự đoán. Phải hỏi thầy.
- [ ] Mục Phân công + giao BTVN theo `claude/PHAN-CONG-GIAO-BTVN.md` | bằng chứng: (chưa có)
- [ ] Đổi `MA_BI_MAT` (lộ vào ảnh chụp 10/09) rồi cập nhật Secret trên Cloudflare | bằng chứng: (chưa có)
