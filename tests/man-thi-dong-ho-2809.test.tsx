// MÀN THI ĐỨNG MÁY KHI NGỒI YÊN (28/09, docs/toi-uu-2809/MAN-THI.md): đồng hồ 1 giây/lần làm GỐC màn thi vẽ lại cả đề
// (~260 công thức KaTeX). Sửa gốc: (1) đồng hồ nằm trong KHO GIỜ, chỉ nút lá hiển thị số đổi mỗi giây, gốc chỉ nghe MỐC
// (thường / gấp ≤5' / cuối ≤1' / hết); (2) ChemText + ChemFormula bọc memo, KaTeX nhớ kết quả — hiển thị y hệt bản cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import katex from 'katex'
import { ChemText } from '../src/lib/chem-format'
import { dinhDangDongHo, mocCua, taoKhoGio, useGiayConLai, useMocGio, type KhoGio } from '../src/lib/dong-ho-thi'
import LamBaiNgang, { type CauPhieu, type LamBaiNgangProps } from '../src/screens/LamBaiNgang'
import ThanhTrenThiM3 from '../src/screens/ThanhTrenThiM3'
import LuyenDeChuan from '../src/components/LuyenDeChuan'
import { CAU_MAU_CHEM } from './fixtures/chem-mau-2809'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

const doc = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-28T08:00:00Z'))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

// ---------------------------------------------------------------- KHO GIỜ
describe('kho giờ: đếm theo mốc hết giờ tuyệt đối + giờ máy chủ, không cộng dồn nhịp', () => {
  it('mốc: thường > 5 phút ≥ gấp > 1 phút ≥ cuối > 0 ≥ hết; mốc hỏng (NaN) ⇒ không-rõ (không tự nộp, không khoá)', () => {
    expect(mocCua(301)).toBe('thuong')
    expect(mocCua(300)).toBe('gap')
    expect(mocCua(61)).toBe('gap')
    expect(mocCua(60)).toBe('cuoi')
    expect(mocCua(0.4)).toBe('cuoi')
    expect(mocCua(0)).toBe('het')
    expect(mocCua(-3)).toBe('het')
    expect(mocCua(Number.NaN)).toBe('khong-ro')
  })
  it('định dạng mm:ss y hệt formatClock cũ (âm ⇒ 00:00)', () => {
    expect(dinhDangDongHo(38 * 60 + 12.9)).toBe('38:12')
    expect(dinhDangDongHo(5)).toBe('00:05')
    expect(dinhDangDongHo(-4)).toBe('00:00')
  })
  it('giờ lấy LẠI từ hàm giờ (máy chủ) mỗi nhịp: lệch giờ máy chủ đổi là số đổi theo', () => {
    let lech = 0
    const kho = taoKhoGio(Date.now() + 600_000, () => Date.now() + lech)
    const nghe = vi.fn()
    const bo = kho.dangKy(nghe)
    expect(kho.conLai()).toBe(600)
    vi.advanceTimersByTime(1000)
    expect(kho.conLai()).toBe(599)
    lech = 30_000 // hiệu chỉnh giờ máy chủ: nhanh hơn 30 giây
    vi.advanceTimersByTime(1000)
    expect(kho.conLai()).toBe(568)
    expect(nghe).toHaveBeenCalledTimes(2)
    bo()
    vi.advanceTimersByTime(5000)
    expect(nghe).toHaveBeenCalledTimes(2) // hết người nghe ⇒ tắt nhịp
    expect(vi.getTimerCount()).toBe(0)
  })
})

// ---------------------------------------------------------------- GỐC KHÔNG VẼ LẠI MỖI GIÂY
/** Mô phỏng đúng cách gốc màn thi dùng kho: gốc nghe mốc, nút lá nghe giây. */
function La({ kho, dem }: { kho: KhoGio; dem: { la: number } }) {
  dem.la++
  const giay = useGiayConLai(kho)
  return <span data-testid="so">{dinhDangDongHo(giay ?? 0)}</span>
}
function Goc({ kho, dem, onHet }: { kho: KhoGio; dem: { goc: number; la: number }; onHet: () => void }) {
  dem.goc++
  const moc = useMocGio(kho)
  if (moc === 'het') onHet()
  return (
    <div data-moc={moc}>
      <La kho={kho} dem={dem} />
    </div>
  )
}

