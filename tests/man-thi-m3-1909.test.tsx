// VIỆC C · C10 bước 1 — vỏ màn THI THẬT (ExamTakeScreen) mặc Material 3 chỉ ở đường HỌC SINH/PHỤ HUYNH.
// `Trang` (khung chung của mọi trạng thái màn này) mang thêm lớp `m3` khi `dungM3()`; m3.css ánh xạ token cũ → vai trò M3 dưới `.m3`.
// Chỉ đổi phần nhìn: không dòng logic nào. Đường `/` (app giáo viên) và vitest mặc định: y hệt trước.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ExamTakeScreen from '../src/screens/ExamTakeScreen'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/components/LogoHocSinh', () => ({ default: () => null }))
vi.mock('../src/components/LogoVai', () => ({ LogoDoc: () => null }))

const nguon = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [] }) })))
})
afterEach(async () => {
  cleanup()
  await new Promise((r) => setTimeout(r, 60))
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  datDuong('/')
})

describe('C10 · khung `Trang` của màn thi', () => {
  it('đường màn thi của em (?examCode=): khung gốc mang `m3`; nền/chữ đọc token (sẽ thành vai trò M3), không đổi cấu trúc', async () => {
    datDuong('/?examCode=123456')
    const { container } = render(<ExamTakeScreen />)
    await waitFor(() => expect(container.querySelector('.min-h-screen')).toBeTruthy())
    const trang = container.querySelector('.min-h-screen') as HTMLElement
    expect(trang.classList.contains('m3')).toBe(true)
    expect(trang.getAttribute('style')).toContain('var(--nen)')
    expect(trang.getAttribute('style')).toContain('var(--muc)')
  })

  it('đường cổng học sinh (/hs) cũng mang `m3`; đường giáo viên (`/`) và vitest mặc định KHÔNG (DOM y hệt cũ)', async () => {
    datDuong('/hs')
    const a = render(<ExamTakeScreen />)
    await waitFor(() => expect(a.container.querySelector('.min-h-screen')).toBeTruthy())
    expect((a.container.querySelector('.min-h-screen') as HTMLElement).classList.contains('m3')).toBe(true)
    a.unmount()
    datDuong('/')
    const b = render(<ExamTakeScreen />)
    await waitFor(() => expect(b.container.querySelector('.min-h-screen')).toBeTruthy())
    expect((b.container.querySelector('.min-h-screen') as HTMLElement).classList.contains('m3')).toBe(false)
  })
})

describe('C10 · phạm vi thay đổi trong mã (khoá bằng nguồn)', () => {
  it('`Trang` chỉ thêm lớp theo dungM3(); nền/chữ/phông vẫn là token như cũ; không hex/rgb mới trong tệp', () => {
    expect(nguon).toMatch(/import \{ dungM3 \} from '\.\.\/components\/m3'/)
    expect(nguon).toMatch(/className=\{`min-h-screen \$\{dungM3\(\) \? 'm3 ' : ''\}\$\{className\}`\}/)
    expect(nguon).toMatch(/style=\{\{ background: 'var\(--nen\)', color: 'var\(--muc\)', fontFamily: 'var\(--serif\)' \}\}/)
    expect(nguon).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/)
  })

  it('"Đề của em kèm lời giải" mở phiếu M3 chỉ ở đường học sinh (giaoDienHocSinh: dungM3()), nhãn bìa giữ nguyên', () => {
    expect(nguon).toMatch(/hienDapAn: true,\s*giaoDienHocSinh: dungM3\(\),\s*nhanBia: 'Đề của em kèm lời giải',/)
  })

  it('các chốt an toàn của màn thi còn nguyên trong nguồn: VanTay, ManGiuDeDoc, ManChan, z-index, đếm rời màn', () => {
    for (const s of ['<VanTay sbd={attempt.sbd}', '<ManGiuDeDoc />', '<ManChan lyDo={lyDoChe}', 'className="fixed inset-0 z-40 flex items-end"', 'className="sticky top-0 z-30"']) expect(nguon, s).toContain(s)
  })
})
