// Việc C · nhóm C (Code 4): báo cáo ca thi + tiến bộ — BaoCaoCaThiPhuHuynhModal (chỉ phụ huynh), BieuDoTienBoGoogle (biểu đồ, còn app giáo viên dùng), TheTienBo.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
// @ts-expect-error — tệp .mjs của scripts/, không có khai báo kiểu
import { TEP } from '../scripts/sinh-m3-tuong-thich.mjs'
import BaoCaoCaThiPhuHuynhModal from '../src/components/BaoCaoCaThiPhuHuynhModal'
import TheTienBo from '../src/components/TheTienBo'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const goc = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  datDuong('/')
})

const CAU_SAI = [
  { qid: 'q1', soCau: 7, phan: 'I', chuyenDe: 'Ancol', mucDo: 'Nhận biết', dapAnChon: 'A', dapAnDung: 'B', text: 'Ancol nào là ancol bậc II?', choices: ['a', 'b', 'c', 'd'], maCa: 'CA-ANCOL' },
  { qid: 'q3', soCau: 9, phan: 'III', chuyenDe: 'Este', mucDo: 'Vận dụng', dapAnChon: '4,48', dapAnDung: '4,96', text: 'Tính V.', maCa: 'CA-ANCOL' },
]
const LICH_SU = [
  { maCa: 'CA-HALO', tenCa: 'Ca Halogen', tong: 6.5, tongCau: 28, soCauDung: 17, soCauSai: 11, nopLuc: '2026-09-08T10:00:00Z' },
  { maCa: 'CA-ESTE', tenCa: 'Ca Este', tong: 8.25, tongCau: 28, soCauDung: 23, soCauSai: 5, nopLuc: '2026-09-12T10:00:00Z' },
]
const BAI = { maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', ngayThi: '15/09/2026', ngayNop: '2026-09-15T10:00:00Z', diem: 9.5, diemI: 4.5, diemII: 3.5, diemIII: 1.5, thoiGianPhut: 41, soCauDung: 26, soCauSai: 2, tongCau: 28, tongSoCau: 28, soCauDungMotPhan: 0, soCauBoTrong: 0, soYDungII: 14, soYTongII: 16, lanThu: 1 }
function giaLapMayChu() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = new URL(String(url)).pathname
      const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) })
      if (u.endsWith('/hs/lich-su')) return ok({ ok: true, items: LICH_SU })
      if (u.endsWith('/hs/cau-sai')) return ok({ ok: true, items: CAU_SAI })
      return ok({ ok: true, items: [] })
    }),
  )
}
const dungPH = (onClose = vi.fn()) =>
  render(<BaoCaoCaThiPhuHuynhModal baiThi={BAI as any} hoTenCon="Minh" sbd="12001" lop="12A1" scriptUrl="https://may.test" onClose={onClose} onGiaoBaiChoCon={() => {}} onNhanTinChoThay={() => {}} />)

describe('phạm vi bộ sinh lớp tương thích (nhóm B + C + A2)', () => {
  it('đúng 12 tệp: 4 nhóm B + 2 modal báo cáo + 3 khối con nằm trong modal + PhongChoGame (vào thi) + BangTinPhuHuynh (C8) + ParentPortalScreen (C9)', () => {
    expect(TEP.map((t: string) => path.basename(t)).sort()).toEqual(
      ['BangTinPhuHuynh.tsx', 'BaoCaoCaThiHocSinhModal.tsx', 'BaoCaoCaThiPhuHuynhModal.tsx', 'BieuDoTienBoGoogle.tsx', 'DongDemCau.tsx', 'KhoiBaPhan.tsx', 'KhoiCauSai.tsx', 'KhoiKhacPhuc3CheDo.tsx', 'LuyenDeChuan.tsx', 'ModalKhacPhucCauSai.tsx', 'ParentPortalScreen.tsx', 'PhongChoGame.tsx'].sort(),
    )
  })
  it('ánh xạ cả màu gradient (from-/via-/to-) → biến điểm dừng --tw-gradient-*, mọi luật vẫn có tiền tố `.m3 `', () => {
    const css = doc('src/components/m3/m3-tuong-thich.css')
    expect(css).toMatch(/\.m3 \.from-slate-50 \{ --tw-gradient-from: var\(--m3-surface-container-low\); \}/)
    expect(css).toMatch(/\.m3 \.to-blue-50\\\/40 \{ --tw-gradient-to: var\(--m3-primary-container\); \}/)
    expect(css).toMatch(/\.m3 \.via-white \{ --tw-gradient-via: var\(--m3-surface-container-lowest\); \}/)
  })
})

