# Đặc tả — «Đấu Nguyên Tử», game bắn nhau của phòng chờ thi (30/10/2026)

**Lời thầy (30/10, nguyên văn):** «Phần game chờ thiết kế một kiểu game bắn súng thay hoàn toàn game hiện tại đẹp xịn nhẹ hấp dẫn để học sinh chờ có thể bắn với nhau được luôn qua số báo danh hoặc gì đó tiện nhất để hs hứng thú.»
**Duyệt:** thầy 30/10 22:45 «tự duyệt bản vẽ build luôn» ⇒ đã build trên nhánh `claude/game-ban-sung-3010` (chưa gộp, chưa phát hành).
**Bản vẽ:** `docs/ban-ve-game-ban-sung-3010/` — `mau.html` (bản chạy được, tự đủ) + 24 ảnh (4 trạng thái × 390/844/1440 × sáng/tối) + `that/` (12 ảnh của chính bản build).

## 0. Tóm tắt

| | Trước (game đang chạy) | Sau |
|---|---|---|
| Tên, chỗ | «Bắn nguyên tố» — `src/components/phong-cho/BanNguyenTo.tsx` + `ban-nguyen-to-loi.ts`, nạp lười từ `src/components/PhongChoGame.tsx` (màn `phase === 'cho'` của `ExamTakeScreen`) | «Đấu Nguyên Tử» — `src/components/phong-cho/DauIon.tsx` (mã nội bộ `dau-ion`), cùng chỗ nạp |
| Chơi với ai | Một mình, tàu tự bắn hạt rơi | **Bắn nhau 1–1 hoặc nhóm 3–4 bạn cùng phòng chờ**, hoặc Tập với A.I |
| Mạng | 0 | WebSocket tới MỘT Durable Object của ca, chỉ khi em bấm «Vào sảnh đấu» |
| Mảnh tải (gzip) | 6,4 KB JS + 1,3 KB CSS | 17,2 KB JS + 3,5 KB CSS — ngoài precache, chỉ tải khi đã vào phòng chờ |
| Byte mở app | — | Không đổi (cổng tốc độ 0 đỏ; đường thi /t nhẹ hơn 0,1 KB vì bỏ biểu tượng game cũ) |

Tên «Đấu Ion» (bản nháp) bị bỏ: phông chữ không chân làm «Ion» đọc thành «lon».

## 1. Mục tiêu và người dùng

- **Ai:** học sinh đang đứng ở phòng chờ ca kiểm tra (đã qua cổng danh sách, thầy chưa bấm «Bắt đầu thi»). Thầy và phụ huynh không thấy game.
- **Cảm giác cần đạt:** vài phút chờ trước giờ thi thành vui, bớt căng; trò chuyện bằng game với bạn ngồi cạnh. Không phải học, không có câu hỏi, không điểm, không EXP.
- **Hợp lứa tuổi:** hoạt hình, chủ đề Hoá. Mỗi em là một **nguyên tử** (hạt nhân có ký hiệu nguyên tố, 3 vỏ electron quay). Súng là **súng ion**, đạn là hạt ion sáng. Trúng thì vỡ một vỏ electron, hết vỏ thì «tan» thành bong bóng. Không máu me, không vũ khí thật.
- **Chút Hoá có chủ đích:** màu áo theo quy ước CPK của mô hình phân tử (O đỏ, N lam, Cl lục, S vàng, Fe cam, Na tím, Ne lam ngọc); sân là bàn thí nghiệm (bình cầu, bình nón, giá ống nghiệm, cốc có vạch); vật phẩm **Xúc tác** (vòng benzene, bắn nhanh gấp đôi 5 giây) và **Khiên** (chặn một viên).

