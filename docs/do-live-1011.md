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
Chạy lại sau khi đổi sang chuỗi từng khung (mục 5): 13 / 13 bước đạt (thêm bước «3 giây sau khi tiếp tục»). Ghi nhận CHƯA kết luận: giây đầu sau «Tiếp tục»
mức nhận đo được thấp (≈ −27 dBFS, 3 giây sau ≈ −21 dBFS) ở đường có tự chỉnh âm lượng của trình duyệt; ép tắt (`LV_AGC=0`) thì không thấy (≈ −21 dBFS ngay).
Bản trước cũng thấp ở bước này (≈ −19 … −21 so với −15). Cần nghe trên máy thật trước khi đổi mặc định.
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

## 6. Lọc ồn riêng (11/11, thầy: «lọc ồn chưa ngon … để giọng thầy và hs trong sáng nhất»)

Bộ đang dùng: **RNNoise** (mạng nơ-ron nhỏ của Xiph.Org, BSD-3) — tệp `rnnoise_simd.wasm` 157 KB của gói `@sapphi-red/web-noise-suppressor` 0.4.1 (MIT),
để ở `src/lib/live/loc-on/` kèm giấy phép. Chạy trong Worker của chuỗi từng khung, trước khâu nâng mức. Tín hiệu đo là TỔNG HỢP (không có giọng người thật,
không có lớp học thật): RNNoise học trên giọng thật nên các số «giữ giọng» nhiều khả năng xấu hơn thực tế — cần nghe trên máy thật.

**CHỈ RNNoise được đo.** Các bộ khác: Speex và GTCRN (cùng gói) — đã thử chạy bằng lớp AudioWorklet của gói trong Node nhưng chưa chạy được (Speex (gói sapphi): đầu ra toàn số 0 trong phạm vi AudioWorklet giả của Node (bộ xử lý của gói chưa khởi tạo xong bộ wasm); GTCRN (gói sapphi): đầu ra toàn số 0 trong phạm vi AudioWorklet giả của Node (bộ xử lý của gói chưa khởi tạo xong bộ wasm));
DeepFilterNet 3 (`@lofcz/deepfilternet-web` 0.1.0, tệp wasm 34 MB), DTLN, NSNet2 — chưa tải, chưa đo; lọc ồn của trình duyệt — chỉ đo được mức bớt ồn
qua đường thật (6.2), CHƯA đo độ giữ giọng. Giới hạn cỡ tệp của Cloudflare Pages chưa tra lại. Vì vậy chưa thể nói RNNoise thắng bộ nào.

### 6.1 Ngoại tuyến (`scripts/thu-live-1011/do-loc-on.mjs`) — 2 giọng × 3 loại ồn × tín / ồn 0 / 10 / 20 dB

Cột ồn: bớt ồn ở đoạn im (dB, trung bình) · SI-SDR hơn «không lọc» ở tín / ồn 0 / 10 / 20 dB (trong ngoặc: ca xấu nhất ở 20 dB). Cột giọng sạch: SI-SDR của
giọng sạch sau khi đi qua bộ lọc (càng cao càng nguyên vẹn) · tần số cao nhất còn trong −3 dB.

| Cách lọc | Trễ (ms) | ms / khung 10 ms | Giọng nam sạch | Giọng nữ / trẻ sạch | Quạt / điều hoà | Xôn xao | Gõ bút / bàn phím |
|---|---|---|---|---|---|---|---|
| không lọc | 0 | 0 | — | — | 0 · 0 / 0 / 0 (0) | 0 · 0 / 0 / 0 (0) | 0 · 0 / 0 / 0 (0) |
| RNNoise lọc hết cỡ | 10 | 0,125 | 11,8 dB · 3403 Hz | 13,1 dB · 8751 Hz | 26,9 · 8,1 / 6,1 / 0,4 (−1,6) | 4,8 · 0,4 / −0,3 / −5 (−7,2) | 4,8 · 3,9 / 1,1 / −4,4 (−5,3) |
| RNNoise «Vừa» bản 1 (trộn cố định 25 %) | 10 | 0,104 | 14,4 dB · 14034 Hz | 15,8 dB · 8751 Hz | 11,3 · 6,4 / 5,7 / 1,8 (0,2) | 3,8 · 0,6 / 0,4 / −3,1 (−5) | 2,9 · 2,6 / 1,3 / −2,3 (−3,5) |
| RNNoise «Mạnh» bản 1 (trộn cố định 6 %) | 10 | 0,088 | 12,4 dB · 3403 Hz | 13,7 dB · 8751 Hz | 20,7 · 7,9 / 6,2 / 0,8 (−1,1) | 4,6 · 0,5 / −0,1 / −4,6 (−6,7) | 3,9 · 3,3 / 1,2 / −4 (−4,7) |
| RNNoise «Vừa» bản 2 (theo giọng + tách băng) | 10 | 0,147 | 21,5 dB · 20000 Hz | 18,2 dB · 20000 Hz | 18,5 · 3,3 / 3,7 / 2,4 (1,6) | 6,1 · 0,6 / 1,2 / −1,3 (−3,1) | 6,9 · 0,5 / 0,8 / −0,4 (−1,2) |
| RNNoise «Mạnh» bản 2 (theo giọng + tách băng) | 10 | 0,132 | 18,6 dB · 20000 Hz | 16,2 dB · 15793 Hz | 28,2 · 4,4 / 4,6 / 1,7 (0,3) | 7,6 · 0,8 / 1,2 / −2,4 (−4,7) | 7,4 · 1,5 / 1,1 / −1,3 (−2,9) |

**Trộn bản 2** (đang dùng; `THAM_LOC_ON` trong `src/lib/live/chuoi-tieng.ts`): băng thấp (< 3,5 kHz) lọc sâu lúc im, lúc có giọng giữ 50 % (Vừa) / 25 % (Mạnh)
tiếng gốc; băng cao giữ tiếng gốc lúc có giọng; cả tín hiệu qua cổng theo giọng (lúc im hạ 8 dB với Vừa, 12 dB với Mạnh; mở sớm hơn tiếng 10 ms, đóng êm
≈ 100 ms). So với bản 1 (trộn cố định): giọng nam ở mức Mạnh không còn bị cắt ở 3,4 kHz (còn đủ dải), giọng sạch nguyên vẹn hơn 4–7 dB SI-SDR, ồn đều ở đoạn
im bớt nhiều hơn. CHƯA ĐẠT: xôn xao ở đoạn im mới bớt 6–8 dB (mục tiêu 12); khi giọng vốn rõ (20 dB) mà nền là xôn xao / tiếng gõ thì SI-SDR còn kém «không
lọc» 0,4–2,4 dB (trung bình). Chưa làm khâu chặn xung riêng cho tiếng gõ.

### 6.2 Qua đường thật trên Chromium (`do-tre.mjs … on`) — giọng −25 dBFS trên nền ồn trắng −35 dBFS (tín / ồn tại mic ≈ 10 dB)

| Cấu hình | Mức nói (dBFS) | Đỉnh | Ồn trong quãng nghỉ | Tín / ồn ở đầu nhận (dB) | Ồn cuối quãng nghỉ so với đầu (dB) |
|---|---|---|---|---|---|
| không lọc | −16,7 | −0,9 | −29,3 | 12,6 | 0,5 |
| lọc ồn + khử vọng của TRÌNH DUYỆT (lọc riêng tắt) | −17,3 | −3,9 | −47,4 | 30,1 | −0,9 |
| lọc riêng «Vừa» | −15,7 | −1,3 | −44,1 | 28,4 | −8,9 |
| lọc riêng «Mạnh» | −15,5 | −1,6 | −59 | 43,5 | −8,3 |
| lọc ồn + khử vọng của TRÌNH DUYỆT (lọc riêng tắt) — bản 1 (trộn cố định) | −17,4 | −3,8 | −47,3 | 30 | −0,9 |
| lọc riêng «Vừa» — bản 1 (trộn cố định) | −17 | −3,3 | −40,9 | 23,9 | −0,1 |
| lọc riêng «Mạnh» — bản 1 (trộn cố định) | −16,6 | −2,8 | −49,9 | 33,3 | −0,6 |

Cột cuối âm = ồn TẮT DẦN trong quãng nghỉ (cổng đóng lại), không phải bơm lên.

### 6.3 Ngân sách và giới hạn

Trễ: chuỗi 0 → 10 ms khi lọc bật (tổng mic → ra khỏi đệm rung ≈ 46 → ≈ 56 ms, cộng từ số đo mục 5; chuỗi xung không đo được qua bộ lọc vì nó coi xung là
ồn). CPU ≈ 1,5 % một lõi trên máy đo. Tệp bộ lọc là một mảnh riêng, tải sau khi bật live, không nằm trong kho tải sẵn. Chưa tải xong / lỗi ⇒ chuỗi chạy không
lọc; vào / ra chế độ lọc bằng một khung trộn dần. Chỉ chạy khi mic 48 kHz khung 480 mẫu và trình duyệt có kiểu «khung» (Chromium trên máy tính).
MIC CỦA EM lên bảng (điện thoại) KHÔNG đổi: vẫn dùng lọc ồn + khử vọng của trình duyệt; chưa đo bản nhẹ trên CPU ×4 / ×6, chưa làm đường AudioWorklet cho iPhone.


## 7. Lọc ồn lượt 3 (11/11, thầy thử mic cài áo thật ở mức Mạnh: «khử ồn vẫn chưa hiệu quả … phải thật xuất sắc, giọng nói trong rõ ràng»)

**Bộ chọn: DeepFilterNet 3** (mạng nơ-ron toàn dải 48 kHz của Rikorose; mã + mô hình MIT / Apache-2.0). Chạy ở một Worker riêng của máy thầy
(`src/lib/live/loc-on/df3.ts`), RNNoise lượt 2 làm đường lui (`loc-on/ma-loc.ts`). Sau bộ lọc sâu còn một cổng mềm theo mức giọng; rồi vẫn qua nâng mức + chặn đỉnh.

Đã thử hai bản dựng wasm của libDF (cùng mô hình chính thức `DeepFilterNet3_onnx.tar.gz`, sha256 `c94d91f7…`):

| Bản dựng | Cỡ tải | ms / khung 10 ms (Node, máy đo) | Giọng thật sạch đi qua (SI-SDR) | Mẫu `noisy_snr0.wav` của tác giả (SI-SDR 6,0 dB trước lọc) | Kết luận |
|---|---|---|---|---|---|
| `@workadventure/noise-suppression` 0.2.0 (MIT) — `df_bg.wasm` 14,6 MB | 3,98 MB (gzip) + 7,98 MB mô hình | 1,06 | 39,0 dB | 20,0 dB | **DÙNG** |
| `@lofcz/deepfilternet-web` 0.1.0 — wasm 34 MB, mô hình nằm sẵn bên trong (tract 0.23 + SIMD) | 12,7 MB (gzip) | 0,49 | 28,9 dB | 6,9 dB | nhanh gấp đôi nhưng đầu ra KHÁC bản kia với cùng mô hình (làm hỏng tiếng nói ở mẫu ồn) ⇒ loại |

Không dùng: mô hình 16 kHz (DTLN, NSNet2, GTCRN — cắt dải giọng còn 8 kHz); bản «độ trễ thấp» `DeepFilterNet3_ll` (36 MB, chính gói WorkAdventure ghi đã thử và
không chọn). GTCRN trong gói sapphi: không đo lại (16 kHz, không làm bộ chính được).

