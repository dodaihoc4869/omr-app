# Bình Phản Ứng: điểm danh, cả lớp cùng làm câu thầy chiếu, gọi lên bảng, thi đua đội, vinh danh (đặc tả 7 mục + bản vẽ, 06/11/2026, CHỜ THẦY DUYỆT)

## Thầy yêu cầu (06/11, theo thứ tự)
1. «đề xuất tất cả phần chiếu đề lên bảng, khi chiếu đề nào thì học sinh ở dưới nhận được đề trên app của mình hiện full màn hình giống với các chặng, học sinh chọn đáp án thì hiện lên bảng … thiết kế một hoạt hoạ hay trò chơi gì đó siêu đẹp siêu cuốn … Đề xuất cho tôi trước khi tôi duyệt build»
2. «học sinh ko thoát được màn hình, nếu thoát có cảnh báo trên màn chiếu ngay. Một hoạt hoạ đẹp hấp dẫn sau khi tất cả học sinh chọn xong để gọi 1 học sinh phù hợp nhất với câu đó lên bảng dựa vào toàn bộ lịch sử làm bài trên app của hs đó, ghi rõ lý do vì sao chọn lên bảng»
3. «thiết kế toàn bộ phần lên bảng phải khiến học sinh thi đua nhau hú hét, hấp dẫn hơn nữa»
4. «bỏ kiểu điểm danh hiện tại, thiết kế lại toàn bộ cho phù hợp với hiện tại game lên bảng này»
5. «bỏ từ mẻ đi, chuyển thành lượt» · «phần vinh danh làm cho kiểu đẹp và rực rỡ hơn nữa» · «vẽ vector cho siêu nét nhé»

## Bản vẽ
- **Bản chạy thử có hoạt hoạ thật:** `nguyen-mau.html`, cũng là trang Artifact gửi thầy.
  - Lớp mô phỏng 32 em tự chạy trọn buổi: điểm danh → 4 lượt → tổng kết.
  - Thầy chạm được vào máy em để tự chơi.
- **Ảnh Chromium thật:** `anh/` (67 ảnh). Chụp lại bằng `node docs/ban-ve-binh-phan-ung-0611/chup.mjs`, không cần build.
  - Bảng chiếu 1920×1080, nền máy chiếu tối và sáng.
  - Máy em 390 dọc, 844 ngang, 1440 máy tính, sáng và tối.
  - Điện thoại thầy.
- **Soát:**
  - `soat.txt`: 0 lỗi trang · 0 tràn ngang · 0 đích bấm < 44 px.
  - Một vòng tự chạy trọn buổi có hoạt hoạ (không giảm chuyển động): 0 lỗi trang; trang 390 px không tràn.
- **Vector:**
  - Ngọc, huy hiệu đội, ngọn lửa ở màn vinh danh là SVG.
  - Bình cầu, ống nghiệm, ngọn lửa đua là đường vẽ canvas, vẽ lại theo đúng độ phân giải màn × mật độ điểm ảnh. Máy chiếu 4K vẫn nét, không phóng ảnh.
- **Chưa build gì** trong `src/` và `server/`.

## 0. Ý tưởng một câu và từ mới
- **Đội:** mỗi em thuộc một trong **bốn đội màu thử ngọn lửa**: Natri vàng · Kali tím · Đồng xanh lục lam · Canxi đỏ cam. Đây là màu thật của phép thử ngọn lửa, dùng biến màu sẵn có `--tr-sao`, `--tr-tim`, `--tr-tin`, `--tr-chu-y`.
- **Bảng chiếu:**
  - Chân bảng là «bảng tuần hoàn lớp»: mỗi em một ô nguyên tố, vạch màu đội.
  - Giữa bảng là bình cầu; em gửi đáp án thì một giọt sáng bay vào bình.
- **Vòng một lượt:** cả lớp gửi xong → electron nhảy qua các ô rồi dừng ở **một em được mời lên bảng**, kèm lý do → cả lớp **đoán** bạn đúng hay sai và **tiếp sức** bằng điện thoại.
- **Mở đáp án:** bình rót sang **ống nghiệm** theo số em chọn; ống đúng **đổi màu như chất chỉ thị**; ô em đúng **kết tinh**.
- **Sau mỗi lượt:** bốn đội **đua ngọn lửa**.
- **Cuối buổi:** **vinh danh** đội vô địch và ba em kết tinh nhiều nhất.

Bản sắc là phòng thí nghiệm Hoá, không vay giao diện trò đố vui có sẵn.

**Từ mới đề nghị thêm vào bảng A2** (`docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`):

