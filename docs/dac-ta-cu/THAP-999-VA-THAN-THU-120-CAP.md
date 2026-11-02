# ĐẶC TẢ v2 — THÁP 999 TẦNG, THẦN THÚ 120 CẤP, ĐỘ KHÓ THEO SAO

Kho: `omr-app` · Màn: `ThanThuHoaHocGame.tsx`
Soạn 15/09, thay hẳn bản v1 · **Chưa build.** Gõ `HÃY THỰC THI PROMPT NÀY` mới làm.

---

## 0. THẦY ĐÃ CHỐT

| # | Chốt |
|---|---|
| 1 | Độ khó theo **sao**: 2 sao khó nhất → 1 sao → 0 sao. Không dùng nhãn `mucDo`. |
| 2 | Nguồn câu: **mọi câu em đã thi** ở các ca trước — không lọc riêng câu sai. |
| 3 | Reset: **xoá sạch**, em chọn lại thần thú từ đầu. |
| 4 | Tháp **999 tầng**, **999 trùm**. |
| 5 | Thần thú **120 cấp**, **thêm hình thái mới cho đủ 120**. |
| 6 | Độ khó **rõ ràng từ cấp 10**; **từ cấp 13 trở đi phải lâu mới lên cấp**. |
| 7 | Đường EXP: tôi tự quyết — số cụ thể ở §5, thầy xem rồi bác nếu không vừa. |

---

## 1. ĐỌC MÃ: CÁI GÌ CÓ SẴN, CÁI GÌ PHẢI LÀM

### ✅ Sao CÓ THẬT trong kho đề

`src/data/examContent.ts`:

```ts
/** Số sao của một câu, câu chưa gắn thì 0. */
export function soSao(c: { canChua?: CanChua }): 0 | 1 | 2 {
  return c.canChua?.sao ?? 0
}
```

Kho đề JSON ghi ở `can_chua.sao`. `kiem-sao.mjs` đã đếm phân bố sao từ lâu.
Nghĩa là **không phải dựng thang khó mới** — thầy đã gắn sẵn, chỉ là game chưa
biết dùng.

### ❌ Máy chủ đang VỨT trường sao

`server/src/goi-cu.ts` → `napCauTuKho()` đọc câu từ R2 rồi chỉ giữ:

```ts
ra.set(qid, { loiGiai, dang, chuyenDe, mucDo, kienThuc, loiThuongGap })
//                                       ↑ không có canChua / sao
```

**Phải thêm `canChua` vào `CauKho`.** Đây là thêm trường, không đổi bảng.

### ❌ `hsCauSai` chỉ trả câu SAI

```sql
WHERE c.sbd = ? AND COALESCE(c.dung_sai, 0) = 0
```

Thầy muốn **mọi câu đã thi**. Cần một lệnh mới `hsCauDaThi` bỏ mệnh đề
`dung_sai = 0`, trả kèm `sao` và `dungSai`.

### ❌ Hai hệ trùm KHÔNG BAO GIỜ xuất hiện

```ts
const heTrumTang = (tang) => ['khi', 'kiem', 'axit', 'hoa'][(tang - 1) % 4]
```

Chỉ 4 trong 6 hệ. **Trùm hệ Điện hoá và Hữu cơ chưa từng có mặt** — em chọn
Lôi Kim Thú hay Mộc Tinh thì vòng tương khắc mất một nửa ý nghĩa.

### ❌ Kéo thẳng lên 999 tầng thì tháp vỡ

Tính bằng đúng công thức hiện tại:

| Cấp | Tầng | Công thú | Máu trùm | Số câu để hạ |
|---|---|---|---|---|
| 1 | 1 | 69 | 100 | 2 |
| 12 | 25 | 786 | 532 | **1** |
| 60 | 500 | 3.090 | 9.082 | 3 |
| 120 | 999 | 5.970 | 18.064 | 4 |

Từ tầng ~25 trở đi **đúng một câu là hạ trùm**. Và EXP:

> Leo hết 999 tầng với công thức cũ `30 + 6×tầng` = **3.026.970 EXP** —
> gấp **200 lần** cả đường 12 cấp hiện nay. Tháp thành máy in EXP.

Nên 999 tầng **bắt buộc** kéo theo cân bằng lại chiến đấu và EXP. Không phải
đổi một con số.

### 🗣 Nói thẳng về "thêm hình thái mới cho đủ 120"

Vẽ tay 120 hình thái 3D khác nhau là việc nhiều tuần và tôi không nghĩ nó đáng.
**Nhưng 120 hình thái khác nhau thật thì làm được**, vì hệ hình thái hiện tại
đã là hệ **sinh**, không phải 12 bức tranh:

```ts
coCon, soHat, damHaoQuang        // ba núm số, tăng dần
vo, than, sung, duoi, canhNho,   // cờ tính năng CỘNG DỒN
haoQuang, vay, canhLon, quyDao,
vuongMien, vongRune, toiThuong
```

