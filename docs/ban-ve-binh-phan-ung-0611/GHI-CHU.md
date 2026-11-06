# Bình Phản Ứng: cả lớp cùng làm câu thầy đang chiếu (đặc tả 7 mục + bản vẽ, 06/11/2026, CHỜ THẦY DUYỆT)

Thầy 06/11: «đề xuất tất cả phần chiếu đề lên bảng, khi chiếu đề nào thì học sinh ở dưới nhận được đề trên app của mình hiện full màn hình giống với các chặng, học sinh chọn đáp án thì hiện lên bảng … thiết kế một hoạt hoạ hay trò chơi gì đó siêu đẹp siêu cuốn … Đề xuất cho tôi trước khi tôi duyệt build».

- **Bản chạy thử có hoạt hoạ thật**: `nguyen-mau.html`. Đây cũng là trang Artifact gửi thầy. Lớp mô phỏng 32 em tự chạy 4 mẻ; thầy chạm được vào máy em để tự chơi.
- **Ảnh Chromium thật**: `anh/` (57 ảnh). Chụp lại bằng `node docs/ban-ve-binh-phan-ung-0611/chup.mjs`, không cần build.
  - Bảng chiếu 1920×1080, nền máy chiếu tối và sáng.
  - Máy em 390 dọc, 844 ngang, 1440 máy tính, sáng và tối.
  - Điện thoại thầy.
- **Soát** (`soat.txt`): 0 lỗi trang · 0 tràn ngang · 0 đích bấm < 44 px.
- **Chưa build gì** trong `src/` và `server/`.

## 0. Ý tưởng trò chơi (một câu)
Mỗi em là một **ô nguyên tố** trên «bảng tuần hoàn lớp» ở chân bảng chiếu, giữa bảng là một **bình cầu**.
- **Em gửi đáp án:** một giọt sáng bay từ ô của em vào bình, bình đầy dần. Trên bảng chưa ai biết em chọn gì.
- **Thầy mở đáp án:**
  - Bình rót sang các **ống nghiệm** A·B·C·D theo đúng số em chọn mỗi phương án.
  - Ống đúng **đổi màu như chất chỉ thị** và bắn tinh thể.
  - Ô của các em đúng **kết tinh** lần lượt từ em nhanh nhất; 3 em nhanh nhất có huy hiệu 1·2·3.
- **Sau mỗi mẻ:** Bảng kết tinh xếp hạng theo tinh thể.
- **Cuối buổi:** Tổng kết có bục ba viên ngọc.

Bản sắc là phòng thí nghiệm Hoá (bình cầu, ống nghiệm, chất chỉ thị, kết tinh, bảng tuần hoàn), không vay giao diện trò đố vui có sẵn.

**Từ mới đề nghị thêm vào bảng A2** (`docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`). «Chặng / ván / ải / hiệp / lượt» đã có chủ nên không dùng.

| Khái niệm | Từ chuẩn | Không dùng |
|---|---|---|
| Hoạt động cả lớp cùng làm câu thầy đang chiếu | **Bình Phản Ứng** | đố vui, quiz, «Phản ứng dây chuyền» (đã là băng combo chặng) |
| Một câu trong hoạt động | **Mẻ** («Mẻ 2/4») | câu đố, vòng, lượt, chặng |
| Điểm trong buổi | **tinh thể** («+145 tinh thể») | điểm, EXP, xu |
| Bảng xếp hạng giữa các mẻ | **Bảng kết tinh** | leaderboard |

## 1. Mục tiêu sư phạm + ai dùng
- **Thầy (máy chiếu + điện thoại):**
  - Biết ngay cả lớp hiểu câu đang chiếu tới đâu: bao nhiêu em chọn từng phương án, đáp số sai nào hay gặp.
  - Từ đó chọn chữa luôn (phím C «Chiếu chữa mẻ này») hay đi tiếp.
  - Không phải gọi từng em.
