# ĐẶC TẢ SẢN PHẨM — BÁT LINH (bản thương mại, chỉ web)

*Bản 1.0 · 01/10/2026 · để thầy Đỗ Đại Học phản biện từng mục trước khi chốt build.*
*Nguồn: `GDD-BAT-LINH-0110.md` (GDD), `DE-XUAT-HOAN-CHINH-0110.md` (ĐX), `docs/nghien-cuu-game-luot-0110.md` (NC), mã ở `origin/main` (`652ea46`). Tài liệu chỉ đọc repo, không sửa mã.*

---

## 0. Cách đọc

### 0.1 Quy ước

| Ký hiệu | Nghĩa |
|---|---|
| `XX-nn` | **Mã yêu cầu.** Thầy phản biện bằng cách dẫn mã, ví dụ "TR-07: máu 60 hơi nhiều". |
| **PHẢI** | Bắt buộc, thiếu thì không phát hành. |
| **NÊN** | Làm nếu đủ thời gian; cắt được (thứ tự cắt ở mục 10.3). |
| *(cbst)* | Số ban đầu, **cân bằng sau thử**. Không phải số đã chứng minh. |
| *(gt)* | Giả thuyết, cần số liệu thật. |
| *(cks)* | Cần khảo sát hoặc cần chuyên gia (luật sư, kế toán) xác nhận. |
| `CH-nn` | Câu hỏi cần thầy chốt (mục 0.3). |
| T / V / C | Công sức: **T** ≤ 1 ngày · **V** 2–4 ngày · **C** > 1 tuần hoặc cần dữ liệu/nhãn mới. |

Mọi ví dụ Hoá đúng chương trình 2018, đã tự kiểm số. Thể tích khí ở **đkc 24,79 L/mol**. Nguyên tử khối: H 1, C 12, N 14, O 16, Na 23, Cl 35,5, Fe 56, Cu 64, Br 80, Ag 108.

**Bảng tiền tố mã:**

| Tiền tố | Hệ thống | Mục | Tiền tố | Hệ thống | Mục |
|---|---|---|---|---|---|
| MT | Mục tiêu, chỉ số | 1 | BN | Bất ngờ lành mạnh | 4.10 |
| HT | Hành trình người dùng | 3 | BA | Bi-a | 4.11 |
| PV | Phạm vi kiến thức (tick bài) | 4.1 | XH | Xã hội | 4.12 |
| DV | Test đầu vào | 4.2 | ST | Sổ tay bẫy | 4.13 |
| NL | Năng lực & SRS | 4.3 | TT | Thần thú & Vườn Linh | 4.14 |
| KH | Kế hoạch ngày & thể lực | 4.4 | KT | Kinh tế | 4.15 |
| TS | Thử sức thêm (chặng phụ) | 4.5 | TM | Thành tích, mốc, mùa | 4.16 |
| TR | Trận theo lượt hợp nhất | 4.6 | TH | Thi thử | 4.17 |
| LD | 21 luật đảo | 4.7 | TL | Tu luyện, Chế độ gọn | 4.18 |
| BY | Bẫy có tên, phục thù | 4.8 | LG | Lời giải, đường tự sửa | 4.19 |
| NR | Ngã rẽ & bùa | 4.9 | GC | Thông báo, giữ chân | 4.20 |
| PH | Báo cáo phụ huynh | 4.21 | KD | Kho đề, dây chuyền | 5 |
| BH | Thương mại | 6 | KY | Kỹ thuật | 7 |
| PL | Pháp lý | 8 | | | |

### 0.2 Quyết định ĐÃ CHỐT (ràng buộc, không phản biện lại trừ khi thầy đổi)

| # | Quyết định | Hệ quả cho đặc tả |
|---|---|---|
| Q1 | **Bán thẳng cho học sinh/phụ huynh qua web (B2C tự vận hành).** Vẫn dùng được cho lớp của thầy. | Khác ĐX mục 2 (B2B2C). Không có "thầy giao"; máy tự lập lộ trình. |
| Q2 | **Thầy chỉ cập nhật kho đề.** Mọi thứ khác máy tự chạy. | Không có màn nào cần thầy thao tác hằng ngày. "Cần thầy dạy lại" → đường tự sửa (LG). |
| Q3 | Học sinh tự đăng ký, chọn lớp, **tick BÀI đã học theo mục lục SGK Kết nối tri thức (KNTT)**. Chỉ còn một bộ KNTT. | Không có bước chọn bộ sách. |
| Q4 | **Mọi kênh rút câu tự động chỉ lấy câu thuộc bài đã tick.** Câu tổng hợp cần đủ mọi bài. Ngoại lệ duy nhất: "Câu thử" ở đảo sương, do em tự bấm. | Luật PV-04 áp cho mọi kênh. |
| Q5 | Test đầu vào thích ứng; lộ trình cá nhân tự động thay chiến dịch thầy giao; ôn cách quãng dùng lại SRS hiện có (`server/src/srs2-loi.ts`). | Không viết lại thuật toán SRS. |
| Q6 | Ảnh do máy vẽ (ChatGPT); hoạt ảnh bằng mã; mượt trên máy yếu; **chỉ web** (web + PWA), không lên cửa hàng ứng dụng. | Ngân sách hiệu năng KY-20…KY-26. |
| Q7 | **Không:** gacha trả tiền; phạt mất chuỗi nặng, thông báo doạ; ép giờ phản xạ; lộ đáp án trước khi nộp; xếp hạng công khai làm xấu hổ; rút câu tự luận vào kênh tự động; bán thứ gì trong game bằng tiền thật; quảng cáo. | Mỗi điều có mã kiểm ở mục 4–7. |
| Q8 | Sáu sửa điểm yếu: (1) game có đánh đổi thật; (2) mỗi đảo một luật nhỏ; (3) 3 phút đầu thắng ngay, test đầu vào rải 2–3 buổi; (4) bất ngờ lành mạnh; (5) xã hội cho em tự học; (6) "Thử sức thêm" thành chặng phiêu lưu có thưởng nhỏ, có trần. | TR-20…TR-26, LD, HT-03…HT-05, BN, XH, TS. |

### 0.3 CÂU HỎI CẦN THẦY CHỐT

| # | Câu hỏi | Phương án đề xuất | Ảnh hưởng mã |
|---|---|---|---|
| CH-01 | Ai là người trả tiền: phụ huynh hay em? | **Phụ huynh trả** qua tài khoản phụ huynh; em không thấy nút mua ở bất kỳ màn nào. Em ≥ 16 tuổi tự trả được nếu muốn. | BH-01, BH-06 |
| CH-02 | Giá gói (tháng/năm/mùa thi)? | Chưa chốt. Dựng trang giá thử 2 mức (mục 6.2) để đo tỉ lệ bấm "Đăng ký" trước khi chốt. Không lấy số thị trường khi chưa khảo sát. | BH-02 |
| CH-03 | Bản miễn phí trông thế nào? | **Dùng thử đủ 14 ngày**, sau đó bản miễn phí: kế hoạch ≤ 10 câu/ngày, đủ game, không Thi thử tuần, không báo cáo phụ huynh. | BH-03, BH-04 |
| CH-04 | "Chắc!" sai có chịu giá nhỏ không? | **Có:** mất 1 năng lượng (không mất máu). Không có giá thì "Chắc!" luôn tối ưu, mất đánh đổi thật. | TR-11, TR-21 |
| CH-05 | Đội ghép ngẫu nhiên với người lạ: bật cho ai? | Chỉ **câu mẫu**, ẩn danh. Em ≥ 16 tuổi tự bật; < 16 tuổi cần phụ huynh bật. Tắt hẳn cho tới khi luật sư trả lời về NĐ 147/2024 (PL-03). | XH-01…XH-04 |
| CH-06 | Có làm "Gia sư AI" (Hỏi Linh) không? | **Có, ở giai đoạn 3**, chỉ mở **sau khi nộp**, chỉ trả lời dựa trên lời giải đã kiểm của đúng câu đó, ≤ 10 lượt/ngày. Thầy duyệt 50 hội thoại mẫu trước khi bật. | LG-08…LG-11 |
| CH-07 | Đổi chuỗi ngày sang **chuỗi tuần** khoan dung? | Có (ĐX mục 10 câu 5 vẫn mở). | GC-05 |
| CH-08 | Ai nhập và duyệt mục lục KNTT (chương → bài) của 3 lớp? | Máy nhập từ mục lục SGK, **thầy duyệt một lần** (khoảng 30 phút/lớp). | PV-01, KD-04 |
| CH-09 | Câu chép từ sách/đề nơi khác có bán không? | Chỉ bán câu **tự soạn hoặc có quyền**. Câu nguồn ngoài gắn cờ `nguon_ngoai`, chỉ dùng cho lớp của thầy cho tới khi luật sư trả lời. | KD-12, PL-04 |
| CH-10 | Ma trận Thi thử (tỉ lệ lớp 10/11/12; Biết/Hiểu/Vận dụng)? | Tạm 70% lớp 12 / 30% lớp 10–11; 40/30/30. **Thầy đối chiếu đề tham khảo của Bộ** rồi chốt. | TH-03 |
| CH-11 | Phần II đúng 2 ý = 0,25 điểm có đúng quy chế không? | Thầy xác nhận (trích đoạn đọc được chỉ nêu mức 1, 3, 4 ý). | TH-05 |
| CH-12 | Báo cáo phụ huynh gửi qua đâu? | Trang `/ph` + email tuần. Zalo để sau (cần tài khoản OA, có phí). | PH-02 |
| CH-13 | Lớp của thầy dùng chung hệ thống B2C hay tách? | **Chung một hệ**, vùng dữ liệu "trung tâm" riêng; chiến dịch thầy giao được ưu tiên trên lộ trình tự động. | KY-10, PV-09 |
| CH-14 | Đăng nhập bằng gì? | Email + mật khẩu, và "Đăng nhập Google". OTP qua SMS để sau (tốn tiền mỗi tin). | KY-01 |
| CH-15 | Pháp nhân: hộ kinh doanh hay công ty? | Hỏi kế toán. Nếu cần cổng thanh toán (VNPay, MoMo doanh nghiệp) thì thường phải có đăng ký kinh doanh *(cks)*. | BH-07, PL-05 |
| CH-16 | Có khoá cứng thời gian chơi mỗi ngày không? | Không khoá cứng; nhắc nghỉ ở phút 60; trần câu 40/ngày đã có. Đổi nếu luật sư nói NĐ 147/2024 bắt buộc. | GC-08, PL-03 |
| CH-17 | Hoàn tiền thế nào? | Hoàn đủ trong 7 ngày đầu của gói trả trước; không tự gia hạn. | BH-09 |
| CH-18 | Bi-a giữ trong bản bán? | Giữ, mở sau khi xong kế hoạch ngày hoặc khi bạn mời. | BA-01 |
| CH-19 | Vườn Linh làm ở giai đoạn nào? | Giai đoạn 3 (lùi được). | TT-06 |
| CH-20 | Thử sức thêm có EXP không? | Có, như hiện tại, trong trần 40 câu/ngày; thêm vàng nhỏ (TS-04). | TS-04 |
| CH-21 | Tên sản phẩm và tên miền? | Giữ "Bát Linh"; mua một tên miền `.vn` và một `.com` *(cks: kiểm nhãn hiệu trùng)*. | BH-10 |
| CH-22 | Em tự tick bài quá rộng (chưa học mà tick): xử lý? | Không khoá, không phạt; máy gợi ý "Bài này em có chắc đã học chưa?" khi kết quả các bài đó thấp bất thường. | PV-11 |
| CH-23 | Ngưỡng tuổi tối thiểu dùng app? | Lớp 10 trở lên (≈ 15 tuổi). Mọi em < 16 tuổi cần phụ huynh xác nhận trước khi lưu dữ liệu định danh. | HT-02, PL-01 |
| CH-24 | Mục tiêu mặc định khi em chọn "Chưa biết"? | Như "Khá" (14–16 câu); sau 2 tuần app **gợi ý**, không tự đổi. | KH-03 |
| CH-25 | Luật đảo bật ở chế độ nào? | Chỉ ở Đảo (đánh một mình) và Hộ Tống; tắt ở Chế độ gọn, Thi thử, Tu luyện. | LD-02 |
| CH-26 | Điều khoản ảnh máy vẽ (OpenAI) | Đọc lại bản mới nhất trước khi bán; lưu câu lệnh và ngày tạo mỗi ảnh. | KY-27, PL-06 |
| CH-27 | Đầu năm lớp 10, em mới tick 1 bài, kho có < 3 câu: có cho "câu làm quen" ngoài phạm vi ở trận đầu không? | **Không** (giữ luật cứng Q4); trận đầu ngắn 1–2 câu. Thay vào đó ưu tiên soạn đủ ≥ 10 câu NB cho bài đầu mỗi chương. | HT-24, PV-05 |

---

## 1. Mục tiêu sản phẩm và chỉ số thành công

**Một câu:** em lớp 10–12 tự học Hoá 12–20 phút mỗi ngày trong phạm vi bài đã học trên lớp, **tự sửa được lỗi của mình**, nhớ lâu, và tự muốn quay lại.

**Ngưỡng:** mọi ngưỡng ghi "chốt sau khi có số gốc" (2 tuần đo trước khi bật tính năng, mục 10). Không đặt ngưỡng bằng số tưởng tượng.

| Mã | Nhóm | Chỉ số | Định nghĩa đo được | Vai trò |
|---|---|---|---|---|
| MT-01 | Học | **Tự sửa lỗi** | Trong các câu (hoặc mã bẫy) em sai rồi gặp lại: tỉ lệ **đúng ở lần gặp kế tiếp, không gợi ý, không tiếp sức** | Chính |
| MT-02 | Học | **Nhớ sau trễ** | Tỉ lệ đúng ở lần ôn cách lần đúng trước **≥ 7 ngày**, không gợi ý | Chính |
| MT-03 | Học | **Bài mới cùng dạng** | Tỉ lệ đúng ở câu **chưa từng gặp** thuộc dạng/bẫy em đã thuần phục, trừ tỉ lệ dự báo theo hạng p của dạng | Chính |
| MT-04 | Học | Lặp cùng bẫy | Số lần dính lại cùng mã bẫy trong 14 ngày / số bẫy đã gặp | Phụ |
| MT-05 | Cuốn | **Tự quay lại ngày 1 / 7 / 30** | % em đăng ký ngày N có ≥ 1 câu vào ngày N+1; trong ngày N+1…N+7; trong ngày N+24…N+30 | Chính |
| MT-06 | Cuốn | **Tự chơi thêm** | % ngày có kế hoạch xong mà em vào thêm ít nhất 1 chặng phụ/Bi-a/Hộ Tống **không do thông báo mở** | Chính |
| MT-07 | Cuốn | **Hoàn thành buổi** | % buổi bắt đầu mà làm xong kế hoạch ngày | Chính |
| MT-08 | Cuốn | Ngày học/tuần | Trung vị số ngày có ≥ 1 câu mỗi tuần | Chính |
| MT-09 | Phụ | Thời gian | Trung vị phút/buổi (đích 12–20); % thời gian đọc–giải câu (đích ≥ 65%) | **Phụ, không tối đa hoá** |
| MT-10 | An toàn | Áp lực, giờ khuya | Khảo sát 3 câu/tuần (vui · hiểu vì sao sai · áp lực, thang 1–5); % phiên sau 22:30 | **Ngưỡng dừng:** áp lực tăng ≥ 1 bậc thì tắt tính năng vừa bật |
| MT-11 | Kinh doanh | Chuyển đổi | % em dùng thử 14 ngày mà phụ huynh trả tiền | Chỉ đo ở giai đoạn 4 |
| MT-12 | Kinh doanh | Giữ gói | % gói tháng được mua tiếp tháng sau | Như trên |

