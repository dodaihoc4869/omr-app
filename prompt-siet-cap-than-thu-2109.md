> **TRẠNG THÁI: NHÁP, CHƯA GIAO.** Thầy lệnh "đề xuất tôi duyệt rồi build" và đổi mốc thành 21 ngày / 1 200 ngày ⇒ con số đúng nằm ở `DE-XUAT-THAN-THU-MOI-NGAY-2109.md` (Điều 1–2). Boss viết lại đề bài này sau khi thầy duyệt.

# ĐỀ BÀI — SIẾT ĐƯỜNG LÊN CẤP THẦN THÚ: ít nhất 10 ngày mới tới cấp 10, ít nhất 1200 ngày mới tới cấp 120 + TÍNH LẠI cho mọi em đã chơi

Người viết: Boss · 21/09/2026. Thầy lệnh (3 tin liên tiếp ~13:30–13:50): "Siết exp lên cấp, ít nhất 10 ngày mới lên được cấp 10" · "Tăng lên 1200 ngày mới lên được cấp 120. Hãy tính toán cẩn thận và thông minh, hiệu quả" · "Siết xong điều chỉnh lại toàn bộ exp của các học sinh đã chơi".

## 0 · SỐ THẬT HÔM NAY (Boss đọc D1 chỉ-đọc, 13:45)
- Mùa mới bắt đầu 05:05 sáng nay. Sau CHƯA ĐẦY 9 GIỜ: 3 em cấp 7, 5 em cấp 6, 7 em cấp 5 (97 hồ sơ, 43 em có EXP). Đường cũ: tới cấp 10 chỉ 1 630 EXP.
- EXP vào ống nghiệm trong ngày của em có chơi: giữa 297 · một phần tư trên 710 · cao nhất 1 119. Em ĐẠT nhiệm vụ ngày: giữa 498. (Riêng EXP học tập: giữa 106, cao nhất 474; thưởng game lần đầu gặp dạng 20/40/40: giữa 200.)
- ⇒ EXP kiếm được KHÔNG có trần cứng (trần mềm thầy đã chốt 19/09, giữ nguyên). Muốn BẢO ĐẢM "ít nhất N ngày" thì không siết chỗ KIẾM, mà siết chỗ THẦN THÚ HẤP THỤ.

## 1 · LUẬT MỚI (Boss chốt theo lệnh thầy)
**1.1 Sức hấp thụ mỗi ngày (ngày VN, máy chủ là nguồn duy nhất):**
| Hôm nay của em | Thần thú hấp thụ tối đa |
|---|---|
| Em ĐẠT nhiệm vụ ngày (có dòng `dat_ngay` hôm nay) | **200 EXP** |
| Em có học nhưng chưa đạt (hôm nay đã kiếm ≥ 1 EXP) | **120 EXP** |
| Em không học | **0** — thần thú chỉ ăn vào ngày em có học |
- Phần EXP kiếm dư NẰM NGUYÊN trong ống nghiệm (không vứt công của em; sức chứa 50 000 giữ nguyên), hôm sau nạp tiếp. Kiếm EXP: KHÔNG đổi gì (trần mềm, bảng giá EXP, thưởng game giữ nguyên).
- Mọi đường làm đổi `cap`/`exp` của thần thú PHẢI đi qua đúng một cổng hấp thụ (Code 3 rà mọi nơi gọi `nhanExp`/ghi `p.cap`); đếm trong hồ sơ: `hapThu:{ngay:'YYYY-MM-DD', da:number}`. Em đạt SAU khi đã nạp 120 ⇒ được nạp tiếp tới 200.

**1.2 Đường cấp mới (một nguồn: `thanhExp` trong `src/game/than-thu-hoa-hoc/kinh-nghiem.ts`; mọi nơi đang dùng hàm này tự theo):**
- Cấp 1→10 (9 thanh): `180 190 200 210 220 230 240 260 270` = **2 000 EXP** = đúng 10 ngày hấp thụ tối đa (9 ngày chỉ được 1 800 ⇒ không thể sớm hơn ngày thứ 10).
- Cấp 10→120 (110 thanh): cấp số nhân, thanh đầu **320**, công bội ≈ **1,0286**, làm tròn chục, thanh cuối bù cho tổng ĐÚNG **238 000**. Tổng cả đường **240 000 EXP = 1 200 × 200**. Thanh không bao giờ giảm.
- Mốc tiến hoá rơi vào (em ĐẠT mọi ngày, không sót ngày nào): cấp 10 ngày 10 · cấp 13 ngày 15 · **cấp 30 ngày 53 · cấp 50 ngày 128 · cấp 70 ngày 259** (em lớp 12 bắt đầu hôm nay học đều tới đầu tháng 6/2027 thì chạm Thăng hoa ngay trước kỳ thi) · cấp 100 ngày 663 · cấp 120 ngày 1 200. Em chỉ "có học" (120/ngày): cấp 10 ngày 17, cấp 30 ngày 88.
- Khiên quà cấp 10 vẫn khoá theo 36 ngày đạt (không đổi).

