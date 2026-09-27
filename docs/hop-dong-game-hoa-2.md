# Hợp đồng API — Game Hóa 2.0 (27/09/2026)

Bên cung cấp: máy chủ (`server/src/srs2-*.ts`). Lõi thuật toán: `server/src/srs2-loi.ts`. Bản vẽ đã chốt: `docs/ban-ve-game-hoa-2-2709/*.dc.html` (canvas https://claude.ai/artifact/Defd4pkQJz3hTvsY6ZQEzE).

Công tắc: `cau_hinh.game_hoa_2` = `{"bat":true}` (cả trung tâm) · `{"bat":true,"lop":["12A1"]}` · `{"bat":true,"sbd":["…"]}`. **Tắt ⇒ mọi lệnh cũ chạy như cũ**; lệnh `hoa2-*` trả `{ok:true, cheDo2:false}`.

Ngày = ngày giờ Việt Nam `YYYY-MM-DD`. Hạn nộp hết lúc 23:59 ngày `hanNop`. `D` = số ngày còn lại tính cả hôm nay.

## A. Học sinh — qua `POST /game-v2/<lệnh>` (xác thực như mọi lệnh game: `token`)

### `hoa2-sanh` → dữ liệu màn Sảnh bản đồ
```jsonc
{ "ok": true, "cheDo2": true, "ngay": "2026-09-30",
  "chienDich": { "id": "…", "ten": "Ester – Lipid", "hanNop": "2026-10-04", "D": 5, "tong": 120, "coXat": 67, "thanhThao": 0, "canDayLai": 0,
                 "thanhThaoTangTu": "2026-10-02" },          // null nếu không có chiến dịch; thanhThaoTangTu null khi đã có câu thành thạo
  "theLuc": { "con": 32, "tong": 40 },                       // Thể lực = câu còn lại của kế hoạch HÔM NAY (chốt lần mở đầu ngày)
  "huyetChien": false,
  "doan": { "con": 4 },                                       // câu ôn còn lại ở Đoàn = số "ổ phục kích"
  "dao":  { "con": 28 },
  "khoaDao": true, "loiKhoaDao": "Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!",
  "ruong": { "daLam": 8, "tong": 40, "moDuoc": false, "daMo": false, "qua": { "vang": 20 } } }
```
Em chưa chọn thần thú (sau reset): `{ ok:true, cheDo2:true, canChonThu:true }` → hiện màn chọn thần thú có sẵn.
Ca kiểm tra đang mở: dùng lệnh sẵn có `POST /hs/ca-dang-mo` (dải "Vào thi" chỉ hiện khi có ca).

### `start` (mode `adventure`, Đảo) → một chuyến thám hiểm ≤ 6 ải
```jsonc
{ "ok": true, "id": "<phiên>", "questions": [ { ...câu công khai (không correct/solution), "vai": "moi" | "on_lai" | "trum",
      "goiY": { "gach": ["A","D"] } | { "cotLoi": "…" } /* chỉ khi em đủ điều kiện gợi ý M3 */ } ],
  "theLuc": {...}, "dao": {"con": n}, "doan": {"con": n} }
```
Khoá: `{ ok:true, questions:[], lyDo:"khoa_cho_doan", khoaDao:true, message:"Có xe hàng đang bị phục kích, …" }`.
Hết kế hoạch: `{ questions:[], lyDo:"xong_ke_hoach", het:true, message }`. Câu đang bảo vệ cho ca kiểm tra: `lyDo:"cau_dang_bao_ve"`.

### `answer` — như cũ (`session`, `qid`, `answer`). Phản hồi thêm `traLoi` (đáp án em gửi). Câu có `goiY` được máy chủ ghi là "có trợ giúp": đúng không tính Thành thạo.

### Đoàn Hộ Tống — các lệnh `doan-*` như cũ. Ở chế độ 2.0: chặng chỉ chở câu ôn của kế hoạch, **miễn vé**; `doan.cau` có thêm `goiY` (như trên) khi đủ điều kiện. Hết câu ôn ⇒ `taoNguoi` báo "Em đã phá hết ổ phục kích hôm nay. Cầu sang Bát Linh Đảo đã hạ…".

### `hoa2-cau-da-lam` → danh sách câu em ĐÃ làm (mọi chiến dịch)
```jsonc
{ "ok": true, "chienDich": [ { "id", "ten", "hanNop", "tong" } ],
  "cau": [ { "qid", "chienDichId", "stt": 17, "phan": "I", "mucDo": "VD", "tenDang",
             "trangThai": "dang_on" | "thanh_thao" | "can_day_lai", "lanCuoiDung": false, "henOn": "2026-10-05",
             "lichSu": [ { "ngay": "2026-09-29", "dung": false, "coGoiY": false } ] } ] }
```
Bộ lọc màn hình: Tất cả · Sai lần gần nhất (`lanCuoiDung === false`) · Đang ôn · Thành thạo · Cần thầy dạy lại.

### `hoa2-cau-chi-tiet` (`qid` hoặc `qids` ≤ 60) → đề + đáp án + lời giải, CHỈ câu em đã làm
```jsonc
{ "ok": true, "cau": [ { "de": <Question công khai, giữ hình sau lời giải>, "dapAn": "B", "loiGiai": <solution thô của kho>, "emTraLoi": "C" | null } ] }
```
Hiển thị lời giải: **bắt buộc dùng khối LỜI GIẢI chuẩn của `TheCau`** (chế độ `xem_lai`, `chuanHoaLoiGiaiCau`) — LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓ ✗ (Phần III: bước + kết quả). Tải PDF: dựng phiếu bằng `html-phieu.ts` rồi `window.print()`.

### `hoa2-ruong-mo` → mở Rương Bát Linh (xong trọn kế hoạch hôm nay, mỗi ngày 1 lần)
`{ ok:true, qua:{ vang:20 }, lapLai:false }` · chưa đủ: `{ ok:false, ma:"chua_du", loi:"Em làm xong 40/40 câu hôm nay thì rương mở…" }`. Vàng dùng ở Cửa hàng phụ kiện; không phải EXP.

## B. Giáo viên — `POST /gv/chien-dich` (sau cổng mã thầy), `action`:

| action | vào | ra |
|---|---|---|
| `co-doc` | — | `{ co: { bat, lop[], sbd[] } }` |
| `co-luu` | `bat`, `lop[]`, `sbd[]` | `{ co }` |
| `danh-sach` | — | `{ homNay, chienDich: [ { id, ten, lop, maDe[], hanNop, theLucNgay, huyetChien, maCa, taoLuc, trangThai, soCau, soEm, hetHan } ] }` |
| `suc-chua` | `lop` hoặc `sbd[]`, `maDe[]`, `hanNop`, `theLucNgay?` | `{ soCau, soEm, D, sucChua, khoiLuongTrungVi, tiLe, muc: xanh/vang/do, soEmQuaTai, goiY: { rutCon: {soCau, tiLe} \| null, luiHan: {hanNop, tiLe} \| null } \| null }` |
| `tao` | như `suc-chua` + `ten`, `huyetChien?`, `maCa?`, `rutCon?` | `{ id, soCau, soEm }` (câu tự luận, câu chưa duyệt tự bỏ) |
| `dong` / `huy` | `id` | `{ ok }` |
| `bang` | `id` | `{ chienDich, homNay, hetHan, lop: { coXat, thanhThao, huyetChien, canDayLaiCau, canDayLaiLuot }, dang[], em: [ { sbd, ten, coXat, thanhThao, canDayLai, treNhip, huyetChien, theoDang: { <dạng>: tỉ lệ 0–1 \| null } } ], canDayLai: [ { qid, stt, dang, soEm } ] }` |
| `buoi-chua` | `id`, `coMat[]?` | `{ chienDich, hetHan, soEm, lop: { coXat, thanhThao }, cau: [ { qid, stt, dang, phan, mucDo, soChuaThanhThao, soCanDayLai, diemChua, giaiMau: {sbd, ten} \| null, emSua: [ {sbd, ten} ] } ] }` — mỗi dạng 1 câu, giảm dần theo điểm chữa = chưa thành thạo + 2 × cần dạy lại |
| `chua-xong` | `id`, `qids[]?` | `{ soLuot, ngayOnLai }` — câu cần dạy lại về Đoàn Hộ Tống từ hôm sau |

Lỗi: `{ ok:false, error:"<tiếng Việt>" }`.
