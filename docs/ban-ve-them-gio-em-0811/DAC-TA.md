# Thêm giờ cho TỪNG EM trong ca thi — đặc tả 7 mục (08/11/2026, chờ thầy duyệt)

Thầy: «Phần thêm giờ cho hs vào muộn ca thi tôi muốn bấm vào từng hs đang làm để thêm giờ cho từng hs đó. Vẽ tôi xem trước khi build.»

## 1. Mục tiêu + ai dùng
- Ai dùng: GIÁO VIÊN, màn **Theo dõi ca** (`TheoDoiCa.tsx` trong `ExamMonitorScreen`).
- Em vào muộn, mất mạng hay máy hỏng giữa giờ thì được bù đúng phần thiếu, công bằng. Cả phòng không phải kéo dài theo.
- Hiện có nút **«Thêm 5 phút» cho CẢ PHÒNG** (`/ca/them-phut`). Nút này giữ nguyên, tính năng mới đặt bên cạnh.

## 2. Bố cục (ảnh: `dt-*` 390 px, `mb-*` 820 px, `mt-*` 1366 px; mỗi khổ có `sang` và `toi`)
- **Danh sách «Từng em»** (`*-0-danh-sach`):
  - Mỗi em **đang làm** hiện nhãn đồng hồ **«Còn mm:ss»** của riêng em, thay cho chữ «Đang làm».
  - Nhãn chuyển đỏ khi còn dưới 5 phút. Em đã được thêm giờ có thêm dấu **«+5′»**.
  - Dòng hướng dẫn: «Chạm em đang làm để thêm giờ riêng cho em đó. Chạm em khác để mở hồ sơ.»
- **Chạm một em đang làm ⇒ tấm «Thêm giờ cho riêng em»** (`*-1-chon`). Điện thoại hiện tấm trượt từ đáy, máy tính và máy tính bảng hiện hộp giữa màn. Tấm gồm:
  - tên em; SBD · vào muộn N phút · đã làm x/y câu;
  - khung đồng hồ to «Còn mm:ss · Hạn nộp của em hh:mm»;
  - 3 ô lớn **+5 / +10 / +15 phút**;
  - ghi chú «Chỉ em này được cộng giờ… tối đa 30 phút»;
  - nút «Xem hồ sơ em».
- **Bấm một ô ⇒ hỏi lại** (`dt-sang-2-hoi`): «Thêm 10 phút cho Lan Anh? Hạn nộp mới 10:43.», kèm nút [Đồng ý thêm 10 phút] và [Chọn lại].
- **Xong** (`dt-sang-3-xong`): đồng hồ nhảy giờ mới; dòng xanh «Đã thêm 10 phút cho Lan Anh. Máy em nhận giờ mới trong khoảng 10 giây.»

## 3. Trạng thái
- **Đang cộng:** nút ghi «Đang cộng…» và bị khoá.
- **Lỗi hoặc mạng chậm:** dòng đỏ «CHƯA CHẮC đã cộng — xem đồng hồ của em ở danh sách rồi hãy bấm lại». Không tự bấm lại, tránh cộng hai lần.
- **Đủ 30 phút:** các ô vượt trần chìm xuống; ghi chú báo «còn N phút».
- **Em vừa nộp hoặc bị khoá lúc tấm đang mở:** máy chủ từ chối, tấm báo «Em đã nộp / đang bị khoá — không thêm giờ.»
- **Ca chưa bắt đầu hoặc đã kết thúc:** không có em đang làm nên không mở được tấm.

## 4. Dữ liệu
- **Đã có:**
  - `moiNhat.hetGioLuc` của từng lượt, màn theo dõi đã đọc sẵn;
  - `vaoLuc`;
  - máy em đọc `hetGioLuc` ở nhịp gửi trạng thái và chỉ nhận khi giờ mới MUỘN hơn (`lib/them-phut.ts`), nên **máy em không cần sửa**.
- **Cần thêm ở máy chủ:**
  - lệnh `POST /ca/them-phut-em {maCa, sbd, phut}` (mã bí mật thầy);
  - chỉ cộng `luot.het_gio_luc += phut` cho đúng một lượt `dang_lam` hoặc `khoa` của em đó;
  - cột chỉ-thêm `luot.them_phut_em` (migration CHỈ-THÊM), trần 30 phút mỗi em, mỗi lần tối đa 15 phút;
  - khoá lạc quan như `/ca/them-phut`;
  - xoá đệm `xoaDemHetGioLuot`.
- Màn theo dõi đọc thêm `themPhutEm` của từng lượt để hiện «+5′».

## 5. Ngoại lệ
- **Bấm hai lần liền:** nút khoá trong lúc cộng; máy chủ dùng khoá lạc quan, lệnh chen giữa thì không đổi gì và báo «bấm lại».
- **Thầy thêm cho cả phòng sau khi đã thêm riêng:** cộng dồn đúng; trần 30 phút của cả phòng và trần 30 phút riêng em tính tách nhau.
- **Em mất mạng:** máy chủ vẫn giữ hạn mới, em vào lại thì nhận đủ.
- **Tên dài:** tên xuống dòng, không cắt.
- **Máy yếu:** tấm không có hoạt ảnh nặng; đồng hồ nhích mỗi giây theo giờ máy chủ (`gioMayChu`).

## 6. Chi phí máy chủ
- Mỗi lần bấm: 1 lượt đọc + 1 batch 2 câu ghi. Không thêm vòng chờ ở lệnh nóng; nhịp của em vẫn là 1 lượt.
- Không đụng đáp án, điểm hay đề.

## 7. Nghiệm thu đo bằng máy
- **Test vitest:**
  - `tests/them-gio-em-0811.test.ts` (máy chủ): chỉ cộng đúng một lượt; trần 30 phút; em đã nộp thì từ chối; lệnh chen giữa không đổi gì.
  - `tests/them-gio-em-giao-dien-0811.test.tsx`: chạm em đang làm mở tấm, em khác mở hồ sơ; có bước hỏi lại; khi lỗi không tự bấm lại.
- **Cổng:** `npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0 vi phạm.
- **Ảnh Chromium:** 0 lỗi trang, 0 tràn, 0 đích bấm < 44 px. Bản vẽ này đã đạt cả ba.
