# ĐỀ XUẤT — Lửa đổi cảm xúc: từ vui vẻ tới siêu cáu (31/10/2026)

Trạng thái: **BƯỚC 2 — CHỜ THẦY DUYỆT ẢNH.** Chưa sửa `src/`, `server/`. Chưa build.
Thầy 31/10: «Tôi muốn nhân vật này chuyển biến giống duolingo chuyển biến từ vui vẻ tới siêu cáu mặt đỏ lừ tức giận, đo theo học sinh học thật và thời gian gấp. Bạn hãy đề xuất rồi vẽ tôi duyệt mới build» · «Cáu tới mức này luôn hoặc hơn thế» (ảnh cú Duolingo đỏ sẫm, mắt đỏ, mày cau).

**Ảnh** (`docs/ban-ve-bi-cam-xuc-3110/`):
- `cac-cap-sang.jpg`, `cac-cap-toi.jpg` — 6 cấp đặt cạnh nhau.
- `lo-trinh-cap5-dt-*`, `-ngang-*`, `-mt-*` (sáng / tối) — Lộ trình THẬT (bản build + máy chủ giả), Lửa cấp 5 + bong bóng.
- `noi-hien-sang.jpg`, `noi-hien-toi.jpg` — tab trình duyệt, thông báo, biểu tượng màn hình chính.
- Chụp lại: `node scripts/ban-ve-bi-cam-xuc-3110/chup.mjs`.

## Tóm tắt (đọc 30 giây)
- Nhân vật là **Lửa** đang có (linh vật Cú Ngọc: lông chàm tím, kính bảo hộ, chỏm lửa hồng, áo blouse; mã `Bi.tsx` + `lua-dong.ts`). KHÔNG vẽ con mới: giữ hình, giữ dáng có sẵn, chỉ đổi mặt, màu, chỏm lửa, hiệu ứng.
- **6 cấp:** 0 Vui vẻ · 1 Chờ em · 2 Sốt ruột · 3 Bực · 4 Giận · 5 **Siêu cáu, mặt đỏ lừ**.
- Cấp 5 mạnh hơn cú Duolingo: cả con đỏ sẫm, mặt đỏ lừ, mắt đỏ rực, mày chữ V, nghiến răng, hơi nước phụt hai tai, lửa bùng gấp đôi, quầng đỏ.
- Cấp đo bằng **giờ** × **số câu còn thiếu** + **câu có được tính không** (bấm vội, treo máy ⇒ «chưa được tính»).
- **Em làm thật là Lửa hết giận ngay.** Không bao giờ giận vì điểm thấp hay làm sai.
- Đợt 1: 0 lệnh máy chủ mới, 0 lượt đọc D1.

## 1. Mục tiêu sư phạm + ai dùng
- **Ai dùng:** học sinh, trang Lộ trình (giao diện «Trong»). Thầy và phụ huynh không thấy Lửa.
- **Cảm giác cần đạt** (như Duolingo):
  - em thấy Lửa sốt ruột dần theo giờ;
  - tối muộn chưa làm thì Lửa cáu đỏ mặt;
  - em làm thật thì Lửa vui ngay.
- Áp lực nằm ở **hình**. **Chữ** chỉ nói sự thật: giờ, số câu, chuỗi.
- Lửa giận vì **việc**: muộn mà chưa làm, làm vội nên câu không được tính.
- Lửa không giận vì **năng lực**: em yếu mà làm thật vẫn được vui (cùng tinh thần `server/src/danh-gia-hoc-that.ts`: «điểm thấp không bao giờ là lý do Đối phó»).

## 2. Bố cục
### 2.1 Sáu cấp (ảnh `cac-cap-*`)
| Cấp | Tên | Dáng (có sẵn trong `CAM_XUC_LUA`) | Mặt + màu | Hiệu ứng |
|---|---|---|---|---|
| 0 | Vui vẻ | `vui` nảy | mắt cười híp, màu gốc | lấp lánh |
| 1 | Chờ em | `chao` vẫy (như hôm nay) | mắt cười, màu gốc | vạch «!» |
| 2 | Sốt ruột | `doi` khoanh tay, liếc | môi chu, má hồng đậm | đồng hồ báo thức nhỏ |
| 3 | Bực | `caunhau` lẩm bẩm | nheo một mắt, mặt ửng, lông ngả đỏ 20% | 1 gân giận |
| 4 | Giận | `gian` nắm tay | mày chữ V, tròng đỏ, nghiến răng, lông tím đỏ, mặt đỏ hồng | 2 gân, khói xám, chỏm lửa cam to |
| 5 | Siêu cáu, mặt đỏ lừ | `gian`, rung mạnh hơn | cả con đỏ sẫm, mặt đỏ lừ, mắt đỏ rực lõi vàng, mày dày ép mắt, răng nghiến to, kính tối | hơi nước hai tai, lửa bùng, quầng đỏ, vạch rung |

