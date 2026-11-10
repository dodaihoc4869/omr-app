// BÚT VIẾT BẢNG TRÊN TỜ CHIẾU (thầy 10/11: «chỉnh phần bút viết cho mượt mà … viết bằng bút wacom lên phần bảng đen, nét bút mảnh vừa phải siêu đẹp»).
// Đoạn JS + CSS chèn vào tờ (len-bang-moi-to-chieu.ts, cùng phạm vi: body · tao · S · chiSo · veThanh). Tách tệp riêng vì cổng cỡ tệp.
// Bộ máy dựng nét: `but-bang-loi.ts` (vectơ chuẩn hoá, đường cong qua đúng mẫu, đa giác bao). Tệp này lo phần MÀN:
//   · vào: Pointer Events. DỮ LIỆU nét chỉ lấy từ pointermove + getCoalescedEvents (đủ mẫu Wacom ≥ 200 Hz, đúng thứ tự với pointerdown / pointerup).
//     `pointerrawupdate` (Chrome đưa từng mẫu ngay) chỉ dùng để VẼ TRƯỚC đầu nét cho đỡ trễ, không ghi vào nét: đo thật (scripts/but-bang-1011/thu-tu-raw.mjs) thấy khi
//     luồng chính bận, Chromium gộp cả mẫu của NÉT SAU vào một pointerrawupdate phát TRƯỚC pointerup ⇒ lấy làm dữ liệu thì chữ dính nhau.
//     Bút dùng lực thật, chuột / chạm giả lực theo vận tốc; đang có bút (hoặc bút vừa ở gần mặt bảng) thì bỏ qua chạm tay; đuôi bút Wacom = tẩy.
//   · CẮT NÉT chắc tay (11/11, thầy viết Wacom thấy chữ dính nhau): hết chạm là hết nét dù máy không báo pointerup — mẫu `buttons` không còn nút chính,
//     bút có lực mà lực về 0, pointercancel, lostpointercapture, pointerleave, cửa sổ mất tiêu điểm. Bút chạm lại mà không có pointerdown ⇒ mở nét mới.
//   · ra: hai lớp canvas — lớp TĨNH (nét đã xong + phần đã chốt của nét đang viết) và lớp SỐNG (đoạn cuối của nét đang viết, desynchronized).
//     Mỗi khung vẽ MỘT lần (đầu nét luôn tới đúng mẫu mới nhất của khung đó), kèm đoạn dự đoán ≤ 1 khung (có kẹp hướng + độ dài, tự tắt khi đoán sai,
//     chỉ sống một khung: bút dừng lại là xoá — bản 10/11 để đoạn đoán nằm lại tới khi có sự kiện mới).
//     Phần vừa in xuống lớp tĩnh còn giữ trên lớp sống thêm 2 khung ⇒ không nháy.
//     VẼ NGAY khi mẫu tới (pointerrawupdate + lớp sống desynchronized, không chờ khung) ĐÃ CÓ nhưng MẶC ĐỊNH TẮT, chỉ bật bằng __mcBut.veNgay(true): đo ở CPU × 4 thấy
//     mỗi lượt vẽ ngoài khung làm trình duyệt đẩy canvas lên màn một lần ⇒ nghẽn luồng chính: chữ nhỏ còn 57–58 khung / giây (docs/ban-ve-but-1011/so-do-trung-thuc.json),
//     một nét dài viết nhanh có khung đứng 0,3–1,5 giây trước khi bộ máy kịp tự tắt (VE_NGAY=1 CHI=moi:mot-net-dai:4 node scripts/but-bang-1011/do-khung.mjs).
//     Ô đo bút cho biết máy thầy có làm được không; bật mà rớt khung thì bộ máy tự tắt.
//   · Alt + B: ô ĐO BÚT (thiết bị, số mẫu mỗi giây, lực, mẫu gộp, thời gian xử lý) để thầy chụp gửi lại.
//   · nét giữ theo ĐỢT (khoá = chỉ số đợt): chuyển câu rồi quay lại vẫn còn, câu mới bảng sạch.
// API cho việc phát LIVE (chưa gửi đi đâu): window.__mcBut = { xuat, nhap, nghe, hoanTac, lamLai, xoaHet, bat, trang, loi, mau, co, vung, + doBut, veNgay } — sự kiện xem `SuKienBut`
// (them-diem gom MỘT lần mỗi khung hình; tro = con trỏ lơ lửng, tối đa 20 lần / giây). Hàm nghe chạy ngay trong khung vẽ ⇒ phải nhẹ (xếp hàng rồi gửi sau).
// Màu phấn là DỮ LIỆU của nét (đi theo nét sang máy khác) nên ghi rgb() thẳng, lấy đúng trị của các biến sẵn có trên tờ:
//   trắng ngà = --mc-bang-chu · vàng = --mc-vang-noi · xanh ngọc = --mc-ll-dung (tối) · hồng = --mc-ll-sai (tối) · mực xanh = màu bút xanh cũ.
import { JS_LOI_BUT } from './but-bang-loi'