| Khái niệm | Từ chuẩn | Ghi chú / không dùng |
|---|---|---|
| Hoạt động cả lớp cùng làm câu thầy chiếu | **Bình Phản Ứng** | không dùng «Phản ứng dây chuyền» (đã là băng combo chặng) |
| Một câu trong hoạt động | **Lượt** («Lượt 2/4», «Lượt tiếp») | thầy chốt 06/11, bỏ «mẻ». App thầy đã có «lượt/ngày» ở chiến dịch; hai nơi khác màn nên không lẫn |
| Điểm trong buổi | **tinh thể** («+145 tinh thể») | không dùng điểm, EXP, xu |
| Bốn nhóm thi đua | **Đội Natri · Đội Kali · Đội Đồng · Đội Canxi** | không dùng tổ, nhóm, team |
| Bảng xếp hạng đội sau mỗi lượt | **Đua ngọn lửa** | không dùng leaderboard |
| Màn cuối buổi | **Vinh danh** (tiêu đề «Vô địch buổi hôm nay») | — |
| Cả lớp đoán bạn trên bảng / bấm cổ vũ | **Đoán** · **Tiếp sức** | — |
| Cả lớp đúng từ 75% | **Vượt năng lượng hoạt hoá** (cả lớp +30 tinh thể) | — |

## 1. Mục tiêu sư phạm + ai dùng
- **Thầy:**
  - Biết ngay cả lớp hiểu câu đang chiếu tới đâu.
  - Gọi đúng em cần lên bảng mà không phải nghĩ.
  - Chữa luôn (phím C) hay đi tiếp.
- **Học sinh:**
  - Mọi em đều phải làm, không chỉ em lên bảng.
  - Làm trên máy mình, giống chặng nên không phải học cách dùng mới.
  - Biết ngay đúng sai, xem lời giải theo sơ đồ cột dọc (`docs/tu-duy-day-hoa-thay-2610.md`).
  - Lúc bạn lên bảng vẫn có việc: đoán và tiếp sức.
- **Cảm giác cần đạt: hú hét.**
  - Đua đội từ lúc điểm danh.
  - Electron nhảy chọn người lên bảng.
  - Tia lửa tiếp sức bay lên bảng.
  - Ống nghiệm đổi màu, lửa đội vượt nhau.
  - Cả lớp cùng nổ khi vượt năng lượng hoạt hoá.
  - Em sai không bị bêu tên; chỉ em rời màn mới hiện tên.
- **Nhịp:** một lượt ≈ 1,5–2 phút gồm cả lên bảng.
- **Phụ huynh:** không có màn riêng (xem quyết định 1, mục 8).

## 2. Bố cục

### 2.1 Điểm danh mới = mở màn Bình Phản Ứng (thay hai bản chiếu điểm danh hiện tại)
- **Bỏ khỏi màn chiếu:**
  - `BanChieuDiemDanh` A (thẻ em theo bậc) và B (Nhịp học của lớp);
  - mã chiếu cũ `TamPhuChieuMa` ở bước điểm danh.
- **Giữ nguyên luồng ghi:**
  - mở buổi, mã 6 số, lệnh `/hs/diem-danh`, bảng `buoi_hoc_diem_danh`;
  - thầy thêm / bớt em bằng tay;
  - khôi phục khi thoát (sửa 06/11).
- **Bảng chiếu `b02`:**
  - Trái: «Vào lớp: mở app, nhập mã» + QR + 6 số lớn + «Vừa vào lớp» (hai em mới nhất, chip đội, «+10», giờ vào).
  - Phải: «Đội nào đủ quân trước?» + bốn ngọn lửa đội cao dần theo số bạn đã vào («Natri 8/8»). Đội đủ quân đầu tiên được nhãn «+50 tinh thể».
  - Chân: bảng tuần hoàn lớp, em chưa vào thì mờ.
  - Phím: Space «Xong điểm danh · bắt đầu lượt 1» · V Danh sách vắng · H Ẩn tên · Esc Kết thúc buổi.
- **Máy em:**
  - `h00` nhập mã: 6 ô + bàn phím số + nút QR. **Một mã cho cả điểm danh lẫn Bình Phản Ứng**, em không phải nhập hai lần.
  - `h01` đã vào: giờ vào, thẻ đội «Đội Natri · 8/8 bạn đã vào», tinh thể đội có nhờ vào sớm.
- **Danh sách điểm danh trong app thầy** (`DiemDanhBuoi` / `Buoc1DiemDanh`) vẫn còn để sửa tay; chỉ phần chiếu và chữ đổi theo đội.