### Vòng chơi
- **Trận 1–1:** 90 giây. Mỗi em Máu 3 (3 vỏ electron). Trúng một viên mất 1 Máu; hết Máu ⇒ bị **hạ**, hồi lại sau 1,6 giây ở góc xa kẻ địch, có khiên 1,2 giây. **Hạ 5 lần trước là thắng**; hết giờ ai hạ nhiều hơn thắng, bằng nhau là hoà.
- **Trận nhóm (3–4 bạn):** mỗi người tự đánh, 120 giây, hạ 7 lần trước là thắng; kết quả xếp hạng.
- **Tập với A.I:** luật trận 1–1, chạy ngay trên máy em, 0 mạng. A.I có hai mức (dễ ⇒ vừa sau khi em thắng).
- **Kết quả:** «Em thắng! / Em thua / Hoà», tỉ số, bảng Hạ · Bị hạ · Trúng (%) · Chuỗi hạ, nút «Thách đấu lại» (1–1) hoặc «Đấu lại» (A.I), «Về sảnh đấu». Dòng «Kết quả chỉ để vui, không lưu vào điểm.» Thắng hôm nay đếm trên máy em (localStorage), không gửi máy chủ.

## 2. Bố cục và điều khiển

**Sảnh đấu** (thẻ trong phòng chờ, dưới dòng «Đang chờ Thầy bấm bắt đầu», chữ ca/lớp/thời lượng giữ nguyên): tiêu đề + «Thắng hôm nay», ảnh bìa vẽ Canvas, một câu luật; MỘT nút chính (`Vào sảnh đấu` ⇒ sau khi vào là `Đấu nhanh`); `Tập với A.I` · `Nhóm 3–4 bạn`; danh sách «Bạn trong sảnh đấu · N» (chấm nguyên tố, tên gọi, Rảnh / Đang tìm trận / Đang đấu, nút `Thách`); ô «Thách theo số báo danh» (bàn phím số); chọn nguyên tố (7 nút tròn 44 px); công tắc «Ẩn tên», «Không nhận lời thách». Lời thách đến hiện ngay đầu thẻ: «Ngọc Trâm thách em đấu 1–1 · còn 20 giây» + `Nhận lời` / `Để sau`.

**Màn trận** phủ kín khung nhìn (để chơi được cả ở màn ngang 390 px), dải trên cùng luôn ghi «Phòng chờ · Thầy bắt đầu là vào bài» + `Rời trận`. Sân vuông 600 × 600 đơn vị — CÙNG một sân ở mọi khổ, công bằng giữa máy dọc/ngang/máy tính.

| Khổ | Bố cục | Điều khiển |
|---|---|---|
| Điện thoại dọc (390 × 844) | Dải · thẻ điểm (Em — giờ còn — bạn) · sân (rộng hết màn) · hai cần · hàng phản ứng nhanh | Cần trái «Di chuyển» (cần nổi, kéo theo ngón). Cần phải «Ngắm · Bắn»: kéo = ngắm và bắn liên tục; chạm nhanh = **tự ngắm bạn gần nhất** bắn một loạt. Chạm vào sân = bắn về chỗ chạm. Không ngắm tay thì nòng hướng theo hướng đi. |
| Điện thoại ngang (844 × 390) | Cần trái · sân ở giữa · cần phải; thẻ kết quả rút gọn | Như trên |
| Máy tính (1440 × 900) | Sân 750 px + cột phải «Cách chơi», «Phản ứng nhanh» | W A S D / mũi tên đi; chuột ngắm, giữ chuột trái bắn; phím cách = tự ngắm và bắn (chơi được chỉ bằng bàn phím) |

Rung nhẹ 12 ms khi em trúng đạn (máy Android, tắt ở chế độ giảm hiệu ứng). Không có âm thanh (lớp đang chờ thi).

## 3. Trạng thái

