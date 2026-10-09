# Hành trình — tầng từng bài trên Sảnh và Thử sức thêm (09/10/2026)

Làn máy chủ. Hai việc thầy chốt: (4) Sảnh gửi thêm tầng từng bài; (5) bật lại "Thử sức thêm" cho em đang chạy Hành trình. Không đổi bảng, không migration, không thêm truy vấn D1 ở `hoa2-sanh`.

## 1. Hợp đồng `sanh.hanhTrinh.bai` (chỉ-thêm)

```ts
hanhTrinh.bai?: { khoa: string; ten: string; tangMo: 1|2|3|4; vung: { a: number; b: number } | null }[]
```

- **Có khi** em đang chạy Hành trình (`hanh-trinh-v3-khoi-*`) **và** lớp em có phạm vi đã dạy (`bai_da_day` / `pham_vi_lop`, bai-da-day.ts). Không phải Hành trình ⇒ không có cả `hanhTrinh`. Hành trình mà lớp chưa tick bài nào ⇒ `bai` vắng (không có tên bài để hiện, máy chủ không bịa).
- **Danh sách bài** = bài đang tick ∪ bài đứng trước bài tick xa nhất (đúng phạm vi OMNI đang dùng để lọc câu). `khoa` = `khoa_bai`, `ten` = `ten_bai` đã lưu lúc thầy tick.
- **Thứ tự** = `vi_tri` (app thầy đánh theo cây Dạy học đã sắp số chương rồi số bài — `dsBaiCuaKhoi`), cùng vị trí ⇒ theo `khoa`.
- **`tangMo`** = cổng mở tầng theo bài của động cơ (`tangCuaEm`, hanh-trinh-ngay.ts): tầng t mở khi ≥ 80% nhóm nội dung ở tầng t−1 của bài đã vững (thành thạo theo luật đóng lỗi, hoặc dạng vững OMNI). 1 = Nền, 2 = Hiểu, 3 = Vận dụng, 4 = Tổng hợp. Tầng nhỏ hơn `tangMo` đã vững, tầng lớn hơn còn khoá. Tính trên **câu ứng viên của ngày** thuộc bài (câu → bài qua mã tờ gốc của phạm vi), đúng dữ liệu động cơ dùng để xếp câu hôm nay. Bài không có câu ứng viên hôm nay ⇒ chưa có bằng chứng ⇒ 1 (luật "không có bằng chứng tầng trước thì không tự mở"). Cổng v5 theo từng câu (mở riêng câu L4 khi có bằng chứng cao) không thể hiện ở đây — `tangMo` là cổng theo bài.
- **`vung` = null ở bản này**: tổng số dạng của CẢ bài không có sẵn trong lượt Sảnh (ứng viên chỉ là cửa sổ xoay ≤ 96 câu/tầng; danh mục đầy đủ chỉ đọc khi động cơ chạy lại sau chặng). Báo "a/b dạng" trên mẫu cắt sẽ sai, nên để null.
- **Chi phí**: thuần, trên dữ liệu đã nạp (`hs.phamVi`, `hs.cau`, `hs.tt`, dạng vững). Test đếm lệnh D1 của Sảnh Hành trình: lần đầu ngày 129 · mở lại 36 · sau đủ sàn 36 — **y hệt bản trước** (`tests/hanh-trinh-bai-thu-suc-0910.test.ts`).
- Mã: `baiHanhTrinh` (server/src/hanh-trinh-bai.ts), gắn trong `lapChotHanhTrinh` (hanh-trinh-d1.ts), giữ qua `layKeHoachHomNay` (srs2-d1.ts).

## 2. Thử sức thêm khi chạy Hành trình

### Vì sao từng tắt (`tinhThuSucThem`, e0e8b5d)
Ngữ nghĩa cũ là "lấy TRƯỚC một lô câu mới của NGÀY MAI" = quota câu mới rải đều tới hạn chiến dịch. Hành trình có hạn 9999-12-31 và kế hoạch mỗi ngày chốt theo năng lực đầu ngày đó ⇒ không có "câu của ngày mai" để lấy trước. Thêm nữa, lô cũ nằm ngoài sàn: lần chọn lại sau chặng / sau lần sai mới chọn `toiThieu − đã làm` câu ⇒ cắt mất phần chưa làm của lô.

### Ngữ nghĩa mới (gần nhất, an toàn)
**Đủ mức tối thiểu hôm nay ⇒ em được lấy thêm MỘT chặng (≤ 6 câu) của HÔM NAY, không bắt buộc.** Nội dung mới làm hôm nay thì ngày mai không còn là mới, nên tác dụng "lấy trước" vẫn có.

