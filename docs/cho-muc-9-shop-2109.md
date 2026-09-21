# Cửa hàng phụ kiện — CHUỖI CHỮ mà mục 9 (`DE-XUAT-SHOP-PHU-KIEN-2109.md`) CHƯA CÓ (Code 2 → Boss, 21/09 tối)

Luật của mục 9: "phiên giao diện chép đúng từng chuỗi, không tự đặt chữ mới; thiếu ⇒ hỏi Boss". Đã làm: ba lời lỗi `khong_co_mon` / `sap_mo` / `sai_dau_vao` nay dùng ĐÚNG chữ [L11] [L12] [L13] (Boss thêm ở c77f130) — hết "lời tạm". Xoá hằng `chuDangTai` (không còn chỗ dùng).

Còn **11 chuỗi** trong `src/game/than-thu-v2/shop/chu-shop.ts` đánh dấu `// CHỜ MỤC 9` (chữ tạm trung tính theo bảng từ chuẩn, chưa ai duyệt). Boss viết / duyệt từng dòng dưới đây; tôi thay đúng chữ + sửa test khoá (`tests/shop-khoa-nguon-2109.test.tsx`, danh sách CHỜ) trong một commit.

| # | Hằng (chu-shop.ts) | Dùng ở đâu | Chữ tạm hiện có | Mục 9 có gì gần nhất |
|---|---|---|---|---|
| 1 | `chuVeDao` | Cửa hàng: nhãn trợ năng nút quay về Đảo | Về Đảo thần thú | [B7] chỉ có "Tới Cửa hàng · Xem Cửa hàng · Tủ đồ" — không có nút quay lại |
| 2 | `chuVeCuaHang` | Thử đồ + Tủ đồ: nhãn nút quay về Cửa hàng | Về Cửa hàng | như trên |
| 3 | `chuLocNhan` | Cửa hàng: nhãn trợ năng hàng lọc theo chỗ đeo | Lọc theo chỗ đeo trên thần thú | không có |
| 4 | `chuThanhKeoNhan` | Cửa hàng: nhãn trợ năng thanh kéo số EXP đổi | Số EXP thừa em muốn đổi thành vàng | [B9] "Kéo thanh để chọn số EXP" (đang dùng làm chữ nút mờ) — có thể dùng lại nguyên câu này nếu Boss đồng ý |
| 5 | `chuDoiToiDa(n)` | Cửa hàng: nhãn đầu mút thanh kéo | Đổi được nhiều nhất {N} EXP | [L1] "… Em đổi được tối đa {420} EXP." — có thể dùng "Em đổi được tối đa {N} EXP." |
| 6 | `chuKhongCan` | Thử đồ: dòng "Cần có" của món KHÔNG có điều kiện học | Không cần | không có (mục 9 chỉ có dạng "Cần chuỗi N ngày") |
| 7 | `chuKhongGioiHan` | Thử đồ: dòng "Số lượng" của món không giới hạn | Không giới hạn | không có (bảng 9.2 chỉ có "Chỉ còn N cái" / "Mùa 1 chỉ có N cái" / "Đã hết") |
| 8 | `chuMonKeChuaDu(ten, chiDuong)` | Cửa hàng: khi không còn món nào vừa số vàng — nói món rẻ nhất chưa có + [D1]/[D2] | {tên món}: {lời chỉ đường D1/D2} | [D1]–[D5] có lời chỉ đường nhưng KHÔNG có khuôn ghép với tên món |
| 9 | `chuNhanKhungTen` | Sân khấu thử đồ: dòng nhỏ trên khung tên thú | Tên em đặt cho thần thú | không có (chữ lấy từ mẫu phác 204d27e) |
| 10 | `chuThuCuaEm(ten?)` | Sân khấu: nhãn trợ năng của thú | Thần thú của em: {tên} | không có |
| 11 | `chuTheMon(ten, bac, gia, trangThai)` | Cửa hàng: nhãn trợ năng của thẻ món (chạm = thử) | Thử {tên}. {Bậc}. Giá {N vàng}. {trạng thái} | không có (bảy trạng thái ở 9.2 dùng làm phần cuối) |

Ghi chú: mục 1–4 và 10–11 chỉ là nhãn cho trình đọc màn hình; mục 5–9 hiện ra trên màn (5 là nhãn đầu mút thanh kéo, 9 là dòng nhỏ trên khung tên).
Không gấp: bản sống không có cửa vào Cửa hàng cho tới khi Boss bật cờ, nên các dòng này chưa hiện với học sinh nào.
