# Kiểm toán toàn bộ EXP — 23/09/2026

> **Bản chẩn đoán lịch sử, đã có sửa tiếp theo.** Các lỗi chính bên dưới đã được xử lý và test đã đổi thành kiểm tra hồi quy. Giá cấp 10 hiện là 2.400 EXP/ít nhất 12 ngày; khiên đầu tiên 21 ngày, ví dự trữ 400 EXP. Xem [kết quả tích hợp mới nhất](bao-cao-hoan-thien-3-app-2309.md); số dòng và các nhận xét “đang diễn ra/chưa chạy” dưới đây mô tả thời điểm kiểm ban đầu.

Phạm vi: đọc mã nguồn workspace `omr-app`, HEAD tại lúc kiểm `ab7b745` kèm các sửa chưa commit đang diễn ra. Không truy cập dữ liệu thật, không đổi công thức sản phẩm, không phát hành. Đây là ảnh chụp hành vi mã nguồn; trạng thái cấu hình `exp_moi`, mùa và bản đang chạy chưa được xác minh. Code 1 đang đổi grading/Mom; Code 2 đang đổi game; agent khác đang đổi FSRS. Các điểm dưới đây phải được đối chiếu lại sau khi họ hoàn tất.

## Kết luận có bằng chứng

Có **7 hiện tượng lỗi đã tái hiện**, gồm hai trường hợp tranh chấp khác nhau. Một test thêm xác minh bảng giá/trần mềm. File `tests/audit-exp-2309.test.ts` chạy **8/8 đạt**, 421 ms tại lần đầu. Đây là test chẩn đoán khẳng định hành vi lỗi đang tồn tại, **không phải 8 lỗi đã được sửa**. Các phép ghi đều vào SQLite bộ nhớ với schema/migration của repo; riêng kiểm trần quay về ngày cũ gọi hàm thuần thật. Phần Mom chỉ mock xác thực học sinh S1; đường tạo của phụ huynh dùng SBD thật của fixture qua hàm hiện hành.

