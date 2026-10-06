# Chẩn đoán bước sai trước khi làm lại (06/10)

Lệnh thầy 06/10: "Làm chuẩn đoán bước sai". Mã: `server/src/chan-doan-buoc-sai.ts`. Test: `tests/chan-doan-buoc-sai-0610*.test.ts`.

## Khi nào chèn
- Chỉ ở **chuyến Đảo** và **chặng Đoàn** của kế hoạch ngày (`srs2-game.ts` `napLuot` → `cau-anh-em.ts` `apLamLaiKhac`, tuỳ chọn `chanDoan`).
- Câu lỗi Q đang **mở** (`phatLaiLoi` = `mo`: chưa có lượt tự làm nào sau lần sai cuối) và **chưa được chẩn đoán sau lần sai cuối** (`HoSo2.chanDoanXong`).
- OMNI bật cho em và công tắc `chan_doan_buoc_sai` không tắt.
- Tối đa 2 câu chẩn đoán mỗi chuyến/chặng, mỗi nhãn một câu; **không** chèn vào ải Trùm (câu cuối chuyến Đảo đủ 6 ải).
- Khối: mã tờ của câu lỗi phải mang khối và đúng khối em. Em chưa rõ khối, hoặc tờ không có khối trong mã (vd. tờ "100") ⇒ không chèn. Lý do: câu chẩn đoán phải qua mọi cổng khối như câu lỗi, kể cả cổng lúc chấm (chỉ thấy `qid`, `maDe`).
- Không chèn ở Bi-a, vé thử thách, Tu luyện, Trạm hồi phục: các nơi này không truyền tuỳ chọn, giữ y hệt hôm nay.

## Vị trí chèn: thay chỗ, không cộng thêm
Câu chẩn đoán **đứng đúng chỗ** lượt làm lại của Q trong lượt (cùng vị trí sau đan xen). Lượt làm lại dời sang lần phát kế.
- Độ dài chuyến (6 ải) và tổng câu kế hoạch ngày **không đổi**. Sổ ghi `raw_json.tc = Q`, nên `docDemHomNay` tính chỗ của Q là đã làm.
- Ref phiên: `{ qid: <câu chẩn đoán>, tc: Q, cd: 1 }` (chỉ ở máy chủ). Chuyến chờ, resume và câu đang giữ dùng `tc` như câu anh em.
- Hôm sau Q ra lượt làm lại thật theo thang (song sinh, bản lâu chưa phục vụ, bản khác…). Không chẩn đoán lại trong cùng cửa sổ lỗi.

## Câu chẩn đoán là gì
Là một câu thường đi qua đường sẵn có: `publicQuestion` (không đáp án), vai `on_lai`, chấm ở máy chủ khi nộp. Không thêm giao diện, không thêm kiểu màn.
1. **Câu tính toán.** Q có bước `nen:<nhãn>` mà nhãn có bộ sinh câu nền (`omni-cau-nen-sinh.ts`) ⇒ một câu nền sinh bằng mã của **bước yếu nhất**:
   - bước em tự khai trước (`omni_buoc_sai`; luật `omni-buoc-sai-uu-tien.ts`: 14 ngày, nhiều dòng → gần nhất → P thấp);
   - không có khai ⇒ bước P thấp nhất; hoà ⇒ theo mã.
   - qid `nen:sinh.<nhãn>.<số>`, trùng mã câu của bảng `cau_nen`; số = băm tất định (em, Q, ngày sai cuối).
   - `tn` ⇒ Phần I; `so` ⇒ Phần III, chấm như câu nền (khớp đáp án hoặc lệch ≤ 0,5 %).
2. **Câu lý thuyết Phần I** không có bước nền ⇒ "chìa khoá + 2 ý Đ/S cùng kiến thức" từ kho ý (`cau_y_ds`), **chỉ khi** có ≥ 2 ý của một đề dẫn cùng dạng với Q.
   - Điều kiện: đúng khối, đề không hình, không câu nghi đáp án, có chìa khoá (kiến thức cốt lõi của đề dẫn).
   - Câu: đề dẫn + "Chìa khoá: …" + hai phát biểu; bốn phương án là bốn tổ hợp Đúng/Sai. qid `nen:yds.<băm>.<stt1>.<stt2>`.
   - Kho rỗng hoặc thiếu ⇒ không chèn, không lỗi. Bản sống hôm nay kho đang rỗng.
3. Không có (1), (2) ⇒ không chèn; lượt làm lại như hôm nay.

## Giải mã khi chấm, resume, Đoàn
`game-v2-bank.ts` `docCauTheoRef` / `napDayDuMem` nhập trễ `giaiCauChanDoan`: sinh lại bằng mã (1), hoặc đọc lại kho ý chỉ-thêm (2).
- `version` của ref là băm nội dung lúc phát. Sinh lại ra nội dung khác (bộ sinh đổi) ⇒ `null`.
- `null` nghĩa là "câu đổi": máy em bỏ qua câu, không tính sai; Đoàn coi như câu rút. Không bao giờ chấm theo một câu khác.

## Ghi sổ, cập nhật P
- Dòng `su_kien_hoc`: nguon `game` (câu của chuyến), purpose **`chan_doan`**, raw `{chon, tc: Q, cd: 1, ms, tt, td}`.
- OMNI phát lại coi là quan sát của vi kỹ năng câu kiểm ⇒ **P cập nhật**:
  - câu (1) là `nen:<nhãn>` (`omni-d1.ts` `qTuKho`);
  - câu (2) là `dang:<dạng>` (cột `ma_dang` của sổ).
- **Không** là lượt làm lại của Q:
  - `SQL_LA_LAN_LAM` loại purpose `chan_doan`;
  - `lanLamTuDongTc` bỏ dòng này (luật đóng lỗi, Bảng chiến dịch); nút thắt bỏ; chất lượng, Tu luyện, câu đã đúng bỏ theo tiền tố `nen:`.
- `docLanLam` đọc dòng này **cùng truy vấn** để dựng mốc `chanDoanXong`. Không thêm lượt D1.
- Em làm **sai** ⇒ một dòng `omni_buoc_sai(sbd, Q, ngày, vi kỹ năng của câu)`, như em tự khai bước sai. Trạm và lần chẩn đoán sau ưu tiên bước đó.
- Không đổi mastery theo dạng của hồ sơ game (như lướt); vẫn có EXP câu game như câu thường. Không hiện "P dạng", không hiện thẻ "Sai vì bước nào?".

## Công tắc khẩn
`cau_hinh` khoá `chan_doan_buoc_sai`:
- vắng ⇒ bật (khi OMNI bật cho em);
- `{"bat":false}` ⇒ y hệt hôm nay (có test).

Công tắc này độc lập với `lam_lai_khac`.

## Rủi ro đã biết
- Chẩn đoán làm lượt làm lại thật của Q chậm một lần phát, thường là một ngày. Mỗi cửa sổ lỗi chỉ chẩn đoán một lần.
- Câu nền Phần III được chấm nới 0,5 %, khác câu kho chấm chặt.
