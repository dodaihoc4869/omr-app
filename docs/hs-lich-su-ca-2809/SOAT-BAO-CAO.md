# Soát báo cáo chi tiết ca kiểm tra phía học sinh (28/09)

Ảnh (Chromium thật, dữ liệu giả, chặn mạng): `/tmp/claude-0/-home-user-omr-app/372d898c-b8fd-5f51-b347-5c27b972161c/scratchpad/baocao/`
(`a1-*` tổng quan · `a2-*` danh sách câu · `a3-cau-{1,2,3}-*` câu 3 / 20 / 24 mở lời giải · `a4-chuan-cau-*` CÙNG câu vẽ bằng khuôn Câu đã làm).

## 1. Báo cáo đang có là gì, mở từ đâu

| Mục | Hiện trạng |
|---|---|
| Màn | `src/components/BaoCaoCaThiHocSinhModal.tsx` — tấm phủ 4 thẻ: Tổng quan 3 phần · Câu sai cần chữa · Mức độ nhận thức · Mức tiến bộ |
| Câu + lời giải | `DongCauSai` → `KhoiCauSai` (`ThanCauSai` + `LoiGiaiCauSai`) trong `src/components/KhoiCauSai.tsx` |
| Mở từ | `StudentPortalScreen` tab `diem` (`LichSuCaM3` → "Xem báo cáo") — tab này **chỉ có đường vào từ Bảng nhiệm vụ cũ**; Sảnh bản đồ (Hoá 2.0) **không có lối vào** |
| API | `POST /hs/lich-su` (`hsLichSuCa`, `server/src/goi-cu.ts`) và `POST /hs/cau-sai` (`hsCauSai`) |
| Luật công bố | Đạt: cả hai lệnh đọc `docTrangThaiCongBo`; ca chưa công bố KHÔNG có điểm/số câu (đưa vào `chuaCongBo[]`), câu + đáp án + lời giải của ca chưa công bố KHÔNG rời máy chủ |
| Lưu ý an ninh (có sẵn, không đổi trong đợt này) | Hai lệnh nhận `sbd` trần, không đòi token em ⇒ ai biết SBD đọc được điểm ĐÃ CÔNG BỐ của em đó. Đề nghị Boss xếp việc riêng: đòi token cổng học sinh (app PH cũ cũng gọi `/hs/lich-su`) |

## 2. Bảng lệch chuẩn (chuẩn = `TheCau` chế độ `xem_lai` qua `propsTheCau` của Câu đã làm, và `LoiGiaiCauSai hoaHoc` của game)

| # | Chỗ | Hiện tại | Chuẩn | Ảnh |
|---|---|---|---|---|
| 1 | Đề, phương án A–D, 4 ý Đ/S, ô bảng (`ThanCauSai`) | In chữ thô, KHÔNG qua `ChemText` | Mọi chữ Hoá qua `ChemText` | a3-cau-1 so a4-chuan-cau-3 |
| 2 | Chỉ số dưới Unicode (H₂SO₄, NH₃) | Giữ ₀–₉ ⇒ phông dự phòng, chữ bé, lệch dòng | `chiSoDuoiRo` đổi sang `_{n}` ⇒ `<sub>` cùng phông | a3-cau-1, a3-cau-2 |
| 3 | Sơ đồ phản ứng có điều kiện `→(+H₂, xt, t°)` | Hiện nguyên chuỗi, điều kiện không nằm trên mũi tên | Mũi tên có nhãn điều kiện ở trên (chem-format-so-do) | a3-cau-1 so a4-chuan-cau-3 |
| 4 | Ion (NH₄⁺, SO₄²⁻, Cu²⁺), số oxi hoá S⁺⁶ | Ký tự Unicode trên/dưới phông dự phòng | Chỉ số trên/dưới vẽ đúng phông | a3-cau-2 |
| 5 | Hộp lời giải (`LoiGiaiCauSai`) | Gọi KHÔNG có `hoaHoc` ⇒ "Kiến thức cốt lõi", lý do từng phương án/ý, từng bước đều chữ thô | Game gọi `hoaHoc` (ChemText); Câu đã làm dùng hộp LỜI GIẢI của `TheCau` (phương trình tách dòng riêng) | a3-cau-3 so a4-chuan-cau-24 |
| 6 | Phông đề | Sans 14 px trong hộp trắng | `.cau-de` serif 17 px, giãn dòng 1,9 như lúc làm bài | a3 so a4 |
| 7 | Hai khuôn lời giải khác nhau giữa báo cáo ca và Câu đã làm | Hộp vàng "Đáp án / KIẾN THỨC CỐT LÕI / VÌ SAO…" | Một khuôn `TheCau` (LỜI GIẢI → KIẾN THỨC CỐT LÕI → ✓✗ từng phương án/ý; Phần III từng bước + kết quả) | a3 so a4 |
| 8 | Đầu dòng câu ở 390 px | Tên chuyên đề bị cắt "Câu 24 (Phần III):…" | Đọc được chuyên đề (xuống dòng) | a3-cau-3-390 |
| 9 | Điểm | "7.25" dấu chấm | "7,25" (số kiểu Việt `soVn`) | a1 |
| 10 | Nhãn đầu báo cáo | "BÁO CÁO … (MÃ 260926)" — mã ca trên màn học sinh | Không mã nội bộ trên màn HS (chuẩn từ ngữ A1.4) | a1 |
| 11 | Thẻ "Mức độ nhận thức" | Tổng mỗi mức cứng 12/12/10/6, "đúng" = tổng − số sai ⇒ **số bịa** | Chỉ số thật từ bảng chấm; thiếu thì ẩn | (mã: `mucDoStats`) |
| 12 | Điểm từng phần khi máy chủ thiếu | Tự chia 45%/40%/15% điểm tổng ⇒ số bịa | Thiếu thì "--" | (mã: `diemI/II/III`) |

