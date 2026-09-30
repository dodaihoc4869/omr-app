# Đo + tối ưu app học sinh trên máy yếu — 30/09

Nhánh `claude/toi-uu-app-hs-3009`, nền `origin/main` 834475c. Bộ đo: `scripts/do-app-hs.mjs` (+ `scripts/do-app-hs/may-chu-gia.ts`, `scripts/do-app-hs/so-sanh.mjs`).

## 1. Cách đo

- **Bản build thật** (`npm run build` → `dist/`), máy chủ tĩnh cục bộ HTTP/2 + brotli như Pages, service worker thật (Chromium chạy `--ignore-certificate-errors` để SW đăng ký được trên chứng chỉ tự ký).
- **Máy yếu:** Chromium Playwright (`/opt/pw-browsers`), CDP **CPU chậm 6×**, **Slow 4G** (562,5 ms RTT, 1,44 Mb/s xuống), màn **360×740** (dọc), `deviceMemory = 2`, 4 luồng ⇒ app tự bật chế độ `may-yeu` như trên máy em thật.
- **Dữ liệu giả, không chạm máy chủ thật:** mọi lệnh tới `omr.ttadodaihoc.workers.dev` được trả lời trong script (`may-chu-gia.ts`: Sảnh 2.0, hồ sơ thần thú, Đảo 6 ải, Đoàn đang trong trận, 360 câu đã làm, Tu luyện, cửa hàng mẫu `ShopApiGia`). Yêu cầu trả lời giả **không chịu mạng giả lập của CDP** (đo: 13 ms) nên script tự trễ mỗi lệnh = 1 RTT + 60 ms máy chủ + thân/băng thông.
- **Chạm thật** bằng ngón (touch qua CDP ⇒ có Event Timing ⇒ INP), không dùng `.click()` (dò cây trợ năng trong trang đang bị hãm CPU làm sai số). Đo khung bằng rAF (khung p95, FPS p95 = 1000 / khung p95), tác vụ dài (Long Tasks API), số commit React + số component vẽ lại (móc DevTools giả), heap sau GC (CDP).
- **Chẩn đoán:** `--vet=<bước>` ghi vết Chrome (luồng chính) + CPU profile đúng bước đó; `--kham=1 --buoc=…` in các lượt gọi máy chủ, hoạt ảnh đang chạy (`document.getAnimations()`), ai đang gọi rAF.
- **Lưu ý độ tin:** máy đo 4 lõi đang chạy cùng lúc các phiên khác (tải trung bình 10–19) ⇒ số tuyệt đối bi quan hơn máy thật; TRƯỚC/SAU được chạy **song song cùng lúc** (cùng điều kiện) để so công bằng.

```
node scripts/do-app-hs.mjs --dist=dist --kich=nhanh --ra=sau.json          # kịch bản ngắn (dùng cho bảng dưới)
node scripts/do-app-hs.mjs --dist=dist --kich=mo-dau,man --ra=kq.json      # kịch bản đủ: mọi màn, 2 lượt
node scripts/do-app-hs.mjs --dist=dist --kich=heap --phut-heap=5           # dùng liên tục 5 phút
node scripts/do-app-hs/so-sanh.mjs truoc.json sau.json                      # bảng trước/sau
```

## 2. Nền (origin/main) — cái gì làm chậm

### 2.1 Lần mở đầu và mở lại (lượt đo nền 13:35, máy ít tải hơn)

| | Lần mở đầu (không cache) | Mở lại (có SW, đã đăng nhập) |
|---|---:|---:|
| FCP | 4 764 ms (màn đăng nhập) | 2 632 ms |
| Màn đăng nhập dùng được | 4 727 ms | — |
| JS tải trước màn đăng nhập | 291 KB gzip (995 KB thô) · 49 tệp | 0 (SW) |
| Bấm Đăng nhập → Sảnh dùng được | 3 369 ms | — |
| Sảnh dùng được (từ lúc mở) | 8 889 ms | 3 954 ms |
| JS / phông / ảnh tải trước Sảnh | 360 KB / 101 KB / 6 KB | — |
| TTI | 14 424 ms | 8 562 ms |
| Tác vụ dài lớn nhất | 573 ms | 556 ms |

