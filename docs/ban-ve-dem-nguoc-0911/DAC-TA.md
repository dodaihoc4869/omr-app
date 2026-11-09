# Đếm ngược ngày thi tốt nghiệp THPT (22/06/2027) — đặc tả 7 mục (09/11/2026, chờ thầy duyệt)

Thầy: «làm thêm một cái gì đó đếm ngược ngày thi đại học (22/6/2027) siêu đẹp tinh tế hiện ở trên app học sinh lớp 12 thôi nhé».

## 1. Mục tiêu + ai dùng
- CHỈ học sinh lớp 12 (tên lớp hiệu lực bắt đầu bằng «12»), màn Hôm nay của app học sinh. Lớp 10, 11, app thầy, app phụ huynh: không hiện.
- Nhắc em mỗi ngày còn bao nhiêu ngày, nối với nhịp 28 câu/ngày — động lực, không gây hoảng.

## 2. Bố cục (ảnh `dt-*` 390 px, `mb-*` 820 px, `mt-*` 1366 px; sáng / tối)
- Thẻ ngay dưới lời chào, trên Việc hôm nay. Trái: ô số lớn (mặt tô + gờ nổi như nút app) «225 NGÀY». Phải: nhãn trạng thái · «Thi tốt nghiệp THPT» · «Thứ Ba · 22/06/2027» · «≈ 32 tuần · đủ 28 câu mỗi ngày là thêm 6.300 câu» · mép phải: **ống nghiệm có vạch chia 25/50/75 %** (thầy 09/11 «chèn vào khung ống thí nghiệm cho tinh tế») — mực chất lỏng = phần năm học lớp 12 đã đi (22 %), mặt khum, bọt khí tĩnh, nhãn «22 % năm học»; máy tính thêm dòng «đã đi 22 % năm học lớp 12 · từ khai giảng 05/09». Chất lỏng đổi màu theo chặng như ô số.
- Màu theo chặng (đúng bảng màu app học sinh `trong-hs-mau.css`, không thêm màu): còn > 30 ngày chàm «ĐẾM NGƯỢC» (`*-1-binh`) · ≤ 30 ngày cam «CHẶNG NƯỚC RÚT» (`*-2-gap`) · ≤ 7 ngày cam «TUẦN CUỐI» (`*-3-tuan`) · đúng ngày thi xanh lục «HÔM NAY» + mũ tốt nghiệp + lời chúc (`*-4-thi`). Sau ngày thi: thẻ ẩn.

## 3. Trạng thái
- Tính theo NGÀY GIỜ VIỆT NAM (đổi số lúc 0 h), giờ máy chủ (`gio-may-chu`) để máy em đặt sai giờ vẫn đúng. Không cần mạng riêng — chỉ một phép tính.
- Máy yếu (`ddh.mayYeu`): không chuyển động. Không có hiệu ứng nhấp nháy.

## 4. Dữ liệu
- Không bảng mới, không lệnh máy chủ mới. Ngày thi + ngày khai giảng là hằng số (một chỗ, dễ đổi): 22/06/2027 (thầy đưa) · 05/09/2026 (giả định ngày khai giảng — chỉ dùng cho thanh %).
- «Lớp 12» đọc từ thông tin lớp em đã có ở app.

## 5. Ngoại lệ
- Em đổi lớp 11 → 12 giữa năm: lần mở kế tiếp hiện thẻ. Số «6.300 câu» = số ngày còn × 28, không tính ngày đã qua.

## 6. Chi phí máy chủ
- 0 lệnh D1. Thêm < 1 KB vào gói màn Hôm nay (đo bằng `kiem:toc-do`).

## 7. Nghiệm thu
- Test: lớp 12 hiện, lớp 10/11 không; đúng 225 ngày ngày 09/11/2026, 23 ngày 30/05/2027 (nước rút), 0 ⇒ «HÔM NAY», 23/06/2027 ⇒ ẩn; đổi ngày đúng 0 h giờ Việt Nam.
- Ảnh 3 khổ × sáng/tối: 0 tràn ngang (đã đạt ở bản vẽ, `chup.mjs`). Cổng tốc độ 0 đỏ.
