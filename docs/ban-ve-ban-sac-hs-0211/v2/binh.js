// BÌNH TAM GIÁC vector (hero «Mức hôm nay»): thuỷ tinh có dải phản quang, dung dịch đổ màu dọc + mặt khum + bọt,
// vạch chia = ranh chặng, vạch đứt = mức hôm nay. Tới mức ⇒ dung dịch hồng (phenolphtalein tới điểm tương đương).
// data-da, data-muc, data-chang="6,6,6,6". Màu chỉ từ biến --tr-* (stop-color qua style). Tĩnh hoàn toàn (máy yếu như nhau).
function binhDep(el) {
  const d = el.dataset, da = +d.da, muc = +d.muc, chang = (d.chang || '').split(',').filter(Boolean).map(Number), du = da >= muc
  const u = 'bd' + Math.random().toString(36).slice(2, 7), f = (n) => n.toFixed(1)
  const DAY = 214, MUC = 98, y = DAY - (Math.min(da, muc * 1.3) / muc) * (DAY - MUC)
  const xP = (yy) => 118 + Math.max(0, yy - 74) * (56 / 122), xT = (yy) => 82 - Math.max(0, yy - 74) * (56 / 122)
  const vo = 'M84 18 V74 L28 190 Q20 208 36 214 Q44 217 54 217 H146 Q156 217 164 214 Q180 208 172 190 L116 74 V18 Z'
  const c = du ? 'var(--tr-tim)' : 'var(--tr-hs)'
  let s = `<svg class="binh-dep" viewBox="0 0 200 236" role="img" aria-label="${du ? `Đủ mức hôm nay: ${da} câu (mức ${muc})` : `Hôm nay ${da}/${muc} câu`}"><defs>
    <clipPath id="${u}c"><path d="${vo}"/></clipPath>
    <linearGradient id="${u}k" x1="0" x2="1"><stop offset="0" style="stop-color:var(--tr-mat);stop-opacity:.55"/><stop offset=".45" style="stop-color:var(--tr-mat);stop-opacity:.12"/><stop offset="1" style="stop-color:var(--tr-mat);stop-opacity:.4"/></linearGradient>
    <linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in oklab, ${c} 55%, var(--tr-mat))"/><stop offset="1" style="stop-color:color-mix(in oklab, ${c} 92%, var(--tr-chu))"/></linearGradient>
    <radialGradient id="${u}b" cx=".35" cy=".35" r=".7"><stop offset="0" style="stop-color:var(--tr-mat);stop-opacity:.95"/><stop offset="1" style="stop-color:var(--tr-mat);stop-opacity:.15"/></radialGradient>
  </defs>`
  s += `<ellipse cx="100" cy="226" rx="74" ry="7" style="fill:var(--tr-phu);opacity:.35"/>`
  s += `<path d="${vo}" fill="url(#${u}k)"/>`
  s += `<g clip-path="url(#${u}c)"><rect x="0" y="${f(y)}" width="200" height="${f(240 - y)}" fill="url(#${u}l)"/>`
  s += `<ellipse cx="100" cy="${f(y)}" rx="${f((xP(y) - xT(y)) / 2)}" ry="4.5" style="fill:color-mix(in oklab, ${c} 35%, var(--tr-mat))"/>`
  for (const [bx, by, r] of [[70, 200, 6], [118, 190, 4], [138, 204, 5], [92, 178, 3], [108, 206, 2.5], [150, 186, 2.5]]) if (by > y + 9) s += `<circle cx="${bx}" cy="${by}" r="${r}" fill="url(#${u}b)"/>`
  s += `</g>`
  // vạch chia (ranh chặng) + vạch mức
  let cong = 0
  for (const n of chang.slice(0, -1)) { cong += n; const yv = DAY - (cong / muc) * (DAY - MUC); s += `<line x1="${f(xP(yv) - 18)}" x2="${f(xP(yv) - 5)}" y1="${f(yv)}" y2="${f(yv)}" style="stroke:color-mix(in oklab, var(--tr-chu) 45%, transparent);stroke-width:2.2;stroke-linecap:round"/>` }
  s += `<line x1="${f(xT(MUC) + 5)}" x2="${f(xP(MUC) - 5)}" y1="${MUC}" y2="${MUC}" style="stroke:var(--tr-tim-chu);stroke-width:2.4;stroke-dasharray:5 5;stroke-linecap:round"/>`
  // vỏ + phản quang
  s += `<path d="${vo}" style="fill:none;stroke:color-mix(in oklab, var(--tr-chu) 62%, transparent);stroke-width:3.2;stroke-linejoin:round"/>`
  s += `<rect x="78" y="10" width="44" height="11" rx="5.5" style="fill:color-mix(in oklab, var(--tr-mat) 70%, transparent);stroke:color-mix(in oklab, var(--tr-chu) 62%, transparent);stroke-width:3"/>`
  s += `<path d="M91 28 V76 M76 104 L46 168" style="fill:none;stroke:var(--tr-mat);stroke-width:5.5;stroke-linecap:round;opacity:.9"/><path d="M42 182 L39 189" style="fill:none;stroke:var(--tr-mat);stroke-width:5.5;stroke-linecap:round;opacity:.9"/>`
  el.innerHTML = s + '</svg>'
}
document.querySelectorAll('[data-binh-dep]').forEach(binhDep)
