# Phụ kiện thần thú — quy cách vẽ ĐỢT 1 + ĐỢT 2 (Code 4, làn mỹ thuật; M1 + M2 + M3 21/09 — ĐỦ 40 món có hình / kiểu)

Đề xuất gốc: `DE-XUAT-SHOP-PHU-KIEN-2109.md` mục 3 (bảng món) + 6 (mỹ thuật). Thành phần: `src/game/than-thu-v2/phu-kien/ThuMacDo.tsx` (bọc `ThuHinh`). Xem thử (dev): `npm run dev` ⇒ `/src/components/xem-thu/phu-kien.html?gd=toi&mon=HQ-03,KT-08&tinh=1&cap=100` (mỗi món × 8 loài) hoặc `?tong=1&thu=5` (BẢNG TỔNG 24 món trên một loài) · `?thu=N` (một loài, to) · `?trai=1` (thú nhìn trái).

## Ba lớp, không cần neo theo loài
| Ô (khoá `dangMac`) | Mã | Lớp | Vị trí | Hình |
|---|---|---|---|---|
| `hao-quang` | HQ-01…08 | SAU thú (z 0) | hộp = 1,7 × hộp thú, tâm trùng tâm thú | SVG `viewBox 0 0 256 256`; thú chiếm ô giữa **53–203**, tâm **(128,128)**, chân ≈ y 203 |
| `vet` | VD-01…08 | SAU-DƯỚI (z 1) | rộng 1,5 × hộp thú, sát chân, đuôi kéo về phía NGƯỢC hướng nhìn (thú nhìn trái ⇒ lật) | SVG `viewBox 0 0 256 96`; bên **phải** = chỗ thú, đường đi dọc y ≈ 68 |
| `khung` | KT-01…08 | DƯỚI chân (z 3) | ngay dưới hộp thú (chừa `CAO_KHUNG_TEN` = 52 px) | CSS + token `--pk-*`, KHÔNG tệp hình; cần `ten` (tên thú) mới vẽ |

Thú giữ z 2. Mã lạ / sai ô / ô đợt 2 (`dau`, `co-lung`) bị bỏ qua — thú luôn hiện.

## Luật vẽ (test khoá: `tests/phu-kien-mac-do-2109.test.tsx`, `…-trinh-duyet-2109.test.ts`)
- Mỗi món MỘT tệp `hinh/pk-<mã thường>.tsx` ≤ **4 KB**, ≤ 40 nút, không `<image>`, không `<text>`, không chữ; nạp lười (import động ở `nap-hinh.ts`).
- Màu KHÔNG viết cứng: tô bằng lớp `pk-f1/2/3` (fill) · `pk-s1/2/3` (stroke) theo bảng màu của món `.pk-m-<mã thường> { --pk-1…--pk-3 }` ở `phu-kien.css` (dùng `rgb()`, không hex); bậc = `--pk-b1…b5` ở `tokens.css`. Gradient: `style={{ stopColor: 'var(--pk-1)' }}`; mã `id` trong SVG lấy từ prop `id` (nhiều thú cùng mặc một món không được trùng).
- Bậc 1–3: KHÔNG `<filter>` SVG (toả sáng bằng vài vòng nét dày mờ dần). Bậc 4–5 được dùng, nhưng chỉ tĩnh. Không blur động, không `backdrop-filter`.
- Chuyển động chỉ `transform` / `opacity`; **mỗi lớp tối đa MỘT phần tử chuyển động** (`pk-lay`, `pk-nhap`, `pk-nhap-cham`, `pk-quay`) ⇒ một thú ≤ 3. Sử thi: nhịp thở 4 giây · Huyền thoại: ánh chạy chậm 6 giây (khung: `::after` trượt bằng `transform`).
- `tinh` (trận Đoàn nhiều thú) và "giảm chuyển động" của máy ⇒ tĩnh hết (CSS `.pk-tinh`, `prefers-reduced-motion`).

## Thêm một món (M2)
1. Sổ đã có mã/ô/bậc/kiểu ở `phu-kien-mon.ts` (đúng bảng chốt; KHÔNG thêm tên/giá — chữ do danh mục của Code 3).
2. Hào quang / vệt: viết `hinh/pk-<mã>.tsx`, thêm dòng vào `NAP` ở `nap-hinh.ts`, thêm `.pk-m-<mã>` vào `phu-kien.css`. Khung: thêm kiểu `.pk-k-<kiểu>` vào `phu-kien.css` (viền/nền/ký hiệu).
3. `npx vitest run tests/phu-kien-mac-do-2109.test.tsx tests/phu-kien-mac-do-trinh-duyet-2109.test.ts` + `npm run check:mau` + `npx tsc -b`.

