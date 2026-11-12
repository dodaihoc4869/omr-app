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
- **Chế độ Học (04) = BÊ NGUYÊN màn live hiện tại** (thầy 12/11: «Chế độ học bê nguyên live hiện tại sang nhé»): tờ chiếu, giấy đề, bảng đen, bút, thanh đáy LIVE, khay nút «thêm», phím tắt — không vẽ lại, không đổi vị trí. Chỉ THÊM hai thứ: công tắc **Học | Bảng** trên thanh đáy và cột «Tin nhắn lớp» đóng / mở (phím M) nổi trên vùng bảng trống.
- Chế độ Bảng (05): thanh đầu = trạng thái · sĩ số · công tắc Học | Bảng · viên «Âm thanh» · «Kết thúc live». Trái: 4 đội + kJ + hàng giơ tay. Giữa: bảng. Phải: cột «Tin nhắn lớp».

**Máy em (ngang 844 / 667 / 1180, ép ngang + toàn màn hình)**
- Trang chủ (06): thẻ Live ba trạng thái — đang mở (sáng, có nút «Tham gia») · có lịch · không có.
- Phòng chờ (08): đấu trường kín màn, 4 ngọn lửa ở 4 góc, cần điều khiển trái, «Tăng tốc» phải.
- Màn vào live (09): 4 ngọn lửa, tên từng em xếp dưới lửa đội; đội mình viền sáng. Hiện 3 giây rồi vào bài; mở lại từ thanh ẩn («Bốn đội»).
- **Chế độ Học (10) = BÊ NGUYÊN màn live máy em hiện tại** (hai khung giấy | bảng, thanh ẩn mép phải, cảnh báo, giơ tay, mic). Chỉ THÊM bong bóng chat vào thanh ẩn sẵn có. Bốn ngọn lửa + danh sách tên xem ở màn vào live và mục «Bốn đội» trong khay.
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

## Bản đã build (12/11) — khác đặc tả ở đâu
- **Lịch live không thêm bảng D1:** nằm trong một dòng `cau_hinh` (khoá `live_khoi`, JSON ≤ 30 buổi) ⇒ không migration. Lệnh: `/gv/bpu/khoi-ds | khoi-hen | khoi-huy | khoi-mo | khoi-bat-dau | khoi-xong`, `/hs/bpu/khoi-cua-em | khoi-vao` (`server/src/live-khoi.ts`).
- **Phòng theo khối = buổi học + phòng Bình Phản Ứng sẵn có.** Em bấm «Tham gia» ⇒ ghi điểm danh `cach = 'live'` ⇒ vào phòng như em có mặt (đội, kJ, trả lời). Cờ `live.khoi { k, gd, che }` của phòng quyết định phòng chờ / chế độ.
- **Thẻ Live máy em:** hỏi máy chủ lúc mở trang chủ, mỗi ~60 giây khi tab đang hiện, và ngay khi kênh đẩy báo `live` (thầy mở / hẹn / bắt đầu / kết thúc). Lịch hẹn chỉ hiện giờ + đếm ngược; **em vào được khi thầy đã mở phòng chờ** (không tự mở trước 10 phút — phòng cần máy thầy).
- **Nút «Bắt đầu live»:** trò dừng, máy em hiện màn Bốn đội 3 giây. Tiếng + bảng bắt đầu khi thầy chọn bài và tờ chiếu sẵn sàng (live tự bật một lần, lần đầu hỏi chọn mic như cũ).
- **Chế độ Học** = nguyên màn live cũ. **Chế độ Bảng:** tờ thầy ẩn giấy đề, bảng máy em phủ kín. Công tắc + nút «Tin nhắn» (phím M) nằm góc trên phải máy thầy.
- **Buổi dạy trên lớp («Lên bảng», trước là «Điểm danh»):** không còn nút Live trên bảng và trên tờ (cờ `co` chỉ bật khi phòng có `live.khoi`).
- **Nền bảng đen** của tờ chiếu, bảng Bình Phản Ứng và bảng live máy em: `#15181c` → xanh than `#131f24` (áp cho cả buổi trên lớp).
- **Chat:** 1 tin / 2 giây / em, 200 ký tự, phòng giữ 200 tin trong RAM, hết buổi là mất. **Trò Giữ Lửa:** máy em gửi ≤ 4 gói / giây, phòng phát một ảnh chụp / 250 ms, chỉ chạy ở phòng chờ; kJ của trò không vào kJ buổi học.
- Bộ thử trình duyệt thật: `scripts/thu-live-1011/thu-gv-that-1211.mjs` (37 kiểm, chạy ĐÚNG bảng Bình Phản Ứng + tờ chiếu thật của máy thầy, hai máy em ngang / dọc). Bộ cũ `thu-khoi-1211.mjs` thiếu bảng thật, chỉ còn để tham khảo.
- **Chưa thử:** lớp thật nhiều máy, tiếng thật qua SFU ở buổi live theo khối, iPhone thật (xoay hình), tải 80–100 em trong phòng chờ.

