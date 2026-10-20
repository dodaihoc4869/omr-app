# Đặc tả Tự sửa lỗi (app học sinh): việc vừa sức, tiến độ thật, bằng chứng đã sửa — 20/10/2026

**Trạng thái: CHỜ THẦY DUYỆT ẢNH. Chưa sửa `src/`, chưa build.**
Bản vẽ: `docs/ban-ve-tu-sua-2010/tu-sua.html` · ảnh Chromium thật ở `docs/ban-ve-tu-sua-2010/anh/` (6 khung, 3 khổ, sáng + tối, chụp bằng `node scripts/chup-ban-ve-tu-sua-2010.mjs`). Số liệu trong ảnh là số GIẢ.

## 1. Vấn đề thầy chỉ ra
Thẻ ở Hôm nay đang ghi **"155 câu đang chờ em sửa"**. Em nhìn một con số lớn thì nản trước khi bấm. Sau khi bấm, em gặp danh sách dài, làm xong một câu thì mọi thứ vẫn y như cũ, và lúc "Đã tự sửa" chỉ có một dòng chữ đổi trạng thái.

Đã đọc mã (20/10):
- Câu xong khi em **tự làm đúng bản mới** ở lần gặp lại 2 (sau ≥ 24 giờ kể từ lúc ghép xong bài), không dùng gợi ý, không đọc lời giải trong 12 giờ trước lúc nộp.
- Điều kiện ấy chỉ hiện SAU khi nộp. Từ 13/10 thầy đã bỏ các khối hướng dẫn ở màn này.
- Danh sách chỉ có số "cần sửa", không cho em thấy mình đã đi được bao xa.

## 2. Nguyên tắc (thầy 20/10 + `CHUAN-TU-NGU-VA-GIAO-DIEN.md`)
- **Không EXP, không điểm thưởng, không xếp hạng, không đếm ngược, không màu mới.** Ý nghĩa đến từ **việc vừa sức, tiến độ thật, bằng chứng thật**.
- Một khái niệm một từ: dùng "tự sửa" (không dùng "vá"). Con số nào cũng có nhãn.
- Màn học sinh không hiện điểm dự báo. "Dạng vững a/b" máy chủ hiện luôn trả null nên bản vẽ KHÔNG dùng.

## 3. Bốn đề xuất, xếp theo tác động

| # | Em thấy gì | Khung | Cần gì thêm |
|---|---|---|---|
| **1** | Thẻ Hôm nay: từ "155 câu" thành **"Hôm nay sửa 3 câu"** + 3 ô tiến độ + dòng "Còn 152 câu cho các ngày sau". Câu chỉ còn làm bản mới thì đứng đầu: "2 câu chỉ còn làm bản mới là xong". Xong 3 câu: thẻ xanh, nút phụ "Sửa thêm 1 câu" (em được phép dừng) | 01, 02 | Cột `xongLuc` (chỉ-thêm) trong lệnh `danh-sach` |
| **2** | Đầu màn Tự sửa lỗi: **Việc hôm nay** (3 thẻ câu, mỗi thẻ có 4 chấm chặng: sửa từng bước → ghép cả bài → bản mới → đã tự sửa). Bên cạnh: "Em đã tự sửa 50 câu từng sai" + 7 ngày gần đây. **Một dòng điều kiện** chỉ hiện lúc làm bản mới: "Tự làm, không xem gợi ý hay lời giải. Đúng thì câu này tính là đã tự sửa." | 03, 04 | Chỉ chữ và giao diện (xem quyết định B) |
| **3** | Khoảnh khắc **"Em đã tự sửa xong câu này"**: 4 mốc có ngày thật (sai lần đầu → sửa từng bước → ghép cả bài → tự làm đúng bản mới), các bước em đã tự làm đúng, khối "Trước đây / Bây giờ" (chỗ em từng nghĩ sai và cách đúng), tiến độ của dạng ("10 trên 34 câu từng sai đã sửa xong"), một nút chính "Sửa câu 3/3 hôm nay" | 05 | `moc[]` + `loiDaSua[]` chỉ-thêm ở trạng thái `da_tu_sua` (đọc từ ảnh chụp phiên đã có) |
| **4** | **Sửa theo dạng**: 9 dạng, mỗi dạng có "đã sửa 9/33 câu" + thanh tiến độ. Em thấy bản đồ lỗi của mình nhỏ dần theo từng dạng | 06 | Lệnh đọc mới, chỉ gọi khi mở màn (xem mục 6) |

Thứ tự làm: **Đợt A = 1 + 2 + phần của 3 có sẵn dữ liệu**. **Đợt B = 4 + khối "Trước đây / Bây giờ" + 4 mốc có ngày**.

## 4. Đặc tả 7 mục

**4.1 Mục tiêu sư phạm.** Học sinh lớp 10–12 đang có nhiều câu sai tồn. Cảm giác cần đạt: "việc hôm nay nhỏ, làm được, làm xong là thấy mình đã khác đi". Sửa lỗi là việc có kết thúc trong ngày, không phải cái hố vô đáy. Thầy và phụ huynh không xuất hiện trên màn này.

