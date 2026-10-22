# Đặc tả · Hồ sơ học sinh ở 3 góc nhìn, Mức làm 6 mức (Đợt 2, 22/10/2026)

Đây là bước 2 của quy trình 4 bước (`docs/quy-trinh-4-buoc-1310.md`). Thầy duyệt ảnh xong mới build. Làn: Code app 4 (đặc tả 6 mức, mục 6).

**Thầy yêu cầu (22/10):**
- "giao diện hồ sơ của học sinh … tối ưu cả giao diện cho đầy đủ trực quan dễ nhìn thân thiện hơn nữa";
- thêm Mức làm 5 «Treo máy» và Mức làm 6 «Cố tình treo máy».

**Nguồn chuẩn:**
- Luật đo: `docs/dac-ta-muc-lam-6-muc-2210.md`, trên nhánh `claude/stoic-einstein-7jkysb`.
- Hợp đồng lõi: `server/src/muc-lam.ts` @e7e4760c, cùng nhánh.
- Mức 1–4: giữ nguyên như `docs/dac-ta-muc-lam-bai-2010.md`.

**Tệp:**
- Bản vẽ: `ho-so-em.html?app=thay|hs|ph&t=dl|tai|rong|loi|mang|cu&mo=luot`. Trang nạp đúng CSS thật của tấm `HoSoLamCauEm` (tokens, gv-v2, ho-so-lam-cau-em, vỏ học sinh và vỏ phụ huynh). Khối mới `.hsv-*` chỉ dùng biến `--gvm-*`.
- Ảnh bản vẽ: `anh/`, 46 tệp. Gồm 36 khung, mỗi khung "toàn bộ" được cắt thành 2–3 phần.
- Ảnh hiện trạng: `hien-trang/`, 18 ảnh. Đây là linh kiện thật qua vite dev, trang thử ở `that/`.
- Lệnh chụp và soát: `node scripts/chup-ban-ve-ho-so-em-2210.mjs [hien-trang|ban-ve]`.

**Mọi số trên ảnh là số MINH HOẠ.** Dòng nhỏ đầu tấm có nhãn "Bản vẽ · số liệu minh hoạ" ở mọi khổ (kể cả xoay ngang). Ảnh hiện trạng có dấu "HIỆN TRẠNG · số liệu minh hoạ".

**Ngày tháng:** 22/10/2026 là **Thứ Năm**. Ví dụ "Thứ Tư 22/10/2026" trong đề bài bị lệch thứ. Bản vẽ ghi đúng thứ.

## 0. Hiện trạng (ảnh `hien-trang/`)

Cả ba app hiện dùng **cùng một tấm** `HoSoLamCauEm`. Tấm có 3 chế độ: thầy, học sinh (`HoSoCuaEmHs`), phụ huynh (`ph-v3/HoSoCuaConPh`).

Thứ tự trong tấm, từ trên xuống:
1. Đầu tấm Thái độ và Nhịp học (điểm nhấn).
2. Hôm nay.
3. Năm khối số liệu từ 01/10.
4. Sáu tín hiệu.
5. "Toàn bộ sổ": bốn ô số, rồi «Cách làm bài» (Mức 1–4), rồi bốn thẻ con.

Những điểm chưa ổn:
- «Cách làm bài» nằm sâu dưới đáy. Trên điện thoại phải cuộn hơn 3 màn mới tới (ảnh `*-390-sang-cach-lam`).
- Chưa có Mức 5–6. Giây làm của một lượt "treo 10 phút rồi bấm" hiện thành Mức 3–4 (đặc tả 6 mức, mục 2.5a).
- Học sinh và phụ huynh thấy nhãn "Có dấu hiệu đối phó" làm chữ to nhất màn (`hs-390-sang-dau`). Đó là nhãn nặng, đứng trước mọi số liệu.
- `ToanCanhEmScreen` (thầy) chưa có Mức làm. Chip lọc dòng thời gian cao 32 px, dưới mức 44 px. Hàng chip tràn ngang ở 390 px (ghi lại, không sửa trong đợt này).
- "Chi tiết em lên bảng" (tờ chiếu, phím X) thuộc làn Code app 2. Đặc tả này không vẽ lại. Tờ chiếu dùng `mucCongKhai`, nên cũng không bao giờ hiện Mức 6.

## 1. Mục tiêu sư phạm và ai dùng