## Luồng chốt 12/11 (sau khi thầy thử bản sống) — bản này thay các mục trái với nó ở trên

1. **«Bắt đầu live»** ⇒ thầy và em CÙNG vào bảng danh sách bốn đội (sảnh). Tiếng thầy tự bật (không có nút Live nào phải bấm; thử lại mỗi 2 giây, tối đa 8 lần; có nút «Bật tiếng lại»). Máy em ép ngang suốt buổi (xoay hình nếu máy không khoá ngang được), mic em tắt.
2. Thầy chọn **Học** (chọn bài ⇒ bê nguyên buổi «Lên bảng»: bảng đua + tờ chiếu, máy em làm câu) hoặc **Bảng** (bảng xanh than kín màn). Máy em tự chuyển theo, không phải bấm gì.
3. **Chế độ Bảng:** giấy đề ẩn, cột bảng phủ kín tờ; máy em co bảng VỪA TRỌN màn (thấy hết bảng của thầy, không cuộn), khoá cứng ở bảng (không «chạm hai lần»). Bảng có một đường kẻ trắng mờ chia 2/3 trái · 1/3 phải, cùng chỗ trên máy thầy và máy em. Tờ báo một dải «giấy» mỏng dưới bảng để mã trang đủ hai ô (`lvVung` trong `src/lib/live-to-chieu.ts`).
4. **Esc** luôn lùi MỘT màn: nhắn tin → chọn bài → bài đang dạy → sảnh → Hôm nay. Ở Hôm nay nút Live thành «Kết thúc buổi» (bấm là kết thúc) + viên «Đang live · Vào lại».
5. **Máy thầy:** cụm Học | Bảng · Lớp · Tin nhắn ở thanh đáy (lên thanh trên khi bảng đua hiện); cột tin nhắn cao 1/3. Trong buổi live bảng đua không có nút «Đóng» và viên «Live».
6. **Máy em:** «Nhắn cả lớp» và «Bốn đội» nằm trong khay của thanh vàng (sự kiện cửa sổ `ddh-lk`); cửa nhắn tin cao 1/3 sát mép phải, tự đóng khi em vào làm câu. Danh sách bốn đội hiện ĐỦ tên, không cắt «…».
7. **Chưa thử:** lớp thật nhiều máy, tiếng thật qua SFU, iPhone thật.
8. **Bảng có trang riêng, giữ nét suốt buổi (thầy 12/11 «chuyển đi chuyển lại phải lưu trước đó»):** chế độ Bảng viết vào trang `bl` của bộ máy bút, tách khỏi nét của từng câu. App giữ bản sao nét theo mã buổi (`thay-noi.ts` `giuBang`) và trả lại khi tờ mới xin (`bang-xin` → `live-bang-nhap`) — bảng trắng ⇄ bài, đổi bài đều không mất. Tải lại trang thì mất bản sao (phòng vẫn còn sổ nét cho máy em).
9. **«Học» khi chưa có bài:** mở bảng chọn; chọn hoạt động (đầu giờ / chữa câu / ôn tập) ⇒ tấm hoạt động nổi TRÊN tờ; Esc đóng tấm ⇒ về bảng chọn.
10. **Mic của em (bản vẽ 05 + 12):** khay thanh vàng máy em có «Giơ tay» và «Mic của em» (tắt sẵn); ở bảng danh sách có nút giơ tay + tấm «Thầy mời em nói». Máy thầy: thẻ góc dưới-trái «N em giơ tay · Mời nói · Hạ hết tay», em đang nói có «Tắt mic em». Dùng nguyên luật đàm thoại đợt 2 của phòng (mỗi lúc một em nói, cả lớp nghe); cờ `GIAO_DIEN_DOT_2` của buổi trên lớp vẫn tắt.
11. **Bong bóng tin mới máy em:** gọn ở góc trên-phải (trong phần bảng), tối đa 30% bề ngang.
12. **Máy em chỉ vào «Học» khi có câu được CHIẾU (thầy 12/11):** thầy bấm «Học», mở bảng chọn, mở hoạt động — phòng chưa đổi chế độ, máy em ở nguyên màn đang xem. Phòng mở lượt mới (bất kể chiếu bằng đường nào) ⇒ app thầy mới báo «hoc». Phòng báo «hoc» mà chưa có lượt ⇒ máy em ở bảng danh sách. Em gửi xong / thầy gọi lên bảng ⇒ ép vào màn chiếu (luật sẵn có `cheLiveCua`).
13. **Cụm Học | Bảng · Lớp · Chọn bài · Tin nhắn nằm trong khay nút bốn ô của tờ** (nhóm «Buổi live», `lvLk` ở `src/lib/live-to-chieu.ts`; tờ báo bấm bằng việc `lk` → sự kiện `ddh-lkt`; số tin mới đi ngược bằng `ddh-lkt-moi` → lệnh `live-lk`). Cụm nổi của app chỉ còn lúc bảng đua đang hiện. Mở khay ⇒ cột tin nhắn tự thu.
14. **Chế độ Bảng ẩn thẻ tên** (thẻ em trên tờ, dải thẻ tên máy em) và ẩn các nhóm nút của câu trong khay.
15. **Màn câu hỏi khổ ngang giống chặng (áp cho cả buổi trên lớp):** kiểu phiếu rút gọn TẮT (`KIEU_PHIEU` ở `src/components/bpu/bo-cuc-ngang-do.ts`); cột trả lời hiện đủ chữ, Đúng–sai có nút Đúng | Sai đứng cạnh ý, cột tự cuộn.
16. **Tấm hoạt động ⇄ tờ: cái mở sau nằm trên** (`html[data-hd-tren]`, `gan-gv.tsx` `datHdTren`). Chiếu câu / gọi lên bảng TỪ tấm hoạt động ⇒ tờ lên trên, phòng sang «hoc», máy em vào màn chiếu; Esc ở tờ ⇒ tấm lên lại để chọn câu kế; Esc lần nữa ⇒ đóng tấm.
17. **Tấm hoạt động tự mở tờ RIÊNG** (Chữa câu khó, Kiểm tra đầu giờ… dựng `KhungXemPhieu` của mình, không qua `ganTo`): mục 16 sửa lại — KHÔNG nâng tấm lên trên tờ; lúc tấm ở trên thì ẩn tờ của bảng (`html[data-hd-tren] .lop-xem-phieu[aria-label="Tờ chiếu Bình Phản Ứng"]`), tờ riêng (z 99999) nằm trên tấm (z 99990) và giữ nút đóng. Tờ của bảng trong buổi live bỏ qua lệnh đóng khi tấm đang ở trên (sự kiện `popstate` do tờ riêng đóng).
18. **Một chiều ngang:** khoá `landscape-primary` (trùng chiều xoay hình CSS rotate 90°) — máy em không lật giữa hai chiều ngang.
19. **Mở phòng chờ tức thì:** `/gv/bpu/khoi-mo` = một đợt đọc song song + một batch ghi (chèn buổi + ghi lịch); app hỏi lại lịch khi máy chủ trả lời chậm và vào đúng phòng đã mở.
20. **«Học» không còn màn đua (thầy 12/11):** suốt buổi live bảng Bình Phản Ứng ẩn (`gan-gv.tsx` `apAnLive`, vẫn giữ nối phòng + luật lượt + kJ); thầy làm việc trên màn chiếu, mọi nút ở tờ + khay nút bốn ô.
21. **Máy em chọn đáp án NGAY TRÊN BẢNG (bản vẽ 15–18 đã duyệt):** live theo khối không có màn câu hỏi — em luôn ở màn chiếu (giấy đề + bảng). Lượt đang nhận trả lời ⇒ tấm `TamTra` (src/components/live/TamTra.tsx) neo đáy khung bảng: trắc nghiệm A–D, đúng–sai bốn hàng Đúng | Sai, trả lời ngắn ô số + phím số, tự luận «Em làm xong». Gửi xong ⇒ tự ẩn; thầy bấm «Lên bảng» (cờ phòng `bang` / đã gọi em) ⇒ tự ẩn dù chưa gửi. Lúc tấm hiện, khung bảng nới rộng ≥ 330 px (`KhungDocLap` `coTra`). Lựa chọn vẫn là trạng thái của màn Bình Phản Ứng (luật gửi / chấm giữ nguyên).
22. **Con dấu «ĐẠT» / «KHÔNG ĐẠT»** giữa bảng mọi máy em trong 3 giây khi thầy chấm em lên bảng (`DauDat`, kiểu đóng dấu mộc).
23. **Tay nắm vàng máy em:** chỉ còn hai chấm sáng rộng bằng thanh — loa đang bật (trên thanh, xanh; tắt thì ẩn), mic của em đang bật (dưới thanh, hồng, nhấp nháy). Dấu khác nằm trong khay.
24. **Xoay:** chỉ ĐIỆN THOẠI (chạm, cạnh ngắn < 600 px) mới xoay hình khi trang dọc; xoay về đúng phía em đang cầm (`src/components/live/chieu-xoay.ts`).
25. **Em quay lại app nối ngay** (`src/components/bpu/ve-lai-nhanh.ts`); tin nhắn lỡ được xin lại; tin của thầy hiện 12 giây; máy thầy bấm ra ngoài thì cột tin nhắn tự thu.
26. **Bút tự nắn khi nhấc bút** (`src/lib/but-bang-loi.ts` `nanHinh`, cả buổi trên lớp): đường kẻ ≥ 9 % bề dọc bảng và gần thẳng ⇒ đoạn thẳng (lệch < 6° ⇒ ngang / dọc hẳn); hình khép kín ≥ 9 % ⇒ tròn / elip, tam giác, chữ nhật ngay ngắn. Chữ viết, gạch ngắn, vòng khoanh nhỏ không bị đụng. Tắt: `taoSo({ nan: false })`.
27. **MỘT LUẬT ĐIỀU HƯỚNG MÁY THẦY** (thầy 12/11 «làm chuẩn logic đi, esc thì lùi lại, khi lùi lại rồi thì phải có nút về màn chiếu lưu lại mọi thứ tức thì»):
    - **Esc chỉ LÙI một màn, không đóng / huỷ gì:** tin nhắn → bảng chọn → (tờ chiếu từ tấm hoạt động ⇒ tấm) → bảng danh sách → Hôm nay. Tấm hoạt động chỉ đóng bằng nút của chính nó.
    - **«Về màn chiếu»:** ở bảng danh sách (khi đang có tờ / tấm) ⇒ về đúng màn trước khi lùi; nổi ở đáy tấm hoạt động (khi có tờ bên dưới) ⇒ tờ lên lại. Nét, lượt, đáp án em còn nguyên.
    - **«Học» ở bảng danh sách = mở bảng chọn** (một lần bấm, mảnh nạp sẵn); trong khay nút bốn ô: đang có bài ⇒ về bài, chưa có ⇒ bảng chọn. Chọn hoạt động từ bảng danh sách ⇒ tấm hiện ngay dù phòng còn «sanh».
    - **Đạt / Chưa đạt:** chỉ ghi kết quả + mở đáp án + con dấu máy em; máy thầy Ở NGUYÊN màn chiếu (không phóng bảng đua, không che tờ).
    - **Không tự toàn màn hình** trong buổi live; bỏ hẳn cụm nút nổi của app (`.lkt-vien`).
