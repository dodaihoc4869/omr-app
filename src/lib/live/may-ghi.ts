// XEM LẠI LIVE — MÁY GHI TRÊN MÁY THẦY (thầy 11/11 «Tôi không bấm gì lúc live cả, tự động làm hết»; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.2, 4.3, 5).
// MẢNH NẠP LƯỜI: chỉ tải khi máy này đang giữ live (src/components/live/thay-noi.ts gọi `soatMayGhi` mỗi lần trạng thái đổi) — đường mở app không thêm byte.
// Tự chạy khi phòng báo live bật + công tắc Xem lại Live bật (`viewBang.live.ghi` khác vắng); tự dừng khi live tắt. Thầy không bấm gì.
// CHUỖI: mic thầy (+ tiếng em đang kéo về khi em ở xa) ⇒ trộn ⇒ AudioWorklet gom mẫu ⇒ MessagePort ⇒ Web Worker (may-ghi-tho.ts: LAME wasm, khúc 10 giây
// theo số mẫu, IndexedDB, tải lên). Luồng chính chỉ nối dây + báo phòng `live-ghi` (trạng thái + mẫu đồng hồ) + chuyển mốc giờ nét.
// BẤT BIẾN: lỗi ghi KHÔNG BAO GIỜ chặn hay làm chậm live — mọi thứ bọc bắt lỗi, hỏng thì báo «loi» (màn chiếu hiện «Chưa ghi được · live vẫn chạy»).
import wasmUrl from 'wasm-media-encoders/wasm/mp3?url'
import type { ViewLiveBang } from '../bpu/phong-live'
import type { SuKienBut } from '../but-bang-loi'
import type { TinRaTho, TinVaoTho } from './may-ghi-tho'
import { PHIEN_GHI } from './xem-lai-khuc'

export type TrangThaiMayGhi = 'dang-ghi' | 'loi' | 'tat'
export interface LuongGhi { mic: MediaStream | null; em: MediaStream | null }
export interface TuyChonMayGhi {
  goc: string
  ve: string
  buoi: string
  /** Luồng tiếng đang có (`taoLiveThay().luongGhi()`): hỏi lại mỗi giây — thầy đổi mic, em lên bảng ở xa bắt đầu / thôi nói. */
  layLuong(): LuongGhi
  /** Gửi tin chữ vào phòng (WebSocket đang có). Kênh rớt ⇒ bỏ qua. */
  gui(tin: Record<string, unknown>): void
  khiTrangThai?(tt: TrangThaiMayGhi, o: { ket: number; lyDo?: string }): void
  khiKhuc?(k: Extract<TinRaTho, { l: 'khuc' }>): void
  /** Thay cách tạo luồng thợ / đường dẫn wasm (bài đo). */
  taoTho?(): Worker
  wasm?: string
}
const KHOA_KET = 'ddh.live.ghi-ket'
const datCoKet = (ket: number): void => { try { if (ket > 0) localStorage.setItem(KHOA_KET, '1'); else localStorage.removeItem(KHOA_KET) } catch { /* đầy / chặn */ } }
const taoThoMacDinh = (): Worker => new Worker(new URL('./may-ghi-tho.ts', import.meta.url), { type: 'module' })
const duongWasm = (o?: string): string => new URL(o ?? wasmUrl, location.href).href
/** Mã phiên máy ghi: xếp được theo thời gian, chỉ chữ thường + số. */
const phienMoi = (): string => { const p = Date.now().toString(36); return PHIEN_GHI.test(p) ? p : 'p' }

/** Bộ gom mẫu chạy trong AudioWorklet (chuỗi mã ⇒ Blob: không cần tệp riêng, không phụ thuộc bộ đóng gói). Mỗi ≥ 50 ms gửi một lô kèm số mẫu đã đếm + giờ máy. */
const MA_GOM = `class DdhGom extends AudioWorkletProcessor{constructor(){super();this.b=new Float32Array(9600);this.n=0;this.f=0;this.c=null;this.port.onmessage=(e)=>{if(e.data&&e.data.cong)this.c=e.data.cong}}
process(i){const k=i[0]&&i[0][0],L=k?k.length:128;if(this.n+L>this.b.length)this.xa();if(k)this.b.set(k,this.n);else this.b.fill(0,this.n,this.n+L);this.n+=L;if(this.n>=sampleRate/20)this.xa();return true}
xa(){if(!this.n)return;const m=this.b.slice(0,this.n);(this.c||this.port).postMessage({b:m,f:this.f,luc:Date.now()},[m.buffer]);this.f+=this.n;this.n=0}}
registerProcessor('ddh-gom',DdhGom)`

