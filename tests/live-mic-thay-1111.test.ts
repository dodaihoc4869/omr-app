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
import { datCoLive, liveBat, liveDat, liveMicBat, liveMoi, liveSan, liveTat, liveThuMic } from '../src/lib/bpu/phong-live'
import { LAM_RO, THAM_LOC_ON, type MucLocOn } from '../src/lib/live/chuoi-tieng'

// «CHỈ GIỌNG THẦY» (12/11): đếm số lần lõi tách được NẠP (mảnh lười) + mô hình giả (không gọi mạng) — mục «Chỉ giọng thầy — mặc định không đổi» cuối tệp.
const tachGiong = vi.hoisted(() => ({ nap: 0 }))
vi.mock('../src/lib/live/tach-giong-thay', async (goc) => { tachGiong.nap += 1; return await goc() })
vi.mock('../src/lib/live/chi-thay', async (goc) => ({ ...(await goc<typeof import('../src/lib/live/chi-thay')>()), taiMoHinhThay: async () => new ArrayBuffer(64) }))

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
const ctx = { state: 'running' as 'running' | 'suspended', onstatechange: null as (() => void) | null, soNen: [] as { hong: boolean; threshold: { value: number }; ratio: { value: number } }[] }
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
  lichSu: (TrackGia | null)[] = []; thamSo: unknown = null; byte = 0; nl = 0; dau: TrackGia | null
  constructor(public track: TrackGia | null) { this.dau = track }
  async replaceTrack(t: TrackGia | null) { this.track = t; this.lichSu.push(t) }
  getParameters() { return { encodings: [{}] } } async setParameters(p: unknown) { this.thamSo = p }
  async getStats() { this.byte += 8000; return new Map<string, unknown>([['ms', { type: 'media-source', kind: 'audio', audioLevel: this.track ? this.track.ra() : 0, totalAudioEnergy: (this.nl += (this.track ? this.track.ra() : 0) ** 2 * 0.1) }], ['out', { type: 'outbound-rtp', kind: 'audio', bytesSent: this.byte, packetsSent: 50 }]]) }
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
/** Thiết bị thêm vào danh sách `enumerateDevices` (cắm bộ thu sang cổng khác ⇒ mã mới, cùng tên). */
let dsThem: { kind: string; deviceId: string; label: string }[] = []