### 2.2 Điểm vào lượt: MỘT phím cho mọi tờ chiếu
Cả năm nơi chiếu đề dựng tờ chiếu bằng `taoHtmlMayChieu` (`src/lib/html-may-chieu.ts`). Chỉ cần thêm phím **L «Cả lớp làm»** (kèm nút cùng tên) là phủ hết:

| Nơi chiếu | Tệp gọi tờ chiếu |
|---|---|
| Gọi lên bảng | `src/screens/GoiLenBangScreen.tsx` |
| Dạy học lên bảng | `src/lib/day-hoc-len-bang.ts` |
| Chiếu chữa sau ca | `src/components/ca-thi/dung-to-chua-ca.ts` |
| Cần thầy chữa / câu sai trên lớp | `src/components/chua-cau-sai/CauCanChuaTrenLop.tsx` |
| Tờ chiếu chiến dịch | `src/components/chien-dich/to-chieu.ts` |

- **Cầu nối:** phím L đi từ tờ chiếu (iframe) ra app thầy qua `src/lib/to-chieu-cau-noi.ts` có sẵn.
- **Hộp «Cả lớp làm câu này»** (ảnh `b01`):
  - số em có mặt;
  - thời gian mỗi lượt;
  - công tắc hiện tên em đúng;
  - dòng kiểm câu bị giữ;
  - nút «Gửi xuống máy 28 em».
- **Điện thoại thầy** (`DieuKhienToChieuScreen`): thêm «Cả lớp làm», «Mở đáp án», «Lượt tiếp», «Đạt / Chưa đạt», «Chọn em khác». Nối **thẳng** tới phòng `PhongBinhPhanUng` bằng vé thầy, không đi đường `/gv/to-chieu/*`.

### 2.3 Bảng chiếu trong một lượt (16:9, nền máy chiếu của tờ chiếu)
- **Đang trả lời (`b03`):**
  - Trái: đề + phương án cỡ máy chiếu.
  - Phải: bình cầu có vòng thời gian êm + «23/32 em đã gửi». Đây là điểm nhấn.
  - Chân: ô em đã gửi sáng xanh; em đúng ≥ 2 lượt liền có **ngọn lửa nhỏ màu đội** trên ô.
- **Gọi lên bảng (`b04`):**
  - Electron nhảy qua 6 ô ứng viên, chậm dần, có tiếng tích, rồi dừng; ô nổ tinh thể.
  - Thẻ lớn «Mời em lên bảng»: nguyên tử màu đội, tên to, «Vì sao chọn em» ba dòng.
  - Đáy thẻ: «Cả lớp đoán trên máy» (vạch + «19 bạn đoán làm đúng · 7 chưa đúng») và ô «Tiếp sức Đội Canxi 46». Tia lửa bay từ ô các bạn cùng đội lên thẻ.
  - Phím: D Đạt (đội +200) · F Chưa đạt · N Chọn em khác · Space Mở đáp án.
- **Mở đáp án (`b05`–`b07`):**
  - Trắc nghiệm: ống A–D.
  - Đúng–sai: 4 cặp ống Đ/S.
  - Trả lời ngắn: 3 đáp số hay gặp + «Khác».
  - Thanh trên có chip «Lên bảng: Thanh Sơn · Đạt · Đội Canxi +200».
  - Lớp đúng ≥ 75%: băng vàng «Vượt năng lượng hoạt hoá! … cả lớp +30 tinh thể» + pháo tinh thể.
- **Đua ngọn lửa (`b09`):**
  - Bốn đèn đốt, ngọn lửa đội cao theo tinh thể và vượt nhau có hoạt hoạ.
  - Dưới mỗi đèn: điểm, «+430 lượt này · hạng 4».
  - Phải: 6 em kết tinh nhiều nhất.
- **Vinh danh (`b10`, SVG):**
  - Tia sáng màu đội vô địch xoay chậm sau lưng.
  - Huy hiệu ngọc đội («K», «Na», «Cu», «Ca») + «Vô địch buổi hôm nay · Đội Kali · 2705 tinh thể».
  - Bục 1-2-3 với ba viên ngọc mặt cắt lấp lánh (vàng, xanh, cam), nổi bồng bềnh, sao lấp lánh, pháo tinh thể rơi.
  - Trái: «Đua ngọn lửa» xếp 4 đội.
  - Phải: «Cả lớp hôm nay» (% đúng, lượt khó nhất · phím C chiếu chữa, em gửi đúng nhanh nhất).
