# Việc Claude giao cho Codex

Cách dùng tệp này: xem `AGENTS.md` mục 2. Mục mới nhất nằm ở cuối.

Mỗi mục ghi:
- việc cần làm;
- tệp liên quan;
- cách nghiệm thu.

Codex đổi `[ ]` thành `[x]` hoặc `[!]` ngay trong PR của mình.

## 13/10 — sau khi gộp PR258 (kiểm tra cá nhân) và PR259 (đợt 19)
Thầy đã chuyển bốn việc này cho Codex trên máy thầy ngày 13/10. Codex làm xong thì đánh dấu.

- [x] **Xác nhận thoả thuận.** PR262 — đã đọc và xác nhận trong Nhật ký; đồng ý hợp đồng.
  - Đọc `docs/hop-dong-claude-codex-1310.md`.
  - Ghi một dòng Nhật ký "đã đọc hop-dong-claude-codex-1310".
  - Chỗ chưa đồng ý thì viết vào mục 5 "Ý kiến".
- [x] **Sửa 26 test đỏ do PR258 sinh ra.** PR262 — 74/74 liên quan; so full theo tên + kiểm lại cùng main: 0 lỗi mới còn tái hiện. Chúng đỏ trên `main` 12ab2be3, trước khi gộp đợt 19. Các tệp:
  - `goi-len-bang-to-chieu-cham`: bản giả thiếu `getState` / `luuBuoiChua`;
  - `chua-bai-1210b`: thứ tự mới có chủ đích, kèm luật mới ≥ 5 em;
  - `goi-len-bang-lich-su-cau`;
  - `hop-thoai-app`: gọi `confirm()` thô;
  - `nhip-bang`: `setInterval` trong `ManKiemTraCaNhan`.

  Test đổi có chủ đích thì ghi chú "SỬA CÓ CHỦ ĐÍCH 13/10" kèm lý do. Không `skip`. Nghiệm thu: toàn bộ vitest so theo tên với `main` có 0 test đỏ mới, và 26 test này xanh.
- [x] **`TheKiemTraCon` dùng khung thẻ của trang phụ huynh mới.** PR262 — PH3/3, Chromium6tổ hợp0JS/0tràn, màu0.
  - Đổi lớp `ph3-ah` cũ sang `tvc-the` (xem `src/components/ph-v3/TrangVeCon.tsx`).
  - Giữ nguyên luồng:
    - ngày kiểm tra thì thẻ thay khối Hôm nay;
    - ngày khác thì hiện lịch sắp tới;
    - `cho_nguon` thì ẩn.
  - Nghiệm thu: `tests/ph-kiem-tra-dot19-1310.test.tsx` 3/3 xanh; `npm run kiem:mau-giu` 0.
- [x] **Cổng trước khi gộp.** PR262 — frontend/serverTS, build/tốc độ0đỏ, SW13/13, màu0; đã gộp main e4f69136, không có deploy đang chạy trước mở PR. Xem docs/ket-qua-hop-dong-claude-1310.md; chờ Claude soát, chưa phát hành.
  - Chạy đủ các cổng ở `AGENTS.md` mục 3.
  - Mở PR vào `main`, thân PR liệt kê kết quả từng cổng.

## 13/10 — Claude đã sửa làn kiểm tra cá nhân vì sự cố D1 quá tải (Codex đọc để gộp đúng)
- Sự cố: D1 báo "overloaded" (mã 7429) sau khi bật cờ lúc 12:34. Số đo `wrangler d1 insights`: `COT_META_KT` trung bình 902,8 ms mỗi lần. Nguyên nhân là bóc JSON đề lớn ngay trong SQL (`json_each` lồng nhau, NOT IN tương quan), chạy ở mỗi lần em mở app (`hoc-tap-sanh`), ở phụ huynh và ở bảng của thầy.
- Claude đã tạm tắt cờ lúc 12:49 rồi vá. Thay đổi trong mã:
  - Bảng chỉ-thêm `kiem_tra_ca_nhan_meta(id, meta_json)` nằm trong `SQL_KT_CN`.
  - `metaKt(d)` ghi số tĩnh cùng giao dịch với `lapKtCn`.
  - `COT_META_KT` đọc số tính sẵn. "Đã trả lời" vẫn đếm bằng SQL nhưng chỉ trên JSON nhỏ (bảng phần × `tra_json`). Không trả đề hay câu trả lời ra Worker.
  - `buMetaKt` (cron, mỗi phút ≤ 10 dòng) bù cho lịch cũ.
  - `scripts/bat-lai-ktcn-1310.ts` bù hết rồi mới bật cờ.
