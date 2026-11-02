// Hình khối M3 Expressive vẽ bằng mã (không ảnh): bánh quy n múi (logo app HS là bánh quy 12 múi), cỏ 4 lá, hoa 8 cánh, lục giác bo; vòng tiến độ ô tích.
const banh = (n = 12, a = 0.075, r0 = 50) => { let d = ''
  for (let i = 0; i <= 240; i++) { const t = (i / 240) * 2 * Math.PI, r = r0 * (1 + a * Math.cos(n * t)); d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(t) / (1 + a)).toFixed(2)} ${(50 + r * Math.sin(t) / (1 + a)).toFixed(2)}` }
  return d + 'Z' }
const HINH = { banh: banh(12, 0.075), co: banh(4, 0.2), hoa: banh(8, 0.12), song: banh(6, 0.1),
  luc: 'M50 3 Q55 3 60 6 L88 22 Q95 26 95 34 V66 Q95 74 88 78 L60 94 Q55 97 50 97 Q45 97 40 94 L12 78 Q5 74 5 66 V34 Q5 26 12 22 L40 6 Q45 3 50 3Z',
  vien: 'M30 5 H70 A25 25 0 0 1 95 30 V70 A25 25 0 0 1 70 95 H30 A25 25 0 0 1 5 70 V30 A25 25 0 0 1 30 5Z' }
for (const el of document.querySelectorAll('[data-hinh]')) el.insertAdjacentHTML('afterbegin', `<svg class="banh" viewBox="0 0 100 100" aria-hidden="true"><path d="${HINH[el.dataset.hinh]}"/></svg>`)
for (const el of document.querySelectorAll('[data-vong]')) { const [k, n] = el.dataset.vong.split('/').map(Number), c = 2 * Math.PI * 16
  el.insertAdjacentHTML('afterbegin', `<svg class="vong" viewBox="0 0 38 38" aria-hidden="true"><circle class="n" cx="19" cy="19" r="16"/><circle class="c" cx="19" cy="19" r="16" stroke-dasharray="${(c * k / n).toFixed(1)} ${c.toFixed(1)}"/></svg>`) }
