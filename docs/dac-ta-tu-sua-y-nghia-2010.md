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
| **1** | Thẻ Hôm nay: từ "155 câu" thành **"Hôm nay sửa 3 câu"** + 3 ô tiến độ + dòng "Còn 152 câu cho các ngày sau". Câu chỉ còn làm bản mới thì đứng đầu: "2 câu chỉ còn làm bản mới là xong". Làm xong phần của 3 câu: thẻ xanh, nút phụ "Sửa thêm 1 câu" (em được phép dừng) | 01, 02 | Số "nộp hôm nay" chỉ-thêm trong lệnh `danh-sach` (xem 4.4) |
| **2** | Đầu màn Tự sửa lỗi: **Việc hôm nay** (3 thẻ câu, mỗi thẻ có 4 chấm chặng: sửa từng bước → ghép cả bài → bản mới → đã tự sửa). Bên cạnh: "Em đã tự sửa 50 câu từng sai" + 7 ngày gần đây (có số trên từng cột). **Một dòng điều kiện** chỉ hiện lúc làm bản mới: "Tự làm, không xem gợi ý hay lời giải. Đúng thì câu này tính là đã tự sửa." | 03, 04 | Chỉ chữ và giao diện (xem quyết định B) |
| **3** | Khoảnh khắc **"Em đã tự sửa xong câu này"**: 4 mốc có ngày thật (sai lần đầu → sửa từng bước → ghép cả bài → tự làm đúng bản mới), các bước em đã tự làm đúng, khối "Trước đây / Bây giờ" (chỗ em từng nghĩ sai và cách đúng), tiến độ của dạng ("10 trên 33 câu từng sai đã sửa xong"), một nút chính "Sửa câu 3/3 hôm nay" | 05 | `moc[]` + `loiDaSua[]` chỉ-thêm ở trạng thái `da_tu_sua` (đọc từ ảnh chụp phiên đã có) |
| **4** | **Sửa theo dạng**: 9 dạng, mỗi dạng có "đã sửa 9/33 câu" + thanh tiến độ. Em thấy bản đồ lỗi của mình nhỏ dần theo từng dạng | 06 | Lệnh đọc mới, chỉ gọi khi mở màn (xem mục 6) |

Thứ tự làm: **Đợt A = 1 + 2 + phần của 3 có sẵn dữ liệu**. **Đợt B = 4 + khối "Trước đây / Bây giờ" + 4 mốc có ngày + "10 trên 33 câu" của dạng** (các phần này cần dữ liệu CHƯA có ở máy em, xem 4.4). Thầy duyệt ảnh thì đợt A không phụ thuộc vào các phần ấy.

## 4. Đặc tả 7 mục

**4.1 Mục tiêu sư phạm.** Học sinh lớp 10–12 đang có nhiều câu sai tồn. Cảm giác cần đạt: "việc hôm nay nhỏ, làm được, làm xong là thấy mình đã khác đi". Sửa lỗi là việc có kết thúc trong ngày, không phải cái hố vô đáy. Thầy và phụ huynh không xuất hiện trên màn này.

**4.2 Bố cục.** Điện thoại dọc: một cột, nút chính đặt dưới cùng khối Việc hôm nay (khung 03) hoặc cuối màn (khung 04, 05). Ngang: một cột, thanh dưới giữ như app. Máy tính: hai cột (việc chính bên trái, tiến độ bên phải). Mỗi khung đúng **một nút chính**, các nút khác là nút viền hoặc nút chữ. Thẻ Hôm nay giữ nhận diện đang dùng (nền vàng dịu, vạch trái, biểu tượng 60 px, nút viền) để em nhận ra ngay.

**4.3 Trạng thái.**
- Thẻ Hôm nay có 4 trạng thái: có việc · có câu chỉ còn làm bản mới · đã xong phần của 2 câu · xong phần hôm nay (khung 02). Không còn câu cần sửa ⇒ không vẽ thẻ (đúng như hiện tại).
- Đang tải, trống, lỗi, mất mạng: giữ nguyên các khung đang có ở `ManTuChua`. Máy chủ lỗi ⇒ thẻ ẩn, không chặn Hôm nay (như `useSoCauCanSua`).
- Màn "xong": nếu máy chủ chưa trả khối nào thì khối đó ẩn, **không điền chữ thay**.

