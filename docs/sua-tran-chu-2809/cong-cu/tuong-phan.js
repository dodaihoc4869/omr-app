(() => {
  const rgb = (s) => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 1] }
  const L = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const nen = (el) => { for (let a = el; a; a = a.parentElement) { const c = rgb(getComputedStyle(a).backgroundColor); if ((c[3] ?? 1) > 0.5) return c } return [255, 255, 255] }
  const out = []
  for (const b of document.querySelectorAll('.ct button, .ct-nut-chinh')) {
    const t = b.textContent.trim(); if (!t || !b.getClientRects().length) continue
    const cs = getComputedStyle(b); if (cs.visibility === 'hidden') continue
    const fg = rgb(cs.color), bg = nen(b)
    const [a, c] = [L(fg), L(bg)].sort((x, y) => y - x)
    const tl = (a + 0.05) / (c + 0.05)
    out.push({ t: t.slice(0, 30), cls: b.className.slice(0, 40), tl: Math.round(tl * 100) / 100, dis: b.disabled })
  }
  return out.filter(x => x.tl < 4.5)
})()
