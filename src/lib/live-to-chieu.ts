// LIVE BẢNG TRÊN TỜ CHIẾU (thầy duyệt 10/11 «CHỐT BUILD»; đặc tả docs/dac-ta-live-bang-1011.md mục 2.1, 3; bản vẽ docs/ban-ve-live-1011 ảnh 01–09).
// Đoạn JS + CSS chèn vào tờ (len-bang-moi-to-chieu.ts, cùng phạm vi: body · tao · thanh · dichApp · baoNhanh). Tách tệp riêng vì cổng cỡ tệp.
// Tờ CHỈ LÀ MẶT: nút «Live», thẻ bật live + chọn mic, viên đỏ ba ngăn, «Tắt live», thẻ gọn «N em rời màn» + viền đỏ mảnh. MÁY CHẠY ở cửa sổ app
// (src/components/live/thay-noi.ts): mic + WebRTC + phòng nằm ở đó vì (1) tờ là khung dựng lại mỗi lần thầy chọn câu — nối ở tờ thì rớt live;
// (2) khung `srcdoc` / tờ mở cửa sổ riêng không chắc có quyền mic; (3) WebSocket của phòng vốn ở app.
// LUẬT (thầy chốt tối 10/11): bật live = TIẾNG chạy suốt buổi, qua mọi lần chuyển câu / dựng lại tờ; BẢNG chỉ xuống máy em khi cờ phòng `live.bang` bật
// (tự bật lúc gọi em lên bảng, tự tắt lúc mở lượt mới) — công tắc «Bảng → máy em» trong cụm Live để thầy bật / tắt tay. Em lên bảng mở mic ⇒ thẻ «Đang nói» + «Thu mic».
// Tờ → app:  { nguon:'to-chieu', loai:'live', viec, … }   viec = chao · bam · the-dong · chon-mic · bat-dau · khong-tieng · thu-lai · tieng-lop · tat · bang · thu-mic · nghe-em · but · anh · vung
//             · đợt 2 (11/11, đặc tả 4.8): moi { sbd } · ha-tay { sbd? } · thu-mic { sbd? } (không sbd = «Tắt mic tất cả») · xa { v } · giay { giay }
// App → tờ:  { nguon:'bpu-bang', lenh:'live-tt', tt }  (toàn bộ trạng thái để vẽ)   ·   { nguon:'bpu-bang', lenh:'live-muc', v, em }  (mức âm mic thầy / em đang nói 0..1, ~11 lần / giây)
// ĐỢT 2: thẻ gọn «N em giơ tay» (bấm ⇒ hàng chờ, mỗi em «Mời nói», dưới cùng «Hạ hết tay») · thẻ «Đang nói» có sóng âm + «Thu mic» + «Tắt mic tất cả» ·
// SỬA 11/11 SAU KHI THẦY TEST MÁY THẬT: (1) «nút tạm dừng live và kết thúc live ở trong nút live luôn» ⇒ cửa sổ của nút Live (bấm viên đỏ) có «Tạm dừng» ⇄
// «Tiếp tục», «Kết thúc live», và công tắc «Bảng → máy em» (trước nằm rời trên thanh); (2) «cửa sổ của nút live cũng [sang mép trái]» ⇒ nút Live + viên đỏ
// đứng ĐẦU thanh (mép trái), cửa sổ neo mép trái; (3) «các nút bấm ở thanh dưới thu gọn vào một biểu tượng» ⇒ lúc live các nút phím của thanh gom vào MỘT
// nút lưới; bấm ⇒ xoè ra (8 giây không chạm / bấm ra ngoài ⇒ thu lại). Phím tắt giữ nguyên.
// công tắc «Cho em ở xa vào xem» trong thẻ mic (sau cờ `dot2`) · thẻ «em rời màn» ghi KIỂU rời · tờ ĐO bố cục giấy đề (chỉ số đo, không chữ) gửi app ⇒ phòng ⇒ máy em dựng
// giấy cùng bề rộng, cùng cỡ chữ (rủi ro R3 của đặc tả).
// Bút: mọi sự kiện của `window.__mcBut.nghe` chuyển nguyên văn sang app (`viec:'but'`); sự kiện `trang` kèm ô giấy / ô bảng (`__mcBut.vung()`) + kiểu giấy
// ⇒ máy em dựng đúng bố cục (src/components/live/bo-cuc.ts). Bấm Live ⇒ bút bật sẵn.
// Màu: chỉ biến sẵn có của tờ (--mc-*); màu đội của em rời màn là dữ liệu app gửi sang (đặt vào biến --doi sau khi lọc ký tự).

