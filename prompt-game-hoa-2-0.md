# Prompt — Game Hóa 2.0: lột xác app học sinh + app giáo viên

Soạn 27/09/2026. Thầy đọc, sửa phần GIẢ ĐỊNH nếu cần, rồi gõ **HÃY THỰC THI PROMPT NÀY** để build.

## Góc nhìn khác

Bài toán thật không nằm ở việc "cắt app còn 2 game". Thứ cần làm là biến cả hệ thống thành **một vòng khép kín**: Kiểm tra tại lớp → Chiến dịch luyện có hạn nộp → Buổi chữa theo dữ liệu → Ca chốt đo lại. Hai game chỉ là lớp vỏ của bước Luyện; app thầy là nơi mở và đóng vòng. Câu nên hỏi: "Sau mỗi buổi học, thầy phải bấm mấy nút để vòng tự chạy?" Đích đặt ra là 2 nút: **Giao chiến dịch** (lúc kết thúc ca) và **Mở buổi chữa** (khi hết hạn). Cái còn lại để A.I Đỗ Đại Học tự lo.

## Người top 0,1% làm gì

- **Không xoá gì ở ngày đầu.** Mọi phần cũ ẩn sau một công tắc, chạy thử 1 lớp 7 ngày, ổn định 14 ngày mới xoá mã chết. Nhờ vậy thứ gì bỏ đi cũng lùi lại được trong 1 phút.
- **Chặn quá tải ngay lúc giao, đừng để thuật toán gánh.** Sai lầm phổ biến là giao 300 câu cho 7 ngày rồi trách thuật toán, trong khi 40 câu/ngày × 7 ngày chỉ có 280 lượt. Màn giao cần đồng hồ sức chứa tính trực tiếp.
- **Kế hoạch ngày đông cứng.** 40 câu chốt lúc em mở app lần đầu trong ngày, không tính lại mỗi lần mở, để Thể lực là con số thật, không nhảy lung tung.
- **Đo thành thạo THẬT bằng ca chốt, không tin cờ trong game.** Nếu số trong game lệch với ca chốt quá 10 điểm thì thuật toán đang tự lừa mình.
- **Ra lại đúng câu cũ thì em dễ học thuộc chữ cái.** Xáo thứ tự phương án mỗi lần câu ra lại; màn xem lại chỉ hiện câu em đã nộp.

## PROMPT

