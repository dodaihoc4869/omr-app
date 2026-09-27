// GAME HÓA 2.0 · ĐẢO KHOÁ: còn câu ôn ở Đoàn ⇒ Đảo hiện ĐÚNG câu máy chủ gửi + nút về Sảnh; không soạn chuyến khi `hoa2-sanh` đã báo khoá.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
import KhoaDao from '../src/game/than-thu-v2/dao2/KhoaDao'
import Dao2 from '../src/game/than-thu-v2/dao2/Dao2'
import { LOI_KHOA_DAO_MAC_DINH, docSanh2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(cleanup)
const LOI = 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!'
const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const sanh = (them: Record<string, unknown> = {}) => ({ ok: true, cheDo2: true, ngay: '2026-09-30', chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: 32, tong: 40 }, huyetChien: false, doan: { con: 4 }, dao: { con: 28 }, khoaDao: false, ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false }, ...them })
function mayChu(kich: Record<string, unknown>) {
  const nhat: string[] = []
  const call = vi.fn(async (action: string): Promise<DaoKetQua> => { nhat.push(action); return { ok: true, ...((kich[action] as object) ?? {}) } as DaoKetQua })
  return { call, nhat }
}

describe('Đảo khoá (Game Hóa 2.0)', () => {
  it('màn khoá in đúng từng chữ câu máy chủ gửi; nút VỀ SẢNH gọi onVeSanh; có Đoàn thì thêm lối phụ vào Đoàn', () => {
    const veSanh = vi.fn(), moDoan = vi.fn()
    render(<div className="dao dao2"><KhoaDao message={LOI} doanCon={4} onVeSanh={veSanh} onMoDoan={moDoan} /></div>)
    expect(screen.getByRole('heading', { name: LOI })).toBeTruthy()
    expect(screen.getByText(/Còn 4 câu ôn đang chờ ở Đoàn Hộ Tống/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'VỀ SẢNH' })); expect(veSanh).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Vào Đoàn Hộ Tống' })); expect(moDoan).toHaveBeenCalledTimes(1)
    cleanup()
    // máy chủ quên gửi câu ⇒ dùng ĐÚNG lời máy chủ (không tự viết câu khác); không có Đoàn ⇒ không lối phụ
    render(<div className="dao dao2"><KhoaDao onVeSanh={veSanh} /></div>)
    expect(LOI_KHOA_DAO_MAC_DINH).toBe(LOI)
    expect(screen.getByRole('heading', { name: LOI })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Vào Đoàn Hộ Tống' })).toBeNull()
  })

  it('hoa2-sanh báo khoaDao ⇒ Dao2 hiện màn khoá với loiKhoaDao, KHÔNG gọi resume/sync/start', async () => {
    const mc = mayChu({}), veSanh = vi.fn()
    render(<Dao2 sbd="S1" profile={hoSo} call={mc.call} doanMo sanhDau={sanh({ khoaDao: true, loiKhoaDao: LOI })} onMoDoan={() => {}} onMoSoTay={() => {}} onDong={veSanh} />)
    expect(await screen.findByRole('heading', { name: LOI })).toBeTruthy()
    await new Promise(r => setTimeout(r, 20))
    expect(mc.nhat.filter(a => a === 'resume' || a === 'sync' || a === 'start')).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'VỀ SẢNH' })); expect(veSanh).toHaveBeenCalledTimes(1)
  })

  it('start trả lyDo khoa_cho_doan ⇒ màn khoá với đúng message của lệnh start (không vào ải)', async () => {
    const mc = mayChu({ resume: { questions: [] }, sync: { remaining: 0 }, start: { questions: [], lyDo: 'khoa_cho_doan', khoaDao: true, message: LOI, dao: { con: 28 }, doan: { con: 2 } } })
    render(<Dao2 sbd="S1" profile={hoSo} call={mc.call} doanMo={false} sanhDau={sanh({ doan: { con: 0 } })} onMoDoan={() => {}} onMoSoTay={() => {}} onDong={() => {}} />)
    expect(await screen.findByRole('heading', { name: LOI })).toBeTruthy()
    expect(mc.nhat.filter(a => a !== 'hoa2-cau-da-lam')).toEqual(['resume', 'sync', 'start'])
    expect(screen.getByText(/Còn 2 câu ôn đang chờ/)).toBeTruthy() // số lấy từ tóm tắt start trả kèm
    expect(screen.queryByRole('button', { name: 'Vào Đoàn Hộ Tống' })).toBeNull() // doanMo=false
  })

  it('docSanh2 đọc chặt: cờ tắt (cheDo2:false) / máy chủ cũ ⇒ null (Đảo cũ)', () => {
    expect(docSanh2({ ok: true, cheDo2: false })).toBeNull()
    expect(docSanh2({ ok: true })).toBeNull()
    const s = docSanh2(sanh({ khoaDao: true, loiKhoaDao: LOI }))!
    expect(s.khoaDao).toBe(true); expect(s.loiKhoaDao).toBe(LOI); expect(s.chienDich?.coXat).toBe(67); expect(s.theLuc).toEqual({ con: 32, tong: 40 })
  })
})
