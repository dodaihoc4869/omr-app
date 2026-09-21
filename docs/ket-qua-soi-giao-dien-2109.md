# KẾT QUẢ SOI GIAO DIỆN TĨNH — 21/09/2026

Công cụ: `scripts/soi-giao-dien.mjs` (Node thuần, không phụ thuộc mới) · chạy `npm run soi:giao-dien`
Đặc tả: `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` (Phần B mục 3, 6, 7, 11–16 + bảng từ A2) · Test: `tests/soi-giao-dien-2109.test.ts` (36 test)
Phạm vi lần soi này: 456 tệp (`src/**/*.{tsx,ts,css}` + `index.html`; bỏ test, `src/graphify-out/`, `*.d.ts`, chuỗi trong chú thích).
**KHÔNG sửa tệp giao diện nào** — tệp này chỉ là bảng việc cho các phiên giữ làn.

## Cách dùng
- `npm run soi:giao-dien` — cả kho · `-- --tep 'src/game/**' index.html` — vài tệp (glob / thư mục / đường dẫn) · `-- --chi-loi` — ẩn cảnh báo · `-- --json` — cho máy đọc (dùng `npm run -s` để không lẫn dòng tiêu đề của npm).
- Mã thoát 1 khi còn LỖI, cảnh báo không làm đỏ. Dòng in: `tệp:dòng · MÃ MỨC · mô tả · gợi ý sửa`, cuối là bảng đếm.
- Miễn trừ MỘT dòng: chú thích `soi-bo-qua: G01 lý do` ở NGAY dòng trên (`//`, `/* */`, `{/* */}`, `<!-- -->`; nhiều mã: `G04, G13`). Số miễn trừ hiện trong bảng đếm.

## Bảng đếm theo luật (cả kho, 21/09 08:17)
| Luật | Mức | Nội dung | Lỗi | Cảnh báo | Miễn trừ |
|---|---|---|---:|---:|---:|
| G01 | LỖI | `<div/span onClick>` thiếu `role` + `tabIndex`/`onKeyDown` | 19 | – | 0 |
| G02 | LỖI | nút chỉ có biểu tượng, thiếu `aria-label`/`title` | 7 | – | 0 |
| G03 | LỖI | xoá `outline` không có thay thế | 24 | – | 0 |
| G04 | LỖI | `transition: all` (98 lớp Tailwind `transition-all` + 3 CSS) | 101 | – | 0 |
| G05 | LỖI | chặn phóng to trang trong `index.html` | 2 | – | 0 |
| G06 | CẢNH BÁO | `<img>` thiếu kích thước + `loading` | – | 4 | 0 |
| G07 | CẢNH BÁO | ô nhập không có nhãn | – | 40 | 0 |
| G08 | CẢNH BÁO | `...` thay vì `…` | – | 41 | 0 |
| G09 | CẢNH BÁO | emoji trong chuỗi giao diện | – | 55 | 0 |
| G10 | CẢNH BÁO (`nắm chắc` = LỖI) | từ bị cấm bảng A2 | 1 | 27 | 0 |
| G11 | CẢNH BÁO | giờ 12 tiếng / ô `datetime-local` còn sót | – | 30 | 0 |
| G12 | CẢNH BÁO | chặn dán | – | 0 | 0 |
| G13 | CẢNH BÁO | chuyển động trên `width/height/top/left/margin/padding` | – | 10 | 0 |
| G14 | CẢNH BÁO | CSS có hoạt ảnh, thiếu `prefers-reduced-motion` | – | 3 | 0 |
| **TỔNG** | | | **154** | **210** | **0** |

Ba luật nhiều phát hiện nhất: **G04 (101)**, **G09 (55)**, **G08 (41)**.

## 10 tệp nhiều phát hiện nhất
| # | Tệp | Tổng | Trong đó LỖI |
|---:|---|---:|---:|
| 1 | `src/screens/ExamSetupScreen.tsx` | 33 | 16 |
| 2 | `src/screens/StudentPortalScreen.tsx` | 27 | 2 |
| 3 | `src/components/ThanThuHoaHocGame.tsx` | 22 | 10 |
| 4 | `src/screens/PhanCongScreen.tsx` | 20 | 17 |
| 5 | `src/components/BongBongChatHocSinh.tsx` | 17 | 2 |
| 6 | `src/components/KhoiKhacPhuc3CheDo.tsx` | 15 | 5 |
| 7 | `src/components/ModalKhacPhucCauSai.tsx` | 14 | 11 |
| 8 | `src/screens/GoiLenBangScreen.tsx` | 14 | 10 |
| 9 | `src/components/BangTinPhuHuynh.tsx` | 13 | 12 |
| 10 | `src/components/bang-nhiem-vu/BtvnM3.tsx` | 11 | 0 |

