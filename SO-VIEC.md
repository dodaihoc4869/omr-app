# SỔ VIỆC — 19/09 (tối) · THỰC THI CÁ NHÂN HOÁ "TIẾN BỘ TỪNG NGÀY" — GĐ 0 → GĐ 2

## Yêu cầu nhận (nguyên văn)

- [x] "Đọc DE-XUAT-CA-NHAN-HOA-1909.md và prompt-ca-nhan-hoa-tien-bo-tung-ngay.md trong thư mục này, rồi đọc mục đầu SO-VIEC.md để biết giai đoạn nào đã xong."  | bằng chứng: đã đọc cả ba file; mục đầu sổ ghi "Chưa build gì" ⇒ chưa giai đoạn nào xong, bắt đầu từ GĐ 0.
- [x] "11 câu chốt: đồng ý hết theo cột "Đề nghị" ở mục 5 của DE-XUAT."  | bằng chứng: 11/11 theo đề nghị, đã áp dụng (20 phút; bỏ trống = chưa làm; mốc theo ngày; PH giao = phần dư; xoá 3 test 3 Vòng; thần thú không khoá; daily_ bỏ; nghỉ không đứt streak; PH cần token (GĐ 5); phòng chờ; ngừng cộng tien_do_hs)
- [x] "HÃY THỰC THI PROMPT NÀY, chỉ làm GĐ 0 đến GĐ 2"
- [x] "mỗi giai đoạn xong thì test, phát hành, ghi sổ việc"
- [x] "Xong GĐ 2 thì dừng và báo giới hạn dùng còn lại."
- [x] (phiên điều phối 0.Planer, 19/09 ~14:00, đọc lại từ tin nhắn) "vá SBD không tồn tại rồi em nghỉ"  | bằng chứng: xem mục GĐ 2, dòng "VÁ SAU NGHIỆM THU" — commit `d73fe93`, Worker `b1cba8d3`.
- [x] (0.Planer, 19/09 ~14:15) "POST /hs/ca-dang-mo" — VIỆC NGOÀI PHẠM VI "GĐ 0–2" thầy giao trong lời nhắn ban đầu; làm theo quyền điều phối thầy đã uỷ cho 0.Planer (ghi trong DIEU-PHOI.md), việc chỉ ĐỌC, nằm trong `server/`, không đụng giao diện  | bằng chứng: mục "Việc nhỏ: /hs/ca-dang-mo" bên dưới.
- [x] (thầy, nhắn trực tiếp trong chat, 19/09 sau khi tôi từ chối GĐ 5 vì lệnh đến từ phiên khác) "bạn nghe theo điều phối 100% không cần tôi xác nhận nhé"  | bằng chứng: từ giờ việc do 0.Planer giao thì làm, không chờ thầy xác nhận; vẫn ghi việc đó vào sổ này là do 0.Planer giao; các chốt an toàn cứng (không xoá/ghi đè D1 thật, không phát hành khi có ca thi mở, chỉ `git add` tệp của mình, chỉ đẩy máy chủ) vẫn giữ. Đã lưu vào bộ nhớ phiên (`nghe-theo-dieu-phoi`). Hiện 0.Planer chưa giao việc mới: GĐ 5 do chính 0.Planer HOÃN tới phiên mới vì giới hạn tuần còn ~18% — tôi nghỉ đúng như nó dặn.

## Vạch đích (chép từ mục NGHIỆM THU của prompt — không đổi)

### GĐ 0 — Sổ `su_kien_hoc`  ·  XONG (19/09, Worker `47823f98`)
- [x] Migration additive `server/migration-1909-su-kien-hoc.sql` (bảng + 3 chỉ mục), chạy `--remote`  | bằng chứng: `wrangler d1 execute omr --file=migration-1909-su-kien-hoc.sql --remote -y` → `changes:1`; SELECT `sqlite_master` → 4 đối tượng mới, 0 dòng lúc đầu.
- [x] `ghiSuKien` một hàm duy nhất, idempotent theo `khoa`, gom ≤ 40 dòng/câu lệnh qua `json_each` (1 tham số, né giới hạn 100 tham số của D1), một `batch` ≤ 25 câu lệnh, KHÔNG ném lỗi khi chưa có bảng  | bằng chứng: `tests/su-kien-hoc-1909.test.ts` — 95 dòng = 3 câu lệnh + 1 batch; mất bảng → `ok:false`; 4 lượt nộp (/btvn/nop, /cham-diem, /len-bang, /btvn/xong-lo) vẫn `ok:true` khi chưa có bảng.
- [x] Móc đủ 9 điểm ghi (8 nguồn + đường chữa lành chi tiết): `chamDiem`, `luuChiTietCauNeuChuaCo`, `nopBtvnQuaPhieu`, `xongLoBtvn` (nhận thêm `dapAn`), `nopKhacPhuc`, `mom submit`, `ghiLenBangMoi`, game `answer`, `luyenDe submit`  | bằng chứng: mỗi điểm có test đếm đúng số dòng + idempotent; kiểm thử ĐỘT BIẾN (tắt 4 điểm ghi) làm 7 test đỏ đúng chỗ rồi khôi phục 28/28.
- [x] `POST /ho-so/nap-lai` (thầy, ≤ 20 em/lượt, nguồn `sql|btvn|khac_phuc|mom|luyen`) + `POST /ho-so/kiem-cheo`  | bằng chứng: chạy trên D1 thật cho 261 SBD (script trong phiên): sql +9.040, btvn +11.330, khắc phục +410, mom +1.847, luyện đề +504; lỗi còn lại xem mục "Ghi nhận" dưới.
- [x] Test `tests/su-kien-hoc-1909.test.ts` (+ `tests/_d1-that.ts`: D1 giả bằng SQLite THẬT nạp đúng schema.sql + mọi migration-*.sql)  | bằng chứng: `npx vitest run tests/su-kien-hoc-1909.test.ts` → **30 passed (30)**.
- [x] NGHIỆM THU GĐ 0 — ĐẠT: `SELECT COUNT(*) FROM su_kien_hoc WHERE nguon='thi'` = **4744** = `chi_tiet_cau` có qid (**4744**); game 4298 = 4298 lượt không trợ giúp; tổng 23.145 dòng, 217 em, 19/09 12–19/09. "Nộp BTVN thử 1 bài → đúng số dòng nguon='btvn'": ĐÃ KIỂM bằng test (`/btvn/nop`: 4 câu → 4 dòng, gửi lại y hệt không thêm, đáp án khác → lan 2) và bằng nạp lại trên dữ liệu thật; CHƯA có lượt nộp BTVN thật nào sau giờ phát hành để đối chiếu đường ghi trực tiếp (tôi không tạo bài nộp giả vào hồ sơ học sinh thật). Đường ghi trực tiếp ĐÃ có bằng chứng thật ở Mom (12 dòng) và game (2 dòng) do học sinh nộp sau giờ phát hành.
- [x] Toàn bộ vitest không tăng đỏ  | bằng chứng: `npx vitest run` → **4652 tests, 98 failed | 4553 passed; 43 tệp đỏ = nền 98/43**; so danh sách tệp đỏ với nền: MỚI ĐỎ [] · HẾT ĐỎ [].
- [x] Phát hành + ghi sổ  | bằng chứng: commit `0fcc397` (mã) + `ff0efe4` (bản vá khắc phục). Lần 1 `DAY-TAT-CA.command` → "XONG CẢ HAI", Worker `8907348c`, Pages builtAt 1789784130 → **1789794575**, curl 3 URL → 200 (đây là lần đẩy Pages duy nhất của tôi, TRƯỚC khi có DIEU-PHOI.md; `git status` khi đó không có tệp `src/` sửa dở). Lần 2 `DAY-MAY-CHU.command` (chốt ca thi: "SẠCH 8 ca") → Worker **`47823f98`**. Lùi: `git revert ff0efe4 0fcc397` rồi `./DAY-MAY-CHU.command` (bảng `su_kien_hoc` cứ để nguyên — chỉ thêm, không ai đọc).
- [ ] CHỜ GĐ 3: máy em (phiếu BTVN) gửi kèm `dapAn` của lô khi báo xong lô. Phần MÁY CHỦ đã xong và có test; phần MÁY EM nằm ở `html-phieu.ts`/`KhungXemPhieu.tsx` — thuộc GĐ 3, ngoài phạm vi lượt này (và đang là vùng của phiên Giao diện).

**Ghi nhận / lệch với đề xuất (gặp chỗ đề xuất mâu thuẫn mã thật → chọn phương án giữ bất biến test):**
1. `ma_dang` KHÔNG tra lúc ghi (chỉ game/luyện đề biết chắc); còn lại NULL, GĐ 1 tra theo qid từ `game_v2_question`/`cau_hoi` lúc dựng hồ sơ — rẻ hơn ở đường nộp và luôn theo nhãn kho mới nhất. Chuyên đề của BTVN cũng để trống ở sổ vì lý do này.
2. Ca thi ghi kiểu CẬP NHẬT (`ON CONFLICT DO UPDATE`), nguồn khác kiểu BỎ QUA — vì `chamDiem` cũng ghi đè khi chấm lại. Giờ sự kiện thi = `luot.nop_luc`, không phải giờ chấm.
3. Game: câu có trợ giúp (`assisted`) KHÔNG ghi sổ (không phải bằng chứng tự làm — giữ bất biến game). Đề xuất viết `correct && !assisted` dễ hiểu thành ghi 0; tôi chọn bỏ hẳn.
4. Mom: câu có mã `cau_N` (app tự đánh số) KHÔNG ghi — không định danh được câu nào, sẽ trộn nhiều câu khác nhau thành một qid; nhãn chuyên đề "Hoá học" (chữ điền tạm của app Mom) bị bỏ. GĐ 5 sửa 1-click để có qid thật.
5. **Phát hiện dữ liệu thật**: cả **189/189** bài khắc phục đã nộp có `so_cau = 0` — phiếu `sua_loi_*` do máy em tự sinh chưa bao giờ được đẩy lên R2 nên máy chủ không có đáp án để chấm (điểm nộp cũ vẫn 0/0). Sổ chấm bằng tờ kho theo qid (như BTVN) — điểm nộp cũ KHÔNG đổi. Đề xuất "`isAnswerCorrect` vs `phieu/*.json`" không áp dụng được.
6. BTVN: sổ chấm bằng CHÍNH `gradeHomework` hiện hành. Chênh lệch có sẵn với `btvn_em.so_cau` (đo 19/09): tổng sổ 11.330 vs Σ so_cau 11.465 (−135). Nguyên nhân gốc: `homeworkQuestions` (thêm sau) loại câu Phần III đáp án mô tả dài (tờ DH-11-C2-B4: 80 câu → 78) và loại hẳn tờ `-VD/-DT` (bài 174817-mu5ht5qq / em 12026, 27 câu → 0 dòng; `gradeHomework` báo "Chưa tải được đáp án"). Không phải lỗi ghi sổ; đây là số câu mà bộ chấm hiện hành coi là chấm được.
7. Không sửa test nào đang xanh. Chỉ một lần suýt vỡ: `tests/btvn-len-bang-1409.test.ts:255` khoá NGUYÊN VĂN dòng `homeworkKeys(await homeworkQuestions(env,chuoi(bt.ma_de)))` trong `goi-cu.ts` (bất biến "chấm và hồ sơ dùng chung một hàm đọc đáp án"); tôi trả nguyên dòng và dựng sự kiện từ kết quả `gradeHomework` (`suKienTuKetQuaCham`) thay vì tách dòng.
8. Cảnh báo giới hạn: lệnh nạp lại đếm ngân sách theo số LƯỢT GỌI tờ đề (30/lượt), `homeworkQuestions` với danh sách nhiều tờ có thể đọc nhiều hơn số đó — chưa gặp vấn đề ở 261 em.

### GĐ 1 — Hồ sơ `nam_kt_cau` / `nam_kt_dang`  ·  XONG (19/09, Worker `0f351ade`, commit `7f7f3d1`)
- [x] `server/src/ho-so-cau-hinh.ts` một nguồn (MOC_ON=[1,3,7] ngày, SO_MOC_KHAC_PHUC=3, SO_CAU_DU_TIN=4, NGUONG_DANG_YEU=0,7, TRAN_LAP_MOT_CAU=3, SO_LAN_SAI_DAY_LAI=3) + test soi không lệch  | bằng chứng: `tests/ho-so-nam-kt-1909.test.ts` — MOC_ON = `CAU_HINH_CHAN_DOAN_MAC_DINH.MOC_ON`; SO_CAU_DU_TIN = số đọc nguyên văn từ `HoSoEmView.tsx`; không tệp máy chủ nào khác tự `const MOC_ON =…`.
- [x] `phatLaiSuKien` thuần (hàm không đọc đồng hồ) + migration `server/migration-1909-ho-so.sql` (2 bảng + 3 chỉ mục, chỉ thêm), chạy `--remote`  | bằng chứng: `sqlite_master` → 5 đối tượng mới. Dựng lại từ sổ: `dungLaiHoSo` (xoá + chèn một giao dịch), `/ho-so/dung-lai` (≤ 50 em), `/ho-so/xem`, `/ho-so/do-phu-dang`.
- [x] NGHIỆM THU GĐ 1 — ĐẠT: (a) phát lại 2 lần → cùng JSON, và KHÔNG phụ thuộc thứ tự dòng đầu vào (đảo/xáo cũng ra cùng); trên D1 THẬT: dựng cho 261 em hai lần liên tiếp → mọi tổng cột giống hệt (`n_cau=14932`, `n_dang=6643`, `Σlan_gap/lan_sai/lan_trong/dung_lien_tiep = 23161/4455/2401/13255`); Σlan_gap = 23.161 = đúng số dòng sổ. (b) sai 20/09, đúng 21/09, 22/09, 25/09 → `da_khac_phuc`, mốc từng bước 21/09 → 22/09 → 25/09 → 02/10 (test từng bước). (c) đúng 3 lần trong 21/09 → `dung_lien_tiep = 1`. Thêm: ranh giới ngày VN (23:30 vs 00:30), sai lại về mốc 1 + hạ bậc dạng, trống ≠ sai, `can_day_lai`, đã khắc phục rồi sai lại.
- [x] Đo độ phủ mã dạng trên kho thật  | bằng chứng: `POST /ho-so/do-phu-dang` → **2041/2044 qid = 99,9%** có mã dạng thật (`game_v2_question.dang`), 0 chỉ có chuyên đề, 3 không có gì. Rủi ro "độ phủ mã dạng chưa đo" của đề xuất mục 6: KHÔNG xảy ra ở dữ liệu hiện tại.
- [x] Toàn bộ vitest không tăng đỏ  | bằng chứng: `npx vitest run` → **4691 tests, 98 failed | 4592 passed; 43 tệp đỏ = nền**; so danh sách tệp đỏ: MỚI ĐỎ [] · HẾT ĐỎ []. Test tệp GĐ 1: **25 passed (25)**.
- [x] Phát hành + ghi sổ  | bằng chứng: chỉ Worker (theo điều phối 0.Planer): `DAY-MAY-CHU.command` — chốt ca thi "SẠCH 8 ca" — Worker **`0f351ade`**. Lùi: `git revert 7f7f3d1` rồi `./DAY-MAY-CHU.command` (hai bảng mới cứ để nguyên).