| Trạng thái | Hiện gì |
|---|---|
| Đang tải mảnh game | «Đang chuẩn bị trò chơi…» (có sẵn ở PhongChoGame); mảnh lỗi ⇒ «Mini-game chưa tải được. Em vẫn sẽ vào bài khi Thầy bắt đầu.» |
| Chưa vào sảnh (mặc định lần đầu) | `Vào sảnh đấu` + `Tập với A.I`; **0 kết nối mạng**. Đã từng vào ⇒ lần sau tự vào |
| Đang nối | «Đang vào sảnh đấu…» |
| Sảnh trống | «Chưa có bạn nào vào sảnh đấu. Rủ bạn ngồi cạnh bấm «Vào sảnh đấu», hoặc tập với A.I trong lúc chờ.» |
| Đang tìm trận nhanh | «Đang tìm bạn rảnh…» + `Huỷ tìm`; gợi ý tập A.I trong lúc chờ (vẫn giữ chỗ) |
| Mất mạng | «Mất kết nối sảnh đấu — đang thử lại (lần N)…» (1 → 2 → 4 → 8 giây, 5 lần) rồi «Chưa nối được sảnh đấu. Em vẫn tập được với A.I.» |
| Máy chủ tắt game / không có vé | «Sảnh đấu chưa mở ở ca này. Em vẫn tập được với A.I.» |
| Vé hết hạn (> 2 giờ) | «Vé vào sảnh đấu đã hết hạn. Em vẫn tập được với A.I.» |
| Mở ở máy/tab khác | «Em đang mở Đấu Nguyên Tử ở máy hoặc tab khác.» + `Chơi ở máy này` |
| Sảnh đầy (80 em) | «Sảnh đấu đã đủ người. Em tập với A.I trong lúc chờ nhé.» |
| Trong trận | Màn trận; bị hạ: «Quốc Bảo hạ em · hồi lại sau 1,6 giây»; hạ bạn: «Em hạ Quốc Bảo!»; dòng tin 3 lần hạ gần nhất |
| Kết quả | Thẻ kết quả trên sân mờ |
| **Thầy bắt đầu thi** | Ngay lập tức: đóng WebSocket, dừng vòng vẽ, tháo màn trận; chỉ còn «Thầy đã bắt đầu thi · Đấu Nguyên Tử đã dừng. Em đang được đưa vào bài…» |
| Máy không có Canvas | «Máy này chưa vẽ được sân đấu. Em vẫn chờ thầy bắt đầu bình thường.» |

## 4. Dữ liệu, ghép đấu và mạng

### 4.1 Nguồn thật (không bịa)
- `POST /vao-thi` nhánh phòng chờ (`server/src/index.ts`, `cach: 'cho'`) **thêm trường `veDau`** = vé ký HMAC-SHA256 bằng `MA_BI_MAT` (tiền tố riêng `dau-ion|`): `{ c: mã ca, s: số báo danh, t: tên gọi, h: hạn 2 giờ }`. Tên gọi = hai chữ cuối của `danh_sach.ho_ten` — dòng **đã đọc sẵn** ở cổng danh sách ⇒ 0 lệnh D1 thêm; không nhận tên do máy em gửi. Máy khách: `KetQuaVaoThi` (`src/lib/exam-api.ts`) mang `veDau`; `ExamTakeScreen` đưa `{ maCa, veDau }` vào `PhongChoGame`.
- Không có bảng mới, không migration D1.

### 4.2 Ai thấy ai, ghép đấu
- Chỉ các em đang mở Sảnh đấu của **cùng một ca** thấy nhau (mỗi ca một phòng). Không ghép khác ca.
- Mỗi em hiện bằng **số thứ tự ngắn** (1…249) + **tên gọi** (đúng chữ đang chiếu trên màn Chiếu mã của thầy cho cả phòng) hoặc «Bạn Na» khi bật Ẩn tên. **Số báo danh không bao giờ gửi tới máy em khác.**
- **Đấu nhanh:** vào hàng; có người đang chờ thì ghép ngay (người chờ lâu nhất trước).
- **Thách:** bấm `Thách` cạnh tên, hoặc gõ số báo danh của bạn. Phòng **trả cùng một câu** «Đã gửi lời thách. Bạn nhận lời thì trận bắt đầu.» dù SBD có trong phòng hay không ⇒ không dò được ai đang ở đâu. Lời thách sống 20 giây; hai bạn thách nhau ⇒ vào trận luôn.
- **Nhóm:** `Tạo nhóm` ⇒ mã 2 chữ số (10–99, chỉ trong phòng chờ này) đọc cho bạn ngồi cạnh; tối đa 4; chủ nhóm `Bắt đầu nhóm` (≥ 2 bạn; ≥ 3 là trận nhóm).

