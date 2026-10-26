# Đề xuất: phân câu cho học sinh theo kiểu Duolingo — 26/10/2026

Trạng thái: **ĐÃ BUILD 26/10** (thầy: «Bạn tự chốt theo đề xuất thông minh nhất, đơn giản nhất và hiệu quả nhất cho học sinh. Build luôn nhé»; «Đồng bộ với giao diện code app 1»).
Claude tự chốt: **A1 + A2 + A3 + B1**; để sau B2, B3, B4 (đổi luật chuỗi / xếp hạng — đo tác dụng của A trước). Ảnh Chromium thật giao diện «Trong»: `docs/ban-ve-duolingo-2610/`.
- A1/A2: `server/src/bai-6-cau.ts` (gắn ở `startGoi7`); thêm: câu thầy vừa chữa xong (`chua`) luôn vào chặng đầu.
- A3: `server/src/goi-bai-7-lam-lai.ts`, lệnh `hoc-tap-lam-lai`; câu thay thế = câu anh em (`chonAnhEmChoCaDaDung`), tối đa 3 câu/chặng, một vòng. Song sinh soạn sẵn chưa dùng ở vòng này.
- B1: màn «Xong chặng» trong `src/components/hoc-tap/ManLamBaiTap.tsx` thêm 3 ô: Đúng liên tiếp dài nhất · Câu mới đã gặp · Làm lại đúng.
- Từ chuẩn mới «Làm lại» (khác «Ôn lại» theo lịch): `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`.
- Không chạy ngầm trước như mục 6 đề xuất: A1 chỉ đổi thứ tự cùng tập câu, A3 chỉ thêm lượt có hỗ trợ ⇒ lùi bằng bản lùi Worker + Pages nếu cần.
Thầy (26/10): "Quét thuật toán của dolingo … đề xuất sửa thuật toán phân câu cho học sinh hiện tại chuẩn dolingo nhất … vẫn đảm bảo phủ câu mới, sửa câu sai như dolingo."
Chưa tham vấn được cố vấn (phiên không có công cụ cố vấn).

## 0. Nói thẳng trước

**Lõi thuật toán của app đã ngang Duolingo, có chỗ còn chặt hơn. Không nên thay động cơ.** Cái làm Duolingo "thú vị" nằm ở chỗ khác: bài ngắn trộn đều các loại câu, sửa sai ngay trong bài, và vòng động lực sau mỗi bài.

| Duolingo công bố | App mình hiện có (đường dẫn mã) |
|---|---|
| Half-Life Regression: xác suất nhớ p = 2^(−Δ/h), h học từ lịch sử đúng/sai | Có: `server/src/half-life.ts` (h theo em × kỹ năng, so với FSRS, chỉ dùng khi thắng FSRS trên dữ liệu kiểm) |
| Birdbrain: ước lượng năng lực em + độ khó câu, chọn câu để em đúng khoảng 80% | Có: `information = exp(−((p−0,8)/0,2)²)` trong trọng số chọn câu mới (`hanh-trinh-dong-co.ts:184`), độ khó câu học từ sai số (`hanh-trinh-v6-mo-hinh.ts`), BKT theo vi kỹ năng (`omni-kieu.ts`) |
| Cây bài có thứ tự mở khoá | Có và chặt hơn: tầng 1–4, tiên quyết theo vi kỹ năng (`hanh-trinh-v6-loi.ts`) |
| Lặp câu sai theo lịch | Có: sai ⇒ ôn ngày mai, đúng ⇒ 3/7/14 ngày, duy trì 30 ngày (`srs2-loi.ts:84-89,204-213`); đóng lỗi cần 2 ngày đúng, cách lần sai ≥ 3 ngày (`loi-hoc-luat.ts`) |
| Không có hạn chót | App CÓ hạn: quota phủ câu mới = ⌈chưa gặp / số ngày còn⌉ (`goi-bai-7-loi.ts:11`). Duolingo không có ràng buộc này ⇒ phải giữ, không chép |

