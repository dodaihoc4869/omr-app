# ĐỀ BÀI BUILD — BTVN "NÂNG ĐỠ" (thầy CHỐT 21/09: "chốt, tập trung triển khai cái này luôn")

Thiết kế đã chốt: `DE-XUAT-BTVN-NANG-DO-2109.md` (đọc TRƯỚC; cả 4 điều ở mục 6 thầy chốt CÓ: điểm theo số câu của từng em · lõi ≈ 30 % · em giỏi bỏ câu dễ đã đúng lại · bỏ "Mở hết câu", thay "Em muốn làm thêm"). Quyết/soát: **Boss**. MỌI commit cần dòng "đã soát" (đổi luật chấm BTVN + làn giáo viên). Đẩy Worker: Code 3. Đẩy Pages: Code 2. Tin cho Boss ≤ 80 từ + mã commit.

## NGUYÊN TẮC CHUNG
- Bài KHÔNG bật cá nhân hoá (`ca_nhan = 0`) và mọi bài cũ: chạy Y NHƯ CŨ, không đổi một byte hành vi. Có cờ tắt toàn cục `cau_hinh.btvn_ca_nhan`.
- Tất định: cùng đầu vào + hạt giống `maBtvn|sbd` ⇒ cùng bộ câu. Bộ của em CHỐT MỘT LẦN lúc em mở bài lần đầu (ghi bảng), không đổi lại sau đó trừ phần THÍCH NGHI của chặng CHƯA mở.
- Đáp án không xuống máy em trước khi nộp (giữ luật cũ). Thẻ tiến bộ chỉ dùng SỐ ĐẾM. Không xếp hạng em với em; không chữ "nắm chắc"; không kết luận năng lực từ điểm.
- Schema CHỈ THÊM. Không hex trong TSX. Test + đột biến; `npx tsc -b --force` + `npm run build` exit 0 TRƯỚC khi báo xong.

## ĐỢT 1 (làm NGAY, song song) — rút câu lúc em mở bài + xem trước + điểm theo câu của em
### Code 1 — LÕI THUẦN `src/lib/btvn-nang-do.ts` (máy chủ import như `doan-core`)
Thuần, không IO, không `Date.now()`/`Math.random()` (hạt giống truyền vào). XUẤT KIỂU TRƯỚC (commit đầu, trong ~20 phút, để Code 3/4/2 bám): `CauGiao {qid, dang|null, chuyenDe, mucDo 0|1|2, sao 0|1|2, phan 'I'|'II'|'III'}` · `HoSoEmRut {dang: Record<mã, {bac 0|1|2, soGap, soSai, tiLeKhacPhuc|null}>, cau: Record<qid, {trangThai, ngayDungKhacNhau, lanSai}>}` · `NganSachBai {soNgay, cauMoiNgay, onLaiMoiNgay}` · `BoCuaEm {loi: qid[], rieng: qid[], thuThach: qid[], chang: qid[][], nhan: Record<qid, 'loi'|'khoi_dong'|'dang_yeu'|'cung_co'|'thu_thach'>, tomTat{…}}`.
Hàm: `chonLoi(cau, ghim)` (mỗi dạng 1–2 câu: sao cao → mức thấp → phần I; ≈ 25–35 %, luôn gồm câu ghim; câu thiếu dạng ⇒ nhóm theo chuyên đề+mức) · `chonBoCuaEm(cau, loi, hoSo, nganSach, hatGiong)` (mục 2 C–F của đề xuất) · `thichNghiChangSau(bo, ketQuaChang)` (Đợt 2, viết chữ ký trước) · `theTienBo(truoc, sau)`.
TEST TÍNH CHẤT bắt buộc: lõi ⊆ bộ MỌI em; không câu nào > bậc đích + 1; câu +1 bậc ≤ 20 % và CHỈ ở dạng em đang ổn; em chưa hồ sơ ⇒ lõi + Biết/Hiểu; mỗi dạng yếu ≥ 2 câu khi kho còn; |bộ| ∈ [|lõi|, N] và ≤ ngân sách; mỗi chặng mở bằng 2 câu khởi động, thử thách đứng cuối; tất định; 80 câu × 300 em chạy < 200 ms.

