// ĐẢO THẦN THÚ bản mới · màn 3 "Chuyến thám hiểm": dải ải theo vai máy chủ trả, trận giữ công thức learning-battle,
// Cuồng nộ hiện bằng TRANH cuồng nộ thật, lý do thưởng in đúng chữ máy chủ, không tự cuộn trang.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ThamHiem, { DaiAi, SanDau, TEN_QUAI } from '../src/game/than-thu-v2/dao/ThamHiem'
import type { ThamHiemProps } from '../src/game/than-thu-v2/dao/ThamHiem'
import type { CauDao, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import { learningBattle } from '../src/game/than-thu-v2/learning-battle'

// jsdom không có scrollIntoView: gắn hàm giả để ĐẾM — màn mới không được gọi lần nào
const cuon = vi.fn()
beforeEach(() => { cuon.mockClear(); (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = cuon })
afterEach(() => { cleanup(); delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView })
const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 0, wallet: 0, mastery: [] }
const VAI: CauDao['role'][] = ['yeu', 'yeu', 'toi_han', 'lap', 'lap', 'thu_thach']
const cau: CauDao[] = VAI.map((role, i) => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Ester thuỷ phân', mucDo: 'hieu', sao: 2, kienThuc: [], role }))
const dung = (n: number) => Array.from({ length: n }, (_, i) => ({ qid: `q${i}`, correct: true }))
const props = (them: Partial<ThamHiemProps> = {}): ThamHiemProps => ({ profile: hoSo, cau, viTri: 0, ketQua: [], traLoi: '', assisted: false, phanHoi: null, xong: false, onTraLoi: () => {}, onAssisted: () => {}, onNop: () => {}, onTiep: () => {}, onVeDao: () => {}, ...them })
const ve = (them: Partial<ThamHiemProps> = {}) => render(<div className="dao"><ThamHiem {...props(them)} /></div>)

describe('Dải 6 ải', () => {
  it('6 ô theo đúng vai máy chủ trả; nhãn nhóm chỉ ở ô đầu nhóm; ô đang làm có aria-current; thiếu role ⇒ Luyện đều', () => {
    const { container } = render(<div className="dao"><DaiAi cau={cau} viTri={2} ketQua={[{ qid: 'q0', correct: true }, { qid: 'q1', correct: false }]} xong={false} /></div>)
    const o = [...container.querySelectorAll('.dao-dai li')]
    expect(o.map(li => li.getAttribute('data-trang'))).toEqual(['dung', 'sai', 'dang', 'cho', 'cho', 'cho'])
    expect(o.map(li => li.querySelector('small')?.textContent ?? '')).toEqual(['Sửa lỗi', '', 'Ký ức', 'Luyện đều', '', 'Trùm ải'])
    expect(o[2]!.getAttribute('aria-current')).toBe('step')
    cleanup()
    const { container: c2 } = render(<div className="dao"><DaiAi cau={cau.map(({ role: _, ...c }) => c)} viTri={0} ketQua={[]} xong={false} /></div>)
    expect([...c2.querySelectorAll('.dao-dai small')].map(x => x.textContent)).toEqual(['Luyện đều'])
  })
})

describe('Sân đấu', () => {
  it('máu hai bên = đúng learningBattle; 3 câu đúng liền ⇒ CUỒNG NỘ ×2 bằng tranh cuồng nộ thật trong nho/', () => {
    const { container, rerender } = render(<div className="dao"><SanDau profile={hoSo} ketQua={dung(2)} tong={6} suKien={2} xong={false} /></div>)
    const t2 = learningBattle(dung(2), 6)
    expect(screen.getByRole('progressbar', { name: `Máu ${TEN_QUAI}` }).getAttribute('aria-valuenow')).toBe(String(t2.enemy))
    expect(container.querySelector('.dao-san-thu')!.getAttribute('src')).toBe('/than-thu-v2/nho/thu-2-2.webp')
    expect(container.querySelector('[data-no]')).toBeNull()
    expect(container.textContent).toContain('Đúng liền 2/3')
    rerender(<div className="dao"><SanDau profile={hoSo} ketQua={dung(3)} tong={6} suKien={3} xong={false} /></div>)
    const t3 = learningBattle(dung(3), 6)
    expect(t3.rage).toBe(true); expect(t3.damage).toBe(Math.ceil(100 / 6) * 2)
    expect(container.querySelector('.dao-san[data-no] .dao-san-tranh img')!.getAttribute('src')).toBe('/than-thu-v2/nho/the-2-cuong-no.webp')
    expect(container.textContent).toContain('CUỒNG NỘ ×2 · 3 câu đúng liền')
    expect(container.querySelector('.dao-san-so')!.textContent).toBe(`−${t3.damage}`)
  })
  it('trả lời sai ⇒ thú mất máu theo công thức cũ, không cuồng nộ', () => {
    const kq = [{ qid: 'q0', correct: true }, { qid: 'q1', correct: false }], t = learningBattle(kq, 6)
    const { container } = render(<div className="dao"><SanDau profile={hoSo} ketQua={kq} tong={6} suKien={2} xong={false} /></div>)
    expect(screen.getByRole('progressbar', { name: 'Máu của Lửa Nhỏ' }).getAttribute('aria-valuenow')).toBe(String(t.hp))
    expect(container.querySelector('.dao-san-so')!.getAttribute('data-phia')).toBe('thu')
  })
})

describe('Chuyến thám hiểm', () => {
  it('chưa chọn đáp án ⇒ nút khoá và KHÔNG nổi; chọn xong ⇒ nút nổi, một chạm là nộp', () => {
    const onTraLoi = vi.fn(), onNop = vi.fn(), { container, rerender } = ve({ onTraLoi, onNop })
    expect((screen.getByRole('button', { name: 'Chọn đáp án để tung chưởng' }) as HTMLButtonElement).disabled).toBe(true)
    expect(container.querySelector('.dao-tham-chan')!.hasAttribute('data-noi')).toBe(false)
    fireEvent.click(screen.getByText('Hai')); expect(onTraLoi).toHaveBeenCalledWith('B')
    rerender(<div className="dao"><ThamHiem {...props({ traLoi: 'B', onNop })} /></div>)
    expect(container.querySelector('.dao-tham-chan')!.hasAttribute('data-noi')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Trả lời · tung chưởng' })); expect(onNop).toHaveBeenCalledTimes(1)
  })
  it('sau khi nộp: in NGUYÊN lý do thưởng máy chủ trả (tách số EXP ra huy hiệu), có lời giải, khoá đổi đáp án, nút sang ải kế', () => {
    const onTraLoi = vi.fn(), onTiep = vi.fn()
    ve({ viTri: 2, ketQua: dung(3), traLoi: 'B', onTraLoi, onTiep, phanHoi: { correct: true, answer: 'B', solution: 'Vì thế này.', solutionImages: [], lyDo: { moc: 2, exp: 40, chu: '+40 · đúng lại ở một câu khác sau 1 ngày — sao thứ 2 của dạng này' } } })
    const thuong = screen.getByText(/sao thứ 2 của dạng này/).closest('.dao-thuong')!
    expect(thuong.querySelector('b')!.textContent).toBe('+40'); expect(thuong.getAttribute('data-moc')).toBe('2')
    expect(thuong.querySelector('p')!.textContent).toBe('đúng lại ở một câu khác sau 1 ngày — sao thứ 2 của dạng này')
    fireEvent.click(screen.getByText('Ba')); expect(onTraLoi).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Đã đọc lời giải · sang ải 4' })); expect(onTiep).toHaveBeenCalledTimes(1)
  })
  it('sai ⇒ dòng lý do nói rõ vì sao 0 EXP; ải cuối ⇒ nút "hoàn thành chuyến"', () => {
    ve({ viTri: 5, ketQua: [...dung(5), { qid: 'q5', correct: false }], traLoi: 'A', phanHoi: { correct: false, answer: 'B', solution: '', solutionImages: [], lyDo: { moc: 0, exp: 0, chu: 'Chưa đúng — dạng này hẹn em ôn lại vào ngày mai' } } })
    expect(screen.getByText('Chưa đúng — dạng này hẹn em ôn lại vào ngày mai').closest('.dao-thuong')!.querySelector('b')!.textContent).toBe('Ôn lại')
    expect(screen.getByRole('button', { name: 'Đã đọc lời giải · hoàn thành chuyến' })).toBeTruthy()
  })
  it('xong chuyến: tổng kết từ số máy chủ đã trả + về đảo / sổ tay / đi chuyến nữa', () => {
    const onVeDao = vi.fn(), onChuyenMoi = vi.fn(), onMoSoTay = vi.fn()
    ve({ viTri: 5, ketQua: dung(6), xong: true, tongKet: { dung: 5, tong: 6, exp: 60, sao: 2 }, onVeDao, onChuyenMoi, onMoSoTay })
    expect(screen.getByText('5/6')).toBeTruthy(); expect(screen.getByText('+60')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'VỀ ĐẢO' })); fireEvent.click(screen.getByRole('button', { name: 'Đi chuyến nữa' })); fireEvent.click(screen.getByRole('button', { name: 'Xem Sổ tay' }))
    expect([onVeDao, onChuyenMoi, onMoSoTay].map(f => f.mock.calls.length)).toEqual([1, 1, 1])
  })
  it('KHÔNG tự cuộn trang (bỏ scrollIntoView) và tắt sạch chuyển động khi reduce-motion', () => {
    ve({ viTri: 2, ketQua: dung(3), traLoi: 'B', phanHoi: { correct: true, answer: 'B', solution: '', solutionImages: [], lyDo: { moc: 1, exp: 20, chu: '+20 · lần đầu em tự làm đúng dạng này — sao thứ 1' } } })
    expect(cuon).not.toHaveBeenCalled()
    const goc = resolve(__dirname, '../src/game/than-thu-v2/dao')
    for (const tep of ['ThamHiem.tsx', 'DaoCuaEm.tsx', 'ChonBanDongHanh.tsx']) expect(readFileSync(resolve(goc, tep), 'utf8')).not.toMatch(/scrollIntoView|window\.scrollTo/)
    const css = readFileSync(resolve(goc, 'dao.css'), 'utf8')
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\)\{\s*\.dao \*,\.dao \*::before,\.dao \*::after\{animation:none!important;transition:none!important\}/)
  })
})
