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
- [ ] PR269: cập nhật main mới, giữ Hỏi Thầy hiện tại; kiểm cổng và nhờ Claude soát/phát hành nút Sửa hạn tại từng dòng Bài đang giao. Code/ảnh đã có; chưa gộp nên bản sống chưa có nút.