### Code 3 — MÁY CHỦ (viết hợp đồng `docs/hop-dong-btvn-nang-do-2109.md` NGAY sau khi đọc kiểu của Code 1)
Migration chỉ-thêm: `btvn.ca_nhan`, bảng `btvn_cau` (ma_btvn, qid, dang, muc_do, sao, phan, loi, ghim), `btvn_em_cau` (khoa em, qid, chang, nhan, thu_tu). `/btvn/giao` nhận thêm `caNhan`, `cau[]`, `ghim[]` (vắng ⇒ như cũ). `btvnCuaEm`: bài `ca_nhan=1` ⇒ lần mở đầu dựng bộ của em (đọc `nam_kt_cau`/`nam_kt_dang` + ngân sách, ghi `btvn_em_cau`), TRẢ ĐÚNG câu của em theo chặng; chấm `so_cau` = số câu CỦA EM; sự kiện/EXP giữ công thức cũ. Lệnh thầy CHỈ ĐỌC `/btvn/xem-truoc` (≤ 50 em/lượt, không ghi) cho màn xem trước. `theoDoiBtvn` trả thêm `soCauCuaEm`, `chang`, điểm LÕI riêng. Chống chép bài: chỉ so trên LÕI chung (≥ 6 câu). Đo số truy vấn mỗi lượt mở bài (≤ 12).

### Code 4 — APP THẦY (`PhanCongScreen`)
VẼ MẪU TRƯỚC 1 màn "Xem trước phân bổ" (JPG ≤ 150 KB vào `docs/ban-ve-btvn-nang-do-2109/`, gửi Boss) rồi build luôn, không chờ: công tắc "Cá nhân hoá (khuyên dùng)" · ghim câu cả lớp bắt buộc · gửi `cau[]` (dạng/mức/sao/phần lấy từ `LoiGiaiMeta` trên máy thầy) · bảng xem trước từng em (tổng · lõi/riêng · Biết/Hiểu/Vận dụng · số chặng; bấm em ⇒ danh sách câu + nhãn lý do) · tab theo dõi: "chặng 3/7", "x/y câu của em", so lớp CHỈ trên lõi. Ghi rõ trên màn: "Bộ câu của em chốt khi em mở bài".

### Code 2 — APP HỌC SINH + PHỤ HUYNH
VẼ MẪU TRƯỚC 2 màn (đầu bài của em · thẻ cuối chặng) cùng thư mục, gửi Boss, rồi build: phiếu BTVN bài `ca_nhan`: đầu bài "Bài của riêng em: N câu · K chặng · ≈ P phút/ngày" (không lộ số câu của bạn khác) · chỉ chặng đang mở · nhãn nhẹ từng câu (khởi động / cốt lõi / dành riêng cho em / thử thách — thử thách ghi "sai không sao") · BỎ nút "Mở hết câu" ở bài `ca_nhan` · phiếu phụ huynh và bảng nhiệm vụ ghi "x/y câu của em".

## ĐỢT 2 (sau khi thầy giao thử Đợt 1)
Thích nghi sau mỗi chặng (mục 2G) · thẻ "hôm nay em tiến thêm gì" từ `theTienBo` · nút "Em muốn làm thêm" (+EXP, hằng số vào `exp-cau-hinh.ts`) · gợi ý chữa trên bảng từ lõi sai nhiều (Code 1).

## NGHIỆM THU ĐỢT 1
1. Giao 80 câu hạn 7 ngày cho lớp thử: 3 em (yếu / trung bình / khá) nhận 3 bộ khác nhau, cùng chứa đủ lõi; em yếu 0 câu vượt bậc đích. 2. Điểm mỗi em trên số câu của em; bài không cá nhân hoá chấm y cũ. 3. Màn xem trước khớp đúng bộ em nhận khi mở bài ngay sau đó. 4. vitest: đỏ mới = [].

