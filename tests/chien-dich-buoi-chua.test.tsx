// GAME HÓA 2.0 · BUỔI CHỮA (bản vẽ GV-BuoiChua): bảng câu xếp sẵn, người lên bảng (giải mẫu + sửa), thời gian ước lượng,
// tổng ≤ 90 phút, mỗi em có mặt ≥ 1 lượt; "Chữa xong" HỎI LẠI nói rõ hậu quả rồi mới gọi `chua-xong`; "Mở tờ máy chiếu".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({ loadExamSources: async () => [] }))

import BuoiChua, { KHOA_CA_CHOT, oChieuTuDong } from '../src/components/chien-dich/BuoiChua'
import type { BuoiChuaMayChu, CauBuoiChua, EmTen } from '../src/components/chien-dich/api'
import { cauCaChot, chuNguoiSua, xepBuoiChua } from '../src/components/chien-dich/tinh'
import { useAppStore } from '../src/store/appStore'

const E = (s: string): EmTen => ({ sbd: s, ten: `Em ${s}` })
const cau = (stt: number, dang: string, chua: string[], dayLai: string[], giaiMau: string | null): CauBuoiChua => ({
  qid: `DE-A-I-${stt}`,
  stt,
  dang,
  phan: 'I',
  mucDo: 'VD',
  soChuaThanhThao: chua.length,
  soCanDayLai: dayLai.length,
  diemChua: chua.length + 2 * dayLai.length,
  giaiMau: giaiMau ? E(giaiMau) : null,
  emSua: [...dayLai, ...chua.filter((x) => !dayLai.includes(x))].map(E),
})
const LOP = ['01', '02', '03', '04', '05', '06'].map(E)
const DU: BuoiChuaMayChu = {
  chienDich: { id: 'cd-1', ten: 'Ester – Lipid', hanNop: '2026-10-04', lop: '12A1' },
  hetHan: true,
  soEm: 6,
  lop: { coXat: 0.96, thanhThao: 0.51 },
  cau: [
    cau(17, 'Thuỷ phân ester đơn chức', ['02', '03', '04'], ['02', '03'], '01'),
    cau(44, 'Chất béo – xà phòng hoá', ['03', '05'], ['05'], '01'),
    cau(23, 'Danh pháp ester', ['04'], [], '02'),
  ],
}

beforeEach(() => {
  goi.mockReset()
  sessionStorage.clear()
})
afterEach(cleanup)

