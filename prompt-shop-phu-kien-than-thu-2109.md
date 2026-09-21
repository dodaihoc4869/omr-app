# Prompt · Vàng từ EXP thừa + Shop phụ kiện thần thú (21/09/2026)

Thầy ra ý 21/09 ~19:30: "EXP thừa cho chuyển đổi thành vàng sắm phụ kiện cho thú, hãy tạo shop phụ kiện siêu đẹp mịn, xịn chất cuốn hút siêu cuốn có giá từ bình dân tới siêu đắt siêu vip."
(Phần "trần Đoàn Hộ Tống 60 câu, tính riêng hẳn" là đổi một con số — Boss đã giao Code 3 + Code 2 làm ngay, KHÔNG nằm trong prompt này.)

## Góc nhìn khác

Bài toán thật không phải "làm một cái shop đẹp" mà là **EXP thừa đang là thứ vô nghĩa với em giỏi**: thú chỉ ăn 200 EXP/ngày, phần dư nằm ống nghiệm, em chăm nhất lại là em thấy con số "chết" nhiều nhất. Vàng là cách trả công cho phần dư ấy mà KHÔNG phá nhịp lớn của thú.
Câu cần hỏi không phải "bán gì" mà là "**một em học đều mỗi ngày thì bao lâu mua được món đầu tiên, và món VIP nhất cần bao nhiêu tuần**" — toàn bộ bảng giá suy ra từ hai con số đó.
Shop chỉ cuốn khi món đồ được NHÌN THẤY: trên thú ở Bảng nhiệm vụ, trong Đoàn trước mặt bạn, trên Bảng vinh danh. Không ai thấy thì không ai thèm.
Vàng chỉ sinh ra từ việc HỌC (EXP), không mua bằng tiền, không xin được — nên món siêu VIP là bằng chứng chăm học, thầy nhìn là biết.

## Người top 0,1% làm gì

- Thiết kế **vòi vào – cống ra** trước khi vẽ một pixel: mỗi ngày cả lớp sinh bao nhiêu vàng, shop hút bao nhiêu; đặt giá sao cho em trung bình mua món đầu trong 2–3 ngày, món đỉnh mất 8–12 tuần. Sai lầm phổ biến: giá đặt theo cảm giác ⇒ tuần đầu em giỏi mua sạch, shop chết.
- Không cho đổi TOÀN BỘ ống nghiệm: giữ lại phần "dự trữ N ngày ăn" để thú không đói tuần thi cử; chỉ phần vượt ngưỡng mới thành vàng. Sai lầm phổ biến: em đổi hết lấy đồ, hôm sau nghỉ học thú tụt nhịp, em trách game.
- Hiếm có thật: món VIP có SỐ LƯỢNG giới hạn theo mùa hoặc điều kiện học (chuỗi 14 ngày, ấn thạch sáng đủ 5) chứ không chỉ đắt. Đắt mà ai cũng mua được thì không VIP.
- Cảm giác "mịn, xịn" đến từ 5 chi tiết nhỏ: thử đồ TRƯỚC khi mua ngay trên thú của em, chuyển cảnh 200–300 ms, ánh sáng theo độ hiếm, tiếng + rung nhẹ lúc mua, số vàng chạy xuống. Không đến từ nhiều hiệu ứng.
- Mọi giao dịch là sổ CHỈ-GHI-THÊM ở máy chủ (đổi, mua, hoàn), số dư = tổng sổ; máy em không bao giờ tự tính vàng. Sai lầm phổ biến: lưu số dư một ô ⇒ bấm đúp mua hai lần, lệch không truy được.

## PROMPT

