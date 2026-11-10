# ĐỀ XUẤT v6 — «Mỗi ngày một đề 28 câu»: một lõi rút cho Học mới, Sửa, Ôn (10/11/2026)

Trạng thái: **ĐỀ XUẤT, CHƯA BUILD.** Bổ sung `docs/de-xuat-28-cau-v5-0911.md` (không thay phần Sửa theo loại lỗi, hạn chung, giao bài — các phần ấy đã sống).
Thầy 10/11: mỗi ngày chỉ 28 câu, chuẩn chính xác ma trận đề thi; Sửa cũng 28 câu theo cấu trúc; Ôn cũng 28 câu theo cấu trúc, cá nhân hoá, ôn kiến thức cũ trọn vẹn.
Chưa tham vấn được cố vấn (phiên này không có công cụ cố vấn).

## 1. Quét mã đang sống (main 6646886)

| # | Chỗ | Đang làm gì | Lệch so với yêu cầu |
|---|---|---|---|
| 1 | Ngày Học mới — `chonGoi7` (`server/src/goi-bai-7-loi.ts`) + `xepTheoMaTran` (`server/src/ma-tran-rut-moi.ts`) | Câu MỚI xếp theo TỈ LỆ ô; ô hết câu thì chia lại cho ô còn câu | Cuối bài đề méo: ô nào bài còn nhiều thì ngày đó toàn ô ấy |
| 2 | Ngày Sửa — cùng `chonGoi7`, hàng sửa gom theo dạng (`goi-bai-7-nhom-sua.ts`) | Lấy 28 câu sai theo thứ tự ưu tiên | Không theo ô nào cả |
| 3 | Lấp chỗ thiếu | Theo tầng nguồn: sửa → ôn đến hẹn → mới → ôn sớm | Không tầng nào nhìn ô |
| 4 | Ôn | Không có ngày Ôn trong Gói 7. Kiểm tra ôn tập (`kiem-tra-ca-nhan-ma-tran.ts`) là kênh riêng: 28 câu đúng ô + phủ kiến thức, mỗi bài 1 lần | Hôm kiểm tra em còn 12 câu Gói 7 (`chotMucNgay7`, `kiemNhe`) ⇒ **40 câu**, không phải 28 |
| 5 | Ôn trọn vẹn | Hẹn ôn theo TỪNG CÂU (`henOn`) | Không có sổ theo dạng ⇒ không bảo đảm dạng nào cũng quay lại |
| 6 | Mã | Ba thuật toán cho cùng một bảng số: `xepTheoMaTran` (tỉ lệ), `rutDeChuan2026` (suất + giá lệch), `chonChuKyKt2026` (suất + phủ); bảng ma trận chép 3 nơi | Sửa một luật phải sửa ba chỗ |

## 2. Đề xuất — một lõi `rut28`

**Mỗi ngày là một đề 28 suất cố định:** Phần I 12 Biết · 4 Hiểu · 2 VD; Phần II 2 Hiểu · 2 VD; Phần III 3 Hiểu · 3 VD.

**Mỗi suất lấy câu ĐÚNG Ô có điểm cao nhất, từ MỌI nguồn.** Loại ngày chỉ đổi thứ tự nguồn:

| Loại ngày | Nguồn 1 | Nguồn 2 | Nguồn 3 |
|---|---|---|---|
| Học mới | câu mới của bài | câu sai chờ sửa | câu ôn |
| Sửa lỗi | câu sai (theo nhóm dạng, loại lỗi — như đang sống) | câu ôn | câu mới |
| Ôn (= Kiểm tra ôn tập, chấm sau nộp) | câu ôn theo «nợ ôn» (mục 3) | câu sai chờ kiểm lại | không câu mới |

Đổi duy nhất về tư duy: hiện nay **đúng nguồn trước, ô chỉ áp cho câu mới**; đề xuất **đúng ô trước, nguồn sau**. Bài hết câu Đúng/Sai mới ⇒ suất Đúng/Sai hôm đó lấy câu Đúng/Sai em sai hoặc cần ôn, không lấy thêm câu trắc nghiệm.

**Hai luật phụ (đủ, không thêm nữa):**
1. Suất không còn câu đúng ô ở mọi nguồn ⇒ lấy ô gần nhất CÙNG PHẦN (giá lệch như `giaLech2026` đang có). Chỉ đổi phần khi cả kho em đã học hết câu phần đó.
2. **Kịp hạn:** bài còn nhiều câu mới dồn một ô ⇒ câu mới được lệch MỨC trong cùng phần (không lệch phần) để bài xong đúng hạn chung.

