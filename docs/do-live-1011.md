# Số đo Live bảng — Đợt 0 (thử khả thi), 10/11/2026

Đặc tả: `docs/dac-ta-live-bang-1011.md` mục 7, 9. Kịch bản: `scripts/thu-live-dot0-1011.mjs` (workflow `thu-live-dot0-1011.yml`).

## 1. SFU thật, đo trên máy CI — lượt 42845775131 (commit 57bd56123)

**Nơi đo:** máy CI của GitHub (trung tâm dữ liệu nước ngoài). Máy thầy + 2 máy em là ba trang Chromium trên CÙNG một máy, mic giả của Chromium (tiếng «bíp»). Dùng đúng `src/lib/live` và cửa `/bpu/live/*`, nối ứng dụng Cloudflare Realtime SFU `omr-live` thật.

**Số này KHÔNG đại diện:** mạng Việt Nam (Viettel / VNPT / FPT / Mobifone), 4G, máy em yếu, iPhone, 300 người nghe. Nó chỉ chứng minh đường đi chạy thật và cho thứ tự độ lớn của phần xử lý + đệm.

| Việc | Kết quả |
|---|---|
| Máy thầy nối SFU, phát track tiếng (track câm rồi `replaceTrack` sang mic) | đạt |
| Máy thầy mở DataChannel «net» (không thứ tự, không gửi lại) qua SFU | đạt |
| 2 máy em kéo được tiếng thầy (mức âm > 0), nhận DataChannel «net» | đạt |
| Điểm đang viết đi DataChannel, không đi WebSocket | đạt: 735 gói DataChannel, 0 gói WebSocket |
| Điểm đang viết tới máy em | 2.375 / 2.375 (100 %) trên cả hai máy |
| Nét xong: bản chốt khớp nét dở ⇒ chỉ báo `net-xong`, không vẽ lại | 10 / 10 nét |
| Lệnh qua cửa `/bpu/live/*` | 3 `noi`, 4 `dap`, 3 `kenh`, đều ok |

| Số đo (máy em 1) | Trung vị | p95 | Lớn nhất |
|---|---|---|---|
| Trễ nét đầu-cuối (điểm sinh ra ở máy thầy → phát ra lớp vẽ máy em) | 66 ms | 67 ms | 84 ms |
| Đệm phát D | 35 ms | 49 ms | 49 ms |
| Dao động giờ tới của gói điểm (p95 trong 2 giây) | 4 ms | 8 ms | 8 ms |
| RTT máy em ↔ SFU | 7 ms | 10 ms | 10 ms |
| RTT máy thầy ↔ SFU | 6 ms | | |
| Jitter tiếng | 1 ms | 2 ms | 2 ms |
| Trễ tiếng phía máy em (đệm jitter đo được + 65 ms GIẢ ĐỊNH cho thu, mã hoá, loa) | 95 ms | 109 ms | 109 ms |
| Hai máy em nối xong (tạo phiên, kéo tiếng, dựng + mở kênh), nối lần lượt | 1,9 giây cho cả hai | | |

Đọc số: trễ nét 66 ms ≈ đệm phát 35 ms + nhịp gom lô 16 ms của máy thầy + một khung hình máy em + quãng mạng rất ngắn của máy CI. Ở lớp, quãng mạng thật cộng thêm vào cả hai con số trễ.

## 1b. Mic của em được gọi lên bảng (1C) — lượt 42851686048 (commit 22d8f01a6)

Cùng nơi đo và cùng giới hạn như mục 1 (máy CI của GitHub, thầy + 2 em cùng một máy, mic giả «bíp»; KHÔNG đại diện mạng Việt Nam). Kịch bản đóng vai phòng: chỉ em 1 «đang được gọi lên bảng».

| Việc | Kết quả |
|---|---|
| Em 1 bật mic: xin mic → phát track lên SFU qua `/bpu/live/phat` → máy chủ báo phòng ghi | đạt, 521 ms từ lúc gọi `batMicLenBang()` tới `dang-phat` (lượt trước 149 ms) |
| Máy thầy kéo track của em (`nhan` + `dap`) và nhận tiếng | đạt: 170 gói RTP sau ~4 giây, gói đầu ≤ 1,2 giây (số đo đọc 1 giây một lần), mức âm > 0 |
| Em 2 (đang bật nghe) kéo track của bạn và nhận tiếng | đạt: 159 gói RTP, gói đầu ≤ 1,3 giây, mức âm > 0 |
| Em 2 KHÔNG được gọi gọi thẳng cửa `/bpu/live/phat` | bị từ chối `chua-duoc-moi`, không chạm SFU |
| Em 1 tắt mic | trạng thái mic về `tat` |
| Phần cũ trong cùng lượt (tiếng thầy, DataChannel, 100 % điểm) | đạt; trễ nét trung vị 50–66 ms |

