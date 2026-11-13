# Đặc tả: Nhật ký bài dạy, bản vẽ lại theo giọng Thầy (13/11/2026)

Lời Thầy 13/11: «Html tôi muốn bạn thiết kế lại thông minh hiệu quả siêu đẹp, có hoạt họa kiến thức trong video. Chứ ko phải trích dẫn thế kia. Bạn hãy dựng lại sao cho hs phải phấn khích học siêu đẹp phải wow». Rồi: «Tôi ko chốt html gì cả. Máy tự làm hết. Làm đẹp cuốn hút hs đọc phải thấy giống y thầy giảng hoạt hoak đủ thư. Hs vẫn điều chỉnh đc bảng trên máy nhé».

Ý chốt của bản vẽ này:

- Sau mỗi buổi live, **máy tự dựng** một bài học hoạt hoạ giảng lại kiến thức của buổi. **Không có bước người duyệt.** Thay vào đó là **cổng tự kiểm** của máy: cảnh nào sai số hoặc không có nguồn thì bỏ; không đủ cảnh tin được thì không phát hành, màn Xem lại giữ nguyên như cũ.
- **Giống y Thầy giảng** là mục tiêu số một: mỗi cảnh phát kèm **đúng đoạn giọng Thầy** trong bản ghi, hoạt hoạ chạy khớp theo lời, phụ đề chạy theo câu Thầy nói, **nét phấn của chính Thầy** hiện ra cùng lúc.
- Em **điều chỉnh được bảng**: khung nét phấn của Thầy phóng to, thu nhỏ, kéo xem quanh.
- Máy chủ gọi **Gemini** (đã có sẵn trong repo, nhận được cả ảnh lẫn tiếng), không dùng Claude API.

Đang ở bước 2 của quy trình 4 bước. Chưa đụng `src/`, `server/`.

## Xem bản vẽ

- **Hai video** (chế độ «Xem như Thầy giảng» chạy liền, đồng hồ giả chạy nhanh ×2,6 và ×2,4 cho vừa 40 giây):
  - `video-nhat-ky-may-tinh-1366.mp4` (39,6 giây, 1,7 MB, nền sáng): bìa, em bấm «Xem như Thầy giảng», cảnh 1 kéo co, cảnh 2 quy tắc, cảnh 3 công thức electron O₂, cảnh 4 đoán nhanh H₂ (chạm đáp án, nghe lời Thầy). Nét phấn của Thầy tự viết ra ở khung bên phải, câu Thầy đang nói sáng lên.
  - `video-nhat-ky-dien-thoai-390.mp4` (36 giây, 0,6 MB, nền tối): vào thẳng chế độ giảng từ cảnh 5: lệch sức rồi thành ion, quy tắc «Δχ > 1,7», ví dụ CH₄; phụ đề lời Thầy chạy trên thanh giảng.
- **Mở chạy thật**: `nhat-ky.html` (bài 12/11), `nhat-ky.html?kb=fes2` (bài tính FeS₂), `cho-gan.html` (màn Xem lại Live có thẻ). Mở thẳng từ ổ đĩa vẫn chạy (`kich-ban-nhung.js` tự sinh từ JSON).
- **Chụp, quay, tự soát**: `node docs/ban-ve-nhat-ky-bai-day-1311/chup.mjs --video` (kết quả ở `soat.json`). **Kiểm kịch bản và cổng**: `node docs/ban-ve-nhat-ky-bai-day-1311/kiem-kich-ban.mjs`. **Dựng lại nét phấn mẫu**: `dung-net-mau.mjs`.

