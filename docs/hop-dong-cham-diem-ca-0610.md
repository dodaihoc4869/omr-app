# HỢP ĐỒNG — chấm điểm ca thi chính xác tuyệt đối (thầy 06/10: "không được phép chấm sai cho bất kì bài kiểm tra nào")

Phạm vi: đường chấm điểm lúc học sinh nộp bài ở ca thi và mọi nơi dựng lại điểm / "câu sai" từ bài làm đã nộp. Mã: `src/lib/bo-cau-chuan.ts`, `src/lib/loai-cau-chua-dung.ts`, `server/src/cham-lai-ca.ts`, `server/src/kiem-cham.ts`, `server/src/key-bank-hop-nhat.ts`. Số liệu đo và lỗi đã sửa: `OMNI-3-build-status.md` §16.

## 1. Một lõi chấm, một bộ câu chuẩn
- **Bộ câu của một em** do MỘT hàm quyết: `giaiBoCauEm(kho, maCa, sbd, { dapAn, giayCau }, boGhi?) → { qids | null, nguon: 'da_ghi' | 'bai_lam' | 'hash', canhBao[], loi | null }`.
  1. Có bộ đã GHI cho em (D1 sống `ca.bo_theo_em_json` thắng bản chụp trong tờ đáp án R2, theo từng em): dùng ĐÚNG nó.
     - câu của bộ không còn trong kho đáp án ⇒ lỗi `thieu_trong_kho`;
     - em để lại dấu vết (đã trả lời / đã xem) ở câu NGOÀI bộ ⇒ lỗi `bai_lam_ngoai_bo`;
     - bộ thiếu so với chỉ tiêu `soCau` ⇒ vẫn chấm nhưng cảnh báo `bo_duoc_bu_N` (nói ra, không giấu).
  2. Không có bộ ghi: luật hash NẾU khớp dấu vết bài làm; lệch ⇒ dựng từ bài làm + bù cho đủ chỉ tiêu, cảnh báo `hash_lech_bai_lam`.
  3. Có lỗi ⇒ chỗ gọi KHÔNG chấm và KHÔNG ghi đè điểm đã có; nói thẳng lý do.
- Điểm (`scoreStudent`), dòng chi tiết (`taoChiTietCau`), chấm lại ở máy chủ (`chamBaiMotEm`), chấm lúc đọc (`danhGiaLuot`), công cụ kiểm (`kiemChamCa`) và máy em sau nộp đều đi qua hàm này ⇒ điểm và bảng "câu sai" luôn cùng một bộ câu.
- Phần III chấm bằng `khopPhanIII` (policy `numeric-value-v1`, biên 1e-4 loại trừ, BigInt). Khoá hợp lệ ⇔ số trần HOẶC `khopPhanIII(khoá, khoá)` (khoá có đơn vị / % chấm được); khoá chữ / phân số / rỗng vẫn bị từ chối (không chấm, nói to).

## 2. Phân loại câu chưa đúng trọn (`loaiCauChuaDung`)
`sai` (có trả lời mà sai) · `trong` (không trả lời gì; Phần II bỏ trống cả bốn ý được ghi `----`, không phải chuỗi rỗng) · `mot_phan` (chỉ Phần II: có ý đúng, chưa đủ bốn). Cả ba đều là câu CHƯA ĐÚNG TRỌN: bảng chấm ghi `dung_sai = 0` và vào hàng ôn lại. Mọi nơi đếm "câu sai" dùng đúng ba loại này, số trong ngoặc luôn cộng ra số câu nêu ngoài.

## 3. Lệnh máy chủ
Mọi lệnh dưới đây cần mã bí mật của thầy (`x-ma-bi-mat`, cổng `LENH_CUA_THAY`).

