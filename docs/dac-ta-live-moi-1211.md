# Đặc tả Live mới — 12/11/2026 (bước 2 của quy trình 4 bước, CHỜ THẦY DUYỆT ẢNH)

Bản vẽ: `docs/ban-ve-live-moi-1211/` (28 ảnh Chromium, `mo-phong.html` + `chup.mjs`). Chưa build gì.

## 1. Mục tiêu và ai dùng
- **Thầy:** mở live cho cả KHỐI (10 / 11 / 12) từ một nút Live riêng — mở ngay, hẹn lịch, xem lại. Trong live đổi qua lại hai chế độ **Học** (đề + chấm, bê nguyên bộ chọn bài / Dạy học / Ôn bài cũ / Chữa câu khó đang có) và **Bảng** (bảng xanh than kín màn để giảng lý thuyết).
- **Học sinh:** nút Live sáng khi thầy mở cho khối mình ⇒ «Tham gia» ⇒ phòng chờ chơi trò «Giữ Lửa» theo 4 đội ⇒ thầy bấm Bắt đầu thì cả lớp vào live cùng lúc.
- **Cảm giác:** tức thì, nét (vẽ lại bằng mã, không quay màn hình), dịu mắt (nền xanh than `--tr-nen #131f24`), vui vì có đội.
- **Gỡ:** live rời khỏi màn Điểm danh. Màn đó trở lại chỉ để dạy trên lớp + gọi lên bảng; nút ở app thầy đổi tên **«Lên bảng»**.

## 2. Bố cục
**App thầy (1366 / 1920)**
- Nút Live (ảnh 01, 02): ba thẻ «Mở live ngay · Hẹn lịch live · Xem lại live»; dưới là ba ô khối có số em; một nút chính «Mở phòng chờ Khối 12».
- Phòng chờ (03): trái là đấu trường nhìn từ trên; phải là 4 đội + số em + nút lớn «Bắt đầu live».
- Đang live (04, 05): thanh đầu = trạng thái · sĩ số · công tắc **Học | Bảng** ở giữa · một viên «Âm thanh» (gom mic, loa, kiểu tiếng, thẻ «Đang nói» vào một khay) · «Kết thúc live». Trái: 4 đội + kJ + hàng giơ tay. Giữa: sân (đề hoặc bảng). Phải: cột «Tin nhắn lớp».

**Máy em (ngang 844 / 667 / 1180, ép ngang + toàn màn hình)**
- Trang chủ (06): thẻ Live ba trạng thái — đang mở (sáng, có nút «Tham gia») · có lịch · không có.
- Phòng chờ (08): đấu trường kín màn, 4 ngọn lửa ở 4 góc, cần điều khiển trái, «Tăng tốc» phải.
- Màn vào live (09): 4 ngọn lửa, tên từng em xếp dưới lửa đội; đội mình viền sáng. Hiện 3 giây rồi vào bài; mở lại từ thanh ẩn («Bốn đội»).
- Chế độ Học (10): cột trái = 4 lửa + kJ + danh sách đội mình; giữa = đề | phương án.
- Chế độ Bảng (11): cột trái thu thành dải 44 px (4 lửa nhỏ), bảng chiếm hết.
- **Thanh ẩn mép phải 44 px:** chỉ còn mũi tên, bong bóng chat (số tin mới), dấu loa. Mọi chức năng khác nằm trong khay (12): nhắn, giơ tay, mic, tiếng thầy, bốn đội, toàn màn hình, rời live.
- Chat (13): cửa nổi bên phải, có 4 câu bấm nhanh; đóng lại thì tin mới hiện thành bong bóng nhỏ 4 giây cạnh thanh ẩn rồi tự mờ (11).

## 3. Trạng thái
| Trạng thái | Hiện gì |
|---|---|
| Không có live cho khối | Thẻ Live mờ, không bấm được |
| Có lịch | Giờ + tên buổi + đếm ngược; 10 phút trước giờ thẻ sáng, vào phòng chờ được |
| Phòng chờ | Trò Giữ Lửa; em vào sau xếp vào đội ít người nhất |
| Thầy bấm Bắt đầu | Trò dừng, màn 4 đội 3 giây, vào chế độ thầy đang chọn |
| Đổi Học ↔ Bảng | Hai lớp cùng nằm sẵn trong trang, chỉ đổi `opacity` + `transform` 250 ms; không nạp lại, không mất nét bảng, không mất câu đang làm |
| Máy dọc (07) | Chắn «Xoay ngang máy để vào live» |
| Rời màn (14) | Cảnh báo như hiện tại, áp cho CẢ hai chế độ; thầy thấy ở thẻ đội |
| Mất mạng | Dải «Đang nối lại…»; nối lại thì xin sổ nét + trạng thái phòng, chat trong lúc mất không bù |
| Thầy kết thúc | Màn tổng kết đội thắng, về trang chủ; buổi vào «Xem lại live» |

