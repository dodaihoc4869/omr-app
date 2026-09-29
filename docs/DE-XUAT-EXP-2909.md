# ĐỀ XUẤT EXP MỚI — nạp tự do, cấp 10 ngày 21, EXP → vàng (29/09/2026)

> **TRẠNG THÁI: THẦY ĐÃ CHỐT 29/09/2026** ("chốt theo đề xuất, build luôn") — chốt cả 5 điểm mục 7 theo khuyến nghị: (1) vàng phương án C, 1 vàng / 5 EXP, thú nhận đủ; (2) BẬT khoá mốc: cấp 10 cần ≥ 21 ngày đạt, EXP vượt giữ chờ; (3) trần nguồn: câu vượt 3× mục tiêu = 0, khắc phục ≤ 3, lên bậc ≤ 10, game giữ 120; (4) khiên 21 mảnh + 21 ngày đạt + 1 400 vàng, KHÔNG cần cấp 10, giữ tối đa 5; (5) bảng giá mới theo bậc, vàng cũ giữ nguyên.
> Đã build ở nhánh `exp-moi-2909`: hằng số một nguồn `src/lib/kinh-te-game.ts` + `server/src/exp-cau-hinh.ts`; nạp tự do + khoá mốc + chuyển v3→v4 `src/lib/hap-thu-ngay.ts`; vàng tự động + rèn khiên bằng vàng `server/src/vang-duc.ts`; mô phỏng (bản `mo-phong.mjs` chạy bằng hàm sản phẩm) `src/lib/mo-phong-bang-gia-exp.ts`; test nghiệm thu `tests/exp-v4-2909.test.ts`.

(Bản gốc để thầy duyệt; số trong bảng do máy chạy `mo-phong.mjs`.)

## 1. Hiện trạng (origin/main)

| Thứ | Số hiện hành | Ở đâu |
|---|---|---|
| EXP một câu đúng [0/1/2 sao] | I 2/3/5 · II 3/5/8 · III 4/6/10 | `server/src/exp-cau-hinh.ts:6-10` |
| Trần mềm câu | đủ tới 2× mục tiêu ngày (mục tiêu 8–16 ⇒ 16–32 câu), sau đó 25% (tối thiểu 1), **không có trần cứng** | `exp-cau-hinh.ts:52-53`, `exp-hoc-tap.ts:126-136`, `ho-so-cau-hinh.ts:40-41` |
| Thưởng theo ngày (bảng từ 22/09) | đạt ngày 80 · lô đúng nhịp 20 / trễ 8 · BTVN đúng hạn 30 · câu đúng đầu ngày 10 · trở lại 30 | `exp-cau-hinh.ts:28` |
| Thưởng theo việc | mẹ giao 10 · lên bậc 6 · khắc phục 30 · lên bảng 15/5 · ca thi round(điểm)×3 · chuỗi 2×min(chuỗi,10) | `exp-cau-hinh.ts:34-46` |
| Game | nấc dạng 10/20/30, chặng Đoàn 5/10/15 (+3/trùm), tiếp sức 5 (≤5 lần); **tổng game ≤120/ngày**; câu game thứ 41 trở đi (Huyết Chiến) = 0 | `hap-thu-ngay.ts:19`, `exp-d1.ts:666`, `doan-core.ts:519-521`, `srs2-loi.ts:62,761` |
| Trần NẠP (sẽ bỏ) | 200/ngày khi đạt · 120 khi có học (≥4 câu) · 0 | `src/lib/hap-thu-ngay.ts:15-17,100-122`; `cnh-exp-p08.ts:124-129` |
| Đường cấp | 119 thanh viết tay; tới cấp 10 = 2 400 (sớm nhất ngày 12), tới 120 = 238 200 | `src/game/than-thu-hoa-hoc/kinh-nghiem.ts` `BANG_THANH_EXP` |
| Vàng | đổi tay EXP ống → vàng 1:1, phải giữ lại 400 EXP | `kinh-te-game.ts:2`, `game-v2-shop.ts:26,138` |
| Khiên rèn | 21 ngày đạt + 21 mảnh (1 mảnh/ngày đạt) + 300 EXP (giữ 400); giữ tối đa 5 | `exp-ho-so-game.ts:75-86`, `kinh-te-game.ts:3-5` |
| Giá đồ | bậc 1: 20–60 · bậc 2: 120–250 · bậc 3: 500–900 · bậc 4: 1 800–3 000 · bậc 5: 6 000–12 000 (40 món) | `src/lib/phu-kien-danh-muc.ts:36-80` |

