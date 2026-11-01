# Đặc tả «Một trang về con» — app phụ huynh `/ph` (thầy 01/11)

Thầy: «trùng tu app phụ huynh, mọi thông tin chỉ gọn 1 trang không phải cuộn … cập nhật 4 số đo mới hôm nay cực kì trực quan … tối ưu xoay ngang và máy tính». Thầy chốt bản vẽ 01/11 («ok chốt build»), sau đó «bỏ ô nhắn thầy đi nhé» ⇒ đầu trang chỉ còn tên con + nút «…».
Bản vẽ: `ph-mot-trang.html` (+ `mau.css` token thật · `trang.css` bố cục · `o-khoi.css` các ô · `tam.css` tấm · `du-lieu.js` dữ liệu GIẢ · `ve.js`). Ảnh: `anh/`. Kiểm máy: `kiem.json` (`chup.cjs`).

## 1. Mục tiêu + ai dùng
Phụ huynh (thường không rành công nghệ) mở liên kết thầy gửi, **đọc hiểu trong 10 giây**: hôm nay con học chưa, con học thật hay đối phó, chăm hay lười, điểm kiểm tra ra sao, việc gì sắp tới, mình nên làm gì. Một trang, không cuộn, ở mọi khổ; chi tiết sâu mở bằng tấm (điện thoại: trượt từ dưới; khổ rộng: ngăn kéo phải). Lời trung thực mà tế nhị: không doạ, không bêu, luôn kèm «anh chị nên làm gì».

**Danh mục thông tin + NGUỒN** (ĐÃ CÓ = lệnh đang trả; THÊM = chỉ-thêm ở máy chủ):

| Khối | Nội dung | Nguồn |
|---|---|---|
| Đầu trang | Tên con · lớp · thứ ngày · giờ cập nhật · nút «…» (Đổi số báo danh, Thông tin) | ĐÃ CÓ `/ph/tat-ca-ve-con` (`hoTen`, `serverNow`) |
| Hôm nay | Câu lớn «Hôm nay con học X phút, làm Y câu, đúng Z.» · câu phụ · chip «Đủ mức hôm nay» / «Chưa đủ mức» · «Chuỗi N ngày» · 14 ô ngày (đủ / chưa đủ / không học / hôm nay) | ĐÃ CÓ `/ph/con-tong-quan` (`dem.homNay`, `ngay[]` trangThai) + `/ph/tat-ca-ve-con` `tongQuan` (`phutHoc`, `chuoiNgayHoc`, `mucTieu`) |
| 4 số đo | Học thật · Đối phó · Chăm · Lười: vòng 0–100, chữ mức, nghĩa một dòng, xu hướng 14 ngày, 1 bằng chứng ngắn | THÊM `/ph/bon-so-do` (đọc `bon_chi_so_em` của ĐÚNG con: `ht dp ch lu`, `the_json`, `ngay_json`) |
| Tấm số đo | «Nói gì», cột 14 ngày + mốc tốt, «Vì sao?» 2–3 bằng chứng lời thường + ví dụ có giờ, «Anh chị nên làm gì», chú thích cách tính | THÊM như trên; câu phụ huynh dịch ở máy (bảng mục 3) |
| Kiểm tra gần nhất | Điểm /10, ↑↓ so với ca trước, đường 5 ca, tên ca · ngày; máy tính: Phần I/II/III | ĐÃ CÓ `tat-ca-ve-con` `caGanNhat` (`ketQua`, `truoc`, `phan`, `congBo`) + `tienBo.diem` |
| Con cần luyện thêm | 2–3 dạng đúng ít nhất: «đúng 4/10» + thanh | ĐÃ CÓ `tat-ca-ve-con` `dangVap` (`ten`, `dung`, `tong`) |
| Sắp tới | Hạn nộp BTVN · bài kiểm tra ôn tập (ô lịch thứ + ngày) | ĐÃ CÓ `baiTapVeNha.dangChay` + `/ph/hoc-2` `kiemTraCaNhan`. Lịch ca kiểm tra cả lớp: CHƯA có lệnh cho phụ huynh (đợt sau) |
| Thầy nhắn | Cảnh báo của thầy, nếu không có thì nhận xét mới nhất | ĐÃ CÓ `/ph/ke-hoach` cảnh báo + `/ph/loi-thay` |
| Anh chị nên làm gì | 1–3 việc cụ thể | Máy ghép: luật theo 4 số đo + hôm nay + `phuHuynhLamGi` (ĐÃ CÓ) |

Dữ liệu CẦN máy chủ thêm (chỉ-thêm, không đổi schema): lệnh `/ph/bon-so-do` (mục 6). Chưa có, để đợt sau: lịch sử điểm 4 số đo theo ngày (bảng mới `bon_chi_so_lich_su` chỉ-thêm) — đợt này «xu hướng 14 ngày» dựng từ `ngay_json` (câu làm kỹ / câu chọn vội / mức mỗi ngày), «so với tuần trước» = 7 ngày sau so 7 ngày trước của chính số đó.

