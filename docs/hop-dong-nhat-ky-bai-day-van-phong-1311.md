# Hợp đồng: văn phòng soạn «Nhật ký bài dạy» sau mỗi buổi live (13/11)

Thầy chốt 13/11: «nhật kí sau khi live xong gửi cho văn phòng soạn». App KHÔNG tự gọi AI. Văn phòng (Javis DDH) lấy tư liệu của buổi, soạn kịch bản hoạt hoạ, gửi về app. App tự kiểm rồi mới cho học sinh xem. Không ai duyệt tay.

Bản vẽ, khuôn và hai kịch bản mẫu: `docs/ban-ve-nhat-ky-bai-day-1311/` (`kich-ban-lien-ket.json`, `kich-ban-fes2.json`, `luoc-do.json`, `dac-ta.md`).

## Xác thực
Mọi lệnh `POST https://omr.ttadodaihoc.workers.dev/gv/live-nhat-ky-*` dùng đúng mã GV văn phòng đang dùng cho `/gv/ai-ddh/hang-cho` và `/gv/bpu/moi-ra` (đầu mục `x-ma-bi-mat`). Sai hoặc thiếu mã ⇒ 403.

## Quy trình
1. Hỏi `live-nhat-ky-ds` vài phút một lần trong buổi tối (một lệnh đọc D1 mỗi lần). Buổi có `canSoan: true` là buổi cần soạn.
2. Gọi `live-nhat-ky-tu-lieu` cho buổi đó. Tải tiếng, xem ảnh từng trang bảng, đọc câu đã chữa.
3. Soạn kịch bản đúng lược đồ (trường `luocDo` trong tư liệu) rồi gửi `live-nhat-ky-ghi` kèm đúng `ban` của tư liệu.
4. Đọc kết quả: `phatHanh: true` là xong. `phatHanh: false` hoặc `ok: false` thì sửa theo lý do rồi gửi lại. Gửi lại bao nhiêu lần cũng được, bản sau thay bản trước.

## 1. `POST /gv/live-nhat-ky-ds`
Thân: `{ "sau": "<moc lần trước>" }`, bỏ trống thì lấy cả 30 ngày gần nhất.

Chỉ đưa ra buổi đã chốt bản xem lại xong và đã tắt live ít nhất 3 phút (thầy bật lại live thì buổi được dựng lại). Tối đa 30 buổi, mới nhất trước.

Trả `{ ok, ds: [...], moc }`. Lần sau gửi `sau = moc`.

| Trường mỗi buổi | Nghĩa |
|---|---|
| `buoiId` | mã buổi |
| `ten`, `lop`, `ngay`, `batLuc`, `tatLuc` | tên bài, lớp, ngày, giờ bật / tắt live (ISO) |
| `soCau`, `phutLive` | số câu đã chữa, số phút live |
| `ban` | bản dựng của buổi. Thầy bật live lại ⇒ `ban` tăng ⇒ giờ trên trục tiếng đổi ⇒ phải soạn lại |
| `nhatKy` | `null` = chưa có. Có thì `{ ban, luc, phatHanh, soDat, soCanh }` của lần gửi gần nhất |
| `canSoan` | `true` khi chưa có nhật ký, hoặc nhật ký soạn theo bản cũ, hoặc lần gửi trước chưa đủ cảnh đạt |

## 2. `POST /gv/live-nhat-ky-tu-lieu`
Thân: `{ "buoiId": "..." }`.

| Trường | Nghĩa |
|---|---|
| `ban` | bản dựng. Gửi kịch bản phải kèm đúng số này |
| `buoi` | `{ ten, lop, ngay, thu, gioBatDau, phutLive, giayTieng, coTieng }` |
| `tieng` | đường tải `tieng.mp3` (MP3 mono 24 kHz). `null` nếu buổi không ghi tiếng. Mọi mốc `tu` / `den` của kịch bản là GIÂY trên trục của tệp này |
| `cau[]` | các câu đã chữa: `{ so, phan, tuLuan, bai, de, moDapAn, dapAn, loiGiai, tu, den, soDung, soGui }`. `de` là đề công khai (chữ, phương án, hình). `tu` / `den` = giây câu đó chiếm trên trục tiếng. `moDapAn: false` ⇒ câu chưa mở đáp án trong buổi: `dapAn` rỗng, `loiGiai` null, KHÔNG được nói đáp án trong kịch bản |
| `trang[]` | các trang bảng: `{ trang, loai, cau, doan, soNet, anh }`. `trang` = số trang (1, 2, …) dùng cho `nguon.trang` của cảnh. `loai`: `giay` = Thầy viết lên giấy đề của câu, `bang` = bảng đen cuộn. `cau` = số câu đang dạy lúc trang hiện. `doan` = các khoảng giây trang đang hiện. `anh` = đường tải ảnh trang |
| `luocDo` | lược đồ JSON của kịch bản (bản 2). Dùng làm ràng buộc khi sinh JSON |
| `hanVe` | các đường tải dùng được 6 giờ, quá hạn thì gọi lại lệnh này |