- **Chuyển động:** cấp 4 rung nhẹ (đã có ở `gian`). Cấp 5 rung mạnh hơn, khói phập phồng, lửa chập chờn. Mỗi nhịp ≤ 250 ms.
- **Giảm chuyển động / máy yếu:** Lửa đứng yên, vẫn đúng mặt và màu của cấp.

### 2.2 Nơi hiện
1. **Lửa cạnh đường** trên Lộ trình (`DuongChang`, ô `.da-linh-vat`):
   - đổi mặt và màu theo cấp;
   - cấp 4–5 to hơn (83 → 104 px) để thấy rõ mặt;
   - từ cấp 2, Lửa luôn có màu. Hôm nay khi chặng bên cạnh chưa mở, Lửa xám và ngủ; vẫn giữ như vậy cho cấp 0–1.
2. **Bong bóng lời** (`LoiBi`): lời theo cấp (mục 3). Cấp 4–5 viền màu `--tr-sai`.
   - **Điện thoại dọc và máy tính:** đặt ở đầu trang như hôm nay.
   - **Điện thoại ngang (cao < 600 px):** Lộ trình tự cuộn tới chặng hiện tại, nên bong bóng đầu trang bị khuất. Đã đo: nằm ở −38…44 px, sau dải tên bài.
   - Vì vậy trên màn ngang, từ cấp 2 bong bóng nói **cạnh Lửa**, đuôi chỉ vào Lửa (ảnh `lo-trinh-cap5-ngang-*`).
3. **Vòng Mục tiêu ngày** (đầu Lửa trong vòng `.tp-tr-vong`): cùng mặt và màu. Xem cột số «0/40» trong ảnh máy tính.
4. **Biểu tượng tab trình duyệt:** cấp 4–5 đổi sang đầu Lửa đỏ; hạ cấp thì về logo.
5. *(Đợt 2, thầy chọn)* **Thông báo đẩy:** ảnh đầu Lửa theo cấp, tối đa 2 lần mỗi tối.
6. **Biểu tượng ngoài màn hình chính: KHÔNG đổi hình được** (lý do ở mục 5). Thay bằng chấm số = số câu còn thiếu.

- **Không thêm nút mới.** Nút chính vẫn là «Bắt đầu» / «Học tiếp» trên chặng hiện tại.
- **Màu khung** (bong bóng, viền): chỉ dùng token có sẵn của app học sinh (`--tr-sai`, `--tr-mat`, `--tr-vien-2`…).
- **Màu đỏ giận của Lửa là MÀU VẼ MỚI, chỉ nằm trong hình SVG:**
  - biến mới: `--cn-gian`, `--cn-matDo`, `--cn-matSang`, `--cn-hoi`, `--cn-luaNgoai`, `--cn-rang`;
  - cùng phần đè `--cn-*` theo cấp;
  - tất cả pha bằng `color-mix` từ token có sẵn (`--tr-sai-day`, `--tr-chu-y-day`, `--tr-chu-y-nut`, `--tr-sao`, `--tr-tin`) với đen / trắng cố định — đúng cách `cu-ngoc.css` đang làm;
  - không có mã màu thô. Bản nháp: `scripts/ban-ve-bi-cam-xuc-3110/lua-gian.css`.

## 3. Trạng thái + lời bong bóng
| Cấp | Lời theo giờ | Lời khi câu chưa được tính |
|---|---|---|
| 0 | Giữ lời cũ: «Đủ mức rồi! Giờ đến Tự sửa lỗi nhé.» · «Xong hết việc hôm nay! Em giỏi lắm.» · Vừa làm thật: «Em làm thật, Lửa vui lắm! Còn 12 câu nữa là đủ mức.» | — |
| 1 | Giữ lời cũ: «Học tiếp nhé! Còn 18 câu nữa là đủ mức hôm nay.» | — |
| 2 | «Đã 20:15 rồi. Còn 28 câu nữa là đủ mức hôm nay.» | — |
| 3 | «Lửa bực rồi đấy! 21:30 mà còn 30 câu. Học ngay nhé.» | «Mấy câu vừa rồi chưa được tính. Đọc kĩ đề rồi làm nhé.» |
| 4 | «Lửa giận rồi! 22:20 mà mới làm 6/40 câu. Chuỗi 12 ngày đang chờ em.» | «Lửa giận rồi! 3 câu liền chưa được tính. Dừng lại, đọc kĩ đề.» |
| 5 | «Lửa cáu lắm rồi! 23:05 mà chưa làm câu nào. Còn 54 phút (tới 23:59) để giữ chuỗi 12 ngày.» | «Lửa cáu lắm rồi! 5 câu liền chưa được tính. Đọc kĩ đề rồi làm.» |

