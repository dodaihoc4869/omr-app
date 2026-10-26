// KHUNG BẢN VẼ «TRONG» (26/10). Mỗi màn: <body data-app="hs|gv" data-tab="…"> <main class="khung">…</main> <script src="khung.js"></script>
//   Màn con: data-khung="man-con" data-tieu="Tên màn" data-phu="dòng phụ" data-ve="Hôm nay" (nút quay lại) [data-nut-dau='<span class="nut">…</span>'].
//   Toàn màn (đăng nhập, làm bài thi): data-khung="khong". App thầy: data-nut-dau='…' đặt nút ở đầu trang.
//   Biểu tượng: <i data-i="ten"></i> (bộ nét Lucide, 1,9). `?toi` ⇒ nền tối. Biểu đồ: veDuong(id, so, tc), veCot(id, [[nhãn, số, 'dung'|'sai'|…]], tc).
const ICON = {
  'home': '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  'route': '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  'history': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  'chart': '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  'clipboard': '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'chevron': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'back': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'play': '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'book': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  'sparkles': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'library': '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'calendar': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'ask': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  'board': '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  'puzzle': '<path d="M15.39 4.39a1 1 0 0 0 1.68-.47 2.5 2.5 0 1 1 3.01 3.01 1 1 0 0 0-.47 1.68l1.68 1.68a2.4 2.4 0 0 1 0 3.42l-1.61 1.61a.98.98 0 0 1-.84.28c-.47-.07-.8-.48-.97-.93a2.5 2.5 0 1 0-3.21 3.21c.45.17.86.5.93.97a.98.98 0 0 1-.28.84l-1.61 1.61a2.4 2.4 0 0 1-3.42 0l-1.57-1.57a1.03 1.03 0 0 0-.88-.29c-.49.07-.84.5-1.02.97a2.5 2.5 0 1 1-3.24-3.24c.46-.18.9-.53.97-1.02a1.03 1.03 0 0 0-.29-.88L2.7 13.7a2.4 2.4 0 0 1 0-3.42L4.23 8.77c.24-.24.58-.35.92-.3.51.08.87.53 1.07 1.01a2.5 2.5 0 1 0 3.26-3.26c-.48-.2-.93-.56-1.01-1.07-.05-.34.06-.68.3-.92L10.3 2.7a2.4 2.4 0 0 1 3.42 0Z"/>',
  'pen': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'more': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  'bulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  'flag': '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  'grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  'image': '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'logout': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  'qr': '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  'filter': '<path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  'star': '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/>',
  'monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'zap': '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'expand': '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  'cap': '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  'list': '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  'layers': '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  'pause': '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'hand': '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
}
function icon(ten, lop = '') { return `<svg class="i ${lop}" viewBox="0 0 24 24" aria-hidden="true">${ICON[ten] || ICON.info}</svg>` }