export function taoMayGhi(o: TuyChonMayGhi) {
  const phien = phienMoi()
  let tt: TrangThaiMayGhi = 'tat', ket = 0, lyDo = '', daDung = false
  let tho: Worker | null = null, ctx: AudioContext | null = null, tron: GainNode | null = null
  let nguonMic: { s: MediaStream; n: MediaStreamAudioSourceNode } | null = null, nguonEm: { s: MediaStream; n: MediaStreamAudioSourceNode } | null = null
  let henSoat: ReturnType<typeof setInterval> | null = null, henNhip: ReturnType<typeof setInterval> | null = null
  let khiXong: ((ket: number) => void) | null = null
  const so = { khuc: 0, daTai: 0, byte: 0, hz: 0 }
  /** Mốc nét tới trước khi luồng thợ sẵn sàng (chuỗi âm thanh dựng mất vài chục ms) — giữ rồi gửi bù. */
  let netCho: [string, number][] = []

  const baoPhong = (them: Record<string, unknown> = {}): void => { try { o.gui({ t: 'live-ghi', tt, dh: Date.now(), p: phien, ...them }) } catch { /* kênh rớt */ } }
  const dat = (moi: TrangThaiMayGhi, k = ket, ly = ''): void => {
    const doi = moi !== tt
    tt = moi; ket = k; lyDo = ly
    datCoKet(k)
    if (doi) baoPhong()
    try { o.khiTrangThai?.(tt, { ket, ...(lyDo ? { lyDo } : {}) }) } catch { /* nơi nghe lỗi */ }
  }
  const gui = (t: TinVaoTho, chuyen: Transferable[] = []): void => { try { tho?.postMessage(t, chuyen) } catch { /* thợ đã đóng */ } }

  function noi(cu: { s: MediaStream; n: MediaStreamAudioSourceNode } | null, s: MediaStream | null): { s: MediaStream; n: MediaStreamAudioSourceNode } | null {
    if (cu && cu.s === s && s?.active) return cu
    try { cu?.n.disconnect() } catch { /* chưa nối */ }
    if (!s || !ctx || !tron || !s.getAudioTracks().length) return null
    try { const n = ctx.createMediaStreamSource(s); n.connect(tron); return { s, n } } catch { return null }
  }
  /** Dựng chuỗi âm thanh khi lần đầu có luồng tiếng (live không tiếng ⇒ không dựng: phòng vẫn ghi nét + sự kiện). */
  async function dungChuoi(): Promise<void> {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx || typeof AudioWorkletNode === 'undefined' || typeof Worker === 'undefined') throw new Error('khong-ho-tro')
    const c = new Ctx({ latencyHint: 'interactive' })
    ctx = c
    void c.resume().catch(() => undefined)
    const url = URL.createObjectURL(new Blob([MA_GOM], { type: 'text/javascript' }))
    try { await c.audioWorklet.addModule(url) } finally { URL.revokeObjectURL(url) }
    if (daDung) return
    const gom = new AudioWorkletNode(c, 'ddh-gom', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1, channelCountMode: 'explicit', channelInterpretation: 'speakers' })
    tron = c.createGain()
    tron.connect(gom)
    // Nối ra loa qua một nút tắt tiếng để chuỗi luôn được trình duyệt kéo (không phát gì ra loa).
    const cam = c.createGain(); cam.gain.value = 0
    gom.connect(cam); cam.connect(c.destination)
    const kenh = new MessageChannel()
    gom.port.postMessage({ cong: kenh.port1 }, [kenh.port1])
    tho = (o.taoTho ?? taoThoMacDinh)()
    tho.onmessage = (e: MessageEvent<TinRaTho>) => {
      const m = e.data
      if (m.l === 'tt') { if (!daDung) dat(m.tt, m.ket, m.lyDo ?? '') ; else { ket = m.ket; datCoKet(m.ket) } }
      else if (m.l === 'khuc') { if (m.ok) so.daTai += 1; else { so.khuc += 1; so.byte += m.byte; baoPhong() } try { o.khiKhuc?.(m) } catch { /* nơi nghe lỗi */ } }
      else if (m.l === 'xong') { ket = m.ket; datCoKet(m.ket); khiXong?.(m.ket) }
    }
    tho.onerror = () => { if (!daDung) dat('loi', ket, 'tho') }
    so.hz = c.sampleRate
    gui({ l: 'mo', goc: o.goc, ve: o.ve, buoi: o.buoi, phien, hz: c.sampleRate, wasm: duongWasm(o.wasm), cong: kenh.port2 }, [kenh.port2])
    for (const [id, t] of netCho) gui({ l: 'net', id, t })
    netCho = []
  }
  let dangDung: Promise<void> | null = null
  function soat(): void {
    if (daDung) return
    let l: LuongGhi
    try { l = o.layLuong() } catch { l = { mic: null, em: null } }
    if (!ctx && !dangDung && (l.mic || l.em)) dangDung = dungChuoi().catch((e) => { dat('loi', ket, e instanceof Error ? e.message : 'am-thanh') })
    if (ctx && tron) {
      nguonMic = noi(nguonMic, l.mic); nguonEm = noi(nguonEm, l.em)
      if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined)
    }
  }

  // Bắt đầu NGAY: báo phòng đang ghi (nét + sự kiện do phòng ghi), rồi dựng chuỗi tiếng khi có mic.
  dat('dang-ghi')
  soat()
  henSoat = setInterval(soat, 1000)
  henNhip = setInterval(() => { if (!daDung) baoPhong() }, 10_000)

  return {
    phien,
    trangThai: (): { tt: TrangThaiMayGhi; ket: number; lyDo: string } => ({ tt, ket, lyDo }),
    soDo: () => ({ ...so }),
    /** Mốc giờ BẮT ĐẦU một nét (giờ máy thầy, `Date.now()`). */
    danhDau(id: string, t: number): void { if (tho) gui({ l: 'net', id, t }); else if (netCho.length < 200) netCho.push([id, t]) },
    /** Live tắt: xả khúc cuối, tải lên, báo phòng «xong» để phòng chốt ngay. Khúc còn kẹt ⇒ thợ sống tiếp để tải bù. */
    async dung(): Promise<void> {
      if (daDung) return
      daDung = true
      if (henSoat) clearInterval(henSoat); if (henNhip) clearInterval(henNhip)
      let conKet = 0
      if (tho) {
        conKet = await new Promise<number>((xong) => { const h = setTimeout(() => xong(ket), 8000); khiXong = (k) => { clearTimeout(h); xong(k) }; gui({ l: 'dong' }) })
        khiXong = null
        if (!conKet) { try { tho.terminate() } catch { /* đã đóng */ } tho = null }
      }
      try { nguonMic?.n.disconnect(); nguonEm?.n.disconnect() } catch { /* chưa nối */ }
      void ctx?.close().catch(() => undefined)
      ctx = null; tron = null
      tt = 'tat'
      baoPhong({ xong: true, ket: conKet })
      try { o.khiTrangThai?.('tat', { ket: conKet }) } catch { /* nơi nghe lỗi */ }
    },
  }
}
export type MayGhi = ReturnType<typeof taoMayGhi>

