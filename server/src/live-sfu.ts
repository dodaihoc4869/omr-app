// LIVE BẢNG — CỬA `/bpu/live/*` (10/11, đặc tả docs/dac-ta-live-bang-1011.md mục 4.1–4.3): Worker làm TRUNG GIAN giữa máy thầy / máy em và Cloudflare Realtime SFU
// (`https://rtc.live.cloudflare.com/v1/apps/{appId}/…`). App Secret CHỈ nằm ở Worker (secret `REALTIME_APP_SECRET`), không bao giờ ra máy khách, không in log.
// KIỂM QUYỀN: vé HMAC `bpu|` đang có của phòng Bình Phản Ứng (vé thầy chỉ phát sau mã bí mật, vé em từ token em) ⇒ 0 LỆNH D1 trên cả đường live.
// Chưa cấu hình khoá ⇒ mọi lệnh trả `{ ok: false, lyDo: 'chua-cau-hinh' }` — live vẫn chạy phần HÌNH qua WebSocket của phòng.
//
// Lệnh (POST, thân JSON, luôn kèm `ve`), theo đúng trình tự của tài liệu Realtime SFU «Connection patterns» (đọc 10/11 từ kho cloudflare/cloudflare-docs):
//   noi   { sdp, tracks:[{mid,ten}] }      THẦY: tạo phiên + phát track trong lời mời đầu (có sẵn DataChannel) ⇒ { phien, sdp: trả lời }
//   noi   { nguon, ten:[…] }               EM / THẦY: tạo phiên + kéo track của phiên `nguon` ⇒ { phien, sdp: lời mời của SFU, tracks:[{ten,mid}] }
//   noi   {}                               chỉ tạo phiên ⇒ { phien }
//   dap   { phien, sdp, kenh? }            nộp câu trả lời SDP (renegotiate); `kenh: true` ⇒ dựng luôn đường DataChannel (establish) ⇒ { sdp: lời mời mới }
//   kenh  { phien, ten, nguon? }           cấp DataChannel: thầy (không `nguon`) = phát; có `nguon` = nhận từ phiên ấy ⇒ { id } (kênh negotiated)
//   phat  { phien, sdp, tracks }           THẦY phát thêm track trên phiên đã có.
//                                          EM (10/11, «tự động bật mic cho bạn lên bảng»): CHỈ em đang được gọi lên bảng — Worker hỏi PHÒNG trước khi gọi SFU,
//                                          tên track do máy chủ đặt (`mic`), SFU nhận xong mới báo phòng ghi `live.mic`; phòng không nhận ⇒ đóng track ngay.
//   nhan  { phien, nguon, ten:[…] }        kéo THÊM track của phiên `nguon` về phiên đã có (nghe em đang phát mic) ⇒ { sdp: lời mời của SFU } rồi `dap`.
//   dong  { phien, mids?, kenh? }          đóng track (force, không cần SDP) + DataChannel.
// Mã phiên SFU là chuỗi ngẫu nhiên dài, chỉ máy tạo ra nó (và phòng, với phiên của thầy / của em đang phát mic) biết ⇒ dùng như khoá năng lực.
import type { Env } from './kieu'
import { bpuBat, hoiPhongMic, kiemVeBpu, type VeBpu } from './phong-binh-phan-ung'

type Row = Record<string, unknown>
export const DUONG_LIVE = '/bpu/live/'
const GOC_SFU = 'https://rtc.live.cloudflare.com/v1/apps'
const HAN_GOI_MS = 8000
const SDP_TOI_DA = 40_000
/** Kênh điểm đang viết: không thứ tự, không gửi lại (mất gói thì bỏ) — thầy và mọi em PHẢI khai cùng chính sách (tài liệu DataChannels). */
const CHINH_SACH_KENH = { ordered: false, maxRetransmits: 0 } as const
/** Máy khách dùng STUN công khai của Cloudflare; trả kèm `noi` để sau này thêm TURN ở máy chủ mà không phải phát hành lại app. */
const ICE = [{ urls: 'stun:stun.cloudflare.com:3478' }]