- **Học sinh (app):**
  - Mọi em đều phải làm, không chỉ em lên bảng.
  - Làm trên máy mình, giống chặng nên không phải học cách dùng mới.
  - Biết ngay mình đúng hay sai, xem lời giải theo sơ đồ cột dọc (`docs/tu-duy-day-hoa-thay-2610.md`).
- **Cảm giác cần đạt:**
  - Hồi hộp lúc chờ mở đáp án; vỡ oà khi ống nghiệm đổi màu.
  - Em sai không bị bêu tên.
  - Nhịp nhanh: một mẻ ≈ 1–1,5 phút.
- **Phụ huynh:** không có màn riêng. Câu em sai đi vào lịch ôn lại như mọi lượt luyện, nếu thầy chọn ghi hồ sơ (mục 8).

## 2. Bố cục

### 2.1 Điểm vào: MỘT phím cho mọi tờ chiếu
Cả năm nơi chiếu đề hiện nay đều dựng tờ chiếu bằng `taoHtmlMayChieu` (`src/lib/html-may-chieu.ts`). Vì vậy chỉ cần thêm một phím **L «Cả lớp làm»** (kèm nút cùng tên ở thanh dưới tờ chiếu) là phủ hết:

| Nơi chiếu | Tệp gọi tờ chiếu |
|---|---|
| Gọi lên bảng | `src/screens/GoiLenBangScreen.tsx` |
| Dạy học lên bảng | `src/lib/day-hoc-len-bang.ts` |
| Chiếu chữa sau ca | `src/components/ca-thi/dung-to-chua-ca.ts` |
| Cần thầy chữa / câu sai trên lớp | `src/components/chua-cau-sai/CauCanChuaTrenLop.tsx` |
| Tờ chiếu chiến dịch | `src/components/chien-dich/to-chieu.ts` |
| Điện thoại điều khiển máy chiếu | `src/screens/DieuKhienToChieuScreen.tsx`: thêm nút «Cả lớp làm», «Mở đáp án», «Mẻ tiếp» |

Bấm L mở hộp «Cả lớp làm câu này» (ảnh `b01`). Hộp có:
- số em có mặt theo điểm danh và số em đang mở app;
- thời gian mỗi mẻ: 30 / **60** / 90 giây / không giới hạn;
- công tắc «Hiện tên em trả lời đúng trên bảng»;
- dòng kiểm câu: «Câu này không thuộc ca kiểm tra nào đang giữ, gửi xuống máy được»;
- nút chính «Gửi xuống máy 28 em».

Những câu tiếp theo trên cùng tờ chiếu, thầy bấm → rồi L, hoặc «Mẻ tiếp» trên điện thoại.

### 2.2 Bảng chiếu, 16:9, dùng nền máy chiếu của tờ chiếu (tối hoặc sáng)
- **Thanh trên:** Bình Phản Ứng · «Mẻ 2/4» · lớp và bài · mã vào lớp (ở phòng chờ) hoặc đồng hồ «0:41» (hổ phách khi dưới 12 giây).
- **Trái 57%:** đề + phương án cỡ chữ máy chiếu (đề 40 px, phương án 34 px trên khung 1920). Cỡ chữ theo cài đặt cỡ chữ của tờ chiếu.
- **Phải 34%:** bình cầu có vòng đồng hồ quanh bầu, con số lớn «23/32 em đã gửi». Đây là **điểm nhấn duy nhất** khi đang trả lời.
  - Lúc mở đáp án, chỗ này thành giá ống nghiệm. Dưới mỗi ống: chữ cái, «19 em», nhãn «Đáp án».
- **Chân:** bảng tuần hoàn lớp, 16 cột.
  - Mỗi ô có số thứ tự, kí hiệu 2 chữ, tên hai chữ cuối.
  - Lớp tới 48 em là 3 hàng; trên 48 em gom (mục 5).
- **Dải phím mờ dưới cùng:** Space Mở đáp án · + Thêm 15 giây · → Mẻ tiếp · K Bảng kết tinh · G Lời giải · C Chiếu chữa mẻ này · H Ẩn tên · Esc Kết thúc.