**Không dùng làm mục tiêu:** tổng thời gian trong app, số lần mở app, số thông báo được bấm.

---

## 2. Người dùng

### 2.1 Vai

| Vai | Làm gì | Màn |
|---|---|---|
| **Em (học sinh)** | Đăng ký, tick bài, học, chơi | `/hs` (app chính) |
| **Phụ huynh** | Xác nhận đồng ý (< 16 tuổi), trả tiền, đọc báo cáo tuần | `/ph` |
| **Thầy (chủ sản phẩm)** | Tải đề, duyệt câu bị gắn cờ, xem số đo tổng | `/gv` (chỉ phần kho đề + bảng số đo) |
| **Máy** | Lập lộ trình, chấm, soạn lời giải, gắn nhãn, gửi nhắc, xuất báo cáo, thu tiền, đối soát | — |

### 2.2 Tám kiểu học sinh (giữ GDD 2.3)

Lối học lõi (kế hoạch ngày) **không phụ thuộc** em có thích game hay không. Mỗi kiểu có ít nhất một lối đi hợp mình.

| Kiểu | Thích | Nổi bật trong Bát Linh | Tín hiệu nhận ra |
|---|---|---|---|
| Thành tựu | Thanh tiến độ, mốc | Thần thú tiến hoá, bản đồ năng lực | Mở Thành tích; làm hết kế hoạch; chọn Tinh anh |
| Khám phá | Chỗ mới, bí mật | Sương tan, luật đảo mới, Câu thử | Bấm vùng sương; mở "Vì sao" cả câu đúng |
| Sưu tầm | Đủ bộ | Sổ tay bẫy, quái hiếm, đồ vườn | Mở Sổ tay; phục thù tự nguyện |
| Câu chuyện | Nhân vật | Hồi truyện, thoại thần thú mốc | Ít bấm "Bỏ qua" thoại |
| Hợp tác | Làm cùng bạn | Hộ Tống, mời bạn bằng mã | Vào Hộ Tống; gửi câu mẫu |
| Thi đua nhẹ | So tài | Bi-a, Song đấu, đấu bóng ma | Vào Bi-a/Song đấu; làm lại Thử thách |
| Sáng tạo | Tự bày | Vườn Linh, câu thần chú | Phút ở Vườn; độ dài thần chú |
| Chơi nhanh | Phiên ngắn | Chuyến "Ghé nhanh" 3 ải, Câu chung của ngày | Phiên < 6 phút; nhiều phiên/ngày |

Phát hiện kiểu và "điểm nhấn" giữ GDD 7.5 (chỉ đổi cách trình bày, không đổi việc học, nút "Ra đảo" luôn giữ chỗ). Thử 50/50 ở giai đoạn 3 (mục 10).

---

## 3. Hành trình người dùng

| Mã | Bước | Màn | Hành động chính | Dữ liệu ghi | Điều kiện chuyển |
|---|---|---|---|---|---|
| HT-01 | **Vào trang** | Trang giới thiệu (tên miền riêng) | Bấm "Chơi thử ngay" (không cần tài khoản) | Mã khách ngẫu nhiên trong máy (`localStorage`), không dữ liệu định danh | Bấm nút |
| HT-02 | **Chọn lớp** | Thẻ 10 / 11 / 12 | Một chạm | `lop` gắn với mã khách | Chọn xong |
| HT-03 | **Tick nhanh** | Mục lục KNTT của lớp, mở sẵn nút "Học tới bài…" | Một chạm "Học tới bài X" (hoặc tick từng bài) | `pham_vi` (danh sách mã bài) | ≥ 1 bài |
| HT-04 | **3 phút đầu: trận nhỏ** (MD) | Đảo Thức Tỉnh, 1 ải, quái "Bé Sương" | 3 câu NB trong phạm vi đã tick; luôn kết thúc bằng thắng | Lần làm (`su_kien_hoc`, nguồn `mo_dau`), chưa vào năng lực chính thức | Xong 3 câu |
| HT-05 | **Chọn thần thú** | 8 thẻ | Chọn, đặt tên (tuỳ) | `than_thu` | Chọn xong |
| HT-06 | **Lưu tiến độ** (tạo tài khoản) | "Lưu thần thú của em" | Email/Google + mật khẩu; ngày sinh; < 16 tuổi: nhập email phụ huynh | Tài khoản; gộp dữ liệu mã khách vào tài khoản | ≥ 16: xong ngay. < 16: dữ liệu định danh **chờ** phụ huynh bấm xác nhận trong email (≤ 7 ngày, quá hạn thì xoá) |
| HT-07 | **Buổi 1** (≈ 10 phút) | Sảnh → trận khám phá 1 | 1 trận khám phá (test rải, 6–8 câu) + màn "Hôm nay xong rồi" | Câu đầu vào (nguồn `dau_vao`) | Xong trận hoặc thoát (lưu giữa chừng) |
| HT-08 | **Buổi 2** (ngày khác) | Sảnh | Kế hoạch nhỏ 6–8 câu (từ năng lực tạm) + trận khám phá 2 | Như trên | Xong |
| HT-09 | **Buổi 3** | Sảnh | Kế hoạch 8–10 câu + trận khám phá 3 (nếu còn mạch thiếu) → **Bản đồ năng lực** ra mắt | Năng lực "tạm" → "chính" ở mạch đủ ≥ 2 câu | Đủ dữ liệu |
| HT-10 | **Ngày thường** | Sảnh một nút "Ra đảo · N câu" | Chuyến 6 ải → Xong chuyến → Rương → "Hôm nay xong rồi" → (tuỳ) chặng phụ / Bi-a / Hộ Tống | Lần làm, bẫy, vàng, EXP | Hết kế hoạch |
| HT-11 | **Tuần** | Thẻ tuần trên Sảnh | Chuỗi tuần; Thử thách tuần; **Thi thử tuần phạm vi đã học** (T7, CN, tuỳ chọn) | Điểm thi thử, bẫy dính | Tuỳ chọn |
| HT-12 | **Mùa / kỳ thi** | Hành trình mùa, lịch mốc | Em nhập ngày kiểm tra giữa kỳ/cuối kỳ; 14 ngày trước mốc kế hoạch nghiêng ôn; Thi thử mùa | Mốc thi | Theo lịch |
| HT-13 | **Cập nhật bài** | Nhắc 2 tuần/lần "Ở trường em học tới bài nào rồi?" | Một chạm | `pham_vi` mới | Câu bài mới vào kế hoạch từ hôm sau |
| HT-14 | **Nghỉ lâu quay lại** (≥ 5 ngày) | Thần thú mừng, không nhắc số ngày vắng | Gói hồi phục 3 ngày (GC-07); hỏi lại "Em học tới bài nào rồi?" | — | Tự động |
| HT-15 | **Hết hạn dùng thử / gói** | Em vẫn chơi bản miễn phí; **chỉ phụ huynh** nhận email gia hạn | — | — | — |

**Luật chung:** HT-16 Em thoát ở bất kỳ bước nào thì lần sau tiếp đúng chỗ (lưu sau mỗi câu). HT-17 Từ bấm "Chơi thử ngay" đến câu Hoá đầu tiên **≤ 45 giây** trên máy tầm thấp, mạng 4G. HT-18 Không bắt nhập email trước khi em đã thắng trận đầu.

### 3.1 Đặc tả 3 phút đầu (sửa điểm yếu 3)

| Mã | Yêu cầu |
|---|---|
| HT-20 | **PHẢI**: 3 câu **NB** của bài đã tick, mỗi câu Phần I; quái "Bé Sương" máu 24, ý đồ "Cắn 4"; máu em 60. Chỉ đúng 1/3 câu vẫn **thắng** (quái rút lui khi hết câu, ghi "Thắng"). |
| HT-21 | Trận đầu dạy đúng **một** thao tác mỗi câu: câu 1 chỉ "Đánh"; câu 2 mở "Chắn" kèm ý đồ; câu 3 mở "Chắc!". Mỗi lần một khung chú thích ≤ 12 chữ. |
| HT-22 | Không đồng hồ, không đếm ngược. Không hỏi tên, email trước khi trận xong. |
| HT-23 | Câu sai: hiện ✗ + tên bẫy (nếu có) + nút "Xem vì sao" (lời giải mở **sau** khi nộp câu đó). |
| HT-24 | Nếu phạm vi đã tick có < 3 câu NB đã duyệt: lấy thêm câu TH **trong phạm vi**; vẫn < 3 câu thì trận đầu chỉ có 1–2 câu (vẫn thắng). **Không** lấy câu ngoài phạm vi (giữ Q4). Có nên cho phép "câu làm quen" ngoài phạm vi không: CH-27. |
| HT-25 | Nghiệm thu: ≥ 90% em thử trên 3 máy mẫu xong trận đầu trong ≤ 3 phút 30 giây (đo từ "Chơi thử ngay"). |

---

## 4. Đặc tả từng hệ thống

### 4.1 Phạm vi kiến thức: tick bài, bản đồ câu ↔ bài (PV)

| Mã | Yêu cầu |
|---|---|
| PV-01 | **PHẢI** có mục lục KNTT Hoá 10, 11, 12 dạng cây **Chương → Bài**; mã bài dạng `L12-C2-B5` (lớp–chương–bài theo số bài trong SGK). Bảng `muc_luc_kntt(ma_bai, lop, chuong, so_bai, ten_bai, thu_tu)`. Thầy duyệt một lần (CH-08). |
| PV-02 | Màn tick: mỗi bài một ô; nút nhanh "Đã học hết chương", "Học tới bài này" (tick từ đầu lớp tới bài chọn), "Đã học hết lớp 10/11" (cho em lớp 11, 12). Bỏ tick từng bài được. |
| PV-03 | **Mỗi câu kho gắn danh sách bài KNTT cần để làm được** (`cau_bai(qid, ma_bai)`, nhiều dòng/câu). |
| PV-04 | **Luật cứng:** câu `q` được rút tự động cho em `e` ⇔ `bai(q) ⊆ pham_vi(e)` **và** `q` đã duyệt **và** `q` không tự luận (`src/lib/cau-tu-luan.ts`, `MetaCau.tuLuan`). Áp cho: kế hoạch ngày, Đảo, Hộ Tống, Bi-a, Thi thử, test đầu vào, câu phục thù, câu tương tự, chặng phụ, Song đấu, đấu bóng ma, Câu chung của ngày. |
| PV-05 | Ngoại lệ **duy nhất**: **Câu thử** ở đảo sương do em tự bấm (không vào kế hoạch, không hạ năng lực, không tính điểm học). Mọi câu thử ghi nguồn `cau_thu` để kiểm. |
| PV-06 | Tick thêm bài ⇒ đảo/vùng tương ứng tan sương; câu bài đó vào kế hoạch **từ hôm sau** (giữ luật "đổi từ ngày mai" của `rai-deu`). |
| PV-07 | Bỏ tick bài ⇒ câu ôn của bài đó **tạm dừng** (không xoá lịch sử, không tính nợ); tick lại thì quay về đúng trạng thái SRS. |
| PV-08 | Tan sương không cho EXP/vàng (không có cách tick để lấy thưởng). |
| PV-09 | Em trong lớp của thầy: câu của chiến dịch thầy giao được rút **dù chưa tick** (thầy là người quyết phạm vi lớp); ngoài chiến dịch vẫn theo tick. |
| PV-10 | Nhắc nhẹ 1 lần / 14 ngày "Ở trường em học tới bài nào rồi?" — một chạm cập nhật; bỏ qua được; không nhắc trong giờ yên tĩnh. |
| PV-11 | Chống tick bừa: nếu ở ≥ 3 bài vừa tick, tỉ lệ đúng câu NB–TH < 40% sau ≥ 8 câu, hiện một lần "Bài này em có chắc đã học chưa?" (Giữ / Bỏ tick). Không khoá, không phạt. |
| PV-12 | Phạm vi quá hẹp: nếu số câu đủ điều kiện < 30, kế hoạch ngày tự giảm N (không lặp câu quá dày) và Sảnh hiện "Kho bài của em còn ít câu, tick thêm bài khi đã học nhé". |

**Biên:** câu tổng hợp 3 bài, em tick 2 → không rút. Em đổi lớp (lên lớp mới tháng 9) → giữ phạm vi cũ, gợi ý tick "Đã học hết lớp X". Câu đề ngoài không gắn được bài → **không rút** cho tới khi gắn (KD-08).

**Nghiệm thu:** kiểm tự động trên 10.000 lần rút giả lập với phạm vi ngẫu nhiên: **0 câu vi phạm PV-04** (ngoài Câu thử có nguồn `cau_thu`). Test này chạy trong `vitest` cho mọi kênh.

### 4.2 Test đầu vào thích ứng, rải 2–3 buổi (DV)

| Mã | Yêu cầu |
|---|---|
| DV-01 | Đơn vị đo: **8 mạch** (GDD 3.3) ∩ phạm vi đã tick. Chỉ đo mạch có ≥ 1 bài đã tick. |
| DV-02 | Kho đầu vào: mỗi mạch 3 mức (NB, TH, VD) × ≥ 4 câu, đã duyệt, không tự luận, đa số Phần I; có 1–2 câu Phần II rút gọn (2 ý) và 1 câu Phần III. Mỗi câu thuộc đúng phạm vi (PV-04). |
| DV-03 | Luật chọn (bậc thang hai chiều, giữ GDD 5.2): xuất phát TH; đúng → lên mức, sai → xuống mức; hai câu trái kết quả → câu thứ 3 ở mức giữa; xoay vòng giữa các mạch. |
| DV-04 | **Rải thành 2–3 "trận khám phá"**, mỗi trận 6–8 câu, mỗi buổi tối đa 1 trận. Tổng ≤ 22 câu. Dừng sớm khi mọi mạch có ≥ 2 câu. |
| DV-05 | Trận khám phá là trận thật (luật TR), vỏ: "Đền sương" — mỗi câu đúng tan một mảng sương của đền mạch đó. Không đồng hồ. |
| DV-06 | Câu sai trong trận khám phá: hiện ✗ và tên bẫy; lời giải mở được **sau khi nộp câu**, nhưng **không** chèn phục thù (giữ đo sạch). Bẫy ghi "Đã gặp" vào Sổ tay. |
| DV-07 | Mức L1–L4: dùng **đúng** `tiLeLamTron` + `hangTuTiLe` (`srs2-loi.ts`): p = (đúng + 2)/(gặp + 4); < 0,40 L1; < 0,65 L2; ≤ 0,85 L3; > 0,85 L4. Trọng số mức: VD đúng ×1,5; NB sai ×1,5 *(gt)*. Mạch < 2 câu gắn "tạm". Ghi nguồn `dau_vao`. |
| DV-08 | Giữa các trận khám phá, kế hoạch ngày dùng năng lực **tạm** (mạch chưa đo = L2). |
| DV-09 | Phạm vi < 3 bài: test ngắn 6 câu, mở rộng dần khi em tick thêm (mỗi lần tick ≥ 2 bài mới thì thêm 1 trận khám phá 4–6 câu cho mạch mới). |
| DV-10 | Em bỏ giữa chừng: lưu sau mỗi câu; quá 7 ngày chưa xong thì dừng test, SRS tự hiệu chỉnh. |

