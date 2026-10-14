# Hỏi Thầy v2: câu trả lời linh hoạt theo từng câu hỏi (bản vẽ 14/10/2026, THẦY DUYỆT 14/10, ĐÃ BUILD)

Thầy (14/10): "Tôi muốn nội dung trả lời hiển thị nó linh hoạt hơn cho từng câu hỏi của học sinh, nếu cần vẽ sơ đồ tạo thí nghiệm ảo nhẹ, làm mọi thứ để trả lời học sinh tốt nhất hiểu bài nhanh, in đậm tô màu mọi thứ có thể. Vẽ trước cho tôi xem trước khi build."

- Bản vẽ: `hoi-thay-v2.html` (mở `?k=tn` · `?k=tinh` · `?k=so-do`; thêm `&de=1` để mở đề). Dùng CSS THẬT của app (`tokens.css`, `m3-theme.css`, `loi-giai.css`, `hop-hoi-thay.css`, `tra-loi-thay.css`) + khối mới ngay trong tệp.
- Ảnh: `anh/` chụp bằng `node scripts/chup-ban-ve-hoi-thay-v2-1410.mjs` (Chromium thật, 3 khổ, sáng/tối). Video hoạt cảnh: `anh/11-thi-nghiem-hoat-canh.webm`.
- Thầy duyệt (14/10): "Làm mọi thứ tốt nhất để hs hỏi cái là hiểu được bài ngay" ⇒ build.
- Code: `server/src/hoi-tro-ly-cau-truc.ts` (lược đồ + làm sạch khối), `server/src/hoi-tro-ly.ts` (chỉ dẫn KHỐI HÌNH), `src/components/loi-giai/KhoiTraLoi.tsx` + `khoi-tra-loi.css` (vẽ khối), `TraLoiThay.tsx` (thứ tự, ++đúng++ / !!sai!!, nhãn nhóm chức, chỉ số polymer).
- Khác bản vẽ: em ĐANG LÀM thì máy chủ bỏ hẳn phương trình + tính nhanh (sản phẩm và số liệu là đáp án); sơ đồ chỉ giữ ký hiệu (X, Y) của chất cần tìm. Biểu tượng khối vẽ tại chỗ (không dùng lucide) để byte mở app không tăng.

## 1. Mục tiêu sư phạm, ai dùng

Học sinh bấm Hỏi Thầy ở một câu. Hiện nay mọi câu trả lời cùng một khuôn (ý chính → bước → bảng → ghi nhớ). Bản v2: **Thầy chọn khối hợp với câu hỏi**, em nhìn là hiểu, không phải đọc đoạn dài.

| Em hỏi kiểu gì | Khối Thầy dùng | Bản vẽ |
|---|---|---|
| Nhận biết, hiện tượng, thí nghiệm | **Thí nghiệm ảo** (ống nghiệm đổi màu, kết tủa, gương bạc, sủi bọt) + **Hiện tượng → nhóm chức** | Khung 1, Câu 75 |
| Tính toán, "sao em ra số này" | **Phương trình** (chất chính viền đậm) + **Tính nhanh** (từng dòng, kết quả xanh, ô Đáp số) + **Chỗ em nhầm** | Khung 2, ester 8,8 g |
| Chuỗi chuyển hoá, sơ đồ | **Sơ đồ chuyển hoá** (nút chất, điều kiện trên mũi tên) + thí nghiệm + phương trình | Khung 3, tinh bột → acetic acid |
| Câu lý thuyết ngắn | Giữ khuôn cũ (ý chính + ghi nhớ) | không đổi |

Tô màu, in đậm:
- `**đậm**` cho từ khoá; `==…==` nền nổi cho kết quả; chất đúng **xanh lá**; chất em nhầm **đỏ gạch ngang**.
- Nhóm chức tự thành nhãn màu: –NH₂ xanh dương, –CHO cam, –OH xanh lục, –COO– đỏ.
- Thuốc thử chữ tím; hiện tượng gạch chân theo màu hiện tượng.
- Ô **Bẫy hay nhầm / Chỗ em nhầm** nền đỏ nhạt; **Ghi nhớ** nền vàng như cũ.

Em ĐANG LÀM (chưa nộp): vẫn có thí nghiệm ảo và hiện tượng → nhóm chức, nhưng **không ghép chất vào X, Y, Z**, không có ô Đáp số. Thẻ "Gợi hướng" ở đầu câu trả lời.

