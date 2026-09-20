# HỢP ĐỒNG — nút "Thêm 5 phút" + "Chiếu mã vào thi" (thầy lệnh 21/09: "thêm 2 nút luôn")

Boss chốt. Bản vẽ: `docs/ban-ve-app-giao-vien-2109/` ảnh 2 (nút tonal cạnh "Khoá ca"; nút "Chiếu mã vào thi" ở đầu màn). Mọi commit cần dòng "đã soát".

## HIỆN TRẠNG (đã dò mã)
Hạn một lượt ghi MỘT LẦN vào `luot.het_gio_luc` lúc `/vao-thi` (`server/src/luat-vao-thi.ts:67`, `index.ts:283`). Máy em đếm theo `attempt.hetGioLuc` (`src/lib/exam-db.ts:111`), hết giờ tự nộp (`ExamTakeScreen.tsx:~2260`); trong lúc thi chỉ GỬI `examStatus` ~10 s (máy chủ trả `{ok:true}`, `index.ts:441`). Máy thầy: `conLaiCa = batDauThiLuc + thoiGianPhut` (`src/lib/con-lai-ca.ts:24`). Chưa có lệnh nào sửa giờ ca đang chạy.

## 1 · Máy chủ (Code 3) — lệnh THẦY `/ca/them-phut`
Vào: `{ maCa, phut }`, `phut` nguyên 1..15 (nút gửi 5), đòi mã bí mật. Từ chối (ok:false + lý do bằng lời): ca không tồn tại / không đang mở / kiểu `baitap` (hạn theo `han_nop`) / tổng đã thêm của ca sẽ vượt 30 phút.
Làm trong MỘT batch: `ca.thoi_gian_phut += phut`; mọi lượt CHƯA NỘP của ca có `het_gio_luc` (`dang_lam`, `khoa`) `het_gio_luc += phut`; cộng dồn `ca.them_phut_tong` (cột CHỈ THÊM, INTEGER mặc định 0 — migration riêng, phòng vệ cột chưa có). KHÔNG đụng `het_han_vao`, điểm, đáp án, lượt đã nộp.
Ra: `{ ok, phut, soLuotCong, thoiGianPhut, themPhutTong }`.
`examStatus` trả THÊM `hetGioLuc` (ISO, hạn hiện hành của đúng lượt ấy; không có thì vắng). `/ca/chi-tiet` trả thêm `themPhutTong`. Luật "chỉ nộp 3 phút cuối" tiếp tục tính theo `het_gio_luc` mới.
Test: chỉ cộng, không bao giờ trừ; lượt đã nộp y nguyên; trần 30; gọi lặp không nhân đôi ngoài ý (mỗi lần gọi = một lần cộng, thầy xác nhận ở giao diện).

## 2 · Màn thi học sinh (Code 2) — nhận hạn mới
Khi `examStatus` trả `hetGioLuc` MUỘN HƠN hạn đang giữ ≥ 30 s: cập nhật `attempt.hetGioLuc` (lưu IndexedDB để tải lại vẫn đúng) + một dòng báo nhẹ, tự tắt: "Thầy cho thêm N phút". SỚM HƠN hoặc bằng ⇒ BỎ QUA (không bao giờ rút giờ từ đường này). Thiếu trường (máy chủ cũ) ⇒ như cũ. Em mất mạng không nhận được ⇒ hết giờ cũ vẫn tự nộp (chấp nhận, ghi rõ ở nút của thầy). KHÔNG đổi: vân tay, giữ-để-đọc, màn chắn, rời màn, z-index, câu chữ cảnh báo, luồng nộp.

## 3 · Màn theo dõi ca của thầy (Code 4)
- **Thêm 5 phút**: trong `KhoiThoiGianCa`, cạnh "Khoá ca"; chỉ hiện khi ca đang mở và không phải `baitap`. MỘT bước xác nhận nói thật: "Cả phòng thêm 5 phút. Em đang làm nhận giờ mới trong khoảng 10 giây; em mất mạng sẽ không nhận được." Xong: nói ĐÚNG theo máy chủ ("Đã cộng 5 phút cho N em đang làm" / lý do từ chối). Hiện "đã thêm X phút" khi `themPhutTong > 0`. Máy chủ chưa có lệnh ⇒ báo lỗi thật, không giả thành công.
- **Chiếu mã vào thi**: tấm phủ toàn màn (Esc / nút đóng), mã ca CỠ RẤT LỚN tách nhóm 3 số ("784 817"), địa chỉ app học sinh, tên ca; nếu ca có phòng chờ thì số em đã vào chờ (dữ liệu sẵn có). KHÔNG hiện tên em, điểm, hay lý do gì. Không thêm thư viện mới (chưa có sẵn thư viện QR thì không làm QR). Sáng + tối, 1280 và 390.

## THỨ TỰ ĐẨY
Code 3: migration `--remote` → Worker. Rồi Code 2 đẩy Pages (mang cả phần Code 4). Máy khách mới + máy chủ cũ và ngược lại đều phải chạy được.
