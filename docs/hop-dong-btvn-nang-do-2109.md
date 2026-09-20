# HỢP ĐỒNG — BTVN "NÂNG ĐỠ": máy chủ ↔ app thầy (Code 4) ↔ app học sinh + phụ huynh (Code 2)

Người viết: Code 3 (máy chủ), 21/09/2026. Thiết kế: `DE-XUAT-BTVN-NANG-DO-2109.md`; đề bài: `prompt-btvn-nang-do.md`; lõi thuần: `src/lib/btvn-nang-do.ts` (Code 1, máy chủ import như `doan-core`; kiểu `CauGiao`, `HoSoEmRut`, `NganSachBai`, `BoCuaEm`, `TomTatBo`, `NhanCau` dùng nguyên văn).
**ĐỔI LUẬT CHẤM BTVN (thầy duyệt 21/09): điểm tính trên SỐ CÂU CỦA TỪNG EM.** Bài `ca_nhan = 0` và mọi bài đang chạy: chạy Y NHƯ CŨ, từng byte phản hồi. Chưa đẩy Worker khi Boss chưa soát.

## 0 · Hiện trạng đã dò (để khỏi dò lại)
- Một lượt giao = MỘT dòng `btvn` cho MỖI ca (`ma_btvn = <mã ca>-<base36 ms>`), cùng `ma_de` (chuỗi phẩy, hậu tố `-TN/-DS/-TLN`), cùng `so_cau`; mỗi em một dòng `btvn_em` (`khoa = ma_btvn|sbd`). `qid = <mã đề gốc>-<phần>-<số>` theo trường `so` của câu (không theo vị trí), nên qid ổn định trong tờ đề.
- Điểm không lưu, tính `so_dung / so_cau × 10` (`hsBtvn`); `btvn_em.so_cau` là số câu CHẤM ĐƯỢC lúc nộp (`gradeHomework`: `keys.size`).
- **Lô đã có** (`lo_da_xong`, `/btvn/xong-lo`, `btvn_lo` trong kế hoạch ngày). Với bài `ca_nhan`, **CHẶNG ≡ LÔ**: `chiSo` của `/btvn/xong-lo` là chỉ số chặng, `lo_da_xong` = số chặng đã xong.
- GHI CHÚ AN TOÀN cho Boss: đường `/btvn/cua-em` HIỆN trả `de.cau` là câu thô của kho, CÓ `dap_an` (máy em chấm tại chỗ rồi máy chủ chấm lại). Comment ở `btvn-cho-em.ts` nói đáp án không nằm trong dữ liệu phiếu; thực tế nó nằm trong phản hồi mạng. Hợp đồng này KHÔNG đổi điều đó cho bài cũ; bài `ca_nhan` chỉ trả câu của chặng đã mở (rò ít hơn). Bỏ `dap_an` khỏi `de.cau` là việc riêng (cần phiếu ngừng chấm tại chỗ).

## 1 · Schema (chỉ thêm) — `server/migration-2109-btvn-nang-do.sql`
- `btvn`: `ca_nhan INTEGER NOT NULL DEFAULT 0`, `hat_giong TEXT`, `so_loi INTEGER`.
- `btvn_cau (ma_btvn, qid, thu_tu, dang, chuyen_de, muc_do 0|1|2, sao 0|1|2, phan 'I'|'II'|'III', loi 0|1, ghim 0|1, PK (ma_btvn, qid))` — câu của bài + nhãn, ghi lúc giao (chỉ bài `ca_nhan`).
- `btvn_em_cau (khoa = ma_btvn|sbd|qid PK, ma_btvn, sbd, qid, chang, nhan, thu_tu)` — bộ CHỐT của từng em.
- `btvn_em`: `so_cau_em INTEGER`, `so_chang INTEGER`, `chot_luc TEXT`, `tom_tat_json TEXT`, `ngan_sach_json TEXT`, `chang_mo_json TEXT` (mốc mở từng chặng, Đợt 2 dùng cho "làm thêm").
- Cờ toàn cục `cau_hinh.btvn_ca_nhan`: vắng = BẬT; `false`/`0`/`{"tat":true}` = TẮT. TẮT chỉ làm `caNhan` của lượt giao MỚI bị bỏ qua (bài thành `ca_nhan=0`); bài `ca_nhan=1` đang chạy giữ nguyên bộ đã chốt.

