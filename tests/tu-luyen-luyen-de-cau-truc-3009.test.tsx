// THẺ "LUYỆN ĐỀ CẤU TRÚC" trong Tu luyện (30/09): thẻ cạnh Tổng hợp, khoá kèm lý do MÁY CHỦ trả, gọi đúng /luyen-de/*,
// không có đáp án trước nộp, kết quả điểm /10 theo phần. Lõi luật dùng chung với LuyenDeChuan (luyen-de/dung-luyen-de.ts).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import ManTuLuyen from '../src/components/tu-luyen/ManTuLuyen'
import LuyenDeCauTruc from '../src/components/tu-luyen/LuyenDeCauTruc'
import { dieuKienLuyenDe, luyenDe, LOI_CAN_QUYEN_THAY, LOI_CHUA_HOC_XONG, LOI_KHOI_12 } from '../server/src/luyen-de'
import type { Env } from '../server/src/kieu'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
vi.mock('../server/src/game-v2-auth', () => ({ gameIdentity: async () => 'S1' }))
const khoiGia = vi.hoisted(() => ({ khoi: 12 as number | null, coBat: false, coQuyen: false }))
vi.mock('../server/src/game-v2-bank', async (goc) => ({ ...(await goc<object>()), docKhoiEm: async () => khoiGia.khoi }))
vi.mock('../server/src/pham-vi-hoc', async (goc) => ({
  ...(await goc<object>()),
  quyenMayChuBat: async () => khoiGia.coBat,
  coQuyen: async () => khoiGia.coQuyen,
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

const Q1 = (i: number) => ({ id: `a${i}`, text: `Câu một số ${i}`, choices: ['A1', 'B1', 'C1', 'D1'] })
const BANK = {
  phanI: Array.from({ length: 18 }, (_, i) => Q1(i + 1)),
  phanII: Array.from({ length: 4 }, (_, i) => ({ id: `b${i + 1}`, text: `Đúng sai ${i + 1}`, ideas: ['a', 'b', 'c', 'd'] })),
  phanIII: Array.from({ length: 6 }, (_, i) => ({ id: `c${i + 1}`, text: `Trả lời ngắn ${i + 1}` })),
}

function giaLap(o: { dk?: unknown; lichSu?: unknown[]; nop?: unknown } = {}) {
  const cuoc: { u: string; body: Record<string, unknown> }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: { body?: string }) => {
      const u = new URL(String(url)).pathname
      const body = JSON.parse(init?.body || '{}')
      cuoc.push({ u, body })
      const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
      if (u === '/luyen-de/dieu-kien') return ok(o.dk ?? { ok: true, trangThai: 'mo', lyDo: '', items: o.lichSu ?? [] })
      if (u === '/luyen-de/history') return ok({ ok: true, items: o.lichSu ?? [] })
      if (u === '/luyen-de/save') return ok({ ok: true, serverNow: Date.now() })
      if (u === '/luyen-de/submit') return ok(o.nop)
      if (u.startsWith('/luyen-de/')) return ok({ ok: true, id: 'p1', status: 'active', deadline: Date.now() + 40 * 60000, serverNow: Date.now(), answers: {}, bank: BANK })
      if (u === '/hs/tu-luyen/nguon') return ok({ ok: true, cacCa: [], danhMuc: [], dangThi: false })
      return ok({ ok: true, luot: [], cau: [] })
    }),
  )
  return cuoc
}

