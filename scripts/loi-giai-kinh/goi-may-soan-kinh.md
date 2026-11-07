# Việc: soạn LỜI GIẢI KÍNH cho một lô câu Hoá (khuôn Kính bản 1, thầy Đỗ Đại Học chốt 02/11/2026)

Bạn soạn lời giải cho học sinh luyện thi đại học môn Hoá của thầy Đỗ Đại Học, chương trình 2018, SGK Hoá 10–11–12 **Kết nối tri thức**.
App vẽ lời giải bằng một khung cố định (kính, phim từng bước, cảnh mẫu, thẻ bẫy, thẻ nhớ). Bạn chỉ viết DỮ LIỆU JSON, mỗi câu MỘT tệp.
Chuẩn chất lượng = 3 bản mẫu thầy đã duyệt trong `vi-du-kinh.json`. Mỗi bản bạn viết phải bằng hoặc hơn chuẩn đó: đúng, đủ, dễ hiểu, đúng giọng thầy.

## Thư mục lô
- `vao/<tên>.json`: một câu. Có `qid`, `bam`, `phan` (`I` trắc nghiệm · `II` Đúng/Sai · `III` trả lời ngắn), `de` (đề HTML), `deTho`, `y` (phương án A–D hoặc ý a–d),
  `bang`, `hinh` (ảnh trong `vao/img/` — BẮT BUỘC mở bằng Read trước khi soạn câu đó), `dapAn` (ĐÁP ÁN CHÍNH THỨC của kho: Phần I/II mỗi id `"D"` = đúng/được chọn,
  `"S"` = sai/bị loại; Phần III `{ "kq": "<đáp số>" }`), `loiGiaiCo` (lời giải chữ cũ — chỉ để tham khảo, KHÔNG chép giọng cũ), `soDoDaDat` (nếu có: sơ đồ + phép tính
  đã qua máy kiểm số — dùng lại cho `soDo` / `buoc`, viết lại `nghia` cho dễ hiểu hơn nếu cần), `loiLanTruoc` (lý do lần trước bị trả — PHẢI sửa đúng chỗ đó).
- `vao/<tên>.muc.json`: các MỤC KIẾN THỨC của skill lý thuyết của thầy gần câu này nhất (mỗi mục: `bai`, `ten`, `buoc` = thứ tự thầy dẫn, `meo`, `nham` = hay nhầm,
  `noi` = câu thầy nói NGUYÊN VĂN). Đây là nguồn giọng thầy duy nhất.
- `muc-luc.txt`: MỤC LỤC TOÀN BỘ bài giảng của thầy (1 370 mục, mỗi dòng `mã · bài · tên mục`). `.muc.json` chỉ là 6 mục gần nhất theo chữ — HAY SÓT mục đúng dạng bài.
- `lay-muc.mjs`: `node lay-muc.mjs <tên tệp câu> <mã> [mã…]` chép đủ mục vào `vao/<tên>.muc.json` và in nội dung ra. Câu thầy nói / mẹo chỉ được dùng khi mục đã nằm trong tệp đó.
- `than-chu.json`: BẢNG THẦN CHÚ của thầy (soát tay). `chu` là chữ thần chú, `dung` là lúc dùng.
- `vi-du-kinh.json`: 3 bản mẫu. `tu-duy-day-hoa.md`: tư duy dạy bài tính của thầy (bắt buộc cho câu tính).
- `kiem.mjs`: bộ kiểm, ĐÚNG hàm máy chủ dùng khi nhận bản.

## TRA BÀI GIẢNG CỦA THẦY — BẮT BUỘC trước khi soạn mỗi câu (thầy 03/11)
Thầy: «có câu xác định nhóm trong bảng tuần hoàn ko đưa kiến thức này vào… phần nào chưa giải theo kiến thức thầy dạy tương ứng thì thêm vào đủ».
1. Gọi tên DẠNG BÀI của câu (vd: xác định vị trí nguyên tố trong bảng tuần hoàn từ cấu hình electron; so sánh tính base; thuỷ phân ester trong NaOH; chuyển dịch cân bằng).
2. Dùng Grep trên `muc-luc.txt` với ÍT NHẤT 2 cụm từ khoá khác nhau của dạng bài (chữ cũ và chữ SGK mới: este/ester, axit/acid, ancol/alcohol, nhóm/chu kì, cấu hình…).
   Thầy giảng một dạng ở nhiều bài (bài lớp 10–12 và bản 2007 / 2008 / [2009]) — lấy CẢ các bài đó.