| Ảnh | Nội dung |
|---|---|
| 01 | Máy tính 1366, sáng: bìa (kéo co ba pha chạy lặp), hai nút «Xem như Thầy giảng» và «Tự đọc, tự cuộn», mục lục cảnh |
| 02 | Máy tính 1366, tối: Ví dụ 1 CH₄ (sơ đồ cột dọc, phép tính), bảng của Thầy, lời Thầy |
| 03 | Điện thoại ngang 844, sáng: bìa hai cột |
| 04 | Điện thoại ngang 844, tối: công thức electron O₂ cạnh nét phấn «O₂ ⇒ O ⁘ O ⇒ LK CHT kpc» của Thầy |
| 05 | Điện thoại dọc 390, sáng: bìa |
| 06 | Điện thoại dọc 390, tối: đoán nhanh H₂ sau khi em chạm, hoạt hoạ mở đáp án |
| 07 | Khung giữa hoạt hoạ, 1366 tối: cặp electron về hẳn một bên, hai bên thành ion |
| 08 | Khung giữa hoạt hoạ, 390 sáng: công thức electron O₂ đang vẽ cặp dùng chung |
| 09 | Khung giữa hoạt hoạ, 844 sáng: kim CH₄ vừa nảy trên thang Δχ |
| 10 | Bài FeS₂ (kịch bản mẫu), 1366 sáng: sơ đồ cột dọc, từng thừa số, nét phấn của Thầy, lời Thầy từng thừa số |
| 11 | «Xem như Thầy giảng», 1366 tối: Thầy đang nói câu 2 của Ví dụ 1, nét phấn «⇒ Δχ =» đang viết, kết quả chưa hiện, thanh giảng ở đáy |
| 12, 13 | Chỗ gắn trên màn Xem lại Live, 1366 và 390 sáng: thẻ ngay dưới bìa, hình thu nhỏ đang hoạt hoạ |
| 14 | Điện thoại 390, sáng: em phóng to bảng của Thầy 2,3 lần (nút − / + / vừa khung, chụm hai ngón) |
| 15 | «Xem như Thầy giảng» trên điện thoại 390, tối: phụ đề câu Thầy đang nói nằm trên thanh giảng |

**Dữ liệu mẫu**: chữ trên bảng (`nguon.chep`) chép đúng bảng Thầy viết 12/11. Lời Thầy, giờ tiếng và nét phấn là MẪU (lời viết theo giọng Thầy suy từ nội dung bảng; nét phấn dựng bằng phông một nét, chỗ hai bạn Thầy ví không viết tên). **Tệp tiếng mẫu** `tieng-mau.mp3`: 30 giây im lặng (30 KB, máy không có bộ đọc tiếng Việt), đặt ở giây 187 của trục buổi nên phủ đúng cảnh 1; `DongHo` trong `khuon.js` phát `<audio>` thật ở cảnh 1 (đã chạy thử: đồng hồ đọc giờ từ `<audio>`, tua trước khi tệp tải xong, máy chặn tự phát tiếng thì chuyển sang đồng hồ giả). Các cảnh khác nằm ngoài tệp mẫu nên chạy **đồng hồ giả** đúng thời lượng đoạn tiếng, cùng giao diện. Ô viền đứt màu tím chỉ có trong bản vẽ.

## Quy trình sau mỗi buổi live (máy tự làm hết)

| Bước | Ở đâu | Việc |
|---|---|---|
| 1 | Có sẵn | Thầy kết thúc live, máy chủ chốt buổi (`chotThat`, `server/src/live-xem-lai.ts`): `net.bin` (mọi nét, có giờ), `tieng.mp3`. |
| 2 | Máy thầy | Dựng **ảnh từng trang bảng** từ nét (canvas, cùng bộ vẽ nét của trình phát; chia trang: bảng mới, xoá hết, nghỉ viết từ 45 giây), PNG 1600 × 900 có vạch 2/3. Tải lên R2. Worker không có canvas nên làm ở máy thầy. |
| 3 | Máy chủ gọi Gemini | Gửi **`tieng.mp3`** của buổi (Files API của Gemini) + **ảnh các trang** + tên buổi, lớp, câu đã chữa + lời nhắc hệ thống + lược đồ `luoc-do.json` (`responseMimeType: application/json` + `responseJsonSchema`; repo hiện gọi `responseSchema` dạng OpenAPI ở `server/src/hoi-tro-ly.ts`, nếu giữ cách đó thì đổi lược đồ sang dạng OpenAPI: bỏ `$ref`, `const`). Khoá `env.GEMINI_API_KEY` đã có (`hoi-tro-ly.ts`, `tram-gemini.ts`). |
| 4 | Máy chủ | Điền phần của máy: `nguon.vung` (hộp bao các nét trong đoạn `tu` tới `den` của trang đó), phút nghe ở tổng kết. Chạy **cổng tự kiểm**. |
| 5 | Máy chủ | Cổng đạt: ghi `nhat-ky.json` (chỉ cảnh đạt, chữ đã chuẩn hoá) cạnh tệp của buổi, thêm `nhatKy` vào `buoi.json`. Cổng không đạt: gọi lại **một lần** bằng mô hình mạnh hơn; vẫn không đạt thì không phát hành. |
| 6 | Học sinh | Thẻ «Nhật ký bài dạy» hiện ở màn Xem lại Live của đúng lớp đó. |

