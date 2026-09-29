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

window.addEventListener('message', e => {
  if (e.source !== window.parent) return;
  const m = e.data;
  if (!m || m.loai !== 'loi-giai' || !m.hoSo || !m.cau) return;
  datBo(m.hoSo.bo || 'ESTER');
  QUESTIONS.splice(0, QUESTIONS.length, ghep(m.hoSo, m.cau));
  curQ.q = QUESTIONS[0].id;
  window.XEM_THU = m.thay === true;
  $('#choTai').hidden = true;
  if (!daKhoiDong) { daKhoiDong = true; init(); } else { renderKeys(); renderBar('q'); renderQ('q'); paintXP(); }
  window.scrollTo(0, 0);
});
parent.postMessage({ loai: 'khung-san-sang' }, '*');