| Mức | Phát hiện | Bằng chứng và ảnh hưởng | Hướng xử lý đề nghị |
|---|---|---|---|
| P1 | Đáp án Mom đi về học sinh trước nộp | `server/src/mom.ts:94` trả nguyên `dsCau` từ R2 có `dapAn`; test `Mom student start` nhận A ngay khi bắt đầu. `review` ở dòng 131 cũng không đòi đã nộp. Có thể sao đáp án để nhận điểm/EXP và làm sai hồ sơ năng lực. | Tách public/private question; start chỉ đề; review chỉ sau nộp và đủ điều kiện công bố. |
| P1 | Mom tin mã câu và khóa do client gửi | `server/src/mom.ts:70`, `:125`: create lưu nguyên câu; submit chấm theo khóa này rồi ghi sự kiện học. `ph-truy-cap.ts:65` còn nhận SBD trần. Test tạo câu `INVENTED-I-1` không tồn tại trong kho vẫn được xác nhận đúng và ví tăng **22 = 2 câu + 10 câu đầu ngày + 10 hoàn thành**. | Server nhận ID, tự đọc phiên bản/khóa từ kho và kiểm phạm vi. Nếu hỗ trợ bài tùy soạn, tách khỏi bằng chứng học/EXP tới khi được xác thực. Không chỉ vá định dạng khóa. |
| P1 | Retry cùng khoản game tiêu trần hai lần | `server/src/exp-d1.ts:637`: kiểm khóa → giữ chỗ CAS → INSERT riêng. Hai lời gọi đồng thời cùng khóa, xin10: chỉ một dòng sổ/ví+10 nhưng `expGame.da=20`. Test `same game reward concurrent retry`. | Giao dịch gắn reservation với chính khóa khoản; chỉ tiêu trần khi claim thành công, hoặc reservation có hoàn trả/reconcile. |
| P1 | Retry cùng lượt tiếp sức cũng tiêu trần hai lần | `server/src/exp-d1.ts:575`: cả hai giữ5 trước tranh INSERT ô ngày; ví+5 nhưng bộ đếm+10. Test `concurrent identical support`. | Dùng cùng cơ chế atomic theo source ID như trên; giữ cả trần số lượt và trần EXP nhất quán. |
| P1 có điều kiện | Khoản ngày cũ làm mất trần đã dùng của ngày mới | `server/src/game-v2-hap-thu.ts:50`: counter chỉ lưu một `{ngay,da}`, ngày khác thì reset. Test đã120 ngày23 → thưởng3 ngày22 → có thể nhận thêm120 ngày23. Chặng dùng `ketLuc` làm ngày (`game-v2-doan-exp.ts:18`), nên cần kiểm trường hợp hậu xử lý qua nửa đêm. | Ledger/budget theo `(sbd,ngay)`; không để khoản cũ ghi đè counter ngày mới. Test tái hiện helper, chưa tái hiện route qua nửa đêm. |
| P2 | Chuỗi dài bị cắt còn 7 ngày khi tính thưởng | `server/src/exp-d1.ts:169`, `server/src/ho-so-cau-hinh.ts:58`: đọc tối đa7 ngày; `ke-hoach-ngay-d1.ts:173` cũng dùng cửa sổ này. Với10 ngày đạt trước đó, `docChuoiTruoc=7`, thưởng ngày hiện tại **16 thay vì20** của luật `2×min(chuỗi,10)`. Ngày nghỉ trong cửa sổ còn có thể giảm thêm. | Tách cửa sổ điều chỉnh khối lượng học khỏi bộ đếm chuỗi, đọc tới lần đứt chuỗi hoặc lưu aggregate tin cậy. |
| P2 | “EXP hôm nay” thiếu thưởng nấc game | `server/src/exp-d1.ts:783` chỉ SUM `exp_so`; nấc10/20/30 ghi `game_v2_reward` và ví trực tiếp ở `game-v2.ts:316`. Test có reward10/ví10 nhưng `docExpHomNay.homNay=0`. | Nếu nhãn nói tổng EXP hôm nay, gộp đúng ledger mastery/academic; hoặc ghi mọi earnings vào một sổ. Không cộng lại vào ví. |

Không có P0 được chứng minh trong lượt kiểm này. P1 ưu tiên trước phát hành vì ảnh hưởng tính trung thực kết quả và quyền lợi EXP.

## Ba con số phải phân biệt

1. **EXP kiếm được / ví (`wallet`, “ống nghiệm”)**: thu nhập học tập và game chưa sử dụng. `earned` là tổng đã kiếm, không phải số dư.
2. **EXP thần thú (`cap`, `exp`)**: `exp` chỉ phần dở dang trong cấp hiện tại. Nút hấp thụ chuyển từ wallet sang cấp, không tạo EXP mới.
3. **Vàng, XP đội hình, mảnh khiên, vé, ấn thạch**: các tài sản riêng; XP đội hình võ đài không phải EXP thú.

Luồng mới: bài làm → server chấm → `su_kien_hoc` → `tinhExp` → `exp_so` → `congTongSoVaoHoSo` cộng `SUM(sổ)-expMoi.daCong` vào wallet bằng CAS. Nấc game là ngoại lệ: attempt, reward và profile được batch riêng, không đi qua `exp_so`. Khóa EXP trong DB có tiền tố SBD. Đổi lại tiền thưởng đã ghi không được tự tính lại khi sửa khóa đáp án.

## Bảng giá câu đúng

Nguồn đủ điều kiện: thi, BTVN, lô/chặng BTVN, khắc phục, Mom, ôn lại, luyện đề, thử thách riêng. **Không bao gồm game và lên bảng** (`exp-hoc-tap.ts:13`). Phần II phải đúng trọn câu, không phát EXP lẻ theo số ý.

| Phần | 0 sao | 1 sao | 2 sao |
|---|---:|---:|---:|
| I | 2 | 3 | 5 |
| II | 3 | 5 | 8 |
| III | 4 | 6 | 10 |

