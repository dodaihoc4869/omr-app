/* ============================================================
   LÕI: tiện ích, trạng thái, đầu trang, 4 nhịp, máy soi bẫy
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const GOAL = 6;

function U(s) { const d = '₀₁₂₃₄₅₆₇₈₉'; return String(s).replace(/([A-Za-z\)])(\d+)/g, (m, a, n) => a + n.split('').map(c => d[+c]).join('')); }
function F(s) { return String(s).replace(/([A-Za-z\)\]])(\d+)/g, '$1<sub>$2</sub>'); }
function fx(s) { return String(s).replace(/\{([^{}]+)\}/g, (m, a) => F(a)); }
function vn(x, d = 2) { const k = Math.pow(10, d); return (Math.round(x * k) / k).toFixed(d).replace('.', ','); }
function vnt(x) { return String(x).replace('.', ','); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function icon(id, cls = '') { return `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`; }
function keyChip(k, extra = '') { const K = KEYS[k]; return `<button class="kchip" type="button" data-open="${k}" style="--kc:var(${K.cv})" ${extra}>${icon(K.ic)}${K.ten}</button>`; }

/* ---------- trạng thái (chỉ lưu trên máy) ---------- */
const STORE = 'ester-lab-v2';
let S = { lv: 'vung', ans: {}, gan: {}, hint: {}, mc: {}, xp: {k1:0,k2:0,k3:0,k4:0,k5:0,k6:0}, streak: 0, best: 0 };
function load() { try { const o = JSON.parse(localStorage.getItem(STORE) || 'null'); if (o) { S = Object.assign(S, o); S.xp = Object.assign({k1:0,k2:0,k3:0,k4:0,k5:0,k6:0}, o.xp || {}); } } catch (e) {} }
function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
// GĐ1 v2 (02/10): báo từng thao tác lên trang mẹ (chỉ postMessage — khung vẫn không gọi mạng). Trang mẹ gom rồi gửi máy chủ khi đóng.
function bao(kieu, ct) { try { parent.postMessage(Object.assign({ loai: 'khung-su-kien', kieu: kieu }, ct || {}), '*'); } catch (e) {} }
function addXP(k) { if (!S.xp[k] && S.xp[k] !== 0) return; S.xp[k] = Math.min(GOAL, S.xp[k] + 1); save(); paintXP(); }
function paintXP() {
  const pips = $('#pips');
  if (pips) pips.innerHTML = Object.keys(KEYS).map(k => { const p = S.xp[k] / GOAL * 100; return `<span class="pip ${p >= 100 ? 'full' : ''}" style="--kc:var(${KEYS[k].cv});--p:${p}%" title="${KEYS[k].ten}: ${S.xp[k]}/${GOAL}">${icon(KEYS[k].ic)}</span>`; }).join('');
  $$('.key').forEach(b => { const k = b.dataset.k; const bar = b.querySelector('.kbar i'); if (bar) bar.style.setProperty('--p', (S.xp[k] / GOAL * 100) + '%'); const m = b.querySelector('.kxp'); if (m) m.textContent = `${S.xp[k]}/${GOAL}`; });
}

/* ---------- trình độ ---------- */
const LV = { nen: 'Nền tảng', vung: 'Vững', but: 'Bứt phá' };
function setLevel(lv, rerender = true) {
  S.lv = lv; save();
  $$('.lv').forEach(b => b.classList.toggle('on', b.dataset.lv === lv));
  $('#lvlName').textContent = LV[lv];
  if (rerender && typeof rerenderQuestions === 'function') rerenderQuestions();
}

/* ---------- pháo giấy nhỏ khi đúng ---------- */
function burst(x, y) {
  if (RM) return;
  const cols = ['--ester', '--k1', '--k6', '--k5', '--acid'];
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('i');
    d.className = 'burst';
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 70;
    d.style.cssText = `left:${x}px;top:${y}px;background:var(${pick(cols)});--bx:${Math.cos(a) * r}px;--by:${Math.sin(a) * r - 30}px;--br:${Math.random() * 540}deg`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 950);
  }
}

/* ============================================================
   HOẠT HOẠ ĐẦU TRANG (canvas): bộ chưng cất, nước sinh hàn ngược dòng
   ============================================================ */