3. `node lay-muc.mjs <tên tệp> <mã…>` lấy MỌI mục quy định CÁCH LÀM của dạng bài (thường 2–6 mục). Đọc `buoc` (thứ tự thầy dẫn), `meo`, `nham`, `noi`.
4. Lời giải PHẢI đi đúng cách thầy dạy trong các mục đó: `cotLoi` nêu đúng quy tắc của thầy (vd nhóm A = tổng electron lớp ngoài cùng; nhóm B tính a + b của (n−1)dᵃnsᵇ:
   3–7 ⇒ nhóm a + b, 8–10 ⇒ nhóm VIIIB, 11–12 ⇒ nhóm (a + b − 10)); `phim` đi ĐÚNG thứ tự `buoc`; `hayNham` lấy từ `nham`.
5. DANH PHÁP (thầy 03/11 «đồng bộ với tất cả các bài gọi danh pháp»): MỌI câu gọi tên phải đi đúng công thức thầy — `cotLoi` nêu
   **Tên = vị trí-tên nhánh + mạch chính + liên kết (an/en/in) + chức**, đánh số ưu tiên **chức → π → nhánh**, đơn chức bỏ e, đa chức giữ e
   (amino acid: COOH là chức chính, C của COOH là số 1, NH₂ là nhánh «amino»; amine thay thế: chức amine đọc cuối; ester: gốc R′ trước, gốc RCOO sau);
   `phim` đi Bước 1 chọn mạch chính → Bước 2 đánh số → Bước 3 ghép tên; và có `canh` `danh-phap`.
6. ĐIỆN DI (thầy 03/11 «thêm và thay đổi hết»; skill 10.C3 «Nguyên tắc sự điện di của ion», «Điểm đẳng điện và sự điện di», 2007 Ôn tập ch.3):
   MỌI câu điện di / điểm đẳng điện phải đi đủ chuỗi thầy — (1) điện di = điện tích DI CHUYỂN trong điện trường (không phải điện li);
   (2) so **pH với pI**: pH < pI ⇒ coi là môi trường acid của chất ⇒ đầu N nhận H⁺ thành **NH₃⁺**; pH > pI ⇒ môi trường base ⇒ COOH nhường H⁺ thành **COO⁻**;
   (3) **cộng điện tích hai đầu** ra điện tích tổng (pH = pI chưa chắc đứng yên: Glu dư COO⁻ mang âm, Lys dư NH₃⁺ mang dương);
   (4) ion dương bị **cực âm** hút, ion âm bị **cực dương** hút, tổng 0 thì đứng yên; điện tích thuần túy chạy nhanh hơn. `phim` đi đúng (1)→(4), `hayNham` lấy
   «ion dương về cực âm, chứ không phải cực dương». Có câu thầy nói «Sự điện di là điện tích di chuyển trong điện trường».
7. ĐỘ TAN (thầy 03/11 «thiết kế bài toán độ tan theo skill của thầy khiến học sinh dễ hiểu nhất»):
   - Định tính (skill 2.C1, 2008 Nền tảng hữu cơ, 2007 Amine, 8.C2 Ammonia): «**Giống nhau thì chơi với nhau**» (phân cực tan phân cực); xét **liên kết hydrogen trước**,
     rồi **khối lượng phân tử** (độ tan tỉ lệ nghịch), rồi **phân nhánh** (càng phân nhánh càng tan); không tan vào nhau ⇒ tách lớp.
   - Định lượng (SGK: S = số gam chất tan trong **100 g nước** tạo dung dịch bão hoà ở nhiệt độ xác định): dựng sơ đồ cột dọc ba cột **chất tan | nước | dung dịch**,
     hàng chuẩn «S | 100 | 100 + S» rồi hàng thật — một phép tính theo tỉ lệ cột (vd m chất tan = m dd · S/(100 + S)). Kết tinh khi hạ nhiệt:
     **bảo toàn chất tan và bảo toàn nước** giữa ba hàng «trước = tách ra + còn lại»; tinh thể ngậm nước tách phần chất tan (· M muối / M tinh thể) và phần nước (· 18n / M tinh thể);
     hàng «còn lại» bão hoà ở nhiệt độ mới ⇒ MỘT phương trình một ẩn. `kiemLai`: lấy hàng «còn lại» chia lại ra đúng S mới. KHÔNG nói «C% = S/(100+S)» như công thức học thuộc
     — luôn dẫn từ hàng chuẩn 100 g nước.
