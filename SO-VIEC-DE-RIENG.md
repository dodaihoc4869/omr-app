# SỔ VIỆC — GĐ 6 · RÚT ĐỀ RIÊNG (Kênh 1) đọc hồ sơ nắm kiến thức

Phiên: worktree `busy-austin-a4ab8b` · nhánh `claude/busy-austin-a4ab8b` · mở 19/09/2026.
Điều phối: phiên **0.Planer** (thầy đã uỷ quyền — không hỏi thầy). KHÔNG phát hành, KHÔNG push, KHÔNG merge, KHÔNG đụng `server/**`.

## ĐỌC TRƯỚC — hai điều người gộp nhánh phải biết

1. **+1 test đỏ CÓ CHỦ Ý** (0.Planer chốt phương án A, 19/09): `tests/cat-google-1209.test.ts` › "MỌI lệnh app còn gửi đều có mặt trong bảng dịch
   của máy chủ mới" báo `Máy chủ mới chưa dựng: hoSoOnCa`. Test quét `action: '<tên>'` trong `exam-api.ts` rồi đòi `case '<tên>':` trong
   `server/src/index.ts`. Nó TỰ XANH khi phiên máy chủ thêm `case 'hoSoOnCa':` theo hợp đồng. 0.Planer dùng chính test này làm CHỐT GỘP NHÁNH:
   chỉ gộp nhánh này SAU KHI lệnh đã sống. Tôi từ chối cách giấu tên lệnh vào hằng số cho regex không bắt — đó là né test.
2. **Việc 5 (seed thi lại) BỎ** — 0.Planer rút lại yêu cầu (chốt phương án B). `thi-lai.ts` và `tests/cho-thi-lai.test.ts` KHÔNG đổi một chữ.

## Nền trước khi sửa (đo tại worktree này, commit `6eefaa3`)

- 9 tệp bất biến: **202 passed / 2 failed** — 2 test đỏ SẴN, đúng nền:
  `danh-dau-cau-hoi-lai.test.ts` ("MÁY CHỦ CHƯA CẬP NHẬT VẪN CHẠY ĐÚNG — hai bản đồ gửi ở HAI trường riêng"),
  `de-rieng-luc-bat-dau.test.ts` ("CHẾ ĐỘ NÀY TỰ BẬT PHÒNG CHỜ, và không tắt được").
  Từng tệp: de-rieng 18/0 · de-rieng-tran-trung 22/0 · de-rieng-blueprint 25/0 · kho-mong-rut-lap-thong-minh-1909 7/0 ·
  rut-du-so-cau-de-rieng-1409 7/0 · noi-chan-tran-trung-vao-ca 14/0 · rut-de 40/0 · de-rieng-luc-bat-dau 13/1 · danh-dau-cau-hoi-lai 56/1.
- `tests/thi-lai*` KHÔNG tồn tại; test của thi lại là `tests/cho-thi-lai.test.ts` (18/0).
- Toàn bộ, đo TRƯỚC mọi thay đổi: **97 test đỏ / 42 tệp đỏ / 4989 test / 364 tệp**. Đây là tập con của nền ghi sổ 98/43
  (`docs/nen-vitest-do-1909.txt`): `tests/parent-news.test.ts` đã được một commit sau sửa xanh. Không tệp đỏ nào nằm ngoài nền.
  Lệnh: `npx vitest run --reporter=json --outputFile=<tệp>` rồi so tên từng test đỏ.

## Việc (nguyên văn đề bài, tách từng vế)