### 4.3 Mạng trên Cloudflare (theo mẫu phòng `BanBiA` cũ)
- **Durable Object mới `PhongDauIon`** (`server/src/phong-dau-ion.ts`, binding `PHONG_DAU_ION`, migration `dau-ion-v1` `new_sqlite_classes` trong `server/wrangler.toml`), `idFromName('dau-ion:<mã ca>')`, gợi ý vị trí `apac`. **WebSocket Hibernation:** `acceptWebSocket`, dữ liệu nhỏ của em gắn trên kết nối (`serializeAttachment`) ⇒ sảnh yên thì phòng ngủ mà kết nối vẫn giữ; `{"t":"ping"}` ⇒ `{"t":"pong"}` tự động (`setWebSocketAutoResponse`), không đánh thức phòng.
- Cửa: `GET /dau-ion/<mã ca>` nâng cấp WebSocket, đi thẳng trước mọi lớp bọc của Worker. Vé gửi trong gói đầu `{t:'vao', ve, nt, an, km}` (không nằm trên đường dẫn); vé sai/hết hạn/khác ca ⇒ đóng 4003.
- **Máy chủ quyết:** luật ở `server/src/dau-ion-phong.ts` + lõi chung `src/lib/dau-ion/loi.ts` (cùng mã chạy ở máy em cho Tập với A.I và đoán trước bước đi). Máy em chỉ gửi **ý định** 8 byte (hướng đi, hướng ngắm, giữ bắn) ~12 lần/giây và ngay khi bấm/thả bắn.
- **Nhịp phòng 20 lần/giây** chỉ khi có việc (trận, hàng đấu nhanh, lời thách, nhóm); hết việc ⇒ `clearInterval` ⇒ phòng ngủ được. Mỗi nhịp gửi **ảnh trận nhị phân**: đầu 6 byte + 9 byte/ghế + sự kiện (đạn bắn ra, trúng, chặn, hạ, hồi, vật phẩm); ack riêng từng em. Trận 1–1 ≈ 30–60 byte/gói.
- **Máy em:** bước đi của chính em đoán trước rồi khớp theo ack (lệch > 80 đơn vị thì nhảy, nhỏ hơn thì kéo dần 25 %/ảnh); bạn đấu vẽ trễ 100 ms nội suy giữa hai ảnh; đạn vẽ từ sự kiện «bắn ra», đạn của em hiện ngay.
- Rớt mạng giữa trận: ghế giữ 8 giây (nối lại vào đúng trận); quá hạn ⇒ trận 1–1 xử bạn còn lại thắng, trận nhóm chỉ bỏ ghế đó.

## 5. Ngoại lệ, chống lạm dụng, không cản ca kiểm tra

**Không cản ca kiểm tra (hai lớp):**
1. Máy em: nhịp hỏi phòng chờ 3 giây (giữ nguyên) thấy `batDau` ⇒ `ExamTakeScreen` đặt `cho.batDau = true` **trước** khi gọi vào bài ⇒ game đóng WebSocket, huỷ requestAnimationFrame, tháo màn trận; khi chuyển màn, cả mảnh game bị tháo.
2. Máy chủ: lệnh thầy `batDauThi` gọi phòng đấu của ca (`ctx.waitUntil`, không thêm vòng chờ vào lệnh của thầy) ⇒ mọi máy nhận `{t:'dong'}` và bị đóng mã 4000 — kể cả máy chưa kịp hỏi lại phòng chờ.
- Game không đụng lượt thi, không đổi nhịp hỏi phòng chờ, không tải gì khi em không bấm. Mảnh game ngoài precache.