| Ai | Câu hỏi màn phải trả lời trong 5 giây | Cảm giác cần đạt |
|---|---|---|
| **Thầy** | "Em này làm bài thật hay đối phó, sai vì vội, vì chưa hiểu, hay vì để máy treo?" | Có bằng chứng từng lượt (giờ, số phút), không phải nhãn. Mức 6 kèm lý do và giờ cụ thể để thầy tự kết luận. |
| **Học sinh** | "Tuần này em làm thế nào, câu nào cần sửa?" | Được kể lại việc mình đã làm, không bị buộc tội. Lượt treo ghi nhẹ nhàng: "Câu này máy để treo 7 phút." Có ngay nút "Sửa câu này". |
| **Phụ huynh** | "Con có làm bài đều không, sai vì sao?" | Ngắn, dễ đọc. Biết số lượt máy để treo. Ở từng lượt chỉ thấy chip "Máy để treo", không số phút, không có chữ "cố tình". |

**Phân quyền (bắt buộc, kiểm bằng máy):**

| Mức | Thầy | Học sinh | Phụ huynh |
|---|---|---|---|
| 1–4 | Tên thầy ("Chưa đọc hết đề" … "Làm kỹ"), đủ đúng/sai | Tên tả việc (`TEN_MUC_EM`), chỉ lượt sai | Như học sinh, ngôi "con" |
| **5 · Treo máy** | "Treo máy" + "Em không ở với câu 7 phút 14 giây (không chạm màn hoặc rời app)" | **"Máy để treo"**. Ở từng lượt: "Câu này máy để treo 7 phút." Thêm một dòng: "Thời gian treo không tính vào số giây làm bài của em." | Một dòng tổng "Máy để treo: 8 lượt trong 7 ngày". Ở từng lượt: chip "Mức làm 5 · Máy để treo", **không số phút**. Lượt treo không bao giờ hiện thành Mức 1–4 |
| **6 · Cố tình treo máy** | **CHỈ thầy**: chip đầu tấm, thẻ bằng chứng, ô mức, dòng lượt | Không bao giờ. Máy chủ đã hạ về 5 | Không bao giờ |

## 2. Bố cục (một tấm, ba khổ; khung tấm giữ nguyên)

Khung tấm giữ nguyên như hiện nay:
- tấm phải rộng tới 1200 px trên máy tính;
- toàn màn trên điện thoại dọc;
- toàn màn và đầu tấm gọn khi xoay ngang thấp.

Lưới bên trong theo bề rộng **chính tấm** (`@container hslc`):
- dưới 880 px: một cột;
- từ 880 px: hai cột, tỉ lệ 1,55 : 1.

**Thầy** (`anh/thay-*`):
- **Đầu tấm:** tên, SBD, lớp, khoảng "7 ngày gần nhất (16/10 – 22/10)". Có chip **«Cố tình treo máy · 1 ngày trong 7 ngày»** (hồng, biểu tượng bát giác), chỉ hiện khi có Mức 6. Cạnh đó là chip kết luận đã chốt 12/10 «Có dấu hiệu đối phó» (khi `coDoiPho`) và chip «Nhịp học: Chưa đều».
- **Cột trái:**
  1. **Cách làm bài · 6 mức** là điểm nhấn của tấm. Gồm:
     - dòng "Đo được 52/64 lượt · 12 lượt chưa có số đo · 30 lượt chưa đo treo máy";
     - **thanh chồng 6 mức** và một đoạn nét đứt "chưa có số đo";
     - **thẻ bằng chứng Mức 6**: ngày, các giờ, số phút từng lượt, câu "Chỉ thầy thấy mức này…", nút "Xem 4 lượt này". Nút này lọc danh sách và là nút phụ;
     - **lưới 6 ô mức**: 2 cột trên điện thoại, 3 cột khi tấm từ 560 px. Mỗi ô có số lượt và "đúng x · sai y";
     - **ba ô "lượt sai rơi vào đâu"**: làm vội (1–2), dù đã nghĩ (3–4), sau khi máy để treo (5–6);
     - mục mở «Cách tính Mức làm».
  2. **Từng lượt.** Có các nút lọc 44 px (`role=tab`): Tất cả · Lượt sai · Treo máy · Chưa có số đo. Lượt gom theo ngày.
     - Lượt Mức 1–4: thước giây như cũ.
     - Lượt Mức 5–6: **thay thước giây bằng câu "không ở với câu X phút" và một thanh phút có sọc**. Thước giây kéo tới 420 giây thì vô nghĩa.
     - Lượt cũ: nhãn nét đứt "Chưa đo treo máy".
