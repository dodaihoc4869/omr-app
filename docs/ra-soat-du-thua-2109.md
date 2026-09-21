# RÀ SOÁT DƯ THỪA + THÂN THIỆN — 3 APP (lượt quét đầu, CHỈ ĐỌC) · 21/09/2026

Người quét: agent `ra-soat-giao-dien`. Luật soi: `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` (A, B, C1–C14, C-RÀO). Lệnh của thầy 21/09: "cái gì dư thừa bỏ hết, tối ưu sắp xếp, thân thiện mức cao nhất, học Apple".
Báo cáo này KHÔNG sửa gì. Boss duyệt ⇒ phiên chủ làn sửa theo lô, mỗi thứ bỏ có ảnh trước/sau + một dòng báo cáo dọn (C-RÀO).

**Soi tĩnh hiện có** (`npm run -s soi:giao-dien`): 21 LỖI + 121 cảnh báo / 474 tệp — G01 `div onClick` 12 · G02 nút biểu tượng thiếu nhãn 3 · G03 xoá outline 4 · G05 chặn phóng to 2 · G07 ô nhập thiếu nhãn 25 · G08 "..." 39 · G09 emoji 18 · G11 giờ 12 tiếng 22 · G13 chuyển động bố cục 10. Chi tiết đã có ở `docs/ket-qua-soi-giao-dien-2109.md` — không lặp lại ở đây.

**Đếm phát hiện:** Lô GV 17 · Lô HS + PH + game 18 · Lô mã chết 5 cụm (~13 000 dòng) · Lô máy chủ 0 (chưa soát chữ do máy chủ sinh).

---

## LÔ GV — app giáo viên (Code 4; dòng ghi "Code 1" thuộc làn Gọi lên bảng)

