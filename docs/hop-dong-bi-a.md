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
