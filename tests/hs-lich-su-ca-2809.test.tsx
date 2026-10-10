// LỊCH SỬ CA + BÁO CÁO CHI TIẾT BẢN MỚI phía HỌC SINH (thầy 28/09): thẻ nhỏ trên Sảnh → màn Lịch sử ca → BaoCaoChiTiet chế độ em.
// Khoá: chỉ ca ĐÃ CÔNG BỐ có điểm; mới nhất trên cùng; bấm mở đúng ca; chế độ em không hạng/không so lớp/không mã ca;
// lời giải đi qua TheCau (khuôn Câu đã làm); mức độ nhận thức số thật hoặc ẩn; máy chủ không trả ca/câu của em khác.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { dungLichSuCa, chuTheCaGanNhat, ngayThangVn } from '../src/lib/lich-su-ca-hs'
import { demMucDoNhanThuc } from '../src/lib/muc-do-nhan-thuc'
import { baoCaoCuaEm } from '../src/lib/bao-cao-cua-em'
import BaoCaoChiTiet from '../src/components/ca-thi/BaoCaoChiTiet'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mocks = vi.hoisted(() => ({ lichSu: null as any, baoCao: vi.fn() }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => mocks.lichSu,
}))
vi.mock('../src/components/ca-thi/BaoCaoCaCuaEm', () => ({
  default: (p: any) => {
    mocks.baoCao(p)
    return <div role="dialog" aria-label="Báo cáo thử">Báo cáo {p.maCa}</div>
  },
}))
import LichSuCaEm from '../src/components/hoa2/LichSuCaEm'

afterEach(() => {
  cleanup()
  mocks.baoCao.mockReset()
})

const DA = [
  { maCa: 'A', tenCa: 'Kiểm tra đầu năm', nopLuc: '2026-09-12T01:05:00Z', tong: 6.75, soCauDung: 20, tongCau: 28 },
  { maCa: 'C', tenCa: 'Kiểm tra 45 phút', nopLuc: '2026-09-26T02:42:00Z', tong: 7.25, soCauDung: 22, tongCau: 28, diemI: 3.75, diemII: 2.5, diemIII: 1 },
  { maCa: 'B', tenCa: 'Kiểm tra 15 phút', nopLuc: '2026-09-19T01:10:00Z', tong: 6.5, soCauDung: 19, tongCau: 28 },
]
// Ca chưa công bố — cố tình nhét điểm vào: phải bị bỏ.
const CHO = [{ maCa: 'D', tenCa: 'Kiểm tra Ammonia', nopLuc: '2026-09-28T01:20:00Z', tong: 9.5, soCauDung: 27 } as any]

describe('dungLichSuCa — thứ tự, xu hướng, luật công bố', () => {
  it('mới nhất trên cùng; ca chưa công bố xen đúng chỗ và KHÔNG có điểm/số câu', () => {
    const ds = dungLichSuCa(DA, CHO)
    expect(ds.map((d) => d.maCa)).toEqual(['D', 'C', 'B', 'A'])
    expect(ds[0]).toEqual({ kieu: 'cho_cong_bo', maCa: 'D', ten: 'Kiểm tra Ammonia', nopLuc: CHO[0].nopLuc, gio: expect.any(String) })
    expect(JSON.stringify(ds[0])).not.toMatch(/9[.,]5|27/)
  })
  it('xu hướng so với ca đã công bố liền trước; ca đầu tiên = null; điểm kiểu Việt', () => {
    const ds = dungLichSuCa(DA, CHO).filter((d) => d.kieu === 'da_cong_bo') as any[]
    expect(ds.map((d) => [d.maCa, d.xuHuong, d.chuDiem])).toEqual([
      ['C', 0.75, '7,25'],
      ['B', -0.25, '6,5'],
      ['A', null, '6,75'],
    ])
    expect(ds[0].dung).toBe(22)
  })
  it('ca có trong cả hai danh sách chỉ hiện một lần (đã công bố thắng); lượt nộp muộn nhất thắng', () => {
    const ds = dungLichSuCa([...DA, { ...DA[1], nopLuc: '2026-09-26T03:00:00Z', tong: 8 }], [{ maCa: 'C', nopLuc: '2026-09-26T02:42:00Z' }])
    const c = ds.filter((d) => d.maCa === 'C')
    expect(c).toHaveLength(1)
    expect((c[0] as any).diem).toBe(8)
  })
})

