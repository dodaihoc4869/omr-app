# ĐỀ BÀI BUILD — APP GIÁO VIÊN mặc Material 3 + màn HÔM NAY (thầy CHỐT 21/09)

Người làm: **Code 4** (chủ hệ `.m3` + bộ sinh tương thích). Phối hợp, nhắn thẳng: **Code 1** (các màn gọi lên bảng/tờ chiếu là làn của Code 1 — em chỉ lo VỎ và token, không sửa ruột các tệp đó), **Code 3** (lệnh máy chủ cho màn Hôm nay), **Code 2** (đẩy Pages). Quyết/soát: **Boss** — app thầy là LÀN GIÁO VIÊN ⇒ mọi commit cần dòng "đã soát".
Đọc trước: `CLAUDE.md` → `DIEU-PHOI.md` → 3 ảnh `docs/ban-ve-app-giao-vien-2109/` (+ `sinh-ban-ve.py` = token màu/bo/khoảng cách đã chốt) → `src/App.tsx:316-341`, `src/components/ThanhBenTrai.tsx`, `BottomNav.tsx`, `src/styles/tokens.css`, `src/styles/teacher-layout.css`, `src/screens/exam-setup.css`, `src/components/m3/index.ts` (`dungM3`), `scripts/sinh-m3-tuong-thich.mjs`.

## HIỆN TRẠNG (đã kiểm kê)
Thanh điều hướng nằm BÊN PHẢI (`index.css:349`), mobile chỉ 2 tab + menu nhồi, Cài đặt lẫn cuối Ngân hàng đề; ExamSetup 335 + PhanCong 289 lớp màu Tailwind rời; 3 tầng CSS đè nhau (`teacher-layout.css` có `!important`, `exam-setup.css` còn hex); `dungM3()` = phủ định của app thầy; KHÔNG màn nào của thầy cho thấy thuật toán mới. Test soi chuỗi: ExamMonitor 27 tệp, GoiLenBang 14, ExamSetup 11, HocSinh 8… (là hợp đồng — giữ mọi chuỗi chúng khoá).

## NHIỆM VỤ — theo MỐC, mỗi mốc chạy được + một nhóm commit
- **G1 · Vỏ M3**: điều hướng TRÁI (drawer ≥ 1100 px · rail 880–1100 · thanh đáy < 880 với ĐỦ mục, khớp nhau), logo GV mới + chữ, nút nổi "Mở ca kiểm tra", mục: Hôm nay · Học sinh · Ca thi · Ngân hàng đề · Bài tập về nhà · Gọi lên bảng · Học sinh hỏi · Cài đặt (màn MỚI gom `KhoiMayChuMoi` + `KhoiMatKhauApp` + nút sáng/tối/theo máy). Bật `.m3` cho app thầy: bỏ cổng route trong `dungM3` cho vỏ thầy, thêm các màn thầy vào `TEP` của bộ sinh, sửa `m3-a1-1909.test.tsx` có chủ ý, hoà giải `teacher-layout.css`/`exam-setup.css` về token M3 (hết `!important` nào gỡ được, hết hex). Giữ `rongBenTrai` (kéo rộng) nếu test khoá.
- **G2 · Màn HÔM NAY** (ảnh 1) thay `ExamHubScreen` làm trang chủ: 4 thẻ số, "Cần thầy để ý" (mỗi em MỘT lý do bằng số + MỘT nút hành động), "Buổi chữa tối nay" (đọc kế hoạch của Code 1), "Dạng cả lớp đang yếu" → nút giao BTVN/rút đề theo dạng, "BTVN đang chạy" theo lô, thẻ Đoàn Hộ Tống (chỉ khi game mở). DỮ LIỆU: viết hợp đồng `docs/hop-dong-gv-hom-nay-2109.md` cùng Code 3 (một lệnh của thầy, có mã bí mật, CHỈ ĐỌC, ≤ 8 truy vấn: tổng đạt ngày, % lô đúng nhịp, số câu tới hạn/phục vụ được, danh sách em cần để ý kèm lý do, dạng yếu theo lớp). Chưa có lệnh ⇒ màn hiện khung + "đang chờ máy chủ", KHÔNG bịa số. Không kết luận năng lực từ điểm; không chữ "nắm chắc".
- **G3 · Học sinh** (ảnh 3): danh sách + hồ sơ: mạnh/yếu theo DẠNG (nam_kt_dang), lịch ôn 1·3·7 (4 ô đếm), kế hoạch hôm nay của em, thần thú/EXP, nút Giao bài riêng / Cho thi lại / Nhắn phụ huynh (nối hàm sẵn có).
- **G4 · Ca thi** (ảnh 2): `LichSuCaScreen` + `ExamMonitorScreen` — bảng theo tab trạng thái, cột phải: thời gian, đề riêng (đọc `KetQuaDungDeRieng`/biên bản `ghiChu`), cảnh báo cam. LUỒNG THI THẬT: chỉ đổi phần nhìn, mọi hàm/nút/chuỗi cảnh báo/thứ tự thao tác giữ nguyên; commit riêng từng bước nhỏ.
- **G5 · Mở ca + Giao BTVN + Ngân hàng đề + Học sinh hỏi + Danh sách lớp**: thay lớp màu rời bằng token (qua bộ sinh), bố cục theo cùng ngôn ngữ thẻ; PhanCong hiện LÔ BTVN (đang thiếu).
- **G6 · Rà cuối**: 1280/1440 + 390, sáng + tối, tương phản, đích chạm, trạng thái trống sau reset; ảnh vào `docs/anh-app-giao-vien-2109/`.

## NGUYÊN TẮC
Thay áo không thay xương: không đổi hàm, luồng, payload, luật. Token M3 MỘT nguồn dùng chung 3 app (`m3-theme.css`). Không hex trong TSX. Màn của Code 1 (GoiLenBang, tờ chiếu): chỉ vỏ/token; cần đổi ruột thì nhắn Code 1. Mỗi mốc: test + đột biến + ảnh Chromium thật, tin ≤ 150 từ cho Boss kèm mã commit; không tự đẩy.

## NGHIỆM THU
1. Cả 3 app cùng một bảng màu/bo/chữ; app thầy có sáng/tối. 2. Mọi test soi chuỗi màn thầy giữ xanh (đỏ mới = []), `check:mau` sạch, `exam-setup.css` hết hex. 3. Thầy đi trọn: mở ca → theo dõi → cho thi lại → giao BTVN → gọi lên bảng mà không màn nào vỡ ở 1280 và 390. 4. Màn Hôm nay không có con số nào không truy được về một truy vấn trong hợp đồng.
