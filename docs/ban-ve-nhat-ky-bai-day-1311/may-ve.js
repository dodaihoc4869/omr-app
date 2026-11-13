// BẢN VẼ «Nhật ký bài dạy»: máy chia trang + máy nhận khung + máy vẽ nét, dùng chung cho nhat-ky.html và cho-gan.html.
// Đây là BẢN CHẠY THỬ của đúng thuật toán trong dac-ta.md (mục 4): mọi thứ trên màn đều suy ra từ nét (toạ độ, màu, giờ), không có chữ nhận dạng.
(function () {
  'use strict'
  var D = window.NET_MAU, R = D.rong, C = D.cao

  // ── 1. giải nét ──
  var NET = D.net.map(function (n, i) {
    var k = n.p.length / 3, x = new Float32Array(k), y = new Float32Array(k), dt = new Float32Array(k), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, dai = 0
    for (var j = 0; j < k; j++) {
      x[j] = n.p[j * 3] / 4; y[j] = n.p[j * 3 + 1] / 4; dt[j] = n.p[j * 3 + 2]
      if (x[j] < x0) x0 = x[j]; if (x[j] > x1) x1 = x[j]; if (y[j] < y0) y0 = y[j]; if (y[j] > y1) y1 = y[j]
      if (j) dai += Math.hypot(x[j] - x[j - 1], y[j] - y[j - 1])
    }
    var bang = 0
    for (var b = 0; b < D.bang.length; b++) if (D.bang[b] <= n.t) bang = b
    return { i: i, m: n.m, mau: D.mau[n.m][0], co: n.c, t0: n.t, t1: n.t + dt[k - 1], x: x, y: y, dt: dt, k: k, hop: [x0, y0, x1, y1], dai: dai, bang: bang, khung: false }
  })

  // ── 2. nhận «khung thầy đóng»: một nét khép kín, bám bốn cạnh hộp bao của chính nó, ôm ít nhất 3 nét viết trước đó trên cùng bảng ──
  var KHUNG_RONG = 0.07 * R, KHUNG_CAO = 0.05 * C
  function tamTrong(n, h) { var cx = (n.hop[0] + n.hop[2]) / 2, cy = (n.hop[1] + n.hop[3]) / 2; return cx > h[0] && cx < h[2] && cy > h[1] && cy < h[3] }
  function laKhung(n) {
    var w = n.hop[2] - n.hop[0], h = n.hop[3] - n.hop[1]
    if (n.k < 12 || w < KHUNG_RONG || h < KHUNG_CAO) return false
    if (Math.hypot(n.x[0] - n.x[n.k - 1], n.y[0] - n.y[n.k - 1]) > 0.2 * (w + h)) return false
    if (n.dai < 1.6 * (w + h) || n.dai > 2.8 * (w + h)) return false
    var sat = 0, nguong = 0.12 * Math.min(w, h)
    for (var j = 0; j < n.k; j++) if (Math.min(n.x[j] - n.hop[0], n.hop[2] - n.x[j], n.y[j] - n.hop[1], n.hop[3] - n.y[j]) <= nguong) sat++
    if (sat / n.k < 0.85) return false
    var om = 0
    for (var q = 0; q < n.i; q++) if (NET[q].bang === n.bang && tamTrong(NET[q], n.hop)) om++
    return om >= 3
  }
  NET.forEach(function (n) { n.khung = laKhung(n) })

  // ── 3. chia trang: bảng mới ⇒ trang mới · nghỉ từ 45 giây ⇒ trang mới · nghỉ từ 12 giây VÀ viết sang vùng khác ⇒ trang mới ──
  var NGHI_DAI = 45000, NGHI_VUA = 12000, XA = 0.08 * R
  function cach(a, b) { var dx = Math.max(0, a[0] - b[2], b[0] - a[2]), dy = Math.max(0, a[1] - b[3], b[1] - a[3]); return Math.hypot(dx, dy) }
  function gop(h, g) { h[0] = Math.min(h[0], g[0]); h[1] = Math.min(h[1], g[1]); h[2] = Math.max(h[2], g[2]); h[3] = Math.max(h[3], g[3]) }
  var TRANG = [], cur = null
  NET.forEach(function (n) {
    if (n.khung) return
    var nghi = cur ? n.t0 - cur.t1 : 0
    if (!cur || n.bang !== cur.bang || nghi >= NGHI_DAI || (nghi >= NGHI_VUA && cach(n.hop, cur.hop) > XA)) { cur = { bang: n.bang, net: [], khung: [], t0: n.t0, t1: n.t1, hop: n.hop.slice() }; TRANG.push(cur) }
    cur.net.push(n); cur.t1 = Math.max(cur.t1, n.t1); gop(cur.hop, n.hop)
  })
  // trang quá ít nét (dưới 4) nhập vào trang liền trước cùng bảng
  for (var a = TRANG.length - 1; a > 0; a--) if (TRANG[a].net.length < 4 && TRANG[a - 1].bang === TRANG[a].bang) { var tr = TRANG[a - 1]; TRANG[a].net.forEach(function (n) { tr.net.push(n); gop(tr.hop, n.hop) }); tr.t1 = Math.max(tr.t1, TRANG[a].t1); TRANG.splice(a, 1) }
  // khung về trang có nhiều nét nằm trong khung nhất
  var KHUNG = []
  NET.forEach(function (n) {
    if (!n.khung) return
    var nhat = null, diem = 0
    TRANG.forEach(function (t) { if (t.bang !== n.bang) return; var d = t.net.filter(function (q) { return q.i < n.i && tamTrong(q, n.hop) }).length; if (d > diem) { diem = d; nhat = t } })
    if (!nhat) return
    var trong = nhat.net.filter(function (q) { return q.i < n.i && tamTrong(q, n.hop) })
    nhat.net.push(n); nhat.khung.push(n); nhat.t1 = Math.max(nhat.t1, n.t1); gop(nhat.hop, n.hop)
    KHUNG.push({ net: n, trang: nhat, trong: trong, hop: n.hop.slice(), tDau: trong[0].t0, t: n.t0 })
  })
  TRANG.forEach(function (t, i) {
    t.so = i + 1
    t.net.sort(function (p, q) { return p.t0 - q.t0 })
    t.mau = []
    t.net.forEach(function (n) { if (t.mau.indexOf(n.m) < 0) t.mau.push(n.m) })
  })
  KHUNG.forEach(function (k, i) { k.so = i + 1 })
  var BANG = D.bang.map(function (t, i) { var ds = TRANG.filter(function (x) { return x.bang === i }); return { so: i + 1, t: t, trang: ds, net: NET.filter(function (n) { return n.bang === i }) } })

  // ── 4. số liệu của bìa ──
  var daiMau = D.mau.map(function () { return 0 }), tongDai = 0
  NET.forEach(function (n) { daiMau[n.m] += n.dai; tongDai += n.dai })
  var SO = {
    trang: TRANG.length, khung: KHUNG.length, bang: BANG.length, net: NET.length,
    msViet: TRANG.reduce(function (s, t) { return s + (t.t1 - t.t0) }, 0),
    mau: D.mau.map(function (m, i) { return { rgb: m[0], ten: m[1], phan: daiMau[i] / tongDai } }).filter(function (m) { return m.phan > 0 }).sort(function (p, q) { return q.phan - p.phan }),
  }
  function gio(ms) { var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60); s -= m * 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s }
  function quang(ms) { var s = Math.round(ms / 1000), m = Math.floor(s / 60); s -= m * 60; return m ? m + ' phút' + (s ? ' ' + s + ' giây' : '') : s + ' giây' }
  /** Mực theo từng ô thời gian: [ô][màu] = độ dài nét (px bảng). */
  function oMuc(soO) {
    var ra = [], i
    for (i = 0; i < soO; i++) ra.push(D.mau.map(function () { return 0 }))
    NET.forEach(function (n) { ra[Math.min(soO - 1, Math.floor((n.t0 / D.msLive) * soO))][n.m] += n.dai })
    return ra
  }

  // ── 5. máy vẽ ──
  var GIAM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  /** Lịch vẽ «viết liền»: giữ nhịp từng nét, quãng nghỉ co lại (tối đa `nghiToiDa` ms). Trả mốc [a, b] của từng nét trên 0..1. */
  function lich(ds, nghiToiDa) {
    var t = 0, moc = [], i
    for (i = 0; i < ds.length; i++) {
      if (i) t += Math.min(nghiToiDa, Math.max(30, ds[i].t0 - ds[i - 1].t1))
      var d = Math.max(50, ds[i].t1 - ds[i].t0)
      moc.push([t, t + d]); t += d
    }
    for (i = 0; i < moc.length; i++) { moc[i][0] /= t; moc[i][1] /= t }
    return moc
  }
  function veNet(ctx, n, phan, s, ox, oy, nen) {
    var k = n.k, cat = phan >= 1 ? k - 1 : 0, du = 0
    if (phan < 1) { var tc = phan * n.dt[k - 1]; while (cat < k - 1 && n.dt[cat + 1] <= tc) cat++; du = cat < k - 1 ? (tc - n.dt[cat]) / Math.max(1, n.dt[cat + 1] - n.dt[cat]) : 0 }
    var X = function (j) { return ox + n.x[j] * s }, Y = function (j) { return oy + n.y[j] * s }
    var cx = cat < k - 1 ? X(cat) + (X(cat + 1) - X(cat)) * du : X(k - 1), cy = cat < k - 1 ? Y(cat) + (Y(cat + 1) - Y(cat)) * du : Y(k - 1)
    ctx.beginPath(); ctx.moveTo(X(0), Y(0))
    for (var j = 1; j < cat; j++) ctx.quadraticCurveTo(X(j), Y(j), (X(j) + X(j + 1)) / 2, (Y(j) + Y(j + 1)) / 2)
    if (cat >= 1) ctx.lineTo(X(cat), Y(cat))
    ctx.lineTo(cx, cy)
    var rong = Math.max(1.1, n.co * s)
    if (!nen) { ctx.globalAlpha = 0.14; ctx.lineWidth = rong * 3.2; ctx.strokeStyle = n.mau; ctx.stroke() }
    ctx.globalAlpha = 1; ctx.lineWidth = rong; ctx.strokeStyle = n.mau; ctx.stroke()
    return [cx, cy]
  }
  /** Gắn một bảng vẽ vào <canvas>. `o.net` nét (đã xếp theo giờ) · `o.hop` vùng nhìn [x0, y0, x1, y1] theo px bảng · `o.ms` thời lượng hoạt hoạ ·
   *  `o.nghi` trần quãng nghỉ khi viết liền · `o.ke` vẽ vạch chia 2/3 bảng · `o.theoBang` chỉ vẽ nét của bảng đang viết (tua nhanh cả buổi) · `o.but` hiện đầu bút. */
  function tao(cv, o) {
    var ctx = cv.getContext('2d'), ds = o.net, moc = lich(ds, o.nghi || 260), f = 1, raf = 0, luc0 = 0, f0 = 0, khiVe = o.khiVe || null, khiXong = null, w = 0, h = 0, dpr = 1
    function co() { dpr = Math.min(3, window.devicePixelRatio || 1); var r = cv.getBoundingClientRect(); w = Math.max(1, Math.round(r.width * dpr)); h = Math.max(1, Math.round(r.height * dpr)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h } }
    function ve(ff) {
      if (ff != null) f = Math.max(0, Math.min(1, ff))
      if (!w) co()
      var hop = o.hop, vw = hop[2] - hop[0], vh = hop[3] - hop[1], s = Math.min(w / vw, h / vh), ox = (w - vw * s) / 2 - hop[0] * s, oy = (h - vh * s) / 2 - hop[1] * s
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      // nét đang viết + bảng đang viết
      var dang = -1, i
      for (i = 0; i < ds.length; i++) if (moc[i][0] <= f) dang = i
      var bangNay = o.theoBang ? ds[Math.max(0, dang)].bang : -1
      if (o.ke) { ctx.globalAlpha = 0.14; ctx.fillStyle = '#f4efe4'; ctx.fillRect(ox + (R * 2 / 3) * s - dpr, oy, 2 * dpr, C * s); ctx.globalAlpha = 1 }
      var dau = null
      for (i = 0; i <= dang; i++) {
        if (o.theoBang && ds[i].bang !== bangNay) continue
        var phan = f >= moc[i][1] ? 1 : (f - moc[i][0]) / (moc[i][1] - moc[i][0])
        var p = veNet(ctx, ds[i], phan, s, ox, oy, o.nen)
        if (i === dang) dau = p
      }
      if (o.but !== false && dau && f > 0 && f < 1 && !GIAM) {
        var r = Math.max(5, 9 * dpr * (o.butTo || 1))
        ctx.globalAlpha = 0.22; ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(dau[0], dau[1], r * 1.9, 0, 6.3); ctx.fill()
        ctx.globalAlpha = 1; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = Math.max(1.5, 1.6 * dpr); ctx.beginPath(); ctx.arc(dau[0], dau[1], r, 0, 6.3); ctx.stroke()
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(dau[0], dau[1], r * 0.3, 0, 6.3); ctx.fill()
      }
      if (khiVe) khiVe(f, dang)
    }
    function buoc(nay) {
      var ff = f0 + (nay - luc0) / o.ms
      if (ff >= 1) { raf = 0; ve(1); cv.removeAttribute('data-chay'); if (khiXong) khiXong(); return }
      ve(ff); raf = requestAnimationFrame(buoc)
    }
    var may = {
      ve: ve, co: function () { co(); ve() },
      get f() { return f }, get dangChay() { return !!raf },
      chay: function (tu, xong) { cancelAnimationFrame(raf); khiXong = xong || null; if (GIAM) { ve(1); if (khiXong) khiXong(); return } f0 = tu == null ? 0 : tu; if (f0 >= 1) f0 = 0; luc0 = performance.now(); cv.setAttribute('data-chay', ''); raf = requestAnimationFrame(buoc) },
      dung: function () { cancelAnimationFrame(raf); raf = 0; cv.removeAttribute('data-chay') },
      /** Giờ thật (ms trên trục tiếng) ứng với tiến độ f, và ngược lại. */
      gioTai: function (ff) { for (var i = ds.length - 1; i >= 0; i--) if (moc[i][0] <= ff) { var p = Math.min(1, (ff - moc[i][0]) / (moc[i][1] - moc[i][0])); return ds[i].t0 + (ds[i].t1 - ds[i].t0) * p } return ds[0].t0 },
      fTai: function (t) { for (var i = ds.length - 1; i >= 0; i--) if (ds[i].t0 <= t) return t >= ds[i].t1 ? moc[i][1] : moc[i][0] + (moc[i][1] - moc[i][0]) * ((t - ds[i].t0) / Math.max(1, ds[i].t1 - ds[i].t0)); return 0 },
      mocNet: function (n) { var i = ds.indexOf(n); return i < 0 ? null : moc[i] },
    }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { co(); ve() }) : null
    if (ro) ro.observe(cv)
    may.huy = function () { cancelAnimationFrame(raf); raf = 0; if (ro) ro.disconnect() }
    co(); ve(o.f == null ? 1 : o.f)
    return may
  }
  /** Vùng nhìn = hộp bao + lề, không ra ngoài bảng. */
  function vung(hop, le) { return [Math.max(0, hop[0] - le), Math.max(0, hop[1] - le), Math.min(R, hop[2] + le), Math.min(C, hop[3] + le)] }

  window.NK = { D: D, R: R, C: C, NET: NET, TRANG: TRANG, KHUNG: KHUNG, BANG: BANG, SO: SO, GIAM: GIAM, gio: gio, quang: quang, oMuc: oMuc, tao: tao, vung: vung }
})()
