/* ============================================================
   NHÚNG VÀO APP (Lời giải từng bước, 29/09): khung chạy trong iframe sandbox="allow-scripts" (không allow-same-origin),
   KHÔNG tự tải gì — app gửi { loai:'loi-giai', hoSo, cau, thay } qua postMessage. Hồ sơ khuôn 1.2 không chép đề:
   ghép chữ đề / ý / phương án từ `cau` (máy chủ đã thoát HTML) vào hồ sơ rồi vẽ bằng đúng khung Phòng thí nghiệm Ester.
   ============================================================ */
const KEYS_ESTER = Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, { ...v, q: [] }]));
const TRAPS_GOC = { ...TRAPS };
const MAU_KHOA = ['--k1', '--k2', '--k3', '--k4', '--k5', '--k6'];
const HINH_KHOA = ['i-key', 'i-hex', 'i-calc', 'i-flask', 'i-bolt', 'i-chart', 'i-lens'];
const openLabEster = openLab;
let daKhoiDong = false;

function datBo(ma) {
  const bo = BO_CAC_CHUONG[ma];
  Object.keys(KEYS).forEach(k => delete KEYS[k]);
  if (ma === 'ESTER' || !bo) Object.assign(KEYS, KEYS_ESTER);
  else Object.entries(bo.KEYS).forEach(([k, v], i) => { KEYS[k] = { ten: v.ten, rule: v.rule, ic: HINH_KHOA[i % HINH_KHOA.length], cv: MAU_KHOA[i % 6], short: '', q: [] }; });
  Object.keys(TRAPS).forEach(k => delete TRAPS[k]);
  Object.assign(TRAPS, TRAPS_GOC);
  Object.entries((bo && bo.TRAPS_THEM) || {}).forEach(([k, v]) => { TRAPS[k] = { ten: v.ten, hoi: v.hoi, g: '!', cv: '--k2', kw: [] }; });
  Object.keys(KEYS).forEach(k => { if (typeof S.xp[k] !== 'number') S.xp[k] = 0; });
  const la = ma === 'ESTER';
  // Chương không có phòng thí nghiệm ảo: bấm chìa khoá thì hiện quy tắc của chìa ấy.
  openLab = la ? openLabEster : (k) => {
    const K = KEYS[k] || KEYS[Object.keys(KEYS)[0]];
    $$('.key').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    // Quy tắc viết thành từng dòng "<b>Nhãn:</b> nội dung" nối bằng <br> (thầy yêu cầu 29/09: ngắt dòng, mạch lạc) ⇒ mỗi dòng một mục.
    const dong = String(K.rule).split(/<br\s*\/?>/i).map(x => x.trim()).filter(Boolean);
    $('#lab').style.setProperty('--kc', `var(${K.cv})`);
    $('#lab').innerHTML = `<div class="lab-top"><span class="kic">${icon(K.ic)}</span><h3>${K.ten}</h3></div>`
      + `<ul class="luat">${dong.map(x => `<li>${fx(x)}</li>`).join('')}</ul>`;
  };
  $('#nhanChuong').textContent = (bo && bo.chuong) || 'Hoá 12';
  $('#tieuDeKhoa').textContent = `${Object.keys(KEYS).length} chìa khoá chương ${(bo && bo.chuong) || ''}`.trim();
}

