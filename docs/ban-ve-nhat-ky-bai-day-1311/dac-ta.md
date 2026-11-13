# Đặc tả: Nhật ký bài dạy (bản vẽ chờ Thầy duyệt, 13/11/2026)

Lời Thầy 13/11: «dựng thêm 1 bản html hoạt họa theo những gì thầy viết trên bảng, thiết kế thành một file html siêu đẹp gọi là nhật kí bài dạy […] đính kèm vào một chỗ trong ảnh thật hợp lý đẹp mắt. áp dụng cho tất cả các live sau. Vẽ trước cho tôi xem để tôi duyệt trước khi build».

Đang ở bước 2 của quy trình 4 bước (`docs/quy-trinh-4-buoc-1310.md`). Chưa có dòng mã nào trong `src/`, `server/`. Thầy chốt ảnh thì mới build.

## Xem bản vẽ

- Mở chạy thật: `docs/ban-ve-nhat-ky-bai-day-1311/nhat-ky.html` (trang nhật ký) và `cho-gan.html` (màn Xem lại Live có thẻ mới). Mở thẳng bằng trình duyệt, hoạt hoạ chạy ngay.
- Ảnh Chromium thật, 3 khổ, sáng và tối (chụp lại: `node docs/ban-ve-nhat-ky-bai-day-1311/chup.mjs`). Tự soát của máy ở `soat.json`: 23 ảnh, lỗi trang 0, tràn ngang 0, đích bấm nhỏ hơn 44 px 0, chữ bị cắt 0, ảnh quá 150 KB 0.

| Ảnh | Nội dung |
|---|---|
| 01, 02 | Nhật ký, máy tính 1366, sáng và tối: bìa, số liệu, phấn Thầy dùng, bảng tua nhanh, thanh mực |
| 03, 04 | Máy tính: «Bảng theo từng trang» (thẻ trang, mốc giờ bên trái), sáng và tối |
| 05 | Máy tính: «Bảng cuối buổi» (hai bảng hoàn chỉnh) và chân trang |
| 06, 07, 08 | Điện thoại ngang 844: bìa sáng và tối, các trang xếp hai cột |
| 09, 10 | Điện thoại dọc 390: bìa sáng và tối |
| 11 | Điện thoại dọc: dải «Ý Thầy đóng khung» (vuốt ngang) và thẻ trang |
| 12 | Điện thoại dọc, tối: các thẻ trang |
| 13 | Hoạt hoạ: tua nhanh cả bảng đang viết dở (đầu phấn màu cam đang chạy) |
| 14, 15 | Hoạt hoạ: nét của từng trang đang tự vẽ lại khi cuộn tới (máy tính tối, điện thoại sáng) |
| 16 | TUỲ CHỌN, cần Thầy quyết: tên từng trang do A.I Đỗ Đại Học gợi ý |
| 17, 18 | Chỗ gắn trên màn Xem lại Live, máy tính 1366, sáng và tối (phương án đề nghị: ngay dưới bìa) |
| 19, 20 | Chỗ gắn, điện thoại ngang 844 |
| 21, 22 | Chỗ gắn, điện thoại dọc 390 (thẻ nằm trong màn đầu, chưa cần cuộn) |
| 23 | Phương án phụ: thẻ nằm dưới «Dòng thời gian», đúng chỗ đang trống trong ảnh của Thầy (màn 1440 × 900) |

Nét trong bản vẽ là NÉT MẪU giả nét viết tay (`net-mau.js`, dựng bằng `dung-net-mau.mjs`), cùng dạng dữ liệu với nét thật: màu, cỡ, giờ bắt đầu, từng điểm. Nội dung đúng bài 12/11: O₂ và H₂, Δχ ≥ 1,7, VD1 CH₄ (2,55 và 2,20, Δχ = 0,35), VD2 CO₂ (3,44 và 2,55, Δχ = 0,89), phân tử CO₂ thẳng nên không phân cực. Mọi con số còn lại trên trang (6 trang, 3 ý, 5 phút, tỉ lệ phấn, số nét, mốc giờ) là máy tự đếm từ nét mẫu, không gõ tay.

