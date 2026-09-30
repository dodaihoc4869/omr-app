# Đo + tối ưu Bi-a cho máy yếu (30/09/2026)

Nhánh `claude/toi-uu-bia-3009`. Mục tiêu thầy: "mượt gấp đôi, nhanh gấp đôi, ổn định gấp đôi" — **có số đo trước/sau cùng kịch bản**.
Không bắn tải vào máy chủ thật: máy chủ đo trên D1 giả (node:sqlite trong bộ nhớ), máy học sinh đo trên trang xem thử Bi-a (máy chủ giả trong trang).

## 1. Cách đo (chạy lại được)

### Máy học sinh — `scripts/do-bia/do-client.mjs`
- Trang đo: bản build RIÊNG của `src/game/bi-a/xem-thu.html` (React production, không PWA): `npx vite build --config scripts/do-bia/vite.config.mjs --outDir <thư mục>`.
- Chromium Playwright (`/opt/pw-browsers`, canvas **vẽ bằng CPU** — "Canvas: Software only", đúng như máy yếu không có tăng tốc GPU), CPU chậm **6×** (CDP `Emulation.setCPUThrottlingRate`), cảm ứng.
- 4 kịch bản: **dọc 360×740 DPR 3** và **ngang 740×360 DPR 2** (toàn màn ngang), mỗi khổ "thường" và "máy yếu" (lớp `may-yeu` như `main.tsx` gắn cho máy RAM ≤ 3 GB / ≤ 4 luồng). `Math.random` gieo hạt cố định ⇒ bàn, cú phá bàn, A.I giống hệt giữa hai bản.
- Số đo: bấm "Đấu đơn với A.I" → khung đầu tiên của bàn; 3 giây đứng yên lúc nhắm (% CPU luồng chính); cầm gậy xoay 1,5 giây (độ trễ pointermove → khung đã vẽ xong); phá bàn lực tối đa (16 bi) rồi ghi **10 giây**: FPS, p50/p95/p99 thời gian khung, khung > 33 ms, tác vụ dài > 50 ms, % CPU luồng chính; tách riêng các khung lúc bi đang lăn; JS heap sau khi gom rác.
- Mỗi kịch bản chạy 3 lần, bảng lấy **trung vị** (`node scripts/do-bia/tom-tat.mjs truoc.json sau.json`).
- Kiểm đúng ảnh: `--kiem=1` so canvas đang hiện (vẽ vùng bẩn) với vẽ lại CẢ bàn cùng trạng thái, từng điểm ảnh, 14 lần trong 10 giây lăn.

### Máy chủ — `scripts/do-bia/may-chu.do.test.ts`
- `npx vitest run --config scripts/do-bia/vitest.config.mjs` (không nằm trong bộ `npx vitest run` thường).
- D1 = `tests/_d1-that.ts` (đủ lược đồ migration) bọc **độ trễ giả 4 ms mỗi lượt D1** (Worker → D1 cùng vùng) và đếm lượt; lớp 30 em, kho 400 câu, chiến dịch giao cả lớp, 30 câu ôn. 30 lần mỗi route (bỏ 2 lần làm nóng); route tiêu trần 40% dùng em riêng, 10 lần.
- Phòng đấu `BanBiA`: một ván đấu đơn online trọn vẹn (2 máy, A.I chọn cú, 75% trả lời đúng), đếm tin WebSocket, cỡ tin, số lần ghi kho, thời gian xử lý mỗi gói.
- "Trước" chạy ở worktree sạch `origin/main` 834475c với cùng tệp đo.

