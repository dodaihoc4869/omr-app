// BÚT VIẾT BẢNG TRÊN TỜ CHIẾU (thầy 10/11: «chỉnh phần bút viết cho mượt mà … viết bằng bút wacom lên phần bảng đen, nét bút mảnh vừa phải siêu đẹp»).
// Đoạn JS + CSS chèn vào tờ (len-bang-moi-to-chieu.ts, cùng phạm vi: body · tao · S · chiSo · veThanh). Tách tệp riêng vì cổng cỡ tệp.
// Bộ máy dựng nét: `but-bang-loi.ts` (vectơ chuẩn hoá, đường cong qua đúng mẫu, đa giác bao). Tệp này lo phần MÀN:
//   · vào: Pointer Events. DỮ LIỆU nét chỉ lấy từ pointermove + getCoalescedEvents (đủ mẫu Wacom ≥ 200 Hz, đúng thứ tự với pointerdown / pointerup).
//     `pointerrawupdate` (Chrome đưa từng mẫu ngay) chỉ dùng để VẼ TRƯỚC đầu nét cho đỡ trễ, không ghi vào nét: đo thật (scripts/but-bang-1011/thu-tu-raw.mjs) thấy khi
//     luồng chính bận, Chromium gộp cả mẫu của NÉT SAU vào một pointerrawupdate phát TRƯỚC pointerup ⇒ lấy làm dữ liệu thì chữ dính nhau.
//     Bút dùng lực thật, chuột / chạm giả lực theo vận tốc; đang có bút (hoặc bút vừa ở gần mặt bảng) thì bỏ qua chạm tay; đuôi bút Wacom = tẩy.
//   · CẮT NÉT chắc tay (11/11, thầy viết Wacom thấy chữ dính nhau): hết chạm là hết nét dù máy không báo pointerup — mẫu `buttons` không còn nút chính,
//     bút có lực mà lực về 0, pointercancel, lostpointercapture, pointerleave, cửa sổ mất tiêu điểm. Bút chạm lại mà không có pointerdown ⇒ mở nét mới.
//   · ra (11/11, thầy: «chữ đang bị nháy chưa mượt như goodnote»): MỘT lớp canvas hiện mực (`cvT`); lớp ĐÃ CHỐT (`cvC`) và ô NHÁP (`cvS`) nằm ngoài màn.
//     Mỗi khung vẽ MỘT lần: dựng ô hình [đã chốt + đuôi nét đang viết] trên ô nháp rồi CHÉP một phát lên lớp hiện — không có lúc nào xoá-rồi-vẽ, không có
//     hai lớp hiện lệch nhịp nhau. Đuôi luôn vẽ đúng dáng nét xong (đã thon cuối) ⇒ NHẤC BÚT không vẽ lại gì: chép ô nháp vào lớp đã chốt, màn giữ nguyên
//     từng điểm ảnh (đo: scripts/but-bang-1011/do-nhay.mjs). Bỏ hẳn đoạn DỰ ĐOÁN: mực đoán sai phải rút lại ở khung sau = chữ nháy (đo: 55 % điểm ảnh «mực lùi»).
//     Lớp `canvas.mc-but-song` chỉ còn bắt con trỏ (1 × 1 điểm ảnh, không vẽ).
//     VẼ NGAY khi mẫu tới (pointerrawupdate, không chờ khung) ĐÃ CÓ nhưng MẶC ĐỊNH TẮT, chỉ bật bằng __mcBut.veNgay(true): đo ở CPU × 4 thấy
//     mỗi lượt vẽ ngoài khung làm trình duyệt đẩy canvas lên màn một lần ⇒ nghẽn luồng chính (docs/ban-ve-but-1011/so-do-trung-thuc.json).
//     Ô đo bút cho biết máy thầy có làm được không; bật mà rớt khung thì bộ máy tự tắt.
//   · LỚP BẢNG ĐẶC (12/11, thầy: «Nét bút bị chậm hơn, làm cho thật hơn tức thì hơn nữa»): lớp hiện mực phủ cả tờ (`cvT`) phải TRONG SUỐT nên không được xin
//     vẽ-thẳng-lên-màn (trên card đồ hoạ thật nó thành lớp phủ đen che giấy đề — sự cố 11/11). Riêng Ô BẢNG ĐEN — nơi thầy viết gần hết — nay có một canvas
//     riêng `cvB`: ĐẶC (`alpha: false`), nằm TRONG cột bảng làm nền của cột, tự tô màu nền bảng + viền + toàn bộ mực trong ô bảng, xin `desynchronized`.
//     Lớp đặc không cần trong suốt ⇒ trình duyệt có đưa nó lên lớp phủ phần cứng thì thứ hiện ra vẫn là bảng đen có mực; nó chỉ rộng bằng ô bảng nên KHÔNG
//     THỂ che giấy đề. `cvT` để trống trong ô bảng. Lớp đã chốt `cvC` vẫn giữ mọi nét (trong suốt) như cũ ⇒ tẩy / hoàn tác / cuộn / đổi cỡ không đổi cách làm.
//     Chỉ bật khi trình duyệt THẬT SỰ cấp `desynchronized` cho `cvB` (không cấp thì chẳng lợi gì ⇒ giữ đường cũ). Công tắc lùi khẩn: localStorage
//     `ddh.but.nhanh` = `tat` (tắt hẳn) · `ep` (ép bật để thử dù trình duyệt không cấp) · `__mcBut.nhanh(false)`. Mực trên bảng nay nằm DƯỚI thẻ tên /
//     chữ của cột bảng (trước: trên). «Vẽ ngay khi mẫu tới» vẫn mặc định tắt (xem `datBang`).
//   · BẢNG ĐEN CUỘN (11/11, thầy: «bảng đen khi live có cuộn vô hạn để viết được nhiều phần»): nét bắt đầu trong cột bảng đen là NÉT BẢNG (mã «b_…»),
//     y = y màn + độ cuộn ⇒ vẽ trong ô bảng, dời theo độ cuộn; nét trên giấy đề dời theo giấy (but-cuon-giay-to-chieu.ts). Cuộn: lăn chuột / hai ngón trên bảng, kéo vạch mép phải bảng,
//     viết sát đáy rồi ngừng 0,9 giây thì bảng tự trôi lên. Đang viết thì không cuộn. Độ cuộn nhớ theo đợt.
//   · Alt + B: ô ĐO BÚT (thiết bị, số mẫu mỗi giây, lực, mẫu gộp, thời gian xử lý) để thầy chụp gửi lại.
//   · nét giữ theo ĐỢT (khoá = chỉ số đợt): chuyển câu rồi quay lại vẫn còn, câu mới bảng sạch.
// API cho việc phát LIVE: window.__mcBut = { xuat, nhap, nghe, hoanTac, lamLai, xoaHet, bat, trang, loi, mau, co, vung, + doBut, veNgay } — sự kiện xem `SuKienBut`
// (them-diem gom MỘT lần mỗi khung hình; tro = con trỏ lơ lửng, mỗi khung một lần — y của tro trên cột bảng đã cộng độ cuộn; + cuon). Hàm nghe chạy ngay trong khung vẽ ⇒ phải nhẹ (xếp hàng rồi gửi sau).
// Màu phấn là DỮ LIỆU của nét (đi theo nét sang máy khác) nên ghi rgb() thẳng, lấy đúng trị của các biến sẵn có trên tờ:
//   trắng ngà = --mc-bang-chu · vàng = --mc-vang-noi · xanh ngọc = --mc-ll-dung (tối) · hồng = --mc-ll-sai (tối) · mực xanh = màu bút xanh cũ.
import { JS_LOI_BUT } from './but-bang-loi'
import { JS_CUON_GIAY } from './but-cuon-giay-to-chieu'