- **Rời màn (`b03`):**
  - Băng cam rung ngay ở đầu bảng: «Thảo My vừa rời màn hình · lần 1 · Đội Đồng −20 tinh thể».
  - Ô của em viền cam, nhãn «Rời màn».

### 2.4 Máy em (giống màn chặng, dùng lại `LamCau` / `ManLamBaiTap`, bảng màu «Trong» `--tr-*`)
- **Thanh trên:** «Bình Phản Ứng · Lượt 2/4 · Đội Natri» + đồng hồ êm. **Không có nút thoát.**
- **Dọc:** đề, rồi phương án dạng thẻ lớn của chặng, nút «Gửi đáp án» ở đáy.
- **Ngang / máy tính:** hai cột như chặng ngang.
- **Được gọi (`h13`):** «Em được mời lên bảng!» + «Vì sao thầy chọn em» + «Đội Natri đang tiếp sức em: 46 lượt».
- **Bạn khác lên bảng (`h14`):**
  - Thẻ bạn được gọi.
  - «Em đoán bạn ấy làm đúng không?» với hai nút lớn; đoán đúng +20 tinh thể.
  - Nút đáy màu đội «Tiếp sức Đội Natri · 6/10»: mỗi chạm bắn một tia lửa lên bảng.
- **Rời màn rồi quay lại (`h15`):** «Em vừa rời màn hình · Thầy đã thấy trên bảng · Đội Natri bị trừ 20 tinh thể» + «Quay lại lượt đang làm».

## 3. Trạng thái (ảnh trong `anh/`)
| Trạng thái | Bảng chiếu | Máy em | Ảnh |
|---|---|---|---|
| Điểm danh | Mã + QR, lửa 4 đội, vừa vào lớp | Nhập mã → «Em đã vào lớp lúc 19:17» + thẻ đội | `b02`, `h00`, `h01` |
| Thầy bấm L | Hộp «Cả lớp làm câu này» | — | `b01` |
| Đang trả lời | Bình đầy dần, ô sáng, lửa chuỗi | Chọn → Gửi | `b03`, `h02` |
| Đã gửi | — | Khoá, nguyên tử quay, «Đã gửi sau 8 giây» | `h03` |
| Gọi lên bảng | Electron nhảy → thẻ lý do, đoán, tiếp sức | Được gọi / Đoán + Tiếp sức | `b04`, `h13`, `h14` |
| Mở đáp án · 3 kiểu câu | Ống nghiệm, ô kết tinh, chip lên bảng, băng năng lượng hoạt hoá | Đúng / Chưa đúng + Xem lời giải | `b05`–`b07`, `h04`–`h06`, `h09`, `h10` |
| Câu tự luận | Đếm «làm xong», không ống nghiệm | «Em làm xong» | `b08`, `h11` |
| Đua ngọn lửa | 4 đèn đốt + 6 em đầu | «Hạng 6/32 · lên 2 hạng» | `b09`, `h07` |
| Vinh danh | Đội vô địch + bục ngọc | Tổng kết của em + «Về chặng đang làm» | `b10`, `h08` |
| Đang có ca kiểm tra mở | Hộp chặn | Không nhận | `b11` |
| Máy yếu / giảm chuyển động | Không hạt, không phát sáng, vẽ tĩnh | Không nguyên tử quay | `b12` |
| Rời màn | Băng cam + ô «Rời màn» | Màn cảnh báo khi quay lại | `b03`, `h15` |
| Mất mạng | Ô giữ trạng thái đã gửi | Dải cam «Mất kết nối, đang nối lại…» | `h12` |
| Đang tải | Nút L «Đang mở…» (≤ 1 s) | Khung xương chặng | — |
| Lỗi mở phòng | Hộp báo lý do thật + «Thử lại» | — | — |
| Chưa điểm danh | Hộp L: «Chưa điểm danh hôm nay: gửi tới cả lớp đang mở app» | — | — |

## 4. Dữ liệu và máy chủ

### Mở phòng
- App thầy gửi `POST /gv/bpu/mo { buoiId, qids, thoiGian, hienTen }`.
- Worker đọc MỘT `batch` D1 gồm 5 câu lệnh, 1 đợt chờ:
  1. danh sách em của lớp;
  2. `buoi_hoc_diem_danh` của buổi (`trang_thai='co_mat'`);
  3. ca đang mở của lớp;
  4. em đang có lượt thi `dang_lam`;
  5. dữ liệu gọi lên bảng của **mọi câu trên tờ chiếu** (xem dưới).
