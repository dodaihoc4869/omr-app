# ĐỀ BÀI BUILD — Gọi lên bảng: bịt lộ tên · "em đã làm câu này chưa" · nút xoá phiên phân công

Boss soạn 21/09/2026 theo lệnh thầy (kèm ảnh tờ máy chiếu): "Phần lên bảng bị lộ tên bảng của Huy ở góc dưới bên phải bảng đen. Tôi muốn phần lên bảng quét được học sinh đã làm câu đó chưa, quét hết mọi lịch sử của học sinh đó. Hiển thị đã làm hay chưa làm, làm đúng hay sai trên thẻ tên sau khi hiện, thêm cho tôi 1 nút xoá phiên phân công lên bảng."

Làn: **Code 1** (màn + tờ máy chiếu, làn giáo viên ⇒ cần dòng "Boss đã soát"), **Code 3** (lệnh máy chủ, đẩy Worker), **Code 2** đẩy Pages. Ba việc, làm theo thứ tự A → B → C; A là P0, xin soát và đẩy riêng, không chờ B, C.

## A · P0 — lộ tên trước khi bấm "Hiện học sinh và thần thú"
- Chỗ lộ: `src/lib/html-may-chieu.ts:331, 359, 361` đặt `data-nhan="Phần làm bài của <tên em>"`; `src/lib/giao-dien-to-chieu.ts:141` in ra bằng `content:attr(data-nhan)` ⇒ tên hiện ở góc bảng đen NGAY từ đầu, trong khi thẻ tên còn ẩn.
- Sửa: trước khi hiện thẻ tên, nhãn là **"Phần làm bài của học sinh"** (không tên). Chỉ khi thẻ tên đã hiện (thầy bấm nút, hoặc hết giờ làm bài ở chế độ dạy học) mới đổi thành "Phần làm bài của <tên em>". Ẩn lại thẻ ⇒ nhãn về không tên.
- Soát luôn mọi chỗ NHÌN THẤY khác trên tờ có thể lộ tên/số báo danh/thần thú của em trước khi hiện (tiêu đề tab, chú thích, thanh đáy, dòng đợt). Thuộc tính không nhìn thấy (`aria-controls`…) không tính.
- Test: dựng tờ 2 kiểu bố cục (dòng 331 và 359–361) ⇒ trước khi hiện, phần chữ nhìn thấy KHÔNG chứa tên gọi, họ tên, số báo danh; sau khi hiện thì có. Đột biến "trả tên về `data-nhan` ban đầu" phải chết.

## B · "Em đã làm câu này chưa" — quét HẾT lịch sử
**Thầy lệnh rõ: lệnh này KHÔNG áp mốc hiển thị 12:00 ngày 21/09** (ngoại lệ có chủ ý của `docMocHienThi`; ghi chú thích ngay trong mã).

### B1 · Máy chủ (Code 3) — lệnh chỉ-đọc `/gv/lich-su-cau-cua-em`
- Cổng mã bí mật như mọi lệnh `/gv/*`. Vào: `{cap: [{sbd, qid}, …]}` tối đa 200 cặp/lần. Ra, theo từng cặp: `daLam` · `soLan` · `soDung` · `soSai` · `lanCuoi: {dung, ngay, nguon}` · `lenBang: {soLan, datLanCuoi}` (từ bảng `len_bang`).
- Nguồn: `su_kien_hoc` theo `(sbd, qid)` — đi bằng chỉ mục `idx_skh_em_qid` / `idx_skh_em_qid_ngay`, MỌI ngày. Anh xác nhận bằng dữ liệu thật những kênh nào ĐÃ nằm trong sổ (thấy các nguồn `thi`, `on_lai`, `luyen`, `game`, `do`, `len_bang`…); kênh nào CHƯA vào sổ (bài làm ca kiểm tra cũ, bài về nhà đã nộp trước ngày có sổ) thì đọc thêm từ bảng gốc HOẶC ghi rõ trong tài liệu là chưa phủ — không lặng lẽ bỏ.
- Bài về nhà CHƯA NỘP và ca CHƯA CÔNG BỐ: vẫn tính "đã làm" nhưng KHÔNG trả đúng/sai (`dung: null`) — màn chiếu trước lớp không thành đường lộ đáp án bài đang mở.
- Câu tự luận: không có đúng/sai tự chấm ⇒ chỉ `daLam` + `lenBang`.
- Một câu có thể mang qid khác nhau ở đề khác nhau: khớp theo qid; nếu kho có khoá gốc chung thì dùng, không có thì ghi rõ giới hạn trong tài liệu.
- Kèm: số truy vấn mỗi lần gọi, ước lượng dòng đọc/ngày, test (cặp chưa làm / đúng / sai / vừa đúng vừa sai / bài chưa nộp ⇒ `dung:null` / sai mã bí mật ⇒ từ chối / quá 200 cặp ⇒ từ chối). Hợp đồng: `docs/hop-dong-lich-su-cau-len-bang-2109.md`.

