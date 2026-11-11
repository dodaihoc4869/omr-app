// CHUỖI LÀM RÕ TIẾNG của máy thầy (tách khỏi thay.ts 11/11). mic → cộng hai kênh về mono → lọc thông cao 80 Hz → NÂNG MỨC → chặn đỉnh → track gửi cho lớp.
// Ba kiểu nâng mức (đo Chromium 11/11: Web Audio vào bằng luồng mic / ra bằng luồng gửi tự nó đã đệm ≈ 21 ms, chưa kể bộ xử lý):
//   'khung' (mặc định): xử lý TỪNG KHUNG 10 ms của track mic trong một Worker (MediaStreamTrackProcessor → MediaStreamTrackGenerator), không qua Web Audio
//           ⇒ không có bộ đệm ấy. Cùng thuật toán với 'nhanh'. Chỉ Chromium có; không có ⇒ tự xuống 'nhanh'.
//   'nhanh' (thầy 11/11 «tức thì» + «tiếng phải trong nhất»): MỘT AudioWorklet không nhìn-trước — nâng mức CHẬM theo giọng nói (đứng yên trong
//           quãng nghỉ ⇒ không «thở», không nâng ồn nền giữa hai câu) + chặn đỉnh chỉ chạm khi sắp vỡ. Trễ thêm 0 mẫu.
//   'nen'   (đường lui, bản đầu 11/11): hai DynamicsCompressor của Web Audio (mỗi bộ nhìn-trước ≈ 6 ms ⇒ +12 ms).
// Worklet nạp không được (trình duyệt cũ, bị chặn) ⇒ tự về 'nen' (và báo `khiLui`).
// Số đo trước / sau: docs/do-live-1011.md mục 5.

import URL_RNNOISE from './loc-on/rnnoise.wasm?url'

/** Bộ nén nâng mức của kiểu 'nen' (Web Audio tự bù mức theo đường cong nén). */
export const NEN_RO = { nguong: -32, goi: 20, tiLe: 3 }
/** Chặn đỉnh của kiểu 'nen': hạ mức trước bộ chặn + ngưỡng chặn (dB). */
export const CHAN_DINH = { ha: 0.55, nguong: -7 }
/** Kiểu 'nhanh': mức giọng nhắm tới (RMS lúc có tiếng, biên độ), trần đỉnh, khoảng hệ số nâng, tốc độ trôi (dB / giây). */
export const LAM_RO = { dich: 0.13, tran: 0.84, nhoNhat: 0.5, lonNhat: 20, len: 3, lenDau: 9, xuong: 3 }

export type KieuChuoi = 'khung' | 'nhanh' | 'nen'
/** LỌC ỒN RIÊNG (thầy 11/11 «lọc ồn chưa ngon … để giọng thầy và hs trong sáng nhất»): RNNoise (mạng nơ-ron nhỏ, BSD-3; bản wasm của gói
 *  `@sapphi-red/web-noise-suppressor` 0.4.1, MIT) chạy ngay trong Worker của kiểu 'khung', TRƯỚC khâu nâng mức; trễ đúng 10 ms (tiếng gốc được lùi 10 ms
 *  cho khớp). TRỘN BẢN 2 (đo: docs/do-live-1011.md mục 6 — bản 1 trộn cố định làm đục giọng nam ở mức Mạnh):
 *   · băng THẤP (< 3,5 kHz) = lọc × (1 − k) + gốc × k, k = `noi` lúc có giọng / `im` lúc im ⇒ lúc nói không ép độ lợi mạnh, lúc im mới lọc sâu;
 *   · băng CAO = gốc × `cao` lúc có giọng (giữ độ sáng của giọng), lúc im theo k;
 *   · cả tín hiệu nhân CỔNG: 1 lúc có giọng → `san` lúc im (mở trong một khung — sớm hơn tiếng 10 ms nhờ trễ của bộ lọc ⇒ không cắt đầu âm tiết;
 *     đóng êm ≈ 100 ms, giữ 120 ms sau tiếng cuối).
 *  CÓ GIỌNG = bộ lọc báo xác suất có giọng > 0,6 VÀ khung đã lọc to hơn −15 dB so với mức giọng gần đây (xôn xao nhỏ không mở được cổng).
 *  Chỉ chạy với khung 480 mẫu 48 kHz; không thì bỏ qua. */
