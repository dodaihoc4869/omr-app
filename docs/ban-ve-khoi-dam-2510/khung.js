// KHUNG DÙNG CHUNG cho bản vẽ «Khối đậm» (25/10). Mỗi màn: <body data-app="hs|gv" data-tab="…" [data-khung="man-con" data-tieu="…" data-phu="…" data-ve="…"] [data-khung="khong"]>
//   <main class="khung">…nội dung…</main>. Thêm `?toi` vào địa chỉ ⇒ chế độ tối. Hàm vẽ biểu đồ dùng chung: veDuong(id, so, tuyChon), veCot(id, so, tuyChon).
(() => {
  if (location.search.includes('toi')) document.documentElement.dataset.theme = 'dark'
  const NAV = {
    hs: [['hom-nay', 'Hôm nay'], ['hanh-trinh', 'Hành trình'], ['on-sua', 'Ôn & sửa'], ['ket-qua', 'Kết quả']],
    // Menu app thầy (bản 2.0 đang dùng) + nhóm «Việc trên lớp» gom các màn vẫn mở được từ Hôm nay / Hành trình.
    gv: [['hom-nay', 'Hôm nay', '◉'], ['hanh-trinh', 'Hành trình', '↗'], ['ca-kiem-tra', 'Ca kiểm tra', '◷', '1'], ['hoc-sinh', 'Học sinh', '☺'], ['kho-de', 'Kho đề', '▤'],
      ['#', 'Việc trên lớp'], ['goi-bang', 'Gọi lên bảng', '✋'], ['hs-hoi', 'Học sinh hỏi', '?', '7'], ['go-nut', 'Gỡ nút thắt', '✂'], ['giao-bai', 'Giao bài tập về nhà', '✎'], ['giao-tuan', 'Giao đề theo tuần', '▦']],
  }
  const NAV_DUOI_GV = [['hom-nay', 'Hôm nay'], ['ca-kiem-tra', 'Ca'], ['hoc-sinh', 'Học sinh'], ['kho-de', 'Kho đề'], ['khac', 'Thêm']]
  const b = document.body, app = b.dataset.app || 'hs', tab = b.dataset.tab || 'hom-nay', kieu = b.dataset.khung || 'day-du'
  const main = document.querySelector('main')
  if (kieu === 'khong') return
  const logo = '<div class="logo"><i>Đ</i>Đỗ Đại Học</div>'
  const dauConHtml = `<a class="ve">← ${b.dataset.ve || 'Hôm nay'}</a><div class="tieu-man">${b.dataset.tieu || ''}${b.dataset.phu ? `<small>${b.dataset.phu}</small>` : ''}</div>`
  if (app === 'hs') {
    const dau = document.createElement('header'); dau.className = 'dau'
    // Đầu trang HS đúng app thật: Vào ca kiểm tra · chuông thông báo · «Của em» (ảnh đại diện). Máy tính: thêm 4 thẻ điều hướng.
    const chuong = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'
    const phaiHs = '<span class="nut san-ho an-dt">Vào ca kiểm tra</span><span class="nut chuong" aria-label="Thông báo, 2 chưa đọc">' + chuong + '<b>2</b></span><span class="av" style="width:44px;height:44px">An</span>'
    dau.innerHTML = `<div class="khung">${kieu === 'man-con' ? dauConHtml : logo}<span style="margin-left:auto"></span>
      <nav class="dieu-huong">${NAV.hs.map(([k, t]) => `<span class="nut${k === tab ? ' dang' : ''}">${t}</span>`).join('')}</nav>
      ${kieu === 'man-con' ? '' : phaiHs}</div>`
    b.prepend(dau)
    if (kieu !== 'man-con' || b.dataset.duoi === 'co') {
      b.classList.add('co-duoi')
      const duoi = document.createElement('nav'); duoi.className = 'duoi'
      duoi.innerHTML = `<div class="cong-tac">${NAV.hs.map(([k, t]) => `<span${k === tab ? ' class="on"' : ''}>${t}</span>`).join('')}</div>`
      b.append(duoi)
    }
    if (b.dataset.ai !== 'khong') { const ai = document.createElement('div'); ai.className = 'ai-bong'; ai.textContent = 'AI'; b.append(ai) }
  } else {
    const vo = document.createElement('div'); vo.className = 'app-gv'
    const ben = document.createElement('aside'); ben.className = 'ben'
    ben.innerHTML = logo + NAV.gv.map(([k, t, bt, so]) => k === '#' ? `<div class="nhom">${t}</div>` : `<span class="muc${k === tab ? ' on' : ''}"><span class="bt">${bt}</span>${t}${so ? `<b>${so}</b>` : ''}</span>`).join('')
      + `<span class="muc day${tab === 'cai-dat' ? ' on' : ''}"><span class="bt">⚙</span>Cài đặt</span>`
    const chinh = document.createElement('div'); chinh.className = 'chinh-gv'
    const dau = document.createElement('header'); dau.className = 'dau'
    dau.innerHTML = `<div class="khung">${kieu === 'man-con' ? dauConHtml + '<span style="margin-left:auto"></span>' : '<div class="tim"><span>⌕</span><span>Tìm học sinh, đề, câu, lớp</span><kbd>⌘K</kbd></div>'}${b.dataset.nutDau || ''}</div>`
    main.replaceWith(vo); vo.append(ben, chinh); chinh.append(dau, main)
    if (b.dataset.duoi !== 'khong') {
      b.classList.add('co-duoi')
      const duoi = document.createElement('nav'); duoi.className = 'duoi'
      duoi.innerHTML = `<div class="cong-tac">${NAV_DUOI_GV.map(([k, t]) => `<span${k === tab || (k === 'khac' && !NAV_DUOI_GV.some(([q]) => q === tab)) ? ' class="on"' : ''}>${t}</span>`).join('')}</div>`
      b.append(duoi)
    }
  }
})()

