# Số đo Bút + đồng bộ nét tức thì — 11/11/2026

Nhánh `claude/but-dong-bo-1111`. Thầy thử Live trên máy thật 11/11 và báo:

- «Nét bút trên máy gv đã đo bằng alt + B thì chữ đang bị nháy chưa mượt như goodnote.»
- «Tôi muốn thay nút vàng bằng một cái bút nhỏ … đồng bộ tức thì theo nét của gv. Hiện tại đang bị giật khựng ở máy hs.»
- «bảng đen khi live có cuộn vô hạn để viết được nhiều phần bên phải»
- «Tất cả phải mượt mà ổn định và tức thì cho ít nhất 300 hs vào cùng lúc tiếng nói bút viết.»

Mọi số dưới đây đo trên máy của phiên (Chromium không đầu, vẽ bằng phần mềm, không có card đồ hoạ) hoặc trên máy mô phỏng. **Chưa đo trên máy thật của thầy, chưa đo trên điện thoại thật, chưa có mạng thật, chưa có SFU thật với 300 phiên** — chỗ nào như vậy có ghi «chưa thử».

## 0. Video thầy quay màn máy em (số «trước» trên máy thật)

Tệp 30,46 giây, 1.915 khung, màn 60 khung / giây. Cắt ô bảng đen 450 × 760, với mỗi điểm ảnh mực tìm khung đầu tiên nó xuất hiện.

| Việc | Số đo |
|---|---|
| Khung có mực mới | 617 khung |
| Khoảng cách giữa hai khung có mực mới lúc đang viết | 1 khung: 396 lần · 2 khung: 94 · 3 khung: 32 · 4 khung: 20 · 5–6 khung: 18 · 7–12 khung: 34 · 13–24 khung: 12 |
| p90 / p95 khoảng cách đó | 83 ms / 135 ms |
| Mực đang chảy liền mà **con trỏ đứng im** | 203 / 507 khung (40 %) |
| Con trỏ đang đứng rồi **nhảy ≥ 6 px trong một khung** | 57 lần trong 30 giây (bước ≥ 10 px: 65 lần) |

Giới hạn: video không tách được quãng thầy nhấc bút giữa hai nét với quãng nét bị đứng, và nét đi chậm thì vài khung liền không thêm điểm ảnh nào. Số chắc chắn nhất là hai dòng con trỏ.

## 1. Máy thầy: chữ hết nháy

Kịch bản `scripts/but-bang-1011/do-nhay.mjs`: viết 39 nét chữ mẫu (bút 200 Hz) vào tờ chiếu thật, mỗi khung hình chụp đúng thứ đang hiện rồi so với khung trước. Tệp số: `docs/ban-ve-but-1011/so-do-nhay.json`.

| Số đo (CPU ×1 · CPU ×4) | Trước | Sau |
|---|---|---|
| Nét «ướt» so nét «khô» lúc nhấc bút: số điểm ảnh khác | 396 · 394 (229 điểm khác ≥ 16/255), ở 39 / 39 nét | **0 · 0**, ở 0 / 39 nét |
| Mực lùi lúc đang viết (điểm ảnh nhạt đi ≥ 16/255) | 4.325 · 2.947 | 187 · 180 |
| Khung có mực lùi / khung có đổi | 418 / 578 | 75 / 578 |
| Mức lùi lớn nhất | 255 (mất hẳn) | 85–113 |
| Mực lùi trong 10 khung sau khi nhấc (bút đứng yên rồi nhấc) | 226 | 0 |
| Vẽ lại cả trang từ vectơ (hoàn tác, đổi cỡ, cuộn) so với lúc viết | 946 điểm khác (61 khác ≥ 16) | 476 (21 khác ≥ 16), chỉ ở nét dài hơn 160 điểm |

**Nguyên nhân thật, tách bằng ba bản thử (bỏ từng thứ rồi đo lại):**

1. **Đoạn dự đoán** của trình duyệt vẽ trước đầu bút rồi khung sau rút lại: 55 % số điểm ảnh mực lùi, và là toàn bộ các lần mực mất hẳn (bỏ dự đoán: 4.377 → 1.963 điểm, mức lùi lớn nhất 255 → 89).
2. **Thon cuối nét chỉ áp lúc nhấc bút**: cuối mọi nét co lại đúng lúc nhấc (390 điểm ảnh khác ở 39 / 39 nét; bỏ thon lúc nhấc: còn 5 điểm ở 1 nét).
3. **Nét in dần từng khúc 64 điểm** xuống lớp tĩnh, khúc sau chồng mép khúc trước ⇒ lúc vẽ lại từ vectơ chữ đổi viền (946 điểm).

