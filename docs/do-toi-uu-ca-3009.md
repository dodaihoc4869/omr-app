# Tối ưu ca kiểm tra 300 em — số đo trước/sau (30/09/2026)

Nhánh `claude/toi-uu-ca-3009`. Nền đo: `origin/main` **834475c**. KHÔNG bắn tải vào máy chủ thật: mọi số dưới đây đo trên Worker CỤC BỘ
(`wrangler dev --local`, D1 + R2 cục bộ của miniflare, dữ liệu GIẢ 300 em).

## 1. Cách đo (lặp lại được)

**Máy chủ** — `node scripts/do-ca-3009/ban.mjs --cay=<thư mục mã> --nhan=<nhãn>` (bộ đo mới, cùng họ `scripts/ban-tai-gia/`):

- Vỏ đo `scripts/do-ca-3009/vo-do.ts` bọc Worker THẬT (`server/src/index.ts`, không sửa dòng nào), đếm cho TỪNG lượt gọi: số câu D1,
  **số vòng đi-về D1** (mỗi `run/all/first` = 1 vòng, một `batch` = 1 vòng), dòng đọc, lượt đọc R2 + số byte R2.
- **Độ trễ giả** mô phỏng đường mạng Worker → D1/R2 thật: **40 ms mỗi vòng D1, 30 ms mỗi lượt R2** (D1 cục bộ tự xếp hàng một luồng như D1 thật).
  Máy chủ thật đo được 300–400 ms/vòng lúc cao điểm (ghi chú `server/src/cau-hinh-dem.ts`) ⇒ số vòng giảm bao nhiêu thì thời gian thật giảm ÍT NHẤT bấy nhiêu lần 40 ms.
- Lược đồ = `server/schema.sql` + mọi `server/migration-*.sql` (như `vitest.config.d1.ts`); 300 em trong `danh_sach`; ca mở qua đúng `/ca/day`:
  **đề riêng** (kho 120 câu, mỗi em 18/4/6; bản đồ đề riêng 153 KB), **phòng chờ + đồng bộ giờ**, **công bố ngay** (gói đề 58 KB, tờ đáp án 97 KB).
- Kịch bản: 0–40 s em tới dần (tra tên → `/vao-thi` vào phòng chờ → hỏi `GET /phong-cho` mỗi 3 s×(1+0,4·ngẫu nhiên)) · 45 s thầy bấm Bắt đầu
  (`/goi batDauThi`, đồng bộ giờ) ⇒ cả lớp `/vao-thi` + `GET /de/` DỒN trong ~4 s · làm bài 180 s: `/luu-tam` **15 s/lần**, `/trang-thai` 10 s×(1+0,4r)
  · **nộp dồn trong 60 s** · suốt ca máy thầy hỏi `/ca/nhip` 3 s/lần, dấu vết đổi ⇒ `/ca/chi-tiet` · cuối ca thầy chấm `/cham-diem` lô 8 em.

**Trình duyệt** — `node scripts/do-may-yeu.mjs --dist=dist --chi=thi --mang=slow4g --cao=740 --cpu=6` (Chromium Playwright có sẵn,
`Emulation.setCPUThrottlingRate` 6×, mạng "Slow 4G" của DevTools, khổ 360×740, máy chủ giả trong trang). Thêm ở lượt này: `--mang=slow4g`, `--cao`,
INP khi chạm chọn / gõ số (Event Timing), tác vụ dài lớn nhất lúc chọn.

## 2. Kết quả máy chủ — trước/sau (300 em, trễ D1 40 ms/vòng, R2 30 ms)

**Cặp chính** (hai lượt riêng, cùng điều kiện máy — tải nền ~7, 0 lỗi cả hai): `docs/do-ca-3009/truoc-834475c-2.json` → `docs/do-ca-3009/sau-908a50b-3.json`.
Cột "Vòng D1 / Câu D1 / Đọc R2" KHÔNG phụ thuộc máy đo (đếm từng lượt) — đó là bằng chứng chính; p50/p95 là thời gian phía máy khách (gồm xếp hàng ở Worker cục bộ).

| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | Vòng D1/lượt | Câu D1/lượt | Dòng đọc/lượt | Đọc R2/lượt |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| thầy: nhịp ca (/ca/nhip) | 98 / 100 | 0 / 0 | 64 → 58 | 820 → 97 (−88%) | 1 → 1.01 | 4 → 4.01 | 824 → 826 | 0 (0 KB) → 0 (0 KB) |
| tra tên (/goi tenTheoSbd) | 300 / 300 | 0 / 0 | 60 → 59 | 127 → 313 (+146%) | 1 → 1 | 1 → 1 | 2 → 2 | 0 (0 KB) → 0 (0 KB) |
| thầy: chi tiết ca (/ca/chi-tiet) | 26 / 25 | 0 / 0 | 287 → 89 | 864 → 153 (−82%) | 4 → 1 | 4 → 4 | 1180 → 1155 | 1 (121 KB) → 1 (5 KB) |
| vào thi — phòng chờ (/vao-thi) | 300 / 300 | 0 / 0 | 308 → 107 | 469 → 388 (−17%) | 6 → 2 | 6 → 5 | 4 → 3 | 0 (0 KB) → 0 (0 KB) |
| hỏi phòng chờ (GET /phong-cho) | 2249 / 2105 | 0 / 0 | 78 → 66 | 3517 → 1127 (−68%) | 1 → 1 | 1 → 1 | 1 → 1 | 0 (0 KB) → 0 (0 KB) |
| thầy: bắt đầu thi (/goi batDauThi) | 1 / 1 | 0 / 0 | 328 → 154 | 328 → 154 (−53%) | 3 → 3 | 3 → 3 | 3 → 3 | 0 (0 KB) → 0 (0 KB) |
| vào thi — nhận lượt (/vao-thi) | 300 / 300 | 0 / 0 | 6730 → 1368 | 8398 → 2264 (−73%) | 6 → 2 | 6 → 5 | 4 → 3 | 0 (0 KB) → 0 (0 KB) |
| tải đề (GET /de/:ca) | 300 / 300 | 0 / 0 | 2396 → 981 | 4395 → 1422 (−68%) | 1 → 1 | 1 → 1 | 1 → 1 | 1 (72 KB) → 0 (0 KB) |
| lưu đáp án (/luu-tam) | 3936 / 4137 | 0 / 0 | 71 → 56 | 1410 → 89 (−94%) | 1.01 → 1 | 1.01 → 1 | 5 → 5 | 0 (0 KB) → 0 (0 KB) |
| báo trạng thái (/trang-thai) | 4829 / 5078 | 0 / 0 | 71 → 56 | 1420 → 83 (−94%) | 1 → 1 | 2 → 2 | 2 → 2 | 0 (0 KB) → 0 (0 KB) |
| nộp bài (/nop) | 300 / 300 | 0 / 0 | 198 → 58 | 251 → 103 (−59%) | 3.01 → 1 | 3.01 → 3 | 7 → 10 | 1 (121 KB) → 1 (0 KB) |
| thầy: chấm lô 8 em (/cham-diem) | 38 / 38 | 0 / 0 | 902 → 524 | 1100 → 714 (−35%) | 16.84 → 9.95 | 634.58 → 634.58 | 796 → 796 | 0 (0 KB) → 0 (0 KB) |

Tổng: lượt gọi 12677 → 12984 · lỗi 0 → 0 · vòng D1 17022 → 13967 (−18%) · câu D1 45619 → 45556 · dòng đọc 178736 → 180290 · lượt R2 626 → 326 · MB R2 59.6 → 0.2