**4.4 Dữ liệu** (nguồn thật, thiếu thì ghi rõ).

**Đơn vị của "hôm nay" là "xong phần của hôm nay", KHÔNG phải "đã tự sửa".** Một câu không thể đi từ lúc bắt đầu tới `da_tu_sua` trong một ngày (sửa từng bước → ghép cả bài → chờ ≥ 24 giờ → bản mới). Vì vậy một ô được tô xanh khi **hôm nay (giờ VN) em đã nộp xong chặng cuối làm được hôm nay**: ghép xong cả bài (`cho_gap_lai_2`, bản mới mở sau 24 giờ), hoặc tự sửa xong bản mới (`da_tu_sua`). Thẻ Hôm nay ghi "xong phần của 3 câu", chỉ chữ "tự sửa xong" dành cho câu đã `da_tu_sua`.
- Câu được chọn vào "Việc hôm nay" phải còn việc để làm được: `can_chan_doan`, `dang_chua_buoc`, `dang_ghep_bai`, `dang_kiem_chung`, `cho_gap_lai_2` đã tới hạn. Các câu `thieu_hoc_lieu`, `can_thay`, `tam_khoa`, `cau_thay_doi` không có chặng nào để nộp nên KHÔNG vào việc hôm nay (em vẫn mở được từ danh sách để "sửa trên câu gốc").
- Thứ tự lấy từ máy chủ (câu đã tới lần gặp lại 2 trước, rồi câu giao gần nhất), lọc theo trạng thái trên, cắt 3 câu. Không nhóm theo dạng ở đợt A.
- Số ô đã xong hôm nay = số đợt có lần nộp hôm nay với `trangThaiMoi` là `cho_gap_lai_2` hoặc `da_tu_sua` (đọc `response_json` của `chua_loi_nop`; chốt quyết định F cho `can_thay`). "Còn 152 câu cho các ngày sau" = số câu nhóm cần sửa trừ những câu hôm nay chưa xong phần.

Bảng dữ liệu:

| Thứ hiện | Nguồn | Có sẵn? |
|---|---|---|
| Số câu cần sửa, nhóm cần/chờ/xong, thứ tự câu | `apiDanhSachTuChua` (`/hs/chua-cau-sai/danh-sach`); máy chủ xếp lần gặp lại đã tới trước | Có |
| "Câu chỉ còn làm bản mới" | `trangThai='cho_gap_lai_2'` và `denHan` đã tới (`nhomMucChua`) | Có |
| Ô tiến độ hôm nay (2/3) | `chua_loi_nop` hôm nay, `response_json.trangThaiMoi` (xem trên) | **Thiếu** ở máy em: thêm `xongHomNay` (số đợt) chỉ-thêm trong `danh-sach`, thêm một SELECT vào đúng `DB.batch` đang có |
| "Đã tự sửa hôm nay lúc 17:52" trên thẻ câu, "bản mới mở 17:40 · Thứ Tư 21/10/2026" | giờ nộp và `den_han` của đợt | `denHan` có sẵn trong `danh-sach`. Giờ nộp: đợt `da_tu_sua` có `dong_luc` (đường Hỏi thầy) hoặc `cap_nhat_luc` (lệnh nộp ghi lúc nộp, không có cột "xong lúc" riêng) ⇒ thêm `xongLuc` chỉ-thêm. Khi build phải đọc lại các đường ghi để chắc không bị đổi sau lúc xong; không chắc thì thêm cột `xong_luc` bằng migration chỉ-thêm |
| 7 ngày gần đây (số trên từng cột) | số đợt `da_tu_sua` theo ngày VN | **Thiếu**: cùng `xongLuc`, gom theo ngày. Chỉ đếm câu đã tự sửa xong |
| "Sai lần gần nhất dd/mm · nguồn" | `Câu đã làm` (`lichSu`) như `dungDong` đang dùng | Có ở màn Tự sửa lỗi. Tên dạng chỉ dùng ở khung 05 và 06 (đợt B). Thẻ Hôm nay và Việc hôm nay **không ghi tên dạng** vì chưa có nguồn gom theo dạng |
| 4 mốc có ngày thật | bảng `chua_loi_nop` (`nop_luc`, `loai`) của đợt | **Thiếu** ở máy em: thêm `moc[]` ở trạng thái `da_tu_sua` |
| "Các bước em đã tự làm đúng" | ảnh chụp phiên (`tienDo` các bước `co_bang_chung_hieu_trong_phien`); `phanHoi.phanGiuDuoc` đã có chữ này | Có |
| "Trước đây / Bây giờ" | `maLoiDaXacNhan` trong `tienDo` ⇒ `doiChieu[].cachNghiCu` / `cachDung` của học liệu | **Thiếu** ở máy em: thêm `loiDaSua[]` chỉ-thêm. Chỉ hiện khi có ít nhất một mã lỗi đã xác nhận |
| "10 trên 33 câu đã sửa" và màn Sửa theo dạng | gom đợt theo dạng của câu | **Thiếu**: cần lệnh đọc mới. Chưa xác định cột dạng/chuyên đề nào dùng được, phải đo D1 trước khi chốt |

