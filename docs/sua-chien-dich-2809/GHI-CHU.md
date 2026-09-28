# Sửa chiến dịch đang mở — ghi chú luồng (28/09)

Thầy: "Chiến dịch đã mở có thêm nút chỉnh sửa để có thể thêm đề, thêm bớt học sinh, chỉnh lại hạn; lưu lại thì phân bổ lại số câu nếu thêm đề."

## Luồng hiện tại (trước khi sửa)

- **App thầy**: `src/components/chien-dich/`
  - `GiaoChienDich.tsx` — màn giao 3 bước: chọn tờ đề (cây Kho đề `HopChonDe`, kho trên máy `exam-db` tách phần bằng `tach-phan-de`), chọn em (`ChonEmGiao`, danh sách từ `ds-em`), hạn nộp + lượt/ngày (tự tính = `theLucDeXuat`). Mỗi lần đổi ⇒ `suc-chua`; nút giao ⇒ `tao`.
  - `DsChienDichDaGiao.tsx` — bảng "Chiến dịch đã giao" (`danh-sach` + `thongKe`), nút Xem bảng / Kết thúc / Huỷ.
  - `api.ts` — một cửa gọi `/gv/chien-dich` (qua `goiLenh`, kèm mã bí mật thầy).
- **Máy chủ**: `server/src/srs2-gv.ts` (`gvChienDich`, sau cổng `laThay` trong `index.ts`), bảng `chien_dich` (`server/migration-2709-game-hoa-2.sql`): `sbd_json`, `ma_de_json` (mã GỐC), `qid_json`, `han_nop`, `the_luc_ngay`, `huyet_chien`, `tao_luc`, `trang_thai` (`dang_chay|da_dong|da_huy`).
  - Tạo: `cauCuaToChiTiet` lấy câu ĐÃ DUYỆT của các tờ, bỏ tự luận (`laCauTuLuan`, `server/src/cam-tu-luan.ts`), bỏ câu trùng giữa tờ; tờ tách phần `-TN/-DS/-TLN` chỉ lấy phần đó.
- **Thuật toán chia câu 2.0** KHÔNG lưu sẵn phân bổ: mỗi ngày, lần đầu em mở, `layKeHoachHomNay` (`server/src/srs2-d1.ts`) lập và CHỐT kế hoạch (`srs2_ke_hoach`) bằng `lapKeHoachNgay` (`server/src/srs2-loi.ts`): câu mới/ngày = ⌈số câu MỚI còn lại / (D − ngày đệm)⌉, cộng câu ôn đến lịch, trần = lượt/ngày (quá tải ⇒ trần gấp đôi). Trạng thái câu phát lại từ sổ `su_kien_hoc`, chỉ tính lần làm TỪ `tao_luc` của chiến dịch.
  - Kế hoạch đã chốt được LẬP LẠI trong ngày khi `chien_dich_id` của kế hoạch ≠ chiến dịch đang chạy (giữ câu đã làm hôm nay, trừ vào lượt).
- Chiến dịch đang chạy của em = chiến dịch `dang_chay` mới giao nhất có `han_nop ≥ hôm nay` và có em trong `sbd_json`.

## Thiết kế sửa

- API mới `POST /gv/chien-dich/sua` (sau cổng thầy), `server/src/srs2-sua.ts`, `action`: `doc` (SBD + tờ + hạn hiện tại), `xem-truoc` (không ghi), `luu`.
- **Thêm đề**: câu mới (cùng `cauCuaTo` của lúc tạo ⇒ không tự luận, không câu chưa duyệt) NỐI SAU `qid_json` cũ, bỏ trùng. Câu cũ + sổ làm bài giữ nguyên, `tao_luc` giữ nguyên ⇒ tiến độ/EXP/điểm không đổi. Phân bổ lại: kế hoạch HÔM NAY đã chốt của các em bị đánh dấu (`chien_dich_id = '<id>#sua'`) ⇒ lần mở kế tiếp lập lại theo đúng thuật toán (giữ câu đã làm hôm nay); từ mai tự chia theo số câu mới còn lại / số ngày còn lại.
- **Thêm em**: bảng `chien_dich_em` ghi `them_luc`; em mới chỉ tính lần làm từ lúc được thêm (như em giao từ đầu). Em từng bị bớt rồi thêm lại ⇒ giữ mốc cũ (không mất tiến độ).
- **Bớt em**: bỏ khỏi `sbd_json` (em không thấy chiến dịch nữa), ghi `bot_luc`; KHÔNG xoá sổ làm bài.
- **Sửa hạn**: hạn mới ≥ hôm nay; chiến dịch đã hết hạn hoặc đã kết thúc ⇒ mở lại (`dang_chay`). Chiến dịch đã huỷ ⇒ từ chối.
- Nhật ký: bảng `chien_dich_sua` (chiến dịch, lúc, ai, thay đổi JSON) + một dòng `nhat_ky_may`.
- Schema CHỈ-THÊM, tự tạo lúc chạy (`CREATE TABLE IF NOT EXISTS`); không migration bắt buộc.
