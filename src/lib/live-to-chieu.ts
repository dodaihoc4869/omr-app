// LIVE BẢNG TRÊN TỜ CHIẾU (thầy duyệt 10/11 «CHỐT BUILD»; đặc tả docs/dac-ta-live-bang-1011.md mục 2.1, 3; bản vẽ docs/ban-ve-live-1011 ảnh 01–09).
// Đoạn JS + CSS chèn vào tờ (len-bang-moi-to-chieu.ts, cùng phạm vi: body · tao · thanh · dichApp · baoNhanh). Tách tệp riêng vì cổng cỡ tệp.
// Tờ CHỈ LÀ MẶT: nút «Live», thẻ bật live + chọn mic, viên đỏ ba ngăn, «Tắt live», thẻ gọn «N em rời màn» + viền đỏ mảnh. MÁY CHẠY ở cửa sổ app
// (src/components/live/thay-noi.ts): mic + WebRTC + phòng nằm ở đó vì (1) tờ là khung dựng lại mỗi lần thầy chọn câu — nối ở tờ thì rớt live;
// (2) khung `srcdoc` / tờ mở cửa sổ riêng không chắc có quyền mic; (3) WebSocket của phòng vốn ở app.
// LUẬT (thầy chốt tối 10/11): bật live = TIẾNG chạy suốt buổi, qua mọi lần chuyển câu / dựng lại tờ; BẢNG chỉ xuống máy em khi cờ phòng `live.bang` bật
// (tự bật lúc gọi em lên bảng, tự tắt lúc mở lượt mới) — công tắc «Bảng → máy em» trong cụm Live để thầy bật / tắt tay. Em lên bảng mở mic ⇒ thẻ «Đang nói» + «Thu mic».
// Tờ → app:  { nguon:'to-chieu', loai:'live', viec, … }   viec = chao · bam · the-dong · chon-mic · bat-dau · khong-tieng · thu-lai · tieng-lop · tat · bang · thu-mic · nghe-em · but · anh · vung
//             · mic 11/11: loc { v: 'tu' | 'bat' | 'tat' } («Lọc tiếng ồn + khử vọng»: tự động / luôn bật / luôn tắt); `live-muc` kèm `cd` = dòng chẩn đoán mic
//             · đợt 2 (11/11, đặc tả 4.8): moi { sbd } · ha-tay { sbd? } · thu-mic { sbd? } (không sbd = «Tắt mic tất cả») · xa { v } · giay { giay }
// App → tờ:  { nguon:'bpu-bang', lenh:'live-tt', tt }  (toàn bộ trạng thái để vẽ)   ·   { nguon:'bpu-bang', lenh:'live-muc', v, em }  (mức âm mic thầy / em đang nói 0..1, ~11 lần / giây)
// ĐỢT 2: thẻ gọn «N em giơ tay» (bấm ⇒ hàng chờ, mỗi em «Mời nói», dưới cùng «Hạ hết tay») · thẻ «Đang nói» có sóng âm + «Thu mic» + «Tắt mic tất cả» ·
// SỬA 11/11 SAU KHI THẦY TEST MÁY THẬT: (1) «nút tạm dừng live và kết thúc live ở trong nút live luôn» ⇒ cửa sổ của nút Live (bấm viên đỏ) có «Tạm dừng» ⇄
// «Tiếp tục», «Kết thúc live», và công tắc «Bảng → máy em» (trước nằm rời trên thanh); (2) «cửa sổ của nút live cũng [sang mép trái]» ⇒ nút Live + viên đỏ
// đứng ĐẦU thanh (mép trái), cửa sổ neo mép trái; (3) «các nút bấm ở thanh dưới thu gọn vào một biểu tượng» ⇒ nút lưới «thêm» + khay — từ chiều 11/11
// (thầy: «Phần nút ở dưới chưa gọn») dùng cho MỌI trạng thái, dựng ở thanh-day-to-chieu.ts. Phím tắt giữ nguyên.
// công tắc «Cho em ở xa vào xem» trong thẻ mic (sau cờ `dot2`) · thẻ «em rời màn» ghi KIỂU rời · tờ ĐO bố cục giấy đề (chỉ số đo, không chữ) gửi app ⇒ phòng ⇒ máy em dựng
// giấy cùng bề rộng, cùng cỡ chữ (rủi ro R3 của đặc tả).
// Bút: mọi sự kiện của `window.__mcBut.nghe` chuyển nguyên văn sang app (`viec:'but'`); sự kiện `trang` kèm ô giấy / ô bảng (`__mcBut.vung()`) + kiểu giấy
// ⇒ máy em dựng đúng bố cục (src/components/live/bo-cuc.ts). Bấm Live ⇒ bút bật sẵn.
// Màu: chỉ biến sẵn có của tờ (--mc-*); màu đội của em rời màn là dữ liệu app gửi sang (đặt vào biến --doi sau khi lọc ký tự).

// Chú thích từng khối CSS bên dưới (dời khỏi chuỗi 12/11 để không xuống máy):
//   Live theo khối 12/11: chế độ «Bảng» ⇒ ẩn giấy đề, bảng kín màn
//   7c · live 10/11: nút Live, viên đỏ ba ngăn, thẻ mic, thẻ gọn em rời màn
//   Xem lại Live (11/11): ngăn «Đang ghi để xem lại» trong viên Live; chưa ghi được ⇒ ngăn vàng, live vẫn chạy. Thẻ nhắc một lần dùng lại khung .mc-lv-noi.
//   màn chiếu hẹp (1366): cụm Live gọn lại để «Tắt live» + «Cài đặt» không bị đẩy khỏi thanh
//   thẻ nổi neo trên thanh
//   em rời màn: viền đỏ mảnh đứng yên (nháy 2 nhịp khi có em MỚI rời) + thẻ gọn ở góc phải, bấm / có em mới ⇒ mở tên, 4 giây tự thu
//   đợt 2 · giơ tay: thẻ gọn trung tính (không đỏ — giơ tay không phải báo động) + hàng chờ; em đang nói có sóng âm
//   dòng chẩn đoán mic: chữ nhỏ, chọn / chụp được
//   11/11 · cửa sổ nút Live neo MÉP TRÁI (nút Live đứng đầu thanh). Dáng nút lưới «thêm» (.mc-lv-gon) khai ở đây từ bản K5; nút + khay nay dựng ở thanh-day-to-chieu.ts cho MỌI trạng thái
// 12/11 · BẢNG MIC GỌN (thầy: «làm cái bảng này gọn lại, bỏ hết mấy chỗ giải thích đi, trực quan dễ dùng»): mỗi cài đặt MỘT hàng — cột nhãn · thanh phân đoạn
// (nút ≥ 40 px); chữ chỉ khi có vấn đề (.mc-lv-canh); «Chi tiết» thu gọn ở cuối. Luật CSS mới CHỈ trong .mc-lv-the: .mc-lv-n.nho / .mc-lv-dong của thẻ «Đang nói»
// giữ nguyên. Bảng cao quá màn (khổ thấp) ⇒ tự cuộn trong khung, không tràn mép trên.
import { CSS_LIVE_KHOI, JS_LIVE_KHOI_TO_CHIEU } from './live-khoi-to-chieu'
import { CSS_LIVE_NOP } from './live-nop-to-chieu'