```
VAI TRÒ
Bạn là nhà thiết kế kinh tế game kiêm kỹ sư sản phẩm, 10 năm làm cửa hàng vật phẩm trang trí (cosmetic) cho game giáo dục thiếu niên, đã cân bằng hơn 20 nền kinh tế "một loại tiền, không nạp tiền thật", và tự tay dựng giao diện shop bằng React + TypeScript.

BỐI CẢNH
App luyện thi Hoá của một trung tâm 250 học sinh lớp 10–12 (React + Vite + TS + Tailwind v4; máy chủ Cloudflare Worker + D1). Mỗi em nuôi một THẦN THÚ: em kiếm EXP từ việc học thật (bài tập về nhà, ôn câu, ca kiểm tra) và từ hai game (Đảo thần thú, Đoàn Hộ Tống). Luật đã chốt: thú chỉ HẤP THỤ tối đa 200 EXP mỗi ngày em đạt nhiệm vụ ngày; EXP dư nằm trong "ống nghiệm", hôm sau thú ăn tiếp, màn hiện "Dự trữ đủ N ngày ăn". Em chăm kiếm 250–290 EXP/ngày ⇒ dư 50–90/ngày. Thú vẽ từ bảng sprite theo loài (8 loài) và theo giai đoạn tiến hoá; đã có màn "Túi đồ" trong Đảo. Thú của em hiện ở: Bảng nhiệm vụ học sinh, Đảo, sảnh và trận Đoàn Hộ Tống (bạn cùng đoàn nhìn thấy), Bảng vinh danh. KHÔNG có gì của game xuất hiện ở app phụ huynh. Không có thanh toán tiền thật và sẽ không bao giờ có.

NHIỆM VỤ
Viết BẢN THIẾT KẾ HOÀN CHỈNH + KẾ HOẠCH BUILD cho (a) cơ chế đổi EXP thừa thành VÀNG và (b) SHOP PHỤ KIỆN cho thần thú, đủ chi tiết để ba lập trình viên (máy chủ, giao diện game, mỹ thuật SVG) làm song song không phải hỏi lại.

NGUYÊN TẮC BẮT BUỘC
- Vàng CHỈ sinh từ EXP thừa; không nguồn nào khác, không tặng, không chuyển cho bạn. Tỉ giá cố định: 1 EXP thừa = 1 vàng (dễ hiểu, em tự nhẩm được) và có bảng mô phỏng 30 ngày cho 3 kiểu em: chăm (dư 80/ngày), trung bình (dư 30/ngày), thất thường (học 3 ngày/tuần).
- "EXP thừa" = phần ống nghiệm VƯỢT mức dự trữ tối thiểu 1 ngày ăn = 200 EXP. Em TỰ CHỌN đổi bao nhiêu trong phần vượt (thanh kéo), màn nói rõ "Dự trữ còn N ngày ăn" trước và sau khi đổi. Dưới 200 không đổi được. Đổi là MỘT CHIỀU, có hộp xác nhận ghi rõ "thú mất X EXP dự trữ, em nhận Y vàng".
- Bảng giá 5 bậc độ hiếm với số cụ thể: Thường 20–60 vàng · Đẹp 120–250 · Hiếm 500–900 · Sử thi 1.800–3.000 · Huyền thoại (siêu VIP) 6.000–12.000; mỗi bậc nêu số món, số ngày một em chăm cần để mua món rẻ nhất và đắt nhất của bậc.
- Tối thiểu 40 món cho mùa 1 chia 5 ô gắn trên thú: đầu, cổ/lưng, hào quang/nền, dấu chân/vệt di chuyển, khung tên. Mỗi món: tên tiếng Việt gợi Hoá học (vd "Vương miện Bạch kim", "Khăn choàng Ngọn lửa Magie"), bậc, giá, điều kiện mở (nếu có), mô tả hình 1 câu để hoạ sĩ vẽ SVG.
- Món Huyền thoại phải có ĐIỀU KIỆN HỌC kèm giá (vd chuỗi đạt nhiệm vụ 14 ngày, 5 ấn thạch sáng) và giới hạn số lượng theo mùa; ghi rõ con số.
- Phụ kiện là TRANG TRÍ THUẦN: không cộng chỉ số, không ảnh hưởng thắng thua trong Đảo/Đoàn, không ảnh hưởng EXP, điểm, xếp hạng học tập.
- Máy chủ giữ sổ chỉ-ghi-thêm `vang_so` (đổi/mua/hoàn), số dư = tổng sổ; lệnh mua idempotent theo khoá yêu cầu; máy em chỉ hiển thị số máy chủ trả. Migration chỉ-thêm. Bảng mới phải xếp vào nhóm XOÁ hay GIỮ của job reset toàn app (đề xuất: GIỮ).
- Giao diện: thử đồ trực tiếp trên thú của chính em trước khi mua; chuyển cảnh 200–300 ms; tôn trọng "giảm chuyển động"; chạy mượt trên điện thoại Android 360 px tầm trung (60 khung/giây, gói shop nạp lười ≤ 60 KB gzip chưa tính hình); sáng + tối; không màu hex thô ngoài tệp token; mọi con số có nhãn.

GIẢ ĐỊNH ĐÃ DÙNG
- BOSS CHỐT 21/09 (thầy uỷ quyền tự chốt 3 câu hỏi): 1 EXP = 1 vàng; dự trữ tối thiểu giữ lại 200 EXP; em chăm (dư 80 EXP/ngày) mua món Thường đầu tiên trong ≤ 3 ngày, món Huyền thoại rẻ nhất (6.000 vàng) sau khoảng 75 ngày ≈ 11 tuần. Trước khi khoá giá, máy chủ ĐO phân bố ống nghiệm thật (p50/p90/cao nhất); em có sẵn số dư lớn không mua được Huyền thoại ngay vì món ấy đòi điều kiện học + giới hạn số lượng.
- Phụ kiện vẽ bằng SVG lớp phủ, neo theo 5 điểm neo khai báo cho từng loài × từng giai đoạn tiến hoá (8 loài); không vẽ lại sprite thú.
- BOSS CHỐT: bạn cùng đoàn và Bảng vinh danh NHÌN THẤY phụ kiện em đang mặc. Làm HAI ĐỢT để không nghẽn mỹ thuật: ĐỢT 1 = ba ô KHÔNG cần điểm neo theo loài (hào quang/nền · vệt di chuyển · khung tên), 24 món, lên trước; ĐỢT 2 = hai ô cần neo (đầu · cổ/lưng), 16 món, bảng neo 8 loài × giai đoạn tiến hoá. app phụ huynh và app thầy KHÔNG hiện shop (thầy chỉ có một dòng thống kê "số em đã mua đồ" nếu dễ).
- Không hoàn trả sau khi mua; không bán lại; không quà tặng giữa các em (tránh xin xỏ, bắt nạt).
- Mùa 1 kéo dài tới hết học kỳ I; hết mùa món giới hạn ngừng bán, đồ đã mua giữ mãi.
- Shop mở cho mọi em ngay; vào từ Đảo (nút "Cửa hàng" cạnh Túi đồ) và từ thẻ thần thú ở Bảng nhiệm vụ.

KHÔNG ĐƯỢC LÀM
- Không hộp quà ngẫu nhiên, vòng quay, mở rương trả vàng, đếm ngược "sắp hết hạn" ép mua, giảm giá chớp nhoáng — không cơ chế cờ bạc với học sinh.
- Không cho vàng hay phụ kiện tác động tới EXP, cấp thú, điểm, vé Đoàn, thứ hạng thi đua.
- Không đổi luật thú ăn 200 EXP/ngày, luật kiếm EXP, luật chấm điểm, luật vào thi.
- Không để máy học sinh tự tính số dư hay tự quyết giao dịch; không lưu số dư ở localStorage.
- Bản thiết kế không quá 2.500 chữ (không tính bảng món đồ); không viết mã hoàn chỉnh, chỉ chữ ký lệnh và lược đồ bảng.

ĐỊNH DẠNG ĐẦU RA
Một tệp Markdown `DE-XUAT-SHOP-PHU-KIEN-2109.md` gồm đúng 8 phần: (1) Tóm tắt 10 dòng cho thầy; (2) Kinh tế vàng: tỉ giá, ngưỡng, bảng mô phỏng 30 ngày × 3 kiểu em, tổng vàng cả lớp/tuần; (3) Bảng giá 5 bậc + bảng ≥ 40 món (tên · ô gắn · bậc · giá · điều kiện · mô tả hình); (4) Trải nghiệm shop: sơ đồ 4 màn (Cửa hàng · Thử đồ · Xác nhận mua · Tủ đồ) mỗi màn ≤ 120 chữ + trạng thái trống/lỗi/không đủ vàng; (5) Hợp đồng máy chủ: bảng D1, 5 lệnh (`vang-xem`, `vang-doi`, `shop-danh-sach`, `shop-mua`, `thu-mac-do`) với thân vào/ra dạng JSON mẫu; (6) Mỹ thuật: quy cách SVG, 5 điểm neo, quy tắc ánh sáng theo bậc, dung lượng; (7) Kế hoạch build 3 làn song song, mỗi làn 4–6 mốc, mốc nào cần máy chủ lên trước; (8) Rủi ro + cờ tắt nhanh (`cau_hinh.shop_phu_kien`). Kèm một tệp `docs/ban-ve-shop-phu-kien-2109/mau-phac.html` tự chứa (không mạng) phác màn Cửa hàng + Thử đồ ở 390 px, sáng + tối, dữ liệu mô phỏng.

NGHIỆM THU
- Bảng mô phỏng cho ra: em chăm mua được món Thường đầu tiên trong ≤ 3 ngày kể từ khi vượt ngưỡng dự trữ, và cần 8–12 tuần cho món Huyền thoại rẻ nhất — ĐẠT/TRƯỢT theo đúng con số trong bảng.
- Đếm được ≥ 40 món, đủ 5 ô gắn, đủ 5 bậc, không món nào thiếu giá hoặc mô tả hình.
- Rà toàn văn: 0 cơ chế ngẫu nhiên trả thưởng, 0 chỗ phụ kiện cộng chỉ số, 0 chỗ máy em tự tính số dư.
- 5 lệnh máy chủ đều có JSON mẫu vào/ra, nêu idempotent và lỗi bằng lời; bảng mới được xếp XOÁ/GIỮ cho job reset.
- Tệp mẫu phác mở bằng trình duyệt không cần mạng, không tràn ngang ở 360 và 390 px, có cả sáng và tối.
```

## Ba câu hỏi làm prompt sắc hơn

1. Tỉ giá và ngưỡng: thầy muốn em chăm mua món đầu tiên sau **mấy ngày**, và món siêu VIP sau **mấy tuần**? (Tôi đang đặt 3 ngày và 8–12 tuần; hai con số này quyết định cả bảng giá.)
2. Em đổi EXP lấy vàng có được đụng vào **phần dự trữ cho thú ăn** không, hay chỉ phần vượt 3 ngày dự trữ như tôi giả định?
3. Phụ kiện có cho **bạn bè nhìn thấy** (trong Đoàn, Bảng vinh danh) không? Có thì cuốn hơn nhiều nhưng phải vẽ đồ cho cả 8 loài × mọi giai đoạn tiến hoá — việc mỹ thuật tăng khoảng 3 lần.

— Soạn 21/09/2026 · Boss
