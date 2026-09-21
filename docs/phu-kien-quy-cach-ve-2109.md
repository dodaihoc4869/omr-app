# Phụ kiện thần thú — quy cách vẽ ĐỢT 1 (Code 4, làn mỹ thuật; M1 + M2 21/09 — ĐỦ 24 món có hình / kiểu)

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