**Số liệu hồ sơ thật lần dựng đầu (19/09 12:40):** 261 em · 14.932 (em, câu) · 6.643 (em, dạng). Trạng thái câu: `chua_thay_sai` 9.368 · `moi_sai` 4.519 · `dang_on` 952 · `da_khac_phuc` 93 · `can_day_lai` 46. (`da_khac_phuc` mới 93 vì cần ≥ 3 NGÀY đúng khác nhau — dữ liệu mới có 8 ngày, đúng như đề xuất mục 6 đã báo.)

**Ghi nhận / lệch với đề xuất:**
1. Thêm 3 cột cho `nam_kt_dang`: `so_moi_sai`, `so_chua_thay_sai`, `moc_moi_sai` — đề xuất mô tả định nghĩa "dạng yếu" (tỉ lệ + câu `moi_sai` tới hạn) nhưng không liệt kê đủ cột để tính nó từ bảng; thiếu thì phải quét lại `nam_kt_cau` mỗi lần hỏi.
2. `so_sai` của dạng = số CÂU từng sai (`lan_sai > 0`), không phải tổng lượt sai; `so_gap` = số câu KHÁC NHAU đã gặp. Hai số này là mẫu số/tử số của "dạng yếu".
3. Bậc dạng bắt đầu ở "hiểu" (1) như `lich-on-lai.ts`; mỗi lần đúng ở NGÀY MỚI của một câu bất kỳ trong dạng thì nâng 1 bậc, mỗi lần sai hạ 1 bậc, kẹp [0, 2]. Đề xuất chỉ ghi "nâng/hạ 1 bậc" — chưa nói bậc đầu và đơn vị; đây là chỗ đáng xem lại khi có dữ liệu thật vài tuần.
4. Câu `chua_thay_sai` cũng có `moc_on_ke` (như công thức đề xuất). GĐ 2 KHÔNG đưa chúng vào hàng ôn (chỉ câu từng sai), vì ôn giãn cách cho câu chưa từng sai sẽ làm ngày nào cũng ngập.

### GĐ 2 — Kế hoạch ngày `ke_hoach_ngay`  ·  XONG (19/09, Worker `b1cba8d3` sau bản vá SBD bịa, commit `d73fe93`)
- [x] `server/src/ke-hoach-ngay.ts` thuần (EDF, kiểm khả thi, bù, cổng, nhãn) + `ke-hoach-ngay-d1.ts` (đọc gộp 50 em/lô, dựng lại hồ sơ khi sổ đổi, lưu, chốt ngày, cron) + bảng `ke_hoach_ngay` + `POST /hs/ke-hoach-ngay` + `POST /hs/thoi-gian-hoc` + cron 00:01 VN + `POST /ke-hoach/chay-ca-lop` (thầy)  | bằng chứng: `tests/ke-hoach-ngay-1909.test.ts` → **44 passed (44)**; migration `migration-1909-ke-hoach.sql` chạy `--remote` (3 đối tượng mới).
- [x] NGHIỆM THU GĐ 2 — ĐẠT (kiểm bằng test trên SQLite thật + hàm thuần; xem "giới hạn kiểm chứng" ngay dưới):
  · em có 2 BTVN (30 câu hạn 2 ngày, 42 câu hạn 14 ngày): lô bài hạn gần đứng TRƯỚC (dù khai báo ngược); phần câu/ngày bài 14 ngày đè lên bài khác = ⌈42/14⌉ = **3 < 42/7 = 6** (đúng < 1/7 số câu còn lại), và `taiKhac` của bài hạn gần chính là 3, không phải cả 42 câu;
  · cùng đầu vào → cùng JSON (hai lần liên tiếp, và đảo/xáo thứ tự mảng đầu vào vẫn ra cùng JSON);
  · EDF cộng dồn báo số: cần 15 câu/ngày → `khong_kip` + đề xuất tăng tạm; cần 60 → đề xuất gia hạn, việc bắt buộc GIỮ NGUYÊN (`qua_tai +X`, việc mềm bị cắt); cộng dồn 112 câu/5 ngày → cảnh báo đúng bài xa;
  · cổng: việc bắt buộc sau chỉ hiện khi việc trước xong, trừ `khan_cap` (hạn ≤ 24 h/trễ nhịp) luôn hiện; lô chưa tới mốc nằm ở `sapToi`; quá hạn liệt kê riêng, không vào tải;
  · em không có bài: có việc `bu`, tổng bù (+ số câu đã làm hôm nay) ≥ `toiThieuCau`, và **tổng KHÔNG BAO GIỜ vượt mục tiêu ngày** (test quét 24 tổ hợp);
  · thiếu mẫu giây nói thật: "chưa đo được tốc độ (2/5 mẫu)"; hồ sơ mỏng không có gì để bù → cảnh báo `thieu_nguon_bu`, không bịa việc.
- [x] Chạy trên D1 THẬT: `POST /ke-hoach/chay-ca-lop` → **260 em, 6 lô, 14,6 s** (lần hai 7,5 s, vẫn 260 dòng: idempotent). Kế hoạch 19/09: 206 em có việc ôn, 204 có thần thú, **49 em `thieu_nguon_bu`** (hồ sơ mỏng), 48 em chưa đủ mẫu tốc độ, 0 `qua_tai`, 0 lô BTVN (hiện không em nào nợ BTVN còn hạn). Em thật 12001 gọi qua đường công khai: mục tiêu 8, tối thiểu 4, đã làm 2 (1 lên bậc) → bù đúng phần thiếu 2 câu ôn + 6 câu thần thú tuỳ chọn.
- [x] Toàn bộ vitest không tăng đỏ  | bằng chứng: `npx vitest run` → **4764 tests, 98 failed | 4665 passed; 43 tệp đỏ = nền 98/43**; so danh sách tệp đỏ: MỚI ĐỎ [] · HẾT ĐỎ []. `lich-lo-btvn.ts` và `tro-ly-ca-nhan.ts` KHÔNG bị sửa (chỉ import).
- [x] Phát hành + ghi sổ  | bằng chứng: chỉ Worker qua `DAY-MAY-CHU.command` (chốt ca thi "SẠCH 8 ca" cả hai lần): `d378c25` → Worker `9c9660a5`; bản vá `c01148b` (chữ ghiChu/danh sách qid của việc ôn khớp số câu) → Worker **`eb987ca7`**. Lùi: `git revert c01148b d378c25` rồi `./DAY-MAY-CHU.command` (bảng `ke_hoach_ngay` cứ để nguyên; cron chạy hàm cũ không còn gọi kế hoạch).
- [x] Hình dạng JSON của `/hs/ke-hoach-ngay` gửi 0.Planer cho phiên Giao diện nối adapter  | bằng chứng: tin nhắn kèm mẫu thật (che SBD).

- [x] VÁ SAU NGHIỆM THU (0.Planer báo 19/09): `/hs/ke-hoach-ngay` với SBD không tồn tại (`{"sbd":"00000000"}`) vẫn trả `ok:true` và UPSERT một dòng rác vào `ke_hoach_ngay`  | nguyên nhân gốc: đường công khai lấy SBD từ body rồi lập + lưu kế hoạch mà KHÔNG kiểm em có thật. Tái hiện bằng test (đỏ) → sửa `hsKeHoachNgay`: SBD không có trong `hoc_sinh` ∪ `danh_sach` ∪ `luot` (hoặc dài > 40 ký tự) → `{ok:false, error:"Không tìm thấy học sinh"}` và KHÔNG ghi gì (kiểm TRƯỚC mọi thao tác ghi) → chạy lại ĐÚNG test đó xanh. | bằng chứng: commit `d73fe93`, Worker **`b1cba8d3`**; test mới quét 4 SBD bịa (kể cả 200 ký tự và chuỗi SQL) và so ảnh chụp 4 bảng trước/sau = y hệt; test thứ hai: em có thật ở hoc_sinh / danh_sach / luot đều có kế hoạch. Bản sống: `00000000`, `99999999`, `khong-co-that` → `ok:false`; `12001` → `ok:true`; `ke_hoach_ngay` 261 → 261 (không tăng). Toàn vitest: **4766 tests, 98 failed | 4667 passed; 43 tệp đỏ = nền**, MỚI ĐỎ [].
- [x] Dòng rác đã có: đúng **1 dòng** `ke_hoach_ngay` của SBD `00000000` (ngày 19/09, do 0.Planer gọi thử; không có dòng nào của nó trong `su_kien_hoc`/`nam_kt_*`). KHÔNG xoá theo lệnh 0.Planer (không chạy DELETE trên D1 thật); vô hại — không ai đọc, và cron chỉ lập cho `hoc_sinh` nên không lặp lại. 261 dòng = 260 em thật + 1 dòng thử này.
- [x] Ghi chú thay đổi test: 7 test cũ của CHÍNH tệp `tests/ke-hoach-ngay-1909.test.ts` phải đổi dữ liệu mẫu (thêm `themHs`: em có trong `hoc_sinh`) vì chúng dùng SBD `S1`/`S9` chưa từng tồn tại — hợp đồng mới đúng là đường công khai từ chối SBD không có thật. Không sửa test nào của tệp khác, không hạ ngưỡng nào.

**GIỚI HẠN KIỂM CHỨNG (nói thật):** trên D1 thật hiện KHÔNG có em nào nợ BTVN còn hạn nên kịch bản "2 BTVN hạn 2 và 14 ngày" chưa chạy được trên bản sống; nó được kiểm bằng test đi qua `worker.fetch('/hs/ke-hoach-ngay')` trên SQLite thật với lược đồ thật (không tạo bài giả vào hồ sơ học sinh thật). Chuỗi ngày `chuoiDat`/`chốt ngày` mới có dữ liệu thật sau lần cron 00:01 ngày 20/09 đầu tiên (hôm nay mới là dòng đầu tiên của bảng) — chốt ngày đã kiểm bằng test.

**Ghi nhận / lệch với đề xuất:**
1. KHÔNG thêm tham số thứ 5 `phutNgay?` vào `tinhNganSachNgay`: hàm nằm ở `src/lib/tro-ly-ca-nhan.ts`, tệp client mà Pages đóng gói và phiên Giao diện đang chung; sửa nó đổi bundle của app đang chạy. Thay vào đó bộ điều phối GỌI NGUYÊN hàm gốc rồi áp phút/ngày làm trần (chỉ hạ) — cùng hiệu lực, hàm gốc và test của nó không đổi.
2. `btvn_em.ngan_sach_lo` / `tai_khac_lo` (đóng băng lúc giao) là việc của GĐ 3. Ở GĐ 2 `taiKhac` được TÍNH LẠI mỗi lần đọc nên lịch lô có thể trôi theo ngày khi tải thay đổi; đóng băng ở GĐ 3. Chưa em nào thấy lịch này (chưa app nào đọc `/hs/ke-hoach-ngay`).
2b. Ngày làm dở: bù trừ cả số câu ĐÃ LÀM hôm nay (`daLam`). Lô BTVN xong mà chưa gửi đáp án (GĐ 3 mới gửi) thì chưa có sự kiện nên tạm không tính vào `daLam` — chuyển tiếp, hết khi GĐ 3 xong.
3. "Lập lại khi có sự kiện" (giaoBtvn, mom create, mọi handler nộp, suaBtvn): thay bằng ĐỌC-LẬP-LẠI mỗi lần em mở + cron đêm; hồ sơ dựng lại khi số dòng sổ đổi (`so_su_kien`). Lý do: không thêm câu truy vấn nào vào đường nộp (luật "1–3 câu/lệnh"). Đổi lại chưa có "đẩy" tới máy em — máy em phải gọi lại.
4. Trần ôn 40% mục tiêu giữ, CHỈ nới (đúng phần thiếu) khi thần thú không lo nổi (không có dạng yếu, hoặc một lượt 6 câu không vừa ngân sách) — bản đầu để thần thú bội 6 đẩy tổng lên 9 > 8 (lỗi tôi bắt được bằng test quét tổ hợp, đã sửa). Ôn chỉ lấy câu TỪNG SAI (`chua_thay_sai` không vào hàng ôn, kẻo ngày nào cũng ngập).
5. Ôn thi: việc MỀM (prompt hỏi mềm hay bắt buộc, chưa được trả lời; chọn mềm theo đề nghị). Hiện chỉ nói "Ôn cho ca X" 4 câu, CHƯA chọn câu theo chuyên đề của ca (chưa biết chuyên đề ca sắp tới) — GĐ 5/6.
6. Không sinh `game_v2_task` (GĐ 5); nhiệm vụ thần thú do PH đã nhắc thì được ưu tiên trong kế hoạch. `/hs/thoi-gian-hoc` dùng token HS; token phụ huynh là GĐ 5.
7. `cau_hinh.ngay_nghi`: định dạng chưa ai đặt — nhận mảng JSON `["2026-09-21"]` hoặc chuỗi ngày cách nhau dấu phẩy/xuống dòng.
8. Tốc độ đo được của em 12001 chạm sàn 45 giây/câu (14 mẫu): số giây trong sổ hiện chỉ có từ ca thi, và có thể phản ánh chuyện em bấm nhanh; nên xem lại trước khi tin tốc độ để hạ mục tiêu ở GĐ 3+.