**Vết luồng chính lúc MỞ LẠI (9 s, CPU×6):** vẽ/tính kiểu chiếm phần lớn — `UpdateLifecycle` 4 414 ms (tính kiểu 2 440, vẽ 888, layerize 711, hoạt ảnh 636), còn chạy JS chỉ ~1,1 s. `get clientWidth` 606 ms tự thân = đọc bố cục ép buộc (CanhSanh3D.tsx dòng 198/331).

**Sảnh đứng yên 5 s:** `UpdateLifecycle` 2 720 ms / 5 000 ms = **54 % luồng chính chỉ để vẽ hoạt ảnh**. `document.getAnimations()` trên Sảnh: **~55 hoạt ảnh SVG lặp vô hạn** (`h2c-song` ×27, `h2c-may-troi` ×12, `h2c-dom` ×8, `h2c-suong-cuon` ×6, tia nắng, vệt quét). Chrome KHÔNG hợp thành (compositor) hoạt ảnh `transform` trên phần tử SVG ⇒ mỗi khung luồng chính phải tính kiểu + vẽ lại cả cảnh. Chế độ `may-yeu` cũ chỉ đặt `animation-iteration-count: 1` — nhưng các hoạt ảnh này dài 8–80 s nên vẫn giật gần 1 phút sau khi mở Sảnh.

**Sảnh bị che vẫn chạy:** mở Đảo / Đoàn / Câu đã làm / Tu luyện (màn toàn màn hình `fixed inset-0`) thì Sảnh vẫn nằm dưới và **vẫn chạy ~40–55 hoạt ảnh** (đo trong trận Đoàn: 28 hoạt ảnh đang chạy, TẤT CẢ là của Sảnh bị che). Bản đồ Đảo có thêm ~40 hoạt ảnh SVG của chính nó (`dao2-3d-cuon` ×25, `dao2-3d-song` ×12…).

### 2.2 Các màn (bản SAU, kịch bản đủ, lượt 2 — để thấy chỗ CHƯA đạt)

| Bước | tác vụ dài max | INP |
|---|---:|---:|
| Sảnh → Câu đã làm (120 câu + công thức) | 1 276–1 688 ms | 480–632 ms |
| Câu đã làm: lọc "Tất cả" | 907–1 209 ms | 1 096–1 400 ms |
| Câu đã làm: lọc "Sai lần gần nhất" | 225–299 ms | 456–512 ms |
| Sảnh → Cửa hàng (lần đầu) | 683 ms | 776 ms |
| Sảnh → Đảo | 207–284 ms | 328–496 ms |
| Sảnh → Đoàn | 279–288 ms | 448–552 ms |
| Đoàn: chốt đòn | 106–273 ms | 88–320 ms |
| Đảo: chọn đáp án · Đoàn: chọn đáp án | 0–72 ms | 88–104 ms |

Khi mở app, máy em gọi **12 lệnh** song song: `/presence /hs/dang-nhap /hs/buoi-hoc /notifications/list /game-v2/academic-sync /mom/list /game-v2/hoa2-sanh /hs/ke-hoach-ngay /hs/thi-dua-hom-nay /hs/ca-dang-mo /hs/lich-su /hs/btvn`. Sảnh chỉ vẽ được khi `hoa2-sanh` về (≥ 1 RTT ≈ 0,6 s trên Slow 4G) — nằm trên đường găng của "mở lại ≤ 1,5 s".

## 3. Đã sửa (chỉ cái số đo chứng minh)

1. **Sảnh bị che ⇒ tạm dừng hoạt ảnh** (mọi máy): `StudentPortalScreen` gắn lớp `sanh-bi-che` lên `<html>` khi một tab toàn màn hình mở (chỉ khi Sảnh 2.0); `src/styles/sanh-bi-che.css` đặt `animation-play-state: paused` cho `.h2-sanh` và con cháu. Không gỡ Sảnh, không đổi trạng thái/chữ/bố cục; đóng màn là chạy tiếp. Không sửa `SanhBanDo.tsx`.
2. **Máy yếu ⇒ cảnh Sảnh đứng yên** (`src/styles/may-yeu.css` mục 4): 12 lớp hoạt ảnh TRANG TRÍ của cảnh SVG (sóng, mây, đom đóm, sương cuộn, tia nắng, lấp lánh, vệt quét…) `animation: none` dưới `html.may-yeu`. Hoạt ảnh chức năng (mở màn, rương rung, pháo khi xong việc) giữ nguyên.
3. **Máy yếu ⇒ cảnh Đảo đứng yên** (`dao2.css`): 8 lớp trang trí (`dao2-3d-*`) `animation: none` dưới `html.may-yeu`; GIỮ nhịp ô đang đứng, cờ, vệt đường đi (chỉ dẫn).

