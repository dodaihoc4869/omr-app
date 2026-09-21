# RÀ SOÁT TỪ NGỮ · Code 2 (học sinh + phụ huynh + game) — 21/09/2026, CHỜ BOSS DUYỆT, CHƯA ĐỔI CHỮ NÀO
Theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` mục A3. Ba lượt rà chỉ-đọc (bảng nhiệm vụ + phiếu HS: 40 mục · game Đảo/Đoàn/Võ đài: 35 mục · phụ huynh: 29 mục = **104 mục**). Mã mục: `H` = học sinh, `G` = game, `P` = phụ huynh. "Test khoá" = tệp trong `tests/` có chứa đúng chuỗi cũ (khớp theo chuỗi, sẽ sửa CÓ CHỦ Ý cùng commit đổi chữ). Aria-label đang bị khoá thì GIỮ, chỉ đổi chữ nhìn thấy.

**Đã sửa xong (không phải chữ):** nút nổi "Vào thi" đè nút "Làm …" của thẻ LÀM NGAY ở 390 — `b983048`: nút nổi tự nhường (mờ + không bấm trúng) khi sắp che nút chính, hết đè thì hiện lại; ảnh trước/sau `docs/anh-bang-nhiem-vu-2109/fab-590-*.jpg`.

**Ca "Mập Địch 100" = G1:** `dao/ThamHiem.tsx:57` vẽ `{biệt danh} {hp}` — biệt danh đứng sát con số, không nhãn, không đơn vị (luật 1, 2).

## A. Game (Đảo thần thú · Đoàn Hộ Tống · Võ đài)
| # | Màn | Chữ hiện tại | Luật | Chữ đề nghị | Tệp:dòng | Test khoá |
|---|---|---|---|---|---|---|
| G1 | Đảo · thám hiểm · thanh máu thú | "Mập Địch 100" | 1,2 | "Thần thú của em: Mập Địch" + "Máu 100/100" | dao/ThamHiem.tsx:57 | aria "Máu của Lửa Nhỏ" (dao-tham-hiem:54) GIỮ; chữ hiện ra không khoá |
| G2 | Đảo · thanh máu quái | "Quái Sương Mù · 100/100" | 1 | "Quái Sương Mù · Máu 100/100" | dao/ThamHiem.tsx:51 | aria `Máu ${TEN_QUAI}` (dao-tham-hiem:40) GIỮ |
| G3 | Đảo · số nổi | "−20", "+10" | 1 | thêm chữ "máu" kế bên | dao/ThamHiem.tsx:55-56 | `.dao-san-so`=`−N` (dao-tham-hiem:49) GIỮ phần tử |
| G4 | Đoàn · thanh máu Linh Tâm | "Linh Tâm 80" | 1,2 | "Máu Linh Tâm 80/100" | DoanTran.tsx:71,87 | không |
| G5 | Đoàn · kỹ năng | "kỹ năng · 1/2 NL" | 1,4 | "Năng lượng 1/2" | DoanTran.tsx:179 | doan-giao-dien:115,123,125 |
| G6 | Đoàn · từng chương | "Linh Tâm −20 · +5 → 75" | 1 | "Linh Tâm mất 20 máu, hồi 5 máu, còn 75 máu" | DoanTungChuong.tsx:77 | không |
| G7 | Đoàn · chắn | "khiên 30", nút "Chắn" | 1,3 | "+30 giáp cho Linh Tâm" | DoanTran.tsx:178; DoanTungChuong.tsx:39,43 | doan-giao-dien:129 (`/^Chắn/`), :221 — GIỮ hai chuỗi này |
| G8 | Võ đài · thẻ người chơi | "100 HP · 20 giáp" cạnh biệt danh | 1,2 | "Máu 100 · Giáp 20" | EscortRoom.tsx:61 | không |
| G9 | Võ đài · đồng hồ | "45s" | 2 | "còn 45 giây" | EscortRoom.tsx:63 | không |
| G10 | Võ đài · nút hành động | "Thực hiện"; số "2" nhỏ | 1,5 | "Đi ô này" / "Dùng chiêu này"; "2 năng lượng" | EscortRoom.tsx:65 | escort-context-menu:18 aria "Xác nhận Di chuyển" GIỮ |
| G11 | Võ đài | "Cập nhật" | 5 | "Tải lại phòng" | EscortRoom.tsx:60 | không |
| G12 | Võ đài | "PvP", "Nhập mã LT…", "Boss" | 2,4 | "Đấu đội", "Nhập mã phòng", "Quái trùm" | EscortRoom.tsx:59 | không |
| G13 | Võ đài · Đoàn tiếp sức | emoji sách, emoji kiếm | 6 | bỏ; biểu tượng SVG kèm chữ | EscortRoom.tsx:55,59; DoanTiepSuc.tsx:6 | không |
| G14 | Võ đài · hướng dẫn | "Hồi 25 HP", "100 HP cho mọi thú" | 2 | "Máu" | EscortGuide.tsx:5,11,13 | không (bị mock) |
| G15 | Võ đài | "tinh thể" và "Linh Tâm" (cùng một vật) | 3 | thống nhất "Linh Tâm" | EscortGuide.tsx:9,11,13; EscortRoom.tsx:52 | escort-core.test chỉ khoá chuỗi lỗi ở escort-core.ts:21 |
| G16 | Cửa vào game | "Hộ Tống Linh Tâm" / "Võ đài thứ Bảy" / "Đoàn Hộ Tống" | 3 | một tên cho mỗi trò (**Boss chốt**) | Game.tsx:21; EscortRoom.tsx:52 | doan-cua-vao:35,74 |
| G17 | Đoàn · sảnh | emoji vé + "2", emoji lửa + "5" | 1,6 | "Vé hộ tống: 2", "Chuỗi 5 ngày" | DoanSanh.tsx:35-36 | aria-label (doan-giao-dien:71) GIỮ |
| G18 | Đảo · chip | "5 ngày" chỉ biểu tượng lửa | 1 | "Chuỗi 5 ngày" | dao/DaoCuaEm.tsx:41 | không khoá chữ |
| G19 | Đảo · thưởng | "+40" trơn | 1 | "+40 EXP" | dao/ThamHiem.tsx:85 | dao-tham-hiem:73 khoá `<b>`="+40" — thêm "EXP" NGOÀI `<b>` |
| G20 | Lý do thưởng | "+40 · đúng lại…" | 1 | đổi chữ hiển thị | ly-do-thuong.ts:8-10 | dao-tham-hiem:71,91; dao-cua-em:62-66; dao-than-thu-vo:48 |
| G21 | Khiên | emoji sao/khiên, "Khiên chống đuổi" | 6,3,4 | bỏ emoji; "Khiên" + dòng phụ nói đúng tác dụng (**Boss chốt tên**) | ImmortalShield.tsx:16; dao/TuiDo.tsx:17 | dao-cua-em:114-119; dao-than-thu-vo:95; than-thu-v2:93 |
| G22 | Chọn thú | "Chọn bạn đồng hành", "Đặt tên cho bạn ấy" | 3 | "Chọn thần thú", "Đặt tên cho thần thú" | dao/ChonBanDongHanh.tsx:44,59 | dao-chon-ban-dong-hanh:23,36; dao-than-thu-vo:30 |
| G23 | Ôn lại trong game | "tới hạn ôn", "hạn ôn" | 3 | "đến lịch ôn lại" | dao-core.ts:14,57; dao/SoTay.tsx:21; doan-kieu.ts:44; DoanKetChang.tsx:47; dao/DaoCuaEm.tsx:61 | dao-cua-em:54; dao-so-tay:40; doan-giao-dien:109 (DaoCuaEm:61, DoanKetChang:47 không khoá) |
| G24 | Đảo · mức độ | "Nhận biết / Thông hiểu / Vận dụng" | 3 | "Biết / Hiểu / Vận dụng" (A2; **Boss xác nhận áp mọi nơi**) | dao/ThamHiem.tsx:27 | không khoá ở dao-*; màn khác khoá "Nhận biết" |
| G25 | Đảo · thanh dưới | "Đoàn" | 3 | "Đoàn Hộ Tống" | dao/DaoThanThu.tsx:79 | dao-than-thu-vo:40 |
| G26 | Đoàn · sảnh | "xong một lô bài tập đúng nhịp nhận 1 vé" | 3 | "xong một chặng Bài tập về nhà đúng kế hoạch nhận 1 vé" | DoanSanh.tsx:83 | chỉ khoá `/Làm xong nhiệm vụ hôm nay để nhận 2 vé/` (doan-giao-dien:90) |
| G27 | Đoàn · sảnh | nút "Vào" | 5 | "Vào đoàn" | DoanSanh.tsx:137 | doan-giao-dien:51 (name 'Vào') |
| G28 | Đoàn · trùm | nút "Chốt" | 5 | "Chốt ý này" | DoanTran.tsx:140 | doan-giao-dien:184 |
| G29 | Đoàn · ghế máy | "Bạn đồng hành" | 3 | "Bạn máy" | DoanSanh.tsx:122; doan-core.ts:170; DoanTran.tsx:195 | doan-giao-dien:83 (aria) |
| G30 | Đoàn · kết chặng | "câu lên bậc ôn" | 3,4 | "câu sang ngày ôn kế" | DoanKetChang.tsx:42 | doan-giao-dien:230,242 |
| G31 | Đoàn · giờ hẹn | "Chủ nhật 20:00" | 6 | "20:00 · Chủ nhật" | DoanSanh.tsx:12,100 | doan-giao-dien:75; doan-mua |
| G32 | Đoàn/Đảo · đơn vị | hiệp / lượt / ải / chuyến / chặng lẫn lộn | 3 | **Boss thêm vào A2** rồi mới đổi | DoanTran.tsx:31,63; EscortRoom.tsx:63; dao-core.ts:11-16 | doan-giao-dien:221; dao-than-thu-vo ("Ải 1") |
| G33 | Game (tab cũ, không tới được) | "Nguồn: {maDe} · {qid}" | 4 | xoá | Game.tsx:98 | không |
| G34 | Trận học cũ (không tới được) | emoji loa, "{tên} · Cấp N", "100/100 HP", "+10 HP hồi phục" | 1,2,6 | như G1/G2, bỏ emoji | LearningBattle.tsx:19,20,26,29 | không khoá chữ |
| G35 | Báo cáo game (PH) | ngày `toLocaleDateString('vi-VN')` | 6 | "Thứ Năm 24/09/2026" | Reports.tsx:8 | không |

## B. Học sinh — Bảng nhiệm vụ, Bài tập về nhà, Ca kiểm tra, Phiếu làm bài
| # | Màn | Chữ hiện tại | Luật | Chữ đề nghị | Tệp:dòng | Test khoá |
|---|---|---|---|---|---|---|
| H1 | Bảng · đầu trang | "{biệt danh} · Cấp 5" | 1,2 | "Thần thú của em: {biệt danh} · Cấp 5" | DauTrang.tsx:93 | bang-nhiem-vu-1909; bang-nhiem-vu-may-chu-1909; giao-dien-to-chieu-1909 |
| H2 | Bảng · thẻ Làm ngay | "{tên BTVN}: Lô 2/5" | 3 | "Bài tập về nhà · Chặng 2 trong 5 chặng" (đổi cả regex `docTienDoLo`) | nhiem-vu-adapter.ts:485 (+:186) | nhiem-vu-adapter-1909; nhiem-vu-ca-nhan-2109; bang-nhiem-vu-1909; vong-2-han-mem |
| H3 | Bảng · nút | "Làm Lô 2" | 3,5 | "Làm chặng 2" | adapter:507 | ke-hoach-giao-dien; nhiem-vu-ca-nhan-2109; bang-nhiem-vu-1909 |
| H4 | Bảng · vạch tiến độ | aria "Lô 1 trên 3" (nhánh không phải chặng) | 3 | "Chặng 1 trong 3 chặng" | TheLamNgay.tsx:9 | nhiem-vu-ca-nhan-2109:78 |
| H5 | Bảng · việc | "Đã xong mọi lô — bấm nộp bài trước hạn"; "Lô BTVN" | 3 | "Đã xong mọi chặng — bấm Nộp bài trước Hạn nộp"; "Chặng bài tập về nhà" | adapter:545,660 | không |
| H6 | Bảng · việc | "Ôn trước ca thi" | 3 | "Ôn trước ca kiểm tra" | adapter:663 | bang-nhiem-vu-may-chu-1909 |
| H7 | Bảng · tên việc | dự phòng "BTVN" trơn hoặc `tieuDe` (có thể là mã tờ đề) | 4 | "Bài tập về nhà"; bỏ dự phòng `tieuDe` | adapter:485,489,611 | không |
| H8 | Bảng/BTVN/menu | 4 tên một khái niệm: "Bài của Mom giao / Bài Mẹ giao / Bài gia đình giao / Làm bài của Mom" | 3 | MỘT tên (**Boss chốt**, đề nghị "Bài gia đình giao") | adapter:281,492,511,586,608; DanhSachNhiemVu:195; muc-menu:16; MomM3:54 | nhiem-vu-adapter-1909; bang-nhiem-vu-1909; mom-m3-1909; vo-sheet-m3-1909; tro-ly-ca-nhan |
| H9 | Bảng · đếm lùi khẩn | "1:23:45" trần (chữ "Còn" chỉ ở aria) | 1 | "Còn 1:23:45" | DanhSachNhiemVu.tsx:36-38 | không |
| H10 | Bảng · còn lại | "Còn 3h 5p", "Đã quá hạn" không kèm mốc thật | 6 | "Còn 3 giờ 5 phút (tới 23:59 · Thứ Năm 24/09)"; "Đã quá Hạn nộp" | tro-ly-ca-nhan.ts:85 (qua adapter:537,744) | nhiem-vu-adapter-1909; tro-ly-ca-nhan |
| H11 | Bảng · đầu trang | "Thứ Năm, 24/09" | 6 | "Thứ Năm 24/09/2026" | DauTrang.tsx:22-33 | không |
| H12 | Bảng · nút nổi | "Vào thi · ca đang mở" | 3,5 | "Vào ca kiểm tra (đang mở)" | NutVaoThi.tsx:16 | bang-nhiem-vu-may-chu-1909; bang-nhiem-vu-1909 |
| H13 | Bảng · vinh danh | biệt danh đứng riêng cạnh "12,5 điểm"; hạng trần | 1 | "Hạng 1 · Thần thú: {biệt danh} · 12,5 điểm" | TheVinhDanh.tsx:60-72 | không |
| H14 | Ôn lại | "Đã chấm 3 · đúng 2"; "lên bậc 2 · tụt bậc 0" | 1,7 | "Đã chấm 3 câu · đúng 2 câu"; "2 câu lên bậc" (bỏ "tụt bậc") | LamCauOn.tsx:177,213 | lam-cau-on-1909; hom-nay-thay-1909 |
| H15 | BTVN (M3 + bản cũ) | "Chia lô theo ngày/giờ", "LÔ ĐANG MỞ", "LÔ SAU", "Xong các lô…" | 3 | đổi cả cụm sang "chặng"; "CHẶNG ĐANG MỞ" | BtvnM3.tsx:61,63,74-88,121 (+Portal:1570-1610,1652) | bang-nhiem-vu-may-chu-1909; btvn-m3-1909; btvn-phan-tang-va-1click; lich-lo-btvn-1909 |
| H16 | BTVN | "bài tập" trơn ("Bài tập ca 123456", "Làm lại bài tập này") | 3,4 | "Bài tập về nhà"; thiếu tên: "Bài tập về nhà (chưa đặt tên)" | BtvnM3.tsx:95,103,118,133,171; Portal:620-654 | btvn-m3-1909 (giữ "Chưa có bài tập về nhà nào"); man-phan-cong-btvn-1209; giao-btvn-tung-hoc-sinh-1309 |
| H17 | BTVN · Lịch sử ca | "#123456", "Ca thi 123456" làm tên | 4 | mã xuống chữ nhỏ "Mã ca 123456" | BtvnM3.tsx:117; LichSuCaM3.tsx:76,79 | không |
| H18 | BTVN · hạn | "Hạn nộp: 23:59 24/09/2026 (giờ Việt Nam)" | 6 | dùng `gioDayDu` (lib/ngay-gio-24.ts:132): "23:59 · Thứ Năm 24/09/2026" | BtvnM3.tsx:34; Portal:157 | btvn-m3-1909 (`nhanHan` khớp `NhanHanBaiTap`, sửa cả cặp) |
| H19 | Bài Mom (bản cũ) | "trước khi hết hạn (deadline)" | 3 | "trước Hạn nộp" | Portal:1796,1866 | mom-m3-1909 |
| H20 | Bài Mom | "Hạn 2 tiếng", "Hạn 2h" (là thời lượng) | 3 | "Thời gian làm: 2 giờ" | MomM3.tsx:54,113,187; Portal:2090 | m3-b-1909; mom-m3-1909 |
| H21 | Bài Mom | "✓ Đã nộp", "⏳ Đang làm" | 8 | biểu tượng lucide (aria-hidden) + chữ | MomM3.tsx:98,100; Portal:2045,2049 | mom-m3-1909 |
| H22 | Lịch sử ca | "Phần I (TN)", "Phần II (Đ/S)", "Phần III (Trả lời)" | 2 | "Phần I · Trắc nghiệm", "Phần II · Đúng–sai", "Phần III · Trả lời ngắn" | LichSuCaM3.tsx:97-105 | lich-su-ca-m3-1909 |
| H23 | Lịch sử ca | "Lịch sử thi", "ca thi", "bài thi chưa được đồng bộ" | 3 | "ca kiểm tra" | LichSuCaM3.tsx:52-66; Portal:1433-1450 | lich-su-ca-m3-1909 |
| H24 | Menu | "Xem điểm & lịch sử ca thi", "Báo cáo điểm các ca thi" | 3 | "…ca kiểm tra" | muc-menu.tsx:14,31; Portal:1278 | lich-su-ca-m3-1909; doan-cua-bang-nhiem-vu-1909; vo-sheet-m3-1909; m3-c9-phu-huynh-1909 |
| H25 | Vào ca (**luồng thi — cần soát của Boss**) | "Vào phòng thi trực tuyến", "Mã ca thi (6 chữ số)", "Vào thi ngay"; lỗi "từ 4 đến 8 chữ số" lệch nhãn "6" | 1,3,5 | "Vào ca kiểm tra trực tuyến", "Mã ca kiểm tra", "Vào ca kiểm tra"; thống nhất số chữ số (chỉ đổi NHÃN, không đổi luật kiểm mã) | VaoThiForm.tsx:33-80; Portal:2147-2183,1093 | vao-thi-form-m3-1909; mat-khau-ca-va-bao-cao |
| H26 | Khắc phục | "Ca thi #123456", "Khắc phục Ca #123456" làm tiêu đề | 3,4 | "Ca kiểm tra: {tên ca}" (mã ở dòng phụ) | Portal:1083; KhoiKhacPhuc3CheDo.tsx:306,550,556,1091 | không |
| H27 | Khắc phục | "ca thi" (7 chỗ), "tick chọn" | 3 | "ca kiểm tra", "chọn" | KhoiKhacPhuc3CheDo.tsx:539-581,1039-1061,1236 | không |
| H28 | Phiếu | "Vòng 1: Lõi Căn Bản", "THUẬT TOÁN 3 VÒNG PHÂN TẦNG", "để nắm chắc nền tảng" | 3,7 | "Câu cốt lõi", "Câu dành riêng cho em", "Câu thử thách (sai không sao)"; bỏ "nắm chắc" | html-phieu.ts:1204-1207,1544-1547,1561-1594 | btvn-thong-minh |
| H29 | Phiếu | "Câu thuộc lô tiếp theo", "Xong lô hôm nay", "Chưa làm / lô sau" | 3 | "chặng" | html-phieu.ts:1320,2818,2922,2937 | btvn-phan-tang-va-1click; phieu-m3-1909 ("Xong lô hôm nay") |
| H30 | Phiếu | emoji ✨ 🔒 | 8 | SVG kèm chữ | html-phieu.ts:1210,1320,1819,3170 | không (m3-b, m3-c8 chỉ cấm ✨ ở tệp khác) |
| H31 | Phiếu · mức độ | "Nhận biết / Thông hiểu / Vận dụng" (TheCuoiChang đã "Biết/Hiểu" ⇒ lệch) | 3 | "Biết · Hiểu · Vận dụng" | html-phieu.ts:1524-1526 | html-phieu; phan-loai-muc-do-1409 |
| H32 | Phiếu · hạn | "Hạn 20:00 · 20/09"; "hạn nộp 20:30 ngày 13/09" | 3,6 | "Hạn nộp: 20:30 · Thứ Bảy 13/09/2026" | html-phieu.ts:3052; btvn-cho-em.ts:139,154,155,247,288 | phieu-m3-1909:89; btvn-cho-em-ca-nhan-2109 |
| H33 | Phiếu · lịch | "(lô 1/3)" | 3 | "(chặng 1 trong 3 chặng)" | btvn-cho-em.ts:154,155 | không |
| H34 | Phiếu nâng đỡ · hạn | "23:59 Thứ Năm 24/09" | 6 | "23:59 · Thứ Năm 24/09/2026" (gọi `gioDayDu`) | btvn-ca-nhan-kieu.ts:192-197 (`hanChu`) | btvn-ca-nhan-em-2109 (498-510); nhiem-vu-ca-nhan-2109:121 |
| H35 | Phiếu nâng đỡ · chip | "Cốt lõi", "Dành riêng cho em", "Thử thách", "Cốt lõi · câu cao" | 3 (A2) | "Câu cốt lõi", "Câu dành riêng cho em", "Câu thử thách (sai không sao)" | btvn-ca-nhan-kieu.ts:114-121 | phieu-ca-nhan-2109; btvn-ca-nhan-em-2109; btvn-cho-em-ca-nhan-2109; btvn-nang-do-thay-2109 |
| H36 | Phiếu nâng đỡ · hero | "hạn 23:59…" | 3,6 | "Hạn nộp: …" | html-phieu-ca-nhan.ts:57 | phieu-ca-nhan-2109 |
| H37 | Phiếu · nộp bài | hộp trình duyệt "Nộp luôn?" (OK/Cancel) + "tính là sai" (LamCauOn lại nói "chưa tính, không coi là sai" ⇒ mâu thuẫn) | 5,7 | hộp riêng "Nộp bài, còn N câu chưa làm" với [Nộp bài] [Làm tiếp] (**Boss chốt**: chạm luồng nộp) | html-phieu.ts:2316 | phieu-m3-1909 (khoá ĐÚNG MỘT `window.confirm`); nop-phieu-khac-phuc |
| H38 | Cổng HS | `confirm`/`alert` của trình duyệt (OK/Hủy) | 5 | hộp riêng có động từ + kết quả | Portal:623-624,1784,1830 | không ("Đã lưu nháp…" ở mom-m3-1909) |
| H39 | Luyện đề | "chưa xin được mã bài tập từ máy chủ" | 4 | "chưa lấy được phiếu từ máy chủ" | KhoiBaiLuyen.tsx:208,371 | ly-do-chi-doc-phai-nam-trong-phieu-0909 |
| H40 | Phiếu · nút | "Hiện đề", "Mở tất cả" | 5 | "Ẩn lời giải", "Mở hết lời giải" | html-phieu.ts:1661-1662 | html-phieu; nop-phieu-khac-phuc; bam-chon-tren-de (sửa sau cùng) |

## C. Phụ huynh
| # | Màn | Chữ hiện tại | Luật | Chữ đề nghị | Tệp:dòng | Test khoá |
|---|---|---|---|---|---|---|
| P1 | Bảng · đầu trang | "Mập Địch · Cấp 3" | 1,2 | "Thần thú của con: Mập Địch · Cấp 3" | bang-nhiem-vu/DauTrang.tsx:93 | (như H1) |
| P2 | Bảng · thẻ | "5 ngày học liên tiếp" / "5 ngày đạt liên tiếp" | 3 | "Chuỗi 5 ngày" | nhiem-vu-adapter.ts:329,644 | nhiem-vu-adapter-1909 |
| P3 | Bảng · ước tính | "90 s mỗi câu · đo 30 ngày" | 4 | "90 giây mỗi câu, trung bình 30 ngày gần đây" | BangNhiemVu.tsx:321 | nhiem-vu-adapter-1909 (chỉ "đo 30 ngày") |
| P4 | Bảng · nhãn mức | "KHẨN" · "BẮT BUỘC HÔM NAY" · "NÊN LÀM" · "TUỲ CHỌN" | 7 | "Sắp đến hạn nộp" · "Bắt buộc hôm nay" · "Nên làm" · "Làm thêm (không bắt buộc)" | nhiem-vu-adapter.ts:33-36 | nhiem-vu-adapter-1909; bang-nhiem-vu-1909 |
| P5 | Bảng · quá hạn | "QUÁ HẠN · 2", "Đã quá hạn — cần Thầy gia hạn" | 3,7 | "Đã qua Hạn nộp · 2 việc", "Đã qua Hạn nộp — nhờ Thầy gia hạn" | DanhSachNhiemVu.tsx:154,171; adapter:611 | bang-nhiem-vu-1909; btvn-cho-lam-lai-2109; btvn-nang-do-may-chu-2109 |
| P6 | Bảng · BTVN | "BTVN: Lô 2/5", "Lô BTVN", "Đã xong mọi lô…" | 3,4 | như H2/H5 | adapter:485,545,660; TheLamNgay.tsx:9 | như H2 |
| P7 | Bảng · còn lại | "Còn 2h 15p", "Còn 3 ngày 5h" | 4,6 | "Còn 2 giờ 15 phút (tới 23:59 Thứ Năm 24/09)" | tro-ly-ca-nhan.ts:93-96 | tro-ly-ca-nhan.test; doan-giao-dien |
| P8 | Bảng | "Con còn 3 bài Mẹ giao cũ chưa làm" | 3 | "…bài gia đình giao (cũ)…" (theo H8) | DanhSachNhiemVu.tsx:196,203 | bang-nhiem-vu-1909; bang-nhiem-vu-may-chu-1909 |
| P9 | Bảng · tiến bộ | "3 câu lên bậc ôn" | 2,4 | "3 câu chuyển sang lịch Ôn lại xa hơn" (dùng chung với Đoàn — **Boss chốt**) | adapter:619,635 | nhiem-vu-adapter-1909; bang-nhiem-vu-1909; bang-nhiem-vu-may-chu-1909; doan-giao-dien; doan-may-chu |
| P10 | Bảng · ngày | "Thứ Năm, 24/09 · Phụ huynh" | 6 | "Thứ Năm 24/09/2026" | DauTrang.tsx:151 | hom-nay-2109 (chỉ mẫu ngày) |
| P11 | Điểm các ca | "Báo Cáo Điểm Tất Cả Các Ca Thi", "3 ca thi", "#12001" | 3,4 | "Điểm các ca kiểm tra của con", "3 ca kiểm tra", bỏ `#mã` (xuống dòng phụ) | ParentPortalScreen.tsx:700,741,744,757,769 | m3-c9-phu-huynh-1909 |
| P12 | Điểm các ca · ngày | "21/9/2026" (`toLocaleDateString`) | 6 | "Thứ Hai 21/09/2026" | ParentPortalScreen.tsx:778 | không |
| P13 | Chọn ca | "Ca thi #12001" / "Ca thi đã chọn" | 3,4 | "Ca kiểm tra: <tên ca>" | ParentPortalScreen.tsx:559 | không |
| P14 | Giao bài | "✨ Đã giao 12 câu… (Thời hạn 2 tiếng)" | 8,3 | bỏ ✨; "Hạn nộp: 2 giờ kể từ lúc con bắt đầu" | ParentPortalScreen.tsx:459,505 | không |
| P15 | Giao bài | "Bài của Mom giao", "…Mẹ giao (n câu trọng tâm)" | 3 | "Bài gia đình giao" (khớp menu) | ParentPortalScreen.tsx:402,455,501 | không |
| P16 | Bảng tin PH | "Điểm ca thi gần nhất", "Bài thi đã nộp hôm nay", "Lịch sử ca thi", "chưa có bài thi mới" | 3 | "Ca kiểm tra gần nhất", "Ca kiểm tra đã nộp hôm nay", "Lịch sử ca kiểm tra", "chưa có bài luyện mới" | BangTinPhuHuynh.tsx:146,158,402,462,624 | m3-c8-bang-tin-1909; "Lịch sử ca thi" còn ở hoc-sinh-m3-2109, hai-nut-moi-em |
| P17 | Bảng tin PH | "Bài Mom", "Bài Mom: 2" | 3 | "Bài gia đình giao" | BangTinPhuHuynh.tsx:519,695 | nhiem-vu-adapter-1909; bang-nhiem-vu-may-chu-1909; parent-news-chon-cau-1909 |
| P18 | Bảng tin PH | "12c Sửa lỗi · 6c Ôn bài cũ · 3c Câu tiến bộ" | 1,4 | "12 câu sửa lỗi · 6 câu ôn lại · 3 câu tiến bộ" | BangTinPhuHuynh.tsx:749-757 | bang-tin-khong-he-3-vong-1909; parent-news-d1-1909 |
| P19 | Bảng tin PH | "Dự đoán đề thi tốt nghiệp (tháng 9) 7–8 đ" | 4,7 | "Điểm ước tính (chỉ để tham khảo) 7–8 điểm" | BangTinPhuHuynh.tsx:660-664 | parent-news.test (chỉ dữ liệu) |
| P20 | Bảng tin PH | "Cảnh báo: 2 bài đang chờ làm" | 7 | "2 bài đang chờ con làm" (để "Cảnh báo" dành cho Cảnh báo của thầy) | BangTinPhuHuynh.tsx:681 | không |
| P21 | Bảng tin PH | "Thuật toán mới", "Cặp đôi Song sinh & tiến trình sư phạm 3 nấc" | 4 | bỏ nhãn; "Bài luyện chọn riêng theo câu con từng sai" | BangTinPhuHuynh.tsx:262-266 | không |
| P22 | Bảng tin PH | "8 hệ", "Leo tháp 8 hệ" | 9,1 | "Thần thú của con", "Con luyện để lên cấp" | BangTinPhuHuynh.tsx:604,612 | không |
| P23 | Báo cáo ca | "Kết quả bài thi của con", "ca thi #12001", "Ca thi này con được…", "bài tập mỗi tối" | 3,4 | "Kết quả ca kiểm tra của con", bỏ `#mã`, "bài gia đình giao" | BaoCaoCaThiPhuHuynhModal.tsx:384,615,251,271 | m3-c-1909 |
| P24 | Hướng dẫn | "Bài của Mom giao", "các ca thi của con" | 3 | "Bài gia đình giao", "ca kiểm tra" | InfographicHuongDan.tsx:111,172,177 | không |
| P25 | Khắc phục (PH xem) | "ca thi", "Các bài Mom đã giao", "Chưa có bài tập nào được giao" | 3 | "ca kiểm tra", "Các bài gia đình giao", "Chưa có bài gia đình giao nào" | KhoiKhacPhuc3CheDo.tsx:539,581,1039,1236,1597,1613; ModalKhacPhucCauSai.tsx:702 | mom-m3-1909 |
| P26 | Phiếu Zalo gửi PH (**công cụ thầy — Boss chốt**) | "ĐIỂM: 7,88/10, xếp loại Khá" | 7 | bỏ "xếp loại…": "ĐIỂM: 7,88/10" (nhãn năng lực) | lib/phieu-zalo.ts:70 (+PhieuZaloEm.tsx:298,331) | phieu-zalo.test; phieu-zalo-va-anh; zalo-khong-tin-o-diem-0809; phieu-doc-o-sheet-khi-du-prop-0909 |
| P27 | Phiếu Zalo | "kết quả bài kiểm tra ngày 21/09" | 3,6 | "kết quả ca kiểm tra ngày Thứ Hai 21/09/2026" | phieu-zalo.ts:59,138 | phieu-zalo.test; phieu-zalo-va-anh |
| P28 | Phiếu Zalo | "Phần I 3,00 · Phần II 2,00 · Phần III 1,50" | 1 | "Phần I: 3,00 điểm · …" | phieu-zalo.ts:72 | zalo-khong-tin-o-diem-0809 |
| P29 | Phiếu Zalo | "12 câu bài tập trong app, hạn nộp 24/09" | 3,6 | "12 câu Bài tập về nhà, Hạn nộp: 23:59 Thứ Năm 24/09/2026" | phieu-zalo.ts:109 | phieu-zalo.test; phieu-zalo-va-anh |

