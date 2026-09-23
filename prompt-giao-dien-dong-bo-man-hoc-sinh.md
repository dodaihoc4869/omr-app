# Giao việc C — Đồng bộ giao diện mới cho MỌI màn học sinh bấm vào

Soạn 19/09/2026 bởi 0.Planer. Người làm: **Code 2 - Giao diện**, sau việc A (Bảng nhiệm vụ) và B (phiếu làm bài HTML).

Nguyên văn thầy: "nhớ thay giao diện ở mọi chỗ học sinh bấm lên là có giao diện mới nhé."

## Mục tiêu

Từ Bảng nhiệm vụ, em bấm vào đâu cũng thấy cùng một bộ mặt Material 3 đã duyệt (canvas https://claude.ai/artifact/RFUcbWFDRPQ9PPY7EPAYnK: bảng màu vai trò, bo góc 12/16/20/28, thẻ tonal không viền, nút ≥ 48 px, thanh trên dính, chế độ tối). Không còn cảnh trang chủ mới mà bên trong là giao diện cũ.

## Bước 0 — KIỂM KÊ trước khi sửa (nhắn 0.Planer danh sách rồi mới làm)

Đi từ `StudentPortalScreen.tsx` và `ParentPortalScreen.tsx`, lần theo MỌI đường bấm của học sinh/phụ huynh, lập bảng: màn · tệp · dựng bằng gì (React hay chuỗi HTML `dungPhieu`) · test nào đang soi · mức rủi ro. Tối thiểu phải có:

| Nhóm | Màn | Tệp gợi ý |
|---|---|---|
| Phiếu HTML | BTVN, khắc phục 4 chế độ, bài Mẹ giao dạng phiếu, thử thách/sửa lỗi, "đề + lời giải của em", hỏi bài, xem lại bài đã nộp | mọi chỗ gọi `dungPhieu` (`btvn-cho-em.ts`, `thuat-toan-rut-cau-sai.ts`, `de-loi-giai-cua-em.ts`, `mom-api.ts`, `hoi-bai.ts`, `NutPhieuHtml.tsx`, `KhungXemPhieu.tsx`) → việc B phải phủ HẾT các lối này bằng lớp `.gd-m3`, không chỉ BTVN |
| React – làm bài | Bài Mẹ giao làm trong app, tự luyện khắc phục, luyện đề chuẩn, câu hỏi em gửi thầy | khối `tab === 'mom'` trong `StudentPortalScreen.tsx`, `KhoiKhacPhuc3CheDo.tsx`, `KhoiLuyenKhacPhuc.tsx`, `ModalKhacPhucCauSai.tsx`, `LuyenDeChuan.tsx`, `KhoiBaiLuyen.tsx`, `TamTruotHoiBai.tsx`, `TheCau.tsx`, `TheCauChiTiet.tsx` |
| React – xem | Xem điểm & lịch sử ca, danh sách BTVN, báo cáo ca thi, tiến bộ, vinh danh, thông báo | khối `tab === 'diem'`/`'btvn'`/`'khacphuc'`, `BaoCaoCaThiHocSinhModal.tsx`, `BaoCaoCaThiPhuHuynhModal.tsx`, `CardCaThiGanNhat.tsx`, `TheTienBo.tsx`, `KhoiTienBo.tsx`, `ThongBaoHocSinh.tsx`, `BongBongChatHocSinh.tsx`, `BongBongChatPhuHuynh.tsx` |
| Vào thi | Phòng vào thi, phòng chờ | `PhongVaoThi.tsx`, `MaCaInput.tsx`, `PhongChoGame.tsx` |
| **Màn thi thật** | Làm bài thi | `ExamTakeScreen.tsx`, `exam-setup.css` — xem mục riêng dưới |

Game thần thú (`src/game/than-thu-v2/**`) GIỮ bộ mặt riêng của game — không thuộc việc này; chỉ bảo đảm khung mở game (`KhungThanThuToanManHinh`) có thanh trên và nút đóng cùng kiểu.

## Cách làm

- **Một nguồn token**: dùng đúng `m3-theme.css` của việc A (React) và khối biến `.gd-m3` của việc B (phiếu HTML) — hai nơi cùng bảng mã màu, có MỘT test so hai bảng không lệch.
- **Đổi áo, không đổi xương**: chỉ đổi lớp trình bày (màu, bo góc, khoảng cách, cỡ chữ, thẻ, nút, thanh trên/dưới, trạng thái trống, skeleton). KHÔNG đổi luồng dữ liệu, tên prop, payload, khoá localStorage, câu chữ mà test soi. Trước khi đổi một chuỗi/selector: `grep -rn "<chuỗi>" tests/`.
- Dựng 4–6 thành phần dùng lại trong `src/components/bang-nhiem-vu/` hoặc `src/components/m3/`: ThanhTren, TheTonal, NutChinh/NutPhu, ChipTrangThai, HangChon (phương án), NutPhanDoan (Đ|S), OSo (ô nhập số), TamTruot (sheet). Các màn React dùng chung chúng thay vì mỗi nơi tự vẽ.
- Làm theo từng nhóm, **mỗi nhóm một commit**, nhắn 0.Planer sau mỗi nhóm để soát và đẩy Pages từng đợt: (1) nhóm React – xem; (2) nhóm React – làm bài; (3) vào thi/phòng chờ; (4) màn thi thật.
- Không thêm thư viện; không hard-code màu trong .tsx; không emoji; tắt chuyển động khi `prefers-reduced-motion`.

## BẢN VẼ MÀN THI THẦY ĐÃ CHỐT (19/09: "Màn thi thật đẹp quá. Chốt luôn nhé.")

Canvas https://claude.ai/artifact/RFUcbWFDRPQ9PPY7EPAYnK, hàng thứ ba — đọc bằng Artifact tool, build ra phải khớp:
- `project/ThiDangLam.dc.html` — đang làm (sáng): đồng hồ viên thuốc ở thanh trên + "Đã làm X/28" + "đã lưu trên máy"; dải "Còn N câu chưa làm" bấm số để tới câu; Phần I/II/III cùng kiểu với phiếu; nhãn "Mới 2/4 ý"; nút "Xem lại sau"; thanh dưới + Nộp bài; vân tay chéo + 4 góc phủ nguyên.
- `project/ThiCanhBao.dc.html` — tối: dưới 5 phút đồng hồ đổi errorContainer; dải cảnh báo rời màn kiểu M3 (CÂU CHỮ dùng nguyên văn hiện có trong mã, chữ trong bản vẽ chỉ minh hoạ).
- `project/ThiGiuDeDoc.dc.html` — tấm giữ-để-đọc: biểu tượng bàn tay lớn, vẫn phủ từ dưới thanh trên (`CAO_THANH_TREN`), vân tay 4 góc in đè; chữ dùng đúng `CHU_TAM_PHU`.
- `project/ThiVaoVaKhoa.dc.html` — vào phòng: 6 ô mã ca, ô SBD, thẻ "Có đúng em không?", lời nhắc Không làm phiền (nguyên văn hiện có), nút Bắt đầu; thẻ khoá bài (nguyên văn hiện có).
- Nút **"Xem lại sau"**: kiểm `ExamTakeScreen.tsx` đã có đánh dấu câu chưa (dòng ~3011 có khối "Cần xem lại:"). Có → chỉ thay áo. Chưa có → làm bản TỐI GIẢN thuần phía máy em: trạng thái đánh dấu lưu localStorage khoá RIÊNG theo ca+sbd, KHÔNG đưa vào gói nộp/lưu tạm/đẩy trạng thái lên máy chủ, hiện dấu cờ trên dải số câu và trong khối "Cần xem lại" của hộp xác nhận nộp; có test chứng minh gói nộp trước/sau giống hệt.

## Màn thi thật (`ExamTakeScreen.tsx`) — làm SAU CÙNG, luật riêng

Đây là nơi tính điểm thật và có chống gian lận. Chỉ được:
- đổi màu, bo góc, cỡ chữ, khoảng cách, kiểu nút/hàng chọn cho giống phiếu mới;
- KHÔNG đổi cấu trúc DOM của: vân tay (`VanTay`), tấm "giữ để đọc" (`ManGiuDeDoc`), màn chắn (`ManChan`), đồng hồ, thanh số câu chưa làm, lớp z-index trong `index.css` (`--z-van-tay`, `--z-giu-de`, `--z-man-chan`, `--z-thanh`);
- KHÔNG đổi bất kỳ logic nào: chọn đáp án, lưu tạm, nộp, khôi phục phiên, phát hiện rời màn, giờ máy chủ.
- Commit RIÊNG. 0.Planer chỉ đẩy khi không có ca thi nào đang mở và sau khi tự soát diff. Mọi test `tests/*exam*`, `*vao-thi*`, `*chong-gian-lan*`, `*giu-de-doc*`, `*van-tay*`, `giao-dien-lam-bai*` phải giữ nguyên trạng thái so với nền.

## Nghiệm thu

- Bảng kiểm kê ở Bước 0 được 0.Planer duyệt; mọi dòng trong bảng có ảnh "sau" (390 px, sáng + tối) trong `docs/anh-dong-bo-m3-1909/`.
- Bấm lần lượt mọi thẻ/nút từ Bảng nhiệm vụ trên bản dựng: không màn nào còn nền/thẻ/nút kiểu cũ (tự chụp và tự soát).
- Toàn vitest: số đỏ ≤ 98, số tệp đỏ ≤ 43; build + `kiem-sw` 10/10.
- Nộp thử một BTVN, một bài Mẹ giao, một phiếu khắc phục trên bản dựng: máy chủ nhận gói y hệt trước khi đổi giao diện.
- Không phát hành; không hỏi thầy — hỏi 0.Planer.
