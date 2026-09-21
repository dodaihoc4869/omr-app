# EXP HỌC TẬP MỚI + MẢNH KHIÊN — đặc tả đã được thầy CHỐT 19/09 ("Chốt. Quá thông minh")

Người làm: **Code 3** (máy chủ, toàn bộ luật) → **Code 2** (hiển thị, sau việc B). Điều phối: 0.Planer.

Nguyên văn thầy: "viết lại thuật toán tính exp… mọi hoạt động mọi bài tập của học sinh làm đều có liên quan tới exp, nhưng phải đủ độ khó lấy khiên và phải kích thích được học sinh làm bài tập để kiếm exp."

## Vì sao đổi (đọc từ mã)
`server/src/game-v2-academic.ts`: mọi câu đúng = 2 EXP bất kể độ khó; khoá `practice:{qid}` = mỗi câu thưởng MỘT LẦN CẢ ĐỜI (ôn lại câu sai tới khi khắc phục gần như không có EXP); trần cứng 100 EXP/ngày; xong lô, đạt ngày, chuỗi ngày, lên bảng, khắc phục: 0 EXP. Khiên chỉ từ mốc tiến hoá (`shields.ts`: cấp 10 +1, 30 +2, 50/70/100 +3): khiên đầu ≈ 1.630 EXP, khiên kế ≈ 27.000 EXP.

## Luật mới — EXP = công sức × độ khó × chất lượng × đúng nhịp; MỌI EXP do máy chủ tính từ sổ `su_kien_hoc`

### 1. Câu đúng (mọi nguồn: thi, btvn, btvn_lo, khac_phuc, mom, on_lai, luyen)
| | 0 sao | 1 sao | 2 sao |
|---|---|---|---|
| Phần I | 2 | 3 | 5 |
| Phần II (đúng đủ 4 ý) | 3 | 5 | 8 |
| Phần III | 4 | 6 | 10 |
Thiếu `sao` → 0 sao. Sai / bỏ trống = 0. Cùng một qid chỉ tính MỘT LẦN MỖI NGÀY VN (lần đúng đầu tiên trong ngày). Game v2: GIỮ NGUYÊN 20/40/40 theo mốc mastery, assisted = 0, vào ví (wallet) như cũ — câu trong game KHÔNG nhận thêm EXP câu theo bảng này (tránh thưởng đôi). CHỈ EXP CÂU theo bảng này loại nguồn game; các khoản của MỤC 2 và mảnh khiên dựa trên CHUYỂN TRẠNG THÁI HỒ SƠ (lên bậc `bac|…` +6, đạt `da_khac_phuc` `kp|…` +30, dạng rời danh sách yếu +2 mảnh) áp cho MỌI nguồn ghi sổ, KỂ CẢ `game` (0.Planer chốt 19/09; câu game có trợ giúp không ghi sổ nên tự nhiên không có chuyển trạng thái).

### 2. Thưởng theo việc
| Việc | EXP | Khoá idempotent |
|---|---|---|
| Xong một lô BTVN đúng nhịp (trước mốc lô kế) | +10 | `lo\|<ma_btvn>\|<chiSo>` |
| Xong lô trễ nhịp | +4 | cùng khoá |
| Nộp cả bài BTVN đúng hạn | +15 | `btvn\|<ma_btvn>` (lần nộp đầu) |
| Hoàn thành bài Mẹ giao / daily_ | +10 | `mom\|<id>` |
| Câu ôn LÊN BẬC (đúng ở một ngày VN khác lần đúng trước, theo luật Leitner) | +6 | `bac\|<qid>\|<ngay_vn>` |
| Câu đạt `da_khac_phuc` (đủ 3 mốc) | +30 | `kp\|<qid>\|<lan>` (tái phát rồi khắc phục lại → lần mới) |
| Lên bảng Đạt / Chưa đạt | +15 / +5 | `lb\|<khoá len_bang>` |
| Ca thi theo điểm | round(điểm 0..10) × 3 | `diem\|<ma_ca>\|<lan_thu>` (chỉ ca đã công bố, như luật cũ) |
| Đạt nhiệm vụ ngày (`tienBo.dat` chuyển true) | +20 | `dat\|<ngay_vn>` |
| Chuỗi ngày đạt | +2 × min(chuỗi, 10) | `chuoi\|<ngay_vn>` (trao cùng lúc với "đạt ngày") |