28. **Chữ đề trên máy em to hơn** (thầy 12/11 «chữ hiện tại nhỏ quá»). Máy em soi ĐÚNG cách xuống dòng của giấy thầy (để nét gạch chân khớp chữ) ⇒ cỡ chữ máy em = cỡ chữ tờ × bề ngang giấy. Ba việc:
    - Buổi live: tờ của thầy mặc định **«Chữ rất lớn» (1,2)**; thầy đổi ở Cài đặt của tờ («Cỡ chữ đề») thì máy em theo ngay; nhớ riêng cho live (`mc-lk-scale`), cỡ chữ buổi trên lớp không đổi (`src/lib/live-to-chieu.ts` `lvCoChu`).
    - Đang chọn đáp án: màn rộng (máy tính bảng, máy tính) giấy nới tới 70 % bề ngang, bảng còn ≥ 420 px cho tấm chọn; điện thoại giữ 60 % (`KhungDocLap.tsx`).
    - Câu có hình / bảng (máy em dựng riêng, `GiayDe`): hệ số phóng 1–1,9 … 1,3–3,2 (trước 1–1,6 … 1,25–2,6).
    - Giới hạn nói thẳng: muốn to hơn nữa thì chọn «Chữ cực lớn»; đề dài khi ấy tờ thầy phải lật trang / cuộn.
