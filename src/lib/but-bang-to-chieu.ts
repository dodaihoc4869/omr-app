// BÚT VIẾT BẢNG TRÊN TỜ CHIẾU (thầy 10/11: «chỉnh phần bút viết cho mượt mà … viết bằng bút wacom lên phần bảng đen, nét bút mảnh vừa phải siêu đẹp»).
// Đoạn JS + CSS chèn vào tờ (len-bang-moi-to-chieu.ts, cùng phạm vi: body · tao · S · chiSo · veThanh). Tách tệp riêng vì cổng cỡ tệp.
// Bộ máy dựng nét: `but-bang-loi.ts` (vectơ chuẩn hoá, lọc 1€, đa giác bao). Tệp này lo phần MÀN:
//   · vào: Pointer Events + getCoalescedEvents (đủ mẫu Wacom ≥ 200 Hz) + getPredictedEvents (đoạn dự đoán, vẽ lại mỗi khung); bút dùng lực thật,
//     chuột / chạm giả lực theo vận tốc; đang có bút (hoặc bút vừa ở gần mặt bảng) thì bỏ qua chạm tay; đuôi bút Wacom = tẩy.
//   · ra: hai lớp canvas — lớp TĨNH (nét đã xong, vẽ lại từ vectơ khi đổi cỡ / hoàn tác / tẩy) và lớp SỐNG (chỉ nét đang viết, desynchronized);
//     một vòng requestAnimationFrame, handler không vẽ; nét dài thì phần đầu đã ổn định in dần xuống lớp tĩnh ⇒ mỗi khung chỉ dựng đoạn đuôi.
//   · nét giữ theo ĐỢT (khoá = chỉ số đợt): chuyển câu rồi quay lại vẫn còn, câu mới bảng sạch.
// API cho việc phát LIVE (chưa gửi đi đâu): window.__mcBut = { xuat, nhap, nghe, hoanTac, lamLai, xoaHet, bat, trang, loi, mau, co, vung } — sự kiện xem `SuKienBut`
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
`

export const JS_BUT_BANG = `
  // ── B · bút viết bảng (thầy 10/11) — bộ máy dựng nét: but-bang-loi.ts ──