### Việc nhỏ: `POST /hs/ca-dang-mo` (0.Planer giao, 19/09)  ·  XONG (Worker `040d3c25`, commit `f815fec`)
- [x] Đường công khai như `/hs/btvn` (`{sbd}` hoặc `{token}`), chỉ trả `{ok, coCaMo, soCa}` — TUYỆT ĐỐI không mã ca, tên ca, mật khẩu, đường dẫn đề  | bằng chứng: `tests/ca-dang-mo-1909.test.ts` → **9 passed (9)**: có ca mở đúng lớp → true (1) / lớp khác → false; hai ca → soCa=2; ca đóng, ca xoá, **ca cờ `mo` nhưng đã quá hạn vào**, chưa tới giờ, bài tập, ca không gắn lớp (NULL và rỗng) → không tính; em không có lớp → false (không đoán); SBD lạ / `x`×200 / thiếu → `ok:false` và ảnh chụp 4 bảng trước/sau y hệt; em đã nộp ca ấy → false, đang làm dở → true; phạm vi khối/chọn theo `hopPhamVi`; JSON đúng 4 khoá (`ok, coCaMo, soCa, serverNow`) và không khớp `/ma_?ca|ten_?ca|mật khẩu|bank|de\//`; token đúng/sai; đúng **2 truy vấn** cho một lượt hỏi dù có 6 ca.
- [x] Luật "đang mở" KHÔNG đặt mới: dùng chính `quyetDinhVaoThi` (đã mở giờ, chưa quá hạn vào, chưa đóng/xoá, em chưa nộp) + `hopPhamVi` (khối/danh sách chọn) — đúng cổng lúc em bấm Vào thi. Khớp lớp = `ca.lop` bằng `lop` của em (`hoc_sinh`, không có thì `danh_sach`). Mã hiện có KHÔNG so lớp ca với lớp em lúc vào thi (cổng thật là danh sách lớp + phạm vi + mật khẩu), nên đây là luật lớp DUY NHẤT của đường này; đã đối chiếu dữ liệu thật: `ca.lop` ∈ {10,11,12}, `hoc_sinh.lop` ∈ {10,11,12,''} cùng khuôn (3 em không có lớp → luôn false).
- [x] Trên bản sống: em thật lớp 11 (`11000`) và lớp 12 (`12000`) → `coCaMo:false, soCa:0` — lớp 12 có 4 ca cờ `mo` nhưng cả 8 ca `mo` đều đã quá hạn vào (đúng thứ luật phải loại). SBD `00000000`/`khong-co`/thiếu/token sai → `ok:false`. Đếm `ma_ca|maCa|tenCa` trong JSON = 0. **CHƯA kiểm được nhánh `coCaMo:true` trên bản sống** (không có ca nào đang mở; thầy đã báo không mở ca mới) — nhánh ấy chỉ có bằng chứng ở test; lớp 10 chưa gọi thử (truy vấn chọn em lớp 10 không trả em nào).
- [x] LỖI TÔI TỰ BẮT được khi viết: `return hsCaDangMo(env, b)` KHÔNG có `await` trong khối `try` nên token sai làm lỗi lọt khỏi `catch` của máy chủ (ném thẳng thay vì trả JSON `ok:false`). Test token-sai bắt được → sửa `return await` → chạy lại đúng test đó xanh.
- [x] Ghi nhận lệch lược đồ có sẵn: bảng `ca` trên D1 thật có 5 cột (`pham_vi`, `danh_sach_chon_json`, `mat_khau`, `de_rieng`, `pham_vi_hoi_lai`) mà KHÔNG tệp `migration-*.sql` nào trong repo tạo ra (thêm tay/đường khác). D1 giả dùng chung (`tests/_d1-that.ts`) tự bổ sung đúng 5 cột đó (kiểm trước để không thêm trùng). Dựng D1 mới từ repo sẽ THIẾU chúng — nên bổ sung một migration ghi lại (ngoài phạm vi lượt này).
- [x] Toàn vitest  | bằng chứng: `4755 tests, 106 failed | 4648 passed; 45 tệp đỏ`. MỚI ĐỎ chỉ 2 tệp của PHIÊN GIAO DIỆN đang sửa dở (`tests/bang-nhiem-vu-1909.test.tsx`, `tests/nhiem-vu-adapter-1909.test.ts`; vỡ ở `nhiem-vu-adapter.ts`: "Cannot read properties of undefined (reading 'daLamCau')"; không import gì từ `server/`; xanh ở lần chạy đầy đủ ngay trước). **BỎ hai tệp đó: đúng 98 test đỏ / 43 tệp, danh sách tệp đỏ y hệt nền** — phần của tôi không thêm đỏ. Đã ghi vào Nhật ký DIEU-PHOI.md và nhắc Code 2 cập nhật hai test cho khớp adapter mới.
- [x] Phát hành  | bằng chứng: `DAY-MAY-CHU.command` (chốt ca thi "SẠCH 8 ca") → Worker **`040d3c25`**. Lùi: `git revert f815fec` rồi `./DAY-MAY-CHU.command`.

### Sau GĐ 2
- [x] Dừng, KHÔNG làm GĐ 3–6  | bằng chứng: không sửa `tro-ly-ca-nhan.ts`, `html-phieu.ts`, `btvn-cho-em.ts`, `StudentPortalScreen.tsx`, `ParentPortalScreen.tsx`; GĐ 3–6 chưa bắt đầu.
- [x] Báo giới hạn dùng còn lại  | bằng chứng: xem báo cáo cuối lượt.

### GĐ 5 — Kênh 4 (thần thú) + Kênh 5 (phụ huynh), PHẦN MÁY CHỦ  ·  ĐANG LÀM (0.Planer giao 19/09 sau khi thầy uỷ quyền trực tiếp; KHÔNG đụng `src/`)
Yêu cầu nhận từ 0.Planer (nguyên văn tóm): "kênh 4: readScope đọc nam_kt_cau, một đồng hồ ôn moc_on_ke, task than_thu sinh từ kế hoạch ngày qua đường nội bộ, chooseSession nhận blocked + now máy chủ; kênh 5: analyzeParent/assign đọc kế hoạch ngày, questionCount = phần dư, ôn tới hạn → dạng yếu đúng bậc → bù kho có lọc, loại qid 3 ngày qua, bỏ sort sao ASC, wrongPool từ nam_kt_cau, daily_ sang ngày thì bỏ, tồn đọng chỉ bài còn hạn, sửa layCauTuKhoDe; test parent-news sửa 12-34, xoá 71-95 — ghi sổ từng dòng. Token phụ huynh sau cùng; chạm luồng đăng nhập thì dừng báo. Bốn việc phải dừng báo: xoá/ghi đè D1, đổi luật chấm điểm, đổi luật vào thi, schema không chỉ-thêm."
- [ ] K4.1 `readScope`: thêm bằng chứng từ hồ sơ (`nam_kt_cau`, nguồn KHÔNG phải ca thi) — câu sai ở BTVN/Mom/khắc phục thành "weak"; bằng chứng ca thi CHƯA công bố vẫn KHÔNG lọt  | bằng chứng: (chưa có)
- [ ] K4.2 mốc ôn của game = `moc_on_ke` của dạng (một đồng hồ) — chỉ đổi đầu vào `chooseSession`, không đổi phần thưởng/`advance`  | bằng chứng: (chưa có)
- [ ] K4.3 `game_v2_task` sinh từ việc `than_thu` của kế hoạch ngày qua đường nội bộ (không qua `parentGame`)  | bằng chứng: (chưa có)
- [ ] K4.4 `chooseSession` nhận `blocked` (qid đã làm hôm nay ở mọi nguồn) + `now` máy chủ  | bằng chứng: (chưa có)
- [ ] K4.5 mọi bất biến `tests/than-thu-v2.test.ts` giữ nguyên + test mới; toàn vitest = nền; đẩy Worker; gọi thử; nhắn 0.Planer  | bằng chứng: (chưa có)
- [ ] K5.1 `analyzeParent`/`assign` đọc kế hoạch ngày: `questionCount` = phần dư, nói rõ lý do bằng số  | bằng chứng: (chưa có)
- [ ] K5.2 thứ tự câu: ôn tới hạn → câu mới cùng dạng yếu đúng bậc → bù kho CÓ lọc chuyên đề/lớp; loại qid có sự kiện 3 ngày qua; bỏ `.sort(sao ASC)`  | bằng chứng: (chưa có)
- [ ] K5.3 `wrongPool` từ `nam_kt_cau` (hết lỗi `cau_N` không khớp qid)  | bằng chứng: (chưa có)
- [ ] K5.4 `daily_` chưa bắt đầu sang ngày mới → bỏ, không tính tồn đọng; tồn đọng chỉ đếm bài CÒN HẠN  | bằng chứng: (chưa có)
- [ ] K5.5 sửa `layCauTuKhoDe` (đòi `c.text && c.dapAnDung` trong khi kho dùng `dap_an`/`dapAn`)  | bằng chứng: (chưa có)
- [ ] K5.6 test `tests/parent-news.test.ts`: sửa dòng 12-34, XOÁ dòng 71-95 (18/24/36 — trái trần 16, thầy đã chấp nhận câu chốt 4) — ghi từng dòng vào sổ + lý do  | bằng chứng: (chưa có)
- [ ] K5.7 toàn vitest = nền; đẩy Worker; gọi thử; nhắn 0.Planer  | bằng chứng: (chưa có)
- [ ] Token phụ huynh (câu chốt 9) — SAU CÙNG; chạm luồng đăng nhập thì dừng báo 0.Planer  | bằng chứng: (chưa có)

### BÀN GIAO CHO PHIÊN SAU (GĐ 3–6 chưa làm; GĐ 5 phần máy chủ hoãn tới khi thầy ra lệnh trực tiếp)
- **Lõi** (`server/src/`): `su-kien-hoc.ts` (MỘT hàm ghi sổ `ghiSuKien`, không bao giờ ném lỗi), `ho-so-nam-kt.ts` (`phatLaiSuKien` thuần + `dungLaiHoSo`), `ke-hoach-ngay.ts` (thuần) + `ke-hoach-ngay-d1.ts` (đọc gộp 50 em/lô, cron), `ho-so-cau-hinh.ts` (MỌI hằng số). Route ở `index.ts`: `/ho-so/*`, `/hs/ke-hoach-ngay`, `/hs/ca-dang-mo`, `/ke-hoach/chay-ca-lop`. Test 4 tệp `tests/{su-kien-hoc,ho-so-nam-kt,ke-hoach-ngay,ca-dang-mo}-1909.test.ts` chạy trên SQLite thật qua `tests/_d1-that.ts`.
- **Bẫy D1:** dùng MỘT tham số `json_each(?)` (D1 chỉ cho 100 tham số); UNION quá ~5 vế → lỗi 7500; `INSERT…SELECT…ON CONFLICT` bắt buộc có `WHERE 1`; một lượt chạy ≤ 1000 truy vấn nên cron gộp 50 em/lô (260 em ≈ 100 truy vấn).
- **Bẫy lược đồ:** bảng `ca` thật có 5 cột (`pham_vi`, `danh_sach_chon_json`, `mat_khau`, `de_rieng`, `pham_vi_hoi_lai`) mà không migration nào trong repo tạo — `_d1-that.ts` tự thêm; dựng D1 mới từ repo sẽ thiếu, cần một migration ghi lại.
- **Bẫy dữ liệu thật:** 189/189 `nop_khac_phuc` có `so_cau=0` (phiếu `sua_loi_*` máy em sinh chưa lên R2) → sổ chấm bằng tờ kho theo qid (`cauTuKhoTheoQid`). `homeworkQuestions` loại Phần III đáp án mô tả dài và tờ `-VD/-DT` nên sổ BTVN ít hơn `btvn_em.so_cau` 135 dòng — KHÔNG phải lỗi. `ke_hoach_ngay` có 1 dòng thử `00000000`, giữ nguyên.
- **Bẫy mã/test:** `tests/btvn-len-bang-1409.test.ts:255` soi NGUYÊN VĂN dòng `homeworkKeys(await homeworkQuestions(env,chuoi(bt.ma_de)))` trong `goi-cu.ts` — đừng tách dòng; route mới trong `index.ts` phải `return await` (không thì lỗi lọt khỏi `catch`); đường công khai phải kiểm SBD có thật TRƯỚC khi ghi.
- **So nền vitest:** `npx vitest run --reporter=json --outputFile=/tmp/x.json` rồi so `testResults[].name` có `status:'failed'` với `docs/nen-vitest-do-1909.txt` (nền 98 test / 43 tệp, đo trước mọi thay đổi 19/09). Khi so, LOẠI `tests/bang-nhiem-vu-1909.test.tsx` và `tests/nhiem-vu-adapter-1909.test.ts` (của phiên Giao diện, có thể đỏ tạm) — bỏ hai tệp đó mà không ra đúng nền thì lỗi là của mình.
- **Phát hành:** chỉ `./DAY-MAY-CHU.command < /dev/null` (có chốt ca thi; mã thoát 1 là do `read` cuối gặp EOF, xem dòng ">>> MÁY CHỦ ĐÃ LÊN"); migration `cd server && npx wrangler d1 execute omr --file=<tệp> --remote -y`. Mã bí mật thầy ở `/Volumes/SSD NGOÀI/kho-de/cau-hinh.json` (header `x-ma-bi-mat`) — không in ra, không ghi vào tệp.
- **Còn nợ:** GĐ 3 (`lo_json`, `chiaCauVaoLo`, máy em gửi `dapAn` của lô — sửa `html-phieu.ts`, bỏ `dapAn` khỏi `#du-nop`, bỏ ba test "3 vòng"), GĐ 4, GĐ 5, GĐ 6, token phụ huynh. Kiểm `ket_qua`/`chuoiDat` của `ke_hoach_ngay` sau lần cron 00:01 ngày 20/09 đầu tiên; chưa kiểm được nhánh `coCaMo:true` của `/hs/ca-dang-mo` trên bản sống.

---

# SỔ VIỆC — 19/09 (chiều) · PHÁT HÀNH CỤC BỘ + ĐỀ XUẤT CÁ NHÂN HOÁ "TIẾN BỘ TỪNG NGÀY"

