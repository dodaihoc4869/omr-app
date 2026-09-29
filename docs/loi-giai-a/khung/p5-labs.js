/* ============================================================
   6 PHÒNG THÍ NGHIỆM ẢO
   ============================================================ */
let curLab = 'k1';
const LABS = {};
function qLabel(x) { const qi = parseInt(x, 10); const q = QUESTIONS[qi - 1]; return q ? q.so.replace('Câu ', '') + x.slice(String(qi).length) : x; }
function renderKeys() {
  $('#keys').innerHTML = Object.entries(KEYS).map(([k, K]) => `<button class="key" type="button" data-k="${k}" style="--kc:var(${K.cv})" aria-label="Mở chìa khoá ${K.ten}">
    <span class="kic">${icon(K.ic)}</span><b>${K.ten}</b><p>${K.short}</p>
    <span class="kq">${K.q.map(x => `<span>Câu ${qLabel(x)}</span>`).join('')}<span class="kxp" style="margin-left:auto;background:transparent">${S.xp[k]}/${GOAL}</span></span>
    <span class="kbar"><i></i></span></button>`).join('');
  $$('.key').forEach(b => b.addEventListener('click', () => openLab(b.dataset.k, null, true)));
  paintXP();
}
function openLab(k, preset, scroll) {
  curLab = k; const K = KEYS[k];
  $$('.key').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  const lab = $('#lab'); lab.style.setProperty('--kc', `var(${K.cv})`);
  lab.innerHTML = `<div class="lab-top"><span class="kic">${icon(K.ic)}</span><h3>${K.ten}</h3><div class="rule">${fx(K.rule)}</div></div><div id="labIn"></div>`;
  LABS[k]($('#labIn'), preset);
  if (scroll) lab.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
}
function segHTML(id, opts, cur) { return `<div class="seg" id="${id}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" class="${v === cur ? 'on' : ''}">${fx(t)}</button>`).join('')}</div>`; }
function bindSeg(id, fn) { $$(`#${id} button`).forEach(b => b.addEventListener('click', () => { $$(`#${id} button`).forEach(x => x.classList.toggle('on', x === b)); fn(b.dataset.v); })); }
function tabsHTML(tabs, cur) { return `<div class="tabs" role="tablist">${tabs.map(([v, t]) => `<button type="button" role="tab" data-t="${v}" class="${v === cur ? 'on' : ''}">${t}</button>`).join('')}</div><div class="tabbody"></div>`; }

