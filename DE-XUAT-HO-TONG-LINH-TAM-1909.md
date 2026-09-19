# ĐỀ XUẤT — HỘ TỐNG LINH TÂM bản mới: "ĐOÀN HỘ TỐNG"

Soạn 19/09/2026 · 0.Planer · **THẦY ĐÃ CHỐT 19/09 ("Đẹp quá rồi chốt luôn. Thêm màn hiệu ứng tung chưởng siêu đẹp nữa") — cả 5 câu ở mục 6 theo cột Đề nghị.** Đề bài build: `prompt-game-doan-ho-tong.md`.
Nguyên văn thầy: "thiết kế lại game hộ tống linh tâm để tăng việc học cùng nhau. Lối chơi phải rất lôi cuốn kích thích, chơi cùng nhau phải rất vui, cá nhân hoá tiến bộ môn Hoá khi chơi luôn. Tôi muốn cái này phải thành mồi ngon để học sinh phải hứng thú vào app mỗi ngày."

## 0. Game hiện tại yếu ở đâu (đọc từ `escort-core.ts`, `EscortGuide.tsx`, `game-v2-escort.ts`)
| Hiện tại | Vì sao chưa đạt mục tiêu |
|---|---|
| Đội 2 đấu 2 (hoặc 1 đấu 1) giành tinh thể | Là ĐẤU NHAU, không phải học cùng nhau. Em yếu thua hoài → bỏ. |
| Phải đủ 2–4 bạn cùng online mới vào trận | Không thành thói quen hằng ngày được: tối nào cũng phải hẹn nhau. |
| Mỗi em tự làm câu của mình, bạn bên cạnh không liên quan | Không có khoảnh khắc "giúp nhau hiểu bài". Phối hợp chỉ là đứng gần nhau để liên kích. |
| 60 giây/lượt × 12 lượt, chờ nhau chốt | Chậm, nhiều thời gian chết. |
| Không có lý do quay lại ngày mai | Không nhiệm vụ ngày, không mùa giải, không mục tiêu lớp, không sưu tầm. |
| Cấp không cho gì trong trận (đúng, công bằng) nhưng HỌC TỐT cũng không cho gì | Tiến bộ môn Hoá không nhìn thấy được trong game. |

## 1. Ý tưởng lõi
**Cả lớp là MỘT ĐOÀN hộ tống Linh Tâm đi qua bản đồ mùa giải. Mỗi ngày mỗi em đi một CHẶNG 5–6 phút. Đi một mình vẫn góp sức cho lớp; đi cùng bạn thì mạnh hơn và vui hơn. Sức mạnh trong trận đến từ việc em KHẮC PHỤC được dạng bài yếu của chính mình — và từ việc em GIÚP bạn hiểu bài.**

## 2. Bốn trụ cột

### A. Hợp tác thay cho đối kháng
- Chế độ chính là **PvE hợp tác**: 1–4 bạn cùng hộ tống Linh Tâm dọc một tuyến đường, chống các đợt "Tạp Chất" (quái theo chủ đề Hoá: Bùn Acid, Khói Oxi Hoá, Tinh Thể Kết Tủa…). Thắng cùng thắng.
- Đối kháng 2 đấu 2 cũ giữ lại làm **"Võ đài thứ Bảy"** — sự kiện tuần, không phải lối chơi chính.
- **Đánh đồng thời**, không chờ lượt: mỗi hiệp 40 giây, cả đội cùng làm câu của mình rồi cùng ra đòn. 8 hiệp/chặng ≈ 5–6 phút.