Theo `exp-cau-hinh.ts:5`: metadata thiếu → suy phần từ hậu tố qid, mặc định I; sao lạ/thiếu →0. Mỗi **qid** trả tối đa1 lần/ngày VN, liên nguồn; không khử trùng nội dung khác qid tại tầng EXP. Đủ giá cho **2×mục tiêu câu/ngày**, sau đó `max(1,ceil(giá×0.25))`. Với mục tiêu8 và17 câu I0 khác nhau đúng: 16×2 +1 =33 EXP câu, cộng10 đầu ngày thành43; chưa tính việc hoàn thành/chuỗi. EXP mềm không phải trần cứng tổng thu nhập.

## Bản đồ toàn bộ kênh

Bảng dùng luật mới kể từ22/09 nếu `exp_moi` bật cho học sinh. Nguồn/khóa ghi dưới đây bỏ tiền tố SBD cho dễ đọc.

| Kênh / trigger | Công thức và điều kiện | Khóa, nơi ghi, màn phản hồi |
|---|---|---|
| Thi thường, thi bù, nộp trễ hợp lệ, làm lại ca | Câu đúng theo bảng + `3×round(clamp(điểm,0,10))`; 7.4→21, 7.5→24. Chỉ ca đã công bố. Không có hệ số EXP riêng cho nộp thi trễ trong bộ tính. | `cau|qid|ngày`; `diem|ca|lần-thử`. Grading `su-kien-hoc.ts:338`; `exp-d1.ts:118`. Sổ EXP/ống nghiệm/kế hoạch. Mỗi lần thử nhận lại khoản điểm theo khóa khác, không chỉ chênh cải thiện như luật cũ. |
| Ca công bố muộn | Câu đúng được tìm tính lại ngày nộp trong cửa sổ14 ngày; điểm ca là khoản việc phát ở ngày tính hiện tại, giữ `luc` nộp. | `exp-d1.ts:365`; ghi chú “vừa công bố”. Ngoài14 ngày có nguy cơ thiếu khoản câu dù khoản điểm vẫn được phát. |
| BTVN thường trọn bài / làm lại | Câu đúng theo bảng; nộp cả bài đúng hạn +30 một lần/bài. Quá hạn: không30 nhưng vẫn nhận câu đúng; làm lại không thêm bonus hoàn thành. | `btvn|mã-bài`; `goi-cu.ts:930`; `exp-d1.ts:461`. Kết quả `expNhan`/`manhNhan`. |
| BTVN chặng/lô thường và cá nhân hóa | Câu đúng theo bảng; chặng hoàn thành đúng nhịp +20, trễ nhịp +8. Hạn mềm lấy kế hoạch, fallback hạn cả bài; quá hạn cả bài không đúng nhịp. | `lo|bài|chỉ-số`; `lan % LAN_MOI_LUOT` gộp mọi lượt làm lại, không trả lại chặng. `lo_da_xong` phải vượt chỉ số; `btvn-nang-do-d1.ts:776`, `:809`; `exp-d1.ts:435`. |
| BTVN thử sức thêm | Sự kiện vẫn `btvn_lo`, câu đúng theo bảng; không có bonus riêng mang tên thử sức. Bonus lô chỉ khi điều kiện `lo_da_xong` cho phép. | `btvn-nang-do-d1.ts:906`, `:914`; cùng cơ chế idempotent và trần mềm. |
| Khắc phục theo phiếu | Câu đúng theo bảng; các mốc chuyển trạng thái có thể nhận +6 lên bậc / +30 khắc phục xong. | `khac_phuc`; `goi-cu.ts:1096`; `bac|qid|ngày`, `kp|qid|số-lần-sai`. |
| Ôn lại cá nhân | Câu đúng theo bảng, có thể +6/+30. Kết quả đầu của qid trong ngày là kết quả lưu; nộp lại không đổi sai→đúng cùng receipt. | `on_lai:<ngày>` +qid+lan1; `on-lai-nop.ts:147`, `:177`. Chấm và ghi thành công mới gửi đáp án. |
| Thử thách riêng trên nhiệm vụ | Như ôn lại: câu đúng theo bảng, không bonus riêng ngoài các sự kiện chung. Chỉ tập qid đã chốt cho học sinh/ngày. | `thu_thach_rieng`; `thu-thach-rieng.ts:357` gọi đường chung `chamVaGhiTraLoi`. |
| Luyện đề | Câu đúng trọn theo kết quả từng câu, cùng bảng; không có bonus “điểm ca” vì không phải nguồn `thi`. | `luyen`; `luyen-de.ts:91`; receipt phiên luyện; gọi `expNhanSauNop` khi UPDATE submit thắng. |
| Mom / bài hằng ngày `daily_` / PH giao thêm | Câu đúng theo bảng +10 hoàn thành khi bài đã nộp và có ít nhất1 câu trả lời trong sổ (không bắt buộc đúng). | `mom|id`; `mom.ts:125`; `exp-d1.ts:465`. PH giao thêm tạo Mom ở `ph-giao-them.ts:322`, không có một khoản thưởng PH khác. |
| Lên bảng | Đạt+15; chưa đạt+5; kết quả null không thưởng; không nhận EXP câu thường. | `lb|khóa-sự-kiện`; giáo viên ghi `len_bang` ở `index.ts:2572`. |
| Câu đầu ngày | +10 khi có câu đúng đầu tiên trong mọi nguồn, gồm game; không tính trần game120. | `dau_ngay|ngày`; `exp-hoc-tap.ts:142`. Game có trợ giúp không ghi sự kiện nên không tạo khoản này. |
| Quay lại học | +30 khi ≥3 ngày VN trống giữa hai ngày có sự kiện; tối đa1 lần/14 ngày. Chưa từng học không có. Không yêu cầu trả lời đúng. | `tro_lai|ngày`; `exp-hoc-tap.ts:144`. |
| Đạt nhiệm vụ ngày | +80; cần đủ số qid theo mức tối thiểu, không trễ việc bắt buộc, đủ `ceil(tối-thiểu/2)` qid đúng; nếu có câu tới hạn phải có ít nhất1 câu “lên bậc”. | `dat|ngày`; `dat-nhiem-vu-ngay.ts:172`; chỉ xét có kế hoạch, không phải ngày nghỉ. Cron chốt qua các lô40 em và con trỏ. |
| Chuỗi ngày đạt | `2×min(max(1,chuỗi),10)` tức2…20; trao cùng đạt ngày. | `chuoi|ngày`; `exp-hoc-tap.ts:183`. Lỗi cửa sổ7 ngày ở bảng phát hiện. |
| Lên bậc ôn | +6/qid/ngày nếu hôm nay đúng, trước ngày này đã từng sai/trống. | `bac|qid|ngày`; `exp-chuyen-trang-thai.ts:22`. Đây là “từng sai rồi đúng”, không kiểm lịch đến hạn ngay tại tầng thưởng. |
| Khắc phục xong | +30 khi từ chưa khắc phục chuyển `da_khac_phuc`; tái sai rồi đạt lại có thể thêm khoản. | `kp|qid|lanSai`; phát lại sổ để so trạng thái trước/sau. Agent FSRS đang đổi nền hồ sơ, cần kiểm lại tiêu chí chuyển trạng thái sau tích hợp. |
| Đảo, repair/tower, câu Đoàn thường, arena/Linh Tâm qua game answer | Nấc dạng1:+10; nấc2:+20; nấc3:+30. Tự làm đúng, không trợ giúp. Nấc2 cần nhóm mới, `novel`, qua hạn≥1 ngày. Nấc3 nhóm mới, tới hạn và≥7 ngày từ nấc1. Sai không hạ nấc; đặt lại due+1 ngày. Nấc3 không phát lại. | `sbd|masteryKey|milestone` ở `game_v2_reward`; attempt `session|qid`; wallet cộng trong batch CAS. `core.ts:123`; `game-v2.ts:316`. Mọi khoản nằm trong trần game120. |
| Câu thử thách / lượt trùm của Đảo | Nếu ref lưu vai `thu_thach`/`trum`, đúng tự làm thì thêm giá phần×sao, một lần/qid trong sổ; không qua trần mềm câu học, có trần game120. | `thuthach|qid` ở `exp_so`; `game-v2.ts:331`. Có thể đồng thời nhận nấc dạng và bonus thử thách: hai khoản được thiết kế khác nhau. |
| Đoàn thắng chặng | 1/2/3 sao:5/10/15 chặng thắng đầu ngày; lần sau `ceil(giá/2)`=3/5/8. Thua0. Trao từng người thật, không dựa riêng số câu đúng cá nhân. | `doan_chang|mã-chặng`; `game-v2-doan-exp.ts:16`; qua trần120. Màn kết chặng đọc ledger thật. |
| Đoàn vỡ giáp trùm | +3 mỗi trùm vỡ giáp cho từng người thật, cả khi cuối chặng thua; thông thường hai hiệp trùm4/8. | `doan_giap|mã-chặng`; cùng cửa120; không phải mỗi ý đúng thưởng3. |
| Đoàn tiếp sức | +5 khi gửi thẻ hợp lệ, tối đa5 lần/ngày; không chờ bạn dùng thẻ rồi trả lời đúng. Bot không nhận EXP. | `tiepsuc|ngày|n`, source `chặng|hiệp|người-nhận`; `game-v2-doan.ts:519`; qua cửa120. |
| Tháp hoàn thành | ≥70% câu tự làm đúng thì tower+1 tối đa999. **Không bonus EXP hoàn thành tháp ở v2**; reward amount0. | `game-v2.ts:345`; EXP câu đến từ nấc dạng/bonus vai nếu có. |
| Võ đài/Linh Tâm | Câu Hóa có thể nhận nấc dạng như trên. Đúng tự làm hai nhóm đầu cho +2 vàng/nhóm phục vụ ván. Mua XP đội hình:4 vàng→4 XP, lên level đội khi XP≥level×3, tối đa6. | `game-v2.ts:318`; `game-v2-room.ts:40`; `core.ts:306`. `vo-dai.ts:261` cũ chỉ lưu đội hình/kết quả, không có EXP thú riêng. |
| Hấp thụ thú | `min(xin, trần-còn, wallet, sức-chứa-tới-cấp120)`. Đạt ngày:200; chưa đạt nhưng≥4 câu khác nhau có kết quả:120; còn lại0. | `hap-thu-ngay.ts:103`; game `invest` đọc điều kiện server, CAS profile. Sai4 câu vẫn được120 nếu ví có sẵn, theo luật hiện hành. |
| Cửa hàng đổi vàng | 1 EXP ví→1 vàng, ví phải còn≥200; mỗi request có khóa riêng; batch CAS+ledger chống ghi vàng không trừ ví. | `game-v2-shop.ts:135`; `vang_so`. Mua phụ kiện trừ vàng, không cộng EXP/chỉ số. |
| Khiên, vé, ấn thạch, trang bị | Đạt ngày+1 mảnh,36 mảnh→1 khiên; thưởng mảnh chuỗi/dạng hiện0. Vé mở thêm lượt, không là EXP; phụ kiện không buff EXP. | `exp-cau-hinh.ts:59`; `exp-ho-so-game.ts:51`; `game-v2-doan-mua.ts`, shop. |
| Chuyển luật cấp / mùa | Khi chuyển luật2: tổng EXP cũ trừ chênh nấc[0,10,30,40], cộng60×ngày đạt cũ, rồi phân vào cấp theo ngày học và ví. Snapshot `truocSiet`, cờ `luatCap` chống lặp. Mùa mới khởi tạo profile cap1/ví0 theo season. | `hap-thu-ngay.ts:176`; `game-v2-hap-thu.ts:96`; `game-v2.ts:35`; đây là migration/reset quản trị, không phải khoản học mới. |

