# Đặc tả "Mức làm bài": đo mọi lượt, xếp mức theo thời gian đọc đề, hiện ở điểm danh · hồ sơ · ai sai · gọi lên bảng · app học sinh · phụ huynh — 20/10/2026

Trạng thái: **CHỜ THẦY DUYỆT ẢNH.** Chưa sửa `src/`, `server/`. Chưa đẩy gì. Ảnh ở `docs/ban-ve-muc-lam-2010/anh/` (11 khung; app thầy/học sinh/phụ huynh 3 khổ × sáng/tối; bản chiếu 1920×1080 và 1280×720). Mọi số trong ảnh là số GIẢ, tính từ MỘT bảng (`docs/ban-ve-muc-lam-2010/du-lieu-gia.mjs`) bằng chính các công thức dưới đây. Công thức là đề xuất; **ngưỡng là TẠM**, chờ hiệu chỉnh bằng số thật (mục 9).

## 1. Thầy yêu cầu (20/10)
- "Tính toán từng câu cho từng học sinh thời gian đọc hết đề cho câu đó, rồi đo việc học sinh làm bao nhiêu thời gian câu đó để đưa ra các mức làm cho có tới làm nghiêm túc thực sự."
- Hiện các mức đó ở điểm danh, chi tiết học sinh, học sinh lên bảng, "ai đã sai câu này", gắn nhãn ở app học sinh (Tự sửa lỗi), "mọi chỗ có thể"; làm lại các giao diện ấy cho sạch, khoa học, đẹp.
- **"Tất cả các câu học sinh đã làm, đang làm hoặc sắp làm đều phải đo được."**

Nói thẳng trước một điều: **câu "đã làm" không đo lùi được.** Giây không được ghi lúc ấy thì không có cách nào biết. Máy không được bịa số. Lượt cũ hiện "Chưa có số đo"; từ ngày bật đo trở đi mọi lượt đều có giây thật. Vì vậy phần ĐO phải phát hành TRƯỚC (Đợt 1), mỗi ngày chậm là mất thêm lượt không bao giờ lấy lại được.

## 2. Ba phát hiện làm đổi cách làm
1. **Hiện chỉ ca thi, chữa lỗi và game (khi OMNI bật) có giây từng câu.** Còn lại (BTVN, BTVN lỡ, khắc phục, mở bài, luyện đề, nền, tự luyện, kiểm tra cá nhân…) ghi `giay` = NULL; ôn lại máy chủ nhận nhưng máy em không gửi. Bảng đầy đủ ở mục 4.
2. **Đã có sẵn ba mô hình thời gian và một tín hiệu "quá nhanh" cứng.** Không thêm mô hình thứ tư; mức làm bài được lắp từ các phần đang có (mục 3).
3. **Ngân sách kế hoạch 75–300 giây (`GIAY_CO_SO`, `uoc-luong-thoi-gian.ts`) không dùng làm mốc "vội".** Đó là thời gian để xếp lịch, rộng tay. β của OMNI cũng quay về chính ngân sách ấy khi lớp chưa đủ 8 lượt của câu; lấy làm mốc thì em làm đúng, nhanh, thật sự giỏi sẽ bị gán "chưa kịp nghĩ".

## 3. Mô hình (một nguồn duy nhất cho mọi màn)

| Thành phần | Công thức | Lấy từ (đã có) |
|---|---|---|
| T_đọc của câu | 8 + 0,35 × số từ (đề + phương án/ý) + 10 nếu có hình/bảng, làm tròn | `thoiGianCau` (`src/lib/thoi-gian-len-bang.ts:136`), hằng `DOC_NEN_GIAY/DOC_GIAY_MOI_TU/DOC_HINH_GIAY` (`src/lib/len-bang-cau-hinh.ts:158-160`). Tách phần đọc thành hàm `thoiGianDoc` để mọi nơi gọi cùng một hàm |
| Hệ số đọc của em | e^(−τ) kẹp 0,75–1,5. Em chưa có τ ⇒ 1,0 | τ của OMNI (`omni-toc-do.ts`: ln t = β_câu − τ_em; chỉ có khi OMNI bật cho em) |
| T_đọc của em | T_đọc của câu × hệ số đọc | |
| Sàn nghĩ | Phần I **6** · Phần II **12** · Phần III **15** giây (TẠM) | mới |
| Thời gian thường của em | e^(β − τ), chỉ khi β thật: lớp có ≥ 8 lượt đúng hợp lệ của câu (`BETA_MAU_TOI_THIEU`) | `omni-toc-do.ts`, `omni-kieu.ts` |

