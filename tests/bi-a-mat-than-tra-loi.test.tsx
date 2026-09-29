// @vitest-environment jsdom
// BI-A (thầy lệnh 29/09): công tắc "Luôn bật Mắt thần" (không trừ lượt, không đổi luật, nhớ theo máy) + màn "Trả lời câu hỏi" (không cần chơi).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import BiaGame from '../src/game/bi-a/BiaGame'
import { datBoGoiBia } from '../src/game/bi-a/api'
import { VanBia, type CauBia } from '../src/game/bi-a/dieu-khien'
import { KHOA_LUON_MAT_THAN, _quenLuonMatThan, datLuonMatThan, docLuonMatThan } from '../src/game/bi-a/mat-than-luon'
import { apCu, taoTran, type DauVaoGhe } from '../src/game/bi-a/tran'
import { biCuaGhe, chiaBi } from '../src/game/bi-a/luat'

configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 20000 })

const cau = (i: number): CauBia => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i}`, choices: [`Đúng ${i}`, `Nhiễu một ${i}`, `Nhiễu hai ${i}`, `Nhiễu ba ${i}`], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Khái niệm ester', mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi' } as unknown as CauBia)
const SANH = { ok: true, bat: true, chienDich: { ten: 'Ester – Lipid', hanNop: '2026-10-01', tong: 120 }, theLuc: { con: 26, tong: 40 }, doan: { con: 6 }, dao: { con: 20 }, tran: { con: 15, tong: 15, conDoan: 5, conDao: 10 }, giaoHuu: { mo: false, con: 0, toiDa: 2 } }
let goi: ReturnType<typeof vi.fn>
const mayChu = (ghiDe: Record<string, (d: Record<string, unknown>) => unknown> = {}) => {
  const kich: Record<string, (d: Record<string, unknown>) => unknown> = {
    'bia-sanh': () => SANH,
    'bia-tra-loi': (d) => (d.dong ? { dong: true } : { session: 's-tl', cau: [cau(1), cau(2)], tran: { con: 13, tong: 15 } }),
    answer: (d) => { const dung = d.answer === 'A'; return { correct: dung, answer: 'A', traLoi: d.answer, solution: { chot: `Cốt lõi ${d.qid}` }, solutionImages: [], reward: dung ? 4 : 0, expCau: dung ? 7 : 0 } },
    ...ghiDe,
  }
  goi = vi.fn(async (lenh: string, _t: string, d: Record<string, unknown> = {}) => ({ ok: true, ...((kich[lenh]?.(d) as object) ?? {}) }))
  datBoGoiBia(goi as never)
}
const lenh = (ten: string) => goi.mock.calls.filter((c) => c[0] === ten).map((c) => c[2] as Record<string, unknown>)

beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); try { localStorage.clear() } catch { /* */ } _quenLuonMatThan(); mayChu() })
afterEach(() => { cleanup(); datBoGoiBia(null); vi.unstubAllGlobals(); datLuonMatThan(false) })

describe('Luôn bật Mắt thần', () => {
  it('nhớ theo máy (localStorage); máy chặn lưu ⇒ không vỡ, vẫn bật trong phiên', () => {
    expect(docLuonMatThan()).toBe(false)
    datLuonMatThan(true)
    expect(localStorage.getItem(KHOA_LUON_MAT_THAN)).toBe('1')
    _quenLuonMatThan()
    expect(docLuonMatThan()).toBe(true)
    const hong = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('chặn') })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('chặn') })
    _quenLuonMatThan()
    expect(docLuonMatThan()).toBe(false)
    datLuonMatThan(true)
    expect(docLuonMatThan()).toBe(true)
    hong.mockRestore(); vi.restoreAllMocks()
  })

  it('ván A.I: bật ⇒ cú của em dùng Mắt thần mà KHÔNG trừ lượt đã kiếm; tắt ⇒ trừ như cũ', () => {
    const sk = { moCau() {}, am() {}, gomVa() {}, ketThuc() {} }
    const v = new VanBia({ cheDo: 'don', loai: 'ai', tenEm: 'Em', cauEm: [cau(1)], chot: null }, sk)
    v.matThan = 2; v.luonMT = true; v.cur = v.em; v.pha = 'aim'; v.power = 0.5
    expect(v.ban()).toBe(true)
    expect(v.matThan).toBe(2); expect(v.dungMT).toBe(true)
    const w = new VanBia({ cheDo: 'don', loai: 'ai', tenEm: 'Em', cauEm: [cau(1)], chot: null }, sk)
    w.matThan = 2; w.cur = w.em; w.pha = 'aim'; w.power = 0.5
    expect(w.ban()).toBe(true)
    expect(w.matThan).toBe(1)
  })

  it('phòng đấu: cú kèm giuMT không trừ Mắt thần của ghế đó; không kèm thì trừ (luật cũ)', () => {
    const nguoi = (sbd: string, ghe: number): DauVaoGhe => {
      const bi: DauVaoGhe['bi'] = {}
      for (const id of biCuaGhe(chiaBi('don'), ghe)) bi[id] = { qid: `q-${sbd}-${id}`, muc: 'TH', giay: 90 }
      return { ten: sbd, ai: false, sbd, bi, chot: null }
    }
    const mo = () => { const t = taoTran({ van: 'v', cheDo: 'don', loai: 'ban', ghe: [nguoi('S1', 0), nguoi('S2', 1)], now: 1 }); t.isBreak = false; t.matThan[0] = 2; return t }
    const a = mo(); apCu(a, 0, { dx: 0, dy: 1, v: 400, sx: 0, sy: 0, giuMT: true }, 1)
    expect(a.matThan[0]).toBe(2)
    const b = mo(); apCu(b, 0, { dx: 0, dy: 1, v: 400, sx: 0, sy: 0 }, 1)
    expect(b.matThan[0]).toBe(1)
  })

  it('Sảnh có công tắc (role switch, có nhãn) — bật là nhớ', async () => {
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    const sw = await screen.findByRole('switch', { name: /Luôn bật Mắt thần/ }) as HTMLInputElement
    expect(sw.checked).toBe(false)
    fireEvent.click(sw)
    expect(sw.checked).toBe(true)
    expect(localStorage.getItem(KHOA_LUON_MAT_THAN)).toBe('1')
  })
})

describe('Trả lời câu hỏi (không cần chơi)', () => {
  it('Sảnh → màn trả lời: lấy câu bia-tra-loi, thẻ câu chuẩn, chấm ở máy chủ, +EXP, câu tiếp; rời màn đóng phiên', async () => {
    const ve = vi.fn()
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={ve} />)
    fireEvent.click(await screen.findByRole('button', { name: /Trả lời câu hỏi · không cần chơi/ }))
    expect(await screen.findByText('Câu hỏi số 1')).toBeTruthy()
    expect(lenh('bia-tra-loi')[0]).toEqual({})
    expect(document.body.textContent).not.toContain('Cốt lõi') // chưa lộ lời giải trước khi chốt
    fireEvent.click(screen.getByText('Đúng 1'))
    fireEvent.click(screen.getByRole('button', { name: 'Chốt đáp án' }))
    await waitFor(() => expect(lenh('answer')[0]).toMatchObject({ session: 's-tl', qid: 'q1', answer: 'A', assisted: false }))
    expect(await screen.findByText('Đúng')).toBeTruthy()
    expect(document.body.textContent).toContain('+7')
    fireEvent.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))
    expect(await screen.findByText('Câu hỏi số 2')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Về Sảnh Bi-a' }))
    await waitFor(() => expect(lenh('bia-tra-loi').some((d) => d.dong === true && d.session === 's-tl')).toBe(true))
  })

  it('hết câu ⇒ báo đúng chữ máy chủ của Bi-a', async () => {
    mayChu({ 'bia-tra-loi': () => ({ lyDo: 'het_tran', message: 'Hết câu Bi-a hôm nay. Em sang Đoàn Hộ Tống và Bát Linh Đảo làm tiếp nhé.' }) })
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /Trả lời câu hỏi · không cần chơi/ }))
    expect(await screen.findByText(/Hết câu Bi-a hôm nay/)).toBeTruthy()
  })

  it('không còn câu Bi-a ⇒ nút khoá', async () => {
    mayChu({ 'bia-sanh': () => ({ ...SANH, lyDoKhoa: 'het_tran', message: 'Hết câu Bi-a hôm nay.', tran: { con: 0, tong: 15 } }) })
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    const n = await screen.findByRole('button', { name: /Trả lời câu hỏi · không cần chơi/ }) as HTMLButtonElement
    expect(n.disabled).toBe(true)
    await act(async () => {})
  })
})