### 2.3 Máy em, giống màn chặng (dùng lại `LamCau` / `ManLamBaiTap` cùng bảng màu «Trong» `--tr-*`)
- **Điện thoại dọc:**
  - Thanh trên: «Bình Phản Ứng · Mẻ 2/4 · Thầy đang chiếu» + đồng hồ.
  - Dưới thanh trên là vạch thời gian; tiếp đến đề, rồi phương án dạng thẻ lớn của chặng.
  - Nút chính «Gửi đáp án» ở đáy, trong tầm ngón cái.
- **Ngang và máy tính:** hai cột như chặng ngang. Đề bên trái, phương án bên phải, nút đáy canh theo cột phải.
- **Không có nút thoát.** Em đang làm chặng thì chặng được lưu nguyên chỗ; xong buổi bấm «Về chặng đang làm · Chặng 3».

### 2.4 Điện thoại thầy (điều khiển máy chiếu)
- Thẻ số «23 / 32 em đã gửi» + vạch tiến độ.
- Nút chính «Mở đáp án»; nút phụ «Thêm 15 giây», «Bỏ mẻ này».
- Danh sách «Chưa gửi (9)».
- Sau khi mở: biểu đồ cột A–D, nút chính «Mẻ tiếp», nút phụ «Bảng kết tinh», «Chiếu chữa mẻ này», danh sách «Chưa đúng · chỉ thầy thấy».

## 3. Trạng thái (ảnh trong `anh/`)
| Trạng thái | Bảng chiếu | Máy em | Ảnh |
|---|---|---|---|
| Thầy bấm L | Hộp «Cả lớp làm câu này» trên tờ chiếu | — | `b01` |
| Phòng chờ (chỉ lần đầu, nếu thầy mở từ phòng chờ) | Mã 4 số lớn, ô sáng dần khi em vào, «28/32 em đã vào» | «Em đã vào lớp · thầy chiếu câu nào, câu đó tự hiện ở đây» | `b02`, `h01` |
| Đang trả lời | Bình đầy dần, ô em đã gửi sáng xanh, đồng hồ | Chọn → «Gửi đáp án» | `b03`, `h02` |
| Đã gửi | — | Khoá phương án, nguyên tử quay, «Đã gửi sau 8 giây · Nhìn lên bảng nhé · 24/32 bạn đã gửi» | `h03` |
| Mở đáp án · Trắc nghiệm | Ống nghiệm A–D theo số em chọn, ống đúng đổi màu, ô em đúng kết tinh | Tấm đáy «Chính xác! +145 tinh thể · nhanh thứ 5 cả lớp» hoặc «Chưa đúng · Đáp án đúng: A. 12,95 gam» + «Xem lời giải» | `b04`, `h04`, `h05`, `h06` |
| Mở đáp án · Đúng–sai | 4 cặp ống Đ/S, mỗi ý ghi Đúng/Sai | Mỗi ý 2 nút Đúng · Sai; kết quả «Em đúng 3/4 ý» | `b05`, `h09` |
| Mở đáp án · Trả lời ngắn | Ống theo 3 đáp số hay gặp + «Khác» (vd 1,24 · 2,48 · 0,62) | Bàn phím số kiểu chặng | `b06`, `h10` |
| Câu tự luận | Bình đếm «31/32 em làm xong», không ống nghiệm, Space hiện lời giải | «Câu này thầy chữa trên bảng, máy không chấm» + nút «Em làm xong» | `b07`, `h11` |
| Bảng kết tinh | 8 em nhiều tinh thể nhất, lên/xuống hạng, «17/32 em đúng mẻ 2» | «Hạng 6/32 · 412 tinh thể · lên 2 hạng · Mẻ 3 sắp tới» | `b08`, `h07` |
| Tổng kết | Bục 3 viên ngọc, «Cả lớp đúng 50% · Mẻ khó nhất: Mẻ 4 · Nhanh nhất: …», phím C chiếu chữa mẻ khó nhất | «Xong Bình Phản Ứng · 3/4 mẻ đúng · 412 tinh thể · hạng 6/32» + «Về chặng đang làm» | `b09`, `h08` |
| Đang có ca kiểm tra mở | Hộp «Chưa mở được Bình Phản Ứng … sẽ làm gián đoạn bài thi của các em» | Không nhận gì | `b10` |
| Máy yếu / giảm chuyển động | Không hạt bay, không phát sáng, không mảnh tinh thể; ống hiện ngay | Không nguyên tử quay, không mảnh bung | `b11` |
| Mất mạng | Ô em rớt mạng vẫn giữ trạng thái đã gửi | Dải cam «Mất kết nối, đang nối lại… Đáp án em chọn vẫn giữ trên máy, nối lại là gửi.» | `h12` |
| Đang tải | Tờ chiếu giữ nguyên tới khi phòng mở (≤ 1 s); nút L hiện «Đang mở…» | Khung xương chặng | — |
| Lỗi mở phòng | Hộp báo lý do thật + «Thử lại» (máy chủ không trả lời / câu bị giữ / tắt công tắc) | — | — |
| Rỗng (lớp 0 em có mặt) | Hộp L: «Chưa có em nào có mặt theo điểm danh hôm nay. Em vẫn vào được bằng mã 4827.» | — | — |