- **Cột phải:**
  - Dòng **Hôm nay**, giữ nguyên chữ và chỗ đầu: "24/30 câu · Tầng 2 · Còn 6 câu tới mức tối thiểu · Kho thiếu 2 câu phù hợp cho em hôm nay". Khối "Kiến thức cần bổ sung" (khi có) nằm ngay dưới, như cũ.
  - Làm bài 7 ngày: 4 ô số. Giây trung bình ghi rõ "không tính 8 lượt treo máy".
  - **Theo ngày**: 7 hàng, mỗi hàng một thanh chồng theo mức. Ngày có Mức 6 ghi tên ngày màu hồng. Có dấu * cho ngày chưa đo treo máy.
  - Câu chưa sửa được.
  - Các khối cũ **gập lại**, nội dung giữ nguyên, chỉ dời xuống: Nhịp học 14 ngày, Sáu tín hiệu, Số giây theo mức độ câu, Câu đúng · Câu đã ôn.
- **Chân tấm:** "Mở hồ sơ đầy đủ", như cũ. Đây là nút chính duy nhất của chân tấm.

**Học sinh** (`anh/hs-*`):
- **Điểm nhấn**: số lớn "64 lượt làm câu · đúng 35 lượt" và một câu về nhịp học. Thay cho nhãn "Có dấu hiệu đối phó" to nhất màn của hiện trạng. Nhãn thái độ vẫn còn trong khối gập "Lịch làm bài".
- **Em làm bài thế nào**: một câu tóm tắt, thanh chồng 5 mức của lượt sai, danh sách 5 dòng, rồi ô nhẹ màu hổ phách "Có 8 lượt máy để treo. Thời gian treo không tính vào số giây làm bài của em." (Không ghi ngưỡng phút: rời app 3 phút khi màn giữ sáng cũng là treo.)
- **Từng lượt**: lọc Tất cả · Lượt sai · Máy để treo. Không có lọc "Chưa có số đo", vì đó là chữ nội bộ.
- **3 câu đang chờ em tự sửa**: mỗi câu một nút viền "Sửa câu này", 44 px. Trên máy tính, khối này nằm ở cột phải, lên đầu.
- Theo ngày, rồi các khối gập.

**Phụ huynh** (`anh/ph-*`):
- **Điểm nhấn**: "64 lượt làm câu · đúng 35 lượt" và nhịp học.
- **Cách con làm bài**: thanh 4 mức của lượt sai, danh sách 4 dòng, rồi một dòng **"Máy để treo: 8 lượt trong 7 ngày"**.
- **Lượt sai gần đây**: 3 lượt. Lượt treo mang chip "Mức làm 5 · Máy để treo", không số phút. Kèm nút "Xem mọi lượt của con"; danh sách đầy đủ ấy hiện lượt treo y như thế.
- Câu chưa sửa được (không có nút), rồi khối gập.

**Giữ / dời / bỏ so với hiện trạng** (để lần lại được bằng git):

| Khối hiện có | Thầy | Học sinh / phụ huynh |
|---|---|---|
| Đầu tấm Thái độ + Nhịp học (nhãn, lý do, độ tin cậy, dải 14 ngày) | Nhãn lên chip đầu tấm; phần chi tiết **dời** vào khối gập "Nhịp học và 14 ngày gần nhất" | **Dời** vào khối gập "Lịch làm bài 14 ngày"; điểm nhấn đổi thành số lượt (điểm chốt 4) |
| Hôm nay · Tầng · Kho thiếu · Kiến thức cần bổ sung | **Giữ**, đầu cột phải | Giữ câu "còn N câu tới mức tối thiểu" trong điểm nhấn |
| Năm khối số liệu (Làm bài, Lịch, Độ đúng, Số giây mỗi lượt) | "Làm bài" thành 4 ô số; còn lại **dời** vào khối gập | **Dời** vào khối gập |
| Sáu tín hiệu và ngưỡng | **Dời** vào khối gập, nội dung giữ nguyên | (hiện trạng đã ẩn chú thích; giữ như cũ trong khối gập) |
| Toàn bộ sổ: bốn ô số | Gộp vào "Làm bài 7 ngày" | Gộp vào điểm nhấn |
| «Cách làm bài» Mức 1–4 | **Dời lên đầu** cột trái, thành 6 mức | Dời lên ngay dưới điểm nhấn, thêm Mức 5 |
| Số giây theo mức độ câu | **Dời** vào khối gập | **Dời** vào khối gập |
| Thẻ con: Câu sai · Câu đúng · Câu đã ôn · Toàn bộ lịch sử | Câu sai thành khối "Câu chưa sửa được"; Lịch sử thành "Từng lượt"; Câu đúng · Câu đã ôn **dời** vào khối gập | Như thầy; học sinh có nút "Sửa câu này" |
| Chân tấm "Mở hồ sơ đầy đủ" | **Giữ** | (không có, như cũ) |

