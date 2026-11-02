// Bộ phát «hoạt hoạ lời giải» của bản vẽ — thay video bằng SVG/HTML chạy theo NHỊP (mỗi nhịp một ý, đúng thứ tự thầy dẫn).
// Một màn chiếu: .chieu[data-so-nhip][data-t] · vạch .vach (tự dựng) · lời từng nhịp .loi-nhip > [data-n] · phần tử [data-tu="k"] (hiện từ nhịp k),
// [data-chi="k m"] (chỉ hiện ở nhịp đó), [data-buoc="k"] (thừa số phép tính: sáng ở nhịp k, giữ sau đó), .bi[data-x="x1 x2 …"] (bi trượt theo nhịp),
// nút tác động [data-den="k"]. Tự chạy MỘT lượt khi lọt vào màn, chạm vạch để nhảy, hết lượt thì dừng (không lặp vô hạn).
// Chụp ảnh (navigator.webdriver) hoặc data-co-dinh="k" ⇒ đứng yên ở nhịp đó.
(() => {
  const tinh = navigator.webdriver
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches
  const IC = {
    phat: '<svg class="i2" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
    dung: '<svg class="i2" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
    lai: '<svg class="i2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 12 7v3L7.5 6 12 2v3Z"/></svg>',
  }
  for (const r of document.querySelectorAll('.chieu')) {
    const N = +r.dataset.soNhip, T = +(r.dataset.t || 3400)
    const vach = r.querySelector('.vach'), dem = r.querySelector('.dem'), phat = r.querySelector('.phat')
    vach.innerHTML = Array.from({ length: N }, (_, i) => `<button type="button" aria-label="Nhịp ${i + 1} trên ${N}"><i></i></button>`).join('')
    vach.style.setProperty('--t', T + 'ms')
    const vb = [...vach.children]
    let n = 1, chay = false, hen = 0, dung = false
    const ve = () => {
      vb.forEach((b, i) => { b.toggleAttribute('data-xong', i + 1 < n || (dung && i + 1 === n)); if (i + 1 === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.removeAttribute('data-chay') })
      for (const e of r.querySelectorAll('[data-tu]')) e.classList.toggle('bat', n >= +e.dataset.tu)
      for (const e of r.querySelectorAll('[data-chi]')) e.classList.toggle('bat', e.dataset.chi.split(' ').map(Number).includes(n))
      for (const e of r.querySelectorAll('[data-buoc]')) { e.classList.toggle('bat', n >= +e.dataset.buoc); e.classList.toggle('sang', n === +e.dataset.buoc) }
      for (const e of r.querySelectorAll('.loi-nhip > [data-n]')) e.classList.toggle('bat', +e.dataset.n === n)
      for (const e of r.querySelectorAll('.bi[data-x]')) e.style.transform = `translateX(${e.dataset.x.split(' ')[n - 1] || 0}px)`
      for (const e of r.querySelectorAll('[data-den]')) e.setAttribute('aria-pressed', String(+e.dataset.den === n))
      r.dataset.nhip = n
      if (dem) dem.textContent = `Bước ${n}/${N}`
      if (phat) phat.innerHTML = chay ? IC.dung + 'Dừng' : n === N ? IC.lai + 'Xem lại' : IC.phat + 'Chạy tiếp'
    }
    const toi = () => {
      clearTimeout(hen); ve()
      if (!chay) return
      requestAnimationFrame(() => requestAnimationFrame(() => vb[n - 1].setAttribute('data-chay', '')))
      hen = setTimeout(() => { if (n < N) { n++; toi() } else { chay = false; ve() } }, giam ? T + 800 : T)
    }
    const den = (k, choi) => { n = k; chay = choi; toi() }
    vb.forEach((b, i) => b.addEventListener('click', () => den(i + 1, false)))
    for (const e of r.querySelectorAll('[data-den]')) e.addEventListener('click', () => den(+e.dataset.den, false))
    phat?.addEventListener('click', () => { if (chay) { chay = false; ve(); clearTimeout(hen) } else den(n === N ? 1 : n, true) })
    const coDinh = r.dataset.coDinh || (tinh ? r.dataset.chup || String(N) : '')
    if (coDinh) { n = +coDinh; dung = true; ve(); continue }
    ve()
    const io = new IntersectionObserver((ds) => { if (ds[0].isIntersecting) { io.disconnect(); den(1, true) } }, { threshold: 0.5 })
    io.observe(r)
  }
  // thẻ bẫy lật dọc · thẻ nhớ lật ngang · câu tự trả lời
  for (const b of document.querySelectorAll('.bay > button, .lat-the')) b.addEventListener('click', () => { const t = b.parentElement; t.toggleAttribute('data-mo'); b.setAttribute('aria-expanded', String(t.hasAttribute('data-mo'))) })
  for (const b of document.querySelectorAll('.hoi .nut')) b.addEventListener('click', () => { const t = b.parentElement.querySelector('.tra'); t.hidden = !t.hidden; b.textContent = t.hidden ? 'Xem câu trả lời' : 'Ẩn câu trả lời' })
})()