## 4. Dữ liệu và máy chủ

### Câu và đáp án (đáp án không xuống máy trước khi mở)
- Thầy bấm «Gửi xuống máy». App thầy gửi `POST /gv/bpu/mo { lop, qid, thoiGian, hienTen }` (dùng chung token thầy như mọi lệnh `/gv/*`).
- Worker đọc trong MỘT `batch` D1:
  - danh sách em của lớp;
  - điểm danh hôm nay;
  - ca đang mở của lớp;
  - câu đó có đang bị giữ không: giữ cho ca chưa công bố, ca đang mở, hay Bài tập về nhà có điểm. Dùng lại đúng hàm kiểm câu tạm giữ đã có ở `server/src/kiem-tra-ca-nhan.ts`.
- Nội dung câu lấy từ kho R2 `kho/<ma_de>.json` (đã có đệm).
- Worker giao cho **Durable Object mới `PhongBinhPhanUng`**: `idFromName('bpu:<mã 4 số>')`, WebSocket ngủ đông, lớp SQLite, cùng mẫu `PhongDauIon`.
  - Đáp án chỉ nằm trong phòng.
  - Máy em nhận `{t:'cau', de, phuongAn, loai, han}`, **không có đáp án**, không có `dm`. Ngoại lệ niêm phong của câu luyện tập KHÔNG áp dụng ở đây.
- Em gửi `{t:'tra', me, chon}`. Phòng chấm ngay bằng đáp án đang giữ, rồi chỉ báo bảng chiếu «em X đã gửi», không báo em chọn gì.
- Thầy bấm «Mở đáp án»: phòng **khoá nhận bài trước**, rồi mới phát:
  - `{t:'mo', dapAn, thongKe}` tới bảng chiếu;
  - kết quả riêng tới từng máy em: đúng/sai, tinh thể, hạng nhanh, lời giải.

### Đưa câu tới máy em ngay lập tức
- Phòng phát `{t:'bpu', ma}` qua **kênh đẩy có sẵn** của từng em (WebSocket trên ngăn `NganHocSinh`, `server/src/kenh-day.ts`):
  - chỉ tới em có mặt theo điểm danh;
  - các lệnh gọi chạy song song bằng `Promise.all`, 0 truy vấn D1;
  - tin loại `bpu` **đi thẳng, bỏ khoảng gom 1,2 s** (`CHO_PHAT_MS`).
