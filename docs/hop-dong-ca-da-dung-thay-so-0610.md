# Hợp đồng — Ca "Kiểm chứng câu đã đúng": câu đã đúng được THAY (thầy 06/10)

Thầy 06/10: *"Tôi muốn mở ca thi chọn câu đúng được thay bằng câu thay số của câu đúng đó (ghi rõ câu này thay số của câu em đã đúng ở…). Các câu lý thuyết thì bạn xử lý theo cách thay thế câu lý thuyết và cũng ghi rõ nhé."*

Giả định đã dùng (thầy không nói khác thì làm theo đây): "ca thi chọn câu đúng" = chế độ đề **Kiểm chứng câu đã đúng** (`pham_vi_hoi_lai = 'da_dung'`, PR #133); "cách thay thế câu lý thuyết" = **câu anh em** của thang làm lại câu sai (cùng dạng, cùng phần, cùng mức hoặc kề, KHÁC nhóm nội dung, đúng khối, em chưa gặp — `DE-XUAT-LAM-LAI-CAU-SAI-0510.md` bậc 2).

## 1. Luật thay (mỗi câu em đã đúng trong bộ câu)

| Loại câu | Thay bằng | Nhãn trên máy em (nguyên văn, cả câu) |
|---|---|---|
| **Tính toán** Phần I / III có song sinh dùng được | **Song sinh** `<gốc>~ss<i>` (`cau_bo_tro`) — ưu tiên bản em CHƯA làm | `Câu này thay số của câu em đã đúng ở <nơi · dd/mm · mức>` |
| **Tính toán** chưa có song sinh, dạng có bộ sinh, khối em = khối câu | **Biến thể bằng mã** `<gốc>~bt<k>` (`bien-the-sinh.ts`, đáp án tính bằng mã) | như trên |
| **Lý thuyết** (nhãn kho `ly_thuyet` hoặc `dangCua` = lý thuyết) · **Phần II** · tính toán chưa có bản đổi số | **Câu anh em** (`cau-anh-em.ts` `chonAnhEmChoCaDaDung`) | lý thuyết: `Câu lý thuyết này thay cho câu em đã đúng ở <nhãn> (cùng dạng bài, nội dung khác)` · còn lại: `Câu này thay cho câu em đã đúng ở <nhãn> (cùng dạng bài, nội dung khác)` |
| Không tìm được bản thay (hết câu chưa gặp, máy chủ cũ, công tắc tắt, nội dung không có ở máy thầy…) | **Giữ nguyên** câu em đã đúng | `Em đã làm đúng: <nơi · dd/mm · mức>` (như trước) |
| Câu **bù** (em chưa đúng câu ấy) | không thay | không nhãn (như trước) |

Câu lý thuyết KHÔNG BAO GIỜ thay số. Câu thay không trùng câu nào khác trong đề của em. Câu tự luận không bao giờ vào (như mọi kênh rút tự động).

## 2. Lệnh máy chủ — `POST /ca/cau-thay-so` (thầy, mã bí mật; `server/src/cau-thay-so.ts`)

Vào: `{ sbd: [≤ 2 em], seed: <mã ca>, ngay?: 'YYYY-MM-DD', cau: { <sbd>: [{ qid, phan, mucDo, dang, lyThuyet, bu }] } }` — `cau` là bộ câu ĐÃ rút của em (`bu` = câu bù: không thay, chỉ để khỏi chọn trùng).

Ra: `{ ok, bat, em: { <sbd>: { <qid câu em đã đúng>: { cach: 'ss'|'bt'|'ae', kieu: 'thay_so'|'cung_dang', id, phan, mucDo, dang, maDe?, cau? } } }, dem: { ss, bt, ae, giu }, loi: [sbd] }`.
- `cau` (chỉ `ss`/`bt`) = câu đổi số **CÓ ĐÁP ÁN** — chỉ về máy thầy để nối vào kho ca (như câu song sinh của `/ca/loi-den-han`); `ae` chỉ có `id` + `maDe` (nội dung lấy trong kho máy thầy).
- Vắng khỏi `em[<sbd>]` ⇒ không có bản thay ⇒ máy thầy giữ nguyên câu. Lỗi một em ⇒ `loi` chứa em đó, các em khác vẫn trả.
- Tất định theo (mã ca, em, câu) + sổ học của em. **Chỉ đọc** (không ghi D1/R2).
- Công tắc `cau_hinh.da_dung_thay_so`: vắng = BẬT; `{"bat":false}` ⇒ `bat:false` (máy thầy rút nguyên văn như trước). Tắt nhanh: `INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('da_dung_thay_so','{"bat":false}',datetime('now'))` (đệm 15 giây).

## 3. Máy thầy (`src/lib/de-rieng-da-dung.ts`)

`chayThuRutDeDaDung` (Xem trước phân bổ) và `chotRutDeDaDung` (Bắt đầu): rút như trước (`rutDeDaDung`) → gọi `/ca/cau-thay-so` theo lô 2 em, 3 lô song song → `apThayVaoKetQua` (đổi qid trong bộ câu, nhãn, đếm đúng/sai cũ đi theo qid mới) → câu thay có nội dung dùng được vào `cauNgoai` → lúc chốt nối vào kho ca (`noiKhoCa` + kho đáp án) như câu ngoài kho đã có.
Mọi lỗi (máy chủ cũ 404, mạng, công tắc tắt, em lỗi đọc, nội dung câu thay thiếu / lệch id / lệch phần, nối kho hỏng) ⇒ **giữ nguyên câu em đã đúng**, ca không bị chặn, và nói ra: bảng Xem trước phân bổ (khối `thay-cau-da-dung`) + cảnh báo lúc Bắt đầu + `bienBan.daDung.thay` (`trangThai`, `thaySo`, `cungDang`, `lyThuyet`, `giuNguyen`, `emGiuNguyen`, `khongDung`, `emLoi`, `cungDangTheoEm`).

## 4. Em vào MUỘN (sau khi chốt) — `lapBoDaDungChoEmVaoMuon`

Máy chủ không nối được câu mới vào kho ca ⇒ chỉ thay bằng câu đổi số **đã nằm sẵn trong kho ca** (máy thầy nối cho em khác cùng câu gốc; `khoTuNguon` nhận `~ss`/`~bt` là `songSinhCua`); ưu tiên bản em chưa làm; câu lý thuyết không thay số. Không có ⇒ nguyên văn. Em vào muộn không bao giờ bị chặn.

## 5. Máy em / gói đề

Không khoá mới trong gói đề: nhãn câu thay là **cả câu** nằm trong `daDung[<sbd>][<qid>]` (qid = qid câu thay). Máy em mới in nguyên văn nếu nhãn bắt đầu bằng `Câu … này thay số của / thay cho câu em đã đúng` (`laNhanThay`); máy em đang cache bản cũ vẫn in được (thành `Em đã làm đúng: Câu này thay số của …` — dài nhưng đủ nghĩa, không mất nhãn). `daDungCuaEm` giữ nhãn tới 260 ký tự.

## 6. Báo cáo cuối bài (thầy)

"Sai lại câu đã làm đúng" tính cả câu thay (qid câu thay nằm trong `daDung`); dòng nhãn: câu thay in nhãn thay (đã nói nơi), câu nguyên văn `đã làm đúng: <nơi>`.

## 7. Kiểm
`tests/che-do-da-dung-thay-so-0610.test.ts` (lõi thuần + máy chủ trên D1 thật: song sinh, biến thể, câu anh em, luật khối, công tắc, em vào muộn) · `tests/che-do-da-dung-thay-so-0610-man.test.tsx` (máy thầy, dự phòng, bảng, báo cáo, nhãn trên màn thi). Thử đột biến 9 luật trong phiên 06/10: đều có test bắt.

## 8. Đo thật trên D1 (06/10, chỉ đọc, chỉ đếm — `scripts/do-phu-thay-so-0610.ts`, workflow `do-phu-thay-so-0610`, run 37471402499)
12 em mẫu (có mặt trong chiến dịch còn hiệu lực, rải đều theo số báo danh), mỗi em rút bộ 28 câu từ câu em ĐÃ ĐÚNG rồi hỏi đúng hàm máy chủ `cauThayDaDung`: tổng **335 câu** →
**thay số 99 (29,6 %: song sinh 97 · biến thể 2) · thay bằng câu cùng dạng 229 (68,4 %) · giữ nguyên 7 (2,1 %)**.
Theo loại (câu lý thuyết là ƯỚC LƯỢNG bằng `dangCua` trên JSON kho game — máy thầy dùng nhãn kho `kieu` nên có thể lệch): lý thuyết 211 câu → cùng dạng 210, giữ nguyên 1 · tính toán 124 câu → thay số 99 (80 %), cùng dạng 19, giữ nguyên 6.
Theo phần: Phần I 215 (thay số 34 · cùng dạng 180 · giữ 1) · Phần II 48 (cùng dạng 46 · giữ 2) · Phần III 72 (thay số 65 · cùng dạng 3 · giữ 4).
**Tải**: mỗi em trung vị **143** truy vấn D1, lớn nhất **249** (qua API REST: 30,9 giây trung vị, 52,6 lớn nhất — độ trễ REST ~0,2 giây/truy vấn; trong Worker với D1 gắn trực tiếp nhanh hơn nhiều) ⇒ lượt gọi tối đa **2 em** (≈ 500 truy vấn, dưới trần 1000 của một lần chạy Worker; 4 em có thể chạm 996).
Độ phủ "thay số" thấp ở Phần I vì đa số câu Phần I em đã đúng là câu lý thuyết (không đổi số được) — đúng ý thầy: lý thuyết thay theo cách thay câu lý thuyết.
