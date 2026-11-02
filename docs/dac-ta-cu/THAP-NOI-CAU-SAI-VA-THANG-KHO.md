# ĐẶC TẢ — THÁP DIỆT TRÙM: NỐI TOÀN BỘ CÂU SAI, HẾT LẶP, TẦNG CAO PHẢI KHÓ HƠN

Kho: `omr-app` · Màn: `ThanThuHoaHocGame.tsx` tab **Leo Tháp Tri Thức**
Soạn 15/09 · **Chưa build.** Gõ `HÃY THỰC THI PROMPT NÀY` hoặc `Build` mới làm.

---

## 0. HIỆN TRẠNG — ĐỌC TỪ MÃ, KHÔNG ĐOÁN

Trước khi sửa phải nói rõ cái gì thật sự hỏng. Tôi đã đọc mã, và **một trong
ba điều thầy nêu thì không đúng như vậy**:

### ✅ Nguồn câu ĐÃ nối toàn bộ ca thi rồi

`StudentPortalScreen.layCauSaiChoGame` gọi `hsCauSaiApi(url, sbd, [])`.
Danh sách mã ca **rỗng** ⇒ trong `server/src/goi-cu.ts` mệnh đề
`AND c.ma_ca IN (…)` bị bỏ qua ⇒ truy vấn lấy câu sai của **mọi ca em đã thi**.

Nên phần "nối vào tổng câu sai của tất cả các ca" **đã đúng ở tầng truy vấn**.
Cái làm thầy thấy như chưa nối nằm ở ba lỗi dưới — chúng bóp kho câu lại nhỏ
đến mức nhìn như chỉ có vài ca.

### ❌ Lỗi 1 — bậc rỗng thì lấy CẢ KHO, mọi tầng trộn làm một

`cau-hoi-cua-em.ts`:

```ts
export function locTheoBac(ds, bac) {
  const dung = ds.filter((c) => c.bac === bac)
  return dung.length > 0 ? dung : ds.slice()   // ← hết bậc thì trả CẢ KHO
}
```

Không có câu đúng bậc thì **trả về toàn bộ kho**, im lặng. Tầng 30 rút đúng
cái rổ mà tầng 1 rút.

### ❌ Lỗi 2 — cả kho dồn vào bậc 2, nên bậc 1 và 3 gần như luôn rỗng

`bacTheoMucDo`:

| Nhãn `mucDo` thầy gắn | Bậc |
|---|---|
| nhận biết | 1 |
| **thông hiểu** | **2** |
| **vận dụng** | **2** |
| vận dụng cao | 3 |
| **chưa gắn / rỗng** | **2** |

Ba trường hợp cùng đổ vào bậc 2, trong đó có cả **câu chưa gắn mức độ**. Nếu
kho đề phần lớn chưa gắn `mucDo`, thì bậc 1 và bậc 3 rỗng → rơi vào Lỗi 1 →
**mọi tầng rút từ một rổ duy nhất**. Đây gần chắc là nguyên nhân chính của cả
"lặp nhiều" lẫn "tầng cao không khó hơn".

> ⚠ **Chưa đo được, phải đo trước khi chốt:** `kho-de/` trong kho chỉ có thư mục
> rỗng, kho thật nằm trên máy chủ. Tôi **không biết** thực tế bao nhiêu phần trăm
> câu đã gắn `mucDo`. Bước B1 dưới đây là đo con số ấy. Không đo thì mọi ngưỡng
> đều là bịa.

### ❌ Lỗi 3 — sổ chống lặp xoá sạch mỗi lượt leo

```ts
const batDauLeoThap = () => { … setDaHoiCau([]) … }   // ← xoá sổ
```

`daHoiCau` chỉ chống lặp **trong một lượt leo**. Đóng ra mở lại là quên hết.
Mà em luôn bắt đầu lại ở `tangThapCaoNhat`, nên cứ vào là gặp lại đúng những
câu vừa gặp.

### ❌ Lỗi 4 — thang tầng chỉ có 3 nấc rồi đứng

```ts
bacTheoTang: t ≤ 10 → 1 · t ≤ 25 → 2 · t > 25 → 3
```

Tầng 26 và tầng 100 khó y hệt nhau. "Càng tầng cao càng khó" chỉ đúng tới
tầng 25.

### 💡 Tín hiệu độ khó CÓ SẴN mà game chưa hề dùng

Bảng `ban_do_sai` (`server/migration-1209-toan-bo.sql`) đã có:

```sql
so_lan_sai   INTEGER NOT NULL DEFAULT 1,   -- em sai câu này mấy lần
da_chua      INTEGER NOT NULL DEFAULT 0,   -- đã chữa chưa
```

