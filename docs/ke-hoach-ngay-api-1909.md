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
- `hanCung`/`hanMem`: ISO, `null` với việc mềm.
- `canhBao[].loai` ∈ `khong_kip` | `qua_tai` | `thieu_nguon_bu` | `chua_do_toc_do` — có `noiDung` tiếng Việt sẵn để in, kèm số.
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
