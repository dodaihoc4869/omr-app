# SỔ VIỆC — 14/09 lượt 9 + 10

- [x] "đáp án trả lời ngắn phải có giải từng bước. Sửa lại và đồng bộ hết mọi báo cáo, mọi ca thi, mọi app"  | bằng chứng: `vitest run tests/loi-giai-tung-buoc-1409.test.ts` 6/6 · `tests/loi-giai-chuan-va-bao-cao-hs.test.ts` 5/5
- [x] "Khắc phục lỗi sai trên điện thoại app học sinh không chạy."  | bằng chứng: `vitest run tests/khac-phuc-tren-dien-thoai-1409.test.ts` 9/9
- [x] "Gộp 2 nút này làm một, thiết kế lại cho tinh tế hiện đại đẹp và phù hợp chuẩn google"  | bằng chứng: `vitest run tests/may-chieu-len-bang-1409.test.ts` 11/11 · `tests/man-goi-len-bang-hien-ra-1009.test.tsx` 7/7
- [x] "Tạo cho tôi một nút máy chiếu ... file html quay ngang chia 2 phần, mỗi trang in tên 2 học sinh vào 2 nửa và đề bài đi kèm, đề bài có nút hiện lời giải, phần dưới trắng để học sinh lên bảng làm, xong 1 đợt thì kéo xuống hoặc bấm tiếp để hiện 2 đề và 2 học sinh tiếp theo"  | bằng chứng: `vitest run tests/may-chieu-len-bang-1409.test.ts` 11/11
- [x] Phát hành  | bằng chứng: Worker `eef6a348-7b92-4c41-8933-dd59cab32d2b` · Pages `24d57f2c` · đo trên bản live: 22/22 câu sai trả về lời giải thật (trước là 0/22), phần III ra 2–8 bước

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


## LƯỢT 10 — PHÂN CÔNG LÊN BẢNG

Gộp hai nút xanh giống hệt nhau ("Xếp giờ" và "Phân công lên bảng") thành MỘT
nút chạy cả hai đúng thứ tự. Thêm nút viền "Chiếu lên bảng" (chỉ hiện khi đã có
bảng phân công) dựng `src/lib/html-may-chieu.ts`: quay ngang, chia đôi màn, mỗi
đợt hai em — tên em trên, đề bài giữa, nút hiện lời giải riêng từng nửa, nửa
dưới để trắng cho em viết bảng. Kéo xuống, bấm "Đợt tiếp", hoặc phím ← → đều
sang hai em tiếp theo. In ra là A4 quay ngang, mỗi đợt một trang.

Lẻ một em thì nửa kia để trắng và nói rõ — không độn thêm em cho đủ cặp.

### Đã sửa test cũ — khai rõ
`tests/man-goi-len-bang-hien-ra-1009.test.tsx` có hai ca khoá bố cục HAI nút cũ
("khối Giáo án đứng TRƯỚC nút Phân công cũ", "nút Phân công cũ bấm được"). Thầy
chốt gộp nút ngày 14/09 nên hai ca ấy nay khoá bố cục MỘT nút, và khoá thêm:
nút máy chiếu chưa hiện khi chưa chạy phân công. Đã ghi ngày và lý do trong tệp.

### 7 cửa — đo lại lúc 10:40–10:45
tsc 0/0 · server tsc 0/0 · 3.667 phép (84+84+83 tệp) · check:mau sạch ·
kiem-13 18/18 · kiem-sw 6/6 · vite build rc=0


## PHÁT HÀNH 14/09 lúc 11:00

Thầy xác nhận phiên Claude kia đã dừng. Gom việc dở của phiên ấy thành commit
riêng `079875d` trước (để bản live có đường lùi), rồi chạy `DAY-OMR-APP.command`.

- Máy chủ (Worker): `eef6a348-7b92-4c41-8933-dd59cab32d2b`
- App (Pages): `24d57f2c` → https://omr-app-b3u.pages.dev
- Commit khi phát hành: `079875d` (trên `ea26e8a`, `29782b8`)

### Kiểm trước khi đẩy — không có ca thi nào đang chạy
D1 lúc 10:52: `SELECT ... FROM luot WHERE nop_luc IS NULL OR nop_luc=''` → **0 dòng**.
Lượt vào cuối 09:06, nộp cuối 09:09. Năm ca `trang_thai='mo'` đều là ca test
Test2–Test6, mỗi ca 1 vào / 1 nộp.

### Đo trên BẢN LIVE (gọi từ tab khác gốc, không phải tab app — tránh đọc bản
service worker cache cũ)

`POST omr.ttadodaihoc.workers.dev/hs/cau-sai` sbd 12121212, ca 614232 + 814335:
- 22/22 câu có lời giải thật (trước phát hành: 0/22, toàn chữ độn)
- phần III ra 2 · 3 · 8 · 5 bước — đúng "giải từng bước"
- `dang` nay có tên dạng thật ("Cấu tạo — đếm nguyên tử"…), trước để rỗng —
  đây cũng chính là thứ làm màn khắc phục báo "Tỷ lệ tối đa: 0 câu"
- không còn chuỗi "Cần chú ý định luật bảo toàn" trong dữ liệu lẫn trong bundle

Gói tĩnh đang phục vụ:
- `assets/index-Cq6df59y.js` — có "LÀM TỪNG BƯỚC", "Máy này chưa có kho đề của thầy",
  "Kho đề chưa có câu nào khớp lựa chọn này"
- `assets/PhanCongScreen-JSfTCuXQ.js` — có "Chiếu lên bảng" và nút gộp
- `assets/html-may-chieu-UQcBhDqO.js` — tờ máy chiếu
- `sw.js` 26.661 byte

### Lùi bản phát hành
`git revert 079875d ea26e8a 29782b8` rồi chạy lại `DAY-OMR-APP.command`.
Chỉ lùi phần lời giải + khắc phục: `git revert 29782b8`.
