# ĐỀ BÀI BUILD — "BỘ NÃO AI" chạy trên máy thầy (thầy CHỐT 21/09: "triển khai chạy trên máy tôi, tối ưu token, nâng đỡ rõ rệt từng ngày, cực kì thông minh, sát sao từng học sinh")

Thiết kế: `DE-XUAT-BO-NAO-AI-2109.md` (bản 2, 4 tầng). Cẩm nang bộ não (KHUÔN đầu ra + nguyên tắc): `bo-nao/HUONG-DAN-BO-NAO.md` — KHUÔN ở đó là hợp đồng. Quyết/soát: **Boss**; mọi commit cần dòng soát. **THỨ TỰ ƯU TIÊN: BTVN nâng đỡ Đợt 1 vẫn là việc số 1; việc bộ não làm NGAY SAU phần Đợt 1 của mỗi phiên.**

## SÁT SAO TỪNG EM mà vẫn ít token — ba nhịp soi
- **Soi nhanh MỌI em có hoạt động** mỗi đêm: thẻ ngắn ≤ 300 token/em, 40 em/tệp, mô hình nhỏ.
- **Soi kỹ** em bị thuật toán gắn cờ (tụt nhịp, bỏ dở, sai lặp, đúng nhanh bất thường, kẹt bậc > 5 ngày, vừa thi, mới vào) + **1/7 lớp xoay vòng** ⇒ tuần nào em nào cũng được soi kỹ một lần: hồ sơ đầy đủ ≤ 1.200 token, 12 em/tệp, mô hình vừa.
- **Em vắng ≥ 2 ngày**: một tệp riêng. Tổng mục tiêu ≤ 300 nghìn token/đêm cho 300 em.

## CHIA LÀN
### Code 1 — LÕI THUẦN `src/lib/bo-nao-dac-trung.ts` + `src/lib/bo-nao-khuon.ts` (máy chủ và mã lệnh cùng import)
`tinhDacTrung(suKien7Ngay, hoSo, keHoach, dieuChinhHomQua)` → thẻ ngắn + hồ sơ đầy đủ (mục 3 đề xuất: theo dạng gặp/đúng/sai/bậc/xu hướng, câu sai gần đây + phương án chọn nhầm, giây so với trung vị của CHÍNH em, chặng xong/bỏ dở ở câu mấy, nợ ôn, chuỗi ngày, EXP, điểm ca gần nhất). `phanLuong()` → `nhanh|sau|vang|bo_qua` + LÝ DO bằng số; xoay vòng 1/7 tất định theo `sbd`+ngày. `danhGiaDieuChinh(homQua, homNay)` → `an_thua|khong_doi|xau_di|chua_du_du_lieu` (đo: xong chặng, % đúng ở bậc đích, số câu đúng lại, lên bậc). `kiemKhuon(dauRa, theCuaEm)` → hợp lệ / lý do loại: biên độ, độ dài, TỪ CẤM, và **mọi con số trong `loiNhanChoEm` phải có trong thẻ của em**. Cổng `dieuChinh?` ở `btvn-nang-do.ts` (đã giao). Test tính chất + đột biến.
### Code 3 — MÁY CHỦ + HAI MÃ LỆNH
Bảng chỉ-thêm `ai_ho_so_ngay`, `ai_dieu_chinh` (sbd, ngay, json, do_tin, che_do `bong|that`, het_han = +3 ngày, ket_qua), `ai_ban_tin`. Cron 03:30 (giờ VN) dựng hồ sơ ngày (chia lượt, đo truy vấn). Lệnh thầy: `/ai/ho-so-ngay {ngay,trang}` (đọc) · `/ai/dieu-chinh/nop` (KIỂM LẠI bằng `kiemKhuon`, ghi) · `/ai/dem-qua` · `/ai/nhat-ky {sbd}` · `/ai/dieu-chinh/bo`. Cờ `cau_hinh.bo_nao {bat, cheDo:'bong', lopThat:[]}` — `bong` ⇒ lưu nhưng KHÔNG tầng nào đọc. Khi `that`: kế hoạch ngày + BTVN nâng đỡ đọc điều chỉnh còn hạn (qua cổng `dieuChinh`), `/hs/ke-hoach-ngay` trả `loiNhanHlv`. Trạng thái "bộ não chạy lần cuối lúc". `scripts/bo-nao/lay.mjs` + `nop.mjs`: Node thuần không phụ thuộc mới; đọc mã bí mật từ `~/.omr-bo-nao/ma-bi-mat` (thầy tự đặt; thiếu ⇒ báo lỗi bằng lời, KHÔNG hỏi, KHÔNG in); ẩn danh: tệp vào chỉ có bí danh, bảng `.bi-danh.json` tách riêng; chạy bù ngày lỡ; `nop.mjs` kiểm khuôn tại máy rồi mới gửi. `bo-nao/<ngày>/` nằm trong `.gitignore` (trừ `HUONG-DAN-BO-NAO.md`, `so-tay/`).
### Code 4 — APP THẦY
Màn Hôm nay: khối "Bộ não đêm qua" (bản tin ≤ 6 dòng, mỗi dòng một nút hành động; "chạy lần cuối lúc…", quá 36 giờ thì cảnh báo). Hồ sơ em: "Nhật ký điều chỉnh" (ngày · núm · lý do · kết quả hôm sau) + nút "Bỏ điều chỉnh này". Cài đặt: công tắc bộ não + chế độ bóng/thật theo lớp. Vẽ mẫu 1 ảnh trước, gửi Boss, build luôn.
### Code 2 — APP HỌC SINH
Bảng nhiệm vụ: một dòng "lời nhắn của huấn luyện viên" (`loiNhanHlv`), nhẹ, tắt được, không có thì không hiện gì.
### Boss
Cẩm nang + sổ tay `bo-nao/so-tay/bai-hoc.md` · tác vụ hẹn giờ 04:00 · hướng dẫn thầy cài một lần (đặt mã bí mật, cho phép 2 mã lệnh + thư mục, giữ máy thức) · chạy thử đêm đầu · soi chất lượng 7 đêm bóng · mỗi Chủ nhật đề xuất chỉnh tham số.

