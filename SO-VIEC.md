# SỔ VIỆC — 14/09 lượt 12 · VIẾT LẠI THUẬT TOÁN PHÂN CÔNG LÊN BẢNG

- [ ] "viết lại thuật toán phân công bên bảng"  | bằng chứng: (chưa có)
- [ ] "box chọn bài bạn cho hiển thị đầy đủ số câu trong kho đề"  | bằng chứng: (chưa có)
- [ ] "Khi tick chọn học sinh ưu tiên phân công câu 2 sao trước rồi đến 1 sao"  | bằng chứng: (chưa có)
- [ ] "lấy tất cả mọi dữ liệu của học sinh, từ bài thi, bài tập về nhà, khắc phục câu sai đóng gói lại để phân bổ câu gọi lên bảng cho hợp lý"  | bằng chứng: (chưa có)
- [ ] "trong 90 phút danh sách lớp phải có ít nhất 20 em được lên bảng, tính toán chữa câu khó và câu dễ đan xen gọi học sinh phù hợp"  | bằng chứng: (chưa có)
- [ ] "số câu khó và quan trọng nhất phải được chữa hết, số câu còn lại chỉ cần đọc đáp án"  | bằng chứng: (chưa có)
- [ ] "số câu còn lại chưa được chữa được chiếu đáp án lên bảng qua mục máy chiếu"  | bằng chứng: (chưa có)
- [ ] Nghiệm thu 7 cửa + phát hành  | bằng chứng: (chưa có)

## Vì sao bản cũ không đạt 20 em

Cấu hình cũ: 80 phút, hao phí 480 giây, còn 4.320 giây để chữa.
Lane L3 (em lên bảng) giá CỐ ĐỊNH 420 giây, trần 8 em.

20 em × 420 giây = 8.400 giây — gấp đôi ngân sách. Không có cách nào đạt
nếu mỗi em lên bảng đều tốn bằng nhau. Đó là lý do trần đặt 8.

## Phép tính mới — 90 phút, giá lên bảng theo ĐỘ KHÓ

5.400 − 480 = 4.920 giây chữa.

| Loại câu | Giây lên bảng | Vì sao |
|---|---|---|
| 2 sao (khó, quan trọng) | 300 | em làm + thầy chốt bẫy |
| 1 sao | 180 | em làm, thầy chốt một câu |
| 0 sao | 120 | gọi nhanh, chữa gọn |

Ví dụ 6 câu 2 sao + 8 câu 1 sao + 6 câu 0 sao = 20 em:
6×300 + 8×180 + 6×120 = 3.960 giây. Còn 960 giây đọc đáp án cho phần còn lại
(L0 5 giây, L1 20 giây mỗi câu) — thừa sức cho vài chục câu.

⇒ 20 em ĐẠT ĐƯỢC, với điều kiện có đủ câu. Thiếu câu thì nói thẳng thiếu bao
nhiêu và cần tích thêm bao nhiêu bài, KHÔNG bịa ra số em.

## Việc phải làm

A. Máy chủ: lệnh gói hồ sơ cả lớp trong MỘT lượt gọi — bản đồ câu sai
   (`ban_do_sai`), câu đã làm (`qid_da_lam`, gồm cả BTVN và khắc phục),
   bảng mạnh–yếu (`tien_do_hs`), lịch sử lên bảng (`len_bang`).
B. Máy thầy: gộp thành một hồ sơ đầy đủ cho mỗi em.
C. Thuật toán mới: xếp buổi chữa theo hai tầng — câu khó chữa hết, câu còn lại
   đọc đáp án; bảo đảm số em lên bảng tối thiểu.
D. Hộp chọn bài: hiện đủ số câu trong kho (bỏ khử trùng ở tầng HIỂN THỊ, chỉ
   khử trùng khi DỰNG danh sách chữa).
E. Tờ máy chiếu: thêm trang ĐÁP ÁN cho những câu chỉ đọc, không chữa.

---