## 2. Bố cục

- **Điện thoại dọc (390 px)**: hộp sát đáy như bản đã chốt 13/10. 3 ống nghiệm nằm một hàng, mỗi ống: tên (X) → thuốc thử (tím) → ống → hiện tượng (đậm) + giải thích một dòng. Sơ đồ chuyển hoá dọc, mũi tên kèm điều kiện. Phương trình là các ô chất, tự xuống dòng.
- **Ngang (844×390)** và **máy tính (1440)**: hộp giữa màn rộng tối đa ~560 px, cuộn trong hộp; ô nhắn + câu khẩu hiệu dính đáy. Sơ đồ vẫn dọc (dàn ngang trong 560 px sẽ gãy hàng giữa mũi tên).
- Thứ tự trong một câu trả lời: ý chính → các khối (theo thứ tự Thầy chọn) → bước → bẫy → ghi nhớ → nút hỏi tiếp. Tối đa **3 khối** một câu trả lời.
- Nút "Làm lại" ở góc khối thí nghiệm (cao 44 px): chạy lại hoạt cảnh.

## 3. Trạng thái

| Trạng thái | Hiện gì |
|---|---|
| Đang chờ Thầy | ba chấm như hiện nay (không đổi) |
| Có câu trả lời, không có khối | khuôn cũ: ý chính, bước, bảng, ghi nhớ |
| Có khối | vẽ khối; thí nghiệm chạy hoạt cảnh **một lần** khi khối lọt vào màn (giọt rơi → đổi màu → kết tủa/gương bạc/bọt), ~2,5 s mỗi ống, các ống nối nhau |
| Máy bật "giảm chuyển động" | ống đứng sẵn ở trạng thái cuối (ảnh tĩnh trong `anh/` chụp ở chế độ này) |
| Lỗi, mất mạng, hết lượt | như hiện nay (không đổi) |
| Câu trả lời cũ trong sổ | vẽ như cũ, không vỡ |

## 4. Dữ liệu

Lệnh đang có: `/hs/hoi-tro-ly` trả `CauTrucTraLoi` (`server/src/hoi-tro-ly-cau-truc.ts`: `yChinh, buoc, bang, ghiNho, hoiTiep`). **Cần thêm** một trường tuỳ chọn `khoi` (mảng ≤ 3), các trường cũ giữ nguyên:

```ts
type Khoi =
  | { loai: 'thiNghiem'; ong: { nhan: string; thuoc: string; hien: HienTuong; chu: string; phu?: string }[] } // ≤ 4 ống
  | { loai: 'nhanBiet'; dong: { thuoc: string; hien: HienTuong; chu: string; nhom: string }[] }            // ≤ 5 dòng
  | { loai: 'phuongTrinh'; pt: { trai: string[]; phai: string[]; dk?: string; chinh?: number }[] }          // ≤ 3 phương trình
  | { loai: 'soDo'; nut: { ten: string; nhan?: string }[]; dk: string[] }                                   // ≤ 6 nút
  | { loai: 'tinh'; dong: { nhan: string; bieuThuc: string; ketQua: string }[]; dapSo?: string }            // ≤ 6 dòng
  | { loai: 'bay'; tieuDe: 'Bẫy hay nhầm' | 'Chỗ em nhầm'; chu: string }
type HienTuong = 'quy-xanh' | 'quy-do' | 'trang-bac' | 'tua-trang' | 'tua-vang' | 'tua-xanh' | 'tua-nau-do' | 'dd-xanh-lam'
  | 'tim' | 'xanh-tim' | 'mat-mau' | 'khi' | 'tach-lop' | 'khong-doi'
```

- Hiện tượng là **danh sách đóng 14 loại**: máy em tự vẽ đúng màu, Gemini không gửi mã màu hay hình vẽ.
- Gemini vẫn trả JSON theo `responseSchema` (thêm `khoi` vào `SCHEMA_TRA_LOI`). Chỉ dẫn hệ thống thêm luật: khi nào dùng khối nào, tối đa 3 khối, câu lý thuyết ngắn thì không dùng khối.
- Máy chủ làm sạch từng ô như hiện nay (bỏ HTML, cắt độ dài, giới hạn số cụm tô đậm); loại `loai`/`hien` lạ; `chuPhang` (ghi sổ, gửi lại làm lịch sử) gồm cả chữ trong khối.
- Bản vẽ dùng dữ liệu giả sát thực tế; số liệu khung 2 đã tính lại: M(CH₃COOC₂H₅) = 88, M(CH₃COONa) = 82, M(C₂H₅COONa) = 96 (đúng ra 9,6 nếu em lấy nhầm gốc).