**Nghiệm thu:** ≥ 80% em xong ≥ 2 trận khám phá trong 7 ngày đầu; tương quan hạng mạch (đầu vào) với tỉ lệ đúng 2 tuần sau ≥ 0,3 *(gt, chốt sau số gốc)*.

### 4.3 Mô hình năng lực và SRS (NL)

| Mã | Yêu cầu |
|---|---|
| NL-01 | **Giữ nguyên** lõi SRS theo câu `phatLaiCau` (`srs2-loi.ts`): chuỗi đúng `cc`, `lanSai`, `thanhThao`, `henOn`; hẹn ôn theo `henOnSau`; duy trì `HEN_DUY_TRI = 30` ngày (câu ≥ 2 sao: 14); sai ⇒ ôn ngày mai. |
| NL-02 | Bốn tầng: **Câu** (SRS) · **Dạng** (L1–L4, `tinhHangTheoDang`) · **Mạch** (8; trung bình p các dạng, trọng số số lần gặp — mới) · **Bẫy** (Ẩn / Đã gặp / Đã thuần phục / Thành thạo — mới). |
| NL-03 | Chỉ câu **tự làm** (không gợi ý, không tiếp sức, không bùa Kính lúp) mới tính thành thạo (giữ `tuLam`, `coGoiY`). |
| NL-04 | `catTia` (sai ≥ `NGUONG_CAT_TIA = 4` và lần cuối sai) **không còn "chờ thầy"**: mở **Đường tự sửa** (LG-04). Xong đường tự sửa ⇒ máy ghi mốc dạy lại (`srs2_day_lai`, như thầy bấm "Chữa xong") ⇒ câu quay lại kế hoạch. |
| NL-05 | Bài chưa tick **không** tính là yếu ở mọi màn (bản đồ năng lực, tiến hoá, báo cáo phụ huynh). |
| NL-06 | Cờ mới `chacMaSai` (sai khi đã bấm "Chắc!") ghi theo lần làm; dùng đo hiệu chỉnh tự tin. |
| NL-07 | **Lộ trình tự động thay chiến dịch thầy**: mỗi chương có bài đã tick mà còn câu mới ⇒ máy tạo "chiến dịch tự động" với `hanNop` = mốc kiểm tra em nhập, mặc định **21 ngày** sau khi tick bài đầu của chương *(cbst)*. Dùng nguyên `lapKeHoachNgay`, `bocCauMoiCaNhan`, `xepChuyenDao`, `quotaCauMoi`. |
| NL-08 | Nhiều chương cùng mở: ưu tiên chương **mới tick gần nhất** (khớp tiến độ trên lớp), các chương khác chia phần ôn duy trì. |

**Biên:** không có mốc thi nào, chương đã hết câu mới ⇒ chỉ còn ôn đến hạn + duy trì. **Nghiệm thu:** chạy lại toàn bộ test hiện có của `srs2-loi` không đổi kết quả (bảo toàn); test mới cho NL-04, NL-07.

### 4.4 Kế hoạch ngày và thể lực (KH)

| Mã | Yêu cầu |
|---|---|
| KH-01 | Thể lực = **số câu kế hoạch còn lại hôm nay** (giữ hợp đồng `hoa2-sanh` `theLuc`). Không có thể lực mua được, không hồi theo giờ. |
| KH-02 | Thành phần: nợ + ôn đến hạn trước, ≤ 50% N (`TI_LE_TRAN_NO`); câu mới chương đang học phần còn lại (`quotaCauMoi`); ôn duy trì ≤ 20% (`TI_LE_DUY_TRI`); **cặp dễ nhầm** 1–2 câu/ngày xếp liền nhau. |
| KH-03 | N theo mục tiêu *(cbst)*: Vững nền 10–12; Khá 14–16; Giỏi 18–20; Chưa biết = Khá (CH-24). Trần cứng `TRAN_NGAY = 40`. Bản miễn phí ≤ 10 (BH-04). |
| KH-04 | Độ khó động (chỉ câu mới): w = tỉ lệ đúng 20 câu kế hoạch gần nhất (tự làm). w < 0,65 → hạ 1 mức 5 câu, chèn bài mẫu; 0,70–0,85 giữ; w > 0,85 (≥ 15 câu) → nâng 1 mức; w > 0,92 (≥ 20 câu) → mời "Vượt cấp" 3 câu bài **đã tick** khó hơn *(dải 70–85% là gt)*. Luôn giữ ≥ 1 câu TH/chuyến cho em L1–L2. Ghi mọi lần điều chỉnh. |
| KH-05 | Ví dụ cặp dễ nhầm (chỉ khi cả hai bài đã tick): "13,6 g phenyl acetate cần bao nhiêu mol NaOH?" (**0,2**) liền với "8,8 g ethyl acetate cần bao nhiêu mol NaOH?" (**0,1**). |
| KH-06 | 14 ngày trước mốc thi em nhập: tỉ lệ ôn nâng lên 60–70%. |
| KH-07 | Câu đang bảo vệ cho ca kiểm tra của lớp thầy (`cau_dang_bao_ve`) không rút (giữ). |

**Nghiệm thu:** ví dụ GDD 7.2 (em lớp 12, Khá, N = 14) tái tạo đúng trong test; tổng câu/ngày không vượt 40 ở mọi kịch bản giả lập.

### 4.5 Thử sức thêm thành chặng phiêu lưu phụ (TS) — sửa điểm yếu 6

| Mã | Yêu cầu |
|---|---|
| TS-01 | Sau "Hôm nay xong rồi", nút **phụ** "Thêm một chặng phiêu lưu" (nút chính vẫn là "Nghỉ thôi"). |
| TS-02 | Một chặng = **3 ải** trên "Đảo phụ" có luật đảo của chương câu đó (LD); câu lấy bằng `hoa2-thu-suc-them` hiện có (câu mới **của ngày mai**, trong phạm vi tick). |
| TS-03 | **Trần an toàn:** tối đa **2 chặng/ngày** *(cbst)*; tổng câu ngày ≤ `TRAN_NGAY = 40`; không mở trong giờ yên tĩnh; sau 60 phút học trong ngày, nút đổi thành "Mai chơi tiếp nhé" (vẫn mở được bằng bấm thêm một lần). |
| TS-04 | Thưởng nhỏ: +2 vàng/ải (≤ 12/ngày, **trong** trần vàng 60); +1 ánh sao/câu đúng (trong trần 20); 1 "mảnh bản đồ" (đủ 5 mảnh mở một góc đảo trang trí). EXP như câu kế hoạch (CH-20). Không có thưởng nào hơn kế hoạch chính. |
| TS-05 | Câu đã làm ở chặng phụ **trừ khỏi** kế hoạch ngày mai (không học hai lần). |
| TS-06 | Không có rương, không có quái hiếm, không có Câu vàng ở chặng phụ (giữ bất ngờ cho kế hoạch chính). |

**Nghiệm thu:** % em vào chặng phụ (MT-06) đo được; không em nào vượt 40 câu/ngày; kế hoạch ngày mai giảm đúng số câu đã làm trước.

### 4.6 Trận theo lượt hợp nhất: Đảo đơn + Hộ Tống đội (TR) — sửa điểm yếu 1

**Nguyên tắc:** một lõi trận tất định dùng chung, tách từ `doan-core.ts` (thay `learningBattle` trình diễn). Đúng/sai luôn do **máy chủ chấm**; lõi chỉ đổi kết quả chấm thành hình và số.

| Mã | Yêu cầu |
|---|---|
| TR-01 | Lõi `tran-core.ts` (mới, tách từ `doan-core.ts`), hàm thuần, tất định: `(trạngThái, hànhĐộng, kếtQuảChấm) → trạngThái mới`. Hộ Tống và Đảo cùng dùng. |
| TR-02 | Giữ hằng: `SAT_THUONG_NEN = 16`, `HE_DUNG = 1,5`, `HE_LIEN_KICH = 2`, `HE_AN_THACH = 1,25`, `NL_TOI_DA = 3`, `NL_KY_NANG = 2`, `CHAN = 8`, `CONG_QUAI = 4`, `HP_QUAI = 24`, `SO_Y_TRUM = 4`, `Y_VO_GIAP = 3`, `CONG_TRUM_MOI_GIAP = 8`. |
| TR-03 | Một lượt: (1) quái hiện **ý đồ**; (2) em chọn **Đánh / Chắn / Kỹ năng** (+ tuỳ chọn **Chắc!**); (3) trả lời; (4) máy chủ chấm; (5) đúng → hành động nổ, sai → hành động không hiệu lực; (6) quái còn sống thì làm theo ý đồ. |
| TR-04 | Ý đồ tính **tất định từ trạng thái trận**, không dùng đáp án (K4). Hiện biểu tượng + số. |
| TR-05 | **Bộ ý đồ** *(cbst)*: **Cắn N** · **Gồng giáp +N** (giáp đỡ sát thương trước máu, mất cuối lượt sau) · **Tụ lực** (lượt này không cắn, lượt sau Cắn 2N) · **Hồi N** · **Gọi thêm 1 quái** (chỉ Tinh anh/trùm). Quái thường dùng 2 ý đồ đầu; Tinh anh/trùm dùng cả 5 theo vòng có quy luật (ví dụ Cắn → Tụ lực → Cắn 2N → Gồng). |
| TR-06 | Số Đảo đơn *(cbst)*: máu em 60; quái thường 24 máu, Cắn 8 / Gồng +12; Tinh anh 48 máu, Cắn 12 / Gồng +12 / Tụ lực; trùm ải Phần I/III 48 máu, Cắn 12; trùm Phần II: giáp 4 đoạn = 4 ý, vỡ khi đúng ≥ 3, không vỡ thì cắn (4 − số ý đúng) × 8. |
| TR-07 | **Đánh đúng:** 16 × 1,5 = 24 (× hệ số). **Chắn đúng:** đỡ 8 lượt này **và** gây 12. **Kỹ năng** (tốn 2 năng lượng, câu đúng): thủ = khiên 12 trong 2 lượt; hồi = hồi 10; công = đòn 24 + lan 6 sang quái kế. Năng lượng +1 mỗi câu đúng, tối đa 3. |
| TR-08 | Liên kích: câu đúng thứ 3 liên tiếp × 2. Ấn thạch: câu thuộc dạng đã khắc phục × 1,25. Công thức hiện thành phép nhân: `16 × 1,5 × 2 = 48`. |
| TR-09 | Mỗi ải có **đúng số câu kế hoạch đã xếp**. Hết câu mà quái còn sống ⇒ quái rút lui, ải vẫn qua, ít sao hơn. Game không tự thêm câu (trừ phục thù ≤ 2/chuyến). |
| TR-10 | Sao ải: ★ qua; ★★ hạ quái; ★★★ hạ quái và không mất máu ở ải đó. 1 sao = 1 vàng. |
| TR-11 | **Chắc!**: tối đa 3 lần/chuyến; đúng × 2; sai: **không** mất máu thêm, "Vì sao sai" mở ngay, ghi `chacMaSai`, **mất 1 năng lượng** nếu có (CH-04). Không bấm được khi đã dùng gợi ý/Kính lúp. |
| TR-12 | Hết máu: "Thần thú che chở" (`ImmortalShield.tsx`): chuyến dừng sớm, câu đã làm vẫn ghi bằng chứng học và EXP, câu chưa làm quay lại kế hoạch. Không mất gì. |
| TR-13 | Hạn **mềm**: hết thời lượng gợi ý (Phần I 90 s, Phần II/III 180 s) chỉ hiện "Cần gợi ý không?", không tự nộp, không trừ gì (K3). |
| TR-14 | Hộ Tống giữ luật đội `doan-core.ts` (2–4 ghế, 8 hiệp, trùm hiệp 4 và 8, Linh Tâm `40 + 20 × số ghế`, tiếp sức ≤ 2, câu được tiếp sức `tuLam = false`). Thêm ý đồ: "Sắp đánh: N quái × 4 = 4N; mỗi Chắn đúng đỡ 8"; hiệp trùm "Giáp 4 ý · vỡ khi đúng ≥ 3". |
| TR-15 | Trinh sát trước trùm Hộ Tống: 20 giây, mỗi em "Em nhận" ≤ 2 ý trong 4 **tiêu đề** (không nội dung, không đáp án); ý không ai nhận chia bằng `chiaY`. |
| TR-16 | Thần thú **không cho chỉ số** trong trận (giữ "Ghế KHÔNG có cấp thần thú"). Trả tiền hay không cũng không đổi số trận. |

#### 4.6.1 Kiểm "có đánh đổi thật" (TR-20 … TR-26)

Mục tiêu: **không có hành động nào luôn tối ưu.** Kiểm bằng máy, không bằng cảm giác.

| Mã | Yêu cầu / phép kiểm |
|---|---|
| TR-20 | Viết **bộ giải tối ưu** (quy hoạch động / kỳ vọng tối đa) trên lõi `tran-core.ts`: trạng thái = (máu em, máu + giáp quái, ý đồ, năng lượng, lượt Chắc! còn, số câu còn lại của ải, chuỗi đúng). Mục tiêu tối đa = kỳ vọng sao ải − λ × máu mất (λ = 0,05 sao/máu *(cbst)*, vì máu mang sang ải sau). Xác suất đúng p ∈ {0,5; 0,7; 0,9}. |
| TR-21 | **Không trội tuyệt đối:** trên tập trạng thái đạt được (lấy mẫu ≥ 10.000), mỗi hành động {Đánh, Chắn, Kỹ năng, Đánh + Chắc!} phải là **tối ưu duy nhất** (hơn hành động thứ hai ≥ 5% giá trị) ở **≥ 10%** trạng thái; không hành động nào tối ưu ở **> 60%** trạng thái. |
| TR-22 | **Tự tin có giá trị:** chính sách tối ưu ở p = 0,5 và p = 0,9 khác nhau ở **≥ 20%** trạng thái (biết mình chắc đến đâu thì chơi khác). |
| TR-23 | **Chơi máy móc thua rõ:** chính sách "luôn Đánh, không Chắc!" đạt kỳ vọng sao thấp hơn chính sách tối ưu **≥ 10%**; "luôn Chắc! khi còn lượt" thấp hơn ≥ 5% ở p = 0,5. |
| TR-24 | **Học vẫn là đường chính:** ở mọi chính sách, tăng p từ 0,5 lên 0,9 tăng kỳ vọng sao **nhiều hơn** chênh giữa chính sách tối ưu và chính sách tệ nhất ở cùng p (hiểu bài quan trọng hơn mẹo chơi). |
| TR-25 | Mỗi luật đảo (LD) phải làm đổi hành động tối ưu ở **≥ 5%** trạng thái so với khi tắt luật đó (luật không chỉ là trang trí). |
| TR-26 | Thử với em thật: không hành động nào chiếm > 70% số lượt của em trung vị; % hiệp Hộ Tống mất máu giảm ≥ 20% tương đối khi bật ý đồ, tỉ lệ đúng không giảm (H1 của NC). |