function ghep(hoSo, cau) {
  const q = Object.assign({}, hoSo, { id: cau.qid, so: cau.so, nguon: cau.nguon, chuong: cau.chuong, de: cau.de });
  q.y = (hoSo.y || []).map(y => Object.assign({}, y, { t: (cau.y || {})[y.id] || '' }));
  // Khuôn 1.2 chỉ lưu { d }; hồ sơ khuôn cũ (câu đếm / tìm phát biểu sai) mang sẵn câu hỏi chốt + lựa chọn riêng thì giữ.
  if (hoSo.mc) q.mc = hoSo.mc.o ? hoSo.mc : { hoi: 'Chọn đáp án', o: Object.entries(cau.y || {}), d: hoSo.mc.d };
  // Cờ đáp án chưa chốt ⇒ "Chờ máy chốt"; cờ đã có quyết định (`chot`) hoặc cờ sửa đề ⇒ "Máy đã chốt" (chỉ màn thầy hiện).
  q.canThayChot = (hoSo.co || []).filter(c => c.loai === 'dapAn' && !c.chot).map(c => c.ghi);
  q.daChot = (hoSo.daChot || []).map(c => ({ daXoa: true, ghi: c.ghi, chot: c.chot })).concat((hoSo.co || []).filter(c => !(c.loai === 'dapAn' && !c.chot)).map(c => ({ loai: c.loai, ghi: c.ghi, chot: c.chot || (c.sua ? `Sửa kho: “${c.sua.truoc}” → “${c.sua.sau}”` : c.ghi) })));
  q.tuongTu = hoSo.tuongTu || [];
  return q;
}

/* ============================================================
   ĐỌC TỪNG BƯỚC (Vòng học v2 GĐ2 — bậc 2 của thang tự gỡ, 02/10): khi app gửi kèm `kiem` { buoc[], cauKiem[], loiGo[] }.
   Bước mở dần. Bước then chốt có CÂU KIỂM: chữ bước bị che tới khi em trả lời — khung KHÔNG có đáp án, gửi câu trả lời lên trang mẹ
   ({loai:'khung-cau-kiem', buoc, traLoi}); trang mẹ hỏi máy chủ rồi trả {loai:'cau-kiem-kq', buoc, dung, dapAn?, tenNen?, loi?}.
   Đúng ⇒ hiện chữ bước + mở bước sau. Sai ⇒ hiện chữ bước làm giảng giải (+ đáp án khi máy chủ gửi) và cho thử lại.
   Bước không có câu kiểm: nút "Đã hiểu, sang bước sau". Lời thầy gỡ (loiGo) hiện ngay dưới bước, nhãn "Thầy gỡ".
   Báo thao tác: bao('mo_buoc', {y}) khi mở bước y; bao('kiem', {y, dung}) khi có kết quả câu kiểm.
   ============================================================ */
let KIEM = null;
let DTB = { mo: 0, xong: {}, kq: {}, cho: null, het: false };
const CSS_DTB = '#doc-buoc .dtb{padding:20px}#doc-buoc .dtb-ds{list-style:none;margin:0;padding:0;display:grid;gap:12px}'
  + '#doc-buoc .dtb-buoc{border:1px solid var(--line);border-radius:var(--r-m);padding:14px 16px;background:var(--surface)}'
  + '#doc-buoc .dtb-buoc.hien{border-color:var(--ink-2)}#doc-buoc .dtb-so{font:700 13px/1.2 var(--f-body);color:var(--muted);margin-bottom:6px}'
  + '#doc-buoc .dtb-chu{font-size:16px;line-height:1.6;color:var(--ink)}#doc-buoc .dtb-che{font-size:14.5px;color:var(--muted);font-style:italic}'
  + '#doc-buoc .dtb-go{margin-top:10px;padding:10px 12px;border-radius:12px;background:var(--warn-soft);font-size:15px;line-height:1.55;color:var(--ink)}'
  + '#doc-buoc .dtb-go b{display:block;font-size:13px;margin-bottom:2px}#doc-buoc .dtb-hoi{margin:10px 0 8px;font:600 15.5px/1.45 var(--f-body);color:var(--ink)}'
  + '#doc-buoc .dtb-nhap{display:flex;flex-wrap:wrap;gap:8px;align-items:center}#doc-buoc .dtb-nhap input{flex:1 1 140px;min-width:0;min-height:44px;border:1.5px solid var(--line-2);border-radius:12px;background:var(--surface);color:var(--ink);font:600 16px/1 var(--f-mono);padding:8px 12px}'
  + '#doc-buoc .btn{min-height:44px;touch-action:manipulation}#doc-buoc .opt{min-height:44px}#doc-buoc .res{margin-top:10px}'
  + '#doc-buoc :focus-visible{outline:3px solid var(--ink-2);outline-offset:2px}';

