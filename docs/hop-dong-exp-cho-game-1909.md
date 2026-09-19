# Hợp đồng EXP → game "Đoàn Hộ Tống" (Code 5 đọc)

Người viết: Code 3 (máy chủ). Đặc tả EXP: `DE-XUAT-EXP-MANH-KHIEN-1909.md`. Mã: `server/src/exp-d1.ts`. Game KHÔNG tự ghi sổ EXP: game GỌI hai hàm dưới, trong cùng Worker (import trực tiếp, không qua HTTP), sau khi game tự xác thực em (`gameIdentity`).

Cờ: cả hai hàm chỉ làm việc với em đã bật EXP mới (`cau_hinh.exp_moi`). Em chưa bật → `bat:false`, KHÔNG ghi gì, game xử như chưa có EXP học tập mới.

## 1. Ghi tiếp sức: `ghiTiepSuc(env, sbd, nowMs, idLuot?)`

```ts
import { ghiTiepSuc } from './exp-d1'
const r = await ghiTiepSuc(env, sbd, Date.now(), idLuotCuaGame)
// { bat, exp, lanThu, conLai, daGhiTruoc }
```
- +3 EXP mỗi lần, TỐI ĐA 5 lần mỗi ngày VN (hằng số `EXP_TIEP_SUC`, `TIEP_SUC_TOI_DA_NGAY` ở `exp-cau-hinh.ts`, đổi ở đó).
- Sổ `exp_so`: khoá đầy đủ `<sbd>|tiepsuc|<ngày VN>|<n>` (n = 1..5), `loai='tiepsuc'`, `exp=3`; cộng vào cấp thần thú của em bằng CAS (cùng đường với mọi khoản EXP khác).
- `idLuot` (mã lượt/hành động của game, ≤ 80 ký tự, khuyến nghị luôn truyền): gọi lại CÙNG `idLuot` trong ngày → `exp:0, daGhiTruoc:true`, không cộng đôi (mạng chập chờn, bấm hai lần). Không truyền thì mỗi lần gọi là một lượt mới.
- Đủ 5 lần → `exp:0, lanThu:0, conLai:0`. Gọi chồng nhau vẫn đúng 5 khoản (mỗi ô `n` một lần, bằng khoá chính).
- Không ném lỗi: lỗi/thiếu bảng → `bat:false, exp:0`. Game hiển thị theo `exp` trả về, không tự cộng.

## 2. Đọc thành tích ngày để phát vé: `docThanhTichNgay(env, sbd, nowMs, ngay?)`

```ts
import { docThanhTichNgay } from './exp-d1'
const t = await docThanhTichNgay(env, sbd, Date.now())
// { bat, ngay, datNgay: boolean, loDungNhip: [{ maBtvn, chiSo, khoa }] }
```
- ĐỌC-CHỈ: không ghi, không tính lại. Muốn số mới nhất thì gọi `capNhatExp(env, sbd, Date.now())` trước (idempotent, không cộng trùng).
- `datNgay` = sổ EXP của em ngày `ngay` (mặc định hôm nay theo `nowMs`) đã có khoá `dat|<ngày>` (trao +20 EXP).
- `loDungNhip` = các lô BTVN xong ĐÚNG NHỊP đã được trao EXP trong ngày `ngay` (khoá `lo|<mã bài>|<chỉ số lô>` với `exp = 10`; lô trễ nhịp `exp = 4` KHÔNG có trong danh sách). `khoa` là khoá idempotent để game giữ sổ vé riêng và không phát vé hai lần cho cùng một khoá.
- Vé do game giữ sổ riêng: đạt ngày +2 vé, lô đúng nhịp +1 vé. Nên khoá sổ vé theo `khoa` ở trên (`dat|<ngày>`, `lo|<mã>|<chỉ số>`).
- Lưu ý ngày: khoản `lo` mang ngày ghi sổ EXP (ngày máy chủ tính ra khoản), thường là ngày em xong lô; khoản bù muộn có thể mang ngày sau. Cờ tắt → `{ bat:false, datNgay:false, loDungNhip:[] }`.

## Ranh giới
- Game giữ nguyên: 20/40/40 theo mastery, assisted = 0, trần 200 câu game/ngày, ví (`wallet`), ống nghiệm → nạp. Câu làm TRONG game không nhận EXP câu theo bảng học tập (chỉ các khoản chuyển trạng thái hồ sơ như lên bậc/khắc phục áp cho cả nguồn game).
- Khiên: hồ sơ game có thêm `khienRen: { manh, daRen }` và `expMoi: { daCong, manhDaTinh }` (game KHÔNG sửa hai trường này). Số khiên dùng được = `khienConLai(p)` ở `exp-ho-so-game.ts` (= quà tiến hoá + `daRen` − `shields.used`); mọi chỗ game kiểm "còn khiên không" phải dùng hàm này, không dùng `shieldRemaining` của `shields.ts`.
