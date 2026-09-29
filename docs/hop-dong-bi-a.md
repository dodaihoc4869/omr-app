# Hợp đồng API · Bi-a Phản Ứng (GĐ1, 28/09/2026)

Mã máy chủ: `server/src/bi-a.ts` · máy khách: `src/game/bi-a/api.ts` · đặc tả: `DAC-TA-BI-A-PHAN-UNG-2809.md` (mục 4, 9).
Mọi lệnh đi `POST /game-v2` với `{ token, action, ... }` (máy khách gọi qua `goiHoa2(lenh, token, du)`). Máy chủ KHÔNG chấm riêng: chấm, ghi sổ, Thể lực, EXP, lịch ôn đều qua lệnh `answer` chung.

## Chặn chung (mọi lệnh `bia-*`, xét trước)
| Điều kiện | Trả |
|---|---|
| Game Hóa 2.0 chưa mở cho em, hoặc cờ `cau_hinh.bi_a` tắt / không gồm em | `{ ok:true, bat:false, lyDoKhoa:'chua_bat', message }` |
| Lớp của em có ca kiểm tra đang mở (`quyetDinhVaoThi` trên ca `mo`, không xét phạm vi khối — chặt hơn `/hs/ca-dang-mo`) | `{ ok:true, bat:true, lyDoKhoa:'dang_co_ca', message }` |

Lỗi nghiệp vụ (phiên không tồn tại, quá 2 giờ, đổi câu khi chưa trả lời…) ⇒ `throw` ⇒ `{ ok:false, error }` theo cơ chế sẵn có của `/game-v2`.

## `bia-sanh`
Vào: —. Ra:
```
{ ok, bat:true, ngay, lyDoKhoa?, message?,
  chienDich: { id, ten, hanNop, tong } | null,
  theLuc: { con, tong },            // câu kế hoạch hôm nay còn / tổng
  doan: { con }, dao: { con },
  tran: { con, tong, tranDoan, tranDao, conDoan, conDao },   // trần Bi-a 40% mỗi phần
  giaoHuu: { mo, con, toiDa: 2 } }
```
`lyDoKhoa`: `chua_co_chien_dich` · `xong_ke_hoach` (giaoHuu.mo = true nếu còn lượt) · `het_tran` · `cau_dang_bao_ve`.

## `bia-xep-ban`
Vào: `{ loai: 'ai'|'giao_huu', cheDo: 'don'|'doi', soBi: 7|4|3 }` (sai ⇒ đơn 7 / đôi 4).
Luôn đóng ván Bi-a còn mở của em trước (một em một ván mở).
- Giao hữu (chỉ khi xong kế hoạch, tối đa 2 ván/ngày): `{ ok, van, loai, cheDo, bi:[], chot:null, giaoHuu:{ con, toiDa } }` — không phiên, không câu.
- Ván với A.I: `{ ok, van, session, loai, cheDo, soBi, bi: CauCongKhai[], trong, chot: CauCongKhai|null, tran:{ con, tong }, theLuc, conDoan, conDao }`.
  - `bi` là danh sách câu theo thứ tự; máy khách gán lần lượt cho bi em giữ. `trong` = số bi em giữ không có câu (bi trống). **Khác đặc tả 4.2 mục 8** (đặc tả ghi `[{ki, trong, cau}]`): máy chủ không biết kí hiệu bi, việc gán do máy khách.
  - Câu chốt chọn trước (Vận dụng, ưu tiên câu ôn đang sai), rồi phần Đoàn tới hết trần, rồi phần Đảo.
  - Không có `correct` / `solution` / `answer` (test quét sâu).
- Từ chối: `{ ok:true, lyDo, message }` với `lyDo` ∈ `chua_co_chien_dich` · `xong_ke_hoach` · `het_tran` · `cau_dang_bao_ve` · `giao_huu_chua_mo` · `het_luot_giao_huu`.

Phiên tạo ra: `game_v2_session.json = { mode:'bia', created, hoa2:1, bia:1, van, cheDo, questions: RefPhien[] }`; ref câu chốt `role:'trum'`.