describe('gốc màn thi KHÔNG vẽ lại mỗi giây — chỉ nút lá đồng hồ', () => {
  it('ngồi yên 20 giây: nút lá vẽ ≥ 20 lần, gốc 1 lần; qua mốc 5 phút / 1 phút / hết giờ gốc mới vẽ lại', () => {
    const kho = taoKhoGio(Date.now() + 5 * 60_000 + 30_000, Date.now)
    const dem = { goc: 0, la: 0 }
    const onHet = vi.fn()
    const r = render(<Goc kho={kho} dem={dem} onHet={onHet} />)
    const goc0 = dem.goc
    for (let i = 0; i < 20; i++) {
      act(() => {
        vi.advanceTimersByTime(1000)
      })
    }
    expect(r.getByTestId('so').textContent).toBe('05:10')
    expect(dem.goc).toBe(goc0) // 20 giây: gốc không vẽ lại lần nào
    expect(dem.la).toBeGreaterThanOrEqual(20)
    act(() => {
      vi.advanceTimersByTime(10_000) // chạm 5:00 ⇒ gấp
    })
    expect(r.container.querySelector('[data-moc]')?.getAttribute('data-moc')).toBe('gap')
    expect(dem.goc).toBe(goc0 + 1)
    act(() => {
      vi.advanceTimersByTime(4 * 60_000) // 1:00 ⇒ cuối
    })
    expect(r.container.querySelector('[data-moc]')?.getAttribute('data-moc')).toBe('cuoi')
    expect(dem.goc).toBe(goc0 + 2)
    expect(onHet).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(60_000) // 0:00 ⇒ hết giờ ⇒ gốc tự nộp
    })
    expect(r.getByTestId('so').textContent).toBe('00:00')
    expect(onHet).toHaveBeenCalled()
    expect(dem.goc).toBe(goc0 + 3)
  })

  it('vừa vào thi: kho tạo xong đã có giây thật ⇒ KHÔNG tự nộp nhầm ở lượt vẽ đầu', () => {
    const onHet = vi.fn()
    render(<Goc kho={taoKhoGio(Date.now() + 50 * 60_000, Date.now)} dem={{ goc: 0, la: 0 }} onHet={onHet} />)
    expect(onHet).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------- MÀN THI DÙNG KHO (khoá bằng nguồn)
describe('ExamTakeScreen / LuyenDeChuan / StudentPortal: không còn setState giây ở gốc', () => {
  const man = doc('src/screens/ExamTakeScreen.tsx')
  it('màn thi: không còn state `remaining`; gốc nghe useMocGio; số giờ + nhãn nộp chờ là nút lá', () => {
    expect(man).not.toMatch(/setRemaining\(|\[remaining, /)
    expect(man).toMatch(/const mocGio = useMocGio\(khoGio\)/)
    expect(man).toMatch(/taoKhoGio\(hetLucMs, gioMayChu\)/)
    expect(man).toMatch(/if \(mocGio === 'het'\) void doSubmit\(attempt, true\)/)
    expect(man).toMatch(/<SoDongHo kho=\{khoGio\} \/>/)
    expect(man).toMatch(/<NhanNopCho kho=\{khoGio\} \/>/)
  })
  it('luyện đề chuẩn: không setSeconds mỗi giây; tự nộp khi hết giờ theo mốc', () => {
    const l = doc('src/components/LuyenDeChuan.tsx')
    expect(l).not.toMatch(/setSeconds\(n\)/)
    expect(l).toMatch(/<DongHoLuyen kho=\{khoGio\}/)
    expect(l).toMatch(/const hetGio = mocGio === 'het'/)
  })
  it('cổng học sinh (bài gia đình giao): đồng hồ đếm trong DemGioMom, gốc không setState mỗi giây', () => {
    const s = doc('src/screens/StudentPortalScreen.tsx')
    expect(s).not.toMatch(/setGiayConLaiMom\(/)
    expect(s).toMatch(/<DemGioMom mom=\{dangLamMom\}>/)
  })
})

// ---------------------------------------------------------------- BỐ CỤC NGANG + THANH TRÊN M3
const mau = (): CauPhieu[] => [
  { stt: 1, phan: 'I', chon: null, daLam: false, danhDau: false },
  { stt: 2, phan: 'III', tl: '', daLam: false, danhDau: false },
]
function propsNgang(p: Partial<LamBaiNgangProps>): LamBaiNgangProps {
  return {
    boCuc: 'ngang',
    tenCa: 'Ca thử',
    cau: mau(),
    onChonPa: () => {},
    onGhiY: () => {},
    onNhap: () => {},
    oDapSo: () => null,
    onDoiDau: () => {},
    dongHo: '',
    chuThayDongHo: 'Bài tập',
    conGiay: null,
    daLam: 0,
    tong: 2,
    nhanLuu: 'đã lưu',
    mayNgoaiMang: false,
    dangLuu: false,
    nhanNutNop: 'Nộp bài',
    khoaNop: false,
    onNop: () => {},
    tatPhim: false,
    cauBatDau: 1,
    onCauDangXem: () => {},
    children: <div id="cau-1">Câu 1</div>,
    ...p,
  }
}

describe('bố cục ngang: ô giờ tự đếm từ kho, phiếu + đề KHÔNG vẽ lại mỗi giây; đổi màu 10/5 phút giữ nguyên', () => {
  it('11 phút → vàng (≤10) → đỏ (≤5); thân LamBaiNgang không vẽ lại', () => {
    const kho = taoKhoGio(Date.now() + 10 * 60_000 + 5_000, Date.now)
    const oDapSo = vi.fn(() => null) // gọi trong lượt vẽ của LamBaiNgang (câu Phần III) ⇒ đếm lượt vẽ thân
    const r = render(<LamBaiNgang {...propsNgang({ khoGio: kho, oDapSo })} />)
    const gio = () => r.container.querySelector('.lb-gio') as HTMLElement
    expect(gio().querySelector('.lb-gio-so')?.textContent).toBe('10:05')
    expect(gio().dataset.muc).toBeUndefined()
    const ve0 = oDapSo.mock.calls.length
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(gio().dataset.muc).toBe('vang')
    expect(gio().textContent).toContain('Còn dưới 10 phút')
    expect(gio().getAttribute('aria-label')).toBe('Thời gian còn lại 10:00')
    act(() => {
      vi.advanceTimersByTime(5 * 60_000)
    })
    expect(gio().dataset.muc).toBe('do')
    expect(gio().textContent).toContain('Còn dưới 5 phút')
    expect(oDapSo.mock.calls.length).toBe(ve0) // 305 giây trôi qua: thân không vẽ lại lần nào
  })
  it('bài tập về nhà (dongHo null) vẫn hiện chữ thay đồng hồ dù có kho', () => {
    const r = render(<LamBaiNgang {...propsNgang({ dongHo: null, chuThayDongHo: 'Hạn 30/09', khoGio: null })} />)
    expect(r.container.querySelector('.lb-gio')?.textContent).toContain('Hạn 30/09')
  })
  it('thanh trên M3 nhận nút lá đồng hồ (ReactNode) như chuỗi cũ', () => {
    const r = render(
      <ThanhTrenThiM3 dongHo={<b>12:34</b>} chuThayDongHo="Bài tập" gap={false} tenCa="Ca" daLam={1} tong={2} nhanLuu="đã lưu" mayNgoaiMang={false} dangLuu={false} onMoLuoi={() => {}} />,
    )
    expect(r.container.textContent).toContain('12:34')
  })
})

// ---------------------------------------------------------------- CÔNG THỨC Y HỆT + MEMO
describe('ChemText: memo + nhớ KaTeX, HTML y hệt bản trước 28/09', () => {
  it('bộ câu mẫu (đề thật + sơ đồ phản ứng, ion, chỉ số, \\ce, $…$, phương trình dài, lỗi cú pháp): HTML trùng từng ký tự, kể cả lần vẽ thứ hai (lấy từ bộ nhớ)', () => {
    const truoc = JSON.parse(doc('tests/fixtures/chem-html-truoc-2809.json')) as Record<string, string>
    const dong = [...CAU_MAU_CHEM, ...doc('tests/fixtures/de-thpt-2026-ma100.txt').split('\n').filter((d) => d.trim())]
    expect(Object.keys(truoc).length).toBeGreaterThanOrEqual(300)
    let soKatex = 0
    for (const d of dong) {
      const a = render(<ChemText text={d} />)
      expect(a.container.innerHTML, d).toBe(truoc[d])
      if (a.container.querySelector('.katex')) soKatex++
      a.unmount()
      const b = render(<ChemText text={d} />)
      expect(b.container.innerHTML, d).toBe(truoc[d])
      b.unmount()
    }
    expect(soKatex).toBeGreaterThanOrEqual(10)
  })
  it('ChemText là memo; cha vẽ lại với cùng chuỗi ⇒ KaTeX không chạy lại, DOM công thức giữ nguyên nút', () => {
    expect((ChemText as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'))
    const spy = vi.spyOn(katex, 'renderToString')
    const chuoi = 'Chất $\\ce{C17H35COONa}$ và $\\frac{7}{9}$ mol (mẫu riêng test memo 2809)'
    const Cha = ({ n }: { n: number }) => (
      <div data-n={n}>
        <ChemText text={chuoi} />
      </div>
    )
    const r = render(<Cha n={1} />)
    const lan1 = spy.mock.calls.length
    expect(lan1).toBe(2)
    const nut = r.container.querySelector('.katex')
    for (let i = 2; i < 30; i++) r.rerender(<Cha n={i} />)
    expect(spy.mock.calls.length).toBe(lan1)
    expect(r.container.querySelector('.katex')).toBe(nut)
  })
})

// ---------------------------------------------------------------- LUYỆN ĐỀ CHUẨN: hành vi thật
describe('LuyenDeChuan: đồng hồ nút lá vẫn đếm, đỏ khi ≤ 5 phút, hết giờ tự nộp', () => {
  it('bài còn 2,5 giây: số giờ đỏ, về 0:00 thì tự gọi /luyen-de/submit', async () => {
    vi.useRealTimers()
    const cuoc: string[] = []
    const hetLuc = Date.now() + 2500 // mốc hết giờ do máy chủ đặt — cố định
    const BANK = { phanI: [{ id: 'a1', text: 'Chất $\\ce{CH3OH}$ là', choices: ['A', 'B', 'C', 'D'] }], phanII: [], phanIII: [] }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const u = new URL(String(url)).pathname
        cuoc.push(u)
        const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
        if (u.endsWith('/history')) return ok({ ok: true, items: [{ id: 'p1', createdAt: Date.now(), status: 'active', score: null }] })
        if (u.endsWith('/save')) return ok({ ok: true })
        if (u.endsWith('/submit')) return ok({ ok: true, id: 'p1', status: 'submitted', deadline: Date.now(), serverNow: Date.now(), answers: {}, bank: BANK })
        return ok({ ok: true, id: 'p1', status: 'active', deadline: hetLuc, serverNow: Date.now(), answers: {}, bank: BANK })
      }),
    )
    render(<LuyenDeChuan sbd="12001" token="t" />)
    fireEvent.click(await screen.findByRole('button', { name: /^Tiếp tục bài luyện/ }))
    const so = await screen.findByLabelText('Thời gian còn lại')
    expect(so.textContent).toMatch(/^0:0[0-3]$/)
    expect(so.parentElement!.className).toContain('text-red-600')
    await waitFor(() => expect(cuoc.some((u) => u.endsWith('/luyen-de/submit'))).toBe(true), { timeout: 5000 })
  }, 15000)
})