## CẬP NHẬT 21/09 — THẦY CHỐT: bài cá nhân hoá KHÔNG tự cho làm lại; thầy có NÚT "Cho làm lại" ở app giáo viên
- **Code 3**: lệnh thầy `/btvn/cho-lam-lai {maBtvn, sbd}` (mã bí mật), chỉ cho bài `ca_nhan=1` ĐÃ NỘP và CHƯA quá hạn (quá hạn ⇒ từ chối bằng lời, nhắc thầy gia hạn bằng lệnh sẵn có). Làm: chép kết quả hiện tại vào `btvn_em_lich_su` (bảng sẵn có), `so_lan_lam + 1`, xoá `nop_luc`/`dap_an_json`/`so_dung`, `lo_da_xong = 0`; GIỮ NGUYÊN bộ câu đã chốt + hạn nộp. Sự kiện ghi với `lan` mới; EXP không cộng đôi (khoá idempotent sẵn có — test khoá). `/btvn/cua-em` trả `soLanLam` để máy em biết là lượt mới. Ra `{ok, soLanLam}`.
- **Code 4**: tab theo dõi BTVN, mỗi em ĐÃ NỘP của bài cá nhân hoá có nút "Cho làm lại" — MỘT bước xác nhận nói thật ("Em làm lại từ chặng 1, cùng bộ câu, hạn nộp không đổi; điểm mới thay điểm cũ, điểm cũ vẫn lưu trong lịch sử"), báo đúng kết quả máy chủ; 404/từ chối ⇒ lời thật.
- **Code 2**: phiếu thấy `soLanLam` tăng ⇒ xoá nháp + kết quả chặng của lượt cũ ở máy em (khoá nháp gắn `soLanLam`), mở lại từ chặng 1.

## CẬP NHẬT 2 (21/09) — THẦY CHỐT: LỊCH CHẶNG LINH HOẠT THEO GIỜ khi hạn ngắn; giờ chốt mỗi ngày 23:59; giờ tự học chủ yếu 20:00–23:59
Nguyên tắc: chặng xếp theo **PHIÊN HỌC** chứ không cứng theo ngày. Mọi giờ tính theo giờ Việt Nam.
- **Khung mặc định**: mỗi ngày một CỬA SỔ HỌC 20:00–23:59; "xong đúng nhịp" = xong trước 23:59 của ngày đó. Hạn nộp thầy không ghi giờ ⇒ 23:59 của ngày hạn.
- **Hạn dài (tải mỗi ngày ≤ ngân sách của em)**: một chặng/ngày; chặng của ngày k MỞ từ 00:00 ngày đó (em học sớm vẫn được), mốc "đúng nhịp" là 23:59.
- **Hạn ngắn (tải mỗi ngày > ngân sách × 1,3, hoặc hạn ≤ 48 giờ)**: CHIA THEO GIỜ trong cửa sổ học — mỗi chặng ≤ ~10 câu (≈ 15–20 phút theo giây/câu thật của em), các chặng cách nhau ≥ 40 phút (nghỉ + giãn cách), ví dụ 20:00 · 21:20 · 22:40. Giao ban ngày mà hạn ngay tối đó ⇒ chặng 1 mở NGAY, các chặng sau rơi vào cửa sổ tối. Chặng cuối phải mở sớm hơn hạn ít nhất 1,5 × thời gian làm ước tính.
- **Không bao giờ nhốt em**: mốc mở đã qua thì chặng mở ngay khi chặng trước xong; khi thời gian còn lại < thời gian cần ⇒ BỎ giãn cách (deadline thắng). Em vào muộn (22:30) vẫn làm kịp được.
- **Không quá sức**: tổng bộ của em = min(số câu bài, SỨC CHỨA các phiên học tới hạn) nhưng ≥ lõi. Lõi vượt sức chứa lành mạnh (vd. 80 câu hạn ngay mai) ⇒ vẫn giao đủ lõi, nhưng màn Xem trước của thầy CẢNH BÁO: "Hạn ngắn: mỗi em tối thiểu N câu lõi trong M phiên — cân nhắc lùi hạn".
- **Lịch CHỐT CÙNG BỘ**: lịch mở từng chặng tính MỘT lần lúc em mở bài, LƯU vào `btvn_em.chang_mo_json` (cột đã có); bài đã chốt trước bản này không có JSON ⇒ dùng cách cũ. Tất định.
CHIA VIỆC: **Code 1** hàm thuần `xepLichChang({chotLuc, hanNop, soCauTungChang|tongCau, cauMoiNgay, giayMoiCau, cuaSo:{tu:'20:00', den:'23:59'}})` → `[{chiSo, moLuc, dungNhipTruoc}]` + `sucChua()`; test tính chất: mọi mốc mở < hạn; chặng cuối đủ thời gian; giãn cách ≥ 40 phút khi còn dư giờ; hạn dài ⇒ đúng một chặng/ngày mở 00:00; không chặng nào mở trong 00:00–05:59 ở chế độ theo giờ (trừ chặng mở ngay lúc chốt). **Code 3** dùng hàm này thay `moLucChang`, lưu `chang_mo_json`, trả `moLuc` từng chặng cho phiếu + kế hoạch ngày; `nganSachChoEm` dùng sức chứa theo phiên. **Code 2** phiếu + bảng nhiệm vụ hiện "Chặng 2 mở lúc 21:20" (đếm ngược nhẹ), không bắt em chờ khi hết giãn cách. **Code 4** ô hạn nộp mặc định 23:59; cảnh báo hạn ngắn ở Xem trước. Bộ não A.I: núm nhịp tác động SỨC CHỨA, không đổi hạn.