**Một ngày của em chăm nhất kiếm tối đa** (theo luật thật + trần nguồn mới ở mục 2.3), ví dụ thứ Ba ngày 10:
câu đúng 166 (48 câu: 32 đủ + 16 lấy 25%) · đầu ngày 10 · lên bậc 60 (10 câu) · khắc phục 90 (3 câu) · đạt 80 · chuỗi 20 · lô 20 · BTVN 30 · mẹ giao 10 · game 120 = **606**. Trung bình 60 ngày: **584 EXP/ngày**.

Giả định em chăm nhất: mục tiêu ngày 16 câu; 48 câu học tập đúng/ngày, trộn Phần I/II/III = 60/15/25 %, sao 0/1/2 = 30/40/30 %; đạt mọi ngày; lô T2–T6; BTVN 2 bài/tuần (T4, T7); lên bảng đạt 1 lần/tuần (T5); ca thi 10 điểm 1 lần/tuần (CN); game chạm trần 120. Trung bình và yếu xem mục 4.

## 2. Thiết kế mới

### 2.1 Nạp tự do
Mọi khoản EXP vào thần thú **ngay lúc ghi sổ** (hợp với "mỗi câu đúng bay EXP vào thú kèm hiệu ứng"). Bỏ ống nghiệm, bỏ nút nạp, bỏ "hôm nay đã ăn no".

### 2.2 Đường cấp (công thức đóng)
- Cấp 1–9: `thanh(c) = làmTròn10(K · c^1,6)`, K = 87,49 để tổng 9 thanh = **T10 = 11 700** (thanh 9 bù phần lệch làm tròn).
- Cấp ≥ 10: `thanh(c) = thanh(9) + 60·(c − 9)`, tức tăng đều 60 EXP mỗi cấp.
- Thanh: **90 · 270 · 510 · 800 · 1 150 · 1 540 · 1 970 · 2 440 · 2 930** | 2 990 · 3 050 · 3 110 … (không bao giờ ngắn lại).
- Tổng tới cấp: 10 = 11 700 · 20 = 44 300 · 30 = 82 900 · 50 = 178 100 · 100 = 521 100 · 120 = 700 300. Giữ cấp tối đa 120 và các mốc tiến hoá 10/30/50/70/100.
- Cách chọn T10: em chăm nhất kiếm dồn tới ngày 20 = 11 615, tới ngày 21 = 12 201. T10 lấy số tròn trăm ngay trên số ngày 20 ⇒ **ngày 20 còn cấp 9, ngày 21 lên cấp 10.**
- Cấp 2 chỉ cần 90 EXP (khoảng 20 câu), nên em nào cũng lên cấp 2 ngay buổi đầu. Em chăm lên cấp 3 cũng trong ngày đầu.
- **Lưới an toàn khoá mốc**: muốn lên cấp 10 phải có ≥ 21 ngày đạt. Phần EXP vượt mốc để "chờ mốc", chưa đủ ngày thì chưa vào thú, đủ ngày thì vào hết. EXP không mất. Luật này trùng với luật khiên quà cấp 10 đã có (`exp-cau-hinh.ts:81`, 21 ngày đạt).

### 2.3 Chống cày: trần NGUỒN thay cho trần NẠP
| Nguồn | Trần hiện có | Đề xuất |
|---|---|---|
| Câu đúng học tập | 25% vô hạn sau 2× mục tiêu | **thêm trần cứng: từ câu thứ 3× mục tiêu trở đi = 0** (`TRAN_CUNG_HE_SO = 3`). Làm 200 câu vẫn chỉ được 166 EXP |
| Khắc phục (30/câu) | không | **≤ 3 lần có EXP/ngày** |
| Lên bậc (6/câu) | không | **≤ 10 lần có EXP/ngày** |
| Game | 120/ngày + Huyết Chiến | giữ nguyên |
| Đạt ngày, chuỗi, lô, BTVN, mẹ giao, lên bảng, ca thi | theo lịch của thầy | giữ nguyên |
Nếu thầy xếp lịch nhiều hơn giả định (thêm 1 ca thi và 1 lượt lên bảng mỗi tuần), máy thử cho thấy không có khoá mốc thì em lên cấp 10 **ngày 20**, có khoá mốc thì vẫn **ngày 21**. Vì vậy nên bật khoá mốc.

### 2.4 Vàng (EXP → vàng)
**Chọn: cứ 5 EXP em kiếm thì được 1 vàng, tự động. Thú vẫn nhận đủ 100% EXP.** Máy chủ tính `vàng đúc = floor(tổng EXP đã kiếm / 5) − vàng đã đúc`, nên phần lẻ không bị mất.
| Phương án | Ưu | Nhược |
|---|---|---|
| A. EXP thừa = phần vượt một mức mỗi ngày | đúng chữ "thừa" | thực chất lại là trần ngày; em yếu không bao giờ có vàng |
| B. Chia cố định 80% thú / 20% vàng | ai học cũng có vàng | số "+6 EXP" trên màn khác số thú nhận ⇒ một số mà hai nghĩa |
| **C. Thú nhận 100%, thêm 1 vàng / 5 EXP (chọn)** | một số một nghĩa; ai học cũng có vàng; vàng/ngày có trần theo trần nguồn | vàng là tiền song song chứ không phải "đổi EXP thừa" theo nghĩa đen |
EXP "thừa" đúng nghĩa (thú đã cấp 120): EXP vẫn ghi sổ, vàng vẫn đúc như thường. Bỏ lệnh đổi tay `vang-doi` và bỏ mức giữ lại 400.
Vàng/ngày: chăm nhất ≈ 117 · trung bình ≈ 63 · yếu ≈ 31.