## 1. Mục tiêu sư phạm, ai dùng

- **Ai dùng:** học sinh của lớp có buổi live. Thầy mở xem được từ Lịch sử Live. Phụ huynh không có ở đợt này.
- **Việc cần làm cho em:** sau buổi live, em xem lại ĐÚNG bảng Thầy đã viết, theo đúng thứ tự Thầy viết, trong 2 đến 3 phút. Không phải tua 38 phút tiếng để tìm một dòng.
- **Ba câu hỏi trang phải trả lời ngay:** Hôm đó Thầy viết những gì? Ý nào Thầy coi là quan trọng (đóng khung)? Muốn nghe lại đoạn giảng của một chỗ thì bấm đâu?
- **Cảm giác:** như lật cuốn vở ghi đẹp của chính Thầy. Bảng đen, phấn màu, nét tự chạy ra khi cuộn tới. Vui mắt nhưng mỗi màn chỉ một việc.
- **Nguyên tắc thật thà:** app KHÔNG có chữ đã nhận dạng. Nhật ký chỉ vẽ lại nét của Thầy, không chép lại bài giảng thành văn bản. Mọi nhãn trên trang là thứ máy đếm được: giờ, số nét, màu phấn, khung.

## 2. Bố cục

Trang nhật ký, từ trên xuống (thứ tự ưu tiên giống nhau ở cả ba khổ):

1. **Bìa** (tím, cùng họ với bìa Xem lại Live): nhãn «Nhật ký bài dạy», tên bài, ngày, lớp, một dòng «Bảng Thầy viết trong buổi live, xếp lại thành 6 trang.», ba ô số (trang bảng, ý đóng khung, phút Thầy viết), nút chính duy nhất của trang «Tua nhanh cả bảng · 30 giây».
2. **Bảng tua nhanh + thanh mực** (nằm trong bìa): bảng đen khổ 16:9 viết lại cả buổi trong khoảng 30 giây, có vạch chia 2/3 như bảng live. Thanh mực bên dưới: mỗi cột là lượng phấn Thầy viết trong 30 giây của buổi, tô đúng màu phấn; ghim số 1 đến 6 là chỗ bắt đầu từng trang; kéo thanh để tới bất kỳ lúc nào. Dòng trạng thái: «Bảng 1 · Trang 3 · 09:37».
3. **Phấn Thầy dùng:** dải màu theo tỉ lệ độ dài nét, kèm tên phấn và phần trăm (tên phấn lấy đúng bảng bút: Phấn trắng, Phấn vàng, Phấn xanh ngọc, Phấn hồng).
4. **Ý Thầy đóng khung:** mỗi khung Thầy vẽ quanh một kết luận thành một thẻ nổi bật, có nút «Nghe Thầy giảng ý này». Máy tính: 3 thẻ một hàng. Điện thoại: dải vuốt ngang.
5. **Bảng theo từng trang:** mỗi trang một thẻ. Ô bảng đen chỉ cắt đúng vùng của trang; nét TỰ VẼ LẠI khi cuộn tới. Bên cạnh: «Trang 4», «Bảng 2 · 18:05 đến 19:04», «Thầy viết 59 giây», chấm màu phấn + «100 nét», «1 ý đóng khung» (nếu có), nút «Nghe Thầy giảng trang này», nút «Vẽ lại».
6. **Bảng cuối buổi:** từng bảng lúc Thầy viết xong, đứng yên, để em nhìn tổng thể. Nút «Lưu ảnh bảng 1» là TUỲ CHỌN (mục 9).
7. **Chân trang:** «Thầy Đỗ Đại Học · chỉ lớp Live Khối 10 xem được nhật ký này».

Khác nhau theo khổ:

- **Điện thoại dọc (390):** một cột. Bìa: chữ, ba ô số, nút, rồi bảng tua nhanh (bảng nằm trọn trong màn đầu). Thẻ trang: bảng trên, chữ dưới; nút «Vẽ lại» chỉ còn biểu tượng 48 px, có nhãn đọc màn hình.
- **Điện thoại ngang (844 × 390):** bìa hai cột (chữ trái, bảng phải); thẻ trang hai cột.
- **Máy tính (từ 900 px):** bìa hai cột; thẻ trang nằm ngang (bảng trái, chữ phải); cột mốc giờ chạy dọc bên trái.

