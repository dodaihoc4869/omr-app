// @vitest-environment node
// BỘ NÃO A.I — NỐI ROUTE /ai/* vào Worker (Code 3): mọi lệnh là lệnh THẦY (sau cổng laThay), không mã bí mật ⇒ 403 và KHÔNG ghi gì,
// có mã ⇒ chạy hàm của Code 1; chưa tầng nào đọc ai_* nên kế hoạch ngày của em không đổi một byte dù có điều chỉnh "áp dụng" nằm trong bảng.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker } from './_d1-that'
import { BAY_GIO, dung, gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const ROUTE = ['/ai/cau-hinh', '/ai/ho-so-ngay', '/ai/dieu-chinh/nop', '/ai/dem-qua', '/ai/nhat-ky', '/ai/dieu-chinh/bo'] as const

describe('/ai/* — lệnh của THẦY', () => {
  it('KHÔNG mã bí mật ⇒ 403 "Sai mã bí mật" cho cả 6 lệnh, không ghi cau_hinh/ai_*', async () => {
    gio(BAY_GIO)
    const d = dung()
    const truoc = ['cau_hinh', 'ai_ho_so_ngay', 'ai_dieu_chinh', 'ai_ban_tin'].map((t) => d.chup(t)).join('\n')
    for (const p of ROUTE) {
      const r = await goiWorker(worker, d.env, p, { cheDo: 'that', ngay: '2026-09-22', sbd: 'S1' }, false)
      expect(r, p).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
    }
    expect(['cau_hinh', 'ai_ho_so_ngay', 'ai_dieu_chinh', 'ai_ban_tin'].map((t) => d.chup(t)).join('\n')).toBe(truoc)
  })
  it('có mã bí mật: /ai/cau-hinh đọc mặc định (BÓNG) và ghi được chế độ; lệnh đọc trả ok', async () => {
    gio(BAY_GIO)
    const d = dung()
    expect(await goiWorker(worker, d.env, '/ai/cau-hinh', {}, true)).toMatchObject({ ok: true, cauHinh: { bat: true, cheDo: 'bong', lopThat: [] } })
    expect(await goiWorker(worker, d.env, '/ai/cau-hinh', { lopThat: ['12A1'] }, true)).toMatchObject({ ok: true, cauHinh: { cheDo: 'bong', lopThat: ['12A1'] } })
    for (const p of ['/ai/dem-qua', '/ai/nhat-ky']) expect((await goiWorker(worker, d.env, p, { ngay: '2026-09-22', sbd: 'S1' }, true)).ok, p).toBeTypeOf('boolean')
  })
  it('nằm SAU cổng laThay trong mã nguồn (không thể gọi công khai)', () => {
    const src = readFileSync('server/src/index.ts', 'utf8')
    const iGate = src.indexOf('if (!laThay(req, env, b))')
    expect(iGate).toBeGreaterThan(0)
    for (const p of ROUTE) {
      const i = src.indexOf(`p === '${p}'`)
      expect(i, p).toBeGreaterThan(iGate)
    }
    // Không đường công khai nào của em/phụ huynh gọi hàm bộ não.
    expect(src.slice(0, iGate)).not.toMatch(/\bAI\.boNao/)
  })
  it('ĐÃ NỐI nhưng CHƯA tầng nào đọc ai_*: điều chỉnh "áp dụng" nằm trong bảng KHÔNG đổi một byte kế hoạch ngày của em (`/hs/ke-hoach-ngay`)', async () => {
    gio(BAY_GIO)
    const d = dung()
    const khTruoc = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(khTruoc.ok).toBe(true)
    d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,do_tin,che_do,ap_dung,het_han,huy,tu_go,ly_do_bo,nop_luc) VALUES('S1','2026-09-22',?,0.9,'that',1,'2026-09-25',0,0,'[]','x')").run(JSON.stringify({ nhip: 3, khoiDong: 3 }))
    d.sql.exec("DELETE FROM ke_hoach_ngay")
    const khSau = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    const bo = (r: Record<string, unknown>) => JSON.stringify({ ...r, serverNow: 0 })
    expect(bo(khSau)).toBe(bo(khTruoc))
  })
})