### 2.5 Khiên rèn
- Điều kiện: **21 mảnh + 21 ngày đạt + 1 400 vàng**. Mảnh vẫn là 1 mảnh cho mỗi ngày đạt. Giữ tối đa 5 khiên chưa dùng. Mỗi khiên sau cũng 21 mảnh + 1 400 vàng.
- Vì sao chọn 1 400: đến ngày 21 em chăm nhất có 2 440 vàng, 1 400 là 60% số đó (làm tròn 100). Em vẫn mua được đồ khoảng 1 000 vàng mà vẫn rèn được đúng ngày 21. Mảnh và ngày đạt chặn cứng mốc ngày 21, không em nào rèn sớm hơn dù kiếm bao nhiêu.

### 2.6 Giá đồ theo bậc
Công thức: `giá = làmTròn10(63 × số ngày)`, trong đó 63 là số vàng/ngày của em trung bình. Mỗi bậc có một khoảng số ngày, món trong bậc rải đều theo thứ tự giá cũ.
| Bậc | Số ngày của em TB | Giá mới (giá cũ → mới) | Chăm nhất | Yếu |
|---|---|---|---|---|
| 1 | 2–3 | 20→130 … 60→190 | 2 ngày | 5–7 ngày |
| 2 | 4–7 | 120→250 … 250→440 | 3–4 | 9–15 |
| 3 | 8–13 | 500→500 … 900→820 | 5–8 | 17–27 |
| 4 (hiếm) | 14–28 (2–4 tuần) | 1 800→880 · 2 000→1 100 · 2 400→1 320 · 2 600→1 540 · 3 000→1 760 | 8–16 | 29–57 |
| 5 (+ chuỗi/suất như cũ) | 35–60 | 6 000→2 210 · 7 500→2 600 · 9 000→2 990 · 10 000→3 390 · 12 000→3 780 | 19–33 | 72–122 |

## 3. Chuyển dữ liệu cũ: chỉ thêm, không ai tụt cấp
1. **Giữ nguyên cấp.** Tiến độ trong thanh giữ theo tỉ lệ: `exp_mới = floor(exp_cũ / thanhCũ(cấp) × thanhMới(cấp))`.
2. **EXP đang nằm trong ống nghiệm** được nạp một lần vào đường mới (không trần). Em nào chưa đủ 21 ngày đạt thì phần vượt cấp 10 để "chờ mốc". Không đúc vàng cho EXP cũ để khỏi cộng hai lần.
3. **Giữ nguyên vàng, mảnh, khiên, đồ đã mua.** Hồ sơ ghi `luatCap = 4` và `truocSiet4` (cấp, exp, ống cũ) để lùi được. Sổ `exp_so` không sửa.
4. Em đã lên cấp ≥ 10 theo đường cũ (sớm nhất ngày 12) vẫn giữ cấp đó. Khoá mốc chỉ áp cho lần lên cấp 10 từ nay.

## 4. Kết quả mô phỏng 60 ngày (chạy thật)
Giả định hai hồ sơ còn lại:
- Trung bình: mục tiêu 12, 22 câu đúng/ngày, đạt 6/7 ngày, 4 lên bậc, 1 khắc phục, game 70, ca thi 7 điểm.
- Yếu: mục tiêu 8, 10 câu, đạt 4/7 ngày, game 35, ca thi 5 điểm.

Mô phỏng không mua đồ; ngày 1 là thứ Hai.

| Hồ sơ | EXP/ngày | % chăm nhất | Cấp 5 | **Cấp 10** | Cấp 20 | **Khiên đầu** | Khiên 2 | Vàng tích luỹ n7/14/21/30 | Cấp ngày 60 |
|---|---|---|---|---|---|---|---|---|---|
| Chăm nhất | 584 | 100% | ngày 3 | **21** | 76 | **21** | 42 | 802 / 1 620 / 2 440 / 3 490 | 17 |
| Trung bình | 314 | 54% | 6 | 38 | 142 | 24 | 48 | 438 / 876 / 1 314 / 1 882 | 12 |
| Yếu | 157 | 27% | 11 | 75 | 283 | 45 | >60 | 222 / 438 / 660 / 936 | 9 |