**Chỗ gắn trên màn Xem lại Live** (`cho-gan.html`): một thẻ «Nhật ký bài dạy» gồm hình thu nhỏ bảng đen đang tự vẽ lần lượt từng trang, dải màu phấn dưới hình, dòng «6 trang bảng · 3 ý đóng khung», viên «Mở nhật ký». Cả thẻ là một nút. Nút chính của màn vẫn là «Phát đoạn chữa bài».

- Đề nghị: thẻ nằm NGAY DƯỚI BÌA, trên «Dòng thời gian», ở cả ba khổ. Lý do: màn 1366 × 768 thì cột trái đang dính, thẻ đặt dưới «Dòng thời gian» sẽ rơi khỏi màn (bắt đầu ở khoảng 710 px); điện thoại dọc thì thẻ nằm trong màn đầu.
- Phương án phụ (ảnh 23): dưới «Dòng thời gian», đúng chỗ trống trong ảnh của Thầy. Đẹp ở màn cao từ 900 px, bị khuất ở màn 768.
- Mở nhật ký: tấm phủ kín màn như trình phát, nút lùi về trang buổi.

## 3. Trạng thái

| Trạng thái | Hiện gì |
|---|---|
| Đang tải | Khung xương: bìa, ba thẻ. Thẻ ở màn Xem lại: ô bảng đen trống, chữ «Đang mở nhật ký…» |
| Có dữ liệu | Như bản vẽ |
| Rỗng | Buổi không có nét, hoặc tổng nét dưới 20: KHÔNG hiện thẻ ở màn Xem lại Live (không có gì để xem thì không mời) |
| Lỗi | «Chưa tải được nhật ký. Em thử lại.» + nút «Thử lại» |
| Mất mạng | Đã từng mở: hiện bản đã nhớ trên máy. Chưa từng mở: «Máy em đang mất mạng. Có mạng lại thì nhật ký tự tải.» |
| Thầy đã gỡ buổi | «Thầy đã gỡ buổi này.» + «Về danh sách» (dùng lại chữ đang có) |
| Buổi dựng trước khi có tính năng | Máy em tự chia trang từ `net.bin` của buổi (cùng một hàm thuần). Chậm hơn một nhịp, hiện khung xương |
| Đang tua nhanh / tạm dừng / xong | Nút đổi chữ: «Tạm dừng» / «Tua tiếp» / «Tua nhanh cả bảng · 30 giây» |
| Giảm chuyển động (`prefers-reduced-motion`) | Mọi bảng hiện sẵn hình hoàn chỉnh, không tự vẽ, không đầu phấn. Thanh mực vẫn kéo tay được |
| Máy yếu (`ddh.mayYeu`) | Như giảm chuyển động; hình thu nhỏ ở thẻ đứng yên ở trang 1 |

## 4. Dữ liệu

**Nguồn có sẵn (không thêm lệnh máy chủ để đọc):**

- `net.bin` của buổi: mọi nét Thầy viết, mỗi nét có màu, cỡ, giờ bắt đầu trên trục tiếng, từng điểm `[x, y, áp lực, ms]` (`src/lib/live/xem-lai-kieu.ts`, `src/lib/but-bang-loi.ts`). Kèm các lệnh «bảng mới», «xoá hết», «xoá nét», «hoàn tác».
- `buoi.json` (`BuoiLiveJson`): `mocBang` (mốc bảng mới), `doan` (đoạn nào nghe lại được, em nào lên bảng), `cau` (số câu, tên dạng), `che` (chế độ bảng hay học), `lop`, `ngay`, `tenTuDong`, `tenThay`.
- `tieng.mp3`: chỉ dùng khi em bấm nghe.

**Thứ cần thêm (chỉ thêm, không đổi nghĩa trường cũ):**

