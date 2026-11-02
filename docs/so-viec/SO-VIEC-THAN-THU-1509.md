# SỔ VIỆC — THẦN THÚ HOÁ HỌC, ngày 15/09

Kho `omr-app`. Ghi đúng trạng thái, **không tô hồng**: việc nào xong thì ghi
xong, việc nào dở thì ghi dở và dở ở đâu.

---

## A. ĐÃ XONG, ĐÃ ĐẨY LÊN PAGES

### A1 · Sân khấu 3D tràn kín ô, không dính chữ — `45c9a3b`
Thẻ tách hai tầng: **sân khấu** (cảnh 3D tràn sát bốn mép, trên nó chỉ có tên
thú và hai nút chiêu) và **bảng điều khiển** nền đục bên dưới. Bỏ hai nút chữ
tên chiêu, dòng hướng dẫn, nhãn tên cảnh — ba thứ nằm ngay ngực–mặt thú.
`khopKhung()` tính lại khoảng lùi máy quay mỗi lần thẻ co giãn.

### A2 · Sáu chiêu sáu lối, cuồng nộ khác hẳn — `45c9a3b`
Điểm nổ lùi 4,4 → 2,35 và đường đạn chếch 0,42 rad: cả cú nổ nằm gọn trong
khung thay vì phình kín một góc màn. Tia sét thành **chuỗi ống** (đường `Line`
của WebGL luôn dày đúng 1 pixel). Thêm đèn loé đặt đúng điểm nổ.

### A3 · Âm thanh sáu hệ sáu giọng — `3a8d196`
Dây chuyền: nguồn → lọc cộng hưởng → bao biên độ → nén → loa, kèm nhánh gửi
sang **hộp vang tự sinh** (đáp ứng xung bằng nhiễu tắt dần, không tải tệp).
Tâm phổ đo bằng `OfflineAudioContext`:

| Hoả | Hữu cơ | Base | Khí | Acid | Điện hoá |
|---|---|---|---|---|---|
| 388 Hz | 643 | 1488 | 1683 | 1883 | 2461 |

Chưởng thường đỉnh 0,260 / 0,44 s — cuồng nộ đỉnh 0,691 / 1,17 s, **to và dài
gấp 2,7 lần**.

### A4 · Xoay lại được + tự đồng bộ, bỏ nút — `3fb01e7`
Lớp chữ `z-10` phủ kín sân khấu nuốt hết cú chạm ⇒ cho chạm xuyên qua, hai nút
chiêu bật lại nhận chạm. Đo bằng trình duyệt thật: `elementFromPoint` giữa sân
khấu trả về `CANVAS`, kéo ngang 224 px làm ảnh dựng đổi.
Bỏ nút "Đồng bộ ngay", thay bằng **bốn mồi tự chạy**: quay lại tab · có mạng
lại · nhịp 45 giây khi tab hiện · rời tab thì đẩy nốt ngay.

---

## B. ĐÃ XONG, ĐÃ VÀO KHO, **CHƯA ĐẨY LÊN PAGES**

### B1 · Tháp 999 tầng · thần thú 120 cấp · độ khó theo sao — `08f5285`

**Độ khó theo sao.** Sao đã có sẵn trong kho đề (`can_chua.sao`, hàm `soSao`) —
máy chủ **đang vứt trường ấy đi**. Nay giữ lại. Bỏ hẳn ba bậc `bacTheoMucDo`
(dồn cả "thông hiểu", "vận dụng" và **câu chưa gắn mức độ** vào cùng bậc 2 ⇒
bậc 1 và 3 rỗng ⇒ `locTheoBac` trả cả kho ⇒ mọi tầng rút chung một rổ).

> **Đo đối chứng:** cách cũ tầng 1 và tầng 999 đều **★0,60 y hệt nhau**.
> Cách mới: tầng 1 ★0,10 → tầng 999 ★1,70.

**Nguồn câu.** Lệnh mới `hsCauDaThi` lấy **mọi câu em đã thi**, dùng lại nguyên
thân `hsCauSai` với một cờ — không có hai đường đọc kho đề song song rồi lệch
nhau. App lùi về `hsCauSai` khi máy chủ chưa đẩy bản mới.

**Chống lặp.** Sổ `lichSuThap` nằm trong hồ sơ thần thú (đã có đường đồng bộ đa
máy) ⇒ leo trên máy tính rồi mở điện thoại **không gặp lại câu vừa hỏi**.

**999 tầng.** Đo bằng công thức cũ: từ tầng ~25 trở đi **đúng một câu là hạ
trùm**, và leo hết 999 tầng in ra **3.026.970 EXP** (gấp 200 lần cả đường 12
cấp) — tháp thành máy in. Nay máu trùm bám theo sức thú ⇒ **tầng nào cũng tốn
~5 câu**; EXP lần đầu `25 + 0,9×tầng`, leo lại chỉ 12% ⇒ 474.575 EXP = 37% cả
đường. Hệ trùm chạy đủ **sáu** hệ — bản cũ chỉ bốn, **trùm hệ Điện hoá và Hữu
cơ chưa từng xuất hiện lần nào**.

