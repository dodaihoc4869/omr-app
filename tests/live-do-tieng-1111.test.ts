// ĐO TIẾNG TỪ XA (11/11 tối — thầy «mất tiếng thật» mà mọi bộ thử đều xanh): máy em / máy thầy tự đo 2 giây (ICE, đường, kb/s, năng lượng, thẻ phát, mic gửi),
// gửi kèm `live-do` (trường `ti`); phòng THẬT giữ bản mới nhất mỗi máy, chuyển cho máy thầy (`may`) và ghi MỘT dòng nhật ký máy chủ mỗi 10 giây khi đang live.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chupTieng, tomTatTieng } from '../src/lib/live/do-tieng'
import { dongMay, ngheThat, sachTieng, viSaoCam, type SoTieng } from '../src/lib/live/so-tieng'
import { chu, datWebSocketPairGia, taoPhongGia } from './_live-phong-gia'

const tot: SoTieng = { cs: 'connected', ice: 'connected', uv: 'host/udp', n: { kb: 58, nl: 12.5, goi: 100, pt: { d: 0, ct: 2, m: 0, v: 1 } } }

describe('phần thuần: «đang nghe thật» + lý do câm + dòng gọn', () => {
  it('nghe thật = có kb/s, có năng lượng, thẻ chạy, không tắt tiếng, âm lượng > 0', () => {
    expect(ngheThat(tot.n)).toBe(true)
    expect(ngheThat({ ...tot.n!, nl: 0 })).toBe(false)
    expect(ngheThat({ ...tot.n!, pt: { d: 1, ct: 0, m: 0, v: 1 } })).toBe(false)
    expect(ngheThat({ ...tot.n!, pt: { d: 0, ct: 2, m: 1, v: 1 } })).toBe(false)
    expect(ngheThat(undefined)).toBe(false)
  })
  it('lý do câm theo đúng thứ tự tầng: chưa nối · ICE hỏng · không gói · thẻ bị chặn · có gói mà không năng lượng', () => {
    expect(viSaoCam(tot)).toBe('')
    expect(viSaoCam({ cs: 'khong', ice: 'khong', uv: '' })).toBe('chưa nối máy chủ tiếng')
    expect(viSaoCam({ cs: 'failed', ice: 'failed', uv: '' })).toMatch(/ICE hỏng/)
    expect(viSaoCam({ ...tot, n: { ...tot.n!, kb: 0 } })).toMatch(/không nhận được gói/)
    expect(viSaoCam({ ...tot, n: { ...tot.n!, pt: { d: 1, ct: 0, m: 0, v: 1 } } })).toMatch(/CHƯA phát/)
    expect(viSaoCam({ ...tot, n: { ...tot.n!, nl: 0 } })).toMatch(/KHÔNG có năng lượng/)
  })
  it('trình duyệt KHÔNG báo năng lượng (null) ≠ không có tiếng: «nghe thật» dựa vào kb/s + thẻ phát, không kết luận «câm từ nguồn»', () => {
    const n = { ...tot.n!, nl: null }
    expect(ngheThat(n)).toBe(true)
    expect(viSaoCam({ ...tot, n })).toBe('')
    expect(dongMay('Vy', { ...tot, n })).toBe('Vy: ICE ok (host/udp) · nhận 58 kb/s · năng lượng ? · loa đang phát')
    expect(sachTieng({ ...tot, n: { ...tot.n, nl: undefined } })?.n?.nl).toBeNull()
  })
  it('ICE hỏng làm thư viện đóng phiên (cs khong) ⇒ vẫn nói đúng «ICE hỏng» nhờ lý do lần nối cuối (`l`), không lẫn với «chưa nối»', () => {
    expect(viSaoCam({ cs: 'khong', ice: 'khong', uv: '', l: 'khong-noi' })).toMatch(/ICE hỏng/)
    expect(viSaoCam({ cs: 'khong', ice: 'khong', uv: '', l: 've' })).toBe('nối máy chủ tiếng lỗi (ve)')
    expect(sachTieng({ cs: 'khong', ice: 'khong', uv: '', l: 'khong-noi' })?.l).toBe('khong-noi')
  })
  it('dòng gọn cho cửa sổ nút Live', () => {
    expect(dongMay('Gia Huy', tot)).toBe('Gia Huy: ICE ok (host/udp) · nhận 58 kb/s · năng lượng ↑ · loa đang phát')
    expect(dongMay('Minh', { cs: 'failed', ice: 'failed', uv: '' })).toBe('Minh: ICE failed · ⚠ ICE hỏng (mạng chặn đường tiếng)')
  })
  it('làm sạch tin nhận từ máy khác: chỉ giữ trường biết, chữ ngắn, số sai ⇒ 0', () => {
    const s = sachTieng({ cs: 'connected'.repeat(9), ice: 'connected', uv: 'relay/tcp', n: { kb: '58', nl: 3, goi: 9, pt: { d: true, ct: 'x', m: 0, v: 1 } }, la: 'bỏ', tg: 'co' })
    expect(s).toEqual({ cs: 'connected'.repeat(9).slice(0, 24), ice: 'connected', uv: 'relay/tcp', tg: 'co', n: { kb: 0, nl: 3, goi: 9, pt: { d: 1, ct: 0, m: 0, v: 1 } } })
    expect(sachTieng(null)).toBeNull()
  })
})