## 2. Nút thắt tìm được (hồ sơ CPU, `--hoso=yen|lan`)
1. **Vẽ canvas bằng CPU chiếm 65–80% luồng chính** ("(program)" trong hồ sơ): MỖI khung xoá + vẽ lại CẢ bàn (ảnh nền 1214×704 ở bàn ngang), kể cả khi bàn đứng yên lúc em đang nghĩ — lúc nhắm đứng yên CPU 73–91% (máy nóng, tốn pin, và làm chậm phản hồi khi em cầm gậy).
2. Cầm gậy: khung nào cũng vẽ lại cả bàn + gậy có bóng mờ (shadowBlur) ⇒ trễ kéo gậy → vẽ p95 100–160 ms.
3. Nhãn chỉ bi đo lại cỡ (offsetWidth/offsetHeight) MỖI khung ⇒ ép trình duyệt tính bố cục mỗi khung khi đang kéo gậy; thanh lực vẽ lại CẢ màn chơi (React) mỗi lần nhích.
4. Bàn ngang DPR 2 có số điểm ảnh gấp 2,5 bàn dọc ⇒ lúc bi lăn chỉ còn ~45 FPS (p95 33–50 ms).
5. Máy chủ: vào Sảnh Bi-a đi **15 lượt D1 NỐI TIẾP** (cờ → ca kiểm tra → kế hoạch → câu đã trả lời → câu đang giữ → câu bảo vệ ca → câu ở Đảo/Đoàn → Điểm bàn).
6. Phòng đấu: 0,2 tin/giây, ~2,6 KB/tin (trạng thái đầy đủ), 4 lần ghi kho mỗi gói — không phải nút thắt (xem mục 5).

## 3. Đã sửa (chỉ những gì số đo chứng minh)
**Máy học sinh** (`src/game/bi-a/ve-ban.ts`, `ManChoi.tsx`):
- `BoVe.canVe`: khung không đổi gì (so dấu trạng thái: pha, lượt, hướng nhắm, lực, xoáy, vị trí + ảnh từng bi, bi vàng/đã ăn, nhãn chỉ bi, Mắt thần, kéo bi cái) ⇒ **không vẽ lại canvas**. Hiệu ứng, bi lăn, A.I nhắm, bi vàng nhấp nháy, ảnh bi còn nợ (máy yếu tô tối đa 4 bi/khung), Mắt thần chưa kịp tính lại ⇒ vẫn vẽ.
- **Vẽ vùng bẩn**: mỗi thứ vẽ trên bàn khai hộp bao (bi + bóng + vòng, bi rơi lỗ, đường nhắm, bóng bi ma, vòng bi mục tiêu, Mắt thần — nới cho mũi nối góc, cây cơ + bóng mờ, vòng "Kéo để đặt", hạt/vòng/giấy, chữ "+N"). Chỉ tô lại hợp hộp khung trước + khung này bằng `clip` (cùng lệnh vẽ, cùng thứ tự). Vùng bẩn > 55% bàn ⇒ vẽ cả bàn như cũ. Đổi cỡ / nạp lại chữ / khung lỗi ⇒ khung kế vẽ cả bàn.
- **Tự hạ chất lượng**: bi lăn mà ≥ 20/40 khung chậm hơn 22 ms ⇒ chuyển sang chế độ máy yếu cho hết ván (≤ 1,5 điểm ảnh thật / điểm CSS, bỏ quầng sáng, 4 ảnh bi/khung). Một lần mỗi ván.
- Nhãn chỉ bi: đo cỡ một lần khi nội dung đổi (hoặc đổi khung), không đo mỗi khung; chỉ ghi `left/top` khi đổi.
- Thanh lực / giữ Space: ghi thẳng DOM (`--p`, `aria-valuenow`, số %), React chỉ vẽ lại khi lực qua mốc 0.

**Máy chủ** (`server/src/bi-a.ts`, kết quả y hệt, không đổi lược đồ):
- `biaAction` / `biaChoSanh`: cờ Bi-a + "đang có ca kiểm tra" đọc song song (thứ tự quyết định giữ nguyên).
- `boiCanh`: câu đã trả lời hôm nay, câu đang giữ ở bàn Bi-a / Đảo-Đoàn, câu bảo vệ ca bắt đầu CÙNG đợt với kế hoạch ngày (ngày kế hoạch = `ngayVnCua(nowMs)`; khác ⇒ đọc lại theo ngày kế hoạch).
- `sanhBia`: Điểm bàn đọc song song; `dongVanCu`: hai lệnh ghi một lô; `ketVan`: ván + phiên đọc song song.

## 4. Trước / sau — máy học sinh (CPU 6×, trung vị 3 lần)

Máy đo là máy DÙNG CHUNG với các phiên khác (lúc đo "sau", tải trung bình 10–15 trên 4 lõi — phiên khác đang build/đo). Đo tuần tự (trước lúc máy rảnh, sau lúc máy bận) cho số lệch vô nghĩa ⇒ bảng dưới là đo **XEN KẼ** (`--dist=truoc,sau`: trước, sau, trước, sau… cùng kịch bản) để tải máy chia đều cho hai bản. Vẫn còn nhiễu: đọc theo xu hướng, nhất là cột CPU và kéo gậy.