export type MucLocOn = 'manh' | 'vua' | 'tat'
export const THAM_LOC_ON: Record<MucLocOn, { noi: number; im: number; cao: number; san: number } | null> = { manh: { noi: 0.25, im: 0.05, cao: 0.9, san: 0.25 }, vua: { noi: 0.5, im: 0.2, cao: 1, san: 0.4 }, tat: null }
export interface ChuoiTieng {
  /** Track gửi cho lớp (null = không dựng được đầu ra ⇒ gửi thẳng track mic). */
  ra: MediaStreamTrack | null
  /** Đo mic thô đã cộng kênh: khung ngắn (vạch) + khung dài ≈ 170 ms (phát hiện mic câm). */
  doAm: AnalyserNode
  doDinh: AnalyserNode
  /** Đo đầu ra của chuỗi. */
  doRa: AnalyserNode | null
  nut: AudioNode[]
  /** Kiểu ĐANG chạy: 'cho' = worklet đang nạp (tiếng đi thẳng, chưa nâng mức). */
  kieu: KieuChuoi | 'cho'
  /** Đặt mức lọc ồn riêng (chỉ kiểu 'khung' có). Tệp bộ lọc tải lười lần đầu cần tới; tải / chạy lỗi ⇒ chuỗi chạy tiếp không lọc. */
  datLocOn?: (muc: MucLocOn) => void
  /** Bộ lọc ồn riêng: 'chay' = đang lọc · 'tai' = đang tải · 'tat' · 'loi' = tải / chạy lỗi (đang không lọc). */
  locOn?: 'chay' | 'tai' | 'tat' | 'loi'
}

/** Mã của bộ xử lý (chạy trong luồng âm thanh; viết ES5 + lớp, không phụ thuộc gì). Mỗi khối 128 mẫu:
 *  · sàn ồn = mức thấp nhất gần đây (bám xuống nhanh, trôi lên ≈ 1 dB / giây);
 *  · khối là GIỌNG NÓI khi RMS > 4 × sàn ồn và > −56 dBFS ⇒ cập nhật mức giọng trung bình (≈ 0,5 giây) và cho hệ số nâng trôi về `dich / mức giọng`
 *    (lên / xuống 3 dB / giây — lên 9 dB / giây trong 3 giây nói đầu; tiếng bật to bất chợt để bộ chặn đỉnh lo, hệ số không tụt theo);
 *    khối KHÔNG phải giọng nói ⇒ hệ số ĐỨNG YÊN; im quá 1 giây rồi nói lại ⇒ 3 giây nói kế được lên nhanh như lúc đầu (sau «Tiếp tục» tự chỉnh âm lượng
 *    của trình duyệt đưa tiếng nhỏ đi ≈ 10 dB vài giây — đo 11/11);
 *  · chặn đỉnh từng mẫu: vượt trần ⇒ hạ ngay cho vừa trần, nhả 80 ms. */
