# SỔ VIỆC — 14/09 lượt 9

- [x] "đáp án trả lời ngắn phải có giải từng bước. Sửa lại và đồng bộ hết mọi báo cáo, mọi ca thi, mọi app"  | bằng chứng: `vitest run tests/loi-giai-tung-buoc-1409.test.ts` 6/6 · `tests/loi-giai-chuan-va-bao-cao-hs.test.ts` 5/5
- [x] "Khắc phục lỗi sai trên điện thoại app học sinh không chạy."  | bằng chứng: `vitest run tests/khac-phuc-tren-dien-thoai-1409.test.ts` 9/9
- [ ] "Gộp 2 nút này làm một, thiết kế lại cho tinh tế hiện đại đẹp và phù hợp chuẩn google"  | bằng chứng: (chưa có)
- [ ] "Tạo cho tôi một nút máy chiếu ... file html quay ngang chia 2 phần, mỗi trang in tên 2 học sinh vào 2 nửa và đề bài đi kèm, đề bài có nút hiện lời giải, phần dưới trắng để học sinh lên bảng làm, xong 1 đợt thì kéo xuống hoặc bấm tiếp để hiện 2 đề và 2 học sinh tiếp theo"  | bằng chứng: (chưa có)
- [!] Phát hành  | KẸT: phiên Claude KHÁC đang sửa cùng kho (DauTruongGame.tsx sửa lúc 10:01, sw.ts, vite.config.ts, package.json, public/_headers) — đẩy bản live bây giờ là kéo theo việc dở của phiên ấy

## 7 CỬA — đo lúc 10:19–10:22 ngày 14/09

| Cửa | Lệnh | Kết quả |
|---|---|---|
| 1 | `npx tsc -b` | 0 lỗi |
| 2 | `npx tsc -p server/tsconfig.json --noEmit` | 0 lỗi |
| 3 | `npx vitest run --shard=1..3/3` | 250 tệp · 3.656 phép · 0 trượt |
| 4 | `npm run check:mau` | sạch |
| 5 | `node scripts/kiem-13.mjs` | ĐẠT 18/18 |
| 6 | `node scripts/kiem-sw.mjs` | ĐẠT 6/6 |
| 7 | `npx vite build --outDir $HOME/dist-pages` | rc=0 · precache 138 tệp |

## NGUYÊN NHÂN GỐC ĐÃ TRUY

### A. Lời giải bịa ở mọi báo cáo

Kho đề CÓ lời giải đủ cho 100% câu (đếm thật trên SSD, 157 tờ):
phần I 4.841 câu có `chot` + `tung_pa`; phần II 1.293 câu có `chot` + `tung_y`;
phần III 1.800 câu có `chot` + `buoc` — tức giải từng bước, không thiếu câu nào.

Báo cáo không thấy lời giải ấy vì:
1. `src/data/examContent.ts:258 mergeAndStrip()` dựng gói đề CÔNG KHAI
   `de/<maCa>.json` bằng cách liệt kê từng trường được giữ; `loiGiai`, `dang`,
   `kienThuc` không nằm trong danh sách nên bị lược sạch. Đúng về bảo mật.
2. Nhưng `server/src/goi-cu.ts hsCauSai()` và `keyBankTuBangCham()` lại dựng
   nội dung câu cho báo cáo TỪ CHÍNH gói ấy ⇒ `loiGiai` luôn rỗng.
3. `src/lib/chuan-hoa-loi-giai.ts:159` thấy rỗng thì BỊA một câu độn:
   "Bản chất kiến thức cốt lõi chuyên đề <X>: Đáp án đúng của câu này là <Y>.
   Cần chú ý định luật bảo toàn và khái niệm bản chất hoá học." — đúng chữ thầy
   chụp. Dòng 168–186 còn bịa cả mục "Vì sao chọn/không chọn".

Sửa: thêm `napCauTuKho()` lấy lời giải + nhãn dạng thẳng từ `kho/<maDe>.json`;
gỡ sạch mọi đường bịa, thiếu thì trả `thieu = true` và nói "chưa có lời giải".

### B. Khắc phục câu sai không chạy trên điện thoại

Hai lỗi rời nhau:

1. VÒNG KÍN (đây là lỗi "không chạy"). `BaoCaoCaThiHocSinhModal` nhận tờ phiếu
   qua `onTaoPhieuXong(html)` rồi VỨT html đi, chỉ gọi `onBatDauKhacPhuc(maCa)`.
   Nhánh ấy bên `StudentPortalScreen` đi tải lại câu sai rồi MỞ LẠI ĐÚNG modal
   em vừa bấm. Bấm "Bắt đầu làm bài" là quay về chính nó.
2. "Tỷ lệ tối đa: 0 câu". Chế độ 2 và 3 rút câu từ `loadExamSources()` — kho đề
   trong IndexedDB của CHÍNH MÁY. Kho ấy chỉ do `dongBoNganHang` nạp, mà hàm ấy
   đòi mã bí mật của thầy, nên máy em LUÔN rỗng.

Sửa: tờ phiếu đi kèm lên chỗ gọi và mở thẳng; modal mặc định chế độ 1, khoá chế
độ 2/3 khi kho rỗng và nói rõ vì sao; rút ra 0 câu thì báo, không mở phiếu trắng.

## ĐÃ SỬA TEST CŨ — KHAI RÕ

`tests/loi-giai-chuan-va-bao-cao-hs.test.ts` có hai ca trước kia khoá đúng hành
vi BỊA ("tự động hoàn thiện kiến thức cốt lõi … cho câu hạt nhân nếu thiếu cấu
trúc"). Thầy đổi luật ngày 14/09, nên hai ca ấy nay khoá điều ngược lại: cấm bịa.
Không phải sửa test cho xanh — đã ghi chú ngày và lý do ngay trong tệp.
