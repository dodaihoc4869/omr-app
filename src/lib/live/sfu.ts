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
}
/** Sửa dòng `a=fmtp` của Opus trong SDP: mono, FEC, DTX, trần bitrate, ptime. Trình duyệt mã hoá theo tham số trong mô tả của BÊN KIA ⇒ máy thầy áp hàm này
 *  cho cả lời mời của mình lẫn câu trả lời của SFU trước khi đặt. Không có Opus ⇒ trả nguyên văn. Thuần. */
export function suaSdpOpus(sdp: string, o: TuyChonOpus = {}): string {
  const m = /a=rtpmap:(\d+) opus\/48000/i.exec(sdp)
  if (!m) return sdp
  const pt = m[1]!, xuong = sdp.includes('\r\n') ? '\r\n' : '\n'
  const dat: Record<string, string> = { stereo: '0', 'sprop-stereo': '0', useinbandfec: o.fec === false ? '0' : '1', usedtx: o.dtx === false ? '0' : '1', maxaveragebitrate: String(Math.round(o.bitrate ?? 24000)) }
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

/** Số đo trích từ `getStats()` (mọi trường có thể vắng tuỳ trình duyệt). */
export interface SoWebRtc {
  /** RTT tới SFU (ms). */
  rtt: number | null
  /** Jitter tiếng nhận (ms). */
  jitter: number | null
  /** Tổng trễ đệm tiếng (giây) + số mẫu đã phát — lấy hiệu hai lần đọc ra trễ đệm trung bình. */
  demTong: number | null
  demSo: number | null
  goiNhan: number | null
  goiMat: number | null
  mucAm: number | null
}
export function docSoWebRtc(bc: RTCStatsReport): SoWebRtc {
  const r: SoWebRtc = { rtt: null, jitter: null, demTong: null, demSo: null, goiNhan: null, goiMat: null, mucAm: null }
  bc.forEach((x: Record<string, unknown>) => {
    const so = (k: string): number | null => (typeof x[k] === 'number' ? (x[k] as number) : null)
    if (x.type === 'candidate-pair' && (x.nominated === true || x.selected === true) && so('currentRoundTripTime') != null) r.rtt = so('currentRoundTripTime')! * 1000
    else if (x.type === 'inbound-rtp' && (x.kind === 'audio' || x.mediaType === 'audio')) {
      if (so('jitter') != null) r.jitter = so('jitter')! * 1000
      r.demTong = so('jitterBufferDelay'); r.demSo = so('jitterBufferEmittedCount'); r.goiNhan = so('packetsReceived'); r.goiMat = so('packetsLost')
      if (so('audioLevel') != null) r.mucAm = so('audioLevel')
    } else if (x.type === 'remote-inbound-rtp' && r.rtt == null && so('roundTripTime') != null) r.rtt = so('roundTripTime')! * 1000
  })
  return r
}
