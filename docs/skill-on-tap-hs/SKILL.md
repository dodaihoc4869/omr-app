---
name: thiet-ke-on-tap-hs
description: Thiết kế trang ôn tập / tổng hợp lý thuyết Hoá cho học sinh của Thầy Đỗ Đại Học: giao diện kính của app, thần chú + lời Thầy, thẻ nhớ ngắt quãng, 4 cách ôn, bấm thử.
---

# Thiết kế trang ôn tập học sinh «wow»

Thầy 02/11/2026: «Sửa lại html tổng hợp lý thuyết siêu đẹp siêu trực quan hơn nữa. Học sinh phải wow», «việc tổng hợp lý thuyết phải qua skill lý thuyết của thầy
để giải thích theo hướng của thầy, trích xuất thần chú thầy giảng nếu có», «Làm theo giao diện kính của app hs hiện tại cho đồng bộ», «Thêm các kiểu ôn tập
xịn nhất trên thế giới», «Cho văn phòng thống nhất soạn hết theo html mới».

Mẫu chạy thật (em Ngọc Trung, Hoá 11 ba chương): https://ddh-tai-lieu.pages.dev/t/tong-hop-hoa-11-kinh-937d4ae9a9/
Mã: `docs/tai-lieu-hs/tong_hop_11_kinh.py` (dựng + đăng), khung `tong-hop-hoa-11-kinh.mau.html`, CSS `kinh-tai-lieu.css`, phông `docs/tai-lieu-hs/font/`.
Lớp kính dùng chung cho mọi trang văn phòng: `app/ddh_office/kinh.py`.

## Khi nào dùng
- Em / phụ huynh xin «tổng hợp kiến thức», «hệ thống lý thuyết», «đề cương», «ôn tập chương», «bảng tóm tắt».
- Thầy bảo làm tài liệu ôn, sổ tay thần chú, bộ thẻ nhớ cho một lớp.
- Nâng cấp một trang tài liệu cũ sang giao diện mới.

## Nguồn nội dung (không được lấy chỗ khác)
1. **Lý thuyết theo SGK Kết nối tri thức** lớp đó (luật `pham_vi_sgk.py`). Không đưa kiến thức ngoài SGK (vd độ bất bão hoà K không có trong Hoá 11 KNTT).
2. **Cách Thầy giảng**: `~/.claude/skills/giai-bai-phong-cach-thay/references/ly-thuyet.md` (1.370 kiến thức: các bước, «Mẹo», «Hay nhầm», «Thầy nói»)
   và `ky-thuat.md`. Grep theo tên bài / chủ đề. Trích:
   - **Thần chú**: dòng có chữ «thần chú» hoặc «Mẹo» ngắn gọn (vd «tăng thu, giảm toả», «khử cho, O nhận», «e độc thân là e đang FA», «phú dưỡng là môi trường bị gút»,
     «giống nhau thì chơi với nhau», «thụ động là có nhưng không ra sản phẩm», «trung gian vừa lên vừa xuống»). Ghi đúng chữ Thầy.
   - **Thầy nói**: chép nguyên văn từ dòng «Thầy nói:», chỉ sửa chính tả thuật ngữ sang SGK (axit → acid, bazơ → base). Không bịa câu Thầy không nói.
3. **Câu thử sức**: NGUYÊN VĂN kho đề (`kho_de.tra({"ma_de","phan","so"})` + `sang_form` để lấy đáp án chốt). Tìm: `PYTHONPATH=. .venv/bin/python -m ddh_office.kho_de tim --lop 11 --chu "<từ>"`
   (công thức trong kho viết chỉ số Unicode: tìm `HNO₃` chứ không `HNO3`). Bỏ câu có phương án mơ hồ. Ghi mã câu dưới mỗi câu.

## 10 cách ôn tốt nhất thế giới (đều đã có bằng chứng nghiên cứu) và cách đưa vào trang
| Cách | Vì sao hiệu quả | Trên trang |
|---|---|---|
| Tự kiểm tra (retrieval practice) | lôi kiến thức ra nhớ lâu hơn đọc lại 2-3 lần | thẻ lật, câu kho đề, «Viết hết ra» |
| Lặp lại ngắt quãng (spaced repetition) | ôn đúng lúc sắp quên | hộp Leitner 5 ngăn, hẹn 1 → 3 → 7 → 14 ngày, lưu trên máy em |
| Trộn bài (interleaving) | học phân biệt dạng như đề thi thật | «Trộn 3 chương»: câu các chương xáo lẫn |
| Tự chấm độ chắc (metacognition) | lộ ra hiểu nhầm «chắc mà sai» | trước khi chọn bấm «Chắc» hoặc «Đoán», cuối báo số câu chắc mà sai |
| Viết hết ra (free recall / brain dump) | biết mình nhớ gì, thiếu gì | ô viết tự do theo chương, mã soi ý chính có / thiếu |
| Giảng lại kiểu Feynman | giảng được cho người khác mới là hiểu | đề «giảng cho bạn: vì sao …», soi 4 ý mấu chốt |
| Hỏi vì sao (elaboration) | nối kiến thức với lý do | mặt sau thẻ luôn có «vì sao», bẫy hay nhầm kèm lời giải thích |
| Hình + chữ (dual coding) | hai đường vào trí nhớ | mỗi khái niệm một hình SVG động hoặc sơ đồ |
| Ví dụ cụ thể | khái niệm trừu tượng thành thứ thấy được | phản ứng thật (N₂ + 3H₂ ⇌ 2NH₃), muối thật (NH₄Cl) |
| Đoán trước (pretesting) và bấm thử | sai trước rồi sửa nhớ sâu hơn | phòng thí nghiệm bấm tác động, thẻ «bẫy» đoán rồi lật |

## Thẻ nhớ: ôn gì, viết thế nào
- **Một ý một thẻ**, mặt trước là CÂU HỎI (không phải tiêu đề), mặt sau tối đa 1-2 dòng, chữ khoá in đậm.
- Ưu tiên theo thứ tự: (1) thần chú và cách dùng, (2) điều kiện / ngoại lệ (chất rắn không vào K_C, Fe Al Cr thụ động, CO₂ không phải hữu cơ),
  (3) nhận biết bằng thuốc thử + hiện tượng, (4) «vì sao» của tính chất (cặp e chưa liên kết → base yếu), (5) bẫy đề hay ra, (6) công thức + đơn vị.
- Thêm thẻ ĐẢO cho cặp dễ lẫn (acid cho H⁺ / base nhận H⁺; chưng cất / chiết).
- 20-30 thẻ một chương là vừa; nhiều hơn thì chia bộ.
- Không đưa số liệu dễ sai không có trong SGK (khoảng số sóng IR cụ thể: chỉ ghi «~3300 cm⁻¹ rộng», «~1700 cm⁻¹ nhọn»).

## Các khối tương tác hay nhất (chọn theo loại kiến thức)
- **Phòng thí nghiệm bấm tác động**: kiến thức «đổi điều kiện → kết quả» (chuyển dịch cân bằng, HNO₃ đặc/loãng với kim loại). Nút tác động, bi trượt / vế sáng, lời giải + thần chú hiện ra.
- **Thang bậc**: số oxi hoá N, S (thấp nhất → chỉ khử, cao nhất → chỉ oxi hoá, trung gian → cả hai), dãy hoạt động, chu kì.
- **Phân loại chạm từng chip**: hữu cơ hay vô cơ, chất điện li mạnh / yếu, oxide acid / base.
- **Thanh kéo**: đại lượng liên tục (pH ↔ [H⁺], (CH₂O)ₙ ↔ CTPT + M).
- **Ghép tình huống → cách làm**: phương pháp tách tinh chế, chọn thuốc thử nhận biết.
- **Đặt cạnh nhau**: đồng phân (cùng CTPT khác cấu tạo), liên kết đơn / đôi / ba (σ, π).
- **Thẻ bẫy lật dọc**: đỏ «hay nhầm» → xanh «đúng là».
- **SVG động nhẹ**: hạt chạy hai chiều cho cân bằng động, liên kết ba nhấp nháy, phổ IR có đỉnh ghi chú.
- **Bộ thần chú vuốt ngang** đầu trang: thẻ gradient chàm-hồng, chạm lật xem cách dùng + ví dụ.
- Câu kho đề cuối mỗi chương (3 câu) + bộ đếm «x/9 câu đúng ngay lần đầu», pháo giấy khi đúng.

## Giao diện «Kính» của app học sinh (bắt buộc)
- Màu CHỈ dùng biến `--tr-*` chép từ omr-app `docs/ban-ve-ban-sac-hs-0211/token.css` (sáng + tối, tự theo máy). Không tự thêm màu.
- Nền loang 4 màu (chàm, tin, tím hồng, sao) trên `--tr-nen`; thẻ kính `color-mix(--tr-mat 62%)` + `backdrop-filter: blur(26px) saturate(170%)`, bo 30px,
  viền sáng mép trên, bóng mềm; máy không blur thì mặt đặc.
- Nút chính viên thuốc `--tr-hs-day`, chữ thường đậm 800, không in hoa. Thanh điều hướng nổi dạng kính, mục đang xem nền `--tr-hs-nhat`.
- Phông ĐĐH Rounded của app (`/font/ddh-rounded-*.woff2` trong tai-lieu-web; giấy phép OFL), lùi Be Vietnam Pro.
- Đúng, sai, chú ý: `--tr-dung-*`, `--tr-sai-*`, `--tr-sao-*`. Thần chú: hộp `--tr-sao-nhat` chữ `--tr-sao-chu`. «Thầy nói»: bong bóng kính + chấm tròn chữ «Đ».

## Soát trước khi đăng (đã từng lỗi)
1. Đo ở bề rộng 340 px: không phần tử nào tràn ngang; mặt sau thẻ không tràn (thẻ tự nới chiều cao bằng JS theo mặt sau dài nhất).
2. **Bẫy flex**: hộp `display:flex/grid` chứa chữ lẫn `<sub>`, `<sup>`, `<b>` thì mỗi mảnh thành một cột (CH₂ bị tách dòng). Bọc nội dung trong `<span>` / `<div>`.
   Soát bằng script: mọi hộp flex/grid có cả nút chữ lẫn thẻ sub/sup/b là lỗi (trừ nút phương án «A.» + chữ).
3. `tai_lieu_zalo.soat_trang(h)` rỗng (không còn ^ _ $ thô, công thức đủ chỉ số). Không LaTeX.
4. `localStorage` luôn bọc try/catch; trang chạy đủ khi không lưu được.
5. Màu canvas (pháo giấy) dùng mã hex, không dùng `var()`.
6. Mở link thật sau khi đăng, kiểm phông tải được (`document.fonts.check('800 16px "DDH Rounded"')`) và chụp màn sáng + tối.

## Dựng và đăng
```
cd app && PYTHONPATH=. .venv/bin/python ../docs/tai-lieu-hs/tong_hop_11_kinh.py ../docs/tai-lieu-hs/<ra>.html --dang <slug-moi>
```
Chép tệp này làm mẫu cho lớp / chương khác: đổi `CAU` (mã câu kho), nội dung các `<article class="the">`, mảng `TC` (thần chú), `THE` (thẻ nhớ),
`Y` (ý chính cho «Viết hết ra»), `GIANG` (đề Feynman). Gửi em bằng `/api/tn/gui-tin` (giọng Thầy, gọi «e», kèm link), không gửi tệp .md.

---

# Phụ lục (để dùng được ở máy khác, không cần kho mã của văn phòng)

## A. CSS giao diện «Kính» (`kinh-tai-lieu.css`)
Màu chép nguyên văn token app học sinh (sáng + tối). Phông ĐĐH Rounded gọi ở `/font/ddh-rounded-*.woff2`; không có tệp phông thì tự lùi về Be Vietnam Pro.