- Máy em nhận tin thì nạp lười mảnh `ManBinhPhanUng`, xin vé phòng (HMAC 2 phút, mẫu `dau-ion-ve.ts`) và nối WebSocket tới phòng.
- Em chưa mở app thì ngăn của em nhớ «phòng đang mở» trong bộ nhớ; em mở app, kênh vừa nối là nhận ngay.
- **Đường dự phòng:** mã 4 số trên bảng; em nhập ở app (Bình Phản Ứng → nhập mã). Chỉ em thuộc lớp mới vào được.
- **Không dùng** đường `/gv/to-chieu/*` (Map trong isolate, hỏi 650 ms, không bền) cho phía học sinh.
- **Công tắc tắt nhanh:** biến Worker `TAT_BPU`. `TAT_KENH_DAY` bật thì chỉ còn đường mã 4 số.

### Lưu kết quả
- Cuối buổi (Esc hoặc phòng hết hạn 10 phút không ai thao tác), phòng ghi MỘT `batch` D1 vào bảng mới **`bpu_luot`**: `(ma_phong, sbd, qid, me, chon_json, dung, giay, tinh_the, luc)`.
- Migration **chỉ thêm** `server/migration-0611-binh-phan-ung.sql`; DO migration `bpu-v1` trong `wrangler.toml`.
- Nếu thầy chọn «ghi vào hồ sơ» (mục 8), cùng batch thêm sự kiện học như một lượt luyện, để câu sai vào lịch ôn lại.

### Những gì chưa có, cần thêm
- Lệnh máy chủ: `/gv/bpu/mo`, `/gv/bpu/ve`, `/hs/bpu/ve`, `GET /bpu/phong?ve=…` (nâng cấp WebSocket).
- DO `PhongBinhPhanUng` + luật thuần `server/src/bpu-phong.ts` (test được không cần Cloudflare, như `dau-ion-phong.ts`).
- Loại tin `bpu` trong `kenh-day.ts`.
- Bảng `bpu_luot`.

## 5. Ngoại lệ
| Tình huống | Xử lý |
|---|---|
| **Em đang làm bài thi / ở phòng chờ ca / đang làm kiểm tra cá nhân** | KHÔNG BAO GIỜ bị cướp màn. App bỏ qua tin `bpu`. Máy chủ cũng không phát tới em đang có lượt `dang_lam`. Em xong bài mới thấy dòng nhỏ «Thầy đang chiếu Bình Phản Ứng · Vào lớp». |
| **Lớp đang có ca kiểm tra mở** | Hộp chặn trên tờ chiếu (ảnh `b10`), không mở phòng. Đây là một trong ba điều phải dừng ở `CLAUDE.md`. |
| **Câu đang bị giữ cho ca chưa công bố / ca đang mở / Bài tập về nhà có điểm** | Chặn gửi, ghi lý do. Chiếu thì vẫn chiếu như cũ: gửi xuống máy mạnh hơn chiếu vì em chụp màn hình được. |
| **Câu tự luận** | Không chấm trên máy. Em làm ra giấy, bấm «Em làm xong»; bảng chỉ đếm số em xong, Space hiện lời giải. Kênh rút đề tự động vẫn không rút tự luận (`src/lib/cau-tu-luan.ts`); ở đây thầy chủ động chọn nên được, đúng như Gọi lên bảng. |
| **Em đang làm dở chặng** | Lưu nguyên trạng chặng: câu đang làm, đáp án đang chọn, đồng hồ. Xong buổi về đúng chỗ đó. |
| **Hết giờ** | Phòng tự khoá; em chưa gửi thì «Em chưa gửi kịp», không tinh thể, không ghi sai vào hồ sơ. |
| **Mất mạng giữa chừng** | Đáp án đã chọn giữ trên máy. Nối lại trước khi khoá thì gửi, giờ tính theo lúc em bấm (có chặn: không sớm hơn lúc nhận câu). Nối lại sau khi khoá thì báo «Gửi muộn, không tính». |
| **Bấm lặp / hai máy cùng một em** | Phòng nhận lần gửi đầu tiên theo (sbd, mẻ), các lần sau bỏ qua; máy thứ hai thấy «Em đã gửi ở máy khác». |
| **Chữ / công thức dài** | Máy em cuộn trong vùng đề, nút gửi luôn ở đáy. Bảng chiếu tự giảm cỡ chữ như tờ chiếu, giữ ≥ 28 px. Ảnh trong đề hiện đúng như tờ chiếu. |
| **Lớp đông** | Tới 48 em: 3 hàng ô. 49–96 em: ô thu nhỏ chỉ còn kí hiệu, tên hiện khi kết tinh. Hai lớp ghép: chung một phòng, ô chia nhóm theo lớp. |
| **Số đột biến** (cả lớp chọn một phương án, hoặc 0 em gửi) | Ống cao nhất luôn 88% chiều cao, ống 0 em vẫn vẽ vỏ; 0 em gửi thì không rót, chỉ hiện đáp án. |
| **Máy yếu** (`ddh.mayYeu`) / giảm chuyển động | Tắt hạt bay, bọt, mảnh tinh thể, phát sáng; mọi chuyển cảnh tức thì (ảnh `b11`). Bảng chiếu canvas 2D chỉ vẽ khi có thay đổi. |
| **Em đổi tab / tắt màn** | Vẫn được tính; quay lại thấy câu đang mở. Bảng không báo em rời app. |
| **Thầy đóng tờ chiếu giữa chừng** | Phòng sống 10 phút rồi tự kết thúc + ghi kết quả; máy em hiện «Thầy đã kết thúc» và về chỗ cũ. |
| **Em không có mặt nhưng nhập mã** | Thuộc lớp thì vào được và được ghi «vào bằng mã»; không thuộc lớp thì từ chối. |