Thường xong trong vài phút sau buổi live. Thầy không phải làm gì.

## 1. Mục tiêu sư phạm, ai dùng

- **Học sinh** lớp của buổi: xem lại kiến thức như được nghe Thầy giảng lại, khoảng 4 phút thay vì tua 38 phút. Có câu đoán nhanh để tự thử.
- **Cảm giác**: cuốn hút như xem một video hoạt hoạ, nhưng là **giọng Thầy, chữ Thầy, cách nói của Thầy**. Điểm nhấn: bảng kéo co ở bìa (hai nguyên tử, cặp electron trượt theo lực kéo, đứt dây thành ion, bụi phấn bay).
- **Thật thà**: chỉ dùng điều có trên bảng hoặc trong lời Thầy; mọi con số do máy tính lại. Mỗi cảnh ghi nguồn: «Nguồn: bảng trang 1 · giọng Thầy 23:09–23:30».

## 2. Bố cục

**Trang bài học** (`nhat-ky.html`):

1. Thanh trên dính: lùi, «Nhật ký bài dạy», tên buổi, «Cảnh 3/12» + vạch tiến độ.
2. Bìa: tên bài, ngày, lớp, nút chính **«Xem như Thầy giảng»**, nút phụ «Tự đọc, tự cuộn», dòng «12 cảnh · giọng Thầy · khoảng 4 phút»; bảng kéo co chạy lặp.
3. Mỗi cảnh: số, nhãn khuôn, tên; **bảng hoạt hoạ** (trái / trên); **Bảng của Thầy** (nét phấn thật của trang đó, nút − / mức phóng / + / vừa khung ở đầu thẻ, không che nét); **Thầy giảng** (phụ đề từng câu, câu đang nói sáng lên), nút «Nghe Thầy giảng cảnh này», «Xem lại cảnh này», dòng nguồn.
4. Tổng kết: ý chốt, mỗi ý nút «Nghe Thầy giảng đoạn này · mm:ss»; bên cạnh là **bảng cuối buổi** của Thầy (phóng to được).

Hai chế độ:

- **Xem như Thầy giảng**: tự chạy liền các cảnh theo giọng Thầy như một video. Trang tự cuộn tới cảnh đang giảng, bảng sáng viền, chuyển cảnh mượt (bảng sáng dần lên). Thanh giảng dính đáy: cảnh trước, tạm dừng / giảng tiếp, cảnh sau, «Thầy giảng · 3/12», tên cảnh, vạch tiến độ, «Thoát». Điện thoại: **phụ đề câu Thầy đang nói nằm ngay trên thanh giảng** (thẻ lời nằm dưới màn). Tới câu đoán nhanh thì dừng chờ em chạm; chạm xong mở đáp án rồi phát lời Thầy giảng câu đó.
- **Tự đọc, tự cuộn**: không tiếng; trang tự chạy hoạt hoạ từng cảnh, cuộn tới lời Thầy, dừng đủ lâu để đọc (2,5 giây + 0,3 giây mỗi chữ) rồi cuộn sang cảnh kế; thanh dưới ghi «Tự đọc · 3/12». Em chạm hay cuộn tay là thôi tự cuộn, trang thành đọc tay như thường: mỗi cảnh chạy hoạt hoạ khi cuộn tới, lời Thầy hiện đủ, bảng của Thầy hiện trọn đoạn, muốn nghe cảnh nào thì bấm «Nghe Thầy giảng cảnh này».

Theo khổ: điện thoại dọc một cột (bảng hoạt hoạ, bảng của Thầy, lời Thầy); bảng kéo co tự chuyển bố cục gọn để chữ trên bảng không dưới 15 px. Điện thoại ngang và máy tính: hai cột (hoạt hoạ 58 %, bảng + lời 42 %); máy tính có mục lục cảnh dính bên trái.

**Em điều chỉnh bảng của Thầy**: chụm hai ngón hoặc bấm + / − (1 tới 5 lần), chạm hai lần để phóng 2 lần / về vừa khung, kéo một ngón để xem quanh khi đã phóng, Ctrl + lăn chuột trên máy tính, phím + − 0 khi khung đang được chọn. Chưa phóng thì vuốt dọc vẫn cuộn trang (không giữ ngón tay của em). Màn live của em giữ nguyên (kéo vạch chia, chạm hai lần phóng to), không đụng.

