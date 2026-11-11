// LIVE — MIC CỦA THẦY (11/11, thầy test máy thật: «không nhận mic ngoài, chỉnh tiếng trong và cực rõ»; mic gắn sẵn thì nghe được, mic USB cài áo thì luồng câm dù
// Windows thấy tín hiệu). Thư viện THẬT `taoLiveThay` chạy trên trình duyệt GIẢ: `getUserMedia` (kịch bản tín hiệu theo ràng buộc), đồ thị Web Audio (mức âm
// truyền qua các nút), RTCPeerConnection + bộ gửi (ghi lại track đang gửi), cửa SFU.
// Khoá từng đường của M1 / M2:
//   (c) track ĐANG GỬI luôn là tiếng mic: lúc bật live, mở cửa sổ nút Live lúc đang live (lỗi cũ: dừng luôn track đang gửi), đổi mic, tạm dừng → tiếp tục, rút → cắm lại;
//   (a) mic câm: tự nới ràng buộc tới khi có tín hiệu; hết cách ⇒ báo `im` và vẫn thử lại; `track.muted` ⇒ `bi-tat`; không kết luận ngay «lỗi thiết bị»;
//   (b) AudioContext treo: vạch + «mic đang im» dùng số đo của bộ gửi; gửi thẳng track mic; chạy lại ⇒ quay về chuỗi làm rõ tiếng;
//   (d) ô chọn mic; (M2) luật khử vọng / lọc ồn theo đường vọng, Opus 64 kb/s dải rộng, chuỗi làm rõ tiếng có đường lui.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoLiveThay, type TrangThaiLiveThay } from '../src/lib/live'
import { OPUS_EM, OPUS_THAY, docSoGui, suaSdpOpus } from '../src/lib/live/sfu'
import { taoPhong, viewBang, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { datCoLive, liveBat, liveDat, liveSan, liveTat } from '../src/lib/bpu/phong-live'

// ── Trình duyệt giả ──
type Rb = { deviceId?: { exact?: string; ideal?: string }; echoCancellation?: boolean; noiseSuppression?: boolean; autoGainControl?: boolean; channelCount?: number }
class TrackGia {
  kind = 'audio'; readyState: 'live' | 'ended' = 'live'; muted = false; enabled = true; contentHint = ''; thietBi = ''
  onmute: (() => void) | null = null; onunmute: (() => void) | null = null; onended: (() => void) | null = null
  constructor(public label: string, public rb: Rb = {}, public tinHieu: () => number = () => 0.2) {}
  stop() { this.readyState = 'ended' }
  getSettings() { return { sampleRate: 48000, channelCount: 2, echoCancellation: !!this.rb.echoCancellation, noiseSuppression: !!this.rb.noiseSuppression, autoGainControl: !!this.rb.autoGainControl, deviceId: this.rb.deviceId?.exact ?? 'default' } }
  /** Mức tín hiệu thật ra khỏi track lúc này. */
  ra(): number { return this.readyState === 'live' && this.enabled && !this.muted ? this.tinHieu() : 0 }
}
class LuongGia { constructor(public ds: TrackGia[]) {} getAudioTracks() { return this.ds } getTracks() { return this.ds } }
class NutGia {
  vao: NutGia[] = []; fftSize = 0; channelCount = 2; channelCountMode = ''; channelInterpretation = ''; type = ''
  frequency = { value: 0 }; Q = { value: 0 }; threshold = { value: 0 }; knee = { value: 0 }; ratio = { value: 0 }; attack = { value: 0 }; release = { value: 0 }; gain = { value: 1 }
  stream: LuongGia | null = null; hong = false
  constructor(public nguon: LuongGia | null = null) {}
  connect(d: NutGia) { d.vao.push(this) } disconnect() { /* gỡ */ } start() { /* dao động */ }
  /** Mức tín hiệu đi qua nút (đồ thị giả chỉ kiểm ĐƯỜNG ĐI của tiếng, không mô phỏng hệ số khuếch đại / nén). */
  muc(): number { return this.hong ? 0 : this.nguon ? Math.max(0, ...this.nguon.ds.map((t) => t.ra())) : Math.max(0, ...this.vao.map((n) => n.muc())) }
  getFloatTimeDomainData(m: Float32Array) { m.fill(ctx.state === 'running' ? this.muc() : 0) }
}
const ctx = { state: 'running' as 'running' | 'suspended', onstatechange: null as (() => void) | null, soNen: [] as NutGia[] }
class CtxGia {
  get state() { return ctx.state }
  set onstatechange(f: (() => void) | null) { ctx.onstatechange = f } get onstatechange() { return ctx.onstatechange }
  resume() { return Promise.resolve() } close() { return Promise.resolve() }
  createMediaStreamSource(l: LuongGia) { return new NutGia(l) }
  createAnalyser() { return new NutGia() } createGain() { return new NutGia() } createChannelSplitter() { return new NutGia() } createBiquadFilter() { return new NutGia() }
  createDynamicsCompressor() { const n = new NutGia(); ctx.soNen.push(n); return n } createOscillator() { return new NutGia() }
  createMediaStreamDestination() { const n = new NutGia(); const t = new TrackGia('chuoi'); t.tinHieu = () => n.muc(); n.stream = new LuongGia([t]); return n }
}
class BoGuiGia {
  lichSu: (TrackGia | null)[] = []; thamSo: unknown = null; byte = 0; dau: TrackGia | null
  constructor(public track: TrackGia | null) { this.dau = track }
  async replaceTrack(t: TrackGia | null) { this.track = t; this.lichSu.push(t) }
  getParameters() { return { encodings: [{}] } } async setParameters(p: unknown) { this.thamSo = p }
  async getStats() { this.byte += 8000; return new Map<string, unknown>([['ms', { type: 'media-source', kind: 'audio', audioLevel: this.track ? this.track.ra() : 0, totalAudioEnergy: 1 }], ['out', { type: 'outbound-rtp', kind: 'audio', bytesSent: this.byte, packetsSent: 50 }]]) }
}
const SDP = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n'
class PcGia extends EventTarget {
  static ds: PcGia[] = []
  boGui: BoGuiGia | null = null; iceGatheringState = 'complete'; connectionState = 'connected'; localDescription: { sdp: string } | null = null; xa = ''
  constructor() { super(); PcGia.ds.push(this) }
  addTransceiver(t: TrackGia | string) { this.boGui = new BoGuiGia(typeof t === 'string' ? null : t); return { mid: '0', sender: this.boGui } }
  createDataChannel() { const k = Object.assign(new EventTarget(), { readyState: 'open', binaryType: '', send() {}, close() {} }); return k }
  async createOffer() { return { type: 'offer', sdp: SDP } }
  async setLocalDescription(d: { sdp: string }) { this.localDescription = d } async setRemoteDescription(d: { sdp: string }) { this.xa = d.sdp }
  async getStats() { return new Map() } close() { this.connectionState = 'closed' }
}

/** Kịch bản thiết bị: `id` thiết bị → hàm (ràng buộc) ⇒ mức tín hiệu; ném tên lỗi để giả lỗi mở. */
let thietBi: Record<string, (rb: Rb) => number | Error> = {}
const goiGum: Rb[] = []
const moi: TrackGia[] = []
let ngheThietBi: (() => void) | null = null

function dungTrinhDuyet() {
  PcGia.ds = []; goiGum.length = 0; moi.length = 0; ctx.state = 'running'; ctx.onstatechange = null; ctx.soNen = []; ngheThietBi = null
  thietBi = { default: () => 0.2 }
  vi.stubGlobal('AudioContext', CtxGia)
  ;(window as unknown as { AudioContext: unknown }).AudioContext = CtxGia
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
    getUserMedia: async (c: { audio: Rb }) => {
      const rb = c.audio; goiGum.push(rb)
      const id = rb.deviceId?.exact ?? (rb.deviceId?.ideal && thietBi[rb.deviceId.ideal] ? rb.deviceId.ideal : 'default')
      const tb = thietBi[id]
      if (!tb) throw Object.assign(new Error('không có'), { name: 'OverconstrainedError' })
      const kq = tb(rb)
      if (kq instanceof Error) throw kq
      // CHROMIUM THẬT (đo 11/11): thiết bị còn một luồng đang mở ⇒ lần mở mới nhận lại ĐÚNG cấu hình xử lý của luồng ấy, bất kể ràng buộc mới.
      const dangMo = moi.filter((x) => x.readyState === 'live' && x.thietBi === id)[0]
      const ap: Rb = dangMo ? { ...rb, echoCancellation: dangMo.rb.echoCancellation, noiseSuppression: dangMo.rb.noiseSuppression, autoGainControl: dangMo.rb.autoGainControl } : rb
      const t = new TrackGia(id === 'default' ? 'Micro máy tính' : `Microphone (${id})`, ap, () => { const v = thietBi[id]?.(ap); return typeof v === 'number' ? v : 0 })
      t.thietBi = id
      moi.push(t)
      return new LuongGia([t])
    },
    enumerateDevices: async () => [{ kind: 'audioinput', deviceId: 'default', label: 'Default - Microphone (BOYALINK)' }, { kind: 'audioinput', deviceId: 'communications', label: 'Communications - Microphone (BOYALINK)' }, { kind: 'audioinput', deviceId: 'usb1', label: 'Microphone (BOYALINK)' }, { kind: 'audiooutput', deviceId: 'loa', label: 'Loa' }],
    addEventListener: (_: string, f: () => void) => { ngheThietBi = f },
  } })
}
const T0 = 1_700_000_000_000
function dung(tuy: { loc?: 'tu' | 'bat' | 'tat' } = {}) {
  const st: TrangThaiPhong = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Em Một', coMat: true, luc: T0 }] })
  datCoLive(st, { cho: true, sfu: true }, T0)
  const tin: Record<string, unknown>[] = [], tt: TrangThaiLiveThay[] = []
  let thietBiDoi = 0
  const lt = taoLiveThay({
    ve: 've-gv', goc: 'https://may-chu.example', loc: tuy.loc, khiThietBi: () => { thietBiDoi += 1 },
    kenh: { gui: (t) => { tin.push(t); if (t.t === 'live-bat') liveBat(st, T0 + 1); if (t.t === 'live-tat') liveTat(st, T0 + 3); if (t.t === 'live-san') liveSan(st, { san: t.san !== false, ss: t.ss }, T0); if (t.t === 'live-dat') liveDat(st, t as never, T0 + 2); if (t.t === 'live-bat' || t.t === 'live-dat') lt.nhanTinPhong(viewBang(st)) }, guiNhiPhan: () => {} },
    khiTrangThai: (t) => tt.push(t),
    moiTruong: { taoPc: () => new PcGia() as unknown as RTCPeerConnection, fetch: (async (u: string) => new Response(JSON.stringify(String(u).endsWith('/noi') ? { ok: true, phien: 'p'.repeat(16), sdp: SDP } : { ok: true, id: 1 }))) as never },
  })
  lt.nhanTinPhong(viewBang(st))
  const boGui = () => PcGia.ds[PcGia.ds.length - 1]!.boGui!
  return { st, lt, tin, tt, boGui, bao: () => lt.nhanTinPhong(viewBang(st)), thietBiDoi: () => thietBiDoi }
}
const troi = (ms: number) => vi.advanceTimersByTimeAsync(ms)
/** Track đang gửi mang tiếng của mic `t` (trực tiếp, hoặc qua chuỗi làm rõ tiếng dựng trên luồng của nó). */
const mucGui = (b: ReturnType<typeof dung>) => b.boGui().track?.ra() ?? 0