const MA_LAM_RO = `
class LamRoTieng extends AudioWorkletProcessor {
  constructor(o) {
    super();
    var p = (o && o.processorOptions) || {};
    this.c = p; this.g = p.g0 > 0 ? p.g0 : 1; this.gl = 1; this.nen = 0.001; this.muc = 0; this.dem = 0; this.bao = 0; this.im = 0;
  }
  process(vao, ra) {
    var x = vao[0] && vao[0][0], y = ra[0] && ra[0][0];
    if (!y) return true;
    if (!x) { for (var k = 0; k < y.length; k++) y[k] = 0; return true; }
    var c = this.c, n = x.length, e = 0, i, r, g0 = this.g, g1, can, buoc, v, a, gl = this.gl, nha = 1 - Math.exp(-1 / (0.08 * sampleRate));
    for (i = 0; i < n; i++) e += x[i] * x[i];
    r = Math.sqrt(e / n);
    this.nen = r < this.nen ? this.nen * 0.9 + r * 0.1 : Math.min(0.05, this.nen * 1.0003);
    if (r > this.nen * 4 && r > 0.0015) {
      if (this.im > sampleRate) this.dem = Math.min(this.dem, 40);
      this.im = 0; this.dem += 1;
      this.muc = this.dem < 40 ? this.muc + (r * r - this.muc) / this.dem : this.muc + (r * r - this.muc) * (n / (0.5 * sampleRate));
      can = Math.max(c.nhoNhat, Math.min(c.lonNhat, c.dich / Math.sqrt(this.muc || 1e-9)));
      buoc = Math.pow(10, ((can > g0 ? (this.dem * n < 3 * sampleRate ? c.lenDau : c.len) : c.xuong) / 20) * (n / sampleRate));
      this.g = can > g0 ? Math.min(can, g0 * buoc) : Math.max(can, g0 / buoc);
    } else this.im += n;
    g1 = this.g;
    for (i = 0; i < n; i++) {
      v = x[i] * (g0 + (g1 - g0) * (i + 1) / n); a = v < 0 ? -v : v;
      if (a * gl > c.tran) gl = c.tran / a; else gl += (1 - gl) * nha;
      y[i] = v * gl;
    }
    this.gl = gl;
    if (++this.bao >= 375) { this.bao = 0; this.port.postMessage(this.g); }
    return true;
  }
}
registerProcessor('lam-ro-tieng', LamRoTieng);
`
/** Mã Worker của kiểu 'khung': đọc từng khung tiếng (AudioData) của track mic, cộng các kênh về mono, lọc thông cao 80 Hz, nâng mức + chặn đỉnh (đúng thuật
 *  toán của LamRoTieng ở trên), ghi khung mới cùng mốc giờ. Một khung vào ⇒ một khung ra, không đệm. */