/* ---------- vẽ dụng cụ SVG dùng chung ---------- */
function flaskSVG(cx, cy, r, nw, top, liq, lvl, extra = '') {
  const a = Math.asin(nw / r), yj = cy - r * Math.cos(a);
  const body = `M${cx - nw},${top} L${cx - nw},${yj.toFixed(1)} A${r},${r} 0 1 0 ${cx + nw},${yj.toFixed(1)} L${cx + nw},${top}`;
  const id = 'fc' + Math.random().toString(36).slice(2, 7);
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r - 2}"/></clipPath>
  <path d="${body}" class="gls"/>
  <g clip-path="url(#${id})"><g class="liq ${extra}">${liq(cx - r, lvl, 2 * r, cy + r - lvl)}</g></g>
  <path d="${body}" class="gln"/>
  <path d="M${cx - r * .62},${cy - r * .35} A${r - 10},${r - 10} 0 0 1 ${cx - r * .2},${cy - r * .72}" class="ghi"/>`;
}
function erlSVG(x, mouth, base, hw, fillCol, grow, sty = '') {
  const neck = mouth + 10;
  const d = `M${x - 11},${mouth} L${x - 11},${neck} L${x - hw},${base - 6} Q${x - hw},${base} ${x - hw + 6},${base} L${x + hw - 6},${base} Q${x + hw},${base} ${x + hw},${base - 6} L${x + 11},${neck} L${x + 11},${mouth}`;
  const id = 'ec' + Math.random().toString(36).slice(2, 7);
  const lv = base - (base - neck) * .55;
  return `<clipPath id="${id}"><path d="${d}Z"/></clipPath><path d="${d}" class="gls"/>
  ${fillCol ? `<g clip-path="url(#${id})"><rect x="${x - hw}" y="${lv}" width="${hw * 2}" height="${base - lv}" style="fill:${fillCol};${sty}" class="liq ${grow ? 'growy' : ''}"/></g>` : ''}
  <path d="${d}" class="gln"/>`;
}
function condSVG(x0, y0, x1, y1, water, dir, labels = true) {
  const L = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / L, dy = (y1 - y0) / L, nx = -dy, ny = dx;
  const P = (t, k = 0) => [x0 + dx * L * t + nx * k, y0 + dy * L * t + ny * k];
  const [a1, b1] = [P(.08), P(.92)];
  let s = `<line x1="${a1[0]}" y1="${a1[1]}" x2="${b1[0]}" y2="${b1[1]}" style="stroke:var(--glass);stroke-width:32;stroke-linecap:round"/>
  <line x1="${a1[0]}" y1="${a1[1]}" x2="${b1[0]}" y2="${b1[1]}" style="stroke:var(--stage);stroke-width:28;stroke-linecap:round"/>`;
  if (water === 'full') s += `<line x1="${a1[0]}" y1="${a1[1]}" x2="${b1[0]}" y2="${b1[1]}" style="stroke:var(--water);stroke-width:28;stroke-linecap:round;opacity:.42"/>`;
  if (water === 'thin') { const [c1, c2] = [P(.1, 10), P(.9, 10)]; s += `<line x1="${c1[0]}" y1="${c1[1]}" x2="${c2[0]}" y2="${c2[1]}" style="stroke:var(--water);stroke-width:6;stroke-linecap:round;opacity:.8" class="blinkx"/>`; }
  s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" style="stroke:var(--glass);stroke-width:10"/><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" style="stroke:var(--stage);stroke-width:6"/>`;
  // nubs: dir 'duoi' = vào thấp (t=.86, +n) ra cao (t=.14, −n); 'tren' ngược lại
  const lowA = P(.86, 16), lowB = P(.86, 38), hiA = P(.14, -16), hiB = P(.14, -38);
  [[lowA, lowB], [hiA, hiB]].forEach(([p, q]) => { s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" style="stroke:var(--glass);stroke-width:8"/><line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" style="stroke:var(--water);stroke-width:4"/>`; });
  if (labels) {
    const inLow = dir !== 'tren';
    s += `<text x="${lowB[0] - 6}" y="${lowB[1] + 16}" class="svt s c">${inLow ? 'nước vào' : 'nước ra'}</text><text x="${hiB[0] + 4}" y="${hiB[1] - 8}" class="svt s c">${inLow ? 'nước ra' : 'nước vào'}</text>`;
  }
  return s;
}
function vaporSVG(path, cols, n = 7, dur = 3, r = 4) {
  if (RM) return '';
  let s = ''; for (let i = 0; i < n; i++) s += `<circle r="${r}" style="fill:${cols[i % cols.length]};opacity:.9"><animateMotion dur="${dur}s" repeatCount="indefinite" begin="${(i * dur / n).toFixed(2)}s" path="${path}"/></circle>`;
  return s;
}
function hotplate(x, w, y) { return `<ellipse cx="${x + w / 2}" cy="${y}" rx="${w * .55}" ry="16" style="fill:var(--acid);opacity:.25" class="fadein"/><rect x="${x}" y="${y}" width="${w}" height="12" rx="4" style="fill:var(--glass)"/><rect x="${x + 10}" y="${y - 3}" width="${w - 20}" height="4" rx="2" style="fill:var(--acid)"/>`; }

/* ============================================================
   K1 — TÁCH CHẤT
   ============================================================ */
function k1Decide(A, B) {
  const a = SUBS[A], b = SUBS[B], gates = [];
  if (a.ran) {
    gates.push({ q: 'Chất cần lấy ở thể nào?', p: `${a.ten}: chất rắn lẫn tạp (salicylic acid dư…).`, a: 'Rắn → kết tinh lại.', end: true });
    return { kq: 'kettinh', gates, title: 'Kết tinh lại', text: 'Hoà tan chất rắn trong dung môi nóng (ethanol nóng + nước ấm), để nguội từ từ: aspirin kết tinh, tạp chất lượng nhỏ ở lại dung dịch. Lọc lấy tinh thể, sấy khô.' };
  }
  gates.push({ q: 'Chất cần lấy ở thể nào?', p: `${a.ten}: chất lỏng.`, a: 'Lỏng → đi tiếp.' });
  const tach = (a.tan === 'nuoc' && b.tan === 'it') || (b.tan === 'nuoc' && a.tan === 'it');
  gates.push({ q: 'Hai chất có tan vào nhau không?', p: `${a.ten}: ${TANTXT[a.tan]} · ${b.ten}: ${TANTXT[b.tan]}.`, a: tach ? 'Không tan vào nhau → tách thành hai lớp.' : 'Tan vào nhau → chỉ một lớp, đi tiếp.', end: tach });
  if (tach) {
    const top = a.D < b.D ? a : b, bot = a.D < b.D ? b : a;
    return { kq: 'chiet', gates, top, bot, title: 'Chiết', text: `Lớp trên: <b>${top.ten}</b> (D = ${vnt(top.D)}). Lớp dưới: <b>${bot.ten}</b> (D = ${vnt(bot.D)}). Mở khoá cho lớp dưới chảy ra, rót lớp trên ra từ miệng phễu.` + (top === a ? '' : ' Chất cần lấy nằm ở <b>lớp dưới</b>: lớp hữu cơ không phải lúc nào cũng ở trên.') };
  }
  const dT = Math.abs(a.ts - b.ts), lo = a.ts < b.ts ? a : b, hi = a.ts < b.ts ? b : a;
  let kq, title, text, a3;
  if (dT >= 40) { kq = 'thuong'; a3 = 'Chênh nhiều → chưng cất thường.'; title = 'Chưng cất thường'; text = `${lo.ten} (${vnt(lo.ts)} °C) bay hơi trước, sang bình hứng; ${hi.ten} (${vnt(hi.ts)} °C) ở lại bình cầu.`; }
  else if (dT >= 5) { kq = 'phandoan'; a3 = 'Chênh ít → chưng cất phân đoạn.'; title = 'Chưng cất phân đoạn'; text = `Chênh ${vn(dT, 1)} °C là quá gần cho chưng cất thường. Cột phân đoạn cho hơi ngưng tụ rồi bay hơi lại nhiều lần: ${lo.ten} lên tới đỉnh cột trước, ${hi.ten} chảy ngược về bình.`; }
  else {
    kq = 'khong'; a3 = 'Gần trùng → chưng cất không tách được.'; title = 'Chưng cất không tách được';
    const isAcid = B === 'acoh' || B === 'acr';
    const other = a.tan === 'it' && b.tan === 'vh' ? `${b.ten} tan vô hạn trong nước còn ${a.ten} ít tan: lắc với ${isAcid ? 'dung dịch {Na2CO3}' : 'nước'} để kéo ${b.ten} sang lớp nước, rồi chiết.` : 'Phải chuyển một chất sang dạng khác (ví dụ hoà vào nước) rồi mới tách.';
    text = `Chênh chỉ ${vn(dT, 1)} °C: hơi hai chất bay ra cùng lúc. ${other}`;
  }
  gates.push({ q: 'Nhiệt độ sôi chênh bao nhiêu?', p: `${a.ten} ${vnt(a.ts)} °C · ${b.ten} ${vnt(b.ts)} °C → chênh ${vn(dT, 1)} °C.`, a: a3, end: true });
  return { kq, gates, lo, hi, title, text, dT, a, b };
}
function svgFunnel(top, bot) {
  const body = 'M214,70 C150,96 150,172 222,222 L238,222 C310,172 310,96 246,70 Z';
  let drops = '';
  for (let i = 0; i < 34; i++) {
    const up = i % 2 === 0, x = 180 + Math.random() * 100, y = 108 + Math.random() * 96;
    const ty = (up ? 104 + Math.random() * 50 : 168 + Math.random() * 42) - y;
    drops += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + Math.random() * 4).toFixed(1)}" style="fill:var(${up ? top.mau : bot.mau});--ty:${ty.toFixed(1)}px;--d:${(Math.random() * .4).toFixed(2)}s" class="sep"/>`;
  }
  return `<svg viewBox="0 0 560 300" role="img" aria-label="Phễu chiết: hai lớp tách ra">
  <line x1="120" y1="18" x2="120" y2="292" style="stroke:var(--line-2);stroke-width:5;stroke-linecap:round"/>
  <path d="M120,150 L166,150" style="stroke:var(--line-2);stroke-width:4"/>
  <g class="shakeit">
    <clipPath id="k1f"><path d="${body}"/></clipPath>
    <path d="${body}" class="gls"/>
    <g clip-path="url(#k1f)">
      <g class="fadein" style="--d:2.7s"><rect x="140" y="100" width="180" height="60" style="fill:var(${top.mau})" class="liq"/><rect x="140" y="160" width="180" height="70" style="fill:var(${bot.mau})" class="liq"/>
      <path d="M150,160 Q230,166 310,160" style="fill:none;stroke:var(--glass);stroke-width:1.5;opacity:.6"/></g>
      ${drops}
    </g>
    <path d="${body}" class="gln"/>
    <path d="M219,70 L219,48 M241,70 L241,48" class="gln"/><rect x="215" y="38" width="30" height="12" rx="3" style="fill:var(--glass)"/>
    <path d="M226,222 L226,236 M234,222 L234,236" class="gln"/><line x1="210" y1="229" x2="250" y2="229" style="stroke:var(--glass);stroke-width:5;stroke-linecap:round"/>
    <path d="M227,236 L227,286 M233,236 L233,286" class="gln"/>
    <path d="M190,100 C176,112 172,130 178,150" class="ghi"/>
  </g>
  <g class="fadein" style="--d:2.9s">
    <line x1="284" y1="128" x2="336" y2="128" style="stroke:var(--ink-2);stroke-dasharray:3 3"/>
    <text x="342" y="124" class="svt">Lớp trên: ${top.ten}</text><text x="342" y="142" class="svt s">D = ${vnt(top.D)} · nhẹ hơn</text>
    <line x1="284" y1="194" x2="336" y2="194" style="stroke:var(--ink-2);stroke-dasharray:3 3"/>
    <text x="342" y="190" class="svt">Lớp dưới: ${bot.ten}</text><text x="342" y="208" class="svt s">D = ${vnt(bot.D)} · nặng hơn</text>
  </g>
  <text x="342" y="262" class="svt s m">Lắc → để yên → tách lớp</text>
  </svg>`;
}
function svgDistill(r) {
  const { kq, lo, hi } = r, frac = kq === 'phandoan', headY = frac ? 64 : 118;
  const cx = 110, cy = 214, rr = 52;
  const liq = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h / 2 + 2}" style="fill:var(${lo.mau})"/><rect x="${x}" y="${y + h / 2}" width="${w}" height="${h / 2}" style="fill:var(${hi.mau})"/>`;
  let s = `<svg viewBox="0 0 560 330" role="img" aria-label="${r.title}">`;
  s += hotplate(50, 120, 272);
  if (frac) {
    s += `<rect x="100" y="${headY}" width="20" height="${162 - headY}" class="gls"/>`;
    for (let y = headY + 22; y < 150; y += 11) s += `<circle cx="${106 + ((y / 11) % 2) * 8}" cy="${y}" r="4" style="fill:var(--surface-3);stroke:var(--glass);stroke-width:1"/>`;
    s += `<text x="12" y="${headY + 40}" class="svt s">cột</text><text x="12" y="${headY + 56}" class="svt s">phân</text><text x="12" y="${headY + 72}" class="svt s">đoạn</text><path d="M44,${headY + 52} L96,${headY + 52}" style="stroke:var(--muted);stroke-dasharray:3 3"/>`;
  } else s += `<path d="M101,${headY} L101,163 M119,${headY} L119,163" class="gln"/>`;
  s += flaskSVG(cx, cy, rr, 9, 162, liq, 222, RM ? '' : 'wob');
  s += `<rect x="96" y="${headY - 12}" width="28" height="12" rx="3" style="fill:var(--glass)"/>`;
  s += `<line x1="110" y1="${headY - 52}" x2="110" y2="${headY + 2}" style="stroke:var(--glass);stroke-width:5;stroke-linecap:round"/><line x1="110" y1="${headY - 30}" x2="110" y2="${headY + 1}" style="stroke:var(--bad);stroke-width:2"/><circle cx="110" cy="${headY + 3}" r="4" style="fill:var(--bad)"/>`;
  s += `<text x="120" y="${headY - 36}" class="svt mono">${kq === 'khong' ? '≈ ' : ''}${vn(lo.ts, 1)} °C</text>`;
  s += `<path d="M119,${headY - 4} L152,${headY - 4} M119,${headY + 6} L152,${headY + 6}" class="gln"/>`;
  s += condSVG(152, headY + 1, 392, 236, 'full', 'duoi', false);
  s += `<line x1="392" y1="236" x2="444" y2="246" style="stroke:var(--glass);stroke-width:8;stroke-linecap:round"/><line x1="392" y1="236" x2="444" y2="246" style="stroke:var(--stage);stroke-width:4"/>`;
  const rcol = kq === 'khong' ? 'url(#k1mix)' : `var(${lo.mau})`;
  s += `<defs><pattern id="k1mix" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" style="fill:var(${lo.mau})"/><rect x="5" width="5" height="10" style="fill:var(${hi.mau})"/></pattern></defs>`;
  s += erlSVG(452, 250, 294, 40, rcol, true, '--t:6s;--d:.6s');
  const vp = `M110,214 L110,${headY + 1} L152,${headY + 1} L392,236 L446,247`;
  s += vaporSVG(vp, kq === 'khong' ? [`var(${lo.mau})`, `var(${hi.mau})`] : [`var(${lo.mau})`], 8, 3.4);
  if (frac && !RM) for (let i = 0; i < 4; i++) s += `<circle r="4" style="fill:var(${hi.mau})"><animateMotion dur="2.6s" repeatCount="indefinite" begin="${i * .65}s" path="M${106 + (i % 2) * 8},214 L${106 + (i % 2) * 8},${headY + 58}" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"/></circle>`;
  s += `<text x="452" y="312" class="svt c">Bình hứng</text><text x="452" y="327" class="svt s c">${kq === 'khong' ? 'lẫn cả hai chất' : lo.ten + ' ra trước'}</text>`;
  s += `<text x="${cx}" y="312" class="svt c">Bình cầu</text><text x="${cx}" y="327" class="svt s c">${kq === 'khong' ? 'hai chất bay cùng lúc' : 'còn lại: ' + hi.ten}</text>`;
  return s + '</svg>';
}
function svgCrystal() {
  let cr = '', imp = '';
  for (let i = 0; i < 26; i++) { const x = 185 + Math.random() * 130, y = i < 16 ? 222 + Math.random() * 30 : 150 + Math.random() * 70, s = 4 + Math.random() * 5; cr += `<path d="M${x},${y - s} L${x + s * .7},${y} L${x},${y + s} L${x - s * .7},${y} Z" style="fill:var(--crys);stroke:var(--glass);stroke-width:1;--d:${(1.9 + i * .08).toFixed(2)}s" class="popin"/>`; }
  for (let i = 0; i < 9; i++) imp += `<circle cx="${190 + Math.random() * 120}" cy="${140 + Math.random() * 100}" r="3.2" style="fill:var(--acid);animation-delay:${(-Math.random() * 3).toFixed(2)}s" class="drift"/>`;
  return `<svg viewBox="0 0 560 300" role="img" aria-label="Kết tinh lại aspirin">
  <ellipse cx="250" cy="276" rx="95" ry="14" style="fill:var(--acid);opacity:.35" class="fadeout" />
  <clipPath id="k1b"><path d="M172,84 L172,250 Q172,262 184,262 L316,262 Q328,262 328,250 L328,84 Z"/></clipPath>
  <path d="M170,80 L170,250 Q170,264 184,264 L316,264 Q330,264 330,250 L330,80" class="gls"/>
  <g clip-path="url(#k1b)"><rect x="170" y="124" width="160" height="150" style="fill:var(--water);opacity:.28"/>${imp}${cr}</g>
  <path d="M170,80 L170,250 Q170,264 184,264 L316,264 Q330,264 330,250 L330,80 M164,80 L176,80 M324,80 L336,80" class="gln"/>
  <text x="250" y="60" class="svt c fadeout">Nóng: aspirin tan hết</text>
  <text x="250" y="60" class="svt c fadein" style="--d:1.7s">Nguội: aspirin kết tinh</text>
  <text x="352" y="170" class="svt">◆ tinh thể aspirin</text>
  <circle cx="357" cy="190" r="3.5" style="fill:var(--acid)"/><text x="366" y="194" class="svt s">salicylic acid dư (ít): vẫn tan,</text><text x="366" y="210" class="svt s">ở lại dung dịch → trôi theo nước lọc</text>
  </svg>`;
}
function k1Strip(r) {
  if (!r.lo) return '';
  const pct = t => Math.max(2, Math.min(98, t / 160 * 100));
  const a = r.a, b = r.b, pa = pct(a.ts), pb = pct(b.ts);
  return `<div class="axis"></div>
  <div class="gap" style="left:${Math.min(pa, pb)}%;width:${Math.abs(pa - pb)}%"></div>
  <div class="mk" style="left:${pa}%"><span>${a.ten} ${vnt(a.ts)} °C</span><i></i></div>
  <div class="mk" style="left:${pb}%;top:30px;flex-direction:column-reverse"><span>${b.ten} ${vnt(b.ts)} °C</span><i></i></div>
`;
}
LABS.k1 = function (el, pid) {
  const pr = (pid && typeof pid === 'object') ? pid : (K1_PRESETS.find(p => p.id === pid) || K1_PRESETS[0]);
  let st = { A: pr.A, B: pr.B };
  const liquids = Object.keys(SUBS).filter(k => !SUBS[k].ran);
  el.innerHTML = `<div class="lab-body"><div class="st"><div class="stage"><div class="grid-bg"></div><div id="k1stage"></div></div><div class="tstrip" id="k1strip"></div><p class="stage-cap" id="k1cap"></p></div>
  <div class="sd ctrl">
    <div><span class="lbl">Tình huống có sẵn</span><div class="presets" id="k1pre">${K1_PRESETS.map(p => `<button type="button" data-p="${p.id}">${p.nhan}</button>`).join('')}</div></div>
    <div class="numin"><label>Chất cần lấy<select class="sel" id="k1A">${Object.keys(SUBS).filter(k => k !== 'nuoc').map(k => `<option value="${k}">${SUBS[k].ten}</option>`).join('')}</select></label>
    <label>Đang lẫn với<select class="sel" id="k1B"></select></label></div>
    <div class="gates" id="k1gates"></div>
    <div class="verdict" id="k1v"></div>
    <div class="rulebox"><b>Dung môi chiết tốt</b> cần: tách lớp với nước · hoà tan tốt chất cần lấy · hoà tan kém chất muốn bỏ · dễ đuổi đi sau đó. <span class="muted">Mốc ước lượng máy dùng: chênh từ 40 °C trở lên là "nhiều", 5–40 °C là "ít", dưới 5 °C là "gần trùng". Đề thi thường cho số chênh rất rõ.</span></div>
  </div></div>`;
  const selA = $('#k1A'), selB = $('#k1B');
  function fillB() { selB.innerHTML = liquids.filter(k => k !== st.A).map(k => `<option value="${k}">${SUBS[k].ten}</option>`).join(''); if (st.B === st.A || !liquids.includes(st.B)) st.B = st.A === 'nuoc' ? 'ea' : 'nuoc'; selB.value = st.B; selB.disabled = !!SUBS[st.A].ran; }
  function run() {
    selA.value = st.A; fillB();
    const r = k1Decide(st.A, st.B);
    $('#k1stage').innerHTML = r.kq === 'chiet' ? svgFunnel(r.top, r.bot) : r.kq === 'kettinh' ? svgCrystal() : svgDistill(r);
    $('#k1strip').innerHTML = k1Strip(r); $('#k1strip').style.display = r.lo ? '' : 'none';
    $('#k1cap').innerHTML = r.kq === 'chiet' ? 'Phễu lắc rồi để yên: giọt chất nhẹ nổi lên, giọt chất nặng chìm xuống.' : r.kq === 'kettinh' ? 'Đun nóng cho tan, để nguội: tinh thể tách ra, tạp chất lượng nhỏ ở lại dung dịch.' : 'Hạt màu là hơi đi qua ống sinh hàn. Nhiệt kế đo nhiệt độ của hơi ở chỗ nối nhánh.';
    $('#k1gates').innerHTML = r.gates.map((g, i) => `<div class="gate ${g.end ? 'end' : ''}" style="transition-delay:${RM ? 0 : i * .35}s"><span class="gi">${i + 1}</span><div><b>${g.q}</b><p>${fx(g.p)}<br><b style="color:var(--ink)">${g.a}</b></p></div></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $$('#k1gates .gate').forEach(g => g.classList.add('on'))));
    $('#k1v').innerHTML = `<div class="eyebrow" style="color:var(--kc)">Cách tách</div><div class="vt">${r.title}</div><p>${fx(r.text)}</p>`;
  }
  selA.addEventListener('change', () => { st.A = selA.value; run(); });
  selB.addEventListener('change', () => { st.B = selB.value; run(); });
  $$('#k1pre button').forEach(b => b.addEventListener('click', () => { const p = K1_PRESETS.find(x => x.id === b.dataset.p); st = { A: p.A, B: p.B }; run(); }));
  run();
};

/* ============================================================
   K2 — AN TOÀN & DỤNG CỤ
   ============================================================ */
function k2Eval(v) {
  const out = []; const fire = v.chat === 'ether' && v.nhiet === 'den'; const noBoil = v.chat === 'cao' && v.nhiet === 'nuoc';
  if (fire) out.push(['bad', 'Nguồn nhiệt', 'Lửa trần + diethyl ether: hơi ether nặng hơn không khí, lan tới ngọn lửa và bắt cháy.']);
  else if (v.chat === 'ether') out.push(['ok', 'Nguồn nhiệt', 'Nước nóng đủ làm ether (sôi 34,6 °C) sôi mà không có lửa.']);
  if (noBoil) out.push(['bad', 'Nguồn nhiệt', 'Nước nóng không vượt quá 100 °C nên hỗn hợp sôi trên 100 °C không sôi được.']);
  else if (v.chat === 'cao') out.push(['ok', 'Nguồn nhiệt', 'Chất sôi trên 100 °C phải đun trực tiếp (đèn cồn hoặc bếp điện), như hình trong đề.']);
  if (v.nuoc === 'tren') out.push(['bad', 'Nước sinh hàn', 'Vào cao ra thấp: nước chảy tuột xuống, ống không đầy nước, hơi không ngưng hết và thoát ra ngoài.']);
  else out.push(['ok', 'Nước sinh hàn', 'Vào thấp ra cao: ống luôn đầy nước, chảy ngược chiều hơi, ngưng tụ triệt để.']);
  if (v.da === 'khong') out.push(['warn', 'Đá bọt', 'Không có tâm sôi: chất lỏng quá nhiệt rồi sôi bùng, có thể trào.']);
  else out.push(['ok', 'Đá bọt', 'Có tâm sôi nên sôi êm.']);
  out.push(['ok', 'Kiểu lắp', v.viec === 'hoiluu' ? 'Sinh hàn đứng: hơi ngưng tụ chảy về bình cầu → đun lâu không mất chất.' : 'Sinh hàn nghiêng: hơi ngưng tụ chảy sang bình hứng → lấy chất ra khỏi hỗn hợp.']);
  return { out, fire, noBoil };
}
function svgBench(v, ev) {
  const { fire, noBoil } = ev, refl = v.viec === 'hoiluu', col = v.chat === 'ether' ? 'var(--ether)' : 'var(--ester)';
  const cx = 150, cy = 226, r = 50, boil = !noBoil;
  let s = `<svg viewBox="0 0 560 330" role="img" aria-label="Bàn thí nghiệm">`;
  if (v.nhiet === 'den') {
    s += `<path d="M150,286 C137,274 140,260 150,244 C160,260 163,274 150,286 Z" style="fill:var(--acid)" class="flame"/><path d="M150,286 C144,279 145,270 150,262 C155,270 156,279 150,286 Z" style="fill:var(--ester)" class="flame"/>`;
    s += `<path d="M118,322 L124,294 Q150,286 176,294 L182,322 Z" class="gls"/><rect x="146" y="286" width="8" height="9" style="fill:var(--ink-2)"/><rect x="120" y="306" width="60" height="16" style="fill:var(--alc);opacity:.45"/>`;
  } else {
    s += `<rect x="84" y="316" width="132" height="10" rx="3" style="fill:var(--glass)"/><rect x="92" y="248" width="116" height="66" style="fill:var(--water);opacity:.42"/>`;
    s += `<path d="M88,236 L92,308 Q92,314 98,314 L202,314 Q208,314 208,308 L212,236" class="gln"/>`;
    if (!RM) for (let i = 0; i < 3; i++) s += `<path d="M${110 + i * 40},244 q-6,-10 0,-20 q6,-10 0,-20" style="fill:none;stroke:var(--muted);stroke-width:2;opacity:0;--h:-24px;animation-delay:${i * .6}s" class="bub"/>`;
  }
  const liq = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:${col}"/>` + (boil && !RM ? Array.from({ length: v.da === 'khong' ? 4 : 9 }, (_, i) => `<circle cx="${cx - 30 + i * (v.da === 'khong' ? 20 : 8)}" cy="${cy + 44}" r="${v.da === 'khong' ? 6 : 2.5}" style="fill:rgba(255,255,255,.8);--h:-38px;animation-delay:${(i * .23).toFixed(2)}s" class="bub"/>`).join('') : '');
  s += flaskSVG(cx, cy, r, 9, refl ? 150 : 140, liq, 236, v.da === 'khong' && boil && !RM ? 'bump' : '');
  s += `<circle cx="${cx - 12}" cy="${cy + 42}" r="3" style="fill:var(--muted)"/>`.repeat(v.da === 'khong' ? 0 : 1) + (v.da === 'khong' ? '' : `<circle cx="${cx + 14}" cy="${cy + 44}" r="2.5" style="fill:var(--muted)"/>`);
  const wmode = v.nuoc === 'tren' ? 'thin' : 'full';
  if (refl) {
    s += `<rect x="135" y="40" width="30" height="104" rx="12" style="fill:var(--stage);stroke:var(--glass);stroke-width:2.2"/>`;
    if (wmode === 'full') s += `<rect x="137" y="42" width="26" height="100" rx="11" style="fill:var(--water);opacity:.42"/>`; else s += `<rect x="137" y="44" width="6" height="96" rx="3" style="fill:var(--water);opacity:.8" class="blinkx"/>`;
    s += `<path d="M145,22 L145,150 M155,22 L155,150" class="gln"/>`;
    const lowIn = v.nuoc !== 'tren';
    s += `<line x1="165" y1="130" x2="196" y2="130" style="stroke:var(--glass);stroke-width:8"/><line x1="165" y1="130" x2="196" y2="130" style="stroke:var(--water);stroke-width:4"/><line x1="165" y1="54" x2="196" y2="54" style="stroke:var(--glass);stroke-width:8"/><line x1="165" y1="54" x2="196" y2="54" style="stroke:var(--water);stroke-width:4"/>`;
    s += `<text x="204" y="134" class="svt s">${lowIn ? 'nước vào' : 'nước ra'}</text><text x="204" y="58" class="svt s">${lowIn ? 'nước ra' : 'nước vào'}</text>`;
    if (boil && !fire) { s += vaporSVG('M150,226 L150,70', [col], 6, 2.4, 3.5); if (!RM) for (let i = 0; i < 4; i++) s += `<circle cx="150" cy="110" r="3" style="fill:${col};--h:100px;animation-delay:${i * .3}s" class="drip"/>`; }
    if (boil && v.nuoc === 'tren' && !fire && !RM) for (let i = 0; i < 3; i++) s += `<path d="M${146 + i * 4},20 q-6,-10 0,-18 q6,-8 0,-16" style="fill:none;stroke:var(--k2);stroke-width:2.2;opacity:0;--h:-28px;animation-delay:${i * .5}s" class="bub"/>`;
    s += `<text x="228" y="96" class="svt s">sinh hàn đứng: giọt ngưng tụ</text><text x="228" y="112" class="svt s">chảy ngược về bình</text>`;
  } else {
    s += `<rect x="137" y="128" width="26" height="12" rx="3" style="fill:var(--glass)"/>`;
    s += `<line x1="150" y1="84" x2="150" y2="142" style="stroke:var(--glass);stroke-width:5;stroke-linecap:round"/><line x1="150" y1="104" x2="150" y2="141" style="stroke:var(--bad);stroke-width:2"/><circle cx="150" cy="143" r="4" style="fill:var(--bad)"/>`;
    s += `<text x="160" y="98" class="svt mono">${noBoil ? '< 100 °C' : v.chat === 'ether' ? '34,6 °C' : '≈ 142 °C'}</text>`;
    s += `<path d="M159,140 L188,142 M159,150 L188,152" class="gln"/>`;
    s += condSVG(188, 147, 420, 262, wmode, v.nuoc);
    s += `<line x1="420" y1="262" x2="454" y2="270" style="stroke:var(--glass);stroke-width:8;stroke-linecap:round"/><line x1="420" y1="262" x2="454" y2="270" style="stroke:var(--stage);stroke-width:4"/>`;
    s += erlSVG(462, 274, 318, 40, boil && !fire ? col : null, true, '--t:6s');
    if (boil && !fire) s += vaporSVG('M150,226 L150,147 L188,147 L420,262 L455,271', [col], 7, 3);
    if (boil && v.nuoc === 'tren' && !fire && !RM) for (let i = 0; i < 3; i++) s += `<path d="M${448 + i * 7},262 q-6,-10 0,-18 q6,-8 0,-16" style="fill:none;stroke:var(--k2);stroke-width:2.2;opacity:0;--h:-30px;animation-delay:${i * .5}s" class="bub"/>`;
    if (boil && v.nuoc === 'tren') s += `<text x="470" y="236" class="svt s c" style="fill:var(--bad)">hơi thoát ra</text>`;
  }
  if (noBoil) s += `<text x="${cx}" y="${cy - 8}" class="svt c" style="fill:var(--bad)">chưa sôi</text>`;
  if (v.da === 'khong' && boil && !fire) s += `<text x="${cx + 58}" y="${cy + 30}" class="svt s" style="fill:var(--warn)">sôi bùng!</text>`;
  if (fire) {
    s += `<rect x="0" y="0" width="560" height="330" style="fill:var(--bad)" class="fireflash"/>`;
    [[110, 250, 1.4], [190, 240, 1.2], [150, 200, 1.8], [80, 290, 1], [220, 290, 1]].forEach(([x, y, k], i) => {
      s += `<path d="M${x},${y + 40 * k} C${x - 22 * k},${y + 20 * k} ${x - 12 * k},${y - 4 * k} ${x},${y - 30 * k} C${x + 12 * k},${y - 4 * k} ${x + 22 * k},${y + 20 * k} ${x},${y + 40 * k} Z" style="fill:var(--acid);opacity:.9;animation-delay:${i * .07}s" class="flame"/><path d="M${x},${y + 40 * k} C${x - 10 * k},${y + 26 * k} ${x - 6 * k},${y + 8 * k} ${x},${y - 8 * k} C${x + 6 * k},${y + 8 * k} ${x + 10 * k},${y + 26 * k} ${x},${y + 40 * k} Z" style="fill:var(--ester)" class="flame"/>`;
    });
    s += `<text x="300" y="60" class="svt big" style="fill:var(--bad)">Hơi ether bắt lửa!</text><text x="300" y="82" class="svt s">Không dùng lửa trần với ether,</text><text x="300" y="98" class="svt s">kể cả khi "đun nhẹ".</text>`;
  }
  return s + '</svg>';
}
LABS.k2 = function (el, pid) {
  const pr = K2_PRESETS.find(p => p.id === pid) || K2_PRESETS[0];
  let v = { ...pr.v };
  el.innerHTML = `<div class="lab-body"><div class="st"><div class="stage"><div class="grid-bg"></div><div id="k2stage"></div></div><div class="checks" id="k2checks"></div></div>
  <div class="sd ctrl">
    <div><span class="lbl">Tình huống có sẵn</span><div class="presets" id="k2pre">${K2_PRESETS.map(p => `<button type="button" data-p="${p.id}">${p.nhan}</button>`).join('')}</div></div>
    ${Object.entries({ viec: 'Việc cần làm', chat: 'Chất trong bình', nhiet: 'Nguồn nhiệt', nuoc: 'Nước sinh hàn', da: 'Đá bọt' }).map(([k, t]) => `<div><span class="lbl">${t}</span>${segHTML('k2' + k, K2_OPTS[k], v[k])}</div>`).join('')}
    <div class="verdict" id="k2v"></div>
  </div></div>`;
  function run() {
    Object.keys(K2_OPTS).forEach(k => $$(`#k2${k} button`).forEach(b => b.classList.toggle('on', b.dataset.v === v[k])));
    const ev = k2Eval(v);
    $('#k2stage').innerHTML = svgBench(v, ev);
    $('#k2checks').innerHTML = ev.out.map(([c, t, p], i) => `<div class="chk ${c}" style="animation-delay:${RM ? 0 : i * .08}s"><span class="ci">${c === 'ok' ? '✓' : c === 'bad' ? '✕' : '!'}</span><div><b>${t}.</b> ${p}</div></div>`).join('');
    const bad = ev.out.filter(o => o[0] === 'bad').length, warn = ev.out.filter(o => o[0] === 'warn').length;
    $('#k2v').innerHTML = `<div class="eyebrow" style="color:var(--kc)">Kết quả</div><div class="vt">${bad ? `${bad} lỗi nguy hiểm` : warn ? 'Chạy được, còn 1 điều cần sửa' : 'An toàn, chạy đúng'}</div><p>${bad || warn ? 'Đổi từng lựa chọn bên trên để xem lỗi biến mất.' : 'Mọi quy tắc đều thoả. Thử đổi một lựa chọn để thấy hậu quả.'}</p>`;
  }
  Object.keys(K2_OPTS).forEach(k => bindSeg('k2' + k, val => { v[k] = val; run(); }));
  $$('#k2pre button').forEach(b => b.addEventListener('click', () => { v = { ...K2_PRESETS.find(p => p.id === b.dataset.p).v }; run(); }));
  run();
};

/* ============================================================
   K3 — VAI TRÒ HOÁ CHẤT
   ============================================================ */
LABS.k3 = function (el, pid) {
  const flipIdx = { naoh: 3, kettinh: 7, h3po4: 8 }[pid];
  el.innerHTML = `<div class="lab-body k3"><div class="st"><div class="h4" style="margin-bottom:10px">Bấm từng thẻ: mặt sau là vai trò và hậu quả nếu thay/bỏ</div><div class="roles" id="k3roles"></div></div>
  <div class="sd"><div class="game" id="k3game"></div></div></div>`;
  $('#k3roles').innerHTML = ROLES.map((r, i) => `<button type="button" class="role ${r.trap ? 'trap' : ''} ${i === flipIdx ? 'flip' : ''}" style="--rc:var(${r.rc})" aria-label="${esc(r.ch.replace(/[{}]/g, ''))}: lật thẻ"><span class="in"><span class="fa"><span class="ch">${fx(r.ch)}</span><span class="q">${r.trap ? 'Bẫy hay gặp' : 'Cho vào để làm gì?'}</span><span class="sw"></span></span><span class="fb"><b>${fx(r.vai)}</b>${fx(r.neu)}</span></span></button>`).join('');
  $$('#k3roles .role').forEach(b => b.addEventListener('click', () => b.classList.toggle('flip')));
  let rounds = shuffle(ROLE_GAME).slice(0, 5), i = 0, score = 0;
  function show() {
    const g = $('#k3game');
    if (i >= rounds.length) {
      g.innerHTML = `<div class="eyebrow" style="color:var(--kc)">Thử nhanh · xong</div><div class="gq" style="font-size:22px;font-family:var(--f-display);font-weight:800">${score}/${rounds.length} câu đúng</div><p class="fb-line">${score === rounds.length ? 'Nắm chắc vai trò từng chất.' : 'Lật lại các thẻ bên trái rồi chơi lượt mới.'}</p><button class="btn pri sm" type="button" id="k3again">Chơi lượt mới</button>`;
      $('#k3again').addEventListener('click', () => { rounds = shuffle(ROLE_GAME).slice(0, 5); i = 0; score = 0; show(); });
      return;
    }
    const r = rounds[i], opts = shuffle([r.a, ...r.o]);
    g.innerHTML = `<div class="eyebrow" style="color:var(--kc)">Thử nhanh · câu ${i + 1}/${rounds.length}</div><div class="gq">${fx(r.q)}</div><div class="opts">${opts.map(o => `<button class="opt" type="button" data-o="${esc(o)}">${fx(o)}</button>`).join('')}</div><div class="fb-line" id="k3fb"></div>`;
    $$('#k3game .opt').forEach(b => b.addEventListener('click', () => {
      const ok = b.dataset.o === r.a;
      $$('#k3game .opt').forEach(x => { x.disabled = true; if (x.dataset.o === r.a) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong'); else { score++; addXP('k3'); const rc = b.getBoundingClientRect(); burst(rc.left + rc.width / 2, rc.top); }
      $('#k3fb').innerHTML = `${ok ? '<b style="color:var(--ok)">Đúng.</b>' : '<b style="color:var(--bad)">Chưa đúng.</b>'} ${fx(r.why)} <button class="btn sec sm" type="button" id="k3next" style="margin-left:6px">Câu tiếp →</button>`;
      $('#k3next').addEventListener('click', () => { i++; show(); });
    }));
  }
  show();
};

/* ============================================================
   K4 — CON SỐ
   ============================================================ */
function k4Compute(R, inp) {
  const cols = R.cd.map((c, i) => { if (c.du) return { ten: c.ten, du: true }; const v = inp.cd[i]; const m = v.V != null ? v.V * v.D : v.m; return { ten: c.ten, V: v.V, D: v.D, m, M: c.M, n: m / c.M }; });
  const act = cols.filter(c => !c.du), lim = act.reduce((a, b) => (b.n < a.n ? b : a));
  const nlt = lim.n, mlt = nlt * R.sp.M;
  if (R.hoi === 'H') return { cols, lim, nlt, mlt, mtt: inp.mtt, H: inp.mtt / mlt * 100 };
  const m1 = mlt * inp.H / 100, m2 = m1 * (1 - inp.hh / 100);
  return { cols, lim, nlt, mlt, m1, m2, V: R.sp.D ? m2 / inp.Dsp : null };
}
function k4Pipe(R, inp) {
  const c = k4Compute(R, inp);
  const node = (op, lb, val, cls = '') => `<div class="pnode ${cls}"><span class="op">${op}</span><span class="lb">${lb}</span><span class="val">${val}</span></div>`;
  const link = '<div class="plink"></div>';
  const colHTML = c.cols.map(k => {
    if (k.du) return `<div class="pipe">${node('dư', `<b>${k.ten}</b> dùng dư → không tính`, '—', 'du')}</div>`;
    const cls = k === c.lim ? 'lim' : 'du';
    let h = '';
    if (k.V != null) h += node('V', `<b>${k.ten}</b>`, `${vnt(k.V)} mL`) + link + node('× D', `${vnt(k.D)} g/mL`, `${vn(k.m, 2)} g`) + link;
    else h += node('m', `<b>${k.ten}</b>`, `${vnt(k.m)} g`) + link;
    h += node('÷ M', `${k.M} g/mol`, `${vn(k.n, 4)} mol`, cls);
    return `<div class="pipe">${h}</div>`;
  }).join('');
  let chain = node('n', `n lí thuyết = n <b>${c.lim.ten}</b>`, `${vn(c.nlt, 4)} mol`) + link + node('× M', `${R.sp.ten} ${R.sp.M} g/mol`, `${vn(c.mlt, 2)} g`);
  let fin, formula;
  if (R.hoi === 'H') {
    chain += link + node('m', 'thực tế cân được', `${vnt(c.mtt)} g`) + link + node('÷', 'm thực tế ÷ m lí thuyết', `${vn(c.H, 1)} %`, 'hot');
    fin = `<b>H = ${vn(c.H, 1)}%</b><span>${vnt(c.mtt)} ÷ ${vn(c.mlt, 2)} × 100</span>`;
    formula = `H = m thực tế ÷ (n thiếu × M) = ${vnt(c.mtt)} ÷ (${vn(c.nlt, 4)} × ${R.sp.M}) = ${vn(c.H, 1)}%`;
  } else {
    chain += link + node('× H', `hiệu suất ${vnt(inp.H)}%`, `${vn(c.m1, 2)} g`) + link + node('× (1 − h)', `hao hụt ${vnt(inp.hh)}%`, `${vn(c.m2, 2)} g`, c.V == null ? 'hot' : '');
    if (c.V != null) chain += link + node('÷ D', `${vnt(inp.Dsp)} g/mL`, `${vn(c.V, 1)} mL`, 'hot');
    fin = c.V != null ? `<b>V = ${vn(c.V, 1)} mL</b><span>${R.sp.ten} thu được</span>` : `<b>m = ${vn(c.m2, 2)} g</b><span>${R.sp.ten}</span>`;
    formula = `V = n × M × H × (1 − h) ÷ D = ${vn(c.nlt, 4)} × ${R.sp.M} × ${vnt(inp.H / 100)} × ${vnt(+(1 - inp.hh / 100).toFixed(2))} ÷ ${vnt(inp.Dsp)} = ${c.V != null ? vn(c.V, 1) + ' mL' : vn(c.m2, 2) + ' g'}`;
  }
  const act = c.cols.filter(k => !k.du);
  const bal = act.length > 1 ? `<div class="balance"><svg class="beam" viewBox="0 0 120 40"><line x1="60" y1="6" x2="60" y2="36" style="stroke:var(--ink-2);stroke-width:2"/><g style="transform-origin:60px 10px;transform:rotate(${act[0] === c.lim ? 8 : -8}deg);transition:transform .8s"><line x1="14" y1="10" x2="106" y2="10" style="stroke:var(--ink);stroke-width:3;stroke-linecap:round"/><circle cx="18" cy="18" r="7" style="fill:var(${act[0] === c.lim ? '--ok' : '--line-2'})"/><circle cx="102" cy="18" r="7" style="fill:var(${act[1] === c.lim ? '--ok' : '--line-2'})"/></g></svg><span>Tỉ lệ 1 : 1 · ${vn(act[0].n, 4)} ${act[0].n < act[1].n ? '<' : '>'} ${vn(act[1].n, 4)} → <b style="color:var(--ok)">${c.lim.ten} thiếu</b>, tính theo chất này</span></div>`
    : `<div class="balance"><span>Chất kia dùng dư → <b style="color:var(--ok)">tính theo ${c.lim.ten}</b></span></div>`;
  return { html: `<div class="pair">${colHTML}</div>${bal}<div class="pipe">${chain}</div><div class="final">${fin}</div><div class="formula" style="margin-top:8px">${formula}</div>`, c };
}
function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x))), f = x / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; }
function k4Chart(ds, opt) {
  const W = 560, H = 300, m = { l: 50, r: 16, t: 40, b: 46 }, N = ds.y.length;
  const lo = Math.min(...ds.y), hi = Math.max(...ds.y), sp = hi - lo;
  const st = niceStep((sp * 1.6) / 4);
  const y0 = Math.floor((lo - sp * .3) / st) * st; let y1 = Math.ceil((hi + sp * .25) / st) * st; if (hi <= 100 && y1 > 100) y1 = 100;
  const X = i => m.l + (i + .5) * (W - m.l - m.r) / N, Y = v => m.t + (1 - (v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const deltas = ds.y.slice(1).map((v, i) => v - ds.y[i]);
  const maxI = deltas.indexOf(Math.max(...deltas)), peak = ds.y.indexOf(hi);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${ds.yl}">`;
  for (let v = y0; v <= y1 + 1e-9; v += st) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--line);stroke-width:1"/><text x="${m.l - 8}" y="${Y(v) + 4}" class="svt s e mono">${vn(v, st < 1 ? 1 : 0)}</text>`;
  s += `<text x="${m.l}" y="20" class="svt s">${ds.yl}</text>`;
  if (opt.quiz) deltas.forEach((d, i) => s += `<rect class="gapz" data-i="${i}" x="${X(i) + 6}" y="${m.t - 6}" width="${X(i + 1) - X(i) - 12}" height="${H - m.t - m.b + 6}" rx="8" style="fill:${opt.pick === i ? (i === maxI ? 'var(--ok)' : 'var(--bad)') : 'var(--amber)'};opacity:${opt.pick === i ? .18 : .06}"/>`);
  const pts = ds.y.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  s += `<polyline points="${pts}" style="fill:none;stroke:var(--kc);stroke-width:3;stroke-linejoin:round;stroke-linecap:round" class="${RM ? '' : 'drawline'}"/>`;
  ds.y.forEach((v, i) => { s += `<circle cx="${X(i)}" cy="${Y(v)}" r="${i === peak && opt.peak ? 7 : 5}" style="fill:var(--surface);stroke:var(--kc);stroke-width:3"/><text x="${X(i)}" y="${Y(v) - 12}" class="svt s c mono">${vn(v, ds.d)}</text><text x="${X(i)}" y="${H - m.b + 20}" class="svt s c">${ds.x[i]}${ds.xu ? ' ' + ds.xu : ''}</text>`; });
  if (opt.delta) deltas.forEach((d, i) => { const x = (X(i) + X(i + 1)) / 2, y = H - m.b - 14, best = i === maxI; s += `${best ? `<rect x="${x - 26}" y="${y - 14}" width="52" height="20" rx="6" style="fill:var(--amber-soft);stroke:var(--amber)"/>` : ''}<text x="${x}" y="${y}" class="svt s c mono" style="fill:var(${d >= 0 ? '--ok' : '--bad'});font-weight:700">${d >= 0 ? '+' : '−'}${vn(Math.abs(d), ds.d)}</text>`; });
  if (opt.peak) s += `<text x="${X(peak)}" y="${Y(hi) - 30}" class="svt c" style="fill:var(--amber-ink);font-weight:800">▼ đỉnh (tối ưu)</text>`;
  return { svg: s + '</svg>', maxI, deltas };
}
LABS.k4 = function (el, pid) {
  const isBang = pid && pid.startsWith('bang');
  el.innerHTML = tabsHTML([['pipe', 'Chuỗi hiệu suất'], ['bang', 'Đọc bảng số liệu']], isBang ? 'bang' : 'pipe');
  const body = el.querySelector('.tabbody');
  const tabs = el.querySelectorAll('.tabs button');
  tabs.forEach(b => b.addEventListener('click', () => { tabs.forEach(x => x.classList.toggle('on', x === b)); b.dataset.t === 'pipe' ? pipeTab() : bangTab(); }));
  function pipeTab(rid) {
    rid = rid || (REACT[pid] ? pid : 'iaac');
    const R = REACT[rid];
    let inp = { cd: R.cd.map(c => ({ V: c.V ?? null, D: c.D ?? null, m: c.m ?? null })), H: R.H ?? 60, hh: R.hh ?? 0, mtt: R.mtt ?? 0, Dsp: R.sp.D ?? null };
    const f = (id, lab, val, step = 'any') => `<label>${lab}<input id="${id}" type="number" inputmode="decimal" step="${step}" value="${val}"></label>`;
    body.innerHTML = `<div class="lab-body"><div class="st"><div id="k4pipe"></div></div><div class="sd ctrl">
      <div><span class="lbl">Phản ứng</span>${segHTML('k4r', Object.entries(REACT).map(([k, r]) => [k, r.nhan]), rid)}</div>
      <div class="formula" style="white-space:normal">${fx(R.pt)}</div>
      <div><span class="lbl">Đổi số liệu để thử</span><div class="numin">
        ${R.cd.map((c, i) => c.du ? '' : c.V != null ? f(`k4v${i}`, `V ${c.ten} (mL)`, c.V) + f(`k4d${i}`, `D ${c.ten} (g/mL)`, c.D) : f(`k4m${i}`, `m ${c.ten} (g)`, c.m)).join('')}
        ${R.hoi === 'H' ? f('k4mtt', `m ${R.sp.ten} thu được (g)`, R.mtt) : f('k4H', 'Hiệu suất H (%)', R.H) + f('k4hh', 'Hao hụt (%)', R.hh) + (R.sp.D ? f('k4Dsp', `D ${R.sp.ten} (g/mL)`, R.sp.D) : '')}
      </div></div>
      <div class="rulebox"><b>Nhớ chuỗi:</b> V → (× D) → m → (÷ M) → n → so chất thiếu → n lí thuyết → (× M) → m lí thuyết → (× H) → (× (1 − hao hụt)) → m thu → (÷ D) → V.</div>
    </div></div>`;
    bindSeg('k4r', v => pipeTab(v));
    const read = () => {
      R.cd.forEach((c, i) => { if (c.du) return; if (c.V != null) { inp.cd[i].V = +$(`#k4v${i}`).value || 0; inp.cd[i].D = +$(`#k4d${i}`).value || 0; } else inp.cd[i].m = +$(`#k4m${i}`).value || 0; });
      if (R.hoi === 'H') inp.mtt = +$('#k4mtt').value || 0; else { inp.H = +$('#k4H').value || 0; inp.hh = +$('#k4hh').value || 0; if (R.sp.D) inp.Dsp = +$('#k4Dsp').value || 0; }
    };
    let tm = 0;
    const draw = (anim) => {
      const ok = R.cd.every((c, i) => c.du || (c.V != null ? inp.cd[i].V > 0 && inp.cd[i].D > 0 : inp.cd[i].m > 0));
      if (!ok) { $('#k4pipe').innerHTML = '<p class="muted">Nhập số dương cho mọi ô.</p>'; return; }
      const p = k4Pipe(R, inp); $('#k4pipe').innerHTML = p.html;
      const nodes = $$('#k4pipe .pnode, #k4pipe .balance, #k4pipe .final, #k4pipe .formula');
      if (!anim || RM) { nodes.forEach(n => n.classList.add('on')); $$('#k4pipe .pnode').forEach(n => n.classList.add('on')); return; }
      $$('#k4pipe .balance, #k4pipe .final, #k4pipe .formula').forEach(n => { n.style.opacity = 0; n.style.transition = 'opacity .4s'; });
      nodes.forEach((n, i) => setTimeout(() => { n.classList.add('on'); n.style.opacity = ''; }, 160 * i));
    };
    body.querySelectorAll('.numin input').forEach(x => x.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { read(); draw(false); }, 250); }));
    draw(true);
  }
  function bangTab() {
    let dsid = pid === 'bang-p3' ? 'p3' : 'q7', opt = { delta: false, peak: false, quiz: true, pick: null };
    body.innerHTML = `<div class="lab-body"><div class="st"><div class="stage chart" id="k4chart" style="padding:6px"></div><p class="stage-cap" id="k4cap"></p></div><div class="sd ctrl">
      <div><span class="lbl">Bảng số liệu</span>${segHTML('k4ds', Object.entries(DATASETS).map(([k, d]) => [k, d.nhan]), dsid)}</div>
      <div><span class="lbl">Kính soi</span><div class="seg" id="k4opt"><button type="button" data-o="delta">Hiện hiệu số</button><button type="button" data-o="peak">Đánh dấu đỉnh</button></div></div>
      <div class="rulebox"><b>3 câu hỏi của bảng số liệu:</b><ul><li>"Tăng nhiều nhất" → hiệu số giữa hai mốc liền kề lớn nhất, <b>không</b> phải chỗ cao nhất.</li><li>"Tối ưu" → đỉnh của dãy.</li><li>"Càng… càng" → phải đúng trên <b>cả dãy</b>; có đỉnh hay mức tăng nhỏ dần là sai.</li></ul></div>
    </div></div>`;
    const draw = () => {
      const ds = DATASETS[dsid], ch = k4Chart(ds, opt);
      $('#k4chart').innerHTML = ch.svg;
      $$('#k4opt button').forEach(b => b.classList.toggle('on', opt[b.dataset.o]));
      const cap = $('#k4cap');
      if (opt.pick == null) cap.innerHTML = '<b>Thử:</b> bấm vào khoảng giữa hai điểm mà em nghĩ hiệu suất <b>tăng nhiều nhất</b>.';
      else if (opt.pick === ch.maxI) cap.innerHTML = `<b style="color:var(--ok)">Đúng.</b> Khoảng ${ds.x[ch.maxI]} → ${ds.x[ch.maxI + 1]} tăng ${vn(ch.deltas[ch.maxI], ds.d)}, lớn nhất trong các hiệu số.`;
      else cap.innerHTML = `<b style="color:var(--bad)">Chưa đúng.</b> Khoảng này tăng ${vn(ch.deltas[opt.pick], ds.d)}. Bật "Hiện hiệu số" để so từng khoảng.`;
      $$('#k4chart .gapz').forEach(g => g.addEventListener('click', () => { const was = opt.pick; opt.pick = +g.dataset.i; if (opt.pick === ch.maxI && was !== ch.maxI) { addXP('k4'); const r = g.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 30); } draw(); }));
    };
    bindSeg('k4ds', v => { dsid = v; opt.pick = null; draw(); });
    $$('#k4opt button').forEach(b => b.addEventListener('click', () => { opt[b.dataset.o] = !opt[b.dataset.o]; draw(); }));
    draw();
  }
  isBang ? bangTab() : pipeTab();
};

