// LIVE BẢNG — phần dùng chung của máy thầy và máy em khi nói chuyện với Cloudflare Realtime SFU qua cửa `/bpu/live/*` của Worker (server/src/live-sfu.ts).
// App Secret không bao giờ xuống đây: máy khách chỉ cầm VÉ của phòng. Mọi thứ đụng trình duyệt (fetch, đồng hồ, hẹn giờ, RTCPeerConnection) đi qua `MoiTruongLive`
// để test thay được.
export interface MoiTruongLive {
  fetch: typeof fetch
  /** Đồng hồ đơn điệu (ms) — `performance.now()`. */
  dongHo(): number
  hen(f: () => void, ms: number): unknown
  huyHen(h: unknown): void
  /** 0..1 — rải thời điểm nối để 300 máy không dồn một lúc. */
  ngauNhien(): number
  taoPc(cauHinh: RTCConfiguration): RTCPeerConnection
}
export function moiTruongMacDinh(): MoiTruongLive {
  return {
    fetch: (u, o) => fetch(u, o),
    dongHo: () => performance.now(),
    hen: (f, ms) => setTimeout(f, ms),
    huyHen: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    ngauNhien: () => Math.random(),
    taoPc: (c) => new RTCPeerConnection(c),
  }
}

/** Kênh tới PHÒNG (WebSocket đang có của Bình Phản Ứng) — đợt 1B nối vào: `gui` = `ws.send(JSON.stringify(tin))`, `guiNhiPhan` = `ws.send(khung)`.
 *  Nhớ đặt `ws.binaryType = 'arraybuffer'` và chuyển MỌI tin nhận được (chữ lẫn nhị phân) cho `nhanTinPhong`. Kênh chưa mở ⇒ bỏ qua (không ném). */
export interface KenhPhong {
  gui(tin: Record<string, unknown>): void
  guiNhiPhan(khung: Uint8Array): void
  /** (12/11, tuỳ chọn) Số byte còn nằm trong hàng chờ gửi của WebSocket (`ws.bufferedAmount`) — máy thầy dùng để KHÔNG dồn thêm điểm cũ khi đường lên nghẽn. */
  hangCho?(): number
}