```css
/* Trang tài liệu học sinh theo hệ «Kính» của app học sinh (omr-app docs/ban-ve-ban-sac-hs-0211/v2/kinh.css, 02/11/2026).
   Màu: CHỈ biến --tr-* chép nguyên văn token.css của app (sáng + tối). Phông ĐĐH Rounded của app. Máy yếu / không blur: kính thành mặt đặc. */
@font-face{font-family:'DDH Rounded';font-weight:100 549;font-display:swap;src:url('/font/ddh-rounded-de-vietnamese.woff2') format('woff2');unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:'DDH Rounded';font-weight:100 549;font-display:swap;src:url('/font/ddh-rounded-de-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0394,U+03B1-03B2,U+2000-206F,U+2070-208F,U+20AC,U+2103,U+2190-2193,U+21C4,U+21CC,U+2212,U+2264-2265,U+FEFF,U+FFFD}
@font-face{font-family:'DDH Rounded';font-weight:550 1000;font-display:swap;src:url('/font/ddh-rounded-dam-vietnamese.woff2') format('woff2');unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:'DDH Rounded';font-weight:550 1000;font-display:swap;src:url('/font/ddh-rounded-dam-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0394,U+03B1-03B2,U+2000-206F,U+2070-208F,U+20AC,U+2103,U+2190-2193,U+21C4,U+21CC,U+2212,U+2264-2265,U+FEFF,U+FFFD}
:root{
  --tr-nen:#f6f6fc;--tr-mat:#ffffff;--tr-mat-2:#f0f0fa;--tr-mat-3:#e1e1f1;--tr-vien:#e2e2f0;--tr-vien-2:#cbcbe3;
  --tr-chu:#1b1938;--tr-chu-2:#454367;--tr-chu-3:#5a587d;--tr-trang:#ffffff;
  --tr-dung:#00d396;--tr-dung-nhat:#c5ffe8;--tr-dung-chu:#007c58;--tr-dung-nut:#00a87b;
  --tr-sai:#f4417c;--tr-sai-nhat:#fddfe9;--tr-sai-chu:#c70b5b;
  --tr-chu-y:#ff8c51;--tr-chu-y-nhat:#ffeee0;--tr-chu-y-chu:#b24f19;--tr-chu-y-nut:#f06b27;
  --tr-tin:#00bed8;--tr-tin-nhat:#dbf5fa;--tr-tin-chu:#007889;
  --tr-sao:#ffbf35;--tr-sao-nhat:#fff5d4;--tr-sao-chu:#956400;
  --tr-tim:#f373ce;--tr-tim-chu:#b33d95;
  --tr-hs:#8f9bff;--tr-hs-nut:#767eff;--tr-hs-day:#5e64cd;--tr-hs-nhat:#eeeeff;--tr-hs-chu:#565bbd;--tr-hs-tren:#ffffff;
  --tr-phu:rgba(75,75,75,.5);
  color-scheme:light dark;
}
@media (prefers-color-scheme:dark){:root{
  --tr-nen:#1a1a29;--tr-mat:#262738;--tr-mat-2:#2c2d40;--tr-mat-3:#414157;--tr-vien:#414157;--tr-vien-2:#52536a;
  --tr-chu:#f1f0ff;--tr-chu-2:#cdceeb;--tr-chu-3:#acaece;--tr-trang:#1a1a29;
  --tr-dung:#00d497;--tr-dung-nhat:#18382a;--tr-dung-chu:#00df9f;--tr-dung-nut:#00d497;
  --tr-sai:#f7498f;--tr-sai-nhat:#43272f;--tr-sai-chu:#ff9bba;
  --tr-chu-y:#ff9447;--tr-chu-y-nhat:#422a1a;--tr-chu-y-chu:#ffa569;--tr-chu-y-nut:#ff9447;
  --tr-tin:#00bfd4;--tr-tin-nhat:#0e373d;--tr-tin-chu:#00d5ed;
  --tr-sao:#ffc735;--tr-sao-nhat:#3b2f14;--tr-sao-chu:#ecb400;
  --tr-tim:#e17beb;--tr-tim-chu:#f592ff;
  --tr-hs:#a8adff;--tr-hs-nut:#a8adff;--tr-hs-day:#7e80ff;--tr-hs-nhat:#2c2e47;--tr-hs-chu:#b1b6ff;--tr-hs-tren:#1a1a29;
  --tr-phu:rgba(0,0,0,.6);
}}
:root{
  --kinh:color-mix(in oklab,var(--tr-mat) 62%,transparent);
  --kinh-dam:color-mix(in oklab,var(--tr-mat) 80%,transparent);
  --kinh-vien:color-mix(in oklab,var(--tr-mat) 85%,transparent);
  --kinh-bong:0 24px 48px -28px var(--tr-phu),0 2px 6px -3px var(--tr-phu);
  --mo:blur(26px) saturate(170%);
  /* tên ngắn dùng trong trang */
  --chu:var(--tr-chu);--nhat:var(--tr-chu-3);--mo-chu:var(--tr-chu-3);
  --vang:var(--tr-sao-chu);--xanh:var(--tr-tin-chu);--hong:var(--tr-sai-chu);--la:var(--tr-dung-chu);--lam:var(--tr-tin);
  --cam:var(--tr-chu-y-chu);--tim:var(--tr-hs-nut);--do:var(--tr-sai);
}
@media (prefers-color-scheme:dark){:root{--kinh:color-mix(in oklab,var(--tr-mat) 58%,transparent);--kinh-dam:color-mix(in oklab,var(--tr-mat) 78%,transparent);--kinh-vien:color-mix(in oklab,var(--tr-chu) 16%,transparent)}}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'DDH Rounded','Be Vietnam Pro',ui-rounded,system-ui,sans-serif;color:var(--tr-chu);font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased;
  font-variant-numeric:tabular-nums;overflow-x:hidden;min-height:100dvh;background-attachment:fixed;
  background:radial-gradient(70% 38% at 8% 4%,color-mix(in oklab,var(--tr-hs) 42%,transparent),transparent 72%),
    radial-gradient(55% 32% at 98% 22%,color-mix(in oklab,var(--tr-tin) 34%,transparent),transparent 72%),
    radial-gradient(70% 36% at 80% 100%,color-mix(in oklab,var(--tr-tim) 30%,transparent),transparent 72%),
    radial-gradient(50% 30% at 0% 70%,color-mix(in oklab,var(--tr-sao) 18%,transparent),transparent 72%),var(--tr-nen)}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;touch-action:manipulation;text-align:inherit}
sub,sup{font-size:.72em;line-height:0}
b{font-weight:800}
.khung{max-width:560px;margin:0 auto;padding:0 16px 96px}

/* KÍNH */
.kinh,.the,.chu-than .mat,.cau,.so div,.boi-on{background:var(--kinh);-webkit-backdrop-filter:var(--mo);backdrop-filter:var(--mo);
  box-shadow:inset 0 1px 0 var(--kinh-vien),inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 50%,transparent),var(--kinh-bong)}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.kinh,.the,.chu-than .mat,.cau,.so div,.boi-on{background:var(--tr-mat)}}
.o-kinh{background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}

/* HERO */
.hero{padding:30px 0 6px;position:relative}
.nhan{display:inline-flex;gap:8px;align-items:center;font-size:13px;font-weight:800;color:var(--tr-hs-chu);background:var(--tr-hs-nhat);padding:6px 12px;border-radius:99px}
.hero h1{font-size:40px;line-height:1.04;font-weight:800;margin:14px 0 10px;letter-spacing:-.02em;padding-right:96px}
.hero h1 span{color:var(--tr-hs-chu)}
.hero p{color:var(--tr-chu-2);font-size:15.5px;font-weight:600}
.so{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0 4px}
.so div{border-radius:22px;padding:12px 8px;text-align:center}
.so b{display:block;font-size:30px;line-height:1.05;letter-spacing:-.03em}
.so small{color:var(--tr-chu-3);font-size:12.5px;font-weight:700}
.phan-tu{position:absolute;right:-2px;top:52px;width:96px;height:96px;pointer-events:none}
.phan-tu ellipse{stroke:var(--tr-hs)}
.phan-tu circle{fill:var(--tr-sao)}

/* ĐIỀU HƯỚNG nổi kiểu thanh công cụ kính */
.dieu-huong{position:sticky;top:8px;z-index:20;margin:14px 0 0;padding:6px;border-radius:30px;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;
  background:var(--kinh);-webkit-backdrop-filter:var(--mo);backdrop-filter:var(--mo);box-shadow:inset 0 1px 0 var(--kinh-vien),inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 50%,transparent),var(--kinh-bong)}
.dieu-huong::-webkit-scrollbar{display:none}
.dieu-huong a{flex:none;text-decoration:none;color:var(--tr-chu-2);font-weight:750;font-size:13.5px;padding:9px 13px;border-radius:24px}
.dieu-huong a.on{color:var(--tr-hs-chu);background:var(--tr-hs-nhat)}

/* MỤC */
.muc{margin-top:34px}
.muc-dau{display:flex;gap:12px;align-items:center;margin-bottom:14px}
.muc-dau .ico{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;font-size:24px;flex:none;background:var(--kinh-dam)!important;box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.muc-dau h2{font-size:23px;line-height:1.2;font-weight:800;letter-spacing:-.01em}
.muc-dau small{display:block;color:var(--tr-chu-3);font-size:13.5px;font-weight:600}

/* THẦN CHÚ */
.boi{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 16px 18px;margin:0 -16px;scrollbar-width:none}
.boi::-webkit-scrollbar{display:none}
.chu-than{flex:none;width:80%;max-width:340px;scroll-snap-align:center;perspective:900px;height:232px;cursor:pointer}
.chu-than .lat{position:relative;width:100%;height:100%;transition:transform .6s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d}
.chu-than.mo .lat{transform:rotateY(180deg)}
.chu-than .mat{position:absolute;inset:0;border-radius:30px;padding:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
.chu-than .mat.truoc{background:linear-gradient(150deg,color-mix(in oklab,var(--tr-hs-nut) 92%,transparent),color-mix(in oklab,var(--tr-tim) 80%,transparent));color:#fff}
.chu-than .mat.truoc::before{content:"";position:absolute;width:180px;height:180px;right:-50px;top:-60px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 65%);animation:troi 6s ease-in-out infinite alternate}
@keyframes troi{to{transform:translate(-30px,40px)}}
.chu-than .mat.sau{transform:rotateY(180deg);font-size:14.5px;line-height:1.42;color:var(--tr-chu);font-weight:600;justify-content:center;gap:8px;padding:16px}
.mat .so-tc{font-size:12px;font-weight:800;letter-spacing:.06em;position:relative;opacity:.9}
.mat .loi{font-size:28px;line-height:1.12;font-weight:800;position:relative;letter-spacing:-.01em}
.mat .goi{font-size:13px;position:relative;opacity:.85;font-weight:700}
.mat.sau .vd{border-radius:16px;padding:9px 11px;font-size:14px;background:var(--tr-hs-nhat);color:var(--tr-hs-chu);font-weight:700}
.cham{display:flex;justify-content:center;gap:6px;margin-top:-4px}
.cham i{width:6px;height:6px;border-radius:9px;background:var(--tr-vien-2);transition:.3s}
.cham i.on{width:20px;background:var(--tr-hs-nut)}

/* THẺ KIẾN THỨC */
.the{border-radius:30px;padding:18px;margin-bottom:14px;position:relative;overflow:hidden}
.the h3{font-size:19px;font-weight:800;line-height:1.3;margin-bottom:8px;display:flex;gap:10px;align-items:center;letter-spacing:-.005em}
.the h3 em{font-style:normal;font-size:12px;font-weight:800;color:var(--tr-hs-tren);background:var(--tr-hs-nut);border-radius:9px;padding:3px 8px;flex:none}
.the p{color:var(--tr-chu-2);font-size:15.5px;font-weight:550}
.the p+p{margin-top:8px}
.the p b{color:var(--tr-chu)}
.hien{opacity:0;transform:translateY(22px);transition:opacity .6s,transform .6s cubic-bezier(.2,.8,.2,1)}
.hien.ra{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.hien{opacity:1;transform:none}*{animation:none!important}}

.thay-noi{margin-top:14px;display:flex;gap:10px;align-items:flex-end}
.thay-noi .av{width:38px;height:38px;border-radius:50%;flex:none;background:var(--tr-hs-day);display:grid;place-items:center;font-weight:800;color:var(--tr-hs-tren);font-size:15px}
.thay-noi .bong{border-radius:20px 20px 20px 6px;padding:10px 13px;font-size:14.5px;font-weight:600;color:var(--tr-chu-2);background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.thay-noi .bong small{display:block;color:var(--tr-hs-chu);font-weight:800;font-size:11.5px;letter-spacing:.05em;margin-bottom:2px}
.tc-nho{display:block;margin-top:12px;background:var(--tr-sao-nhat);border-radius:18px;padding:10px 13px;font-weight:800;color:var(--tr-sao-chu);font-size:15px}

/* SVG cân bằng động */
.svg-cb{width:100%;height:auto;margin:12px 0 4px;display:block}
.svg-cb rect{fill:var(--kinh-dam);stroke:var(--tr-vien)}
.svg-cb text{fill:var(--tr-chu)} .svg-cb text.phu{fill:var(--tr-chu-3)}
.svg-cb .t1{fill:var(--tr-tin-chu)} .svg-cb .t2{fill:var(--tr-sai-chu)}
.hat{animation:chay 2.4s linear infinite;fill:var(--tr-hs-nut)}
.hat.n{animation-name:chayn;fill:var(--tr-tim)}
@keyframes chay{from{transform:translateX(0)}to{transform:translateX(200px)}}
@keyframes chayn{from{transform:translateX(0)}to{transform:translateX(-200px)}}

/* Kc */
.kc{margin:14px 0 6px;border-radius:24px;padding:16px 12px;text-align:center;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.kc .pt{font-size:16px;font-weight:750;color:var(--tr-chu-3);margin-bottom:12px}
.phan-so{display:inline-grid;grid-template-columns:auto auto;align-items:center;gap:10px;font-size:20px;font-weight:800}
.phan-so .tu{border-bottom:2.5px solid var(--tr-chu);padding:0 8px 6px;color:var(--tr-dung-chu)}
.phan-so .mau{padding:6px 8px 0;color:var(--tr-sai-chu)}
.chip-ran{display:inline-block;margin-top:14px;font-size:13.5px;font-weight:700;color:var(--tr-chu-2);background:var(--tr-sai-nhat);padding:6px 11px;border-radius:14px}
.chip-ran s{color:var(--tr-sai-chu);font-weight:800}
input[type=range]{width:100%;margin-top:12px;accent-color:var(--tr-hs-nut)}

/* LE CHATELIER */
.lab{margin-top:12px;border-radius:26px;padding:14px;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.pt-lab{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:17px;gap:6px}
.pt-lab .ve{flex:1;text-align:center;padding:10px 4px;border-radius:16px;transition:.5s}
.pt-lab .ve small{display:block;font-size:12px;font-weight:700;color:var(--tr-chu-3)}
.pt-lab .mui{font-size:26px;color:var(--tr-hs-chu);flex:none}
.pt-lab .ve.thang{background:var(--tr-dung-nhat);color:var(--tr-dung-chu);transform:scale(1.06)}
.dh{text-align:center;font-size:13px;font-weight:650;color:var(--tr-chu-3);margin:6px 0 10px}
.thanh{position:relative;height:54px;margin:4px 6px 12px}
.thanh .ray{position:absolute;left:0;right:0;top:25px;height:5px;border-radius:5px;background:linear-gradient(90deg,var(--tr-sai),var(--tr-sao),var(--tr-dung))}
.thanh .bi{position:absolute;top:8px;left:50%;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--tr-hs) 45%,var(--tr-hs-day));
  box-shadow:0 8px 20px -6px var(--tr-hs-day);transition:left .9s cubic-bezier(.3,1.4,.4,1)}
.thanh .l,.thanh .r{position:absolute;top:36px;font-size:12px;color:var(--tr-chu-3);font-weight:750}
.thanh .l{left:0}.thanh .r{right:0}
.nut{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.nut button,.chip button,.muoi button,.tab button,.on-nut button{font-weight:750;font-size:14.5px;color:var(--tr-chu);border-radius:18px;padding:10px 12px;transition:.2s;
  background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 70%,transparent)}
.nut button:active,.chip button:active,.muoi button:active,.on-nut button:active{transform:scale(.97)}
.nut button.chon,.muoi button.chon,.tab button.chon,.chip button.chon{background:var(--tr-hs-day);color:var(--tr-hs-tren);box-shadow:0 12px 24px -14px var(--tr-hs-day)}
.giai{margin-top:12px;min-height:64px;border-radius:20px;padding:11px 13px;font-size:14.5px;font-weight:600;color:var(--tr-chu-2);background:var(--tr-hs-nhat)}
.giai b{color:var(--tr-hs-chu)}
.giai .tc{display:inline-block;margin-top:6px;font-size:13px;font-weight:800;color:var(--tr-sao-chu);background:var(--tr-sao-nhat);border-radius:10px;padding:2px 9px}

/* HAY NHẦM */
.nham{display:grid;gap:10px;margin-top:12px}
.nham .o{perspective:800px;height:120px;cursor:pointer}
.nham .lat{position:relative;height:100%;transition:transform .55s;transform-style:preserve-3d}
.nham .o.mo .lat{transform:rotateX(180deg)}
.nham .m{position:absolute;inset:0;border-radius:22px;padding:12px 14px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;gap:10px;align-items:center;font-size:14.5px;font-weight:650}
.nham .m.a{background:var(--tr-sai-nhat);color:var(--tr-chu)}
.nham .m.b{background:var(--tr-dung-nhat);color:var(--tr-chu);transform:rotateX(180deg)}
.nham .m .k{font-size:22px;flex:none}
.nham .m small{display:block;font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--tr-chu-3)}

/* MUỐI */
.muoi,.chip{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.kq-muoi{margin-top:12px;border-radius:20px;padding:12px;font-size:14.5px;min-height:96px;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.ion{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center}
.ion span{border-radius:12px;padding:4px 10px;font-weight:800;font-size:14px}
.moi-truong{display:inline-block;margin-top:6px;font-weight:800;border-radius:11px;padding:3px 11px;color:#fff}

/* pH */
.ph-thang{position:relative;height:30px;border-radius:15px;margin:16px 0 8px;background:linear-gradient(90deg,#ff3b3b,#ff8a3d 20%,#ffd54d 38%,#6ee07a 50%,#38c6e1 64%,#4d7bff 80%,#8f4dff)}
.ph-thang .kim{position:absolute;top:-8px;width:6px;height:46px;border-radius:6px;background:var(--tr-mat);box-shadow:0 0 0 2px var(--tr-chu),0 6px 14px -4px var(--tr-phu);transform:translateX(-3px);transition:left .15s}
.ph-so{display:flex;justify-content:space-between;font-size:12px;color:var(--tr-chu-3);font-weight:750}
.ph-kq{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.ph-kq div{border-radius:18px;padding:9px 12px;font-size:13px;font-weight:700;color:var(--tr-chu-3);background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.ph-kq b{display:block;font-size:20px;color:var(--tr-chu)}

/* thang số oxi hoá */
.tab{display:flex;gap:8px;margin:12px 0 10px}
.thang-soh{display:flex;flex-direction:column-reverse;gap:6px}
.bac{display:flex;align-items:center;gap:10px;border-radius:18px;padding:8px 12px;cursor:pointer;transition:.25s;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.bac .s{width:44px;text-align:center;font-weight:800;font-size:17px;flex:none}
.bac .c{font-weight:800;font-size:15px;flex:1}
.bac .t{font-size:12px;font-weight:800;border-radius:9px;padding:2px 9px;flex:none}
.bac.chon{box-shadow:inset 0 0 0 2px var(--tr-hs-nut);transform:translateX(4px)}
.n2{display:block;width:100%;height:auto;margin:10px 0}
.lk{stroke-dasharray:6 6;animation:dien 1.2s linear infinite;stroke:var(--tr-sao)}
@keyframes dien{to{stroke-dashoffset:-24}}
.n2 .nt{fill:var(--tr-hs-nut)} .n2 .nt-chu{fill:var(--tr-hs-tren)}
.n2 .ir{stroke:var(--tr-tin-chu)} .n2 .ir-oh{fill:var(--tr-sai-chu)} .n2 .ir-co{fill:var(--tr-sao-chu)} .n2 .ir-phu{fill:var(--tr-chu-3)} .n2 .ir-ke{stroke:var(--tr-vien)}
.pt-bo{margin-top:10px;display:grid;gap:8px}
.pt-bo div{border-radius:18px;padding:10px 12px;font-weight:750;font-size:14.5px;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.pt-bo small{display:block;font-weight:600;color:var(--tr-chu-3);font-size:13px;margin-top:2px}
.dong{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;font-weight:800;font-size:14.5px}
.dong span{border-radius:12px;padding:5px 10px;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.dong i{font-style:normal;color:var(--tr-hs-chu)}
.chip button.co{background:var(--tr-dung-nhat);color:var(--tr-dung-chu);box-shadow:inset 0 0 0 2px var(--tr-dung-nut)}
.chip button.khong{background:var(--tr-sai-nhat);color:var(--tr-sai-chu);box-shadow:inset 0 0 0 2px var(--tr-sai)}
.chip-kq{margin-top:10px;font-size:14.5px;font-weight:650;color:var(--tr-chu-2);min-height:44px}
.tach{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.tach div{border-radius:20px;padding:11px;font-size:13px;font-weight:600;color:var(--tr-chu-3);transition:.3s;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.tach div b{display:block;color:var(--tr-chu);font-size:15px;margin-bottom:2px}
.tach div.sang{box-shadow:inset 0 0 0 2px var(--tr-tin);background:var(--tr-tin-nhat);transform:scale(1.03)}
.dp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.dp div{border-radius:20px;padding:12px 8px;text-align:center;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.dp .ct{font-weight:800;font-size:15.5px}
.dp .ct i{font-style:normal;color:var(--tr-sai-chu)}
.dp small{display:block;color:var(--tr-chu-3);font-size:12.5px;font-weight:650;margin-top:6px}
.cung{margin-top:8px;text-align:center;font-weight:800;color:var(--tr-hs-chu);font-size:14.5px}
.lk-bang{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;text-align:center}
.lk-bang div{border-radius:18px;padding:10px 4px;font-size:12.5px;font-weight:650;color:var(--tr-chu-3);background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.lk-bang b{display:block;font-size:20px;color:var(--tr-chu);letter-spacing:.06em}

/* CÂU KHO ĐỀ (giống màn làm câu của app) */
.chuong-tieu{margin:24px 4px 12px;font-size:14px;font-weight:800;color:var(--tr-chu-3)}
.cau{border-radius:30px;padding:16px;margin-bottom:12px}
.cau .ma{display:inline-block;font-size:12px;color:var(--tr-tin-chu);background:var(--tr-tin-nhat);font-weight:800;margin-bottom:8px;border-radius:10px;padding:2px 9px}
.cau .de{font-weight:700;font-size:16px;margin-bottom:6px;white-space:pre-line}
.cau button{display:flex;gap:10px;width:100%;font-size:15px;font-weight:650;color:var(--tr-chu);border-radius:20px;padding:11px 13px;margin-top:8px;transition:.25s;
  background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 70%,transparent)}
.cau button b{color:var(--tr-hs-chu);flex:none}
.cau button.dung{background:var(--tr-dung-nhat);box-shadow:inset 0 0 0 2px var(--tr-dung-nut)}
.cau button.sai{background:var(--tr-sai-nhat);box-shadow:inset 0 0 0 2px var(--tr-sai);animation:rung .4s}
@keyframes rung{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.cau .vi-sao{display:none;margin-top:10px;font-size:14.5px;font-weight:650;color:var(--tr-chu-2);background:var(--tr-hs-nhat);border-radius:18px;padding:10px 12px}
.cau.xong .vi-sao{display:block}
.cau .chac{display:flex;gap:8px;margin-top:10px;font-size:13px;font-weight:700;color:var(--tr-chu-3);align-items:center;flex-wrap:wrap}
.cau .chac button{display:inline-flex;width:auto;margin:0;padding:6px 12px;font-size:13px;border-radius:14px}
.cau .chac button.chon{background:var(--tr-hs-day);color:var(--tr-hs-tren)}
.dem{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) translateY(90px);z-index:40;background:var(--tr-hs-day);color:var(--tr-hs-tren);font-weight:800;font-size:14.5px;
  padding:11px 18px;border-radius:99px;box-shadow:0 18px 32px -16px var(--tr-hs-day);transition:transform .4s cubic-bezier(.3,1.4,.4,1);white-space:nowrap}
.dem.hien-dem{transform:translateX(-50%)}
.chan{margin-top:36px;text-align:center;color:var(--tr-chu-3);font-size:13px;font-weight:650}
canvas#phao{position:fixed;inset:0;pointer-events:none;z-index:50}

/* PHÒNG ÔN TẬP */
.boi-on{border-radius:30px;padding:16px}
.tab-on{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.tab-on button{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:22px;background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent);transition:.2s}
.tab-on button b{font-size:15px}
.tab-on button small{font-size:12px;font-weight:650;color:var(--tr-chu-3);line-height:1.3}
.tab-on button.chon{background:var(--tr-hs-day);color:var(--tr-hs-tren);box-shadow:0 14px 26px -14px var(--tr-hs-day)}
.tab-on button.chon small{color:color-mix(in oklab,var(--tr-hs-tren) 80%,transparent)}
.on-o{margin-top:14px;display:none}
.on-o.mo{display:block}
.on-o .huong{font-size:14px;font-weight:650;color:var(--tr-chu-3);margin-bottom:10px}
.the-nho{perspective:900px;height:190px;cursor:pointer}
.the-nho .lat{position:relative;height:100%;transition:transform .55s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d}
.the-nho.mo .lat{transform:rotateY(180deg)}
.the-nho .m{position:absolute;inset:0;border-radius:26px;padding:16px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;justify-content:center;text-align:center;font-size:18px;font-weight:800;line-height:1.35}
.the-nho .m.a{background:linear-gradient(150deg,var(--tr-hs-nut),color-mix(in oklab,var(--tr-tin) 75%,var(--tr-hs-nut)));color:#fff}
.the-nho .m.b{background:var(--tr-mat);color:var(--tr-chu);transform:rotateY(180deg);font-size:16px;box-shadow:inset 0 0 0 1px var(--tr-vien)}
.the-nho .m small{display:block;font-size:12px;font-weight:700;opacity:.8;margin-top:8px}
.hop{display:flex;justify-content:space-between;gap:4px;margin:12px 0 2px}
.hop div{flex:1;text-align:center;border-radius:14px;padding:6px 2px;font-size:11.5px;font-weight:750;color:var(--tr-chu-3);background:var(--kinh-dam)}
.hop div b{display:block;font-size:17px;color:var(--tr-chu)}
.on-nut{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.on-nut button{text-align:center;padding:11px 4px}
.on-nut .q{background:var(--tr-sai-nhat);color:var(--tr-sai-chu)} .on-nut .mh{background:var(--tr-sao-nhat);color:var(--tr-sao-chu)} .on-nut .n{background:var(--tr-dung-nhat);color:var(--tr-dung-chu)}
textarea{width:100%;min-height:120px;border:0;border-radius:20px;padding:12px;font:inherit;font-size:15px;font-weight:600;color:var(--tr-chu);background:var(--tr-mat);box-shadow:inset 0 0 0 1px var(--tr-vien);resize:vertical}
textarea:focus{outline:2px solid var(--tr-hs-nut)}
.nut-lon{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:56px;margin-top:10px;border-radius:30px;background:var(--tr-hs-day);color:var(--tr-hs-tren);font-weight:800;font-size:16.5px;box-shadow:0 18px 32px -16px var(--tr-hs-day)}
.y-chinh{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.y-chinh span{border-radius:12px;padding:4px 10px;font-size:13.5px;font-weight:750;background:var(--kinh-dam);color:var(--tr-chu-3);box-shadow:inset 0 0 0 1px var(--tr-vien)}
.y-chinh span.co{background:var(--tr-dung-nhat);color:var(--tr-dung-chu);box-shadow:none}
.ket-on{margin-top:10px;font-size:14.5px;font-weight:700;color:var(--tr-chu-2)}
.lich{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.lich div{border-radius:18px;padding:10px 4px;text-align:center;font-size:12px;font-weight:700;color:var(--tr-chu-3);background:var(--kinh-dam);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--tr-vien) 60%,transparent)}
.lich div b{display:block;font-size:18px;color:var(--tr-hs-chu)}
.lich div.toi{background:var(--tr-hs-nhat);box-shadow:inset 0 0 0 2px var(--tr-hs-nut)}
```

