# ĐỀ XUẤT — GHÉP "ALCHEMY-OMNI 2.0" VÀO omr-app: MỘT HÀM MỤC TIÊU "KHOẢNG CÁCH TỚI 8" CHO TỪNG CHIẾN DỊCH, GIỮ CHÂN BẰNG TIẾN BỘ NHÌN THẤY MỖI NGÀY

Soạn 05/10/2026 · **Chưa build.** Thầy đọc mục 0, 2, 8 là đủ để quyết; mục 1 và 4 là chứng cứ đọc từ mã.

Nguồn: đặc tả `alchemy_omni_specs.md` thầy gửi (BKT · 3PL-IRT/CAT · FSRS-6 · Heal Station · Iron Gate · clone đẳng cấu · O2O) đối chiếu với mã thật của repo
(`server/src/*` 190 tệp, 14 đề xuất `DE-XUAT-*.md`, hợp đồng `docs/hop-dong-game-hoa-2.md`, đặc tả CNH-1.0 `docs/cline-ca-nhan-hoa-2309/`). Mọi tên bảng/hàm/tệp dưới đây có trong mã; số liệu dẫn nguồn ở từng dòng.

---

## 0. KẾT LUẬN MỘT TRANG

**1. Khoảng 70 % đặc tả ALCHEMY-OMNI đã CÓ trong app dưới tên khác**, và nhiều chỗ còn chặt hơn đặc tả:
sổ sự kiện một nguồn sự thật (`su_kien_hoc`), FSRS-6 (đúng thư viện, đúng mức nhớ 0,9), thành thạo theo 2 ngày khác nhau, đóng lỗi bằng câu song sinh,
thang tự gỡ 5 bậc có ngân hàng câu nền, cổng nỗ lực, kiểm tra đầu giờ = "thầy xác nhận", hiệu chỉnh tham số hằng tuần, chiến dịch có đồng hồ sức chứa, chuỗi ngày, rương, thần thú 120 cấp.
→ **Không viết lại gì.** Chỉ nối thêm.

**2. Thứ app CHƯA có mà mục tiêu "8+" cần nhất: một con số dự báo.** Hiện không chỗ nào trong mã tính "nếu thi hôm nay em được bao nhiêu điểm" (grep `dự báo điểm`/`điểm dự kiến`/`duBaoDiem` trên `server/src` và `src/lib` = 0 kết quả).
Thuật toán 2.0 tối ưu **độ phủ** (cọ xát 100 % trước hạn − 3 ngày) chứ chưa tối ưu **điểm**. Em và thầy nhìn thấy "Thành thạo 62 %" nhưng không biết 62 % đó là 6,5 điểm hay 8,2 điểm.

**3. Lấy từ đặc tả đúng 5 thứ, Việt hoá và cắm vào chỗ đã có:**

| # | Lấy gì | Cắm vào đâu | Thầy/em thấy gì |
|---|---|---|---|
| A | **"P nắm dạng"** = xác suất liên tục kiểu BKT, có tỉ lệ đoán mò theo phần (Trắc nghiệm 25 % · Đúng–sai 6,25 % · Trả lời ngắn 0 %) và tỉ lệ sơ ý | Hàm thuần mới `p-nam-dang.ts`, phát lại từ `su_kien_hoc` như mọi hồ sơ khác; **không thay** bậc Biết/Hiểu/Vận dụng (CNH-1.0 đã chốt "v1 không dùng Beta/IRT để tăng mức" — giữ) | Thanh "Dạng Ester: 0,82 · 7 câu · 3 ngày" |
| B | **Dự báo điểm theo ma trận đề** = Σ (số câu × điểm × P đúng) trên ô (phần × chuyên đề × mức độ) — chính cấu trúc `OBlueprint` của `de-rieng-blueprint.ts` | Mô-đun `du-bao-diem.ts` + bảng đệm; **hai phạm vi**: điểm ca chốt chiến dịch (dạng của chiến dịch) và điểm thi (ma trận 2026 thầy nhập một lần) | App thầy: cột "Khoảng cách tới 8" từng em; PH: "Con còn 1,2 điểm tới 8, 3 dạng cần vững"; HS: "Còn 3 dạng cần vững để chạm mốc 8" (không hiện điểm thô — xem mục 8) |
| C | **Chọn câu theo "điểm còn lấy được mỗi lượt"** thay Fisher information | Thêm MỘT trọng số vào `lapKeHoachNgay` (`srs2-loi.ts`) cho phần câu mới + nợ; bộ lọc cứng (tự luận, bảo vệ ca, chống lặp, không vượt bậc +1) **giữ nguyên thứ tự** | Thể lực cùng 40 lượt nhưng dồn vào dạng đang kéo điểm xuống nhiều nhất |
| D | **Dạng đã vững** (P ≥ 0,9 + đủ bằng chứng) là điều kiện hoàn thành, không phải "làm hết câu" | Câu mới còn lại của dạng đã vững → "Thử sức thêm (không bắt buộc)" + ôn duy trì FSRS; thể lực tiết kiệm được đổ cho dạng yếu | Thẻ chiến dịch thêm dòng "Dạng vững 5/9" |
| E | **Ba cơ chế giữ chân từ đặc tả**: Trạm hồi phục (3 sai liên tiếp → 3 câu nền, không mất Máu) · Lướt = không bằng chứng (trả lời sai quá nhanh không bị phạt, không tính sai) · Vé thử thách (2 vé/tuần tự mở câu cao hơn một bậc) | Nối vật liệu ĐÃ CÓ: `/hs/luyen-nen` + `cau_nen`, `nguongLuot` của `ca-nhan-hoa-v2.ts`, luật "2 câu chính liên tiếp sai ⇒ hạ 1 bậc" đã có hằng `SAI_LIEN_TIEP_CAN_HO_TRO` nhưng CHƯA NƠI NÀO DÙNG; probe của CNH-1.0 §3.2.3 "phải có người học chọn thử thách" đang thiếu nút | Em sai liền 3 câu không bị "chết", được dìu bằng câu nền rồi đi tiếp |

**4. KHÔNG lấy 4 thứ** (nói thẳng, mục 3): Durable Object cho từng em · kho dữ liệu BigQuery/Snowflake · Python `scipy` EM Baum-Welch · hiệu chuẩn 3PL-IRT đầy đủ. Lý do: không thêm điểm nào cho 266 em mà phá tính "phát lại tất định từ sổ" đang là xương sống của app, hoặc không đủ dữ liệu (1/814 câu có ≥ 30 lượt — `do-kho-cau.ts:13-15`).

**5. "Nghiện học" theo nghĩa lành — thói quen quay lại mỗi ngày — đến từ 3 đòn bẩy app đang THIẾU chứ không phải thêm thưởng** (EXP v5 đã bỏ mọi trần, đã rất rộng tay): (i) **con số của chính em nhúc nhích mỗi ngày** về phía mục tiêu (P dạng, khoảng cách tới 8); (ii) **thất bại không mất gì** (lướt, trạm hồi phục, thử thách sai không sao); (iii) **phiên học đủ ngắn để ≥ 80 % em "xong" được** — 40 lượt/ngày hiện tại ≈ 60–100 phút theo chính công thức `uoc-luong-thoi-gian.ts` (Trắc nghiệm Nhận biết 75 s · Đúng–sai 150–300 s · Trả lời ngắn 120–240 s); đặc tả khuyên 12–15 câu/phiên. Đề nghị **đo trước** (GĐ0) tỉ lệ em đạt kế hoạch ngày; dưới 60 % thì thể lực mặc định phải tính theo **phút của em**, không theo số câu chung.