- **Câu bị giữ:**
  - Tách phần kiểm câu trong `kiemNguon` (`server/src/kiem-tra-ca-nhan.ts`, hiện là hàm nội bộ) thành hàm dùng chung.
  - Hàm này gộp `protectedQuestions` (câu bảo vệ cho ca chưa công bố / ca đang mở), `docCauBtvnChuaNop` (Bài tập về nhà chưa nộp) và `readGameScope`.
- **Nội dung câu:** kho R2 `kho/<ma_de>.json` (đã có đệm).
- **Phòng:** Durable Object mới **`PhongBinhPhanUng`**, `idFromName('bpu:<buoiId>')`, WebSocket ngủ đông, lớp SQLite, cùng mẫu `PhongDauIon`. Luật thuần ở `server/src/bpu-phong.ts`, test được không cần Cloudflare.

### Đáp án không xuống máy em trước khi mở
- Máy em nhận `{t:'cau', de, phuongAn, loai, han}`, không đáp án, không `dm`. Ngoại lệ niêm phong câu luyện tập không áp dụng.
- Em gửi `{t:'tra', luot, chon}`. Phòng chấm ngay bằng đáp án đang giữ; bảng chỉ biết «đã gửi».
- Mở đáp án: **khoá nhận bài trước**, rồi mới phát `{t:'mo', dapAn, thongKe}` cho bảng và kết quả riêng cho từng máy.

### Đưa câu tới máy em ngay
- Phòng phát `{t:'bpu', buoi}` qua kênh đẩy sẵn có của từng em (WebSocket trên ngăn `NganHocSinh`, `server/src/kenh-day.ts`):
  - các lệnh gọi song song, 0 D1;
  - tin `bpu` **bỏ khoảng gom 1,2 s** (`CHO_PHAT_MS`).
- Ngăn em ghi «phòng đang mở» vào `ctx.storage` kèm hạn 3 giờ (vẫn 0 D1). Em mở app sau, kênh vừa nối là nhận ngay.
- Phần nhận tin ở máy em: `src/lib/kenh-day.ts` đang được `StudentPortalScreen` **nạp lười** (`import('../lib/kenh-day')`). Thêm nhánh `bpu` gọi `import()` mảnh `ManBinhPhanUng`, nên byte mở `/hs` không tăng.
- Không dùng `/gv/to-chieu/*` (Map trong isolate, hỏi 650 ms) cho học sinh hay cho nút điều khiển BPU.
- Công tắc: `TAT_BPU`. `TAT_KENH_DAY` bật thì em vào bằng mã 6 số trên bảng.

### Điểm danh mới
- `/hs/diem-danh` giữ nguyên. Ghi xong thì Worker báo phòng của buổi (một lời gọi DO, 0 D1 thêm), để bảng hiện em vào lớp **ngay** thay vì chờ nhịp 5 giây.
- Thưởng vào sớm và đủ quân nằm trong phòng.

### Rời màn
- App đã có sẵn cách bắt rời màn ở màn thi (`ExamTakeScreen`: `visibilitychange`). Dùng cùng cách:
  - nghe `visibilitychange`, `pagehide`, `blur`;
  - khi được hỗ trợ thì xin **toàn màn hình** (`requestFullscreen`) và nghe `fullscreenchange`.
- Rời màn thì gửi `{t:'roi'}` (hoặc phòng thấy kết nối rớt quá 3 giây không có lý do mạng); bảng báo trong ≤ 1 s.
- **Nói thật:** trình duyệt không cho chặn tuyệt đối việc thoát. App bỏ nút thoát, bật toàn màn hình, rời là bảng hiện tên và đội bị trừ.

### Gọi lên bảng (dựa trên lịch sử làm bài)
- **Dùng lại lõi chọn em đã thầy chốt 21/10:** `src/lib/chon-em-phan-tang.ts` (ba tầng theo khả năng đúng chính câu ấy, ghép tầng theo mức độ câu, ưu tiên em lâu chưa lên bảng, mỗi em một lần, chế độ Trộn / Chắc đúng / Ngẫu nhiên).
- **Nguồn dữ liệu:** `/gv/ung-vien-chieu` đang trả `p`, `daDung`, `daSai`, `soLanLenBang14`, `lanCuoiLenBang`.
- **Thêm trường chỉ-thêm** cho dòng lý do: `soCauDang`, `dungDang` (số câu cùng dạng đã làm / đúng trên app), `lanGanDang` (ngày, đúng hay vướng). Tính trong cùng `Promise.all` của lệnh.
- Lệnh này thuộc **làn Codex** («người gọi»): Claude thêm trường kèm test khoá luồng Codex, ghi Nhật ký trước, Codex soát PR.
- **Thêm vào phòng:**
  - bỏ em đang rời màn và em vắng;
  - câu tự luận vẫn gọi được (thầy chủ động).
