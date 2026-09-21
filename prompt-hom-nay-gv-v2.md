# ĐỀ BÀI — MÀN "HÔM NAY" CỦA THẦY, BẢN 2 (thầy lệnh 21/09, kèm 2 ảnh màn hiện tại)

Thầy: "bỏ hết những phần từ chỗ Việc cần theo dõi hôm nay… thiết kế lại rất đẹp, chia các ô trực quan, gộp cả vinh danh tinh tế… hiển thị những việc quan trọng nhất như học sinh không nộp BTVN, có hành động cụ thể: bấm nút cảnh báo ⇒ hiện cảnh báo lên app học sinh VÀ gửi thông báo cho phụ huynh; thống kê theo ngày những học sinh cần tôi giúp đỡ thật sự, yếu dạng nào chi tiết; một box chỉ cần nhắn tên học sinh hoặc số báo danh sẽ hiện ra mọi thứ học sinh đó làm từ trước tới nay — đẹp, trực quan, chân thật, cực kì chi tiết."
Quyết/soát: **Boss**. VẼ MẪU TRƯỚC (thầy duyệt) rồi mới build giao diện; phần máy chủ làm song song. Làn giáo viên ⇒ mọi commit cần dòng soát.

## BỎ (đang có trên màn, xem ảnh thầy gửi)
Khối xanh "Việc cần theo dõi hôm nay" + 3 nút · tiêu đề "Bảng tin của thầy" + ô ngày kiểu máy (09/21/2026) · "Hoạt động dạy học trong ngày" · "Bài đã giao" (gộp vào ô BTVN mới) · mọi chỗ hiện giờ kiểu 12 giờ ("12:59:00" là LỖI — phải "23:59").

## BỐ CỤC MỚI (lưới ô, 1440 → 3 cột · 1100 → 2 cột · 390 → 1 cột; ngôn ngữ thẻ M3 sẵn có)
0. **Đầu màn**: chào + ngày (dd/mm/yyyy, thứ) + **Ô TRA CỨU LỚN**: "Gõ tên hoặc số báo danh…" (gợi ý khi gõ, không dấu cũng ra; Enter mở TOÀN CẢNH em đó).
1. **4 ô số** (giữ): đạt nhiệm vụ hôm nay · BTVN đúng nhịp · câu tới hạn ôn · em cần thầy.
2. **Ô VIỆC GẤP — "Chưa nộp bài tập về nhà"** (ô lớn nhất): từng bài đang chạy — hạn (HH:mm · Thứ · dd/mm), đã nộp x/y, thanh tiến độ; danh sách em CHƯA NỘP xếp theo mức gấp, mỗi em một trạng thái thật ("chưa mở bài" / "dở chặng 2 trong 7" / "quá hạn 1 ngày") + nút **"Cảnh báo"**; nút gộp **"Cảnh báo cả N em"**. Sau khi bấm: dòng đổi thành "Đã cảnh báo 20:15 · em đã xem ✓/chưa · phụ huynh đã xem ✓/chưa".
3. **Ô "Em cần thầy giúp hôm nay"**: mỗi em — lý do bằng số + CHI TIẾT DẠNG: tên dạng · sai x/y câu · bậc hiện tại · xu hướng 7 ngày (mũi tên) · số ngày trễ nhịp; bấm em ⇒ mở TOÀN CẢNH. Hành động: Đưa vào buổi chữa · Giao bài riêng · Nhắn phụ huynh. Có bộ lọc theo lớp + nút "Xem cả N em".
4. **Ô "Bộ não A.I · đêm qua"** (gọn, đã có) · **Ô "Dạng cả lớp đang yếu"** (giữ, thêm chọn lớp) · **Ô "Buổi chữa tối nay"** (giữ).
5. **Ô "VINH DANH HÔM NAY"** — tinh tế, nhỏ mà sang: 3 bục — *Chăm nhất* (EXP hôm nay) · *Tiến bộ nhất* (số dạng lên bậc / câu đúng lại 7 ngày) · *Bền bỉ nhất* (chuỗi ngày); thêm "Điểm cao ca gần nhất" khi trong ngày có ca. Nút "Chiếu vinh danh" (dùng màn chiếu sẵn có nếu có). Không có dữ liệu ⇒ ô thu gọn một dòng, không bịa.
6. **Hàng cuối gọn**: Ca kiểm tra hôm nay · Truy cập trực tuyến · Đoàn Hộ Tống.