describe('BaoCaoCaThiPhuHuynhModal (chỉ phụ huynh)', () => {
  it('gốc `m3` ở mọi đường; chip nhãn là m3-chip (không style nội tuyến rgba); nút Tạo bài luyện là nút chính; thanh tab không bị ép co', async () => {
    datDuong('/?vai=phuhuynh')
    giaLapMayChu()
    dungPH()
    expect((document.querySelector('.fixed.inset-0') as HTMLElement).classList.contains('m3')).toBe(true)
    const chip = screen.getByText('Kết quả bài thi của con').closest('div') as HTMLElement
    expect(chip.className).toContain('m3-chip')
    expect(chip.getAttribute('style') || '').not.toMatch(/rgba?\(/)
    expect(chip.getAttribute('data-vai-tro')).toBe('primary')
    const tab = screen.getByRole('button', { name: 'Tổng quan 3 phần' })
    expect(tab.parentElement!.className).toContain('shrink-0')
    const tao = await screen.findByRole('button', { name: /Tạo bài luyện khắc phục cho con/ })
    expect(tao.className).toContain('m3-nut-chinh')
    expect(document.body.textContent).not.toMatch(/Vòng [123]|Lõi Căn Bản|Thử Thách Bứt Phá/)
  })

  it('tab Mức độ nhận thức nói đúng mô tả mới; tab Câu sai liệt kê 2 câu', async () => {
    datDuong('/?vai=phuhuynh')
    giaLapMayChu()
    dungPH()
    fireEvent.click(screen.getByRole('button', { name: 'Mức độ nhận thức' }))
    expect(screen.getByText('Bản chất hoá học, giải thích hiện tượng, phản ứng')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Câu sai cần chữa \(2\)/ }))
    expect(await screen.findByText(/Tổng số/)).toBeTruthy()
  })
})

describe('TheTienBo → BieuDoTienBoGoogle (biểu đồ dùng chung, GV có dùng)', () => {
  const ca = { maCa: 'CA-ANCOL', tenCa: 'Ca Ancol', diem: 9.5, tongCau: 28, soCauDung: 26, soCauSai: 2 }
  it('dưới cổng học sinh: dải 4 màu Google ẩn (m3-an); màu SVG là biến --m3-* kèm màu cũ làm dự phòng', () => {
    datDuong('/?vai=hocsinh')
    const { container } = render(<TheTienBo lichSu={LICH_SU} dangMo={ca} />)
    expect(container.querySelector('.m3-an')).toBeTruthy()
    const svg = container.querySelector('svg[role="img"]')!.outerHTML
    expect(svg).toContain('var(--m3-primary, rgb(26, 115, 232))')
    expect(svg).toContain('var(--m3-on-surface-variant, rgb(148, 163, 184))')
    expect(svg).not.toMatch(/(?:stroke|fill|stop-color)="rgb\(/) // không còn màu trần: mọi màu đều qua var(--m3-*, dự phòng)
  })
  it('đường giáo viên (/): không lớp m3; SVG vẫn có đúng màu cũ làm dự phòng', () => {
    datDuong('/')
    const { container } = render(<TheTienBo lichSu={LICH_SU} dangMo={ca} />)
    expect(container.querySelector('[class*="m3-"]')).toBeNull()
    expect(container.querySelector('svg[role="img"]')!.outerHTML).toContain('rgb(26, 115, 232)')
  })
})

describe('câu chữ và luật đã khoá ở nơi khác vẫn nguyên (modal phụ huynh)', () => {
  it('không còn mô tả 3 vòng; logic/nhãn test khoá còn đủ', () => {
    const nd = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')
    expect(nd).not.toMatch(/Vòng [123]:|Lõi Căn Bản|Trọng Tâm Cá Nhân|Thử Thách Bứt Phá/)
    expect(nd).toContain('Câu sai cần chữa ({soKhacPhuc})')
    expect(nd).toContain('<DongCauSai key={c.qid')
    expect(nd).toContain('Khắc phục {soKhacPhuc} câu sai này')
  })
})