**Tóm tắt** (bàn ngang toàn màn, chế độ thường — kịch bản nặng nhất): p95 thời gian khung 10 giây lăn **75 → 33 ms (÷2,25)**, FPS **30 → 47**, tác vụ dài **24,5 → 9**; lúc nhắm đứng yên CPU luồng chính **97% → 20% (÷4,9)**; kéo gậy → vẽ p50 **94 → 57 ms**, p95 **292 → 178 ms**. Mọi kịch bản: CPU lúc đứng yên ÷3,6–4,9, CPU lúc lăn ÷1,24–1,33, kéo gậy p50 ÷1,2–1,65.
Bàn ngang máy yếu (DPR 1,5): khung lúc lăn chưa đổi rõ (43 ↔ 41 FPS, trong nhiễu) — ở đây giá khung chủ yếu là bước chép cả canvas ra màn hình của trình duyệt, không phải lệnh vẽ; CPU vẫn giảm 26%.

**doc-thuong** (trung bình 2 lần mỗi bản, đo XEN KẼ trước–sau)

| Số đo | Trước | Sau | Đổi |
|---|---:|---:|---:|
| FPS 10 s lăn | 48.1 | 53.9 | ×1.12 |
| p95 khung (ms) | 33.4 | 25.1 | ÷1.33 |
| p99 khung (ms) | 83.3 | 41.7 | ÷2.00 |
| khung > 33 ms | 30 | 10.5 | ÷2.86 |
| FPS lúc bi lăn | 49.3 | 56.8 | ×1.15 |
| p95 lúc bi lăn | 41.6 | 25 | ÷1.66 |
| CPU luồng chính lúc lăn (%) | 76.6 | 57.5 | ÷1.33 |
| tác vụ dài > 50 ms | 6.5 | 4.5 | ÷1.44 |
| tổng tác vụ dài (ms) | 728.5 | 562.5 | ÷1.30 |
| CPU lúc nhắm đứng yên (%) | 78.7 | 19 | ÷4.14 |
| kéo gậy → vẽ p50 (ms) | 70.4 | 53.7 | ÷1.31 |
| kéo gậy → vẽ p95 (ms) | 129 | 97.5 | ÷1.32 |
| bấm → bàn chơi được (ms) | 581.2 | 637.3 | ÷0.91 |
| JS heap sau lăn (MB) | 4.1 | 4.2 | ÷0.98 |

**doc-yeu** (trung bình 2 lần mỗi bản, đo XEN KẼ trước–sau)

| Số đo | Trước | Sau | Đổi |
|---|---:|---:|---:|
| FPS 10 s lăn | 52.1 | 53.2 | ×1.02 |
| p95 khung (ms) | 25.1 | 25 | ÷1.00 |
| p99 khung (ms) | 91.6 | 75 | ÷1.22 |
| khung > 33 ms | 18 | 12 | ÷1.50 |
| FPS lúc bi lăn | 55.6 | 56.5 | ×1.02 |
| p95 lúc bi lăn | 25 | 16.8 | ÷1.49 |
| CPU luồng chính lúc lăn (%) | 61.5 | 49.7 | ÷1.24 |
| tác vụ dài > 50 ms | 7 | 4.5 | ÷1.56 |
| tổng tác vụ dài (ms) | 750 | 634 | ÷1.18 |
| CPU lúc nhắm đứng yên (%) | 57.4 | 15.8 | ÷3.63 |
| kéo gậy → vẽ p50 (ms) | 61.2 | 50.7 | ÷1.21 |
| kéo gậy → vẽ p95 (ms) | 147.1 | 125.8 | ÷1.17 |
| bấm → bàn chơi được (ms) | 566.7 | 540.5 | ÷1.05 |
| JS heap sau lăn (MB) | 4.1 | 4.2 | ÷0.98 |

**ngang-thuong** (trung bình 2 lần mỗi bản, đo XEN KẼ trước–sau)