## TOÀN CẢNH MỘT EM (mở từ ô tra cứu / bấm tên ở bất kỳ ô nào)
Trang riêng (không phải hộp nhỏ), cực kì chi tiết nhưng dễ đọc: (a) đầu trang: tên, SBD, lớp, thần thú/cấp, chuỗi ngày, lần hoạt động cuối, các nút hành động; (b) **DÒNG THỜI GIAN** mọi việc em đã làm, mới nhất trên cùng, lọc theo loại: ca thi (điểm, rời màn, thời gian) · BTVN (bài nào, chặng nào, câu nào đúng/sai, mất bao lâu) · ôn lại · bài riêng/Mẹ giao · lên bảng · game · EXP · lời Bộ não A.I đã nhắn em/phụ huynh · cảnh báo thầy đã gửi · lần mở app; (c) bản đồ DẠNG: mỗi dạng một dòng — bậc, gặp/sai/đã khắc phục, xu hướng, câu sai gần nhất (bấm xem câu + em chọn gì); (d) nhịp học 30 ngày (lưới ngày kiểu lịch nhiệt); (e) phụ huynh: lần xem app gần nhất. Mọi con số truy được về dữ liệu thật; chỗ chưa có dữ liệu ghi "chưa có", không bịa. Không kết luận năng lực từ điểm; không chữ "nắm chắc".

## CHIA LÀN
- **Code 4**: VẼ MẪU 3 ảnh (Hôm nay 1440 · Hôm nay 390 · Toàn cảnh một em 1440) → `docs/ban-ve-hom-nay-v2-2109/` → báo Boss (Boss gửi thầy). Thầy duyệt rồi build; màn cũ `ExamHubScreen`/`HomNayScreen`: bỏ các khối trong mục BỎ, giữ mọi hàm/nút còn dùng; test khoá chuỗi cũ sửa CÓ CHỦ Ý, ghi sổ.
- **Code 3**: hợp đồng `docs/hop-dong-hom-nay-v2-2109.md` + lệnh thầy: `/gv/chua-nop {ngay?, lop?}` (đọc) · `/gv/canh-bao-nop-bai {maBtvn, dsSbd[], loiNhan?}` (GHI: tạo thông báo cho EM — kênh `student_notice`/push sẵn có — và cho PHỤ HUYNH trong app phụ huynh + push nếu có; trần MỘT cảnh báo/em/bài/ngày; trả `{daGui, boQua[{sbd, lyDo}]}`; lưu nhật ký; trạng thái đã xem) · `/gv/can-giup {ngay?, lop?}` (đọc, chi tiết dạng) · `/gv/vinh-danh-ngay` (đọc) · `/gv/tim-em {q}` (tên không dấu / SBD, ≤ 10 gợi ý) · `/gv/em-toan-canh {sbd, truoc?, loai?}` (đọc, phân trang theo thời gian; nguồn `su_kien_hoc`, `luot`, `btvn_em`(+`btvn_em_cau`), `len_bang`, `exp_so`, `ai_dieu_chinh`, nhật ký cảnh báo, `app_presence`). Đo truy vấn mỗi lệnh (≤ 12).
- **Code 2**: app học sinh hiện CẢNH BÁO của thầy (thẻ nổi bật ở đầu bảng nhiệm vụ: "Thầy nhắc: em chưa nộp Bài tập về nhà — hạn 23:59 hôm nay", nút "Làm ngay"; em bấm đã xem ⇒ máy chủ ghi); app phụ huynh hiện thông báo tương ứng. Lời mặc định tế nhị, không doạ; thầy sửa được lời trước khi gửi.
- Nguyên tắc cảnh báo: chỉ thầy bấm mới gửi (Bộ não A.I KHÔNG tự gửi cảnh báo); nói đúng sự thật (chưa mở / dở chặng mấy / hạn lúc nào); không so với bạn.
