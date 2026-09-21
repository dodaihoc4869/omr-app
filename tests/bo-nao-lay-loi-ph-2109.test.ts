// BỘ NÃO A.I — lấy lời cho PHỤ HUYNH: `POST /ph/ke-hoach {pass}` (Code 3 chốt). Không bao giờ ném lỗi; thiếu mã ⇒ không gọi mạng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const docPass = vi.fn<() => string>()
const layDiaChiMayChu = vi.fn<() => Promise<string>>()
vi.mock('../src/lib/ph-token', () => ({ docPass: () => docPass() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: () => layDiaChiMayChu() }))

import { taiBoNaoPhuHuynh } from '../src/lib/bo-nao-lay-loi-ph'

const goc = globalThis.fetch
const traVe = (thanh: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => thanh }) as unknown as Response)

beforeEach(() => {
  docPass.mockReturnValue('mat-ma-thu')
  layDiaChiMayChu.mockResolvedValue('https://may-chu.thu/')
})
afterEach(() => {
  globalThis.fetch = goc
  vi.restoreAllMocks()
})

describe('taiBoNaoPhuHuynh', () => {
  it('gọi đúng lệnh /ph/ke-hoach với {pass}, đọc boNaoAi', async () => {
    const f = traVe({ ok: true, boNaoAi: { ngay: '2026-09-21', loiNhan: 'Lời cho anh chị.', thuTuan: 'Thư.', tuanTu: '2026-09-14' }, viec: [] })
    globalThis.fetch = f as unknown as typeof fetch
    const r = await taiBoNaoPhuHuynh()
    expect(r).toEqual({ ngay: '2026-09-21', loiNhan: 'Lời cho anh chị.', thuTuan: 'Thư.', tuanTu: '2026-09-14' })
    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://may-chu.thu/ph/ke-hoach') // bỏ dấu gạch cuối của địa chỉ
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ pass: 'mat-ma-thu' })
  })

  it('không có mã phụ huynh (vào bằng SBD trần) ⇒ null và KHÔNG gọi mạng', async () => {
    docPass.mockReturnValue('')
    const f = traVe({ ok: true, boNaoAi: { loiNhan: 'x' } })
    globalThis.fetch = f as unknown as typeof fetch
    expect(await taiBoNaoPhuHuynh()).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })

  it('máy chủ chưa có khoá / chạy thử / không lời ⇒ null', async () => {
    for (const thanh of [{ ok: true }, { ok: true, boNaoAi: null }, { ok: true, boNaoAi: { loiNhan: '', thuTuan: '' } }, null]) {
      globalThis.fetch = traVe(thanh) as unknown as typeof fetch
      expect(await taiBoNaoPhuHuynh()).toBeNull()
    }
  })

  it('máy chủ trả lỗi (HTTP hỏng hoặc ok:false) ⇒ null, không lấy lời từ phản hồi lỗi', async () => {
    globalThis.fetch = traVe({ ok: true, boNaoAi: { loiNhan: 'x' } }, false) as unknown as typeof fetch
    expect(await taiBoNaoPhuHuynh()).toBeNull()
    globalThis.fetch = traVe({ ok: false, boNaoAi: { loiNhan: 'x' } }) as unknown as typeof fetch
    expect(await taiBoNaoPhuHuynh()).toBeNull()
  })

  it('mất mạng / JSON hỏng / không có địa chỉ máy chủ ⇒ null, KHÔNG ném lỗi', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('mất mạng')
    }) as unknown as typeof fetch
    await expect(taiBoNaoPhuHuynh()).resolves.toBeNull()
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => { throw new Error('JSON hỏng') } }) as unknown as Response) as unknown as typeof fetch
    await expect(taiBoNaoPhuHuynh()).resolves.toBeNull()
    layDiaChiMayChu.mockResolvedValue('')
    const f = traVe({ ok: true })
    globalThis.fetch = f as unknown as typeof fetch
    await expect(taiBoNaoPhuHuynh()).resolves.toBeNull()
    expect(f).not.toHaveBeenCalled()
    layDiaChiMayChu.mockRejectedValue(new Error('x'))
    await expect(taiBoNaoPhuHuynh()).resolves.toBeNull()
  })

  it('mã phụ huynh không bị ghi ra console', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const loi = vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.fetch = vi.fn(async () => {
      throw new Error('mat-ma-thu')
    }) as unknown as typeof fetch
    await taiBoNaoPhuHuynh()
    for (const c of [...log.mock.calls, ...loi.mock.calls]) expect(JSON.stringify(c)).not.toContain('mat-ma-thu')
  })
})
