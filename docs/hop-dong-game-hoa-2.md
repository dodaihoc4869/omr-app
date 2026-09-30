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
`{ ok:true, qua:{ vang:20 }, lapLai:false }` · chưa đủ: `{ ok:false, ma:"chua_du", loi:"Em làm xong 40/40 câu hôm nay thì rương mở…", error:<cùng lời với loi> }` (28/09: thêm `error` cho lớp gọi game-v2 chung đọc được; client đọc `error` rồi `loi`). Vàng dùng ở Cửa hàng phụ kiện; không phải EXP.

## B. Giáo viên — `POST /gv/chien-dich` (sau cổng mã thầy), `action`:

| action | vào | ra |
|---|---|---|
| `co-doc` | — | `{ co: { bat, lop[], sbd[] } }` |
| `co-luu` | `bat`, `lop[]`, `sbd[]` | `{ co }` |
| `danh-sach` | — | `{ homNay, chienDich: [ { id, ten, lop, maDe[], hanNop, theLucNgay, huyetChien, maCa, taoLuc, trangThai, soCau, soEm, hetHan } ] }` |
| `suc-chua` | `lop` hoặc `sbd[]`, `maDe[]`, `hanNop`, `theLucNgay?` | `{ soCau, soEm, D, sucChua, khoiLuongTrungVi, tiLe, muc: xanh/vang/do, soEmQuaTai, goiY: { rutCon: {soCau, tiLe} \| null, luiHan: {hanNop, tiLe} \| null } \| null }` |
| `tao` | như `suc-chua` + `ten`, `huyetChien?`, `maCa?`, `rutCon?` | `{ id, soCau, soEm }` (câu tự luận, câu chưa duyệt tự bỏ) |
| `dong` / `huy` | `id` | `{ ok }` |
| `rai-deu` (30/09) | `id`, `bat` (mặc định `true`) | `{ ok, id, raiDeu }` — CÔNG TẮC RẢI ĐỀU CÂU MỚI THEO NGÀY trên chiến dịch đang chạy: chỉ ghi cờ vào bảng phụ `chien_dich_tuy_chon` (chỉ-thêm, tạo lúc chạy) + xoá đệm; KHÔNG đụng `srs2_ke_hoach` ⇒ kế hoạch đã chốt hôm nay giữ nguyên, hiệu lực từ kế hoạch ngày kế tiếp. Không có dòng ⇒ BẬT (chiến dịch cũ đang chạy cũng bật). `id` không có ⇒ `ok:false`. |
| `bang` | `id` | `{ chienDich, homNay, hetHan, lop: { coXat, thanhThao, huyetChien, canDayLaiCau, canDayLaiLuot }, dang[], em: [ { sbd, ten, coXat, thanhThao, canDayLai, treNhip, huyetChien, theoDang: { <dạng>: tỉ lệ 0–1 \| null }, hangTheoDang: { <dạng>: "L1"\|"L2"\|"L3"\|"L4" } } ], canDayLai: [ { qid, stt, dang, soEm } ] }` |
| `buoi-chua` | `id`, `coMat[]?` | `{ chienDich, hetHan, soEm, lop: { coXat, thanhThao }, cau: [ { qid, stt, dang, phan, mucDo, soChuaThanhThao, soCanDayLai, diemChua, giaiMau: {sbd, ten} \| null, emSua: [ {sbd, ten} ] } ] }` — mỗi dạng 1 câu, giảm dần theo điểm chữa = chưa thành thạo + 2 × cần dạy lại |
| `chua-xong` | `id`, `qids[]?` | `{ soLuot, ngayOnLai }` — câu cần dạy lại về Đoàn Hộ Tống từ hôm sau |

Lỗi: `{ ok:false, error:"<tiếng Việt>" }`.

## C. Bốc câu mới cá nhân hoá (thầy chốt 28/09) — lõi `srs2-loi.ts`

