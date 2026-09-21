// KHẮC PHỤC · KHỐI CỦA EM — P0 thầy báo 20:28 ngày 21/09: "học sinh lớp 11 nhưng nhận câu của lớp 12". Luật Boss: kênh rút TỰ ĐỘNG chỉ đưa câu KHỐI EM HOẶC THẤP hơn.
// Nguyên nhân gốc (đọc mã): "Luyện dạng bài" MẶC ĐỊNH lớp 12 cho mọi em (KhoiKhacPhuc3CheDo: `useState('12')` + `find(lop === '12')`; ModalKhacPhucCauSai: `find(lop === '12')`),
// em tự đổi sang lớp cao hơn được, component không nhận lớp của em, kho đề rút câu (chế độ 2/3/4) không lọc khối.
// Khoá: (1) bộ lọc thuần `khac-phuc-khoi.ts`; (2) KHOẢNH KHẮC THẬT: render hai component với danh mục giả 10/11/12 ⇒ em khối 11 KHÔNG thấy nút Lớp 12 và không có bài lớp 12; mặc định = khối em;
// (3) nguồn đề khối cao bị bỏ; (4) khối em không rõ ⇒ như cũ (không chặn); (5) các nơi gọi có truyền lớp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DANH_MUC = {
  lops: [
    { lop: '10', bais: [{ tenBai: 'BAI-MUOI-A', dangs: [{ ma: 'DB-10-A-D1', ten: 'Dạng mười', soCau: 5 }] }] },
    { lop: '11', bais: [{ tenBai: 'BAI-MUOI-MOT-A', dangs: [{ ma: 'DB-11-A-D1', ten: 'Dạng mười một', soCau: 5 }] }] },
    { lop: '12', bais: [{ tenBai: 'BAI-MUOI-HAI-A', dangs: [{ ma: 'DB-12-A-D1', ten: 'Dạng mười hai', soCau: 5 }] }] },
  ],
  tongDang: 3,
  loi: '',
}
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-api')>()),
  danhMucDangBai: vi.fn(async () => DANH_MUC),
  deTheoDangBai: vi.fn(async () => ({ de: null, loi: 'thử' })),
  hsCauSaiApi: vi.fn(async () => ({ ok: true, items: [] })),
}))
vi.mock('../src/lib/kho-cho-may-em', () => ({ napKhoChoMayEm: vi.fn(async () => ({ nguon: [], loi: '' })) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadScriptUrl: vi.fn(async () => 'http://may-chu-gia'),
  loadScriptUrlHoacMacDinh: vi.fn(async () => 'http://may-chu-gia'),
  loadExamSources: vi.fn(async () => []),
}))

import KhoiKhacPhuc3CheDo from '../src/components/KhoiKhacPhuc3CheDo'
import ModalKhacPhucCauSai from '../src/components/ModalKhacPhucCauSai'
import { cacLopHienThi, duocChonLop, khoiEmTuLop, lopEmDuocChon, lopMacDinhCuaEm, nguonHopKhoi } from '../src/lib/khac-phuc-khoi'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
const boChuThich = (m: string) => m.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

