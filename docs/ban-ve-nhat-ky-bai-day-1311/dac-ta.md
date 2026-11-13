# Đặc tả: Nhật ký bài dạy, bản vẽ lại (13/11/2026)

Thầy chê bản trước (13/11): «Html tôi muốn bạn thiết kế lại thông minh hiệu quả siêu đẹp, có hoạt họa kiến thức trong video. Chứ ko phải trích dẫn thế kia. Bạn hãy dựng lại sao cho hs phải phấn khích học siêu đẹp phải wow». Yêu cầu gốc: «… nhật kí bài dạy … màu mè hoạt họa cực đẹp … đính kèm vào một chỗ trong ảnh … áp dụng cho tất cả các live sau. Vẽ trước cho tôi xem để tôi duyệt trước khi build».

Ý mới: nhật ký KHÔNG chép lại nét bảng nữa. Sau mỗi buổi live, app dựng một **bài học hoạt hoạ giảng lại kiến thức** của buổi, từ chính những gì Thầy viết trên bảng. Mọi cảnh dựng bằng **7 khuôn hoạt hoạ có sẵn**, chạy theo dữ liệu JSON. **Thầy duyệt xong học sinh mới thấy.**

Đang ở bước 2 của quy trình 4 bước (`docs/quy-trinh-4-buoc-1310.md`). Chưa đụng `src/`, `server/`. Thầy chốt thì mới build.

## Xem bản vẽ

- Hai video (thầy xem chuyển động): `video-nhat-ky-may-tinh-1366.mp4` (39 giây, 2,2 MB, máy tính, nền sáng) và `video-nhat-ky-dien-thoai-390.mp4` (39 giây, 0,8 MB, điện thoại dọc, nền tối). Cả hai chạy lần lượt: bìa, kéo co ngang sức, công thức electron O₂, đoán nhanh H₂ (chạm đáp án rồi mở lời giải), lệch sức thành ion, ví dụ CH₄, thang Δχ, công thức electron CO₂.
- Mở chạy thật: `nhat-ky.html` (bài 12/11), `nhat-ky.html?kb=fes2` (bài tính FeS₂), `duyet.html` (màn của Thầy), `cho-gan.html` (màn Xem lại Live có thẻ mới). Mở thẳng từ ổ đĩa vẫn chạy nhờ `kich-ban-nhung.js` (tự sinh từ hai tệp JSON).
- Chụp lại ảnh, quay lại video, tự soát: `node docs/ban-ve-nhat-ky-bai-day-1311/chup.mjs --video`. Kết quả soát nằm ở `soat.json`.

| Ảnh | Nội dung |
|---|---|
| 01 | Máy tính 1366, sáng: bìa (bảng kéo co chạy lặp ba pha), mục lục cảnh bên trái, cảnh 1 |
| 02 | Máy tính 1366, tối: Ví dụ 1 CH₄ (sơ đồ cột dọc, Δχ = 2,55 − 2,20 = 0,35) và thang Δχ |
| 03 | Điện thoại ngang 844, sáng: bìa hai cột |
| 04 | Điện thoại ngang 844, tối: công thức electron O₂, đếm 8 electron mỗi O |
| 05 | Điện thoại dọc 390, sáng: bìa, nút «Bắt đầu từ cảnh 1», bảng kéo co |
| 06 | Điện thoại dọc 390, tối: Đoán nhanh H₂ sau khi em chạm, hoạt hoạ mở đáp án |
| 07 | Khung giữa hoạt hoạ, 1366 tối: cặp electron vừa bị giữ hẳn, hai bên thành ion |
| 08 | Khung giữa hoạt hoạ, 390 sáng: công thức electron O₂ đang vẽ từng cặp dùng chung |
| 09 | Khung giữa hoạt hoạ, 844 sáng: kim CH₄ đang chạy trên thang Δχ |
| 10 | Bài FeS₂ (kịch bản mẫu), 1366 sáng: sơ đồ cột dọc + phép tính từng thừa số + lời nói từng thừa số |
| 11 | Màn Thầy duyệt, 1366 sáng: hai điều cần chốt, danh sách cảnh có cờ, cảnh thang Δχ đang xem, app kiểm số |
| 12 | Chỗ gắn, 1366 sáng: thẻ «Nhật ký bài dạy» ngay dưới bìa Xem lại Live, hình thu nhỏ đang hoạt hoạ |
| 13 | Chỗ gắn, 390 sáng: thẻ nằm trong màn đầu |

