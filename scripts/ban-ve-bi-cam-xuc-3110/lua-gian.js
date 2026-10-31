// BẢN VẼ «LỬA ĐỔI CẢM XÚC» 31/10 — CHỈ cho bản vẽ, KHÔNG phải mã app (docs/DE-XUAT-BI-CAM-XUC-3110.md).
// Chồng chi tiết giận lên SVG của Lửa THẬT (taoLua trong src/components/linh-vat/lua-dong.ts — cùng hình, cùng khung xương, cùng dáng có sẵn
// 'vui' · 'chao' · 'doi' · 'caunhau' · 'gian'). Màu theo cấp ở lua-gian.css (biến --cn-*). Khi build thật, các chi tiết này vào thẳng lua-dong.ts.
// Dùng: window.apCapGian(svg, cap) sau khi Lửa đã vẽ xong khung cuối (tĩnh). cap 0–1: không thêm gì.
;(function () {
  const NS = 'http://www.w3.org/2000/svg'
  const M = (k) => `var(--cn-${k})`
  function tao(tag, tt, cha) {
    const e = document.createElementNS(NS, tag)
    if (tt) for (const k in tt) e.setAttribute(k, String(tt[k]))
    if (cha) cha.appendChild(e)
    return e
  }
  const to = (e, mau) => { e.style.fill = M(mau); return e }
  const vien = (e, w, mau = 'vien') => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.style.paintOrder = 'stroke'; e.setAttribute('stroke-linejoin', 'round'); return e }
  const net = (e, mau, w) => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.setAttribute('fill', 'none'); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); return e }
  const so = (s) => (s || '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []

  /** Dấu «gân giận» (bốn cung quay lưng vào nhau) — kiểu truyện tranh. */
  function gan(cha, x, y, k) {
    const g = tao('g', { transform: `translate(${x},${y}) scale(${k})` }, cha)
    net(tao('path', { d: 'M-5,-16Q-5,-5 -16,-5M5,-16Q5,-5 16,-5M-5,16Q-5,5 -16,5M5,16Q5,5 16,5' }, g), 'gian', 6.5)
    return g
  }

  window.apCapGian = function apCapGian(svg, cap) {
    const khung = svg.closest('.lua')
    if (khung) khung.setAttribute('data-cap', String(cap))
    if (cap < 2) return
    const paths = [...svg.querySelectorAll('path')]
    const theoD = (dau) => paths.filter((p) => (p.getAttribute('d') || '').startsWith(dau))
    const luaVo = theoD('M0,0C-18,-2')[0]
    const gLua = luaVo.parentNode
    const hieu = svg.lastElementChild
    const mats = [...svg.querySelectorAll('circle')].filter((c) => c.getAttribute('r') === '27' && !c.closest('clipPath'))
    const mays = theoD('M-14,0H14')
    const mq = [...svg.querySelectorAll('g')].find((g) => g.getAttribute('transform') === 'translate(0,44)')
    const gMat = mq.parentNode

    // CẤP 2 · SỐT RUỘT: đồng hồ báo thức nhỏ trên vai (thời gian đang trôi)
    if (cap === 2) {
      const g = tao('g', { transform: 'translate(132,-296)' }, hieu)
      vien(to(tao('path', { d: 'M-20,-14a9,9 0 0,1 12,-9M20,-14a9,9 0 0,0 -12,-9' }, g), 'vien'), 5).style.fill = 'none'
      vien(to(tao('circle', { r: 19 }, g), 'rang'), 4.5)
      net(tao('path', { d: 'M0,0V-11M0,0L8,5' }, g), 'vien', 4)
      net(tao('path', { d: 'M-12,20L-15,25M12,20L15,25' }, g), 'vien', 4)
      return
    }

    // CẤP 3 · BỰC: một gân giận
    if (cap === 3) { gan(hieu, 128, -298, 0.95); return }

    // CẤP 4–5 · GIẬN / SIÊU CÁU
    const lon = cap === 5
    // Mắt: tròng đỏ (cấp 5: đỏ rực + lõi vàng + con ngươi dọc), mí xếch hơn, bỏ hai đốm sáng tròn to
    mats.forEach((c, i) => {
      const s = i ? 1 : -1, tron = c.parentNode, tr = tron.querySelector(':scope > g'), ng = tr.firstElementChild, mi = tr.querySelector(':scope > rect')
      ng.style.display = 'none'
      const g = tao('g', null, null)
      tr.insertBefore(g, mi)
      to(tao('circle', { r: lon ? 21 : 15 }, g), 'matDo')
      if (lon) to(tao('circle', { r: 10 }, g), 'matSang')
      to(lon ? tao('ellipse', { rx: 3.2, ry: 8 }, g) : tao('circle', { r: 5.5 }, g), 'den')
      to(tao('circle', { cx: -7, cy: -8, r: lon ? 3.4 : 3 }, g), 'rang')
      if (lon) { const yb = -27 + 0.42 * 54; mi.setAttribute('y', String(yb - 80)); mi.setAttribute('transform', `rotate(${-s * 30} 0 ${yb})`) }
    })
    // Mày: dày, dài, xếch chữ V, ép sát mắt
    mays.forEach((m, i) => {
      const s = i ? 1 : -1, [x, y] = so(m.getAttribute('transform'))
      m.setAttribute('d', lon ? 'M-22,0H22' : 'M-18,0H18')
      m.setAttribute('stroke-width', lon ? '11' : '8.5')
      m.setAttribute('transform', `translate(${x},${y + (lon ? 6 : 3)}) rotate(${-s * (lon ? 34 : 28)})`)
    })
    // Miệng: nghiến răng (cấp 5 to, cấp 4 vừa)
    for (const c of mq.children) c.style.display = 'none'
    const w = lon ? 25 : 17, t = lon ? -5 : -1, b = lon ? 17 : 12
    vien(to(tao('path', { d: `M${-w},${t + 5}Q0,${t - 6} ${w},${t + 5}L${w - 3},${b - 3}Q${w - 4},${b} ${w - 9},${b}H${-w + 9}Q${-w + 4},${b} ${-w + 3},${b - 3}Z` }, mq), 'rang'), 3.6)
    net(tao('path', { d: `M${-w + 4},${(t + b) / 2 + 1}H${w - 4}` + [-w / 2, 0, w / 2].map((x) => `M${x},${t + 2.5}V${b - 1}`).join('') }, mq), 'vien', 2.4)
    // Má: ba vạch đỏ ửng
    for (const s of [-1, 1]) net(tao('path', { d: [0, 1, 2].map((k) => `M${s * (58 + k * 9) + 3},33L${s * (58 + k * 9) - 3},46`).join('') }, gMat), 'vien', 3).style.opacity = '0.55'
    // Chỏm lửa: cấp 4 to hơn, cấp 5 bùng cao + lớp lửa ngoài đỏ sẫm
    const [tx, ty] = so(gLua.getAttribute('transform'))
    gLua.setAttribute('transform', `translate(${tx},${ty - (lon ? 4 : 2)}) scale(${lon ? '1.45,1.75' : '1.18,1.3'})`)
    if (lon) {
      const ngoai = vien(to(tao('path', { d: luaVo.getAttribute('d'), transform: 'translate(0,4) scale(1.32,1.25)' }, null), 'luaNgoai'), 4)
      gLua.insertBefore(ngoai, gLua.firstChild)
    }
    // Gân giận
    gan(hieu, 142, -232, lon ? 1.2 : 1)
    gan(hieu, -144, -218, lon ? 1.05 : 0.85)
    if (!lon) return
    // CẤP 5: hơi nước phụt hai tai (thay khói hồng), vạch rung hai bên thân, gân thứ ba, quầng đỏ sau lưng
    const khoi = [...hieu.querySelectorAll('path')].find((p) => p.style.fill.includes('khoi'))
    if (khoi) khoi.parentNode.style.display = 'none'
    for (const s of [-1, 1]) {
      const tia = `M${s * 70},-326L${s * 98},-338M${s * 76},-312L${s * 104},-314`
      net(tao('path', { d: tia }, hieu), 'vien', 11)
      net(tao('path', { d: tia }, hieu), 'hoi', 6)
      const may = [[112, -346, 13], [134, -360, 17], [156, -338, 15], [140, -322, 12]]
      vien(to(tao('path', { d: may.map(([x, y, r]) => `M${s * x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`).join('') }, hieu), 'hoi'), 3.5)
      net(tao('path', { d: `M${s * 124},-168q${s * 12},16 0,32M${s * 140},-180q${s * 17},28 0,56` }, hieu), 'gian', 5.5)
    }
    const defs = svg.querySelector('defs'), id = 'quang' + Math.random().toString(36).slice(2, 8)
    const rg = tao('radialGradient', { id, cx: '50%', cy: '50%', r: '50%' }, defs)
    for (const [o, a] of [[0, 0.55], [0.6, 0.22], [1, 0]]) { const st = tao('stop', { offset: o }, rg); st.style.stopColor = 'var(--g-do)'; st.style.stopOpacity = String(a) }
    svg.insertBefore(tao('ellipse', { cx: 0, cy: -196, rx: 176, ry: 196, fill: `url(#${id})` }, null), defs.nextSibling)
  }
})()
