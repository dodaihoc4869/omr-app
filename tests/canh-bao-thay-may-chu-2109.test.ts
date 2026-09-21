// "CẢNH BÁO CỦA THẦY" — máy chủ: báo ĐÃ XEM (`/hs/canh-bao/xem`, `/ph/canh-bao/xem`) và lấy `canhBaoThay` của phụ huynh cùng lệnh `/ph/ke-hoach`.
// Không bao giờ ném lỗi; thiếu mã ⇒ không gọi mạng; mã chỉ nằm trong thân lệnh, không ra console.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const docPass = vi.fn<() => string>()
const layDiaChiMayChu = vi.fn<() => Promise<string>>()
vi.mock('../src/lib/ph-token', () => ({ docPass: () => docPass() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: () => layDiaChiMayChu() }))

import { baoDaXemHocSinh, baoDaXemPhuHuynh } from '../src/lib/canh-bao-thay-may-chu'
import { KHONG_CO_GI_PH, taiBoNaoPhuHuynh, taiThongTinPhuHuynh } from '../src/lib/bo-nao-lay-loi-ph'

const goc = globalThis.fetch
const traVe = (thanh: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => thanh }) as unknown as Response)
const tho = (o: object = {}) => ({ id: 'cb1', maBtvn: 'B1', tenBtvn: 'Ester', guiLuc: '2026-09-21T08:15:00.000Z', hanNop: '2026-09-21T16:59:00.000Z', loi: 'Anh chị nhắc con nộp bài giúp thầy.', trangThaiEm: 'chua_mo', daXem: false, ...o })

beforeEach(() => {
  docPass.mockReturnValue('mat-ma-thu')
  layDiaChiMayChu.mockResolvedValue('https://may-chu.thu/')
})
afterEach(() => {
  globalThis.fetch = goc
  vi.restoreAllMocks()
})

describe('báo đã xem', () => {
  it('học sinh: POST /hs/canh-bao/xem {token,id}; ok:true ⇒ true', async () => {
    const f = traVe({ ok: true })
    globalThis.fetch = f as never
    expect(await baoDaXemHocSinh('tok-hs', 'cb1')).toBe(true)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://may-chu.thu/hs/canh-bao/xem')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ token: 'tok-hs', id: 'cb1' })
  })
  it('phụ huynh: POST /ph/canh-bao/xem {pass,id} với mã lấy từ docPass', async () => {
    const f = traVe({ ok: true })
    globalThis.fetch = f as never
    expect(await baoDaXemPhuHuynh('cb9')).toBe(true)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://may-chu.thu/ph/canh-bao/xem')
    expect(JSON.parse(String(init.body))).toEqual({ pass: 'mat-ma-thu', id: 'cb9' })
  })
  it('thiếu token / thiếu id / thiếu mã phụ huynh ⇒ false và KHÔNG gọi mạng', async () => {
    const f = traVe({ ok: true })
    globalThis.fetch = f as never
    expect(await baoDaXemHocSinh('', 'cb1')).toBe(false)
    expect(await baoDaXemHocSinh('t', '')).toBe(false)
    expect(await baoDaXemPhuHuynh('')).toBe(false)
    docPass.mockReturnValue('')
    expect(await baoDaXemPhuHuynh('cb1')).toBe(false)
    expect(f).not.toHaveBeenCalled()
  })
  it('máy chủ lỗi / trả ok≠true / mạng đứt / chưa có địa chỉ ⇒ false, không ném', async () => {
    globalThis.fetch = traVe({ ok: true }, false) as never
    expect(await baoDaXemHocSinh('t', 'cb1')).toBe(false)
    globalThis.fetch = traVe({ ok: false }) as never
    expect(await baoDaXemHocSinh('t', 'cb1')).toBe(false)
    globalThis.fetch = traVe(null) as never
    expect(await baoDaXemHocSinh('t', 'cb1')).toBe(false)
    globalThis.fetch = vi.fn(async () => { throw new Error('mất mạng') }) as never
    expect(await baoDaXemHocSinh('t', 'cb1')).toBe(false)
    layDiaChiMayChu.mockResolvedValue('')
    expect(await baoDaXemHocSinh('t', 'cb1')).toBe(false)
  })
  it('mã học sinh/phụ huynh không ra console', async () => {
    const dong = ['log', 'warn', 'error', 'info'].map((k) => vi.spyOn(console, k as 'log').mockImplementation(() => {}))
    globalThis.fetch = vi.fn(async () => { throw new Error('mất mạng') }) as never
    await baoDaXemHocSinh('tok-bi-mat', 'cb1')
    await baoDaXemPhuHuynh('cb1')
    for (const d of dong) expect(JSON.stringify(d.mock.calls)).not.toMatch(/tok-bi-mat|mat-ma-thu/)
  })
})