Và `chi_tiet_cau` có `giay` (thời gian em làm câu ấy). **Nhưng `hsCauSai`
không trả về chúng** — nó chỉ `SELECT` từ `chi_tiet_cau`, không join
`ban_do_sai`. Đây là mỏ vàng chưa đào: *câu em sai đi sai lại 4 lần* là câu
khó **với chính em**, sát hơn nhãn mức độ chung của cả lớp.

---

## 1. MỤC TIÊU

1. Mỗi tầng tháp rút câu từ **toàn bộ** câu sai của em qua **mọi ca thi** —
   và khi rổ bị bóp nhỏ vì thiếu nhãn thì **nói ra**, không im lặng lấy bừa.
2. **Tầng càng cao câu càng khó**, liên tục và không có trần ở tầng 25.
3. **Hết lặp**: trong một lượt leo không lặp; qua nhiều lượt cũng không gặp
   lại câu vừa hỏi, cho tới khi thật sự cạn kho.
4. Độ khó đo bằng **thang liên tục** dựng từ dữ liệu có thật, không phải ba
   nhãn thô.

---

## 2. KIẾN TRÚC CHỐT CỨNG

- Toàn bộ tính điểm khó và rút câu nằm trong **một tệp thuần** mới:
  `src/game/than-thu-hoa-hoc/rut-cau-thap.ts` — không React, không mạng, nhận
  vào mảng câu + sổ lịch sử, trả ra câu được chọn. **Thuần ⇒ kiểm được thật.**
- `ThanThuHoaHocGame.tsx` chỉ gọi, không chứa công thức.
- Sổ lịch sử hỏi lưu **trong hồ sơ thần thú** (đã có đường đồng bộ đa thiết bị
  15-09) ⇒ leo trên máy tính rồi mở điện thoại **không gặp lại câu cũ**.
- Không thêm thư viện.

---

## 3. MỘT NGUỒN SỰ THẬT CẤU HÌNH

Mọi con số nằm trong **một** khối duy nhất đầu `rut-cau-thap.ts`. Cấm rải
số vào thân hàm.

```ts
export const CAU_HINH_THAP = {
  /** Số tầng để cửa sổ khó trượt từ đáy lên đỉnh thang. */
  SO_TANG_TRAI: 30,
  /** Nửa bề rộng cửa sổ khó, tính bằng phân vị. */
  NUA_CUA_SO: 18,
  /** Số câu gần nhất bị cấm hỏi lại (tính trên toàn bộ lịch sử, mọi lượt). */
  SO_CAU_CAM_LAP: 40,
  /** Trọng số ghép điểm khó. Tổng phải bằng 1. */
  TRONG_SO: { nhan: 0.55, soLanSai: 0.30, giay: 0.15 },
  /** Điểm khó quy từ nhãn mức độ thầy gắn. */
  DIEM_NHAN: { nhanBiet: 0, thongHieu: 34, vanDung: 67, vanDungCao: 100 },
  /** Câu đã thanh tẩy ở Săn Câu Sai bị hạ ưu tiên bao nhiêu phần. */
  PHAT_DA_THANH_TAY: 0.45,
  /** Cạn câu thì nới cửa sổ theo các nấc này rồi mới đụng tới sổ chống lặp. */
  NAC_NOI: [18, 30, 50, 100],
} as const
```

---

## 4. LUỒNG CHÍNH

### B1 — ĐO TRƯỚC, CHỐT SAU *(làm đầu tiên, trước khi viết một dòng nào)*

Chạy một lệnh đọc-không-ghi trên máy chủ, in ra:

- tổng số câu sai của một em thật, và số ca thi góp vào;
- **tỉ lệ câu có nhãn `mucDo`**, và phân bố bốn nhãn;
- phân bố `so_lan_sai`;
- tỉ lệ câu bị `doiCauSaiThanhCauChoi` loại (có ảnh / phần II / phần III…).

Báo cáo thầy đọc trước. **Nếu tỉ lệ gắn nhãn thấp** thì trọng số `nhan` tự
động nhường chỗ cho `soLanSai` (xem §5), chứ không ép dùng nhãn rỗng.

### B2 — Máy chủ trả thêm hai cột đã có sẵn

Trong `hsCauSai`, LEFT JOIN `ban_do_sai` để trả kèm `soLanSai` và `daChua`;
lấy luôn `giay` từ `chi_tiet_cau`.

> 🔒 **Chỉ THÊM trường vào phản hồi. Cấm đổi cấu trúc bảng, cấm đổi tên cột,
> cấm sửa bất kỳ lệnh nào khác.** Bản cũ thiếu ba trường này vẫn phải chạy
> bình thường (coi như `soLanSai = 1`, `giay = 0`).