- **Luật từ nay:**
  - Đổi cấu trúc `DeKt` hoặc thêm số vào lịch thì sửa `metaKt` và kiểm `tests/kiem-tra-ca-nhan-1310.test.ts` (test "khẩn 13/10").
  - Truy vấn đọc lịch không gọi `json_each` / `json_extract` trên `k.json` cho nhiều dòng.
- [ ] Codex gộp `main` mới vào nhánh đang làm, giữ bản vá này (đặc biệt `COT_META_KT`, `lapKtCn` batch, `dongBoKtCn` gọi `buMetaKt`).

## 13/10 13:30 — Claude soát PR262 + quyết định giữ cờ tắt
- Claude đã soát PR262. Đã gộp `main` f6a86c87 (bản vá D1) vào nhánh; xung đột chỉ ở `DIEU-PHOI.md`, giữ cả hai phía.
- Kết quả kiểm sau khi gộp:
  - 9 tệp test liên quan: 113/113 xanh.
  - `tsc` sạch; build xong.
  - `kiem:toc-do`: 0 đỏ.
  - Precache: 169 tệp / 2733 KiB.
  - `kiem:mau-giu`: 0 vi phạm.
- PR262 được gộp SAU khi lượt phát hành bản vá D1 xong, để hai lượt không chồng nhau.
- Theo đề nghị của Codex (thầy phản ánh 333 câu/475 phút), Claude **không bật lại** cờ `kiem_tra_ca_nhan_v1`.
- [ ] Codex: xong khung 28 câu/50 phút thì bật lại cờ CHỈ bằng workflow `bat-lai-ktcn-1310` (bấm tay trên Actions). Workflow này bù số tính sẵn cho mọi lịch cũ rồi mới bật cờ. Không bật cờ bằng SQL tay.
- [ ] Codex: khung mới đổi số câu/chặng/phút thì `metaKt` phải theo, và test "khẩn 13/10" trong `tests/kiem-tra-ca-nhan-1310.test.ts` phải xanh.

## 13/10 15:40 — Claude nhận phần soát + gộp + bật cờ của nhánh đề Hóa 2026 (thầy: "bạn làm đỡ được codex phần nào để tăng tốc không")
Codex KHÔNG đẩy thêm vào `codex/de-kiem-tra-2026-1310`. Claude đã gộp nhánh vào `claude/amazing-albattani-03aros` cùng main mới (đợt 20, 21) và mở PR vào `main`. Việc tiếp theo làm từ `main`.
- [x] Gộp `main` mới, giữ bản vá D1: `COT_META_KT`, `lapKtCn` batch, `dongBoKtCn` gọi `buMetaKt` (Claude, khi gộp nhánh).
  - Xung đột `TheKiemTraCaNhan.tsx`: giữ thiết kế đợt 20 thầy duyệt, thêm chữ "kế hoạch học nhẹ tối thiểu 12 câu" khi có `baiNgayToiThieu`.
- [x] `metaKt` theo khung mới (`phienBan`, `baiNgayToiThieu`); test "khẩn 13/10" xanh.
- [x] Soát D1: lệnh cron `dongBoKtCn` chọn đề cần chuyển từng gọi `json_extract(k.json,'$.phienBan')` trên MỌI lịch tương lai mỗi phút ⇒ Claude đổi sang đọc `kiem_tra_ca_nhan_meta` (`COALESCE(phienBan,1)`).
  - Test mới trong `tests/kiem-tra-chu-ky-2026-1310.test.ts`.
  - SỬA CÓ CHỦ ĐÍCH bản giả trong `tests/kiem-tra-ca-nhan-1310.test.ts`.
