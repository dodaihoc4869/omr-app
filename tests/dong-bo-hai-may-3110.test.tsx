// @vitest-environment jsdom
// ĐỒNG BỘ NHIỀU MÁY (thầy 31/10: «hai thiết bị đăng nhập ko đồng bộ với nhau. Làm như doligo đi»): Lộ trình vẽ chặng dở LƯU Ở MÁY (`omr_chang_dang_cua`)
// đè lên số máy chủ. Máy chủ biết em đã làm NHIỀU HƠN chặng dở ấy (máy khác làm tiếp) ⇒ bản lưu cũ bị bỏ, Lộ trình hiện đúng số máy chủ. Máy chủ chưa theo kịp
// (câu máy này vừa nộp chưa về) ⇒ vẫn hiện tiến độ của máy này như cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import { batGoiNgay, luuChangDangLam } from '../src/components/hoc-tap/mo-chang-truoc'

const noop = () => {}
const goc = (so: PropsMotTrang['so']): PropsMotTrang => ({
  so, dangTai: false, tenBai: 'Amine', viec: 'Hiểu · Chặng 3/5', onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 0, onChua: noop,
  ngayKiem: false, soBaiTap: 0, coBaiTap: false, onBaiTap: noop, ghi: [],
})
const so = (daLam: number, chang: number) => ({ daLam, muc: 30, chang, soChang: 5 }) as PropsMotTrang['so']
const nut = () => within(screen.getByRole('list', { name: 'Lộ trình hôm nay' })).getAllByRole('listitem').map((li) => li.firstElementChild as HTMLElement)
const luuChang3 = () => {
  const cau = Array.from({ length: 6 }, (_, i) => ({ qid: `c${i}`, phan: 'I', text: `Câu ${i}`, choices: ['A', 'B', 'C', 'D'], hinhAnh: [], ideas: [], kienThuc: [] }))
  luuChangDangLam('s1', {
    moLuc: Date.now(), phien: 'p', cau, soGoc: 6, viTri: 2, ket: { c0: { correct: true, answer: 'A' }, c1: { correct: false, answer: 'B' } }, tra: '', chang: 3, goi7: undefined,
    dem: { daLam: 14, muc: 30 }, moi: { qids: ['c0', 'c1'], tiep: 0, d0: 12, ngay: '' }, tuLam: true, goiY: false, moLoiGiai: false, msCau: {}, dhMs: 0,
    dhT: { v: 1, a: 0, l: 0, n: 0, lang: 0 }, daXinLamLai: false, luotChang: 0, daHoiThay: '', hoTroCham: '',
  } as never)
}
afterEach(() => { cleanup(); batGoiNgay(false); try { localStorage.clear(); sessionStorage.clear() } catch { /* bỏ qua */ } })

describe('đồng bộ hai máy trên Lộ trình', () => {
  it('máy chủ đi trước chặng dở của máy này (máy khác đã làm tới 20 câu) ⇒ bỏ bản lưu cũ, chặng 4 đang học, không kẹp về chặng 3', () => {
    batGoiNgay(true)
    luuChang3()
    expect(localStorage.getItem('omr_chang_dang_cua')).toBeTruthy()
    render(<MotTrangHs {...goc(so(20, 4))} />)
    expect(localStorage.getItem('omr_chang_dang_cua')).toBeNull()
    expect(localStorage.getItem('omr_chang_dang_lam_s1')).toBeNull()
    const dang = nut().filter((n) => n.getAttribute('data-loai') === 'hoc' && n.getAttribute('data-tt') === 'dang')
    expect(dang).toHaveLength(1)
    const hoc = nut().filter((n) => n.getAttribute('data-loai') === 'hoc')
    expect(hoc.indexOf(dang[0]!)).toBe(3) // chặng 4 (đếm từ 0) — đúng số máy chủ
  })
  it('máy chủ chưa theo kịp câu máy này vừa nộp (12 < 12 + 2) ⇒ giữ tiến độ máy này, chặng 3 đang học', () => {
    batGoiNgay(true)
    luuChang3()
    render(<MotTrangHs {...goc(so(12, 3))} />)
    expect(localStorage.getItem('omr_chang_dang_cua')).toBeTruthy()
    const hoc = nut().filter((n) => n.getAttribute('data-loai') === 'hoc')
    expect(hoc.findIndex((n) => n.getAttribute('data-tt') === 'dang')).toBe(2)
  })
})
