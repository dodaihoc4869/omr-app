# Cắm giao diện thưởng phạt vào app học sinh «Trong» (26/10)

Mọi thứ thưởng phạt nằm trong tệp MỚI (không sửa tệp của nhánh `claude/duo-app-2610`). Người gộp cắm theo bảng dưới.
Hợp đồng dữ liệu: `docs/ban-ve-thuong-phat-2610/DAC-TA-THUONG-PHAT-2610.md` mục 4 (đọc qua `src/lib/thuong-api.ts`).

## Hai lớp tải

| Lớp | Tệp | Nạp |
|---|---|---|
| Hiện ngay (nhỏ, không gọi mạng ngoài `/hs/thuong`) | `ThanhThuong.tsx`, `TamThuong.tsx` (+ `BangCombo`, `OngNghiem`), `SoDem.tsx`, `hinh.tsx`, `dung-thuong.ts`, `loc-thong-bao.ts`, `styles/trong-thuong-gon.css`, `lib/hieu-ung-thuong.ts`, `lib/am-thanh-thuong.ts`, `lib/thuong-api.ts` | import thường TỪ màn đã nạp lười (Lộ trình, màn làm chặng) — không vào nhóm mở app |
| Màn đầy đủ | `ManThuong.tsx` (+ `ManChuoi`, `ManGiai`, `ManTinhThe`, `ManHuyHieu`, `ManBan`, `ManKimCuong`, `chung`, `styles/trong-thuong.css`) · `KetBaiThuong.tsx` | `React.lazy` |

```tsx
const ManThuong = lazy(() => import('./components/thuong/ManThuong'))
const KetBaiThuong = lazy(() => import('./components/thuong/KetBaiThuong'))
const TheBenThuong = lazy(() => import('./components/thuong/ManThuong').then((m) => ({ default: m.TheBenThuong })))
```

## Chỗ cắm

1. **Mở app** (`TrongHs` / cổng học sinh, cùng lúc gọi `hoa2-sanh`): `napSanTongQuan(token)` — gọi SONG SONG, không chờ. Kết quả vào bản gần nhất ở máy ⇒ thanh trên vẽ ngay lần sau.
2. **Thanh trên Lộ trình** (`MotTrangHs` → `header.da-tren`): thay ba viên số cũ (lớp · chuỗi «đủ mức» · câu hôm nay) bằng
   `<ThanhThuong token={p.token} onMo={moThuong} onHoc={p.onHoc} />` — đúng 3 bộ đếm (chuỗi · nguyên tử hôm nay · tinh thể) + Bi trong vòng «Mục tiêu ngày x/y bài».
   `onMo('chuoi' | 'nhiem-vu' | 'cua-hang')` ⇒ mở `<ManThuong man=… onVe={vềLộTrình} />`. Thanh trên tự nạp lười `ThongBaoThuong` khi có thông báo chưa xem
   (thăng hoa, bình đã đỡ, cuối tuần, mốc chuỗi, cược, huy hiệu, mốc đôi, gõ cửa, lời mời) và «Cứu chuỗi» khi chuỗi vừa tắt; truyền `thongBao={false}` ở màn khác.
3. **Thẻ bên Lộ trình** (`aside.dm-ben`, máy tính / ngang): thay thẻ «Bậc · nhịp học» (`theBac`) bằng `<Suspense fallback={null}><TheBenThuong token onMo={moThuong} /></Suspense>`
   (Giải tuần + Nhiệm vụ ngày). Học sinh KHÔNG thấy nhãn nhịp học / bậc.
