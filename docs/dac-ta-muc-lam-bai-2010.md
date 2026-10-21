# Đặc tả "Mức làm bài": đo mọi lượt, xếp mức theo thời gian đọc đề, hiện ở điểm danh · hồ sơ · ai sai · gọi lên bảng · app học sinh · phụ huynh — 20/10/2026

Trạng thái: **CHỜ THẦY DUYỆT ẢNH.** Chưa sửa `src/`, `server/`. Chưa đẩy gì. Ảnh ở `docs/ban-ve-muc-lam-2010/anh/` (11 khung; app thầy/học sinh/phụ huynh 3 khổ × sáng/tối; bản chiếu 1920×1080 và 1280×720). Mọi số trong ảnh là số GIẢ, tính từ MỘT bảng (`docs/ban-ve-muc-lam-2010/du-lieu-gia.mjs`) bằng chính các công thức dưới đây. Công thức là đề xuất; **ngưỡng là TẠM**, chờ hiệu chỉnh bằng số thật (mục 9).

## 1. Thầy yêu cầu (20/10)
- "Tính toán từng câu cho từng học sinh thời gian đọc hết đề cho câu đó, rồi đo việc học sinh làm bao nhiêu thời gian câu đó để đưa ra các mức làm cho có tới làm nghiêm túc thực sự."
- Hiện các mức đó ở điểm danh, chi tiết học sinh, học sinh lên bảng, "ai đã sai câu này", gắn nhãn ở app học sinh (Tự sửa lỗi), "mọi chỗ có thể"; làm lại các giao diện ấy cho sạch, khoa học, đẹp.
- **"Tất cả các câu học sinh đã làm, đang làm hoặc sắp làm đều phải đo được."**

Nói thẳng trước một điều: **câu "đã làm" không đo lùi được hết.** Giây không được ghi lúc ấy thì không có cách nào biết, và máy không được bịa số. Lượt cũ chia ba nhóm:
- **Đã có trong sổ (`su_kien_hoc.giay`):** ca thi, nhưng cách đếm cũ chưa đủ tin để xếp Mức làm 1–2 (ca thi là danh sách cuộn nhiều câu cùng hiện trên màn; `ExamTakeScreen.tsx:1696-1714` cộng giây cho MỘT câu có tỉ lệ hiện lớn nhất, hòa thì một câu, nên câu còn lại bị thiếu giây; lại không kiểm em có đang rảnh). **Giây cũ của ca thi không xếp Mức làm 1–2** cho tới khi chốt cách đo mới của ca thi (mục 4, 9); chữa lỗi (giờ máy chủ, cộng cả lúc em rời màn nên giây chỉ có thể bị thổi lên, tức có thể thiếu Mức làm 1–2 chứ không bịa ra Mức làm 1–2).
- **Còn nằm ở kho khác, nạp lùi được:** tự luyện (`tu_luyen_cau.giay`), game có OMNI (`ms` trong bảng OMNI, `omni-d1.ts:561`), lên bảng (`len_bang.giay_thuc`). Nạp lùi hay đọc ghép là việc chạm dữ liệu thật ⇒ **quyết định I**, chưa làm gì.
- **Mất hẳn:** BTVN, BTVN lỡ, khắc phục, mở bài, luyện đề, nền, kiểm tra cá nhân, ôn lại, và mọi thứ của game khi OMNI tắt, trước ngày bật đo. Hiện "Chưa có số đo".

Từ ngày bật đo trở đi mọi lượt đều có giây thật. Vì vậy phần ĐO phải phát hành TRƯỚC (Đợt 1): mỗi ngày chậm là mất thêm lượt không bao giờ lấy lại được.

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
- Giây `do` theo cách đếm CŨ của ca thi không xếp Mức làm 1–2 (mục 4); chỉ giây theo định nghĩa mới của mục 4 mới xếp được.
- **Mức chỉ dùng để giải thích lượt SAI.** Câu đúng mà làm chậm hơn T_đọc: bình thường. Câu đúng mà nộp trước T_đọc: chỉ ghi chú riêng cho thầy "đúng trước khi đọc hết đề" (có thể đã biết bài, có thể đoán trúng). Không đếm là lượt vội, không buộc tội.
- Lượt `luot` hiện bị loại khỏi `LA_LAN_LAM`/`SQL_LA_LAN_LAM`. Phải đếm riêng vào Mức làm 1, nếu không nhóm "chưa đọc hết đề" rỗng đúng chỗ lẽ ra đông nhất.
- "Đúng nhưng chậm" (> 2,0 × thời gian thường, OMNI) **giữ nguyên** là cờ riêng, không phải mức.
- Câu chỉ là ảnh: `noiDungTuCauGoc` tính 40 từ mặc định ⇒ T_đọc hiện "≈" và Mức làm 1 chỉ xét khi giây < 0,5 × T_đọc (TẠM).
- Vai trò các mô hình cũ: `uoc-luong-thoi-gian.ts` (xếp lịch) **không đổi, không làm mốc vội**; `omni-toc-do.ts` **không đổi**, cấp τ và thời gian thường, nhãn `troi_chay/thuong/cham/luot` giữ; `thoi-gian-len-bang.ts` là nguồn T_đọc; tín hiệu (b) "Trả lời quá nhanh" (`NGUONG_THAI_DO`, `server/src/bai-hang-ngay-kieu.ts:113`: xấu khi ≥ 30% lượt dưới 8 giây với trắc nghiệm hoặc dưới 15 giây với tự tính VÀ nhóm ấy đúng dưới 50%; cần ≥ 20 lượt có giây) thành **ĐỔI** (quyết định B).