- Số trong bảng là ví dụ. Khi build, mọi số lấy từ dữ liệu thật.
- **Luật chữ** (`docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`):
  - từ chuẩn: «đủ mức», «Chuỗi N ngày», «chặng», «chưa được tính» (chữ em đã thấy ở tấm kết quả câu);
  - giờ viết HH:MM, 24 giờ; khoảng còn lại kèm mốc thật «(tới 23:59)»;
  - chữ đứng yên, không nhảy giây;
  - **cấm:** lười, đối phó, bấm vội, treo máy, cẩu thả, nhãn năng lực, emoji, viết hoa cả câu.
- **Luật 7 «không doạ»:** phần áp lực nằm ở mặt Lửa (thầy yêu cầu). Chữ chỉ nói sự thật, không doạ phạt, không gắn nhãn.
- **Bong bóng hiện bao lâu:**
  - cấp 0–3: nhắc một lần như luật 27/10. Khoá = ngày | cấp | lý do, nên lên cấp là khoá mới ⇒ hiện lại một lần;
  - cấp 4–5: hiện mỗi lần mở Lộ trình, không tự ẩn;
  - mặt Lửa luôn theo cấp, không ẩn.
- **Trạng thái chung:**
  - **Đang tải** (`!so`): cấp 1, chữ «Đang tải bài học hôm nay…» như cũ. Không đoán.
  - **Lỗi / mất mạng**, số lấy từ bản lưu: tối đa cấp 3.
  - **Rỗng** (mức hôm nay bằng 0, hoặc hết câu `p.hetCau` / `so.duNgay`): cấp 0.
  - **Có dữ liệu:** theo luật mục 4.

## 4. Dữ liệu + LUẬT CHỌN CẤP
### 4.1 Dữ liệu ĐÃ CÓ trên máy em (không thêm lệnh máy chủ)
| Cần | Trường thật | Ở đâu |
|---|---|---|
| Câu đã làm / mức hôm nay | `so.daLam`, `so.muc` (kiểu `SoHomNay`, qua `nangSoTuChangDangDo(p.so)`); `con = so.muc − so.daLam`, `du` | `TrongHs.tsx`. Nguồn: Sảnh `hanhTrinh.daLam/toiThieu` hoặc `goi7.daLamHomNay/toiThieu` |
| Hết câu | `p.hetCau`, `so.duNgay` | `TrongHs.tsx` |
| Chuỗi | `chuoi = tq.chuoiNgay.so ?? nhip.chuoiDuGanNhat` | `/hs/thuong` (`useTongQuan`) |
| Hôm nay đã giữ chuỗi | `giuHomNay`: `tq.chuoiNgay.lich7` hôm nay có `kieu === 'hoc'` | `TrongHs.tsx` |
| Bình giữ chuỗi | `tq.chuoiNgay.giuChuoi` (lớn hơn 0 thì bình tự đỡ ⇒ chuỗi chưa mất) | `/hs/thuong` |
| Ngày nghỉ | `lich7` hôm nay có `kieu` là `'phep'` hoặc `'tat'` | `/hs/thuong` |
| Giờ Việt Nam | `gioMayChu()` (`src/lib/gio-may-chu.ts`, đã chỉnh theo `serverNow`) + 7 giờ, như `ngayVn()` | máy em |
| Câu có được tính? | `thuong.tinh` trong phản hồi lệnh `answer`. Ở `ManLamBaiTap.tsx`: `khongTinh = th?.tinh === false`; chấm nhanh gửi `khongTinh: true` | máy chủ tính bằng `khongTinhTuDo` → `cauKhongDuocTinh` |
| Việc khác phải làm trước | `p.coCa` (`chinh === 'ca'`), `p.ngayKiem`, `khoaKt`, `tq.tamDong` | `TrongHs.tsx` |
| Số cũ / lỗi | `tqTai.loi`, Sảnh lấy từ bản lưu | `useTai` |

