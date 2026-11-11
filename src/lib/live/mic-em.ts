// LỌC ỒN CHO MIC CỦA EM LÊN BẢNG (Z4, thầy 11/11: em đứng cạnh thầy, mic điện thoại mở là một nguồn ồn lớp nghe thấy). Bộ NHẸ: RNNoise lượt 2 (trộn theo
// băng + cổng theo giọng — đúng mã MA_LOC của máy thầy) chạy trong MỘT AudioWorklet (iPhone Safari không có MediaStreamTrackProcessor), ĐẶT SAU khử vọng +
// lọc ồn + tự chỉnh âm lượng của trình duyệt (vẫn bật như cũ — khử vọng là thứ chống hú khi em đứng gần loa lớp).
// Luật an toàn (không bao giờ mất tiếng em):
//  · track mic thô được gửi NGAY như cũ; bộ lọc dựng xong, đã chạy thật vài khung và AudioContext đang `running` thì lớp gọi mới đổi sang track đã lọc;
//  · luồng âm thanh chạy không kịp (trung bình > 3 ms cho một khung 10 ms, đo liền 1 giây) ⇒ worklet tự chuyển sang cho tiếng đi thẳng và báo `cham`;
//    AudioContext bị treo / đóng ⇒ báo `treo`; cả hai ⇒ lớp gọi đổi lại track mic thô (chỉ còn lọc của trình duyệt);
//  · máy yếu (`ddh.mayYeu`), không có AudioWorklet / WebAssembly, AudioContext không chạy 48 kHz ⇒ không dựng, dùng lọc của trình duyệt.
// Trễ thêm của đường này: gom khung 10 ms + RNNoise 10 ms + bộ đệm vào / ra của Web Audio (đo Chromium 11/11 ≈ 21 ms) ≈ 40 ms.
import { MA_LOC } from './loc-on/ma-loc'

/** Mã bộ xử lý (ES5): gom khối 128 mẫu thành khung 480, lọc bằng `locOn` của MA_LOC, trả ra qua hàng đợi (đều nhịp, không hụt sau khung đầu). */
export const MA_MIC_EM = MA_LOC + `
class LocMicEm extends AudioWorkletProcessor {
  constructor(o) {
    super();
    var p = (o && o.processorOptions) || {};
    this.v = new Float32Array(480); this.n = 0; this.q = new Float32Array(1920); this.d = 0; this.c = 0; this.thang = 0; this.dem = 0; this.tong = 0; this.bao = 0;
    thDich = p.muc || null; napLoc(p.wasm);
    this.ok = !!rn;
    this.port.postMessage({ loc: this.ok ? 'chay' : 'loi' });
  }
  process(vao, ra) {
    var x = vao[0] && vao[0][0], y = ra[0] && ra[0][0], i, n, t0, q = this.q;
    if (!y) return true;
    if (!x) { for (i = 0; i < y.length; i++) y[i] = 0; return true; }
    if (!this.ok || this.thang) { y.set(x); return true; }
    n = x.length;
    for (i = 0; i < n; i++) {
      this.v[this.n++] = x[i];
      if (this.n === 480) {
        t0 = Date.now();
        try { locOn(this.v); } catch (e) { this.ok = false; this.port.postMessage({ loc: 'loi' }); y.set(x); return true; }
        this.tong += Date.now() - t0; this.dem += 1;
        if (this.dem >= 100) { if (this.tong > 300) { this.thang = 1; this.port.postMessage({ loc: 'cham', ms: this.tong / this.dem }); y.set(x); return true; } this.dem = 0; this.tong = 0; }
        for (n = 0; n < 480; n++) q[(this.d + this.c + n) % 1920] = this.v[n];
        this.c += 480; this.n = 0; n = x.length;
        if (!this.bao && ++this.bao) this.port.postMessage({ song: 1 });
      }
    }
    for (i = 0; i < y.length; i++) { if (this.c > 0) { y[i] = q[this.d]; this.d = (this.d + 1) % 1920; this.c -= 1; } else y[i] = 0; }
    return true;
  }
}
registerProcessor('loc-mic-em', LocMicEm);
`

export interface LocMicEm {
  /** Track đã lọc (chỉ đưa vào bộ gửi sau khi `khiSan` gọi). */
  ra: MediaStreamTrack
  don: () => void
}
type Ctx = typeof AudioContext

/** Dựng bộ lọc cho luồng mic `luong`. `wasm` = tệp RNNoise (lớp gọi tải). `khiSan` = bộ lọc đã chạy thật ⇒ đổi bộ gửi sang `ra`;
 *  `khiLui(vì)` = chậm / treo / lỗi ⇒ đổi lại track mic thô. Không dựng được ⇒ null (cứ gửi mic thô). */
export async function dungLocMicEm(luong: MediaStream, wasm: ArrayBuffer, muc: unknown, o: { khiSan: () => void; khiLui: (vi: 'cham' | 'treo' | 'loi') => void }): Promise<LocMicEm | null> {
  const C: Ctx | undefined = typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext
  if (!C || typeof AudioWorkletNode !== 'function' || typeof WebAssembly !== 'object' || typeof Blob !== 'function' || typeof URL.createObjectURL !== 'function') return null
  let c: AudioContext | null = null, u = '', xong = false
  const don = (): void => { if (xong) return; xong = true; try { void c?.close().catch(() => undefined) } catch { /* đã đóng */ } }
  try {
    c = new C({ sampleRate: 48000, latencyHint: 'interactive' })
    if (c.sampleRate !== 48000 || !c.audioWorklet) { don(); return null }
    u = URL.createObjectURL(new Blob([MA_MIC_EM], { type: 'text/javascript' }))
    await c.audioWorklet.addModule(u)
    const vao = c.createMediaStreamSource(luong), dich = c.createMediaStreamDestination()
    dich.channelCount = 1
    const w = new AudioWorkletNode(c, 'loc-mic-em', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit', processorOptions: { wasm, muc } })
    let san = false, lui = false
    const bao = (vi: 'cham' | 'treo' | 'loi'): void => { if (lui || xong) return; lui = true; o.khiLui(vi) }
    w.port.onmessage = (e: MessageEvent) => {
      const d = e.data as { loc?: string; song?: number }
      if (d?.loc === 'cham') bao('cham'); else if (d?.loc === 'loi') bao('loi')
      if (d?.song && !san && !lui && !xong && c?.state === 'running') { san = true; o.khiSan() }
    }
    const ctx = c
    c.onstatechange = () => { if (ctx.state !== 'running' && san) bao('treo') }
    vao.connect(w); w.connect(dich)
    void c.resume().catch(() => undefined)
    const ra = dich.stream.getAudioTracks()[0]
    if (!ra) { don(); return null }
    try { ra.contentHint = 'speech' } catch { /* trình duyệt cũ */ }
    return { ra, don }
  } catch { don(); return null } finally { if (u) { try { URL.revokeObjectURL(u) } catch { /* đã thu */ } } }
}