| Số đo | Trước | Sau | Đổi |
|---|---:|---:|---:|
| FPS 10 s lăn | 30.1 | 46.9 | ×1.56 |
| p95 khung (ms) | 75.1 | 33.4 | ÷2.25 |
| p99 khung (ms) | 133.4 | 91.7 | ÷1.45 |
| khung > 33 ms | 77 | 31.5 | ÷2.44 |
| FPS lúc bi lăn | 31.7 | 45.5 | ×1.44 |
| p95 lúc bi lăn | 75.1 | 41.7 | ÷1.80 |
| CPU luồng chính lúc lăn (%) | 90.2 | 68.9 | ÷1.31 |
| tác vụ dài > 50 ms | 24.5 | 9 | ÷2.72 |
| tổng tác vụ dài (ms) | 2209.5 | 980.5 | ÷2.25 |
| CPU lúc nhắm đứng yên (%) | 97.3 | 19.7 | ÷4.94 |
| kéo gậy → vẽ p50 (ms) | 94.1 | 57.2 | ÷1.65 |
| kéo gậy → vẽ p95 (ms) | 291.9 | 178 | ÷1.64 |
| bấm → bàn chơi được (ms) | 611.6 | 618.4 | ÷0.99 |
| JS heap sau lăn (MB) | 4.1 | 4.2 | ÷0.98 |

**ngang-yeu** (trung bình 2 lần mỗi bản, đo XEN KẼ trước–sau)

| Số đo | Trước | Sau | Đổi |
|---|---:|---:|---:|
| FPS 10 s lăn | 41.6 | 44.3 | ×1.06 |
| p95 khung (ms) | 50.1 | 50 | ÷1.00 |
| p99 khung (ms) | 150 | 133.3 | ÷1.13 |
| khung > 33 ms | 43 | 35.5 | ÷1.21 |
| FPS lúc bi lăn | 43 | 41.2 | ×0.96 |
| p95 lúc bi lăn | 50.1 | 58.4 | ÷0.86 |
| CPU luồng chính lúc lăn (%) | 80.9 | 64 | ÷1.26 |
| tác vụ dài > 50 ms | 20 | 15.5 | ÷1.29 |
| tổng tác vụ dài (ms) | 1848.5 | 1656 | ÷1.12 |
| CPU lúc nhắm đứng yên (%) | 83 | 19 | ÷4.37 |
| kéo gậy → vẽ p50 (ms) | 69.4 | 49.6 | ÷1.40 |
| kéo gậy → vẽ p95 (ms) | 216.7 | 151.9 | ÷1.43 |
| bấm → bàn chơi được (ms) | 589.1 | 453.2 | ÷1.30 |
| JS heap sau lăn (MB) | 4.1 | 4.2 | ÷0.98 |

**Đúng ảnh** (`--kiem=1`, bàn ngang thường + bàn dọc máy yếu, 28 lần so): 24 lần **0 điểm ảnh khác**; 4 lần (lúc A.I đang nhắm, gậy có bóng mờ) lệch ≤ 7/255 trên ≤ 127 điểm ảnh — mắt không thấy.

**Dung lượng tải cho Bi-a** (bản build thật `npm run build:cf`): mảnh lười `BiaGame` 138,0 KB (45,5 KB gzip) + CSS 43,4 KB (8,9 KB gzip), chỉ tải khi em mở Bi-a; không ảnh nào (bi, bàn vẽ bằng mã). Không đổi cách tách mảnh. Precache 163 tệp / 2 944 KB (trần 170 / 3 000) — ĐẠT 13/13.

## 5. Trước / sau — máy chủ (D1 trễ giả 4 ms/lượt, p50/p95 ms, 30 lần)

| Route | p50 trước | p50 sau | p95 trước | p95 sau | Đổi p95 | Lượt D1 |
|---|---:|---:|---:|---:|---:|---:|
| **Vào Sảnh Bi-a** (`bia-sanh`) | 73.0 | 33.4 | 108.7 | 55.8 | **−49%** | 15 (song song) |
| Cửa Bi-a trên Sảnh Bát Linh (`biaChoSanh`) | 64.6 | 36.0 | 103.6 | 76.7 | −26% | 15 |
| Vào Sảnh qua `gameV2` (token + hồ sơ + sảnh) | 63.4 | 38.3 | 75.4 | 50.2 | −33% | 17 |
| Xếp bàn A.I = lấy câu (`bia-xep-ban`) | 113.4 | 72.1 | 165.1 | 103.7 | −37% | 23 → 22 |
| Lấy câu "Trả lời không cần chơi" (`bia-tra-loi`) | 95.6 | 63.2 | 156.1 | 133.1 | −15% | 21 → 20 |
| Trả lời câu (`answer` CHUNG — ngoài làn, không sửa) | 24.0 | 21.1 | 52.2 | 35.4 | (nhiễu) | 8 |
| Đổi câu sau câu sai (`bia-doi-cau`) | 91.4 | 73.1 | 118.7 | 120.0 | 0% | 19 |
| Kết thúc ván (`bia-ket-van`) | 61.9 | 48.8 | 81.3 | 73.9 | −9% | 16 |
| Lời mời / có mặt, 6 giây/lần (`bia-loi-moi`) | 26.3 | 17.9 | 33.6 | 20.9 | −38% | 6 |
| Tạo bàn online (`bia-tao-ban`) | 83.1 | 55.1 | 100.0 | 85.4 | −15% | 20 → 19 |

