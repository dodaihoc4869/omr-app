// GAME HÓA 2.0 · LUỒNG ĐẢO MỚI: bản đồ (hoa2-sanh) → soạn chuyến bằng ĐÚNG lệnh cũ resume → sync → start → 6 ô vai + nút Trùm →
// LÊN ĐƯỜNG → ải (answer) → lời giải → … → complete → "SƯƠNG MÙ ĐÃ TAN". Thanh chọn game 2.0 bỏ Võ đài / Tiến bộ / Sắp ra mắt; cờ tắt như cũ.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
import Dao2 from '../src/game/than-thu-v2/dao2/Dao2'
import { cuaGame } from '../src/game/than-thu-v2/Game'
import { soChuyen, soDamSuong, vungTheoDang, ghepGoiY, nhoGoiYPhien, docGoiYPhien, chuNgay } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(cleanup)
const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const VAI = ['moi', 'moi', 'on_lai', 'moi', 'moi', 'trum']
const cau = (i: number): CauDao2 => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Chất béo', mucDo: 'biet', sao: 1, kienThuc: [], vai: VAI[i] })
const sanh = (coXat: number, daoCon: number) => ({ ok: true, cheDo2: true, ngay: '2026-09-30', chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: daoCon, tong: 40 }, huyetChien: false, doan: { con: 0 }, dao: { con: daoCon }, khoaDao: false, ruong: { daLam: 40 - daoCon, tong: 40, moDuoc: false, daMo: false } })