**6. Lộ trình 7 giai đoạn, mỗi giai đoạn ≤ 1 ngày công, chỉ-thêm, có công tắc `cau_hinh.omni` theo lớp, tắt là về y cũ** (mục 6). GĐ0–GĐ2 không đổi gì em nhìn thấy. Dự báo điểm chỉ hiện cho thầy cho tới khi so với ≥ 3 ca chốt thật và sai số trung bình ≤ 0,6 điểm.

---

## 1. HIỆN TRẠNG — ĐỐI CHIẾU TỪNG MỤC ĐẶC TẢ VỚI MÃ (đọc từ mã, không đoán)

Số liệu nền (Nhật ký `DIEU-PHOI.md` 28/09 và 02/10; `docs/khoi-cau-khong-doc-ra-2109.md`): `hoc_sinh` 266 · kho game 15 359 câu / 268 tờ (lớp 10: 2 802 · lớp 11: 3 047 · lớp 12: 9 510) + 1 912 biến thể, 379 bảng · `su_kien_hoc` 83 284 dòng · `nam_kt_cau` 39 330 · `nam_kt_dang` 14 152. Ba thế hệ máy cùng đọc một sổ: Gen-1 (19/09, Leitner→FSRS) · CNH-1.0 (23/09, **cờ mặc định TẮT** — `hop-dong-chung.ts:75-92`, các pha P07–P11 chưa chạy) · Thuật toán 2.0 (27/09–02/10, **đang chạy toàn trung tâm**).