export const CSS_LIVE_TO_CHIEU = `
body.mc-che-bang .mc-vung-de,body.mc-che-bang .mc-trang{display:none!important}
body.mc-che-bang.mc-bc .mc-dot-don .mc-cot-lam-bai{display:block!important;grid-column:1/-1!important;grid-row:1/-1!important}
body.mc-che-bang.mc-bc .mc-dot-don .mc-cot-lam-bai::after{content:""!important;display:block!important;position:absolute;left:66.667%;top:0;bottom:0;width:2px;background:var(--mc-bang-nut);pointer-events:none}
body.mc-lk{--mc-den:var(--mc-bang)}
body.mc-lk .mc-thanh .mc-lv-nut{display:none!important}
body.mc-che-bang .mc-buoc,body.mc-che-bang #mc-pha,body.mc-che-bang #mc-len-bang,body.mc-che-bang #mc-phim-nhom>:not(.mc-khay),body.mc-che-bang #mc-tiep,body.mc-che-bang .mc-em,body.mc-che-bang .mc-em.bpu-the:not([hidden]){display:none!important}
body.mc-che-bang .mc-khay-nhom:not(.mc-khay-lk){display:none}
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
.mc-lv-cum>span.ghi-loi{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}
.mc-lv-ghi-nhac h3{display:flex;align-items:center;gap:.4em}
.mc-lv-ghi-nhac p{margin:calc(var(--u)*.3) 0 0;color:var(--mc-bang-phu);font:500 calc(var(--u)*.9)/1.45 var(--mc-sans)}
.mc-lv-ghi-nhac p b{color:var(--mc-bang-chu)}
@media (max-width:1180px){.mc-lv-cum>span.ghi b{display:none}}
.mc-lv-cum .im{animation:mcLvNhay 1s steps(2,jump-none) infinite}
@keyframes mcLvNhay{from{background:transparent;color:inherit}to{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}}
body.mc .mc-thanh .mc-lv-bg{gap:.45em;padding:0 .8em}
.mc-lv-bg i{display:block;width:.62em;height:.62em;border-radius:50%;box-shadow:inset 0 0 0 1.5px currentColor}
.mc-lv-bg[aria-pressed="true"]{background:var(--mc-bang-chu)!important;color:var(--mc-bang)!important;box-shadow:none!important}
.mc-lv-bg[aria-pressed="true"] i{background:var(--mc-do);box-shadow:none}
@media (max-width:1500px){.mc-lv-cum small,.mc-lv-bg span{display:none}body.mc-live .mc-thanh{gap:calc(var(--u)*.3)}.mc-lv-cum>span{padding:0 .6em}}
body.mc-live .mc-thanh{gap:calc(var(--u)*.4)}
.mc-lv-nhac{display:inline-flex;align-items:center;height:calc(var(--u)*2.3);padding:0 1em;border-radius:999px;background:var(--mc-thanh-nen);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-phu);font:600 calc(var(--u)*.9) var(--mc-sans);white-space:nowrap;font-variant-numeric:tabular-nums}
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
.mc-lv-the .mc-lv-cd{margin-top:calc(var(--u)*.6);font:500 calc(var(--u)*.72)/1.4 var(--mc-sans);color:var(--mc-bang-phu);opacity:.85;user-select:text;overflow-wrap:anywhere}
.mc-lv-the .mc-lv-cd:empty{display:none}
.mc-lv-the{right:auto;left:calc(var(--u)*.75)}
body.mc .mc-thanh .mc-lv-gon{flex:none;display:inline-grid;place-items:center;width:calc(var(--u)*2.5);height:calc(var(--u)*2.5);padding:0;border:0;border-radius:50%;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-chu);cursor:pointer}
.mc-lv-gon[hidden]{display:none!important}
.mc-lv-gon svg{width:55%;height:55%;fill:currentColor;transition:transform .14s}
.mc-lv-gon[aria-expanded="true"]{background:var(--mc-bang-chu);color:var(--mc-bang);box-shadow:none}
.mc-lv-gon[aria-expanded="true"] svg{transform:rotate(45deg)}
.mc-lv-gon:focus-visible{outline:3px solid var(--mc-vang-noi);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.mc-lv-gon svg{transition:none}}
@media (prefers-reduced-motion:reduce){.mc-lv-vien.nhay,.mc-lv-cum .im{animation:none}.mc-lv-thuoc i{transition:none}}
html.may-yeu .mc-lv-vien.nhay,html.may-yeu .mc-lv-cum .im{animation:none}
.mc-lv-the{max-height:calc(100vh - var(--u)*6);overflow-y:auto;overscroll-behavior:contain}
.mc-lv-the .mc-lv-chon{margin-top:calc(var(--u)*.6)}
.mc-lv-cai{display:grid;grid-template-columns:calc(var(--u)*7.6) minmax(0,1fr);align-items:center;gap:calc(var(--u)*.6);margin-top:calc(var(--u)*.6)}
.mc-lv-cai.doc{grid-template-columns:minmax(0,1fr);gap:calc(var(--u)*.35)}
.mc-lv-cai>b{min-width:0;font:700 calc(var(--u)*.95)/1.25 var(--mc-sans)}
.mc-lv-cai small{display:block;color:var(--mc-bang-phu);font:600 calc(var(--u)*.78) var(--mc-sans);font-variant-numeric:tabular-nums}
.mc-lv-seg{display:flex;gap:2px;padding:3px;border-radius:999px;background:var(--mc-bang-nut)}
.mc-lv-seg .mc-lv-n{flex:1 1 auto;height:max(40px,calc(var(--u)*2.4));padding:0 .7em;box-shadow:none;font:700 calc(var(--u)*.92) var(--mc-sans)}
.mc-lv-am{display:flex;align-items:center;gap:calc(var(--u)*.6)}
.mc-lv-am .mc-lv-thuoc{display:block;flex:1;margin:0}
.mc-lv-am #mc-lv-nx{flex:none;min-width:calc(var(--u)*6.2);text-align:right;color:var(--mc-bang-phu);font:600 calc(var(--u)*.85) var(--mc-sans)}
.mc-lv-loa{display:flex;align-items:center;gap:calc(var(--u)*.6);margin-top:calc(var(--u)*.6)}
.mc-lv-loa .mc-lv-chon{flex:1;min-width:0;margin:0}
.mc-lv-loa .mc-lv-n[aria-busy="true"]{opacity:.6}
.mc-lv-the .mc-lv-canh{display:flex;align-items:flex-start;gap:.45em;margin-top:calc(var(--u)*.5);font:700 calc(var(--u)*.9)/1.35 var(--mc-sans)}
.mc-lv-the .mc-lv-canh svg{width:1.15em;height:1.15em;margin-top:.1em}
.mc-lv-ct{margin-top:calc(var(--u)*.3)}
.mc-lv-ct summary{display:flex;align-items:center;min-height:max(40px,calc(var(--u)*2.4));color:var(--mc-bang-phu);font:600 calc(var(--u)*.8) var(--mc-sans);cursor:pointer;gap:.5em;list-style:none}
.mc-lv-ct summary::-webkit-details-marker{display:none}
.mc-lv-ct summary::before{content:'';width:.42em;height:.42em;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg)}
.mc-lv-ct[open]>summary::before{transform:rotate(45deg)}
.mc-lv-ct summary:focus-visible{outline:3px solid var(--mc-vang-noi);outline-offset:2px}
.mc-lv-ct .mc-lv-cd{margin-top:0}
${CSS_LIVE_NOP}${CSS_LIVE_KHOI}`