### B. Học cùng nhau thật sự — ba cơ chế
1. **TIẾP SỨC (dạy bạn):** em làm xong sớm thấy bạn đang "cần tiếp sức" (không thấy bạn sai gì, chỉ thấy tín hiệu). Bấm tiếp sức → chọn 1 trong 3 THẺ GỢI Ý do máy chủ soạn cho đúng câu của bạn ("Nhắc công thức", "Loại một phương án sai", "Chỉ bước đầu") — KHÔNG BAO GIỜ là đáp án. Bạn làm lại đúng → cả hai nhận **Liên Kích** (đòn mạnh gấp đôi). Người tiếp sức nhận EXP "tiếp sức"; câu được giúp KHÔNG tính là bằng chứng nắm bài (giữ luật hiện có: có trợ giúp = không ghi nhận) → ngày mai hồ sơ vẫn đưa lại câu cùng dạng cho bạn tự làm. Dạy bạn là cách học sâu nhất; game thưởng đúng hành vi đó.
2. **CÂU CHUNG đánh trùm:** hiệp 4 và hiệp 8 là Trùm. Cả đội nhận MỘT câu Phần II (4 ý Đúng/Sai) thuộc dạng cả lớp đang yếu; mỗi bạn được giao một ý hợp bậc của mình. Đúng ≥ 3/4 ý → vỡ giáp trùm. Các em ngồi cạnh nhau sẽ BÀN BẠC — đó là mục đích. (Câu trùm không ghi vào hồ sơ cá nhân, như luật "Boss không tạo bằng chứng học" hiện có.)
3. **BẠN ĐỒNG HÀNH:** máy chủ gợi ý ghép cặp BÙ NHAU theo hồ sơ (bạn A vững dạng Este, bạn B đang yếu Este và ngược lại ở dạng khác) → tiếp sức tự nhiên chảy hai chiều. Vinh danh tuần có thêm "Người tiếp sức của tuần".

### C. Cá nhân hoá tiến bộ môn Hoá NGAY TRONG TRẬN
- Câu của mỗi em lấy từ hồ sơ nắm kiến thức của CHÍNH em: câu tới hạn ôn → dạng đang yếu ở đúng bậc → câu mới. Hai bạn cùng trận làm hai câu khác nhau, khó-dễ khác nhau.
- **Công bằng theo nỗ lực:** đòn đánh tính theo "đúng câu VỪA SỨC MÌNH", không theo độ khó tuyệt đối. Em yếu làm đúng câu nhận biết đóng góp ngang em giỏi làm đúng câu vận dụng. Em yếu không bao giờ là "gánh nặng".
- **ẤN THẠCH DẠNG — sức mạnh đến từ khắc phục:** mỗi dạng bài là một viên ấn thạch trên bảng nhân vật. Dạng đang yếu = ấn thạch nứt. Khắc phục xong dạng (theo hồ sơ thật: dạng rời danh sách yếu) → ấn thạch sáng, mở BIẾN THỂ KỸ NĂNG mới cho thần thú (thêm lựa chọn chiến thuật, không tăng chỉ số thô — giữ luật "cấp 1 và cấp 100 cùng chỉ số"). Học giỏi lên = chơi hay hơn, nhìn thấy được.
- Sau mỗi chặng: bảng **"Hôm nay em tiến bộ gì"** — "+2 câu lên bậc · dạng Ester còn 3 câu nữa là hết yếu · em đã tiếp sức 1 lần". Mọi con số đo được, không chữ "nắm chắc".

### D. Mồi câu hằng ngày
- **Chặng đầu mỗi ngày MIỄN PHÍ** (để ngày nào cũng có lý do mở app). Chặng thêm cần **VÉ HỘ TỐNG**, mà vé chỉ kiếm bằng HỌC: đạt nhiệm vụ ngày +2 vé, xong một lô BTVN đúng nhịp +1 vé. → Game là phần thưởng của bài tập, không phải thứ thay thế bài tập.
- **ĐOÀN LỚP — bản đồ mùa 4 tuần:** mỗi chặng thắng đẩy Linh Tâm của LỚP tiến một trạm. Thanh tiến độ lớp, "hôm nay 9/32 bạn đã góp sức". Tới các mốc (Thành Pha Lê, Rừng Xúc Tác…) cả lớp nhận quà. Không ai phải online cùng lúc → thành thói quen được.
- **TRÙM LỚP tối Chủ nhật 20:00:** sự kiện cả lớp cùng online 20 phút đánh trùm mùa; đóng góp cộng dồn. Đây là "buổi hẹn" của lớp.
- **Rương chuỗi ngày** 3 / 7 / 14 ngày; **mảnh khiên** (đã chốt ở bản EXP) rơi thêm từ rương; **hào quang & danh hiệu sưu tầm** cho thần thú — HIỆN RA ở Bảng nhiệm vụ, Vinh danh và cả MÀN CHIẾU LÊN BẢNG trước lớp. Thứ các em khoe được với bạn là thứ kéo các em quay lại.
- Phần thưởng "ngẫu nhiên" đều TẤT ĐỊNH theo (sbd, ngày, mùa) để kiểm thử và không ai kêu bất công.