| Lệnh | Vào | Ra | Ghi gì |
|---|---|---|---|
| `POST /ca/kiem-cham` | `{ maCa }` | `{ ok, maCa, tenCa, trangThai, deRieng, congBo, nguon{keyCoSoCau,keyCoBoTheoEm,d1CoSoCau,d1CoBoTheoEm,khoCau,soCauCa,emChiCoOD1}, soEmDaNop, soEmChamDuoc, soEmTuChoi, boCau{da_ghi,bai_lam,hash}, canhBao{}, lech{…}, soEmCoLech, mau{…≤25 dòng/loại}, tuChoi[] }` hoặc `{ ok:false, lyDo }` (`khong_co_ca`…) | **KHÔNG ghi gì**; soi được cả ca đang mở. Không trả đáp án đúng, không trả bài làm. |
| `POST /ca/phuc-hoi-key` | `{ maCa, ghi? }` | `{ ok, xemTruoc, daGhi, soBoSung, soBoQua, them{I,II,III}, truoc{I,II,III}, sau{I,II,III}, saoLuu? }` hoặc `{ ok:false, lyDo }` (`khong_co_ca` · `chua_co_dap_an` · `dap_an_hong` · `ca_dang_mo`) | **Mặc định CHỈ XEM TRƯỚC.** `ghi: true` mới ghi: thêm vào tờ `key/<maCa>.json` các câu NỐI THÊM mà bảng D1 `kho_ca_them` còn đáp án (chỉ thêm, không xoá / không đổi câu có sẵn; qua `hopNhatKeyBank` nên giữ `soCau` + `boTheoEm`); sao lưu tờ cũ nguyên văn sang `sao-luu-key/<maCa>/<giờ>.json` TRƯỚC khi ghi (lùi = chép ngược); không chạy khi ca đang mở; chạy lại không thêm gì nữa. |
| `POST /ca/cham-lai` | `{ maCa, xemTruoc? }` | thêm `xemTruoc: true` ⇒ bảng cũ → mới, `soSeGhi`, `soGhi: 0`, `soSeDonBanDoSaiThua` / `soEmSeDonBanDoSaiThua` (dòng `ban_do_sai` ngoài bộ câu của em sẽ dọn) và `canPhucHoiKey` (số câu nối thêm tờ R2 đã mất — xem trước được BỔ SUNG đáp án từ `kho_ca_them` trong bộ nhớ, ghi thì KHÔNG: phải `/ca/phuc-hoi-key` trước); không có ⇒ ghi như cũ, kèm `tuChoi[]` (em không chấm được, điểm cũ giữ nguyên), `canhBao[]`, `soDonBanDoSaiThua` / `soEmDonBanDoSaiThua`. `boQuaDonNhieuLuot` = số em có từ hai lượt trở lên trong ca (không dọn bản đồ câu sai của họ vì dòng của lượt trước có thể hợp lệ) | Chỉ ca đã xong. Dùng bản đồ D1 sống. Ghi: điểm + dòng chi tiết (qua `chamDiem`), dọn dòng sai oan, dọn dòng sai THỪA của em đúng một lượt. |
| `/goi` `sendFeedback` (`guiNhanXet`) | như cũ (`diem`, `diemPhan` máy em gửi) | thêm `daGhiDiem`, `diem{I,II,III,tong}` | Máy chủ TỰ chấm lại lượt đã nộp từ bài làm đã lưu và ghi điểm của máy chủ; số máy em chỉ để đối chiếu (`diemMay`, `diemMayPhan`). Không chấm được ⇒ không ghi điểm, giữ điểm đang có. |
| `/goi` `capNhatKeyBank`, `/ca/nap-day-du` | `keyBank` gói TRẦN (ba mảng câu) | `capNhatKeyBank`: `{ ok:false, error }` khi gói thiếu `phanI/phanII/phanIII` | HỢP NHẤT với tờ `key/<maCa>.json` đang giữ: giữ thứ tự cũ, đáp án mới thắng, câu chỉ có ở một phía vẫn giữ, giữ `soCau` / `boTheoEm` nếu gói mới không mang. Không còn ghi "null" xoá sạch. |
| `/nop`, `/goi` `ketQua` | như cũ | `keyBank.soCau` luôn có (thiếu ở R2 ⇒ bù từ `ca.so_cau_json`) | — |
| `/nop` | thêm `khoaLuot` (`maCa\|sbd\|lanThu`) khi máy em gửi nốt bài của lượt CŨ | — | Bài cũ không đè lượt thi lại; lượt cũ đã đóng ⇒ cất làm bài bổ sung chờ thầy duyệt. |
| `/cham-diem` | như cũ | — | Dọn dòng `ban_do_sai` của câu lượt này chấm ĐÚNG (trước đây chỉ `/ca/cham-lai` dọn). |

### Câu nối thêm (`kho_ca_them`)
`noiKhoCa` nối câu NGOÀI KHO vào ca đề riêng và ghi chúng ở `de/<maCa>.json` (đề công khai), `key/<maCa>.json` (tờ đáp án) và D1 `kho_ca_them` (nội dung công khai + đáp án). Trước 06/10 các đường ghi tờ đáp án ghi đè mù nên tờ R2 có thể đã mất các câu ấy trong khi em vẫn được giao ⇒ máy chủ từ chối chấm (`thieu_trong_kho`). `/ca/kiem-cham` nay bổ sung chúng vào tờ đáp án TRONG BỘ NHỚ (chỉ đọc) để chấm được và báo `nguon.boSungTuKhoCaThem` (số câu bổ sung) / `nguon.boQuaKhoCaThem` (số dòng sai khuôn bị bỏ). Khuôn nhận: Phần I `A–D` + câu có `choices` · Phần II `D/S`×4 + câu có `ideas` · Phần III chuỗi số chấm được + câu không có `choices`/`ideas`. Sai khuôn ⇒ bỏ, không đoán.

### Mã lệch của `/ca/kiem-cham`
`diem_tong_lech` · `diem_phan_lech` · `diem_chua_co` · `tong_khac_tong_phan` · `dong_lech` · `dap_an_dung_lech` (đáp án đúng ghi ở dòng chi tiết ≠ đáp án đúng của khoá hiện hành: khoá bị đổi sau khi chấm, hoặc khoá bổ sung sai — chỉ nêu mã câu, không nêu đáp án) · `dong_thieu` · `dong_thua` · `em_khong_co_dong` · `ban_do_sai_oan` · `ban_do_sai_thua` · `cach_cu_chi_diem_lech` (chấm lại bằng cách CŨ sẽ ra điểm khác — số đo lỗi cũ). Em không chấm được (bộ câu lệch bài làm, khoá hỏng) vào `tuChoi[]`, không vào số lệch.

## 4. Luật bất di bất dịch
1. Không chấm đoán: bộ câu lệch bài làm / thiếu câu trong kho / khoá hỏng ⇒ KHÔNG ra điểm, KHÔNG ghi đè điểm đã có.
2. Điểm đã lưu của học sinh thật chỉ được sửa hàng loạt khi thầy duyệt danh sách (xem công cụ kiểm trước, `xemTruoc` sau, rồi mới ghi).
3. Số máy em tự tính không bao giờ thành điểm chính thức.