# LƯỢT 10 — BÀI TẬP VỀ NHÀ LÀM CĂN CỨ GỌI LÊN BẢNG (14/09)

- [x] "khi phân công học sinh chiếu lên bảng, bạn sử dụng dữ liệu nộp bài tập về nhà, vì tôi lấy đúng file giao về nhà cho học sinh để gọi lên bảng"  | bằng chứng: `hoSoLopLenBang` đọc `btvn_em.dap_an_json` đối chiếu kho; `TRONG_SO.BTVN_CHINH_CAU = 0,34` là trọng số NẶNG NHẤT trong `diemHopCau`; `npx vitest run tests/btvn-len-bang-1409.test.ts` → 25/25
- [x] "phải hiển thị được học sinh đó làm bao nhiêu câu về nhà/tổng số câu, bao nhiêu câu làm đúng, bao nhiêu câu làm sai, bao nhiêu câu chưa làm"  | bằng chứng: cùng tệp test, mục "bốn con số thầy hỏi ra ĐÚNG bảng tính tay"; hiện ở 3 nơi — dòng phân công, dòng tổng cả lớp, tờ máy chiếu
- [x] "câu bạn đó được phân lên bảng thì đã làm ở nhà là đúng hay sai hay chưa làm"  | bằng chứng: thẻ `<TheBtvn>` trên màn, `mc-btvn-*` trên tờ chiếu, `[về nhà làm SAI]` trong bảng copy
- [ ] Nghiệm thu 7 cửa + phát hành  | bằng chứng: (chưa có)

## NGUYÊN NHÂN GỐC — vì sao không thể đọc thẳng con số có sẵn

`btvn_em` chỉ ghi TỔNG `so_dung` và `so_cau`. Suy ngược ra "sai mấy câu, chưa
làm mấy câu" từ hai số ấy là BỊA, vì lúc chấm (`nopBtvnQuaPhieu`) `qidSai`
GỘP câu bỏ trống vào câu sai — đúng thứ thầy cần tách ra.

Đường đúng duy nhất: `dap_an_json` giữ nguyên bài làm của em. Đối chiếu với
đáp án trong kho, TỪNG CÂU MỘT, là ra ba trạng thái rời nhau.

## Đã làm

1. `dapAnTheoMaDe(env, maDeCsv, boNho)` — MỘT hàm đọc đáp án, dùng chung cho
   CHẤM bài và cho HỒ SƠ lên bảng. Trước đây khối đọc ấy nằm trong
   `nopBtvnQuaPhieu`; tách ra để hai nơi không bao giờ lệch nhau một câu.
2. `hoSoLopLenBang` thêm truy vấn thứ 5 (`btvn_em` JOIN `btvn`), lấy 4 lượt
   giao gần nhất, LƯỢT MỚI ĐÈ LƯỢT CŨ, trả `HoSoBtvnEm`.
3. `diemHopCau` xếp lại trọng số: bài tập về nhà của CHÍNH câu ấy nặng nhất
   (0,34) vì thầy lấy đúng tờ đề giao về nhà làm đề gọi lên bảng.
   sai 1,0 · chưa làm 0,8 · đúng 0 (gọi lại em đã làm đúng là đốt giờ bảng).
4. `DongChua.em` giữ nguyên hồ sơ em thay vì cắt còn tên + số báo danh.
5. Hiện ở ba nơi: dòng phân công, dòng tổng cả lớp, và tờ máy chiếu.

## Giả định đã dùng

- Chỉ tính 4 lượt giao gần nhất (`TRAN_LUOT_BTVN`). Bài tháng trước không nói
  gì về buổi chữa hôm nay, mà mỗi lượt là thêm một lần chạm R2.
- Câu KHÔNG nằm trong bài giao về nhà thì KHÔNG hiện nhãn, và cộng 0 điểm —
  khác hẳn "chưa làm". Hiện nhãn "chưa làm" cho câu chưa từng giao là bịa.

---

