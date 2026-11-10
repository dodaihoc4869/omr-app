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