Chưa đo: đóng track ở SFU khi phòng thu mic (kịch bản không chạy Durable Object thật — đã có test với SFU giả); vọng / hú khi máy em mở loa cạnh mic thật; iPhone; nhiều máy cùng kéo track của một em.

## 2. Tải Durable Object, kết nối GIẢ (`tests/live-tai-300-1011.test.ts`)

300 kết nối máy em giả, kết nối chỉ đếm (không có chi phí `send()` thật của runtime Cloudflare) ⇒ đây là phần mã của phòng.

| Việc | Số đo |
|---|---|
| Lô điểm đang viết qua WebSocket (đường dự phòng): 30 lô/giây × 300 máy × 10 giây = 90.000 lệnh gửi | mỗi lô trung bình 0,009–0,010 ms · p95 0,010 ms · ≈ 0,3–0,4 ms CPU cho mỗi giây live |
| Nét xong (~2,3 KB) tới 300 máy | mỗi khung trung bình ≈ 0,02 ms |
| Đối chứng: MỘT lần phát view đầy đủ cho cả lớp | ≈ 11–12 ms ⇒ view chỉ phát khi trạng thái đổi |
| Ghi storage theo lô / theo khung | 0 (sổ nét ghi gom 1 giây một lần) |

## 3. Chưa đo (phải đo tại lớp, máy thật)

- Trễ tiếng đầu-cuối bằng tiếng «tách» + máy thứ ba ghi âm; lệch tiếng–nét.
- RTT tới SFU trên bốn nhà mạng Việt Nam, Wi-Fi lớp và 4G.
- 300 người nghe một track + một DataChannel (rủi ro R1); chi phí `send()` thật của phòng.
- iPhone (iOS 14, 15, 17, 26): tự phát tiếng sau một lần chạm, nút gạt im lặng, ngắt khi có cuộc gọi.
- Mạng chặn UDP (chưa có TURN); DTX có cắt đầu chữ không; khung Opus 10 ms so với 20 ms.
- Khung hình máy em ở CPU ×4 / ×6 khi thầy viết (cần lớp vẽ của đợt 1B).

## 4. Tiếng thầy trước / sau 11/11 (M1 + M2) — `scripts/thu-live-1011/do-tieng.mjs`

Cách đo: Chromium thật, mic giả đọc tệp WAV, thư viện thật `taoLiveThay` phát tới một kết nối WebRTC thứ hai ngay trong trang (đóng vai «SFU + máy em»).
KHÔNG qua Cloudflare Realtime SFU thật, KHÔNG có trễ mạng, giọng nói là tín hiệu TỔNG HỢP. Số gốc: `docs/ban-ve-live-1011/so-do-tieng-1111.json`.

| Số đo ở đầu nhận | Trước 11/11 | Sau · mặc định | Sau · chống hú («Tất cả») |
|---|---|---|---|
| Cấu hình | khử vọng + lọc ồn bật, 24 kb/s có DTX, không chuỗi | tắt khử vọng + lọc ồn, 64 kb/s, có chuỗi làm rõ tiếng | bật khử vọng + lọc ồn, 64 kb/s, có chuỗi |
| Dải tần còn lại ở −3 dB | 52 – 8 234 Hz | 59 – 21 313 Hz | 59 – 8 234 Hz |
| Dải tần còn lại ở −10 dB | 52 – 8 773 Hz | 52 – 21 313 Hz | 52 – 12 046 Hz |
| Tốc độ bit thật (quét tần) | 21,9 kb/s | 64,1 kb/s | 64,0 kb/s |
| Tốc độ bit thật (giọng nói) | ≈ 20,7 kb/s | ≈ 50,6 kb/s | chưa đo |
| Đệm nhận | 20 ms | 39 ms | 39 ms |

| Giọng nói vào (RMS) | Trước: RMS lúc có tiếng / đỉnh | Sau: RMS lúc có tiếng / đỉnh |
|---|---|---|
| −35 dBFS (nói nhỏ, mic xa) | −20,8 / −6,0 dBFS | −17,8 / −4,5 dBFS |
| −25 dBFS | −21,1 / −6,1 dBFS | −17,5 / −4,1 dBFS |
| −15 dBFS (nói to, mic sát) | −16,2 / −1,5 dBFS | −15,1 / −2,4 dBFS |