29. **«Lên bảng» và Đạt / Chưa đạt làm NGAY TRÊN TỜ, tới được máy em** (thầy 12/11 «lên bảng máy hs chưa hiện thông báo, bấm đạt không đạt cũng chưa hiện»). Buổi live bảng Bình Phản Ứng ẩn nên tờ phải báo app, app gửi lệnh vào phòng (`src/lib/live-khoi-to-chieu.ts`, `src/components/live/thay-noi.ts` việc `len` / `cham`):
    - Tờ có em xếp sẵn (Chữa câu khó, đầu giờ…): L / «Lên bảng» / «Gọi em khác» ⇒ phòng gọi ĐÚNG em trên thẻ tên; em chưa vào phòng live ⇒ tờ báo thầy gọi em khác.
    - Tờ bài chọn từ kho (thẻ «Cả lớp» / chưa có thẻ): nút «Lên bảng» luôn bấm được ⇒ bảng (đang ẩn) chọn em đúng luật phím L rồi giao lại cho tờ, mời luôn (một lần bấm).
    - Chấm (nút, D / K) ⇒ phòng ghi + mở đáp án ⇒ máy em hiện con dấu; máy thầy ở nguyên màn chiếu.
30. **«Học» trong khay khi màn Học là tấm hoạt động:** về đúng tấm (và tờ của nó), không ra bảng chọn. Bảng chọn «Hôm nay làm gì?» có nút «Về màn chiếu». Chế độ Bảng ẩn cả thẻ tên em vừa lên bảng.
31. **Toàn màn hình máy thầy chặn tại gốc** suốt phiên live (`gan-gv.tsx` `khoaToanMan`), phím F trên tờ không bật toàn màn hình; nút «Toàn màn hình» trong Cài đặt của tờ còn cho lúc thầy chủ động. **Máy em chỉ ép ngang** (`lock('landscape')`), cầm bên nào cũng được.
32. **Nút ống nghiệm «Ai đã nộp»** (thầy 12/11, bản vẽ `docs/ban-ve-live-moi-1211/19–22` duyệt «ok chốt build»): trên thanh đáy của tờ, ngay cạnh nút bốn ô, CHỈ ở buổi live theo khối đang «Học» và đang có câu.
    - Nút: ống nghiệm (mực dâng theo tỉ lệ đã nộp) + «N/tổng đã nộp». Có em vừa gửi ⇒ tia lửa xoắn ốc từ đáy lên quá miệng ống + nháy viền + dòng «Tên vừa gửi · m:ss» (máy yếu / giảm chuyển động: chỉ nháy viền).
    - Bấm ⇒ tấm chỉ phủ CỘT BẢNG ĐEN (giấy đề, thanh đáy giữ nguyên): số đã nộp, thanh đúng / sai, «Đã nộp» xếp nhanh nhất trước (hạng · màu đội · tên đủ · giây · đáp án · đúng / sai; tự luận không chấm; em báo «chưa biết làm» ghi rõ), «Chưa nộp» = em có mặt chưa gửi. Bấm lần nữa để đóng.
    - Dữ liệu: view của THẦY thêm `luot.nop` (chỉ khi phòng có cờ khối — `src/lib/bpu/phong.ts`); app gửi tờ lệnh `live-nop` (`thay-noi.ts` `guiNop`); tờ vẽ `src/lib/live-nop-to-chieu.ts`. Máy em không bao giờ nhận.
    - Viên nhắc cũ «Lượt đang mở · N em chưa gửi» không hiện ở buổi live theo khối (nút đã đếm). Nút bốn ô nay là viên bo góc 64 % nằm giữa vùng bấm (vùng bấm giữ nguyên).