Bộ giải TR-20…TR-25 chạy trong `vitest` (`tests/tran-danh-doi.test.ts`), là **cổng** trước mỗi lần đổi số cân bằng.

**Ví dụ một lượt có số (Đảo Điện Hoá, Tinh anh 48 máu, ý đồ "Cắn 12"):** câu Phần III "Điện phân CuSO₄ điện cực trơ, I = 2 A, t = 965 s. Khối lượng Cu bám catot?". Em chọn Đánh + Chắc!, nhập **0,64**: n(e) = 2 × 965 / 96.500 = 0,02 mol; n(Cu) = 0,01 mol; m = 0,64 g. Đòn 16 × 1,5 × 2 = 48, Tinh anh gục. Nếu nhập 1,28 (quên chia 2 electron): đòn không hiệu lực, em mất 12 máu và 1 năng lượng, gọi tên bẫy "quên số electron trao đổi".

**Ví dụ đánh đổi thật:** Tinh anh còn 48 máu, ý đồ "Tụ lực" (lượt sau Cắn 24), ải còn 2 câu, em 1 lượt Chắc!. Đánh + Chắc! (nếu chắc) hạ ngay; nếu không chắc, Đánh thường (24) rồi lượt sau **Chắn** (đỡ 8, gây 12) chỉ mất 16 thay vì 24 nhưng quái không chết (còn 12) → ★ thay vì ★★. Em phải cân "giữ máu cho trùm" và "lấy thêm sao".

### 4.7 Mỗi đảo một luật riêng nhỏ (LD) — sửa điểm yếu 2

| Mã | Yêu cầu chung |
|---|---|
| LD-01 | Mỗi đảo (chương KNTT) có **đúng một luật** lấy từ kiến thức chương. Luật hiện trên **thẻ luật** ở đầu chuyến (≤ 2 câu) và trong "Sổ luật". |
| LD-02 | Luật chỉ chạy ở Đảo, chặng phụ, Hộ Tống; **tắt** ở Chế độ gọn, Thi thử, Tu luyện (CH-25). Luật **không** cần trả lời thêm câu nào ngoài câu kế hoạch, trừ khi ghi rõ "câu nhỏ luật đảo" (không tính SRS, không tính điểm học, chấm ở máy chủ). |
| LD-03 | Luật chỉ đổi số trận (máu, giáp, hệ số, năng lượng), **không** đổi tập câu, **không** lộ đáp án. |
| LD-04 | Mỗi luật qua cổng TR-25 (đổi hành động tối ưu ở ≥ 5% trạng thái). |
| LD-05 | Lần đầu vào đảo: thần thú đọc luật bằng 1 câu + 1 ví dụ Hoá; từ lần 2 chỉ còn biểu tượng. |
| LD-06 | Chuyến trộn nhiều chương (ôn): luật của **chương có nhiều câu nhất** trong chuyến; hoà thì lấy chương mới tick gần nhất. |

**Quần đảo Khởi Nguyên — lớp 10 (7 đảo)**