function dungTrinhDuyet() {
  PcGia.ds = []; goiGum.length = 0; moi.length = 0; ctx.state = 'running'; ctx.onstatechange = null; ctx.soNen = []; ngheThietBi = null; dsThem = []
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
    enumerateDevices: async () => [{ kind: 'audioinput', deviceId: 'default', label: 'Default - Microphone (BOYALINK)' }, { kind: 'audioinput', deviceId: 'communications', label: 'Communications - Microphone (BOYALINK)' }, { kind: 'audioinput', deviceId: 'usb1', label: 'Microphone (BOYALINK)' }, { kind: 'audiooutput', deviceId: 'loa', label: 'Loa' }, ...dsThem],
    addEventListener: (_: string, f: () => void) => { ngheThietBi = f },
  } })
}
const T0 = 1_700_000_000_000
function dung(tuy: { loc?: 'tu' | 'bat' | 'tat'; micTen?: string; kieuTieng?: 'lam-ro' | 'chuan'; locOn?: MucLocOn } = {}) {
  const st: TrangThaiPhong = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Em Một', coMat: true, luc: T0 }] })
  datCoLive(st, { cho: true, sfu: true }, T0)
  const tin: Record<string, unknown>[] = [], tt: TrangThaiLiveThay[] = []
  let thietBiDoi = 0
  const micMoi: string[] = []
  const lt = taoLiveThay({
    ve: 've-gv', goc: 'https://may-chu.example', loc: tuy.loc, micTen: tuy.micTen, kieuTieng: tuy.kieuTieng, locOn: tuy.locOn, khiMicMoi: (id) => { micMoi.push(id) }, khiThietBi: () => { thietBiDoi += 1 },
    kenh: { gui: (t) => { tin.push(t); if (t.t === 'live-bat') liveBat(st, T0 + 1); if (t.t === 'live-tat') liveTat(st, T0 + 3); if (t.t === 'live-san') liveSan(st, { san: t.san !== false, ss: t.ss }, T0); if (t.t === 'live-dat') liveDat(st, t as never, T0 + 2); if (t.t === 'live-bat' || t.t === 'live-dat') lt.nhanTinPhong(viewBang(st)) }, guiNhiPhan: () => {} },
    khiTrangThai: (t) => tt.push(t),
    moiTruong: { taoPc: () => new PcGia() as unknown as RTCPeerConnection, fetch: (async (u: string) => new Response(JSON.stringify(String(u).endsWith('/noi') ? { ok: true, phien: 'p'.repeat(16), sdp: SDP } : { ok: true, id: 1 }))) as never },
  })
  lt.nhanTinPhong(viewBang(st))
  const boGui = () => PcGia.ds[PcGia.ds.length - 1]!.boGui!
  return { st, lt, tin, tt, boGui, micMoi, bao: () => lt.nhanTinPhong(viewBang(st)), thietBiDoi: () => thietBiDoi }
}
/** 11/11 lần 4 (thầy: tự bật tiếng, tự tắt mic khi vào live): ĐƯỜNG VỌNG duy nhất của luật «Tự động» = loa máy thầy đang phát tiếng em nói (`tiengLop` không còn tính).
 *  `emNoi`: thầy mời S1, máy chủ ghi track mic của em, phòng báo view. `emNoiRaLoa`: thêm thầy bật «Phát tiếng em ra loa lớp». */
const emNoi = (b: ReturnType<typeof dung>): void => { liveMoi(b.st, 'S1', T0 + 5); liveMicBat(b.st, { sbd: 'S1', id: 'e1'.repeat(16), tieng: 'mic', mid: '3' }, T0 + 6); b.bao() }
const emNoiRaLoa = (b: ReturnType<typeof dung>): void => { emNoi(b); b.lt.datNgheEm(true) }
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
    // 11/11 tối: KHÔNG âm thầm — trạng thái ghi rõ mic đã chọn không mở được
    expect(b.lt.trangThai()).toMatchObject({ micTinh: 'tot', micTen: 'Micro máy tính', micKhac: 'Microphone (usb1)' })
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