**Chống lạm dụng:**
- Vé ký theo ca + SBD + hạn; 0 lệnh D1 ⇒ không ai làm nghẽn D1 qua game.
- Một SBD một kết nối (mở máy/tab khác ⇒ kết nối cũ đóng 4002).
- Máy em không gửi được vị trí, Máu, trúng/trượt; tốc độ, nhịp bắn, vector đi bị chuẩn hoá ở phòng.
- Dội gói: > 40 gói/giây bị bỏ, > 80 ⇒ đóng 4008. Gói JSON > 512 byte, gói nhị phân ≠ 8 byte bị bỏ.
- Thách ≤ 5 lần/phút; «Không nhận lời thách»; trả lời trung tính khi thách theo SBD.
- **Không có ô chat**: chỉ 4 câu phản ứng có sẵn («Hay đấy!», «Suýt nữa!», «Đấu lại nhé», «Chơi đẹp»), 1 lần / 2 giây.
- Không bảng xếp hạng máy chủ, không EXP, không phần thưởng ⇒ không có gì để cày hay gian lận.
- Trần: 80 kết nối/ca, 30 trận cùng lúc.

**Ngoại lệ khác:** đổi tab / khoá màn ⇒ vòng vẽ dừng (đứng yên trong trận, không bắn); mất focus ⇒ nhả hết phím; đổi sáng/tối ⇒ đọc lại bảng màu và vẽ lại; tên dài ⇒ cắt «…» (tên gọi tối đa 16 ký tự); máy yếu (`ddh.mayYeu` / giảm chuyển động) ⇒ 30 khung/giây, DPR 1, bỏ quầng sáng / tia vụn / bong bóng / vòng quay; trình duyệt cũ không có `color-mix` ⇒ dùng màu phòng chờ sẵn có.

## 6. Chi phí máy chủ và ngân sách máy yếu

- **D1:** 0 đọc/ghi thêm ở mọi lệnh (vé ký từ dữ liệu đã đọc). Lệnh vào thi thêm một phép HMAC (< 1 ms).
- **Durable Object (Workers Paid):** WebSocket gửi lên tính 20 gói = 1 yêu cầu; gói gửi xuống không tính; thời lượng chỉ tính khi phòng thức (128 MB).
  - Một trận 1–1 90 giây: 2 × 12 × 90 ≈ 2.160 gói lên ≈ 108 yêu cầu; phòng thức 90 s ≈ 11 GB-s.
  - Một ca 40 em chờ 6 phút, 70 % chơi: ≈ 6.000 yêu cầu + 45 GB-s.
  - 300 ca/tháng: ≈ 1,8 triệu yêu cầu và 13.500 GB-s (3 % phần có sẵn 400.000 GB-s) ⇒ **dưới 0,3 USD/tháng** kể cả khi phần 1 triệu yêu cầu có sẵn đã dùng hết cho việc khác.
  - CPU phòng (đo bằng Node): **0,35 ms/nhịp cho 30 trận cùng lúc (60 em)**.
- **Băng thông mỗi em:** xuống ≈ 0,6–0,7 KB/giây (20 ảnh/giây), lên ≈ 0,17 KB/giây; 5 phút ≈ 250 KB.
- **Máy yếu:** Canvas 2D, không thư viện; nền vẽ một lần vào canvas phụ, hạt nhân vẽ sẵn thành ảnh nhỏ; trần 40 hiệu ứng; HUD React chỉ vẽ lại khi số đổi; 0 `setInterval` ở máy em (ping/nối lại bằng `setTimeout`). Mục tiêu 60 khung/giây, máy yếu 30.
- **Ngân sách tải:** mảnh `DauIon-*.js` ≤ 18 KB gzip, `DauIon-*.css` ≤ 3,5 KB gzip (đo: 17,2 KB + 3,5 KB); ngoài precache (`vite.config.ts` globIgnores `**/{ChuyenBay,DauIon}-*.{js,css}`). Không biểu tượng lucide (để mảnh biểu tượng dùng chung của /gv, /p không nặng thêm).

## 7. Nghiệm thu đo bằng máy

