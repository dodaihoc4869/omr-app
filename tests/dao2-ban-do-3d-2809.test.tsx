// ĐẢO 2.0 · BẢN ĐỒ 3D (bản vẽ docs/ban-ve-dao-3d-2809/Dao3D.html, CanhDao3D): vùng + % THẬT, sương mỗi vùng đục theo % thật
// (lõi đảo theo Cọ xát chung), đền theo Thành thạo ở vùng % cao nhất, thần thú (ảnh thật) đứng ở mốc hiện tại, hai chế độ sáng/tối.
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import BanDo from '../src/game/than-thu-v2/dao2/BanDo'
import { NUT, doDucSuong, pt } from '../src/game/than-thu-v2/dao2/CanhDao3D'
import { soDamSuong } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { CauDao2, Vung } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

afterEach(cleanup)
const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const VAI = ['moi', 'moi', 'on_lai', 'moi', 'on_lai', 'trum']
const CAU = VAI.map((vai, i): CauDao2 => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: 'C', choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Este', mucDo: 'biet', sao: 1, kienThuc: [], vai }))
const VUNG: Vung[] = [{ ten: 'Thuỷ phân este', daLam: 18, dung: 13, tiLe: 72 }, { ten: 'Đốt cháy este', daLam: 11, dung: 6, tiLe: 55 }, { ten: 'Chất béo', daLam: 10, dung: 4, tiLe: 40 }, { ten: 'Xà phòng hoá', daLam: 11, dung: 2, tiLe: 18 }]
const sanh = (coXat: number, thanhThao: number) => ({ ngay: '2026-09-30', chienDich: { id: 'cd1', ten: 'Este – Lipit', hanNop: '', D: null, tong: 40, coXat, thanhThao, canDayLai: 0, thanhThaoTangTu: null },
  theLuc: { con: 8, tong: 12 }, huyetChien: false, dao: { con: 8 }, doan: null, khoaDao: false, loiKhoaDao: '', ruong: null, canChonThu: false })
const ve = (s: ReturnType<typeof sanh>, cau: CauDao2[] | null, ketQua: { qid: string; correct: boolean }[], vung: Vung[]) =>
  render(<div className="dao dao2"><BanDo profile={hoSo} sanh={s as never} dangTai={false} cau={cau} ketQua={ketQua} soChuyen={{ k: 2, n: 4 }} vung={vung} onLenDuong={() => {}} onThuLai={() => {}} onVe={() => {}} /></div>)

describe('Đảo 2.0 · bản đồ 3D', () => {
  it('nhãn vùng = tên dạng · % thật; sương mỗi vùng đục theo % của vùng, vùng chưa có số + lõi theo Cọ xát', () => {
    const { container } = ve(sanh(22, 6), CAU, [{ qid: 'q0', correct: true }, { qid: 'q1', correct: false }], VUNG)
    expect([...container.querySelectorAll('.dao2-bd-vung li')].map(li => li.textContent)).toEqual(['Thuỷ phân este · 72%', 'Đốt cháy este · 55%', 'Chất béo · 40%', 'Xà phòng hoá · 18%'])
    expect(container.querySelector('.dao2-bd-vung li')!.getAttribute('aria-label')).toBe('Vùng Thuỷ phân este: 72% câu làm đúng ở lần gần nhất (13/18 câu)')
    expect(container.querySelector('.dao2-bd-vung li[data-sang]')!.textContent).toBe('Thuỷ phân este · 72%')
    expect(container.querySelector('.dao2-bd-suong')!.getAttribute('data-so')).toBe(String(soDamSuong(22, 40)))
    const duc = (v: string) => container.querySelector(`.dao2-bd-suong-vung[data-vung="${v}"]`)!.getAttribute('data-duc')
    expect(duc('0')).toBe(doDucSuong(.72).toFixed(2))
    expect(duc('3')).toBe(doDucSuong(.18).toFixed(2))
    expect(duc('4')).toBe(doDucSuong(22 / 40).toFixed(2)) // vùng chưa có số
    expect(duc('loi')).toBe(doDucSuong(22 / 40).toFixed(2))
    expect(Number(duc('3'))).toBeGreaterThan(Number(duc('0'))) // % thấp ⇒ sương dày hơn
  })

  it('đền = ceil(6·Thành thạo/tổng), mọc ở vùng % cao nhất; thần thú (ảnh thật) đứng ở mốc hiện tại; Trùm có vương miện', () => {
    const { container } = ve(sanh(22, 6), CAU, [{ qid: 'q0', correct: true }, { qid: 'q1', correct: false }], VUNG)
    expect([...container.querySelectorAll('.dao2-bd-den')].map(g => g.getAttribute('data-vung'))).toEqual(['0'])
    const thu = container.querySelector<HTMLImageElement>('.dao2-bd-khung .dao2-bd-thu')!
    expect(thu.getAttribute('alt')).toBe('Thần thú của em: Lửa Nhỏ')
    expect(thu.getAttribute('src')).toMatch(/than-thu/)
    expect(thu.style.left).toBe(pt(...NUT[2]!).left)
    expect(thu.style.top).toBe(pt(...NUT[2]!).top)
    expect(container.querySelector('.dao2-bd-nut[data-hien]')).toBe(container.querySelectorAll('.dao2-bd-nut')[2])
    expect(container.querySelector('.dao2-bd-nut[data-vai="trum"] .dao2-bd-vuong-mien')).toBeTruthy()
    expect([...container.querySelectorAll('.dao2-bd-nut')].map(g => g.getAttribute('data-trang'))).toEqual(['dung', 'sai', 'cho', 'cho', 'cho', 'cho'])
  })

  it('đảo 80% khai phá: 4 đền; đảo mới chưa có câu: không nhãn vùng, không đền, sương lõi phủ kín', () => {
    const { container, unmount } = ve(sanh(32, 22), CAU, [], [...VUNG, { ten: 'Đồng phân', daLam: 17, dung: 15, tiLe: 88 }, { ten: 'Hỗn hợp', daLam: 10, dung: 7, tiLe: 70 }])
    expect([...container.querySelectorAll('.dao2-bd-den')].map(g => g.getAttribute('data-vung'))).toEqual(['4', '0', '5', '1'])
    unmount()
    const moi = ve(sanh(0, 0), null, [], [])
    expect(moi.container.querySelector('.dao2-bd-vung')).toBeNull()
    expect(moi.container.querySelectorAll('.dao2-bd-den').length).toBe(0)
    expect(moi.container.querySelector('.dao2-bd-suong-vung[data-vung="loi"]')!.getAttribute('data-duc')).toBe('1.00')
    expect(moi.container.querySelectorAll('.dao2-bd-nut').length).toBe(0)
  })

  it('CSS: SÁNG = hoàng hôn (mặt trời), TỐI = đêm (trăng + sao) ở cả prefers-color-scheme lẫn data-giao-dien; hoạt ảnh chỉ khi không xin giảm chuyển động', () => {
    const css = readFileSync('src/game/than-thu-v2/dao2/dao2.css', 'utf8').replace(/\s+/g, '')
    const goc = css.slice(0, css.indexOf('}'))
    expect(goc).toContain('--d2-mat-troi:1;--d2-dem:0')
    const khoiToi = css.split('{color-scheme:dark;--d2-nen:rgb(7,18,41);').slice(1).map(k => k.slice(0, k.indexOf('}')))
    expect(khoiToi).toHaveLength(2)
    expect(khoiToi[0]).toBe(khoiToi[1])
    expect(khoiToi[0]).toContain('--d2-mat-troi:0;--d2-dem:1')
    expect(css).toContain('.dao2.dao2-3d-mat-troi{') && expect(css).toContain('opacity:var(--d2-mat-troi)')
    expect(css).toContain('opacity:var(--d2-dem)')
    const dong = css.slice(css.indexOf('/*─────BẢNĐỒ3D'))
    expect(dong.indexOf('@media(prefers-reduced-motion:no-preference){')).toBeLessThan(dong.indexOf('animation:d2-nhun'))
  })
})
