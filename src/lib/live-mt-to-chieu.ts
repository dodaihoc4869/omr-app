// NÚT MÁY TÍNH trên thanh đáy của tờ chiếu (thầy 12/11, bản vẽ docs/ban-ve-live-moi-1211/31–34): nút tròn đứng TRƯỚC ống nghiệm «Ai đã nộp» và nút
// bốn ô. Chỉ có ở buổi LIVE THEO KHỐI. Bấm ⇒ báo app (việc lk, v = 'mt') ⇒ app hiện / ẩn máy tính «Đỗ Đại Học FX4869» nổi trên màn chiếu và đồng bộ
// sang máy em; app báo lại trạng thái bằng lệnh live-mt để nút sáng vàng khi máy tính đang hiện. Máy tính KHÔNG nằm trong tờ (tờ chỉ có cái nút).
export const CSS_LIVE_MT = `
/* VIÊN LIVE GỌN (thầy 13/11: «thanh màu đỏ làm cho gọn lại, toàn bộ thanh chờ dưới làm cho gọn lại đẹp mắt hơn tinh tế hơn»): chỉ ô «LIVE giờ» còn đỏ, các ô còn lại
   (số em xem · số em nghe · mức mic · đang ghi) thành biểu tượng + số trên nền tối, thấp hơn, chữ nhỏ hơn. Trạng thái vàng (.vang) giữ nguyên. */
body.mc .mc-thanh .mc-lv-cum:not(.vang){min-height:calc(var(--u)*2.2);background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);font-size:max(12px,calc(var(--u)*.98));font-weight:700}
.mc-lv-cum:not(.vang)>span{padding:0 .55em;gap:.32em}
.mc-lv-cum:not(.vang)>span+span{box-shadow:none}
.mc-lv-cum:not(.vang)>span:first-child{margin:.2em .1em .2em .2em;padding:0 .7em;border-radius:999px;background:var(--mc-do);font-weight:800}
.mc-lv-cum:not(.vang)>span:last-child{padding-right:.8em}
.mc-lv-cum:not(.vang) svg{width:1.08em;height:1.08em;opacity:.78}
.mc-lv-cum:not(.vang) small{opacity:.6;margin-left:-.22em}
.mc-lv-cum>span.ghi{color:color-mix(in srgb,var(--mc-bang-chu) 76%,transparent)}
.mc-lv-cum>span.ghi i.cham{width:.5em;height:.5em;background:var(--mc-do)}
.mc-mt-nut{--n:calc(var(--u)*1.26);flex:none;display:inline-grid;place-items:center;width:calc(var(--n)*2.1);height:calc(var(--n)*2.1);margin-left:auto;padding:0;border:0;border-radius:50%;background:linear-gradient(180deg,color-mix(in srgb,var(--mc-bang-chu) 12%,var(--mc-bang-nut)),var(--mc-bang-nut));box-shadow:inset 0 0 0 1px var(--mc-bang-vien),inset 0 1px 0 color-mix(in srgb,var(--mc-bang-chu) 22%,transparent);color:var(--mc-bang-chu);cursor:pointer;touch-action:manipulation}
.mc-mt-nut[hidden]{display:none!important}
.mc-mt-nut svg{width:54%;height:54%;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
.mc-mt-nut[aria-pressed="true"]{background:var(--mc-vang-noi);color:var(--mc-thanh2);box-shadow:0 0 0 calc(var(--n)*.16) color-mix(in srgb,var(--mc-vang-noi) 22%,transparent),0 0 calc(var(--n)*1.1) color-mix(in srgb,var(--mc-vang-noi) 45%,transparent)}
body.mc .mc-thanh .mc-mt-nut:not([hidden])~.mc-nop-nut{margin-left:calc(var(--u)*.35)}
body.mc .mc-thanh .mc-mt-nut:not([hidden])~.mc-td-them{margin-left:calc(var(--u)*.35)}
body.mc.mc-che-bang .mc-khay-nhom.mc-khay-luat{display:flex}
.mc-luat{display:flex;align-items:center;gap:calc(var(--u)*.6);width:100%;box-sizing:border-box;padding:calc(var(--u)*.55) calc(var(--u)*.7);border-radius:calc(var(--u)*.8);box-shadow:inset 0 0 0 1.5px var(--mc-bang-vien);color:var(--mc-bang-chu)}
.mc-luat.mc-bat{background:color-mix(in srgb,var(--mc-do) 12%,transparent);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--mc-do) 60%,transparent)}
.mc-luat-ten{flex:1;min-width:0}
.mc-luat-ten b{display:block;font:800 calc(var(--u)*.95)/1.2 var(--mc-sans)}
.mc-luat-ten small{display:block;margin-top:calc(var(--u)*.15);font:600 calc(var(--u)*.74)/1.3 var(--mc-sans);color:var(--mc-bang-phu)}
.mc-luat-buoc{flex:none;display:flex;align-items:center;gap:calc(var(--u)*.25);font:800 calc(var(--u)*.95)/1 var(--mc-sans)}
.mc-luat-buoc output{min-width:calc(var(--u)*3);text-align:center}
.mc-luat-buoc button{width:calc(var(--u)*1.9);height:calc(var(--u)*1.9);padding:0;border:0;border-radius:calc(var(--u)*.55);background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-chu);font:inherit;cursor:pointer}
.mc-luat-cong{position:relative;flex:none;width:calc(var(--u)*3.3);height:calc(var(--u)*1.9);padding:0;border:0;border-radius:999px;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);cursor:pointer}
.mc-luat-cong::after{content:"";position:absolute;left:calc(var(--u)*.2);top:calc(var(--u)*.2);width:calc(var(--u)*1.5);height:calc(var(--u)*1.5);border-radius:50%;background:var(--mc-bang-phu);transition:transform .15s}
.mc-luat-cong[aria-checked="true"]{background:var(--mc-do);box-shadow:none}
.mc-luat-cong[aria-checked="true"]::after{transform:translateX(calc(var(--u)*1.4));background:var(--mc-bang-chu)}
`
export const JS_LIVE_MT = `
  var MT = { nut: null, mo: false, thu: 0 };
  function mtNut() {
    var t = document.getElementById('mc-them'), n = MT.nut, truoc;
    if (n) return n;
    if (!(LV.tt && LV.tt.khoi)) return null;
    if (!t || !t.parentNode) { if (MT.thu++ < 20) setTimeout(mtNut, 300); return null; }
    n = MT.nut = document.createElement('button'); n.type = 'button'; n.id = 'mc-mt'; n.className = 'mc-mt-nut';
    n.title = 'Máy tính — bấm để hiện, bấm lần nữa để ẩn'; n.setAttribute('aria-label', 'Máy tính'); n.setAttribute('aria-pressed', MT.mo ? 'true' : 'false');
    n.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.8" width="14" height="18.4" rx="2.6"/><rect x="8" y="5.8" width="8" height="3.6" rx="1"/><path d="M8.4 13h.1M12 13h.1M15.6 13h.1M8.4 16.6h.1M12 16.6h.1M15.6 16.6h.1"/></svg>';
    truoc = document.getElementById('mc-nop') || t;
    t.parentNode.insertBefore(n, truoc);
    n.addEventListener('click', function () { lvGui('lk', { v: 'mt' }); });
    return n;
  }
  // LUẬT «RỜI MÀN N LẦN ⇒ BỊ MỜI RA» (thầy 13/11, bản vẽ 48): một hàng trong khay nút bốn ô — công tắc bật / tắt + nút − / + chỉnh số lần (1–9).
  // Bấm ⇒ báo app (việc lk, v = 'luat:<0|1>:<số lần>') ⇒ app gửi phòng; phòng đổi ⇒ app báo lại bằng lệnh live-luat.
  var LU = { g: null, bat: false, n: 3 };
  function luVe() {
    var k = document.getElementById('mc-khay'), g = LU.g, lk, c;
    if (!k || !(LV.tt && LV.tt.khoi)) return;
    if (!g) {
      g = LU.g = document.createElement('div'); g.className = 'mc-khay-nhom mc-khay-luat'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Luật của buổi');
      g.innerHTML = '<span class="mc-khay-ten" aria-hidden="true">Luật của buổi</span><div class="mc-luat"><span class="mc-luat-ten"><b>Rời màn bị mời ra</b><small>Em rời app đủ số lần thì ra khỏi lớp, xin vào lại phải chờ thầy duyệt</small></span>'
        + '<span class="mc-luat-buoc"><button type="button" data-lu="-" aria-label="Giảm số lần">−</button><output></output><button type="button" data-lu="+" aria-label="Tăng số lần">+</button></span><button type="button" class="mc-luat-cong" data-lu="bat" role="switch"></button></div>';
      g.addEventListener('click', function (e) {
        var n = e.target.closest ? e.target.closest('[data-lu]') : null, v = n ? n.getAttribute('data-lu') : '';
        e.stopPropagation(); // khay không tự đóng khi thầy đang chỉnh số lần / gạt công tắc
        if (!v) return;
        if (v === 'bat') LU.bat = !LU.bat; else LU.n = Math.max(1, Math.min(9, LU.n + (v === '+' ? 1 : -1)));
        luVe(); lvGui('lk', { v: 'luat:' + (LU.bat ? 1 : 0) + ':' + LU.n });
      });
      lk = k.querySelector('.mc-khay-lk');
      if (lk && lk.nextSibling) k.insertBefore(g, lk.nextSibling); else if (lk) k.appendChild(g); else k.insertBefore(g, k.firstChild);
    }
    g.querySelector('output').textContent = LU.n + ' lần';
    c = g.querySelector('.mc-luat-cong'); c.setAttribute('aria-checked', LU.bat ? 'true' : 'false'); c.setAttribute('aria-label', LU.bat ? 'Tắt luật rời màn' : 'Bật luật rời màn');
    g.querySelector('.mc-luat').className = 'mc-luat' + (LU.bat ? ' mc-bat' : '');
  }
  // khay được dựng / mở muộn ⇒ mỗi lần khay mở thì soát lại hàng luật
  if (window.MutationObserver) new MutationObserver(function () { if (document.body.classList.contains('mc-khay-mo')) luVe(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('message', function (e) {
    var m = e.data, n;
    if (!m || m.nguon !== 'bpu-bang' || e.source !== dichApp()) return;
    if (m.lenh === 'live-tt') { setTimeout(mtNut, 0); setTimeout(luVe, 0); return; }
    if (m.lenh === 'live-luat') { LU.bat = m.bat === true; if (LU.bat && +m.n) LU.n = +m.n; luVe(); return; }
    if (m.lenh !== 'live-mt') return;
    MT.mo = m.mo === true; n = mtNut(); if (n) n.setAttribute('aria-pressed', MT.mo ? 'true' : 'false');
  });
  // PHÍM / (thầy 12/11): hỏi nhanh cả lớp «Hiểu chưa?» — báo app (việc lk, v = 'hieu'); bấm lần nữa là đóng. Đang gõ chữ thì / vẫn là chữ.
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.repeat || !(LV.tt && LV.tt.khoi) || (t && t.closest && t.closest('input,textarea,select,[contenteditable]'))) return;
    e.preventDefault(); e.stopImmediatePropagation(); lvGui('lk', { v: 'hieu' });
  }, true);
`
