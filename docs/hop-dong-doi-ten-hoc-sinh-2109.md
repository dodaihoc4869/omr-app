# HỢP ĐỒNG — nút "Đổi tên học sinh" trong hồ sơ (thầy lệnh 21/09)

Boss chốt. Làn giáo viên ⇒ mọi commit cần dòng "đã soát".

## HIỆN TRẠNG (đã dò mã)
Chưa có lệnh đổi tên MỘT em. Tên nằm ở: `danh_sach.ho_ten` (cổng vào thi, hồ sơ app thầy), `hoc_sinh.ho_ten` (app học sinh, phụ huynh, vinh danh, game), bản chép `luot.ho_ten`, `btvn_em.ho_ten`, `phong_cho.ho_ten`; sổ đã phát `phieu.ho_ten` và nhật ký `chan_vao.*`. Màn ca đọc `COALESCE(l.ho_ten, d.ho_ten)` ⇒ không sửa `luot` thì ca cũ vẫn hiện tên sai. Máy thầy: IndexedDB `omr-classlist`/`students` (`src/lib/classlist-db.ts`). `G.themEm` (goi-cu.ts:1134) upsert được tên nhưng ghi đè cả `nam_sinh` ⇒ KHÔNG dùng để đổi tên.

## 1 · Máy chủ (Code 3) — lệnh THẦY `/hoc-sinh/doi-ten`
Vào `{ sbd, hoTen }`, đòi mã bí mật. Chuẩn hoá: cắt khoảng trắng đầu/cuối, gộp khoảng trắng liền nhau, 2..60 ký tự, không ký tự điều khiển. Từ chối bằng lời: thiếu/không hợp lệ; SBD không có trong `danh_sach` lẫn `hoc_sinh`; tên mới TRÙNG tên cũ (`khongDoi:true`, không ghi).
Một batch, CHỈ cột tên, theo đúng `sbd`: `danh_sach`, `hoc_sinh`, `luot`, `btvn_em`, `phong_cho`. KHÔNG đụng: `phieu`, `chan_vao` (sổ/nhật ký đã phát — giữ nguyên lịch sử), `phu_huynh` (tên phụ huynh), SBD, lớp, năm sinh, mật khẩu, điểm, mọi thứ khác. Bảng/cột chưa có ⇒ bỏ qua bảng đó, không vỡ.
Ra `{ ok, sbd, tenCu, tenMoi, soDong: { danh_sach, hoc_sinh, luot, btvn_em, phong_cho } }`.
Test: chỉ cột tên đổi; em khác y nguyên; `phieu`/`chan_vao` y nguyên; trùng tên không ghi; SBD lạ từ chối; không có mã bí mật ⇒ 403.

## 2 · App thầy (Code 4) — hồ sơ học sinh (`HocSinhScreen.tsx` ~dòng 227)
Nút bút chì cạnh tên em (cùng kiểu bút chì đổi tên ca ở màn theo dõi), `aria-label="Đổi tên học sinh"`. Bấm ⇒ ô nhập tại chỗ (điền sẵn tên cũ) + Lưu / Huỷ, Enter = Lưu, Esc = Huỷ. Lưu: gọi lệnh trên; thành công ⇒ cập nhật `omr-classlist` trên máy thầy + tải lại hồ sơ + báo thật "Đã đổi tên: «cũ» → «mới»"; từ chối/lỗi ⇒ hiện đúng lý do máy chủ, giữ ô nhập. Máy chủ chưa có lệnh ⇒ báo lỗi thật, KHÔNG đổi riêng ở máy thầy (tránh hai nơi lệch tên). Ghi chú nhỏ dưới ô: "Tên mới hiện ở app học sinh và phụ huynh từ lần mở app kế tiếp." Sáng + tối, 1440 và 390, đích chạm ≥ 44 px.

## THỨ TỰ ĐẨY
Code 3 đẩy Worker trước; Code 2 đẩy Pages cùng đợt hai nút "Thêm 5 phút" / "Chiếu mã".