const MA_KHUNG = `
var rn = null, thDich = null, tre = 0, cu = new Float32Array(480), lk = 1, lc = 1, giu = 0, mucNoi = 0, z1 = [0, 0, 0, 0], z2 = [0, 0, 0, 0], T0 = { noi: 1, im: 1, cao: 1, san: 1 }, lb0 = 0, lb1 = 0, la1 = 0, la2 = 0, c = null, g = 1, gl = 1, nen = 0.001, muc = 0, dem = 0, im = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0, hz = 0, b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, bao = 0, tam = null;
function napLoc(buf) {
  var bo, x;
  try {
    x = new WebAssembly.Instance(new WebAssembly.Module(buf), { env: { emscripten_memcpy_big: function (d, s, n) { new Uint8Array(bo.buffer).copyWithin(d, s, s + n); }, emscripten_resize_heap: function () { return 0; }, __assert_fail: function () { throw new Error('rnnoise'); } } }).exports;
    bo = x.memory;
    if (x.emscripten_stack_init) x.emscripten_stack_init();
    if (x.__wasm_call_ctors) x.__wasm_call_ctors();
    if (x.rnnoise_get_frame_size() !== 480) throw new Error('khung');
    rn = { x: x, bo: bo, st: x.rnnoise_create(0), pv: x.malloc(1920), pr: x.malloc(1920) };
    postMessage({ loc: 'chay' });
  } catch (e) { rn = null; postMessage({ loc: 'loi' }); }
}
/* Thông thấp Butterworth bậc 2 ở 3,5 kHz (48 kHz) để tách băng; băng cao = tín hiệu − băng thấp (cộng lại đúng nguyên tín hiệu). */
(function () { var w0 = 2 * Math.PI * 3500 / 48000, al = Math.sin(w0) / (2 * Math.SQRT1_2), a0 = 1 + al; lb0 = (1 - Math.cos(w0)) / 2 / a0; lb1 = (1 - Math.cos(w0)) / a0; la1 = -2 * Math.cos(w0) / a0; la2 = (1 - al) / a0; })();
function thap(v, z) { var o = lb0 * v + lb1 * z[0] + lb0 * z[1] - la1 * z[2] - la2 * z[3]; z[1] = z[0]; z[0] = v; z[3] = z[2]; z[2] = o; return o; }
/* Lọc ồn một khung 480 mẫu 48 kHz tại chỗ (thuật toán trộn: xem THAM_LOC_ON; bản đo ngoại tuyến chép đúng hàm này: scripts/thu-live-1011/do-loc-on.mjs).
   Vào / ra chế độ lọc bằng MỘT khung chuyển (trộn dần khung này với khung trước) nên không «bụp»; tắt thì trôi về tiếng gốc rồi mới ra. */
function locOn(x) {
  var muon = rn && thDich, th = thDich || T0, i, w, f, r, e = 0, rw, vad, noi, k1, c1, cao1, k0 = lk, c0 = lc, goc, kk;
  if (!tre && !muon) return;
  if (tre && !muon && lk >= 1 && lc > 0.99) { for (i = 0; i < 480; i++) { w = (i + 1) / 480; x[i] = cu[i] * (1 - w) + x[i] * w; } tre = 0; return; }
  f = new Float32Array(rn.bo.buffer, rn.pv, 480);
  for (i = 0; i < 480; i++) f[i] = x[i] * 32768 + (Math.random() - 0.5) * 0.1;
  vad = rn.x.rnnoise_process_frame(rn.st, rn.pr, rn.pv);
  r = new Float32Array(rn.bo.buffer, rn.pr, 480);
  if (!tre) { for (i = 0; i < 480; i++) { w = (i + 1) / 480; f[i] = x[i]; x[i] = x[i] * (1 - w) + cu[i] * w; cu[i] = f[i]; } tre = 1; lk = 1; lc = 1; return; }
  for (i = 0; i < 480; i++) e += r[i] * r[i];
  rw = Math.sqrt(e / 480) / 32768; mucNoi = Math.max(mucNoi * 0.9995, rw);
  if (vad > 0.6 && rw > 0.18 * mucNoi) giu = 12; else if (giu > 0) giu -= 1;
  noi = giu > 0; k1 = noi ? th.noi : Math.max(th.im, lk - 0.1); c1 = noi ? 1 : th.san + (lc - th.san) * 0.9048; cao1 = noi ? th.cao : 0;
  for (i = 0; i < 480; i++) {
    w = (i + 1) / 480; kk = k0 + (k1 - k0) * w; goc = cu[i]; f[i] = x[i];
    x[i] = (thap(r[i] / 32768 * (1 - kk) + goc * kk, z1) + (goc - thap(goc, z2)) * (cao1 > kk ? cao1 : kk)) * (c0 + (c1 - c0) * w);
    cu[i] = f[i];
  }
  lk = k1; lc = c1;
}
function xuLy(f) {
  var n = f.numberOfFrames, kenh = f.numberOfChannels, s = f.sampleRate, moc = f.timestamp, x = new Float32Array(n), i, k, e = 0, r, g0 = g, can, buoc, v, a, w, al, nha;
  if (!tam || tam.length !== n) tam = new Float32Array(n);
  for (k = 0; k < kenh; k++) { f.copyTo(tam, { planeIndex: k, format: 'f32-planar' }); for (i = 0; i < n; i++) x[i] += tam[i]; }
  f.close();
  if (s !== hz) { hz = s; w = 2 * Math.PI * 80 / s; al = Math.sin(w) / (2 * 0.707); a = 1 + al; b0 = (1 + Math.cos(w)) / 2 / a; b1 = -(1 + Math.cos(w)) / a; b2 = b0; a1 = -2 * Math.cos(w) / a; a2 = (1 - al) / a; }
  for (i = 0; i < n; i++) { v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; x[i] = v; }
  if (n === 480 && s === 48000) { try { locOn(x); } catch (err) { rn = null; tre = 0; lk = 1; lc = 1; postMessage({ loc: 'loi' }); } } else if (!tre) cu.fill(0);
  for (i = 0; i < n; i++) e += x[i] * x[i];
  r = Math.sqrt(e / n);
  nen = r < nen ? nen * 0.9 + r * 0.1 : Math.min(0.05, nen * Math.pow(1.0003, n / 128));
  if (r > nen * 4 && r > 0.0015) {
    if (im > s) dem = Math.min(dem, 40);
    im = 0; dem += n / 128;
    muc = dem < 40 ? muc + (r * r - muc) / Math.max(1, dem * 128 / n) : muc + (r * r - muc) * (n / (0.5 * s));
    can = Math.max(c.nhoNhat, Math.min(c.lonNhat, c.dich / Math.sqrt(muc || 1e-9)));
    buoc = Math.pow(10, ((can > g0 ? (dem * 128 < 3 * s ? c.lenDau : c.len) : c.xuong) / 20) * (n / s));
    g = can > g0 ? Math.min(can, g0 * buoc) : Math.max(can, g0 / buoc);
  } else im += n;
  nha = 1 - Math.exp(-1 / (0.08 * s));
  for (i = 0; i < n; i++) {
    v = x[i] * (g0 + (g - g0) * (i + 1) / n); a = v < 0 ? -v : v;
    if (a * gl > c.tran) gl = c.tran / a; else gl += (1 - gl) * nha;
    x[i] = v * gl;
  }
  if (++bao >= 100) { bao = 0; postMessage({ g: g }); }
  return new AudioData({ format: 'f32-planar', sampleRate: s, numberOfFrames: n, numberOfChannels: 1, timestamp: moc, data: x });
}
onmessage = function (ev) {
  var d = ev.data, doc, ghi;
  if (d && d.loc) napLoc(d.loc);
  if (d && 'muc' in d) thDich = d.muc || null;
  if (!d || !d.vao) return;
  c = d.c; if (c.g0 > 0) g = c.g0;
  doc = d.vao.getReader(); ghi = d.ra.getWriter();
  (function buoc() {
    doc.read().then(function (kq) {
      if (kq.done) { try { ghi.close(); } catch (e) {} return; }
      try { ghi.write(xuLy(kq.value)); } catch (e) { postMessage({ loi: String(e) }); return; }
      buoc();
    }, function (e) { postMessage({ loi: String(e) }); });
  })();
};
`
const daNap = new WeakMap<object, Promise<boolean>>()
/** Hệ số nâng gần nhất: mở lại mic / đổi mic thì BẮT ĐẦU từ hệ số ấy (không tụt về 1), rồi 3 giây nói đầu vẫn trôi nhanh về mức đúng của luồng mới. */
let gNho = 0

