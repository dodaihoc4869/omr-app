# Đoàn Hộ Tống 2.0 — em hết câu riêng trước bạn (28/09/2026)

Thầy: "cho trợ lý làm cho hợp lý luôn". Tái hiện bằng `tests/doan-het-cau-2809.test.ts` (SQLite thật, bộ câu ngắn tạo bằng cách cắt `nguoi[k].cau` đúng như `startDoan2` trả ít câu).

## Nguyên nhân gốc (một dòng)
Máy chủ chỉ coi em hết câu là "đủ bài" (`duBai`), còn lõi không có vai nào cho ghế ấy ⇒ ghế thành "không nộp": 0 khiên, quái sinh theo ghế em vẫn đánh Linh Tâm, không tiếp sức được, và hiệp trống của cả đoàn vẫn phải chơi từng hiệp một.

## Hiện trạng trước khi sửa (đoàn 3 em, S2 chỉ 2 câu; đi một mình 2 câu)
| Câu hỏi | Trước khi sửa |
|---|---|
| Em ngồi chờ? | Không kẹt: `duBai` bỏ qua em ⇒ hiệp giải khi các bạn nộp xong. Nhưng màn em chỉ có "Hiệp này em cổ vũ đồng đội", không làm được gì. |
| Bạn thấy em thế nào | Trong hiệp: `dang_lam` (bạn tưởng em đang làm). Sau hiệp: `ra: 'giu'` = không chốt, 0 khiên. |
| Bị coi là không nộp? | Có: `nop:false`, `hanhDong:null`. Không ghi sai vào hồ sơ (không có bài làm). |
| Máu / sát thương | Sai: lõi vẫn sinh 1 quái mỗi ghế, nên quái "của" em còn sống và đánh Linh Tâm 4 máu mỗi hiệp. Đoàn mất máu vì em ít câu. |
| Tiếp sức | Em không tiếp sức được ai (`kiemGiup` đòi em đã chốt; `banCan` rỗng). |
| Nộp | `doan-nop` khi không có câu vẫn cho "bỏ trống + Chắn" (máy em không có nút). |
| Cả đoàn hết câu | Mỗi hiệp trống vẫn mở, nghỉ 6 giây rồi giải: quái sinh ra đánh Linh Tâm, chỉ bạn máy đánh. Đi một mình 2 câu: hiệp 3,5,6,7 trống, Linh Tâm 80 xuống 36. Hóa 2.0 (chờ bấm) thì em phải bấm ĐÁNH TIẾP qua từng hiệp trống. |
| Trùm không có câu chung | Phong độ tính "đúng ≥ 2/3 hiệp gần nhất" ⇒ hiệp em hết câu bị đếm như sai ⇒ ý của em sai. |
| Tổng kết / EXP | `soCau` đúng bằng câu thật (2). Khoản thắng chặng như em làm đủ 6 câu (thưởng như làm đủ). |

## Luật mới (đã sửa)
- **Giữ khiên**: ở hiệp thường em không còn câu riêng, máy coi em đã chốt ngay (bạn thấy "đã chốt"). Em góp +8 khiên như bạn máy chắn, không tính đúng/sai, không nạp năng lượng, không nhận thẻ. Máy em hiện: "Em đã ôn xong câu hôm nay — hiệp này em giữ khiên cho đoàn". Em vẫn **tiếp sức** được bạn đang cần. `doan-nop` hay xin tiếp sức ở hiệp ấy đều bị từ chối bằng lời dễ hiểu. Không độn câu mới, không ghi bài làm.
- **Trùm**: vẫn chia ý cho em như mọi bạn. Nếu trùm không có câu chung thì phong độ chỉ đếm hiệp em có câu (đúng ≥ 2/3 số câu đã làm). Em không làm câu nào thì ý đó tính như bạn máy.
- **Cả đoàn hết câu riêng** (chưa ai chốt): bỏ qua hiệp trống. Lứa quái của hiệp ấy được gỡ (quái còn từ trước vẫn giữ), không có dòng lịch sử, đi thẳng tới hiệp trùm kế hoặc hiệp 8. Không chờ đồng hồ, không bắt bấm ĐÁNH TIẾP. Nếu bạn còn câu rời giữa hiệp thì cũng bỏ qua ngay.
- **Đi một mình 2 câu**: chặng còn hiệp 1 · 2 · 4 · 8, về đích đủ máu, không kẹt.
- **Chặng của các bạn không ngắn đi**: bạn đủ câu vẫn chơi đủ 8 hiệp, 6 câu.
- **Tổng kết**: `soCau` = câu thật. Thêm `soHiepGiuKhien`. Khiên và lượt tiếp sức của hiệp giữ khiên vẫn được ghi công. Sổ `doan_luot.so_cau` ghi đúng số câu thật.
- **EXP**: EXP từng câu vẫn do đường chấm câu trao, nên tự nhiên theo câu thật. Khoản **thắng chặng** của em vào đoàn với ít câu ôn (`soCauThieu > 0`) = khoản thường × số câu ôn / 6, làm tròn lên (`thuongTheoSoCau`). Ví dụ 3 sao, 2 câu: 15 × 2/6 = 5, ghi chú "Thắng chặng 3 sao +5 EXP (2/6 câu ôn)". Khoản **vỡ giáp** là việc cả đội nên giữ nguyên. Em đủ 6 câu không đổi gì.

## Tệp
Lõi `src/game/than-thu-v2/doan-core.ts` (`NopHiep.hoTro`, `boQuaHiepTrong`, `thuongTheoSoCau`, `SO_CAU_RIENG_CHANG`) · máy chủ `server/src/game-v2-doan.ts` (`hetCauRieng`, `boQuaHiepRong`) · `server/src/game-v2-doan-exp.ts` · màn `DoanTran.tsx` (chỉ dòng giữ khiên, không chạm hoạt cảnh) · `doan-kieu.ts`.