| # | app · màn · tệp:dòng | hiện trạng (điều thầy thấy) | luật | đề nghị | rủi ro + test khoá |
|---|---|---|---|---|---|
| G1 | GV · vỏ · `ThanhBenTrai.tsx:25-35`, `BottomNav.tsx:9` | 8 mục điều hướng + nút "Mở ca kiểm tra". Điện thoại đã gọn (4 + Thêm); máy tính vẫn 8 mục ngang hàng, mục dùng hằng ngày lẫn mục dùng theo đợt | C6, C5 | GỘP/DỜI — xem "Sắp xếp lại điều hướng" cuối tệp | `vo-thay-m3-2109.test.tsx` khoá `MUC_DIEU_HUONG` |
| G2 | GV · vỏ · `App.tsx:330,354` ↔ `ThanhBenTrai.tsx:42,59`, `BottomNav.tsx:11,42` | Huy hiệu "số câu em hỏi" ở mục **Học sinh hỏi** KHÔNG BAO GIỜ hiện: App không truyền `soCauHoi` ⇒ thầy phải tự vào mới biết có em hỏi | C7, C3 | THÊM: nối số thật từ máy chủ (nếu chưa có số ⇒ BỎ prop chết) | `vo-thay-m3-2109` nhắc `soCauHoi` |
| G3 | GV · 4 màn · `LichSuCaScreen.tsx:206`, `NganHangDeScreen.tsx:390`, `ExamSetupScreen.tsx:439`, `GoiLenBangScreen.tsx:1510` (Code 1) | Nút quay lại ghi **"Kiểm tra"** nhưng bấm là về **Hôm nay**; tên của trang chủ đời cũ. Ba màn đầu là mục cấp 1, đã có thanh điều hướng ⇒ nút thừa | C3, C6, C11 | BỎ ở 3 màn cấp 1; ở Mở ca ĐỔI CHỮ "Ca kiểm tra" và trỏ về `lichsuca` | không test khoá chuỗi này |
| G4 | GV · Ngân hàng đề · `NganHangDeScreen.tsx:604-630` ↔ `CaiDatScreen.tsx:54-60` | "Kết nối máy chủ mới" + "Mật khẩu mở app" hiện ở CẢ HAI nơi (màn Cài đặt ra đời nhưng khối cũ chưa gỡ) | C4, C5 | DỜI trọn khối "Cấu hình (1 lần)" (cả ô địa chỉ + mã kho đề) sang Cài đặt; BỎ ở Ngân hàng đề. Chỉ dời chỗ, không đổi hàm | chạm ô mã bí mật kho đề ⇒ Boss soát; không test khoá chữ |
| G5 | GV · câu báo lỗi · `HocSinhScreen:102-103`, `LichSuCaScreen:80-81`, `ExamMonitorScreen:308-309`, `CauHoiScreen:107`, `GoiLenBangScreen:362` (Code 1), `NutDongBoMoiCa:48-49`, `lib/exam-api.ts:168`, `lib/tro-ly/tra-loi.ts:58,62` | Lỗi chỉ đường "vào **Ngân hàng câu hỏi → Cấu hình**" — thanh bên ghi "Ngân hàng đề", cài đặt đã có màn riêng ⇒ thầy đi tìm không thấy | C10, C11 | ĐỔI CHỮ (sau G4): "vào Cài đặt → Kết nối máy chủ" | làm SAU G4 để không chỉ sai lần nữa |
| G6 | GV · tên màn · `ThanhBenTrai.tsx:26-32` ↔ `App.tsx:72-86` ↔ h1 `NganHangDe:383`, `GoiLenBang:1503`, `LichSuCa:199`; `ThanhBenTrai.tsx:66` | Một màn nhiều tên: "Ngân hàng đề" / "Ngân hàng câu hỏi"; "Gọi lên bảng" / "Gọi học sinh lên bảng"; "Hôm nay" / "Kiên trì" (câu báo lỗi sẽ ghi "Màn Kiên trì gặp lỗi"; title logo "Trang chủ Kiên trì"); mục "Ca thi" trong khi A2 chốt "Ca kiểm tra" cả 3 app | C11, A1.3, A2 | ĐỔI CHỮ: mỗi màn MỘT tên, lấy từ `MUC_DIEU_HUONG` cho cả h1 và `TEN_MAN` | `tu-ngu-app-thay-2109`, `vo-thay-m3-2109` |
| G7 | GV · Hôm nay · `ExamHubScreen.tsx:50-70,75` | Nút "Lấy bản mới" chữ 11 px treo cuối trang chủ | C5, C9 | DỜI sang Cài đặt (mục "Phiên bản app"), chữ ≥ 12 | `hom-nay-2109.test.tsx` khoá chuỗi; màn Hôm nay đang làm lại v3 — làm cùng đợt |
| G8 | GV · Học sinh · `HocSinhScreen.tsx:525-535` | Khối gập "Hướng dẫn quản lý học sinh theo lớp" thường trực trên đầu màn dùng hằng ngày | C3, C5 | BỎ (nếu cần giữ: dời vào nút "?" cạnh tiêu đề) | không test khoá |
| G9 | GV · Học sinh · `HocSinhScreen.tsx:168` (+1 chỗ), `KhoiKhacPhuc3CheDo.tsx` (1 chỗ) | Hộp `confirm()` của trình duyệt: nút "OK/Cancel", in cả mật khẩu mặc định | C8, B9, A1.5 | ĐỔI sang hộp thoại M3, nút mang tên việc "Đặt lại mật khẩu" | — |
| G10 | GV · Học sinh · `HocSinhScreen.tsx:346-356,531` | Tab "Mức độ tiến bộ (Lịch sử ca thi)" — hai tên một tab; "Reset mật khẩu" | A1.3, A1.4, A2 | ĐỔI CHỮ: "Lịch sử ca kiểm tra", "Đặt lại mật khẩu" | báo cáo đang làm lại v2 ⇒ chỉ đổi chữ |
| G11 | GV · đầu 9 màn · h1 ở `HocSinh:495`, `LichSuCa:198`, `NganHangDe:382`, `PhanCong:118`, `ExamSetup:398,440`, `CauHoi:183,203`, `CaiDat:26`, `ClassList:118` | Ba kiểu tiêu đề (serif cx-5 · sans cx-5 · tailwind text-lg/font-black); màn có ô biểu tượng màu, màn không | C11, B1, C3 | GỘP về MỘT thành phần đầu màn của app thầy; bỏ ô biểu tượng trang trí | thuần trình bày |
| G12 | GV · Giao BTVN · `PhanCongScreen.tsx:121-123,1024` | Chip trang trí "Chia chặng theo hạn nộp" 10 px cạnh h1; "Thời hạn nộp & Hoàn tất" | C3, C9, A2 | BỎ chip; ĐỔI CHỮ "Hạn nộp" | `tu-ngu-app-thay-2109`, `phan-cong-man-he-lo-1909` khoá chuỗi chip |
| G13 | GV · Danh sách lớp · `ClassListScreen.tsx` (259 dòng), `App.tsx:46,73,337`, `ThanhBenTrai.tsx:28` | Màn KHÔNG CÒN ĐƯỜNG VÀO: không nơi nào gọi `setScreen('classlist')` | C3 | BỎ màn + mục `TEN_MAN` + `con` (hoặc nối lại nếu thầy còn đồng bộ Google Sheet — hỏi Boss) | 4 test nhắc tên tệp (`m3-c-1909`, `tu-ngu-app-thay-2109`…) |
| G14 | GV · Ngân hàng đề · `NganHangDeScreen.tsx:601,617,622` | Chữ kỹ thuật trên màn: "Apps Script", "MA_BI_MAT", "IndexedDB", `kho-de/moi/`, "Cowork" | C1, A1.4 | ĐỔI CHỮ đời thường; chi tiết kỹ thuật vào dòng phụ/gập | — |
| G15 | GV + PH · vỏ · `App.tsx:336`, `App.tsx:257` | Chờ nạp màn = dòng chữ "Đang mở…"; chờ cổng phụ huynh = màn trống | C10, C7 | THÊM khung xương dùng chung | — |
| G16 | GV · Mở ca · `ExamSetupScreen.tsx:510,642` | Chú thích 11 px ("Chọn nhanh hoặc nhập tên lớp", "Quy định quyền truy cập") — dòng sau không mang thông tin | C9, C3 | BỎ dòng 642; nâng cỡ chữ dòng 510 | luồng mở ca ⇒ Boss soát |
| G17 | GV · Hôm nay · `HomNayScreen.tsx`, `src/components/bang-tin/*` | CHỈ GHI NHẬN: đang thiết kế lại theo `prompt-bang-tin-thay-v3.md`; `bang-tin/TamBen.tsx`, `bang-tin/cac-khoi.tsx` chưa ai nhập = đang xây, KHÔNG phải mã chết | — | — | — |