export type TraCua = { ok: boolean; lyDo?: string; phien?: string; sdp?: string; loai?: string; id?: number; tracks?: { ten: string; mid: string }[]; ice?: RTCIceServer[]; dapXong?: boolean; http?: number; ma?: string; buoc?: string }
/** Gọi cửa `/bpu/live/<lenh>`. Lỗi mạng ⇒ `{ ok: false, lyDo: 'mang' }` (không ném). */
export async function goiCua(mt: MoiTruongLive, goc: string, lenh: string, than: Record<string, unknown>): Promise<TraCua> {
  try {
    const r = await mt.fetch(`${goc}/bpu/live/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than) })
    const j = (await r.json().catch(() => null)) as TraCua | null
    return j && typeof j === 'object' ? j : { ok: false, lyDo: 'mang' }
  } catch { return { ok: false, lyDo: 'mang' } }
}

export interface TuyChonOpus {
  /** Lúc im gần như không gửi gói (đặc tả 4.2). Mặc định bật. */
  dtx?: boolean
  /** Sửa lỗi trong băng. Mặc định bật. */
  fec?: boolean
  /** Trần bitrate trung bình (b/s). Mặc định 24.000. */
  bitrate?: number
  /** Khung Opus (ms): 20 mặc định; 10 để thử bớt trễ ở Đợt 0. */
  ptime?: number
  /** Dải rộng 48 kHz (`maxplaybackrate` / `sprop-maxcapturerate` = 48000) — giọng nói trong, đủ âm gió / âm xuýt. Mặc định không ghi (trình duyệt tự chọn). */
  rong?: boolean
}
/** TIẾNG THẦY (thầy 11/11 «chỉnh tiếng trong và cực rõ»): 64 kb/s mono dải rộng 48 kHz, sửa lỗi trong băng, KHÔNG DTX (DTX cắt đầu chữ sau quãng nghỉ).
 *  Trước 11/11: 24 kb/s + DTX. 300 em nghe × 64 kb/s ≈ 8,6 GB mỗi giờ live qua SFU (hạn miễn phí 1.000 GB / tháng). */
export const OPUS_THAY: TuyChonOpus = { bitrate: 64000, dtx: false, fec: true, rong: true }
/** MIC CỦA EM đang nói: 40 kb/s mono dải rộng, có DTX (em nói từng quãng). */
export const OPUS_EM: TuyChonOpus = { bitrate: 40000, dtx: true, fec: true, rong: true }
/** Sửa dòng `a=fmtp` của Opus trong SDP: mono, FEC, DTX, trần bitrate, ptime. Trình duyệt mã hoá theo tham số trong mô tả của BÊN KIA ⇒ máy thầy áp hàm này
 *  cho cả lời mời của mình lẫn câu trả lời của SFU trước khi đặt. Không có Opus ⇒ trả nguyên văn. Thuần. */
export function suaSdpOpus(sdp: string, o: TuyChonOpus = {}): string {
  const m = /a=rtpmap:(\d+) opus\/48000/i.exec(sdp)
  if (!m) return sdp
  const pt = m[1]!, xuong = sdp.includes('\r\n') ? '\r\n' : '\n'
  const dat: Record<string, string> = { stereo: '0', 'sprop-stereo': '0', useinbandfec: o.fec === false ? '0' : '1', usedtx: o.dtx === false ? '0' : '1', maxaveragebitrate: String(Math.round(o.bitrate ?? 24000)),
    ...(o.rong ? { maxplaybackrate: '48000', 'sprop-maxcapturerate': '48000' } : {}) }
  const dong = sdp.split(/\r?\n/)
  let co = false
  for (let i = 0; i < dong.length; i++) {
    const d = dong[i]!
    if (!d.startsWith(`a=fmtp:${pt} `)) continue
    co = true
    const cu = new Map(d.slice(`a=fmtp:${pt} `.length).split(';').map((x) => x.trim()).filter(Boolean).map((x) => { const k = x.indexOf('='); return [k < 0 ? x : x.slice(0, k), k < 0 ? '' : x.slice(k + 1)] as [string, string] }))
    for (const [k, v] of Object.entries(dat)) cu.set(k, v)
    dong[i] = `a=fmtp:${pt} ${[...cu].map(([k, v]) => (v === '' ? k : `${k}=${v}`)).join(';')}`
  }
  if (!co) { const i = dong.findIndex((d) => d.startsWith(`a=rtpmap:${pt} `)); dong.splice(i + 1, 0, `a=fmtp:${pt} ${Object.entries(dat).map(([k, v]) => `${k}=${v}`).join(';')}`) }
  const ptime = Math.round(o.ptime ?? 20)
  if (ptime !== 20 && !dong.some((d) => d.startsWith('a=ptime:'))) { const i = dong.findIndex((d) => d.startsWith(`a=fmtp:${pt} `)); dong.splice(i + 1, 0, `a=ptime:${ptime}`) }
  return dong.join(xuong)
}

/** Chờ gom xong ứng viên ICE (có hạn): gửi mô tả đã kèm ứng viên ⇒ không cần kênh trao ứng viên riêng. */
export function choIce(pc: RTCPeerConnection, mt: MoiTruongLive, toiDaMs = 1500): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((xong) => {
    let h: unknown = null
    function nghe(): void { if (pc.iceGatheringState === 'complete') ra() }
    function ra(): void { mt.huyHen(h); pc.removeEventListener('icegatheringstatechange', nghe); xong() }
    pc.addEventListener('icegatheringstatechange', nghe)
    h = mt.hen(ra, toiDaMs)
  })
}
/** Chờ kết nối tới SFU thành `connected` (có hạn). */
export function choNoi(pc: RTCPeerConnection, mt: MoiTruongLive, toiDaMs = 8000): Promise<boolean> {
  if (pc.connectionState === 'connected') return Promise.resolve(true)
  return new Promise((xong) => {
    let h: unknown = null
    function nghe(): void { const s = pc.connectionState; if (s === 'connected') ra(true); else if (s === 'failed' || s === 'closed') ra(false) }
    function ra(ok: boolean): void { mt.huyHen(h); pc.removeEventListener('connectionstatechange', nghe); xong(ok) }
    pc.addEventListener('connectionstatechange', nghe)
    h = mt.hen(() => ra(pc.connectionState === 'connected'), toiDaMs)
  })
}
/** Chờ DataChannel mở (có hạn). */
export function choKenhMo(dc: RTCDataChannel, mt: MoiTruongLive, toiDaMs = 5000): Promise<boolean> {
  if (dc.readyState === 'open') return Promise.resolve(true)
  return new Promise((xong) => {
    let h: unknown = null
    function mo(): void { ra(true) }
    function ra(ok: boolean): void { mt.huyHen(h); dc.removeEventListener('open', mo); xong(ok) }
    dc.addEventListener('open', mo)
    h = mt.hen(() => ra(dc.readyState === 'open'), toiDaMs)
  })
}
/** Trả lời một lời mời của SFU: đặt mô tả xa, tạo + đặt câu trả lời, gom ICE ⇒ SDP để nộp qua `dap`. */
export async function traLoiMoi(pc: RTCPeerConnection, mt: MoiTruongLive, sdpMoi: string): Promise<string> {
  await pc.setRemoteDescription({ type: 'offer', sdp: sdpMoi })
  await pc.setLocalDescription(await pc.createAnswer())
  await choIce(pc, mt)
  return pc.localDescription?.sdp ?? ''
}

/** Số đo của MỘT luồng tiếng nhận về. */
export interface SoTiengNhan {
  /** `mid` của luồng trong kết nối (trình duyệt cũ không báo ⇒ null). */
  mid: string | null
  /** Jitter (ms). */
  jitter: number | null
  /** Tổng trễ đệm (giây) + số mẫu đã phát — lấy hiệu hai lần đọc ra trễ đệm trung bình. */
  demTong: number | null
  demSo: number | null
  goiNhan: number | null
  goiMat: number | null
  mucAm: number | null
}
/** Số đo trích từ `getStats()` (mọi trường có thể vắng tuỳ trình duyệt). Các trường tiếng là của luồng CHÍNH (tiếng thầy trên máy em; tiếng em trên máy thầy);
 *  `khac` = các luồng tiếng nhận khác trên cùng kết nối (tiếng bạn đang phát mic) — tách riêng để không lẫn vào số đo đồng bộ tiếng–nét. */
export interface SoWebRtc extends Omit<SoTiengNhan, 'mid'> {
  /** RTT tới SFU (ms). */
  rtt: number | null
  /** Đường nối đang dùng tới SFU: loại ứng viên phía máy này + giao thức, vd. `host/udp`, `srflx/udp`, `relay/tcp` (null = trình duyệt không báo). */
  duong: string | null
  khac: SoTiengNhan[]
}
/** `midChinh` = mid của luồng chính (biết thì chọn đúng; không biết / trình duyệt không báo mid ⇒ luồng tiếng nhận đầu tiên). */
export function docSoWebRtc(bc: RTCStatsReport, midChinh?: string | null): SoWebRtc {
  let rtt: number | null = null, rttXa: number | null = null, ungVien = ''
  const vao: SoTiengNhan[] = [], uv = new Map<string, string>()
  bc.forEach((x: Record<string, unknown>) => {
    const so = (k: string): number | null => (typeof x[k] === 'number' ? (x[k] as number) : null)
    if (x.type === 'candidate-pair' && (x.nominated === true || x.selected === true) && so('currentRoundTripTime') != null) { rtt = so('currentRoundTripTime')! * 1000; ungVien = String(x.localCandidateId ?? '') }
    else if (x.type === 'local-candidate') uv.set(String(x.id ?? ''), `${String(x.candidateType ?? '?')}/${String(x.relayProtocol ?? x.protocol ?? '?')}`)
    else if (x.type === 'inbound-rtp' && (x.kind === 'audio' || x.mediaType === 'audio')) {
      vao.push({ mid: typeof x.mid === 'string' ? x.mid : null, jitter: so('jitter') == null ? null : so('jitter')! * 1000, demTong: so('jitterBufferDelay'), demSo: so('jitterBufferEmittedCount'), goiNhan: so('packetsReceived'), goiMat: so('packetsLost'), mucAm: so('audioLevel') })
    } else if (x.type === 'remote-inbound-rtp' && so('roundTripTime') != null) rttXa = so('roundTripTime')! * 1000
  })
  const chinh = (midChinh ? vao.find((v) => v.mid === midChinh) : undefined) ?? vao[0] ?? null
  return { rtt: rtt ?? rttXa, duong: uv.get(ungVien) ?? null, jitter: chinh?.jitter ?? null, demTong: chinh?.demTong ?? null, demSo: chinh?.demSo ?? null, goiNhan: chinh?.goiNhan ?? null, goiMat: chinh?.goiMat ?? null, mucAm: chinh?.mucAm ?? null, khac: vao.filter((v) => v !== chinh) }
}

/** Số đo của luồng tiếng ĐANG GỬI (máy thầy): mức âm của track gắn vào bộ gửi (`media-source` — đo ngay tại nguồn, không cần AudioContext), số byte / gói đã gửi. */
export interface SoTiengGui { mucAm: number | null; nangLuong: number | null; byteGui: number | null; goiGui: number | null }
export function docSoGui(bc: RTCStatsReport): SoTiengGui {
  const ra: SoTiengGui = { mucAm: null, nangLuong: null, byteGui: null, goiGui: null }
  bc.forEach((x: Record<string, unknown>) => {
    const so = (k: string): number | null => (typeof x[k] === 'number' ? (x[k] as number) : null)
    const tieng = x.kind === 'audio' || x.mediaType === 'audio'
    if (x.type === 'media-source' && tieng) { ra.mucAm = so('audioLevel') ?? ra.mucAm; ra.nangLuong = so('totalAudioEnergy') ?? ra.nangLuong }
    else if (x.type === 'outbound-rtp' && tieng) { ra.byteGui = (ra.byteGui ?? 0) + (so('bytesSent') ?? 0); ra.goiGui = (ra.goiGui ?? 0) + (so('packetsSent') ?? 0) }
  })
  return ra
}