describe('11/11 tối · hàng dự phòng «Tiếng: Làm rõ / Chuẩn trình duyệt»', () => {
  it('«Chuẩn trình duyệt» ⇒ mở lại mic với khử vọng + lọc ồn + tự chỉnh âm lượng của trình duyệt, gửi THẲNG mic (bỏ chuỗi); về «Làm rõ» ⇒ chuỗi lại, không xử lý của trình duyệt', async () => {
    const b = dung()
    await b.lt.bat({})
    expect(b.lt.chanDoan().chuoi).toBe(true)
    b.lt.datKieuTieng(true)
    await troi(50)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: true, noiseSuppression: true, autoGainControl: true })
    const mic = moi[moi.length - 1]!
    expect(b.boGui().track).toBe(mic) // track mic thô, không qua chuỗi
    expect(b.lt.chanDoan()).toMatchObject({ chuoi: false, vong: true, on: true, agc: true })
    expect(mucGui(b)).toBeCloseTo(0.2)
    b.lt.datKieuTieng(false)
    await troi(50)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: false, noiseSuppression: false })
    expect(b.lt.chanDoan().chuoi).toBe(true)
    expect(b.boGui().track).not.toBe(moi[moi.length - 1])
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
  it('chỉ mic THÔ mới có tín hiệu ⇒ nới tới bậc tắt cả tự chỉnh âm lượng; mục đích danh câm hẳn ⇒ GIỮ đúng mic ấy (`exact`), báo `im` — không âm thầm đổi mic', async () => {
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
    expect(goiGum.every((r) => !r.deviceId || 'exact' in r.deviceId)).toBe(true)
    expect(goiGum[goiGum.length - 1]!.deviceId).toEqual({ exact: 'usb1' })
    expect(b.lt.trangThai()).toMatchObject({ micTinh: 'im', micTen: 'Microphone (usb1)', micKhac: '' })
  })
  it('11/11 tối · LỖI THẬT «chọn BOYALINK mà lớp nghe mic Intel»: mã mic đã chọn không còn đúng (cắm cổng USB khác) ⇒ tìm lại ĐÚNG mic ấy theo tên, nhớ mã mới', async () => {
    thietBi.usb2 = () => 0.35
    dsThem = [{ kind: 'audioinput', deviceId: 'usb2', label: 'Microphone (2- RODE)' }] // Windows thêm «2- » khi cắm lại cổng khác
    const b = dung({ micTen: 'Microphone (RODE)' })
    expect((await b.lt.bat({ mic: 'usb-cu' })).ok).toBe(true)
    expect(goiGum.map((r) => r.deviceId)).toEqual([{ exact: 'usb-cu' }, { exact: 'usb2' }])
    expect(b.micMoi).toEqual(['usb2'])
    expect(b.lt.trangThai()).toMatchObject({ micTinh: 'tot', micTen: 'Microphone (usb2)', micKhac: '' })
    expect(mucGui(b)).toBeCloseTo(0.35)
  })
  it('mic đã chọn không có trên máy ⇒ mic mặc định + `micKhac`; cắm vào ⇒ tự về đúng mic đã chọn', async () => {
    const b = dung({ micTen: 'Microphone (RODE)' })
    await b.lt.bat({ mic: 'usb-cu' })
    expect(b.lt.trangThai()).toMatchObject({ micTen: 'Micro máy tính', micKhac: 'Microphone (RODE)' })
    thietBi.usb3 = () => 0.45
    dsThem = [{ kind: 'audioinput', deviceId: 'usb3', label: 'Microphone (RODE)' }]
    ngheThietBi?.()
    await troi(50)
    expect(goiGum[goiGum.length - 1]!.deviceId).toEqual({ exact: 'usb3' })
    expect(b.lt.trangThai()).toMatchObject({ micTen: 'Microphone (usb3)', micKhac: '' })
    expect(mucGui(b)).toBeCloseTo(0.45)
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
    emNoiRaLoa(b) // có đường vọng (loa máy thầy phát tiếng em nói) ⇒ tự xin lọc — 11/11 lần 4 (thầy: tự bật tiếng, tự tắt mic khi vào live): `tiengLop` không còn là đường vọng
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
  // 11/11 lần 4 (thầy: tự bật tiếng, tự tắt mic khi vào live): «Tất cả» (`tiengLop`) nay BẬT SẴN và không còn là điều kiện của luật tự động (khử vọng của trình duyệt chỉ khử tiếng do
  // chính máy thầy phát) ⇒ đường vọng của test này là loa máy thầy phát tiếng em nói.
  it('mặc định «Tự động»: không có đường vọng ⇒ khử vọng + lọc ồn TẮT, tự chỉnh âm lượng BẬT; loa máy thầy phát tiếng em nói ⇒ tự mở lại mic với hai bộ ấy BẬT; thôi phát ⇒ TẮT lại', async () => {
    const b = dung()
    await b.lt.bat({})
    expect(goiGum[0]).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: true })
    expect(b.lt.trangThai().loc).toBe(false)
    emNoiRaLoa(b)
    await troi(50)
    expect(goiGum[goiGum.length - 1]).toMatchObject({ echoCancellation: true, noiseSuppression: true, autoGainControl: true })
    expect(b.lt.trangThai().loc).toBe(true)
    expect(mucGui(b)).toBeCloseTo(0.2) // đổi chế độ không làm mất tiếng
    b.lt.datNgheEm(false)
    await troi(50)
    expect(b.lt.trangThai().loc).toBe(false)
  })
  // TEST MỚI 11/11 lần 4 (thầy: tự bật tiếng, tự tắt mic khi vào live) — khoá luật `canLoc` tự động = CHỈ (`ngheEm` && `emNoi`).
  // SỬA CÓ CHỦ ĐÍCH 11/11 tối (thầy: «khi học sinh bật mic thì tự động phát tiếng em ra loa lớp luôn nhé, bỏ luôn nút bật tắt đó đi»): em nói (cả em tại lớp)
  // ⇒ máy thầy TỰ phát ra loa ⇒ có đường vọng ngay, không cần bấm; chỉ lệnh cũ `datNgheEm(false)` mới thôi phát.
  it('«Tự động» không theo `tiengLop`: «Tất cả» bật sẵn mà không có em nói ⇒ KHÔNG xin khử vọng, đổi «Em ở xa» ⇄ «Tất cả» không mở lại mic; em tại lớp nói ⇒ loa thầy TỰ phát ⇒ xin NGAY; em thôi nói ⇒ tắt NGAY trong view ấy', async () => {
    const b = dung()
    await b.lt.bat({})
    expect(b.st.live).toMatchObject({ bat: true, tiengLop: true }) // mặc định mới: máy em trong lớp phát tiếng
    expect(goiGum.length).toBe(1)
    expect(goiGum[0]).toMatchObject({ echoCancellation: false, noiseSuppression: false })
    b.lt.dat({ tiengLop: false }); await troi(50); b.lt.dat({ tiengLop: true }); await troi(50)
    expect(b.st.live!.tiengLop).toBe(true)
    expect(goiGum.length).toBe(1); expect(b.lt.trangThai().loc).toBe(false)
    emNoi(b); await troi(50) // em trong lớp nói ⇒ máy thầy tự phát tiếng em ra loa (không nút bật) ⇒ xin khử vọng ngay trong view ấy
    expect(b.lt.trangThai()).toMatchObject({ emNoi: { sbd: 'S1' }, ngheEm: true, loc: true })
    expect(goiGum.length).toBe(2); expect(goiGum[1]).toMatchObject({ echoCancellation: true, noiseSuppression: true })
    liveThuMic(b.st, T0 + 9, 'S1'); b.bao(); await troi(50) // em thôi nói: MỘT view của phòng là đủ để tắt lại
    expect(b.lt.trangThai()).toMatchObject({ emNoi: null, loc: false }); expect(goiGum.length).toBe(3)
    emNoi(b); await troi(50) // em nói lại: MỘT view là đủ để bật
    expect(b.lt.trangThai().loc).toBe(true); expect(goiGum.length).toBe(4)
    b.lt.datNgheEm(false); await troi(50) // lệnh cũ «nghe-em» tắt phát ⇒ hết đường vọng
    expect(b.lt.trangThai()).toMatchObject({ ngheEm: false, loc: false })
  })
  it('11/11 tối · em TẠI LỚP bật mic ⇒ thẻ phát tiếng em trên máy thầy KHÔNG tắt tiếng (muted = false), không cần bấm gì; view kế của phòng vẫn phát', async () => {
    vi.stubGlobal('MediaStream', class { constructor(public ds: unknown[]) {} })
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const b = dung()
    await b.lt.bat({})
    emNoi(b); await troi(50)
    expect(b.lt.trangThai()).toMatchObject({ emNoi: { sbd: 'S1' }, ngheEm: true })
    PcGia.ds[PcGia.ds.length - 1]!.dispatchEvent(Object.assign(new Event('track'), { track: { kind: 'audio' }, receiver: {} }))
    const the = b.lt.nguonDo().n.the as HTMLAudioElement
    expect(the).toBeTruthy()
    expect(the.muted).toBe(false)
    b.bao(); await troi(50)
    expect(the.muted).toBe(false)
    play.mockRestore()
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
  it('kiểu «khung» (thầy 11/11 «tức thì», Chromium): track mic được xử lý TỪNG KHUNG trong Worker — không qua Web Audio; tự chỉnh âm lượng của trình duyệt vẫn BẬT ở bậc đầu (luồng 48 kHz một kênh); mic câm ở đường ấy ⇒ bậc kế thử mic thô', async () => {
    let micDangXuLy: TrackGia | null = null
    const guiW: unknown[] = []
    vi.stubGlobal('MediaStreamTrackProcessor', class { readable = {}; constructor(o: { track: TrackGia }) { micDangXuLy = o.track } })
    vi.stubGlobal('MediaStreamTrackGenerator', class extends TrackGia { writable = {}; constructor() { super('khung', {}, () => micDangXuLy?.ra() ?? 0) } })
    vi.stubGlobal('AudioData', class {})
    vi.stubGlobal('Worker', class { onmessage = null; onerror = null; postMessage(m: unknown) { guiW.push(m) } terminate() { /* dừng */ } })
    const U = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown }, cu = [U.createObjectURL, U.revokeObjectURL]
    U.createObjectURL = () => 'blob:khung'; U.revokeObjectURL = () => undefined
    try {
      thietBi.usb1 = () => 0.3
      const b = dung()
      await b.lt.bat({ mic: 'usb1' })
      expect(goiGum[0]).toMatchObject({ deviceId: { exact: 'usb1' }, echoCancellation: false, noiseSuppression: false, autoGainControl: true, sampleRate: { ideal: 48000 } })
      expect(b.lt.chanDoan()).toMatchObject({ kieu: 'khung', chuoi: true, gan: true })
      expect(b.boGui().track!.label).toBe('khung')
      expect(mucGui(b)).toBeCloseTo(0.3)
      expect(guiW.length).toBeGreaterThanOrEqual(1) // một Worker cho một luồng mic (tin đầu: luồng vào / ra)
      // LỌC ỒN RIÊNG (11/11): mặc định «Vừa»; thầy đổi mức ⇒ Worker nhận phần tiếng gốc trộn lại, KHÔNG mở lại mic
      const soMo = goiGum.length
      expect(b.lt.chanDoan().locOn).toBe('vua')
      b.lt.datLocOn('manh')
      expect(guiW[guiW.length - 1]).toMatchObject({ muc: { noi: 0.25, im: 0.05, san: 0.25 } }) // lúc nói giữ 25 % tiếng gốc ở băng thấp, lúc im lọc sâu + cổng −12 dB
      b.lt.datLocOn('tat')
      expect(guiW[guiW.length - 1]).toMatchObject({ muc: null })
      expect(b.lt.chanDoan()).toMatchObject({ locOn: 'tat', locOnChay: 'tat' })
      expect(goiGum.length).toBe(soMo)
      // mic chỉ có tín hiệu khi trình duyệt KHÔNG xử lý gì ⇒ thang nới ràng buộc sang mic thô
      thietBi.usb1 = (rb) => (rb.autoGainControl ? 0 : 0.25)
      await b.lt.moMic('usb1')
      await troi(1800)
      expect(goiGum[goiGum.length - 1]).toMatchObject({ autoGainControl: false })
      expect(b.lt.trangThai().micTinh).toBe('tot')
      expect(mucGui(b)).toBeCloseTo(0.25)
      expect(b.lt.chanDoan().kieu).toBe('khung')
    } finally { U.createObjectURL = cu[0]; U.revokeObjectURL = cu[1] }
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

describe('«Chỉ giọng thầy» — mặc định không đổi (12/11, đường thử chỉ-thầy, mặc định tắt)', () => {
  /** Trình duyệt có kiểu «khung» (Chromium): ghi lại mọi Worker, mọi tin gửi Worker, mọi Blob mã Worker. */
  function khungGia() {
    const ws: { tin: unknown[]; onmessage: ((e: { data: unknown }) => void) | null }[] = [], blob: Blob[] = []
    let micDangXuLy: TrackGia | null = null
    vi.stubGlobal('MediaStreamTrackProcessor', class { readable = {}; constructor(o: { track: TrackGia }) { micDangXuLy = o.track } })
    vi.stubGlobal('MediaStreamTrackGenerator', class extends TrackGia { writable = {}; constructor() { super('khung', {}, () => micDangXuLy?.ra() ?? 0) } })
    vi.stubGlobal('AudioData', class {})
    vi.stubGlobal('Worker', class { tin: unknown[] = []; onmessage = null; onerror = null; constructor() { ws.push(this as never) } postMessage(m: unknown) { this.tin.push(m) } terminate() { /* dừng */ } })
    const U = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown }, cu = [U.createObjectURL, U.revokeObjectURL]
    U.createObjectURL = (b: Blob) => { blob.push(b); return `blob:${blob.length}` }; U.revokeObjectURL = () => undefined
    return { ws, blob, tra: () => { U.createObjectURL = cu[0]; U.revokeObjectURL = cu[1] } }
  }
  const micGoc = (b: ReturnType<typeof dung>) => b.lt.luongMic()!.getAudioTracks()[0]

  for (const kieuTieng of ['lam-ro', 'chuan'] as const) for (const locOn of ['vua', 'manh', 'tat'] as const) {
    it(`Tiếng «${kieuTieng}» · Lọc ồn «${locOn}»: một Worker chỉ có mã khung, tin gửi Worker đúng dạng cũ, track gửi như cũ, không nạp lõi tách`, async () => {
      const g = khungGia()
      try {
        const napTruoc = tachGiong.nap
        const b = dung({ kieuTieng, locOn })
        await b.lt.bat({})
        expect(g.ws.length).toBe(1); expect(g.blob.length).toBe(1)
        const ma = await g.blob[0]!.text()
        expect(ma).toContain('function xuLy(f)'); expect(ma).not.toMatch(/function (docMoHinh|taoTach)\b/)
        const tin = g.ws[0]!.tin as Record<string, unknown>[]
        // tin đầu: luồng vào / ra + cấu hình làm rõ tiếng — KHÔNG có khoá nào mới
        expect(Object.keys(tin[0]!).sort()).toEqual(['c', 'ra', 'vao'])
        expect(Object.keys(tin[0]!.c as object).sort()).toEqual([...Object.keys(LAM_RO), 'g0'].sort())
        expect(tin[1]).toEqual({ muc: THAM_LOC_ON[locOn] })
        // Làm rõ ⇒ gửi chuỗi; Chuẩn trình duyệt ⇒ gửi thẳng mic (như trước)
        expect(b.lt.trackGui()).toBe(kieuTieng === 'chuan' ? micGoc(b) : b.boGui().track)
        expect(b.boGui().track!.label).toBe(kieuTieng === 'chuan' ? 'Micro máy tính' : 'khung')
        expect(b.lt.chanDoan()).toMatchObject({ locOn, chuoi: kieuTieng !== 'chuan' })
        expect('tg' in b.lt.chanDoan()).toBe(false); expect('tgTin' in b.lt.chanDoan()).toBe(false)
        // đổi mức / đổi kiểu tiếng ⇒ tin y như cũ, không tin «Chỉ giọng thầy» nào
        const khac: MucLocOn = locOn === 'manh' ? 'tat' : 'manh'
        b.lt.datLocOn(khac); expect(tin[tin.length - 1]).toEqual({ muc: THAM_LOC_ON[khac] })
        const soTin = tin.length
        b.lt.datKieuTieng(kieuTieng !== 'chuan'); await troi(10)
        expect(tin.length).toBe(soTin)
        expect(b.boGui().track!.label).toBe(kieuTieng !== 'chuan' ? 'Micro máy tính' : 'khung')
        b.lt.datKieuTieng(kieuTieng === 'chuan'); await troi(10)
        expect(b.boGui().track!.label).toBe(kieuTieng === 'chuan' ? 'Micro máy tính' : 'khung')
        expect(tin.length).toBe(soTin)
        expect(tin.some((t) => 'chiThay' in t || 'chiTach' in t || 'tachMa' in t || 'tach' in t)).toBe(false)
        await vi.dynamicImportSettled()
        expect(tachGiong.nap).toBe(napTruoc) // lõi tách chưa từng được nạp
      } finally { g.tra() }
    })
  }

  it('chọn «Chỉ giọng thầy» ⇒ MỚI nạp lõi + mô hình; Chuẩn trình duyệt gửi chuỗi chỉ-tách; tự tắt ⇒ gửi lại mic gốc; rời mức ⇒ như cũ', async () => {
    const g = khungGia()
    try {
      const b = dung({ kieuTieng: 'chuan' })
      await b.lt.bat({})
      const w = g.ws[0]!, tin = w.tin as Record<string, unknown>[]
      expect(b.boGui().track).toBe(micGoc(b))
      b.lt.datLocOn('thay')
      expect(tin[tin.length - 1]).toEqual({ muc: null, chiThay: true, chiTach: true })
      for (let i = 0; i < 5; i++) { await vi.dynamicImportSettled(); await troi(10) }
      expect(tachGiong.nap).toBeGreaterThanOrEqual(1)
      const gui = tin.find((t) => 'tachMa' in t)!
      expect(gui.tach).toBeInstanceOf(ArrayBuffer)
      expect(await g.blob[g.blob.length - 1]!.text()).toMatch(/function docMoHinh\b/) // lõi đi bằng Blob riêng ⇒ importScripts
      expect(b.boGui().track!.label).toBe('khung') // đang tải: chuỗi chỉ-tách (tiếng đi thẳng qua Worker)
      w.onmessage!({ data: { tg: 'chay', h: { ban: 'thu', ngay: '2026-11-11' } } })
      expect(b.lt.chanDoan()).toMatchObject({ locOn: 'thay', locOnChay: 'chay', tg: 'chay', tgTin: { ban: 'thu', ngay: '2026-11-11' } })
      // đổi kiểu tiếng khi đang chạy ⇒ báo Worker đường mới (đổi ràng buộc mic có thể mở lại mic ⇒ chuỗi MỚI cũng tự bật lại «Chỉ giọng thầy»)
      b.lt.datKieuTieng(false); expect(tin[tin.length - 1]).toEqual({ chiTach: false })
      await troi(2000); for (let i = 0; i < 5; i++) { await vi.dynamicImportSettled(); await troi(10) }
      b.lt.datKieuTieng(true); await troi(2000); for (let i = 0; i < 5; i++) { await vi.dynamicImportSettled(); await troi(10) }
      const w2 = g.ws[g.ws.length - 1]!, tin2 = w2.tin as Record<string, unknown>[]
      if (w2 !== w) expect(tin2).toContainEqual({ muc: null, chiThay: true, chiTach: true })
      else expect(tin2[tin2.length - 1]).toEqual({ chiTach: true })
      w2.onmessage!({ data: { tg: 'chay', h: { ban: 'thu', ngay: '2026-11-11' } } }); await troi(10)
      expect(b.boGui().track!.label).toBe('khung')
      // lưới: mô hình tự tắt ⇒ gửi lại mic gốc + ghi lý do
      w2.onmessage!({ data: { tg: 'tu-tat', ly: 'cham' } }); await troi(10)
      expect(b.boGui().track).toBe(micGoc(b))
      expect(b.lt.chanDoan()).toMatchObject({ tg: 'tu-tat', tgTin: { ly: 'cham' } })
      expect(b.lt.chanDoan().luoi).toContain('Chỉ giọng thầy tự tắt')
      // rời mức ⇒ tin rời + mic gốc (Chuẩn trình duyệt)
      b.lt.datLocOn('vua'); await troi(10)
      expect(tin2[tin2.length - 1]).toEqual({ muc: THAM_LOC_ON.vua, chiThay: false })
      expect(b.boGui().track).toBe(micGoc(b))
      expect('tg' in b.lt.chanDoan()).toBe(false)
    } finally { g.tra() }
  })
})