## B. Khung trang mẫu (`tong-hop-hoa-11-kinh.mau.html`)
Trang Hoá 11 ba chương đã gửi học sinh. `/*KINH_CSS*/` thay bằng CSS ở phụ lục A; `/*KHO_DE*/{}` thay bằng JSON câu kho đề
`{"c1": [...], "c2": [...], "c3": [...], "tron": [...]}`, mỗi câu `{"ma", "chuong", "de", "lua_chon": {"A": ...}, "dap_an", "giai"}`.
Đổi lớp / chương: sửa các `<article class="the">`, mảng `TC` (thần chú), `THE` (thẻ nhớ), `Y` (ý chính cho «Viết hết ra»), `GIANG` (đề giảng lại).

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hoá 11 · Tổng hợp từ đầu năm</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>/*KINH_CSS*/</style>
</head>
<body>
<canvas id="phao"></canvas>
<div class="khung">

  <header class="hero">
    <svg class="phan-tu" viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="#8f7bff" stroke-width="1.5" opacity=".7">
        <ellipse cx="60" cy="60" rx="52" ry="20"><animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="9s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="60" cy="60" rx="52" ry="20" transform="rotate(60 60 60)"><animateTransform attributeName="transform" type="rotate" from="60 60 60" to="420 60 60" dur="12s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="60" cy="60" rx="52" ry="20" transform="rotate(120 60 60)"><animateTransform attributeName="transform" type="rotate" from="120 60 60" to="480 60 60" dur="15s" repeatCount="indefinite"/></ellipse>
      </g>
      <circle cx="60" cy="60" r="11" fill="#ffc94d"/>
    </svg>
    <span class="nhan">⚗️ Thầy Đỗ Đại Học</span>
    <h1>Hoá 11<br><span>từ đầu năm tới giờ</span></h1>
    <p>Ôn đúng cách thầy giảng trên lớp. Lật thẻ, bấm thử, làm câu nhanh là nắm chắc 3 chương.</p>
    <div class="so">
      <div><b>3</b><small>chương</small></div>
      <div><b style="color:var(--vang)">12</b><small>thần chú</small></div>
      <div><b style="color:var(--xanh)">9</b><small>câu thử sức</small></div>
    </div>
  </header>

  <nav class="dieu-huong">
    <a href="#than-chu" class="on">✨ Thần chú</a>
    <a href="#phong-on">🏆 Ôn tập</a>
    <a href="#c1">⚖️ Cân bằng</a>
    <a href="#c2">🌫️ N &amp; S</a>
    <a href="#c3">🧬 Hữu cơ</a>
  </nav>

  <!-- THẦN CHÚ -->
  <section class="muc" id="than-chu">
    <div class="muc-dau">
      <div class="ico">✨</div>
      <div><h2>12 thần chú của thầy</h2><small>Chạm vào thẻ để lật · vuốt ngang xem thêm</small></div>
    </div>
    <div class="boi" id="boi"></div>
    <div class="cham" id="cham"></div>
  </section>

  <!-- PHÒNG ÔN TẬP -->
  <section class="muc" id="phong-on">
    <div class="muc-dau">
      <div class="ico">🏆</div>
      <div><h2>Phòng ôn tập</h2><small>4 cách ôn hiệu quả nhất đã được nghiên cứu chứng minh</small></div>
    </div>
    <div class="boi-on">
      <div class="tab-on" id="tabOn">
        <button data-o="leitner" class="chon"><b>🧠 Thẻ nhớ ngắt quãng</b><small>nhớ thì giãn lịch, quên thì ôn lại sớm</small></button>
        <button data-o="viet"><b>✍️ Viết hết ra</b><small>gấp tài liệu, tự nhớ lại ra giấy</small></button>
        <button data-o="giang"><b>🗣️ Giảng lại cho bạn</b><small>nói được cho người khác hiểu mới là hiểu</small></button>
        <button data-o="tron"><b>🔀 Trộn 3 chương</b><small>đề lẫn lộn, tự chấm độ chắc chắn</small></button>
      </div>

      <div class="on-o mo" id="on-leitner">
        <div class="huong">Nghĩ ra câu trả lời trong đầu rồi mới chạm lật. Bấm đúng mức nhớ, thẻ quên sẽ quay lại sớm, thẻ nhớ được hẹn xa dần (1 → 3 → 7 → 14 ngày).</div>
        <div class="the-nho" id="theNho"><div class="lat"><div class="m a" id="theTruoc"></div><div class="m b" id="theSau"></div></div></div>
        <div class="on-nut"><button class="q" data-d="0">😵 Quên</button><button class="mh" data-d="1">🤔 Mơ hồ</button><button class="n" data-d="2">😎 Nhớ chắc</button></div>
        <div class="hop" id="hop"></div>
        <div class="ket-on" id="ketLeitner"></div>
      </div>

      <div class="on-o" id="on-viet">
        <div class="huong">Cách ôn mạnh nhất là tự lôi kiến thức ra. Chọn chương, gấp hết, viết mọi điều em nhớ (gạch đầu dòng là được), rồi bấm chấm.</div>
        <div class="tab" id="tabViet"><button data-c="c1" class="chon">Chương 1</button><button data-c="c2">Chương 2</button><button data-c="c3">Chương 3</button></div>
        <textarea id="vietO" placeholder="Ví dụ: cân bằng động là v thuận = v nghịch..."></textarea>
        <button class="nut-lon" id="vietCham">Chấm xem em nhớ được bao nhiêu ý</button>
        <div class="y-chinh" id="vietY"></div>
        <div class="ket-on" id="vietKet"></div>
      </div>

      <div class="on-o" id="on-giang">
        <div class="huong">Giảng lại bằng lời của em như đang nói cho bạn lớp dưới. Văn phòng soi xem em đã nói đủ các ý mấu chốt chưa.</div>
        <div class="giai" id="giangDe" style="min-height:0;font-weight:750"></div>
        <textarea id="giangO" placeholder="Em giảng ở đây..." style="margin-top:10px"></textarea>
        <button class="nut-lon" id="giangCham">Soi ý mấu chốt</button>
        <div class="y-chinh" id="giangY"></div>
        <div class="ket-on" id="giangKet"></div>
        <div class="chip"><button id="giangDoi">↻ Đổi đề khác</button></div>
      </div>

      <div class="on-o" id="on-tron">
        <div class="huong">Câu 3 chương trộn lẫn, đúng như đề thi thật. Trước khi chọn đáp án, em tự chấm mình <b>chắc</b> hay <b>đoán</b>: "chắc mà sai" là lỗ hổng cần vá trước.</div>
        <div id="tronO"></div>
        <div class="ket-on" id="tronKet"></div>
      </div>
    </div>
  </section>

  <!-- CHƯƠNG 1 -->
  <section class="muc" id="c1">
    <div class="muc-dau">
      <div class="ico">⚖️</div>
      <div><h2>Chương 1 · Cân bằng hoá học</h2><small>Bài 1 Cân bằng hoá học · Bài 2 Cân bằng trong dung dịch nước</small></div>
    </div>

    <article class="the hien">
      <h3><em>01</em><span>Cân bằng là cân bằng động</span></h3>
      <p>Phản ứng thuận nghịch chạy cả hai chiều cùng lúc. Tới khi <b>v<sub>thuận</sub> = v<sub>nghịch</sub></b> thì nồng độ các chất đứng yên, nhưng phản ứng <b>không dừng</b>.</p>
      <svg class="svg-cb" viewBox="0 0 320 120" aria-label="Hai chiều phản ứng chạy liên tục">
        <defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#4db5ff"/><stop offset="1" stop-color="#38e1c6"/></linearGradient>
          <linearGradient id="g2" x1="1" x2="0"><stop offset="0" stop-color="#ff5d8f"/><stop offset="1" stop-color="#ffc94d"/></linearGradient></defs>
        <rect x="6" y="18" width="70" height="84" rx="16" fill="#222a55" stroke="rgba(255,255,255,.12)"/>
        <rect x="244" y="18" width="70" height="84" rx="16" fill="#222a55" stroke="rgba(255,255,255,.12)"/>
        <text x="41" y="66" text-anchor="middle" fill="#eef1ff" font-weight="800" font-size="15">Chất</text>
        <text x="41" y="84" text-anchor="middle" class="phu" font-size="11">đầu</text>
        <text x="279" y="66" text-anchor="middle" fill="#eef1ff" font-weight="800" font-size="15">Sản</text>
        <text x="279" y="84" text-anchor="middle" class="phu" font-size="11">phẩm</text>
        <path d="M84 44 H236" stroke="url(#g1)" stroke-width="4" stroke-linecap="round"/><path d="M228 37 l10 7 -10 7" fill="none" stroke="#38e1c6" stroke-width="4" stroke-linecap="round"/>
        <path d="M236 78 H84" stroke="url(#g2)" stroke-width="4" stroke-linecap="round"/><path d="M92 71 l-10 7 10 7" fill="none" stroke="#ff5d8f" stroke-width="4" stroke-linecap="round"/>
        <g><circle class="hat" cx="30" cy="44" r="5" fill="#fff"/><circle class="hat" cx="30" cy="44" r="5" fill="#fff" style="animation-delay:-.8s"/><circle class="hat" cx="30" cy="44" r="5" fill="#fff" style="animation-delay:-1.6s"/></g>
        <g transform="translate(260 0)"><circle class="hat n" cx="30" cy="78" r="5" fill="#ffc94d"/><circle class="hat n" cx="30" cy="78" r="5" fill="#ffc94d" style="animation-delay:-.8s"/><circle class="hat n" cx="30" cy="78" r="5" fill="#ffc94d" style="animation-delay:-1.6s"/></g>
        <text x="160" y="32" text-anchor="middle" class="t1" font-size="12" font-weight="700">thuận</text>
        <text x="160" y="100" text-anchor="middle" class="t2" font-size="12" font-weight="700">nghịch</text>
      </svg>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Khi thay đổi nhiệt độ, nồng độ và áp suất thì cân bằng chuyển dịch theo chiều chống lại sự thay đổi đó. Gạch chân cho thầy cái cụm "chống lại sự thay đổi đó".</div></div>
    </article>

    <article class="the hien">
      <h3><em>02</em><span>Hằng số cân bằng K<sub>C</sub></span></h3>
      <div class="kc">
        <div class="pt">aA + bB ⇌ cC + dD</div>
        <div class="phan-so"><span style="font-size:22px">K<sub>C</sub> =</span>
          <div><div class="tu">[C]<sup>c</sup> · [D]<sup>d</sup></div><div class="mau">[A]<sup>a</sup> · [B]<sup>b</sup></div></div></div>
        <div><span class="chip-ran">🪨 Chất rắn: <s>không có mặt</s> trong K<sub>C</sub></span></div>
      </div>
      <p>Trên là <b style="color:var(--la)">sản phẩm</b>, dưới là <b style="color:var(--hong)">chất đầu</b>, hệ số lên mũ. K<sub>C</sub> chỉ phụ thuộc <b>nhiệt độ</b> và bản chất phản ứng.</p>
      <div class="tc-nho">💡 Sản phẩm trên, chất đầu dưới, hệ số lên mũ</div>
    </article>

    <article class="the hien">
      <h3><em>03</em><span>Phòng thí nghiệm Le Chatelier</span></h3>
      <p>Bấm một tác động, xem cân bằng chạy về đâu.</p>
      <div class="lab">
        <div class="pt-lab">
          <div class="ve" id="veTrai">N<sub>2</sub> + 3H<sub>2</sub><small>4 mol khí</small></div>
          <div class="mui">⇌</div>
          <div class="ve" id="vePhai">2NH<sub>3</sub><small>2 mol khí</small></div>
        </div>
        <div class="dh">Δ<sub>r</sub>H &lt; 0 · chiều thuận toả nhiệt</div>
        <div class="thanh"><div class="ray"></div><div class="bi" id="bi"></div><span class="l">◀ chiều nghịch</span><span class="r">chiều thuận ▶</span></div>
        <div class="nut" id="nutLab">
          <button data-k="tangT">🔥 Tăng nhiệt độ</button>
          <button data-k="giamT">❄️ Giảm nhiệt độ</button>
          <button data-k="tangP">⬆️ Tăng áp suất</button>
          <button data-k="giamP">⬇️ Giảm áp suất</button>
          <button data-k="themN2">➕ Thêm N<sub>2</sub></button>
          <button data-k="botNH3">➖ Lấy bớt NH<sub>3</sub></button>
          <button data-k="xt" style="grid-column:1/-1">🧪 Thêm chất xúc tác Fe</button>
        </div>
        <div class="giai" id="giai">Chọn một tác động ở trên nha 👆</div>
      </div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Tăng thu giảm toả. Nếu thầy tăng nhiệt độ thì cân bằng chuyển dịch theo chiều thu nhiệt.</div></div>
    </article>

    <article class="the hien">
      <h3><em>04</em><span>Bẫy hay nhầm</span></h3>
      <p>Đọc câu đỏ, đoán đúng sai, chạm để lật.</p>
      <div class="nham">
        <div class="o"><div class="lat">
          <div class="m a"><span class="k">❌</span><div><small>HAY NHẦM</small>Thêm xúc tác thì cân bằng chuyển sang phải.</div></div>
          <div class="m b"><span class="k">✅</span><div><small>ĐÚNG LÀ</small>Xúc tác tăng tốc <b>cả hai chiều như nhau</b>: cân bằng không chuyển dịch, chỉ đạt nhanh hơn.</div></div>
        </div></div>
        <div class="o"><div class="lat">
          <div class="m a"><span class="k">❌</span><div><small>HAY NHẦM</small>Δ<sub>r</sub>H &lt; 0 là chiều thuận thu nhiệt.</div></div>
          <div class="m b"><span class="k">✅</span><div><small>ĐÚNG LÀ</small>Δ<sub>r</sub>H &lt; 0 là chiều thuận <b>toả nhiệt</b>. Chiều nghịch mới thu nhiệt.</div></div>
        </div></div>
        <div class="o"><div class="lat">
          <div class="m a"><span class="k">❌</span><div><small>HAY NHẦM</small>Tăng áp suất thì cân bằng nào cũng chuyển dịch.</div></div>
          <div class="m b"><span class="k">✅</span><div><small>ĐÚNG LÀ</small>Chỉ đếm mol <b>khí</b>. Hai vế bằng số mol khí thì áp suất không làm chuyển dịch.</div></div>
        </div></div>
      </div>
    </article>

    <article class="the hien">
      <h3><em>05</em><span>Acid, base theo Brønsted - Lowry</span></h3>
      <p><b>Acid cho H<sup>+</sup>, base nhận H<sup>+</sup>.</b> Chất điện li mạnh phân li hoàn toàn (acid mạnh, base mạnh, hầu hết muối), chất điện li yếu phân li một phần (mũi tên hai chiều).</p>
      <p>Chạm vào một muối, thần chú "yếu sinh ngược tính" xét giúp em:</p>
      <div class="muoi" id="muoi">
        <button data-m="nh4cl">NH<sub>4</sub>Cl</button>
        <button data-m="ch3coona">CH<sub>3</sub>COONa</button>
        <button data-m="nacl">NaCl</button>
        <button data-m="na2co3">Na<sub>2</sub>CO<sub>3</sub></button>
      </div>
      <div class="kq-muoi" id="kqMuoi"><span style="color:var(--nhat)">Kết quả hiện ở đây.</span></div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Ion dương được hình thành từ base yếu thì có tính acid yếu. Ion âm được hình thành từ acid yếu thì có tính base yếu.</div></div>
    </article>

    <article class="the hien">
      <h3><em>06</em><span>Kéo thanh pH</span></h3>
      <p>pH = −lg[H<sup>+</sup>]. Kéo thử, nhìn [H<sup>+</sup>] đổi theo.</p>
      <div class="ph-thang"><div class="kim" id="kim"></div></div>
      <div class="ph-so"><span>0</span><span>7</span><span>14</span></div>
      <input type="range" min="0" max="14" step="1" value="3" id="ph" aria-label="pH">
      <div class="ph-kq"><div>pH<b id="phSo">3</b></div><div>[H<sup>+</sup>]<b id="hSo">10<sup>−3</sup> M</b></div></div>
      <div class="giai" id="phMoi" style="min-height:0"></div>
      <div class="tc-nho">💡 [H<sup>+</sup>] giảm 10 lần thì pH tăng 1</div>
      <p style="margin-top:10px">Chuẩn độ acid - base: dùng dung dịch đã biết nồng độ để tìm nồng độ dung dịch kia, nhận ra điểm tương đương nhờ chất chỉ thị (phenolphthalein hoá hồng khi dư base).</p>
    </article>

    <div class="chuong-tieu">🎯 Thử sức chương 1 · câu từ kho đề của thầy</div>
    <div data-kho="c1"></div>
  </section>

  <!-- CHƯƠNG 2 -->
  <section class="muc" id="c2">
    <div class="muc-dau">
      <div class="ico">🌫️</div>
      <div><h2>Chương 2 · Nitrogen và sulfur</h2><small>Bài 4 → Bài 8</small></div>
    </div>

    <article class="the hien">
      <h3><em>01</em><span>Nhìn số oxi hoá, đoán ngay tính chất</span></h3>
      <p>Học thuộc phương trình thì nhanh quên. Nhìn số oxi hoá là tự suy ra chất đó khử hay oxi hoá. Chạm vào từng bậc:</p>
      <div class="tab" id="tabSoh"><button data-x="N" class="chon">Nitrogen</button><button data-x="S">Sulfur</button></div>
      <div class="thang-soh" id="thangSoh"></div>
      <div class="giai" id="giaiSoh">Chạm một bậc ở trên 👆</div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Cứ trung gian á thì nó vừa giảm được, vừa tăng được. −3 là thấp nhất rồi, mà thấp nhất thì chỉ có thể tăng lên thôi.</div></div>
    </article>

    <article class="the hien">
      <h3><em>02</em><span>N<sub>2</sub>: liên kết ba siêu bền</span></h3>
      <svg class="n2" viewBox="0 0 320 110" aria-label="Phân tử N2 với liên kết ba">
        <defs><radialGradient id="gn" cx=".35" cy=".3"><stop offset="0" stop-color="#cfe9ff"/><stop offset=".5" stop-color="#4db5ff"/><stop offset="1" stop-color="#1d4fa8"/></radialGradient></defs>
        <line x1="110" y1="40" x2="210" y2="40" stroke="#ffc94d" stroke-width="4" class="lk"/>
        <line x1="104" y1="55" x2="216" y2="55" stroke="#ffc94d" stroke-width="4" class="lk" style="animation-delay:-.4s"/>
        <line x1="110" y1="70" x2="210" y2="70" stroke="#ffc94d" stroke-width="4" class="lk" style="animation-delay:-.8s"/>
        <circle class="nt" cx="80" cy="55" r="38"/><circle class="nt" cx="240" cy="55" r="38"/>
        <text x="80" y="63" text-anchor="middle" font-size="26" font-weight="900" class="nt-chu">N</text>
        <text x="240" y="63" text-anchor="middle" font-size="26" font-weight="900" class="nt-chu">N</text>
      </svg>
      <p>Mỗi N có <b>3 electron độc thân</b>, góp thành 3 cặp chung: <b>N≡N</b>. Liên kết ba rất bền nên ở nhiệt độ thường N<sub>2</sub> khá trơ. N<sub>2</sub> chiếm khoảng 78% thể tích không khí.</p>
      <div class="pt-bo">
        <div>N<sub>2</sub> + 3H<sub>2</sub> ⇌ 2NH<sub>3</sub><small>t°, p, xúc tác Fe · N giảm 0 → −3: N<sub>2</sub> là <b>chất oxi hoá</b></small></div>
        <div>N<sub>2</sub> + O<sub>2</sub> ⇌ 2NO<small>nhiệt độ cao khoảng 3000 °C hoặc tia lửa điện · N tăng 0 → +2: N<sub>2</sub> là <b>chất khử</b></small></div>
      </div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>E độc thân có nghĩa là e đang FA, còn e ghép đôi là đã xây dựng gia đình. Nối ba là ba cặp.</div></div>
    </article>

    <article class="the hien">
      <h3><em>03</em><span>Ammonia và muối ammonium</span></h3>
      <p>N trong NH<sub>3</sub> còn <b>một cặp electron chưa liên kết</b>, nhận được H<sup>+</sup> nên NH<sub>3</sub> có <b>tính base yếu</b>. N ở −3 (thấp nhất) nên NH<sub>3</sub> còn có <b>tính khử</b>.</p>
      <div class="pt-bo">
        <div>NH<sub>3</sub> + H<sub>2</sub>O ⇌ NH<sub>4</sub><sup>+</sup> + OH<sup>−</sup><small>tính base yếu: dung dịch làm quỳ tím hoá xanh</small></div>
        <div>4NH<sub>3</sub> + 3O<sub>2</sub> → 2N<sub>2</sub> + 6H<sub>2</sub>O<small>t° · N tăng −3 → 0: tính khử</small></div>
        <div>NH<sub>4</sub>Cl + NaOH → NaCl + NH<sub>3</sub>↑ + H<sub>2</sub>O<small>nhận biết NH<sub>4</sub><sup>+</sup>: khí mùi khai làm xanh quỳ tím ẩm</small></div>
        <div>NH<sub>4</sub>Cl → NH<sub>3</sub> + HCl<small>t° · muối ammonium dễ bị nhiệt phân</small></div>
      </div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Chính cái cặp e này là gây ra tính base yếu của nó. Một nitrogen thì chỉ cho được một cặp thôi.</div></div>
    </article>

    <article class="the hien">
      <h3><em>04</em><span>HNO<sub>3</sub>: hai tính chất mạnh</span></h3>
      <p>N ở +5 là cao nhất, chỉ giảm được nên HNO<sub>3</sub> có <b>tính oxi hoá mạnh</b>, lại là <b>acid mạnh</b>. Tác dụng với hầu hết kim loại nhưng <b>không giải phóng H<sub>2</sub></b>. Bảo quản trong lọ tối màu vì dễ phân huỷ khi gặp ánh sáng.</p>
      <p>Chọn một thí nghiệm:</p>
      <div class="chip" id="hno3">
        <button data-k="cuDac">Cu + HNO<sub>3</sub> đặc</button>
        <button data-k="cuLoang">Cu + HNO<sub>3</sub> loãng</button>
        <button data-k="feNguoi">Fe + HNO<sub>3</sub> đặc, nguội</button>
        <button data-k="au">Au + HNO<sub>3</sub></button>
      </div>
      <div class="giai" id="giaiHno3">Kết quả hiện ở đây 👆</div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Thụ động là có nhưng lại không ra sản phẩm được, chứ không phải thụ động là không phản ứng.</div></div>
    </article>

    <article class="the hien">
      <h3><em>05</em><span>Mưa acid và phú dưỡng</span></h3>
      <p><b>Mưa acid</b> có hai thủ phạm gốc rễ: NO<sub>x</sub> và SO<sub>2</sub>.</p>
      <div class="dong"><span>NO<sub>x</sub></span><i>+ O<sub>2</sub>, H<sub>2</sub>O →</i><span style="color:var(--cam)">HNO<sub>3</sub></span></div>
      <div class="dong"><span>SO<sub>2</sub></span><i>+ O<sub>2</sub> →</i><span>SO<sub>3</sub></span><i>+ H<sub>2</sub>O →</i><span style="color:var(--cam)">H<sub>2</sub>SO<sub>4</sub></span></div>
      <p style="margin-top:12px"><b>Phú dưỡng</b>: nước ao hồ thừa ion nitrate NO<sub>3</sub><sup>−</sup> và phosphate PO<sub>4</sub><sup>3−</sup> (nguyên tố N, P), tảo phát triển quá mức.</p>
      <div class="tc-nho">💡 Phú dưỡng là môi trường bị gút</div>
    </article>

    <article class="the hien">
      <h3><em>06</em><span>Sulfur và sulfur dioxide</span></h3>
      <p>S có số oxi hoá 0, trung gian giữa −2 và +6: <b>vừa oxi hoá vừa khử</b>. SO<sub>2</sub> (S +4) cũng trung gian, lại là oxide acid: thầy gọi là <b>ba loại tính chất</b>.</p>
      <div class="pt-bo">
        <div>S + Hg → HgS<small>xảy ra ngay ở nhiệt độ thường: rơi vãi thuỷ ngân thì rắc bột sulfur để thu gom</small></div>
        <div>S + O<sub>2</sub> → SO<sub>2</sub><small>t° · S là chất khử</small></div>
        <div>SO<sub>2</sub> + Br<sub>2</sub> + 2H<sub>2</sub>O → 2HBr + H<sub>2</sub>SO<sub>4</sub><small>SO<sub>2</sub> thể hiện tính khử (S +4 → +6)</small></div>
        <div>SO<sub>2</sub> + 2H<sub>2</sub>S → 3S + 2H<sub>2</sub>O<small>SO<sub>2</sub> thể hiện tính oxi hoá (S +4 → 0)</small></div>
      </div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Sulfur +4 thì nó lại nằm ở trung gian, vậy nó vừa có tính khử và vừa có tính oxi hoá luôn.</div></div>
    </article>

    <article class="the hien">
      <h3><em>07</em><span>Sulfuric acid và muối sulfate</span></h3>
      <p>H<sub>2</sub>SO<sub>4</sub> <b>loãng</b>: tính acid như acid thông thường. H<sub>2</sub>SO<sub>4</sub> <b>đặc</b>: thêm <b>tính háo nước</b> và <b>tính oxi hoá mạnh</b>.</p>
      <div class="pt-bo">
        <div>Cu + 2H<sub>2</sub>SO<sub>4</sub> (đặc) → CuSO<sub>4</sub> + SO<sub>2</sub> + 2H<sub>2</sub>O<small>t° · loãng thì Cu không tan, đặc mới tan</small></div>
        <div>BaCl<sub>2</sub> + Na<sub>2</sub>SO<sub>4</sub> → BaSO<sub>4</sub>↓ + 2NaCl<small>nhận biết SO<sub>4</sub><sup>2−</sup>: kết tủa trắng BaSO<sub>4</sub> không tan trong acid</small></div>
      </div>
      <div class="nham">
        <div class="o"><div class="lat">
          <div class="m a"><span class="k">❌</span><div><small>HAY NHẦM</small>Pha loãng H<sub>2</sub>SO<sub>4</sub> đặc: rót nước vào acid.</div></div>
          <div class="m b"><span class="k">✅</span><div><small>ĐÚNG LÀ</small><b>Rót từ từ acid vào nước</b> và khuấy đều. Tuyệt đối không làm ngược lại.</div></div>
        </div></div>
      </div>
    </article>

    <div class="chuong-tieu">🎯 Thử sức chương 2 · câu từ kho đề của thầy</div>
    <div data-kho="c2"></div>
  </section>

  <!-- CHƯƠNG 3 -->
  <section class="muc" id="c3">
    <div class="muc-dau">
      <div class="ico">🧬</div>
      <div><h2>Chương 3 · Đại cương hoá học hữu cơ</h2><small>Bài 10 → Bài 13</small></div>
    </div>

    <article class="the hien">
      <h3><em>01</em><span>Hữu cơ hay không?</span></h3>
      <p>Hợp chất hữu cơ là hợp chất của <b>carbon</b>, trừ CO, CO<sub>2</sub>, muối carbonate, cyanide, carbide. Chạm từng chất để kiểm tra:</p>
      <div class="chip" id="huuCo"></div>
      <div class="chip-kq" id="huuCoKq"></div>
      <p>Đặc điểm: liên kết chủ yếu là <b>cộng hoá trị</b>, nhiệt độ sôi thấp, ít tan trong nước, tan nhiều trong dung môi hữu cơ.</p>
      <div class="tc-nho">💡 Giống nhau thì chơi với nhau</div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Hợp chất hữu cơ ít tan trong nước bởi vì tính cách của nó khác nhau. Những đứa giống nhau thì hay chơi với nhau.</div></div>
    </article>

    <article class="the hien">
      <h3><em>02</em><span>Nhóm chức và phổ IR</span></h3>
      <p><b>Hydrocarbon</b> chỉ có C và H. Có thêm nguyên tố khác là <b>dẫn xuất</b>. <b>Nhóm chức</b> gây ra tính chất hoá học đặc trưng.</p>
      <svg class="n2" viewBox="0 0 320 130" aria-label="Phổ hồng ngoại có hai tín hiệu O–H và C=O">
        <path d="M10 22 H300" class="ir-ke"/>
        <path d="M10 26 C40 26 50 26 60 30 C70 90 95 92 110 34 C120 26 160 26 190 26 C200 26 204 28 208 32 L214 104 L220 32 C224 27 260 26 300 26" fill="none" class="ir" stroke-width="3"/>
        <text x="85" y="114" text-anchor="middle" class="ir-oh" font-size="13" font-weight="800">O–H</text>
        <text x="85" y="128" text-anchor="middle" class="ir-phu" font-size="10.5">vùng ~3300 cm⁻¹, rộng</text>
        <text x="236" y="98" class="ir-co" font-size="13" font-weight="800">C=O</text>
        <text x="236" y="112" class="ir-phu" font-size="10.5">~1700 cm⁻¹, nhọn</text>
        <text x="300" y="16" text-anchor="end" class="ir-phu" font-size="10">số sóng giảm dần →</text>
      </svg>
      <p>Mỗi nhóm chức hấp thụ ở vùng số sóng riêng, nhìn tín hiệu trên phổ hồng ngoại là đoán được nhóm chức.</p>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Mỗi một nhóm chức nó sẽ có một bộ thông số riêng của nó. Cái khó là chúng ta cần phải nhớ được cái khoảng này.</div></div>
    </article>

    <article class="the hien">
      <h3><em>03</em><span>Tách biệt và tinh chế</span></h3>
      <p>Mỗi cách dựa vào một khác biệt. Chạm tình huống, cách tách đúng sẽ sáng lên:</p>
      <div class="chip" id="tinhHuong">
        <button data-t="0">Nấu rượu lấy ethanol</button>
        <button data-t="1">Lấy lớp tinh dầu nổi trên nước</button>
        <button data-t="2">Thu đường từ nước mía</button>
        <button data-t="3">Tách các chất màu trong lá cây</button>
      </div>
      <div class="tach" id="tach">
        <div><b>⚗️ Chưng cất</b>nhiệt độ sôi khác nhau</div>
        <div><b>🧴 Chiết</b>độ tan khác nhau trong hai dung môi không trộn lẫn</div>
        <div><b>❄️ Kết tinh</b>độ tan thay đổi theo nhiệt độ</div>
        <div><b>🧪 Sắc kí cột</b>khả năng hấp phụ khác nhau</div>
      </div>
    </article>

    <article class="the hien">
      <h3><em>04</em><span>Công thức phân tử</span></h3>
      <p><b>Công thức đơn giản nhất</b> cho tỉ lệ tối giản số nguyên tử. Nhân n lần thành <b>công thức phân tử</b>. Phân tử khối tìm bằng phổ khối lượng MS: peak ion phân tử [M<sup>+</sup>] có m/z lớn nhất.</p>
      <div class="kc">
        <div class="pt">(CH<sub>2</sub>O)<sub>n</sub> với n = <b id="nSo" style="color:var(--vang)">1</b></div>
        <div style="font-size:26px;font-weight:900" id="ctpt">CH<sub>2</sub>O</div>
        <div style="color:var(--nhat);font-size:14px;margin-top:4px">M = <b id="mSo" style="color:var(--chu)">30</b> · <span id="tenCt">formaldehyde</span></div>
        <input type="range" min="1" max="6" value="1" id="nKeo" aria-label="n">
      </div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Công thức thực nghiệm là công thức đơn giản nhất tất cả n lần. Khi xác định được n thì nó sẽ biến thành công thức phân tử.</div></div>
    </article>

    <article class="the hien">
      <h3><em>05</em><span>Cấu tạo hoá học</span></h3>
      <p>Thuyết cấu tạo: các nguyên tử liên kết <b>đúng hoá trị</b> (C luôn hoá trị IV, 4 gạch) và theo <b>một thứ tự nhất định</b>. Đổi thứ tự là ra chất khác:</p>
      <div class="dp">
        <div><div class="ct">CH<sub>3</sub>–CH<sub>2</sub>–<i>OH</i></div><small>ethanol · chất lỏng</small></div>
        <div><div class="ct">CH<sub>3</sub>–<i>O</i>–CH<sub>3</sub></div><small>dimethyl ether · chất khí</small></div>
      </div>
      <div class="cung">Cùng C<sub>2</sub>H<sub>6</sub>O, khác cấu tạo → <b>đồng phân</b></div>
      <p style="margin-top:12px"><b>Đồng đẳng</b>: tính chất hoá học tương tự (xét trước) và hơn kém nhau một hay nhiều nhóm CH<sub>2</sub>.</p>
      <div class="lk-bang">
        <div><b>C–C</b>đơn · 1σ</div>
        <div><b>C=C</b>đôi · 1σ + 1π</div>
        <div><b>C≡C</b>ba · 1σ + 2π</div>
      </div>
      <div class="tc-nho">💡 Công thức khung: giữ khung xương, bỏ phần thịt</div>
      <div class="thay-noi"><div class="av">Đ</div><div class="bong"><small>THẦY NÓI</small>Thuyết cấu tạo là ánh sáng soi đường cho chúng ta học hữu cơ từ giờ đến mãi về sau. Chỉ cần thay đổi thứ tự là thành chất khác luôn.</div></div>
    </article>

    <article class="the hien">
      <h3><em>06</em><span>Bẫy hay nhầm</span></h3>
      <div class="nham">
        <div class="o"><div class="lat">
          <div class="m a"><span class="k">❌</span><div><small>HAY NHẦM</small>CO<sub>2</sub> có carbon nên là hợp chất hữu cơ.</div></div>
          <div class="m b"><span class="k">✅</span><div><small>ĐÚNG LÀ</small>CO, CO<sub>2</sub>, muối carbonate, cyanide, carbide là <b>vô cơ</b> dù có carbon.</div></div>
        </div></div>
        <div class="o"><div class="lat">
          <div class="m a"><span class="k">❌</span><div><small>HAY NHẦM</small>Cùng công thức phân tử là cùng một chất.</div></div>
          <div class="m b"><span class="k">✅</span><div><small>ĐÚNG LÀ</small>Phải nhìn <b>công thức cấu tạo</b>. Khác thứ tự liên kết là chất khác.</div></div>
        </div></div>
        <div class="o"><div class="lat">
          <div class="m a"><span class="k">❌</span><div><small>HAY NHẦM</small>Hơn kém nhau CH<sub>2</sub> là đồng đẳng.</div></div>
          <div class="m b"><span class="k">✅</span><div><small>ĐÚNG LÀ</small>Điều kiện quan trọng nhất là <b>tính chất hoá học tương tự</b>, rồi mới xét CH<sub>2</sub>.</div></div>
        </div></div>
      </div>
    </article>

    <div class="chuong-tieu">🎯 Thử sức chương 3 · câu từ kho đề của thầy</div>
    <div data-kho="c3"></div>
  </section>

  <div class="chan">Chỗ nào chưa rõ, em nhắn thầy ngay trên Zalo nha.<br>Thầy Đỗ Đại Học · Hoá 11 Kết nối tri thức</div>
