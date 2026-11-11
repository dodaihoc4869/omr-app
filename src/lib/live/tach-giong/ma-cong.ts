// «CHỈ GIỌNG THẦY» (11/11 tối — thầy: «tách giọng nói của tôi riêng và làm sạch các giọng nói khác … giọng của tôi và hs phải trong nhất có thể»).
// MÃ WORKER CỔNG (chạy từ Blob, viết ES5 không phụ thuộc gì — bản đo ngoại tuyến scripts/thu-live-1011/do-tach-giong.mjs và test chạy ĐÚNG chuỗi này):
//  · đọc từng khung tiếng (AudioData, thường 480 mẫu 48 kHz) của track mic ĐÃ QUA xử lý của trình duyệt / chuỗi làm rõ, cộng kênh về mono;
//  · nhân HỆ SỐ CỔNG rồi ghi khung mới cùng mốc giờ — một khung vào ⇒ một khung ra, không đệm, không nhìn trước (trễ thêm 0 ms), dải tần giữ nguyên 48 kHz;
//  · hạ về 16 kHz (thông thấp 7 kHz) gửi BỘ NHẬN GIỌNG (ma-nhan.ts, Worker khác — suy luận 40–60 ms không được làm đứt khung tiếng) qua MessageChannel;
//  · bộ nhận giọng trả ĐIỂM GIỐNG GIỌNG THẦY (cos với mẫu giọng) của câu đang nói ⇒ cổng mở / hạ theo LUẬT LỆCH VỀ PHÍA THẦY:
//      – mặc định MỞ; chỉ HẠ (−30 dB) khi có điểm «chắc chắn người khác» còn tươi (≤ 450 ms) lúc đang có tiếng;
//      – hạ rồi mà 700 ms không có điểm «người khác» mới ⇒ tự MỞ (không bao giờ giữ cổng đóng bằng điểm cũ / điểm lưng chừng);
//      – điểm «giọng thầy» ⇒ mở ngay; tiếng bắt đầu sau quãng nghỉ mà đủ to (gần mức giọng thầy) ⇒ mở ngay, bộ nhận giọng xét lại sau;
//      – tiếng to vọt lên trên mức giọng người khác ≥ 8 dB (thầy chen ngang) ⇒ mở ngay;
//      – quãng nghỉ mà tiếng nhỏ hơn giọng thầy ≥ 25 dB (xôn xao xa) ⇒ hạ nhẹ −15 dB.
//  · BẢO VỆ GIỌNG THẦY: cổng đang hạ vì «người khác» mà quá 1,5 giây không có điểm «người khác» mới (không thể xảy ra theo luật trên — lưới phòng lỗi) hoặc
//    tiếng to bị hạ quá 12 giây trong 15 giây (mẫu giọng sai?) ⇒ báo `bv` để lớp gọi gửi lại tiếng như trước khi bật.
//  · Không có bộ nhận giọng / chưa có điểm ⇒ cổng luôn mở (hỏng thì về đúng tiếng cũ).