**Chỗ gắn** (`cho-gan.html`): thẻ ngay dưới bìa Xem lại Live, hình thu nhỏ là cảnh kéo co của bài chạy lặp, dòng «12 cảnh hoạt hoạ · giọng Thầy 4 phút», «Mở nhật ký». Cổng không đạt thì không có thẻ.

## 3. Trạng thái

| Trạng thái | Hiện gì |
|---|---|
| Đang dựng (vài phút sau live) | Không có thẻ |
| Cổng không đạt | Không có thẻ; màn Xem lại như cũ (bảng gốc, trình phát) |
| Đang tải | Khung xương: bìa, hai cảnh; «Đang mở nhật ký…» |
| Lỗi tải | «Chưa tải được nhật ký. Em thử lại.» + «Thử lại» |
| Mất mạng | Đã mở thì hiện bản đã nhớ (không có tiếng); chưa mở thì «Máy em đang mất mạng. Có mạng lại thì nhật ký tự tải.» |
| Tiếng chưa tải kịp / máy chặn tự phát tiếng | Hoạt hoạ và phụ đề vẫn chạy theo đồng hồ, tiếng vào khi tải xong; lần chạm đầu bật tiếng |
| Đang giảng / tạm dừng | Thanh giảng đổi nút; hoạt hoạ, phụ đề, nét phấn cùng dừng |
| Đoán nhanh: chưa chạm / đã chạm | Câu hỏi + đáp án / đúng sai, lời giải, hoạt hoạ mở đáp án, lời Thầy hiện |
| Giảm chuyển động | Hoạt hoạ hiện sẵn hình cuối, phụ đề và tiếng vẫn chạy, không đầu phấn sáng |
| Máy yếu (`ddh.mayYeu`) | Bỏ bụi phấn, quầng sáng của electron và kim, quầng nét phấn, mờ nền thanh trên |

## 4. Dữ liệu

**Nguồn có sẵn**: `net.bin` (nét có giờ), `tieng.mp3`, `buoi.json`. **Thêm**: `trang-<n>.png` (chỉ máy chủ), `nhat-ky.json` (bản phát hành, qua `/live-tep` với vé của buổi), `BuoiLiveJson.nhatKy?: { canh, phut }`.

**Kịch bản** (mẫu: `kich-ban-lien-ket.json`, `kich-ban-fes2.json`; lược đồ: `luoc-do.json`). Mỗi cảnh:

| Trường | Ai | Nghĩa |
|---|---|---|
| `khuon`, `tieuDe`, `duLieu` | Gemini | Một trong 7 khuôn và dữ liệu của nó |
| `nguon.trang`, `nguon.cot`, `nguon.chep` | Gemini | Trang bảng, cột, chép nguyên văn chữ trên bảng (không hiện cho học sinh, máy dùng để kiểm nguồn) |
| `nguon.tu`, `nguon.den` | Gemini | Giây trên **trục tiếng của `tieng.mp3`** (0 = đầu tệp; các lần tắt / bật live nối liền; khoảng câu chưa mở đáp án đã cắt). Nét trong `net.bin` dùng CÙNG trục này (`src/lib/live/xem-lai-kieu.ts`), nên giờ Gemini nghe được, giờ nét phấn và giờ phát tiếng khớp nhau, không cần quy đổi |
| `loi[] {chu, tu, den}` | Gemini | Từng câu Thầy nói, chép lại đúng cách nói của Thầy (bỏ nói lắp, ậm ừ, không thêm ý, không quá 30 chữ), có giờ |
| `khop[]` | Gemini | Bước k của khuôn bắt đầu đúng lúc Thầy nói câu `khop[k]` |
| `nguon.vung` | Máy | Hộp bao các nét trong đoạn `tu` tới `den` của trang đó (khung bảng của Thầy) |

**Bảy khuôn** (`khuon.js`, `khuon.css`; mỗi khuôn khai báo các bước để khớp lời):

