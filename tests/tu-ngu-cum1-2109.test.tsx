// CHUẨN HOÁ TỪ NGỮ · CỤM 1 "Máu + thần thú" (Boss duyệt bảng docs/ra-soat-tu-ngu-2109-code2.md 21/09; thầy: "Mập Địch 100 là gì").
// Luật 1: con số nào cũng có nhãn + đơn vị. Luật 2: tên riêng (biệt danh thần thú) đi SAU danh từ chung. Sửa chữ CÓ CHỦ Ý — aria-label cũ GIỮ nguyên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import ThamHiem, { SanDau, TEN_QUAI } from '../src/game/than-thu-v2/dao/ThamHiem'
import type { ThamHiemProps } from '../src/game/than-thu-v2/dao/ThamHiem'
import type { CauDao, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import { tuKeHoachNgay, type DuLieuBangNhiemVu, type KeHoachNgayMayChu, type TrangThaiThanThu } from '../src/lib/nhiem-vu-adapter'

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => <div role="img" aria-label="Thần thú" /> }))
const doc = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
/** Bỏ chú thích `//` và `/* *​/` để chỉ soi chữ thật. */
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const NOW = new Date(2026, 8, 21, 10, 0).getTime()
const THU: TrangThaiThanThu = { kieu: 'co', pet: 'lua_phuong', cap: 37, ten: 'Mập Địch' }
const keHoach = (): KeHoachNgayMayChu => ({
  ok: true, ngay: '2026-09-21', nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 80, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [] as never, canhBao: [], quaHan: [], tienBo: { daLamCau: 3, lenBac: 0, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 3 }, chuoiDat: 0, lanNghi: false, capNhatLuc: new Date(NOW).toISOString(),
})
const bang = (vaiTro: 'hocsinh' | 'phuhuynh', thanThu: TrangThaiThanThu) => render(<BangNhiemVu vaiTro={vaiTro} hoTen="Minh" now={NOW} onMoThanThu={() => {}} duLieu={{ ...(tuKeHoachNgay(keHoach(), NOW) as DuLieuBangNhiemVu), thanThu }} />)

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

describe('Đầu Bảng nhiệm vụ: biệt danh đi sau "Thần thú của em/con"', () => {
  it('học sinh: "Thần thú của em" rồi "Mập Địch · Cấp 37"; nút vẫn tên cũ (aria)', () => {
    const { container } = bang('hocsinh', THU)
    const ten = container.querySelector('.bnv-thu-ten')!
    expect(ten.querySelector('.bnv-thu-danh')!.textContent).toBe('Thần thú của em')
    expect(ten.querySelector('.bnv-thu-goi')!.textContent).toBe('Mập Địch · Cấp 37')
    expect(container.querySelector('button[aria-label="Mở thần thú Mập Địch · Cấp 37"]')).not.toBeNull()
  })
  it('phụ huynh: "Thần thú của con"', () => {
    const { container } = bang('phuhuynh', THU)
    expect(container.querySelector('.bnv-thu-danh')!.textContent).toBe('Thần thú của con')
    expect(container.querySelector('[role="group"][aria-label="Thần thú của con: Mập Địch · Cấp 37"]')).not.toBeNull()
  })
  it('chưa chọn thú: KHÔNG có nhãn "Thần thú của em" đứng một mình', () => {
    const { container } = bang('hocsinh', { kieu: 'chua_chon' })
    expect(container.querySelector('.bnv-thu-danh')).toBeNull()
    expect(container.querySelector('.bnv-thu-ten')!.textContent).toBe('Chưa chọn thần thú')
  })
})

