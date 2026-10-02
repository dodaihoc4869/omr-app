/* ============================================================
   CÂU HỎI (8 câu đề thật + 4 đề luyện), MÁY RA ĐỀ, THẺ NHỚ, KHỞI ĐỘNG
   ============================================================ */
const SETS = { q: { list: QUESTIONS, bar: '#qbar', card: '#qcard' }, p: { list: PRACTICE, bar: '#pbar', card: '#pcard' } };
const curQ = { q: 'q1', p: 'p1' };
const timers = {};
const DANG = { ds: 'Đúng/Sai', dem: 'Đếm số nhận định đúng', sai: 'Tìm phát biểu sai', tn: 'Trắc nghiệm', tln: 'Trả lời ngắn' };
const HB = ['Bậc 1 · Gắn', 'Bậc 2 · Soi', 'Bậc 3 · Chốt'];
const ak = (q, y) => q.id + '_' + y.id;
const qDone = q => q.dang === 'tln' ? S.ans[q.id + '_tl'] != null : q.y.every(y => S.ans[ak(q, y)]);

function renderBar(set) {
  const { list, bar } = SETS[set];
  if (!list.some(x => x.id === curQ[set])) curQ[set] = list[0].id;
  $(bar).innerHTML = list.map((q, i) => `<button class="qchip ${curQ[set] === q.id ? 'on' : ''} ${qDone(q) ? 'done' : ''}" role="tab" aria-selected="${curQ[set] === q.id}" data-q="${q.id}" type="button"><span class="qn">${set === 'q' ? i + 1 : 'L' + (i + 1)}</span><b>${q.so}</b><small>${q.keys.slice(0, 2).map(k => KEYS[k].ten).join(' · ')}</small></button>`).join('');
  $$(bar + ' .qchip').forEach(b => b.addEventListener('click', () => { curQ[set] = b.dataset.q; renderBar(set); renderQ(set); }));
}
function flowHTML(q) {
  return q.dung.map((d, i) => `<div class="fstep" style="--d:${(RM ? 0 : i * .28).toFixed(2)}s"><span class="fi">${icon(d.ic)}</span><div><b>${fx(d.t)}</b><p>${fx(d.p)}</p>${d.io.length ? `<div class="io">${d.io.map(([c, t]) => `<span class="${c}">${fx(t)}</span>`).join('')}</div>` : ''}</div></div>`).join('');
}
function ganHTML(y, gan) {
  return `<div class="gan"><span>Nhịp GẮN: ý này dùng chìa khoá nào?</span>${Object.keys(KEYS).map(kk => `<button class="kchip ${gan && kk === y.k ? '' : 'ghost'}" type="button" data-gan="${kk}" style="--kc:var(${KEYS[kk].cv})" ${gan ? 'disabled' : ''}>${icon(KEYS[kk].ic)}${KEYS[kk].ten}</button>`).join('')}${gan ? (gan === y.k ? '<b style="color:var(--ok)">✓ Gắn đúng</b>' : `<b style="color:var(--warn)">Chìa khoá hợp nhất: ${KEYS[y.k].ten}</b>`) : ''}</div>`;
}
function resHTML(y, picked, dang) {
  const ok = picked === y.d, trap = y.bay ? TRAPS[y.bay] : null;
  return `<div class="res ${ok ? 'ok' : 'no'}"><div class="rv">${ok ? '✓ Chính xác' : '✕ Chưa đúng'} · ${dang === 'tn' ? (y.d === 'D' ? 'Phương án này: CHỌN' : 'Phương án này: LOẠI') : 'Đáp án: ' + (y.d === 'D' ? 'Đúng' : 'Sai')}${trap ? ` <span class="tchip" style="--mc:var(${trap.cv})">Bẫy: ${trap.ten}</span>` : ''}</div>
  <div><b>Soi:</b> ${fx(y.soi)}</div><div style="margin-top:4px"><b>Chốt:</b> ${fx(y.giai)}</div>
  ${y.lab ? `<div class="labl"><button class="btn sec sm" type="button" data-lab="${y.lab[0]}" data-p="${y.lab[1]}">Kiểm trong phòng thí nghiệm "${KEYS[y.lab[0]].ten}" →</button></div>` : ''}</div>`;
}
function stmtHTML(q, y) {
  const k = ak(q, y), picked = S.ans[k], lv = S.lv, gan = S.gan[k], needGan = lv === 'but' && !gan;
  const hints = S.hint[k] != null ? S.hint[k] : (lv === 'nen' ? 1 : 0);
  return `<div class="sitem ${picked ? (picked === y.d ? 'ok' : 'no') : ''}" data-y="${y.id}">
  <div class="srow"><span class="sl">${y.id}</span><div class="stx">${fx(y.t)}${lv !== 'but' ? `<div>${keyChip(y.k)}</div>` : ''}</div>
  <div class="dsbtn ${q.dang === 'tn' ? 'wide' : ''}">${['D', 'S'].map(v => `<button type="button" data-v="${v}" class="${picked === v ? 'pick' : ''}" ${picked || needGan ? 'disabled' : ''} aria-label="${q.dang === 'tn' ? (v === 'D' ? 'Chọn' : 'Loại') : (v === 'D' ? 'Đúng' : 'Sai')}" title="${needGan ? 'Gắn chìa khoá trước' : ''}">${q.dang === 'tn' ? (v === 'D' ? 'Chọn' : 'Loại') : (v === 'D' ? 'Đ' : 'S')}</button>`).join('')}</div></div>
  <div class="sx">${lv === 'but' ? ganHTML(y, gan) : ''}
  ${!picked ? `<div class="hintbar"><button class="hintbtn" type="button" data-hint ${hints >= 3 ? 'disabled' : ''}>${hints >= 3 ? 'Đã mở hết gợi ý' : 'Mở gợi ý ' + (hints + 1) + '/3'}</button></div>` : ''}
  ${picked ? '' : y.g.slice(0, hints).map((g, i) => `<div class="hint"><b>${HB[i]}:</b> ${fx(g)}</div>`).join('')}
  ${picked ? resHTML(y, picked, q.dang) : ''}</div></div>`;
}
const soVN = x => { const n = parseFloat(String(x).trim().replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? null : n; };
function tlHTML(q) {
  const t = q.tl, k = q.id + '_tl', val = S.ans[k], lv = S.lv;
  const hints = S.hint[k] != null ? S.hint[k] : (lv === 'nen' ? 1 : 0);
  const ok = val != null && soVN(val) !== null && Math.abs(soVN(val) - soVN(t.dapAn)) < 1e-9;
  const steps = (q.phepTinh || []).map(p => `<div><span>${fx(p.ten)}</span><b class="mono">${vnt(p.ketQua)}</b></div>`).join('');
  return `<div class="sitem tl ${val != null ? (ok ? 'ok' : 'no') : ''}"><div class="srow"><span class="sl">?</span><div class="stx">Nhập đáp số của em${t.donVi ? ' (' + fx(t.donVi) + ')' : ''}${lv !== 'but' ? `<div>${keyChip(t.k)}</div>` : ''}</div>
  <div class="gin"><input type="text" inputmode="decimal" autocomplete="off" aria-label="Đáp số" value="${val != null ? esc(val) : ''}" ${val != null ? 'disabled' : ''} style="width:110px"><button class="btn pri sm" type="button" data-tlcheck ${val != null ? 'disabled' : ''}>Kiểm tra</button></div></div>
  <div class="sx">${val == null ? `<div class="hintbar"><button class="hintbtn" type="button" data-tlhint ${hints >= 3 ? 'disabled' : ''}>${hints >= 3 ? 'Đã mở hết gợi ý' : 'Mở gợi ý ' + (hints + 1) + '/3'}</button></div>${t.g.slice(0, hints).map((g, i) => `<div class="hint"><b>${HB[i]}:</b> ${fx(g)}</div>`).join('')}` : ''}
  ${val != null ? `<div class="res ${ok ? 'ok' : 'no'}"><div class="rv">${ok ? '✓ Chính xác' : '✕ Chưa đúng'} · Đáp số: ${esc(t.dapAn)}${t.donVi ? ' ' + fx(t.donVi) : ''}${t.bay ? ` <span class="tchip" style="--mc:var(${TRAPS[t.bay].cv})">Bẫy hay gặp: ${TRAPS[t.bay].ten}</span>` : ''}</div>
    <div><b>Soi:</b> ${fx(t.soi)}</div><div style="margin-top:4px"><b>Chốt:</b> ${fx(t.giai)}</div>${steps ? `<div class="contrib" style="margin-top:8px">${steps}</div>` : ''}</div>` : ''}</div></div>`;
}
function bindTL(set, q, el) {
  const k = q.id + '_tl', w = $('.tlwrap', el);
  const again = () => { w.innerHTML = tlHTML(q); bindTL(set, q, el); $('.sc', el).textContent = scoreText(q); renderBar(set); };
  const btn = $('[data-tlcheck]', w), inp = $('input', w);
  const go = () => { if (S.ans[k] != null) return; const v = inp.value.trim(); if (!v || soVN(v) === null) { inp.focus(); return; } S.ans[k] = v; save(); bao('tra_loi_so', { y: 'tl', dung: Math.abs(soVN(v) - soVN(q.tl.dapAn)) < 1e-9 }); if (Math.abs(soVN(v) - soVN(q.tl.dapAn)) < 1e-9) { addXP(q.tl.k); const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); } again(); };
  if (btn) btn.addEventListener('click', go);
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  const h = $('[data-tlhint]', w); if (h) h.addEventListener('click', () => { const cur = S.hint[k] != null ? S.hint[k] : (S.lv === 'nen' ? 1 : 0); S.hint[k] = Math.min(3, cur + 1); save(); bao('goi_y', { y: 'tl', muc: S.hint[k] }); again(); });
}
function ttHTML(q, t, i) {
  const k = q.id + '_tt' + i, picked = S.ans[k];
  return `<div class="sitem tt ${picked ? (picked === t.d ? 'ok' : 'no') : ''}" data-tt="${i}"><div class="srow"><span class="sl">${i + 1}</span><div class="stx">${fx(t.t)}</div>
  <div class="dsbtn">${['D', 'S'].map(v => `<button type="button" data-v="${v}" class="${picked === v ? 'pick' : ''}" ${picked ? 'disabled' : ''} aria-label="${v === 'D' ? 'Đúng' : 'Sai'}">${v === 'D' ? 'Đ' : 'S'}</button>`).join('')}</div></div>
  ${picked ? `<div class="sx"><div class="res ${picked === t.d ? 'ok' : 'no'}"><div class="rv">${picked === t.d ? '✓ Chính xác' : '✕ Chưa đúng'} · Đáp án: ${t.d === 'D' ? 'Đúng' : 'Sai'}</div>${fx(t.giai)}</div></div>` : ''}</div>`;
}
function bindTT(q, it) {
  const i = +it.dataset.tt, t = q.tuongTu[i], k = q.id + '_tt' + i;
  $$('.dsbtn button', it).forEach(b => b.addEventListener('click', () => {
    if (S.ans[k]) return; S.ans[k] = b.dataset.v; save(); bao('tuong_tu', { y: 'tt' + i, dung: b.dataset.v === t.d });
    if (b.dataset.v === t.d) { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
    const tmp = document.createElement('div'); tmp.innerHTML = ttHTML(q, t, i); const nu = tmp.firstElementChild; it.replaceWith(nu); bindTT(q, nu);
  }));
}
function mcHTML(q) {
  const picked = S.mc[q.id], all = qDone(q);
  const nD = q.y.filter(y => S.ans[ak(q, y)] === 'D').length, sS = q.y.filter(y => S.ans[ak(q, y)] === 'S').map(y => y.id);
  const sD = q.y.filter(y => S.ans[ak(q, y)] === 'D').map(y => y.id);
  const note = !all ? (q.dang === 'tn' ? 'Soi hết 4 phương án ở trên rồi chốt.' : 'Làm hết từng nhận định ở trên rồi chốt đáp án.') : q.dang === 'dem' ? `Theo lựa chọn của em: ${nD} nhận định đúng.` : q.dang === 'tn' ? `Em đã để CHỌN: ${sD.join(', ') || 'chưa phương án nào'}.` : `Em đã chọn S cho: ${sS.join(', ') || 'không ý nào'}.`;
  return `<div class="mcfinal"><div class="h4" style="--bc:var(--ok)"><i>✓</i>${q.mc.hoi}</div><p class="muted" style="margin:0 0 10px;font-size:14px">${note}</p>
  <div class="opts">${q.mc.o.map(([L, t]) => `<button class="opt ${picked ? (L === q.mc.d ? 'right' : L === picked ? 'wrong' : '') : ''}" data-mc="${L}" type="button" ${picked ? 'disabled' : ''}><b>${L}.</b> ${fx(t)}</button>`).join('')}</div>
  ${picked ? `<div class="fb-line">${picked === q.mc.d ? '<b style="color:var(--ok)">Chính xác.</b>' : '<b style="color:var(--bad)">Chưa đúng.</b>'} ${fx(q.ket)}.</div>` : ''}</div>`;
}
function scoreText(q) {
  if (q.dang === 'tln') { const v = S.ans[q.id + '_tl']; return v == null ? 'Chờ em nhập đáp số' : (soVN(v) !== null && Math.abs(soVN(v) - soVN(q.tl.dapAn)) < 1e-9 ? 'Đúng đáp số · xong câu' : 'Chưa đúng đáp số · xem lời giải'); }
  const ans = q.y.filter(y => S.ans[ak(q, y)]), ok = ans.filter(y => S.ans[ak(q, y)] === y.d).length;
  return ans.length ? `${ok}/${ans.length} ý đúng${ans.length < q.y.length ? ` · còn ${q.y.length - ans.length} ý` : ' · xong câu'}` : `${q.y.length} ${q.dang === 'ds' ? 'ý' : 'nhận định'} chờ em chọn`;
}
function renderQ(set) {
  const { list, card } = SETS[set], el = $(card), lv = S.lv;
  if (!list.some(x => x.id === curQ[set])) curQ[set] = list[0].id;
  const q = list.find(x => x.id === curQ[set]);
  clearInterval(timers[set]);
  const idx = list.indexOf(q), last = idx === list.length - 1;
  const TEN_CO = { dapAn: 'Đáp án', hienThi: 'Hiển thị', loiDe: 'Đề' };
  const daChot = (q.daChot || []).map(c => `<li><b>${c.daXoa ? 'Giữ đáp án kho' : (TEN_CO[c.loai] || c.loai)}:</b> ${fx(c.chot || '')}${c.ghi ? ` <span class="muted">(máy soạn nêu: ${fx(c.ghi)})</span>` : ''}</li>`).join('');
  const chuaChot = (q.canThayChot || []).map(c => `<li>${fx(c)}</li>`).join('');
  const flag = !window.XEM_THU ? '' : (chuaChot ? `<div class="res no" style="margin:14px 20px 0"><div class="rv">⚑ Chờ máy chốt</div><ul style="margin:4px 0 0;padding-left:18px">${chuaChot}</ul></div>` : '')
    + (daChot ? `<div class="res ok" style="margin:14px 20px 0"><div class="rv">✓ Máy đã chốt (chỉ thầy thấy)</div><ul style="margin:4px 0 0;padding-left:18px">${daChot}</ul></div>` : '');
  el.innerHTML = flag + `<div class="qtop"><h3>${q.so} · ${fx(q.ten)}<small>${q.nguon} · ${DANG[q.dang]}</small></h3>
    <div class="kchips">${lv === 'but' ? '<span class="kchip ghost">Chìa khoá: em tự gắn</span>' : q.keys.map(k => keyChip(k)).join('')}</div>
    ${lv === 'but' ? `<span class="timer" id="${set}timer" aria-label="Thời gian làm câu">0:00</span>` : ''}</div>
  <div class="qgrid">
    <div class="de"><div class="h4"><i style="--bc:var(--ink)">Đ</i>Đề bài</div><div class="paper">${fx(q.de)}</div></div>
    <div><div class="h4" style="--bc:var(--k1)"><i>1</i>DỰNG · dòng chảy thí nghiệm</div>
    ${lv === 'but' ? `<div class="flowhide"><p class="muted" style="font-size:14px;margin:0 0 10px">Tự dựng dòng chảy ra nháp trước: cho gì vào → xảy ra gì → lấy ra gì → bỏ đi gì. Xong mới mở để so.</p><button class="btn sec sm" type="button" data-showflow>Mở dòng chảy để so</button></div><div class="flow hide">${flowHTML(q)}</div>`
      : `<div class="flow">${flowHTML(q)}</div><button class="btn sec sm" type="button" data-replay>↻ Chạy lại dòng chảy</button>`}
    </div></div>
  ${q.dang === 'tln' ? `<div class="stmts"><div class="h4" style="--bc:var(--k5)"><i>2–4</i>GẮN · SOI · CHỐT</div><div class="tlwrap">${tlHTML(q)}</div></div>`
    : `<div class="stmts"><div class="h4" style="--bc:var(--k5)"><i>2–4</i>GẮN · SOI · CHỐT từng ${q.dang === 'ds' ? 'ý' : q.dang === 'dem' ? 'nhận định' : q.dang === 'tn' ? 'phương án' : 'phát biểu'}</div>${q.y.map(y => stmtHTML(q, y)).join('')}</div>`}
  ${q.tuongTu && q.tuongTu.length ? `<div class="stmts tuong"><div class="h4" style="--bc:var(--k4)"><i>+</i>Tự thử câu tương tự</div>${q.tuongTu.map((t, i) => ttHTML(q, t, i)).join('')}</div>` : ''}
  ${q.mc ? `<div class="mcwrap">${mcHTML(q)}</div>` : ''}
  <div class="qfoot"><span class="sc">${scoreText(q)}</span><button class="btn sec sm" type="button" data-reset>Làm lại câu này</button><button class="btn pri sm" type="button" data-next>${last ? (set === 'q' ? 'Sang đề luyện mới' : 'Về câu đầu') : 'Câu tiếp'} →</button></div>`;
  $$('.sitem:not(.tt):not(.tl)', el).forEach(it => bindStmt(set, q, it));
  $$('.sitem.tt', el).forEach(it => bindTT(q, it));
  if (q.dang === 'tln') bindTL(set, q, el);
  bindMC(set, q, el);
  const rp = $('[data-replay]', el); if (rp) rp.addEventListener('click', () => { const f = $('.flow', el); f.innerHTML = flowHTML(q); });
  const sf = $('[data-showflow]', el); if (sf) sf.addEventListener('click', () => { $('.flowhide', el).classList.add('hide'); $('.flow', el).classList.remove('hide'); });
  $('[data-reset]', el).addEventListener('click', () => { q.y.forEach(y => { const k = ak(q, y); delete S.ans[k]; delete S.gan[k]; delete S.hint[k]; }); (q.tuongTu || []).forEach((t, i) => delete S.ans[q.id + '_tt' + i]); delete S.ans[q.id + '_tl']; delete S.hint[q.id + '_tl']; delete S.mc[q.id]; save(); renderBar(set); renderQ(set); });
  $('[data-next]', el).addEventListener('click', () => {
    if (last && set === 'q') { $('#luyen').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); return; }
    curQ[set] = list[last ? 0 : idx + 1].id; renderBar(set); renderQ(set);
    el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  });
  if (lv === 'but') { const t0 = Date.now(); timers[set] = setInterval(() => { const t = $(`#${set}timer`); if (!t) return clearInterval(timers[set]); const s = Math.floor((Date.now() - t0) / 1000); t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (qDone(q)) clearInterval(timers[set]); }, 1000); }
}
function refreshStmt(set, q, y) {
  const el = $(SETS[set].card), it = $(`.sitem[data-y="${y.id}"]`, el);
  const tmp = document.createElement('div'); tmp.innerHTML = stmtHTML(q, y); const nu = tmp.firstElementChild;
  it.replaceWith(nu); bindStmt(set, q, nu);
  $('.sc', el).textContent = scoreText(q);
  const mw = $('.mcwrap', el); if (mw) { mw.innerHTML = mcHTML(q); bindMC(set, q, el); }
  renderBar(set);
}
function bindStmt(set, q, it) {
  const y = q.y.find(z => z.id === it.dataset.y), k = ak(q, y);
  $$('.dsbtn button', it).forEach(b => b.addEventListener('click', () => {
    if (S.ans[k]) return;
    S.ans[k] = b.dataset.v; save(); bao('chon', { y: y.id, dung: b.dataset.v === y.d });
    if (b.dataset.v === y.d) { addXP(y.k); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }
    refreshStmt(set, q, y);
  }));
  const h = $('[data-hint]', it); if (h) h.addEventListener('click', () => { const cur = S.hint[k] != null ? S.hint[k] : (S.lv === 'nen' ? 1 : 0); S.hint[k] = Math.min(3, cur + 1); save(); bao('goi_y', { y: y.id, muc: S.hint[k] }); refreshStmt(set, q, y); });
  $$('[data-gan]', it).forEach(b => b.addEventListener('click', () => { if (S.gan[k]) return; S.gan[k] = b.dataset.gan; save(); bao('gan', { y: y.id, dung: b.dataset.gan === y.k }); refreshStmt(set, q, y); }));
  const lb = $('[data-lab]', it); if (lb) lb.addEventListener('click', () => openLab(lb.dataset.lab, lb.dataset.p, true));
}
function bindMC(set, q, el) {
  $$('[data-mc]', el).forEach(b => b.addEventListener('click', () => {
    if (S.mc[q.id]) return; S.mc[q.id] = b.dataset.mc; save(); bao('chot', { y: 'mc', dung: b.dataset.mc === q.mc.d });
    if (b.dataset.mc === q.mc.d) { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
    $('.mcwrap', el).innerHTML = mcHTML(q); bindMC(set, q, el);
  }));
}
function rerenderQuestions() { ['q', 'p'].forEach(s => { if ($(SETS[s].bar)) { renderBar(s); renderQ(s); } }); if ($('#gcard')) renderGen(); }

/* ============================================================
   MÁY RA ĐỀ
   ============================================================ */
function genSo() {
  const t = pick(['iaac', 'etac', 'asp', 'cin']);
  if (t === 'iaac') {
    const V1 = pick([10, 12, 15, 18, 20]), V2 = pick([8, 10, 12, 15, 20]), H = pick([50, 54, 60, 64, 70]), hh = pick([0, 4, 5, 6, 8, 10]);
    const n1 = V1 * 0.810 / 88, n2 = V2 * 1.049 / 60, n = Math.min(n1, n2), lim = n1 <= n2 ? 'isoamyl alcohol' : 'acetic acid';
    const m = n * 130 * H / 100 * (1 - hh / 100), V = m / 0.876;
    return { type: 'num', k: 'k4', q: `Đun ${V1} mL isoamyl alcohol (D = 0,810 g/mL) với ${V2} mL acetic acid (D = 1,049 g/mL), xúc tác {H2SO4} đặc. Hiệu suất ester hoá ${H}%${hh ? `, hao hụt ${hh}% khi tinh chế` : ''}. Tính thể tích isoamyl acetate (D = 0,876 g/mL) thu được, làm tròn đến hàng phần mười.`, ans: V, dp: 1, unit: 'mL',
      sol: `n(isoamyl alcohol) = ${V1} × 0,810 ÷ 88 = ${vn(n1, 4)} mol\nn(acetic acid) = ${V2} × 1,049 ÷ 60 = ${vn(n2, 4)} mol\n→ ${lim} thiếu, tính theo ${vn(n, 4)} mol\nm = ${vn(n, 4)} × 130 × ${vnt(H / 100)}${hh ? ` × ${vnt(+(1 - hh / 100).toFixed(2))}` : ''} = ${vn(m, 2)} g\nV = ${vn(m, 2)} ÷ 0,876 = ${vn(V, 1)} mL`, lab: ['k4', 'iaac'] };
  }
  if (t === 'etac') {
    const ma = pick([6, 9, 12, 15, 18]), Ve = pick([10, 15, 20, 23, 25, 30]), H = pick([50, 55, 60, 62, 65, 70, 75]);
    const na = ma / 60, ne = Ve * 0.79 / 46, n = Math.min(na, ne), lim = na <= ne ? 'acetic acid' : 'ethanol', m = n * 88 * H / 100;
    return { type: 'num', k: 'k4', q: `Đun ${ma} gam acetic acid với ${Ve} mL ethanol (D = 0,79 g/mL), xúc tác {H2SO4} đặc. Hiệu suất ester hoá ${H}%. Tính khối lượng ethyl acetate thu được, làm tròn đến hàng phần trăm.`, ans: m, dp: 2, unit: 'g',
      sol: `n(acetic acid) = ${ma} ÷ 60 = ${vn(na, 4)} mol\nn(ethanol) = ${Ve} × 0,79 ÷ 46 = ${vn(ne, 4)} mol\n→ ${lim} thiếu, tính theo ${vn(n, 4)} mol\nm = ${vn(n, 4)} × 88 × ${vnt(H / 100)} = ${vn(m, 2)} g`, lab: ['k4', 'etac'] };
  }
  if (t === 'asp') {
    const ns = pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]), ms = +(ns * 138).toFixed(1), Va = pick([15, 20, 30, 40, 50, 70]), H0 = pick([50, 56, 60, 64, 70, 75, 80, 85]);
    const na = Va * 1.08 / 102, n = Math.min(ns, na), lim = ns <= na ? 'salicylic acid' : 'acetic anhydride';
    const mtt = +(n * 180 * H0 / 100).toFixed(1), H = mtt / (n * 180) * 100;
    return { type: 'num', k: 'k4', q: `Cho ${vnt(ms)} gam salicylic acid tác dụng với ${Va} mL acetic anhydride (D = 1,08 g/mL), xúc tác {H2SO4}, thu được ${vnt(mtt)} gam aspirin. Tính hiệu suất phản ứng (%), làm tròn đến hàng đơn vị.`, ans: H, dp: 0, unit: '%',
      sol: `n(salicylic acid) = ${vnt(ms)} ÷ 138 = ${vn(ns, 4)} mol\nn(anhydride) = ${Va} × 1,08 ÷ 102 = ${vn(na, 4)} mol\n→ ${lim} thiếu, tính theo ${vn(n, 4)} mol\nm lí thuyết = ${vn(n, 4)} × 180 = ${vn(n * 180, 2)} g\nH = ${vnt(mtt)} ÷ ${vn(n * 180, 2)} × 100 = ${vn(H, 1)}% ≈ ${vn(H, 0)}%`, lab: ['k4', 'aspirin'] };
  }
  const n = pick([0.1, 0.15, 0.2, 0.25, 0.3]), mc = +(n * 148).toFixed(1), H = pick([40, 45, 50, 55, 60, 65, 70, 75, 80]), m = n * 162 * H / 100;
  return { type: 'num', k: 'k4', q: `Cho ${vnt(mc)} gam cinnamic acid ({C6H5CH=CHCOOH}) phản ứng với methanol dư, xúc tác {H2SO4} đặc. Hiệu suất ${H}%. Tính khối lượng methyl cinnamate thu được, làm tròn đến hàng phần trăm.`, ans: m, dp: 2, unit: 'g',
    sol: `Methanol dư → tính theo acid\nn(acid) = ${vnt(mc)} ÷ 148 = ${vn(n, 4)} mol\nm = ${vn(n, 4)} × 162 × ${vnt(H / 100)} = ${vn(m, 2)} g`, lab: ['k4', 'cin'] };
}
function genPt() {
  let mid, rid;
  do { mid = pick(MOL_ORDER); rid = pick(['naoh', 'naoh', 'h2', 'br2', 'pi']); } while (mid === 'sal' && rid === 'br2');
  const m = MOLS[mid], r = molEval(m, rid), v = r.total;
  let claim = Math.random() < .5 ? v : v + pick([-1, 1]); if (claim < 0) claim = v + 1;
  if (rid === 'naoh' && claim === 0) claim = v + 1;
  const nm = `${m.ten} (${F(m.ct)})`;
  const q = rid === 'naoh' ? `${nm} tác dụng tối đa với NaOH trong dung dịch theo tỉ lệ mol 1 : ${claim}.`
    : rid === 'h2' ? (claim ? `${nm} cộng tối đa {H2} (Ni, t°) theo tỉ lệ mol 1 : ${claim}.` : `${nm} không cộng {H2} (Ni, t°).`)
    : rid === 'br2' ? (claim ? `${nm} tác dụng tối đa với nước bromine theo tỉ lệ mol 1 : ${claim}.` : `${nm} không phản ứng với nước bromine.`)
    : `Phân tử ${nm} có ${claim} liên kết π.`;
  const why = (r.parts.length ? r.parts.map(p => `${p.lb} +${p.v}`).join('; ') : 'Không có nhóm nào phản ứng') + ` → ${r.big}${rid === 'pi' ? ' liên kết π' : ''}.` + (r.note ? ' ' + r.note : '');
  return { type: 'ds', k: 'k5', q, d: claim === v ? 'D' : 'S', why, lab: ['k5', [mid, rid]] };
}
const TACH_PAIRS = {
  chiet: [['ea', 'nuoc'], ['iaac', 'nuoc'], ['etacr', 'nuoc'], ['ether', 'nuoc'], ['dcm', 'nuoc'], ['iaoh', 'nuoc']],
  thuong: [['ea', 'ether'], ['iaac', 'ether'], ['iaac', 'dcm'], ['iaoh', 'ether'], ['iaac', 'meoh'], ['iaac', 'ea']],
  phandoan: [['iaac', 'iaoh'], ['iaoh', 'acoh'], ['iaac', 'acoh'], ['etoh', 'meoh'], ['etoh', 'nuoc'], ['meoh', 'nuoc']],
};
function genTach() {
  const kind = pick(Object.keys(TACH_PAIRS));
  let [A, B] = pick(TACH_PAIRS[kind]); if (Math.random() < .5 && B !== 'nuoc') [A, B] = [B, A];
  const r = k1Decide(A, B);
  const a = SUBS[A], b = SUBS[B], inf = s => `${s.ten}: sôi ${vnt(s.ts)} °C, D = ${vnt(s.D)}, ${TANTXT[s.tan]}`;
  const map = { chiet: 'Chiết', thuong: 'Chưng cất thường', phandoan: 'Chưng cất phân đoạn' };
  return { type: 'mc', k: 'k1', q: `Cần tách <b>${a.ten}</b> ra khỏi <b>${b.ten}</b>.<br><span style="font-size:14.5px;color:var(--ink-2)">${inf(a)}.<br>${inf(b)}.</span><br>Cách phù hợp nhất là`, opts: Object.values(map), a: map[r.kq], why: r.gates.map(g => g.a).join(' ') + ' ' + r.text, lab: ['k1', { A, B }] };
}
function genBeo() {
  const [a, b] = shuffle(FAT_ORDER).slice(0, 2), A = FATS[a], B = FATS[b];
  const hiC = Math.random() < .5 ? A : B, lo = hiC === A ? B : A;
  const d = hiC.tnc > lo.tnc ? 'D' : 'S', H = A.tnc > B.tnc ? A : B, L = H === A ? B : A;
  const why = (A.C === B.C ? 'Cùng số C: acid ít C=C hơn nóng chảy cao hơn.' : A.db.length === B.db.length ? 'Cùng số C=C: mạch dài hơn nóng chảy cao hơn.' : 'Khác cả số C lẫn số C=C: yếu tố gấp khúc (C=C cis) thường quyết định.') + ` ${H.ten} ≈ ${H.tnc} °C > ${L.ten} ≈ ${L.tnc} °C.`;
  return { type: 'ds', k: 'k6', q: `Nhiệt độ nóng chảy của ${hiC.ten} ({${hiC.ct}}) cao hơn của ${lo.ten} ({${lo.ct}}).`, d, why, lab: ['k6', [a, b]] };
}
function genAt() { const s = pick(SAFETY); return { type: 'ds', k: 'k2', q: s.t, d: s.d, why: s.why, lab: ['k2', null] }; }
const GENS = { so: ['Con số', genSo], pt: ['Phân tử', genPt], tach: ['Tách chất', genTach], beo: ['Acid béo', genBeo], at: ['An toàn', genAt] };
let gCur = 'so', gItem = null;
function renderGenTabs() {
  $('#gtabs').innerHTML = Object.entries(GENS).map(([k, g]) => `<button type="button" data-g="${k}" class="${k === gCur ? 'on' : ''}">${g[0]}</button>`).join('');
  $$('#gtabs button').forEach(b => b.addEventListener('click', () => { gCur = b.dataset.g; $$('#gtabs button').forEach(x => x.classList.toggle('on', x === b)); newGen(); }));
  newGen();
}
function newGen() { gItem = GENS[gCur][1](); renderGen(); }
function paintStreak() { $('#streak').innerHTML = `<span>Chuỗi đúng</span><b>${S.streak}</b><span>· kỉ lục ${S.best}</span>`; }
function genResult(ok, text) {
  if (ok) { S.streak++; S.best = Math.max(S.best, S.streak); addXP(gItem.k); } else S.streak = 0;
  save(); paintStreak(); gItem.done = true;
  $('#gFb').innerHTML = `<div class="res ${ok ? 'ok' : 'no'}" style="margin-top:12px"><div class="rv">${ok ? '✓ Chính xác' : '✕ Chưa đúng'}</div>${text}<div class="labl"><button class="btn sec sm" type="button" id="gLab">Mở phòng thí nghiệm "${KEYS[gItem.lab[0]].ten}"</button> <button class="btn pri sm" type="button" id="gNext2">Câu khác →</button></div></div>`;
  $('#gLab').addEventListener('click', () => openLab(gItem.lab[0], gItem.lab[1], true));
  $('#gNext2').addEventListener('click', newGen);
}
function renderGen() {
  if (!gItem) return;
  const it = gItem, c = $('#gcard'), K = KEYS[it.k];
  const hint = S.lv === 'nen' ? { so: 'Gợi ý: V → m → n → chọn chất thiếu → × M → × H → × (1 − hao hụt) → ÷ D.', pt: 'Gợi ý: tìm từng nhóm trên phân tử, tra bảng đếm nhanh của chìa khoá Soi phân tử rồi cộng.', tach: 'Gợi ý: hai chất có tách lớp không? Nếu không, so nhiệt độ sôi.', beo: 'Gợi ý: đếm số C và số C=C của từng acid trước.', at: 'Gợi ý: chất nào dễ cháy? Nguồn nhiệt có đủ nóng không? Nước vào đầu nào?' }[gCur] : '';
  let body = '';
  if (it.type === 'num') body = `<div class="gin"><label class="lbl" for="gIn" style="margin:0">Đáp số</label><input id="gIn" type="text" inputmode="decimal" autocomplete="off" placeholder="vd 10,4"><b>${it.unit}</b><button class="btn pri sm" type="button" id="gCheck">Kiểm tra</button><button class="btn sec sm" type="button" id="gNext">Câu khác</button></div>`;
  else if (it.type === 'ds') body = `<div class="gin"><div class="dsbtn" id="gDs"><button type="button" data-v="D" aria-label="Đúng">Đ</button><button type="button" data-v="S" aria-label="Sai">S</button></div><button class="btn sec sm" type="button" id="gNext">Câu khác</button></div>`;
  else body = `<div class="opts" id="gOpts">${it.opts.map(o => `<button class="opt" type="button" data-o="${o}">${o}</button>`).join('')}</div><div style="margin-top:10px"><button class="btn sec sm" type="button" id="gNext">Câu khác</button></div>`;
  c.innerHTML = `<div class="gctx">${keyChip(it.k)}<span>${it.type === 'num' ? 'Tự tính' : it.type === 'ds' ? 'Đúng hay Sai?' : 'Chọn một'}</span></div><div class="gq">${fx(it.q)}</div>${hint ? `<div class="hint" style="margin-bottom:12px">${hint}</div>` : ''}${body}<div id="gFb"></div>`;
  paintStreak();
  $('#gNext').addEventListener('click', newGen);
  if (it.type === 'num') {
    const go = () => {
      if (it.done) return;
      const raw = $('#gIn').value.trim().replace(',', '.'); const x = parseFloat(raw);
      if (!raw || isNaN(x)) { $('#gFb').innerHTML = '<p class="fb-line" style="color:var(--bad)">Nhập một con số, dùng dấu phẩy hoặc dấu chấm đều được.</p>'; return; }
      const tol = it.dp === 0 ? 0.6 : it.dp === 1 ? 0.11 : 0.021, ok = Math.abs(x - it.ans) <= tol;
      if (ok) { const r = $('#gCheck').getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
      genResult(ok, `<div>Đáp số: <b>${vn(it.ans, it.dp)} ${it.unit}</b></div><div class="steps-sol">${it.sol}</div>`);
    };
    $('#gCheck').addEventListener('click', go); $('#gIn').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  } else if (it.type === 'ds') {
    $$('#gDs button').forEach(b => b.addEventListener('click', () => {
      if (it.done) return; const ok = b.dataset.v === it.d; b.classList.add('pick'); $$('#gDs button').forEach(x => x.disabled = true);
      if (ok) { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
      genResult(ok, `<div>Đáp án: <b>${it.d === 'D' ? 'Đúng' : 'Sai'}</b>. ${fx(it.why)}</div>`);
    }));
  } else {
    $$('#gOpts .opt').forEach(b => b.addEventListener('click', () => {
      if (it.done) return; const ok = b.dataset.o === it.a;
      $$('#gOpts .opt').forEach(x => { x.disabled = true; if (x.dataset.o === it.a) x.classList.add('right'); }); if (!ok) b.classList.add('wrong');
      if (ok) { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
      genResult(ok, `<div>${fx(it.why)}</div>`);
    }));
  }
}

/* ============================================================
   THẺ NHỚ + BẢNG ĐÁP ÁN
   ============================================================ */
function renderCheat() {
  const Ms = [['acetic acid', 60], ['ethanol', 46], ['methanol', 32], ['ethyl acetate', 88], ['isoamyl alcohol', 88], ['isoamyl acetate', 130], ['acetic anhydride', 102], ['salicylic acid', 138], ['aspirin', 180], ['methyl salicylate', 152], ['cinnamic acid', 148], ['methyl cinnamate', 162]];
  const cards = [
    `<div class="panel cc"><h3 style="--kc:var(--k1)">${icon('i-blocks')}4 nhịp giải</h3><ul>${BEATS.map(b => `<li><b>${b.ten}</b>: ${b.p}</li>`).join('')}</ul></div>`,
    `<div class="panel cc"><h3 style="--kc:var(--k2)">${icon('i-lens')}7 kiểu bẫy</h3><ul>${Object.values(TRAPS).map(t => `<li><b style="color:var(${t.cv})">${t.ten}</b>: ${t.hoi}</li>`).join('')}</ul></div>`,
    `<div class="panel cc"><h3 style="--kc:var(--k4)">${icon('i-calc')}Khối lượng mol hay dùng</h3><div class="tbl" style="margin:0"><table style="min-width:0"><tbody>${Ms.map(([n, m], i) => i % 2 ? '' : `<tr><td style="text-align:left">${n}</td><td class="mono">${m}</td><td style="text-align:left">${Ms[i + 1][0]}</td><td class="mono">${Ms[i + 1][1]}</td></tr>`).join('')}</tbody></table></div></div>`,
    ...Object.values(KEYS).map(K => `<div class="panel cc"><h3 style="--kc:var(${K.cv})">${icon(K.ic)}${K.ten}</h3><p style="margin:0;font-size:14px;line-height:1.6">${fx(K.rule)}</p></div>`),
  ];
  $('#cheat').innerHTML = cards.join('');
  $$('#cheat h3 svg').forEach(s => s.style.color = 'var(--kc)');
  const tb = $('#ansTbl');
  tb.innerHTML = `<tr><th>#</th><th>Câu</th><th>Đáp án</th><th>Điểm cần nhớ</th></tr>` + QUESTIONS.map((q, i) => `<tr><td class="mono">${i + 1}</td><td>${q.so} · ${q.nguon}<br><span class="muted" style="font-size:13px">${fx(q.ten)}</span></td><td class="k blurred">${fx(q.ket)}</td><td class="blurred">${fx(q.nho)}</td></tr>`).join('');
  $('#ansToggle').addEventListener('click', () => { const on = $('#ansTbl .blurred') != null; $$('#ansTbl td').forEach(td => { if (td.cellIndex >= 2) td.classList.toggle('blurred', !on); }); $('#ansToggle').textContent = on ? 'Ẩn đáp án' : 'Hiện đáp án'; });
}

/* ============================================================
   KHỞI ĐỘNG
   ============================================================ */
function navSpy() {
  const links = $$('#nav a'), ids = links.map(a => a.getAttribute('href').slice(1));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
}
function init() {
  load(); buildRx();
  $$('.lv').forEach(b => b.addEventListener('click', () => setLevel(b.dataset.lv)));
  $('#lvlPill').addEventListener('click', () => { const o = ['nen', 'vung', 'but']; setLevel(o[(o.indexOf(S.lv) + 1) % 3]); });
  setLevel(S.lv, false);
  document.addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o) openLab(o.dataset.open, null, true); });
  if ($('#beats')) renderBeats(); if ($('#radarIn')) renderRadar(); renderKeys();
  const h = (location.hash || '').slice(1);
  openLab(KEYS[h] ? h : 'k1', null, !!KEYS[h]);
  ['q', 'p'].forEach(s => { if ($(SETS[s].bar)) { renderBar(s); renderQ(s); } });
  if ($('#gtabs')) renderGenTabs(); if ($('#cheat')) renderCheat(); paintXP();
  if ($('#heroCanvas')) heroCanvas(); navSpy();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