Ô viền đứt màu tím trên trang học sinh là ghi chú của bản vẽ (không có trong app thật): nhắc chỗ đang chờ Thầy chốt.

## Quy trình sau mỗi buổi live

| Bước | Ai làm | Việc |
|---|---|---|
| 1 | App (có sẵn) | Thầy bấm kết thúc live, app chốt buổi (`chotThat` trong `server/src/live-xem-lai.ts`), ghi `net.bin` (mọi nét, có giờ). |
| 2 | Máy thầy | Ngay sau khi chốt, máy thầy dựng **ảnh từng trang bảng** từ nét (canvas, cùng bộ vẽ nét của trình phát; chia trang theo luật cũ: bảng mới, xoá hết, nghỉ viết từ 45 giây). Mỗi trang một ảnh PNG 1600 × 900, nền bảng, có vạch 2/3 để A.I biết cột trái / cột phải. Tải ảnh lên R2. Lý do làm trên máy thầy: Worker không có canvas, Claude API không nhận ảnh SVG. |
| 3 | Máy chủ gọi Claude API | Gửi ảnh các trang + tên buổi, lớp, câu đã chữa + lời nhắc hệ thống (luật nội dung ở mục 4) + lược đồ `luoc-do.json` qua `output_config.format` (structured outputs: JSON trả về đúng lược đồ, chỉ dùng 7 khuôn). Mô hình mặc định `claude-opus-5-5`, effort `high`. |
| 4 | App kiểm | Lược đồ, số, chữ (mục «Máy kiểm số»). App điền phút nghe từ giờ của nét. Sai số: gọi lại một lần, kèm danh sách lỗi. Vẫn sai: cảnh mang cờ đỏ, mặc định không vào bài. |
| 5 | **Thầy duyệt** | Thông báo «Nhật ký buổi 12/11 chờ Thầy duyệt». Thầy mở `duyet.html`: chốt các điểm app hỏi, sửa, bỏ cảnh, đưa đề xuất vào, rồi «Duyệt cả bài». |
| 6 | Học sinh | Thẻ «Nhật ký bài dạy» hiện ở màn Xem lại Live của đúng lớp đó. |

Học sinh không thấy gì cho tới bước 5. Bản chờ duyệt KHÔNG đi qua cửa `/live-tep` của học sinh (máy chủ chặn, không chỉ ẩn trên màn).

## 1. Mục tiêu sư phạm, ai dùng

- **Học sinh** lớp của buổi live: xem lại KIẾN THỨC của buổi trong khoảng 4 phút, bằng hoạt hoạ dễ nhớ, có câu đoán nhanh để tự thử. Không phải tua 38 phút tiếng.
- **Thầy**: duyệt trong 2 đến 3 phút sau buổi; mọi chỗ app chưa chắc hay ngoài bảng được đánh dấu nổi rõ.
- **Cảm giác**: phấn khích, «wow» nhưng sạch. Điểm nhấn duy nhất của trang là bảng kéo co ở bìa: hai nguyên tử, cặp electron trượt theo lực kéo, đứt dây thành ion. Các cảnh khác yên hơn, mỗi cảnh một ý.
- **Thật thà**: luồng chính chỉ gồm điều có trên bảng. Mọi điều ngoài bảng là đề xuất, chỉ vào bài khi Thầy chọn. Con số do app tính lại, không tin số A.I đọc.

## 2. Bố cục

**Trang học sinh** (`nhat-ky.html`), từ trên xuống, như nhau ở ba khổ:

1. Thanh trên dính: nút lùi, «Nhật ký bài dạy», tên buổi, «Cảnh 3/11» + vạch tiến độ.
2. Bìa (tím, cùng họ với bìa Xem lại Live): tên bài, ngày, lớp, một câu mời, nút chính duy nhất «Bắt đầu từ cảnh 1». Bảng kéo co chạy lặp: dải «Ngang sức · Lệch sức · Chênh lệch lớn» sáng lần lượt, khung kết luận vẽ bằng phấn như khung Thầy đóng trên bảng.
3. Các cảnh. Mỗi cảnh: số thứ tự, nhãn khuôn (Hình dung, Quy tắc, Công thức electron, Ví dụ, Thang Δχ, Đoán nhanh, Tổng kết), tên cảnh, BẢNG ĐEN hoạt hoạ, cột «Thầy giảng» (lời hiện theo đúng nhịp hoạt hoạ), nút «Xem lại cảnh này». Cảnh tự chạy khi cuộn tới (35 % lọt màn).
4. Tổng kết: các ý chốt, mỗi ý một nút «Nghe Thầy giảng đoạn này · 03:10».
5. Chân trang: «Thầy Đỗ Đại Học · chỉ lớp Live Khối 10 xem được nhật ký này».

