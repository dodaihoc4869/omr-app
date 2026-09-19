# Prompt — Cá nhân hoá "tiến bộ từng ngày" cho 5 kênh omr-app

Soạn 19/09/2026. Gõ `HÃY THỰC THI PROMPT NÀY` mới làm.
Thiết kế chi tiết: `DE-XUAT-CA-NHAN-HOA-1909.md` cùng thư mục.

### Góc nhìn khác

Bài toán không phải "viết thuật toán rút câu thông minh hơn". Dự án đã có 6 engine chọn câu tốt, mỗi cái đều có test. Bài toán thật là **7 kho kết quả không nhìn thấy nhau**: em làm đúng lại câu sai ở BTVN, ở game, ở bài mẹ giao — rút đề, khắc phục, lên bảng vẫn coi câu đó "sai chưa chữa", và ba nơi tự tính ba ngân sách ngày. Câu hỏi nên hỏi là: *một câu em vừa làm đúng ở đâu đó, bao lâu sau thì cả 5 kênh cùng biết?* Trả lời được câu đó bằng một sổ bằng chứng chung, một hồ sơ nắm kiến thức, một bộ điều phối ngày — thì "tiến bộ từng ngày" tự có, không cần đụng engine nào.

### Người top 0,1% làm gì

- **Ghi sổ ở chỗ chấm, không ở chỗ hiển thị.** 7 handler đã có đáp án chấm trong tay; chỉ thiếu một dòng gọi `ghiSuKien`. Ai đi sửa 3 màn client để "đồng bộ" là làm sai chỗ.
- **Không sửa `ban_do_sai`, không viết lại `tinhNganSachNgay`, không đụng blueprint parity** — ba thứ đó có test khoá và luật thầy chốt. Chỉ đổi đầu vào cho chúng.
- **"Xong lô" phải đi kèm đáp án.** Xong không cần đúng thì "tiến bộ từng ngày" là số bịa. Người giỏi bắt `/btvn/xong-lo` nhận đáp án ngay từ đầu.
- **Đúng 3 lần cùng một tối không phải 3 mốc.** Ôn giãn cách chỉ tính đúng ở *ngày khác*; ai quên điều này sẽ cho "đã khắc phục" sau 10 phút.
- **Kiểm khả thi trước khi hứa.** EDF có điều kiện cần-và-đủ Σ việc ≤ ngân sách × số ngày; không đạt thì nói con số "cần N câu/ngày", không cắt việc bắt buộc, không giấu.
- **Phát hành 3 giai đoạn đầu mà người dùng không thấy gì đổi** (chỉ thêm ghi + lệnh đọc mới). Đổi giao diện sau khi sổ đã có dữ liệu thật ít nhất vài ngày.

### PROMPT