**Phân phối.** Hai tệp nằm ngay trong kho ở `public/loc-on/` (`df3-wasm-0200.bin` 3,98 MB, `df3-mo-hinh-v3.bin` 7,98 MB) ⇒ Pages phục vụ thẳng, KHÔNG cần R2,
không ai phải tải tay. Giới hạn Cloudflare Pages tra lại 11/11: 25 MiB một tệp, 20 000 tệp một trang (gói miễn phí) — cả hai tệp dưới trần nên không phải cắt
mảnh. Tệp ngoài kho tải sẵn của service worker (precache vẫn 169 / 170; `kiem-sw` đạt), không nằm trên đường tải mở của app nào (`kiem-toc-do-tai` 0 đỏ); chỉ
tải khi thầy bật live với lọc ồn Vừa / Mạnh: hai tệp tải song song, có tiến độ trong cửa sổ nút Live, lưu Cache Storage (lần sau đọc từ máy). Chromium trên
máy đo, tệp từ máy chủ cùng máy: tải + giải nén + dựng + chạy nóng 40 khung = 0,75–0,94 giây; trong lúc đó chạy RNNoise, xong thì đợi một quãng im
(không có thì tối đa 3 giây), khớp trễ rồi trộn chéo 200 ms.

### 7.1 Ngoại tuyến, GIỌNG THẬT (`do-loc-on.mjs`, mẫu do `tai-mau-loc-on.mjs` tải) — số gốc `docs/ban-ve-live-1011/so-do-loc-on-3-1111.json`

DeepFilterNet 3 học trên giọng người nên coi giọng tổng hợp (răng cưa + cộng hưởng) của bản đo lượt 2 là ồn và xoá sạch (SI-SDR −3 dB) ⇒ bảng này dùng ba
giọng thật: nam tiếng Anh thu 48 kHz, nữ tiếng Anh gốc 22 kHz (LJ Speech — bản thu vốn có ồn nền nên «giọng sạch» không sạch hẳn), máy đọc nơ-ron tiếng Việt gốc
16 kHz (KHÔNG phải người thật). Chưa có giọng người Việt thật, chưa có mic cài áo thật, chưa có lớp học thật. Ồn: 4 loại tổng hợp + xôn xao THẬT (5 người, 8 lớp
chồng nhau) + một bản ghi ồn thật. Mỗi ô ồn: **bớt ồn ở đoạn im (dB)** · SI-SDR hơn «không lọc» ở tín / ồn 0 / 10 / 20 dB.

| Cách lọc | Trễ | Giọng sạch đi qua: SI-SDR nam / nữ / Việt (trong ngoặc: «giữ phổ», không kể pha) | Dải tần | Quạt / điều hoà | Xôn xao thật | Gõ bút / bàn phím | Xe ngoài đường | Ồn thật (bản ghi) |
|---|---|---|---|---|---|---|---|---|
| không lọc | 0 | — | — | 0 | 0 | 0 | 0 | 0 |
| lọc ồn của TRÌNH DUYỆT — WebRTC, Chromium 153 | ≈ 5 ms | 2,4 / 5,5 / 7,5 (25,5 / 19,2 / 31,5) | 12,5 kHz (giọng nam 48 kHz) | 15,6 · 0,6 / −3 / −12,9 | 7,3 · −0,8 / −3,8 / −13,1 | 2,1 · 1,5 / −5,1 / −13,2 | 13,4 · −0,2 / −3,4 / −13 | 17,5 · −0,2 / −4,3 / −13,1 |
| RNNoise «Vừa» (lượt 2) | 10 ms | 22 / 24,6 / 26 (24,3 / 27,3 / 29) | 20 kHz | 18 · 3,5 / 3,7 / 0,8 | 6,5 · 1,2 / 2,7 / 0,7 | 13,6 · 1,7 / 1,7 / −0,2 | 21,1 · 5,6 / 4,9 / 1,4 | 21,2 · 3,6 / 2,6 / −0,1 |
| RNNoise «Mạnh» (lượt 2 — bản thầy nghe 11/11) | 10 ms | 19,5 / 22,5 / 23,9 (22 / 24,9 / 27,3) | 20 kHz | 28,1 · 4,6 / 4,4 / 0 | 8,5 · 1,6 / 2,9 / −0,2 | 15,7 · 2,5 / 2,1 / −0,8 | 34,7 · 7,5 / 5,8 / 0,4 | 35,4 · 4,9 / 3,1 / −0,8 |
| DeepFilterNet 3 thô (không cổng) | 30 ms | 41,8 / 19,3 / 42,6 | 20 kHz | 26,3 · 13,1 / 9,4 / 5,9 | 18,6 · 2,4 / 2,4 / 0,8 | 48,2 · 21,9 / 14,2 / 6,8 | 34,7 · 14,5 / 11,8 / 8,5 | 32,8 · 12,4 / 9,1 / 3,9 |
| **bộ lọc sâu «Vừa» (lượt 3)** | 30 ms | 37,3 / 20,4 / 41,5 (37,7 / 20,5 / 42,3) | 20 kHz | 21,4 · 12 / 9,1 / 5,9 | 16 · 3,3 / 3,2 / 1,4 | 24,6 · 17,2 / 13 / 6,8 | 23,1 · 13,2 / 11 / 8,1 | 24,9 · 11,5 / 8,8 / 3,9 |
| **bộ lọc sâu «Mạnh» (lượt 3)** | 30 ms | 32,8 / 19,3 / 38,1 (33,1 / 19,4 / 38,7) | 20 kHz | **36,1** · 13,1 / 9,4 / 5,7 | **22,6** · 2,4 / 2,4 / 0,7 | **60,1** · 21,7 / 14 / 6,6 | **42,9** · 14,5 / 11,6 / 8 | **47,2** · 12,3 / 9 / 3,8 |

Bớt ồn ở đoạn im của «Mạnh» theo tín / ồn 0 / 10 / 20 dB: quạt 40,4 / 37,5 / 30,5 · xôn xao thật 16,8 / 21,4 / 29,7 · gõ 65,1 / 62 / 53,2 · xe 46,8 / 44 / 37,8.

**So với mục tiêu (mức Mạnh):** ồn đều ≥ 30 dB — ĐẠT (36,1; từng mức tín / ồn đều ≥ 30) · xôn xao ≥ 20 dB — ĐẠT ở trung bình (22,6) và khi giọng thầy to hơn
tiếng xôn xao ≥ 10 dB; CHƯA đạt khi xôn xao to ngang giọng thầy (16,8 ở 0 dB) · tiếng gõ ≥ 15 dB — ĐẠT (60) · giọng sạch SI-SDR ≥ 18 dB, dải ≥ 16 kHz — ĐẠT
(19,3–38,1; 20 kHz) · giọng vốn rõ không kém «không lọc» — ĐẠT ở trung bình mọi loại ồn (+0,7 … +8 dB); CHƯA đạt ở MỘT ca: máy đọc tiếng Việt trên nền xôn
xao thật 20 dB kém 2,9 dB (hai giọng người thật cùng ca: +3,6 và +1,3).

**Đối chứng.** (a) không lọc, (b) RNNoise lượt 2, (c) lọc ồn của trình duyệt: Chromium thật dùng tệp WAV làm mic, thu đầu ra
`getUserMedia({ noiseSuppression: true })` (`do-loc-on-trinh-duyet.mjs`), căn giờ bằng tương quan chéo. Đường đo đã tự kiểm: thu KHÔNG lọc qua cùng đường ra SI-SDR
46,3 dB, bớt ồn 0 dB. Bộ của trình duyệt làm lệch pha (tách băng) nên SI-SDR dạng sóng của nó rất thấp dù tai nghe vẫn ổn ⇒ thêm chỉ số «giữ phổ» (chỉ so độ
lớn phổ): giọng sạch 19–32 dB (bộ lọc sâu Mạnh 19–39), dải giọng nam còn 12,5 kHz (bộ lọc sâu: 20 kHz), «giữ phổ» hơn «không lọc» ở quạt +1,9 / +4,1 / −0,1 dB
(bộ lọc sâu Mạnh +13,4 / +10 / +5,5). **Zoom và Meet bản gốc là mã đóng — KHÔNG đo được ở đây; không thể nói đã hơn Zoom.** Điều đo được: hơn bộ lọc WebRTC của
Chromium ở mọi loại ồn đã thử, trên tín hiệu nói trên.

### 7.2 Qua đường thật trên Chromium (`do-tre.mjs … that`, `LV_THAT` = giọng nam thật −25 dBFS + ồn thật, tín / ồn 10 dB) — số gốc `so-do-tre-1111.json` mục `loc-on-3`

| Cấu hình | Bộ đang chạy | ms / khung (Worker) | Trễ chuỗi | TỔNG mic → ra khỏi đệm rung (p95) | Ồn ở quãng nghỉ dài: tại mic → sau chuỗi → đầu nhận (dBFS) |
|---|---|---|---|---|---|
| không lọc | — | — | 0 | 51,9 (55,7) | −43,6 → −38,1 → −39,8 |
| «Mạnh» | bộ lọc sâu | 1,2–1,6 | 30 (một lượt đo 40) | 79,7 (79,8); các lượt khác 80,8–83,9 (p95 tới 99,5) | −43,6 → **−93,9** → −96,9 |
| «Vừa» | bộ lọc sâu | 1,2–1,4 | 30 | 84,9 (84,9); lượt khác 72,6–83,8 | −43,6 → −62,2 → −63,9 |

Trễ thuật toán của bộ lọc sâu: đúng 30 ms (tương quan chéo, ngoại tuyến lẫn Chromium). Tổng ≤ 100 ms — đạt ở trung vị, p95 có lượt sát trần (99,5). Trễ đo bằng
tương quan chéo trên giọng thật (bộ lọc xoá xung nên không đo bằng chuỗi xung được). CPU: hệ số thời gian thực 0,12–0,16 trên máy đo (Xeon 2,1 GHz, 4 nhân dùng
chung) — đạt ≤ 0,35. **CPU ×4: KHÔNG đo được** — lệnh hãm CPU của DevTools không tác dụng lên Worker (ms / khung giữ 1,2); ngoại suy ×4 ≈ 5–6,5 ms / khung, sát
ngưỡng tự lùi 6 ms ⇒ máy chậm gấp 4 máy đo sẽ tự về bộ lọc nhẹ. Đã thấy thật một lần: lúc máy đo quá tải (tải trung bình 7,7 trên 4 nhân) bộ lọc sâu tự bỏ
(«cham»), tiếng vẫn đi bằng RNNoise (tín / ồn đầu nhận 30 dB), không đứt. Đầu-cuối mic 13 / 13 bước, bộ thử `thu-2.mjs` 64 / 64 đạt với bộ lọc sâu bật.

### 7.3 Đường lui (test `tests/live-loc-on-3-1111.test.ts`, chạy đúng mã Worker của app)

chưa tải xong / lỗi tải ⇒ RNNoise · một khung bộ lọc sâu quá hạn 25 ms ⇒ khung ấy lấy RNNoise đã khớp trễ, rồi trộn chéo trở lại · quá hạn 3 lần trong 30 giây,
hoặc trung bình > 6 ms / khung (hệ số 0,6) ⇒ bỏ bộ lọc sâu tới lần mở app sau, cửa sổ ghi «Máy này chạy không kịp bộ lọc sâu — đang dùng bộ lọc nhẹ» · RNNoise
cũng hỏng ⇒ không lọc · Worker chuỗi hỏng ⇒ gửi thẳng mic (như cũ). Công tắc lùi khẩn: localStorage `ddh.live.df3` = `tat`.
Giới hạn đã biết: (1) mức Mạnh hạ cả giọng người đứng xa mic thầy (em trả lời từ chỗ ngồi) — muốn lớp ở xa nghe các em thì dùng Vừa hoặc mic của em;
(2) bộ lọc sâu xoá tiếng không phải giọng nói (nhạc, video thầy mở qua loa); (3) bộ lọc sâu cần RNNoise chạy được (dùng cờ có-giọng của nó).

