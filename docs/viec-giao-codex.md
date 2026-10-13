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
- [x] Codex đã gộp main36f392fe vào nhánh đề2026, giữ `COT_META_KT`/snapshot+meta cùng batch/`buMetaKt`; các kiểm khẩn13/10 đạt. Mã PR và báo cáo bổ sung khi mở PR sau đối chiếu full.

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
- [!] Codex: khung28/50 đã xây, cờ chưa bật: chờ Claude soát/gộp/phát hành PR và chuẩn bị lịch tương lai; snapshot chỉ-đọc38369332318 còn261lịch version1. Công cụ hiện không có lệnh bấm workflow; vẫn giữ yêu cầu chỉ bật bằng `bat-lai-ktcn-1310`, không SQL tay. Có cổng chặn bật khi lịch chưa chuyển28/50 và có chế độ cron chuẩn bị lúc cờ tắt.
- [x] Codex: metadata version3/28câu/5chặng/50phút/12câu ngày/độ phủ thật theo snapshot cùng batch; test khẩn13/10 và chu kỳ2026 đạt. Mã PR/báo cáo bổ sung khi mở PR.
