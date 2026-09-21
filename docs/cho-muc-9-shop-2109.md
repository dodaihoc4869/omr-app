# Cửa hàng phụ kiện — chuỗi chữ mục 9 còn thiếu: ĐÃ DUYỆT (21/09 đêm)

Boss duyệt 11 chuỗi máy em còn thiếu; đã chép vào `DE-XUAT-SHOP-PHU-KIEN-2109.md` mục 9.3 (nhóm **[A1–A10]**) và thay ở `src/game/than-thu-v2/shop/chu-shop.ts` trong cùng commit. Mục 9 lại là nguồn duy nhất; không còn dòng `// CHỜ MỤC 9`.

| Mã | Hằng | Chữ chốt |
|---|---|---|
| A1 | `chuVeDao` | Về Đảo thần thú |
| A2 | `chuVeCuaHang` | Về Cửa hàng |
| A3 | `chuLocNhan` | Lọc theo chỗ đeo |
| A4 | `chuThanhKeoNhan` | Kéo thanh để chọn số EXP (dùng lại [B9]) |
| A5 | `chuDoiToiDa(n)` | Em đổi được tối đa {N} EXP |
| A6 | `chuKhongCan` | Không cần gì thêm |
| A7 | `chuKhongGioiHan` | Luôn có sẵn |
| A8 | `chuMonKeChuaDu` | {tên món}: {lời chỉ đường D1/D2} |
| — | `chuNhanKhungTen` | BỎ — app thật không vẽ dòng nhỏ trên khung tên, chỉ hiện tên thú |
| A9 | `chuThuCuaEm(ten?)` | Thần thú của em: {tên} · chưa có tên ⇒ Thần thú của em |
| A10 | `chuTheMon(…)` | Thử {tên}. Bậc {bậc}. Giá {N} vàng. {trạng thái} |

Khoá: `tests/shop-khoa-nguon-2109.test.tsx` (không còn CHỜ; mỗi [A#] có ở mục 9.3 lẫn chu-shop.ts).
