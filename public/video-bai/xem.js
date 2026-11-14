// VIDEO TÓM TẮT — TRANG XEM TRONG APP (thầy 14/11 «Tạo luôn video tóm tắt trong phần live trên app hs lấy bản đầy đủ luôn»).
// Không phát tệp video: máy em tự vẽ khung hình bằng đúng bộ khung của video (khung.js + hoat-hoa*.js) theo giờ của tệp tiếng đã trộn sẵn
// (giọng Thầy + nhạc + tiếng động) ⇒ nhẹ ~8 lần video 720p, nét sắc mọi màn. Tham số: ?id=<buổi>&ve=<vé tệp>&goc=<máy chủ>.
// Tệp của buổi (máy chủ phục vụ theo vé, có Range): video-kb.json (kịch bản) · video-net.json (nét phấn) · video-am.m4a (tiếng).
// Đoán nhanh: dừng lại cho em chạm chọn, rồi chạy tiếp tới lời giải của Thầy (lựa chọn chỉ giữ trên máy, không gửi đi).
'use strict'
;(function () {
  const q = new URLSearchParams(location.search)
  const id = q.get('id') || '', ve = q.get('ve') || '', goc = (q.get('goc') || '').replace(/\/+$/, '')
  const tep = (t) => `${goc}/live-tep/${encodeURIComponent(id)}/${t}?ve=${encodeURIComponent(ve)}`
  const $ = (s) => document.querySelector(s)
  const am = $('#am'), san = $('#san'), dk = $('#dk'), html = document.documentElement
  html.classList.add('tuong-tac')
  let kb = null, dangChon = null, hetHienDk = 0, dangKeo = false
  const khung = []

  const gio = (x) => { x = Math.max(0, x); return `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}` }
  const bao = (chu, nut, lam) => { const b = $('#bao'); b.innerHTML = ''; const p = document.createElement('div'); p.textContent = chu; b.appendChild(p); if (nut) { const n = document.createElement('button'); n.textContent = nut; n.onclick = lam; b.appendChild(n) } b.classList.remove('an-ui') }
  const dong = () => { try { parent.postMessage({ nguon: 'video-bai', loai: 'dong' }, '*') } catch { /* mở riêng ngoài app */ } am.pause() }

  // sân khấu 1920×1080 co vừa màn (giữ tỉ lệ, viền đen)
  function coVua() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); san.style.transform = `translate(-50%, -50%) scale(${k})` }
  addEventListener('resize', coVua); coVua()

  // điều khiển: tự ẩn khi đang phát
  const hienDk = () => { dk.classList.remove('mo'); hetHienDk = performance.now() + 2600 }
  const ICON_PHAT = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>'
  const ICON_DUNG = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.5"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.5"/></svg>'
  const capNhatNut = () => { $('#dk-phat').innerHTML = am.paused ? ICON_PHAT : ICON_DUNG; $('#dk-phat').setAttribute('aria-label', am.paused ? 'Phát' : 'Dừng') }
  const phat = () => { const p = am.play(); if (p && p.catch) p.catch(() => {}); hienDk() }
  const doi = () => { if (dangChon) return; if (am.paused) phat(); else am.pause(); hienDk() }

  function dungMucLuc() {
    const muc = $('#muc'), vach = $('#dk-vach'), canh = kb.doan.filter((d) => d.loai === 'canh'), MAU = { vang: '#ffd27a', hong: '#fda4af', ngoc: '#6ee7b7', xanh: '#8fb6ff' }
    for (const c of canh) {
      const b = document.createElement('button'), bat = Math.max(0, c.t0 - 2.4)
      b.innerHTML = `<b style="background:${MAU[c.mau] || MAU.vang}">${c.so === '?' ? '?' : c.so}</b><span></span><span>${gio(bat)}</span>`
      b.children[1].textContent = c.so === '?' ? c.tieuDe : `Phần ${c.so} · ${c.tieuDe}`
      b.onclick = () => { tua(bat); muc.classList.add('an-ui'); phat() }
      b.dataset.t0 = String(c.t0); b.dataset.t1 = String(c.t1); muc.appendChild(b)
      const i = document.createElement('i'); i.style.left = `${(bat / kb.tong) * 100}%`; vach.appendChild(i)
    }
  }
  function tua(t) { am.currentTime = Math.max(0, Math.min(kb.tong - 0.05, t)); for (const d of kb.doan) if (d.doVui && t < d.doVui.t0) d.doVui.daHoi = false }

  // ĐOÁN NHANH: tới câu đố ⇒ dừng, em chạm chọn (hoặc Bỏ qua) ⇒ nhảy tới cuối khoảng chờ, chạy tiếp
  function batDauChon(d) {
    dangChon = d; am.pause(); $('#chon').classList.remove('an-ui'); hienDk()
  }
  function xongChon(lc) {
    const d = dangChon; if (!d) return
    const v = d.doVui; v.daHoi = true; dangChon = null; $('#chon').classList.add('an-ui')
    if (lc) {
      lc.classList.add('chon')
      const i = [...lc.parentElement.children].indexOf(lc), canhD = typeof CANH !== 'undefined' ? CANH.find((x) => x.id === d.id) : null
      if (canhD && canhD.doVui.miniO && canhD.doVui.miniO[i]) canhD.doVui.miniO[i].dataset.chon = '1'
    }
    setTimeout(() => { tua(v.t1 - 0.6); v.daHoi = true; phat() }, lc ? 550 : 0)
  }
  $('#dv-lc').addEventListener('click', (e) => { const lc = e.target.closest('.lc'); if (lc && dangChon) xongChon(lc) })
  $('#chon button').addEventListener('click', () => xongChon(null))

  // VÒNG VẼ: giờ của tệp tiếng ⇒ ve(t); máy không kịp (trung vị > 28 ms sau ~90 khung) ⇒ tự chuyển chế độ nhẹ
  function vong(nay) {
    if (khung.length < 120 && !am.paused) { khung.push(nay); if (khung.length === 120 && !window.CHE_DO.nhe) { const g = khung.slice(1).map((x, i) => x - khung[i]).sort((a, b) => a - b); if (g[60] > 28) { window.CHE_DO.nhe = true; html.classList.add('nhe') } } }
    const t = Math.min(kb.tong - 0.01, am.currentTime || 0)
    if (!dangChon && !am.paused) for (const d of kb.doan) { const v = d.doVui; if (v && !v.daHoi && t >= v.t0 && t < v.t1) { batDauChon(d); break } }
    window.ve(dangChon ? Math.max(dangChon.doVui.t0 + 1.1, Math.min(t, dangChon.doVui.t1 - 0.7)) : t)
    $('#dk-da').style.transform = `scaleX(${Math.round((t / kb.tong) * 1000) / 1000})`
    $('#dk-gio').textContent = `${gio(t)} / ${gio(kb.tong)}`
    if (!dangKeo) $('#dk-tua').value = String(Math.round((t / kb.tong) * 1000))
    if (!am.paused && !dangChon && performance.now() > hetHienDk) dk.classList.add('mo')
    requestAnimationFrame(vong)
  }

  async function bat() {
    if (!id || !ve || !goc) { bao('Thiếu thông tin buổi live. Em mở lại từ trang Xem lại Live nhé.'); return }
    try {
      const [rk, rn] = await Promise.all([fetch(tep('video-kb.json')), fetch(tep('video-net.json'))])
      if (rk.status === 404) { bao('Buổi này chưa có video tóm tắt.', 'Đóng', dong); return }
      if (!rk.ok || !rn.ok) throw new Error(`${rk.status}/${rn.status}`)
      const [k, n] = await Promise.all([rk.json(), rn.json()])
      kb = k
      await window.nap(k, n)
      document.title = `Video tóm tắt · ${k.ten || 'Bài giảng'}`
      $('#vao-ten').textContent = `Video tóm tắt · ${k.ten || ''}`
      $('#vao-phu').textContent = `${gio(k.tong)} · hoạt hoạ theo giọng Thầy`
      $('#vao-tai').classList.add('an-ui'); $('#nut-xem').classList.remove('an-ui')
      dungMucLuc(); window.ve(1.8)
      am.src = tep('video-am.m4a'); am.preload = 'auto'
      requestAnimationFrame(vong)
    } catch { bao('Chưa tải được video tóm tắt. Em thử lại nhé.', 'Thử lại', () => location.reload()) }
  }

  $('#nut-xem').addEventListener('click', () => { $('#vao').classList.add('an-ui'); dk.classList.remove('an-ui'); phat() })
  $('#dk-phat').addEventListener('click', doi)
  $('#dk-toc').addEventListener('click', () => { const ds = [1, 1.25, 1.5], i = (ds.indexOf(am.playbackRate) + 1) % ds.length; am.playbackRate = ds[i]; $('#dk-toc').textContent = `${String(ds[i]).replace('.', ',')}×`; hienDk() })
  $('#dk-muc').addEventListener('click', () => { const m = $('#muc'); m.classList.toggle('an-ui'); const t = am.currentTime; for (const b of m.children) b.setAttribute('aria-current', String(t >= Number(b.dataset.t0) - 2.4 && t < Number(b.dataset.t1))); hienDk() })
  const tuaEl = $('#dk-tua')
  tuaEl.addEventListener('input', () => { dangKeo = true; tua((Number(tuaEl.value) / 1000) * kb.tong); hienDk() })
  tuaEl.addEventListener('change', () => { dangKeo = false })
  $('#san').addEventListener('click', (e) => { if (e.target.closest('.lc')) return; if (dk.classList.contains('mo')) hienDk(); else if (!dangChon) doi() })
  $('#dong').addEventListener('click', dong)
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dong()
    else if (e.key === ' ') { e.preventDefault(); doi() }
    else if (e.key === 'ArrowRight') { tua(am.currentTime + 5); hienDk() } else if (e.key === 'ArrowLeft') { tua(am.currentTime - 5); hienDk() }
  })
  am.addEventListener('play', capNhatNut); am.addEventListener('pause', capNhatNut)
  am.addEventListener('ended', () => { hienDk(); capNhatNut() })
  am.addEventListener('error', () => { if (am.src) bao('Chưa tải được tiếng của video. Em thử lại nhé.', 'Thử lại', () => location.reload()) })
  document.addEventListener('visibilitychange', () => { if (document.hidden) am.pause() })
  capNhatNut(); bat()
})()