- **Khi nào máy chủ đặt `tinh: false`:** chỉ ở hai Mức làm.
  - **Bấm vội:** trả lời nhanh hơn thời gian đọc đề MÀ SAI.
  - **Treo máy.**
  - Trả lời nhanh mà đúng vẫn được tính. Thiếu số đo thì cũng được tính (`server/src/thuong-luat.ts`).
  - Máy em chỉ nhận `tinh: false`, không nhận nhãn nào khác.
- **KHÔNG dùng nhãn tuần «Học thật / Đối phó»** (`bacCongKhai`).
  - Máy chủ cố ý không gửi nhãn này xuống máy em: `server/src/an-luoi-hs.ts`, lệnh `/hs/danh-gia` chỉ trả `ok`. Đây là lệnh của thầy 26/10: «CHỈ THẦY VÀ PHỤ HUYNH xem được».
  - Nếu Lửa giận theo nhãn tuần thì em đoán ra nhãn. Vì vậy đợt 1 không dùng (thầy quyết ở mục cuối).

### 4.2 Luật (một hàm thuần, chạy lại mỗi lần mở Lộ trình / về từ chặng / quay lại tab)
**Bước 1 — Gấp theo giờ.**
- Chỉ áp dụng khi CHƯA đủ mức. Giờ Việt Nam. `p = so.daLam / so.muc`.

| Giờ | đã làm ≥ 50% mức | đã làm 1–49% | chưa làm câu nào |
|---|---|---|---|
| trước 19:00 | 1 | 1 | 1 |
| 19:00–20:59 | 1 | 2 | 2 |
| 21:00–21:59 | 2 | 3 | 3 |
| 22:00–22:59 | 3 | 4 | 4 |
| 23:00–23:59 | 4 | 4 | **5** |

- **Chuỗi sắp mất** ⇒ **cấp 5** từ 23:00. Chuỗi sắp mất nghĩa là cả ba điều:
  - `chuoi ≥ 3`;
  - hôm nay chưa giữ chuỗi (`!giuHomNay`);
  - không còn bình giữ chuỗi (`giuChuoi === 0`).

**Bước 2 — Học thật.** Áp dụng ở mọi giờ, kể cả đã đủ mức. Đếm trên **10 câu nộp gần nhất HÔM NAY**:
- 3–4 câu chưa được tính ⇒ **+1 cấp**, và ít nhất cấp 3.
- Từ 5 câu chưa được tính, hoặc **3 câu LIỀN** chưa được tính ⇒ **+2 cấp**, và ít nhất cấp 4.
- Cấp = nhỏ hơn trong hai số: 5, và (cấp bước 1 + phần cộng, nhưng không thấp hơn mức «ít nhất»). Đã đủ mức thì cấp bước 1 = 0.

**Bước 3 — Hạ nhiệt.** Thắng bước 1 và 2:
- **3 câu LIỀN được tính** ⇒ bỏ ngay phần cộng của bước 2 (về cấp theo giờ).
- **Xong một chặng mà ≥ 4/6 câu được tính** ⇒ cấp 0 «Vui vẻ» trong 30 phút, bỏ qua bước 1.
  - Mỗi chặng làm thật tiếp theo tính lại 30 phút.
  - Hết 30 phút mà không làm thêm ⇒ tính lại theo bảng.
- **Đủ mức** và không bị cộng ở bước 2 ⇒ cấp 0 (giữ lời cũ).
- Chỉ việc em làm mới hạ được cấp. Giờ trôi thì cấp chỉ tăng.

**Ví dụ:**
| Lúc | Tình huống | Cấp |
|---|---|---|
| 20:10 | 0/40 câu | 2 Sốt ruột |
| 21:40 | 12/40 câu | 3 Bực |
| 22:30 | 6/40 câu | 4 Giận |
| 23:05 | 0/40 câu, chuỗi 12 ngày chưa giữ | 5 Siêu cáu |
| 15:00 | 3 câu liền chưa được tính (1 + 2, ít nhất 4) | 4 Giận |
| 15:00 | rồi làm tiếp 3 câu được tính | 1 Chờ em |
| 22:45 | vừa xong chặng 2, 6/6 câu được tính | 0 Vui vẻ tới 23:15 |
| 23:15 | không làm thêm, còn thiếu câu | tính lại: 4, hoặc 5 nếu chuỗi sắp mất |

