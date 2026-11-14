---
name: video-tom-tat
description: Soạn «Video tóm tắt» của một buổi live (Xem lại Live, app học sinh) theo đúng các kĩ thuật thầy Đỗ Đại Học đã duyệt 14/11 — nghe lời Thầy bằng PhoWhisper, viết lời gọn phủ kín ý giảng, cắt đoạn gọi tên / nhắc lớp, giữ đoạn đùa, máy quay bám nét phấn, khung động bảng / minh hoạ, khoanh bảng theo lời, Em nhẩm trước, Đoán nhanh, phát chậm câu nhẩm số, tiếng chuẩn theo mẫu K12 — rồi đẩy lên app. Dùng khi thầy / lịch hẹn bảo làm video tóm tắt cho buổi live, hoặc sau mỗi buổi live (thay «nhật ký bài dạy» đã bỏ 14/11).
---

# Video tóm tắt sau mỗi buổi live

Thầy chốt 14/11: «live kết thúc văn phòng sẽ soạn luôn video tóm tắt đẩy lên app học sinh». Nhật ký bài dạy đã BỎ (không soạn nữa).

Video tóm tắt **không phải tệp mp4**: máy em tự vẽ (trang `public/video-bai/`) từ 3 tệp của buổi trên R2: `video-kb.json` (kịch bản), `video-net.json` (nét phấn có giờ), `video-am.m4a` (tiếng đã trộn). Có `video-kb.json` ⇒ thẻ «Video tóm tắt» tự hiện trong Xem lại Live của buổi.

Mẫu đã duyệt: `scripts/video-bai-giang/vi-du/k12-peptide-moi.json` (K12 Peptide 13/11) và `vi-du/k10-lien-ket-cht.json` (K10 Liên kết cộng hoá trị 12/11). Đọc một trong hai trước khi soạn.

## Luật cứng
- **Không đẩy main, không phát hành app.** Việc này chỉ ghi dữ liệu của buổi lên R2 (`/gv/live-video-ghi`, mã GV do proxy gắn). Cần hoạt hoạ MỚI (mã JS) thì ghi lại đề xuất cho phiên phát hành ban ngày, video tối nay dùng hoạt hoạ sẵn có.
- **Riêng tư:** chữ máy nghe (ASR), lời đã soạn, cấu hình của buổi, ảnh bảng ⇒ CHỈ trong thư mục tư liệu ngoài kho mã (kho mã công khai). Không in tên học sinh ra kênh công khai (log workflow, PR, issue).
- **Giữ đoạn đùa** (thầy 14/11 «giữ lại những đoạn đùa thú vị để giảm căng thẳng cho hs»): ví dụ / chuyện vui minh hoạ bài, kể cả có tên. **Cắt** đoạn quản lớp: nhắc tắt cửa sổ nổi, chia đôi màn hình, nhắn bố mẹ, bật / tắt mic, chờ em nói, gọi tên nhắc nhở, đọc tên em giơ tay.
- **Không bịa số:** mọi con số trên màn (χ, Δχ, M, mol, đáp án) phải lấy từ bảng Thầy viết hoặc lời Thầy nói, tính lại trước khi đưa vào. Ngưỡng / quy tắc ghi đúng như Thầy viết; lệch SGK thì ghi chú cho thầy, không tự sửa lời Thầy.
- Thuật ngữ GDPT 2018 (tên chất IUPAC tiếng Anh trong lời gọn khi Thầy đọc phiên âm: «oxygen», «carbon», «hydrogen»…). Lời học sinh đọc theo `docs/tu-duy-day-hoa-thay-2610.md`.
- **CẤM `wrangler d1 export`**.

## Quy trình (≈ 1–2 giờ sau khi live tắt; nghe lời chạy ~1× thời lượng)
1. **Tìm buổi cần làm:** `POST /gv/live-ds` (thân `{}`) ⇒ `buoi[]`. Buổi cần làm: `trangThai = "xong"`, đã tắt live (tức buổi không còn ghi), chưa có video: `HEAD /live-tep/<id>/video-kb.json?ve=<vé>` ⇒ 404. Có 200 rồi thì BỎ QUA (đã làm).
2. **Chuẩn bị (máy làm hết):**
   `bash scripts/video-bai-giang/chuan-bi-buoi.sh <buổi> <tư liệu>` — cài công cụ nếu thiếu (venv faster-whisper + PhoWhisper ~1,5 GB ở `~/.video-tom-tat`, fluidsynth, node_modules), tải tư liệu, khoảng lặng, `net-gio.json`, ảnh bảng `bang-*.jpg` (lưới toạ độ bảng rộng 1600), nghe lời ⇒ `nghe.txt` (câu có giờ) + `loi-asr-all.json` (giờ từng chữ).