Không bỏ khối nào; chỉ dời và gập.

**Đường vào từ Toàn cảnh một em (`ToanCanhEmScreen`):** hiện nay tấm 6 mức chỉ mở từ Hôm nay › Nhịp học, Điểm danh, Bài hằng ngày. "Xem hồ sơ học sinh" và "Mở hồ sơ đầy đủ" không dẫn tới tấm. Đề xuất: thêm một nút viền **"Hồ sơ làm bài"** vào hàng nút đầu trang Toàn cảnh, mở đúng tấm này (nút phụ, nút chính giữ nguyên). Trang Toàn cảnh không vẽ lại trong đợt này.

**Thống nhất 6 mức (cả 3 app):**
- Mỗi mức luôn có **chữ "Mức làm N" + tên + biểu tượng**:
  - Mức 1–4: ký hiệu bốn vạch, dải xanh `--hslc-m1..4` (giữ nguyên);
  - Mức 5: vòng tròn "tạm dừng", họ hổ phách `--gvm-hp*`, sọc chéo trên thanh;
  - Mức 6: bát giác cảnh báo, họ hồng `--gvm-ho*`, sọc dày.
- 5 và 6 khác **họ màu** với 1–4, để không bị đọc là "mức cao hơn của làm kỹ".
- Màu không bao giờ là kênh duy nhất: ô thanh nào cũng có số, chip nào cũng có chữ.
- Không thêm màu mới. Chỉ dùng `--gvm-*` và `color-mix` / `repeating-linear-gradient` trên các biến ấy (`kiem:mau-giu` 0).

## 3. Trạng thái

| Trạng thái | Hiện gì | Ảnh |
|---|---|---|
| Đang tải | Đầu tấm thật. Thân là khung xương giữ chiều cao: điểm nhấn 120 px, thanh 32 px, ô mức 180 px, danh sách. Kèm `role=status` "Đang tải hồ sơ làm bài…". Tắt nhấp nháy khi người dùng giảm chuyển động | `thay-dang-tai-390-sang` |
| Rỗng | Khung nét đứt. "Chưa có lượt làm câu nào trong 7 ngày", lý do, việc làm tiếp. Học sinh có nút "Mở Bài tập về nhà" | `hs-rong-390-toi` |
| Lỗi | Nền hồng. Một câu nói thật từ `lyDoDeHieu` và nút "Thử lại". Phần đã tải (nếu có) giữ nguyên | `ph-loi-390-sang` |
| Mất mạng | Dải hổ phách "Mất mạng. Đang xem bản đã tải lúc 14:05 · Thứ Năm 22/10/2026" và nút "Tải lại". Dữ liệu lấy từ bộ nhớ tạm 5 phút sẵn có (`demTam`) | `thay-mat-mang-1440-toi` |
| Có dữ liệu | Như mục 2 | `thay/hs/ph-{390,844-ngang,1440}-{sang,toi}`, `*-toan-bo-*` |
| Lượt treo (cuộn tới) | Thầy: "Em không ở với câu 7 phút 14 giây…". Học sinh: "Câu này máy để treo 7 phút." | `thay-luot-treo-*`, `hs-luot-treo-*` |
| **Chưa đo treo máy** (lượt cũ, máy em chưa có đồng hồ 22/10) | **Thầy:** ô Mức 5 và Mức 6 viền nét đứt "Chưa đo treo máy". Mỗi lượt cũ có nhãn nhỏ "Chưa đo treo máy". Có câu lý do "…chưa xếp được Mức làm 5–6 (không đoán)". **Học sinh/phụ huynh:** một dòng ghi chú, không nhãn từng lượt. Mức 1–4 vẫn hiện | `thay-chua-do-treo-*` |
| Phụ huynh · danh sách mọi lượt | Lượt treo: chip "Mức làm 5 · Máy để treo", không số phút, không thước giây | `ph-390-*` (Lượt sai gần đây) |
| Máy chủ cũ (không có `soTreo`…) | Như "Chưa đo treo máy". Không vỡ khối Mức 1–4 | (test) |
| Lượt chưa có số đo (giây cũ, ca thi cũ) | Chip nét đứt "Chưa có số đo", như hiện nay | `thay-toan-bo-*` |