**Đọc bảng:**
- Đạt ≥ 50 % p95 ở các đường nóng: `/luu-tam` −94 %, `/trang-thai` −94 %, `/nop` −59 %, `/vao-thi` lúc cả lớp nhận lượt −73 %, `GET /de/` −68 %,
  `GET /phong-cho` −68 %, `/ca/chi-tiet` −82 %, `/ca/nhip` −88 %. Ba đường KHÔNG đổi mã (`/luu-tam`, `/trang-thai`, `/ca/nhip` vẫn 1 vòng) nhanh lên vì
  D1 hết bị nghẽn bởi các câu kéo bản đồ đề riêng 153 KB và bởi 300 lượt đọc R2 trọn gói lúc cả lớp vào.
- Không đạt 50 %: `/vao-thi` lúc vào phòng chờ p95 −17 % (p50 −65 %; em tới rải 40 s nên ít xếp hàng — số vòng 6 → 2 vẫn là lợi thật trên máy chủ thật);
  `/goi tenTheoSbd` KHÔNG đổi mã (1 vòng) — dao động là nhiễu đo (lượt đo nền thứ nhất p95 4 226 ms, lượt hai 127 ms, cùng mã).
- **Lỗi dưới tải = 0** ở cả hai lượt của cặp chính.
- Máy chủ thật: mỗi vòng D1 ≈ 300–400 ms lúc cao điểm ⇒ `/vao-thi` bớt 4 vòng (≈ 1,2–1,6 s mỗi em), `/nop` bớt 2 vòng + không tải lại 121 KB tờ đáp án,
  `/ca/chi-tiet` bớt 3 vòng, `/cham-diem` bớt ~7 vòng mỗi lô 8 em. Tổng cả ca: vòng D1 −18 %, lượt R2 626 → 326, byte R2 59,6 MB → 0,2 MB.

**Độ nhiễu của máy đo (nói thật):** máy đo dùng chung với phiên khác (có lúc hai trình duyệt của phiên khác chiếm 160 % CPU). Hai lượt đo NỀN cùng mã
chênh nhau tới 20 lần ở pha 300 em tới (`truoc-834475c.json` vs `truoc-834475c-2.json`); lượt `sau-908a50b.json` chạy lúc tải nền ~16–19 có 16 lỗi
"Network connection lost" của D1 cục bộ (cả `/luu-tam`, `/trang-thai` KHÔNG đổi mã cũng lỗi ⇒ lỗi môi trường). Chạy HAI Worker đồng thời
(`*-cap.json`) làm máy quá tải: nền 1 635 lỗi, sau 1 231 lỗi — cùng lỗi môi trường, bản sau vẫn ít lỗi hơn. Vì vậy bảng chính dùng cặp chạy lúc máy yên nhất.

## 3. Kết quả màn thi (trình duyệt, CPU 6×, Slow 4G, 360×740)

Màn thi (`src/`) KHÔNG đổi ở PR này ⇒ số dưới đây là NỀN (`docs/do-ca-3009/may-yeu-thi-834475c.json`, trung vị 2 lượt), đo trên bản dựng của nhánh
(mã `src/` trùng khít `origin/main`). Máy chủ giả trả lời tức thì trong trang — số này là phần CỦA MÁY EM.

| Chỉ số (CPU 6×, Slow 4G, 360×740, chế độ máy yếu) | Nền 834475c |
|---|---:|
| Mở link → ô nhập SBD hiện (FCP/LCP) | 4 537 ms (FCP 4 264) |
| Bấm Vào thi → câu 1 hiện | 4 438 ms |
| Tổng tác vụ dài khi vào đề (TBT) · tác vụ dài nhất | 1 755 ms · 472 ms |
| INP khi chạm chọn đáp án (lâu nhất / 8 lượt) | 80 ms |
| Thời gian một lượt chọn (TB / max) | 101 / 129 ms |
| Tác vụ dài lớn nhất khi chọn · số tác vụ > 100 ms trong 8 lượt chọn | **150 ms · 3** |
| Số component vẽ lại MỖI lượt chọn | **243** |
| INP khi gõ số Phần III | 160 ms |
| Ngồi yên 12 s (đồng hồ + lưu nháp): commit · tác vụ dài | 14 · 2 |
| JS tải cho màn thi (nén / thô) · số tệp | 347 KB / 1 027 KB · 38 (ExamTakeScreen 35 KB, katex 83 KB) |

