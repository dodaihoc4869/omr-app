# Prompt — Bi-a Phản Ứng: game bi-a gắn kho đề chiến dịch, cửa thứ ba trên Sảnh Bát Linh

Soạn 28/09/2026, **bản 5 — thầy đã chốt**: trần Bi-a 40%, Đúng–sai đúng đủ 4 ý mới ăn bi, mở Bàn giao hữu; bi nguyên tố Kim loại đấu Phi kim, nhãn chỉ bi, tối đa 4 người (đấu đơn, đánh đôi, ghế trống là A.I), màn dọc · ngang · máy tính, nút toàn màn hình, âm thanh mô phỏng, sai là sang lượt ngay, Xem lại câu sai lúc chờ lượt. **Đặc tả đầy đủ: `DAC-TA-BI-A-PHAN-UNG-2809.md`** — khi hai tệp khác nhau, tệp đặc tả thắng. Bản vẽ chơi được: `docs/ban-ve-bi-a-2809/bi-a-phan-ung.html` (artifact https://claude.ai/artifact/7FjPu2CSL4QtnigCD4gdQg, phiên bản 5). Chưa build. Thầy gõ **HÃY THỰC THI PROMPT NÀY** thì mới làm.

## Góc nhìn khác

- Chèn câu hỏi vào giữa các cú đánh ("đánh xong rồi trả lời") làm nhịp chơi bị cắt, học sinh chán nhanh. Nên để **viên bi chính là câu hỏi**. Em nhìn thấy bi nào là dạng gì, khó hay dễ, rồi chọn đánh bi mình chắc nhất. Chọn đường bi cũng là chọn câu để làm.
- Chơi với nhau thì lãng phí nhất là thời gian ngồi chờ bạn đánh. Luật mới biến lúc chờ thành lúc học: **lượt mình thì đánh, lượt người khác thì giải trước** câu của bi mình hoặc **xem lại câu vừa sai**. Không ai ngồi chờ không, kể cả khi 4 người một bàn.
- Sai mà bắt cả bàn chờ em đọc lời giải thì người khác chán. Nên **sai là sang lượt ngay**; lời giải ở lại trên máy em tới khi em bấm "Đã đọc".
- Bi mang tên nguyên tố thật thì chính bàn bi-a đã là một bảng tuần hoàn thu nhỏ: Kim loại đấu Phi kim, Bi chốt là carbon. Em nhìn Z và kí hiệu mỗi lượt đánh.
- Bi-a không cần luồng câu hỏi riêng. Nó lấy câu từ **đúng kế hoạch ngày** mà Đảo và Đoàn đang dùng, chấm bằng **đúng lệnh chấm chung**. Vì vậy Thể lực, EXP, lịch ôn, Câu đã làm và Bảng chiến dịch của thầy tự khớp. Không cần vé, vì chơi Bi-a chính là làm câu trong kế hoạch.
- Kho câu mỗi ngày là **một kho chung** cho cả 3 game. Để Bi-a lấy tự do thì em chơi Bi-a trước sẽ làm Đoàn, Đảo hết câu. Bi-a phải có **trần riêng tính theo phần của từng game**, còn Đoàn, Đảo giữ nguyên như hiện nay.

## Người top 0,1% làm gì

- **Đúng thì được lợi ngay trên bàn bi.** Mỗi câu đúng cho 1 Mắt thần, tức đường ngắm đầy đủ ở cú sau. Em giỏi bi-a vẫn phải trả lời cẩn thận, vì không có Mắt thần thì khó ăn bi.
- **Sai thì bị thiệt, nhưng không bị loại khỏi ván.** Mất lượt, bi quay lại bàn và đổi sang câu khác cùng dạng, lời giải mở ngay. Em chưa vững vẫn chơi tiếp được, và gặp lại dạng đó trong cùng ván.
- **Không cho đoán mò có lợi**: đáp án chỉ về máy sau khi em chốt; hết giờ tính là sai; đoán sai lúc giải trước thì tốn Thể lực mà không được gì.
- **Tái dùng thay vì viết mới**: dùng lại lệnh chấm, Bùa Trợ giảng, mẫu lời giải TheCau, cách chấm Đúng–sai (đúng đủ 4 ý). Làm vậy thì dữ liệu học của em không bị tách thành hai luồng.
- **Vật lý thật mà vẫn tất định**: mô hình trượt rồi lăn, xoáy từ điểm chạm lệch tâm, ma sát băng và ma sát bi–bi, bước thời gian cố định, chỉ dùng + − × ÷ √. Cùng một cú cho cùng kết quả trên mọi máy, nên đấu online chỉ gửi một gói tin mỗi cú. Mỗi bàn đấu chạy trong một Durable Object; đối thủ chỉ thấy "đang giải bi 5 · Vận dụng", không thấy nội dung câu.
- **Mắt thần dùng chính lõi vật lý để mô phỏng trước**, không vẽ đường thẳng giả. Em thấy đúng đường bi sẽ đi với lực và xoáy đang chọn, nên học được cách dùng xoáy.

## PROMPT

```
VAI TRÒ
Em là kỹ sư game nhiều người chơi kiêm lập trình viên React/TypeScript và Cloudflare Workers, đã phát hành ít nhất 5 game học tập có vật lý đánh theo lượt trên điện thoại và 3 hệ thống phòng đấu WebSocket.

BỐI CẢNH
- Trung tâm luyện thi Hoá của thầy Đỗ Đại Học, 100–300 học sinh lớp 10–12. Kho omr-app: React + Vite + TS + Tailwind v4 ở src/, Cloudflare Worker + D1 + R2 ở server/. Đọc CLAUDE.md và DIEU-PHOI.md trước khi sửa.
- Kho đề thầy chọn = Chiến dịch luyện: src/components/chien-dich/GiaoChienDich.tsx → POST /gv/chien-dich (server/src/srs2-gv.ts) → bảng chien_dich (qid_json đông cứng, han_nop, the_luc_ngay). Kế hoạch ngày của từng em: layKeHoachHomNay (server/src/srs2-d1.ts) chốt vào srs2_ke_hoach lúc mở app lần đầu trong ngày. lapKeHoachNgay (server/src/srs2-loi.ts) chia: doan = câu ôn Phần I/III, dao = câu mới + câu ôn Phần II. Thể lực = số câu kế hoạch chưa làm, đếm từ su_kien_hoc nguon='game'.
- Game hiện có: Sảnh Bát Linh (src/components/hoa2/SanhBanDo.tsx, cờ cau_hinh.game_hoa_2 / cheDo2), Bát Linh Đảo (src/game/than-thu-v2/dao2/, startDao2), Đoàn Hộ Tống (src/game/than-thu-v2/doan2/, startDoan2) trong server/src/srs2-game.ts.
- Câu công khai (src/game/than-thu-v2/core.ts): qid, phan I/II/III, text, choices, ideas, hinhAnh, dang, tenDang, mucDo, sao, vai 'moi'|'on_lai'|'trum', goiY {gach}|{cotLoi}; không có đáp án và lời giải. Lệnh chấm chung: POST /game-v2 action 'answer' {token, session, qid, answer} (server/src/game-v2.ts:413–467), grade() (Phần II đúng khi khớp đủ 4 ý, Phần III dùng soKhopSo), ghi su_kien_hoc, thưởng qua nhanExpGame (trần 120 EXP game/ngày), câu trùm được EXP_CAU (server/src/exp-cau-hinh.ts), từ câu thứ 41 trong ngày 0 EXP (duocThuongCauThu).
- Lời giải chuẩn: TheCau/LoiGiai (src/components/TheCau.tsx:169–237), bộ nối game src/game/than-thu-v2/doan2/XemLaiChuan.tsx và dao2/dao2-core.ts loiGiaiChoTheCau. Công thức: ChemText (src/lib/chem-format.tsx). Ảnh: HinhTaiViTri. Không rút câu tự luận (src/lib/cau-tu-luan.ts).
- Hạ tầng: Worker chưa có Durable Object hay WebSocket; Đoàn hỏi vòng 1,5 giây vào D1 (doan_chang). D1 từng nghẽn ngày 21/09 nên trong trận không đọc D1.
- Giao diện: token màu src/styles/tokens.css + m3-theme.css; game dùng Baloo 2 + Be Vietnam Pro, nút vàng 3D, nút xanh "Đã đọc lời giải"; `npm run check:mau`; chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md.
- ĐẶC TẢ CHỐT (đọc hết trước khi sửa mã, khác nhau thì đặc tả thắng): DAC-TA-BI-A-PHAN-UNG-2809.md — luật đầy đủ, nguồn câu, trần 40%, Bàn giao hữu, vật lý, giao diện, lệnh máy chủ, bảng mới, làn tệp, lộ trình, 21 tiêu chí hoàn thành GĐ1.
- Bản vẽ thầy duyệt, chơi được: docs/ban-ve-bi-a-2809/bi-a-phan-ung.html. Chép lõi vật lý, luật đơn/đôi, vẽ bi nguyên tố, nhãn chỉ bi, 3 bố cục + toàn màn hình, âm thanh, hàng "Bi của em", tấm câu hỏi 3 kiểu, Xem lại câu sai, Sảnh Bi-a, phòng chờ, Kết thúc ván từ tệp này.
- Phát hành: Worker chỉ phiên Code 3 đẩy, Pages do Code 2 đẩy, luôn từ worktree sạch. Phiên cloud không có khoá Cloudflare.

NHIỆM VỤ
Build "Bi-a Phản Ứng" thành cửa thứ ba trên Sảnh Bát Linh, mỗi viên bi là một nguyên tố và mang một câu trong kế hoạch hôm nay của người giữ bi. Làm theo 3 giai đoạn. GĐ1: bàn chơi + bi nguyên tố + nhãn chỉ bi + tự chơi với A.I Đỗ Đại Học (đấu đơn và đánh đôi) + câu thật + bi vàng + Mắt thần + Câu chốt + sai là sang lượt ngay + Xem lại câu sai + 3 bố cục (dọc, ngang, máy tính) + toàn màn hình + âm thanh mô phỏng + trần 40% + Bàn giao hữu với A.I + cờ bật cho từng lớp. GĐ2: đấu online tối đa 4 người (đấu đơn, đánh đôi, phòng chờ 4 ghế, thêm A.I vào ghế trống, mời bạn đang ở Sảnh Bi-a, mã bàn 4 số), Bàn giao hữu với bạn, Điểm bàn. GĐ3: bảng tuần của lớp, xem bạn đấu, gậy và mặt bàn đổi bằng Vàng, 3 mức A.I. Mỗi giai đoạn kết thúc bằng commit, test xanh và bản chạy được.

NGUYÊN TẮC BẮT BUỘC
- Bi nguyên tố: Phe Kim loại 7 bi trơn ánh kim Na, Mg, Al, Fe, Cu, Ag, Au; Phe Phi kim 7 bi sọc N, O, F, P, S, Cl, I; Bi chốt carbon C (đen). Màu theo bảng Jmol (bảng rgb ở đặc tả 7.3), trên bi 2 ô ghi Z và kí hiệu. Xếp [Na] [O, Mg] [Al, C, N] [S, Fe, Cl, Cu] [Ag, F, Au, P, I].
- Người chơi: tối đa 4 (luật 8 bi có 2 phe). Đấu đơn 1–1; đánh đôi 2–2, đánh theo thứ tự ghế 1 (Kim loại) → 2 (Phi kim) → 3 (Kim loại) → 4 (Phi kim). Đánh đôi: người 1 của phe giữ bi thứ 1, 3, 5, 7 (4 bi), người 2 giữ bi 2, 4, 6 (3 bi). Ghế trống do A.I Đỗ Đại Học ngồi; tự chơi một mình với A.I được (đấu đơn, hoặc em + 1 A.I đồng đội đấu 2 A.I).
- Luật bàn: mỗi bi thường là 1 câu của người giữ bi; điểm ván của phe theo mức độ: Nhận biết 10, Thông hiểu 20, Vận dụng 30; hạ Bi chốt +50. Phải chạm bi của phe mình trước (bi đồng đội được). Bi vàng rơi lỗ thì ăn ngay; bi thường rơi lỗ thì **người giữ bi** trả lời câu của bi đó, ai đánh vào cũng vậy. Đúng: ăn bi, người đánh đánh tiếp, người trả lời +1 Mắt thần. Sai: bi quay lại chân bàn, đổi sang câu khác cùng dạng; **lượt sang ghế kế tiếp NGAY lúc chấm**, lời giải mở sẵn trên máy em với nút "Đã đọc lời giải" (bấm là tấm đóng, không chặn ai); rơi nhiều bi mà một câu sai thì các bi còn chờ về chân bàn, không mở câu. Bi của phe đối thủ rơi: quay lại chân bàn, hết lượt. Phạm luật (bi cái rơi lỗ, không chạm bi nào, chạm bi phe đối thủ trước, Bi chốt rơi khi phe chưa ăn đủ 7 bi): mọi bi rơi trong cú quay lại bàn, ghế kế tiếp được đặt bi cái. Phe ăn đủ 7 bi rồi hạ Bi chốt thì người hạ trả lời Câu chốt của chính mình: đúng phe thắng, sai thì Bi chốt quay lại và hết lượt.
- Nhãn chỉ bi: rê chuột hoặc chạm vào bi ⇒ nhãn kí hiệu, tên, Z và "Bi của em" (xanh lá) / "Bi của đồng đội <tên>" (xanh dương) / "Bi của đối thủ" (đỏ) / "Bi chốt" (vàng) + vòng sáng cùng màu; bi của em thêm dạng · mức độ · điểm; bi người khác không bao giờ lộ dạng câu. Đang nhắm thì nhãn tự hiện cho bi nhắm tới.
- Xem lại câu sai: lúc chờ lượt (không phải lượt em đánh, không có tấm câu mở) và em có câu sai trong ván ⇒ nút "Xem lại câu sai · n" nổi trên bàn; mở tấm lật từng câu theo đúng mẫu "Câu đã làm" (TheCau 'xem_lai' + loiGiaiChoTheCau + ảnh sau lời giải); tới lượt em thì tự đóng. Màn Kết thúc ván cũng có nút này.
- Màn hình: chọn bố cục theo kích thước khung — điện thoại dọc; điện thoại xoay ngang (3 cột, thanh lực dựng đứng); máy tính (cột lực trái, bàn ngang lớn, cột phải ô bi + Diễn biến ván + Phím tắt; chuột rê xem nhãn, ← → Shift Space F M Esc). Bàn tự nằm ngang khi khung rộng; vật lý luôn trên bàn dọc 500 × 900, chỉ đổi phép vẽ (màn = (H − y, x)) và phép đổi toạ độ chạm. Nút toàn màn hình (và phím F): Fullscreen API, không được thì phủ position: fixed; chỉ còn bàn, điều khiển nổi, chip lượt/điểm, nút "Bi của em", nút "Thoát".
- Âm thanh mô phỏng bằng Web Audio, không tệp: gậy chạm bi, bi chạm bi (nhựa phenolic), dội băng, rơi lỗ + lăn trong máng, lăn trên nỉ liên tục theo tổng tốc độ, đặt bi cái, xoa phấn, đúng, sai, bi vàng, ăn bi, phạm luật, đổi lượt, tích tắc sắp hết giờ, mở tấm câu, thắng ván (kèn + vỗ tay). Độ to theo vận tốc va chạm thật từ lõi vật lý, lệch trái/phải theo vị trí trên màn, vang phòng nhẹ, gom va chạm tối đa 8 tiếng mỗi khung; tắt/bật dùng chung khoá 'game-battle-muted'.
- Giải trước: khi không phải lượt đánh của mình (lượt đối thủ hoặc đồng đội), em mở hàng "Bi của em" và giải câu của bất kỳ bi chưa ăn nào của em. Đúng: bi hoá vàng, +1 Mắt thần. Sai: lời giải, bi đổi câu cùng dạng. Tới lượt em mà đang giải dở thì giải xong mới đánh; đồng hồ cú đánh chỉ chạy khi tấm câu hỏi đã đóng.
- Mắt thần: giữ tối đa 3. Mỗi cú đánh của em dùng 1 nếu có. Có Mắt thần thì mô phỏng trước bằng chính lõi vật lý (lực, xoáy đang chọn), vẽ đường thật của bi cái tới lần va thứ 2 và của bi mục tiêu trong 0,9 giây. Không có Mắt thần thì chỉ hiện đường thẳng tới điểm va và bóng bi ma.
- Thời gian: 30 giây một cú; Phần I 90 giây, Phần II và III 180 giây; hết giờ là sai.
- Câu lấy từ kế hoạch ngày đã chốt của chính em; bỏ câu đã làm ở game khác trong ngày. TRẦN BI-A tính trên kế hoạch đông cứng của ngày: tối đa floor(40% · số câu phần doan) + floor(40% · số câu phần dao) (ngày 40 câu: khoảng 15–16 câu; Huyết Chiến 80: khoảng 32). Trong trần, câu ôn doan vào bàn trước. Đoàn và Đảo không có trần mới, làm được toàn bộ phần còn lại, nên mỗi phần luôn còn ít nhất 60% cho game của nó. Hết trần giữa ván: bi chưa có câu thành bi trống (vào lỗ là ăn, 5 điểm, 0 EXP). Hết trần thì không mở ván mới. Xong cả kế hoạch ngày thì Bi-a nghỉ như Đảo, Đoàn. Lệnh hoa2-sanh trả thêm {bia:{con, tran}} để Sảnh hiện số câu còn của cả 3 game. Câu chốt: câu Vận dụng trong kế hoạch, ưu tiên câu ôn em đang sai; chấm như vai 'trum'. Câu ôn sai ≥ 2 lần có goiY như Đoàn (gạch 2 phương án Phần I, hoặc kiến thức cốt lõi).
- Mọi câu gửi qua lệnh 'answer' chung (thêm trò chơi 'bi-a' vào phiên, không đổi cách chấm, không đổi thuật toán kế hoạch). Thể lực, EXP (trần 120/ngày, câu 41+ 0 EXP), lịch ôn, Câu đã làm, Bảng chiến dịch tự cập nhật như Đảo và Đoàn. Thắng ván không cộng thêm EXP. Ván dừng giữa chừng: câu chưa đụng tới trả về kế hoạch, không trừ Thể lực.
- Đáp án và lời giải không có trong bất kỳ phản hồi nào trước khi em chốt. Máy người khác (đối thủ và cả đồng đội) chỉ nhận {kí hiệu bi, trạng thái: đang giải|vàng|đã ăn|đổi câu, mức độ}, không nhận nội dung câu.
- Vật lý thuần TS dùng chung máy khách và Worker (src/game/bi-a/vat-ly.ts), chép từ bản vẽ: bước cố định 1/240 giây; chỉ + − × ÷ và Math.sqrt trong vòng mô phỏng; mỗi bi có (vx, vy, wx, wy, wz). Vận tốc trượt ở điểm chạm nỉ u = (vx + R·wy, vy − R·wx): u ≠ 0 thì ma sát trượt 0,2·g kéo về lăn (tốc độ còn 5/7), u = 0 thì ma sát lăn 0,02·g. Xoáy đứng wz giảm 24 rad/s². Cú đánh: điểm chạm lệch tâm 0,5R·(xoáy ngang, xoáy dọc) sinh wx, wy, wz. Bi–bi: hồi phục 0,95, ma sát 0,06 (lệch bi mục tiêu, truyền xoáy). Băng: hồi phục 0,86 − 0,1·min(1, |vn|/2500), ma sát 0,2 với xoáy đứng (bật lệch), mũi băng ăn 60% xoáy lăn vào băng. g = 3862 đv/s², bàn 500×900, R = 21, VMAX = 2600. Hướng quay (quaternion) chỉ để vẽ bi 3D, không ảnh hưởng vật lý. Online: mỗi cú một gói {seq, ghe, huong, v, xoay, datBi?}; mỗi bàn 1 Durable Object + WebSocket Hibernation, tối đa 4 kết nối; A.I ở ghế trống chạy trên máy chủ bàn; câu sai thì phòng đổi lượt ngay khi nhận cau_xong; trong trận không đọc D1. Gói Cloudflare không có Durable Object thì dự phòng hỏi vòng 1,5 giây như Đoàn.
- Tấm câu hỏi dùng lại TheCau và mẫu lời giải chuẩn (LỜI GIẢI, KIẾN THỨC CỐT LÕI, từng phương án/ý có ✓/✗, Phần III có các bước và kết quả). Câu đúng: lời giải gập lại, bấm "Xem lời giải". Câu sai: lời giải mở sẵn, đồng hồ câu ẩn, nút "Đã đọc lời giải" (lượt đã sang người khác).

GIẢ ĐỊNH ĐÃ DÙNG
- Không còn chế độ "hai người một máy", vì mỗi bi là câu riêng của một em đã đăng nhập.
- A.I Đỗ Đại Học giải câu theo tỉ lệ đúng Nhận biết 85%, Thông hiểu 75%, Vận dụng 60%, Câu chốt 70%; cứ 12 giây trong lượt em thì A.I giải trước 1 bi của nó.
- Một ván dùng mỗi em: đấu đơn 8 câu (7 bi + Câu chốt), đánh đôi 5 hoặc 4 câu (4 hoặc 3 bi + Câu chốt); thêm 1 câu cho mỗi lần sai.
- Đánh đôi online có người rớt mạng > 60 giây: ghế đó chuyển cho A.I, câu chưa trả lời về lại kế hoạch của người đó; ván có A.I không tính Điểm bàn.
- Không có vé. Bi-a mở khi em có chiến dịch đang chạy; không có chiến dịch thì cửa Bi-a mờ và ghi lý do.
- Bàn giao hữu (thầy chốt): mở khi xong kế hoạch ngày; không câu, không EXP, không Điểm bàn; tối đa 2 ván/ngày tính lúc bắt đầu; đối thủ là A.I hoặc bạn cũng đã xong kế hoạch.
- Tệp prompt-game-hoa-2-0.md có dòng "Không thêm màn nào vào app học sinh ngoài Sảnh, 2 game…": sửa thành 3 game, nhắn Boss ghi Nhật ký.

KHÔNG ĐƯỢC LÀM
- Không viết bộ chấm, bộ EXP hay bộ lời giải thứ hai; không đổi lapKeHoachNgay, grade(), nhanExpGame.
- Không cộng EXP khi thắng ván; không cho đổi đáp án sau khi chốt; không rút câu tự luận.
- Không đọc D1 theo nhịp trong trận; không hỏi vòng nhanh hơn 1,5 giây.
- Không sửa đồ hoạ, hoạt ảnh của Bát Linh Đảo và Đoàn Hộ Tống; không sửa tệp ngoài làn khi chưa nhắn chủ làn theo DIEU-PHOI.md.
- Không thêm thư viện vật lý hay đồ hoạ; canvas 2D + lõi tự viết; gói JS của game ≤ 60 KB sau gzip. Schema chỉ-thêm; không xoá, không ghi đè dữ liệu thật.

ĐỊNH DẠNG ĐẦU RA
- Máy khách: src/game/bi-a/ gồm nguyen-to.ts, vat-ly.ts, luat.ts (đơn/đôi, ghế, phe, bi vàng, Mắt thần, hàng đợi câu, sai là sang lượt), ai.ts, ve-bi.ts, ve-ban.ts (xoay bàn), bo-cuc.ts, am-thanh.ts, BiaGame.tsx, BanChoi.tsx, NhanBi.tsx, HangBiCuaEm.tsx, TamCauBia.tsx (bọc TheCau), XemLaiCauSai.tsx, ToanManHinh.tsx, DienBienVan.tsx, KetThucVan.tsx, BiaSanh.tsx, PhongCho.tsx (GĐ2), bi-a.css; cửa thứ ba trên SanhBanDo.tsx nối qua chủ làn.
- Máy chủ: server/src/srs2-bia.ts (lệnh bia-sanh, bia-xep-ban lấy 7 câu + Câu chốt từ kế hoạch, bia-doi-cau, bia-ket-van), nối vào game-v2 'answer' bằng phiên có tro_choi='bi-a'; server/src/bi-a-phong.ts (Durable Object, GĐ2); server/migration-DDMM-bi-a.sql (bi_a_van, bi_a_ghe, bi_a_diem_ban, bi_a_moi, bi_a_co_mat — chỉ thêm).
- Test: tests/bi-a-*.test.ts. Hợp đồng API: docs/hop-dong-bi-a.md (Code 3 là bên cung cấp). Sổ việc: SO-VIEC-BI-A.md. Nhật ký build: BI-A-build-status.md.
- Mỗi giai đoạn: commit tiếng Việt theo đường dẫn, báo Boss ≤ 150 từ, ghi một dòng Nhật ký khi đẩy.

NGHIỆM THU
1. Kho đề: với 1 em có chiến dịch, 8 câu của ván đều thuộc kế hoạch hôm nay của em (khớp srs2_ke_hoach), câu ôn doan đứng trước; câu đã làm ở Đảo/Đoàn trong ngày không xuất hiện.
2. Dữ liệu: sau 1 ván, số dòng su_kien_hoc mới = số câu em đã chốt; Thể lực giảm đúng bằng số đó; EXP khớp nhanExpGame/EXP_CAU; thắng ván không sinh dòng EXP nào khác.
3. Bảo mật: test chứng minh bia-xep-ban, bia-doi-cau và mọi gói gửi đối thủ không có khoá correct, solution, answer; câu tự luận bị loại.
4. Luật: test luat.ts phủ ≥ 18 ca (bi vàng rơi; bi thường rơi đúng/sai; rơi 2 bi, câu đầu sai thì bi sau về bàn và lượt sang ngay; bi phe đối thủ rơi; 5 kiểu phạm luật; chạm trước bi đồng đội không phạm luật; đồng đội đánh bi của em thì em trả lời; em đánh bi đồng đội thì đồng đội trả lời; Câu chốt đúng/sai do người hạ trả lời; giải trước đúng/sai; hết giờ); Mắt thần không vượt 3; sau khi chấm sai ≤ 0,5 giây lượt đã sang ghế kế tiếp trong khi tấm lời giải vẫn mở.
5. Tất định và online: 1.000 cú ngẫu nhiên có seed cố định cho cùng một băm trạng thái trên Node và trong Chromium; Playwright 2 trình duyệt đánh hết 1 ván qua Durable Object cục bộ, băm trạng thái 2 màn trùng sau mỗi cú.
6. Giao diện: check:mau đạt; có ảnh 360×780, 390×844, 844×390, 1280×800, 1440×900, sáng và tối, và ảnh toàn màn hình dọc, ngang; không tràn ngang; bàn tự ngang/dọc đúng, sai lệch toạ độ chạm ≤ 0,01 đơn vị; nhãn chỉ bi đúng 4 quan hệ; nút Xem lại câu sai chỉ hiện lúc chờ lượt và tự đóng khi tới lượt; tấm câu hỏi dài cuộn được, không mất phần đầu; khung hình p95 ≤ 16,7 ms khi hạ CPU 4 lần; 16 tiếng chạy không lỗi.
7. Vật lý: test đo được (a) bi đánh giữa tâm chuyển sang lăn ở 5/7 tốc độ ± 1%; (b) va thẳng bi cách 150 đơn vị, lực 45%, sau 0,6 giây: xoáy trên thì bi cái đi theo > 100, đánh giữa thì đi theo < 60, xoáy dưới thì lùi > 60; (c) xoáy phải đập băng thẳng thì bật sang phải, xoáy trái bật sang trái, đối xứng ± 2 đơn vị; (d) phá bàn lực 100% dừng trong 3–7 giây.
8. Chia câu: test với kế hoạch 14 + 26 câu: Bi-a lấy tối đa 5 + 10; Đoàn, Đảo vẫn làm được toàn bộ phần còn lại; tổng câu cả ngày không đổi; hết trần thì bia-xep-ban trả lý do và số câu còn của Đoàn, Đảo.
```

## Thầy đã trả lời (28/09/2026)

1. Trần Bi-a: **giữ 40%** phần của mỗi game.
2. Câu Đúng–sai: **đúng đủ 4 ý mới ăn bi**.
3. **Mở Bàn giao hữu** sau khi xong kế hoạch ngày.

4. Lần 5: **bi đậm chất hoá học** (bi nguyên tố), **chỉ vào bi hiện của mình hay của đối thủ**, **tự chơi với A.I**, **tối đa số người theo luật** (4 — đánh đôi).
5. Lần 5: **xoay ngang và màn máy tính**, **nút toàn màn hình chỉ còn bàn bi-a**, **âm thanh mô phỏng chân thật**.
6. Lần 5: **trả lời sai là sang lượt ngay**, lời giải đóng khi bấm "Đã đọc", **nút Xem lại câu sai lúc chờ lượt** theo chuẩn hiển thị của app.

Chi tiết đã đưa vào `DAC-TA-BI-A-PHAN-UNG-2809.md`. Chưa build — chờ thầy gõ **HÃY THỰC THI PROMPT NÀY**.