**120 cấp.** Ba đoạn: cấp 1–9 nhẹ (120→260) · **cấp 10 dốc hẳn** (400, gấp 1,54
lần cấp 9) · **từ cấp 13 lâu dần** (990 rồi +3,7%/cấp, cấp 119 là 46.740). Tổng
1.286.590 EXP. Chủ ý: em đang max cấp 12 hôm nay, sau reset leo lại tới cấp 12
chỉ tốn **3.610 EXP — nhanh hơn bây giờ (15.120)**.
`TRAN_CAP` bên máy chủ nâng 12 → 120.

### B2 · Sáu khung xương + câu có ảnh/bảng — `2bce66c`
Đủ bộ **long · ly · quy · phượng · hổ · đại bàng**. Bỏ hẳn luật vứt câu có ảnh;
gom ảnh về đúng ba chỗ (thân câu / từng phương án / chèn giữa bài theo `viTri`)
cộng bảng biểu. Thêm `doDai` + `thangDoDai()` cho luật *"tầng cao câu dài hơn"*.

**Phép kiểm:** `tests/thap-999-va-sao.test.ts` 16 phép, kèm một phép **đối
chứng** chứng minh cách cũ phẳng thật. Sửa theo yêu cầu mới: `than-thu-3d` ·
`than-thu-hinh-thai` · `than-thu-ong-nghiem` · `than-thu-to-chieu` ·
`dia-chi-may-chu` · `dong-nhat-bao-cao`.

---

## C. ĐANG DỞ — NÓI RÕ DỞ Ở ĐÂU

### C1 · Bộ chi tiết sáu thần thú **chưa lộ ra**
Mã đã viết đủ: vây sống lưng, sừng nai phân nhánh, nanh, bờm xoã, giáp vai, gai
mai, mào phượng, đuôi ba phiến, vằn hổ, mỏ quặp, chùm lông gáy, vuốt ba ngón.
`tsc` sạch, phép kiểm xanh.

**Nhưng ảnh chụp cho thấy phần lớn chi tiết ấy không nhìn thấy được.** Nguyên
nhân: toạ độ đặt chi tiết viết theo khung thân CŨ, sau khi đổi khung thì chúng
rơi vào bên trong hoặc sau lưng con thú. Phải soi lại từng khung một và kéo
từng cụm ra khỏi đường viền thân — đúng cái đã làm với "nét ký" lượt trước.

**Chưa đạt yêu cầu "nhìn là phải trầm trồ".** Ghi thẳng, không nhận là xong.

### C2 · Ảnh và bảng biểu mới xong TẦNG DỮ LIỆU
Đã gom đúng ba loại ảnh + bảng vào `CauHoiCuaEm`. **Màn đấu chưa vẽ chúng ra** —
tức là câu có ảnh nay lọt vào game nhưng hiện lên vẫn thiếu hình. Còn phải làm
phần hiển thị trong khung bốn nút.

---

## D. CHƯA BẮT ĐẦU

| # | Việc | Ghi chú |
|---|---|---|
| D1 | **Đẩy B1 + B2 lên Pages** | mã đã vào kho, chưa phát hành |
| D2 | **Reset toàn bộ thần thú về trứng** | phải **sao lưu bảng `than_thu` ra tệp trước**; chạy SAU khi D1 xong |
| D3 | **Võ Đài Xếp Hạng → Đấu Trường Chân Lý** | bấm vào là vào đấu trường · cửa mời theo số báo danh · tối đa 6 người · đánh nhau kiểu auto-battler. Cần bảng phòng trên D1 + vòng đấu + xếp hạng — đây là một đợt riêng, không phải sửa vặt |
| D4 | Xuất ảnh Võ Đài hiện tại cho thầy xem | làm cùng D3 |

---

## E. BA CHỖ TÔI CHƯA KIỂM ĐƯỢC — thầy thử giúp

1. **Nhịp hình 3D trên điện thoại học sinh thật.** Sáu khung mới nhiều khối hơn
   hẳn; máy yếu có thể tụt khung hình. Tôi chỉ dựng được trên máy ảo phần mềm.
2. **Nghe tận tai sáu tiếng kêu.** Tôi mới **đo** tâm phổ bằng số, chưa nghe.
3. **Phân bố sao thật trong kho đề.** `kho-de/` trong kho rỗng, kho thật nằm
   trên R2. Thang sao hiện **tự co theo kho của từng em** nên không cần số này
   mới chạy được, nhưng có số thì chỉnh được cho sát hơn.