### 3. Trần MỀM (thay trần cứng 100/ngày)
EXP CÂU (mục 1) tính đủ cho tới khi số câu-được-thưởng trong ngày đạt `2 × nganSach.mucTieuCau`; các câu sau đó nhận 25% (làm tròn lên, tối thiểu 1). Thưởng theo việc (mục 2) không bị trần. Thứ tự xét theo `luc` trong sổ (tất định).

### 4. Mảnh khiên — khiên RÈN (thêm vào, không thay khiên quà tiến hoá)
- Đạt nhiệm vụ ngày: +1 mảnh (`manh\|dat\|<ngay>`). Chuỗi đạt chạm bội số 7: +3 mảnh (`manh\|chuoi7\|<ngay>`). Một DẠNG rời danh sách dạng yếu (trước: `so_gap ≥ 4` và tỉ lệ < 0,7; sau: ≥ 0,7): +2 mảnh (`manh\|dang\|<ma_dang>\|<lan>`).
- `MANH_MOI_KHIEN = 12` (núm độ khó: 8 dễ / 12 vừa / 16 khó). Đủ mảnh → TỰ RÈN 1 khiên, trừ 12 mảnh. `KHIEN_REN_TOI_DA = 5` khiên rèn CHƯA dùng; đang đủ 5 thì mảnh vẫn cộng nhưng kẹp ở 24.
- **THẦY LỆNH 21/09/2026 (ghi đè ba dòng trên): "Siết độ khó lấy khiên: ít nhất học đều 36 ngày mới lấy được khiên đầu tiên."** ⇒ `MANH_MOI_KHIEN = 36` (`MANH_TOI_DA = 72`); nguồn mảnh DUY NHẤT là "đạt nhiệm vụ ngày" +1/ngày; thưởng mảnh ở chuỗi bội 7 (+3) và ở dạng rời danh sách yếu (+2) đặt về **0 mảnh** (vẫn ghi khoá `manh|chuoi7|<ngày>` / `manh|dang|<dạng>|<lần>` vào sổ với `so = 0` để chạy lại không sinh lại; KHÔNG đổi EXP). Mảnh em đang có giữ nguyên (7/12 ⇒ 7/36; 12–35 mảnh đang giữ vì trần 5 khiên chưa dùng không tự rèn, không mất); khiên rèn đã có giữ nguyên, không thu hồi. Test tính chất `tests/manh-khien-36-ngay-2109.test.ts`: em đạt mọi ngày + mọi thưởng cũ ⇒ khiên rèn đầu tiên đúng ngày 36 (không sớm hơn), tiếp theo ngày 72, 108. Máy em đọc tổng mảnh từ máy chủ (`moiKhien`, `manhKhienTong` = `MANH_MOI_KHIEN`).
- **Còn hở — khiên QUÀ TIẾN HOÁ (`shieldEntitlement`, `src/game/than-thu-v2/shields.ts`, chưa sửa, chờ Boss):** khiên đầu tiên của nguồn này đến ở CẤP 10 (mốc tiến hoá đầu, `EVOLUTION_LEVELS = [1, 10, …]`). Lên cấp 10 cần 1 630 EXP (Σ thanhExp cấp 1–9); một em học đều ~85–120 EXP/ngày mất ≈ 14–19 ngày < 36 ⇒ vẫn có khiên đầu TRƯỚC ngày 36.
- Mảnh KHÔNG mua được bằng EXP, không chuyển nhượng. `shieldRemaining = shieldEntitlement(cấp) + khienRenDaNhan − used`.

### 5. Chống gian lận
Trả lời bừa: 0 EXP + bị hạ bậc theo Leitner. Nộp trống trong ôn: không ghi, không lời giải (đã làm). Không EXP nào do client khai. Lên bậc chỉ khi đúng ở NGÀY KHÁC. Mọi khoản có khoá idempotent → gọi lại/nạp lại sổ không cộng trùng.