### 4.3 Cần thêm (đều ở máy em)
- **Sổ nhỏ `ddh.lua-that`** (localStorage, theo SBD + ngày Việt Nam):
  - lưu 10 kết quả «được tính / chưa tính» gần nhất và giờ xong chặng làm thật gần nhất;
  - ghi ở `ManLamBaiTap.tsx` lúc nhận `thuong`;
  - em đổi máy giữa ngày ⇒ sổ trống ⇒ chỉ mất phần cộng bước 2. Lửa không giận oan.
- **Hàm luật:** hàm thuần `capGianLua(vao) → 0…5` và `loiLua(cap, vao)` trong `src/lib/` (một nguồn, test được).
- **Hình:** `lua-dong.ts` thêm tham số cấp (màu, mắt, miệng, gân, hơi nước, lửa) như bản vẽ. `Bi` thêm prop `cap`; `DuongChang` / `LoiBi` truyền `cap`.
- **Đợt 2 (thông báo đẩy):**
  - máy chủ cần biết em nào chưa đủ mức lúc 21:30 và 22:45;
  - gửi kèm `icon` (ảnh PNG 192 px đầu Lửa theo cấp, để sẵn trong `public/`);
  - `src/sw.ts` đọc `data.icon` thay cho ảnh logo cố định hôm nay.

## 5. Ngoại lệ
**Lửa không giận (hoặc giận có trần) khi:**
- **Ca kiểm tra đang mở** ⇒ cấp 1, giữ lời «Có ca kiểm tra đang mở…».
- **Ngày Kiểm tra ôn tập** (`p.ngayKiem`), hoặc Kiểm tra ôn tập đang khoá chặng (`khoaKt`) ⇒ tối đa cấp 2, lời nói về Kiểm tra ôn tập.
- **Thầy tạm đóng app** (`tq.tamDong`) ⇒ không có Lửa, như hôm nay.
- **Nghỉ phép, thầy tắt ngày, hết câu, mức bằng 0** ⇒ cấp 0.
- **Ngày đầu em vào app** (chưa có chuỗi, chưa làm câu nào bao giờ) ⇒ tối đa cấp 2.
- **Mất mạng giữa chừng**, số lấy từ bản lưu ⇒ tối đa cấp 3. Không cáu nặng theo số cũ.

**Thời gian:**
- Đồng hồ máy em sai ⇒ dùng giờ máy chủ khi đã chỉnh.
- Qua 00:00 ⇒ ngày mới, về cấp 1.
- Đổi tab hoặc khoá máy rồi mở lại ⇒ tính lại ngay (`visibilitychange`). Không chạy ngầm.

**Thao tác và hiển thị:**
- **Chạm liên tục vào Lửa:** cấp 0–2 cười khúc khích như cũ (`choc`); cấp 3–5 giậm chân, không cười.
- **Chữ dài:** bong bóng ≤ 110 ký tự, xuống dòng tự nhiên. Tên bài không đưa vào bong bóng.
- **Máy yếu / giảm chuyển động:** Lửa đứng yên (`biDungYen` đã có). Hơi nước và quầng đỏ vẽ tĩnh, không dùng `filter` nặng.
- **Màn ngang thấp:** bong bóng đặt cạnh Lửa (mục 2.2).
- **Thông báo đẩy** (đợt 2): không gửi khi đã đủ mức, đang có ca, hoặc ngày nghỉ. Tối đa 2 lần mỗi tối.

**Vì sao không đổi được biểu tượng ngoài màn hình chính như Duolingo:**
- Duolingo là app cài từ kho. App cài từ kho được tự đổi biểu tượng.
- App mình là web cài lên màn hình. Hình biểu tượng lấy từ `manifest-hs.json` lúc cài:
  - mọi em dùng chung một hình;
  - trình duyệt chỉ thỉnh thoảng cập nhật hình;
  - nên không đổi theo từng em, từng giờ được.
- **Làm được:**
  - Lửa trong app;
  - biểu tượng tab trình duyệt;
  - ảnh trong thông báo đẩy;
  - chấm số trên biểu tượng (`navigator.setAppBadge`): có trên iPhone iOS 16.4+ (đã cài lên màn hình và cho phép thông báo) và Chrome/Edge máy tính. Android chỉ hiện chấm khi có thông báo.