- **Lý do trên bảng:** ba dòng, lời lẽ nhẹ:
  - «Thông hiểu hợp với em: dạng «Amine tác dụng với acid» em đã làm 15 câu trên app, đúng 11.»
  - «Lần gần nhất gặp dạng này (02/11) em làm đúng: lên giảng lại cho cả lớp.»
  - «11 ngày chưa lên bảng.»
- **Điện thoại thầy** thấy thêm: tầng, `p`, bước hay vướng (quyết định 2).
- **Đạt / Chưa đạt:** ghi vào sổ lên bảng sẵn có (bảng `len_bang`).

### Lưu kết quả
- Cuối buổi, phòng ghi MỘT `batch` D1 vào bảng mới **`bpu_luot`**: `(buoi_id, sbd, qid, luot, chon_json, dung, giay, tinh_the, doi, roi_man, len_bang, luc)`.
- Migration **chỉ thêm** `server/migration-0611-binh-phan-ung.sql`; DO migration `bpu-v1`.
- **Đội cố định cả tháng:** bảng chỉ-thêm `bpu_doi (lop, thang, sbd, doi)`, chia rắn bò theo sức học lúc đầu tháng. Thầy đổi được.

## 5. Ngoại lệ
| Tình huống | Xử lý |
|---|---|
| **Em đang thi / phòng chờ ca / kiểm tra cá nhân** | KHÔNG BAO GIỜ bị cướp màn. App bỏ qua tin `bpu`; máy chủ không phát tới em có lượt `dang_lam`. |
| **Lớp đang có ca kiểm tra mở** | Hộp chặn (`b11`), không mở phòng. Đây là điều phải dừng ở `CLAUDE.md`. |
| **Câu bị giữ** (ca chưa công bố / ca mở / Bài tập về nhà có điểm) | Chặn gửi, ghi lý do; chiếu vẫn chiếu như cũ. |
| **Câu tự luận** | Không chấm trên máy; «Em làm xong»; vẫn gọi lên bảng được. Kênh rút tự động vẫn không rút tự luận (`src/lib/cau-tu-luan.ts`). |
| **Em đang làm dở chặng** | Lưu nguyên trạng, xong buổi về đúng chỗ. Đây là **ngoại lệ có chủ ý với luật C14** («không bật hộp thoại khi người dùng đang làm việc khác»): thầy yêu cầu câu hiện đầy màn hình trên máy cả lớp. |
| **Em rời màn nhiều lần** | Mỗi lần một băng cam, đếm «lần 2, lần 3»; trừ đội mỗi lần (quyết định 4). Rời quá 3 lần thì ô em ghi «Rời màn ×3» tới hết lượt. |
| **Mất mạng ≠ rời màn** | Kết nối rớt mà máy vẫn hiện màn (không có `visibilitychange`) thì là mất mạng: không báo rời màn, không trừ. Đáp án giữ trên máy, nối lại thì gửi. |
| **Hết giờ** | Phòng tự khoá; em chưa gửi thì không tinh thể, không ghi sai vào hồ sơ. |
| **Bấm lặp / hai máy** | Nhận lần gửi đầu theo (sbd, lượt). Tiếp sức tối đa 10 lần mỗi em mỗi lượt. Mỗi em đoán một lần. |
| **Không còn ứng viên lên bảng** (mọi em đã lên) | Cho lên lần hai, ghi «lên lần 2 trong buổi» như lõi đã có. |
| **Chữ / công thức dài** | Máy em cuộn trong vùng đề. Bảng tự giảm cỡ chữ, giữ ≥ 28 px. |
| **Lớp đông** | Tới 48 em: 3 hàng ô. 49–96 em: ô chỉ còn kí hiệu. Đội vẫn 4. |
| **Đội lệch số người có mặt** | Xếp hạng theo tinh thể trung bình mỗi bạn có mặt (quyết định 5). |
| **Máy yếu / giảm chuyển động** | Tắt hạt, bọt, mảnh, phát sáng, tia xoay, ngọc nổi; electron nhảy thành hiện thẳng em được gọi (`b12`). |
| **Thầy đóng tờ chiếu giữa chừng** | Phòng sống 10 phút rồi tự kết thúc + ghi kết quả; máy em về chỗ cũ. |