beforeEach(() => { vi.useFakeTimers({ now: T0 }); dungTrinhDuyet() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('M1c · track ĐANG GỬI luôn là tiếng mic', () => {
  it('bật live ⇒ bộ gửi cầm tiếng mic (qua chuỗi làm rõ tiếng), không phải track câm giữ chỗ', async () => {
    const b = dung()
    expect((await b.lt.bat({})).ok).toBe(true)
    expect(b.lt.trangThai()).toMatchObject({ pha: 'live', tieng: 'mic', micTinh: 'tot', micTen: 'Micro máy tính' })
    expect(b.boGui().track).not.toBe(b.boGui().dau)
    expect(b.boGui().track).toBe(b.lt.trackGui())
    expect(mucGui(b)).toBeCloseTo(0.2)
    expect(b.lt.chanDoan()).toMatchObject({ gan: true, sfu: true, track: 'live', chuoi: true, hz: 48000, kenh: 2, bac: 0 })
  })
  it('LỖI CŨ: mở cửa sổ nút Live lúc đang live (mở lại mic) làm dừng track đang gửi ⇒ nay giữ nguyên luồng, không gọi `getUserMedia` lần nữa, lớp vẫn nghe', async () => {
    const b = dung()
    await b.lt.bat({})
    const truoc = b.boGui().track, soGoi = goiGum.length
    expect((await b.lt.moMic(null, { giu: true })).ok).toBe(true)
    expect(goiGum.length).toBe(soGoi)
    expect(b.boGui().track).toBe(truoc)
    expect(moi[0]!.readyState).toBe('live')
    expect(mucGui(b)).toBeCloseTo(0.2)
  })
  it('đổi mic lúc đang live ⇒ luồng mới gắn NGAY vào bộ gửi rồi mới dừng luồng cũ; vạch đo theo mic mới', async () => {
    thietBi.usb1 = () => 0.5
    const b = dung()
    await b.lt.bat({})
    expect((await b.lt.moMic('usb1')).ok).toBe(true)
    expect(b.lt.trangThai().micTen).toBe('Microphone (usb1)')
    expect(mucGui(b)).toBeCloseTo(0.5)
    expect(moi[0]!.readyState).toBe('ended') // luồng cũ đã thả
    expect(b.boGui().track!.readyState).toBe('live')
    expect(b.lt.mucAm()).toBeGreaterThan(0.9) // 0,5 × 4 kẹp 1
  })
  it('tạm dừng ⇒ lớp không nghe (mức gửi 0) mà bộ gửi vẫn cầm tiếng mic; tiếp tục ⇒ có tiếng lại ngay, không mở lại mic', async () => {
    const b = dung()
    await b.lt.bat({})
    const track = b.boGui().track, soGoi = goiGum.length
    b.lt.tamDung(true)
    expect(b.lt.trangThai()).toMatchObject({ nghi: true, micTat: true })
    expect(mucGui(b)).toBe(0)
    await troi(4000)
    expect(b.lt.trangThai().micTinh).toBe('tot') // đang dừng thì mức 0 KHÔNG bị coi là mic câm
    b.lt.tamDung(false)
    expect(b.lt.trangThai()).toMatchObject({ nghi: false, micTat: false })
    expect(b.boGui().track).toBe(track)
    expect(goiGum.length).toBe(soGoi)
    expect(mucGui(b)).toBeCloseTo(0.2)
  })
  it('mic bị rút lúc đang live ⇒ `mat`; cắm lại ⇒ tự mở và gắn lại; mic đã chọn không còn ⇒ rơi về mic mặc định của máy', async () => {
    thietBi.usb1 = () => 0.4
    const b = dung()
    await b.lt.bat({ mic: 'usb1' })
    const t = moi[moi.length - 1]!
    delete thietBi.usb1
    t.readyState = 'ended'; t.onended?.()
    expect(b.lt.trangThai().micTinh).toBe('mat')
    await troi(1000)
    expect(b.lt.trangThai()).toMatchObject({ micTinh: 'tot', micTen: 'Micro máy tính' })
    expect(mucGui(b)).toBeCloseTo(0.2)
    ngheThietBi?.()
    expect(b.thietBiDoi()).toBe(1) // danh sách mic đổi ⇒ lớp giao diện đọc lại
  })
  it('kết thúc live ⇒ bộ gửi về track câm, mic thả (đèn mic tắt); bật lại ⇒ lại cầm mic', async () => {
    const b = dung()
    await b.lt.bat({})
    b.lt.tat()
    await troi(0)
    expect(b.boGui().track).toBe(b.boGui().dau) // track câm giữ chỗ lúc nối sẵn
    expect(mucGui(b)).toBe(0)
    expect(moi[0]!.readyState).toBe('ended')
    b.bao()
    expect((await b.lt.bat({})).ok).toBe(true)
    expect(b.boGui().track).not.toBe(b.boGui().dau)
    expect(mucGui(b)).toBeCloseTo(0.2)
  })
})

describe('M1a · mic câm: tự nới ràng buộc tới khi có tín hiệu, báo rõ, không dừng lại ở «lỗi»', () => {
  it('mic USB câm khi trình duyệt bật xử lý tiếng ⇒ 1,5 giây sau tự mở lại với khử vọng + lọc ồn TẮT ⇒ có tín hiệu, gắn vào bộ gửi', async () => {
    thietBi.usb1 = (rb) => (rb.echoCancellation || rb.noiseSuppression ? 0 : 0.3)
    const b = dung({ loc: 'bat' }) // thầy đang để «Luôn bật» lọc
    await b.lt.bat({ mic: 'usb1' })
    expect(goiGum[goiGum.length - 1]).toMatchObject({ deviceId: { exact: 'usb1' }, echoCancellation: true, noiseSuppression: true, autoGainControl: true })
    expect(mucGui(b)).toBe(0)
    await troi(1800)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ deviceId: { exact: 'usb1' }, echoCancellation: false, noiseSuppression: false, autoGainControl: true })
    expect(goiGum[goiGum.length - 1]).not.toHaveProperty('channelCount') // không ép một kênh
    expect(b.lt.trangThai()).toMatchObject({ micTinh: 'tot', loc: false })
    expect(mucGui(b)).toBeCloseTo(0.3)
    expect(b.lt.chanDoan()).toMatchObject({ bac: 1, vong: false, on: false, agc: true, gan: true })
    await troi(6000)
    expect(b.lt.trangThai().micTinh).toBe('tot')
  })
  it('chỉ mic THÔ mới có tín hiệu ⇒ nới tới bậc tắt cả tự chỉnh âm lượng; mục đích danh câm hẳn ⇒ bậc cuối để thiết bị là «ưu tiên» và lấy được mic có tiếng', async () => {
    thietBi.usb1 = (rb) => (rb.autoGainControl ? 0 : 0.25)
    const b = dung()
    await b.lt.bat({ mic: 'usb1' })
    await troi(1800); await troi(1800)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: false })
    expect(b.lt.trangThai().micTinh).toBe('tot')
    expect(mucGui(b)).toBeCloseTo(0.25)
    // thiết bị đích danh câm ở mọi cấu hình
    thietBi.usb1 = () => 0
    await b.lt.moMic('usb1')
    await troi(1800); await troi(1800); await troi(1800)
    expect(goiGum[goiGum.length - 1]!.deviceId).toEqual({ ideal: 'usb1' })
  })
  it('câm ở MỌI cách mở ⇒ `im` (cửa sổ báo rõ) nhưng cứ 8 giây thử lại cả vòng; thiết bị có tiếng trở lại ⇒ tự về `tot` và lớp nghe được', async () => {
    let coTieng = false
    thietBi.default = () => (coTieng ? 0.2 : 0)
    const b = dung()
    await b.lt.bat({})
    for (let i = 0; i < 4; i++) await troi(1800)
    expect(b.lt.trangThai().micTinh).toBe('im')
    const soGoi = goiGum.length
    await troi(9000)
    expect(goiGum.length).toBeGreaterThan(soGoi) // vẫn tự thử lại
    expect(b.lt.trangThai().micTinh).toBe('im')
    coTieng = true
    await troi(2500)
    expect(b.lt.trangThai().micTinh).toBe('tot')
    expect(mucGui(b)).toBeCloseTo(0.2)
  })
  it('bộ thu có CỔNG ỒN: đã có tín hiệu rồi ra số 0 tuyệt đối khi thầy ngừng nói ⇒ KHÔNG nới bậc, không báo `im` (không phải lỗi); im liền 20 giây mới mở lại ĐÚNG bậc đang chạy; im 60 giây mới báo `im`; nói lại ⇒ `tot`', async () => {
    let noi = true
    thietBi.usb1 = () => (noi ? 0.3 : 0)
    const b = dung()
    await b.lt.bat({ mic: 'usb1' })
    await troi(2000)
    expect(b.lt.chanDoan()).toMatchObject({ bac: 0, agc: true })
    noi = false
    const soGoi = goiGum.length
    await troi(15000)
    expect(goiGum.length).toBe(soGoi) // 15 giây im: chưa đụng gì
    expect(b.lt.trangThai().micTinh).toBe('tot')
    await troi(8000)
    expect(goiGum.length).toBe(soGoi + 1) // im liền 20 giây: mở lại, vẫn bậc 0 (giữ tự chỉnh âm lượng)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ deviceId: { exact: 'usb1' }, autoGainControl: true })
    expect(b.lt.chanDoan().bac).toBe(0)
    expect(b.lt.trangThai().micTinh).toBe('tot')
    await troi(45000)
    expect(b.lt.trangThai().micTinh).toBe('im')
    expect(b.lt.chanDoan().bac).toBe(0)
    noi = true
    await troi(1000)
    expect(b.lt.trangThai().micTinh).toBe('tot')
    expect(mucGui(b)).toBeCloseTo(0.3)
  })
  it('không xin lọc thì bậc 0 trùng bậc 1 ⇒ mic câm nhảy thẳng sang mic thô (bớt 1,5 giây chờ)', async () => {
    thietBi.usb1 = (rb) => (rb.autoGainControl ? 0 : 0.25)
    const b = dung()
    await b.lt.bat({ mic: 'usb1' })
    await troi(1800)
    expect(goiGum.length).toBe(2)
    expect(goiGum[1]).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: false })
    expect(b.lt.trangThai().micTinh).toBe('tot')
  })
  it('bậc đã bị nới vì mic câm: luật tự động KHÔNG xin lọc lại lần hai (không lặp vòng mở mic); thầy BẤM «Bật» ⇒ thử lại từ bậc 0 với khử vọng + lọc ồn', async () => {
    let hong = true
    thietBi.usb1 = (rb) => (hong && rb.echoCancellation ? 0 : 0.3)
    const b = dung()
    await b.lt.bat({ mic: 'usb1' })
    b.lt.dat({ tiengLop: true }) // có đường vọng ⇒ tự xin lọc
    await troi(50)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: true })
    await troi(1800) // lọc làm mic câm ⇒ nới bậc
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: false })
    expect(b.lt.chanDoan()).toMatchObject({ bac: 1, vong: false })
    const soGoi = goiGum.length
    b.bao(); b.bao(); await troi(5000)
    expect(goiGum.length).toBe(soGoi) // tin phòng tới liên tục cũng không mở lại
    hong = false
    b.lt.datLoc('bat'); await troi(50)
    expect(goiGum.length).toBe(soGoi + 1)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ deviceId: { exact: 'usb1' }, echoCancellation: true, noiseSuppression: true, autoGainControl: true })
    await troi(3000)
    expect(b.lt.chanDoan()).toMatchObject({ bac: 0, vong: true, on: true })
    expect(b.lt.trangThai()).toMatchObject({ micTinh: 'tot', loc: true })
    expect(mucGui(b)).toBeCloseTo(0.3)
  })
  it('MÁY THẬT 11/11: mục «Default - Microphone (BOYALINK)» ra luồng câm, mục đích danh của chính mic ấy có tín hiệu ⇒ thầy để «Mặc định của máy» thì tự mở THẲNG thiết bị thật trùng nhãn, lớp nghe được; dòng chẩn đoán nói rõ', async () => {
    thietBi.default = () => 0
    thietBi.usb1 = () => 0.3
    const b = dung()
    await b.lt.bat({})
    expect(goiGum[0]).not.toHaveProperty('deviceId')
    expect(mucGui(b)).toBe(0)
    await troi(1800)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ deviceId: { exact: 'usb1' }, echoCancellation: false, noiseSuppression: false, autoGainControl: true }) // chưa phải nới bậc nào
    expect(moi[0]!.readyState).toBe('ended') // luồng mặc định câm đã thả
    expect(b.lt.trangThai()).toMatchObject({ micTinh: 'tot', micTen: 'Microphone (usb1)' })
    expect(mucGui(b)).toBeCloseTo(0.3)
    expect(b.lt.chanDoan()).toMatchObject({ the: true, bac: 0, gan: true })
    await troi(10_000)
    expect(goiGum.length).toBe(2) // đã có tín hiệu ⇒ không mở lại nữa
    // thầy tự chọn lại «Mặc định của máy» ⇒ thử lại mục mặc định từ đầu
    thietBi.default = () => 0.2
    await b.lt.moMic('')
    await troi(1800)
    expect(b.lt.chanDoan().the).toBe(false)
    expect(mucGui(b)).toBeCloseTo(0.2)
  })
  it('`track.muted` (nút tắt tiếng của mic / hệ điều hành) ⇒ `bi-tat`; hết tắt ⇒ `tot`', async () => {
    const b = dung()
    await b.lt.bat({})
    const t = moi[0]!
    t.muted = true; t.onmute?.()
    expect(b.lt.trangThai().micTinh).toBe('bi-tat')
    expect(b.lt.chanDoan().track).toBe('muted')
    t.muted = false; t.onunmute?.()
    expect(b.lt.trangThai().micTinh).toBe('tot')
  })
  it('trình duyệt không cấp quyền ⇒ `mic-tu-choi`; không có mic nào ⇒ `khong-mic` (không im lặng)', async () => {
    thietBi.default = () => Object.assign(new Error('từ chối'), { name: 'NotAllowedError' })
    const b = dung()
    expect(await b.lt.moMic(null)).toEqual({ ok: false, lyDo: 'mic-tu-choi' })
    thietBi = {}
    expect(await b.lt.moMic(null)).toEqual({ ok: false, lyDo: 'khong-mic' })
  })
})

