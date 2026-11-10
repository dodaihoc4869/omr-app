# Đặc tả XEM LẠI LIVE — 10/11/2026 (bước 2 quy trình 4 bước, CHỜ THẦY DUYỆT ẢNH)

Thầy 10/11: «Tự động tạo html sống động của buổi live, màu mè siêu đẹp, trực quan rõ ràng, có chèn các đoạn video thầy live cần thiết. Trên máy hs phần thêm có thêm nút Live bấm vào để xem lại video, tên lưu đẹp dễ hiểu, trên app thầy cũng có thêm phần nút đó, bấm vào hiện lịch sử bài live và có nút xóa được hàng loạt.» · Thầy chốt thêm 10/11: «Tôi ko bấm gì lúc live cả, bạn tự động làm hết thật xuất sắc nhé».

- Bản vẽ: `docs/ban-ve-live-xem-lai-1011/` (43 ảnh Chromium thật, danh sách ở mục 11). Trang mô phỏng `mo-phong.html` nạp thẳng biến màu thật của app; chụp lại bằng `node scripts/chup-ban-ve-live-xem-lai-1011.mjs` (soát 43 ảnh: 0 lỗi trang · 0 tràn · 0 nút nhỏ hơn mức).
- Chưa build gì vào mã chạy. Chưa tham vấn được cố vấn (phiên tác tử phụ không có công cụ cố vấn).
- Nền: đặc tả Live `docs/dac-ta-live-bang-1011.md` (mục 4.3, 4.3b; 4.3c ở nhánh `claude/live-1c-1011`), số đo `docs/do-live-1011.md`.

## 0. Kết luận nhanh

| Việc | Chốt đề xuất |
|---|---|
| «Video» xem lại | **Phát lại VECTƠ + tiếng.** Trình phát vẽ lại đúng từng nét bút theo mốc thời gian, chạy khớp tiếng thầy và em. Không quay màn hình. |
| Ghi tiếng ở đâu | **Trên máy thầy**, tự bật khi thầy bấm Live. Trộn mic thầy + tiếng em được gọi lên bảng. Cloudflare Realtime SFU không có ghi âm sẵn (mục 4.2). |
| Định dạng tiếng | **MP3 CBR 48 kb/s, mono, 24 kHz.** Phát được trên mọi máy em (iPhone iOS 14 trở lên, Android). Tải lên từng khúc 10 giây; ghép khúc = nối byte; tua bằng Range. |
| Thầy phải làm gì lúc live | **Không gì cả.** Ghi, cắt đoạn, chọn đoạn đáng xem, đặt tên, dựng trang đều tự động. |
| Ai chốt buổi | **Máy chủ.** Thầy đóng trình duyệt sớm, buổi vẫn tự hoàn tất; chỉ mất tối đa khoảng 10 giây tiếng cuối. |
| Dung lượng | ≈ 0,36 MB mỗi phút live. Buổi live 48 phút ≈ 19 MB; live trọn 90 phút ≈ 36 MB. |
| Chi phí | 26 buổi mỗi tháng ≈ 0,5–0,9 GB mới. R2 miễn phí 10 GB ⇒ **0 USD** trong năm đầu; không xoá gì thì năm thứ hai ≈ 0,2 USD mỗi tháng. |
| Trang buổi | **Màn trong app** dựng từ một tệp chỉ mục `buoi.json` trên R2. Không phải tệp HTML rời (mục 4.8). |

## 1. Mục tiêu sư phạm + ai dùng

- **Học sinh:** mở «Thêm» → «Live» → thấy các buổi của lớp, tên rõ. Vào một buổi: thấy ngay buổi ấy học gì, câu nào lớp sai nhiều, mình sai câu nào, và bấm một lần là xem lại đúng đoạn thầy chữa câu đó. Em vắng học bù được. Cảm giác cần đạt: như được ngồi lại bàn đầu, tua tới đúng chỗ mình cần.
- **Thầy:** không thêm thao tác nào lúc dạy. Sau buổi, «Live» ở Hôm nay mở lịch sử: xem, đổi tên, xoá hàng loạt.
- **Phụ huynh:** không đổi gì.

Mục tiêu ĐO ĐƯỢC:

| Chỉ số | Đạt | Không đạt |
|---|---|---|
| Thao tác của thầy lúc live cho việc ghi | 0 | ≥ 1 |
| Tắt live → buổi sẵn sàng xem (buổi 90 phút) | ≤ 60 giây (p90) | > 3 phút |
| Mất tiếng khi máy thầy tắt đột ngột | ≤ 12 giây cuối | > 30 giây |
| Lệch nét–tiếng khi phát lại | ≤ 80 ms | > 150 ms |
| Bấm đoạn → có hình + tiếng, 4G | ≤ 1,5 giây | > 4 giây |
| Tua tới một câu | ≤ 0,5 giây | > 2 giây |
| Khung hình trình phát, CPU ×4 | p95 khoảng khung ≤ 20 ms | > 33 ms |
| Dữ liệu em tốn để xem một đoạn 5 phút | ≤ 2,5 MB | > 10 MB |
| Byte thêm ở đường mở app | 0 | > 0 |

## 2. Bố cục

### 2.1 Máy em

- **Nút «Live» ở tấm «Thêm»** (ảnh 01–04): một dòng mới, cùng kiểu các dòng đang có (`.tr-menu-muc` + ô biểu tượng `.tr-menu-o`), đứng sau «Luyện tập». Ô biểu tượng dùng màu chính của app (`--tr-hs-nut`), không thêm màu mới. Có buổi em chưa mở thì hiện chip «1 buổi mới». Khổ ngang và máy tính: tấm «Thêm» đứng cạnh ray trái như hiện có.
- **Danh sách «Xem lại Live»** (ảnh 05–11): buổi mới nhất là thẻ lớn (ảnh bìa bảng, tên bài, ngày, lớp, số câu, thời lượng, số đoạn, «Em lên bảng câu 3», nút chính «Xem buổi này»). Các buổi cũ xếp theo tháng: ô ngày + tên + «6 câu · 52 phút · Đã xem 4/6 đoạn». Một nút chính mỗi màn.
- **Trang buổi live** (ảnh 12–18), cuộn dọc, từ trên xuống:
  1. Bìa màu: tên buổi, ngày · lớp · giờ live, ba số (câu · phút live · đoạn xem lại), nút chính «Phát cả 5 đoạn · 29 phút», dòng «Đáng xem nhất: Câu 3 · cả lớp sai nhiều nhất (46 % đúng)».
  2. Dòng thời gian: dải ngang cả buổi; khúc xám = lớp làm bài, khúc màu = chữa trên bảng (màu đội của bạn lên bảng), mũi tên = đoạn đáng xem. Chạm khúc nào nhảy tới câu đó.
  3. Bảng vàng: đội thắng + kJ bốn đội, ba em nhiều kJ nhất, chuỗi đúng dài nhất.
  4. Mỗi câu một thẻ: số câu + dạng + «Em làm đúng / Em chưa đúng»; đề; đáp án đúng; «Lớp làm đúng 46 % · 69/150 em»; ảnh bìa đoạn có nút phát + thời lượng; tên đoạn; ai lên bảng, đội, Đạt / Chưa đạt; «Xem lời giải của câu 3» (lời giải có sẵn trong kho, mở tại chỗ).
- **Trình phát một đoạn** (ảnh 19–25): ngang, phủ kín, đúng bố cục lúc live (giấy đề trái, bảng đen phải, giấy sáng / tối theo THẦY). Nét chạy theo tiếng, có con trỏ bút.
  - Dải đáy: tên đoạn + «Đoạn 3/5»; thanh tua chia khúc theo câu; lùi 10 giây · phát / tạm dừng · tới 10 giây; giờ; tốc độ 1× / 1,5× / 2×; công tắc «Bỏ khoảng lặng». Góc trên phải: đóng.
  - Đang phát 3 giây không chạm thì dải tự ẩn (ảnh 22); chạm bảng hiện lại. Bỏ khoảng lặng thì báo nhỏ «Đã lược 0:42 khoảng lặng».
  - iPhone máy dọc: xoay hình 90° bằng CSS như Live (ảnh 25). Máy bảng: ảnh 24.