| Hạng mục | Lệnh | Kết quả trên nhánh |
|---|---|---|
| Lõi + gói nhị phân | `npx vitest run tests/dau-ion-loi-3010.test.ts` | 11/11 |
| Phòng đấu + vé + công tắc | `npx vitest run tests/dau-ion-phong-3010.test.ts` | 20/20 |
| Màn (jsdom): 0 mạng khi chưa bấm, thách, thầy bắt đầu ⇒ đóng | `npx vitest run tests/dau-ion-man-3010.test.tsx` | 5/5 |
| Test cũ đã cập nhật có chủ ý | `tests/phong-cho-game-1309.test.ts`, `tests/m3-a2-1909.test.tsx`, `tests/vuot-khung-chung-hs-1210.test.tsx`; gỡ `tests/ban-nguyen-to-*-0610.test.ts(x)` cùng game cũ | xanh |
| Kiểu | `npx tsc -p tsconfig.app.json --noEmit` · `cd server && npx tsc --noEmit -p .` | 0 lỗi |
| Tốc độ tải | `npm run build:cf && node scripts/kiem-toc-do-tai.mjs` | 0 đỏ |
| Màu | `npm run kiem:mau-giu` · `npm run check:mau` | 0 vi phạm |
| Service worker | trong `build:cf` | 13/13, precache 170 tệp |
| Ảnh Chromium | `node docs/ban-ve-game-ban-sung-3010/chup.mjs` (bản vẽ) · `… --that` (bản build thật) | 24 + 12 ảnh ≤ 150 KB; 0 lỗi trang, 0 tràn, 0 đích < 44 px (`kiem-mau.json`, `kiem-that.json`) |

Đã biết, không do việc này: `tests/toc-do-may-chu-lenh-nong-1310.test.ts` đỏ «nop-cau: 10 lệnh D1 (mốc 9)» ngay ở commit gốc `9081287`.

## Phụ lục A — Tắt và gỡ

1. **Tắt nhanh (không phát hành lại app):** đặt biến Worker `TAT_DAU_ION` (vd `npx wrangler secret put TAT_DAU_ION` ⇒ `1`). Hiệu lực ngay: lệnh vào thi không phát vé, cửa `/dau-ion/*` trả 410, phòng đang mở đóng mã 4010 ⇒ máy em chỉ còn «Tập với A.I» (cục bộ, 0 mạng). Bật lại: xoá biến.
2. **Gỡ hẳn:** `git revert <commit>`; lớp Durable Object `PhongDauIon` **giữ** trong `wrangler.toml` (xoá lớp = migration `deleted_classes` = xoá dữ liệu DO) — thay thân lớp bằng bản trả 410 như `BanBiA`.

## Phụ lục B — Tệp

- Lõi chung: `src/lib/dau-ion/loi.ts`, `src/lib/dau-ion/goi.ts`.
- Máy em: `src/components/phong-cho/DauIon.tsx`, `dau-ion-ve.ts` (vẽ), `dau-ion-tran.ts` (bộ chạy trận A.I / mạng), `dau-ion-mang.ts` (WebSocket), `ban-nguyen-to.css` (giữ tên tệp: bảng màu phòng chờ đã duyệt; màu mới pha bằng `color-mix` từ biến sẵn có). Nối: `PhongChoGame.tsx`, `ExamTakeScreen.tsx` (2 dòng), `exam-api.ts`, `may-chu-moi.ts` (kiểu).
- Máy chủ: `server/src/phong-dau-ion.ts` (Durable Object), `server/src/dau-ion-phong.ts` (luật phòng), `server/src/dau-ion-ve.ts` (vé, cửa, đóng phòng), `server/src/index.ts`, `server/src/kieu.ts`, `server/wrangler.toml`.
- Đã xoá: `BanNguyenTo.tsx`, `ban-nguyen-to-loi.ts` và hai tệp test của chúng.

## Phụ lục C — Không làm (lần này)
- Ghép khác ca / khác lớp; bạn bè ngoài phòng chờ.
- Chat tự do, âm thanh, bảng xếp hạng lưu máy chủ, EXP.
- Công tắc theo từng ca trên app thầy (cần cột chỉ-thêm `ca.game_cho` + nút ở màn Mở ca) — làm khi thầy cần.
