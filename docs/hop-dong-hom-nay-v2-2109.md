# HỢP ĐỒNG — MÀN "HÔM NAY" CỦA THẦY, BẢN 2 · máy chủ ↔ app thầy (Code 4) ↔ app học sinh + phụ huynh (Code 2)

Người viết: Code 3 (máy chủ), 21/09/2026. Đề bài: `prompt-hom-nay-gv-v2.md`. Mã: `server/src/gv-hom-nay-v2.ts` (6 lệnh thầy) + `server/src/canh-bao-thay.ts` (phía em/phụ huynh). Migration chỉ-thêm: `server/migration-2109-canh-bao-thay.sql`. Chưa đẩy Worker khi Boss chưa soát.
**Hình dạng dưới đây là CHỐT** (Code 4 chốt phía thầy, Code 2 chốt phía em/phụ huynh; Code 3 khớp). Trường có dấu `?` là tuỳ chọn: thiếu thì app ẩn, KHÔNG bịa.

## 0 · Nguyên tắc chung
- 6 lệnh `/gv/*` là **lệnh THẦY** (mã bí mật, sau cổng `laThay`). Năm lệnh ĐỌC (không ghi một byte), MỘT lệnh GHI (`/gv/canh-bao-nop-bai`). Mọi lệnh trả `{ok, error?, soTruyVan}` (đo truy vấn ≤ 12, test khoá; app bỏ qua `soTruyVan`).
- Mọi con số truy được về dữ liệu thật; chỗ chưa có dữ liệu trả vắng khoá / mảng rỗng và app ghi "chưa có". Máy chủ KHÔNG bịa. Không kết luận năng lực từ điểm; không chữ "nắm chắc".
- Ngày `YYYY-MM-DD` giờ Việt Nam; mọi mốc giờ trả ISO UTC (app đổi sang giờ VN dạng 24 giờ `HH:mm`).
- Chỉ THẦY bấm mới gửi cảnh báo. Bộ não A.I KHÔNG tự gửi (test khoá: không có đường nào ngoài `/gv/canh-bao-nop-bai` ghi bảng `canh_bao_thay`).
- Bậc dạng: `bac` = `'biet' | 'hieu' | 'van_dung'` (bậc 0/1/2 của `nam_kt_dang`). Xu hướng: `xuHuong` = `'tang' | 'giam' | 'giu'` (tỉ lệ đúng 7 ngày qua so với 7 ngày trước: ≥ +15 điểm % = `tang`, ≤ −15 = `giam`, còn lại `giu`; dưới 2 câu mỗi kỳ ⇒ vắng khoá).

## 1 · `POST /gv/chua-nop {ngay?, lop?}` (đọc) — ô "Chưa nộp bài tập về nhà"
Bài ĐANG CHẠY: chưa xoá, đã giao tới hết `ngay`, còn ít nhất một em chưa nộp, hạn chưa quá 3 ngày. `lop` (nếu có) chỉ giữ em thuộc lớp ấy.
```
{ ok, ngay, bai: [{ maBtvn, maCa, maDe, lop, caNhan: boolean, giaoLuc, hanNop, tong, daNop, chuaNop, quaHan: boolean,
   em: [{ sbd, hoTen, lop,
          trangThai: 'chua_mo' | 'do_chang' | 'qua_han',
          nhan: "Chưa mở bài" | "Dở chặng 2 trong 7" | "Xong 3/5 lô" | "Quá hạn 1 ngày",   // chữ THẬT máy chủ dựng từ số liệu
          chang?: { daXong, tong },                                                        // bài cá nhân hoá
          soNgayQuaHan: number,                                                            // 0 khi chưa quá hạn
          canhBao?: { id, luc: ISO, emDaXem: boolean, phuHuynhDaXem: boolean } }] }] }
```
Xếp: bài hạn gần nhất trước; em: quá hạn (nhiều ngày trước) → chưa mở → dở dang, rồi theo SBD. `trangThai` chỉ nói việc đã xảy ra: chưa mở = chưa có tiến độ nào; dở dang = có tiến độ nhưng chưa nộp. (Ô Việc gấp của app thầy hiện nay đọc `/btvn/theo-doi` sẵn có; lệnh này là bản gộp có trạng thái cảnh báo.)

