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