3. **Đọc:** `nghe.txt` từ đầu tới cuối + mọi ảnh `bang-*.jpg`. Lập dàn: bài gồm những ý nào, mỗi ý ở đoạn giờ nào, Thầy viết gì ở vùng nào trên bảng. Giờ từng chữ: `python3 scripts/video-bai-giang/tu-asr.py <từ giây> <đến giây> <tư liệu>`.
4. **Chia phần (8–14 phần):** mỗi phần một ý trọn vẹn (định nghĩa · quy tắc · ví dụ · câu hỏi Thầy chữa · tổng kết). Bỏ đoạn đầu chỉnh loa / chờ lớp, đoạn hỏi đáp quản lớp.
5. **Viết spec lời** (`spec.json`): `{ "<id cảnh>": [[chữ, giờ chữ đầu, giờ chữ cuối, cờ?], …] }`
   - giờ = đúng giờ một chữ trong `loi-asr-all.json` (công cụ tìm chữ gần nhất trong ±0,03 s).
   - **phủ kín** mọi ý Thầy giảng trong phần (không chỉ ý chính); mỗi dòng ≤ ~25 chữ, ngắt dấu phẩy ở chỗ nghỉ tự nhiên (phụ đề hiện theo cụm dấu phẩy).
   - chữ = lời Thầy đã làm gọn: bỏ «ờ, à, thì, nhé» thừa, lặp chữ; sửa từ máy nghe sai (vd «hát hai ô» ⇒ H₂O, «e» ⇒ electron, «đen-ta khi» ⇒ Δχ, «một với đôi» ⇒ nối đôi); công thức viết đúng chỉ số (H₂O, CO₂, CH₄, NaOH). Không thêm ý Thầy không nói.
   - cờ cắt cứng: `"t"` đầu, `"d"` cuối, `"c"` cả hai — dùng khi ngay sát chữ đầu / cuối là đoạn phải cắt (gọi tên, quản lớp) mà không có quãng lặng. Không cờ ⇒ điểm cắt tự bám khoảng lặng ±0,45 s.
   - đoạn giữa hai dòng không có giọng: nét Thầy viết lúc đó vẫn chạy (tua nhanh) — đúng ý «nói tới đâu bảng tới đó».
6. **Viết cấu hình** (`cau-hinh.json`, mẫu ở `vi-du/`): xem «Cấu hình» dưới. Kiểm hình: `node scripts/video-bai-giang/dung-kich-ban.mjs <tư liệu> <cau-hinh> <ra>` rồi `node scripts/video-bai-giang/chup-khung.mjs <ra> anh <thư mục ảnh> <giây1,giây2,…>` — XEM ảnh ở các mốc hoạt hoạ / khoanh / Đoán nhanh / Em nhẩm / mở đầu / kết. Sửa tới khi không chữ nào đè, không hình nào tràn cột, tiêu đề mở đầu không mất dấu.
7. **Hoàn tất + đẩy:** `bash scripts/video-bai-giang/hoan-tat-buoi.sh <buổi> <tư liệu> <cau-hinh> <spec>` (sinh lời, dựng, soát phụ đề ngắt sai, liệt kê chữ nghi tên trong đoạn giọng, trộn tiếng chuẩn K12, tải lên, HEAD 200 + Range 206). Thêm `--khong-tai` để chạy thử không tải.
8. **Bấm thử với máy chủ thật:** `node scripts/video-bai-giang/may-xem-thu.mjs <thư mục bất kỳ> 8790` rồi `node scripts/video-bai-giang/thu-trang-xem.mjs "http://127.0.0.1:8790/video-bai/?id=<buổi>&ve=<vé đã mã hoá URI>&goc=https://omr.ttadodaihoc.workers.dev" <thư mục ảnh>` ⇒ 6/6 (bài không có Đoán nhanh: bước Đoán nhanh sẽ hỏng — ghi rõ).
9. **Báo thầy** (tiếng Việt, ngắn): buổi nào đã có «Video tóm tắt», dài bao lâu, mấy phần, có Đoán nhanh / Em nhẩm ở đâu, chỗ nào còn ngờ (tên viết theo tai nghe, số Thầy nói khác bảng…).