export const CSS_BUT_BANG = `
/* 7b · bút viết bảng 10/11: lớp sống nằm trên lớp tĩnh; thanh bút gọn */
canvas.mc-but-song{z-index:30}
/* 12/11 · lớp BẢNG ĐẶC (vẽ thẳng lên màn): nằm trong cột bảng, làm nền của nó — dưới thẻ tên / chữ của cột, dưới thanh bút */
canvas.mc-but-bang{position:absolute;z-index:-1;pointer-events:none;border-radius:inherit;image-rendering:pixelated}
.mc-cot-nhanh{isolation:isolate}
.mc-but-cu{gap:calc(var(--u)*.3);padding:calc(var(--u)*.3) calc(var(--u)*.55);border:1px solid color-mix(in srgb,var(--mc-b) 16%,transparent);user-select:none;-webkit-user-select:none;white-space:nowrap}
.mc-but-cu .mc-m{flex:none;width:calc(var(--u)*1.6);height:calc(var(--u)*1.6);margin:0 calc(var(--u)*.12);padding:0;transition:transform .12s}
.mc-but-cu .mc-m.mc-chon{border-color:transparent;transform:scale(.8);box-shadow:0 0 0 calc(var(--u)*.14) var(--mc-thanh2),0 0 0 calc(var(--u)*.3) var(--mc-b)}
.mc-but-cu .mc-bv{flex:none;width:1px;align-self:stretch;margin:calc(var(--u)*.25) calc(var(--u)*.2);background:color-mix(in srgb,var(--mc-b) 22%,transparent)}
.mc-but-cu .mc-n{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:.35em;min-width:calc(var(--u)*2);min-height:calc(var(--u)*2);padding:0 .65em}
.mc-but-cu .mc-n[disabled]{opacity:.32;cursor:default}
.mc-but-cu{transition:opacity .15s}
.mc-but-cu.mc-viet{opacity:.18;pointer-events:none}
.mc-but-cu .mc-n svg{width:1.2em;height:1.2em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.mc-but-cu .mc-bc{padding:0}
.mc-but-cu .mc-bc i{display:block;border-radius:50%;background:currentColor}
.mc-but-cu kbd{font:inherit;font-size:.8em;opacity:.7;padding:0 .35em;border-radius:.3em;border:1px solid color-mix(in srgb,currentColor 45%,transparent)}
/* ô đo bút (Alt + B): góc dưới trái, không bắt con trỏ ⇒ vẫn viết xuyên qua được */
.mc-but-do{position:fixed;left:calc(var(--u)*1);bottom:calc(var(--u)*5.2);z-index:31;min-width:calc(var(--u)*30);padding:calc(var(--u)*.7) calc(var(--u)*1);border-radius:calc(var(--u)*.7);background:var(--mc-thanh2);color:var(--mc-b);border:1px solid color-mix(in srgb,var(--mc-b) 18%,transparent);font:500 max(13px,calc(var(--u)*.92))/1.5 var(--mc-sans);pointer-events:none;font-variant-numeric:tabular-nums}
.mc-but-do[hidden]{display:none}
.mc-but-do b{display:block;font-weight:800;color:var(--mc-vang-noi);margin-bottom:.25em}
.mc-but-do div{display:flex;justify-content:space-between;gap:1.6em}
.mc-but-do div span:first-child{opacity:.72}
.mc-but-do div span:last-child{font-weight:700;text-align:right}
.mc-but-do small{display:block;margin-top:.35em;font-size:.86em;opacity:.6}
/* vạch cuộn của bảng đen (11/11): mảnh, mép phải cột bảng, chỉ hiện khi bút bật; kéo dải này = cuộn bảng */
.mc-but-ray{position:fixed;z-index:31;display:none;width:calc(var(--u)*.26);min-width:3px;border-radius:9em;background:color-mix(in srgb,var(--mc-b) 10%,transparent);pointer-events:none}
.mc-but-ray.mc-co{display:block}
.mc-but-ray i{position:absolute;left:0;right:0;min-height:8px;border-radius:9em;background:color-mix(in srgb,var(--mc-b) 42%,transparent)}
@media print{.mc-but-do,.mc-but-ray,canvas.mc-but-bang{display:none!important}}
`