### B3 — Điểm khó của từng câu, thang 0–100

```
dKho(câu) = 100 × ( w.nhan     × chuanHoa(điểm nhãn)
                  + w.soLanSai × chuanHoa(số lần sai)
                  + w.giay     × chuanHoa(giây em làm) )
```

- `chuanHoa` = **phân vị trong chính kho câu của em** (không phải chia cho
  hằng số bịa). Kho 20 câu hay 800 câu đều cho thang đầy đủ 0–100.
- Câu **chưa gắn nhãn**: bỏ thành phần `nhan`, chia lại trọng số cho hai
  thành phần còn lại — **không** gán mặc định 34 điểm như bản cũ.
- Câu nằm trong `qidDaThanhTay` (đã làm đúng lại ở Săn Câu Sai): nhân điểm
  ưu tiên với `PHAT_DA_THANH_TAY`, **không loại hẳn** — vẫn cần ôn lại.

### B4 — Cửa sổ khó trượt theo tầng

```
giua(tầng)  = 100 × min(1, (tầng − 1) / SO_TANG_TRAI)
cuaSo(tầng) = [ giua − NUA_CUA_SO , giua + NUA_CUA_SO ]  (kẹp trong 0…100)
```

| Tầng | Cửa sổ phân vị | Nghĩa |
|---|---|---|
| 1 | 0 – 18 | dễ nhất của chính em |
| 10 | 12 – 48 | |
| 20 | 45 – 81 | |
| 30 trở lên | 82 – 100 | khó nhất của chính em |

Liên tục, không nấc, **không có trần ở tầng 25**.

### B5 — Rút câu: ba lớp lọc, nới theo thứ tự cố định

1. Loại câu nằm trong **`SO_CAU_CAM_LAP` câu gần nhất** của sổ lịch sử.
2. Giữ câu có `dKho` trong cửa sổ của tầng.
3. Trong số còn lại, chấm điểm ưu tiên và lấy ngẫu nhiên có trọng số:
   - **ít bị hỏi nhất** (`soLanHoi` thấp) — đây là thứ thật sự giết lặp;
   - **chuyên đề chưa gặp trong lượt leo này** — rải đều, không dồn một
     chuyên đề;
   - nhân `PHAT_DA_THANH_TAY` nếu đã thanh tẩy.

**Cạn thì nới theo đúng thứ tự này, không được nhảy cóc:**

`NAC_NOI` nới cửa sổ 18 → 30 → 50 → 100 · rồi mới hạ `SO_CAU_CAM_LAP` còn
một nửa · rồi mới cho lặp · rồi mới mượn `KHO_CAU_HOI` chung.

**Mỗi lần nới phải hiện một dòng trên màn**, ví dụ *"Kho câu khó của em đã
cạn — đang nới sang câu dễ hơn"*. Cấm nới lặng lẽ.

### B6 — Sổ lịch sử hỏi, sống qua mọi lượt và mọi máy

Thêm vào `HoSoThanThuLuu`:

```ts
/** Sổ câu đã hỏi ở tháp. Khoá là qid, giữ tối đa 200 mục gần nhất. */
lichSuThap: { qid: string; lanCuoi: number; soLanHoi: number }[]
```

- Hoà giải đa thiết bị: **gộp theo `qid`**, lấy `max(soLanHoi)` và
  `max(lanCuoi)` — không bên nào đè bên nào.
- Cắt còn 200 mục mới nhất để hồ sơ không phình.
- Phải đi qua đúng `vaHoSo()` và `tronHoSoThu()` sẵn có.

---

## 5. TIÊU CHÍ TRẢI NGHIỆM ĐO ĐƯỢC

| # | Tiêu chí | Ngưỡng |
|---|---|---|
| T1 | Leo 3 lượt liên tiếp, mỗi lượt 10 câu, kho ≥ 60 câu | **0 câu lặp** trong 30 câu |
| T2 | `dKho` trung bình tầng 25 so với tầng 1 | **cao hơn ≥ 35 điểm** |
| T3 | `dKho` trung bình tăng đơn điệu theo tầng | tầng 1→30, **không nấc nào tụt** |
| T4 | Số chuyên đề khác nhau trong 10 câu một lượt | **≥ 4** (nếu kho có ≥ 4) |
| T5 | Mỗi lần nới cửa sổ | **luôn có dòng chữ hiện ra** |
| T6 | Kho chỉ 5 câu (em mới thi 1 ca) | vẫn leo được, **có báo đang lặp** |
| T7 | Máy chủ bản cũ (thiếu `soLanSai`) | **không vỡ**, tự lùi về dùng nhãn |
| T8 | Leo máy tính → mở điện thoại | **không gặp lại** câu vừa hỏi |

