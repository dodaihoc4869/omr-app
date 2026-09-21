// ĐẢO THẦN THÚ bản mới · VỎ `DaoThanThu`: đúng thứ tự lệnh máy chủ (không đổi thuật toán), một nút LÊN ĐƯỜNG gộp resume → sync → start,
// cờ doanMo, lý do thưởng (máy chủ trả thì in nguyên; vắng thì suy từ stage), khiên giữ nguyên lệnh shield-use.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
import DaoThanThu from '../src/game/than-thu-v2/dao/DaoThanThu'
import type { CauDao, DaoKetQua, DaoProfile, DaoThanThuProps } from '../src/game/than-thu-v2/dao/kieu'

// máy chủ giả trả ngay (không đồng hồ thật); nới hạn chờ để máy tải nặng không đỏ oan
configure({ asyncUtilTimeout: 8000 })
afterEach(cleanup)
const hoSo = (them: Partial<DaoProfile> = {}): DaoProfile => ({ nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 10, wallet: 0, mastery: [], shields: { used: 0, activeUntil: 0 }, ...them })
const cau = (i: number, role?: CauDao['role']): CauDao => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: `D${i}`, tenDang: `Dạng ${i + 1}`, mucDo: 'hieu', sao: 2, kienThuc: [], role })
type Tra = Partial<DaoKetQua> | Error
function mayChu(kich: Record<string, Tra | ((d: Record<string, unknown>) => Tra)>) {
  const nhat: [string, Record<string, unknown>][] = []
  const call = vi.fn(async (action: string, data: Record<string, unknown> = {}): Promise<DaoKetQua> => {
    nhat.push([action, data]); const k = kich[action], r = typeof k === 'function' ? k(data) : k
    if (r instanceof Error) throw r
    return { ok: true, ...(r ?? {}) }
  })
  return { call, nhat, ten: () => nhat.map(n => n[0]) }
}
const dung = (p: Partial<DaoThanThuProps> & Pick<DaoThanThuProps, 'call'>) => render(<DaoThanThu sbd="12121212" profile={hoSo()} doanMo={false} onMoDoan={() => {}} onDong={() => {}} {...p} />)

