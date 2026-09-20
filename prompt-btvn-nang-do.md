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