**Ngày Ôn đúng 28:** hôm Kiểm tra ôn tập không còn 12 câu Gói 7.

## 3. Ôn cá nhân hoá và trọn vẹn — sổ theo DẠNG

- Đơn vị ôn = **dạng** (mọi câu đã có `dang`; nhóm sửa đang dùng đúng khoá này).
- Mỗi em × dạng giữ 2 số: ngày chạm gần nhất, độ bền h (ngày). Tính bằng CPU từ lịch sử hồ sơ đang đọc sẵn; không thêm bảng. (Kiểm lại khi build: hồ sơ có đủ lịch sử theo câu để gộp theo dạng không.)
- **Nợ ôn = số ngày từ lần chạm cuối ÷ h.** Dạng em yếu (h ngắn) và dạng lâu chưa chạm lên đầu ⇒ hai em cùng lớp nhận hai đề Ôn khác nhau.
- Cập nhật h: đúng ⇒ h × 2; đúng nhưng «Chưa chắc» ⇒ h × 1,2; sai ⇒ h = 1 và thành lỗi chờ sửa. Câu làm ở ngày Học mới, Sửa cũng tính là một lần chạm dạng.
- **Trọn vẹn:** trong một đề Ôn mỗi dạng tối đa 1 câu ⇒ 28 dạng khác nhau/đề; h có trần 30 ngày (từ 22/03/2027: 14 ngày) ⇒ dạng vững nhất cũng quay lại trong trần đó.
- Câu phát: song sinh của câu em đã làm; chưa có song sinh ⇒ câu khác cùng dạng em chưa làm; hết ⇒ câu cũ làm lâu nhất.
- Điều kiện để «trọn vẹn» đúng thật: số dạng em đã học ÷ trần ngày ≤ số suất ôn mỗi ngày. Ví dụ 300 dạng, trần 30 ngày ⇒ cần 10 lần chạm/ngày. Số dạng thật chưa đo (mục 6).

## 4. Lịch — giữ luật đang sống, thêm ngày Ôn
2 ngày Học mới chen 1 ngày Sửa khi em có từ 12 lỗi (đang sống) → hết câu mới của bài: 1 ngày Ôn (đang sống qua `ngayKtTheoBai`) → chưa có bài mới: Sửa nếu còn lỗi, không thì Ôn.
Vì ngày nào cũng rút từ cả ba nguồn theo suất, không còn ngày «thiếu câu» ⇒ bỏ được nhánh hạ mức và nhánh ôn sớm.

## 5. Số đo — chạy MÃ ĐANG SỐNG và lõi đề xuất trên cùng một em giả

Chạy lại: `npx -y tsx docs/de-xuat-28-cau-mo-phong/rut28-suat.ts`.
Đầu vào GIẢ ĐỊNH (không phải dữ liệu thật): bài 112 câu lệch về Phần I Hiểu (46·26·10 / 8·4 / 8·10), em có 30 lỗi chờ sửa, 60 câu ôn đến hẹn, 448 câu đã làm của 4 bài cũ.

| Phương án | Ngày đúng 18/4/6 | Suất đúng ô | Số ngày Học mới để hết câu mới | Ngày méo nhất |
|---|---|---|---|---|
| Đang sống (`chonGoi7` thật) | 2/6 | 136/168 = 81,0 % | 4 | Học mới 25/2/1 · Sửa 26/0/2 |
| Đề xuất, chặt tuyệt đối | 10/10 | 280/280 = 100 % | 7 | không |
| **Đề xuất + kịp hạn (khuyên dùng)** | 7/7 | 187/196 = 95,4 % | 5 | không (lệch chỉ là mức trong Phần I) |

Cái giá của «kịp hạn»: bài này thêm 1 ngày Học mới (5 thay vì 4) vì Phần I chỉ có 18 suất/ngày mà bài có 82 câu Phần I. Ngày thêm đó không bỏ phí: các suất còn lại là câu sửa và câu ôn đúng ô.

