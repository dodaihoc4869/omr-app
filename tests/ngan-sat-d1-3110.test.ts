// @vitest-environment node
// NGĂN SÁT D1 (31/10): ngăn của em nằm ở NRT / KIX, D1 ở Hồng Kông ⇒ mỗi vòng D1 50–60 ms. Bốc thăm ngăn trung chuyển đo nhanh nhất tới D1 (cau_hinh.ngan_dinh);
// ngăn `d1|<sbd>` được TẠO bởi trung chuyển (không gợi ý ⇒ cạnh trung chuyển), lần sau Worker gọi thẳng. Chưa có danh sách ⇒ đường `apac|` cũ + bốc thăm ở nền.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker, { NganHocSinh } from '../server/src/index'
import { DAU_CHUYEN_NGAN, DAU_SBD_NGAN, DAU_TRONG_NGAN, chonNganDinh, docDsDinh, xoaDemNganDinh, xoaEnvChungNgan } from '../server/src/ngan-hoc-sinh'
import { gameToken } from '../server/src/game-v2-auth'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

const fetchGoc = globalThis.fetch
beforeEach(() => {
  xoaEnvChungNgan(); xoaDemNganDinh()
  // Ngăn đo trạm qua cdn-cgi/trace — trong test trả trạm giả, không ra mạng.
  vi.stubGlobal('fetch', (u: unknown, i?: RequestInit) => String(u).includes('cdn-cgi/trace') ? Promise.resolve(new Response('colo=HKG\n')) : fetchGoc(u as string, i))
})
afterEach(() => { vi.unstubAllGlobals(); xoaDemNganDinh() })