33. **Chọn đáp án NGAY TRÊN ĐỀ** (thầy 12/11 chiều, bản vẽ `docs/ban-ve-live-moi-1211/23–27` duyệt «ok chốt build đẩy vượt luôn») — thay mục 22 (tấm trong khung bảng):
    - Dải chọn neo đáy khung GIẤY ĐỀ (`KhungDocLap` `duoiGiay`, `TamTra.tsx`): trắc nghiệm A B C D · Đúng–sai bốn nhóm a–d · trả lời ngắn ô số + phím số · nút gửi; ghi «n/m bạn đã gửi». Vùng đọc / cuộn của đề dừng ngay trên dải. Điện thoại ngang: dải gọn một hàng, ẩn dòng tiêu đề.
    - Bảng đen KHÔNG còn tấm chọn ⇒ đang chọn thì giấy rộng 78 % (em kéo vạch chia tới 90 %).
    - Gửi xong / thầy bấm «Lên bảng» ⇒ dải tự ẩn như cũ.
34. **Con dấu ĐẠT / KHÔNG ĐẠT đóng giữa CẢ MÀN, đè cả sang phần đề**, kèm tên em lên bảng, 3 giây (`TamTra.tsx` `DauDat`, vẽ ở gốc màn live). **Máy thầy cũng đóng dấu** trên màn chiếu khi chấm (`src/lib/live-khoi-to-chieu.ts` `lvDau`, mọi đường chấm của tờ). **Dải dưới bỏ thẻ «Đạt / Chưa đạt»** — chỉ còn kết quả của chính em (`DaiLuot.tsx`).
35. **Chuyển Học ⇄ Bảng: một nguồn nét, đổi tức thì, phím Tab** (thầy 12/11 «khi chuyển qua lại hai chế độ thì bị lỗi tọa độ bút» · «phải cực kì mượt mà chuẩn xác, lưu lại mọi thứ … cho tôi một phím tắt»):
    - GỐC LỖI: buổi live có thể có hai tờ cùng sống (tờ bài / tờ riêng của tấm hoạt động + bảng trắng bị che); tờ nào gửi tin sau cùng thì thành nguồn ⇒ nét và ô bảng lẫn nhau trên máy em. Nay nguồn = tờ ĐANG HIỆN TRÊN CÙNG (`thay-noi.ts` `toTren` / `chonTo`); tờ bị che gửi gì cũng bỏ; đổi nguồn ⇒ tờ mới gửi lại toàn bộ bảng (`live-anh`).
    - «Bảng» dùng CHÍNH tờ đang hiện (trang bút riêng `bl`), không dựng tờ thứ hai (`LopNoiThay` `doiChe`, `gan-gv` `toDangHien`). Bảng trắng chỉ dựng khi chưa có tờ nào hiện.
    - Tờ đổi bố cục TRƯỚC rồi mới đổi trang bút ⇒ ô giấy / ô bảng gửi máy em đúng ngay từ sự kiện đầu (`live-to-chieu.ts` `lvCheBang`); thầy bấm thì tờ đổi NGAY, phòng xác nhận sau (`lvDoiChe`).
    - **Phím Tab** = đổi Học ⇄ Bảng (trong tờ và ở cửa sổ app khi đang ở tấm hoạt động); khay ghi «phím Tab đổi Học ⇄ Bảng».