describe('bộ lọc thuần khac-phuc-khoi.ts', () => {
  it('khối em từ chuỗi lớp: "11", "12 - Tinh Hoa", "Lớp 10" đọc được; rỗng / lạ ⇒ null', () => {
    expect(khoiEmTuLop('11')).toBe(11)
    expect(khoiEmTuLop('12 - Tinh Hoa')).toBe(12)
    expect(khoiEmTuLop('Lớp 10')).toBe(10)
    for (const x of ['', '  ', undefined, null, 'A1', '9', '120', {}]) expect(khoiEmTuLop(x), String(x)).toBeNull()
  })
  it('danh mục em ĐƯỢC CHỌN: khối 11 ⇒ chỉ lớp 10, 11; khối 10 ⇒ chỉ lớp 10; khối 12 ⇒ đủ; không rõ ⇒ đủ; lớp lạ giữ lại; không sửa đầu vào', () => {
    const ds = [{ lop: '10' }, { lop: '11' }, { lop: '12' }, { lop: 'Chuyên đề' }]
    const goc = JSON.stringify(ds)
    expect(lopEmDuocChon(11, ds).map((l) => l.lop)).toEqual(['10', '11', 'Chuyên đề'])
    expect(lopEmDuocChon(10, ds).map((l) => l.lop)).toEqual(['10', 'Chuyên đề'])
    expect(lopEmDuocChon(12, ds)).toHaveLength(4)
    expect(lopEmDuocChon(null, ds)).toHaveLength(4)
    expect(lopEmDuocChon(11, 'x' as never)).toEqual([])
    expect(JSON.stringify(ds)).toBe(goc)
  })
  it('lớp chọn sẵn: đúng khối em; không có thì lớp CAO NHẤT còn được chọn; khối em không rõ ⇒ như cũ (12, không có thì lớp cuối); rỗng ⇒ ""', () => {
    const ba = [{ lop: '10' }, { lop: '11' }, { lop: '12' }]
    expect(lopMacDinhCuaEm(11, lopEmDuocChon(11, ba))).toBe('11')
    expect(lopMacDinhCuaEm(10, lopEmDuocChon(10, ba))).toBe('10')
    expect(lopMacDinhCuaEm(12, ba)).toBe('12')
    expect(lopMacDinhCuaEm(11, [{ lop: '10' }])).toBe('10') // danh mục thiếu lớp 11 ⇒ lớp 10, KHÔNG nhảy lên 12
    expect(lopMacDinhCuaEm(null, ba)).toBe('12')
    expect(lopMacDinhCuaEm(null, [{ lop: '10' }, { lop: '11' }])).toBe('11')
    expect(lopMacDinhCuaEm(11, [])).toBe('')
  })
  it('nút lớp hiện ra + chặn chọn tay: khối 11 ⇒ ["10","11"], không chọn được 12; không rõ ⇒ đủ ba', () => {
    expect(cacLopHienThi(11)).toEqual(['10', '11'])
    expect(cacLopHienThi(10)).toEqual(['10'])
    expect(cacLopHienThi(12)).toEqual(['10', '11', '12'])
    expect(cacLopHienThi(null)).toEqual(['10', '11', '12'])
    expect(duocChonLop(11, '12')).toBe(false)
    expect(duocChonLop(11, '11')).toBe(true)
    expect(duocChonLop(11, '10')).toBe(true)
    expect(duocChonLop(null, '12')).toBe(true)
    expect(duocChonLop(11, 'Chuyên đề')).toBe(true)
  })
  it('nguồn đề: bỏ đề khối CAO hơn (mã tờ hoặc nhóm), giữ đề khối thấp / bằng / không rõ; đúng thứ tự', () => {
    const ds = [{ maDe: 'DH-12-C2-B6-TN' }, { maDe: 'DB-11-B8-D1' }, { maDe: 'DH-10-I-1' }, { maDe: 'de-thay-dat-ten' }, { maDe: 'x', nhom: '12 · DẠNG BÀI/Este' }]
    expect(nguonHopKhoi(11, ds).map((d) => d.maDe)).toEqual(['DB-11-B8-D1', 'DH-10-I-1', 'de-thay-dat-ten'])
    expect(nguonHopKhoi(null, ds)).toHaveLength(5)
    expect(nguonHopKhoi(12, ds)).toHaveLength(5)
  })
})

describe('KhoiKhacPhuc3CheDo — chế độ "Luyện dạng bài" theo khối em', () => {
  const ve = (lop?: string) => render(<KhoiKhacPhuc3CheDo sbd="000001" hoTen="Em Thử" dsLichSu={[]} scriptUrl="http://may-chu-gia" initialCheDo={3} lop={lop} />)
  const nutLop = () => screen.queryAllByRole('button').filter((b) => /^Lớp \d\d$/.test((b.textContent || '').trim()))

  it('em khối 11: chỉ có nút Lớp 10 và Lớp 11 (KHÔNG có Lớp 12); mặc định Lớp 11; bài hiện ra là bài lớp 11', async () => {
    const { container } = ve('11')
    await screen.findByText('Lớp 11')
    await waitFor(() => expect(container.textContent).toContain('BAI-MUOI-MOT-A'))
    expect(nutLop().map((b) => b.textContent!.trim())).toEqual(['Lớp 10', 'Lớp 11'])
    expect(screen.queryByText('Lớp 12')).toBeNull()
    expect(container.textContent).not.toContain('BAI-MUOI-HAI-A')
    expect(nutLop().find((b) => b.textContent!.trim() === 'Lớp 11')!.className).toContain('bg-blue-500') // đang chọn
    expect(nutLop().find((b) => b.textContent!.trim() === 'Lớp 10')!.className).not.toContain('bg-blue-500')
  })
  it('em khối 11 bấm Lớp 10 thì sang bài lớp 10; vẫn không thể sang lớp 12', async () => {
    const { container } = ve('11')
    await screen.findByText('Lớp 11')
    nutLop().find((b) => b.textContent!.trim() === 'Lớp 10')!.click()
    await waitFor(() => expect(container.textContent).toContain('BAI-MUOI-A'))
    expect(screen.queryByText('Lớp 12')).toBeNull()
  })
  it('em khối 10: chỉ Lớp 10, mặc định Lớp 10', async () => {
    const { container } = ve('10')
    await waitFor(() => expect(container.textContent).toContain('BAI-MUOI-A'))
    expect(nutLop().map((b) => b.textContent!.trim())).toEqual(['Lớp 10'])
    expect(container.textContent).not.toContain('BAI-MUOI-MOT-A')
  })
  it('em khối 12 ("12 - Tinh Hoa") ⇒ đủ ba lớp, mặc định Lớp 12', async () => {
    const { container } = ve('12 - Tinh Hoa')
    await waitFor(() => expect(container.textContent).toContain('BAI-MUOI-HAI-A'))
    expect(nutLop().map((b) => b.textContent!.trim())).toEqual(['Lớp 10', 'Lớp 11', 'Lớp 12'])
  })
  it('KHÔNG rõ khối em (không truyền lớp / lớp rỗng) ⇒ như cũ: đủ ba lớp, mặc định Lớp 12 (không biết ⇒ không kết tội)', async () => {
    for (const lop of [undefined, '']) {
      const { container, unmount } = ve(lop)
      await waitFor(() => expect(container.textContent).toContain('BAI-MUOI-HAI-A'))
      expect(nutLop()).toHaveLength(3)
      unmount()
    }
  })
})