# LƯỢT 11 — APP HỌC SINH & PHỤ HUYNH KHÔNG TRUY CẬP ĐƯỢC (14/09)

- [x] "app học sinh và phụ huynh lại không truy cập được. Bạn phải tìm cách để hiện tượng này không lặp lại nữa."  | bằng chứng: `sw.js` trên máy chủ nay KHÔNG còn `registration.unregister()`, không xoá sạch kho, không ép điều hướng (đo từ tab khác gốc); chốt tự sửa đã lên; `kiem-sw.mjs` ĐẠT 10/10; bản phát hành Pages `75136d05`, commit `14037b8`

## NGUYÊN NHÂN GỐC — đo được, không đoán

Bản `sw.js` ĐANG CHẠY THẬT chứa đoạn tự huỷ:

```
if (serverTs > SW_BUILT_AT + 2) {
  const keys = await caches.keys()
  await Promise.all(keys.map(k => caches.delete(k)))   // xoá CẢ precache vừa nạp
  await self.registration.unregister()                  // gỡ, nhưng VẪN đang điều khiển tab
  for (const client of clients) client.navigate(client.url)  // ép đi qua chính nó
}
```

Điều kiện `serverTs > SW_BUILT_AT` KHÔNG hiếm — nó đúng với MỌI em quay lại
sau MỖI lần phát hành. Nhánh ấy xoá kho precache workbox vừa nạp trong chính
lượt activate ấy, rồi ép điều hướng qua chính SW đó vào kho rỗng ⇒
`Response.error()` ⇒ ERR_FAILED. Đó là lý do lỗi LẶP LẠI sau mỗi bản.

Đo lúc truy: Pages trả 200, Worker trả 200 (71 ms), `/hs/dang-nhap` trả đúng
— nghĩa là máy chủ không hỏng. Hỏng nằm ở service worker trên máy em.

## Đã sửa — ba lớp

1. `src/sw.ts`: thấy máy chủ có bản mới thì `registration.update()` + nhắn
   cho tab. Không xoá kho, không tự gỡ, không ép điều hướng. Thêm: tầng
   precache trượt thì gọi bản mới về ngay, nhưng vẫn trả trang cho em.
2. `index.html`: sau 9 giây mà `#root` còn rỗng thì gỡ SW, xoá kho, nạp lại
   kèm `_moi=`. CHỈ MỘT LẦN mỗi tab. Chốt này KHÔNG cần biết nguyên nhân,
   nên nó chặn cả nguyên nhân lần sau — đây mới là phần "không lặp lại nữa".
3. `scripts/kiem-sw.mjs`: 4 phép mới đọc `dist/sw.js` bản THẬT. Trượt là
   `DAY-TAT-CA.command` dừng, không đẩy.

## Nghiệm thu sau phát hành (đo từ tab Cloudflare, KHÁC gốc app)

| Việc | Kết quả |
|---|---|
| `registration.unregister()` trong sw.js | KHÔNG còn |
| xoá sạch CacheStorage | KHÔNG còn |
| ép tab điều hướng | KHÔNG còn |
| `registration.update()` + báo tab | CÓ |
| chốt tự sửa trong index.html | CÓ |
| 142 mục precache | 0 mục hỏng |
| tài nguyên index.html trỏ tới | 0 mục hỏng |
| máy đã có SW CŨ mở lại app | `#root` có nội dung, kho precache CÒN NGUYÊN, chốt tự sửa KHÔNG phải chạy |

## CÒN TREO — KHÔNG PHẢI VIỆC CỦA LƯỢT NÀY

- [!] `npm run check:mau`: 90 mã màu ngoài tokens.css, TẤT CẢ nằm trong 6 tệp
  `src/game/giai-cuu-cong-chua/*` của phiên Claude khác, chưa theo dõi git.
  Không đụng vào, không đưa vào commit này.
- [!] Bản Pages vừa đẩy DỰNG TỪ CÂY LÀM VIỆC nên có mang theo mã game đang
  làm dở của phiên kia (`ThanThuHoaHocGame`, `giai-cuu-cong-chua`,
  `public/cai-app*`). Không nằm trong commit `14037b8`.

