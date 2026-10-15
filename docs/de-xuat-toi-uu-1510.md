# Đề xuất tối ưu toàn app · 15/10/2026 — CHƯA BUILD, chờ thầy chọn

Thầy hỏi: "giờ quét toàn app xem tối ưu thân thiện nhất được gì không, tối ưu máy chủ tốc độ load app rút câu mọi thứ, đề xuất cho tôi trước khi build nhé".

Đã quét 5 mặt, **chỉ đọc**, có số đo thật:
1. Thân thiện app học sinh.
2. Thân thiện app phụ huynh + giáo viên.
3. Truy vấn D1 nặng nhất giờ cao điểm 14/10 (run `38590197763`).
4. Số đợt chờ D1 nối tiếp của các lệnh nóng (đo bằng khung `tests/toc-do-may-chu-lenh-nong-1310.test.ts`).
5. Byte tải mở từng app (bản build + sourcemap).

Chỗ nào là ước lượng thì có ghi rõ cách tính.

## Số đo nền
- **Giờ cao điểm 14/10, 19:30–22:30:**
  - Worker: 37.102 yêu cầu, 0 lỗi; p50 0,033 s · p90 0,273 s · p99 1,00 s.
  - CPU p99 510 ms.
  - D1 (50 nhóm truy vấn đầu): 1.047 s.
  - Tem kho câu không đổi từ 07/10. Vì vậy đệm bị trượt là do isolate mới hoặc isolate chết, không phải do thầy sửa kho.
- **Đợt chờ D1 nối tiếp** (đo được):

  | Lệnh | Đợt / lệnh D1 |
  |---|---|
  | Sảnh lần đầu | 29 / 35 |
  | Isolate ấm, em mở lần đầu trong ngày | 13 / 15 |
  | Sảnh lần sau | 6 / 9 |
  | Mở chặng (rút câu) | 10 / 15 |
  | Nộp câu | 9 / 12 (câu thường 5) |

- **Byte mở app (nén):**

  | App | Byte | Trong đó |
  |---|---|---|
  | Giáo viên | 264 KB | |
  | Học sinh | 322 KB | Khối `index` 61 KB, riêng React ~55 KB |
  | Phụ huynh | 259 KB | |

## Gói A — Sửa lỗi thật (không đổi giao diện, công sức S, làm được ngay)
| # | Lỗi | Bằng chứng | Cách sửa |
|---|---|---|---|
| A1 | Thẻ đăng nhập học sinh mất nền. Ô nhập 14 px nên iPhone tự phóng to; chữ phụ 11 px | `bat-linh.css:4-15,73-88` dùng `--bl-*`, biến chỉ khai báo cho `.bl-app` / `body[data-bat-linh]`. Ở `/hs` trang mang `data-hoc-tap` (`BatLinhShell.tsx:13`) | Cho luật đăng nhập áp cả `.ht-shell`, dùng biến `--the/--vien/--muc` sẵn có |
| A2 | Nút "Giao bài riêng" không chạy khi bật Game Hoá 2.0: bấm là bị đưa về Hôm nay | `ToanCanhEmScreen.tsx:159`, `ca-thi/BaoCaoChiTiet.tsx:673` mở màn `giaobtvn` đã ẩn ở 2.0 (`App.tsx:222-225`) | Ẩn nút khi 2.0 bật, như `HocSinhScreen.tsx:399`; "Cho thi lại" làm nút chính |
| A3 | Sảnh báo lỗi "Cannot read properties of null" với em có Gói 7 mà không thuộc chiến dịch hành trình | `hanh-trinh-dong-co.ts:210` `hs.chienDich!.id`. 243 em đo sáng 15/10 chưa em nào gặp; em mới vào lớp sẽ gặp | Bỏ dấu `!`, khi không có chiến dịch thì không ghi `omni_du_bao` |
| A4 | Màn em hiện nhãn năng lực "Có dấu hiệu đối phó" (trái luật A1.7) | `HoSoLamCauEm.tsx:600-604`; máy chủ vẫn gửi `coDoiPho` cho bản học sinh (`bai-hang-ngay.ts:795`) | Lọc ở bản học sinh; app thầy giữ nguyên |
| A5 | Chữ lệch chuẩn nhỏ | Lộ mã câu "Câu ${qid}" (`HoSoLamCauEm.tsx:114`); "Hệ thống" làm chủ ngữ (`HocTapHomNay.tsx:141`); ô nhập thiếu `aria-label` (`HoiThemThay.tsx:102`); lỗi soi G03 (`hop-hoi-thay.css:81`) | Sửa chữ. Test khoá chuỗi thì sửa có chủ ý |

