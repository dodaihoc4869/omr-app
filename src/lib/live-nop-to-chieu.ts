// LIVE THEO KHỐI — NÚT ỐNG NGHIỆM «AI ĐÃ NỘP» TRÊN MÀN CHIẾU (thầy 12/11, bản vẽ docs/ban-ve-live-moi-1211/19–22 đã duyệt «ok chốt build»).
// Thầy: «1 nút ống nghiệm nằm ở cạnh biểu tượng 4 cánh trên màn chiếu, khi học sinh gửi bài thì hiệu ứng xoắn ốc giống với màn điểm danh, khi bấm vào nút đó
// thì hiện danh sách hs nộp bài đúng hay sai và sắp xếp theo thứ tự nhanh nhất, có cả danh sách học sinh chưa nộp … chỉ hiện bên phía bảng đen viết và chỉ hiện
// ở lựa chọn Học».
//  · Dữ liệu: app gửi { nguon:'bpu-bang', lenh:'live-nop', so, phan, tong, nop:[[sbd, tên, màu đội, kq, giây, đáp án]…] (nhanh nhất trước), chua:[[sbd, tên, màu]…] }
//    (src/components/live/thay-noi.ts `guiNop`; kq 1 đúng · 0 sai · 2 không chấm tự động · 3 em báo «chưa biết làm»). so = 0 ⇒ ẩn nút (không ở Học / chưa có câu).
//  · CHỈ MÁY THẦY: tấm nằm trong tờ của thầy, không đi qua phòng ⇒ máy em không bao giờ nhận đúng / sai của bạn.
//  · Đoạn JS (ES5) chèn vào JS_LIVE_KHOI_TO_CHIEU (cùng phạm vi: LV · body · lvKhoi). Nút dựng LƯỜI lúc có dữ liệu đầu tiên (nút bốn ô #mc-them dựng sau đoạn live).
//  · Màu: chỉ biến sẵn có của tờ (--mc-*); màu đội do app đọc sẵn rồi gửi sang (tờ không có biến màu của app).
export const CSS_LIVE_NOP = `
.mc-nop-nut,.mc-nop-tam{--n:calc(var(--u)*1.26)}
.mc-nop-nut{position:relative;flex:none;display:inline-flex;align-items:center;gap:calc(var(--n)*.45);height:calc(var(--n)*2.1);margin-left:auto;padding:0 calc(var(--n)*.8) 0 calc(var(--n)*.5);border:0;border-radius:999px;background:linear-gradient(180deg,color-mix(in srgb,var(--mc-bang-chu) 12%,var(--mc-bang-nut)),var(--mc-bang-nut));box-shadow:inset 0 0 0 1px var(--mc-bang-vien),inset 0 1px 0 color-mix(in srgb,var(--mc-bang-chu) 22%,transparent);color:var(--mc-bang-chu);font:800 calc(var(--n)*.92)/1 var(--mc-sans);font-variant-numeric:tabular-nums;cursor:pointer;touch-action:manipulation}
.mc-nop-nut[hidden]{display:none!important}
body.mc .mc-thanh .mc-nop-nut:not([hidden])+.mc-td-them{margin-left:calc(var(--u)*.35)}
.mc-nop-nut small{font-weight:600;font-size:.8em;color:var(--mc-bang-phu)}
.mc-nop-nut>svg{flex:none;width:calc(var(--n)*.9);height:calc(var(--n)*1.5);overflow:visible}
.mc-nop-ong{fill:none;stroke:var(--mc-bang-chu);stroke-width:1.6;stroke-linecap:round}
.mc-nop-nut[aria-expanded="true"]{box-shadow:inset 0 0 0 1.5px var(--mc-vang-noi),0 0 0 calc(var(--n)*.18) color-mix(in srgb,var(--mc-vang-noi) 22%,transparent),0 0 calc(var(--n)*1.2) color-mix(in srgb,var(--mc-vang-noi) 38%,transparent)}
.mc-nop-vua{animation:mc-nop-sang 1.1s ease-out}
@keyframes mc-nop-sang{0%{box-shadow:inset 0 0 0 1.5px var(--mc-vang-noi),0 0 calc(var(--n)*1.6) color-mix(in srgb,var(--mc-vang-noi) 70%,transparent)}}
.mc-nop-tia{position:absolute;left:calc(var(--n)*-.4);bottom:50%;width:calc(var(--n)*2.2);height:calc(var(--n)*4.8);pointer-events:none}
.mc-nop-bao{position:absolute;right:0;bottom:calc(100% + var(--n)*1.1);display:flex;align-items:center;gap:.5em;padding:.45em .9em .45em .65em;border-radius:999px;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien),0 calc(var(--n)*.4) calc(var(--n)*1.2) color-mix(in srgb,var(--mc-den) 45%,transparent);font:700 calc(var(--n)*.84)/1.2 var(--mc-sans);white-space:nowrap;pointer-events:none;animation:mc-nop-bao 2.6s ease both}
.mc-nop-bao i,.mc-nop-ten i,.mc-nop-chua i{flex:none;width:.6em;height:.6em;border-radius:50%;background:var(--m,var(--mc-bang-phu))}
@keyframes mc-nop-bao{0%{opacity:0;transform:translateY(.5em)}12%,80%{opacity:1;transform:none}100%{opacity:0}}
.mc-nop-tam{position:fixed;z-index:44;display:flex;flex-direction:column;gap:calc(var(--n)*.7);padding:calc(var(--n)*1.1) calc(var(--n)*1.1) calc(var(--n)*.8);border-radius:calc(var(--n)*1.2);overflow:hidden;font-family:var(--mc-sans);color:var(--mc-bang-chu);background:radial-gradient(90% 55% at 12% 0%,color-mix(in srgb,var(--mc-vang-noi) 20%,transparent),transparent 70%),radial-gradient(90% 55% at 100% 100%,color-mix(in srgb,var(--mc-luc) 14%,transparent),transparent 70%),linear-gradient(165deg,color-mix(in srgb,var(--mc-bang-chu) 9%,var(--mc-bang-nut)),var(--mc-bang));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mc-bang-chu) 16%,transparent),inset 0 1px 0 color-mix(in srgb,var(--mc-bang-chu) 14%,transparent),0 calc(var(--n)*1.4) calc(var(--n)*3.6) color-mix(in srgb,var(--mc-den) 55%,transparent);animation:mc-nop-mo .22s ease-out}
.mc-nop-tam[hidden]{display:none}
@keyframes mc-nop-mo{from{opacity:0;transform:translateY(calc(var(--n)*.6)) scale(.985)}}
.mc-nop-dau{display:flex;align-items:flex-end;gap:calc(var(--n)*.6)}
.mc-nop-dau h2{margin:0;font-size:calc(var(--n)*1.3);font-weight:800;line-height:1.1}
.mc-nop-dau p{margin:.25em 0 0;font-size:calc(var(--n)*.8);font-weight:600;color:var(--mc-bang-phu)}
.mc-nop-so{margin-left:auto;font-size:calc(var(--n)*1.9);font-weight:800;line-height:1;color:var(--mc-vang-noi);font-variant-numeric:tabular-nums}
.mc-nop-so small{font-size:.5em;color:var(--mc-bang-phu);font-weight:700}
.mc-nop-ti{flex:none;display:flex;height:calc(var(--n)*.5);border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--mc-bang-chu) 10%,transparent)}
.mc-nop-ti i{display:block;height:100%;transition:width .3s}
.mc-nop-ti .d,.mc-nop-kq.d{--k:var(--mc-luc)}.mc-nop-ti .s,.mc-nop-kq.s{--k:var(--mc-do)}
.mc-nop-ti i{background:var(--k)}
.mc-nop-chu{display:flex;gap:calc(var(--n)*.9);font-size:calc(var(--n)*.8);font-weight:700;margin-top:calc(var(--n)*-.25)}
.mc-nop-chu .d{color:color-mix(in srgb,var(--mc-luc) 70%,var(--mc-bang-chu))}.mc-nop-chu .s{color:color-mix(in srgb,var(--mc-do) 70%,var(--mc-bang-chu))}.mc-nop-chu span{margin-left:auto;color:var(--mc-bang-phu);font-weight:600}
.mc-nop-nhan{display:flex;align-items:center;gap:.6em;font-size:calc(var(--n)*.74);letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--mc-bang-phu)}
.mc-nop-nhan::after{content:"";flex:1;height:1px;background:color-mix(in srgb,var(--mc-bang-chu) 12%,transparent)}
.mc-nop-cuon{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:calc(var(--n)*.7);scrollbar-width:thin}
.mc-nop-ds{display:flex;flex-direction:column;gap:calc(var(--n)*.35)}
.mc-nop-em{display:grid;grid-template-columns:auto 1fr auto auto auto;align-items:center;gap:calc(var(--n)*.5);padding:calc(var(--n)*.42) calc(var(--n)*.6);border-radius:calc(var(--n)*.7);background:color-mix(in srgb,var(--mc-bang-chu) 6%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mc-bang-chu) 8%,transparent);font-size:calc(var(--n)*.96);font-weight:700}
.mc-nop-em.nhat{background:linear-gradient(90deg,color-mix(in srgb,var(--mc-vang-noi) 22%,transparent),color-mix(in srgb,var(--mc-bang-chu) 5%,transparent));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mc-vang-noi) 50%,transparent)}
.mc-nop-hang{display:grid;place-items:center;width:1.55em;height:1.55em;border-radius:50%;font-size:.76em;background:color-mix(in srgb,var(--mc-bang-chu) 12%,transparent);color:var(--mc-bang-phu)}
.mc-nop-em.nhat .mc-nop-hang{background:var(--mc-vang-noi);color:var(--mc-bang)}
.mc-nop-ten{display:flex;align-items:center;gap:.45em;min-width:0;overflow-wrap:anywhere;line-height:1.2}
.mc-nop-gio{font-size:.84em;font-weight:600;color:var(--mc-bang-phu);font-variant-numeric:tabular-nums}
.mc-nop-chon{min-width:1.7em;padding:.1em .45em;border-radius:.45em;text-align:center;font-size:.84em;background:color-mix(in srgb,var(--mc-bang-chu) 12%,transparent)}
.mc-nop-chon.kb{font-weight:600;color:var(--mc-bang-phu)}
.mc-nop-kq{display:grid;place-items:center;width:1.5em;height:1.5em;border-radius:50%;background:color-mix(in srgb,var(--k,transparent) 22%,transparent);color:color-mix(in srgb,var(--k,transparent) 75%,var(--mc-bang-chu))}
.mc-nop-kq svg{width:60%;height:60%;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.mc-nop-chua{display:block;margin-bottom:calc(var(--n)*-.35)}
.mc-nop-chua span{display:inline-flex;align-items:center;gap:.45em;margin:0 calc(var(--n)*.35) calc(var(--n)*.35) 0;padding:.3em .75em;border-radius:999px;border:1px dashed color-mix(in srgb,var(--mc-bang-chu) 24%,transparent);font-size:calc(var(--n)*.86);font-weight:600;color:var(--mc-bang-phu)}
.mc-nop-rong{margin:auto;text-align:center;font-size:calc(var(--n)*1);font-weight:700}
.mc-nop-rong small{display:block;margin-top:.4em;font-size:.8em;font-weight:600;color:var(--mc-bang-phu)}
.mc-nop-chan{flex:none;font-size:calc(var(--n)*.72);font-weight:600;text-align:center;color:var(--mc-bang-phu)}
body.mc-che-bang .mc-nop-nut,body.mc-che-bang .mc-nop-tam{display:none!important}
@media (prefers-reduced-motion:reduce){.mc-nop-tam,.mc-nop-vua,.mc-nop-bao{animation:none}}
`

