// THƯỞNG PHẠT — hình vẽ + hiệu ứng dùng chung cho các màn tp-*.html (bản vẽ 26/10). Nạp SAU khung.js và linh-vat/bi.js.
//   ?bt=<biến thể>  chỉ giữ phần tử [data-bt] khớp (mặc định: body[data-bt-mac]).
//   ?hu=<hiệu ứng>  chạy hiệu ứng đó khi mở (mặc định: body[data-hu-mac]).  ?tinh  ảnh tĩnh: không chạy chuyển động (HTML tĩnh = trạng thái cuối).
//   Hiệu ứng: chỉ transform + opacity (WAAPI), hạt nằm trong lớp fixed overflow:hidden ⇒ không làm tràn trang; ≤ 40 hạt; xong thì gỡ.
//   prefers-reduced-motion ⇒ bỏ chuyển động, giữ màu và số cuối. Bấm nút chính giữa hiệu ứng ⇒ nhảy tới trạng thái cuối (TP.xong()).
//   phanHoi(kieu): chỗ gắn rung (rung.ts) + âm (am-thanh.ts) cùng nhịp — bản vẽ chưa có âm.
;(function () {
  const Q = new URLSearchParams(location.search)
  const TINH = Q.has('tinh'), GIAM = matchMedia('(prefers-reduced-motion: reduce)').matches
  const TP = (window.TP = { tinh: TINH, giam: GIAM, dong: !(TINH || GIAM), bt: Q.get('bt') || document.body.dataset.btMac || '', hu: Q.get('hu') || '', ds: {} })
  if (TINH) document.documentElement.classList.add('tinh')
  // biến thể
  document.querySelectorAll('[data-bt]').forEach((e) => { if (!e.dataset.bt.split(' ').includes(TP.bt)) e.remove() })
  document.body.dataset.btDang = TP.bt

  // ── hình vẽ SVG ──────────────────────────────────────────────────────
  let _n = 0; const uid = (p) => p + (++_n)
  TP.nt = () => '<svg class="tp-dv nt" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="10.2" ry="4.1"/><ellipse cx="12" cy="12" rx="10.2" ry="4.1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10.2" ry="4.1" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="2.7"/></svg>'
  TP.tt = () => '<svg class="tp-dv tt" viewBox="0 0 24 24" aria-hidden="true"><path class="a" d="M12 1.6 21.2 6.9v10.2L12 22.4l-9.2-5.3V6.9z"/><path class="b" d="M12 1.6 21.2 6.9 12 11.7 2.8 6.9z"/><path class="c" d="M12 11.7v10.7l9.2-5.3V6.9z"/><path class="d" d="M7.4 6.4 9.6 5.1l1 .6-2.2 1.3z"/></svg>'
  TP.lua = (tat) => `<svg class="tp-dv lua${tat ? ' tat' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path class="a" d="M12 1.5c1 3.6 5.8 6 5.8 12a5.8 5.8 0 0 1-11.6 0c0-2.7 1.3-4.4 2.6-5.6.2 1.6.9 2.6 1.9 3C10.3 7.6 10.6 4.6 12 1.5z"/><path class="b" d="M12 10.5c.6 2 3.1 3.1 3.1 6a3.1 3.1 0 0 1-6.2 0c0-1.4.7-2.3 1.4-2.9.1.8.5 1.3 1 1.5-.2-1.6 0-3.2.7-4.6z"/><path class="c" d="M8.4 13.2c-.4 1-.5 2-.3 2.9" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>`
  /** Huy hiệu kim loại lục giác — kí hiệu hoá học của kim loại (Fe, Cu, Ag, Au, Pt; kim cương = C). */
  const KL = { sat: ['Sắt', 'Fe'], dong: ['Đồng', 'Cu'], bac: ['Bạc', 'Ag'], vang: ['Vàng', 'Au'], bk: ['Bạch kim', 'Pt'], kc: ['Kim cương', 'C'] }
  TP.KL = KL
  TP.huyHieu = (kl, chu) => {
    const id = uid('hh'), [ten, kh] = KL[kl] || ['', chu || '']
    const kc = kl === 'kc'
    return `<svg viewBox="0 0 100 100" role="img" aria-label="Huy hiệu ${ten}"><defs>
<linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--kl-${kl})"/><stop offset="1" style="stop-color:var(--kl-${kl}-2)"/></linearGradient>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient></defs>
<path d="M50 3 92 27v46L50 97 8 73V27z" fill="url(#${id}a)" stroke="var(--kl-${kl}-2)" stroke-width="3" style="stroke:var(--kl-${kl}-2)"/>
<path d="M50 3 92 27 50 50 8 27z" fill="#fff" opacity=".28"/><path d="M50 50v47l42-24V27z" fill="#000" opacity=".12"/>
<path d="M50 17 79 33.5v33L50 83 21 66.5v-33z" fill="url(#${id}b)" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/>
${kc ? '<path d="M38 40h24l8 9-20 22-20-22z" fill="#fff" opacity=".95"/><path d="M38 40l12 31 12-31M30 49h40" fill="none" stroke="var(--kl-kc-2)" style="stroke:var(--kl-kc-2)" stroke-width="2.4" stroke-linejoin="round"/>'
    : `<text x="50" y="61" text-anchor="middle" font-family="Nunito Variable,Nunito,sans-serif" font-weight="900" font-size="30" fill="#fff" stroke="var(--kl-${kl}-2)" style="stroke:var(--kl-${kl}-2)" stroke-width="5" paint-order="stroke">${kh}</text>`}
<path d="M24 26l8-4.6" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`
  }
  /** Huy hiệu chung (chuỗi, hoàn hảo…): lục giác màu theo biến + biểu tượng hoặc số. */
  TP.huyHieuMau = (mau, trong) => {
    const id = uid('hm')
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(${mau}) 70%,#fff)"/><stop offset="1" style="stop-color:var(${mau})"/></linearGradient></defs>
<path d="M50 3 92 27v46L50 97 8 73V27z" fill="url(#${id})"/><path d="M50 3 92 27 50 50 8 27z" fill="#fff" opacity=".22"/><path d="M50 50v47l42-24V27z" fill="#000" opacity=".1"/>
<path d="M50 15 81 33v34L50 85 19 67V33z" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2.5" stroke-dasharray="5 5"/>${trong || ''}</svg>`
  }
  /** Bình giữ chuỗi: bình cầu nhỏ có nắp, dung dịch xanh băng. kieu: day | trong | khoa | dong (nắp vừa đóng, có hơi lạnh) */
  TP.binh = (kieu = 'day') => {
    const id = uid('b'), day = kieu === 'day' || kieu === 'dong'
    return `<svg viewBox="0 0 60 70" aria-hidden="true"><defs><clipPath id="${id}"><path d="M24 14v12.5A20 20 0 1 0 36 26.5V14z"/></clipPath></defs>
<path d="M24 14v12.5A20 20 0 1 0 36 26.5V14z" fill="${kieu === 'khoa' ? 'var(--mat-3)' : 'var(--mat)'}" style="fill:${kieu === 'khoa' ? 'var(--mat-3)' : 'color-mix(in srgb,var(--bang-nhat) 60%,var(--mat))'}"/>
${day ? `<g clip-path="url(#${id})"><path d="M8 36 Q18 31 30 36 T52 36 V70 H8z" style="fill:var(--bang)"/><circle cx="23" cy="50" r="2.4" fill="#fff" opacity=".6"/><circle cx="36" cy="45" r="1.8" fill="#fff" opacity=".6"/><path d="M20 41l2.5 2.5M34 52l2 2M30 44l-2 2.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/></g>` : ''}
<path d="M24 14v12.5A20 20 0 1 0 36 26.5V14z" fill="none" stroke="var(--chu-3)" style="stroke:${kieu === 'khoa' ? 'var(--vien-2)' : 'var(--bang-chu)'}" stroke-width="3" stroke-linejoin="round"/>
<path d="M17 37a13 13 0 0 1 6-7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".9"/>
<g class="nap"${kieu === 'trong' ? ' transform="translate(9 -7) rotate(24 30 9)"' : ''}><rect x="21" y="5" width="18" height="10" rx="3.5" style="fill:${kieu === 'khoa' ? 'var(--vien-2)' : 'var(--bang-chu)'}"/><rect x="24" y="7" width="7" height="2.4" rx="1.2" fill="#fff" opacity=".55"/></g>
${kieu === 'khoa' ? '<g transform="translate(30 47)"><rect x="-6" y="-3" width="12" height="9" rx="2" style="fill:var(--chu-3)"/><path d="M-3.5 -3v-2.5a3.5 3.5 0 0 1 7 0V-3" fill="none" style="stroke:var(--chu-3)" stroke-width="2"/></g>' : ''}</svg>`
  }
  /** Rương ngày. mo = đã mở. */
  TP.ruong = (mo) => `<svg viewBox="0 0 120 100" aria-hidden="true">
<ellipse cx="60" cy="94" rx="44" ry="5" fill="#000" opacity=".1"/>
<rect x="14" y="44" width="92" height="46" rx="8" style="fill:var(--chu-y)"/><rect x="14" y="44" width="92" height="12" style="fill:color-mix(in srgb,var(--chu-y) 70%,#000)"/>
<rect x="14" y="44" width="92" height="46" rx="8" fill="none" style="stroke:color-mix(in srgb,var(--chu-y) 55%,#000)" stroke-width="3"/>
<rect x="52" y="44" width="16" height="46" style="fill:var(--sao)"/>
${mo ? '<g transform="translate(60 52)"><path d="M0-26 9-21v10L0-6-9-11v-10z" style="fill:var(--tt)"/><path d="M-20-14-14-17-8-14v6l-6 3-6-3z" style="fill:var(--tt)" opacity=".85"/><path d="M14-18 20-21 26-18v6l-6 3-6-3z" style="fill:var(--tt)" opacity=".85"/></g>' : '<g transform="translate(60 62)"><rect x="-8" y="-9" width="16" height="16" rx="3" style="fill:var(--mat)"/><circle cy="-2" r="3" style="fill:var(--chu-y)"/></g>'}
<g class="nap"${mo ? ' transform="translate(0 -14) rotate(-16 14 44)"' : ''}><path d="M14 44V32a14 14 0 0 1 14-14h64a14 14 0 0 1 14 14v12z" style="fill:var(--chu-y)"/><path d="M14 44V32a14 14 0 0 1 14-14h64a14 14 0 0 1 14 14v12z" fill="none" style="stroke:color-mix(in srgb,var(--chu-y) 55%,#000)" stroke-width="3"/><rect x="52" y="18" width="16" height="26" style="fill:var(--sao)"/><path d="M26 26h20" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/></g></svg>`
  /** Ống nghiệm «mạng» (Thử thách Kim cương). vo = đã vỡ. */
  TP.ong3 = (vo) => vo
    ? `<svg viewBox="0 0 16 30" aria-hidden="true"><path d="M3 2h10v9l-3 2 2 3-1 2" fill="none" stroke="var(--chu-3)" style="stroke:var(--chu-3)" stroke-width="2" stroke-linejoin="round"/><path d="M3 2v18a5 5 0 0 0 4 4.9" fill="none" style="stroke:var(--chu-3)" stroke-width="2"/><path d="M1 28h14" style="stroke:var(--sai)" stroke-width="2.5" stroke-linecap="round" opacity=".5"/></svg>`
    : `<svg viewBox="0 0 16 30" aria-hidden="true"><path d="M3 2v20a5 5 0 0 0 10 0V2z" style="fill:var(--mat)"/><path d="M3 12h10v10a5 5 0 0 1-10 0z" style="fill:var(--kl-kc-2)"/><path d="M3 2v20a5 5 0 0 0 10 0V2" fill="none" style="stroke:var(--chu-2)" stroke-width="2"/><path d="M1.5 2h13" style="stroke:var(--chu-2)" stroke-width="2.4" stroke-linecap="round"/><circle cx="6.5" cy="17" r="1.3" fill="#fff" opacity=".8"/></svg>`
  /** Phân tử combo: n nguyên tử nối zíc-zắc. */
  const MAU_NG = ['var(--dung)', 'var(--tin)', 'var(--chu-y)', 'var(--sai)', 'var(--tt)']
  TP.phanTu = (n) => {
    const p = Array.from({ length: n }, (_, i) => [9 + i * 15, i % 2 ? 23 : 9])
    let s = p.slice(1).map((q, i) => `<line class="lk" data-i="${i + 1}" x1="${p[i][0]}" y1="${p[i][1]}" x2="${q[0]}" y2="${q[1]}"/>`).join('')
    s += p.map((q, i) => `<circle class="ng" data-i="${i}" cx="${q[0]}" cy="${q[1]}" r="6.5" style="fill:${MAU_NG[i % 5]}"/>`).join('')
    return `<svg class="tp-phan-tu" viewBox="0 0 ${18 + (n - 1) * 15} 32" style="width:${18 + (n - 1) * 15}px" aria-hidden="true">${s}</svg>`
  }
  /** Vòng tia sáng xoay sau hình chính. */
  TP.tia = () => '<svg viewBox="-100 -100 200 200" aria-hidden="true">' + Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L-9 -100 L9 -100Z" transform="rotate(${i * 30})"/>`).join('') + '</svg>'

  // thay chỗ giữ: <i data-tp="nt|tt|lua|lua-tat"></i>, <span data-bi="cam">, <span data-hh="kl">, <span data-binh="kieu">, <span data-ruong="mo">, <span data-ong3="vo">, <span data-phan-tu="n">, <span data-tia>
  TP.ve = (goc = document) => {
    // thanh trên mới: <header class="da-tren" data-lua="12" data-nt="86" data-tt="245" data-bai="2/4"> ⇒ 3 bộ đếm + Bi trong vòng mục tiêu ngày
    goc.querySelectorAll('header.da-tren[data-lua]').forEach((h) => {
      const [x, y] = h.dataset.bai.split('/').map(Number), d = h.dataset
      h.innerHTML = `<span class="lua" aria-label="Chuỗi ${d.lua} ngày">${TP.lua(d.lua === '0')}<span class="tp-dem" id="dem-lua">${d.lua}</span></span>`
        + `<span class="nt" aria-label="Nguyên tử hôm nay">${TP.nt()}<span class="tp-dem" id="dem-nt">${d.nt}</span></span>`
        + `<span class="tt" aria-label="Tinh thể">${TP.tt()}<span class="tp-dem" id="dem-tt">${d.tt}</span></span>`
        + `<span class="tp-muc" data-p="${Math.min(100, x / y * 100)}" aria-label="Mục tiêu ngày ${x}/${y} bài"><svg class="vm" viewBox="0 0 52 52"><circle class="nen" cx="26" cy="26" r="22"/><circle class="chay" cx="26" cy="26" r="22"/></svg><span data-bi="${d.biTren || 'chao'}"></span><em>${x}/${y} bài</em></span>`
    })
    goc.querySelectorAll('i[data-tp]').forEach((e) => { const k = e.dataset.tp; e.outerHTML = k === 'nt' ? TP.nt() : k === 'tt' ? TP.tt() : TP.lua(k === 'lua-tat') })
    goc.querySelectorAll('[data-bi]').forEach((e) => { e.classList.add('tp-bi'); e.innerHTML = window.biVe ? biVe({ cam: e.dataset.bi, id: uid('bi') }) : '' })
    goc.querySelectorAll('[data-hh]').forEach((e) => { e.classList.add('tp-hh'); e.innerHTML = TP.huyHieu(e.dataset.hh) })
    goc.querySelectorAll('[data-hm]').forEach((e) => { e.classList.add('tp-hh'); e.innerHTML = TP.huyHieuMau(e.dataset.hm, e.innerHTML) })
    goc.querySelectorAll('[data-binh]').forEach((e) => { e.classList.add('tp-binh'); e.innerHTML = TP.binh(e.dataset.binh) })
    goc.querySelectorAll('[data-ruong]').forEach((e) => { e.classList.add('tp-ruong'); e.innerHTML = TP.ruong(e.dataset.ruong === 'mo') })
    goc.querySelectorAll('[data-ong3]').forEach((e) => { e.classList.add('tp-o3'); e.innerHTML = TP.ong3(e.dataset.ong3 === 'vo') })
    goc.querySelectorAll('[data-phan-tu]').forEach((e) => { e.outerHTML = TP.phanTu(+e.dataset.phanTu) })
    goc.querySelectorAll('[data-tia]').forEach((e) => { e.innerHTML = TP.tia() })
    goc.querySelectorAll('.tp-muc[data-p]').forEach((e) => { const c = e.querySelector('.chay'); if (c) c.setAttribute('stroke-dasharray', `${(+e.dataset.p / 100) * 138.2} 200`) })
    goc.querySelectorAll('.tp-vong[data-p]').forEach((e) => { const c = e.querySelector('.chay'); if (c) c.setAttribute('stroke-dasharray', `${(+e.dataset.p / 100) * 175.9} 200`) })
  }
  TP.ve()

  // ── công cụ hiệu ứng ─────────────────────────────────────────────────
  TP.phanHoi = (kieu) => { (TP.nhatKy = TP.nhatKy || []).push(kieu) /* rung.ts + am-thanh.ts gắn ở đây */ }
  TP.a = (el, kf, d, o = {}) => (el && TP.dong ? el.animate(kf, { duration: d, easing: o.e || 'cubic-bezier(.2,.8,.2,1)', delay: o.delay || 0, fill: o.fill || 'backwards', iterations: o.lap || 1 }) : null)
  TP.cho = (ms) => new Promise((r) => setTimeout(r, TP.dong ? ms : 0))
  let lop
  TP.lop = () => { if (!lop || !lop.isConnected) { lop = document.createElement('div'); lop.className = 'tp-lop'; document.body.append(lop) } return lop }
  const tam = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] }
  TP.tam = tam
  const MAU_HAT = ['var(--dung)', 'var(--tin)', 'var(--sao)', 'var(--sai)', 'var(--tt)', 'var(--bang)']
  /** Bung hạt lục giác từ một điểm. */
  TP.hat = (x, y, o = {}) => {
    if (!TP.dong) return
    if (x && x.getBoundingClientRect) [x, y] = tam(x)
    const n = Math.min(o.n || 8, 40), L = TP.lop(), d = o.d || 450, r = o.r || 70
    for (let i = 0; i < n; i++) {
      const h = document.createElement('i'); h.className = 'tp-hat' + (o.tron ? ' tron' : ''); h.style.left = x + 'px'; h.style.top = y + 'px'
      h.style.background = (o.mau || MAU_HAT)[i % (o.mau || MAU_HAT).length]
      const s = o.co ? o.co : 8 + Math.random() * 8; h.style.width = h.style.height = s + 'px'; h.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`
      L.append(h)
      const g = (i / n) * Math.PI * 2 + Math.random() * 0.5, k = r * (0.6 + Math.random() * 0.6)
      h.animate([{ transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(g) * k}px,${Math.sin(g) * k + (o.roi || 0)}px) scale(1) rotate(${Math.random() * 240}deg)`, opacity: 0 }], { duration: d * (0.8 + Math.random() * 0.4), easing: 'cubic-bezier(.1,.7,.3,1)', delay: o.tre || 0, fill: 'backwards' }).onfinish = () => h.remove()
    }
  }
  /** Hoa giấy lục giác rơi khắp màn. */
  TP.hoaGiay = (n = 36, d = 1200) => {
    if (!TP.dong) return
    const L = TP.lop(), W = innerWidth, H = innerHeight
    for (let i = 0; i < Math.min(n, 40); i++) {
      const h = document.createElement('i'); h.className = 'tp-hat'; const s = 8 + Math.random() * 8
      h.style.width = h.style.height = s + 'px'; h.style.left = Math.random() * W + 'px'; h.style.top = '-12px'; h.style.background = MAU_HAT[i % 6]
      L.append(h)
      h.animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 80}px,${H * (0.55 + Math.random() * 0.45)}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0.1 }], { duration: d * (0.75 + Math.random() * 0.5), delay: Math.random() * 300, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'backwards' }).onfinish = () => h.remove()
    }
  }
  /** Đếm số tăng/giảm (requestAnimationFrame). */
  TP.dem = (el, tu, toi, d = 700, dinh = (v) => v.toLocaleString('vi-VN')) => new Promise((xong) => {
    if (!el) return xong()
    if (!TP.dong) { el.textContent = dinh(toi); return xong() }
    const t0 = performance.now()
    const buoc = (t) => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = dinh(Math.round(tu + (toi - tu) * e)); if (p < 1) requestAnimationFrame(buoc); else xong() }
    el.textContent = dinh(tu); requestAnimationFrame(buoc)
  })
  /** Lật số: số cũ lật lên, số mới lật vào. */
  TP.lat = (el, cu, moi, d = 520) => {
    if (!el || !TP.dong) return
    el.style.position = 'relative'; el.style.display = 'inline-block'
    el.innerHTML = `<span style="display:inline-block">${moi}</span><span style="position:absolute;left:0;top:0;right:0;text-align:inherit">${cu}</span>`
    const [m, c] = el.children
    c.animate([{ transform: 'translateY(0) rotateX(0)', opacity: 1 }, { transform: 'translateY(-60%) rotateX(80deg)', opacity: 0 }], { duration: d * 0.6, easing: 'ease-in', fill: 'forwards' })
    m.animate([{ transform: 'translateY(60%) rotateX(-80deg)', opacity: 0 }, { transform: 'translateY(0) rotateX(0)', opacity: 1 }], { duration: d * 0.6, delay: d * 0.4, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards' }).onfinish = () => { el.textContent = moi }
  }
  /** Tinh thể bay theo đường cong tới bộ đếm (D1). */
  TP.bay = (tu, toi, o = {}) => new Promise((xong) => {
    const n = o.n || 6, d = o.d || 700
    if (!TP.dong || !tu || !toi) { if (o.dem) o.dem(1); return xong() }
    const L = TP.lop(), [x0, y0] = tu.getBoundingClientRect ? tam(tu) : tu, [x1, y1] = tam(toi)
    let ve = 0
    for (let i = 0; i < n; i++) {
      const h = document.createElement('i'); h.className = 'tp-hat gem'; h.innerHTML = o.hinh || TP.tt(); h.style.left = x0 + 'px'; h.style.top = y0 + 'px'; L.append(h)
      const lx = (Math.random() - 0.5) * 120, ly = -40 - Math.random() * 60, dx = x1 - x0, dy = y1 - y0
      const kf = []
      for (let k = 0; k <= 8; k++) { const t = k / 8, cx = lx + (dx * 0.5 - lx) * 0, bx = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * (dx * 0.25 + lx) + t * t * dx, by = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * (dy * 0.15 + ly) + t * t * dy; void cx; kf.push({ transform: `translate(${bx}px,${by}px) scale(${k === 0 ? 0.4 : k === 8 ? 0.6 : 1.1})`, opacity: k === 8 ? 0.2 : 1 }) }
      h.animate(kf, { duration: d, delay: i * 70, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'backwards' }).onfinish = () => {
        h.remove(); ve++
        TP.a(toi, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], 200)
        TP.phanHoi('tinhThe'); if (o.dem) o.dem(ve / n)
        if (ve === n) xong()
      }
    }
  })
  /** Nhảy tới trạng thái cuối: kết thúc mọi chuyển động, gỡ hạt. */
  TP.xong = () => { document.getAnimations().forEach((a) => { if (a.effect && a.effect.getTiming().iterations !== Infinity) try { a.finish() } catch (e) {} }); if (lop) lop.innerHTML = ''; (TP.xongDs || []).forEach((f) => f()) }
  TP.khiXong = (f) => (TP.xongDs = TP.xongDs || []).push(f)
  /** Đăng kí hiệu ứng của màn. */
  TP.dk = (ten, f) => { TP.ds[ten] = f }
  TP.chay = async (ten) => { const f = TP.ds[ten || TP.hu || document.body.getAttribute('data-hu-' + TP.bt) || document.body.dataset.huMac]; if (!f) return; TP.dangChay = true; try { await f() } finally { TP.dangChay = false } }
  // nút chính: bấm giữa hiệu ứng thì nhảy tới cuối
  document.addEventListener('click', (e) => { if (e.target.closest('.duo-nut, .tp-nut.chinh')) TP.xong() })
  // chừa chỗ cho tấm đáy cố định (không để tấm đè chữ)
  const chua = () => { const d = document.querySelector('.duo-day'), m = document.querySelector('.duo-than, .tp-man, .duo-xong'); if (d && m) m.style.paddingBottom = /fixed|absolute/.test(getComputedStyle(d).position) ? d.offsetHeight + 24 + 'px' : '' }
  chua(); addEventListener('resize', chua)
  const bat = () => { if (TP.dong) setTimeout(() => TP.chay(), 250) }
  ;(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { chua(); if (document.readyState === 'complete') bat(); else addEventListener('load', bat) })
})()