**Bốn mức + "Chưa có số đo"** (chỉ xếp cho lượt có `giay` đo thật, `nguonGiay = 'do'`):

| Mức | Điều kiện (giây của lượt) | Chữ cho thầy |
|---|---|---|
| Mức làm 1 | < T_đọc của em. Lượt `luot` của OMNI (sai, nộp chưa tới 10% thời gian thường) tính thẳng Mức làm 1 | Chưa đọc hết đề |
| Mức làm 2 | T_đọc ≤ giây < T_đọc + sàn nghĩ | Đọc xong, chưa kịp nghĩ |
| Mức làm 3 | ≥ T_đọc + sàn nghĩ, và (β chưa thật hoặc giây < 0,8 × thời gian thường) | Có nghĩ |
| Mức làm 4 | giây ≥ 0,8 × thời gian thường của em. **Chỉ khi β thật** | Làm kỹ |
| Chưa có số đo | lượt không có giây đo thật. **Không ước, không xếp mức.** Giây `uoc` không bao giờ cho Mức làm 1–2 | Chưa có số đo |

Quy tắc đi kèm:
- **Mức chỉ dùng để giải thích lượt SAI.** Câu đúng mà làm chậm hơn T_đọc: bình thường. Câu đúng mà nộp trước T_đọc: chỉ ghi chú riêng cho thầy "đúng trước khi đọc hết đề" (có thể đã biết bài, có thể đoán trúng). Không đếm là lượt vội, không buộc tội.
- Lượt `luot` hiện bị loại khỏi `LA_LAN_LAM`/`SQL_LA_LAN_LAM`. Phải đếm riêng vào Mức làm 1, nếu không nhóm "chưa đọc hết đề" rỗng đúng chỗ lẽ ra đông nhất.
- "Đúng nhưng chậm" (> 2,0 × thời gian thường, OMNI) **giữ nguyên** là cờ riêng, không phải mức.
- Câu chỉ là ảnh: `noiDungTuCauGoc` tính 40 từ mặc định ⇒ T_đọc hiện "≈" và Mức làm 1 chỉ xét khi giây < 0,5 × T_đọc (TẠM).
- Vai trò các mô hình cũ: `uoc-luong-thoi-gian.ts` (xếp lịch) **không đổi, không làm mốc vội**; `omni-toc-do.ts` **không đổi**, cấp τ và thời gian thường, nhãn `troi_chay/thuong/cham/luot` giữ; `thoi-gian-len-bang.ts` là nguồn T_đọc; tín hiệu (b) "quá nhanh" cứng 8/15 giây thành **ĐỔI** (quyết định B).

## 4. Đo mọi lượt (Đợt 1, không đổi giao diện, phải đi trước)

**Một định nghĩa duy nhất:** giây của một lượt = thời gian câu hiện đủ trên màn **trong lúc tab đang hiện**, từ lúc câu hiện tới lúc em bấm nộp. Dừng khi tab ẩn, khóa màn hình, hoặc 180 giây không chạm màn (TẠM; chạm lại thì chạy tiếp). Trần 900 giây (bằng `MS_TOI_DA` của OMNI). Làm lại câu là lượt mới, giây riêng. Ghi `giay` + `nguonGiay = 'do'`. Hiện ba nơi đo ba kiểu khác nhau (thi: câu chiếm nhiều màn nhất, dừng khi ẩn; `msLam`: từ lúc hiện, không dừng khi ẩn; chữa lỗi: giờ máy chủ, cộng cả lúc rời) nên phải chốt MỘT.

