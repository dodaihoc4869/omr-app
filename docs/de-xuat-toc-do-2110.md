# Đề xuất tốc độ 3 app — quét 20/10 (thầy: "quét kĩ từng lớp 3 app, tối ưu tốc độ phản hồi")

Quét BẰNG ĐỌC MÃ (ba tác tử chỉ đọc) — **chưa đo mili-giây trên máy thật**. Chỉ hai mục đầu đã làm; còn lại là đề xuất, mỗi mục ghi tệp:dòng, lợi, rủi ro, vì sao chưa làm.
Luật giữ cho mọi mục: không tăng byte tải mở (`kiem:toc-do`), không thêm chunk (precache đúng 170), không đổi giao diện.

## Đã làm (PR 3, mỗi việc một commit)
1. **Phụ huynh — có mạng lại thì đọc ngay** (`src/lib/ph-moi/use-tat-ca-ve-con.ts`). Trước: lỗi mạng lúc mở ⇒ nhịp lùi chờ 150–210 s mới tự thử lại; `online` không được nghe. Nay `online` đi qua `kich()` (vẫn chặn dội ≥ 20 s, không chạy chồng) nên không thêm tải cho máy chủ.
2. **Cổng phụ huynh — lệnh `xac-dinh` chạy song song với đọc IndexedDB** (`src/screens/ParentPortalScreen.tsx`). Trước: đọc địa chỉ đã lưu xong mới gửi lệnh mạng; máy yếu mở IndexedDB chậm thì lệnh mạng đứng chờ.

## Đã thử và LOẠI
- **Nạp lười `KhungXemPhieu`** (nhắm 21,9 KB nén): đo thật chỉ giảm 0,8–2,0 KB mỗi app (thư viện M3 vẫn nằm trong gói mở), precache thành 171 > 170, 28 test đòi sửa. Bỏ.
- **Tách effect "Câu đã làm" ở `ManTuChua`**: `dungDong` dùng `lichSu` (dòng "sai lần gần nhất") nên dữ liệu đổi sau mỗi lần em sửa lại câu — giữ bản cũ sẽ hiện số cũ.
- **Bỏ `await loadScriptUrlHoacMacDinh()` ở cổng học sinh** (`StudentPortalScreen.tsx:677`): `layDiaChiMayChu('')` cũng đọc IndexedDB nên lợi chỉ một lần mở, đo chưa ra.
- **Thử lại nhanh 4–8 s ở lần mở đầu của phụ huynh**: trái luật sự cố D1 21/09 (nhịp lùi không bao giờ nhanh hơn nhịp thường).

## Đề xuất — app học sinh
- **Xoá nhánh `!vaoM3` trong `StudentPortalScreen.tsx`** (khoảng 740 / 1971 dòng; các dòng 980-1005, 1049-1171, 1187-1395, 1445-1758, 1762-1828). Cổng chỉ dựng khi vai học sinh nên `dungM3()` luôn `true`. Ước lượng 5–6 KB nén (chưa đo), trừ được biên HS đang +0,9 KB / 1,0 KB. Rủi ro: test dựng cổng ở `/` (jsdom ⇒ `dungM3()` false) đỏ — cần `vi.mock dungM3 → true` như `tests/cong-hs-doi-phien-1310.test.tsx:13`; có `bang-nhiem-vu-may-chu-1909` (:200) và `dem-cau-bao-cao-1409` (:156) đọc chữ nhánh cũ. Nên làm riêng một PR, không dồn vào đêm phát hành.
- **`useBanNho` ghi `localStorage` mỗi 15 s** (`bang-nhiem-vu/may-chu.ts:185-204`, kích bởi `useGioHocTap.ts:9`). Giãn nhịp ghi cần ghi bù khi `visibilitychange → hidden`, nếu không mất trạng thái cuối. Chưa làm.
- **`TheDiemDanhHs.tsx:83-86`** gọi `buoiCuaEm` mỗi lần `visibilitychange`, chưa chặn dội 20 s như các hook khác.
- **Mở app có ≥ 8 lệnh nền cùng lúc** (`StudentPortalScreen.tsx:298-305, 423-431, 670, 769-771`, `ThongBaoHocSinh.tsx:86-142`): dời bớt sau sự kiện `ddh-sanh-da-ve`. Cần `wrangler tail` đếm trước. `useKeHoachNgay(lamMoiSheet)` (:769) gọi `ke-hoach-ngay` mỗi lần đóng màn con — bỏ thì cảnh báo thầy trễ tới 180 s, cần thầy chốt.