Không đổi: JS, luật game/EXP, dữ liệu gửi xuống (đáp án vẫn chỉ về sau khi nộp), schema. Precache 163 tệp / 2 945 KB (trần 170 / 3 000 — `kiem-sw` ĐẠT 13/13).

## 4. Trước / sau (chạy song song cùng lúc, kịch bản ngắn)

| Chỉ số | Trước | Sau | Đổi |
|---|---:|---:|---:|
| Mở đầu · FCP (màn đăng nhập) | 6172 ms | 5612 ms | -9% |
| Mở đầu · màn đăng nhập dùng được | 6135 ms | 5600 ms | -9% |
| Mở đầu · JS tải trước màn đăng nhập (gzip) | 291 KB | 291 KB | 0% |
| Mở đầu · số tệp JS trước màn đăng nhập | 49 | 49 | 0% |
| Mở đầu · bấm Đăng nhập → Sảnh dùng được | 3754 ms | 4392 ms | +17% |
| Mở đầu · JS tải trước Sảnh (gzip) | 360 KB | 360 KB | 0% |
| Mở đầu · JS thô trước Sảnh | 1279 KB | 1280 KB | +0% |
| Mở đầu · phông trước Sảnh | 101 KB | 101 KB | 0% |
| Mở đầu · ảnh trước Sảnh | 6 KB | 6 KB | 0% |
| Mở đầu · TTI (sau Sảnh) | 16731 ms | 17322 ms | +4% |
| Mở đầu · tác vụ dài lớn nhất | 449 ms | 765 ms | +70% |
| Mở đầu · TBT | 2785 ms | 2148 ms | -23% |
| Mở lại (SW) · FCP | 3380 ms | 3044 ms | -10% |
| Mở lại (SW) · Sảnh dùng được | 5006 ms | 4141 ms | -17% |
| Mở lại (SW) · TTI | 10065 ms | 7577 ms | -25% |
| Mở lại (SW) · tác vụ dài lớn nhất | 624 ms | 390 ms | -37% |
| Mở lại (SW) · TBT (5 s đầu sau Sảnh) | 3072 ms | 1323 ms | -57% |
| Mở lại lần 2 (SW) · FCP | 1936 ms | 1772 ms | -8% |
| Mở lại lần 2 (SW) · Sảnh dùng được | 3258 ms | 2689 ms | -17% |
| Mở lại lần 2 (SW) · TTI | 8155 ms | 6641 ms | -19% |
| Mở lại lần 2 (SW) · tác vụ dài lớn nhất | 469 ms | 201 ms | -57% |
| Mở lại lần 2 (SW) · TBT (5 s đầu sau Sảnh) | 2948 ms | 966 ms | -67% |

**Từng màn (kịch bản ngắn, lần đầu mở màn)**

| Bước | chuyển màn ms (trước→sau) | tác vụ dài max ms | INP ms | khung p95 ms / FPS p95 | commit · component vẽ lại |
|---|---|---|---|---|---|
| Sảnh đứng yên 5 s |  | 85 → 54 |  | 67/15 → 33/30 | 0·0 → 0·0 |
| Sảnh → Đảo (bản đồ) | 2884 → 2656 | 207 → 216 | 192 → 368 |  | 12·123 → 13·77 |
| Đảo bản đồ đứng yên 5 s |  | 59 → 0 |  | 50/20 → 17/60 | 0·0 → 1·51 |
| Đảo: Lên đường → trận | 451 → 409 | 281 → 260 | 416 → 320 |  | 3·57 → 3·57 |
| Đảo trận đứng yên 5 s |  | 0 → 0 |  | 17/60 → 17/60 | 0·0 → 0·0 |
| Đảo: chọn đáp án |  | 0 → 0 | 128 → 128 |  | 2·85 → 1·22 |
| Sảnh → Đoàn (trận) | 2326 → 1642 | 321 → 341 | 368 → 384 |  | 11·147 → 12·147 |
| Đoàn trận yên 6 s (hỏi 1,5 s) |  | 88 → 61 |  | 67/15 → 17/60 | 12·304 → 11·242 |
| Đoàn: chọn đáp án |  | 69 → 115 | 240 → 96 |  | 2·44 → 3·106 |
| Sảnh → Câu đã làm | 2389 → 1756 | 1242 → 1442 | 480 → 320 |  | 5·720 → 5·720 |
| Câu đã làm: lọc "Tất cả" |  | 98 → 56 | 120 → 96 |  | 2·45 → 2·45 |
| Câu đã làm: vuốt cuộn 4 s |  | 88 → 0 |  | 34/30 → 17/60 | 0·0 → 0·0 |