;(() => {
  if (location.search.includes('toi')) document.documentElement.dataset.theme = 'dark'
  const b = document.body, app = b.dataset.app || 'hs', tab = b.dataset.tab || 'hom-nay', kieu = b.dataset.khung || 'day-du'
  const main = document.querySelector('main')
  const thayIcon = () => document.querySelectorAll('i[data-i]').forEach((e) => { e.outerHTML = icon(e.dataset.i, e.className) })
  if (kieu === 'khong') { thayIcon(); return }
  const conHtml = `<a class="ve-lai">${icon('back')}<span class="an-dt">${b.dataset.ve || 'Hôm nay'}</span></a><div class="tieu-man"><b>${b.dataset.tieu || ''}</b>${b.dataset.phu ? `<small>${b.dataset.phu}</small>` : ''}</div>`
  if (app === 'hs') {
    const NAV = [['hom-nay', 'Hôm nay', 'home'], ['hanh-trinh', 'Hành trình', 'route'], ['on-sua', 'Ôn & sửa', 'history'], ['ket-qua', 'Kết quả', 'chart']]
    const dau = document.createElement('header'); dau.className = 'dau'
    const brand = '<div class="thuong-hieu"><img src="logo/logo-hs-nho.svg" alt=""><span>Đỗ Đại Học<small>Học Hoá mỗi ngày</small></span></div>'
    const phai = '<span class="nut nhe an-dt">' + icon('clipboard') + 'Vào ca kiểm tra</span>'
      + '<span class="nut vuong nut-chuong" aria-label="Thông báo, 2 chưa đọc">' + icon('bell') + '<span class="dem-so">2</span></span>'
      + '<span class="av lon a1">MA</span>'
    dau.innerHTML = `<div class="khung">${kieu === 'man-con' ? conHtml : brand}<span class="day"></span>`
      + (kieu === 'man-con' ? (b.dataset.nutDau || '') : `<nav class="nav-tren">${NAV.map(([k, t, ic]) => `<span class="${k === tab ? 'on' : ''}">${icon(ic, 'nho')}${t}</span>`).join('')}</nav><span class="day"></span>${phai}`) + '</div>'
    const menuBen = b.dataset.menu // 'phai' | 'trai': menu dọc thu gọn thành chấm (bản vẽ 26/10 tối) — thay thanh đáy + tab trên
    if (!menuBen || kieu === 'man-con') b.prepend(dau)
    if (menuBen) {
      b.classList.add('co-menu-cham')
      const cham = document.createElement('button'); cham.className = 'menu-cham ' + menuBen + (b.dataset.menuMo ? ' chi-cham' : ''); cham.setAttribute('aria-label', 'Mở menu'); cham.innerHTML = '<i></i><b></b><s></s>'
      b.append(cham)
      if (b.dataset.menuMo) {
        const phu = document.createElement('div'); phu.className = 'menu-phu'; b.append(phu)
        const doc = document.createElement('nav'); doc.className = 'menu-doc ' + menuBen; doc.setAttribute('aria-label', 'Điều hướng học sinh')
        doc.innerHTML = '<div class="menu-doc-dau"><img src="logo/logo-hs-nho.svg" alt=""><span>Đỗ Đại Học</span></div>'
          + NAV.map(([k, t, ic]) => `<span class="muc${k === tab ? ' on' : ''}">${icon(ic)}${t}</span>`).join('')
          + '<div class="vach"></div><span class="muc">' + icon('clipboard') + 'Vào ca kiểm tra</span>'
          + '<span class="muc">' + icon('bell') + 'Thông báo<span class="dem-so">2</span></span>'
          + '<span class="muc">' + icon('refresh') + 'Cập nhật bài học</span>'
          + '<span class="muc"><span class="av a1" style="width:24px;height:24px;font-size:10px">MA</span>Của em</span><span class="tay"></span>'
        b.append(doc)
      }
    } else if (kieu !== 'man-con' || b.dataset.duoi === 'co') {
      b.classList.add('co-duoi')
      const duoi = document.createElement('nav'); duoi.className = 'duoi'
      duoi.innerHTML = `<div>${NAV.map(([k, t, ic]) => `<span class="${k === tab ? 'on' : ''}"><i>${icon(ic)}</i>${t}</span>`).join('')}</div>`
      b.append(duoi)
    }
    if (b.dataset.ai !== 'khong') { const ai = document.createElement('div'); ai.className = 'ai-bong'; ai.setAttribute('aria-label', 'Mở A.I Đỗ Đại Học'); ai.innerHTML = icon('sparkles'); b.append(ai) }
  } else {
    const NAV = [['hom-nay', 'Hôm nay', 'home'], ['hanh-trinh', 'Hành trình', 'route'], ['ca-kiem-tra', 'Ca kiểm tra', 'clipboard', '1'], ['hoc-sinh', 'Học sinh', 'users'], ['kho-de', 'Kho đề', 'library'],
      ['#', 'Việc trên lớp'], ['goi-bang', 'Gọi lên bảng', 'board'], ['hs-hoi', 'Học sinh hỏi', 'ask', '7'], ['go-nut', 'Gỡ nút thắt', 'puzzle'], ['giao-bai', 'Giao bài tập về nhà', 'pen'], ['giao-tuan', 'Giao đề theo tuần', 'calendar']]
    const vo = document.createElement('div'); vo.className = 'app-gv'
    const ben = document.createElement('aside'); ben.className = 'ben'
    ben.innerHTML = '<div class="thuong-hieu"><img src="logo/logo-gv-nho.svg" alt=""><span>Đỗ Đại Học<small>Giáo viên</small></span></div>'
      + NAV.map(([k, t, ic, so]) => k === '#' ? `<div class="nhom">${t}</div>` : `<span class="muc${k === tab ? ' on' : ''}">${icon(ic)}<span class="chu">${t}</span>${so ? `<span class="dem-so">${so}</span>` : ''}</span>`).join('')
      + `<div class="cuoi"><span class="muc${tab === 'cai-dat' ? ' on' : ''}">${icon('settings')}<span class="chu">Cài đặt</span></span><div class="toi-thay"><span class="av a4">ĐH</span><span class="ten-thay"><b style="font-size:14px">Thầy Đỗ Đại Học</b><br><span class="mo">270 học sinh · 14 lớp</span></span></div></div>`
    const chinh = document.createElement('div')
    const dau = document.createElement('header'); dau.className = 'dau'
    dau.innerHTML = `<div class="khung">${kieu === 'man-con' ? conHtml + '<span class="day"></span>' : `<img src="logo/logo-gv-nho.svg" alt="" class="chi-dt" style="width:30px;height:30px"><div class="tim">${icon('search', 'nho')}<span>Tìm học sinh, đề, câu, lớp</span><kbd>⌘K</kbd></div><span class="day"></span>`}${b.dataset.nutDau || ''}<span class="nut vuong nut-chuong">${icon('bell')}<span class="dem-so">3</span></span></div>`
    main.replaceWith(vo); vo.append(ben, chinh); chinh.append(dau, main)
    if (b.dataset.duoi !== 'khong') {
      b.classList.add('co-duoi')
      const D = [['hom-nay', 'Hôm nay', 'home'], ['ca-kiem-tra', 'Ca', 'clipboard'], ['hoc-sinh', 'Học sinh', 'users'], ['kho-de', 'Kho đề', 'library'], ['khac', 'Thêm', 'grid']]
      const duoi = document.createElement('nav'); duoi.className = 'duoi'; duoi.style.setProperty('--n', 5)
      duoi.innerHTML = `<div style="--n:5">${D.map(([k, t, ic]) => `<span class="${k === tab || (k === 'khac' && !D.some(([q]) => q === tab)) ? 'on' : ''}"><i>${icon(ic)}</i>${t}</span>`).join('')}</div>`
      b.append(duoi)
    }
  }
  thayIcon()
})()