8. Lời thầy nói đúng trong PHẠM VI bài giảng của nó; câu chữ trong lời giải phải đúng SGK Kết nối tri thức. Ví dụ: «electron độc thân chính là electron hoá trị» là ý của bài
   liên kết — KHÔNG dùng để đếm số electron hoá trị; «a + b = 8, 9, 10» dùng để XẾP NHÓM VIIIB. Mâu thuẫn thì theo SGK, lời thầy chỉ dùng đúng phạm vi.

## CÂU TỰ LUẬN (`vao.tuLuan = true`, thầy 03/11 «Câu tự luận giải luôn để lời giải hiện trên máy chiếu lúc dạy học»)
- Không có phương án / ý để chấm: `lyDo: []`. `dapAn.tl` = đáp án / hướng dẫn chữ của kho; `dapAn.kq` = đáp số tham chiếu (một số) hoặc rỗng; `loiGiaiCo` = lời giải kho.
- TỰ GIẢI đầy đủ theo cách thầy, đối chiếu `dapAn.tl` / `loiGiaiCo`: kết luận phải KHỚP kho. Kho mơ hồ hoặc bạn ra khác ⇒ ghi `nghiDapAn` (vẫn viết theo kho).
- Câu có tính toán: dùng `phepTinh` (KHÔNG dùng `buoc` / `soDo`), mục cuối `laDapSo: true`; có `dapAn.kq` thì `ketQua` mục đó phải khớp. `ketQua` của bản = kết luận ngắn.
- Vẫn đủ khối: cotLoi, phim ≥ 3 nhịp (trình bày như thầy chữa trên bảng), hayNham, tuHoi, theNho. Câu gọi tên ⇒ cảnh `danh-phap`.

## Đầu ra: `ra/<cùng tên tệp đầu vào>.json` — một đối tượng JSON với các trường
- `cotLoi`: `{ "chu": câu chốt kiến thức (nói trước, đúng bản chất, ≤ 220 ký tự), "congThuc"?: công thức lớn nếu câu xoay quanh một công thức, "chip": 1–3 `{ "nhan", "chu" }` ý chốt ngắn }`.
- `phim`: 3–6 nhịp `{ "chu", "phu"?, "hinh"? }` — thầy dẫn TỪNG BƯỚC, một ý một nhịp, ĐÚNG THỨ TỰ các bước (`buoc`) của mục kiến thức hợp nhất; đi từ điều nhìn thấy
  tới bản chất, nhịp cuối chốt ra đáp án / quy luật. `hinh` một trong: binh ong-nghiem dun chiet loc can khi ket-tua mau nhiet ap-suat xuc-tac nguyen-tu phan-tu lien-ket dien pin do-thi mui-ten kinh-lup so-sanh cong-thuc.
