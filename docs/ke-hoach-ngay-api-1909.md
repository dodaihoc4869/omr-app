# API kế hoạch ngày — cho phần Giao diện nối adapter

Nguồn: Coder 1 (GĐ 2 cá nhân hoá), Worker `eb987ca7`, 19/09/2026. 0.Planer đã gọi thử: sống.

## Gọi

- `POST https://omr.ttadodaihoc.workers.dev/hs/ke-hoach-ngay`, header `content-type: application/json`, KHÔNG cần mã bí mật.
- Body `{"sbd":"<sbd>"}` (như `/hs/btvn`) HOẶC `{"token":"<token game/HS>"}` (token từ `/hs/dang-nhap`; có token thì SBD lấy từ chữ ký — ưu tiên dùng token khi có).
- Đặt phút học/ngày: `POST /hs/thoi-gian-hoc {"token":"…","phut":10..45}` → `{ok, phut}`.
- Máy chủ TÍNH LẠI mỗi lần gọi (~14 truy vấn). Gọi lại sau khi em xong một việc là thấy việc kế tiếp. Lỗi/mất mạng: giữ bản cuối + hiện "kế hoạch lúc <capNhatLuc>".

## Ý nghĩa trường

- `viec[]` đã sắp EDF, `thuTu` 1..n. KHÔNG sắp lại ở giao diện.
- `batBuoc=true`: bài thầy/mẹ giao (không giảm). `hien=false`: CHƯA hiện (còn việc bắt buộc trước nó) → vẽ mờ 38% + "Mở sau khi xong: <việc có id = cong>". `khan=true` / `nhan='khan_cap'`: luôn hiện.
- `nhan`: `khan_cap` | `bu` (tự phân thêm cho đủ tối thiểu) | `tuy_chon` (còn dư ngân sách) | (bắt buộc thường).
- `loai` ∈ `btvn_lo` | `btvn_nop` | `mom` | `on_lai` | `than_thu` | `on_thi`.
- `chiTiet.qid` chỉ là mã câu (không có đáp án/nội dung). Việc thần thú: `chiTiet.dang` là mã dạng thật, `soCau` bội 6. Việc `btvn_lo`: `chiTiet {ma, chiSo, tongLo, treNhip, taiKhac, taiMoiNgay, conLai, soLo}`.
- **`on_thi` MANG CÂU (thêm 21/09):** `chiTiet: { maCa, tenCa, batDau, qid: string[] }`, `soCau === qid.length` (≤ 4). Câu lấy từ HỒ SƠ của em (từng sai, còn `moi_sai`/`dang_on`, không `can_day_lai`), lệnh lấy đề PHỤC VỤ ĐƯỢC (không đề bảo vệ, có trong chỉ mục), không trùng hàng ôn `on_lai` hôm nay và không trùng bài Mom đang giao; câu MỚI SAI đứng trước. Không có câu nào thì KHÔNG có việc `on_thi` (không giao việc rỗng); chỉ có khi lớp em có ca thi bắt đầu trong 3 ngày tới. LÀM và NỘP bằng ĐÚNG luồng của `on_lai`: `POST /hs/cau-theo-qid {token, qid}` lấy đề, `POST /hs/on-lai/nop {token, traLoi}` nộp (sổ ghi `nguon:'on_lai'`). Không có lệnh `/hs/on-thi/*` riêng.
- `hanCung`/`hanMem`: ISO, `null` với việc mềm.
- `canhBao[].loai` ∈ `khong_kip` | `qua_tai` | `thieu_nguon_bu` | `chua_do_toc_do` — có `noiDung` tiếng Việt sẵn để in, kèm số.
- **Bài Mom/daily CHƯA bắt đầu** (thêm 19/09): vào `viec[]` với `loai:'mom'`, `batBuoc:true`, `hanCung:null` (120 phút chỉ tính từ lúc bắt đầu), `hanMem:null`, `khan:false`, `nhan:null`, `chiTiet:{id, chuaBatDau:true, taoLuc}`; xếp SAU mọi việc có hạn cứng, TRƯỚC việc mềm (bài giao trước đứng trước). CHỈ khi bài được giao trong **3 ngày VN gần nhất** (gồm hôm nay) và **tối đa 3 bài** (mới nhất trước) — hằng số `MOM_CHUA_BAT_DAU_SO_NGAY = 3`, `MOM_CHUA_BAT_DAU_TOI_DA = 3` ở `server/src/ho-so-cau-hinh.ts`. Bài ĐÃ bắt đầu (đồng hồ 120 phút đang chạy) luôn vào `viec[]` như cũ, không giới hạn, `khan:true`. `daily_` của ngày cũ chưa bắt đầu không có ở đâu cả. Bài bắt đầu quá 120 phút chưa nộp chỉ ở `quaHan[]`.
- **`tonCu[]` + `tonCuTong`** (thêm 19/09, 0.Planer): các bài Mom CHƯA bắt đầu còn lại (giao quá 3 ngày, hoặc vượt 3 bài). `tonCu`: `[{ id, loai:'mom', soCau, giaoLuc }]`, MỚI NHẤT TRƯỚC; `tonCuTong: { soBai, soCau }` (luôn có, `0/0` khi không có tồn). Đứng riêng như `quaHan[]`: KHÔNG tính vào `tai.cung`, KHÔNG gây `canhBao.qua_tai`, KHÔNG tham gia cổng (`hien`/`cong`), không ảnh hưởng ngân sách ngày. Em vẫn mở làm được bài từ danh sách này (vẽ thành mục "Bài tồn cũ", đừng vẽ như việc hôm nay). Chống trùng: chỉ qid của bài Mom nằm trong `viec[]` mới bị loại khỏi việc `on_lai`; bài trong `tonCu` KHÔNG chặn câu ôn.
- `quaHan[]`: liệt kê riêng, không tính vào tải. `sapToi[]`: lô chưa tới nhịp — KHÔNG hiện như việc hôm nay.
- `nganSach`: `mucTieuCau`, `toiThieuCau`, `phutNgay`, `phutNgayLaMacDinh`, `vanTocGiay`, `vanTocNguon` (`do` | `mac_dinh`), `ghiChuVanToc` (in nguyên văn khi chưa đo), `soMauGiay`, `trangThaiTai`.
- `tienBo`: `daLamCau`, `lenBac`, `tutBac`, `dat` (đã làm ≥ `toiThieuCau`), `conThieu`, `soCauToiHan`, `treNhip`. Nộp ≠ nắm: chỉ nói "đã làm N câu, M câu lên bậc", CẤM "nắm chắc".
- `chuoiDat`: số ngày đạt liên tiếp (chỉ có nghĩa sau cron 00:01 ngày 20/09). `lanNghi`: hôm nay là ngày nghỉ.
- `thanThu` (thêm 19/09, sửa lỗi "luôn Hoả Long cấp 1"): thần thú THẬT của em, đọc TƯƠI mỗi lần gọi từ `game_v2_profile`, KHÔNG nằm trong bản ghi `ke_hoach_ngay`. Dạng `{ "pet": string, "cap": 1..120, "nickname": string | null }`. `null` khi em chưa có hồ sơ game HOẶC chưa chọn thần thú (cờ `choice`): lúc đó KHÔNG vẽ con mặc định nào, vẽ trạng thái "chưa chọn". `pet` là mã thần thú của game v2 (vd `hoa_long`, `thuy_long`, `dat_quy`); `nickname` đã cắt khoảng trắng, rỗng thì `null`. Client cũ đọc `/hs/than-thu` (bảng V1) là nguồn sai, bỏ dùng cho trang chủ.