## 2. Bố cục từng khổ (một trang, `height: 100dvh`, không cuộn)
- **Điện thoại dọc (< 640 px)**: đầu trang → Hôm nay (nền xanh đậm anh hùng) → «Con học thế nào» 2×2 (cột trái «↑ Càng cao càng tốt»: Học thật, Chăm; cột phải «↓ Càng thấp càng tốt»: Đối phó, Lười) → [Kiểm tra gần nhất | Con cần luyện thêm] → [Sắp tới | Thầy nhắn] → Anh chị nên làm gì (1 việc + «1/3 · Xem thêm»). Thấp (thanh địa chỉ, Z Fold gập 360×700–800): bớt dòng phụ theo bậc ≤ 820 / ≤ 760 / ≤ 720 px, không bớt số chính.
- **Ngang / Z Fold mở 904×690 / máy tính bảng / máy tính**: ba cột — [Hôm nay, Thầy nhắn, Nên làm gì] · [4 số đo, ô đứng: vòng to + đường xu hướng + «↑ 6 so với tuần trước» + bằng chứng ngắn] · [Kiểm tra (đường 5 ca có nhãn ngày, máy tính thêm Phần I/II/III), Luyện thêm, Sắp tới]. Ngang thấp (≤ 500 px cao): chữ gọn, 1 việc «nên làm».
- **Tấm**: điện thoại trượt từ dưới (≤ 92% cao, thân tấm tự cuộn, `overscroll-behavior: contain`); khổ rộng ngăn kéo phải `min(460px, 54vw)`. Đóng: nút ✕ 44 px · Esc · bấm nền.
- Mọi ô bấm được là `<button>` ≥ 44 px; không chữ nào bị cắt ngang dòng (chỉ được rút gọn sạch bằng «…»).

**Trạng thái**: đang tải = khung xương giữ chỗ từng ô; rỗng = câu nói vì sao + việc tiếp («Thầy đang tính 4 số đo, có từ sáng mai», «Chưa đủ lượt làm để tính (cần 40 lượt)», «Chưa có ca kiểm tra», «Không có việc nào sắp đến hạn»); lỗi = lý do thật + «Thử lại» ở đúng ô; mất mạng = giữ bản đã tải + dòng báo.

## 3. Bảng từ ngữ thầy → phụ huynh
| Thầy (app thầy) | Phụ huynh |
|---|---|
| Học thật (bảng `ht`) | **Học thật** · nghĩa «tự nghĩ, tự sửa» · mức: ≥ 75 «Tốt», 50–74 «Khá», < 50 «Cần để ý» |
| Học đối phó (`dp`) | **Đối phó** · «làm cho xong» · < 30 «Ít, tốt», 30–49 «Có lúc», ≥ 50 «Cao» |
| Chăm (`ch`) | **Chăm** · «học đều đặn» · ≥ 75 «Rất đều», 50–74 «Khá đều», < 50 «Chưa đều» |
| Lười (`lu` = 100 − Chăm) | **Lười** · «bỏ ngày, làm ít» · < 30 «Ít, tốt», 30–59 «Có lúc», ≥ 60 «Cao» |
| Chọn khi chưa kịp đọc hết đề (`voi`) | «lượt con chọn đáp án khi chưa đọc hết đề» |
| Dò đáp án (`do`) | «lượt con thử nhiều đáp án rồi mới bấm Kiểm tra (dò đáp án)» |
| Bấm cùng một chữ nhiều câu liền (`lap`) | «lần con bấm cùng một đáp án nhiều câu liền» |
| Luyện tập cao, kiểm tra thấp (`lech`) | «lúc luyện đúng nhiều nhưng kiểm tra thấp» |
| Câu sai để đó không sửa (`boMac`) | «câu sai con để đó, chưa sửa» |
| Treo máy cho đủ giờ (`treo`) | «lượt con để máy đứng lâu mà không làm» |
| Mở lời giải trước khi tự làm (`goiY`) | «lượt con mở lời giải trước khi tự làm» |
| Thuộc đáp án, đổi số liệu là sai (`songSinh`) | «đổi số liệu là con làm sai (học thuộc đáp án)» |
| Rời màn hình khi thi (`thi`) | «bài con rời màn hình khi thi» |
| Sửa câu sai đến khi đúng (`sua`) · Đọc kỹ (`ky`) · Đúng câu mới (`dungMoi`) | «câu từng sai con đã tự sửa đúng» · «câu con đọc đủ thời gian rồi mới chọn» · «câu mới con tự làm đúng ngay lần đầu» |
| Đủ mức mỗi ngày (`ngayDu`) · Làm đủ câu giao (`cauLam`) · Chuỗi (`chuoi`) · Lần cuối học (`lanCuoi`) | «ngày con làm đủ mức» · «câu thầy giao con đã làm» · «ngày đủ mức liền nhau» · «lần cuối con học» |
| Dạng em đang yếu | «Con cần luyện thêm» (chuẩn PH: «dạng con đang luyện thêm») |
| Trung vị cả lớp, hạng, «đang theo dõi» | KHÔNG hiện cho phụ huynh |
Xưng «con», «anh chị», «Thầy Đỗ Đại Học»; câu ≤ 30 chữ; không emoji; không mã nội bộ; ngày giờ «19:30 · Thứ Ba 03/11».