- **Máy tính** (ảnh 26, 27): hai cột. Trái (dính): bìa, dòng thời gian, bảng vàng. Phải: trình phát nhúng, điều khiển nằm DƯỚI bảng; cạnh đó là danh sách 5 đoạn.

### 2.2 App thầy

- **Nút «Live» ở đầu màn Hôm nay**, ngay trước «Điểm danh» (ảnh 28–30): nút viền `gvv2-nut-vien`, biểu tượng + chữ «Live». Buổi vừa xong đang dựng thì có chip «1 đang xử lý». Không thêm mục thanh bên (thanh bên giữ ≤ 5 mục, luật C6).
- **«Lịch sử Live»** (ảnh 31–33): dòng tổng «7 buổi · 121 MB đã lưu»; lọc theo lớp; ô tìm; bảng có ô chọn đầu dòng: tên, ngày giờ, lớp, thời lượng live, số câu, số đoạn, dung lượng, «Mở» · đổi tên · xoá. Điện thoại: danh sách một cột, vẫn có ô chọn.
- **Đang xử lý buổi vừa xong** (ảnh 34, 35): dòng đầu có thanh tiến độ «Đang xử lý buổi vừa xong · 62 % · thường xong dưới 1 phút»; ô chọn và nút của dòng ấy tắt. Xong thì tự thành dòng thường, không cần tải lại.
- **Chọn nhiều** (ảnh 36, 37): tích ô ⇒ thanh nổi «Đã chọn 3 buổi · 53 MB» + «Bỏ chọn» + «Xoá 3 buổi». Cuối bảng có «Chọn buổi cũ hơn 120 ngày».
- **Xác nhận xoá** (ảnh 38, 39): hộp «Xoá 3 buổi live?» liệt kê tên + dung lượng từng buổi; nói thật hậu quả «Xoá hẳn 53 MB: tiếng ghi lại, nét bảng và trang xem lại… Học sinh không xem lại được… Không khôi phục được.»; nói rõ thứ KHÔNG mất «Điểm, kJ và điểm danh… vẫn giữ nguyên.»; nút «Giữ lại» · «Xoá 3 buổi».
- **Đổi tên** (ảnh 40, 41): thầy chỉ sửa phần tên; ngày, lớp, số câu, thời lượng app tự ghép. Có dòng xem trước «Học sinh sẽ thấy…» và «Dùng lại tên tự động».
- **Rỗng** (ảnh 42). **Màn chiếu lúc live** (ảnh 43): viên đỏ Live có thêm ngăn «Đang ghi để xem lại». Lần đầu có thẻ nhắc một lần «Thầy không cần bấm gì thêm». Không có nút nào mới.

### 2.3 Chữ mới đề nghị thêm vào bảng từ chuẩn A2

| Khái niệm | Từ chuẩn | Không dùng |
|---|---|---|
| Xem lại buổi đã live | **Xem lại Live** (nút ở Thêm: «Live») | replay, video, phát lại |
| Một buổi đã ghi | **Buổi live** («7 buổi», «Xem buổi này») | bài live, video, bản ghi |
| Một khúc xem lại | **Đoạn** («5 đoạn», «Đoạn 3/5») | clip, phân cảnh, chương |
| Đoạn app tự chọn | **Đoạn đáng xem** («Đáng xem nhất · cả lớp sai nhiều nhất») | highlight, đoạn hay |
| Danh sách của thầy | **Lịch sử Live** | quản lý video |
| Lược chỗ im | **Bỏ khoảng lặng** («Đã lược 0:42 khoảng lặng») | skip silence, cắt lặng |
| Trạng thái ghi | **Đang ghi để xem lại** · **Đang xử lý buổi vừa xong** | recording, rendering |

## 3. Trạng thái

| Nơi | Trạng thái | Hiện gì |
|---|---|---|
| Em · Thêm | Chưa có buổi nào / có buổi mới | dòng «Live» luôn hiện; chip «N buổi mới» khi có |
| Em · Danh sách | Đang tải | khung xương thẻ lớn + 3 dòng |
| Em · Danh sách | Rỗng | «Lớp em chưa có buổi live nào» + vì sao + «Về Lộ trình» (ảnh 09) |
| Em · Danh sách | Buổi vừa xong đang dựng | thẻ «Buổi hôm nay đang được dựng · thường xong dưới 1 phút» (ảnh 10), tự đổi khi xong |
| Em · Danh sách | Mất mạng | dải «Mất mạng. Đang hiện danh sách đã lưu trên máy.» (ảnh 11) |
| Em · Danh sách / buổi | Lỗi máy chủ | «Chưa tải được. Em thử lại.» + nút «Thử lại» |
| Em · Buổi | Thầy đã xoá buổi | «Thầy đã gỡ buổi này.» + «Về danh sách» |
| Em · Trình phát | Đang tải đoạn | bảng hiện nét cuối đã có + vòng chờ trên nút phát |
| Em · Trình phát | Đang phát / tạm dừng / ẩn điều khiển | ảnh 19–22 |
| Em · Trình phát | Mất mạng giữa chừng | dừng tại chỗ, «Mất mạng · đang nối lại…», có mạng thì phát tiếp từ chỗ dừng |
| Em · Trình phát | Buổi không có tiếng (thầy live không mic) | phát nét theo mốc thời gian, dải ghi «Buổi này không có tiếng» |
| Thầy · Màn chiếu | Đang ghi | ngăn «Đang ghi để xem lại» trong viên Live (ảnh 43) |
| Thầy · Màn chiếu | Không ghi được (mic bị chặn, tải lên lỗi quá 2 phút) | ngăn đổi vàng «Chưa ghi được · live vẫn chạy»; không chặn live |
| Thầy · Lịch sử | Đang xử lý / xong / lỗi dựng | ảnh 34; lỗi: «Chưa dựng xong buổi này» + «Dựng lại» |
| Thầy · Lịch sử | Rỗng | ảnh 42 |
| Thầy · Xoá | Đang xoá / xong / xoá dở | «Đang xoá 3 buổi…» → «Đã xoá 3 buổi · 53 MB». Xoá dở: «Đã xoá 2/3 buổi. Buổi còn lại sẽ tự xoá tiếp.» |

## 4. Dữ liệu và kiến trúc

### 4.1 Sơ đồ

```
 MÁY THẦY (đang live)                    CLOUDFLARE                               MÁY EM (xem lại)
┌──────────────────────────┐        ┌───────────────────────────┐        ┌────────────────────────────┐
│ mic thầy ──┐             │ khúc   │ Worker /bpu/live/ghi      │        │ Thêm → Live → danh sách    │
│ tiếng em ──┴▶ trộn       │ 10 s   │  (vé HMAC, 0 D1)          │        │  /hs/live-ds (1 đợt D1)    │
│  ▶ AudioWorklet          │──────▶ │  ▶ R2 live/<buổi>/k/…     │        │ trang buổi: buoi.json (R2) │
│  ▶ LAME (wasm) MP3 48 kb │        ├───────────────────────────┤        │ trình phát:                │
│  + mức âm mỗi 0,5 s      │        │ PHÒNG (Durable Object)    │ Range  │  <audio> tieng.mp3 (206)   │
│  + mốc giờ từng nét      │        │  đã nhận nét + sự kiện    │◀───────│  net.bin ▶ lớp vẽ của Live │
│ nét, lệnh: như Live      │──WS──▶ │  ▶ nhật ký nét + sự kiện  │        │  đồng hồ = audio.currentTime│
└──────────────────────────┘        │ CHỐT khi tắt live / hết   │        └────────────────────────────┘
                                    │ buổi / thầy rớt 3 phút:   │
                                    │  ghép tiếng · cắt đoạn ·  │        APP THẦY: /gv/live-ds · đổi tên · xoá
                                    │  đáng xem · đặt tên ·     │
                                    │  buoi.json · D1 · dọn khúc│
                                    └───────────────────────────┘
```

