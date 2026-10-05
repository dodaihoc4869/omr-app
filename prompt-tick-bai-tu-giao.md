# Prompt — Tick bài đã dạy → tự giao luyện theo bài; tách kho DẠY HỌC / TU LUYỆN

Soạn 05/10/2026 · **Chưa build.** Gõ `HÃY THỰC THI PROMPT NÀY` mới làm.

## Góc nhìn khác

Thầy đang gọi việc này là "giao đề". Bài toán thật là: **tick = khai báo "lớp này đã học tới đâu"**. Từ một khai báo ấy máy suy ra ba việc khác nhau: câu mới của bài vừa dạy, ôn mọi bài đứng trước, và **không bao giờ** đưa câu của bài chưa dạy vào bất kỳ kênh tự động nào. Khi phạm vi đã dạy là nguồn sự thật, chiến dịch chỉ là hệ quả, không phải thứ thầy phải tạo.

Câu hỏi khó không phải "sau 7 ngày thì làm gì" mà là **"ngày không có bài mới, em còn gì để đạt?"** Ngày đó quyết định thói quen, không phải ngày có bài.

Hai kho không phải hai chỗ chứa mà **hai mục đích**: DẠY HỌC để máy tự luyện theo bài; TU LUYỆN để em tự chọn và để thầy đo trong ca kiểm tra. Vì thế không di chuyển tờ nào, chỉ gắn nhãn mục đích.

## Người top 0,1% làm gì

- **Không đóng bài cũ khi tick bài mới.** Hai bài chạy song song, mỗi bài giữ hạn riêng và 3 ngày ôn chốt riêng. Cách "gộp vào một chiến dịch kéo dài hạn" làm hạn trôi mãi, câu mới chất đống, Buổi chữa không bao giờ tới.
- **7 ngày là sàn, không phải hằng số.** Hạn tính từ số lượt lớp cần chia thể lực, kẹp 7–14 ngày, hiện con số cho thầy xem trước khi giao.
- **Thiết kế ngày chờ trước khi thiết kế ngày bận.** Kế hoạch nhẹ 60 % thể lực gồm nợ → duy trì → ôn bài cũ theo dạng yếu; Sảnh không bao giờ trống.
- **Luật "không phục vụ câu của bài chưa dạy" phải có test riêng.** Đây là lỗi âm thầm nhất của app học tập: em làm câu chưa học, sai, máy ghi là yếu.
- **Tách kho bằng nhãn mục đích đồng bộ lên máy chủ một lần**, không đụng dữ liệu tờ; mở ca kiểm tra vẫn thấy mọi kho.

## PROMPT