Theo khổ: **điện thoại dọc** một cột, bảng trên, lời dưới; bảng kéo co tự chuyển bố cục gọn để chữ trên bảng không dưới 15 px. **Điện thoại ngang** bìa hai cột, cảnh hai cột. **Máy tính** mục lục cảnh dính bên trái (từ 1180 px), cảnh hai cột (bảng 60 %, lời 40 %).

**Màn Thầy duyệt** (`duyet.html`, máy tính là chính, điện thoại xếp một cột): thanh trên có trạng thái «Chờ Thầy duyệt · học sinh chưa thấy» và nút chính «Duyệt cả bài»; dòng tóm tắt (số trang app đọc, số cảnh, đề xuất, cảnh chưa chắc, số con số khớp, chi phí buổi); cột trái «Thầy chốt trước khi duyệt» + danh sách cảnh có cờ; cột phải cảnh đang chọn: xem trước đúng như học sinh thấy, «Trên bảng Thầy viết (app đọc được)», «App kiểm lại số», lời Thầy, nút «Sửa câu này», «Bỏ cảnh này» (đề xuất: «Đưa vào bài»).

Cờ trên màn Thầy (chủ ngữ là «App», theo bảng từ chuẩn): đỏ «App không thấy trên bảng» / «Ngoài bảng · đề xuất» / «N chỗ sai số»; vàng «App chưa chắc»; tím «Cần Thầy chốt»; xanh «Khớp bảng».

**Chỗ gắn** (`cho-gan.html`): giữ đúng chỗ Thầy đã thấy, thẻ ngay dưới bìa Xem lại Live. Hình thu nhỏ là cảnh kéo co của bài đang chạy lặp; dòng «11 cảnh hoạt hoạ · 2 câu đoán nhanh»; viên «Mở nhật ký». Cả thẻ là một nút. Nút chính của màn vẫn là «Phát đoạn chữa bài». Phần còn lại của màn Xem lại không đổi.

## 3. Trạng thái

| Trạng thái | Học sinh | Thầy |
|---|---|---|
| Đang dựng (bước 2 đến 4, thường dưới 2 phút) | Không có thẻ | Lịch sử Live: «Đang dựng nhật ký» |
| Chờ duyệt | Không có thẻ | Thông báo + «Nhật ký chờ duyệt»; nhắc lại một lần sau 24 giờ |
| Đã duyệt | Thẻ + trang như bản vẽ | «Đã duyệt · lớp đã thấy», nút «Gỡ khỏi lớp» |
| Không dựng được (mục 5) | Không có thẻ | Lý do bằng chữ thường + «Dựng lại» |
| Đang tải trang | Khung xương: bìa, hai cảnh; chữ «Đang mở nhật ký…» | Như vậy |
| Lỗi tải | «Chưa tải được nhật ký. Em thử lại.» + «Thử lại» | «Chưa tải được kịch bản.» + «Thử lại» |
| Mất mạng | Đã mở thì hiện bản đã nhớ; chưa mở thì «Máy em đang mất mạng. Có mạng lại thì nhật ký tự tải.» | Như vậy |
| Đoán nhanh: chưa chạm / đã chạm | Chỉ có câu hỏi và đáp án / đúng sai + lời giải + hoạt hoạ mở đáp án | Xem trước như học sinh |
| Giảm chuyển động | Mọi cảnh hiện sẵn hình cuối, lời hiện đủ | Như vậy |
| Máy yếu (`ddh.mayYeu`) | Bỏ bụi phấn, bỏ quầng sáng, bỏ mờ nền thanh trên; hoạt hoạ chính giữ | Như vậy |

## 4. Dữ liệu

**Nguồn sẵn có:** `net.bin` (nét, màu, giờ), `buoi.json` (lớp, ngày, câu, đoạn), `tieng.mp3` (khi em bấm nghe).

