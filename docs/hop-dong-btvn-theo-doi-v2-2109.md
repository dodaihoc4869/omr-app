# Hợp đồng `POST /btvn/theo-doi` — bản 2 (CHỈ-THÊM) cho mục "Bài tập về nhà đã giao" thiết kế lại

Bản nháp của Code 1 (màn `src/screens/PhanCongScreen.tsx` + `src/components/btvn-da-giao/`) ngày 21/09/2026, theo `prompt-btvn-da-giao-thiet-ke-lai-2109.md` §2–§3. **Code 3 (máy chủ) bổ sung mục cuối** (số truy vấn ≤ 5 term/UNION, rows_read đo trên D1 thật, ước lượng dòng đọc/ngày, kết quả gọi thử D1 thật). Đổi tên trường thì báo Code 1 trước.

## Nguyên tắc
- **CHỈ THÊM khoá**; mọi khoá cũ (`ds[].maBtvn/maCa/maDe/soCau/giaoLuc/hanNop/quaHan/tong/daNop/caNhan/soLoi/hocSinh[]/chuaNop[]`) giữ nguyên từng byte — màn cũ và máy cũ vẫn chạy.
- **MỘT nguồn luật nhóm ở máy chủ**: màn KHÔNG tự tính nhóm. Bốn trạng thái phải khớp Bảng tin thầy (`emChamNhip`, `gv-bang-tin.ts`) và thẻ "Đường về đích" của em (`ve-dich.ts soNo` / `trangThaiChangTheoMoc`), tính từ MỐC HIỂN THỊ (`docMocHienThi`): chưa mở = chưa có dòng mở bài · chậm nhịp = có chặng lẽ ra xong trước 00:00 hôm nay mà chưa xong (chặng MỞ SỚM chưa làm KHÔNG tính chậm — mốc gốc `truoc`) · xong chặng hôm nay · đúng nhịp = còn lại · đã nộp.
- Máy chủ CŨ (thiếu khoá mới) ⇒ màn hiện thẻ KHÔNG có thanh nhóm + dòng "Cập nhật máy chủ để xem theo nhóm"; không bịa số.

## Thêm ở MỖI phần tử của `ds[]` (một bài / một dòng `btvn`)
| Khoá | Kiểu | Nghĩa |
|---|---|---|
| `ten` | string | `tenBaiHienThi` (một nguồn với Bảng tin, `gv-bang-tin.ts:58`), ví dụ "Lớp 10 · Chương 2 · Bài 5"; không chứa mã "Riêng-…" |
| `tenLop` | string | tên lớp chuẩn `ten_lop`; `''` nếu bài giao riêng nhiều lớp / không rõ |
| `soCauLoi` | number \| null | số câu lõi (bài nâng đỡ); `null` nếu bài không cá nhân hoá |
| `chang` | `{ so:number, ngay:'YYYY-MM-DD', laHomNay:boolean }[]` | đường chặng: `so` từ 1; `ngay` = ngày VN chặng mở theo lịch GỐC; CHỈ bài chia chặng — bài không chia chặng ⇒ mảng rỗng hoặc vắng |
| `nhom` | `{ chuaMo, dungNhip, chamNhip, xongHomNay, daNop, nopTre : number }` | số em theo nhóm; `chuaMo+dungNhip+chamNhip+xongHomNay+daNop = tong` (KHÔNG tính em bị thu hồi); `nopTre` ⊂ `daNop` (em nộp sau hạn). **Bài không chia chặng**: `dungNhip` = "đang làm", `chamNhip = 0`, `xongHomNay = 0` (màn đổi nhãn theo `chang` rỗng) |

## Thêm ở MỖI phần tử của `ds[].hocSinh[]`
| Khoá | Kiểu | Nghĩa |
|---|---|---|
| `nhom` | `'chua_mo' \| 'dung_nhip' \| 'cham_nhip' \| 'xong_hom_nay' \| 'da_nop'` | nhóm của em — CÙNG luật với `ds[].nhom` (tổng theo nhóm khớp) |
| `changHienTai` | number \| null | chặng em đang ở (từ 1); `null` = chưa mở / không chia chặng |
| `soCauDaLam` | number \| null | số câu em đã làm ở bài này |
| `soCauCuaEm` | number \| null | số câu của em (`soCauCuaEm` sẵn có nếu đã có; `null` = chưa chốt bộ) |
| `hocGanNhat` | string \| null | ISO lần học gần nhất trong bài này; `null` = chưa mở |
| `nopTreGio` | number (tuỳ chọn) | có ⇒ em nộp trễ, số giờ trễ (làm tròn lên, như cột `gio_tre`) |

## Màn dùng thế nào
- Thẻ bài: tên = `ten`; đường chặng = `chang`; thanh nhóm = các số trong `nhom` (độ rộng đoạn = tỉ lệ số / `tong`, đoạn = 0 thì bỏ; ĐỌC, không tự cộng trừ nhóm); "Xem N em này" = `chuaMo + chamNhip`.
- Sắp thẻ: mức cần để ý = `chamNhip × 2 + chuaMo`, rồi hạn gần trước (chỉ sắp — không tính nhóm).
- Ngăn danh sách em: tab theo `hocSinh[].nhom`; dòng em dùng `changHienTai` · `soCauDaLam / soCauCuaEm` · `hocGanNhat` · `nopTreGio`.
- Nhiều dòng `btvn` cùng một lần giao (nhiều ca + "Riêng") được màn GỘP như hiện nay (`nhom-btvn.ts`): màn CỘNG các số `nhom` của các dòng, lấy `ten`/`chang`/`soCauLoi` của dòng đầu, `tenLop` gộp không trùng.

## Máy chủ (Code 3 điền)
- Số truy vấn thêm mỗi lần gọi (≤ 5 term mỗi UNION — giới hạn D1 thật): …
- rows_read đo trên D1 thật / ước lượng dòng đọc mỗi ngày: …
- Test đối chiếu: cùng dữ liệu ⇒ `nhom.chamNhip` = số em `emChamNhip` của Bảng tin cho bài đó: …
- Đã gọi thử D1 thật có mã bí mật (kết quả): …