## Ánh xạ sang 4 bậc của Bảng nhiệm vụ

| Bậc giao diện | Điều kiện |
|---|---|
| KHẨN (errorContainer) | `khan === true` hoặc `nhan === 'khan_cap'` |
| BẮT BUỘC HÔM NAY (primaryContainer) | `batBuoc === true` và không khẩn |
| NÊN LÀM (secondaryContainer) | `nhan === 'bu'` |
| TUỲ CHỌN (tertiaryContainer) | `nhan === 'tuy_chon'` |

Thẻ "Làm ngay" = việc đầu tiên có `hien === true` và `trangThai === 'cho'`. `viec` rỗng + `canhBao thieu_nguon_bu` là THẬT (49/260 em hôm 19/09) → vẽ trạng thái trống, không vẽ việc giả.

## Mẫu thật (đã che sbd; em đã làm 2 câu hôm nay)

```json
{"ok":true,"phienBan":1,"seed":2434563451,"sbd":"***","ngay":"2026-09-19","nganSach":{"mucTieuCau":8,"toiThieuCau":4,"phutNgay":20,"phutNgayLaMacDinh":true,"vanTocGiay":45,"vanTocNguon":"do","ghiChuVanToc":"","soMauGiay":14,"trangThaiTai":"go_no_giam_tai","dieuChinh":[]},"viec":[{"id":"on_lai:2026-09-19","loai":"on_lai","soCau":2,"nguon":"ho_so","ghiChu":"Ôn 2 câu đã tới hạn nhắc lại","chiTiet":{"qid":["DH-12-C1-B1-P1-II-28","12-C1-B1-D3-I-27"]},"thuTu":1,"hanCung":null,"hanMem":null,"batBuoc":false,"khan":false,"cong":null,"hien":true,"nhan":"bu","trangThai":"cho"},{"id":"than_thu:CARBOHYDRATE.UNG_DUNG.CHON_PHAT_BIEU","loai":"than_thu","soCau":6,"nguon":"ho_so","ghiChu":"Luyện dạng còn yếu với thần thú","chiTiet":{"dang":"CARBOHYDRATE.UNG_DUNG.CHON_PHAT_BIEU"},"thuTu":2,"hanCung":null,"hanMem":null,"batBuoc":false,"khan":false,"cong":"on_lai:2026-09-19","hien":true,"nhan":"tuy_chon","trangThai":"cho"}],"canhBao":[],"quaHan":[],"sapToi":[],"tai":{"cung":0,"bu":2,"tuyChon":6,"nganSach":8,"vuot":0},"tienBo":{"daLamCau":2,"lenBac":1,"tutBac":0,"dat":false,"toiThieuCau":4,"conThieu":2,"soCauToiHan":23,"treNhip":false},"chuoiDat":0,"lanNghi":false,"capNhatLuc":"2026-09-19T05:54:48.236Z"}
```