**Cách sửa:** một lớp canvas hiện mực + lớp đã chốt và ô nháp ngoài màn; mỗi khung dựng ô hình [đã chốt + đuôi] trên nháp rồi chép một lần lên lớp hiện (không xoá rồi vẽ, không có hai lớp hiện lệch nhịp). Đuôi luôn vẽ đúng dáng nét xong. Nhấc bút chỉ chép ô nháp vào lớp đã chốt, màn không vẽ lại gì. Bỏ dự đoán. Chữ thường (≤ 134 điểm ở chữ mẫu cao 28–64 px) không còn bị cắt khúc.

**Phần mực lùi còn lại (≈ 180 điểm ảnh trên 39 nét):** nằm ở 2–3 khung đầu của mỗi nét. Nét ngắn hơn 8,5 px thì đầu nét để đủ bề rộng (cho dấu chấm, dấu phẩy rõ), dài hơn thì đầu nét thon còn 72 %. Đây là dáng nét thầy đã duyệt nên giữ nguyên.

**Chưa thử:** lớp «đang viết» cũ xin chế độ `desynchronized`. Trên Windows / ChromeOS lớp đó có thể lên màn sớm hơn lớp tĩnh một nhịp, khi đó nhấc bút là cả chữ chớp một khung. Chromium trên máy đo không cấp chế độ này (`duocNgay: false`) nên không tái hiện được. Bản mới chỉ còn một lớp hiện nên không còn chỗ cho lỗi đó.

### Khung hình máy thầy

`scripts/but-bang-1011/do-khung.mjs`, 2.000 mẫu 200 Hz, trung vị 3 lượt. Tệp số: `docs/ban-ve-but-1011/so-do-khung.json`.

| Bài · CPU | Trước | Sau |
|---|---|---|
| Chữ · ×1 | chưa đo lại | 60 khung/giây · xử lý mỗi khung trung bình 0,14 ms, p95 0,2 ms |
| Chữ · ×4 | 57,4 khung/giây · 0,36 ms, p95 1,1 ms | 58,7 khung/giây · 0,68 ms, p95 1,9 ms |
| Một nét dài · ×1 | chưa đo lại | 60 khung/giây · 0,33 ms, p95 0,7 ms |
| Một nét dài · ×4 | 52,3 khung/giây · 0,42 ms, p95 1,2 ms | 58,1 khung/giây · 1,47 ms, p95 3,6 ms |

Khung hình mỗi giây bằng hoặc hơn, nhưng **thời gian xử lý mỗi khung tăng** (0,36 → 0,68 ms và 0,42 → 1,47 ms ở ×4): mỗi khung thêm hai lần chép ô hình, và đuôi nét dài tới 160 điểm thay vì 64. Máy đo vẽ canvas bằng phần mềm; máy có card đồ hoạ chưa đo.

Trễ mẫu → mực (`do-trung-thuc.mjs`): mẫu nào tới trước khung thì có mực ngay trong khung đó, 100 % số khung, cả trước lẫn sau. Tính từ lúc mẫu tới, ở 60 / 125 / 200 Hz: trước 10,1 / 4,2 / 2,6 ms (có dự đoán: 10 / 3,8 / 1,8 ms) → sau 11 / 5,4 / 3,6 ms. Bỏ dự đoán nên đầu nét chậm hơn 1–2 ms.

Độ lệch nét không đổi: 0,82 / 0,50 / 0,32 px ở 60 / 125 / 200 Hz (bút dồn giờ mẫu), 33 / 33 nét, 0 nét dính.

## 2. Máy em: nét chảy liền

### 2a. Chromium thật, hai trang (thầy + em) qua phòng thật trong Node

`scripts/thu-live-1011/thu-but-1111.mjs`. Nét đi WebSocket của phòng, không SFU, không mạng thật. Máy em 844 × 390 @2x. Thầy viết 65 nét. Tệp số: `docs/ban-ve-but-1011/so-do-may-em-truoc.json`, `so-do-may-em.json`.

