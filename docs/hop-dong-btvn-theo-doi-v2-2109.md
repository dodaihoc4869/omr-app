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

## Máy chủ (Code 3 điền, 21/09) — `server/src/btvn-theo-doi-nhom.ts`, nối ở `theoDoiBtvn` (index.ts)
**Luật nhóm MỘT em** (thứ tự ưu tiên; mỗi em không thu hồi đúng MỘT nhóm nên `chuaMo+dungNhip+chamNhip+xongHomNay+daNop = tong`): (1) đã nộp ⇒ `da_nop` (`nopTre` ⊂ daNop theo cột `nop_tre`; `nopTreGio` = `gio_tre`); (2) `emChamNhip` của Bảng tin ⇒ `cham_nhip` — CHỈ với bài giao TỪ NGÀY MỐC (bài giao trước ngày mốc không bao giờ chậm, cùng luật `noTheoLop`); (3) `trangThaiNopBai` = chưa mở ⇒ `chua_mo`; (4) bài chia chặng và em đã xong chặng lịch của hôm nay (mốc GỐC `truoc` của chặng mở sớm) ⇒ `xong_hom_nay`; (5) còn lại ⇒ `dung_nhip`.
**Khác/chốt so với bản nháp (Code 1 xem):**
- Bài KHÔNG chia chặng nhưng ĐÃ QUÁ HẠN: em chưa nộp (dở dang hay chưa mở) ⇒ `cham_nhip` (đúng `emChamNhip` của Bảng tin: "quá hạn chưa nộp") — không phải 0. Chưa quá hạn: `chamNhip = xongHomNay = 0`, `dungNhip` = đang làm. Màn nên đổi nhãn "Chậm nhịp" ⇒ "Quá hạn chưa nộp" khi `chang` vắng.
- Chưa mở + quá hạn ⇒ `cham_nhip` (Bảng tin cũng không đếm em này vào `chuaMo`); nhờ vậy `nhom.chuaMo` = `baiTap[].chuaMo`, `nhom.chamNhip` = số em `emChamNhip`, `nhom.daNop` = `baiTap[].daNop` cho cùng bài.
- `ten` = `tenBaiHienThi(chuyên đề trội nhất, tên ca/tờ)` KHÔNG kèm lớp (đã có `tenLop`; bài chỉ có mã kỹ thuật ⇒ "Bài tập về nhà"). `tenLop` = lớp DUY NHẤT của các em không thu hồi trong bài, nhiều lớp / không rõ ⇒ `''`.
- `chang` chỉ có khi ≥ 1 em đã chốt; số chặng = số phổ biến nhất; `ngay` = ngày VN mở GỐC phổ biến nhất của chặng đó; `laHomNay` = ngày đó là hôm nay.
- `soCauCuaEm`: bài cá nhân hoá = số câu bộ của em (`null` nếu chưa chốt); bài thường = số câu của bài. `soCauDaLam` = số câu có đáp án không rỗng (`null` khi chưa mở). `hocGanNhat` = mốc lớn nhất trong (lần học gần nhất ở sổ `btvn`/`btvn_lo`, giờ nộp, `xong_vong1_luc`); `null` khi chưa mở. `changHienTai` = min(số chặng đã xong + 1, tổng chặng), `null` khi chưa chốt / không chia chặng.
- Em thu hồi: không có `nhom` và các khoá mới (giữ nguyên các khoá cũ).
**Chi phí:** đúng 5 truy vấn thêm (song song, SELECT, không UNION): cột lịch/chặng của em · tên bài + chuyên đề · tên lớp · lần học gần nhất · mốc. D1 thật 21/09 (4 bài, 245 em): 271 + 1.090 + 761 + 1.235 + 1 ≈ **3,4 nghìn dòng đọc/lần** (thầy mở màn vài chục lần/ngày ⇒ ≪ 0,5 triệu dòng/ngày). Lỗi bất kỳ ⇒ bỏ khoá mới, lệnh cũ vẫn ok (máy cũ thiếu khoá ⇒ thẻ không thanh nhóm).
**Test đối chiếu:** `tests/btvn-theo-doi-v2-2109.test.ts` — cùng dữ liệu ⇒ `nhom.chamNhip` = số em `emChamNhip`, `nhom.chuaMo`/`daNop` = `baiTap[]` của `/gv/bang-tin`; đột biến 18/19 chết (1 tương đương).
**Đã gọi thử D1 thật:** (điền sau khi đẩy)