36. **Máy em không còn lệnh khoá xoay của hệ điều hành** (thầy 12/11 lần 3 «khi vào live màn hình học sinh vẫn tự quay một lần, bỏ triệt để — ép ngang nhưng không khoá xoay»): máy dọc ⇒ xoay hình trong app (`chieu-xoay.ts`); em xoay máy tự do.
37. **Dải chọn đáp án thu về THANH XÁM ở mép dưới đề** (thầy 12/11 tối, bản vẽ `docs/ban-ve-live-moi-1211/28–30` «chốt build rồi đẩy luôn»; `TamTra.tsx`):
    - Câu mới ⇒ chỉ có thanh xám nhỏ giữa mép dưới đề + dòng «Chạm thanh xám để chọn đáp án» hiện 5 giây rồi tự ẩn; cả trang đề để đọc.
    - Chạm thanh ⇒ dải chọn hiện (mục 33); 6 giây không chạm / không đổi lựa chọn ⇒ dải tự thu. Lựa chọn dở vẫn giữ, cạnh thanh có chấm nhắc. Trên đầu dải có thanh nhỏ để chạm thu lại.
    - Gửi xong / thầy bấm «Lên bảng» ⇒ ẩn hẳn như cũ.
38. **Em ẩn app / sang app khác / tắt màn VẪN NGHE tiếng thầy, kết nối giữ tới hết live** (thầy 12/11 tối «học sinh thoát app ẩn vẫn phải nghe thấy tiếng của thầy, giữ kết nối tới lúc kết thúc live»; `src/lib/live/em.ts`, `src/lib/live/giu-nen.ts`):
    - Bỏ luật cũ ở đặc tả live bảng 4.7 «rời màn ⇒ tiếng ngừng»: tiếng thầy / tiếng bạn không còn tắt theo cờ rời màn. Rời màn chỉ còn: tắt mic của em, thôi vẽ điểm đang viết (nét xong vẫn tới qua sổ), tên em hiện ở máy thầy như cũ.
    - Khai buổi đang phát với hệ điều hành (thẻ ở màn khoá / tai nghe ghi «Thầy đang live»); nút tạm dừng ở đó KHÔNG dừng được tiếng. Thẻ tiếng bị hệ thống dừng (cuộc gọi, app khác chiếm loa) ⇒ 0,8 giây sau tự phát lại.
    - Kết nối phòng và đường tiếng vẫn tự nối lại như cũ khi rớt (không phụ thuộc trang đang hiện hay ẩn).
    - GIỚI HẠN không sửa được bằng mã: em VUỐT TẮT HẲN app / đóng thẻ trình duyệt thì hết tiếng; iPhone bật «Chế độ nguồn điện thấp» hoặc app cài ra màn hình chính đời iOS cũ có thể bị hệ thống treo trang nền.