describe('M1b · AudioContext treo: vạch và «mic đang im» không còn nói sai, tiếng vẫn đi', () => {
  it('bộ đo treo ⇒ gửi THẲNG track mic; vạch lấy mức âm của bộ gửi; không báo «mic đang im»; vẫn gửi nhịp `live-nhip`', async () => {
    ctx.state = 'suspended'
    const b = dung()
    await b.lt.bat({})
    expect(b.boGui().track).toBe(moi[0]) // không qua chuỗi (chuỗi không chạy khi bộ xử lý treo)
    expect(mucGui(b)).toBeCloseTo(0.2)
    await troi(31_000)
    expect(b.lt.mucAm()).toBeGreaterThan(0.5)
    expect(b.lt.trangThai().micIm).toBe(false)
    expect(b.tin.some((t) => t.t === 'live-nhip')).toBe(true)
    expect(b.lt.chanDoan()).toMatchObject({ ctx: 'suspended', chuoi: false, muc: null, gan: true })
    expect(b.lt.chanDoan().mucGui).toBeGreaterThan(0.5)
    expect(b.lt.chanDoan().kbps).toBeGreaterThan(0)
    // bộ xử lý chạy lại (thầy chạm vào app) ⇒ quay về chuỗi làm rõ tiếng
    ctx.state = 'running'; ctx.onstatechange?.()
    await troi(0)
    expect(b.boGui().track!.label).toBe('chuoi')
    expect(mucGui(b)).toBeCloseTo(0.2)
  })
  it('ĐANG LIVE: vạch mic = tiếng ĐANG GỬI (số đo của bộ gửi), không phải luồng đo tại chỗ — máy thầy có tín hiệu mà chưa nối máy chủ tiếng ⇒ vạch đứng 0 (không báo «có tiếng» giả)', async () => {
    const b = dung()
    await b.lt.moMic()
    expect(b.lt.mucAm()).toBeGreaterThan(0.5) // chưa live: tiếng thầy nói thử (đo tại chỗ)
    await b.lt.bat({})
    await troi(2000)
    expect(b.lt.mucAm()).toBeGreaterThan(0.5)
    PcGia.ds[PcGia.ds.length - 1]!.connectionState = 'disconnected'
    await troi(500)
    expect(b.lt.mucAm()).toBe(0)
    expect(b.lt.chanDoan()).toMatchObject({ sfu: false })
    expect(b.lt.chanDoan().muc).toBeGreaterThan(0.5) // tại mic vẫn có tín hiệu — chính là ca «vạch chạy mà em không nghe»
    PcGia.ds[PcGia.ds.length - 1]!.connectionState = 'connected'
    // bộ gửi cầm track khác (câm) ⇒ vạch theo bộ gửi
    const gui = b.boGui(), that = gui.track
    gui.track = new TrackGia('câm', {}, () => 0)
    await troi(500); b.lt.mucAm(); await troi(200)
    expect(b.lt.mucAm()).toBe(0)
    gui.track = that
    await troi(500); b.lt.mucAm(); await troi(200)
    expect(b.lt.mucAm()).toBeGreaterThan(0.5)
  })
  it('bộ đo treo mà mic câm ⇒ vẫn phát hiện được bằng mức âm của bộ gửi và tự nới ràng buộc', async () => {
    ctx.state = 'suspended'
    thietBi.default = (rb) => (rb.autoGainControl ? 0 : 0.3)
    const b = dung()
    await b.lt.bat({})
    for (let i = 0; i < 6; i++) await troi(2000)
    expect(b.lt.trangThai().micTinh).toBe('tot')
    expect(mucGui(b)).toBeCloseTo(0.3)
  })
  it('chuỗi làm rõ tiếng ra câm trong khi mic có tín hiệu ⇒ bỏ chuỗi, gửi thẳng track mic (không bao giờ mất tiếng vì chuỗi)', async () => {
    const b = dung()
    await b.lt.bat({})
    expect(b.boGui().track!.label).toBe('chuoi')
    for (const n of ctx.soNen) n.hong = true // bộ nén hỏng ⇒ đầu ra chuỗi câm
    expect(mucGui(b)).toBe(0)
    await troi(6000)
    expect(b.boGui().track).toBe(moi[0])
    expect(mucGui(b)).toBeCloseTo(0.2)
    expect(b.lt.chanDoan().chuoi).toBe(false)
  })
})