## 4. Dữ liệu

**Lệnh API thật đang có (không thêm lệnh mới):**
- Thầy: `POST /gv/lich-su-lam-cau {sbd, gioiHan?}` và `POST /gv/ho-so-thai-do {sbd}`. Gọi qua `goiLenh`, rồi `docLichSuLamCau` / `docHoSoThaiDo`.
- Học sinh: `POST /hs/lich-su-lam-cau {token}` và `/hs/ho-so-thai-do`. Máy chủ lấy SBD từ token, lọc bằng `banHocSinhLichSu`.
- Phụ huynh: `POST /ph/lich-su-lam-cau` và `/ph/ho-so-thai-do`. Dùng đúng lõi bản học sinh.

**Trường mỗi lượt** (`MucLamLuot`, hợp đồng lõi @71520b89 — Boss sửa 22/10, thay bản @e7e4760c):
- Giữ nguyên các trường cũ: `ma` 1–4, `giay`, `giayDoc`, `ranh2/3/4`.
- Thêm:
  - `treo?: 'treo' | 'co_tinh'`. Có thì hiện Mức 5 hoặc 6, đè lên `ma`;
  - `giayTreo?`: giây em không ở với câu, bằng max(khoảng lặng dài nhất, giây rời app). Dùng cho câu "máy để treo X phút". Học sinh làm tròn tới phút;
  - `daDoTreo?: true`: lượt ĐÃ đo mà không treo (giữ Mức 1–4 theo `ma`).
  - Vắng CẢ `treo` lẫn `daDoTreo` ⇒ lượt làm trước khi có đồng hồ mới ⇒ hiện "Chưa đo treo máy" (không còn trường `chuaDoTreo`).
- Mức 6 `'co_tinh'` CHỈ đến từ mẫu ≥ 3 lượt treo trong cùng một ngày của em (lõi @71520b89).

**Trường tổng** (`TongMucLam`):
- Thêm `soTreo`, `soCoTinh`, `soChuaDoTreo`.
- Máy chủ tính bằng `tongMucLam(luot, { tachTreo: true })`: lượt treo **không** đếm vào bốn dòng Mức 1–4.
- **`theoMuc` giữ đúng 4 dòng.** `docTongMucLam` đang từ chối mọi độ dài khác 4. Thêm dòng 5–6 vào đó sẽ làm mất cả khối trên máy còn mã cũ.

**Thứ tự phát hành:** máy chủ chỉ bật `tachTreo: true` **cùng lượt** với giao diện mới. Bật trước thì máy còn bản PWA cũ sẽ hiện "Đo được 52/64" trong khi bốn dòng Mức 1–4 chỉ cộng được 44.

**Lọc bản công khai:**
- Bản học sinh/phụ huynh: máy chủ ĐÃ hạ Mức 6 về 5 (`mucCongKhai`, `tongCongKhai` trong `lichSuLamCauCuaEm`). Giao diện học sinh/phụ huynh không bao giờ nhận `'co_tinh'`.
- Mức 6 tính theo **ngày Việt Nam** (`ngay_vn`) trên **cả cửa sổ máy chủ đọc** (`nangCoTinhTheoNgay`), không chỉ trên 150 lượt của khung đầu.

**Cần thêm ở MÁY CHỦ (chỉ thêm, JSON, không đổi schema D1):**
1. `TongMucLam.treoDungSai?: { treo: {dung, sai}, coTinh: {dung, sai} }`, dùng cho dòng "đúng x · sai y" của ô 5, ô 6 và ô "sai sau khi máy để treo". Nếu vắng: ô chỉ ghi số lượt.
2. `mucTheoNgay?: { ngay, dem: [6 số], chuaCoSoDo, soChuaDoTreo }[]` (7 ngày gần nhất), dùng cho khối "Theo ngày". Tính trong **cùng vòng lặp** đang dựng `tongMucLam`. Bản học sinh/phụ huynh cộng dồn ô 6 vào ô 5. Nếu vắng: ẩn khối.
3. Chỉ bản thầy: `ngayCoTinh?: { ngay, luot: {luc, giayTreo}[] }[]`, dùng cho thẻ bằng chứng (lõi @71520b89 chỉ còn MỘT lý do: ≥ 3 lượt treo trong ngày ⇒ không cần trường lý do).
   - Nếu vắng: thẻ dựng từ các lượt `'co_tinh'` đã tải, cùng ngày.