## 6. Chi phí máy chủ
- **Mở phòng:** 1 đợt chờ D1 (batch 5 lệnh) + 1 đọc R2 có đệm.
- **Mỗi lượt:** 0 D1. Gọi lên bảng dùng dữ liệu đã đọc lúc mở phòng cho mọi câu của tờ chiếu. Tin WebSocket ≈ số em + 1 mỗi sự kiện.
  - Tiếp sức gom 250 ms rồi mới gửi lên bảng, nên 40 em chạm liên tục vẫn ≤ 4 tin/giây tới bảng.
- **Điểm danh:** giữ nguyên lệnh cũ + 1 lời gọi DO.
- **Kết thúc:** 1 batch ghi D1.
- **Lệnh nóng hiện có:** không đổi.
- **Tải app:**
  - Máy em: mảnh `ManBinhPhanUng` nạp lười khi có tin. Byte mở `/hs` không tăng.
  - Bảng chiếu: mảnh `BangBinhPhanUng` (canvas 2D + SVG, không three.js), chỉ máy thầy dùng, đưa vào `globIgnores`.
  - Bỏ `BanChieuDiemDanh` (1023 dòng) và `ban-chieu-diem-danh.css` khỏi đường mở thì app thầy nhẹ đi.

## 7. Nghiệm thu đo bằng máy
- **Test vitest mới:**
  - `tests/bpu-phong-0611.test.ts`, luật phòng thuần:
    - chấm 3 kiểu câu;
    - khoá trước khi phát đáp án;
    - **máy em không nhận đáp án trước khi mở**;
    - gửi lặp / hai máy;
    - tinh thể (đúng 100 + tối đa 50 nhanh; Đúng–sai 25/ý; vượt năng lượng hoạt hoá +30; đội lên bảng Đạt +200; đoán đúng +20; vào sớm +10; đủ quân đầu +50; rời màn −20);
    - hết giờ; nối lại.
  - `tests/bpu-goi-len-bang-0611.test.ts`:
    - dùng `chon-em-phan-tang` đúng tầng theo mức độ câu;
    - bỏ em rời màn / vắng;
    - lý do ba dòng không có nhãn năng lực;
    - mỗi em một lần.
  - `tests/bpu-roi-man-0611.test.ts`: rời màn báo ≤ 1 s; mất mạng không bị tính rời màn; trừ đội đúng.
  - `tests/bpu-diem-danh-0611.test.ts`:
    - `/hs/diem-danh` giữ hợp đồng cũ;
    - báo phòng ngay;
    - chia đội rắn bò cân bằng;
    - đội cố định trong tháng.
  - `tests/bpu-chan-ca-0611.test.ts`: ca mở thì chặn; em `dang_lam` không nhận; câu bị giữ thì chặn; tự luận thì «Em làm xong».
  - `tests/bpu-kenh-day-0611.test.ts`: tin `bpu` không gom 1,2 s; `ctx.storage` có hạn; công tắc tắt sạch.
  - `tests/bpu-may-em-0611.test.tsx`: đủ trạng thái máy em; lưu / trả chặng; không nút thoát; chữ theo bảng A2 (không còn «mẻ»).
  - `tests/bpu-to-chieu-0611.test.ts`: phím L ở cả 5 nơi chiếu; điện thoại thầy có nút BPU.
- **Cổng chung:**
  - `tsc`;
  - toàn bộ vitest so tên với `main`;
  - `npm run build && npm run kiem:toc-do` 0 đỏ;
  - `npm run kiem:mau-giu` 0;
  - `node scripts/kiem-sw.mjs`;
  - `npm run kiem:co-tep`.
- **Ảnh Chromium sau build:** cùng bộ như `anh/`, 0 lỗi trang, 0 tràn, 0 đích bấm < 44 px. Thêm một ảnh vinh danh ở 3840×2160 để kiểm độ nét vector.
- **Sau gộp:** tác tử `toc-do` đo trước/sau. Chưa nhanh hơn thì chưa báo xong.

## 8. Thầy cần chọn (bước 3)
1. **Tinh thể có cộng vào EXP không?** Đề xuất KHÔNG (EXP là luật thầy đã khoá); kết quả đúng/sai ghi hồ sơ như một lượt luyện, câu sai vào lịch ôn lại.
2. **Lý do gọi lên bảng hiện tới đâu trên màn chiếu?** Đề xuất bảng hiện ba dòng nhẹ (dạng, số câu đã làm/đúng, số ngày chưa lên bảng); khả năng đúng và bước hay vướng chỉ trên điện thoại thầy. Thẻ cũ của lõi chọn em ghi «Không đưa lên bản chiếu», nay thầy yêu cầu «ghi rõ lý do» nên cần thầy chốt mức.
3. **Đồng hồ:** luật C14 cấm «đếm ngược gây sợ ngoài màn kiểm tra». Bản vẽ đã bỏ đổi màu cam / nháy, chỉ còn vòng êm. Mặc định 60 giây hay «Không giới hạn»?
4. **Rời màn:** trừ đội −20 tinh thể mỗi lần + hiện tên trên bảng. Thầy muốn mức khác?
5. **Chia đội:** cố định cả tháng, chia rắn bò theo sức học, xếp hạng theo tinh thể trung bình mỗi bạn có mặt?
6. **Gửi rồi có được đổi?** Đề xuất không.

