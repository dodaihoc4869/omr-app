# Kiểm thử còn chưa đạt — 23/09/2026

Nguồn: lượt toàn bộ `/tmp/omr-final4-tests-2309.json` và lượt chạy lại `cam-tu-luan-may-chu-2109.test.ts` sau khi cập nhật fixture vừa sức. Không bỏ/skip các kiểm thử này để làm xanh bộ kiểm thử.

Còn 82 ca kiểm thử không đạt trong 35 file. Nhiều ca đang khóa hợp đồng cũ (các phiên bản thần thú, đường Apps Script/kho lớp, component đã thay). Danh sách là bằng chứng tồn tại kiểm thử đỏ, không kết luận mọi trường hợp đều chỉ do fixture.

## bo-nao-doc-2109.test.ts (2)

- THẬT: on_som kéo mốc ôn SỚM hơn (chỉ sớm, không muộn), công tắc dừng NGAY câu vừa sai của dạng on_som có mốc ở tương lai ⇒ vào hàng ôn từ "ngày mai" của đêm điều chỉnh; dạng khác / mốc đã tới / hồ sơ nguồn KHÔNG đổi
- THẬT: on_som kéo mốc ôn SỚM hơn (chỉ sớm, không muộn), công tắc dừng NGAY THẬT theo LỚP: chỉ lớp trong lopThat có hiệu lực (lớp ghi ở thẻ ngày)

## btvn-ui-1609.test.tsx (1)

- thư mục ca gọn theo năm sinh, không bỏ tick khi đóng mở

## btvn-va-khong-apps-script-1209.test.ts (4)

- BTVN — ba luật chốt cứng ở MÁY CHỦ LUẬT 2 — trả NGUYÊN gói đề, không xáo không lọc
- BTVN — ba luật chốt cứng ở MÁY CHỦ CHẶN QUÁ HẠN Ở MÁY CHỦ — cả lúc mở lẫn lúc nộp
- BTVN — ba luật chốt cứng ở MÁY CHỦ nộp rồi thì nộp lại KHÔNG ghi đè — khoá nằm trong WHERE
- BTVN — ba luật chốt cứng ở MÁY CHỦ theo dõi kê TÊN em chưa nộp, không chỉ đếm số

## cat-google-1209.test.ts (1)

- cắt Google khỏi app postJson gửi vào cổng /goi của máy chủ mới, không nhận địa chỉ từ chỗ gọi

## cau-da-lam-2109.test.ts (1)

- /hs/ke-hoach-ngay: thêm soCauHienThi, giữ daLamCau (luật) đọc tổng hợp (tiến bộ + hiển thị + giây) lỗi ⇒ kế hoạch VẪN dựng, về 0/vắng khoá thay vì ném lỗi (không bịa số)

## chon-luot-2109.test.ts (4)

- MỐC 4 — KHÔNG LƯỢT RỖNG khi kho còn câu; thang nới kho NHỎ (7–20 câu) và em đã làm gần hết: vẫn trả đủ min(6, kho) câu, KHÔNG rỗng (thang nới: bậc + 1 → câu sai hôm nay cũng được lấy lại khi hết câu khác)
- MÔ PHỎNG 60 em giả × 7 ngày × 3–6 lượt: không lượt rỗng, tỉ lệ câu lặp thấp, không lặp trong ngày kho 330 câu: mọi lượt đủ 6 câu; câu lặp trong 7 ngày < 30 % (kho giả nhỏ); không nhóm nào lặp trong cùng một ngày; câu sai hôm nay không quay lại hôm nay
- ĐOÀN HỘ TỐNG dùng CÙNG bộ chọn với Đảo Đợt 2 (thầy 21/09 tối: "đúng luật cá nhân hoá, nâng đỡ, chặn lặp") loại "khoi_dong": 30 em × 7 ngày × 4 chặng — mỗi chặng đủ 6 câu, KHÔNG Phần II, không nhóm nào lặp trong ngày, bậc ≤ bậc em + 1, câu chưa gặp ≥ 3 khi kho còn nhiều, chỉ Phần I
- ĐOÀN HỘ TỐNG dùng CÙNG bộ chọn với Đảo Đợt 2 (thầy 21/09 tối: "đúng luật cá nhân hoá, nâng đỡ, chặn lặp") KHÔNG lượt rỗng khi kho Đoàn thu hẹp còn ít câu (7–20 câu Phần I/III): trả đủ min(6, số câu ĐỦ BẬC) — Đoàn chỉ báo "chưa có câu vừa sức" khi kho thật sự chỉ còn câu quá bậc