## `answer` (lệnh chung, không đổi)
Vào `{ session, qid, answer, assisted:false }`. Ra như Đảo 2.0: `{ correct, answer, traLoi, solution, solutionImages, reward, expThuThach? }`. Mỗi câu một lần mỗi phiên.

## `bia-doi-cau`
Vào: `{ session, qidCu, chot: boolean }`. **Khác đặc tả 9.1** (đặc tả ghi `{ session, ki }`): máy chủ nhận mã câu cũ + cờ câu chốt, không cần kí hiệu bi.
Điều kiện: câu cũ thuộc phiên và ĐÃ có lượt trả lời (`game_v2_attempt` khoá `session|qidCu`).
Ra: `{ ok, trong:false, cau: CauCongKhai }` (cùng dạng; không có thì câu kế tiếp; câu chốt ⇒ câu Vận dụng kế tiếp) hoặc `{ ok, trong:true }` (hết trần ⇒ bi trống). Câu mới được thêm vào `questions` của phiên.

## `bia-ket-van`
Vào: `{ van, ketQua:{ doiThang: 0|1|null, diem:[n,n], lyDo:'thang'|'thua'|'bo' }, ghe:[{ ghe, doi, ai, dung, sai, an, vang }], soCu }`.
- Số câu đúng/sai của em lấy từ `game_v2_attempt` của phiên (không tin số máy gửi); ghế A.I ghi `sbd = NULL`.
- Đóng phiên (`$.dong = 1`) ⇒ câu chưa trả lời tự về kế hoạch.
Ra: `{ ok, van, dung, sai, theLuc:{ con, tong } }`; gọi lại lần hai ⇒ `{ ok, daGhiTruoc:true }`.

## `hoa2-sanh` (thêm trường)
`bia: { bat:true, con, tong, giaoHuu:{ mo, con }, lyDoKhoa? }` — cờ tắt / lỗi ⇒ `{ bat:false }` (Sảnh không vẽ cửa).

## Giáo viên (`/gv/chien-dich`)
`bia-co-doc` ⇒ `{ co:{ bat, lop[], sbd[] } }` · `bia-co-luu { bat, lop[], sbd[] }` ⇒ ghi `cau_hinh.khoa = 'bi_a'`. Mặc định: TẮT.

## Chống lẫn với Đảo / Đoàn
- `resume` của Đảo bỏ phiên có `$.bia`; `dieuKienLoaiPhien('dao')` loại `$.doan=1 OR $.bia=1`.
- `startDao2` / `startDoan2` chặn câu đang giữ trong ván Bi-a mở (`cauDangGiu` + `DK_PHIEN_BIA_MO`).
- Trần: đã dùng = câu Bi-a đã trả lời hôm nay (theo phần) + câu đang giữ trong ván mở.

## Bảng mới (`server/migration-2809-bi-a.sql`, CHỈ THÊM)
CI deploy không chạy migration ⇒ lệnh `bia-*` (khi cờ bật cho em) tự dựng đủ bảng + chỉ mục bằng `CREATE … IF NOT EXISTS` (`damBaoBangBia`, `SQL_BANG_BIA` = đúng nội dung tệp migration, test khoá). Không cần ai chạy wrangler tay.
`bi_a_van`, `bi_a_ghe` (GĐ1) · `bi_a_diem_ban`, `bi_a_moi`, `bi_a_co_mat` (dựng sẵn cho GĐ2). Reset Game Hóa 2.0 xoá cả 5 bảng; reset toàn app GIỮ.

---

# GĐ2 · Đấu với bạn (28/09/2026)

Máy chủ: `server/src/bi-a.ts` (lệnh sảnh), `server/src/bi-a-phong.ts` (phòng đấu Durable Object `BanBiA`), `server/src/bi-a-ve.ts` (vé ký), lõi trận dùng chung `src/game/bi-a/tran.ts`.
Máy khách: `src/game/bi-a/api.ts`, `ket-noi.ts`, `dieu-khien-mang.ts` (`VanMang`), `BanOnline.tsx`, `PhongCho.tsx`, `BiaGame.tsx`.