describe('Vỏ Đảo thần thú', () => {
  it('chưa chọn thú ⇒ màn Chọn bạn đồng hành; một chạm = choose rồi mới rename; không gọi lệnh nào của đảo trước khi chọn', async () => {
    const mc = mayChu({})
    dung({ call: mc.call, profile: hoSo({ choice: true, nickname: undefined }) })
    expect(mc.ten()).toEqual([])
    fireEvent.change(screen.getByLabelText('Đặt tên cho thần thú'), { target: { value: 'Tia Nắng' } })
    fireEvent.click(screen.getByRole('button', { name: /^CHỌN / }))
    await waitFor(() => expect(mc.ten()).toEqual(['choose', 'rename']))
    expect(mc.nhat[1]![1]).toEqual({ name: 'Tia Nắng' })
  })
  it('cờ doanMo=false ⇒ KHÔNG có mục Đoàn; true ⇒ có, chạm thì gọi onMoDoan', async () => {
    const mc = mayChu({}), onMoDoan = vi.fn(), v = dung({ call: mc.call })
    await waitFor(() => expect(mc.ten()).toContain('so-tay'))
    expect([...v.container.querySelectorAll('.dao-nav button')].map(b => b.textContent)).toEqual(['Đảo', 'Sổ tay', 'Túi đồ'])
    v.rerender(<DaoThanThu sbd="1" profile={hoSo()} doanMo call={mc.call} onMoDoan={onMoDoan} onDong={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Đoàn Hộ Tống' })); expect(onMoDoan).toHaveBeenCalledTimes(1)
  })
  it('LÊN ĐƯỜNG: resume (không có lượt dở) → sync tới khi remaining=0 → start; làm đủ các ải → complete; lý do thưởng: có thì in nguyên, vắng thì suy từ stage', async () => {
    let lanSync = 0
    const mc = mayChu({
      recommendations: { suggestions: [{ title: 'Ester thuỷ phân', source: 'DE', part: 'I' }], remaining: 100 },
      sync: () => ({ remaining: lanSync++ === 0 ? 1 : 0 }),
      start: { id: 's1', mode: 'adventure', questions: [cau(0, 'yeu'), cau(1, 'thu_thach')] },
      answer: d => d.qid === 'q0' ? { correct: true, answer: 'B', reward: 40, stage: 2, lyDoThuong: { moc: 2, exp: 40, chu: '+40 · CHỮ CỦA MÁY CHỦ' } } : { correct: true, answer: 'B', reward: 20, stage: 1 },
    })
    dung({ call: mc.call })
    await waitFor(() => expect(screen.getByText('Ester thuỷ phân')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    await waitFor(() => expect(screen.getByLabelText('Ải 1')).toBeTruthy())
    expect(mc.ten().filter(a => !['recommendations', 'so-tay'].includes(a))).toEqual(['resume', 'sync', 'sync', 'start'])
    expect(mc.nhat.find(n => n[0] === 'start')![1]).toEqual({ mode: 'adventure', dang: undefined })
    fireEvent.click(screen.getByText('Hai')); fireEvent.click(screen.getByRole('button', { name: 'Trả lời · tung chưởng' }))
    await waitFor(() => expect(screen.getByText('CHỮ CỦA MÁY CHỦ')).toBeTruthy())
    expect(mc.nhat.find(n => n[0] === 'answer')![1]).toEqual({ session: 's1', qid: 'q0', answer: 'B', assisted: false })
    fireEvent.click(screen.getByRole('button', { name: 'Đã đọc lời giải · sang ải 2' }))
    await waitFor(() => expect(screen.getByLabelText('Ải 2')).toBeTruthy())
    fireEvent.click(screen.getByText('Hai')); fireEvent.click(screen.getByRole('button', { name: 'Trả lời · tung chưởng' }))
    await waitFor(() => expect(screen.getByText(/lần đầu em tự làm đúng dạng này — sao thứ 1/)).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Đã đọc lời giải · hoàn thành chuyến' }))
    await waitFor(() => expect(screen.getByText('Xong chuyến thám hiểm')).toBeTruthy())
    expect(mc.nhat.find(n => n[0] === 'complete')![1]).toEqual({ session: 's1' })
    expect(screen.getByText('2/2')).toBeTruthy(); expect(screen.getByText('+60')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'VỀ ĐẢO' })); expect(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ })).toBeTruthy()
  })
  it('có lượt đang dở ⇒ LÊN ĐƯỜNG đi tiếp đúng ải chưa làm, KHÔNG gọi sync/start', async () => {
    const mc = mayChu({ resume: { id: 's9', mode: 'adventure', questions: [cau(0), cau(1), cau(2)], answered: [{ attempt: { qid: 'q0', correct: true }, correct: true, answer: 'B', solution: '', reward: 20, stage: 1, solutionImages: [] }] } })
    dung({ call: mc.call })
    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    await waitFor(() => expect(screen.getByLabelText('Ải 2')).toBeTruthy())
    expect(mc.ten()).not.toContain('start'); expect(mc.ten()).not.toContain('sync')
  })
  it('kho chưa có câu hợp ⇒ ở lại đảo với lời của học sinh (không "tờ đề"); lỗi mạng ⇒ role=alert, bấm lại được', async () => {
    const mc = mayChu({ start: { questions: [] } }), v = dung({ call: mc.call })
    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    await waitFor(() => expect(screen.getByText(/Đảo chưa có câu hợp/)).toBeTruthy())
    expect(v.container.textContent).not.toMatch(/tờ đề|dòng kết quả/)
    cleanup()
    const hong = mayChu({ sync: new Error('Mất mạng rồi.') }); dung({ call: hong.call })
    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Mất mạng rồi.'))
    expect((screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }) as HTMLButtonElement).disabled).toBe(false)
  })
  it('gia đình nhắc ôn ⇒ start chế độ repair đúng dạng; Túi đồ dùng khiên = lệnh shield-use cũ; Sổ tay đọc lệnh so-tay', async () => {
    const mc = mayChu({ start: { id: 's2', mode: 'repair', questions: [cau(0, 'yeu')] }, 'so-tay': { dang: [{ key: 'ES.TP', ten: 'Thuỷ phân ester', chuong: 'ES' }] } })
    dung({ call: mc.call, tasks: [{ id: 't', dang: 'Xà phòng hoá' }] })
    fireEvent.click(screen.getByRole('button', { name: 'Ôn ngay' }))
    await waitFor(() => expect(screen.getByLabelText('Ải 1')).toBeTruthy())
    expect(mc.nhat.find(n => n[0] === 'start')![1]).toEqual({ mode: 'repair', dang: 'Xà phòng hoá' }); expect(mc.ten()).not.toContain('resume')
    fireEvent.click(screen.getByRole('button', { name: /Về đảo/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sổ tay' })); expect(screen.getByLabelText('Nhóm ES')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Túi đồ' })); fireEvent.click(screen.getByRole('button', { name: 'Dùng khiên' }))
    await waitFor(() => expect(mc.ten()).toContain('shield-use'))
    expect(typeof mc.nhat.find(n => n[0] === 'shield-use')![1].useId).toBe('string')
  })
  it('`call` đổi danh tính mỗi lần vẽ (nơi nối không useCallback) ⇒ KHÔNG nạp lại vô hạn', async () => {
    const mc = mayChu({}), v = render(<DaoThanThu sbd="1" profile={hoSo()} doanMo={false} call={(a, d) => mc.call(a, d)} onMoDoan={() => {}} onDong={() => {}} />)
    for (let i = 0; i < 5; i++) v.rerender(<DaoThanThu sbd="1" profile={hoSo()} doanMo={false} call={(a, d) => mc.call(a, d)} onMoDoan={() => {}} onDong={() => {}} />)
    await waitFor(() => expect(mc.ten()).toContain('so-tay'))
    expect(mc.ten().filter(a => a === 'so-tay').length).toBe(1)
  })
})