/** TURN (11/11 tối): mạng chặn UDP (Wi-Fi trường, 4G khắt khe) ⇒ máy không nối được SFU ⇒ câm CẢ HAI CHIỀU, bảng vẫn chạy (đo CI: chặn UDP cả máy ⇒ câm trên
 *  cả bản cũ lẫn bản mới). Thông tin TURN NGẮN HẠN cấp từ khoá TURN (Worker secrets TURN_KEY_ID + TURN_KEY_API_TOKEN) qua
 *  `POST https://rtc.live.cloudflare.com/v1/turn/keys/<id>/credentials/generate-ice-servers {ttl}` (tài liệu Realtime TURN «Generate Credentials»), hạn 24 giờ,
 *  ĐỆM trong bộ nhớ isolate 4 giờ (300 em không gọi Cloudflare 300 lần; chung một lần gọi đang chạy). Bỏ URL cổng 53 (trình duyệt chặn — tài liệu dặn bỏ khi không
 *  trickle ICE). Thiếu secret / lỗi ⇒ `null` ⇒ máy khách chạy như cũ (chỉ STUN), không chặn live. 0 lệnh D1. */
const TTL_TURN_GIAY = 86_400, DEM_TURN_MS = 4 * 3_600_000, LOI_TURN_MS = 60_000
export const turnDaCauHinh = (env: Pick<Env, 'TURN_KEY_ID' | 'TURN_KEY_API_TOKEN'>): boolean => !!env.TURN_KEY_ID && !!env.TURN_KEY_API_TOKEN
/** Giữ đúng dạng `RTCIceServer`: chỉ stun: / turn: / turns:, bỏ cổng 53, thông tin đăng nhập là chuỗi. */
export function locTurn(v: unknown): Row[] {
  const ra: Row[] = []
  for (const x of Array.isArray(v) ? v.slice(0, 8) : []) {
    const o = x as Row | null
    if (!o || typeof o !== 'object') continue
    const urls = (Array.isArray(o.urls) ? o.urls : [o.urls]).map(str).filter((u) => /^(stun|turns?):[^\s]{3,200}$/.test(u) && !/:53(\?|$)/.test(u)).slice(0, 8)
    if (!urls.length) continue
    ra.push({ urls, ...(str(o.username) ? { username: str(o.username) } : {}), ...(str(o.credential) ? { credential: str(o.credential) } : {}) })
  }
  return ra
}
let demTurn: { het: number; ice: Row[] | null } | null = null, dangTurn: Promise<Row[] | null> | null = null
/** Thông tin TURN (đã đệm). `null` = chưa cấu hình / Cloudflare lỗi. */
export function layTurn(env: Env, nay = Date.now()): Promise<Row[] | null> {
  if (!turnDaCauHinh(env)) return Promise.resolve(null)
  if (demTurn && demTurn.het > nay) return Promise.resolve(demTurn.ice)
  dangTurn ??= (async () => {
    try {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID!)}/credentials/generate-ice-servers`, {
        method: 'POST', headers: { authorization: `Bearer ${env.TURN_KEY_API_TOKEN!}`, 'content-type': 'application/json' }, body: JSON.stringify({ ttl: TTL_TURN_GIAY }), signal: AbortSignal.timeout(HAN_GOI_MS),
      })
      const ice = locTurn(((await r.json().catch(() => null)) as Row | null)?.iceServers)
      const tot = r.ok && ice.some((x) => (x.urls as string[]).some((u) => u.startsWith('turn')))
      demTurn = { het: Date.now() + (tot ? DEM_TURN_MS : LOI_TURN_MS), ice: tot ? ice : null }
      return demTurn.ice
    } catch { demTurn = { het: Date.now() + LOI_TURN_MS, ice: null }; return null } finally { dangTurn = null }
  })()
  return dangTurn
}
/** Chỉ cho phép thử: xoá đệm TURN của isolate. */
export const xoaDemTurn = (): void => { demTurn = null; dangTurn = null }

const MA_PHIEN = /^[A-Za-z0-9_-]{8,128}$/
const TEN = /^[a-z0-9-]{1,32}$/
const MID = /^[A-Za-z0-9]{1,16}$/
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const phienHop = (v: unknown): string => (MA_PHIEN.test(str(v)) ? str(v) : '')
const sdpHop = (v: unknown): string => { const s = str(v); return s.length >= 20 && s.length <= SDP_TOI_DA && s.startsWith('v=') ? s : '' }

export const sfuDaCauHinh = (env: Pick<Env, 'REALTIME_APP_ID' | 'REALTIME_APP_SECRET'>): boolean => !!env.REALTIME_APP_ID && !!env.REALTIME_APP_SECRET

interface TraSfu { ok: boolean; http: number; j: Row; ma: string }
/** Một lệnh tới SFU. Lỗi mạng / quá hạn ⇒ `http: 0`. Lỗi của SFU nằm ở mã HTTP, `errorCode` cấp trên, hoặc `errorCode` của TỪNG track / kênh (HTTP 200 vẫn có thể lỗi). */
async function goiSfu(env: Env, phuongThuc: 'POST' | 'PUT', duong: string, than?: unknown): Promise<TraSfu> {
  try {
    const r = await fetch(`${GOC_SFU}/${encodeURIComponent(env.REALTIME_APP_ID!)}${duong}`, {
      method: phuongThuc,
      headers: { authorization: `Bearer ${env.REALTIME_APP_SECRET!}`, 'content-type': 'application/json' },
      ...(than === undefined ? {} : { body: JSON.stringify(than) }),
      signal: AbortSignal.timeout(HAN_GOI_MS),
    })
    const j = ((await r.json().catch(() => null)) ?? {}) as Row
    const muc = [...(Array.isArray(j.tracks) ? j.tracks : []), ...(Array.isArray(j.dataChannels) ? j.dataChannels : []), ...(j.dataChannel && typeof j.dataChannel === 'object' ? [j.dataChannel] : [])] as Row[]
    const ma = str(j.errorCode) || str(muc.find((x) => x && str(x.errorCode))?.errorCode)
    return { ok: r.ok && !ma, http: r.status, j, ma }
  } catch { return { ok: false, http: 0, j: {}, ma: '' } }
}
const loiSfu = (r: TraSfu, buoc: string): Row => ({ ok: false, lyDo: r.http ? 'sfu-loi' : 'sfu-mat', buoc, http: r.http, ...(r.ma ? { ma: r.ma.slice(0, 60) } : {}) })
const sdpCua = (j: Row): { sdp: string; loai: string } | null => { const d = j.sessionDescription as Row | undefined; return d && typeof d.sdp === 'string' ? { sdp: d.sdp, loai: str(d.type) } : null }

interface TrackGui { mid: string; ten: string }
const tracksGui = (v: unknown): TrackGui[] => (Array.isArray(v) ? v : []).slice(0, 4).map((x) => ({ mid: str((x as Row)?.mid), ten: str((x as Row)?.ten) })).filter((x) => MID.test(x.mid) && TEN.test(x.ten))
const tenNhan = (v: unknown): string[] => (Array.isArray(v) ? v : []).map(str).filter((t) => TEN.test(t)).slice(0, 4)

/** Phát track của máy gọi (lời mời SDP của máy khách) ⇒ câu trả lời của SFU. */
async function phatTrack(env: Env, phien: string, sdp: string, tracks: TrackGui[]): Promise<Row> {
  const r = await goiSfu(env, 'POST', `/sessions/${phien}/tracks/new`, { sessionDescription: { type: 'offer', sdp }, tracks: tracks.map((t) => ({ location: 'local', mid: t.mid, trackName: t.ten })) })
  const d = sdpCua(r.j)
  if (!r.ok || !d) return loiSfu(r, 'phat')
  return { ok: true, phien, sdp: d.sdp, loai: d.loai || 'answer' }
}
/** Kéo track của phiên `nguon` về phiên máy gọi ⇒ lời mời của SFU (máy khách trả lời rồi gọi `dap`). */
async function nhanTrack(env: Env, phien: string, nguon: string, ten: string[]): Promise<Row> {
  const r = await goiSfu(env, 'POST', `/sessions/${phien}/tracks/new`, { tracks: ten.map((t) => ({ location: 'remote', sessionId: nguon, trackName: t })) })
  const d = sdpCua(r.j)
  if (!r.ok || !d) return loiSfu(r, 'nhan')
  const tracks = (Array.isArray(r.j.tracks) ? (r.j.tracks as Row[]) : []).map((x) => ({ ten: str(x.trackName), mid: str(x.mid) }))
  return { ok: true, phien, sdp: d.sdp, loai: d.loai || 'offer', tracks, canDap: r.j.requiresImmediateRenegotiation !== false }
}

/** Tên track mic của em được gọi lên bảng — do MÁY CHỦ đặt (máy em không tự chọn tên). */
export const TEN_TRACK_MIC_EM = 'mic'
/** Đóng track ở SFU không cần máy khách (force) — phòng gọi khi THU mic của em. Chưa cấu hình / lỗi ⇒ bỏ qua, không ném. */
export async function dongTrackSfu(env: Env, phien: string, mids: readonly string[]): Promise<boolean> {
  if (!sfuDaCauHinh(env) || !MA_PHIEN.test(phien)) return false
  const ds = mids.filter((m) => MID.test(m))
  if (!ds.length) return false
  const r = await goiSfu(env, 'PUT', `/sessions/${phien}/tracks/close`, { tracks: ds.map((mid) => ({ mid })), force: true })
  return r.ok || r.ma === 'close_track_error'
}
/** EM phát mic: (1) hỏi phòng em có đang được gọi lên bảng không; (2) SFU nhận track; (3) báo phòng ghi — phòng từ chối (thầy vừa chấm / chuyển câu) ⇒ đóng track. */
async function phatMicEm(env: Env, ve: VeBpu, phien: string, sdp: string, mid: string): Promise<Row> {
  const kiem = await hoiPhongMic(env, ve.b, { buoc: 'kiem', sbd: ve.s }).catch(() => null)
  if (!kiem?.ok) return { ok: false, lyDo: 'chua-duoc-moi' }
  const r = await phatTrack(env, phien, sdp, [{ mid, ten: TEN_TRACK_MIC_EM }])
  if (!r.ok) return r
  const ghi = await hoiPhongMic(env, ve.b, { buoc: 'bat', sbd: ve.s, id: phien, tieng: TEN_TRACK_MIC_EM, mid }).catch(() => null)
  if (!ghi?.ok) { await dongTrackSfu(env, phien, [mid]); return { ok: false, lyDo: 'chua-duoc-moi', sdp: r.sdp, loai: r.loai } }
  return { ...r, ten: TEN_TRACK_MIC_EM }
}

/** Một lệnh `/bpu/live/<lenh>` đã có vé hợp lệ. */
async function lenhLive(env: Env, lenh: string, ve: VeBpu, b: Row): Promise<Row> {
  const laThay = ve.v === 'gv'
  // `turn`: thông tin TURN ngắn hạn cho RTCPeerConnection tới SFU (gọi TRƯỚC khi tạo PeerConnection; thiếu ⇒ máy khách chỉ dùng STUN như cũ)
  if (lenh === 'turn') { const ice = await layTurn(env); return ice ? { ok: true, ice } : { ok: false, lyDo: turnDaCauHinh(env) ? 'turn-loi' : 'chua-cau-hinh-turn' } }
  if (lenh === 'noi') {
    const sdp = sdpHop(b.sdp), tracks = tracksGui(b.tracks), nguon = phienHop(b.nguon), ten = tenNhan(b.ten)
    if (sdp && !laThay) return { ok: false, lyDo: 'chua-duoc-moi' }
    if (b.sdp != null && (!sdp || !tracks.length)) return { ok: false, lyDo: 'sai-than' }
    if (b.nguon != null && (!nguon || !ten.length)) return { ok: false, lyDo: 'sai-than' }
    const moi = await goiSfu(env, 'POST', '/sessions/new')
    const phien = phienHop(moi.j.sessionId)
    if (!moi.ok || !phien) return loiSfu(moi, 'phien')
    const r: Row = sdp ? await phatTrack(env, phien, sdp, tracks) : nguon ? await nhanTrack(env, phien, nguon, ten) : { ok: true, phien }
    return r.ok ? { ...r, ice: ICE } : r
  }
  const phien = phienHop(b.phien)
  if (!phien) return { ok: false, lyDo: 'sai-than' }
  if (lenh === 'dap') {
    const sdp = sdpHop(b.sdp)
    if (!sdp) return { ok: false, lyDo: 'sai-than' }
    const r = await goiSfu(env, 'PUT', `/sessions/${phien}/renegotiate`, { sessionDescription: { type: 'answer', sdp } })
    if (!r.ok) return loiSfu(r, 'dap')
    if (b.kenh !== true) return { ok: true }
    // Dựng đường DataChannel trên phiên đã có media (tài liệu «Add DataChannels to a media connection»): SFU trả lời mời mới, máy khách trả lời rồi gọi `dap` lần nữa.
    const k = await goiSfu(env, 'POST', `/sessions/${phien}/datachannels/establish`, { dataChannel: { location: 'remote', dataChannelName: 'server-events' } })
    const d = sdpCua(k.j)
    if (!k.ok || !d) return { ...loiSfu(k, 'kenh-dung'), dapXong: true }
    return { ok: true, sdp: d.sdp, loai: d.loai || 'offer' }
  }
  if (lenh === 'kenh') {
    const ten = str(b.ten), nguon = phienHop(b.nguon)
    if (!TEN.test(ten) || (b.nguon != null && !nguon)) return { ok: false, lyDo: 'sai-than' }
    if (!nguon && !laThay) return { ok: false, lyDo: 'chua-duoc-moi' }
    const r = await goiSfu(env, 'POST', `/sessions/${phien}/datachannels/new`, { dataChannels: [nguon ? { location: 'remote', sessionId: nguon, dataChannelName: ten, ...CHINH_SACH_KENH } : { location: 'local', dataChannelName: ten, ...CHINH_SACH_KENH }] })
    const id = Number((Array.isArray(r.j.dataChannels) ? (r.j.dataChannels as Row[])[0] : undefined)?.id)
    if (!r.ok || !Number.isInteger(id) || id < 0 || id > 65534) return loiSfu(r, 'kenh')
    return { ok: true, id, ...CHINH_SACH_KENH }
  }
  if (lenh === 'phat') {
    const sdp = sdpHop(b.sdp), tracks = tracksGui(b.tracks)
    // AN TOÀN: em chỉ phát được MỘT track mic, và chỉ khi PHÒNG xác nhận em đang được gọi lên bảng lúc đang live (không tin lời máy em).
    if (!laThay) { const mid = str(((Array.isArray(b.tracks) ? b.tracks : [])[0] as Row | undefined)?.mid); return sdp && MID.test(mid) ? phatMicEm(env, ve, phien, sdp, mid) : { ok: false, lyDo: 'sai-than' } }
    if (!sdp || !tracks.length) return { ok: false, lyDo: 'sai-than' }
    return phatTrack(env, phien, sdp, tracks)
  }
  if (lenh === 'nhan') {
    const nguon = phienHop(b.nguon), ten = tenNhan(b.ten)
    if (!nguon || !ten.length) return { ok: false, lyDo: 'sai-than' }
    return nhanTrack(env, phien, nguon, ten)
  }
  if (lenh === 'dong') {
    const mids = (Array.isArray(b.mids) ? b.mids : []).map(str).filter((m) => MID.test(m)).slice(0, 8)
    const kenh = (Array.isArray(b.kenh) ? b.kenh : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 65534).slice(0, 8)
    const [t, k] = await Promise.all([
      mids.length ? goiSfu(env, 'PUT', `/sessions/${phien}/tracks/close`, { tracks: mids.map((mid) => ({ mid })), force: true }) : null,
      kenh.length ? goiSfu(env, 'PUT', `/sessions/${phien}/datachannels/close`, { dataChannels: kenh.map((id) => ({ id })) }) : null,
    ])
    // `close_track_error` = đã đóng / không còn ⇒ coi như xong (tài liệu «Interpret close results»).
    const hong = [t, k].find((r) => r && !r.ok && r.ma !== 'close_track_error')
    return hong ? loiSfu(hong, 'dong') : { ok: true }
  }
  return { ok: false, lyDo: 'khong-co-lenh' }
}

/** `POST /bpu/live/<lenh> { ve, … }` — kiểm công tắc Bình Phản Ứng, khoá SFU, vé; rồi mới gọi SFU. Không ném. */
export async function bpuLive(env: Env, duong: string, b: Row, nay = Date.now()): Promise<Row> {
  if (!bpuBat(env)) return { ok: false, lyDo: 'tat' }
  if (!sfuDaCauHinh(env)) return { ok: false, lyDo: 'chua-cau-hinh' }
  const ve = await kiemVeBpu(env.MA_BI_MAT, b.ve, nay)
  if (!ve) return { ok: false, lyDo: 've' }
  try { return await lenhLive(env, duong.slice(DUONG_LIVE.length), ve, b) } catch { return { ok: false, lyDo: 'sfu-mat' } }
}

// Cửa này đi THẲNG (ws-thang.ts), trước các lớp bọc của index.ts ⇒ tự gắn CORS (app chạy ở nguồn khác Worker). Lệnh OPTIONS vẫn do index.ts trả như mọi đường.
const DAU_TRA = { 'content-type': 'application/json;charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, x-ma-bi-mat', 'cache-control': 'no-store' }
export async function cuaLive(req: Request, env: Env): Promise<Response> {
  let b: Row = {}
  try { const chu = await req.text(); if (chu.length <= 2 * SDP_TOI_DA) b = (JSON.parse(chu) ?? {}) as Row } catch { /* thân hỏng ⇒ vé rỗng ⇒ từ chối bên dưới */ }
  const r = await bpuLive(env, new URL(req.url).pathname, b && typeof b === 'object' ? b : {})
  return new Response(JSON.stringify(r), { status: 200, headers: DAU_TRA })
}