**4.5 Ngoại lệ.**
- Chuyển ngày lúc em đang làm: số "hôm nay" tính theo ngày VN từ giờ nộp, không lưu bộ đếm riêng ⇒ không lệch. Em còn ít hơn 3 câu làm được ⇒ thẻ ghi đúng số câu có (ví dụ "Hôm nay sửa 2 câu"); không còn câu nào làm được ⇒ thẻ nói thật ("Các câu còn lại chờ lần gặp lại hoặc chờ chữa trên lớp") thay vì hiện 155.
- Mất mạng lúc nộp bản mới: giữ cơ chế nộp một lần (`chua_loi_nop`, mã nộp), màn xong chỉ hiện khi máy chủ trả `da_tu_sua`.
- Câu thuộc ca kiểm tra chưa công bố (`khoa`): ẩn khối cần đề/đáp án, vẫn hiện 4 mốc.
- Không có lần sai để so, tên dạng dài 2 dòng, 155 câu (danh sách tải 100 câu đầu rồi "Xem tiếp"), bấm lặp, đổi tab, máy yếu: dùng đúng cách hiện có của `ManTuChua`. Hiệu ứng tôn trọng `prefers-reduced-motion`.
- Chống lạm dụng: không có điểm hay thưởng nên không có gì để cày. Việc hôm nay không khoá em, em có thể sửa thêm.

**4.6 Chi phí máy chủ và tốc độ** (luật tốc độ 13/10).
- Thẻ Hôm nay: dùng bản nhớ `taiTuSuaLoi` 10 phút như hiện tại, **0 lượt gọi mới**; chỉ thêm trường trong lệnh đã có. Màn Tự sửa lỗi tải mới nên số "hôm nay" cập nhật ngay khi em quay về.
- Lệnh `danh-sach` vẫn là MỘT `DB.batch`; `xongLuc` đọc cùng bảng `chua_loi_dot`, `xongHomNay` là một SELECT thêm vào đúng batch ấy (đo bằng `tests/toc-do-may-chu-lenh-nong-1310.test.ts`: số đợt chờ D1 nối tiếp không tăng).
- `moc[]` và `loiDaSua[]`: chỉ thêm ở trạng thái `da_tu_sua`; `loiDaSua[]` lấy từ ảnh chụp phiên đã đọc, `moc[]` thêm 1 truy vấn chạy song song trong cùng đợt đọc đã có.
- Sửa theo dạng: lệnh riêng, chỉ gọi khi em mở màn, nạp lười. Hôm nay không phụ thuộc.
- Đáp án không xuống máy trước khi nộp: khối "Trước đây / Bây giờ" là chữ về cách nghĩ, không chứa đáp án câu hỏi.
- App: các khối mới nạp lười như `BieuTuongTuSua`; phải `npm run build && npm run kiem:toc-do` 0 đỏ, không nâng mốc.