**4.2 Bố cục.** Điện thoại dọc: một cột, nút chính đặt dưới cùng khối Việc hôm nay (khung 03) hoặc cuối màn (khung 04, 05). Ngang: một cột, thanh dưới giữ như app. Máy tính: hai cột (việc chính bên trái, tiến độ bên phải). Mỗi khung đúng **một nút chính**, các nút khác là nút viền hoặc nút chữ. Thẻ Hôm nay giữ nhận diện đang dùng (nền vàng dịu, vạch trái, biểu tượng 60 px, nút viền) để em nhận ra ngay.

**4.3 Trạng thái.**
- Thẻ Hôm nay có 4 trạng thái: có việc · có câu chỉ còn làm bản mới · đang làm dở · xong hôm nay (khung 02). Không còn câu cần sửa ⇒ không vẽ thẻ (đúng như hiện tại).
- Đang tải, trống, lỗi, mất mạng: giữ nguyên các khung đang có ở `ManTuChua`. Máy chủ lỗi ⇒ thẻ ẩn, không chặn Hôm nay (như `useSoCauCanSua`).
- Màn "xong": nếu máy chủ chưa trả khối nào thì khối đó ẩn, **không điền chữ thay**.

**4.4 Dữ liệu** (nguồn thật, thiếu thì ghi rõ):

| Thứ hiện | Nguồn | Có sẵn? |
|---|---|---|
| Số câu cần sửa, nhóm cần/chờ/xong, thứ tự câu | `apiDanhSachTuChua` (`/hs/chua-cau-sai/danh-sach`); máy chủ xếp lần gặp lại đã tới trước | Có |
| "Câu chỉ còn làm bản mới" | `trangThai='cho_gap_lai_2'` và `denHan` đã tới (`nhomMucChua`) | Có |
| Đã sửa hôm nay (ô tiến độ 1/3) và 7 ngày gần đây | Đợt `da_tu_sua` có `dong_luc` (đường đóng qua Hỏi thầy) hoặc `cap_nhat_luc` (lệnh nộp ghi lúc nộp, nhưng lệnh nộp không ghi riêng cột "xong lúc") | **Thiếu**: thêm `xongLuc` chỉ-thêm vào `danh-sach` (cùng đợt đọc, không thêm vòng chờ). Khi build phải đọc lại các đường ghi để chắc `cap_nhat_luc` không bị đổi sau lúc xong; không chắc thì thêm cột `xong_luc` bằng migration chỉ-thêm |
| Tên dạng của câu, "sai lần gần nhất dd/mm · nguồn" | `Câu đã làm` (`tenDang`, `lichSu`) như `dungDong` đang dùng | Có ở màn Tự sửa lỗi. Thẻ Hôm nay chưa có tên dạng ⇒ đợt A **không ghi** "Cùng dạng …" |
| 4 mốc có ngày thật | bảng `chua_loi_nop` (`nop_luc`, `loai`) của đợt | **Thiếu** ở máy em: thêm `moc[]` ở trạng thái `da_tu_sua` |
| "Các bước em đã tự làm đúng" | ảnh chụp phiên (`tienDo` các bước `co_bang_chung_hieu_trong_phien`); `phanHoi.phanGiuDuoc` đã có chữ này | Có |
| "Trước đây / Bây giờ" | `maLoiDaXacNhan` trong `tienDo` ⇒ `doiChieu[].cachNghiCu` / `cachDung` của học liệu | **Thiếu** ở máy em: thêm `loiDaSua[]` chỉ-thêm. Chỉ hiện khi có ít nhất một mã lỗi đã xác nhận |
| "10 trên 34 câu đã sửa" và màn Sửa theo dạng | gom đợt theo dạng của câu | **Thiếu**: cần lệnh đọc mới. Chưa xác định cột dạng/chuyên đề nào dùng được, phải đo D1 trước khi chốt |

**4.5 Ngoại lệ.**
- Chuyển ngày lúc em đang làm: số "hôm nay" tính theo giờ VN từ `xongLuc`, không lưu bộ đếm riêng ⇒ không lệch.
- Mất mạng lúc nộp bản mới: giữ cơ chế nộp một lần (`chua_loi_nop`, mã nộp), màn xong chỉ hiện khi máy chủ trả `da_tu_sua`.
- Câu thuộc ca kiểm tra chưa công bố (`khoa`): ẩn khối cần đề/đáp án, vẫn hiện 4 mốc.
- Không có lần sai để so, tên dạng dài 2 dòng, 155 câu (danh sách tải 100 câu đầu rồi "Xem tiếp"), bấm lặp, đổi tab, máy yếu: dùng đúng cách hiện có của `ManTuChua`. Hiệu ứng tôn trọng `prefers-reduced-motion`.
- Chống lạm dụng: không có điểm hay thưởng nên không có gì để cày. Việc hôm nay không khoá em, em có thể sửa thêm.