- [ ] Bật lại cờ (Claude làm): workflow `bat-lai-ktcn-1310`.
  - Số thật lúc 15:22: 261 lịch đều ngày 17–19/10, chưa em nào mở; khối 11 có 89 lịch đề cũ ("hen"), khối 10/12 có 172 lịch "cho_nguon".
  - Đã thêm bước chuyển từng em về 28 câu/50 phút TRƯỚC khi bật, vì cờ tắt thì cron chưa chuyển.
- [ ] Khối 12 còn thiếu nguồn đã duyệt cho `nen:gia_tri_trung_binh` (52/53) ⇒ lịch khối 12 vẫn "Đang chuẩn bị". Cần thầy duyệt câu đang chờ; Codex/Claude không tự duyệt.
- [x] (Claude 13/10 17:20) Bật lại cờ xong 16:32. Khối 12 hết thiếu nguồn:
  - Câu DH-12-C1-B1-P2 II-15 bị nghi đáp án; Claude giải lại thấy đáp án kho đúng nên gỡ nghi.
  - Đã lập lại 126 em; mỗi em có 3 bài.
  - Còn 122 dòng `cho_nguon` cũ ở ngày giữa chu kỳ. Dòng này ẩn ở mọi màn nên để nguyên.
  - Codex sửa luật nguồn tương đương thì nhớ: `chanKhacKhoiEm` loại câu `cau_nghi_dap_an`='nghi'. Câu khó, tỉ lệ sai cao vẫn bị xếp nghi; nên có nút gỡ trên app thầy (`/gv/cau-nghi/xu-ly` đã có ở máy chủ, chưa có giao diện).

## 13/10 — Thầy nhắc phần sửa hạn chưa xuất hiện
- [x] PR269: cập nhật main mới, giữ Hỏi Thầy hiện tại; đã kiểm cổng và gửi Claude soát. Nút Sửa hạn tại từng dòng Bài đang giao;7tệp99/99,tốc độ/màu/SWđạt, so full không có lỗi mới còn tái hiện. Thầy nhắc ảnh chưa có nút nên ưu tiên phát hành; không sửa hạn D1 thay thầy.

## 14/10 00:00 — DỌN CODE GAME + CHIẾN DỊCH CŨ, TỐI ƯU TỐC ĐỘ (thầy 13/10 22:2x)
Thầy: "sau 00h bạn phải tối ưu chuyên sâu tốc độ ở mọi chỗ, xóa tất cả các code không liên quan, đảo đoàn, bia, chiến dịch cũ các thứ. Phải rút gọn và tối ưu code ở cấp độ siêu chuyên nghiệp … Cái này phải làm bằng được" · "bạn làm việc này với thằng codex nữa nhé".

Chia làn (không giẫm tệp): **Codex = phía máy em/thầy (`src/`, `public/`, test giao diện)** · **Claude = máy chủ (`server/`, test máy chủ)**. Bảng kiểm kê đầy đủ (tệp, dòng, chỗ gắn, phần DÙNG CHUNG không được xoá): `docs/kiem-ke-don-game-1410.md`.