- `canh` (tuỳ chọn — CHỈ khi đúng chuyện của câu, không ép):
  - `{ "loai": "can-bang", "trai", "phai", "nhanTrai"?, "nhanPhai"?, "tacDong": 1–4 { "nut", "chieu": "thuan"|"nghich"|"khong", "chu" } }` — câu chuyển dịch cân bằng.
  - `{ "loai": "ong-nghiem", "buoc": 2–5 { "chu", "lop": 1–2 { "mau": trong|xanh|cam|vang|hong|tim|nau|trang-duc, "nhan" }, "dun"?, "khi"?, "ketTua"? } }` — câu có thí nghiệm
    / hiện tượng SGK (điều chế, nhận biết, tách lớp, kết tủa, sủi khí, đổi màu). Màu phải đúng hiện tượng thật (Cu(OH)2 xanh lam, Fe(OH)3 nâu đỏ, AgCl trắng…).
  - `{ "loai": "so-sanh", "trai": { "ten", "y": [...] }, "phai": { "ten", "y": [...] } }` — câu phân biệt hai chất / hai khái niệm.
  - `{ "loai": "danh-phap", "soC"?, "chuc"?, "nhanh": [...], "pi": [...], "manh": [...], "ten" }` — BẮT BUỘC cho MỌI câu gọi tên / danh pháp hữu cơ (thầy 03/11
    «mô phỏng chi tiết cực kì dễ hiểu theo cách gọi tên của thầy»). App vẽ mạch carbon, chạy đúng BA BƯỚC của thầy rồi lắp tên từng mảnh.
    - `soC`: số carbon MẠCH CHÍNH (1–12) — ĐÃ đánh số đúng quy tắc (C1 là đầu ưu tiên). Vắng `soC` ⇒ chỉ lắp mảnh (dùng cho ester, tên gốc–chức).
    - `chuc`: `{ "viTri": số C, "ten": "COOH" }` (nhóm chức chính, vd COOH, CHO, OH, NH2 của amine). `nhanh`: `[{ "viTri", "ten": "NH2" | "CH3" | "Cl"… }]` theo đúng vị trí.
    - `pi`: `[{ "viTri": k, "loai": "doi" | "ba" }]` = liên kết bội giữa C(k) và C(k+1); không có thì `[]`.
    - `manh`: 2–5 mảnh ĐÚNG THỨ TỰ công thức thầy, mỗi mảnh `{ "loai", "chu", "giai" }`:
      tên thay thế: `nhanh` (vd "2,6-diamino") → `mach` ("hex") → `lien-ket` ("an" / "-2-en" …) → `chuc` ("oic acid", "-1-ol", "al", "amine"…);
      ester: `goc-ancol` ("ethyl") → `goc-acid` (" acetate"). `giai`: MỘT câu rất dễ hiểu vì sao mảnh này là vậy (vd «2 nhóm NH₂ ở C2 và C6 là nhánh amino, có 2 nhánh nên thêm di»).
      Vị trí carbon trong chữ viết «carbon số 2» hoặc «vị trí 2», KHÔNG viết «C2» (app hạ số sau chữ thành chỉ số, thành C₂ dễ hiểu nhầm).
      Mảnh có thể rỗng nghĩa thì bỏ (vd không có nhánh thì không có mảnh `nhanh`).
    - `ten`: tên đầy đủ = ghép các `chu` (máy so bỏ dấu cách). Phải đúng với đáp án kho.
  - `{ "loai": "dien-di", "pH": số, "chat": 1–3 { "ten": "Gly", "pI"?: số, "nhom": 1–4 { "ten": "NH_3^{+}", "dien": 1 } } }` — BẮT BUỘC cho câu ĐIỆN DI
    (thầy 03/11). `nhom` = các nhóm của chất Ở ĐÚNG pH đề cho (NH₃⁺ +1, COO⁻ −1, nhóm trung hoà 0); app cộng điện tích, chạy về cực. Có `pI` thì dấu tổng phải đúng luật
    pH < pI ⇒ dương, pH > pI ⇒ âm (lệch ⇒ máy bỏ cảnh).
  - `{ "loai": "do-tan", "chat": "CuSO4", "S": 1–3 { "t": °C, "S": g/100 g nước }, "hang": 1–4 { "nhan", "ct": g chất tan, "nuoc": g nước, "baoHoa"?: °C, "tachRa"?: true } }` —
    BẮT BUỘC cho câu ĐỘ TAN định lượng. App vẽ hàng chuẩn 100 g nước rồi từng hàng thật theo tỉ lệ gam. Hàng `baoHoa: t` phải có ct/nước·100 = S(t) (±1 %);
    kết tinh: 3 hàng «trước · tách ra (`tachRa`) · còn lại», máy kiểm trước = tách ra + còn lại cho CẢ chất tan lẫn nước. Tinh thể ngậm nước: tách thành phần chất tan
    và phần nước của tinh thể (ghi khối lượng tinh thể trong `nhan`).