## Luật cũ còn trong repo

`exp_moi` tắt hoặc trước mốc chuyển tiếp: `game-v2-academic.ts` tính legacy academic: +2/câu đúng, thi tối đa25 qid/ca (50 EXP) và +1 cho mỗi mốc điểm đã vượt (tối đa10), BTVN/phiếu/Mom local tối đa20 câu trong mỗi bản được xử lý, khóa `practice:qid` dùng chung. Tổng bị kẹp100/ngày VN. `academic.seen`, `sources`, `days` nằm trong profile cùng CAS; điểm cải thiện chỉ nhận mốc chưa trả. Ôn lại khi cờ tắt cũng dùng+2 và `practice:qid`. Sync trình duyệt chỉ gửi câu trả lời Mom local, server chấm lại trong known scope; sau mốc bật luật mới khoản mới bị lọc khỏi legacy.

Component cũ `src/components/ThanThuHoaHocGame.tsx` còn công thức20/45/90, hệ số yếu1.5, combo1.15/1.3/1.5, giảm0.2 sau25 câu; thi60×điểm, BTVN200, Mom150+25×điểm, sửa sai100, tháp~25+0.9×tầng. **Không trình bày đó là luật đang áp dụng cho portal**: `StudentPortalScreen.tsx:74` import game v2. Endpoint legacy `thanThuGhi` vẫn tồn tại, chặn khi đã có game_v2_profile (`goi-cu.ts:3533`); trường hợp chưa có profile còn tin số liệu cũ client rồi import. Cần đánh giá riêng nếu còn học sinh chưa nâng cấp/không có season; chưa chứng minh đường khai thác qua gateway trong lượt này.