- Hàm thuần `dungNhatKy(nét, buổi)` đặt ở `src/lib/live/`, máy chủ và máy em cùng nhập.
- Tệp `live/<buổi>/nhat-ky.json` trên R2, khoảng 3 đến 8 KB: danh sách trang (giờ đầu, giờ cuối, bảng thứ mấy, hộp bao, vị trí byte trong `net.bin`, số nét, màu), danh sách khung (hộp bao, trang, giờ), tỉ lệ phấn, mực theo từng 30 giây, và nét rút gọn của trang 1 cho hình thu nhỏ.
- `BuoiLiveJson.nhatKy?: { trang: number; khung: number }` để thẻ hiện số ngay, không tải thêm gì.
- Thêm `nhat-ky.json` vào `TEP_LIVE` và bảng `KIEU_TEP` của `/live-tep/<id>/<tệp>?ve=`.

**Sinh lúc nào, lưu ở đâu:** lúc CHỐT buổi (`chotThat` trong `server/src/live-xem-lai.ts`), ngay sau `dungBuoi`, ghi cùng lượt với `net.bin`, trước `buoi.json`. Tức là buổi live vừa kết thúc, bản xem lại dựng xong thì nhật ký cũng xong. «Dựng lại» của Thầy thì nhật ký dựng lại theo. Thầy xoá buổi thì tệp đi theo tiền tố của buổi.

**Ai xem được:** tệp đi qua đúng cửa `/live-tep` với vé của buổi. Nghĩa là chỉ lớp của buổi (hoặc các em đã điểm danh, với buổi mọi lớp) và Thầy. Không có đường nào khác.

**Luật cắt trang** (bản chạy thử nằm trong `may-ve.js` của bản vẽ, các ngưỡng là số khởi điểm, sẽ chỉnh trên 3 buổi thật):

1. Lệnh «bảng mới» hoặc «xoá hết»: trang mới. Chỉ tính nét CÒN trên bảng lúc bảng đó kết thúc; nét Thầy đã xoá hoặc hoàn tác thì bỏ.
2. Thầy nghỉ viết từ 45 giây: trang mới.
3. Thầy nghỉ từ 12 giây VÀ nét kế nằm xa vùng đang viết hơn 8% bề ngang bảng: trang mới.
4. Trang dưới 4 nét: nhập vào trang liền trước của cùng bảng.
5. Vùng nhìn của thẻ = hộp bao của trang + lề, không ra ngoài bảng.

**Luật nhận khung:** một nét là «khung Thầy đóng» khi đủ cả năm điều: (a) khép kín, hai đầu cách nhau không quá 20% nửa chu vi hộp bao; (b) rộng từ 7% bề ngang và cao từ 5% bề dọc bảng; (c) dài bằng 80% đến 140% chu vi hộp bao; (d) ít nhất 85% số điểm nằm sát bốn cạnh hộp bao (hình chữ nhật hoặc bo tròn, rỗng ruột); (e) ôm ít nhất 3 nét viết TRƯỚC đó trên cùng bảng. Khung thuộc về trang có nhiều nét nằm trong nó nhất, dù Thầy vẽ khung muộn hơn. Chữ O, tam giác Δ không dính vì quá nhỏ và không ôm đủ nét.

**Tên trang:** mặc định «Trang N». Buổi có từ 2 câu thì thêm dòng lấy từ dữ liệu sẵn có: «Thầy chữa Câu 3 · Amine tác dụng với acid» hoặc «Bạn Minh Anh lên bảng · Câu 3». Không cần đọc chữ.

**Tuỳ chọn, cần Thầy quyết (ảnh 16):** sau khi chốt, gửi ảnh từng trang cho A.I đọc chữ để gợi ý một tên ngắn («Ví dụ 1: CH₄»). Luôn ghi rõ «Tên do A.I Đỗ Đại Học gợi ý». Bản chính không phụ thuộc bước này.

## 5. Ngoại lệ