**Chưa đạt tiêu chí "không tác vụ dài > 100 ms khi chọn đáp án"**: mỗi lượt chạm vẽ lại 243 component (cả `ExamTakeScreen` 3 900 dòng chạy lại,
`setSaveFlash` thêm một lượt vẽ 700 ms sau). Sửa phần này đụng LUỒNG THI THẬT (cần Boss soát) ⇒ để **lượt sau** (mục 6), không đưa vào PR gấp này.

## 4. Đã sửa (chỉ cái số đo chứng minh)

| Nút thắt đo được | Sửa |
|---|---|
| `/vao-thi` 6 vòng D1 nối tiếp (docCa · có danh sách · dòng danh sách · **đọc lại** dòng danh sách · lượt mới nhất · ghi) | Bốn lần đọc đi chung MỘT `batch` (`docCaVaoThi`), còn 1 câu ghi ⇒ **2 vòng**. Câu cổng giữ nguyên từng chữ. |
| Mọi `SELECT * FROM ca` trên đường của em kéo **cả bản đồ đề riêng của lớp** (153 KB với 300 em) — `/phong-cho` (hỏi 3 s/lần/em), `/vao-thi`, `/de/`, `/nop` | Đường của em chỉ đọc cột cần. Phần đề riêng của MỘT em được cắt NGAY TRONG D1 bằng `bo_theo_em_json -> '$.bo."<sbd>"'` (chỉ khi cột là đối tượng JSON hợp lệ; dạng lạ ⇒ đọc trọn cột, xử y hệt bản cũ kể cả ném lỗi). Kết quả qua `locGoiDeRiengChoEm` trùng khít bản cắt trên cả cột (test 9 dạng cột). |
| `GET /de/` 300 lượt đọc R2 trọn gói khi cả lớp nhận đề cùng lúc | Đệm isolate `server/src/dem-ca-thi.ts` khoá theo **(bank_r2, cap_nhat_luc)** — mọi đường ghi gói đề đều ghi R2 rồi đổi `cap_nhat_luc` (cùng khoá với đệm `protectedQuestions`); quá 10 s thì hỏi lại R2 có điều kiện (etag). Lượt đang bay dùng chung. Thêm `304` khi trình duyệt gửi `If-None-Match`. |
| `/nop` 3–4 vòng (docCa · ghi · docCa lại) + đọc R2 trọn tờ đáp án + JSON.parse + stringify lại mỗi lượt | MỘT `batch` (đọc `ca` · ghi có khoá chống trùng · đọc lại lượt). Luật "chỉ nộp phút cuối" xét y như cũ: câu ghi trong batch tự đứng yên khi ca bật luật (`NOT EXISTS …`), xét hạn bằng JS rồi ghi ở vòng 2. Tờ đáp án: đệm + **hỏi R2 có điều kiện MỖI lần** (luôn tươi — `capNhatKeyBank` không đổi `cap_nhat_luc`), tải song song với vòng D1 khi isolate đã biết ca công bố ngay; nguyên văn JSON ghép thẳng vào phản hồi. |
| `/ca/chi-tiet` 4 vòng nối tiếp + đọc R2 trọn tờ đáp án | Bốn câu đọc chung MỘT `batch`, tờ đáp án đọc song song qua đệm có điều kiện. |
| `GET /ten-theo-sbd` 3 vòng | 1 `batch`. |
| `/cham-diem` lô 8 em: mỗi em thêm 1 vòng tính lại `tien_do_hs` | Các cặp (về 0, tính lại) của cả lô chung batch (≤ 100 câu/batch). Mỗi cặp chỉ đụng dòng của đúng em ⇒ bảng y hệt vòng lặp cũ (test). |

## 5. Bất biến đã kiểm