- **Hạng theo dạng** (`tinhHangTheoDang`, `gopThongKeDang`): p = (đúng + 2)/(gặp + 4); gặp/đúng = `nam_kt_dang` của em (đúng = `so_gap − so_sai`, bỏ dòng `CD:…`) + lần làm câu chiến dịch đang chạy TỪ LÚC GIAO, bỏ lượt có gợi ý, chỉ lượt sau `cap_nhat_luc` của dạng (không đếm đôi). p < 0,40 → L1 (Yếu); < 0,65 → L2 (Trung bình); ≤ 0,85 → L3 (Khá); > 0,85 → L4 (Giỏi). Dạng chưa có dữ liệu ⇒ p gộp mọi dạng; em không có gì ⇒ L2. Lịch sử CHỈ để xếp hạng, không sinh câu ôn. Tính lại mỗi lần lập kế hoạch (kế hoạch chốt đầu ngày ⇒ cập nhật mỗi sáng).
- **Số câu mới/ngày giữ nguyên** (quota = ⌈câu mới còn / (D − 3)⌉). `TuyChonKeHoach.hangTheoDang`/`hangChung` (chỉ-thêm; vắng ⇒ y hệt cũ). Chia quota cho 3 nhóm (L1+L2 · L3 · L4) theo tỉ lệ câu mới còn lại (`bocCauMoiCaNhan`):
  - L1, L2: dễ trước (Nhận biết → Vận dụng cao, như cũ).
  - L3 — bậc thang (`chiaBacThang`): số câu mức m ∝ N_m·max(0, 1 + t(μ − m)), μ = mức trung bình phần còn lại, t = min(0,6; 0,3(K − 2)), K = số ngày giao câu mới còn lại. Kho 24/62/84, 5 × 34 ⇒ 9/15/10 · 7/15/12 · 4/12/18 · 2/10/22 · 2/10/22.
  - L4 — vừa sức trước: mức cao nhất của nhóm trong chiến dịch trước, giữ round(quota/6) câu mức ngay dưới làm khởi động. Kho trên ⇒ 28 VD + 6 TH (ngày 1–3) · 34 TH · 10 TH + 24 NB.
  - Mọi câu mới giao hết trước ngày D − 3 (ép chín giữ nguyên). Mức câu: NB/Nhận biết/biet = 0 … VDC/Vận dụng cao/van_dung_cao = 3.
- **Thứ tự trong ngày**: có nhóm L3/L4 ⇒ rải đều các mức (mỗi chuyến 6 câu có câu dễ và câu khó). **Trong chuyến Đảo** (`xepChuyenDao`): câu ôn Đúng–sai trước; câu mới dễ → khó ⇒ ải 1–2 dễ nhất, ải 6 (`vai:"trum"`) khó nhất.
- `chan-doan-em` trả thêm `hangTheoDang`, `hangChung`.

## Rải đều câu mới theo ngày (thầy chốt 30/09/2026)