## 4. Màu + kiểu chữ (token có sẵn, KHÔNG thêm màu)
Chỉ `--ph3-*` (`src/styles/tokens.css`, sáng + tối theo máy) và thang `--t-*` / `--r-*` / `--k*`. Hôm nay = nền anh hùng `--ph3-ah-*` (số nhấn `--ph3-vong-hp`); mức tốt `--ph3-xl*`, để ý `--ph3-hp*`, cao `--ph3-ho*`; Thầy nhắn `--ph3-hp-nhat` (như `.ph3-the--thay`); Nên làm gì `--ph3-tim-nen` (như `.ph3-nut-tong`); nền che tấm `color-mix(--ph3-ah-nen 55%, transparent)`. Phông Inter có sẵn (`ph-moi/phong`). Số `tabular-nums`. Màu không bao giờ là kênh duy nhất (luôn có chữ mức).

## 5. Ngoại lệ
Số null (chưa đủ 40 lượt / dưới 3 ngày) ⇒ ô ghi «Chưa đủ dữ liệu» thay vòng; tên dài ⇒ «…»; nhiều con ⇒ menu «…» (đổi số báo danh như cũ); điểm chưa công bố ⇒ «Chờ thầy công bố điểm»; đổi tab / quay lại ⇒ giữ bản đã tải; máy yếu ⇒ không hoạt ảnh ngoài nhấn 120 ms, tôn trọng giảm chuyển động.

## 6. Chi phí máy chủ + tốc độ
- Lệnh mới `POST /ph/bon-so-do {pass}` (chỉ token phụ huynh, giống `/ph/danh-gia`): **một** câu `SELECT … FROM bon_chi_so_em WHERE sbd = ?` (khoá chính), không tính lại lúc mở (cron đêm đã tính sẵn); trả ≤ 3 bằng chứng mỗi số đo, bỏ `qid`, bỏ «cả lớp». Gọi SONG SONG với các lệnh mở hiện có — không thêm vòng chờ nối tiếp.
- Trang nạp lười như mảnh «Chỉ đọc» cũ (`DocPh`) — byte tải mở `/ph` không tăng; các màn cũ (điểm số, chi tiết ca, lời thầy) chỉ tải khi mở tấm.
- Riêng tư: chỉ con của phụ huynh đó (danh tính lấy từ token); không SBD / tên / điểm bạn khác, không hạng, không trung vị lớp.

## 7. Nghiệm thu + kế hoạch build
- Tệp: máy chủ `server/src/ph-bon-so-do.ts` (+ một dòng định tuyến `index.ts`); máy `src/lib/ph-v3/mot-trang-con.ts` (phép thuần: mức, câu chữ, nên làm gì, 14 ô, sắp tới), `src/lib/ph-v3/bon-so-do-api.ts`, `src/components/ph-v3/MotTrangCon.tsx` + `mot-trang-con.css`; `AppPhuHuynh.tsx` nạp mảnh mới thay `DocPh`.
- Test: `tests/ph-bon-so-do-0111.test.ts` (lệnh mới: chỉ con mình, bỏ qid/cả lớp, chưa có bản tính), `tests/ph-mot-trang-con-0111.test.tsx` (phép thuần + vẽ đủ khối + tấm mở/đóng + Esc); sửa `tests/ph-mot-trang-2610.test.tsx` theo trang mới.
- Cổng: `tsc` (app + server), test ph-* + toc-do, `npm run build:cf`, `node scripts/kiem-toc-do-tai.mjs` 0 đỏ, `kiem:mau-giu` 0, `check:mau`; ảnh Chromium từ bản build thật (dữ liệu giả qua `page.route`): 0 cuộn, 0 tràn, 0 đích < 44 px, 0 chữ cắt.
- Rủi ro: (1) điện thoại có thanh địa chỉ thấp hơn khổ vẽ ⇒ đã có bậc rút gọn theo chiều cao, kiểm 390×740 và 360×700; (2) trước 0:00 cron chưa tính bản hôm nay ⇒ hiện bản gần nhất kèm ngày tính; (3) chữ «Lười» trước mặt phụ huynh có thể nặng — thầy muốn đổi thì chỉ sửa bảng từ ngữ mục 3.