| Số đo | Trước | Sau |
|---|---|---|
| Mực đang chảy mà con trỏ đứng im | 732 / 748 khung | **0 / 760** |
| Con trỏ đang đứng rồi nhảy ≥ 6 px | 46 lần | **0** |
| Trễ «thầy chạm bút → máy em có mực» (trung vị · p95) | 69 · 80 ms | 74 · 83 ms |
| Khoảng cách giữa hai khung có mực trong một nét (p95 · dài nhất) | 17 · 33 ms | 17 · 33 ms |
| Quãng đứng ≥ 50 ms | 0 | 0 |
| Nét ướt so nét khô trên máy em | 5 / 5 nét khác (70 điểm ảnh, 28 khác ≥ 16) | 1 / 5 nét (17 điểm ảnh, 1 khác ≥ 16) |
| Khung hình ×1 · ×4 · ×6 | 60 · 60 · 60 | 60 · 60 · 59,8 |
| Luồng chính bận ×1 · ×4 · ×6 | 8,5 · 28,5 · 42,2 % | 11,1 · 41,9 · 62,6 % |
| Số lần trang tính lại kiểu trong 5 giây viết | 57–68 | 0–2 |

Đọc số:

- Trên đường WebSocket trong cùng một máy, **nét của bản trước vốn đã chảy đều**; thứ «giật khựng» tái hiện được là **con trỏ**: nó đứng ở chỗ bút lơ lửng cuối cùng suốt lúc thầy viết rồi nhảy. Khớp với video (40 % khung đứng im, 57 lần nhảy).
- Trễ ở lần đo này không giảm (74 so với 69 ms, trong mức nhiễu của máy đo). Máy mô phỏng ở 2b cho thấy phần gửi sớm 16 ms.
- **Luồng chính của máy em bận hơn** (×4: 28,5 → 41,9 %; ×6: 42,2 → 62,6 %) dù vẫn 60 khung / giây: cây bút nay được vẽ lại mỗi khung, cả lúc bút lơ lửng giữa hai nét (bản trước lúc đó không vẽ gì). Bản đầu dùng phần tử DOM dời mỗi khung còn nặng hơn (×6 tụt còn 43–49 khung / giây vì trang tính lại kiểu mỗi khung) nên đã chuyển sang vẽ trên canvas.
- 1 / 5 nét còn khác 17 điểm ảnh: bộ thử nhấc bút ở toạ độ làm tròn nên nét được thêm một mẫu cuối lúc nhấc.

### 2b. Máy mô phỏng có rung mạng và mất gói

`scripts/thu-live-1011/do-dem-phat.mjs`: chạy đúng `src/lib/live/noi-suy.ts` với chữ mẫu 200 Hz (~20 giây), máy thầy 60 khung / giây, mạng trễ nền 30 ms + rung đều 0…J + mất p %, máy em 60 khung / giây; trung vị 5 hạt ngẫu nhiên. Tệp số: `docs/ban-ve-but-1011/so-do-dem-phat.json`. **Không có mạng thật.**

| Đường · rung · mất | Đầu nét đứng (trước → sau) | Quãng đứng dài nhất | Trễ nét thầy → em, trung vị | Nét phải xoá vẽ lại |
|---|---|---|---|---|
| DataChannel · 0 ms · 0 % | 0 % → 0 % | 0 → 0 ms | 79 → 63 ms | 0 → 0 |
| DataChannel · 30 ms · 0 % | 0 % → 0 % | 0 → 0 ms | 100 → 97 ms | 0 → 0 |
| DataChannel · 30 ms · 2 % | 3,99 % → 0 % | 233 → 0 ms | 101 → 97 ms | 2 → 0 |
| DataChannel · 80 ms · 2 % | 3,48 % → 0,09 % | 233 → 17 ms | 155 → 163 ms | 2 → 0 |
| DataChannel · 80 ms · 5 % | 3,92 % → 0,19 % | 217 → 33 ms | 156 → 163 ms | 3 → 0 |
| DataChannel · 30 ms · 2 % · máy em 30 khung/giây | 3,98 % → 0 % | 267 → 0 ms | 117 → 113 ms | 2 → 0 |
| DataChannel · 30 ms · 2 % · máy thầy bận | 8,36 % → 0,18 % | 233 → 17 ms | 105 → 119 ms | 2 → 0 |
| WebSocket · 0 ms · 0 % | 0 % → 0 % | 0 → 0 ms | 85 → 84 ms | 0 → 0 |
| WebSocket · 30 ms · 2 % | 6,09 % → 3,23 % | 167 → 133 ms | 184 → 181 ms | 0 → 0 |
| WebSocket · 80 ms · 5 % | 15,0 % → 9,1 % | 167 → 150 ms | 200 → 185 ms | 0 → 0 |

