// @vitest-environment node
// KÊNH ĐẨY HAI THIẾT BỊ (thầy 31/10 «Làm luôn kênh đẩy», server/src/kenh-day.ts + ngan-hoc-sinh.ts, src/lib/kenh-day.ts):
//   · vé: chỉ token game ký đúng; vé giả / hết hạn / sai bí mật ⇒ bị từ chối; công tắc TAT_KENH_DAY ⇒ không phát vé, cửa 410;
//   · cửa WebSocket chuyển vào ĐÚNG ngăn của em (apac| hoặc d1| — chạm qua trung chuyển một lần), vé không theo vào ngăn, dấu máy lấy từ vé;
//   · lệnh làm đổi tiến độ CÓ ghi D1 ⇒ ngăn đẩy MỘT tin tới máy khác của em (không về máy vừa làm); lệnh đọc / lệnh ghi ngoài danh sách / một máy ⇒ không đẩy;
//   · lệnh POST: Worker đặt dấu máy từ token (xoá giá trị máy khách tự gửi).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import worker, { NganHocSinh } from '../server/src/index'
import { CHO_PHAT_MS, DUONG_KENH, dauMay, kenhVe, kiemVeKenh, kyVeKenh, loaiLenhDoi } from '../server/src/kenh-day'
import { DAU_CHUYEN_NGAN, DAU_MAY_NGAN, DAU_SBD_NGAN, DAU_TRONG_NGAN, DUONG_CHAM_NGAN, datXuLyNgan, xoaDemNganDinh, xoaEnvChungNgan } from '../server/src/ngan-hoc-sinh'
import { gameToken } from '../server/src/game-v2-auth'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

const BI_MAT = 'bi-mat-thu'
const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms))
const ctx = { waitUntil() {}, passThroughOnException() {} } as never

beforeEach(() => { xoaEnvChungNgan(); xoaDemNganDinh() })
afterEach(() => { datXuLyNgan((r, e, c) => worker.fetch(r, e, c)); xoaDemNganDinh() })

describe('vé kênh', () => {
  it('ký / kiểm: đúng ⇒ vé; hết hạn, sửa thân, sai bí mật, rác ⇒ null', async () => {
    const ve = await kyVeKenh(BI_MAT, { s: 'S1', m: 'abcd', h: Date.now() + 60_000 })
    expect(await kiemVeKenh(BI_MAT, ve)).toMatchObject({ s: 'S1', m: 'abcd' })
    expect(await kiemVeKenh('khac', ve)).toBeNull()
    expect(await kiemVeKenh(BI_MAT, await kyVeKenh(BI_MAT, { s: 'S1', m: '', h: Date.now() - 1 }))).toBeNull()
    const [than, ky] = ve.split('.')
    expect(await kiemVeKenh(BI_MAT, `${than!.slice(0, -2)}AA.${ky}`)).toBeNull()
    expect(await kiemVeKenh(BI_MAT, 'rac')).toBeNull()
    expect(ve).not.toContain('S1') // SBD không nằm rõ trên đường dẫn
  })

  it('kenhVe: token ký đúng ⇒ vé mang SBD + dấu máy; token giả ⇒ lỗi; tắt kênh / thiếu ngăn ⇒ tat', async () => {
    const env = { MA_BI_MAT: BI_MAT, NGAN_HS: {} } as unknown as Env
    const token = await gameToken(env, 'S1', 'mk')
    const r = await kenhVe(env, { token })
    expect(r.ok).toBe(true)
    expect(await kiemVeKenh(BI_MAT, r.ve)).toMatchObject({ s: 'S1', m: dauMay(token) })
    expect(dauMay(token)).toMatch(/^[0-9a-f]{16}$/)
    expect((await kenhVe(env, { token: `${btoa(JSON.stringify({ sbd: 'S1', exp: Date.now() + 9e6 }))}.00` })).ok).toBe(false)
    expect(await kenhVe({ ...env, TAT_KENH_DAY: '1' } as Env, { token })).toEqual({ ok: false, tat: true })
    expect(await kenhVe({ MA_BI_MAT: BI_MAT } as Env, { token })).toEqual({ ok: false, tat: true })
    // hai lần đăng nhập ⇒ hai dấu máy khác nhau
    await ngu(2)
    expect(dauMay(await gameToken(env, 'S1', 'mk'))).not.toBe(dauMay(token))
    expect(dauMay('rac')).toBe('')
  })

  it('danh sách lệnh đổi: chỉ lệnh em chủ động làm — không có lệnh đọc / làm mới', () => {
    expect(loaiLenhDoi('/game-v2/answer')).toBe('hoc')
    expect(loaiLenhDoi('/hs/chua-cau-sai/gon-nop')).toBe('sua')
    expect(loaiLenhDoi('/game-v2/hoc-tap-ktcn-nop')).toBe('kt')
    for (const doc of ['/game-v2/hoc-tap-sanh', '/game-v2/academic-sync', '/hs/thuong', '/hs/ke-hoach-ngay', '/mom/list', '/hs/kenh-ve', '/game-v2/hoc-tap-dem']) expect(loaiLenhDoi(doc)).toBeNull()
  })
})