</div>
<div class="dem" id="dem">🎯 0/9 câu đúng</div>

<script>
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

// 12 thần chú (lời thầy giảng)
const TC = [
  ['NHIỆT ĐỘ', 'Tăng thu,<br>giảm toả', 'Tăng nhiệt độ: cân bằng chạy về chiều <b>thu nhiệt</b>. Giảm nhiệt độ: về chiều <b>toả nhiệt</b>.', 'Δ<sub>r</sub>H &lt; 0: chiều thuận toả nhiệt, chiều nghịch thu nhiệt.'],
  ['NỒNG ĐỘ', 'Bình<br>thông nhau', 'Hai vế như hai nhánh bình thông nhau. Bên nào <b>dâng</b> thì nước chảy sang bên kia.', 'Thêm N<sub>2</sub> (vế trái dâng) → cân bằng sang <b>phải</b>.'],
  ['ÁP SUẤT', 'Tăng áp,<br>về phía ít khí', 'Chỉ đếm mol <b>khí</b>. Tăng áp suất về phía ít mol khí, giảm áp suất về phía nhiều mol khí.', 'Hai vế bằng số mol khí: áp suất không làm chuyển dịch.'],
  ['LE CHATELIER', 'Chống lại<br>sự thay đổi đó', 'Em tác động gì, cân bằng làm <b>ngược lại</b> để giảm tác động đó.', 'Chỉ 3 yếu tố: nhiệt độ, nồng độ, áp suất. Xúc tác không tính.'],
  ['ION', 'Yếu sinh<br>ngược tính', 'Ion từ <b>base yếu</b> có tính acid yếu. Ion từ <b>acid yếu</b> có tính base yếu. Mạnh với mạnh thì trung tính.', 'NH<sub>4</sub><sup>+</sup> (từ NH<sub>3</sub>) → acid · CH<sub>3</sub>COO<sup>−</sup> → base'],
  ['OXI HOÁ - KHỬ', 'Khử cho,<br>O nhận', 'Chất khử <b>cho</b> electron, chất oxi hoá <b>nhận</b> electron.', 'Số oxi hoá tăng là chất khử, giảm là chất oxi hoá.'],
  ['SỐ OXI HOÁ', 'Trung gian<br>vừa lên vừa xuống', 'Thấp nhất chỉ tăng: <b>tính khử</b>. Cao nhất chỉ giảm: <b>tính oxi hoá</b>. Trung gian: <b>cả hai</b>.', 'NH<sub>3</sub> (−3) khử · HNO<sub>3</sub> (+5) oxi hoá · SO<sub>2</sub> (+4) cả hai'],
  ['ELECTRON', 'E độc thân<br>là e đang FA', 'Electron độc thân mới đi liên kết. E ghép đôi là "đã có gia đình".', 'Mỗi N có 3 e độc thân → 3 cặp chung → N≡N.'],
  ['HNO<sub>3</sub>', 'Thụ động là có,<br>mà không ra', 'Fe, Al, Cr gặp HNO<sub>3</sub> đặc, nguội bị <b>thụ động</b>: có tiếp xúc nhưng không ra sản phẩm.', 'Vàng, platin thì không phản ứng với HNO<sub>3</sub>.'],
  ['MÔI TRƯỜNG', 'Phú dưỡng là<br>môi trường bị gút', 'Người thừa đạm thì bị gút. Ao hồ thừa <b>NO<sub>3</sub><sup>−</sup>, PO<sub>4</sub><sup>3−</sup></b> thì phú dưỡng.', 'Nguyên tố gây phú dưỡng: N và P.'],
  ['ĐỘ TAN', 'Giống nhau thì<br>chơi với nhau', 'Chất hữu cơ "tính cách" khác nước nên <b>ít tan trong nước</b>, tan nhiều trong dung môi hữu cơ.', ''],
  ['CÔNG THỨC KHUNG', 'Giữ khung xương,<br>bỏ phần thịt', 'Công thức khung chỉ nhìn mạch C, bỏ hết H gắn vào C.', 'Mỗi đầu, mỗi góc gấp khúc là một nguyên tử C.'],
];
const boi = $('#boi');
boi.innerHTML = TC.map(([dt, loi, sau, vd], i) => `<div class="chu-than"><div class="lat">
  <div class="mat truoc"><div class="so-tc">THẦN CHÚ ${String(i + 1).padStart(2, '0')} · ${dt}</div><div class="loi">${loi}</div><div class="goi">Chạm để xem cách dùng →</div></div>
  <div class="mat sau"><div>${sau}</div>${vd ? `<div class="vd">${vd}</div>` : ''}</div></div></div>`).join('');