describe('Máy chủ: /luyen-de/dieu-kien — chỉ đọc, cùng luật với cổng start', () => {
  it('hàm thuần: cờ BẬT cần quyền thầy; khối < 12 khoá; cờ TẮT ⇒ em tự xác nhận', () => {
    expect(dieuKienLuyenDe({ coBat: true, coQuyen: false, khoi: 12 })).toEqual({ trangThai: 'khoa', lyDo: LOI_CAN_QUYEN_THAY })
    expect(dieuKienLuyenDe({ coBat: true, coQuyen: true, khoi: 11 })).toEqual({ trangThai: 'khoa', lyDo: LOI_KHOI_12 })
    expect(dieuKienLuyenDe({ coBat: false, coQuyen: false, khoi: 10 })).toEqual({ trangThai: 'khoa', lyDo: LOI_KHOI_12 })
    expect(dieuKienLuyenDe({ coBat: true, coQuyen: true, khoi: 12 })).toEqual({ trangThai: 'mo', lyDo: '' })
    expect(dieuKienLuyenDe({ coBat: false, coQuyen: false, khoi: null })).toEqual({ trangThai: 'can_xac_nhan', lyDo: LOI_CHUA_HOC_XONG })
  })
  it('trả trạng thái + lịch sử, không ghi gì, không rút đề', async () => {
    const sql: string[] = []
    const env = {
      DE: { get: async () => { throw new Error('không được đọc đề') }, put: async () => { throw new Error('không được ghi') } },
      DB: { prepare: (s: string) => { sql.push(s); return { bind: () => ({ all: async () => ({ results: [{ id: 'x', created_at: 5, deadline: 9, status: 'submitted', result: '{"score":7.5}' }] }) }) } } },
    } as unknown as Env
    khoiGia.khoi = 11
    const r = await luyenDe(env, 'dieu-kien', { token: 't' })
    expect(r).toMatchObject({ ok: true, trangThai: 'khoa', lyDo: LOI_KHOI_12, items: [{ id: 'x', score: 7.5 }] })
    expect(sql.join('\n')).not.toMatch(/INSERT|UPDATE|DELETE/)
    khoiGia.khoi = 12
  })
  it('cổng start vẫn dùng đúng câu chữ cũ', () => {
    const s = readFileSync('server/src/luyen-de.ts', 'utf8')
    expect(s).toContain("'Mục này cần quyền do thầy mở cho em. Em hỏi thầy nhé.'")
    expect(s).toContain("'Mục này chỉ dành cho học sinh đã học xong toàn bộ chương trình Hóa THPT.'")
    expect(s).toContain("'Mục này chỉ dành cho học sinh khối 12.'")
    expect(s).toContain('throw new Error(LOI_CAN_QUYEN_THAY)')
    expect(s).toContain('throw new Error(LOI_KHOI_12)')
  })
})

describe('Màn Tu luyện: thẻ Luyện đề cấu trúc cạnh Tổng hợp', () => {
  it('thẻ đứng ngay sau Tổng hợp; khoá thì có ổ khoá + lý do máy chủ, không ẩn', async () => {
    const cuoc = giaLap({ dk: { ok: true, trangThai: 'khoa', lyDo: 'Mục này chỉ dành cho học sinh khối 12.', items: [] } })
    render(<ManTuLuyen token="t" sbd="11001" onVe={() => {}} />)
    const the = screen.getAllByRole('tab').map((t) => t.textContent)
    expect(the[1]).toBe('Tổng hợp')
    expect(the[2]).toMatch(/^Luyện đề cấu trúc/)
    await waitFor(() => expect(screen.getByRole('tab', { name: /Luyện đề cấu trúc/ }).getAttribute('data-khoa')).toBe('true'))
    expect(screen.getByRole('tab', { name: /Luyện đề cấu trúc/ }).textContent).toContain('đang khoá')
    fireEvent.click(screen.getByRole('tab', { name: /Luyện đề cấu trúc/ }))
    expect(await screen.findByText('Mục này chỉ dành cho học sinh khối 12.')).toBeTruthy()
    expect(screen.getByText('50 phút · 28 câu đúng cấu trúc đề Bộ · rút từ Bộ đề lớp 12')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Bắt đầu đề mới/ })).toBeNull()
    expect(cuoc.some((c) => c.u === '/luyen-de/dieu-kien')).toBe(true)
    expect(cuoc.some((c) => c.u === '/luyen-de/start')).toBe(false)
  })
  it('Tổng hợp hiện điểm các đề đã nộp (chỉ đọc dữ liệu /luyen-de)', async () => {
    giaLap({ lichSu: [{ id: 'p2', createdAt: Date.now(), status: 'submitted', score: 7.25 }, { id: 'p1', createdAt: Date.now() - 9e7, status: 'submitted', score: 5.5 }] })
    render(<ManTuLuyen token="t" sbd="12001" onVe={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Tổng hợp' }))
    const muc = await screen.findByRole('region', { name: 'Luyện đề cấu trúc' })
    expect(within(muc).getByText('2 đề')).toBeTruthy()
    expect(within(muc).getAllByText('7,25 / 10').length).toBeGreaterThan(0)
  })
})