export const JS_LIVE_TO_CHIEU = `
  // ── V · live bảng (thầy 10/11) — mặt của tờ; máy chạy ở app: src/components/live/thay-noi.ts ──
  var LV = { tt: null, moRoi: false, hRoi: 0, roiCu: '', hDh: 0, anhXong: false, vungCu: '', moTay: false, giayCu: '', khoi: null };
  var lvNut = document.createElement('button'), lvCum = document.createElement('button');
  var lvThe = tao('div', 'mc-lv-the', body), lvRoi = tao('div', 'mc-lv-roi', body), lvVien = tao('div', 'mc-lv-vien', body);
  var LV_BT = {
    loa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
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
  // Chế độ Bảng (live theo khối): giấy đề ẩn ⇒ không có ô giấy ⇒ máy em mất luôn ô bảng (mã trang cần đủ hai ô). Báo một dải giấy mỏng NGAY DƯỚI bảng
  // (vùng thanh đáy, thầy không viết tới) để máy em dựng đúng ô bảng và phủ kín màn.
  function lvVung() {
    var v = window.__mcBut && window.__mcBut.vung ? window.__mcBut.vung() : {}, b = v.bang, y;
    if (b && !v.giay && document.body.classList.contains('mc-che-bang')) { y = b[3] < 0.97 ? b[3] + 0.003 : 0.972; v.giay = [b[0], y, b[2], y + 0.025]; }
    return v;
  }
  function lvDongHo(tu) { var s = Math.max(0, Math.floor((Date.now() - tu) / 1000)), p = Math.floor(s / 60); s = s % 60; return (p < 10 ? '0' : '') + p + ':' + (s < 10 ? '0' : '') + s; }
  function lvLau(luc) { var s = Math.max(0, Math.floor((Date.now() - luc) / 1000)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  lvNut.type = lvCum.type = 'button';
  lvNut.className = 'mc-lv-nut'; lvNut.hidden = true; lvNut.setAttribute('aria-label', 'Bật live'); lvNut.title = 'Live: cả lớp xem bảng + nghe thầy trên máy (phím V)'; lvNut.innerHTML = '<i></i>Live';
  lvCum.className = 'mc-lv-cum'; lvCum.hidden = true;
  lvThe.hidden = lvRoi.hidden = lvVien.hidden = true;
  lvThe.setAttribute('role', 'dialog'); lvThe.setAttribute('aria-label', 'Bật live');
  // nút Live + viên đỏ đứng ĐẦU thanh (mép trái) ⇒ cửa sổ của nút Live mở ngay phía trên, sát mép trái. Nút «thêm» + khay: thanh-day-to-chieu.ts
  (function () { var c = thanh ? thanh.firstChild : null; if (thanh) { thanh.insertBefore(lvNut, c); thanh.insertBefore(lvCum, c); } })();
  function lvBam() { if (!LV.tt || !LV.tt.co) { baoNhanh('Mở Điểm danh (Bình Phản Ứng) trước rồi bật Live', 2200); return; } lvGui('bam'); }
  lvNut.addEventListener('click', lvBam); lvCum.addEventListener('click', lvBam);
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.closest && e.target.closest('input,textarea,select'))) return;
    if (e.key === 'v' || e.key === 'V') { e.preventDefault(); lvBam(); }
    else if (e.key === 'Escape' && !lvThe.hidden) { e.stopImmediatePropagation(); lvGui('the-dong'); }
    // N: mở / đóng khay của nút «thêm» ngay tại thẻ «Đang nói» (khối đầu khay). Esc / chạm ra ngoài: khay tự thu (thanh-day-to-chieu.ts)
    else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); lvPhimN(); }
  }, true);
  function lvPhimN() {
    var k = window.__mcKhay;
    if (!LV.tt || LV.tt.pha !== 'live') { baoNhanh('Chưa bật live', 1800); return; }
    if (!k) return;
    if (!k.dangMo() && LV.khoi) LV.khoi.parentNode.scrollTop = 0;
    k.mo(!k.dangMo());
  }
  lvThe.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-lv]'); if (b) lvGui(b.getAttribute('data-lv'), b.hasAttribute('data-c') ? { v: b.getAttribute('data-c') } : b.hasAttribute('data-v') ? { v: b.getAttribute('data-v') === '1' } : null); });
  lvThe.addEventListener('change', function (e) { if (e.target && e.target.tagName === 'SELECT') lvGui(e.target.getAttribute('data-c') === 'loa' ? 'chon-loa' : 'chon-mic', { id: e.target.value }); });
  // bấm trong thẻ «Đang nói» / hàng giơ tay: MỘT bộ nghe cho thẻ ở góc (lvRoi) lẫn khối trong khay (lvVeKhoi). Trả true khi đã xử lý.
  function lvBamThe(e) {
    var b = e.target.closest && e.target.closest('[data-thu]');
    if (b) { lvGui('thu-mic', b.getAttribute('data-thu') ? { sbd: b.getAttribute('data-thu') } : null); return true; }
    b = e.target.closest && e.target.closest('[data-nghe]');
    if (b) { lvGui('nghe-em-lai', { v: false }); return true; }
    // đợt 2: «Mời nói» · «Hạ hết tay» · mở / thu hàng giơ tay
    b = e.target.closest && e.target.closest('[data-moi]');
    if (b) { lvGui('moi', { sbd: b.getAttribute('data-moi') }); return true; }
    b = e.target.closest && e.target.closest('[data-ha]');
    if (b) { lvGui('ha-tay', b.getAttribute('data-ha') ? { sbd: b.getAttribute('data-ha') } : null); LV.moTay = false; lvVeRoi(); return true; }
    b = e.target.closest && e.target.closest('[data-tay]');
    if (b) { LV.moTay = !LV.moTay; lvVeRoi(); return true; }
    return false;
  }
  lvRoi.addEventListener('click', function (e) {
    if (lvBamThe(e) || lvVien.hidden || (e.target.closest && e.target.closest('.mc-lv-noi'))) return;
    LV.moRoi = !LV.moRoi; lvVeRoi(); lvHenThu();
  });
  function lvHenThu() { clearTimeout(LV.hRoi); if (LV.moRoi) LV.hRoi = setTimeout(function () { LV.moRoi = false; lvVeRoi(); }, 4000); }
  function lvVeRoi() {
    var live = !!LV.tt && LV.tt.pha === 'live', ds = (live && LV.tt.roi) || [], noi = (live && LV.tt.noi) || [], tay = (live && LV.tt.tay) || [], moi = live ? LV.tt.moi : null, mLoi = live ? LV.tt.micLoi : '', n = ds.length, h = '', i, e, hien;
    lvVien.hidden = !n;
    if (!n) LV.moRoi = false;
    // Xem lại Live: thẻ nhắc MỘT lần «Thầy không cần bấm gì thêm» (app thầy quyết lúc hiện, tự tắt sau vài giây)
    if (live && LV.tt.nhacGhi) h += '<div class="mc-lv-noi mc-lv-ghi-nhac" role="status"><h3>' + LV_BT.mic + 'Đang tự ghi để lớp xem lại</h3><p><b>Thầy không cần bấm gì thêm.</b></p><p>Tắt live hoặc kết thúc buổi là app tự cắt đoạn, đặt tên và dựng trang xem lại.</p></div>';
    if (!tay.length) LV.moTay = false;
    // 11/11 tối: thẻ «Đang nói» KHÔNG tự bung — nằm đầy đủ trong khay của nút «thêm» (lvVeKhoi). Tờ không có khay ⇒ thẻ hiện ở góc như cũ.
    hien = !!(noi.length || moi || mLoi || tay.length) && !document.getElementById('mc-khay');
    if (hien) h += lvTheNoi(noi, tay, moi, mLoi, false);
    if (n && !LV.moRoi) {
      h += '<button type="button" class="mc-lv-roi-gon" aria-label="' + n + ' em rời màn, bấm để xem tên">' + LV_BT.roi + '<span>' + n + ' em rời màn</span>';
      for (i = 0; i < Math.min(3, n); i++) h += lvKy(ds[i]);
      h += '</button>';
    } else if (n) {
      h += '<div class="mc-lv-roi-mo" role="status"><h3>' + LV_BT.roi + n + ' em rời màn</h3>';
      for (i = 0; i < Math.min(3, n); i++) { e = ds[i]; h += '<div class="mc-lv-em">' + lvKy(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + (e.kieu ? lvSach(e.kieu) : 'rời màn') + ' · ' + lvLau(e.luc) + '</small></span></div>'; }
      if (n > 3) h += '<p>+' + (n - 3) + ' em nữa</p>';
      h += '<p>Em quay lại thì tên tự mất.</p></div>';
    } else if (live && LV.tt.chuaGui && !hien && !LV.tt.khoi) { // buổi live theo khối: nút ống nghiệm «Ai đã nộp» đã đếm ⇒ không nhắc trùng (và không đè lên tấm)
      // không em nào rời: chỗ này nhắc «Lượt đang mở · N em chưa gửi» (thầy viết lời giải khi lượt chưa mở đáp án — đặc tả mục 5)
      h += '<span class="mc-lv-nhac" role="status">Lượt đang mở · ' + LV.tt.chuaGui + ' em chưa gửi</span>';
    }
    lvRoi.hidden = !h;
    if (lvRoi.__h !== h) { lvRoi.__h = h; lvRoi.innerHTML = h; }
    lvVeKhoi(live, noi, tay, moi, mLoi);
  }
  function lvKy(e) { var m = lvMau(e.mau); return '<b class="mc-lv-ky"' + (m ? ' style="--doi:' + m + '"' : '') + '>' + lvSach(e.ky) + '</b>'; }
  // THẺ «ĐANG NÓI» + hàng giơ tay — MỘT chỗ dựng cho khối trong khay (k) lẫn thẻ ở góc. Em mở mic: sóng âm + «Thu mic»; em được mời: «chờ em bật mic».
  // Thầy chốt 11/11 tối: em bật mic là máy thầy TỰ phát tiếng em ra loa lớp (bỏ công tắc; chống hú nhờ khử vọng của trình duyệt). Trong khay, chưa ai nói
  // ⇒ chỉ dòng «Chưa có em nào nói».
  function lvTheNoi(noi, tay, moi, mLoi, k) {
    var nt = tay.length, h = '', i, e;
    if (noi.length || moi || mLoi || k) {
      h += '<div class="mc-lv-noi' + (noi.length || moi || mLoi ? '' : ' chua') + '" role="status"><h3>' + (noi.length ? 'Đang nói' : moi ? 'Đã mời nói' : mLoi ? 'Mời nói' : 'Chưa có em nào nói') + '</h3>';
      for (i = 0; i < noi.length; i++) { e = noi[i]; h += '<div class="mc-lv-em">' + lvKy(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + 'mic đang bật</small></span><span class="mc-lv-muc" id="mc-lv-me" aria-hidden="true"><i style="height:45%"></i><i style="height:80%"></i><i style="height:100%"></i><i style="height:65%"></i><i style="height:35%"></i></span><button type="button" class="mc-lv-n do" style="flex:none" data-thu="' + lvSach(e.sbd) + '">Thu mic</button></div>'; }
      if (moi) h += '<div class="mc-lv-em">' + lvKy(moi) + '<span>' + lvSach(moi.ten) + '<small>' + (moi.doi ? lvSach(moi.doi) + ' · ' : '') + 'đã mời · chờ em bật mic</small></span><button type="button" class="mc-lv-n" style="flex:none" data-thu="' + lvSach(moi.sbd) + '">Thu mic</button></div>';
      if (mLoi) h += '<p class="loi">' + lvSach(mLoi) + ': chưa bật được mic</p>';
      // lưới an toàn phía nghe: tiếng em tới máy thầy mà trình duyệt chưa cho phát ⇒ một lần chạm
      if (noi.length && LV.tt.ngheEm && LV.tt.emKet) h += '<div class="mc-lv-dong" style="margin-top:0" role="alert"><span><b>Máy chưa phát được tiếng em</b><br>Trình duyệt chặn tự phát — chạm để nghe</span><button type="button" class="mc-lv-n nho" data-nghe="lai">Chạm để nghe</button></div>';
      if (noi.length) h += '<div class="mc-lv-cuoi"><button type="button" class="mc-lv-n nho" data-thu="">Tắt mic tất cả</button></div>';
      h += '</div>';
    }
    // hàng giơ tay: thẻ gọn «N em giơ tay»; bấm ⇒ hàng chờ theo thứ tự giơ, mỗi em «Mời nói», dưới cùng «Hạ hết tay»
    if (nt && !LV.moTay) {
      h += '<button type="button" class="mc-lv-roi-gon mc-lv-tay-gon" data-tay="1" aria-expanded="false" aria-label="' + nt + ' em giơ tay, bấm để xem hàng chờ">' + LV_BT.tay + '<span>' + nt + ' em giơ tay</span>';
      for (i = 0; i < Math.min(3, nt); i++) h += lvKy(tay[i]);
      h += '</button>';
    } else if (nt) {
      h += '<div class="mc-lv-noi mc-lv-tay" role="group" aria-label="Hàng giơ tay"><h3 data-tay="1">' + LV_BT.tay + nt + ' em giơ tay</h3>';
      for (i = 0; i < Math.min(4, nt); i++) { e = tay[i]; h += '<div class="mc-lv-em">' + lvKy(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + 'thứ ' + (i + 1) + ' trong hàng</small></span><button type="button" class="mc-lv-n nho moi" data-moi="' + lvSach(e.sbd) + '">Mời nói</button></div>'; }
      if (nt > 4) h += '<p>+' + (nt - 4) + ' em nữa</p>';
      h += '<div class="mc-lv-cuoi"><button type="button" class="mc-lv-n nho" data-ha="">Hạ hết tay</button></div></div>';
    }
    return h;
  }
  function lvTenNgan(t) { return String(t || '').trim().split(/\\s+/).slice(-2).join(' '); }
  // KHỐI «ĐANG NÓI» ĐẦU KHAY của nút «thêm» (thầy 11/11 tối: «phải hiện đủ bảng … như mẫu»): đang live ⇒ thẻ đầy đủ ngay trên ba nhóm, mở khay là thấy;
  // bấm trong khối không làm khay thu (thanh-day-to-chieu.ts). Không live ⇒ khối rỗng, ẩn. Dấu đỏ trên nút «thêm»: đặc = em nói / đã mời; vòng = chỉ giơ tay.
  function lvVeKhoi(live, noi, tay, moi, mLoi) {
    var k = document.getElementById('mc-khay'), d = LV.khoi, mic = !!(noi.length || moi || mLoi), nt = tay.length, h, ten, doc = '';
    if (!k) return;
    h = live ? lvTheNoi(noi, tay, moi, mLoi, true) : '';
    if (!d && h) {
      d = LV.khoi = document.createElement('div'); d.className = 'mc-khay-noi'; d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Em đang nói');
      k.insertBefore(d, k.firstChild);
      d.addEventListener('click', lvBamThe);
    }
    if (d) {
      // không vẽ lại khi chữ không đổi ⇒ nút đang được bấm / giữ tiêu điểm không bị thay
      if (d.__h !== h) { d.__h = h; d.innerHTML = h; }
      d.hidden = !h;
      d.classList.toggle('co-mic', !!noi.length);
    }
    if (mic || nt) {
      ten = noi.length ? lvTenNgan(noi[0].ten) : moi ? lvTenNgan(moi.ten) : lvTenNgan(mLoi);
      doc = noi.length ? ten + ' đang nói' : moi ? 'đã mời ' + ten + ' nói' : mLoi ? ten + ' chưa bật được mic' : nt + ' em giơ tay';
      if (mic && nt) doc += ', ' + nt + ' em giơ tay';
    }
    if (window.__mcKhay && window.__mcKhay.noi) window.__mcKhay.noi(mic ? 'noi' : nt ? 'tay' : '', doc);
  }
  // BẢNG MIC GỌN (thầy 12/11 trưa, kèm ảnh màn chiếu: «làm cái bảng này gọn lại, bỏ hết mấy chỗ giải thích đi, trực quan dễ dùng»): MỖI cài đặt MỘT hàng
  // (nhãn ngắn · thanh phân đoạn), bỏ mọi dòng mô tả; chữ CHỈ hiện khi có vấn đề (lvCanh, một dòng ngắn); dòng mô hình «Chỉ giọng thầy» + đo tiếng + chẩn đoán
  // mic gom vào «Chi tiết» ở cuối (đóng sẵn; đang mở thì giữ mở qua mỗi lần vẽ lại ~1 giây / lần, đóng bảng rồi mở lại ⇒ đóng). data-lv / data-c / data-v giữ nguyên.
  function lvCanh(s) { return '<p class="loi mc-lv-canh" role="alert">' + LV_BT.roi + '<span>' + s + '</span></p>'; }
  function lvCai(nhan, nut, doc, phu) { return '<div class="mc-lv-cai' + (doc ? ' doc' : '') + '"><b>' + nhan + (phu || '') + '</b><span class="mc-lv-seg" role="group" aria-label="' + nhan + '">' + nut + '</span></div>'; }
  function lvChon(lv, k, gt, chu, bat) { return '<button type="button" class="mc-lv-n" data-lv="' + lv + '" data-' + k + '="' + gt + '" aria-pressed="' + !!bat + '">' + chu + '</button>'; }
  // «Microphone (BOYALINK)» ⇒ «BOYALINK»: tên trong ngoặc là tên thiết bị thầy nhận ra
  function lvTenMic(s) { s = String(s || ''); var a = s.indexOf('('), b = s.lastIndexOf(')'); return a > 0 && b > a + 1 ? s.slice(a + 1, b) : s; }
  function lvVeThe() {
    var t = LV.tt && LV.tt.the, h, i, m, loi, mi = null, ly, ct = lvThe.querySelector('.mc-lv-ct'), cd = document.getElementById('mc-lv-cd');
    LV.ctMo = !!(t && ct && !lvThe.hidden && ct.open);
    cd = cd ? cd.textContent : '';
    lvThe.hidden = !t;
    if (!t) return;
    loi = t.loi === 'mic-tu-choi' ? 'trình duyệt chưa cho dùng mic' : t.loi === 'khong-mic' ? 'máy này không thấy mic nào' : t.loi === 'mic-ban' ? 'mic đang bị ứng dụng khác giữ (Zoom, OBS…) — tắt ứng dụng ấy hoặc cắm lại bộ thu' : t.loi ? 'mic chưa mở được' : '';
    h = '<h3>' + (LV.tt.pha === 'live' ? (LV.tt.nghi ? 'Đang tạm dừng live' : 'Đang live') : 'Bật live cho ' + (LV.tt.lop ? 'lớp ' + lvSach(LV.tt.lop) : 'cả lớp')) + '</h3>';
    if (!LV.tt.coTieng) h += lvCanh('Buổi này live chưa có tiếng trên máy em');
    // mất đường tiếng giữa buổi (mạng chặn / chưa nối máy chủ tiếng) — lỗi mic thì đã có dòng riêng bên dưới
    else if (LV.tt.pha === 'live' && LV.tt.khongTieng && LV.tt.lyDoKT && !loi) h += lvCanh(lvSach(LV.tt.lyDoKT) + ' — lớp chưa nghe tiếng thầy');
    if (LV.tt.coTieng) {
      if (loi) h += lvCanh('Chưa dùng được mic: ' + loi);
      else {
        h += '<label class="mc-lv-chon">' + LV_BT.mic + '<select aria-label="Chọn mic">';
        for (i = 0; i < t.ds.length; i++) { m = t.ds[i]; h += '<option value="' + lvSach(m.id) + '"' + (m.id === t.chon ? ' selected' : '') + '>Mic: ' + lvSach(m.ten) + '</option>'; }
        if (!t.ds.length) h += '<option>Mic mặc định của máy</option>';
        mi = LV.tt.mic || { tinh: 'chua', ten: '', loc: false, cheDo: 'tu', locOn: 'vua', locOnChay: 'tat' };
        // vạch mức âm + chữ ngắn (Chưa nghe thấy / Hơi nhỏ / Vừa đủ / Hơi to — lvVeMuc)
        h += '</select></label><div class="mc-lv-cai"><b>Mức âm</b><span class="mc-lv-am"><span class="mc-lv-thuoc"><i id="mc-lv-th"></i></span><span id="mc-lv-nx"></span></span></div>';
        if (LV_MIC[mi.tinh]) h += lvCanh(LV_MIC[mi.tinh]);
        // mic đã chọn không có trên máy ⇒ app dùng mic mặc định — NÓI RÕ (tên đầy đủ hai mic ở «Chi tiết»)
        if (mi.khac) h += lvCanh('Không mở được ' + lvSach(lvTenMic(mi.khac)) + ' — đang dùng mic máy');
        // Lọc ồn: 3 mức (+ «Chỉ giọng thầy» khi cờ bật ⇒ 4 nút, thanh phân đoạn xuống hàng riêng dưới nhãn)
        h += lvCai('Lọc ồn', lvChon('loc-on', 'c', 'manh', 'Mạnh', mi.locOn === 'manh') + lvChon('loc-on', 'c', 'vua', 'Vừa', mi.locOn !== 'manh' && mi.locOn !== 'tat' && mi.locOn !== 'thay') + lvChon('loc-on', 'c', 'tat', 'Tắt', mi.locOn === 'tat')
          + (mi.coThay ? lvChon('loc-on', 'c', 'thay', 'Chỉ giọng thầy', mi.locOn === 'thay') : ''), mi.coThay);
        if (mi.locOnChay === 'khong') h += lvCanh('Máy này chưa chạy được bộ lọc ồn');
        else if (mi.locOnChay === 'loi' && mi.locOn !== 'thay' && mi.locOn !== 'tat') h += lvCanh('Chưa tải được bộ lọc ồn — đang không lọc');
        // «Chỉ giọng thầy» tự tắt: lý do nằm trong ngoặc của dòng trạng thái thay-noi.ts gửi («Đã tự tắt (…) — lớp nghe tiếng như trước»)
        ly = mi.locOn === 'thay' && mi.tg && mi.tg.indexOf('Đã tự tắt') === 0 ? mi.tg.slice(mi.tg.indexOf('(') + 1, mi.tg.lastIndexOf(')')) : '';
        if (ly) h += lvCanh('Chỉ giọng thầy đã tự tắt: ' + lvSach(ly));
        h += lvCai('Tiếng', lvChon('kieu-tieng', 'c', 'lam-ro', 'Làm rõ', mi.kieuTieng !== 'chuan') + lvChon('kieu-tieng', 'c', 'chuan', 'Chuẩn trình duyệt', mi.kieuTieng === 'chuan'));
        h += lvCai('Khử vọng', lvChon('loc', 'c', 'tu', 'Tự động', mi.cheDo === 'tu') + lvChon('loc', 'c', 'bat', 'Bật', mi.cheDo === 'bat') + lvChon('loc', 'c', 'tat', 'Tắt', mi.cheDo === 'tat'));
      }
      // LOA: ô chọn + «Thử loa» cùng một hàng. Trình duyệt không chọn được đầu ra ⇒ t.loa rỗng ⇒ không hiện.
      if (t.loa && t.loa.ds && t.loa.ds.length) {
        if (t.loa.trung) h += lvCanh('Loa đang là bộ thu mic — chọn loa khác rồi bấm «Thử loa»');
        h += '<div class="mc-lv-loa"><label class="mc-lv-chon">' + LV_BT.loa + '<select aria-label="Chọn loa" data-c="loa">';
        for (i = 0; i < t.loa.ds.length; i++) { m = t.loa.ds[i]; h += '<option value="' + lvSach(m.id) + '"' + (m.id === t.loa.chon ? ' selected' : '') + '>Loa: ' + lvSach(m.ten) + '</option>'; }
        h += '</select></label><button type="button" class="mc-lv-n" data-lv="thu-loa"' + (t.loa.thu === 'dang' ? ' aria-busy="true"' : '') + '>Thử loa</button></div>';
        if (t.loa.thu === 'loi') h += lvCanh('Chưa phát được ra loa này — chọn loa khác');
      }
      // tiếng trên máy em: «Em ở xa» / «Tất cả» (mặc định); đang live ⇒ số em nghe tiếng thầy qua máy đứng cạnh nhãn
      h += lvCai('Máy em', lvChon('tieng-lop', 'v', '0', 'Em ở xa', !t.tiengLop) + lvChon('tieng-lop', 'v', '1', 'Tất cả', !!t.tiengLop), false, LV.tt.pha === 'live' ? '<small> ' + (LV.tt.nghe || 0) + ' em nghe</small>' : '');
    }
    // điểm quyết 4: mặc định TẮT, thầy bật từng buổi — chỉ em có tên trong lớp, đã đăng nhập; không điểm danh, không đội, không kJ
    if (LV.tt.dot2) h += lvCai('Cho em ở xa vào xem', lvChon('xa', 'v', t.xa ? '0' : '1', t.xa ? 'Đang bật' : 'Đang tắt', !!t.xa));
    // «Bảng → máy em»: ép cả lớp vào bảng live kể cả em chưa gửi (tự bật khi gọi em lên bảng, tự tắt khi sang lượt mới)
    if (LV.tt.pha === 'live') h += lvCai('Bảng → máy em', lvChon('bang', 'v', LV.tt.bang ? '0' : '1', LV.tt.bang ? 'Đang bật' : 'Đang tắt', !!LV.tt.bang));
    h += '<div class="mc-lv-hang">';
    if (LV.tt.pha === 'live') {
      // «Tạm dừng» ⇄ «Tiếp tục» · «Kết thúc live» · «Xong»
      h += '<button type="button" class="mc-lv-n" data-lv="tam-dung" data-v="' + (LV.tt.nghi ? '0' : '1') + '" aria-pressed="' + (!!LV.tt.nghi) + '" style="flex:1">' + (LV.tt.nghi ? 'Tiếp tục' : 'Tạm dừng') + '</button>'
        + '<button type="button" class="mc-lv-n do" data-lv="tat"><i></i>Kết thúc live</button><button type="button" class="mc-lv-n" data-lv="the-dong">Xong</button>';
    }
    else if (loi) h += '<button type="button" class="mc-lv-n do" data-lv="khong-tieng"><i></i>Live không tiếng</button><button type="button" class="mc-lv-n" data-lv="thu-lai">Thử lại</button><button type="button" class="mc-lv-n" data-lv="the-dong">Để sau</button>';
    else h += '<button type="button" class="mc-lv-n do" data-lv="' + (LV.tt.coTieng ? 'bat-dau' : 'khong-tieng') + '"><i></i>Bắt đầu live</button><button type="button" class="mc-lv-n" data-lv="the-dong">Để sau</button>';
    h += '</div>';
    // «Chi tiết» (đóng sẵn, chữ nhỏ): tên đầy đủ mic đã chọn / mic đang dùng · dòng mô hình «Chỉ giọng thầy» · đo tiếng từ xa (máy thầy + mỗi máy em, máy câm
    // đứng đầu) · dòng chẩn đoán mic app gửi ≈ 1 lần / giây (#mc-lv-cd) — thầy mở ra chụp gửi khi còn lỗi tiếng
    if (LV.tt.coTieng) {
      m = (mi && mi.khac ? ['Đã chọn «' + lvSach(mi.khac) + '» · lớp đang nghe ' + lvSach(mi.ten || 'mic mặc định của máy')] : []).concat(mi && mi.tg ? [lvSach(mi.tg)] : [], (LV.tt.doTieng || []).map(lvSach));
      h += '<details class="mc-lv-ct"' + (LV.ctMo ? ' open' : '') + '><summary>Chi tiết</summary>' + (m.length ? '<p class="mc-lv-cd" role="status">' + m.join('<br>') + '</p>' : '') + '<p class="mc-lv-cd" id="mc-lv-cd">' + lvSach(cd) + '</p></details>';
    }
    lvThe.innerHTML = h;
  }
  var LV_MIC = {
    'bi-tat': 'Mic đang bị tắt tiếng — bật lại trên mic / bộ thu hoặc trong Windows',
    im: 'Mic chưa có tín hiệu — bật bộ phát mic, hoặc chọn mic theo tên (không chọn «Mặc định»)',
    mat: 'Mic vừa bị rút — cắm lại hoặc chọn mic khác'
  };
  /** Xem lại Live: ngăn ghi của viên Live. ghi vắng = công tắc tắt ⇒ không vẽ. Máy ghi chưa báo trong 15 giây đầu ⇒ chưa vẽ gì (đang khởi động). */
  function lvNganGhi(t) {
    if (!t.ghi) return '';
    if (t.ghi === 'dang-ghi') return '<span class="ghi" role="status" title="Đang ghi để xem lại"><i class="cham"></i>Ghi</span>';
    if (t.ghi === 'loi' || Date.now() - (t.tu || Date.now()) > 15000) return '<span class="ghi-loi" role="status">Chưa ghi được · live vẫn chạy</span>';
    return '';
  }
  function lvVeMuc(v, em) {
    var ds = lvCum.querySelectorAll('.mc-lv-muc i'), n = Math.round(Math.min(1, v * 2.2) * ds.length), i, th = document.getElementById('mc-lv-th'), nx = document.getElementById('mc-lv-nx'), me = document.getElementById('mc-lv-me');
    for (i = 0; i < ds.length; i++) ds[i].className = i < n ? 'b' : '';
    // sóng âm của em đang nói (máy thầy chỉ đo được khi đang phát tiếng em ra loa; không đo được ⇒ sóng đứng mờ). Khay đóng ⇒ không vẽ.
    if (me && !(LV.khoi && LV.khoi.contains(me) && !(window.__mcKhay && window.__mcKhay.dangMo()))) { ds = me.children; n = Math.round(Math.min(1, em * 3) * ds.length); for (i = 0; i < ds.length; i++) ds[i].className = i < n ? 'b' : ''; }
    if (th) th.style.transform = 'scaleX(' + Math.min(1, v * 2.2).toFixed(2) + ')';
    if (nx) nx.textContent = v < 0.04 ? 'Chưa nghe thấy' : v < 0.12 ? 'Hơi nhỏ' : v < 0.6 ? 'Vừa đủ' : 'Hơi to';
  }
  function lvVe() {
    var t = LV.tt, live = !!t && t.pha === 'live', dang = !!t && t.pha === 'dang-bat', h, i, khoa;
    lvNut.hidden = !t || !t.co || live || dang;
    lvCum.hidden = !(live || dang);
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
          + '<span>' + LV_BT.mat + '<b>' + t.xem + '</b><small>/' + t.tong + '</small></span>'
          + (t.coTieng && !t.khongTieng && !t.nghi ? '<span class="' + (t.xem && !t.nghe ? 'im' : '') + '" title="Số em đang nghe tiếng thầy" aria-label="Số em đang nghe tiếng thầy qua máy">' + LV_BT.loa + '<b>' + (t.nghe || 0) + '</b></span>' : '')
          + (t.nghi ? '' : t.coTieng && !t.khongTieng && !t.lyDoKT ? '<span class="' + (t.micIm ? 'im' : '') + '" aria-label="Mức mic">' + LV_BT.mic + (t.micIm ? 'Mic đang im' : '<span class="mc-lv-muc">' + h + '</span>') + '</span>' : '<span>' + lvSach(t.lyDoKT || 'Không tiếng') + '</span>')
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
  // Giấy đề vừa cuộn xong (bút: but-cuon-giay-to-chieu.ts): đo lại giấy NGAY, không chờ nhịp 1 giây ⇒ chữ và nét trên máy em dời cùng lúc.
  document.addEventListener('mc-giay-cuon', function () { lvBaoGiay(); });
  window.addEventListener('message', function (e) {
    var m = e.data, truoc;
    if (!m || m.nguon !== 'bpu-bang' || e.source !== dichApp()) return;
    if (m.lenh === 'live-muc') { lvVeMuc(+m.v || 0, +m.em || 0); if (typeof m.cd === 'string' && document.getElementById('mc-lv-cd')) document.getElementById('mc-lv-cd').textContent = m.cd; return; }
    if (m.lenh === 'live-bao') { baoNhanh(String(m.chu || ''), 4200); return; }
    if (m.lenh === 'live-nop') { lvNop(m); return; }
    if (m.lenh === 'live-anh') { LV.vungCu = ''; LV.giayCu = ''; lvAnh(); lvBaoGiay(); return; } // app vừa chọn tờ này làm nguồn ⇒ gửi lại toàn bộ bảng + giấy
    if (m.lenh === 'live-lk') { LV.lkMoi = +m.moi || 0; LV.lkChat = m.chat === true; if (LV.lk) lvLk(document.body.classList.contains('mc-che-bang')); return; }
    if (m.lenh === 'live-bang-nhap') { if (window.__mcBut && window.__mcBut.trang() === 'bl') { LV.bangNhap = 1; if (m.goi && m.goi.net && m.goi.net.length) window.__mcBut.nhap(m.goi); } return; }
    if (m.lenh !== 'live-tt') return;
    truoc = LV.tt; LV.tt = m.tt || null;
    lvCheBang();
    if (LV.tt && LV.tt.co && !LV.anhXong) lvAnh();
    // vừa vào live ⇒ bút bật sẵn trên bảng đen
    if (LV.tt && LV.tt.pha === 'live' && !(truoc && truoc.pha === 'live') && window.__mcBut) window.__mcBut.bat(true);
    // vừa vào live ⇒ đo bố cục giấy đề ngay; sau đó đo lại theo nhịp đồng hồ của viên Live (mỗi giây, đổi mới gửi) — không thêm vòng hẹn giờ
    if (LV.tt && LV.tt.pha === 'live' && !(truoc && truoc.pha === 'live')) { LV.giayCu = ''; setTimeout(lvBaoGiay, 60); }
    lvVe();
  });
  // LIVE THEO KHỐI (12/11). Chỉ đổi khi phòng BÁO RÕ đây là buổi live theo khối (tt.khoi): phòng chớp mất nối ⇒ GIỮ nguyên (trước đây giấy đề nảy ra
  // giữa lúc thầy đang viết). Tờ BẢNG TRẮNG (body[data-bang-trang]) luôn là bảng kín màn. Vào «Bảng» ⇒ bút bật sẵn, bố cục + ô bảng đo lại.
  // NHÓM «BUỔI LIVE» TRONG KHAY NÚT BỐN Ô (thầy 12/11 «phần nút này bị rối, chuyển nó vào trong cái 4 nút»): Học | Bảng · Lớp · Chọn bài · Tin nhắn nằm
  // đầu khay của thanh đáy thay cho cụm nổi đè lên nút của tờ. Bấm ⇒ báo app (việc lk); app báo số tin mới bằng lệnh live-lk.
  function lvLk(cb) {
    var k = document.getElementById('mc-khay'), g = LV.lk, ds, i, b, x, moi = LV.lkMoi || 0;
    if (!k) return;
    if (!g) {
      g = LV.lk = document.createElement('div'); g.className = 'mc-khay-nhom mc-khay-lk'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Buổi live');
      g.innerHTML = '<span class="mc-khay-ten" aria-hidden="true">Buổi live · phím Tab đổi Học ⇄ Bảng</span>';
      ds = [['hoc', 'Học'], ['bang', 'Bảng'], ['lop', 'Lớp'], ['nghi', 'Nghỉ'], ['chon', 'Chọn bài'], ['chat', 'Tin nhắn']];
      for (i = 0; i < ds.length; i++) { b = document.createElement('button'); b.type = 'button'; b.className = 'mc-nut-phim'; b.setAttribute('data-lk', ds[i][0]); b.innerHTML = '<span class="mc-nut-chu">' + ds[i][1] + '</span>'; g.appendChild(b); }
      g.addEventListener('click', function (e) { var n = e.target.closest ? e.target.closest('[data-lk]') : null, v = n ? n.getAttribute('data-lk') : ''; if (v === 'hoc' || v === 'bang') lvDoiChe(v); else if (n) lvGui('lk', { v: v }); });
      k.insertBefore(g, k.firstChild);
      // khay vừa mở ⇒ báo app thu cột tin nhắn (cột nằm ngay trên thanh đáy bên phải, đè đúng chỗ khay; tờ nằm dưới lớp của app nên không tự nổi lên được)
      if (window.MutationObserver) new MutationObserver(function () { var mo = document.body.classList.contains('mc-khay-mo'); if (mo && !LV.lkMo) lvGui('lk', { v: 'khay' }); LV.lkMo = mo; }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    ds = g.querySelectorAll('[data-lk]');
    for (i = 0; i < ds.length; i++) {
      x = ds[i].getAttribute('data-lk');
      if (x === 'hoc' || x === 'bang') ds[i].setAttribute('aria-pressed', (x === 'bang') === cb ? 'true' : 'false');
      else if (x === 'chon') ds[i].hidden = cb;
      else if (x === 'chat') { ds[i].firstChild.textContent = moi > 0 ? 'Tin nhắn · ' + (moi > 99 ? '99+' : moi) + ' mới' : 'Tin nhắn'; ds[i].classList.toggle('mc-bat', moi > 0); }
    }
  }
  // Cột tin nhắn của app đang mở mà thầy bấm vào tờ (ngoài khay nút bốn ô) ⇒ báo app thu cột (app không thấy được cú bấm trong tờ).
  document.addEventListener('pointerdown', function (e) { var t = e.target; if (!LV.lkChat || (t && t.closest && t.closest('#mc-khay,#mc-them'))) return; LV.lkChat = false; lvGui('lk', { v: 'ngoai' }); }, true);
  function lvCheBang() {
    var b = document.body, trang = b.hasAttribute('data-bang-trang'), cb, doi;
    if (!trang && !(LV.tt && LV.tt.khoi)) return;
    b.classList.add('mc-lk');
    if (!trang) lvCoChu();
    setTimeout(lvNutLen, 0);
    cb = trang || !!(LV.tt && LV.tt.cheBang);
    // ĐỔI NGAY KHI THẦY BẤM (phím Tab / khay): tờ bài đổi tức thì trên máy thầy, phòng xác nhận sau — phòng báo cùng giá trị thì thôi giữ; quá 2,5 giây chưa thấy thì theo phòng
    if (!trang && LV.cheEp != null) { if (LV.cheEp === cb || Date.now() > LV.cheHan) LV.cheEp = null; else cb = LV.cheEp; }
    doi = b.classList.contains('mc-che-bang') !== cb;
    // ĐỔI BỐ CỤC TRƯỚC, ĐỔI TRANG BÚT SAU (thầy 12/11 «khi chuyển qua lại hai chế độ thì bị lỗi tọa độ bút»): sự kiện «trang» của bút mang ô giấy / ô bảng —
    // trước đây đo lúc CHƯA đổi bố cục ⇒ máy em vẽ nét theo ô cũ tới khi tờ báo lại (~0,7 giây). Nay ô đo đúng bố cục mới ngay từ sự kiện đầu.
    if (doi) { b.classList.toggle('mc-che-bang', cb); void b.offsetHeight; }
    // BẢNG CÓ TRANG RIÊNG (thầy 12/11 «chuyển đi chuyển lại phải lưu trước đó»): chế độ Bảng viết vào trang bl của bộ máy bút, tách khỏi nét của từng câu;
    // app giữ bản sao suốt buổi và trả lại khi tờ mới xin (đổi bài, bảng trắng ⇄ bài) — lệnh live-bang-nhap.
    if (window.__mcBut && window.__mcBut.rieng) window.__mcBut.rieng(cb ? 'bl' : '');
    lvLk(cb);
    // xin lại tới khi NHẬN được lúc đang ở trang bl (tờ bài vừa mở có thể còn «Bảng» một nhịp rồi sang «Học»: câu trả lời tới lúc đã rời trang bl ⇒ lần sau xin lại)
    if (cb && window.__mcBut && !LV.bangNhap && !LV.bangHen) LV.bangHen = setTimeout(function () { LV.bangHen = 0; lvGui('bang-xin'); }, 80);
    if (!doi) return;
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    if (window.__mcBut) { if (cb) window.__mcBut.bat(true); setTimeout(lvAnh, 150); }
  }
  // Thầy bấm đổi chế độ trên CHÍNH tờ này (phím Tab, nút Học / Bảng trong khay): đổi ngay rồi mới báo app. Tờ bảng trắng không tự đổi (app quyết về bài nào).
  function lvDoiChe(v) {
    if (!document.body.hasAttribute('data-bang-trang') && LV.tt && LV.tt.khoi) { LV.cheEp = v === 'bang'; LV.cheHan = Date.now() + 2500; lvCheBang(); }
    lvGui('lk', { v: v });
  }
  lvCheBang();
${JS_LIVE_KHOI_TO_CHIEU}  window.__mcLive = { tt: function () { return LV.tt; }, bam: lvBam };
  lvGui('chao');
`