## 3. Một chặng diễn ra thế nào (5–6 phút)
1. Sảnh: thấy tiến độ Đoàn lớp, vé, chuỗi ngày, bạn đồng hành đang online → "Đi chặng hôm nay" (1–4 bạn; không có ai thì đi với 1 bạn đồng hành do máy điều khiển).
2. Hiệp 1–3, 5–7 (40 s/hiệp): mỗi bạn nhận câu của mình → trả lời → chọn 1 trong 3 hành động (Đánh / Chắn cho Linh Tâm / Kỹ năng thần thú). Xong sớm → có thể TIẾP SỨC bạn. Hết giờ cả đội ra đòn cùng lúc.
3. Hiệp 4, 8: TRÙM — câu chung 4 ý.
4. Kết chặng: Linh Tâm của lớp tiến trạm; bảng tiến bộ cá nhân; EXP theo luật EXP mới; rương nếu có.

## 4. An toàn & công bằng
Không chat chữ tự do (chỉ biểu cảm/tín hiệu có sẵn). Không ai thấy bạn SAI câu gì, chỉ thấy "cần tiếp sức". Thua không mất EXP. Rời trận giữa chừng → máy đỡ thay, đội không bị phạt. Trần 200 câu game/ngày, câu ca thi chưa công bố bị chặn, có trợ giúp = không ghi bằng chứng, game không sửa bảng học tập — GIỮ NGUYÊN. Thẻ gợi ý do máy chủ sinh từ lời giải, không lộ đáp án, có test.

## 5. Lộ trình build (mỗi bước chơi được ngay, phát hành riêng)
1. **Chặng hợp tác PvE 1–4 người, đánh đồng thời 40 s**, câu cá nhân hoá từ hồ sơ, công bằng theo nỗ lực, bảng "hôm nay em tiến bộ gì". (Thay lối chơi chính; PvP cũ chuyển thành Võ đài.)
2. **Tiếp sức** (thẻ gợi ý máy chủ) + Liên Kích + EXP tiếp sức.
3. **Đoàn lớp + vé hộ tống + rương chuỗi ngày** (mồi câu hằng ngày, nối với "đạt nhiệm vụ ngày").
4. **Trùm câu chung** (hiệp 4, 8) + Trùm lớp Chủ nhật.
5. **Ấn thạch dạng** (biến thể kỹ năng theo dạng đã khắc phục) + hào quang/danh hiệu hiện ở bảng nhiệm vụ, vinh danh, màn chiếu.
6. **Bạn đồng hành bù nhau** + vinh danh "Người tiếp sức của tuần" + bảng cho thầy: ai giúp ai, lớp yếu dạng nào qua câu trùm.

## 6. Việc thầy cần chốt
| # | Câu hỏi | Đề nghị |
|---|---|---|
| 1 | Lối chơi chính chuyển sang HỢP TÁC, đối kháng thành sự kiện tuần? | Đồng ý |
| 2 | Chặng thêm cần vé, vé chỉ kiếm bằng làm bài tập? | Đồng ý — chặng đầu ngày miễn phí |
| 3 | Trùm lớp tối Chủ nhật 20:00 (20 phút)? | Đồng ý; thầy đổi giờ được |
| 4 | Thẻ gợi ý tiếp sức lấy từ lời giải có sẵn của câu (máy chủ cắt bước đầu / loại một phương án)? | Đồng ý; câu không có lời giải → chỉ có thẻ "loại một phương án" |
| 5 | Hào quang/danh hiệu hiện cả trên màn chiếu lên bảng trước lớp? | Đồng ý |