4. **Màn làm chặng** (`ManLamBaiTap`, tấm kết quả `.duo-day`):
   - đọc `const th = docThuongCau(r.thuong)` từ phản hồi `answer`; trong `.duo-kq .giua` dưới tiêu đề: `<TamThuong thuong={th} />` (dòng «+12 ⚛ nguyên tử», Đúng +10 · Câu khó +5 · Chuỗi đúng 3 +2, số bay lên);
   - `th?.tinh === false` ⇒ gắn `data-tp-trung` lên `.duo-day` (tấm xám trung tính), tiêu đề = `CHU_KHONG_TINH` («Câu này chưa được tính — đọc kĩ rồi làm nhé»), KHÔNG «Chính xác / Chưa đúng»;
   - trên đề: `<BangCombo chuoi={th?.chuoiDung ?? 0} tat={th?.tinh === false && chuoiTruoc >= 3} truoc={chuoiTruoc} />` (phản ứng dây chuyền, rã khi câu không được tính);
   - thay thanh tiến độ `.duo-tien` bằng `<OngNghiem phanTram={…} combo={chuoiDung >= 3} nhan={`Câu ${i}/${n} của bài`} />`;
   - đổi chữ «EXP» trên màn «Trong» thành «nguyên tử» (`IcNguyenTu`).
5. **Màn xong chặng**: câu cuối có `ketBai` ⇒ `<Suspense><KetBaiThuong ketBai={docKetBai(r.ketBai)!} hang={tongQuan.giai?.hang} bat={tongQuan.bat} phu="Amine · chặng 3 · 6 câu" onTiep={…} /></Suspense>`
   thay thẻ cuối chặng cũ (`TheCuoiChang`). Rồi `capNhatTongQuan(token)`. Nếu đó là bài ĐẦU TIÊN trong ngày (ô hôm nay của `lich7` chưa là `hoc` trước bài) ⇒ mở
   `<ManThuong man="chuoi" hieuUng="chuoi" />` (số lật, lửa bùng — C1).
6. **Menu Thành tích** (`p.muc === 'ket-qua'`): khi menu mở (hoặc rê / focus mục Thành tích) gọi `napSanThanhTich(token)` (giải + bạn + huy hiệu, song song). Thêm 3 ô mở
   `ManThuong`: «Huy hiệu» (`man="huy-hieu"`), «Giải tuần» (`man="giai"`, chỉ khi `bat.giai`), «Học cùng bạn» (`man="ban"`, chỉ khi `bat.banBe`; `onMo('moi-ban')` ⇒ `man="moi-ban"`).
   Bỏ thẻ «Bậc · nhịp học» khỏi Thành tích (học sinh không thấy nhãn).
7. **Cửa hàng**: `man="cua-hang"`, `onMo('phu-kien')` ⇒ cửa hàng phụ kiện thú cũ. Đổi chữ «vàng» thành «tinh thể» trên màn «Trong».
8. **Thử thách Kim cương**: nút chặng / Hành trình khi chuyên đề đã thành thạo và `bat.kimCuong` ⇒ `<ManThuong man="kim-cuong" chuyenDe={{ ma, ten }} onVe={…} />`.
9. **Hết tuần / mở app** không cần làm gì thêm: thông báo đi qua `ThongBaoThuong` (bước 2).

## Tốc độ

- Các màn đầy đủ là MỘT mảnh lười (`ManThuong-*.js` + `trong-thuong-*.css`); `KetBaiThuong` mảnh riêng. Nếu số tệp precache vượt 170 ⇒ thêm `**/ManThuong-*.js`,
  `**/KetBaiThuong-*.js`, `**/trong-thuong-*.css` vào `globIgnores` của `vite.config.ts` (tải khi mở màn, vẫn nhanh nhờ HTTP cache).
- Thanh trên vẽ ngay từ bản gần nhất ở máy (`localStorage ddh.thuong.v1`), số đổi thì đếm từ số cũ (không chớp). Lệnh ghi có chống bấm lặp (lời hứa đang bay) + khoá máy chủ.
- Hiệu ứng: chỉ transform / opacity, hạt trong lớp `position: fixed; overflow: hidden` (≤ 40 hạt, gỡ khi xong), máy yếu nửa số hạt, giảm chuyển động ⇒ tắt hẳn.