### 4.2 Vì sao chọn vậy

**(a) Phát lại vectơ hay quay video thật**

| | (1) Vectơ + tiếng (chọn) | (2) Quay màn hình thành tệp video |
|---|---|---|
| Dung lượng buổi 90 phút | tiếng 32,4 MB + nét ≈ 2–4 MB ≈ **36 MB** | ≈ **810 MB** ở 1,2 Mb/s |
| R2 sau 12 tháng, 26 buổi/tháng, không xoá | ≈ 11 GB ⇒ ≈ 0,02 USD/tháng | ≈ 253 GB ⇒ ≈ 3,6 USD/tháng, tăng mãi |
| Dữ liệu 4G của em, xem một đoạn 5 phút | ≈ 2 MB | ≈ 45 MB |
| Độ nét trên điện thoại | sắc mọi cỡ, phóng vẫn nét | mờ chữ nhỏ, vỡ khi nén mạnh |
| Thao tác của thầy | không | trình duyệt hỏi chọn cửa sổ MỖI lần quay ⇒ trái yêu cầu «không bấm gì» |
| Máy thầy | mã hoá tiếng ≈ 0,4 % một nhân | mã hoá video liên tục lúc đang viết |
| Tua theo câu, bỏ khoảng lặng, cắt đoạn | chỉ là chỉ mục, không mã hoá lại | phải cắt / mã hoá lại |
| Độ phức tạp | vừa: dùng lại lớp vẽ máy em của Live | thấp lúc ghi, cao lúc lưu / phát / cắt |
| Điểm yếu | cần lớp vẽ Live (đợt 1B); đề dựng lại phải khớp bố cục (rủi ro R3 của Live) | không |

**(b) Ghi tiếng ở đâu, định dạng gì**

| Cách | Kết luận |
|---|---|
| Ghi phía máy chủ bằng Cloudflare Realtime | SFU **không có tính năng ghi âm**. Thứ gần nhất là «WebSocket adapter»: SFU giải mã Opus rồi đẩy PCM 48 kHz stereo 16 bit sang một dịch vụ WebSocket của mình. Tức ≈ 1,5 Mb/s mỗi track (≈ 1 GB cho 90 phút), tính tiền như băng thông ra, Worker phải tự mã hoá lại, rớt kết nối quá 15 giây là đóng. LOẠI. |
| `MediaRecorder` Opus / WebM | iPhone chỉ phát Opus trong `<audio>` từ iOS 17.4 (WebM); iOS 11–17.3 chỉ khi đóng gói CAF. Không đạt «mọi máy em». LOẠI làm định dạng phát. |
| `MediaRecorder` AAC / MP4 | Chrome có từ bản 126 (06/2024) nhưng CHỈ khi hệ điều hành có bộ mã AAC; Chromium thử ở phiên này trả `false`. Trên Windows bộ mã chỉ nhận 96–192 kb/s ⇒ ≈ 65 MB cho 90 phút. Tệp ra là MP4 phân mảnh, muốn tua chắc trên iPhone phải đóng gói lại. Safari ghi được AAC / MP4 từ 14.1 (iOS 14.5). Để làm PHƯƠNG ÁN B. |
| **MP3 CBR bằng LAME (wasm) trong Worker của trang (chọn)** | MP3 phát trong `<audio>` trên mọi trình duyệt (caniuse: iOS từ 4). Khung MP3 tự đứng ⇒ **ghép khúc = nối byte**, không cần đóng gói lại. CBR ⇒ byte ↔ giây tính thẳng ⇒ tua bằng Range chính xác, cắt theo khung không mã hoá lại. Không phụ thuộc trình duyệt / hệ điều hành của máy thầy. |

Chốt:
- Nguồn: mic thầy (đúng track đang gửi SFU) + track của em được gọi lên bảng khi em ở xa (`noi[0].xa`). Em đứng trong lớp thì mic thầy đã thu giọng em; trộn thêm track sẽ thành tiếng vọng lệch ≈ 0,2 giây. Đợt thử đo lại: giọng em trong lớp quá nhỏ thì trộn track em và hạ mic thầy trong lúc em nói.
- Chuỗi: `MediaStream` → `AudioContext` 24 kHz → `AudioWorklet` gom mẫu → Worker chạy LAME wasm → khúc 10 giây.
- 48 kb/s, mono, 24 kHz, CBR. Đợt thử nghe so 32 kb/s (≈ 22 MB cho 90 phút); đủ rõ thì hạ.
- Mỗi khúc kèm: `t0` (ms trên đồng hồ live của thầy, cùng đồng hồ với `tGui` của nét), mức âm mỗi 0,5 giây (1 byte), mốc giờ bắt đầu của các nét xong trong khúc.
- Tải lên: `POST /bpu/live/ghi`, một yêu cầu mỗi 10 giây (≈ 58 KB). Lỗi mạng ⇒ xếp hàng trong IndexedDB, tải bù khi có mạng, kể cả lần mở app sau (≤ 24 giờ).
- Phát: `<audio src="/live-tep/<id>/tieng.mp3?ve=…">`; Worker trả `206` theo `Range` từ R2. Không dùng Web Audio để phát (iPhone tắt tiếng Web Audio theo nút gạt im lặng, như ghi chú ở đặc tả Live).

**Số đo thử khả thi (10/11, thư mục tạm, Chromium 153 thật, tiếng giả 10 phút):**

| Việc | Số đo |
|---|---|
| LAME wasm, 48 kb/s mono 24 kHz | 10 phút ⇒ 3,60 MB; mã hoá 2,5 giây ⇒ **0,42 % một nhân**; khúc 10 giây ≈ 58,5 KB |
| Suy ra 90 phút | **32,4 MB** |
| LAME bản JS thuần (đối chứng) | cùng cỡ tệp, 2,36 % một nhân ⇒ chọn bản wasm |
| Nối 61 khúc bằng nối byte, phát trong `<audio>` | trình duyệt báo 600,05 giây (thật 600); tua tới 300 giây mất 73 ms; Range gọi từ byte 1.769.472 (tính CBR 1.800.144) |
| `MediaRecorder.isTypeSupported` ở Chromium nguồn mở / Linux | `audio/mp4;codecs=mp4a.40.2`: false · `audio/mp4;codecs=opus`: true · `audio/webm;codecs=opus`: true |
| `MediaRecorder` WebM chia khúc 1 giây, phát lại nguyên tệp | thời lượng báo `Infinity` (không tua chắc được nếu không đóng gói lại) |

Chưa đo (đợt X0, máy thật): iPhone iOS 14 / 15 / 17 tua MP3 CBR qua Range; độ rõ 48 so với 32 kb/s với giọng thầy thật; lệch nét–tiếng; thẻ live của thầy bị đưa xuống nền.

### 4.3 Phần nào ở máy chủ, phần nào cần máy thầy còn mở