| Nguồn | Màn → hàm nộp → lệnh máy chủ | Hiện tại | Việc cần làm |
|---|---|---|---|
| thi | `ExamTakeScreen.tsx:1696` → `/nop` `chamDiem` → `ghiSuKienThi` (`su-kien-hoc.ts:468`) | Có `giayCau{qid}` | Giữ; đổi sang đồng hồ dùng chung cho cùng định nghĩa |
| btvn, khắc phục | phiếu HTML `html-phieu.ts:2468` (`gui`) → `nopBtvnQuaPhieu` (`goi-cu.ts:900/961`), `nopKhacPhuc` (`:1041`) | Có dòng, `giay` NULL, không gửi giây | Bộ đếm viết thẳng trong JS phiếu (chạy trong iframe), gửi `giayCau{qid}` cùng đáp án |
| btvn_lo | `html-phieu.ts:2536,2572` → `btvn-nop-chang-em.ts:94` → `/btvn/xong-lo` → `nopChangCaNhan` (`btvn-nang-do-d1.ts:817`) | NULL | Như trên. Chặng thường gửi `xongLoBtvn` không kèm `dapAn` (`KhungXemPhieu.tsx:173`): chưa chắc có ghi sổ, phải kiểm |
| mom | `StudentPortalScreen.tsx:526` `nopBaiCuaMom` → `ghiHocMom` (`mom.ts:87`) | NULL | Hook đo, gửi giây |
| luyen | `dung-luyen-de.ts:142` → `luyen-de.ts:125` | NULL | Hook đo, gửi giây |
| nen | `HopLuyenNen` (`ThanhThangGo.tsx`) → `hsLuyenNenNop` (`thang-tu-go.ts:414`) | NULL | Hook đo, gửi giây |
| tu_luyen | `ManTuLuyen.tsx:404` → `tu-luyen.ts:786` → `dongBoTuLuyen` (`chua-cau-sai-tu-luyen.ts:61`) | Giây nằm ở `tu_luyen_cau.giay`, sổ NULL | Gộp bộ đếm riêng (`ManTuLuyen.tsx:341`) vào hook chung, ghi vào sổ |
| kiểm tra cá nhân | `ManKiemTraCaNhan.tsx:73,104` → `chotKtCn` (`kiem-tra-ca-nhan.ts:232`; ghi `nguon='game'`, `purpose='de_thu'`) | NULL | Hook đo, gửi giây |
| on_lai | `LamCauOn.tsx:160` → `nopOnLai` → `chamVaGhiTraLoi` (`on-lai-nop.ts:182`) | Máy chủ nhận `giay`, máy em không gửi; `GIAY_MIN = 5` (`:35`) đưa lượt < 5 giây về NULL | Máy em gửi giây. **Bỏ ngưỡng 5 giây**: lượt < 5 giây chính là Mức làm 1 |
| game (Làm bài tập: Đảo, Đoàn, Bi-a) | `ManLamBaiTap.tsx:136` `nopCau` → `game-v2.ts:602` | Máy em luôn gửi `msLam`; máy chủ chỉ lưu khi OMNI bật, vào `raw_json.ms`, không vào cột `giay` | Chỉ sửa máy chủ: ghi cả khi OMNI tắt, vào cột `giay` |
| chua_loi | `ManChuaCauSai.tsx:291` → `nopItem` (`chua-cau-sai.ts:698`) | Giờ máy chủ `now − phat_luc` (≤ 1800), cộng cả lúc rời | Dùng đồng hồ máy em (dừng khi rời màn), giữ giờ máy chủ làm trần |
| len_bang, dau_gio (thầy chấm) | `GoiLenBangScreen.tsx:1336` → `ghiLenBangMoi` (`index.ts:2886`) | `giayThuc` chỉ vào bảng `len_bang` | Chuyển sang sổ để xếp mức |

(`thu_thach_rieng` đã gỡ; giao diện Đảo/Đoàn/Bi-a cũ đã xóa 13/10, đường sống là `ManLamBaiTap`.)