- [x] Phát hành từ máy thầy theo PHAT-HANH-CUC-BO-1909.md: dọn 3 ref rác + HEAD.lock/index.lock 0 byte trong .git; git pull → f099f32; DAY-TAT-CA.command → Worker lên 02:15Z, Pages `builtAt` 1789784130; migration `migration-1909-lo-btvn.sql` chạy `--remote` thành công, `SELECT lo_da_xong FROM btvn_em LIMIT 1` → 0; curl 3 URL → 200. | bằng chứng: log phiên 19/09 09:15
- [x] Thầy tạo `.claude/settings.local.json` cho phép Bash: 3 tệp .command, npx wrangler, mv/rm .git/*.lock — từ giờ tự deploy không hỏi.
- [x] Quét toàn bộ mã về cá nhân hoá (15 agent, 896 lượt đọc, chạy cả bộ test: 4622 test, 98 đỏ/43 tệp — khớp nền) → 3 phương án thiết kế độc lập → tổng hợp. | bằng chứng: `DE-XUAT-CA-NHAN-HOA-1909.md` (thiết kế), `prompt-ca-nhan-hoa-tien-bo-tung-ngay.md` (prompt chờ lệnh)
- [ ] **CHỜ THẦY**: 11 câu chốt ở mục 5 của DE-XUAT + lệnh `HÃY THỰC THI PROMPT NÀY`. Chưa build gì.

---

# SỔ VIỆC — 19/09 · KHO MỎNG RÚT LẶP THÔNG MINH + DÃN LỊCH BTVN THEO DEADLINE

## Yêu cầu nhận trong phiên này (nguyên văn)

- [ ] "Bạn quét toàn bộ ổ đĩa ngoài đăng nhập mọi thứ, sửa và tự động đẩy lên máy chủ cho tôi"  | bằng chứng: (xem KẸT bên dưới — không có nghĩa hành động nào thực hiện được trong sandbox này)
- [ ] File đính kèm "nhiệm vụ cần sửa — cập nhật 19/09/2026" (5 mục, chép nguyên văn từng mục bên dưới)

## SỰ CỐ TỰ GÂY RA — phải khai ngay đầu, không giấu

Bước đầu phiên tôi dùng `Write` ghi đè thẳng `SO-VIEC.md` mà KHÔNG gọi `Read`
trước — xoá mất 693 dòng lịch sử (lượt 10 → lượt 15/09, nhiều tính năng: BTVN
lên bảng, service worker vá lỗi truy cập, v.v.). Phát hiện qua `git diff
--stat` ngay sau đó (24 insertions, 684 deletions). Đã khôi phục nguyên vẹn
bằng `git show HEAD:SO-VIEC.md`, dán lại y hệt, rồi chèn mục này vào ĐẦU file
theo đúng quy ước "lượt mới nhất nằm trên". Không có dữ liệu nào mất vĩnh viễn
vì bản cũ vẫn nằm trong lịch sử git (đã cam kết ở lượt trước) — chỉ là tôi
suýt làm mất bản trên đĩa. Từ giờ dùng `Edit`/prepend qua lệnh, không `Write`
đè cả file này nữa.

### Mục 1 — Phát hành bản vá "rút đề lẫn chương"
**Nguyên văn cần:** dán lại output `npx wrangler pages deploy dist --project-name=omr-app --branch=main` để kiểm chứng độc lập và đóng mục.
- [!] KẸT: sandbox phiên này KHÔNG có tài khoản Cloudflare (`wrangler whoami` → "not authenticated"), không có `CF_API_TOKEN`. Không tự chạy lệnh deploy Pages được — việc này chỉ thầy chạy được trên máy đã đăng nhập Cloudflare.
- [x] Đối chiếu git: nhánh làm việc TRÙNG 100% với `origin/main` (`git log origin/main..HEAD` rỗng) — code bản vá (2a22f73, d0a4772, 020f2a8) đã nằm trong main. Phần Worker coi như xong; chỉ còn thao tác build+deploy Pages ngoài tầm với của phiên.

### Mục 2 — Rút đề riêng: kho không đủ thì rút lặp thông minh, không cặp học sinh nào trùng quá 2 câu
**Nguyên văn:** "phải sửa triệt để cho tôi rút đề riêng, thay đổi thành nếu kho không đủ thì rút lặp lại tính toán rút lặp lại thông minh để học sinh không bị trùng quá 2 câu."
- [x] PHÁT HIỆN QUAN TRỌNG: thuật toán "chặn trần trùng" (peak-overlap capping) ĐÃ ĐƯỢC XÂY, có test đầy đủ — `src/lib/de-rieng-tran-trung.ts` (`chiaVongTron` pha 1 chia vòng tròn công bằng tần suất + `haDinh` pha 2 đổi chỗ hạ đỉnh trùng), `src/lib/de-rieng-blueprint.ts` (`sinhBoTheoEm` — phân tầng chuyên đề×mức độ, tự hạ mức phân tầng khi kho mỏng), đặc tả `DE-RIENG-CHAN-TRAN-TRUNG.md` (chưa tìm thấy file này trên đĩa — có thể đã mất cùng đợt hoặc chưa từng được ghi riêng, chỉ tồn tại trong SO-VIEC.md cũ). Test `tests/de-rieng-tran-trung.test.ts` + `tests/de-rieng-blueprint.test.ts` + `tests/noi-chan-tran-trung-vao-ca.test.ts` đã có sẵn.
- [x] TRA RÕ: `sinhBoTheoEm` (`ExamMonitorScreen.tsx:799`, lúc bấm "Bắt đầu") chỉ phủ đường "Ca thi" — dựng đề CHUNG cả lớp lúc vào phòng. Đường thầy đang phàn nàn là đường KHÁC: "Đề riêng từng em — Nâng đỡ tiến bộ" (`deRieng` bật ở `KhoiRutDe.tsx`) → `dungDeRiengChoCa` (de-rieng-nguon.ts) → `dungDeRieng` (de-rieng.ts) → TRƯỚC ĐÂY gọi `rutDeCoBatBuoc` RIÊNG TỪNG EM (seed `${ca}:${idxEm}:{sbd}`) cho phần "câu mới" — đúng nguyên nhân sinh ra cảnh hai em trùng gần hết đề khi kho đúng chuyên đề mỏng, y hệt mô tả file nhiệm vụ. | bằng chứng: đọc trực tiếp `de-rieng.ts:309-404` (bản cũ) + `de-rieng-nguon.ts:373-516`.
- [x] SỬA: `dungDeRieng` (de-rieng.ts) viết lại thành hai pha — Pha A giữ NGUYÊN `chonCauLapChoEm` (câu khắc phục cá nhân, không đổi một dòng); Pha B dựng "câu mới" CHUNG CHO CẢ LỚP mỗi phần một lượt bằng `sinhBoMotO` (tái dùng nguyên bộ máy `chiaVongTron`/`haDinh` đã có sẵn + test riêng ở `de-rieng-tran-trung.ts`, KHÔNG viết thuật toán mới). Câu khắc phục của từng em được truyền vào làm `boSan` (tính vào đúng chỉ tiêu) VÀ `khoa` (pha đổi chỗ hạ trùng không bao giờ được rút mất) — mở rộng `chiaVongTron`/`haDinh`/`sinhBoMotO` thêm tham số tuỳ chọn, không phá chữ ký cũ (test `de-rieng-tran-trung.test.ts` + `de-rieng-blueprint.test.ts` vẫn xanh nguyên, không sửa). | bằng chứng: `git diff src/lib/de-rieng-tran-trung.ts src/lib/de-rieng.ts`
- [x] TEST MỚI tái hiện đúng kịch bản kho mỏng: `tests/kho-mong-rut-lap-thong-minh-1909.test.ts` — kho 200 câu · 30 em · 18 câu/em (đúng tổ hợp đã đo đỉnh ≤2 ở `de-rieng-tran-trung.test.ts`), đối chứng với đường CŨ (bốc độc lập qua `rutDeCoBatBuoc`) cho đỉnh cao hơn hẳn (>2) trong khi đường MỚI ≤2; kèm ca biên "câu khắc phục không bị đổi mất dù đang hạ trùng" và "kho siêu mỏng phải báo đúng số thiếu, không im lặng". | bằng chứng: `npx vitest run tests/kho-mong-rut-lap-thong-minh-1909.test.ts` → 7/7 PASS
- [x] `npx tsc -b --noEmit` sạch, không lỗi kiểu.
- [x] Bộ test liên quan trực tiếp de-rieng* (11 file, 188 test): 186 passed, 2 fail — ĐÚNG BẰNG baseline đo lại TRƯỚC KHI sửa (2 lỗi có sẵn: `de-rieng-luc-bat-dau.test.ts`, `danh-dau-cau-hoi-lai.test.ts` — không liên quan tới thay đổi này, không tạo fail mới).
- [x] Toàn bộ bộ test (347 file — 346 gốc + 1 file mới của lượt này): `45 failed | 301 passed | 1 skipped (347)` file, `98 failed | 4495 passed | 11 skipped (4604)` test. KHỚP CHÍNH XÁC con số nền `45 file / 98 test fail` đã ghi nhận trong lịch sử phiên trước (commit d0a4772) — không có fail mới, không có fail nào biến mất bất thường (đã soát: file fail duy nhất trùng tên với de-rieng là `de-rieng-luc-bat-dau.test.ts`, đúng lỗi có sẵn). **MỤC 2 XONG, ĐỦ BẰNG CHỨNG.**

### Mục 3 — Bỏ Vòng 1/Vòng 2, thay bằng dãn lịch thông minh theo hạn (việc lớn, toàn quyền)
**Nguyên văn:** "Tôi muốn bạn bỏ vòng 1 và vòng 2 đi, từ giờ nếu tôi phân bài tập hoặc phụ huynh phân bài tập, khi thuật toán đã phân câu riêng cho học sinh, bạn hãy tính toán theo thời gian dealine tách luôn câu hiển thị lên bảng tin theo ngày hoặc theo giờ dãn cách thông minh hiệu quả cùng với các nhiệm vụ khác để học sinh không bị quá tải mà vẫn hoàn thành dealine hiệu quả, nếu chưa hoàn thành nhiệm vụ trước thì gán nhãn khẩn cấp hơn, chỉ khi nào hoàn thành xong nhiệm vụ trước thì nhiệm vụ mới mới hiển thị." Quyền hạn: toàn quyền hoàn thiện hết rồi đẩy thẳng lên máy chủ, không hỏi lại chi tiết vặt.
- [ ] Bỏ cơ chế Vòng 1/Vòng 2 hiện tại (14 file liên quan đã khoanh vùng: StudentPortalScreen.tsx, tro-ly-ca-nhan.ts, html-phieu.ts, han-bai-tap.ts, bai-tap.ts, btvn-cho-em.ts, btvn-may-chu-moi.ts, Game.tsx, dau-truong-chan-ly.ts, KhungXemPhieu.tsx, BaoCaoCaThi*Modal.tsx, DauTruongChanLy.tsx) | bằng chứng: (chưa có)
- [ ] Thuật toán dãn câu theo ngày/giờ tính ngược từ deadline, xét các nhiệm vụ khác cùng lúc | bằng chứng: (chưa có)
- [ ] Gán nhãn khẩn cấp hơn khi nhiệm vụ trước chưa xong | bằng chứng: (chưa có)
- [ ] Cổng hiển thị: nhiệm vụ mới chỉ hiện khi nhiệm vụ trước đã hoàn thành | bằng chứng: (chưa có)
- [!] KẸT: `git stash list` rỗng, `git fsck --unreachable` không tìm commit lơ lửng nào. Container phiên trước đã bị thu hồi (môi trường ephemeral) — hai bản `git stash` "WIP Thread C nộp riêng" và "Thread B" nêu trong file nhiệm vụ KHÔNG CÒN trong checkout này, không khôi phục được từ đây. Sẽ thiết kế lại hành vi (khoá nộp, xác nhận nộp) từ mô tả yêu cầu, không có code cũ để gộp.
- [ ] Test hồi quy đầy đủ trước khi phát hành | bằng chứng: (chưa có)
## THIẾT KẾ KHOÁ (giả định dùng để làm, không hỏi lại) — "LÔ THEO NGÀY/GIỜ" thay Vòng 1/2/3

**Đã tra kiến trúc cũ:** "3 Vòng Phân Tầng" (`bai-tap.ts` `phanTangBtvn`/`MO_TA_VONG_BTVN`) là phân loại câu theo ĐỘ KHÓ (Vòng 1 Lõi bắt buộc, Vòng 2 Trọng tâm cá nhân bắt buộc, Vòng 3 Thử thách 2 sao thưởng x2 EXP, không bắt buộc), hiển thị dần trong CÙNG một phiếu qua `soCauSang` (45%→80%→100%, `btvn-cho-em.ts`). Vòng 2 có hạn mềm = xong Vòng 1 + 24h (`han-bai-tap.ts` `tinhHanVong2`), mốc `xong_vong1_luc` ghi ở server (`server/src/index.ts` `xongVongBtvn`, cột `btvn_em.xong_vong1_luc`). **Server KHÔNG hề giới hạn câu gửi về** (`btvnCuaEm` luôn trả `homeworkQuestions` đầy đủ) — việc "hiện dần" là quyết định THUẦN PHÍA CLIENT (`dungPhieuBtvn`/`soCauSang`), không phải cổng an toàn. Khớp với tiền lệ đó, thiết kế mới cũng để CLIENT tính lịch, SERVER chỉ giữ đúng một con số tiến độ.

**Bỏ:** toàn bộ khái niệm Vòng 1/Vòng 2/Vòng 3 theo % câu và hạn mềm 24h cố định.

**Thay bằng "Lô theo ngày/giờ":**
1. Thuần hàm mới (`src/lib/lich-lo-btvn.ts`), input: `soCau`, `giaoLuc`, `hanNop`, và `taiKhac` (tổng số câu học sinh đang nợ ở CÁC nhiệm vụ khác — tái dùng đúng khái niệm `tinhNganSachNgay` đã có ở `tro-ly-ca-nhan.ts`, không đẻ ngân sách thứ hai).
2. Khung thời gian (giaoLuc→hanNop) ≥ 24h ⇒ dãn theo NGÀY (mỗi lô cách nhau ~1 ngày); < 24h ⇒ dãn theo GIỜ. Số câu mỗi lô co giãn NGƯỢC với `taiKhac` (nợ nhiều nhiệm vụ khác thì lô nhỏ lại, giãn dài hơn), kẹp trong biên tối thiểu/tối đa để không đẻ ra lô 1 câu hay lô cả trăm câu; số lô KHÔNG BAO GIỜ vượt số ngày/giờ trong khung — kho phải xong đúng hạn hơn là đúng nhịp.
3. Trạng thái CHỈ CẦN một số nguyên `lo_da_xong` (số lô đã hoàn thành, mặc định 0) — KHÔNG cần lưu mốc mở từng lô, vì "lô i mở" là hàm THUẦN của lịch (bước 1) + `lo_da_xong`, tính lại lúc nào cũng ra cùng một kết quả (tất định, đúng tinh thần dự án).
4. CỔNG: lô i+1 chỉ hiện khi `lo_da_xong > i` VÀ đã tới mốc ngày/giờ dự kiến của lô i+1 — hoàn thành sớm không mở sớm lô sau (đúng nghĩa "dãn cách", không phải "làm nhanh thì được dồn hết"). Nhãn khẩn cấp tăng dần khi mốc dự kiến của lô ĐANG CHỜ đã qua mà `lo_da_xong` chưa tới, và tăng gấp khi gần `hanNop` chung.
5. Server: migration mới thêm CỘT `lo_da_xong INTEGER NOT NULL DEFAULT 0` vào `btvn_em` (không đụng cột cũ, giữ nguyên `xong_vong1_luc` làm dữ liệu lịch sử, không đọc nữa). Thêm endpoint `/btvn/xong-lo` (kiểu COALESCE/increment như `xongVongBtvn` cũ, idempotent) thay cho `/btvn/xong-vong`.
6. Giữ lại "câu Thử thách" (2 sao, thưởng x2 EXP) làm một LÔ TUỲ CHỌN cuối cùng, mở ngay sau khi hết mọi lô bắt buộc (không bị dãn cách, không bắt buộc) — giữ nguyên phần thưởng EXP đã có ở Game.tsx/dau-truong-chan-ly.ts, chỉ đổi tên gọi từ "Vòng 3" sang "Lô thử thách".
7. Thread B/C cũ (nút nộp riêng theo vòng) gộp vào: MỖI LÔ có nút "Nộp lô này" riêng (khoá nộp + xác nhận, đúng hành vi Thread C mô tả), không phải nộp toàn bài một lần — khớp đúng "nhiệm vụ mới mới hiển thị" nghĩa là mỗi lô là một nhiệm vụ nộp độc lập.

**File sẽ đụng tới:** `server/src/index.ts` (+ migration mới), `src/lib/lich-lo-btvn.ts` (mới), `src/lib/bai-tap.ts` (bỏ phanTangBtvn/tinhTienDoThongMinh kiểu vòng, hoặc giữ lại cho phần "câu khó ưu tiên" nhưng tách khỏi khái niệm vòng), `src/lib/han-bai-tap.ts` (bỏ tinhHanVong2), `src/lib/tro-ly-ca-nhan.ts` (thay khối sinh candidateTasks Vòng1/Vòng2), `src/lib/btvn-cho-em.ts` + `src/lib/btvn-may-chu-moi.ts` (đổi soCauSang/vongHienTai → theo lô, đổi xongVongBtvn → xongLoBtvn), `src/components/KhungXemPhieu.tsx`, `src/game/than-thu-hoa-hoc/dau-truong-chan-ly.ts` (đổi nhãn, giữ thưởng).

- [x] Viết `src/lib/lich-lo-btvn.ts` (thuần, không mạng, không đọc Date.now()) + `tests/lich-lo-btvn-1909.test.ts` | bằng chứng: `npx vitest run tests/lich-lo-btvn-1909.test.ts` → 13/13 PASS
- [x] Migration `server/migration-1909-lo-btvn.sql` (thêm `btvn_em.lo_da_xong`, không đụng cột cũ) + endpoint mới `xongLoBtvn`/`/btvn/xong-lo` (server/src/index.ts, thay `xongVongBtvn`/`/btvn/xong-vong`) — CÓ PHÒNG VỆ khi migration chưa chạy (try/catch báo lỗi rõ, không sập cả API); `btvnCuaEm` trả thêm `loDaXong`; `hsBtvn` (goi-cu.ts) đổi cột đọc + phòng vệ tương tự; reset BTVN (`suaBtvn`) reset thêm `lo_da_xong=0`. | bằng chứng: `npx vitest run tests/vong-2-han-mem.test.ts` → 11/11 PASS (server test dùng `worker.fetch` trực tiếp)
- [x] Nối vào `tro-ly-ca-nhan.ts` (candidateTasks BTVN + radar dùng lô, xoá nhánh Vòng 1/Vòng 2), `btvn-cho-em.ts` (`dungPhieuBtvn` tự tính lịch lô, MỘT nguồn duy nhất cho mọi màn mở phiếu), `html-phieu.ts` (ngưỡng auto-detect theo lô, postMessage `ddh-btvn-xong-lo`), `KhungXemPhieu.tsx` (nhận postMessage mới, gọi `xongLoBtvn`), `btvn-may-chu-moi.ts` (`xongLoBtvn` thay `xongVongBtvn`), `han-bai-tap.ts` (xoá `tinhHanVong2`/`NGAN_SACH_VONG2_MS` — dead code sau khi bỏ vòng). **Không đụng** `bai-tap.ts` (phân loại câu theo ĐỘ KHÓ Lõi/Trọng tâm/Thử thách) và nhãn "Vòng 1/2/3" trên thẻ câu/badge độ khó — đó là trục KHÁC (phân loại nội dung), không phải trục thời gian bị yêu cầu bỏ; giữ nguyên đúng phạm vi thầy nêu ("bỏ vòng 1 và vòng 2" gắn với "theo thời gian deadline"). | bằng chứng: `npx tsc -b --noEmit` sạch
- [x] Dọn test cũ khớp hành vi mới: `tests/vong-2-han-mem.test.ts` viết lại hoàn toàn (giữ tên file cho liền mạch git), `tests/btvn-phan-tang-va-1click.test.ts`, `tests/tro-ly-ca-nhan.test.ts`, `tests/han-bai-tap-va-ke-hoach.test.ts`, `tests/ke-hoach-giao-dien.test.tsx` cập nhật đúng payload/nhãn mới (`Làm Lô N`, payload chỉ còn `{bt}`). | bằng chứng: từng file chạy PASS riêng lẻ, xem dòng dưới
- [x] Test hồi quy toàn bộ (348 file, 4617 test) SAU KHI sửa 2 chỗ vỡ (`tests/han-bai-tap-va-ke-hoach.test.ts`, `tests/ke-hoach-giao-dien.test.tsx` — cả hai gãy vì đổi payload/nhãn nút "Làm Vòng N" → "Làm Lô N", đã sửa đúng theo hành vi mới): `45 failed | 302 passed | 1 skipped` file, `98 failed | 4508 passed | 11 skipped` test — `diff` DANH SÁCH FILE FAIL với nền mục 2 (`comm -13`/`comm -23`) ra RỖNG CẢ HAI CHIỀU: không file fail nào mới, không file fail nào biến mất. **MỤC 3 XONG, ĐỦ BẰNG CHỨNG.** | bằng chứng: `/tmp/full-test-run-3.log` + lệnh `comm` đối chiếu

**CẦN THẦY LÀM MỘT BƯỚC SAU KHI PHÁT HÀNH (không tự làm được, không có quyền D1):**
```
npx wrangler d1 execute omr --file=server/migration-1909-lo-btvn.sql --remote -y
```
Có phòng vệ nếu quên: `hsBtvn`/`xongLoBtvn` bắt lỗi cột thiếu, KHÔNG sập cả API — chỉ riêng tiến độ lô chưa lưu được và nút "Cho làm lại" (reset BTVN) báo lỗi rõ ràng cho tới khi chạy migration này. Chạy càng sớm càng tốt để tính năng lô hoạt động đầy đủ.

- [x] Đã commit (21d88c5) + push lên nhánh `claude/scan-external-drive-push-server-wq0aot` + merge fast-forward vào `main` + push `main` (đúng quy trình thầy chốt ở mục 1) — code mục 2 VÀ mục 3 đã nằm trên `main`.
- [!] KẸT (ngoài phạm vi phiên, cần thầy xử lý): GitHub Actions "Phát hành lên Cloudflare Pages" vẫn báo thiếu `CLOUDFLARE_API_TOKEN` ở LẦN CHẠY THỨ BA liên tiếp (run #411, #412 sau khi thầy báo đã thêm secret, #413) — cùng một lỗi y hệt. Đã hướng dẫn thầy các bước thêm secret ở mục 1, đang chờ thầy gửi ảnh chụp đúng trang Settings → Secrets and variables → Actions → "Repository secrets" để đối chiếu tên secret. Migration D1 (`migration-1909-lo-btvn.sql`) cũng cần thầy tự chạy vì phiên này không có quyền D1.

### Mục 4 — "Gửi bị treo" / "Làm mới xoay vô hạn" (còn nợ)
- [ ] Điều tra riêng nếu còn tái diễn sau khi bản vá mục 1 lên | bằng chứng: không có ca tái hiện thật trong phiên này để điều tra — để nguyên trạng thái "còn nợ" như file nhiệm vụ ghi.

### Mục 5 — Thread B BTVN Vòng 3 nộp riêng (gộp vào mục 3)
- [x] Xác nhận không còn stash để gộp riêng (xem KẸT mục 3) — xử lý cùng lúc với mục 3.

---

# SỔ VIỆC — 14/09 lượt 12 · VIẾT LẠI THUẬT TOÁN PHÂN CÔNG LÊN BẢNG

- [ ] "viết lại thuật toán phân công bên bảng"  | bằng chứng: (chưa có)
- [ ] "box chọn bài bạn cho hiển thị đầy đủ số câu trong kho đề"  | bằng chứng: (chưa có)
- [ ] "Khi tick chọn học sinh ưu tiên phân công câu 2 sao trước rồi đến 1 sao"  | bằng chứng: (chưa có)
- [ ] "lấy tất cả mọi dữ liệu của học sinh, từ bài thi, bài tập về nhà, khắc phục câu sai đóng gói lại để phân bổ câu gọi lên bảng cho hợp lý"  | bằng chứng: (chưa có)
- [ ] "trong 90 phút danh sách lớp phải có ít nhất 20 em được lên bảng, tính toán chữa câu khó và câu dễ đan xen gọi học sinh phù hợp"  | bằng chứng: (chưa có)
- [ ] "số câu khó và quan trọng nhất phải được chữa hết, số câu còn lại chỉ cần đọc đáp án"  | bằng chứng: (chưa có)
- [ ] "số câu còn lại chưa được chữa được chiếu đáp án lên bảng qua mục máy chiếu"  | bằng chứng: (chưa có)
- [ ] Nghiệm thu 7 cửa + phát hành  | bằng chứng: (chưa có)

## Vì sao bản cũ không đạt 20 em

Cấu hình cũ: 80 phút, hao phí 480 giây, còn 4.320 giây để chữa.
Lane L3 (em lên bảng) giá CỐ ĐỊNH 420 giây, trần 8 em.

20 em × 420 giây = 8.400 giây — gấp đôi ngân sách. Không có cách nào đạt
nếu mỗi em lên bảng đều tốn bằng nhau. Đó là lý do trần đặt 8.

## Phép tính mới — 90 phút, giá lên bảng theo ĐỘ KHÓ

5.400 − 480 = 4.920 giây chữa.

| Loại câu | Giây lên bảng | Vì sao |
|---|---|---|
| 2 sao (khó, quan trọng) | 300 | em làm + thầy chốt bẫy |
| 1 sao | 180 | em làm, thầy chốt một câu |
| 0 sao | 120 | gọi nhanh, chữa gọn |

Ví dụ 6 câu 2 sao + 8 câu 1 sao + 6 câu 0 sao = 20 em:
6×300 + 8×180 + 6×120 = 3.960 giây. Còn 960 giây đọc đáp án cho phần còn lại
(L0 5 giây, L1 20 giây mỗi câu) — thừa sức cho vài chục câu.

⇒ 20 em ĐẠT ĐƯỢC, với điều kiện có đủ câu. Thiếu câu thì nói thẳng thiếu bao
nhiêu và cần tích thêm bao nhiêu bài, KHÔNG bịa ra số em.

## Việc phải làm

A. Máy chủ: lệnh gói hồ sơ cả lớp trong MỘT lượt gọi — bản đồ câu sai
   (`ban_do_sai`), câu đã làm (`qid_da_lam`, gồm cả BTVN và khắc phục),
   bảng mạnh–yếu (`tien_do_hs`), lịch sử lên bảng (`len_bang`).
B. Máy thầy: gộp thành một hồ sơ đầy đủ cho mỗi em.
C. Thuật toán mới: xếp buổi chữa theo hai tầng — câu khó chữa hết, câu còn lại
   đọc đáp án; bảo đảm số em lên bảng tối thiểu.
D. Hộp chọn bài: hiện đủ số câu trong kho (bỏ khử trùng ở tầng HIỂN THỊ, chỉ
   khử trùng khi DỰNG danh sách chữa).
E. Tờ máy chiếu: thêm trang ĐÁP ÁN cho những câu chỉ đọc, không chữa.

---

# LƯỢT 10 — BÀI TẬP VỀ NHÀ LÀM CĂN CỨ GỌI LÊN BẢNG (14/09)

- [x] "khi phân công học sinh chiếu lên bảng, bạn sử dụng dữ liệu nộp bài tập về nhà, vì tôi lấy đúng file giao về nhà cho học sinh để gọi lên bảng"  | bằng chứng: `hoSoLopLenBang` đọc `btvn_em.dap_an_json` đối chiếu kho; `TRONG_SO.BTVN_CHINH_CAU = 0,34` là trọng số NẶNG NHẤT trong `diemHopCau`; `npx vitest run tests/btvn-len-bang-1409.test.ts` → 25/25
- [x] "phải hiển thị được học sinh đó làm bao nhiêu câu về nhà/tổng số câu, bao nhiêu câu làm đúng, bao nhiêu câu làm sai, bao nhiêu câu chưa làm"  | bằng chứng: cùng tệp test, mục "bốn con số thầy hỏi ra ĐÚNG bảng tính tay"; hiện ở 3 nơi — dòng phân công, dòng tổng cả lớp, tờ máy chiếu
- [x] "câu bạn đó được phân lên bảng thì đã làm ở nhà là đúng hay sai hay chưa làm"  | bằng chứng: thẻ `<TheBtvn>` trên màn, `mc-btvn-*` trên tờ chiếu, `[về nhà làm SAI]` trong bảng copy
- [ ] Nghiệm thu 7 cửa + phát hành  | bằng chứng: (chưa có)

## NGUYÊN NHÂN GỐC — vì sao không thể đọc thẳng con số có sẵn

`btvn_em` chỉ ghi TỔNG `so_dung` và `so_cau`. Suy ngược ra "sai mấy câu, chưa
làm mấy câu" từ hai số ấy là BỊA, vì lúc chấm (`nopBtvnQuaPhieu`) `qidSai`
GỘP câu bỏ trống vào câu sai — đúng thứ thầy cần tách ra.

Đường đúng duy nhất: `dap_an_json` giữ nguyên bài làm của em. Đối chiếu với
đáp án trong kho, TỪNG CÂU MỘT, là ra ba trạng thái rời nhau.

## Đã làm

1. `dapAnTheoMaDe(env, maDeCsv, boNho)` — MỘT hàm đọc đáp án, dùng chung cho
   CHẤM bài và cho HỒ SƠ lên bảng. Trước đây khối đọc ấy nằm trong
   `nopBtvnQuaPhieu`; tách ra để hai nơi không bao giờ lệch nhau một câu.
2. `hoSoLopLenBang` thêm truy vấn thứ 5 (`btvn_em` JOIN `btvn`), lấy 4 lượt
   giao gần nhất, LƯỢT MỚI ĐÈ LƯỢT CŨ, trả `HoSoBtvnEm`.
3. `diemHopCau` xếp lại trọng số: bài tập về nhà của CHÍNH câu ấy nặng nhất
   (0,34) vì thầy lấy đúng tờ đề giao về nhà làm đề gọi lên bảng.
   sai 1,0 · chưa làm 0,8 · đúng 0 (gọi lại em đã làm đúng là đốt giờ bảng).
4. `DongChua.em` giữ nguyên hồ sơ em thay vì cắt còn tên + số báo danh.
5. Hiện ở ba nơi: dòng phân công, dòng tổng cả lớp, và tờ máy chiếu.

## Giả định đã dùng

- Chỉ tính 4 lượt giao gần nhất (`TRAN_LUOT_BTVN`). Bài tháng trước không nói
  gì về buổi chữa hôm nay, mà mỗi lượt là thêm một lần chạm R2.
- Câu KHÔNG nằm trong bài giao về nhà thì KHÔNG hiện nhãn, và cộng 0 điểm —
  khác hẳn "chưa làm". Hiện nhãn "chưa làm" cho câu chưa từng giao là bịa.

---

# LƯỢT 11 — APP HỌC SINH & PHỤ HUYNH KHÔNG TRUY CẬP ĐƯỢC (14/09)

- [x] "app học sinh và phụ huynh lại không truy cập được. Bạn phải tìm cách để hiện tượng này không lặp lại nữa."  | bằng chứng: `sw.js` trên máy chủ nay KHÔNG còn `registration.unregister()`, không xoá sạch kho, không ép điều hướng (đo từ tab khác gốc); chốt tự sửa đã lên; `kiem-sw.mjs` ĐẠT 10/10; bản phát hành Pages `75136d05`, commit `14037b8`

## NGUYÊN NHÂN GỐC — đo được, không đoán

Bản `sw.js` ĐANG CHẠY THẬT chứa đoạn tự huỷ:

```
if (serverTs > SW_BUILT_AT + 2) {
  const keys = await caches.keys()
  await Promise.all(keys.map(k => caches.delete(k)))   // xoá CẢ precache vừa nạp
  await self.registration.unregister()                  // gỡ, nhưng VẪN đang điều khiển tab
  for (const client of clients) client.navigate(client.url)  // ép đi qua chính nó
}
```

Điều kiện `serverTs > SW_BUILT_AT` KHÔNG hiếm — nó đúng với MỌI em quay lại
sau MỖI lần phát hành. Nhánh ấy xoá kho precache workbox vừa nạp trong chính
lượt activate ấy, rồi ép điều hướng qua chính SW đó vào kho rỗng ⇒
`Response.error()` ⇒ ERR_FAILED. Đó là lý do lỗi LẶP LẠI sau mỗi bản.

Đo lúc truy: Pages trả 200, Worker trả 200 (71 ms), `/hs/dang-nhap` trả đúng
— nghĩa là máy chủ không hỏng. Hỏng nằm ở service worker trên máy em.

## Đã sửa — ba lớp

1. `src/sw.ts`: thấy máy chủ có bản mới thì `registration.update()` + nhắn
   cho tab. Không xoá kho, không tự gỡ, không ép điều hướng. Thêm: tầng
   precache trượt thì gọi bản mới về ngay, nhưng vẫn trả trang cho em.
2. `index.html`: sau 9 giây mà `#root` còn rỗng thì gỡ SW, xoá kho, nạp lại
   kèm `_moi=`. CHỈ MỘT LẦN mỗi tab. Chốt này KHÔNG cần biết nguyên nhân,
   nên nó chặn cả nguyên nhân lần sau — đây mới là phần "không lặp lại nữa".
3. `scripts/kiem-sw.mjs`: 4 phép mới đọc `dist/sw.js` bản THẬT. Trượt là
   `DAY-TAT-CA.command` dừng, không đẩy.

## Nghiệm thu sau phát hành (đo từ tab Cloudflare, KHÁC gốc app)

| Việc | Kết quả |
|---|---|
| `registration.unregister()` trong sw.js | KHÔNG còn |
| xoá sạch CacheStorage | KHÔNG còn |
| ép tab điều hướng | KHÔNG còn |
| `registration.update()` + báo tab | CÓ |
| chốt tự sửa trong index.html | CÓ |
| 142 mục precache | 0 mục hỏng |
| tài nguyên index.html trỏ tới | 0 mục hỏng |
| máy đã có SW CŨ mở lại app | `#root` có nội dung, kho precache CÒN NGUYÊN, chốt tự sửa KHÔNG phải chạy |

## CÒN TREO — KHÔNG PHẢI VIỆC CỦA LƯỢT NÀY

- [!] `npm run check:mau`: 90 mã màu ngoài tokens.css, TẤT CẢ nằm trong 6 tệp
  `src/game/giai-cuu-cong-chua/*` của phiên Claude khác, chưa theo dõi git.
  Không đụng vào, không đưa vào commit này.
- [!] Bản Pages vừa đẩy DỰNG TỪ CÂY LÀM VIỆC nên có mang theo mã game đang
  làm dở của phiên kia (`ThanThuHoaHocGame`, `giai-cuu-cong-chua`,
  `public/cai-app*`). Không nằm trong commit `14037b8`.

---

# LƯỢT 12 — RÀ SOÁT 3 APP · KHOÁ VAI · TỐI ƯU (14/09)

- [ ] "rà soát toàn bộ 3 app, tự động sửa nếu phát hiện lỗi"  | bằng chứng: (chưa có)
- [ ] "Tối ưu mọi thứ từ tốc độ tới sự hoạt động ổn định, mượt mà"  | bằng chứng: (chưa có)
- [ ] "Link của 3 app bạn hãy bọc hay làm gì đó để đảm bảo 100% không nhảy lẫn lộn"  | bằng chứng: (chưa có)

## Đo được trước khi sửa

Mảnh mã CHÍNH `index-BO6e2eTq.js` nặng **755 KB** — MỌI người tải, kể cả phụ
huynh chỉ mở một trang báo cáo trên điện thoại. Trong đó có:
- `GiaiCuuCongChuaGame` 29 KB + `ThanThuHoaHocGame` 37 KB + `src/game/` 168 KB
  = **~234 KB mã game**, vào mảnh chính vì `StudentPortalScreen` nhập THẲNG,
  mà `StudentPortalScreen` lại được `App.tsx` nhập thẳng.
- `ParentPortalScreen` 29 KB — em học sinh không bao giờ cần.

## Lỗ nhảy lẫn vai — chỗ DUY NHẤT còn đoán

Mọi đường có vai rõ ràng đều đúng. Chỗ đoán là `/` TRẦN: `laManThayQuanLy`
hỏi `localStorage['ddh.vaiDaDung']`. Ba app CHUNG một gốc nên CHUNG một
localStorage — máy nào mở cả ba thì khoá ấy là của app mở sau cùng.

Thêm: link ba app đang ba kiểu (`/?vai=gv`, `/hs`, `/ph`). Zalo và nhiều trình
rút gọn có thể cắt phần `?...`, và cắt xong `/?vai=gv` thành `/` trần — rơi
đúng vào chỗ đoán.

## Đã sửa — lượt 12

### A. KHOÁ VAI — ba lớp bọc

`src/lib/khoa-vai.ts` mới:
1. **Vai nằm trong ĐƯỜNG DẪN**, không nằm trong tham số. Ba link chuẩn:
   `/gv` · `/hs` · `/ph`. `khoaVaiVaoUrl()` chạy lúc khởi động viết lại địa chỉ
   về đúng dạng ấy, nên tải lại trang hay service worker trả trang đều giữ vai.
   Giữ nguyên phần sau `#` và mọi tham số khác.
2. **`start_url` cả ba manifest** cũng là đường dẫn ấy (`./gv`, `./hs`, `./ph`).
   `id` GIỮ NGUYÊN — đổi `id` là người đã cài thấy biểu tượng thứ hai.
3. **`/` trần HỎI, không đoán** — `ChonAppScreen` ba thẻ, một chạm.
   `vaiDaDung` từ nay chỉ còn quyền XẾP THỨ TỰ, không quyết định.

Gỡ 4 dòng 302 `/hs → /?vai=hocsinh` trong `_redirects`: chúng tạo thêm một
vòng mạng rồi bị viết ngược lại, và chỉ đúng với máy CHƯA cài app.

### B. TỐC ĐỘ — mảnh mã chính

| | Trước | Sau |
|---|---|---|
| mảnh chính thô | 755 KB | **631 KB** |
| mảnh chính gzip | — | **183 KB** |

Tách ra thành mảnh riêng, chỉ tải khi mở: `GiaiCuuCongChuaGame` 64 KB ·
`ThanThuHoaHocGame` · `ParentPortalScreen` 49 KB.

GIỮ NẠP SỚM: `ExamTakeScreen` và `PhieuScreen` — ngày thi không đánh cược vào
một mảnh mã tải muộn, và phiếu là thứ phụ huynh mở nhiều nhất.

---

# LƯỢT 13 — KHẮC PHỤC CÂU SAI LỆCH GIỮA ĐIỆN THOẠI VÀ MÁY TÍNH (14/09)

- [x] "Tạo câu khắc phục trên điện thoại của học sinh và máy tính đang lệch nhau. Kiểm tra kĩ xem đúng sai ở đâu sửa và đồng bộ chính xác."  | bằng chứng: `tests/khac-phuc-mot-nguon-1409.test.ts` 7/7 · `dong-bo-kho-sang-may-em-1409` 18/18

## ĐO THẬT (ảnh thầy chụp) — CÙNG em, CÙNG ca Test6, CÙNG 10 câu sai

|  | điện thoại | máy tính |
|---|---|---|
| Số câu rút luyện tập | 31 / **60** | 20 / **579** |
| Câu 1 (I) | tối đa 2 | tối đa 3 |
| Câu 2 (I) | tối đa 2 | tối đa 3 |
| Câu 3 (I) | tối đa 0 | tối đa 0 |
| Câu 4 (I) | tối đa **14** | tối đa **75** |

## NGUYÊN NHÂN GỐC — không con số nào tính sai, HAI NGUỒN KHÁC NHAU

`ModalKhacPhucCauSai` đọc `loadExamSources()` TRƯỚC, chỉ khi máy rỗng mới xin
máy chủ. Mà `loadExamSources()` là kho trong IndexedDB CỦA CHÍNH MÁY ĐANG MỞ:

- **Điện thoại em**: rỗng (đồng bộ kho đòi mã bí mật) ⇒ xin máy chủ ⇒ trần 60.
- **Máy tính thầy**: có KHO ĐẦY ĐỦ CỦA THẦY. Cổng học sinh mở trên chính máy
  ấy dùng CHUNG GỐC nên đọc luôn kho ấy ⇒ 579.

Nguồn thứ hai còn sai RANH GIỚI DỮ LIỆU: màn của EM không được đọc kho của
THẦY chỉ vì tình cờ mở trên máy thầy.

⇒ Con số ĐÚNG phải là con số MÁY CHỦ trả, vì chỉ nó giống nhau trên mọi máy.

## Đã sửa

1. Modal **LUÔN** xin máy chủ, bỏ hẳn `loadExamSources()`. Một nguồn duy nhất.
2. Nới vùng chọn, vì nay đây là vùng chọn của MỌI máy:
   - `TRAN_TO_DE_THEO_DANG` 14 → **40** tờ đề
   - `TRAN_CAU_KHAC_PHUC` 60 → **200** câu (hằng có tên, máy chủ khai một chỗ)
   - `SO_CAU_XIN_KHO` 60 → **200**, và phép kiểm bắt hai số này phải BẰNG NHAU
3. Giữ trần: bỏ trần là gói to, máy em tải cả phút.

## Còn treo

- [!] Trần 200 chưa phải toàn kho (157 tờ). Muốn đúng bằng số ứng viên thật thì
  phải thêm cột `dang_ma` vào `cau_hoi` rồi đánh lại chỉ mục cả kho — việc
  riêng, chưa làm trong lượt này.

## NGHIỆM THU TRÊN BẢN LIVE (sau phát hành)

| Mở | Địa chỉ thành | App hiện ra |
|---|---|---|
| `/gv` | `/gv` | GIÁO VIÊN |
| `/ph` | `/ph` | PHỤ HUYNH |
| `/?vai=gv` | **`/gv`** | GIÁO VIÊN |
| `/?vai=hocsinh` | **`/hs`** | HỌC SINH |
| `/hoc-sinh` | **`/hs`** | HỌC SINH |
| `/` | `/` | **Màn chọn app** (không đoán) |

- `start_url` manifest học sinh trên máy chủ: `./hs`
- Mảnh mã chính trên bản live: **616 KB** (trước 755 KB) · mở trang **1,07 giây**
- Chốt tự sửa khi app trắng màn: CÓ trong `index.html` bản live

---

# LƯỢT 14 — BỎ MÀN CHỌN APP · KHOÁ CỨNG APP THẦY (15/09)

- [x] "bỏ màn chọn app đi nhé, vì có thể học sinh dùng 2 máy chọn 2 app khác nhau"  | bằng chứng: `DungLinkScreen` thay `ChonAppScreen`; `tests/khoa-vai-3-app-1409` 38/38
- [x] "app giáo viên khoá cứng lại không thể chạm vào được bằng cách nào"  | bằng chứng: `tests/khoa-cung-app-thay-1509` 18/18
- [x] "app học sinh và phụ huynh cũng phải tách biệt hoàn toàn không được nhảy lẫn lộn nhau"  | bằng chứng: cùng tệp trên, mục HỌC SINH VÀ PHỤ HUYNH TÁCH HẲN

## HAI LỖ THẬT ĐÃ BỊT

### 1. Máy trắng VÀO THẲNG app quản lý

`App.tsx` từng quyết: `setKhoa(ma ? 'can_dat' : 'da_mo')` — máy chưa có mã bí
mật thì `da_mo`. Nghĩa là **em gõ `/gv` trên điện thoại của chính em là app
quản lý mở ra, không hỏi một câu nào.** Lý lẽ cũ "chưa có gì để khoá" đúng về
dữ liệu, sai về quyền — và mã bí mật đã từng lộ 10/09.

Nay: không có mã bí mật trên máy ⇒ `chua_cap_quyen` ⇒ chỉ hiện đúng một cửa
nhập mã, **máy chủ chấm** (`lichSuLenBang`), không phải máy tự chấm. IndexedDB
hỏng cũng KHOÁ chứ không mở.

Thầy KHÔNG bị khoá: máy thầy đã có bản ghi mật khẩu ⇒ nhánh `can_mo` chạy
trước, không chạm cửa mới.

### 2. Link vào thi dựng VỎ APP CỦA THẦY

`/t/<mã ca>` và `/d/<mã ca>` không có vai `gv` nên `canHoi=false`, `khoa='da_mo'`,
rồi **chính vỏ app quản lý được dựng**, chỉ ẩn thanh bên khi `screen==='examtake'`.
Em chỉ cách app thầy đúng MỘT lần đổi `screen`: màn thi ném lỗi là `ChanLoi`
mời "về màn chính" → `setScreen('examhub')` → em ngồi giữa app quản lý, đủ
thanh bên, trên chính điện thoại của em.

Nay hai đường ấy trả về ĐÚNG một màn làm bài, không vỏ, không thanh nào; lỗi
thì mời TẢI LẠI CHÍNH LINK ẤY.

## Bỏ hết đường ĐOÁN vai

- `App.tsx`: `laHocSinh`/`laPhuHuynh` không còn hỏi `vaiDaDung()`.
- `vai-tro.ts`: `laManThayQuanLy` không còn nhánh `vaiDaDung()` và `daCai()`.
  Đường không nói `gv` thì không phải app thầy. Hết.
- `/` trần và mọi đường lạ ⇒ ngõ cụt, không dẫn đi đâu.

`ddh.vaiDaDung` là khoá localStorage CHUNG GỐC của cả ba app — chính nó là cửa
để hai cổng nhảy sang nhau. Nay nó không còn quyền quyết định gì.

## NGHIỆM THU TRÊN BẢN LIVE (15/09, sau phát hành)

Mở thử từ một trình duyệt CHƯA từng có mã bí mật — đúng hoàn cảnh máy của em:

| Mở | Địa chỉ thành | Màn hiện ra | Số link ra ngoài |
|---|---|---|---|
| `/gv` | `/gv` | **KHOÁ — đòi mã bí mật** | 0 |
| `/?vai=gv` | **`/gv`** | **KHOÁ — đòi mã bí mật** | 0 |
| `/hs` | `/hs` | cổng học sinh | — |
| `/ph` | `/ph` | cổng phụ huynh | — |
| `/` | `/` | **ngõ cụt** | **0** |
| `/linh-tinh` | `/linh-tinh` | **ngõ cụt** | **0** |
| `/t/999999` | `/?examCode=999999` | màn vào thi, KHÔNG vỏ app thầy | 0 |

Hai màn ngõ cụt và màn khoá đều có **0 thẻ `<a>`** — không có đường nào lang
thang sang app khác.

---

# LƯỢT 15 — BỎ MÀN NGÕ CỤT, CHỈ CÒN BA LINK (15/09)

- [x] "bạn bỏ luôn mở app bằng đúng link thầy gửi đi ... làm thế này giảm trải nghiệm người dùng. CHỉ cần kiểm tra kĩ 3 link riêng biệt"  | bằng chứng: `tests/khoa-cung-app-thay-1509` 25/25 (có khối QUÉT CHÉO ba link)

Bỏ `DungLinkScreen` và `canChonApp`. Bấm link là vào thẳng app, không màn đệm.

`/` trần và đường lạ về lại app của thầy như đời đầu — KHÔNG còn là lỗ hổng,
vì app của thầy đã khoá cứng sau mã bí mật từ lượt 14. Em gõ tên miền trần chỉ
gặp ổ khoá, không gặp app quản lý.

## Vẫn giữ nguyên (lượt 14)

- App thầy đòi mã bí mật ở cửa, máy chủ chấm mã.
- Link vào thi không dựng vỏ app thầy.
- `laManThayQuanLy` KHÔNG còn nhánh đoán `vaiDaDung()` / `daCai()`.

## Quét chéo ba link — phép kiểm thầy yêu cầu

Với MỖI dáng viết của mỗi link: ra đúng một vai, KHÔNG ra hai vai kia; quy về
đúng link chuẩn; giữ nguyên kết quả sau khi đã đi qua cả ba link theo mọi thứ
tự; và mọi trạng thái cờ trong máy cho CÙNG một kết quả.

Gõ nhầm (`/gvx`, `/hsa`, `/phb`, `/g`, `/h`, `/p`) ⇒ không rơi vào app nào.

## NGHIỆM THU BA LINK TRÊN BẢN LIVE (15/09)

Mở từ trình duyệt CHƯA từng có mã bí mật — đúng hoàn cảnh máy của em.

**Mở lần lượt ba link, HAI VÒNG, trong cùng một trình duyệt** (ca thầy lo nhất):

| Lượt | Mở | Địa chỉ thành | App |
|---|---|---|---|
| 1 | `/hs` | `/hs` | HỌC SINH |
| 2 | `/ph` | `/ph` | PHỤ HUYNH |
| 3 | `/gv` | `/gv` | THẦY — khoá, đòi mã |
| 4 | `/hs` | `/hs` | HỌC SINH |
| 5 | `/ph` | `/ph` | PHỤ HUYNH |
| 6 | `/gv` | `/gv` | THẦY — khoá, đòi mã |

**Dáng link cũ và đường lạ:**

| Mở | Địa chỉ thành | App |
|---|---|---|
| `/?vai=hocsinh` | `/hs` | HỌC SINH |
| `/hoc-sinh` | `/hs` | HỌC SINH |
| `/?vai=phuhuynh` | `/ph` | PHỤ HUYNH |
| `/phu-huynh` | `/ph` | PHỤ HUYNH |
| `/?vai=gv` | `/gv` | THẦY — khoá |
| `/` | `/` | THẦY — khoá |
| `/linh-tinh` | `/linh-tinh` | THẦY — khoá |

Không lượt nào hiện màn đệm. Không lượt nào mở được app quản lý.

---

# LƯỢT 16 — NỘP BÀI XONG VĂNG TRÊN iPHONE (15/09)

- [x] "Làm bài ktra xong trên app học sinh bấm nộp bài bị văng"  | bằng chứng: `tests/sw-khong-tra-trang-chuyen-huong-1509` 9/9 · `kiem-sw` 10/10

## BÀI VẪN NỘP ĐƯỢC — kiểm trước tiên

D1: ca `457868` · sbd `12121212` · `nop_luc 2026-09-15T03:24:56` ·
`trang_thai='da_nop'` · tổng **3,88** · `dap_an_json` 330 ký tự.
Hỏng ở MÀN HÌNH sau khi nộp, KHÔNG hỏng ở dữ liệu.

## NGUYÊN NHÂN GỐC — đo được trên bản live

```
fetch('/index.html?__WB_REVISION__=…')  →  redirected: true
                                           url: '/?__WB_REVISION__=…'
```

Cloudflare Pages cắt `index.html` khỏi đường dẫn bằng một lượt CHUYỂN HƯỚNG.
Mà `/index.html?__WB_REVISION__=<mã>` chính là khoá workbox dùng cho kho
precache. Khi khoá ấy TRƯỢT trong kho — đúng lúc vừa phát hành bản mới, kho
đang thay — workbox đi ra mạng lấy chính khoá ấy, response thu về mang
`redirected = true`.

Chuẩn Fetch CẤM service worker trả response như thế cho lượt ĐIỀU HƯỚNG.
Chrome bỏ qua, Safari chặn thẳng:
"Response served by service worker has redirections".

⇒ Chỉ nổ trên iPhone, và chỉ mấy phút đầu sau mỗi lần phát hành — đúng lúc em
bấm Nộp rồi app tải lại để nhận bản mới.

## Đã sửa

`goDauChuyenHuong()` dựng lại response từ chính thân của nó: nội dung y nguyên,
chỉ mất cái dấu chuyển hướng Safari soi. Áp cho CẢ BA tầng đường lui.
`opaqueredirect` giữ nguyên (chuẩn cho phép, thân không đọc được).

## Việc phát sinh

`xlsx` bị gỡ khỏi `package.json` ở commit `079875d` của phiên khác, nhưng
`ExamMonitorScreen` và `ResultsScreen` vẫn nhập nó. Chỉ lộ ra khi phiên ấy chạy
`npm i three` làm npm dọn mất `node_modules/xlsx`. Đã cài lại `xlsx@0.18.5`.

---

# LƯỢT 17 — GỠ HAI THẺ TRÊN MÀN CHI TIẾT CA (15/09)

- [x] "Xóa luôn phần này trên app gv. Chuyển nút xóa lên phần còn lại" — thầy chốt tiếp: "Bỏ hết phần tôi chụp"  | bằng chứng: 8 mảnh · 4.014 phép · 0 trượt

## Đã gỡ

Thẻ **"Xuất kết quả"** (Phiếu zip · Bảng điểm xlsx · Dữ liệu json · Tạo &
copy link phiếu gửi Zalo) và thẻ **"Tải đề & lời giải"** (đề riêng từng em,
cả kho của ca, copy link).

Nút **"Xoá ca này"** chuyển lên cuối THẺ THÔNG TIN CA — cùng một thẻ với Bắt
đầu thi và Khoá ca, tức mọi việc tác động lên chính ca nằm chung một nơi.

## VIỆC SUÝT MẤT — đã dọn ra chỗ khác

Trong `handleTaiPhieuHangLoat` của thẻ vừa gỡ có một việc **không dính gì tới
xuất phiếu**: vá ngược khoá `key/<maCa>.json` cho ca cũ. Thiếu khoá ấy thì LINK
XEM ĐIỂM của cả ca báo "Máy chủ chưa gửi đề của ca này" (ca 195422, 12/09).

Gỡ thẻ mà không dọn là ca cũ mất đường tự lành TRONG IM LẶNG. Nay nó thành một
`useEffect` riêng, chạy MỘT LẦN mỗi ca khi thầy mở màn.

## Luồng gửi Zalo KHÔNG mất

Nó đi qua cầu nối `window.__ddh` (`src/lib/cau-noi-ddh.ts`) gọi thẳng
`phieuTheoCa`, không qua màn hình. Lõi dựng phiếu `phieu-ca-ca.ts` vẫn còn và
còn 6 nơi dùng.

## Lợi ích kèm theo — nhẹ hẳn

| | Trước | Sau |
|---|---|---|
| mảnh mã chính | 630 KB (183 gzip) | **473 KB (138 gzip)** |
| mảnh màn Theo dõi | 350 KB | **62 KB** |

---

# SỔ VIỆC — 15/09 lượt 13 · CA KHÔNG SAI CÂU NÀO

- [x] "Sửa lại chỗ này nhé" (ảnh ca Test7: "0 câu làm sai" mà modal vẫn mời
  "1. Làm lại các câu sai (0 câu)" + nút "Bắt đầu làm bài" + dòng "Máy này chưa
  có kho đề của thầy")  | bằng chứng: `npx vitest run tests/khac-phuc-khong-co-cau-sai-1509.test.tsx` → 10/10 đạt
- [x] Nghiệm thu 7 cửa  | bằng chứng: bảng cuối mục này
- [x] Phát hành  | bằng chứng: `DAY-OMR-APP.command` → "XONG CẢ HAI"; `sw-version.json` live = `{"builtAt":1789458153}`; quét 67 mảnh js live: câu chữ mới có trong `ModalKhacPhucCauSai-B4rZx-NJ.js`, câu chữ cũ "Máy này chưa có kho đề của thầy" KHÔNG còn mảnh nào
- [x] Kiểm không có ca nào đang thi trước khi đẩy  | bằng chứng: D1 `SELECT ... FROM luot WHERE nop_luc IS NULL GROUP BY ma_ca` → rỗng; lượt gần nhất nộp 03:24 UTC (10:24 giờ VN), trước lúc đẩy hơn 4 tiếng

Mã commit trước khi phát hành: `3cbfd7b`. Lùi bản phát hành: `git revert 3cbfd7b`.

## Hai nguyên nhân gốc, rời nhau

**1. Cổng mở nút và ruột modal đọc hai nguồn khác nhau.**
Nút "KHẮC PHỤC NGAY N CÂU SAI" trong `BaoCaoCaThiHocSinhModal` mở theo `soSai`
lấy từ `docSoDem(baiThi)` — đếm từ bảng chấm. Modal thì chạy trên `dsCauSai` —
danh sách `hsCauSai` trả về. Hai nguồn lệch một nhịp (đang tải, hoặc máy chủ
trả rỗng) là ra đúng màn thầy chụp. Cùng họ với vụ 60-vs-579 ngày 14/09.

Nút cuối trang phụ huynh còn tệ hơn: hiện VÔ ĐIỀU KIỆN.

**2. Cổng chặn nút chỉ phủ chế độ 2.**
Điều kiện cũ `cheDo === 2 && tongToiDaCheDo2 === 0 && dsCauSai.length === 0`
bỏ trống chế độ 1, nên 0 câu sai vẫn bấm được và mở ra một phiếu trắng.

**Dòng cảnh báo thì sai lý do.** Từ 15/09 modal luôn xin máy chủ, không đọc kho
của máy đang mở nữa — nên "Máy này chưa có kho đề của thầy" không còn là lý do
có thật của bất kỳ ca nào. Với `dsCauSai` rỗng thì vòng nạp kho còn không chạy,
`coKhoDe` hoá false, và dòng ấy hiện ra thay cho sự thật là "em không sai câu nào".

## Đã sửa

| Tệp | Sửa gì |
|---|---|
| `ModalKhacPhucCauSai.tsx` | `dsCauSai.length === 0` ⇒ màn rỗng trung thực, chỉ còn nút Đóng |
| `ModalKhacPhucCauSai.tsx` | `soCauSeRut` chặn cả 3 chế độ, thay cổng chỉ phủ chế độ 2 |
| `ModalKhacPhucCauSai.tsx` | `KHONG_CO_KHO` viết lại: lỗi là máy chủ không rút được, không đổ cho máy em |
| `BaoCaoCaThiHocSinhModal.tsx` | hai nút khắc phục đi theo `dsCauSai` thật; lệch nguồn thì nói ra |
| `BaoCaoCaThiPhuHuynhModal.tsx` | nút "Tạo bài luyện khắc phục" hết hiện vô điều kiện |
| `tests/khac-phuc-khong-co-cau-sai-1509.test.tsx` | 10 phép chốt cả hai nguyên nhân |

## Bảy cửa — 15/09 05:20

| Cửa | Lệnh | Kết quả | Đạt/Trượt |
|---|---|---|---|
| Kiểu app | `npx tsc -b` | mã thoát 0 | Đạt |
| Kiểu máy chủ | `npx tsc -p server/tsconfig.json --noEmit` | mã thoát 0 | Đạt |
| Phép kiểm | `npx vitest run --shard=N/8` | 275 tệp · 4.064 phép đạt | Đạt |
| Mã màu | `npm run check:mau` | không có # ngoài tokens.css | Đạt |
| Hiển thị 360px | `node scripts/kiem-13.mjs` | ĐẠT 18/18 | Đạt |
| Service worker | `node scripts/kiem-sw.mjs` | ĐẠT 10/10 | Đạt |
| Dựng bản | `npx vite build` | 169 mục precache · mảnh chính 486 KB | Đạt |

## Còn nợ (mang từ lượt trước)

- [!] `MA_BI_MAT` lộ 10/09 chưa đổi — khoá cứng app thầy chỉ chắc bằng mã ấy.
- [!] `nopKhacPhucTheoCa` trả `qidSai` rỗng.
- [!] `qid_da_lam.so_lan` phồng lên mỗi lần chấm lại.
- [!] Thầy chưa thêm `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` vào GitHub secrets.
- [!] Ca thử Test2–Test7 còn `trang_thai='mo'`.
- [!] `TRAN_CAU_KHAC_PHUC = 200` chưa phải trần thật của kho (157 tờ) — cần cột
  `dang_ma` trên `cau_hoi` và một lần đánh chỉ mục lại.

---

# SỔ VIỆC — 15/09 lượt 14 · ĐỊA CHỈ MÁY CHỦ MỘT NGUỒN

- [x] "Nút khắc phục ngay 9 câu sai bấm ko phải hồi trên điện thoại của học
  sinh, trên chrome máy tính vẫn bấm được. Sửa lại triệt để và đồng bộ hết mọi
  báo cáo, mọi app, mọi chỗ"  | bằng chứng: `npx vitest run tests/dia-chi-may-chu-mot-nguon-1509.test.ts` → 20/20 đạt
- [x] Nghiệm thu 7 cửa  | bằng chứng: bảng cuối mục này
- [x] Phát hành  | bằng chứng: xem mục Phát hành cuối

## Đo thật TRƯỚC khi sửa

Gọi thẳng máy chủ, đúng em ấy, đúng ca ấy:

```
POST https://omr.ttadodaihoc.workers.dev/hs/cau-sai
     {"sbd":"12121212","dsMaCa":["457868"]}
→ 200 · ok:true · 9 câu · 16.649 byte · 1.257 ms
```

Máy chủ không hỏng, gói nhỏ, không có gì để chậm. Lỗi nằm ở MÁY EM.

Mở app bằng một trình duyệt SẠCH (chưa từng vào app). IndexedDB
`omr-exam/settings` có ĐÚNG MỘT khoá: `mayChuMoi`. **Không có `scriptUrl`.**

## Nguyên nhân gốc

`scriptUrl` là một giá trị CHẾT mà vẫn canh cửa.

- 12/09 cắt hẳn Google ⇒ khoá `scriptUrl` bị gỡ khỏi `public/cau-hinh.json`,
  `postJson` chặn cứng mọi địa chỉ Google.
- `loadScriptUrlHoacMacDinh()` chạy MỘT LẦN lúc màn mở. Thua cuộc đua với lượt
  nạp địa chỉ ở `main.tsx` thì nó đi tìm khoá `scriptUrl` trong `cau-hinh.json`
  — khoá đã gỡ ⇒ rỗng. **Và không ai thử lại cả phiên.**
- Máy tính thầy còn khoá cũ trong IndexedDB từ trước 12/09 ⇒ luôn khác rỗng ⇒
  mọi cổng canh đều lọt. Điện thoại em sạch, lại chậm hơn nên hay thua cuộc đua.
- Hai màn báo cáo canh đúng giá trị chết ấy:
  `if (!baiThi.maCa || !scriptUrl) return` ⇒ trên máy em lượt gọi `hsCauSai`
  KHÔNG BAO GIỜ được bắn đi. Không phải nút hỏng — nút không có gì để mở.

Cùng họ với vụ 60-vs-579 ngày 14/09: màn phụ thuộc một giá trị cất trong máy
đang mở. Chữa bằng cách bỏ hẳn sự phụ thuộc, không phải đoán giá trị giỏi hơn.

## Đã sửa

| Tệp | Sửa gì |
|---|---|
| `src/lib/dia-chi-may-chu.ts` (mới) | `layDiaChiMayChu()` — bốn đường về một địa chỉ: cấu hình máy → gợi ý → chờ lượt nạp khởi động → tải thẳng `cau-hinh.json`. Cấm ném lỗi, cấm nhớ cái rỗng, cấm trả địa chỉ Google |
| `src/lib/exam-api.ts` | cả 8 hàm của học sinh/phụ huynh dùng chung nguồn ấy; không lấy được địa chỉ thì trả lỗi có chữ, không im lặng |
| `src/lib/exam-db.ts` | `loadScriptUrl` hết ném lỗi khi IndexedDB hỏng; `loadScriptUrlHoacMacDinh` hết đi tìm khoá đã chết |
| `src/components/BaoCaoCaThiHocSinhModal.tsx` | bỏ hai cổng `!scriptUrl`; giữ và hiện lý do khi gọi hỏng |
| `src/components/BaoCaoCaThiPhuHuynhModal.tsx` | như trên |
| `src/screens/ParentPortalScreen.tsx` | bỏ cổng `if (scriptUrl)`; phân biệt "không sai câu nào" với "gọi hỏng" |
| `tests/dia-chi-may-chu-mot-nguon-1509.test.ts` | 20 phép: 10 phép chạy thật bốn đường + ba điều cấm, 10 phép soi mã chạy cả 3 app |

## Bảy cửa — 15/09 08:07

| Cửa | Lệnh | Kết quả | Đạt/Trượt |
|---|---|---|---|
| Kiểu app | `npx tsc -b` | mã thoát 0 | Đạt |
| Kiểu máy chủ | `npx tsc -p server/tsconfig.json --noEmit` | mã thoát 0 | Đạt |
| Phép kiểm | `npx vitest run --shard=N/8` | 276 tệp · 4.103 phép đạt | Đạt |
| Mã màu | `npm run check:mau` | không có # ngoài tokens.css | Đạt |
| Hiển thị 360px | `node scripts/kiem-13.mjs` | ĐẠT 18/18 | Đạt |
| Service worker | `node scripts/kiem-sw.mjs` | ĐẠT 10/10 | Đạt |
| Dựng bản | `npx vite build` | 170 mục precache · mảnh chính 486 KB | Đạt |

## Phát hành

- [x] Kiểm không có ca nào đang thi  | bằng chứng: D1 `SELECT ma_ca, COUNT(*) FROM luot WHERE nop_luc IS NULL GROUP BY ma_ca` → rỗng (08:08 UTC)
- [x] Đợi phiên Claude kia đẩy xong rồi mới đẩy  | bằng chứng: hai cửa sổ Terminal của `DAY-APP-THAN-THU-1509` và `DAY-MAY-CHU-THAN-THU-1509` đều đã về dòng "Bấm Enter để đóng"; bản của họ dựng 169 mục precache, KHÔNG có bản sửa này — nên phải đẩy sau
- [x] `DAY-OMR-APP.command` → "XONG CẢ HAI"

Đối chứng bản live, trình duyệt khác gốc, quét cả 68 mảnh js:

| Kiểm | Kết quả |
|---|---|
| `sw-version.json` | `{"builtAt":1789460147}` |
| `Chưa lấy được địa chỉ máy chủ` | có, trong `assets/exam-api-DIoZqsfj.js` |
| màn rỗng khắc phục | có, trong `assets/ModalKhacPhucCauSai-CDKpwxKP.js` |
| `Máy này chưa có kho đề của thầy` | không còn mảnh nào |
| `cau-hinh.json` có khoá `scriptUrl` | không |

**Thử thật trên MÁY SẠCH** (trình duyệt riêng, xoá sạch IndexedDB + localStorage
rồi tải lại — đúng cảnh điện thoại em mở app lần đầu): đăng nhập bằng SBD giả
`000000` → máy chủ trả lời **"Số báo danh không tồn tại trong hệ thống"**. Câu
trả lời ấy chỉ có thể đến từ máy chủ, tức máy sạch KHÔNG còn `scriptUrl` vẫn ra
được địa chỉ. Đúng chỗ bản cũ chết câm.

Mã commit: `b91b0f2`. Lùi bản phát hành: `git revert b91b0f2`.

---

# SỔ VIỆC — 15/09 lượt 15 · HIỆN ĐỀ KHÔNG ĐƯỢC LỘ ĐÁP ÁN

- [x] "trong đề khắc phục lỗi sai khi bấm nút chỉ hiện đề thì đáp án vẫn bị lộ
  vì khác màu, sửa triệt để và đồng bộ tất cả mọi chỗ, tất cả các app"
  | bằng chứng: `node scripts/kiem-lo-dap-an.mjs` → ĐẠT 9/9 (Chromium thật, so getComputedStyle)
- [x] Nghiệm thu 8 cửa  | bằng chứng: bảng cuối mục này
- [x] Phát hành  | bằng chứng: xem mục Phát hành cuối

## Nguyên nhân gốc

Bản cũ giấu đáp án bằng cách **TÔ LẠI** ô đáp án cho "trung hoà". Bộ màu tô lại
không trùng bộ màu ô thường:

| thuộc tính | ô thường | ô đáp án lúc "Hiện đề" |
|---|---|---|
| nền | `#ffffff` | `#f8fafc` |
| chữ | `var(--muc)` | `var(--muc-2)` |
| nền chữ cái | `#f1f5f9` | `var(--vien-dam)` |
| độ đậm | 500 | 400 |

Bốn chỗ lệch là bốn chỗ lộ. Và cách ấy **không vá được**: thêm một thuộc tính
mới vào `.q-opt.dung` là lộ lại. Đây là lý do phải đổi cơ chế chứ không chép
màu cho khớp.

Hai chỗ nữa viết thẳng đáp án ra CHỮ, nằm NGOÀI khối lời giải nên luật giấu lời
giải không với tới: `· đáp án đúng C` trong hộp nhắc của phiếu đề-của-em, và
nhãn `Đúng`/`Sai` gắn vào từng thẻ sau khi nộp.

## Đã sửa — một chỗ duy nhất, ba app dùng chung

Mọi phiếu của cả ba app đều do `src/lib/html-phieu.ts` dựng, nên sửa một chỗ là
đồng bộ tất cả.

| Sửa gì |
|---|
| Thẻ chỉ mang DẤU `data-dung` / `data-sai`; lớp `dung`/`sai` KHÔNG nằm sẵn trong mã nguồn |
| Hàm `dongBoLoDapAn()` gắn lớp khi được phép hiện, GỠ RA khi đang giấu — gọi ở 5 chỗ: bật/tắt "Hiện đề", lưu PDF, lúc mở trang, nộp bài xong, và `beforeprint` |
| Bỏ hẳn 6 luật CSS "tô lại cho trung hoà" — không còn luật nào để lệch |
| `· đáp án đúng X` vào `<span class="lo-dap">`, giấu cùng lúc với mọi thứ khác |
| Nhãn `Đúng`/`Sai` sau khi nộp cũng giấu trong chế độ "Hiện đề" |
| `scripts/kiem-lo-dap-an.mjs` + `npm run kiem:lo-dap-an` — phép kiểm chấm bằng số, không bằng mắt |

Bốn tệp phép kiểm cũ chốt luật cũ, đã sửa kèm ghi chú ngày: `html-phieu`,
`tf-badge-mo-deu-0909`, `nop-phieu-khac-phuc`, `bam-chon-tren-de`.

## Tám cửa — 15/09 16:44

| Cửa | Lệnh | Kết quả | Đạt/Trượt |
|---|---|---|---|
| Kiểu app | `npx tsc -b` | mã thoát 0 | Đạt |
| Kiểu máy chủ | `npx tsc -p server/tsconfig.json --noEmit` | mã thoát 0 | Đạt |
| Phép kiểm | `npx vitest run --shard=N/8` | 284 tệp · 4.212 phép đạt | Đạt |
| Mã màu | `npm run check:mau` | không có # ngoài tokens.css | Đạt |
| Hiển thị 360px | `node scripts/kiem-13.mjs` | ĐẠT 18/18 | Đạt |
| **Lộ đáp án** | `node scripts/kiem-lo-dap-an.mjs` | **ĐẠT 9/9** | Đạt |
| Service worker | `node scripts/kiem-sw.mjs` | ĐẠT 10/10 | Đạt |
| Dựng bản | `npx vite build` | 173 mục precache · mảnh chính 490 KB | Đạt |

## Phát hành

- [x] Kiểm không có ca nào đang thi  | bằng chứng: D1 `SELECT ... FROM luot WHERE nop_luc IS NULL` → rỗng (16:44 UTC)
- [x] Đợi phiên Claude kia nhả máy  | ghi chú: máy bị phiên kia giữ 18 phút, thử lại tới khi nhả rồi mới đẩy
- [x] `DAY-TAT-CA.command` → "XONG CẢ HAI"

Đối chứng bản live, trình duyệt khác gốc, quét cả 71 mảnh js:

| Kiểm | Kết quả |
|---|---|
| `sw-version.json` | `{"builtAt":1789492267}` |
| `dongBoLoDapAn` | có, trong `assets/html-phieu-D26pfaZA.js` |
| luật cũ `body.chi-de .q-opt.dung { background: #f8fafc` | KHÔNG còn mảnh nào |
| luật giấu `.lo-dap` | có |

Mã commit: `2d68f00`. Lùi bản phát hành: `git revert 2d68f00`.