export const CSS_LIVE_TO_CHIEU = `
/* 7c · live 10/11: nút Live, viên đỏ ba ngăn, thẻ mic, thẻ gọn em rời màn */
body.mc .mc-thanh .mc-lv-nut,body.mc .mc-thanh .mc-lv-tat{flex:none;display:inline-flex;align-items:center;gap:.5em;min-height:calc(var(--u)*2.5);padding:0 1em 0 .8em;border:0;border-radius:999px;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-chu);font:800 max(13px,calc(var(--u)*1.15)) var(--mc-sans);white-space:nowrap;cursor:pointer}
.mc-lv-nut i{display:block;width:.68em;height:.68em;border-radius:50%;background:var(--mc-do);box-shadow:0 0 0 .22em color-mix(in srgb,var(--mc-do) 30%,transparent)}
body.mc .mc-thanh .mc-lv-tat{padding:0 1em;background:transparent;box-shadow:inset 0 0 0 1.5px var(--mc-bang-vien);font-weight:700}
body.mc .mc-thanh .mc-lv-cum{flex:none;display:inline-flex;align-items:stretch;min-height:calc(var(--u)*2.7);padding:0;border:0;border-radius:999px;overflow:hidden;background:var(--mc-do);color:var(--mc-bang-chu);font:800 max(13px,calc(var(--u)*1.12)) var(--mc-sans);white-space:nowrap;cursor:pointer;box-shadow:0 0 0 calc(var(--u)*.22) color-mix(in srgb,var(--mc-do) 28%,transparent);font-variant-numeric:tabular-nums}
.mc-lv-cum>span{display:inline-flex;align-items:center;gap:.45em;padding:0 .75em}
.mc-lv-cum>span+span{box-shadow:inset 1px 0 0 color-mix(in srgb,var(--mc-bang-chu) 28%,transparent)}
.mc-lv-cum i.cham{display:block;width:.62em;height:.62em;border-radius:50%;background:var(--mc-bang-chu)}
.mc-lv-cum small{font-size:.8em;font-weight:600;opacity:.9;margin-left:-.2em}
.mc-lv-cum svg,.mc-lv-roi svg,.mc-lv-the svg{width:1.25em;height:1.25em;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.mc-lv-muc{display:inline-flex;align-items:flex-end;gap:.16em;height:1.25em}
.mc-lv-muc i{display:block;width:.28em;border-radius:.1em;background:color-mix(in srgb,var(--mc-bang-chu) 35%,transparent)}
.mc-lv-muc i.b{background:var(--mc-bang-chu)}
.mc-lv-cum.vang{background:var(--mc-qua-nen);color:var(--mc-qua-chu);box-shadow:none}
/* Xem lại Live (11/11): ngăn «Đang ghi để xem lại» trong viên Live; chưa ghi được ⇒ ngăn vàng, live vẫn chạy. Thẻ nhắc một lần dùng lại khung .mc-lv-noi. */
.mc-lv-cum>span.ghi-loi{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}
.mc-lv-ghi-nhac h3{display:flex;align-items:center;gap:.4em}
.mc-lv-ghi-nhac p{margin:calc(var(--u)*.3) 0 0;color:var(--mc-bang-phu);font:500 calc(var(--u)*.9)/1.45 var(--mc-sans)}
.mc-lv-ghi-nhac p b{color:var(--mc-bang-chu)}
@media (max-width:1180px){.mc-lv-cum>span.ghi b{display:none}}
.mc-lv-cum .im{animation:mcLvNhay 1s steps(2,jump-none) infinite}
@keyframes mcLvNhay{from{background:transparent;color:inherit}to{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}}
body.mc-live .mc-thanh [data-k="T"] .mc-nut-chu,body.mc-live .mc-thanh [data-k="Tab"] .mc-nut-chu{display:none}
body.mc.mc-live .mc-phim-nhom [data-k="P"] .mc-nut-chu{display:none!important}
body.mc .mc-thanh .mc-lv-bg{gap:.45em;padding:0 .8em}
.mc-lv-bg i{display:block;width:.62em;height:.62em;border-radius:50%;box-shadow:inset 0 0 0 1.5px currentColor}
.mc-lv-bg[aria-pressed="true"]{background:var(--mc-bang-chu)!important;color:var(--mc-bang)!important;box-shadow:none!important}
.mc-lv-bg[aria-pressed="true"] i{background:var(--mc-do);box-shadow:none}
/* màn chiếu hẹp (1366): cụm Live gọn lại để «Tắt live» + «Cài đặt» không bị đẩy khỏi thanh */
@media (max-width:1500px){.mc-lv-cum small,.mc-lv-bg span{display:none}body.mc-live .mc-thanh{gap:calc(var(--u)*.3)}.mc-lv-cum>span{padding:0 .6em}}
body.mc-live .mc-thanh{gap:calc(var(--u)*.4)}
.mc-lv-nhac{display:inline-flex;align-items:center;height:calc(var(--u)*2.3);padding:0 1em;border-radius:999px;background:var(--mc-thanh-nen);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-phu);font:600 calc(var(--u)*.9) var(--mc-sans);white-space:nowrap;font-variant-numeric:tabular-nums}
body.mc-live .mc-thanh [data-k="?"]{display:none}
/* thẻ nổi neo trên thanh */
.mc-lv-the,.mc-lv-roi{position:fixed;right:calc(var(--u)*.75);bottom:calc(var(--u)*5);z-index:45;font-family:var(--mc-sans);color:var(--mc-bang-chu)}
.mc-lv-roi{display:flex;flex-direction:column;align-items:flex-end;gap:calc(var(--u)*.6)}
.mc-lv-noi{width:calc(var(--u)*23);padding:calc(var(--u)*.9) calc(var(--u)*1.1);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 1px var(--mc-bang-vien)}
.mc-lv-noi h3{margin:0;font:800 calc(var(--u)*1.15) var(--mc-sans)}
.mc-lv-noi .mc-lv-n{height:calc(var(--u)*2.6);font-size:calc(var(--u)*.95)}
.mc-lv-the{width:calc(var(--u)*27);max-width:calc(100vw - var(--u)*1.5);padding:calc(var(--u)*1.1);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 1px var(--mc-bang-vien)}
.mc-lv-the[hidden],.mc-lv-roi[hidden],.mc-lv-vien[hidden]{display:none}
.mc-lv-the h3{margin:0 0 .2em;font:800 calc(var(--u)*1.3) var(--mc-sans)}
.mc-lv-the p{margin:0;color:var(--mc-bang-phu);font:500 calc(var(--u)*.97)/1.45 var(--mc-sans)}
.mc-lv-the .loi{color:var(--mc-vang-noi);font-weight:700;margin-top:.6em}
.mc-lv-chon{display:flex;align-items:center;gap:.6em;height:calc(var(--u)*3.25);margin-top:calc(var(--u)*.75);padding:0 calc(var(--u)*.9);border-radius:calc(var(--u)*.9);background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);font:600 calc(var(--u)*1.03) var(--mc-sans)}
.mc-lv-chon select{flex:1;min-width:0;height:100%;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;text-overflow:ellipsis}
.mc-lv-chon select option{background:var(--mc-thanh-nen);color:var(--mc-bang-chu)}
.mc-lv-dong{display:flex;justify-content:space-between;align-items:center;gap:.8em;margin-top:calc(var(--u)*.75);color:var(--mc-bang-phu);font:500 calc(var(--u)*.85) var(--mc-sans)}
.mc-lv-dong b{color:var(--mc-bang-chu);font-weight:700;font-size:calc(var(--u)*.97)}
.mc-lv-thuoc{height:calc(var(--u)*.75);margin-top:calc(var(--u)*.5);border-radius:999px;background:var(--mc-bang-nut);overflow:hidden}
.mc-lv-thuoc i{display:block;height:100%;width:100%;border-radius:999px;background:var(--mc-lam-nen);transform-origin:0 50%;transform:scaleX(0);transition:transform .09s linear}
.mc-lv-hang{display:flex;gap:calc(var(--u)*.6);margin-top:calc(var(--u)*.9)}
.mc-lv-n{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:.5em;height:calc(var(--u)*3.25);padding:0 1.1em;border:0;border-radius:999px;background:transparent;box-shadow:inset 0 0 0 1.5px var(--mc-bang-vien);color:var(--mc-bang-chu);font:800 calc(var(--u)*1.05) var(--mc-sans);white-space:nowrap;cursor:pointer}
.mc-lv-n.do{flex:1;background:var(--mc-do);box-shadow:none;font-size:calc(var(--u)*1.15)}
.mc-lv-n.do i{display:block;width:.62em;height:.62em;border-radius:50%;background:var(--mc-bang-chu)}
.mc-lv-n.nho{height:calc(var(--u)*2.3);font-size:calc(var(--u)*.9);font-weight:700}
.mc-lv-n[aria-pressed="true"]{background:var(--mc-bang-chu);color:var(--mc-bang);box-shadow:none}
.mc-lv-n:focus-visible,.mc-lv-nut:focus-visible,.mc-lv-tat:focus-visible,.mc-lv-cum:focus-visible,.mc-lv-roi-gon:focus-visible{outline:3px solid var(--mc-vang-noi);outline-offset:2px}
/* em rời màn: viền đỏ mảnh đứng yên (nháy 2 nhịp khi có em MỚI rời) + thẻ gọn ở góc phải, bấm / có em mới ⇒ mở tên, 4 giây tự thu */
.mc-lv-vien{position:fixed;inset:0;z-index:38;pointer-events:none;border:calc(var(--u)*.3) solid var(--mc-do);border-radius:calc(var(--u)*.4);box-shadow:inset 0 0 calc(var(--u)*2.5) color-mix(in srgb,var(--mc-do) 35%,transparent)}
.mc-lv-vien.nhay{animation:mcLvVien .5s ease-in-out 2}
@keyframes mcLvVien{50%{opacity:.25}}
.mc-lv-roi-gon{display:inline-flex;align-items:center;gap:.55em;height:calc(var(--u)*3.25);padding:0 .65em 0 1em;border:0;border-radius:999px;background:var(--mc-do-nen);color:var(--mc-do);font:800 calc(var(--u)*1.12) var(--mc-sans);white-space:nowrap;cursor:pointer;box-shadow:0 calc(var(--u)*.75) calc(var(--u)*2.1) color-mix(in srgb,var(--mc-bang) 50%,transparent);font-variant-numeric:tabular-nums}
.mc-lv-ky{flex:none;display:inline-grid;place-items:center;width:calc(var(--u)*2.1);height:calc(var(--u)*2.1);border-radius:50%;background:var(--doi,var(--mc-bang-chu));color:var(--mc-bang);font:800 calc(var(--u)*.8) var(--mc-sans)}
.mc-lv-roi-gon .mc-lv-ky{margin-left:-.45em;box-shadow:0 0 0 2px var(--mc-do-nen)}
.mc-lv-roi-gon .mc-lv-ky:first-of-type{margin-left:.1em}
.mc-lv-roi-mo{width:calc(var(--u)*20.6);padding:calc(var(--u)*1.1);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 2px var(--mc-do)}
.mc-lv-roi-mo h3{display:flex;align-items:center;gap:.4em;margin:0 0 .2em;color:var(--mc-do-nen);font:800 calc(var(--u)*1.3) var(--mc-sans)}
.mc-lv-roi-mo p{margin:calc(var(--u)*.4) 0 0;color:var(--mc-bang-phu);font:500 calc(var(--u)*.9)/1.45 var(--mc-sans)}
.mc-lv-em{display:flex;align-items:center;gap:calc(var(--u)*.75);min-height:calc(var(--u)*3.5);padding:calc(var(--u)*.35) 0}
.mc-lv-em+.mc-lv-em{box-shadow:inset 0 1px 0 var(--mc-bang-vien)}
.mc-lv-em .mc-lv-ky{width:calc(var(--u)*2.5);height:calc(var(--u)*2.5);font-size:calc(var(--u)*.92)}
.mc-lv-em span{flex:1;min-width:0;font:700 calc(var(--u)*1.12)/1.2 var(--mc-sans);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-lv-em small{display:block;margin-top:.15em;color:var(--mc-bang-phu);font:500 calc(var(--u)*.85) var(--mc-sans);font-variant-numeric:tabular-nums}
/* đợt 2 · giơ tay: thẻ gọn trung tính (không đỏ — giơ tay không phải báo động) + hàng chờ; em đang nói có sóng âm */
.mc-lv-roi-gon.mc-lv-tay-gon{background:var(--mc-thanh-nen);color:var(--mc-bang-chu);box-shadow:0 calc(var(--u)*.75) calc(var(--u)*2.1) color-mix(in srgb,var(--mc-bang) 50%,transparent),inset 0 0 0 1.5px var(--mc-vang-noi)}
.mc-lv-roi-gon.mc-lv-tay-gon svg{color:var(--mc-vang-noi)}
.mc-lv-roi-gon.mc-lv-tay-gon .mc-lv-ky{box-shadow:0 0 0 2px var(--mc-thanh-nen)}
.mc-lv-noi.mc-lv-tay h3{display:flex;align-items:center;gap:.4em;cursor:pointer}
.mc-lv-noi.mc-lv-tay h3 svg{color:var(--mc-vang-noi)}
.mc-lv-noi .mc-lv-n.moi{flex:none;background:var(--mc-bang-chu);color:var(--mc-bang);box-shadow:none}
.mc-lv-noi .mc-lv-cuoi{display:flex;justify-content:flex-end;gap:calc(var(--u)*.5);margin-top:calc(var(--u)*.5)}
.mc-lv-noi p{margin:calc(var(--u)*.3) 0 0;color:var(--mc-bang-phu);font:500 calc(var(--u)*.88)/1.4 var(--mc-sans)}
.mc-lv-noi p.loi{color:var(--mc-vang-noi);font-weight:700}
.mc-lv-em .mc-lv-muc{flex:none;height:calc(var(--u)*1.5);color:var(--mc-bang-chu)}
.mc-lv-em .mc-lv-muc i{width:calc(var(--u)*.26)}
/* 11/11 · cửa sổ nút Live neo MÉP TRÁI (nút Live đứng đầu thanh); lúc live các nút phím của thanh gom vào một nút lưới, bấm thì xoè */
.mc-lv-the{right:auto;left:calc(var(--u)*.75)}
body.mc .mc-thanh .mc-lv-gon{flex:none;display:inline-grid;place-items:center;width:calc(var(--u)*2.5);height:calc(var(--u)*2.5);padding:0;border:0;border-radius:50%;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-chu);cursor:pointer}
.mc-lv-gon[hidden]{display:none!important}
.mc-lv-gon svg{width:55%;height:55%;fill:currentColor;transition:transform .18s}
.mc-lv-gon[aria-expanded="true"]{background:var(--mc-bang-chu);color:var(--mc-bang);box-shadow:none}
.mc-lv-gon[aria-expanded="true"] svg{transform:rotate(45deg)}
.mc-lv-gon:focus-visible{outline:3px solid var(--mc-vang-noi);outline-offset:2px}
body.mc-live:not(.mc-lv-xoe) .mc-thanh>#mc-phim-nhom,body.mc-live:not(.mc-lv-xoe) .mc-thanh>#mc-len-bang,body.mc-live:not(.mc-lv-xoe) .mc-thanh>#mc-cai-btn{display:none!important}
@media (prefers-reduced-motion:reduce){.mc-lv-gon svg{transition:none}}
@media (prefers-reduced-motion:reduce){.mc-lv-vien.nhay,.mc-lv-cum .im{animation:none}.mc-lv-thuoc i{transition:none}}
html.may-yeu .mc-lv-vien.nhay,html.may-yeu .mc-lv-cum .im{animation:none}
`