## NGHIỆM THU
1. Đêm chạy thử: mọi em có hoạt động đều có một phần tử đầu ra; ≥ 95 % qua kiểm khuôn; 0 lời nhắn chứa số không có trong thẻ; bí danh không lộ SBD/tên. 2. Chế độ `bong`: kế hoạch ngày và BTVN của học sinh KHÔNG đổi một byte (test khoá). 3. Tổng token đêm chạy thử ≤ 300 nghìn cho cỡ lớp thật. 4. Tắt máy thầy một đêm ⇒ app học sinh chạy bình thường, màn Hôm nay báo đúng.

## CẬP NHẬT 21/09 — THẦY CHỐT: "build dùng PHIÊN làm não trước và chạy luôn từ hôm nay" (gói Max tới 04/10 ⇒ 13 đêm đo token)
MỤC TIÊU ĐÊM NAY: lượt CHẠY BÓNG đầu tiên lúc 04:00 sáng 22/09. Đường găng = hồ sơ ngày + lệnh nộp + 2 mã lệnh; màn của thầy làm song song, chưa xong thì Boss chuyển bản tin sáng cho thầy bằng tay.
CHIA LẠI để Code 3 (đang bận máy chủ BTVN nâng đỡ) không thành nút cổ chai:
- **Code 1 (đang rảnh) làm TRỌN phần ruột**: `src/lib/bo-nao-dac-trung.ts`, `src/lib/bo-nao-khuon.ts`, và TỆP MỚI `server/src/bo-nao.ts` (các hàm xử lý nhận `env`: dựng hồ sơ ngày THEO YÊU CẦU cho một trang em — chưa cần cron; nhận + kiểm + lưu điều chỉnh ở chế độ `bong`; đọc bản tin/nhật ký), `scripts/bo-nao/lay.mjs`, `scripts/bo-nao/nop.mjs`, migration chỉ-thêm `server/migration-2109-bo-nao.sql`, test. KHÔNG sửa `server/src/index.ts`.
- **Code 3**: chỉ NỐI — thêm route sau cổng `laThay` vào `index.ts`, chạy migration `--remote`, đẩy Worker; chỉ cho Code 1 cơ chế đọc mã bí mật AN TOÀN mà em đang dùng khi gọi thật (không in, không commit). Cron 03:30 + việc tầng nào đọc điều chỉnh (chế độ `that`) làm SAU BTVN nâng đỡ Đợt 1.
- **Code 4**: khối "Bộ não đêm qua" + nhật ký điều chỉnh + công tắc (vẽ mẫu 1 ảnh → build).
- **Boss**: tác vụ hẹn giờ 04:00 + chạy thử tay lượt đầu khi thầy còn ngồi máy (để thầy bấm cho phép 2 mã lệnh) + đo token từng đêm, ghi `bo-nao/so-tay/do-token.md`.