Cấp10 cần tổng4.200 EXP đã hấp thụ, sớm nhất21 ngày đạt đầy đủ; cấp120 cần240.000, sớm nhất1.200 ngày đạt. Đây là **giới hạn sớm nhất**, không cam kết mỗi em chắc chắn kiếm đủ200/ngày. `kinh-nghiem.ts:74`, `hap-thu-ngay.ts:17`.

## Rủi ro/khác biệt cần test thêm — chưa gọi là lỗi đã tái hiện

- **P1, hậu xử lý không tự bù trên replay**: game answer commit attempt/profile trước `ghiSuKien` và bonus thử thách; replay return ở `game-v2.ts:307`, bỏ qua phần sau. Nếu worker dừng/DB lỗi giữa hai bước, retry không bù bonus. `ghiSuKien` nuốt lỗi; `su-kien-nap-lai.ts:61` có backfill quản trị game nhưng không phải replay bonus tự động. Đoàn tương tự: thưởng gọi sau batch tại `game-v2-doan.ts:130`. Cần outbox/receipt trạng thái thưởng và test inject crash từng điểm.
- **P2, popup báo nhận trùng**: `capNhatCoTu` trả `cacKhoan` đã dự tính, không đối chiếu INSERT thực sự thắng (`exp-d1.ts:510`). Hai request có thể đều báo+N dù DB chỉ ghi một. Số dư có CAS bảo vệ, chưa test response đồng thời.
- **P2, công bố ca rất muộn**: ngoài14 ngày không bổ sung ngày câu vào tập tính lại; thưởng điểm không bị giới hạn tương tự. Chưa test fixture ca>14 ngày.
- **P2, thời điểm ghi thưởng việc**: lo/Mom/BTVN/điểm đều đưa vào ngày chính hiện tại, kể cả `luc` cũ; bảng giá dùng ngày hiện tại. Hoàn thành21/09 nhưng lần xử lý đầu22/09 có thể nhận giá mới và hiện nhầm ngày. Cần tách ngày làm/ngày công bố/ngày credit có chủ ý.
- **P2, metadata giá câu**: `docMetaCau` lấy MIN phần/sao giữa mọi version của qid, cache30 phút; không chọn version được giao. Khóa sổ chỉ-thêm nên số đã phát lúc cache cũ **không tự sửa** khi cache hết. Comment hiện tại nói “tự sửa” là quá mạnh. Chưa dựng fixture thay sao nhiều version.
- **P2, lịch ôn với thưởng lên bậc chưa cùng ý nghĩa**: lên bậc+6 xét “từng sai bất kỳ ngày trước”, không yêu cầu tới lịch FSRS hay thực sự tăng trạng thái. Có thể nhận+6 hằng ngày cùng qid sau một lần sai cũ nếu có nguồn cho làm lại. Đây có thể là chủ ý kinh tế, cần đặc tả rõ.
- **P2, tác động học sinh yếu và cuối tiến trình**: nấc dạng thưởng hết sau3 nấc; khi đã sửa hầu hết dạng, chơi3 lượt không đảm bảo đủ EXP200. Đoàn thắng cấp thưởng cho cả người thật, kể cả người không đóng góp; tiếp sức thưởng khi gửi, chưa xét hiệu quả. Không tự đổi các chính sách này trong audit.
- **Tự khai trợ giúp**: server nhận `assisted` từ client; có chặn thưởng khi true, không chứng minh false là tự làm. Phải mô tả đúng là tự khai, không thể xác minh toàn bộ hành vi học từ request.
- **Thời gian/độ khó**: công thức EXP câu dùng sao/phần, không trực tiếp nhân tốc độ/giây hay khả năng cá nhân. Hạn quá ngắn có thể làm giảm thành tích; sửa deadline của Code2 ảnh hưởng số đúng, không đổi công thức giá.