## 15 phát hiện LỖI tiêu biểu
| # | tệp:dòng | Luật | Sự việc |
|---:|---|---|---|
| 1 | `index.html:54` | G05 | `maximum-scale=1.0, user-scalable=no` — chặn phóng to cả 3 app |
| 2 | `src/components/BangTroLyPhuHuynh.tsx:217` | G01 | thẻ "ca gần nhất" là `<div onClick>` — bàn phím không tới được |
| 3 | `src/screens/ParentPortalScreen.tsx:761` | G01 | dòng ca trong danh sách là `<div onClick>` |
| 4 | `src/screens/LichSuCaScreen.tsx:425` | G01 | dòng lịch sử ca (chọn / mở chi tiết) là `<div onClick>` |
| 5 | `src/components/KhoiKhacPhuc3CheDo.tsx:1069` | G01 | thẻ chọn ca khắc phục là `<div onClick>` (5 chỗ trong tệp) |
| 6 | `src/components/ModalKhacPhucCauSai.tsx:519` | G01 | thẻ chọn chế độ là `<div onClick>` (3 chỗ) |
| 7 | `src/screens/ExamTakeScreen.tsx:3034` | G02 | nút `<X />` trên MÀN THI không có `aria-label` |
| 8 | `src/screens/ExamSetupScreen.tsx:825` | G02 | nút `<X />` (4 chỗ: 825, 870, 913, 992) |
| 9 | `src/components/BongBongChatHocSinh.tsx:653` | G02 | nút đóng khung chat chỉ có `<X />` |
| 10 | `src/styles/hom-nay.css:50` | G03 | `.hn-tim input { outline: 0 }` — không có `.hn-tim:focus-within` thay thế |
| 11 | `src/screens/HocSinhScreen.tsx:44` | G03 | style ô nhập dùng chung `outline: 'none'` (kiểu nội tuyến này có 19 chỗ / 17 tệp) |
| 12 | `src/screens/ExamTakeScreen.tsx:2517` | G03 | ô Số báo danh màn vào thi `outline: 'none'` (và 2552) |
| 13 | `src/styles/teacher-layout.css:49` | G04 | `transition:all 0.15s … !important` áp cả khung app thầy |
| 14 | `src/components/BangTinPhuHuynh.tsx:133` | G04 | lớp Tailwind `transition-all` (12 chỗ trong tệp; `PhanCongScreen.tsx` 17 chỗ) |
| 15 | `src/lib/html-phieu.ts:1566` | G10 | chữ in trên phiếu: "…hoàn thành để **nắm chắc** nền tảng" |

Ghi chú màn thi thật: mục 7 và 12 nằm trong `ExamTakeScreen.tsx` (đã khoá) — sửa phải qua Boss soát.