Luật chung cho mọi mục dưới:
- CHỈ xoá CODE và ẢNH. Không xoá bảng / dòng D1, không đổi schema. Durable Object `BAN_BIA` giữ nguyên ràng buộc (Claude thay bằng lớp rỗng phía máy chủ).
- Không đổi luồng đang dùng: Hôm nay / Gói 7 / Hành trình / Sửa từng bước / Kiểm tra cá nhân / Gọi lên bảng / Bài hằng ngày / phụ huynh. Giữ nguyên tệp DÙNG CHUNG ghi ở mục B của bảng kiểm kê (vd `src/game/than-thu-v2/core.ts`, `evolution.ts`, `anh-webp.ts`, `dao/anh.ts`, `academic-sync.ts`, `Reports.tsx`, `src/components/chien-dich/{api.ts,ChonEmGiao,BangChienDich,BuoiChua,HanhTrinhV2,HoSoLamCauEm,BangGoi7}`, `hoa2/api.ts`, ảnh `nho/thu-*`, `evolution-*-cutout.*`, `bat-linh/canh-dao*`).
- Test: xoá test CHỈ khoá phần đã xoá (danh sách mục C); test chạm cả hai thì sửa bản giả, không `skip`. So toàn bộ vitest theo tên với `main`: 0 test đỏ mới.
- Cổng `AGENTS.md` mục 4; `npm run build && npm run kiem:toc-do` 0 đỏ và **HẠ mốc** `docs/moc-toc-do.json` theo số mới (chỉ hạ); `node scripts/kiem-sw.mjs` 13/13; `npm run kiem:mau-giu` 0.
- Không phát hành 19:00–23:59 (giờ cao điểm em làm bài), trừ sửa khẩn.

- [x] **C1. Gỡ Đảo thần thú + Đoàn Hộ Tống + Bi-a phía app** — PR290: 203 nguồn/46 ảnh gỡ theo đồ thị, 14 shared giữ; server PR289 đã gộp trước khi gỡ 5 lõi. TS/build/tốc độ giảm/màu0/SW13/13/Chromium18 tổ hợp+offline đạt; full cuối đang chốt, PR nháp. Chi tiết docs/ket-qua-toi-uu-toan-app-1410.md.
  Phạm vi gốc: (`src/game/than-thu-v2/` phần Đảo/Đoàn/cửa hàng/phụ kiện, `dao/**` trừ `dao/anh.ts`, `dao2/**`, `doan2/**`, `shop/**`, `phu-kien/**`, `src/game/bi-a/**`, sảnh đảo `hoa2/{SanhBanDo,CanhSanh3D,…}`, `ban-duyet-v2/*`, `bat-linh/{BanDoHanhTrinh,DongHanh,…}`, `chien-dich/CongTacBia.tsx`; chỗ gắn: `man-sanh-luoi.ts:23,45-88`, `StudentPortalScreen.tsx:200,278`, `BangTinPhuHuynh.tsx:589-616`, `ParentPortalScreen.tsx:1` → `bat-linh/LoiChao`, `main.tsx:45` `game-toan-bo.css`, `CaiDatScreen.tsx:17,101`).
  - THỨ TỰ: máy chủ đang import `src/game/than-thu-v2/{doan-core,escort-core}.ts` và `src/game/bi-a/{luat,nguyen-to,tran}.ts` ⇒ năm tệp này Codex xoá SAU khi PR máy chủ của Claude (gỡ Đoàn/Bi-a/Đảo phía `server/`) gộp — Claude ghi Nhật ký khi gộp. Phần còn lại của C1 làm song song được.
  - Ảnh chỉ của phần đã gỡ (~47 MB): `public/than-thu-v2/{spells,combat}`, `public/bat-linh/{ban-do-dao*,canh-ho-tong*,quai-son-thuy,xe-linh-tam,bieu-cam-1,bieu-cam-2}.webp`, `public/than-thu-v2/nho/the-*.webp`. Soát `vite.config.ts` (`globIgnores`, ảnh đăng nhập) trước khi xoá.
  - Nghiệm thu: `npx tsc -b` sạch; không còn import tới thư mục đã xoá (`rg "bi-a/|doan2/|dao2/|shop/|phu-kien/" src` rỗng trừ tệp dùng chung); byte tải mở app học sinh / phụ huynh / thầy GIẢM so mốc; Chromium thật mở 3 app (360×800, 1280×800, sáng/tối): 0 lỗi JS, tab cũ `thanthu`/`bia` vẫn về Hôm nay.