function heroCanvas() {
  const cv = $('#heroCanvas'), stage = $('#heroStage');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const VW = 600, VH = 520;
  let W = 0, H = 0, dpr = 1, sc = 1, ox = 0, oy = 0, C = {}, visible = true, last = 0, raf = 0;
  const fl = { cx: 175, cy: 352, r: 80, nw: 14, top: 176, lvl: 372 };
  const P0 = { x: 236, y: 206 }, P1 = { x: 470, y: 334 }, P2 = { x: 500, y: 372 };
  const dx = P1.x - P0.x, dy = P1.y - P0.y, L = Math.hypot(dx, dy), d = { x: dx / L, y: dy / L }, n = { x: -d.y, y: d.x };
  const rc = { x: 505, mouth: 384, neck: 402, base: 486, hw: 54 };
  let rLevel = 0;
  const vapor = [], bubbles = [], water = [], tags = [];
  const TAGS = [['isoamyl acetate', 'chuối', '--ester'], ['methyl salicylate', 'dầu gió xanh', '--k1'], ['methyl cinnamate', 'dâu tây', '--k6'], ['ethyl butanoate', 'dứa', '--acid'], ['benzyl acetate', 'hoa nhài', '--alc']];
  const path = [{ x: fl.cx, y: fl.lvl }, { x: fl.cx, y: 206 }, { x: P0.x, y: P0.y }, { x: P1.x, y: P1.y }, { x: P2.x, y: P2.y }];
  const seg = []; let tot = 0;
  for (let i = 0; i < path.length - 1; i++) { const l = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y); seg.push(l); tot += l; }
  const condStart = seg[0] + seg[1];
  function at(s) { let i = 0; while (i < seg.length && s > seg[i]) { s -= seg[i]; i++; } if (i >= seg.length) return { ...path[path.length - 1] }; const t = s / seg[i]; return { x: path[i].x + (path[i + 1].x - path[i].x) * t, y: path[i].y + (path[i + 1].y - path[i].y) * t }; }

  function colors() {
    C = { stage: cssv('--stage'), glass: cssv('--glass'), fill: cssv('--glass-fill'), ester: cssv('--ester'), water: cssv('--water'), acid: cssv('--acid'), ink: cssv('--ink'), ink2: cssv('--ink-2'), muted: cssv('--muted'), bad: cssv('--bad'), k: {} };
    TAGS.forEach(t => C.k[t[2]] = cssv(t[2]));
    C.dark = getComputedStyle(document.documentElement).colorScheme.includes('dark');
  }
  function size() {
    W = cv.clientWidth; H = cv.clientHeight; if (!W || !H) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    sc = Math.min(W / VW, H / VH); ox = (W - VW * sc) / 2; oy = (H - VH * sc) / 2;
    if (RM) draw(0);
  }
  function seed() {
    for (let i = 0; i < 26; i++) vapor.push({ s: Math.random() * tot, jx: (Math.random() - .5) * 18, sp: 60 + Math.random() * 30, r: 2 + Math.random() * 2.5 });
    for (let i = 0; i < 16; i++) bubbles.push(newBub(true));
    for (let i = 0; i < 22; i++) water.push({ t: Math.random(), side: i % 2 ? 1 : -1, sp: .12 + Math.random() * .06 });
    TAGS.forEach((t, i) => tags.push({ i, y: 60 + i * 34, a: 0, ph: i * 1.3 }));
  }
  function newBub(rand) { const x = fl.cx + (Math.random() - .5) * 100; return { x, y: rand ? fl.lvl + Math.random() * 50 : 425, r: 1.5 + Math.random() * 3, sp: 25 + Math.random() * 30 }; }

  function line(pts, w, col) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); }
  function off(p, k) { return { x: p.x + n.x * k, y: p.y + n.y * k }; }
  function along(t, k = 0) { return { x: P0.x + d.x * L * t + n.x * k, y: P0.y + d.y * L * t + n.y * k }; }

  function drawFlask(t) {
    const { cx, cy, r, nw, top } = fl, a = Math.asin(nw / r);
    // hotplate glow
    const g = ctx.createRadialGradient(cx, 450, 4, cx, 450, 120);
    const pulse = .5 + .25 * Math.sin(t * 2.2);
    g.addColorStop(0, `rgba(255,120,40,${.55 * pulse})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 130, 380, 260, 120);
    ctx.fillStyle = C.glass; ctx.globalAlpha = .9; roundRect(cx - 82, 446, 164, 22, 8); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.acid; ctx.globalAlpha = .7 + .3 * pulse; roundRect(cx - 70, 442, 140, 5, 3); ctx.fill(); ctx.globalAlpha = 1;
    // liquid
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 2.5, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.moveTo(cx - r, cy + r);
    for (let x = cx - r; x <= cx + r; x += 6) ctx.lineTo(x, fl.lvl + Math.sin(x * .07 + t * 3) * 2.2);
    ctx.lineTo(cx + r, cy + r); ctx.closePath();
    const lg = ctx.createLinearGradient(0, fl.lvl, 0, cy + r); lg.addColorStop(0, C.ester); lg.addColorStop(1, C.acid);
    ctx.fillStyle = lg; ctx.globalAlpha = C.dark ? .9 : .85;
    if (C.dark) { ctx.shadowColor = C.ester; ctx.shadowBlur = 18; }
    ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    // bubbles
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); });
    // boiling chips
    ctx.fillStyle = C.muted; [[-22, 424], [8, 428], [30, 422]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(cx + x, y, 5, 3, .3, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    // glass
    ctx.beginPath(); ctx.moveTo(cx - nw, top); ctx.lineTo(cx - nw, cy - r * Math.cos(a));
    ctx.arc(cx, cy, r, -Math.PI / 2 - a, -Math.PI / 2 + a, true);
    ctx.lineTo(cx + nw, top);
    ctx.fillStyle = C.fill; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = C.glass; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r - 12, Math.PI * 1.1, Math.PI * 1.35); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.stroke();
    // stopper + thermometer
    ctx.fillStyle = C.glass; roundRect(cx - 17, top - 10, 34, 13, 3); ctx.fill();
    line([{ x: cx, y: 128 }, { x: cx, y: 210 }], 5, C.glass);
    line([{ x: cx, y: 150 }, { x: cx, y: 208 }], 2, C.bad);
    ctx.beginPath(); ctx.arc(cx, 211, 4.5, 0, Math.PI * 2); ctx.fillStyle = C.bad; ctx.fill();
    ctx.font = '700 13px "JetBrains Mono", monospace'; ctx.fillStyle = C.ink; ctx.textAlign = 'right';
    ctx.fillText('77,1 °C', cx - 12, 142);
    // side arm
    const a1 = { x: cx + nw, y: 201 }, a2 = { x: P0.x, y: 201 }, b1 = { x: cx + nw, y: 211 }, b2 = { x: P0.x, y: 211 };
    ctx.fillStyle = C.fill; ctx.fillRect(a1.x, a1.y, a2.x - a1.x, 10);
    line([a1, a2], 2.2, C.glass); line([b1, b2], 2.2, C.glass);
  }
  function drawCondenser(t) {
    // jacket water
    ctx.lineCap = 'round';
    line([along(.08), along(.92)], 38, C.glass);
    line([along(.08), along(.92)], 34, C.stage);
    line([along(.08), along(.92)], 34, hexA(C.water, C.dark ? .28 : .35));
    // inner tube
    line([along(0), along(1)], 11, C.glass);
    line([along(0), along(1)], 7, C.stage);
    ctx.lineCap = 'butt';
    // nubs
    const inA = along(.86, 18), inB = along(.86, 46), outA = along(.14, -18), outB = along(.14, -46);
    line([inA, inB], 9, C.glass); line([inA, inB], 5, hexA(C.water, .9));
    line([outA, outB], 9, C.glass); line([outA, outB], 5, hexA(C.water, .9));
    // water particles (counter-current: from t=.86 to t=.14)
    ctx.fillStyle = hexA(C.water, C.dark ? .95 : .85);
    water.forEach(w => { const p = along(.86 - (.72 * w.t), w.side * 11); ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill(); });
    // labels
    ctx.font = '600 12.5px Lexend, system-ui, sans-serif'; ctx.fillStyle = C.ink2; ctx.textAlign = 'center';
    ctx.fillText('nước vào', inB.x - 4, inB.y + 18); ctx.fillText('nước ra', outB.x + 2, outB.y - 10);
    arrow(inB.x, inB.y + 4, inA.x, inA.y - 2); arrow(outA.x, outA.y, outB.x, outB.y + 6);
    // adapter + receiver
    line([P1, P2], 9, C.glass); line([P1, P2], 5, C.stage);
    const { x, mouth, neck, base, hw } = rc;
    ctx.save(); ctx.beginPath(); rcPath(); ctx.clip();
    const lv = base - rLevel;
    ctx.fillStyle = C.ester; if (C.dark) { ctx.shadowColor = C.ester; ctx.shadowBlur = 14; }
    ctx.fillRect(x - hw - 4, lv, hw * 2 + 8, base - lv + 4); ctx.shadowBlur = 0; ctx.restore();
    ctx.beginPath(); rcPath(); ctx.fillStyle = C.fill; ctx.globalAlpha = .6; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = C.glass; ctx.lineWidth = 2.4; ctx.stroke();
  }
  function rcPath() { const { x, mouth, neck, base, hw } = rc; ctx.moveTo(x - 13, mouth); ctx.lineTo(x - 13, neck); ctx.lineTo(x - hw, base - 6); ctx.quadraticCurveTo(x - hw, base, x - hw + 6, base); ctx.lineTo(x + hw - 6, base); ctx.quadraticCurveTo(x + hw, base, x + hw, base - 6); ctx.lineTo(x + 13, neck); ctx.lineTo(x + 13, mouth); }
  function arrow(x1, y1, x2, y2) { const a = Math.atan2(y2 - y1, x2 - x1); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x2 - Math.cos(a - .5) * 6, y2 - Math.sin(a - .5) * 6); ctx.lineTo(x2, y2); ctx.lineTo(x2 - Math.cos(a + .5) * 6, y2 - Math.sin(a + .5) * 6); ctx.stroke(); }
  function drawVapor() {
    vapor.forEach(v => {
      let p = at(v.s); const inCond = v.s > condStart, k = inCond ? Math.min(1, (v.s - condStart) / (L * .45)) : 0;
      if (v.s < seg[0]) p = { x: p.x + v.jx * (1 - v.s / seg[0]), y: p.y };
      const r = v.r * (1 - .35 * k);
      ctx.beginPath(); ctx.arc(p.x, p.y, r + (1 - k) * 2, 0, Math.PI * 2);
      ctx.fillStyle = k < 1 ? hexA(C.acid, .35 + .1 * (1 - k)) : C.ester;
      if (C.dark) { ctx.shadowColor = k < 1 ? C.acid : C.ester; ctx.shadowBlur = 10; }
      ctx.fill(); ctx.shadowBlur = 0;
      if (k > .2) { ctx.beginPath(); ctx.arc(p.x, p.y, r * .9, 0, Math.PI * 2); ctx.fillStyle = hexA(C.ester, k); ctx.fill(); }
    });
    // drop falling into receiver
    const dt = (performance.now() / 700) % 1, dy0 = P2.y + 4, dy1 = rc.base - rLevel;
    ctx.beginPath(); ctx.arc(P2.x + 2, dy0 + (dy1 - dy0) * dt * dt, 3.2, 0, Math.PI * 2); ctx.fillStyle = C.ester; ctx.fill();
  }
  function drawTags(t) {
    ctx.textAlign = 'left';
    tags.forEach(g => {
      const tg = TAGS[g.i], a = Math.max(0, Math.sin(t * .45 + g.ph)) ;
      const y = 34 + ((g.y - t * 9) % 120 + 120) % 120;
      ctx.globalAlpha = a * .95;
      const x = 360 + (g.i % 2) * 40;
      ctx.beginPath(); ctx.arc(x, y - 4, 5, 0, Math.PI * 2); ctx.fillStyle = C.k[tg[2]]; ctx.fill();
      ctx.font = '600 13px Lexend, system-ui, sans-serif'; ctx.fillStyle = C.ink; ctx.fillText(tg[0], x + 12, y);
      ctx.font = '400 12px Lexend, system-ui, sans-serif'; ctx.fillStyle = C.muted; ctx.fillText('mùi ' + tg[1], x + 12, y + 15);
      ctx.globalAlpha = 1;
    });
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function hexA(c, a) { if (!c) return `rgba(0,0,0,${a})`; if (c.startsWith('#')) { let h = c.slice(1); if (h.length === 3) h = h.split('').map(z => z + z).join(''); const v = parseInt(h, 16); return `rgba(${v >> 16 & 255},${v >> 8 & 255},${v & 255},${a})`; } return c; }

  function step(dt) {
    vapor.forEach(v => { v.s += v.sp * dt; if (v.s > tot) { v.s = 0; v.jx = (Math.random() - .5) * 18; rLevel += .35; } });
    if (rLevel > 52) rLevel = 0;
    bubbles.forEach((b, i) => { b.y -= b.sp * dt; b.x += Math.sin(b.y * .1) * .2; if (b.y < fl.lvl + 2) bubbles[i] = newBub(false); });
    water.forEach(w => { w.t += w.sp * dt; if (w.t > 1) w.t -= 1; });
  }
  function draw(t) {
    if (!W) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
    drawTags(t); drawCondenser(t); drawFlask(t); drawVapor();
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!visible) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    step(dt); draw(now / 1000);
  }
  colors(); seed(); rLevel = 20;
  new ResizeObserver(size).observe(stage); size();
  const mo = () => { colors(); if (RM) draw(0); };
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', mo);
  new MutationObserver(mo).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
  if (RM) { draw(0); return; }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);
  raf = requestAnimationFrame(loop);
}

/* ============================================================
   4 NHỊP — thẻ nhịp + bộ chạy mẫu
   ============================================================ */
let demoCur = DEMOS[0], demoStep = -1, demoTimer = 0;
function renderBeats() {
  $('#beats').innerHTML = BEATS.map((b, i) => `<div class="beat" data-i="${i}" style="--bc:var(${b.cv})" role="button" tabindex="0" aria-label="Nhịp ${i + 1}: ${b.ten}">
    ${icon(b.ic, 'ico')}<span class="n">${b.n}</span><h3>${b.ten}</h3><p>${b.p}</p></div>`).join('');
  $$('#beats .beat').forEach(el => {
    const go = () => { stopDemo(); demoGo(+el.dataset.i); };
    el.addEventListener('click', go); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  $('#demoPick').innerHTML = DEMOS.map(d => `<button class="chipbtn" type="button" data-d="${d.id}">${d.nhan}</button>`).join('');
  $$('#demoPick button').forEach(b => b.addEventListener('click', () => { stopDemo(); demoLoad(DEMOS.find(d => d.id === b.dataset.d)); }));
  $('#demoPlay').addEventListener('click', playDemo);
  $('#demoPrev').addEventListener('click', () => { stopDemo(); demoGo(Math.max(0, demoStep - 1)); });
  $('#demoNext').addEventListener('click', () => { stopDemo(); demoGo(Math.min(3, demoStep + 1)); });
  demoLoad(DEMOS[0]);
}
function demoLoad(d) {
  demoCur = d; demoStep = -1;
  $$('#demoPick button').forEach(b => b.classList.toggle('on', b.dataset.d === d.id));
  let t = esc(d.t);
  d.mark.forEach(m => { t = t.replace(esc(m), `<mark data-m>${esc(m)}</mark>`); });
  $('#demoText').innerHTML = t;
  const st = $('#demoStamp'); st.className = 'stamp ' + d.d; st.textContent = d.d === 'D' ? 'ĐÚNG' : 'SAI';
  const trap = d.bay ? TRAPS[d.bay] : null;
  if (trap) $('#demoStmt').style.setProperty('--mc', `var(${trap.cv})`); else $('#demoStmt').style.setProperty('--mc', 'var(--amber)');
  $('#demoSteps').innerHTML = BEATS.map((b, i) => `<div class="dstep" style="--bc:var(${b.cv})"><span class="dn">${i + 1}</span><div><b>${b.ten}</b><p>${fx(d.s[i])}</p>${i === 1 ? '<div style="margin-top:6px">' + keyChip(d.k) + '</div>' : ''}</div></div>`).join('');
  $$('#beats .beat').forEach(b => { b.classList.remove('on'); b.style.setProperty('--prog', '0%'); });
  $$('#demoText mark').forEach(m => m.classList.remove('lit'));
}
function demoGo(i) {
  demoStep = i;
  $$('#demoSteps .dstep').forEach((el, j) => { el.classList.toggle('on', j === i); el.classList.toggle('past', j < i); });
  $$('#beats .beat').forEach((el, j) => { el.classList.toggle('on', j === i); el.style.setProperty('--prog', j < i ? '100%' : '0%'); });
  const marks = $$('#demoText mark');
  marks.forEach(m => m.classList.toggle('lit', i >= 2));
  const sc = $('#demoScan'); sc.classList.remove('go');
  const st = $('#demoStamp'); st.classList.remove('go');
  if (i === 2) { void sc.offsetWidth; sc.classList.add('go'); }
  if (i === 3) { void st.offsetWidth; st.classList.add('go'); }
}
function stopDemo() { clearTimeout(demoTimer); demoTimer = 0; $('#demoPlay').textContent = '▶ Chạy 4 nhịp'; }
function playDemo() {
  if (demoTimer) { stopDemo(); return; }
  if (RM) { demoGo(3); return; }
  $('#demoPlay').textContent = '⏸ Dừng';
  let i = demoStep >= 3 ? 0 : demoStep + 1;
  const tick = () => {
    demoGo(i);
    const beat = $$('#beats .beat')[i];
    if (beat) { beat.style.transition = 'none'; beat.style.setProperty('--prog', '0%'); void beat.offsetWidth; beat.style.transition = ''; beat.style.setProperty('--prog', '100%'); }
    i++;
    if (i <= 3) demoTimer = setTimeout(tick, 2600); else demoTimer = setTimeout(stopDemo, 400);
  };
  tick();
}

/* ============================================================
   MÁY SOI BẪY
   ============================================================ */
const RX = {};
function buildRx() {
  const L = '\\p{L}\\p{N}';
  Object.entries(TRAPS).forEach(([id, t]) => {
    const alts = t.kw.slice().sort((a, b) => b.length - a.length).map(k => k.normalize('NFC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    let src = `(?<![${L}])(?:${alts})(?![${L}])`;
    if (t.num) src += `|(?<![${L},.(])\\d+(?:[.,]\\d+)?(?:\\s*:\\s*\\d+)?(?:\\s*(?:%|°C|mL|gam|mol)(?![\\p{L}]))?(?![\\p{N})])`;
    try { RX[id] = new RegExp(src, 'giu'); } catch (e) { RX[id] = null; }
  });
}
function scanTraps(text) {
  const hits = [];
  Object.keys(TRAPS).forEach(id => { const r = RX[id]; if (!r) return; r.lastIndex = 0; let m; while ((m = r.exec(text))) { if (!m[0]) { r.lastIndex++; continue; } hits.push({ s: m.index, e: m.index + m[0].length, id }); } });
  hits.sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s));
  const out = []; let end = -1;
  hits.forEach(h => { if (h.s >= end) { out.push(h); end = h.e; } });
  return out;
}
function renderRadar() {
  $('#trapList').innerHTML = Object.entries(TRAPS).map(([id, t]) => `<div class="trap" data-t="${id}" style="--mc:var(${t.cv})"><span class="tg">${t.g}</span><div><b>${t.ten}</b><p>${t.hoi}</p></div></div>`).join('');
  const samples = [
    ['Câu 34c', 'Ở bước 1, xảy ra phản ứng thế nhóm –OH của alcohol bằng gốc CH3COO–.'],
    ['Câu 31c', 'Chất lỏng trong bình hứng chỉ có isoamyl acetate.'],
    ['Câu 80 (2)', 'Salicylic acid tác dụng tối đa với nước bromine theo tỉ lệ mol 1 : 3.'],
    ['Câu 40a', 'Phản ứng tổng hợp trong thí nghiệm này là phản ứng thuỷ phân ester.'],
  ];
  $('#radarSamples').innerHTML = samples.map((s, i) => `<button type="button" data-i="${i}">${s[0]}</button>`).join('');
  const inp = $('#radarIn');
  inp.value = 'Isoamyl acetate rất ít tan trong nước vì có khối lượng riêng nhỏ hơn khối lượng riêng của nước.';
  $$('#radarSamples button').forEach(b => b.addEventListener('click', () => { inp.value = samples[+b.dataset.i][1]; runRadar(); }));
  inp.addEventListener('input', runRadar);
  runRadar();
}
function runRadar() {
  const text = $('#radarIn').value.normalize('NFC');
  const hits = scanTraps(text);
  let html = '', p = 0;
  hits.forEach(h => { html += esc(text.slice(p, h.s)) + `<mark style="--mc:var(${TRAPS[h.id].cv})" title="${TRAPS[h.id].ten}">${esc(text.slice(h.s, h.e))}</mark>`; p = h.e; });
  html += esc(text.slice(p));
  const ids = [...new Set(hits.map(h => h.id))];
  const sum = ids.length ? `<div style="margin-top:8px;font-size:13.5px;color:var(--ink-2)"><b>Soi thấy:</b> ${ids.map(id => `<span style="color:var(${TRAPS[id].cv});font-weight:700">${TRAPS[id].ten}</span>`).join(' · ')}. Kiểm từng chỗ tô màu bằng câu hỏi bên phải.</div>`
    : `<div style="margin-top:8px;font-size:13.5px;color:var(--ink-2)">Không thấy chữ bẫy quen thuộc. Vẫn đi đủ 4 nhịp: kiểm bằng quy tắc của chìa khoá.</div>`;
  $('#radarOut').innerHTML = (html || '<span class="muted">Gõ một ý vào ô trên.</span>') + sum;
  $$('#trapList .trap').forEach(el => { const on = ids.includes(el.dataset.t); el.classList.toggle('hit', on); el.classList.toggle('dim', ids.length > 0 && !on); });
}