4. **Phụ huynh**: lọc thêm, **chỉ bỏ `giayTreo`** ở từng lượt. **Giữ `treo: 'treo'`**: nếu bỏ cả `treo` thì lượt treo 10 phút lại hiện thành "Mức làm 3–4 · Có thời gian nghĩ", đúng cái lỗi mà 6 mức sinh ra để sửa.
5. **Hồ sơ thái độ**: `dem.giayTb`, `giayTrungVi`, `phanBoGiay` bỏ các lượt `treo`. Nếu không, một lượt treo 10 phút vẫn kéo giây trung bình lên khoảng 185 giây.
6. Khoảng mặc định "7 ngày gần nhất" cho khối Mức làm: tổng 7 ngày tính trong cùng vòng lặp. "Toàn bộ sổ từ 01/10" giữ nguyên trong khối gập. Xem điểm chốt 4.

**Máy khách:**
- `docMucLam` / `docTongMucLam` (`muc-lam-giao-dien.tsx`, mảnh lười) đọc thêm các trường trên.
- `docMucLam` hiện **bỏ** mọi trường lạ, nên nếu không sửa thì `treo` sẽ rơi mất.
- Không tự xếp Mức 5–6 ở máy khách.
- `lich-su-lam-cau-api.ts` nằm trên đường tải mở của app phụ huynh, chỉ chuyển tiếp, không thêm mã.

## 5. Ngoại lệ

- **Bấm lặp lọc / Tải lại / Thử lại**: lệnh trước bị bỏ qua bằng bộ đếm `lan` sẵn có. Nút bị khoá khi đang tải.
- **Mất mạng giữa chừng**: giữ bản đang hiện và hiện dải mất mạng. Không xoá dữ liệu.
- **Đổi tab rồi quay lại**: không tự nạp lại. Bộ nhớ tạm 5 phút như cũ.
- **Số đột biến**:
  - `giayTreo` tới 7200 giây thì ghi "2 giờ" (đổi phút sang giờ khi từ 60 phút);
  - thanh phút có trần (đầy ở khoảng 12 phút);
  - 40 lượt treo trong một ngày: thẻ bằng chứng chỉ liệt kê 6 lượt đầu và "+34 lượt";
  - đoạn thanh dưới 34 px vẫn có số (bề rộng tối thiểu).
- **Chữ dài**: tên câu và tên dạng ngắt dòng (`overflow-wrap:anywhere`, `min-width:0`). Đã soát ở 390 px.
- **Máy yếu**: không thư viện biểu đồ, chỉ CSS. Danh sách lượt giữ đợt 100 (`MOI_DOT`).
- **Lượt vừa treo vừa đúng**: vẫn là Mức 5. Học sinh vẫn thấy "máy để treo" (xem điểm chốt 1).
- **Câu chỉ là ảnh, giây ước tính (≈)**: Mức 1–4 giữ luật cũ. Lượt ≈ không bao giờ có số đo treo.

## 6. Chi phí máy chủ

- **0 lệnh D1 mới, 0 vòng chờ nối tiếp.** Các số `v a l n w` nằm trong `raw_json.doc` của chính các dòng mà `lichSuLamCauCuaEm` đang đọc để xếp Mức 1–4.
- Mức 6, `mucTheoNgay`, `treoDungSai`, `ngayCoTinh` đều tính trong vòng lặp sẵn có, chạy trên tối đa 5000 dòng trong bộ nhớ Worker.
- Hồ sơ thái độ chỉ thêm một điều kiện lọc khi cộng giây.
- Đáp án vẫn không xuống máy học sinh: lệnh lịch sử chỉ trả lượt đã được xem kết quả, như cũ.
- Tải app không đổi: `HoSoLamCauEm` và `muc-lam-giao-dien.tsx` là mảnh nạp lười, ngoài precache. Không thêm tệp vào precache (≤ 169).