## 6. Chi phí máy chủ
- **Đợt 1:**
  - 0 lệnh mới, 0 lượt đọc/ghi D1, 0 vòng chờ. Mọi thứ tính trên máy em từ số đã có;
  - lệnh nóng `answer` không đổi (đã có `thuong.tinh`);
  - không dùng đáp án, nên không đụng luật «đáp án không xuống máy».
- **Dung lượng tải:**
  - hình giận nằm trong mảnh nạp lười `lua-dong`, ước thêm 2 KB (nén gzip);
  - hàm luật + lời khoảng 1 KB, nằm trong mảnh `TrongHs` (đã nạp lười);
  - ⇒ dung lượng lúc mở app không đổi;
  - ảnh đầu Lửa đỏ cho tab: một tệp SVG khoảng 2 KB, chỉ tải khi lên cấp 4.
- **Đợt 2 (thông báo):**
  - 2 lượt mỗi tối, mỗi lượt một câu đọc gộp: những em đã đăng ký thông báo × số câu đã làm hôm nay;
  - chạy trong cron mỗi phút có sẵn (`deliverNotices`), không chạm lệnh của em.

## 7. Nghiệm thu đo bằng máy
**Test vitest mới:**
- `tests/cap-gian-lua-3110.test.ts`:
  - đủ 15 ô của bảng giờ × số câu;
  - chuỗi sắp mất;
  - bước 2: 3–4/10, từ 5/10, 3 câu liền;
  - bước 3: 3 câu liền được tính, xong chặng làm thật trong 30 phút;
  - mọi ngoại lệ ở mục 5 và các ví dụ ở mục 4.
- `tests/loi-lua-3110.test.ts`, kiểm mọi lời:
  - không chữ cấm (lười, đối phó, bấm vội, treo máy, cẩu thả, ngu, dốt, kém);
  - không emoji, không viết hoa cả câu, ≤ 110 ký tự;
  - giờ dạng HH:MM;
  - số nào cũng có nhãn (câu, ngày, phút).
- `tests/lua-cap-ve-3110.test.ts`:
  - dựng Lửa cấp 0–5 không lỗi;
  - cấp 4–5 có tròng đỏ, răng, gân; cấp 5 có thêm hơi nước và lớp lửa ngoài;
  - cấp 0–1 giống hệt hình hôm nay.
- `tests/lua-that-so-3110.test.ts`: sổ `ddh.lua-that` giữ đúng 10 câu, tách theo ngày Việt Nam + SBD, máy chặn localStorage thì không lỗi.

**Test cũ phải giữ xanh:** `tests/an-luoi-hs-2610.test.ts` (không lộ nhãn lười), các test Lộ trình / `LoiBi` đang có.

**Cổng:** `npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · `npm run check:mau` 0.

**Ảnh Chromium** (3 khổ × sáng/tối, chạy `scripts/ban-ve-bi-cam-xuc-3110/chup.mjs` trên bản build thật): yêu cầu 0 lỗi trang, 0 tràn ngang, 0 đích chạm < 44 px.
- Bản vẽ này đã đo: 0 lỗi trang, 0 tràn ngang, 0 đích chạm < 44 px.

## Thầy quyết (mặc định em đề xuất in đậm)
1. **Mốc giờ:** bực từ **21:00**, cáu nhất từ **23:00**. Hay thầy muốn sớm hơn?
2. **Dùng nhãn tuần «Học thật / Đối phó»?** Đề xuất **không**. Giữ lệnh 26/10 giấu nhãn khỏi máy em; Lửa chỉ dùng «câu chưa được tính» hôm nay, chữ em đã thấy.
3. **Lời có thời gian còn lại** «còn 54 phút (tới 23:59)»: đề xuất **có**, chữ đứng yên. Luật C14 cấm đếm ngược ngoài màn kiểm tra ⇒ đây là ngoại lệ, chỉ cho Lửa cấp 4–5.
4. **Cấp 4–5 hiện bong bóng mỗi lần mở Lộ trình:** đề xuất **có**.
5. **Thông báo đẩy kèm Lửa giận:** đề xuất **làm ở đợt 2**, sau khi đợt 1 chạy 1 tuần.
6. **Lời cấp 4–5 nhắc chuỗi** («Chuỗi 12 ngày») khi chuỗi từ 3 ngày: đề xuất **có**.

Thầy «chốt» ⇒ build theo đúng đặc tả này (làn Claude: `src/components/linh-vat/`, `src/components/hoc-tap/TrongHs.tsx`, `src/lib/`).