Ví dụ đủ mọi loại việc (kể cả `btvn_lo`, `mom`): xem `tests/ke-hoach-ngay-1909.test.ts`.

## `POST /hs/cau-theo-qid` — nội dung câu để em LÀM đúng các câu việc `on_lai` đã chọn

- Gọi như `/hs/ke-hoach-ngay`: `POST https://omr.ttadodaihoc.workers.dev/hs/cau-theo-qid`, KHÔNG cần mã bí mật. Body `{ "sbd": "<sbd>" | "token": "<token HS>", "qid": ["…", …] }`, tối đa **20** qid mỗi lần (quá thì `ok:false`). Có `token` thì SBD lấy từ chữ ký và `sbd` trong body bị bỏ qua. Lấy `qid` từ `viec[].chiTiet.qid` của việc `on_lai`.
- Trả `{ ok: true, cau: [...], khongCo: [...] }`. `cau` theo ĐÚNG thứ tự xin (đã bỏ rỗng/trùng). `khongCo` = qid xin mà không trả được — GỘP mọi lý do (em chưa từng gặp câu đó, kho không có, đề đang bảo vệ) để không cho dò kho; vẽ "chưa mở được câu này" chứ đừng đoán lý do.
- Chỉ trả câu em ĐÃ TỪNG GẶP (có dòng trong sổ `su_kien_hoc`); kế hoạch hôm nay chỉ chọn qid từ hồ sơ dựng từ chính sổ đó nên đủ dùng. Câu thuộc đề thi CHƯA công bố bị loại kể cả khi em đã gặp; không kiểm được phạm vi đề bảo vệ thì `ok:false` (đóng cửa).
- **Hình dạng một câu** (KHÔNG có đáp án, lời giải, `reviewed`, `version`, `group`; ảnh của lời giải `sau_loi_giai` bị bỏ): `{ qid, maDe, phan: 'I'|'II'|'III', text, choices: string[], ideas: string[], table?, thanCauImg?, imageDataUrl?, choiceImgs?, ideaImgs?, hinhAnh: [{viTri, …}], dang: string|null, tenDang, mucDo: 'biet'|'hieu'|'van_dung'|null, sao: 0|1|2|null, kienThuc: string[] }`. Phần I dùng `choices`, Phần II dùng `ideas` (4 ý đúng/sai), Phần III trả số. Đây là hình dạng câu của game v2 (`publicQuestion`), KHÔNG phải nguyên tờ kho như lệnh rút câu khắc phục cũ (`cauKhacPhuc` trả cả `dap_an`/`loiGiai` — cố ý không bắt chước).
- Đáp án chỉ về SAU khi nộp, ở đường chấm của máy chủ (như luật hiện có). Chấm/ghi sổ các câu này là việc của GĐ 3 (máy em gửi đáp án lên); lệnh này chỉ đưa ĐỀ.
- Chi phí: 3 truy vấn D1 (em có thật + đã gặp; nội dung từ chỉ mục game; kiểm đề bảo vệ, có cache), không đọc R2.