function kho() {
  const k = taoKhoOmni({}, 3)
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='mk'`)
  const goi: { ten: string; goiY: string | undefined; chuyen: string | null }[] = []
  const nen: Promise<unknown>[] = []
  const env = { ...k.env } as Env
  env.NGAN_HS = {
    idFromName: (ten: string) => ({ toString: () => ten }),
    get: (id, tuy) => ({
      fetch: async (req: Request) => {
        goi.push({ ten: id.toString(), goiY: tuy?.locationHint, chuyen: req.headers.get(DAU_CHUYEN_NGAN) })
        const state = { waitUntil: (p: Promise<unknown>) => { nen.push(p) } } as never
        return new NganHocSinh(state, env).fetch(req)
      },
    }),
  }
  return { k, env, goi, nen }
}
const ctxGia = (nen: Promise<unknown>[]) => ({ waitUntil: (p: Promise<unknown>) => { nen.push(p) }, passThroughOnException() {} }) as never
const lenh = (x: ReturnType<typeof kho>, duong: string, than: unknown, dau: Record<string, string> = {}) =>
  worker.fetch(new Request(`https://test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', ...dau }, body: JSON.stringify(than) }), x.env, ctxGia(x.nen))
const xa = async (nen: Promise<unknown>[]) => { for (let i = 0; i < nen.length; i++) await nen[i]!.catch(() => null) }

describe('ngăn sát D1', () => {
  it('chưa có danh sách ⇒ ngăn apac| như cũ + bốc thăm ở nền (một lần), ghi cau_hinh.ngan_dinh tối đa 16 ngăn', async () => {
    const x = kho()
    const token = await gameToken(x.k.env, 'S1')
    const r = await (await lenh(x, '/game-v2/hoc-tap-dem', { token })).json() as Record<string, unknown>
    expect(r.ok).toBe(true)
    expect(x.goi[0]).toEqual({ ten: 'apac|S1', goiY: 'apac', chuyen: null })
    await xa(x.nen)
    const dinh = x.goi.filter((g) => g.ten.startsWith('dinh|'))
    expect(dinh.length).toBe(48)
    expect(dinh.every((g) => g.goiY === 'apac')).toBe(true)
    const ds = docDsDinh((x.k.d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='ngan_dinh'").get() as { gia_tri: string }).gia_tri)
    expect(ds.length).toBe(16)
    // lượt sau: không bốc thăm lại
    const n = x.goi.length
    await lenh(x, '/game-v2/hoc-tap-dem', { token })
    await xa(x.nen)
    expect(x.goi.slice(n).filter((g) => g.ten.startsWith('dinh|') && g.chuyen === null)).toEqual([])
  })

  it('có danh sách ⇒ lần đầu qua trung chuyển (ngăn d1| tạo KHÔNG gợi ý), lần sau gọi thẳng; kết quả y hệt đường thẳng', async () => {
    const x = kho()
    x.k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngan_dinh','{"ds":["dinh|7","dinh|9"]}','x')`)
    const token = await gameToken(x.k.env, 'S1')
    const a = await (await lenh(x, '/game-v2/hoc-tap-dem', { token })).json() as Record<string, unknown>
    expect(x.goi.slice(0, 2).map((g) => [g.ten, g.goiY, g.chuyen])).toEqual([[expect.stringMatching(/^dinh\|(7|9)$/), undefined, 'd1|S1'], ['d1|S1', undefined, null]])
    const n = x.goi.length
    const b = await (await lenh(x, '/game-v2/hoc-tap-dem', { token })).json() as Record<string, unknown>
    expect(x.goi.slice(n, n + 1)).toEqual([{ ten: 'd1|S1', goiY: undefined, chuyen: null }])
    expect({ ...a, serverNow: 0 }).toEqual({ ...b, serverNow: 0 })
    const thang = await (await worker.fetch(new Request('https://test/game-v2/hoc-tap-dem', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }), x.k.env as Env, ctxGia([]))).json() as Record<string, unknown>
    expect({ ...a, serverNow: 0 }).toEqual({ ...thang, serverNow: 0 })
  })

  it('máy khách tự gửi x-ngan-chuyen ⇒ Worker xoá; trung chuyển chỉ nhận đúng d1|<sbd của lệnh>', async () => {
    const x = kho()
    x.k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngan_dinh','{"ds":["dinh|1"]}','x')`)
    await lenh(x, '/game-v2/hoc-tap-dem', { token: await gameToken(x.k.env, 'S1') }, { [DAU_CHUYEN_NGAN]: 'd1|S2' })
    expect(x.goi.map((g) => g.ten)).toEqual(['dinh|1', 'd1|S1'])
    // Lệnh lạ tới thẳng trung chuyển (tên không khớp SBD) ⇒ tự xử lý, không mở ngăn em khác.
    const y = kho()
    const st = { waitUntil() {} } as never
    const res = await new NganHocSinh(st, y.env).fetch(new Request('https://t/game-v2/hoc-tap-dem', { method: 'POST', headers: { [DAU_TRONG_NGAN]: '1', [DAU_SBD_NGAN]: 'S1', [DAU_CHUYEN_NGAN]: 'd1|S2' }, body: JSON.stringify({ token: await gameToken(y.k.env, 'S1') }) }))
    expect(res.status).toBe(200)
    expect(y.goi).toEqual([])
  })

  it('công tắc TAT_NGAN_DINH ⇒ ngăn apac| như cũ, không bốc thăm', async () => {
    const x = kho()
    x.env.TAT_NGAN_DINH = '1'
    x.k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngan_dinh','{"ds":["dinh|1"]}','x')`)
    await lenh(x, '/game-v2/hoc-tap-dem', { token: await gameToken(x.k.env, 'S1') })
    await xa(x.nen)
    expect(x.goi.map((g) => g.ten)).toEqual(['apac|S1'])
  })

  it('bốc thăm giữ ngăn đo nhanh nhất; danh sách hỏng / tên lạ ⇒ bỏ', async () => {
    const x = kho()
    const kq = await chonNganDinh(x.env, 10)
    expect(kq!.ds.length).toBe(10)
    expect(kq!.theoTram).toEqual({ HKG: 10 })
    expect(docDsDinh('{"ds":["dinh|1","apac|S1","dinh|x",3]}')).toEqual(['dinh|1'])
    expect(docDsDinh('rác')).toEqual([])
  })
})
