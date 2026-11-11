# Số đo «Xem lại Live» đợt X1 — 11/11/2026

Đặc tả: `docs/dac-ta-live-xem-lai-1011.md` (mục 7, 9 đợt X0 / X1). Thầy chốt build 11/11 nên đợt X0 (thử trên máy thật) CHƯA làm; tệp này là bằng chứng thay thế.

**Tất cả số dưới đây đo trên MÁY MÔ PHỎNG:** Chromium 153.0.8010.12 của Playwright trên Linux, mic giả (`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`, phát tiếng bíp ~0,5 giây một lần), máy chủ thử cục bộ. **Chưa có iPhone / Android thật, chưa có giọng thầy thật, chưa có Cloudflare R2 / D1 thật.** Không số nào ở đây thay được bảng «Đo thật» mục 7 của đặc tả.

## 1. Máy ghi thật chạy 70 giây (mic giả)

Mã chạy: máy ghi thật `src/lib/live/may-ghi.ts` (AudioWorklet ⇒ Web Worker ⇒ LAME wasm ⇒ khúc 10 giây theo số mẫu ⇒ `POST /bpu/live/ghi`). Số thô: `docs/ban-ve-live-xem-lai-1011/so-do-may-ghi.json`.

| Việc | Số đo |
|---|---|
| Tần số mic vào | 44.100 Hz (LAME tự đổi sang 24 kHz) |
| Số khúc trong 70 giây | 8 (7 khúc đủ + khúc cuối 6 khung lúc dừng) |
| Khung mỗi khúc đủ | 414 · 416 · 417 · 417 · 416 · 417 · 417 (10 giây = 416,7 khung 24 ms) |
| Byte mỗi khúc đủ (cả phần đầu) | 59.767 – 60.206 byte |
| Tệp ghép (nối khung) | 420.480 byte = 2.920 khung × 144 byte ⇒ 70,080 giây |
| Thời lượng khi giải mã cả tệp | 70,080 giây (khớp số khung, lệch 0 ms) |
| Thời lượng `<audio>` báo | 70,080 giây |
| Khúc đóng đúng nhịp | 7 khúc đủ đóng ở 10,02 · 20,00 · 30,02 · 40,00 · 50,03 · 60,01 · 69,99 giây; khúc cuối ở 70,01 giây (lúc dừng); 8 / 8 khúc tải lên được |
| Dừng ghi ⇒ khúc cuối tải xong | 61 ms |
| Tin `live-ghi` gửi phòng | 16 tin (đang-ghi lúc bắt đầu, nhịp 10 giây + mỗi khúc một tin kèm mẫu đồng hồ, tin cuối `tat` + `xong`) |
| Mốc giờ nét (24 mốc giả, 3 giây một mốc) | 24 / 24 nằm trong phần đầu khúc, sai 0 ms so với giờ đã đánh |
| Trôi giữa đồng hồ mẫu và đồng hồ máy giữa hai khúc liền nhau | trung vị 0 ms, lớn nhất 8 ms |
| Lỗi trang | 0 |

**Lệch mốc giờ tiếng** (thay tạm cho phép đo «gõ ngòi bút» của đặc tả): vị trí từng tiếng bíp trong tệp + `t0` của khúc đầu, so với giờ máy lúc luồng chính nghe thấy đúng tiếng bíp đó (AnalyserNode, dò 2 ms một lần). 138 / 138 bíp khớp: trung vị −30 ms, nhỏ nhất −44 ms, lớn nhất −19 ms, p95 trị tuyệt đối 40 ms. Dấu âm = tệp ghi tiếng SỚM hơn lúc luồng chính nghe thấy; phần lớn là độ trễ của chính phép dò. Mục tiêu đặc tả: lệch nét–tiếng ≤ 80 ms.

## 2. Mở tệp MP3 bằng `<audio>`, tua, đo `currentTime`

**Tệp 70 giây** (trình duyệt tải cả tệp một lần, `Range 0-420479`):

| Tua tới | `currentTime` sau khi tua | Lệch | Thời gian tua |
|---|---|---|---|
| 35,040 giây (giữa) | 35,040 | 0 ms | 5 ms |
| 17,520 · 52,560 · 63,072 · 7,008 · 42,048 · 23,126 | đúng đích cả 6 lần | 0 ms | ≤ 1 ms |

Tua tới giữa rồi phát 2,000 giây: `currentTime` 35,040 → 37,000 (đồng hồ chạy tiếp đúng chỗ).

**Tệp dài 630,72 giây** (đoạn vừa ghi lặp 9 lần, 3.784.320 byte; máy chủ thử gửi chậm 64 KB mỗi 150 ms để trình duyệt PHẢI xin Range khi tua):

| Tua tới | `currentTime` | Lệch | Thời gian tua | Trình duyệt xin từ byte | Byte tính theo CBR (6.000 byte / giây) |
|---|---|---|---|---|---|
| 315,360 (giữa) | 315,360 | 0 ms | 14 ms | 1.867.776 | 1.892.160 |
| 504,576 | 504,576 | 0 ms | 10 ms | 3.014.656 | 3.027.456 |
| 189,216 | 189,216 | 0 ms | 11 ms | 1.114.112 | 1.135.296 |
| 599,184 | 599,184 | 0 ms | 12 ms | 3.571.712 | 3.595.104 |