Theo dõi ca (`ExamMonitorScreen`) và Gọi lên bảng: gần như mọi khối có chú thích "thầy chốt <ngày>" ⇒ không đề nghị bỏ khối nào; chỉ có G3, G5.

---

## LÔ HS + PH + GAME MÁY EM (Code 2; dòng game do Code 5 sửa, Boss gộp)

| # | app · màn · tệp:dòng | hiện trạng (điều em / phụ huynh thấy) | luật | đề nghị | rủi ro + test khoá |
|---|---|---|---|---|---|
| H1 | HS · Bảng nhiệm vụ · `BangNhiemVu.tsx:272-467` | Trước danh sách VIỆC HÔM NAY có tới 7 khối: cảnh báo thầy → mời chọn thú → "Vừa nhận EXP" → tiến độ (kèm tới 5 dòng chú thích phụ, dòng 356-380) → Bộ não → EXP hôm nay → rồi mới tới việc. Máy 390 px: câu hỏi "hôm nay em làm gì?" nằm dưới màn đầu | C1, C2, B18 | DỜI `TheLamNgay` + `DanhSachNhiemVu` lên ngay sau thanh tiến độ; Bộ não + EXP xuống dưới; GỘP "Vừa nhận EXP" vào khối EXP; gom 5 dòng phụ thành 1 | thứ tự vùng lấy từ bản vẽ (prompt-giao-dien-nhiem-vu… dòng 77) ⇒ Boss đối chiếu; `bang-nhiem-vu-1909`, `bo-nao-the`, `bo-nao-bang` |
| H2 | HS · menu ba chấm · `muc-menu.tsx:13-22` ↔ `StudentPortalScreen.tsx:1400-1423` ↔ `BangTinPhuHuynh.tsx:100,419-612,628` | Menu 7 mục. Mục "Bảng tin & bài luyện hôm nay" mở một BẢNG THỨ HAI: lưới 6 ô "Chức năng học tập" (trùng chính menu), bảng vinh danh (trùng `TheVinhDanh`), "Gợi ý hôm nay" (trùng bảng nhiệm vụ), chip 10 px | C4, C6, C9 | BỎ lưới 6 ô; BỎ mục này khỏi menu học sinh sau khi xác nhận "bài luyện hôm nay" đã lên bảng nhiệm vụ | `vo-sheet-m3-1909` khoá chuỗi tiêu đề |
| H3 | HS · `StudentPortalScreen.tsx:1369-1395, 1437-1561, 1573-1783, 1829-2110` | Nhánh `!vaoM3` (~650 dòng giao diện cũ: đầu sheet, Xem điểm, BTVN, Bài gia đình giao). Ở `/hs` `dungM3()` luôn đúng (`vai-tro.ts:139`) ⇒ KHÔNG em nào thấy; chỉ còn sống với tab game (đầu sheet) | C3, C11 | BỎ 3 nhánh nội dung cũ + rút gọn đầu sheet; giữ đường M3 | test jsdom chạy ở `/` (dungM3 = false) có thể đang đi nhánh cũ ⇒ chuyển test CÓ CHỦ Ý trước khi bỏ |
| H4 | HS + PH · đầu sheet · `StudentPortalScreen.tsx:1357-1366`, `ParentPortalScreen.tsx:708-727` | "Quay lại Bảng tin" và "Đóng" cùng làm MỘT việc; màn chính tên "Bảng nhiệm vụ", còn "Bảng tin" lại là tên một sheet khác | C4, C11, A1.3 | BỎ nút Đóng; ĐỔI CHỮ "Về bảng nhiệm vụ" | `vo-sheet-m3-1909` khoá "Quay lại Bảng tin" |
| H5 | HS · đăng nhập · `StudentPortalScreen.tsx:1225-1280` | Màn đăng nhập in công khai mật khẩu mặc định sau khi đặt lại (dòng 1275); ô SBD `type="text"` không bật bàn phím số; "..." | B13, C9 + an toàn | ĐỔI CHỮ "Quên mật khẩu: nhắn thầy để đặt lại"; THÊM `inputMode="numeric"` | luật đăng nhập ⇒ Boss quyết; nhiều test dùng giá trị mặc định |
| H6 | HS · Khắc phục · `StudentPortalScreen.tsx:2111-2127`, `KhoiKhacPhuc3CheDo.tsx:944` | Một màn hai cột: "Luyện đề chuẩn" + "4 CHẾ ĐỘ KHẮC PHỤC CÂU SAI" ⇒ 5 lựa chọn trước khi làm được câu nào; tên tệp "3 chế độ", chữ "4 chế độ", menu ghi "Khắc phục lỗi sai" | C5, C2, A1.3 | GỘP: mở sẵn chế độ 1 (câu sai từ ca đã kiểm tra), các cách khác sau "Cách chọn câu khác…" | `m3-b-1909` khoá "4 CHẾ ĐỘ"; kênh rút tự động vẫn cấm tự luận |
| H7 | game · `Game.tsx:20-21,109` | Tab "Game mới · Sắp ra mắt" không có chức năng, chỉ một đoạn chữ | C3, C5 | BỎ tab | `doan-cua-vao.test.tsx` |
| H8 | game · Sảnh Đoàn · `DoanSanh.tsx:117-124` | Các thẻ ổ khoá "SẮP MỞ" cho tính năng chưa có | C3, C5 | BỎ (hoặc 1 dòng chữ phụ) | `doan-giao-dien`, `dao-so-tay`, `dao-cua-em` |
| H9 | game · `Game.tsx:98` | Dòng "Nguồn: <mã tờ đề> · <qid>" lộ mã nội bộ cho học sinh | A1.4 | BỎ hai mã, giữ mức độ + số sao | — |
| H10 | game · `Game.tsx:108` | "mỗi ngày một **chặng** 5–6 phút" — "chặng" dành riêng cho BTVN | A2 | ĐỔI CHỮ "một chuyến hộ tống" | — |
| H11 | game · `DoanSanh.tsx:113` | Màu `rgb(...)` viết thẳng trong mã (lọt `check:mau` vì chỉ bắt hex) | B8 | ĐỔI sang token | — |
| H12 | game · `Game.tsx:87` | Mất phiên game ⇒ hỏi lại mật khẩu học sinh ngay trong game | C8 | CHỈ GHI NHẬN — thuộc xác thực, Boss + Code 3 quyết | — |
| H13 | PH · giao bài · `muc-menu.tsx:31-41`, `BangNhiemVu.tsx:474`, `BangTinPhuHuynh.tsx:243-418` | BỐN đường cùng giao bài: ô "Giao bài cho con" trên bảng · menu "Giao bài khắc phục cho con" · 2 mục "Giao nhanh: …" · các cách trong Bảng tin | C4, C6 | GỘP: giữ ô trên bảng (đường chính) + MỘT mục menu; BỎ 2 mục "Giao nhanh" | không test khoá "Giao nhanh:" |
| H14 | PH · sheet điểm · `ParentPortalScreen.tsx:705-728,751-763` | Tiêu đề lặp 2 lần (đầu sheet + h2 ngay dưới), Viết Hoa Từng Chữ, đầu sheet kiểu cũ (học sinh đã dùng `ThanhTren` M3) | C3, C4, C11 | BỎ h2 lặp; dùng `ThanhTren`; chữ thường | màn xem điểm đang làm lại v2 ⇒ làm cùng đợt, không đề nghị bố cục |
| H15 | PH · đăng nhập · `ParentPortalScreen.tsx:607-623` | Ô SBD không bàn phím số, nhãn không gắn `htmlFor`, dòng chú thích lặp lại đúng ý của nhãn | B13, C3 | THÊM `inputMode`, gắn nhãn; BỎ dòng chú thích lặp | — |
| H16 | HS · vào ca · `StudentPortalScreen.tsx:2138` | Đóng phòng vào ca ⇒ nhảy sang "Xem điểm" thay vì về bảng nhiệm vụ | C6 | ĐỔI `onClose` về bảng | đường vào ca ⇒ Boss soát trước |
| H17 | 3 app · `index.html:54` | `user-scalable=no, maximum-scale=1` chặn phóng to chữ | B11, C12 | BỎ hai thuộc tính | màn kiểm tra thật dùng chung `index.html` ⇒ Boss soát |
| H18 | HS · `StudentPortalScreen.tsx:474,476` | Emoji trong chuỗi + giờ 12 tiếng (soi tĩnh G09, G11) | B7, A1.6 | ĐỔI theo gợi ý của bộ soi | — |