Con trỏ ở mọi dòng: số khung đang viết mà con trỏ không nằm ở đầu nét 950–1.040 → 0; sai số so với bút thật (p95) 9,0–9,6 % bề ngang bảng → 0,3–1,6 % (đường WebSocket có mất gói: 5–6 %).

**Nguyên nhân thật của «giật khựng»:**

1. **Con trỏ** lấy chỗ bút lơ lửng cũ (còn hiệu lực 1,5 giây) thay vì đầu nét, và bút lơ lửng chỉ báo 20 lần / giây.
2. **Gói cuối của mỗi nét gửi một lần**; mất là nét dở không phát hết, 0,4 giây sau bị xoá rồi vẽ lại bằng bản chốt (mất 2 %: 2 nét trong 65, quãng đứng 233 ms).
3. **Mốc phát cứng** «bây giờ − D»: lô về muộn thì đầu nét đứng rồi nhận cả lô trong một khung. D không tính phần máy thầy gom lô chậm (máy thầy bận: 8,36 % khung đứng).
4. Máy thầy chờ thêm 16 ms rồi mới gửi (trễ 79 so với 63 ms).

Trên đường WebSocket có mất gói, quãng đứng còn 133–150 ms: gói mất phải gửi lại theo thứ tự, lớp này không sửa được.

Ở các dòng rung 80 ms và máy thầy bận, trễ sau cao hơn trước 8–14 ms: D được nâng lên để đầu nét khỏi đứng.

## 3. Con trỏ = cây bút nhỏ

Ảnh: `docs/ban-ve-but-1011/9-cay-but-dang-viet.jpg`, `9-cay-but-lo-lung.jpg` (phóng 6 lần). Thân màu giấy, đai cam, ngòi sẫm, đầu ngòi mang màu phấn của nét; nghiêng 42°; bóng lệch 1,4 px. Lơ lửng: mờ còn 62 %, nhấc lên (2, −4) px, đổi dần trong ~0,1 giây. Chỗ lơ lửng mới cách chỗ cũ hơn 26 px thì trượt tới. Đang viết thì ngòi ở đúng đầu nét của khung đó.

Màu lấy từ biến sẵn có của bảng live (`--tr-chieu-giay`, `--tr-chieu-bang`, `--tr-chieu-mat`, `--p-cam`); không thêm khai báo màu nào.

Trình phát «Xem lại Live» (`src/screens/live-xem-lai/hs/TrinhPhat.tsx`) đã nối cùng cây bút bằng một lệnh `datBut`.

## 4. Bảng đen cuộn

Ảnh: `9-bang-da-cuon-thay.jpg`, `9-bang-da-cuon-may-em.jpg`, `9-bang-cuon-ve-dau-thay.jpg`. Kiểm trong `thu-but-1111.mjs`:

| Việc | Kết quả |
|---|---|
| Thầy lăn chuột 6 nấc trên bảng đen | độ cuộn 0 → 0,4688 lần bề dọc cửa sổ |
| Viết tiếp hai dòng ở phần dưới | 150 nét bảng, y lớn nhất 1,297 |
| Máy em soi theo | cuộn đúng 0,4688 (−189,5 px); bước trôi lớn nhất 1 px mỗi khung lúc thầy viết |
| Nhịp mực máy em khi bảng đã cuộn | p95 17 ms, dài nhất 33 ms, 0 quãng đứng ≥ 50 ms |
| Kéo vạch cuộn mép phải bảng 80 px bằng bút | bảng đi 120 px, không sinh nét, máy em theo |
| Hoàn tác sau khi cuộn | 150 → 149 nét |
| Cuộn về đầu | nét cũ còn nguyên (ảnh) |

**Không thêm loại khung nào.** Hai quy ước mới trên khung cũ, ghi ở đặc tả mục 4.4b:

- nét bảng mang mã bắt đầu bằng `b_`, toạ độ y = y màn + độ cuộn, có thể > 1 (tới 160). Khung `0x11`, `0x21` giữ nguyên định dạng.
- gói con trỏ `0x22` có `x > 1,5` mang độ cuộn của bảng ở `y`. Máy em bản cũ coi nó là con trỏ nằm ngoài màn.

Sổ nét không ghi gói con trỏ, nên «Xem lại Live» và em vào muộn chưa có độ cuộn: lớp vẽ tự trôi theo nét (nét ra ngoài tầm nhìn thì trôi cho nó về khoảng giữa bảng).

Giới hạn:

- nét bắt đầu trên bảng bị cắt ở mép ô bảng đen (mũi tên vẽ từ bảng sang giấy đề bị cắt; vẽ từ giấy sang bảng thì không).
- máy em chạy bản cũ không thấy phần bảng đã cuộn (y > 1 nằm ngoài canvas).
- cuộn bằng hai ngón trên màn cảm ứng chưa làm: bàn tay tì lên màn lúc viết sẽ làm bảng trôi.
- chưa thử với bút Wacom thật.

## 5. 300 em cùng lúc

`tests/but-dong-bo-1111-tai-300.test.ts`: bộ máy bút thật → thư viện máy thầy thật → phòng thật (Durable Object, ctx giả) → 300 kết nối (298 cái chỉ đếm + 2 thư viện máy em thật vẽ 60 khung / giây). Thầy viết 65 nét (2.793 điểm) trong 24,1 giây.

| Số đo | Kết quả |
|---|---|
| Lô điểm qua WebSocket của phòng | 33,0 lô / giây (giây nhiều nhất 37; trần của phòng 45) |
| Mỗi em nhận | 3,46 KB / giây (cả lớp 1.038 KB / giây) |
| Phòng xử lý mỗi lô (nhận → gửi xong 300 máy) | trung bình 0,031 ms · p95 0,061 ms · lớn nhất 0,66 ms |
| CPU của phòng cho mỗi giây live | 1,02 ms |
| Mọi lô điểm tới đủ 298 máy đếm | có (test khoá) |
| Hai máy em thật | đúng từng điểm của 65 nét; đầu nét đứng 0 / 774 khung |

33 lô / giây = nhịp ≤ 30 lô / giây cộng lô cuối và tin nhấc bút của từng nét (đi ngay, như bản trước).

Đường DataChannel của bản mới (test thứ hai trong cùng tệp, tính bằng chính bộ mã hoá, cùng bài viết): 71 gói / giây, mỗi em 5,02 KB / giây thân gói (cả lớp 300 em 1,47 MB / giây do SFU phát, không qua phòng), gói lớn nhất 125 byte.

Kết nối giả chỉ đếm, nên các số trên là phần mã của phòng và thư viện. **Chưa thử:** chi phí `send()` thật của Cloudflare, SFU thật với 300 phiên, điện thoại thật.

Tài liệu Cloudflare Realtime SFU (tra 11/11/2026 bằng tìm kiếm, không mở được trang trực tiếp):

- trang DataChannels: «There is no limit to the number of subscribers per publisher».
- trang Limits: 50 yêu cầu API / giây mỗi phiên; ≤ 64 track mỗi yêu cầu; không có trần số track mỗi phiên (giới hạn thực tế là băng thông); track không có gói 30 giây bị dọn.
- không tìm thấy con số trần nào cho số phiên cùng kéo một track.
- nhật ký thay đổi 13/08/2026: kênh DataChannel qua SFU nhận `ordered`, `maxRetransmits`, `maxPacketLifeTime` ở cả phía phát lẫn phía nhận; mặc định là có thứ tự. `server/src/live-sfu.ts` đã gửi `ordered: false, maxRetransmits: 0` cho cả hai phía.

Nguồn: developers.cloudflare.com/realtime/sfu/limits/ · developers.cloudflare.com/realtime/sfu/features/datachannels/ · developers.cloudflare.com/changelog/post/2026-08-13-datachannels-reliability-ordering/

## 6. Cỡ mã

| Mảnh | Trước | Sau |
|---|---|---|
| Đoạn bút chèn vào tờ chiếu (JS + CSS) | 43.904 byte, nén 15.147 | 49.226 byte, nén 16.734 (+1,6 KB nén) |
| Đường mở /gv /hs /ph /p /t (`kiem-toc-do-tai.mjs`) | bằng mốc | bằng mốc, 0 đỏ |
| Precache service worker | 170 mục | 170 mục |

Đoạn bút to thêm 1,6 KB nén (bảng cuộn + ô nháp, đã trừ phần dự đoán bỏ đi). Chưa làm nhẹ lại được.

## 7. Chạy lại

```
node scripts/but-bang-1011/do-nhay.mjs                      # GOC_CU=<bản cũ giải nén> để có cột «trước»
node scripts/but-bang-1011/do-khung.mjs
node scripts/thu-live-1011/do-dem-phat.mjs                  # GOC_CU=… như trên
npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <tạm>
node scripts/thu-live-1011/thu-but-1111.mjs <tạm>
npx vitest run tests/but-dong-bo-1111
```

Bản cũ: `git archive 50b46004e src | tar -x -C <thư mục>` rồi nối `server/` của repo vào cùng thư mục.