**4.7 Nghiệm thu đo bằng máy.**
- Test mới (tên đề xuất): `tests/tu-sua-viec-hom-nay-2010.test.tsx` (4 trạng thái thẻ, chọn đúng 3 câu làm được theo thứ tự máy chủ và loại câu không có chặng, "hôm nay" theo giờ VN), `tests/tu-sua-xong-2010.test.tsx` (khối ẩn khi thiếu dữ liệu, không bịa chữ), `tests/tu-sua-may-chu-2010.test.ts` (cột chỉ-thêm, số vòng chờ D1 không tăng), giữ xanh `tu-sua-moi-goi-dot18-1310`, `tu-chua-danh-sach-1210`, `tu-sua-phan-trang-1610`.
- `npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · `npm run check:mau` · `tsc` hai phía · `node scripts/kiem-sw.mjs`.
- Ảnh Chromium sau build: 0 lỗi trang, 0 tràn, 0 đích chạm < 44 px, sáng + tối, 390 / 844 / 1440.

## 5. Quyết định cần thầy chốt
- **A. Số câu mỗi ngày.** Bản vẽ dùng **3**. Với 155 câu thì 3 câu/ngày chưa hết trong nhiều tháng, nhưng em thấy tiến độ thật nhờ màn Sửa theo dạng. Thầy muốn 3, 5, hay để mỗi em tự chọn?
- **B. Dòng điều kiện ở bản mới.** Đi ngược một phần lệnh 13/10 ("bỏ hết gợi ý hướng dẫn"). Đề xuất đúng **một dòng**, chỉ hiện lúc em sắp làm bản mới, không có khối hướng dẫn nào khác. Đồng ý hay bỏ?
- **C. "Trước đây / Bây giờ".** Chỉ hiện khi hệ thống đã xác nhận được chỗ em nghĩ sai (không bịa). Đồng ý?
- **D. "7 ngày gần đây".** Chỉ đếm câu đã sửa xong, ngày không làm để xám, không có chuỗi ngày, không tô đỏ. Giữ hay bỏ?
- **F. Câu em làm hết sức nhưng sai ở chặng cuối** (đợt chuyển sang "Chờ chữa trên lớp"). Có tính là "xong phần hôm nay" không? Đề xuất **có**, vì hôm nay em không còn gì làm thêm được. Thẻ chỉ ghi "xong phần", không ghi "tự sửa xong".
- **E. Màn Sửa theo dạng** (khung 06) làm cùng đợt hay đợt sau? Đợt sau thì đợt A không cần lệnh máy chủ mới.

## 6. Điều chưa kiểm chứng hay cần người khác xác nhận
0. **Bao nhiêu câu trong số 155 của một em thật có bước để làm?** Nếu phần lớn là `thieu_hoc_lieu` thì "Việc hôm nay" sẽ trống và đề xuất 1–2 không dùng được như bản vẽ.
   - **KẾT QUẢ ĐO (20/10): CHƯA ĐO ĐƯỢC. Chưa kết luận được đề xuất 1–2 dùng như bản vẽ hay phải sửa.** Không có con số nào của D1 thật trong đặc tả này, không ước, không suy từ mã.
   - **Nguyên nhân (ghi mã lỗi để khỏi đoán lại):** token Cloudflare mà proxy gắn cho `api.cloudflare.com` bị lỗi định dạng. `GET /client/v4/accounts` báo `6111 Invalid format for Authorization header`; `/user/tokens/verify` báo HTTP 400; `/memberships` báo `9106 Authentication failed (status: 400)`. Lỗi nằm ở bước xác thực nên không đổi đường gọi (D1 `/query` hay wrangler) là qua được. Phiên trước ghi chung "token không hợp lệ", phiên này là lần thứ hai gặp.
   - **Nghi vấn:** giá trị token đã lưu dư dòng, dư khoảng trắng/ngoặc kép, có tiền tố `Bearer ` hay `TEN_BIEN=`. Kho đã gặp cùng loại lỗi định dạng với secret CI ngày 27/09 (`scripts/lam-sach-khoa-cf.sh`, run 499–500). Cách sửa là thầy lưu lại token ở phần **Network secrets** của môi trường phiên đám mây (Edit môi trường), đúng MỘT dòng token trần, không ngoặc kép, không `Bearer `, loại **API Token** (không phải Global API Key), quyền **Account → D1 → Read**. Phiên mới sẽ nhận. Không dán token vào hội thoại.
   - **Chưa dùng đường khác.** Có thể đo bằng khoá CI của GitHub Actions như ngày 12/10, nhưng repo công khai (nhật ký ai cũng đọc được) và đó là khoá khác với khoá thầy chỉ định ⇒ chờ thầy duyệt, không tự làm.
   - **Câu SELECT sẵn để chạy ngay khi có token:** `docs/do-tu-sua-hoc-lieu-2010.sql` (5 câu, chỉ ra số đếm, đã chạy thử trên sqlite với dữ liệu giả). (1) đếm theo `trang_thai_day`; (2a) như (1) cho em có ≥ 100 câu cần sửa; (2b) mỗi em ≥ 100 câu có 0 / 1–2 / ≥ 3 câu **làm được hôm nay**; (3a, 3b) câu chưa xong có học liệu `du_dung` theo từng `trang_thai_day`. Cách tính "cần sửa" bám đúng lệnh `danh-sach` (đếm mọi hàng của em, không lọc `dong_luc`); cột `dang_mo` ở (1) cho biết có hàng đã đóng mà chưa `da_tu_sua` hay không.
   - **Cách đọc kết quả (chốt trước khi nhìn số):** (2b) phần lớn em ≥ 100 câu có ≥ 3 câu làm được ⇒ đề xuất 1–2 dùng như bản vẽ. Nhiều em 0 câu ⇒ khung trống ở 4.5 thành khung chính, bản vẽ 01–03 phải sửa. Em có 1–2 câu ⇒ thẻ ghi đúng số câu có (đã có ở 4.5), bản vẽ chỉ cần thêm một khung. (3a): nếu nhiều câu `thieu_hoc_lieu` đã có học liệu `du_dung` thì lỗi là trạng thái đợt chưa được nâng lên (đường nâng có sẵn ở `chua-cau-sai-thay.ts:131`, chỉ chạy lúc lưu bộ học liệu mới và chỉ cho đợt cùng `phien_ban_cau`, chưa có phiên chữa), cách sửa là nâng trạng thái, không phải đổi thiết kế. Lưu ý (3a) nối theo `qid_chuan`, còn `chua-hoc-lieu-viec.ts:14` nối thêm `content_version` ⇒ hai số có thể lệch; lệch thì báo Boss.
1. **Xem lời giải ở màn "Sửa trên câu gốc" có ghi dấu hỗ trợ không?** `xemLoiGiai` gọi `hoa2-cau-chi-tiet`; chưa kiểm xem lệnh này có ghi vào `loi_giai_hoi`. Nếu có thì em xem lời giải trong 12 giờ trước lần gặp lại 2 sẽ bị tính có hỗ trợ, và màn phải báo trước khi bấm. Phải kiểm trước khi viết dòng điều kiện cuối cùng.
2. **Ba nghĩa của "xong"** đang cùng tồn tại: `da_tu_sua` (vòng chữa), đóng lỗi `dong` (`loi-hoc-luat.ts`, mở lại ở mốc 14/30 ngày), `da_khac_phuc` ở hồ sơ (đúng 3 ngày khác nhau). Bản vẽ chỉ dùng chữ "Đã tự sửa". Thống nhất ba luật thuộc Boss.
3. **Làn.** Màn Hôm nay, Tự sửa lỗi, Chữa trực tiếp thuộc làn Claude. Vòng chữa máy chủ (`chua-cau-sai*.ts`) chưa có làn rõ và Codex PR318 đã chạm đường đọc ⇒ báo Boss trước khi thêm cột chỉ-thêm.
4. Số liệu trên ảnh là dữ liệu giả, khớp nhau theo một bảng: 208 câu từng sai = 154 cần sửa + 4 chờ lần gặp lại + 50 đã tự sửa; 9 dạng cộng đúng 208 và 50. Không phải số của học sinh nào.