**1.3 Tính lại cho em đã chơi (công bằng: mọi em cùng một luật từ đầu mùa 21/09):**
- Với MỖI hồ sơ: `T = tổng EXP đã nạp theo đường CŨ (cộng dồn thanh cũ tới cap + exp) + wallet`. Số ngày đã qua của mùa = số ngày VN từ đầu mùa tới hôm tính (hôm nay = 1). Được coi là đã hấp thụ `min(T, 200 × số ngày em có học trong mùa)`; rải vào đường MỚI ⇒ `cap/exp` mới; PHẦN CÒN LẠI trả về `wallet` (không em nào mất EXP). `hapThu` hôm tính = phần đã hấp thụ của hôm đó. Lưu vết ngay trong hồ sơ: `truocSiet:{cap,exp,wallet,luc}` để lùi được.
- Cách chạy AN TOÀN (em đang chơi, hồ sơ có `revision`): KHÔNG chạy một tệp SQL đè JSON. Làm CHUYỂN ĐỔI LƯỜI trong Worker (hàm thuần, idempotent, cờ `luatCap:2` trong hồ sơ) khi hồ sơ được đọc + cron quét dần các hồ sơ chưa đổi (≤ 50 hồ sơ/lượt). Trước khi đẩy Worker: sao lưu D1 vào `omr-saoluu/` như thường lệ.
- Mỗi em BỊ ĐỔI CẤP nhận MỘT tin trong app (trong trần thông báo hiện có), chữ: "Từ 21/09 thần thú lớn theo từng ngày em học: mỗi ngày hấp thụ tối đa 200 EXP khi em đạt nhiệm vụ ngày. EXP em đã kiếm vẫn nguyên trong ống nghiệm, thần thú sẽ ăn dần mỗi ngày em học." Không tin cho app phụ huynh (app phụ huynh không có game).

## 2 · CHIA VIỆC
- **Code 1 (hàm thuần + test, làm TRƯỚC):** (a) sửa `thanhExp` đúng 1.2 (đọc kỹ chú thích đầu tệp, viết lại phần lịch sử; hằng số một nguồn); (b) `src/lib/hap-thu-ngay.ts`: `tranHapThu({datHomNay, coHocHomNay})`, `hapThu({cap,exp,wallet,hapThu}, xin, ngayVN, tran)` trả hồ sơ mới + số đã nạp + lý do từ chối; `chuyenDoiLuatCap(hoSoCu, soNgayCoHoc, ngayVN)` cho 1.3. Test tính chất BẮT BUỘC: tổng 9 thanh đầu = 2 000; tổng 119 thanh = 240 000; thanh không giảm; **với MỌI chuỗi nạp hợp lệ, ngày sớm nhất tới cấp 10 = 10 và tới cấp 120 = 1 200**; chuyển đổi bảo toàn `T` (cap/exp mới + wallet mới = T), idempotent, không em nào tăng cấp sau chuyển đổi; đột biến. Liệt kê test cũ khoá số đường cũ (1 286 590, 3 610…) và sửa CÓ CHỦ Ý.
- **Code 3 (máy chủ, sau Code 1):** cổng hấp thụ trong `invest` + rà mọi đường đổi cấp; chuyển đổi lười + cron quét; tin cho em; `visible(p)` trả thêm `hapThuHomNay:{da, tran, lyDo}` cho màn; câu báo khi bị chặn (xem mục 3). Không đụng luật chấm, ca kiểm tra, khiên.
- **Code 2 (màn game):** cạnh nút nạp hiện "Hôm nay {tên thú} đã hấp thụ 120 / 200 EXP"; chặn ⇒ nói thật, không đỏ: đã đủ ⇒ "Hôm nay {tên thú} đã ăn no. EXP còn lại nằm trong ống nghiệm, mai em nạp tiếp."; chưa học ⇒ "Thần thú chỉ ăn vào ngày em có học. Em làm vài câu rồi quay lại nạp nhé."; chưa đạt ⇒ "Đạt nhiệm vụ ngày hôm nay thì {tên thú} ăn được thêm 80 EXP." Rà mọi chỗ hiện "còn thiếu N EXP lên cấp" — đúng theo đường mới. Đọc `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` trước khi đặt chữ.
- **Bộ não (Code 1):** lời mời được nhắc "còn thiếu N EXP" chỉ khi số lấy từ thẻ SAU chuyển đổi. Tối nay (lượt 18:30) TẠM CẤM nêu số EXP còn thiếu và số cấp trong lời mời — gỡ khi Boss báo luật cấp đã sống.

## 3 · RÀO
Không đổi luật chấm, hạn nộp, luồng kiểm tra thật, luật công bố; không gì của game sang app phụ huynh; commit theo đường dẫn; mỗi cụm một commit, xin Boss soát; Worker chỉ Code 3 đẩy từ worktree sạch sau khi chạy toàn bộ vitest; Pages Code 2. Thứ tự lên sóng: Worker (luật + chuyển đổi) TRƯỚC, Pages (chữ mới) ngay sau; màn cũ gặp máy chủ mới vẫn phải chạy được (trường mới là chỉ-thêm).