## danh-dau-cau-hoi-lai.test.ts (1)

- gói hai bản đồ trong một ô MÁY CHỦ CHƯA CẬP NHẬT VẪN CHẠY ĐÚNG — hai bản đồ gửi ở HAI trường riêng

## dau-truong-chan-ly.test.ts (2)

- bộ quân cờ sáu hệ đều có đủ bốn bậc giá — không hệ nào bị bỏ đói
- giao tranh nhật ký ghi lại được và có nêu loại tương khắc

## dieu-7-cau-dung-may-chu-2109.test.ts (1)

- kế hoạch ngày: `tienBo.thieuDat` (chỉ khi thiếu câu ĐÚNG, từ 22/09) 22/09: chưa đúng câu nào ⇒ soCauDung = ceil(tối thiểu/2) kèm câu chữ có số thật; đúng đủ ⇒ trường biến mất

## dong-bo-kho-sang-may-em-1409.test.ts (1)

- Modal khắc phục nối đúng đường đang xin kho thì nói ra, không hiện 0 câu rồi nhảy số

## giao-btvn-tung-hoc-sinh-1309.test.ts (5)

- GIAO BTVN CHO TỪNG HỌC SINH PhanCongScreen có 2 chế độ: Theo ca kiểm tra và Cho từng học sinh
- GIAO BTVN CHO TỪNG HỌC SINH PhanCongScreen ẩn chọn ca thi khi ở chế độ giao cho từng học sinh
- GIAO BTVN CHO TỪNG HỌC SINH PhanCongScreen hiển thị ô danh sách học sinh có ô tick và tìm kiếm
- GIAO BTVN CHO TỪNG HỌC SINH giaoBtvn ở client thư viện hỗ trợ dsSbd và cho phép ca rỗng
- GIAO BTVN CHO TỪNG HỌC SINH Server và Client BTVN hỗ trợ nộp lại tối đa 3 lần

## hang-nhom-de-1209.test.ts (1)

- DÙNG CHUNG HAI MÀN cả Mở ca và Phân công đều dùng đúng hàng này

## hom-nay-2109.test.tsx (1)

- HomNayCu = màn Hôm nay BẢN 2, nay là bản DỰ PHÒNG khi máy chủ chưa có /gv/bang-tin (thầy lệnh 21/09, sửa CÓ CHỦ Ý các chuỗi của bản 1) CÓ DỮ LIỆU: mỗi số trên thẻ truy được về một trường của lệnh; danh sách em, dạng yếu, Đoàn Hộ Tống; chữ theo CHUẨN TỪ NGỮ

## ios-pwa-chuyen-man.test.ts (2)

- Sửa triệt để lỗi iOS thêm vào màn hình chính bị nhảy vào app giáo viên manifest học sinh có start_url trỏ tới cổng học sinh
- Sửa triệt để lỗi iOS thêm vào màn hình chính bị nhảy vào app giáo viên manifest phụ huynh có start_url trỏ tới cổng phụ huynh

## kenh4-than-thu-1909.test.ts (1)

- K4.1 readScope: bằng chứng từ hồ sơ (nguồn ≠ thi, ≠ game) chưa có bảng hồ sơ / sổ (fixture cũ, migration chưa chạy): không ném lỗi, evidence như trước

## khac-phuc-khong-co-cau-sai-1509.test.tsx (4)

- 0 câu sai — modal nói thẳng là rỗng, không có nút nào bấm được không vẽ thẻ "Làm lại các câu sai" và không có nút "Bắt đầu làm bài"
- 0 câu sai — modal nói thẳng là rỗng, không có nút nào bấm được nói đúng lý do: không có câu nào cần khắc phục, KHÔNG đổ cho kho đề
- 0 câu sai — modal nói thẳng là rỗng, không có nút nào bấm được vẫn còn đúng một nút Đóng để thoát
- Cổng chặn nút "Bắt đầu làm bài" phủ CẢ BA chế độ dùng chung một con số `soCauSeRut` cho cả hai nút