// ---------------------------------------------------------------- cửa WebSocket ⇒ đúng ngăn
function nsGia(d: ReturnType<typeof taoD1That>) {
  const goi: { ten: string; duong: string; method: string; goiY?: string; dau: Record<string, string | null> }[] = []
  const ns = {
    idFromName: (ten: string) => ({ toString: () => ten }),
    get: (id: { toString(): string }, tuy?: { locationHint?: string }) => ({
      fetch: async (req: Request) => {
        const u = new URL(req.url)
        goi.push({ ten: id.toString(), duong: u.pathname + u.search, method: req.method, goiY: tuy?.locationHint, dau: { sbd: req.headers.get(DAU_SBD_NGAN), may: req.headers.get(DAU_MAY_NGAN), chuyen: req.headers.get(DAU_CHUYEN_NGAN), trong: req.headers.get(DAU_TRONG_NGAN) } })
        if (u.pathname === DUONG_CHAM_NGAN) return new Response(null, { status: 204, headers: { 'x-ngan': '1' } })
        return new Response('kenh', { status: 200 })
      },
    }),
  }
  return { env: { ...d.env, MA_BI_MAT: BI_MAT, NGAN_HS: ns } as unknown as Env, goi }
}
const moCua = (env: Env, ve: string | null, nang = true) =>
  worker.fetch(new Request(`https://x.test${DUONG_KENH}${ve === null ? '' : `?ve=${encodeURIComponent(ve)}`}`, { method: 'GET', headers: nang ? { upgrade: 'websocket' } : {} }), env, ctx)

describe('cửa kênh', () => {
  it('vé đúng ⇒ ngăn apac|<em> (gợi ý apac), vé không theo vào ngăn, dấu máy từ vé; thiếu nâng cấp 426, vé hỏng 403, tắt 410', async () => {
    const d = taoD1That()
    const { env, goi } = nsGia(d)
    env.TAT_NGAN_DINH = '1'
    const ve = await kyVeKenh(BI_MAT, { s: 'S1', m: 'mayA', h: Date.now() + 60_000 })
    expect((await moCua(env, ve)).status).toBe(200)
    expect(goi).toEqual([{ ten: 'apac|S1', duong: DUONG_KENH, method: 'GET', goiY: 'apac', dau: { sbd: 'S1', may: 'mayA', chuyen: null, trong: '1' } }])
    expect((await moCua(env, ve, false)).status).toBe(426)
    expect((await moCua(env, 'rac')).status).toBe(403)
    expect((await moCua(env, null)).status).toBe(403)
    expect((await moCua({ ...env, TAT_KENH_DAY: '1' } as Env, ve)).status).toBe(410)
    expect((await moCua({ ...env, TAT_NGAN_HS: '1' } as Env, ve)).status).toBe(410)
    expect(goi).toHaveLength(1)
  })

  it('có ngăn trung chuyển ⇒ chạm qua trung chuyển MỘT lần (tạo ngăn cạnh D1) rồi nối thẳng d1|<em>', async () => {
    const d = taoD1That()
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngan_dinh','{"v":3,"ds":["dinh|4"]}','x')`)
    const { env, goi } = nsGia(d)
    const ve = await kyVeKenh(BI_MAT, { s: 'S1', m: 'mayA', h: Date.now() + 60_000 })
    await moCua(env, ve)
    await moCua(env, ve)
    expect(goi.map((g) => [g.ten, g.duong, g.dau.chuyen])).toEqual([
      ['dinh|4', DUONG_CHAM_NGAN, 'd1|S1'],
      ['d1|S1', DUONG_KENH, null],
      ['d1|S1', DUONG_KENH, null],
    ])
  })

  it('lệnh POST qua ngăn: Worker đặt dấu máy từ token, xoá dấu máy khách tự gửi', async () => {
    const d = taoD1That()
    const { env, goi } = nsGia(d)
    env.TAT_NGAN_DINH = '1'
    const token = await gameToken(env, 'S1', 'mk')
    const post = (than: unknown) => worker.fetch(new Request('https://x.test/hs/thuong', { method: 'POST', headers: { 'content-type': 'application/json', [DAU_MAY_NGAN]: 'gia' }, body: JSON.stringify(than) }), env, ctx)
    await post({ token })
    expect(goi.at(-1)!.dau.may).toBe(dauMay(token))
    await post({ token: `${token.split('.')[0]}.zz` })
    expect(goi.at(-1)!.dau.may).toBeNull()
  })
})