Phòng đấu `BanBiA` (ván đấu đơn trọn vẹn: 25 cú, 17 câu, 404 giây ván): **0 lỗi**, 84 tin gửi = **0,2 tin/giây**, 2,6 KB/tin, 31,8 KB/phút mỗi máy, 4 lần ghi kho + 1 hẹn giờ mỗi gói, D1 19 lượt cả ván (≤ số câu + 2); xử lý gói `cu` p50 1,3 ms (mô phỏng lại cả cú), `cau_xong` p50 5,5–6,2 ms. Không đổi (không phải nút thắt).

**Vì sao p95 máy chủ chưa giảm đủ 50% ở mọi route:** chuỗi nối tiếp còn lại nằm TRONG `layKeHoachHomNay` (`server/src/srs2-d1.ts` — phiên khác đang sửa, KHÔNG chạm) và `napCau` (`srs2-game.ts`): kế hoạch ngày cần hồ sơ trước, nạp câu cần kế hoạch trước. Đề xuất lượt sau cho chủ làn srs2: (1) cho `layKeHoachHomNay` nhận sẵn Promise câu bảo vệ ca/hồ sơ; (2) `gameV2Tho` bỏ `loadProfile` cho lệnh `bia-*` (Bi-a không dùng hồ sơ thần thú — tiết kiệm 1–2 lượt mỗi lệnh, kể cả lượt hỏi lời mời 6 giây/lần).

## 6. Bất biến đã kiểm
- Luật chơi, vật lý (tất định, không đổi một phép tính), kết quả ván, EXP/vàng, trần 40%, vé bàn, "Trả lời câu hỏi không cần chơi", Mắt thần, cầm gậy xoay, toàn màn ngang: 27 tệp test Bi-a + liên quan — đỏ duy nhất là nền có sẵn `bi-a-sanh-online` G11 "vé hết hạn" (đỏ ở main); `bi-a-cua-sanh` chập chờn khi máy chạy nặng song song (chạy riêng xanh 7/7, như main). Sau lần sửa cuối chạy lại 13 tệp (Bi-a vẽ/màn chơi/ngang/Mắt thần/online + máy chủ): 124/124 xanh. `tsc` app + server sạch, `npm run check:mau` sạch, `npm run build:cf` ĐẠT. Thêm `tests/bi-a-ve-vung-ban-3009.test.ts` (3 test: bỏ khung không đổi, đổi cỡ ⇒ vẽ cả bàn, bi lăn ⇒ vùng bẩn < 55% bàn, lăn xong ⇒ thôi vẽ).
- Đáp án không xuống máy trước khi trả lời: không đổi đường câu (`khongLoDapAn` trong `bi-a-may-chu` xanh).
- Không đổi lược đồ D1, không đổi giao thức WebSocket.

## 7. Lượt sau (chưa làm trong PR này)
- Phòng đấu: chỉ ghi khoá kho đã đổi (nay 4 lần ghi/gói), tuần tự hoá gói `tt` một lần cho mọi máy; gửi trạng thái dạng delta (đổi giao thức ⇒ cần tương thích máy còn bản cũ).
- A.I tính cú trong một tác vụ dài (~150–350 ms ở CPU 6×) lúc tới lượt A.I: chia nhỏ qua nhiều khung / Web Worker (phải giữ thứ tự `rand`).
- Vòng sáng / bóng gậy vẽ sẵn thành ảnh (bỏ `shadowBlur` mỗi khung) cho chế độ thường.
- Hai đề xuất máy chủ ở mục 5 (ngoài làn Bi-a).