describe('Luồng Đảo 2.0', () => {
  it('soạn sẵn chuyến bằng resume → sync → start; bản đồ vẽ 6 ô vai + "Chuyến thám hiểm 1/5"; chơi hết 6 ải → complete → SƯƠNG MÙ ĐÃ TAN', async () => {
    let lanSanh = 0
    const nhat: [string, Record<string, unknown>][] = []
    const kich: Record<string, (d: Record<string, unknown>) => unknown> = {
      'hoa2-sanh': () => (lanSanh++ === 0 ? sanh(67, 28) : sanh(71, 22)),
      'hoa2-cau-da-lam': () => ({ ok: true, cau: [{ qid: 'q0', chienDichId: 'cd1', tenDang: 'Chất béo', lanCuoiDung: false, henOn: '2026-10-01' }, { qid: 'x', chienDichId: 'cd1', tenDang: 'Danh pháp', lanCuoiDung: true }] }),
      resume: () => ({ questions: [] }),
      sync: () => ({ remaining: 0 }),
      start: () => ({ id: 's1', questions: VAI.map((_, i) => cau(i)), theLuc: { con: 28, tong: 40 }, dao: { con: 28 }, doan: { con: 0 } }),
      answer: d => d.qid === 'q0' ? { correct: false, answer: 'A', traLoi: 'B', solution: { chot: 'Chốt câu 1' }, reward: 0, stage: 0 } : { correct: true, answer: 'A', traLoi: 'A', solution: { chot: 'Chốt' }, reward: 4, stage: 1, lyDoThuong: { moc: 1, exp: 4, chu: '+4 · Lời của máy chủ' } },
      complete: () => ({ correct: 5, total: 6 }),
    }
    const call = vi.fn(async (action: string, data: Record<string, unknown> = {}): Promise<DaoKetQua> => { nhat.push([action, data]); return { ok: true, ...((kich[action]?.(data) as object) ?? {}) } as DaoKetQua })
    const { container } = render(<Dao2 sbd="S1" profile={hoSo} call={call} doanMo onMoDoan={() => {}} onMoSoTay={() => {}} onDong={() => {}} />)
    await waitFor(() => expect(nhat.map(n => n[0])).toContain('start'))
    expect(nhat.map(n => n[0]).filter(a => ['resume', 'sync', 'start'].includes(a))).toEqual(['resume', 'sync', 'start'])
    expect(nhat.find(n => n[0] === 'start')![1]).toEqual({ mode: 'adventure' })
    expect(await screen.findByRole('heading', { name: 'Chuyến thám hiểm 1/5' })).toBeTruthy()
    await waitFor(() => expect([...container.querySelectorAll('.dao2-bd-vai li')].map(li => li.textContent)).toEqual(['Mới', 'Mới', 'Ôn lại', 'Mới', 'Mới', 'Trùm']))
    expect(container.querySelector('.dao2-bd-nut[data-vai="trum"] .dao2-bd-vuong-mien')).toBeTruthy() // nút Trùm có vương miện
    expect(container.querySelector('.dao2-bd-thu')?.getAttribute('alt')).toBe('Thần thú của em: Lửa Nhỏ')
    expect(container.querySelector('.dao2-bd-suong')?.getAttribute('data-so')).toBe(String(soDamSuong(67, 120)))
    expect(screen.getByText('67/120 ô')).toBeTruthy(); expect(screen.getByText(/Đền mọc từ Thứ Sáu 02\/10/)).toBeTruthy()
    await waitFor(() => expect(container.querySelector('.dao2-bd-vung')?.textContent).toMatch(/Chất béo · 0%.*Danh pháp · 100%/))
    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    for (let i = 0; i < 6; i++) {
      await screen.findByText(new RegExp(`^ẢI ${i + 1}/6`))
      expect(container.querySelector('.loi-giai')).toBeNull() // chưa chốt: không lời giải, không đáp án
      fireEvent.click(screen.getByRole('button', { name: i === 0 ? /^B\./ : /^A\./ }))
      fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÁP ÁN' }))
      const tiep = await screen.findByRole('button', { name: i < 5 ? `ĐÃ ĐỌC LỜI GIẢI · SANG ẢI ${i + 2}` : 'ĐÃ ĐỌC LỜI GIẢI · HOÀN THÀNH CHUYẾN' })
      expect(container.querySelector('.loi-giai')).toBeTruthy()
      if (i === 0) { expect(container.textContent).toMatch(/Chưa đúng · quái phản đòn/); expect(nhat.find(n => n[0] === 'answer')![1]).toEqual({ session: 's1', qid: 'q0', answer: 'B', assisted: false }) }
      fireEvent.click(tiep)
    }
    expect(await screen.findByRole('heading', { name: 'SƯƠNG MÙ ĐÃ TAN' })).toBeTruthy()
    expect(nhat.filter(n => n[0] === 'complete').map(n => n[1])).toEqual([{ session: 's1' }])
    await waitFor(() => expect(screen.getByRole('button', { name: 'ĐI CHUYẾN 2/5' })).toBeTruthy())
    expect(container.textContent).toMatch(/Chuyến thám hiểm 1\/5 · đã hạ Quái Sương Mù/)
    expect(container.querySelector('.dao2-xong-chip')?.textContent).toBe('+4 ô đất mới')
    expect([...container.querySelectorAll('.dao2-xong-so li')].map(li => li.textContent)).toEqual(['5/6ải đúng', '+20EXP', '71/120ô đã khai phá'])
    await waitFor(() => expect(container.textContent).toMatch(/Ải 1 em chưa đúng: câu này đến lịch ôn lại Thứ Năm 01\/10\./))
    expect(localStorage.getItem('dao2:chuyen-xong:S1:2026-09-30')).toBe('1')
  }, 30000) // 6 ải thật (dựng TheCau 12 lần): chạy chung cả bộ thì máy nặng — nới hạn, không đo thời gian

  it('máy chủ trả hết kế hoạch ⇒ bản đồ nói đúng lời máy chủ, không nút LÊN ĐƯỜNG', async () => {
    const call = vi.fn(async (action: string): Promise<DaoKetQua> => ({ ok: true, ...(action === 'start' ? { questions: [], lyDo: 'xong_ke_hoach', het: true, message: 'Hôm nay em xong rồi. Mai quay lại khám phá tiếp nhé.' } : action === 'sync' ? { remaining: 0 } : action === 'resume' ? { questions: [] } : {}) } as DaoKetQua))
    render(<Dao2 sbd="S1" profile={hoSo} call={call} doanMo={false} sanhDau={sanh(120, 0)} onMoDoan={() => {}} onMoSoTay={() => {}} onDong={() => {}} />)
    expect(await screen.findByText('Hôm nay em xong rồi. Mai quay lại khám phá tiếp nhé.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /LÊN ĐƯỜNG/ })).toBeNull()
  })

  it('đi tiếp chuyến dở (resume) giữ vai + Bùa đã nhớ lúc start; lõi thuần: soChuyen, soDamSuong, vungTheoDang, chuNgay', async () => {
    nhoGoiYPhien('s9', [{ ...cau(0), goiY: { gach: ['C', 'D'] } }, cau(5)])
    const cong = ({ vai: _v, goiY: _g, ...c }: CauDao2) => c
    expect(ghepGoiY([cong(cau(0)), cong(cau(5))], docGoiYPhien('s9')).map(c => [c.vai, c.goiY])).toEqual([['moi', { gach: ['C', 'D'] }], ['trum', undefined]])
    const call = vi.fn(async (action: string): Promise<DaoKetQua> => ({ ok: true, ...(action === 'resume' ? { id: 's9', mode: 'adventure', questions: [cong(cau(0)), cong(cau(5))], answered: [] } : action === 'hoa2-sanh' ? sanh(67, 28) : {}) } as DaoKetQua))
    const { container } = render(<Dao2 sbd="S1" profile={hoSo} call={call} doanMo onMoDoan={() => {}} onMoSoTay={() => {}} onDong={() => {}} />)
    await waitFor(() => expect([...container.querySelectorAll('.dao2-bd-vai li')].map(li => li.textContent)).toEqual(['Mới', 'Trùm']))
    expect(call.mock.calls.map(c => c[0])).not.toContain('start')
    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    await waitFor(() => expect(container.querySelectorAll('.pa-hang[data-gach]').length).toBe(2))
    expect(soChuyen(28, 0)).toEqual({ k: 1, n: 5 }); expect(soChuyen(22, 1)).toEqual({ k: 2, n: 5 }); expect(soChuyen(0, 0)).toBeNull(); expect(soChuyen(undefined, 2)).toBeNull()
    expect(soDamSuong(0, 120)).toBe(10); expect(soDamSuong(119, 120)).toBe(1); expect(soDamSuong(120, 120)).toBe(0)
    expect(vungTheoDang({ cau: [{ chienDichId: 'khac', tenDang: 'X', lanCuoiDung: true }] }, 'cd1')).toEqual([])
    expect(chuNgay('2026-09-30')).toBe('Thứ Tư 30/09'); expect(chuNgay('sai')).toBe('')
  })
})

describe('Thanh chọn game ở chế độ 2.0', () => {
  it('2.0: chỉ Bát Linh Đảo (+ Đoàn Hộ Tống khi doanMo) — bỏ Võ đài, Tiến bộ, Sắp ra mắt; cờ tắt giữ nguyên', () => {
    const THU_BAY = Date.parse('2026-09-26T09:00:00+07:00')
    expect(cuaGame(true, THU_BAY, true)).toEqual({ nav: [['home', 'Bát Linh Đảo'], ['doan', 'Đoàn Hộ Tống']], voDaiMo: false })
    expect(cuaGame(false, THU_BAY, true).nav.map(x => x[1])).toEqual(['Bát Linh Đảo'])
    expect(cuaGame(true, THU_BAY).nav.map(x => x[1])).toEqual(['Bát Linh Đảo', 'Đoàn Hộ Tống', 'Võ đài thứ Bảy', 'Tiến bộ của em', 'Game mới · Sắp ra mắt'])
    expect(cuaGame(false, THU_BAY).nav.map(x => x[1])).toEqual(['Bát Linh Đảo', 'Hộ Tống Linh Tâm', 'Tiến bộ của em', 'Game mới · Sắp ra mắt'])
  })
})