describe('đo trên trình duyệt (bộ nhận / bộ gửi / thẻ phát giả)', () => {
  it('hai lần chụp cách 2 giây ⇒ kb/s, năng lượng tăng, currentTime tăng; đường đang dùng lấy từ cặp ứng viên đã chọn', async () => {
    let byte = 0, nl = 0, ct = 10, gb = 0
    const the = { srcObject: {}, paused: false, muted: false, volume: 1, get currentTime() { return ct } } as unknown as HTMLMediaElement
    const thu = { getStats: async () => new Map([['i', { type: 'inbound-rtp', bytesReceived: byte, packetsReceived: byte / 100, totalAudioEnergy: nl }]]) } as unknown as RTCRtpReceiver
    const g = { getStats: async () => new Map<string, unknown>([['o', { type: 'outbound-rtp', bytesSent: gb }], ['m', { type: 'media-source', audioLevel: 0.3, totalAudioEnergy: gb / 1e5 }]]) } as unknown as RTCRtpSender
    const pc = { connectionState: 'connected', iceConnectionState: 'connected', getStats: async () => new Map<string, unknown>([['l1', { type: 'local-candidate', id: 'l1', candidateType: 'relay', relayProtocol: 'tcp' }], ['cp', { type: 'candidate-pair', nominated: true, state: 'succeeded', localCandidateId: 'l1' }]]) } as unknown as RTCPeerConnection
    const a = await chupTieng({ pc, n: { thu, the }, g }, 0)
    byte = 16_000; nl = 0.05; ct = 12; gb = 15_000
    const t = tomTatTieng(a, await chupTieng({ pc, n: { thu, the }, g }, 2000))
    expect(t).toMatchObject({ cs: 'connected', ice: 'connected', uv: 'relay/tcp', n: { kb: 64, nl: 50, goi: 160, pt: { d: 0, ct: 2, m: 0, v: 1 } }, g: { kb: 60, muc: 0.3 } })
    expect(ngheThat(t.n)).toBe(true)
  })
  it('chưa có phiên SFU (ICE hỏng ⇒ thư viện đóng phiên) ⇒ báo `khong`, không ném lỗi', async () => {
    const a = await chupTieng({ pc: null }, 0)
    expect(tomTatTieng(a, a)).toEqual({ cs: 'khong', ice: 'khong', uv: '' })
  })
})

describe('phòng THẬT: giữ bản đo mới nhất, chuyển máy thầy, ghi nhật ký máy chủ ≤ 1 dòng / 10 giây', () => {
  let log: ReturnType<typeof vi.spyOn>
  beforeEach(() => { datWebSocketPairGia(); vi.useFakeTimers({ now: 1_700_000_000_000 }); log = vi.spyOn(console, 'log').mockImplementation(() => undefined) })
  afterEach(() => { log.mockRestore(); vi.useRealTimers() })
  it('em gửi `live-do` kèm `ti` ⇒ máy thầy nhận `may` (đã làm sạch); thầy gửi `ti` của mình ⇒ vào nhật ký; nhật ký không ghi D1 / storage', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1'), e2 = await ph.noi('hs', 'S2')
    await ph.gui(gv, { t: 'live-bat' })
    for (const e of [e1, e2]) await ph.gui(e, { t: 'live-ok', dc: true, nghe: true })
    const ghi0 = ph.kho.ghi
    await ph.gui(e1, { t: 'live-do', d: 120, ti: tot })
    await ph.gui(e2, { t: 'live-do', ti: { cs: 'failed', ice: 'failed', uv: '', la: 'x'.repeat(500) } })
    await ph.gui(gv, { t: 'live-do', ti: { cs: 'connected', ice: 'connected', uv: 'host/udp', g: { kb: 63, muc: 0.4, nl: 9 } } })
    const den = chu(gv).filter((m) => m.t === 'live-do').pop() as { may?: { s: string; ti: SoTieng }[] }
    expect(den.may?.find((x) => x.s === 'S1')?.ti).toEqual(tot)
    const dong = log.mock.calls.map((c) => String(c[0])).filter((s) => s.includes('live_tieng'))
    expect(dong.length).toBe(1) // ≤ 1 dòng / 10 giây
    vi.setSystemTime(Date.now() + 10_500)
    await ph.gui(e2, { t: 'live-do', ti: { cs: 'failed', ice: 'failed', uv: '' } })
    const dong2 = log.mock.calls.map((c) => String(c[0])).filter((s) => s.includes('live_tieng'))
    expect(dong2.length).toBe(2)
    const j = JSON.parse(dong2[1]!) as { live_tieng: { thay: unknown[]; em: unknown[][] } }
    expect(j.live_tieng.thay.slice(0, 4)).toEqual(['GV', 'connected', 'connected', 'host/udp'])
    expect(j.live_tieng.em.map((x) => x.slice(0, 3))).toEqual(expect.arrayContaining([['S1', 'connected', 'connected'], ['S2', 'failed', 'failed']]))
    expect(dong2[1]!.length).toBeLessThan(600)
    expect(ph.kho.ghi).toBe(ghi0) // không ghi storage theo số đo
  })
})