| Việc | Ai làm | Máy thầy tắt giữa chừng thì |
|---|---|---|
| Thu tiếng, mã hoá, tải khúc 10 giây; mức âm; mốc giờ nét | máy thầy (tự chạy khi `live-bat`, tự dừng khi `live-tat`) | mất khúc đang ghi dở: ≤ 12 giây. Khúc đã tải còn nguyên trên R2. Khúc kẹt vì mất mạng nằm trong IndexedDB, mở lại app trong 24 giờ thì tải bù, máy chủ dựng lại. |
| Nhật ký nét (nét xong, xoá, bảng mới, hoàn tác) | PHÒNG: Live đợt 1 đã gửi các khung sổ nét qua WebSocket. Phòng ghi thêm vào nhật ký chỉ-nối (sổ nét hiện tại bị dọn khi xoá bảng nên không dùng làm bản ghi được). | đủ tới nét cuối đã gửi; thiếu mốc giờ của ≤ 10 giây nét cuối ⇒ dùng giờ phòng nhận trừ thời lượng nét (sai số ≈ 0,1–0,3 giây). |
| Sự kiện: mở câu, gọi lên bảng, mic em bật / tắt, chấm, mở đáp án, lượt mới, bảng live bật / tắt, kết quả, kJ | PHÒNG (nguồn thật của luật lượt) | đủ. |
| CHỐT: ghép tiếng, cắt đoạn, chọn đoạn đáng xem, đặt tên, dựng `buoi.json`, ghi D1, dọn khúc | MÁY CHỦ: báo thức của phòng. Lưới đỡ: cron mỗi phút đang có quét `live_buoi` còn `dang_xu_ly` quá 5 phút. | vẫn tự chạy. |
| Hiện nút, danh sách, trang, trình phát | máy em / app thầy đọc từ máy chủ | không liên quan. |

Khi nào chốt:
- thầy tắt live, hoặc kết thúc buổi (`ket-thuc`);
- đang live mà máy thầy mất kết nối 3 phút ⇒ phòng tự tắt live rồi chốt (hiện phòng đã tự tắt sau 15 phút im; thêm mốc 3 phút cho trường hợp mất kết nối hẳn);
- thầy bật live lại trong cùng buổi ⇒ phần mới nối tiếp, chốt lại, `ban` tăng 1. Một buổi học = MỘT buổi live.

Chốt chạy lại được nhiều lần cho cùng kết quả: tiến độ từng bước nằm trong storage của phòng; khúc thô chỉ bị dọn sau khi tệp ghép đã ghi xong và khớp cỡ.

### 4.4 Tự cắt đoạn (luật thuần `src/lib/live/xem-lai-cat.ts`, có test)

Trục thời gian = trục tiếng (ms từ lúc bật live; các lần tắt / bật nối liền).

1. **Chương theo câu:** mỗi lượt là một chương, từ «mở câu» tới trước lượt kế.
2. **Đoạn «lên bảng»:** bắt đầu 2 giây trước lúc thầy gọi em lên bảng (bảng live tự bật, 4.3c). Kết thúc khi sang lượt mới, bỏ lượt, hoặc tắt live. Chấm Đạt / Chưa đạt và mở đáp án KHÔNG kết thúc đoạn (thầy còn chữa tiếp).
3. **Đoạn «thầy chữa»** (không gọi ai): trong chương, sau khi mở đáp án hoặc khi bảng live bật tay, nếu có một cụm nét (các nét cách nhau dưới 8 giây) từ 5 nét trở lên VÀ từ 30 giây có tiếng. Bắt đầu 3 giây trước nét đầu.
4. **Khoảng lặng:** một khoảng là lặng khi mức âm dưới ngưỡng (khởi điểm −45 dBFS, hiệu chỉnh ở đợt thử) VÀ không có nét. Lặng từ 6 giây ⇒ ghi vào chỉ mục, trình phát nhảy qua, giữ 0,5 giây hai đầu. Lặng từ 90 giây giữa đoạn ⇒ đoạn dừng ở đó; có tiếng hoặc nét trở lại thì mở «phần 2».
5. **Bỏ đoạn vụn:** đoạn có dưới 20 giây tiếng sau khi bỏ lặng thì không thành đoạn.
6. **Em nói:** khoảng mic em bật thành vạch trên thanh tua, có tên em.
7. **An toàn:** câu CHƯA mở đáp án trong buổi ⇒ không có thẻ câu, không có đoạn; khoảng thời gian của câu ấy bị cắt khỏi `tieng.mp3` và `net.bin` (cắt theo khung MP3, không mã hoá lại).

Không cắt tệp theo đoạn: đoạn, lặng, vạch đều là chỉ mục trong `buoi.json` ⇒ đổi luật thì dựng lại, không mất gì.

### 4.5 Tự chọn «đoạn đáng xem» (luật đo được, không đoán nội dung)

| Luật | Điều kiện | Điểm | Chữ hiện |
|---|---|---|---|
| L1 | Câu có tỉ lệ đúng THẤP NHẤT buổi, từ 10 em gửi trở lên, tỉ lệ đúng ≤ 60 % | 3 | «cả lớp sai nhiều nhất» |
| L2 | Đoạn có NHIỀU NÉT NHẤT, từ 30 nét và ≥ 1,5 lần trung vị số nét các đoạn | 2 | «thầy viết nhiều nhất (64 nét)» |
| L3 | Em lên bảng được chấm ĐẠT ở câu lớp đúng ≤ 60 % | 2 | «bạn lên bảng Đạt ở câu khó» |
| L4 | Đoạn có tiếng dài nhất sau khi bỏ lặng, từ 4 phút | 1 | «thầy giảng lâu nhất» |

- Lấy tối đa 2 đoạn điểm cao nhất, điểm từ 2 trở lên (buổi có ≤ 3 đoạn: tối đa 1). Hoà điểm ⇒ đoạn dài hơn. Không đoạn nào đủ điểm ⇒ không gắn nhãn, không ép.
- Riêng từng em, tính trên máy em từ kết quả của chính em: «Câu em chưa đúng» và «Em lên bảng» đứng đầu danh sách đoạn của em.
- Giới hạn thật: các luật này biết «đoạn nào nhiều người cần» chứ không biết «thầy nói gì». Không có tóm tắt bằng lời (điểm quyết 4).

### 4.6 Tự đặt tên (luật thuần `src/lib/live/xem-lai-ten.ts`)

- **Buổi:** `<Thứ> <dd/mm> · <lớp> · <tên bài> · <N> câu · <M> phút`. Ví dụ «Thứ Ba 10/11 · 12A1 · Bài 8. Amine · 5 câu · 48 phút».
  - Tên bài lấy từ các câu ĐÃ chiếu: bài có nhiều câu nhất. Hai bài: «Bài 8. Amine + Bài 9. Amino acid và peptide». Từ ba bài: «Bài 8. Amine và 2 bài khác». Không tra được bài: «Buổi live 12A1».
  - Trên thẻ: tên bài là dòng lớn; ngày, lớp, số liệu là dòng phụ và chip.
  - Thầy đổi tên ⇒ lưu `ten_thay`, thay phần tên bài; ngày, lớp, số liệu vẫn tự ghép. Xoá trắng ⇒ về tên tự động.
- **Đoạn:** `Câu <n> · <tên dạng> · <tên gọi của em> lên bảng`. Ví dụ «Câu 3 · Amine tác dụng với acid · Minh Anh lên bảng». Không gọi ai: «… · Thầy chữa». Câu chưa có tên dạng thì bỏ khúc giữa. Có phần 2: thêm «(phần 2)».
- Tên bài và tên dạng lấy từ kho (bài của tờ đề, bảng tên dạng đang có), tra lúc chốt. Không sinh chữ mới, không bịa.

### 4.7 Hợp đồng dữ liệu — CHỈ THÊM

**D1** (`server/migration-z-1011-live-xem-lai.sql`, chỉ `CREATE … IF NOT EXISTS`):