## 2 · `POST /btvn/giao` (thầy, mã bí mật) — thêm trường VÀO
`caNhan?: boolean` · `cau?: CauGiao[]` (≤ 300; `{qid, dang|null, chuyenDe, mucDo 0|1|2, sao 0|1|2, phan}`) · `ghim?: string[]` (qid cả lớp bắt buộc) · `hatGiong?: string` (≤ 40 ký tự, máy thầy sinh MỘT lần cho mỗi hộp thoại giao; dùng chung với `/btvn/xem-truoc` để bộ xem trước = bộ thật; vắng ⇒ máy chủ dùng `ma_btvn`). Vắng `caNhan` hoặc `false` ⇒ như cũ.
Bài `caNhan`: `cau[]` đối chiếu với các qid thật của tờ đề (`homeworkQuestions`): qid lạ bị bỏ (`boQuaQid`), qid của tờ mà `cau[]` thiếu được điền `{dang:null, chuyenDe:'', mucDo:0, sao:0}` (đếm ở `thieuMeta`). Máy chủ chạy `chonLoi(cau, ghim)`, ghi `btvn_cau` + `btvn.so_loi`. Đề nghị máy thầy gửi ĐỦ mọi câu của bài.
Ra thêm: `caNhan`, `soLoi`, `hatGiong`, `boQuaQid: string[]`, `thieuMeta: number`, `canhBao?: 'loi_it_hon_6'` (lõi < 6 câu ⇒ so chống chép bài không đủ mẫu; vẫn giao).

## 3 · `POST /btvn/cua-em {maCa, sbd, maBtvn?}` (em) — bài `ca_nhan = 1`
Bài `ca_nhan=0`: KHÔNG đổi. Bài `ca_nhan=1`, lần đầu (hoặc lần đầu kế hoạch ngày cần) máy chủ CHỐT bộ của em: đọc `nam_kt_dang`/`nam_kt_cau`/`su_kien_hoc` (số ngày đúng của từng câu) + ngân sách ngày của em, gọi `chonBoCuaEm(cau, loi, hoSo, nganSach, "<hatGiong>|<sbd>")`, ghi `btvn_em_cau` + các cột `btvn_em` — MỘT lần, các lần mở sau đọc lại đúng bộ ấy. Ra (thêm vào phản hồi cũ):
- `caNhan: true` · `soCau` = SỐ CÂU CỦA EM (không còn là số của bài) · `soCauCuaEm` (cùng số) · `soChang` · `loDaXong` (= số chặng đã xong, giữ tên cũ) · `changDangMo` (chỉ số chặng em làm bây giờ, 0-based; `null` khi đã xong hết).
- `chang: [{ chiSo, soCau, moLuc: ISO, daMo: boolean, daXong: boolean }]` (mọi chặng, KHÔNG có danh sách câu của chặng chưa mở).
- `nhan: Record<qid, 'loi'|'khoi_dong'|'dang_yeu'|'cung_co'|'thu_thach'>` cho câu đã mở; `tomTat: TomTatBo` (chỉ số đếm cho đầu bài "Bài của riêng em: N câu · K chặng").
- `de: { ma_de, cau[] }` CHỈ gồm câu của các chặng ĐÃ MỞ (theo thứ tự chặng → thứ tự trong chặng), mỗi câu đúng dạng cũ + `qid`. Đã nộp thì trả MỌI câu của em (xem lại).
- Mở chặng: chặng 0 mở ngay lúc chốt; chặng k > 0 mở khi CHẶNG k−1 ĐÃ XONG và `now ≥ moLuc[k]` (`moLuc[k]` = 00:00 giờ VN của ngày thứ k kể từ ngày chốt, không muộn hơn hạn nộp). Đợt 2: "Em muốn làm thêm" mở sớm.
- Không đưa số câu/bộ của bạn khác; không có xếp hạng.
Lỗi mới: `lyDo:'chua_chot'` không có (luôn chốt được); nếu hồ sơ không đọc được ⇒ chốt bằng hồ sơ rỗng (lõi + Biết/Hiểu), không lỗi.

## 4 · Nộp và chấm
- `POST /btvn/nop {maBtvn, sbd, dapAn}` (đầu vào KHÔNG đổi): bài `ca_nhan` chấm trên tập câu CỦA EM (`btvn_em_cau`); `soCau` = số câu của em; `soDung`, `qidSai` chỉ trong tập ấy; sổ `su_kien_hoc` và EXP giữ công thức cũ nhưng chỉ cho câu của em. Đáp án ngoài tập của em bị bỏ, không lỗi. Phản hồi thêm `caNhan:true`. Điểm = `soDung / soCau × 10` với `soCau` = câu của em.
- `POST /btvn/xong-lo {maBtvn, sbd, chiSo, dapAn?}`: bài `ca_nhan`: `chiSo` = chặng. `chiSo ≥ soChang` hoặc chặng CHƯA MỞ ⇒ `{ok:false, lyDo:'chang_chua_mo'}`. Có `dapAn` ⇒ chấm chỉ câu của chặng ấy (ghi sổ nguồn `btvn_lo`, `lan = chiSo`). Ra thêm `changDangMo`.
- `POST /hs/btvn` (danh sách): mỗi item thêm `caNhan`, `soCauCuaEm` (null khi CHƯA chốt), `soChang`; `diem`, `soCau` của bài `ca_nhan` theo câu của em.