## 7. Nghiệm thu đo bằng máy

- **Test (tạo ở bước 4):**
  - `tests/ho-so-6-muc-doc-2210.test.ts`:
    - `docTongMucLam` đọc `soTreo/soCoTinh/soChuaDoTreo` và giữ 4 dòng `theoMuc`;
    - máy chủ cũ thiếu trường thì hiện "Chưa đo treo máy", không vỡ khối;
    - `docMucLam` giữ `treo/giayTreo/daDoTreo`; vắng cả `treo` lẫn `daDoTreo` ⇒ "Chưa đo treo máy".
  - `tests/ho-so-6-muc-giao-dien-2210.test.tsx`:
    - chế độ học sinh/phụ huynh có dữ liệu treo thì DOM, `title`, `aria-label` không có "Cố tình", "Mức làm 6", "co_tinh";
    - phụ huynh không có chữ "phút" ở lượt treo;
    - thầy thấy thẻ bằng chứng và chip đầu tấm.
  - `tests/lich-su-treo-ban-ph-2210.test.ts` (máy chủ): JSON phụ huynh không có `giayTreo` và `co_tinh`, nhưng lượt treo VẪN mang `treo: 'treo'` (không rơi về Mức 1–4).
  - `tests/ho-so-thai-do-giay-bo-treo-2210.test.ts`: giây trung bình bỏ lượt treo.
- **Cổng:** `npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · `npm run check:mau` 0 · `node scripts/kiem-sw.mjs` (precache ≤ 169).
- **Ảnh:** chạy `node scripts/chup-ban-ve-ho-so-em-2210.mjs`. Bước 4 thêm phần chụp màn build thật, cùng các khung ấy.
  - Bản vẽ hiện tại: **36 khung: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px · 0 chữ < 12 px · 0 tương phản < 4,5:1 · 0 lộ Mức 6 ở học sinh/phụ huynh · 0 màu thô.**
  - Hiện trạng (chỉ báo): 18 ảnh. Có 3 lỗi đích chạm và 1 lỗi tràn ở `ToanCanhEmScreen` (chip lọc 32 px).
- **Soát 10 mục** `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`:
  - không nhãn năng lực ở học sinh/phụ huynh ("Máy để treo" tả việc);
  - số nào cũng có nhãn;
  - không mã nội bộ trên màn học sinh/phụ huynh;
  - giờ 24 giờ, đúng thứ.

## Điều thầy cần chốt

1. **Học sinh và phụ huynh thấy Mức 5 thế nào?**
   - Đề xuất, học sinh: thấy ở từng lượt, kể cả lượt đúng ("Câu này máy để treo 7 phút."), và một dòng tổng.
   - Đề xuất, phụ huynh: một dòng tổng ("Máy để treo: 8 lượt trong 7 ngày"); ở từng lượt chỉ chip "Máy để treo", **không số phút**.
2. **Mức 6 hiện ở đâu cho thầy?** Đề xuất ba chỗ trong tấm hồ sơ:
   - chip đầu tấm;
   - thẻ bằng chứng (ngày, giờ, số phút) trong «Cách làm bài»;
   - nút lọc "Treo máy".

   Không đưa lên tờ chiếu cả lớp. Giữ ngưỡng tạm (3 lượt/ngày) và chỉnh sau 1 tuần số thật.
3. **"Chưa đo treo máy" cho lượt cũ.**
   - Đề xuất, app thầy: một số tổng và nhãn nhỏ ở từng lượt cũ.
   - Đề xuất, học sinh/phụ huynh: chỉ một dòng ghi chú, không nhãn từng lượt, để đỡ rối.
4. **Đổi điểm nhấn của học sinh/phụ huynh và khoảng mặc định (đổi điều đã chốt 12/10).**
   - Đề xuất: điểm nhấn của học sinh/phụ huynh là **số lượt** ("64 lượt làm câu · đúng 35 lượt"), thay cho nhãn thái độ ("Có dấu hiệu đối phó") đang là chữ to nhất màn. Nhãn thái độ vẫn còn trong khối gập "Lịch làm bài". App thầy giữ nhãn ở chip đầu tấm.
   - Đề xuất: khối Mức làm và "Theo ngày" mặc định **7 ngày gần nhất**, để số treo máy mới thấy rõ. "Toàn bộ sổ từ 01/10" vẫn còn trong khối gập.