---

## 6. MÀN HÌNH

Chỉ thêm, không dựng màn mới:

- Dưới thanh máu trùm: `Tầng N · độ khó ~P%` — cho em thấy tầng cao thật sự
  khó hơn, không phải chữ suông.
- Dòng cảnh báo khi nới cửa sổ / khi lặp / khi mượn kho chung.
- Ô tóm tắt kho (`tomTatKho`) thêm: *"X câu · Y ca thi · Z câu chưa gắn mức
  độ"*. **Con số câu chưa gắn nhãn phải hiện cho thầy**, vì đó chính là thứ
  làm thang khó kém chính xác — thầy gắn thêm nhãn là game khá lên ngay.

---

## 7. TÍCH HỢP HỆ SẴN CÓ

- Không đụng `KHO_CAU_HOI` chung (vẫn là đường lùi cuối).
- Không đụng schema `dulieu.json` hay `BangDiem.xlsx`.
- Không đụng `chi_tiet_cau`, `ban_do_sai` ở mức cấu trúc — chỉ đọc.
- Giữ nguyên EXP: `NGUON_EXP.leoThap(tang) = 30 + tang × 6`.
- **Cấm chạm** các tệp phiên khác đang sửa: `ExamTakeScreen.tsx`,
  `PhieuScreen.tsx`, `PhieuV3.tsx`, `public/_headers`, `DAY-TAT-CA.command`.

---

## 8. ĐỊNH NGHĨA HOÀN THÀNH TỰ CHỨNG MINH

Nghiệm thu = chạy được và **in ra số**, không nhận câu "đã xong":

1. `tests/thap-rut-cau.test.ts` — kho giả 120 câu, phân bố nhãn lệch:
   - T1 · T2 · T3 · T4 · T6 · T7 ở trên, mỗi cái một phép kiểm **in ra số đo**;
   - mọi phép kiểm phải **đỏ trên mã cũ** (chạy ngược để chứng minh).
2. `tests/thap-lich-su.test.ts` — sổ `lichSuThap` qua `vaHoSo`, `tronHoSoThu`,
   gộp hai máy, cắt 200 mục.
3. Một bảng in ra khi chạy nghiệm thu:
   `tầng | cửa sổ | số câu ứng viên | dKho trung bình | số lặp`
   cho tầng 1, 5, 10, 15, 20, 25, 30, 40 — **thầy nhìn bảng này là biết ngay
   tầng cao có khó hơn thật không.**
4. Toàn kho vitest xanh, `tsc -b` sạch, `check:mau` sạch.

---

## 9. CẤM

- **Cấm bịa số liệu kho đề.** Chưa đo B1 thì không được chốt ngưỡng nào.
- **Cấm mặc định câu chưa gắn nhãn thành "vận dụng"** — đó chính là lỗi đang đi sửa.
- **Cấm im lặng nới rổ.** Mọi lần nới đều phải hiện chữ.
- Cấm đổi cấu trúc bảng máy chủ; cấm đổi tên cột.
- Cấm để câu có ảnh / phần II / phần III lọt vào khung bốn nút.
- Cấm dùng `Math.random()` rải rác trong thân hàm rút — phải nhận hàm ngẫu
  nhiên từ ngoài để phép kiểm chạy tất định.
- Cấm chạm dữ liệu học sinh ngoài phạm vi: không tên, không điểm, không ảnh bài.

---

## 10. GIẢ ĐỊNH ĐÃ DÙNG (thầy sửa nếu sai)

1. Em nào cũng đã thi **ít nhất 2 ca** nên kho câu đủ để chống lặp. Kho nhỏ
   hơn thì T6 lo.
2. Nhãn `mucDo` thầy gắn theo bốn mức chuẩn (nhận biết / thông hiểu / vận dụng
   / vận dụng cao). Nếu thầy dùng nhãn khác, nói để tôi sửa `DIEM_NHAN`.
3. `SO_TANG_TRAI = 30` — tức tầng 30 là chạm trần độ khó. Thầy muốn thang dài
   hơn (50 tầng) thì đổi đúng một số này.
4. "Khó" ở đây là **khó với chính em**, không phải khó theo chuẩn chung. Hai
   em cùng tầng 20 có thể gặp câu khác nhau. Nếu thầy muốn ngược lại — tầng N
   phải là cùng một mức độ cho cả lớp — nói để tôi đổi §3 sang chỉ dùng nhãn.