describe('Đảo · thám hiểm · sân đấu', () => {
  const hoSo: DaoProfile = { nickname: 'Mập Địch', pet: 'lua_phuong', choice: false, cap: 34, exp: 0, wallet: 0, mastery: [] }
  it('thanh máu thú: "Thần thú của em: Mập Địch" + "Máu 100/100" — không còn "Mập Địch 100" trơn; aria giữ', () => {
    const { container } = render(<div className="dao"><SanDau profile={hoSo} ketQua={[]} tong={6} suKien={0} xong={false} /></div>)
    const ta = container.querySelector('.dao-san-ta')!
    expect(ta.textContent).toBe('Thần thú của em: Mập ĐịchMáu 100/100')
    expect(ta.textContent).not.toMatch(/Mập Địch 100/)
    expect(container.querySelector('[role="progressbar"][aria-label="Máu của Mập Địch"]')).not.toBeNull()
  })
  it('thanh máu quái: "Quái Sương Mù · Máu 100/100"; sau khi đúng thì máu quái và máu thú đổi theo, vẫn có nhãn', () => {
    const { container, rerender } = render(<div className="dao"><SanDau profile={hoSo} ketQua={[]} tong={6} suKien={0} xong={false} /></div>)
    expect(container.querySelector('.dao-san-quai p')!.textContent).toBe(`${TEN_QUAI} · Máu 100/100`)
    rerender(<div className="dao"><SanDau profile={hoSo} ketQua={[{ qid: 'a', correct: true }, { qid: 'b', correct: false }]} tong={6} suKien={2} xong={false} /></div>)
    expect(container.querySelector('.dao-san-quai p')!.textContent).toMatch(/^Quái Sương Mù · Máu \d+\/100$/)
    expect(container.querySelector('.dao-san-ta')!.textContent).toMatch(/^Thần thú của em: Mập ĐịchMáu \d+\/100$/)
    expect(container.querySelector('.dao-san-so')!.textContent).toMatch(/^−\d+$/) // số nổi giữ nguyên phần tử (test cũ khoá); chữ "máu" đi bằng CSS
  })
  it('tên thần thú dài 30 ký tự vẫn gói trong khung (không tràn ngang): có overflow-wrap + max-width + cắt 2 dòng', () => {
    const css = doc('src/game/than-thu-v2/dao/dao.css')
    expect(css).toMatch(/\.dao \.dao-san-ten\{[^}]*max-width:104px[^}]*overflow-wrap:anywhere/)
    expect(css).toMatch(/\.dao-san-ten small\{[^}]*-webkit-line-clamp:2/) // tên dài: tối đa 2 dòng, tên đầy đủ nằm ở aria của thanh máu
  })
  it('đơn vị của số nổi và của thưởng nằm ở CSS: "−N máu", "+N máu", "+N EXP"', () => {
    const css = doc('src/game/than-thu-v2/dao/dao.css')
    expect(css).toContain(".dao .dao-san-so::after,.dao .dao-san-hoi::after{content:' máu'")
    expect(css).toContain(".dao .dao-thuong b[data-don-vi]::after{content:' ' attr(data-don-vi)")
  })
  it('thưởng có EXP ⇒ b mang data-don-vi="EXP" (số vẫn là "+40"); chỉ "Đúng"/"Ôn lại" ⇒ không có đơn vị', () => {
    const cau: CauDao[] = [{ qid: 'q0', maDe: 'DE', version: '1', group: 'g', phan: 'I', text: 'Câu 1', choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Ester', mucDo: null, sao: null, kienThuc: [], role: 'lap' } as CauDao]
    const p = (moc: number, exp: number): ThamHiemProps => ({ profile: hoSo, cau, viTri: 0, ketQua: [], traLoi: 'A', assisted: false, phanHoi: { correct: true, answer: 'A', solution: null, solutionImages: [], lyDo: { moc, exp, chu: `+${exp} · đúng lại câu ester` } as never }, xong: false, onTraLoi: () => {}, onAssisted: () => {}, onNop: () => {}, onTiep: () => {}, onVeDao: () => {} })
    const a = render(<ThamHiem {...p(2, 40)} />)
    const b = a.container.querySelector('.dao-thuong b')!
    expect(b.textContent).toBe('+40')
    expect(b.getAttribute('data-don-vi')).toBe('EXP')
    a.unmount()
    const c = render(<ThamHiem {...p(0, 0)} />)
    const b2 = c.container.querySelector('.dao-thuong b')!
    expect(b2.textContent).toBe('Đúng')
    expect(b2.hasAttribute('data-don-vi')).toBe(false)
  })
})

describe('Không còn "HP" trơn trên màn học sinh (game)', () => {
  it.each(['src/game/than-thu-v2/dao/ThamHiem.tsx', 'src/game/than-thu-v2/DoanTran.tsx', 'src/game/than-thu-v2/EscortRoom.tsx', 'src/game/than-thu-v2/EscortGuide.tsx', 'src/game/than-thu-v2/LearningBattle.tsx', 'src/game/than-thu-v2/DoanTungChuong.tsx'])('%s', (t) => {
    const chu = boChuThich(doc(t)).replace(/[`'"]hp[`'"]/gi, '')
    expect(chu).not.toMatch(/\bHP\b/)
  })
  it('Đoàn: "Máu Linh Tâm 80/100" (dùng toiDa của máy chủ, không cứng 100)', () => {
    const nguon = doc('src/game/than-thu-v2/DoanTran.tsx')
    expect(nguon.match(/Máu Linh Tâm \{tran\.linhTam\.hp\}\/\{tran\.linhTam\.toiDa\}/g)).toHaveLength(2)
    expect(nguon).not.toMatch(/>Linh Tâm \{tran\.linhTam\.hp\}</)
  })
  it('Võ đài: "Máu 100 · Giáp 20" và "còn 45 giây"; Chuỗi ngày ở chip Đảo', () => {
    const vd = doc('src/game/than-thu-v2/EscortRoom.tsx')
    expect(vd).toContain('`Máu ${p.hp} · Giáp ${p.shield}')
    expect(vd).toContain('`còn ${remaining} giây · ')
    expect(doc('src/game/than-thu-v2/dao/DaoCuaEm.tsx')).toContain('Chuỗi {chuoiNgay} ngày</span>')
  })
  it('màn trận cũ (LearningBattle): "Thần thú của em: …", "Máu 100/100", không emoji', () => {
    const nguon = doc('src/game/than-thu-v2/LearningBattle.tsx')
    expect(nguon).toContain('Thần thú của em: {nickname||skin.name} · Cấp {level}')
    expect(nguon).toContain('Máu {battle.hp}/100')
    expect(nguon).not.toMatch(/[🔇🔊✦]/u)
  })
})

describe('Vinh danh: biệt danh đứng sau "Thần thú"; phiếu không có "nắm chắc"', () => {
  it('TheVinhDanh có nhãn "Thần thú" trước biệt danh', () => {
    expect(doc('src/components/bang-nhiem-vu/TheVinhDanh.tsx')).toMatch(/<span className="bnv-chu-phu">Thần thú<\/span> \{ten\}/)
  })
  it('html-phieu.ts không còn chữ "nắm chắc" (nộp ≠ nắm; bộ soi giao diện báo LỖI ở dòng 1566)', () => {
    expect(doc('src/lib/html-phieu.ts')).not.toMatch(/nắm chắc/i)
    expect(doc('src/lib/html-phieu.ts')).toContain('Kiến thức cốt lõi. Bắt buộc, em làm trước.')
  })
})