**Thêm (chỉ thêm):** trên R2 cạnh tệp của buổi: `trang-<n>.png` (ảnh trang bảng, chỉ máy chủ đọc), `nhat-ky-nhap.json` (bản chờ duyệt, chỉ lệnh của Thầy đọc), `nhat-ky.json` (bản đã duyệt, đi qua `/live-tep` với vé của buổi). `BuoiLiveJson.nhatKy?: { canh, doanNhanh, trangThai }` để thẻ hiện số ngay. Bản đã duyệt chỉ giữ phương án Thầy chọn (ví dụ không in tên thì tên trên bảng bị xoá khỏi tệp, không chỉ ẩn).

**Ai điền gì trong kịch bản** (mẫu: `kich-ban-lien-ket.json`):

| Phần | Ai | Trường |
|---|---|---|
| Nội dung cảnh | A.I (theo `luoc-do.json`) | `canh[].khuon, tieuDe, duLieu, deXuat`, `nguon.trang / cot / chep` (chép nguyên văn bảng, chỉ Thầy thấy), `may.chuaChac / ngoaiBang`, `canChot`, `bia` |
| Giờ nghe | App | `nguon.giay`, `tong-ket.y[].giay`: giờ của nét đầu tiên trong trang và cột đó (A.I không thấy giờ trên ảnh) |
| Kiểm | App | kết quả kiểm số, cờ đỏ |
| Quyết định | Thầy | `duyet`: phương án đã chốt, cảnh bỏ, đề xuất đưa vào, chữ đã sửa |

**Lược đồ từng khuôn** (đủ ở `luoc-do.json`; thư viện ở `khuon.js`, giao diện `khuon.css`):

| Khuôn | Dữ liệu | Hoạt hoạ |
|---|---|---|
| `keo-co` | `trai / phai {nhan, ky?}`, `anSo`, `pha[] {chiTrai?, chiPhai?, loai, chu, loi[], ketLuan}` | Hai nguyên tử, mũi tên lực dài theo χ, cặp electron (chấm / x) và đám mây trượt về bên χ lớn theo Δχ; loại ion: dây đứt, cặp electron về hẳn bên mạnh, hai bên co / giãn, hiện «+» «−»; khung kết luận vẽ bằng phấn. Có `ky` thì χ lấy từ bảng của app. |
| `thang-delta` | `max`, `kim[] {nhan, a, b, delta, loai, chu}`, `loiMo[]`, `loi[]` | Thang ba vùng (hoặc hai vùng nếu Thầy chọn giữ đúng bảng), kim chạy tới giá trị, vùng và ô tên sáng lên |
| `lewis` | `congThuc`, `nguyenTu[] {ky, kieu: cham / x, vt?}`, `lienKet[] {a, b, cap}`, `capRieng[]`, `nhanChung`, `loi[3]` | Kí hiệu hiện, từng cặp riêng tự vẽ, từng cặp dùng chung vẽ ở giữa (màu vàng), khung vùng dùng chung, đếm «8 e» dưới mỗi nguyên tử |
| `quy-tac` | `nhan`, `mau`, `dong[]` (có `**nhấn**`), `viDu[]`, `loi[]` | Khung phấn tự vẽ, chữ hiện từng từ, khung sáng |
| `vi-du-cot-doc` | `de`, `soDo.chat[] {ct, heSo, so[]}`, `soDo.muiTen[] {tren}`, `tinh {ten, thuaSo[] {dau, hien, gt hoặc tu/mau, noi, tro, loai…}, ketQua}` | Sơ đồ cột dọc của Thầy: chất, mũi tên (hiệu suất ghi trên), số liệu ghi dưới từng chất; phép tính hiện từng thừa số, ô số liệu liên quan sáng lên, lời nói từng thừa số hiện ở cột «Thầy giảng»; hệ số «2» bật lên ở sơ đồ khi nói bảo toàn nguyên tố |
| `doan-nhanh` | `hoi`, `luaChon[] {chu, dung}`, `giai`, `mo {khuon, duLieu}` (một trong keo-co, thang-delta, lewis, quy-tac) | Câu hỏi, đáp án chạm được; chạm xong mới hiện đúng / sai, lời giải và hoạt hoạ mở đáp án |
| `tong-ket` | `y[] {chu, canh, giay}` | Từng ý hiện, dấu tích tự vẽ, nút «Nghe Thầy giảng đoạn này · mm:ss» |