## khac-phuc-tren-dien-thoai-1409.test.ts (2)

- LỖI 2 — máy học sinh không có kho đề modal mặc định vào chế độ 1, chỉ nâng lên 2 khi kho thật sự có đề
- LỖI 2 — máy học sinh không có kho đề khoá thẻ 2 và thẻ 3 khi kho rỗng và nói rõ vì sao

## khong-dung-bien-truoc-khi-khai.test.ts (1)

- Không đọc biến trước khi khai báo KHÔNG có chỗ vi phạm nào ngoài danh sách đã rà soát

## luyen-dang-bai-1509.test.ts (5)

- Mục 4 — Luyện dạng bài trên màn hình có đủ bốn chế độ, mặc định vẫn là chế độ 1
- Mục 4 — Luyện dạng bài trên màn hình thẻ 4 KHÔNG khoá theo kho câu-sai — em không sai câu nào vẫn luyện được
- Mục 4 — Luyện dạng bài trên màn hình kho rỗng KHÔNG còn là lý do cảnh báo của chế độ 4
- Mục 4 — Luyện dạng bài trên màn hình số câu trên thanh trượt đếm SAU cửa nạp, không lấy so_cau trong gói
- Mục 4 — đồng bộ mọi chỗ mô tả các chế độ cổng phụ huynh nói 4 phương pháp, không còn 3

## luyen-khac-phuc.test.tsx (1)

- khối đứng ở màn Ca thi ĐƯỢC GẮN Ở MÀN CA THI, không phải trong chi tiết từng ca

## nop-bai-khong-treo-1009.test.ts (1)

- MỌI NHỊP GỌI MẠNG TRONG CA đều phải có chốt và lệch pha nhịp HỎI ĐÁP ÁN sau khi nộp: có chốt `dangHoi` và lệch pha

## nop-phieu-khac-phuc.test.ts (2)

- trang phiếu CHỌN DỞ RỒI ĐÓNG MÁY vẫn còn — lưu theo mã phiếu KÈM vân tay bộ câu
- nộp xong mới hiện lời giải (thầy chốt 08/09) ĐANG CHỌN thì nhìn thấy được, và đã chấm rồi thì khoá tay

## parent-news-d1-1909.test.ts (2)

- Kênh 5 trên D1 thật: chọn câu cho bài hằng ngày câu tới hạn đứng đầu, rồi câu MỚI cùng dạng yếu; đúng lớp; không lọt đề chưa công bố; id là qid thật; có đáp án cho Mom
- Kênh 5 trên D1 thật: chọn câu cho bài hằng ngày em mới chưa có hồ sơ: bài vẫn đủ câu từ kho, chỉ đúng lớp của em (lỗi cũ: kho luôn rỗng vì đọc sai tên trường)

## ten-than-thu-1609.test.ts (8)

- tên sáu thần thú đủ sáu con, mỗi hệ đúng một con
- tên sáu thần thú TÊN mang CẢ HAI nửa: một thuật ngữ Hoá và một tên thần thú
- tên sáu thần thú DANH HIỆU mang một CÔNG THỨC THẬT, không phải chữ kêu suông
- tên sáu thần thú không con nào trùng tên hay trùng danh hiệu con nào
- tên sáu thần thú CHIÊU TỐI THƯỢNG đúng sáu tên trong ảnh thầy gửi
- tên sáu thần thú kỹ năng thường cũng là một quá trình Hoá, không phải chữ fantasy trơn
- tên sáu bậc tiến hoá từ bậc 2 trở lên, bậc nào cũng nêu được THẦN THÚ của nó
- âm chưởng tối thượng — sáu hệ sáu tiếng, và chỉ kêu đúng lúc mỗi nhánh nêu đúng tên chiêu của nó trong chú thích — đọc mã là biết tiếng nào

## than-thu-3d.test.ts (3)