```sql
CREATE TABLE IF NOT EXISTS live_buoi (
  id TEXT PRIMARY KEY,                       -- = buoi_hoc.id
  lop TEXT NOT NULL DEFAULT '',              -- lớp của buổi ('' = buổi mọi lớp)
  ngay TEXT NOT NULL,                        -- YYYY-MM-DD giờ Việt Nam
  bat_luc TEXT NOT NULL, tat_luc TEXT,
  ten_tu_dong TEXT NOT NULL DEFAULT '', ten_thay TEXT,
  so_cau INTEGER NOT NULL DEFAULT 0, so_doan INTEGER NOT NULL DEFAULT 0,
  giay_live INTEGER NOT NULL DEFAULT 0, giay_doan INTEGER NOT NULL DEFAULT 0,
  byte INTEGER NOT NULL DEFAULT 0,
  trang_thai TEXT NOT NULL DEFAULT 'dang_ghi', -- dang_ghi | dang_xu_ly | xong | loi | dang_xoa
  tien_do INTEGER NOT NULL DEFAULT 0,          -- 0..100
  quyen TEXT NOT NULL DEFAULT 'lop',           -- lop | diem_danh (điểm quyết 3)
  ghi_giong_em INTEGER NOT NULL DEFAULT 1,     -- điểm quyết 2
  ban INTEGER NOT NULL DEFAULT 1,              -- dựng lại ⇒ +1 (máy em bỏ bản đệm cũ)
  tao_luc TEXT NOT NULL, cap_nhat TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_live_buoi_lop ON live_buoi(lop, ngay);
CREATE TABLE IF NOT EXISTS live_doan (
  buoi_id TEXT NOT NULL, stt INTEGER NOT NULL,
  loai TEXT NOT NULL,                        -- len_bang | thay_chua
  luot INTEGER, qid TEXT,
  ten TEXT NOT NULL,
  sbd_len_bang TEXT, dat INTEGER,            -- 1 Đạt · 0 Chưa đạt · NULL không chấm
  t0 INTEGER NOT NULL, t1 INTEGER NOT NULL,  -- ms trên trục tiếng
  giay_co_tieng INTEGER NOT NULL DEFAULT 0, so_net INTEGER NOT NULL DEFAULT 0,
  ti_le_dung REAL, dang_xem INTEGER NOT NULL DEFAULT 0, ly_do TEXT,
  PRIMARY KEY (buoi_id, stt)
);
CREATE INDEX IF NOT EXISTS idx_live_doan_em ON live_doan(sbd_len_bang);
```

**R2** (thùng `omr-de` đang có, binding `DE`), khoá theo buổi để xoá theo tiền tố:

| Khoá | Nội dung | Cỡ ước tính | Giữ |
|---|---|---|---|
| `live/<buổi>/k/<phiên>-<stt>.bin` | khúc thô: phần đầu JSON (t0, mức âm, mốc nét) + MP3 10 giây | ≈ 59 KB | tới khi chốt xong |
| `live/<buổi>/tieng.mp3` | tiếng cả lúc live, trừ khoảng của câu chưa mở đáp án | 0,36 MB/phút | tới khi thầy xoá |
| `live/<buổi>/net.bin` | nhật ký nét: nguyên các khung sổ nét `0x11`–`0x15` của Live + giờ từng khung (9 byte mỗi điểm) | ≈ 2–4 MB cho 90 phút (gzip khi phục vụ) | tới khi thầy xoá |
| `live/<buổi>/buoi.json` | chỉ mục trang: tên; các câu đã mở đáp án (đề công khai, đáp án, lời giải kho, tỉ lệ lớp); đoạn; lặng; vạch em nói; bảng vàng; giấy sáng / tối | 20–80 KB | tới khi thầy xoá |
| `live/<buổi>/su-kien.json` | nhật ký sự kiện thô của phòng (để dựng lại khi đổi luật). KHÔNG phục vụ cho máy em. | ≤ 200 KB | tới khi thầy xoá |

`buoi.json` KHÔNG mang kết quả của từng em. Kết quả riêng của em xem trả qua `/hs/live-buoi` từ `bpu_luot` của chính em.

**Lệnh máy chủ mới** (4 lệnh nóng không đổi, không thêm đợt chờ D1):

| Lệnh | Ai | D1 | R2 | Ghi chú |
|---|---|---|---|---|
| `POST /bpu/live/ghi?phien&stt` | máy thầy, vé `bpu\|` đang có | 0 | 1 ghi | thân = khúc; trùng `stt` ⇒ ghi đè, không lỗi |
| chốt (nội bộ phòng; `POST /gv/live-dung-lai {id}` cho nút «Dựng lại») | phòng / thầy | 1 lô ghi cuối | đọc khúc, ghi 4 tệp, xoá khúc | chạy lại được |
| `GET /hs/live-ds` | em | 1 lô đọc (buổi em được xem + đoạn em lên bảng) | 0 | trả kèm vé tệp HMAC `live\|<id>\|<sbd>\|<hạn 6 giờ>`; gọi khi em mở «Thêm» lần đầu, nhớ 10 phút |
| `GET /hs/live-buoi?id` | em | 1 lô đọc (quyền + `bpu_luot` của em trong buổi) | 0 | kết quả riêng em |
| `GET /live-tep/<id>/<tệp>?ve` | em / thầy | 0 | 1 đọc, có `Range` ⇒ `206` | `buoi.json`, `net.bin`, `tieng.mp3`; đệm riêng tư 1 giờ, khoá đệm kèm `ban` |
| `GET /gv/live-ds` | thầy | 1 đọc | 0 | có `trang_thai`, `tien_do`, `byte` |
| `POST /gv/live-doi-ten {id, ten}` | thầy | 1 ghi | 0 | rỗng ⇒ về tên tự động |
| `POST /gv/live-xoa {ids[]}` | thầy | 1 lô ghi `dang_xoa` → … → 1 lô xoá hai bảng | liệt kê theo tiền tố + xoá | D1 đánh dấu trước, R2 xoá, D1 xoá sau ⇒ đứt giữa chừng chạy lại được (cron quét `dang_xoa`). KHÔNG đụng `bpu_luot`, `buoi_hoc`, điểm danh. |
| `POST /gv/live-dat {id, quyen}` | thầy | 1 ghi | 0 | đổi ai xem được |

**Ai xem được** (mặc định, điểm quyết 3): em thuộc lớp của buổi, kể cả em vắng; buổi «mọi lớp» ⇒ em đã điểm danh buổi đó. Kiểm ở `/hs/live-ds` và `/hs/live-buoi`; tệp chỉ mở bằng vé có hạn.

**Thêm vào Live đợt 1 (chỉ thêm):**
- `taoLiveThay` lộ `MediaStream` mic và track em đang kéo cho máy ghi; máy ghi là mảnh nạp lười riêng, chỉ tải khi `live-bat`.
- Phòng: mỗi khung sổ nét nhận được ghi thêm vào nhật ký chỉ-nối kèm giờ; mỗi lần đổi pha lượt / gọi / chấm / mic em ghi một dòng sự kiện. Ghi gom 1 giây như sổ nét, không ghi theo từng khung.
- `viewBang.live.ghi`: `'dang-ghi' | 'loi' | 'tat'` để màn chiếu vẽ ngăn «Đang ghi để xem lại».

### 4.8 Trang buổi: màn trong app, không phải tệp HTML rời

`src/lib/html-phieu.ts` là tiền lệ dựng HTML tự đủ cho phiếu in. Trang buổi live khác ở bốn điểm nên đề xuất làm MÀN TRONG APP đọc `buoi.json`:
1. **Quyền:** chỉ lớp đó xem. Tệp HTML rời gửi đi là ai cũng mở được, kèm giọng học sinh.
2. **Trình phát:** cần lớp vẽ nét của Live, `<audio>` có Range, vé có hạn. Nhúng vào tệp rời là chép cả bộ máy vẽ vào từng tệp.
3. **Riêng từng em:** «Em chưa đúng», «Em lên bảng câu 3», «Đã xem 4/6 đoạn» phải theo người đang đăng nhập.
4. **Màu, sáng / tối:** màn trong app dùng thẳng `--tr-*`, kính, màu đội `--p-cam` / `--p-tim-2` / `--p-xanh` / `--p-do`, bảng màu tờ chiếu `--mc-*`. Tệp rời phải chép màu thành số cứng, lệch khi app đổi màu.

«Tự động tạo HTML» vẫn đúng nghĩa: máy chủ tự dựng `buoi.json` ngay khi buổi kết thúc, màn tự vẽ ra trang. Mã màn nằm trong mảnh nạp lười riêng (`src/screens/live-xem-lai/`), đường mở app không thêm byte.

