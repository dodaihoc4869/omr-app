// BÚT BẬT thì CON LĂN vẫn cuộn đề + NÉT TRÊN GIẤY ĐỀ CUỘN THEO ĐỀ (thầy 11/11: «Khi bật bút thì con lăn cuộn đề không hoạt động, sửa bật bút con lăn
// cuộn đề và bảng hoạt động bình thường nhé»). Đoạn JS chèn vào GIỮA `JS_BUT_BANG` (but-bang-to-chieu.ts) — cùng phạm vi với bộ máy bút: dot · dpr · KH · so ·
// N · CHO · XT · KC · gC · cvT · LoiBut · ketNet · veLai. Tách tệp riêng vì cổng cỡ tệp.
//
// GỐC LỖI: bút bật thì lớp bắt con trỏ (`canvas.mc-but-song`, cố định, phủ cả cửa sổ) là đích của sự kiện `wheel`. Trình nghe `wheel` của bút chỉ lo ô bảng đen;
// lăn trên giấy thì trình duyệt tìm khung cuộn từ chính lớp canvas đi lên (canvas → body, đều không cuộn) — ô giấy `.mc-vung-de.mc-cuon` không nằm trên đường đó
// ⇒ đề đứng im. Phím (Space, ↓, ↑, PageUp, PageDown) không qua lớp canvas nên vẫn chạy.
//
// SỬA:
//   · `lanGiay`: con lăn (và vuốt hai ngón; `ctrlKey` = thu phóng thì bỏ qua) trên ô giấy đang ở chế độ cuộn ⇒ tự dời `scrollTop` đúng `deltaY` như trình duyệt
//     vẫn làm khi bút tắt; trình duyệt tự kẹp đầu / cuối và phát `scroll` ⇒ chữ «còn nữa ↓» của tờ tự cập nhật. Đang đè bút / đang tẩy / đang kéo vạch cuộn bảng
//     thì bỏ qua (nét dở không trôi).
//   · NÉT DÍNH VÀO GIẤY: nét bắt đầu trong ô giấy nhớ số thứ tự ô giấy (`_g`, chỉ nằm trong sổ của tờ, không đi ra ngoài) và ghi y = y màn + độ cuộn của giấy
//     (giống nét bảng). Giấy cuộn theo đường nào (con lăn, Space, tự cuộn khi mở lời giải, bút tắt) cũng phát `scroll` ⇒ `theoGiay` vẽ lại: nét của giấy đang cuộn
//     dời theo độ cuộn, cắt theo mép trên / dưới của ô giấy. Giấy chưa cuộn (độ cuộn 0) ⇒ hình y như trước từng điểm ảnh.
//   · MÁY EM (không thêm loại khung / tin nào): máy em vốn soi đúng KHUNG NHÌN của giấy thầy (tờ đo lại vị trí từng khối chữ — `lvDoGiay` — nên chữ trên máy em
//     trôi theo), và nét trên giấy tính theo toạ độ MÀN. Vì vậy mọi thứ đi ra ngoài (`__mcBut.nghe`, `__mcBut.xuat`) vẫn là toạ độ MÀN đang thấy (`skRaMan`);
//     giấy cuộn xong 0,22 giây thì báo lại các nét của giấy ấy bằng đúng chuỗi sự kiện của hoàn tác / làm lại: `xoa` rồi `net-moi` có `xong` + `vt`
//     (`phatNetGiay`). Nét đã trôi hẳn khỏi ô giấy thì không gửi (cuộn về sẽ gửi lại). Cùng lúc phát sự kiện DOM `mc-giay-cuon` ⇒ tờ đo lại giấy ngay
//     (không chờ nhịp 1 giây) cho chữ và nét trên máy em dời cùng lúc.
//   GIỚI HẠN: lúc CHỜ GỌI giấy lật TRANG (không cuộn) ⇒ nét đứng yên khi lật trang, như cũ. Trong lúc thầy còn đang lăn, máy em thấy nét chậm hơn chữ tới
//   0,22 giây. Máy em không cắt nét theo mép giấy ở bố cục một phép co (bản ghi cũ); bố cục hai khung thì lớp nét của giấy chính là tấm giấy nên tự cắt.
export const JS_CUON_GIAY = `
` + /* dsGiay = các ô giấy (.mc-vung-de) của đợt đang chiếu; mỗi ô nhớ __go = [x, y, rộng, cao, độ cuộn] (điểm ảnh thiết bị; x, y so với đợt) */ `
` + /* dyPhat = độ cuộn (số lần bề dọc cửa sổ) của giấy dưới nét ĐANG VIẾT · hPhatGiay = hẹn báo máy em · taiNghe = các hàm nghe bên ngoài */ `
  var dsGiay = [], dyPhat = 0, hPhatGiay = 0, taiNghe = [];
` + /* Đo lại các ô giấy của đợt đang chiếu. Trả true nếu có ô đổi chỗ / đổi cỡ / đổi độ cuộn. */ `
  function doOGiay() {
    var d = dot(), g = d && d.querySelectorAll ? d.getBoundingClientRect() : null, ds = g ? d.querySelectorAll('.mc-vung-de') : [], doi = ds.length !== dsGiay.length, i, v, r, k;
    dsGiay = Array.prototype.slice.call(ds);
    for (i = 0; i < dsGiay.length; i++) {
      v = dsGiay[i]; r = v.getBoundingClientRect();
      k = [Math.round((r.left - g.left) * dpr), Math.round((r.top - g.top) * dpr), Math.round(r.width * dpr), Math.round(r.height * dpr), Math.round(v.scrollTop * dpr)];
      if (String(k) !== String(v.__go)) { v.__go = k; doi = true; }
    }
    return doi;
  }
  function oGiayTai(x, y) {
    var i, o; x *= dpr; y *= dpr;
    for (i = 0; i < dsGiay.length; i++) { o = dsGiay[i].__go; if (x >= o[0] && x <= o[0] + o[2] && y >= o[1] && y <= o[1] + o[3]) return dsGiay[i]; }
    return null;
  }
` + /* Ô của tờ giấy mà nét n dính vào, NẾU giấy ấy đang cuộn (độ cuộn khác 0); không thì null ⇒ nét vẽ như nét thường. */ `
  function cuonCuaNet(n) { var v = n._g ? dsGiay[n._g - 1] : null, o = v ? v.__go : null; return o && o[4] ? o : null; }
` + /* Lượt vẽ thứ ba của lớp đã chốt: nét của giấy đang cuộn — dời theo độ cuộn, cắt theo mép trên / dưới ô giấy; nét ngoài tầm nhìn bỏ qua. to = hàm tô một nét. */ `
  function veNetGiay(ds, to, s) {
    var k = KH.H * dpr, i, n, o, h;
    for (i = 0; i < ds.length; i++) {
      n = ds[i]; o = cuonCuaNet(n); if (!o) continue;
      h = LoiBut.hop(n); if (h[3] * k - o[4] < o[1] - 9 || h[1] * k - o[4] > o[1] + o[3] + 9) continue;
      gC.save(); gC.setTransform(1, 0, 0, 1, 0, 0); gC.beginPath(); gC.rect(0, o[1], cvT.width, o[3]); gC.clip();
      gC.setTransform(s, 0, 0, s, 0, -o[4]); to(n); gC.restore();
    }
  }
` + /* Giấy v vừa đổi độ cuộn (đường nào cũng qua đây): nét của nó dời theo ngay trong khung này; ngừng cuộn 0,22 giây thì báo máy em. Đang viết dở ⇒ chốt nét tại chỗ. */ `
  function theoGiay(v) {
    var o = v.__go, cy;
    if (!KH || !o || dsGiay.indexOf(v) < 0 || (cy = Math.round(v.scrollTop * dpr)) === o[4]) return;
    if (N) { CHO = { id: N.id, loai: N.loai, coLuc: N.coLuc }; ketNet(false); }
    o[4] = cy; veLai();
    clearTimeout(hPhatGiay); hPhatGiay = setTimeout(phatNetGiay, 220);
  }
  document.addEventListener('scroll', function (e) { if (e.target && e.target.__go) theoGiay(e.target); }, true);
` + /* CON LĂN trên giấy khi bút bật (lớp bắt con trỏ che mất giấy nên trình duyệt không tự cuộn): dời đúng deltaY như lúc bút tắt; trình duyệt tự kẹp đầu / cuối. */ `
  function lanGiay(e) {
    var v = oGiayTai(e.clientX, e.clientY);
    if (!v || e.ctrlKey || !e.deltaY || !v.classList.contains('mc-cuon')) return;
    e.preventDefault();
    if (N || XT || KC) return;
    v.scrollTop += e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? v.clientHeight * 0.9 : 1);
    theoGiay(v);
  }
` + /* ── đường RA NGOÀI (máy em, bản ghi): toạ độ MÀN đang thấy ── */ `
  function diemRaMan(ds, dy) { var ra = [], i, d; for (i = 0; i < ds.length; i++) { d = ds[i]; ra.push([d[0], Math.max(0, Math.round((d[1] - dy) * 1e5) / 1e5), d[2], d[3]]); } return ra; }
` + /* g = bản gửi của nét n trong sổ. Trả chính g (giấy không cuộn) · bản đã dời về toạ độ màn · null (nét đã trôi khỏi ô giấy ⇒ không gửi). Nhớ độ cuộn đã gửi (_c). */ `
  function netRaMan(g, n) {
    var o = cuonCuaNet(n), k, h;
    if (n._g) n._c = o ? o[4] : 0;
    if (!o) return g;
    k = KH.H * dpr; h = LoiBut.hop(n);
    if (h[3] * k - o[4] < o[1] || h[1] * k - o[4] > o[1] + o[3]) return null;
    return { id: g.id, cong: g.cong, mau: g.mau, co: g.co, diem: diemRaMan(g.diem, o[4] / k) };
  }
  function dsRaMan(gs, ds) {
    var ra = [], doi = false, i, g;
    for (i = 0; i < gs.length; i++) { g = ds[i] && ds[i].id === gs[i].id ? netRaMan(gs[i], ds[i]) : gs[i]; if (g !== gs[i]) doi = true; if (g) ra.push(g); }
    return doi ? ra : gs;
  }
  function skRaMan(sk) {
    var n, g;
    if (sk.loai === 'them-diem') return dyPhat ? { loai: sk.loai, trang: sk.trang, id: sk.id, diem: diemRaMan(sk.diem, dyPhat) } : sk;
    if (sk.loai === 'trang') { g = dsRaMan(sk.net, so.ds()); return g === sk.net ? sk : { loai: sk.loai, trang: sk.trang, net: g, tiLe: sk.tiLe }; }
    if (sk.loai !== 'net-moi') return sk;
    g = sk.net;
    if (!sk.xong) return dyPhat ? { loai: sk.loai, trang: sk.trang, net: { id: g.id, cong: g.cong, mau: g.mau, co: g.co, diem: diemRaMan(g.diem, dyPhat) } } : sk;
    n = so.ds()[sk.vt]; if (n && n.id === g.id) g = netRaMan(g, n);
    return g === sk.net ? sk : g ? { loai: sk.loai, trang: sk.trang, net: g, vt: sk.vt, xong: true } : null;
  }
  function ngheBut(f) {
    var bo = so.nghe(function (sk) { sk = skRaMan(sk); if (sk) f(sk); });
    taiNghe.push(f);
    return function () { var i = taiNghe.indexOf(f); if (i >= 0) taiNghe.splice(i, 1); bo(); };
  }
  function xuatMan() { var x = so.xuat(); x.net = dsRaMan(x.net, so.ds()); return x; }
` + /* Giấy ngừng cuộn: tờ đo lại giấy (mc-giay-cuon), rồi báo các nét của giấy vừa dời — xoa + net-moi có xong, đúng chuỗi của hoàn tác / làm lại. */ `
  function phatNetGiay() {
    var ds = so.ds(), tr = so.trang(), ra = [{ loai: 'xoa', trang: tr, id: [] }], i, n, v, g;
    hPhatGiay = 0;
    if (!KH) return;
    try { document.dispatchEvent(new CustomEvent('mc-giay-cuon')); } catch (e) {}
    if (!taiNghe.length) return;
    for (i = 0; i < ds.length; i++) {
      n = ds[i]; v = n._g ? dsGiay[n._g - 1] : null;
      if (!v || (n._c || 0) === v.__go[4]) continue;
      ra[0].id.push(n.id); g = netRaMan({ id: n.id, cong: n.cong, mau: n.mau, co: n.co, diem: n.diem }, n);
      if (g) ra.push({ loai: 'net-moi', trang: tr, net: g, vt: i, xong: true });
    }
    if (ra[0].id.length) ra.forEach(function (sk) { taiNghe.forEach(function (f) { try { f(sk); } catch (e) {} }); });
  }
`