## 4. Đo mọi lượt (Đợt 1, không đổi giao diện, phải đi trước)

**Một định nghĩa duy nhất:** giây của một lượt = thời gian câu hiện đủ trên màn **trong lúc tab đang hiện**, từ lúc câu hiện tới lúc em bấm nộp. Dừng khi tab ẩn, khóa màn hình, hoặc 180 giây không chạm màn (TẠM; chạm lại thì chạy tiếp). Trần 900 giây (đã kiểm: `MS_TOI_DA = 900_000` ms, `omni-kieu.ts:125`). Làm lại câu là lượt mới, giây riêng. Ghi `giay` + `nguonGiay = 'do'`. Hiện ba nơi đo ba kiểu khác nhau (thi: câu chiếm nhiều màn nhất, dừng khi ẩn; `msLam`: từ lúc hiện, không dừng khi ẩn; chữa lỗi: giờ máy chủ, cộng cả lúc rời) nên phải chốt MỘT.

| Nguồn | Màn → hàm nộp → lệnh máy chủ | Hiện tại | Việc cần làm |
|---|---|---|---|
| thi | `ExamTakeScreen.tsx:1696` → `/nop` `chamDiem` → `ghiSuKienThi` (`su-kien-hoc.ts:468`) | Có `giayCau{qid}`, nhưng đếm cho MỘT câu trong số câu cùng hiện (`IntersectionObserver`, tỉ lệ hiện lớn nhất), không kiểm rảnh | **Định nghĩa lại cho ca thi** (đề xuất: tính cho mọi câu hiện ≥ 50% trên màn, gắn cờ "hiện cùng câu khác"; cần chốt, làn ca thi). Giây thi cũ không xếp Mức làm 1–2 |
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
- **Ràng buộc build:** cổng precache của service worker đang ở đúng 170/170 tệp sau Đợt A (`node scripts/kiem-sw.mjs`). Hook `useGiayCau` và các khối hiển thị mức KHÔNG được thêm tệp chunk mới; phải nằm trong chunk đã có (cách đã dùng ở Đợt A: xuất chung từ module `ManTuChua`). Không thêm byte vào gói mở app (`npm run kiem:toc-do`).
- Rủi ro nói thẳng: "giây" là thước đo sự chú ý, không phải suy nghĩ. Em có thể đợi cho đủ giây. Vì mức không cộng điểm, không EXP, không thưởng, không xếp hạng, em không có lý do làm vậy; ghi nhận, không chặn.

## 5. Đặc tả 7 mục (phần hiển thị, Đợt 2–3)

**5.1 Mục tiêu sư phạm.** Giáo viên: tách "sai vì chưa đọc hay chưa kịp nghĩ" khỏi "sai dù đã nghĩ" để chọn việc đúng (chữa trên bảng hay bắt làm lại, gọi ai lên bảng). Học sinh: thấy bằng số giây việc mình đã làm, để tự điều chỉnh; không điểm, không thưởng, không xếp hạng. Phụ huynh: biết con làm nghiêm túc đến đâu. Cảm giác cần đạt: số thật, thước rõ, không gán nhãn năng lực, không làm xấu mặt trước lớp.

**5.2 Bố cục** (3 khổ, mỗi khung có ảnh):