| Mục đặc tả ALCHEMY | Trong app ĐÃ CÓ | Trạng thái | Khoảng trống thật |
|---|---|---|---|
| **1. Hai kho**: Bank 1 15 k câu micro-tag (CAT) · Bank 2 chọn lọc theo bài giảng (O2O) | Một kho ~15 k câu có chuyên đề/mức độ/sao, mã dạng ở tờ đã lập chỉ mục (`game_v2_question.dang`); **Chiến dịch = câu của đề vừa kiểm tra** (`chien_dich.qid_json`, `srs2-gv.ts`) đóng vai Bank 2; ngân hàng **câu nền** `cau_nen` (`thang-tu-go.ts`, nạp qua `/kho/nen/day`) | ✅ Tương đương, một kho hai vai | Độ phủ `ma_dang` trên kho chưa đo (chính DE-XUAT-CA-NHAN-HOA-1909 §6 tự nhận); số câu nền hiện có chưa biết |
| **2. Durable Object + SQLite, WebSocket Hibernation** | Worker + D1 + R2; DO + WS Hibernation CHỈ ở Bi-a (`bi-a-phong.ts:1`); trạng thái học **không lưu riêng, phát lại tất định từ sổ** (`srs2-loi.ts:1-4`, `ho-so-nam-kt.ts:1-9`); ghi giữa ngày có so bản cũ (hợp đồng Hóa 2.0 mục "Câu không phục vụ được") | ⛔ Khác kiến trúc, cùng mục đích | Không chuyển (mục 3) |
| **3. CQRS + kho dữ liệu đêm** | D1 + `nhat_ky_may` + báo cáo `game-v2-reports.ts`; chế độ cao điểm 20:00–23:59 (`index.ts:3263`) | ⛔ Không cần | Xuất CSV tuần ra R2 nếu thầy muốn phân tích ngoài |
| **4. BKT**: P(L) từng kỹ năng, Dirichlet prior từ Bank 2, EM, ràng buộc 0<G<0,5 · 0<S<0,5 · 1−S≥G | Hạng theo dạng p = (đúng+2)/(gặp+4) — chính là trung bình hậu nghiệm Beta(2,2) — chia L1–L4 tại 0,40/0,65/0,85 (hợp đồng §C); bậc Biết/Hiểu/Vận dụng theo luật 2 đúng liền (`nam_kt_dang.bac`); năng lực theo bằng chứng `validated_level` cần ≥ 5 family · ≥ 2 ngày · ≥ 4/5 recent5 (`nang-luc.ts:1-20` — đã viết mã, cờ `nang_luc_v1` TẮT); FSRS-7/IRT/tự tối ưu trọng số **đã hoãn có chủ ý** (`01-QUYET-DINH-DA-CHOT.md:18-19`); **đoán mò đã được xét định tính**: "thành thạo lần đầu" chỉ cho Đúng–sai, Trả lời ngắn, Trắc nghiệm Nhận biết vì Trắc nghiệm Thông hiểu/Vận dụng đoán trúng ~25 % (`srs2-loi.ts:83-96`); co Bayes 10 lượt ảo (`ca-nhan-hoa-v2.ts:15`) | 🟡 Có định tính, thiếu định lượng | Chưa có **xác suất liên tục** dùng được để **dự báo điểm** và **xếp ưu tiên theo điểm**; CNH-1.0 §3.2 chốt "v1 không dùng Beta/IRT để tăng mức" → P mới chỉ dùng cho dự báo và ưu tiên, **không gác cổng** |
| **5. CAT/3PL-IRT**: Fisher, a-stratified, Sympson-Hetter trần lộ diện 20 %, Elo giai đoạn beta | Sao 0/1/2 thầy gán; độ khó thực nghiệm cận dưới Wilson N1/N2/N3 (`do-kho-cau.ts`, chỉ dùng cho Gọi lên bảng); bậc thang theo hạng (`chiaBacThang`); bộ chọn chung điểm số v1: repairNeed·reviewNeed·transferValue·fit·coverage−fatigue (CNH §7.2, `bo-chon-that.ts` — cờ `ngan_sach_luot` TẮT; kho thật **chưa có nhãn family** nên transferValue = 0, `bo-chon-that.ts:9`); chống lặp theo family (`chong-lap.ts`); câu trùm "chưa ai thấy" (`game-v2-cau-moi.ts`) | 🟡 Có tương đương định tính | Độ khó thực nghiệm chưa vào chọn câu game (THAP-NOI-CAU-SAI §0 ghi "tín hiệu độ khó có sẵn mà game chưa dùng"); chưa có trần lộ diện một câu trên cả lớp; IRT đầy đủ **không khả thi** với mẫu hiện có |
| **6. FSRS-6** 21 tham số, R = 0,9, chống "ease hell" | `ts-fsrs 5.4.2` FSRS-6, `request_retention 0.9`, 1 quan sát/ngày VN, sai thắng đúng trong ngày, lượt có hỗ trợ không đẩy mốc (`lich-on-fsrs.ts:1-15`); `nam_kt_cau.moc_on_ke`; srs2 hẹn 3/7/14, duy trì 14/30, 2 sao 14 (`srs2-loi.ts:67-78`) | ✅ Đủ | Hai lịch ôn song song (FSRS ở `nam_kt_cau` · chuỗi cc ở srs2) — hợp nhất là việc sau; tối ưu tham số FSRS theo em cần ~1 000 lượt/em, chưa tới |
| **7. Phiên nhỏ 12–15 câu, 70 % mới + 30 % ôn, hoàn thành khi μ(P) ≥ 0,9, câu dư → nhỏ giọt 7 ngày** | Chuyến Đảo 6 ải (ải 6 = Trùm); chặng Đoàn 8 hiệp = 6 câu riêng + 2 hiệp trùm trên một câu Đúng–sai chung (`doan-core.ts:10-21`); kế hoạch ngày trần 40 (`TRAN_NGAY`), nợ ≤ 50 % (`TI_LE_TRAN_NO`), câu mới ⌈còn/(D−3)⌉, rải đều; Rương khi xong kế hoạch (+20 vàng); ôn duy trì ≤ 20 % (`TI_LE_DUY_TRI`) | 🟡 Khác triết lý | Hoàn thành theo **độ phủ**, không theo **P**; thiếu "dạng đã vững"; 40 lượt/ngày nặng hơn 12–15 câu/phiên nhiều lần |
| **8. Heal Station**: 3 sai liên tiếp → Serum 0 → dừng câu mới, 5 câu nền Bank 2 | Thang tự gỡ bậc 4 "kiến thức nền 3–5 câu" (`/hs/luyen-nen`, `thang-tu-go.ts:1-12`) nhưng kích hoạt **sau** khi đọc lời giải; đợt dạy lại mở sau 3 lỗi/kỹ năng/7 ngày (`nang-luc.ts:459`, `SO_LOI_MO_DOT = 3`); luật "2 câu chính liên tiếp sai ⇒ hạ 1 bậc phần chưa mở" có hằng `SAI_LIEN_TIEP_CAN_HO_TRO = 2` (`ho-so-cau-hinh.ts:113`) **chưa nơi nào gọi**; đường game CŨ (cờ tắt) từng có "2 sai liên tiếp hạ một bậc" (`than-thu-v2/core.ts:75-89`); game hiện cho xem đáp án + lời giải ngay sau mỗi câu (`game-v2.ts:518`) | 🟡 Có vật liệu, chưa nối vào chuyến | Nối thành **Trạm hồi phục** ngay trong chuyến/chặng |
| **9. Iron Gate** + 2 vé bỏ qua/tuần | Không vượt bậc +1 (bộ chọn chung); L1/L2 nhận dễ trước; câu thử thách "sai không sao"; Thử sức thêm (`hoa2-thu-suc-them`, `srs2-game.ts:327`); probe CNH §3.2.3 đòi "người học chọn thử thách" | 🟡 Có cổng, thiếu vé | **Vé thử thách** chính là nút bấm còn thiếu của probe |
| **10. Sơ ý (slip)**: trả lời sai < 3 s không phạt | Ngưỡng lướt riêng = 35 % tốc độ đọc của em, kẹp [2, 5] s (`ca-nhan-hoa-v2.ts nguongLuot`) — **chỉ cho đọc lời giải**; tín hiệu "sai rất nhanh rồi đúng lại" cho bảng tin thầy đã có, tính từ `giay` ca thi 4 lần/ngày (`sai-nhanh-gv.ts:1-5`); `giay` có ở ca thi (`chi_tiet_cau`, đếm theo giây câu đang hiện — `ExamTakeScreen.tsx:1602-1654`) và Tu luyện (`tu_luyen_cau`), **không ghi ở game**: `/game-v2/answer` nhận `{token, session, qid, answer, assisted}` không có thời lượng, `game-v2.ts:476` gọi `ghiSuKien` không có `giay`; `/hs/on-lai/nop` nhận `giay` nhưng máy em không gửi | ❌ Thiếu | Ghi thời lượng từng câu game; lướt = không bằng chứng |
| **11. Clone đẳng cấu**: script tham số theo `family_id`, phương án nhiễu theo lỗi hay gặp; AI chỉ chạy nền | Câu song sinh 2/câu đổi số liệu, soạn máy + Python kiểm lúc nạp (`cau-bo-tro.ts:1-6`); 1 912 biến thể; luật đóng lỗi **đòi** một lượt song sinh (`loi-hoc-luat.ts:12-13`); AI đã gỡ khỏi màn từ 28/09 | ✅ Có (tĩnh) | Chưa tham số hoá: Trả lời ngắn mới có 2 biến thể/câu |
| **12. O2O**: thầy override P = 1,0 / 0,1 | Kiểm tra đầu giờ Đạt ⇒ thành thạo NGAY kể cả 2 sao (`srs2-loi.ts NGUON_DAU_GIO`); Lên bảng Đạt/Không đạt → sổ `len_bang`; "Chữa xong" ⇒ đếm sai về 0 (`srs2_day_lai`) | ✅ Có theo **câu** | Thiếu xác nhận theo **dạng** một chạm trên Bảng chiến dịch |
| **13. Swarm prediction**: 80 % lớp xong → khởi tạo prior cho 20 % còn lại | Không có; nhưng ca kiểm tra mở màn chiến dịch cho prior theo lớp (N1 `do-kho-cau.ts`) | ❌ Thiếu (nhỏ) | Prior lớp theo dạng, 1 truy vấn |
| **14. Kiểu dữ liệu sự kiện chặt** (`qid, user_id, result, response_time_ms, used_boosters`) | `su_kien_hoc` (sbd, qid, nguon, ket_qua 1/0/NULL, giay, luc, ngay_vn, ma_dang, chuyen_de, muc_do) + cột CNH `attempt_id`, `assistance`, `visibility`, `correction_of`, `purpose`, `raw_json`, `subitem_json` (kết quả **từng ý** Phần II), `received_at` (`migration-2309-cnh1-su-kien-chuan.sql`) | ✅ Có | Thêm `mili_giay` và cờ `luot` (chỉ-thêm) |

**Kết luận mục 1**: khoảng trống thật nằm ở 5 ô đỏ/vàng: xác suất liên tục (4), dự báo điểm (4), hoàn thành theo P (7), nối Trạm hồi phục + lướt + vé (8–10), prior lớp (13). Phần còn lại đã có và tốt hơn đặc tả ở chỗ **tất định, phát lại được, có test**.

---

## 2. NĂM THỨ NÊN LẤY — CHI TIẾT

### 2.1 (A) "P nắm dạng" — BKT rút gọn, Việt hoá, phát lại từ sổ

**Khoá**: `(sbd, ma_dang)`; dạng không có mã ⇒ `CD:<chuyên đề>` như `nam_kt_dang` đang làm.

**Quan sát** = một lượt **tự làm** (`assistance ∈ {none, rỗng}`, không phải sự kiện đọc lời giải, không `luot` — xem 2.5), **lần độc lập đầu tiên** của mỗi câu trong mỗi ngày VN (đúng luật §3.1 CNH-1.0: làm lại cùng ngày không đổi một lần sai thành đúng). Bỏ trống = không quan sát. Lượt có Bùa Trợ giảng (gợi ý M3, máy chủ gắn `assisted`) = không quan sát (khớp "đúng nhờ gợi ý không tính thành thạo").