```
VAI TRÒ
Kỹ sư trưởng của omr-app (3 app giáo viên/học sinh/phụ huynh + Cloudflare Worker/D1/R2, mã tiếng Việt), đã phát hành cho lớp luyện thi Hoá này 20 lượt, thuộc từng bảng D1 và từng test trong tests/.

BỐI CẢNH
Kho mã tại /Volumes/SSD NGOÀI/omr-app. Lớp luyện thi Hoá 100–300 học sinh, 30–40 em/ca. Người dùng: thầy (máy thầy), học sinh (điện thoại), phụ huynh (điện thoại). Thiết kế đã chốt nằm ở DE-XUAT-CA-NHAN-HOA-1909.md (đọc HẾT trước khi gõ dòng mã đầu tiên). Sổ việc là SO-VIEC.md (lượt mới nhất nằm trên; dùng Edit/prepend, KHÔNG Write đè). Phát hành bằng ./DAY-TAT-CA.command; migration D1 bằng npx wrangler d1 execute omr --file=server/<tệp>.sql --remote -y.

NHIỆM VỤ
Xây 7 giai đoạn (GĐ 0→6) trong mục 4 của DE-XUAT-CA-NHAN-HOA-1909.md theo đúng thứ tự, mỗi giai đoạn xong thì chạy test, build, phát hành, ghi sổ việc kèm bằng chứng, rồi mới sang giai đoạn kế.

NGUYÊN TẮC BẮT BUỘC
- Mọi thuật toán tất định: seed = hashSeed(...) từ src/lib/exam-shuffle.ts, now truyền từ giờ máy chủ; cấm Math.random/Date.now trong hàm thuần. Test: chạy 2 lần cùng đầu vào phải ra cùng JSON.
- Mỗi giai đoạn chỉ THÊM bảng/cột (migration additive, có phòng vệ khi chưa chạy migration như xongLoBtvn đang làm); không xoá/đổi cột cũ; ca thi, điểm, chi_tiet_cau, tien_do_hs do chamDiem tính giữ nguyên.
- Hồ sơ ghi bằng MỘT hàm ghiSuKien duy nhất; mỗi handler nộp/chấm (chamDiem, nopBtvnQuaPhieu, xongLoBtvn, nopKhacPhuc, mom submit, ghiLenBangMoi, game answer, luyenDe submit) có test đếm đúng số dòng ghi và idempotent.
- Bỏ trống = "chưa làm" (ket_qua NULL), không cộng lan_sai; đúng cùng ngày VN chỉ tính một mốc; mốc ôn 1/3/7 theo NGÀY.
- Mỗi lệnh máy chủ ≤ 3 câu truy vấn trên đường nộp, cron gộp theo lớp ≤ 50 em/lượt; gói đề và đáp án chỉ ở R2, không bao giờ trả về máy em trước khi nộp (bỏ dapAn khỏi #du-nop ở html-phieu.ts).
- Chỗ thiếu dữ liệu phải hiện chữ nói thật kèm số ("chưa đo được tốc độ, 2/5 mẫu"); cấm bịa, cấm chữ "nắm chắc".
- Mọi hằng số mới nằm trong server/src/ho-so-cau-hinh.ts và dùng chung với chan-doan-cau-hinh.ts; có test soi hai bản không lệch.
- Trước khi sửa một test đang xanh, ghi vào SO-VIEC.md test nào, dòng nào, vì sao (chỉ được đổi 6 tệp đã liệt kê ở mục 4 của đề xuất).

GIẢ ĐỊNH ĐÃ DÙNG (thầy sửa một dòng là xong)
- Phút học/ngày mặc định khi chưa đặt: 20 phút.
- Số câu phụ huynh giao hàng ngày = phần dư ngân sách (0–16); xoá test parent-news 71-95 (18/24/36) và sửa 12-34.
- Xoá ba test khoá "3 Vòng Phân Tầng": btvn-thong-minh:46-71, btvn-phan-tang-va-1click:132-148, tro-ly-ca-nhan.test:63-88.
- Thần thú khi còn nợ lô tới mốc: vẫn chơi được, nhiệm vụ đứng sau cổng.
- daily_ chưa bắt đầu tới 00:01 hôm sau thì bỏ, không tính tồn đọng; BTVN quá hạn không tính tồn đọng, liệt kê riêng với nút xin gia hạn.
- Ngày nghỉ (cau_hinh key ngay_nghi) không đứt streak.
- Đề riêng: danh sách em = phòng chờ; ghiLenBangMoi ngừng cộng tien_do_hs.
- Phụ huynh đặt phút/ngày và xem kế hoạch cần token PH; làm ở GĐ 5, các GĐ trước giữ đường SBD như hiện nay.

KHÔNG ĐƯỢC LÀM
- Không viết lại sinhBoTheoEm, de-rieng-tran-trung, tinhLichLoBtvn, tinhNganSachNgay, xep-buoi-chua, chooseSession — chỉ đổi đầu vào/đầu ra của chúng.
- Không sửa ban_do_sai.so_lan_sai, không đổi khoá bảng cũ, không DELETE dữ liệu D1.
- Không gộp hai giai đoạn vào một lần phát hành; không phát hành khi còn test đỏ mới (98 test/43 tệp đỏ có sẵn được ghi nhận, không được tăng).
- Không đổi luật mom 120 phút, hạn BTVN 48 h, 3 lượt làm lại, EXP 2/câu trần 100/ngày, sàn 20 em/90 phút lên bảng.
- Không hỏi lại chi tiết vặt đã có trong GIẢ ĐỊNH; gặp chỗ đề xuất mâu thuẫn với mã thật thì ghi vào SO-VIEC.md và chọn phương án giữ bất biến test.

ĐỊNH DẠNG ĐẦU RA (mỗi giai đoạn)
1. Mục mới ở đầu SO-VIEC.md: tên GĐ, danh sách việc [x]/[ ] kèm bằng chứng (lệnh test + số passed, mã commit, tem bản dựng, link phát hành).
2. Migration server/migration-<ddmm>-<tên>.sql nếu có, kèm lệnh chạy và lệnh kiểm SELECT.
3. Test mới trong tests/<tên>-<ddmm>.test.ts; chạy npx vitest run <tệp> và dán số.
4. Chạy toàn bộ npx vitest run, dán "N failed | M passed" và so với nền 98/43.
5. Phát hành: ./DAY-TAT-CA.command, dán dòng "XONG CẢ HAI" và sw-version.json.
6. Một đoạn 3–5 dòng cho thầy: giai đoạn này người dùng thấy gì đổi (GĐ 0–2: "không thấy gì đổi" là đúng).

NGHIỆM THU (từng giai đoạn, đạt/trượt)
- GĐ 0: SELECT COUNT(*) FROM su_kien_hoc WHERE nguon='thi' bằng số dòng chi_tiet_cau có qid sau khi nạp lại; nộp BTVN thử 1 bài → có đúng số dòng nguon='btvn'.
- GĐ 1: phatLaiSuKien chạy 2 lần cùng sổ → nam_kt_cau giống hệt; câu sai 20/09 đúng 21/09, 22/09, 25/09 → da_khac_phuc; đúng 3 lần trong 21/09 → dung_lien_tiep = 1.
- GĐ 2: /hs/ke-hoach-ngay cho em có 2 BTVN (hạn 2 ngày và 14 ngày) → lô bài hạn gần đứng trước, taiKhac của bài hạn 14 ngày < 1/7 số câu còn lại; em không có bài → có việc bu đủ toiThieuCau.
- GĐ 3: cùng một em, N câu sáng ở phiếu = N ở bảng tin; câu moi_sai nằm ở lô 0; grep "dapAn" trong #du-nop của phiếu BTVN = 0 kết quả.
- GĐ 4–6: test tệp tương ứng xanh; toàn bộ vitest không tăng số đỏ so với nền; curl 3 URL trả 200 và sw-version.json đổi.
```

### Ba câu hỏi làm prompt sắc hơn

1. Thầy muốn phụ huynh **nhìn thấy** ngân sách và lô của con (đọc) hay còn được **hạ** phút/ngày (ghi)? Ghi thì cần token PH sớm hơn GĐ 5.
2. Câu `can_day_lai` (sai ≥ 3 lần, chưa đúng lại) — thầy muốn nó hiện ở đâu trước: tờ máy chiếu lên bảng, hay bảng tin thầy, hay cả hai?
3. Với lớp có ca thi 2–3 ngày/tuần, thầy muốn "ôn thi" (4 câu cùng chuyên đề ca sắp tới) là việc mềm (chỉ khi còn ngân sách) hay việc bắt buộc?

19/09/2026