Mục tiêu −18 … −14 dBFS RMS: đạt ở cả ba mức vào; đỉnh không chạm 0 dBFS. Chuỗi làm rõ tiếng thêm 12 ms trễ (dựng ngoại tuyến, đo vị trí đỉnh một xung).
Đệm nhận tăng 20 → 39 ms là số của bộ đệm phía nhận trong lượt đo này (không DTX ⇒ gói tới đều, bộ đệm tự chọn), không phải trễ của chuỗi.

### 4.1 Đầu-cuối: đổi mic / tạm dừng / đổi lọc / bật lại — năng lượng PHÍA EM

Cùng cách dựng. Sau mỗi bước đọc `inbound-rtp.totalAudioEnergy` ở kết nối nhận: phải TĂNG trong ≤ 2 giây (tạm dừng / kết thúc thì phải đứng yên).
Chạy riêng: `node scripts/thu-live-1011/do-tieng.mjs <dist> docs/ban-ve-live-1011/so-do-tieng-1111.json doi-mic` (thoát 1 nếu có bước hỏng).

| Bước | Năng lượng phía em | Mức nhận | Khử vọng |
|---|---|---|---|
| chọn «Fake Audio Input 1» trước khi bật live ⇒ bật live | tăng sau 101 ms | −13,8 dBFS | tắt |
| đổi sang «Fake Audio Input 2» TRONG lúc live | tăng sau 105 ms | −14,6 dBFS | tắt |
| tạm dừng (phía em phải đứng yên) | đứng yên suốt 2 giây | câm | tắt |
| tiếp tục | tăng sau 202 ms | −18,8 dBFS | tắt |
| thầy ép lọc «Bật» (mở lại cùng mic) | tăng sau 101 ms | −16,6 dBFS | bật |
| về «Tự động» | tăng sau 101 ms | −15,9 dBFS | tắt |
| gọi em lên bảng (em chưa bật mic) | tăng sau 101 ms | −16,7 dBFS | tắt |
| em bật mic ⇒ máy thầy kéo tiếng em về (phòng nhận mic em: true; đàm phán lại: 1 lời mời, 1 câu trả lời) | tăng sau 101 ms | −21,1 dBFS | tắt |
| em tắt mic / thầy thu mic | tăng sau 101 ms | −15,7 dBFS | bật |
| lượt mới | tăng sau 101 ms | −14,5 dBFS | tắt |
| kết thúc live (phía em phải đứng yên) | đứng yên suốt 2 giây | câm | — |
| bật live lại | tăng sau 404 ms | −14,3 dBFS | tắt |

Bước đo là 100 ms nên «tăng sau 101 ms» nghĩa là đã tăng ngay ở lần đọc đầu.
Bước «em bật mic»: «SFU» giả thêm một đường gửi (tiếng dao động thay giọng em) và gửi LỜI MỜI MỚI; máy thầy trả lời bằng đúng mã thật (`soatEmNoi`). Tiếng thầy
phía em không đứt qua lần đàm phán lại ấy (mức nhận thấp hơn vì cùng lúc mic thầy mở lại với khử vọng — loa máy thầy đang phát tiếng em).

### 4.2 Chromium trả lại cấu hình của luồng đang mở

Đo trên Chromium thật (mic giả): thiết bị còn một luồng đang mở thì `getUserMedia` với ràng buộc khác KHÔNG cho cấu hình mới.

| Luồng đang mở | Xin thêm | Nhận được |
|---|---|---|
| chỉ tự chỉnh âm lượng (48 kHz, 1 kênh) | khử vọng + lọc ồn | y như luồng đang mở (khử vọng tắt) |
| chỉ tự chỉnh âm lượng | mic thô | y như luồng đang mở (tự chỉnh vẫn bật) |
| khử vọng + lọc ồn | chỉ tự chỉnh âm lượng | mic thô 44,1 kHz hai kênh (tự chỉnh tắt) |
| mic thô | chỉ tự chỉnh âm lượng | mic thô |
| (đã thả luồng cũ) | bất kỳ | đúng cấu hình xin |

Vì vậy mở lại CÙNG thiết bị phải thả luồng cũ trước (`moBac` trong `src/lib/live/thay.ts`); khác thiết bị thì vẫn gắn luồng mới rồi mới thả luồng cũ.

