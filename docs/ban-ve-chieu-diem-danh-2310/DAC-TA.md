# Màn chiếu Điểm danh đầu giờ + Nhịp học của lớp — vẽ lại 23/10/2026

Thầy 23/10: "thiết kế lại giao diện này xịn hơn đẹp hơn trực quan hơn, vẽ trước cho tôi đã nhé".
Đây là bước 2 của quy trình 4 bước. **Chưa build**: chờ thầy duyệt ảnh.

- Bản vẽ: `anh/A*-…jpg` (Điểm danh), `anh/B*-…jpg` (Nhịp học); mỗi cảnh 3 khổ 1920×1080 · 1280×720 · 1024×768 (4:3).
- Ảnh bản đang chạy để so: `anh/HIEN-TAI-diem-danh-1280.jpg`, `anh/HIEN-TAI-nhip-lop-1280.jpg`.
- Trang vẽ dùng component và hàm THẬT (`HuyHieuBac`, `src/lib/diem-danh-nhip.ts`, `chieu-bac.ts`, `server/src/bac-cham-chi.ts`) với dữ liệu giả.
- Chụp lại: `npx vite build --config scripts/ban-ve-chieu-dd-2310/vite.config.mjs --outDir <tạm> && node scripts/ban-ve-chieu-dd-2310/chup.mjs <tạm>`.

## 1. Mục tiêu + ai dùng
- **Người dùng:** thầy chiếu lên máy chiếu đầu giờ. Học sinh nhìn từ cuối lớp.
- **Em vừa vào lớp:** thấy ngay tên mình và huy hiệu bậc.
- **Cả lớp:** thấy ai Chăm / Chưa đều / Lười. Đây là áp lực đồng đẳng tích cực.
- **Thầy:** liếc 1 giây biết bao nhiêu em có mặt.
- **Màn Nhịp học:** cho cả lớp thấy nhịp làm bài 14 ngày và cách cả lớp làm bài (Vội / Có nghĩ / Treo máy).
- **Không lên chiếu:** mức 6 «Cố tình», không có điểm số, không có mã nội bộ.

## 2. Bố cục (máy chiếu, luôn nền tối)
- **A · Điểm danh**
  - Cột trái: thẻ mã buổi 6 số + QR, thanh «Mã đổi sau», đường link; dưới là «Vừa vào lớp» (3 em mới nhất, em đầu nổi bật).
  - Cột phải: 4 làn Chăm · Chưa đều · Lười · Mới. Mỗi em một thẻ: huy hiệu bậc + tên + tên bậc.
  - Em vừa vào: viền vàng + nhãn «Vừa vào 18:02». Em bậc cao nhất: nhãn «Dẫn đầu lớp».
  - Đầu màn: vòng «30/38 em có mặt · còn 8 em chưa điểm danh». Chân màn: nút «Chiếu Nhịp học của lớp».
- **B · Nhịp học**
  - Thanh nhóm (Chăm / Chưa đều / Lười / Mới) + ô số.
  - Thanh «Cách cả lớp làm bài».
  - 3 cột em, chấm 14 ngày hoặc thanh cách làm từng em. Quá chỗ thì hiện «+N em nữa · xem đủ trên máy thầy».
- **Lớp đông:** màn tự co theo đo thật, 6 nấc.
  - Thứ tự co: thẻ gọn → bỏ dải 12 bậc → thẻ một dòng → nhãn làn sang trái → bỏ huy hiệu nhỏ.
  - **Không bao giờ cắt tên.** Ảnh A3 là lớp 52 em ở khổ 4:3.