**Ba tham số, lấy đúng ràng buộc chống suy biến của đặc tả** (0 < G < 0,5 · 0 < S < 0,5 · 1 − S ≥ G):

| Tham số | Giá trị khởi đầu | Ghi chú |
|---|---|---|
| Đoán mò G | Trắc nghiệm **0,25** · Đúng–sai (đủ 4 ý) **0,0625** · Trả lời ngắn **0,01** (đặc tả 0,00; dùng 0,01 để không chia cho 0) | Khớp hoàn toàn với `laCauKhoDoanMo` đang có |
| Sơ ý S | **0,10** | Hiệu chỉnh tuần: tỉ lệ sai của em đang có P ≥ 0,9 ở dạng đó |
| Học sau một lượt T | **0,15** | Hiệu chỉnh tuần theo dạng; kẹp [0,05; 0,35] |

**Cập nhật** (đúng hai công thức của đặc tả, rồi cộng bước học):

```
đúng:  P' = P(1−S) / (P(1−S) + (1−P)·G)
sai:   P' = P·S     / (P·S     + (1−P)(1−G))
sau đó P'' = P' + (1−P')·T
```

Ví dụ P = 0,50: Trắc nghiệm đúng → 0,78 → 0,82; sai → 0,12 → 0,25. Đúng–sai đủ 4 ý đúng → 0,94 → 0,95 — **một câu Đúng–sai đủ 4 ý gần như chứng minh em biết**, đúng điều srs2 đã chốt bằng luật "thành thạo lần đầu".

**Khởi tạo (prior)** theo thứ tự có gì dùng nấy: (1) câu của dạng trong **ca kiểm tra mở màn chiến dịch** của chính em → P0 = (đúng + 1)/(gặp + 2); (2) không có ⇒ **prior lớp** = trung bình P của các em cùng lớp ở dạng đó (đây là "swarm prediction" của đặc tả, 1 truy vấn); (3) không có ⇒ 0,30. Luôn kèm cỡ mẫu.

**Quên**: BKT không có quên. Dùng cái đã có: P hiển thị = P × R̄, với R̄ = độ nhớ FSRS trung bình của các câu em đã học trong dạng (ts-fsrs `get_retrievability`). Em bỏ dạng 3 tuần thì P tự tụt theo đường quên, không phải bịa thêm tham số. (Giả định — mục 7.)

**Thầy xác nhận theo dạng** (O2O override của đặc tả): Bảng chiến dịch lưới em × dạng (`BangChienDich.tsx`) thêm hai nút trên từng ô: "Thầy xác nhận em đã vững" ⇒ P = 0,95 + đủ bằng chứng; "Chưa đạt, dạy lại" ⇒ P = 0,10 + mở đợt dạy lại (`needs_teaching`). Ghi sổ `su_kien_hoc` nguồn `thay_xac_nhan` để phát lại được — không đụng bảng P trực tiếp.

**Chữ hiển thị**: "Dạng Thuỷ phân ester: **0,82** · 7 câu tự làm · 3 ngày" — con số luôn kèm cỡ mẫu (luật vàng `do-kho-cau.ts`). Không chữ "nắm chắc".

**Mã**: `server/src/p-nam-dang.ts` (hàm thuần, test phát lại 2 lần ra cùng số), bảng đệm chỉ-thêm `omni_p_dang (sbd, ma_dang, p, n_tu_lam, n_ngay, p_truoc_quen, phien_ban, cap_nhat_luc)`, tham số ở `cau_hinh` khoá `omni_tham_so` do `tu-hoan-thien.ts` chỉnh hằng tuần (đã có cron, đã có bảng `v2_hieu_chinh` để ghi nhật ký).

### 2.2 (B) Dự báo điểm theo ma trận — cây cầu từ P tới "8+"

**Cấu trúc đề 2025+** (đúng luật chấm app đang dùng, `diemDungSai` `src/lib/tu-luyen.ts:97`): Phần I 18 câu × 0,25 = 4,5 · Phần II 4 câu, mỗi câu 4 ý: 1/2/3/4 ý đúng = 0,1/0,25/0,5/1,0 → tối đa 4,0 · Phần III 6 câu × 0,25 = 1,5. Tổng 10.

**Ô ma trận** = (phần × chuyên đề × mức độ) — dùng lại đúng `OBlueprint` của `de-rieng-blueprint.ts`. Hai phạm vi:
- **Điểm ca chốt chiến dịch**: ô = phân bố câu của chính chiến dịch (có sẵn trong `qid_json` + meta).
- **Điểm thi**: ma trận 2026 thầy nhập một lần ở Cài đặt (`cau_hinh.ma_tran_thi_2026`, JSON `[{phan, chuyenDe, mucDo, soCau}]`); mặc định 18/4/6 chia theo chuyên đề theo tỉ lệ kho.

**Công thức** (mỗi ô, P = P nắm dạng gộp theo trọng số câu trong ô):

```
P đúng   = P(1−S) + (1−P)·G
Phần I   : điểm kỳ vọng = số câu × 0,25 × P đúng
Phần II  : điểm kỳ vọng = số câu × [P đúng × 1,0 + (1 − P đúng) × 0,25]   // 0,25 = điểm dở dang trung bình, hiệu chỉnh từ `so_y_dung` (ca thi) và `subitem_json` (sổ) thật
Phần III : điểm kỳ vọng = số câu × 0,25 × P đúng
Sai số ± = √Σ (số câu × điểm câu² × P đúng (1 − P đúng))    // độ lệch chuẩn tổng Bernoulli — hiện kèm con số
```

**Ví dụ minh hoạ** (số giả định, không phải dữ liệu thật): em có P đúng Phần I 0,80 · Phần II 0,50 · Phần III 0,50 → 3,60 + 2,50 + 0,75 = **6,85**. Để chạm 8: Phần I 0,90 → 4,05 · Phần II 0,70 → 3,10 · Phần III 0,60 → 0,90 = **8,05**. Bài học hiện ra ngay bằng số: **4 điểm Phần II là chỗ quyết định 8+**, và Phần II gần như không đoán mò được — đúng chỗ P nắm dạng nhạy nhất.

**"Khoảng cách tới 8"** = 8,0 − điểm kỳ vọng. **Điểm còn lấy được của dạng d** = Σ các ô chứa d: số câu × điểm câu × (1 − P đúng) × phần của d trong ô. Xếp giảm dần → đây là **thứ tự ưu tiên dạng** của chiến dịch cho từng em; dạng có P < 0,2 và đã mở đợt dạy lại → sang "Cần thầy dạy lại" (đường đã có), không ép tự luyện.

