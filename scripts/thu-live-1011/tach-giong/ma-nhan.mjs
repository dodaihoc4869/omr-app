// BẢN THỬ — KHÔNG CÓ TRONG APP (11/11 tối: đo xong, KHÔNG phát hành — lý do + số đo: docs/do-live-1011.md mục 10). Giữ để phiên sau đo lại / so mô hình khác
// bằng scripts/thu-live-1011/do-tach-giong.mjs. Nếu có ngày đưa vào app: chuỗi này chạy trong Worker từ Blob, như MA_KHUNG của src/lib/live/chuoi-tieng.ts.
// «CHỈ GIỌNG THẦY» — MÃ WORKER BỘ NHẬN GIỌNG (Worker kiểu module từ Blob; bản đo ngoại tuyến + test chạy đúng chuỗi này).
// Mô hình: WeSpeaker CAM++ (VoxCeleb, bản ONNX của sherpa-onnx; mô hình CC BY 4.0, mã Apache-2.0) — nhúng giọng 512 chiều từ fbank Kaldi 80 dải, 16 kHz.
// Chạy bằng ONNX Runtime Web 1.20.1 (MIT), wasm SIMD MỘT luồng (trang không cách ly cross-origin). Tệp: xem phần đầu do-tach-giong.mjs (không đưa vào kho).
// Đo 11/11 (Node, wasm 1 luồng): cửa sổ 0,5 s ≈ 38 ms · 0,75 s ≈ 52 ms; giọng thầy (phần không dùng làm mẫu) cos 0,34–0,60 với mẫu, 6 giọng khác ≤ 0,27.
// Việc: (1) học mẫu: các đoạn 16 kHz ⇒ nhúng từng cửa sổ 1,5 s (bước 0,75 s); (2) chấm: nhận tiếng 16 kHz + cờ «có tiếng» từng khung 10 ms từ Worker cổng,
// gom các khung CÓ TIẾNG của câu đang nói (bỏ lại khi câu mới bắt đầu sau quãng nghỉ), chấm 0,3–0,75 s gần nhất (100 ms một lần trong 1,2 giây đầu câu, sau đó 200 ms) ⇒ trả cos với mẫu giọng.
// Bận quá (suy luận chưa xong) ⇒ bỏ lượt, không xếp hàng; báo tỉ lệ thời gian bận / thời gian thật mỗi 2 giây (lớp gọi tắt mức này khi > 0,6).

