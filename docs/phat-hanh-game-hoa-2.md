# Phát hành Game Hóa 2.0 — sổ tay cho phiên có khoá Cloudflare (Code 3 trên máy thầy)

Phiên cloud soạn 28/09/2026. Phiên cloud KHÔNG có khoá Cloudflare nên không tự chạy được các lệnh dưới.
Mọi bước đều có kiểm tra trước/sau; bước nào đỏ thì DỪNG, báo lại, không làm bước sau.

## Phần 1 — làm NGAY được (an toàn: cờ `game_hoa_2` mặc định TẮT ⇒ app chạy như cũ)

0. Không có ca kiểm tra đang mở:
   `npx -y wrangler@latest d1 execute <DB> --remote --command "SELECT ma_ca, trang_thai FROM ca WHERE trang_thai NOT IN ('dong','da_xoa')"` → phải rỗng (nếu cột/giá trị khác, dùng đúng truy vấn "ca đang mở" mà máy chủ đang dùng).
1. Máy chủ trên `main` còn 3 lỗi kiểu (tên xuất khẩu không có trong tệp đã commit) — esbuild sẽ báo "No matching export" khi đóng gói Worker:
   - `server/src/index.ts:16` import `trangThaiNop` từ `./on-lai-nop`
   - `server/src/ke-hoach-ngay-d1.ts:21` import `danhTinhChiMucKhop` từ `./cau-theo-qid`
   - `server/src/ke-hoach-ngay-d1.ts:23` import `scopeQuestion` từ `./pham-vi-hoc`
   Commit phần mã còn nằm trên đĩa máy thầy cho 3 tên này (không xoá import — hàm đang được dùng). Kiểm: `cd server && npx tsc -p tsconfig.json --noEmit` → 0 lỗi.
2. Migration CHỈ-THÊM: `npx -y wrangler@latest d1 execute <DB> --remote --file server/migration-2709-game-hoa-2.sql`
   Kiểm: `SELECT name FROM sqlite_master WHERE name IN ('chien_dich','srs2_ke_hoach','srs2_day_lai','ruong_bat_linh')` → 4 dòng.
3. Đẩy Worker TỪ WORKTREE SẠCH tại commit `main` (luật CLAUDE.md), ghi mã bản cũ để lùi.
4. Kiểm sau khi đẩy (cờ vẫn tắt): mở app học sinh/giáo viên như bình thường; `POST /game-v2/hoa2-sanh` (token một em) → `{ok:true, cheDo2:false}`.

## Phần 2 — CHỜ phiên cloud báo "xong build" (giao diện mới + job reset đang làm, chưa gộp vào main)

Thứ tự bắt buộc (thầy: "sau khi build xong cho reset"):
1. Gộp nhánh `claude/loving-babbage-9i6b83` (bản có giao diện mới + job reset) → chạy toàn bộ vitest + `npm run build` → đẩy Pages + Worker.
2. Kiểm lại không có ca kiểm tra đang mở.
3. SAO LƯU: `npx -y wrangler@latest d1 export <DB> --remote --output backup-truoc-reset-hoa2-<ngày>.sql` (giữ trên SSD) + ghi mốc Time Travel.
4. Chạy thử khô reset (lệnh `/reset-hoa2/chay-thu`, mã bí mật thầy) → đối chiếu danh sách XOÁ/GIỮ trong `docs/reset-hoa2-2709.md` (sẽ có khi job gộp) — đúng thì mới lên đạn.
5. Reset thật theo tài liệu job (cờ lên đạn, theo dõi `/reset-hoa2/trang-thai` tới `xong`).
6. Bật Game Hóa 2.0: `/gv/chien-dich` `{action:'co-luu', bat:true}` (hoặc nút trong Cài đặt).
7. Ghi một dòng Nhật ký `DIEU-PHOI.md`: giờ · phiên · đẩy gì · commit · mã bản lùi.

Thầy đã chốt danh sách XOÁ khi reset (27/09): game + thần thú (chọn lại) + EXP + khiên + Đoàn + **vàng + phụ kiện**, BTVN, bài gia đình giao, luyện đề, kế hoạch ngày cũ, lên bảng, trao đổi, vinh danh, tin phụ huynh, **mọi ca thi cũ**. GIỮ: tài khoản, lớp, kho đề, cấu hình, **sổ `su_kien_hoc` và toàn bộ hồ sơ học tập**, chiến dịch 2.0.
