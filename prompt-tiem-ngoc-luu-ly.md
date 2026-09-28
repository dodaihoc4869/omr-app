# Prompt — Tiệm Ngọc Lưu Ly: game sưu tầm – chế tác ngọc gắn kế hoạch ngày, cửa thứ tư trên Sảnh Bát Linh

Soạn 28/09/2026, **bản 1 — chờ thầy duyệt**. Chưa build. **Bản vẽ chơi được (GĐ0) đã có**: `docs/ban-ve-tiem-ngoc-2809/tiem-ngoc.html` (artifact https://claude.ai/artifact/4hKiByn6NVspXEsKQ9bgBF, phiên bản 1). Thầy duyệt bản vẽ rồi gõ **HÃY THỰC THI PROMPT NÀY** thì mới làm GĐ1.

## Góc nhìn khác

- Nam mê Bi-a vì thắng thua và vì đánh khéo. Nữ 15–18 tuổi bị hút bởi ba thứ khác: sưu tầm cho đủ bộ, tự tay làm ra một món đẹp mang dấu ấn của mình, và được bạn nhìn thấy món đó. Khảo sát động cơ chơi game của Quantic Foundry cũng ra như vậy: người chơi nữ đặt Hoàn tất bộ sưu tập, Thiết kế và Tưởng tượng lên đầu, còn Cạnh tranh và Phá huỷ xuống cuối. Vì thế game mới không có đối thủ và không có thua, chỉ có làm ra, sưu tầm và trưng bày.
- Câu hỏi không chen vào giữa game mà chính là món đồ trong game: **mỗi viên đá thô là một câu**. Giải đúng thì đá nứt ra một viên ngọc thật (có công thức và ion gây màu). Chọn viên đá nào cũng là chọn câu nào để làm.
- Món quý nhất chỉ có được khi **làm đúng câu mình từng sai**. Đó là Ngọc Chỉ Vàng, lấy ý từ kintsugi của Nhật: chỗ vỡ được hàn bằng vàng nên đẹp hơn lúc chưa vỡ. Như vậy game đưa em về đúng điểm yếu, và em lại muốn quay về đó.
- Không nên gắn nhãn "game con gái". Mở cho mọi em, vì sẽ có bạn nữ mê Bi-a và có bạn nam mê làm vòng. Thiết kế theo động cơ chơi chứ không theo màu hồng.
- Đo "nghiện" bằng số bạn nữ làm xong kế hoạch ngày, không đo bằng thời gian ngồi chơi. Game không thêm câu nào; nó chỉ làm cho số câu sẵn có trở nên đáng làm.

## Người top 0,1% làm gì

- **Bất ngờ mà không may rủi** (giữ đúng luật thầy đã chốt ở Cửa hàng: không có gì may rủi). Dạng câu quyết định ra loại ngọc nào, mức độ quyết định cỡ. Lần đầu em giải đúng một dạng mới thì một ô "???" trong Sổ Ngọc mở ra. Em có cảm giác khám phá mà không phải quay số.
- **Ba giây sau câu đúng phải thật đã mắt.** Đá rung, nứt ra ánh sáng, ngọc xoay nổi lên, kèm tiếng chuông pha lê và rung máy. Chạm là bỏ qua được, và không bao giờ chặn câu kế tiếp. Câu sai thì đá rã thành cát nhẹ nhàng, lời giải mở sẵn, không có tiếng còi phạt.
- **Vẽ ngọc bằng mã, không dùng ảnh.** Ngọc là hình SVG có giác cắt và ánh lấp lánh, nên nét trên mọi màn hình. 21 loại × 4 ô là 84 ô Sổ Ngọc mà gói game vẫn dưới 60 KB.
- **Không xếp hạng độ nổi tiếng.** Tim bạn thả chỉ chủ tiệm thấy. Tên tiệm và tên món ghép từ danh sách có sẵn, không gõ tự do. Vậy là không cần kiểm duyệt và không có chỗ cho trêu chọc, tẩy chay, chuyện rất hay gặp ở nữ sinh tuổi này.
- **Mỗi viên ngọc là một bài Hoá thật.** Hồng ngọc và lam ngọc đều là Al₂O₃, chỉ khác ion lẫn vào (Cr³⁺ hay Fe²⁺/Ti⁴⁺). Ngọc lam, malachite, azurite đều xanh nhờ Cu²⁺. Em nhớ Hoá qua cái em thấy đẹp.

## PROMPT

```
VAI TRÒ
Em là nhà thiết kế game sưu tầm – chế tác cho nữ tuổi teen kiêm lập trình viên React/TypeScript và Cloudflare Workers, đã phát hành ít nhất 5 game collect-and-craft trên điện thoại và 3 game học tập gắn ngân hàng câu hỏi có chấm ở máy chủ.

BỐI CẢNH
- Trung tâm luyện thi Hoá của thầy Đỗ Đại Học, 100–300 học sinh lớp 10–12, chơi chủ yếu trên điện thoại màn 360–430 px. Kho omr-app: React + Vite + TS + Tailwind v4 ở src/, Cloudflare Worker + D1 + R2 ở server/. Đọc CLAUDE.md, DIEU-PHOI.md, docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md trước khi sửa.
- Nguồn câu: kế hoạch ngày layKeHoachHomNay (server/src/srs2-d1.ts:326) chốt vào bảng srs2_ke_hoach từ chien_dich.qid_json; kế hoạch gộp lịch ôn câu sai và câu sai của ca thi đã công bố. lapKeHoachNgay (server/src/srs2-loi.ts) chia phần doan (câu ôn Phần I/III) và phần dao (câu mới + câu ôn Phần II). napCau (server/src/srs2-game.ts:53) bỏ câu đang dùng cho ca thi, câu tự luận, câu đã rút khỏi kho. cauDangGiu (srs2-game.ts:80) chặn phát trùng một câu cho hai game.
- Sảnh Bát Linh (src/components/hoa2/SanhBanDo.tsx; cửa Bi-a là NutBia; dữ liệu cửa đi kèm phản hồi lệnh hoa2-sanh) đang có 3 game: Bát Linh Đảo (6 ải một chuyến, ải 6 là Trùm), Đoàn Hộ Tống (8 hiệp), Bi-a Phản Ứng (src/game/bi-a/, server/src/bi-a.ts; phiên {mode:'bia', hoa2:1, bia:1}; trần Bi-a = floor(40% phần doan) + floor(40% phần dao) của kế hoạch đã chốt). Chỗ mở game: src/screens/StudentPortalScreen.tsx (TabType, nạp lười các game, SanhBanDo nhận onPhaPhucKich/onKhamPhaDao/onChoiBia).
- Mọi lệnh game đi qua một route POST /game-v2/<lệnh> (server/src/index.ts → gameV2Tho, server/src/game-v2.ts), máy khách gọi qua goiHoa2 (src/components/hoa2/api.ts). Token HMAC ở game-v2-auth.ts.
- Câu công khai (src/game/than-thu-v2/core.ts, publicQuestion): qid, phan (I|II|III), text, choices, ideas, table, hinhAnh, dang, tenDang, mucDo (biet|hieu|van_dung), sao, kienThuc, cộng vai (moi|on_lai|trum) và goiY do srs2-game.ts gắn. Không có correct, solution.
- Lệnh chấm chung: POST /game-v2/answer {token, session, qid, answer} (server/src/game-v2.ts:416–469): grade() ở core.ts (Phần II đúng khi khớp đủ 4 ý, Phần III so số), biên nhận phiên|qid chống nộp đôi, ghi su_kien_hoc và game_v2_attempt, EXP qua nhanExpGame (trần 120 EXP game/ngày), câu thứ 41 trở đi trong ngày 0 EXP. Chỉ sau khi chấm mới trả answer, solution, solutionImages.
- Tấm câu và lời giải dùng lại: TheCau (src/components/TheCau.tsx, chế độ 'thi' và 'xem_lai'), QuestionMedia (HinhTaiViTri, BangSoLieu), ChemText (src/lib/chem-format.tsx), mẫu bọc game src/game/bi-a/TamCauBia.tsx, src/game/than-thu-v2/doan2/XemLaiChuan.tsx. Câu tự luận bị cấm rút ở mọi kênh (laCauTuLuan, src/lib/cau-tu-luan.ts).
- Kinh tế đang có: Vàng (bảng vang_so) chỉ sinh từ việc học, không tặng, không chuyển, không có gì may rủi (DE-XUAT-SHOP-PHU-KIEN-2109.md). Cửa hàng phụ kiện thần thú: src/lib/phu-kien-danh-muc.ts, ThuMacDo, phu-kien-neo.ts. Ảnh thần thú: public/than-thu-v2/nho/thu-{0..7}-{0..5}.webp, hàm anhThu (src/game/than-thu-v2/dao/anh.ts).
- Cờ trong bảng cau_hinh: game_hoa_2, doan_ho_tong, bi_a, shop_phu_kien. Migration nằm ở server/*.sql, chỉ-thêm.
- Giao diện: token màu src/styles/tokens.css + m3-theme.css, cấm hex thô trong src/ (npm run check:mau); font game Baloo 2 + Be Vietnam Pro; âm thanh game tắt/bật chung khoá 'game-battle-muted'.
- Phát hành: Worker chỉ phiên Code 3 đẩy, Pages do Code 2 đẩy, luôn từ worktree sạch (DIEU-PHOI.md). Tệp ngoài làn thì nhắn chủ làn.

NHIỆM VỤ
Build "Tiệm Ngọc Lưu Ly" thành cửa thứ tư trên Sảnh Bát Linh: mỗi viên đá thô là một câu trong kế hoạch hôm nay của em; giải đúng thì đá mở ra một viên ngọc có thật (công thức, ion gây màu); ngọc dùng để chế tác trang sức trưng bày trong tiệm của em. Làm theo 4 giai đoạn, mỗi giai đoạn kết thúc bằng commit, test xanh và bản chạy được:
- GĐ0: bản vẽ chơi được một tệp HTML để thầy duyệt. XONG GĐ0 THÌ DỪNG, chờ thầy duyệt mới sang GĐ1.
- GĐ1 (phát hành trước 18/10/2026 để kịp 20/10): khay đá + mẻ 6 đá từ kế hoạch ngày, mở đá, đá nứt và hàn chỉ vàng, Đá Mẹ và Ngọc Tâm, Hộp ngọc, Bàn chế tác 4 khuôn, Tủ trưng bày, Sổ Ngọc 21 loại, Thẻ ảnh (có khung "20/10"), thần thú của em ngồi trên quầy, 3 bố cục, âm thanh, trần chung với Bi-a, cờ bật theo lớp.
- GĐ2 (trước 18/11/2026): Phố Ngọc của lớp (ghé tiệm bạn, thả tim, tặng 1 ngọc/ngày), Khách đặt hàng, Sửa tiệm, khuôn Vương miện, Vương miện lớp tặng thầy dịp 20/11.
- GĐ3: trang sức em làm đeo được cho thần thú ở Đảo (chỗ đeo mới "Trên cổ", qua chủ làn Cửa hàng phụ kiện), mùa sưu tầm theo dịp (Tết, 8/3) chỉ thêm khuôn và khung, không thêm loại ngọc ngoài bảng.

NGUYÊN TẮC BẮT BUỘC
- ĐÁ THÔ = CÂU. Một mẻ 6 viên: 5 đá thường + 1 Đá Mẹ ở cuối, lấy từ kế hoạch ngày đã chốt của chính em bằng napCau, phần doan trước rồi phần dao, giữ thứ tự kế hoạch, trong trần còn. Mặt đá cho biết trước: phần (dáng giác: Phần I tròn, Phần II vuông 4 góc, Phần III giọt nước), cỡ theo mức độ (Nhận biết Nhỏ, Thông hiểu Vừa, Vận dụng Lớn), tên dạng; câu vai 'on_lai' hiện là "Đá nứt · câu em từng sai" có vệt vàng. Đá Mẹ = câu vai 'trum' hoặc câu Vận dụng kế tiếp trong trần; không còn thì mẻ chỉ có đá thường. Em chọn thứ tự mở tuỳ ý. Thời gian câu: Phần I 90 giây, Phần II và III 180 giây; hết giờ là sai. Câu ôn sai ≥ 2 lần có goiY như Đoàn.
- MỞ ĐÁ XÁC ĐỊNH, KHÔNG MAY RỦI. Đúng ⇒ loại ngọc = bảng dạng→loại (ngoc-theo-dang.ts), cỡ = mức độ, vai 'on_lai' ⇒ bản Chỉ Vàng, Đá Mẹ ⇒ Ngọc Tâm (cỡ Lớn có dấu Tâm). Cùng (dang, mucDo, vai, laDaMe) luôn ra cùng một kết quả. Máy chủ cấp ngọc sau khi đã chấm; máy khách không tự cộng. Sai ⇒ đá rã thành cát, không ngọc, lời giải mở sẵn với nút "Đã đọc lời giải", câu vào lịch ôn như mọi game (ngày sau quay lại thành Đá nứt). Phần II: grade giữ nguyên (đủ 4 ý mới đúng); lúc hiện kết quả, mỗi ý đúng sáng một góc giác để em thấy mình đúng mấy ý.
- KHOẢNH KHẮC VÀ ÂM THANH. Mở đá ≤ 2,8 giây: rung 3 nhịp → vết nứt sáng màu ngọc → tách đôi → ngọc xoay nổi lên, hạt lấp lánh → bay vào Hộp ngọc; chạm là bỏ qua; không bao giờ chặn câu kế. Hàn chỉ vàng 1,5 giây: vàng lỏng chạy theo vết nứt (SVG stroke-dashoffset). Sai: đá rã cát 1 giây, tiếng trầm nhẹ, không còi phạt. Thần thú của em (anhThu) ngồi trên quầy, nhảy lên khi ngọc hiện. Âm thanh Web Audio tự sinh, không tệp: chuông pha lê (FM), nứt đá (nhiễu lọc), lấp lánh, rót vàng, đặt ngọc vào khuôn, hoàn thành món, nhạc nền hộp nhạc ngũ cung lặp; tắt/bật chung khoá 'game-battle-muted'. navigator.vibrate khi nứt và khi ngọc hiện. prefers-reduced-motion ⇒ mọi hoạt ảnh ≤ 0,6 giây.
- NGỌC VẼ BẰNG MÃ. SVG giác cắt: tròn (8 cánh sao), vuông princess, giọt nước; mỗi mặt giác một sắc độ lấy từ màu gốc của loại; một vệt sáng quét chậm và 2–4 điểm lóe; Kim cương, Opal thêm ánh cầu vồng; Chỉ Vàng thêm đường vàng theo vết nứt. Không dùng ảnh cho ngọc. Màu ngọc khai báo thành token (qua npm run check:mau). Nền tiệm nhung tối tím than, bảng kính pastel, viền vàng. Ba bố cục: điện thoại dọc (chính, từ 360 px), điện thoại ngang, máy tính.
- HOÁ HỌC ĐÚNG TỪNG KÍ TỰ. 21 loại, 7 họ, chép đúng bảng sau (tên · công thức · vì sao có màu · độ cứng Mohs). Ô Sổ Ngọc mỗi loại: Nhỏ, Vừa, Lớn, Chỉ Vàng (84 ô); ô chưa có hiện "???" và "Mở khi em giải đúng một câu dạng <tenDang>". Chỉ ghi "Việt Nam có mỏ ở Lục Yên" cho Hồng ngọc, Lam ngọc, Spinel (Hồng ngọc thêm "và Quỳ Châu"); loại khác không ghi nơi.
  Họ Al: Hồng ngọc · Al2O3 · Cr³⁺ thay chỗ Al³⁺ → đỏ · 9 | Lam ngọc · Al2O3 · Fe²⁺ và Ti⁴⁺ → lam · 9 | Spinel đỏ · MgAl2O4 · Cr³⁺ → đỏ · 8
  Họ Si: Thạch anh tím · SiO2 · Fe³⁺ + chiếu xạ tự nhiên → tím · 7 | Thạch anh vàng · SiO2 · Fe³⁺ → vàng · 7 | Opal · SiO2·nH2O · hạt silica xếp đều nhiễu xạ ánh sáng → ánh cầu vồng · 5,5–6,5
  Họ Cu: Ngọc lam · CuAl6(PO4)4(OH)8·4H2O · Cu²⁺ → xanh lam · 5–6 | Malachite · Cu2CO3(OH)2 · Cu²⁺ → lục · 3,5–4 | Azurite · Cu3(CO3)2(OH)2 · Cu²⁺ → lam thẫm · 3,5–4
  Họ Silicate màu: Lục bảo ngọc · Be3Al2Si6O18 · Cr³⁺ hoặc V³⁺ → lục · 7,5–8 | Peridot · (Mg,Fe)2SiO4 · Fe²⁺ → lục vàng · 6,5–7 | Hồng lựu · Fe3Al2(SiO4)3 · Fe²⁺ → đỏ thẫm · 7–7,5
  Họ Ca: Ngọc trai · CaCO3 (aragonite) + conchiolin · lớp xà cừ mỏng xếp chồng → ánh ngũ sắc · 2,5–4,5 | San hô đỏ · CaCO3 · sắc tố carotenoid → đỏ · 3–4 | Huỳnh thạch · CaF2 · khuyết tật mạng tinh thể và tạp chất → tím, lục · 4
  Họ C: Kim cương · C · không màu, tán sắc mạnh → lóe cầu vồng · 10 | Hổ phách · nhựa cây hoá thạch (hợp chất hữu cơ cao phân tử) · vàng mật ong · 2–2,5 | Ngọc huyền · than non (gỗ hoá than) · đen bóng · 2,5–4
  Họ Tinh thể tự nuôi: Phèn chua · KAl(SO4)2·12H2O · không màu · 2–2,5 | Đồng(II) sulfate ngậm nước · CuSO4·5H2O · Cu²⁺ ngậm nước → lam, nung mất nước thành trắng · 2,5 | Thạch cao tuyết hoa · CaSO4·2H2O · không màu, trong như kính · 2
- CHẾ TÁC, TRƯNG BÀY, XÃ HỘI. GĐ1 có 4 khuôn: Nhẫn (1 ngọc), Khuyên tai (2 ngọc cùng loại), Vòng tay (5 ngọc bất kỳ), Vòng cổ (1 Ngọc Tâm + 4 ngọc); GĐ2 thêm Vương miện (1 Chỉ Vàng + 2 Ngọc Tâm + 6 ngọc). Kéo thả ngọc vào ô, xem trước trên tượng nhung; ngọc đã dùng trừ khỏi Hộp ngọc, Sổ Ngọc giữ vĩnh viễn. Tên tiệm, tên món ghép 2 từ chọn từ danh sách có sẵn, không gõ tự do. Tủ trưng bày tối đa 3 món. Thẻ ảnh PNG 1080×1350 (món, tên món, công thức các ngọc, tên tiệm; không tên thật, lớp, điểm). GĐ2: Phố Ngọc chỉ gồm bạn cùng lớp; tim mỗi em thả tối đa 5/ngày, chỉ chủ tiệm thấy số tim, không có bảng xếp hạng tim hay lượt ghé; tặng tối đa 1 ngọc thường/ngày (không tặng Chỉ Vàng, Ngọc Tâm), ngọc được tặng dùng chế tác được nhưng không tính vào Sổ Ngọc. Khách đặt hàng: 3 đơn/ngày, sinh từ loại ngọc kế hoạch hôm nay của em ra được; xong đơn +1 Sao tiệm; Sửa tiệm 9 bước, mỗi bước chọn 1 trong 3 kiểu, trả bằng Sao tiệm. Vương miện lớp: mỗi câu đúng ở Tiệm Ngọc của cả lớp gắn một viên; đủ thì hiện ở app thầy (nhắn chủ làn giáo viên).
- TRẦN VÀ DỮ LIỆU HỌC. Tiệm Ngọc và Bi-a dùng CHUNG một trần = floor(40% phần doan) + floor(40% phần dao) của kế hoạch đã chốt; đếm câu đã giao ở cả phiên bia lẫn ngoc; Đoàn, Đảo không đổi (luôn còn ≥ 60% mỗi phần). Màn ghi "Hôm nay còn 11/15 câu cho Bi-a và Tiệm Ngọc". Hết trần hoặc xong kế hoạch: không mở mẻ mới; Bàn chế tác, Tủ, Sổ Ngọc vẫn vào được. Mọi câu nộp qua lệnh answer chung (phiên {mode:'ngoc', hoa2:1, ngoc:1}); Thể lực, EXP, lịch ôn, Câu đã làm, Bảng chiến dịch tự khớp. Không cộng EXP hay Vàng cho ngọc, món, đơn hàng. Thêm phiên ngoc vào cauDangGiu (srs2-game.ts dòng ~119 và ~142, bi-a.ts dòng ~144) và loại khỏi lệnh resume (game-v2.ts dòng ~406). Mẻ dừng giữa chừng: câu chưa mở về lại kế hoạch, không trừ Thể lực. Đáp án và lời giải không có trong bất kỳ phản hồi nào trước khi em chốt.

GIẢ ĐỊNH ĐÃ DÙNG
- Tên game "Tiệm Ngọc Lưu Ly", cửa thứ tư trên Sảnh; mở cho MỌI học sinh, không lọc giới tính (D1 không có trường giới tính và không cần có).
- Trần: dùng chung 40% với Bi-a như trên, không thêm trần mới.
- Mẻ 6 đá; trong trần, em chơi bao nhiêu mẻ cũng được. Không có chế độ không câu (khác Bàn giao hữu của Bi-a): ngọc chỉ sinh từ câu đúng.
- Bảng dạng→loại: mã dạng có tiền tố chương thì họ theo nhóm chương, loại trong họ theo băm FNV-1a của dang; không có thì băm FNV-1a của dang vào 21 loại. Bảng xuất ra tệp để Boss sửa tay. Kho có ít dạng thì vài loại chưa mở cho tới khi thầy giao chiến dịch có dạng mới.
- Chỉ Vàng = câu vai 'on_lai' làm đúng. Cố ý làm sai để "để dành" không có lợi: mất EXP hôm đó, thêm câu ôn, mỗi loại chỉ tính 1 ô Chỉ Vàng.
- Cờ cau_hinh.tiem_ngoc bật theo lớp. Không có chiến dịch đang chạy thì cửa mờ và ghi lý do (như Bi-a).
- Tệp prompt-game-hoa-2-0.md có dòng giới hạn số game trên Sảnh: sửa thành 4 game, nhắn Boss ghi Nhật ký.

KHÔNG ĐƯỢC LÀM
- Không may rủi dưới mọi hình thức: không hộp mù, không quay số, không tỉ lệ rơi; không tiền thật; không bảng xếp hạng tim, lượt ghé hay số món.
- Không viết bộ chấm, bộ EXP, bộ lời giải thứ hai; không đổi lapKeHoachNgay, grade(), nhanExpGame; không rút câu tự luận.
- Không có ô chữ gõ tự do mà người khác đọc được (tên tiệm, tên món, lời nhắn); không ghi "dành cho nữ" hay "game con gái" ở bất kỳ đâu.
- Không sửa đồ hoạ Đảo, Đoàn, Bi-a; không sửa SanhBanDo.tsx, StudentPortalScreen.tsx, bi-a.ts, srs2-game.ts, game-v2.ts khi chưa nhắn chủ làn theo DIEU-PHOI.md.
- Không thêm thư viện đồ hoạ hay hoạt ảnh; JS của game ≤ 60 KB sau gzip (nạp lười); ảnh nền Sửa tiệm tổng ≤ 600 KB webp; schema chỉ-thêm, không xoá hay ghi đè dữ liệu thật.

ĐỊNH DẠNG ĐẦU RA
- GĐ0: docs/ban-ve-tiem-ngoc-2809/tiem-ngoc.html — một tệp chạy không cần mạng, 6 câu mẫu tự soạn đủ 3 phần (không dùng kho thật): Sảnh tiệm, khay đá, tấm câu, mở đá, hàn chỉ vàng, đá rã cát, Bàn chế tác 4 khuôn, Sổ Ngọc 21 loại, Tủ trưng bày, Thẻ ảnh, 3 bố cục, âm thanh.
- Máy khách: src/game/tiem-ngoc/ gồm ngoc-du-lieu.ts (bảng 21 loại), ngoc-theo-dang.ts, ve-ngoc.ts, am-thanh.ts, api.ts, TiemNgoc.tsx, KhayDaTho.tsx, MoDa.tsx, TamCauNgoc.tsx (bọc TheCau như TamCauBia), BanCheTac.tsx, SoNgoc.tsx, TuTrungBay.tsx, the-anh.ts, tiem-ngoc.css; GĐ2 thêm PhoNgoc.tsx, GheTiem.tsx, DonHang.tsx, SuaTiem.tsx. Cửa thứ tư trên SanhBanDo.tsx và tab 'ngoc' ở StudentPortalScreen.tsx nối qua chủ làn.
- Máy chủ: server/src/tiem-ngoc.ts — lệnh ngoc-sanh (trạng thái tiệm, trần còn), ngoc-me (tạo phiên, trả 6 đá công khai), ngoc-mo {session, qid} (gọi sau answer: đọc game_v2_attempt phiên|qid, đúng thì cấp ngọc, biên nhận chống cấp đôi, trả {loai, co, chiVang, tam}), ngoc-che-tac, ngoc-trung-bay, ngoc-so, ngoc-ket-me; GĐ2 thêm ngoc-pho, ngoc-ghe, ngoc-tim, ngoc-tang, ngoc-don, ngoc-sua-tiem. Định tuyến trong game-v2.ts cạnh bia-*; lệnh hoa2-sanh trả thêm {ngoc:{con, tran}}. server/migration-DDMM-tiem-ngoc.sql: ngoc_kho, ngoc_so, ngoc_mon, ngoc_bien_nhan; GĐ2 ngoc_tiem, ngoc_tim, ngoc_qua (chỉ thêm).
- Test: tests/tiem-ngoc-*.test.ts. Hợp đồng API: docs/hop-dong-tiem-ngoc.md (Code 3 là bên cung cấp). Sổ việc: SO-VIEC-TIEM-NGOC.md.

NGHIỆM THU (GĐ1)
- Quét khoá JSON mọi phản hồi ngoc-sanh, ngoc-me và ngoc-mo gọi trước answer: không có correct, solution, answer, solutionImages. Đạt khi test quét 0 lỗi.
- Cùng (dang, mucDo, vai, laDaMe) gọi 100 lần ra cùng loại, cỡ, Chỉ Vàng, Tâm; gọi ngoc-mo 2 lần cùng phiên|qid chỉ cấp 1 viên; câu sai hoặc chưa answer thì cấp 0 viên.
- Kế hoạch 14 doan + 26 dao: Bi-a và Tiệm Ngọc cộng lại giao tối đa 15 câu, Đoàn còn ≥ 9, Đảo còn ≥ 16; không câu nào nằm cùng lúc ở hai game.
- 21 loại trong ngoc-du-lieu.ts khớp bảng NGUYÊN TẮC từng kí tự (test so chuỗi); npm run check:mau đạt; tsc 0 lỗi; JS game ≤ 60 KB gzip; vitest tests/tiem-ngoc-* xanh, toàn bộ vitest không thêm test đỏ so với nền.
- Ở khung 360×740, Chrome giảm CPU ×4: hoạt ảnh mở đá không có khung nào > 50 ms, xong ≤ 2,8 giây, chạm bỏ qua được; chữ trên màn theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md, mọi con số có nhãn.
```

## Ba câu hỏi làm prompt sắc hơn

1. Tiệm Ngọc **dùng chung trần 40% với Bi-a** (em đề nghị, giữ nguyên luật Đoàn/Đảo còn ≥ 60%), hay thầy muốn cho trần riêng?
2. Thầy có nhắm **phát hành GĐ1 trước 20/10** (còn 22 ngày) và làm **Vương miện lớp tặng thầy dịp 20/11** không? Nếu không gấp, em dồn thời gian cho GĐ0 đẹp hơn.
3. Trang sức tự làm có cho **thần thú đeo ở Đảo** ngay GĐ2 (phải nối vào Cửa hàng phụ kiện), hay để GĐ3 như bản này?

---
Soạn 28/09/2026 · phiên cloud · chờ lệnh **HÃY THỰC THI PROMPT NÀY**.