- [x] 1a. Hợp đồng lệnh máy chủ mới `hoSoOnCa` → `docs/hop-dong-ho-so-on-ca-1909.md` (tên lệnh, tham số {secret, dsSbd[], maCa, ngayCa} + `soCa` tuỳ chọn, phản hồi từng sbd, ví dụ JSON, ≤ 3 truy vấn/lượt, chia lô 20 em, bảng tương thích ngược, 3 truy vấn gợi ý, 9 test gợi ý) | bằng chứng: commit `036dc26`
- [x] 1b. `src/lib/exam-api.ts`: chỉ THÊM hàm `hoSoOnCa` (26 dòng, không sửa dòng nào khác) | bằng chứng: `git show c089e6e --stat -- src/lib/exam-api.ts`; test "exam-api.hoSoOnCa: gửi đúng action + tham số; ok:false thì NÉM LỖI"
- [x] 1c. Máy chủ chưa có lệnh / trả lỗi → RƠI VỀ đúng hành vi hiện tại, có test | bằng chứng: mục 6 của test mới — 30 lớp giả chạy qua MÃ CŨ `6eefaa3` lấy dấu vân tay `boTheoEm`, bản mới không hồ sơ khớp 30/30; `dungDeRiengChoCa` với `hoSoOnCa` ném lỗi ⇒ `boTheoEm`/`lapTheoEm`/`songSinhTheoEm` bằng lõi gọi không hồ sơ + biên bản có dòng "hồ sơ ôn … rút đúng luật cũ". Thêm lúc làm: so trực tiếp mã cũ–mới 40 cấu hình `sinhBoMotO` + 30 lớp `dungDeRieng` (mọi trường) — y hệt; tốc độ 1777 → 1788 ms.
- [x] 2. PHA A: bỏ câu `da_khac_phuc` (số CẦN giữ nguyên trên số câu SAI ca trước, thiếu ⇒ trả ít + lyDo `da_khac_phuc`, không độn); cùng mức ưu tiên thì câu `mocOnKe ≤ ngayCa` đứng trước; sai ≥ 3 vẫn `canDayLai` | bằng chứng: mục 1 (6 test) + mục 2 (3 test) của `tests/de-rieng-ho-so-1909.test.ts`
- [x] 3. SONG SINH: khoá theo `ma_dang` (thiếu → khoá cũ), xoay theo em bằng `hashSeed`, không `Math.random` | bằng chứng: mục 3 (10 test): 4 em → 4 câu song sinh khác nhau; 2 ứng viên + 2 em → khác nhau ở cả 40 seed; test soi mã nguồn cấm `Math.random(`
- [x] 4. PHA B: tập cấm theo từng em = `lam`; giữ bất biến; kho mỏng → nới đúng em đó, cũ nhất trước, BÁO số | bằng chứng: mục 4 (10 test: đủ câu, không dính câu cấm, kho 200 đỉnh ≤ 2, kho 300 ≤ 1, kho dư → 0, lệch tần suất ≤ 1, câu khoá không mất, 40 cấu hình ngẫu nhiên, tất định, tập rỗng ≡ không truyền, 60×40 kho 300 < 500 ms) + mục 5 (3 test nới)
- [bỏ — 0.Planer rút lại yêu cầu] 5. `thi-lai.ts:79` seed `Date.now()` → seed theo `lanThu`. Lý do 0.Planer: test `cho-thi-lai.test.ts:77` ghi một Ý ĐỊNH có chủ đích ("bấm hai lần ra hai đề"); bộ câu rút xong được LƯU nên chấm lại không chạy lại seed; và `choThiLai` xoá `luot` nên `lan_thu` luôn quay về 1 ⇒ seed theo `lanThu` cho ra CÙNG đề ở lần thi lại thứ hai. | bằng chứng: `git diff 6eefaa3 -- src/lib/thi-lai.ts tests/cho-thi-lai.test.ts` rỗng; `cho-thi-lai.test.ts` 18/0
- [x] 6. `ExamMonitorScreen.tsx`: `dsCho` nhánh đề riêng = phòng chờ; giữ mọi chuỗi 2 test soi mã đòi | bằng chứng: commit `a80db49`; mục 8 của test mới (2 test, ĐỎ trên bản cũ của màn — đã kiểm bằng `git show 6eefaa3:…`); `noi-chan-tran-trung-vao-ca` 14/0, `de-rieng-luc-bat-dau` 13/1 (đỏ sẵn)
- [x] 7. Test mới `tests/de-rieng-ho-so-1909.test.ts` | bằng chứng: `npx vitest run tests/de-rieng-ho-so-1909.test.ts` → **46 passed**
- [x] 8. Bất biến xanh nguyên từng tệp | bằng chứng: chạy lại 9 tệp + cho-thi-lai + tệp mới sau khi sửa → **264 passed / 2 failed**, từng tệp ĐÚNG số nền (de-rieng 18/0 · tran-trung 22/0 · blueprint 25/0 · kho-mong 7/0 · rut-du-so-cau 7/0 · noi-chan 14/0 · rut-de 40/0 · luc-bat-dau 13/1 · danh-dau 56/1 · cho-thi-lai 18/0 · ho-so-1909 44/0 lúc đo, nay 46/0)
- [x] 9. `npx vitest run` toàn bộ, so với nền | bằng chứng: lượt cuối (HEAD `36981a1`) → **5035 test · 4936 passed · 98 failed · 43 tệp đỏ / 365 tệp**. So TÊN từng test đỏ với nền worktree (97/42): đỏ mới ĐÚNG MỘT — `cat-google-1209` (chủ ý, mục ĐỌC TRƯỚC); không test nền nào đổi trạng thái; 46 test mới xanh cả. Tức 98/43 = nền 97/42 + 1 chủ ý; so với nền ghi sổ 98/43 thì bằng số nhưng KHÁC thành phần (−parent-news đã xanh từ trước, +cat-google).
  - **Khai thật về lượt chạy trước đó (14:42, load average 28 vì nhiều phiên chạy cùng lúc):** ra 101 đỏ/45 tệp — ngoài `cat-google` còn 3 test đo GIỜ đỏ: `de-rieng-tran-trung` "dưới 500 ms" (553 ms), "60 cấu hình ngẫu nhiên" (6,5 s > hạn 5 s), và test "30 lớp vân tay" của chính tôi (10 s > 5 s). Nguyên nhân gốc: cả máy chậm ~2,8 lần (tệp `de-rieng-tran-trung` mất 15,5 s so với 6,0 s ở lượt nền), KHÔNG phải thuật toán chậm đi — đo trực tiếp mã cũ/mới 40 cấu hình: 1777 ms → 1788 ms; chạy riêng tệp 3 lần: 165 ms và 1,8 s, 22/22. Đã sửa phần của tôi (hạn chờ tường minh 60 s cho 5 test nặng, phép đo < 500 ms lấy lần nhanh nhất trong 3). Hai test đo giờ của `de-rieng-tran-trung.test.ts` KHÔNG phải của tôi nên không đụng — chúng vẫn sẽ đỏ oan nếu chạy toàn bộ lúc máy quá tải. Lượt cuối (load ~8–14) cả ba xanh.