**Cách làm:**
- Một hook `useGiayCau(qid)` (nạp lười, dừng theo `visibilitychange` và 180 giây không chạm) cho các màn React; thay ba bộ đếm riêng đang có. Không thêm byte vào gói mở app.
- Phiếu HTML (btvn, btvn_lo, khắc phục chạy trong iframe) cần bộ đếm viết trong chính JS của `html-phieu.ts`.
- Mọi lệnh nộp ở máy chủ **truyền `SuKien.giay`** (`su-kien-hoc.ts:48`); `suKienChamBai` và `suKienTuKetQuaCham` thêm tham số này.
- `ghiSuKien` dùng `INSERT OR IGNORE` (`:306`): lượt ghi đầu thắng. Làm lại phải sang `lan` mới (btvn `lanMoi`, btvn_lo +1000, khắc phục theo đáp án đổi, nền `count+1`).
- **Máy chủ không tự ước giây vào sổ.** Thiếu giây ⇒ NULL ⇒ hiện ở bảng "Độ phủ đo" (khung 02) màu cảnh báo để Boss sửa ngay. Chỉ có một hàm ước còn sống, `giayUocTinhGame` (`ai-sai-cau.ts:68`), dùng để hiển thị; nó gắn `nguonGiay = 'uoc'` và **không bao giờ xếp mức**.
- **Sắp làm:** T_đọc tính sẵn cho mọi câu. Bảng mới `cau_doc_giay (qid PK, so_tu, co_hinh, t_doc, nguon, cap_nhat)`, migration CHỈ-THÊM; điền bằng `noiDungTuCauGoc/noiDungTuCauLuyen` (nằm ở `src/lib`, máy chủ import được) cho kho game, câu btvn/mom/luyen (JSON ở R2) và `cau_nen`. KHÔNG dùng `cau_meta`/`cau-gon.ts` (đã bỏ hình, chỉ phủ kho game). Hiện ở màn giao bài của thầy: "Đọc hết 5 câu ≈ 2 phút 41 giây" (khung 02).
- Rủi ro nói thẳng: "giây" là thước đo sự chú ý, không phải suy nghĩ. Em có thể đợi cho đủ giây. Vì mức không cộng điểm, không EXP, không thưởng, không xếp hạng, em không có lý do làm vậy; ghi nhận, không chặn.

## 5. Đặc tả 7 mục (phần hiển thị, Đợt 2–3)

**5.1 Mục tiêu sư phạm.** Giáo viên: tách "sai vì chưa đọc hay chưa kịp nghĩ" khỏi "sai dù đã nghĩ" để chọn việc đúng (chữa trên bảng hay bắt làm lại, gọi ai lên bảng). Học sinh: thấy bằng số giây việc mình đã làm, để tự điều chỉnh; không điểm, không thưởng, không xếp hạng. Phụ huynh: biết con làm nghiêm túc đến đâu. Cảm giác cần đạt: số thật, thước rõ, không gán nhãn năng lực, không làm xấu mặt trước lớp.

**5.2 Bố cục** (3 khổ, mỗi khung có ảnh):

| Khung ảnh | Màn | Hiển thị cho ai | Chiếu hay riêng |
|---|---|---|---|
| 01 `thang` | Thang bốn mức, cách tính, thước mỗi em một khác | Thầy (giải thích kèm dấu "i" ở Hồ sơ) | Riêng |
| 02 `do` | Mọi câu đều đo: đã làm · đang làm · sắp làm, bảng nguồn, độ phủ | Thầy/Boss | Riêng |
| 03 `diem-danh` | Bảng điểm danh của thầy (`Buoc1DiemDanh`) | Thầy | Riêng |
| 04 `ho-so` | Hồ sơ làm bài của em (`HoSoLamCauEm`) | Thầy (+ chế độ HS/PH khung 07, 08) | Riêng; mở từ bản chiếu thì ẩn mức mặc định |
| 05 `ai-sai` | Ai đã sai câu này (`/gv/ai-sai-cau`) | Thầy | Riêng |
| 06 `len-bang` | Em được gọi lên bảng (`GoiLenBangScreen`) | Thầy | Riêng, KHÔNG lên chiếu |
| 07 `hs` | App học sinh: Tự sửa lỗi, màn sửa câu, Câu đã làm | Học sinh | Riêng |
| 08 `ph` | App phụ huynh | Phụ huynh | Riêng |
| 09–10 `chieu-tat/bat` | Bản chiếu điểm danh (`BanChieuDiemDanh`) | Cả lớp | **Chiếu** |
| 11 `chieu-x` | Tờ chiếu "ai sai câu này" (phím X) | Cả lớp | **Chiếu** |

Nút chính giữ như hiện có ở từng màn (không thêm nút chính mới). Chạm ≥ 44 px, chữ ≥ 13 px.

**5.3 Trạng thái.** Có số đo · **Chưa có số đo** (lượt cũ; viền nét đứt, kèm lý do) · Đang làm (chưa nộp: chưa hiện mức, hiện sau khi nộp) · Lớp chưa đủ mẫu (không có Mức làm 4, chú thích một dòng) · Câu chỉ là ảnh (T_đọc "≈") · Lượt `luot` (Mức làm 1). Đang tải / trống / lỗi / mất mạng: khối mức ẩn, không điền chữ thay, không chặn màn gốc.