## 4. Dữ liệu
- **Đang có, dùng lại nguyên:** phòng live `LiveMay` (`server/src/phong-live.ts`), SFU + DataChannel nét bảng (`src/lib/live/sfu.ts`), tiếng (`thay.ts`, `em.ts`, `thang-mic.ts`, `loa.ts`), 4 đội `DOI_BPU` + `chiaDoi` (`src/lib/bpu/phong.ts`), ngọn lửa `NgonLua`, luật màn + xoay (`bpu/luat-man-live.tsx`, `LopLive.tsx`), khối của em `khoiCuaEm` (`src/lib/khoi-cau.ts`), xem lại (`screens/live-xem-lai/`), bộ chọn bài (`day-hoc/DayHocLenBang.tsx`).
- **Cần thêm ở máy chủ (chỉ-thêm):**
  1. Bảng `live_lich` (id, khối, lúc bắt đầu, tên buổi, trạng thái `hen | cho | dang | xong`). Mở ngay = một dòng trạng thái `cho`.
  2. Trường `live` trong lệnh trang chủ em đang gọi sẵn: `{ trangThai, khoi, luc, ten }` cho đúng khối của em (không thêm lệnh, không thêm vòng chờ).
  3. Phòng live khoá theo KHỐI thay cho lớp; thêm ba loại khung qua kênh phòng: `che` (Học / Bảng), `chat`, `tro` (trò chơi).
- **Chat «không qua máy chủ»:** đi trên kênh dữ liệu sẵn có của phòng (DataChannel, dự phòng WebSocket), phòng chỉ chuyển tiếp trong bộ nhớ. Không D1, không lệnh HTTP. Giữ 200 tin gần nhất trong RAM phòng cho em vào muộn; hết buổi là mất (không vào bản xem lại) — **cần thầy xác nhận.**
- **Trò Giữ Lửa:** mỗi em là một đốm lửa màu đội. Gom hạt năng lượng để lớn; đốm lớn chạm đốm nhỏ đội khác thì «thu phục» (em bị thu phục hồi sinh ở góc đội sau 3 giây); mang năng lượng về góc để lửa đội lên cấp; vòng lạnh co dần ép vào giữa, 90 giây một ván rồi mở lại. Máy em tự mô phỏng, chỉ gửi vị trí 5 lần / giây + sự kiện; phòng không chấm, không ghi. **kJ trong trò KHÔNG cộng vào kJ buổi học** (giả định — tránh em vào sớm lợi điểm).

## 5. Ngoại lệ
- Em khác khối mở đường dẫn live: bị chặn ở máy chủ, không chỉ ẩn nút.
- Thầy mở hai khối cùng lúc: không cho; một lúc một phòng.
- Hẹn lịch nhưng thầy không vào: sau 30 phút thẻ tắt sáng.
- Bấm «Bắt đầu» lặp, đổi chế độ liên tục: lệnh mang số thứ tự, máy em chỉ theo số lớn nhất.
- 80–100 em trong trò: máy yếu (`ddh.mayYeu`) / giảm chuyển động ⇒ tắt hào quang, vẽ 30 khung / giây, chỉ vẽ đốm trong tầm nhìn.
- Chat: 1 tin / 2 giây / em, tối đa 200 ký tự; thầy tắt chat cả lớp hoặc một em. Công thức gõ thường (CH3COONa) hiển thị chỉ số dưới.
- iPhone không khoá xoay được: xoay hình bằng CSS như hiện tại.
- Câu thi / kiểm tra: đáp án vẫn không xuống máy em trước khi nộp (không đổi luật).

## 6. Chi phí máy chủ
- Mở trang chủ em: +0 lượt D1 nối tiếp (trường `live` đọc song song trong lệnh sẵn có, 1 câu `SELECT` theo chỉ mục khối + trạng thái).
- Mở / hẹn / bắt đầu / kết thúc: 1 lượt ghi D1 mỗi lần bấm của thầy.
- Trong live: chat, trò chơi, đổi chế độ = 0 D1. Durable Object chỉ chuyển tiếp; trò chơi ≈ 5 khung nhỏ / giây / em, **chỉ chạy ở phòng chờ** và tắt hẳn khi vào live ⇒ không cộng thêm chi phí trong giờ dạy. Sẽ đo số yêu cầu DO của một phòng chờ 100 em 5 phút bằng dữ liệu giả trước khi phát hành (gói 5 USD).
- Mã live mới nạp lười, không vào gói mở app.

## 7. Nghiệm thu đo bằng máy
- Vitest mới: `live-lich` (hẹn, sáng trước 10 phút, tắt sau 30 phút, chặn khác khối) · `live-che-do` (đổi Học ↔ Bảng giữ nét + câu, theo số thứ tự) · `live-chat` (giới hạn nhịp, cắt 200 ký tự, tắt chat) · `tro-giu-lua-loi` (lõi thuần: gom, thu phục, hồi sinh, vòng co, chia đội cân) · `diem-danh-khong-live` (màn Lên bảng không còn mã live, gọi lên bảng chạy như cũ).
- `tsc -b`, `npm run build && npm run kiem:toc-do` 0 đỏ, `kiem:mau-giu` 0, `check:mau`, `kiem:co-tep`, `kiem-sw`.
- Chromium 2 máy thật (thầy + em): đổi chế độ < 300 ms; tin chat tới máy khác < 300 ms; 0 lỗi trang, 0 tràn, 0 đích bấm < 44 px ở 844 / 667 / 1180 và 1366 / 1920.
- Tác tử `toc-do` sau khi gộp.

## Việc cần thầy chốt
1. Bố cục 28 ảnh.
2. Chat hết buổi là mất (không lưu vào xem lại)?
3. kJ trong trò phòng chờ không tính vào kJ buổi học?
4. Tên trò «Giữ Lửa» và luật ở mục 4.
5. Đội chia lại mỗi buổi live theo khối (không lấy đội của lớp trên lớp)?