export const MA_NHAN = `
var NB = 80, NW = 400, NF = 512, ort = null, phien = null, VAO = '', RA = '', hoSo = null;
var cuaSo = new Float32Array(NW), loc = [], cosT = new Float32Array(NF / 2), sinT = new Float32Array(NF / 2), i0, b0;
for (i0 = 0; i0 < NW; i0++) cuaSo[i0] = Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * i0 / (NW - 1)), 0.85);
for (i0 = 0; i0 < NF / 2; i0++) { cosT[i0] = Math.cos(2 * Math.PI * i0 / NF); sinT[i0] = -Math.sin(2 * Math.PI * i0 / NF); }
(function () {
  function mel(f) { return 1127 * Math.log(1 + f / 700); }
  var lo = mel(20), hi = mel(8000), d = (hi - lo) / (NB + 1), b, i, l, c, r, m, w;
  for (b = 0; b < NB; b++) { l = lo + b * d; c = l + d; r = c + d; w = new Float32Array(NF / 2 + 1);
    for (i = 0; i <= NF / 2; i++) { m = mel(i * 16000 / NF); w[i] = m > l && m < r ? (m <= c ? (m - l) / (c - l) : (r - m) / (r - c)) : 0; }
    loc.push(w); }
})();
function fft(re, im) {
  var n = re.length, i, j = 0, b, len, st, k, a, c, wr, wi, xr, xi, t;
  for (i = 1; i < n; i++) { b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (len = 2; len <= n; len <<= 1) { st = n / len; for (i = 0; i < n; i += len) for (k = 0; k < len / 2; k++) {
    wr = cosT[k * st]; wi = sinT[k * st]; a = i + k; c = a + len / 2; xr = re[c] * wr - im[c] * wi; xi = re[c] * wi + im[c] * wr;
    re[c] = re[a] - xr; im[c] = im[a] - xi; re[a] += xr; im[a] += xi; } }
}
/* fbank Kaldi 80 dải (25 / 10 ms, cửa sổ povey, tiền nhấn 0,97, bỏ DC, log) rồi trừ trung bình theo thời gian (feature_normalize_type = global-mean). */
function fbank(x) {
  var T = 1 + Math.floor((x.length - NW) / 160), o = new Float32Array(T * NB), re = new Float32Array(NF), im = new Float32Array(NF), p = new Float32Array(NF / 2 + 1), t, i, b, m, e, w;
  for (t = 0; t < T; t++) {
    re.fill(0); im.fill(0); m = 0;
    for (i = 0; i < NW; i++) m += x[t * 160 + i];
    m /= NW;
    for (i = 0; i < NW; i++) re[i] = x[t * 160 + i] - m;
    for (i = NW - 1; i > 0; i--) re[i] -= 0.97 * re[i - 1];
    re[0] -= 0.97 * re[0];
    for (i = 0; i < NW; i++) re[i] *= cuaSo[i];
    fft(re, im);
    for (i = 0; i <= NF / 2; i++) p[i] = re[i] * re[i] + im[i] * im[i];
    for (b = 0; b < NB; b++) { e = 0; w = loc[b]; for (i = 0; i <= NF / 2; i++) e += w[i] * p[i]; o[t * NB + b] = Math.log(Math.max(e, 1.19e-7)); }
  }
  for (b = 0; b < NB; b++) { m = 0; for (t = 0; t < T; t++) m += o[t * NB + b]; m /= T; for (t = 0; t < T; t++) o[t * NB + b] -= m; }
  return { o: o, T: T };
}
function chuan(e) { var n = 0, i; for (i = 0; i < e.length; i++) n += e[i] * e[i]; n = Math.sqrt(n) || 1; for (i = 0; i < e.length; i++) e[i] /= n; return e; }
function cos(a, b) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
async function datPhien(o, byteMoHinh) {
  ort = o; o.env.wasm.numThreads = 1; o.env.wasm.proxy = false;
  phien = await o.InferenceSession.create(byteMoHinh, { graphOptimizationLevel: 'all', executionProviders: ['wasm'] });
  VAO = phien.inputNames[0]; RA = phien.outputNames[0];
}
async function nhung(x) {
  if (!phien || x.length < NW + 160 * 20) return null;
  var f = fbank(x), r = await phien.run(Object.fromEntries([[VAO, new ort.Tensor('float32', f.o, [1, f.T, NB])]]));
  return chuan(Float32Array.from(r[RA].data));
}
/* ── chấm giọng theo dòng ── */
var cau = new Float32Array(12000), cauN = 0, dem = 0, ban = false, msBan = 0, tuLuc = 0, cong = null, MIN = 4800, cauTu = 0;
function nhanKhoi(d, gui) {
  if (d.dau) { cauN = 0; cauTu = 0; }
  var v = d.v, x = d.x, k, j, per = Math.floor(x.length / v.length);
  for (k = 0; k < v.length; k++) {
    if (!v[k]) continue;
    if (cauN + per > cau.length) { cau.copyWithin(0, per); cauN -= per; }
    for (j = 0; j < per; j++) cau[cauN + j] = x[k * per + j];
    cauN += per;
  }
  cauTu += 1;
  /* câu mới (1,2 giây đầu): chấm mỗi 100 ms cho kịp; sau đó mỗi 200 ms */
  if (++dem < (cauTu <= 12 ? 1 : 2)) return null;
  dem = 0;
  if (!hoSo || !phien || ban || cauN < MIN) return null;
  ban = true;
  var t0 = Date.now(), t = d.t, n = cauN, ban2 = cau.slice(0, n);
  return nhung(ban2).then(function (e) {
    ban = false; msBan += Date.now() - t0;
    if (!e) return null;
    var kq = { t: t, s: cos(e, hoSo), n: n / 16000 };
    if (gui) gui(kq);
    return kq;
  }, function () { ban = false; return null; });
}
if (typeof self !== 'undefined' && typeof postMessage === 'function') {
  onmessage = function (ev) {
    var d = ev.data;
    if (!d) return;
    if (d.mo) {
      (async function () {
        try {
          var t0 = Date.now(), m = await import(d.mo.ort), ph = await Promise.all(d.mo.phan.map(function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error('tải ' + r.status); return r.arrayBuffer(); }); })), w = await fetch(d.mo.wasm).then(function (r) { if (!r.ok) throw new Error('tải ' + r.status); return r.arrayBuffer(); });
          var tong = 0, b, o = 0;
          for (b = 0; b < ph.length; b++) tong += ph[b].byteLength;
          var mh = new Uint8Array(tong);
          for (b = 0; b < ph.length; b++) { mh.set(new Uint8Array(ph[b]), o); o += ph[b].byteLength; }
          m.env.wasm.wasmPaths = { mjs: d.mo.keo };
          m.env.wasm.wasmBinary = w;
          await datPhien(m, mh);
          postMessage({ san: Date.now() - t0 });
        } catch (e) { postMessage({ loi: String(e && e.message || e) }); }
      })();
    }
    if (d.hoSo) hoSo = d.hoSo;
    if (d.hoc) {
      (async function () {
        var ra = [], k, i, x, e, t0 = Date.now();
        try {
          for (k = 0; k < d.doan.length; k++) { x = d.doan[k]; for (i = 0; i + 24000 <= x.length; i += 12000) { e = await nhung(x.subarray(i, i + 24000)); if (e) ra.push(e); } }
          postMessage({ hoc: d.hoc, e: ra, ms: Date.now() - t0 });
        } catch (er) { postMessage({ hoc: d.hoc, loi: String(er && er.message || er) }); }
      })();
    }
    if (d.port) {
      cong = d.port; tuLuc = Date.now(); msBan = 0;
      cong.onmessage = function (e) { var r = nhanKhoi(e.data, function (kq) { try { cong.postMessage(kq); } catch (er) {} }); return r; };
      setInterval(function () { var nay = Date.now(); if (nay - tuLuc >= 2000) { postMessage({ rtf: msBan / (nay - tuLuc) }); msBan = 0; tuLuc = nay; } }, 2000);
    }
  };
}
`