## 6. Chi phí máy chủ
- **Mở phòng:** 1 đợt chờ D1 (một `batch` 4 câu lệnh) + 1 lần đọc R2 có đệm. Không thêm vòng chờ nối tiếp.
- **Mỗi mẻ:** 0 truy vấn D1. Mọi việc nằm trong phòng DO.
  - Tin WebSocket ≈ số em + 1 cho mỗi sự kiện (câu, gửi, mở).
  - Kết nối ngủ đông: lúc chờ không đánh thức phòng.
- **Đẩy tới máy em:** N lời gọi DO song song (N = số em có mặt, ~30–45), 0 D1.
- **Kết thúc:** 1 `batch` ghi D1 (`bpu_luot` + sự kiện học nếu bật).
- **Lệnh nóng hiện có** (`complete`, `ktcn-start`, chốt chặng, `ktcn-nop`, sảnh): không đổi, đợt chờ giữ nguyên.
- **Tải app:**
  - Máy em: mảnh `ManBinhPhanUng` nạp lười chỉ khi có tin; dùng lại `LamCau` đã nằm trong mảnh chặng. **Byte mở `/hs` không tăng.** Phần nhận tin nằm trong mảnh kênh đẩy đang nạp lười.
  - Bảng chiếu: mảnh `BangBinhPhanUng`, canvas 2D, không three.js. Chỉ máy thầy dùng, đưa vào `globIgnores` (`vite.config.ts`) để precache không vượt 170 tệp / 3000 KB.