describe('thẻ nhỏ trên Sảnh', () => {
  it('"Ca kiểm tra gần nhất: 7,25 điểm · 26/09" — chỉ ca ĐÃ công bố, bỏ qua ca chờ mới hơn', () => {
    expect(chuTheCaGanNhat(dungLichSuCa(DA, CHO))).toEqual({ chu: 'Ca kiểm tra gần nhất: 7,25 điểm · 26/09', coDiem: true })
  })
  it('chưa có ca đã công bố ⇒ "Chưa có ca đã công bố"', () => {
    expect(chuTheCaGanNhat(dungLichSuCa([], CHO))).toEqual({ chu: 'Chưa có ca đã công bố', coDiem: false })
  })
  it('ngày theo giờ Việt Nam (23:30 UTC 25/09 = 26/09)', () => {
    expect(ngayThangVn('2026-09-25T23:30:00Z')).toBe('26/09')
    expect(ngayThangVn('hỏng')).toBe('')
  })
  it('Sảnh nối thẻ vào màn Lịch sử ca', () => {
    const sanh = readFileSync(resolve(__dirname, '../src/components/hoa2/SanhBanDo.tsx'), 'utf8')
    const cong = readFileSync(resolve(__dirname, '../src/screens/StudentPortalScreen.tsx'), 'utf8')
    expect((sanh.match(/<TheCaGanNhatSanh p=\{p\} \/>/g) ?? []).length).toBe(2)
    expect(cong).toContain("onLichSu={() => setTab('lichsuca')}")
    expect(cong).toContain("import('../components/hoa2/LichSuCaEm')")
  })
})

