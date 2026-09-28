# Rà soát luồng CA KIỂM TRA + bản vẽ mới (28/09/2026)

Bản vẽ: `CaThi-Moi.html` (mở bằng trình duyệt, thanh trên chọn màn a–e, nút Sáng/Tối/Theo máy). Ảnh 1440×900: `anh-a.jpg` … `anh-e.jpg`. Số liệu trong bản vẽ đều là VÍ DỤ.

## 1. Luồng hiện tại (mã trên `main` 2b22e57)
| Bước | Màn / tệp | Có gì |
|---|---|---|
| Danh sách ca | `src/screens/LichSuCaScreen.tsx` (843 dòng) | bảng ca: tên, mã, lớp, ngày, tỉ lệ nộp, nhãn trạng thái → chạm mở Chi tiết ca |
| Mở ca | `src/screens/ExamSetupScreen.tsx` (1166 dòng) | 3 thẻ dọc: Đề (484) · Lớp & thời gian (534) · Quy chế & bảo mật (666: phạm vi, phòng chờ, đồng bộ giờ, giữ để đọc, công bố điểm 789, hạn vào phòng) + 4 hộp phủ (chọn đề 883, rút đề 932, chọn em 973, nâng cao 1054) → nút Mở ca (857) → màn "đã mở" có link + mã ca (420–455) |
| Theo dõi ca | `src/screens/ExamMonitorScreen.tsx` (2108 dòng) | thông tin ca (1248), 3 ô số Đã vào/Đã nộp/Cảnh báo (1306–1311), phòng chờ + Bắt đầu thi (1322), cửa vào Mở/Khoá ca (1425–1506), 2 link (1510), câu hỏi lại (1526), Xoá ca (1676), danh sách em có tiến độ x/y câu, rời màn, điểm, Mở khoá (1725–1880), câu hỏi của em (1954), báo phụ huynh (1972), tự làm mới 20 s (625) |
| Chấm | cùng tệp, `ghiDiem` (594) | chấm ở MÁY THẦY bằng ngân hàng có đáp án rồi ghi điểm lên máy chủ |
| Kết quả lớp | `src/components/xem-diem-gv/BaoCaoCaLop.tsx` + `src/lib/bao-cao-ca-lop.ts`; máy chủ `/gv/bao-cao-ca` (`server/src/bao-cao-ca.ts`) | TB/cao/thấp, thời gian TB, phổ điểm, ba phần, dạng vấp, câu sai nhiều, em cần để ý — nằm trong khối GẬP ở cuối màn Theo dõi (ExamMonitor 1724) |
| Báo cáo một em (thầy) | `src/components/xem-diem-gv/BaoCaoMotEm.tsx`; `/gv/bao-cao-ca-em` | so cả lớp, ba phần, theo dạng, câu cần xem lại, tiến bộ qua các ca, việc tiếp theo |
| HS sau nộp | `ExamTakeScreen.tsx` 2878–2960 → `src/components/xem-diem/KetQuaSauNop.tsx` | 3 trạng thái: đã công bố / chờ cả lớp / thầy chưa công bố |
| Báo cáo HS/PH cũ | `src/components/BaoCaoCaThiHocSinhModal.tsx` (620), `BaoCaoCaThiPhuHuynhModal.tsx` (697), `src/screens/PhieuScreen.tsx` + `PhieuV3.tsx` (trang PH mở từ Zalo) | ba kiểu báo cáo khác nhau cho cùng một ca |

## 2. Vấn đề
| # | Màn | Vấn đề | Bằng chứng | Mức |
|---|---|---|---|---|
| 1 | Mở ca → HS | Chọn "Không công bố trên máy em" thì KHÔNG có đường nào công bố về sau: máy chủ không có lệnh đổi `cong_bo` (không câu `UPDATE … cong_bo` trong `server/src`), em mãi thấy "Thầy chưa công bố điểm" | `ExamSetupScreen.tsx:118-121`, `server/src/cong-bo-diem.ts:1-4`, `KetQuaSauNop.tsx:2` | Cao |
| 2 | Theo dõi | Một màn gánh ~12 khối xếp dọc (phòng chờ, cửa vào, 2 link, câu hỏi lại, xoá ca, danh sách em, câu hỏi, báo PH, báo cáo lớp, chiến dịch); việc gấp (em bị khoá) lẫn trong danh sách | `ExamMonitorScreen.tsx:1248-2031` | Cao |
| 3 | Theo dõi | Chỉ 3 ô số; không có "Chưa vào", không đồng hồ ca, không thanh tổng cả lớp | `ExamMonitorScreen.tsx:1306-1311` | Vừa |
| 4 | Kết quả | Kết quả lớp là khối GẬP ở cuối màn Theo dõi, ca đang mở thì đóng sẵn — thầy xong ca không có "màn kết quả" riêng | `ExamMonitorScreen.tsx:1724`, `BaoCaoCaLop.tsx:277-296` | Cao |
| 5 | Báo cáo | Không có bản in/PDF A4 cho báo cáo lớp / báo cáo em của thầy (không `@media print`, không `window.print` trong `xem-diem-gv/`) | `src/components/xem-diem-gv/*` | Cao |
| 6 | Báo cáo | Ba bộ báo cáo song song cho cùng một ca (xem-diem-gv, modal HS/PH cũ, PhieuV3) — ba phong cách, trái luật C4/C11 | 3 tệp ở mục 1 | Vừa |
| 7 | Báo cáo lớp | Không có bảng điểm cả lớp (hạng, điểm, đúng x/y, thời gian, so lần trước) dù máy chủ trả `hocSinh[]`; không có bản đồ đúng–sai em × câu | `docs/hop-dong-xem-diem-v2-2109.md` mục 4; `BaoCaoCaLop.tsx` chỉ 6 khối | Vừa |
| 8 | Mở ca | Chống gian lận chia 2 chỗ (thẻ 3 + hộp "nâng cao"), không có tóm tắt/xem trước ca trước khi bấm Mở | `ExamSetupScreen.tsx:666-790, 1054-1160` | Vừa |
| 9 | Theo dõi | Không cộng giờ được cho một em (chỉ Mở khoá) | `ExamMonitorScreen.tsx:649` | Thấp |
| 10 | Mã | Chú thích sai: "MODAL BÁO CÁO CA THI…" nhưng thân là tấm Chiếu mã | `ExamMonitorScreen.tsx:2031-2033` | Thấp |

