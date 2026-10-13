# Quy trình 4 bước làm tính năng mới — thầy đồng ý 13/10/2026

Nguồn: thầy dán "EDTECH PROTOCOL" (ChatGPT làm quản lý sản phẩm, Claude làm lập trình, thầy chép tay qua lại 3 lượt). Claude góp ý, thầy đồng ý bản thay dưới đây ("đồng ý quy ước phối hợp", 13/10).

- Giữ khung đặc tả 5 mục của protocol.
- Thêm 2 mục: chi phí máy chủ, nghiệm thu đo bằng máy.
- Thêm bước vẽ cho thầy duyệt trước khi build.
- Bỏ chép tay.

**Áp dụng cho:** tính năng mới, màn mới, đổi giao diện rõ rệt.
**Không áp dụng cho:** sửa lỗi, sửa chữ, tối ưu tốc độ không đổi giao diện. Những việc này làm thẳng theo luật tự build/phát hành trong `CLAUDE.md`.

## Ai làm gì

| Bên | Việc |
|---|---|
| Thầy | Chỉ bước 1 (gửi ý tưởng) và bước 3 (duyệt ảnh). Không chép code qua lại. |
| Claude | Bước 2 (đặc tả + bản vẽ). Bước 4 cho việc trong làn Claude. |
| Codex | Bước 4 cho việc trong làn Codex (`docs/hop-dong-claude-codex-1310.md`). Nhận việc qua `docs/viec-giao-codex.md`. |
| ChatGPT (không bắt buộc) | Góp phần sư phạm. Thầy dán đặc tả của ChatGPT **một lần** ở bước 1. Claude đối chiếu với dữ liệu/API thật của app, không chép nguyên số mẫu. |

## Bước 1 — Thầy gửi ý tưởng thô
Gửi bằng chữ hoặc ảnh, vào phiên Claude đang làm app.

## Bước 2 — Claude viết đặc tả 7 mục + bản vẽ
1. **Mục tiêu sư phạm + ai dùng** (HS / PH / GV), cảm giác cần đạt.
2. **Bố cục** cho điện thoại dọc, ngang và máy tính: thứ tự ưu tiên, nút chính đặt ở đâu.
3. **Trạng thái:** đang tải, rỗng, lỗi, mất mạng, có dữ liệu, và các trạng thái riêng của tính năng.
4. **Dữ liệu:**
   - Lấy từ API THẬT, nêu lệnh hoặc kiểu dữ liệu đang có.
   - Thiếu trường nào thì ghi rõ cần thêm gì ở máy chủ.
   - Không bịa số. Bản vẽ dùng dữ liệu giả, sát thực tế.
5. **Ngoại lệ:** hết giờ, mất mạng giữa chừng, bấm lặp, chữ hoặc công thức dài, số đột biến, máy yếu, đổi tab.
6. **Chi phí máy chủ:**
   - Số lượt đọc/ghi D1 mỗi lần mở; không thêm vòng chờ nối tiếp.
   - Phần nặng thì tính sẵn.
   - Đáp án không xuống máy học sinh trước khi nộp.
7. **Nghiệm thu đo bằng máy:**
   - tên các test vitest;
   - `npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0;
   - ảnh Chromium: 0 lỗi trang, 0 tràn, 0 đích bấm < 44 px.

Kèm bản vẽ: ảnh Chromium thật ở 3 khổ, cả sáng lẫn tối, đặt tại `docs/ban-ve-<đợt>/` (mẫu: `docs/ban-ve-dot20/`). Chữ trên màn theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`.

## Bước 3 — Thầy duyệt ảnh
- Thầy "chốt" thì sang bước 4.
- Thầy sửa vài dòng thì vẽ lại.
- Chưa duyệt thì không build.

## Bước 4 — Build → test → cổng → phát hành
**Luật mã (giữ từ protocol):**
- Không code giả, không `// TODO`.
- Ưu tiên điện thoại.
- Công thức, chỉ số trên/dưới hiển thị đúng.
- Tách riêng ba phần: kiểu dữ liệu, logic (hook hoặc `src/lib/`), giao diện.

**Cổng trước khi phát hành:**
- `tsc`;
- test vitest liên quan, và toàn bộ vitest khi phát hành (so theo tên với `main`);
- `npm run build && npm run kiem:toc-do`;
- `npm run kiem:mau-giu`;
- `node scripts/kiem-sw.mjs`.

**Soát:** bên còn lại (Claude ↔ Codex) soát trên PR GitHub, nơi chạy được test thật. Không soát code dán vào chat.

**Phát hành:**
- Ghi một dòng vào cuối `DIEU-PHOI.md`.
- Báo thầy: kết quả + lệnh lùi `git revert <mã> && git push origin main`.