### 7.4 Mic của em lên bảng (Z4) và «Loa» (Z2)

Mic em: `src/lib/live/mic-em.ts` — RNNoise lượt 2 mức Vừa trong AudioWorklet, đặt sau khử vọng + lọc ồn + tự chỉnh âm lượng của trình duyệt (giữ nguyên). Dùng
đường này: trình duyệt có AudioWorklet + WebAssembly và AudioContext chạy 48 kHz (Chrome / Edge máy tính và Android, Safari iPhone ≥ 14.5 — CHƯA thử trên iPhone
thật). Chỉ lọc của trình duyệt: máy yếu (`ddh.mayYeu`), không dựng được, AudioContext chưa chạy, hoặc luồng âm thanh chậm (> 3 ms / khung liền 1 giây ⇒ tự đổi lại
mic thô). Trễ thêm ≈ 40 ms (gom khung 10 + RNNoise 10 + đệm Web Audio ≈ 21). RNNoise tốn 0,12–0,2 ms / khung trên máy đo (×6 ≈ 1 ms). CHƯA đo: CPU ×4 / ×6 trên
điện thoại thật lúc lớp vẽ nét đang chạy; «cúi» tiếng em khi thầy đang nói (cần hai mic thật trong một phòng — chưa làm).
Loa: `src/lib/live/loa.ts` (`setSinkId`) — máy thầy: ô «Loa» + «Thử loa» trong cửa sổ nút Live, áp cho tiếng em nói + tiếng thử; máy em: một hàng «Loa» trong
khay khi máy có từ hai đầu ra. Có `setSinkId`: Chrome / Edge máy tính, Chrome Android bản mới, Firefox bản mới (theo tài liệu trình duyệt, chưa thử từng máy); KHÔNG có: Safari và mọi trình duyệt trên iPhone
(ẩn ô chọn). Chỉ thử bằng `setSinkId` giả lập trong test; chưa thử với loa thật.

## 8. «Đề nhấp nháy lên xuống» trên bảng live máy em (11/11, bản sống #1618) — `scripts/thu-live-1011/do-nhap-nhay-1111.mjs`

Thầy: «khi chuyển câu bấm L lên bảng thì máy học sinh vào màn hình live, đề nhấp nháy lên xuống». Đo trên Chromium thật (phòng thật trong Node, dữ liệu giả): ở từng trạng thái gắn `MutationObserver` lên vùng đề của máy em (đếm thêm / gỡ nút, đổi thuộc tính, đổi chữ) và chụp liên tiếp vùng đề, so từng cặp khung liền nhau.

**Tái hiện**: thầy đang live, chuyển sang câu Đúng / Sai (đề bài peptide của ảnh thầy gửi), em CHƯA gửi, thầy gọi bạn lên bảng ⇒ máy em bị ép vào bảng live; máy em 1971 × 1247 (đúng khổ ảnh thầy gửi).

| Trạng thái (máy em 1971 × 1247) | TRƯỚC: đổi `style` của khối đề | TRƯỚC: cặp khung khác nhau | SAU: đổi `style` | SAU: cặp khung khác nhau |
|---|---|---|---|---|
| Màn câu hỏi, em chưa gửi | 0 | 0 / 49 | 0 | 0 / 79 |
| 3 giây đầu bị ép vào bảng live | 372 (124 lần / giây) | 16 / 19 | 0 | 0 / 20 |
| Bảng live đứng yên | 616 trong 5 giây (123 lần / giây) | 26 / 33 | 0 trong 8 giây | 0 / 54 |
| Bảng live, thầy đang viết trên bảng | 612 trong 5 giây | 10 / 38 | 0 trong 8 giây | 0 / 66 |

Ở mọi trạng thái, trước lẫn sau: 0 lần thêm / gỡ nút, 0 lần gỡ nút gốc của đề, 0 lần đổi chữ — đề KHÔNG bị dựng lại; thứ đổi là `style` (bề ngang + phép phóng) của chính khối đề.

**Gốc** (`src/components/live/LopLive.tsx`, `GiayDe`; bản sao ở `TrinhPhat.tsx`): tấm giấy đề dựng thường tính hệ số phóng k = (cao giấy − 28) / (cao khối đề) rồi đặt bề ngang khối = (rộng − 36) / k. Cao khối đề lại phụ thuộc bề ngang ấy (chữ xuống dòng khác đi), và `ResizeObserver` gọi tính lại mỗi lần khối đổi cao. Số dòng nhảy bậc nên phép tính không có điểm dừng: k₁ → hẹp hơn → thêm một dòng → k₂ nhỏ hơn → rộng hơn → bớt một dòng → lại k₁… Khối đề đổi cỡ MỖI KHUNG HÌNH, mãi mãi; mắt thấy đề giật lên xuống. Có dao động hay không tuỳ khổ máy + độ dài đề: cùng câu ấy ở 1280 × 800, 1366 × 768, 844 × 390 thì hội tụ sau vài lần (0 lần đổi lúc đứng yên), ở 1971 × 1247 thì không bao giờ dừng.

**Loại trừ** (đo, máy em 844 × 390 và 1280 × 800, 6 giây mỗi trạng thái): giấy soi (`GiayThay`) lúc đứng yên / thầy viết / mở đóng khay / bút tới gần tay nắm: 0 đổi, 0 / 46–52 cặp khung khác. Màn câu hỏi lúc thầy live: khối chữ đề 0 đổi; thứ cử động trong vùng đề là hình giám thị của chặng (`g@transform` ~83 lần / giây — hoạt cảnh theo thiết kế, không phải đề).

**Sửa** (`src/components/live/vua-giay.ts` `chonHeSoGiay`): chọn k MỘT lần cho mỗi (câu, khổ ô giấy) bằng cách dò 9 nấc từ lớn xuống nhỏ, lấy nấc lớn nhất còn vừa chiều cao giấy — hàm thuần của nội dung, không có vòng phản hồi. `ResizeObserver` chỉ gọi dò lại khi khối đề đổi cao vì lý do KHÁC phép đặt của chính mình (ảnh / phông tải xong).

**Test khoá**: `tests/live-de-nhap-nhay-1111.test.tsx` — phép tính cũ dao động với khối có số dòng nhảy bậc, phép dò mới cho cùng kết quả mọi lần gọi và đo không quá 9 lần; bảng live nhận 30 view + 30 trạng thái liên tiếp (số nét, số em, tiếng, giơ tay, bạn nói) ⇒ khối đề là cùng một nút, 0 lần đổi trong ô giấy.

**Chưa làm ở bản vá này** (nằm ở nhánh hai khung độc lập `claude/may-em-doc-lap-1111`): ô giấy lúc em chưa gửi vẫn là thẻ làm bài có nút «Đúng | Sai» mờ; giấy soi của câu chữ thuần vẫn đi theo độ cuộn giấy của thầy (số đo `live.giay` lấy theo khung nhìn của tờ chiếu) — CHƯA đo được trường hợp này có gây nhảy hay không.

## 9. «Câm cả hai chiều» (11/11 tối) — phép thử TIẾNG THẬT trên SFU thật (`scripts/thu-live-dot0-1011/tieng-that.mjs`, `phong-that.mjs`)

Cách đo: workflow `thu-live-dot0-1011.yml` (`kieu: tieng-that` / `phong-that`), máy CI GitHub, Cloudflare Realtime SFU THẬT, mic giả = giọng người (DeepFilterNet assets, 1 / 2 kênh — Chrome trộn về 1 kênh).
Mỗi chiều kiểm bốn tầng: **0** mic vào có giọng · **1** bộ gửi tăng byte + `media-source` có năng lượng + tiếng gửi vẫn là giọng (tương quan đường bao với mẫu ≥ 0,5) ·
**2** `inbound-rtp` có gói + năng lượng · **3** thẻ `<audio>` chạy, không tắt tiếng, âm lượng > 0, `currentTime` tăng, tiếng nó cầm vẫn là giọng.
`tieng-that`: BẢN DỰNG THẬT (`vite build`, service worker điều khiển trang, mảnh `live-*.js` thật) + phòng giả. `phong-that`: PHÒNG THẬT (Durable Object chạy trong Node)
+ giao diện đầy đủ (tờ chiếu + ManBinhPhanUng / LopLive) + cửa `/bpu/live` thật; trình tự như thầy (mic nhớ theo tên với mã cũ, lọc ồn Mạnh, Live → Bắt đầu, gọi em, mic em tự bật, bật «Phát tiếng em ra loa lớp»).

| Lượt CI | Bản | Kết quả (mọi chiều: thầy→S1, thầy→S2, S1→thầy khi bật «Phát tiếng em», S1→S2) |
|---|---|---|
| 43001793972 | #1622 (HEAD = main), #1603 7c0935aab, #1610 cc7de387b, #1614 e6aa2a569, #1619 ca1214048 | XANH cả 4 tầng, mic 1 / 2 kênh, có / không cờ tự phát; r tiếng nhận 0,88–0,98 |
| 43006330193 | origin/main vs nhánh | P4 «chuỗi hỏng» (dừng Worker chuỗi + treo AudioContext): origin/main **CÂM** (+0 B gửi, cả lớp không nghe); nhánh: lưới an toàn phía gửi tự về mic thô ⇒ XANH |
| 43009858106 | nhánh (đo từ xa) | XANH; `ti` mỗi máy hợp lý (ICE ok srflx/udp · nhận 58–64 kb/s · thẻ chạy) |
| 43012800820 | phòng thật: origin/main + nhánh | mạng thường: XANH mọi chiều, cửa sổ nút Live «2 em đang nghe» + dòng đo đúng. **Chặn UDP cả máy: CÂM CẢ HAI CHIỀU trên cả hai bản** (máy thầy không lên SFU — chỉ STUN, không TURN; bảng vẫn chạy WebSocket); nhánh BÁO RÕ («Chưa nối máy chủ tiếng», mỗi em «⚠ …») |
| 43014908026 | phòng thật, nhánh (đo từ xa lượt 2) | XANH; «Máy thầy gửi: 43 kb/s · mức nguồn 76», «Máy thầy nhận tiếng Hà: nhận 32 kb/s · nghe −27 dBFS · loa đang phát» |