describe('M1d · ô chọn mic', () => {
  it('liệt kê mic vào, bỏ mục «Communications», gọi rõ mục mặc định là của máy (không lẫn với mục đích danh cùng thiết bị)', async () => {
    const b = dung()
    expect(await b.lt.dsMic()).toEqual([{ id: 'default', ten: 'Mặc định của máy — Microphone (BOYALINK)' }, { id: 'usb1', ten: 'Microphone (BOYALINK)' }])
  })
})

describe('M2 · tiếng trong: luật lọc theo đường vọng + Opus dải rộng', () => {
  it('mặc định «Tự động»: không có đường vọng ⇒ khử vọng + lọc ồn TẮT, tự chỉnh âm lượng BẬT; thầy bật «Tất cả» (máy em trong lớp phát loa) ⇒ tự mở lại mic với hai bộ ấy BẬT', async () => {
    const b = dung()
    await b.lt.bat({})
    expect(goiGum[0]).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: true })
    expect(b.lt.trangThai().loc).toBe(false)
    b.lt.dat({ tiengLop: true })
    await troi(50)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: true, noiseSuppression: true, autoGainControl: true })
    expect(b.lt.trangThai().loc).toBe(true)
    expect(mucGui(b)).toBeCloseTo(0.2) // đổi chế độ không làm mất tiếng
    b.lt.dat({ tiengLop: false })
    await troi(50)
    expect(b.lt.trangThai().loc).toBe(false)
  })
  it('thầy ép tay: «Luôn bật» / «Luôn tắt» thắng luật tự động', async () => {
    const b = dung()
    await b.lt.bat({})
    b.lt.datLoc('bat'); await troi(50)
    expect(b.lt.trangThai().loc).toBe(true)
    b.lt.dat({ tiengLop: true }); b.lt.datLoc('tat'); await troi(50)
    expect(b.lt.trangThai().loc).toBe(false)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: false, noiseSuppression: false })
  })
  it('Opus của thầy: 64 kb/s mono dải rộng 48 kHz, sửa lỗi trong băng, KHÔNG DTX — trong cả lời mời, câu trả lời của SFU và `setParameters`', async () => {
    const b = dung()
    await b.lt.noiSan()
    const pc = PcGia.ds[0]!
    for (const sdp of [pc.localDescription!.sdp, pc.xa]) {
      const fmtp = /a=fmtp:111 (.*)/.exec(sdp)![1]!
      for (const k of ['maxaveragebitrate=64000', 'usedtx=0', 'useinbandfec=1', 'stereo=0', 'maxplaybackrate=48000', 'sprop-maxcapturerate=48000']) expect(fmtp).toContain(k)
    }
    expect(b.boGui().thamSo).toEqual({ encodings: [{ maxBitrate: 64000 }] })
    expect(OPUS_THAY).toMatchObject({ bitrate: 64000, dtx: false, fec: true, rong: true })
    // mic của em đang nói: 40 kb/s dải rộng
    expect(suaSdpOpus(SDP, OPUS_EM)).toContain('maxaveragebitrate=40000')
    expect(suaSdpOpus(SDP, OPUS_EM)).toContain('maxplaybackrate=48000')
    // mặc định cũ của hàm (không tuỳ chọn) không đổi ⇒ test cũ còn đúng
    expect(suaSdpOpus(SDP)).toContain('maxaveragebitrate=24000')
    expect(suaSdpOpus(SDP)).not.toContain('maxplaybackrate')
  })
  it('chuỗi làm rõ tiếng: cộng hai kênh về mono (không chia đôi, không mất kênh có tiếng) → lọc thông cao 80 Hz → nén nâng mức → chặn đỉnh', async () => {
    const b = dung()
    await b.lt.bat({})
    expect(ctx.soNen.length).toBe(2)
    expect(ctx.soNen[0]!.threshold.value).toBeLessThan(-20) // nén nâng mức
    expect(ctx.soNen[1]!.ratio.value).toBeGreaterThanOrEqual(20) // chặn đỉnh
    expect(ctx.soNen[1]!.threshold.value).toBeLessThan(0)
    expect(b.lt.trackGui()!.label).toBe('chuoi')
    expect(b.lt.luongMic()!.getAudioTracks()[0]).toBe(moi[0] as unknown as MediaStreamTrack) // luồng mic thô vẫn lộ cho phần ghi «Xem lại Live»
  })
  it('số đo luồng gửi đọc từ `getStats`: mức âm tại nguồn + byte đã gửi', () => {
    const bc = new Map<string, unknown>([['a', { type: 'media-source', kind: 'audio', audioLevel: 0.31, totalAudioEnergy: 2 }], ['b', { type: 'outbound-rtp', kind: 'audio', bytesSent: 16000, packetsSent: 100 }], ['c', { type: 'outbound-rtp', kind: 'video', bytesSent: 999 }]])
    expect(docSoGui(bc as unknown as RTCStatsReport)).toEqual({ mucAm: 0.31, nangLuong: 2, byteGui: 16000, goiGui: 100 })
  })
})