- Mô hình 3D theo 12 hình thái cấp nào cũng dựng được, cho cả sáu thần thú
- Mô hình 3D theo 12 hình thái màu thân lấy đúng từ thần thú, mỗi hệ một màu
- Chiêu thức bay ra thật mỗi hệ một hình dạng đạn — sáu hệ không được giống nhau

## than-thu-chon-mot-lan.test.tsx (4)

- Hồ sơ: rỗng nghĩa là chưa chọn hồ sơ cũ đã có thần thú thì giữ nguyên, không bắt chọn lại
- Màn chọn lần đầu bày đủ sáu con, mỗi con nói rõ khắc ai và bị ai khắc
- Màn chọn lần đầu bấm chọn thì vào game, và hồ sơ ghi lại mốc chọn
- Chọn rồi thì KHÔNG đổi được màn hình nói rõ hệ nào khắc em, hệ nào em khắc

## than-thu-dong-bo-cap-do.test.ts (1)

- Những gì đã đúng thì phải giữ nguyên bên nào đã chốt thần thú thì giữ — chọn một lần, không đổi

## than-thu-dong-bo-hien-ra.test.tsx (2)

- Chưa chọn thú: KHÔNG bày nút chọn khi chưa hỏi xong máy chủ đang hỏi máy chủ thì hiện màn chờ, KHÔNG hiện nút chọn
- Hỏi xong mà máy chủ không có thú thì phải NÓI RA máy chủ CÓ thú thì không hiện câu ấy — vì màn chọn biến mất luôn

## than-thu-dong-bo-man.test.tsx (1)

- Nuốt bản máy chủ khi mở game máy chủ chưa có gì thì giữ nguyên bản trong máy

## than-thu-dong-bo.test.ts (2)

- Thần thú đã chọn không bị xoá máy chủ thắng nhưng chưa chọn thú thì lấy thú của máy này
- Thần thú đã chọn không bị xoá máy này chưa chọn, máy chủ đã chọn thì nuốt thú của máy chủ

## than-thu-hinh-thai.test.ts (3)

- kinh nghiệm BẢNG NGUỒN EXP phải khớp đúng con số trong mã — không hứa suông
- tương khắc nguyên tố — không còn là mã chết cặp khắc chế phải có phản ứng thật đỡ lưng
- tương khắc nguyên tố — không còn là mã chết bị khắc thì yếu đi, cùng hệ thì hoà, không quan hệ thì trung tính

## than-thu-sau-he.test.ts (8)

- Bảng khắc chế sáu hệ đúng sáu hệ, tên đủ cả hai kiểu
- Bảng khắc chế sáu hệ mọi cặp đều nêu được phản ứng thật làm bằng chứng
- Bảng khắc chế sáu hệ thắng + thua + trung tính luôn bằng đúng 5 đối thủ
- Cân bằng — đo, không nói miệng bảng thô LỆCH — ghi lại để không ai tưởng nó cân sẵn
- Cân bằng — đo, không nói miệng hệ khắc được nhiều thì chỉ số gốc phải thấp hơn
- Cân bằng — đo, không nói miệng lực chiến thật sự đổi theo hệ
- Sáu thần thú đúng sáu con, mỗi hệ đúng một con
- Sáu thần thú id trong bản ghi khớp khoá, và màu chỉ dùng rgb

## tu-ngu-cum8-2109.test.ts (1)

- cụm 8 · "Máy" làm chủ ngữ tự động ⇒ "A.I Đỗ Đại Học" src/screens/StudentPortalScreen.tsx: có "để A.I Đỗ Đại Học chấm điểm ngay", hết "để máy chấm điểm ngay"

## vao-thi-may-chu-moi-1109.test.ts (2)

- KHÔNG CÒN ĐƯỜNG LÙI — hỏng phải nói thành lời KHÔNG CÓ ĐỊA CHỈ Ở ĐÂU CẢ ⇒ nói thẳng, không gọi đi đâu hết
- KHÔNG CÒN ĐƯỜNG LÙI — hỏng phải nói thành lời địa chỉ trỏ VỀ GOOGLE ⇒ bị chặn cứng, không một byte nào chạm Apps Script

## xoa-nhieu-ca.test.ts (1)

- ĐỊA CHỈ GOOGLE BỊ TỪ CHỐI link Apps Script không gọi được lượt nào — app không còn đường về Google