**Bốn chỗ app khác Duolingo, cũng là bốn chỗ nên sửa:**
1. **Câu không trộn trong từng bài.** `chonGoi7` (`goi-bai-7-loi.ts:24-70`) xếp danh sách ngày theo khối: hết câu mới → chữa → sửa → ôn. Em làm một dãy dài câu mới rồi mới gặp câu sửa/ôn. Duolingo trộn câu mới với câu ôn trong MỖI bài.
2. **Câu sai không được làm lại ngay trong bài.** Duolingo hỏi lại câu sai ở cuối bài, nên em kết bài bằng một lần làm đúng. App đẩy câu sai sang ngày mai.
3. **Năm bộ chọn chạy riêng** (gói 7 ngày, Hành trình, kiểm tra cá nhân, tự luyện, bài tập về nhà), không chung ngân sách. Trùng câu chỉ được chặn bằng tập "đã gặp".
4. **Không có nhịp "xong một bài"**: không có màn kết bài, không có nhiệm vụ ngày, không có ngày giữ chuỗi. Chuỗi ngày hiện chỉ cần ≥ 1 câu (`chuoi-ngay-hoc.ts`).

**Thứ KHÔNG nên chép từ Duolingo:**
- **Tim / năng lượng (sai thì mất mạng).** Ôn thi đại học cần em dám làm câu khó. Bộ chọn lại nhắm em đúng khoảng 80%, tức là sai 1/5 câu là chuyện bình thường; trừ tim với nhịp đó thì em hết tim liên tục và sẽ né câu khó.
- **EXP cho phần tự sửa.** Thầy đã chốt ngày 20/10: phần tự sửa không có EXP, không điểm thưởng, không xếp hạng (ghi tại `docs/de-xuat-chua-cau-gon-2510.md`). Đề xuất này giữ nguyên quyết định đó.
- **Bỏ hạn chót, học tuỳ hứng.** Quota phủ câu mới vẫn là ràng buộc cứng.

## 1. Mục tiêu sư phạm + ai dùng
- **Học sinh:** mỗi lần mở app làm **một bài 6 câu khoảng 5–8 phút**, có câu mới, câu ôn và câu sửa đan xen. Câu sai được làm lại ngay cuối bài bằng một câu cùng dạng. Kết bài thấy ngay kết quả: số câu đúng, chuỗi đúng liên tiếp, số câu mới đã chinh phục. Cảm giác cần đạt: "làm thêm một bài nữa cũng được".
- **Thầy:** quota phủ câu mới và luật đóng lỗi giữ nguyên. Trên bảng của thầy có thêm hai số: tỉ lệ đúng trung bình mỗi bài (mục tiêu 70–85%) và số câu em đã sửa ngay trong bài.
- **Phụ huynh:** dòng báo cũ, thêm "tuần này con làm N bài".

## 2. Thuật toán đề xuất (máy chủ)

### A1. Bộ sinh bài 6 câu, trộn đều (giữ `CAU_MOI_CHANG = 6`)
- **Đầu vào là danh sách việc của ngày đã chốt như hiện nay** (gói 7 ngày / Hành trình). Phần chọn câu nào vào ngày giữ nguyên, quota phủ câu mới giữ nguyên. Bộ sinh bài chỉ **chia lại danh sách đó thành từng bài 6 câu**.
- **Khung mặc định một bài:** 1 câu khởi động (câu đã làm được, xác suất đúng cao) · 3 câu mới · 1 câu sửa (câu sai đến lịch) · 1 câu ôn đến hạn.
- **Quota là ràng buộc cứng, khung chỉ là mặc định:**
  - số câu mới mỗi bài = ⌈câu mới còn của ngày / số bài còn của ngày⌉, tối đa 6;
  - loại nào thiếu thì lấp bằng câu mới; hết câu mới thì lấp bằng ôn sớm (tầng `onSom` đang có).
  - Sàn 24 câu/ngày = 4 bài, mỗi bài 3 câu mới ⇒ 12 câu mới/ngày. Ngày nào quota 18 câu mới thì mỗi bài tự lên 4–5 câu mới.
- **Trần câu sửa giữ như hiện tại:** tối đa `max(4, ⌈mức/3⌉)` câu mỗi ngày (`goi-bai-7-loi.ts:65`), chia đều cho các bài, mỗi bài 1–2 câu.
- **Thứ tự trong bài:** dễ → khó → vừa. Câu 1 là khởi động. Câu khó nhất (xác suất đúng dự đoán thấp nhất) đặt ở câu 4–5. Câu 6 là câu ôn, để em kết bài bằng câu làm được.