### 4.3 Chưa đo được ở đây

Mic BOYALINK thật, loa / tai nghe máy em thật, đường qua SFU thật và mạng lớp học, iPhone thật, máy em báo «đang nghe» với loa thật.

## 5. Trễ tiếng thường trực + độ trong (11/11, thầy: «làm cho tức thì», «tiếng phải trong nhất») — `scripts/thu-live-1011/do-tre.mjs`

Cách đo: Chromium thật, mic giả đọc tệp WAV, thư viện thật `taoLiveThay` → kết nối WebRTC thứ hai ngay trong trang («SFU + máy em»). Ba điểm thu bằng CÙNG một
đồng hồ mẫu: mic trình duyệt giao → đầu ra chuỗi làm rõ tiếng → tiếng nhận sau Opus + đệm rung. Số gốc: `docs/ban-ve-live-1011/so-do-tre-1111.json`.
KHÔNG có: SFU thật, mạng thật (không mô phỏng được rung 10 / 30 ms — máy đo không có `tc`), mic / loa thật, điện thoại thật.

### 5.1 Trễ từng chặng (ms) — chuỗi xung 4 ms, mỗi cấu hình 3 kết nối × 54 xung

| Chặng | Trước (#1603) | Sau | Ghi chú |
|---|---|---|---|
| Thu (bộ đệm trình duyệt báo) | 10 | 10 | sàn của trình duyệt; chưa gồm bộ đệm của thiết bị |
| Chuỗi làm rõ tiếng | 32 | 0 | Web Audio vào / ra bằng luồng tự đệm ≈ 21 ms + hai bộ nén nhìn-trước ≈ 12 ms ⇒ nay xử lý từng khung trong Worker |
| Opus (gom khung 20 ms + nhìn-trước) + giải mã | 14,4 | 16,2 | sàn của khung 20 ms |
| Mạng + SFU | 0 | 0 | cùng máy; thật = nửa RTT mỗi phía (cửa sổ Live nay hiện RTT + loại đường nối) |
| Đệm rung phía nhận | 30,2 | 29,9 | sàn của Chromium khi đã đặt `jitterBufferTarget = 0` (không đặt: ≈ 33) |
| Phát ra loa | không đo | không đo | trình duyệt không đầu không có loa; tai nghe Bluetooth thêm 150–250 ms, app không sửa được |
| **Tổng đo được: mic → tiếng ra khỏi đệm rung** | **76,6** (p95 78,8) | **46,1** (p95 46,6) | |

Mọi cấu hình đã đo:

| Cấu hình | Chuỗi | Tổng (trung vị) | p95 | Nhỏ nhất – lớn nhất | Đệm rung | Gói / giây |
|---|---|---|---|---|---|---|
| trước (#1603): chuỗi nén + AGC trình duyệt, 64 kb/s, khung 20 ms | 32 | 76,6 | 78,8 | 66,6–78,8 | 30,2 | 51 |
| trước, máy em KHÔNG đặt đệm rung thấp nhất | 33,3 | 82,5 | 91,3 | 73,2–91,3 | 32,7 | 51 |
| trước + khung 10 ms | 33,3 | 77,4 | 90,5 | 65,8–90,5 | 31,4 | 100 |
| không chuỗi (mic thẳng), AGC trình duyệt, khung 20 ms | 0 | 45,9 | 55,9 | 42,1–55,9 | 30 | 51 |
| chuỗi nhanh (worklet), AGC tắt, khung 20 ms | 21,3 | 75,6 | 77,8 | 52,6–77,8 | 32,7 | 51 |
| chuỗi từng khung (Worker), AGC tắt, khung 20 ms | 0 | 47 | 54,4 | 41,6–54,4 | 30 | 51 |
| chuỗi từng khung, AGC tắt, khung 10 ms | 0 | 44,5 | 46,5 | 33,8–46,5 | 30 | 101 |
| chuỗi từng khung + AGC trình duyệt, khung 20 ms | 0 | 46,1 | 46,6 | 43,8–46,6 | 29,9 | 51 |
| chuỗi từng khung, AGC tắt, khung 20 ms (lượt thứ hai) | 0 | 44,3 | 47 | 41,6–47 | 25,9 | 51 |

Kết luận trễ: (1) chuỗi từng khung bỏ được ≈ 30 ms; (2) khung Opus 10 ms chỉ bớt ≈ 2,5 ms (đệm rung ≈ 30 ms nuốt gần hết) mà gấp đôi số gói ⇒ GIỮ 20 ms;
(3) chuỗi Web Audio kiểu worklet vẫn còn ≈ 21 ms ⇒ chỉ là đường lui; (4) `jitterBufferTarget = 0` (máy em đã đặt từ 10/11) đáng ≈ 6 ms.

### 5.2 Độ trong — sin 1 kHz (SINAD = tín hiệu / (méo + tạp âm); THD = hài bậc 2–5; dB)

Mức vào −20 dBFS:

| Cấu hình | SINAD sau chuỗi | THD sau chuỗi | SINAD nhận | THD nhận | Mức nhận (dBFS) | kb/s |
|---|---|---|---|---|---|---|
| trước (#1603): chuỗi nén + AGC trình duyệt, 64 kb/s, khung 20 ms | 49,1 | −80,3 | 46 | −79,2 | −14,3 | 64,3 |
| trước + khung 10 ms | 49,1 | −80,3 | 43,7 | −79,7 | −14,3 | 64,8 |
| trước + 96 kb/s | 49,1 | −80,3 | 47,3 | −78,8 | −14,3 | 95,9 |
| chuỗi từng khung, AGC tắt, 64 kb/s khung 20 ms | 49,2 | −96,9 | 43,1 | −84,2 | −17,7 | 64,4 |
| chuỗi từng khung, AGC tắt, 64 kb/s khung 10 ms | 49,2 | −96,9 | 41,4 | −83 | −17,7 | 64,8 |
| chuỗi từng khung, AGC tắt, 96 kb/s khung 20 ms | 49,2 | −96,9 | 44,8 | −85,4 | −17,7 | 96,2 |
| chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 20 ms | 49,2 | −96,9 | 46,1 | −85,6 | −17,8 | 64,5 |
| chuỗi từng khung + AGC trình duyệt, 96 kb/s khung 20 ms | 49,2 | −96,9 | 47 | −84,9 | −17,7 | 96,5 |
| chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 10 ms | 49,2 | −96,9 | 47 | −83,2 | −17,7 | 64,9 |
| SAU (mặc định mới của thư viện) | 49,2 | −96,9 | 46,1 | −85,5 | −17,8 | 64,5 |

Mức vào −6 dBFS (giọng to):

| Cấu hình | SINAD sau chuỗi | THD sau chuỗi | SINAD nhận | THD nhận | Mức nhận (dBFS) | kb/s |
|---|---|---|---|---|---|---|
| trước (#1603): chuỗi nén + AGC trình duyệt, 64 kb/s, khung 20 ms | 48,7 | −74,2 | 45 | −75,1 | −9,3 | 64,5 |
| trước + khung 10 ms | 48,7 | −74,2 | 43,5 | −73 | −9,3 | 64,8 |
| trước + 96 kb/s | 48,7 | −74,2 | 46,8 | −73,8 | −9,3 | 96,2 |
| chuỗi từng khung, AGC tắt, 64 kb/s khung 20 ms | 49,2 | −101,1 | 42,6 | −85,7 | −9 | 64,1 |
| chuỗi từng khung, AGC tắt, 64 kb/s khung 10 ms | 49,2 | −101,1 | 41,7 | −87,9 | −9 | 64,9 |
| chuỗi từng khung, AGC tắt, 96 kb/s khung 20 ms | 49,2 | −101,1 | 44,8 | −91,6 | −9 | 96,2 |
| chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 20 ms | 49,2 | −101,1 | 46 | −90,1 | −15,1 | 64,3 |
| chuỗi từng khung + AGC trình duyệt, 96 kb/s khung 20 ms | 49,2 | −101,1 | 47,1 | −89,1 | −15 | 96,5 |
| chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 10 ms | 49,2 | −101,1 | 47 | −86,5 | −15 | 64,8 |
| SAU (mặc định mới của thư viện) | 49,2 | −101,1 | 45,6 | −89,4 | −15,1 | 64,3 |

Tại mic SINAD = 49,2 dB (trần của tệp 16 bit + cách đo). Hàng «AGC tắt» thấp hơn ≈ 3 dB ở đầu nhận vì mic giả khi không qua bộ xử lý của trình duyệt chạy
44,1 kHz hai kênh (bộ gửi phải lấy lại mẫu) — một lý do GIỮ tự chỉnh âm lượng của trình duyệt ở bậc mở đầu (luồng 48 kHz một kênh xuyên suốt).

### 5.3 Độ trong — giọng nói tổng hợp −25 dBFS trên nền ồn −55 dBFS (tại mic: tín / ồn ≈ 29 dB), quãng nghỉ 0,9 giây

| Cấu hình | Mức nói (dBFS) | Đỉnh | Ồn trong quãng nghỉ | Tín / ồn (dB) | «Thở» (dB) | segSNR qua bộ mã (dB) | kb/s |
|---|---|---|---|---|---|---|---|
| trước (#1603): chuỗi nén + AGC trình duyệt, 64 kb/s, khung 20 ms | −17,2 | −4,5 | −39,9 | 22,7 | 0 | 8 | 58,1 |
| trước + khung 10 ms | −17,2 | −4,5 | −39,8 | 22,7 | 0 | 6,4 | 58,7 |
| trước + 96 kb/s | −17,1 | −4,5 | −39,1 | 22,1 | 0,1 | 9,6 | 96,5 |
| chuỗi nén, AGC TẮT, 64 kb/s khung 20 ms | −18,9 | −6 | −43,6 | 24,7 | −0,1 | 6,4 | 57,9 |
| không chuỗi, AGC trình duyệt, 64 kb/s khung 20 ms | −21,4 | −7,2 | −52,8 | 31,5 | 0 | 9,2 | 56,7 |
| chuỗi từng khung, AGC tắt, 64 kb/s khung 20 ms | −17,9 | −2,6 | −49,8 | 31,9 | 0 | 9,5 | 57,1 |
| chuỗi từng khung, AGC tắt, 64 kb/s khung 10 ms | −18 | −2,8 | −49,9 | 31,9 | 0 | 8,7 | 57,4 |
| chuỗi từng khung, AGC tắt, 96 kb/s khung 20 ms | −17,7 | −2,9 | −49 | 31,3 | 0 | 10,5 | 96,5 |
| chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 20 ms | −17,8 | −2,2 | −49,5 | 31,7 | 0 | 9,4 | 56,8 |
| chuỗi từng khung + AGC trình duyệt, 96 kb/s khung 20 ms | −17,7 | −3 | −48,7 | 31 | 0 | 10,7 | 96,5 |
| chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 10 ms | −17,9 | −2,3 | −49,5 | 31,6 | 0 | 9,5 | 56,9 |
| SAU (mặc định mới của thư viện) | −17,8 | −2,2 | −49,5 | 31,7 | 0 | 7,5 | 56,7 |

«Thở» = ồn nửa sau quãng nghỉ so với nửa đầu (0 = không bơm). segSNR = tỉ số tín hiệu / sai khác dạng sóng theo khung 20 ms đã khớp trễ; cùng một cấu
hình đo hai lần lệch nhau tới ≈ 2 dB ⇒ chỉ dùng để thấy chênh lớn.

Kết luận độ trong: (1) chuỗi hai bộ nén cũ NÂNG ồn nền trong quãng nghỉ ≈ 9–10 dB (tín / ồn 22,7 dB so với 29 dB tại mic); chuỗi mới nâng mức chậm theo giọng
nói, đứng yên trong quãng nghỉ ⇒ tín / ồn ≈ 31,7 dB, mức nói vẫn −17,8 dBFS, đỉnh −2,2 dBFS; (2) chuỗi mới không thêm méo (THD sau chuỗi −97 … −101 dB so với
−74 … −80 dB của bộ nén cũ); (3) 96 kb/s so với 64 kb/s: SINAD nhận hơn ≈ 1 dB, segSNR hơn trong khoảng nhiễu của phép đo ⇒ chưa «tốt hơn rõ», GIỮ 64 kb/s
(đổi bằng một số ở `OPUS_THAY`); (4) khung 10 ms không làm xấu rõ nhưng cũng không đáng ⇒ giữ 20 ms; (5) tự chỉnh âm lượng của trình duyệt bật hay tắt cho
tín / ồn và «thở» như nhau ⇒ giữ BẬT (đường đã chạy được với mic thật của thầy), bậc nới mới thử mic thô.

### 5.4 Chưa đo được

Mạng thật + SFU thật, rung 10 / 30 ms, mic BOYALINK và loa / tai nghe thật, điện thoại thật (khi em mở mic, điện thoại có thể chuyển sang chế độ đàm thoại:
loa thoại, dải hẹp — chỉ máy thật mới biết). Giọng nói là tín hiệu tổng hợp.

