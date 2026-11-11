// TURN NGẮN HẠN (11/11 tối — CI: chặn UDP cả máy ⇒ câm cả hai chiều trên mọi bản vì chỉ có STUN): Worker cấp `iceServers` từ khoá TURN, đệm 4 giờ, bỏ cổng 53;
// thiếu khoá / lỗi ⇒ máy khách chạy như cũ (chỉ STUN). Máy khách lấy ICE trước khi tạo PeerConnection, đệm, lỗi ⇒ STUN.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { layTurn, locTurn, xoaDemTurn } from '../server/src/live-sfu'
import { ICE_MAC_DINH, layIce, xoaIceNho } from '../src/lib/live/sfu'

const ICE_CF = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] }, { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:turn.cloudflare.com:53?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'], username: 'u', credential: 'c' }]
let goi: { url: string; than: unknown }[] = []
beforeEach(() => {
  goi = []; xoaDemTurn(); xoaIceNho()
  vi.stubGlobal('fetch', vi.fn(async (u: string, o: { body?: string }) => { goi.push({ url: String(u), than: o?.body ? JSON.parse(o.body) : null }); return new Response(JSON.stringify({ iceServers: ICE_CF }), { status: 201 }) }))
})
afterEach(() => { vi.unstubAllGlobals() })
const env = { TURN_KEY_ID: 'khoa', TURN_KEY_API_TOKEN: 'token' } as never

describe('Worker: thông tin TURN ngắn hạn', () => {
  it('gọi đúng generate-ice-servers với ttl 24 giờ; bỏ URL cổng 53; 300 em gọi cùng lúc ⇒ MỘT lần gọi Cloudflare (đệm isolate)', async () => {
    const ds = await Promise.all(Array.from({ length: 300 }, () => layTurn(env)))
    expect(goi.length).toBe(1)
    expect(goi[0]!.url).toBe('https://rtc.live.cloudflare.com/v1/turn/keys/khoa/credentials/generate-ice-servers')
    expect(goi[0]!.than).toEqual({ ttl: 86400 })
    expect(ds[299]).toEqual([{ urls: ['stun:stun.cloudflare.com:3478'] }, { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'], username: 'u', credential: 'c' }])
    await layTurn(env, Date.now() + 3 * 3_600_000)
    expect(goi.length).toBe(1)
  })
  it('thiếu khoá ⇒ null, không gọi gì; Cloudflare lỗi ⇒ null', async () => {
    expect(await layTurn({} as never)).toBeNull()
    expect(goi.length).toBe(0)
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 403 })))
    expect(await layTurn(env)).toBeNull()
  })
  it('chỉ giữ stun: / turn: / turns:, thông tin đăng nhập là chuỗi', () => {
    expect(locTurn([{ urls: 'javascript:x' }, { urls: ['turn:a:80?transport=tcp'], username: 1 }, null])).toEqual([{ urls: ['turn:a:80?transport=tcp'] }])
  })
})

describe('Máy khách: ICE trước khi tạo PeerConnection', () => {
  const mt = (tra: unknown) => ({ fetch: vi.fn(async () => new Response(JSON.stringify(tra))), hen: (f: () => void, ms: number) => setTimeout(f, ms), huyHen: () => {}, dongHo: () => 0 })
  it('Worker có TURN ⇒ thêm TURN vào STUN; gọi lại ⇒ đệm, không hỏi lại', async () => {
    const m = mt({ ok: true, ice: ICE_CF.slice(1) })
    expect(await layIce(m as never, 'https://may', 've')).toEqual([...ICE_MAC_DINH, ICE_CF[1]])
    await layIce(m as never, 'https://may', 've')
    expect(m.fetch.mock.calls.length).toBe(1)
  })
  it('Worker chưa cấu hình TURN / bản Worker cũ ⇒ chỉ STUN như trước (không chặn live)', async () => {
    expect(await layIce(mt({ ok: false, lyDo: 'chua-cau-hinh-turn' }) as never, 'https://may', 've')).toEqual(ICE_MAC_DINH)
  })
})
