# 16/09 · VÁ ĐỒNG BỘ NGÂN HÀNG — máy chủ trả `ngayNap`

## Nguyên nhân gốc (đã dựng lại bằng số liệu thật, không đoán)

`danhSachDe` trên Worker (`server/src/index.ts · danhSachDeKho`) trả về ĐÚNG 7
khoá: `maDe, tenDe, lop, chuyenDe, soCau, daXoa, capNhatLuc`. **Không có
`ngayNap`** — dù `KhoDeItem` (`src/lib/exam-api.ts:1794`) khai có, và
`exam-sync.ts · chonDeCanTai` so đúng trường ấy để quyết định tải lại:

```ts
else if (epTaiLai || (cu.ngayNap ?? '') !== (item.ngayNap ?? '') || thieuTruongDang(cu)) capNhat.push(item)
```

Máy chủ không trả ⇒ `item.ngayNap` = `''` cho cả 225 tờ, còn `cu.ngayNap` là
ngày thật đọc từ gói đang giữ trên máy thầy (`exam-kho-de-import.ts:471`).
`'2026-09-09' !== ''` luôn đúng ⇒ **TỜ NÀO CŨNG bị coi là đã đổi**. Mỗi lượt
bấm Đồng bộ:

- tải lại cả 225 gói (hàng chục MB), tuần tự;
- và với MỖI tờ còn gọi `capNhatCaDaMo` → đọc ngân hàng của mọi ca đã mở rồi
  đẩy lại lên máy chủ.

Chạy mãi không xong, màn hình không đổi ⇒ nhìn từ phía thầy đúng là "bấm Đồng
bộ mà không vào". Việc dập ngày `ngay_nap` trong kho hôm 16/09 **không thể**
chữa được, vì khâu hỏng nằm ở máy chủ chứ không ở kho.

## Đã sửa

1. `server/migration-1609-ngay-nap.sql` — thêm cột `ngay_nap TEXT NOT NULL
   DEFAULT ''` vào bảng `de_kho` (cột THÊM, không đụng dữ liệu cũ).
2. `dayDeKho` — đọc `ngay_nap` TRONG GÓI và ghi xuống cột ấy
   (`ngay_nap=COALESCE(NULLIF(excluded.ngay_nap,''), de_kho.ngay_nap)`).
3. `danhSachDeKho` — trả `ngayNap: String(x.ngay_nap ?? '')`.
4. Nạp lại cả 225 tờ để điền cột.

**App trên Pages KHÔNG bị đụng** — chỉ Worker. Mã app không phải sửa một dòng:
logic của `chonDeCanTai` vốn đúng, nó chỉ chưa bao giờ được cấp dữ liệu.

## Nghiệm thu (`_va-ngay-nap-1609.log`, 15:11:53 ngày 16/09)

```
Tờ dưới máy thầy : 225      Tờ trên máy chủ : 225
ngayNap còn RỖNG : 0        ngayNap LỆCH gói : 0      máy chủ thiếu tờ : 0
Phân bố ngày trên máy chủ: {'2026-09-16': 113, '2026-09-09': 44,
                            '2026-09-11': 12, '2026-09-10': 34, '2026-09-08': 22}
```

Khớp từng tờ với ngày trong gói dưới máy thầy.

## Còn treo

- Hai hunk trong `server/src/index.ts` **chưa commit**: phiên khác đang sửa
  cùng tệp (game thần thú V2, đường `/luyen-de/`), commit vào là kéo theo việc
  dở của họ và làm HEAD dựng hỏng. Bản vá đang chạy thật trên Worker; bản sao
  để đối chiếu ở `sao-luu/VA-NGAY-NAP-1609.patch`.
- `PHAT-HANH-SACH.command` dựng Worker **từ HEAD**. Khi phiên kia commit xong
  game V2, phải chắc hai hunk này nằm trong commit ấy, kẻo bản phát hành sau
  quay về máy chủ cũ và lỗi đồng bộ trở lại.

## Lệnh lùi

`git revert --no-edit <mã commit>` rồi bấm `DAY-MAY-CHU.command`.
Cột `ngay_nap` là cột thêm — máy chủ bản cũ không đụng tới nên lùi an toàn,
không cần gỡ cột.