Đạt chuẩn: có "KIẾN THỨC CỐT LÕI" (`chot`), lý do từng phương án/ý, "LÀM TỪNG BƯỚC" Phần III, đáp án Phần III lấy `ket_qua`; ảnh + bảng đúng khuôn `.q-hinh`/`.q-bang`; câu bỏ trống có nhãn "Bỏ trống"; Phần II "đúng 2/4 ý · được 25% điểm câu".

## 3. Đã làm (phần B — đổi hướng theo thầy: "thay thế hết bằng bản mới")
- Báo cáo của em nay là **bản mới** `src/components/ca-thi/BaoCaoChiTiet.tsx` thêm chế độ `cheDo="hs"` (tab "Từng em" của chính em): không tab Cả lớp, không chọn em, không hạng/so lớp/rời màn, không mã ca, không ô sửa nhận xét. Nạp số bằng `src/components/ca-thi/BaoCaoCaCuaEm.tsx` (API sẵn có `/hs/lich-su` + `/hs/cau-da-thi`, đã lọc công bố phía máy chủ) và `src/lib/bao-cao-cua-em.ts`.
- #1–#8: "Câu cần chữa" bấm mở ⇒ đề + lời giải bằng ĐÚNG `TheCau` xem_lai qua `propsTheCau` (`CauCanChua.tsx`) — cùng khuôn Câu đã làm. Ảnh `a5-sau-*` so với `a3-*`.
- #9: điểm `soVn` ("7,25"). #10: không mã ca. #11: khối "Theo mức độ nhận thức" đếm số thật (`src/lib/muc-do-nhan-thuc.ts`), không có dữ liệu thì ẩn. #12: điểm phần thiếu thì không in (không chia tỉ lệ).
- Lối vào: Sảnh (thẻ "Ca kiểm tra gần nhất" → màn `hoa2/LichSuCaEm.tsx`), tab Xem điểm cũ, kết quả sau nộp (`ExamTakeScreen`) — đều mở bản mới. App phụ huynh ph-v3 dùng `/ph/bao-cao-ca` riêng, không dùng bản cũ.
- CÒN LẠI: `BaoCaoCaThiHocSinhModal.tsx`, `BaoCaoCaThiPhuHuynhModal.tsx`, `goi-bao-cao.ts`, `KhoiBaPhan.tsx`, `danh-gia-bai.ts` không còn nơi gọi nhưng CHƯA xoá (lệnh xoá tệp bị chặn quyền trong phiên này) — cần thầy/Boss cho phép xoá, kèm gỡ các test khoá bản cũ: `m3-c-hs-modal-1909`, `bao-cao-khong-ket-luan-nang-luc-1909`, `an-nhan-nang-luc-hs-ph-2109`, phần modal của `dong-nhat-bao-cao-1409`, `dem-cau-bao-cao-1409`, `khac-phuc-tren-dien-thoai-1409` (LỖI 1 phần modal).