### A2. Giữ độ khó cả bài quanh 80% đúng
- Hiện hạng "đỉnh 0,8" chỉ dùng để xếp câu mới. Đề xuất: khi chia bài, cân sao cho **trung bình xác suất đúng dự đoán của 6 câu nằm trong 0,70–0,85**. Bài quá khó thì đổi một câu mới khó với một câu mới dễ hơn **trong cùng ngày**, nên tổng câu mới của ngày không đổi.
- Xác suất đúng lấy từ hàm đang có `xacSuatDungCau(omni, qc, sEm)`. Không thêm mô hình mới.

### A3. Sửa ngay cuối bài
- Câu nào sai trong bài thì sau câu 6 có **một vòng "Làm lại"**, mỗi câu sai một câu thay thế. Thứ tự ưu tiên câu thay thế:
  - câu song sinh soạn sẵn (`cau_bo_tro`, có ở 9,9% câu sai — số đo 25/10);
  - câu anh em cùng dạng em chưa gặp (trần trên 94,6% — số đo 25/10);
  - không có hai loại trên thì bỏ qua, không ép.
- **Không lặp nguyên câu vừa sai**, vì em vừa xem đáp án nên làm lại chỉ là nhớ đáp án.
- **Lượt này ghi là CÓ HỖ TRỢ**: không tính để đóng lỗi, đúng luật hiện tại (đọc lời giải trong 12 giờ thì không tính, `loi-hoc-luat.ts`). Câu sai gốc vẫn vào lịch "ngày mai" như cũ. Mục đích là học ngay khi còn nhớ lời giải, không phải để thổi phồng con số "đã sửa".
- Câu anh em dùng ở vòng này tính là "đã gặp" cho phần phủ (em đã học dạng đó).
- **Đáp án vẫn không xuống máy trước khi nộp**: câu thay thế đi kèm phản hồi của lệnh nộp câu sai, chỉ có đề, chưa có đáp án.

### A4. Không đổi
Lịch ôn 3/7/14/30, half-life + cổng kiểm, luật đóng lỗi, tiên quyết, kiểm tra cá nhân. Số liệu 25/10 cho thấy tầng này đã đúng hướng. Đổi thêm chỉ làm khó đo tác dụng của A1–A3.

## 3. Trạng thái (màn bài)
Đang tải bài · đang làm (thanh tiến độ 6 nấc) · vòng "Làm lại" (nhãn rõ, không đếm vào 6) · kết bài · hết bài của ngày (mời "Thử sức thêm" như hiện có) · mất mạng giữa bài (giữ câu đã nộp, bài tiếp tục từ câu chưa nộp) · ngày không có câu mới (bài toàn ôn, khung tự lấp).

## 4. Động lực (giao diện — cần bản vẽ, thầy chọn mục nào làm)
- **B1. Màn kết bài:** số câu đúng/6, chuỗi đúng liên tiếp dài nhất, số câu mới đã gặp, EXP của bài (cộng từ EXP từng câu như hiện tại, không đổi bảng EXP).
- **B2. Nhiệm vụ ngày (3 ô):** ví dụ "Xong 4 bài", "Đúng ≥ 5/6 trong 2 bài", "Làm lại đúng 3 câu cuối bài". Thưởng chỉ là dấu tích và một huy hiệu tuần, **không EXP**, để khỏi lấn quyết định 20/10.
- **B3. Chuỗi ngày theo bài + ngày giữ chuỗi:**
  - ngày được tính chuỗi khi em xong ≥ 1 bài (thay vì ≥ 1 câu);
  - mỗi tuần tự có 1 "ngày nghỉ giữ chuỗi", cộng dồn tối đa 2. Duolingo cũng cho trang bị tối đa 2 lượt giữ chuỗi.
- **B4. Giải đấu tuần theo lớp (tuỳ thầy):** xếp theo EXP tuần, **chỉ tính lượt "Học thật"** (nhãn Học thật · Đối phó đã bật 25/10), để em không cày bừa lấy hạng. Hiện đã có "Thi đua chăm hôm nay" top 3 (`thi-dua-hom-nay.ts`).

## 5. Ngoại lệ
- Em thoát giữa bài: bài giữ nguyên, lần sau mở tiếp đúng câu.
- Bấm nộp lặp: dùng cơ chế chống nộp trùng hiện có (kiểm lại khi build).
- Đổi ngày (00:00) giữa bài: bài thuộc ngày bắt đầu.
- Danh sách ngày < 6 câu: bài cuối ngắn hơn, không bịa câu cho đủ.
- Câu thay thế cũng sai: không có vòng làm lại thứ hai. Câu đó vào "Cần thầy chữa" theo luồng sẵn có.