## M3 — đợt 2: "Trên đầu" (DA-01…08) + "Trên lưng" (CL-01…08), bảng neo 8 loài × 6 giai đoạn
Xem thử: `?dot=2&tong=1&thu=N` (16 món trên một loài; thêm `&cap=…` `&trai=1` `&co=NNN`) · `?bo=HQ-08,VD-08,KT-08,DA-08,CL-08` (mặc đủ 5 ô lên cả 8 loài) · **`?neo=1&thu=N` = TRANG SOI ĐIỂM ĐẶT** (một loài × 6 giai đoạn, dấu: lục đỉnh đầu · đỏ mặt · lam cổ · tím lưng; thêm `&trai=1` soi bản lật). Ảnh: `docs/anh-phu-kien-2109/m3-*.jpg`.

**Bảng neo** = `src/game/than-thu-v2/phu-kien/phu-kien-neo.ts` (`neoCua(pet, cap, quayTrai)`): toạ độ 0–1 của HỘP VUÔNG của thú (đo trên ĐÚNG ảnh `ThuHinh`, thú nhìn phải; loài 0 giai đoạn 3 đã lật cho nhìn phải), giai đoạn tính như `ThuHinh` (cấp 1/10/30/50/70/100). Bốn điểm: `dau` (đỉnh đầu giữa hai tai · r = bề rộng đầu) · `mat` (giữa hai mắt — món KHÔNG ĐƯỢC che, test giữ) · `co` (cổ · r = bề rộng cổ) · `lung` (giữa lưng phía trên · r = độ dài thân · g = nghiêng). `quayTrai` ⇒ x → 1 − x, góc đảo dấu, hình món lật (`.pk-thu[data-huong='trai'] .pk-neo svg`). Sửa số ⇒ mở `?neo=1&thu=N` soi lại rồi chạy test Chromium.

| Lớp (thứ tự DOM) | z | Món | Điểm neo | Hộp hình (viewBox 0 0 100 100, hình vẽ quay MẶT PHẢI) |
|---|---|---|---|---|
| hào quang · vệt | 0 · 1 | đợt 1 | — | như trên |
| trên lưng SAU thú | 1 | CL-05 cánh giọt nước · CL-07 cánh bóng đêm · CL-08 áo choàng | `lung` | rộng = 1,25 × `lung.r`, tâm ở (50,50) = giữa lưng; thân dài 80 |
| **thú** | 2 | | | |
| trên lưng TRƯỚC thú | 4 | CL-03 áo · CL-06 ba lô + bóng bay | `lung` | như trên |
|  |  | CL-01 khăn loang màu · CL-02 vòng cổ ngọc trai · CL-04 khăn lửa trắng | `co` | rộng = 2,9 × `co.r`, tâm (50,50) = cổ; cổ rộng 35 |
| khung tên | 3 | đợt 1 | — | dưới chân |
| **trên đầu** (trên cùng) | 4 | DA-01…08 | `dau` | rộng = 1,25 × `dau.r`; ĐỈNH ĐẦU ở (50,70), đầu rộng 80 (x 10–90); mắt nằm dưới y ≈ 79 ⇒ **hình không được thò quá y 77** |

- Món trước thú KHÔNG che mắt (hộp mặt ±0,30 đầu × ±0,09 đầu quanh `mat`); cánh / áo choàng vẽ SAU thú nên thú che bớt (thú có cánh sẵn thì cánh phụ chỉ lòi ra ngoài — ý đồ).
- Mỗi tệp ≤ 4 KB; thêm lớp `pk-f4` / `pk-s4` (màu thứ tư `--pk-4`, tuỳ chọn) và `pk-ft` / `pk-st` (trắng thuần) — vẫn KHÔNG hex, KHÔNG `<filter>` ở bậc 1–3.
- **MỘT thú tối đa 3 món chuyển động**: mặc 4–5 món có chuyển động thì chỉ 3 món bậc cao nhất được động (bằng bậc: hào quang, vệt, khung, đầu, lưng), món còn lại thêm lớp `pk-dung` (đứng yên); bậc Thường không chiếm chỗ. Trong Đoàn `tinh` ⇒ tĩnh hết.
- Sổ món: `MON_DOT_2` ở `phu-kien-mon.ts` (`neo` + `lop` mỗi món). Test của Code 3 khoá `MON_DOT_1` đúng 24 món ⇒ KHÔNG thêm món đợt 2 vào đó. Khi C3 + C4 xong: Boss đổi `DOT_MO_BAN` 1 → 2 ở `src/lib/phu-kien-danh-muc.ts`.
- Test: `tests/phu-kien-mac-do-2109.test.tsx` (đơn vị 28) + `tests/phu-kien-dat-do-trinh-duyet-2109.test.ts` (Chromium thật 14: 6 giai đoạn × nhìn phải / trái × 16 món × 8 loài đúng điểm neo, không che mắt, thứ tự lớp, hình lật, không tràn; chuyển động mỗi món ≤ 1, đủ bộ 5 ô ≤ 3, tĩnh / giảm chuyển động = 0).