---

## LÔ MÃ CHẾT (không ai nhập — đã Grep cả `lazy(() => import(`); chia theo chủ làn trong `DIEU-PHOI.md`

| # | cụm | tệp (số dòng) | bằng chứng | đề nghị | rủi ro + test khoá |
|---|---|---|---|---|---|
| D1 | Game thần thú ĐỜI CŨ | `components/ThanThuHoaHocGame.tsx` (2507) · chỉ nó nhập: `DauTruongChanLy` (614), `ThanThu3D` (366), `KhungLoiGiaiGame` (185), `OngNghiemExp` (139), `PopupThuongExp` (127), `CauHoiTrongGame` (99) · phần lớn `src/game/than-thu-hoa-hoc/` (7563 dòng) | `StudentPortalScreen.tsx:70` nạp `game/than-thu-v2/Game` dưới tên biến cũ; tệp cũ 0 nơi nhập. CÒN SỐNG trong thư mục cũ: `kinh-nghiem` (dao-core), `he-thong-pet`, `hinh-thai`, `ve-than-thu`, `canh-3d-chung` (qua `lib/anh-than-thu.ts`) | BỎ cụm cũ, giữ 5 tệp còn sống + phụ thuộc của chúng | ≥ 15 tệp test `than-thu-*` đọc tệp cũ; `git status` cho thấy tệp chết VẪN ĐANG ĐƯỢC SỬA (tốn công vô ích) ⇒ Boss báo các phiên ngừng sửa |
| D2 | Màn chấm phiếu giấy đời đầu | `ScanScreen` (208), `ResultsScreen` (86), `AnswerKeyScreen` (69), `PrintSheetScreen` (108) + `lib/print-sheet`, `lib/json-export`, `lib/answerkey-parse`, `hooks/useScanWorker`, `workers/scan.worker` | không có trong `ScreenId`, 0 nơi nhập, 0 test | BỎ; kéo theo gỡ được gói `@techstark/opencv-js` + `jspdf` (chỉ cụm này dùng). `xlsx` còn sống qua `danh-sach-hs` | thấp |
| D3 | Nhắn tin / trợ lý cũ | `MessagesFab` (505), `BongBongChatHocSinh` (755), `BongBongChatPhuHuynh` (307), `KhoiTroLy` (216, chỉ MessagesFab nhập) + `lib/tro-ly/*` | 0 nơi nhập | BỎ sau khi Boss xác nhận "Học sinh hỏi" đã thay hẳn | `dem-tin-moi`, `tro-ly` test |
| D4 | Lẻ | `CardCaThiGanNhat` (137), `KhoiLuyenKhacPhuc` (266), `NutTaiDeCa` (235), `KhoiGoiLenBang` (167, Code 1), `LogoDDH` (6), `game/than-thu-v2/Spirit3D` (52) | 0 nơi nhập | BỎ | mỗi tệp 1–3 test (`luyen-khac-phuc`, `tai-de-ca-so-cau`, `khoi-goi-len-bang`, `logo-bo-moi-1909`) |
| D5 | Màn mồ côi | `ClassListScreen` (259) — xem G13 | có nhập nhưng không có đường vào | xem G13 | — |

