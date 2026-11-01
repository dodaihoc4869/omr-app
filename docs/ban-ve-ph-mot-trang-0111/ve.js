// Vẽ trang từ DU_LIEU (bản vẽ, không phải mã thật). Vòng / đường xu hướng / cột ngày là SVG thuần — khi build làm thành component nhỏ, không thư viện biểu đồ.
;(function () {
  const q = new URLSearchParams(location.search)
  const D = window.DU_LIEU[q.get('con') === 'chua-tot' ? 'chua-tot' : 'tot']
  const $ = (id) => document.getElementById(id)
  const MAU = { tot: 'xl', vua: 'hp', xau: 'ho' }
  const TEN = { ht: 'Học thật', dp: 'Đối phó', ch: 'Chăm', lu: 'Lười' }
  const NGHIA = { ht: 'tự nghĩ, tự sửa', dp: 'làm cho xong', ch: 'học đều đặn', lu: 'bỏ ngày, làm ít' }
  const CAO_TOT = { ht: true, dp: false, ch: true, lu: false }

  const BT = {
    check: '<path class="net" d="M5 12.5l4.5 4.5L19 7.5"/>',
    lua: '<path d="M12 2.5c.9 3.4 5.2 5.6 5.2 10.4a5.2 5.2 0 0 1-10.4 0c0-2.2 1-3.8 2.2-4.9.2 1.7 1.1 2.7 2 2.8-.5-3.1.2-5.9 1-8.3z"/>',
    canh: '<path class="net" d="M12 4l9 16H3z M12 10v4 M12 17v.5"/>',
    sach: '<path class="net" d="M5 4.5h9.5A3.5 3.5 0 0 1 18 8v12H8.5A3.5 3.5 0 0 1 5 16.5z M8.5 20A3.5 3.5 0 0 1 5 16.5"/>',
    lich: '<path class="net" d="M4.5 6.5h15v13h-15z M4.5 10.5h15 M8.5 4v4 M15.5 4v4"/>',
    but: '<path class="net" d="M5 19l1-4L15.5 5.5l3 3L9 18z M13.5 7.5l3 3"/>',
    tim: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    toi: '<path class="net" d="M9 6l6 6-6 6"/>',
    thay: '<path class="net" d="M4 5.5h16v10.5H9l-5 4z"/>'
  }
  const bt = (ten, lop = '') => `<svg class="bt ${lop}" viewBox="0 0 24 24" aria-hidden="true">${BT[ten]}</svg>`

  // Vòng: phần trăm p (0–100), số ở giữa
  const vong = (p, mau, so) => {
    const r = 15.5, c = 2 * Math.PI * r, dai = (Math.max(2, p) / 100) * c
    return `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${r}" class="vong__nen"/><circle cx="18" cy="18" r="${r}" class="vong__day" style="stroke:var(--ph3-${mau});stroke-dasharray:${dai.toFixed(1)} ${c.toFixed(1)}"/></svg><b class="so-hang">${so}</b>`
  }
  // Đường xu hướng (sparkline) — viewBox cố định, giãn theo khung
  const duong = (ds, mau, { w = 100, h = 30, min, max, cham = true, nguong } = {}) => {
    const lo = min ?? Math.min(...ds) - 4, hi = max ?? Math.max(...ds) + 4
    const x = (i) => (i / (ds.length - 1)) * (w - 4) + 2, y = (v) => h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6)
    const d = ds.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('')
    const vung = `${d}L${x(ds.length - 1).toFixed(1)} ${h}L${x(0).toFixed(1)} ${h}Z`
    const ng = nguong != null ? `<path d="M0 ${y(nguong).toFixed(1)}H${w}" class="xu__nguong"/>` : ''
    const diem = (i) => `<path d="M${x(i).toFixed(1)} ${y(ds[i]).toFixed(1)}h0" class="xu__cham" style="stroke:var(--ph3-${mau})"/>`
    const ch = cham === 'het' ? ds.map((_, i) => diem(i)).join('') : cham ? diem(ds.length - 1) : ''
    return `<svg class="xu" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${vung}" class="xu__vung" style="fill:var(--ph3-${mau})"/>${ng}<path d="${d}" class="xu__duong" style="stroke:var(--ph3-${mau})"/>${ch}</svg>`
  }
  const doiChu = (ma, s) => {
    const d = s.diem - s.truoc
    if (!d) return 'giữ nguyên so với tuần trước'
    const tot = CAO_TOT[ma] ? d > 0 : d < 0
    return `<span data-tot="${tot}">${d > 0 ? '↑' : '↓'} ${Math.abs(d)}</span> so với tuần trước`
  }

  // ── ĐẦU TRANG
  $('chuCai').textContent = D.chuCai
  $('tenCon').textContent = D.ten
  $('lopNgay').innerHTML = `Lớp ${D.lop} · Chủ Nhật 01/11<span class="chi-rong"> · cập nhật ${D.capNhat}</span>`

  // ── HÔM NAY
  const H = D.homNay
  $('oHomNay').innerHTML = `
    <p class="ah__tren">${bt('sach')}Đang học <b>${H.dangHoc}</b></p>
    <h1 class="ah__cau">${H.cau}</h1>
    <p class="ah__phu">${H.phu}</p>
    <div class="ah__hang">${H.chip.map((c) => `<span class="ah__chip" data-mau="${c.mau}">${bt(c.bt)}${c.chu}</span>`).join('')}</div>
    <div class="ah__chuoi">
      <div class="ah__o" role="img" aria-label="14 ngày qua, ${H.ngayChu.replace(/<[^>]+>/g, '')}">${H.ngay.map((t, i) => `<i data-t="${t}"${i === H.ngay.length - 1 ? ' data-nay' : ''}></i>`).join('')}</div>
      <p class="ah__chu-giai"><span class="ah__o-chu">14 ngày qua: ${H.ngayChu}</span><span class="ah__giai"><i data-t="du"></i>đủ mức <i data-t="thieu"></i>chưa đủ <i data-t="khong"></i>không học</span></p>
    </div>`

  // ── 4 SỐ ĐO
  const tile = (ma) => {
    const s = D.bon[ma], m = MAU[s.muc]
    return `<button class="so" type="button" data-tam="${ma}" data-mau="${m}" aria-label="${TEN[ma]} ${s.diem} trên 100, ${s.chu}. Xem vì sao">
      <span class="so__ten">${TEN[ma]}</span>
      <span class="so__vong">${vong(s.diem, m, s.diem)}</span>
      <span class="so__nghia">${NGHIA[ma]}</span>
      <span class="so__muc">${s.chu}</span>
      <span class="so__xu">${duong(s.xu, m, { min: 0, max: 100 })}</span>
      <span class="so__doi">${doiChu(ma, s)}</span>
      <span class="so__doi-ngan">${doiChu(ma, s).split('</span>')[0]}</span></span>
      <span class="so__bc">${s.ngan}</span>
    </button>`
  }
  $('oBon').innerHTML = `
    <div class="bon__dau"><h2>Con học thế nào</h2><span>14 ngày · bấm ô xem vì sao</span></div>
    <div class="bon__cot-ten"><span>↑ Càng cao càng tốt</span><span>↓ Càng thấp càng tốt</span></div>
    <div class="bon">${['ht', 'dp', 'ch', 'lu'].map(tile).join('')}</div>`

  // ── ĐIỂM KIỂM TRA
  const C = D.ca, mauCa = C.len ? 'xl' : 'ho'
  $('oDiem').innerHTML = `
    <span class="o__nhan">Kiểm tra gần nhất ${bt('toi')}</span>
    <span class="diem__so"><b class="so-hang">${C.diem}</b><small>/10</small><span class="chip" data-mau="${mauCa}">${C.len ? '↑' : '↓'} ${C.doi.replace(/^[+−]/, '')}<span class="chi-rong">&nbsp;so với ca trước</span></span></span>
    <span class="diem__xu">${duong(C.xu.map((x) => x.d), mauCa, { min: 4, max: 10, cham: 'het' })}</span>
    <span class="diem__nhan-ca">${C.xu.map((x) => `<span>${x.n}<b>${String(x.d).replace('.', ',')}</b></span>`).join('')}</span>
    <span class="diem__ten">${C.ten} · <span class="chi-hep">${C.xu[C.xu.length - 1].n}</span><span class="chi-rong">${C.luc.split(' · ')[1]}</span></span>
    <span class="diem__phan">${C.phan.map((p) => `<span><span>${p.ten.split(' · ')[0]}</span><b class="so-hang">${p.dat}/${p.tong} ${p.don}</b><i style="--p:${Math.round((p.dat / p.tong) * 100)}%"></i></span>`).join('')}</span>`

  // ── DẠNG CẦN LUYỆN THÊM
  $('oYeu').innerHTML = `
    <span class="o__nhan">Con cần luyện thêm</span>
    <ul class="yeu">${D.yeu.map((y) => `<li><span class="yeu__ten">${y.ten}</span><span class="yeu__so so-hang">${y.dung}/${y.lam}</span><i style="--p:${Math.round((y.dung / y.lam) * 100)}%"></i></li>`).join('')}</ul>
    <span class="yeu__chu">Số câu đúng / đã làm gần đây</span>`

  // ── SẮP TỚI
  $('oSap').innerHTML = `
    <span class="o__nhan">Sắp tới</span>
    <ul class="sap">${D.sap.map((s) => `<li data-loai="${s.loai}"><span class="sap__ngay"><small>${s.thu}</small><b class="so-hang">${s.ngay}</b></span><span class="sap__chu"><b>${s.ten}</b><span>${s.phu}</span></span></li>`).join('')}</ul>`

  // ── LỜI THẦY
  $('oThay').innerHTML = `<span class="o__nhan">${bt('thay')}<span class="chi-hep">Thầy nhắn</span><span class="chi-rong">Thầy Đỗ Đại Học · ${D.thay.luc}</span></span><p>${D.thay.loi}</p>`

  // ── PHỤ HUYNH NÊN LÀM GÌ
  $('oNen').innerHTML = `<span class="o__nhan">${bt('tim')}Anh chị nên làm gì<span class="o__them chi-hep">1/${D.nen.length} · Xem thêm</span>${bt('toi')}</span>
    <ol class="nen">${D.nen.map((n) => `<li><span><b>${n.dong}</b> ${n.chu}</span></li>`).join('')}</ol>`

  // ── TẤM CHI TIẾT
  const tam = $('tam'), che = $('manChe')
  const cot14 = (ds, mau, nguong) => {
    const ngay = ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31']
    return `<div class="cot14">${ds.map((v, i) => `<span class="cot14__c"><i style="height:${v}%;background:var(--ph3-${mau})"></i></span>`).join('')}
      ${nguong ? `<span class="cot14__moc" style="bottom:${nguong}%"><em>mốc tốt ${nguong}</em></span>` : ''}</div>
      <div class="cot14__nhan"><span>${ngay[0]}/10</span><span>25/10</span><span>31/10</span></div>`
  }
  const NGUONG = { ht: 75, dp: 30, ch: 75, lu: 30 }
  const tamSo = (ma) => {
    const s = D.bon[ma], m = MAU[s.muc]
    return `<div class="tso" data-mau="${m}">
      <div class="tso__dau"><span class="so__vong tso__vong">${vong(s.diem, m, s.diem)}</span>
        <div><p class="tso__ten">${TEN[ma]} <small>/100</small></p><p class="tso__muc"><span class="chip" data-mau="${m}">${s.chu}</span> ${CAO_TOT[ma] ? '↑ Càng cao càng tốt' : '↓ Càng thấp càng tốt'}</p></div></div>
      <p class="tso__noi">${s.noi}</p>
      <h3>14 ngày qua <small>${doiChu(ma, s)}</small></h3>
      ${cot14(s.xu, m, NGUONG[ma])}
      <h3>Vì sao?</h3>
      <ul class="bc">${s.bc.map((b) => `<li><b class="bc__so so-hang">${b.so}</b><p>${b.chu}${b.vd ? `<small>Ví dụ: ${b.vd}</small>` : ''}</p></li>`).join('')}</ul>
      <h3>Anh chị nên làm gì</h3>
      <ol class="tso__nen">${s.nen.map((n) => `<li>${bt('tim')}<span>${n}</span></li>`).join('')}</ol>
      <p class="tam__chu-nho">Dựa trên ${D.bon.soLuot} lượt làm câu từ 18/10 đến 31/10, thầy tính lại mỗi đêm. Đây là dấu hiệu để cùng con điều chỉnh, không phải điểm học tập.</p>
    </div>`
  }
  const tamCa = () => `<div class="tca">
      <p class="tca__luc">${C.luc} · ${C.soCau} câu · ${C.phut} phút</p>
      <div class="tca__so"><b class="so-hang">${C.diem}</b><small>/10 điểm</small><span class="chip" data-mau="${mauCa}">${C.len ? '↑' : '↓'} ${C.doi.replace(/^[+−]/, '')} so với ca trước</span></div>
      <h3>Từng phần</h3>
      <ul class="tca__phan">${C.phan.map((p) => `<li><span>${p.ten}</span><b class="so-hang">${p.dat}/${p.tong} ${p.don}</b><i style="--p:${Math.round((p.dat / p.tong) * 100)}%"></i></li>`).join('')}</ul>
      <h3>5 ca gần nhất</h3>
      <div class="tca__xu">${duong(C.xu.map((x) => x.d), mauCa, { w: 300, h: 70, min: 4, max: 10 })}</div>
      <div class="diem__nhan-ca tca__nhan">${C.xu.map((x) => `<span>${x.n}<b>${String(x.d).replace('.', ',')}</b></span>`).join('')}</div>
      <h3>Câu con chưa làm đúng</h3>
      <ul class="tca__sai">${C.sai.map((s) => `<li><span>${s.ten}</span><b>${s.so} câu</b><small>${s.on}</small></li>`).join('')}</ul>
      <div class="tca__thay"><span>${bt('thay')}Thầy Đỗ Đại Học nhận xét</span><p>${C.loi}</p></div>
      <p class="tam__chu-nho">Điểm trung bình lớp ${D.lop} ca này: ${C.tbLop}. App không hiện tên hay điểm của bạn khác.</p>
    </div>`
  const tamNen = () => `<ol class="tso__nen tso__nen--lon">${D.nen.map((n) => `<li>${bt('tim')}<span><b>${n.dong}</b> ${n.chu}</span></li>`).join('')}</ol>`
  const tamThay = () => `<div class="tca__thay"><span>${bt('thay')}Thầy Đỗ Đại Học · ${D.thay.luc}</span><p>${D.thay.loi}</p></div>`
  const TIEU = { ht: 'Học thật', dp: 'Đối phó', ch: 'Chăm', lu: 'Lười', ca: `Ca kiểm tra · ${C.ten}`, nen: 'Anh chị nên làm gì', thay: 'Thầy Đỗ Đại Học nhắn' }
  const mo = (ma) => {
    if (!TIEU[ma]) return
    $('tamTen').textContent = TIEU[ma]
    $('tamThan').innerHTML = ma === 'ca' ? tamCa() : ma === 'nen' ? tamNen() : ma === 'thay' ? tamThay() : tamSo(ma)
    tam.hidden = false; che.hidden = false
    tam.dataset.loai = ma
  }
  const dong = () => { tam.hidden = true; che.hidden = true; if (location.hash) history.replaceState(null, '', location.pathname + location.search) }
  document.addEventListener('click', (e) => {
    const n = e.target.closest('[data-tam]')
    if (n) { e.preventDefault(); mo(n.dataset.tam) }
  })
  $('tamDong').addEventListener('click', dong)
  che.addEventListener('click', dong)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dong() })
  const h = location.hash.match(/tam=(\w+)/)
  if (h) mo(h[1])
})()