---

# LƯỢT 12 — RÀ SOÁT 3 APP · KHOÁ VAI · TỐI ƯU (14/09)

- [ ] "rà soát toàn bộ 3 app, tự động sửa nếu phát hiện lỗi"  | bằng chứng: (chưa có)
- [ ] "Tối ưu mọi thứ từ tốc độ tới sự hoạt động ổn định, mượt mà"  | bằng chứng: (chưa có)
- [ ] "Link của 3 app bạn hãy bọc hay làm gì đó để đảm bảo 100% không nhảy lẫn lộn"  | bằng chứng: (chưa có)

## Đo được trước khi sửa

Mảnh mã CHÍNH `index-BO6e2eTq.js` nặng **755 KB** — MỌI người tải, kể cả phụ
huynh chỉ mở một trang báo cáo trên điện thoại. Trong đó có:
- `GiaiCuuCongChuaGame` 29 KB + `ThanThuHoaHocGame` 37 KB + `src/game/` 168 KB
  = **~234 KB mã game**, vào mảnh chính vì `StudentPortalScreen` nhập THẲNG,
  mà `StudentPortalScreen` lại được `App.tsx` nhập thẳng.
- `ParentPortalScreen` 29 KB — em học sinh không bao giờ cần.

## Lỗ nhảy lẫn vai — chỗ DUY NHẤT còn đoán

Mọi đường có vai rõ ràng đều đúng. Chỗ đoán là `/` TRẦN: `laManThayQuanLy`
hỏi `localStorage['ddh.vaiDaDung']`. Ba app CHUNG một gốc nên CHUNG một
localStorage — máy nào mở cả ba thì khoá ấy là của app mở sau cùng.

Thêm: link ba app đang ba kiểu (`/?vai=gv`, `/hs`, `/ph`). Zalo và nhiều trình
rút gọn có thể cắt phần `?...`, và cắt xong `/?vai=gv` thành `/` trần — rơi
đúng vào chỗ đoán.

## Đã sửa — lượt 12

### A. KHOÁ VAI — ba lớp bọc

`src/lib/khoa-vai.ts` mới:
1. **Vai nằm trong ĐƯỜNG DẪN**, không nằm trong tham số. Ba link chuẩn:
   `/gv` · `/hs` · `/ph`. `khoaVaiVaoUrl()` chạy lúc khởi động viết lại địa chỉ
   về đúng dạng ấy, nên tải lại trang hay service worker trả trang đều giữ vai.
   Giữ nguyên phần sau `#` và mọi tham số khác.
2. **`start_url` cả ba manifest** cũng là đường dẫn ấy (`./gv`, `./hs`, `./ph`).
   `id` GIỮ NGUYÊN — đổi `id` là người đã cài thấy biểu tượng thứ hai.
3. **`/` trần HỎI, không đoán** — `ChonAppScreen` ba thẻ, một chạm.
   `vaiDaDung` từ nay chỉ còn quyền XẾP THỨ TỰ, không quyết định.

Gỡ 4 dòng 302 `/hs → /?vai=hocsinh` trong `_redirects`: chúng tạo thêm một
vòng mạng rồi bị viết ngược lại, và chỉ đúng với máy CHƯA cài app.

### B. TỐC ĐỘ — mảnh mã chính

| | Trước | Sau |
|---|---|---|
| mảnh chính thô | 755 KB | **631 KB** |
| mảnh chính gzip | — | **183 KB** |

Tách ra thành mảnh riêng, chỉ tải khi mở: `GiaiCuuCongChuaGame` 64 KB ·
`ThanThuHoaHocGame` · `ParentPortalScreen` 49 KB.

GIỮ NẠP SỚM: `ExamTakeScreen` và `PhieuScreen` — ngày thi không đánh cược vào
một mảnh mã tải muộn, và phiếu là thứ phụ huynh mở nhiều nhất.
