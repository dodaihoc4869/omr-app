# Bong bóng chat «A.I Đỗ Đại Học» trong app học sinh — đặc tả 7 mục (24/10/2026)

Thầy 24/10: «trên app học sinh có một bong bóng chat a.i DDH gắn với văn phòng Javis DDH, chức năng rút câu giải bài cho học sinh giống với hiện tại của văn phòng, giao diện siêu đẹp, thân thiện với học sinh, ẩn ở bài kiểm tra». Thầy sửa: «nó phải hoạt động đúng như trong Văn phòng». Thầy chốt: «bạn tự tối ưu thông minh nhất hiệu quả nhất».

Bản vẽ: `docs/ban-ve-ai-ddh-2410/` (3 khổ × sáng/tối, Chromium thật: 0 lỗi trang, 0 tràn, 0 đích bấm < 44 px). Mã văn phòng đã đọc: repo `javisdodaihoc` commit `fbc36b9`.

## 1. Mục tiêu + ai dùng
- Học sinh hỏi bài ngay trong app, nhận ĐÚNG câu trả lời văn phòng đang gửi qua Zalo (cùng bộ não, cùng giọng Thầy, cùng định dạng). Bong bóng là **một kênh nữa của văn phòng**, máy chủ app KHÔNG tự giải.
- Luồng văn phòng giữ nguyên (`tro_giang/giai_bai.py`): đọc ảnh trên Mac (Vision) → **tìm câu trong kho** (`kho_bai.tim`, bản sao kho app) → có: giữ nguyên đáp án + lời giải kho, viết lại giọng Thầy → không có: **hai lượt giải độc lập song song**, lệch thì lượt phân xử, vẫn không chắc thì «thầy xem kĩ câu này rồi trả lời e liền» → bộ soát Hoá (cân bằng, điện tích) trượt thì không gửi → câu dài kèm **trang lời giải từng bước** (ddh-tai-lieu).
- Thêm ở app (văn phòng chưa có): **khoá khi đang kiểm tra** và **chỉ gợi ý với câu nằm trong bài em chưa nộp**.

## 2. Bố cục
- Bong bóng tròn 60 px góc phải dưới, trên thanh điều hướng (+ vùng tai thỏ); chấm vàng khi có tin mới. Lần đầu có lời mời một dòng.
- Điện thoại: tấm chat trượt lên gần kín màn. Máy tính bảng/máy tính: khung 420 × 720 nổi góc phải, app phía sau vẫn dùng được.
- Đầu tấm: logo, «A.I Đỗ Đại Học», đèn trạng thái văn phòng (đang trực / đang nghỉ). Cuối: chụp ảnh đề · chọn ảnh có sẵn · ô gõ/dán · nút gửi.
- Tin văn phòng hiển thị đúng định dạng Zalo của văn phòng: dòng đầu **đáp án đỏ đậm**, bước **1.** **2.**, phương trình xanh, chỗ hay nhầm cam, chỉ số Unicode. Dưới tin có dòng nguồn nhỏ: «Lời giải từ kho đề của Thầy» / «Thầy giải hai lượt độc lập, khớp nhau» / «Chỉ gợi ý: câu trong bài em chưa nộp». Trang lời giải hiện thành thẻ bấm mở trong app.

## 3. Trạng thái
Chào (lần đầu) · đang gửi ảnh (%) · «Thầy đang soạn…» · nhiều ảnh ⇒ «N câu hả, để thầy làm lần lượt từng câu» rồi «Câu 1: …» · câu ngoài kho chưa chắc ⇒ «thầy xem kĩ…» rồi tin giải sau · chỉ gợi ý · văn phòng nghỉ (câu được giữ, trả lời khi mở lại, chấm vàng) · đang có bài kiểm tra ⇒ khoá cả tấm · hết lượt (50 câu bài tập/ngày như Zalo) · mất mạng (giữ tin trên máy, có mạng tự gửi) · câu không phải bài tập ⇒ văn phòng trả lời như tin Zalo thường.