describe('màn Lịch sử ca', () => {
  it('bấm ca đã công bố ⇒ mở báo cáo ĐÚNG ca; ca chờ công bố không bấm được, không điểm', async () => {
    mocks.lichSu = { ok: true, items: DA, chuaCongBo: CHO }
    render(<LichSuCaEm sbd="S1" onVe={() => {}} />)
    const ds = await screen.findByRole('list', { name: /mới nhất trên cùng/ })
    const dong = within(ds).getAllByRole('listitem')
    expect(dong).toHaveLength(4)
    expect(dong[0]!.textContent).toContain('Chờ thầy công bố')
    expect(dong[0]!.querySelector('button')).toBeNull()
    expect(dong[0]!.textContent).not.toMatch(/9,5/)
    expect(dong[1]!.textContent).toMatch(/7,25/)
    expect(dong[1]!.textContent).toMatch(/Đúng 22\/28 câu/)
    expect(dong[1]!.textContent).toMatch(/Tăng 0,75 điểm so với ca trước/)
    fireEvent.click(within(dong[2]!).getByRole('button'))
    await screen.findByText('Báo cáo B')
    expect(mocks.baoCao.mock.calls[0]![0].maCa).toBe('B')
    expect(mocks.baoCao.mock.calls[0]![0].sbd).toBe('S1')
  })
  it('lỗi máy chủ ⇒ nói lý do + nút Thử lại', async () => {
    mocks.lichSu = { ok: false, error: 'Máy chủ bận' }
    render(<LichSuCaEm sbd="S1" onVe={() => {}} />)
    expect((await screen.findByRole('alert')).textContent).toContain('Máy chủ bận')
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})

const CAU = [
  { maCa: 'C', phan: 'I', soCau: 1, qid: 'q1', mucDo: 'biet', dungSai: true, dapAnChon: 'A', dapAnDung: 'A', text: 'Câu đúng', choices: ['a', 'b', 'c', 'd'], chuyenDe: 'Nitrogen' },
  {
    maCa: 'C', phan: 'I', soCau: 3, qid: 'q3', mucDo: 'hieu', dungSai: false, dapAnChon: 'A', dapAnDung: 'C', chuyenDe: 'Nitrogen',
    text: 'Trong NH₄⁺, số oxi hoá của N là', choices: ['+3', '+5', '−3', '0'],
    loiGiai: JSON.stringify({ chot: 'NH₃ chỉ có tính khử.', tung_pa: { A: { dung: false, vi_sao: 'Sai dấu.' }, B: { dung: false, vi_sao: 'Nhầm HNO₃.' }, C: { dung: true, vi_sao: 'x + 4 = +1.' }, D: { dung: false, vi_sao: 'Không phải đơn chất.' } } }),
  },
  { maCa: 'C', phan: 'III', soCau: 24, qid: 'q24', mucDo: 'van_dung', dungSai: false, dapAnChon: '', dapAnDung: '1,65', text: 'Tính V', loiGiai: JSON.stringify({ chot: 'Bảo toàn e.', buoc: ['n(Cu) = 0,1 mol.'], ket_qua: '1,65' }) },
  { maCa: 'KHAC', phan: 'I', soCau: 1, qid: 'x', mucDo: 'biet', dungSai: false },
]

describe('mức độ nhận thức — số thật hoặc ẩn', () => {
  it('đếm theo mucDo của câu thật; câu đúng trọn mới tính đúng', () => {
    const d = demMucDoNhanThuc(CAU.filter((c) => c.maCa === 'C'))
    expect(d.map((x) => [x.ten, x.dung, x.tong])).toEqual([
      ['Nhận biết', 1, 1],
      ['Thông hiểu', 0, 1],
      ['Vận dụng', 0, 1],
    ])
  })
  it('không câu nào có mức độ / chưa tải ⇒ [] (màn ẩn khối)', () => {
    expect(demMucDoNhanThuc([{ maCa: 'C', mucDo: '' }])).toEqual([])
    expect(demMucDoNhanThuc(null)).toEqual([])
  })
})

describe('BaoCaoChiTiet chế độ em (bản mới)', () => {
  const bc = baoCaoCuaEm(DA[1] as any, CAU)
  it('baoCaoCuaEm: câu cần chữa = mọi câu không đúng trọn của ĐÚNG ca, kèm đủ đề; không so lớp', () => {
    expect(bc.cauXemLai.map((c) => c.soCau)).toEqual([3, 24])
    expect(bc.cauXemLai[0]!.cau?.choices).toEqual(['+3', '+5', '−3', '0'])
    expect(bc.soVoiLop).toBeNull()
    expect(bc.dung).toBe(22)
    expect(bc.phan.map((p) => p.ma)).toEqual(['I', 'II', 'III'])
  })
  const ve = (mucDo = demMucDoNhanThuc(CAU.filter((c) => c.maCa === 'C'))) =>
    render(
      <BaoCaoChiTiet
        cheDo="hs" khongCong maCa="MA-NOI-BO-C" tenCa="Kiểm tra 45 phút" lopCa="12A1" ngay="26/09/2026" gioNop="09:42 · Thứ Bảy 26/09/2026"
        thoiGianPhut={null} siSo={0} lop={null} them={null} dangTai={false} dsEm={[]} tab="em" onTab={() => {}} sbdEm="S1" onChonEm={() => {}}
        emBc={bc} xuHuongEm={{ doi: 0.75, diemTruoc: 6.5 }} mucDo={mucDo} onDong={() => {}}
      />,
    )
  it('không tab Cả lớp, không hạng, không so với lớp, không mã ca, không ô sửa nhận xét; điểm dấu phẩy', () => {
    const { container } = ve()
    const t = container.textContent ?? ''
    expect(screen.queryByRole('tab', { name: 'Cả lớp' })).toBeNull()
    expect(t).not.toMatch(/hạng trong lớp|so với TB lớp|rời màn|MA-NOI-BO-C|SBD/)
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('select')).toBeNull()
    expect(t).toContain('7,25')
    expect(t).not.toContain('7.25')
    expect(t).toContain('+0,75 điểm so với ca trước (6,5)')
    expect(t).toContain('Theo mức độ nhận thức')
  })
  it('mức độ rỗng ⇒ ẩn khối', () => {
    const { container } = ve([])
    expect(container.textContent).not.toContain('Theo mức độ nhận thức')
  })
  it('bấm câu cần chữa ⇒ đề + lời giải bằng TheCau (khuôn Câu đã làm): chỉ số dưới <sub>, Kiến thức cốt lõi', () => {
    const { container } = ve()
    const mo = container.querySelectorAll('details.ct-xl-mo')
    expect(mo).toHaveLength(2)
    fireEvent.click(mo[0]!.querySelector('summary')!)
    ;(mo[0] as HTMLDetailsElement).open = true
    const giai = mo[0]!.querySelector('.ct-xl-giai')!
    expect(giai.querySelector('.h2-the-cau')).not.toBeNull()
    expect(giai.textContent).toMatch(/KIẾN THỨC CỐT LÕI/i)
    expect(giai.querySelector('sub')).not.toBeNull()
    expect(giai.textContent).not.toContain('₄')
  })
})
// Phần máy chủ (SQLite thật, môi trường node): tests/hs-lich-su-ca-may-chu-2809.test.ts