## 5 · `POST /btvn/xem-truoc` (thầy, mã bí mật) — MỚI, CHỈ ĐỌC (0 INSERT/UPDATE; test khoá)
Vào: `{ dsSbd: string[] ≤ 50, sbdChiTiet?: string }` VÀ một trong hai:
- (a) TRƯỚC khi giao: `{ dsMaDe | maDe, cau: CauGiao[], ghim?: string[], hanNop: ISO, hatGiong: string }`;
- (b) SAU khi giao: `{ maBtvn }` (dùng `btvn_cau` + `hat_giong` đã lưu).
Ra: `{ ok, hatGiong, soCauBai, soLoi, loi: string[], ds: [{ sbd, hoTen, daChot: boolean, coHoSo: boolean, nganSach: {soNgay, cauMoiNgay, onLaiMoiNgay}, tomTat: TomTatBo }], chiTiet?: { sbd, chang: string[][], nhan: Record<qid, NhanCau> } }`. Em đã chốt (chỉ có ở (b)) trả ĐÚNG bộ đã ghi; em chưa chốt trả bộ TÍNH THỬ bằng cùng hạt giống, cùng hàm, hồ sơ hiện tại (nếu hồ sơ đổi trước khi em mở bài thì bộ thật có thể khác; màn ghi rõ "Bộ câu của em chốt khi em mở bài"). `chiTiet` chỉ có cho `sbdChiTiet` (giữ payload nhỏ). Không ghi `btvn_em_cau`.

## 6 · `POST /btvn/theo-doi` (thầy) và `/btvn/bai-lam`
- Mỗi bài thêm `caNhan`, `soLoi`. Mỗi `hocSinh[]` thêm: `soCauCuaEm` (null nếu chưa chốt), `soChang`, `loDaXong` (= chặng đã xong), `soDungLoi`, `soCauLoi`, `diemLoi` (đúng/lõi ×10, so lớp CHỈ trên lõi). `soDung`/`soCau`/`diem` theo câu của em.
- Chống chép bài (`gian-lan-btvn.ts`): bài `ca_nhan` chỉ so trên câu LÕI (qid chung của mọi em; cần ≥ 6 câu chung — lõi < 6 ⇒ không đủ mẫu, không gắn cờ).
- `/btvn/bai-lam {maBtvn, sbd}`: bài `ca_nhan` trả `de` chỉ gồm câu của em, kèm `caNhan`, `chang`, `nhan`; `soCau` = câu của em.

## 7 · Kế hoạch ngày, hồ sơ lên bảng
- `btvn_lo` trong `/hs/ke-hoach-ngay`: bài `ca_nhan` ĐÃ chốt dùng `soCau` = câu của em và lô ≡ chặng (`chiTiet.tongLo = soChang`, `chiSo` = chặng, `soCau` lô = số câu chặng); CHƯA chốt: `soCau` lô ≈ ngân sách một chặng, `chiTiet.chuaChot:true`. `chiTiet.caNhan:true` cho cả hai.
- `hoSoLopLenBang`/hồ sơ cả lớp: câu ngoài bộ của em KHÔNG bị tính là "chưa làm/sai".

## 8 · Hiệu năng, an toàn
Mở bài lần đầu (chốt) ≤ 12 truy vấn D1; mở lại ≤ 6; `/btvn/xem-truoc` ≤ 8 truy vấn cho ≤ 50 em. Bộ câu tất định theo `hatGiong|sbd`. Đáp án không thêm đường ra nào mới. Mọi trường mới là THÊM: máy khách cũ bỏ qua; máy chủ chưa chạy migration ⇒ bài không thể `caNhan` (giao báo lỗi bằng lời), bài cũ chạy như cũ.

## 9 · Đợt 2 (chữ ký giữ chỗ)
`POST /btvn/lam-them {maBtvn, sbd}` mở sớm chặng kế (thưởng EXP, hằng số vào `exp-cau-hinh.ts`); sau mỗi chặng máy chủ chạy `thichNghiChangSau` cho chặng CHƯA MỞ; phản hồi `/btvn/xong-lo` thêm `theTienBo: TienBo` (chỉ số đếm).