describe('LuyenDeCauTruc: giới thiệu → làm → nộp → kết quả', () => {
  it('cờ tắt: phải tick "Em đã học xong" mới bắt đầu; gửi /luyen-de/start kèm daHocXong', async () => {
    const cuoc = giaLap()
    render(<LuyenDeCauTruc token="t" sbd="12001" dieuKien={{ trangThai: 'can_xac_nhan', lyDo: 'x', items: [] }} dangTaiDieuKien={false} onDoi={() => {}} />)
    const nut = screen.getByRole('button', { name: /Bắt đầu đề mới/ }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Em đã học xong toàn bộ chương trình.' }))
    expect(nut.disabled).toBe(false)
    fireEvent.click(nut)
    await screen.findByLabelText('Thời gian còn lại')
    expect(cuoc.find((c) => c.u === '/luyen-de/start')!.body.daHocXong).toBe(true)
  })

  it('đang làm: 28 câu, đồng hồ, tiến độ x/28, nhảy câu theo phần; không có đáp án/lời giải trên màn', async () => {
    giaLap({ lichSu: [{ id: 'p1', createdAt: Date.now(), status: 'active', score: null }] })
    render(<LuyenDeCauTruc token="t" sbd="12001" dieuKien={{ trangThai: 'mo', lyDo: '', items: [] }} dangTaiDieuKien={false} onDoi={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Làm tiếp bài đang làm' }))
    expect((await screen.findByLabelText('Thời gian còn lại')).textContent).toMatch(/^\d+:\d\d$/)
    expect(document.querySelectorAll('.ldct-cau').length).toBe(28)
    const dh = screen.getByRole('navigation', { name: 'Chuyển tới câu' })
    expect(within(dh).getAllByRole('button').length).toBe(28)
    expect(within(dh).getByText('Phần III')).toBeTruthy()
    expect(screen.getByText('Đã làm 0/28 câu')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/Đáp án đúng|Lời giải/)
    const cau1 = document.querySelector('.ldct-cau') as HTMLElement
    const nutB = within(cau1).getAllByRole('button').find((b) => /B/.test(b.textContent || '') && !/Hỏi/.test(b.textContent || ''))!
    fireEvent.click(nutB)
    await waitFor(() => expect(screen.getByText('Đã làm 1/28 câu')).toBeTruthy())
  })

  it('nộp: hỏi xác nhận, gửi /luyen-de/submit; kết quả điểm /10 + theo phần + đáp án sau nộp', async () => {
    const detail: Record<string, { correct: unknown; points: number }> = {}
    BANK.phanI.forEach((q, i) => (detail[q.id] = { correct: 'A', points: i < 10 ? 0.25 : 0 }))
    BANK.phanII.forEach((q, i) => (detail[q.id] = { correct: ['D', 'D', 'S', 'S'], points: i === 0 ? 1 : 0.25 }))
    BANK.phanIII.forEach((q) => (detail[q.id] = { correct: '12', points: 0 }))
    const sources = [{ maDe: 'x', phanI: BANK.phanI.map((q) => ({ ...q, correct: 'A', explanation: 'Giải thích mẫu' })), phanII: BANK.phanII.map((q) => ({ ...q, correct: ['D', 'D', 'S', 'S'] })), phanIII: BANK.phanIII.map((q) => ({ ...q, correct: '12' })) }]
    const cuoc = giaLap({
      lichSu: [{ id: 'p1', createdAt: Date.now(), status: 'active', score: null }],
      nop: { ok: true, id: 'p1', status: 'submitted', deadline: Date.now(), serverNow: Date.now(), answers: { a1: 'A' }, bank: BANK, result: { score: 5.75, detail }, solutions: sources },
    })
    const onDoi = vi.fn()
    render(<LuyenDeCauTruc token="t" sbd="12001" dieuKien={{ trangThai: 'mo', lyDo: '', items: [] }} dangTaiDieuKien={false} onDoi={onDoi} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Làm tiếp bài đang làm' }))
    await screen.findByLabelText('Thời gian còn lại')
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))
    // Hộp xác nhận mở ⇒ có nút "Nộp bài" thứ hai (của hộp); chưa bấm thì chưa gửi gì.
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Nộp bài' }).length).toBe(2))
    expect(cuoc.some((c) => c.u === '/luyen-de/submit')).toBe(false)
    fireEvent.click(screen.getAllByRole('button', { name: 'Nộp bài' })[1])
    await waitFor(() => expect(cuoc.some((c) => c.u === '/luyen-de/submit')).toBe(true))
    expect(await screen.findByText('Kết quả luyện đề cấu trúc')).toBeTruthy()
    expect(screen.getByLabelText('Điểm 5,75 trên 10')).toBeTruthy()
    expect(screen.getByLabelText('2,5 trên 4,5 điểm').textContent).toBe('2,5/4,5')
    expect(screen.getByLabelText('1,75 trên 4 điểm')).toBeTruthy()
    expect(screen.getByLabelText('0 trên 1,5 điểm')).toBeTruthy()
    expect(onDoi).toHaveBeenCalled()
    expect(cuoc.every((c) => c.u.startsWith('/luyen-de/'))).toBe(true)
  })
})