const the = [...boi.children], cham = $('#cham');
the.forEach(t => { t.onclick = () => t.classList.toggle('mo'); cham.appendChild(document.createElement('i')); });
const datCham = () => { const i = Math.round(boi.scrollLeft / (the[0].offsetWidth + 12)); [...cham.children].forEach((c, j) => c.classList.toggle('on', j === i)); };
boi.addEventListener('scroll', datCham, { passive: true }); datCham();
// mặt sau dài hơn khung (máy hẹp, phông chưa tải) thì nới cả bộ thẻ cho đều
const caoThe = () => { const m = Math.max(232, ...the.map(t => t.querySelector('.mat.sau').scrollHeight + 8)); the.forEach(t => t.style.height = m + 'px'); };
caoThe(); addEventListener('resize', caoThe); if (document.fonts) document.fonts.ready.then(caoThe);

// hiện dần khi cuộn
const ob = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('ra')), { threshold: .08 });
$$('.hien').forEach(x => ob.observe(x));

// điều hướng
const muc = ['than-chu', 'phong-on', 'c1', 'c2', 'c3'].map(id => document.getElementById(id)), lien = $$('.dieu-huong a');
addEventListener('scroll', () => { let k = 0; muc.forEach((m, i) => { if (m.getBoundingClientRect().top < 140) k = i; }); lien.forEach((a, i) => a.classList.toggle('on', i === k)); }, { passive: true });