- Thời lượng `<audio>` báo cho tệp dài: 630,720 giây (đúng số khung × 24 ms).
- Trình duyệt xin sớm hơn vị trí CBR 12–24 KB (2–4 giây) rồi giải mã tới đích.
- **Nội dung sau khi tua có đúng chỗ không:** phát 4 giây sau mỗi lần tua, ghi `currentTime` lúc từng tiếng bíp bắt đầu, so với vị trí bíp thật trong tệp. Tua tới 315,360: 7 bíp, lệch trung vị 14 ms (lớn nhất 16 ms). Tới 126,144: 7 bíp, 8 ms (11 ms). Tới 536,112: 8 bíp, 15 ms (37 ms). Bíp cách nhau ~0,5 giây nên phép đo này chỉ bắt được lệch dưới ±0,25 giây.

## 3. Chốt ở máy chủ (phần tính toán)

Phòng thật của Bình Phản Ứng chạy trong Node, R2 giả trong bộ nhớ, 150 em, 60 nét × 40 điểm mỗi câu (`scripts/thu-live-xem-lai-1111/do-chot.ts`). **Không gồm độ trễ mạng của R2 / D1 thật.**

| Buổi live | Khúc | Thời gian chốt | Câu / đoạn | `tieng.mp3` | `net.bin` | `buoi.json` | Lần đọc R2 | Phần tải lên |
|---|---|---|---|---|---|---|---|---|
| 30 phút | 180 | 60 ms | 3 / 3 | 10,3 MB | 70 KB | 2 KB | 180 | 3 |
| 60 phút | 360 | 93 ms | 7 / 7 | 20,6 MB | 156 KB | 4 KB | 361 | 5 |
| 90 phút | 540 | 179 ms | 10 / 10 | 30,9 MB | 235 KB | 5 KB | 541 | 7 |

Buổi 60 và 90 phút chốt qua hai bước (mỗi bước đọc tối đa 300 khúc). Trên Cloudflare thật mỗi lần đọc R2 là một lượt mạng: 540 lần đọc nối tiếp, chưa đo — đây là phần quyết định «tắt live ⇒ sẵn sàng ≤ 60 giây».

## 4. Màn «Lịch sử Live» của thầy

28 ảnh Chromium thật của bản build thật (`dist`, đường `/gv`, dữ liệu giả): `docs/ban-ve-live-xem-lai-1011/that-gv-*.jpg`, khổ 1366 và 390, sáng và tối. Trạng thái: nút Live ở Hôm nay có chip «1 đang xử lý» · có buổi · đang xử lý + dựng lỗi · chọn nhiều · xác nhận xoá · đổi tên · rỗng. Soát tự động (`that-gv-soat.json`): lỗi trang 0 · tràn ngang 0 · đích bấm nhỏ hơn 44 px 0 · ảnh quá 150 KB 0.

Chưa chụp: ngăn «Đang ghi để xem lại» trên màn chiếu và dòng «Đang ghi để lớp xem lại» trên máy em (chỉ có test tự động `tests/live-xem-lai-may-ghi-1111.test.ts`, `tests/live-xem-lai-chot-1111.test.ts`).

## 5. Chưa đo (việc của đợt thử máy thật)

- iPhone iOS 14 / 15 / 17 / mới nhất và một Android tầm thấp: phát, tua MP3 CBR qua Range, đổi tốc độ, nút gạt im lặng.
- Giọng thầy thật ở 48 kb/s so với 32 kb/s; lệch nét–tiếng bằng tiếng gõ ngòi bút.
- Thẻ live của thầy xuống nền 5 phút; máy thầy tắt đột ngột (số giây tiếng cuối bị mất).
- Thời gian chốt và cửa `/live-tep` trên Cloudflare thật (R2, D1, Durable Object); cách trình duyệt đệm tệp qua vé có hạn.
- Trộn tiếng em ở xa vào bản ghi (cần Cloudflare Realtime SFU thật).

## 6. Gói bên thứ ba thêm ở đợt này

| Gói | Bản | Giấy phép | Cỡ | Dùng ở đâu |
|---|---|---|---|---|
| `wasm-media-encoders` | 0.7.0 (bản mới nhất trên npm, phát hành 05/2024) | MIT cho phần bọc; tệp `wasm/mp3.wasm` là bộ mã hoá LAME, giấy phép LGPL | `mp3.wasm` 132.999 byte (67 KB nén); phần JS vào mảnh luồng thợ 12,6 KB | chỉ trên máy thầy, lúc đang live |

Tệp wasm đứng riêng (`dist/assets/mp3-*.wasm`), nạp lúc chạy trong luồng thợ, không sửa mã LAME, không nằm trong precache, không nằm trên đường mở của app nào.

## 7. Cách chạy lại

```
npx vite build --config scripts/thu-live-xem-lai-1111/vite.config.mjs --outDir <thư mục tạm>
node scripts/thu-live-xem-lai-1111/do-ghi.mjs <thư mục tạm> 70
npm run build && node scripts/thu-live-xem-lai-1111/chup-lich-su.mjs
npx esbuild scripts/thu-live-xem-lai-1111/do-chot.ts --bundle --platform=node --format=esm --outfile=<tạm>/do-chot.mjs && node <tạm>/do-chot.mjs
```