**Luật nội dung gửi A.I** (trong lời nhắc hệ thống): luồng chính chỉ điều có trên bảng; điều ngoài bảng thì `deXuat: true` hoặc ghi `may.ngoaiBang`; chữ viết tắt của bảng (VD, LK, CHT, KPC, ntố, QT) viết đủ trên màn học sinh; tên người trên bảng không in, đưa vào `canChot`; số khác SGK thì giữ lời Thầy và đưa vào `canChot`; thuật ngữ chương trình 2018; xưng «Thầy», câu không quá 30 chữ, không emoji, không «—», không ẩn dụ tiền / nhà; bài tính theo `docs/tu-duy-day-hoa-thay-2610.md` (sơ đồ cột dọc, bảo toàn nguyên tố một phép tính, xuôi × H/100, ngược × 100/H, lời nói đúng bảng thừa số); câu đoán nhanh chỉ dùng chất có trên bảng; không rút câu tự luận.

**Bằng chứng dùng được cho mọi buổi:** `kich-ban-fes2.json` là bài TÍNH TOÁN khác hẳn chủ đề (1 tấn quặng 8 % FeS₂, H = 90 %, m SO₂ = 10⁶ · 8/100 · 1/120 · 2 · 64 · 90/100 · 1/1000 = 76,8 kg), dựng bằng đúng thư viện khuôn đó, không thêm dòng mã nào.

## Máy kiểm số (app, không tin số A.I)

Chạy ở `khuon.js` (`kiemKichBan`), kết quả hiện trên `duyet.html`. Bản vẽ: bài 12/11 **26 con số khớp, 0 sai**; bài FeS₂ **9 khớp, 0 sai** (chạy với cả hai phương án ngưỡng).

- **Bảng cố định của app**: độ âm điện Pauling (H 2,20; C 2,55; N 3,04; O 3,44; F 3,98; Na 0,93; Cl 3,16; K 0,82), electron lớp ngoài, nguyên tử khối. Kịch bản không được mang số χ riêng: có `ky` thì app tra bảng.
- `keo-co`, `thang-delta`: tính lại Δχ = |χa − χb|, so số A.I ghi (lệch quá 0,005 là sai); xếp vùng theo ngưỡng Thầy chọn, so loại liên kết A.I ghi.
- `lewis`: mỗi nguyên tử góp đúng số electron lớp ngoài (2 × cặp riêng + số cặp chung), quanh có 8 (H có 2).
- `vi-du-cot-doc`: đọc lại từng thừa số từ chữ hiện («10⁶», «8/100», «2,55») so với giá trị; χ và M ghi trên sơ đồ so với bảng; thừa số có `loai` thì kiểm đúng nghĩa: `chia-M` (1/M), `nhan-M` (M), `bao-toan` (đếm nguyên tố trong hai công thức), `hieu-suat-xuoi` (H/100), `hieu-suat-nguoc` (100/H); tính lại cả chuỗi, so kết quả.
- `doan-nhanh`: đúng một đáp án đúng; kiểm luôn hoạt hoạ mở đáp án.
- **Chữ**: câu quá 30 chữ, «—», emoji, chữ tiền / nhà / giàu / thuế, viết tắt của bảng, lộ mã khuôn. `chup.mjs` soát thêm trên trang đã dựng: 0 lỗi ở 10 ảnh trang học sinh.
- **Thầy sửa** trên `duyet.html` thì app kiểm lại ngay (ví dụ sửa 0,35 thành 0,45 ở cảnh CH₄ thì hiện «Tính lại cả chuỗi: Δχ = 0,35 (kịch bản ghi 0,45)» màu đỏ).

## 5. Ngoại lệ, và khi app KHÔNG sinh được