- Trường `raiDeu` (boolean) trả kèm ở `danh-sach`, `bang.chienDich`, `/gv/chien-dich/sua doc`, `chan-doan-em.chienDichDangChay`; nhận ở `tao` và `suc-chua` (vắng ⇒ `true`).
- (phản biện vòng 2 #110) `raiDeuMacDinh` (boolean) kèm ở `danh-sach`, `bang.chienDich`, `chan-doan-em.chienDichDangChay`: `true` = chưa có dòng `chien_dich_tuy_chon` (chiến dịch giao trước khi có công tắc, máy tự bật) ⇒ màn thầy hiện "Rải đều câu mới: Bật (mặc định)". `tao` nay LUÔN ghi dòng (bật hoặc tắt).
- BẬT: số câu MỚI mỗi ngày dừng đúng quota = ceil(số câu mới còn / (D − 3)); KHÔNG đổ thêm câu mới cho đủ số lượt mỗi ngày; lượt dư dùng cho nợ / củng cố / duy trì (≤ 20 %); đã xếp ĐỦ quota câu mới hôm nay (kể cả ngày ôn D ≤ 3) mà còn lượt ⇒ nợ tới lịch lấp nốt (vượt trần 50 %, phản biện vòng 2 #110 — đúng chữ màn Giao "lượt dư trong ngày dùng để ôn"), hết nợ thì thôi — ngày ngắn hơn là bình thường (Rương theo `tong` của ngày). D ≤ 3 vẫn đổ hết câu mới. Quá tải hôm nay (trần gấp đôi) chỉ nới nợ/ôn.
- TẮT: y hệt trước 30/09 (đổ câu mới cho đầy số lượt).
- `suc-chua` thêm `raiDeu` + `cauMoiMoiNgay` = ceil(câu mới của em giữa lớp / (D − 3)), D ≤ 3 ⇒ toàn bộ câu mới (chỉ để hiện; `tiLe/muc/sucChua` không đổi). Màn thầy: D ≤ 3 ⇒ "câu mới giao ngay từ ngày đầu"; `cauMoiMoiNgay` > lượt/ngày ⇒ cảnh báo dồn cuối (cả D ≤ 3); `cauMoiMoiNgay` > lượt/ngày − ⌊lượt/ngày ÷ 2⌋ ⇒ cảnh báo "khi em còn nợ" (nợ xếp trước, tối đa nửa số lượt); dòng "Dự kiến" không sớm hơn ngày D − 3.
- Đổi công tắc trên chiến dịch đang chạy: em đã mở app hôm nay (kế hoạch đã chốt) ⇒ áp dụng từ ngày mai; em chưa mở ⇒ kế hoạch lập lúc em mở theo cờ mới.
- Lập lại kế hoạch giữa ngày (đổi chiến dịch / câu ôn sai luật): quota hôm nay trừ số câu mới đã làm (`TuyChonKeHoach.moiDaLamHomNay`), không cộng dồn. Câu không phục vụ được KHÔNG lập lại cả ngày (xem dưới).

## Câu không phục vụ được trong kế hoạch đã chốt (sửa lỗi 30/09 "Chưa tải được câu hôm nay", rương kẹt 48/49)

- `MetaCau.tuLuan` (một chỗ dùng chung, `docMetaCau`): ĐÚNG `laCauTuLuan` như lúc phát câu, chạy trên câu của chỉ mục đã bỏ ảnh/lời giải (ảnh phương án/ý = cờ 0/1 tính ĐÚNG `CO_ANH`, chỉ khi giá trị là mảng; khoá ưu tiên như `lay`: `choiceImgs`→`anhLuaChon`, `hinh`→`hinhAnh`; hình kèm = `{viTri, src}` theo `src ?? url ?? data`) — phản biện #108 + vòng 2 #110 (khoá bằng tests/d1-runtime-meta-tu-luan-3009.test.ts trên workerd). Câu tự luận không vào `hoSo.cau` ⇒ không vào kế hoạch, không đếm thể lực/rương/trần Bi-a. Dòng JSON hỏng hoặc không mang đúng `qid`/`version` ⇒ coi như đã rút khỏi kho.
- Kế hoạch đã chốt còn câu tự luận / rút khỏi kho ⇒ CHỈ THAY đúng các câu ấy tại chỗ (`thayCauHong`): câu mới thay bằng câu mới chưa có trong kế hoạch, câu ôn thay bằng câu ôn tới lịch (Đảo: ôn Đúng–sai; Đoàn: ôn phần I/III); phần còn lại, thứ tự và `huyet_chien` đã chốt giữ nguyên, KHÔNG dùng cờ rải đều hiện tại (kế hoạch đã chốt hôm nay không đổi); câu/nhóm đang bảo vệ cho ca KHÔNG được lấy làm câu thay. Ngày cuối (đến hạn): phần bổ sung "làm lại câu sai trong ngày" chỉ đếm câu còn phục vụ được (câu hỏng không thay được không chặn bổ sung). Không có câu thay ⇒ không ghi DB, `tamHoan.tuLuan/kho` bỏ câu khỏi `tong` trong bộ nhớ. Mọi lần ghi kế hoạch giữa ngày chỉ ghi khi bản ghi còn đúng bản đã đọc (so `dao_json`/`doan_json`), máy khác vừa ghi ⇒ dùng bản của máy ấy.
- App phụ huynh (`/ph/hoc-2`) đọc kế hoạch đã chốt qua `tamHoanCauKhoa` (chỉ đọc) ⇒ cùng con số với Sảnh/rương của con.
- Lượt Đảo/Đoàn rỗng: ca ⇒ `cau_dang_bao_ve`; bàn Bi-a ⇒ `cau_dang_o_bia`; toàn bộ câu còn lại tự luận / mất khỏi kho ⇒ `xong_ke_hoach` / `xong_on_hom_nay` (không lộ lý do); câu vắng khi nạp mà meta còn, hoặc D1 ném khi nạp lô ⇒ `chua_nap_duoc` (lỗi tạm) + một dòng `nhat_ky_may` nguồn `nap_cau_game` (câu chung cho thầy) + `console.error` `[nap-cau-game]` có SBD và `mãĐề|qid` (≤ 20 câu, không tên em) để Boss tra bằng `wrangler tail`.