| Khung ảnh | Màn (tệp thật) | Hiển thị cho ai | Chiếu hay riêng |
|---|---|---|---|
| 01 `thang` | Thang bốn mức, cách tính, thước mỗi em một khác | Thầy (giải thích kèm dấu "i" ở Hồ sơ) | Riêng |
| 02 `do` | Mọi câu đều đo: đã làm · đang làm · sắp làm, bảng nguồn, độ phủ | Thầy/Boss | Riêng |
| 03 `diem-danh` | Bảng điểm danh của thầy (`Buoc1DiemDanh`, danh sách "Vừa điểm danh") | Thầy | Riêng |
| 04 `ho-so` | Hồ sơ làm bài của em (`HoSoLamCauEm`) | Thầy (+ chế độ HS/PH ở khung 07, 08) | Riêng; mở từ bản chiếu thì ẩn mức mặc định |
| 05 `ai-sai` | Ai đã sai câu này, phía app thầy | Thầy | Riêng. **Bố cục đề xuất, chưa đối chiếu màn thầy hiện có** (mục 9) |
| 06 `len-bang` | Chi tiết em được gọi lên bảng (`GoiLenBangScreen`) | Thầy | Riêng, KHÔNG lên chiếu. **Bố cục đề xuất, chưa đọc hết màn thật** (mục 9) |
| 07 `hs` | App học sinh: Tự sửa lỗi, màn sửa câu, Câu đã làm | Học sinh | Riêng |
| 08 `ph` | App phụ huynh | Phụ huynh | Riêng |
| 09–10 `chieu-tat/bat` | Bản chiếu **Nhịp học của lớp** (`ChieuNhipLop` trong `BanChieuDiemDanh.tsx`) | Cả lớp | **Chiếu** |
| 11 `chieu-x` | Tờ chiếu "Ai đã sai?" (phím X, `moAiSai` trong `len-bang-moi-to-chieu.ts`) | Cả lớp | **Chiếu** |