function moBuocDtb(i) { DTB.mo = Math.max(DTB.mo, i); bao('mo_buoc', { y: String(i) }); }
function kiemCua(i) { return KIEM ? (KIEM.cauKiem || []).find(k => k.buoc === i) : null; }

function veDocBuoc() {
  let sec = $('#doc-buoc');
  if (!KIEM || !(KIEM.buoc || []).length) { if (sec) sec.remove(); return; }
  if (!sec) {
    if (!$('#dtbCss')) { const st = document.createElement('style'); st.id = 'dtbCss'; st.textContent = CSS_DTB; document.head.appendChild(st); }
    sec = document.createElement('section'); sec.className = 'blk'; sec.id = 'doc-buoc';
    const tam = $('#tam-cau'); tam.parentNode.insertBefore(sec, tam);
  }
  const n = KIEM.buoc.length;
  const ds = [];
  for (let i = 0; i <= Math.min(DTB.mo, n - 1); i++) {
    const ck = kiemCua(i), kq = DTB.kq[i], xong = !!DTB.xong[i], hienChu = !ck || xong || (kq && kq.dung === false);
    const go = (KIEM.loiGo || []).filter(g => g.buoc === i).map(g => `<div class="dtb-go"><b>Thầy gỡ</b>${esc(g.noiDung)}</div>`).join('');
    let duoi = '';
    if (ck && !xong) {
      const dangCho = DTB.cho === i;
      const nhap = ck.kieu === 'chon'
        ? `<div class="opts" role="group" aria-label="Chọn câu trả lời">${(ck.lua_chon || []).map((t, j) => `<button class="opt" type="button" data-dtb-chon="${j}" ${dangCho ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>`
        : `<div class="dtb-nhap"><input id="dtbSo${i}" inputmode="decimal" autocomplete="off" aria-label="Con số em tính được ở bước ${i + 1}" ${dangCho ? 'disabled' : ''}><button class="btn pri sm" type="button" data-dtb-gui ${dangCho ? 'disabled' : ''}>${dangCho ? 'Đang kiểm…' : 'Kiểm tra'}</button></div>`;
      const sai = kq && kq.dung === false
        ? `<div class="res no" role="status"><div class="rv">Chưa đúng — em đọc cách làm bước này rồi thử lại</div>${kq.dapAn ? `<div>Đáp án của bước: <b>${esc(kq.dapAn)}</b></div>` : ''}${kq.tenNen ? `<div class="muted">Kiến thức nền của bước: ${esc(kq.tenNen)}</div>` : ''}</div>` : '';
      const loi = kq && kq.loi ? `<div class="res no" role="status">${esc(kq.loi)}</div>` : '';
      duoi = `<div class="dtb-hoi">${esc(ck.hoi)}</div>${nhap}${sai}${loi}`;
    } else if (ck && xong) {
      duoi = '<div class="res ok" role="status"><div class="rv">Đúng rồi</div></div>';
    } else if (!ck && i === DTB.mo && !xong) {
      duoi = `<div style="margin-top:10px"><button class="btn sec sm" type="button" data-dtb-hieu>${i === n - 1 ? 'Đã hiểu bước cuối' : 'Đã hiểu, sang bước sau'}</button></div>`;
    }
    const chu = hienChu ? `<div class="dtb-chu">${esc(KIEM.buoc[i]).replace(/\n/g, '<br>')}</div>` : '<div class="dtb-che">Chữ của bước này mở sau khi em trả lời câu hỏi dưới đây.</div>';
    ds.push(`<li class="dtb-buoc ${i === DTB.mo ? 'hien' : ''}" data-b="${i}"><div class="dtb-so">Bước ${i + 1} / ${n}</div>${chu}${go}${duoi}</li>`);
  }
  const het = DTB.het ? '<div class="res ok" role="status" style="margin-top:12px"><div class="rv">Em đã đọc hết các bước</div>Kéo xuống để tự làm lại từng ý của câu.</div>' : '';
  sec.innerHTML = `<div class="wrap"><div class="panel dtb"><div class="h4"><i style="--bc:var(--k1)">↓</i>Đọc từng bước</div>`
    + `<p class="muted" style="margin:0 0 12px;font-size:15px">Bước có câu hỏi nhỏ: em trả lời rồi mới mở bước sau.</p><ol class="dtb-ds">${ds.join('')}</ol>${het}</div></div>`;
  const li = $(`.dtb-buoc[data-b="${DTB.mo}"]`, sec);
  if (!li) return;
  const gui = (traLoi) => { if (DTB.cho !== null) return; DTB.cho = DTB.mo; DTB.kq[DTB.mo] = Object.assign({}, DTB.kq[DTB.mo] || {}, { loi: '' }); veDocBuoc(); parent.postMessage({ loai: 'khung-cau-kiem', buoc: DTB.cho, traLoi: String(traLoi) }, '*'); };
  $$('[data-dtb-chon]', li).forEach(b => b.addEventListener('click', () => gui(b.dataset.dtbChon)));
  const nut = $('[data-dtb-gui]', li), o = $(`#dtbSo${DTB.mo}`, li);
  if (nut && o) {
    const go = () => { const v = o.value.trim(); if (!v) { o.focus(); return; } gui(v); }; // máy chủ đọc số (dấu phẩy, phân số, dấu trừ)
    nut.addEventListener('click', go);
    o.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }
  const hieu = $('[data-dtb-hieu]', li);
  if (hieu) hieu.addEventListener('click', () => sangBuocSau(DTB.mo));
}

function sangBuocSau(i) {
  DTB.xong[i] = true;
  if (i + 1 < KIEM.buoc.length) moBuocDtb(i + 1); else DTB.het = true;
  veDocBuoc();
  const li = $(`#doc-buoc .dtb-buoc[data-b="${DTB.mo}"]`);
  if (li) { const f = $('input, [data-dtb-chon], [data-dtb-hieu]', li); if (f) f.focus({ preventScroll: true }); li.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' }); }
}

function nhanKetQuaKiem(m) {
  if (!KIEM || DTB.cho === null || Number(m.buoc) !== DTB.cho) return;
  const i = DTB.cho; DTB.cho = null;
  if (m.loi) { DTB.kq[i] = Object.assign({}, DTB.kq[i] || {}, { loi: String(m.loi) }); veDocBuoc(); return; }
  bao('kiem', { y: String(i), dung: m.dung === true });
  if (m.dung === true) { DTB.kq[i] = { dung: true }; sangBuocSau(i); return; }
  DTB.kq[i] = { dung: false, dapAn: m.dapAn ? String(m.dapAn) : (DTB.kq[i] && DTB.kq[i].dapAn) || '', tenNen: m.tenNen ? String(m.tenNen) : '' };
  veDocBuoc();
  const o = $(`#dtbSo${i}`); if (o) o.focus({ preventScroll: true });
}

function batDauDocBuoc(kiem) {
  KIEM = kiem && Array.isArray(kiem.buoc) && kiem.buoc.length ? kiem : null;
  DTB = { mo: 0, xong: {}, kq: {}, cho: null, het: false };
  veDocBuoc();
  if (KIEM) bao('mo_buoc', { y: '0' });
}

window.addEventListener('message', e => {
  if (e.source !== window.parent) return;
  const m = e.data;
  if (m && m.loai === 'cau-kiem-kq') { nhanKetQuaKiem(m); return; }
  if (!m || m.loai !== 'loi-giai' || !m.hoSo || !m.cau) return;
  datBo(m.hoSo.bo || 'ESTER');
  QUESTIONS.splice(0, QUESTIONS.length, ghep(m.hoSo, m.cau));
  curQ.q = QUESTIONS[0].id;
  window.XEM_THU = m.thay === true;
  $('#choTai').hidden = true;
  if (!daKhoiDong) { daKhoiDong = true; init(); } else { renderKeys(); renderBar('q'); renderQ('q'); paintXP(); }
  batDauDocBuoc(window.XEM_THU ? null : m.kiem);
  window.scrollTo(0, 0);
});
parent.postMessage({ loai: 'khung-san-sang' }, '*');