## Cấu hình (cau-hinh.json)
Đầu tệp: `ten`, `lop`, `ngay` («Thứ Năm 12/11/2026»), `netCoGio: true`, `loiAsr: "loi-asr-all.json"`,
`moDau: { kicker: "LIVE KHỐI 10 · THỨ NĂM 12/11", tieuDe: ≤ 10 kí tự (1–2 chữ, vd «PEPTIDE», «LIÊN KẾT»), phu: ≤ 50 kí tự, thay: "Thầy Đỗ Đại Học" }`,
`mucLuc: [[ "01–04", "ý", "vang|hong|ngoc|xanh" ], …]` (3–5 dòng, số khớp `so` của cảnh), `ket: { tieuDe: "Ghi nhớ", y: [≤ 6 ý, **in đậm** chỗ chốt] }`,
`anNet: [[x0, y0, x1, y1], …]` (tuỳ chọn: che nét trong vùng — chỉ khi Thầy dặn che).

Mỗi cảnh (`canh[]`):
| Trường | Dùng |
|---|---|
| `id` | tên cảnh tuỳ ý (`c1`…), `loiRieng`: `"loi-sach-<id>.json"` (công cụ sinh từ spec), `dong`: chỉ số dòng dùng (thường tất cả) |
| `so`, `tieuDe`, `mau` | số thẻ chương («01», «?» cho Đoán nhanh), tiêu đề ≤ 50 kí tự, màu |
| `vietThat`, `khungNet`, `phuDeCum` | luôn `true` (nét chạy nhịp thật · máy quay bám cụm nét · phụ đề theo cụm) |
| `cheDo` | khung động: `[["dau","bang"], [[dòng,"từ"],"minh"], …]` — `bang` = bảng gần cả màn (Thầy đã viết rõ, không cần hình) · `minh` = bảng + cột hoạt hoạ (khi có hình). Cảnh không hoạt hoạ ⇒ `[["dau","bang"]]` |
| `danhDau` | khoanh bảng đúng lúc Thầy nói: `{ neo: [x0,y0,x1,y1] (toạ độ trên ảnh bang-*.jpg), luc: [dòng,"từ"], toi?: neo hoạt hoạ, dai: giây }`. Đặt `luc` lúc Thầy đã VIẾT XONG vùng đó (vd «đóng khung công thức này lại») |
| `theNoi` | thẻ chữ nổi khi đang ở khung `bang`: `{ luc, giay, chu }` — chỉ ý chốt Thầy nói, ≤ 60 kí tự |
| `nham` | Em nhẩm trước (dừng + đếm 3-2-1) NGAY TRƯỚC câu Thầy nói kết quả tính: `{ truocDong, giay: 6, hoi: "Δχ của CH₄ = 2,55 − 2,2 = ?" }` |
| `cham` | phát chậm câu nhẩm số dày: `[[dòng, 0.85]]` |
| `doVui` | Đoán nhanh — chỉ khi câu hỏi lấy thẳng từ bài, Thầy có nói đáp án: `{ sauDong, giay: 6, hoi, luaChon: [["A","Có",false],["B","Không",true]] (phương án 1–3 chữ, ≤ 4 phương án), moDong, tom, moLuc: [dòng,"từ",0,lần] }` |
| `hoat` | hoạt hoạ có sẵn — chỉ khi đúng chủ đề (bảng dưới). Mốc `moc` = `[dòng, "từ", lệch giây?, lần thứ?]` (chữ trong lời đã soạn) |

Mốc chữ: `[3, "lệch"]` = lúc Thầy nói chữ chứa «lệch» lần đầu trong dòng 3 (giờ thật từ PhoWhisper). `[9, "không", 0, 2]` = lần thứ 2.