export const MA_CONG = `
var THAM = { sau: -30, sauXa: -15, moMs: 8, dongMs: 60, cao: 0.3, thap: 0.22, manh: 0.05, ngan: 0.05, tuoi: 450, hetDong: 700, nghi: 300, nghiNhan: 120, bien: 10, dai: 6, nhay: 6, bvDong: 12000, bvLech: 1500 };
function taoCong(tham) {
  var C = {}, k;
  for (k in THAM) C[k] = THAM[k];
  if (tham) for (k in tham) C[k] = tham[k];
  /* dich: mo · khac (hạ −30 dB: bộ nhận giọng chắc là người khác) · xa (hạ −15 dB: tiếng nhỏ hơn hẳn giọng thầy ở mic cài áo — xôn xao xa) */
  var s = { g: 1, dich: 'mo', nen: -70, giu: 0, imMs: 1e9, lNgan: -100, mucThay: null, mucKhac: -100, lucKhac: -1e9, lucThay: -1e9, qd: null, qdMoi: false, lienKhac: 0, nho: 0, dong: 0, bv: '', dauCau: false, dauNhan: false, noi: false, dauMs: 1e9, cauThay: false };
  var o = [], oi = 0, oMs = 0, oDong = 0;
  for (k = 0; k < 150; k++) o.push(0);
  function quyet(d) { s.qd = d; s.qdMoi = true; }
  /* x: mẫu mono (sửa tại chỗ), hz, tMs = giờ của khung (ms). Trả hệ số đã áp cuối khung. */
  function buoc(x, n, hz, tMs) {
    var e = 0, i, L, dt = n * 1000 / hz, noi, onset = false, loai = null, g0 = s.g, g1, a, trongDai, moi = s.qdMoi;
    for (i = 0; i < n; i++) e += x[i] * x[i];
    L = 10 * Math.log(e / n + 1e-12) / Math.LN10;
    s.lNgan += (L - s.lNgan) * Math.min(1, dt / 30);
    if (L < s.nen) s.nen = s.nen * 0.8 + L * 0.2; else s.nen = Math.min(-30, s.nen + 0.5 * dt / 1000);
    if (s.nen < -90) s.nen = -90;
    noi = L > s.nen + 9 && L > -62;
    s.dauNhan = false;
    /* quãng lặng THÔ (không tính 200 ms giữ) ⇒ «câu mới» cho bộ nhận giọng (≥ 120 ms) và cho luật mở (≥ 300 ms) */
    if (noi) { if (s.imMs >= C.nghi) onset = true; if (s.imMs >= C.nghiNhan) s.dauNhan = true; s.imMs = 0; s.giu = 200; } else { s.imMs += dt; s.giu = Math.max(0, s.giu - dt); }
    var dangNoi = s.giu > 0;
    s.dauCau = onset; s.noi = noi;
    if (onset) s.dauMs = 0; else s.dauMs += dt;
    /* điểm thuộc về CÂU: câu mới ⇒ bỏ điểm của câu trước (không đóng cổng câu này bằng điểm của người nói trước) */
    if (s.dauNhan) { s.qd = null; s.lienKhac = 0; s.cauThay = false; }
    /* cửa sổ ngắn (< 0,5 s, đầu câu) kém chắc ⇒ chỉ được kết luận «người khác» khi điểm rất thấp (≤ 0,05); kết luận «thầy» thì nhận ngay */
    if (s.qd && s.qd.s != null && tMs - s.qd.t <= C.tuoi) loai = s.qd.s >= C.cao ? 'thay' : s.qd.s <= (s.qd.n != null && s.qd.n < 0.5 ? C.ngan : C.thap) ? 'khac' : 'ngo';
    s.qdMoi = false;
    if (moi && loai) { if (loai === 'khac') { s.lucKhac = s.qd.t; s.lienKhac += 1; } else s.lienKhac = 0; if (loai === 'thay') { s.lucThay = s.qd.t; s.cauThay = true; } }
    if (loai === 'thay' && noi) s.mucThay = s.mucThay == null ? s.lNgan : s.mucThay + (s.lNgan - s.mucThay) * 0.01;
    /* trong DẢI GIỌNG THẦY (to gần bằng giọng thầy ở mic): muốn hạ phải có HAI điểm «người khác» liền nhau (hoặc một điểm rất thấp) — nói chồng không bị cắt vì một điểm lẻ */
    trongDai = s.mucThay == null || s.lNgan >= s.mucThay - C.dai;
    var chacKhac = loai === 'khac' && (s.lienKhac >= 2 || s.qd.s <= C.manh || !trongDai);
    if (loai === 'thay') s.dich = 'mo';
    else if (s.dich === 'khac') {
      /* mức ĐỈNH của giọng người khác (bám lên ngay, trôi xuống 2 dB / giây) — chỉ to vượt đỉnh ấy ≥ 8 dB mới coi là thầy chen ngang */
      s.mucKhac = noi && s.lNgan > s.mucKhac ? s.lNgan : s.mucKhac - 2 * dt / 1000;
      if (tMs - s.lucKhac > C.hetDong) s.dich = 'mo';
      /* câu mới sau quãng nghỉ ≥ 300 ms, trong 150 ms đầu đã to tới dải giọng thầy ⇒ mở (lệch về phía thầy; bộ nhận giọng xét lại câu này sau) */
      else if (noi && s.dauMs <= 150 && s.mucThay != null && s.lNgan >= s.mucThay - C.bien) s.dich = 'mo';
      else if (noi && s.lNgan >= s.mucKhac + C.nhay) s.dich = 'mo';
      if (s.dich === 'khac' && dangNoi && tMs - s.lucKhac > C.bvLech && !s.bv) s.bv = 'cổng hạ vì «người khác» mà 1,5 giây không có điểm mới';
    } else if (chacKhac && dangNoi) { s.dich = 'khac'; s.mucKhac = s.lNgan; }
    else if (s.dich === 'mo') {
      /* câu đã nhận ra là thầy thì không hạ chỗ nói nhỏ của câu ấy */
      if (!s.cauThay && s.mucThay != null && s.lNgan < s.mucThay - C.bien && tMs - s.lucThay > 400) { s.nho += dt; if (s.nho >= 150) s.dich = 'xa'; } else s.nho = 0;
    } else if (s.dich === 'xa' && (s.mucThay == null || s.lNgan >= s.mucThay - C.bien)) s.dich = 'mo';
    if (s.dich !== 'mo') s.nho = 0;
    /* bảo vệ: tiếng to bị hạ vì «người khác» quá 12 giây trong 15 giây */
    oMs += dt;
    if (s.dich === 'khac' && noi && L > -45) oDong += dt;
    if (oMs >= 100) { s.dong += (oDong >= 50 ? 1 : 0) - o[oi]; o[oi] = oDong >= 50 ? 1 : 0; oi = (oi + 1) % o.length; oMs = 0; oDong = 0; if (s.dong * 100 >= C.bvDong && !s.bv) s.bv = 'tiếng to bị hạ quá 12 giây trong 15 giây (mẫu giọng chưa đúng?)'; }
    g1 = s.dich === 'mo' ? 1 : Math.pow(10, (s.dich === 'xa' ? C.sauXa : C.sau) / 20);
    a = g1 > g0 ? Math.min(1, dt / C.moMs) : Math.min(1, dt / C.dongMs);
    g1 = g0 + (g1 - g0) * a;
    for (i = 0; i < n; i++) x[i] *= g0 + (g1 - g0) * (i + 1) / n;
    s.g = g1;
    return g1;
  }
  return { buoc: buoc, quyet: quyet, s: s, C: C };
}
/* Hạ về 16 kHz theo dòng: thông thấp FIR 7 kHz (cửa sổ Hann, 63 nhịp ở 48 kHz) + lấy mẫu theo bước hz/16000 (48 kHz ⇒ đúng 1/3). */
function taoHa(hz) {
  var L = Math.max(15, Math.round(63 * hz / 48000) | 1), h = new Float32Array(L), fc = 7000 / hz, s = 0, i, nn;
  for (i = 0; i < L; i++) { nn = i - (L - 1) / 2; h[i] = (nn === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * nn) / (Math.PI * nn)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (L - 1))); s += h[i]; }
  for (i = 0; i < L; i++) h[i] /= s;
  var buf = new Float32Array(L), vt = 0, pha = 0, buoc = hz / 16000;
  return function (x, n, ra) {
    var m = 0, j, a, q;
    for (j = 0; j < n; j++) {
      buf[vt] = x[j]; vt = (vt + 1) % L; pha += 1;
      if (pha >= buoc) { pha -= buoc; a = 0; q = vt; for (i = 0; i < L; i++) { a += h[i] * buf[q]; q = q + 1 === L ? 0 : q + 1; } ra.push(a); m++; }
    }
    return m;
  };
}
var cong = null;
onmessage = function (ev) {
  var d = ev.data, doc, ghi, port = d && d.port, tam = null, ha = null, hzHa = 0, gom = [], co = [], dauGom = false, bao = 0, eVao = 0, eRa = 0, dem = 0;
  if (d && d.tham && cong) { for (var kk in d.tham) cong.C[kk] = d.tham[kk]; }
  if (!d || !d.vao) return;
  cong = taoCong(d.tham);
  if (port) port.onmessage = function (e) { if (e.data && typeof e.data.t === 'number') cong.quyet(e.data); };
  doc = d.vao.getReader(); ghi = d.ra.getWriter();
  (function buoc() {
    doc.read().then(function (kq) {
      if (kq.done) { try { ghi.close(); } catch (e) {} return; }
      var f = kq.value, n = f.numberOfFrames, kenh = f.numberOfChannels, hz = f.sampleRate, moc = f.timestamp, x = new Float32Array(n), i, k, e1 = 0, e2 = 0, g;
      try {
        if (!tam || tam.length !== n) tam = new Float32Array(n);
        for (k = 0; k < kenh; k++) { f.copyTo(tam, { planeIndex: k, format: 'f32-planar' }); for (i = 0; i < n; i++) x[i] += tam[i]; }
        f.close();
        for (i = 0; i < n; i++) e1 += x[i] * x[i];
        if (port) {
          if (hz !== hzHa) { ha = taoHa(hz); hzHa = hz; }
          var m0 = gom.length; ha(x, n, gom);
          co.push(cong.s.noi ? 1 : 0);
          if (cong.s.dauNhan) dauGom = true;
          if (co.length >= 10) { try { port.postMessage({ x: Float32Array.from(gom), v: Uint8Array.from(co), dau: dauGom, t: moc / 1000 + n * 1000 / hz }); } catch (e) {} gom = []; co = []; dauGom = false; }
        }
        g = cong.buoc(x, n, hz, moc / 1000 + n * 1000 / hz);
        for (i = 0; i < n; i++) e2 += x[i] * x[i];
        eVao += e1 / n; eRa += e2 / n; dem++;
        ghi.write(new AudioData({ format: 'f32-planar', sampleRate: hz, numberOfFrames: n, numberOfChannels: 1, timestamp: moc, data: x }));
        if (++bao >= 50) { postMessage({ g: g, dich: cong.s.dich, vao: Math.sqrt(eVao / dem), ra: Math.sqrt(eRa / dem), bv: cong.s.bv, mt: cong.s.mucThay }); bao = 0; eVao = eRa = 0; dem = 0; }
      } catch (e) { postMessage({ loi: String(e) }); return; }
      buoc();
    }, function (e) { postMessage({ loi: String(e) }); });
  })();
};
`