**4.6 Chi phí máy chủ và tốc độ** (luật tốc độ 13/10).
- Thẻ Hôm nay: dùng bản nhớ `taiTuSuaLoi` 10 phút như hiện tại, **0 lượt gọi mới**; chỉ thêm 1 cột trong lệnh đã có.
- Lệnh `danh-sach` vẫn là MỘT `DB.batch`; cột `xongLuc` đọc cùng bảng `chua_loi_dot`, không vòng chờ nối tiếp.
- `moc[]` và `loiDaSua[]`: chỉ thêm ở trạng thái `da_tu_sua`; `loiDaSua[]` lấy từ ảnh chụp phiên đã đọc, `moc[]` thêm 1 truy vấn chạy song song trong cùng đợt đọc đã có.
- Sửa theo dạng: lệnh riêng, chỉ gọi khi em mở màn, nạp lười. Hôm nay không phụ thuộc.
- Đáp án không xuống máy trước khi nộp: khối "Trước đây / Bây giờ" là chữ về cách nghĩ, không chứa đáp án câu hỏi.
- App: các khối mới nạp lười như `BieuTuongTuSua`; phải `npm run build && npm run kiem:toc-do` 0 đỏ, không nâng mốc.

**4.7 Nghiệm thu đo bằng máy.**
- Test mới (tên đề xuất): `tests/tu-sua-viec-hom-nay-2010.test.tsx` (4 trạng thái thẻ, cắt đúng 3 câu theo thứ tự máy chủ, "hôm nay" theo giờ VN), `tests/tu-sua-xong-2010.test.tsx` (khối ẩn khi thiếu dữ liệu, không bịa chữ), `tests/tu-sua-may-chu-2010.test.ts` (cột chỉ-thêm, số vòng chờ D1 không tăng), giữ xanh `tu-sua-moi-goi-dot18-1310`, `tu-chua-danh-sach-1210`, `tu-sua-phan-trang-1610`.
- `npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · `npm run check:mau` · `tsc` hai phía · `node scripts/kiem-sw.mjs`.
- Ảnh Chromium sau build: 0 lỗi trang, 0 tràn, 0 đích chạm < 44 px, sáng + tối, 390 / 844 / 1440.

## 5. Quyết định cần thầy chốt
- **A. Số câu mỗi ngày.** Bản vẽ dùng **3**. Với 155 câu thì 3 câu/ngày chưa hết trong nhiều tháng, nhưng em thấy tiến độ thật nhờ màn Sửa theo dạng. Thầy muốn 3, 5, hay để mỗi em tự chọn?
- **B. Dòng điều kiện ở bản mới.** Đi ngược một phần lệnh 13/10 ("bỏ hết gợi ý hướng dẫn"). Đề xuất đúng **một dòng**, chỉ hiện lúc em sắp làm bản mới, không có khối hướng dẫn nào khác. Đồng ý hay bỏ?
- **C. "Trước đây / Bây giờ".** Chỉ hiện khi hệ thống đã xác nhận được chỗ em nghĩ sai (không bịa). Đồng ý?
- **D. "7 ngày gần đây".** Chỉ đếm câu đã sửa xong, ngày không làm để xám, không có chuỗi ngày, không tô đỏ. Giữ hay bỏ?
- **E. Màn Sửa theo dạng** (khung 06) làm cùng đợt hay đợt sau? Đợt sau thì đợt A không cần lệnh máy chủ mới.

## 6. Điều chưa kiểm chứng hay cần người khác xác nhận
1. **Xem lời giải ở màn "Sửa trên câu gốc" có ghi dấu hỗ trợ không?** `xemLoiGiai` gọi `hoa2-cau-chi-tiet`; chưa kiểm xem lệnh này có ghi vào `loi_giai_hoi`. Nếu có thì em xem lời giải trong 12 giờ trước lần gặp lại 2 sẽ bị tính có hỗ trợ, và màn phải báo trước khi bấm. Phải kiểm trước khi viết dòng điều kiện cuối cùng.
2. **Ba nghĩa của "xong"** đang cùng tồn tại: `da_tu_sua` (vòng chữa), đóng lỗi `dong` (`loi-hoc-luat.ts`, mở lại ở mốc 14/30 ngày), `da_khac_phuc` ở hồ sơ (đúng 3 ngày khác nhau). Bản vẽ chỉ dùng chữ "Đã tự sửa". Thống nhất ba luật thuộc Boss.
3. **Làn.** Màn Hôm nay, Tự sửa lỗi, Chữa trực tiếp thuộc làn Claude. Vòng chữa máy chủ (`chua-cau-sai*.ts`) chưa có làn rõ và Codex PR318 đã chạm đường đọc ⇒ báo Boss trước khi thêm cột chỉ-thêm.
4. Số liệu trên ảnh (155 câu, 50/205, 9 dạng, mốc ngày) là dữ liệu giả sát thực tế, không phải số của học sinh nào.
