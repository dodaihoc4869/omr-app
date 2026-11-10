// @vitest-environment node
// LIVE BẢNG — cửa `/bpu/live/*` (server/src/live-sfu.ts) với fetch GIẢ thay Cloudflare Realtime SFU. Khoá:
// (1) chưa cấu hình khoá ⇒ `chua-cau-hinh`, KHÔNG gọi ra ngoài; (2) vé sai / hết hạn ⇒ từ chối, không gọi SFU; (3) App Secret chỉ đi trong header tới SFU,
// không bao giờ nằm trong câu trả về máy khách; (4) đúng đường + thân theo tài liệu Realtime SFU (sessions/new, tracks/new, renegotiate, datachannels/*, tracks/close);
// (5) em KHÔNG phát được track / kênh (Đợt 2 mới có mời nói); (6) 0 lệnh D1; (7) lỗi của SFU (HTTP, errorCode từng track) ra `sfu-loi`, mất mạng ra `sfu-mat`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bpuLive, cuaLive, sfuDaCauHinh } from '../server/src/live-sfu'
import { kyVeBpu } from '../server/src/phong-binh-phan-ung'
import { wsThang } from '../server/src/ws-thang'
import type { Env } from '../server/src/kieu'

const BI_MAT_SFU = 'bi-mat-sfu-khong-duoc-lo'
const SDP = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n'
const PHIEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90', NGUON = 'ffeeddccbbaa99887766554433221100'

type Goi = { url: string; method: string; than: Record<string, unknown> | null; auth: string | null }
function gia(tra: (g: Goi) => { status?: number; j: unknown } | Error) {
  const ds: Goi[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, o?: RequestInit) => {
    const g: Goi = { url: String(url), method: o?.method ?? 'GET', than: o?.body ? (JSON.parse(String(o.body)) as Record<string, unknown>) : null, auth: new Headers(o?.headers).get('authorization') }
    ds.push(g)
    const r = tra(g)
    if (r instanceof Error) throw r
    return new Response(JSON.stringify(r.j), { status: r.status ?? 200, headers: { 'content-type': 'application/json' } })
  }))
  return ds
}
/** SFU giả trả đúng dạng tài liệu cho từng đường. */
const sfuTot = (g: Goi) => {
  if (g.url.endsWith('/sessions/new')) return { status: 201, j: { sessionId: PHIEN } }
  if (g.url.endsWith('/tracks/new')) {
    const local = (g.than?.tracks as { location: string }[])[0]!.location === 'local'
    return local ? { j: { sessionDescription: { type: 'answer', sdp: SDP + 'a=tra-loi\r\n' }, tracks: [{ mid: '0', trackName: 'thay' }] } }
      : { j: { requiresImmediateRenegotiation: true, sessionDescription: { type: 'offer', sdp: SDP + 'a=loi-moi\r\n' }, tracks: [{ mid: '0', trackName: 'thay', sessionId: NGUON }] } }
  }
  if (g.url.endsWith('/renegotiate')) return { j: {} }
  if (g.url.endsWith('/datachannels/establish')) return { j: { requiresImmediateRenegotiation: true, sessionDescription: { type: 'offer', sdp: SDP + 'a=kenh\r\n' }, dataChannel: { id: 0, dataChannelName: 'server-events' } } }
  if (g.url.endsWith('/datachannels/new')) return { j: { dataChannels: [{ id: 2, dataChannelName: 'net' }] } }
  return { j: { tracks: [], dataChannels: [] } }
}

/** D1 nổ ngay khi bị đụng ⇒ khoá «0 lệnh D1». */
const DB_CAM = new Proxy({}, { get() { throw new Error('cửa live không được đụng D1') } })
const env = (o: Partial<Env> = {}): Env => ({ MA_BI_MAT: 'bi-mat-thay', PHONG_BPU: {} as never, DB: DB_CAM as never, REALTIME_APP_ID: 'app123', REALTIME_APP_SECRET: BI_MAT_SFU, ...o } as Env)
const veGv = (e: Env) => kyVeBpu(e.MA_BI_MAT, { b: 'b1', s: '', v: 'gv', h: Date.now() + 60_000 })
const veHs = (e: Env, s = 'S1') => kyVeBpu(e.MA_BI_MAT, { b: 'b1', s, v: 'hs', h: Date.now() + 60_000 })

