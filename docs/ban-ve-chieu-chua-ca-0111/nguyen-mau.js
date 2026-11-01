// NGUYÊN MẪU phần MỚI trên tờ chiếu chuẩn (chỉ để vẽ — bản build sẽ nằm trong `html-may-chieu.ts`):
//   · góc trên cột phải (chỗ thẻ tên em lên bảng): THẺ «EM CHƯA ĐÚNG CÂU NÀY» — số em + tên (hai chữ cuối), màu trung tính, không đỏ (luật tế nhị trước lớp);
//   · đầu đề thêm chip MỨC ĐỘ (Vận dụng / Hiểu / Biết) để thầy thấy vì sao câu đứng ở vị trí này;
//   · thanh dưới: «Câu n/9» thay «Đợt», pha «CHỮA BÀI», bỏ nút «Lên bảng», thêm phím H «Ẩn tên» (bấm lại hiện tên).
;(() => {
  const DS = window.__DS || []
  const MUC = { van_dung: 'Vận dụng', hieu: 'Hiểu', biet: 'Biết' }
  const ten2 = (t) => t.trim().split(/\s+/).slice(-2).join(' ')
  const st = document.createElement('style')
  st.textContent = `
  body.mc-bc .mc-cot-lam-bai::before{content:none!important}
  #mc-len-bang{display:none!important}
  .ve-sai{position:absolute;top:0;left:0;right:0;z-index:5;margin:0;text-align:left;padding:calc(var(--u)*1.25) calc(var(--u)*1.4) calc(var(--u)*1.1);border-radius:clamp(14px,1.72vw,30px);background:var(--mc-giay);color:var(--mc-chu);box-shadow:0 0 0 1px var(--mc-vien)}
  .ve-sai-dau{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:calc(var(--u)*.7);margin:0 0 calc(var(--u)*.9)}
  .ve-sai-dau b{font:800 calc(var(--u)*2.6)/1 var(--mc-sans,system-ui);letter-spacing:-.02em}.ve-sai-dau b small{font-size:.5em;font-weight:700;color:var(--mc-phu);letter-spacing:0}
  .ve-sai-dau span{font:600 calc(var(--u)*1.2)/1.25 var(--mc-sans,system-ui);color:var(--mc-phu)}
  .ve-sai ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--cot),minmax(0,1fr));gap:calc(var(--u)*.35) calc(var(--u)*1)}
  .ve-sai li{font:600 var(--co)/1.3 var(--mc-sans,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ve-sai .ve-them{color:var(--mc-phu)}
  body.ve-an-ten .ve-sai ol{display:none}
  .ve-muc{margin-left:calc(var(--u)*.5)}
  `
  document.head.append(st)
  document.querySelectorAll('.mc-dot').forEach((dot, i) => {
    const d = DS[i]
    if (!d) return
    const cot = dot.querySelector('.mc-cot-lam-bai')
    if (cot) {
      const n = d.sai.length
      const soCot = n <= 8 ? 2 : n <= 18 ? 2 : 3
      const co = n <= 8 ? 'calc(var(--u)*1.6)' : n <= 18 ? 'calc(var(--u)*1.3)' : 'calc(var(--u)*1.15)'
      const toiDa = 30
      const hien = d.sai.slice(0, n > toiDa ? toiDa - 1 : toiDa)
      const a = document.createElement('aside')
      a.className = 've-sai'
      a.setAttribute('aria-label', 'Em chưa đúng câu này')
      a.style.setProperty('--cot', String(soCot))
      a.style.setProperty('--co', co)
      a.innerHTML = `<div class="ve-sai-dau"><b>${n}<small>/${d.lam}</small></b><span>em chưa đúng câu này</span></div><ol>${hien.map((t) => `<li>${ten2(t)}</li>`).join('')}${n > hien.length ? `<li class="ve-them">+${n - hien.length} em</li>` : ''}</ol>`
      cot.append(a)
    }
    const dau = dot.querySelector('.mc-de-dau')
    if (dau && MUC[d.mucDo]) dau.insertAdjacentHTML('beforeend', `<span class="mc-de-phan ve-muc">${MUC[d.mucDo]}</span>`)
  })
  const dem = document.getElementById('mc-dem')
  const sua = () => { if (dem && /Đợt/.test(dem.textContent)) dem.textContent = dem.textContent.replace('Đợt', 'Câu') }
  sua()
  if (dem) new MutationObserver(sua).observe(dem, { childList: true, characterData: true, subtree: true })
  const pha = document.getElementById('mc-pha')
  const suaPha = () => { if (pha && pha.textContent !== 'CHỮA BÀI') pha.textContent = 'CHỮA BÀI' }
  suaPha()
  if (pha) new MutationObserver(suaPha).observe(pha, { childList: true, characterData: true, subtree: true })
  const nhom = document.getElementById('mc-phim-nhom')
  if (nhom) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'mc-nut-phim'
    b.innerHTML = '<kbd>H</kbd><span class="mc-nut-chu">Ẩn tên</span>'
    b.onclick = () => { const an = document.body.classList.toggle('ve-an-ten'); b.querySelector('.mc-nut-chu').textContent = an ? 'Hiện tên' : 'Ẩn tên' }
    const tk = [...nhom.children].find((x) => /Thống kê/.test(x.textContent))
    nhom.insertBefore(b, tk ? tk.nextSibling : null)
  }
})()