// ---------------------------------------------------------------- ngăn đẩy tin
interface WsGia { gui: string[]; kem: unknown; send(x: string): void; close(): void; serializeAttachment(v: unknown): void; deserializeAttachment(): unknown }
const wsGia = (m: string): WsGia => ({ gui: [], kem: { m }, send(x) { this.gui.push(x) }, close() {}, serializeAttachment(v) { this.kem = v }, deserializeAttachment() { return this.kem } })

function nganCo(socks: WsGia[], them: Partial<Env> = {}) {
  const d = taoD1That()
  const env = { ...d.env, MA_BI_MAT: BI_MAT, ...them } as unknown as Env
  const state = { waitUntil() {}, getWebSockets: () => socks, acceptWebSocket: (ws: WsGia) => socks.push(ws) } as never
  const ngan = new NganHocSinh(state, env)
  // Lệnh giả trong ngăn: «mở rương» GHI một dòng; «/hs/thuong» chỉ đọc; «/hs/thuong/da-xem» ghi nhưng không phải lệnh đổi tiến độ.
  datXuLyNgan(async (req, e) => {
    const p = new URL(req.url).pathname
    if (p === '/hs/thuong') await e.DB.prepare('SELECT 1 AS x').first()
    else await e.DB.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').bind(`thu|${p}`, '1', 'x').run()
    return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })
  })
  const lenh = (duong: string, may: string) => ngan.fetch(new Request(`https://ngan${duong}`, { method: 'POST', headers: { [DAU_TRONG_NGAN]: '1', [DAU_SBD_NGAN]: 'S1', [DAU_MAY_NGAN]: may }, body: '{}' }))
  return { lenh }
}

describe('ngăn đẩy tin tới máy khác của em', () => {
  it('lệnh đổi có ghi ⇒ MỘT tin (gom) tới máy B, không về máy A vừa làm', async () => {
    const A = wsGia('mayA'), B = wsGia('mayB')
    const { lenh } = nganCo([A, B])
    await lenh('/hs/thuong/mo-ruong', 'mayA')
    await lenh('/game-v2/answer', 'mayA')
    expect(B.gui).toEqual([]) // chưa tới lúc gom xong
    await ngu(CHO_PHAT_MS + 150)
    expect(B.gui).toHaveLength(1)
    expect(JSON.parse(B.gui[0]!)).toEqual({ t: 'doi', k: ['thuong', 'hoc'] })
    expect(A.gui).toEqual([])
  })

  it('lệnh đọc / lệnh ghi ngoài danh sách / em chỉ có một máy / tắt kênh ⇒ không đẩy', async () => {
    const A = wsGia('mayA'), B = wsGia('mayB')
    const x = nganCo([A, B])
    await x.lenh('/hs/thuong', 'mayA')
    await x.lenh('/hs/thuong/da-xem', 'mayA')
    const C = wsGia('mayA')
    const y = nganCo([C])
    await y.lenh('/game-v2/answer', 'mayA')
    const D = wsGia('mayA'), E = wsGia('mayB')
    const z = nganCo([D, E], { TAT_KENH_DAY: '1' })
    await z.lenh('/game-v2/answer', 'mayA')
    await ngu(CHO_PHAT_MS + 150)
    expect([A, B, C, D, E].map((w) => w.gui.length)).toEqual([0, 0, 0, 0, 0])
  })
})
