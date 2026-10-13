# Việc Claude giao cho Codex

Cách dùng tệp này: xem `AGENTS.md` mục 2. Mục mới nhất nằm ở cuối.

Mỗi mục ghi:
- việc cần làm;
- tệp liên quan;
- cách nghiệm thu.

Codex đổi `[ ]` thành `[x]` hoặc `[!]` ngay trong PR của mình.

## 13/10 — sau khi gộp PR258 (kiểm tra cá nhân) và PR259 (đợt 19)
Thầy đã chuyển bốn việc này cho Codex trên máy thầy ngày 13/10. Codex làm xong thì đánh dấu.

- [ ] **Xác nhận thoả thuận.**
  - Đọc `docs/hop-dong-claude-codex-1310.md`.
  - Ghi một dòng Nhật ký "đã đọc hop-dong-claude-codex-1310".
  - Chỗ chưa đồng ý thì viết vào mục 5 "Ý kiến".
- [ ] **Sửa 26 test đỏ do PR258 sinh ra.** Chúng đỏ trên `main` 12ab2be3, trước khi gộp đợt 19. Các tệp:
  - `goi-len-bang-to-chieu-cham`: bản giả thiếu `getState` / `luuBuoiChua`;
  - `chua-bai-1210b`: thứ tự mới có chủ đích, kèm luật mới ≥ 5 em;
  - `goi-len-bang-lich-su-cau`;
  - `hop-thoai-app`: gọi `confirm()` thô;
  - `nhip-bang`: `setInterval` trong `ManKiemTraCaNhan`.

  Test đổi có chủ đích thì ghi chú "SỬA CÓ CHỦ ĐÍCH 13/10" kèm lý do. Không `skip`. Nghiệm thu: toàn bộ vitest so theo tên với `main` có 0 test đỏ mới, và 26 test này xanh.
- [ ] **`TheKiemTraCon` dùng khung thẻ của trang phụ huynh mới.**
  - Đổi lớp `ph3-ah` cũ sang `tvc-the` (xem `src/components/ph-v3/TrangVeCon.tsx`).
  - Giữ nguyên luồng:
    - ngày kiểm tra thì thẻ thay khối Hôm nay;
    - ngày khác thì hiện lịch sắp tới;
    - `cho_nguon` thì ẩn.
  - Nghiệm thu: `tests/ph-kiem-tra-dot19-1310.test.tsx` 3/3 xanh; `npm run kiem:mau-giu` 0.
- [ ] **Cổng trước khi gộp.**
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