Cách làm: giữ nguyên 12 cờ cũ, **thêm 14 cờ mới** (gai lưng, đuôi chẻ, vòng
hào quang kép, mắt thứ ba, giáp ngực, cánh ba tầng, đuôi lửa, vòng rune thứ
hai/thứ ba, hạt quỹ đạo kép…) rải trên 120 cấp, cộng với ba núm số tăng **mỗi
cấp một nhịp**. Kết quả:

- **mỗi cấp trong 120 cấp đều nhìn khác cấp liền trước** (ít nhất núm số đổi);
- **cứ ~5 cấp có một tính năng cấu trúc mới**;
- luật *"cấp sau ngầu hơn cấp trước"* vẫn **đếm được** bằng `demTinhNang`, nên
  phép kiểm vẫn bắt được nếu ai lỡ tay làm cấp sau nghèo hơn.

Nếu thầy muốn đúng nghĩa 120 bức khác hẳn nhau thì nói, nhưng tôi khuyên không.

---

## 2. KIẾN TRÚC CHỐT CỨNG

Bốn tệp thuần mới, **không React, không mạng** ⇒ kiểm được thật:

| Tệp | Việc |
|---|---|
| `src/game/than-thu-hoa-hoc/rut-cau-thap.ts` | chấm sao, chọn câu, sổ chống lặp |
| `src/game/than-thu-hoa-hoc/thang-cap-120.ts` | đường EXP, ánh xạ cấp → hình thái |
| `src/game/than-thu-hoa-hoc/hinh-thai-120.ts` | 120 hình thái sinh từ thang cờ |
| `src/game/than-thu-hoa-hoc/can-bang-thap.ts` | máu trùm, sát thương, EXP mỗi tầng |

`ThanThuHoaHocGame.tsx` chỉ gọi. **Cấm công thức nằm trong tệp màn hình.**

---

## 3. ĐỘ KHÓ THEO SAO

```
tầng 1 … 200      → câu 0 sao
tầng 201 … 550    → câu 1 sao
tầng 551 … 999    → câu 2 sao
```

Trong mỗi vùng, thứ tự ưu tiên khi rút:

1. câu **chưa hỏi lần nào** > câu đã hỏi ít > câu đã hỏi nhiều;
2. **chuyên đề chưa gặp trong lượt leo này** (rải đều, không dồn một chỗ);
3. câu em **từng làm sai** được ưu tiên nhẹ hơn câu em làm đúng (×1,25) — em
   đã thi mọi câu, nhưng câu từng sai vẫn đáng ôn hơn.

**Cạn câu thì nới theo đúng thứ tự này, không nhảy cóc:**
mượn sao thấp hơn một bậc → hạ sổ chống lặp còn một nửa → cho lặp → mượn
`KHO_CAU_HOI` chung. **Mỗi lần nới phải hiện một dòng chữ.** Cấm nới lặng lẽ.

> ⚠ **Đo trước khi chốt ba mốc 200/550/999.** Tôi chưa biết thực tế em có bao
> nhiêu câu mỗi loại sao — `kho-de/` trong kho rỗng, kho thật nằm trên R2.
> Bước B1 (§7) đo con số đó. Nếu câu 2 sao quá ít thì ba mốc phải dịch, và
> tôi sẽ báo số trước khi sửa.

**Sổ chống lặp** `lichSuThap: { qid, lanCuoi, soLanHoi }[]` lưu trong hồ sơ
thần thú (đã có đường đồng bộ đa thiết bị), giữ 300 mục mới nhất, hoà giải hai
máy bằng `max(soLanHoi)` và `max(lanCuoi)`.

---

## 4. 999 TẦNG, 999 TRÙM

### Trùm

- Hệ trùm chạy đủ **sáu** hệ: `[khí, kiềm, acid, hoả, điện, hữu cơ][(tầng−1) % 6]`
  — sửa luôn lỗi hai hệ không bao giờ xuất hiện.
- **Mười hai bậc trùm**, mỗi bậc ~83 tầng, mỗi bậc một tên và một dáng riêng
  (Quái Hoá Hắc Ám → … → Chúa Tể Nguyên Tố). Tên trùm = `bậc + hệ` ⇒ 12 × 6 =
  **72 tên trùm khác nhau**, không phải một tên lặp 999 lần.
- Cứ **mỗi 50 tầng** là một **tầng canh**: máu trùm ×1,6, thắng được thưởng ×2.

### Cân bằng — mỗi tầng luôn tốn ~5 câu đúng

Máu trùm **bám theo sức thú ở cấp em thường có tại tầng đó**, không phải một
đường thẳng cố định:

| Tầng | Cấp thường gặp | Công thú | Máu trùm | Số câu |
|---|---|---|---|---|
| 1 | 1 | 58 | 244 | 5 |
| 25 | 4 | 98 | 412 | 5 |
| 100 | 13 | 251 | 1.054 | 5 |
| 250 | 31 | 688 | 2.890 | 5 |
| 500 | 60 | 1.722 | 7.232 | 5 |
| 999 | 120 | 5.035 | 21.147 | 5 |

Hệ số tiến hoá đổi từ `1 + (ht−1)×0,25` (cấp 120 ra ×30,75 — vỡ) sang
`1 + (ht−1)^0,85 × 0,055` (cấp 120 ra ×4,3 — lành).

---

## 5. ĐƯỜNG EXP 120 CẤP

Ba đoạn, **khớp đúng hai mốc thầy chốt**:

```
cấp 1–9    thanh = 120 × 1,10^(c−1)              khởi động nhanh
cấp 10–12  thanh = … × 1,55^(c−9)                ← DỐC HẲN TỪ CẤP 10
cấp 13–119 thanh = … × 1,037^(c−12)              ← TỪ CẤP 13 LÂU DẦN
```

| Cấp | Thanh EXP | | Cấp | Thanh EXP |
|---|---|---|---|---|
| 1 | 120 | | 13 | 990 |
| 5 | 180 | | 20 | 1.280 |
| 9 | 260 | | 40 | 2.650 |
| **10** | **400** | | 60 | 5.480 |
| 11 | 620 | | 80 | 11.330 |
| 12 | 960 | | 100 | 23.430 |
| | | | 119 | 46.740 |

**Tổng tới cấp 120 = 1.286.590 EXP** (hiện 12 cấp chỉ tốn 15.120).

Mốc dồn tích: hết cấp 9 → 1.630 · hết cấp 12 → 3.610 · hết cấp 20 → 12.670 ·
hết cấp 60 → 130.310 · hết cấp 100 → 633.530.

> Nghĩa là em nào đang max cấp 12 hôm nay, sau reset leo lại tới cấp 12 chỉ
> tốn 3.610 EXP — **nhanh hơn bây giờ** (15.120). Rồi mới bắt đầu đường dài.
> Đây là chủ ý: reset không được làm em nản ngay tuần đầu.

### EXP tháp — không còn là máy in

- **Lần đầu hạ một tầng**: `25 + 0,9 × tầng` (tầng 1 → 25 · tầng 500 → 475 ·
  tầng 999 → 925).
- **Leo lại tầng đã hạ**: chỉ **12%**, làm tròn xuống, tối thiểu 1.
- Tổng leo hết 999 tầng = **474.575 EXP ≈ 37%** cả đường. Phần còn lại vẫn
  phải kiếm bằng thi, BTVN, MOM, săn câu sai — giữ đúng luật *"EXP chỉ đổi
  được bằng việc học thật"*.

`SUC_CHUA_ONG` nâng 2.000 → **50.000** (cấp 119 tốn 46.740, ống phải rót nổi
ít nhất một cấp ở mọi mức).

---

## 6. RESET TOÀN BỘ THẦN THÚ

**Chạy SAU khi bản mới đã lên Pages**, không phải bây giờ — em đang leo dở mà
mất thú thì vừa mất công vừa không có cái mới để chơi.

Ba bước, **không được đảo thứ tự**:

1. **SAO LƯU TRƯỚC.** Dump toàn bộ bảng `than_thu` trên D1 ra một tệp JSON đặt
   trong `omr-app/sao-luu/than-thu-truoc-reset-<ngày>.json`. Không có tệp này
   thì **không được chạy bước 2**.
2. Chạy lệnh xoá: đặt lại mọi dòng về `idThanhThuChon = ''`, `capDo = 1`,
   `exp = 0`, `khoExp = 0`, `soExp = {}`, `tangThapCaoNhat = 1`,
   `soCauDaThanhTay = 0`, `lichSuThap = []`.
3. Báo lại: **số học sinh bị reset**, đọc từ kết quả thật, không ước lượng.

> 🔴 **Không thể hoàn tác nếu mất tệp sao lưu.** Tôi sẽ đưa thầy xem tệp sao
> lưu và số dòng trước khi bấm xoá.

Sau reset, em mở app thấy màn *"Chọn thần thú đồng hành"* như lần đầu.

---

## 7. LUỒNG LÀM

