// «CHỈ GIỌNG THẦY» — LÕI CHẠY MÔ HÌNH RIÊNG GIỌNG THẦY (lượt 2, 11/11 đêm; docs/do-live-1011.md mục 11). Chuỗi ES5 chạy trong Worker từ Blob (như MA_KHUNG
// của chuoi-tieng.ts); bản đo ngoại tuyến scripts/thu-live-1011/do-tach-giong.mjs và test chạy ĐÚNG chuỗi này. Không phụ thuộc gì, không wasm.
// Mô hình (luyện bằng scripts/thu-live-1011/tach-giong/luyen/luyen.py): mặt nạ từng ô tần số, mỗi khung 10 ms, KHÔNG nhìn trước.
//  · STFT căn-Hann 20 ms, bước 10 ms (48 kHz: 960 / 480) ⇒ trễ thuật toán 20 ms (đệm một khung 10 ms + nửa cửa sổ). Một khung 480 mẫu vào ⇒ một khung ra.
//  · Đặc trưng: log10 |X|² của NB ô (bản 24 kHz: 221 ô 0–11 kHz, bước 50 Hz — trùng ô của bản luyện cửa sổ 480; |X| × hzLuyen / hz cho cùng thang).
//    Biến thể đủ dải (đầu mục hzLuyen = 48000, NB = 481) đọc được bằng đúng lõi này.
//  · Mạng: Dense(221→D, tanh) ⇒ GRU D ⇒ GRU D (+ nối tắt) ⇒ Dense(D→221, sigmoid) = mặt nạ. Ô trên 11 kHz (dải cao, 11–24 kHz) nhân trung bình mặt nạ
//    6–11 kHz ⇒ giữ ĐỦ DẢI 48 kHz khi thầy nói (giọng sáng như đi thẳng), tắt khi người khác nói.
// Tệp mô hình (.tgt, tải lười, KHÔNG vào kho / precache): 'TGT1' · u32 độ dài đầu mục JSON (ASCII) · JSON {ban, ngay, D, NB, hiTu, ...} · đệm tới bội 4 ·
// Float32 LE theo thứ tự MU SD Wi bi g1x g1h g1b g2x g2h g2b Wo bo (ma trận hàng-trước, x @ W).
export const MA_TACH = `
function docMoHinh(ab) {
  var u8 = new Uint8Array(ab), dv = new DataView(ab), i, js = '';
  if (u8.length < 16 || String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== 'TGT1') throw new Error('tệp mô hình sai dạng');
  var nJ = dv.getUint32(4, true);
  for (i = 0; i < nJ; i++) js += String.fromCharCode(u8[8 + i]);
  var h = JSON.parse(js), o = (8 + nJ + 3) & ~3, D = h.D, NB = h.NB;
  if ((ab.byteLength - o) % 4) throw new Error('tệp mô hình lệch cỡ');
  var f = new Float32Array(ab, o), p = 0, w = { h: h, D: D, NB: NB, hiTu: h.hiTu || 120 };
  function lay(n) { var a = f.subarray(p, p + n); p += n; return a; }
  w.MU = lay(NB); w.SD = lay(NB); w.Wi = lay(NB * D); w.bi = lay(D);
  w.g1x = lay(D * 3 * D); w.g1h = lay(D * 3 * D); w.g1b = lay(3 * D);
  w.g2x = lay(D * 3 * D); w.g2h = lay(D * 3 * D); w.g2b = lay(3 * D);
  w.Wo = lay(D * NB); w.bo = lay(NB);
  if (p !== f.length) throw new Error('tệp mô hình lệch cỡ');
  return w;
}
/* FFT phức cỡ n bất kỳ (thừa số nguyên tố nhỏ: 960 = 2^6·3·5), đệ quy chia theo thời gian, bảng xoay sẵn. */
function taoFft(n) {
  var fac = [], m = n, p, k;
  while (m > 1) { for (p = 2; m % p; p++); fac.push(p); m /= p; }
  var wr = new Float64Array(n), wi = new Float64Array(n), tr = new Float64Array(8), ti = new Float64Array(8);
  for (k = 0; k < n; k++) { wr[k] = Math.cos(2 * Math.PI * k / n); wi[k] = -Math.sin(2 * Math.PI * k / n); }
  function rec(xr, xi, off, st, len, yr, yi, yo, fi) {
    if (len === 1) { yr[yo] = xr[off]; yi[yo] = xi[off]; return; }
    var p = fac[fi], m = len / p, tw = n / len, j, k, q, a, b, c, s, e, t;
    for (j = 0; j < p; j++) rec(xr, xi, off + j * st, st * p, m, yr, yi, yo + j * m, fi + 1);
    for (k = 0; k < m; k++) {
      for (j = 0; j < p; j++) { e = (j * k * tw) % n; t = yo + j * m + k; a = yr[t]; b = yi[t]; tr[j] = a * wr[e] - b * wi[e]; ti[j] = a * wi[e] + b * wr[e]; }
      if (p === 2) { t = yo + k; yr[t] = tr[0] + tr[1]; yi[t] = ti[0] + ti[1]; yr[t + m] = tr[0] - tr[1]; yi[t + m] = ti[0] - ti[1]; continue; }
      for (q = 0; q < p; q++) {
        c = 0; s = 0;
        for (j = 0; j < p; j++) { e = (j * q * m * tw) % n; c += tr[j] * wr[e] - ti[j] * wi[e]; s += tr[j] * wi[e] + ti[j] * wr[e]; }
        yr[yo + k + q * m] = c; yi[yo + k + q * m] = s;
      }
    }
  }
  return function (xr, xi, yr, yi) { rec(xr, xi, 0, 1, n, yr, yi, 0, 0); };
}
/* STFT theo dòng: vao(x[H]) ⇒ phổ khung [H cũ + H mới]; ra(G, x) ⇒ nhân G từng ô, biến ngược, cộng chồng, ghi H mẫu đã đủ vào x (chậm đúng H mẫu). */
function taoStft(hz) {
  var N = Math.round(hz * 0.02), H = N / 2, K = N / 2, fft = taoFft(N), i;
  var win = new Float64Array(N), buf = new Float64Array(N), ola = new Float64Array(N);
  var xr = new Float64Array(N), xi = new Float64Array(N), yr = new Float64Array(N), yi = new Float64Array(N), zr = new Float64Array(N), zi = new Float64Array(N), or_ = new Float64Array(N), oi = new Float64Array(N);
  for (i = 0; i < N; i++) win[i] = Math.sqrt(0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
  function vao(x) {
    buf.copyWithin(0, H);
    for (i = 0; i < H; i++) buf[H + i] = x[i];
    for (i = 0; i < N; i++) { xr[i] = buf[i] * win[i]; xi[i] = 0; }
    fft(xr, xi, yr, yi);
  }
  function ra(G, x) {
    var k, g;
    for (k = 0; k <= K; k++) { g = G[k]; zr[k] = yr[k] * g; zi[k] = -yi[k] * g; if (k > 0 && k < K) { zr[N - k] = yr[k] * g; zi[N - k] = yi[k] * g; } }
    fft(zr, zi, or_, oi);
    for (i = 0; i < N; i++) ola[i] += (or_[i] / N) * win[i];
    for (i = 0; i < H; i++) x[i] = ola[i];
    ola.copyWithin(0, H); for (i = H; i < N; i++) ola[i] = 0;
  }
  return { N: N, H: H, K: K, yr: yr, yi: yi, vao: vao, ra: ra };
}
function nhan(x, W, b, J, y) { /* y = x @ W + b (W hàng-trước I×J) */
  var I = x.length, i, j, v, o;
  for (j = 0; j < J; j++) y[j] = b ? b[j] : 0;
  for (i = 0; i < I; i++) { v = x[i]; if (v === 0) continue; o = i * J; for (j = 0; j < J; j++) y[j] += v * W[o + j]; }
}
function sig(v) { return 1 / (1 + Math.exp(-v)); }
/* san = SÀN hệ số (mặc định 0,003 ≈ −50 dB): mặt nạ không bao giờ ép tiếng ra tới số 0 ⇒ lưới bắt câm chỉ bắt khi lõi hỏng thật, không bắt lúc đang hạ giọng khác. */
function taoTach(w, hz, san) {
  /* hzLuyen (đầu mục, mặc định 24000): tần số bản luyện, cửa sổ luôn 20 ms ⇒ ô k cùng tần số k·50 Hz; |X| nhân hzLuyen / hz cho cùng thang.
     Biến thể ĐỦ DẢI (luyện 48 kHz, NB = 481) ⇒ không còn ô nào phải mượn hệ số dải cao. */
  var S = taoStft(hz), D = w.D, NB = w.NB, thang = (w.h.hzLuyen || 24000) / hz, i;
  if (NB > S.K + 1) throw new Error('mô hình rộng hơn dải của luồng');
  san = san == null ? 0.003 : san;
  var f = new Float32Array(NB), a = new Float32Array(D), h1 = new Float32Array(D), h2 = new Float32Array(D), xt = new Float32Array(3 * D), hh = new Float32Array(3 * D), y = new Float32Array(D), m = new Float32Array(NB), G = new Float32Array(S.K + 1);
  function gru(x, h, Wx, Wh, b) {
    nhan(x, Wx, b, 3 * D, xt); nhan(h, Wh, null, 3 * D, hh);
    for (var j = 0; j < D; j++) {
      var z = sig(xt[j] + hh[j]), r = sig(xt[D + j] + hh[D + j]), n = Math.tanh(xt[2 * D + j] + r * hh[2 * D + j]);
      h[j] = (1 - z) * n + z * h[j];
    }
  }
  var o = { G: G, m: m, cao: 1, N: S.N, H: S.H };
  /* x: H mẫu (48 kHz: 480) — sửa tại chỗ thành tiếng ra (chậm H mẫu). Trả G (hệ số từng ô) của khung này. */
  o.khung = function (x) {
    S.vao(x);
    var yr = S.yr, yi = S.yi, k, s = 0;
    for (k = 0; k < NB; k++) { var re = yr[k] * thang, im = yi[k] * thang; f[k] = (Math.log(re * re + im * im + 1e-10) / Math.LN10 - w.MU[k]) / w.SD[k]; }
    nhan(f, w.Wi, w.bi, D, a);
    for (k = 0; k < D; k++) a[k] = Math.tanh(a[k]);
    gru(a, h1, w.g1x, w.g1h, w.g1b);
    gru(h1, h2, w.g2x, w.g2h, w.g2b);
    for (k = 0; k < D; k++) y[k] = h2[k] + h1[k];
    nhan(y, w.Wo, w.bo, NB, m);
    for (k = 0; k < NB; k++) { m[k] = sig(m[k]); G[k] = m[k] > san ? m[k] : san; if (k >= w.hiTu) s += m[k]; }
    o.cao = NB > w.hiTu ? s / (NB - w.hiTu) : 1;
    for (k = NB; k <= S.K; k++) G[k] = o.cao > san ? o.cao : san;
    S.ra(G, x);
    return G;
  };
  /* Bóng: cùng STFT, áp G cho sẵn (bản đo tách phần thầy / phần người khác của cùng một mặt nạ). */
  o.bong = function () { var B = taoStft(hz); return function (x, G) { B.vao(x); B.ra(G, x); }; };
  return o;
}
`