---

## (1) MƯỜI VIỆC ĐÁNG LÀM NHẤT (xếp theo lợi ích cho người dùng)

1. **H1** — đưa "việc hôm nay" của em lên ngay dưới thanh tiến độ; Bộ não + EXP xuống dưới.
2. **H2 + H4** — học sinh chỉ còn MỘT bảng: bỏ "Bảng tin" thứ hai và lưới 6 ô trùng menu; một nút "Về bảng nhiệm vụ".
3. **G2** — nối huy hiệu số câu em hỏi để thầy thấy ngay có em đang chờ trả lời.
4. **G4 + G5** — cài đặt chỉ ở MỘT nơi (màn Cài đặt); sửa 10 câu báo lỗi đang chỉ sai đường.
5. **G3 + G6** — bỏ nút "Kiểm tra" lạc nghĩa; mỗi màn một tên thống nhất (thanh bên = tiêu đề = câu báo lỗi).
6. **H13** — phụ huynh giao bài bằng MỘT đường chính thay vì bốn.
7. **H6** — Khắc phục: mở sẵn cách thông dụng nhất, các cách khác gập lại.
8. **H3 + D1** — dọn ~650 dòng giao diện cũ trong cổng học sinh và ~11 000 dòng game đời cũ (đang có phiên sửa nhầm tệp chết).
9. **H7 + H8 + H9 + G8 + G12** — bỏ "Sắp ra mắt", "SẮP MỞ", mã nội bộ, khối hướng dẫn, chip trang trí.
10. **H5 + H17 + G9** — không in mật khẩu mặc định ra màn; cho phóng to chữ; thay `confirm()` bằng hộp thoại nói rõ việc.