## Gói B — Máy chủ nhanh hơn giờ cao điểm (không đổi giao diện)
Tiết kiệm ước tính = số lần × (ms cũ − ms mới). "ms mới" lấy tỉ lệ đo trên SQLite cục bộ cùng chỉ mục thật. Trước khi làm, xác nhận bằng `EXPLAIN QUERY PLAN` trên D1 thật. Mọi thay đổi đều chỉ-thêm (bảng mới, `CREATE INDEX` chạy bằng cron đêm 00:01).

| # | Việc | Nguồn | Ước tiết kiệm / 3 giờ cao điểm | Công |
|---|---|---|---|---|
| B1 | 3 chỉ mục còn thiếu: `cau_bo_tro(qid_mau)` (đang quét cả bảng), chỉ mục phủ `hanh_trinh_v4_canh`, `su_kien_hoc(sbd,luc,khoa)` | `omni-d1.ts:315`, `hanh-trinh-dong-co.ts:50`, `exp-d1.ts:100` | ~48 s | S |
| B2 | Bảng siêu dữ liệu câu tính sẵn `cau_meta` (không chứa đáp án), ghi ở đường lập chỉ mục duy nhất. Thay hai truy vấn gọi nhiều nhất (5.980 + 8.830 lần) | `srs2-d1.ts:336`, `omni-d1.ts:217`, `game-v2-bank.ts:71` | ~120 s | M |
| B3 | Nhịp học của thầy: ngày đã qua thì tính sẵn lúc 00:01, chỉ tính hôm nay. Hiện mỗi lần 0,57 s × 188 nghìn dòng, sẽ tăng ~×4,4 tới cuối tháng 11 | `nhip-hoc.ts:179` | ~70 s, và không tăng theo ngày | M |
| B4 | Đệm danh mục Hành trình và sổ học: dấu đúng, hạn dài hơn, lưu dòng gọn | `hanh-trinh-v5-d1.ts:69`, `omni-d1.ts:458` | ~60 s | S–M |
| B5 | Thi đua: ngày đã qua đi chỉ mục phủ, đệm tới nửa đêm | `thi-dua-hom-nay.ts:273` | ~12 s | S |

**Tổng B1–B5:** ~310 s trên 1.047 s D1, khoảng −30% (ước).

## Gói R — Rút câu: bớt đợt chờ nối tiếp (em thấy app mở và phát câu nhanh hơn)
Đã liệt kê từng đợt. Đề xuất theo thứ tự đợt giảm được:
1. **Gộp mọi lệnh "tạo bảng" thành một nhóm đầu lượt**, hoặc chuyển vào migration chỉ-thêm.
2. **Dồn các lệnh ghi về cuối thành một batch**, theo mẫu `ghiTre` có sẵn.
3. **Đọc kho câu một đợt.**
4. **Lấy lớp theo SBD bằng truy vấn con**, không đọc cả bảng `hoc_sinh`.
5. **Hồ sơ game lần đầu:** tạo + đọc lại trong một batch.
6. **Dùng lại dòng chiến dịch đã đọc.**
7. **Gộp nguồn khối vào truy vấn meta.**
8. **Việc chạy nền ghi qua D1 gốc**, không qua hàng chờ ghi chung.

**Số đợt dự kiến sau sửa (ước, sẽ đo lại bằng cổng tốc độ, mốc chỉ hạ):**

| Lệnh | Hiện tại | Sau sửa |
|---|---|---|
| Sảnh lần đầu | 29 | ~12 |
| Isolate ấm | 13 | ~4 |
| Sảnh lần sau | 6 | 3 |
| Mở chặng | 10 | 4–5 |
| Nộp câu | 9 | 4 |
| Nộp câu thường | 5 | 3 |

**Rủi ro cần giữ:**
- Thứ tự ghi, `revision` hồ sơ.
- "Đọc lại dòng thắng" phải nằm cùng batch với INSERT.
- Lỗi một lệnh trong batch thì huỷ cả batch, nên `chotMucNgay7` phải giữ cách nuốt lỗi.

Công sức M, làm từng bước nhỏ, mỗi bước qua cổng tốc độ.

## Gói C — App mở nhanh hơn (không đổi giao diện)
| # | Việc | Số đo | Công |
|---|---|---|---|
| C1 | Tách React (react-dom + scheduler + react) thành mảnh riêng, mã băm ổn định | ~57 KB nén hiện nằm chung khối `index`. Khối này gần như đổi mỗi lần phát hành vì chứa danh sách mảnh, nên máy em tải lại React mỗi lần (14/10 có 9 lần phát hành) | S |
| C2 | Nạp lười mã ít dùng đang nằm trong mảnh chung nạp khi mở **cả 3 app** | Hình thí nghiệm `experiments/expanded` ~6,4 · nhập đề `exam-kho-de-import` ~3,5 · nén zip `fflate` ~2,8 · xuất PDF `bai-tap-pdf` ~1,8 KB… Tổng ~14–18 KB nén mỗi app | S–M |
| C3 | Nạp lười các phần màn học sinh chỉ mở khi bấm | "Khắc phục 3 chế độ" ~11,6 · Bài gia đình giao ~2,2 · Thông báo ~2,2 · Bài tập về nhà ~1,3 KB nén. Tổng ~15–17 KB | S |
| C4 | (ưu tiên thấp) Tách CSS riêng app thầy khỏi CSS chung | Chỉ ~3,9 KB nén | S |