// Le Chatelier
const LAB = {
  tangT: [-1, 'Tăng nhiệt độ → cân bằng chạy về chiều <b>thu nhiệt</b> là chiều <b>nghịch</b>. NH<sub>3</sub> giảm.', 'Tăng thu, giảm toả'],
  giamT: [1, 'Giảm nhiệt độ → cân bằng chạy về chiều <b>toả nhiệt</b> là chiều <b>thuận</b>. NH<sub>3</sub> tăng.', 'Tăng thu, giảm toả'],
  tangP: [1, 'Tăng áp suất → về phía <b>ít mol khí</b>: 2 mol &lt; 4 mol nên sang <b>thuận</b>.', 'Tăng áp, về phía ít khí'],
  giamP: [-1, 'Giảm áp suất → về phía <b>nhiều mol khí</b>: 4 mol nên sang <b>nghịch</b>.', 'Tăng áp, về phía ít khí'],
  themN2: [1, 'Thêm N<sub>2</sub>, vế trái dâng → nước chảy sang phải: chiều <b>thuận</b>, tiêu bớt N<sub>2</sub>.', 'Bình thông nhau'],
  botNH3: [1, 'Lấy bớt NH<sub>3</sub>, vế phải hạ → cân bằng bù lại bằng chiều <b>thuận</b>.', 'Bình thông nhau'],
  xt: [0, 'Xúc tác tăng tốc <b>cả hai chiều như nhau</b> → <b>không chuyển dịch</b>, chỉ đạt cân bằng nhanh hơn.', 'Chống lại sự thay đổi đó: chỉ 3 yếu tố'],
};
const bi = $('#bi'), giai = $('#giai'), vt = $('#veTrai'), vp = $('#vePhai');
$$('#nutLab button').forEach(b => b.onclick = () => {
  $$('#nutLab button').forEach(x => x.classList.toggle('chon', x === b));
  const [h, loi, tc] = LAB[b.dataset.k];
  bi.style.left = (50 + h * 40) + '%'; vt.classList.toggle('thang', h < 0); vp.classList.toggle('thang', h > 0);
  giai.innerHTML = loi + '<br><span class="tc">✨ ' + tc + '</span>';
});

// muối
const MUOI = {
  nh4cl: [['NH₄⁺', 'từ base yếu NH₃ → tính acid', 'var(--tr-chu-y-chu)'], ['Cl⁻', 'từ acid mạnh HCl → trung tính', 'var(--tr-chu-3)'], 'ACID · pH < 7', 'var(--tr-chu-y-chu)'],
  ch3coona: [['Na⁺', 'từ base mạnh NaOH → trung tính', 'var(--tr-chu-3)'], ['CH₃COO⁻', 'từ acid yếu → tính base', 'var(--tr-tin-chu)'], 'BASE · pH > 7', 'var(--tr-tin-chu)'],
  nacl: [['Na⁺', 'từ base mạnh → trung tính', 'var(--tr-chu-3)'], ['Cl⁻', 'từ acid mạnh → trung tính', 'var(--tr-chu-3)'], 'TRUNG TÍNH · pH = 7', 'var(--tr-dung-chu)'],
  na2co3: [['Na⁺', 'từ base mạnh → trung tính', 'var(--tr-chu-3)'], ['CO₃²⁻', 'từ acid yếu → tính base', 'var(--tr-tin-chu)'], 'BASE · pH > 7', 'var(--tr-tin-chu)'],
};
$$('#muoi button').forEach(b => b.onclick = () => {
  $$('#muoi button').forEach(x => x.classList.toggle('chon', x === b));
  const [a, c, mt, mau] = MUOI[b.dataset.m];
  $('#kqMuoi').innerHTML = [a, c].map(([i, g, m]) => `<div class="ion"><span style="background:color-mix(in oklab,${m} 16%,transparent);box-shadow:inset 0 0 0 1px ${m};color:var(--tr-chu)">${i}</span><span style="color:var(--nhat);font-weight:500;padding-left:0">${g}</span></div>`).join('')
    + `<span class="moi-truong" style="background:${mau}">${mt}</span>`;
});

// pH
const ph = $('#ph');
const datPh = () => { const v = +ph.value; $('#kim').style.left = (v / 14 * 100) + '%'; $('#phSo').textContent = v;
  $('#hSo').innerHTML = v === 0 ? '1 M' : '10<sup>−' + v + '</sup> M';
  $('#phMoi').innerHTML = v < 7 ? '🔴 Môi trường <b>acid</b>' : v === 7 ? '🟢 Môi trường <b>trung tính</b>' : '🔵 Môi trường <b>base</b> · phenolphthalein hoá hồng'; };
ph.oninput = datPh; datPh();

// thẻ hay nhầm
$$('.nham .o').forEach(o => o.onclick = () => o.classList.toggle('mo'));

// thang số oxi hoá
const SOH = {
  N: [['−3', 'NH₃, NH₄⁺', 'thấp nhất', 'var(--tr-tin-chu)', 'N ở −3 là <b>thấp nhất</b>: chỉ tăng được → chỉ có <b>tính khử</b>.'],
      ['0', 'N₂', 'trung gian', 'var(--tr-sao-chu)', 'N₂ ở 0 là <b>trung gian</b>: vừa giảm (với H₂, kim loại) vừa tăng (với O₂) → <b>vừa oxi hoá vừa khử</b>.'],
      ['+2', 'NO', 'trung gian', 'var(--tr-sao-chu)', 'NO ở +2: trung gian. Không màu, gặp O₂ trong không khí hoá NO₂ nâu đỏ.'],
      ['+4', 'NO₂', 'trung gian', 'var(--tr-sao-chu)', 'NO₂ ở +4: trung gian. Khí màu nâu đỏ, độc, góp phần gây mưa acid.'],
      ['+5', 'HNO₃', 'cao nhất', 'var(--tr-sai-chu)', 'N ở +5 là <b>cao nhất</b>: chỉ giảm được → <b>tính oxi hoá mạnh</b>.']],
  S: [['−2', 'H₂S', 'thấp nhất', 'var(--tr-tin-chu)', 'S ở −2 là <b>thấp nhất</b>: chỉ tăng được → <b>tính khử</b>.'],
      ['0', 'S', 'trung gian', 'var(--tr-sao-chu)', 'S ở 0: <b>trung gian</b> → vừa oxi hoá (với Hg, kim loại) vừa khử (với O₂).'],
      ['+4', 'SO₂', 'trung gian', 'var(--tr-sao-chu)', 'SO₂ ở +4: trung gian → <b>vừa khử vừa oxi hoá</b>, cộng thêm tính oxide acid.'],
      ['+6', 'H₂SO₄', 'cao nhất', 'var(--tr-sai-chu)', 'S ở +6 là <b>cao nhất</b>: chỉ giảm được → H₂SO₄ đặc có <b>tính oxi hoá mạnh</b>.']],
};
const veSoh = x => { $('#thangSoh').innerHTML = SOH[x].map(([s, c, t, m], i) => `<div class="bac" data-i="${i}"><span class="s" style="color:${m}">${s}</span><span class="c">${c}</span><span class="t" style="background:color-mix(in oklab,${m} 16%,transparent);color:${m}">${t}</span></div>`).join('');
  $('#giaiSoh').innerHTML = 'Chạm một bậc ở trên 👆';
  $$('#thangSoh .bac').forEach(b => b.onclick = () => { $$('#thangSoh .bac').forEach(y => y.classList.toggle('chon', y === b)); $('#giaiSoh').innerHTML = SOH[x][+b.dataset.i][4]; }); };