Heap cuối kịch bản: 10.3 → 10.3 MB · nút DOM 17955 → 17955

Tệp số: chạy lại bằng lệnh ở mục 1 (TRƯỚC = build của 834475c, SAU = build nhánh này), hai tiến trình cùng lúc.

**Đọc bảng:**
- Hoạt ảnh (mục tiêu FPS p95 ≥ 30): Sảnh yên 15 → **30 FPS**; bản đồ Đảo 20 → **60**; trận Đoàn 15 → **60**; vuốt Câu đã làm 30 → **60**; trận Đảo 60 → 60. ĐẠT.
- Mở lại (có SW): tác vụ dài lớn nhất −37 % / −57 %, TBT −57 % / −67 %, TTI −19 % / −25 %, Sảnh dùng được −17 %. Chưa đạt ≤ 1,5 s (mục 5).
- Chuyển màn (Sảnh bị che không còn tranh luồng chính): Sảnh → Đoàn 2 326 → 1 642 ms, Sảnh → Câu đã làm 2 389 → 1 756 ms, Sảnh → Đảo 2 884 → 2 656 ms.
- Lần mở đầu: JS không đổi (291 KB trước màn đăng nhập, 360 KB trước Sảnh) — lượt này không tách mảnh; các số thời gian lần mở đầu dao động ±20 % giữa hai lượt chạy (một lượt, máy đo đang tải nặng) nên không kết luận.
- Heap sau kịch bản 10,3 MB cả hai (mục 4.1).
- INP từng lượt chạm là MỘT mẫu ⇒ dao động ±150 ms giữa hai lượt; không kết luận INP từ bảng này.

### 4.1 Dùng liên tục 5 phút (bản SAU)

Lượt chạy 5 phút (`--kich=heap`) lần này DỪNG giữa chừng (hết giờ chờ một nút quay về ở máy đo đang tải nặng) ⇒ chưa có số 5 phút — **lượt sau**. Số có được: sau kịch bản đủ (2 vòng qua mọi màn, không tải lại trang giữa các màn trong vòng) heap **7,5 MB**, 1 688 nút DOM, 240 bộ nghe sự kiện; sau kịch bản ngắn heap 10,3 MB cả TRƯỚC lẫn SAU (17 955 nút DOM lúc đang mở Câu đã làm 120 thẻ). Chưa thấy dấu hiệu rò rỉ, nhưng chưa chứng minh được bằng số 5 phút.

## 5. Chưa đạt — lý do + đề xuất (lượt sau)

- **Tác vụ dài > 100 ms khi thao tác (CPU×6): CHƯA ĐẠT ở các bước CHUYỂN MÀN** — chạm cửa Sảnh → Đảo / Đoàn / Câu đã làm / Cửa hàng vẫn có tác vụ 200–340 ms (dựng cả màn mới trong một lượt React), Câu đã làm 1,2–1,7 s. Chạm TRONG màn (chọn đáp án Đảo/Đoàn, lọc, mở rương) đa số ≤ 115 ms. Đề xuất: dựng màn theo hai nhịp (khung + phần nặng trong `startTransition`), nạp trước mảnh màn kế tiếp khi Sảnh rảnh (`requestIdleCallback` → `import()` Game/DaoThanThu/Dao2/DoanHoTong/CauDaLam — các mảnh này đang ngoài precache nên lần đầu mở còn tốn thêm 1–3 s tải qua Slow 4G).