- **Buổi dài, nhiều nét:** thẻ trang chỉ vẽ khi vào màn (đang ngoài màn thì không vẽ, không chạy khung hình). Danh sách trên 12 trang dùng `content-visibility: auto`.
- **Thầy viết liền không nghỉ:** một trang có thể rất to. Trần: trang quá 400 nét thì cắt tại quãng nghỉ dài nhất bên trong.
- **Thầy viết đè, sửa, xoá từng nét:** theo luật 1, chỉ lấy nét còn lại. Nhật ký là «bảng sạch».
- **Trang nằm ngoài mọi đoạn nghe lại được** (ví dụ lúc lớp đang làm bài): vẫn hiện trang, không có nút «Nghe».
- **Buổi không có tiếng (`coTieng` = false):** không có nút «Nghe» nào. Mọi thứ khác giữ nguyên.
- **Bấm lặp:** «Vẽ lại» bấm nhiều lần thì vẽ lại từ đầu, không chồng hoạt hoạ. «Tua nhanh» là công tắc chạy / dừng.
- **Đổi tab, khoá màn:** hoạt hoạ dừng theo `requestAnimationFrame`, quay lại thì chạy tiếp.
- **Tên bài dài:** tối đa 3 dòng rồi cắt (đã thử với tên 40 ký tự viết hoa).
- **Xoay máy, đổi cỡ:** bảng vẽ lại theo cỡ mới, giữ nguyên tiến độ.
- **Nhận khung sai:** nhận thiếu thì chỉ mất một thẻ ở dải «Ý Thầy đóng khung», trang vẫn đủ nét. Nhận thừa thì có một thẻ không phải kết luận. Không có khung nào thì ẩn cả mục.
- **Nét trên giấy đề (mực xanh) và nét của em lên bảng:** xem mục 8.

## 6. Chi phí máy chủ

- **Lúc chốt buổi:** thêm 1 lượt ghi R2 (3 đến 8 KB), 0 lượt D1, không thêm vòng chờ nối tiếp. Tính toán: duyệt nét một lượt, ước dưới 20 ms cho buổi 90 phút (`net.bin` đo 11/11: 70 KB cho 30 phút, 235 KB cho 90 phút).
- **Mở màn Xem lại Live:** 0 yêu cầu thêm để hiện thẻ (số liệu nằm sẵn trong `buoi.json`). Hình thu nhỏ: 1 lượt đọc R2 `nhat-ky.json`, chỉ khi thẻ vào màn, máy nhớ 1 giờ.
- **Mở nhật ký:** 1 lượt đọc R2 `net.bin` (dùng chung kho nét của trình phát, đã tải thì không tải lại). 0 lượt D1.
- **Tốc độ tải app:** mã trang nhật ký là mảnh nạp lười riêng, chỉ tải khi em bấm «Mở nhật ký». Thẻ nằm trong mảnh Xem lại Live vốn đã nạp lười. Lượt mở ba app không thêm byte nào; `npm run kiem:toc-do` phải giữ 0 đỏ.
- **Vẽ:** bản thật vẽ bằng canvas với đúng bộ dựng nét của trình phát (`may-phat.ts`), không dùng hàng trăm phần tử SVG. Mỗi lúc chỉ một hai bảng đang chạy.
- **An toàn đáp án:** `net.bin` đã cắt sạch khoảng của câu chưa mở đáp án (luật an toàn 7 của Xem lại Live). Nhật ký chỉ đọc `net.bin` nên không lộ thêm gì.
- **Tuỳ chọn A.I đọc chữ:** mỗi buổi một lần gọi lúc chốt, vài ảnh nhỏ. Chưa ước lượng chi phí chính xác.

## 7. Nghiệm thu đo bằng máy