describe('taiThongTinPhuHuynh — lời Bộ não + cảnh báo của thầy cùng MỘT lệnh /ph/ke-hoach', () => {
  it('đọc cả boNaoAi lẫn canhBaoThay (lời cho phụ huynh), gọi đúng MỘT lần', async () => {
    const f = traVe({ ok: true, boNaoAi: { ngay: '2026-09-21', loiNhan: 'Lời cho anh chị.', thuTuan: '' }, canhBaoThay: [tho()] })
    globalThis.fetch = f as never
    const r = await taiThongTinPhuHuynh()
    expect(f).toHaveBeenCalledTimes(1)
    expect(r.boNao!.loiNhan).toBe('Lời cho anh chị.')
    expect(r.canhBao).toHaveLength(1)
    expect(r.canhBao[0]!.loi).toBe('Anh chị nhắc con nộp bài giúp thầy.')
    expect((f.mock.calls[0] as unknown as [string, RequestInit])[0]).toBe('https://may-chu.thu/ph/ke-hoach')
  })
  it('chỉ có cảnh báo (bộ não chạy thử) ⇒ boNao null nhưng cảnh báo vẫn có; chỉ có bộ não ⇒ canhBao []', async () => {
    globalThis.fetch = traVe({ ok: true, canhBaoThay: [tho()] }) as never
    const a = await taiThongTinPhuHuynh()
    expect(a.boNao).toBeNull()
    expect(a.canhBao).toHaveLength(1)
    globalThis.fetch = traVe({ ok: true, boNaoAi: { loiNhan: 'x', thuTuan: '' } }) as never
    const b = await taiThongTinPhuHuynh()
    expect(b.boNao).not.toBeNull()
    expect(b.canhBao).toEqual([])
  })
  it('thiếu mã / lỗi / ok:false / mạng đứt / chưa có địa chỉ ⇒ không có gì, không ném; thiếu mã không gọi mạng', async () => {
    const f = traVe({ ok: true, canhBaoThay: [tho()] })
    globalThis.fetch = f as never
    docPass.mockReturnValue('')
    expect(await taiThongTinPhuHuynh()).toBe(KHONG_CO_GI_PH)
    expect(f).not.toHaveBeenCalled()
    docPass.mockReturnValue('mat-ma-thu')
    globalThis.fetch = traVe({ ok: true, canhBaoThay: [tho()] }, false) as never
    expect(await taiThongTinPhuHuynh()).toBe(KHONG_CO_GI_PH)
    globalThis.fetch = traVe({ ok: false, canhBaoThay: [tho()] }) as never
    expect(await taiThongTinPhuHuynh()).toBe(KHONG_CO_GI_PH)
    globalThis.fetch = traVe(null) as never
    expect(await taiThongTinPhuHuynh()).toBe(KHONG_CO_GI_PH)
    globalThis.fetch = vi.fn(async () => { throw new Error('x') }) as never
    expect(await taiThongTinPhuHuynh()).toBe(KHONG_CO_GI_PH)
    layDiaChiMayChu.mockResolvedValue('')
    globalThis.fetch = f as never
    expect(await taiThongTinPhuHuynh()).toBe(KHONG_CO_GI_PH)
  })
  it('taiBoNaoPhuHuynh (cũ) vẫn trả đúng phần bộ não', async () => {
    globalThis.fetch = traVe({ ok: true, boNaoAi: { loiNhan: 'Lời.', thuTuan: '' }, canhBaoThay: [tho()] }) as never
    expect((await taiBoNaoPhuHuynh())!.loiNhan).toBe('Lời.')
  })
})