- **Bảng chủ yếu là hình vẽ** (sơ đồ thí nghiệm, đồ thị) hoặc nội dung không khớp khuôn nào: A.I không được bịa khuôn; phần đó vào `canChot` («Trang 3 là hình vẽ dụng cụ, chưa có khuôn»). Dưới 3 cảnh dùng được thì không dựng nhật ký; Thầy thấy lý do + «Dựng lại». Học sinh không thấy thẻ.
- **Chữ khó đọc**: cảnh mang cờ «App chưa chắc» kèm chỗ chưa chắc (bản vẽ: «Angola», «QT₃»). Cả trang đọc không ra thì vào `canChot`; Thầy gõ lại ở «Sửa câu này».
- **Thầy viết dở** (bản vẽ: «H₂ →», «VD2 … →»): không tự viết tiếp vào luồng chính; được soạn câu đoán nhanh từ quy tắc ngay trên bảng (cờ vàng), kết luận ngoài bảng thì thành đề xuất.
- **Số sai sau một lần gọi lại**: cảnh cờ đỏ, mặc định không vào bài cho tới khi Thầy sửa.
- **Ngưỡng / quy ước khác SGK**: giữ lời Thầy, hỏi Thầy (bản vẽ: «> 1,7» và mốc 0,4).
- **Buổi dưới 20 nét, không có bảng, hoặc chỉ chữa câu không viết lý thuyết**: không gọi API (không tốn tiền), không có nhật ký.
- **Gọi API lỗi / hết hạn mức**: thử lại sau 1, 5, 30 phút; sau 3 lần thì «Chưa dựng được nhật ký» + «Dựng lại».
- **Thầy không duyệt**: không hiện gì cho học sinh; nhắc một lần sau 24 giờ.
- **Chữ dài, công thức dài**: phép tính tự xuống dòng theo thừa số; tên cảnh tối đa 2 dòng; bảng kéo co điện thoại dọc dùng bố cục gọn.
- **Bấm lặp**: «Xem lại cảnh này» chạy lại từ đầu, không chồng hoạt hoạ; ở cảnh đoán nhanh thì xoá lựa chọn để em đoán lại.
- **Đổi tab / cuộn khỏi cảnh**: vòng lặp nền dừng; quay lại thì chạy tiếp.
- **Buổi không có tiếng**: không có nút «Nghe».
- **Buổi cũ** (trước khi có tính năng): chỉ dựng khi Thầy bấm «Dựng nhật ký» trong Lịch sử Live (tốn một lượt gọi).

## 6. Chi phí máy chủ, chi phí A.I, tốc độ, ai xem được

**Chi phí A.I mỗi buổi** (giá tra bằng skill `claude-api`, bảng giá cập nhật 03/11/2026; cách tính token ảnh tra tài liệu Vision của Anthropic):

- Giá: Claude Opus 5.5 `claude-opus-5-5` **4 USD / 1 triệu token vào, 20 USD / 1 triệu token ra**. Claude Sonnet 5.5: 2 / 10. Claude Haiku 5.5: 0,10 / 0,50. Gửi theo lô (Batch API): giảm 50 %, trả kết quả chậm hơn (thường dưới 1 giờ), hợp vì Thầy duyệt sau.
- Token ảnh = ⌈rộng / 28⌉ × ⌈cao / 28⌉. Ảnh trang 1600 × 900 = 58 × 33 = **1 914 token** (không bị thu nhỏ; trần 4 784 token, cạnh dài 2 576 px). Cắt ảnh sát vùng có chữ thì rẻ hơn.
- Lời nhắc hệ thống + lược đồ + bảng số: khoảng 8 000 token. Kết quả JSON 3 000 đến 5 000 token, cộng phần suy nghĩ của mô hình (Opus 5.5 không tắt được suy nghĩ, tính như token ra): ước tổng token ra 8 000 đến 20 000.

| Buổi | Token vào | Token ra | Opus 5.5 | Opus 5.5 theo lô | Sonnet 5.5 | Sonnet 5.5 theo lô |
|---|---|---|---|---|---|---|
| 2 trang bảng (như 12/11) | ≈ 12 000 | 8 000 đến 15 000 | 0,21 đến 0,35 USD | 0,10 đến 0,17 | 0,10 đến 0,17 | 0,05 đến 0,09 |
| 6 trang | ≈ 19 500 | 10 000 đến 18 000 | 0,28 đến 0,44 USD | 0,14 đến 0,22 | 0,14 đến 0,22 | 0,07 đến 0,11 |
| 10 trang | ≈ 27 000 | 12 000 đến 20 000 | 0,35 đến 0,51 USD | 0,17 đến 0,25 | 0,17 đến 0,25 | 0,09 đến 0,13 |

- Gọi lại khi số sai: tối đa thêm một lượt (trường hợp xấu nhất gấp đôi).
- Ví dụ 20 buổi live mỗi tháng, mỗi buổi 6 trang: Opus 5.5 khoảng **6 đến 9 USD / tháng**; theo lô khoảng 3 đến 4,5 USD; Sonnet 5.5 theo lô khoảng 1,4 đến 2,2 USD. Quy ra tiền Việt theo tỉ giá giả định 26 000 đồng / USD (chưa tra): 0,35 USD ≈ 9 100 đồng một buổi.
- Đây là **ƯỚC**, chưa gọi thật lần nào. Phần suy nghĩ là ẩn số lớn nhất: cần đo trên 3 buổi thật (app ghi `usage` mỗi lượt, hiện ở dòng tóm tắt của màn duyệt như bản vẽ: «0,26 USD, 12 100 token vào, 10 400 token ra»).
- Bộ nhớ đệm lời nhắc không giúp được: bộ đệm sống vài phút đến 1 giờ, hai buổi live cách nhau cả ngày.
- **Thầy sửa, đổi phương án, duyệt: 0 lượt gọi A.I** (app dựng lại và kiểm lại ngay trên máy).