**5.4 Dữ liệu.**
- Thêm trường CHỈ-THÊM `mucLam { ma: 0..4, giay, giayDoc, sanNghi?, thuong?, nguonGiay, ghiChu?: 'dung_truoc_doc' }` vào các lệnh đã có: `/gv/lich-su-lam-cau`, `/gv/ai-sai-cau`, `/gv/ho-so-len-bang`, lệnh danh sách điểm danh/nhịp học (đếm theo mức 14 ngày), và lệnh tương ứng của app học sinh/phụ huynh (chỉ lượt CỦA CHÍNH em).
- Tổng hợp lớp "hôm qua lớp làm bài thế nào" (4 mức + lượt sai theo mức) tính ở máy chủ; máy chiếu chỉ nhận số đã gộp.
- Hàm thuần `mucLamCuaLuot` đặt ở `server/src/muc-lam.ts`, gọi `thoiGianDoc` dùng chung; có test từ chính bảng số của bản vẽ.
- Đáp án không xuống máy học sinh trước khi nộp. Học sinh/phụ huynh không nhận số của bạn khác.
- Máy chủ còn thiếu: cột/bảng `cau_doc_giay` (mục 4); giây đo (mục 4).

**5.5 Ngoại lệ.** Tab ẩn nhiều lần · đổi máy giữa chừng · làm lại câu (lượt mới) · giây đột biến (kẹp 900) · câu chỉ ảnh · β chưa thật · em chưa có τ (hệ số 1,0) · tên/chữ dài (rút gọn 2 dòng, không tràn) · nộp lặp (INSERT OR IGNORE) · ca thi gián đoạn (giữ giây đã đo).

**5.6 Chi phí máy chủ.** Mỗi lần mở màn thêm 1 lệnh đọc `cau_doc_giay` theo tập qid đang xem, đặt CHUNG đợt với lệnh đọc lượt (`Promise.all`/`batch` hiện có), **0 vòng chờ nối tiếp**. β/τ đã được đọc cho OMNI, dùng lại. Ghi sổ: không thêm lệnh, chỉ thêm giá trị vào cột đang có. Phần nặng (T_đọc) tính sẵn một lần. Migration CHỈ-THÊM. Học sinh/phụ huynh: hàm hiển thị nạp lười, không thêm byte tải mở app (kiểm `npm run kiem:toc-do`).

