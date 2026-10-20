# Đề xuất tốc độ 3 app — quét 20/10 (thầy: "quét kĩ từng lớp 3 app, tối ưu tốc độ phản hồi")

Quét BẰNG ĐỌC MÃ (ba tác tử chỉ đọc) — **chưa đo mili-giây trên máy thật**. Chỉ hai mục đầu đã làm; còn lại là đề xuất, mỗi mục ghi tệp:dòng, lợi, rủi ro, vì sao chưa làm.
Luật giữ cho mọi mục: không tăng byte tải mở (`kiem:toc-do`), không thêm chunk (precache đúng 170), không đổi giao diện.

## Quyết định thầy giao (21/10: "Tự tối ưu và tự động quyết tất cả sao cho tốt nhất") — mỗi quyết định kèm lý do
1. **Bù dữ liệu cũ (UPDATE): KHÔNG làm.** Dòng cũ không có giây đo thật để bù (chỉ thi và chữa lỗi có giây cũ); kích thước đề sẽ TÍNH LÚC ĐỌC từ nội dung câu khi làm Đợt 2 ⇒ không ghi đè dữ liệu thật. Ghi ở đặc tả `docs/dac-ta-muc-lam-bai-2010.md` 10b.
2. **KaTeX ở app phụ huynh: BỎ tải nền, nạp khi mở Chi tiết ca.** Chỉ `ManChiTietCa` vẽ công thức (có test khoá); nó tự gọi `napKatex()` ngay lúc mở, song song với lượt tải báo cáo. Lợi: bớt ~83 KB nén + ~270 KB mã phải dịch mỗi lần mở /ph. Cái giá: công thức hiện chữ một nhịp rồi tự vẽ lại nếu KaTeX về chậm hơn báo cáo (cơ chế sẵn có của `ChemText`, như app học sinh).
3. **Khung chờ phụ huynh thay form nháy: KHÔNG thay form.** Test `ph-bootstrap-doi-con-1310` cố ý bảo vệ việc đổi con khi liên kết đang xác định, nên form phải còn. Thay vào đó `xac-dinh` giảm 4 → 1 đợt D1 (khoảng nháy ngắn đi nhiều) và ô nhập KHÔNG tự lấy tiêu điểm khi máy đã lưu liên kết/số báo danh (bàn phím không bật rồi tắt).
4. **Bỏ làm mới kế hoạch ngày sau khi đóng màn con ở app học sinh (`useKeHoachNgay(lamMoiSheet)`): GIỮ NGUYÊN.** Bỏ thì cảnh báo của thầy tới em trễ tới 180 s — đánh đổi xấu hơn cho lợi nhỏ.
5. **Làn giáo viên: KHÔNG sửa.** `DIEU-PHOI.md` mục đẩy đòi dòng "0.Planer đã soát <mã>" trước khi đẩy commit làn giáo viên; không có phiên 0.Planer nào chạy nên không thể có dòng đó thật. Danh sách giữ nguyên ở dưới.
6. **Xoá khoảng 740 dòng nhánh `!vaoM3` của `StudentPortalScreen`: KHÔNG làm.** Lợi ~5–6 KB nén (~1,8% gói học sinh, chưa đo) mà rủi ro hỏng cổng học sinh (100–300 em) và ~40 test phải sửa. Chỉ nên làm khi có thời gian soát từng nhánh.
7. **Cờ nguồn đồng hồ cho giây của game: LÀM** (`doc.dh=1`). Máy em bản cũ gửi `msLam` (đồng hồ tường, chạy cả khi tab ẩn) vào CÙNG cột `giay` với đồng hồ mới ⇒ phải tách để không xếp Mức oan.

## Đã làm
- **PR 3 (#332):** phụ huynh có mạng lại thì đọc ngay (`online` qua `kich()`); cổng phụ huynh chạy `xac-dinh` song song với đọc IndexedDB.
- **PR 4 (máy chủ `/ph`, đo bằng cổng mới `tests/toc-do-may-chu-ph-2110.test.ts`, mốc `mayChuPh` trong `docs/moc-toc-do.json`):** xác thực gộp một truy vấn (liên kết có `pk` khỏi hỏi lại "em có tồn tại không") ⇒ **mọi lệnh /ph bớt 1 đợt D1**; `xac-dinh` lấy tên+lớp từ hàng xác thực và hoãn đếm truy cập qua `ctx` ⇒ **4 → 1 đợt**; `con-tong-quan` đọc sớm kế hoạch, mức, bảng Bài hằng ngày và kho tên câu song song với sổ ⇒ **9 → 5 đợt** (kết quả giống từng byte bản cũ trên dữ liệu thật). Tổng đường tới hạn lúc mở app phụ huynh bằng liên kết riêng (xac-dinh rồi 6 lệnh song song): **13 → 6 đợt D1 nối tiếp** (đo bằng bộ đếm đợt, KHÔNG phải mili-giây).
- Bảng số đợt/lệnh D1 (trước → sau): `xac-dinh` 4/4 → 1/1 · `con-tong-quan` 9/18 → 5/17 · `tat-ca-ve-con` 6/22 → 5/21 · `hoc-2` 6/11 → 5/10 · `nhip-hoc` 6/20 → 5/19 · `loi-thay` 3/4 → 2/3.
- Không tối ưu thêm `hoc-2`, `tat-ca-ve-con`, `nhip-hoc`: bốn lệnh đã cùng 5 đợt nên đường tới hạn do cả bốn quyết định; gỡ riêng một lệnh không rút ngắn thời gian mở app mà thêm rủi ro.

## Đã làm ban đầu (PR 3, mỗi việc một commit)
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
- **Máy chủ `/ph`** — ĐÃ LÀM MỘT PHẦN ở PR 4 (xem trên; chỗ còn lại: `phHoc2` bốn lệnh nối tiếp độc lập, `phTatCaVeCon` `chi_tiet_cau`, `phNhipHoc`): mọi lệnh 2 đợt xác thực (`game-v2-auth.ts:72` rồi `ph-truy-cap.ts:68`, cùng một hàng); `phTatCaVeCon` ~6 đợt (`ph-tat-ca-ve-con.ts:462, 598-607`); `phConTongQuan` 5 đợt (`:253…:359`); `phHoc2` (`ph-bao-cao-moi.ts:73-76`) bốn lệnh nối tiếp độc lập. Cổng `toc-do-may-chu-lenh-nong-1310` KHÔNG bảo vệ các lệnh này — cần test đếm đợt D1 riêng trước khi sửa. Đây là mục có lợi lớn nhất cho phụ huynh nhưng đụng máy chủ sống, nên làm riêng.
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