describe('ModalKhacPhucCauSai — "Luyện dạng bài" theo khối em', () => {
  const CAU_SAI = [{ qid: 'DH-11-I-1', soCau: 1, phan: 'I' as const, dapAnDung: 'A', dapAnChon: 'B', text: 'Câu thử', choices: ['a', 'b', 'c', 'd'], maCa: 'ca1' }]
  const ve = (lop?: string) => render(<ModalKhacPhucCauSai isOpen onClose={() => {}} dsCauSai={CAU_SAI} hoTen="Em Thử" sbd="000001" tieuDeCa="Ca thử" cheDoMacDinh={3} lop={lop} />)
  const nutLop = () => screen.queryAllByRole('button').filter((b) => /^Lớp \d\d$/.test((b.textContent || '').trim()))

  it('em khối 11: chỉ Lớp 10 và Lớp 11; mặc định Lớp 11 (bài lớp 11 hiện, bài lớp 12 KHÔNG hiện)', async () => {
    const { container } = ve('11')
    await waitFor(() => expect(container.textContent).toContain('BAI-MUOI-MOT-A'))
    expect(nutLop().map((b) => b.textContent!.trim())).toEqual(['Lớp 10', 'Lớp 11'])
    expect(container.textContent).not.toContain('BAI-MUOI-HAI-A')
    expect(nutLop().find((b) => b.textContent!.trim() === 'Lớp 11')!.className).toContain('bg-blue-600')
  })
  it('khối 12 ⇒ đủ ba, mặc định Lớp 12; không rõ khối ⇒ như cũ (đủ ba, mặc định Lớp 12)', async () => {
    for (const lop of ['12', undefined, '']) {
      const { container, unmount } = ve(lop)
      await waitFor(() => expect(container.textContent).toContain('BAI-MUOI-HAI-A'))
      expect(nutLop()).toHaveLength(3)
      unmount()
    }
  })
})

describe('mã chạy: không còn mặc định cố định lớp 12; nguồn đề rút câu đi qua bộ lọc khối; các nơi gọi có truyền lớp của em', () => {
  const KHOI = boChuThich(doc('src/components/KhoiKhacPhuc3CheDo.tsx'))
  const MODAL = boChuThich(doc('src/components/ModalKhacPhucCauSai.tsx'))
  it('KhoiKhacPhuc3CheDo: không `useState(\'12\')`, không tìm lớp \'12\' làm mặc định, không danh sách cố định [\'10\',\'11\',\'12\'] cho nút lớp', () => {
    expect(KHOI).not.toMatch(/useState\('12'\)/)
    expect(KHOI).not.toMatch(/l\.lop === '12'/)
    expect(KHOI).not.toMatch(/\['10', '11', '12'\]\.map/)
    expect(KHOI).toContain('cacLopHienThi(khoiEm)')
    expect(KHOI).toContain('duocChonLop(khoiEm, lop)')
    expect(KHOI).toContain('nguonHopKhoi(khoiEm, khoDe2Tho)')
    expect(KHOI).toContain('nguonHopKhoi(khoiEm, khoDangBaiTho)')
    expect(KHOI).toContain('lopEmDuocChon(khoiEm, dmDangBaiTho)')
  })
  it('ModalKhacPhucCauSai: không tìm lớp \'12\' làm mặc định; lọc ba nguồn (kho đề, kho dạng bài, danh mục) theo khối em', () => {
    expect(MODAL).not.toMatch(/l\.lop === '12'/)
    expect(MODAL).toContain('nguonHopKhoi(khoiEm, khoDeTho)')
    expect(MODAL).toContain('nguonHopKhoi(khoiEm, khoDangBaiTho)')
    expect(MODAL).toContain('lopEmDuocChon(khoiEm, dmDangBaiTho)')
    expect(MODAL).toContain('lopMacDinhCuaEm(khoiEm, dmDangBai)')
  })
  it('nơi gọi truyền lớp của em: cổng học sinh (2 chỗ), báo cáo ca của học sinh, báo cáo ca của phụ huynh', () => {
    const cong = doc('src/screens/StudentPortalScreen.tsx')
    expect(cong.match(/<KhoiKhacPhuc3CheDo[\s\S]*?lop=\{auth\.lop\}[\s\S]*?\/>/g)).toHaveLength(1)
    expect(cong.match(/<ModalKhacPhucCauSai[\s\S]*?lop=\{auth\.lop\}[\s\S]*?onTaoPhieuXong/g)).toHaveLength(1)
    for (const f of ['src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/components/BaoCaoCaThiPhuHuynhModal.tsx']) expect(doc(f).match(/<ModalKhacPhucCauSai[\s\S]*?lop=\{lop\}[\s\S]*?\/?>/g), f).toHaveLength(1)
  })
})