## 6. Chi phí máy chủ
- **A1, A2:** chỉ sắp lại danh sách ngày đã chốt, chạy cùng lúc lập kế hoạch ngày (`lapChotHanhTrinh` / `lapGoi7`). **0 lệnh D1 thêm** khi em mở bài, 0 vòng chờ nối tiếp. Cột thứ tự bài là migration CHỈ-THÊM.
- **A3:** câu thay thế trả về **trong cùng phản hồi** của lệnh nộp câu sai, nên không thêm vòng gọi. Đọc thêm 1 câu (đã có chỉ mục theo dạng).
- **Phát hành kiểu Duolingo:**
  1. **chạy ngầm 5 ngày**: tính bài, ghi số đo, em chưa thấy gì;
  2. **bật 1–2 lớp**, so với các lớp còn lại trong 7 ngày;
  3. bật toàn trung tâm.
  Có cờ `cau_hinh` để tắt ngay.

## 7. Nghiệm thu đo bằng máy
- **Test vitest:**
  - `tests/bo-sinh-bai-6-cau-2610.test.ts`: quota phủ câu mới của ngày không giảm; mỗi bài ≤ 6 câu; trần câu sửa giữ nguyên; thứ tự dễ → khó → vừa;
  - `tests/do-kho-bai-80-2610.test.ts`: trung bình xác suất đúng nằm trong 0,70–0,85 khi danh sách cho phép;
  - `tests/lam-lai-cuoi-bai-2610.test.ts`: không lặp câu gốc; lượt có hỗ trợ không đóng lỗi; đáp án không có trong phản hồi.
- **Số đo khi chạy ngầm và khi bật lớp** (so trước/sau):
  - tỉ lệ đúng trung bình mỗi bài;
  - số câu mới gặp/em/ngày (không được giảm);
  - tỉ lệ đúng lại câu sai sau ≥ 3 ngày;
  - số em xong ≥ 1 bài/ngày;
  - số câu sai mới/em/ngày (25/10: 3–5).
- **Cổng chung:** `npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0; ảnh Chromium 0 lỗi trang, 0 tràn.

## 8. Thầy chọn
1. **Phần thuật toán (A1 trộn bài 6 câu + A2 độ khó 80% + A3 làm lại cuối bài):** đồng ý làm? Đề nghị: làm, chạy ngầm trước.
2. **Phần động lực:** chọn trong B1 màn kết bài · B2 nhiệm vụ ngày · B3 chuỗi theo bài + ngày giữ chuỗi · B4 giải đấu tuần. Đề nghị: B1 + B3 trước, B2 sau, B4 để sau khi xem số đo.
3. **B4 có xếp hạng:** quyết định 20/10 "không xếp hạng" chỉ áp cho phần tự sửa. Thầy có muốn xếp hạng EXP tuần cho phần luyện tập không?

## Nguồn về Duolingo
Mạng của phiên bị chặn tới blog.duolingo.com và aclanthology.org, nên em chưa mở được bản gốc. Các ý dưới đây lấy từ đoạn trích của công cụ tìm kiếm.
- Half-Life Regression, p = 2^(−Δ/h): Settles & Meeder, ACL 2016 (aclanthology.org/P16-1174); blog "How we learn how you learn".
- Birdbrain (năng lực em + độ khó bài tập): blog "Learning how to help you learn: Introducing Birdbrain"; IEEE Spectrum.
- Mục tiêu khoảng 80% đúng: chỉ thấy ở bài tóm tắt NeurIPS 2021 (aihub.org). **Nguồn thứ cấp, chưa xác minh.**
- Mỗi bài chọn khoảng 14 bài tập từ khoảng 200 ứng viên: VentureBeat (bài cũ). **Chưa xác minh.**
- Ôn câu sai ở cuối bài: blog Duolingo.
- Giữ chuỗi trang bị tối đa 2 lượt: Help Center "What is a streak".
- Không dùng con số hiệu quả nào của Duolingo trong đề xuất này. Mọi số về app lấy từ mã và số đo D1 ngày 25/10 (`docs/de-xuat-chua-cau-gon-2510.md`).