- **Câu đã làm** (tác vụ dài 1,3–1,7 s khi mở, INP 1,1–1,4 s khi lọc "Tất cả"): dựng một lần cả 120 thẻ câu + công thức. Đề xuất: ảo hoá / dựng dần theo khung nhìn (IntersectionObserver, 20 thẻ đầu rồi thêm khi cuộn), `content-visibility: auto` cho thẻ ngoài màn, KaTeX chỉ cho thẻ đang hiện; lọc bằng `useDeferredValue`/`startTransition` để chạm phản hồi ngay.
- **Mở lại ≤ 1,5 s tới Sảnh:** chưa đạt (~3,9 s ở máy đo). Đường găng: (a) 6 tờ CSS (index.css 245 KB thô gồm cả CSS app thầy) + ~1,3 MB JS thô dựng ở CPU×6; (b) `hoa2-sanh` 1 RTT. Đề xuất: đệm SWR phía máy em cho kết quả `hoa2-sanh` cùng ngày (vẽ Sảnh ngay từ bản nhớ, làm mới ngầm) trong `src/components/hoa2/api.ts`; tách CSS/JS riêng của app thầy khỏi mảnh `index` (App.tsx đang nhập tĩnh `goi-lenh-thay`, `goi-len-bang`, `cham-so`, `score`, `exam-shuffle`, `bai-tap-pdf`… cho mọi vai).
- **Lần mở đầu — JS trước Sảnh:** lượt này KHÔNG giảm (291 KB gzip trước màn đăng nhập, 360 KB trước Sảnh) — muốn giảm phải tách mảnh theo vai ở `App.tsx`/`main.tsx` (đụng khung app thầy) ⇒ lượt sau, cần đo cả app thầy.
- **Gộp 12 lệnh lúc mở app** thành 1–2 lệnh (`/hs/mo-app`) — giảm cả tải D1 giờ cao điểm; cần hợp đồng API mới ⇒ lượt sau.
- **Máy chủ:** lượt này chưa chạy harness D1 mới (bộ `scripts/ban-tai-gia/` cần nạp bản sao lưu D1). Số gần nhất (docs/do-tai-d1/ban-tai-f1af277.md, 21/09): `hs/ke-hoach-ngay [mở]` p95 340 ms · 43 truy vấn TB; `hs/thi-dua-hom-nay [mở]` p95 247 ms · 5 truy vấn; `game-v2/academic-sync` p95 149 ms · 9 truy vấn; `notifications/list` p95 137 ms · 3 truy vấn. `game-v2/hoa2-sanh` (sinh sau 21/09) chưa có số.

## 6. Đề xuất cho phiên đang sửa `SanhBanDo.tsx` / cảnh Sảnh (không sửa ở đây)

- `CanhSanh3D.tsx`: ~55 hoạt ảnh `transform` trên phần tử SVG ⇒ luồng chính mỗi khung (Sảnh yên 5 s: 54 % luồng chính là vẽ). Gộp 27 `g.h2c-song` thành 2–3 nhóm, hoặc tách lớp trôi (sóng, mây, sương) ra `<div>` HTML nền SVG + hoạt ảnh `transform` (được hợp thành trên GPU, không tốn luồng chính).
- `CanhSanh3D.tsx` dòng 198 / 331 đọc `clientWidth` (ép bố cục, 606 ms tự thân trong 9 s mở lại ở CPU×6) ⇒ lấy kích thước từ `ResizeObserver` entry.
- `srs2-d1.ts`: không có số đo nào chỉ vào tệp này ở lượt này.

## 7. Kiểm trước khi mở PR

- `npx tsc -b` (gốc) ĐẠT · `npx tsc --noEmit -p server` ĐẠT · `npm run build` ĐẠT · `node scripts/kiem-sw.mjs` ĐẠT 13/13 (163 tệp / 2 945 KB) · `npm run check:mau` ĐẠT.
- vitest: 62 tệp (mọi tệp nhập `StudentPortalScreen` + `may-yeu*` + `dao2-*`) — 14 đỏ; 13 đỏ Y HỆT trên `origin/main` sạch (cùng tên: giao-btvn-tung-hoc-sinh-1309 ×5, khac-phuc-tren-dien-thoai-1409 ×2, nhiem-vu-ca-nhan-2109 ×5, tu-ngu-cum8-2109 ×1); cái thứ 14 (`tu-ngu-cum6-2109` Võ đài) chạy riêng thì XANH (quá giờ do máy đo đang tải nặng). `bi-a-cua-sanh` + `hoa2-doi-ten-thu-2809` đỏ một lần vì quá giờ, chạy lại XANH cả trên nhánh lẫn main. ⇒ không có đỏ mới.
- Chưa đo lượt này (lượt sau): màn ngang 740×360 (bộ đo có sẵn `--khung=ngang`), heap 5 phút trọn vẹn, harness D1 cục bộ cho `hoa2-sanh`.