**Sức chứa theo điểm** (nâng `khoiLuongCan` đang ước cố định 2 lượt/câu, `srs2-loi.ts`): số lượt để dạng d từ P lên 0,9 ≈ ⌈ln((1−0,9)/(1−P)) / ln(1 − T·p̂)⌉ với p̂ = tỉ lệ đúng dự kiến; ví dụ từ 0,30 lên 0,90 với T = 0,15, p̂ = 0,75 ≈ 20 lượt; lên 0,8 ≈ 13 lượt. Đồng hồ sức chứa khi giao chiến dịch (`DongHoSucChua.tsx`) thêm dòng: **"Với 7 ngày × 40 lượt: 31/44 em đủ lượt để dự báo ca chốt ≥ 8; em trung vị cần 9 ngày"** — kèm hai gợi ý đã có (rút câu / lùi hạn). Đây là câu trả lời trực tiếp cho "đạt 8+ trong thời gian của mỗi chiến dịch": biết **trước khi giao**, không phải sau khi hết hạn.

**Hiệu chuẩn bắt buộc trước khi cho em thấy**: so dự báo với điểm **ca chốt thật** (đường "Mở ca chốt" đã có). Điều kiện mở cho PH/HS: ≥ 3 ca chốt, sai số tuyệt đối trung bình ≤ 0,6 điểm, không thiên lệch > 0,3. Tới lúc đó chỉ thầy thấy, nhãn "đang hiệu chỉnh (N ca chốt)".

**Mã**: `server/src/du-bao-diem.ts` (thuần + test), bảng đệm `omni_du_bao (sbd, pham_vi, diem_kv, sai_so, theo_dang_json, so_cau_bang_chung, luc)`; lệnh `/gv/omni/du-bao {lop|chienDichId}` và `/ph/omni/tien-do`; cột mới trên `BangChienDich.tsx` và `DsChienDichDaGiao.tsx`.

### 2.3 (C) Chọn câu theo "điểm còn lấy được mỗi lượt" — thay Fisher information bằng thứ đo được

Fisher information của IRT cực đại khi θ ≈ b (câu "vừa sức"). Bản BKT tương đương: **độ tăng P kỳ vọng sau một lượt** = p̂·ΔP(đúng) + (1 − p̂)·ΔP(sai), lớn nhất quanh P ≈ 0,5 và gần 0 khi P ≈ 0 hay ≈ 1 — cùng hình chuông, nhưng tính được từ 3 tham số, không cần hiệu chuẩn 9 000 câu.

**Trọng số câu c thuộc dạng d** = `điểm còn lấy được(d)` × `độ tăng P kỳ vọng(d)` × `fit mức độ` (giữ bảng fit 1 / 0,8 / 0,6 / probe 0,5 của CNH §7.2). Cắm vào **đúng một chỗ**: hàm xếp câu mới `xepCauMoi` và hàng nợ `trongSoOn` của `srs2-loi.ts` nhận thêm `trongSoDang?: Record<ma_dang, number>` (vắng ⇒ y cũ). **Mọi bộ lọc cứng giữ nguyên thứ tự** (CNH §7.1: tự luận → bảo vệ ca → chống lặp → không vượt bậc +1 → ...). Quota câu mới/ngày, rải đều, trần nợ, D − 3 **không đổi** — chỉ đổi câu nào đứng trước trong cùng quota.

**Trần lộ diện** (Sympson–Hetter rút gọn): bảng đếm `omni_lo_dien (qid, ngay_vn, so_em)`; câu **ngoài lõi chiến dịch** (Thử sức thêm, vé thử thách, câu nền, Tu luyện) không ra cho quá 20 % em của lớp trong ngày khi còn câu cùng dạng/mức thay thế. Câu lõi chiến dịch cả lớp cùng làm theo thiết kế — miễn.

**Độ khó thực nghiệm vào game**: `do-kho-cau.ts` (Wilson) đã có — chuyển phần tính thuần sang máy chủ, ghi `omni_do_kho (qid, so_luot, so_dung, can_duoi)` cập nhật đêm; dùng để **xếp trong cùng mức độ** (câu Vận dụng có cận dưới 0,9 đứng sau câu 0,6 với em L1/L2) và để **soát nhãn mức độ** cho thầy ("câu Nhận biết nhưng 70 % lớp sai"). Đây là Elo-lite "giai đoạn beta" của đặc tả, không hơn.

### 2.4 (D) "Dạng đã vững" — hoàn thành theo mức nắm, không theo số câu đã làm

**Định nghĩa duy nhất** (một chỗ `ho-so-cau-hinh.ts`): dạng d của em **đã vững** khi `P ≥ 0,90` **và** ≥ 4 câu tự làm khác `content_group` **và** bằng chứng ở ≥ 2 ngày VN **và** không đợt dạy lại đang mở ở d hoặc kiến thức nền của d. Bốn điều kiện sau lấy nguyên từ luật xác nhận mức của `nang-luc.ts` (cùng tinh thần cổng cũ của game: 5 lượt tự làm, ≥ 4 đúng, ≥ 2 phiên — `than-thu-v2/core.ts:75-89`) — không đặt luật thứ hai. Vì cờ `nang_luc_v1` đang tắt, luật này **tính ngay trong `p-nam-dang.ts`**, không phụ thuộc bật CNH-1.0.

**Hệ quả trong chiến dịch** (đổi một luật đã chốt — xin thầy quyết ở mục 8): câu **mới** còn lại của dạng đã vững **không còn bắt buộc** cọ xát trước D − 3; chúng chuyển sang "Thử sức thêm (không bắt buộc)" và vào ôn duy trì FSRS (đúng "câu dư → nhỏ giọt" của đặc tả). Thể lực tiết kiệm được đổ cho dạng chưa vững theo 2.3. Câu **ôn** (câu từng sai) **không** được miễn — luật đóng lỗi `loi-hoc-luat.ts` giữ nguyên.

**Em thấy**: thẻ chiến dịch thêm "Dạng vững 5/9" cạnh "Cọ xát/Thành thạo"; mỗi dạng một thanh P kèm cỡ mẫu; khi một dạng vừa vững: thẻ mừng nhỏ + EXP lên bậc đã có (`EXP_LEN_BAC = 6`), không thêm loại thưởng mới (giữ chốt 21/09).

**Thầy thấy**: lưới em × dạng tô theo P (thay tô theo thành thạo câu), lọc "dạng chưa vững ở ≥ 50 % em" → đưa thẳng vào Buổi chữa (`BuoiChua.tsx`) — điểm chữa của câu cộng thêm `điểm còn lấy được` của dạng.

### 2.5 (E) Ba cơ chế giữ chân — nối vật liệu đã có

**E1 · Trạm hồi phục** (Heal Station).
- Kích hoạt: trong một chuyến Đảo hoặc chặng Đoàn **chơi một mình**, **3 câu sai liên tiếp** tự làm (không lướt, không gợi ý). Tối đa 1 trạm/chuyến. Đoàn nhiều người **không** có trạm: đồng hồ hiệp chung, và đòn sai đã được che thành Chắn cho đồng đội (`doan-core.ts:36-39`).
- Làm gì: tạm dừng ải kế; phục vụ **3 câu nền** theo nhãn nền của 3 câu vừa sai (`cau_bo_tro.nhan_nen` → `cau_nen` mức 1, đường `/hs/luyen-nen` đã có); không trừ Máu, không đếm vào đếm sai/cắt tỉa, ghi sổ nguồn `nen` (đã có); EXP 1/câu nền (giả định). Dạng không có nhãn nền ⇒ dùng câu song sinh dễ hơn hoặc câu cùng dạng mức Nhận biết.
- Sau trạm: ải kế lấy câu **thấp hơn một bậc** — chính luật `SAI_LIEN_TIEP_CAN_HO_TRO` của CNH §3.3 đang bỏ không; 3 lỗi đó vẫn vào đợt dạy lại theo `nang-luc.ts` (không giấu thầy).
- Chữ: "Thần thú đưa em về trạm hồi phục · 3 câu nền, không mất Máu" (thần thú nói, không doạ).