### Hoạt hoạ có sẵn (`public/video-bai/hoat-hoa*.js`)
| `loai` | Chủ đề | `p` · `moc` |
|---|---|---|
| `keo-co` | liên kết CHT phân cực / không phân cực / ion | `p: { trai:{ky,nhan}, phai:{ky,nhan}, manh:"trai"|"phai"|null, kieu:"phan-cuc"|"khong-phan-cuc"|"ion", so:">"|"="|"≫", ket }` · `moc: hien, keo, so, lech, delta, ket` |
| `thang-delta` | hiệu độ âm điện, ví dụ tính Δχ | `p: { max:3, ky, a:["O",3.44], b:["H",2.2], ket }` (không a/b ⇒ chỉ thang) · `moc: hien, v1, v2, v3, a, b, tinh, kq, kim, ket` |
| `lewis` | công thức electron O₂ / CO₂, phân tử phân cực? | `p: { ct:"O2"|"CO2", luc:true, ket }` · `moc: hien, chung, gach, luc, triet, ket` |
| `obitan` | liên kết σ / π (xen phủ trục / bên) | `moc: s, p, ss, sp, pp, pi, ket` |
| `dem-lk` | nối đơn / đôi / ba có mấy σ, π | `moc: don, doi, ba, kq1, kq2, kq3, ket` |
| `thu-vien`, `cau-truc`, `chuoi`, `hat`, `phuong-trinh`, `dong-phan`, `cat-lk`, `biuret`, `bazo` | amino acid, peptide, thuỷ phân, biuret | xem `vi-du/k12-peptide-moi.json` |

**MỌI cảnh nội dung PHẢI có hoạt hoạ** (thầy 14/11 «tất cả phải có hoạt hoạ đầy đủ như video K12»): đúng chủ đề ⇒ mô-đun có sẵn ở bảng trên; chủ đề khác ⇒ **`tu-do`** (dưới). Chỉ cảnh thuần dặn dò / tổng kết miệng mới được không có hình.

### `tu-do` — hoạt hoạ tự soạn bằng dữ liệu (`public/video-bai/hoat-hoa-5.js`)
Cột minh hoạ = **lưới 12 cột × hàng 56 px** (cao 640 ⇒ 11 hàng, 0–10). Mỗi phần tử một ô: `o` cột trái (0–11), `h` hàng trên, `r` số cột rộng, `c` số hàng cao (`o + r ≤ 12`, `h + c ≤ số hàng`). Không đặt hai phần tử chồng ô nhau.
| `kieu` | trường | dùng cho |
|---|---|---|
| `chu` | `chu` (**đậm** được), `co: lon|vua|nho`, `mau`, `ct: true` (tự chỉ số: `H2O` ⇒ H₂O, `SO4^2-` ⇒ SO₄²⁻), `nen: false` (bỏ nền thẻ) | ý chốt, ví dụ, công thức, kết luận |
| `nguyen-tu` | `ky`, `mau`, `nhan?` | nguyên tử / ion / chất (vòng tròn) — ô nên `r: 3, c: 2` |
| `lien-ket` | `tu`, `den` (id), `bac: 1|2|3` | nối hai nguyên tử (vẽ dần) |
| `mui-ten` | `tu`, `den`, `cong: 0|1|-1`, `nhan?` | phản ứng, chuyển hoá, «⇒» giữa hai ô |
| `so` | `gt`, `dv?` | con số lớn; bước `dem { gt }` cho số chạy tới giá trị mới (mol, gam, %, M) |
| `pt` | `tu: ['2H2', '+', 'O2', '→', '2H2O']` | phương trình; từng ô gọi bằng `<id>.<k>` (vd `pt1.4`) để sáng / gạch riêng |
| `cot` | `tieuDe: [trái, phải]`, `hang: [[chất, số], …]` | **sơ đồ cột dọc** của Thầy (chất | mol) — bước `hang { i }` hiện từng hàng |
| `khung` | `quanh: [id, …]` | khung sáng bao nhiều ô (nhấn kết quả) |
Bước (`p.buoc`): `{ moc, lam, id, … }` — `lam`: `hien` (mọi phần tử PHẢI có) · `an` · `di { o, h }` · `doi { chu }` · `sang` · `nay` · `gach` · `dem { gt }` · `hang { i }`. `moc` là TÊN mốc; khai giờ ở `hoat.moc: { m0: [dòng, "từ"], … }` (mốc lời thật). Tiếng động theo động tác tự có.
Nhịp: mỗi ý Thầy nói ⇒ 1 bước hình ngay lúc nói chữ đó (không dồn trước); 6–20 bước / cảnh; con số / kết quả xuất hiện đúng lúc Thầy nói số. Màu: `vang` (chính), `ngoc` (đúng / kết luận), `hong` (sai / chú ý), `xanh`, `tim`.
**Mẫu đã duyệt:** `scripts/video-bai-giang/vi-du/mau-tu-do-k10-c2.json` (định tính / định lượng: hai nguyên tử + liên kết, thẻ kết luận, ví dụ có chỉ số, CH₄ bị gạch, ba con số 19 / 17 / đếm tới 18, kết luận định lượng). Đặt `cheDo: [["dau","minh"]]` cho cảnh có `tu-do`.
**Cổng kiểm** `node scripts/video-bai-giang/kiem-hoat.mjs <ra>/kich-ban.json` (hoan-tat-buoi.sh tự chạy, hỏng là DỪNG): mốc rỗng, id sai, ngoài lưới / tràn đáy, thiếu bước `hien`, chữ quá dài cho ô, phương án Đoán nhanh > 24 kí tự, tiêu đề mở đầu > 12 kí tự.
**Giờ tải:** `tu-do` cần bản app có `hoat-hoa-5.js` (lên lượt phát hành 23:40 ngày 14/11). Đêm 14/11: cấu hình dùng `tu-do` ⇒ chỉ tải sau 23:50. Từ 15/11 tải lúc nào cũng được.