## (2) ĐỀ XUẤT SẮP XẾP LẠI ĐIỀU HƯỚNG

**Giáo viên (hiện 8 mục + nút Mở ca)** → 5 mục chính + Cài đặt ở đáy:
`Hôm nay` · `Học sinh` · `Ca kiểm tra` (danh sách ca; Mở ca + Theo dõi ca là màn con — đã đúng) · `Bài tập` (Giao bài tập về nhà) · `Lên lớp` (Gọi lên bảng) — đáy: `Cài đặt`.
- `Ngân hàng đề` DỜI thành mục phụ (nhóm "Kho" dưới đường kẻ, hoặc lối vào từ Mở ca / Giao bài nơi thầy chọn đề) — dùng theo đợt, không hằng ngày.
- `Học sinh hỏi` GỘP thành thẻ có huy hiệu trên Hôm nay v3 + giữ một mục phụ; chỉ làm SAU khi G2 có số thật.
- Nút "Mở ca kiểm tra" giữ nguyên (đường vào ca — C-RÀO). Thanh đáy điện thoại giữ 4 + Thêm.

**Học sinh (menu ba chấm 7 mục)** → 5 mục: `Bài tập về nhà` · `Xem điểm` · `Khắc phục câu sai` · `Bài gia đình giao` · `Thần thú` — kẻ dưới: `Đăng xuất`. Bỏ `Bảng tin & bài luyện hôm nay` (H2). Nút nổi "Vào thi" giữ nguyên.

**Phụ huynh (menu 5 mục + Đổi SBD)** → 3 mục: `Xem điểm của con` · `Giao bài cho con` · `Bảng tin của con` — kẻ dưới: `Đổi số báo danh`. Bỏ 2 mục "Giao nhanh" (H13).

**Game**: `Đảo thần thú` · `Đoàn Hộ Tống` · `Võ đài thứ Bảy` · `Tiến bộ của em` (bỏ tab "Sắp ra mắt" — H7). Nút "Về app học sinh" giữ nguyên (C-RÀO).

## (3) NGHI DƯ THỪA NHƯNG THUỘC C-RÀO ⇒ KHÔNG ĐỀ NGHỊ BỎ

- `StudentPortalScreen.tsx:2142-2206` — form vào ca kiểu cũ (nhánh `!vaoM3`, thực tế không ai thấy). Là ĐƯỜNG VÀO CA ⇒ để Boss quyết riêng, không gộp vào H3.
- Ba đường mở ca ở app thầy (nút thanh bên, nút nổi thanh đáy, nút ở trạng thái rỗng `LichSuCaScreen:396`) — đường vào ca, giữ.
- `ExamMonitorScreen.tsx:1935` — xoá ca bắt gõ lại mã ca (chạm C8 "không bắt gõ lại thứ máy đã biết") — là chốt an toàn cho việc xoá dữ liệu thật, giữ.
- Bậc KHẨN có đồng hồ đếm lùi trên bảng nhiệm vụ (chạm C14) — gắn với thông tin HẠN NỘP và bản vẽ thầy duyệt ⇒ giữ; nếu muốn dịu hơn thì chỉ đổi cách trình bày, do thầy lệnh.
- Mọi khối "thầy chốt <ngày>" trong Theo dõi ca, Mở ca (phòng chờ, giữ để đọc, đồng bộ giờ, hạn vào phòng, hai link gửi em), Gọi lên bảng.
- `KhoaMayThayScreen`, `KhoaAppScreen` (cổng mã bí mật, mật khẩu mở app) — không soát, không đụng.
- Nút "Về app học sinh" (`Game.tsx:85`, `DaoThanThu.tsx:85`) và `onVeBangNhiemVu` của Đoàn.
- `Game.tsx:21` — khi cờ `doanMo` tắt, tab vẫn tên "Hộ Tống Linh Tâm" (lệch A2) — test khoá "y hệt trước khi có Đoàn" ⇒ chỉ đổi khi Boss lệnh.