| Mã | Đảo (chương KNTT) | Luật (2–3 câu) | Ví dụ Hoá đã kiểm | Đánh đổi tạo ra |
|---|---|---|---|---|
| LD-10 | 1. Hạt Nhân (Cấu tạo nguyên tử) | **Lớp vỏ electron.** Quái mang giáp bằng số lớp electron; lớp ngoài cùng hiện số electron. Lớp ngoài ≤ 3 electron (kim loại) vỡ bởi **mọi** đòn đúng kể cả Chắn; lớp ngoài 5–7 electron (phi kim) chỉ vỡ bởi Đánh hoặc Kỹ năng. | Na (Z = 11): 2/8/**1** → 3 lớp, lớp ngoài vỡ bằng Chắn. Cl (Z = 17): 2/8/**7** → phải Đánh. Al (Z = 13): 2/8/**3**. | Gặp quái kim loại: Chắn vừa giữ máu vừa phá giáp; quái phi kim: phải chọn Đánh chịu đòn. |
| LD-11 | 2. Tuần Hoàn (Bảng tuần hoàn) | **Hàng theo bán kính.** Quái cùng chu kỳ xếp hàng: bán kính lớn đứng trước và chịu đòn trước. Kỹ năng "lan" chỉ lan sang quái **kế bên trong hàng**. | Chu kỳ 3: bán kính **Na > Mg > Al** → Na đứng đầu. Bẫy: "Al lớn nhất vì Z lớn nhất". | Biết thứ tự thì để dành Kỹ năng lan khi hàng còn ≥ 2 quái. |
| LD-12 | 3. Liên Kết (Liên kết hoá học) | **Phân cực.** Quái phân tử phân cực (H₂O, NH₃) nhận thêm 6 từ đòn lan; quái không phân cực (CO₂, CH₄) **miễn** lan nhưng Chắn đúng gây 18 thay vì 12. | CO₂ có liên kết C=O phân cực nhưng phân tử thẳng → **không phân cực**; H₂O góc → phân cực. | Chọn Kỹ năng lan hay Chắn tuỳ hình học phân tử của quái. |
| LD-13 | 4. Oxi Hoá – Khử | **Đếm electron nhận.** Quái là chất oxi hoá; giáp = số electron nó nhận (mỗi đoạn 8). Liên kích (×2) phá 2 đoạn một lần. | Fe³⁺ + 1e → Fe²⁺: **1** đoạn. MnO₄⁻ (Mn +7) → Mn²⁺ nhận **5e**: 5 đoạn. | Dành liên kích cho quái nhiều electron; quái 1e hạ bằng Chắn. |
| LD-14 | 5. Năng Lượng (Năng lượng hoá học) | **Toả – thu.** Quái "toả nhiệt" (ΔrH < 0): đòn đúng hạ nó **hồi cho em 4 máu**. Quái "thu nhiệt" (ΔrH > 0): đòn chỉ có hiệu lực khi em còn ≥ 1 năng lượng (cần "cấp năng lượng"), đòn tiêu 1 năng lượng. | H₂ + Cl₂ → 2HCl: ΔrH = (436 + 243) − 2 × 432 = **−185 kJ** → toả nhiệt. Bẫy: +185. | Giữ năng lượng cho quái thu nhiệt hay tiêu cho Kỹ năng. |
| LD-15 | 6. Tốc Độ (Tốc độ phản ứng) | **Chọn nhiệt độ ải.** Trước ải em chọn 25 °C hoặc 35 °C. Ở 35 °C, γ = 2: mọi đòn đúng **và** mọi đòn quái đều × 2. **Xúc tác** (bùa riêng đảo): × 1,5 đòn của em, dùng xong không mất mà nghỉ 2 lượt (xúc tác không bị tiêu hao). | γ = 2, 30 → 60 °C: tốc độ × 2³ = **8 lần** (bẫy: 6 lần). | Mạo hiểm 35 °C khi chắc bài; 25 °C khi máu thấp. |
| LD-16 | 7. Halogen (Nhóm VIIA) | **Halogen mạnh đẩy halogen yếu.** Hạ quái Cl₂ đúng thì quái Br⁻/I⁻ đứng sau mất 8 máu; hạ quái Br₂ không làm hại quái Cl⁻. | Cl₂ + 2NaBr → 2NaCl + Br₂: 0,1 mol Cl₂ tạo **0,1 mol Br₂ = 16 g**. Br₂ không đẩy được Cl⁻. | Đánh quái mạnh (máu nhiều) trước để có sát thương lan. |

**Quần đảo Biến Hoá — lớp 11 (6 đảo)**

| Mã | Đảo (chương KNTT) | Luật | Ví dụ Hoá đã kiểm | Đánh đổi |
|---|---|---|---|---|
| LD-20 | 8. Cân Bằng (Cân bằng hoá học) | **Chuyển dịch.** Ải có hai phe: chất đầu ⇌ sản phẩm. Hạ một quái phe **sản phẩm** thì cân bằng chuyển dịch chiều thuận: mỗi quái phe chất đầu mất 6. Quái chất rắn **không** tham gia (không bị ảnh hưởng). | N₂ + 3H₂ ⇌ 2NH₃: tách NH₃ ra → cân bằng chuyển dịch chiều thuận. CaCO₃(s) ⇌ CaO(s) + CO₂(g): Kc = **[CO₂]**. | Đánh phe sản phẩm (ít máu) để trừ máu cả phe chất đầu, hay đánh thẳng quái đang Cắn. |
| LD-21 | 9. Nitrogen – Sulfur | **Thụ động.** Quái Fe, Al **miễn** Kỹ năng (Kỹ năng = "acid đặc nguội"); chỉ Đánh/Chắn có hiệu lực với chúng. Quái Cu nhận Kỹ năng bình thường. | Fe, Al thụ động trong HNO₃ đặc nguội, H₂SO₄ đặc nguội. 19,2 g Cu (0,3 mol) + HNO₃ loãng → 0,2 mol NO = **4,958 L** (bẫy 7,437 L). | Dành năng lượng cho quái Cu; với Fe/Al phải Đánh. |
| LD-22 | 10. Hữu Cơ Đại Cương | **Đồng phân.** Trùm tách thành n bóng đồng phân. "Câu nhỏ luật đảo" trước trùm: em đoán n. Đoán đúng ⇒ Kỹ năng lan trúng **mọi** bóng; đoán sai ⇒ không mất gì, lan như thường. | C₄H₁₀O có **7** đồng phân cấu tạo: 4 alcohol + 3 ether (bẫy: 4). | Tốn 1 lượt suy nghĩ, đổi lại đòn lan mạnh. |
| LD-23 | 11. Hydrocarbon | **Liên kết π.** Quái có số khiên = số liên kết π; mỗi câu đúng phá 1 khiên (như cộng Br₂). Quái vòng benzene có khiên **không phá bằng Đánh thường** (benzene không làm mất màu nước bromine), chỉ Kỹ năng phá. | Propyne CH≡C–CH₃: 2 π → 0,1 mol cộng tối đa 0,2 mol Br₂ = **32 g** (bẫy: 16 g). | Giữ năng lượng cho quái benzene. |
| LD-24 | 12. Dẫn xuất halogen – Alcohol – Phenol | **Nhân thơm hoạt hoá.** Đòn đúng lên quái phenol thế **3 vị trí**: tính là 3 câu đúng cho đếm liên kích. Quái alcohol thì 1. | 9,4 g phenol (0,1 mol) + nước bromine dư → 0,1 mol 2,4,6-tribromophenol (M = 331) = **33,1 g** (bẫy: 17,3 g). | Đánh phenol trước để kích liên kích ×2 cho quái khó kế tiếp. |
| LD-25 | 13. Hợp chất carbonyl – Carboxylic acid | **Gương bạc.** Hạ quái aldehyde cho "bạc" thành khiên: HCHO cho khiên 16, aldehyde thường cho 8. Quái acid không cho bạc. | 0,1 mol HCHO + AgNO₃/NH₃ dư → **0,4 mol Ag = 43,2 g** (bẫy: 21,6 g). | Hạ HCHO trước lấy khiên lớn hay hạ acid đang Cắn. |

**Quần đảo Kiến Tạo — lớp 12 (8 đảo)**

| Mã | Đảo (chương KNTT) | Luật | Ví dụ Hoá đã kiểm | Đánh đổi |
|---|---|---|---|---|
| LD-30 | 14. Ester – Lipid | **Xà phòng hoá tốn NaOH.** Kỹ năng lên quái ester thường tốn 2 năng lượng như mọi đảo; lên quái **ester của phenol** tốn 3 (gấp rưỡi) nhưng gây gấp đôi. | 13,6 g phenyl acetate (M = 136, 0,1 mol) cần **0,2 mol NaOH = 8 g**; 8,8 g ethyl acetate (0,1 mol) cần 0,1 mol. | Dồn đủ 3 năng lượng cho quái phenyl ester hay tiêu sớm. |
| LD-31 | 15. Carbohydrate | **Thuỷ phân mở khoá.** Quái saccharose miễn "gương bạc" (không có khiên bạc). Chắn đúng lên nó = "thuỷ phân": tách thành 2 quái nhỏ glucose + fructose (12 máu mỗi con), mỗi con hạ cho khiên bạc 8. | 18 g glucose (0,1 mol) → **21,6 g Ag**. 34,2 g saccharose (0,1 mol) thuỷ phân hoàn toàn → 0,1 glucose + 0,1 fructose → **0,4 mol Ag = 43,2 g**; saccharose chưa thuỷ phân không tráng bạc. | Thuỷ phân (thêm quái, thêm khiên) hay Đánh thẳng. |
| LD-32 | 16. Hợp chất chứa nitrogen | **Cắt khớp peptide.** Trùm peptide n mắt xích có **n − 1 khớp**; mỗi câu đúng cắt 1 khớp; cắt hết là trùm tan. Số khớp hiện trước. Quái amino acid **lưỡng tính**: nhận đủ cả Đánh lẫn Chắn; quái amine chỉ nhận Đánh đủ, Chắn còn một nửa. | Ala-Gly-Ala có **2** liên kết peptide (bẫy: 3). 7,5 g glycine (0,1 mol) + HCl vừa đủ → **11,15 g** muối (M = 111,5). | Biết trước số khớp thì dồn Chắc! đúng chỗ. |
| LD-33 | 17. Polymer | **Trùng ngưng để lại phân tử nhỏ.** Hạ quái trùng ngưng (nylon-6,6, PET) để lại "giọt nước" chắn 1 lượt (đòn kế tiếp của em chỉ còn một nửa) trừ khi dùng Kỹ năng lan dọn. Quái trùng hợp (PE, PVC) không để lại gì. | PVC (mắt xích M = 62,5), M = 125.000 → hệ số polymer hoá **2.000**. Nylon-6,6 điều chế bằng **trùng ngưng**, tách H₂O (bẫy: trùng hợp). | Thứ tự hạ quái và lúc dùng Kỹ năng. |
| LD-34 | 18. Pin điện và điện phân | **Mạch kín.** Chắn đúng **2 lượt liền** thì "đóng mạch": quái ở **anode** (kim loại mạnh hơn) tự mất 4 máu mỗi lượt đến hết ải. | Pin Zn–Cu: E°pin = 0,34 − (−0,76) = **1,10 V**; Zn là anode, bị oxi hoá. Điện phân CuSO₄, 2 A, 965 s → **0,64 g Cu**. | Hai lượt Chắn (chậm) đổi lấy sát thương đều về sau. |
| LD-35 | 19. Đại cương kim loại | **Dãy điện hoá.** Thần thú cầm "Fe". Quái ion **đứng sau Fe** trong dãy (Cu²⁺, Ag⁺) nhận đòn × 1,5 (Fe khử được); quái ion đứng trước (Zn²⁺, Al³⁺) không. | Fe + CuSO₄ → FeSO₄ + Cu; Fe không khử Zn²⁺. 5,6 g Fe + HCl dư → FeCl₂, **2,479 L** H₂ (bẫy: 3,7185 L; 2,24 L). | Chọn mục tiêu theo vị trí trong dãy. |
| LD-36 | 20. Nhóm IA và IIA | **Nước cứng.** Ải có cặn làm mọi đòn −4. Cứng **tạm thời**: Chắn đúng = "đun sôi" gỡ cặn. Cứng **vĩnh cửu**: chỉ Kỹ năng ("Na₂CO₃") gỡ được. | Ca(HCO₃)₂ →(t°) CaCO₃ + CO₂ + H₂O. CaCl₂ + Na₂CO₃ → CaCO₃ + 2NaCl. 2,3 g Na + H₂O → **1,2395 L** H₂ (bẫy: 2,479 L). | Gỡ cặn trước (mất lượt) hay đánh chịu −4. |
| LD-37 | 21. Kim loại chuyển tiếp thứ nhất, phức chất | **Tháo phối tử.** Trùm phức có số "tay" = số phối trí; mỗi câu đúng tháo 1 tay; mỗi tay còn lại +2 vào đòn trùm. Đánh vào lõi khi còn tay chỉ gây một nửa. | [Fe(H₂O)₆]³⁺ có số phối trí **6**. Fe (Z = 26) [Ar]3d⁶4s² → Fe³⁺ **[Ar]3d⁵** (bẫy: [Ar]3d³4s²). | Tháo tay (giảm đòn) hay đánh lõi (nhanh hạ). |

**Nghiệm thu LD:** 21/21 luật có test lõi; 21/21 qua TR-25; thầy duyệt câu chữ thẻ luật và ví dụ Hoá (danh sách trên là bản đề xuất).

### 4.8 Bẫy có tên và Trận phục thù (BY)

| Mã | Yêu cầu |
|---|---|
| BY-01 | Bảng chỉ thêm `bay(ma, ten, dao, mach, mo_ta, vi_du)` và `cau_bay(qid, phuong_an, ma_bay)`: phương án sai (Phần I), ý (Phần II), khoảng kết quả sai hay gặp (Phần III). |
| BY-02 | Mã bẫy chỉ gửi xuống **sau khi máy chủ chấm** (K4). |
| BY-03 | Sai ở phương án có mã ⇒ màn **gọi tên bẫy** (tên + quái + 1 câu). |
| BY-04 | Có câu **cùng mã, khác số, trong phạm vi tick, em chưa làm hôm nay** ⇒ chèn **Trận phục thù** ngay sau ải. ≤ 2/chuyến. Không có ⇒ hẹn phục thù hôm sau. |
| BY-05 | Thắng phục thù ⇒ bẫy "Đã thuần phục", +1 Mảnh Linh, mở ô viết câu thần chú. Thua ⇒ giữ "Đã gặp", hẹn theo SRS. |
| BY-06 | Cùng mã dính ≥ 2 lần trong 14 ngày ⇒ mở **Đường tự sửa** (LG-04). |
| BY-07 | Ví dụ: câu gốc 5,6 g Fe + HCl dư → em chọn 3,7185 L (Bẫy Fe hoá trị III). Phục thù: 2,7 g Al + HCl dư → n(H₂) = 0,15 mol → **3,7185 L** — lần này hoá trị III **đúng**, em phải tự thấy hoá trị quyết định tỉ lệ mol. |
| BY-08 | Kho mục tiêu: ≥ 8 bẫy/đảo (≈ 170 bẫy); MVP 30–50 câu gắn mã của 2 chương. |

**Nghiệm thu:** MT-04 giảm ≥ 25% tương đối ở câu có phục thù so với không (thử ngẫu nhiên trong em, H3 của NC) *(ngưỡng chốt sau số gốc)*.

### 4.9 Ngã rẽ và bùa (NR)

| Mã | Yêu cầu |
|---|---|
| NR-01 | Hình chuyến: `Ải1 → Ải2 → [Ngã rẽ] → Ải3 → Ải4 → [Ngã rẽ] → Ải5 → Ải6 (Trùm)`; giữ `SO_AI_CHUYEN = 6`. |
| NR-02 | Nhánh **Tinh anh** (câu khó nhất còn lại của ngày; thưởng +5 vàng + chọn 1 trong 3 bùa) / **Suối hồi** (câu ôn đến hạn; đúng hồi 20 máu). Thiếu loại câu thì nhánh mờ. |
| NR-03 | Máy chủ giữ tập câu ngày; em chỉ chọn thứ tự. Lệnh mới `hoa2-chon-nhanh {session, nhanh}`; máy khách không thấy trước câu. |
| NR-04 | 6 bùa, sống trong chuyến, không mua, không tích: Kính lúp (gạch 1 phương án sai; câu tính có trợ giúp) · Lá chắn bẫy · Ngọn đuốc (xem tiêu đề 4 ý trùm) · Bình suối (hồi 15) · Thêm một Chắc! · Tiếng gọi bạn đồng hành (một câu "chỗ dễ nhầm", tính có trợ giúp). |
| NR-05 | Mỗi đảo có thêm 1 bùa riêng theo luật đảo (ví dụ "Xúc tác" ở Đảo Tốc Độ). |

**Nghiệm thu:** ≥ 40% lượt ngã rẽ chọn Tinh anh; mức trung bình câu đã làm không giảm (H4 của NC).

### 4.10 Bất ngờ lành mạnh (BN) — sửa điểm yếu 4

**Nguyên tắc:** bất ngờ chỉ là **thứ thêm vào**, không bao giờ là thứ bị lấy đi; không mua được; tần suất **công khai** trong Sổ luật; ngẫu nhiên do máy chủ sinh từ hạt `(mã em, ngày)` để kiểm toán được; không đổi tập câu học.

| Mã | Bất ngờ | Tần suất ban đầu *(cbst)* | Thưởng | Ràng buộc |
|---|---|---|---|---|
| BN-01 | **Quái hiếm** (8 loại, ví dụ "Kỳ Lân Đồng Vị", "Phượng Hoàng Xúc Tác") thay quái thường | 4% mỗi ải thường; ≤ 1/ngày; bảo đảm ≥ 1 lần mỗi 14 ngày học | Thẻ quái hiếm vào Sổ tay (bộ sưu tập riêng), +10 vàng (trong trần) | Câu vẫn là câu kế hoạch; máu/ý đồ như quái thường |
| BN-02 | **Câu vàng**: một câu kế hoạch được đánh dấu vàng khi em tới nó | 1 câu/ngày trong ngày có kế hoạch ≥ 6 câu; chọn trong câu ôn đến hạn | Đúng: +10 vàng, +5 ánh sao (trong trần); thần thú reo một câu | Không báo trước câu nào; sai không mất gì |
| BN-03 | **Bùa ngẫu nhiên** (Discover 1 trong 3) | Mỗi lần thắng Tinh anh; 10% bộ 3 có **bùa hiếm** (ví dụ "Lục diệp": +1 Chắc! và hồi 10) | Như NR-04 | Chỉ trong chuyến |
| BN-04 | **Thoại thần thú mốc** | Ở 12 mốc: câu đúng thứ 100/500/1.000; bẫy thuần phục thứ 1/10/50; câu "nhớ sau trễ" đầu tiên; đủ 7 bẫy một đảo; tuần học đều thứ 4; mỗi lần tiến hoá; quay lại sau nghỉ; ngày sinh em (nếu em cho) | 1–2 câu thoại riêng, có nhắc lỗi cụ thể em đã sửa | Không thoại doạ, không thoại buồn |
| BN-05 | **Thời tiết đảo** (nắng, mưa, sương) — chỉ hình | Đổi theo ngày | Không | Không đổi số trận |

| Mã | Yêu cầu kiểm |
|---|---|
| BN-06 | Tần suất thực đo được khớp tần suất công khai ±1 điểm % sau 10.000 lượt giả lập. |
| BN-07 | Không bất ngờ nào xuất hiện ngoài kế hoạch chính (không ở chặng phụ, Tu luyện, Thi thử). |
| BN-08 | Không đếm ngược, không "chỉ hôm nay", không thưởng gấp nếu đăng nhập liền (K7). |

### 4.11 Bi-a phản ứng (BA)

| Mã | Yêu cầu |
|---|---|
| BA-01 | Giữ nguyên luật `src/game/bi-a/luat.ts` (đấu đơn/đôi, điểm 10/20/30, bi chốt +50, máy đúng 85/75/60%, Mắt thần 3 lần, hạn mềm 90/180 s). |
| BA-02 | Cửa Bi-a trên Sảnh mở **sau khi xong kế hoạch ngày** hoặc khi có bạn mời bằng mã. |
| BA-03 | Câu Bi-a lấy từ câu ôn của em **trong phạm vi tick**; trần câu/ngày như hiện tại. Bi-a online với bạn: câu thuộc **giao** phạm vi hai em; giao < 20 câu thì chỉ đấu máy. |

### 4.12 Xã hội cho em tự học (XH) — sửa điểm yếu 5

| Mã | Yêu cầu |
|---|---|
| XH-01 | **Đội ghép ngẫu nhiên** (Hộ Tống): ghép 2–4 em **cùng khối lớp** đang chờ; tên hiện là **biệt danh tự sinh** (ví dụ "Thuỷ Long 47"), không ảnh thật, không lớp, không trường. Bật/tắt theo CH-05. |
| XH-02 | Nói chuyện **chỉ bằng câu mẫu** (≈ 12 câu: "Tớ nhận ý a!", "Tớ chắn nhé", "Cảm ơn!", "Câu này khó quá", "Nhiều quái rồi, chắn đi", "Làm tốt lắm!"…). **Không có ô chat tự do**, không gửi ảnh, không kết bạn với người lạ. |
| XH-03 | Có nút **Báo cáo / Chặn** mỗi bạn đồng đội; bị chặn thì không bao giờ ghép lại. |
| XH-04 | Câu trùm của đội lấy trong **giao phạm vi tick** của mọi thành viên; giao rỗng ⇒ mỗi em nhận ý từ câu riêng của mình (giữ `chiaY` theo em). |
| XH-05 | **Mời bạn bằng mã** 6 ký tự (hết hạn sau 24 giờ): lập đội Hộ Tống, Song đấu, Bi-a đôi. Bạn qua mã được lưu vào "Bạn học" (cả hai đồng ý). Với "Bạn học": vẫn chỉ câu mẫu. |
| XH-06 | **Song đấu bẫy**: 2 em qua mã mời; cùng 5 câu, cùng thứ tự, thuộc dạng **cả hai đã gặp** và giao phạm vi; làm song song; kết quả chỉ hai em thấy; màn kết chiếu "Hai bạn cùng dính Bẫy …" trước điểm; ≤ 3 trận/ngày; +5 vàng mỗi em. |
| XH-07 | **Đấu bóng ma**: em đấu với **lượt ghi lại** của chính mình (tuần trước) hoặc của một "Bạn học" (đã đồng ý chia sẻ) trên **cùng bộ câu**. Bóng ma chỉ lưu: thứ tự hành động, đúng/sai, thời điểm (không lưu phương án đã chọn). Bộ câu phải trong phạm vi tick của em; thiếu ⇒ chỉ đấu bóng ma của chính em. Kết quả chỉ em thấy. |
| XH-08 | **Mục tiêu chung** của nhóm ghép (đội tuần) hoặc của lớp thầy: thanh tiến độ chung, không tên từng em. |
| XH-09 | Không bảng xếp hạng công khai; không so điểm với người lạ (K5). |
| XH-10 | Câu được bạn tiếp sức không tính bằng chứng học (`tuLam = false`). |

**Nghiệm thu:** 0 đường gửi chữ tự do giữa hai tài khoản (kiểm API); thời gian ghép đội trung vị ≤ 60 giây giờ cao điểm (19:00–21:30) *(cbst)*; quá 90 giây thì mời chơi cùng "đồng đội máy" (bóng ma).

### 4.13 Sổ tay bẫy (ST)

| Mã | Yêu cầu |
|---|---|
| ST-01 | 4 trạng thái: Ẩn (bóng đen + tên đảo) · Đã gặp · Đã thuần phục · Thành thạo (đúng ở lần ôn cách ≥ 7 ngày, không gợi ý; viền vàng, +3 Mảnh Linh). |
| ST-02 | Câu thần chú: em tự viết 15–100 ký tự; máy chặn dán y nguyên lời giải (so trùng ≥ 80% ký tự); có 3 mẫu gợi ý. |
| ST-03 | Đủ bẫy một đảo ⇒ "Trang Nguyên Tố Thư" sáng: hồi truyện nhỏ + đồ trang trí đảo. |
| ST-04 | Có trang "Quái hiếm" (BN-01) và "Sổ luật" (21 luật đảo + tần suất bất ngờ). |
| ST-05 | Câu sai trong Tu luyện mở bẫy ở "Đã gặp" nhưng không cho vàng. |

### 4.14 Thần thú và Vườn Linh (TT)

| Mã | Yêu cầu |
|---|---|
| TT-01 | Giữ 8 thần thú, ảnh và tên ở `BATTLE_SKINS` (`learning-battle.ts`), tên bậc ở `evolution.ts`. |
| TT-02 | Tiến hoá = cấp **và** chứng cứ năng lực (GDD 6.7): Thức tỉnh cấp 10 + 3 bẫy; Trưởng thành cấp 30 + 1 mạch L3 + 10 bẫy; Linh giáp cấp 50 + 25 câu nhớ sau trễ; Thăng hoa cấp 70 + 3 mạch L3 + 1 Thi thử ≥ 6,0; Thần hộ mệnh cấp 100 + 5 mạch L3 + 60 bẫy thành thạo *(cbst)*. Chỉ tính mạch có bài đã tick. |
| TT-03 | Bậc **không bao giờ giảm**. Thiếu chứng cứ thì hiện "Còn 2 bẫy nữa để Thức tỉnh". |
| TT-04 | Thần thú nói **một câu sau mỗi buổi**, nhắc lỗi cụ thể em vừa sửa. |
| TT-05 | Thần thú không cho chỉ số trận (TR-16). |
| TT-06 | **Vườn Linh** (NÊN, giai đoạn 3): lưới 8 × 6, 2D nghiêng bằng CSS, ngày/đêm theo giờ máy, công trình "xong qua đêm", thăm vườn "Bạn học" và để lại lá chúc bằng mẫu câu. Mọi đồ chỉ mua bằng vàng kiếm từ học. Vườn không héo. |

### 4.15 Kinh tế: 4 tiền tệ (KT)

| Mã | Tiền tệ | Nguồn | Đích | Trần / quy tắc |
|---|---|---|---|---|
| KT-01 | **EXP** | Câu kế hoạch đúng, tự làm (giữ `exp-*.ts`); câu chặng phụ như kế hoạch | Cấp thần thú | Không từ Tu luyện, không từ câu được tiếp sức; giữ trần ngày hiện có |
| KT-02 | **Vàng** | Rương 20/ngày; sao ải 1/sao; Tinh anh +5; Song đấu +5 (≤ 3/ngày); chặng phụ +2/ải; quái hiếm +10; Câu vàng +10; Thử thách tuần +50; Trang Nguyên Tố Thư +100/đảo | Phụ kiện thần thú, đồ vườn, Phòng thí nghiệm, Kho kỷ niệm | **Trần 60/ngày** cho mọi nguồn trận (sao, Tinh anh, Song đấu, chặng phụ, quái hiếm, Câu vàng). Rương, Thử thách tuần, Trang Nguyên Tố Thư ngoài trần |
| KT-03 | **Mảnh Linh** | Thuần phục bẫy +1; thành thạo +3 | Kiểu dáng chiêu, khung thẻ, trang trí Sổ tay | Không đổi ra vàng; không trần |
| KT-04 | **Ánh sao mùa** | Câu kế hoạch đúng +1 (≤ 20/ngày); Thử thách tuần +30; Thi thử +20 | Hành trình mùa 30 bậc × 40 = 1.200 | Hết mùa về 0; đồ đã nhận giữ mãi |

| Mã | Yêu cầu |
|---|---|
| KT-05 | Giá *(cbst)*: đồ vườn nhỏ 30–80, vừa 120–250, lớn 400–800; phụ kiện 60–300; Phòng thí nghiệm 150/300/600/1.000; đồ mùa cũ 1,5 × giá gốc. |
| KT-06 | Nhịp dự kiến: em học 5 ngày/tuần ≈ 175–225 vàng/tuần + 50 ⇒ ≈ 1 đồ vừa/tuần; Hành trình mùa xong ≈ tuần 11–12 (học 3 ngày/tuần ≈ tuần 16). |
| KT-07 | Không giao dịch giữa các em, không tặng, không chợ. Giá cố định, công khai, không giảm giá chớp nhoáng. |
| KT-08 | Theo dõi tuần: nếu 25% em có > 2.000 vàng thì thêm đích mới, **không** giảm nguồn đã hứa. |
| KT-09 | **Không có tiền tệ nào mua được bằng tiền thật.** Gói trả phí không cộng vàng, EXP, ánh sao, Mảnh Linh (BH-05). |

### 4.16 Thành tích, mốc, mùa (TM)

| Mã | Yêu cầu |
|---|---|
| TM-01 | Thành tích gắn hành vi học (GDD 6.8): Người gọi tên bẫy I/II/III (10/40/100); Trí nhớ dài (20 câu đúng ở lần ôn ≥ 14 ngày); Tự sửa (10 câu sai → đúng không gợi ý); Nhà thám hiểm; Đồng đội; Đều đặn (8 chuỗi tuần, không cần liên tiếp); Người kể chuyện; Kiến trúc sư. |
| TM-02 | **Không có:** chuỗi 100 ngày liên tiếp, học sau 23 giờ, top 1. |
| TM-03 | Mùa = học kỳ: Thu (09–01), Xuân (02–05), Hè Ôn Thi (06). Mỗi mùa: Hành trình mùa 30 bậc, 1 hồi truyện, 1 bộ đồ. Đồ mùa cũ vào Kho kỷ niệm, mua lại được. |
| TM-04 | Mốc thi em tự nhập; lịch đếm ngược hiện nhẹ, không màu đỏ, không còi. |

### 4.17 Thi thử cấu trúc 2025 trong phạm vi đã học (TH)

| Mã | Yêu cầu |
|---|---|
| TH-01 | Cấu trúc đầy đủ: **Phần I 18 câu × 0,25 = 4,5; Phần II 4 câu × 4 ý = 4,0; Phần III 6 câu × 0,25 = 1,5; 50 phút.** |
| TH-02 | **Chỉ rút câu trong phạm vi tick** (PV-04), không tự luận, không lặp câu em đã làm trong 30 ngày. Đầu đề ghi "Đề thử phạm vi: <danh sách chương>". |
| TH-03 | Ma trận cấu hình được; mặc định tạm (CH-10). Với phạm vi hẹp: giữ đủ 28 câu nếu đủ kho; nếu một phần thiếu câu thì dùng **đề rút gọn cùng tỉ lệ** (ví dụ 9/2/3, 25 phút) và ghi rõ. Phạm vi < 2 chương ⇒ chỉ có đề rút gọn. |
| TH-04 | Đồng hồ 50 phút thật — **ngoại lệ duy nhất** của K3, em tự chọn vào, màn trước ghi "Đây là mô phỏng phòng thi". Nộp xong mới có đáp án. |
| TH-05 | Chấm Phần II: đúng 1 ý 0,1; 2 ý 0,25 (CH-11); 3 ý 0,5; 4 ý 1,0. |
| TH-06 | Kết quả: điểm thang 10, theo phần, theo mạch; danh sách bẫy dính (bấm là phục thù); so với **bài thi thử trước của chính em**. Điểm dự báo chỉ trên phạm vi đã học. |
| TH-07 | Nhịp: Thi thử tuần (T7, CN, tuỳ chọn); Thi thử mùa đánh Mê Vụ Vương (mỗi 0,5 điểm hạ 1 đoạn máu; ≥ 5,0 là phong ấn). Thi thử đủ chương trình chỉ mở khi đã tick hết lớp 10–12. |
| TH-08 | Dùng lại `LuyenDeCauTruc.tsx` và in bằng `html-phieu.ts`. Bản miễn phí không có Thi thử tuần (CH-03). |

**Nghiệm thu:** 1.000 đề sinh giả lập với phạm vi ngẫu nhiên: 0 câu ngoài phạm vi, 0 câu tự luận, tổng điểm tối đa đúng 10 (đề rút gọn quy về thang 10 và ghi rõ).

### 4.18 Tu luyện và Chế độ gọn (TL)

| Mã | Yêu cầu |
|---|---|
| TL-01 | Giữ 4 chế độ (`src/lib/tu-luyen.ts`): Sửa câu sai, Dạng câu sai, Dạng bài, Tự do. **Không EXP, không vàng.** Câu trong phạm vi tick (chế độ Tự do là kênh em tự chọn; vẫn mặc định theo tick, có công tắc "mở cả bài chưa học"). |
| TL-02 | **Chế độ gọn:** công tắc trong Cài đặt; bỏ cảnh trận và hoạt ảnh, còn thẻ câu, lời giải, lịch ôn, Sổ tay dạng danh sách, bản đồ năng lực. Dữ liệu học giống hệt. Gói trả phí không đổi gì ở đây. |

### 4.19 Lời giải từng bước và đường tự sửa (LG)

| Mã | Yêu cầu |
|---|---|
| LG-01 | Lời giải chỉ hiện **sau khi nộp** câu đó. Dùng khối LỜI GIẢI chuẩn (`TheCau` chế độ `xem_lai`) hoặc khung từng bước `KhungLoiGiai.tsx` (iframe sandbox, không mạng). |
| LG-02 | Chỉ hiện lời giải **đã qua bộ kiểm** của dây chuyền Lời giải A (hồ sơ sạch). Câu còn cờ đáp án **không** rút cho em (KD-07). |
| LG-03 | Bỏ câu chữ "Thầy Đỗ Đại Học đang soạn lời giải…" trong `KhungLoiGiai.tsx` cho người dùng B2C; thay bằng "Lời giải ngắn" (câu chưa có hồ sơ từng bước vẫn có lời giải chữ đã kiểm). |
| LG-04 | **Đường tự sửa** (thay "Cần thầy dạy lại" và nút "Hỏi thầy" cho em B2C): mở khi `catTia` hoặc BY-06. Gồm 3 bước: (1) **bài mẫu** có lời giải từng bước của cùng dạng/bẫy; (2) **1 câu tương tự có gợi ý** (`goiY.cotLoi`); (3) **1 câu kiểm tra không gợi ý**. Đúng bước 3 ⇒ ghi mốc dạy lại (NL-04). Sai ⇒ lặp lại bước 1–3 với câu khác **ngày hôm sau**. |
| LG-05 | Câu tương tự và câu kiểm tra phải trong phạm vi tick và cùng mã dạng/bẫy; không có ⇒ đường tự sửa chỉ gồm bài mẫu + hẹn ôn. |
| LG-06 | Em trong lớp của thầy: vẫn có nút "Hỏi thầy" như hiện tại. |
| LG-07 | Nút **"Báo câu có vấn đề"** sau khi nộp (đề sai, đáp án nghi sai, lời giải khó hiểu): vào hàng duyệt của thầy (KD-10). ≥ 3 báo cáo độc lập ⇒ câu tự tạm ngưng phát. |
| LG-08 | *(Chờ CH-06)* **Gia sư AI "Hỏi Linh"**: chỉ mở sau khi nộp; đầu vào chỉ gồm đề, đáp án, lời giải **đã kiểm** của đúng câu đó, và câu em hỏi. |
| LG-09 | Hỏi Linh **không** được: giải câu khác, đưa đáp án câu chưa nộp, trả lời ngoài Hoá. Câu trả lời phải trích bước trong lời giải đã kiểm; không trích được thì nói "Câu này Linh chưa giải thích thêm được, em xem lại bước …". |
| LG-10 | ≤ 10 lượt/ngày/em *(cbst)*; lưu toàn bộ hội thoại để kiểm; thầy xem mẫu ngẫu nhiên hằng tuần. |
| LG-11 | Cổng bật: thầy duyệt 50 hội thoại mẫu, 0 lỗi kiến thức. |

**Nghiệm thu:** MT-01 ở câu đã qua đường tự sửa ≥ MT-01 trung bình *(gt)*.

### 4.20 Thông báo và giữ chân lành mạnh (GC)

| Mã | Yêu cầu |
|---|---|
| GC-01 | Màn **"Hôm nay xong rồi"**: 1 dòng việc đã làm (cụ thể: "Em đã thuần phục 1 bẫy, ôn 3 câu đến hạn"), 1 dòng hẹn mai; nút chính **"Nghỉ thôi"**; chặng phụ là nút phụ. Không tự chạy chuyến tiếp. |
| GC-02 | Thông báo trình duyệt (PWA; iPhone cần "Thêm vào màn hình chính", iOS 16.4+): **≤ 1 lần/ngày** vào giờ em chọn (mặc định 19:30); không gửi nếu hôm đó đã học; nội dung cụ thể ("Hôm nay có 2 câu hẹn ôn: Bẫy Fe hoá trị III"). 3 lần liên tiếp không mở ⇒ còn 1 lần/tuần. |
| GC-03 | Giờ yên tĩnh mặc định 21:30–06:30 và giờ học trên lớp (07:00–11:30, 13:30–17:00, T2–T6); em chỉnh được. |
| GC-04 | Cấm: câu doạ, emoji khóc, "thần thú buồn", "bạn đã bỏ lỡ…", "chỉ còn 2 giờ!". Kiểm bằng danh sách cụm từ cấm trong test. |
| GC-05 | **Chuỗi tuần**: tuần có ≥ 4 ngày làm ≥ 1 câu là giữ chuỗi; 2 "tuần nghỉ" mỗi học kỳ tự bật, không mua (CH-07). |
| GC-06 | Sự kiện tuần (Đêm Hộ Tống T6 20:00–21:30, Thử thách tuần, Thi thử tuần) đều tuỳ chọn; đồ thưởng nhận lại được tuần sau. |
| GC-07 | **Quay lại sau ≥ 5 ngày nghỉ**: thần thú mừng, không nhắc số ngày vắng; gói hồi phục 3 ngày (ngày 1 ≤ 8 câu chỉ ôn; ngày 2 ≈ 60% N; ngày 3 ≈ 80% N); nợ dồn trải theo `soNgayTraNo`; vườn không héo. |
| GC-08 | Sau 60 phút học trong ngày: nhắc "Nghỉ mắt nhé"; Bi-a và Song đấu có trần trận/ngày (CH-16). |
| GC-09 | Email cho **phụ huynh**, không cho em: báo cáo tuần, hết hạn gói. Không email tiếp thị cho em. |

### 4.21 Báo cáo phụ huynh (PH)

| Mã | Yêu cầu |
|---|---|
| PH-01 | Phụ huynh liên kết với em bằng email lúc em đăng ký (< 16 tuổi bắt buộc) hoặc mã liên kết 8 ký tự em đưa. Một phụ huynh nhiều con; một em tối đa 2 phụ huynh. |
| PH-02 | Báo cáo tuần (trang `/ph` dùng lại `ParentPortalScreen.tsx` + email, CH-12): số ngày học, số câu, phạm vi đã tick, bẫy đã thuần phục (tên), nhớ sau trễ (%), Thi thử (nếu có, ghi phạm vi), 1 câu nhận xét do máy viết theo mẫu (không giọng AI sáo rỗng). |
| PH-03 | **Không** xếp hạng con với em khác; **không** dùng màu đỏ báo động; con số nào cũng có nhãn. |
| PH-04 | Phụ huynh tắt/bật được: đội ghép ngẫu nhiên, Song đấu với bạn qua mã, giờ yên tĩnh. |
| PH-05 | Hồ sơ năng lực PDF theo tháng (in bằng `html-phieu.ts`). Chỉ gói trả phí. |
| PH-06 | Phụ huynh không xem được câu trả lời từng câu của con (tôn trọng con) — chỉ số tổng và bẫy. *(Thầy có thể bác mục này.)* |

---

## 5. Kho đề và dây chuyền nội dung (KD)

**Vai của thầy:** chỉ **tải đề** và **duyệt câu bị gắn cờ**. Phần còn lại máy làm.

### 5.1 Dây chuyền

| Bước | Mã | Ai | Việc | Đầu ra | Cờ khi nào |
|---|---|---|---|---|---|
| 1 | KD-01 | Thầy | Tải tệp đề (Word, PDF, ảnh) ở `/gv/kho/tai-len` | Tệp vào R2 | — |
| 2 | KD-02 | Máy | Tách câu, nhận dạng Phần I/II/III, hình, đáp án đi kèm | Câu nháp | Không đọc được hình/công thức |
| 3 | KD-03 | Máy | **Kiểm đáp án**: giải độc lập, so với đáp án tệp (phiên chốt của Lời giải A: `daChot` / `loiDe` / `dapAn`) | Trạng thái đáp án | Lệch đáp án |
| 4 | KD-04 | Máy | Gắn **bài KNTT** (danh sách), dạng, mức NB/TH/VD/VDC, mạch | Nhãn | Độ tin < ngưỡng *(cbst 0,8)* |
| 5 | KD-05 | Máy | Gắn **mã bẫy** cho phương án sai/ý/khoảng kết quả (từ phần "vì sao sai") | `cau_bay` | Bẫy mới chưa có trong bảng `bay` |
| 6 | KD-06 | Máy | Soạn **lời giải từng bước** (dây chuyền Lời giải A, `docs/loi-giai-a/`) + bộ kiểm | Hồ sơ lời giải | Bộ kiểm không đạt |
| 7 | KD-07 | Máy | **Phát hiện trùng**: chuẩn hoá chữ + số + đáp án; trùng gần ≥ 0,9 *(cbst)* | Liên kết bản gốc | Nghi trùng |
| 8 | KD-08 | Máy | Câu không gắn được bài KNTT | Giữ ngoài kho phát | Luôn cờ |
| 9 | KD-09 | Máy | Câu sạch (không cờ) **tự duyệt** và phát từ hôm sau (giữ luật 29/09 "máy duyệt luôn") | `da_duyet = 1` | — |
| 10 | KD-10 | Thầy | Duyệt hàng câu gắn cờ (KD-02…08) và báo cáo của em (LG-07): Giữ / Sửa / Bỏ | Quyết định | — |

| Mã | Yêu cầu |
|---|---|
| KD-11 | Mục tiêu: thầy mất ≤ 10 phút cho mỗi 100 câu tải lên (đo thật ở giai đoạn 1) *(cbst)*. |
| KD-12 | Mỗi câu có trường `nguon` và `quyen` (tự soạn / có phép / nguồn ngoài). Câu `nguon_ngoai` không phát cho em B2C (CH-09). |
| KD-13 | Không xoá câu đã có lần làm; chỉ ẩn (giữ lịch sử SRS). |
| KD-14 | Đáp án **không** xuống máy em trước khi nộp (giữ luật repo; kiểm API). |

### 5.2 Trường dữ liệu mỗi câu

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `qid` | chữ | ✓ | Giữ mã cũ (`12-C1-B1-D1…`, `DB-`, `DH-`) |
| `phan` | I / II / III / TL | ✓ | TL = tự luận, không vào kênh tự động |
| `de` | HTML an toàn | ✓ | Có hình (R2, webp) |
| `phuong_an` / `y` | JSON | ✓ (I, II) | |
| `dap_an` | chữ | ✓ | Chỉ ở máy chủ |
| `bai_kntt` | danh sách mã bài | ✓ | `L12-C2-B5`; câu tổng hợp nhiều bài |
| `yeu_cau_can_dat` | danh sách | — | Để sau đổi sách không gắn lại |
| `dang` | mã dạng | ✓ | Dùng cho hạng L1–L4 |
| `mach` | 1 trong 8 | ✓ | Suy từ dạng |
| `muc` | NB / TH / VD / VDC | ✓ | |
| `sao` | 0–3 | — | Giữ `sao` hiện có (≥ 2 sao: duy trì 14 ngày) |
| `bay` | danh sách (phương án → mã bẫy) | — | Bảng `cau_bay` |
| `loi_giai` | hồ sơ từng bước + chữ | ✓ trước khi phát | Đã qua bộ kiểm |
| `trang_thai_dap_an` | `sach` / `daChot` / `loiDe` / `dapAn` | ✓ | `dapAn` ⇒ không phát |
| `trung_voi` | qid | — | |
| `nguon`, `quyen` | chữ | ✓ | KD-12 |
| `da_duyet` | 0 / 1 | ✓ | |
| `tam_ngung` | 0 / 1 | ✓ | LG-07 |
| `phien_ban` | số | ✓ | Tăng khi sửa đề; lần làm cũ giữ phiên bản cũ |

---

## 6. Thương mại (BH)

### 6.1 Nguyên tắc

| Mã | Yêu cầu |
|---|---|
| BH-01 | Bán **gói truy cập** cho em qua tài khoản **phụ huynh** (CH-01). Em không thấy nút mua, giá, hay quảng cáo gói ở bất kỳ màn nào của app học sinh. |
| BH-05 | **Quyền lợi trả phí không chạm game:** gói trả phí và bản miễn phí có **cùng** số trận, cùng thần thú, cùng trần vàng/EXP, cùng bất ngờ. Trả phí chỉ đổi **khối lượng học và dịch vụ** (BH-04). |
| BH-11 | **Không bán:** đáp án, EXP, vàng, ánh sao, Mảnh Linh, thần thú, phụ kiện, lượt chơi, hồi sinh, rương, bùa, chỗ đứng xếp hạng, dữ liệu học sinh. Không quảng cáo. |

### 6.2 Gói và giá (ước lượng, chưa khảo sát)

Không có số liệu thị trường đã kiểm trong repo. Các mức dưới đây là **mức thử** để đo phản ứng, không phải giá chốt.

| Mã | Gói | Gồm | Giá thử *(cks)* |
|---|---|---|---|
| BH-02a | Dùng thử | Đủ mọi thứ, 14 ngày, không cần thẻ/chuyển khoản | 0đ |
| BH-02b | Miễn phí (sau dùng thử) | Kế hoạch ≤ 10 câu/ngày, đủ game, Sổ tay, đường tự sửa | 0đ |
| BH-02c | Tháng | Kế hoạch đủ theo mục tiêu, Thi thử tuần, báo cáo phụ huynh, hồ sơ PDF | Mức A / Mức B (2 mức để thử, CH-02) |
| BH-02d | Năm học (đến 31/05) | Như Tháng | ≈ 8 × giá Tháng *(gt)* |
| BH-02e | Mùa thi lớp 12 (đến hết kỳ thi tốt nghiệp) | Như Tháng + Thi thử mùa | Chốt sau |

| Mã | Yêu cầu |
|---|---|
| BH-03 | Dùng thử bắt đầu khi tài khoản được lưu (HT-06), không cần phương thức thanh toán. |
| BH-04 | Khác biệt trả phí/miễn phí chỉ nằm ở: số câu kế hoạch/ngày, Thi thử tuần, báo cáo phụ huynh, hồ sơ PDF, (sau này) Hỏi Linh. |
| BH-12 | Trang giá đo tỉ lệ bấm theo từng mức (thử A/B giá trên trang phụ huynh) trước khi chốt CH-02. |

### 6.3 Thanh toán web

| Mã | Yêu cầu |
|---|---|
| BH-06 | Kênh: **VietQR** (chuyển khoản, nội dung chứa mã đơn; đối soát tự động qua dịch vụ đọc biến động số dư của ngân hàng — chọn nhà cung cấp sau *(cks)*), **MoMo**, **VNPay** (cần hồ sơ doanh nghiệp, CH-15). |
| BH-07 | Gói **trả trước**, **không tự gia hạn** (tránh trừ tiền ngoài ý muốn). Nhắc gia hạn qua email phụ huynh 7 ngày và 1 ngày trước hạn — giọng thông tin, không doạ. |
| BH-08 | Đơn quá 30 phút chưa nhận tiền ⇒ huỷ; nhận tiền sau đó ⇒ máy tự kích hoạt nếu khớp mã đơn, không khớp ⇒ vào hàng đối soát thủ công. |
| BH-09 | Hoàn tiền trong 7 ngày đầu của gói (CH-17); xuất **hoá đơn điện tử** cho mỗi giao dịch *(cks)*. |
| BH-10 | Tên miền riêng, trang giới thiệu, chính sách bảo mật, điều khoản, chính sách hoàn tiền, thông tin pháp nhân ở chân trang. |
| BH-13 | Không lưu số thẻ; mọi dữ liệu thanh toán ở cổng. |

### 6.4 Kênh ra thị trường (giữ ĐX mục 7, chỉnh cho B2C)

Video ngắn "bẫy có tên" của thầy dẫn về trang dùng thử; học trò cũ và lớp của thầy là nhóm thử đầu; mời bạn bằng mã thưởng **đồ trang trí** (không tiền, không ngày miễn phí cho em). Không chạy quảng cáo trả tiền cho tới khi qua cổng giai đoạn 4.

---

## 7. Kỹ thuật (KY)

### 7.1 Kiến trúc dùng lại

| Lớp | Dùng | Ghi chú |
|---|---|---|
| Máy khách | React + Vite + TS + Tailwind v4 (`src/`), PWA | Tách gói theo màn |
| Máy chủ | Cloudflare Worker (`server/src/index.ts`, `game-v2*.ts`, `srs2-*.ts`, `ke-hoach-ngay.ts`, `su-kien-hoc.ts`) | Lệnh mới tiền tố `bl-` |
| Dữ liệu | D1 (`game_v2_question`, `su_kien_hoc`, `srs2_day_lai`, `chien_dich*` …) | **Migration chỉ thêm** |
| Tệp | R2 (ảnh đề, ảnh nhân vật webp, tệp đề tải lên, bản sao lưu) | |

### 7.2 Tài khoản và bảo mật

| Mã | Yêu cầu |
|---|---|
| KY-01 | Tài khoản em: email + mật khẩu, hoặc Google (CH-14). Tài khoản phụ huynh riêng. Em lớp thầy giữ đăng nhập `sbd` hiện có. |
| KY-02 | Mật khẩu **băm** bằng PBKDF2-SHA256 (Web Crypto trong Worker), muối riêng, ≥ 100.000 vòng *(cbst theo giới hạn CPU Worker)*. Không bao giờ lưu/ghi log mật khẩu thô. |
| KY-03 | Giới hạn đăng nhập sai: 5 lần/15 phút/tài khoản và theo IP; khoá mềm 15 phút. |
| KY-04 | Phiên: token ngẫu nhiên 256 bit, lưu băm ở D1, hết hạn 30 ngày, thu hồi được; cookie `HttpOnly; Secure; SameSite=Lax`. |
| KY-05 | **Repo GitHub chuyển riêng tư** trước khi có khách ngoài (thầy tự bấm; ĐX mục 5). Bí mật chỉ ở Cloudflare secrets. |
| KY-06 | Đáp án/lời giải chỉ trả về sau khi máy chủ ghi lần nộp; test API bảo đảm. |
| KY-07 | Quét chữ do em nhập (tên, câu thần chú) bằng bộ lọc từ cấm (`pet-name.ts` mở rộng). |

### 7.3 Tách dữ liệu

| Mã | Yêu cầu |
|---|---|
| KY-10 | Mỗi tài khoản có `vung` (`tu_do` cho B2C; `trung_tam_<mã>` cho lớp thầy). Mọi truy vấn dữ liệu em lọc theo `vung` + mã em. Thầy chỉ thấy em `trung_tam` của mình; em B2C chỉ thầy ở vai chủ sản phẩm thấy **số tổng ẩn danh**. |
| KY-11 | Ghép đội/Song đấu chỉ trao đổi biệt danh + trạng thái trận; không trao đổi email, lớp, trường. |
| KY-12 | Xoá tài khoản: em/phụ huynh tự bấm; dữ liệu định danh xoá trong 30 ngày; dữ liệu học ẩn danh hoá để giữ số đo. |

### 7.4 Hiệu năng máy yếu

**Máy mẫu kiểm:** Android tầm thấp (≈ 2–3 GB RAM), Chrome; iPhone đời cũ còn iOS 16.4+; laptop cũ. Mạng "4G chậm" giả lập của Chrome.

| Mã | Ngân sách *(cbst)* |
|---|---|
| KY-20 | Lần đầu tới câu Hoá đầu tiên ≤ 45 giây (HT-17); tải lần đầu (JS + CSS + ảnh màn đầu) ≤ 800 KB nén. |
| KY-21 | JS màn trận ≤ 150 KB nén, nạp lười. |
| KY-22 | Ảnh **webp**: nhân vật 100–200 KB, nền 200–400 KB; chỉ tải khi vào màn; bộ `combat/*.png` chuyển webp (dùng `anh-webp.ts`, `anh-san-sang.ts`). |
| KY-23 | Hoạt ảnh chỉ `transform`/`opacity`; ≤ 12 hạt cùng lúc; mục tiêu 60 khung/giây, sàn 30. |
| KY-24 | Tự hạ chất lượng: thời gian khung trung bình > 24 ms trong 3 giây đầu ⇒ chế độ nhẹ (tắt hạt, `CanhDao3D` → 2D tĩnh). Tôn trọng `prefers-reduced-motion`. |
| KY-25 | Chờ chấm: hoạt ảnh 300 ms; > 3 giây hiện "Đang chấm…" + nút thử lại; mất mạng giữa câu ⇒ lưu câu trả lời, gửi lại khi có mạng (không mất lượt). |
| KY-26 | Bộ đo tự động (Lighthouse/đo khung) chạy trước mỗi lần phát hành; vượt ngân sách ⇒ không phát hành. |
| KY-27 | Ảnh máy vẽ: một bảng phong cách chung; lưu câu lệnh + ngày tạo mỗi ảnh (CH-26). |

### 7.5 Đo hành vi và sao lưu

| Mã | Yêu cầu |
|---|---|
| KY-30 | Bảng chỉ thêm `su_kien_game(ma_em, luc, loai, du_lieu_json)`: mở màn, chọn hành động, Chắc!, ngã rẽ, bùa, bất ngờ, chặng phụ, thoát giữa chừng, thông báo được mở. Không ghi chữ tự do. |
| KY-31 | Bảng số đo MT-01…MT-12 tính hằng đêm, xem ở `/gv/so-do`. |
| KY-32 | Cờ thử nghiệm theo em (ngẫu nhiên trong em cho Chắc!, phục thù; ABAB theo tuần cho tính năng cấp lớp). |
| KY-33 | Sao lưu D1 **hằng ngày** sang R2, giữ 30 bản; **thử khôi phục** mỗi tháng vào D1 riêng. Dùng thêm khôi phục theo thời điểm của D1 nếu gói cho phép *(cks)*. |
| KY-34 | Ghi lỗi máy khách (không chứa dữ liệu định danh). |
| KY-35 | Phát hành Worker từ worktree sạch, đúng luật repo (CLAUDE.md). |

---

## 8. Pháp lý (PL) — **cần luật sư xác nhận toàn bộ mục này**

| Mã | Văn bản / vấn đề | Việc đề xuất | Câu cần hỏi luật sư |
|---|---|---|---|
| PL-01 | **NĐ 13/2023/NĐ-CP** bảo vệ dữ liệu cá nhân; **Luật Bảo vệ dữ liệu cá nhân 2025** (theo hiểu biết: hiệu lực 01/01/2026 — *cần kiểm*) | Em < 16: phụ huynh đồng ý trước khi lưu dữ liệu định danh (HT-06); chính sách quyền riêng tư; thu tối thiểu (không lấy trường, ảnh, SĐT em); quyền xem/xoá dữ liệu | Văn bản nào đang hiệu lực? Có phải lập hồ sơ đánh giá tác động xử lý dữ liệu không? Cách lấy đồng ý hợp lệ qua email? |
| PL-02 | Dữ liệu trẻ em (tuổi 15–17) | Không chia sẻ cho bên thứ ba ngoài nhà cung cấp hạ tầng/thanh toán; không quảng cáo | Lưu trên hạ tầng Cloudflare ở nước ngoài có cần thủ tục chuyển dữ liệu ra nước ngoài không? |
| PL-03 | **NĐ 147/2024/NĐ-CP** (dịch vụ Internet, thông tin trên mạng, trò chơi điện tử trên mạng) | Trước khi có trả lời: tắt ghép người lạ (CH-05), không xếp hạng công khai, nhắc nghỉ 60 phút | App học có yếu tố game có bị coi là "trò chơi điện tử trên mạng" phải cấp phép không? Có quy định giới hạn giờ chơi với người dưới 18 không? Chat câu mẫu có được coi là "mạng xã hội" không? |
| PL-04 | **Bản quyền kho đề** | Gắn `nguon/quyen` từng câu (KD-12); chỉ bán câu tự soạn/có phép; trích SGK chỉ ở mức mục lục (tên bài) | Dùng tên bài, thứ tự bài SGK KNTT trong app có cần xin phép NXB không? Câu "phỏng theo" đề thi của Bộ có được dùng không? |
| PL-05 | **Thương mại điện tử**: thông báo website TMĐT bán hàng với Bộ Công Thương (theo NĐ 52/2013 và sửa đổi NĐ 85/2021 — *cần kiểm văn bản mới*) | Lập pháp nhân (CH-15); thông báo website trước khi nhận tiền; hoá đơn điện tử | Hộ kinh doanh có đủ để nhận thanh toán qua cổng không? Nghĩa vụ thuế dịch vụ số? |
| PL-06 | Ảnh máy vẽ | Lưu nguồn gốc ảnh (KY-27); không vẽ giống nhân vật/logo game khác | Quyền sử dụng thương mại ảnh tạo bằng ChatGPT theo điều khoản hiện hành? |
| PL-07 | Bảo vệ người tiêu dùng | Điều khoản rõ, hoàn tiền (BH-09), không tự gia hạn | Hợp đồng với người chưa thành niên do phụ huynh ký thay — mẫu điều khoản? |

---

## 9. Tái dùng / sửa / làm mới so với app hiện tại

T ≤ 1 ngày · V 2–4 ngày · C > 1 tuần hoặc cần nhãn/dữ liệu mới.

| Hệ thống | Tệp hiện có (`origin/main`) | Giữ / Sửa / Mới | Việc | Công sức |
|---|---|---|---|---|
| SRS theo câu, hạng dạng | `server/src/srs2-loi.ts`, `srs2-d1.ts`, `srs2-game.ts` | Giữ | Thêm lọc phạm vi (PV-04) ở chỗ đọc câu | V |
| Kế hoạch ngày | `server/src/ke-hoach-ngay.ts`, `lapKeHoachNgay` | Sửa | Chiến dịch tự động (NL-07); cặp dễ nhầm; độ khó động | V |
| Mục lục KNTT + gắn bài | — (mã đề `12-C1-B1-…` đã theo bài) | Mới | Bảng `muc_luc_kntt`, `cau_bai`; gắn cho toàn kho | C |
| Màn tick bài | — | Mới | Cây chương → bài, nút nhanh | V |
| Test đầu vào rải | `tinhHangTheoDang`, `ho-so-nam-kt.ts` | Mới | Kho 12 câu × 8 mạch; trận khám phá | V–C |
| 3 phút đầu, khách | `canChonThu`, `pet-name.ts`, `HopDoiTen.tsx` | Sửa | Chế độ khách, gộp vào tài khoản | V |
| Lõi trận hợp nhất + ý đồ | `src/game/than-thu-v2/doan-core.ts`, `learning-battle.ts` | Sửa | Tách `tran-core.ts`; bộ ý đồ; Đảo dùng lõi | V |
| Bộ giải đánh đổi | — | Mới | `tests/tran-danh-doi.test.ts` | V |
| Chắc! | — | Mới | Cờ ở `answer`, `chacMaSai` | T–V |
| 21 luật đảo | `dao2/dao2-core.ts`, `dao2/TrongAi.tsx` | Mới | 21 hàm luật + thẻ luật | C |
| Bẫy + phục thù | `KhungLoiGiai.tsx`, `CauDaLam.tsx` | Mới | Bảng `bay`, `cau_bay`; chèn trận | C |
| Ngã rẽ + bùa | `dao2/BanDo.tsx`, `goiY` | Sửa | `hoa2-chon-nhanh`; 6 + 21 bùa | V |
| Bất ngờ | — | Mới | Hạt ngẫu nhiên máy chủ, 4 loại | V |
| Chặng phụ | `hoa2-thu-suc-them` | Sửa | Vỏ 3 ải, trần, thưởng nhỏ | T–V |
| Bi-a | `src/game/bi-a/*` | Giữ | Lọc phạm vi; cửa sau kế hoạch | T |
| Hộ Tống + đội ngẫu nhiên | `DoanHoTong.tsx`, `doan-core.ts`, `game-v2-doan-*.ts` | Sửa | Phòng chờ ghép, câu mẫu, chặn/báo cáo | V–C |
| Song đấu, bóng ma | — | Mới | Phòng 2 em; ghi lượt | V–C |
| Sổ tay bẫy | `CauDaLam.tsx` | Mới | Màn sổ tay, thần chú, Sổ luật | V |
| Tiến hoá theo năng lực | `evolution.ts` | Sửa | Điều kiện chứng cứ | T–V |
| Vườn Linh | `phu-kien/*` | Mới | Lưới 8 × 6 | V–C |
| Kinh tế, trần | Rương `hoa2-ruong-mo`, `exp-*.ts` | Sửa | Trần vàng 60, ánh sao | T–V |
| Thành tích, mùa | — | Mới | Bảng thành tích, Hành trình mùa | V |
| Thi thử phạm vi | `tu-luyen/LuyenDeCauTruc.tsx`, `html-phieu.ts` | Sửa | Ma trận theo phạm vi, đề rút gọn, chấm Phần II | V |
| Tu luyện, Chế độ gọn | `src/lib/tu-luyen.ts`, `TheCau` | Giữ + mới | Công tắc gọn | T |
| Lời giải, đường tự sửa | `KhungLoiGiai.tsx`, `docs/loi-giai-a/` | Sửa | Đường 3 bước; ghi `srs2_day_lai` tự động; bỏ chữ "Thầy đang soạn" | V |
| Hỏi Linh (AI) | — | Mới (chờ CH-06) | Lệnh máy chủ gọi mô hình với lời giải đã kiểm | V–C |
| Thông báo PWA | — | Mới | Web Push + lịch + giờ yên tĩnh | V |
| Báo cáo phụ huynh | `ParentPortalScreen.tsx` | Sửa | Liên kết email, báo cáo tuần, email | V |
| Tài khoản, băm mật khẩu | `game-v2-auth.ts` | Sửa | Email/Google, PBKDF2, giới hạn sai | V |
| Thanh toán | — | Mới | Đơn, VietQR + đối soát, MoMo/VNPay | C |
| Dây chuyền kho đề | `docs/loi-giai-a/*`, `game-v2-bank.ts` | Sửa | Tải lên, tách câu, gắn nhãn, trùng, hàng duyệt | C |
| Tách vùng dữ liệu | — | Mới | Cột `vung` + lọc mọi truy vấn | V–C |
| Đo hành vi, số đo | `su-kien-hoc.ts` | Sửa | `su_kien_game`, bảng số đo | V |
| Sao lưu | — | Mới | Xuất D1 → R2 hằng ngày, thử khôi phục | T–V |
| Hiệu năng | `anh-webp.ts`, `anh-san-sang.ts` | Sửa | Chế độ nhẹ, webp `combat/` | T–V |

---

## 10. Lộ trình build theo giai đoạn

### 10.1 Các giai đoạn và cổng

| Giai đoạn | Thời gian *(ước lượng)* | Làm | Thử với | Cổng qua (ngưỡng **chốt sau khi có số gốc**) |
|---|---|---|---|---|
| **0. Nền an toàn** | 2 tuần | KY-02…KY-05, KY-33 (sao lưu), KY-30 (đo hành vi); mục lục KNTT + gắn bài (PV-01, PV-03) cho 2 chương lớp 12; số gốc 2 tuần ở lớp thầy | Lớp của thầy (dữ liệu sẵn) | Không còn lỗ bảo mật đã biết; có số gốc MT-01…MT-10; 100% câu 2 chương có bài KNTT |
| **1. Lõi chơi thử** | 4–6 tuần | Tick bài + PV-04 mọi kênh; 3 phút đầu; trận khám phá (DV); lõi trận + ý đồ + Chắc! (TR); bộ giải đánh đổi (TR-20…25); luật đảo 2 chương (Kim Loại, Điện Hoá); bẫy + phục thù 30–50 câu; Hôm nay xong rồi + chuỗi tuần; Chế độ gọn; chế độ nhẹ | **10–15 em** (học trò thầy + em ngoài tự đăng ký), 2 tuần | 0 lỗi chặn; TR-21…TR-24 xanh; ≥ 90% em qua 3 phút đầu ≤ 3 phút 30 giây; ≥ 80% xong ≥ 2 trận khám phá trong 7 ngày; buổi trung vị 12–20 phút; ≥ 65% thời gian giải câu; "vui" ≥ 3,5/5, "áp lực" không tăng; ≥ 30 lượt phục thù có số liệu |
| **2. Thử 2–3 lớp** | 8 tuần | Đủ luật đảo các chương đang học; ngã rẽ + bùa; bất ngờ (BN); chặng phụ (TS); đường tự sửa (LG-04); độ khó động; tiến hoá theo năng lực; Thi thử tuần phạm vi; thông báo PWA; gói hồi phục; mời bạn bằng mã, Song đấu, bóng ma | **2–3 lớp** thật; tính năng cấp lớp ABAB theo tuần; Chắc! và phục thù ngẫu nhiên trong em | So với số gốc: MT-01 tăng; MT-02 không giảm; MT-03 ≥ dự báo; MT-04 giảm ≥ 25% tương đối ở câu có phục thù; MT-05 ngày 7 không giảm; MT-06 đo được; MT-07 ≥ số gốc; áp lực không tăng |
| **3. Sẵn sàng bán** | 8–12 tuần | Tài khoản B2C + phụ huynh + đồng ý < 16; tách vùng; thanh toán; báo cáo phụ huynh; dây chuyền kho đề tự phục vụ; đủ 21 đảo (ưu tiên lớp 12); đội ngẫu nhiên (nếu luật sư cho); Vườn Linh; mùa; Hỏi Linh (nếu CH-06 = có); trang giá thử | 100–300 em tự đăng ký qua video của thầy, dùng thử 14 ngày | Chỉ số giai đoạn 2 giữ được ở em **ngoài** lớp thầy (không giảm quá 20% tương đối); MT-05 ngày 7 ≥ số gốc lớp thầy *(gt)*; 0 sự cố dữ liệu; pháp lý mục 8 đã có trả lời |
| **4. Bán** | Từ khi qua cổng 3 | Bật thanh toán thật; đo MT-11, MT-12 | Mọi người | Doanh thu một em trả phí > chi phí phục vụ em đó (máy chủ, AI, thanh toán) |

**Luật cổng:** không đạt cổng thì **không** chi tiền cho giai đoạn sau; quay lại phỏng vấn em/phụ huynh đã thử để sửa.

### 10.2 Kế hoạch thử chi tiết

| Đợt | Ai | Cách chọn | Đo gì | Thu thập cảm nhận |
|---|---|---|---|---|
| Thử 1 | 10–15 em, trộn 3 lớp 10/11/12 và 3 mức L1–L4; ≥ 5 em **không** phải học trò thầy | Tự nguyện, phụ huynh đồng ý | MT-01…MT-10; ghi màn hình 3 buổi đầu của 5 em (có đồng ý) | Phỏng vấn 10 phút cuối tuần 1 và 2; khảo sát 3 câu |
| Thử 2 | 2–3 lớp | ABAB theo tuần (Đ1, chuỗi tuần, ngã rẽ); ngẫu nhiên trong em (Chắc!, phục thù) | Như trên + so tuần bật/tắt; ghi lịch kiểm tra trên lớp để loại tuần nhiễu | Khảo sát tuần; 2 buổi nhóm nhỏ |

**Giới hạn:** cỡ mẫu nhỏ, có hiệu ứng mới lạ; mọi kết quả chỉ là tín hiệu để giữ/bỏ tính năng, không phải bằng chứng khoa học.

### 10.3 Thứ tự cắt khi thiếu thời gian

Giữ: PV, DV, TR (gồm Chắc! và kiểm đánh đổi), BY, GC-01/05, LG-04, Chế độ gọn, KY bảo mật. Lùi theo thứ tự: Vườn Linh → Hỏi Linh → đội ngẫu nhiên → đấu bóng ma → Hành trình mùa → luật đảo của chương chưa có người học → phát hiện kiểu người chơi.

---

## 11. Rủi ro và giả định

### 11.1 Rủi ro

| # | Rủi ro | Dấu hiệu sớm | Cách xử lý |
|---|---|---|---|
| R1 | Gắn bài KNTT/bẫy cho kho chậm | < 50% câu lớp 12 có bài sau giai đoạn 0 | Gắn trước câu dùng nhiều nhất; máy gợi ý, thầy chỉ duyệt cờ |
| R2 | Phạm vi tick hẹp ⇒ thiếu câu (đầu năm lớp 10) | Kế hoạch < 6 câu/ngày | PV-12; ưu tiên soạn thêm câu bài đầu mỗi lớp |
| R3 | Lớp game thành vỏ bọc | TR-21…25 đỏ; > 70% lượt cùng một hành động | Đổi bộ ý đồ/số, không phát hành khi cổng đỏ |
| R4 | Em lạm dụng Chắc! | Đúng khi Chắc! − đúng chung không tăng qua tuần | Giảm còn 2/chuyến; thêm câu "Em chắc đến đâu?" |
| R5 | Luật đảo khó hiểu, làm loãng việc học | % thời gian giải câu < 65%; em bấm "Luật gì?" nhiều | Rút luật về 1 câu; tắt luật ở đảo đó |
| R6 | Em tự đăng ký không quay lại (không có thầy nhắc) | MT-05 ngày 7 thấp hơn lớp thầy rõ | Thông báo cụ thể, báo cáo phụ huynh, đội tuần |
| R7 | Phụ huynh không trả tiền cho "game" | MT-11 thấp | Báo cáo phụ huynh nói bằng số học (tự sửa lỗi, nhớ sau trễ); Chế độ gọn cho phụ huynh xem |
| R8 | Ghép người lạ có rủi ro an toàn | Báo cáo/chặn tăng | Chỉ câu mẫu; tắt cho < 16; luật sư |
| R9 | Hỏi Linh nói sai kiến thức | Lỗi trong mẫu thầy xem | Cổng LG-11; tắt ngay khi có lỗi |
| R10 | Chi phí AI/hạ tầng vượt doanh thu | Chi phí/em > doanh thu/em | Trần lượt Hỏi Linh; bộ nhớ đệm câu trả lời theo câu |
| R11 | Pháp lý chưa rõ (NĐ 147, dữ liệu trẻ em) | Chưa có ý kiến luật sư khi tới giai đoạn 3 | Không mở bán; không bật tính năng bị hỏi |
| R12 | Máy yếu giật | Thời gian khung > 24 ms ở > 20% phiên | Chế độ nhẹ mặc định cho máy đó |
| R13 | Hiệu ứng mới lạ phai | MT-08 tụt tuần 6–8 | Mùa, đảo mới, luật đảo mới; **không** tăng thưởng ngoài |

### 11.2 Giả định cần kiểm

| # | Giả định | Kiểm bằng |
|---|---|---|
| G1 | Dải vừa sức 70–85% hợp với câu Hoá nhiều bước | Số liệu giai đoạn 1–2 |
| G2 | Ý đồ địch + Chắc! làm em nghĩ kỹ hơn mà không giảm tỉ lệ đúng | H1, H2 của NC |
| G3 | Phục thù giảm lặp lỗi | H3 của NC (MT-04) |
| G4 | Em tick bài khá đúng với tiến độ trên lớp | So tick với lịch dạy của lớp thầy |
| G5 | Phụ huynh sẵn sàng trả cho app học Hoá dạng game | Trang giá thử (BH-12), phỏng vấn |
| G6 | Mục lục KNTT không đổi trong 2–3 năm tới | Theo dõi; trường `yeu_cau_can_dat` dự phòng |
| G7 | Cấu trúc đề 2025 giữ cho các năm sau | Theo dõi văn bản Bộ mỗi năm |
| G8 | Cloudflare D1 đủ cho vài chục nghìn em | Đo tải (`docs/do-tai-d1/` đã có cách đo) |

---

*Hết đặc tả. Thầy phản biện bằng mã (ví dụ "LD-15: bỏ chọn nhiệt độ") hoặc trả lời CH-01 … CH-27.*