**Máy chủ:** mỗi buổi 1 lượt gọi ra ngoài (Claude API), ghi R2 thêm 2 đến 12 tệp (ảnh trang, bản nháp, bản duyệt), **0 lượt D1** khi học sinh mở. Duyệt: 1 lượt ghi R2 + sửa `buoi.json`. Không thêm vòng chờ nối tiếp vào lệnh nóng nào. App chưa có khoá Claude API trên Worker (hiện dùng Gemini cho A.I Đỗ Đại Học): cần thêm một khoá bí mật.

**Tốc độ tải:** trang nhật ký là mảnh nạp lười, chỉ tải khi em bấm «Mở nhật ký»: thư viện khuôn khoảng 65 KB chưa nén, khoảng 20 KB khi nén gzip (bản vẽ: `khuon.js` + `khuon.css`, chưa rút gọn), kịch bản 8 đến 15 KB. Thẻ ở Xem lại Live: số cảnh nằm sẵn trong `buoi.json`; hình thu nhỏ hiện khung tĩnh trước, chỉ nạp khuôn kéo co khi thẻ vào màn. Lượt mở ba app không thêm byte nào (`npm run kiem:toc-do` 0 đỏ). Hoạt hoạ chỉ đổi transform / opacity (khung phấn vẽ bằng stroke-dashoffset, ít phần tử), không thư viện ngoài, mỗi lúc chỉ cảnh đang xem chạy.

**Ai xem được:** chỉ lớp của buổi (cùng vé `/live-tep` của Xem lại Live) và Thầy, SAU khi Thầy duyệt. Bản chờ duyệt và ảnh trang chỉ lệnh của Thầy đọc được. Phụ huynh không có ở đợt này.

**An toàn đáp án:** nhật ký chỉ đọc bảng của phần đã chữa (không lấy đoạn câu chưa mở đáp án, đúng luật an toàn của Xem lại Live). Đáp án câu **Đoán nhanh** nằm sẵn trong kịch bản trên máy em: đây là câu luyện trong bài, không chấm điểm, không EXP, không lấy từ kho đề thi / kiểm tra / bài tập về nhà. Luật CLAUDE.md chưa có ngoại lệ cho loại câu này: cần Thầy chốt (mục 9).

## 7. Nghiệm thu đo bằng máy