- [x] 10. Commit từng mốc, `git add` từng tệp | bằng chứng: `git log --oneline 6eefaa3..HEAD`
- [x] 11. SendMessage tới "0.Planer" báo cáo cuối (tên nhánh, 7 commit, số test toàn bộ + từng tệp bất biến, đường dẫn hợp đồng, +1 đỏ chủ ý ở DÒNG ĐẦU) | bằng chứng: msg_id `03be1ec6-953d-4eeb-8422-67707b441162`; hai lần xin chốt trước đó: `3656f7de…` (việc 5 → B), `82446db4…` (cat-google → A)

## Chỗ đề xuất LỆCH mã thật — và phương án đã chọn

1. **`CauUngVien` không có `ma_dang`** (chỉ có `dang` = lý thuyết/bài tập/chưa rõ), và `rut-de.ts` ngoài phạm vi. → Mã dạng của ỨNG VIÊN song sinh lấy từ kho ca
   (`maDangCuaKho`: `dang.ma` của câu, thiếu thì `CD:<chuyên đề>` — đúng quy ước `su-kien-hoc.ts:418` / `ho-so-nam-kt.ts:110`), truyền vào lõi qua `YeuCauDeRieng.maDangCua`.
   Mã dạng của CÂU GỐC: hồ sơ trước, kho sau.
2. **Khoá song sinh luôn kèm `phan`**; mã `CD:` kèm thêm lý thuyết/bài tập khi biết. Câu song sinh THAY câu gốc trong đúng phần đó của đề (khác phần là vỡ 9-2-3);
   cùng chuyên đề mà câu tính toán ghép câu lý thuyết thì không phải song sinh. Có mã dạng mà kho hết câu cùng dạng ⇒ GIỮ câu gốc, không lùi sang khoá lỏng.
3. **"Xoay theo hash(seed|sbd)" một mình KHÔNG bảo đảm hai em khác nhau** (2 ứng viên ⇒ 50% trùng). → Thêm bộ đếm chung cả lớp `demSongSinh`: câu ÍT em nhận nhất trước,
   hoà mới theo vòng xoay hash. Vẫn tất định (phụ thuộc thứ tự `dsSbd`, như pha B vốn thế).
4. **Xoay song sinh CHỈ bật khi ca có hồ sơ ôn.** Đề bài vừa đòi sửa "luôn lấy phần tử đầu" vừa đòi "không hồ sơ ⇒ Y HỆT bản hiện tại"; hai điều chỉ cùng đúng nếu đường
   không-hồ-sơ giữ nguyên cả lỗi cũ. Khi máy chủ có lệnh thì MỌI ca đi đường mới (kể cả lớp chưa em nào có dòng hồ sơ: `hoSo = {}`).
5. **Thêm trường `daKhacPhuc[]` vào phản hồi** (đề bài chỉ nêu `sai`, `lam`). Suy "vắng mặt trong `sai` = đã khắc phục" thì một câu CHƯA có dòng hồ sơ (sổ thưa —
   xem BÀN GIAO: BTVN thiếu 135 dòng) sẽ bị bỏ hỏi lại IM LẶNG. Máy thầy chỉ bỏ câu khi máy chủ nói thẳng. Câu đã khắc phục cũng rời `canDayLai`.