## MÀN CHƯA SOÁT TỚI (nói thật)

- KHÔNG soát theo lệnh: `ExamTakeScreen`, `ThanhTrenThiM3`, `ThongBaoThiM3`, `DaiCauChuaLamM3`, `PhongChoGame`.
- Chỉ ghi nhận, không đọc bố cục: `HomNayScreen` (v3), `BaoCaoCaThi*Modal`, `LichSuCaM3`, `BieuDoTienBoGoogle`, `TheTienBo` (xem điểm v2).
- Mới lướt tiêu đề + chú thích khối, CHƯA đọc từng dòng: `ExamMonitorScreen` (2033), `GoiLenBangScreen` (2456), `ExamSetupScreen` phần 4 hộp chọn, `PhanCongScreen` phần bảng theo dõi, `ToanCanhEmScreen`, `CauHoiScreen`, `LichSuCaScreen` phần thẻ ca.
- CHƯA mở: `PhieuScreen`, `PhieuV3`, `KhungXemPhieu`, `html-phieu.ts`; `LamCauOn`, `BtvnM3`, `MomM3`, `TheBoNao`, `TheVinhDanh`, `ThongBaoHocSinh`, `LuyenDeChuan`, `InfographicHuongDan`; game: `dao/*` (Đảo, Thám hiểm, Sổ tay, Túi đồ), `DoanTran`, `DoanKetChang`, `EscortRoom`, `ProgressChart`, `Reports`.
- ~85/104 tệp `src/components/` mới chỉ kiểm "có ai nhập không", chưa soi nội dung. Mã chết trong `src/lib/` và tệp CSS mồ côi chưa quét.
- Chưa soi chữ do MÁY CHỦ sinh (ghi chú EXP, lý do, cảnh báo) ⇒ Lô máy chủ (Code 3) hiện 0 phát hiện, KHÔNG có nghĩa là sạch.
- Chưa chạy app thật / chưa chụp ảnh: mọi nhận định "dưới màn đầu 390 px" suy từ mã, cần ảnh Chromium xác nhận trước khi sửa (B10).