export const JS_LIVE_NOP = `
  var NOP = { d: null, mo: false, nut: null, tam: null, da: null, so: -1, raf: 0 };
  function nopT(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'; }); }
  function nopMau(m) { m = String(m || '').trim(); return m && /^[#a-z0-9(),.% -]+$/i.test(m) ? ' style="--m:' + m + '"' : ''; }
  function nopGio(g) { g = Math.max(0, Math.round(+g || 0)); return Math.floor(g / 60) + ':' + (g % 60 < 10 ? '0' : '') + (g % 60); }
  function nopChon(c, phan) { c = String(c || ''); return phan === 'II' ? c.replace(/D/g, 'Đ') : c; }
  function nopNut() {
    var t = document.getElementById('mc-them'), n = NOP.nut;
    if (n || !t || !t.parentNode) return n;
    n = NOP.nut = document.createElement('button'); n.type = 'button'; n.id = 'mc-nop'; n.className = 'mc-nop-nut'; n.hidden = true;
    n.setAttribute('aria-expanded', 'false'); n.title = 'Ai đã nộp — chỉ máy thầy thấy';
    n.innerHTML = '<canvas class="mc-nop-tia" width="66" height="144" aria-hidden="true"></canvas>'
      + '<svg viewBox="0 0 18 30" aria-hidden="true"><defs><linearGradient id="mc-nop-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--mc-vang-noi)"/><stop offset="1" style="stop-color:var(--mc-do)"/></linearGradient><clipPath id="mc-nop-c"><path d="M4 2V22a5 5 0 0 0 10 0V2Z"/></clipPath></defs>'
      + '<g clip-path="url(#mc-nop-c)"><rect class="mc-nop-muc" x="0" y="26" width="18" height="30" fill="url(#mc-nop-g)"/></g><path class="mc-nop-ong" d="M4 2V22a5 5 0 0 0 10 0V2M2.4 2H15.6"/></svg><b>0/0</b><small>đã nộp</small>';
    t.parentNode.insertBefore(n, t);
    n.addEventListener('click', function () { nopMo(!NOP.mo); });
    window.addEventListener('resize', nopCho);
    document.addEventListener('mc-vao-dot', function () { setTimeout(nopCho, 60); });
    return n;
  }
  // Tia lửa XOẮN ỐC từ đáy ống lên quá miệng (như ống nghiệm của màn điểm danh) mỗi khi một em gửi. Máy yếu / giảm chuyển động ⇒ chỉ nháy viền.
  function nopTia() {
    var n = NOP.nut, c = n && n.querySelector('canvas'), x, t0 = 0, mau, lang;
    if (!n) return;
    n.classList.remove('mc-nop-vua'); void n.offsetWidth; n.classList.add('mc-nop-vua');
    lang = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('may-yeu');
    if (lang || !c || !c.getContext || !window.requestAnimationFrame) return;
    x = c.getContext('2d'); if (!x) return;
    mau = String(getComputedStyle(n).getPropertyValue('--mc-vang-noi') || '').trim(); if (mau) x.fillStyle = mau;
    cancelAnimationFrame(NOP.raf);
    function ve(ts) {
      var W = c.width, H = c.height, p, i, q, a;
      if (!t0) t0 = ts;
      p = Math.min(1, (ts - t0) / 1000);
      x.clearRect(0, 0, W, H);
      for (i = 0; i < 30; i++) {
        q = p - i * 0.014; if (q < 0) break;
        a = (1 - i / 30) * (p < 0.82 ? 1 : (1 - p) / 0.18);
        x.globalAlpha = Math.max(0, a);
        x.beginPath(); x.arc(W / 2 + Math.sin(q * Math.PI * 5) * W * 0.3 * (1 - q * 0.45), H - 10 - q * (H - 24), i ? 2.6 * (1 - i / 34) : 4.4, 0, 6.3); x.fill();
      }
      x.globalAlpha = 1;
      if (p < 1) NOP.raf = requestAnimationFrame(ve); else x.clearRect(0, 0, W, H);
    }
    NOP.raf = requestAnimationFrame(ve);
  }
  function nopBao(e) {
    var n = NOP.nut, b;
    if (!n || NOP.mo) return;
    b = n.querySelector('.mc-nop-bao'); if (b) b.remove();
    b = document.createElement('span'); b.className = 'mc-nop-bao';
    b.innerHTML = '<i' + nopMau(e[2]) + '></i>' + nopT(e[1]) + ' vừa gửi · ' + nopGio(e[4]);
    n.appendChild(b); setTimeout(function () { if (b.parentNode) b.remove(); }, 2600);
  }
  // Tấm CHỈ phủ cột bảng đen của đợt đang chiếu (giấy đề giữ nguyên). Tờ lạ không có cột bảng ⇒ một phần ba bên phải.
  function nopCho() {
    var t = NOP.tam, d, c, r, th, day;
    if (!t || t.hidden) return;
    d = window.__mcDot ? window.__mcDot() : null; c = d ? d.querySelector('.mc-cot-lam-bai') : null; r = c ? c.getBoundingClientRect() : null;
    th = document.querySelector('.mc-thanh'); day = th ? th.getBoundingClientRect().top : window.innerHeight;
    if (!r || r.width < 160) r = { left: window.innerWidth * 0.668, top: 8, width: window.innerWidth * 0.332 - 8 };
    t.style.left = Math.round(r.left) + 'px'; t.style.top = Math.round(Math.max(6, r.top)) + 'px'; t.style.width = Math.round(r.width) + 'px';
    t.style.height = Math.round(Math.max(120, day - 8 - Math.max(6, r.top))) + 'px';
  }
  function nopMo(v) {
    var n = NOP.nut;
    NOP.mo = !!v && !!NOP.d && !!NOP.d.so;
    if (n) n.setAttribute('aria-expanded', NOP.mo ? 'true' : 'false');
    if (NOP.mo && !NOP.tam) { NOP.tam = document.createElement('section'); NOP.tam.className = 'mc-nop-tam'; NOP.tam.id = 'mc-nop-tam'; NOP.tam.setAttribute('aria-label', 'Ai đã nộp'); body.appendChild(NOP.tam); }
    if (NOP.tam) NOP.tam.hidden = !NOP.mo;
    if (NOP.mo) { nopVeTam(); nopCho(); }
  }
  function nopVeTam() {
    var d = NOP.d, t = NOP.tam, h, i, e, dung = 0, sai = 0, cuon, giu;
    if (!d || !t || t.hidden) return;
    for (i = 0; i < d.nop.length; i++) { if (d.nop[i][3] === 1) dung++; else if (d.nop[i][3] === 0) sai++; }
    h = '<div class="mc-nop-dau"><div><h2>Ai đã nộp</h2><p>Xếp theo em gửi nhanh nhất</p></div><div class="mc-nop-so">' + d.nop.length + '<small>/' + d.tong + '</small></div></div>'
      + '<div class="mc-nop-ti"><i class="d" style="width:' + (d.tong ? 100 * dung / d.tong : 0) + '%"></i><i class="s" style="width:' + (d.tong ? 100 * sai / d.tong : 0) + '%"></i></div>'
      + '<div class="mc-nop-chu"><b class="d">' + dung + ' đúng</b><b class="s">' + sai + ' sai</b><span>' + d.chua.length + ' em chưa nộp</span></div><div class="mc-nop-cuon">';
    if (!d.nop.length) h += '<div class="mc-nop-rong">Chưa em nào gửi đáp án<small>Em nào gửi là hiện ngay ở đây, nhanh nhất đứng đầu.</small></div>';
    else {
      h += '<div class="mc-nop-nhan">Đã nộp · ' + d.nop.length + '</div><div class="mc-nop-ds">';
      for (i = 0; i < d.nop.length; i++) {
        e = d.nop[i];
        h += '<div class="mc-nop-em' + (i ? '' : ' nhat') + '" data-sbd="' + nopT(e[0]) + '"><span class="mc-nop-hang">' + (i + 1) + '</span><span class="mc-nop-ten"><i' + nopMau(e[2]) + '></i>' + nopT(e[1]) + '</span><span class="mc-nop-gio">' + nopGio(e[4]) + '</span>'
          + (e[3] === 3 ? '<span class="mc-nop-chon kb">chưa biết làm</span><span></span>' : (e[5] ? '<b class="mc-nop-chon">' + nopT(nopChon(e[5], d.phan)) + '</b>' : '<span></span>')
            + (e[3] === 1 ? '<span class="mc-nop-kq d" title="Đúng"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 5"/></svg></span>' : e[3] === 0 ? '<span class="mc-nop-kq s" title="Sai"><svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg></span>' : '<span></span>')) + '</div>';
      }
      h += '</div>';
    }
    if (d.chua.length) {
      h += '<div class="mc-nop-nhan">Chưa nộp · ' + d.chua.length + '</div><div class="mc-nop-chua">';
      for (i = 0; i < d.chua.length; i++) h += '<span data-sbd="' + nopT(d.chua[i][0]) + '"><i' + nopMau(d.chua[i][2]) + '></i>' + nopT(d.chua[i][1]) + '</span>';
      h += '</div>';
    }
    cuon = t.querySelector('.mc-nop-cuon'); giu = cuon ? cuon.scrollTop : 0;
    t.innerHTML = h + '</div><div class="mc-nop-chan">Chỉ máy thầy thấy · bấm ống nghiệm lần nữa để đóng</div>';
    cuon = t.querySelector('.mc-nop-cuon'); if (cuon && giu) cuon.scrollTop = giu;
  }
  function lvNop(m) {
    var n, d, i, moi = null, muc, da = {};
    NOP.d = d = m && m.so && m.nop && m.chua ? { so: +m.so, phan: String(m.phan || ''), tong: +m.tong || 0, nop: m.nop, chua: m.chua } : null;
    n = nopNut();
    if (!n) { if (d) setTimeout(function () { if (NOP.d === d) lvNop(m); }, 300); return; }
    if (!d) { n.hidden = true; NOP.so = -1; NOP.da = null; nopMo(false); return; }
    n.hidden = false;
    n.querySelector('b').textContent = d.nop.length + '/' + d.tong;
    muc = n.querySelector('.mc-nop-muc'); if (muc) muc.setAttribute('y', String(26 - 20 * (d.tong ? Math.min(1, d.nop.length / d.tong) : 0)));
    for (i = 0; i < d.nop.length; i++) { da[d.nop[i][0]] = 1; if (NOP.da && NOP.so === d.so && !NOP.da[d.nop[i][0]] && (!moi || d.nop[i][4] > moi[4])) moi = d.nop[i]; }
    NOP.da = da; NOP.so = d.so;
    if (moi) { nopTia(); nopBao(moi); }
    if (NOP.mo) nopVeTam();
  }
`