6. **`lam` có thứ tự** (mới nhất trước) — cần cho "nới câu cũ nhất trước". Thêm `tuCa` (ghi biên bản) và `soCa` tuỳ chọn (phạm vi "3 ca").
7. **`lam` 7 ngày chứa luôn câu của ca thi tuần trước**, kể cả câu em sai. → Câu khắc phục (Pha A, `boSan`) được MIỄN tập cấm; tập cấm chỉ áp cho câu MỚI và ứng viên song sinh.
8. **Pha 1 có tập cấm dùng hàng `hoan`** thay vì bỏ phí câu như vòng gốc: câu cả lớp vừa làm ở BTVN không kéo lệch tần suất các câu sau nó. Bất biến "lệch ≤ 1" khi có
   tập cấm chỉ hứa trên các câu KHÔNG ai cấm (câu cả lớp cấm đương nhiên 0 lần) — test ghi đúng như vậy, không ghi quá.
9. **Một lô 20 em hỏng ⇒ chỉ các em lô đó đi luật cũ**, không kéo cả ca về đường cũ; biên bản ghi số em. Cả ba lô hỏng mới là "không có hồ sơ".
10. **Báo thầy mà không đụng giao diện:** ba dòng mới đi vào `boQua` của biên bản (màn Ca thi đã in sẵn danh sách này): "hồ sơ ôn — chưa đọc được… rút đúng luật cũ",
    "hồ sơ ôn — N em không đọc được", "kho mỏng — N em phải nhận lại tổng M câu vừa làm trong tuần". Có tiền lệ trong mã (`+N ca cũ hơn`). Nhãn in ra là
    "Ca không đọc được: …" nên chữ hơi gượng — muốn dòng riêng thì phiên Giao diện thêm sau, dữ liệu đã có ở `KetQuaDungDeRieng.hoSoOn / noiCam / daKhacPhucTheoEm`.
11. **`ngayCa`** = ngày VN lúc thầy bấm Bắt đầu, tính ở tầng đi lấy dữ liệu (`ngayVnCua(Date.now())`), lõi chỉ nhận tham số. `Date.now()` còn đúng MỘT chỗ trong `de-rieng.ts`
    — mốc ngân sách giờ của `sinhBoMotO`, có từ trước và vô hiệu vì `CAT_THEO_GIO` không bật.
12. **Việc 6 có hệ quả phải nói:** em vào SAU khi thầy bấm Bắt đầu không có tên trong bản đồ ⇒ rơi về bốc theo hash như ca thường (không có câu hỏi lại). Bản 17/09 gộp cả lớp
    chính là để tránh điều này, nhưng đổi lại em vắng chiếm suất chia và làm sai biên bản. Làm theo đề bài (phòng chờ); ghi lại để 0.Planer biết cái giá.

## Lỗi phát hiện NGOÀI PHẠM VI (không sửa — đã báo 0.Planer, 0.Planer chuyển phiên máy chủ "Code 3")

**Worker `choThiLai` bỏ qua `boCauMoi` ⇒ "cho thi lại" trên máy chủ mới KHÔNG đổi đề.** `server/src/goi-cu.ts:1361-1377`:
- hàm chỉ chạy ba lệnh `DELETE` (`luot`, `chi_tiet_cau`, `phong_cho`), KHÔNG ghi `b.boCauMoi` vào bản đồ `boTheoEm` của ca ⇒ em vào lại nhận đúng bộ câu cũ
  (bản đồ cũ, hoặc luật hash) dù máy thầy đã rút và gửi bộ mới (`src/lib/thi-lai.ts:80-86` → `exam-api.ts choThiLai`);
- dòng 1375 `daDoiDe: b.boCauMoi === true` so MẢNG với `true` ⇒ luôn `false`; dòng 1374 `khoaMay: b.lapMoi === true` cũng so sai kiểu (`lapMoi` là mảng qid hoặc thiếu) ⇒
  màn Ca thi luôn báo mức `warn`;
- bản Apps Script cũ thì có ghi: `boTL[sbdTL] = body.boCauMoi` (test `tests/cho-thi-lai.test.ts:81` đang khoá dòng đó của tệp `.gs`, không soi Worker);
- kèm theo: `choThiLai` xoá hết `luot` của em nên `lan_thu` quay về 1 — không dùng `lanThu` làm bộ đếm lần thi lại được.

## Còn nợ / gợi ý bước sau (không thuộc việc này)

- Phiên máy chủ viết `hoSoOnCa` theo hợp đồng; khi lệnh sống thì `cat-google-1209` tự xanh.
- Biên bản trên màn Ca thi chưa có dòng riêng cho "đã khắc phục N câu — không hỏi lại" và "nới M câu"; dữ liệu đã nằm trong kết quả, chỉ thiếu chỗ in (tệp giao diện ngoài phạm vi).
- `BienBanDeRieng` (`exam-db.ts`, ngoài phạm vi) chưa có trường cho `hoSoOn`/`noiCam` nên hai thứ đó chưa lên máy chủ cùng biên bản — hiện chỉ đi qua ba dòng `boQua`.