```
VAI TRÒ
Bạn là kỹ sư fullstack trưởng kiêm thiết kế sản phẩm giáo dục, 10 năm làm app luyện thi có game hoá và lặp lại ngắt quãng (spaced repetition), đã tái cấu trúc hơn 5 app đang có người dùng thật mà không mất một dòng dữ liệu.

BỐI CẢNH
- Trung tâm luyện thi Hoá của một thầy, 100–300 học sinh lớp 10–12, học trực tiếp tại lớp, tự luyện bằng app ở nhà.
- Repo omr-app: React + Vite + TS + Tailwind v4 (src/), Cloudflare Worker + D1 + R2 (server/). Ba app: giáo viên (/, /gv), học sinh (/hs), phụ huynh (/ph). Đọc CLAUDE.md, DIEU-PHOI.md, docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md trước khi sửa.
- Hiện trạng:
  - App học sinh: src/screens/StudentPortalScreen.tsx (2391 dòng) mở BangNhiemVu + các tấm: điểm, BTVN, bài gia đình giao, khắc phục/luyện đề, ôn câu, bảng tin, thông báo, thần thú. Game: src/game/than-thu-v2/Game.tsx (thanh chọn: Đảo / Đoàn / Võ đài / Tiến bộ / Sắp ra mắt), Đảo dao/DaoThanThu.tsx, Đoàn DoanHoTong.tsx. Vào ca: NutVaoThi → PhongVaoThi → ExamTakeScreen.
  - App giáo viên: ThanhBenTrai.tsx có 9 mục (Hôm nay, Học sinh, Ca kiểm tra, Ngân hàng đề, Giao BTVN, Gọi lên bảng, Học sinh hỏi, Giao đề theo tuần, Cài đặt) + nút Mở ca kiểm tra (ExamSetupScreen → ExamMonitorScreen).
  - Chọn câu game: startLuotMoi / startDoanKhoLop trong server/src/game-v2.ts. Hồ sơ từng câu: bảng nam_kt_cau (FSRS, dựng lại từ sổ su_kien_hoc). Kho đề giao: cau_hinh.kho_de_giao (một cấu hình chung, có deadline). Đoàn hiện KHÔNG chơi câu Phần II.
  - Gọi lên bảng: GoiLenBangScreen.tsx + src/lib/xep-buoi-chua-moi.ts (xếp câu sai nhiều → khó → cốt lõi trong 90 phút, mỗi em ≥ 1 lượt), tờ máy chiếu src/lib/html-may-chieu.ts, nút Đạt/Không đạt ghi len_bang + su_kien_hoc (nguon 'len_bang'). Thống kê câu cả lớp sai: src/lib/bao-cao-ca-lop.ts.
  - In PDF: phiếu HTML src/lib/html-phieu.ts có nút "Tải PDF" gọi window.print(). Hiển thị câu: TheCau.tsx (KaTeX + mhchem), hình qua QuestionMedia.tsx.

NHIỆM VỤ
Build "Game Hóa 2.0" theo bản thiết kế A–G dưới đây: app học sinh chỉ còn Sảnh game (Bát Linh Đảo + Đoàn Hộ Tống) và màn "Câu đã làm" (xem lại, tải PDF); app giáo viên chỉ còn 2 việc chính là Ca kiểm tra và Lên bảng, nối thành vòng khép kín bằng Chiến dịch; lõi chia câu thay bằng Thuật toán 2.0.

A. VÒNG KHÉP KÍN
Kiểm tra tại lớp → Chiến dịch luyện (có hạn nộp) → Buổi chữa (khi hết hạn) → Ca chốt → chiến dịch kế tiếp.
- Kết thúc ca kiểm tra → nút chính "Giao chiến dịch luyện", điền sẵn: câu = đề vừa kiểm tra (thêm tờ đề từ ngân hàng nếu muốn), lớp = lớp dự ca, hạn nộp = 23:59 ngày trước buổi học kế tiếp (mặc định +7 ngày).
- Kết quả ca kiểm tra đổ thẳng vào thuật toán: câu đã làm trong ca = đã cọ xát; câu sai = đến lịch ôn lại ngày mai.
- Hết hạn nộp → màn Lên bảng tự chuyển sang "Buổi chữa" xếp sẵn từ dữ liệu chiến dịch.
- Bấm "Chữa xong" → mọi câu "Cần thầy dạy lại" của buổi mở khoá (đếm sai lại từ 0), vào Đoàn Hộ Tống ngày hôm sau.
- Ca chốt (tuỳ chọn, 1 nút): đề 20–30 câu rút từ chiến dịch, xáo phương án, đo thành thạo thật để so với số trong game.
- Hết hạn: câu chưa thành thạo sang chiến dịch kế tiếp làm "nợ cũ"; câu đã thành thạo vào "ôn duy trì" (hẹn 30 ngày, tối đa 20% thể lực/ngày) để giữ kiến thức tới kỳ thi tốt nghiệp.

B. THUẬT TOÁN 2.0 (máy chủ, module thuần + test)
Ký hiệu: D = số ngày giờ Việt Nam còn lại tới hạn nộp, tính cả hôm nay (tối thiểu 1). cc = chuỗi đúng liên tiếp. TRẦN = 40 câu/ngày, chung cho 2 game.
1. Phạm vi: câu của chiến dịch đang chạy + nợ cũ + ôn duy trì. Loại câu tự luận (src/lib/cau-tu-luan.ts), câu đang bảo vệ, câu của ca kiểm tra đang mở.
2. Lập kế hoạch ngày:
   - Câu mới được giữ chỗ trước: số câu mới hôm nay = D > 3 ? ceil(số câu mới còn lại / (D − 3)) : số câu mới còn lại. Thứ tự: mức Nhận biết → Thông hiểu → Vận dụng, xen kẽ dạng.
   - Câu ôn đến lịch (so theo NGÀY, không theo giờ): W = 50 + 20 × số ngày trễ + (cc = 1 ? 80 : cc = 0 ? 60 : 0). Xếp W giảm dần vào chỗ còn lại; chỗ thừa trả cho câu mới.
   - Cắt tỉa: sai ≥ 4 lần và lần cuối sai → rời hẳn kế hoạch, vào danh sách "Cần thầy dạy lại".
3. Khi trả lời:
   - ĐÚNG, câu mới → cc = 1, hẹn +3 ngày.
   - ĐÚNG, câu ôn → cc + 1 (đúng lần hai trong CÙNG ngày không cộng, trừ ngày cuối). cc = 1 → +3 ngày; cc = 2 → THÀNH THẠO, +7; cc ≥ 3 → +14.
   - ĐÚNG nhờ gợi ý M3 → cc = 1, hẹn +3 (không tính vào thành thạo).
   - SAI → cc = 0, số lần sai + 1, bỏ cờ thành thạo, hẹn ngày mai.
   - Hẹn vượt hạn nộp: câu chưa thành thạo → ngày mai (D = 1: buổi tối cùng ngày); câu đã thành thạo → không ép hằng ngày, ôn chốt 1 lần ngày áp chót.
   - Thành thạo = cc ≥ 2, hai lần đúng ở 2 ngày khác nhau, lần cuối đúng.
4. Huyết Chiến: khối lượng = Σ (câu mới: 2; câu đang ôn: 2 − cc), chỉ tính câu chưa thành thạo, chưa cắt tỉa. Bật khi khối lượng > 0,9 × D × 40 → trần 80 câu/ngày. Từ câu thứ 41 trong ngày: 0 EXP, 0 vật phẩm. EXP còn lại giữ luật hiện hành (trần 120 EXP game/ngày).
5. Gợi ý M3: bật khi lần cuối sai VÀ đã sai ≥ 2 lần VÀ chưa cắt tỉa. Phần I: máy chủ chọn 2 phương án sai để gạch (không gửi đáp án xuống máy). Phần II, III: hiện dòng "Kiến thức cốt lõi" trước khi làm (không kèm lời giải).
6. Chia sang 2 game: câu mới → Bát Linh Đảo; câu ôn → Đoàn Hộ Tống, riêng câu ôn Phần II → Bát Linh Đảo (Đoàn không chơi Phần II).
7. Kế hoạch ngày ĐÔNG CỨNG: chốt ở lần mở đầu tiên trong ngày, trong ngày chỉ trừ dần. Chỉ tính lại khi Huyết Chiến bật giữa ngày hoặc buổi tối ngày cuối. Thể lực = số câu còn lại của kế hoạch.
8. Mỗi lần câu ra lại: xáo thứ tự phương án Phần I và thứ tự ý Phần II; máy chủ chấm theo đáp án gốc.

C. APP HỌC SINH
C1. Đăng nhập xong vào thẳng SẢNH (thay BangNhiemVu). Một màn, từ trên xuống:
   1. Đầu trang: "Thần thú của em: <biệt danh> · Cấp N", thanh EXP, "Thể lực 28/40 câu hôm nay".
   2. Dải "Vào thi": CHỈ hiện khi có ca kiểm tra đang mở cho em (giữ nguyên luồng thi thật).
   3. Thẻ chiến dịch: tên · "Hạn nộp: còn 3 ngày 5 giờ (tới 23:59 Thứ Năm 24/09)" · hai thanh "Cọ xát 62%" và "Thành thạo 31%". Huyết Chiến bật → thẻ đổi thành "Thành trì bị vây hãm · hôm nay 80 câu".
   4. Hai cửa lớn: Đoàn Hộ Tống (N câu ôn đang chờ) · Bát Linh Đảo (M câu mới). Còn câu ôn hôm nay → cửa Đảo mờ, khoá, hiện: "Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!"
   5. Hết câu hôm nay → "Hôm nay em xong rồi. Lịch ôn lại tiếp theo: Thứ Sáu 25/09."
   6. Nút phụ: Câu đã làm · Đăng xuất. Cửa hàng/Túi đồ giữ ở chỗ cũ trong game.
C2. Giữ NGUYÊN đồ hoạ, hoạt ảnh, màn đánh quái, pop-up của Đảo và Đoàn. Chỉ đổi: dữ liệu câu truyền vào, chỗ thoát (về Sảnh), gợi ý M3 (Đoàn nâng thẻ "Loại 1 phương án" thành gạch 2; Đảo thêm gạch chữ 2 phương án, không đổi bố cục). Thanh chọn trong Game.tsx bỏ Võ đài, Tiến bộ, Sắp ra mắt.
C3. Màn "Câu đã làm" (M3):
   - Bộ lọc 1 hàng: Tất cả · Sai lần gần nhất · Đang ôn · Thành thạo · Cần thầy dạy lại; chọn chiến dịch.
   - Mỗi câu: đề (TheCau chế độ xem lại) · lựa chọn gần nhất của em · đáp án · lời giải · lịch sử "✔ 21/09 · ✘ 23/09 · ✔ 24/09" · "Đến lịch ôn lại: Thứ Bảy 26/09".
   - Chỉ hiện câu em ĐÃ NỘP.
   - Nút chính "Tải PDF": dựng phiếu bằng html-phieu.ts theo bộ lọc đang chọn → window.print() → "Lưu thành PDF".
C4. Ẩn khỏi app học sinh (chưa xoá mã): Bảng nhiệm vụ, BTVN, Bài gia đình giao, Khắc phục/luyện đề, Ôn câu, Bảng tin + vinh danh, Thông báo, Bộ não A.I, Võ đài, Tiến bộ. Tắt các job máy chủ nhắc/giao những thứ đó cho em đang ở chế độ 2.0.

D. APP GIÁO VIÊN
D1. Thanh bên còn 2 mục chính + "Thêm…":
   - Ca kiểm tra: gộp Mở ca + danh sách ca + theo dõi/chấm như cũ, thêm bước "Giao chiến dịch luyện".
   - Lên bảng: Gọi lên bảng lột xác (D3).
   - "Thêm…" (thu gọn): Học sinh (tài khoản, mật khẩu), Ngân hàng đề, Cài đặt. Ẩn: Hôm nay, Giao BTVN, Học sinh hỏi, Giao đề theo tuần.
D2. Giao chiến dịch (sau Kết thúc ca, hoặc Ca kiểm tra → "Giao chiến dịch mới"):
   - Chọn tờ đề/câu, lớp hoặc tick em, hạn nộp, thể lực/ngày (mặc định 40).
   - Đồng hồ sức chứa tính trực tiếp theo em trung vị, ví dụ: "Cần khoảng 520 lượt · sức chứa 7 ngày × 40 = 280 lượt → QUÁ TẢI ×1,9 · 23 em quá tải". Hai nút gợi ý: "Rút còn 90 câu (giữ câu cả lớp sai nhiều)" / "Lùi hạn nộp tới 23:59 Thứ Hai 05/10". Màu: xanh ≤ 0,7 · vàng 0,7–0,9 · đỏ > 0,9.
D3. Lên bảng: một màn, tự đổi chế độ theo trạng thái chiến dịch.
   - Đang chạy → "Bảng chiến dịch": lưới em × dạng tô màu theo thành thạo; cột Cọ xát / Thành thạo / Trễ nhịp; danh sách "Cần thầy dạy lại" gộp theo câu ("Câu 17 · 9 em"); danh sách em đang Huyết Chiến. Gọi lên bảng giữa kỳ lấy câu có nhiều em cần dạy lại nhất.
   - Hết hạn → "Buổi chữa" xếp sẵn: điểm chữa của câu = số em chưa thành thạo + 2 × số em cần dạy lại; gom theo dạng, mỗi dạng 1 câu đại diện; dùng lại xep-buoi-chua-moi.ts (90 phút, phủ ≥ 80%, mỗi em có mặt ≥ 1 lượt) với đầu vào mới này. Người lên bảng mặc định: 1 em vừa thành thạo câu cùng dạng (giải mẫu) + 1 em cần dạy lại (sửa); thầy đổi được.
   - Đạt/Không đạt ghi như cũ (su_kien_hoc nguon 'len_bang'); Đạt = một lượt đúng trong thuật toán. Nút "Chữa xong" mở khoá câu cần dạy lại (mục A).
   - Tờ máy chiếu giữ nguyên. Nút phụ "Mở ca chốt" → sang Ca kiểm tra với đề chốt dựng sẵn.

E. APP PHỤ HUYNH
Thu về 1 màn "Tiến độ của con": chiến dịch, hạn nộp, Cọ xát, Thành thạo, chuỗi ngày, số câu cần thầy dạy lại, nhận xét của thầy. Ẩn "Giao thêm bài cho con".

F. DỮ LIỆU VÀ MÁY CHỦ (migration CHỈ-THÊM)
- chien_dich(id, ten, lop, sbd_json, qid_json, han_nop, the_luc_ngay, tao_luc, trang_thai): nhiều chiến dịch song song theo lớp, thay dần cau_hinh.kho_de_giao.
- srs2_cau(sbd, qid, chien_dich_id, lan_gap, cc, lan_sai, thanh_thao, ngay_dung_cuoi, hen_on, cat_tia, cap_nhat_luc): bảng ĐỆM, dựng lại được 100% từ su_kien_hoc.
- srs2_ke_hoach(sbd, ngay, dao_json, doan_json, huyet_chien, tao_luc).
- Lệnh mới: /hs/sanh, /hs/cau-da-lam, /gv/chien-dich (tạo/sửa/đóng), /gv/chien-dich/suc-chua, /gv/chien-dich/bang, /gv/chien-dich/buoi-chua. startLuotMoi / startDoanKhoLop đọc srs2_ke_hoach khi công tắc bật.
- Công tắc cau_hinh.game_hoa_2 bật theo lớp, mặc định TẮT → mọi thứ như cũ.
- Không xoá bảng, không xoá dữ liệu cũ.

G. GIAI ĐOẠN (mỗi giai đoạn: test xanh → đẩy → một dòng Nhật ký trong DIEU-PHOI.md)
GĐ1. Thuật toán + 3 bảng + lệnh máy chủ + test; không đổi giao diện.
GĐ2. App học sinh: Sảnh, nối 2 game, khoá Đảo, Câu đã làm + PDF, ẩn phần cũ sau công tắc.
GĐ3. App giáo viên: Giao chiến dịch + đồng hồ sức chứa, Lên bảng 2 chế độ, thu gọn thanh bên; app phụ huynh 1 màn.
GĐ4. Chạy thử 1 lớp 7 ngày; ca chốt; lệch với số trong game > 10 điểm thì chỉnh trọng số.
GĐ5. Bật toàn trung tâm; ổn định 14 ngày mới xoá mã chết (mỗi thứ xoá một dòng báo cáo dọn).

NGUYÊN TẮC BẮT BUỘC
- Không mất dữ liệu: migration chỉ-thêm, không DROP/DELETE bảng cũ; tắt công tắc game_hoa_2 là toàn bộ app về như cũ trong ≤ 1 phút.
- Giao diện Đảo và Đoàn: diff các tệp đồ hoạ/hoạt ảnh = 0 dòng, ngoài chỗ nhận dữ liệu, chỗ thoát về Sảnh và gạch phương án M3.
- Một nguồn sự thật: trạng thái câu chỉ suy ra từ su_kien_hoc; xoá bảng đệm rồi dựng lại phải ra đúng kết quả cũ (có test).
- Luồng kiểm tra thật giữ nguyên từng chữ: ExamTakeScreen, phòng chờ, cảnh báo rời màn, đường vào ca.
- Đáp án, lời giải không xuống máy học sinh trước khi em nộp câu đó; phương án bị gạch do máy chủ chọn.
- Chữ trên màn theo bảng từ chuẩn; thêm vào bảng 6 từ: Chiến dịch, Thể lực, Cọ xát, Thành thạo, Huyết Chiến, Bát Linh Đảo (thay "Đảo thần thú" ở màn học sinh).
- Mỗi luật ở mục B có ít nhất 1 test tự động.

GIẢ ĐỊNH ĐÃ DÙNG
- Thể lực 40 câu/ngày chung 2 game; Huyết Chiến 80 câu/ngày.
- Chiến dịch mặc định lấy đề vừa kiểm tra; hạn nộp mặc định +7 ngày.
- Thứ tự ôn: câu gần thành thạo +80, câu vừa sai +60.
- EXP giữ luật hiện hành (trần 120 EXP game/ngày); từ câu thứ 41 trong ngày không rơi EXP.
- Câu sai ≥ 4 lần chuyển sang "Cần thầy dạy lại", không bỏ rơi.
- App phụ huynh thu còn 1 màn.
- Chỉ bật công tắc cho một lớp khi BTVN và bài gia đình giao đang mở của lớp đó đã hết hạn nộp.
- Cửa hàng, Túi đồ, Sổ tay trong game giữ nguyên.

KHÔNG ĐƯỢC LÀM
- Không vẽ lại hay đổi hoạt ảnh, màu, bố cục của Đảo và Đoàn.
- Không xoá mã hoặc dữ liệu cũ trước GĐ5; không migration phá huỷ.
- Không đẩy máy chủ/Pages khi đang có ca kiểm tra mở.
- Không thêm màn nào vào app học sinh ngoài Sảnh, 2 game, Câu đã làm và luồng thi.
- Không để một màn có 2 nút chính; không hiện mã nội bộ (qid, mã tờ đề) trên màn học sinh/phụ huynh. Báo cáo mỗi giai đoạn ≤ 150 chữ.

ĐỊNH DẠNG ĐẦU RA
- Mã + test theo từng giai đoạn; commit tiếng Việt theo đường dẫn tệp.
- Hợp đồng API docs/hop-dong-game-hoa-2.md: mỗi lệnh ghi đầu vào, đầu ra, lỗi.
- Mỗi giai đoạn: 1 dòng Nhật ký + ảnh chụp màn mới (JPG ≤ 150 KB) ở khổ 390×844 và 1440×900.
- Báo cáo cuối: bảng NGHIỆM THU, từng tiêu chí đạt/trượt.

NGHIỆM THU
1. Công tắc bật: học sinh đăng nhập → Sảnh; không còn đường vào BTVN/Bảng tin/Bảng nhiệm vụ; dải "Vào thi" hiện khi có ca mở, ẩn khi không.
2. Mô phỏng tự động 300 lần (kho 150 câu, 14 ngày, 40 câu/ngày): cọ xát = 100% tại hạn nộp; Thành thạo cao hơn thuật toán đặc tả gốc.
3. Xoá srs2_cau rồi dựng lại từ su_kien_hoc: khớp 100% với bản trước khi xoá.
4. Công tắc tắt: toàn bộ vitest không thêm tên test đỏ so với docs/nen-vitest-do-1909.txt; app học sinh, giáo viên chạy như cũ.
5. "Tải PDF" 50 câu có công thức mhchem ra đúng trên Chrome Android và Safari iOS (có ảnh chụp).
6. Hết hạn chiến dịch: Lên bảng tự mở Buổi chữa, mỗi em có mặt ≥ 1 lượt, tổng ≤ 90 phút.
```

## Ba câu hỏi làm prompt sắc hơn

1. **App phụ huynh**: thu về 1 màn "Tiến độ của con" (em đề xuất, để phụ huynh vẫn thấy con học), hay cắt hẳn?
2. **BTVN và bài gia đình giao đang mở**: đợi hết hạn nộp rồi mới bật cho lớp đó (em đề xuất), hay bật ngay và bỏ dở?
3. **4 điểm em đổi so với đặc tả gốc** (thứ tự ôn, trần Huyết Chiến 80, EXP giữ luật cũ, câu sai ≥ 4 lần → Cần thầy dạy lại): thầy đồng ý cả 4?