## Những bảo vệ đang có và giới hạn

- Ledger học tập idempotent theo khóa; câu đúng cùng qid liên nguồn chỉ thưởng1 lần/ngày. BTVN lô làm lại modulo tránh nhân bonus; bảng giá theo ngày có mốc rõ22/09.
- Game chấm server theo ref phiên bản, xác thực session/SBD, chặn câu ca thi bảo vệ. Profile cập nhật revision CAS. Hấp thụ và shop không tăng ví từ dữ liệu EXP client.
- Chưa công bố thi được lọc khỏi EXP câu; Mom là ngoại lệ nghiêm trọng ở trên. Không suy rộng rằng mọi endpoint đã được kiểm bảo mật đầy đủ.
- Sổ được cộng vào ví bằng chênh tổng nên đọc lại thông thường không cộng đôi; trần game cần giao dịch riêng với ledger mới đạt cùng mức chắc chắn.
- Mốc ngày dùng UTC+7 ở cả `ngayVn` và `academicDay`; các mốc due mastery theo24h, không phải ngày lịch. Trần game/absorption là ngày lịch VN. Cửa sổ và chuyển ngày cần test phân biệt.
- Giá câu cache30 phút, kế hoạch có invalidation `emCoGhi`; sự kiện ghi thường vô hiệu hóa cache. Không đo latency production và không khẳng định server nhanh nhất.
- Chỉ chạy test audit mục tiêu. Chưa chạy full suite/build (Code3 giữ kiểm tích hợp). Không chạy browser, D1 thật, không dùng secret. Không sửa grading, EXP, FSRS, selection hay dữ liệu người học trong lượt này.

## Thứ tự nghiệm thu đề nghị

1. Chặn Mom lộ khóa và lấy qid/đáp án từ server; test không nhận fake qid/khóa và không đọc solution trước công bố.
2. Atomic khóa khoản+budget theo ngày; test request trùng, khác khoản đồng thời, lỗi giữa bước, qua00:00, khoản bù ngày cũ.
3. Outbox/bù thưởng cho mọi đường submit/game/Đoàn; replay không thưởng đôi, không mất khoản.
4. Chuỗi học tính đủ lịch sử, dashboard đối soát mọi thu/chi về cùng ledger; thử10,30 ngày và ngày nghỉ.
5. Sau tích hợp FSRS và selector, chạy mô phỏng học sinh mới/yếu/khá/mạnh, pool ít, ngày hoàn thành sớm/trễ để đánh giá độ công bằng. Không đổi điểm/EXP đã ghi thật nếu chưa có đặc tả sửa số dư riêng.