39. **MÁY TÍNH «Đỗ Đại Học FX4869» trên màn chiếu** (thầy 12/11 tối, bản vẽ `docs/ban-ve-live-moi-1211/31–34` «ok chốt build toàn bộ chức năng rồi đẩy khẩn»):
    - **Nút máy tính** trên thanh đáy của tờ (trước ống nghiệm và nút bốn ô; `src/lib/live-mt-to-chieu.ts`), chỉ có ở buổi live theo khối. Bấm ⇒ máy tính nổi trên màn chiếu; bấm lần nữa ⇒ ẩn. Nút sáng vàng khi máy tính đang hiện. Ở bảng danh sách / bảng chọn máy tính tạm cất, về màn chiếu hiện lại nguyên chỗ, nguyên phép tính.
    - **Kéo**: nắm thanh trên cùng («Đỗ Đại Học FX4869») kéo đi khắp màn, không ra ngoài mép. Lần đầu hiện sát mép phải, ngay trên thanh đáy.
    - **Máy em chỉ xem**: thấy đúng màn hình, đúng phím thầy vừa bấm (nháy viền), cùng vị trí tương đối; không bắt chạm nên em vẫn kéo đề / chọn đáp án. Thầy ẩn, hoặc máy thầy im quá 13 giây ⇒ máy em tự cất. Đồng bộ qua kênh lớp `k: 'mt'` (`server/src/kenh-lop-may.ts` chỉ chuyển tiếp tin của thầy, 0 D1, không nhớ; máy thầy nhắc lại mỗi 4 giây cho em vào muộn).
    - **Tính được** (`src/lib/may-tinh/`): + − × ÷, ngoặc, nhân ngầm (2π); phân số và hỗn số kiểu sách, S⇔D, a b/c; x², x³, x⁻¹, x▫, √, ∛, ʸ√; x!, nCr, nPr; log, ln, 10ˣ, eˣ; sin cos tan và hàm ngược (độ / radian); π, e; ×10ˣ; %; Abs; ° ′ ″ (nhập); Ans, STO / RCL biến A–F, x, y; M+ M−; ENG; ▲▼ gọi lại phép tính cũ. Số hữu tỉ giữ CHÍNH XÁC (phân số), còn lại 10 chữ số có nghĩa. Biểu thức có dấu phẩy thập phân ⇒ kết quả hiện thập phân trước; toàn số nguyên / phân số ⇒ hiện phân số trước.
    - **MENU**: 1 Tính toán · 2 Phương trình bậc 2 / 3 / 4 (nghiệm hữu tỉ ra phân số, nghiệm phức ra a ± bi) · 3 Hệ bậc nhất 2 / 3 / 4 ẩn · 4 Bảng giá trị f(x) (tối đa 30 dòng) · 5 Thống kê một biến (n, x̄, Σx, Σx², σx, sx, min, Med, max) · 6 Cài đặt (độ / radian, Fix 0–9, kiểu hiện số nhỏ).
    - **KHÔNG làm ở bản này**: số phức (ngoài nghiệm phương trình), ma trận, vectơ, tích phân / đạo hàm số, SOLVE / CALC, bất phương trình, hệ đếm cơ số, thống kê hai biến, phân phối xác suất, đổi kết quả sang ° ′ ″, gõ bằng bàn phím máy tính (chỉ bấm bằng chuột / chạm — tránh giẫm phím tắt của tờ). Kết quả vô tỉ không hiện dạng căn (√2 hiện 1,414213562).
    - Khác bản vẽ hai chữ nhỏ: phím ENG ghi «π» (thay «∠» của số phức), phím «)» ghi «Abs» (thay dấu phẩy ngăn đối số — không có hàm hai đối số); thêm chữ đỏ A–F, x, y, M (biến nhớ) và nPr / nCr.