## Vé ký (HMAC-SHA256 bằng `MA_BI_MAT`, tiền tố `bi-a|`, không lẫn token game)
| Loại | Ai cấp | Chứa | Dùng |
|---|---|---|---|
| `sanh` | lệnh sảnh (tạo bàn / nhập mã / nhận lời mời) | ván, sbd, tên, chế độ, loại, chủ bàn?, mã | gói `vao` vào phòng (cả lần nối lại) |
| `ghe` | phòng (lúc Bắt đầu) | ván, ghế, sbd, chế độ, loại | `bia-xep-ban { veGhe }` |
| `tran` | `bia-xep-ban` online | ván, ghế, sbd, phiên, câu từng bi `{qid, muc, giay}`, Câu chốt | gói `san_sang` |
| `cau` | `bia-doi-cau` online | ván, sbd, kí hiệu bi, câu mới \| null (bi trống) | gói `doi_cau` |
Phòng không đọc D1 để biết câu của bi: mọi thứ nằm trong vé ⇒ đọc D1 mỗi ván ≤ số câu đã trả lời + 2 (test đo).

## Lệnh sảnh (`POST /game-v2/<lệnh>`, chặn chung như GĐ1)
- `bia-sanh` thêm `online: boolean` (Worker có `BAN_BIA`) và `diemBan: { diem, soVan }` (khởi đầu 1000).
- `bia-tao-ban { cheDo:'don'|'doi', loai:'ban'|'giao_huu' }` ⇒ `{ van, ma (4 chữ số), cheDo, loai, ve }`. Đóng ván mở cũ của em trước.
- `bia-vao-ban { ma }` ⇒ như trên (chỉ bàn đang `cho`, tạo trong 2 giờ). Sai ⇒ lỗi "Không thấy bàn có mã này…".
- `bia-moi { van, den }` (chỉ chủ bàn, bạn cùng lớp có mặt trong 20 giây) ⇒ `{ id }`; mời lại khi lời cũ còn hạn ⇒ trả id cũ.
- `bia-loi-moi { con }` — mỗi 6 giây, CHỈ khi em ở Sảnh Bi-a / phòng chờ (`batVongTrucTiep`, có trong `nhip-bang-2109`): một lô D1 (ghi có mặt + 3 đọc) ⇒ `{ ban:[{sbd, ten, conTran}], moi:[{id, tu, cheDo, loai, conGiay}], phanHoi:[{id, ten, nhan}] }`. Lời mời hết hạn 60 giây.
- `bia-tra-loi-moi { id, nhan }` ⇒ nhận: vé vào bàn như `bia-tao-ban`; từ chối: `{ tuChoi:true }`.
- `bia-xep-ban { veGhe }` (sau khi phòng Bắt đầu) ⇒ `{ van, ghe, session, bi:[{ki, cau}], chot, veTran }` — câu cho ĐÚNG bi của ghế (đơn 7; đôi người 1 của phe 4, người 2 của phe 3 — G11). Bàn giao hữu: `session:null`, mọi `cau:null`.
- `bia-doi-cau { session, qidCu, chot, ki }` ở ván online trả thêm `ve` (vé câu) để máy em đưa phòng.

