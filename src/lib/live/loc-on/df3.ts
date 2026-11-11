// BỘ LỌC ỒN DeepFilterNet 3 (toàn dải 48 kHz) của máy thầy — thầy 11/11: «khử ồn phải thật xuất sắc, giọng nói trong rõ ràng».
// Chạy ở MỘT WORKER RIÊNG, dùng chung cho mọi lần mở mic trong một lượt mở app: tải hai tệp ở `public/loc-on/` (bộ máy wasm đã nén gzip ≈ 4 MB + mô hình
// ≈ 8 MB; song song, có tiến độ), lưu Cache Storage (lần sau không tải lại), giải nén, dựng, chạy nóng 40 khung rồi mới báo sẵn sàng. Worker của chuỗi
// làm rõ tiếng nói chuyện THẲNG với Worker này qua một MessagePort (mỗi khung 480 mẫu đi một vòng) ⇒ khâu tải / dựng / một khung chậm không bao giờ chặn
// đường tiếng. Hai tệp KHÔNG nằm trong kho tải sẵn của service worker, không app nào tải lúc mở; chỉ tải khi thầy bật live với lọc ồn Vừa / Mạnh.
// Nguồn + giấy phép: LICENSE.txt cùng thư mục. Số đo: docs/do-live-1011.md mục 7.

/** Hai tệp của bộ lọc (đường dẫn tính từ gốc app) + cỡ để hiện tiến độ. Đổi tệp ⇒ đổi TÊN tệp và tên kho (tệp được giữ vĩnh viễn ở máy thầy). */
export const TEP_DF3 = { wasm: 'loc-on/df3-wasm-0200.bin', moHinh: 'loc-on/df3-mo-hinh-v3.bin', coWasm: 3975277, coMoHinh: 7983136, kho: 'ddh-loc-on-df3-0200' }

/** 'khong' = chưa cần / máy không chạy được · 'tai' = đang tải + dựng · 'san' = sẵn sàng · 'loi' = tải / dựng lỗi · 'cham' = máy chạy không kịp (đã bỏ). */
export interface TinhDf3 { tinh: 'khong' | 'tai' | 'san' | 'loi' | 'cham'; da: number; tong: number; ms: number }

/** Mã Worker (ES5). Tin vào: { tai: { wasm, moHinh, kho } } một lần; { cong: MessagePort } mỗi lần có chuỗi tiếng mới. Qua cổng: { s, k: Float32Array(480) }
 *  ⇒ { s, k: khung đã lọc (trễ 1440 mẫu), ms }. Tin ra: { da } tiến độ byte · { san: 1, ms, msDung } · { loi }. */