Bản chiếu có HAI chế độ: "Điểm danh" (mã + QR + thang 12 bậc, lúc em đang vào lớp) và "Nhịp học của lớp" (ba cột Chăm · Chưa đều · Lười, sau khi điểm danh). **Chế độ Điểm danh (QR) không đổi gì**: đó là lúc cả lớp quét mã, không phải lúc bàn về cách làm bài. Phần mới nằm ở Nhịp học của lớp.

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
- Cổng: `npm run build && npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0; `npm run check:mau`; `node scripts/kiem-sw.mjs` (đang 170/170, không thêm tệp chunk).
- Ảnh Chromium cho từng khung thật: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px (bản vẽ này đã qua: `node scripts/chup-ban-ve-muc-lam-2010.mjs`).

## 6. Từng màn: giữ / thêm / đổi

| Màn | Giữ | Thêm | Đổi |
|---|---|---|---|
| Bảng điểm danh (`Buoc1DiemDanh`) | Ô mã + QR, ô "có mặt" + đếm Chăm/Chưa đều/Lười, ô vắng, danh sách "Vừa điểm danh" (giờ · tên · chip nhóm · chip bậc), bấm em mở hồ sơ | Ở mỗi dòng: thanh nhỏ Mức làm 14 ngày + "Mức làm 1–2: x/y lượt" | Không |
| Hồ sơ làm bài (`HoSoLamCauEm`) | Đầu tấm (nhãn nhóm, lý do, cách tính), lịch 14 ngày, độ đúng theo ngày, năm tín hiệu (Ngày đủ mức · Dồn bài cuối ngày · Dùng gợi ý, đọc lời giải · Chọn lặp một phương án · Độ đúng theo thời gian), câu cần sửa / đã sửa | Khối "Cách làm bài": thanh 4 mức, bảng đúng/sai theo mức, hai con số "sai khi làm vội / sai dù đã nghĩ" | (1) Tín hiệu "Trả lời quá nhanh" đo theo Mức làm 1–2 trên lượt SAI (quyết định B). (2) "Lịch sử làm câu" hiện đã có "giờ · câu · nơi làm · mức độ · kết quả · số giây (≈ ước tính, — chưa đo được)": thêm thước + chip Mức làm, "—" thành "Chưa có số đo". (3) "Số giây từng lần (cũ → mới)" ở thẻ câu cần sửa: kèm chip của lượt cuối |
| Ai đã sai câu này (app thầy) | Số em làm / đúng / sai | Thanh 4 mức, biểu đồ chấm không tên, hai nhóm "Sai dù đã nghĩ" / "Sai khi làm vội", thước từng em | Chia hai nhóm, trong nhóm xếp theo số giây. Chưa đối chiếu màn hiện có |
| Em được gọi lên bảng | Người được gọi do máy chọn (làn Codex) | Thước "giây em làm / giây đọc hết đề", 14 ngày, lượt gần đây | Không. Chưa đọc hết màn thật |
| Bản chiếu: Điểm danh (QR) | Tất cả | Không | Không |
| Bản chiếu: Nhịp học của lớp | Tiêu đề, thanh nhóm, ba cột, chân màn, nút H "Ẩn tên nhóm Lười" (mặc định tên HIỆN) | Dải "Hôm qua lớp làm bài thế nào" (gộp, không tên). Nút mới **M** "Mức làm từng em" (mặc định Tắt): thanh nhỏ cạnh tên | Không |
| Tờ chiếu Ai đã sai? (phím X) | 4 ô số (em · lượt · trung bình mỗi lượt · nơi sai nhiều nhất), biểu đồ theo nơi làm và theo ngày, "Từng em" với từng lượt `ngày giờ · nơi làm · giây` (thầy 09/10 đã yêu cầu hiện giây từng lượt ở đây) | Ô "Lượt sai theo Mức làm" (thanh + chấm không tên). Nút **M** hiện chip Mức làm trên từng lượt (mặc định Tắt) | Không |
| Tự sửa lỗi (HS) | Việc hôm nay 3 chặng × 4 câu, một nút chính | Mỗi câu một dòng "x giây · đọc hết đề cần ≈ y giây" + thước + nhãn hành vi; đầu màn sửa câu có thước lớn và chú giải bốn khoảng | Không |
| Câu đã làm (HS) | Danh sách | Dòng giây; nhãn chỉ khi câu đúng ở Mức làm 3–4 | Không |
| App phụ huynh | Hồ sơ như hiện có | Một đoạn số thật + thanh 4 mức + 2 câu gần đây | Không |

Bảng màu: Mức làm 1→4 là MỘT dải màu theo độ đậm (không đỏ/vàng/xanh lá), vì ba màu ấy đã dành cho nhóm Chăm · Chưa đều · Lười và cho đúng/sai. Luôn kèm số "Mức làm N" và ký hiệu bốn vạch, không màu nào là kênh duy nhất.

## 7. Quyết định cần thầy chốt (kèm khuyến nghị)

- **A. Tên.** "Mức làm bài / Mức làm 1–4" dùng đúng chữ của thầy, nhưng chữ "mức" đã có ở "Đủ mức" (bản chiếu), "mức thường của em" (OMNI), "mức độ của câu". Khuyến nghị: giữ "Mức làm", luôn kèm số (không bao giờ viết "mức 2" trơ trọi), thêm một dòng vào `CHUAN-TU-NGU-VA-GIAO-DIEN.md`. Phương án khác: "Cách làm 1–4".
- **B. Tín hiệu (b) "quá nhanh" cứng 8/15 giây.** Thầy duyệt 12/10. Khuyến nghị: thay bằng Mức làm 1–2 trên lượt sai, để chỉ còn một cách đo; không thì hồ sơ có hai kết luận "quá nhanh" mâu thuẫn. **Đổi luật đã duyệt ⇒ đi qua Boss.**
- **C. Mức từng em trên bản chiếu.** Đã kiểm mã: (1) nút H chỉ có ở chế độ Nhịp học của lớp và chỉ ẩn tên nhóm Lười (mặc định tên HIỆN), chế độ Điểm danh không có H; (2) tờ chiếu "Ai đã sai?" ĐÃ hiện giây từng lượt cạnh tên từng em (thầy yêu cầu 09/10). Nên thầy đã chấp nhận lộ số giây từng em; thứ mới là chip "Mức làm" kèm chữ đánh giá. Khuyến nghị: mặc định chỉ chiếu số gộp của lớp; chip/thanh từng em nằm sau nút mới **M** (mặc định Tắt, vẽ ở khung 10); khi thầy bấm tên em trên bản chiếu thì hồ sơ mở ra cũng ẩn khối "Cách làm bài" và "Lịch sử làm câu" kèm mức trừ khi M bật. Phím M: đã grep `'M'`/`"M"` trong `BanChieuDiemDanh.tsx` và `len-bang-moi-to-chieu.ts`, không thấy phím M nào, nên dùng được; Code 1 xác nhận lại với bản `html-may-chieu`. Nếu thầy muốn luôn hiện thì đó là quyết định của thầy.
- **D. Chữ ở app học sinh.** Khuyến nghị: số giây trước, nhãn hành vi sau, không nhãn năng lực. "Nộp trước khi đọc hết đề · Đọc xong thì nộp ngay · Có thời gian nghĩ · Làm kỹ, đúng nhịp lớp". Câu **đúng** chỉ hiện nhãn khi Mức làm 3–4; câu đúng mà nộp nhanh chỉ hiện số giây. Không điểm, không thưởng, không xếp hạng.
- **E. Phụ huynh thấy gì.** Khuyến nghị: một đoạn số thật + thanh 4 mức + 2 câu gần đây (khung 08). Tin nhắn riêng cho phụ huynh vẫn do thầy soạn.
- **F. Ngưỡng tạm.** Sàn nghĩ 6/12/15 giây, 0,8 × thời gian thường, 180 giây không chạm, 0,5 × T_đọc cho câu ảnh. Hiệu chỉnh bằng số thật; xem mục 9 (có hai câu SQL chỉ-đọc để thầy chạy trên Console, hoặc cho phép em đẩy một workflow chỉ-đọc).
- **G. Lượt cũ.** Khuyến nghị: không đo lùi, hiện "Chưa có số đo". Phương án ước từ khoảng cách hai lượt không dùng được vì sẽ cho Mức làm 1–2 sai.
- **H. Thứ tự.** Đợt 1 ĐO (không đổi giao diện) → Đợt 2 màn thầy (điểm danh, hồ sơ, ai sai, gọi lên bảng, bản chiếu) → Đợt 3 học sinh + phụ huynh. Đợt 1 nên ra sớm nhất có thể để số liệu bắt đầu tích.

- **I. Lượt cũ còn nằm ở kho khác (tự luyện, game có OMNI, lên bảng).** Khuyến nghị: để đọc ghép lúc hiển thị (chỉ đọc, không ghi) cho game có OMNI; hai nguồn còn lại chỉ nạp lùi khi thầy duyệt. Nạp lùi vào hàng thật của `su_kien_hoc` là ghi vào dữ liệu thật ⇒ **dừng, báo Boss và thầy**, em chưa làm gì.

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
- Chưa xác nhận hành vi `HoSoLamCauEm` khi mở từ bản chiếu (`trenChieu`: khối nào hiện); chưa đọc hết `GoiLenBangScreen` và màn "ai sai" phía app thầy (`ThayTuChua.tsx`, `ung-vien-chua-cau.ts`): khung 05 và 06 là bố cục đề xuất, KHÔNG phải "Giữ". Khung 03, 04, 09, 10, 11 đã đối chiếu với mã (`Buoc1DiemDanh.tsx`, `HoSoLamCauEm.tsx`, `BanChieuDiemDanh.tsx`, `len-bang-moi-to-chieu.ts`), nhưng là vẽ lược: số, chữ trong khối "Giữ" lấy từ mã, bố cục chi tiết chưa khớp từng điểm ảnh.
- Chưa xác nhận phiếu HTML (iframe) gửi được giây cùng `gui`; chưa chắc `btvn_lo` thường có ghi sổ.
- β của OMNI hiện chỉ lấy từ lượt game có `msLam`. Khi mọi nguồn đã đo, có thể cho β lấy mẫu từ mọi nguồn để nhiều câu có Mức làm 4; đó là đổi `omni-toc-do.ts`, hỏi Boss sau Đợt 1.
- "Ngày bật đo 21/10" trong ảnh là giả; thật là ngày Đợt 1 phát hành.
- Ca thi đo "câu có tỉ lệ hiện lớn nhất" trong danh sách cuộn, `msLam` đo "từ lúc hiện", chữa lỗi đo giờ máy chủ: ba kiểu khác nhau; mục 4 chốt một định nghĩa nhưng riêng ca thi (nhiều câu cùng hiện) cần thiết kế thêm và chưa thử trên máy thật.
- Chưa đo kích thước gói và số tệp precache thật vì chưa build (Đợt 2–3 đo bằng `kiem:toc-do` và `kiem-sw.mjs`).
- Một ảnh (`05-ai-sai-ngang-sang`) hơi quá 150 KB (chuẩn của repo cho ảnh bằng chứng); không ảnh hưởng nội dung.

## 10. Trạng thái xây dựng (thầy duyệt 20/10 22:00: "duyệt mọi thứ, bạn tự tối ưu mọi thứ, build và đẩy tất cả lúc 1h ngày 21/10")

**Quyết định của Claude ("tự tối ưu"):** chia hai lượt phát hành. PR 1 = Đợt A Tự sửa lỗi (đã test xong từ trước, không để mã mới chặn được). PR 2 = **Đợt 1 ĐO GIÂY, không đổi giao diện**: tối nay lượt nào cũng chưa mang số đo nên mọi khung hiển thị chỉ hiện "Chưa có số đo", thêm giao diện chỉ thêm rủi ro. Giao diện (Đợt 2: màn thầy · Đợt 3: học sinh + phụ huynh) làm sau khi số đo bắt đầu chảy, tính từ dữ liệu thật. Không nạp lùi giây vào hàng thật của `su_kien_hoc` (quyết định I: chạm dữ liệu thật, cần thầy duyệt từng việc).

**Đã làm ở Đợt 1** (nhánh `dev/muc-lam`; sổ `su_kien_hoc`, KHÔNG đổi schema, KHÔNG thêm lệnh D1, KHÔNG đổi đường chấm):
- Máy chủ ghi cột `giay` (nguyên 1–900) + `raw_json.doc = {t: số từ, h: có hình 0/1, p: phần I/II/III}` ở: **game** (Làm bài tập, `game-v2.ts`, kể cả OMNI tắt; máy cũ chỉ gửi `msLam` vẫn ra giây), **ôn lại** (`on-lai-nop.ts`, bỏ ngưỡng 5 giây cho `doGiay`), **phiếu BTVN / khắc phục / chặng `btvn_lo` / thử sức thêm** (`goi-cu.ts`, `btvn-nang-do-d1.ts`, `index.ts`), **chữa lỗi** (nhận `doGiay` khi máy em gửi; máy em chưa gửi ⇒ vẫn giờ máy chủ như cũ).
- **Kích thước đề do MÁY CHỦ tự đo** từ chính câu nó vừa chấm (`boSungKichThuocDe` trong `server/src/do-giay-luot.ts`, dùng đúng `noiDungTuCauGoc` của màn lên bảng); máy em chỉ gửi giây (`doGiay: {g}` hoặc `{qid: {g}}`) và mọi t/h/p máy em khai bị bỏ. Lý do: không tin số của máy em, và không kéo mã đếm từ vào gói tải mở app (cổng `kiem:toc-do`). Hàm không bao giờ ném lỗi (đường ghi sổ là đường quan trọng nhất).
- Máy em: đồng hồ nội tuyến ở `ManLamBaiTap.tsx` và `LamCauOn.tsx` (một câu: giây câu đang hiện; nhiều câu cùng hiện: chỉ cộng cho câu em chạm gần nhất nếu còn hiện ≥ 50%, không thì câu hiện lớn nhất); đồng hồ trong trang phiếu (`taoBoDoGiay` trong `html-phieu.ts`, đã thử trên Chromium thật trong iframe). Cùng định nghĩa: chỉ cộng khi tab hiện + em còn chạm trong 180 giây; trần 900; chưa đủ 1 giây ⇒ không gửi (không gửi 0). Hàng đợi nộp lại (máy chủ bận) giữ `doGiay`.
- Cổng đã qua (nhánh `dev/muc-lam`): `kiem-sw` 13/13 và đúng 170 tệp precache; `kiem:toc-do` HS +921 B / GV +0,7 KB / PH +0,6 KB so với mốc (bằng bản Đợt A); vòng D1 nóng không đổi; `check:mau`, `kiem:mau-giu` 0; toàn bộ vitest: 0 test đỏ mới so với bản gốc (so TÊN).
- Công cụ kiểm sau phát hành: workflow chỉ đọc `.github/workflows/do-phu-giay-2110.yml` (độ phủ giây theo nguồn trong 24 giờ, phân bố giây theo phần, lượt có giây mà thiếu kích thước đề).

**Chưa đo (làm tiếp):** ca thi (cần định nghĩa lại vì danh sách cuộn nhiều câu cùng hiện; giây cũ của thi không xếp Mức làm 1–2), mở bài (`mom`; nằm trong `StudentPortalScreen`, thuộc gói tải mở app nên phải bù byte), luyện đề, nền, tự luyện (đồng hồ riêng đang tính cả lúc ẩn tab, sổ để trống), kiểm tra cá nhân (trạng thái chặng/nháp phức tạp, cần cột lưu giây), Đoàn Hộ Tống; chữa lỗi phía máy em (bước chữa không phải đọc đề câu gốc); `/btvn/xong-lo` nhánh cũ có `dapAn` (chỉ ghi giây, thiếu kích thước đề). Chặng `btvn_lo` thường không ghi sổ (không kèm đáp án), giây đi theo lượt nộp cả bài.
**Chưa làm theo đặc tả:** Mức làm 4, τ riêng từng em và tín hiệu (b) mới (cần β thật của lớp: lấy từ OMNI hoặc từ chính các lượt đã đo, quyết định sau khi có số); bảng `cau_doc_giay` "sắp làm" (không cần cho Đợt 1 vì kích thước đề ghi theo từng lượt).

### 10b. Cờ nguồn đồng hồ `doc.dh` (21/10, PR 4) — đọc trước khi tính Mức làm từ dữ liệu thật
- Phát hành Đợt 1 (Worker `2c7ff01`, 21/10 ≈ 01:33 VN) ghi `giay` cho game từ MỘT trong hai nguồn mà chưa đánh dấu: (a) cụm `doGiay.g` của đồng hồ MỚI (dừng khi tab ẩn, 180 s không chạm); (b) `msLam` của máy em bản CŨ (đồng hồ tường, chạy cả khi tab ẩn, trần 900 s). Máy em chỉ nạp bản mới khi mở lại app, nên hai nguồn lẫn nhau trong cùng cột.
- PR 4 thêm `raw_json.doc.dh = 1` CHỈ khi giây đến từ `doGiay` hợp lệ; giây suy từ `msLam` thì KHÔNG có `dh`. Quy tắc đọc: `doc.dh = 1` ⇒ đồng hồ mới (dùng được cho Mức làm); dòng game có `giay` mà không `dh` ⇒ đồng hồ cũ hoặc không rõ — KHÔNG xếp Mức 1–2 từ giây này (dễ nhiễm tab ẩn), chỉ dùng làm chặn trên thô.
- Dòng ghi giữa 01:33 VN (Worker `2c7ff01`) và 06:44:15 VN 21/10 (Worker PR 4, main `299a873`, Actions `39516150163`) không có `dh` kể cả khi từ đồng hồ mới ⇒ coi là "không rõ".
- Không UPDATE bù dòng cũ (quyết định 21/10): dòng cũ không có giây đo thật để bù; kích thước đề của dòng có giây (thi, chữa lỗi) sẽ TÍNH LÚC ĐỌC từ nội dung câu khi làm Đợt 2, không ghi đè dữ liệu thật.
- Công cụ: `.github/workflows/do-phu-giay-2110.yml` có thêm cột `dong_ho_moi`, phân bố theo `dh`, và truy vấn 4 (so lượt ≥ 600 s giữa hai đồng hồ — nếu đồng hồ cũ nhiễm tab ẩn thì tỉ lệ ≥ 600 s của nhóm không `dh` cao hơn rõ).


## 11. Tờ chiếu: "Ai đã sai?" hai thẻ và chi tiết em gọi lên bảng (thầy 21/10) — ĐÃ XÂY trên nhánh, chờ thầy duyệt ảnh rồi mới phát hành

**Thầy dặn (21/10):** (a) Ai đã sai? (phím X) khi bấm hiện HAI thẻ — thẻ 1 là em **đã điểm danh** làm sai câu đó, thẻ 2 là **cả lớp** làm sai câu đó — thiết kế lại "siêu đẹp, trực quan, khoa học", hiện đủ Mức làm 1–4; (b) chi tiết em được gọi lên bảng cũng hiện đủ Mức làm 1–4; (c) **bỏ câu "chỉ thầy nhìn, không hiện lên màn chiếu"** — bấm chi tiết là hiện đủ trên màn chiếu. Quyết định này **thay** ghi chú ở khung 06 và 11 của bản duyệt 20/10 ("Chỉ thầy thấy", "mức chỉ để thầy nhìn", mặc định tắt chấm Mức).

**Hiện trạng (đã đọc mã):** tờ X hiện có MỘT danh sách chung (`veAiSai` trong `src/lib/len-bang-moi-to-chieu.ts`; dữ liệu `/gv/ai-sai-cau`) — chưa có hai thẻ. Bản mới tách hai thẻ; nếu thầy muốn "hai thẻ" ở màn khác thì thầy chỉ giúp.

**1 · Mục đích.** Thầy nhìn một màn biết ngay: trong số em có mặt, ai làm sai và sai theo kiểu nào (nộp vội hay đã nghĩ), rồi cả lớp thế nào. Chữa đúng chỗ: Mức làm 1–2 = đọc chưa kỹ; Mức làm 3–4 = đã nghĩ vẫn sai (hổng kiến thức).
**2 · Dữ liệu.** `/gv/ai-sai-cau {qids, sbds}` mỗi lượt sai có `mucLam` (`ma`, `giay`, `giayDoc`, `sanNghi`, `thuong?`, `xapXi?`); `sbds` = danh sách em của lớp, lọc ngay trong truy vấn (trước khi cắt 300 lượt). App thầy gắn thêm: em nào đã điểm danh (có mặt) và sĩ số. `/gv/ho-so-len-bang` mỗi lần làm câu có `mucLam`; thêm khối "Cách làm bài 14 ngày" (đếm theo Mức, đúng/sai). Mức xếp bằng MỘT đường (`server/src/muc-lam-so.ts`): chỉ lượt có giây ĐO THẬT bằng đồng hồ mới; còn lại "Chưa có số đo".
**3 · Trạng thái.** Có số đo · lớp đông (4 cột, có thể cuộn) · những ngày đầu (gần hết lượt "Chưa có số đo", chưa có β nên không xếp Mức làm 4) · chưa điểm danh (thẻ 1 báo "Buổi này chưa điểm danh", không để trống) · đang tải / lỗi (như cũ).
**4 · Chữ.** "Đã điểm danh", "Cả lớp", "Mức làm 1–4" kèm tên ("Chưa đọc hết đề", "Đọc xong, chưa kịp nghĩ", "Có nghĩ", "Làm kỹ"), "Chưa có số đo". Mỗi làn ghi khoảng giây ("dưới 24 giây", "24–29 giây"…). Em vắng đánh dấu vòng tròn rỗng (có chú giải ở đầu thẻ). Tên dài tự viết tắt chữ đệm ("Nguyễn Đ. Anh").
**5 · Luật hiển thị (theo thầy 21/10).** Hiện ĐỦ trên màn chiếu, kể cả tên và Mức của từng lượt; lượt ĐÚNG ở Mức 1 ghi trung tính "Đúng · nộp sau N giây, trước khi đọc hết đề". Không có phím ẩn riêng; nếu thầy muốn che tên khi chiếu thì thêm sau.
**6 · Hiệu năng.** `/gv/ai-sai-cau`: 2 đợt D1 như cũ, thêm MỘT lệnh β cùng đợt (0 lệnh khi chưa lượt nào có số đo mới). `/gv/ho-so-len-bang`: các khối đọc song song — 29 đợt → 14 đợt (đo trên cổng `tests/toc-do-may-chu-ph-2110.test.ts`).
**7 · Nghiệm thu.** Ảnh Chromium thật ở `docs/ban-ve-chieu-muc-lam-2110/anh/` (1920×1080 và 1280×720, nền tối): 12a có số đo · 12b lớp đông · 12c những ngày đầu · 12d chưa điểm danh · 13a chi tiết em · 13b chi tiết em chưa có số đo. Soát: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · 0 khung bị cắt. Dựng lại: `node scripts/dung-ban-ve-chieu-muc-lam-2110.mjs && node scripts/chup-ban-ve-chieu-muc-lam-2110.mjs`.

**Đã xây (21/10, nhánh `claude/stoic-einstein-7jkysb`):** tấm Hồ sơ làm bài ở ba app (`14101d5`, `7159fad`) · máy chủ `/gv/ai-sai-cau` (lọc theo `sbds`, `mucLam` kèm ranh) và `/gv/ho-so-len-bang` (`cachLam14`) · tờ chiếu phím X hai thẻ + chi tiết em (`5f8ae2f`). Ảnh nghiệm thu là ảnh CHỤP TỪ MÃ THẬT của tờ chiếu (không phải bản vẽ HTML): `docs/anh-muc-lam-chieu-2110/` (12 ảnh JPG ≤ 150 KB), dựng lại bằng `npx vite build --config scripts/chup-muc-lam-2110/vite.config.mjs --outDir <tạm>` rồi `node scripts/chup-muc-lam-2110/chup-chieu.mjs <tạm>`. Soát: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · 0 khung bị cắt; MỘT trường hợp cực đoan (`ai-sai-dong-em-1280`: lớp rất đông trên khổ 1280×720) có 7 tên bị cắt bằng "…" — chấp nhận, vì tên đầy đủ vẫn ở cột còn lại và ở chi tiết em.
Khác bản vẽ: biểu đồ cột "nơi sai / ngày sai" của bản vẽ không đưa vào tờ chiếu (giờ + nơi làm của từng lượt chỉ còn ở chú thích khi rê chuột — máy chiếu không có rê chuột nên không thấy; muốn hiện thì thêm sau); lịch sử cũ phần lớn hiện "Chưa có số đo" cho tới khi đồng hồ mới chạy đủ ngày (xem 10b).
**Màn nào hiện hai thẻ khi bấm X:** Gọi lên bảng · Lên bảng chiến dịch · Thầy tự chữa · Kiểm tra đầu giờ · Dạy học · Cần chữa trên lớp — khi đã có danh sách lớp của buổi; chưa tải được danh sách lớp thì tờ hiện MỘT thẻ "Cả lớp" như trước (không báo sai).
**Màu:** dải xanh Mức làm 1→4 đúng bản thầy duyệt 20/10; chín biến gốc của hai bảng khai MỘT chỗ, mọi màu MỚI còn lại là `var()`/`color-mix()` (màu thô cũ giữ nguyên đúng số lần; thêm dùng thô là cổng bắt); khai báo màu của bản cũ biến mất theo lệnh thầy 21/10 (danh sách đóng `docs/mau-thay-ra-lenh-2110.json`, đọc bởi `scripts/kiem-mau-giu-nguyen.mjs`).

**Giả định đã dùng (thầy sửa được):** (1) "bấm làm lại" ở tin nhắn thầy = bấm X trên tờ chiếu của câu đang chiếu; (2) "đã điểm danh" lấy từ bước Điểm danh của buổi đang chiếu, "cả lớp" = danh sách em của lớp đó; (3) số liệu trong ảnh là số giả (tên giả, ngưỡng 24 / 6 / 60 giây).