export const JS_LIVE_TO_CHIEU = `
  // ── V · live bảng (thầy 10/11) — mặt của tờ; máy chạy ở app: src/components/live/thay-noi.ts ──
  var LV = { tt: null, moRoi: false, hRoi: 0, roiCu: '', hDh: 0, anhXong: false, vungCu: '', moTay: false, giayCu: '', hGon: 0 };
  var lvNut = document.createElement('button'), lvCum = document.createElement('button'), lvGon = document.createElement('button');
  var lvThe = tao('div', 'mc-lv-the', body), lvRoi = tao('div', 'mc-lv-roi', body), lvVien = tao('div', 'mc-lv-vien', body);
  var LV_BT = {
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    mat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
    roi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5m0 3.2v.3"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    tay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1.6a6 6 0 0 1-4.8-2.4L4.5 14.4a1.6 1.6 0 0 1 2.4-2.1L8 13.4"/></svg>'
  };
  function lvSach(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function lvMau(m) { m = String(m || '').trim(); return m && /^[#a-z0-9(),.%\\s-]+$/i.test(m) ? m : ''; }
  function lvGui(viec, them) {
    var d = dichApp(), m = { nguon: 'to-chieu', loai: 'live', viec: viec }, k;
    if (!d) return false;
    if (them) for (k in them) if (Object.prototype.hasOwnProperty.call(them, k)) m[k] = them[k];
    try { d.postMessage(m, '*'); return true; } catch (e) { return false; }
  }
  function lvGiay() { return document.documentElement.getAttribute('data-projector') !== 'matte-light'; }
  function lvVung() { return window.__mcBut && window.__mcBut.vung ? window.__mcBut.vung() : {}; }
  function lvDongHo(tu) { var s = Math.max(0, Math.floor((Date.now() - tu) / 1000)), p = Math.floor(s / 60); s = s % 60; return (p < 10 ? '0' : '') + p + ':' + (s < 10 ? '0' : '') + s; }
  function lvLau(luc) { var s = Math.max(0, Math.floor((Date.now() - luc) / 1000)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  lvNut.type = lvCum.type = lvGon.type = 'button';
  lvGon.className = 'mc-lv-gon'; lvGon.hidden = true; lvGon.setAttribute('aria-expanded', 'false'); lvGon.setAttribute('aria-label', 'Các nút điều khiển'); lvGon.title = 'Các nút điều khiển (phím tắt vẫn dùng được)';
  lvGon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>';
  lvNut.className = 'mc-lv-nut'; lvNut.hidden = true; lvNut.setAttribute('aria-label', 'Bật live'); lvNut.title = 'Live: cả lớp xem bảng + nghe thầy trên máy (phím V)'; lvNut.innerHTML = '<i></i>Live';
  lvCum.className = 'mc-lv-cum'; lvCum.hidden = true;
  lvThe.hidden = lvRoi.hidden = lvVien.hidden = true;
  lvThe.setAttribute('role', 'dialog'); lvThe.setAttribute('aria-label', 'Bật live');
  // nút Live + viên đỏ + nút lưới đứng ĐẦU thanh (mép trái) ⇒ cửa sổ của nút Live mở ngay phía trên, sát mép trái
  (function () { var c = thanh ? thanh.firstChild : null; if (thanh) { thanh.insertBefore(lvNut, c); thanh.insertBefore(lvCum, c); thanh.insertBefore(lvGon, c); } })();
  function lvXoe(mo) { clearTimeout(LV.hGon); body.classList.toggle('mc-lv-xoe', !!mo); lvGon.setAttribute('aria-expanded', mo ? 'true' : 'false'); if (mo) LV.hGon = setTimeout(function () { lvXoe(false); }, 8000); }
  lvGon.addEventListener('click', function (e) { e.stopPropagation(); lvXoe(!body.classList.contains('mc-lv-xoe')); });
  if (thanh) thanh.addEventListener('pointerdown', function () { if (body.classList.contains('mc-lv-xoe')) lvXoe(true); }, true);
  document.addEventListener('pointerdown', function (e) { if (body.classList.contains('mc-lv-xoe') && thanh && !thanh.contains(e.target)) lvXoe(false); }, true);
  function lvBam() { if (!LV.tt || !LV.tt.co) { baoNhanh('Mở Điểm danh (Bình Phản Ứng) trước rồi bật Live', 2200); return; } lvGui('bam'); }
  lvNut.addEventListener('click', lvBam); lvCum.addEventListener('click', lvBam);
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.closest && e.target.closest('input,textarea,select'))) return;
    if (e.key === 'v' || e.key === 'V') { e.preventDefault(); lvBam(); }
    else if (e.key === 'Escape' && !lvThe.hidden) { e.stopImmediatePropagation(); lvGui('the-dong'); }
  }, true);
  lvThe.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-lv]'); if (b) lvGui(b.getAttribute('data-lv'), b.hasAttribute('data-v') ? { v: b.getAttribute('data-v') === '1' } : null); });
  lvThe.addEventListener('change', function (e) { if (e.target && e.target.tagName === 'SELECT') lvGui('chon-mic', { id: e.target.value }); });
  lvRoi.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-thu]');
    if (b) { lvGui('thu-mic', b.getAttribute('data-thu') ? { sbd: b.getAttribute('data-thu') } : null); return; }
    b = e.target.closest && e.target.closest('[data-nghe]');
    if (b) { lvGui('nghe-em', { v: b.getAttribute('data-nghe') === '1' }); return; }
    // đợt 2: «Mời nói» · «Hạ hết tay» · mở / thu hàng giơ tay
    b = e.target.closest && e.target.closest('[data-moi]');
    if (b) { lvGui('moi', { sbd: b.getAttribute('data-moi') }); return; }
    b = e.target.closest && e.target.closest('[data-ha]');
    if (b) { lvGui('ha-tay', b.getAttribute('data-ha') ? { sbd: b.getAttribute('data-ha') } : null); LV.moTay = false; lvVeRoi(); return; }
    b = e.target.closest && e.target.closest('[data-tay]');
    if (b) { LV.moTay = !LV.moTay; lvVeRoi(); return; }
    if (lvVien.hidden || (e.target.closest && e.target.closest('.mc-lv-noi'))) return;
    LV.moRoi = !LV.moRoi; lvVeRoi(); lvHenThu();
  });
  function lvHenThu() { clearTimeout(LV.hRoi); if (LV.moRoi) LV.hRoi = setTimeout(function () { LV.moRoi = false; lvVeRoi(); }, 4000); }
  function lvVeRoi() {
    var live = !!LV.tt && LV.tt.pha === 'live', ds = (live && LV.tt.roi) || [], noi = (live && LV.tt.noi) || [], tay = (live && LV.tt.tay) || [], moi = live ? LV.tt.moi : null, mLoi = live ? LV.tt.micLoi : '', n = ds.length, nt = tay.length, h = '', i, e;
    function ky(e) { var m = lvMau(e.mau); return '<b class="mc-lv-ky"' + (m ? ' style="--doi:' + m + '"' : '') + '>' + lvSach(e.ky) + '</b>'; }
    lvVien.hidden = !n;
    if (!n) LV.moRoi = false;
    // Xem lại Live: thẻ nhắc MỘT lần «Thầy không cần bấm gì thêm» (app thầy quyết lúc hiện, tự tắt sau vài giây)
    if (live && LV.tt.nhacGhi) h += '<div class="mc-lv-noi mc-lv-ghi-nhac" role="status"><h3>' + LV_BT.mic + 'Đang tự ghi để lớp xem lại</h3><p><b>Thầy không cần bấm gì thêm.</b></p><p>Tắt live hoặc kết thúc buổi là app tự cắt đoạn, đặt tên và dựng trang xem lại.</p></div>';
    if (!nt) LV.moTay = false;
    // em đang mở mic (em lên bảng / em được mời): thẻ «Đang nói» có sóng âm + «Thu mic»; em được mời chưa bật mic: «đã mời · chờ em bật mic»
    if (noi.length || moi || mLoi) {
      h += '<div class="mc-lv-noi" role="status"><h3>' + (noi.length ? 'Đang nói' : moi ? 'Đã mời nói' : 'Mời nói') + '</h3>';
      for (i = 0; i < noi.length; i++) { e = noi[i]; h += '<div class="mc-lv-em">' + ky(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + 'mic đang bật</small></span><span class="mc-lv-muc" id="mc-lv-me" aria-hidden="true"><i style="height:45%"></i><i style="height:80%"></i><i style="height:100%"></i><i style="height:65%"></i><i style="height:35%"></i></span><button type="button" class="mc-lv-n do" style="flex:none" data-thu="' + lvSach(e.sbd) + '">Thu mic</button></div>'; }
      if (moi) h += '<div class="mc-lv-em">' + ky(moi) + '<span>' + lvSach(moi.ten) + '<small>' + (moi.doi ? lvSach(moi.doi) + ' · ' : '') + 'đã mời · chờ em bật mic</small></span><button type="button" class="mc-lv-n" style="flex:none" data-thu="' + lvSach(moi.sbd) + '">Thu mic</button></div>';
      if (mLoi) h += '<p class="loi">' + lvSach(mLoi) + ': chưa bật được mic</p>';
      // em đứng trong lớp: loa lớp phát lại giọng em qua mic máy em dễ hú ⇒ mặc định tắt; em ở xa ⇒ mặc định bật. Thầy đổi tại đây.
      if (noi.length) h += '<div class="mc-lv-dong" style="margin-top:0"><span><b>Phát tiếng em ra loa lớp</b><br>Em đứng cạnh loa thì nên tắt (dễ hú)</span><button type="button" class="mc-lv-n nho" data-nghe="' + (LV.tt.ngheEm ? '0' : '1') + '" aria-pressed="' + (!!LV.tt.ngheEm) + '">' + (LV.tt.ngheEm ? 'Đang bật' : 'Đang tắt') + '</button></div>';
      if (noi.length) h += '<div class="mc-lv-cuoi"><button type="button" class="mc-lv-n nho" data-thu="">Tắt mic tất cả</button></div>';
      h += '</div>';
    }
    // hàng giơ tay: thẻ gọn «N em giơ tay»; bấm ⇒ hàng chờ theo thứ tự giơ, mỗi em «Mời nói», dưới cùng «Hạ hết tay»
    if (nt && !LV.moTay) {
      h += '<button type="button" class="mc-lv-roi-gon mc-lv-tay-gon" data-tay="1" aria-expanded="false" aria-label="' + nt + ' em giơ tay, bấm để xem hàng chờ">' + LV_BT.tay + '<span>' + nt + ' em giơ tay</span>';
      for (i = 0; i < Math.min(3, nt); i++) h += ky(tay[i]);
      h += '</button>';
    } else if (nt) {
      h += '<div class="mc-lv-noi mc-lv-tay" role="group" aria-label="Hàng giơ tay"><h3 data-tay="1">' + LV_BT.tay + nt + ' em giơ tay</h3>';
      for (i = 0; i < Math.min(4, nt); i++) { e = tay[i]; h += '<div class="mc-lv-em">' + ky(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + 'thứ ' + (i + 1) + ' trong hàng</small></span><button type="button" class="mc-lv-n nho moi" data-moi="' + lvSach(e.sbd) + '">Mời nói</button></div>'; }
      if (nt > 4) h += '<p>+' + (nt - 4) + ' em nữa</p>';
      h += '<div class="mc-lv-cuoi"><button type="button" class="mc-lv-n nho" data-ha="">Hạ hết tay</button></div></div>';
    }
    if (n && !LV.moRoi) {
      h += '<button type="button" class="mc-lv-roi-gon" aria-label="' + n + ' em rời màn, bấm để xem tên">' + LV_BT.roi + '<span>' + n + ' em rời màn</span>';
      for (i = 0; i < Math.min(3, n); i++) h += ky(ds[i]);
      h += '</button>';
    } else if (n) {
      h += '<div class="mc-lv-roi-mo" role="status"><h3>' + LV_BT.roi + n + ' em rời màn</h3>';
      for (i = 0; i < Math.min(3, n); i++) { e = ds[i]; h += '<div class="mc-lv-em">' + ky(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + (e.kieu ? lvSach(e.kieu) : 'rời màn') + ' · ' + lvLau(e.luc) + '</small></span></div>'; }
      if (n > 3) h += '<p>+' + (n - 3) + ' em nữa</p>';
      h += '<p>Em quay lại thì tên tự mất.</p></div>';
    } else if (live && LV.tt.chuaGui && !noi.length && !nt && !moi) {
      // không em nào rời: chỗ này nhắc «Lượt đang mở · N em chưa gửi» (thầy viết lời giải khi lượt chưa mở đáp án — đặc tả mục 5)
      h += '<span class="mc-lv-nhac" role="status">Lượt đang mở · ' + LV.tt.chuaGui + ' em chưa gửi</span>';
    }
    lvRoi.hidden = !h;
    if (lvRoi.__h !== h) { lvRoi.__h = h; lvRoi.innerHTML = h; }
  }
  function lvVeThe() {
    var t = LV.tt && LV.tt.the, h, i, m, loi;
    lvThe.hidden = !t;
    if (!t) return;
    loi = t.loi === 'mic-tu-choi' ? 'trình duyệt chưa cho dùng mic' : t.loi === 'khong-mic' ? 'máy này không thấy mic nào' : t.loi ? 'mic chưa mở được' : '';
    h = '<h3>' + (LV.tt.pha === 'live' ? (LV.tt.nghi ? 'Đang tạm dừng live' : 'Đang live') : 'Bật live cho ' + (LV.tt.lop ? 'lớp ' + lvSach(LV.tt.lop) : 'cả lớp')) + '</h3>'
      + '<p>' + (LV.tt.tong || 0) + ' em đã vào phòng sẽ thấy màn chiếu này' + (LV.tt.coTieng ? ' và nghe tiếng thầy ngay.' : '. Buổi này live chưa có tiếng trên máy em.') + '</p>';
    if (LV.tt.coTieng) {
      if (loi) h += '<p class="loi">Chưa dùng được mic: ' + loi + '.</p>';
      else {
        h += '<label class="mc-lv-chon">' + LV_BT.mic + '<select aria-label="Chọn mic">';
        for (i = 0; i < t.ds.length; i++) { m = t.ds[i]; h += '<option value="' + lvSach(m.id) + '"' + (m.id === t.chon ? ' selected' : '') + '>Mic: ' + lvSach(m.ten) + '</option>'; }
        if (!t.ds.length) h += '<option>Mic mặc định của máy</option>';
        h += '</select></label><div class="mc-lv-dong"><span>Mức âm khi thầy nói thử</span><span id="mc-lv-nx"></span></div><div class="mc-lv-thuoc"><i id="mc-lv-th"></i></div>'
          + '<div class="mc-lv-dong"><span><b>Lọc tiếng ồn + khử vọng</b><br>Đang bật — hợp với loa lớp</span><span class="mc-lv-n nho" aria-hidden="true">Đang bật</span></div>';
      }
      h += '<div class="mc-lv-dong"><span><b>Tiếng trên máy em</b><br>Em trong lớp nghe thầy trực tiếp</span><span style="display:inline-flex;gap:.4em">'
        + '<button type="button" class="mc-lv-n nho" data-lv="tieng-lop" data-v="0" aria-pressed="' + (!t.tiengLop) + '">Em ở xa</button><button type="button" class="mc-lv-n nho" data-lv="tieng-lop" data-v="1" aria-pressed="' + (!!t.tiengLop) + '">Tất cả</button></span></div>';
    }
    // điểm quyết 4: mặc định TẮT, thầy bật từng buổi — chỉ em có tên trong lớp, đã đăng nhập; không điểm danh, không đội, không kJ
    if (LV.tt.dot2) h += '<div class="mc-lv-dong"><span><b>Cho em ở xa vào xem</b><br>Em có tên trong lớp · không điểm danh, không kJ</span><button type="button" class="mc-lv-n nho" data-lv="xa" data-v="' + (t.xa ? '0' : '1') + '" aria-pressed="' + (!!t.xa) + '">' + (t.xa ? 'Đang bật' : 'Đang tắt') + '</button></div>';
    if (LV.tt.pha === 'live') h += '<div class="mc-lv-dong"><span><b>Bảng → máy em</b><br>Đưa cả lớp vào bảng live ngay, kể cả em chưa gửi</span><button type="button" class="mc-lv-n nho" data-lv="bang" data-v="' + (LV.tt.bang ? '0' : '1') + '" aria-pressed="' + (!!LV.tt.bang) + '">' + (LV.tt.bang ? 'Đang bật' : 'Đang tắt') + '</button></div>';
    h += '<div class="mc-lv-hang">';
    if (LV.tt.pha === 'live') {
      // «Bảng → máy em»: ép cả lớp vào bảng live kể cả em chưa gửi (tự bật khi gọi em lên bảng, tự tắt khi sang lượt mới) · «Tạm dừng» ⇄ «Tiếp tục» · «Kết thúc live»
      h += '<button type="button" class="mc-lv-n" data-lv="tam-dung" data-v="' + (LV.tt.nghi ? '0' : '1') + '" aria-pressed="' + (!!LV.tt.nghi) + '" style="flex:1">' + (LV.tt.nghi ? 'Tiếp tục' : 'Tạm dừng') + '</button>'
        + '<button type="button" class="mc-lv-n do" data-lv="tat"><i></i>Kết thúc live</button><button type="button" class="mc-lv-n" data-lv="the-dong">Xong</button>';
    }
    else if (loi) h += '<button type="button" class="mc-lv-n do" data-lv="khong-tieng"><i></i>Live không tiếng</button><button type="button" class="mc-lv-n" data-lv="thu-lai">Thử lại</button><button type="button" class="mc-lv-n" data-lv="the-dong">Để sau</button>';
    else h += '<button type="button" class="mc-lv-n do" data-lv="' + (LV.tt.coTieng ? 'bat-dau' : 'khong-tieng') + '"><i></i>Bắt đầu live</button><button type="button" class="mc-lv-n" data-lv="the-dong">Để sau</button>';
    lvThe.innerHTML = h + '</div>';
  }
  /** Xem lại Live: ngăn ghi của viên Live. ghi vắng = công tắc tắt ⇒ không vẽ. Máy ghi chưa báo trong 15 giây đầu ⇒ chưa vẽ gì (đang khởi động). */
  function lvNganGhi(t) {
    if (!t.ghi) return '';
    if (t.ghi === 'dang-ghi') return '<span class="ghi" role="status">' + LV_BT.mic + 'Đang ghi<b>&nbsp;để xem lại</b></span>';
    if (t.ghi === 'loi' || Date.now() - (t.tu || Date.now()) > 15000) return '<span class="ghi-loi" role="status">Chưa ghi được · live vẫn chạy</span>';
    return '';
  }
  function lvVeMuc(v, em) {
    var ds = lvCum.querySelectorAll('.mc-lv-muc i'), n = Math.round(Math.min(1, v * 2.2) * ds.length), i, th = document.getElementById('mc-lv-th'), nx = document.getElementById('mc-lv-nx'), me = document.getElementById('mc-lv-me');
    for (i = 0; i < ds.length; i++) ds[i].className = i < n ? 'b' : '';
    // sóng âm của em đang nói (máy thầy chỉ đo được khi đang phát tiếng em ra loa; không đo được ⇒ sóng đứng mờ)
    if (me) { ds = me.children; n = Math.round(Math.min(1, em * 3) * ds.length); for (i = 0; i < ds.length; i++) ds[i].className = i < n ? 'b' : ''; }
    if (th) th.style.transform = 'scaleX(' + Math.min(1, v * 2.2).toFixed(2) + ')';
    if (nx) nx.textContent = v < 0.04 ? 'Chưa nghe thấy' : v < 0.12 ? 'Hơi nhỏ' : v < 0.6 ? 'Vừa đủ' : 'Hơi to';
  }
  function lvVe() {
    var t = LV.tt, live = !!t && t.pha === 'live', dang = !!t && t.pha === 'dang-bat', h, i, khoa;
    lvNut.hidden = !t || !t.co || live || dang;
    lvCum.hidden = !(live || dang); lvGon.hidden = !live;
    if (!live && body.classList.contains('mc-lv-xoe')) lvXoe(false);
    body.classList.toggle('mc-live', live);
    clearInterval(LV.hDh);
    if (dang) { lvCum.className = 'mc-lv-cum'; lvCum.innerHTML = '<span><i class="cham"></i>Đang bật live…</span>'; }
    if (live) {
      lvCum.className = 'mc-lv-cum' + (t.noiLai || t.mayKhac || t.nghi ? ' vang' : '');
      lvCum.setAttribute('aria-label', (t.nghi ? 'Đang tạm dừng live, ' : 'Đang live, ') + t.xem + ' trên ' + t.tong + ' em đang xem. Bấm để tạm dừng, kết thúc, chỉnh mic');
      if (t.noiLai) lvCum.innerHTML = '<span>Đang nối lại…</span>';
      else if (t.mayKhac) lvCum.innerHTML = '<span>Đang live ở máy khác</span>';
      else {
        h = '';
        for (i = 0; i < 7; i++) h += '<i style="height:' + [36, 59, 82, 100, 73, 45, 27][i] + '%"></i>';
        lvCum.innerHTML = '<span><i class="cham"></i>' + (t.nghi ? 'TẠM DỪNG' : 'LIVE') + ' <b id="mc-lv-dh">' + lvDongHo(t.tu || Date.now()) + '</b></span>'
          + '<span>' + LV_BT.mat + '<b>' + t.xem + '</b><small>/' + t.tong + ' em xem</small></span>'
          + (t.nghi ? '' : t.coTieng && !t.khongTieng ? '<span class="' + (t.micIm ? 'im' : '') + '" aria-label="Mức mic">' + LV_BT.mic + (t.micIm ? 'Mic đang im' : '<span class="mc-lv-muc">' + h + '</span>') + '</span>' : '<span>Không tiếng</span>')
          + lvNganGhi(t);
        LV.hDh = setInterval(function () { var d = document.getElementById('mc-lv-dh'); if (d && LV.tt && LV.tt.tu) d.textContent = lvDongHo(LV.tt.tu); if (LV.moRoi) lvVeRoi(); lvBaoGiay(); if (LV.tt && LV.tt.ghi === 'tat' && !lvCum.querySelector('.ghi-loi') && Date.now() - (LV.tt.tu || Date.now()) > 15000) lvVe(); }, 1000);
      }
    }
    lvVeThe();
    // em MỚI rời ⇒ viền nháy 2 nhịp + thẻ tự mở 4 giây
    khoa = live && t.roi ? t.roi.map(function (e) { return e.sbd; }).join(',') : '';
    if (khoa && khoa !== LV.roiCu && khoa.split(',').some(function (s) { return (',' + LV.roiCu + ',').indexOf(',' + s + ',') < 0; })) {
      LV.moRoi = true; lvHenThu();
      lvVien.classList.remove('nhay'); void lvVien.offsetWidth; lvVien.classList.add('nhay');
    }
    LV.roiCu = khoa;
    lvVeRoi();
  }
  // Bút ⇒ app: mọi sự kiện, nguyên văn. Sự kiện «trang» kèm ô giấy / ô bảng; bố cục đợt mới xếp xong (0,7 s) mà ô đổi thì báo lại.
  function lvBaoVung(tr) {
    var v = lvVung(), k = JSON.stringify(v);
    if (k === LV.vungCu) return;
    LV.vungCu = k; lvGui('vung', { trang: tr, vung: v, giayToi: lvGiay() });
  }
  // ĐO BỐ CỤC GIẤY ĐỀ (đợt 2, rủi ro R3): mỗi khối chữ của giấy ⇒ [loại, thứ tự, x, y, rộng, cao, cỡ chữ × 10, cao dòng × 10, đậm / 100, x hết chữ, y hết chữ]
  // (px của cửa sổ này, gốc = góc ô giấy). CHỈ SỐ ĐO — không chữ, không đáp án. Giấy có ảnh / bảng / sơ đồ ⇒ la = true (máy em dùng cách dựng thường, ẩn nét trên giấy).
  function lvDoGiay() {
    var d = dot(), g = d && d.querySelector ? d.querySelector('.mc-vung-de') : null, th = g ? g.querySelector('.mc-than') : null, G, o = [], la, i, c, e, ds;
    if (!g || !th || !window.__mcBut) return null;
    G = g.getBoundingClientRect();
    if (G.width < 80 || G.height < 80) return null;
    function hop(e) { var r = e.getBoundingClientRect(), s = getComputedStyle(e), pl = parseFloat(s.paddingLeft) || 0, pt = parseFloat(s.paddingTop) || 0; return { x: r.left - G.left + pl, y: r.top - G.top + pt, w: r.width - pl - (parseFloat(s.paddingRight) || 0), h: r.height - pt - (parseFloat(s.paddingBottom) || 0), s: s, r: r }; }
    function het(e, b) {
      var w = document.createTreeWalker(e, 4, null, false), n, cuoi = null, dai, rg, rs, r;
      while ((n = w.nextNode())) if (/\\S/.test(n.data)) cuoi = n;
      if (!cuoi) return [0, 0];
      dai = cuoi.data.replace(/\\s+$/, '').length; rg = document.createRange(); rg.setStart(cuoi, Math.max(0, dai - 1)); rg.setEnd(cuoi, dai);
      rs = rg.getClientRects(); r = rs.length ? rs[rs.length - 1] : rg.getBoundingClientRect();
      return [r.right - G.left - b.x, r.top - G.top - b.y];
    }
    function them(loai, tt, e, chu) {
      var b, co, k;
      if (!e || o.length >= 22) return;
      b = hop(e); co = parseFloat(b.s.fontSize) || 0; k = chu ? het(e, b) : [0, 0];
      if (b.r.width < 1 || b.r.height < 1) return;
      o.push([loai, tt, b.x, b.y, b.w, b.h, co * 10, (parseFloat(b.s.lineHeight) || co * 1.2) * 10, (parseInt(b.s.fontWeight, 10) || 400) / 100, k[0], k[1]].map(Math.round));
    }
    la = !!th.querySelector('img,table,svg,canvas,video,.katex,.ex-demo,.q-bang-cuon,.mc-anh') || th.querySelectorAll('.mc-de').length !== 1;
    for (i = 0; i < th.children.length; i++) { c = th.children[i]; if (!/(^|\\s)(mc-de|mc-ds-pa|mc-ngan)(\\s|$)/.test(c.className) && c.getBoundingClientRect().height > 1) la = true; }
    e = g.querySelector('.mc-de-so'); them(0, e ? Math.min(23, parseInt(String(e.textContent).replace(/\\D+/g, ''), 10) || 0) : 0, e, false);
    them(1, 0, g.querySelector('.mc-de-phan'), false);
    them(2, 0, th.querySelector('.mc-de'), true);
    ds = th.querySelectorAll('.mc-ds-pa > .mc-pa');
    for (i = 0; i < Math.min(4, ds.length); i++) { them(5, i, ds[i], false); them(4, i, ds[i].querySelector('.mc-ky'), false); them(3, i, ds[i].querySelector('.mc-pa-chu'), true); }
    them(6, 0, th.querySelector('.mc-ngan'), true);
    return { k: String(window.__mcBut.trang()).replace(/~/g, '-').slice(0, 12), w: Math.round(G.width), h: Math.round(G.height), la: la, o: o };
  }
  function lvBaoGiay() {
    var g = LV.tt && LV.tt.pha === 'live' ? lvDoGiay() : null, k = g ? JSON.stringify(g) : '';
    if (k === LV.giayCu) return;
    LV.giayCu = k; lvGui('giay', { giay: g });
  }
  function lvAnh() {
    var b = window.__mcBut, x;
    if (!b) return;
    x = b.xuat(); LV.vungCu = JSON.stringify(lvVung());
    lvGui('anh', { trang: b.trang(), tiLe: x.tiLe, net: x.net, vung: lvVung(), giayToi: lvGiay() });
    LV.anhXong = true;
  }
  if (window.__mcBut) window.__mcBut.nghe(function (sk) {
    if (!LV.anhXong) return;
    if (sk.loai === 'trang') { LV.vungCu = JSON.stringify(lvVung()); lvGui('but', { sk: sk, vung: lvVung(), giayToi: lvGiay() }); setTimeout(function () { if (window.__mcBut.trang() === sk.trang) lvBaoVung(sk.trang); }, 700); }
    else lvGui('but', { sk: sk });
  });
  ['mc-doi-pha', 'mc-bo-cuc-xong'].forEach(function (t) { document.addEventListener(t, function () { if (LV.anhXong && window.__mcBut) setTimeout(function () { lvBaoVung(window.__mcBut.trang()); }, 650); }); });
  window.addEventListener('resize', function () { if (LV.anhXong && window.__mcBut) setTimeout(lvAnh, 300); });
  window.addEventListener('message', function (e) {
    var m = e.data, truoc;
    if (!m || m.nguon !== 'bpu-bang' || e.source !== dichApp()) return;
    if (m.lenh === 'live-muc') { lvVeMuc(+m.v || 0, +m.em || 0); return; }
    if (m.lenh !== 'live-tt') return;
    truoc = LV.tt; LV.tt = m.tt || null;
    if (LV.tt && LV.tt.co && !LV.anhXong) lvAnh();
    // vừa vào live ⇒ bút bật sẵn trên bảng đen
    if (LV.tt && LV.tt.pha === 'live' && !(truoc && truoc.pha === 'live') && window.__mcBut) window.__mcBut.bat(true);
    // vừa vào live ⇒ đo bố cục giấy đề ngay; sau đó đo lại theo nhịp đồng hồ của viên Live (mỗi giây, đổi mới gửi) — không thêm vòng hẹn giờ
    if (LV.tt && LV.tt.pha === 'live' && !(truoc && truoc.pha === 'live')) { LV.giayCu = ''; setTimeout(lvBaoGiay, 60); }
    lvVe();
  });
  window.__mcLive = { tt: function () { return LV.tt; }, bam: lvBam };
  lvGui('chao');
`