## 2 · `POST /gv/canh-bao-nop-bai {maBtvn, dsSbd[], loiNhan?}` (GHI) — nút "Gửi cảnh báo" / "Cảnh báo cả N em"
`dsSbd` ≤ 60/lượt. Với MỖI em hợp lệ (thuộc bài, chưa nộp, chưa thu hồi, chưa có cảnh báo của bài này TRONG NGÀY): tạo MỘT dòng `canh_bao_thay` (khoá `cb:<maBtvn>:<sbd>:<ngày VN>` ⇒ **trần MỘT cảnh báo/em/bài/ngày** bằng khoá chính), MỘT thông báo cho em ở `student_notice` (`target:'canh_bao_btvn'`, đi kênh push sẵn có nếu em đã bật; đây chỉ là đường đẩy phụ, app KHÔNG cần đọc nó) và lời cho phụ huynh (hiện ở app phụ huynh, mục 4). Ra:
```
{ ok, daGui: number, boQua: [{ sbd, lyDo: 'da_nop'|'khong_thuoc_bai'|'da_canh_bao_hom_nay'|'thu_hoi'|'bai_qua_han_nhieu_ngay' }], luc: ISO }
```
- `loiNhan` (tuỳ chọn, ≤ 200 ký tự, thầy sửa trước khi gửi) thay LỜI CHO EM; vắng ⇒ lời mặc định tế nhị dựng từ sự thật ("Thầy nhắc: em chưa nộp Bài tập về nhà, hạn 23:59 hôm nay. Em mở bài và làm phần còn lại nhé."). Lời cho phụ huynh LUÔN do máy chủ dựng theo quy tắc viết cho phụ huynh (xưng Thầy/anh chị, nói đúng trạng thái + hạn, không so với bạn, không doạ, không gạch ngang dài, không emoji).
- Nhật ký: mọi cảnh báo lưu ở `canh_bao_thay` (gồm trạng thái lúc gửi, `gui_luc`, `em_xem_luc`, `ph_xem_luc`); `/gv/chua-nop` và `/gv/em-toan-canh` đọc lại để hiện "Đã cảnh báo 20:15 · em đã xem ✓/chưa · phụ huynh đã xem ✓/chưa".

## 3 · Phía HỌC SINH (Code 2)
- `POST /hs/ke-hoach-ngay` thêm khoá `canhBaoThay` (≤ 3, mới nhất trước), CHỈ khi có cảnh báo gửi trong 48 giờ qua mà bài của em CHƯA nộp. Vắng ⇒ KHÔNG có khoá (phản hồi y hệt cũ):
```
canhBaoThay: [{ id, maBtvn, tenBtvn, guiLuc: ISO, hanNop: ISO, loi,          // loi = lời cho EM (≤ 400 ký tự), không bao giờ lời phụ huynh
                trangThaiEm: 'chua_mo' | 'do_chang' | 'qua_han', chang?: { hienTai, tong }, daXem: boolean }]
```
- `POST /hs/canh-bao/xem {token, id}` (chỉ token học sinh): ghi `em_xem_luc` (lần đầu) + `student_notice.read_at`; chỉ cảnh báo của CHÍNH em. Ra `{ok}`. Em bấm "Làm ngay" cũng gọi lệnh này.

## 4 · Phía PHỤ HUYNH (Code 2)
- `POST /ph/ke-hoach {pass}` thêm CÙNG khoá `canhBaoThay` (≤ 3; gửi trong 72 giờ qua, bài của con chưa nộp), CHỈ của đúng con (SBD từ token). `loi` = LỜI CHO PHỤ HUYNH. Vắng ⇒ không có khoá. Chưa có kênh đẩy riêng cho phụ huynh: thông báo nằm trong app phụ huynh khi phụ huynh mở app.
- `POST /ph/canh-bao/xem {pass, id}`: ghi `ph_xem_luc`. Ra `{ok}`.