describe('xếp buổi chữa (thuần)', () => {
  it('mỗi em có mặt ≥ 1 lượt; em chưa có lượt vào câu em ấy chưa thành thạo', () => {
    const kq = xepBuoiChua(DU.cau, LOP, () => 300)
    expect(kq.soEmCoMat).toBe(6)
    expect(kq.soEmCoLuot).toBe(6)
    const luot = new Set(kq.dong.flatMap((d) => [...(d.giaiMau ? [d.giaiMau.sbd] : []), ...d.sua.map((e) => e.sbd)]))
    for (const e of LOP) expect(luot.has(e.sbd)).toBe(true)
    // em 06 thành thạo hết ⇒ vẫn có lượt (vào câu ít người nhất)
    expect(kq.dong.some((d) => d.sua.some((e) => e.sbd === '06'))).toBe(true)
    // em cần dạy lại câu 17 được xếp sửa câu 17 trước
    expect(kq.dong[0]!.sua.map((e) => e.sbd).slice(0, 2)).toEqual(['02', '03'])
    // giờ = ước lượng câu + 60 giây mỗi em sửa
    expect(kq.dong[0]!.giay).toBe(300 + 60 * kq.dong[0]!.sua.length)
  })

  it('tổng > 90 phút ⇒ bỏ câu điểm chữa thấp nhất, còn ít nhất một câu, vẫn đủ lượt cho mọi em', () => {
    const kq = xepBuoiChua(DU.cau, LOP, () => 40 * 60)
    expect(kq.tongGiay).toBeLessThanOrEqual(90 * 60)
    expect(kq.dong.map((d) => d.cau.stt)).toEqual([17, 44])
    expect(kq.boCau.map((c) => c.stt)).toEqual([23])
    expect(kq.soEmCoLuot).toBe(6)
    const mot = xepBuoiChua(DU.cau, LOP, () => 200 * 60)
    expect(mot.dong).toHaveLength(1)
    expect(mot.vuotNganSach).toBe(true)
  })

  it('(thầy 06/10) LỚP ĐÔNG 111 em: giữ ĐỦ các câu (không chỉ còn 1 câu / 115 phút), chỉ xếp lượt cho số em vừa giờ; tờ chiếu có đủ đợt', async () => {
    const dsEm = Array.from({ length: 111 }, (_, i) => E(String(i + 1).padStart(3, '0')))
    const cauDong = Array.from({ length: 6 }, (_, i) => cau(i + 1, `Dạng ${i + 1}`, dsEm.slice(i * 10, i * 10 + 30).map((e) => e.sbd), dsEm.slice(i * 10, i * 10 + 2).map((e) => e.sbd), i % 2 ? '001' : null))
    const kq = xepBuoiChua(cauDong, dsEm, () => 180)
    expect(kq.dong).toHaveLength(6)
    expect(kq.boCau).toHaveLength(0)
    expect(kq.tongGiay).toBeLessThanOrEqual(90 * 60)
    expect(kq.vuotNganSach).toBe(true)
    expect(kq.tongGiayDayDu).toBeGreaterThan(90 * 60)
    expect(kq.soEmCoLuot).toBeGreaterThan(0)
    expect(kq.soEmCoLuot).toBeLessThan(111)
    // em cần dạy lại luôn có lượt ở câu của mình
    expect(kq.dong[0]!.sua.slice(0, 2).map((e) => e.sbd)).toEqual(['001', '002'])
    // Mở tờ máy chiếu: mỗi câu một đợt, đủ 6 đợt
    const { dungToChieu } = await import('../src/components/chien-dich/to-chieu')
    const { html } = await dungToChieu(oChieuTuDong(kq.dong), 'Buổi chữa', new Map(), 'PHIEN-DONG')
    expect((html.match(/data-dot="\d+"/g) ?? []).length).toBe(6)
  })

  it('(thầy 06/10) lớp nhỏ không đổi: một câu vẫn bị bỏ khi bỏ câu cứu được giờ; bảng chữa đo theo khung chứa, ô xếp dọc ở cột phải khi hẹp', async () => {
    const kq = xepBuoiChua(DU.cau, LOP, () => 40 * 60)
    expect(kq.dong).toHaveLength(2)
    expect(kq.vuotNganSach).toBe(false)
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/components/chien-dich/chien-dich.css', 'utf8')
    expect(css).toContain('@container bang-chua (min-width: 880px)')
    expect(css).toMatch(/\.cd-hang-chua > :not\(\.cd-hang-so\) \{\s*grid-column: 2;/)
    expect(css).not.toMatch(/@media \(min-width: 1000px\) \{\s*\.cd-hang-chua/)
  })

  it('chữ người sửa gọn: quá 3 em ⇒ "+N em"; ca chốt không trùng, tối đa 25', () => {
    expect(chuNguoiSua(['1', '2', '3'].map(E))).toBe('Sửa: Em 1, Em 2, Em 3')
    expect(chuNguoiSua(['1', '2', '3', '4', '5'].map(E))).toBe('Sửa: Em 1, Em 2 +3 em')
    expect(cauCaChot([{ qid: 'a' }, { qid: 'b' }], [{ qid: 'b' }, { qid: 'c' }])).toEqual(['a', 'b', 'c'])
    expect(cauCaChot(Array.from({ length: 30 }, (_, i) => ({ qid: String(i) })), [])).toHaveLength(25)
  })
})

describe('màn Buổi chữa', () => {
  const ve = (them: Partial<Parameters<typeof BuoiChua>[0]> = {}) => {
    const p = {
      du: DU,
      dsEm: LOP,
      coMat: LOP.map((e) => e.sbd),
      canDayLai: [{ qid: 'DE-A-I-9', stt: 9, dang: 'Xà phòng', soEm: 1 }],
      homNay: '2026-10-05',
      tra: new Map(),
      dangChieu: false,
      onChieu: vi.fn(async () => true),
      onDoiCoMat: vi.fn(),
      onDaChua: vi.fn(),
      ...them,
    }
    return { ...render(<BuoiChua {...p} />), p }
  }

  it('bảng câu xếp sẵn đủ cột: #, câu · dạng · mức độ, vì sao chữa, điểm chữa, người lên bảng, thời gian, kết quả; 5 thẻ số đúng (bản vẽ 28/09)', () => {
    const { container } = ve()
    expect(screen.getByRole('heading', { name: 'Buổi chữa · Ester – Lipid · 12A1' })).toBeTruthy()
    expect(container.textContent).toContain('Chữa trên lớp › Buổi chữa')
    expect(container.textContent).toContain('hết hạn nộp lúc 23:59 Chủ Nhật 04/10')
    expect(container.textContent).toContain('đã điểm danh 6/6 em')
    const hang = [...container.querySelectorAll('[data-hang-chua]')].map((x) => x.getAttribute('data-hang-chua'))
    expect(hang).toEqual(['DE-A-I-17', 'DE-A-I-44', 'DE-A-I-23'])
    const dau = container.querySelector('[data-hang-chua="DE-A-I-17"]') as HTMLElement
    expect(dau.textContent).toContain('Câu 17 · Thuỷ phân ester đơn chức')
    expect(dau.textContent).toContain('3 em chưa thành thạo · 2 cần dạy lại')
    expect(dau.textContent).toContain('Giải mẫu: Em 01')
    expect(dau.textContent).toContain('Sửa: Em 02, Em 03')
    expect(dau.textContent).toMatch(/\d+ phút/)
    expect(container.querySelector('[data-so="co-luot"]')?.textContent).toBe('6/6 em có lượt lên bảng')
    expect(container.querySelector('[data-so="buoi-chua"]')?.textContent).toBe('3câu')
    expect(container.querySelector('[data-so="thoi-gian"]')?.textContent).toMatch(/^\d+\/ 90 phút$/)
    expect(container.querySelector('[data-so="tien-do"]')?.textContent).toBe('0/ 3 câu')
    expect([...container.querySelectorAll('[data-ket-qua-cau]')].map((x) => x.textContent)).toEqual(['Chưa chữa', 'Chưa chữa', 'Chưa chữa'])
    expect(container.textContent).not.toMatch(/Cọ xát/)
    expect(container.textContent).toContain('điểm chữa = số em chưa thành thạo + 2 × số em cần thầy dạy lại')
    expect(screen.getByRole('button', { name: 'Mở ca chốt · 4 câu' })).toBeTruthy()
  })

  it('"Chữa xong" hỏi lại nói rõ hậu quả; Huỷ ⇒ không gọi; xác nhận ⇒ `chua-xong` đúng các câu đã chữa', async () => {
    goi.mockResolvedValue({ ok: true, du: { ok: true, soLuot: 3, ngayOnLai: '2026-10-06' } })
    const { p } = ve()
    fireEvent.click(screen.getByRole('button', { name: 'Chữa xong' }))
    let hop = screen.getByRole('alertdialog')
    expect(within(hop).getByRole('heading', { name: 'Chữa xong buổi này?' })).toBeTruthy()
    expect(hop.textContent).toContain('3 lượt em')
    expect(hop.textContent).toContain('quay lại Đoàn Hộ Tống của các em từ Thứ Ba 06/10/2026')
    expect(hop.textContent).toContain('không hoàn tác')
    fireEvent.click(within(hop).getByRole('button', { name: 'Huỷ' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(goi).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Chữa xong' }))
    hop = screen.getByRole('alertdialog')
    fireEvent.click(within(hop).getByRole('button', { name: 'Chữa xong' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/chien-dich', { action: 'chua-xong', id: 'cd-1', qids: ['DE-A-I-17', 'DE-A-I-44', 'DE-A-I-23'], coMat: ['01', '02', '03', '04', '05', '06'] }))
    expect(await screen.findByRole('button', { name: 'Đã chữa xong' })).toBeTruthy()
    expect(screen.getByText(/Đã chữa xong: 3 lượt em được mở khoá/)).toBeTruthy()
    expect(p.onDaChua).toHaveBeenCalled()
  })

  it('"Mở tờ máy chiếu" (nút chính) chiếu đúng thứ tự câu với em giải mẫu', async () => {
    const { p } = ve()
    fireEvent.click(screen.getByRole('button', { name: 'Mở tờ máy chiếu' }))
    await waitFor(() => expect(p.onChieu).toHaveBeenCalled())
    const [ds] = (p.onChieu as ReturnType<typeof vi.fn>).mock.calls[0] as [{ qid: string; sbd: string }[]]
    expect(ds.map((o) => [o.qid, o.sbd])).toEqual([
      ['DE-A-I-17', '01'],
      ['DE-A-I-44', '01'],
      ['DE-A-I-23', '02'],
    ])
    const thay = oChieuTuDong(xepBuoiChua([cau(1, 'X', ['03'], [], null)], LOP, () => 60).dong)[0]!
    expect(thay.sbd).toBe('')
    expect(thay.ten).toBe('Thầy chữa')
  })

  it('"Đổi em có mặt" xếp lại cho em có mặt; "Mở ca chốt" ghi sẵn câu rồi mở màn Mở ca', () => {
    const { p } = ve()
    fireEvent.click(screen.getByRole('button', { name: 'Đổi điểm danh' }))
    const hop = screen.getByRole('dialog')
    fireEvent.click(within(hop).getByRole('checkbox', { name: 'Em 06' }))
    fireEvent.click(within(hop).getByRole('button', { name: 'Xếp lại cho 5 em' }))
    expect(p.onDoiCoMat).toHaveBeenCalledWith(['01', '02', '03', '04', '05'])

    fireEvent.click(screen.getByRole('button', { name: 'Mở ca chốt · 4 câu' }))
    expect(JSON.parse(sessionStorage.getItem(KHOA_CA_CHOT) ?? '{}').qids).toEqual(['DE-A-I-17', 'DE-A-I-44', 'DE-A-I-23', 'DE-A-I-9'])
    expect(useAppStore.getState().screen).toBe('examsetup')
  })
})