/** Trình duyệt này có chạy được kiểu 'nhanh' không (biết ngay, chưa cần nạp). */
/** Trình duyệt này xử lý được từng khung tiếng của track trong Worker (kiểu 'khung') không. */
export const coKhung = (): boolean => { const g = globalThis as unknown as Record<string, unknown>; return typeof g.MediaStreamTrackProcessor === 'function' && typeof g.MediaStreamTrackGenerator === 'function' && typeof g.AudioData === 'function' && typeof Worker === 'function' && typeof Blob === 'function' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' }
export const coWorklet = (c: AudioContext | null): boolean => !!c && typeof AudioWorkletNode === 'function' && !!(c as unknown as { audioWorklet?: unknown }).audioWorklet && typeof Blob === 'function' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'

function napLamRo(c: AudioContext): Promise<boolean> {
  let p = daNap.get(c)
  if (!p) {
    p = (async () => {
      const u = URL.createObjectURL(new Blob([MA_LAM_RO], { type: 'text/javascript' }))
      try { await c.audioWorklet.addModule(u); return true } catch { return false } finally { try { URL.revokeObjectURL(u) } catch { /* đã thu */ } }
    })()
    daNap.set(c, p)
  }
  return p
}

/** Dựng chuỗi cho luồng mic `l`. `khiLui` = muốn 'nhanh' mà phải chạy 'nen' (worklet nạp hỏng). Ném lỗi nếu Web Audio không dựng được phần đo. */
let tepLoc: Promise<ArrayBuffer | null> | null = null
/** Tải tệp bộ lọc ồn MỘT lần (≈ 157 KB, mảnh riêng — không nằm trong kho tải sẵn của service worker). Lỗi ⇒ null. */
function taiLoc(): Promise<ArrayBuffer | null> {
  if (!tepLoc) tepLoc = (async () => { try { const r = await fetch(URL_RNNOISE); return r.ok ? await r.arrayBuffer() : null } catch { return null } })().then((b) => { if (!b) tepLoc = null; return b })
  return tepLoc
}

/** Kiểu 'khung': trả track đã xử lý + hàm dọn; không dựng được ⇒ null. `khiHong` = Worker báo lỗi giữa chừng (lớp gọi bỏ chuỗi, gửi thẳng track mic). */
function dungKhung(t: MediaStreamTrack, k: ChuoiTieng, khiHong?: () => void): { ra: MediaStreamTrack; don: () => void } | null {
  if (!coKhung()) return null
  let w: Worker | null = null, u = ''
  try {
    const G = globalThis as unknown as { MediaStreamTrackProcessor: new (o: { track: MediaStreamTrack }) => { readable: ReadableStream }; MediaStreamTrackGenerator: new (o: { kind: string }) => MediaStreamTrack & { writable: WritableStream } }
    const xl = new G.MediaStreamTrackProcessor({ track: t }), sinh = new G.MediaStreamTrackGenerator({ kind: 'audio' })
    u = URL.createObjectURL(new Blob([MA_KHUNG], { type: 'text/javascript' }))
    w = new Worker(u)
    const wk = w
    let muc: MucLocOn = 'tat', daGui = false
    wk.onmessage = (e: MessageEvent) => { const d = e.data as { g?: number; loi?: string; loc?: 'chay' | 'loi' }; if (typeof d?.g === 'number' && d.g > 0) gNho = d.g; if (d?.loc) k.locOn = d.loc === 'chay' && muc === 'tat' ? 'tat' : d.loc; if (d?.loi) khiHong?.() }
    k.locOn = 'tat'
    k.datLocOn = (m) => {
      muc = m
      try { wk.postMessage({ muc: THAM_LOC_ON[m] }) } catch { /* Worker đã dừng */ }
      if (m === 'tat') { if (k.locOn !== 'loi') k.locOn = 'tat'; return }
      if (daGui) { if (k.locOn === 'tat') k.locOn = 'chay'; return }
      daGui = true; k.locOn = 'tai'
      void taiLoc().then((b) => { if (!b) { k.locOn = 'loi'; daGui = false; return } try { const ban = b.slice(0); wk.postMessage({ loc: ban, muc: THAM_LOC_ON[muc] }, [ban]) } catch { k.locOn = 'loi' } })
    }
    wk.onerror = () => khiHong?.()
    wk.postMessage({ c: { ...LAM_RO, g0: gNho }, vao: xl.readable, ra: sinh.writable }, [xl.readable as unknown as Transferable, sinh.writable as unknown as Transferable])
    return { ra: sinh, don: () => { try { wk.terminate() } catch { /* đã dừng */ } try { URL.revokeObjectURL(u) } catch { /* đã thu */ } } }
  } catch { try { w?.terminate() } catch { /* chưa chạy */ } return null }
}

export function dungChuoiTieng(c: AudioContext, l: MediaStream, o: { kieu: KieuChuoi; khiLui?: () => void; khiHong?: () => void }): ChuoiTieng {
  const vao = c.createMediaStreamSource(l)
  // Cộng hai kênh về mono (bộ thu hai kênh chỉ có tiếng ở MỘT kênh không bị mất, không bị chia đôi).
  const tron = c.createGain(); tron.channelCount = 1; tron.channelCountMode = 'explicit'; tron.channelInterpretation = 'discrete'
  const doAm = c.createAnalyser(); doAm.fftSize = 1024
  const doDinh = c.createAnalyser(); doDinh.fftSize = 8192
  const nut: AudioNode[] = [vao, tron, doAm, doDinh]
  try { const tach = c.createChannelSplitter(2); vao.connect(tach); tach.connect(tron, 0); tach.connect(tron, 1); nut.push(tach) } catch { vao.connect(tron) }
  tron.connect(doAm); tron.connect(doDinh)
  const k: ChuoiTieng = { ra: null, doAm, doDinh, doRa: null, nut, kieu: 'cho' }
  const micT = l.getAudioTracks()[0]
  const kh = o.kieu === 'khung' && micT ? dungKhung(micT, k, o.khiHong) : null
  if (kh) {
    // Web Audio chỉ còn ĐO đầu ra (vạch mic), không nằm trên đường tiếng
    const doRa = c.createAnalyser(); doRa.fftSize = 1024
    try { const v = c.createMediaStreamSource(new MediaStream([kh.ra])); v.connect(doRa); nut.push(v) } catch { /* không đo được đầu ra: vạch lấy số đo của bộ gửi */ }
    nut.push(doRa, { disconnect: kh.don } as unknown as AudioNode)
    try { kh.ra.contentHint = 'speech' } catch { /* trình duyệt cũ */ }
    k.ra = kh.ra; k.doRa = doRa; k.kieu = 'khung'
    return k
  }
  try {
    const cao = c.createBiquadFilter(); cao.type = 'highpass'; cao.frequency.value = 80; cao.Q.value = 0.707
    const doRa = c.createAnalyser(); doRa.fftSize = 1024
    const dich = c.createMediaStreamDestination(); dich.channelCount = 1
    tron.connect(cao)
    nut.push(cao, doRa, dich)
    const noi = (cuoi: AudioNode): void => { cuoi.connect(doRa); cuoi.connect(dich) }
    const dungNen = (): void => {
      const nen = c.createDynamicsCompressor(); nen.threshold.value = NEN_RO.nguong; nen.knee.value = NEN_RO.goi; nen.ratio.value = NEN_RO.tiLe; nen.attack.value = 0.005; nen.release.value = 0.2
      const ha = c.createGain(); ha.gain.value = CHAN_DINH.ha
      const chan = c.createDynamicsCompressor(); chan.threshold.value = CHAN_DINH.nguong; chan.knee.value = 0; chan.ratio.value = 20; chan.attack.value = 0.001; chan.release.value = 0.08
      cao.connect(nen); nen.connect(ha); ha.connect(chan); noi(chan)
      nut.push(nen, ha, chan); k.kieu = 'nen'
    }
    if (o.kieu !== 'nen' && coWorklet(c)) {
      noi(cao) // trong lúc nạp (thường < 50 ms): tiếng đi thẳng, không đứt
      void napLamRo(c).then((duoc) => {
        if (k.kieu !== 'cho') return
        try { cao.disconnect() } catch { /* chưa nối */ }
        try {
          if (!duoc) throw new Error('worklet')
          const w = new AudioWorkletNode(c, 'lam-ro-tieng', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit', processorOptions: { ...LAM_RO, g0: gNho } })
          w.port.onmessage = (e) => { if (typeof e.data === 'number' && e.data > 0) gNho = e.data }
          cao.connect(w); noi(w); nut.push(w); k.kieu = 'nhanh'
        } catch { dungNen(); o.khiLui?.() }
      })
    } else dungNen()
    const ra = dich.stream.getAudioTracks()[0] ?? null
    if (ra) { try { ra.contentHint = 'speech' } catch { /* trình duyệt cũ */ } k.ra = ra; k.doRa = doRa }
  } catch { k.ra = null; k.doRa = null }
  return k
}