Ảnh trang là **SVG** (vectơ nét phấn trên nền bảng tối, bề ngang 1920 đơn vị). Mô hình nhìn ảnh nào không nhận SVG thì văn phòng tự chuyển sang PNG trước khi đưa vào. Nét viết trên giấy đề chỉ có nét, không có chữ đề bên dưới; đọc kèm `cau[].de` của câu ghi ở `trang[].cau`.

## 3. `POST /gv/live-nhat-ky-ghi`
Thân: `{ "buoiId": "...", "ban": 2, "kichBan": { ... } }`. Kịch bản dài tối đa 300 KB.

Chỉ gửi phần văn phòng soạn: `phienBan`, `bia`, `canh`. Phần máy điền (`buoi`, `nguon` đầu tệp, `canh[].nguon.vung`, `y[].giay` của tổng kết) gửi kèm cũng bị bỏ.

App kiểm theo thứ tự:
1. `ban` khớp bản dựng hiện tại, không thì `lyDo: "ban-doi"`.
2. Đúng lược đồ, không thì `lyDo: "luoc-do"` kèm `loi[]` có đường dẫn trường sai.
3. Không chứa mã câu nội bộ, không thì `lyDo: "ma-noi-bo"`.
4. Lời mời ở bìa đạt luật chữ, không thì `lyDo: "chu-bia"`.
5. **Cổng tự kiểm từng cảnh**: đúng cổng học sinh sẽ chạy lại khi xem (`src/lib/nhat-ky/cong.ts`). Cảnh hỏng bị BỎ, kèm lý do trong `bo[]`:
   - số liệu tính lại bằng bảng của app (độ âm điện, electron lớp ngoài, nguyên tử khối; kịch bản không mang số riêng); ví dụ tính chuỗi phải ra đúng kết quả;
   - mọi số và công thức trên cảnh phải có trong chữ chép bảng (`nguon.chep`) hoặc lời Thầy;
   - cảnh (trừ tổng kết) phải trỏ tới trang bảng có thật và có đoạn tiếng (`den > tu`) nằm trong trục tiếng; lời Thầy nằm trong đoạn của cảnh;
   - luật chữ: không emoji, mỗi câu tối đa 30 chữ, không ẩn dụ tiền / nhà / giàu / thuế, không lộ tên khuôn.
6. **Phát hành** khi có ít nhất 4 cảnh đạt và tỉ lệ cảnh đạt từ 60 % trở lên. Chưa đủ ⇒ `phatHanh: false`, `lyDo: "chua-du-canh"`, học sinh chưa thấy bài (bản phát hành cũ của buổi cũng gỡ).

Trước khi cất, app tự làm thêm ba việc:
- Tên học sinh trong lớp và học sinh đã điểm danh buổi đó bị thay bằng «một bạn». Tên gọi một chữ chỉ bị thay khi đứng sau «bạn» hoặc «em».
- Bỏ chữ chép bảng (`nguon.chep`) khỏi bản học sinh xem.
- Điền vùng nét của từng cảnh trên trang bảng.

Trả `{ ok: true, phatHanh, soCanh, dat: [id…], bo: [{ id, tieuDe, lyDo[] }], nguong }`.

## Luật soạn (ngoài lược đồ)
- Xưng **Thầy**. Không «trung tâm», không «—», không emoji. Câu tối đa 30 chữ.
- Lời Thầy (`loi[]`) chép đúng cách Thầy nói trong tiếng: bỏ nói lắp, không thêm ý. `tu` / `den` là giây thật trong `tieng.mp3`.
- Không viết tên học sinh. Không đọc lời học sinh nói.
- Câu chưa mở đáp án (`moDapAn: false`): không nói đáp án, không đưa vào câu đoán nhanh.
- Lời giải theo cách dạy của Thầy (`docs/tu-duy-day-hoa-thay-2610.md`): sơ đồ cột dọc theo chất, bảo toàn nguyên tố, xuôi × H/100, ngược × 100/H.

## Phía học sinh
Bản phát hành nằm ở `live/<buoiId>/nhat-ky.json`. Màn học sinh mở bài hoạt hoạ ở trang xem lại của buổi đang được làm, chưa có trên bản sống.