- **Mở khi (mọi điều)**: đã làm ≥ sàn (`hanhTrinh.daLam ≥ toiThieu`), kế hoạch không còn câu chưa làm, không câu nào tạm giữ vì ca kiểm tra, đã mở Rương Bát Linh hôm nay (lô thêm không khoá lại rương đã mở — giống luật cũ), tổng hôm nay chưa chạm trần.
- **Cỡ lô / trần**: `min(6, 2 × sàn − tổng đã xếp)` — trần ngày 48/60/72 câu, cùng tỉ lệ trần Huyết Chiến (2 × thể lực). Bấm nhiều lần được, mỗi lần một chặng.
- **Chọn câu**: chính bộ chọn Hành trình `chonCauHanhTrinh` với đúng đầu vào của lần chọn lại sau chặng — cổng tầng theo bài + tầng từng câu của bộ chọn v5, câu/nhóm động cơ chặn (thiếu tiên quyết, ngoài phạm vi đã dạy), lịch half-life, trọng số OMNI + động cơ, vai L4 nhóm B. Động cơ chạy **chỉ đọc** (`ghi=false`): không receipt can thiệp, không nhật ký quyết định A/B, không đổi mô hình. Loại: câu tự luận, câu/nhóm bảo vệ cho ca chưa công bố, câu nghi đáp án, câu đã cắt tỉa, câu ôn chưa đến hạn, mọi câu và nhóm nội dung đã xếp hoặc đã làm hôm nay (mọi kênh tính lượt). Đúng khối do cửa sổ ứng viên + cổng khối của hồ sơ. Câu mới / ôn Phần II ⇒ Đảo, ôn Phần I/III ⇒ Đoàn (đúng luồng bộ chọn).
- **Giữ lô khi động cơ chọn lại**: `lapChotHanhTrinh` chọn lại phần chưa làm theo `mucNgayHanhTrinh(sàn, tổng kế hoạch đã chốt)` = `max(sàn, min(tổng, 2 × sàn))` (chỉ khi cùng chiến dịch). Phần em tự lấy thêm không bị cắt; câu chưa làm của lô vẫn có thể được chọn lại sau lần sai mới như mọi câu khác (không đổi phần đã làm).
- **Hai máy**: ghi so-khớp `dao_json`/`doan_json` (như lệnh cũ) ⇒ bấm cùng lúc chỉ một lô vào; máy thua nhận `{ ok:true, them:0, lapLai:true }` hoặc `chua_xong`.
- **Không đổi**: sàn chốt đầu ngày (`hanh_trinh_v3_ngay.tang/toi_thieu`), `hanhTrinh.soChang/changHienTai/conThieu` vẫn theo sàn, chặng 6 câu, đếm "mỗi nội dung một lần/ngày", chấm điểm, EXP, sổ học, rương một lần/ngày. Lệnh `hoa2-sanh` không thêm truy vấn (số ở mục 1).
- **`thuSucThem.soCau` ở Sảnh là ước lượng rẻ** (cổng theo bài, không chạy động cơ v5 trên đường nóng). Lệnh `hoa2-thu-suc-them` chọn lại bằng động cơ đầy đủ nên có thể thêm ít hơn; trả `them` = số câu thật. Không còn câu hợp lệ ⇒ `{ ok:false, ma:'het_cau_hop_le', error:'Hôm nay chưa còn câu phù hợp với em để thử sức thêm.' }`.
- Mã: `tinhThuSucThem` + `thuSucThem` (srs2-d1.ts), `chonLoThuSucHanhTrinh` (hanh-trinh-d1.ts), `chonLoThem` / `coLoThuSucHanhTrinh` / `mucNgayHanhTrinh` (hanh-trinh-bai.ts, hanh-trinh-ngay.ts).

### Việc cho phía app (làn khác)
Khi Sảnh có `hanhTrinh`, nút Thử sức thêm không nên ghi "Lấy trước N câu mới của ngày mai" — nghĩa đúng là "thêm N câu hôm nay (không bắt buộc)". Trong lúc làm lô thêm, `hanhTrinh.daLam ≥ toiThieu` (thẻ ghi "Đã hoàn thành nhiệm vụ hôm nay"); số câu còn của lô đọc ở `theLuc.con`.

## 3. Kiểm tra
- `tests/hanh-trinh-bai-thu-suc-0910.test.ts` (10 kiểm, D1 thật node:sqlite): thứ tự/tên/`tangMo` theo cổng 80%, vắng khi không phải Hành trình hoặc chưa có phạm vi; Thử sức: chưa đủ sàn ⇒ không, đủ sàn + mở rương ⇒ 6 câu hợp lệ (đúng phạm vi, không tự luận, không trùng câu/nhóm đã xếp/đã làm kể cả kênh luyện), Đảo phát đúng lô; lô giữ qua lần sai mới; lặp tới trần 48 rồi `du_tran`; hai máy một lô; máy khác ghi giữa chừng ⇒ không ghi đè; chưa mở rương ⇒ chưa cho; bộ chọn thuần; đếm lệnh D1 của Sảnh không tăng.
- `npx tsc --noEmit -p server/tsconfig.json` đạt. Bộ `tests/hanh-trinh-*.test.ts tests/hoa2-*.test.ts* tests/thu-suc-them-3009.test.ts tests/sanh-thu-suc-them-3009.test.tsx tests/bat-linh-hanh-trinh-3009.test.tsx`: 149 đạt / 1 đỏ — đỏ duy nhất `thu-suc-them-3009 > bộ lọc câu > (6)` đã đỏ y hệt trên bản gốc 69a0731 trước khi sửa.
