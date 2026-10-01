// ĐẢO 2.0 · BỐ CỤC NGANG (bản vẽ docs/ban-ve-ngang-2809/Ngang-Dao*.dc.html): máy tính ≥ 1024 px hoặc xoay ngang ≥ 700 px ⇒ lưới 7/5,
// TRÁI = thế giới game (bản đồ, cảnh trận có thần thú, thanh ải) · PHẢI = phần học (đề, lời giải, nút chính ở đáy). Dọc giữ nguyên.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import TrongAi from '../src/game/than-thu-v2/dao2/TrongAi'
import type { PhanHoi2 } from '../src/game/than-thu-v2/dao2/TrongAi'
import BanDo from '../src/game/than-thu-v2/dao2/BanDo'
import XongChuyen from '../src/game/than-thu-v2/dao2/XongChuyen'
import { MQ_NGANG } from '../src/game/than-thu-v2/dao2/ngang'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

const goc = window.matchMedia
afterEach(() => { cleanup(); window.matchMedia = goc; vi.restoreAllMocks() })
/** Giả màn hình: `ngang` ⇒ đúng câu MQ_NGANG khớp. */
const manHinh = (ngang: boolean) => { window.matchMedia = ((q: string) => ({ matches: ngang && q === MQ_NGANG, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia }

const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const VAI = ['moi', 'moi', 'on_lai', 'moi', 'moi', 'trum']
const cau = (i: number): CauDao2 => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1} về C6H12O6`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Glucose', mucDo: 'biet', sao: 1, kienThuc: [], vai: VAI[i] })
const CAU = VAI.map((_, i) => cau(i))
const phanHoi: PhanHoi2 = { correct: false, answer: 'A', traLoi: 'B', solution: { chot: 'Glucose có nhóm –CHO.' }, solutionImages: [], reward: 0, lyDo: { moc: 0, exp: 0, chu: 'Câu này em sẽ gặp lại để ôn.' } }
const trongAi = (ph: PhanHoi2 | null) => render(<div className="dao dao2"><TrongAi profile={hoSo} cau={CAU} viTri={2} ketQua={[{ qid: 'q0', correct: true }, { qid: 'q1', correct: false }]} traLoi="B" assisted={false} phanHoi={ph}
  onTraLoi={() => {}} onAssisted={() => {}} onNop={() => {}} onTiep={() => {}} onRoi={() => {}} /></div>)

describe('Đảo 2.0 · bố cục ngang', () => {
  it('CSS: cùng câu truy vấn với MQ_NGANG; dọc các lớp bọc là display:contents; cột phải tự cuộn, nút không dính trôi', () => {
    const css = readFileSync('src/game/than-thu-v2/dao2/dao2.css', 'utf8').replace(/\s+/g, '')
    expect(MQ_NGANG).toBe('(min-width: 1024px), (orientation: landscape) and (min-width: 700px)')
    expect(css).toContain('@media' + MQ_NGANG.replace(/\s+/g, '') + '{')
    expect(css).toContain('.dao2.dao2-bd-trai,.dao2.dao2-bd-phai,.dao2.dao2-ai-trai,.dao2.dao2-ai-phai{display:contents}')
    const ngang = css.slice(css.indexOf('@media' + MQ_NGANG.replace(/\s+/g, '')))
    expect(ngang).toMatch(/\.dao2\.dao2-ai\{display:grid;grid-template-columns:minmax\(0,7fr\)minmax\(0,5fr\)/)
    expect(ngang).toContain('.dao2.dao2-chan,.dao2.dao2-chan[data-noi]{position:static;margin-top:0') // 28/09: nút chốt ngay dưới thẻ câu; câu ngắn không kéo giãn
    expect(ngang).toContain('.dao2.dao2-giay,.dao2.dao2-the-giai{flex:01auto;min-height:0;overflow:auto')
  })

  it('Trong ải (ngang): trái = thanh ải + cảnh trận + thẻ tiến độ có nhãn vai; phải = thẻ đề + nút chốt', () => {
    manHinh(true)
    const { container } = trongAi(null)
    const trai = container.querySelector('.dao2-ai-trai')!, phai = container.querySelector('.dao2-ai-phai')!
    expect(trai.querySelector('.dao2-canh .bl-arena canvas')).toBeTruthy()
    expect(trai.querySelector('.dao2-mau-thu')?.textContent).toContain('Lửa Nhỏ')
    expect(trai.querySelector('.dao2-ai-dau .dao2-ai-nhan')?.textContent).toMatch(/^ẢI 3\/6 · ÔN LẠI/)
    expect([...trai.querySelectorAll('.dao2-tien-do-nhan li')].map(li => li.textContent)).toEqual(['Mới', 'Mới', 'Ôn lại', 'Mới', 'Mới', 'Trùm'])
    expect(trai.querySelector('.dao2-tien-do')?.textContent).toContain('Đúng 1 ải · Chưa đúng 1 ải')
    expect(phai.querySelector('.dao2-giay')).toBeTruthy()
    expect(phai.querySelector('.dao2-chan button')?.textContent).toBe('CHỐT ĐÁP ÁN · TUNG CHIÊU')
    expect(trai.querySelector('.dao2-giay')).toBeNull()
  })

  it('Lời giải (ngang): cảnh trận VẪN ở cột trái cùng dải kết quả; cột phải = khối lời giải chuẩn + nút đi tiếp; không đồng hồ', () => {
    manHinh(true)
    const { container } = trongAi(phanHoi)
    const trai = container.querySelector('.dao2-ai-trai')!, phai = container.querySelector('.dao2-ai-phai')!
    expect(trai.querySelector('.dao2-canh')).toBeTruthy()
    expect(trai.querySelector('.dao2-ket-qua')?.textContent).toContain('Chưa đúng · quái phản đòn')
    expect(phai.querySelector('.dao2-the-giai .loi-giai')).toBeTruthy()
    expect(phai.querySelector('.dao2-chan button')?.textContent).toBe('ĐÃ ĐỌC LỜI GIẢI · SANG ẢI 4')
    expect(container.querySelector('[role="timer"]')).toBeNull()
  })

  it('Dọc giữ nguyên: lời giải không còn cảnh trận, không thẻ tiến độ; thanh ải ở đầu màn', () => {
    manHinh(false)
    const { container } = trongAi(phanHoi)
    expect(container.querySelector('.dao2-canh')).toBeNull()
    expect(container.querySelector('.dao2-tien-do')).toBeNull()
    expect(container.querySelector('.dao2-ai-dau .dao2-thanh')).toBeTruthy()
    cleanup(); const lam = trongAi(null)
    expect(lam.container.querySelector('.dao2-ai-dau .dao2-ai-nhan')).toBeNull()
    expect(lam.container.querySelector('.dao2-ai-trai > .dao2-ai-nhan')?.textContent).toMatch(/^ẢI 3\/6/)
  })

  it('Bản đồ: trái = khung đảo có thần thú của em · phải = số chiến dịch + tấm chuyến + LÊN ĐƯỜNG', () => {
    manHinh(true)
    const sanh = { ngay: '2026-09-30', chienDich: { id: 'cd', ten: 'Carbohydrate', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: null }, theLuc: { con: 24, tong: 40 }, huyetChien: false, dao: { con: 24 }, doan: { con: 0 }, khoaDao: false, loiKhoaDao: '', ruong: null, canChonThu: false }
    const { container } = render(<div className="dao dao2"><BanDo profile={hoSo} sanh={sanh as never} dangTai={false} cau={CAU} ketQua={[]} soChuyen={{ k: 1, n: 4 }} vung={[]} onLenDuong={() => {}} onThuLai={() => {}} onVe={() => {}} /></div>)
    expect(container.querySelector('.dao2-bd-trai .dao2-bd-khung .dao2-bd-thu')?.getAttribute('alt')).toBe('Thần thú của em: Lửa Nhỏ')
    const phai = container.querySelector('.dao2-bd-phai')!
    expect(phai.querySelector('.dao2-bd-so')?.textContent).toContain('67/120 ô')
    expect(phai.querySelector('.dao2-bd-tam h3')?.textContent).toBe('Chuyến thám hiểm 1/4')
    expect(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }).closest('.dao2-bd-phai')).toBe(phai)
  })

  it('Xong chuyến: ảnh thần thú EM ĐÃ CHỌN (đúng dạng theo cấp) đứng trong cảnh sương tan', () => {
    const { container } = render(<div className="dao dao2"><XongChuyen soChuyen={{ k: 1, n: 4 }} conCau={18} tongKet={{ dung: 5, tong: 6, exp: 20 }} enemy={0} oMoi={6} coXat={{ co: 73, tong: 120 }} aiSai={[]} ruong={null}
      anhThu="/than-thu-v2/nho/thu-2-1.webp" onVeBanDo={() => {}} /></div>)
    expect(container.querySelector('.dao2-xong-canh .dao2-xong-thu')?.getAttribute('src')).toBe('/than-thu-v2/nho/thu-2-1.webp')
  })
})
