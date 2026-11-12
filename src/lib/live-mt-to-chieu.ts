// NÚT MÁY TÍNH trên thanh đáy của tờ chiếu (thầy 12/11, bản vẽ docs/ban-ve-live-moi-1211/31–34): nút tròn đứng TRƯỚC ống nghiệm «Ai đã nộp» và nút
// bốn ô. Chỉ có ở buổi LIVE THEO KHỐI. Bấm ⇒ báo app (việc lk, v = 'mt') ⇒ app hiện / ẩn máy tính «Đỗ Đại Học FX4869» nổi trên màn chiếu và đồng bộ
// sang máy em; app báo lại trạng thái bằng lệnh live-mt để nút sáng vàng khi máy tính đang hiện. Máy tính KHÔNG nằm trong tờ (tờ chỉ có cái nút).
export const CSS_LIVE_MT = `
.mc-mt-nut{--n:calc(var(--u)*1.26);flex:none;display:inline-grid;place-items:center;width:calc(var(--n)*2.1);height:calc(var(--n)*2.1);margin-left:auto;padding:0;border:0;border-radius:50%;background:linear-gradient(180deg,color-mix(in srgb,var(--mc-bang-chu) 12%,var(--mc-bang-nut)),var(--mc-bang-nut));box-shadow:inset 0 0 0 1px var(--mc-bang-vien),inset 0 1px 0 color-mix(in srgb,var(--mc-bang-chu) 22%,transparent);color:var(--mc-bang-chu);cursor:pointer;touch-action:manipulation}
.mc-mt-nut[hidden]{display:none!important}
.mc-mt-nut svg{width:54%;height:54%;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
.mc-mt-nut[aria-pressed="true"]{background:var(--mc-vang-noi);color:var(--mc-thanh2);box-shadow:0 0 0 calc(var(--n)*.16) color-mix(in srgb,var(--mc-vang-noi) 22%,transparent),0 0 calc(var(--n)*1.1) color-mix(in srgb,var(--mc-vang-noi) 45%,transparent)}
body.mc .mc-thanh .mc-mt-nut:not([hidden])~.mc-nop-nut{margin-left:calc(var(--u)*.35)}
body.mc .mc-thanh .mc-mt-nut:not([hidden])~.mc-td-them{margin-left:calc(var(--u)*.35)}
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
  window.addEventListener('message', function (e) {
    var m = e.data, n;
    if (!m || m.nguon !== 'bpu-bang' || e.source !== dichApp()) return;
    if (m.lenh === 'live-tt') { setTimeout(mtNut, 0); return; }
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