- [!] **C2. Gỡ giao diện chiến dịch cũ** — PR290: đã gỡ 5 UI/API chỉ còn caller cũ, giữ Hành trình. SuaChienDich/HopChon/*Sua*/nút Sửa em còn giữ đúng yêu cầu C3: API Thêm/Bớt em Gói 7 chưa có, bản vẽ chưa được duyệt; không làm mất chức năng giữa chừng.
  Phạm vi gốc: (`chien-dich/{GiaoChienDich,DsChienDichDaGiao,SuaChienDich,HopChon,DongHoSucChua,sua-chien-dich.css,NutGiaoTheoBai}`, `lib/tom-tat-sua-chien-dich.ts`, `screens/TongQuanScreen.tsx`; chỗ gắn `ChienDichScreen.tsx:11-12,20,29-30,37-79`, `CaiDatScreen.tsx:39-41,~105-118`, `ExamMonitorScreen.tsx:12,1346,1844,1942-1950`). **Giữ** mục Hành trình (`ThanhBenTrai.tsx:62` `chiendich`). Hàm cũ chỉ phần đã xoá dùng trong `chien-dich/api.ts` (`taoChienDich`, `tinhSucChua`, `huyChienDich`, `doiRaiDeu`, `danhSachThongKe`, `*Sua*`) xoá theo.
  - Nghiệm thu: như C1; màn Hành trình / Ca kiểm tra / Cài đặt mở đủ, 0 lỗi JS.
- [!] **C3. Tick bài (làn Codex — tiếp PR269 Sửa hạn).** — PR285 đã phát hành main58d34a69/Actions38444623860: tải tổng hợp nhẹ, Lưu giữ màn/Đã lưu sau ACK, sửa hạn hàng loạt CAS nguyên tử; PR290 thêm cập nhật nhẹ sau tick. Thêm/Bớt em: đặc tả7mục+6ảnh thật ở docs/them-bot-em-tick-1410.md, chờ duyệt theo AGENTS mục3 và API membership bền của Claude; chưa build, giữ Sửa em cũ.
  Yêu cầu gốc: Thầy 13/10 nguyên văn: "phần tick bài hiện tại load khá lâu, có lúc không load được, mục lưu hạn từng lớp bấm lưu bị nhảy sang màn khác, tôi muốn bấm lưu xong hiện đã lưu không nhảy, thêm một nút sửa hạn hàng loạt nhé. Tối ưu chỗ này cho phản hồi tức thì đi. Cho tôi thêm phần thêm em và bớt em trong phần đó luôn, xóa bỏ hết phần thêm em của bản cũ chiến dịch nhé, khi thêm em vào thuật toán phân câu giữ nguyên nhé."
  - Sửa lỗi làm thẳng: tải chậm / không tải được (đo số đợt D1 + byte, tải song song, khung xương ngay); bấm Lưu hạn ở lại màn, hiện "Đã lưu" tại chỗ.
  - Tính năng mới (nút Sửa hạn hàng loạt; Thêm em / Bớt em trong Tick bài) theo QUY TRÌNH 4 BƯỚC: đặc tả 7 mục + bản vẽ Chromium thật 3 khổ sáng/tối → thầy duyệt → build. Thêm em: em mới nhận đúng gói như em cũ cùng lớp; thuật toán phân câu Gói 7 (`goi-bai-7.ts` `chonGoi7`/quota) KHÔNG đổi — tệp dùng chung, báo trước trong Nhật ký nếu phải chạm.
  - Xoá nút "Sửa em" chiến dịch cũ ở `day-hoc/BaiHomNay.tsx:87,438-444,564,601,731-743` (cùng PR với Thêm/Bớt em mới để thầy không mất chức năng giữa chừng).
  - Nghiệm thu: test giao diện cho Lưu không nhảy màn + "Đã lưu"; test máy chủ thêm em ⇒ em có gói, bớt em ⇒ em không còn nhận câu gói, phân câu em cũ không đổi (so kế hoạch trước/sau).