## 3. Trạng thái (mỗi trạng thái có ảnh)
| Ảnh | Trạng thái |
|---|---|
| A1 | Đang điểm danh, có dữ liệu |
| A2 | Vừa mở, chưa em nào vào |
| A3 | Lớp đông + mất mạng: dải đỏ «danh sách dừng ở 17:51…» |
| A4 | Chào em vừa quét (thẻ lớn vài giây) |
| A5 | Máy chủ cũ chưa có bậc: chỉ tên, không huy hiệu |
| B1 | Nhịp học đầy đủ |
| B2 | Ẩn tên em Lười |
| B3 | Bật «Cách làm từng em» (phím M) |
| B4 | Ngày đầu, chưa đủ số |
| B5 | Lỗi tải |

## 4. Dữ liệu
- Dùng đúng dữ liệu màn chiếu đang nhận: danh sách có mặt + giờ vào, `bacCham` (bậc 1–12), nhịp học 14 ngày (`EmNhipHoc`).
- **Không cần thêm trường máy chủ.**
- Cách làm (Vội / Có nghĩ / Treo máy) lấy từ số Mức làm đã có. Chỉ hiện tổng cả lớp, trừ khi thầy bật M.

## 5. Ngoại lệ
- **Tên dài** (vd «Nguyễn Hoàng Phương Thảo Nguyên»): xuống dòng, không cắt.
- **Lớp 50+ em:** tự co (mục 2).
- **Mất mạng:** giữ danh sách cuối và báo giờ dừng. Em vẫn điểm danh được.
- **Bấm lặp / quét lặp:** máy chủ đã chặn như hiện nay.
- **Máy chiếu 4:3:** có bố cục riêng, ảnh `-1024`.

## 6. Chi phí máy chủ
- 0 lệnh mới, 0 vòng chờ D1 mới. Màn dùng lại lệnh đang chạy.
- Phần tính bậc / nhóm làm trên máy thầy bằng các hàm có sẵn.

## 7. Nghiệm thu bằng máy (khi build)
- Soát Chromium (`chup.mjs`), 30 ảnh: 0 lỗi trang · 0 tràn ngang · 0 phần tử lọt khung · 0 tên bị cắt/che, kể cả nhãn đè tên · 0 nút < 44 px · không có «Cố tình» trên màn Nhịp. **Bản vẽ hiện đạt đủ.**
- `tsc`, test vitest của `BanChieuDiemDanh` / `chieu-bac` / `diem-danh-nhip`, `npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0.

## Đổi so với bản đang chạy (`anh/HIEN-TAI-*.jpg`)
- **Một lưới chung 30 thẻ → 4 làn Chăm · Chưa đều · Lười · Mới.** Nhìn màu làn là biết nhóm, không phải đọc từng thẻ.
- **Thẻ em: bỏ 3 dòng số** «Điểm chăm · Chuỗi · Đủ mức» (chữ quá nhỏ, cuối lớp không đọc được). Còn huy hiệu + tên + tên bậc, chữ to hơn. Số chi tiết chuyển vào chú thích khi rê chuột.
- **Ô lớn «Bậc cao nhất lớp» + «Theo sát phía sau» → «Vừa vào lớp».** Ô mới hiện 3 em vừa quét, mỗi em có giờ vào. Em bậc cao nhất được gắn nhãn «Dẫn đầu lớp» ngay trên thẻ.
- **Chú thích cuối màn rút còn một dòng.**
- **Thêm:** vòng số có mặt, dải đỏ khi mất mạng, bố cục riêng cho máy chiếu 4:3, tự co khi lớp đông.
- **Giữ nguyên:** mã 6 số + QR, dải 12 bậc (ẩn khi lớp đông), màu các nhóm, nút «Chiếu Nhịp học của lớp».

## Thầy cần quyết (mặc định đã vẽ)
1. **Phím M «Cách làm từng em»** trên màn Nhịp học: mặc định Tắt, chỉ hiện tổng cả lớp.
2. **Treo máy:** chỉ hiện tổng cả lớp, không gắn tên em.
3. **Tên em chưa có mặt:** vẫn chỉ hiện SỐ em, giống bản hiện tại.
4. **Bản này thay luật 20/10 «giữ nguyên chế độ QR».** Thầy duyệt ảnh tức là đồng ý thay luật này.