## 7. Nghiệm thu đo bằng máy
- **Test vitest mới:**
  - `tests/bpu-phong-0611.test.ts`, luật phòng thuần:
    - chấm 3 kiểu câu;
    - khoá trước khi phát đáp án;
    - **máy em không nhận đáp án trước khi mở**;
    - gửi lặp và hai máy chỉ tính lần đầu;
    - tinh thể = 100 + tối đa 50 theo nhanh (Đúng–sai 25 mỗi ý);
    - hết giờ;
    - nối lại.
  - `tests/bpu-ve-0611.test.ts`: vé HMAC, hạn 2 phút, em ngoài lớp bị từ chối.
  - `tests/bpu-chan-ca-0611.test.ts`:
    - ca đang mở thì chặn;
    - em đang có lượt `dang_lam` thì không nhận tin;
    - câu giữ cho ca / Bài tập về nhà có điểm thì chặn;
    - câu tự luận thì chế độ «Em làm xong».
  - `tests/bpu-kenh-day-0611.test.ts`: tin `bpu` đi thẳng, không gom 1,2 s; `TAT_BPU` / `TAT_KENH_DAY` tắt sạch.
  - `tests/bpu-may-em-0611.test.tsx`:
    - đủ trạng thái máy em;
    - lưu và trả chặng đang làm;
    - chữ theo bảng A2;
    - không nút thoát giữa mẻ.
  - `tests/bpu-to-chieu-0611.test.ts`: phím L có ở tờ chiếu của cả 5 nơi chiếu; điện thoại thầy có Mở đáp án / Mẻ tiếp.
- **Cổng chung:**
  - `tsc`;
  - toàn bộ vitest so theo tên với `main`;
  - `npm run build && npm run kiem:toc-do` 0 đỏ (byte mở `/hs` `/gv` `/ph` không tăng, đợt chờ D1 lệnh nóng không tăng);
  - `npm run kiem:mau-giu` 0;
  - `node scripts/kiem-sw.mjs` đạt;
  - `npm run kiem:co-tep`.
- **Ảnh Chromium sau khi build:** cùng bộ trạng thái như `anh/`, 0 lỗi trang, 0 tràn, 0 đích bấm < 44 px.
- **Sau gộp:** tác tử `toc-do` đo trước/sau (byte mở, chạm được, bấm phương án, khung cuộn CPU ×4/×6, đợt chờ D1). Chưa nhanh hơn thì chưa báo xong.

## 8. Thầy cần chọn (bước 3)
1. **Tinh thể có cộng vào EXP không?** Đề xuất: KHÔNG; tinh thể chỉ tính trong buổi. EXP là luật thầy đã khoá. Kết quả đúng/sai **có** ghi vào hồ sơ như một lượt luyện, do máy chủ chấm, để câu sai vào lịch ôn lại.
2. **Tên ai hiện trên bảng?** Đề xuất: chỉ ô em đúng sáng lên (kết tinh) + huy hiệu 1·2·3 cho 3 em nhanh nhất; em sai không bị đánh dấu; phím H ẩn mọi tên. Bảng kết tinh hiện 8 em đầu. Riêng «Chiếu chữa sau ca» vẫn giữ cách hiện tên em sai màu trung tính như thầy đã chốt 01/11.
3. **Đồng hồ:** mặc định 60 giây, chọn 30 / 60 / 90 / không giới hạn; thầy mở đáp án sớm được, thêm 15 giây được.
4. **Gửi rồi có được đổi?** Đề xuất: không đổi.
5. **Ai nhận câu:** em có mặt theo điểm danh hôm nay + em thuộc lớp nhập mã.

## 9. Ai build (bước 4)
- **Claude** làm toàn bộ tệp mới:
  - máy chủ: DO, luật, lệnh, migration;
  - máy em: `ManBinhPhanUng`;
  - bảng chiếu: `BangBinhPhanUng`;
  - các test.
- **Chạm tệp ngoài làn, mỗi chỗ chỉ thêm, ghi Nhật ký trước khi sửa:**
  - `html-may-chieu.ts`: phím L + nút. Làn cũ của Code 1, phiên đã vắng.
  - `DieuKhienToChieuScreen.tsx`: 3 nút.
  - `kenh-day.ts`: loại tin `bpu`.
  - `server/src/index.ts`: định tuyến.
  - `wrangler.toml`: DO.
  - `vite.config.ts`: `globIgnores`.
- **Chiếu chữa sau ca** (`dung-to-chua-ca.ts`) thuộc làn Codex: chỉ được phím L đi qua tờ chiếu chung, không đổi luồng của Codex. Codex soát PR.