## Đề xuất — app phụ huynh
- **Máy chủ `/ph`**: mọi lệnh 2 đợt xác thực (`game-v2-auth.ts:72` rồi `ph-truy-cap.ts:68`, cùng một hàng); `phTatCaVeCon` ~6 đợt (`ph-tat-ca-ve-con.ts:462, 598-607`); `phConTongQuan` 5 đợt (`:253…:359`); `phHoc2` (`ph-bao-cao-moi.ts:73-76`) bốn lệnh nối tiếp độc lập. Cổng `toc-do-may-chu-lenh-nong-1310` KHÔNG bảo vệ các lệnh này — cần test đếm đợt D1 riêng trước khi sửa. Đây là mục có lợi lớn nhất cho phụ huynh nhưng đụng máy chủ sống, nên làm riêng.
- **Form đăng nhập nháy lúc chờ `xac-dinh`** (`ParentPortalScreen.tsx` vùng 134-165, `autoFocus` bật bàn phím): vẽ `<DangTai>` thay form khi máy đã nhớ pass. Đổi khung chờ ⇒ cần thầy duyệt.
- **Render lại thừa mỗi nhịp 180 s**: `AppPhuHuynh.tsx:153` và `:178` tạo object mới dù không đổi (`x.chuLoi ? {...x, chuLoi: ''} : x`). `dangLamMoi` ở `use-tat-ca-ve-con.ts:45` KHÔNG bỏ được: test `ph-tai-lai-khong-chong-1310` đòi giá trị. Lợi nhỏ (khoảng 1 trong 8 lần vẽ mỗi nhịp).
- **KaTeX (~83 KB nén) tải lúc rảnh ngay sau khi mở `/ph`** (`main.tsx:145,160`): bỏ thì lần đầu mở lời giải ca hiện chữ trần một nhịp rồi tự vẽ lại. Đánh đổi băng thông ↔ giao diện, cần thầy chọn.
- `ph-v3.css` còn ~50 / 140 lớp `.ph3-*` không tệp ts/tsx nào nhắc tên (chưa chắc vì ghép chuỗi động). Cắt có thể làm `kiem:mau-giu` đỏ.

## Đề xuất — app giáo viên (làn Code 1: `DIEU-PHOI.md` mục đẩy đòi dòng "0.Planer đã soát <mã>" trước khi đẩy)
- **`GvHomNayScreen.tsx:153-300`**: ba tầng chờ nối tiếp, `setDu` chỉ gọi cuối; rời màn mất `du`. Giữ `du` lần trước ở biến module làm giá trị khởi tạo + gọi `setDu` từng phần. Lưu ý test `gv-hom-nay-0910.test.tsx` cần hàm xoá bản nhớ giữa các ca.
- **Bảng chiến dịch tải lặp 3–4 lần** giữa Hôm nay → Hành trình → Chữa bài → Học sinh (`GvHomNayScreen:123,158`, `TheCanThayChua:233,243`, `HocSinhDanhSachV2:40,45`, `TheNhipHoc:29,37`, `LenBangChienDich:136,173`). Đề xuất `docBangNho(id)` hạn ~15 s trong `lib/tai-gioi-han.ts` (đã nằm trong các mảnh lười), bỏ qua đệm khi bấm Thử lại.
- **Đọc cả kho đề từ IndexedDB nhiều lần** (`exam-db.ts:646-649` gọi bởi `DayHocLenBang`, `KiemTraDauGio`, `to-chieu.ts:93-109`, `ThayTuChua`, `GoiLenBangScreen`): memo lời hứa đọc kho ~20 s ở `lib/khu-trung-cau.ts`.
- **`PhieuScreen` nhập tĩnh ở `App.tsx:22`**: kéo ~30,7 KB nén vào gói mở của giáo viên (`PhieuScreen`, `rut-de-chua`, `cau-hinh-chua`). Đổi `lazy` + `napSomTheoDuong` cho đường `phieu` gỡ được khoảng này, nhưng trái chủ ý ghi ở `App.tsx:35-37` (phụ huynh mở link phiếu thêm một vòng mạng) — phải build + `kiem-sw` đủ 170 tệp trước.
- `BangTinSan.tsx:40` (chỉ khi cờ 2.0 tắt) vẽ lại cả cây mỗi giây; `NenHoc.tsx:233-236` vẽ canvas thừa mỗi giây vì `nowMs` nằm trong deps.
- `DayHocLenBang.tsx:349` `indexOf` trong `map` (O(n²)); `:249-260` bấm "Chiếu lên bảng" chờ `napSucHoc()` mới dựng tờ.
- `exam-db.ts:154-191` mở kết nối IndexedDB mới mỗi lần gọi, không đóng; `exam-db` nằm trong gói mở nên sửa tốn vài chục byte nén.

## Cách đo cho lượt sau
Mở `wrangler tail` đếm lệnh `/ph` và `/hs` lúc mở app; ghi thời gian mở app (đến khi Hôm nay có số) bằng Performance trên máy yếu (Android 3G giả lập); chỉ nhận mục nào cổng `kiem:toc-do` không đỏ.