**E2 · Lướt = không bằng chứng** (slip).
- Đo thời lượng: máy chủ **không đo được từng ải** vì 6 câu của chuyến phát một lần ở `start`; cách nhỏ nhất là máy em gửi thêm `msLam` trong thân `/game-v2/answer` (hiện `{token, session, qid, answer, assisted}`), máy chủ kẹp [0, 900 s] rồi ghi `su_kien_hoc.mili_giay` (cột chỉ-thêm). Vì số này do máy em đo nên **chỉ dùng để THA, không bao giờ dùng để PHẠT** hay cộng thưởng.
- Trả lời **sai** với mili_giay < ngưỡng riêng = max(3 s, 10 % trung vị giây/câu của em cho phần đó, kẹp [3, 8] s) ⇒ cờ `luot`: không trừ Máu, **không tính sai, không tính đúng** (đúng cách app đang xử lượt có hỗ trợ — `loi-hoc-luat.ts:9`), không vào Trạm hồi phục/cắt tỉa, câu quay lại ngày mai như câu chưa làm. Cùng định nghĩa "sai nhanh" với `src/lib/tin-hieu-sai-nhanh.ts` để thầy và máy nói một thứ.
- Chống lách: tối đa 3 lượt lướt/ngày; từ lượt thứ 4 tính sai bình thường. Trả lời **đúng** nhanh vẫn là đúng. Số lượt lướt/em hiện trên bảng thầy.

**E3 · Vé thử thách** (bypass token).
- 2 vé/tuần, cấp 00:01 thứ Hai (cron `tu-hoan-thien` đã chạy giờ đó), không cộng dồn. Ở Sảnh: "Dùng vé thử thách: 3 câu cao hơn một bậc ở dạng <X>" (chỉ dạng chưa vững; em chọn dạng).
- Chính là **probe** của CNH §3.2.3 ("tối đa một probe/kỹ năng/ngày và phải có người học chọn thử thách") — nay có nút. Đúng ⇒ `working_level + 1` buổi sau (luật đã viết); sai ⇒ **không hạ bậc, không mất đạt ngày** (đúng §3.2.4), không trừ Máu, không đứt chuỗi. EXP câu thử thách giữ đủ `EXP_CAU`.
- Rào đã chốt phải giữ (Boss 21/09, `DIEU-PHOI.md:403`: "khiên không được đụng dữ liệu học"): vé **chỉ mở cửa**, không sửa sự thật — lượt sai vẫn ghi sổ như mọi lượt, câu sai vẫn vào lịch ôn FSRS/đóng lỗi như thường; thứ được miễn chỉ là hậu quả **trong game** (Máu, chuỗi) và việc hạ bậc.
- Không đụng "Thử sức thêm" (câu mới của ngày mai) — hai việc khác nhau, hai chữ khác nhau.

### 2.6 Hai thứ lấy thêm, cỡ nhỏ

- **Prior lớp theo dạng** (swarm): mỗi sáng, P0 cho em chưa có dữ liệu ở dạng d = trung bình P của lớp ở d (≥ 5 em có dữ liệu); kèm chữ "ước theo lớp, chưa đo em".
- **Song sinh tham số** cho Trả lời ngắn: `cau_bo_tro.script_json` cho ≤ 10 family hay sai nhất (hiệu suất, nồng độ, tỉ khối, pH, bảo toàn…): script sinh (đề, đáp án, nhiễu) từ bộ số nguyên "đẹp", soạn **nền** bằng máy + Python kiểm như GĐ1 của v2 đã làm — AI không chạy lúc em làm bài (đặc tả và app cùng chốt). Mỗi lần câu ra lại ⇒ biến thể mới ⇒ hết học vẹt đáp án.

---

## 3. BỐN THỨ KHÔNG LẤY — VÀ VÌ SAO

| Đặc tả đề xuất | Không lấy vì | Thay bằng |
|---|---|---|
| **Durable Object + SQLite riêng từng em** | 266 DO, mỗi DO một cold start; mất tính **phát lại tất định từ sổ** (xoá đệm dựng lại y hệt — đang là tiêu chí nghiệm thu số 3 của Game Hóa 2.0); D1 đã chịu 300 em nộp đồng loạt 0 lỗi (Nhật ký 01/10). Race condition ở app đã giải bằng khoá sự kiện idempotent + so bản cũ khi ghi | Giữ D1. DO chỉ nơi cần thời gian thực đa người (Bi-a đã dùng; "Thi đua hôm nay" nếu muốn) |
| **CQRS + BigQuery/Snowflake** | Tốn tiền, không ai bảo trì, 83 k dòng sổ D1 truy vấn trong mili-giây | Xuất CSV tuần ra R2 + bản tin thầy đã có |
| **Python `scipy` EM Baum-Welch, `trust-constr`** | Không có runtime Python ở Worker; EM với 3 tham số × ~100 dạng không cần | Đếm có co Bayes (cách `ca-nhan-hoa-v2.ts` đang làm), hiệu chỉnh tuần trong `tu-hoan-thien.ts`, kẹp đúng ràng buộc đặc tả. Khi ≥ 10 k quan sát/dạng: script Node offline trong `scripts/` |
| **3PL-IRT hiệu chuẩn a, b, c từng câu** | Cần ~200+ lượt/câu; kho có 1/814 câu ≥ 30 lượt (`do-kho-cau.ts:13-15`) | Sao thầy + độ khó Wilson + độ tăng P kỳ vọng (2.3) |

Hai điều nữa: "Bank 1 / Bank 2" **không tách kho** — chiến dịch (theo buổi học) và câu nền đã là Bank 2; kho rộng là Bank 1. Và **không tạo loại thưởng mới** ("Serum" = Máu đã có; "vé" là quyền, không phải tiền).

---

## 4. KIẾN TRÚC SAU KHI GHÉP — MỘT CHIỀU, MỘT HÀM MỤC TIÊU

