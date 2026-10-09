// ĐẢO 2.0 · TRẬN DỰNG SẴN (P2 05/10) — src/game/than-thu-v2/dao2/Dao2.tsx. Chuyến đã soạn mà em còn ở bản đồ ⇒ màn trận được dựng
// sẵn ẨN (<Activity hidden>): không thấy, không bấm/đọc được; bấm LÊN ĐƯỜNG là hiện ĐÚNG cây đã dựng (không dựng lại trong lượt chạm).
// Rời trận rồi vào lại = thể hiện MỚI như trước (mỗi lần vào trận dựng lại sạch).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Dao2 from '../src/game/than-thu-v2/dao2/Dao2'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})
afterEach(cleanup)
const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const cau = (i: number): CauDao2 =>
  ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Chất béo', mucDo: 'biet', sao: null, vai: i === 5 ? 'trum' : 'moi' }) as unknown as CauDao2
const sanh = { ok: true, cheDo2: true, ngay: '2026-10-05', chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-09', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0 }, theLuc: { con: 28, tong: 40 }, huyetChien: false, doan: { con: 0 }, dao: { con: 28 }, khoaDao: false }

describe('Đảo 2.0 · trận dựng sẵn', () => {
  it('bản đồ: trận có sẵn nhưng ẩn + ngoài cây trợ năng; LÊN ĐƯỜNG hiện đúng cây ấy; rời trận ⇒ dựng sẵn thể hiện mới', async () => {
    const call = vi.fn(
      async (action: string): Promise<DaoKetQua> =>
        ({ ok: true, ...(action === 'hoa2-sanh' ? sanh : action === 'resume' ? { questions: [] } : action === 'sync' ? { remaining: 0 } : action === 'start' ? { id: 's1', questions: [0, 1, 2, 3, 4, 5].map(cau) } : {}) }) as DaoKetQua,
    )
    const { container } = render(<Dao2 sbd="S1" profile={hoSo} call={call} doanMo onMoDoan={() => {}} onMoSoTay={() => {}} onDong={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Chuyến thám hiểm 1/5' })).toBeTruthy()
    await waitFor(() => expect(container.querySelector('.dao2-canh')).toBeTruthy())
    const canhSan = container.querySelector('.dao2-canh')!
    expect(getComputedStyle(canhSan.closest('.dao2')!).display).toBe('none')
    expect(screen.queryByRole('region', { name: 'Trận đấu' })).toBeNull()
    expect(screen.queryByRole('button', { name: /tung chiêu/i })).toBeNull()
    expect(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    expect(await screen.findByRole('region', { name: 'Trận đấu' })).toBeTruthy()
    expect(container.querySelector('.dao2-canh')).toBe(canhSan) // đúng cây đã dựng sẵn, không dựng lại
    expect(screen.queryByRole('button', { name: /LÊN ĐƯỜNG/ })).toBeNull()
    expect(screen.getByText('Câu 1/6')).toBeTruthy() // trung tu 09/10: bộ đếm "ẢI k/n" bỏ (trùng "Câu k/n" của thẻ câu)
    expect(call.mock.calls.filter(([a]) => a === 'start')).toHaveLength(1) // vào trận không gọi thêm lệnh nào

    fireEvent.click(screen.getByRole('button', { name: /Rời chuyến về bản đồ/ }))
    expect(await screen.findByRole('button', { name: /LÊN ĐƯỜNG/ })).toBeTruthy()
    await waitFor(() => expect(container.querySelector('.dao2-canh')).toBeTruthy())
    expect(container.querySelector('.dao2-canh')).not.toBe(canhSan) // lần vào sau = thể hiện mới (như trước)
    expect(screen.queryByRole('region', { name: 'Trận đấu' })).toBeNull()
  }, 30000) // dựng TheCau + cảnh trận thật: chạy chung cả bộ thì máy nặng — nới hạn, không đo thời gian
})