## 5 · `POST /gv/can-giup {ngay?, lop?}` (đọc) — ô "Em cần thầy giúp hôm nay"
```
{ ok, tong,                                                        // tổng số em cần giúp (trước khi cắt)
  lop: [tên lớp],                                                  // các lớp có em cần giúp, cho bộ lọc
  ds: [{ sbd, hoTen, lop,
         lyDo: 'tre_nhip' | 'tut_bac' | 'dang_yeu',               // lý do CHÍNH (ưu tiên: trễ nhịp > tụt bậc > dạng yếu)
         ngayTre?: number,                                         // số ngày trễ nhịp (trừ ngày nghỉ)
         dang: [{ ma, ten, sai, gap, bac, xuHuong? }] }] }         // CHI TIẾT DẠNG yếu của em (≤ 4): sai x / gặp y câu, bậc hiện tại
```
Tiêu chí (một nguồn với `hom-nay-thay.ts`): trễ nhịp ≥ 3 ngày · tụt bậc ≥ 3 câu trong 3 ngày · có dạng yếu (`dangYeu` của hồ sơ). Xếp: nhiều lý do trước; ds ≤ 60.

## 6 · `POST /gv/vinh-danh-ngay {ngay?}` (đọc) — ô "Vinh danh hôm nay"
```
{ ok, ngay,
  chamNhat?:   { sbd, hoTen, lop, exp },                              // EXP hôm nay cao nhất
  tienBoNhat?: { sbd, hoTen, lop, soDangLenBac, soCauDungLai },       // số dạng lên bậc; số câu sai trước đây nay làm đúng lại (7 ngày)
  benBiNhat?:  { sbd, hoTen, lop, chuoiNgay },                        // chuỗi ngày liên tiếp dài nhất
  diemCao?:    { sbd, hoTen, lop, diem, tenCa } }                     // điểm cao nhất ca gần nhất trong ngày
```
Mỗi bục CHỈ có khi có số > 0; không có dữ liệu ⇒ khoá vắng (app thu gọn một dòng, không bịa).

## 7 · `POST /gv/tim-em {q}` (đọc) — ô tra cứu
`{ ok, ds: [{ sbd, hoTen, lop }] }` ≤ 10. Gõ không dấu cũng ra ("nguyen van an", "NGUYEN", "121"); ưu tiên SBD trùng/đứng đầu, rồi tên bắt đầu bằng, rồi có chứa.

## 8 · `POST /gv/em-toan-canh {sbd, truoc?, loai?}` (đọc) — TOÀN CẢNH MỘT EM
```
{ ok,
  em: { sbd, hoTen, lop, namSinh?, thanThu?: { ten, cap }, chuoiNgay, hoatDongCuoi?: { luc, viec }, phuHuynhXemCuoi?: ISO,
        diemCaGanNhat?, expHomNay?, expTong? },
  dong: [{ luc: ISO, loai: 'ca'|'btvn'|'on_lai'|'bai_rieng'|'len_bang'|'game'|'exp'|'bo_nao'|'canh_bao'|'mo_app', tieuDe, chiTiet: object,
           chips: [{ chu, muc: 'tot'|'sai'|'trung' }] }],             // mới nhất trước, ≤ 30/trang
  conNua?: string,                                                    // truyền lại làm `truoc` để lấy trang sau (ISO của sự kiện cuối trang)
  dang: [{ ma, ten, bac, gap, sai, khacPhuc, xuHuong?, cauSaiGanNhat?: { stt, emChon, dapAn } }],
  nhip30: [{ ngay, muc: 0|1|2|3 }] }                                  // đủ 30 ngày, ngày không làm = 0; mức theo số câu làm trong ngày
```
`truoc` (ISO) = lấy sự kiện CŨ HƠN mốc này; `loai` (mảng) lọc loại. Nguồn: `luot`+`chi_tiet_cau` (loại `ca`), `btvn_em`+`btvn_em_cau`+`su_kien_hoc` (BTVN: bài nào, chặng nào, câu nào đúng/sai), `su_kien_hoc` (ôn lại, bài riêng), `len_bang`, `exp_so`, `ai_dieu_chinh` (lời Bộ não A.I đã nhắn em/phụ huynh, kèm nhãn chạy thử/thật), `canh_bao_thay`. **Loại `mo_app`** (lần mở app từng em) CHƯA có nguồn (bảng hiện diện chỉ theo phiên, không theo em): máy chủ KHÔNG trả loại này cho tới khi có nguồn thật; app ẩn bộ lọc đó khi không thấy.