export const MA_THO_DF3 = `
var x = null, st = 0, cong = null, td = new TextDecoder(), da = [0, 0], tBao = 0;
function tien(i, n) { var t = Date.now(); da[i] = n; if (t - tBao > 120) { tBao = t; postMessage({ da: da[0] + da[1] }); } }
function ghep(ds, tong) { var b = new Uint8Array(tong), o = 0, i; for (i = 0; i < ds.length; i++) { b.set(ds[i], o); o += ds[i].length; } return b; }
function taiMot(u, kho, i) {
  return (kho ? kho.match(u).catch(function () { return null; }) : Promise.resolve(null)).then(function (r) {
    if (r) return r.arrayBuffer().then(function (b) { tien(i, b.byteLength); return new Uint8Array(b); });
    return fetch(u).then(function (r2) {
      var doc, ds = [], tong = 0;
      if (!r2.ok) throw new Error('tai ' + r2.status);
      doc = r2.body && r2.body.getReader ? r2.body.getReader() : null;
      if (!doc) return r2.arrayBuffer().then(function (b) { return new Uint8Array(b); });
      return (function buoc() { return doc.read().then(function (k) { if (k.done) return ghep(ds, tong); ds.push(k.value); tong += k.value.length; tien(i, tong); return buoc(); }); })();
    }).then(function (b) {
      if (kho) { try { kho.put(u, new Response(b.slice(0), { headers: { 'content-type': 'application/octet-stream' } })).catch(function () {}); } catch (e) {} }
      return b;
    });
  });
}
function giai(b) {
  if (b[0] !== 0x1f || b[1] !== 0x8b) return Promise.resolve(b);
  return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer().then(function (a) { return new Uint8Array(a); });
}
function chay(k) { var p = (x.__wbindgen_malloc_command_export || x.__wbindgen_malloc)(1920, 4) >>> 0; new Float32Array(x.memory.buffer, p, 480).set(k); return x.df_process_frame(st, p, 480); }
function dung(wasm, moHinh) {
  return WebAssembly.compile(wasm).then(function (mod) {
    var imp = {}, ds = WebAssembly.Module.imports(mod), i;
    for (i = 0; i < ds.length; i++) (function (n, m) {
      if (n.indexOf('new_from_slice') >= 0) m[n] = function (p, l) { return new Float32Array(new Float32Array(x.memory.buffer, p >>> 0, l)); };
      else if (n.indexOf('getRandomValues') >= 0) m[n] = function (p, l) { crypto.getRandomValues(new Uint8Array(x.memory.buffer, p >>> 0, l)); };
      else if (n.indexOf('wbindgen_throw') >= 0) m[n] = function (p, l) { throw new Error(td.decode(new Uint8Array(x.memory.buffer, p >>> 0, l))); };
      else if (n.indexOf('init_externref_table') >= 0) m[n] = function () { var t = x.__wbindgen_externrefs, o = t.grow(4); t.set(0, undefined); t.set(o, undefined); t.set(o + 1, null); t.set(o + 2, true); t.set(o + 3, false); };
      else throw new Error('import ' + n);
    })(ds[i].name, imp[ds[i].module] || (imp[ds[i].module] = {}));
    return WebAssembly.instantiate(mod, imp);
  }).then(function (inst) {
    var p, k = new Float32Array(480), i, j, t0, tong = 0;
    x = inst.exports; x.__wbindgen_start();
    p = (x.__wbindgen_malloc_command_export || x.__wbindgen_malloc)(moHinh.length, 1) >>> 0; new Uint8Array(x.memory.buffer).set(moHinh, p);
    st = x.df_create(p, moHinh.length, 100) >>> 0;
    if ((x.df_get_frame_length(st) >>> 0) !== 480) throw new Error('khung');
    for (i = 0; i < 40; i++) { for (j = 0; j < 480; j++) k[j] = (Math.random() - 0.5) * 0.002; t0 = performance.now(); chay(k); if (i >= 30) tong += performance.now() - t0; }
    return tong / 10;
  });
}
function nhan(ev) {
  var d = ev.data, t0, y;
  if (!d || !d.k || !x) return;
  try { t0 = performance.now(); y = chay(d.k); cong.postMessage({ s: d.s, k: y, ms: performance.now() - t0 }, [y.buffer]); }
  catch (e) { x = null; try { cong.postMessage({ s: d.s, loi: 1 }); } catch (e2) {} postMessage({ loi: String(e) }); }
}
onmessage = function (ev) {
  var d = ev.data, t0;
  if (d && d.cong) { if (cong) { try { cong.close(); } catch (e) {} } cong = d.cong; cong.onmessage = nhan; return; }
  if (!d || !d.tai) return;
  t0 = performance.now();
  (self.caches ? caches.open(d.tai.kho).catch(function () { return null; }) : Promise.resolve(null)).then(function (kho) {
    if (self.caches) caches.keys().then(function (ds) { ds.forEach(function (n) { if (n.indexOf('ddh-loc-on-df3-') === 0 && n !== d.tai.kho) caches.delete(n); }); }).catch(function () {});
    return Promise.all([taiMot(d.tai.wasm, kho, 0).then(giai), taiMot(d.tai.moHinh, kho, 1)]);
  }).then(function (b) { postMessage({ da: da[0] + da[1], dung: 1 }); return dung(b[0], b[1]); })
    .then(function (ms) { postMessage({ san: 1, ms: ms, msDung: performance.now() - t0 }); }, function (e) { x = null; postMessage({ loi: String(e) }); });
};
`

const TINH0: TinhDf3 = { tinh: 'khong', da: 0, tong: TEP_DF3.coWasm + TEP_DF3.coMoHinh, ms: 0 }
let tho: Worker | null = null, url = '', tinh: TinhDf3 = { ...TINH0 }, soLoi = 0, henDon: ReturnType<typeof setTimeout> | null = null
const choSan = new Set<() => void>(), nghe = new Set<() => void>()
const bao = (): void => { for (const f of [...nghe]) { try { f() } catch { /* người nghe lỗi không chặn bộ lọc */ } } }