| Khuôn | Hoạt hoạ | Bước khớp lời |
|---|---|---|
| `keo-co` | Hai nguyên tử, mũi tên lực dài theo χ, cặp electron (chấm / x) có đám mây sáng trượt về bên χ lớn theo Δχ; ion: dây đứt, cặp electron về hẳn bên mạnh, hai bên co / giãn, hiện «+» «−»; khung phấn vẽ quanh kết luận | đầu mỗi pha, kết luận mỗi pha |
| `thang-delta` | Vùng mọc lên, kim chạy vượt nhẹ rồi **nảy** về đúng giá trị, quầng sáng ở chân kim, vùng và ô tên sáng lên; kết luận khung phấn | vùng, từng kim, kết luận |
| `lewis` | Kí hiệu hiện, từng cặp riêng tự vẽ, từng cặp dùng chung **bật ra có quầng** ở giữa, khung vùng dùng chung, đếm «8 e» | kí hiệu, cặp chung, đếm 8 electron |
| `quy-tac` | Khung phấn tự vẽ, chữ hiện từng từ, khung sáng, ví dụ trên bảng | khung, chữ, ví dụ |
| `vi-du-cot-doc` | Sơ đồ cột dọc của Thầy (số liệu dưới từng chất, hiệu suất trên mũi tên), phép tính hiện **từng thừa số** đúng lúc Thầy nói thừa số đó, ô số liệu liên quan sáng lên, hệ số «2» bật ra khi nói bảo toàn nguyên tố | sơ đồ, từng thừa số, kết quả |
| `doan-nhanh` | Câu hỏi, đáp án chạm được; chạm xong mới mở đáp án bằng hoạt hoạ (một trong bốn khuôn trên) và lời Thầy | câu hỏi |
| `tong-ket` | Từng ý, dấu tích tự vẽ, nút nghe đúng phút | từng ý |

**Khớp lời**: máy đặt mốc: bước k bắt đầu lúc câu `khop[k]` bắt đầu; trong một bước hoạt hoạ chạy đúng tốc độ thiết kế rồi **đứng chờ** câu kế (không kéo giãn chậm); nhiều bước cùng một câu thì nối tiếp nhau. Phụ đề sáng theo `loi[].tu / den`. Nét phấn vẽ đúng giờ của từng nét: nét trước đoạn mờ (ngữ cảnh), nét trong đoạn rõ, đầu phấn sáng. Mọi thứ đọc giờ từ **một đồng hồ tiếng**.

## Cổng tự kiểm của máy (thay bước người duyệt)

Chạy trong `khuon.js` (`kiemCong`, `quaCong`). Bản vẽ: bài 12/11 **12/13 cảnh đạt, phát hành**; cảnh mẫu «Thêm ví dụ NaCl và HCl» bị bỏ (không trỏ được trang bảng, không có đoạn tiếng, «HCl, NaCl, 0,96, 2,23» không có trên bảng cũng không có trong lời Thầy). Bài FeS₂ 5/5 cảnh đạt. `kiem-kich-ban.mjs` còn tự thử: sửa Δχ của CH₄ thành 0,45 và xoá đoạn tiếng của O₂ thì cổng bỏ đúng hai cảnh đó; chỉ 2 cảnh có nguồn thì không phát hành.

**Ngưỡng máy dùng:**