Kết luận có bằng chứng: trên Chromium chuẩn KHÔNG bản nào câm (kể cả #1619 có bộ lọc sâu) ⇒ gốc nằm ở thứ máy thật có mà CI không có. Đã loại trừ: mã chung của chuỗi «khung» / RNNoise Mạnh,
mic 2 kênh, cửa `/bpu/live`, phòng thật (live-san / live-mic / ss / noi[].ss), service worker + bản dựng thật. Lộ ra và đã sửa: thang nới mic bậc «ideal» âm thầm đổi sang mic khác
(ảnh thầy: chọn BOYALINK mà lớp nghe mic Intel); chuỗi hỏng giữa chừng làm cả lớp câm (lưới phía gửi); máy em đang phát mic hạ tiếng thầy còn 0,25 (nay 1 / 0,6); «mức nguồn 0» của đo từ xa.
Chưa tái hiện được trên CI: chặn tự phát của trình duyệt (Chromium không giao diện cho phát dù đặt chính sách) ⇒ lưới phía nghe chỉ có test vitest. Mạng chặn UDP ⇒ cần TURN (mã ở nhánh cục bộ, chờ khoá).
Mặc định: DeepFilterNet 3 + lọc mic em CHƯA đưa lại (chưa có lượt CI có bộ lọc bật xanh đủ tầng qua phòng thật) ⇒ TẮT; «Loa» hiện, chỉ gọi `setSinkId` khi chọn loa khác mặc định.

## 10. «Chỉ giọng thầy» — tách giọng theo người nói (11/11 tối, thầy: «tách giọng nói của tôi riêng và làm sạch các giọng nói khác … thật đỉnh cao triệt để») — ĐO XONG, **KHÔNG PHÁT HÀNH**

Nhánh `claude/tach-giong-1111`. Bản đo: `scripts/thu-live-1011/do-tach-giong.mjs` (mã thử: `scripts/thu-live-1011/tach-giong/ma-cong.mjs`, `ma-nhan.mjs`),
số gốc `docs/ban-ve-live-1011/so-do-tach-giong-1111.json` (lặp lại được: ồn có hạt cố định, điểm áp dụng sau đúng 50 ms; hai lượt cho số trùng nhau).

### 10.1 Tra cứu (11/11, WebSearch; huggingface.co, groups.google.com, developer.chrome.com BỊ CHẶN ở phiên này ⇒ phần nào chỉ có tóm tắt tìm kiếm thì ghi rõ)
- **`voiceIsolation` (Media Capture Extensions)**: theo tóm tắt tìm kiếm của «Intent to Ship: VoiceIsolation» (blink-dev, 01/2024; https://groups.google.com/a/chromium.org/g/blink-dev/c/hPMvCu-3iPA — không mở được trang gốc) Chrome nhận ràng buộc này trên mọi nền, nhưng CHỈ CÓ TÁC DỤNG nơi hệ điều hành có bộ tách giọng: lúc ra mắt (M123) chỉ ChromeOS, một phần thiết bị. Không thấy nguồn nào nói Chrome / Edge trên Windows làm gì với nó ⇒ trên máy thầy (Chrome Windows, BOYALINK) coi như KHÔNG có tác dụng. Đặc tả: https://w3c.github.io/mediacapture-extensions/.
- **Mô hình tách giọng theo người nói (PSE / TSE) mã mở chạy được trong trình duyệt, 48 kHz**: KHÔNG tìm thấy bản nào đủ cả ba điều kiện (mã + trọng số mở, chạy thời gian thực CPU wasm, giữ dải 48 kHz).
  pGTCRN / TEA-PSE / pDeepFilterNet / VoiceFilter-Lite: không thấy trọng số công khai. Personalized PercepNet (arXiv 2106.04129), E3Net (2204.00771), PSE của Microsoft (2110.09625): chỉ có bài báo.
  WeSep (2409.15799): bộ công cụ nghiên cứu, mô hình 16 kHz nặng. OpenSpeakerBeam-SS: 16 kHz, tác giả còn ghi «chưa kiểm chất lượng». D-LGTSE (GTCRN làm bộ lọc trước): 16 kHz, Libri2Mix.
  VoxLock (27 triệu tham số, ONNX, có bản thử trên trình duyệt) và tse-conv-tasnet-48k (48 kHz, ONNX từng khúc) nằm trên Hugging Face — phiên này không tải được ⇒ CHƯA KIỂM giấy phép / chất lượng / tốc độ.
- **Bộ nhúng giọng ONNX nhỏ** (bản phát hành «speaker-recongition-models» của sherpa-onnx, tải được): WeSpeaker CAM++ VoxCeleb (29 MB, 512 chiều, 16 kHz; mô hình CC BY 4.0 theo `docs/pretrained.md` của WeSpeaker, mã Apache-2.0) — tách giọng thầy / người khác SẠCH; WeSpeaker ResNet34 (26 MB) cũng tách được nhưng chậm gấp đôi (97 ms / cửa sổ 0,5 s); CAM++ bản 3D-Speaker (29,6 MB) thì KHÔNG tách được (cos thầy ≈ cos người khác ≈ 0,4 với cùng fbank — bỏ). ONNX Runtime Web 1.20.1 (MIT): wasm 11 MB, chạy một luồng (trang không cách ly cross-origin).
  Đo CAM++ (Node, wasm 1 luồng, máy chứa phiên làm việc này — KHÔNG phải máy thầy, máy xách tay có thể chậm hơn): cửa sổ 0,5 s ≈ 38 ms, 0,75 s ≈ 52 ms; giọng thầy (phần không dùng làm mẫu) cos 0,34–0,60 với mẫu, 6 giọng khác ≤ 0,27.

### 10.2 Cách đã thử (vì không có mô hình tách 48 kHz): CỔNG THEO NGƯỜI NÓI
Bộ nhận giọng CAM++ 16 kHz chỉ làm BỘ QUYẾT ĐỊNH «đúng giọng thầy không» cho câu đang nói (chấm 0,3–0,75 s tiếng có giọng gần nhất, 100–200 ms một lần, Worker riêng);
tín hiệu 48 kHz gốc chỉ bị NHÂN HỆ SỐ (mở / hạ −30 dB / hạ −15 dB khi tiếng nhỏ hơn hẳn giọng thầy), không lọc, không đệm. Luật lệch về phía thầy: mặc định mở;
câu mới sau quãng nghỉ mà to tới dải giọng thầy ⇒ mở; hạ chỉ khi có điểm «người khác» còn tươi, trong dải giọng thầy phải hai điểm liền; 700 ms không có điểm mới ⇒ mở.

### 10.3 Số đo (cảnh 18 s: thầy một mình · người khác một mình · NÓI CHỒNG · người khác · thầy nói NGAY sau người khác, hở 150 ms; giọng thầy = giọng nam thật −25 dBFS)
«Giọng khác giảm» = năng lượng vào / ra ở đoạn chỉ có người khác. «Giọng thầy giữ» = SI-SDR ra so với vào ở đoạn thầy một mình. «Nói chồng» = SI-SDR so với giọng thầy sạch, vào → ra.
«Mở sau» = đoạn thầy nói ngay sau người khác: từ TIẾNG ĐẦU TIÊN của thầy (khung ≥ −45 dBFS) tới lúc cổng mở (≥ −3 dB). Ở mẫu này tiếng đầu là một âm ngắn (≈ 100 ms, ≈ −30 dBFS) đứng trước câu chính ≈ 0,45 s; câu chính thì cổng mở ĐÚNG lúc (soát lại bằng `LV_DONG`, ca 0 và 10 dB, giọng nam). * «Chuẩn trình duyệt» ngoại tuyến coi như đi thẳng (lọc ồn WebRTC không xoá giọng nói; không chạy được ngoài trình duyệt).

| tín / nhiễu | người khác | cách | giọng khác giảm (dB) | giọng thầy giữ (SI-SDR dB) | nói chồng (SI-SDR dB) | mở sau, tính từ tiếng đầu (ms) | dải tới −3 dB (kHz) | trễ thêm (ms) |
|---|---|---|---|---|---|---|---|---|
| 0 dB | HS nam gần mic | Chuẩn trình duyệt* | 0 | ∞ (không đổi) | −1,7 → −1,7 | — | 23,9 | 0 |
| 0 dB | HS nam gần mic | Mạnh (RNNoise) | 0 | 18,1 | −1,7 → −1,9 | — | 7,5 | 10 |
| 0 dB | HS nam gần mic | Chỉ giọng thầy | 8,0 | ∞ (không đổi) | −1,7 → **−6,6** | **590** | 23,9 | 0 |
| 0 dB | HS nữ gần mic | Chuẩn trình duyệt* | 0 | ∞ | −4,5 → −4,5 | — | 23,9 | 0 |
| 0 dB | HS nữ gần mic | Mạnh (RNNoise) | 0,1 | 18,2 | −4,5 → −4,7 | — | 9,6 | 10 |
| 0 dB | HS nữ gần mic | Chỉ giọng thầy | 5,2 | ∞ | −4,5 → −5,5 | **550** | 23,9 | 0 |
| 0 dB | Xôn xao 5 giọng | Chuẩn trình duyệt* | 0 | ∞ | −4,1 → −4,1 | — | 23,9 | 0 |
| 0 dB | Xôn xao 5 giọng | Mạnh (RNNoise) | 0,8 | 18,2 | −4,1 → −3,2 | — | 9,6 | 10 |
| 0 dB | Xôn xao 5 giọng | Chỉ giọng thầy | 7,8 | ∞ | −4,1 → **−10,7** | **600** | 23,9 | 0 |
| 10 dB | HS nam gần mic | Chuẩn trình duyệt* | 0 | ∞ | 8,2 → 8,2 | — | 23,9 | 0 |
| 10 dB | HS nam gần mic | Mạnh (RNNoise) | 1,5 | 18,1 | 8,2 → 8,2 | — | 9,6 | 10 |
| 10 dB | HS nam gần mic | Chỉ giọng thầy | 7,3 | ∞ | 8,2 → 8,1 | **550** | 23,9 | 0 |
| 10 dB | HS nữ gần mic | Chuẩn trình duyệt* | 0 | ∞ | 5,4 → 5,4 | — | 23,9 | 0 |
| 10 dB | HS nữ gần mic | Mạnh (RNNoise) | 4,5 | 18,2 | 5,4 → 5,5 | — | 9,6 | 10 |
| 10 dB | HS nữ gần mic | Chỉ giọng thầy | 5,5 | ∞ | 5,4 → **1,3** | **550** | 23,9 | 0 |
| 10 dB | Xôn xao 5 giọng | Chuẩn trình duyệt* | 0 | ∞ | 5,7 → 5,7 | — | 23,9 | 0 |
| 10 dB | Xôn xao 5 giọng | Mạnh (RNNoise) | 7,8 | 18,2 | 5,7 → 8,8 | — | 9,6 | 10 |
| 10 dB | Xôn xao 5 giọng | Chỉ giọng thầy | 7,5 | ∞ | 5,7 → 6,3 | **590** | 23,9 | 0 |

CPU «Chỉ giọng thầy»: bộ nhận giọng 47–55 ms / lượt chấm, hệ số thời gian thực 0,26–0,30 (máy chứa phiên làm việc này; chưa đo trên máy thầy); cổng 13–17 µs / khung 10 ms.
Tải lần đầu khi bật: ≈ 40 MB (mô hình 29 MB tách hai tệp vì Pages giới hạn 25 MiB / tệp + wasm 11 MB).

### 10.4 Vì sao KHÔNG phát hành
- **Mất tiếng thầy khi thầy đáp ngay sau học sinh**: âm ngắn đầu tiên (≈ 100 ms, đứng trước câu chính) bị hạ −30 dB, tổng ≈ 250 ms tiếng thầy bị hạ (5,5–6,1 % khung có tiếng thầy, toàn bộ ở đoạn này; thầy nói một mình thì 0 khung). Gốc: cổng còn đóng theo điểm «người khác», bộ nhận giọng cần ≈ 0,3–0,5 s giọng mới kết luận, không có nhìn trước (thêm nhìn trước = thêm trễ, trái luật «tức thì»).
- **Nói chồng làm hỏng giọng thầy**: 0 dB SI-SDR của thầy giảm 1,0–6,6 dB; 10 dB giọng nữ 5,4 → 1,3. Nhúng giọng của tiếng chồng giống «người khác» ⇒ cổng hạ cả thầy.
- **Lợi ích nhỏ**: giọng khác chỉ giảm 5–8 dB (≈ 0,5 s đầu mỗi câu của người khác vẫn lọt; cổng không tách được tiếng chồng).
- Sáu lượt chỉnh luật chỉ đổi qua đổi lại giữa «để lọt học sinh» và «cắt thầy» — giới hạn nằm ở cách làm (cổng + quyết định chậm), không ở tham số.
⇒ Không đưa vào app (không có mức «Chỉ giọng thầy», không tải mô hình, không đổi đường mic thầy / em). Việc 2 (mẫu giọng tự lấy từ «Xem lại Live») và phép thử thật trên CI không làm vì không phát hành. Máy em giữ nguyên lọc của trình duyệt.

### 10.5 Phương án thay (đề xuất cho thầy)
1. **Micro đeo đầu (headset) có màng định hướng cardioid / supercardioid, đặt sát miệng** thay mic cài áo: giọng thầy to hơn hẳn giọng khác nhờ khoảng cách sát miệng + hướng thu (bớt bao nhiêu dB phải đo bằng mic thật — chưa đo), trễ thêm 0 ms, không cắt đầu câu. Đây là cách «chỉ giọng thầy» thật sự triệt để hiện nay.
2. Giữ **«Chuẩn trình duyệt»** (đường đã chứng minh có tiếng) làm mặc định.
3. Phiên sau có mạng tới Hugging Face: thả mô hình tách theo người nói 48 kHz (VoxLock, tse-conv-tasnet-48k …) vào `do-tach-giong.mjs` (đã sẵn cảnh + số đo) và chỉ phát hành nếu: «mở sau» ≤ 50 ms, nói chồng không làm giảm SI-SDR của thầy, giọng khác giảm ≥ 20 dB, hệ số thời gian thực ≤ 0,6 trên máy thầy.

## 11. Tách giọng thầy — LƯỢT 2 (11/11 đêm, thầy: «Phải tách được giọng. Làm mọi cách đi nhé»; 20:30: «huấn luyện giọng thầy trong đêm nay luôn … giữ được độ sáng rõ của giọng nói»)

### 11.1 Đo nhiễu THẬT trên «Xem lại Live» (A) — giọng khác chỉ thấp hơn giọng thầy ≈ 2 dB ⇒ cổng gần mic KHÔNG làm được
Mã: `scripts/thu-live-1011/tach-giong/nhieu-that/` (tải bằng mã thầy ở biến môi trường, không in / không ghi; tệp tiếng và nhúng giọng chỉ ở thư mục tạm). Số gốc (chỉ số, không giọng): `docs/ban-ve-live-1011/so-do-nhieu-that-1111.json`.
- Nguồn: 5 buổi thử tối 11/11 (18:36–19:24 giờ VN) có tiếng: `4a551f8e`, `75f8acfc`, `bac5a835`, `c444eb20`, `c4f8ad99`; bỏ `1aca71b0` (4 s ngoài `emNoi`), `6c325251` và `7847bb30` (`emNoi` phủ cả buổi). Tệp tiếng = mic thầy sau xử lý của trình duyệt (24 kHz, MP3 48 kb/s; tự chỉnh âm lượng bật).
- Cách: vùng chỉ có thầy = bỏ `emNoi` ± 1 s và khoảng lặng (354 s). Khung 10 ms có tiếng = > −60 dBFS và Silero VAD (MIT) ≥ 0,5. Cửa sổ 1 s bước 0,25 s ⇒ CAM++ (chép sang Python, fbank y hệt `ma-nhan.mjs`, soát lại: cho số trùng lượt 1) ⇒ cos với tâm giọng thầy (tâm tự tìm: cụm to nhất, lặp lấy cos > 0,5). Phân bố cos có HAI ĐỈNH rõ (0,0–0,2 và 0,5–0,75) ⇒ T = cos ≥ 0,40, K = ≤ 0,25, «?» = giữa.
- Kết quả (giây có tiếng: T 66,6 s · K 68,0 s · «?» 4,9 s):

| buổi | T giây | T dBFS P10 / P50 / P90 | K giây | K dBFS P10 / P50 / P90 | thầy − khác (P50, dB) | K / thời gian có tiếng | F0 thầy / khác (Hz) |
|---|---|---|---|---|---|---|---|
| 4a551f8e | 46,1 | −39,8 / −20,5 / −12,3 | 9,9 | −45,7 / −27,1 / −12,6 | 6,6 | 17 % | 125 / 271 |
| 75f8acfc | 15,3 | −40,1 / −18,0 / −11,5 | 3,4 | −37,7 / −19,3 / −11,0 | 1,3 | 18 % | 117 / 107 |
| bac5a835 | 2,7 | −43,9 / −14,0 / −10,4 | 11,9 | −39,3 / −19,9 / −11,1 | 5,9 | 78 % | 125 / 229 |
| c444eb20 | 1,4 | −37,2 / −13,5 / −9,9 | 10,2 | −40,4 / −20,9 / −11,6 | 7,4 | 88 % | 119 / 216 |
| c4f8ad99 | 1,1 | −45,1 / −27,3 / −20,6 | 32,6 | −42,8 / −22,9 / −12,3 | −4,4 | 92 % | 107 / 302 |
| **gộp** | 66,6 | −40,2 / −20,0 / −11,7 | 68,0 | −42,5 / −22,1 / −12,0 | **2,1** | **49 %** | — |

- **Giọng khác chỉ thấp hơn giọng thầy 2,1 dB (trung vị; từng buổi −4,4 … +7,4 dB); P90 của giọng khác TO HƠN trung vị giọng thầy 8 dB.** Giọng khác chiếm 49 % thời gian có tiếng ngoài lúc em bật mic.
- Giọng K là ai: F0 ≈ 216–302 Hz (thầy 107–125 Hz), các tâm K của các buổi giống nhau (cos 0,45–0,83), và cửa sổ TRONG `emNoi` giống K nhiều hơn giống thầy ở 6/8 buổi ⇒ chính người đóng vai «em» trong buổi thử, ngồi gần mic thầy (nói trước khi bật / sau khi tắt mic em). Chuyển lượt thầy ↔ K nhiều chỗ < 1 s mà mức hai bên vẫn ngang nhau ⇒ không phải do tự chỉnh âm lượng kéo giọng khác lên (bộ này đổi ≤ vài dB / giây).
- Giới hạn: buổi THỬ, không phải buổi dạy (lớp thật em ngồi xa hơn ⇒ có thể chênh hơn); không biết buổi nào dùng BOYALINK hay mic mảng của máy (lỗi đã gặp, `src/lib/live/thang-mic.ts`); nói chồng KHÔNG đo trực tiếp được — 4 % «?» chỉ là cận trên của phần lẫn / khó nhận.
- ⇒ **Hướng B1 (cổng gần mic, cần chênh ≥ 15 dB) bị loại.** Chênh ≈ 2 dB thì chỉ mô hình tách thật mới làm được (B2 / B3). Micro đeo đầu có màng định hướng sát miệng (10.5 mục 1) càng quan trọng: chênh 2 dB là do mic thu được người ngồi cạnh gần bằng thầy.

### 11.2 Mô hình RIÊNG giọng thầy (B3, thầy 20:30: «huấn luyện giọng thầy trong đêm nay luôn») — đường ống chạy, đang luyện, CHƯA đạt
Mã luyện: `scripts/thu-live-1011/tach-giong/luyen/` (JAX trên CPU — PyTorch không tải được ở phiên này; `luyen.py` · xuất `xuat.py` · trích dữ liệu `trich-du-lieu.py` /
`them-buoi.py` · tự lấy buổi Live mới mỗi 45 phút `canh-buoi-moi.sh`). Lõi chạy trong app: `src/lib/live/tach-giong-thay.ts` (chuỗi ES5, KHÔNG wasm, không ONNX Runtime).
Trọng số `.tgt` (2,1 MB, không chứa tiếng): `scripts/thu-live-1011/tach-giong/ckpt/` (nhánh `claude/tach-giong-yt-1111` luyện thêm bằng bài giảng YouTube, cùng định dạng).
- **Kiến trúc:** STFT căn-Hann 20 ms bước 10 ms (48 kHz: 960 / 480) ⇒ trễ thuật toán 20 ms, không nhìn trước. Đặc trưng log-phổ 221 ô 0–11 kHz (bước 50 Hz) ⇒ Dense 192 (tanh)
  ⇒ GRU 192 ⇒ GRU 192 (+ nối tắt) ⇒ Dense 221 + sigmoid = mặt nạ từng ô. **Dải 11–24 kHz** nhân trung bình mặt nạ 6–11 kHz ⇒ giữ đủ dải 48 kHz khi thầy nói
  (dữ liệu luyện là MP3 «Xem lại Live» cắt ở ≈ 11 kHz nên mạng không học dải cao). Sàn hệ số −50 dB. 529 nghìn tham số; ≈ 0,53 triệu phép nhân-cộng / khung.
- **Dữ liệu:** giọng thầy trích từ «Xem lại Live» (cửa sổ 1 s cos CAM++ với tâm thầy TB ≥ 0,40, nhỏ nhất ≥ 0,25, với tâm «khác» ≤ 0,25): 119 s luyện +
  32 s GIỮ RIÊNG để chấm (buổi 75f8acfc, không bao giờ luyện). Giọng khác: giọng thật trong phòng (94 s, tăng khi có buổi mới; giữ riêng bac5a835 16 s) +
  AudioMNIST (MIT, 60 người 48 kHz, đi qua đúng đường MP3 24 kHz 48 kb/s; 6 người giữ riêng). Ồn: bản ghi ồn thật + ồn màu. Trộn: thầy −32…−12 dBFS, giọng khác −6…+12 dB
  so với thầy (đo thật 2 dB), 1–2 người, có đoạn một mình / chồng / bắt đầu / dứt; 12 % mẫu không có thầy. Tăng cường: EQ ngẫu nhiên ±4 dB, đổi tốc độ ±6 % (≈ ±1 bán cung),
  vang phòng tổng hợp (thầy nhẹ, người khác nặng hơn).
- **Mất mát:** sai số phổ nén (|.|^0,3) trọng số ×1,6 ở 3–6 kHz, ×2,2 ở 6–11 kHz (giữ độ sáng) + phạt thêm khi mất tiếng thầy + phạt phần giọng khác lọt.
- **Lõi JS khớp bản luyện:** mặt nạ lệch numpy ≤ 2·10⁻⁸; FFT 960, STFT tái tạo đúng (test `tests/live-tach-giong-thay-1111.test.ts`).
- **Checkpoint đầu (bước 1000, ≈ 8 phút luyện)** — bản đo 18 s với giọng THẦY THẬT giữ riêng + giọng khác thật giữ riêng (`LV_THAY`, `LV_KHAC`, `LV_MH`; số gốc
  `docs/ban-ve-live-1011/so-do-tach-giong-mo-hinh-1000-1111.json`): giọng khác giảm **1,9–3,0 dB** (cổng lượt 1: 0,1–2,2; Mạnh: 0–1,6); thầy một mình SI-SDR 19,2 dB;
  nói chồng ở 2 dB không hại thầy (8,4 → 8,3; giọng khác thật 4,1 → 5,7 — cổng lượt 1 làm hỏng 4,1 → −2,9); mở sau 10–60 ms; hệ số thời gian thực 0,10–0,12
  (máy phiên, Node, một luồng). **Còn rất xa tiêu chí «giảm ≥ 20 dB».**
- **Giới hạn của số đo:** (1) MIỀN MP3 — giọng thầy chấm là MP3 «Xem lại Live» (cùng miền với dữ liệu luyện); lúc chạy thật mô hình nhận tiếng mic 48 kHz sạch ⇒
  đạt trên bản đo này chưa phải đạt khi dùng (điểm miền sạch: nhánh YouTube giữ riêng giọng sạch). (2) Hàng «khac-that» CHƯA giữ riêng theo NGƯỜI: người đóng vai em
  trong buổi thử có cả trong dữ liệu luyện; học sinh thật chưa thử. (3) 62 % giọng thầy trích ra (77 / 124 s) nằm trong `emNoi` ± 1 s ⇒ có thể lẫn giọng em vào đích
  (đã lọc bằng CAM++ nhưng không chắc sạch hết); bỏ hẳn thì chỉ còn ≈ 47 s.
- Cột «dải tới −3 dB» của bản đo cũ không dùng được cho mô hình: giọng mẫu là MP3 (không có gì trên 11 kHz) và mô hình hạ dải < 150 Hz ⇒ thước đo dừng ở dải đầu.

- **Bước 3000 → 5000, hai bản song song** (phạt phần lọt mọi ô): A (`TG_L2=1`, `TG_LOT=0,5`) · B (`TG_L2=0,3`, `TG_LOT=1`). Chấm NỘI BỘ (AudioMNIST người giữ riêng,
  giọng khác thật — người ĐÃ gặp): giọng khác giảm A 19,7 dB / B 28,9 dB (đều ở cả −5 / 2 / 10 dB ⇒ không chỉ học mức to nhỏ). NHƯNG bản đo 18 s (giọng chưa gặp):
  A giảm 3,2–5,5 dB, thầy một mình 20,5–21,7 dB, mở sau 10–90 ms (xôn xao 0 dB: 250 ms) · B giảm 6,2–11,5 dB, thầy một mình 12,5–13,5 dB, 95 % khung thầy bị hạ,
  mở sau 250–900 ms ⇒ bỏ B. Đo nhanh A (`do-nhanh.mjs`, mỗi giọng −25 dBFS): thầy giữ riêng bị hạ 2,8 dB · giọng khác thật (đã gặp) 11,7 · LJ nữ 3,8 · VCTK nam 6,2 ·
  LibriSpeech 5,7 · tiếng Việt máy đọc 10,7. Đường 24 kHz và 48 kHz của lõi cho số TRÙNG nhau (không phải lỗi lõi).
  ⇒ **Mạng phân biệt theo KHO DỮ LIỆU, chưa theo GIỌNG**: giọng khác luyện chỉ có AudioMNIST (đọc chữ số) + một người thật. Sửa: «người giả» (giọng thầy đổi cao độ +
  formant ×1,18–1,6 / ×0,72–0,86) làm giọng khác; xin thêm kho giọng mở nhiều người (Common Voice vi CC0 / FLEURS vi CC BY 4.0) qua tác tử YouTube.
- **Luật luyện từ bước 5000 (thầy chốt):** phạt NĂNG LƯỢNG RA ở khung không có thầy (trọng số tăng dần `TG_IM0` → `TG_IM1` trong 15 000 bước); giọng khác giữ riêng THEO
  NGƯỜI (người đóng vai em của mọi buổi thử 11/11 chỉ để chấm); giọng thầy trong `emNoi` ± 1 s chỉ giữ khi qua lọc chặt (cos TB ≥ 0,50, nhỏ nhất ≥ 0,40, «khác» ≤ 0,15)
  ⇒ giọng thầy live còn 37,5 s luyện (tập chấm 75f8acfc giữ nguyên 27 s); YouTube (khi có) là nguồn chính: 60 % mẫu MIỀN SẠCH (thầy YouTube sạch + giọng khác sạch),
  còn lại miền MP3; chấm thêm miền sạch trên video YouTube giữ riêng; «mở sau» chấm ở mỗi checkpoint.

- **Kho giọng mở (giọng khác nhiều người, `chuan-bi-mo.py`):** LibriSpeech (CC BY 4.0), FLEURS vi (CC BY 4.0), Common Voice vi (CC0) và **VIVOS (CC BY-NC-SA — PHI
  THƯƠNG MẠI)**: thầy DUYỆT dùng nội bộ (11/11 ~22:00: «Kho phi thương mại … tôi chỉ dùng nội bộ thôi, bạn tải thoải mái đi») ⇒ **mô hình luyện có dữ liệu NC, CHỈ DÙNG
  NỘI BỘ**; danh sách kho NC đã nạp ghi ở `du-lieu/mo/kho-nc.json` của lượt luyện. Tách luyện / chấm theo người; người có trong bản đo 18 s luôn ở tập chấm. Thông thấp
  ngẫu nhiên chung cả mẫu (4 / 8 kHz / nguyên, không rộng hơn dải gốc hẹp nhất) để mạng không học mẹo «dải rộng ⇒ thầy».

### 11.3 Bộ chạy trong app (trên nhánh, ẨN sau cờ — chưa phát hành)
- Mức «Chỉ giọng thầy» ('thay') trong hàng «Lọc ồn»; chỉ hiện khi `localStorage['ddh.live.chi-thay'] = 'hien'` VÀ có địa chỉ mô hình (`URL_MO_HINH_THAY` — đang null —
  hoặc `ddh.live.chi-thay-url` để thử). Mặc định không chọn; chọn thì nhớ (`ddh.live.loc-on`). Lùi khẩn: `ddh.live.chi-thay = 'tat'`.
- Chạy trong Worker khung của `chuoi-tieng.ts` (MA_TACH ghép trước MA_KHUNG), 480 mẫu 48 kHz / khung. Đường «Làm rõ»: sau RNNoise (tắt ở mức này), trước nâng mức.
  Đường «Chuẩn trình duyệt»: chuỗi CHỈ-TÁCH (không lọc 80 Hz, không nâng mức) chỉ được gửi khi mức này bật và mô hình không hỏng.
- Bật / tắt trộn một khung (không «bụp»). LƯỚI (luật thầy chốt: CHỈ HỌC SINH NÓI MÀ ĐẦU RA IM LÀ ĐÚNG): chỉ về tiếng gốc khi (a) bộ nhận giọng báo đang có giọng
  thầy (tin `thayNoi`) ≥ 1,5 s mà tiếng ra hạ ≥ 30 dB ⇒ «cam-thay» — CHƯA có bộ nhận giọng nối vào app nên nhánh này chưa kích; (b) lỗi kỹ thuật: số hỏng ⇒ tắt ngay;
  tiếng ra ≈ 0 tuyệt đối (< −100 dBFS, sàn −50 dB nên mô hình đúng không chạm) khi mic có tín hiệu 1,5 s ⇒ «cam-ky-thuat»; hệ số thời gian thực (đo mỗi 2 s trên máy
  thầy) > 0,6 ⇒ «cham»; Worker không báo khung quá 2,5 s ⇒ «ngung»; tải / nạp hỏng ⇒ «loi». Tự tắt ⇒ gửi lại tiếng như trước + ghi lý do (chẩn đoán `luoi`).
  Test `tests/live-chi-thay-luoi-1111.test.ts` (cả hai nhánh, và «chỉ học sinh nói, ra hạ 40 dB suốt 3 s ⇒ KHÔNG tắt»).
- Dòng trạng thái trong cửa sổ Live: «Mô hình <bản> · luyện <ngày> · máy này chạy <x> % thời gian thực» hoặc «Đã tự tắt (lý do) — lớp nghe tiếng như trước».

### 11.4 Trạng thái cuối lượt 2 (11/11 ≈ 22:05 giờ VN) — CHƯA ĐẠT, KHÔNG PHÁT HÀNH (mức «Chỉ giọng thầy» vẫn ẩn)
> **Đính chính (lượt 3, 11.7):** bản đo 18 s dùng `LV_THAY` dài bị lỗi dựng cảnh ⇒ «giọng khác giảm» và «mở sau» của MÔ HÌNH ở 11.2 và mục này đo SAI (thấp hơn thật nhiều); số đúng ở 11.7.
Đo nhanh mỗi checkpoint (`do-nhanh.mjs`: lõi JS 48 kHz, mỗi giọng −25 dBFS, số dB bị hạ):

| bản | thầy giữ riêng (mong ≈ 0) | thầy nói to / cao giọng | giọng khác thật | LJ nữ | VCTK nam | LibriSpeech 1320 | tiếng Việt máy đọc | AudioMNIST đủ dải | kho mở chưa gặp |
|---|---|---|---|---|---|---|---|---|---|
| a-5000 (chưa có kho mở) | 2,8 | 3,2 | 11,7 | 3,8 | 6,2 | 5,7 | 10,7 | 32,5 | 4,9 |
| c-7000 (+ LibriSpeech, người giả) | 3,6 | 4,8 | 14,1 | 4,6 | 11,3 | 14,3 | 12,2 | 37,7 | 8,9 |
| e-7000 (giữ thầy hơn) | 3,2 | 3,6 | 15,8 | 4,4 | 14,1 | 19,5 | 13,9 | 46,7 | 9,1 |

Bốn tiêu chí (mục 10.5) — bản đo 18 s, giọng THẦY THẬT giữ riêng (miền MP3), mức 0 / 2 / 10 dB:

| tiêu chí | a-5000 (giữ thầy tốt nhất) | e-7000 (hạ giọng khác nhiều nhất) | đạt? |
|---|---|---|---|
| mở sau ≤ 50 ms | 10–40 ms phần lớn; giọng khác thật 0 dB 90 ms; xôn xao 0 dB 250 ms | 40–60 ms; xôn xao 250 ms | KHÔNG |
| nói chồng không làm giảm SI-SDR thầy | giọng khác thật tăng (2,1 → 4,1); giọng nam / xôn xao giảm (8,4 → 7,0; 16,4 → 9,6) | giảm hầu hết (4,1 → −1,5; 16,4 → 4,5) | KHÔNG |
| giọng khác giảm ≥ 20 dB | 3,2–5,5 dB | 3,2–6,8 dB (một mình); 4,6–13,4 dB lúc chồng | KHÔNG |
| hệ số thời gian thực ≤ 0,6 | 0,08–0,12 | 0,13–0,21 (máy phiên, Node một luồng, đang luyện song song) | ĐẠT (máy phiên) |
| (thêm) thầy một mình SI-SDR · giữ dải | 20,5–21,7 dB | 10–10,6 dB; 6–11 kHz −6,4 dB, dải 11–24 kHz −14 dB (đục) | — |

**Kết luận:** chưa bản nào đạt. Gốc: giọng thầy để luyện quá ít (live sau lọc chặt 44 s; YouTube chưa vào được) ⇒ hạ giọng khác thêm bao nhiêu là
hạ / làm đục thầy bấy nhiêu; kho giọng mở (LibriSpeech) làm giọng chưa gặp tăng rõ (VCTK 6 → 14 dB, LibriSpeech 6 → 19,5 dB) nhưng giọng nữ LJ vẫn chỉ 4 dB.
Vỡ số (NaN) ở bước 7000 lúc thêm thông thấp: đã sửa (mục 11.2), các checkpoint hỏng đã bỏ.
**Đang chạy tiếp (nền, `setsid nohup`, ghi checkpoint mỗi 1000 bước, chạy lại thì tự nạp checkpoint mới nhất):** lượt C (`TG_L2=1,5 TG_LOT=0,3 TG_IM1=0,2 TG_GIA=0,15`) và E
(`TG_L2=2,5 TG_LOT=0,2 TG_IM1=0,1 TG_GIA=0,1`) từ bước 7000 — phạt khung không-thầy NHẸ lại để không đẩy hai hàng «thầy» xấu thêm; `canh-buoi-moi.sh` (25 phút: buổi Live
mới, YouTube `giong-thay-youtube/`, kho mở `giong-khac-mo/`); `canh-ck.sh` (đo nhanh mỗi checkpoint ⇒ `do-nhanh.log` ở thư mục tạm). Chọn bản bằng bản đo 18 s trên giọng
CHƯA GẶP (`LV_CHI_MH=1 … do-tach-giong.mjs`), KHÔNG bằng chấm nội bộ. Trọng số trong kho: `scripts/thu-live-1011/tach-giong/ckpt/thay-ck1-2000.tgt`; các bản sau
(a-5000, c-/e-7000 …) chỉ ở thư mục tạm của phiên (`mh/*.tgt`) — chưa đưa vào kho.
**Việc kế:** nạp giờ YouTube làm nguồn giọng thầy chính (miền sạch), VIVOS / FLEURS / Common Voice cho giọng Việt nhiều người; chỉ khi bản đo 18 s đạt đủ 4 tiêu chí
mới đặt `URL_MO_HINH_THAY` (sau lệnh có mã thầy), rồi chạy phép thử CI cho mức này (tải đoạn bài giảng công khai làm mic giả, hoặc kiểm SỐNG nếu không tải được).
B2 (mô hình có sẵn trên Hugging Face qua runner): KHÔNG làm — điều phối hạ ưu tiên; tra cứu lượt 1 cho thấy các mô hình mở đều 16 kHz hoặc khúc dài (trái tiêu chí trễ / dải).

### 11.5 Quyết của điều phối (11/11 đêm) — trọng số, cách phát hành, dữ liệu cần thêm
- **Trọng số:** KHÔNG commit trọng số luyện từ giọng thầy / dữ liệu NC (VIVOS) lên nhánh công khai (hệ thống quyền đã chặn một lần — không lách). Trọng số giữ ở thư
  mục tạm của phiên (`mh/*.tgt`, `ck-*/`). `scripts/thu-live-1011/tach-giong/ckpt/thay-ck1-2000.tgt` (bước 2000, trước khi có dữ liệu NC) đã có trên nhánh thì để yên,
  không thêm tệp mới.
- **Cách phát hành (khi có bản đạt đủ 4 tiêu chí — CHƯA làm mã):** tệp mô hình đặt ở R2 RIÊNG, tải qua một lệnh Worker chỉ máy thầy đã đăng nhập (mã thầy) mới lấy
  được; KHÔNG đặt ở Pages công khai, không vào precache. `URL_MO_HINH_THAY` (src/lib/live/chi-thay.ts) trỏ tới lệnh ấy; `taiMoHinhThay` gửi kèm mã như các lệnh khác
  của app thầy. Mô hình có dữ liệu NC ⇒ chỉ dùng nội bộ.
- **Cần bao nhiêu giọng thầy (ƯỚC LƯỢNG, ngoại suy thô):** với 44 s giọng thầy sạch (bước 8000, bản E), giọng chưa gặp chỉ hạ 3,8–12 dB và thầy đã bị hạ 2,2 dB; với 119 s
  (bản A, trước lọc chặt) thầy giữ tốt hơn nhưng giọng chưa gặp chỉ hạ 3–6 dB (khi đó chưa có kho giọng mở). Theo kinh nghiệm chung của mô hình riêng một người nói, mỗi
  lần GẤP ĐÔI giọng đích sạch thêm ≈ 2–3 dB mức chặn trên giọng chưa gặp mà không làm thầy xấu đi ⇒ từ ≈ 8 dB lên ≥ 20 dB cần 4–5 lần gấp đôi ⇒ **cỡ 15–30 phút giọng
  thầy sạch**, đa dạng (giảng, đọc, hỏi, nhấn mạnh, nói to), cộng kho giọng khác nhiều người (đã có VIVOS / LibriSpeech / FLEURS). Đây là ước lượng, chỉ đường cong thật
  sau khi nạp mới xác nhận được.
- **Cách nhanh nhất để thầy đưa giọng:** (1) một buổi Live MỘT MÌNH 15–20 phút ở chỗ yên tĩnh (không em nào bật mic), giảng / đọc bình thường rồi kết thúc — bản ghi
  vào «Xem lại Live», `canh-buoi-moi.sh` tự tải và trích (đi qua MP3 48 kb/s ⇒ dải tới ≈ 11 kHz); hoặc (2) đính kèm thẳng tệp bài giảng tự tải từ YouTube Studio
  (tệp gốc của thầy, dải rộng) vào cuộc trò chuyện ⇒ đặt vào `giong-thay-youtube/` của phiên, `chuan-bi-yt.py` tự đổi sang hai miền (sạch + MP3) và giữ riêng một tệp
  để chấm độ sáng. Cách (2) tốt hơn cho miền mic sạch 48 kHz lúc chạy thật.
- **Đang chạy qua đêm (điều phối dừng sáng 12/11):** luyện C, E; `canh-buoi-moi.sh` (gọi Worker thật bằng mã thầy mỗi 25 phút — không tự dừng); `canh-ck.sh`.
  Dừng: `pkill -f "ma/luyen.py du-lieu ck-c"` · `pkill -f "ma/luyen.py du-lieu ck-e"` · `pkill -f ma/canh-buoi-moi.sh` · `pkill -f ma/canh-ck.sh`.
  Đọc số: `do-nhanh.log` (thư mục tạm của phiên); chọn bản bằng bản đo 18 s trên giọng chưa gặp. Lưu ý: FLEURS cum000 (người chấm) lọt vào thư mục luyện từ lần quét
  bước 8000 tới lần quét bước 10000 ⇒ đừng dùng số FLEURS giữ riêng của C / E trước bước 10000.


### 11.7 Lượt 3 (12/11 rạng sáng, giờ VN) — 4 tiêu chí trên bản đo 18 s ĐÃ SỬA, thêm giọng thầy trong `emNoi`, lượt F giữ thầy — CHƯA ĐẠT, KHÔNG PHÁT HÀNH (mức «Chỉ giọng thầy» vẫn ẩn)
(11.6 — YouTube / kho giọng mở — ở nhánh `claude/tach-giong-yt-1111`.) Mã: `luyen/them-thay-em-noi.py`, `luyen/tom-do18.py`, `luyen/do-trang-thai.mjs`, sửa `do-tach-giong.mjs`;
số gốc, trọng số, tiếng chỉ ở thư mục tạm của phiên (`lv3/`, `mh/`, `ck-*/`, `du-lieu-f/`) — không vào kho.

**Sự cố máy:** máy phiên khởi động lại ≈ 02:27 (19:27 UTC) ⇒ C, E, `canh-ck.sh` chết ở bước ≈ 29 300 (checkpoint 29 000 còn). 05:01 khởi lại E (tự nạp ck-029000,
thêm `TG_IM_TU=20000` để `lamIm` không tăng lại từ 0,05) và `canh-ck.sh`; C không chạy lại (nhường chỗ cho F). Chạy nền có thể chết như vậy: chạy lại `chay-luyen.sh` là tự nạp checkpoint mới nhất.

**LỖI CỦA BẢN ĐO 18 s (đã sửa):** `canh()` đặt khúc thầy và khúc nói chồng dài `nT / 2` — đúng 2,8 s với `giong-nam.wav` (lượt 1), nhưng với `LV_THAY` = giọng thầy
thật 32 s thì dài 13,5 s ⇒ thầy nói LIỀN từ 0,3 tới 18,2 s và giọng khác kéo tới 18,2 s ⇒ hai đoạn «khác một mình» và đoạn «thầy sau khác» thật ra là NÓI CHỒNG.
⇒ **mọi số «giọng khác giảm» (3–7 dB) và «mở sau» của MÔ HÌNH ở 11.2 / 11.4 là SAI, thấp hơn thật nhiều**; «thầy một mình», giữ dải, hệ số thời gian thực không bị ảnh hưởng.
Nay mỗi khúc đúng 2,8 s (giong-nam không đổi ⇒ số lượt 1 giữ nguyên). Soát chéo bằng `do-trang-thai.mjs` (cùng đoạn giọng khác 3 s chạy riêng): cùng cỡ số với bản đã sửa.
Mức vào của đoạn chồng thấp hơn mức danh định (SI-SDR vào −5,6…−9,3 dB ở «0 dB») vì khúc giọng thầy đặt vào đó có quãng lặng — số vẫn so vào → ra trên cùng một đoạn.

#### (1) Bốn tiêu chí — bản đo 18 s đã sửa
Giọng thầy thật giữ riêng (75f8acfc, miền MP3, −25 dBFS); giọng khác: VCTK nam, LJ nữ, người đóng vai em giữ riêng (bac5a835), xôn xao 5 giọng; thấp hơn thầy 0 / 2 / 10 dB.
`LV_CHI_MH=1 LV_THAY=… LV_KHAC=… LV_MH=<.tgt> node scripts/thu-live-1011/do-tach-giong.mjs <ra.json>`, tóm bằng `python3 luyen/tom-do18.py <ra.json>`.

| tiêu chí (10.5) | C-28000 | E-28000 | E-34000 | F-31000 (chỉ đổi tham số) | F-33000 (+ giọng thầy mới) | đạt? |
|---|---|---|---|---|---|---|
| mở sau ≤ 50 ms | 0–30 | 0–30 | 0–50 | 0–20 | 0 | ĐẠT |
| nói chồng không giảm SI-SDR thầy (12 ca, vào → ra) | tăng 11 / 12; 10 dB giọng nam 4,6 → 4,2 | tăng 10 / 12 (1 ca bằng); xôn xao 0 dB −8,5 → −8,7 | tăng 11 / 12; xôn xao 0 dB −8,5 → −8,8 | tăng 10 / 12 (1 ca bằng); xôn xao 0 dB −8,5 → −9,0 | tăng 11 / 12; 10 dB nam 4,6 → 4,5 | GẦN (mỗi bản giảm ≤ 0,5 dB ở 1 ca) |
| giọng khác giảm ≥ 20 dB (một mình): VCTK nam · LJ nữ · em thật · xôn xao | 14–17 · 23–27 · 20–26 · **7** | 14–17 · 20–31 · 22–28 · **5** | 17–24 · 28–30 · 23–27 · **6–7** | 12–16 · 20–26 · 17–19 · **4–5** | 7–8 · 12–16 · 12–16 · **3** | KHÔNG |
| hệ số thời gian thực ≤ 0,6 (máy phiên, Node 1 luồng) | 0,08–0,09 | 0,08–0,10 | 0,08–0,09 | 0,08–0,10 | 0,08–0,11 | ĐẠT (máy phiên) |
| thầy bị hạ, đoạn thầy một mình (mong ≤ 0,5 dB) | 1,3–1,5 | 1,2–1,3 | 1,3–1,5 | 1,0–1,1 | **0,8–0,9** | KHÔNG |
| giữ dải (dB): 0,1–1 / 1–3 / 3–6 / 6–11 / 11–24 kHz | −1,5 / −0,8 / −2,0 / −2,6 / −9,5 | −1,3 / −0,8 / −2,1 / −5,2 / −7,5 | −1,4 / −1,0 / −2,2 / −4,5 / −7,2 | −1,1 / −0,7 / −1,4 / −2,5 / −5,6 | −0,9 / −0,5 / −0,9 / −0,9 / −4,4 | — |
| SI-SDR thầy một mình (dB) | 7,2–8,1 | 7,6–8,5 | 6,9–7,3 | 8,1–9,0 | 9,2–10,9 | — |

- **Dải −3 dB:** cột cũ `daiTanHz` dừng ở 117 Hz vì mô hình cắt dưới ≈ 150 Hz (thước quét từ dải thấp) ⇒ báo theo dải. KHÔNG có bản ghi giọng thầy 48 kHz (YouTube không tải được,
  «Xem lại Live» là MP3 24 kHz) ⇒ 0,1–11 kHz đo trên giọng MP3; riêng 11–24 kHz là hệ số mô hình đặt cho dải cao, KHÔNG phụ thuộc tiếng vào (đặc trưng chỉ lấy 0–11 kHz) ⇒
  đúng cho mic 48 kHz. F-33000: ≥ −0,9 dB từ 150 Hz tới 11 kHz, −4,4 dB ở 11–24 kHz ⇒ dải −3 dB ≈ 0,15–11 kHz.
- **Vì sao dải cao tối:** 11–24 kHz = trung bình KHÔNG trọng số của mặt nạ 6–11 kHz (`o.cao`, `tach-giong-thay.ts`) — ô yếu (giữa các hài, ồn) kéo xuống ⇒ F-33000 −4,4 dB trong khi
  6–11 kHz theo năng lượng chỉ −0,9. Sửa: trung bình theo năng lượng (∑M·|Y|² / ∑|Y|²) ở lõi + `cham()` của `luyen.py` + test `live-tach-giong-thay-1111` — CHƯA làm.
- **Trạng thái mang sang** (`do-trang-thai.mjs`, E-28000, giọng khác 0 dB, giọng khác giảm theo 0–0,25 / 0,25–0,5 / 0,5–1 / 1–2 / 2–3 s): VCTK nam qua bộ tách MỚI 35 / 50 / 48 / 50 / 29 dB;
  sau 2,8 s thầy nói 18 / 22 / 26 / 19 / 13 dB; sau 2,8 s nói chồng 18 / 27 / 23 / 15 / 11 dB (em thật: mới 20–50, sau chồng 14–28) ⇒ mạng «nhớ» đang có thầy và nới tay nhiều giây.
  Mẫu luyện: thầy nói gần suốt mẫu 2 s (chỉ hở ≤ 0,6 s) ⇒ chưa từng gặp «thầy dừng, người khác nói một mình vài giây».
- **Xôn xao 5 giọng chỉ giảm 3–7 dB** (từng giọng một 12–31 dB): mẫu luyện chỉ có 1–2 người khác.
- Đo nhanh (`do-nhanh.mjs`) giờ cùng cỡ với bản 18 s đã sửa ở từng giọng (E-28000: VCTK nam 14,6 / 16,4 dB) ⇒ vẫn dùng lọc checkpoint được, nhưng không thấy xôn xao và trạng thái mang sang.

#### (2) Thêm giọng thầy — 37,5 s → 55,2 s tiếng thầy luyện (+17,7 s, +47 %; tính cả quãng nghỉ bộ luyện chèn: 46 → 68 s)
- Worker `/gv/live-ds` có 9 buổi, ĐỀU đã có ở máy (thêm `7847bb30` đã xoá trên Worker, bản ở máy còn) ⇒ không có buổi mới. Hai buổi sau 19:10 (1bb2fcd1 20:04, f2c39a2d 21:16):
  cos với tâm thầy rất thấp (f2c39a2d P99 0,35 cả trong lẫn ngoài `emNoi`) ⇒ 0 s; chưa rõ vì sao (mic khác, hay thầy ít nói).
- `them-thay-em-noi.py`: khung 10 ms trong `emNoi` ± 1 s là thầy khi ≥ 3 cửa sổ CAM++ 1 s phủ nó và MỌI cửa sổ có cos-thầy ≥ T, cos-em ≤ E (cos-em = max với tâm giọng em của
  từng đoạn `emNoi` — cửa sổ cos-thầy ≤ 0,2 — và tâm «khác» chung); đoạn ≥ 0,5 s; không trùng khung đã có. Ngưỡng hiệu chỉnh ở MỨC KHUNG trên tập giữ riêng: dương = thầy
  75f8acfc; âm = 83 giọng chưa gặp đi qua MP3 24 kHz 48 kb/s (kho mở tập chấm, AudioMNIST giữ riêng, em thật giữ riêng, giọng mẫu). Lần đầu chọn ở mức CỬA SỔ
  (T 0,636 · E 0,192) ⇒ ở mức khung gần như 0 khung qua ⇒ chọn lại: **T = 0,494, E = 0,25** — khung thầy giữ riêng qua 64,6 %; giọng khác một mình lọt **0,15 %** (ngưỡng ≤ 1 %
  là T 0,412); hỗn hợp thầy + giọng khác thấp hơn 0 / 6 / 10 / 20 dB lọt 4,3 / 9,7 / 14 / 20 % khung ⇒ một phần khung mới có thể lẫn giọng em thấp hơn ≈ 10 dB.
- Tăng gần hết từ 4a551f8e (+15,2 s); 6c325251, c444eb20 +1 s; 1aca71b0 +0,5 s; các buổi còn lại 0 (cửa sổ qua ngưỡng nằm rời rạc, hiếm khung có MỌI cửa sổ phủ cùng qua). Tập chấm 75f8acfc
  giữ nguyên (27 s). Giọng mới chỉ ở `du-lieu-f/` (lượt F); E giữ dữ liệu cũ. Vẫn xa mức cần (15–30 phút, 11.5).

#### (3) Lượt F — nhắm GIỮ GIỌNG THẦY
Khởi 05:10 từ E-28000 (chép `ck-giu/e-ck-028000.pkl` ⇒ `ck-f/`), tới 40 000 bước:
`TG_DL=du-lieu-f TG_L2=4 TG_LOT=0.05 TG_IM0=0.1 TG_IM1=0.1 TG_GIA=0.05 bash luyen/chay-luyen.sh ck-f 40000` (E: L2 2,5 · LOT 0,2 · IM 0,05 → 0,1 · GIA 0,1). Theo hàm mất mát:
- `l3` (LOT) phạt `(M·|Y − S|)^0,6` ở MỌI ô, kể cả ô có thầy; |Y − S| gồm cả ồn và dư MP3, ô cao tần có tín / ồn kém nhất ⇒ là số hạng duy nhất kéo mặt nạ xuống ngay trên
  giọng thầy (E-28000 −5,2 dB ở 6–11 kHz) ⇒ hạ mạnh 0,2 → 0,05.
- `l2` (L2) chỉ phạt khi ra NHỎ hơn thầy (`relu(St − Sh)²`) ⇒ tăng vừa 2,5 → 4. Ở ô mạng chưa chắc là thầy (xác suất p), mặt nạ tối ưu theo nén 0,3 ≈
  p(1 + L2) / (p(1 + L2) + (1 − p)(1 + LOT)) ⇒ tăng L2 / giảm LOT nâng mặt nạ ở cả thầy LẪN giọng khác mạng còn phân vân.
- `l4` (IM) chỉ ở khung KHÔNG có thầy — số hạng duy nhất nhắm đúng đoạn người khác nói một mình ⇒ giữ 0,1 (= E), IM0 = IM1 để không tăng lại từ 0,05.
- GIA («người giả» = giọng thầy đổi cao độ) dạy mạng hạ cả thầy lúc cao giọng (hàng «thầy nói to» bị hạ nhiều nhất) ⇒ 0,1 → 0,05.

Kết quả: F-33000 giữ thầy tốt nhất từ trước tới nay (thầy bị hạ 0,8–0,9 dB, 6–11 kHz −0,9 dB, mở sau 0, nói chồng không hại) NHƯNG giọng khác chỉ giảm 7–16 dB (E-28000 14–31).
⇒ **đổi trọng số chỉ trượt dọc MỘT đường đánh đổi** (giống sáu lượt chỉnh cổng ở 10.4) — F KHÔNG «tốt hơn rõ» E; chưa bản nào đạt đủ 4 tiêu chí + giữ thầy.
F-35000 (bản đo 18 s): thầy bị hạ 1,0–1,1 dB · VCTK nam 7–9 · LJ nữ 16–23 · em thật 15–23 · xôn xao 4 dB · nói chồng không giảm ca nào ⇒ F dao động quanh cùng chỗ.
Đo nhanh F (thầy / thầy nói to, dB hạ): 28000 2,1 / 3,3 ⇒ 31000 1,7 / 2,8 ⇒ 33000 1,4 / 2,4 ⇒ 34000 1,8 / 3,1 ⇒ 35000 2,1 / 3,2.
E chạy tiếp (E-34000): giọng khác một mình 17–30 dB (VCTK nam 17–24) nhưng thầy bị hạ 1,3–1,5 dB, 6–11 kHz −4,5 dB — đi ngược chiều F trên cùng đường đánh đổi.

#### (4) Việc kế — mã đã có trong `luyen.py`, MẶC ĐỊNH TẮT (E / F chạy lại vẫn y như cũ)
- `TG_LUOT` = tỉ lệ mẫu LUÂN LƯỢT: thầy dừng một quãng 35–80 % mẫu, người khác vào sau 0–0,4 s và nói một mình tới quanh lúc thầy nói lại (± 0,3 s); nên kèm `TG_GIAY ≥ 4`
  ⇒ nhắm «trạng thái mang sang».
- `TG_XON` = tỉ lệ mẫu XÔN XAO: 3–5 người nói cùng lúc, mỗi giọng chia √n ⇒ nhắm hàng xôn xao 3–7 dB.
- Dải cao theo năng lượng (mục 1); nguồn giọng thầy sạch dài (buổi Live một mình / tệp gốc YouTube Studio, 11.5) vẫn là nút thắt: F cho thấy giữ thầy và chặn giọng
  khác cùng phụ thuộc mạng CHẮC CHẮN bao nhiêu về giọng thầy, chỉnh trọng số không thay được dữ liệu.
- **Lượt G (đang chạy, khởi 06:09 khi E dừng ở 40 000):** từ F-37000, cùng tham số + dữ liệu F, thêm `TG_LUOT=0.3 TG_XON=0.15 TG_GIAY=4`, tới 60 000 bước
  (`TG_DL=du-lieu-f TG_L2=4 TG_LOT=0.05 TG_IM0=0.1 TG_IM1=0.1 TG_GIA=0.05 TG_LUOT=0.3 TG_XON=0.15 TG_GIAY=4 bash luyen/chay-luyen.sh ck-g 60000`; 0,7 s / bước).
  Khác F ở HAI chỗ: cách dựng mẫu (luân lượt + xôn xao, mẫu 4 s) và lịch học (tới 60 000 ⇒ tốc độ học ở bước 37 000 ≈ 5·10⁻⁴ thay vì ≈ 1·10⁻⁴ của F, vốn đã gần cuối lịch).
  Chấm G bằng bản đo 18 s (hàng xôn xao, nhóm 1–2 s / 2–4 s, «sau thầy», «thầy bị hạ»), không bằng đo nhanh (đo nhanh dựng bộ tách mới cho mỗi tệp ⇒ không thấy trạng thái
  mang sang). Vài nghìn bước chưa đổi thì CHƯA bác được ý này.

#### (5) Chạy nền khi kết thúc lượt 3 (thư mục tạm của phiên)
E đã tự dừng ở 40 000 (06:08). Đang chạy: F (tới 40 000 rồi tự dừng), G (tới 60 000), `canh-ck.sh` (xuất + đo nhanh mỗi checkpoint của ck-c / ck-e / ck-f / ck-g ⇒ `do-nhanh.log`).
Dừng: `pkill -f "ma/luyen.py du-lieu-f ck-f"` · `pkill -f "ma/luyen.py du-lieu-f ck-g"` · `pkill -f ma/canh-ck.sh` (E nếu chạy lại: `pkill -f "ma/luyen.py du-lieu ck-e"`).
`canh-buoi-moi.sh` vẫn TẮT. Checkpoint giữ riêng (không bị xoay vòng): `ck-giu/` (e-28000 / 29000 / 30000, c-29000, f-33000 / 35000 / 37000).
Bản đo 18 s một checkpoint: `bash lv3/do18.sh ck-x-NNNNN` (thư mục tạm) ⇒ `lv3/do18-ck-x-NNNNN.json`, rồi `tom-do18.py`.
