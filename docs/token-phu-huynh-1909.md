# Token phụ huynh, giai đoạn MỀM — hợp đồng cho cổng phụ huynh (Code 4) và app giáo viên (Code 1)

Người viết: Code 3 (máy chủ). Mã: `server/src/ph-truy-cap.ts`, `server/src/game-v2-auth.ts` (`parentPass`, `parentIdentity`). Test: `tests/token-ph-1909.test.ts` (17), `tests/token-ph-auth-1909.test.ts` (7). Bảng đếm: `ph_truy_cap` (`server/migration-1909-ph-truy-cap.sql`, chỉ thêm).

## 1. Ý tưởng

Từ trước, phụ huynh vào bằng SBD trần: ai biết SBD của con nhà khác cũng đọc được tiến bộ và giao bài cho em ấy. Giai đoạn MỀM: máy chủ nhận CẢ `pass` (token do thầy cấp) LẪN SBD trần, và đếm mỗi loại được dùng bao nhiêu. Thầy nhìn số đếm rồi TỰ quyết chuyển sang giai đoạn CỨNG (bỏ SBD trần). Không có công tắc nào tự chuyển. Giai đoạn cứng chưa làm.

Quy tắc máy chủ:
- Có `pass` thì DANH TÍNH lấy từ token; `sbd` trong thân bị bỏ qua (token của em A không đọc được em B).
- `pass` sai, hết hạn hoặc bị thu hồi thì báo lỗi, KHÔNG rơi xuống SBD trần.
- `pass` rỗng hoặc chỉ khoảng trắng coi như không có `pass`.

## 2. Liên kết và token

- Thầy cấp bằng lệnh `POST /ph/cap-ma` (mục 4). Mỗi em một liên kết: `https://omr-app-b3u.pages.dev/ph?ph=<pass>` (`pass` đã mã hoá bằng `encodeURIComponent`; `lienKet` trong phản hồi đã dựng sẵn).
- Token HMAC-SHA256, `purpose:"game-parent"`, sống 90 ngày với liên kết do thầy cấp (mã chia sẻ trong game vẫn 30 ngày).
- Gắn mật khẩu của em (`pk` = băm mật khẩu lúc cấp): thầy hoặc em đổi mật khẩu thì MỌI liên kết đã phát của em ấy hết hiệu lực ngay. Em chưa đặt mật khẩu thì token không có `pk`, không thu hồi được bằng đổi mật khẩu (`chuaCoMatKhau:true` trong phản hồi cấp mã).
- Token PH KHÔNG bao giờ là phiên học sinh: các lệnh của em (`/game-v2/*`, `/mom/start|save|submit`, `/hs/*`) từ chối token PH.

## 3. Cổng phụ huynh làm gì

1. Mở app có `?ph=<pass>`: đọc `pass`, lưu vào bộ nhớ máy (khoá gợi ý `omr_ph_pass`), rồi XOÁ `?ph=` khỏi thanh địa chỉ (`history.replaceState`) để `pass` không nằm trong lịch sử/ảnh chụp.
2. Gọi `POST /ph/xac-dinh {pass}` để hiện tên con và lớp. Lỗi thì hiện đúng câu `error` (đã là chữ dành cho phụ huynh) và cho nhập SBD như cũ (giai đoạn mềm).
3. Có `pass` thì mọi lệnh phụ huynh gửi `{pass}` thay vì `{sbd}` (gửi cả hai cũng được, máy chủ bỏ `sbd`). Không đưa `pass` vào địa chỉ của lệnh API, chỉ vào thân JSON.
4. Không có `pass` (phụ huynh cũ) thì vẫn chạy như trước bằng SBD, máy chủ đếm lượt này là `sbd_tran`.

## 4. Lệnh

Mọi phản hồi là JSON, HTTP 200; lỗi nghiệp vụ là `{ok:false, error:"…"}`. Trong lúc reset đang chạy, mọi lệnh trả `{ok:false, dangLamMoi:true}` (xem `docs/moc-reset-1909.md`).

### Đường cũ, nay nhận thêm `pass` (thay cho `sbd`)
- `POST /parent-news/list` và `/parent-news/assign`
- `POST /mom/parent-list` và `/mom/create`

### Đường mới cho phụ huynh (chỉ nhận `pass`, SBD trần bị từ chối: `Cần liên kết riêng của con. Anh/chị nhờ Thầy gửi liên kết.`)

`POST /ph/xac-dinh {pass}` → `{ok:true, sbd, hoTen, lop}`.

