// ĐẢO · "KHÔNG NỘP ĐƯỢC BÀI" (thầy 20:28, em chơi Đảo): máy chủ từ chối `answer` GIỮA lượt vì em đã chạm trần câu trong ngày ("Em đã hoàn thành 36 câu hôm nay"), nhưng `ThamHiem` chỉ hiện lỗi ở ĐẦU màn —
// em đang ở cuối màn bấm nộp không thấy gì. Sửa: lỗi hiện NGAY TRÊN nút nộp (trong khối dính đáy) + cuộn tới; hết trần ⇒ thẻ "Hôm nay em đã chơi đủ câu ở Đảo…" + "VỀ ĐẢO" thay nút nộp; nạp lại số lượt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import DaoThanThu from '../src/game/than-thu-v2/dao/DaoThanThu'
import { CHU_HET_TRAN_DAO, CHU_HET_TRAN_GAME, laLoiHetTran, maCuaLoi } from '../src/game/than-thu-v2/loi-het-tran'
import type { CauDao, DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

configure({ asyncUtilTimeout: 8000 })
let cuon: ReturnType<typeof vi.fn>
beforeEach(() => { cuon = vi.fn(); Element.prototype.scrollIntoView = cuon as unknown as typeof Element.prototype.scrollIntoView })
afterEach(cleanup)

const hoSo = (): DaoProfile => ({ nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 10, wallet: 0, mastery: [], shields: { used: 0, activeUntil: 0 } } as unknown as DaoProfile)
const cau = (i: number): CauDao => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [], role: 'yeu' }) as unknown as CauDao
const loiMay = (msg: string, ma?: string) => Object.assign(new Error(msg), ma ? { ma } : {})

function dung(traLoiAnswer: Error, recs: Partial<DaoKetQua>[] = [{ suggestions: [{ title: 'Ester thuỷ phân', source: 'DE', part: 'I' }], remaining: 3, dailyUsed: 33, tranNgay: 36 }, { suggestions: [], remaining: 0, dailyUsed: 36, tranNgay: 36 }]) {
  const nhat: string[] = []
  let lanRec = 0
  const call = vi.fn(async (action: string, _d: Record<string, unknown> = {}): Promise<DaoKetQua> => {
    nhat.push(action)
    if (action === 'recommendations') return { ok: true, ...(recs[Math.min(lanRec++, recs.length - 1)] ?? {}) }
    if (action === 'sync') return { ok: true, remaining: 0 }
    if (action === 'start') return { ok: true, id: 's1', mode: 'adventure', questions: [cau(0), cau(1)] } as DaoKetQua
    if (action === 'answer') throw traLoiAnswer
    return { ok: true }
  })
  render(<DaoThanThu sbd="12121212" profile={hoSo()} doanMo={false} onMoDoan={() => {}} onDong={() => {}} call={call} />)
  return { call, nhat }
}
const vaoAi = async () => {
  await waitFor(() => expect(screen.getByText('Ester thuỷ phân')).toBeTruthy())
  fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
  await waitFor(() => expect(screen.getByLabelText('Ải 1')).toBeTruthy())
  fireEvent.click(screen.getByText('Hai'))
}
const chan = () => document.querySelector('.dao-tham-chan') as HTMLElement

describe('laLoiHetTran / maCuaLoi — thuần', () => {
  it('nhận theo MÃ het_tran (thắng lời), hoặc theo lời "<số> câu … hôm nay"; lời khác không nhận nhầm', () => {
    expect(laLoiHetTran('bất kỳ', 'het_tran')).toBe(true)
    expect(laLoiHetTran('Em đã hoàn thành 36 câu hôm nay.')).toBe(true)
    expect(laLoiHetTran('Em đã hoàn thành 60 câu game hôm nay.')).toBe(true)
    expect(laLoiHetTran('Hôm nay em đã làm hết câu mới hợp sức em trong kho. Mai có câu mới nhé.')).toBe(false)
    expect(laLoiHetTran('Mạng chập chờn, em thử lại nhé.')).toBe(false)
    expect(laLoiHetTran('Phiên game hết hạn')).toBe(false)
    expect(laLoiHetTran('', '')).toBe(false)
    expect(laLoiHetTran(null)).toBe(false)
    expect(laLoiHetTran('x', 'ma_khac')).toBe(false)
  })
  it('maCuaLoi lấy `ma` nếu là chuỗi, còn lại rỗng', () => {
    expect(maCuaLoi(Object.assign(new Error('x'), { ma: 'het_tran' }))).toBe('het_tran')
    expect(maCuaLoi(new Error('x'))).toBe('')
    expect(maCuaLoi(null)).toBe('')
    expect(maCuaLoi({ ma: 5 })).toBe('')
  })
})