### 4.9 Trình phát

- Đồng hồ chủ: `audio.currentTime`. Mỗi khung hình vẽ nét tới đúng thời điểm đó, cùng bộ nội suy của Live (`src/lib/live/noi-suy.ts`), không cần đệm phát.
- Tua: tìm mốc «bảng mới» gần nhất trước thời điểm tua, dựng lại bảng từ đó. `buoi.json` có vị trí byte của từng mốc trong `net.bin` ⇒ tải đúng phần cần.
- Bỏ khoảng lặng: tới đầu một khoảng lặng trong chỉ mục thì đặt `currentTime` sang cuối khoảng.
- Tốc độ: `playbackRate` 1 / 1,5 / 2, giữ cao độ giọng (mặc định của trình duyệt).
- Đề + bảng: dùng đúng thành phần bảng live của máy em (Live đợt 1B), nguồn là tệp thay vì mạng.
- «Đã xem x/y đoạn»: nhớ trên máy em (localStorage). Không ghi D1.
- Máy yếu (`ddh.mayYeu`): vẽ 30 khung/giây, bỏ quầng con trỏ.

## 5. Ngoại lệ

| Tình huống | Xử lý |
|---|---|
| Thầy live không mic («Live không tiếng») | vẫn ghi nét + sự kiện; buổi phát theo mốc thời gian, ghi «Buổi này không có tiếng» |
| Máy thầy mất mạng lúc live | khúc xếp hàng trong IndexedDB (trần 60 phút tiếng ≈ 22 MB), có mạng tải bù theo thứ tự |
| Thiếu vài khúc ở giữa (không bao giờ tải được) | chốt chèn khoảng trống đúng thời lượng vào chỉ mục, đánh dấu «mất tiếng 0:20»; nét vẫn chạy |
| Thầy tải lại trang / đổi máy giữa buổi | `phiên` tăng; khúc đánh số theo phiên; chốt nối theo `t0` |
| Hai máy thầy cùng mở | chỉ máy đang giữ live (máy gửi `live-bat`) ghi |
| Bật / tắt live nhiều lần trong buổi | gộp thành một buổi live, trục thời gian nối liền |
| Thầy bấm kết thúc buổi khi đang live | tắt live → chốt, như thường |
| Live rất ngắn (dưới 2 phút, hoặc không có đoạn nào) | không tạo buổi live (xoá khúc), không hiện ở đâu |
| Buổi không có câu nào mở đáp án | như trên: không có gì được phép hiện |
| Thầy mở đáp án SAU khi đã chốt (bật live lại rồi mở) | chốt lại, câu ấy xuất hiện, `ban` + 1 |
| Tên bài / tên dạng rất dài | thẻ: tối đa 2 dòng rồi «…»; dải đáy trình phát: 1 dòng rồi «…»; bấm vào xem đủ |
| Lớp 300 em cùng mở sau buổi | danh sách: 1 lô đọc D1 mỗi em, nhớ 10 phút; tệp đi R2 có đệm ⇒ không dồn D1 |
| Em đang xem thì thầy xoá buổi | yêu cầu tệp kế tiếp trả 404 ⇒ «Thầy đã gỡ buổi này.» |
| Em bấm phát lặp, đổi tab, khoá màn | `<audio>` tự tạm dừng khi rời; về thì bấm phát tiếp. Xem lại KHÔNG bắt rời màn (không phải giờ học). |
| Đang có ca kiểm tra mở | em trong ca không vào được Xem lại Live (màn thi phủ kín như hiện có); lệnh mới không đụng bảng của ca |
| Đề có ảnh / công thức dài | dựng bằng đúng hàm dựng đề của Live; `buoi.json` lưu đề công khai y như máy em lúc live |
| Xoá hàng loạt đứt giữa chừng | buổi còn `dang_xoa`, ẩn với em ngay từ bước đầu; cron xoá tiếp |
| Số đột biến (thầy live 3 giờ) | tệp ≈ 65 MB; ghép nhiều phần 5 MB; trình phát chỉ tải phần đang nghe |

## 6. Chi phí máy chủ

- **Đường nóng:** 0 lượt D1 thêm ở 4 lệnh nóng. Lúc live: 0 D1 (khúc đi R2, nhật ký ở storage của phòng). Đường mở app: 0 byte thêm.
- **D1:** mỗi buổi ghi 1 dòng `live_buoi` + 4–10 dòng `live_doan`, một lô lúc chốt. Em mở danh sách: 1 lô đọc. Em mở một buổi: 1 lô đọc.
- **R2** (0,015 USD mỗi GB-tháng; miễn phí 10 GB, 1 triệu thao tác ghi, 10 triệu thao tác đọc mỗi tháng; băng thông ra miễn phí; xoá không tính):

| Giả định | GB mới mỗi tháng | Sau 12 tháng không xoá | Tiền lưu trữ |
|---|---|---|---|
| 26 buổi/tháng, live 48 phút (≈ 19 MB) | 0,5 | 5,9 GB | 0 USD |
| 26 buổi/tháng, live trọn 90 phút (≈ 36 MB) | 0,94 | 11,2 GB | ≈ 0,02 USD/tháng ở tháng 12 |
| 60 buổi/tháng, live 90 phút | 2,2 | 26 GB | ≈ 0,24 USD/tháng ở tháng 12 |
| Đối chứng: quay video 1,2 Mb/s, 26 buổi | 21 | 253 GB | ≈ 3,6 USD/tháng, tăng mãi |

  - Chưa biết thùng `omr-de` đang dùng bao nhiêu trong 10 GB miễn phí (đề, ảnh, phiếu); xem ở bảng điều khiển Cloudflare.
  - Thao tác ghi: 540 khúc mỗi buổi 90 phút + ≈ 12 lúc chốt ⇒ 26 buổi ≈ 14.400 (miễn phí 1 triệu).
  - Thao tác đọc: chốt đọc 540 khúc; mỗi lượt em xem một đoạn ≈ 5–10 yêu cầu Range ⇒ 300 em × 26 buổi × 10 ≈ 78.000 (miễn phí 10 triệu).
- **Worker:** 540 yêu cầu tải khúc mỗi buổi; không đáng kể so với 10 triệu đã gồm.
- **Durable Object:** chốt là I/O (đọc / ghi R2), vài giây CPU; trong thời gian thức đã tính ở đặc tả Live.
- **Realtime SFU:** không đổi. Ghi ở máy thầy, không kéo thêm track qua SFU.
- **Mạng máy thầy:** tải lên thêm ≈ 48 kb/s lúc live.
- **Đáp án:** trang chỉ chứa câu đã mở đáp án TRONG buổi; khoảng thời gian của câu chưa mở bị cắt khỏi tiếng và nét. Không trường nào xuống máy em trước lúc mở đáp án.

## 7. Nghiệm thu đo bằng máy