$$('#tabSoh button').forEach(b => b.onclick = () => { $$('#tabSoh button').forEach(y => y.classList.toggle('chon', y === b)); veSoh(b.dataset.x); });
veSoh('N');

// HNO3
const HNO3 = {
  cuDac: 'Cu + 4HNO<sub>3</sub> (đặc) → Cu(NO<sub>3</sub>)<sub>2</sub> + 2NO<sub>2</sub>↑ + 2H<sub>2</sub>O<br>Khí <b style="color:var(--cam)">nâu đỏ</b> NO<sub>2</sub> bay lên, dung dịch xanh.',
  cuLoang: '3Cu + 8HNO<sub>3</sub> (loãng) → 3Cu(NO<sub>3</sub>)<sub>2</sub> + 2NO↑ + 4H<sub>2</sub>O<br>Khí NO <b>không màu</b>, ra không khí hoá nâu đỏ. Không có H<sub>2</sub>.',
  feNguoi: 'Fe bị <b>thụ động hoá</b> trong HNO<sub>3</sub> đặc, nguội (Al, Cr cũng vậy): có tiếp xúc nhưng không ra sản phẩm.',
  au: 'Vàng (Au), platin (Pt) <b>không phản ứng</b> với HNO<sub>3</sub>.',
};
$$('#hno3 button').forEach(b => b.onclick = () => { $$('#hno3 button').forEach(y => y.classList.toggle('co', y === b)); $('#giaiHno3').innerHTML = HNO3[b.dataset.k]; });

// hữu cơ hay không
const HC = [['CH₄', 1, 'hydrocarbon'], ['CO₂', 0, 'oxide của carbon'], ['C₂H₅OH', 1, 'dẫn xuất (có O)'], ['CaCO₃', 0, 'muối carbonate'],
  ['CH₃COOH', 1, 'dẫn xuất (có O)'], ['NaCN', 0, 'muối cyanide'], ['Al₄C₃', 0, 'carbide'], ['C₆H₁₂O₆', 1, 'dẫn xuất (glucose)']];
$('#huuCo').innerHTML = HC.map(([c], i) => `<button data-i="${i}">${c}</button>`).join('');
$$('#huuCo button').forEach(b => b.onclick = () => { const [c, co, ly] = HC[+b.dataset.i]; b.classList.add(co ? 'co' : 'khong');
  $('#huuCoKq').innerHTML = (co ? '✅ <b>' + c + '</b> là hữu cơ: ' : '❌ <b>' + c + '</b> là vô cơ: ') + ly; });

// tách tinh chế
const TH = [0, 1, 2, 3];
$$('#tinhHuong button').forEach(b => b.onclick = () => { $$('#tinhHuong button').forEach(y => y.classList.toggle('co', y === b));
  [...$('#tach').children].forEach((d, i) => d.classList.toggle('sang', i === TH[+b.dataset.t])); });

// (CH2O)n
const sub = n => String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('');
const TEN = { 1: 'formaldehyde', 2: 'acetic acid, methyl formate…', 3: 'lactic acid…', 6: 'glucose, fructose' };
const nKeo = $('#nKeo');
nKeo.oninput = () => { const n = +nKeo.value; $('#nSo').textContent = n;
  $('#ctpt').innerHTML = 'C' + (n > 1 ? '<sub>' + n + '</sub>' : '') + 'H<sub>' + 2 * n + '</sub>O' + (n > 1 ? '<sub>' + n + '</sub>' : '');
  $('#mSo').textContent = 30 * n; $('#tenCt').textContent = TEN[n] || 'chưa có chất quen trong SGK'; };

// câu từ kho đề
const KHO = /*KHO_DE*/{};
let dung = 0, lam = 0;
const tong = KHO.c1.length + KHO.c2.length + KHO.c3.length;
const dem = $('#dem');
const cv = $('#phao'), cx = cv.getContext('2d'); let hat = [];
const coGian = () => { cv.width = innerWidth; cv.height = innerHeight; }; coGian(); addEventListener('resize', coGian);
const ban = (x, y) => { for (let i = 0; i < 70; i++) hat.push({ x, y, vx: (Math.random() - .5) * 9, vy: Math.random() * -9 - 2, s: 3 + Math.random() * 4, c: ['#ffbf35', '#f4417c', '#00bed8', '#767eff', '#00d396', '#f373ce'][i % 6], t: 0 }); };
(function ve() { cx.clearRect(0, 0, cv.width, cv.height); hat = hat.filter(p => p.t < 90); hat.forEach(p => { p.t++; p.vy += .25; p.x += p.vx; p.y += p.vy; cx.globalAlpha = 1 - p.t / 90; cx.fillStyle = p.c; cx.fillRect(p.x, p.y, p.s, p.s); }); requestAnimationFrame(ve); })();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
$$('[data-kho]').forEach(o => {
  o.innerHTML = KHO[o.dataset.kho].map((c, k) => `<div class="cau" data-d="${c.dap_an}"><div class="ma">${c.ma}</div><div class="de">${esc(c.de)}</div>`
    + Object.entries(c.lua_chon).map(([l, t]) => `<button data-l="${l}"><b>${l}.</b>${esc(t)}</button>`).join('') + `<div class="vi-sao">💡 ${esc(c.giai)}</div></div>`).join('');
});
$$('.cau').forEach(c => { const d = c.dataset.d; let lan = 0;
  c.querySelectorAll('button').forEach(b => b.onclick = () => { if (c.classList.contains('xong')) return; lan++;
    const ok = b.dataset.l === d; b.classList.add(ok ? 'dung' : 'sai');
    if (ok) { c.classList.add('xong'); lam++; if (lan === 1) dung++; const r = b.getBoundingClientRect(); ban(r.left + r.width / 2, r.top);
      dem.textContent = '🎯 ' + dung + '/' + tong + ' câu đúng ngay lần đầu'; dem.classList.add('hien-dem'); clearTimeout(dem._t); dem._t = setTimeout(() => dem.classList.remove('hien-dem'), 2600); } }); });

// ── PHÒNG ÔN TẬP ──
const luu = { doc(k, md) { try { return JSON.parse(localStorage.getItem('ddh-on-11:' + k)) ?? md; } catch (e) { return md; } },
  ghi(k, v) { try { localStorage.setItem('ddh-on-11:' + k, JSON.stringify(v)); } catch (e) {} } };
const bo = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
  .replace(/[₀-₉]/g, c => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(c)]).replace(/[⁺⁻]/g, c => c === '⁺' ? '+' : '-');
$$('#tabOn button').forEach(b => b.onclick = () => { $$('#tabOn button').forEach(y => y.classList.toggle('chon', y === b));
  $$('.on-o').forEach(o => o.classList.toggle('mo', o.id === 'on-' + b.dataset.o)); });

// 1. Thẻ nhớ ngắt quãng (hộp Leitner)
const THE = [
  ['Tăng nhiệt độ thì cân bằng chạy về chiều nào?', 'Chiều <b>thu nhiệt</b>. Thần chú: tăng thu, giảm toả.'],
  ['K<sub>C</sub> thay đổi khi nào?', 'Chỉ khi <b>nhiệt độ</b> thay đổi.'],
  ['Chất rắn có mặt trong biểu thức K<sub>C</sub> không?', '<b>Không.</b>'],
  ['Tăng áp suất, cân bằng về phía nào?', 'Phía có <b>ít mol khí</b> hơn.'],
  ['Chất xúc tác làm cân bằng chuyển dịch không?', '<b>Không</b>, chỉ giúp đạt cân bằng nhanh hơn.'],
  ['Theo Brønsted - Lowry, acid là gì?', 'Chất <b>cho H<sup>+</sup></b>. Base là chất nhận H<sup>+</sup>.'],
  ['pH = 3 thì [H<sup>+</sup>] bằng bao nhiêu?', '<b>10<sup>−3</sup> M</b>'],
  ['Muối NH<sub>4</sub>Cl cho môi trường gì?', '<b>Acid</b>: NH<sub>4</sub><sup>+</sup> sinh ra từ base yếu.'],
  ['Vì sao N<sub>2</sub> khá trơ ở nhiệt độ thường?', 'Liên kết ba <b>N≡N</b> rất bền.'],
  ['N<sub>2</sub> tác dụng với O<sub>2</sub> thì N<sub>2</sub> đóng vai trò gì?', '<b>Chất khử</b> (N: 0 → +2).'],
  ['Vì sao NH<sub>3</sub> có tính base yếu?', 'N còn <b>một cặp electron</b> chưa liên kết, nhận được H<sup>+</sup>.'],
  ['Nhận biết ion NH<sub>4</sub><sup>+</sup> bằng gì?', 'Dung dịch <b>kiềm</b>: có khí NH<sub>3</sub> mùi khai, làm xanh quỳ ẩm.'],
  ['HNO<sub>3</sub> có hai tính chất mạnh nào?', '<b>Tính acid mạnh</b> và <b>tính oxi hoá mạnh</b>.'],
  ['HNO<sub>3</sub> tác dụng kim loại có giải phóng H<sub>2</sub> không?', '<b>Không.</b>'],
  ['Kim loại nào bị thụ động trong HNO<sub>3</sub> đặc, nguội?', '<b>Fe, Al, Cr</b>.'],
  ['Hai thủ phạm gây mưa acid?', '<b>NO<sub>x</sub></b> và <b>SO<sub>2</sub></b>.'],
  ['Phú dưỡng do thừa ion nào?', '<b>NO<sub>3</sub><sup>−</sup></b> và <b>PO<sub>4</sub><sup>3−</sup></b>.'],
  ['SO<sub>2</sub> có những tính chất nào?', 'Oxide acid, <b>tính khử</b> và <b>tính oxi hoá</b>.'],
  ['Pha loãng H<sub>2</sub>SO<sub>4</sub> đặc thế nào?', '<b>Rót từ từ acid vào nước</b>, không làm ngược lại.'],
  ['Nhận biết ion SO<sub>4</sub><sup>2−</sup> bằng gì?', 'Dung dịch <b>BaCl<sub>2</sub></b>: kết tủa trắng BaSO<sub>4</sub>.'],
  ['CO<sub>2</sub>, CaCO<sub>3</sub> có phải hợp chất hữu cơ không?', '<b>Không</b>, là ngoại lệ dù có carbon.'],
  ['Tách hai chất lỏng có nhiệt độ sôi khác nhau dùng cách nào?', '<b>Chưng cất.</b>'],
  ['Phân tử khối trên phổ MS lấy ở đâu?', 'Peak ion phân tử <b>[M<sup>+</sup>] có m/z lớn nhất</b>.'],
  ['Đồng phân là gì?', 'Cùng <b>công thức phân tử</b>, khác <b>công thức cấu tạo</b>.'],
  ['Hai điều kiện của đồng đẳng?', '<b>Tính chất hoá học tương tự</b> (quan trọng nhất) và hơn kém nhau nhóm CH<sub>2</sub>.'],
  ['Liên kết đôi C=C gồm những liên kết nào?', '<b>1 σ + 1 π</b>.'],
];
const NGAY = 86400000, HEN = [0, 1, 3, 7, 14];
let hop = luu.doc('hop', {}), hienTai = -1;
const hopCua = i => (hop[i] || { h: 1, den: 0 });
const chonThe = () => { const bay = Date.now(); const ds = THE.map((_, i) => i).filter(i => hopCua(i).den <= bay);
  const ung = ds.length ? ds : THE.map((_, i) => i); ung.sort((a, b) => hopCua(a).h - hopCua(b).h || Math.random() - .5); return ung[0]; };
const veHop = () => { const dem = [1, 2, 3, 4, 5].map(h => THE.filter((_, i) => hopCua(i).h === h).length);
  $('#hop').innerHTML = dem.map((n, i) => `<div>Hộp ${i + 1}<b>${n}</b></div>`).join('');
  const can = THE.filter((_, i) => hopCua(i).den <= Date.now()).length;
  $('#ketLeitner').innerHTML = can ? `Hôm nay còn <b>${can}</b> thẻ cần ôn.` : '🎉 Hôm nay ôn xong hết thẻ rồi, mai quay lại nha.'; };
const moThe = () => { hienTai = chonThe(); const t = $('#theNho'); t.classList.remove('mo');
  setTimeout(() => { $('#theTruoc').innerHTML = '<div>' + THE[hienTai][0] + '</div><small>chạm để lật</small>'; $('#theSau').innerHTML = '<div>' + THE[hienTai][1] + '</div>'; }, t.classList.contains('mo') ? 280 : 0); };
$('#theNho').onclick = () => $('#theNho').classList.toggle('mo');
$$('#on-leitner .on-nut button').forEach(b => b.onclick = () => { if (hienTai < 0) return; const d = +b.dataset.d, c = hopCua(hienTai);
  const h = d === 0 ? 1 : d === 1 ? c.h : Math.min(5, c.h + 1);
  hop[hienTai] = { h, den: d === 0 ? Date.now() + 60000 : Date.now() + HEN[h - 1] * NGAY + (h === 1 ? 5 * 60000 : 0) }; luu.ghi('hop', hop); veHop(); moThe(); });
veHop(); moThe();