### B2 · Màn (Code 1) — nhãn trên THẺ TÊN, chỉ SAU KHI HIỆN
- Lúc thầy bấm chiếu / dựng tờ: gọi lệnh B1 một lần cho mọi cặp (em, câu) của bảng phân công, nhúng kết quả vào tờ. Không gọi được (mất mạng, máy chủ cũ) ⇒ KHÔNG hiện nhãn, không bịa.
- Nhãn (một dòng dưới tên, cỡ chữ đọc được từ cuối lớp):
  - chưa có dòng nào ⇒ **"Chưa làm câu này"** (xám)
  - lần gần nhất đúng ⇒ **"Đã làm · lần gần nhất đúng"** (xanh lá)
  - lần gần nhất sai ⇒ **"Đã làm · lần gần nhất sai"** (cam, không đỏ)
  - đã làm nhưng `dung:null` ⇒ **"Đã làm · chưa có kết quả"** (xám)
  - dòng phụ khi `soLan ≥ 2`: "3 lần: 1 đúng, 2 sai · gần nhất 19/09"; có `lenBang` ⇒ thêm "Đã lên bảng câu này 1 lần · đạt".
- Không gắn nhãn năng lực, không so em với em, không chữ "nắm chắc". Trước khi hiện thẻ tên: nhãn này cũng ẩn (nó nằm TRONG thẻ tên).
- Trên màn Gọi lên bảng của thầy (bảng phân công, không phải tờ chiếu): thêm cột nhỏ cùng nội dung để thầy biết trước khi chiếu.
- Test: 5 trạng thái nhãn; thiếu dữ liệu ⇒ không nhãn; nhãn không có trong phần nhìn thấy trước khi hiện. Tràn ngang 1280 và 1024 với tên dài.

## C · Nút "Xoá phiên phân công lên bảng" (Code 1)
- Đặt ở màn Gọi lên bảng, cạnh thẻ "Tiếp tục buổi chữa" / trong Cài đặt của buổi; nút phụ, không nổi bật hơn nút chính.
- Bấm ⇒ hộp xác nhận nói thật: "Xoá phiên phân công lên bảng của ca <tên ca>? Bảng phân công và tiến độ các đợt trên máy này sẽ mất. Kết quả Đạt / Chưa đạt đã ghi vào hồ sơ học sinh KHÔNG bị xoá." Hai nút: "Xoá phiên" / "Giữ lại".
- Làm gì: `xoaBuoiChua(khoa)` + dọn trạng thái phân công đang mở trên màn, đưa màn về lúc chưa phân công để thầy phân công lại từ đầu. **KHÔNG xoá dòng nào trên D1** (bảng `len_bang`, `su_kien_hoc` giữ nguyên). Nếu thấy cần xoá dữ liệu máy chủ ⇒ DỪNG, báo Boss.
- Test: sau xoá, mở lại màn không còn thẻ "Tiếp tục"; phân công lại ra bảng mới; không lệnh ghi nào gửi lên máy chủ.

## NGHIỆM THU
1. Tờ chiếu trước khi hiện: không tên, không số báo danh, không nhãn lịch sử ở bất kỳ chỗ nhìn thấy nào (ảnh 1280×720, JPG ≤ 150 KB).
2. Sau khi hiện: thẻ tên có đúng một trong bốn nhãn, khớp dữ liệu máy chủ của em thử.
3. Lệnh máy chủ: chỉ-đọc, ≤ 3 truy vấn/lần gọi, có số dòng đọc đo trên D1 thật.
4. Nút xoá: có xác nhận, không đụng D1, phân công lại được ngay.
5. Từ ngữ theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`; `check:mau`, `soi:giao-dien`, tsc sạch; test liên quan xanh; Code 1 tự chạy toàn bộ vitest trước khi xin soát vì đụng tệp dùng chung `html-may-chieu.ts`.