**Test vitest (tên dự kiến):**
- `tests/live-xem-lai-cat-doan-1011.test.ts`: sự kiện giả ⇒ đúng đoạn; lùi 2 giây; chấm / mở đáp án không cắt; lặng 6 giây; lặng 90 giây ⇒ phần 2; đoạn vụn bị bỏ; nhiều lần bật / tắt.
- `tests/live-xem-lai-dang-xem-1011.test.ts`: bốn luật + ngưỡng; hoà điểm; không đoạn nào đủ ⇒ không nhãn; buổi ≤ 3 đoạn ⇒ tối đa 1.
- `tests/live-xem-lai-ten-1011.test.ts`: tên buổi một / hai / ba bài, thiếu bài; tên đoạn có / không dạng, thầy chữa, phần 2; thầy đổi tên, xoá trắng.
- `tests/live-xem-lai-an-toan-1011.test.ts`: câu chưa mở đáp án không có trong `buoi.json`, `net.bin`, `tieng.mp3`; `buoi.json` không mang kết quả từng em; em lớp khác bị từ chối; vé sai / hết hạn bị từ chối; `su-kien.json` không phục vụ cho em.
- `tests/live-xem-lai-chot-1011.test.ts`: chốt hai lần cùng kết quả; máy thầy tắt giữa chừng; thiếu khúc giữa; khúc tải bù sau ⇒ dựng lại; live dưới 2 phút không tạo buổi.
- `tests/live-xem-lai-mp3-1011.test.ts`: nối khúc ra tệp đúng khung; byte ↔ giây; cắt một khoảng theo khung.
- `tests/live-xem-lai-xoa-1011.test.ts`: xoá hàng loạt xoá đủ khoá R2 + hai bảng; đứt giữa chừng chạy lại; không đụng `bpu_luot`, `buoi_hoc`, `buoi_hoc_diem_danh`.
- `tests/live-xem-lai-phat-1011.test.ts`: trạng thái bảng tại thời điểm t; tua qua «bảng mới»; bỏ khoảng lặng; ba tốc độ.
- `tests/toc-do-may-chu-lenh-nong-1310.test.ts` (đang có): 4 lệnh nóng không thêm đợt chờ D1.