## Nhận xét: luật nào còn báo nhầm / còn sót
**Nghi báo nhầm (đọc trước khi sửa hàng loạt):**
- **G14** — 3 phát hiện đều là báo nhầm "một phần": `src/styles/tokens.css:203` đã có khối `prefers-reduced-motion` TOÀN APP (ép `animation-duration: 0.001ms`). Luật soi theo TỪNG tệp nên không biết điều đó. Chỉ cần sửa khi hoạt ảnh là vòng lặp vô hạn của game (phải tắt sạch, chuẩn B15).
- **G08 trong `src/lib/`** (10/41): vài chuỗi là câu nhắc gửi A.I hoặc mô tả định dạng (`"Câu ..."`, `src/lib/tro-ly/ai-giai-bai.ts:82, 219`, `exam-parse.ts:246, 277`) — không phải chữ học sinh thấy. 31 phát hiện còn lại (placeholder, "Đang tải...") là thật.
- **G09 trong `src/lib/`** (7/55): `ai-giai-bai.ts` là câu nhắc A.I; `html-phieu.ts` (4) là chữ in thật. 48 phát hiện ở màn là thật.
- **G01** — `src/game/than-thu-v2/DoanTiepSuc.tsx:13` là tấm nền `dh-tam-nen` (bấm ra ngoài để đóng). Bộ soi chỉ tự nhận ra tấm nền khi có `inset-0`, `aria-hidden` hoặc `role="presentation|dialog"`; lớp CSS riêng thì không. Đã mở mã 9/18 phát hiện còn lại: đều là thẻ / dòng bấm được thật.
- **G11** — `toLocaleTimeString('vi-VN', …)` trên Chromium ra 24 giờ sẵn, nhưng iOS Safari theo cài đặt 12/24 giờ của máy ⇒ vẫn nên thêm `hour12: false`. Coi là "gia cố", không gấp. Không có ô `datetime-local`/`time` nào còn sót trong `src/screens`, `src/components`.
- **G07** — không biết các thành phần nhãn tự viết (chữ nằm trong `<div>` cạnh ô, vd `ExamTakeScreen.tsx:2506` "Số báo danh"): về mặt nhìn thì có nhãn, về mặt trình đọc màn hình thì CHƯA nối ⇒ vẫn là việc thật, sửa bằng `<label htmlFor>` hoặc `aria-label`.
- **G04** — 98/101 là lớp Tailwind `transition-all`. Đúng bản chất (`transition-property: all`) nhưng số lượng lớn, phần nhiều ở màn cũ của app thầy; nên đổi theo cụm màn sang `transition-colors` / `transition-transform`, không đổi rải rác.

**Còn sót có chủ ý (thà sót còn hơn báo bừa):**
- HTML/CSS viết trong CHUỖI (`src/lib/html-phieu.ts`, `html-may-chieu.ts`, `giao-dien-to-chieu.ts`, `css-bao-cao.ts`): chỉ G04, G08, G09, G10 soi được; G01–G03, G06, G07, G13, G14 không đọc thẻ / khối CSS trong chuỗi.
- G02 chỉ chắc khi biểu tượng nhập từ `lucide-react` hoặc tên dạng `Icon…` / `…Icon` / `BieuTuong…`; nút có `{...props}` bị bỏ qua.
- G06 coi lớp Tailwind `w-/h-/size-/aspect-` là đã có kích thước; ảnh định cỡ bằng lớp CSS riêng mà không có `loading` thì vẫn bị báo (4 chỗ: `BangVinhDanh.tsx:136`, `DoanCau.tsx:20, 48, 61` — cần nhìn CSS để quyết).
- G10 (deadline / HP / streak) chỉ soi chuỗi "trông như chữ hiển thị" (có dấu cách hoặc chữ có dấu, hoặc là giá trị `title/label/aria-label/placeholder`) và chữ JSX; chuỗi đúng một từ bị bỏ qua. "nắm chắc" đứng MỘT MÌNH trong chuỗi được hiểu là mục của bảng từ cấm (`src/lib/bo-nao-khuon.ts`) nên không báo.
- G11 với `toLocaleString(` chỉ báo khi chắc là giờ (tuỳ chọn có `hour/minute/timeStyle`, hoặc gọi trên `new Date(…)`), vì hàm này còn dùng định dạng SỐ; tuỳ chọn truyền bằng biến thì bỏ qua.
- G12 = 0: kho không có `onPaste` nào.

## Thứ tự sửa đề nghị (để Boss chia làn)
1. `index.html:54` (G05) — một dòng, lợi cho cả 3 app; sửa xong phải thử lại màn thi trên điện thoại (chạm đúp không được phóng to nhầm — chuẩn B17 `touch-action: manipulation`).
2. G02 + G03 ở màn học sinh / màn thi (ít chỗ, tác động lớn tới bàn phím + trình đọc màn hình).
3. G01 (19 chỗ): trước là tệp phụ huynh / học sinh (`BangTroLyPhuHuynh.tsx` 4, `BangTroLyHocSinh.tsx` 1, `ParentPortalScreen.tsx` 1), rồi các tệp còn lại.
4. G10 "Lô" → "Chặng" (`BtvnM3.tsx`, `StudentPortalScreen.tsx` 1570–1652, `DoanSanh.tsx:83`) và "HP" → "Máu" (`LearningBattle.tsx`, `EscortRoom.tsx`, `EscortGuide.tsx`) — đi cùng đợt chuẩn hoá từ ngữ A3 vì có test khoá chuỗi.
5. G04 / G08 / G09 / G11: dọn theo cụm màn khi phiên giữ làn đụng tới tệp đó.