const _bien = (k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim()
/** Biểu đồ đường + vùng như ảnh mẫu: viền mực dày, đường xanh, mốc vàng, số cuối trong nhãn. so: mảng số; tc: { max, buoc, moc: [[giá trị, chữ]], nhanCuoi, dinhDang } */
function veDuong(id, so, tc = {}) {
  const sv = document.getElementById(id), W = sv.clientWidth, H = sv.clientHeight, n = so.length
  sv.setAttribute('viewBox', `0 0 ${W} ${H}`)
  const max = tc.max ?? Math.ceil(Math.max(...so) / (tc.buoc || 100)) * (tc.buoc || 100), buoc = tc.buoc || max / 4, dd = tc.dinhDang || ((v) => v.toLocaleString('vi-VN'))
  const x = (i) => 50 + (i / Math.max(1, n - 1)) * (W - 92), y = (v) => H - 24 - (v / max) * (H - 52)
  let g = ''
  for (let k = 0; k <= max + 1e-9; k += buoc) g += `<line x1="50" x2="${W - 30}" y1="${y(k)}" y2="${y(k)}" stroke="${_bien('--ke')}" stroke-dasharray="3 5"/><text x="42" y="${y(k) + 4}" text-anchor="end" font-family="IBM Plex Mono" font-size="12" fill="${_bien('--mo')}">${dd(k)}</text>`
  for (const [m, t] of tc.moc || []) {
    const i = so.findIndex((v) => v >= m); if (i < 0 || x(n - 1) - x(i) < 120) continue
    g += `<line x1="${x(i)}" x2="${x(i)}" y1="34" y2="${H - 24}" stroke="${_bien('--muc')}" stroke-dasharray="4 4" opacity=".5"/><foreignObject x="${x(i) - 64}" y="2" width="128" height="30"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center"><span class="moc">${t}</span></div></foreignObject>`
  }
  const d = so.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  if (tc.vung !== false) g += `<path d="${d}L${x(n - 1)},${H - 24}L${x(0)},${H - 24}Z" fill="${_bien('--xanh-nhat')}"/>`
  g += `<path d="${d}" fill="none" stroke="${_bien('--muc')}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${tc.mau || _bien('--xanh')}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`
  g += `<circle cx="${x(n - 1)}" cy="${y(so[n - 1])}" r="8" fill="${tc.mau || _bien('--xanh')}" stroke="${_bien('--muc')}" stroke-width="3"/>`
  const nc = tc.nhanCuoi ?? dd(so[n - 1])
  if (nc) g += `<foreignObject x="${x(n - 1) - 150}" y="${Math.max(0, y(so[n - 1]) - 46)}" width="156" height="32"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:right"><span class="chip" style="min-height:26px;padding:3px 9px;box-shadow:2px 2px 0 var(--bong);font-weight:600">${nc}</span></div></foreignObject>`
  sv.innerHTML = g
}
/** Biểu đồ cột viền mực (mỗi cột một ngày / một lớp). so: [[nhãn, giá trị, màu?]] */
function veCot(id, so, tc = {}) {
  const sv = document.getElementById(id), W = sv.clientWidth, H = sv.clientHeight, n = so.length
  sv.setAttribute('viewBox', `0 0 ${W} ${H}`)
  const max = tc.max ?? Math.max(...so.map((s) => s[1])) * 1.15, rong = (W - 60) / n
  let g = ''
  for (let k = 0; k <= 4; k++) { const yy = H - 26 - (k / 4) * (H - 46); g += `<line x1="40" x2="${W - 10}" y1="${yy}" y2="${yy}" stroke="${_bien('--ke')}" stroke-dasharray="3 5"/><text x="34" y="${yy + 4}" text-anchor="end" font-family="IBM Plex Mono" font-size="11" fill="${_bien('--mo')}">${Math.round((max * k) / 4)}${tc.donVi || ''}</text>` }
  so.forEach(([t, v, mau], i) => {
    const h = (v / max) * (H - 46), xx = 46 + i * rong + rong * 0.18, w = rong * 0.64
    g += `<rect x="${xx + 3}" y="${H - 26 - h + 3}" width="${w}" height="${h}" rx="6" fill="${_bien('--bong')}"/><rect x="${xx}" y="${H - 26 - h}" width="${w}" height="${h}" rx="6" fill="${mau || _bien('--xanh')}" stroke="${_bien('--muc')}" stroke-width="2.5"/>`
    g += `<text x="${xx + w / 2}" y="${H - 8}" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" fill="${_bien('--mo')}">${t}</text>`
  })
  sv.innerHTML = g
}