## 4. Dữ liệu (máy chủ app + văn phòng)
- Bảng mới CHỈ-THÊM: `ai_ddh_tin` (id, sbd, ben 'em'|'vp', noi_dung, anh_r2[], qid_khop, nguon, chi_goi_y, trang_url, trang_thai, luc) và `ai_ddh_van_phong` (lần cuối văn phòng hỏi). Ảnh lên R2 `ai-ddh/<sbd>/<id>.jpg` (nén ≤ 1600 px trên máy em).
- Học sinh (token): `POST /hs/ai-ddh/gui {token, chu?, anh?[]}` · `POST /hs/ai-ddh/tin {token, sau?}` (tin mới) · `POST /hs/ai-ddh/anh-len` (lấy địa chỉ ký để tải ảnh).
- Văn phòng (mã GV, gọi ra như các lệnh `/gv/*` đang dùng — Mac không cần mở cổng): `POST /gv/ai-ddh/hang-cho` (lấy tin chờ + SBD, họ tên, lớp, 10 tin gần nhất, đường ảnh ký 10 phút) · `POST /gv/ai-ddh/kiem-cau {sbd, qid}` (sau khi `kho_bai` khớp câu: em được xem đáp án chưa) · `POST /gv/ai-ddh/tra-loi {id, tin[], nguon, qid?, trang_url?}`.
- Văn phòng: thêm `tro_giang/kenh_app.py` chạy cạnh `TroGiang.chay`: hỏi hàng chờ 2 giây/lần khi có em đang chờ, 10 giây khi vắng; đưa vào ĐÚNG `giai_bai.giai(...)` + `_soat_tin`, bộ lọc chữ cấm của `gui.kiem`, trần lượt; trả `tin_zalo` (chữ đánh dấu của văn phòng, app tự vẽ màu) + trang HTML.

## 5. Ngoại lệ
- **Chống gian lận (máy chủ, không chỉ ẩn giao diện):** em có ca kiểm tra mở (`coCaDangMo`) hoặc chặng kiểm tra cá nhân đang mở ⇒ từ chối nhận tin, tấm khoá; bong bóng ẩn ở màn thi, phòng chờ, kiểm tra cá nhân, game. Câu khớp kho mà nằm trong bài em chưa nộp hoặc ca chưa công bố (`cauDangBaoVe`) ⇒ `kiem-cau` trả «chỉ gợi ý» ⇒ văn phòng chỉ gợi hướng, không đáp án.
- Văn phòng không hỏi > 60 giây ⇒ app báo «văn phòng đang nghỉ», tin vẫn giữ. Bấm gửi lặp ⇒ một tin (khoá theo mã tin máy em). Ảnh > 8 tấm ⇒ nhận 8 (như văn phòng). Tin dài ⇒ tách tin như Zalo (1800 ký tự). Đổi tab/đóng tấm ⇒ tin vẫn tới, chấm vàng.

## 6. Chi phí máy chủ
- Mở app: **0 lệnh** (bong bóng nạp lười, ngoài precache). Mở tấm: 1 lệnh đọc. Gửi: 1 ghi. Đang chờ trả lời: 1 lệnh đọc nhẹ mỗi 3 giây, chỉ khi tấm mở; đóng tấm thì 60 giây/lần tới khi có trả lời, xong là dừng.
- Văn phòng hỏi hàng chờ: 1 lệnh đọc theo chỉ mục (trang_thai, luc). Không gọi AI nào trên máy chủ app.

## 7. Nghiệm thu đo bằng máy
- Test vitest: `ai-ddh-may-chu-2410` (khoá khi ca mở / KTCN mở; chỉ gợi ý với câu chưa nộp; hàng chờ, trả lời, trần 50; ảnh ký hết hạn), `ai-ddh-giao-dien-2410` (vẽ đánh dấu đỏ/xanh/cam/đậm, không HTML lạ; bong bóng không hiện ở màn thi), `ai-ddh-toc-do` (0 lệnh lúc mở app). Văn phòng: `pytest ddh_office/tests/test_kenh_app.py`.
- `npm run kiem:toc-do` 0 đỏ (mốc chỉ hạ), `npm run kiem:mau-giu` 0, precache ≤ 170, ảnh Chromium 0 lỗi/0 tràn/0 đích < 44 px.
- Phát hành sau công tắc `cau_hinh.ai_ddh` (tắt / thử theo lớp / bật), mặc định chạy thử một lớp.