`POST /ph/ke-hoach {pass}` → kế hoạch hôm nay của con, khung nhìn cho phụ huynh:
```
{ ok:true, hoTen, lop, ngay:"YYYY-MM-DD", lanNghi:boolean,
  phutMoiNgay:20, phutLaMacDinh:true, phutToiThieu:10, phutToiDa:45,
  mucTieuCau:12, toiThieuCau:6,
  viec:[{ loai:"btvn_lo|btvn_nop|mom|on_lai|than_thu|on_thi", soCau, batBuoc, khan, hanCung:ISO|null, hanMem:ISO|null }],
  quaHan:[{ loai:"btvn|mom", hanNop:ISO, conLai }],
  tienBo:{ daLamCau, lenBac, tutBac, dat, toiThieuCau, conThieu, soCauToiHan, treNhip },
  chuoiDat:number, canhBao:["khong_kip|qua_tai|thieu_nguon_bu|chua_do_toc_do|tang_tam_du"], tonCuTong:{soBai,soCau} }
```
KHÔNG có mã câu, mã bài, mã ca, nội dung câu hỏi hay đáp án, và không có chữ ghi chú của kế hoạch (`ghiChu`, nội dung cảnh báo). Cổng tự soạn chữ từ `loai` theo quy tắc viết cho phụ huynh (xưng "Thầy", câu ≤ 30 chữ, không dấu gạch dài, không emoji).

`POST /ph/thoi-gian-hoc {pass, phut?}` → `{ok:true, phut, laMacDinh, toiThieu:10, toiDa:45}`. Không gửi `phut` thì chỉ đọc. Gửi `phut` ngoài 10 đến 45 thì `{ok:false, error:"Số phút mỗi ngày phải từ 10 đến 45."}` và không đổi gì. Kế hoạch ngày dùng số phút mới ngay lượt lập kế hoạch kế tiếp.

### Lệnh của thầy (đòi mã bí mật, dùng từ app giáo viên hoặc dòng lệnh)

`POST /ph/cap-ma {dsSbd:["S1",…]}` hoặc `{lop:"12A"}` (tối đa 100 em một lượt) → `{ok:true, hanNgay:90, ma:[{sbd, hoTen, lop, pass, lienKet, chuaCoMatKhau}], khongTimThay:[…]}`. Gọi lại thì ra token mới (token cũ vẫn dùng được tới khi hết hạn hoặc đổi mật khẩu).

`POST /ph/dem-truy-cap {ngay?:14}` (tối đa 60) → `{ok:true, tuNgay, denNgay, soNgay, token:{luot,em}, sbdTran:{luot,em}, theoDuong:[{kieu,duong,luot,em}], emChiSbdTran:[{sbd,luot}]}`. `emChiSbdTran` là những em mà phụ huynh CHỈ dùng SBD trần trong kỳ (chưa có liên kết): danh sách để thầy gửi liên kết trước khi quyết giai đoạn cứng. Chưa chạy migration thì `{ok:false, error:"Chưa chạy migration-1909-ph-truy-cap.sql …"}`.

## 5. Bảo mật, giới hạn đã biết

- Token cho quyền XEM tiến bộ và GIAO bài Mẹ cho đúng con ấy, không hơn. Ai có liên kết là có quyền đó: dặn phụ huynh không chuyển tiếp công khai.
- Token cấp trước 21/09 (không có `pk`) vẫn dùng được tới khi hết 30 ngày, không thu hồi được.
- Đường `/mom/create` của phụ huynh vẫn nhận `dsCau` từ máy phụ huynh (như từ trước, không đổi ở giai đoạn mềm). Bài hằng ngày tự sinh trên máy chủ (`/parent-news/assign`) mới là đường nên dùng.
- Đếm truy cập ghi tối đa một dòng mỗi ngày, em, loại, đường (cộng dồn `so`). Đếm lỗi không làm hỏng lệnh chính.
- Bảng `ph_truy_cap` thuộc nhóm GIỮ của reset (số liệu vận hành).

## 6. Việc chưa làm (chờ thầy quyết)

Giai đoạn CỨNG (bỏ SBD trần ở `/parent-news/*`, `/mom/parent-list|create`). Số liệu để quyết: `/ph/dem-truy-cap`. Chuyển sang cứng là đổi một điều kiện trong `sbdCuaPhuHuynh` (bỏ nhánh SBD trần), kèm tin cho mọi phụ huynh còn dùng SBD.