## Làm câu ôn: lấy câu → nộp → gọi lại `/hs/ke-hoach-ngay`

Vòng đầy đủ của việc `on_lai`: (1) `POST /hs/cau-theo-qid` lấy ĐỀ (không đáp án) → (2) em làm → (3) `POST /hs/on-lai/nop` nộp, máy chủ chấm và ghi sổ, trả đáp án → (4) gọi lại `/hs/ke-hoach-ngay` để thấy câu đã lên bậc, mốc ôn dời, `tienBo` mới. KHÔNG còn dùng luồng luyện câu sai cũ (kết quả ở localStorage, không về máy chủ) cho việc `on_lai`.

### `POST /hs/on-lai/nop`

- **BẮT BUỘC token học sinh** (như Mom nộp bài): `{ "token": "<token HS>", "traLoi": [ { "qid": "…", "dapAn": "B", "giay": 42 }, … ] }`, tối đa **20** mục. SBD trần (không token) và token phụ huynh bị từ chối; `sbd` trong body bị bỏ qua (không nộp hộ em khác). `dapAn`: Phần I đúng một chữ `A`–`D`; Phần II đủ **4 ký tự** `Đ`/`S` (có dấu hay không đều được); Phần III số (dấu phẩy hay dấu chấm đều được). `giay` tuỳ chọn, hợp lệ 5..1200 thì ghi (làm tròn), ngoài khoảng thì bỏ.
- Chỉ nhận qid mà `/hs/cau-theo-qid` trả được cho CHÍNH em đó (đã từng gặp, không thuộc đề thi đang bảo vệ); qid khác vào `khongCo` và KHÔNG được ghi. Đúng một tập với lệnh lấy đề.
- Máy chủ CHẤM (`isAnswerCorrect`, cùng luật chấm của sổ) và ghi sổ `su_kien_hoc` `nguon='on_lai'`, `ma_nguon='on_lai:<ngày VN>'`. **Nộp lại cùng câu cùng ngày giữ kết quả LẦN ĐẦU** (không cho sửa đáp án sau khi đã thấy lời giải; phản hồi lần hai vẫn ra kết quả lần đầu). Sau đó hồ sơ được dựng lại theo luật Leitner (mốc 1/3/7 ngày; đúng cùng ngày chỉ tính một mốc).
- **CHƯA LÀM thì KHÔNG nộp được** (luật 0.Planer chốt 19/09; cùng luật "điền đủ" của game v2): mục có `dapAn` rỗng, chỉ toàn `-`, thiếu ý ở Phần II (không đủ 4 ý), hoặc sai định dạng (Phần I ngoài `A`–`D`) là CHƯA TRẢ LỜI: KHÔNG ghi sổ, KHÔNG khoá, KHÔNG đáp án/lời giải, và nằm trong **`chuaLam: [qid, …]`** của phản hồi. Giao diện GIỮ câu đó lại cho em làm tiếp trong ngày; nộp lại sau vẫn được chấm như lần đầu. Chỉ câu ĐÃ TRẢ LỜI mới được chấm, ghi sổ, khoá lần đầu và nhận lời giải. Lý do: đường này để ÔN, không phải bài thi có giờ — muốn xem đáp án thì phải trả lời; trả lời bừa thì bị tính sai, hạ bậc, mai gặp lại. Vì vậy `ketQua[i].dung` luôn là `true|false` (không còn `null`).
- **Phản hồi** `{ ok: true, ketQua: [...], khongCo: [...], chuaLam: [...], tienBo, exp }`. `ketQua[i]` = `{ qid, dung: true|false, dapAnDung, loiGiai, anhLoiGiai: [{viTri:'sau_loi_giai', …}] }` (`loiGiai` có thể là chữ hoặc đối tượng như kho, `null` nếu kho chưa có). `chuaLam`: qid nhận được nhưng chưa trả lời (xem trên). `khongCo`: qid không nhận (chưa từng gặp / kho không có / đề đang bảo vệ). `tienBo` = `{ daLamCau, lenBac, tutBac }` của HÔM NAY sau lượt nộp (`null` nếu không tính được). `exp` = EXP học tập vừa cộng (0 nếu em chưa có hồ sơ game, đã nhận rồi, hoặc hết trần 100/ngày).
- **ĐÁP ÁN VÀ LỜI GIẢI CHỈ ĐI RA SAU KHI ĐÃ GHI SỔ THÀNH CÔNG.** Ghi không được → `{ ok:false, error }` và không có đáp án nào trong phản hồi; em nộp lại được (idempotent). `ok:false` khác: `traLoi` không phải mảng, quá 20 mục, token sai, không kiểm được đề bảo vệ.
- **EXP**: chưa bật EXP mới cho em → đường cũ `creditAcademic` (khoá `practice:<qid>`, 2 EXP/câu ĐÚNG, mỗi câu một lần cả đời, trần 100/ngày), `exp` là số EXP cộng lần này và KHÔNG có `expNhan`. ĐÃ bật (xem mục "EXP học tập mới" ở dưới) → `exp` = tổng EXP của các khoản vừa ghi, kèm `expNhan[]` và `manhNhan[]`. Chỉ cộng vào hồ sơ game khi em đã có hồ sơ; lỗi EXP không làm hỏng lượt nộp.
- Chi phí: ≈ 3 truy vấn lấy câu + 1 ghi sổ + 1 đọc lại + dựng lại hồ sơ + 1 truy vấn tiến bộ (+ EXP nếu có câu đúng).