**5.7 Nghiệm thu đo bằng máy.**
- vitest: `tests/muc-lam-bai-<ngày>.test.ts` (bảng ranh giới: giây sát T_đọc, sát T_đọc + sàn, sát 0,8 × thường, em chưa có τ, β chưa thật, `luot`, đúng-nhanh chỉ ghi chú, giây `uoc` không ra Mức 1–2, câu ảnh); `tests/do-giay-moi-nguon-<ngày>.test.ts` (mỗi đường nộp ở mục 4 truyền `giay` và máy chủ ghi vào cột); `tests/giay-uoc-khong-xep-muc-<ngày>.test.ts`; test giao diện từng khung (3 trạng thái: có số đo · chưa có · lớp chưa đủ mẫu).
- Cổng: `npm run build && npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0; `npm run check:mau`; `node scripts/kiem-sw.mjs`.
- Ảnh Chromium cho từng khung thật: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px (bản vẽ này đã qua: `node scripts/chup-ban-ve-muc-lam-2010.mjs`).

## 6. Từng màn: giữ / thêm / đổi

| Màn | Giữ | Thêm | Đổi |
|---|---|---|---|
| Bảng điểm danh (`Buoc1DiemDanh`) | Ba ô mã · có mặt · vắng; "Vừa điểm danh"; bấm tên mở hồ sơ | Thanh nhỏ Mức làm 14 ngày + "Mức làm 1–2: x/y lượt" ở mỗi dòng | Không |
| Hồ sơ làm bài | Đầu tấm, dải 14 ngày, nhãn nhóm, năm trong sáu tín hiệu | Khối "Cách làm bài" (thanh 4 mức, bảng đúng/sai, hai con số "sai khi vội / sai dù đã nghĩ"), "Lượt gần đây" có thước | Tín hiệu (b) đo theo Mức làm 1–2 trên lượt SAI (quyết định B); hiện đo bằng ngưỡng 8/15 giây cố định |
| Ai đã sai câu này | Số em làm/đúng/sai | Thanh 4 mức, biểu đồ chấm không tên, hai nhóm "Sai dù đã nghĩ" / "Sai khi làm vội", thước từng em | Danh sách phẳng chia hai nhóm, trong nhóm xếp theo số giây |
| Em được gọi lên bảng | Người được gọi do máy chọn (làn Codex) | Thước "giây em làm / giây đọc hết đề", 14 ngày, lượt gần đây | Không |
| Bản chiếu điểm danh | Thang 12 bậc, thẻ em, "Bậc cao nhất lớp", "Vừa điểm danh" | Thẻ "Hôm qua lớp làm bài thế nào" (gộp, không tên). Công tắc H bật ⇒ thanh nhỏ dưới tên | Không |
| Tờ chiếu ai sai (phím X) | Đề, đáp án, tên các em sai (không kèm mức) | Thanh 4 mức + chấm không tên | Không |
| Tự sửa lỗi (HS) | Việc hôm nay 3 chặng × 4 câu, một nút chính | Mỗi câu một dòng "x giây · đọc hết đề cần ≈ y giây" + thước + nhãn hành vi; đầu màn sửa câu có thước lớn | Không |
| Câu đã làm (HS) | Danh sách | Dòng giây; nhãn chỉ khi Mức làm 3–4 (câu đúng) | Không |
| App phụ huynh | Hồ sơ như hiện có | Một đoạn số thật + thanh 4 mức + 2 câu gần đây | Không |

## 7. Quyết định cần thầy chốt (kèm khuyến nghị)

- **A. Tên.** "Mức làm bài / Mức làm 1–4" dùng đúng chữ của thầy, nhưng chữ "mức" đã có ở "Đủ mức" (bản chiếu), "mức thường của em" (OMNI), "mức độ của câu". Khuyến nghị: giữ "Mức làm", luôn kèm số (không bao giờ viết "mức 2" trơ trọi), thêm một dòng vào `CHUAN-TU-NGU-VA-GIAO-DIEN.md`. Phương án khác: "Cách làm 1–4".
- **B. Tín hiệu (b) "quá nhanh" cứng 8/15 giây.** Thầy duyệt 12/10. Khuyến nghị: thay bằng Mức làm 1–2 trên lượt sai, để chỉ còn một cách đo; không thì hồ sơ có hai kết luận "quá nhanh" mâu thuẫn. **Đổi luật đã duyệt ⇒ đi qua Boss.**
- **C. Mức từng em trên bản chiếu.** Bản chiếu hiện cho cả lớp thấy. Khuyến nghị: mặc định ẨN (công tắc H đã có), chiếu chỉ số tổng của lớp; khi thầy bấm tên em trên bản chiếu thì hồ sơ mở ra cũng ẩn khối "Cách làm bài" và "Lượt gần đây" trừ khi bật H. Khung 10 vẽ trường hợp bật H để thầy thấy mức độ lộ. Nếu thầy muốn luôn hiện, đó là quyết định của thầy.
- **D. Chữ ở app học sinh.** Khuyến nghị: số giây trước, nhãn hành vi sau, không nhãn năng lực. "Nộp trước khi đọc hết đề · Đọc xong thì nộp ngay · Có thời gian nghĩ · Làm kỹ, đúng nhịp lớp". Câu **đúng** chỉ hiện nhãn khi Mức làm 3–4; câu đúng mà nộp nhanh chỉ hiện số giây. Không điểm, không thưởng, không xếp hạng.
- **E. Phụ huynh thấy gì.** Khuyến nghị: một đoạn số thật + thanh 4 mức + 2 câu gần đây (khung 08). Tin nhắn riêng cho phụ huynh vẫn do thầy soạn.
- **F. Ngưỡng tạm.** Sàn nghĩ 6/12/15 giây, 0,8 × thời gian thường, 180 giây không chạm, 0,5 × T_đọc cho câu ảnh. Hiệu chỉnh bằng số thật; xem mục 9 (có hai câu SQL chỉ-đọc để thầy chạy trên Console, hoặc cho phép em đẩy một workflow chỉ-đọc).
- **G. Lượt cũ.** Khuyến nghị: không đo lùi, hiện "Chưa có số đo". Phương án ước từ khoảng cách hai lượt không dùng được vì sẽ cho Mức làm 1–2 sai.
- **H. Thứ tự.** Đợt 1 ĐO (không đổi giao diện) → Đợt 2 màn thầy (điểm danh, hồ sơ, ai sai, gọi lên bảng, bản chiếu) → Đợt 3 học sinh + phụ huynh. Đợt 1 nên ra sớm nhất có thể để số liệu bắt đầu tích.

## 8. Làn và phối hợp
- `GoiLenBangScreen`, tờ chiếu (phím X), `html-may-chieu`: **Code 1**. Chiếu chữa ưu tiên / người gọi: **Codex** (mức chỉ hiện cạnh tên, không đổi ai được gọi).
- Trường `mucLam` ở máy chủ, `cau_doc_giay`, `muc-lam.ts`: **Code 3**.
- Bản chiếu điểm danh, `Buoc1DiemDanh`, Tự sửa lỗi, cổng tốc độ: Claude.
- `ExamTakeScreen`, `html-phieu.ts`, `StudentPortalScreen`, `ManLamBaiTap`, `LamCauOn`, `ManKiemTraCaNhan`, `HopLuyenNen`, `luyen-de`, `on-lai-nop.ts`, `game-v2.ts`, `chua-cau-sai*.ts`: chưa thấy làn rõ trong `DIEU-PHOI.md` ⇒ **báo Boss phân việc**, sửa tệp dùng chung phải báo trước.
- Sau khi thầy duyệt: ghi mục `[ ]` vào `docs/viec-giao-codex.md` cho phần Codex; báo Boss quyết định B.
- Đợt A (Tự sửa lỗi) vẫn nằm ở nhánh, chưa đẩy, theo lệnh của thầy. Việc này commit riêng, không lẫn.

## 9. Chưa kiểm chứng
- **Chưa có số thật về phân bố giây** theo nguồn và theo phần, nên mọi ngưỡng đều TẠM. Hai câu SQL chỉ-đọc (thầy dán vào Console D1, hoặc em đẩy một workflow chỉ-đọc nếu thầy cho phép):
  ```sql
  SELECT nguon, COUNT(*) AS luot, SUM(giay IS NOT NULL) AS co_giay,
         ROUND(AVG(giay),1) AS tb, MIN(giay) AS nho_nhat, MAX(giay) AS lon_nhat
  FROM su_kien_hoc WHERE ngay_vn >= '2026-09-20' GROUP BY nguon ORDER BY luot DESC;

  SELECT nguon,
         CASE WHEN giay < 10 THEN '1) <10' WHEN giay < 20 THEN '2) 10-19' WHEN giay < 30 THEN '3) 20-29'
              WHEN giay < 60 THEN '4) 30-59' WHEN giay < 120 THEN '5) 60-119' ELSE '6) 120+' END AS khoang,
         COUNT(*) AS luot
  FROM su_kien_hoc WHERE giay IS NOT NULL AND ngay_vn >= '2026-09-20' GROUP BY 1, 2 ORDER BY 1, 2;
  ```
- Chưa xác nhận hành vi `HoSoLamCauEm` khi mở từ bản chiếu (`trenChieu`) ẩn khối nào; chưa đọc hết `GoiLenBangScreen`.
- Chưa xác nhận phiếu HTML (iframe) gửi được giây cùng `gui`; chưa chắc `btvn_lo` thường có ghi sổ.
- β của OMNI hiện chỉ lấy từ lượt game có `msLam`. Khi mọi nguồn đã đo, có thể cho β lấy mẫu từ mọi nguồn để nhiều câu có Mức làm 4; đó là đổi `omni-toc-do.ts`, hỏi Boss sau Đợt 1.
- "Ngày bật đo 21/10" trong ảnh là giả; thật là ngày Đợt 1 phát hành.
- Ca thi đo "câu chiếm nhiều màn nhất", `msLam` đo "từ lúc hiện": hai kiểu khác nhau; mục 4 chốt một định nghĩa nhưng chưa thử trên máy thật.
- Chưa đo kích thước gói thật vì chưa build (Đợt 2–3 sẽ đo bằng `kiem:toc-do`).