## 6. Số thật (workflow chỉ đọc `do-ma-tran-28-1011`, chạy 10/11 11:53 VN; chỉ đếm gộp)
- **Ngày 09/11 (bản 28 câu đầu tiên):** 53 em ngày Học mới đủ 28 câu — trung bình quy về 28 là 20,7 / 4,5 / 2,8 (chuẩn 18 / 4 / 6), 12 em không có câu trả lời ngắn nào, 7 em không có câu đúng/sai nào. 116 em ngày Sửa — 19,1 / 6,4 / 2,4, 23 em không có câu trả lời ngắn. **Đúng hoặc sát 18/4/6 (lệch ≤ 1): 0 / 169 em.**
- **Bài thật dồn mức Hiểu:** Bài 9 Amino acid (P1) Phần I 18 Biết · 51 Hiểu · 17 VD; Bài 8 Sulfuric acid 25 · 56 · 20; Bài 10 Protein Phần II 25 câu (4 suất/ngày). ⇒ «kịp hạn» phải LUÔN bật cho nguồn chính (đúng ô trước, dư thì lệch mức trong cùng phần); đúng mức tuyệt đối sẽ kéo một bài tới 13 ngày.
- **Cả kho:** 17 042 câu; Phần I 3 790 Biết · 4 526 Hiểu · 1 484 VD; Phần II 745 · 1 082 · 1 026; Phần III 692 · 1 614 · 2 083.
- **Lỗi tồn** (câu mà lần làm gần nhất là sai, số gần đúng): 279 em có lỗi, 149 em từ 112 câu trở lên; tổng 35 613 câu (Phần I 15 950 · II 11 346 · III 8 232) ⇒ ngày Sửa luôn đủ câu sai cho cả ba phần.
- **Song sinh:** Phần I 438 câu gốc, Phần III 807 câu gốc, **Phần II 0**.
- **Kiểm tra ôn tập:** 105 bài hẹn ngày 11/11; mỗi bài 28 câu. 54 bài mỗi ngày đang ở trạng thái chờ nguồn (việc riêng, chưa xử lý ở đây).
- Chưa đo được: số dạng mỗi em đã học (câu đo trả 0 dòng).

## 6b. Đã build 10/11 (thầy: «Duyệt bản kịp hạn, build và đẩy lên bản sống luôn, kiểm tra ôn tập để đúng 28 câu bỏ 12 câu»)
- `server/src/rut-28.ts` (lõi `rut28` + nợ ôn theo dạng), `server/src/goi-bai-7-suat.ts` (nối vào kế hoạch ngày), `chonGoi7` nhận `suat`. Áp dụng từ đề ngày **11/11** (`NGAY_DE_28`).
- Nguồn chính của ngày (câu mới ở ngày Học mới, câu sai ở ngày Sửa): đúng ô trước, dư thì lệch mức trong cùng phần. Nguồn phụ chỉ lấp suất trống, đúng ô.
- Ngày Kiểm tra ôn tập từ 11/11: chỉ bài kiểm tra 28 câu (đọc theo ngày của lịch, không sửa lịch đã lập).
- CHƯA làm: máy chọn câu của Kiểm tra ôn tập và `rutDeChuan2026` vẫn dùng thuật toán riêng (đã đúng ô, chỉ dùng chung bảng ma trận); công thức hạn chung chưa tính «Phần II 4 suất/ngày».

## 7. Build (sau khi thầy duyệt) — không đổi giao diện
1. `server/src/rut-28.ts`: hàm thuần `rut28(ứng viên, {kịpHạn})` + một bảng ma trận dùng chung (bỏ ba bản chép). Test khoá: 10 000 đề giả, đề nào cũng đủ 28 và đúng phần khi kho còn câu.
2. `chonGoi7`: thay phần xếp câu mới + bốn tầng lấp bằng một lời gọi `rut28`; bỏ `giuOn`, `onSom`, nhánh hạ mức.
3. Sổ dạng (h, ngày chạm) trong hồ sơ; nguồn ôn xếp theo nợ ôn.
4. Kiểm tra ôn tập gọi `rut28` (giữ phần phủ kiến thức làm điểm ưu tiên); hôm đó mức Gói 7 = 0.
5. `rutDeChuan2026` (máy thầy) gọi cùng lõi.
6. Cổng tốc độ + tác tử `toc-do`; phát hành ngoài giờ học tối.

## 8. Thầy chốt
1. Bật «kịp hạn» (khuyên: bật) hay chặt tuyệt đối (bài lệch ô sẽ kéo dài ngày Học mới).
2. Trần quay lại của dạng: 30 ngày, 3 tháng cuối 14 ngày.
3. Hôm Kiểm tra ôn tập bỏ 12 câu Gói 7 để đúng 28.