40. **Cảnh báo «Rời màn hình» trên màn thầy chỉ to 2 GIÂY** (thầy 12/11 tối, ảnh phòng chờ khối: «chỉ hiện 2 giây rồi ẩn xuống dưới nhấp nháy, khi ẩn xuống bỏ hiệu ứng nhấp nháy xung quanh màn hình»; `src/components/bpu/BaoRoiMan.tsx`): có em MỚI rời ⇒ thẻ đỏ to + viền đỏ 2 giây ⇒ thu thành viên nhỏ nhấp nháy ở mép dưới (tên các em đang ở ngoài), không còn viền quanh màn. Em quay lại bớt ⇒ viên cập nhật tên, không bật to lại; về hết ⇒ mất. Áp cho mọi chỗ dùng bảng Bình Phản Ứng (cả buổi trên lớp) — thay bản 09/11 phủ to suốt lúc em còn ở ngoài.
41. **Máy tính học sinh thấy và bấm được tay nắm mép phải** (thầy 12/11 tối «màn hình trên máy tính học sinh không có nút vàng bên phải để bấm»): trên Windows thanh cuộn của bảng nằm đúng mép phải, đè lên tay nắm 5 px ⇒ bảng live ẩn thanh cuộn (lăn chuột / kéo / «Về chỗ thầy đang viết» vẫn cuộn); máy dùng chuột thì tay nắm 8 × 64, rõ hẳn (`live-em.css`).