const _bien = (k) => getComputedStyle(document.body).getPropertyValue(k).trim()
/** Biểu đồ đường mảnh + vùng mờ. so: mảng số; tc: { max, buoc, nhan: [..] (nhãn trục x), dinhDang, mau: '--bien', moc: [[giá trị, chữ]] } */
function veDuong(id, so, tc = {}) {
  const sv = document.getElementById(id), W = sv.clientWidth, H = sv.clientHeight, n = so.length
  sv.setAttribute('viewBox', `0 0 ${W} ${H}`)
  const buoc = tc.buoc || 25, max = tc.max ?? Math.ceil(Math.max(...so) / buoc) * buoc, dd = tc.dinhDang || ((v) => v.toLocaleString('vi-VN'))
  const L = 36, R = 12, T = 12, B = tc.nhan ? 28 : 12
  const x = (i) => L + (i / Math.max(1, n - 1)) * (W - L - R), y = (v) => T + (1 - v / max) * (H - T - B)
  const mau = _bien(tc.mau || '--chinh'), ke = _bien('--vien'), mo = _bien('--chu-3')
  let g = `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mau}" stop-opacity=".22"/><stop offset="1" stop-color="${mau}" stop-opacity="0"/></linearGradient></defs>`
  for (let k = 0; k <= max + 1e-9; k += buoc) g += `<line x1="${L}" x2="${W - R}" y1="${y(k)}" y2="${y(k)}" stroke="${ke}"/><text x="${L - 8}" y="${y(k) + 4}" text-anchor="end" font-size="11" fill="${mo}" font-family="Be Vietnam Pro">${dd(k)}</text>`
  if (tc.nhan) tc.nhan.forEach((t, i) => { if (t) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${mo}" font-family="Be Vietnam Pro">${t}</text>` })
  for (const [m, t] of tc.moc || []) g += `<line x1="${L}" x2="${W - R}" y1="${y(m)}" y2="${y(m)}" stroke="${_bien('--chu-y')}" stroke-dasharray="4 4"/><text x="${W - R}" y="${y(m) - 6}" text-anchor="end" font-size="11" fill="${_bien('--chu-y-chu')}" font-family="Be Vietnam Pro" font-weight="600">${t}</text>`
  const d = so.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  g += `<path d="${d}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#${id}-g)"/><path d="${d}" fill="none" stroke="${mau}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`
  g += `<circle cx="${x(n - 1)}" cy="${y(so[n - 1])}" r="5" fill="${_bien('--mat')}" stroke="${mau}" stroke-width="2.5"/>`
  sv.innerHTML = g
}
/** Biểu đồ cột bo tròn. so: [[nhãn, giá trị, màu? ('dung'|'sai'|'chu-y'|'tin'|'chinh'|'nhat')]]; tc: { max, buoc, dinhDang, soTren:true } */
function veCot(id, so, tc = {}) {
  const sv = document.getElementById(id), W = sv.clientWidth, H = sv.clientHeight, n = so.length
  sv.setAttribute('viewBox', `0 0 ${W} ${H}`)
  const buoc = tc.buoc || 10, max = tc.max ?? Math.ceil(Math.max(...so.map((s) => s[1])) / buoc) * buoc, dd = tc.dinhDang || ((v) => v.toLocaleString('vi-VN'))
  const L = tc.khongTruc ? 4 : 32, R = 4, T = tc.soTren ? 20 : 8, B = 26, rong = (W - L - R) / n
  const y = (v) => T + (1 - v / max) * (H - T - B), ke = _bien('--vien'), mo = _bien('--chu-3')
  const MAU = { dung: '--dung', sai: '--sai', 'chu-y': '--chu-y', tin: '--tin', chinh: '--chinh', nhat: '--mat-3', sao: '--sao' }
  let g = ''
  if (!tc.khongTruc) for (let k = 0; k <= max + 1e-9; k += buoc) g += `<line x1="${L}" x2="${W - R}" y1="${y(k)}" y2="${y(k)}" stroke="${ke}"/><text x="${L - 6}" y="${y(k) + 4}" text-anchor="end" font-size="11" fill="${mo}" font-family="Be Vietnam Pro">${dd(k)}</text>`
  so.forEach(([t, v, m], i) => {
    const w = Math.min(36, rong * 0.58), xx = L + i * rong + (rong - w) / 2, h = Math.max(3, y(0) - y(v))
    g += `<rect x="${xx}" y="${y(0) - h}" width="${w}" height="${h}" rx="${Math.min(6, w / 2)}" fill="${_bien(MAU[m] || '--chinh')}"/>`
    if (tc.soTren) g += `<text x="${xx + w / 2}" y="${y(0) - h - 6}" text-anchor="middle" font-size="11" font-weight="600" fill="${_bien('--chu-2')}" font-family="Be Vietnam Pro">${dd(v)}</text>`
    g += `<text x="${xx + w / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${mo}" font-family="Be Vietnam Pro">${t}</text>`
  })
  sv.innerHTML = g
}