Dài hạn, em chăm nhất đạt cấp 30 ở ngày 142, cấp 56 ở ngày 365, cấp 107 ở ngày 1 000.
**Nghiệm thu: chăm nhất ngày 20 cấp 9, ngày 21 cấp 10 ✔; khiên đầu ngày 21 ✔ (±0).** Không có khoá mốc thì đường cấp vẫn cho ra ngày 21.

## 5. Rủi ro
- Nếu số giả định lệch thật (tỉ lệ phần/sao, số câu lên bậc/khắc phục), thời điểm lên cấp dịch 1–2 ngày. Khoá mốc bảo đảm không sớm hơn. Sau khi phát hành cần đo EXP/ngày thật (top 5 em) rồi chỉnh T10.
- Em đang có nhiều vàng cũ (đổi 1:1) sẽ mua ngay được món bậc 4–5 sau khi hạ giá. Nếu thầy muốn tránh: giữ giá bậc 5 như cũ, hoặc chỉ hạ giá món chưa ai mua.
- Hiệu ứng từng câu sẽ gọi ghi sổ nhiều hơn. Nên gộp khoản EXP theo lượt nộp như hiện nay, máy em chỉ phát hiệu ứng.
- Bỏ ống nghiệm thì các màn/chữ "ống nghiệm, ăn no, 200/ngày" phải gỡ hết (`hap-thu-ngay.ts` chuHapThu…, `TheChoAn.tsx`, `dao-core.ts`).
- Đo sơ bộ: thời gian game chạm trần 120 là con số lớn nhất ở em yếu. Nên kiểm để game không lấn việc học.

## 6. Tệp sẽ sửa khi build
- `server/src/exp-cau-hinh.ts`: thêm `TRAN_CUNG_HE_SO`, `KHAC_PHUC_TOI_DA_NGAY`, `LEN_BAC_TOI_DA_NGAY`, `EXP_MOI_VANG`, `NGAY_DAT_MO_CAP_10`.
- `server/src/exp-hoc-tap.ts`: trần cứng câu, trần khắc phục và lên bậc.
- `src/game/than-thu-hoa-hoc/kinh-nghiem.ts`: `BANG_THANH_EXP` v4 theo công thức; giữ bảng v3 để chuyển đổi.
- `src/lib/hap-thu-ngay.ts`: `hapThu` thành nhận ngay + chờ mốc; `chuyenDoiLuatCap` v3→v4; bỏ `HAP_THU_*`, `TRAN_EXP_GAME_NGAY` chuyển sang `exp-cau-hinh`.
- `server/src/exp-d1.ts`: `congVaoHoSoGame`, `ghiKhoanExpGame` tự nạp + đúc vàng.
- `server/src/exp-ho-so-game.ts`: rèn khiên bằng vàng.
- `src/lib/kinh-te-game.ts`: `VANG_REN_KHIEN = 1400`; bỏ `EXP_DU_TRU` và `EXP_REN_KHIEN`.
- `server/src/game-v2-hap-thu.ts`, `server/src/game-v2.ts`, `server/src/game-v2-shop.ts`: bỏ `vang-doi`, trả số vàng đã đúc.
- `server/src/cnh-exp-p08.ts`: `KINH_TE`, `tinhHapThu`, `xetKhien`, `moPhongChuan`, kèm vector `docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json`.
- `src/lib/phu-kien-danh-muc.ts`: bảng giá mới.
- `src/game/than-thu-v2/shop/logic-shop.ts`: `DU_MOI_NGAY` 80 → 63.
- `src/game/than-thu-v2/dao/dao-core.ts` và `src/components/bang-nhiem-vu/TheChoAn.tsx`: bỏ thanh hấp thụ, thêm hiệu ứng theo câu.
- `src/lib/mo-phong-bang-gia-exp.ts`: thay bằng mô phỏng này.
- Test: `tests/exp-hoc-tap-1909`, `tests/phu-kien-danh-muc-2109`, test hấp thụ/đường cấp, test P08.
- Migration: không cần, vì hồ sơ là JSON và chỉ thêm trường. Ghi `cau_hinh` mốc phát hành v4.

## 7. Thầy cần chốt
1. Vàng theo phương án C (1 vàng / 5 EXP, thú nhận đủ 100%)?
2. Bật khoá mốc cấp 10 cần 21 ngày đạt?
3. Trần nguồn mới: câu 3× mục tiêu, khắc phục ≤ 3, lên bậc ≤ 10?
4. Khiên 1 400 vàng: có bỏ điều kiện cấp 10 như máy chủ đang làm?
5. Hạ giá bậc 4–5 (có ảnh hưởng tới em đang giữ nhiều vàng cũ)?