```
7 nguồn (ca thi · Đảo · Đoàn · Bi-a · Lên bảng · Đầu giờ · câu nền · [mới] thầy xác nhận dạng)
        │ ghiSuKien()  [+ mili_giay, cờ luot]
        ▼
su_kien_hoc  ─────────── phát lại tất định ───────────────────────────────┐
   │              │                 │                    │                 │
   ▼              ▼                 ▼                    ▼                 ▼
FSRS lịch nhớ   srs2 trạng thái   nang-luc bậc      [MỚI] P nắm dạng   [MỚI] độ khó Wilson
(nam_kt_cau)    câu (cc, nợ)      validated_level   (omni_p_dang)      (omni_do_kho)
                                                         │
                                                         ▼
                                          [MỚI] du-bao-diem (ma trận → điểm kỳ vọng ± sai số,
                                                 điểm còn lấy được theo dạng, dạng đã vững)
                                                         │ trọng số dạng
                                                         ▼
                   lapKeHoachNgay (srs2-loi) — bộ lọc cứng y cũ, quota y cũ, thêm trọng số
                                                         │
                       ┌─────────────┬───────────────────┼──────────────────┐
                       ▼             ▼                   ▼                  ▼
                 Bát Linh Đảo    Đoàn Hộ Tống      Bảng chiến dịch     App PH
              [+Trạm hồi phục] [+Trạm hồi phục]  [+Khoảng cách tới 8  [+còn X điểm,
              [+lướt] [+vé]    [+lướt]            +xác nhận dạng]      N dạng cần vững]
```

Bốn bất biến giữ nguyên: **tất định** (không `Math.random`, không đọc đồng hồ trong hàm thuần) · **phát lại được** (xoá mọi bảng `omni_*` dựng lại y hệt — test) · **chỉ-thêm** (không DROP, không đổi cột cũ) · **đáp án không xuống máy em trước khi nộp**. Công tắc `cau_hinh.omni` theo lớp/em như `game_hoa_2`; tắt ⇒ `trongSoDang` vắng ⇒ `lapKeHoachNgay` ra y hệt hôm nay (có test "cùng đầu vào cùng JSON").

---

## 5. "NGHIỆN HỌC" LÀNH — BẢY ĐÒN BẨY, CÁI NÀO ĐÃ CÓ, CÁI NÀO THÊM

| Đòn bẩy | Đã có | Thêm theo đề xuất này |
|---|---|---|
| 1. Con số của **chính em** nhúc nhích mỗi ngày về phía mục tiêu | Cọ xát %, Thành thạo %, EXP, cấp thần thú | Thanh P từng dạng; "Dạng vững 5/9"; "còn N dạng để chạm 8" |
| 2. Mục tiêu gần, nhìn thấy đích | Hạn nộp, Rương khi xong kế hoạch | Khoảng cách tới 8 thu hẹp theo ngày (thầy/PH); đích "dạng vững" cho em |
| 3. Thất bại **không mất gì** | Câu thử thách sai không sao; đòn sai trong Đoàn che thành Chắn; Bùa Trợ giảng sau 2 lần sai. (Khiên hiện **chỉ là hiệu ứng 10 giây**, chưa có tác dụng cơ chế — `game-v2.ts:336-360`, `SO-VIEC-GIAO-DIEN.md:218`; "Khiên giữ chuỗi ngày" mới là đề xuất) | Lướt không phạt · Trạm hồi phục không mất Máu · vé sai không mất gì |
| 4. Quyền chủ động | Thử sức thêm; chọn thần thú; shop | Vé thử thách (em chọn dạng) |
| 5. Thưởng biến thiên | Rương Bát Linh, mảnh, vàng | Không thêm — đủ rồi |
| 6. Xã hội | Đoàn Hộ Tống cả lớp, tiếp sức | Không thêm |
| 7. **Phiên đủ ngắn để kết thúc được** | Rương khi xong kế hoạch; "Hôm nay em xong rồi" | **Đo GĐ0**: % em đạt kế hoạch ngày; nếu < 60 % ⇒ thể lực mặc định = phút/ngày của em ÷ giây/câu riêng (`uoc-luong-thoi-gian.ts` đã có công thức), chia 2 phiên nhỏ sáng/tối, mỗi phiên kết bằng thẻ "hôm nay em tiến thêm gì" |

Ba rào giữ nguyên từ `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` A1.7 và DE-XUAT-BO-NAO §5: không so em với em, không nhãn năng lực, không doạ; chỉ hứa điều chắc chắn xảy ra. Vì thế **điểm dự báo thô không hiện trên màn em** (xem mục 8, điều 2).

---

## 6. LỘ TRÌNH — 7 GIAI ĐOẠN, MỖI GIAI ĐOẠN ≤ 1 NGÀY CÔNG, PHÁT HÀNH RIÊNG

| GĐ | Việc | Test mới | Em thấy đổi? |
|---|---|---|---|
| **0 Đo** (chỉ đọc) | Độ phủ `ma_dang` trên kho và trên chiến dịch đang chạy · phân bố câu/ngày/em 14 ngày và % đạt kế hoạch (Rương mở / kế hoạch chốt) · trung vị giây/câu từ ca thi · % chuyến bỏ giữa đường · số lần 3 sai liên tiếp/chuyến · số ca chốt đã có | — | Không |
| **1 P + dự báo** | `p-nam-dang.ts`, `du-bao-diem.ts` (thuần) + 2 bảng đệm + cron đêm + `cau_hinh.ma_tran_thi_2026` (màn Cài đặt nhập ma trận) + lệnh `/gv/omni/du-bao` | phát lại 2 lần cùng số · ràng buộc G/S/T · ví dụ 6,85 → 8,05 ở mục 2.2 · ma trận thiếu ô ⇒ báo thiếu, không bịa | Không (thầy thấy cột mới, nhãn "đang hiệu chỉnh") |
| **2 Thầy + PH** | Cột "Khoảng cách tới 8" ở `BangChienDich.tsx`/`DsChienDichDaGiao.tsx`; nút xác nhận dạng (ghi sổ nguồn `thay_xac_nhan`); đồng hồ sức chứa thêm dòng "N/M em đủ lượt để ≥ 8"; `/ph/omni/tien-do` | nút ghi đúng sổ · sức chứa theo P · PH chỉ đọc | PH thấy dòng mới (sau khi hiệu chuẩn) |
| **3 Kế hoạch theo điểm** | `trongSoDang` vào `xepCauMoi`/`trongSoOn`; **Dạng đã vững** (định nghĩa một chỗ) ⇒ câu mới dư thành Thử sức thêm + duy trì; `omni_lo_dien` trần 20 %; `omni_do_kho` đêm | vắng trọng số ⇒ JSON y cũ · quota/rải đều/trần nợ không đổi · dạng vững không miễn câu ôn · trần lộ diện | Thẻ chiến dịch thêm "Dạng vững a/b"; thứ tự câu đổi |
| **4 Game** | `mili_giay` máy chủ + cờ `luot` (≤ 3/ngày) · Trạm hồi phục (3 sai liên tiếp → 3 câu nền, hạ 1 bậc) · Vé thử thách 2/tuần = probe | lướt không tính đúng/sai · lượt 4 tính sai · trạm ≤ 1/chuyến, không trừ Máu, vẫn mở đợt dạy lại · vé reset thứ Hai | Có — ba thứ mới trong Đảo/Đoàn/Sảnh |
| **5 Hiệu chỉnh + song sinh** | `tu-hoan-thien.ts` thêm: S, T theo dạng; so dự báo với ca chốt (MAE, thiên lệch) ghi `v2_hieu_chinh`; script tham số cho ≤ 10 family Trả lời ngắn | kẹp ràng buộc · không chỉnh khi < 30 quan sát · biến thể sinh ra đáp án đúng theo Python kiểm | Câu Trả lời ngắn ra số mới mỗi lần |
| **6 Chạy thử** | 1 lớp, 1 chiến dịch 7 ngày + ca chốt; đối chiếu dự báo; mở cho PH/HS khi đạt ngưỡng 2.2 | — | Lớp thử |

