// MÃ LỌC ỒN của kiểu 'khung' — chạy trong Worker của chuỗi làm rõ tiếng (src/lib/live/chuoi-tieng.ts), và trong AudioWorklet của mic em (mic-em.ts).
// Viết ES5, không phụ thuộc gì, KHÔNG có dấu huyền ngược / `$` + `{` bên trong: bản đo ngoại tuyến (scripts/thu-live-1011/do-loc-on.mjs) và test
// (tests/live-loc-on-3-1111.test.ts) cắt đúng chuỗi này ra chạy ⇒ số đo là của chính mã app.
//
// HAI TẦNG (thầy 11/11: «khử ồn phải thật xuất sắc, giọng nói trong rõ ràng»):
//  · RNNoise (157 KB, trễ 10 ms) — có ngay; trộn bản 2 như lượt 2 (theo giọng + tách băng 3,5 kHz + cổng).
//  · DeepFilterNet 3 (toàn dải 48 kHz, trễ 30 ms) — chạy ở MỘT WORKER RIÊNG (df3.ts) để khâu tải / khởi động / một khung chậm không bao giờ làm đứt tiếng;
//    Worker này gửi từng khung sang, nhận khung đã lọc về (`buocDf`). Chưa sẵn ⇒ RNNoise; sẵn rồi ⇒ đợi một quãng im (quá 3 giây không có thì cứ vào), lùi đường RNNoise thêm 20 ms cho
//    khớp trễ (một khung trộn dần, lúc im nên không nghe thấy) rồi TRỘN CHÉO 200 ms sang bộ mới. Bộ mới lỗi / chậm ⇒ trộn chéo về RNNoise (đã khớp trễ).
//  Sau DeepFilterNet còn MỘT CỔNG MỀM theo mức của chính tiếng đã lọc: tiếng nhỏ hơn giọng thầy gần đây 18 → 36 dB bị hạ dần tới `san` (xôn xao xa, tiếng gõ
//  lọt lưới); có giọng (RNNoise báo, biết sớm 30 ms) ⇒ mở hẳn trong một khung, đóng êm ≈ 100 ms.

/** Trễ của DeepFilterNet 3 (mẫu, 48 kHz): cửa sổ 20 ms chồng nửa + nhìn-trước 2 khung = 30 ms. Bản đo kiểm lại bằng tương quan chéo. */
export const TRE_DF3 = 1440

