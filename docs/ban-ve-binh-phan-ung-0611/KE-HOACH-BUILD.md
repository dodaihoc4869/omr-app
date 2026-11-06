# Kế hoạch build Bình Phản Ứng (thầy 06/11 khuya: «vẽ thêm rồi build luôn đẩy lên bản sống»)

Đặc tả: `GHI-CHU.md`. Nguyên mẫu (nguồn để chép giao diện + hoạt hoạ): `nguyen-mau.html`.
Quyết định chưa chọn ⇒ theo đề xuất ở GHI-CHU §8: không cộng EXP · lý do 3 dòng nhẹ · đồng hồ êm 60 giây · rời màn −20 · đội cân số · không đổi đáp án.

## Luật màu khi chép CSS (kiem:mau-giu + check:mau)
- Không hex / rgb / tên màu mới trong `src/`. Chỉ dùng biến ĐÃ CÓ.
- `--tr-*` có ở `:root` của `trong.css` (cả app thầy). KHÔNG có `--tr-tim`, `--tr-hs-day`, `--tr-dung-nut`.
- Màu đội:
  - Natri = `--tr-sao`
  - Kali = `--tr-hs`
  - Đồng = `--tr-tin`
  - Canxi = `--tr-chu-y`
- Trắng cố định = `--giay`.

## Các phần
1. **Máy chủ:**
   - `server/src/bpu-phong.ts`: luật thuần, có test.
   - `server/src/phong-binh-phan-ung.ts`: Durable Object, WebSocket ngủ đông, trạng thái lưu `ctx.storage`.
   - `server/src/bpu-api.ts`: `/gv/bpu/mo`, `/gv/bpu/ve`, `/hs/bpu/ve`, cửa nâng cấp `/bpu/phong`.
   - Khai báo trong `wrangler.toml` (binding + migration `bpu-v1`).
   - `server/migration-0611-binh-phan-ung.sql`: thêm bảng `bpu_luot`.
2. **Bảng chiếu (app thầy):** `src/components/bpu/BangBinhPhanUng.tsx` + `bang-ve.ts` (chép canvas từ nguyên mẫu) + `bpu.css`. Mở toàn màn (portal).
3. **Máy em:** `src/components/bpu/ManBinhPhanUng.tsx` (nạp lười), mở sau điểm danh hoặc khi nhập mã; bắt rời màn.
4. **Điểm vào:**
   - Phím L trên tờ chiếu (`html-may-chieu.ts` + `to-chieu-cau-noi.ts`).
   - Bước điểm danh mở bảng ở pha điểm danh thay `BanChieuDiemDanh`.
5. **Test** + cổng: tsc, vitest liên quan, build, kiem:toc-do, kiem:mau-giu, check:mau, kiem-sw, kiem:co-tep.
6. **Phát hành:** gộp vào main ⇒ deploy.yml (cổng giờ học 18:00–23:30; ca mở chặn). Ghi Nhật ký.

## Tiến độ (ghi thêm khi xong từng phần)

- a09a34a+ · máy chủ (phong-binh-phan-ung.ts, src/lib/bpu/phong.ts + test 11/11), màn máy em (ManBinhPhanUng + bpu-hs.css), gắn StudentPortal/kenh-day/diem-danh-hs. Phím tờ chiếu sẽ là P (L đã là Lên bảng). Điểm = kJ (tinh thể đã là phần thưởng có sẵn).
- 17:29Z · bảng chiếu (BangBinhPhanUng + bang-ve + bpu-bang.css), gắn lười gan-gv/gan-hs (khung app KHÔNG đổi ⇒ byte mở bằng mốc), phím P tờ chiếu (nghe-to-chieu), điểm danh → bảng mới (TAT_BPU lùi cũ), ws-thang.ts (index.ts nhỏ lại). Cổng: tsc ×2, build, kiem-sw 14/14 (170 tệp), kiem:toc-do 0 đỏ, mau 0, co-tep 0, wrangler dry-run có PHONG_BPU; test bpu 22/22.
