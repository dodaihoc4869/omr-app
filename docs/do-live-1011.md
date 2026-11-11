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