// ── Mối nối với phần live của máy thầy (thay-noi.ts) ──
let may: MayGhi | null = null
/** Gọi mỗi lần trạng thái live của máy thầy đổi. Máy này đang giữ live + phòng bật Xem lại Live ⇒ tự ghi; live tắt ⇒ tự dừng. Không ném lỗi. */
export function soatMayGhi(o: { layLuong: (() => LuongGhi) | null; pha: string | undefined; live: ViewLiveBang | null | undefined; phong: { ve: string; goc: string } | null; buoiId: string | undefined; gui(tin: Record<string, unknown>): void }): void {
  try {
    const dangLive = o.pha === 'live' && !!o.live?.bat
    if (!may && dangLive && o.live?.ghi !== undefined && o.layLuong && o.phong && o.buoiId) {
      may = taoMayGhi({ goc: o.phong.goc, ve: o.phong.ve, buoi: o.buoiId, layLuong: o.layLuong, gui: o.gui })
    } else if (may && !dangLive) { const m = may; may = null; void m.dung().catch(() => undefined) }
  } catch { /* lỗi ghi không chặn live */ }
}
/** Sự kiện bút của tờ chiếu: nét MỚI bắt đầu ⇒ đánh mốc giờ (điểm đầu chạm bảng = bây giờ trừ tuổi của điểm cuối đã có). */
export function danhDauNet(sk: SuKienBut): void {
  if (!may || sk.loai !== 'net-moi' || sk.xong) return
  const d = sk.net.diem
  may.danhDau(sk.net.id, Date.now() - (d.length ? Math.max(0, d[d.length - 1]![3]) : 0))
}
/** Có khúc kẹt từ lần live trước (≤ 24 giờ) ⇒ mở một luồng thợ chỉ để tải bù rồi tự đóng. Gọi khi tờ chiếu / Lịch sử Live mở. */
export function taiBuKhucKet(taoTho: () => Worker = taoThoMacDinh): void {
  try {
    if (may || localStorage.getItem(KHOA_KET) !== '1' || typeof Worker === 'undefined') return
    const tho = taoTho()
    const dong = (): void => { try { tho.terminate() } catch { /* đã đóng */ } }
    const h = setTimeout(dong, 120_000)
    tho.onmessage = (e: MessageEvent<TinRaTho>) => { if (e.data.l === 'xong') { datCoKet(e.data.ket); clearTimeout(h); dong() } }
    tho.postMessage({ l: 'bu' } satisfies TinVaoTho)
  } catch { /* không có gì để tải */ }
}
/** Cho test: gỡ máy ghi đang chạy. */
export function _datLaiMayGhi(): void { const m = may; may = null; void m?.dung().catch(() => undefined) }