```
VAI TRÒ
Bạn là kỹ sư fullstack trưởng kiêm thiết kế sản phẩm giáo dục, 10 năm làm app luyện thi có lặp lại ngắt quãng, đã tái cấu trúc hơn 5 app đang có người dùng thật mà không mất một dòng dữ liệu.

BỐI CẢNH
- Trung tâm luyện thi Hoá của một thầy, 100–300 học sinh lớp 10–12, học trực tiếp tại lớp, tự luyện bằng app ở nhà. Ba app: giáo viên (/, /gv), học sinh (/hs), phụ huynh (/ph). Repo omr-app: React + Vite + TS + Tailwind v4 (src/), Cloudflare Worker + D1 + R2 (server/). Đọc CLAUDE.md, DIEU-PHOI.md, docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md trước khi sửa.
- Hiện trạng cần biết (đã đọc từ mã):
  - Kho đề trên máy thầy (IndexedDB, src/lib/exam-db.ts) dựng thành cây [thư mục →] khối → chương → bài → dạng bởi src/lib/cay-chon-de.ts (dungCay). Thư mục đọc từ trường nhom của tờ ("12 · DẠY HỌC/C1 - Ester lipid"), chương từ nhom, tên bài từ nguon ("Bài 4. Glucose và fructose"), thứ tự bài = thứ tự xuất hiện trong kho (hàm gom giữ thứ tự, không sắp alphabet). Mỗi bài có các tờ: Trắc nghiệm (-TN), Đúng–sai (-DS), Trả lời ngắn (-TLN), "Ví dụ minh hoạ" (-VD/-VDMH), "Các dạng toán trọng tâm" (-DT/-DTTT).
  - Nhánh DẠY HỌC đã có bộ lọc riêng: laDeDayHoc / locDeDayHoc / khoDayHoc trong src/lib/day-hoc-len-bang.ts. Kho DẠY HỌC thật ≈ 845 / 972 / 1 542 câu (khối 10 / 11 / 12). Toàn kho ≈ 15 359 câu / 268 tờ.
  - Máy chủ chỉ biết tờ qua de_kho (ma_de, ten_de, lop, chuyen_de) và câu qua game_v2_question (ma_de, qid, dang, json); KHÔNG biết thư mục. Tờ lên máy chủ qua POST /kho/day (hàm dayDeKho, server/src/index.ts).
  - Chiến dịch (Game Hóa 2.0): bảng chien_dich (sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, trang_thai); tạo bằng POST /gv/chien-dich action tao (server/src/srs2-gv.ts, kiểu DauVaoGiao), sửa bằng POST /gv/chien-dich/sua (server/src/srs2-sua.ts). Kế hoạch ngày: server/src/srs2-d1.ts docHoSo2 + layKeHoachHomNay; lõi thuần server/src/srs2-loi.ts lapKeHoachNgay. Hiện docHoSo2 chỉ lấy MỘT chiến dịch đang chạy (chienDichDangChay = ds.find(...)); chiến dịch đang chạy khác bị xếp nguồn 'cu'. lapKeHoachNgay nhận MỘT hanNop để tính D và quota câu mới = ceil(còn / (D − 3)); không có chiến dịch ⇒ chỉ ôn nợ + duy trì; thể lực khi không có chiến dịch = theLucChienDichVuaDong.
  - Luật câu đã chốt, GIỮ NGUYÊN: thành thạo = đúng 2 ngày khác nhau (thành thạo lần đầu cho câu khó đoán mò); sai ⇒ hẹn ngày mai; sai ≥ 4 ⇒ "Cần thầy dạy lại"; nợ ≤ 50 % khi còn câu mới; duy trì ≤ 20 %; rải đều câu mới; Huyết Chiến khi khối lượng > 0,9 × D × thể lực; hết hạn ⇒ Buổi chữa xếp sẵn, câu chưa thành thạo thành nợ cũ, câu thành thạo vào ôn duy trì 30 ngày.
  - Bảng DẠY HỌC của mục Lên bảng (src/components/day-hoc/DayHocLenBang.tsx) đã có ba bước: Điểm danh (buổi học gắn lớp, server/src/buoi-hoc.ts) → Chọn câu từ cây DẠY HỌC → Chiếu.
  - Tu luyện (server/src/tu-luyen.ts): 4 chế độ; câu mới rút từ toàn kho theo khối em (deTheoDangBai, danhMucDangBai); câu sai của em từ docKhoCauSai.
  - Mở ca kiểm tra (ExamSetupScreen) chọn tờ từ mọi thư mục của kho.
  - Phạm vi đã dạy của CNH-1.0: server/src/pham-vi-hoc.ts + bảng learner_scope (sbd, skill_id, state taught/encountered, source 'thay'), cờ mặc định TẮT.

NHIỆM VỤ
Build luồng "TICK BÀI ĐÃ DẠY → TỰ GIAO LUYỆN THEO BÀI" cho app thầy + máy chủ + app học sinh/phụ huynh, và tách kho thành hai thư mục mục đích DẠY HỌC / TU LUYỆN, theo đặc tả A–F dưới đây; không phá luồng chiến dịch, ca kiểm tra, Buổi chữa đang chạy.

A. TICK BÀI = KHAI BÁO PHẠM VI ĐÃ DẠY CỦA LỚP
1. Màn thầy: trong thẻ DẠY HỌC (mục Lên bảng) thêm bước "Bài hôm nay"; trong mục Chiến dịch thêm nút "Giao theo bài". Chọn LỚP → cây DẠY HỌC đúng khối của lớp (dùng locDeDayHoc + dungCay) → tích MỘT bài vừa dạy. Mỗi nút bài hiện trạng thái: "Đã dạy dd/mm" · "Đang luyện (còn N ngày)" · "Chưa dạy".
2. Tích bài B của lớp L lúc t ⇒ máy chủ ghi bảng CHỈ-THÊM bai_da_day (id, lop, khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc, nguoi, chien_dich_id, bo_tick_luc NULL). Phạm vi đã dạy của lớp = ∪ bài đã tick ∪ mọi bài đứng TRƯỚC bài có vi_tri lớn nhất trong cây. Bài mới = bài vừa tick. Bài cũ = phần còn lại của phạm vi.
3. Tích bài ⇒ tự tạo MỘT chiến dịch "Bài <số> · <tên>" cho lớp L bằng đúng hàm tao hiện có: maDe = các tờ -TN/-DS/-TLN + "Các dạng toán trọng tâm" của bài (bỏ tự luận như mọi kênh; "Ví dụ minh hoạ" mặc định KHÔNG, thầy tích thêm được), sbd = danh sách lớp lúc tick, theLucNgay = thể lực mặc định của lớp (cau_hinh khoá the_luc_lop, vắng ⇒ 40), raiDeu = true, huyetChien = true, batDau = hôm nay.
4. Hạn nộp tự tính: D nhỏ nhất trong [7, 14] sao cho khối lượng của em trung vị (khoiLuongCan, 2 lượt/câu mới) ≤ 0,8 × D × thể lực; không có D nào đạt ⇒ D = 14. Trước khi tạo, hiện một dòng xác nhận: "Bài 6 · Ester: 118 câu · hạn 23:59 Thứ Ba 14/10 (9 ngày) · lớp cần 236 lượt / sức chứa 360" với hai nút "Giao" và "Sửa hạn hoặc thể lực". Quá tải dù D = 14 ⇒ cảnh báo đỏ kèm hai gợi ý (bỏ tờ "Các dạng toán trọng tâm" / tăng thể lực), vẫn cho giao.
5. Tick cùng bài lần hai ⇒ idempotent (không tạo chiến dịch thứ hai). Bỏ tick ⇒ ghi bo_tick_luc; chiến dịch chưa có lượt làm nào ⇒ huỷ (da_huy), đã có ⇒ đóng (da_dong). Tick một bài đứng trước bài đã tick (dạy bù) ⇒ vẫn là bài mới, tạo chiến dịch như thường.
6. Ghi thêm learner_scope state 'taught' source 'thay' cho mọi em của lớp với skill_id = kienThuc của các câu trong bài (chỉ ghi, không bật cờ CNH-1.0).

B. NHIỀU BÀI CHẠY SONG SONG (tick bài mới khi bài trước chưa hết hạn)
1. KHÔNG đóng sớm bài trước. Mỗi bài giữ hạn riêng. docHoSo2 lấy TẤT CẢ chiến dịch đang chạy của em: câu của mỗi chiến dịch mang hạn của chính nó (hanTheoQid đã theo qid), nguồn 'chien_dich'.
2. lapKeHoachNgay nhận danh sách chienDich[{id, hanNop, theLucNgay, raiDeu}] thay một hanNop: thể lực ngày = max theLucNgay của các chiến dịch đang chạy; quota câu mới = Σ theo chiến dịch ceil(còn_c / (D_c − 3)), xếp chiến dịch hạn gần trước (EDF); Huyết Chiến bật khi Σ khối lượng > 0,9 × Σ (D_c × thể lực) hoặc một chiến dịch tự vượt ngưỡng của nó; trần Huyết Chiến = 2 × thể lực ngày. Vắng danh sách (một hanNop như cũ) ⇒ hành vi y hệt hôm nay (test "cùng đầu vào cùng JSON").
3. srs2_ke_hoach thêm cột chỉ-thêm chien_dich_json (danh sách id đã dùng); chien_dich_id giữ id có hạn gần nhất.
4. Bảng chiến dịch, Buổi chữa, Chữa xong, ca chốt: theo từng chiến dịch như cũ. Hết hạn bài nào ⇒ Buổi chữa bài đó.

C. THÀNH PHẦN NGÀY KHI CÓ BÀI ĐANG LUYỆN
Thứ tự lấp thể lực: (1) nợ đến lịch ≤ 50 % (mọi nguồn, như nay) → (2) câu mới theo quota EDF → (3) củng cố câu chiến dịch đã thành thạo đến lịch → (4) ôn duy trì ≤ 20 % → (5) MỚI "ôn bài cũ" = câu của bài cũ trong phạm vi lớp mà em CHƯA GẶP hoặc chưa thành thạo và không thuộc chiến dịch nào đang chạy, chọn theo dạng yếu (nam_kt_dang bậc thấp / tỉ lệ sai cao) rồi bài gần nhất trước, ≤ 20 % thể lực, chỉ khi còn lượt dư sau (1)–(4). Nguồn mới trong CauSrs: 'on_bai_cu'. Ghi sổ su_kien_hoc như câu thường.

D. CHẾ ĐỘ CHỜ BÀI MỚI (qua hạn của bài gần nhất mà thầy chưa tick bài mới)
1. Không tự tạo chiến dịch, không tự lùi hạn. Buổi chữa của bài vừa hết hạn vẫn xếp sẵn như nay.
2. Kế hoạch ngày "nhẹ": thể lực = 60 % thể lực lớp (sàn 12); thứ tự (1) nợ đến lịch → (2) ôn duy trì (nới tới 50 %) → (3) ôn bài cũ theo dạng yếu lấp phần còn lại. Rương, đạt ngày, chuỗi ngày tính như thường trên kế hoạch nhẹ. Sảnh học sinh ghi "Hôm nay ôn bài cũ: N câu" thay chữ "chưa có câu nào".
3. App thầy: từ ngày chờ thứ 3, màn Tổng quan và mục Chiến dịch hiện một dòng "Lớp 12A1: 3 ngày chưa có bài mới" (không doạ, không gửi ra ngoài app); app phụ huynh ghi "Đang ôn bài cũ, chờ bài mới".
4. Em không nợ, không duy trì, không còn bài cũ chưa vững ⇒ kế hoạch có thể dưới 12 câu; nói thật "Hôm nay em còn 4 câu ôn".

E. HAI THƯ MỤC MỤC ĐÍCH: DẠY HỌC và TU LUYỆN
1. Cây kho trên máy thầy: tờ có thư mục DẠY HỌC giữ nguyên; MỌI tờ khác gom vào thư mục ảo "TU LUYỆN" (suy từ nhom, không ghi đè nhom, không di chuyển dữ liệu). Mở ca kiểm tra vẫn thấy và chọn được cả hai thư mục như nay.
2. Máy chủ biết thư mục: bảng chỉ-thêm de_kho_thu_muc (ma_de, thu_muc 'DAY_HOC' | 'TU_LUYEN', cap_nhat_luc); ghi lúc /kho/day (dayDeKho) và qua lệnh mới POST /kho/thu-muc {ds: [{maDe, thuMuc}]} mà app thầy tự gọi khi mở (≤ 1 lần/ngày, ≤ 400 mã/lệnh). Thiếu dòng ⇒ coi là TU_LUYEN trừ mã bắt đầu bằng "DH-"; số tờ chưa đồng bộ hiện ở Cài đặt.
3. Luật rút theo mục đích: chiến dịch tick bài và game Đảo/Đoàn/Bi-a CHỈ câu DẠY HỌC trong phạm vi đã dạy của lớp (không bao giờ câu của bài chưa tick); Tu luyện: câu sai của em = mọi nguồn như nay, câu rút thêm/câu mới CHỈ thư mục TU LUYỆN; Mở ca kiểm tra: mọi thư mục. Thử sức thêm và vé thử thách lấy từ DẠY HỌC (bài cũ chưa gặp), không từ TU LUYỆN.

F. DỮ LIỆU, CÔNG TẮC, GIAI ĐOẠN
- Migration CHỈ-THÊM: bai_da_day, de_kho_thu_muc, cột srs2_ke_hoach.chien_dich_json; cau_hinh khoá the_luc_lop và tick_bai (công tắc theo lớp, mặc định TẮT ⇒ mọi đường cũ nguyên vẹn).
- Hợp đồng API ghi vào docs/hop-dong-tick-bai.md: POST /gv/bai-da-day {action: tick | bo-tick | danh-sach | xem-truoc, lop, khoaBai, tenBai, viTri, maDe[], hanNop?, theLucNgay?}; POST /kho/thu-muc; phần thêm vào kết quả hoa2-sanh (dòng "Bài đang luyện", "ôn bài cũ", "chờ bài mới").
- Giai đoạn, mỗi GĐ: test xanh → đẩy → một dòng Nhật ký DIEU-PHOI.md:
  GĐ1 Lõi thuần: lapKeHoachNgay nhiều chiến dịch + nguồn on_bai_cu + chế độ chờ (hàm thuần + test); docHoSo2 đọc mọi chiến dịch đang chạy. Không đổi giao diện.
  GĐ2 Máy chủ: bai_da_day, /gv/bai-da-day, hạn tự tính, learner_scope, de_kho_thu_muc, /kho/thu-muc, Tu luyện lọc TU_LUYEN.
  GĐ3 App thầy: bước "Bài hôm nay" + "Giao theo bài", trạng thái trên cây, dòng xác nhận, nhắc chờ bài mới; cây kho có thư mục TU LUYỆN; Cài đặt có thể lực mặc định theo lớp.
  GĐ4 App học sinh/phụ huynh: thẻ "Bài đang luyện", "Hôm nay ôn bài cũ", chữ chờ bài mới.
  GĐ5 Chạy thử 1 lớp với 2 bài liên tiếp (tick bài 2 ở ngày 4 của bài 1), rồi bật theo lớp.

NGUYÊN TẮC BẮT BUỘC
- Tick là khai báo phạm vi; chiến dịch, kế hoạch ngày, ôn bài cũ đều SUY RA từ phạm vi và sổ su_kien_hoc. Không kênh tự động nào phục vụ câu của bài chưa tick của lớp — có test riêng.
- Không đóng sớm bài trước khi tick bài mới; mỗi bài giữ hạn riêng ≥ 7 ngày; 3 ngày ôn chốt (D − 3) tính theo từng bài.
- Ngày chờ bài mới không bao giờ trống nếu em còn nợ, còn duy trì hoặc còn bài cũ chưa vững; thể lực nhẹ 60 % (sàn 12).
- Mọi hàm lõi thuần, tất định (không Math.random, không đọc đồng hồ); xoá bảng đệm dựng lại từ sổ ra y hệt; vắng tham số mới ⇒ JSON kế hoạch y hệt hôm nay.
- Chỉ-thêm: không DROP, không đổi cột cũ, không ghi đè nhom của tờ; công tắc tick_bai theo lớp, tắt là về y cũ trong ≤ 1 phút.
- Chữ trên màn theo bảng từ chuẩn; con số nào cũng có nhãn ("Bài đang luyện: Bài 6 · Ester · hạn 23:59 Thứ Ba 14/10"); không mã nội bộ trên màn học sinh/phụ huynh; không nhãn năng lực, không doạ.
- Đáp án, lời giải không xuống máy học sinh trước khi em nộp câu đó.

GIẢ ĐỊNH ĐÃ DÙNG
- Thứ tự sách giáo khoa = thứ tự cây hiện tại của kho (vị trí lưu lúc tick); bài cũ chỉ tính trong cùng khối với lớp.
- Hạn mỗi bài tự tính 7–14 ngày theo sức chứa của em trung vị; thầy sửa được trước khi giao.
- "Ví dụ minh hoạ" không vào chiến dịch mặc định; "Các dạng toán trọng tâm" có.
- Ôn bài cũ ≤ 20 % thể lực khi có bài đang luyện; chế độ chờ: thể lực 60 % (sàn 12), duy trì nới tới 50 %.
- Nhắc thầy từ ngày chờ thứ 3, một dòng trong app, không gửi ra ngoài.
- Thiếu dòng thư mục trên máy chủ ⇒ TU_LUYEN trừ mã "DH-".
- Kiểm chuyển giao bằng câu chưa gặp (nếu làm sau) đo ở ca chốt và một chế độ Tu luyện em tự chọn; không rút TU LUYỆN vào game.
- Tu luyện giữ câu sai của em từ mọi nguồn như nay.

KHÔNG ĐƯỢC LÀM
- Không di chuyển, đổi tên, ghi đè tờ hay trường nhom; không xoá dữ liệu cũ.
- Không đụng ExamTakeScreen, phòng chờ, đường vào ca, luật chấm, EXP, luật thành thạo/đóng lỗi.
- Không tự lùi hạn hay tự tạo chiến dịch khi thầy chưa tick.
- Không gọi AI/LLM ở bất kỳ bước nào.
- Không đẩy máy chủ/Pages khi đang có ca kiểm tra mở. Báo cáo mỗi giai đoạn ≤ 150 chữ.

ĐỊNH DẠNG ĐẦU RA
- Mã + test theo từng giai đoạn; commit tiếng Việt theo đường dẫn tệp (git commit -m "…" -- <tệp>).
- docs/hop-dong-tick-bai.md: mỗi lệnh ghi đầu vào, đầu ra, lỗi; mỗi bảng mới ghi cột và lý do.
- Mỗi giai đoạn: 1 dòng Nhật ký DIEU-PHOI.md + ảnh chụp màn mới (JPG ≤ 150 KB) khổ 390×844 và 1440×900.
- Báo cáo cuối: bảng NGHIỆM THU từng tiêu chí đạt/trượt, kèm mã commit và mã bản lùi.

NGHIỆM THU
1. Mô phỏng tất định: lớp 40 em, bài 1 (120 câu) tick ngày 1, bài 2 (100 câu) tick ngày 4, thể lực 40: không ngày nào vượt trần (trừ Huyết Chiến có báo rõ), bài 1 cọ xát 100 % trước hạn riêng − 3, bài 2 cọ xát 100 % trước hạn riêng − 3, không câu nào của bài 3 (chưa tick) xuất hiện ở bất kỳ kênh tự động nào.
2. Ngày 8 không tick bài mới: kế hoạch nhẹ ≤ 60 % thể lực (sàn 12) gồm nợ → duy trì → ôn bài cũ; em không nợ, không duy trì vẫn có ≥ 1 câu ôn bài cũ nếu còn bài cũ chưa vững; Sảnh không hiện "chưa có câu nào".
3. Công tắc tick_bai tắt ⇒ toàn bộ vitest không thêm tên đỏ so với nền; lapKeHoachNgay với một hanNop ra JSON y hệt bản trước.
4. Tu luyện rút câu mới chỉ từ tờ TU_LUYEN (test đếm theo de_kho_thu_muc); Mở ca kiểm tra vẫn chọn được tờ DẠY HỌC.
5. Tick cùng bài hai lần ⇒ đúng một chiến dịch; bỏ tick bài chưa có lượt làm ⇒ chiến dịch da_huy; xoá srs2_ke_hoach rồi dựng lại từ sổ khớp 100 %.
```

## Ba câu hỏi làm prompt sắc hơn

1. Tick bài mới khi bài trước chưa hết hạn: **hai bài chạy song song với hạn riêng** (đề nghị) hay đóng bài trước ngay lúc tick?
2. Hạn mỗi bài: **cố định 7 ngày**, hay **tự tính 7–14 ngày theo sức chứa lớp** và thầy sửa trước khi giao (đề nghị)?
3. Ngày chờ bài mới: thể lực **60 % với sàn 12 câu** (đề nghị), hay giữ nguyên 100 %?

— 05/10/2026