- `dongPhan` — BẮT BUỘC cho MỌI câu VIẾT / ĐẾM đồng phân, số công thức cấu tạo, đồng phân hình học (thầy 08/11 «từ giờ phần đồng phân phải qua skill này»).
  ĐỌC `skill-dong-phan.md` TRƯỚC (skill của thầy) và giải đúng HAI BƯỚC của thầy: tính K → mạch đại số; đối xứng + hoá trị; nhổ răng; hình học; phần cố định + quy tắc nhân.
  `cotLoi`, `phim`, `hayNham`, `theNho` cũng phải theo skill (phim: nhịp 1 tính K, nhịp 2 lập mạch đại số, các nhịp sau đếm từng mạch / bảng, nhịp cuối cộng + hình học).
  App vẽ khối này thành cảnh hoạt hoạ (điểm sáng chạy qua từng vị trí, vị trí trùng mờ đi, thừa hoá trị chớp đỏ, lật cis–trans, cộng tổng) + bàn em tự đặt. MÁY TÍNH LẠI MỌI SỐ.
  ```json
  { "ctpt": "C_4H_8", "nguyenTu": { "C": 4, "H": 8 }, "K": 1, "tachK": "K gốc = 1, không có O ⇒ **một nối đôi C=C**", "hoi": "dong-phan",
    "mach": [ { "so": "4",   "khung": { "chinh": 4, "nhanh": [] },               "dat": [ { "loai": "doi", "nhan": "C=C" } ], "soChat": 2 },
              { "so": "3+1", "khung": { "chinh": 3, "nhanh": [ { "o": 2, "dai": 1 } ] }, "dat": [ { "loai": "doi", "nhan": "C=C" } ], "soChat": 1 } ],
    "tong": 4 }
  ```
  - `nguyenTu`: C, H (+ N, X = số halogen, O); `K` = (2C + 2 + N − H − X) / 2 (máy tính lại). `hoi`: `"cau-tao"` khi đề hỏi công thức cấu tạo (KHÔNG cộng hình học),
    `"dong-phan"` khi đề hỏi đồng phân (cộng hình học: mỗi nối đôi có MỖI đầu gắn hai nhóm khác nhau cộng thêm 1 — máy tự tìm).
  - `mach`: mỗi phần tử là MỘT khung carbon cụ thể. `so` = phép tính mạch đại số («5+1»: số đầu mạch chính, số sau nhánh). Mạch 5+1 có hai khung (nhánh ở carbon số 2 và số 3)
    ⇒ hai phần tử cùng `so`. `khung.chinh` = số C mạch chính (PHẢI là mạch dài nhất), `nhanh` = `[{ "o": carbon số mấy của mạch chính, "dai": số C của nhánh thẳng }]`.
    Khung chỉ gồm các C còn lại SAU khi tách nhóm chức cố định (vd anđehit C4H8O: CHO là răng giả cắm lên khung 3 C; ancol C4H10O: OH cắm lên khung 4 C).
  - `dat`: 1–2 thứ cắm lên khung: `nhom` (răng giả cần một H: Cl, Br, CHO, COOH, NH2, CN…), `oh` (OH: chỉ C no, mỗi C một OH), `doi` / `ba` (nối đôi / ba),
    `xeton` (nhóm CO giữa mạch, nhan "CO"), `chen` (O / NH chen vào liên kết C–C: ether, amine bậc hai). Hai thứ cùng loại = «nhổ hai răng thật, cắm hai răng giả».
  - Máy liệt kê MỌI tổ hợp vị trí theo thứ tự, loại thừa hoá trị, gộp chất trùng do đối xứng, rồi so với `soChat`. Chạy `node dong-phan.mjs ra/<tên>.json` để xem bảng liệt kê
    (số thứ tự #, chất mới / trùng / thừa, công thức thu gọn, hình học) — dùng bảng đó để viết `phim` cho khớp. Máy kiểm thêm: không được QUÊN khung nào còn điền được,
    không trùng khung, cộng đủ = `tong`, và `tong` = đáp án kho (Phần III; Phần I khi phương án đúng là một số).
  - Đề có điều kiện (ancol bậc I, chất tráng bạc, tác dụng Na…): thêm `"chon": [số # thoả điều kiện]` và `"loc": "điều kiện"` vào khung đó; `soChat` = số chất khác nhau trong `chon`.
  - Phần cố định (ester, amine, arene, peptide, chất béo) dùng `bang` thay hoặc cùng `mach`:
    `{ "loai": "este"|"amin"|"aren"|"khac", "tieuDe": "Cố định COO, chia 3 C còn lại cho R và R′", "cot": [], "hang": [ { "phan": [số C từng phần], "soCach": [số gốc từng phần], "tich": số chất, "ghi"? } ] }`.
    Số gốc no: H (0 C) 1 · CH3 1 · C2H5 1 · C3H7 2 · C4H9 4 · C5H11 8. Ester: phan = [C của R (0 = HCOO), C của R′ (≥ 1)], tich = tích. Amine: phan = C từng gốc quanh N
    (bậc 1 một gốc; bậc 2 hai gốc; bậc 3 ba gốc), gốc cùng số C đổi chỗ không nhân thêm. Arene: phan = C từng nhánh trên vòng; hai nhánh × 3 vị trí (o, m, p);
    ba nhánh giống nhau 3. `khac` (peptide 3! = 6, chất béo): `soCach` là các thừa số, tich = tích. Gốc không no / có điều kiện riêng: ghi `ghi` (máy chỉ kiểm tích).
  - Câu Phần II có MỘT ý đếm đồng phân: `dongPhan` cho ý đó (không cần khớp đáp án). Câu chỉ HỎI LÝ THUYẾT về đồng phân (khái niệm, glucose và fructose là đồng phân…):
    không cần `dongPhan`, nhưng `cotLoi` / `lyDo` vẫn theo skill. Câu có vòng (cycloalkane) mà khung không vẽ được: dùng `bang` loại `khac`.
  - K viết K HOA (thầy: «Bước 1 các em tính K»). Công thức thu gọn kiểu SGK: CH3-CH=CH-CH3, CH3-COO-CH3.
- `thanChu`: mảng chữ thần chú — CHỈ chép ĐÚNG CHỮ trường `chu` trong `than-chu.json`, chỉ khi đúng chuyện câu đang hỏi. Không có thì `[]`. Tuyệt đối không tự đặt thần chú.
- `thayNoi` (tuỳ chọn): MỘT câu chép NGUYÊN VĂN từ `noi` của một mục trong `.muc.json`, hợp ý bài. Không có câu hợp thì bỏ trường. Không sửa chữ (chỉ được sửa axit→acid, bazơ→base, este→ester, ancol→alcohol, oxit→oxide, amin→amine, anđehit→aldehyde). Sửa thuật ngữ thì máy chủ không khớp ⇒ thà chép nguyên.
- `meo` (tuỳ chọn): chép NGUYÊN VĂN `meo` của mục hợp ý.
- `lyDo`: Phần I bốn mục khoá `A B C D`; Phần II bốn mục khoá `a b c d`; Phần III `[]`. Mỗi mục `{ "khoa", "dung", "chu" }`: `dung` PHẢI theo `dapAn` kho
  (`"D"` ⇒ true). `chu` 1–2 câu nói vì sao đúng / vì sao sai, gỡ nhầm bằng "chứ không phải…" khi hợp. Phần II: mỗi ý một lý do riêng.
- Câu TÍNH TOÁN (Phần III, và Phần I nếu đáp án là số) — theo `tu-duy-day-hoa.md`:
  - `soDo`: `{ "nut": 2–3 { "tong"?, "chat", "soLieu": [...] }, "muiTen": [{ "H"? }], "chieu": "xuoi"|"nguoc" }` — đề cho số liệu ở chất nào thì ghi đủ số liệu của chất đó theo CỘT DỌC.
    `chat` viết kiểu `CH_3COOH`, `H_2SO_4`, `CO_3^{2-}`.
  - `buoc`: 1 bước là chuẩn (tối đa 3) `{ "ten", "thuaSo": [ { "so", "nghia", "denDay" } ], "ketQua", "donVi" }` — MỘT phép tính duy nhất nối từ chất đề cho tới chất cần tìm.
    Mỗi thừa số có `nghia` RẤT DỄ HIỂU: mở bằng một cụm in đậm nói thừa số làm gì ("**Chia M = 60 để ra số mol acid.**"), rồi một câu vì sao / M tính ra sao.
    `denDay`: tới đây đang có gì ("0,2 mol acid"). `so` viết như "12", "1/60", "75/100", "10^6", "24,79". Máy TÍNH LẠI chuỗi, phải ra đúng đáp án kho.
  - Bài không xích được thành một phép nhân (hệ phương trình, hỗn hợp nhiều ẩn, so dư): thay `buoc` bằng `phepTinh`: các mục `{ "ten", "bieuThuc", "ketQua", "nghia", "laDapSo"? }`;
    `bieuThuc` chỉ số, `+ - * /`, ngoặc, dấu CHẤM thập phân; `ketQua` dấu PHẨY, đã làm tròn; mục cuối Phần III `"laDapSo": true` và `ketQua` = đáp án kho. Máy tính lại từng biểu thức.
  - `ketQua`: đáp số cuối (dấu phẩy). `kiemLai`: một câu kiểm bằng cách khác (thầy luôn kiểm lại).
- `hayNham`: 1–3 `{ "nghi": chỗ nhiều em nghĩ sai (cụ thể, sát bài này), "dung": đúng là gì }`. Lấy từ `nham` của mục khi hợp; Phần III ghi rõ con số sai em hay ra.
- `tuHoi`: `{ "hoi": một câu em tự trả lời trước (hỏi vì sao, hoặc đảo bài), "tra": câu trả lời ngắn có số nếu là bài tính }`.
- `theNho`: 1–3 `{ "truoc": CÂU HỎI (không phải tiêu đề), "sau": 1–2 dòng chữ khoá in đậm, "viSao"? }` — một ý một thẻ; ưu tiên thần chú + cách dùng, điều kiện / ngoại lệ, bẫy hay ra.
- `nghiDapAn` (CHỈ khi bạn tự giải ra khác đáp án kho và chắc chắn): một câu nêu bạn ra gì, vì sao. Khi đó VẪN viết lời giải theo đáp án kho (máy chủ ẩn bản và báo thầy). Không chắc thì không ghi.

## Luật chữ (máy kiểm, sai là trượt)
1. KHÔNG dùng dấu ngoặc kép kiểu Pháp (hai dấu nhọn). Chữ cần nhấn viết **in đậm** bằng hai dấu sao. Thẻ HTML chỉ được `<b> <i> <sub> <sup>` (thường không cần).
2. Công thức viết thường như đề: H2SO4, Fe2O3, CH3COOC2H5 (app tự hạ chỉ số); ion có điện tích: `Fe^{3+}`, `SO_4^{2-}`; chỉ số chữ: `C_nH_{2n}O_2`. Mũi tên `→`, `⇌`.
3. KHÔNG dùng tên "độ bất bão hoà", "độ không no", k thường. Được dùng **K** (K hoa = số π + số vòng, thầy 08/11: «Bước 1 các em tính K»); đếm π của gốc và chức theo skill đồng phân.
   KHÔNG ẩn dụ tiền / nhà / giàu / thuế (thầy đã bỏ). KHÔNG chữ "AI". Không rào đón, không khen sáo, câu ngắn.
4. Thuật ngữ SGK 2018: acid, base, oxide, ester, alcohol, aldehyde, amine, saccharose, glucose… Số thập phân dấu phẩy trong chữ.
5. KHÔNG đổi đáp án kho. KHÔNG bịa số liệu (chỉ số trong đề + nguyên tử khối phổ thông: H 1, C 12, N 14, O 16, Na 23, Mg 24, Al 27, S 32, Cl 35,5, K 39, Ca 40, Fe 56, Cu 64, Zn 65, Ag 108, Ba 137; đề cho khác thì dùng của đề; đkc 24,79 L/mol, đktc 22,4 theo chữ của đề).
6. Lý thuyết chỉ trong SGK Kết nối tri thức. Điều SGK không nêu thì không đưa vào.

## Cách làm cả lô
1. Đọc `vi-du-kinh.json`, `than-chu.json`, `tu-duy-day-hoa.md` một lần.
2. Từng câu: đọc `vao/<tên>.json` + `vao/<tên>.muc.json` (+ ảnh). TRA BÀI GIẢNG (mục trên) bằng Grep `muc-luc.txt` + `node lay-muc.mjs`. TỰ GIẢI TRƯỚC theo cách thầy,
   đối chiếu `dapAn` kho, rồi mới viết `ra/<tên>.json` bằng công cụ Write. KHÔNG viết script sinh tệp: Bash chỉ chạy được `node kiem.mjs`, `node lay-muc.mjs` và `node dong-phan.mjs`.
3. Chạy `node kiem.mjs`. Sửa mọi dòng TRƯỢT / THIẾU / LỆCH rồi chạy lại (tối đa 3 vòng mỗi tệp). Dòng "bỏ khối" nghĩa là thần chú / câu thầy nói / mẹo không khớp nguồn: chép lại đúng chữ nguồn hoặc bỏ trường.
4. Trả lời cuối đúng 1 dòng: số câu ĐẠT / tổng, số câu `nghiDapAn`.