## 5. Ngoại lệ

- **Em đang làm**: máy chủ bỏ hẳn phương trình và tính nhanh; sơ đồ chỉ giữ ký hiệu chất cần tìm; nhãn ống dài hơn 4 ký tự bị bỏ; không tô "đúng"; mọi ô chữ trong khối qua bộ chặn lộ đáp án hiện có.
- **Gemini trả khối hỏng** (thiếu trường, mảng rỗng, loại lạ): bỏ khối đó, phần còn lại vẫn hiện; hỏng hết thì về khuôn cũ.
- **Công thức dài**: ô chất không ngắt giữa công thức, tự xuống dòng giữa các ô; điều kiện phản ứng một dòng.
- **Bấm "Làm lại" liên tục**: mỗi lần chỉ dựng lại phần ống, không gọi máy chủ.
- **Máy yếu**: hoạt cảnh chỉ bằng CSS (không canvas, không ảnh, không thư viện); dưới 3 khối nên không giật.
- **Đổi tab giữa hoạt cảnh**: quay lại thấy trạng thái cuối, không chạy lại từ đầu.
- **Ion, chỉ số**: dùng bộ hiển thị công thức hiện có (ChemText + CO₃²⁻ đã sửa 13/10).

## 6. Chi phí máy chủ

- **0 lượt đọc/ghi D1 thêm**: khối nằm trong cùng JSON câu trả lời đang ghi sổ. Mốc `tests/toc-do-mo-hoi-thay-1310.test.ts` giữ nguyên (mở 5/2, đang làm 4/2, gửi 3/3).
- Gemini: vẫn 1 lượt gọi (gọi kép + trạm như cũ), mô hình giữ **gemini-3.1-flash-lite**. Câu trả lời dài thêm khoảng 150–300 token khi có khối.
- Máy em: khối và CSS mới nằm trong mảnh tải chậm của hộp Hỏi Thầy ⇒ **byte mở 3 app không tăng** (đo bằng `npm run kiem:toc-do`).
- Đáp án không xuống máy em trước khi nộp (mục 5).

## 7. Nghiệm thu đo bằng máy

- `tests/hoi-thay-khoi-cau-truc-1410.test.ts`: làm sạch từng loại khối, loại `hien` lạ, ≤ 3 khối, đang làm thì không có `dapSo` và không lộ phương án, `chuPhang` có chữ khối.
- `tests/hoi-thay-khoi-giao-dien-1410.test.tsx`: vẽ đủ 6 loại khối; `**`, `==`, `++đúng++`, `!!sai!!` ra đúng thẻ; nhóm chức tự gắn nhãn; câu trả lời cũ không có `khoi` vẫn vẽ như trước; nút "Làm lại" có nhãn đọc màn hình.
- Test cũ xanh: `tests/hoi-thay-tra-loi-giao-dien-1310.test.tsx`, `tests/hoi-them-thay-1310.test.ts`, `tests/hoi-thay-goi-kep-1310.test.ts`, `tests/toc-do-mo-hoi-thay-1310.test.ts`.
- `npm run build && npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 vi phạm · `npm run check:mau` sạch.
- Ảnh Chromium sau build (cùng 3 khổ, sáng/tối): 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px. Bản vẽ này đã đạt: `SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ`.

## Giả định đã dùng (thầy sửa một dòng là xong)

- Màu hoá chất lấy gần đúng từ biến màu sẵn có của app (luật màu 05/10: không thêm màu ngoài bảng). Quỳ xanh, bạc, trắng, tím iodine, vàng men nhìn đúng; nếu thầy muốn màu thật hơn (ví dụ xanh lam Cu(OH)₂) thì cần thêm biến màu mới.
- Thầy tự quyết khi nào dùng khối; câu hỏi ngắn kiểu "đáp án là gì" vẫn trả lời gọn, không vẽ.
- Thí nghiệm chỉ vẽ hiện tượng trong ống nghiệm (đổi màu, kết tủa, gương bạc, sủi bọt, mất màu), không vẽ dụng cụ phức tạp.