describe('Đảo · hết trần câu GIỮA lượt', () => {
  it('nộp bị từ chối "hoàn thành 36 câu hôm nay" ⇒ thẻ rõ ràng + VỀ ĐẢO NGAY TRONG khối dính đáy; KHÔNG còn nút nộp; chỉ MỘT cảnh báo (không lặp ở đầu màn); cuộn tới thẻ', async () => {
    dung(loiMay('Em đã hoàn thành 36 câu hôm nay.'))
    await vaoAi()
    fireEvent.click(screen.getByRole('button', { name: 'Trả lời · tung chưởng' }))
    await waitFor(() => expect(chan().querySelector('.dao-het-tran')).not.toBeNull())
    expect(chan().querySelector('.dao-het-tran p')!.textContent).toBe(CHU_HET_TRAN_DAO)
    expect(screen.queryByRole('button', { name: /Trả lời · tung chưởng/ })).toBeNull()
    expect(document.querySelectorAll('[role="alert"]')).toHaveLength(1)
    expect(chan().hasAttribute('data-noi')).toBe(true) // khối dính đáy luôn hiện (không ẩn khi chưa chọn)
    expect(cuon.mock.contexts.some((el) => (el as Element).classList.contains('dao-het-tran'))).toBe(true)
    expect(screen.getByRole('button', { name: 'VỀ ĐẢO' })).toBeTruthy()
  })
  it('máy chủ gửi MÃ het_tran (lời tuỳ ý) ⇒ cũng ra thẻ', async () => {
    dung(loiMay('Trần của hôm nay đã đủ.', 'het_tran'))
    await vaoAi()
    fireEvent.click(screen.getByRole('button', { name: 'Trả lời · tung chưởng' }))
    await waitFor(() => expect(chan().querySelector('.dao-het-tran')).not.toBeNull())
  })
  it('nạp lại số lượt sau lỗi hết trần (recommendations lần 2) và bấm VỀ ĐẢO ⇒ về màn Đảo, LÊN ĐƯỜNG khoá + "đã đi 36/36 câu Đảo thần thú"', async () => {
    const { nhat } = dung(loiMay('Em đã hoàn thành 36 câu hôm nay.'))
    await vaoAi()
    fireEvent.click(screen.getByRole('button', { name: 'Trả lời · tung chưởng' }))
    await waitFor(() => expect(chan().querySelector('.dao-het-tran')).not.toBeNull())
    await waitFor(() => expect(nhat.filter((a) => a === 'recommendations').length).toBeGreaterThanOrEqual(2))
    fireEvent.click(screen.getByRole('button', { name: 'VỀ ĐẢO' }))
    await waitFor(() => expect(document.querySelector('.dao-chuyen')).not.toBeNull())
    await waitFor(() => expect((screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }) as HTMLButtonElement).disabled).toBe(true))
    expect(document.body.textContent).toContain('Hôm nay em đã đi 36/36 câu Đảo thần thú. Mai đảo có chuyến mới.')
  })
  it('lỗi KHÁC (mạng) ⇒ hiện NGAY TRÊN nút nộp trong khối dính đáy, nút nộp vẫn còn để thử lại; cuộn tới lỗi; không thẻ hết trần', async () => {
    dung(loiMay('Mạng chập chờn, em thử lại nhé.'))
    await vaoAi()
    fireEvent.click(screen.getByRole('button', { name: 'Trả lời · tung chưởng' }))
    await waitFor(() => expect(chan().querySelector('.dao-loi-nut')).not.toBeNull())
    expect(chan().querySelector('.dao-loi-nut')!.textContent).toBe('Mạng chập chờn, em thử lại nhé.')
    // nằm TRƯỚC nút trong cùng khối
    const kids = [...chan().children]
    expect(kids.indexOf(chan().querySelector('.dao-loi-nut')!)).toBeLessThan(kids.indexOf(screen.getByRole('button', { name: 'Trả lời · tung chưởng' })))
    expect(chan().querySelector('.dao-het-tran')).toBeNull()
    expect(document.querySelectorAll('[role="alert"]')).toHaveLength(1)
    expect(cuon.mock.contexts.some((el) => (el as Element).classList.contains('dao-loi-nut'))).toBe(true)
  })
})

describe('khoá nguồn: game cũ (Game.tsx) cùng kiểu', () => {
  it('lỗi nộp hiện cạnh nút, hết trần thay nút bằng thẻ; request gắn mã lỗi; không lặp cảnh báo ở đầu màn khi đã hiện ở cuối', async () => {
    const fs = await import('node:fs')
    const g = fs.readFileSync('src/game/than-thu-v2/Game.tsx', 'utf8')
    expect(g).toMatch(/ma:String\(\(r as \{ma\?:unknown\}\)\.ma\?\?''\)/)
    expect(g).toMatch(/error&&!loiOCuoi&&<div role="alert" className="spirit-error">/)
    expect(g).toMatch(/spirit-error spirit-error-nut/)
    expect(g).toMatch(/\{!hetTran&&<button className="spirit-primary"/)
    expect(g).toContain('CHU_HET_TRAN_GAME')
    expect(CHU_HET_TRAN_GAME).toBe('Hôm nay em đã chơi đủ câu game. Mai mình chơi tiếp nhé.')
  })
})