afterEach(() => { vi.unstubAllGlobals() })

describe('cửa /bpu/live/* — trung gian tới Cloudflare Realtime SFU', () => {
  it('chưa cấu hình khoá SFU ⇒ chua-cau-hinh, không gọi ra ngoài (live vẫn chạy phần hình qua WebSocket)', async () => {
    const ds = gia(sfuTot)
    for (const e of [env({ REALTIME_APP_ID: undefined }), env({ REALTIME_APP_SECRET: '' }), env({ REALTIME_APP_ID: undefined, REALTIME_APP_SECRET: undefined })]) {
      expect(sfuDaCauHinh(e)).toBe(false)
      expect(await bpuLive(e, '/bpu/live/noi', { ve: await veGv(e) })).toEqual({ ok: false, lyDo: 'chua-cau-hinh' })
    }
    expect(ds.length).toBe(0)
    expect(sfuDaCauHinh(env())).toBe(true)
  })
  it('Bình Phản Ứng tắt ⇒ tat; vé sai / vé hết hạn / thiếu vé ⇒ ve — đều không gọi SFU', async () => {
    const ds = gia(sfuTot), e = env()
    expect(await bpuLive(env({ TAT_BPU: '1' }), '/bpu/live/noi', { ve: await veGv(e) })).toEqual({ ok: false, lyDo: 'tat' })
    expect(await bpuLive(e, '/bpu/live/noi', {})).toEqual({ ok: false, lyDo: 've' })
    expect(await bpuLive(e, '/bpu/live/noi', { ve: 'abc.def' })).toEqual({ ok: false, lyDo: 've' })
    const cu = await kyVeBpu(e.MA_BI_MAT, { b: 'b1', s: 'S1', v: 'hs', h: Date.now() - 1 })
    expect(await bpuLive(e, '/bpu/live/noi', { ve: cu })).toEqual({ ok: false, lyDo: 've' })
    const veKhoaKhac = await kyVeBpu('bi-mat-khac', { b: 'b1', s: '', v: 'gv', h: Date.now() + 60_000 })
    expect(await bpuLive(e, '/bpu/live/noi', { ve: veKhoaKhac })).toEqual({ ok: false, lyDo: 've' })
    expect(ds.length).toBe(0)
  })
  it('THẦY nối: tạo phiên + phát track trong lời mời đầu; App Secret chỉ ở header gửi SFU, không trong câu trả về', async () => {
    const ds = gia(sfuTot), e = env()
    const r = await bpuLive(e, '/bpu/live/noi', { ve: await veGv(e), sdp: SDP, tracks: [{ mid: '0', ten: 'thay' }] })
    expect(r).toMatchObject({ ok: true, phien: PHIEN, loai: 'answer' })
    expect(String(r.sdp)).toContain('a=tra-loi')
    expect(r.ice).toEqual([{ urls: 'stun:stun.cloudflare.com:3478' }])
    expect(ds.map((g) => `${g.method} ${g.url}`)).toEqual([
      'POST https://rtc.live.cloudflare.com/v1/apps/app123/sessions/new',
      `POST https://rtc.live.cloudflare.com/v1/apps/app123/sessions/${PHIEN}/tracks/new`,
    ])
    expect(ds[0]!.than).toBeNull() // sessions/new không có thân (tài liệu)
    expect(ds[1]!.than).toEqual({ sessionDescription: { type: 'offer', sdp: SDP }, tracks: [{ location: 'local', mid: '0', trackName: 'thay' }] })
    for (const g of ds) expect(g.auth).toBe(`Bearer ${BI_MAT_SFU}`)
    expect(JSON.stringify(r)).not.toContain(BI_MAT_SFU)
    expect(JSON.stringify(r)).not.toContain('app123')
  })
  it('EM nối: tạo phiên + kéo track của phiên thầy ⇒ lời mời của SFU; trả lời + dựng đường DataChannel; nhận kênh «net» không thứ tự, không gửi lại', async () => {
    const ds = gia(sfuTot), e = env(), ve = await veHs(e)
    const r = await bpuLive(e, '/bpu/live/noi', { ve, nguon: NGUON, ten: ['thay'] })
    expect(r).toMatchObject({ ok: true, phien: PHIEN, loai: 'offer', canDap: true, tracks: [{ ten: 'thay', mid: '0' }] })
    expect(ds[1]!.than).toEqual({ tracks: [{ location: 'remote', sessionId: NGUON, trackName: 'thay' }] })
    const d = await bpuLive(e, '/bpu/live/dap', { ve, phien: PHIEN, sdp: SDP, kenh: true })
    expect(d).toMatchObject({ ok: true, loai: 'offer' })
    expect(ds[2]).toMatchObject({ method: 'PUT', url: `https://rtc.live.cloudflare.com/v1/apps/app123/sessions/${PHIEN}/renegotiate`, than: { sessionDescription: { type: 'answer', sdp: SDP } } })
    expect(ds[3]).toMatchObject({ method: 'POST', url: `https://rtc.live.cloudflare.com/v1/apps/app123/sessions/${PHIEN}/datachannels/establish`, than: { dataChannel: { location: 'remote', dataChannelName: 'server-events' } } })
    expect(await bpuLive(e, '/bpu/live/dap', { ve, phien: PHIEN, sdp: SDP })).toEqual({ ok: true })
    const k = await bpuLive(e, '/bpu/live/kenh', { ve, phien: PHIEN, ten: 'net', nguon: NGUON })
    expect(k).toEqual({ ok: true, id: 2, ordered: false, maxRetransmits: 0 })
    expect(ds[5]!.than).toEqual({ dataChannels: [{ location: 'remote', sessionId: NGUON, dataChannelName: 'net', ordered: false, maxRetransmits: 0 }] })
    const dong = await bpuLive(e, '/bpu/live/dong', { ve, phien: PHIEN, mids: ['0'], kenh: [2] })
    expect(dong).toEqual({ ok: true })
    expect(ds.slice(6).map((g) => [g.method, g.url.split('/').slice(-2).join('/'), g.than])).toEqual([
      ['PUT', 'tracks/close', { tracks: [{ mid: '0' }], force: true }],
      ['PUT', 'datachannels/close', { dataChannels: [{ id: 2 }] }],
    ])
  })
  it('THẦY cấp kênh «net» (phát) và phát thêm track trên phiên đã có', async () => {
    const ds = gia(sfuTot), e = env(), ve = await veGv(e)
    expect(await bpuLive(e, '/bpu/live/kenh', { ve, phien: PHIEN, ten: 'net' })).toEqual({ ok: true, id: 2, ordered: false, maxRetransmits: 0 })
    expect(ds[0]!.than).toEqual({ dataChannels: [{ location: 'local', dataChannelName: 'net', ordered: false, maxRetransmits: 0 }] })
    expect(await bpuLive(e, '/bpu/live/phat', { ve, phien: PHIEN, sdp: SDP, tracks: [{ mid: '1', ten: 'khach' }] })).toMatchObject({ ok: true, loai: 'answer' })
  })
  it('AN TOÀN: em không phát được track, không mở được kênh phát (Đợt 2 mới có mời nói) — không gọi SFU', async () => {
    const ds = gia(sfuTot), e = env(), ve = await veHs(e)
    expect(await bpuLive(e, '/bpu/live/phat', { ve, phien: PHIEN, sdp: SDP, tracks: [{ mid: '0', ten: 'em' }] })).toEqual({ ok: false, lyDo: 'chua-duoc-moi' })
    expect(await bpuLive(e, '/bpu/live/noi', { ve, sdp: SDP, tracks: [{ mid: '0', ten: 'em' }] })).toEqual({ ok: false, lyDo: 'chua-duoc-moi' })
    expect(await bpuLive(e, '/bpu/live/kenh', { ve, phien: PHIEN, ten: 'net' })).toEqual({ ok: false, lyDo: 'chua-duoc-moi' })
    expect(ds.length).toBe(0)
  })
  it('thân sai dạng (mã phiên lạ, tên track lạ, SDP quá dài) ⇒ sai-than, không gọi SFU; lệnh lạ ⇒ khong-co-lenh', async () => {
    const ds = gia(sfuTot), e = env(), ve = await veGv(e)
    expect(await bpuLive(e, '/bpu/live/dap', { ve, phien: '../apps/khac', sdp: SDP })).toEqual({ ok: false, lyDo: 'sai-than' })
    expect(await bpuLive(e, '/bpu/live/dap', { ve, phien: PHIEN, sdp: 'x' })).toEqual({ ok: false, lyDo: 'sai-than' })
    expect(await bpuLive(e, '/bpu/live/dap', { ve, phien: PHIEN, sdp: 'v=0' + 'a'.repeat(50_000) })).toEqual({ ok: false, lyDo: 'sai-than' })
    expect(await bpuLive(e, '/bpu/live/noi', { ve, nguon: 'ngan', ten: ['thay'] })).toEqual({ ok: false, lyDo: 'sai-than' })
    expect(await bpuLive(e, '/bpu/live/noi', { ve, nguon: NGUON, ten: ['Tên Lạ!'] })).toEqual({ ok: false, lyDo: 'sai-than' })
    expect(await bpuLive(e, '/bpu/live/kenh', { ve, phien: PHIEN, ten: 'NET' })).toEqual({ ok: false, lyDo: 'sai-than' })
    expect(await bpuLive(e, '/bpu/live/la', { ve, phien: PHIEN })).toEqual({ ok: false, lyDo: 'khong-co-lenh' })
    expect(ds.length).toBe(0)
  })
  it('SFU lỗi: mã HTTP, errorCode cấp trên, errorCode của từng track (HTTP 200), mất mạng', async () => {
    const e = env(), ve = await veHs(e)
    gia((g) => (g.url.endsWith('/sessions/new') ? { status: 401, j: { errorCode: 'unauthorized', errorDescription: 'x' } } : sfuTot(g)))
    expect(await bpuLive(e, '/bpu/live/noi', { ve })).toEqual({ ok: false, lyDo: 'sfu-loi', buoc: 'phien', http: 401, ma: 'unauthorized' })
    gia((g) => (g.url.endsWith('/tracks/new') ? { j: { tracks: [{ errorCode: 'not_found_track_error', errorDescription: 'x', trackName: 'thay' }] } } : sfuTot(g)))
    expect(await bpuLive(e, '/bpu/live/noi', { ve, nguon: NGUON, ten: ['thay'] })).toEqual({ ok: false, lyDo: 'sfu-loi', buoc: 'nhan', http: 200, ma: 'not_found_track_error' })
    gia(() => new Error('mất mạng'))
    expect(await bpuLive(e, '/bpu/live/noi', { ve })).toEqual({ ok: false, lyDo: 'sfu-mat', buoc: 'phien', http: 0 })
    // Đóng: track đã đóng sẵn (`close_track_error`) coi như xong.
    gia(() => ({ j: { tracks: [{ mid: '0', errorCode: 'close_track_error' }] } }))
    expect(await bpuLive(e, '/bpu/live/dong', { ve, phien: PHIEN, mids: ['0'] })).toEqual({ ok: true })
    // Trả lời SDP được nhận nhưng dựng kênh hỏng ⇒ báo rõ `dapXong` để máy em vẫn có tiếng, điểm rơi về WebSocket.
    gia((g) => (g.url.endsWith('/establish') ? { status: 500, j: {} } : sfuTot(g)))
    expect(await bpuLive(e, '/bpu/live/dap', { ve, phien: PHIEN, sdp: SDP, kenh: true })).toEqual({ ok: false, lyDo: 'sfu-loi', buoc: 'kenh-dung', http: 500, dapXong: true })
  })
  it('cửa HTTP đi thẳng: POST /bpu/live/* trả JSON có CORS; đường khác không bị cửa này bắt', async () => {
    gia(sfuTot)
    const e = env()
    const r = await wsThang(new Request('https://omr.example/bpu/live/noi', { method: 'POST', body: JSON.stringify({ ve: await veHs(e), nguon: NGUON, ten: ['thay'] }) }), e)!
    expect(r.status).toBe(200)
    expect(r.headers.get('access-control-allow-origin')).toBe('*')
    expect(r.headers.get('content-type')).toContain('application/json')
    expect(await r.json()).toMatchObject({ ok: true, phien: PHIEN })
    expect(wsThang(new Request('https://omr.example/hs/bpu/ve', { method: 'POST', body: '{}' }), e)).toBeNull()
    expect(wsThang(new Request('https://omr.example/gv/x?u=/bpu/live/noi', { method: 'POST', body: '{}' }), e)).toBeNull()
    // Thân hỏng ⇒ từ chối gọn (không ném).
    const hong = await cuaLive(new Request('https://omr.example/bpu/live/noi', { method: 'POST', body: '{{{' }), e)
    expect(await hong.json()).toEqual({ ok: false, lyDo: 've' })
  })
})