## CẬP NHẬT 3 (21/09) — BẢN 1.2: bài học từ BÀI THẬT ĐẦU TIÊN của thầy (Boss quyết, đúng hai lời dặn của thầy: "mọi em làm đủ câu cốt lõi" + "em yếu không phân câu khó")
SỐ LIỆU THẬT (Code 3 soi D1): bài 87 câu có **29 dạng** ⇒ lõi 29 câu (mỗi dạng 1 câu, phủ dạng thắng mức 30 %). Em 12121212 (ngân sách 8 câu/ngày, 3 câu dành ôn lại ⇒ 5 câu/ngày × 4 ngày = 20 < 29) ⇒ bộ của em = ĐÚNG 29 câu lõi, **phần riêng = 0**, và **14/29 câu là `loi_cao`** (dạng chỉ có câu Vận dụng, em đang ở bậc Biết). Tức em yếu nhận gần một nửa là câu quá sức và KHÔNG có câu luyện đúng bậc nào — trái tinh thần thầy chốt. Đúng mã, sai mục tiêu ⇒ SỬA LUẬT:
1. **Lõi BẮT BUỘC của từng em** = câu lõi có mức ≤ bậc đích + 1 của em ở dạng đó. Câu lõi cao hơn nữa (`loi_cao`) chuyển thành **"THỬ SỨC THÊM — không bắt buộc"**: xếp thành một nhóm riêng SAU chặng cuối (mở cùng lúc chặng cuối), KHÔNG tính vào điều kiện xong chặng/xong bài, vẫn theo luật câu THƯỞNG (đúng thì cộng, sai/bỏ không vào mẫu). Em khá (bậc đủ) thì các câu ấy vẫn là lõi bắt buộc như cũ. Câu GHIM của thầy: luôn bắt buộc với mọi em (thầy chủ động chọn).
2. **Ngân sách** so với LÕI BẮT BUỘC (không phải toàn bộ lõi) ⇒ em yếu còn chỗ cho phần RIÊNG đúng bậc ở dạng em yếu (ưu tiên ≥ 2 câu/dạng yếu như thiết kế).
3. Thống kê lõi phía thầy: tính trên câu lõi em ĐÃ LÀM; Xem trước hiện rõ mỗi em "bắt buộc N · thử sức thêm M".
4. `soChang` thật phải có trong phản hồi mở bài; thẻ "Chặng k trong K chặng" lấy K = `soChang` (KHÔNG đếm số chặng đã mở — bài thật hiện "1/1" trong khi K = 4).
5. Bài đã chốt giữ nguyên (không đổi bộ của em đã mở). Test tính chất mới: em bậc Biết ở mọi dạng ⇒ 0 câu Vận dụng BẮT BUỘC (trừ câu ghim); em khá ⇒ y như trước; tổng bắt buộc ≤ sức chứa hoặc = lõi bắt buộc.
CHIA VIỆC: **Code 1** lõi thuần (`chonBoCuaEm` trả thêm `thuSucThem: qid[]`, nhãn `loi_cao` giữ) → **Code 3** (xong chặng/bài không cần `thuSucThem`; `soChang`; xem-truoc trả hai con số) → **Code 2** (nhóm "Thử sức thêm · không bắt buộc" sau chặng cuối; K = soChang) → **Code 4** (Xem trước hai con số).