**Kết quả dự kiến:** lần mở đầu app học sinh 322 KB còn ~290 KB nén (−10%). Sau mỗi lần phát hành, không phải tải lại ~57 KB React.

## Gói D — Thân thiện (đổi giao diện ⇒ vẽ cho thầy duyệt trước, quy trình 4 bước)
**Học sinh**
- D1. Bốn đường để sửa câu sai, mỗi chỗ một tên: Tự sửa lỗi · Sửa câu sai/Dạng câu sai trong Tu luyện · "Luyện lại từ bài kiểm tra" · Luyện đề hai bản. Đề xuất: Ôn & sửa chỉ còn Tự sửa lỗi · Câu đã làm · Tu luyện. (M–L)
- D2. Tab Kết quả có 2 dòng mở cùng một danh sách "Lịch sử ca kiểm tra". Gộp làm một; có thể bỏ tab, thanh dưới còn 3 mục. Luật công bố điểm giữ nguyên. (M)
- D3. Thẻ "Bài học trong 7 ngày" ở Hôm nay lặp tab Hành trình và thêm con số thứ hai ("Câu mới hôm nay g/q"). Đề xuất bỏ. (S)
- D4. Trả lời sai xong có 5 nút gần nhau; "Sửa câu này" và "Chữa câu sai từng bước" mở cùng một màn. Gộp làm một. (S)
- D5. Đưa Bài tập về nhà lên ngay dưới thẻ Hôm nay, kèm hạn nộp gần nhất. (S–M)
- D6. Khối Nhịp học trong thẻ Hôm nay quá dày: thu về một dòng, bấm mới mở. (M)
- D7. "Thông tin từ gia đình" đang mở cả bảng tin cũ (lặp điểm, bài tập về nhà, vào thi…). Chỉ giữ lời nhắn của gia đình. (M)
- D8. Thanh trên khổ 360–420 px chen 5 thứ: chuyển nút làm mới vào tấm "Của em". Giữ nguyên "Vào ca kiểm tra". (S)
- D9. Bỏ nút "Đóng" trùng "Về Hôm nay" ở các màn con. (S)

**Phụ huynh**
- Số 14 ngày hiện 2 lần trên một trang.
- Màn Tiến bộ lặp trang chính.
- Thanh mục 9 phần, nên gộp còn 5.
- Mất mạng thì hiện 5 hộp lỗi, nên gộp thành 1 dải "Tải lại".
- Màn "Thông tin và giao diện" không có gì mới.
- Chữ "bậc" mang 2 nghĩa.
- Mã chết `ph-moi/**`.

**Giáo viên**
- Một em có 3 kiểu hồ sơ, nên gộp một tấm.
- "Cần thầy chữa" mang 4 tên.
- Hôm nay: nút góc phải trùng thẻ đầu.
- Ca kiểm tra: ca đang mở bị đẩy xuống dưới 3 thẻ số.
- Bảng "Kiểm tra ôn tập" lạc chỗ (làn Codex).
- Kho đề: thẻ kỹ thuật đứng ngang nút chính.
- Nhịp học quá dày khi thầy cầm điện thoại.

## Cần thầy quyết
- **Chữ "Lười"** (nhóm Lười) đang hiện cho học sinh và phụ huynh. Bảng từ chuẩn A2 không dùng chữ này, nhưng thầy đã chốt ở đợt 16. Giữ hay đổi?

## Đề xuất thứ tự
1. **Đợt 1:** A1–A5 + B1 + C1–C3, không đổi giao diện, rủi ro thấp, đo được bằng cổng.
2. **Đợt 2:** Gói R và B2–B5 (máy chủ), làm từng bước nhỏ, mỗi bước qua cổng tốc độ.
3. **Đợt 3:** vẽ các mục Gói D thầy chọn, theo quy trình 4 bước.

Phát hành trước 19:00, không trùng ca đang mở.

Số liệu chi tiết từng truy vấn và từng đợt nằm trong scratchpad của phiên (bản đo `do-dot/`, `qp/`). Số trong tệp này là số đã tổng hợp.