- **Đáp án không xuống máy em trước khi nộp**: `/de/` chỉ đọc khoá `de/`; test `/de/` không chứa `correct`/lời giải; biên bản và bộ câu của bạn khác không có trong phản hồi `/vao-thi`; tờ đáp án chỉ ở `/nop` ca công bố ngay (như cũ) và lệnh thầy.
- **Giờ thi / đồng bộ giờ**: `quyetDinhVaoThi`, `mocHetGio` không đổi, đọc đúng các cột ấy; `tests/dong-bo-gio-phong-thi.test.ts` xanh (D1 giả không có `batch` ⇒ đường lùi chạy lần lượt).
- **Không mất đáp án**: `/luu-tam` không đổi; `/nop` cất đúng từng ô (test so `dap_an_json`, `giay_cau_json`, rời màn); nộp lại ⇒ `daNhan`, không ghi đè.
- **Chấm y hệt**: điểm `gradeFromKeyBank` trên bài đã cất = trên bài máy em gửi, cùng tờ đáp án em nhận; `/cham-diem` gộp batch ⇒ `tien_do_hs` = tổng `tien_do_ca` từng em (có cả ca cũ). Tờ đáp án đổi giữa ca ⇒ em nộp sau nhận bản mới (test).
- **Schema**: KHÔNG đổi (không migration, không chỉ mục mới).
- **Kiểm**: `tsc -p server` sạch; `npm run build` đạt (tsc -b + vite), `kiem-sw` 13/13, precache 163 tệp / 2 944 KB (trần 170 / 3 000); `npm run check:mau` đạt;
  không regex lookbehind. `tests/toi-uu-ca-3009.test.ts` 21/21. 256 tệp test liên quan (vào thi, nộp, lưu tạm, phòng chờ, đề, chi tiết ca, chấm,
  đồng bộ giờ, công bố điểm, mọi test đọc `server/src/index.ts`): **0 test đỏ mới** — 30 đỏ đều nằm trong 33–34 đỏ của nền `834475c` chạy cùng danh sách
  (so theo TÊN). Vài test giao diện chập chờn khi máy bận (vd `btvn-nang-do-thay-2109`) chạy riêng xanh ở cả hai cây.

## 6. Lượt sau (chưa làm ở PR này)

1. **Màn thi máy yếu** (đo ở mục 3): tách trạng thái đáp án khỏi thân `ExamTakeScreen` (kho nhỏ theo câu + `useSyncExternalStore`) để một lượt chạm chỉ
   vẽ lại đúng thẻ câu ấy (243 → vài component), bỏ lượt vẽ thừa của chấm "đã lưu" (`setSaveFlash`), `setAttempt` 10 s/lần cho giây-từng-câu
   chuyển sang ref; gõ số Phần III (INP 160 ms) debounce ghi IndexedDB. Mục tiêu: không tác vụ dài > 100 ms khi chọn. Cần Boss soát (luồng thi thật).
2. `/luu-tam` chỉ gửi phần đổi (`json_patch` trong D1) + gộp `/trang-thai` vào cùng nhịp + hàng đợi offline có backoff: số đo lượt này KHÔNG cho thấy
   đây là nút thắt (1 vòng D1, ~1–2 KB, p95 89 ms sau sửa) ⇒ chưa làm; đáp án vẫn an toàn vì máy em ghi IndexedDB mỗi lần chọn và nhịp sau gửi lại đủ.
3. `/ca/nhip`: 1 vòng nhưng đọc ~826 dòng/lượt (quét 300 lượt + 300 `trang_thai`) — chỉ mục CHỈ-THÊM `trang_thai(ma_ca, cap_nhat_luc)` qua
   `CHI_MUC_CRON_DEM` sẽ chỉ đọc dòng đổi. Chưa làm: 3 s/lần của MỘT máy thầy, không nghẽn.
4. `/goi batDauThi` (3 vòng, `SELECT *` hai lần) và `ghiSuKienThi` trong `/cham-diem` — lệnh thầy, một lần mỗi ca.
5. Đo lại trên máy đo KHÔNG dùng chung (nhiễu pha 300 em tới rất lớn — mục 2) hoặc nhiều lượt lấy trung vị.