- vitest: `tests/nhat-ky-kiem-so-1311.test.ts` (Δχ, Lewis, M, bảo toàn, hiệu suất, chuỗi phép tính; số sai thì bắt được), `tests/nhat-ky-luoc-do-1311.test.ts` (hai kịch bản mẫu hợp lược đồ; lược đồ không dùng từ khoá structured outputs không nhận), `tests/nhat-ky-chu-hs-1311.test.ts` (luật chữ học sinh), `tests/nhat-ky-dien-gio-1311.test.ts` (phút nghe lấy từ nét theo trang + cột), `tests/nhat-ky-duyet-chan-1311.test.ts` (vé học sinh đọc bản chờ duyệt: bị chặn; tên trên bảng bị xoá khỏi bản duyệt khi Thầy chọn không in), `tests/nhat-ky-khuon-1311.test.tsx` (7 khuôn dựng được, tua tới cuối khi giảm chuyển động, máy yếu bỏ hạt và quầng).
- `tsc`, toàn bộ vitest so tên với `main`, `npm run build && npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0, `npm run check:mau` 0, `npm run kiem:co-tep`, `node scripts/kiem-sw.mjs`.
- Ảnh Chromium bản build thật 3 khổ, sáng và tối: 0 lỗi trang, 0 tràn, 0 đích bấm dưới 44 px, 0 lỗi chữ học sinh. Bản vẽ này đã đạt: `soat.json` 13 ảnh, 0 lỗi trang, 0 tràn, 0 đích nhỏ, 0 chữ cắt, 0 lỗi chữ học sinh, 0 ảnh quá 150 KB; hai video 39 giây, 2,2 MB và 0,8 MB.
- Tác tử `toc-do` sau khi gộp: byte tải mở, chạm được, khung hình khi cuộn trang nhật ký ở CPU ×4 và ×6.

## 8. Điều chưa chắc

1. **Độ chính xác đọc bảng viết tay** của mô hình: chưa đo. Đề nghị chạy thử trên 3 buổi đã có (không cho học sinh thấy), so với bảng thật, rồi mới bật.
2. **Số token suy nghĩ** (chi phí): như trên.
3. **Thứ tự cảnh** A.I đề xuất có thể khác thứ tự Thầy giảng; bản build cho Thầy kéo đổi chỗ (bản vẽ chưa có).
4. **Nhảy đúng phút** trong trình phát: trình phát hiện nhận «tới đoạn N»; cần thêm «tới giờ T» (chạm `TrinhPhat.tsx`).
5. **Màu**: bản vẽ chép đúng giá trị biến màu của app học sinh, màn chiếu, bốn màu phấn; bản build phải dùng biến (không hex thô) cho qua `check:mau` và `kiem:mau-giu`.

## 9. Quyết định cần Thầy chốt

1. **Chi phí mỗi buổi + bước Thầy duyệt.** Mỗi buổi khoảng 0,21 đến 0,51 USD với Opus 5.5 (khoảng 6 đến 9 USD / tháng nếu 20 buổi), một nửa nếu gửi theo lô, một nửa nữa nếu dùng Sonnet 5.5. Thầy chọn: (a) Opus 5.5 gửi ngay, (b) Opus 5.5 theo lô (đề nghị: rẻ một nửa, Thầy vẫn duyệt sau), (c) Sonnet 5.5 theo lô (rẻ nhất, cần thử độ đúng). Và Thầy đồng ý **mỗi buổi phải duyệt** (khoảng 2 đến 3 phút) trước khi học sinh thấy. Cần thêm khoá Claude API vào máy chủ.
2. **CO₂ (ngoài bảng).** Thầy dừng ở «O ⁘ C ⁘ O →». Đề xuất P1: liên kết C=O có Δχ = 3,44 − 2,55 = 0,89 nên phân cực; phân tử CO₂ thẳng, hai liên kết kéo ngược chiều nên cả phân tử không phân cực. Đưa vào bài hay không.
3. **Ví dụ thêm NaCl, HCl (ngoài bảng).** Đề xuất P2: NaCl Δχ = 3,16 − 0,93 = 2,23 nên liên kết ion; HCl Δχ = 3,16 − 2,20 = 0,96 nên cộng hoá trị phân cực. Đưa vào bài hay không.
4. **Ngưỡng Δχ.** Bảng ghi «Δχ > 1,7 ⇒ liên kết ion», không ghi mốc 0,4. SGK Hoá 10 (2018): 0 ≤ Δχ < 0,4 không phân cực; 0,4 ≤ Δχ < 1,7 phân cực; Δχ ≥ 1,7 ion. Bản vẽ hiện theo SGK. Thầy chọn: theo SGK, hay giữ đúng bảng (thang chỉ hai vùng). Áp dụng cho các cảnh 5, 6, 8 và tổng kết.
5. **In tên hai bạn Thầy ví trên bảng** («Hùng», «Kiên»). Bản vẽ không in, ghi «Bên trái», «Bên phải». In hay không; và từ nay tên người trên bảng mặc định không in.
6. **Nghe tiếng Thầy (chuyển giọng thành chữ).** Claude API không nhận tiếng, cần thêm dịch vụ chuyển giọng: **chưa tra giá**. Có thì nhật ký lấy được cả điều Thầy NÓI mà không viết (ví dụ kết luận CO₂), cờ «chưa chắc» ít hơn; tốn thêm tiền và một bước. Đợt 1 đề nghị chưa làm.
7. **Đáp án Đoán nhanh nằm trên máy em** (câu luyện trong bài, không điểm, không EXP). Đồng ý thì ghi thêm ngoại lệ này vào luật đáp án.
8. **Từ mới:** «Cảnh» (một phần của nhật ký; không dùng «đoạn» vì «Đoạn» đã là khúc xem lại) và «Đoán nhanh». Đồng ý thì thêm hai dòng vào `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`.
9. **Chỗ gắn:** giữ ngay dưới bìa Xem lại Live như bản trước.
10. **Buổi cũ:** chỉ dựng khi Thầy bấm (mỗi buổi tốn một lượt gọi), hay dựng hết các buổi còn lưu.
