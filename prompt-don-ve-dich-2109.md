# ĐỀ BÀI BUILD — "DỒN VỀ ĐÍCH" (thầy chốt 21/09/2026 14:13: "Chốt B và chốt hết build")

Người viết: Boss. Thiết kế đã duyệt: `DE-XUAT-DON-VE-DICH-2109.md` (5 điều — ĐỌC TRƯỚC; Điều 4 = B). Mẫu màn: `docs/ban-ve-don-ve-dich-2109/` (phiên phụ đang vẽ; Boss soát xong mới build MÀN; phần TÍNH và MÁY CHỦ làm ngay).

## RÀO
Hạn nộp KHÔNG BAO GIỜ bị đổi. Không đổi luật chấm, không đụng ca kiểm tra (luật "nộp trễ" CHỈ cho bài tập về nhà). Em trễ không bao giờ nhận NHIỀU câu hơn em đúng nhịp. Lõi bắt buộc không bị cắt; chỉ cắt phần làm thêm theo luật hạn ngắn 1.4 đã có. Không bảng mới nếu suy ra được từ `btvn_em.chang_mo_json` + `lo_da_xong` + lịch ôn. Trường mới là chỉ-thêm; màn cũ gặp máy chủ mới và ngược lại đều chạy. Chữ theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`; chủ ngữ tự động "A.I Đỗ Đại Học". Commit theo đường dẫn, mỗi cụm một commit, xin Boss soát.

## CODE 1 — hàm thuần `src/lib/ve-dich.ts` (làm ngay SAU cụm Đợt 2 thuần)
- `soNo({now, baiDangChay[{maBtvn, ten, hanNop, moLuc[], daXong, cauMoiChang[], phutMoiChang[]}], onQuaLich[{ngay, soCau}], goiGiaDinh[]})` → danh sách món nợ gắn NGÀY VN của nó (chặng có `moLuc` < 00:00 hôm nay và chỉ số ≥ `daXong`; câu ôn có mốc < hôm nay; gói gia đình giao chưa xong của ngày trước), mỗi món {ngay, loai, ten, soCau, phut}.
- `keHoachVeDich({now, hanNop, viecConLai[], khungGioHoc{tu, den} (mặc định 19:30–22:30, máy chủ đưa khung thật của em từ 14 ngày gần nhất), tranBuoi{chang:2, cau:30, phut:60}, caKiemTraSapToi[]})` → `{gioConLai, phutCanLam, cacBuoi[{ngay, chang[], soCau, phut, batDauMuonNhat}], kip:boolean, canRutPhanLamThem:boolean}`: nợ trước, rồi chặng hôm nay, rồi chặng sau; không xếp sau 22:30, không xếp vào giờ có ca kiểm tra, KHÔNG xếp việc nào sau hạn nộp; buổi sáng của NGÀY HẠN được dùng nếu hạn rơi buổi trưa (khớp bản 1.3). Không nợ ⇒ mỗi buổi 1 chặng như cũ.
- Ôn quá lịch: `raiOnQuaLich(soCau, nganSach, coNoChang)` → rải ≤ 3 ngày; trần ôn 40 % ⇒ 60 % khi hôm đó em không nợ chặng.
- Test tính chất + đột biến: mọi việc bắt buộc được xếp TRƯỚC hạn hoặc `kip=false` (không bao giờ im lặng bỏ việc); không buổi nào vượt trần; `batDauMuonNhat` + phút của buổi ≤ 22:30 và ≤ hạn; đơn điệu: em trễ không nhận nhiều câu hơn em đúng nhịp; đủ giờ thì không rút phần làm thêm.

## CODE 3 — máy chủ (sau W2; gói riêng W3)
- Lệnh kế hoạch ngày trả thêm `no:{theoNgay[…], tongCau, tongPhut}` và `veDich[{maBtvn, ten, hanNop, gioConLai, chang[{chiSo, trangThai:'xong'|'no'|'hom_nay'|'sap_toi', ngay}], toiNay{soChang, soCau, phut, batDauMuonNhat}, cacBuoiSau[], kip, daRutPhanLamThem}]`; khung giờ học thật của em (su_kien_hoc 14 ngày, 1 truy vấn, có đệm).
- Kế hoạch ngày liệt kê ĐỦ các chặng cần làm hôm nay theo `keHoachVeDich` (hết cảnh chỉ một lô/bài); trả xong chặng nợ ⇒ chặng kế trong kế hoạch của hôm nay mở NGAY dù `moLuc` chưa tới (chỉ trong phạm vi kế hoạch về đích; vẫn tuần tự; thích nghi sau chặng vẫn chạy trước khi mở).
- ĐIỀU 4 = B — NỘP TRỄ (chỉ bài tập về nhà): qua hạn em VẪN làm và nộp được các chặng còn lại; lượt nộp ghi `nop_tre:1` + số giờ trễ (cột chỉ-thêm nếu cần, migration riêng); không EXP đúng hạn, không "đúng nhịp", không vé Đoàn từ chặng trễ hạn; điểm chấm như thường; thầy và phụ huynh thấy "nộp trễ N giờ". Chuỗi cũ "Bạn đã quá hạn nộp BTVN" / "nhờ Thầy gia hạn" đổi thành lời mới (Code 2 đặt chữ). Thầy vẫn gia hạn tay được như cũ; bài thầy đã KHOÁ tay thì vẫn khoá.
- Nhắc theo giờ: mốc M3 đổi thành 30 phút trước `batDauMuonNhat` của tối đó (trong khung 07:00–21:30 và trần thông báo): "Tối nay em cần khoảng 36 phút để về đúng nhịp. Bắt đầu trước 21:30 nhé." M1, M2, M4 giữ.
- Bảng tin thầy: khối nhịp thêm số em đang nợ theo lớp. `/ph/tat-ca-ve-con` thêm `no` của con.

## CODE 2 — màn (SAU khi Boss soát mẫu)
Thẻ "Đường về đích" ở đầu Bảng nhiệm vụ HS đúng mẫu: đường chặng (xong · nợ có nhãn thứ · hôm nay · sắp tới · cờ hạn), đồng hồ đếm ngược theo giờ LUÔN hiện khi có nợ, dòng "Tối nay: … bắt đầu muộn nhất …", MỘT nút, khối "Còn lại từ các ngày trước" theo ngày, cú hích "Còn N việc nữa là hôm nay ĐẠT", hoạt ảnh gạch tên ngày khi trả xong (tắt khi giảm chuyển động); không nợ ⇒ một dòng xanh. Cao ≤ 420 px ở 390. Trạng thái nộp trễ: "Bài đã qua hạn nộp · em vẫn cần làm nốt 2 chặng · sẽ ghi nộp trễ". Ẩn toàn bộ khi máy chủ chưa trả `veDich`.