GĐ0–2 **không đổi một hành vi nào em nhìn thấy**. GĐ3 đổi thứ tự câu (cùng số lượt). GĐ4 mới thêm cơ chế trong game. Mỗi GĐ: `npx vitest run tests/<tệp>`, tsc, không tên test đỏ mới so nền, một dòng Nhật ký `DIEU-PHOI.md`.

**Nghiệm thu đo được** (cuối GĐ6): (1) xoá `omni_*` dựng lại khớp 100 %; (2) công tắc tắt ⇒ toàn vitest không thêm tên đỏ; (3) dự báo vs ca chốt: MAE ≤ 0,6, thiên lệch ≤ 0,3 trên ≥ 3 ca; (4) % em ≥ 8 ở ca chốt của lớp thử so với chiến dịch trước của chính lớp đó (số thật, không hứa trước); (5) % chuyến bỏ giữa đường giảm so GĐ0; (6) trung vị chuỗi ngày của lớp thử không giảm.

---

## 7. GIẢ ĐỊNH ĐÃ DÙNG (thầy sửa nếu sai)

1. G = 0,25 / 0,0625 / 0,01 theo phần; S = 0,10; T = 0,15 khởi đầu; hiệu chỉnh tuần, kẹp theo ràng buộc đặc tả.
2. P hiển thị = P × độ nhớ FSRS trung bình của dạng (quên theo FSRS, không thêm tham số).
3. Điểm dở dang trung bình Phần II khi không đủ 4 ý = 0,25 cho tới khi đo được từ `so_y_dung`.
4. Dạng đã vững = P ≥ 0,90 + 4 điều kiện bằng chứng của `nang-luc.ts`.
5. Ngưỡng lướt khi trả lời = max(3 s, 10 % trung vị riêng theo phần), kẹp [3, 8] s; ≤ 3 lượt/ngày; thời lượng do máy em gửi (`msLam`), chỉ dùng để tha.
6. Trạm hồi phục: 3 sai liên tiếp, 3 câu nền, ≤ 1 trạm/chuyến, EXP 1/câu nền, không trừ Máu.
7. Vé thử thách: 2/tuần, 3 câu cao hơn một bậc, không cộng dồn.
8. Dự báo chỉ hiện thầy tới khi ≥ 3 ca chốt và MAE ≤ 0,6.
9. Trần lộ diện 20 % chỉ áp câu ngoài lõi chiến dịch.
10. Ma trận thi 2026 mặc định 18/4/6, chia chuyên đề theo tỉ lệ kho; thầy sửa ở Cài đặt.

---

## 8. VIỆC THẦY CẦN CHỐT (mỗi dòng một câu trả lời)

| # | Câu hỏi | Đề nghị |
|---|---|---|
| 1 | Làm **dự báo điểm theo ma trận** (2.2) làm trục chính của mọi ưu tiên — thay độ phủ 100 %? | **CÓ** |
| 2 | Em có được thấy **điểm dự báo thô** ("7,2 ± 0,6") không, hay chỉ "còn N dạng cần vững để chạm 8"? (A1.7: không nhãn năng lực) | **Chỉ thầy + PH thấy điểm; em thấy dạng** |
| 3 | **Dạng đã vững** ⇒ câu mới dư của dạng đó không còn bắt buộc cọ xát trước D − 3 (đổi luật 27/09)? | **CÓ** |
| 4 | **Lướt** (sai quá nhanh) không tính sai, không trừ Máu, ≤ 3 lượt/ngày? | **CÓ** |
| 5 | **Trạm hồi phục** 3 sai liên tiếp → 3 câu nền, không trừ Máu, hạ 1 bậc ải kế? | **CÓ** |
| 6 | **Vé thử thách** 2/tuần, sai không mất gì? | **CÓ** |
| 7 | Thầy nhận **nút xác nhận dạng** trên Bảng chiến dịch (ghi sổ, phát lại được)? | **CÓ** |
| 8 | Nếu GĐ0 đo được **< 60 % em đạt kế hoạch ngày**: thể lực mặc định đổi sang **phút/ngày của em** (20 phút, chia 2 phiên) thay 40 lượt chung? | **CÓ, có điều kiện đo** |
| 9 | Giữ D1, **không** chuyển Durable Object; **không** BigQuery; **không** Python EM; **không** IRT đầy đủ? | **ĐÚNG** |
| 10 | Song sinh tham số cho ≤ 10 family Trả lời ngắn hay sai nhất (soạn nền, Python kiểm)? | **CÓ, GĐ5** |

---

## 9. RỦI RO VÀ ĐIỂM YẾU TỰ NHẬN

- **Độ phủ mã dạng** quyết định tất cả: dạng không có mã rơi về chuyên đề ⇒ P thô hơn, dự báo rộng hơn. GĐ0 đo trước; thấp ⇒ ưu tiên gắn mã dạng cho câu của chiến dịch đang chạy trước khi làm GĐ3.
- **Dự báo sai trong vài tuần đầu** là chắc chắn — vì thế chỉ thầy thấy, kèm số ca chốt đã so. Hứa sớm với PH là mất tin.
- **Hai lịch ôn song song** (FSRS `nam_kt_cau` · chuỗi cc srs2) vẫn chưa hợp nhất; đề xuất này không đụng để không mở rộng bề mặt lỗi. Việc riêng sau.
- **Lướt** có thể bị lách (sai nhanh để tránh phạt; thời lượng lại do máy em đo) — vì thế chỉ dùng để tha, trần 3 lượt/ngày, số lượt lướt/em hiện trên bảng thầy; muốn đo từ máy chủ phải thêm một lệnh "mở ải" mỗi câu — chưa đáng ở giờ cao điểm.
- **Khiên chưa có tác dụng cơ chế** (chỉ hiệu ứng) — đề xuất này không đụng khiên; nếu thầy muốn khiên "có nghĩa", đường đã duyệt là "Khiên giữ chuỗi ngày" (không đụng bậc/EXP/điểm), làm riêng.
- **Trạm hồi phục** cần câu nền có nhãn khớp dạng; kho câu nền hiện nạp tay — có thể trống ở nhiều dạng; dự phòng là câu song sinh/câu Nhận biết cùng dạng, và nói thật "chưa có câu nền cho dạng này".
- **Thêm trọng số vào kế hoạch** đổi thứ tự câu em thấy ⇒ vài em quen thứ tự cũ sẽ hỏi; trả lời bằng đúng chữ: "Thầy Đỗ Đại Học chọn câu đang kéo điểm em lên nhiều nhất".
- Mô hình **không giảm được quá tải thật** nếu thầy giao 150 câu hạn 5 ngày — nó chỉ nói sớm hơn và chính xác hơn "N em không kịp để ≥ 8".