## 9. Ai build (bước 4)
- **Claude:** toàn bộ tệp mới:
  - máy chủ: DO `PhongBinhPhanUng`, `bpu-phong.ts`, lệnh `/gv/bpu/*` `/hs/bpu/*`, 2 migration chỉ-thêm;
  - mảnh `ManBinhPhanUng`, `BangBinhPhanUng`;
  - test.
- **Thay màn chiếu điểm danh:** `day-hoc/BanChieuDiemDanh*`, `Buoc1DiemDanh` thuộc làn Claude. Phiên khác (Antigravity) vừa sửa 06/11, nên ghi Nhật ký trước khi thay.
- **Chạm ngoài làn, chỉ thêm, ghi Nhật ký trước:**
  - `html-may-chieu.ts` (phím L, làn cũ Code 1 đã vắng);
  - `to-chieu-cau-noi.ts`;
  - `DieuKhienToChieuScreen.tsx`;
  - `kenh-day.ts` (cả máy chủ lẫn máy em);
  - `server/src/index.ts`, `wrangler.toml`, `vite.config.ts`;
  - `kiem-tra-ca-nhan.ts` (tách hàm kiểm câu, làn Codex).
- **Làn Codex:** `/gv/ung-vien-chieu` (thêm trường) và `kiem-tra-ca-nhan.ts`. Codex soát PR.

## 10. KHI BUILD (07/11) — chỗ khác bản vẽ / đặc tả ở trên (ghi thật, mục trên giữ nguyên làm lịch sử)
- **Phím P «Cả lớp làm»** (không phải L — L trên tờ chiếu đã là «Lên bảng»).
- **Điểm là kJ (năng lượng)**, không phải «tinh thể» — «tinh thể» đã là phần thưởng tích luỹ sẵn có của app học sinh.
- **Màu đội** dùng biến CỐ ĐỊNH sẵn có ở tokens.css (không thêm byte vào tờ màu lúc mở app): Natri vàng cam `--p-cam` · Kali tím `--p-tim-2` · Đồng xanh lục `--p-xanh` · Canxi đỏ `--p-do` (bản vẽ: vàng / hồng / xanh lam / cam).
- **Bảng chiếu hiện đề dạng chữ + chỉ số dưới** (C6H5NH2 ⇒ C₆H₅NH₂) và ảnh thân câu; không nhập bộ hiện câu của chặng (nhập từ máy thầy làm app học sinh nặng thêm). Máy em dùng đúng bộ hiện câu của chặng (nạp động).
- **Lý do lên bảng** chỉ từ dữ liệu thật của `/gv/ung-vien-chieu`: đã đúng / đã sai câu này / vừa sức theo lịch sử / mới với em · số ngày chưa lên bảng. Chưa có dòng «đã làm N câu dạng này, đúng M» (cần thêm trường ở lệnh làn Codex).
- **Chưa làm ở đợt này:** lời giải trên máy em sau khi mở đáp án; nút Bình Phản Ứng trên điện thoại điều khiển máy chiếu; kết quả đưa vào hồ sơ / lịch ôn lại (đã ghi bảng `bpu_luot`, chưa nối hồ sơ).
- **Đội** chia đều SỐ bạn (cố định theo tháng, theo băm sbd), chưa cân theo sức học; xếp hạng theo TỔNG kJ (con số hiện trên bảng).
- **Bản chiếu điểm danh**: mặc định là bảng Bình Phản Ứng; phòng không mở được (mất mạng / lớp có ca mở / `TAT_BPU`) ⇒ tự lùi bản chiếu cũ. Đường «→ Nhịp học / Gọi lên bảng đầu giờ» của bản chiếu cũ chỉ còn ở đường lùi.
- **An toàn em:** lúc chờ giữa các lượt em rời được («Rời Bình Phản Ứng», không phạt); rời màn chỉ tính khi đang có lượt; thầy bấm X kết thúc buổi chơi; kết thúc buổi học ⇒ phòng kết thúc; phòng tự kết thúc sau 45 phút thầy không thao tác.