| Bước | Việc | Ghi chú |
|---|---|---|
| **B1** | **ĐO TRƯỚC**: phân bố sao (0/1/2) trong kho đề; số câu một em đã thi qua mọi ca; tỉ lệ câu bị loại (có ảnh / phần II / III) | đọc-không-ghi · **báo số cho thầy trước khi chốt ba mốc tầng** |
| B2 | Máy chủ: `napCauTuKho` giữ `canChua`; thêm lệnh `hsCauDaThi` | chỉ THÊM, cấm đổi bảng |
| B3 | `thang-cap-120.ts` + `hinh-thai-120.ts` | 120 cấp, 120 hình thái sinh |
| B4 | `can-bang-thap.ts` | máu trùm, sát thương, EXP tầng |
| B5 | `rut-cau-thap.ts` | chấm sao, chọn câu, sổ chống lặp |
| B6 | Nối vào màn, 3D đọc hình thái mới | |
| B7 | Nghiệm thu bằng §8 | in bảng số |
| B8 | Đẩy lên Pages | |
| **B9** | **Reset** theo §6 | sau khi B8 xong |

---

## 8. ĐỊNH NGHĨA HOÀN THÀNH TỰ CHỨNG MINH

Nghiệm thu = chạy được và **in ra số**. Không nhận câu "đã xong".

| # | Tiêu chí | Ngưỡng |
|---|---|---|
| T1 | Leo 3 lượt × 10 câu, kho ≥ 80 câu | **0 câu lặp** trong 30 câu |
| T2 | Sao trung bình câu tầng 900 so với tầng 50 | **cao hơn ≥ 1,2 sao** |
| T3 | Sao trung bình tăng đơn điệu theo tầng | tầng 1→999, **không nấc nào tụt** |
| T4 | Số câu để hạ trùm, ở tầng 1 / 100 / 500 / 999 | **4 ≤ n ≤ 7** ở cả bốn mốc |
| T5 | Thanh EXP cấp 10 so với cấp 9 | **cao hơn ≥ 50%** |
| T6 | Thanh EXP cấp 13…119 | **tăng đơn điệu**, không nấc nào tụt |
| T7 | `demTinhNang(cấp N) ≥ demTinhNang(cấp N−1)` | đúng với **cả 120 cấp** |
| T8 | Sáu hệ trùm đều xuất hiện trong 999 tầng | **cả 6**, chênh nhau ≤ 1 tầng |
| T9 | Kho chỉ 5 câu (em mới thi 1 ca) | vẫn leo được, **có báo đang lặp** |
| T10 | Máy chủ bản cũ (thiếu `sao`) | **không vỡ**, lùi về coi mọi câu 0 sao |
| T11 | Leo máy tính → mở điện thoại | **không gặp lại** câu vừa hỏi |
| T12 | Hồ sơ cũ `capDo = 12` đọc bằng mã mới | không vỡ, không tự nhảy cấp |

Kèm **hai bảng in ra lúc nghiệm thu** để thầy nhìn là biết ngay:

```
tầng | vùng sao | số câu ứng viên | sao t.bình | máu trùm | số câu hạ | EXP
cấp  | thanh EXP | dồn tích | hình thái | số tính năng
```

Cộng: toàn kho vitest xanh · `tsc -b` sạch · `check:mau` sạch · chốt service
worker ĐẠT 10/10 trước khi đẩy.

---

## 9. CẤM

- **Cấm bịa số kho đề.** Chưa chạy B1 thì không chốt ba mốc tầng.
- **Cấm reset khi chưa có tệp sao lưu trong tay.**
- **Cấm im lặng nới rổ câu.** Mọi lần nới đều phải hiện chữ.
- Cấm đổi cấu trúc bảng máy chủ, cấm đổi tên cột, cấm đụng lệnh khác.
- Cấm để câu có ảnh / phần II / phần III lọt vào khung bốn nút.
- Cấm `Math.random()` rải rác trong hàm rút — nhận hàm ngẫu nhiên từ ngoài để
  phép kiểm chạy tất định.
- Cấm chạm tệp phiên khác đang sửa: `ExamTakeScreen.tsx`, `PhieuScreen.tsx`,
  `PhieuV3.tsx`, `public/_headers`, `DAY-TAT-CA.command`.
- Cấm chạm dữ liệu học sinh ngoài phạm vi: không tên, không điểm, không ảnh bài.

---

## 10. GIẢ ĐỊNH ĐÃ DÙNG — thầy bác thì tôi sửa

1. **"Diệt bot cũng lên 999"** = 999 tầng thì 999 trùm, mỗi tầng một con. Tôi
   KHÔNG hiểu thành một chế độ đấu bot riêng. Nếu ý thầy là chế độ khác thì nói.
2. Ba mốc sao **200 / 550 / 999** là tạm, chờ số đo B1.
3. Em thường lên ~1 cấp mỗi 8 tầng — dùng để định máu trùm. Đo lại sau một
   tuần chạy thật thì chỉnh.
4. 120 hình thái dựng bằng **thang cờ sinh** (§1), không vẽ tay 120 bức.
5. Reset chạy **sau** khi bản mới lên Pages.
6. Giữ nguyên `SUC_CHUA_ONG` là một bể duy nhất, chỉ nâng trần lên 50.000.