## 7. Bản vẽ đã chốt (ảnh trong `docs/ban-ve-doan-ho-tong-1909/`, canvas: https://claude.ai/artifact/RFUcbWFDRPQ9PPY7EPAYnK hàng "Game")
| Ảnh | Màn | Điều phải giữ khi build |
|---|---|---|
| `1-sanh.jpg` | Sảnh hằng ngày | Bản đồ Đoàn lớp (đường đi phát sáng, Linh Tâm, rương mốc, Thành Pha Lê), thần thú THẬT của em đứng trước; thẻ "Chặng hôm nay · miễn phí" nói rõ câu của riêng em hôm nay; nút vàng LÊN ĐƯỜNG; bạn đồng hành bù nhau; rương chuỗi 7 vạch; Trùm lớp; 6 ấn thạch (sáng / nứt). |
| `2-trong-tran.jpg` | Trong trận | 8 vạch hiệp (◆ = hiệp trùm), vòng đếm giờ; cảnh trận có thần thú thật + Linh Tâm + quái; dải trạng thái đồng đội (KHÔNG hiện bạn sai gì); thẻ câu nền giấy ấm; 3 nút đòn; nút Chốt. Không cuộn ở 390×844. |
| `3-tiep-suc.jpg` | Tiếp sức | Tấm trượt 3 THẺ GỢI Ý (nhắc công thức / loại 1 phương án / chỉ bước đầu), dòng "em không thấy Hà đã chọn gì", dòng "không bao giờ là đáp án". |
| `4-tung-chuong.jpg` | TUNG CHƯỞNG (thầy yêu cầu thêm) | 2–3 giây toàn màn cuối mỗi hiệp: dải tên chiêu cắt ngang, TIA CHIÊU THỨC THẬT (`public/than-thu-v2/spells/*.png`, đã có sẵn 8 hệ × 6 cấp), chớp sáng, quái rung, số sát thương vàng, nhãn LIÊN KÍCH ×2 khi hai bạn cùng ra đòn; bảng "Vì sao đòn này mạnh" nối đòn đánh với VIỆC HỌC. Reduce motion → ảnh tĩnh + số. Bỏ qua được bằng một chạm. |
| `5-trum-cau-chung.jpg` | Trùm câu chung | Một câu Phần II, mỗi bạn giữ MỘT ý (thẻ của em viền vàng có nút Đúng/Sai; ý của bạn chỉ hiện "đã chốt / đang nghĩ"); thanh GIÁP 4 đoạn; 3 tín hiệu có sẵn, không chat chữ. |
| `6-ket-chang.jpg` | Kết chặng | "VƯỢT CHẶNG!" + 3 sao; Linh Tâm của lớp tiến trạm; thẻ giấy "HÔM NAY EM TIẾN BỘ GÌ" (mọi dòng là số đo được từ hồ sơ, không chữ "nắm chắc"); EXP + mảnh khiên 12 vạch; nút về Bảng nhiệm vụ là nút chính. |
`sinh-ban-ve.py` trong thư mục ấy là mã sinh bản vẽ (toàn bộ HTML/CSS nội tuyến, có sẵn keyframes lt-float/lt-pulse/lt-shine/lt-beam/lt-flash…) — dùng làm mẫu màu, bóng, hiệu ứng.

Công thức sát thương (tất định, máy chủ tính): `nền 16 × (đúng câu vừa sức ? 1,5 : 0) × (Liên Kích ? 2 : 1) × (kỹ năng ấn thạch ? 1 + 0,25 : 1)`, làm tròn. Sai/bỏ trống = 0 sát thương nhưng vẫn được Chắn. "Vừa sức" = câu do máy chủ chọn cho em từ hồ sơ (mọi câu trong chặng đều vừa sức theo định nghĩa) → em yếu và em giỏi gây sát thương NGANG nhau khi cùng làm đúng.