## Thiết kế máy chủ (Code 3)
- Hàm THUẦN `server/src/exp-hoc-tap.ts`: `tinhExp({suKienTrongNgay, chuyenTrangThai, loXong, baiNop, lenBang, diemCa, keHoachNgay, metaCau, daCoKhoa}) → {khoan:[{khoa, loai, exp, qid?, maNguon?, luc}], manh:[…]}`; hằng số MỘT chỗ `server/src/exp-cau-hinh.ts`. Tất định: cùng đầu vào → cùng danh sách; thứ tự theo `luc`, hoà thì theo `khoa`.
- Sổ mới chỉ-thêm (migration riêng, có phòng vệ khi chưa chạy): `exp_so (khoa PK, sbd, ngay_vn, loai, qid, ma_nguon, exp, luc)` và `manh_khien_so (khoa PK, sbd, ngay_vn, loai, so, luc)`; chỉ mục `(sbd, ngay_vn)`. Idempotent bằng PK — KHÔNG dùng mảng `academic.seen` trong JSON hồ sơ nữa (nó phình vô hạn).
- Cộng vào hồ sơ game: một hàm `congExpHocTap(p, tongMoi)` dùng đúng `nhanExp` hiện có (EXP học tập nạp thẳng vào cấp như hiện nay — KHÔNG đổi cơ chế hai bể của game). Chỉ khi em ĐÃ có hồ sơ game; chưa có → khoản vẫn ghi vào `exp_so` với cờ chờ, cộng dồn khi em tạo hồ sơ. Hồ sơ thêm `khienRen:{manh, daRen}`; `shield-use` tính theo công thức mục 4.
- ĐIỂM GỌI: ngay sau mỗi lần ghi sổ + dựng lại hồ sơ (chamDiem, nopBtvnQuaPhieu, xongLoBtvn, nopKhacPhuc, mom submit, ghiLenBangMoi, on-lai/nop, luyen submit) và trong cron 00:01 (chốt "đạt ngày/chuỗi" của ngày vừa qua nếu chưa trao). ≤ 3 truy vấn thêm trên đường nộp.
- CHUYỂN TIẾP: mốc `EXP_MOI_TU` = lúc phát hành. Sự kiện trước mốc: giữ như đã trả theo luật cũ, không tính lại. Trong NGÀY phát hành: bỏ qua qid đã có khoá cũ `practice:{qid}`/`exam:{ma_ca}:{qid}` trong `academic.seen` để không trả đôi. `syncAcademic` cũ: ngừng sinh khoản mới sau mốc (giữ đọc `academic` cũ để hiển thị tổng).
- PHẢN HỒI: `/hs/ke-hoach-ngay` thêm `exp:{homNay, chiTietHomNay:[{loai, exp, ghiChu}], manhKhien:{manh, moiKhien:12, khienRen, khienConLai}}`; mọi lệnh nộp trả thêm `expNhan:[{loai, exp, ghiChu}]` để giao diện bật thông báo. `ghiChu` là tiếng Việt sẵn in, kèm số.
- TEST (SQLite thật): bảng 9 ô câu đúng; một qid hai lần một ngày → 1 khoản; trần mềm đúng ngưỡng 2×mucTieu; lô đúng nhịp/trễ nhịp; lên bậc chỉ ngày khác; khắc phục +30 đúng một lần mỗi vòng; đạt ngày + chuỗi; mảnh: 12 → tự rèn, kẹp 5 khiên/24 mảnh; dạng rời danh sách yếu → +2; nạp lại sổ hai lần → tổng EXP không đổi; em chưa có hồ sơ game → khoản chờ; chuyển tiếp không trả đôi. Đột biến: bỏ khoá idempotent / bỏ trần mềm / cho sai có EXP → test đỏ.
- TEST CŨ PHẢI ĐỔI (thầy đã chốt luật mới — ghi từng dòng vào SO-VIEC.md): các ca của `creditAcademic` trong `tests/than-thu-v2.test.ts` (2 EXP/câu, trần 100/ngày, "cùng qid đã thưởng không trả lại ở mục khác") và test academic-sync liên quan. GIỮ: assisted = 0, 20/40/40 theo mastery, trần 200 câu game/ngày, game không sửa bảng học tập, đường cong `thanhExp` 120 cấp, cơ chế ống nghiệm → nạp.
- Bước cuối: chạy thử trên tài khoản thầy 12121212 (0.Planer kiểm bằng trình duyệt đã đăng nhập), rồi mới phát hành cho mọi em.

## Hiển thị (Code 2, sau việc B)
- Bảng nhiệm vụ: dưới thần thú một thanh mảnh khiên "Mảnh khiên 7/12" (12 vạch), khiên rèn đang có; thẻ việc ghi EXP sẽ nhận ("+10 khi xong lô đúng nhịp"); xong việc → bật thông báo EXP từ `expNhan` (1,5 s, tắt khi giảm chuyển động) + thần thú `victory`.
- Phiếu sau nộp / ôn câu: dòng "EXP vừa nhận" liệt kê từng khoản kèm lý do (in nguyên `ghiChu`).
- Phụ huynh: chỉ xem (EXP hôm nay, mảnh khiên, chuỗi đạt).
- Không bịa số: máy chủ chưa trả `exp` → ẩn toàn bộ phần này.