export const CSS_BUT_BANG = `
/* 7b · bút viết bảng 10/11: lớp sống nằm trên lớp tĩnh; thanh bút gọn */
canvas.mc-but-song{z-index:30}
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
@media print{.mc-but-do{display:none!important}}
`

export const JS_BUT_BANG = `
` + /* ── B · bút viết bảng (thầy 10/11) — bộ máy dựng nét: but-bang-loi.ts ── */ `
${JS_LOI_BUT}
  var MAU_BUT = [['rgb(244,239,228)', 'Phấn trắng'], ['rgb(255,210,122)', 'Phấn vàng'], ['rgb(110,231,183)', 'Phấn xanh ngọc'], ['rgb(253,164,175)', 'Phấn hồng'], ['rgb(36,86,201)', 'Mực xanh (viết lên giấy đề)']];
  var CO_BUT = [[1.2, 'Nét rất mảnh', '.22em'], [1.7, 'Nét mảnh', '.32em'], [2.3, 'Nét vừa', '.46em'], [3.4, 'Nét đậm', '.68em']];
  var PHIM_BUT = [['B', 'Bút viết bảng: phấn 4 màu, mực xanh, 4 cỡ nét'], ['E', 'Bút đang bật: đổi bút ↔ tẩy theo nét'], ['Ctrl + Z / Ctrl + Y · Alt + B', 'Bút đang bật: hoàn tác / làm lại · bật ô đo bút']];
  var R_TAY = 15;
  S.mau = MAU_BUT[0][0]; S.co = CO_BUT[1][0];
  function nguCanh(c, song) { try { return c.getContext ? c.getContext('2d', song ? { desynchronized: true } : undefined) : null; } catch (e) { return null; } }
  function gio() { return window.performance && performance.now ? performance.now() : Date.now(); }
  var cvT = tao('canvas', 'mc-but', body), cv = tao('canvas', 'mc-but mc-but-song', body), butCu = tao('div', 'mc-but-cu', body);
  var gT = nguCanh(cvT, false), g2 = nguCanh(cv, true), so = LoiBut.taoSo(), KH = null, dpr = 1;
` + /* N = nét đang viết · CHO = bút đã hết chạm mà máy chưa báo nhấc (chạm lại ⇒ mở nét mới) · XT = lượt kéo tẩy · ban = ô vừa vẽ trên lớp sống (để xoá đúng chỗ) */ `
` + /* luotBut = lần cuối thấy bút (chặn chạm tay) · coRaw = trình duyệt đưa từng mẫu ngay · veNgay = vẽ trước đầu nét ngay khi mẫu tới · tVe = thời gian một lượt vẽ (ms, trung bình trượt) */ `
` + /* ddSai = độ sai của dự đoán (px, trung bình trượt) · hXoa = số khung còn chờ trước khi xoá lớp sống sau khi nhấc bút · DO = số đo của ô đo bút (null = ô tắt) */ `
  var RONG = [], N = null, CHO = null, XT = null, ban = null, hRaf = 0, luotBut = -1e9, luotTro = -1e9, oThanh = null, hThanh = 0, nong = 0;
` + /* duocNgay = trình duyệt cho vẽ thẳng lên màn (desynchronized + pointerrawupdate; chỉ để báo trong ô đo, không tự bật) · kyKh = chu kì khung hình của màn (ms, khoảng ngắn nhất từng thấy) · khTb = khoảng cách khung trung bình trượt lúc đang viết */ `
` + /* khDem = số khung đã tính trong lượt canh này · khSach = số khung liền không rớt · khPhat = số lần bắt gặp rớt khung khi đang vẽ ngay · tuTat = đã tự tắt vẽ ngay vì máy rớt khung */ `
  var coRaw = 'onpointerrawupdate' in window, veNgay = false, ngheRaw = false, tVe = 0, ddSai = 0, hXoa = 0, DO = null, oDo = null, luotDo = 0, duocNgay = false, kyKh = 1e9, khTb = 0, khDem = 0, khSach = 0, khPhat = 0, tuTat = false;
  butCu.setAttribute('role', 'toolbar'); butCu.setAttribute('aria-label', 'Bút viết bảng');

  function coCanvas() {
    var W = window.innerWidth, H = window.innerHeight, tt;
    dpr = Math.min(window.devicePixelRatio || 1, 3); KH = LoiBut.khung(W, H); ban = null;
    [cvT, cv].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
` + /* lớp sống có thật sự được vẽ thẳng lên màn (không chờ ghép khung) không: chỉ khi đó vẽ ngay trong lúc nhận mẫu mới có ích (ghi lại cho ô đo bút; không tự bật) */ `
    try { tt = g2 && g2.getContextAttributes ? g2.getContextAttributes() : null; } catch (e) { tt = null; }
    duocNgay = coRaw && !!(tt && tt.desynchronized);
    so.datTiLe(W / H); veLai();
    if (!nong) { nong = 1; lamNong(); }
  }
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
    if (g2 && gT) { toDaGiac(g2, p, 'transparent'); toDaGiac(gT, p, 'transparent'); }
  }
  function toDaGiac(c, p, mau) {
    var s = dpr * KH.k;
    c.setTransform(s, 0, 0, s, 0, 0); c.globalCompositeOperation = 'source-over'; c.fillStyle = mau;
    c.beginPath(); LoiBut.veDaGiac(c, p); c.fill();
  }
` + /* Lớp tĩnh: vẽ lại MỌI nét của trang từ vectơ (đường bao nhớ theo tỉ lệ vùng viết ⇒ đổi cỡ cùng tỉ lệ / tẩy / hoàn tác không dựng lại). */ `
  function veLai() {
    if (!gT || !KH) return;
    var s = dpr * KH.k, khoaD = KH.rw + 'x' + KH.rh, coD = typeof Path2D === 'function';
    gT.setTransform(1, 0, 0, 1, 0, 0); gT.clearRect(0, 0, cvT.width, cvT.height); gT.setTransform(s, 0, 0, s, 0, 0);
    so.ds().forEach(function (n) {
      var p;
      if (n._k !== khoaD) { p = LoiBut.dungNet(n, KH); n._k = khoaD; if (coD) { n._d = new Path2D(); LoiBut.veDaGiac(n._d, p); } else n._d = p; }
      gT.globalCompositeOperation = n.cong === 'tay' ? 'destination-out' : 'source-over'; gT.fillStyle = n.mau;
      if (coD) gT.fill(n._d); else { gT.beginPath(); LoiBut.veDaGiac(gT, n._d); gT.fill(); }
    });
    gT.globalCompositeOperation = 'source-over';
  }
  function xoaSong() { if (g2 && ban) { g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(ban[0], ban[1], ban[2], ban[3]); } ban = null; hXoa = 0; }
` + /* Tô một đa giác lên lớp sống và nhớ ô bao của nó (lượt vẽ sau xoá đúng ô này). */ `
  function toSong(p, mau) {
    var i, s = dpr * KH.k, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    if (!p.length) return;
    toDaGiac(g2, p, mau);
    for (i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; }
    ban = [Math.floor(x0 * s) - 3, Math.floor(y0 * s) - 3, Math.ceil((x1 - x0) * s) + 6, Math.ceil((y1 - y0) * s) + 6];
  }
  function xaDiem(n) { if (n.moi.length) { so.themDiem(n.moi); n.moi = []; } }
  function hen() { if (!hRaf) hRaf = (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(khungVe); }
` + /* Vẽ nét đang viết: phần đã chốt và đã xa đầu bút thì in MỘT lần xuống lớp tĩnh; lớp sống chỉ dựng lại đoạn cuối (+ đầu bút thật + đoạn dự đoán). */ `
  function veSong(n) {
    var den, them = null, t0 = veNgay ? gio() : 0, st = n.st;
    n.can = false;
    LoiBut.xuLyThem(st, n.tat, n.tat.length);
    den = LoiBut.mocDong(st, n.dong);
    if (den > 0 && gT) { toDaGiac(gT, LoiBut.vien(st, n.dong, den, null, false), n.net.mau); n.dong = den - 2; }
    xoaSong();
    if (n.mx !== n.tx || n.my !== n.ty) them = [[n.mx / KH.k, n.my / KH.k]];
    if (n.xem.length) them = (them || []).concat(n.xem);
    if (n.dd.length) them = (them || []).concat(n.dd);
    toSong(LoiBut.vien(st, n.song, -1, them, false), n.net.mau);
` + /* thời gian một lượt vẽ chỉ cần khi đang vẽ ngay (để tự giãn): đọc đồng hồ ở mỗi lượt vẽ cũng tốn */ `
    if (veNgay) { tVe += ((gio() - t0) - tVe) * 0.2; n.tgVe = n.xem.length ? n.xem[n.xem.length - 1][2] : n.tg; }
  }
` + /* MỘT vòng mỗi khung: gom điểm mới phát đi một lần, dời dần điểm bắt đầu của lớp sống (chậm 2 khung so với lớp tĩnh), vẽ nếu còn việc. */ `
  function khungVe(ts) {
    hRaf = 0;
    var n = N, t0, dt;
    if (!g2) return;
    if (!n) { if (hXoa > 0) { if (--hXoa) hen(); else xoaSong(); } return; }
    if (DO) { t0 = gio(); if (DO.tKh && ts - DO.tKh < 100) { DO.kh += ts - DO.tKh; DO.nKh++; } DO.tKh = ts; }
    dt = ts - n.tsKh; n.tsKh = ts;
    if (veNgay && dt > 3 && dt < 1000) canhKhung(Math.min(dt, 100));
    xaDiem(n);
` + /* đoạn dự đoán chỉ sống MỘT khung: khung này không có sự kiện mới (bút dừng lại) ⇒ xoá ngay, không để đuôi đoán nằm lại trên bảng */ `
    if (n.sk) { if (!veNgay) { n.dd = duDoan(n.sk, n); if (n.dd.length) n.can = true; } n.sk = null; }
    else if (n.dd.length) { n.dd = RONG; n.can = true; }
    if (n.song !== n.d2) n.can = true;
    n.song = n.d2; n.d2 = n.d1; n.d1 = n.dong;
    if (n.can) veSong(n);
    if (n.dd.length) hen();
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
` + /* Một mẫu vào. chot = mẫu nhấc bút: giữ đúng chỗ dừng, không lấy lực của mẫu này. */ `
  function mau(e, chot) {
    var n = N, x = e.clientX, y = e.clientY, gioMau = e.timeStamp, t = Math.max(n.tt, gioMau - n.t0), q = Math.sqrt((x - n.tx) * (x - n.tx) + (y - n.ty) * (y - n.ty)) / KH.k, ap = n.ap, dt, d, pr;
    var luc = n.loai === 'pen' && (pr = e.pressure, n.coLuc || (pr > 0 && pr !== 0.5));
    n.mx = x; n.my = y; n.tg = gioMau;
` + /* nét đi vào dưới thanh bút ⇒ thanh mờ đi cho tới khi nhấc bút */ `
    if (!n.che && oThanh && x > oThanh.left - 12 && x < oThanh.right + 12 && y > oThanh.top - 12 && y < oThanh.bottom + 12) { n.che = true; butCu.classList.add('mc-viet'); }
    if (q < (chot ? 0.05 : 0.35)) {
` + /* ấn bút tại chỗ, lực mạnh dần (dấu chấm): ghi thêm lực ở đúng chỗ cũ ⇒ chấm ra đủ đậm */ `
      if (!chot && luc && pr > ap + 0.1) { n.coLuc = true; n.ap = pr; d = LoiBut.diem(n.tx, n.ty, pr, t, KH.W, KH.H); n.moi.push(d); n.tat.push(d); n.can = true; }
      return;
    }
    dt = Math.max(1, t - n.tt);
    if (!chot) {
      if (luc) { n.coLuc = true; ap = pr; }
      else ap = LoiBut.apLucGia(ap, q, Math.max(4, dt));
    }
` + /* vận tốc (px ở màn 1920 mỗi mili-giây) cho việc kẹp đoạn dự đoán */ `
    n.vx += 0.6 * ((x - n.tx) / KH.k / dt - n.vx); n.vy += 0.6 * ((y - n.ty) / KH.k / dt - n.vy);
    n.ap = ap; n.tx = x; n.ty = y; n.tt = t; n.dd = RONG;
    d = LoiBut.diem(x, y, ap, t, KH.W, KH.H); n.moi.push(d); n.tat.push(d); n.can = true;
  }
` + /* Mở nét tại mẫu e. luc = thiết bị này đã từng báo lực thật (nét mở lại sau khi bút lướt). */ `
  function batNet(e, id, loai, luc) {
    var but = loai === 'pen', coLuc = but && e.pressure > 0 && e.pressure !== 0.5, ap = coLuc ? e.pressure : but ? 0.12 : 0.3, d = LoiBut.diem(e.clientX, e.clientY, ap, 0, KH.W, KH.H);
    N = { id: id, loai: loai, coLuc: coLuc || !!luc, nghi: 0, t0: e.timeStamp, tg: e.timeStamp, tgVe: e.timeStamp, tt: 0, tx: e.clientX, ty: e.clientY, mx: e.clientX, my: e.clientY, ap: ap, vx: 0, vy: 0, moi: [], tat: [d], dd: RONG, xem: [], sk: null, duCu: null, tsKh: 0, dong: 0, song: 0, d1: 0, d2: 0, can: true, net: null, st: null };
    N.net = so.batDau({ cong: 'but', mau: S.mau, co: S.co, diem: d });
    N.st = LoiBut.moXuLy(N.net, KH);
    if (DO) { DO.net++; DO.tb = loai; DO.coLuc = N.coLuc; DO.tc = e.timeStamp; DO.g0 = DO.g1 = gio(); DO.nNet = 1; }
    hen();
  }
  function ketNet(huy) {
    var n = N; if (!n) return;
    N = null; xaDiem(n);
    if (n.che) butCu.classList.remove('mc-viet');
    if (huy) { xoaSong(); so.ketThuc(true); if (n.dong) veLai(); return; }
    LoiBut.xuLyThem(n.st, n.tat, n.tat.length);
    if (gT) toDaGiac(gT, LoiBut.vien(n.st, n.dong, -1, null, true), n.net.mau);
` + /* vẽ thẳng lên màn: lớp sống hiện trước lớp tĩnh một nhịp ⇒ giữ đúng hình cuối trên lớp sống thêm 2 khung rồi mới xoá (không nháy lúc nhấc bút) */ `
    xoaSong();
    if (veNgay && g2) { toSong(LoiBut.vien(n.st, n.song, -1, null, true), n.net.mau); hXoa = 2; hen(); }
    so.ketThuc(); capNut();
    if (DO) { if (DO.nNet > 2) { DO.dong += DO.g1 - DO.g0; DO.nDong += DO.nNet - 1; } veDo(); }
  }
  function cachDoan(px, py, ax, ay, bx, by) { var vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1))); vx = ax + t * vx - px; vy = ay + t * vy - py; return Math.sqrt(vx * vx + vy * vy); }
` + /* Đoạn DỰ ĐOÁN của trình duyệt, chỉ để hiển thị tạm tới khung sau: tối đa 1 khung (17 ms), không dài hơn 1,3 lần quãng bút đi được trong 1 khung, không lệch hướng đang đi quá ~45°. */ `
` + /* Mỗi lần có mẫu thật thì chấm điểm lần đoán trước (cách đường thật bao xa); sai trung bình trên 1,2 px ⇒ ngừng hiện cho tới khi đoán đúng lại. */ `
  function duDoan(e, n) {
    var ds, ra, i, p, dx, dy, q, v = Math.sqrt(n.vx * n.vx + n.vy * n.vy), gh, c = n.duCu;
    if (c) { ddSai += 0.3 * (cachDoan(c[0], c[1], c[2], c[3], n.mx / KH.k, n.my / KH.k) - ddSai); n.duCu = null; }
` + /* bút đi chậm (dưới 150 px / giây, tức chưa tới 2,5 px mỗi khung): không cần đoán, khỏi hỏi trình duyệt */ `
    if (v < 0.15) return RONG;
    ds = e.getPredictedEvents ? e.getPredictedEvents() : null;
    if (!ds || !ds.length) return RONG;
    gh = Math.min(14, v * 22); ra = [];
    for (i = 0; i < ds.length && i < 3; i++) {
      p = ds[i]; if (p.timeStamp - e.timeStamp > 17) break;
      dx = (p.clientX - n.mx) / KH.k; dy = (p.clientY - n.my) / KH.k; q = Math.sqrt(dx * dx + dy * dy);
      if (q > gh || dx * n.vx + dy * n.vy < 0.7 * q * v) break;
      ra.push([p.clientX / KH.k, p.clientY / KH.k]);
    }
    if (ra.length) n.duCu = [ra[ra.length - 1][0], ra[ra.length - 1][1], n.mx / KH.k, n.my / KH.k];
    return ddSai > 1.2 || !ra.length ? RONG : ra;
  }
` + /* Tẩy theo NÉT: kéo qua nét nào thì cả nét đó mất; cả lượt kéo là MỘT bước hoàn tác. */ `
  function tayQua(x0, y0, x1, y1) {
    var buoc = Math.max(1, Math.ceil(Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) / (R_TAY * KH.k * 0.5))), i, ids = [];
    for (i = 0; i <= buoc; i++) LoiBut.timCham(so.ds(), (x0 + (x1 - x0) * i / buoc) / KH.W, (y0 + (y1 - y0) * i / buoc) / KH.H, R_TAY, KH).forEach(function (d) { if (ids.indexOf(d) < 0) ids.push(d); });
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
    if (N || XT) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    if (S.tay || (but && (e.buttons & 32))) { XT = { id: e.pointerId, x: e.clientX, y: e.clientY }; tayQua(XT.x, XT.y, XT.x, XT.y); return; }
    batNet(e, e.pointerId, e.pointerType, false);
  });
` + /* Mẫu di chuyển (pointermove + các mẫu gộp của nó): nguồn DUY NHẤT của dữ liệu nét. */ `
  function vao(e) {
    var ds, i, d, t0, c, k;
    if (e.pointerType === 'pen') luotBut = e.timeStamp;
    if (XT && e.pointerId === XT.id) { tayQua(XT.x, XT.y, e.clientX, e.clientY); XT.x = e.clientX; XT.y = e.clientY; return; }
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
` + /* đoạn dự đoán: nhớ sự kiện mới nhất, tới lượt vẽ của khung mới hỏi trình duyệt MỘT lần (hỏi ở mỗi sự kiện tốn gấp mấy lần mà chỉ lần cuối được dùng) */ `
        N.sk = e;
        hen();
      }
      if (DO) { t0 = gio() - t0; DO.tCho += t0; DO.tMau += t0; DO.nMau += ds.length; DO.sk++; DO.gop += ds.length; if (ds.length > DO.gopLon) DO.gopLon = ds.length; }
    }
` + /* bút lơ lửng (chưa chạm): báo vị trí con trỏ, tối đa 20 lần / giây */ `
    if (!N && S.but && KH && !XT && e.timeStamp - luotTro > 50) { luotTro = e.timeStamp; so.tro(e.clientX / KH.W, e.clientY / KH.H); }
  }
` + /* pointerrawupdate: từng mẫu tới NGAY (không chờ khung). Chỉ để VẼ TRƯỚC đầu nét trên lớp sống — không ghi vào nét (pointermove kế tiếp mang đúng các mẫu này, đúng thứ tự). */ `
` + /* Sự kiện đã nằm chờ lâu (các mẫu gộp trải quá 20 ms, hoặc tới tay trễ hơn 10 ms): luồng chính đang bận — Chromium có thể đã gộp cả mẫu của NÉT SAU vào đây, */ `
` + /* và vẽ thêm lúc này chỉ làm nghẽn hơn ⇒ bỏ qua, khung kế vẽ. */ `
  function vaoRaw(e) {
    var n = N, ds, i, d, m, co = false, t0;
    if (!veNgay || !n || e.pointerId !== n.id || !g2 || tVe >= 2.5) return;
    ds = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (!ds || !ds.length) ds = [e];
    t0 = gio();
    if (ds[ds.length - 1].timeStamp - ds[0].timeStamp > 20 || t0 - e.timeStamp > 10) { if (n.xem.length) { n.xem = []; n.can = true; } return; }
    for (i = 0; i < ds.length; i++) {
      d = ds[i]; m = n.xem.length;
      if (d.timeStamp <= n.tg || (m && d.timeStamp <= n.xem[m - 1][2])) continue;
      if (conCham(d, n) !== 1) { n.xem = []; co = true; break; }
      n.xem.push([d.clientX / KH.k, d.clientY / KH.k, d.timeStamp]); co = true;
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
      if (!N || e.pointerId !== N.id) return;
      if (t === 'pointerup') mau(e, true);
      ketNet(t === 'pointercancel' && N.loai === 'touch');
    });
  });
` + /* Cửa sổ mất tiêu điểm / tờ bị ẩn giữa nét: đóng nét (bút còn chạm thì mẫu kế mở nét mới). */ `
  function nhaHet() { if (N) { CHO = { id: N.id, loai: N.loai, coLuc: N.coLuc }; ketNet(false); } if (XT) { XT = null; so.dongGop(); } }
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
      msMoiMau: D.nMau ? D.tMau / D.nMau : 0, msMoiKhung: D.nKhung ? D.tKhung / D.nKhung : 0, msKhungLon: D.tKhungLon, khungMoiGiay: D.kh ? Math.round(D.nKh * 1000 / D.kh) : 0, gioTrung: trung, nhacIm: D.im, duDoanSai: ddSai,
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
    var d = S.but ? dot() : null, c = d && d.querySelector ? d.querySelector('.mc-cot-lam-bai') : null, r = c ? c.getBoundingClientRect() : null, W = window.innerWidth;
    var trai = r ? r.left - d.getBoundingClientRect().left : 0, co = !!r && r.width > 40 && trai > W * 0.4 && trai < W;
    butCu.style.left = co ? 'auto' : ''; butCu.style.transform = co ? 'none' : ''; butCu.style.right = co ? Math.round(W - trai + u() * 0.9) + 'px' : '';
    oThanh = S.but ? butCu.getBoundingClientRect() : null;
  }
  function henThanh() { datThanh(); if (S.but) { clearTimeout(hThanh); hThanh = setTimeout(datThanh, 600); } }
  ['mc-doi-pha', 'mc-bo-cuc-xong'].forEach(function (t) { document.addEventListener(t, function () { if (S.but) henThanh(); }); });
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
  function butTrang() { ketNet(false); XT = null; CHO = null; so.doiTrang(String(chiSo())); veLai(); capNut(); henThanh(); }
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
    if (!S.but) { ketNet(false); XT = null; CHO = null; if (DO) batDo(false); }
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
    xuat: function () { return so.xuat(); },
    nhap: function (goi) { if (!KH) coCanvas(); ketNet(false); var n = so.nhap(goi); veLai(); capNut(); return n; },
    nghe: so.nghe, trang: so.trang, hoanTac: hoanTac, lamLai: lamLai, xoaHet: xoaBut,
    bat: function (b) { if (!!b !== S.but) batBut(); },
` + /* cho việc live: bộ máy dựng nét, bảng màu / cỡ, và ô giấy đề / ô bảng đen của đợt đang chiếu tính theo vùng viết [x0, y0, x1, y1] (0..1) */ `
    loi: LoiBut, mau: MAU_BUT, co: CO_BUT,
` + /* ô đo bút: doBut(true / false) bật / tắt, trả về số đo hiện có · veNgay(true / false) bật / tắt chế độ vẽ ngay khi mẫu tới (thử nghiệm, mặc định tắt) */ `
    doBut: function (b) { if (b != null) batDo(!!b); return soDo(); },
    veNgay: function (b) { if (b != null) { tuTat = false; khDem = 0; khPhat = 0; datVeNgay(!!b); } return veNgay; },
    vung: function () {
      var d = dot(), W = window.innerWidth, H = window.innerHeight, ra = {};
      [['giay', '.mc-vung-de'], ['bang', '.mc-cot-lam-bai']].forEach(function (v) { var e = d && d.querySelector ? d.querySelector(v[1]) : null, r = e ? e.getBoundingClientRect() : null; if (r && r.width > 0) ra[v[0]] = [r.left / W, r.top / H, r.right / W, r.bottom / H]; });
      return ra;
    }
  };
  so.doiTrang(String(chiSo()));
  veButCu();
`