export const MA_LOC = `
var rn = null, thDich = null, tre = 0, cu = new Float32Array(480), lk = 1, lc = 1, giu = 0, mucNoi = 0, z1 = [0, 0, 0, 0], z2 = [0, 0, 0, 0], T0 = { noi: 1, im: 1, cao: 1, san: 1 }, lb0 = 0, lb1 = 0, la1 = 0, la2 = 0, noiR = 0;
var dfOk = 0, dfGd = 0, dfW = 0, dfAm = 0, dfMs = 0, dfIm = 0, dfDoi = 0, dfC = 1, dfK = 0, dfMo = 0, dfMuc = 0, dfBo = 0, dfDu = new Float32Array(480), qR = [new Float32Array(480), new Float32Array(480)], qG = [new Float32Array(480), new Float32Array(480), new Float32Array(480)];
function baoLoc(m) { if (typeof postMessage === 'function') postMessage(m); }
function napLoc(buf) {
  var bo, x;
  try {
    x = new WebAssembly.Instance(new WebAssembly.Module(buf), { env: { emscripten_memcpy_big: function (d, s, n) { new Uint8Array(bo.buffer).copyWithin(d, s, s + n); }, emscripten_resize_heap: function () { return 0; }, __assert_fail: function () { throw new Error('rnnoise'); } } }).exports;
    bo = x.memory;
    if (x.emscripten_stack_init) x.emscripten_stack_init();
    if (x.__wasm_call_ctors) x.__wasm_call_ctors();
    if (x.rnnoise_get_frame_size() !== 480) throw new Error('khung');
    rn = { x: x, bo: bo, st: x.rnnoise_create(0), pv: x.malloc(1920), pr: x.malloc(1920) };
    baoLoc({ loc: 'chay' });
  } catch (e) { rn = null; baoLoc({ loc: 'loi' }); }
}
/* Thông thấp Butterworth bậc 2 ở 3,5 kHz (48 kHz) để tách băng; băng cao = tín hiệu − băng thấp (cộng lại đúng nguyên tín hiệu). */
(function () { var w0 = 2 * Math.PI * 3500 / 48000, al = Math.sin(w0) / (2 * Math.SQRT1_2), a0 = 1 + al; lb0 = (1 - Math.cos(w0)) / 2 / a0; lb1 = (1 - Math.cos(w0)) / a0; la1 = -2 * Math.cos(w0) / a0; la2 = (1 - al) / a0; })();
function thap(v, z) { var o = lb0 * v + lb1 * z[0] + lb0 * z[1] - la1 * z[2] - la2 * z[3]; z[1] = z[0]; z[0] = v; z[3] = z[2]; z[2] = o; return o; }
/* Lọc ồn một khung 480 mẫu 48 kHz tại chỗ bằng RNNoise (thuật toán trộn: xem THAM_LOC_ON). Đặt noiR = khung VÀO này có giọng (kể cả quãng giữ 120 ms).
   Vào / ra chế độ lọc bằng MỘT khung chuyển (trộn dần khung này với khung trước) nên không «bụp»; tắt thì trôi về tiếng gốc rồi mới ra. */
function locOn(x) {
  var muon = rn && thDich, th = thDich || T0, i, w, f, r, e = 0, rw, vad, noi, k1, c1, cao1, k0 = lk, c0 = lc, goc, kk;
  if (!tre && !muon) { noiR = 0; return; }
  if (tre && !muon && lk >= 1 && lc > 0.99) { for (i = 0; i < 480; i++) { w = (i + 1) / 480; x[i] = cu[i] * (1 - w) + x[i] * w; } tre = 0; noiR = 0; return; }
  f = new Float32Array(rn.bo.buffer, rn.pv, 480);
  for (i = 0; i < 480; i++) f[i] = x[i] * 32768 + (Math.random() - 0.5) * 0.1;
  vad = rn.x.rnnoise_process_frame(rn.st, rn.pr, rn.pv);
  r = new Float32Array(rn.bo.buffer, rn.pr, 480);
  if (!tre) { for (i = 0; i < 480; i++) { w = (i + 1) / 480; f[i] = x[i]; x[i] = x[i] * (1 - w) + cu[i] * w; cu[i] = f[i]; } tre = 1; lk = 1; lc = 1; return; }
  for (i = 0; i < 480; i++) e += r[i] * r[i];
  rw = Math.sqrt(e / 480) / 32768; mucNoi = Math.max(mucNoi * 0.9995, rw);
  if (vad > 0.6 && rw > 0.18 * mucNoi) giu = 12; else if (giu > 0) giu -= 1;
  noi = giu > 0; noiR = noi ? 1 : 0; k1 = noi ? th.noi : Math.max(th.im, lk - 0.1); c1 = noi ? 1 : th.san + (lc - th.san) * 0.9048; cao1 = noi ? th.cao : 0;
  for (i = 0; i < 480; i++) {
    w = (i + 1) / 480; kk = k0 + (k1 - k0) * w; goc = cu[i]; f[i] = x[i];
    x[i] = (thap(r[i] / 32768 * (1 - kk) + goc * kk, z1) + (goc - thap(goc, z2)) * (cao1 > kk ? cao1 : kk)) * (c0 + (c1 - c0) * w);
    cu[i] = f[i];
  }
  lk = k1; lc = c1;
}
/* Bộ DeepFilterNet có nên chạy cho khung này không (Worker gọi để biết có gửi khung sang bộ ấy và có CHỜ khung trả về không). */
function dfMuon() { return dfOk && thDich && thDich.df && tre ? 1 : 0; }
function dfCho() { return dfGd && dfMuon() ? 1 : 0; }
/* Khâu DeepFilterNet cho MỘT khung, gọi ngay sau locOn(x):
     x   = đầu ra đường RNNoise (trễ 480 mẫu) — sửa tại chỗ thành đầu ra cuối;
     goc = khung vào (đã lọc thông cao) — hàm GIỮ mảng này, lớp gọi không dùng lại;
     y   = khung DeepFilterNet trả về cho đúng khung vào này (trễ 1440 mẫu), null = không có (chưa chờ / quá hạn / lỗi).
   dfGd = 0: chưa nhập cuộc (ra = RNNoise trễ 10 ms) · 1: đã nhập cuộc (ra = RNNoise lùi thêm 20 ms, trộn chéo với DeepFilterNet theo dfW). */
function buocDf(x, goc, y) {
  var th = thDich, d = th && th.df, moiR = dfDu, tR, tG, i, w, w0 = dfW, w1, c0 = dfC, c1, k0 = dfK, k1, e = 0, rw, ti, v, muon = dfMuon() && y ? 1 : 0;
  moiR.set(x); tR = qR.shift(); qR.push(moiR); tG = qG.shift(); qG.push(goc); dfDu = tR;
  dfIm = noiR ? 0 : dfIm + 1; dfMo = noiR ? 4 : dfMo - 1;
  if (!dfGd) {
    dfW = 0;
    if (!dfMuon() || dfAm < 50) { dfDoi = 0; return; }
    dfDoi += 1;
    if (dfIm < 8 && dfDoi < 300) return;
    /* nhập cuộc: lùi đường RNNoise thêm 2 khung bằng một khung trộn dần (đang im ⇒ không nghe thấy) */
    for (i = 0; i < 480; i++) { w = (i + 1) / 480; x[i] = x[i] * (1 - w) + tR[i] * w; }
    dfGd = 1; dfC = 1; dfK = d.kho; dfDoi = 0; baoLoc({ bo: 'rn', tre: 30 }); return;
  }
  if (!thDich && !tre && dfW <= 0) {
    /* thầy tắt lọc và cả hai đường đã trôi về tiếng gốc: bỏ phần lùi 20 ms bằng một khung trộn dần */
    for (i = 0; i < 480; i++) { w = (i + 1) / 480; x[i] = tR[i] * (1 - w) + x[i] * w; }
    dfGd = 0; dfAm = 0; dfBo = 0; baoLoc({ bo: 'rn', tre: 10 }); return;
  }
  w1 = !y ? 0 : muon ? Math.min(1, w0 + 0.05) : Math.max(0, w0 - 0.05);
  if (!y || (w0 <= 0 && w1 <= 0)) { for (i = 0; i < 480; i++) x[i] = tR[i]; dfW = 0; if (dfBo) { dfBo = 0; baoLoc({ bo: 'rn', tre: 30 }); } return; }
  if (!d) d = { kho: dfK, san: 1 };
  for (i = 0; i < 480; i++) e += y[i] * y[i];
  rw = Math.sqrt(e / 480); dfMuc = Math.max(dfMuc * 0.9995, rw);
  /* cổng mềm: có giọng ⇒ 1; không thì theo mức tiếng đã lọc so với giọng gần đây: ≥ −18 dB ⇒ 1, ≤ −36 dB ⇒ san, giữa hai mốc đi thẳng trên thang dB */
  if (dfMo > 0 || d.san >= 1) c1 = 1;
  else {
    ti = dfMuc > 0 ? rw / dfMuc : 1; v = ti >= 0.126 ? 1 : ti <= 0.0158 ? d.san : Math.pow(d.san, Math.log(0.126 / ti) / Math.log(0.126 / 0.0158));
    c1 = v > c0 ? v : v + (c0 - v) * 0.9048;
  }
  k1 = d.kho;
  for (i = 0; i < 480; i++) {
    w = (i + 1) / 480; v = k0 + (k1 - k0) * w; ti = w0 + (w1 - w0) * w;
    x[i] = tR[i] * (1 - ti) + (y[i] * (1 - v) + tG[i] * v) * (c0 + (c1 - c0) * w) * ti;
  }
  dfC = c1; dfK = k1; dfW = w1;
  if (w1 >= 1 && !dfBo) { dfBo = 1; baoLoc({ bo: 'df3', tre: 30 }); } else if (w1 <= 0 && dfBo) { dfBo = 0; baoLoc({ bo: 'rn', tre: 30 }); }
}
/* Số đo của một khung DeepFilterNet trả về (ms xử lý): đủ 50 khung mới được nhập cuộc; trung bình trượt quá 6 ms (hệ số thời gian thực 0,6) ⇒ bỏ bộ ấy. */
function dfDo(ms) {
  dfAm += 1; dfMs = dfAm < 8 ? ms : dfMs * 0.9 + ms * 0.1;
  if (dfAm >= 30 && dfMs > 6 && dfOk) { dfOk = 0; baoLoc({ df: 'cham', ms: dfMs }); }
}
`