## 3. Bản mới sửa thế nào
- **(a) Mở ca**: 4 bước đánh số (Đề · Ai làm · Giờ · Luật) trên MỘT tấm, chip có giá trị sẵn; chống gian lận hiện thành nhãn tóm tắt, chi tiết trong "Thêm tuỳ chọn…". Cột phải: vé "Xem trước" (đề, số câu, ai làm, thời gian, công bố, dòng thời gian Mở → Hết giờ vào → Em cuối nộp) + MỘT nút chính "Mở ca kiểm tra". Luật công bố có lựa chọn "Thầy công bố sau".
- **(b) Theo dõi**: đầu trang = tên ca, link + Chép link, đồng hồ vòng; 4 ô tông màu Đang làm/Đã nộp/Chưa vào/Cảnh báo + thanh tổng 34 em; cột phải "Cần thầy xử lý" (khoá bài → Mở khoá; rời màn; chưa vào) + Việc nhanh (Chiếu mã, Đóng cửa vào, Kết thúc ca có câu nói hậu quả). Lưới thẻ em có lọc. Điện thoại: khối xử lý lên trước danh sách.
- **(c) Kết thúc ca**: màn riêng tự mở khi khoá ca. Dải "Công bố điểm cho 32 em" (nếu ca chưa công bố), số TB to, cao/thấp/thời gian, phổ điểm 10 cột tô theo mức, top câu sai (đáp án đúng + đáp án sai nhiều nhất), em cần để ý, ba phần.
- **(d) Báo cáo chi tiết** (thay xem-diem-gv + modal cũ): 2 tab Cả lớp / Từng em. Lớp: 4 ô số, bản đồ đúng–sai em × câu, bảng điểm (bấm tên → báo cáo em), dạng vấp, "A.I Đỗ Đại Học đã lo". Em: vòng điểm, đúng x/y, hạng, thời gian, rời màn, so lần trước, ô từng câu theo 3 phần, theo dạng (↑/↓ bậc), câu cần xem lại (em chọn / đáp án đúng / giây so cả lớp / ngày ôn lại), nhận xét của thầy. Nút In / Lưu PDF → `@media print` A4: bỏ khung app, lớp và em mỗi thứ sang trang riêng, giữ màu ô.
- **(e) Học sinh**: kính sáng/tối như Sảnh 3D; đã công bố: vòng điểm, chip so lần trước của em, đúng x/y, thời gian, EXP, ba phần, ô từng câu, "A.I Đỗ Đại Học đã lo", MỘT nút "Xem lại 5 câu sai". Chưa công bố: chỉ "Em đã nộp bài", a/b bạn đã nộp — không điểm/đáp án. Không xếp hạng trên màn học sinh.

## 4. Dữ liệu cần thêm API
| Cần | Vì sao | Đề xuất |
|---|---|---|
| Đổi luật công bố sau khi mở ca | vấn đề #1, nút "Công bố điểm" ở (c) | `POST /gv/cong-bo-ca {maCa, congBo:'ngay'}` (chỉ ghi cột `ca.cong_bo`, không đổi schema) |
| TB lớp của ca trước | ô "So với ca trước" ở (d) | thêm `tongQuan.tbCaTruoc` vào `/gv/bao-cao-ca` (ca đã công bố liền trước cùng lớp) |
| Lưu nhận xét của thầy theo em + ca | (d) nhận xét, in PDF, gửi PH | `POST /gv/nhan-xet-ca-em {maCa, sbd, noiDung}` + trả trong `/gv/bao-cao-ca-em` và `/ph/bao-cao-ca` |
| Số "Chưa vào" | (b) | có sẵn khi phạm vi là danh sách lớp (danh sách mời − lượt); ca "mọi em có link" thì ẩn ô này |
| Bảng đúng–sai em × câu | (d) bản đồ | có sẵn `chi_tiet_cau`; cần `/gv/bao-cao-ca` trả thêm `maTran: [{sbd, kq:"DDSB…"}]` để không phải chấm lại ở máy thầy |
| Cộng giờ cho một em (tuỳ chọn) | vấn đề #9 | `POST /gv/cong-gio {maCa, sbd, phut}` — để sau, chưa vẽ nút |

Mọi số khác trong bản vẽ đã có trong `bao-cao-ca-lop.ts`, `bao-cao-mot-em.ts`, `LuotThiRow` (`src/lib/exam-api.ts:2247`) hoặc hợp đồng `docs/hop-dong-xem-diem-v2-2109.md`.

## 5. Kiểm
Chromium 1194: 1440×900 (sáng) và 390×844 (tối) cả 5 màn — console 0 lỗi (phông Google chặn ở máy kiểm, thay bằng phông hệ thống), không cuộn ngang (`scrollWidth` = bề ngang), bảng/bản đồ rộng cuộn trong khung riêng. Bản in (d) ra PDF A4 5 trang.