- **ĐÃ DỌN (Code 1, 21/09 11:3x):** **D4** — xoá `KhoiGoiLenBang.tsx` + `tests/khoi-goi-len-bang.test.tsx` (0 nơi nhập; mọi `lazy(() => import(…))` trong `src/` chỉ trỏ `screens/`; `tests/cua-vao-ca.test.ts:78` chỉ khẳng định KHÔNG chứa tên ấy nên giữ). **G3** — bỏ nút "Kiểm tra" ở `GoiLenBangScreen` (mục cấp 1 đã có thanh điều hướng) cùng import `NutQuayLai` và biến `setScreen` thừa. **G5** — `GoiLenBangScreen:360` nay ghi "vào Ngân hàng đề → Cấu hình (1 lần)" (đúng hiện trạng: G4 CHƯA vào, khối Cấu hình còn ở `NganHangDeScreen:606`); Code 4 sẽ nhắn mã commit G4 rồi đổi MỘT lượt cả 10 câu sang "vào Cài đặt → Kết nối máy chủ". Kiểm: 32 tệp test nhắc tới màn/thành phần này, 625/625 xanh.
- **Mã chết MỚI LỘ RA sau D4 (chưa xoá, chờ Boss):** `src/lib/phan-cau-len-bang.ts` — `dungDuLieuTuCa`, `nhacHieuNhamChung`, `phanCauLenBang`, `tiLeDungLop` nay 0 nơi nhập trong `src/` (chỉ còn test của chính chúng); `bangChu` vẫn được dùng.
- **ĐÃ DỌN (Code 4, 21/09 13:0x):** **G3** (phần của tôi, 8d42b72) — bỏ nút quay lại ghi "Kiểm tra" ở `LichSuCaScreen` + `NganHangDeScreen` (mục cấp 1 đã có thanh điều hướng; bỏ biến `setScreen` không còn dùng ở Ngân hàng đề); ở `ExamSetupScreen` (Mở ca) đổi chữ thành "Ca kiểm tra" và trỏ về `lichsuca`. Không test khoá chuỗi cũ; nhóm 34 tệp liên quan chỉ đỏ nền. Còn lại của lô GV: G2, G4, G5, G9, D2, D3, D4-phần-tôi.
- **ĐÃ DỌN (Code 4, 21/09 13:4x):** **G9** (phần tôi) — `HocSinhScreen`: bỏ `confirm()` đặt lại mật khẩu và `prompt()` gõ SBD khi xoá em, thay bằng hộp M3 dùng chung `components/HopXacNhan.tsx` (nút mang tên việc "Đặt lại mật khẩu" / "Xoá khỏi danh sách", Huỷ an toàn, Esc/nền = Huỷ, Tab quay vòng, gõ đúng SBD mới bật nút xoá). KHÔNG còn in mật khẩu mặc định ở nút, dòng chú thích, hộp, thông báo (đổi "Reset mật khẩu (12121212)" → "Đặt lại mật khẩu", cũng là phần G10 về chữ). Chỗ còn lại của G9: `KhoiKhacPhuc3CheDo.tsx:762` ("Xoá bài luyện này khỏi lịch sử?") là tệp của Code 2 (do màn học sinh/phụ huynh dùng) — chưa sửa; `HopXacNhan` dùng lại được. Sửa luôn 2 test đỏ nền của tôi (`tim-thay-giao-bai-tap`: chữ cũ 'ba thẻ' và 'Mỗi em có hai nút'). Tab "Mức độ tiến bộ (Lịch sử ca kiểm tra)" (G10) chưa đổi.
- **ĐÃ DỌN (Code 4, 21/09 14:0x):** **G2** — gỡ huy hiệu "số câu em hỏi" của mục Học sinh hỏi (`ThanhBenTrai`, `BottomNav`, 3 luật CSS `.ben-trai-huy-hieu` ở `vo-thay.css`): App không bao giờ truyền số, và máy chủ CHƯA có lệnh đếm nhẹ (`danhSachCauHoi` trả mọi dòng — quá nặng để gọi ở vỏ app). Muốn có huy hiệu thật ⇒ cần Code 3 thêm lệnh đếm câu chưa chữa (chỉ-thêm) rồi nối lại. Sửa test `vo-thay-m3-2109` + test đỏ nền của tôi `man-hoc-sinh-hoi` (ExamHub không còn ô lối tắt từ bảng tin bản 3).
- **ĐÃ DỌN (Code 4, 21/09 14:1x):** **G4** — DỜI nguyên khối "Cấu hình (1 lần)" (ô địa chỉ máy chủ + mã bí mật kho đề + Lưu) từ cuối `NganHangDeScreen` sang `CaiDatScreen` → mục "Kết nối máy chủ" (tệp mới `components/KhoiKetNoiKhoDe.tsx`; hai khối `KhoiMayChuMoi` + `KhoiMatKhauApp` vốn đã có ở Cài đặt nên bỏ bản trùng ở Ngân hàng đề). Nút "Lưu & đồng bộ" → "Lưu" (Ngân hàng đề tự đồng bộ mỗi lần mở). Ngân hàng đề thiếu kết nối ⇒ thông báo + MỘT nút "Mở Cài đặt" (thay cho khối tự bung). ĐỔI 3 câu toast của chính màn ấy sang "vào Cài đặt → Kết nối máy chủ". Chạm ô mã bí mật kho đề ⇒ Boss soát. Sửa luôn test đỏ nền `duyet-hang-loat`. Tiếp G5: đổi 10 câu báo lỗi ở màn khác.
- **ĐÃ DỌN (Code 4, 21/09 14:2x):** **D2a** — xoá `ScanScreen`, `ResultsScreen`, `AnswerKeyScreen`, `PrintSheetScreen`, `hooks/useScanWorker.ts`, `workers/scan.worker.ts` (chấm phiếu giấy đời đầu: không có trong `ScreenId`, 0 nơi nhập trong `src/`, `tsc -b` sạch sau khi xoá). **D2b** (3 lib + 2 test) ở dòng kế. Chưa gỡ gói `@techstark/opencv-js` + `jspdf` khỏi package.json (đổi package-lock/node_modules dùng chung — chờ Boss cho phép).
- **ĐÃ DỌN (Code 4, 21/09 14:3x):** **D2b** — xoá `lib/print-sheet.ts`, `lib/json-export.ts`, `lib/answerkey-parse.ts` + `tests/export.test.ts`, `tests/answerkey-parse.test.ts` (chỉ cụm D2 nhập; `tsc -b` sạch). **Mã chết MỚI LỘ RA sau D2 (chưa xoá, chờ Boss):** `assets/fonts/roboto-vn.ts` (73 KB, 0 nơi nhập), `lib/xlsx-export.ts` (0 nơi nhập), `engine/quality-gate.ts` + `engine/geometry.ts` (0 nơi nhập trong `src/`; `engine/reader`, `sampling`, `template` chỉ còn test/fixture chạm); gói `@techstark/opencv-js` + `jspdf` (package.json — đổi package-lock/node_modules dùng chung nên chờ Boss cho phép). TẠM DỪNG lô dọn (lệnh Boss 14:3x): còn D3, D4-phần-tôi, G5, G10.