// 2. Viết hết ra + 3. Giảng lại: soi ý mấu chốt
const Y = {
  c1: [['cân bằng động', ['can bang dong', 'v thuan = v nghich', 'toc do thuan bang']], ['thuận nghịch', ['thuan nghich', 'hai chieu']], ['K<sub>C</sub>', ['kc', 'hang so can bang']],
    ['chất rắn không vào K<sub>C</sub>', ['chat ran', 'ran khong']], ['chống lại sự thay đổi', ['chong lai', 'le chatelier', 'lo sa']], ['tăng thu giảm toả', ['tang thu', 'thu nhiet', 'toa nhiet']],
    ['áp suất · mol khí', ['mol khi', 'ap suat']], ['nồng độ', ['nong do']], ['xúc tác không chuyển dịch', ['xuc tac']], ['điện li mạnh / yếu', ['dien li']],
    ['acid cho H<sup>+</sup>', ['cho h+', 'cho proton', 'bronsted', 'cho h']], ['pH = −lg[H<sup>+</sup>]', ['-lg', 'lg[', 'ph =', 'ph=']], ['chuẩn độ', ['chuan do']]],
  c2: [['N≡N liên kết ba', ['lien ket ba', 'n≡n', 'noi ba']], ['NH<sub>3</sub> base yếu', ['base yeu', 'bazo yeu', 'bazơ yeu']], ['NH<sub>3</sub> tính khử', ['tinh khu']],
    ['nhận biết NH<sub>4</sub><sup>+</sup>', ['nh4+', 'nh4cl', 'ammonium', 'amoni']], ['HNO<sub>3</sub> oxi hoá mạnh', ['oxi hoa manh', 'oxy hoa manh']], ['không ra H<sub>2</sub>', ['khong giai phong h2', 'khong ra h2', 'khong tao h2', 'khong sinh h2']],
    ['thụ động Fe, Al, Cr', ['thu dong']], ['mưa acid', ['mua acid', 'mua axit']], ['phú dưỡng', ['phu duong']], ['S trung gian', ['trung gian']],
    ['SO<sub>2</sub>', ['so2']], ['H<sub>2</sub>SO<sub>4</sub> đặc háo nước', ['hao nuoc']], ['BaCl<sub>2</sub> nhận biết sulfate', ['bacl2', 'baso4']], ['rót acid vào nước', ['acid vao nuoc', 'axit vao nuoc']]],
  c3: [['hợp chất của carbon', ['cua carbon', 'cua cacbon', 'chua carbon', 'chua c']], ['trừ CO, CO<sub>2</sub>, carbonate…', ['co2', 'carbonate', 'cacbonat']], ['liên kết cộng hoá trị', ['cong hoa tri']],
    ['hydrocarbon / dẫn xuất', ['hydrocarbon', 'hidrocacbon', 'dan xuat']], ['nhóm chức', ['nhom chuc']], ['phổ IR', ['ir', 'hong ngoai']], ['chưng cất', ['chung cat']], ['chiết', ['chiet']],
    ['kết tinh', ['ket tinh']], ['sắc kí', ['sac ki', 'sac ky']], ['CTĐGN → CTPT', ['don gian nhat', 'ctdgn', 'cong thuc phan tu', 'ctpt']], ['phổ MS', ['ms', 'khoi pho', 'pho khoi', 'm/z']],
    ['thuyết cấu tạo', ['thuyet cau tao', 'thu tu nhat dinh', 'hoa tri']], ['đồng phân', ['dong phan']], ['đồng đẳng', ['dong dang', 'ch2']], ['σ và π', ['sigma', 'pi', 'σ', 'π']]],
};
const soi = (chu, ds) => { const s = bo(chu); return ds.map(([ten, tu]) => [ten, tu.some(t => s.includes(bo(t)))]); };
const veSoi = (o, kq) => { o.innerHTML = kq.map(([t, co]) => `<span class="${co ? 'co' : ''}">${co ? '✓ ' : ''}${t}</span>`).join(''); return kq.filter(x => x[1]).length; };
let cViet = 'c1';
$$('#tabViet button').forEach(b => b.onclick = () => { $$('#tabViet button').forEach(y => y.classList.toggle('chon', y === b)); cViet = b.dataset.c;
  $('#vietO').value = luu.doc('viet-' + cViet, ''); $('#vietY').innerHTML = ''; $('#vietKet').innerHTML = ''; });
$('#vietO').value = luu.doc('viet-c1', '');
$('#vietO').oninput = () => luu.ghi('viet-' + cViet, $('#vietO').value);
$('#vietCham').onclick = () => { const kq = soi($('#vietO').value, Y[cViet]), n = veSoi($('#vietY'), kq), tong = kq.length;
  $('#vietKet').innerHTML = n === tong ? '🔥 Đủ hết ý! Chương này em nắm rất chắc.' : `Em nhớ được <b>${n}/${tong}</b> ý. Ý còn xám là chỗ cần đọc lại, mai viết lại lần nữa xem tăng không.`;
  const ds = luu.doc('lich-viet', {}); ds[cViet] = Math.max(ds[cViet] || 0, n); luu.ghi('lich-viet', ds);
  if (n / tong >= .7) { const r = $('#vietCham').getBoundingClientRect(); ban(r.left + r.width / 2, r.top); } };

const GIANG = [
  ['Giảng cho bạn: vì sao tăng áp suất thì phản ứng N<sub>2</sub> + 3H<sub>2</sub> ⇌ 2NH<sub>3</sub> tạo ra nhiều NH<sub>3</sub> hơn?', [['ít mol khí', ['it mol', 'it khi', 'giam so mol', 'giam mol']], ['4 mol so với 2 mol', ['4', '2 mol']], ['chiều thuận', ['thuan', 'sang phai']], ['chống lại / giảm áp suất', ['chong lai', 'giam ap suat']]]],
  ['Giảng cho bạn: vì sao NH<sub>3</sub> vừa có tính base vừa có tính khử?', [['cặp electron chưa liên kết', ['cap e', 'cap electron']], ['nhận H<sup>+</sup>', ['nhan h', 'nhan proton']], ['N ở −3', ['-3', 'am 3']], ['thấp nhất chỉ tăng', ['thap nhat', 'chi tang', 'tang len']]]],
  ['Giảng cho bạn: vì sao muối CH<sub>3</sub>COONa làm dung dịch có môi trường base?', [['CH<sub>3</sub>COO<sup>−</sup>', ['ch3coo']], ['sinh ra từ acid yếu', ['acid yeu', 'axit yeu']], ['có tính base', ['tinh base', 'tinh bazo', 'moi truong base']], ['Na<sup>+</sup> trung tính', ['na+', 'trung tinh', 'base manh']]]],
  ['Giảng cho bạn: vì sao C<sub>2</sub>H<sub>5</sub>OH và CH<sub>3</sub>OCH<sub>3</sub> là hai chất khác nhau dù cùng C<sub>2</sub>H<sub>6</sub>O?', [['cùng công thức phân tử', ['cung cong thuc phan tu', 'cung ctpt', 'cung c2h6o']], ['khác công thức cấu tạo', ['khac cong thuc cau tao', 'khac cau tao', 'khac ctct']], ['thứ tự liên kết', ['thu tu']], ['đồng phân', ['dong phan']]]],
  ['Giảng cho bạn: vì sao không dùng bình thép đựng HNO<sub>3</sub> loãng nhưng HNO<sub>3</sub> đặc, nguội thì được?', [['thụ động', ['thu dong']], ['đặc, nguội', ['dac nguoi', 'dac, nguoi']], ['Fe phản ứng HNO<sub>3</sub> loãng', ['loang']], ['oxi hoá mạnh', ['oxi hoa', 'oxy hoa']]]],
];
let gi = Math.floor(Math.random() * GIANG.length);
const veGiang = () => { $('#giangDe').innerHTML = '🎤 ' + GIANG[gi][0]; $('#giangO').value = luu.doc('giang-' + gi, ''); $('#giangY').innerHTML = ''; $('#giangKet').innerHTML = ''; };
$('#giangO').oninput = () => luu.ghi('giang-' + gi, $('#giangO').value);
$('#giangDoi').onclick = () => { gi = (gi + 1) % GIANG.length; veGiang(); };
$('#giangCham').onclick = () => { const kq = soi($('#giangO').value, GIANG[gi][1]), n = veSoi($('#giangY'), kq);
  $('#giangKet').innerHTML = n === kq.length ? '🏅 Giảng chuẩn như thầy! Đổi đề khác thử tiếp.' : n ? `Đủ <b>${n}/${kq.length}</b> ý. Thêm ý còn xám vào là bạn em hiểu ngay.` : 'Chưa thấy ý mấu chốt nào. Đọc lại thẻ kiến thức phía dưới rồi giảng lại nha.'; };
veGiang();

// 4. Trộn 3 chương + chấm độ tự tin
const tron = [...KHO.c1, ...KHO.c2, ...KHO.c3, ...(KHO.tron || [])].map(c => ({ ...c })).sort(() => Math.random() - .5);
const tk = { chacDung: 0, chacSai: 0, doanDung: 0, doanSai: 0 };
$('#tronO').innerHTML = tron.map((c, k) => `<div class="cau tron" data-d="${c.dap_an}"><div class="ma">${c.chuong} · ${c.ma}</div><div class="de">${esc(c.de)}</div>
  <div class="chac">Trước khi chọn, em: <button data-c="chac">💪 Chắc</button><button data-c="doan">🎲 Đoán</button></div>`
  + Object.entries(c.lua_chon).map(([l, t]) => `<button data-l="${l}"><b>${l}.</b>${esc(t)}</button>`).join('') + `<div class="vi-sao">💡 ${esc(c.giai)}</div></div>`).join('');
$$('.cau.tron').forEach(c => { let chac = ''; c.querySelectorAll('.chac button').forEach(b => b.onclick = e => { e.stopPropagation(); chac = b.dataset.c;
    c.querySelectorAll('.chac button').forEach(y => y.classList.toggle('chon', y === b)); });
  c.querySelectorAll('button[data-l]').forEach(b => b.onclick = () => { if (c.classList.contains('xong')) return;
    if (!chac) { c.querySelector('.chac').animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], 300); return; }
    const ok = b.dataset.l === c.dataset.d; b.classList.add(ok ? 'dung' : 'sai'); c.classList.add('xong');
    if (!ok) c.querySelector(`button[data-l="${c.dataset.d}"]`).classList.add('dung');
    tk[(chac === 'chac' ? 'chac' : 'doan') + (ok ? 'Dung' : 'Sai')]++;
    if (ok && chac === 'chac') { const r = b.getBoundingClientRect(); ban(r.left + r.width / 2, r.top); }
    const xong = tk.chacDung + tk.chacSai + tk.doanDung + tk.doanSai;
    $('#tronKet').innerHTML = `Đã làm <b>${xong}/${tron.length}</b> · 💪 chắc mà đúng <b>${tk.chacDung}</b> · ⚠️ chắc mà sai <b>${tk.chacSai}</b> · 🎲 đoán trúng <b>${tk.doanDung}</b>`
      + (tk.chacSai ? '<br>Câu "chắc mà sai" là hiểu nhầm, đọc kĩ lời giải trước nhé.' : ''); }); });
</script>
</body>
</html>
```

## C. Mã dựng + đăng (`tong_hop_11_kinh.py`, chạy trong văn phòng)

```python
"""Tổng hợp Hoá 11 từ đầu năm (3 chương) theo giao diện «Kính» của app học sinh, cho em Ngọc Trung (02/11/2026).
Lý thuyết + thần chú + "Thầy nói" lấy từ skill giai-bai-phong-cach-thay (references/ly-thuyet.md); câu thử sức lấy NGUYÊN VĂN kho đề (đáp án chốt
theo kho_de.sang_form). Thầy 02/11: "Làm theo giao diện kính của app hs hiện tại cho đồng bộ", "Thêm các kiểu ôn tập xịn nhất trên thế giới".
Chạy từ app/: PYTHONPATH=. .venv/bin/python ../docs/tai-lieu-hs/tong_hop_11_kinh.py <ra.html> [--dang <slug>]"""
import asyncio, json, sys
from pathlib import Path

from ddh_office import kho_de as k, tai_lieu_zalo as tl

GOC = Path(__file__).parent
# (mã đề, phần, số câu): 3 câu mỗi chương ngay dưới chương, thêm vài câu chỉ ra ở phần Trộn 3 chương
CAU = {
    "c1": [("11-C1-B1", "I", 21), ("11-C1-B1", "I", 29), ("11-C1-B1", "I", 23)],
    "c2": [("DB-11-B6-D2", "I", 33), ("11-C2-B6", "I", 3), ("11-C2-B5", "I", 7)],
    "c3": [("11-C3-B10", "I", 1), ("11-C3-B11", "I", 1), ("11-C3-B12", "I", 7)],
    "tron": [("11-C1-B1", "I", 15), ("11-C1-B2-D1", "I", 12), ("11-C2-B5", "I", 6), ("11-C2-B6", "I", 7), ("11-C3-B11", "I", 2), ("11-C3-B10", "I", 2)],
}
TEN_CHUONG = {"11-C1": "Chương 1", "11-C2": "Chương 2", "DB-11-B6": "Chương 2", "11-C3": "Chương 3"}
FONT = GOC / "font"        # chép từ omr-app origin/main src/styles/phong-ddh (git show), giấy phép OFL


def cau(ma, phan, so) -> dict:
    r = k.tra({"ma_de": ma, "phan": phan, "so": so})
    if r is None:
        raise SystemExit(f"không thấy câu {ma} {phan}.{so} trong kho")
    f = k.sang_form(r)
    if not isinstance(f.get("lua_chon"), dict) or len(f["lua_chon"]) != 4:
        raise SystemExit(f"câu {ma} {phan}.{so} không phải trắc nghiệm 4 phương án")
    chuong = next(v for t, v in TEN_CHUONG.items() if ma.startswith(t))
    return {"ma": f"{ma} · câu {so}", "chuong": chuong, "de": f["de"], "lua_chon": f["lua_chon"], "dap_an": str(f["dap_an"]).strip(), "giai": f.get("giai") or ""}


def dung() -> str:
    kho = {nhom: [cau(*x) for x in ds] for nhom, ds in CAU.items()}
    h = (GOC / "tong-hop-hoa-11-kinh.mau.html").read_text(encoding="utf-8")
    h = h.replace("/*KINH_CSS*/", (GOC / "kinh-tai-lieu.css").read_text(encoding="utf-8"), 1)
    h = h.replace("/*KHO_DE*/{}", json.dumps(kho, ensure_ascii=False).replace("</", "<\\/"), 1)
    return h


def chep_phong():
    """Phông ĐĐH Rounded của app vào tai-lieu-web/font/ (trang gọi /font/...)."""
    d = tl.thu_muc_web() / "font"
    d.mkdir(exist_ok=True)
    for t in FONT.glob("ddh-rounded-*.woff2"):
        (d / t.name).write_bytes(t.read_bytes())
    if (FONT / "OFL.txt").exists():
        (d / "OFL.txt").write_bytes((FONT / "OFL.txt").read_bytes())


if __name__ == "__main__":
    ra = Path(sys.argv[1])
    h = dung()
    loi = tl.soat_trang(h)
    if loi:
        print("soát trang:", loi)
    ra.write_text(h, encoding="utf-8")
    print("ghi", ra, len(h))
    if "--dang" in sys.argv:
        chep_phong()
        print(asyncio.run(tl.dang_trang(h, sys.argv[sys.argv.index("--dang") + 1])))
```