| Mục | Ngưỡng | Không đạt thì |
|---|---|---|
| (a) Lược đồ, khuôn | Đúng `luoc-do.json`; khuôn ngoài 7 khuôn | Bỏ cảnh |
| (b) Δχ | Tính lại \|χa − χb\| từ bảng cố định (H 2,20; C 2,55; N 3,04; O 3,44; F 3,98; Na 0,93; Cl 3,16; K 0,82), lệch quá 0,005 so với số Gemini ghi | Bỏ cảnh |
| (b) Loại liên kết | Xếp theo ngưỡng bên dưới, phải trùng loại Gemini ghi | Bỏ cảnh |
| (b) Công thức electron | Mỗi nguyên tử góp đúng số electron lớp ngoài; quanh có 8 (H có 2) | Bỏ cảnh |
| (b) Bài tính cột dọc | Đọc lại từng thừa số từ chữ hiện («10⁶», «8/100»); M đúng nguyên tử khối; «bảo toàn» đúng tỉ lệ đếm nguyên tố; xuôi = H/100, ngược = 100/H; tính lại cả chuỗi, lệch tương đối quá 10⁻⁶ | Bỏ cảnh |
| (b) Đoán nhanh | Đúng một đáp án đúng; hoạt hoạ mở đáp án cũng qua kiểm | Bỏ cảnh |
| (c) Nguồn | `trang` ≥ 1 và có đoạn tiếng (`den` > `tu`); mọi câu lời Thầy nằm trong đoạn (lệch tối đa 1 giây); **mọi số và công thức trên cảnh có trong chữ bảng hoặc lời Thầy** của buổi (trừ phương án sai của câu đoán và mốc ngưỡng) | Bỏ cảnh |
| Chữ | Câu quá 30 chữ, emoji, chữ tiền / nhà / giàu / thuế, lộ mã khuôn | Bỏ cảnh |
| Chữ | Viết tắt của bảng (VD, LK, CHT, KPC, PC, ntố, ko, QT) và dấu «—» | Tự sửa (Ví dụ, liên kết, cộng hoá trị…) |
| Tên người | Mọi chữ học sinh thấy (kể cả lời Thầy) so với **danh sách lớp** máy chủ có sẵn; trùng tên thì thay bằng «một bạn» (đã tự thử: «Bạn Minh Anh với bạn Long kéo co» ⇒ «Một bạn với một bạn kéo co»). Khung bảng của Thầy hiện nét phấn y như bảng (như màn Xem lại đang hiện) | Tự che |
| Bản phát hành | Không mang chữ chép bảng (`chep`), không mang cảnh bị bỏ | Tự bỏ |
| Ngưỡng Δχ | **Bảng hoặc lời Thầy có ghi thì dùng đúng như Thầy**, không thì SGK Hoá 10 (2018). Buổi 12/11: không phân cực khi Δχ < 0,4 (SGK, bảng không ghi); liên kết ion khi **Δχ > 1,7 (theo bảng Thầy)** | Không áp dụng |
| (d) Phát hành | Ít nhất **4 cảnh** đạt và ít nhất **60 %** số cảnh | Gọi lại Gemini một lần (mô hình mạnh hơn); vẫn không đạt thì không phát hành, chỉ hiện bảng gốc như cũ |

Điều ngoài bảng (CO₂ phân cực, NaCl, HCl) **không vào bài**, trừ khi Thầy có nói trong tiếng. Bản vẽ giả định Thầy CÓ nói phần CO₂ (cảnh 11, nguồn: giọng Thầy 31:40–31:58); NaCl, HCl không có ở đâu nên bị bỏ.

## 5. Ngoại lệ, và khi máy không sinh được

- **Bảng chủ yếu là hình vẽ** hoặc nội dung không khớp khuôn nào: Gemini không được bịa khuôn; phần đó không thành cảnh. Không đủ cảnh thì không phát hành.
- **Chữ khó đọc**: số đọc sai thì cổng bắt (tính lại không khớp, hoặc không có trong lời Thầy) và bỏ cảnh. Lời Thầy giúp đọc bảng: Thầy thường nói to điều đang viết.
- **Thầy viết dở** («H₂ →»): được làm câu đoán nhanh nếu đáp án có trong lời Thầy hoặc quy tắc trên bảng.
- **Tiếng ồn, Thầy nói nhỏ**: câu không nghe rõ thì Gemini bỏ câu đó; cảnh thiếu lời vẫn qua được nếu số và công thức có trên bảng.
- **Live không có tiếng**: không có giọng Thầy; chỉ cảnh có đủ nguồn trên bảng (thiếu đoạn tiếng thì bỏ) ⇒ thường không phát hành.
- **Buổi dưới 20 nét**: không gọi Gemini (không tốn tiền).
- **Gemini lỗi / hết hạn mức**: thử lại sau 1, 5, 30 phút; sau 3 lần thì thôi, màn Xem lại như cũ.
- **Phụ đề dài**: tối đa 2 dòng trên thanh giảng điện thoại; câu dài hơn 30 chữ đã bị cổng chặn.
- **Bấm lặp, đổi tab**: «Xem lại cảnh này» chạy lại từ đầu; rời tab thì tạm dừng giảng, vòng lặp nền dừng.
- **Buổi cũ**: dựng khi Thầy mở lại buổi trong Lịch sử Live (tốn một lượt gọi).

## 6. Chi phí, tốc độ, ai xem được

**Chi phí Gemini mỗi buổi** (giá tra 13/11/2026 qua tìm kiếm trên ai.google.dev và cloud.google.com; trang giá ai.google.dev không mở thẳng được trong phiên này vì mạng chặn, nên số cần đối chiếu lại một lần khi build):

