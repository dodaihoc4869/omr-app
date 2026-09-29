# HỢP ĐỒNG Sổ nợ ↔ Kiểm tra đầu giờ (29/09/2026)

Bên cấp: trợ lý A (Sổ nợ, nhánh `so-no-thuat-toan`). Bên dùng: trợ lý B (thẻ Kiểm tra đầu giờ).
Đặc tả gốc: `docs/DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909.md` (mục A, B4).

## 1. Ghi kết quả chấm — sổ `su_kien_hoc`, nguồn MỚI `dau_gio`

Dùng đúng đường ghi của Lên bảng (`ghiSuKien` trong `server/src/su-kien-hoc.ts`, xem `ghiLenBangMoi` ở `server/src/index.ts`).
`'dau_gio'` đã có trong `NguonSuKien` / `CAC_NGUON`.

```ts
import { ghiSuKien } from './su-kien-hoc'
await ghiSuKien(env, [{
  nguon: 'dau_gio',
  maNguon: '<mã buổi Kiểm tra đầu giờ>',   // cùng buổi ⇒ cùng mã
  sbd, qid,
  lan: 1,                                   // (nguon|maNguon|sbd|qid|lan) là khoá chống ghi đôi
  ketQua: dat ? 1 : 0,                      // Đạt = 1 · Chưa đạt = 0 (KHÔNG ghi null)
  luc: new Date(nowMs).toISOString(),
  chuyenDe, mucDo: '',
}])
```

- Em chưa được chấm (bấm Kết thúc) ⇒ KHÔNG ghi gì.
- Cùng buổi chấm lại cùng câu cùng em: đổi `lan` (2, 3…) thì là lần làm mới; giữ `lan` thì không thêm dòng.

### Máy Sổ nợ đọc thế nào (đã làm ở nhánh này)
| Kết quả | Hệ quả (tính lại từ sổ, `phatLaiCau` ở `server/src/srs2-loi.ts`) |
|---|---|
| `dau_gio` + đúng | **Thành thạo NGAY**, kể cả câu 2 sao. Hẹn ôn duy trì sau 30 ngày (câu 2 sao: 14 ngày); nếu mốc ấy còn trong chiến dịch thì dời sang ngày sau hạn nộp. |
| `dau_gio` + sai | Như mọi lần sai: mất thành thạo, vào sổ nợ, **có trong kế hoạch ngày mai**. Câu KHÔNG thuộc chiến dịch nào vẫn vào nợ (nguồn "sai tại lớp", chỉ câu có trong kho game, không tự luận). |
| Nhãn | Lần làm hiện là "Đầu giờ dd/mm" (nhãn nợ: "Sai 2 lần · Ca 26/09 · Đầu giờ 29/09"). |

## 2. "Thầy đã chữa" — mốc dạy lại

```ts
import { ghiMocDayLai } from './srs2-d1'
await ghiMocDayLai(env, sbd, qid, lucIso /*, chienDichId = null */)
```

- Ghi vào bảng sẵn có `srs2_day_lai` (cùng nút "Chữa xong" của Buổi chữa); bảng thiếu thì tự tạo (chỉ-thêm). `INSERT OR IGNORE`.
- Hệ quả: số lần sai (để cắt tỉa) về 0, câu rời "Cần thầy dạy lại", **quay lại kế hoạch ngày hôm sau**; được ưu tiên "vừa chữa" trong sổ nợ; nhãn thêm "Thầy đã chữa dd/mm".
- THỨ TỰ: ghi sự kiện sổ TRƯỚC, mốc SAU, `luc` mốc ≥ `luc` sự kiện (mốc trước sự kiện thì lần sai đến sau vẫn tính).

## 3. Đọc lịch sử câu (thẻ tên em ⇒ "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn)")

```ts
import { docLichSuCoNguon } from './srs2-d1'
const ls = await docLichSuCoNguon(env, sbd, qids) // Map<qid, { qid, ngay, luc, dung, nguon }[]> | null (lỗi đọc)
// nguon ∈ 'thi' | 'dao' | 'doan' | 'bia' | 'len_bang' | 'dau_gio' | 'khac'; tên hiện: TEN_NGUON_NHAN (srs2-loi.ts)
```
Đã bỏ lần bị che (ca chưa công bố). Trạng thái câu (đúng/thành thạo/nợ) của một em: `docHoSo2(env, sbd, homNay).tt`.

## 4. Không đổi
Không sửa/xoá dữ liệu cũ. Không đổi lược đồ ngoài bảng tạo-lúc-chạy chỉ-thêm.

## 5. Đan xen câu trong ngày (Boss chốt 29/09) — thông tin, B không phải gọi gì
- Chọn câu giữ nguyên (nợ trước, trần 50%, thứ tự ưu tiên); chỉ đổi thứ tự phục vụ: `chiaLuot` + `danXenLuot` (`srs2-loi.ts`), áp cho kế hoạch ngày, chuyến Đảo, chặng Đoàn (từng em).
- Em yếu ≤ 1 câu nợ khó/lượt, TB ≤ 2; mỗi lượt tối thiểu 4 câu (trừ lượt cuối); toàn câu khó (không còn câu dễ để xen) ⇒ không tách lượt, hai câu khó nhất tách nhau qua hiệp trùm, còn lại khó vừa → khó hơn.
- Kết chuyến Đảo: em KHÁ/GIỎI giữ Trùm = câu khó nhất cuối chuyến (thầy chốt 28/09); em YẾU/TB mở và kết chuyến bằng câu dễ.
