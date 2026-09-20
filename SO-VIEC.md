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

### GĐ 5 — Kênh 4 (thần thú) + Kênh 5 (phụ huynh), PHẦN MÁY CHỦ  ·  CHUYỂN CHO PHIÊN "Code 3" (0.Planer đổi phân công vì tiết kiệm ngữ cảnh; Coder 1 CHƯA viết dòng mã nào của GĐ 5 — chỉ đọc mã, các điểm vào ở mục BÀN GIAO ngay dưới) (giao 19/09 sau khi thầy uỷ quyền trực tiếp; KHÔNG đụng `src/`)
Yêu cầu nhận từ 0.Planer (nguyên văn tóm): "kênh 4: readScope đọc nam_kt_cau, một đồng hồ ôn moc_on_ke, task than_thu sinh từ kế hoạch ngày qua đường nội bộ, chooseSession nhận blocked + now máy chủ; kênh 5: analyzeParent/assign đọc kế hoạch ngày, questionCount = phần dư, ôn tới hạn → dạng yếu đúng bậc → bù kho có lọc, loại qid 3 ngày qua, bỏ sort sao ASC, wrongPool từ nam_kt_cau, daily_ sang ngày thì bỏ, tồn đọng chỉ bài còn hạn, sửa layCauTuKhoDe; test parent-news sửa 12-34, xoá 71-95 — ghi sổ từng dòng. Token phụ huynh sau cùng; chạm luồng đăng nhập thì dừng báo. Bốn việc phải dừng báo: xoá/ghi đè D1, đổi luật chấm điểm, đổi luật vào thi, schema không chỉ-thêm."
- [x] K4.1 `readScope`: bằng chứng từ hồ sơ (`nam_kt_cau`), nguồn KHÔNG phải ca thi; bằng chứng ca thi CHƯA công bố vẫn KHÔNG lọt  | cách làm (theo điểm vào của Coder 1): `readScope` (`game-v2-bank.ts`) đẩy thêm dòng `{qid, ma_ca: nguon_cuoi, lan_thu 1, nop_luc: luc_cuoi, dung_sai}` vào `rows.results` TRƯỚC khi ánh xạ sang `Evidence`, chỉ cho qid có sự kiện nguồn KHÁC `thi` VÀ KHÁC `game` (`su_kien_hoc.nguon NOT IN ('thi','game')`); qid có ở cả hai nơi thì HỒ SƠ quyết `wrong` (trang_thai moi_sai/dang_on = sai; da_khac_phuc/chua_thay_sai = không) — ghi đè `dung_sai` của dòng ca thi; bọc try/catch vì fixture `tests/than-thu-v2.test.ts` không có bảng `nam_kt_*`/`su_kien_hoc`. | bằng chứng: commit `5d3b45d`; `tests/kenh4-than-thu-1909.test.ts` K4.1 (4 test, SQLite thật): câu sai ở BTVN/Mom thành bằng chứng wrong (ca 'btvn'/'mom'); câu CHỈ thi hoặc CHỈ game và câu của em khác KHÔNG lọt; câu sai ở thi rồi đúng 3 ngày khác nhau ở BTVN → `wrong:false`; pool mở được câu cùng dạng chưa gặp; thiếu `nam_kt_cau`/`su_kien_hoc` → không ném lỗi, evidence như trước. ĐỘT BIẾN AN TOÀN: bỏ 'thi' khỏi NOT IN (để lọt bằng chứng ca thi) → 1 test ĐỎ; tắt cả khối hồ sơ → 4 test ĐỎ.
- [x] K4.2 mốc ôn của game = `moc_on_ke` của dạng (một đồng hồ) — chỉ đổi đầu vào `chooseSession`, không đổi phần thưởng/`advance`  | cách làm: `masteryTheoHoSo` (`game-v2-ho-so.ts`, mới) trả BẢN SAO `p.mastery`: dạng có `nam_kt_dang.moc_on_ke` → `due` = 00:00 giờ VN của ngày đó; dạng chưa có mastery mà có mốc → thêm một dòng tổng hợp `{key, stage 0, first 0, due, groups [], repaired false}` (chooseSession chỉ đọc `key` và `due`); dạng KHÔNG có mốc (chưa từng sai / đã khắc phục hết) GIỮ `due` của game (không tước lịch giãn cách của game); `CD:` bỏ qua; thiếu bảng → trả đúng mảng đầu vào. KHÔNG sửa `advance` (khoá thưởng 20/40/40) và KHÔNG ghi lại hồ sơ game (chỉ truyền cho `chooseSession` ở `start`/`recommendations`). | bằng chứng: 4 test K4.2: due = dauNgayVn(moc_on_ke); dạng không mốc giữ due gốc; dòng tổng hợp; đầu vào KHÔNG bị sửa (mảng, phần tử, `groups` bản sao riêng); mốc đã tới ⇒ due ≤ giờ hiện tại; `CD:` bỏ qua; DROP TABLE → cùng tham chiếu mảng vào. Tích hợp `gameV2('start')`: hồ sơ game đã lưu (`mastery` với `due` 9_999_999_999_999) KHÔNG đổi sau khi chọn câu. ĐỘT BIẾN: trả nguyên đầu vào → 3 test ĐỎ; sửa thẳng đầu vào → 1 ĐỎ.
- [x] K4.3 `game_v2_task` sinh từ việc `than_thu` của kế hoạch ngày qua đường NỘI BỘ (không qua `parentGame`)  | cách làm: trong `lapVaLuuKeHoach` (`ke-hoach-ngay-d1.ts`), khi LƯU (không khi `luu:false`), việc `than_thu` NHÃN `bu` → `INSERT OR IGNORE INTO game_v2_task(id,sbd,dang,created_at) SELECT … FROM json_each(?) WHERE NOT EXISTS (nhiệm vụ MỞ cùng dạng) AND (số nhiệm vụ mở) < NHIEM_VU_THAN_THU_MO_TOI_DA (=3, `ho-so-cau-hinh.ts`)`; id = `sbd|than_thu|<ngày>|<dạng>`; mỗi em một dòng/lượt (không tự cạnh tranh trong cùng câu lệnh), gom 25 dòng/lệnh; bọc `tat` (thiếu bảng → bỏ qua). Game `complete` vẫn tự đóng nhiệm vụ theo dạng (không đổi); kế hoạch đã đọc nhiệm vụ mở (`nhiemVuThanThu`) nên nhiệm vụ PH nhắc vẫn được ưu tiên; bất biến 'PH chỉ nhắc dạng có mastery' của `parentGame` giữ nguyên vì đường này không đi qua nó. | bằng chứng: 6 test K4.3 (D1 thật): sinh đúng MỘT nhiệm vụ id `S1|than_thu|<ngày>|ES.A.X`, completed_at NULL, lập lại 3 lần không nhân đôi; `luu:false` và em không thiếu → không sinh; đã có nhiệm vụ mở cùng dạng (PH nhắc) → không sinh thêm; đủ 3 nhiệm vụ mở khác dạng → không sinh; hoàn thành rồi ngày sau sinh lại (id có ngày), không đụng em khác; thiếu bảng → kế hoạch vẫn ra. ĐỘT BIẾN: tắt sinh nhiệm vụ → 2 test ĐỎ.
- [x] K4.4 `chooseSession` nhận `blocked` (qid đã giao/làm hôm nay ở mọi nguồn) + `now` máy chủ  | cách làm: `qidChanHomNay` (`game-v2-ho-so.ts`): (a) qid có sự kiện HÔM NAY (ngày VN) ở mọi nguồn TRỪ game; (b) qid trong bài Mom CHƯA NỘP giao trong `MOM_CHUA_BAT_DAU_SO_NGAY` (3) ngày VN gần nhất (`mom_bai.qid_json`, cùng cửa sổ với `viec[]`; bài tồn cũ không chặn game). Thêm vào Set `blocked` sẵn có ở `start`/`recommendations` (`allowed()` đã soi `blocked.has(qid)`); MỘT `tNow = Date.now()` dùng cho cả lượt chọn và mốc ôn. GIỚI HẠN đã biết: bài BTVN đang chờ chưa có `lo_json` (GĐ 3) nên câu BTVN CHƯA làm chưa chặn được (câu BTVN đã làm hôm nay thì chặn qua sổ). | bằng chứng: 3 test K4.4 + 2 test tích hợp `gameV2('start')` thật: sự kiện hôm nay (btvn/on_lai) chặn, hôm qua và game không; qid Mom chưa nộp trong 3 ngày chặn, bài đã nộp/quá 3 ngày/không qid_json thì không; thiếu bảng/cột → tập rỗng; game start: câu sai ở BTVN ĐƯỢC ôn (`K1` trong lượt), câu đang nằm trong bài Mom hôm nay KHÔNG ra (`K2`), câu vừa làm ở `on_lai` hôm nay KHÔNG ra (`K3`); thiếu hồ sơ/sổ → game chạy như trước. ĐỘT BIẾN: không chặn → 2 test ĐỎ.
- [x] K4.5 mọi bất biến `tests/than-thu-v2.test.ts` giữ nguyên + test mới; toàn vitest = nền; đẩy Worker; gọi thử; nhắn 0.Planer  | bằng chứng: `tests/than-thu-v2.test.ts` 46/46 xanh KHÔNG SỬA dòng nào (assisted không tạo bằng chứng, trần 200 câu/ngày, EXP 2/câu trần 100, đề chưa công bố bị bảo vệ, game không sửa bảng học tập — đều nguyên); `tests/kenh4-than-thu-1909.test.ts` 20 test, đột biến 6 kiểu đều bị bắt (an toàn: lọt bằng chứng ca thi → 1 đỏ; tắt hồ sơ → 4; mốc ôn → 3; sửa đầu vào → 1; không chặn → 2; không sinh nhiệm vụ → 2). Toàn vitest: 5139 test, 97 đỏ / 42 tệp = nền (MỚI ĐỎ [] · HẾT ĐỎ ['tests/parent-news.test.ts']), KHÔNG cần loại tệp nào. Worker **`8d3e6e5c`** (chốt ca thi 'SACH 8 ca'). BẢN SỐNG: `/hs/ke-hoach-ngay` 12121212 vẫn ra (on_lai + than_thu); `/hs/on-lai/nop` không token → 'Em đăng nhập lại để nộp câu ôn.' (lời từ chối mới, commit `03823b8`); `game_v2_task` mở = 0 (tài khoản thầy có việc than_thu ở nhãn tuỳ chọn, không phải `bu` nên chưa sinh nhiệm vụ; cron 00:01 và mỗi lần em mở app sẽ sinh cho em thiếu). CHƯA kiểm được trên bản sống: lượt `start` thật của một em (cần token HS, không đoán mật khẩu ai) — chỉ có bằng chứng ở test tích hợp SQLite. Lùi: `git revert 5d3b45d 03823b8` + `./DAY-MAY-CHU.command` (nhiệm vụ tự sinh nếu đã có cứ để nguyên: là dòng `game_v2_task` bình thường). || **KIỂM BẢN SỐNG KÊNH 4 (0.Planer chạy từ trình duyệt đã đăng nhập tài khoản thầy 12121212, Worker `b94ed2bd`, 19/09):** `/game-v2/start` mode adventure → ok, 6 câu, KHÔNG chứa qid vừa nộp hôm nay ở `/hs/on-lai/nop` (`10-C1-B2-I-1`) ⇒ K4.4a (sự kiện hôm nay nguồn ≠ game bị chặn) ĂN; `sourceCases = ['luyen','mom','game']` ⇒ bằng chứng từ hồ sơ (nguồn ≠ thi) đã vào ⇒ K4.1 ĂN; không trường đáp án nào lộ; `/game-v2/profile` → ok, `tasks = 0` (đúng dự đoán: việc than_thu của thầy ở nhãn tuỳ chọn), pet `nuoc_long` cấp 3; 0.Planer KHÔNG gọi `answer` (không thưởng/EXP).
- [x] K5.1 `analyzeParent` nhận kế hoạch ngày: `questionCount` = mục tiêu − việc bắt buộc còn lại − đã làm (0–16), lý do nói bằng số  | bằng chứng: `server/src/parent-news-chon-cau.ts` (`tomTatKeHoach`, `soCauPhanDu`) + `tests/parent-news-chon-cau-1909.test.ts` (18 test: tóm tắt lấy từ `lapKeHoachNgay` thật, bài hằng ngày của chính hôm nay KHÔNG tính vào việc đã giao, quét 9×11 tổ hợp không vượt 16) + `tests/parent-news-d1-1909.test.ts` trên SQLite thật (em không bài → số câu = mục tiêu − cung − đã làm; bốn bài 30 câu hạn 20 giờ → 0 câu, lý do 'Mục tiêu hôm nay N câu … Chưa cần giao thêm', `assign` từ chối, không tạo bài). BẢN SỐNG (Worker `0caf811c`): `/parent-news/list` em 12121212 → questionCount 8 = mục tiêu 8, `phanDu {mucTieuCau 8, taiCung 0, daLamCau 0, soCau 8}`.
- [x] K5.2 thứ tự câu: ôn tới hạn → câu mới cùng dạng yếu đúng bậc → bù kho CÓ lọc chuyên đề/lớp; loại qid có sự kiện 3 ngày qua; bỏ `.sort(sao ASC)`  | bằng chứng: hàm thuần `chonCauChoPhuHuynh` (mốc sớm trước, sai nhiều trước, hoà theo `hashSeed`; câu mới mức độ ≤ bậc dạng, đúng bậc trước, xoay vòng qua dạng yếu; bù ưu tiên cùng chuyên đề = đoạn đầu mã dạng, xoay vòng theo dạng; KHÔNG sắp theo sao) — test tất định (đảo thứ tự đầu vào cùng kết quả), không trùng, không quá soCan. Câu tới hạn KHÔNG bị loại vì sự kiện 3 ngày (mốc 1 ngày chính là hôm qua), chỉ câu mới/bù bị loại. D1 thật: 3 câu sai 3 ngày trước đứng đầu, rồi N1,N2 cùng dạng; lớp 11 không lọt vào em lớp 12; câu 'van_dung' không lọt khi bậc dạng 'hieu'; câu của đề thi chưa công bố (`PROT-1`, qua `protectedQuestions`) không lọt. BẢN SỐNG: 8 câu bài hằng ngày 12121212 = qid thật (`10-C1-B1-I-4x/5x`), dạng `NGUYEN_TU.*`, mức biết/hiểu, có đáp án.
- [x] K5.3 `wrongPool` từ `nam_kt_cau` (hết lỗi `cau_N` không khớp qid)  | bằng chứng: `chonCauBaiHangNgay` (`parent-news-nguon-cau.ts`) đọc câu tới hạn từ `nam_kt_cau` (trang_thai moi_sai/dang_on/da_khac_phuc, can_day_lai=0, moc_on_ke ≤ hôm nay) thay `hsCauSai`; `id` câu Mom = qid thật (test: không id nào khớp /^cau_\d+$/, id === qid). Bản sống: `id` trong R2 = `10-C1-B1-I-52`…, không `cau_N`. `hsCauSai` và `applyPracticeOutcomes` không còn ở đường giao bài; `applyPracticeOutcomes` còn dùng cho `weak`/tên chuyên đề hiển thị (test cũ giữ).
- [x] K5.4 `daily_` chưa bắt đầu sang ngày mới → bỏ, không tính tồn đọng; tồn đọng chỉ đếm bài CÒN HẠN  | bằng chứng: `data()` trong `parent-news.ts`: `daily_` chỉ tính khi là bài của HÔM NAY hoặc đã bắt đầu trong 120 phút; Mom tay chưa bắt đầu tính (không hạn), bắt đầu quá 2 giờ thì bỏ; BTVN chỉ `han_nop > now`. Test D1 thật: daily_ ngày cũ (6 câu), Mom bắt đầu cách 3 giờ (7 câu), BTVN hết hạn (10 câu) đều BỊ BỎ; `pendingDetails` = {btvn 8, mom 8, daily 4}. Đường `list` vẫn cộng câu 'sắp giao' vào daily khi chưa có bài.
- [x] K5.5 `layCauTuKhoDe` đọc sai tên trường kho → luôn rỗng  | NGUYÊN NHÂN GỐC: hàm đòi `c.text && c.dapAnDung` trong khi tờ kho R2 dùng `de`/`dap_an`/`pa`/`y`/`chuyen_de` (cùng nhóm tên `homeworkQuestions` và `cauTuKho` đang đọc: `c.dap_an ?? c.dapAn`), nên `continue` với MỌI câu; ngoài ra lấy 6 tờ đầu tiên của `de_kho`, không lọc lớp/chuyên đề. Không đọc lại được gói R2 thật ở đây (không cần): thay hẳn nguồn bằng `game_v2_question.json` (đã có text/choices/ideas/correct/solution/dang/mucDo, lọc `reviewed`, đề bảo vệ) và XOÁ `layCauTuKhoDe` thay vì vá tên trường (vá vẫn giữ lỗi 'không lọc lớp/chuyên đề' và 'không có nhãn dạng/mức'). Đo độ phủ D1 THẬT (SELECT): `game_v2_question` 15.359 câu, 268/268 đề kho đã index, 2041/2044 qid trong hồ sơ có mặt (99,9%); `de_kho.lop` ∈ {10,11,12} cùng khuôn `hoc_sinh.lop`. Test 'em mới chưa có hồ sơ': bài vẫn đủ ≥ 8 câu từ kho, toàn lớp 11 khi em lớp 11 (lỗi cũ trả rỗng → 'Chưa tải đủ nội dung câu hỏi'); kho rỗng → báo lỗi rõ và KHÔNG tạo bài rỗng.
- [x] K5.6 `tests/parent-news.test.ts`: sửa dòng 12-34, XOÁ dòng 71-95  | Nền: tệp này nằm trong 43 tệp đỏ của nền nhưng chỉ ĐÚNG MỘT test đỏ: dòng 71-95 (`tự động tăng số câu … tối đa 36 câu`: đòi 18/24/36, mã ra 14). NGƯỜI SỬA (tôi, Code 3), theo lệnh 0.Planer + câu chốt 4/thầy: (a) dòng 12-19 'luôn đề xuất ít nhất 12 câu' → 'số câu đề xuất là phần dư của ngân sách ngày, chia theo nguồn' (kế hoạch mục tiêu 10, việc đã giao 2, đã làm 1 → 7 câu; tách 3/1/3); (b) dòng 21-25 'không giao chồng khi tồn đọng 40' → 'con đã đủ việc Thầy giao thì không giao thêm, lý do bằng số' (mục tiêu 10, việc 12 → 0); (c) dòng 27-34 'dù chưa có câu sai vẫn ít nhất 12' → 'chưa có câu đến hạn vẫn giao đúng phần dư' (mục tiêu 12 → 12 câu, toàn câu mới); (d) THÊM: đã làm đủ mục tiêu → 0; thiếu kế hoạch → 0 và nói rõ (không đoán số); (e) XOÁ dòng 71-95 (18/24/36 câu, trái trần 16 thầy đã chấp nhận ở câu chốt 4) và THAY bằng 'học sinh chăm chỉ cũng không vượt trần 16 câu' (4 cấu hình ca hôm nay, mục tiêu 16 → 16, không có '36 câu' trong lý do). Các test dòng 4-10, 36-69 KHÔNG đổi. Không skip/only, không hạ ngưỡng.
- [x] K5.7 toàn vitest = nền; đẩy Worker; gọi thử; nhắn 0.Planer  | bằng chứng: toàn `npx vitest run` LẦN 1 (chỉ Kênh 5, commit `fd784a8`): 4856 test, 97 đỏ / 42 tệp; LẦN 2 (trạng thái cuối, thêm `thanThu` `9f4382c`): 4866 test, 104 đỏ / 43 tệp, trong đó 7 test/1 tệp là `tests/bang-nhiem-vu-1909.test.tsx` của Code 2 (đang sửa dở, luật cho phép loại) → còn 97 đỏ / 42 tệp; MỚI ĐỎ ngoài nền [] · HẾT ĐỎ ['tests/parent-news.test.ts']. `DAY-MAY-CHU.command` (chốt ca thi 'SACH 8 ca') → Worker **`0caf811c`** lúc 14:00. Bản sống: `/hs/ke-hoach-ngay` 12001 → `thanThu {lua_phuong, 1, 'Chó Đỏ'}`; SBD bịa → ok:false; `/parent-news/list` và `/parent-news/assign` (tài khoản của thầy 12121212 — GHI 1 bài `daily_2026-09-19` 8 câu vào tài khoản của thầy, không đụng học sinh thật) → 8 câu; gọi lần hai → `alreadySent`. Lùi: `git revert 9f4382c fd784a8` rồi `./DAY-MAY-CHU.command` (không migration mới; không bảng nào bị đổi).
- [x] (0.Planer, ưu tiên cao, thầy báo lỗi trên bản sống) LỖI: trang chủ học sinh luôn 'Hoả Long cấp 1'  | nguyên nhân gốc (0.Planer xác định, tôi đối chiếu mã): client đọc `/hs/than-thu` (bảng V1 `than_thu`) nhưng lấy trường V2 (pet/cap/nickname) → rỗng → mặc định; thần thú thật ở `game_v2_profile`. Sửa: `/hs/ke-hoach-ngay` trả thêm `thanThu {pet, cap 1..120, nickname|null}` (`docThanThu`, đúng 1 truy vấn, đọc tươi, không lưu vào `ke_hoach_ngay`); `null` khi chưa có hồ sơ HOẶC `choice=true` (chưa chọn: `pet` khi đó chỉ là `dat_quy` điền tạm); dùng `json_type` để `pet` kiểu object không lọt thành chữ. | bằng chứng: `tests/ke-hoach-than-thu-1909.test.ts` 10 test (đúng pet/cap/nickname; chưa chọn → null; chưa hồ sơ → null; cap rác 999/-5/0/'abc'/null/12.7 → 120/1/1/1/1/13; nickname trống/khoảng trắng → null; pet không phải chữ → null; JSON hỏng không sập; đổi thần thú thấy ngay; đúng 1 truy vấn; bảng chưa có → null; SBD bịa vẫn bị từ chối) — chạy đỏ trước khi thêm hàm (9 test đỏ), rồi 1 lỗi của chính test (khoá `serverNow` do route `/hs/*` thêm sẵn từ trước) đã sửa, rồi 56/56 xanh cùng `tests/ke-hoach-ngay-1909.test.ts`. Commit `9f4382c`. Bản sống: em 12001 → `{pet:'lua_phuong', cap:1, nickname:'Chó Đỏ'}` (không còn hoa_long). `docs/ke-hoach-ngay-api-1909.md` đã thêm mục `thanThu`.
- [x] (0.Planer, việc nhỏ 1) LỖI: `/hs/ke-hoach-ngay` chỉ đưa bài Mẹ giao ĐÃ BẮT ĐẦU vào `viec[]`; bài mom/daily chưa nộp CHƯA bắt đầu phải vào `viec[]` (`loai 'mom'`, `batBuoc true`, `hanCung null`, `khan false`, xếp SAU việc có hạn cứng, TRƯỚC việc mềm, tính vào `tai.cung`; daily_ ngày cũ vẫn bỏ)  | nguyên nhân gốc: `lapKeHoachNgay` có dòng `if (bd === undefined) continue` cho Mom chưa bắt đầu và SQL của `docDauVao` chỉ lấy `started_at IS NOT NULL`. Sửa: SQL lấy cả bài chưa bắt đầu (bỏ `daily_` của NGÀY CŨ ngay ở SQL), hàm thuần tạo việc `mom:<id>` `{batBuoc:true, hanCung:null, hanMem:null, khan:false, nhan:null, chiTiet:{id,chuaBatDau:true,taoLuc}}`, sắp EDF với không-hạn = xa nhất (Mom chưa bắt đầu cũ giao trước đứng trước), tính vào `tai.cung` và số bài chưa nộp của ngân sách; `ngayHocMom(now)` đổi ngày lúc 00:01 như `newsDay`. | bằng chứng: commit `eaca548`; `tests/ke-hoach-mom-chua-bd-1909.test.ts` 13 test (có mặt trong viec[]; tính vào tai.cung và làm quá tải khi vượt; thứ tự: lô BTVN/Mom đang làm → Mom chưa bắt đầu → việc mềm; cổng hien; thứ tự nhiều bài; daily_ ngày cũ bỏ, daily_ hôm nay và Mom tay cũ giữ; daily_ cũ ĐÃ bắt đầu vẫn khẩn; đêm 00:01; SQL thật: bài đã nộp không có, bài quá 120 phút chỉ ở quaHan). ĐỔI TEST CŨ (báo rõ): `tests/ke-hoach-ngay-1909.test.ts` dòng 114-119 (của Coder 1) kiểm `expect(ids(kh)).not.toContain('mom:M2')` — khoá quyết định cũ 'Mom chưa bắt đầu không vào kế hoạch'; nay kiểm M2 CÓ mặt với `{batBuoc:true, khan:false, hanCung:null}` và đứng sau M1 (đã bắt đầu). Lý do: lệnh 0.Planer, hợp đồng với phiên Giao diện; không skip/only, không hạ ngưỡng. BẢN SỐNG (Worker `a230c979`): kế hoạch tài khoản thầy 12121212 có `mom:daily_2026-09-19` (8 câu, batBuoc, hanCung null, khan false) — trước đó không có.
- [x] (0.Planer, sau việc nhỏ 1) Chống trùng: bảng của em hiện việc 'ôn lại' TRÙNG câu với bài Mom/daily_ PH vừa giao (giới hạn số 2 ở ghi nhận Kênh 5)  | cách làm (0.Planer duyệt): cột CHỈ-THÊM `mom_bai.qid_json` (mảng qid thật, bỏ `cau_N`) do `mom create` ghi (`qidCuaBai`); `docDauVao` đọc, `lapKeHoachNgay` loại các qid nằm trong bài Mom CHƯA NỘP còn hiệu lực (chưa bắt đầu hoặc đang trong 120') khỏi `on_lai`; bài đã nộp/không còn trong d.mom hoặc hết hạn thì câu quay lại theo mốc ôn; tải cứng đã gồm số câu bài Mom nên không đếm hai lần. Phòng vệ chưa chạy migration: `mom.ts` thử INSERT có `qid_json`, lỗi 'no such column' thì INSERT như cũ; `docDauVao` thử SELECT có cột, lỗi thì SELECT `NULL AS qid_json`. Bài cũ (qid_json NULL) không chống trùng, không lỗi; KHÔNG backfill (phải đọc R2 từng bài, ngoài phạm vi). | bằng chứng: commit `3448f02`, `server/migration-1909-mom-qid.sql`; `tests/mom-qid-chong-trung-1909.test.ts` 11 test + 1 test đủ đường trong `tests/parent-news-d1-1909.test.ts` (PH giao bài rồi lấy kế hoạch: on_lai không còn qid trùng; nộp xong thì qid quay lại đúng như trước). KIỂM ĐỘT BIẾN: xoá bộ lọc `!daGiaoTrongMom.has(c.qid)` → 3 test ĐỎ, khôi phục → 11/11 xanh. Migration chạy `--remote -y` (chỉ thêm 1 cột): trước 10 cột, sau có `qid_json`, 216 dòng mom_bai còn nguyên, 0 dòng có qid_json (đúng). Toàn vitest: 4980 test, 99 đỏ / 43 tệp; ngoài nền chỉ `tests/bang-nhiem-vu-1909.test.tsx` (Code 2, đang sửa dở) → bỏ tệp đó còn 97 đỏ / 42 tệp; MỚI ĐỎ [] · HẾT ĐỎ ['tests/parent-news.test.ts']. Worker **`a230c979`** (chốt ca thi 'SACH 8 ca'). Lùi: `git revert 3448f02 eaca548` + `./DAY-MAY-CHU.command` (cột `qid_json` cứ để nguyên, không ai đọc).
- [x] (0.Planer QUYẾT ĐỊNH sau cảnh báo số liệu thật, KHẨN vì bản sống khoá 5 em) 42 bài Mom TAY chưa bắt đầu (439 câu, 5 em): không được thành việc BẮT BUỘC (cổng 'xong việc trước mới hiện việc sau' khoá em 11037 sau 24 bài cũ)  | cách làm (đúng lệnh, KHÔNG xoá/sửa dòng nào trên D1): Mom chưa bắt đầu chỉ vào `viec[]` khi giao trong 3 NGÀY VN gần nhất (gồm hôm nay) và TỐI ĐA 3 bài (mới nhất trước) — `MOM_CHUA_BAT_DAU_SO_NGAY = 3`, `MOM_CHUA_BAT_DAU_TOI_DA = 3` ở `ho-so-cau-hinh.ts`; bài ĐÃ bắt đầu (120' đang chạy) luôn vào `viec[]`, không giới hạn; phần còn lại → mảng MỚI `tonCu[]` `{id, loai:'mom', soCau, giaoLuc}` mới nhất trước + `tonCuTong {soBai, soCau}`, đứng riêng như `quaHan[]` (KHÔNG vào tai.cung, KHÔNG qua_tai, KHÔNG cổng, KHÔNG đổi ngân sách); chống trùng on_lai chỉ theo bài trong viec[] (229 câu tồn của 11036 không chặn câu ôn). Bài bắt đầu quá 120 phút vẫn chỉ ở `quaHan[]` như cũ (KHÔNG vào viec[]/tonCu). GHI CHÚ ĐỌC LỆNH: câu test '1 bài đã bắt đầu từ 5 ngày trước vẫn ở viec[]' tôi hiểu là bài GIAO 5 ngày trước mà em BẮT ĐẦU trong 120' gần đây (vẫn khẩn, không bị tuổi giao chặn); còn bài bắt đầu từ 5 ngày trước mà đã hết 120' là quá hạn → `quaHan[]` (luật cũ, giữ) — nếu ý khác xin báo. | bằng chứng: commit `ece0608`; `tests/ke-hoach-mom-chua-bd-1909.test.ts` nay 27 test (thêm 14): 24 bài cũ + 1 hôm nay → viec[] đúng 1 mom, tonCuTong {24, Σ}, tai.cung = 4, không qua_tai, cổng không khoá; mới nhất trước, đúng 4 khoá; tối đa 3 bài; ranh giới ngày VN 00:00 (17:00Z) vào / 23:59 ra; ngày giao hỏng → tồn cũ; bài đã bắt đầu luôn ở viec[] (5 bài, giao 5 ngày trước); tonCu không đổi ngân sách/tải/cảnh báo/viec; chống trùng theo bài trong viec[] không theo tonCu; tất định; D1 thật: 24 bài cũ SQL + 1 hôm nay, không sửa dòng mom_bai nào (ảnh chụp bảng trước/sau y hệt). Toàn vitest: 5015 test, 99 đỏ / 44 tệp; ngoài nền 2 tệp của Code 1 (làn giáo viên, đang sửa dở: `tests/lich-su-len-bang-1009.test.ts` đỏ vì `src/screens/GoiLenBangScreen.tsx` đang bị sửa; `tests/ho-so-lop-nam-kt-1909.test.ts` đỏ lúc chạy đầy đủ nhưng chạy lại riêng 40/40 xanh) → loại chúng còn 97 đỏ / 42 tệp; Worker không import `xep-buoi-chua`/`GoiLenBangScreen`; MỚI ĐỎ của mình []. Worker **`c2b85d06`** (chốt ca thi 'SACH 8 ca'). BẢN SỐNG (chỉ tính lại kế hoạch, không ghi bài): 11036 → viec[] 2 (ôn lại + thần thú), 0 mom, tonCu 2 bài/229 câu, không qua_tai (trước: 2 việc bắt buộc); 11037 → viec[] 3 mom (5+5+22 câu, giao 18/09), tonCu 21 bài/105 câu (trước: 24 bài bắt buộc); 10006 → viec[] 3 mom (4+4+11), tonCu 6 bài/24 câu. LƯU Ý: 11037 (tải cứng 32 > mục tiêu 8) và 10006 (19 > 12) VẪN có `qua_tai` vì 3 bài giao trong 3 ngày qua của họ, chính chúng nằm trong viec[] — đúng luật quyết định (bài trong viec[] tính tải), không phải tồn cũ; nếu muốn hạ tiếp (vd bớt còn 1 bài, hoặc chỉ tính bài giao hôm nay) là quyết định của 0.Planer. Lùi: `git revert ece0608` + `./DAY-MAY-CHU.command`. docs/ke-hoach-ngay-api-1909.md đã thêm `tonCu`, `tonCuTong`, `chiTiet.chuaBatDau`.
- [x] (0.Planer, việc nhỏ 2) LỆNH MỚI `POST /hs/cau-theo-qid {token|sbd, qid[≤20]}`: nội dung câu để em LÀM đúng các câu việc on_lai/on_thi đã chọn; KHÔNG kèm đáp án/lời giải; chỉ qid thuộc kế hoạch hôm nay của em hoặc đã từng gặp trong `su_kien_hoc`; ≤ 3 truy vấn + R2 theo tờ  | LỰA CHỌN THIẾT KẾ (báo rõ, không chạm luật đáp án theo hướng xấu — nghiêm hơn): lệnh rút câu khắc phục CŨ `cauKhacPhucGoi` trả NGUYÊN tờ kho `kho/<ma_de>.json` (kèm `dap_an`, `loiGiai`) — bắt chước hình dạng đó sẽ ĐƯA ĐÁP ÁN RA ĐƯỜNG CÔNG KHAI. Nên nguồn là `game_v2_question` (chỉ mục game, cùng nguồn game `start`; không cần R2) và đầu ra là WHITELIST 17 trường (`qid, maDe, phan, text, choices, ideas, table, thanCauImg, imageDataUrl, choiceImgs, ideaImgs, hinhAnh [đã bỏ ảnh `sau_loi_giai`], dang, tenDang, mucDo, sao, kienThuc`), không `...spread`, không `correct/solution/reviewed/version/group`. 'Thuộc kế hoạch hôm nay' ⊂ 'đã từng gặp' vì kế hoạch chỉ chọn qid từ hồ sơ, hồ sơ dựng từ chính `su_kien_hoc` — nên chỉ kiểm 'đã từng gặp' (một truy vấn). Câu của đề thi CHƯA công bố (`protectedQuestions`) bị loại dù em đã gặp; không kiểm được thì ĐÓNG CỬA (`ok:false`, không trả câu). `khongCo` gộp mọi lý do để không lộ câu nào có trong kho. | bằng chứng: commit `217311a`, `server/src/cau-theo-qid.ts` + route `/hs/cau-theo-qid` (cạnh `/hs/ke-hoach-ngay`, `return ra(await …)`); `tests/cau-theo-qid-1909.test.ts` 14 test (không đáp án/lời giải/ảnh lời giải/trường lạ ở phản hồi; whitelist; giữ đủ nội dung để làm; qid chưa gặp bị chặn và không phân biệt được với qid không tồn tại; em khác gặp không giúp được; đề chưa công bố bị loại; đóng cửa khi đề bảo vệ hỏng; SBD lạ/bịa/200 ký tự/chuỗi SQL → ok:false, ảnh chụp 3 bảng trước/sau y hệt; >20 qid, thiếu tham số; dọn qid rỗng/trùng/khoảng trắng/không phải chữ, giữ thứ tự xin; token thắng sbd trong body; ĐÚNG 3 truy vấn và 0 lần đọc R2). KIỂM ĐỘT BIẾN 4 kiểu (bỏ lọc 'đã từng gặp' → 2 đỏ; lộ correct+solution → 2 đỏ; bỏ lọc đề bảo vệ → 1 đỏ; lộ ảnh lời giải → 2 đỏ) đều bị bắt, khôi phục 14/14 xanh. Toàn vitest: 5055 test, 101 đỏ / 43 tệp; ngoài nền chỉ `tests/m3-b-1909.test.tsx` (Code 4, giao diện, đang sửa dở, Worker không import) → loại còn 97 đỏ / 42 tệp; MỚI ĐỎ của mình []. Worker **`68dd6092`** (chốt ca thi 'SACH 8 ca'). BẢN SỐNG (tài khoản thầy 12121212, chỉ ĐỌC): xin 8 qid của bài hằng ngày + 1 qid bịa → trả đúng 8 câu, `khongCo:['KHONG-TON-TAI']`, khoá câu = 12 trường, KHÔNG có correct/solution/reviewed/dapAn/loiGiai/version/group/sau_loi_giai trong toàn phản hồi; xin 2 câu CÓ trong kho mà thầy CHƯA gặp (`10-C1-B1-II-1`, `-II-10`) → `khongCo` (không lộ); SBD bịa → 'Không tìm thấy học sinh'; 21 qid → 'Mỗi lần xin tối đa 20 câu'. Lùi: `git revert 217311a` + `./DAY-MAY-CHU.command`. GHI NHẬN: chi phí 3 truy vấn D1 (em có thật + đã gặp; nội dung; kiểm đề bảo vệ có cache) — tôi tính CẢ truy vấn kiểm đề bảo vệ vào con số 3; đường chấm/ghi sổ các câu này là GĐ 3, lệnh này chỉ đưa ĐỀ.
- [x] (0.Planer, VIỆC MỚI 'TIM CỦA VÒNG', làm TRƯỚC Kênh 4) `POST /hs/on-lai/nop`: em bấm việc on_lai chỉ mở được luồng luyện câu sai CŨ, kết quả ở localStorage máy em, KHÔNG về máy chủ → hồ sơ không bao giờ thấy em làm đúng lại  | nguyên nhân gốc (0.Planer xác định): có lệnh LẤY câu (`/hs/cau-theo-qid`) nhưng chưa có lệnh NỘP. Làm đúng 6 điểm: (1) token HS BẮT BUỘC (`gameIdentity`; sbd trần và token PH bị từ chối; sbd trong body bị bỏ qua); chỉ nhận qid mà `/hs/cau-theo-qid` trả cho chính em (tách `layCauChoEm` dùng chung nên là MỘT tập); (2) chấm tại máy chủ bằng `isAnswerCorrect` (Phần II có dấu Đ, Phần III phẩy/chấm đều đúng), rỗng/`----`/thiếu = bỏ trống → ket_qua NULL, không cộng lan_sai; (3) ghi `su_kien_hoc` nguon='on_lai' (thêm vào `NguonSuKien`/`CAC_NGUON`; cột `nguon` KHÔNG có CHECK nên KHÔNG cần migration), ma_nguon=`on_lai:<ngày VN>`, lan=1, idempotent theo khoá — nộp lại cùng câu cùng ngày giữ lần ĐẦU (kết quả trả về được ĐỌC LẠI từ sổ nên lần hai không đổi được); (4) dựng lại hồ sơ bằng `dungLaiHoSo` (luật Leitner hiện có, đúng cùng ngày VN một mốc); (5) đáp án/lời giải/ảnh lời giải CHỈ ra SAU khi ghi sổ thành công và đọc lại được — ghi thất bại → `ok:false`, không đáp án nào trong phản hồi; kèm `tienBo {daLamCau, lenBac, tutBac}` của hôm nay; (6) `giay` 5..1200 (làm tròn) hoặc NULL. EXP: qua ĐÚNG `creditAcademic` với khoá `practice:<qid>` (2 EXP/câu đúng, mỗi câu một lần cả đời, trần 100/ngày), chỉ khi em đã có hồ sơ game (không tự tạo hồ sơ), lỗi EXP không làm hỏng lượt nộp, xung đột phiên bản thì bỏ EXP — KHÔNG chạm luật EXP theo cách chưa lường nên giữ phần EXP. | bằng chứng: commit `087ff8e`; `server/src/on-lai-nop.ts`; `tests/on-lai-nop-1909.test.ts` 23 test trên SQLite thật (không token / token sai / chỉ sbd → từ chối, ảnh chụp `su_kien_hoc` trước/sau y hệt, không lộ đáp án; token thắng sbd body; qid chưa gặp/không tồn tại bị loại, không ghi; đề chưa công bố bị loại; CÙNG TẬP với cau-theo-qid; ĐÚNG → dòng sổ đủ trường + hồ sơ moi_sai→dang_on, mốc dời, lenBac ≥ 1; SAI; BỎ TRỐNG không cộng lan_sai (lan_trong +1); giây 9 trường hợp; nộp lại giữ lần đầu (3 kịch bản); ghi sổ thất bại (trigger RAISE) → ok:false + không có đáp án, gỡ chặn nộp lại được; cau-theo-qid TRƯỚC khi nộp không có đáp án; khoá đáp án đúng 5 trường; đầu vào hỏng; EXP +2/câu, không nhân đôi, trần 100 (99 → +1), không hồ sơ game → không tạo, thiếu bảng cài đặt game → nộp vẫn thành công; các bảng ca/luot/chi_tiet_cau/ban_do_sai/tien_do_hs/btvn/mom_bai không đổi). KIỂM ĐỘT BIẾN 4 kiểu đều bị bắt: trả đáp án khi chưa ghi được (1 đỏ), nộp lại đổi kết quả (2 đỏ), bỏ kiểm token (1 đỏ), bỏ lọc câu chưa từng gặp (4 đỏ); khôi phục 23/23 xanh, chạy 5 lần ổn định (lần đầu có 1 test chập chờn do CHÍNH test so cả `cap_nhat_luc` của hồ sơ — đã sửa test, không đổi mã). Toàn vitest: 5089 test, 99 đỏ / 44 tệp; ngoài nền là 2 tệp của phiên giao diện đang sửa dở (`tests/m3-b-1909.test.tsx`; `tests/escort-context-menu.test.tsx` đỏ trong lần chạy đầy đủ nhưng chạy riêng xanh 1/1 — đổi theo tệp `src` người khác đang sửa, không liên quan `server/`); Worker không import tệp `src` nào đang dở (đã đối chiếu) → MỚI ĐỎ của Code 3 []. Worker **`8f679011`** (chốt ca thi 'SACH 8 ca'). BẢN SỐNG: không token → 'Em nhập lại mật khẩu…', token sai → cùng lời, token PH giả → 'Phiên game không hợp lệ.', mọi ca ok:false; D1 thật vẫn 0 dòng `nguon='on_lai'` (em KHÔNG có token học sinh hợp lệ và không đoán mật khẩu ai nên KHÔNG thử được đường nộp thành công trên bản sống — đường đó chỉ có bằng chứng ở test SQLite thật; `/hs/cau-theo-qid` vẫn sống sau khi tách hàm). Lùi: `git revert 087ff8e` + `./DAY-MAY-CHU.command` (các dòng sổ nguon='on_lai' nếu đã có cứ để nguyên). docs/ke-hoach-ngay-api-1909.md có mục mới 'Làm câu ôn: lấy câu → nộp → gọi lại /hs/ke-hoach-ngay'. LƯU Ý về hành vi (theo lệnh, để 0.Planer biết): nộp ĐÁP ÁN TRỐNG lấy được đáp án và lời giải mà không bị tính sai (ket_qua NULL) — đúng luật 'bỏ trống ≠ sai' đã chốt, nhưng em có thể 'xem đáp án' bằng cách nộp trống; câu đó hôm nay coi như đã làm (bị khoá theo lần đầu), mai ôn lại. || **BẢN VÁ 'NỘP TRỐNG' (0.Planer CHỐT LUẬT 19/09, thay cho lưu ý hành vi ngay trên; làm TRƯỚC Kênh 4):** đường này để ÔN, không phải bài thi có giờ — 'bỏ trống ≠ sai' là luật của bài có hạn giờ, ở đây bỏ trống là CHƯA LÀM và không được lộ đáp án miễn phí. Sửa: `daTraLoi(phan, dapAn)` cùng luật 'điền đủ' của `grade` game v2 (Phần I đúng một chữ A–D — 'Đ' KHÔNG đổi thành 'D' ở Phần I; Phần II đủ 4 ý Đ/S, 'Đ' có dấu và khoảng trắng được; Phần III có nội dung, toàn gạch = trống). Câu CHƯA trả lời (rỗng, ----, thiếu ý, sai định dạng) → KHÔNG ghi sổ, KHÔNG khoá, KHÔNG dựng lại hồ sơ, KHÔNG đáp án/lời giải, nằm trong mảng MỚI `chuaLam:[qid…]`; nộp lại sau đó được chấm như lần đầu thật sự. Chỉ câu ĐÃ TRẢ LỜI mới chấm, ghi sổ, khoá lần đầu, nhận lời giải; nên `ketQua[i].dung` luôn true|false (không còn null; ket_qua NULL không còn được ghi từ đường này). | bằng chứng bản vá: commit `85a7859`; `tests/on-lai-nop-1909.test.ts` nay 29 test (thêm/đổi: nộp trống → 0 dòng sổ + `chuaLam` + phản hồi không chứa đáp án/lời giải/ảnh + ảnh chụp `su_kien_hoc` trước/sau y hệt + chưa dựng hồ sơ; thiếu ý/sai định dạng → chuaLam; TRỘN 2 câu có + 1 trống → ĐÚNG 2 dòng sổ, đáp án câu trống không lọt; câu trống KHÔNG bị khoá, nộp lại chấm bình thường; `daTraLoi` ba phần). Chạy 3 lần cùng `cau-theo-qid`: 43/43 ổn định. KIỂM ĐỘT BIẾN 'ghi cả câu trống (bỏ lọc daTraLoi)' → 5 test ĐỎ, khôi phục 29/29. Lỗi tự bắt khi viết: test `daTraLoi` phát hiện Phần I nhận 'Đ' (bị đổi thành 'D' trước khi kiểm) — đã sửa để chuẩn hoá Đ chỉ ở Phần II. Toàn vitest: 5107 test, 97 đỏ / 42 tệp = nền (MỚI ĐỎ [] · HẾT ĐỎ ['tests/parent-news.test.ts']), KHÔNG cần loại tệp nào. Worker **`fbadbc33`** (chốt ca thi 'SACH 8 ca'). Bản sống: không token → ok:false; `/hs/cau-theo-qid` vẫn sống. Lùi bản vá: `git revert 85a7859` + `./DAY-MAY-CHU.command`. Tài liệu đã cập nhật (`chuaLam`, bỏ nói 'bỏ trống → NULL').
- [x] (0.Planer, hợp đồng Code 1 — GĐ 6 máy chủ làn giáo viên, lệnh 1+2) `hoSoLopLenBang` trả thêm `namKt` + `ghiLenBangMoi` ngừng cộng thẳng `tien_do_hs`  | cách làm đúng `docs/hop-dong-ho-so-len-bang-1909.md`: `server/src/ho-so-len-bang.ts` (mới, `docDsQid` + `docNamKtChoLop`), nối ở cuối `hoSoLopLenBang` (`goi-cu.ts`): request nhận `dsQid` (≤200, mỗi qid ≤80 ký tự, bỏ trùng/rỗng/không phải chữ); response `em[sbd].namKt[qid] = {lanSai, trangThai, canDayLai, maDang, bac, dang}` — ĐÚNG 3 truy vấn `json_each` (nam_kt_cau theo (em,qid); game_v2_question theo qid để tra mã dạng cho câu em CHƯA gặp; nam_kt_dang theo (em, mã dạng thu được)); câu em chưa gặp mà có dòng dạng → `trangThai null, lanSai 0, canDayLai false` và bậc/số liệu của DẠNG; không có gì để nói → KHÔNG có khoá; em có mặt mà không có dòng nào → `namKt: {}`; không `dsQid`/mảng rỗng/không phải mảng → không có `namKt`; thiếu bảng `nam_kt_*` hoặc lỗi → bọc, KHÔNG `namKt`, các trường cũ nguyên, `ok:true`. `ghiLenBangMoi` (`index.ts`): BỎ câu `INSERT INTO tien_do_hs … ON CONFLICT` (thầy chốt 19/09 câu 11), GIỮ `len_bang`, `qid_da_lam`, `UPDATE ban_do_sai SET da_chua`, `ghiSuKien(nguon:'len_bang')`, phản hồi vẫn `{ok:true}`. | bằng chứng: commit `2b95b40`; `tests/ho-so-len-bang-may-chu-1909.test.ts` 13 test (SQLite thật, qua `/goi` có secret): (a) đủ 6 trường đúng giá trị, sai 3 lần ⇒ canDayLai + bậc 'biet'; (b) câu chưa gặp có dạng ⇒ trangThai null + bậc/dạng cùng câu khác cùng dạng; (c) không khoá / `{}` cho em không có dòng; (d) 4 kiểu request không dsQid ⇒ không namKt; (e) DROP nam_kt_dang rồi nam_kt_cau ⇒ ok:true, không namKt, 5 trường cũ nguyên; (f) bỏ namKt thì phản hồi y hệt không gửi dsQid (JSON so từng chữ); (g) ĐÚNG +3 truy vấn bất kể 150 hay 2 qid; bậc 0/1/2 ⇒ biet/hieu/van_dung, `CD:` trả nguyên, trạng thái lạ ⇒ null; `docDsQid`; không secret ⇒ từ chối, không lộ; ghi lên bảng: +1 len_bang, +1 su_kien_hoc nguon len_bang, +1 qid_da_lam, `tien_do_hs` 0 dòng, `{ok:true}`; không qid ⇒ không ghi sổ; đường `/goi action ghiLenBang` cũng vậy; chữa đúng vẫn đánh dấu da_chua. KIỂM ĐỘT BIẾN 3 kiểu đều bị bắt (ghi mục rỗng → 1 đỏ; không bọc thiếu bảng → 2 đỏ; lên bảng vẫn cộng tien_do_hs → 3 đỏ). ĐỔI 2 TEST CŨ theo quyết định thầy (báo rõ): `tests/khoi-a-va-kho-de-1209.test.ts:92` `toContain('INSERT INTO tien_do_hs')` → `not.toContain`; `tests/su-kien-hoc-1909.test.ts:267-273` (tên và kỳ vọng `tien_do_hs {so_cau:3, so_sai:1}` → dòng không tồn tại; ghi chú cũ của chính dòng ấy đã nói 'GĐ 6 mới ngừng cộng'). Toàn vitest: 5202 test, 99 đỏ / 46 tệp; ngoài nền 4 tệp giao diện đỏ CHỈ trong lần chạy đầy đủ (`goi-len-bang-to-chieu-cham-1909.test.tsx`, `link-cu-hs-ph.test.tsx`, `the-cau.test.tsx`, `vao-thi-tu-zalo-iphone-0909.test.ts`) — chạy riêng 4/4 tệp xanh 52/52, không tệp nào tham chiếu `server/`, đổi theo tệp `src` các phiên khác đang sửa dở (MaCaInput, PhongChoGame, GoiLenBangScreen…), Worker không import chúng → MỚI ĐỎ của Code 3 []. Worker **`b94ed2bd`** (chốt ca thi 'SACH 8 ca'). BẢN SỐNG (tài khoản thầy 12121212, có mã bí mật qua header, KHÔNG in ra): xin 4 qid → `namKt` có 3 khoá: `10-C1-B1-I-52` `{lanSai 1, moi_sai, canDayLai false, maDang NGUYEN_TU.CAU_HINH_E.XAC_DINH_DIEN_TICH, bac biet, dang {soGap 1,0,0}}`, câu `-I-53` tương tự, `10-C1-B1-II-1` (thầy CHƯA gặp) `{lanSai 0, trangThai null, maDang NGUYEN_TU.THANH_PHAN.CHON_PHAT_BIEU, bac biet, dang {soGap 9,0,0}}`; qid `KHONG-CO` không có khoá; không dsQid → không `namKt`; không secret → 'Sai mã bí mật'. Lùi: `git revert 2b95b40` + `./DAY-MAY-CHU.command` (tien_do_hs vẫn được `chamDiem` dựng lại từ chi_tiet_cau như trước). GHI NHẬN theo hợp đồng mục 5: sau khi ngừng cộng, `hoSoLopLenBang.chuyenDe` (đọc `tien_do_hs`) không còn phản ánh kết quả chữa tại lớp; hồ sơ mạnh–yếu đọc sổ/hồ sơ — dựng bảng chuyên đề từ sổ là việc bước sau.
- [x] (0.Planer, hợp đồng phiên Rút đề riêng) LỆNH CỦA THẦY `hoSoOnCa {secret, dsSbd[≤20], maCa, ngayCa, soCa?}` — hồ sơ ôn cho rút đề riêng (Kênh 1)  | cách làm đúng `docs/hop-dong-ho-so-on-ca-1909.md`: `server/src/ho-so-on-ca.ts`, đăng ký trong `LENH_CUA_THAY` và switch `/goi` (`index.ts`). CHỈ ĐỌC, ĐÚNG ≤ 3 truy vấn D1/lượt (ca gần nhất mỗi em ⋈ chi_tiet_cau/ca; ban_do_sai LEFT JOIN nam_kt_cau; su_kien_hoc GROUP BY qid) — 2 truy vấn khi không em nào có ca thi (bỏ truy vấn câu sai). `tuCa` = ca thi (`loai` ≠ 'baitap', NULL tính là thi) chưa xoá, KHÁC `maCa`, em CÓ NỘP (có dòng chi_tiet_cau, qid không rỗng), sắp `ca.bat_dau` mới nhất trước (cột thật là `bat_dau`, hợp đồng ghi `mo_luc` nhưng dặn đối chiếu lược đồ thật), mỗi em một đáp số riêng, `soCa` 3 → hợp ≤ 3 ca nối ' + ', giá trị khác 1/3 ⇒ 1. `sai[]` = câu sai ở ca đã chọn MÀ hồ sơ `moi_sai`/`dang_on` {qid, lanSai, mocOnKe (sai khuôn ⇒ null), maDang, trangThai}; `daKhacPhuc[]` TƯỜNG MINH = hồ sơ `da_khac_phuc`; câu `chua_thay_sai` hoặc KHÔNG có dòng hồ sơ KHÔNG xuất hiện đâu cả (máy thầy xử luật cũ; không đoán 'vắng = đã khắc phục'). `lam[]` = qid có sự kiện trong [ngayCa − 7 ngày, ngayCa] đủ hai đầu, MỌI nguồn (kể cả on_lai) và MỌI kết quả, khử trùng theo qid, MAX(luc) GIẢM DẦN hoà thì qid TĂNG DẦN (mới nhất đứng đầu — thứ tự là phần hợp đồng), cắt ≤ 400 (bỏ phần cũ nhất, cuối mảng). Mọi sbd trong dsSbd có khoá (kể cả rỗng); dọn trùng/rỗng/không phải chữ; > 20 em (sau khi dọn) ⇒ `ok:false 'Xin quá nhiều em một lượt'` (KHÔNG cắt im lặng); thiếu bảng hoặc lỗi bất kỳ ⇒ `ok:false 'Chưa đọc được hồ sơ ôn'`, KHÔNG BAO GIỜ `ok:true` rỗng; ngayCa thiếu/sai khuôn ⇒ ngày VN máy chủ. | bằng chứng: commit `dbafd80`; `tests/ho-so-on-ca-1909.test.ts` 15 test (SQLite thật, qua `/goi` có secret): (a) 5 câu sai ở ca gần nhất ⇒ sai 2 (đủ 5 trường) + daKhacPhuc 1, câu chưa có dòng hồ sơ/chua_thay_sai/câu của ca cũ không xuất hiện; (b) mỗi em một ca (em nghỉ buổi C2 ⇒ ca C1), em chưa nộp có khoá rỗng; (c) maCa sắp mở bị loại dù em có dòng ở đó; bài tập/ca đã xoá loại, loai NULL vẫn là thi; (h) soCa 3 hợp 3 ca, câu trùng một lần, ca thứ 4 không lấy, 6 giá trị lạ ⇒ 1; mocOnKe/maDang thiếu ⇒ null; (d) cửa sổ 7 ngày đủ cả hai đầu và loại −8/+1, đủ 9 nguồn × 3 kiểu ket_qua; thứ tự MAX(luc) giảm dần hoà theo qid, khử trùng; cắt 400 đúng đầu cũ; ngayCa xấu ⇒ hôm nay; (e) 21 em ⇒ ok:false, 20 em ok, rỗng ⇒ ok, trùng/rỗng dọn, 21 nhưng trùng ⇒ 20 hợp lệ; (f) DROP từng bảng nam_kt_cau/su_kien_hoc/ban_do_sai/chi_tiet_cau ⇒ ok:false không ném lỗi và KHÔNG có khoá `em`; (g) đúng 3 (và 2) truy vấn; (i) CHỈ ĐỌC: ảnh chụp 8 bảng trước/sau y hệt; không secret ⇒ 'Sai mã bí mật'. KIỂM ĐỘT BIẾN 4 kiểu đều bị bắt: suy 'vắng = đã khắc phục' (1 đỏ), lỗi trả ok:true rỗng (1 đỏ), cắt im lặng > 20 em (1 đỏ), không loại maCa sắp mở (1 đỏ); ổn định 3 lần. Lỗi test tự bắt: test 'cắt 400' của tôi dùng giờ tròn nên 60 câu hoà giờ và hoà xử theo qid (mã đúng, test sai) → viết lại với mốc theo giây; test (f) của `ho-so-len-bang-may-chu` chập chờn vì so `serverNow` của hai lần gọi (commit `ca834c5`, chạy 5 lần ổn định). Toàn vitest lần cuối: 5283 test, 98 đỏ / 43 tệp; ngoài nền CHỈ có test chập chờn vừa nói (đã sửa) → 97 / 42 = nền, MỚI ĐỎ thật []. Worker **`c130d7cc`** (chốt ca thi 'SACH 8 ca'). BẢN SỐNG (tài khoản thầy, mã bí mật qua header, KHÔNG in): 1 em ⇒ ok, tuCa '' (thầy không có ca thi nộp), sai 0, daKhacPhuc 0, lam 198 (cửa sổ 7 ngày); 21 em ⇒ 'Xin quá nhiều em một lượt' (6/6 lần sau khi phiên bản mới thay hết; ngay sau khi đẩy có 1 lần trúng bản cũ báo 'chưa dựng lệnh' — hiện tượng lan truyền vài giây, không phải lỗi mã); không secret ⇒ 'Sai mã bí mật'. Lùi: `git revert dbafd80` + `./DAY-MAY-CHU.command` (máy thầy rơi về đường cũ khi máy chủ không có lệnh — đúng bảng tương thích ngược của hợp đồng).
- [x] (0.Planer, EXP + mảnh khiên BƯỚC 2 đợt I1+I2 — tầng D1, thầy chốt "Chốt. Quá thông minh") migration chỉ-thêm `exp_so`/`manh_khien_so`; `capNhatExp` nối vào các lệnh nộp của em + cron 00:01; cờ theo sbd `cau_hinh.exp_moi`; chuyển tiếp không trả đôi; `syncAcademic` cũ ngừng sinh khoản sau mốc; phản hồi `exp/expNhan/manhNhan/datNgay`  | bằng chứng: commit aa48f3d (I1) + đợt I2; `tests/exp-d1-1909.test.ts` + `tests/exp-noi-duong-1909.test.ts` (56 test SQLite thật, 27 đột biến đều bị bắt); Worker 7f1bcfae (I1) chạy sống, 12121212 bật cờ và 0.Planer đã kiểm `/hs/ke-hoach-ngay`. CÒN: 0.Planer kiểm nộp câu ôn qua API rồi mới mở toanBo
- [x] (0.Planer 19/09, việc nhỏ thêm vào EXP, không gấp; game "Đoàn Hộ Tống" do Code 5 viết, Code 3 vẫn là phiên duy nhất đẩy Worker + chạy migration) (1) loại khoản `tiepsuc` +3 EXP/lần, tối đa 5 lần/ngày VN, khoá `tiepsuc|<sbd>|<ngay>|<n>`; game GỌI hàm của em để ghi, không tự ghi sổ EXP  | bằng chứng: `ghiTiepSuc(env,sbd,nowMs,idLuot?)` ở `server/src/exp-d1.ts` (+3 EXP, ≤ 5 lần/ngày, khoá `<sbd>|tiepsuc|<ngày>|<n>`, idempotent theo `idLuot`); test trong `tests/exp-d1-1909.test.ts`; hợp đồng `docs/hop-dong-exp-cho-game-1909.md`
- [x] (0.Planer 19/09, cùng đợt) (2) hàm đọc-chỉ cho game: "hôm nay em này đã có khoá `dat|<ngay>` và những khoá `lo|…` đúng nhịp nào" (để phát VÉ: đạt ngày +2 vé, lô đúng nhịp +1 vé; vé do game giữ sổ riêng) + ghi hợp đồng hai hàm vào một tệp ngắn trong `docs/` cho Code 5 đọc  | bằng chứng: `docThanhTichNgay(env,sbd,nowMs,ngay?)` ở `server/src/exp-d1.ts` + hợp đồng `docs/hop-dong-exp-cho-game-1909.md`; test trong `tests/exp-d1-1909.test.ts`
- [x] (0.Planer 19/09 sau kiểm sống I1) thêm vào phản hồi `/hs/ke-hoach-ngay` trường `exp.datNgay {dat, thieu:['cau_toi_thieu'|'tre_nhip'|'chua_len_bac'], ...}` để màn biết CÒN THIẾU GÌ để đạt; ca thi công bố muộn trao bù kèm `ghiChu` "Ca … vừa công bố"; sửa lỗi biên ngày phát hành (chỉ việc SAU mốc)  | bằng chứng: `TrangThaiDatNgay` trong `exp-d1.ts`, test "trạng thái đạt ngày cho giao diện" + "ngày phát hành" + ghiChu công bố muộn trong `tests/exp-d1-1909.test.ts`
- [ ] (0.Planer 19/09, việc TỒN sau EXP) lệnh lấy/nộp riêng cho việc `on_thi` để LamCauOn của Code 2 dùng chung luồng với `on_lai`  | bằng chứng: (chưa có)
- [ ] (0.Planer 19/09 ~16:40, ƯU TIÊN CAO NHẤT) LỖI: kế hoạch ngày chọn qid cho việc `on_lai` mà `/hs/cau-theo-qid` KHÔNG phục vụ được (12121212: 3 qid, chỉ câu 3 mở được; 2 câu kia vào `khongCo`) → việc "Ôn 3 câu" không bao giờ xong, hôm sau lại mời đúng câu chết. Sửa tận gốc: MỘT hàm "phục vụ được" dùng chung cho cả kế hoạch và lệnh lấy đề (câu không phục vụ được bỏ qua, lấy câu tới hạn kế tiếp) HOẶC mở rộng nguồn nội dung; tìm nguyên nhân gốc trước (chỉ mục game thiếu? đề bảo vệ?); test tái hiện + số đo trên D1 thật (bao nhiêu % qid tới hạn cả trường không phục vụ được)  | bằng chứng: (chưa có)
- [~] (bị THAY bằng dòng RESET ở dưới: mốc mới 00:01 21/09) (0.Planer 19/09, sau khi kiểm EXP I2 đạt) BẬT `toanBo` EXP mới với mốc `tu` = 2026-09-19T17:00:00Z (00:00 giờ VN 20/09) — ghi sẵn cấu hình có `tu` TƯƠNG LAI (trước `tu` mọi em vẫn đường cũ); đường lùi = xoá dòng cờ  | bằng chứng: (chưa có)
- [ ] (0.Planer 19/09) `choThiLai` DUYỆT phương án 1→5 + LÀM khoá máy (khôi phục luật thầy chốt 08/09, nhánh `sai_may` cho lượt `duoc_duyet_lai` Y HỆT .gs: điều kiện + câu chữ; lượt không có id máy cũ thì không khoá và `khoaMay:false` nói thật; `moKhoa` gỡ được; test cho cả ba); sổ `su_kien_hoc` GIỮ; commit RIÊNG, KHÔNG đẩy — 0.Planer soát diff trước  | bằng chứng: (chưa có)
- [ ] (0.Planer 19/09) TOKEN PHỤ HUYNH phương án A, CHỈ giai đoạn MỀM (nhận cả token lẫn SBD trần, đếm số lần SBD trần; KHÔNG dựng công tắc tự bật giai đoạn cứng), `parentPass` có ràng buộc `pwd` băm như gameToken để thu hồi được, thêm lệnh PH xem kế hoạch + hạ phút/ngày; hợp đồng cho cổng PH (`?ph=…`) viết vào `docs/` rồi nhắn 0.Planer để chuyển Code 4  | bằng chứng: (chưa có)
- (thứ tự 0.Planer: (2) on_lai qid → bật toanBo đúng mốc → choThiLai → token PH → on_thi)
- [ ] (0.Planer 19/09 ~17:00, THẦY CHỐT qua hộp hỏi) RESET MỘT LẦN lúc 00:01 giờ VN thứ Hai 21/09/2026 — "Reset hết, cho chọn lại thú": EXP về 0, cấp về 1, hình thái về dạng đầu, ví/ống nghiệm, khiên đã dùng + khiên rèn + mảnh khiên về 0, tháp/thành tích game về 0, XOÁ lựa chọn thần thú + tên em đặt; MỌI em kể cả 12121212. ĐỒNG THỜI dời mốc mở EXP mới cho mọi em về đúng lúc đó (`cau_hinh.exp_moi = {tu:"2026-09-20T17:01:00Z", toanBo:true}`, 12121212 giữ cờ riêng tới lúc đó). ĐIỀU KIỆN: (1) SAO LƯU trước mọi bảng bị đụng trong cùng lượt chạy, reset chỉ chạy khi sao lưu đếm đủ dòng, khôi phục một lệnh + test; (2) MỘT LẦN, idempotent: khoá `cau_hinh.reset_than_thu_20260921 = {xongLuc, soEm}`, cron 00:01 chỉ chạy khi chưa có khoá và giờ VN ≥ mốc, có cờ huỷ `huy:true`; (3) KHÔNG ĐỤNG su_kien_hoc, nam_kt_cau/dang, ke_hoach_ngay, luot/chi_tiet_cau/điểm thi, btvn, mom_bai, len_bang, tài khoản/mật khẩu/token; (4) `exp_so` + `manh_khien_so` sao lưu rồi làm rỗng, `academic.seen` về rỗng; (5) phòng game/trận đang dở đóng sạch; (6) sau reset `/hs/ke-hoach-ngay` trả `thanThu:null`, game mở màn chọn thú, hồ sơ nắm kiến thức y nguyên — test SQLite thật; (7) TRÌNH 0.Planer TRƯỚC KHI ĐẨY: bản liệt kê nơi giữ trạng thái + diff + kết quả chạy thử trên BẢN SAO D1 cục bộ (đếm em, dòng từng bảng trước/sau); hạn xong + soát trước tối Chủ nhật 20/09  | bằng chứng: (chưa có)
- [~] (0.Planer 19/09 ~17:10, THẦY CHỐT nguyên văn "reset toàn app xoá hết ca thi và toàn bộ dữ liệu vào 00:01 thứ 2 để app mới hoàn toàn công bằng cho học sinh", hộp hỏi chọn "Xoá hết dữ liệu học sinh") — THAY dòng RESET thần thú ở trên bằng RESET TOÀN APP lúc 00:01 giờ VN thứ Hai 21/09/2026, MỘT LẦN: XOÁ mọi ca thi/lượt/chi tiết/bản đồ sai/phòng chờ/biên bản, BTVN, Mẹ giao/daily, `su_kien_hoc`, `nam_kt_*`, `ke_hoach_ngay`, tiến độ, lên bảng, hỏi bài/tin nhắn, game v2 + thần thú V1, `exp_so`, `manh_khien_so`, vinh danh, bảng tin PH, bảng tổng hợp/đệm; GIỮ danh sách học sinh + mật khẩu/token, lớp, kho đề/câu hỏi (de_kho, chỉ mục game, R2), cấu hình thầy (`cau_hinh`…), phân công, schema/migration; R2 KHÔNG xoá. ĐIỀU KIỆN: (1) bảng phân loại 58 bảng TRƯỚC khi viết job [ĐÃ GỬI 0.Planer ~17:15, chờ duyệt]; (2) ba lớp sao lưu: (a) tối Chủ nhật 20/09 ~22:00 `wrangler d1 export omr --remote` ra `/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-20260920-2200.sql` + kiểm đếm dòng từng bảng khớp bản thật (ghi sổ), (b) TRONG job trước khi xoá ghi `cau_hinh.reset_20260921 = {batDauLuc, demTruoc}` + mốc Time Travel + lệnh `wrangler d1 time-travel restore`, (c) R2 giữ nguyên; viết "CÁCH KHÔI PHỤC" vào `docs/reset-2109.md`; (3) MỘT LẦN idempotent, cờ HUỶ `cau_hinh.reset_20260921_huy`, cờ `dryRun` (chỉ đếm), xoá theo batch, chạy lại tiếp tục được, không xoá nhầm bảng GIỮ; (4) trận/ca/phiên đang dở đóng sạch, lệnh gọi lúc job chạy trả "Hệ thống đang làm mới, thử lại sau 1 phút"; (5) `mocReset` cho máy khách dọn bộ nhớ, hợp đồng `docs/moc-reset-1909.md`; (6) EXP `toanBo` + mùa 1 game từ đúng mốc, mọi em `thanThu:null`; (7) test SQLite thật (bảng XOÁ rỗng, GIỮ y nguyên băm, đăng nhập mật khẩu cũ vẫn được, lệnh chạy trên dữ liệu trống không 500, chạy lại lần hai không làm gì, cờ huỷ, dryRun, đột biến xoá nhầm hoc_sinh/de_kho/cau_hinh → đỏ); (8) trình 0.Planer: bảng phân loại → diff job → kết quả dryRun trên bản thật; 0.Planer soát xong mới đẩy; hạn xong trước 21:00 Chủ nhật 20/09. choThiLai và token PH lùi sau reset  | bằng chứng (19/09 ~17:10 giờ máy): commit 11b7c16 = 0.Planer yêu cầu sửa 5 điểm XONG: (1) CỜ LÊN ĐẠN `cau_hinh.reset_20260921_cho_phep` (mặc định không chạy, không đóng băng; huỷ thắng), (2) hạn tự chạy 01:00 VN (`qua_gio`, `/reset/chay-tiep` tay), đóng băng tới xong hoặc 01:00, dryRun báo `sanSang/lyDo`, (3) chia bước ≤ 40 truy vấn D1/lượt (đo độc lập trong test; `/reset/do-gioi-han` đo thật ≥ 1100 truy vấn/lượt ⇒ không phải Free), (4) bảng WITHOUT ROWID, (5) `/ca/danh-sach` bọc `mocReset` + tự tìm thêm `/ca/nhieu` chặn mã cũ. Test 32 (SQLite thật) + 21 đột biến bị bắt. ĐÃ chạy migration ma_da_dung `--remote` + đẩy Worker 2638e329 (job CHƯA lên đạn ⇒ 00:01 thứ Hai không xoá gì). dryRun THẬT (11 truy vấn): sanSang:true, chuaPhanLoai:[], tổng dòng XOÁ 70.934 / GIỮ 29.358, mã giữ lại 27 ca + 22 btvn + 104 mom (chi tiết trong tin gửi 0.Planer). CÒN: export thử 19/09 23:32 (hẹn cron 80a9f983) + export CHÍNH THỨC 20/09 22:33 (hẹn cron d38d3fb1; phiên còn sống thì tự chạy, không thì nhờ 0.Planer nhắn) → 0.Planer báo thầy → 0.Planer BẢO tôi bật cờ cho phép; sáng thứ Hai kiểm bằng 12121212 (thanThu:null, mocReset)
- [x] (0.Planer 19/09 ~16:50) TẠM HOÃN bật `toanBo` lúc 00:00 đêm nay (đã thay bằng dòng RESET ở trên; mốc mới 00:01 21/09)  | bằng chứng: chưa ghi cấu hình `tu` tương lai nào lên D1 thật
- [!] (0.Planer) LỖI `choThiLai` (goi-cu.ts:1364-1377): chỉ xoá lượt rồi ECHO cờ `lapMoi`/`boCauMoi` thành `khoaMay`/`daDoiDe` — không ghi bộ câu mới, không khoá máy, không chặn em đang làm dở, không xoá `ban_do_sai`  | KẸT chờ duyệt (đúng lệnh 0.Planer: CHỈ báo phương án, không sửa trước): đã gửi 0.Planer hiện trạng + phương án 1-5 + test + 3 câu cần quyết (duyệt phương án / có làm khoá máy = đổi luật vào thi / giữ hay xoá sổ `su_kien_hoc`)
- [!] Token phụ huynh (câu chốt 9)  | KẸT chờ quyết định: chạm luồng đăng nhập cổng PH nên đã DỪNG và báo 0.Planer (phương án A dùng lại `parentPass` + cờ `cau_hinh.ph_token` mềm→cứng, phương án B mật khẩu PH riêng); chưa code gì, không đụng `/parent-news`, `/mom`, `parentPass`


**Ghi nhận / lệch với đề xuất (Kênh 5, Code 3):**
1. Công thức số câu là `mục tiêu − việc bắt buộc còn lại − đã làm` (Coder 1 gợi ý), KHÔNG chỉ `mục tiêu − cung` như đề xuất mục 2. Lý do: nếu không trừ 'đã làm', khi em làm xong lô BTVN thì `tai.cung` về 0 và phụ huynh lại được giao đủ mục tiêu ⇒ tổng trong ngày vượt trần. Bài hằng ngày của CHÍNH hôm nay bị trừ khỏi `taiCung` (nó là phần đang được tính), bài Mom mẹ giao tay vẫn tính.
2. Bỏ cơ chế 'bài phụ huynh né câu ôn của bảng em' mà tôi viết đầu tiên: test D1 cho thấy nó làm mất đúng phần ưu tiên cao nhất (ôn tới hạn) khi hàng tới hạn nhỏ hơn số câu trợ lý đã chọn. GIỚI HẠN CÒN LẠI: sau khi phụ huynh giao bài hằng ngày, bảng của em vẫn có thể hiện việc 'ôn lại' trùng vài câu với bài đó cho tới khi em làm xong (mốc dời). Sửa gọn hơn cần đóng băng danh sách qid của `daily_` trong D1 (cột mới, chỉ-thêm) để kế hoạch loại — chưa làm, ngoài phạm vi lệnh.
3. Đổi hình dạng báo cáo `/parent-news/list` (phía giao diện phụ huynh nên biết): `questionCount` 0..16 (không còn ≥ 12, không còn 18/24/36); thêm `phanDu {mucTieuCau, taiCung, daLamCau, soCau} | null`; `mode` và `reason` là chữ mới, nói bằng số, không dùng chữ '3 Vòng Phân Tầng'; `keHoach.soCauSuaLoi/soCauOnBaiCu/soCauTienBo` nay là số câu ôn tới hạn (sai) / ôn duy trì (đã sửa) / câu mới cùng dạng yếu hoặc bù; `wrong` = số câu `moi_sai`/`dang_on` trong hồ sơ; `minutes` = 0 khi không giao (không còn sàn 10 phút). Không đụng `src/`.
4. Bài phụ huynh bỏ câu có `hinhAnh` rời (hình không nằm trong thân câu; Mom chưa vẽ) và câu chưa `reviewed`; em có `lop` rỗng (3 em) thì KHÔNG lọc lớp. Không có câu dùng được → lỗi rõ, không tạo bài rỗng.
5. Cron 00:01 sửa bẫy Coder 1 báo: `chayCaLop` chạy TRƯỚC rồi mới `refreshDailyNews` + `dailyHonors` (trước đây song song). `refreshDailyNews` một em thì lập kế hoạch mới (tươi khi phụ huynh mở), cả lớp thì đọc bản đã lưu và chỉ lập bù em nào chưa có dòng.
6. Việc tôi đã ghi lên D1 THẬT khi gọi thử bản sống: một dòng `mom_bai` `daily_2026-09-19` (8 câu) + một đối tượng R2 cho tài khoản của THẦY (12121212), cộng các dòng `ke_hoach_ngay`/`parent_daily_news` của 12001 và 12121212 (cùng thứ app tự ghi mỗi lần em mở). KHÔNG giao bài cho học sinh thật nào.

### BÀN GIAO CHO PHIÊN SAU (GĐ 3–6 chưa làm; GĐ 5 phần máy chủ hoãn tới khi thầy ra lệnh trực tiếp)
- **Lõi** (`server/src/`): `su-kien-hoc.ts` (MỘT hàm ghi sổ `ghiSuKien`, không bao giờ ném lỗi), `ho-so-nam-kt.ts` (`phatLaiSuKien` thuần + `dungLaiHoSo`), `ke-hoach-ngay.ts` (thuần) + `ke-hoach-ngay-d1.ts` (đọc gộp 50 em/lô, cron), `ho-so-cau-hinh.ts` (MỌI hằng số). Route ở `index.ts`: `/ho-so/*`, `/hs/ke-hoach-ngay`, `/hs/ca-dang-mo`, `/ke-hoach/chay-ca-lop`. Test 4 tệp `tests/{su-kien-hoc,ho-so-nam-kt,ke-hoach-ngay,ca-dang-mo}-1909.test.ts` chạy trên SQLite thật qua `tests/_d1-that.ts`.
- **Bẫy D1:** dùng MỘT tham số `json_each(?)` (D1 chỉ cho 100 tham số); UNION quá ~5 vế → lỗi 7500; `INSERT…SELECT…ON CONFLICT` bắt buộc có `WHERE 1`; một lượt chạy ≤ 1000 truy vấn nên cron gộp 50 em/lô (260 em ≈ 100 truy vấn).
- **Bẫy lược đồ:** bảng `ca` thật có 5 cột (`pham_vi`, `danh_sach_chon_json`, `mat_khau`, `de_rieng`, `pham_vi_hoi_lai`) mà không migration nào trong repo tạo — `_d1-that.ts` tự thêm; dựng D1 mới từ repo sẽ thiếu, cần một migration ghi lại.
- **Bẫy dữ liệu thật:** 189/189 `nop_khac_phuc` có `so_cau=0` (phiếu `sua_loi_*` máy em sinh chưa lên R2) → sổ chấm bằng tờ kho theo qid (`cauTuKhoTheoQid`). `homeworkQuestions` loại Phần III đáp án mô tả dài và tờ `-VD/-DT` nên sổ BTVN ít hơn `btvn_em.so_cau` 135 dòng — KHÔNG phải lỗi. `ke_hoach_ngay` có 1 dòng thử `00000000`, giữ nguyên.
- **Bẫy mã/test:** `tests/btvn-len-bang-1409.test.ts:255` soi NGUYÊN VĂN dòng `homeworkKeys(await homeworkQuestions(env,chuoi(bt.ma_de)))` trong `goi-cu.ts` — đừng tách dòng; route mới trong `index.ts` phải `return await` (không thì lỗi lọt khỏi `catch`); đường công khai phải kiểm SBD có thật TRƯỚC khi ghi.
- **So nền vitest:** `npx vitest run --reporter=json --outputFile=/tmp/x.json` rồi so `testResults[].name` có `status:'failed'` với `docs/nen-vitest-do-1909.txt` (nền 98 test / 43 tệp, đo trước mọi thay đổi 19/09). Khi so, LOẠI `tests/bang-nhiem-vu-1909.test.tsx` và `tests/nhiem-vu-adapter-1909.test.ts` (của phiên Giao diện, có thể đỏ tạm) — bỏ hai tệp đó mà không ra đúng nền thì lỗi là của mình.
- **Phát hành:** chỉ `./DAY-MAY-CHU.command < /dev/null` (có chốt ca thi; mã thoát 1 là do `read` cuối gặp EOF, xem dòng ">>> MÁY CHỦ ĐÃ LÊN"); migration `cd server && npx wrangler d1 execute omr --file=<tệp> --remote -y`. Mã bí mật thầy ở `/Volumes/SSD NGOÀI/kho-de/cau-hinh.json` (header `x-ma-bi-mat`) — không in ra, không ghi vào tệp.
- **GĐ 5 — điểm vào (Coder 1 đã đọc, chưa làm):** (K4) `readScope` (`game-v2-bank.ts`): thêm bằng chứng từ `nam_kt_cau` bằng cách đẩy thêm dòng `{qid, ma_ca:nguon, lan_thu:1, nop_luc, dung_sai}` vào `rows.results` trước khi ánh xạ sang `Evidence` (đã có sẵn qua `game_v2_question`); BỌC try/catch vì fixture `tests/than-thu-v2.test.ts` không có bảng `nam_kt_*`/`su_kien_hoc`; CHỈ lấy qid có sự kiện nguồn KHÁC `thi`/`game` (ca thi chưa công bố không được lọt), qid có ở cả hai nơi thì để `nam_kt_cau.trang_thai` quyết `wrong`. Mốc ôn "một đồng hồ": KHÔNG sửa `advance` (khoá thưởng 20/40/40) — ở `game-v2.ts` action `start` truyền cho `chooseSession` một BẢN SAO `p.mastery` với `due` = `moc_on_ke` của `nam_kt_dang`. `chooseSession` đã nhận `now` máy chủ; `blocked` = thêm qid có sự kiện hôm nay (nguồn ≠ game) vào Set `blocked` sẵn có (`allowed()` đã soi `blocked.has(qid)`). Không cần đụng `src/game/**`.
- **GĐ 5 — `game_v2_task`:** sinh trong `lapVaLuuKeHoach` (`ke-hoach-ngay-d1.ts`) sau khi lập kế hoạch: việc `than_thu` nhãn `bu` → `INSERT OR IGNORE INTO game_v2_task(id,sbd,dang,created_at) SELECT … FROM json_each(?) … WHERE NOT EXISTS (task mở cùng dạng) AND (số task mở) < 3`, id `${sbd}|than_thu|${ngay}|${dang}`; game `complete` tự đóng task theo dạng; kế hoạch đã đọc task mở (`nhiemVuThanThu`) nên nhiệm vụ PH nhắc được ưu tiên.
- **GĐ 5 — `parent-news.ts` (kênh 5):** `analyzeParent(sbd, exams, details, pending, now, pendingDetails)` thuần, đang ra 12–18 câu theo "3 Vòng" (tệp test đang ĐỎ ở nền: dòng 31 của `docs/nen-vitest-do-1909.txt`; test 71-95 đòi 18/24/36 mà mã chỉ tới 18 — kiểm cái nào đỏ trước khi sửa 12-34/xoá 71-95). Cách gọn: thêm tham số kế hoạch tuỳ chọn, thiếu thì tự dựng bằng `lapKeHoachNgay` với `DauVaoKeHoach` mặc định; `questionCount = max(0, mucTieu − tai.cung − daLam)`. BẪY: trong `scheduled` (`index.ts`) `refreshDailyNews` chạy SONG SONG `chayCaLop` lúc 00:01 → phải chạy `chayCaLop` trước rồi mới `refreshDailyNews`; đường PH mở app (`parentNews`) gọi `lapVaLuuKeHoach(env,[sbd],now)` trước. `data()`: `pendingDaily` thêm `AND (id='daily_'||ngày OR started_at IS NOT NULL)`, `homework` thêm `AND b.han_nop > now`.
- **GĐ 5 — nguồn câu cho `assign`:** dùng `game_v2_question.json` (PrivateQuestion đủ `text, choices, ideas, correct, solution, dang, mucDo`; lọc `reviewed`, bỏ câu có hình, loại `protectedQuestions`) — KHÔNG cần đọc R2; câu ôn tới hạn lấy theo qid, câu mới lấy theo dạng yếu ở `bac ≤ nam_kt_dang.bac` (biet/hieu/van_dung = 0/1/2), loại qid có sự kiện 3 ngày qua (`su_kien_hoc.ngay_vn`). LỖI GỐC K5.5 `layCauTuKhoDe`: tờ kho R2 KHÔNG có `text`/`dapAnDung`/`choices` mà là `de`, `dap_an`, `pa{A..D}`, `y{a..d}`, `chuyen_de`, `muc_do`, `phan`, `so` — nên hàm luôn trả rỗng; ánh xạ `de→text, pa→choices, y→ideas, dap_an→dapAnDung` và lọc `de_kho.lop`. Mom dùng `id` = qid thật thì `questionOutcomes` khớp (hết lỗi `cau_N`).
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

## Code 3 · 21/09 · Reset bản mới (giữ hồ sơ, chạy theo lệnh) + sửa test đỏ làn máy chủ

- [x] (Boss 21/09 00:08, nguyên văn thầy: "tiếp tục tới khi xong hết thì tiến hành reset luôn, tôi muốn bạn cho chọn lại thú, xoá hết mọi ca thi và btvn nhưng GIỮ LẠI toàn bộ hồ sơ mạnh yếu của học sinh đã kiểm tra trước đó") JOB RESET BẢN MỚI: GIỮ `su_kien_hoc`, `nam_kt_cau`, `nam_kt_dang`, `tien_do_hs`, `qid_da_lam` (+ `ph_truy_cap`); XOÁ thêm `doan_ve_so`, `doan_trum_lop` (Code 5 bước 5); chạy THEO LỆNH (cờ `reset_toan_app_cho_phep`, `cap_nhat_luc` = lúc lên đạn), cửa sổ tự chạy + đóng băng 60 phút, `mocReset` = ngày VN lúc XONG, mùa `<ngày VN lúc bắt đầu>-mua-1`, `exp_moi.tu` = lúc bắt đầu | bằng chứng: `tests/reset-toan-app-1909.test.ts` 44 test xanh (SQLite thật); bộ đột biến 22/22 bị bắt (xoá nhầm su_kien_hoc/nam_kt_cau/nam_kt_dang/tien_do_hs/qid_da_lam, tu sai, dsSbd còn, readScope + EXP ẩn câu thi ca đã xoá, mocReset theo ngày bắt đầu, cửa sổ 120 phút, bỏ cờ lên đạn/huỷ/mốc/hạn/xong, qua_gio vẫn đóng băng, quên bảng Đoàn, mùa sai tên; 1 đột biến lọt (qua_gio vẫn đóng băng) lộ lỗi thật "lên đạn lại sau qua_gio không đóng băng" → sửa `dangLamMoi` + thêm test)
- [x] (Boss) Rà chỗ nối sổ/hồ sơ với ca/lượt/btvn để hệ thống chạy khi "hồ sơ còn, ca/lượt/btvn trống": sự kiện `thi` của ca KHÔNG còn trong `ca` tính là ĐÃ công bố ở `exp-d1.ts` (capNhatCoTu, fail-closed nếu không đọc được `ca`) và `game-v2-bank.ts` readScope; các đọc còn lại chỉ đọc hồ sơ/kho nên không đổi | bằng chứng: test "HỒ SƠ CÒN – CA/LƯỢT/BTVN TRỐNG" (readScope trước/sau, qidPhucVuDuoc + protectedQuestions, kế hoạch on_lai có thêm câu hết bị bảo vệ, layCauChoEm, hoSoLopLenBang trước = sau, dungLaiHoSo sau reset ra đúng hồ sơ cũ) + test EXP "sổ cũ nguyên mà tổng EXP sau reset = 0; lên bậc +6 cả câu sai ở ca thi đã xoá"
- [x] Lệch lược đồ `cau_hoi_em.da_xoa` (Code 4 báo): cột ĐÃ CÓ trên D1 thật (`pragma_table_info`, INTEGER NOT NULL DEFAULT 0); không viết migration (chạy lại lỗi "duplicate column"); thêm vào danh sách bù `tests/_d1-that.ts` | bằng chứng: pragma_table_info 21/09 00:30
- [x] Sửa test đỏ làn máy chủ (Boss/Code 2/Code 5 báo 110 đỏ): mỗi dòng test đổi + lý do:
  · `tests/ca-dang-mo-1909.test.ts` (HAI truy vấn), `tests/cau-theo-qid-1909.test.ts` (3 truy vấn + đề bảo vệ), `tests/ho-so-len-bang-may-chu-1909.test.ts` (g): thêm 1 lệnh làm nóng bộ nhớ đệm cổng đóng băng (`/khong-co-duong-nay`) TRƯỚC khi đếm; lý do: cổng đọc `cau_hinh` một lần mỗi 3 giây mỗi isolate, phép đo phải tách khỏi chi phí cổng (số truy vấn của LỆNH không đổi)
  · `tests/man-ca-thi-may-chu-moi-1109.test.ts`: cửa sổ đọc mã nguồn `dayNhieuCa` 4200 → 5200 ký tự; lý do: khối lọc mã ca cũ (reset) thêm ~700 ký tự phía trên dòng `await env.DB.batch(cau.slice(i, i + 200))`, hàm không đổi
  · `tests/ke-hoach-than-thu-1909.test.ts`: bộ khoá mong đợi thêm `doanMo`; lý do: `/hs/ke-hoach-ngay` thêm `doanMo` ở gốc từ cb80f0d (cờ mở game Đoàn, không thuộc kế hoạch)
  · `tests/reset-toan-app-1909.test.ts`: VIẾT LẠI (thiết kế mới, không còn mốc 21/09 00:01 cố định; test dựng ngày cố định bằng `LEN_DAN_MS`, không phụ thuộc đồng hồ máy)
  · WeakMap "Invalid value used as weak map key" (`btvn-submit-1609`, `teacher-news`): `server/src/reset-toan-app.ts` chỉ dùng bộ nhớ đệm khi `env.DB` là object/function
- [ ] Đẩy Worker + chạy migration `2109-game-doan-mua` (Boss 21/09 00:35) | bằng chứng: Worker 2e9f32a3 từ b6dd4a3 (có 0235a4d bước 5 + doanMo); migration chạy `--remote` (đã đọc trọn tệp: chỉ CREATE IF NOT EXISTS); `/hs/ke-hoach-ngay` 12121212: doanMo:true, chưa có mocReset. CHƯA đẩy: job reset bản mới (chờ Boss duyệt diff + dryRun)
- [x] (0.Planer/Boss) TOKEN PHỤ HUYNH giai đoạn MỀM (chỉ mềm, KHÔNG tự chuyển cứng): `server/src/ph-truy-cap.ts` (`sbdCuaPhuHuynh`: `pass` thắng `sbd` trong thân, token hỏng KHÔNG rơi xuống SBD trần, đếm `ph_truy_cap` không làm hỏng lệnh chính), nối `parentNews` (nguồn 'ph'/'hs'), `mom` parent-list/create (`noiBo` cho bài hằng ngày), lệnh mới `/ph/xac-dinh`, `/ph/ke-hoach` (khung nhìn KHÔNG lộ mã câu/bài/ca, không chữ ghiChu), `/ph/thoi-gian-hoc` (dùng chung `datPhutMoiNgay` với `/hs/thoi-gian-hoc`), thầy `/ph/cap-ma` (theo dsSbd/lớp ≤ 100, liên kết `<Pages>/ph?ph=…`, token 90 ngày gắn mật khẩu em), `/ph/dem-truy-cap`; migration `migration-1909-ph-truy-cap.sql` ĐÃ chạy `--remote`; hợp đồng `docs/token-phu-huynh-1909.md` | bằng chứng: `tests/token-ph-1909.test.ts` 17 + `tests/token-ph-auth-1909.test.ts` 7 xanh; đột biến 16/16 + 8/8 bị bắt; toàn vitest 99 đỏ/44 tệp = nền 97/42 + 2 tệp giao diện của phiên khác (dao-chon-ban-dong-hanh, goi-len-bang-noi-buoi), parent-news nay xanh
  · test đổi thêm: `tests/mom-delivery.test.ts` — bộ giả D1 bỏ qua câu SQL `ph_truy_cap` (lệnh `mom create` của phụ huynh nay ghi thêm một dòng đếm, bộ giả coi mọi `INSERT` là bài Mom); `tests/reset-toan-app-1909.test.ts` — `dem()` chịu bảng chưa tồn tại (BANG_XOA nêu trước `doan_trum_cau` của bước 6)
- [x] (Code 4 21/09, hợp đồng docs/hop-dong-gv-hom-nay-2109.md) LỆNH ĐỌC-CHỈ `POST /ke-hoach/hom-nay-thay` cho màn HÔM NAY app giáo viên: `server/src/hom-nay-thay.ts` (chỉ đọc, 8 truy vấn, mỗi khối try/catch riêng → null + lyDoThieu; nhiemVu theo công thức chotNgayCu; btvn.dangChay; canYTuong ≤ 8 em một lý do; dangYeu theo lớp không lộ json; doan chỉ khi cờ bật); định nghĩa chọn ở `docs/hom-nay-thay-may-chu-2109.md`; `ke-hoach-ngay-d1.ts` tách `phanTichNgayNghi` (phần thuần) | bằng chứng: `tests/hom-nay-thay-1909.test.ts` 12 test (kịch bản đủ khối, chỉ đọc = mọi bảng y nguyên, ≤ 8 truy vấn, thiếu từng bảng, 6 lớp, xác thực); đột biến 26/26 bị bắt (2 lọt ban đầu, bổ sung dữ liệu bắt được)
- [x] (0.Planer 19/09, việc TỒN; Boss 21/09 mục 4) `on_thi`: lệnh lấy/nộp cho LamCauOn dùng chung luồng với `on_lai` → làm bằng cách cho việc `on_thi` MANG DANH SÁCH CÂU (`chiTiet.qid`, ≤ 4) chọn từ hồ sơ em (`ke-hoach-ngay.ts` `cauOnThi`, nạp ở `ke-hoach-ngay-d1.ts` CHỈ khi lớp có ca sắp tới, lọc phục vụ được), nên KHÔNG cần lệnh `/hs/on-thi/*` riêng: `/hs/cau-theo-qid` + `/hs/on-lai/nop` chạy nguyên; không có câu thì không giao việc rỗng; `catViec` cắt cả qid của on_thi; hợp đồng ở docs/ke-hoach-ngay-api-1909.md | bằng chứng: `tests/on-thi-cau-1909.test.ts` 6 + `tests/ke-hoach-ngay-1909.test.ts` 48 xanh; đột biến 10/10 bị bắt; 18 tệp liên quan 398 test xanh
  · test đổi: `tests/ke-hoach-ngay-1909.test.ts` "ôn thi là việc MỀM" — trước đòi on_thi `soCau: 4` chỉ cần có ca; nay ĐÒI có câu ứng viên (`cauOnThi`), lý do: việc on_thi phải mang câu làm được, không giao việc rỗng; thêm 2 test (chọn câu, cắt theo phần thiếu)
- [x] (Boss 21/09 ~01:30, thầy đổi nguyên văn "Khi reset giữ lại toàn bộ ca thi đã thi") RESET GIỮ MỌI CA THI: 14 bảng `ca`, `luot`, `chi_tiet_cau`, `ban_do_sai`, `phong_cho`, `chan_vao`, `trang_thai`, `phieu`, `kho_ca_them`, `nhan_xet`, `de_rieng`, `dong_bo`, `nop_khac_phuc`, `tien_do_ca` chuyển XOÁ → GIỮ (XOÁ còn 32, GIỮ 34); KHÔNG nạp mã ca vào `ma_da_dung` (chỉ BTVN + Mẹ giao); `/ca/nhieu` nay không chặn ca CÒN trong bảng `ca` (trước chỉ publish/capNhatKeyBank/noiKhoCa có điều kiện đó); EXP `tu` = lúc bắt đầu nên điểm ca đã nộp trước reset không sinh `diem_ca` | bằng chứng: `tests/reset-toan-app-1909.test.ts` 45 test xanh (băm 14 bảng ca thi y nguyên, ca chưa công bố vẫn ẩn/bảo vệ, xoá cứng ca thì coi đã công bố, EXP `diem_ca` trước reset > 0 sau reset = 0, chặn mã ca nạp tay vẫn chạy và không chặn ca còn trong bảng ở 4 đường); đột biến 35/35 bị bắt (gồm xoá nhầm từng bảng trong 14 bảng ca thi + 5 bảng hồ sơ); docs/reset-2109.md + docs/moc-reset-1909.md cập nhật
  · test đổi: `tests/reset-toan-app-1909.test.ts` — bỏ 2 test "mã ca cũ bị từ chối sau reset" và test `/ca/nhieu` mã cũ, thay bằng 2 test (ca thi được giữ + đẩy lại ca cũ không bị chặn; chặn mã nạp tay vẫn chạy); viết lại 2 test tình huống theo ca được giữ; lý do: thiết kế mới không xoá ca
- [x] (Code 1 21/09, docs/hop-dong-giay-thuc-len-bang-1909.md) cột chỉ-thêm `len_bang.giay_thuc REAL` (migration `migration-1909-len-bang-giay-thuc.sql` ĐÃ chạy `--remote`) + `POST /len-bang` đọc `giayThuc` (số hữu hạn 20..1800 thì ghi, còn lại NULL, không bao giờ từ chối vì trường này; cột chưa có thì ghi như cũ; lỗi D1 khác không bị nuốt); phản hồi/lichSuLenBang/sổ không đổi | bằng chứng: `tests/len-bang-giay-thuc-1909.test.ts` 6 test xanh, đột biến 7/7 bị bắt; reset (45) vẫn xanh
- [x] (Boss 21/09) LỆNH THẦY CHỈ ĐỌC `POST /gv/ke-hoach-em {sbd}` (mã bí mật): `server/src/gv-ke-hoach-em.ts` trả {ok, sbd, ngay, capNhatLuc, lanNghi, ketQua, nganSach, viec, canhBao, quaHan, sapToi, tai, tienBo, tonCu, tonCuTong, thanThu, exp{homNay,chiTietHomNay,manhKhien}} đọc từ dòng `ke_hoach_ngay` hôm nay + `exp_so`/`manh_khien_so` + `game_v2_profile`; chưa có dòng ⇒ {ok:true, chuaCo:true, ngay}; 0 INSERT/UPDATE (không lập kế hoạch, không `capNhatExp`), để màn Học sinh của thầy không nuốt `expNhan` của em | bằng chứng: `tests/gv-ke-hoach-em-1909.test.ts` 7 test (ghi lại MỌI câu SQL: không INSERT/UPDATE/DELETE/DDL/batch; mọi bảng y nguyên từng byte; em mở app sau vẫn nhận đủ `expNhan`); đột biến 7/7 bị bắt. CHƯA đẩy Worker (chờ Boss soát)
- [x] (Code 1 21/09) `khoaMay: boolean` (chỉ-thêm, chỉ có/không, không trả mã máy) trên MỖI dòng lượt của `/ca/chi-tiet` và `/ca/luot` | bằng chứng: `tests/khoa-may-luot-1909.test.ts` 3 test; 4 tệp test lượt/ca cũ xanh (trừ 1 test nền đỏ sẵn có của app thầy)
- [!] (Boss 21/09 ~02:28 "LÊN ĐẠN") RESET THẬT: (1) bookmark Time Travel mới lúc 02:29 giờ máy `0000023b-000075ef-000050ec-774297576c1e0cb9286ebab838de4dad`; sao lưu `omr-d1-20260921-0225.sql`; (2) dry-run; (3) đặt cờ `reset_toan_app_cho_phep`; (4) theo dõi tới `xong`, báo Boss | KẸT 02:31: bước (1)(2) xong (bookmark ghi ở trên; dry-run sanSang, chuaPhanLoai [], XOÁ 15.428 / GIỮ 93.354, ca 27, luot 265, su_kien_hoc 26.445). Bước (3) đặt cờ `reset_toan_app_cho_phep` bị hệ thống phân quyền của phiên này CHẶN ([Modify Shared Resources], lệnh xoá dữ liệu thật đến từ phiên khác chứ không phải thầy gõ trực tiếp). Cờ CHƯA đặt, D1 chưa đổi gì. Chờ thầy cho phép trực tiếp.
- [x] (Boss 21/09 "LÊN ĐẠN"; thầy gõ "reset" trực tiếp trong phiên Code 3 lúc ~05:04, sau khi lần đặt cờ đầu bị phân quyền chặn — dòng [!] ngay trên được thay bằng dòng này) RESET THẬT XONG | bằng chứng: bookmark mới `0000023b-00007c65-000050ec-d162557c611e647e9ca96959d98971e8`; dry-run trước: sanSang, chuaPhanLoai [], XOÁ 15.428 / GIỮ 93.356; cờ đặt 05:05:26 giờ máy; khoá `reset_toan_app` = xong, batDauLuc 2026-09-20T22:05:46.695Z, xongLuc 22:06:44.816Z (≈ 1 phút, 2 lượt), loi null, xoaConDu null, mocReset "2026-09-21", mua "2026-09-21-mua-1", `exp_moi` {tu: batDauLuc, toanBo:true}, soEm 261; 14 bảng ca thi + 5 bảng hồ sơ demSau = demTruoc từng bảng (ca 27, luot 265, chi_tiet_cau 4.748, su_kien_hoc 26.445, nam_kt_cau 15.321, nam_kt_dang 6.772, tien_do_hs 295, qid_da_lam 4.679); mọi bảng XOÁ = 0 lúc chốt (btvn 22, btvn_em 638, mom_bai 241, ke_hoach_ngay 784, game_v2_profile 234, than_thu 63, exp_so 25 … → 0); `ma_da_dung` 128 dòng (22 btvn + 106 mom); `/hs/ke-hoach-ngay` 12121212: mocReset "2026-09-21", thanThu null; dry-run sau: daXong true, 3 dòng mới ở bảng XOÁ (ke_hoach_ngay, game_v2_profile, daily_honors) do hoạt động sau reset (gồm lần kiểm 12121212 của em), không phải sót
- [x] (Boss 21/09, thầy "thêm 2 nút luôn") `docs/hop-dong-them-phut-2109.md` mục 1: `POST /ca/them-phut {maCa, phut}` (`server/src/them-phut.ts`: chỉ cộng, phút nguyên 1..15, trần 30/ca, ca `mo` không `baitap`; MỘT batch hai câu cùng điều kiện lạc quan `them_phut_tong`, chồng nhau ⇒ không đổi gì + `thuLai`), `examStatus` trả `hetGioLuc` của lượt đang làm (cùng một lượt gọi D1), `/ca/chi-tiet` trả `ca.themPhutTong`, migration `server/migration-2109-them-phut.sql` (`ca.them_phut_tong` chỉ-thêm; CHƯA chạy `--remote`, chờ Boss soát) | bằng chứng: `tests/them-phut-may-chu-1909.test.ts` 10 test xanh, đột biến 15/16 bị bắt (1 lọt là mutant tương đương: `typeof` thừa vì `Number.isInteger` đã từ chối chuỗi); toàn vitest 98 đỏ/43 tệp = nền + 1 tệp giao diện của phiên khác (man-thi-than-m3), parent-news xanh. Định nghĩa chọn (khoa/duoc_duyet_lai không cộng, hạn hỏng bỏ qua, chú ý publish): `docs/them-phut-may-chu-2109.md`
  · test đổi: `tests/_d1-that.ts` — `batch` của D1 giả trả `results` cho câu SELECT (như D1 thật; trước trả rỗng vì gọi `run()`); lý do: `examStatus` đọc hạn lượt trong cùng batch với câu ghi
  · sự cố: `tests/them-phut-1909.test.ts` do Code 2 tạo cùng tên và ghi đè bản của em (tệp chưa commit); test máy chủ đổi sang `tests/them-phut-may-chu-1909.test.ts`
- [x] (Boss 21/09, thầy lệnh) `docs/hop-dong-doi-ten-hoc-sinh-2109.md` mục 1: `POST /hoc-sinh/doi-ten {sbd, hoTen}` (`server/src/doi-ten-hoc-sinh.ts`): CHỈ cột `ho_ten` theo đúng SBD ở `danh_sach`, `hoc_sinh`, `luot`, `btvn_em`, `phong_cho` (bản chép chỉ sửa dòng ĐÃ có tên, không biến NULL/'' thành tên); KHÔNG đụng `phieu`, `chan_vao`, `phu_huynh`; chuẩn hoá NFC + gộp khoảng trắng + cắt đầu/cuối, 2..60 ký tự, cấm ký tự điều khiển/định dạng (Cc, Cf: gồm ký tự rộng 0 và bidi override); em không có ⇒ từ chối; trùng tên hiện tại ở MỌI bảng ⇒ `{ok:false, khongDoi:true}` không ghi, còn lệch thì vẫn sửa bản chép; bảng/cột chưa có ⇒ bỏ qua; một batch; trả `{ok, sbd, tenCu, tenMoi, soDong{5 bảng}}` | bằng chứng: `tests/doi-ten-hoc-sinh-may-chu-1909.test.ts` 11 test xanh (mọi cột khác và mọi bảng khác y nguyên từng byte; S2 cùng tên cũ không đổi), đột biến 14/15 bị bắt (1 lọt là mutant tương đương: `phu_huynh` không có cột `sbd` nên bị bỏ qua). Không cần migration. CHƯA đẩy Worker (chờ Boss soát)