- `gemini-3.1-flash-lite` (mô hình repo đang dùng cho A.I Đỗ Đại Học): vào chữ / ảnh **0,25 USD**, vào **tiếng 0,50 USD**, ra **1,50 USD** (kể cả phần suy nghĩ) mỗi 1 triệu token; gửi theo lô (Batch) một nửa: 0,125 / 0,25 / 0,75.
- `gemini-3.7-flash` (mạnh hơn, dùng khi gọi lại): giá mở đầu tới 31/12/2026 là 0,75 USD vào (mọi loại) và 3,75 USD ra; từ 01/01/2027 là 1,50 và 7,50.
- Tiếng tính **25 token mỗi giây**: buổi 38 phút ≈ 2 280 giây ≈ **57 000 token**. Ảnh trang bảng ước khoảng 1 100 token mỗi trang (chưa đo). Lời nhắc + lược đồ ≈ 8 000 token. Kết quả JSON (có cả lời Thầy) + suy nghĩ ≈ 10 000 đến 20 000 token ra.

| Mỗi buổi 38 phút, 1 đến 6 trang bảng | Flash-Lite | Flash-Lite theo lô | 3.7 Flash (2026) | 3.7 Flash (từ 2027) |
|---|---|---|---|---|
| Tiền | **0,046 đến 0,062 USD** | 0,023 đến 0,031 USD | 0,09 đến 0,13 USD | 0,17 đến 0,26 USD |
| 20 buổi mỗi tháng | **0,9 đến 1,25 USD** | 0,46 đến 0,62 USD | 1,7 đến 2,6 USD | 3,5 đến 5,2 USD |

- Buổi 12/11 (ước): 57 000 token tiếng, 1 100 token ảnh, 8 000 token chữ, 14 000 token ra ⇒ **0,052 USD** với Flash-Lite. Quy ra tiền Việt theo tỉ giá giả định 26 000 đồng / USD: khoảng 1 350 đồng một buổi.
- Đề nghị: Flash-Lite trước; cổng không đạt thì gọi lại bằng 3.7 Flash (thêm khoảng 0,1 USD buổi đó). Ghi `usage` mỗi lượt để đo thật trên 3 buổi đầu.
- **Học sinh mở bài: 0 lượt gọi A.I**, 0 lượt D1.

**Máy chủ**: mỗi buổi 1 lượt tải tệp tiếng lên Gemini + 1 lượt gọi (hiếm khi 2), ghi R2 2 đến 8 tệp, không thêm vòng chờ nối tiếp vào lệnh nóng nào.

**Tệp tiếng**: phát `tieng.mp3` sẵn có của buổi theo Range đúng đoạn `tu` tới `den`; máy chặn tự phát tiếng thì hoạt hoạ và phụ đề vẫn chạy theo đồng hồ, lần chạm đầu bật tiếng.

**Tốc độ tải**: trang bài học là mảnh nạp lười, chỉ tải khi em bấm «Mở nhật ký»: thư viện khuôn khoảng 20 KB nén gzip (bản vẽ: `khuon.js` + `khuon.css`, chưa rút gọn), kịch bản 10 đến 20 KB, nét phấn dùng chung `net.bin` trình phát đã tải. Tiếng phát theo Range đúng đoạn, không tải cả tệp. Thẻ ở Xem lại: số cảnh nằm sẵn trong `buoi.json`. Lượt mở ba app không thêm byte nào (`npm run kiem:toc-do` 0 đỏ). Hoạt hoạ chỉ đổi transform / opacity (khung phấn vẽ bằng stroke-dashoffset, ít phần tử); nét phấn vẽ trên một canvas mỗi cảnh, chỉ cảnh đang xem chạy.

**Ai xem được**: chỉ lớp của buổi (cùng vé `/live-tep` của Xem lại Live) và Thầy. Bản phát hành không mang chữ chép bảng (`chep`) và không mang cảnh bị bỏ.

**An toàn đáp án**: nhật ký chỉ dùng phần đã chữa (không lấy đoạn câu chưa mở đáp án, đúng luật Xem lại Live). Đáp án câu Đoán nhanh nằm trong kịch bản trên máy em: câu luyện trong bài, không chấm điểm, không EXP, không lấy từ kho đề thi, kiểm tra hay bài tập về nhà.

## 7. Nghiệm thu đo bằng máy