## Nhịp «gây nghiện» (thầy 14/11 «cắt cảnh hấp dẫn hơn và gây nghiện hơn»)
- **Không quá 10 giây màn hình đứng yên**: mỗi ≤ 10 s phải có điều mới — bước hoạt hoạ, khoanh bảng, máy quay tới chỗ Thầy viết, thẻ. Cổng kiểm in «NHỊP HÌNH: … quãng đứng yên > 12 s» ⇒ thêm bước `tu-do` / khoanh vào đúng quãng đó tới khi hết cảnh báo.
- **Cảnh ≤ 2,5 phút**; dài hơn ⇒ tách hai cảnh (thẻ chương mới = nhịp nghỉ cho mắt).
- **Mở vòng trước khi lộ**: Thầy sắp nói kết quả tính ⇒ Em nhẩm trước; Thầy hỏi lớp một câu có đáp án ⇒ Đoán nhanh; câu hỏi Thầy đặt đầu cảnh ⇒ đưa lên làm dòng đầu (thẻ / hình hỏi), câu trả lời để hình «sáng» đúng lúc Thầy nói.
- **Mỗi cảnh kết bằng một hình chốt** (thẻ kết luận + bước `sang`), không kết lửng.
- Đoạn đùa: giữ nguyên nhịp Thầy kể, thêm hình vui đúng chi tiết (số đếm, gạch, nảy) — không chèn chữ giải thích.
- Bộ dựng đã tự cắt quãng chết: thẻ chương 2,0 s, nối câu 0,18 s, đoạn Thầy viết im lặng tua ×1,9 (bản K10 19:25 ⇒ 17:17, K12 24:27 ⇒ 22:38).

## Đã có sẵn trong máy (không phải làm tay)
- Giọng chuẩn theo mẫu K12 (`mau-giong.json`): độ to −22,4 LUFS giọng ghép + EQ âm sắc theo phổ K12; nhạc + tiếng động mức K12; tổng −16 LUFS.
- Phụ đề ngắt cụm: không ngắt trong ngoặc / sát dấu phép tính, gộp cụm một chữ; số đứng riêng có ô sáng.
- Máy quay tới chỗ khoanh trước 0,7 s, về lại khung cũ; tiếng động theo mốc hoạt hoạ; mục lục «Hôm nay em học»; Ghi nhớ cuối bài.

## Xong khi
- `HEAD video-kb.json` 200 + `Range video-am.m4a` 206; bấm thử với máy chủ thật đạt; không phụ đề ngắt sai; không đoạn gọi tên nhắc nhở trong tiếng.
- Đã báo thầy kèm chỗ còn ngờ. Ghi một dòng Nhật ký `DIEU-PHOI.md` qua nhánh riêng [skip ci] (không phải main nếu đang 18:00–23:40 — dòng nhật ký không phát hành gì nên đẩy main cũng được).