${JS_LOI_BUT}
  var MAU_BUT = [['rgb(244,239,228)', 'Phấn trắng'], ['rgb(255,210,122)', 'Phấn vàng'], ['rgb(110,231,183)', 'Phấn xanh ngọc'], ['rgb(253,164,175)', 'Phấn hồng'], ['rgb(36,86,201)', 'Mực xanh (viết lên giấy đề)']];
  var CO_BUT = [[1.7, 'Nét mảnh', '.3em'], [2.3, 'Nét vừa', '.46em'], [3.4, 'Nét đậm', '.68em']];
  var PHIM_BUT = [['B', 'Bút viết bảng: phấn 4 màu, mực xanh, 3 cỡ nét'], ['E', 'Bút đang bật: đổi bút ↔ tẩy theo nét'], ['Ctrl + Z / Ctrl + Y', 'Bút đang bật: hoàn tác / làm lại']];
  var R_TAY = 15;
  S.mau = MAU_BUT[0][0]; S.co = CO_BUT[1][0];
  function nguCanh(c, song) { try { return c.getContext ? c.getContext('2d', song ? { desynchronized: true } : undefined) : null; } catch (e) { return null; } }
  var cvT = tao('canvas', 'mc-but', body), cv = tao('canvas', 'mc-but mc-but-song', body), butCu = tao('div', 'mc-but-cu', body);
  var gT = nguCanh(cvT, false), g2 = nguCanh(cv, true), so = LoiBut.taoSo(), KH = null, dpr = 1;
  // N = nét đang viết · XT = lượt kéo tẩy · ban = ô vừa vẽ trên lớp sống (để xoá đúng chỗ) · luotBut = lần cuối thấy bút (chặn chạm tay)
  var N = null, XT = null, ban = null, hRaf = 0, luotBut = -1e9, luotTro = -1e9, oThanh = null, hThanh = 0, nong = 0;
  butCu.setAttribute('role', 'toolbar'); butCu.setAttribute('aria-label', 'Bút viết bảng');

  function coCanvas() {
    var W = window.innerWidth, H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 3); KH = LoiBut.khung(W, H); ban = null;
    [cvT, cv].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    so.datTiLe(W / H); veLai();
    if (!nong) { nong = 1; lamNong(); }
  }
  // Làm nóng MỘT lần lúc bật bút (không phải giữa nét đầu tiên): cho máy dịch sẵn bộ dựng nét và cấp sẵn vùng nhớ hai lớp canvas.
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
  // Lớp tĩnh: vẽ lại MỌI nét của trang từ vectơ (đường bao nhớ theo tỉ lệ vùng viết ⇒ đổi cỡ cùng tỉ lệ / tẩy / hoàn tác không dựng lại).
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
  function xoaSong() { if (g2 && ban) { g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(ban[0], ban[1], ban[2], ban[3]); } ban = null; }
  function xaDiem(n) { if (n.moi.length) { so.themDiem(n.moi); n.moi = []; } }
  function hen() { if (!hRaf) hRaf = (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(khungVe); }
  // MỘT vòng vẽ: mỗi khung chỉ dựng lại đoạn đuôi của nét đang viết (+ đầu bút thật + đoạn dự đoán) trên lớp sống.
  function khungVe() {
    hRaf = 0;
    var n = N, p, i, s, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, den;
    if (!n || !g2) return;
    xaDiem(n);
    LoiBut.xuLyThem(n.st, n.net.diem, n.net.diem.length);
    den = LoiBut.mocDong(n.st, n.dong);
    if (den > 0) { toDaGiac(gT, LoiBut.vien(n.st, n.dong, den, null, false), n.net.mau); n.dong = den - 2; }
    xoaSong();
    p = LoiBut.vien(n.st, n.dong, -1, [[n.mx / KH.k, n.my / KH.k]].concat(n.dd), false);
    if (!p.length) return;
    toDaGiac(g2, p, n.net.mau);
    for (i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; }
    s = dpr * KH.k; ban = [Math.floor(x0 * s) - 3, Math.floor(y0 * s) - 3, Math.ceil((x1 - x0) * s) + 6, Math.ceil((y1 - y0) * s) + 6];
  }
  // Một mẫu vào (handler chỉ ghi điểm, không vẽ). chot = mẫu nhấc bút: giữ đúng chỗ dừng, không lấy lực của mẫu này.
  function mau(e, chot) {
    var n = N, x = e.clientX, y = e.clientY, t = e.timeStamp - n.t0, q = Math.sqrt((x - n.tx) * (x - n.tx) + (y - n.ty) * (y - n.ty)) / KH.k, ap = n.ap;
    n.mx = x; n.my = y;
    // nét đi vào dưới thanh bút ⇒ thanh mờ đi cho tới khi nhấc bút
    if (!n.che && oThanh && x > oThanh.left - 12 && x < oThanh.right + 12 && y > oThanh.top - 12 && y < oThanh.bottom + 12) { n.che = true; butCu.classList.add('mc-viet'); }
    if (q < (chot ? 0.05 : 0.35)) return;
    if (!chot) {
      if (n.loai === 'pen' && (n.coLuc || (e.pressure > 0 && e.pressure !== 0.5))) { n.coLuc = true; ap = e.pressure; }
      else ap = LoiBut.apLucGia(ap, q, t - n.tt);
    }
    n.ap = ap; n.tx = x; n.ty = y; n.tt = t;
    n.moi.push(LoiBut.diem(x, y, ap, t, KH.W, KH.H));
  }
  function ketNet(huy) {
    var n = N; if (!n) return;
    N = null; xaDiem(n); xoaSong();
    if (n.che) butCu.classList.remove('mc-viet');
    if (huy) { so.ketThuc(true); if (n.dong) veLai(); return; }
    LoiBut.xuLyThem(n.st, n.net.diem, n.net.diem.length);
    if (gT) toDaGiac(gT, LoiBut.vien(n.st, n.dong, -1, null, true), n.net.mau);
    so.ketThuc(); capNut();
  }
  // Tẩy theo NÉT: kéo qua nét nào thì cả nét đó mất; cả lượt kéo là MỘT bước hoàn tác.
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
    if (N && but && N.loai === 'touch') ketNet(true);
    if (N || XT) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    if (S.tay || (but && (e.buttons & 32))) { XT = { id: e.pointerId, x: e.clientX, y: e.clientY }; tayQua(XT.x, XT.y, XT.x, XT.y); return; }
    var ap = but && e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : but ? 0.12 : 0.3;
    N = { id: e.pointerId, loai: e.pointerType, coLuc: but && ap === e.pressure, t0: e.timeStamp, tt: 0, tx: e.clientX, ty: e.clientY, mx: e.clientX, my: e.clientY, ap: ap, moi: [], dd: [], dong: 0, net: null, st: null };
    N.net = so.batDau({ cong: 'but', mau: S.mau, co: S.co, diem: LoiBut.diem(e.clientX, e.clientY, ap, 0, KH.W, KH.H) });
    N.st = LoiBut.moXuLy(N.net, KH);
    hen();
  });
  cv.addEventListener('pointermove', function (e) {
    var ds, i;
    if (e.pointerType === 'pen') luotBut = e.timeStamp;
    if (XT && e.pointerId === XT.id) { tayQua(XT.x, XT.y, e.clientX, e.clientY); XT.x = e.clientX; XT.y = e.clientY; return; }
    if (!N) { if (S.but && KH && !XT && e.timeStamp - luotTro > 50) { luotTro = e.timeStamp; so.tro(e.clientX / KH.W, e.clientY / KH.H); } return; }
    if (e.pointerId !== N.id) return;
    ds = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (!ds || !ds.length) ds = [e];
    for (i = 0; i < ds.length; i++) mau(ds[i]);
    N.dd = e.getPredictedEvents ? e.getPredictedEvents().slice(0, 4).map(function (p) { return [p.clientX / KH.k, p.clientY / KH.k]; }) : [];
    hen();
  });
  // nút thân bút Wacom = chuột phải: đang cầm bút thì không bật trình đơn của trình duyệt giữa chừng
  cv.addEventListener('contextmenu', function (e) { if (S.but) e.preventDefault(); });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    cv.addEventListener(t, function (e) {
      if (XT && e.pointerId === XT.id) { XT = null; so.dongGop(); return; }
      if (!N || e.pointerId !== N.id) return;
      if (t === 'pointerup') mau(e, true);
      ketNet(t === 'pointercancel' && N.loai === 'touch');
    });
  });

  // ── thanh bút + con trỏ ──
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
  // Thanh bút nằm trên mép phải tấm giấy đề, sát cột bảng đen (không che thẻ tên em); tờ không có cột bảng ⇒ giữa mép trên như cũ.
  // Đo chỗ cột SO VỚI ĐỢT (đợt đang trượt vào vẫn ra đúng số), và đo lại một nhịp sau khi tờ xếp xong.
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
  // Con trỏ = chấm đúng màu, đúng cỡ nét (viền tối mảnh để thấy trên cả giấy lẫn bảng đen); đang tẩy = vòng tròn đúng cỡ tẩy.
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
  // Vào đợt: nét của đợt cũ cất lại, bảng hiện nét của đợt này (đợt chưa viết ⇒ bảng sạch).
  function butTrang() { ketNet(false); XT = null; so.doiTrang(String(chiSo())); veLai(); capNut(); henThanh(); }
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
    if (!S.but) { ketNet(false); XT = null; }
    body.classList.toggle('mc-co-but', S.but); veButCu(); veThanh();
  }
  // Phím CHỈ khi bút đang bật (không cướp phím nào của tờ lúc bút tắt): Ctrl + Z hoàn tác · Ctrl + Y / Ctrl + Shift + Z làm lại · E đổi bút ↔ tẩy.
  document.addEventListener('keydown', function (e) {
    if (!S.but || (e.target && e.target.closest && e.target.closest('input,textarea,select'))) return;
    var k = String(e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (c && (k === 'z' || k === 'y')) { e.preventDefault(); if (k === 'y' || e.shiftKey) lamLai(); else hoanTac(); }
    else if (!c && !e.altKey && k === 'e') { S.tay = !S.tay; veButCu(); }
  });
  window.addEventListener('resize', function () { if (KH) { ketNet(false); coCanvas(); conTro(); henThanh(); } });
  window.__mcBut = {
    xuat: function () { return so.xuat(); },
    nhap: function (goi) { if (!KH) coCanvas(); ketNet(false); var n = so.nhap(goi); veLai(); capNut(); return n; },
    nghe: so.nghe, trang: so.trang, hoanTac: hoanTac, lamLai: lamLai, xoaHet: xoaBut,
    bat: function (b) { if (!!b !== S.but) batBut(); },
    // cho việc live: bộ máy dựng nét, bảng màu / cỡ, và ô giấy đề / ô bảng đen của đợt đang chiếu tính theo vùng viết [x0, y0, x1, y1] (0..1)
    loi: LoiBut, mau: MAU_BUT, co: CO_BUT,
    vung: function () {
      var d = dot(), W = window.innerWidth, H = window.innerHeight, ra = {};
      [['giay', '.mc-vung-de'], ['bang', '.mc-cot-lam-bai']].forEach(function (v) { var e = d && d.querySelector ? d.querySelector(v[1]) : null, r = e ? e.getBoundingClientRect() : null; if (r && r.width > 0) ra[v[0]] = [r.left / W, r.top / H, r.right / W, r.bottom / H]; });
      return ra;
    }
  };
  so.doiTrang(String(chiSo()));
  veButCu();
`