/* ============================================================
   K5 — SOI PHÂN TỬ
   ============================================================ */
function svgFml(str, st) {
  let out = '', i = 0; const s = String(str);
  while (i < s.length) {
    if (/\d/.test(s[i])) {
      let j = i; while (j < s.length && /\d/.test(s[j])) j++;
      const dg = s.slice(i, j), prev = i > 0 ? s[i - 1] : st.last || '';
      if (/[A-Za-z\)]/.test(prev)) { out += `<tspan dy="${6 - st.off}" font-size="72%">${dg}</tspan>`; st.off = 6; }
      else { out += st.off ? `<tspan dy="${-st.off}">${dg}</tspan>` : dg; st.off = 0; }
      i = j;
    } else { let j = i; while (j < s.length && !/\d/.test(s[j])) j++; const run = esc(s.slice(i, j)); out += st.off ? `<tspan dy="${-st.off}">${run}</tspan>` : run; st.off = 0; i = j; }
  }
  st.last = s[s.length - 1];
  return out;
}
function segText(seg) { const st = { off: 0, last: '' }; return seg.map(([t, g]) => g ? `<tspan data-g="${g}" class="gseg">${svgFml(t, st)}</tspan>` : svgFml(t, st)).join(''); }
function molSVG(m) {
  let s = `<svg viewBox="0 0 520 290" role="img" aria-label="Cấu tạo ${m.ten}"><g class="hlbox"></g>`;
  const info = { verts: [], cx: 0, cy: 0 };
  if (m.ring) {
    const long = m.subs.some(x => (x.pos === 1 || x.pos === 2) && x.seg.map(z => z[0]).join('').length > 5);
    const cx = long ? 150 : 230, cy = 150, R = 54; info.cx = cx; info.cy = cy;
    for (let i = 0; i < 6; i++) { const a = (-90 + 60 * i) * Math.PI / 180; info.verts.push([cx + R * Math.cos(a), cy + R * Math.sin(a), Math.cos(a), Math.sin(a)]); }
    s += `<polygon points="${info.verts.map(v => v[0].toFixed(1) + ',' + v[1].toFixed(1)).join(' ')}" data-g="r" class="ringb" style="fill:none;stroke:var(--ink);stroke-width:2.6;stroke-linejoin:round"/>`;
    [[0, 1], [2, 3], [4, 5]].forEach(([a, b], k) => { const A = info.verts[a], B = info.verts[b]; const sh = (p) => [cx + (p[0] - cx) * .78, cy + (p[1] - cy) * .78]; const p1 = sh(A), p2 = sh(B); const q1 = [p1[0] + (p2[0] - p1[0]) * .12, p1[1] + (p2[1] - p1[1]) * .12], q2 = [p1[0] + (p2[0] - p1[0]) * .88, p1[1] + (p2[1] - p1[1]) * .88]; s += `<line x1="${q1[0].toFixed(1)}" y1="${q1[1].toFixed(1)}" x2="${q2[0].toFixed(1)}" y2="${q2[1].toFixed(1)}" data-g="r" class="kek" data-k="${k}" style="stroke:var(--ink);stroke-width:2.6;stroke-linecap:round"/>`; });
    m.subs.forEach(sb => {
      const [vx, vy, ux, uy] = info.verts[sb.pos];
      s += `<line x1="${vx}" y1="${vy}" x2="${vx + ux * 22}" y2="${vy + uy * 22}" style="stroke:var(--ink);stroke-width:2.6;stroke-linecap:round"/>`;
      const tx = vx + ux * 28, ty = vy + uy * 28 + (sb.pos === 0 ? -2 : sb.pos === 3 ? 16 : 8);
      const anc = Math.abs(ux) < .3 ? 'middle' : ux > 0 ? 'start' : 'end';
      s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}" style="font:600 22px var(--f-body);fill:var(--ink)">${segText(sb.seg)}</text>`;
    });
  } else {
    s += `<text x="260" y="156" text-anchor="middle" style="font:600 30px var(--f-body);fill:var(--ink)">${segText(m.chain)}</text>`;
  }
  s += `<g class="brs"></g></svg>`;
  return { svg: s, info };
}
const GLB = { ester: 'Nhóm ester (–COO– gắn gốc alkyl)', esterph: 'Ester của phenol (O gắn thẳng vào vòng)', cooh: 'Nhóm –COOH', ohph: '–OH phenol', ohal: '–OH alcohol', cc: 'Liên kết C=C', ring: 'Vòng benzene' };
function molEval(m, rid) {
  const parts = []; let total = 0, note = '', big = '', unit = '';
  const G = Object.entries(m.g);
  if (rid === 'naoh') {
    G.forEach(([id, g]) => { const v = { ester: 1, esterph: 2, cooh: 1, ohph: 1 }[g.t] || 0; if (v) { parts.push({ id, lb: GLB[g.t] + (g.n > 1 ? ` ×${g.n}` : ''), v: v * (g.n || 1) }); } });
    total = parts.reduce((a, p) => a + p.v, 0); big = `1 : ${total}`; unit = 'tỉ lệ mol với NaOH';
    if (G.some(([, g]) => g.t === 'esterph')) note = 'Ester của phenol tốn 2 NaOH: 1 để thuỷ phân, 1 để trung hoà phenol vừa sinh ra.';
  } else if (rid === 'h2') {
    if (m.ring) parts.push({ id: 'r', lb: GLB.ring, v: 3 });
    G.forEach(([id, g]) => { if (g.t === 'cc') parts.push({ id, lb: GLB.cc, v: 1 }); });
    total = parts.reduce((a, p) => a + p.v, 0); big = total ? `1 : ${total}` : 'Không cộng'; unit = 'tỉ lệ mol với H₂ (Ni, t°)';
    note = 'C=O trong –COO– và –COOH không cộng H₂ (Ni, t°).';
  } else if (rid === 'br2') {
    G.forEach(([id, g]) => { if (g.t === 'cc') parts.push({ id, lb: GLB.cc + ' (cộng)', v: 1 }); });
    const oh = G.filter(([, g]) => g.t === 'ohph');
    let free = [];
    if (m.ring && oh.length) {
      const occ = new Set(m.subs.map(x => x.pos));
      oh.forEach(([, g]) => [1, 5, 3].forEach(k => { const p = (g.pos + k) % 6; if (!occ.has(p) && !free.includes(p)) free.push(p); }));
      if (free.length) parts.push({ id: 'r', lb: `Vòng phenol: vị trí o/p còn trống (thế)`, v: free.length });
    } else if (m.ring) note = 'Vòng không có –OH gắn trực tiếp nên không thế với nước bromine.';
    total = parts.reduce((a, p) => a + p.v, 0); big = total ? `1 : ${total}` : 'Không phản ứng'; unit = 'tỉ lệ mol với nước bromine';
    if (m.note) note = (note ? note + ' ' : '') + m.note;
    return { parts, total, big, unit, note, free };
  } else if (rid === 'pi') {
    if (m.ring) parts.push({ id: 'r', lb: GLB.ring, v: 3 });
    G.forEach(([id, g]) => { if (g.t === 'cc') parts.push({ id, lb: GLB.cc, v: 1 }); if (['ester', 'esterph', 'cooh'].includes(g.t)) parts.push({ id, lb: 'C=O trong ' + (g.t === 'cooh' ? '–COOH' : '–COO–') + (g.n > 1 ? ` ×${g.n}` : ''), v: g.n || 1 }); });
    total = parts.reduce((a, p) => a + p.v, 0); big = `${total}`; unit = 'liên kết π';
  } else if (rid === 'chuc') {
    const map = { ester: 'ester', esterph: 'ester', cooh: 'acid', ohph: 'phenol', ohal: 'alcohol' };
    const types = {}; G.forEach(([id, g]) => { const t = map[g.t]; if (t) { types[t] = (types[t] || 0) + (g.n || 1); parts.push({ id, lb: 'Chức ' + t + (g.n > 1 ? ` ×${g.n}` : ''), v: g.n || 1 }); } });
    const k = Object.keys(types);
    big = k.length > 1 ? 'Tạp chức' : types[k[0]] > 1 ? 'Đa chức' : 'Đơn chức'; unit = k.length > 1 ? 'các nhóm chức khác loại' : types[k[0]] > 1 ? 'nhiều nhóm chức cùng loại' : 'một nhóm chức';
  } else if (rid === 'geo') {
    const cc = G.filter(([, g]) => g.t === 'cc');
    if (!cc.length) { big = 'Không'; unit = 'không có C=C ngoài vòng'; }
    else { let yes = false; cc.forEach(([id, g]) => { const [L1, R1] = g.geo; const okL = L1[0] !== L1[1], okR = R1[0] !== R1[1]; if (okL && okR) yes = true; parts.push({ id, lb: `C trái: ${L1.join(', ')} ${okL ? '✓ khác nhau' : '✕ giống nhau'} · C phải: ${R1.join(', ')} ${okR ? '✓ khác nhau' : '✕ giống nhau'}`, v: '' }); }); big = yes ? 'Có' : 'Không'; unit = 'đồng phân hình học (cis/trans)'; }
  }
  return { parts, total, big, unit, note, free: [] };
}
function k5Apply(stage, m, rid, info) {
  const svg = stage.querySelector('svg'), r = molEval(m, rid);
  const ctm = svg.getScreenCTM(); if (!ctm) return r;
  const inv = ctm.inverse(), box = svg.querySelector('.hlbox'), sr = stage.getBoundingClientRect();
  $$('.fly', stage).forEach(f => f.remove());
  const toSvg = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(inv); };
  const ids = r.parts.map(p => p.id);
  svg.querySelectorAll('.gseg').forEach(t => { t.style.fill = ids.includes(t.dataset.g) ? 'var(--kc)' : ''; t.style.fontWeight = ids.includes(t.dataset.g) ? '800' : ''; });
  svg.querySelectorAll('[data-g="r"]').forEach(t => t.style.stroke = ids.includes('r') ? 'var(--kc)' : 'var(--ink)');
  svg.querySelectorAll('.kek').forEach((k, i) => { k.style.transition = 'opacity .5s'; k.style.transitionDelay = (i * .5) + 's'; k.style.opacity = rid === 'h2' ? .08 : 1; });
  let bh = '';
  r.parts.forEach((p, i) => {
    let rc;
    if (p.id === 'r') rc = { left: 0, top: 0, width: 0, height: 0, ring: true };
    else { const t = svg.querySelector(`.gseg[data-g="${p.id}"]`); if (!t) return; rc = t.getBoundingClientRect(); }
    let cx, cy;
    if (rc.ring) { const q = ctm; const pt = svg.createSVGPoint(); pt.x = info.cx; pt.y = info.cy; const sp = pt.matrixTransform(q); cx = sp.x; cy = sp.y; }
    else { const a = toSvg(rc.left, rc.top), b = toSvg(rc.right, rc.bottom); bh += `<rect x="${a.x - 5}" y="${a.y - 3}" width="${b.x - a.x + 10}" height="${b.y - a.y + 6}" rx="7" style="fill:var(--kc);fill-opacity:.14;stroke:var(--kc);stroke-width:1.5;--d:${i * .15}s" class="popin"/>`; cx = rc.left + rc.width / 2; cy = rc.top; }
    if (p.v !== '' && p.v != null) { const f = document.createElement('span'); f.className = 'fly'; f.textContent = typeof p.v === 'number' ? '+' + p.v : p.v; f.style.left = (cx - sr.left) + 'px'; f.style.top = (cy - sr.top) + 'px'; f.style.animationDelay = (RM ? 0 : i * .18) + 's'; stage.appendChild(f); }
  });
  box.innerHTML = bh;
  const brs = svg.querySelector('.brs'); let bs = '';
  if (rid === 'br2' && r.free && r.free.length) r.free.forEach((p, i) => { const [vx, vy, ux, uy] = info.verts[p]; bs += `<g class="popin" style="--d:${.3 + i * .25}s"><line x1="${vx}" y1="${vy}" x2="${vx + ux * 20}" y2="${vy + uy * 20}" style="stroke:var(--k2);stroke-width:2.6"/><text x="${vx + ux * 34}" y="${vy + uy * 34 + 7}" text-anchor="middle" style="font:800 20px var(--f-body);fill:var(--k2)">Br</text></g>`; });
  brs.innerHTML = bs;
  return r;
}
LABS.k5 = function (el, pid) {
  let tab = pid === 'ir' ? 'ir' : (K5_BUILDER[pid] ? 'gh' : 'tn');
  el.innerHTML = tabsHTML([['tn', 'Tác nhân "hỏi" từng nhóm'], ['gh', 'Gốc acid · gốc alcohol'], ['ir', 'Phổ IR']], tab);
  const body = el.querySelector('.tabbody');
  el.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { el.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); ({ tn: tnTab, gh: ghTab, ir: irTab })[b.dataset.t](); }));
  function tnTab() {
    let [mid, rid] = Array.isArray(pid) ? pid : (K5_PRESETS[pid] || ['msal', 'naoh']);
    body.innerHTML = `<div class="lab-body"><div class="st"><div class="stage mol-stage" id="k5stage"><div class="grid-bg"></div><div id="k5svg"></div></div><div id="k5res" style="margin-top:12px"></div></div><div class="sd ctrl">
      <div><label class="lbl" for="k5mol">Phân tử</label><select class="sel" id="k5mol">${MOL_ORDER.map(k => `<option value="${k}">${MOLS[k].ten} (${U(MOLS[k].ct)})</option>`).join('')}</select></div>
      <div><span class="lbl">Tác nhân / câu hỏi</span>${segHTML('k5r', REAGENTS.map(r => [r.id, r.nhan]), rid)}</div>
      <div class="rulebox">${fx('<b>Bảng đếm nhanh</b><ul><li>{NaOH}: ester thường 1 · ester của phenol 2 · –COOH 1 · –OH phenol 1 · –OH alcohol 0</li><li>{Br2} (nước): C=C cộng 1 · vòng có –OH phenol: thế vào o/p còn trống</li><li>{H2} (Ni, t°): C=C 1 · vòng benzene 3 · C=O của –COO– không cộng</li><li>π: vòng 3 · mỗi C=O 1 · mỗi C=C 1</li></ul>')}</div>
      <p class="muted" style="font-size:13px;margin:0" id="k5mui"></p>
    </div></div>`;
    const sel = $('#k5mol'); sel.value = mid;
    const run = () => {
      const m = MOLS[mid], R = REAGENTS.find(x => x.id === rid);
      const { svg, info } = molSVG(m); $('#k5svg').innerHTML = svg;
      $('#k5mui').innerHTML = m.mui ? `${m.ten} có mùi ${m.mui}.` : '';
      requestAnimationFrame(() => {
        const r = k5Apply($('#k5stage'), m, rid, info);
        $('#k5res').innerHTML = `<div class="bigratio"><b>${r.big}</b><span>${fx(R.hoi)} · ${m.ten}</span></div>
        <div class="contrib">${r.parts.map((p, i) => `<div style="animation-delay:${RM ? 0 : i * .1}s"><span>${p.lb}</span><b>${typeof p.v === 'number' ? '+' + p.v : ''}</b></div>`).join('') || '<div><span>Không có nhóm nào phản ứng</span><b>0</b></div>'}</div>
        ${r.note ? `<p class="stage-cap">${fx(r.note)}</p>` : ''}`;
      });
    };
    sel.addEventListener('change', () => { mid = sel.value; run(); });
    bindSeg('k5r', v => { rid = v; run(); });
    run();
  }
  function ghTab() {
    let [aid, lid] = K5_BUILDER[pid] || ['acet', 'iaoh'];
    body.innerHTML = `<div class="lab-body"><div class="st"><div class="stage" id="k5gh"><div class="grid-bg"></div><div id="k5ghs"></div></div><div id="k5ghr" style="margin-top:12px"></div></div><div class="sd ctrl">
      <div class="numin"><label>Acid<select class="sel" id="k5a">${ACIDS.map(a => `<option value="${a.id}">${a.ten}</option>`).join('')}</select></label><label>Alcohol / phenol<select class="sel" id="k5l">${ALCS.map(a => `<option value="${a.id}">${a.ten}</option>`).join('')}</select></label></div>
      <button class="btn pri sm" type="button" id="k5go" style="justify-self:start">▶ Ghép lại</button>
      <div class="rulebox"><b>Acid mất –OH, alcohol mất H.</b> O nối hai gốc trong ester là O của alcohol (thí nghiệm đánh dấu O-18). Tên ester = tên gốc alcohol + tên gốc acid (đuôi "ate"). Công thức: <b>R–COO–R′</b>, R từ acid đứng trước.</div>
      <div class="game" id="k5quiz"></div>
    </div></div>`;
    $('#k5a').value = aid; $('#k5l').value = lid;
    const run = () => {
      const A = ACIDS.find(x => x.id === aid), Lc = ALCS.find(x => x.id === lid);
      const st = { off: 0, last: '' }, Rf = svgFml(A.R, st); const st2 = { off: 0, last: '' }, Lf = svgFml(Lc.R, st2);
      $('#k5ghs').innerHTML = `<svg viewBox="0 0 560 230" role="img" aria-label="Ghép acid và alcohol thành ester" class="gh ${Lc.phenol ? 'bad' : ''}">
        <text x="200" y="92" text-anchor="end" style="font:600 26px var(--f-body);fill:var(--amber-ink)">${Rf}–CO</text>
        <text x="202" y="92" class="ghOH" style="font:700 26px var(--f-body);fill:var(--acid)">–OH</text>
        <text x="268" y="92" text-anchor="middle" class="ghP" style="font:600 26px var(--f-body);fill:var(--muted)">+</text>
        <text x="292" y="92" class="ghH" style="font:700 26px var(--f-body);fill:var(--violet)">H–</text>
        <text x="318" y="92" class="ghR" style="font:600 26px var(--f-body);fill:var(--violet)">O–${Lf}</text>
        <text x="280" y="190" text-anchor="middle" class="ghW" style="font:700 22px var(--f-body);fill:var(--water);opacity:0">+ H<tspan dy="5" font-size="72%">2</tspan><tspan dy="-5">O</tspan></text>
        <text x="200" y="130" text-anchor="end" style="font:500 13px var(--f-body);fill:var(--muted)">gốc acid (từ ${A.ten})</text>
        <text x="330" y="130" class="ghRl" style="font:500 13px var(--f-body);fill:var(--muted)">gốc alcohol (từ ${Lc.ten})</text>
      </svg>`;
      const svg = $('#k5ghs svg');
      const name = `${Lc.ts} ${A.an}`, fml = (A.R === 'H' ? 'H' : A.R) + 'COO' + Lc.R, scent = SCENTS[`${lid}|${aid}`];
      $('#k5ghr').innerHTML = Lc.phenol
        ? `<div class="verdict" style="--kc:var(--bad)"><div class="vt">Không ester hoá trực tiếp được</div><p>Phenol hầu như không phản ứng ester hoá với carboxylic acid. Ester của phenol (như ${name}) được điều chế từ anhydride acid, giống cách tổng hợp aspirin ở Câu 8.</p></div>`
        : `<div class="bigratio"><b style="font-size:30px">${F(fml)}</b><span><b>${name}</b>${scent ? ' · ' + scent : ''}</span></div>`;
      setTimeout(() => svg && svg.classList.add('go'), RM ? 0 : 80);
    };
    $('#k5a').addEventListener('change', e => { aid = e.target.value; run(); });
    $('#k5l').addEventListener('change', e => { lid = e.target.value; run(); });
    $('#k5go').addEventListener('click', run);
    run();
    const quiz = () => {
      const A = pick(ACIDS), Lc = pick(ALCS.filter(x => !x.phenol));
      const opts = shuffle([A, ...shuffle(ACIDS.filter(x => x !== A)).slice(0, 2)]);
      const q = $('#k5quiz');
      q.innerHTML = `<div class="eyebrow" style="color:var(--kc)">Đọc ngược</div><div class="gq">Ester <b>${F((A.R === 'H' ? 'H' : A.R) + 'COO' + Lc.R)}</b> tạo từ acid nào?</div><div class="opts">${opts.map(o => `<button class="opt" type="button" data-a="${o.id}">${o.ten}</button>`).join('')}</div><div class="fb-line" id="k5qfb"></div>`;
      $$('#k5quiz .opt').forEach(b => b.addEventListener('click', () => {
        const ok = b.dataset.a === A.id; $$('#k5quiz .opt').forEach(x => { x.disabled = true; if (x.dataset.a === A.id) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong'); else { addXP('k5'); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
        $('#k5qfb').innerHTML = `Phần đứng trước "COO" là gốc acid: <b>${F(A.R === 'H' ? 'H' : A.R)}</b>– → ${A.ten}; phần sau là gốc alcohol. <button class="btn sec sm" type="button" id="k5qn">Câu khác</button>`;
        $('#k5qn').addEventListener('click', quiz);
      }));
    };
    quiz();
  }
  function irTab() {
    let sid = 'acoh', hide = false, ans = null;
    body.innerHTML = `<div class="lab-body"><div class="st"><div class="stage" style="padding:6px"><div id="k5ir"></div></div><p class="stage-cap" id="k5irc"></p></div><div class="sd ctrl">
      <div><span class="lbl">Chất</span>${segHTML('k5s', Object.entries(IR).map(([k, v]) => [k, v.ten]), sid)}</div>
      <div class="rulebox"><b>Chữ kí trên phổ</b><ul><li>Acid: O–H rất rộng (3 300–2 500) + C=O</li><li>Alcohol: O–H (3 650–3 200), không có C=O</li><li>Ester: C=O, không có O–H</li></ul><span class="muted">Dải C–O (1 300–1 000) có ở cả alcohol, acid và ester nên không dùng để phân biệt. Phổ ở đây là phổ minh hoạ theo bảng số sóng của đề.</span></div>
      <div class="game"><div class="eyebrow" style="color:var(--kc)">Đoán chất</div><p class="fb-line" style="margin-top:4px">Máy giấu tên, em nhìn phổ và đoán.</p><button class="btn pri sm" type="button" id="k5irq">Cho phổ bí ẩn</button><div class="opts" id="k5iro" style="margin-top:10px"></div><div class="fb-line" id="k5irf"></div></div>
    </div></div>`;
    const X = w => 50 + (4000 - w) / 3500 * 490, Y = t => 30 + (1 - t) * 200;
    const draw = () => {
      const d = IR[sid];
      let pts = '';
      for (let w = 4000; w >= 500; w -= 10) { let t = .95; d.bands.forEach(([, c, s, dep]) => t -= dep * Math.exp(-Math.pow((w - c) / s, 2))); pts += `${X(w).toFixed(1)},${Y(t).toFixed(1)} `; }
      let s = `<svg viewBox="0 0 560 270" role="img" aria-label="Phổ IR minh hoạ">`;
      IR_ZONES.forEach(([k, a, b, lb, col]) => s += `<rect x="${X(a)}" y="30" width="${X(b) - X(a)}" height="200" style="fill:var(${col});opacity:.13"/><text x="${(X(a) + X(b)) / 2}" y="22" class="svt s c" style="fill:var(${col === '--ester' ? '--amber-ink' : col === '--alc' ? '--violet' : '--k2'})">${lb}</text>`);
      for (let w = 4000; w >= 500; w -= 500) s += `<line x1="${X(w)}" y1="230" x2="${X(w)}" y2="235" style="stroke:var(--muted)"/><text x="${X(w)}" y="246" class="svt s c mono" style="font-size:10px">${w}</text>`;
      s += `<line x1="50" y1="230" x2="540" y2="230" style="stroke:var(--muted)"/><text x="546" y="262" class="svt s e">số sóng (cm⁻¹)</text>`;
      s += `<polyline points="${pts}" style="fill:none;stroke:var(--kc);stroke-width:2.4;stroke-linejoin:round" class="${RM ? '' : 'drawline'}"/>`;
      if (!hide) d.bands.forEach(([k, c, , dep]) => { if (k === 'ch') s += `<text x="${X(c)}" y="${Y(.95 - dep) + 16}" class="svt s c m">C–H</text>`; });
      $('#k5ir').innerHTML = s + '</svg>';
      $('#k5irc').innerHTML = hide ? 'Phổ bí ẩn: tìm dải O–H và dải C=O.' : `<b>${d.ten}:</b> ${d.ky}.`;
    };
    bindSeg('k5s', v => { sid = v; hide = false; draw(); $('#k5iro').innerHTML = ''; $('#k5irf').innerHTML = ''; });
    $('#k5irq').addEventListener('click', () => {
      sid = pick(Object.keys(IR)); hide = true; ans = sid; draw();
      $$('#k5s button').forEach(b => b.classList.remove('on'));
      $('#k5iro').innerHTML = Object.entries(IR).map(([k, v]) => `<button class="opt" type="button" data-s="${k}">${v.ten}</button>`).join(''); $('#k5irf').innerHTML = '';
      $$('#k5iro .opt').forEach(b => b.addEventListener('click', () => {
        const ok = b.dataset.s === ans; $$('#k5iro .opt').forEach(x => { x.disabled = true; if (x.dataset.s === ans) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong'); else { addXP('k5'); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
        hide = false; draw(); $('#k5irf').innerHTML = `${ok ? '<b style="color:var(--ok)">Đúng.</b>' : '<b style="color:var(--bad)">Chưa đúng.</b>'} ${IR[ans].ten}: ${IR[ans].ky}.`;
      }));
    });
    draw();
  }
  ({ tn: tnTab, gh: ghTab, ir: irTab })[tab]();
};

/* ============================================================
   K6 — TÍNH CHẤT VẬT LÍ
   ============================================================ */
function fatChain(F0, b) {
  const pts = [[0, 0]]; let th = -Math.PI / 2; const dbs = new Set(F0.db);
  for (let i = 1; i < F0.C; i++) {
    const z = (i % 2 ? 1 : -1) * Math.PI / 6, p = pts[i - 1];
    pts.push([p[0] + b * Math.cos(th + z), p[1] + b * Math.sin(th + z)]);
    if (dbs.has(i)) th += 0.66;
  }
  return pts;
}
function fatCanvas(cv, getState) {
  const ctx = cv.getContext('2d'); let raf = 0, C = {};
  const col = () => { C = { ink: cssv('--ink-2'), acc: cssv('--k6'), head: cssv('--acid'), muted: cssv('--muted'), ink0: cssv('--ink'), ok: cssv('--teal-ink'), am: cssv('--amber-ink') }; };
  col();
  const mol = {};
  function geo(id) { if (!mol[id]) { const pts = fatChain(FATS[id], 10); let mnx = 1e9, mxx = -1e9; pts.forEach(p => { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); }); mol[id] = { pts, w: mxx - mnx, cx: (mnx + mxx) / 2 }; } return mol[id]; }
  function drawPanel(id, x0, w, T, t) {
    const f = FATS[id], g = geo(id), liquid = Math.max(0, Math.min(1, (T - f.tnc + 3) / 6));
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, w, 400); ctx.clip();
    const n = w > 400 ? 7 : 4, gap = Math.max(g.w, 8) + 10, total = gap * (n - 1), sx = x0 + w / 2 - total / 2;
    for (let i = 0; i < n; i++) {
      const ph = i * 1.7 + (id.length * .9);
      const amp = 1 + (T - f.tnc > 0 ? (T - f.tnc) / 40 : 0);
      const x = sx + i * gap - g.cx + liquid * (Math.sin(t * .7 + ph) * 34 + Math.sin(t * 1.3 + ph * 2) * 14) * amp + Math.sin(t * 3 + ph) * .7;
      const y = 330 + liquid * Math.sin(t * .9 + ph * 1.7) * 26;
      const rot = liquid * Math.sin(t * .6 + ph) * .55 + Math.sin(t * 2 + ph) * .01;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath(); g.pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
      f.db.forEach(k => { const a = g.pts[k - 1], b = g.pts[k]; if (!a || !b) return; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * 4, ny = dx / L * 4; ctx.beginPath(); ctx.moveTo(a[0] + nx + dx * .15, a[1] + ny + dy * .15); ctx.lineTo(b[0] + nx - dx * .15, b[1] + ny - dy * .15); ctx.strokeStyle = C.acc; ctx.lineWidth = 2.6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
      ctx.beginPath(); ctx.arc(0, 4, 5.5, 0, Math.PI * 2); ctx.fillStyle = C.head; ctx.fill();
      ctx.restore();
    }
    ctx.textAlign = 'left'; ctx.fillStyle = C.ink0; ctx.font = '700 17px Lexend, system-ui, sans-serif'; ctx.fillText(f.ten, x0 + 16, 30);
    ctx.font = '500 13px Lexend, system-ui, sans-serif'; ctx.fillStyle = C.muted; ctx.fillText(`${f.C} C · ${f.db.length} C=C cis · nóng chảy ≈ ${f.tnc} °C`, x0 + 16, 50);
    const sol = T < f.tnc; ctx.font = '700 14px Lexend, system-ui, sans-serif'; ctx.fillStyle = sol ? C.ok : C.am; ctx.fillText(sol ? '● RẮN · xếp khít, chỉ rung tại chỗ' : '● LỎNG · các mạch trôi tự do', x0 + 16, 72);
    ctx.restore();
  }
  function frame(now) {
    if (!document.body.contains(cv)) { cancelAnimationFrame(raf); return; }
    const vr = cv.getBoundingClientRect(); if (!RM && (vr.bottom < 0 || vr.top > innerHeight)) { raf = requestAnimationFrame(frame); return; }
    const W = 640, H = 400, dpr = Math.min(2, window.devicePixelRatio || 1), cw = cv.clientWidth || 640, ch = cw * H / W;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    const s = getState(), t = RM ? 0 : now / 1000;
    if (s.b) { drawPanel(s.a, 0, 320, s.T, t); drawPanel(s.b, 320, 320, s.T, t); ctx.strokeStyle = C.muted; ctx.globalAlpha = .4; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(320, 20); ctx.lineTo(320, 380); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    else drawPanel(s.a, 0, 640, s.T, t);
    if (!RM) raf = requestAnimationFrame(frame);
  }
  const mo = new MutationObserver(col); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  raf = requestAnimationFrame(frame);
  return { redraw: () => { if (RM) requestAnimationFrame(frame); } };
}
LABS.k6 = function (el, pid) {
  let tab = pid === 'tan' ? 'tan' : 'fat';
  el.innerHTML = tabsHTML([['fat', 'Acid béo · nóng chảy'], ['tan', 'Tan hay nổi?']], tab);
  const body = el.querySelector('.tabbody');
  el.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { el.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); b.dataset.t === 'fat' ? fatTab() : tanTab(); }));
  function fatTab() {
    let [a, b] = Array.isArray(pid) ? pid : (K6_PRESETS[pid] || ['ole', null]); let T = 25;
    body.innerHTML = `<div class="lab-body"><div class="st"><div class="stage"><canvas class="fat-canvas" id="k6cv" aria-label="Mô hình các mạch acid béo xếp khít hay rời rạc theo nhiệt độ"></canvas></div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:12px"><label for="k6T" class="lbl" style="margin:0;white-space:nowrap">Nhiệt độ</label><input type="range" class="range" id="k6T" min="-20" max="80" step="1" value="25"><b class="mono" id="k6Tv" style="min-width:64px;text-align:right">25 °C</b></div>
      <p class="stage-cap">Kéo nhiệt độ qua điểm nóng chảy để thấy các mạch rời khỏi chỗ xếp. Mạch càng thẳng, xếp càng khít, càng khó tách.</p></div>
      <div class="sd ctrl">
        <div><span class="lbl">Acid béo</span>${segHTML('k6a', FAT_ORDER.map(k => [k, FATS[k].ten]), a)}</div>
        <div><label class="lbl" for="k6b">So sánh với</label><select class="sel" id="k6b"><option value="">Không so sánh</option>${FAT_ORDER.map(k => `<option value="${k}">${FATS[k].ten} (${U(FATS[k].ct)})</option>`).join('')}</select></div>
        <div class="verdict" id="k6v"></div>
        <div class="rulebox"><b>Hai yếu tố</b><ul><li>Mạch dài hơn → tương tác Van der Waals mạnh hơn → nóng chảy cao hơn.</li><li>Mỗi C=C cis làm mạch gấp khúc → xếp kém khít → nóng chảy thấp hơn.</li></ul><span class="muted">Nhiệt độ nóng chảy là số làm tròn thường dùng.</span></div>
      </div></div>`;
    $('#k6b').value = b || '';
    const cvs = fatCanvas($('#k6cv'), () => ({ a, b, T }));
    const verdict = () => {
      const A = FATS[a], B = b ? FATS[b] : null;
      let h;
      if (!B || b === a) h = `<div class="eyebrow" style="color:var(--kc)">${A.ct}</div><div class="vt">Nóng chảy ≈ ${A.tnc} °C</div><p>Ở ${T} °C: <b>${T < A.tnc ? 'rắn' : 'lỏng'}</b>. ${A.db.length ? `${A.db.length} liên kết C=C cis làm mạch gấp khúc.` : 'Acid no: mạch thẳng, xếp khít.'}</p>`;
      else {
        const hi = A.tnc >= B.tnc ? A : B, lo = hi === A ? B : A;
        const why = A.C === B.C ? 'Cùng số C: acid ít C=C hơn có nóng chảy cao hơn.' : A.db.length === B.db.length ? 'Cùng số C=C: mạch dài hơn có nóng chảy cao hơn.' : 'Khác cả số C lẫn số C=C: thường yếu tố gấp khúc (C=C cis) quyết định; muốn chắc phải dựa vào số liệu.';
        h = `<div class="eyebrow" style="color:var(--kc)">So sánh</div><div class="vt">${hi.ten} &gt; ${lo.ten}</div><p>${hi.tnc} °C so với ${lo.tnc} °C. ${why}</p>`;
      }
      $('#k6v').innerHTML = h;
    };
    bindSeg('k6a', v => { a = v; verdict(); cvs.redraw(); });
    $('#k6b').addEventListener('change', e => { b = e.target.value || null; verdict(); cvs.redraw(); });
    $('#k6T').addEventListener('input', e => { T = +e.target.value; $('#k6Tv').textContent = T + ' °C'; verdict(); cvs.redraw(); });
    verdict();
  }
  function tanTab() {
    const cell = (s, x, y) => {
      const W8 = x + 8, top = y + 50, bot = y + 128;
      let liq;
      if (s.tan) liq = `<rect x="${W8}" y="${top}" width="84" height="${bot - top}" style="fill:var(--water);opacity:.45"/><rect x="${W8}" y="${top}" width="84" height="${bot - top}" style="fill:var(${s.mau});opacity:.35;--d:1s" class="fadein"/>`;
      else if (s.D < 1) liq = `<rect x="${W8}" y="${top + 22}" width="84" height="${bot - top - 22}" style="fill:var(--water);opacity:.45"/><rect x="${W8}" y="${top}" width="84" height="22" style="fill:var(${s.mau});--d:.9s;--t:1s" class="liq growy"/>`;
      else liq = `<rect x="${W8}" y="${top}" width="84" height="${bot - top - 22}" style="fill:var(--water);opacity:.45"/><rect x="${W8}" y="${bot - 22}" width="84" height="22" style="fill:var(${s.mau});--d:.9s;--t:1s" class="liq growy"/>`;
      return `<g><clipPath id="tc${s.id}"><path d="M${x + 8},${y + 20} L${x + 8},${y + 122} Q${x + 8},${y + 130} ${x + 16},${y + 130} L${x + 84},${y + 130} Q${x + 92},${y + 130} ${x + 92},${y + 122} L${x + 92},${y + 20} Z"/></clipPath>
        <g clip-path="url(#tc${s.id})">${liq}</g>
        ${RM ? '' : `<circle cx="${x + 50}" cy="${y + 8}" r="6" style="fill:var(${s.mau});--h:${s.tan ? 50 : s.D < 1 ? 44 : 110}px" class="drip"/>`}
        <path d="M${x + 6},${y + 18} L${x + 6},${y + 122} Q${x + 6},${y + 132} ${x + 16},${y + 132} L${x + 84},${y + 132} Q${x + 94},${y + 132} ${x + 94},${y + 122} L${x + 94},${y + 18}" class="gln"/>
        <text x="${x + 106}" y="${y + 60}" class="svt">${s.ten}</text><text x="${x + 106}" y="${y + 78}" class="svt s">D = ${vnt(s.D)} g/mL</text><text x="${x + 106}" y="${y + 96}" class="svt s">${s.note}</text></g>`;
    };
    body.innerHTML = `<div class="lab-body"><div class="st"><div class="stage"><div class="grid-bg"></div>
      <svg viewBox="0 0 600 360" role="img" aria-label="Bốn chất: nặng nhẹ và tan không tan là hai chuyện độc lập">
        <text x="150" y="22" class="svt c" style="fill:var(--teal-ink)">NHẸ HƠN NƯỚC</text><text x="450" y="22" class="svt c" style="fill:var(--k2)">NẶNG HƠN NƯỚC</text>
        <line x1="300" y1="30" x2="300" y2="350" style="stroke:var(--line-2);stroke-dasharray:4 4"/><line x1="10" y1="190" x2="590" y2="190" style="stroke:var(--line-2);stroke-dasharray:4 4"/>
        <text x="16" y="44" class="svt s" style="font-weight:700">TAN VÔ HẠN</text><text x="16" y="206" class="svt s" style="font-weight:700">ÍT TAN</text>
        ${cell(SOLU[0], 20, 48)}${cell(SOLU[2], 320, 48)}${cell(SOLU[1], 20, 210)}${cell(SOLU[3], 320, 210)}
      </svg></div><p class="stage-cap">Cả bốn ô đều có thật: nhẹ mà tan, nhẹ mà không tan, nặng mà tan, nặng mà không tan.</p></div>
      <div class="sd ctrl">
        <div class="verdict"><div class="eyebrow" style="color:var(--kc)">Kết luận</div><div class="vt">Hai câu hỏi, hai nguyên nhân</div><p><b>Nằm trên hay dưới?</b> Do khối lượng riêng.<br><b>Tan hay không tan?</b> Do phân cực và khả năng tạo liên kết hydrogen với nước.<br>Câu "ít tan <i>vì</i> nhẹ hơn nước" ghép sai nguyên nhân.</p></div>
        <div class="rulebox"><b>Nhiệt độ sôi</b>: acetic acid (M = 60) sôi 117,9 °C; ethanol (M = 46) sôi 78,4 °C; ethyl acetate (M = 88) chỉ sôi 77,1 °C. Ester nặng hơn mà sôi thấp hơn vì giữa các phân tử ester không có liên kết hydrogen.</div>
      </div></div>`;
  }
  tab === 'fat' ? fatTab() : tanTab();
};
