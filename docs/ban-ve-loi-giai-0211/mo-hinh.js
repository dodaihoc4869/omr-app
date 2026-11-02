// Mô hình que – bóng ester R–COO–R' theo n (bản vẽ). Một đồng phân đại diện mỗi n; n = 1 ⇒ HCOOH (acid, R' = 0 C) để em tự thấy vì sao n ≥ 2.
(() => {
  const o = document.getElementById('n'); if (!o) return
  const svg = document.getElementById('mh'), ct = document.getElementById('n-ct'), ten = document.getElementById('n-ten'), chip = document.getElementById('n-chip'), kq = ct.parentElement
  // [số C phần acid (kể cả C của COO), số C gốc alcohol, tên, công thức thu gọn]
  const DS = { 1: [1, 0, 'formic acid — acid, không phải ester', 'HCOOH'], 2: [1, 1, 'methyl formate', 'HCOOCH₃'], 3: [2, 1, 'methyl acetate', 'CH₃COOCH₃'], 4: [2, 2, 'ethyl acetate', 'CH₃COOC₂H₅'], 5: [2, 3, 'propyl acetate', 'CH₃COOCH₂CH₂CH₃'] }
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' }
  const sub = (k) => String(k).replace(/\d/g, (d) => SUB[d])
  const ve = () => {
    const n = +o.value, [a, b, tn, tg] = DS[n]
    const nut = []
    if (a === 1) nut.push('H'); for (let i = 0; i < a - 1; i++) nut.push('C')
    nut.push('Cc'); nut.push('O'); for (let i = 0; i < b; i++) nut.push('C'); if (b === 0) nut.push('H')
    const W = 340, buoc = Math.min(52, (W - 40) / (nut.length - 1)), x0 = (W - buoc * (nut.length - 1)) / 2
    const P = nut.map((_, i) => [x0 + i * buoc, i % 2 ? 98 : 72])
    const ic = nut.indexOf('Cc'), io = ic + 1
    let s = `<rect class="vung-c" x="${P[ic][0] - 24}" y="8" width="${P[io][0] - P[ic][0] + 48}" height="122" rx="18"/>`
    s += `<text class="nhan-v" x="${(P[ic][0] + P[io][0]) / 2}" y="144" text-anchor="middle">chức COO</text>`
    for (let i = 1; i < P.length; i++) s += `<line class="lk" x1="${P[i - 1][0]}" y1="${P[i - 1][1]}" x2="${P[i][0]}" y2="${P[i][1]}"/>`
    const oy = P[ic][1] - 50
    s += `<line class="lk" x1="${P[ic][0] - 4}" y1="${P[ic][1]}" x2="${P[ic][0] - 4}" y2="${oy}"/><line class="lk" x1="${P[ic][0] + 4}" y1="${P[ic][1]}" x2="${P[ic][0] + 4}" y2="${oy}"/>`
    const bong = (x, y, k) => { const r = k === 'H' ? 10 : k === 'O' ? 15 : 16, l = k === 'H' ? 'bh' : k === 'O' ? 'bo' : 'bc'
      return `<g class="nut-a"><circle class="${l}" cx="${x}" cy="${y}" r="${r}"/><circle class="bong-s" cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 3}"/><text class="${k === 'H' ? 'th' : 'tc'}" x="${x}" y="${y + 4.5}" text-anchor="middle">${k === 'Cc' ? 'C' : k}</text></g>` }
    s += bong(P[ic][0], oy, 'O')
    nut.forEach((k, i) => { s += bong(P[i][0], P[i][1], k) })
    svg.innerHTML = s
    ct.innerHTML = `C${n > 1 ? sub(n) : ''}H${sub(2 * n)}O₂ · ${tg}`
    ten.textContent = tn
    chip.textContent = `n = ${n}`
    kq.toggleAttribute('data-acid', n === 1)
  }
  o.addEventListener('input', ve); ve()
})()
