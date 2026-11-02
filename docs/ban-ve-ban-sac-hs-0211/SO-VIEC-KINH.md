# Sổ việc — build giao diện «Kính» app học sinh (phiên Code giao diện, nhánh `claude/focused-ramanujan-fq23pk`)

Nguyên văn lời thầy (02/11):
> «chốt, build đi nhé tối ưu cho giao diện xoay ngang , máy tính và màn hình mở của zfold
> Build siêu nét vector làm theo mọi đề xuất của bạn, tất cả các chỗ, các lớp của app hs theo phong cách kính này. Cho cả giám thị mới ở code app 2 đang làm vào tất cả các câu mọi chỗ trong app đã có nhé. Trong màn làm bài thi của học sinh thiết kế lại theo kính luôn nhé, mọi chức năng thì giữ nguyên
> Build xong hết chụp ảnh app thật ở mọi lớp cho tôi xem. khi nào tối quyết đẩy lên mới đẩy.»
> «mọi hiệu ứng tải sẵn giống theo những gì phiên khác đã làm nhé, đảm bảo máy siêu yếu vẫn mượt hiệu ứng như vậy.»

- [!] 1. Build hệ «Kính» (bản vẽ v2 đã chốt) vào app học sinh — mọi màn, mọi lớp | bằng chứng: (chưa có)
- [x] 2. «Lộ trình» → màn «Hôm nay»: số lớn + bình tam giác + Việc hôm nay (đúng thứ tự/khoá cũ), đủ mức đổi hồng | bằng chứng:
- [x] 3. Thanh công cụ kính nổi 4 mục + nút A.I tròn riêng (thay menu mép phải; Thêm chứa điểm danh, ca kiểm tra, thông báo, cài đặt, của em) | bằng chứng:
- [ ] 4. Làm câu (chặng, sửa câu, tu luyện…) + kết chặng story theo kính | bằng chứng:
- [ ] 5. Luyện tập (bento), Thành tích, các màn thưởng, Thêm, A.I, đăng nhập theo kính | bằng chứng:
- [x] 6. Tối ưu xoay ngang, máy tính, Z Fold mở (haiCotLam) | bằng chứng: ảnh 844×390 · 904×690 · 1440×900
- [!] 7. Giám thị MỚI (Code app 2 đang vẽ lại 4 giám thị) có mặt ở TẤT CẢ các câu mọi chỗ trong app | bằng chứng:
- [ ] 8. Màn làm bài thi của học sinh (ExamTakeScreen) thiết kế lại theo kính — mọi chức năng + chữ cảnh báo giữ nguyên | bằng chứng:
- [ ] 9. Mọi hiệu ứng tải sẵn như các phiên khác đã làm (Mol nạp trước lúc rảnh, bộ hiệu ứng ăn mừng #743); máy siêu yếu vẫn mượt | bằng chứng: đo CPU ×6 / máy yếu
- [x] 10. Chụp ảnh APP THẬT mọi lớp cho thầy xem | bằng chứng:
- [x] 11. KHÔNG phát hành (không gộp main, không deploy) cho tới khi thầy quyết | bằng chứng: chỉ đẩy nhánh làm việc
- [!] 12. Cổng: tsc, vitest liên quan (+ toàn bộ trước khi xin phát hành), build, kiem:toc-do 0 đỏ, kiem:mau-giu 0, check:mau, kiem-sw | bằng chứng:
- [ ] 13. (phát sinh) Gộp main mới (#743 hiệu ứng ăn mừng, #744 dọn mã) vào nhánh trước khi build | bằng chứng:
- [!] 14. Thầy: «phải giống ý hệt bản vẽ nhé, làm tới lúc giống y hệt bản vẽ rồi chụp cho tôi» | bằng chứng: ảnh thật đặt cạnh bản vẽ
- [x] 15. Thầy: «phần btvn không còn nữa bỏ đi» — bỏ Bài tập về nhà khỏi app học sinh (Hôm nay, Luyện tập…) | bằng chứng:
- [x] 16. Thầy: «những gì ko hiển thị ở app hiện tại thì không được cho vào» + sửa lại: «cái đó thêm được mà, những chức năng ko có ở app hiện tại thì ko đc thêm vào giao diện» ⇒ hình / chữ chào (Chào An…) THÊM ĐƯỢC; CHỨC NĂNG chưa có thì KHÔNG thêm | bằng chứng:

## Bằng chứng (02/11, commit 50d53cc8 … ea2b695a — CHỈ commit tại máy, chưa đẩy)
- 2/3/6/10/16: 34 tấm `anh-that/NN-*.jpg` (bản vẽ · điện thoại sáng/tối · Fold gập/mở · ngang · máy tính), chụp 340 ảnh app thật: lỗi 0 · tràn 0.
- 15: `coBt = false` trong TrongHs.tsx — Bài tập về nhà không còn ở Hôm nay / Luyện tập.
- 11: không gộp main, không deploy (thầy chưa quyết).
- [!] 1/14: màn chính (Hôm nay, Thêm, Luyện tập, Thành tích, làm câu, kết chặng, màn thi) khớp bản vẽ; màn phụ (Tự sửa lỗi, Chữa câu sai, Tu luyện, các tấm thưởng) mới phủ kính, bố cục còn theo app cũ — chưa «y hệt».
- [!] 7: giám thị mới của Code app 2 chưa gộp main ⇒ mới XEM TRƯỚC (`anh-that/35-giam-thi-moi-xem-truoc.jpg`, worktree gộp thử, lỗi 0); chưa gắn vào tu luyện / chữa câu sai / KTCN.
- [!] 12: tsc sạch · kiem:mau-giu 0 · check:mau sạch · SW 13/13 precache 170 · byte tải mở ≤ bản trước. Vitest: ~45 test cấu trúc cũ (DOM «Lộ trình») đỏ — phải viết lại cho DOM mới trước khi phát hành.
- [x] 17. Thầy 02/11: «Chỉnh cái hiệu ứng soi đèn cho mượt mà tinh tế, hiện tại nhìn bị giả khi soi vào đáp án» | bằng chứng: accba6dd (trong-kiem-tra.css 5c+: tia nhạt tan dần, mép mềm, vũng sáng trên ô, nền tối cộng sáng); ảnh thi-chon sáng/tối
- [ ] 18. (phát sinh) Luật tốc độ: bấm phương án / vào chặng ở CPU ×4 phải bằng hoặc nhanh hơn bản cũ | đã sửa 3 nguyên nhân: bỏ làm mờ màn làm câu (24e16d69), nền đặc cho khung màn con ⇒ an-khi-bi-che ẩn lại Hôm nay (6f241859), tách luật đuôi :is (1b2f70cb); đang đo A/B
- [ ] 19. Thầy 02/11: «Không tải sẵn về máy hs à mà bấm chậm thế» — đã trả lời: có tải sẵn, độ trễ là vẽ lại trên máy, đang gỡ
- [x] 20. Thầy 02/11: «Giám thị mới chưa ghép vào à» + «Giám thị mới hiệu ứng tay cầm đèn pin mà» | bằng chứng: ghép nhánh Code app 2 `claude/gallant-hamilton-nyrg9v` (2ec42f73) vào nhánh này — merge 5df3d2aa (chỉ đụng nhật ký DIEU-PHOI, giữ cả hai); tsc 0; 6 tệp test giám thị/đèn 52/52 xanh; ảnh 10/12/21/24 chụp lại (giám thị cầm đèn, tia mịn)
- [x] 21. Thầy 02/11: «Nạp sẵn hết hiệu ứng và giao diện đảm bảo máy yếu cũng chạy đc mượt mà lung linh nhé» | bằng chứng: 5bd86eab (cong-hs-nap-luoi.ts nạp lần lượt lúc rảnh: giám thị · màn thưởng · Tu luyện · Câu đã làm); cổng-hs 240,2/240,1 KB bằng mốc; precache 170
- [ ] 22. Thầy 02/11: «sửa xong hết mới đẩy lên» ⇒ trước khi đẩy: (a) viết lại test cấu trúc cũ cho DOM mới, toàn bộ vitest không thêm đỏ so main; (b) màn phụ (Tự sửa lỗi, Chữa câu sai, Tu luyện, màn thưởng) giống bản vẽ; (c) giám thị mới của Code app 2 vào main cùng/ trước; (d) không có ca thi mở; rồi đẩy + phát hành