**Cổng:** `tsc` · `npm run build && npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · `npm run check:mau` · `npm run kiem:co-tep` · `node scripts/kiem-sw.mjs` · ảnh Chromium 0 lỗi trang, 0 tràn, 0 đích bấm nhỏ hơn mức · số đo của tác tử `toc-do` sau khi gộp.

**Đo thật (ghi `docs/do-live-xem-lai-<ngày>.md`):**

| Chỉ số | Cách đo |
|---|---|
| Phát + tua trên iPhone | iPhone iOS 14, 15, 17 và mới nhất + 1 Android tầm thấp: phát, tua 10 lần tới các câu, đổi tốc độ, bật nút gạt im lặng |
| Lệch nét–tiếng | thầy gõ ngòi bút xuống bảng vẽ; phát lại, so giờ đỉnh âm với giờ điểm đầu nét (20 lần, trung vị + p95) |
| Mất khi tắt đột ngột | đang live thì đóng trình duyệt; đo số giây tiếng cuối bị thiếu |
| Thời gian chốt | giờ `live-tat` → giờ `trang_thai = 'xong'`, buổi 30 / 60 / 90 phút |
| Khung hình trình phát | Playwright CPU ×4 và ×6, đoạn 60 giây nhiều nét, p95 khoảng khung |
| Độ rõ tiếng | thầy và 3 em nghe 48 so với 32 kb/s trên loa điện thoại |
| Thẻ live xuống nền | thầy chuyển sang cửa sổ khác 5 phút lúc live; kiểm tiếng không đứt |

## 8. Điểm CẦN THẦY QUYẾT (5 điểm, mỗi điểm có mặc định)

1. **«Video» là phát lại nét + tiếng, không phải tệp video quay màn hình.**
   - Mặc định đề xuất: phát lại nét + tiếng. Nhẹ hơn ≈ 20 lần, sắc nét, tua theo câu, thầy không bấm gì.
   - Cách khác: quay màn hình thật. Mỗi lần live trình duyệt sẽ hỏi chọn cửa sổ; ≈ 810 MB mỗi buổi.
2. **Ghi cả giọng em lên bảng.**
   - Mặc định đề xuất: CÓ ghi, vì đó là một nửa của đoạn chữa bài. Lúc mic em bật, máy em hiện dòng «Đang ghi để lớp xem lại». Chỉ lớp đó nghe được; thầy xoá được bất cứ buổi nào.
   - Cách khác: chỉ ghi giọng thầy (em ở xa nói thì đoạn có khoảng im).
3. **Ai xem được, giữ bao lâu.**
   - Mặc định đề xuất: mọi em của lớp, kể cả em vắng (để học bù); buổi «mọi lớp» thì em đã điểm danh buổi đó. KHÔNG tự xoá; thầy xoá hàng loạt khi muốn, có nút «Chọn buổi cũ hơn 120 ngày».
   - Cách khác: chỉ em đã điểm danh; hoặc tự xoá sau 120 ngày.
4. **Tóm tắt bằng lời do mô hình ngôn ngữ viết.**
   - Mặc định đề xuất: KHÔNG dùng. Trang chỉ có dữ liệu thật (đề, đáp án, tỉ lệ lớp, ai lên bảng, kJ) và lời giải đã có trong kho. Không có đoạn «thầy đã giảng rằng…».
   - Nếu dùng: phải chép lời tiếng Việt từ tiếng (mô hình nhận giọng), rồi mô hình viết tóm tắt. Chi phí ước 0,5–2 USD mỗi buổi 90 phút tuỳ mô hình (chưa tra giá hôm nay). Rủi ro chính: chép sai thuật ngữ, công thức, con số Hoá rồi tóm tắt sai kiến thức mà nhìn rất trơn; thầy phải duyệt từng buổi, trái với «không bấm gì».
5. **Chỗ đặt nút «Live» ở app thầy và kiểu trang.**
   - Mặc định đề xuất: nút viền «Live» cạnh «Điểm danh» ở đầu Hôm nay; trang buổi là màn trong app (mục 4.8).
   - Cách khác: thêm mục «Live» vào thanh bên (thanh bên thành 6 mục).

## 9. Giai đoạn build

| Đợt | Làm gì | Xong khi |
|---|---|---|
| **X0 · Thử khả thi** (sau Live 1C chạy được ở lớp) | Máy ghi sau cờ, một buổi thật với máy thầy thật: nghe 48 / 32 kb/s; phát + tua trên iPhone iOS 14 / 15 / 17 và Android yếu; đo lệch nét–tiếng; thử tắt máy đột ngột. | có `docs/do-live-xem-lai-<ngày>.md`. iPhone không tua được MP3 CBR ⇒ thêm khung Info lúc chốt; vẫn hỏng ⇒ phương án B (AAC / MP4, đóng gói lại ở máy chủ). |
| **X1 · Ghi + chốt + lịch sử của thầy** | Máy ghi tự động; nhật ký nét + sự kiện ở phòng; chốt ở máy chủ; hai bảng D1; lệnh `/gv/live-*`; nút «Live» + «Lịch sử Live» (đang xử lý, đổi tên, chọn nhiều, xoá). Công tắc `cau_hinh.live_xem_lai`, mặc định tắt, bật cho một lớp thử. | test chốt, cắt đoạn, tên, xoá, an toàn xanh; thầy thấy buổi thử trong lịch sử |
| **X2 · Máy em** | Dòng «Live» ở Thêm; danh sách; trang buổi; trình phát (điện thoại, iPhone dọc xoay, máy bảng, máy tính). | đủ bảng số đo mục 1 trên máy thật |
| **X3 · Tinh chỉnh** | Hiệu chỉnh ngưỡng lặng và luật đáng xem theo 5 buổi thật; «Đã xem x/y»; đoạn đầu danh sách riêng từng em. | thầy duyệt 3 buổi liền không cần sửa tay gì |
| Không làm (chưa ai yêu cầu) | Tải video về máy, chia sẻ ra ngoài lớp, phụ đề, bình luận, tóm tắt bằng mô hình ngôn ngữ, phụ huynh xem. | — |

Làn: phòng + máy em + tờ chiếu thuộc làn Bình Phản Ứng (Claude). Codex soát trên PR.

**Phụ thuộc vào Live đợt 1:**
- 1A (đã có nền trên `main`): phòng, sổ nét, mã hoá nét `src/lib/live/ma-net.ts`, cửa SFU. Xem lại dùng nguyên khung sổ nét.
- 1B: lớp vẽ bảng live của máy em. Trình phát dùng lại nguyên lớp này ⇒ X2 chỉ làm được sau 1B.
- 1C (`claude/live-1c-1011`): bảng live theo lượt + mic em lên bảng. Đây là nguồn mốc cắt đoạn «lên bảng» và nguồn tiếng em ⇒ X1 làm sau 1C.
- Cần Live thêm (chỉ thêm): mục 4.7 cuối.

## 10. Rủi ro

| | Rủi ro | Giảm thế nào |
|---|---|---|
| R1 | iPhone đời cũ tua MP3 không có khung đầu Xing / Info lệch vài giây | CBR nên trình duyệt tính theo byte; X0 thử máy thật; dự phòng: chốt ghi thêm khung Info |
| R2 | LAME giấy phép LGPL | dùng tệp wasm tách rời, nạp lúc chạy, ghi công ở mục giấy phép; không sửa mã LAME. Không muốn ⇒ phương án B (AAC) |
| R3 | Lệch nét–tiếng do hai đồng hồ | mốc giờ nét và `t0` của khúc cùng lấy từ đồng hồ live của máy thầy; X0 đo bằng tiếng gõ bút |
| R4 | Thẻ live của thầy xuống nền, trình duyệt bóp bộ hẹn giờ | chuỗi âm thanh có mic đang mở vẫn chạy; khúc cắt theo số mẫu, không theo bộ hẹn giờ; X0 thử 5 phút |
| R5 | Đề dựng lại khác bố cục lúc live ⇒ nét trên giấy lệch chữ | cùng hàm dựng, cùng bề rộng lôgic (rủi ro R3 của Live); lệch thì ẩn nét trên giấy, nét bảng đen không ảnh hưởng |
| R6 | Giọng học sinh bị ghi | điểm quyết 2; dòng báo trên máy em; chỉ lớp nghe; vé có hạn; thầy xoá được |
| R7 | Ngưỡng lặng sai làm mất chữ đầu câu | giữ 0,5 giây hai đầu; chỉ là chỉ mục nên em tắt «Bỏ khoảng lặng» là nghe đủ; X3 hiệu chỉnh |
| R8 | Luật «đáng xem» chọn đoạn nhạt | không đoạn nào đủ điểm thì không gắn nhãn; ngưỡng chỉnh ở X3 |
| R9 | Chốt lỗi giữa chừng | từng bước ghi tiến độ, chạy lại được; cron quét; nút «Dựng lại» |
| R10 | Xoá nhầm | hộp xác nhận nêu tên + dung lượng + hậu quả; không tự xoá |
| R11 | Phụ thuộc Live 1B / 1C chưa xong | X1 chờ 1C, X2 chờ 1B; hợp đồng mục 4.7 chốt trước với phiên Live |
| R12 | Thùng R2 chung đã gần 10 GB | xem bảng điều khiển trước X1; vượt thì ≈ 0,015 USD mỗi GB-tháng |

## 11. Danh sách ảnh (`docs/ban-ve-live-xem-lai-1011/`)

| Ảnh | Nội dung |
|---|---|
| 01–04 | Máy em · tấm «Thêm» có dòng «Live»: 390 sáng, 390 tối, ngang 844, máy tính 1440 tối |
| 05–08 | Máy em · danh sách buổi live: 390 sáng, 390 tối, ngang 844, máy tính 1440 |
| 09, 10, 11 | Danh sách: rỗng · buổi vừa xong đang dựng · mất mạng |
| 12–17 | Máy em · trang buổi live dọc 390, sáng và tối: đầu trang · bảng vàng · thẻ câu có đoạn đáng xem |
| 18 | Trang buổi live ngang 844 |
| 19, 20 | Trình phát ngang 844: giấy sáng, giấy tối (thanh tua theo câu, tốc độ 1× / 1,5× / 2×, Bỏ khoảng lặng) |
| 21, 22 | Trình phát: tạm dừng · ẩn điều khiển + «Đã lược 0:42 khoảng lặng» |
| 23, 24, 25 | Trình phát: ngang nhỏ 667 giấy tối · máy bảng 1180 · iPhone máy dọc xoay bằng CSS |
| 26, 27 | Trang buổi live khổ máy tính 1440: sáng, tối |
| 28, 29, 30 | App thầy · Hôm nay có nút «Live»: 1440 sáng · 1440 tối (có «1 đang xử lý») · 390 |
| 31, 32, 33 | App thầy · Lịch sử Live có ô chọn: 1440 sáng, 1440 tối, 390 |
| 34, 35 | Đang xử lý buổi vừa xong: 1440 sáng, 390 tối |
| 36, 37 | Chọn nhiều + «Xoá 3 buổi»: 1440 sáng, 390 tối |
| 38, 39 | Xác nhận xoá (nêu số buổi + dung lượng + hậu quả): 1440 sáng, 390 tối |
| 40, 41 | Đổi tên: 1440, 390 |
| 42 | Lịch sử rỗng |
| 43 | Màn chiếu lúc live: ngăn «Đang ghi để xem lại», thầy không bấm gì |

Bản vẽ dùng dữ liệu giả sát thực tế (lớp 12A1, 150 em, Bài 8. Amine; tên dạng trong ảnh là ví dụ). Nét phấn là hình minh hoạ, không phải bộ máy bút thật. Nền màn Hôm nay phía sau là khung giản lược.

## Phụ lục A — Nguồn (tra ngày 10/11/2026)

`developers.cloudflare.com` không mở được từ phiên này: tài liệu Cloudflare đọc từ kho nguồn chính thức `cloudflare/cloudflare-docs` (nhánh `production`) và qua tìm kiếm.

| Điều dùng trong đặc tả | Nguồn |
|---|---|
| Realtime SFU: WebSocket adapter đẩy PCM 16 bit 48 kHz stereo; mỗi adapter một track một chiều; tự nối lại trong 15 giây rồi đóng; tin ≤ 32 KB; tính tiền theo giá Realtime. Không có trang nào mô tả tính năng ghi âm. | kho `cloudflare-docs`: `src/content/docs/realtime/sfu/features/media-transport-adapters/websocket-adapter.mdx` và `index.mdx` |
| R2: 0,015 USD mỗi GB-tháng; 4,50 USD mỗi triệu thao tác loại A; 0,36 USD mỗi triệu loại B; miễn phí 10 GB + 1 triệu A + 10 triệu B mỗi tháng; băng thông ra miễn phí; xoá không tính | developers.cloudflare.com/r2/pricing — đọc qua kết quả tìm kiếm, chưa mở được trang |
| Opus trong `<audio>`: iOS 11–17.3 chỉ khi đóng gói CAF; WebM từ iOS 17.4; đầy đủ từ 18.4. MP3 và AAC: iOS từ 4, Chrome, Samsung Internet đều có. `MediaRecorder`: Safari 14.1, iOS 14.5, Chrome 49. | dữ liệu caniuse (kho `Fyrd/caniuse`, nhánh `main`: `opus.json`, `mp3.json`, `aac.json`, `webm.json`, `mediarecorder.json`) |
| Chrome 126 (06/2024) thêm MP4 cho `MediaRecorder`; chỉ có khi hệ điều hành có bộ mã | «Intent to Ship: MP4 container support for MediaRecorder» (blink-dev) — đọc qua kết quả tìm kiếm |
| Bộ mã AAC của Windows trong Chromium chỉ nhận 96.000 / 128.000 / 160.000 / 192.000 b/s | `media/gpu/windows/mf_audio_encoder.cc` (bản sao ở kho Cobalt, năm 2022) — đọc qua kết quả tìm kiếm; bản mới có thể đã đổi |
| Safari ghi AAC / MP4; `playbackRate` giữ cao độ; iPhone tắt tiếng Web Audio theo nút gạt im lặng; giá chép lời + mô hình ngôn ngữ | theo hiểu biết sẵn có, CHƯA tra lại hôm nay; X0 đo thay cho giả định |
| Số đo MP3 và `MediaRecorder` | tự đo 10/11 bằng kịch bản tạm (không vào kho): `wasm-media-encoders` + `@breezystack/lamejs`, Chromium 153 của Playwright 1.62 |