## D. Việc Boss chốt (mình dừng ở đây, không tự quyết)
1. **Một tên cho "bài gia đình"** (H8, P8, P15, P17, P24, P25): đề nghị "Bài gia đình giao" (menu đã dùng) → thêm dòng vào A2, cấm "Mom/Mẹ giao" trên màn HS/PH. Tiêu đề đã LƯU trong dữ liệu ("Bài của Mom giao (n câu)", ParentPortalScreen:376 + `chuanHoaBaiMom`) KHÔNG đổi (test khoá, sẽ lệch bài cũ) — chỉ đổi chữ vẽ ra.
2. **Đơn vị trong game** (G32): đề nghị thêm A2: "Ải" = một câu trong lượt Đảo, "Lượt" = một lần chơi, "Hiệp" = một hiệp của Đoàn, "Trạm" đã có. Chưa chốt thì mình KHÔNG đổi các từ này.
3. **Tên trò**: "Hộ Tống Linh Tâm" (Võ đài cũ) / "Võ đài thứ Bảy" / "Đoàn Hộ Tống" (G16) — chốt mỗi trò một tên.
4. **"Khiên chống đuổi"** (G21): A2 ghi "Khiên"; đổi tên cần soát 3 tệp test — chốt tên + dòng phụ.
5. **"Biết · Hiểu · Vận dụng"** (G24, H31): áp mọi nơi kể cả phiếu (đang "Nhận biết/Thông hiểu")?
6. **Lịch ôn** (G23, G30, P9, H14): "hạn ôn / lên bậc ôn / tụt bậc" → "đến lịch ôn lại / chuyển sang lịch ôn xa hơn"; bỏ "tụt bậc" (luật 7).
7. **Hộp xác nhận nộp bài của phiếu** (H37): thay `window.confirm` bằng hộp riêng [Nộp bài] [Làm tiếp] + nói đúng "chưa tính" — test `phieu-m3-1909` đang khoá ĐÚNG MỘT `window.confirm`; đây chạm luồng nộp ⇒ cần Boss soát.
8. **Vào ca (H25)**: chỉ đổi NHÃN ("Vào ca kiểm tra", "Mã ca kiểm tra"); số chữ số "6" lệch lỗi "4 đến 8" là lỗi logic có sẵn — luật kiểm mã KHÔNG đụng (luồng thi) — báo Boss quyết.
9. **Phiếu Zalo của thầy (P26–P29)**: nằm ở công cụ thầy nhưng chữ đi tới PH; "xếp loại Khá/Yếu" là nhãn năng lực (luật 7) — ai sửa?
10. **Mã chết**: `Room.tsx` không ai import; tab `learn` của Game.tsx không có đường vào (G33, G34) ⇒ đề nghị Code 5/6 xoá thay vì sửa chữ.