## CẬP NHẬT 2 (21/09) — THẦY CHỐT "BỘ NÃO TỰ HÀNH" (đề xuất mục 12; cẩm nang đã sửa)
- **Code 1**: KHUÔN thêm `khacPhuc[] {dang, kieu: khac_phuc|on_som, soCau 2–4, bac}` (≤ 2). Lõi BTVN nâng đỡ: cổng `dieuChinh` nhận thêm `khacPhuc` — rút câu cùng dạng CHƯA giao từ kho của chính bài, chèn vào chặng CHƯA mở kế tiếp, BỚT câu phần riêng dễ nhất để tổng tải không tăng. **DEADLINE THẮNG MỌI NÚM** — test tính chất bắt buộc: với MỌI `dieuChinh` hợp lệ (kể cả nhịp −3), số chặng ≤ số ngày còn lại, mọi câu lõi chưa làm nằm trong các chặng còn lại, hạn nộp không đổi; núm làm lõi không kịp ⇒ bị bỏ + trả lý do. `danhGiaDieuChinh` trả `xau_di` ⇒ `bo-nao.ts` TỰ GỠ điều chỉnh (ghi sổ). Ngưỡng áp dụng `doTinCay ≥ 0,6`.
- **Code 3**: chế độ `that` thành việc CẦN SỚM (ngay sau máy chủ BTVN nâng đỡ Đợt 1): kế hoạch ngày + BTVN nâng đỡ đọc điều chỉnh còn hạn; `on_som` = kéo `moc_on_ke` của các câu vừa sai thuộc dạng đó về ngày mai (chỉ SỚM hơn, không bao giờ muộn hơn); `/hs/ke-hoach-ngay` trả `loiNhanHlv`. Bảng tin thầy (`teacher-news`) nhận mục "Bộ não đêm qua".
- **Code 4**: đổi giọng khối "Bộ não đêm qua" sang ĐÃ LÀM ("Đêm qua đã hỗ trợ N em"), mỗi dòng có kết quả hôm sau khi đã có; nút chỉ còn "Xem" / "Bỏ điều chỉnh"; đưa bản tóm tắt vào BẢNG TIN giáo viên. Công tắc tắt giữ nguyên.
- **Code 2**: dòng lời nhắn HLV + khi chặng có câu `khac_phuc` thì nhãn nhẹ "luyện lại dạng em vừa vấp".
- **Boss**: 2 đêm bóng kiểm máy móc ⇒ đạt thì tự bật `that` cả trường đêm thứ 3.

## CẬP NHẬT 3 (21/09) — THẦY CHỐT: chăm TỪNG em MỖI ngày, lời nhắn cho học sinh VÀ phụ huynh phải rất tâm huyết; đổi tên hiển thị
- **TÊN HIỂN THỊ**: trên app học sinh và phụ huynh KHÔNG dùng chữ "bộ não"/"huấn luyện viên" trơn — dùng **"Bộ não A.I hỗ trợ riêng em <họ tên>"** (app ghép tên). Mọi chỗ "chạy bóng" trên giao diện ⇒ **"chạy thử"** (mã nội bộ `cheDo:'bong'` giữ nguyên cũng được).
- **Cẩm nang** đã thêm mục "NGHỀ VIẾT LỜI NHẮN" + KHUÔN thêm `loiNhanChoPhuHuynh` (≤ 280, chỉ khi đáng) và `thuTuan` (≤ 600, ở lượt soi kỹ hằng tuần); `loiNhanChoEm` ≤ 160, MỖI em có hoạt động đều có.
- **Code 1**: thẻ của em thêm `mocDangKhen[]` (lần đầu lên bậc ở một dạng, đúng lại câu từng sai, chuỗi 3/7/14 ngày, quay lại sau vắng, tự làm thêm — tính bằng thuật toán, có số) và `loiNhanGanDay[3]` (chống lặp). `kiemKhuon` cho HAI trường phụ huynh: cùng luật chữ số + từ cấm MỞ RỘNG (so sánh với bạn/con nhà khác, nhãn năng lực, dự đoán điểm, sức khoẻ/tâm lý, tiền bạc/quảng cáo, "chép bài/gian lận"); trần MỘT lời phụ huynh/em/ngày; ngày không có lý do trong danh sách "khi nào viết" mà vẫn có lời ⇒ loại lời đó (giữ phần núm).
- **Code 3**: `/ph/*` trả `boNaoAi {loiNhan, thuTuan, ngay}` cho đúng con của phụ huynh đó (qua cổng token phụ huynh sẵn có); lưu lịch sử lời nhắn; chế độ chạy thử ⇒ KHÔNG trả gì cho học sinh/phụ huynh.
- **Code 2**: app học sinh — thẻ "Bộ não A.I hỗ trợ riêng em <tên>" ở bảng nhiệm vụ (lời hôm nay; bấm xem 7 lời gần nhất); app phụ huynh — thẻ cùng tên, lời cho phụ huynh + thư tuần. Vẽ mẫu 2 ảnh (HS + PH) gửi Boss rồi build. Không có lời ⇒ không hiện thẻ.
- **Code 4**: nhãn "CHẠY THỬ"; màn thầy xem được NGUYÊN VĂN lời đã gửi cho em và phụ huynh trong nhật ký của từng em.
- **Boss**: 2 đêm chạy thử ĐỌC MẪU ≥ 30 lời học sinh + mọi lời phụ huynh trước khi bật thật; lời sáo/lệch giọng ⇒ sửa cẩm nang.