- vitest: `tests/live-nhat-ky-chia-trang-1311.test.ts` (4 luật cắt trang, nét đã xoá bị bỏ), `tests/live-nhat-ky-nhan-khung-1311.test.ts` (khung thật, chữ O, tam giác, khung vẽ muộn), `tests/live-nhat-ky-chot-1311.test.ts` (chốt ghi `nhat-ky.json`, `buoi.json` chỉ thêm trường, buổi cũ không vỡ), `tests/live-nhat-ky-tep-ve-1311.test.ts` (không vé hoặc vé lớp khác thì 403), `tests/live-nhat-ky-the-1311.test.tsx` (thẻ ẩn khi rỗng, 5 trạng thái, giảm chuyển động).
- `tsc`, toàn bộ vitest so tên với `main`, `npm run build && npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0, `npm run check:mau` 0, `npm run kiem:co-tep`, `node scripts/kiem-sw.mjs`.
- Ảnh Chromium bản build thật: 3 khổ, sáng và tối, 0 lỗi trang, 0 tràn, 0 đích bấm dưới 44 px.
- Tác tử `toc-do` sau khi gộp: byte tải mở, chạm được, chuyển câu không chậm hơn bản trước; thêm số đo khung hình khi cuộn trang nhật ký ở CPU ×4.

## 8. Điều CHƯA chắc

1. **Ngưỡng cắt trang và nhận khung** mới chạy trên nét mẫu (ra đúng 6 trang, 3 khung). Cần thử trên 3 buổi live thật của Thầy rồi chỉnh số. Thói quen viết của Thầy (nghỉ bao lâu giữa hai ý, khung một nét hay bốn nét rời) quyết định kết quả.
2. **Khung vẽ bằng nhiều nét rời** (bốn cạnh bốn nét), khoanh tròn, gạch chân hai lần: bản thử chỉ nhận khung MỘT nét. Sẽ thêm luật gộp các nét vẽ trong 3 giây nếu buổi thật cho thấy Thầy hay vẽ vậy.
3. **Live trên lớp (chế độ học):** Thầy viết cả lên giấy đề bằng mực xanh. Đợt 1 đề nghị chỉ lấy nét trên bảng đen. Nét trên giấy đề cần hiện kèm đề bên dưới, để đợt sau.
4. **Đoạn em lên bảng:** nét trong đoạn đó là của em. Đề nghị vẫn cho vào nhật ký, ghi rõ «Bạn Minh Anh lên bảng», không ghi «Thầy viết».
5. **Buổi cũ:** khúc gốc của buổi bị dọn sau 24 giờ nên máy chủ không dựng lại được. Buổi cũ vẫn có nhật ký nhờ máy em tự chia trang từ `net.bin`, nhưng chưa đo trên máy yếu.
6. **Nhảy tới đúng phút trong trình phát:** trình phát hiện nhận lệnh «tới đoạn N». Cần thêm «tới giờ T trong đoạn». Việc nhỏ nhưng chạm tệp `TrinhPhat.tsx` (33 KB).
7. **Phông mẫu:** nét mẫu dựng từ phông một nét EMS Readability Italic (SIL OFL) chỉ để vẽ bản vẽ. Bản thật không dùng phông nào, vẽ đúng nét của Thầy.

## 9. Quyết định cần Thầy chốt

1. **Tên gọi «Trang».** Đề nghị dùng «Trang» («6 trang bảng», «Trang 4») thay cho «chặng», vì bảng từ chuẩn đã dành «Chặng» cho bài tập về nhà và «Đoạn» cho khúc xem lại. Thầy đồng ý thì thêm một dòng vào `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`.
2. **Chỗ gắn.** Ngay dưới bìa (đề nghị, ảnh 17 đến 22) hay dưới «Dòng thời gian» (ảnh 23).
3. **Nút «Nghe Thầy giảng trang này».** Đợt 1 đề nghị: đóng nhật ký, mở trình phát sẵn có tại đúng phút. Lựa chọn đẹp hơn nhưng tốn công hơn: phát tiếng ngay trong nhật ký, nét của trang chạy theo giọng Thầy.
4. **Tên gợi ý bằng A.I đọc chữ** (ảnh 16): có bật không. Không bật thì trang chỉ mang số và giờ.
5. **Nút «Lưu ảnh bảng»:** có cho em lưu ảnh bảng về máy không. Lưu được thì ảnh có thể đi ra ngoài lớp.
6. **Buổi đã live trước đây:** Thầy nói «áp dụng cho tất cả các live sau». Có cho các buổi cũ hiện nhật ký luôn không (không tốn máy chủ, máy em tự dựng).