## EXP học tập mới + mảnh khiên (đặc tả thầy chốt: `DE-XUAT-EXP-MANH-KHIEN-1909.md`)

**Cờ.** Chỉ chạy với em được bật (`cau_hinh.exp_moi`); chưa bật thì MỌI phản hồi dưới đây KHÔNG có các trường mới (giao diện: thấy thiếu `exp` thì ẩn hết phần EXP, không bịa số). Mọi EXP do máy chủ tính từ sổ, KHÔNG có EXP nào do máy em khai.

### `POST /hs/ke-hoach-ngay` (đã bật) — thêm trường
```
exp: {
  homNay: 22,                                   // tổng EXP học tập đã ghi hôm nay (gộp mọi khoản, không gồm cộng vào cấp)
  chiTietHomNay: [{ loai, exp, ghiChu, soKhoan }],   // gộp theo loại; ghiChu là tiếng Việt sẵn in, kèm số
  manhKhien: { manh: 1, moiKhien: 12, khienRen: 0, khienConLai: 0, choCongVaoHoSo: false },
  datNgay: { dat, thieu: [...], daLam, toiThieu, daTrao, laNghi } | null
},
expNhan:  [{ loai, exp, ghiChu }],   // khoản MỚI ghi trong CHÍNH lần gọi này (gọi lại thì []) — để bật thông báo "+EXP"
manhNhan: [{ loai, so, ghiChu }]     // mảnh khiên mới trong lần gọi này
```
- `loai` của khoản EXP: `cau` (câu đúng), `lo` (xong lô BTVN), `btvn` (nộp bài đúng hạn), `mom` (xong bài Mẹ giao), `len_bac` (câu ôn lên bậc), `khac_phuc`, `len_bang`, `diem_ca` (ca thi đã công bố), `dat_ngay`, `chuoi`, `tiepsuc` (game Đoàn Hộ Tống). `loai` của mảnh: `dat`, `chuoi7`, `dang`.
- `manhKhien.manh` = mảnh đang giữ (0..11, kẹp 24); `moiKhien` = 12 mảnh rèn 1 khiên (tự rèn khi đủ); `khienRen` = khiên RÈN chưa dùng (tối đa 5); `khienConLai` = khiên còn dùng được (quà tiến hoá + rèn − đã dùng, đúng số `shield-use` chấp nhận). `choCongVaoHoSo: true` = còn mảnh trong sổ chưa cộng vào hồ sơ game (em chưa có hồ sơ game).
- **`exp.datNgay`** (để màn không nói "đã đủ" khi EXP đạt ngày chưa về): `dat` = đủ điều kiện đạt nhiệm vụ ngày theo ĐỊNH NGHĨA CHỐT NGÀY (chặt hơn `tienBo.dat`); `thieu` ⊂ `['cau_toi_thieu','tre_nhip','chua_len_bac']` = còn thiếu gì (`cau_toi_thieu`: chưa đủ `toiThieu` câu; `tre_nhip`: còn việc bắt buộc trễ nhịp; `chua_len_bac`: còn câu tới hạn ôn mà chưa lên bậc câu nào); `daTrao` = đã trao +20/chuỗi/mảnh; `laNghi` = ngày nghỉ (không đạt, không thiếu gì). `null` = chưa có kế hoạch ngày đã lưu. Ngày phát hành chỉ tính việc làm SAU mốc.
- Bảng EXP câu đúng (Phần × số sao): I 2/3/5 · II 3/5/8 · III 4/6/10; cùng một câu chỉ một lần mỗi ngày; sau `2 × mucTieuCau` câu-được-thưởng trong ngày chỉ nhận 25% (làm tròn lên, tối thiểu 1). Thưởng việc: xong lô đúng nhịp +10 / trễ +4, nộp cả bài BTVN đúng hạn +15, bài Mẹ giao xong +10, câu ôn lên bậc +6, khắc phục xong +30, lên bảng đạt/chưa đạt +15/+5, điểm ca thi ×3, đạt ngày +20, chuỗi 2×min(chuỗi,10), tiếp sức +3 (≤ 5 lần/ngày). Mảnh: đạt ngày +1, chuỗi bội 7 +3, một dạng rời danh sách yếu +2. Nguồn `game` KHÔNG nhận EXP câu (game giữ 20/40/40 theo mastery).
- Nộp trống KHÔNG được thưởng (lô/bài Mẹ giao toàn bỏ trống, câu chưa trả lời). Ca thi CHƯA công bố: không có EXP câu/lên bậc nào (tránh lộ đúng sai); khi công bố thì trao bù đúng một lần, `ghiChu` ghi "Ca … vừa công bố".

### Các lệnh nộp đính thêm `expNhan` + `manhNhan` (chỉ khi đã bật)
`POST /hs/on-lai/nop` (kèm `exp` = tổng EXP vừa ghi), `POST /btvn/nop` (không có khi là lần gửi lại y hệt: phản hồi `daNhan:true` như cũ), `POST /btvn/xong-lo` (chỉ khi có `dapAn` → có ghi sổ), lệnh nộp khắc phục (`nopKhacPhuc`), Mom `submit` (ở gốc phản hồi, cạnh `item`), luyện đề `submit`. Hiển thị "EXP vừa nhận" = in nguyên `ghiChu` từng khoản. Khoản của lên bảng / ca thi công bố / đạt ngày chốt bằng cron không đi theo lệnh nộp của em: chúng hiện ở `expNhan` của lần `/hs/ke-hoach-ngay` kế tiếp.