## Phòng đấu `wss://<máy chủ>/bi-a/phong/<mã ván>` (Durable Object, WebSocket Hibernation)
Máy em → phòng: `vao {ve}` · `ghe {lam:'them_ai'|'bo_ai'|'doi_cho', ghe, ghe2?}` (chủ bàn, phòng chờ đôi) · `bat_dau` (chủ bàn) · `san_sang {ve}` · `cu {dx,dy,v,sx,sy,datBi?}` · `cau_xong {ki,qid,loai:'bi'|'chot'|'giai_truoc'}` · `cau_ai {ghe,ki,loai,dung}` / `giai_truoc_ai {ghe,ki,dung}` (chỉ máy chủ bàn = ghế người nhỏ nhất đang nối) · `doi_cau {ve}` · `nhan {id:1..6}` (2 giây/lần) · `bo_van` · `ping`.
Phòng → máy em: `phong {toi, phong}` · `bat_dau {ghe, veGhe}` · `tt {toi, su, S, chuMay}` (S = trạng thái công khai, không mã câu; `su` = sự kiện vừa áp, `null` = gói đầy đủ khi vào/nối lại) · `nhan {tu,id}` · `loi {ma,chu}` · `pong`.
- Phòng mô phỏng lại MỌI cú bằng cùng bước chuẩn `buocChuan` (máy em vẽ trước y hệt, bi dừng thì khớp trạng thái phòng; `su.bamVa` để đo lệch).
- `cau_xong` chỉ được nhận khi `game_v2_attempt` khoá `phiên|qid` có thật và đúng câu đang chờ của đúng ghế ⇒ gói giả bị từ chối.
- Hẹn giờ bằng `alarm`: 30 (+2) giây một cú, câu = giây của câu + 10, phòng chờ Bắt đầu 90 giây (ghế chưa sẵn sàng ⇒ A.I), rời > 60 giây: đơn ⇒ bạn thắng; đôi ⇒ ghế thành A.I, ván không tính Điểm bàn (G14); bàn quá 2 giờ ⇒ huỷ.
- Còn sống: máy em gửi đúng chuỗi `{"t":"ping"}` mỗi 25 giây; phòng TỰ trả `{"t":"pong"}` (`setWebSocketAutoResponse`, không thức dậy). Phòng thức ít nhất mỗi 35 giây khi có máy nối; kết nối quá 70 giây không ping (mất tín hiệu câm — khoá màn, đổi mạng) ⇒ phòng đóng (mã 4001) và tính rời TỪ PING CUỐI. Máy em quá 60 giây không nhận gói nào ⇒ tự đóng và nối lại. Chạy thật trên workerd: máy câm bị đóng ở giây 70; máy ping đều giữ nguyên 150 giây.
- Kết ván: MỘT lô D1 — `bi_a_van` xong, `bi_a_ghe`, đóng phiên (câu chưa trả lời về kế hoạch), Điểm bàn Elo K = 24 (chỉ bàn `ban`, toàn người, không ghế nào thành A.I).

## Khác đặc tả (ghi lại để đối chiếu)
- Xếp ghế trong phòng chờ (thêm/bỏ A.I, đổi chỗ) đi qua WebSocket của phòng (gói `ghe`), không qua lệnh HTTP riêng.
- Có mặt ở Sảnh: máy em gửi kèm số câu Bi-a còn (`con`) để bạn thấy, không tính lại trên máy chủ mỗi 6 giây.
- Cài đặt Worker: `wrangler.toml` thêm binding `BAN_BIA` + migration DO `bia-v1` (`new_sqlite_classes`). Không có binding ⇒ `online:false`, Sảnh giữ nút "Sắp mở".

## Trả lời câu hỏi (không cần chơi) + Luôn bật Mắt thần — thầy lệnh 29/09
- `POST /game-v2/bia-tra-loi` (token em, qua cổng `bia-*` chung: cờ Bi-a, ca đang mở ⇒ `dang_co_ca`) `{}` ⇒ `{ ok, session, cau: CauCongKhai[] (≤ 10, không Câu chốt, không đáp án), tran:{con,tong}, theLuc }`; hết câu ⇒ `{ ok, lyDo, message }` đúng bảng `LOI_BIA`. Chọn câu bằng CHÍNH `chonCauBan` (kế hoạch hôm nay, trần 40%, `protectedQuestions`, câu đang giữ ở Đảo/Đoàn, không tự luận). Phiên `{mode:'bia', hoa2:1, bia:1, chiCau:1, van:'tl-…'}`; vào lượt mới đóng phiên Bi-a cũ (G8). Không tạo dòng `bi_a_van`.
- Chấm: lệnh `answer` chung (`assisted:true` khi em bấm Hỏi thầy trước khi chốt) ⇒ sổ `su_kien_hoc` nguồn Bi-a, EXP v5 (`expCau`), câu đã trả lời tính vào trần và không lên bàn bi-a hôm đó.
- `bia-tra-loi {dong:true, session}` ⇒ đóng đúng phiên chỉ-trả-lời đó (em rời màn: câu chưa làm về kế hoạch ngay).
- Luôn bật Mắt thần: công tắc theo máy (`localStorage` `bia_luon_mat_than`). Ván A.I: không trừ `matThan`. Phòng đấu: gói `cu` kèm `giuMT:true` (chỉ ghế người đang đánh) ⇒ `apCu` không trừ Mắt thần của ghế đó; luật/điểm/EXP không đổi.