/** Công tắc lùi khẩn: localStorage `ddh.live.df3` = `tat` ⇒ chỉ dùng RNNoise. */
const biTat = (): boolean => { try { return typeof localStorage !== 'undefined' && localStorage.getItem('ddh.live.df3') === 'tat' } catch { return false } }
/** Máy này chạy được bộ DeepFilterNet không (biết ngay, chưa tải gì). Tải / dựng lỗi 3 lần ⇒ thôi tới lần mở app sau. */
export const coDf3 = (): boolean => { const g = globalThis as unknown as Record<string, unknown>; return tinh.tinh !== 'cham' && soLoi < 3 && !biTat() && typeof WebAssembly === 'object' && typeof g.DecompressionStream === 'function' && typeof g.MessageChannel === 'function' && typeof Worker === 'function' && typeof Blob === 'function' && typeof location !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' }
export const tinhDf3 = (): TinhDf3 => tinh
/** Nghe đổi tình trạng / tiến độ tải (cửa sổ nút Live vẽ lại). Trả hàm thôi nghe. */
export function ngheDf3(f: () => void): () => void { nghe.add(f); return () => { nghe.delete(f) } }

function dungTho(): void {
  if (tho) { try { tho.terminate() } catch { /* đã dừng */ } tho = null }
  if (url) { try { URL.revokeObjectURL(url) } catch { /* đã thu */ } url = '' }
  choSan.clear()
}
/** Chuỗi tiếng báo bộ này chạy không kịp trên máy (hệ số thời gian thực > 0,6 hoặc một khung quá hạn) ⇒ bỏ hẳn tới lần mở app sau. */
export function baoChamDf3(): void { if (tinh.tinh === 'cham') return; tinh = { ...tinh, tinh: 'cham' }; dungTho(); bao() }

function khoiDong(): boolean {
  if (tho) return true
  try {
    const goc = new URL((import.meta.env?.BASE_URL as string | undefined) ?? '/', location.href)
    url = URL.createObjectURL(new Blob([MA_THO_DF3], { type: 'text/javascript' }))
    const w = new Worker(url)
    tho = w
    tinh = { ...TINH0, tinh: 'tai' }
    w.onmessage = (e: MessageEvent) => {
      if (tho !== w) return
      const d = e.data as { da?: number; san?: number; ms?: number; loi?: string }
      if (typeof d?.da === 'number') tinh = { ...tinh, da: Math.min(tinh.tong, d.da) }
      if (d?.san) {
        if ((d.ms ?? 0) > 6) { baoChamDf3(); return }
        tinh = { ...tinh, tinh: 'san', da: tinh.tong, ms: d.ms ?? 0 }
        for (const f of [...choSan]) f()
        choSan.clear()
      }
      if (d?.loi) { soLoi += 1; tinh = { ...tinh, tinh: 'loi' }; dungTho() }
      bao()
    }
    w.onerror = () => { if (tho !== w) return; soLoi += 1; tinh = { ...tinh, tinh: 'loi' }; dungTho(); bao() }
    w.postMessage({ tai: { wasm: new URL(TEP_DF3.wasm, goc).href, moHinh: new URL(TEP_DF3.moHinh, goc).href, kho: TEP_DF3.kho } })
    bao()
    return true
  } catch { soLoi += 1; dungTho(); tinh = { ...tinh, tinh: 'loi' }; return false }
}

/** Nối một Worker chuỗi tiếng vào bộ lọc: bộ sẵn sàng (ngay, hoặc sau khi tải xong) ⇒ Worker ấy nhận `{ df: MessagePort }`. Trả hàm gỡ (gọi khi dọn chuỗi);
 *  không còn chuỗi nào dùng suốt 60 giây ⇒ dừng Worker bộ lọc cho nhẹ máy (tệp vẫn nằm trong Cache Storage). */
const dangNoi = new Set<Worker>()
export function noiDf3(wk: Worker): () => void {
  if (!coDf3() || !khoiDong()) return () => undefined
  if (henDon) { clearTimeout(henDon); henDon = null }
  dangNoi.add(wk)
  const noi = (): void => {
    if (!tho || !dangNoi.has(wk)) return
    try { const k = new MessageChannel(); tho.postMessage({ cong: k.port1 }, [k.port1]); wk.postMessage({ df: k.port2 }, [k.port2]) } catch { /* Worker đã dừng */ }
  }
  if (tinh.tinh === 'san') noi(); else choSan.add(noi)
  return () => {
    dangNoi.delete(wk); choSan.delete(noi)
    if (!dangNoi.size && tho && !henDon) henDon = setTimeout(() => { henDon = null; if (!dangNoi.size && tho) { dungTho(); if (tinh.tinh === 'san' || tinh.tinh === 'tai') tinh = { ...TINH0 }; bao() } }, 60_000)
  }
}