- vitest: `tests/nhat-ky-cong-1311.test.ts` (từng ngưỡng của cổng; cảnh sai số / không nguồn bị bỏ; dưới 4 cảnh thì không phát hành; ngưỡng Δχ lấy theo bảng trước, SGK sau), `tests/nhat-ky-luoc-do-1311.test.ts` (hai kịch bản mẫu hợp lược đồ; lược đồ không có trường tuỳ chọn, không null, không min / max), `tests/nhat-ky-khop-loi-1311.test.ts` (mốc khớp lời: bước bắt đầu đúng câu, đứng chờ câu kế, nhiều bước cùng một câu thì nối tiếp), `tests/nhat-ky-vung-net-1311.test.ts` (máy tính `nguon.vung` từ nét trong đoạn), `tests/nhat-ky-ve-1311.test.ts` (vé lớp khác đọc `nhat-ky.json`: bị chặn; bản phát hành không có `chep`), `tests/nhat-ky-khuon-1311.test.tsx` (7 khuôn dựng được; giảm chuyển động về hình cuối; máy yếu bỏ hạt và quầng; bảng phấn phóng 1 tới 5 lần).
- `tsc`, toàn bộ vitest so tên với `main`, `npm run build && npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0, `npm run check:mau` 0, `npm run kiem:co-tep`, `node scripts/kiem-sw.mjs`.
- Ảnh Chromium bản build thật 3 khổ, sáng và tối: 0 lỗi trang, 0 tràn, 0 đích bấm dưới 44 px, 0 lỗi chữ học sinh. Bản vẽ này: `soat.json` 15 ảnh, 0 lỗi trang, 0 tràn, 0 đích nhỏ, 0 chữ cắt, 0 lỗi chữ học sinh, 0 ảnh quá 150 KB (ảnh khổ 1366 chụp ở tỉ lệ điểm ảnh 2 rồi thu còn 1,5 lần để dưới 150 KB). `kiem-kich-ban.mjs`: tất cả đạt.
- Tác tử `toc-do` sau khi gộp: byte tải mở, chạm được, khung hình khi cuộn và khi đang giảng ở CPU ×4 và ×6.

## 8. Điều chưa chắc

1. **Độ đúng của Gemini Flash-Lite** khi nghe tiếng Việt có thuật ngữ Hoá và đọc chữ viết tay: chưa đo. Chạy thử trên 3 buổi đã có (không phát hành) rồi mới bật.
2. **Giới hạn của cổng**: cổng so cảnh với chữ chép bảng (`chep`) và lời Thầy (`loi`), mà cả hai cũng do Gemini viết. Một lời chép bịa mà tự khớp với nhau thì cổng không bắt được (số và hoá học sai thì vẫn bắt, vì máy tính lại). Cách bịt khi build: (a) gọi Gemini **hai lượt**: lượt 1 chỉ chép nguyên văn tiếng có giờ (không dựng cảnh), lượt 2 dựng cảnh và mỗi câu `loi` phải trích đúng từ bản chép lượt 1; (b) cảnh nói «có trên bảng» phải có **nét phấn thật** trong đoạn `tu` tới `den` (hoặc trước đó) ở đúng trang và cột, máy chủ kiểm bằng `net.bin`.
3. **Giờ câu nói** (`tu`, `den`) Gemini trả có thể lệch vài giây; nếu lệch nhiều, máy chủ khớp lại bằng giờ nét phấn (Thầy thường viết khi nói).
4. **Giá Gemini** tra qua kết quả tìm kiếm (trang giá ai.google.dev không mở thẳng được vì mạng của phiên chặn); số token ảnh chưa đo.
5. **`luoc-do.json` chưa gửi Gemini lần nào.** Lược đồ viết chặt theo luật chung của các bộ sinh JSON có ràng buộc (không trường tuỳ chọn, chỉ 3 chỗ anyOf, không null); cần một lượt gọi thật để xác nhận Gemini nhận đúng như vậy.
6. **Luật đáp án CLAUDE.md**: ngoại lệ 31/10 nói về câu luyện tập có tem niêm phong; câu Đoán nhanh trong nhật ký cần ghi thêm vào ngoại lệ đó khi build.
7. **Nhảy đúng phút** trong trình phát Xem lại từ nút «Nghe Thầy giảng đoạn này»: cần thêm «tới giờ T» (chạm `TrinhPhat.tsx`).
8. **Màu**: bản vẽ chép đúng giá trị biến màu của app học sinh, màn chiếu, bốn màu phấn; bản build phải dùng biến (không hex thô).