export const JS_BUT_BANG = `
` + /* ── B · bút viết bảng (thầy 10/11) — bộ máy dựng nét: but-bang-loi.ts ── */ `
${JS_LOI_BUT}
  var MAU_BUT = [['rgb(244,239,228)', 'Phấn trắng'], ['rgb(255,210,122)', 'Phấn vàng'], ['rgb(110,231,183)', 'Phấn xanh ngọc'], ['rgb(253,164,175)', 'Phấn hồng'], ['rgb(36,86,201)', 'Mực xanh (viết lên giấy đề)']];
  var CO_BUT = [[1.2, 'Nét rất mảnh', '.22em'], [1.7, 'Nét mảnh', '.32em'], [2.3, 'Nét vừa', '.46em'], [3.4, 'Nét đậm', '.68em']];
  var PHIM_BUT = [['B', 'Bút viết bảng: phấn 4 màu, mực xanh, 4 cỡ nét'], ['E', 'Bút đang bật: đổi bút ↔ tẩy theo nét'], ['Ctrl + Z / Ctrl + Y · Alt + B', 'Bút đang bật: hoàn tác / làm lại · bật ô đo bút'], ['Lăn chuột trên bảng đen', 'Bút đang bật: cuộn bảng để viết tiếp (không giới hạn); kéo vạch ở mép phải bảng cũng cuộn']];
  var R_TAY = 15;
  S.mau = MAU_BUT[0][0]; S.co = CO_BUT[1][0];
  function nguCanh(c, song) { try { return c.getContext ? c.getContext('2d', song ? { desynchronized: true } : undefined) : null; } catch (e) { return null; } }
  function gio() { return window.performance && performance.now ? performance.now() : Date.now(); }
  var cvT = tao('canvas', 'mc-but', body), cv = tao('canvas', 'mc-but mc-but-song', body), butCu = tao('div', 'mc-but-cu', body), rayBut = tao('div', 'mc-but-ray', body), rayTay = tao('i', '', rayBut);
` + /* cvT = lớp HIỆN mực (duy nhất) · cvC = lớp ĐÃ CHỐT (ngoài màn) · cvS = ô NHÁP (ngoài màn) · cv = chỉ bắt con trỏ */ `
  var cvC = tao('canvas'), cvS = tao('canvas');
` + /* cvB = lớp BẢNG ĐẶC (hiện, nằm trong cột bảng) · cvN = nền bảng dựng sẵn (màu + viền) · cvO = ô nháp đặc · NH = lớp bảng đặc đang dùng cho đợt này */ `
` + /* nhDuoc: 0 = không dùng · 1 = dùng (trình duyệt cấp vẽ thẳng lên màn) · 2 = ép dùng để thử · capB = trình duyệt có cấp desynchronized cho cvB · cotB = cột đang chứa cvB · khoaB = nền | viền | bo góc đang dựng */ `
  var cvB = tao('canvas'), cvN = tao('canvas'), cvO = tao('canvas'), gB = null, gN = null, gO = null, NH = false, nhDuoc = 0, capB = false, cotB = null, khoaB = '';
  cvB.className = 'mc-but-bang'; cvB.setAttribute('aria-hidden', 'true');
` + /* tờ dựng lại ruột cột bảng (thẻ tên em, nhãn) làm rơi lớp bảng đặc khỏi trang ⇒ gắn lại ngay (hình trên canvas vẫn còn nguyên) */ `
  var moB = window.MutationObserver ? new MutationObserver(function () { if (NH && cotB && cvB.parentNode !== cotB) cotB.appendChild(cvB); }) : null;
  (function () {
    var k = '', tt = null;
    try { k = window.localStorage.getItem('ddh.but.nhanh') || ''; } catch (e) {}
    try { gB = cvB.getContext('2d', { alpha: false, desynchronized: true }); tt = gB && gB.getContextAttributes ? gB.getContextAttributes() : null; } catch (e) { gB = null; }
    capB = !!(tt && tt.desynchronized);
    if (gB && k !== 'tat' && window.CSS && CSS.supports && CSS.supports('isolation', 'isolate')) nhDuoc = k === 'ep' ? 2 : capB ? 1 : 0;
  })();
` + /* 11/11 (thầy: «màn live của thầy hiện bảng đen xì ko hiện đề», máy em bình thường): lớp HIỆN mực phủ cả tờ KHÔNG xin desynchronized nữa — trên card đồ hoạ thật (Windows, toàn màn hình) lớp vẽ-thẳng-lên-màn có thể bị đưa lên làm lớp phủ ĐẶC, mất trong suốt ⇒ nền đen che giấy đề. Chromium không đầu không lộ. */ `
  var gT = nguCanh(cvT, false), gC = nguCanh(cvC, false), gS = nguCanh(cvS, false), g2 = gC && gS ? gT : null, so = LoiBut.taoSo(), KH = null, dpr = 1;
` + /* N = nét đang viết · CHO = bút đã hết chạm mà máy chưa báo nhấc (chạm lại ⇒ mở nét mới) · XT = lượt kéo tẩy · KC = lượt kéo vạch cuộn */ `
` + /* ban = ô của đuôi vừa hiện (điểm ảnh thiết bị) · UO = ô hình vừa chép lên lớp hiện · luotBut = lần cuối thấy bút (chặn chạm tay) */ `
` + /* coRaw = trình duyệt đưa từng mẫu ngay · veNgay = vẽ trước đầu nét ngay khi mẫu tới · tVe = thời gian một lượt vẽ (ms, trung bình trượt) · DO = số đo của ô đo bút (null = ô tắt) */ `
  var N = null, CHO = null, XT = null, KC = null, ban = null, UO = null, hRaf = 0, luotBut = -1e9, luotTro = -1e9, oThanh = null, hThanh = 0, nong = 0;
` + /* B = ô bảng đen [x0, y0, x1, y1] (0..1 theo cửa sổ; null = tờ không có cột bảng) · BX / BY / BW / BH = ô đó tính bằng điểm ảnh thiết bị */ `
` + /* cuon = độ cuộn của bảng (số lần bề dọc cửa sổ) · CY = độ cuộn tính bằng điểm ảnh thiết bị (số nguyên ⇒ nét cuộn xong vẫn sắc y như cũ) · CUON = độ cuộn nhớ theo đợt */ `
` + /* hCuon / aCuon = hẹn tự cuộn / vòng trôi · daiBang = đáy nét bảng thấp nhất · tx0, ty0 = chỗ con trỏ lơ lửng gần nhất */ `
  var B = null, BX = 0, BY = 0, BW = 0, BH = 0, cuon = 0, CY = 0, CUON = {}, hCuon = 0, aCuon = 0, daiBang = 0, tx0 = 0, ty0 = 0, luotCuon = -1e9;
` + /* duocNgay = trình duyệt cho vẽ thẳng lên màn (desynchronized + pointerrawupdate; chỉ để báo trong ô đo, không tự bật) · kyKh = chu kì khung hình của màn (ms, khoảng ngắn nhất từng thấy) · khTb = khoảng cách khung trung bình trượt lúc đang viết */ `
` + /* khDem = số khung đã tính trong lượt canh này · khSach = số khung liền không rớt · khPhat = số lần bắt gặp rớt khung khi đang vẽ ngay · tuTat = đã tự tắt vẽ ngay vì máy rớt khung */ `
  var coRaw = 'onpointerrawupdate' in window, veNgay = false, ngheRaw = false, tVe = 0, DO = null, oDo = null, luotDo = 0, duocNgay = false, kyKh = 1e9, khTb = 0, khDem = 0, khSach = 0, khPhat = 0, tuTat = false;
  var khungSau = window.requestAnimationFrame ? function (f) { return window.requestAnimationFrame(f); } : function (f) { return setTimeout(f, 16); };
  butCu.setAttribute('role', 'toolbar'); butCu.setAttribute('aria-label', 'Bút viết bảng');
` + /* giấy đề cuộn (con lăn khi bút bật, nét trên giấy cuộn theo đề): but-cuon-giay-to-chieu.ts */ `${JS_CUON_GIAY}
  function coCanvas() {
    var W = window.innerWidth, H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 3); KH = LoiBut.khung(W, H); ban = UO = null; B = null;
    [cvT, cvC].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
` + /* cỡ HIỆN của lớp mực = đúng cỡ nền / mật độ (không để 100vw × 100vh): cửa sổ có cỡ điểm ảnh lẻ (Windows phóng 125 % / 150 %, phóng trình duyệt) thì */ `
` + /* 100vw lệch cỡ nền chưa tới một điểm ảnh — đủ để trình duyệt co giãn cả lớp, nét mờ đi từng quãng */ `
    cvT.style.width = cvT.width / dpr + 'px'; cvT.style.height = cvT.height / dpr + 'px';
    datMatDo();
    cv.width = cv.height = 1; CY = Math.round(cuon * H * dpr);
    khoaB = '#'; so.datTiLe(W / H); doOGiay(); datBang(); veLai();
    if (!nong) { nong = 1; lamNong(); }
  }
` + /* Ô bảng đen của đợt đang chiếu, đo SO VỚI ĐỢT (đợt đang trượt vào vẫn ra đúng số). Trả true nếu ô đổi. */ `
  function datBang() {
    var d = dot(), c = d && d.querySelector ? d.querySelector('.mc-cot-lam-bai') : null, r = c ? c.getBoundingClientRect() : null, g = r ? d.getBoundingClientRect() : null, W = window.innerWidth, H = window.innerHeight, m = null;
    if (r && r.width > 40 && r.left - g.left > W * 0.4 && r.left - g.left < W) m = [(r.left - g.left) / W, (r.top - g.top) / H, (r.right - g.left) / W, (r.bottom - g.top) / H];
    var khoa = m && nhDuoc && gC ? kieuBang(c) : '';
    if (String(m) === String(B) && khoa === khoaB && (!khoa || (cotB === c && cvB.parentNode === c))) return false;
    B = m; khoaB = khoa; NH = !!khoa;
    if (m) { BX = Math.round(m[0] * W * dpr); BY = Math.round(m[1] * H * dpr); BW = Math.round((m[2] - m[0]) * W * dpr); BH = Math.round((m[3] - m[1]) * H * dpr); }
    if (cotB && (!NH || cotB !== c)) { if (moB) moB.disconnect(); cotB.classList.remove('mc-cot-nhanh'); if (cvB.parentNode) cvB.parentNode.removeChild(cvB); cotB = null; }
    if (NH) {
      if (cotB !== c || cvB.parentNode !== c) { c.classList.add('mc-cot-nhanh'); c.appendChild(cvB); cotB = c; if (moB) { moB.disconnect(); moB.observe(c, { childList: true }); } }
      [cvB, cvN].forEach(function (x) { x.width = Math.max(1, BW); x.height = Math.max(1, BH); });
` + /* mép cột có thể rơi vào giữa điểm ảnh (mật độ 1,25 / 1,5, cửa sổ cỡ lẻ): dời lớp phần lẻ đó cho góc của nó trùng (BX, BY) của lớp hiện chung. */ `
` + /* Lớp nằm trong cột nên vẫn có thể bị GHÉP lệch một phần nhỏ của điểm ảnh (đo ở mật độ 1,5: nét nhoè 0,26 điểm ảnh) ⇒ CSS image-rendering: pixelated — */ `
` + /* lấy đúng điểm ảnh gần nhất; tỉ lệ 1 : 1 nên không nhoè, không thêm răng cưa (ảnh chụp trùng đường cũ từng điểm ảnh). */ `
      cvB.style.width = BW / dpr + 'px'; cvB.style.height = BH / dpr + 'px';
      cvB.style.left = (BX / dpr - (r.left - g.left)) + 'px'; cvB.style.top = (BY / dpr - (r.top - g.top)) + 'px';
      nenBang();
    }
` + /* KHÔNG tự bật «vẽ ngay khi mẫu tới» (đã thử 12/11): đoạn vẽ trước dựng từ mẫu thô, lúc mẫu thành dữ liệu thì được làm trơn ⇒ lệch nhau vài điểm ảnh — */ `
` + /* đo 380 khung viết: 61 điểm ảnh mực lùi ≥ 16 / 255 (trái yêu cầu không nháy). Vẫn bật tay được: __mcBut.veNgay(true). */ `
    duocNgay = coRaw && NH && capB;
    return true;
  }
` + /* KIỂU của cột bảng để lớp đặc vẽ lại y hệt: màu nền THẬT phía sau (cột trong suốt thì lấy của lớp cha gần nhất có nền đặc) | viền (bóng trong, loang 0) | bo góc. */ `
` + /* Trả '' = không dựng lại được (nền có ảnh / nền bán trong suốt / bóng kiểu khác / cột có viền thật) ⇒ đợt này dùng đường cũ. */ `
  function kieuBang(c) {
    var e = c, cs, mm, nen = '', v = '';
    for (; e && e.nodeType === 1 && !nen; e = e.parentNode) {
      cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return '';
      mm = /rgba?\\(([^)]+)\\)/.exec(cs.backgroundColor || '');
      if (mm) { mm = mm[1].split(','); if (mm.length < 4 || +mm[3] >= 1) nen = cs.backgroundColor; else if (+mm[3] > 0) return ''; }
    }
    cs = getComputedStyle(c);
    if (!nen || cs.position === 'static' || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0) return '';
    if (cs.boxShadow && cs.boxShadow !== 'none') { mm = /^(rgba?\\([^)]*\\))\\s+0px\\s+0px\\s+0px\\s+([\\d.]+)px\\s+inset$/.exec(cs.boxShadow); if (!mm) return ''; v = mm[1] + '/' + mm[2]; }
    return nen + '|' + v + '|' + (parseFloat(cs.borderTopLeftRadius) || 0);
  }
` + /* Dựng sẵn nền bảng (màu + viền bo góc) vào cvN theo khoaB. */ `
  function nenBang() {
    var k = khoaB.split('|'), v = k[1] ? k[1].split('/') : null, w, r, a, b;
    if (!gN) gN = nguCanh(cvN, false); if (!gO) gO = nguCanh(cvO, false);
    if (!gN || !gO) { NH = false; return; }
    gN.setTransform(1, 0, 0, 1, 0, 0); gN.globalCompositeOperation = 'source-over'; gN.fillStyle = k[0]; gN.fillRect(0, 0, BW, BH);
    if (v) {
      w = +v[1] * dpr; r = Math.max(0, +k[2] * dpr - w / 2); a = BW - w / 2; b = BH - w / 2;
      gN.strokeStyle = v[0]; gN.lineWidth = w; gN.beginPath();
      gN.moveTo(w / 2 + r, w / 2); gN.arcTo(a, w / 2, a, b, r); gN.arcTo(a, b, w / 2, b, r); gN.arcTo(w / 2, b, w / 2, w / 2, r); gN.arcTo(w / 2, w / 2, a, w / 2, r); gN.closePath(); gN.stroke();
    }
  }
` + /* HIỆN một ô của bảng (x, y, w, h: điểm ảnh thiết bị của cửa sổ, đã nằm trọn trong ô bảng) lên lớp bảng đặc: dựng [nền + hình trong suốt của nguon tại (nx, ny)] */ `
` + /* trên ô nháp đặc rồi chép MỘT phát ⇒ lớp vẽ-thẳng-lên-màn không bao giờ lộ trạng thái dở. */ `
  function hienBang(x, y, w, h, nguon, nx, ny) {
    if (cvO.width < w || cvO.height < h) { cvO.width = Math.max(cvO.width, w); cvO.height = Math.max(cvO.height, h); }
    gO.setTransform(1, 0, 0, 1, 0, 0); gO.globalCompositeOperation = 'source-over';
    gO.drawImage(cvN, x - BX, y - BY, w, h, 0, 0, w, h); gO.drawImage(nguon, nx, ny, w, h, 0, 0, w, h);
    chep(gB, cvO, x - BX, y - BY, w, h);
  }
` + /* Mật độ điểm ảnh đổi mà cửa sổ không đổi cỡ (kéo cửa sổ sang màn khác) ⇒ dựng lại canvas. */ `
  var mqMatDo = null;
  function datMatDo() {
    if (!window.matchMedia) return;
    if (mqMatDo && mqMatDo.removeEventListener) mqMatDo.removeEventListener('change', doiMatDo);
    mqMatDo = window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
    if (mqMatDo.addEventListener) mqMatDo.addEventListener('change', doiMatDo);
  }
  function doiMatDo() { if (KH) { ketNet(false); coCanvas(); conTro(); henThanh(); } }
  function trongBang(x, y) { return !!B && x >= B[0] * KH.W && x <= B[2] * KH.W && y >= B[1] * KH.H && y <= B[3] * KH.H; }
` + /* Bật / tắt chế độ vẽ trước đầu nét ngay khi mẫu tới. Chỉ khi bật mới nghe pointerrawupdate (nghe là trình duyệt phải phát thêm sự kiện cho từng mẫu). */ `
  function datVeNgay(b) {
    veNgay = !!b && coRaw;
    if (veNgay !== ngheRaw) { ngheRaw = veNgay; if (veNgay) cv.addEventListener('pointerrawupdate', vaoRaw); else cv.removeEventListener('pointerrawupdate', vaoRaw); }
    if (!veNgay && N && N.xem.length) { N.xem = []; N.can = true; }
  }
` + /* CANH NHỊP KHUNG khi đang VẼ NGAY (dt = khoảng cách tới khung trước, ms): rớt khung (khoảng cách khung trung bình vượt 1,3 chu kì màn) hai lần ⇒ tự tắt hẳn, */ `
` + /* về vẽ mỗi khung một lần. 600 khung sạch thì xoá một lần phạt. */ `
  function canhKhung(dt) {
    kyKh = Math.min(kyKh * 1.001, dt); khTb += (dt - khTb) * (khDem ? 0.15 : 1); khDem++;
    if (khTb > kyKh * 1.3) { khSach = 0; if (veNgay && (khDem > 12 || (khDem > 4 && khTb > kyKh * 2.5))) { khDem = 0; if (++khPhat >= 2) { tuTat = true; datVeNgay(false); } } return; }
    if (++khSach > 600) { khSach = 0; if (khPhat) khPhat--; }
  }
` + /* Làm nóng MỘT lần lúc bật bút (không phải giữa nét đầu tiên): cho máy dịch sẵn bộ dựng nét và cấp sẵn vùng nhớ hai lớp canvas. */ `
  function lamNong() {
    var n = { co: 2.3, diem: [] }, i, p;
    for (i = 0; i < 90; i++) n.diem.push([0.3 + i * 0.002, 0.5 + Math.sin(i / 7) * 0.03, 0.2 + (i % 9) / 20, i * 5]);
    for (i = 0; i < 40; i++) p = LoiBut.dungNet(n, KH);
    if (g2) { toDaGiac(gC, p, 'transparent'); cvS.width = cvS.height = 640; toDaGiac(gS, p, 'transparent'); }
  }
` + /* Tô một đa giác lên canvas c có gốc (ox, oy) điểm ảnh thiết bị. bang = true: nét bảng — dời theo độ cuộn, cắt trong ô bảng đen; */ `
` + /* bang = ô [x, y, rộng, cao, độ cuộn] của giấy đề đang cuộn: nét giấy — dời theo độ cuộn của giấy, cắt theo mép trên / dưới ô giấy. */ `
  function toDaGiac(c, p, mau, bang, ox, oy) {
    var s = dpr * KH.k, bu;
    ox = ox || 0; oy = oy || 0;
    if (bang) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); if (bang === true) c.rect(BX - ox, BY - oy, BW, BH); else c.rect(-ox, bang[1] - oy, cvT.width, bang[3]); c.clip(); }
    c.setTransform(s, 0, 0, s, -ox, -oy - (bang ? bang === true ? CY : bang[4] : 0)); c.globalCompositeOperation = 'source-over'; c.fillStyle = mau;
    c.beginPath(); LoiBut.veDaGiac(c, p); c.fill();
` + /* bù sáng cho nét phấn (xem LoiBut.buSang): tô thêm một lượt mờ ⇒ mép nét đều sáng, nét mảnh không lổn nhổn */ `
    if (bu = LoiBut.buSang(mau)) { c.globalAlpha = bu; c.fill(); c.globalAlpha = 1; }
    if (bang) c.restore();
  }
` + /* Chép NGUYÊN điểm ảnh ô (w × h) từ canvas nguon (gốc 0, 0) sang c tại (x, y): thay hẳn điểm ảnh cũ, không pha trộn. */ `
  function chep(c, nguon, x, y, w, h) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.globalCompositeOperation = 'copy'; c.drawImage(nguon, 0, 0, w, h, x, y, w, h); c.restore();
  }
` + /* Lớp ĐÃ CHỐT: vẽ lại MỌI nét của trang từ vectơ (đường bao nhớ theo tỉ lệ vùng viết ⇒ đổi cỡ cùng tỉ lệ / tẩy / hoàn tác / cuộn không dựng lại), rồi chép cả lớp lên màn. */ `
` + /* Lượt 0 = nét thường + nét trên giấy chưa cuộn · lượt 1 = nét bảng (cắt trong ô bảng, dời theo độ cuộn; nét ngoài tầm nhìn bỏ qua). */ `
  function veLai() {
    if (!g2 || !KH) return;
    var s = dpr * KH.k, khoaD = KH.rw + 'x' + KH.rh, coD = typeof Path2D === 'function', ds = so.ds(), luot, i, n, h, p;
    function to(n) {
      if (n._k !== khoaD) { p = LoiBut.dungNet(n, KH); n._k = khoaD; if (coD) { n._d = new Path2D(); LoiBut.veDaGiac(n._d, p); } else n._d = p; }
      gC.globalCompositeOperation = n.cong === 'tay' ? 'destination-out' : 'source-over'; gC.fillStyle = n.mau;
      if (coD) gC.fill(n._d); else { gC.beginPath(); LoiBut.veDaGiac(gC, n._d); gC.fill(); }
      if (n.cong !== 'tay' && (p = LoiBut.buSang(n.mau))) { gC.globalAlpha = p; if (coD) gC.fill(n._d); else gC.fill(); gC.globalAlpha = 1; }
    }
    gC.setTransform(1, 0, 0, 1, 0, 0); gC.clearRect(0, 0, cvC.width, cvC.height); daiBang = 0;
    for (luot = 0; luot < 2; luot++) {
      if (luot) { if (!B) break; gC.save(); gC.setTransform(1, 0, 0, 1, 0, 0); gC.beginPath(); gC.rect(BX, BY, BW, BH); gC.clip(); }
      gC.setTransform(s, 0, 0, s, 0, luot ? -CY : 0);
      for (i = 0; i < ds.length; i++) {
        n = ds[i];
        if ((B && LoiBut.laBang(n) ? 1 : 0) !== luot) continue;
        if (luot) { h = LoiBut.hop(n); if (h[3] > daiBang) daiBang = h[3]; if (h[3] < cuon + B[1] - 0.02 || h[1] > cuon + B[3] + 0.02) continue; }
        else if (cuonCuaNet(n)) continue;
        to(n);
      }
      if (luot) gC.restore();
    }
` + /* lượt 2 = nét của giấy đề ĐANG CUỘN (dời theo độ cuộn của giấy, cắt theo ô giấy); giấy chưa cuộn thì nét giấy đã vẽ ở lượt 0 như cũ */ `
    veNetGiay(ds, to, s);
    gC.globalCompositeOperation = 'source-over';
    gT.setTransform(1, 0, 0, 1, 0, 0); gT.globalCompositeOperation = 'copy'; gT.drawImage(cvC, 0, 0); gT.globalCompositeOperation = 'source-over';
` + /* lớp bảng đặc đang dùng: mọi thứ trong ô bảng hiện ở đó, lớp hiện chung để trống trong ô bảng */ `
    if (NH) { gT.clearRect(BX, BY, BW, BH); hienBang(BX, BY, BW, BH, cvC, BX, BY); }
    ban = UO = null; veRay();
  }
` + /* HIỆN ĐUÔI nét đang viết (p = đa giác bao, rỗng = gỡ đuôi): ô cần đổi = ô đuôi khung trước ∪ ô đuôi mới. Dựng ô đó trên NHÁP = [lớp đã chốt + đuôi], */ `
` + /* rồi chép MỘT lần lên lớp hiện ⇒ màn không bao giờ thấy trạng thái dở (đã xoá mà chưa vẽ). Mọi nét đều được tô trên canvas ngoài màn cùng loại ⇒ cùng một cách khử răng cưa. */ `
  function hienDuoi(p, mau, bang) {
    var s = dpr * KH.k, cy = bang ? bang === true ? CY : bang[4] : 0, i, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, r = null, a = ban, w, h, ix, iy, iw, ih;
    for (i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; }
    if (p.length) r = [Math.floor(x0 * s) - 3, Math.floor(y0 * s) - 3 - cy, Math.ceil((x1 - x0) * s) + 6, Math.ceil((y1 - y0) * s) + 6];
    ban = r; UO = null;
    if (!a) a = r; if (!a) return;
    if (!r) r = a;
    x0 = Math.max(0, Math.min(a[0], r[0])); y0 = Math.max(0, Math.min(a[1], r[1]));
    w = Math.min(cvT.width, Math.max(a[0] + a[2], r[0] + r[2])) - x0; h = Math.min(cvT.height, Math.max(a[1] + a[3], r[1] + r[3])) - y0;
    if (w <= 0 || h <= 0) return;
    if (cvS.width < w || cvS.height < h) { cvS.width = Math.max(cvS.width, w); cvS.height = Math.max(cvS.height, h); }
    gS.setTransform(1, 0, 0, 1, 0, 0); gS.globalCompositeOperation = 'source-over'; gS.clearRect(0, 0, w, h); gS.drawImage(cvC, x0, y0, w, h, 0, 0, w, h);
    if (ban) toDaGiac(gS, p, mau, bang, x0, y0);
    if (NH) {
` + /* phần của ô hình nằm trong ô bảng ⇒ lớp bảng đặc; phần ngoài (nét giấy) ⇒ lớp hiện chung, vẫn để trống trong ô bảng */ `
      ix = Math.max(x0, BX); iy = Math.max(y0, BY); iw = Math.min(x0 + w, BX + BW) - ix; ih = Math.min(y0 + h, BY + BH) - iy;
      if (iw > 0 && ih > 0) hienBang(ix, iy, iw, ih, cvS, ix - x0, iy - y0);
      if (!(iw >= w && ih >= h)) { chep(gT, cvS, x0, y0, w, h); if (iw > 0 && ih > 0) { gT.setTransform(1, 0, 0, 1, 0, 0); gT.clearRect(ix, iy, iw, ih); } }
    } else chep(gT, cvS, x0, y0, w, h);
    UO = [x0, y0, w, h];
  }
  function xaDiem(n) { if (n.moi.length) { so.themDiem(n.moi); n.moi = []; } }
  function hen() { if (!hRaf) hRaf = khungSau(khungVe); }
` + /* Vẽ nét đang viết: phần đã chốt và đã xa đầu bút thì in MỘT lần xuống lớp đã chốt; mỗi khung chỉ dựng lại đoạn cuối (+ đầu bút thật) — luôn đúng dáng nét xong (thon cuối). */ `
  function veSong(n) {
    var den, them = null, t0 = veNgay ? gio() : 0, st = n.st, d;
    n.can = false;
    LoiBut.xuLyThem(st, n.tat, n.tat.length);
    den = LoiBut.mocDong(st, n.dong, 160);
    if (den > 0) { toDaGiac(gC, LoiBut.vien(st, n.dong, den, null, false), n.net.mau, n.vg); n.dong = den - 2; }
` + /* đầu bút thật (chưa đủ xa để thành mẫu): làm tròn như một mẫu thật ⇒ lúc nhấc bút mẫu chốt rơi đúng chỗ này, hình không đổi */ `
    if (n.mx !== n.tx || n.my !== n.ty) { d = LoiBut.diem(n.mx, n.my + n.cy, 0, 0, KH.W, KH.H); them = [[d[0] * KH.rw, d[1] * KH.rh]]; }
    if (n.xem.length) them = (them || []).concat(n.xem);
    hienDuoi(LoiBut.vien(st, n.dong, -1, them, true), n.net.mau, n.vg);
` + /* thời gian một lượt vẽ chỉ cần khi đang vẽ ngay (để tự giãn): đọc đồng hồ ở mỗi lượt vẽ cũng tốn */ `
    if (veNgay) { tVe += ((gio() - t0) - tVe) * 0.2; n.tgVe = n.xem.length ? n.xem[n.xem.length - 1][2] : n.tg; }
  }
` + /* MỘT vòng mỗi khung: gom điểm mới phát đi một lần, vẽ nếu còn việc. */ `
  function khungVe(ts) {
    hRaf = 0;
    var n = N, t0, dt;
    if (!g2 || !n) return;
    if (DO) { t0 = gio(); if (DO.tKh && ts - DO.tKh < 100) { DO.kh += ts - DO.tKh; DO.nKh++; } DO.tKh = ts; }
    dt = ts - n.tsKh; n.tsKh = ts;
    if (veNgay && dt > 3 && dt < 1000) canhKhung(Math.min(dt, 100));
    xaDiem(n);
    if (n.can) veSong(n);
    if (DO) { t0 = gio() - t0 + DO.tCho; DO.tCho = 0; DO.tKhung += t0; DO.nKhung++; if (t0 > DO.tKhungLon) DO.tKhungLon = t0; if (ts - luotDo > 300) { luotDo = ts; veDo(); } }
  }
` + /* Mẫu này bút còn CHẠM mặt bảng không: 1 = còn · 0 = đã nhấc · 2 = ngờ (bút có lực mà lực về 0 trong khi nút còn — hai mẫu liền như vậy mới coi là nhấc). */ `
` + /* Chuột: hết nút trái là nhấc. Bút: không còn nút nào (lướt trên không) là nhấc; đang viết mà lỡ bấm nút thân bút (máy báo nút phải thay nút chính) thì VẪN là đang viết. */ `
  function conCham(e, n) {
    if (n.loai === 'touch' || e.buttons == null) return 1;
    if (n.loai === 'mouse') return e.buttons & 1 ? 1 : 0;
    if (!e.buttons) return 0;
    return n.coLuc && e.pressure === 0 ? 2 : 1;
  }
` + /* Một mẫu vào. chot = mẫu nhấc bút: giữ đúng chỗ dừng, không lấy lực của mẫu này. Nét bảng: y ghi = y màn + độ cuộn (n.cy, px). */ `
  function mau(e, chot) {
    var n = N, x = e.clientX, y = e.clientY, gioMau = e.timeStamp, t = Math.max(n.tt, gioMau - n.t0), q = Math.sqrt((x - n.tx) * (x - n.tx) + (y - n.ty) * (y - n.ty)) / KH.k, ap = n.ap, dt, d, pr;
    var luc = n.loai === 'pen' && (pr = e.pressure, n.coLuc || (pr > 0 && pr !== 0.5));
    n.mx = x; n.my = y; n.tg = gioMau;
    if (y > n.yLon) n.yLon = y;
` + /* nét đi vào dưới thanh bút ⇒ thanh mờ đi cho tới khi nhấc bút */ `
    if (!n.che && oThanh && x > oThanh.left - 12 && x < oThanh.right + 12 && y > oThanh.top - 12 && y < oThanh.bottom + 12) { n.che = true; butCu.classList.add('mc-viet'); }
    if (q < (chot ? 0.05 : 0.35)) {
` + /* ấn bút tại chỗ, lực mạnh dần (dấu chấm): ghi thêm lực ở đúng chỗ cũ ⇒ chấm ra đủ đậm */ `
      if (!chot && luc && pr > ap + 0.1) { n.coLuc = true; n.ap = pr; d = LoiBut.diem(n.tx, n.ty + n.cy, pr, t, KH.W, KH.H); n.moi.push(d); n.tat.push(d); n.can = true; }
      return;
    }
    dt = Math.max(1, t - n.tt);
    if (!chot) {
      if (luc) { n.coLuc = true; ap = pr; }
      else ap = LoiBut.apLucGia(ap, q, Math.max(4, dt));
    }
    n.ap = ap; n.tx = x; n.ty = y; n.tt = t;
    d = LoiBut.diem(x, y + n.cy, ap, t, KH.W, KH.H); n.moi.push(d); n.tat.push(d); n.can = true;
  }
` + /* Mở nét tại mẫu e. luc = thiết bị này đã từng báo lực thật (nét mở lại sau khi bút lướt). Bắt đầu trong ô bảng đen ⇒ nét bảng. */ `
  function batNet(e, id, loai, luc) {
    var but = loai === 'pen', coLuc = but && e.pressure > 0 && e.pressure !== 0.5, ap = coLuc ? e.pressure : but ? 0.12 : 0.3, bang, gv, og, cy, d;
` + /* tờ vừa dựng lại ruột cột bảng (lớp bảng đặc bị gỡ khỏi trang) ⇒ gắn lại trước khi viết */ `
    if (NH && cvB.parentNode !== cotB) { khoaB = '#'; datBang(); veLai(); }
` + /* nét bắt đầu trong ô giấy đề ⇒ nét GIẤY: y = y màn + độ cuộn của giấy (og[4]); vg = cách vẽ đuôi nét (true: bảng · ô giấy đang cuộn · false: thường) */ `
    bang = trongBang(e.clientX, e.clientY); gv = bang ? null : giayViet(e.clientX, e.clientY); og = gv ? gv.__go : null;
    cy = (bang ? CY : og ? og[4] : 0) / dpr; d = LoiBut.diem(e.clientX, e.clientY + cy, ap, 0, KH.W, KH.H);
    dungCuon(); ban = UO = null; dyPhat = og ? og[4] / dpr / KH.H : 0;
    N = { id: id, loai: loai, coLuc: coLuc || !!luc, nghi: 0, t0: e.timeStamp, tg: e.timeStamp, tgVe: e.timeStamp, tt: 0, tx: e.clientX, ty: e.clientY, mx: e.clientX, my: e.clientY, ap: ap, moi: [], tat: [d], xem: [], tsKh: 0, dong: 0, can: true, net: null, st: null, bang: bang, vg: bang || (og && og[4] ? og : false), cy: cy, yLon: e.clientY };
    N.net = so.batDau({ cong: 'but', mau: S.mau, co: S.co, diem: d, bang: bang });
    if (gv) { N.net._g = dsGiay.indexOf(gv) + 1; N.net._c = og[4]; }
    N.st = LoiBut.moXuLy(N.net, KH);
    if (DO) { DO.net++; DO.tb = loai; DO.coLuc = N.coLuc; DO.tc = e.timeStamp; DO.g0 = DO.g1 = gio(); DO.nNet = 1; }
    hen();
  }
  function ketNet(huy) {
    var n = N, y; if (!n) return;
    N = null; xaDiem(n);
    if (n.che) butCu.classList.remove('mc-viet');
    if (huy) { so.ketThuc(true); veLai(); return; }
    if (g2) {
      if (n.xem.length) { n.xem = []; n.can = true; }
      if (n.can) veSong(n);
` + /* NHẤC BÚT không vẽ lại gì trên màn: chép đúng ô hình vừa hiện (ô nháp) vào lớp đã chốt ⇒ nét «khô» = nét «ướt», từng điểm ảnh. */ `
      if (UO) chep(gC, cvS, UO[0], UO[1], UO[2], UO[3]);
      ban = UO = null;
    }
    so.ketThuc(); capNut();
    tx0 = n.tx; ty0 = n.ty;
` + /* viết sát đáy bảng rồi ngừng 0,9 giây ⇒ bảng tự trôi lên, dòng vừa viết về khoảng 2/5 bảng (chạm bút lại thì thôi) */ `
    if (n.bang && B) {
      if (n.net.diem[n.net.diem.length - 1][1] > daiBang) { daiBang = n.net.diem[n.net.diem.length - 1][1]; veRay(); }
      if (n.yLon > (B[1] + (B[3] - B[1]) * 0.86) * KH.H) { y = n.yLon; hCuon = setTimeout(function () { hCuon = 0; if (!N && B) cuonToi(cuon + y / KH.H - B[1] - (B[3] - B[1]) * 0.42); }, 900); }
    }
    if (DO) { if (DO.nNet > 2) { DO.dong += DO.g1 - DO.g0; DO.nDong += DO.nNet - 1; } veDo(); }
  }

` + /* ── bảng đen cuộn ── */ `
` + /* Đặt độ cuộn (số lần bề dọc cửa sổ, 0 … 150). Đang viết thì không cuộn. Cuộn xong báo lại chỗ con trỏ theo toạ độ bảng ⇒ máy em trôi theo. */ `
  function datCuon(v) {
    v = B ? Math.max(0, Math.min(150, v)) : 0;
    if (N || !KH || v === cuon) return;
    cuon = v; CY = Math.round(v * KH.H * dpr); CUON[so.trang()] = v;
    veLai();
    if (luotTro > 0) baoTro();
    so.cuon(cuon); luotCuon = luotTro;
  }
  function dungCuon() { clearTimeout(hCuon); hCuon = 0; if (aCuon) { (window.cancelAnimationFrame || clearTimeout)(aCuon); aCuon = 0; } }
` + /* Trôi êm tới độ cuộn dich trong 0,28 giây (chậm dần); máy bật «giảm chuyển động» thì tới luôn. */ `
  function cuonToi(dich) {
    var tu = cuon, t0 = 0;
    dungCuon();
    if (giamCD()) { datCuon(dich); return; }
    function buoc(ts) { var k; ts = ts || gio(); if (!t0) t0 = ts; k = Math.min(1, (ts - t0) / 280); aCuon = 0; datCuon(tu + (dich - tu) * (1 - Math.pow(1 - k, 3))); if (k < 1 && !N) aCuon = khungSau(buoc); }
    aCuon = khungSau(buoc);
  }
  function baoTro() { so.tro(tx0 / KH.W, (ty0 + (B && tx0 >= B[0] * KH.W && tx0 <= B[2] * KH.W ? CY / dpr : 0)) / KH.H); }
` + /* Vạch cuộn: dài bằng phần bảng đang thấy so với cả phần đã viết. */ `
  function veRay() {
    var co = !!B && S.but, dai;
    rayBut.className = 'mc-but-ray' + (co ? ' mc-co' : '');
    if (!co) return;
    dai = Math.max(cuon + B[3], daiBang + 0.25) - B[1];
    rayBut.style.left = Math.round(B[2] * KH.W - u() * 0.7) + 'px'; rayBut.style.top = Math.round(B[1] * KH.H + u()) + 'px'; rayBut.style.height = Math.round((B[3] - B[1]) * KH.H - u() * 2) + 'px';
    rayTay.style.top = (cuon / dai * 100) + '%'; rayTay.style.height = ((B[3] - B[1]) / dai * 100) + '%';
  }
  cv.addEventListener('wheel', function (e) {
    if (!S.but || !KH) return;
    if (!trongBang(e.clientX, e.clientY)) { lanGiay(e); return; }
    e.preventDefault(); dungCuon();
    tx0 = e.clientX; ty0 = e.clientY; luotTro = e.timeStamp;
    datCuon(cuon + e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? KH.H * 0.8 : 1) / KH.H);
  }, { passive: false });
` + /* Tẩy theo NÉT: kéo qua nét nào thì cả nét đó mất; cả lượt kéo là MỘT bước hoàn tác. */ `
  function tayQua(x0, y0, x1, y1) {
    var bang = trongBang(x0, y0), gv = bang ? null : oGiayTai(x0, y0), og = gv && gv.__go[4] ? gv.__go : null, cy = (bang ? CY : og ? og[4] : 0) / dpr;
` + /* tẩy trong ô giấy đang cuộn ⇒ chỉ chạm nét của giấy ấy (y đã cộng độ cuộn); ngoài ra ⇒ nét thường / nét giấy chưa cuộn */ `
    var ds = so.ds().filter(function (n) { return !!(B && LoiBut.laBang(n)) === bang && (bang || cuonCuaNet(n) === og); });
    var buoc = Math.max(1, Math.ceil(Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) / (R_TAY * KH.k * 0.5))), i, ids = [];
    for (i = 0; i <= buoc; i++) LoiBut.timCham(ds, (x0 + (x1 - x0) * i / buoc) / KH.W, (y0 + (y1 - y0) * i / buoc + cy) / KH.H, R_TAY, KH).forEach(function (d) { if (ids.indexOf(d) < 0) ids.push(d); });
    if (ids.length && so.xoa(ids, true)) { veLai(); capNut(); }
  }
  cv.addEventListener('pointerdown', function (e) {
    if (!S.but || !KH) return;
    var but = e.pointerType === 'pen';
    if (but) luotBut = e.timeStamp;
    if (e.pointerType === 'touch' && ((N && N.loai === 'pen') || XT || e.timeStamp - luotBut < 800)) { e.preventDefault(); return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
` + /* bút chưa chạm mà bấm nút thân bút (chuột phải lúc lơ lửng, không có lực): không phải nét */ `
    if (but && e.buttons != null && !(e.buttons & 33) && !(e.pressure > 0)) return;
    if (N && but && N.loai === 'touch') ketNet(true);
` + /* cùng con trỏ đó chạm lại mà nét trước chưa được báo nhấc ⇒ đóng nét trước */ `
    if (N && N.id === e.pointerId) ketNet(false);
    if (CHO && CHO.id === e.pointerId) CHO = null;
    if (N || XT || KC) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
` + /* dải 26 px sát mép phải ô bảng = vạch cuộn: kéo xuống thì bảng trôi lên (đi tiếp xuống dưới), nhanh gấp rưỡi tay kéo */ `
    if (trongBang(e.clientX, e.clientY) && e.clientX > B[2] * KH.W - 26 * KH.k) { dungCuon(); KC = { id: e.pointerId, y: e.clientY, c: cuon }; return; }
    if (S.tay || (but && (e.buttons & 32))) { XT = { id: e.pointerId, x: e.clientX, y: e.clientY }; tayQua(XT.x, XT.y, XT.x, XT.y); return; }
    batNet(e, e.pointerId, e.pointerType, false);
  });
` + /* Mẫu di chuyển (pointermove + các mẫu gộp của nó): nguồn DUY NHẤT của dữ liệu nét. */ `
  function vao(e) {
    var ds, i, d, t0, c, k;
    if (e.pointerType === 'pen') luotBut = e.timeStamp;
    if (XT && e.pointerId === XT.id) { tayQua(XT.x, XT.y, e.clientX, e.clientY); XT.x = e.clientX; XT.y = e.clientY; return; }
    if (KC && e.pointerId === KC.id) { tx0 = e.clientX; ty0 = e.clientY; luotTro = e.timeStamp; datCuon(KC.c + (e.clientY - KC.y) * 1.5 / KH.H); return; }
    c = N || CHO;
    if (c && e.pointerId === c.id) {
      if (DO) t0 = gio();
      ds = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (!ds || !ds.length) ds = [e];
      for (i = 0; i < ds.length; i++) {
        d = ds[i];
        if (N) {
          k = conCham(d, N);
          if (k === 1) { N.nghi = 0; mau(d); if (DO) doMau(d); }
          else if (k === 2 && !N.nghi) N.nghi = 1;
          else { CHO = { id: N.id, loai: N.loai, coLuc: N.coLuc }; ketNet(false); if (DO) DO.im++; }
        } else if (CHO && S.but && !S.tay && KH && conCham(d, CHO) === 1) { c = CHO; CHO = null; batNet(d, c.id, c.loai, c.coLuc); }
      }
      if (N) {
` + /* điểm xem trước nào đã có mẫu thật thay thì bỏ */ `
        while (N.xem.length && N.xem[0][2] <= N.tg) N.xem.shift();
        hen();
      }
      if (DO) { t0 = gio() - t0; DO.tCho += t0; DO.tMau += t0; DO.nMau += ds.length; DO.sk++; DO.gop += ds.length; if (ds.length > DO.gopLon) DO.gopLon = ds.length; }
    }
` + /* bút lơ lửng (chưa chạm): báo vị trí con trỏ mỗi khung một lần (máy em cần đủ dày để cây bút trượt, không nhảy); trên cột bảng thì y đã cộng độ cuộn */ `
    if (!N && S.but && KH && !XT && e.timeStamp - luotTro > 15) {
      luotTro = e.timeStamp; tx0 = e.clientX; ty0 = e.clientY; baoTro();
` + /* nhắc lại độ cuộn của bảng mỗi 0,5 giây (đường gửi không bảo đảm tới nơi; máy em vào sau cũng bắt kịp) */ `
      if (B && e.timeStamp - luotCuon > 500) { luotCuon = e.timeStamp; so.cuon(cuon); }
    }
  }
` + /* pointerrawupdate: từng mẫu tới NGAY (không chờ khung). Chỉ để VẼ TRƯỚC đầu nét trên lớp sống — không ghi vào nét (pointermove kế tiếp mang đúng các mẫu này, đúng thứ tự). */ `
` + /* Sự kiện đã nằm chờ lâu (các mẫu gộp trải quá 20 ms, hoặc tới tay trễ hơn 10 ms): luồng chính đang bận — Chromium có thể đã gộp cả mẫu của NÉT SAU vào đây, */ `
` + /* và vẽ thêm lúc này chỉ làm nghẽn hơn ⇒ bỏ qua, khung kế vẽ. */ `
  function vaoRaw(e) {
    var n = N, ds, i, d, m, co = false, t0;
    if (!veNgay || !n || e.pointerId !== n.id || !g2 || tVe >= 2.5 || (NH && !n.bang)) return;
    ds = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (!ds || !ds.length) ds = [e];
    t0 = gio();
    if (ds[ds.length - 1].timeStamp - ds[0].timeStamp > 20 || t0 - e.timeStamp > 10) { if (n.xem.length) { n.xem = []; n.can = true; } return; }
    for (i = 0; i < ds.length; i++) {
      d = ds[i]; m = n.xem.length;
      if (d.timeStamp <= n.tg || (m && d.timeStamp <= n.xem[m - 1][2])) continue;
      if (conCham(d, n) !== 1) { n.xem = []; co = true; break; }
      n.xem.push([d.clientX / KH.k, (d.clientY + n.cy) / KH.k, d.timeStamp]); co = true;
    }
` + /* vẽ trước không dày hơn 6 ms một lần (tính theo giờ của mẫu): bút 200 mẫu / giây ⇒ cách một mẫu vẽ một lần, phần còn lại khung kế vẽ */ `
    if (co) { if (!n.xem.length || n.xem[n.xem.length - 1][2] - n.tgVe >= 6) veSong(n); else n.can = true; if (DO) { t0 = gio() - t0; DO.tCho += t0; } hen(); }
  }
  cv.addEventListener('pointermove', vao);
` + /* nút thân bút Wacom = chuột phải: đang cầm bút thì không bật trình đơn của trình duyệt giữa chừng */ `
  cv.addEventListener('contextmenu', function (e) { if (S.but) e.preventDefault(); });
` + /* Hết chạm theo mọi đường: nhấc bút · máy huỷ · mất quyền giữ con trỏ · con trỏ rời bảng (khi không giữ được con trỏ). */ `
  ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach(function (t) {
    cv.addEventListener(t, function (e) {
      if (t === 'pointerleave' && cv.hasPointerCapture && cv.hasPointerCapture(e.pointerId)) return;
      if (CHO && e.pointerId === CHO.id) CHO = null;
      if (XT && e.pointerId === XT.id) { XT = null; so.dongGop(); return; }
      if (KC && e.pointerId === KC.id) { KC = null; return; }
      if (!N || e.pointerId !== N.id) return;
      if (t === 'pointerup') mau(e, true);
      ketNet(t === 'pointercancel' && N.loai === 'touch');
    });
  });
` + /* Cửa sổ mất tiêu điểm / tờ bị ẩn giữa nét: đóng nét (bút còn chạm thì mẫu kế mở nét mới). */ `
  function nhaHet() { if (N) { CHO = { id: N.id, loai: N.loai, coLuc: N.coLuc }; ketNet(false); } if (XT) { XT = null; so.dongGop(); } KC = null; }
  window.addEventListener('blur', nhaHet);
  document.addEventListener('visibilitychange', function () { if (document.hidden) nhaHet(); });

` + /* ── ô đo bút (Alt + B): máy của thầy thực sự cho gì — để chụp gửi lại ── */ `
  function doMoi() { return { net: 0, tb: '', coLuc: false, tc: 0, tg: 0, nDt: 0, trung: 0, apNho: 1, apLon: 0, sk: 0, gop: 0, gopLon: 0, raw: 0, im: 0, tMau: 0, nMau: 0, tCho: 0, tKhung: 0, nKhung: 0, tKhungLon: 0, kh: 0, nKh: 0, tKh: 0, g0: 0, g1: 0, nNet: 0, dong: 0, nDong: 0 }; }
  function doMau(d) {
    var D = DO, dt = d.timeStamp - D.tc;
    D.tc = d.timeStamp; D.g1 = gio(); D.nNet++;
    if (dt >= 0 && dt < 100) { D.tg += dt; D.nDt++; if (dt < 0.2) D.trung++; }
    if (N && N.loai === 'pen') { D.coLuc = N.coLuc; if (d.pressure < D.apNho) D.apNho = d.pressure; if (d.pressure > D.apLon) D.apLon = d.pressure; }
  }
` + /* Số đo dạng số (cho máy đọc). mauMoiGiay tính theo giờ ghi trên mẫu; giờ mẫu trùng nhau nhiều thì tính theo đồng hồ lúc nhận. */ `
  function soDo() {
    var D = DO || doMoi(), trung = D.nDt ? D.trung / D.nDt : 0, hz = trung > 0.3 || !D.tg ? (D.dong ? D.nDong * 1000 / D.dong : 0) : D.nDt * 1000 / D.tg;
    return { bat: !!DO, net: D.net, thietBi: D.tb, coLuc: D.coLuc, mauMoiGiay: Math.round(hz), lucNho: D.apLon ? D.apNho : 0, lucLon: D.apLon, mauGop: D.sk ? D.gop / D.sk : 0, mauGopLon: D.gopLon, coRaw: coRaw, duocNgay: duocNgay, veNgay: veNgay, tuTat: tuTat,
      msMoiMau: D.nMau ? D.tMau / D.nMau : 0, msMoiKhung: D.nKhung ? D.tKhung / D.nKhung : 0, msKhungLon: D.tKhungLon, khungMoiGiay: D.kh ? Math.round(D.nKh * 1000 / D.kh) : 0, gioTrung: trung, nhacIm: D.im, duDoanSai: 0,
      rong: window.innerWidth, cao: window.innerHeight, dpr: window.devicePixelRatio || 1 };
  }
  function soVn(v, le) { var k = Math.pow(10, le); return String(Math.round(v * k) / k).replace('.', ','); }
  function veDo() {
    if (!DO || !oDo) return;
    var d = soDo(), tb = d.thietBi === 'pen' ? (d.coLuc ? 'Bút có lực' : 'Bút không lực') : d.thietBi === 'mouse' ? 'Chuột (bút đang chạy như chuột, không có lực)' : d.thietBi === 'touch' ? 'Chạm tay' : 'chưa viết';
    var dong = [['Thiết bị', tb], ['Số mẫu mỗi giây', d.mauMoiGiay || '—'], ['Lực nhỏ nhất – lớn nhất', d.lucLon ? soVn(d.lucNho, 2) + ' – ' + soVn(d.lucLon, 2) : 'không có'],
      ['Mẫu gộp mỗi lần báo', d.mauGop ? soVn(d.mauGop, 1) + ' (nhiều nhất ' + d.mauGopLon + ')' : '—'], ['Trình duyệt đưa từng mẫu ngay', d.coRaw ? 'có' : 'không'], ['Vẽ thẳng lên màn (đỡ trễ)', d.veNgay ? 'đang bật (thử nghiệm)' : d.tuTat ? 'đã tự tắt vì máy rớt khung' : d.duocNgay ? 'máy làm được, đang tắt' : 'trình duyệt không cho'],
      ['Xử lý mỗi mẫu', d.msMoiMau ? soVn(d.msMoiMau, 2) + ' ms' : '—'], ['Xử lý mỗi khung hình', d.msMoiKhung ? soVn(d.msMoiKhung, 2) + ' ms (lâu nhất ' + soVn(d.msKhungLon, 1) + ')' : '—'],
      ['Khung hình mỗi giây', d.khungMoiGiay || '—'], ['Mẫu trùng giờ', Math.round(d.gioTrung * 100) + ' %'], ['Nhấc bút mà máy không báo', d.nhacIm + ' lần'], ['Màn', d.rong + ' × ' + d.cao + ' · điểm ảnh × ' + soVn(d.dpr, 2)]];
    oDo.innerHTML = '<b>Đo bút — viết vài chữ rồi chụp ô này gửi lại</b>' + dong.map(function (r) { return '<div><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join('') + '<small>Đã viết ' + d.net + ' nét · Alt + B để tắt ô này</small>';
  }
  function batDo(b) {
    if (b == null) b = !DO;
    if (!!b === !!DO) return;
    if (b && !S.but) batBut();
    DO = b ? doMoi() : null;
    if (!oDo) { oDo = tao('div', 'mc-but-do', body); oDo.setAttribute('role', 'status'); }
    oDo.hidden = !b; veDo();
  }

` + /* ── thanh bút + con trỏ ── */ `
  function hinh(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; }
  function nutBut(lop, thuoc, nhan, trong) { return '<button type="button" class="mc-n' + lop + '" ' + thuoc + ' aria-label="' + nhan + '" title="' + nhan + '">' + trong + '</button>'; }
  function veButCu() {
    var vach = '<i class="mc-bv"></i>';
    butCu.innerHTML = MAU_BUT.map(function (m) { return '<button type="button" class="mc-m' + (!S.tay && S.mau === m[0] ? ' mc-chon' : '') + '" style="background:' + m[0] + '" data-m="' + m[0] + '" aria-label="' + m[1] + '" title="' + m[1] + '"></button>'; }).join('') + vach +
      CO_BUT.map(function (c) { return nutBut(' mc-bc' + (!S.tay && S.co === c[0] ? ' mc-chon' : ''), 'data-c="' + c[0] + '"', c[1], '<i style="width:' + c[2] + ';height:' + c[2] + '"></i>'); }).join('') + vach +
      nutBut(S.tay ? ' mc-chon' : '', 'data-tay="1"', 'Tẩy theo nét (E)', hinh('M7 21h13M5.5 13.5 14 5l6 6-8.5 8.5a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8ZM9.5 9.5l6 6') + 'Tẩy') +
      nutBut('', 'data-lui="1"', 'Hoàn tác (Ctrl + Z)', hinh('M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11')) +
      nutBut('', 'data-toi="1"', 'Làm lại (Ctrl + Y)', hinh('m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13')) +
      nutBut('', 'data-xoa="1"', 'Xoá hết nét của câu này (hoàn tác được)', hinh('M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3')) + vach +
      nutBut('', 'data-tat="1"', 'Tắt bút (B)', 'Tắt <kbd>B</kbd>');
    capNut(); conTro(); henThanh();
  }
` + /* Thanh bút nằm trên mép phải tấm giấy đề, sát cột bảng đen (không che thẻ tên em); tờ không có cột bảng ⇒ giữa mép trên như cũ. */ `
` + /* Đo chỗ cột SO VỚI ĐỢT (đợt đang trượt vào vẫn ra đúng số), và đo lại một nhịp sau khi tờ xếp xong. */ `
  function datThanh() {
    var W = window.innerWidth, doiG = !!KH && !N && doOGiay(), doi = (KH && !N ? datBang() : false) || doiG, co = S.but && !!B;
    butCu.style.left = co ? 'auto' : ''; butCu.style.transform = co ? 'none' : ''; butCu.style.right = co ? Math.round(W - B[0] * W + u() * 0.9) + 'px' : '';
    oThanh = S.but ? butCu.getBoundingClientRect() : null;
    if (doi) veLai(); else veRay();
  }
  function henThanh() { datThanh(); if (S.but) { clearTimeout(hThanh); hThanh = setTimeout(datThanh, 600); } }
  ['mc-doi-pha', 'mc-bo-cuc-xong'].forEach(function (t) { document.addEventListener(t, function () { if (S.but || KH) henThanh(); }); });
  function capNut() {
    var a = butCu.querySelector('[data-lui]'), b = butCu.querySelector('[data-toi]'), c = butCu.querySelector('[data-xoa]');
    if (a) a.disabled = !so.coLui(); if (b) b.disabled = !so.coToi(); if (c) c.disabled = !so.ds().length;
  }
` + /* Con trỏ = chấm đúng màu, đúng cỡ nét (viền tối mảnh để thấy trên cả giấy lẫn bảng đen); đang tẩy = vòng tròn đúng cỡ tẩy. */ `
  function conTro() {
    if (!KH) return;
    var r = S.tay ? Math.max(6, Math.min(56, R_TAY * KH.k)) : Math.max(2.5, S.co * KH.k * 0.6), c = Math.ceil(r + 2), w = c * 2;
    var hinhTron = S.tay
      ? '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="3"/><circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + MAU_BUT[0][0] + '" stroke-width="1.5"/>'
      : '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="' + S.mau + '" stroke="currentColor" stroke-opacity=".55" stroke-width="1"/>';
    cv.style.cursor = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + w + '">' + hinhTron + '</svg>') + '") ' + c + ' ' + c + ', crosshair';
  }
  function hoanTac() { ketNet(false); if (so.hoanTac()) { veLai(); capNut(); } }
  function lamLai() { ketNet(false); if (so.lamLai()) { veLai(); capNut(); } }
  function xoaBut() { ketNet(false); if (so.xoaHet()) { veLai(); capNut(); } }
` + /* Vào đợt: nét của đợt cũ cất lại, bảng hiện nét của đợt này (đợt chưa viết ⇒ bảng sạch). */ `
  function butTrang() { ketNet(false); XT = null; CHO = null; KC = null; dungCuon(); clearTimeout(hPhatGiay); doOGiay(); so.doiTrang(String(chiSo())); cuon = CUON[so.trang()] || 0; CY = KH ? Math.round(cuon * KH.H * dpr) : 0; veLai(); capNut(); henThanh(); so.cuon(cuon); }
  butCu.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b || b.disabled) return;
    if (b.getAttribute('data-m')) { S.mau = b.getAttribute('data-m'); S.tay = false; }
    if (b.getAttribute('data-c')) { S.co = +b.getAttribute('data-c'); S.tay = false; }
    if (b.getAttribute('data-tay')) S.tay = !S.tay;
    if (b.getAttribute('data-lui')) { hoanTac(); return; }
    if (b.getAttribute('data-toi')) { lamLai(); return; }
    if (b.getAttribute('data-xoa')) { xoaBut(); return; }
    if (b.getAttribute('data-tat')) { batBut(); return; }
    veButCu();
  });
  function batBut() {
    S.but = !S.but;
    if (S.but && !KH) coCanvas();
    if (!S.but) { ketNet(false); XT = null; CHO = null; KC = null; dungCuon(); if (DO) batDo(false); }
    body.classList.toggle('mc-co-but', S.but); veButCu(); veThanh();
  }
` + /* Alt + B: ô đo bút (bật luôn bút nếu đang tắt). Các phím còn lại CHỈ khi bút đang bật (không cướp phím nào của tờ lúc bút tắt): */ `
` + /* Ctrl + Z hoàn tác · Ctrl + Y / Ctrl + Shift + Z làm lại · E đổi bút ↔ tẩy. */ `
  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.closest && e.target.closest('input,textarea,select')) return;
    var k = String(e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (e.altKey && !c && (k === 'b' || e.code === 'KeyB')) { e.preventDefault(); batDo(); return; }
    if (!S.but) return;
    if (c && (k === 'z' || k === 'y')) { e.preventDefault(); if (k === 'y' || e.shiftKey) lamLai(); else hoanTac(); }
    else if (!c && !e.altKey && k === 'e') { S.tay = !S.tay; veButCu(); }
  });
  window.addEventListener('resize', function () { if (KH) { ketNet(false); coCanvas(); conTro(); henThanh(); } });
  window.__mcBut = {
    xuat: xuatMan,
    nhap: function (goi) { if (!KH) coCanvas(); ketNet(false); var n = so.nhap(goi); veLai(); capNut(); return n; },
    nghe: ngheBut, trang: so.trang, hoanTac: hoanTac, lamLai: lamLai, xoaHet: xoaBut,
    bat: function (b) { if (!!b !== S.but) batBut(); },
` + /* cho việc live: bộ máy dựng nét, bảng màu / cỡ, và ô giấy đề / ô bảng đen của đợt đang chiếu tính theo vùng viết [x0, y0, x1, y1] (0..1) */ `
    loi: LoiBut, mau: MAU_BUT, co: CO_BUT,
` + /* ô đo bút: doBut(true / false) bật / tắt, trả về số đo hiện có · veNgay(true / false) bật / tắt chế độ vẽ ngay khi mẫu tới (thử nghiệm, mặc định tắt) */ `
    doBut: function (b) { if (b != null) batDo(!!b); return soDo(); },
    veNgay: function (b) { if (b != null) { tuTat = false; khDem = 0; khPhat = 0; datVeNgay(!!b); } return veNgay; },
` + /* lớp bảng đặc: nhanh() đọc { bat, duoc, cap } · nhanh(false) tắt hẳn + nhớ (công tắc lùi khẩn) · nhanh(true) bật lại nếu trình duyệt cấp · nhanh('ep') ép bật để thử */ `
    nhanh: function (b) {
      if (b != null) {
        try { if (b === true) window.localStorage.removeItem('ddh.but.nhanh'); else window.localStorage.setItem('ddh.but.nhanh', b === 'ep' ? 'ep' : 'tat'); } catch (e) {}
        nhDuoc = !gB || b === false ? 0 : b === 'ep' ? 2 : capB ? 1 : 0;
        if (!nhDuoc && veNgay) datVeNgay(false);
        if (KH) { ketNet(false); khoaB = '#'; datBang(); veLai(); }
      }
      return { bat: NH, duoc: nhDuoc, cap: capB };
    },
` + /* bảng đen cuộn: cuon() đọc độ cuộn (số lần bề dọc cửa sổ) · cuon(v) đặt · cuon(v, true) trôi êm tới */ `
    cuon: function (v, em) { if (v != null) { if (em) cuonToi(+v); else { dungCuon(); datCuon(+v); } } return cuon; },
    vung: function () {
      var d = dot(), W = window.innerWidth, H = window.innerHeight, ra = {};
      [['giay', '.mc-vung-de'], ['bang', '.mc-cot-lam-bai']].forEach(function (v) { var e = d && d.querySelector ? d.querySelector(v[1]) : null, r = e ? e.getBoundingClientRect() : null; if (r && r.width > 0) ra[v[0]] = [r.left / W, r.top / H, r.right / W, r.bottom / H]; });
      return ra;
    }
  };
  so.doiTrang(String(chiSo()));
  veButCu();
`
