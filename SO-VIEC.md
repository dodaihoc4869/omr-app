# SỔ VIỆC — 14/09 lượt 11 · ĐỒNG BỘ KHO SANG MÁY HỌC SINH

- [x] "Bạn phải đồng bộ sang máy học sinh. Sửa hoàn thành 100% đi nhé" — chế độ 2 và 3 của màn Khắc phục câu sai phải chạy được trên máy em, không chỉ máy thầy  | bằng chứng: `vitest run tests/dong-bo-kho-sang-may-em-1409.test.ts` 8/8
- [x] "Lời giải hiện trong mục chiếu lên bảng bị lỗi"  | bằng chứng: `vitest run tests/may-chieu-len-bang-1409.test.ts` 12/12
- [ ] Nghiệm thu 7 cửa + phát hành  | bằng chứng: (chưa có)

## Vì sao chưa chạy (đã truy lượt 9)

Chế độ 2/3 rút câu từ `loadExamSources()` — kho đề trong IndexedDB của CHÍNH
MÁY. Kho ấy chỉ do `dongBoNganHang` nạp, mà hàm ấy đòi mã bí mật của thầy
(`src/lib/exam-sync.ts`: "học sinh vẫn chỉ nhận bản không đáp án qua mã ca").
Máy em không có mã ⇒ kho LUÔN rỗng.

CẤM đẩy cả kho xuống máy em: 157 tờ, 4,3 GB, và có đáp án. Đường đúng là máy
chủ rút hộ — em gửi lên danh sách câu sai, máy chủ trả về đúng số câu CÙNG MÃ
DẠNG cần để luyện, không hơn.

## Chặn đường

`cau_hoi` trong D1 chỉ có `chuyen_de`, `muc_do`, `phan`, `lop`, `ma_de`,
`co_loi_giai` — KHÔNG có mã dạng, nên không truy vấn theo dạng được.

## CÁCH SỬA (lượt 11)

### 1. Đồng bộ kho sang máy học sinh — `src/lib/kho-cho-may-em.ts`

KHÔNG chép kho xuống máy em (157 tờ, 4,3 GB, có đáp án). Máy chủ rút hộ:
em gửi chuyên đề của câu vừa sai → lệnh HỌC SINH `cauKhacPhuc` (không cần mã
bí mật) trả gói câu cùng chuyên đề → máy em lọc theo MÃ DẠNG bằng đúng
`phanTichTyLeDang` đang chạy trên máy thầy.

Gói đi qua ĐÚNG cửa nạp `parseKhoDeJson` → `buildTeacherSourceFromKhoDe`,
không nới luật nào — giống hệt đường `ExamTakeScreen` đã dùng từ trước.

Đo thật trên bản live, ca Test6: **1 gói · 395 KB · 0,44 giây · 175 câu ·
19 mã dạng**.

Hai chốt chống lỗi tự gây:
- deps của effect khoá theo NỘI DUNG câu sai, không theo tham chiếu mảng —
  để prop mảng đổi tham chiếu mỗi lượt vẽ không thành vòng xin máy chủ vô hạn.
- đang xin kho thì nói "Đang lấy câu cùng dạng từ máy chủ…", không để em nhìn
  "Tỷ lệ tối đa: 0 câu" rồi tưởng hỏng.

### 2. Lời giải trong tờ máy chiếu bị lỗi

NGUYÊN NHÂN GỐC: `oGiaiHtml` trả về `<div class="sol-box">`, mà `CSS_PHIEU` để
khối ấy `opacity: 0; transform: translateY(-6px)` và CHỈ trả lại bằng luật
`.q-card.mo .sol-box`. Tờ chiếu dựng nửa bảng chứ không dựng thẻ câu, nên không
có tổ tiên `.q-card.mo` nào — lời giải nằm đó mà mắt không thấy.

Sửa: `CSS_MAY_CHIEU` thêm `.mc-giai .sol-box { opacity: 1 !important;
transform: none !important; margin: 0 }`.

### 3. Lọc theo MÃ DẠNG ngay trên máy chủ (đợt sửa thứ hai)

Đo bản live sau đợt một: em sai 9 dạng mà chỉ 1 dạng có câu luyện (6 ứng viên).
Nguyên nhân: `cauKhacPhucGoi` gom câu theo CHUYÊN ĐỀ rồi xếp tờ đề theo số câu
dùng được và lấy đủ `soCau` từ tờ ĐẦU — tối ưu "ít byte nhất cho N câu", đúng
với việc nó sinh ra (dựng phiếu bài tập), nhưng màn khắc phục cần vùng chọn
rộng theo DẠNG, mà dạng rải khắp các tờ.

Sửa:
- `hsCauSai` trả thêm `dangMa` (mã dạng riêng, không chỉ tên).
- `cauKhacPhucGoi` nhận `dsDang`: mở tới 10 tờ đề, mỗi tờ CẮT còn đúng câu cùng
  mã dạng, chia đều theo vòng tròn qua từng dạng. Gói trả về vì thế NHỎ hơn
  đường cũ dù đọc nhiều tờ hơn. Dạng nào không có câu thì trả trong `dangThieu`.
- Đường cũ (không gửi `dsDang`) GIỮ NGUYÊN — màn làm bài vẫn dùng nó.
- `layNhanDanCauSai` ưu tiên MÃ dạng máy chủ trả kèm; máy em không có kho nên
  không dựng được `banDo`, khớp theo tên là khớp hớ.