## E. KHÔNG đổi (đã soát)
"Phần I/II/III" (cấu trúc đề chuẩn); "Tờ đề: {mã}" ở dòng phụ chữ nhỏ (btvn-ca-nhan-kieu:210 — luật cho phép); "Bài tập"/"Chỉ bài tập" trong bộ lọc kiểu câu; "EXP học tập", "Khắc phục", "Đoàn Hộ Tống", "Linh Tâm", "Mã đoàn" (học sinh đọc cho bạn); mọi aria-label đã bị khoá ("Máu của …", "Máu Quái Sương Mù", "Em có N vé hộ tống", "Chuỗi N ngày", "Xác nhận Di chuyển"); `ly-do-thuong.ts` mốc do máy chủ trả; tên trường `hp`/`enemy`; chuỗi lỗi trong `escort-core.ts`, `doan-core.ts`; câu chữ cảnh báo màn THI THẬT (`ExamTakeScreen`); `LOI_NHAN_LUYEN_TAP` (thầy tự viết); `TheBoNao` (đã đúng chuẩn, bị `bo-nao-*` khoá).

## F. Thứ tự làm sau khi Boss duyệt (mỗi cụm một commit nhỏ, sửa test CÓ CHỦ Ý, ảnh trước/sau Chromium 390 + 1440 sáng/tối, `check:mau`, `tsc -b`)
1. **Máu + thần thú** — G1 G2 G4 G8 G9 G14 G18 G19 G34, H1/P1, H13. (Học sinh thấy mỗi ngày, ít test khoá.)
2. **Lô → Chặng** — H2–H5 H15 H29 H33 (+ regex `docTienDoLo`), G26, P6. (Khoá nhiều test ⇒ sửa test theo cụm.)
3. **Ngày giờ + Hạn nộp** — H10 H11 H18 H32 H34 H36, P7 P10 P12, G31, G35 (dùng `gioDayDu`).
4. **Ca thi → Ca kiểm tra** — H6 H12 H17 H23 H24 H26 H27, P11 P13 P16 P23 P25 (trừ H25 chờ Boss).
5. **Bài gia đình** — H8 H19 H20 P8 P14 P15 P17 P24 (sau khi Boss chốt tên).
6. **Nút / hộp thoại / emoji** — G10–G13 G17 G21 G27 G28, H21 H30 H38 H40, P14 (H37 chờ Boss).
7. **Còn lại** — H7 H9 H14 H16 H22 H28 H31 H35 H39, P2–P5 P18–P22, G3 G5–G7 G15 G20 G22–G25 G29 G30, G32/G33 chờ Boss.
Mình bắt đầu từ cụm 1 + 2 ngay khi Boss nhắn "duyệt" (hoặc "duyệt trừ mục …").
