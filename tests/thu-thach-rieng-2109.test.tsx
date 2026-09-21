// "THỬ THÁCH RIÊNG HÔM NAY" (Bộ não A.I Nấc 1, thầy chốt 21/09): lib đọc chặt hợp đồng `docs/hop-dong-thu-thach-rieng-2109.md` (mục 3–4), thẻ ở đầu Bảng nhiệm vụ học sinh,
// nối vào cổng HS thật (POST /hs/thu-thach-hom-nay → thẻ → làm câu bằng LamCauOn → POST /hs/thu-thach-hom-nay/nop). Luật: MỘT nút chính, không bắt buộc, không hạn,
// co:false/lỗi/404 ⇒ KHÔNG thẻ (im lặng), không đáp án ở máy em trước khi nộp, "Để sau" ẩn tới ngày mai, phụ huynh không thấy gì.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import TheThuThachRieng from '../src/components/bang-nhiem-vu/TheThuThachRieng'
import { chuDaXong, chuDangLam, dangDeSau, docDeSau, docThuThachRieng, dongThanThu, luuDeSau, type ThuThachRieng } from '../src/lib/thu-thach-rieng'
import { taiThuThachHomNay } from '../src/components/bang-nhiem-vu/cau-on-api'

configure({ asyncUtilTimeout: 8000 })

const mocks = vi.hoisted(() => ({ homework: vi.fn(), sheet: vi.fn(), items: [] as any[], momItems: [] as any[] }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => <div data-testid="thu" /> }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: () => Promise.resolve({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: mocks.items }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: mocks.momItems }) }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ btvnCuaEm: mocks.homework }))
vi.mock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: async () => ({ URL: '/test' }), dungPhieuBtvn: mocks.sheet }))

const NOW = Date.now()
const HOM_NAY = new Date(NOW + 7 * 3600_000).toISOString().slice(0, 10)
const KE_HOACH = {
  ok: true,
  ngay: HOM_NAY,
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [{ id: `on_lai:${HOM_NAY}`, loai: 'on_lai', soCau: 3, thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'bu', trangThai: 'cho', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a', 'b', 'c'] } }],
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: new Date(NOW - 360000).toISOString(),
  loiNhanHlv: { ngay: HOM_NAY, loi: 'Hôm qua em làm đúng 4 câu, giỏi lắm.' },
}
const CAU = [
  { qid: 'tt1', phan: 'I', text: 'Thuỷ phân ester nào cho ancol etylic?', choices: ['etyl axetat', 'metyl fomat', 'vinyl axetat', 'phenyl axetat'], ideas: [], hinhAnh: [] },
  { qid: 'tt2', phan: 'III', text: 'Tính khối lượng xà phòng (g).', choices: [], ideas: [], hinhAnh: [] },
]
const THU_THACH = (o: Record<string, unknown> = {}) => ({
  ok: true, co: true, ngay: HOM_NAY, loiMoi: 'Rồng Lửa còn thiếu 40 EXP để lên cấp 7. Hôm nay thử 2 câu Thuỷ phân ester, xong là đủ.', soCau: 2,
  dang: [{ ma: 'ESTE.THUY_PHAN', ten: 'Thuỷ phân ester' }], bac: 'dung_bac', trangThai: 'chua_lam', soDaLam: 0,
  thanThu: { ten: 'Rồng Lửa', cap: 6, expConThieu: 40, manhKhien: 3, manhKhienTong: 12, chuoiNgay: 4 }, cau: CAU, daNop: [], ...o,
})

type Tra = { status?: number; body?: any; nem?: boolean }
let cuocGoi: { url: string; body: any }[] = []
let tra: Record<string, Tra | ((b: any) => Tra)> = {}
beforeEach(() => {
  tra = {}
  cuocGoi = []
  mocks.items = []
  mocks.momItems = []
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Minh Anh', token: 'test-token' }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      const u = String(url)
      let body: any = {}
      try { body = JSON.parse(init?.body || '{}') } catch {}
      cuocGoi.push({ url: u, body })
      const r0 = tra[new URL(u).pathname]
      const r = typeof r0 === 'function' ? r0(body) : r0
      if (r?.nem) throw new Error('mất mạng')
      const status = r?.status ?? 200
      return { ok: status >= 200 && status < 300, status, json: async () => r?.body ?? { ok: true, items: [] } }
    }),
  )
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
const goiTheo = (d: string) => cuocGoi.filter((c) => new URL(c.url).pathname === d)

describe('docThuThachRieng — đọc chặt hợp đồng máy chủ', () => {
  it('hợp lệ: lời mời NGUYÊN VĂN, câu công khai, số thật thần thú, dạng', () => {
    const t = docThuThachRieng(THU_THACH())!
    expect(t.loiMoi).toContain('Rồng Lửa còn thiếu 40 EXP')
    expect(t.soCau).toBe(2); expect(t.cau.map((c) => c.qid)).toEqual(['tt1', 'tt2']); expect(t.trangThai).toBe('chua_lam')
    expect(t.dang).toEqual([{ ma: 'ESTE.THUY_PHAN', ten: 'Thuỷ phân ester' }])
    expect(t.thanThu).toEqual({ ten: 'Rồng Lửa', cap: 6, expConThieu: 40, manhKhien: 3, manhKhienTong: 12, chuoiNgay: 4 })
    expect(dongThanThu(t)).toEqual(['Rồng Lửa · cấp 6 · còn 40 EXP nữa để lên cấp kế', 'Mảnh khiên 3/12', 'Chuỗi 4 ngày'])
  })
  it('co:false · ok:false · không phải đối tượng · thiếu lời mời · chưa xong mà không có câu ⇒ null (không thẻ)', () => {
    for (const x of [null, 'x', [], { ok: true, co: false }, { ok: false, error: 'x' }, THU_THACH({ loiMoi: '   ' }), THU_THACH({ cau: [] }), THU_THACH({ cau: [{ qid: '', phan: 'I', text: 'x' }] })]) expect(docThuThachRieng(x)).toBeNull()
  })
  it('câu TỰ LUẬN bị bỏ (chốt chặn cuối), câu hỏng bị bỏ, tối đa 8 câu', () => {
    const tl = { qid: 'tl1', phan: 'III', text: 'Hãy viết phương trình phản ứng và giải thích chi tiết hiện tượng quan sát được.', luaChon: null, dapAn: 'Trình bày' }
    const t = docThuThachRieng(THU_THACH({ cau: [...CAU, { qid: 'loi', phan: 'IV', text: 'x' }, ...Array.from({ length: 12 }, (_, i) => ({ qid: `q${i}`, phan: 'I', text: 't', choices: ['a', 'b'] }))] }))!
    expect(t.cau.length).toBeLessThanOrEqual(8); expect(t.cau.some((c) => c.qid === 'loi')).toBe(false)
    expect(docThuThachRieng(THU_THACH({ cau: [tl] }))).toBeNull()
  })
  it('thiếu số thật thì BỎ dòng đó, không đoán: thanThu hỏng ⇒ không dòng; khiên vượt tổng ⇒ bỏ', () => {
    expect(dongThanThu(docThuThachRieng(THU_THACH({ thanThu: { ten: 'Rồng Lửa' } }))!)).toEqual([])
    expect(dongThanThu(docThuThachRieng(THU_THACH({ thanThu: { ten: 'Rồng Lửa', manhKhien: 20, manhKhienTong: 12, chuoiNgay: 0 } }))!)).toEqual([])
    expect(docThuThachRieng(THU_THACH({ thanThu: 5 }))!.thanThu).toBeNull()
  })
  it('đã xong: "Em đã xong thử thách hôm nay · đúng x trong y câu" từ daNop; đang làm dở: "đã làm 1/2 câu"', () => {
    const xong = docThuThachRieng(THU_THACH({ trangThai: 'xong', cau: [], soDaLam: 2, daNop: [{ qid: 'tt1', dung: true }, { qid: 'tt2', dung: false }] }))!
    expect(xong.trangThai).toBe('xong'); expect(chuDaXong(xong)).toBe('Em đã xong thử thách hôm nay · đúng 1 trong 2 câu')
    const dang = docThuThachRieng(THU_THACH({ trangThai: 'dang_lam', cau: [CAU[1]], soDaLam: 1, daNop: [{ qid: 'tt1', dung: true }] }))!
    expect(chuDangLam(dang)).toBe('Em đã làm 1/2 câu của thử thách hôm nay')
  })
  it('"Để sau" chỉ ẩn trong CÙNG ngày; sang ngày mới hiện lại', () => {
    luuDeSau('test', '2026-09-21'); expect(docDeSau('test')).toBe('2026-09-21')
    expect(dangDeSau(docDeSau('test'), '2026-09-21', '2026-09-21')).toBe(true)
    expect(dangDeSau(docDeSau('test'), '2026-09-22', '2026-09-22')).toBe(false)
    expect(dangDeSau('', '2026-09-21', '2026-09-21')).toBe(false)
  })
})

describe('taiThuThachHomNay — lệnh mạng', () => {
  it('POST /hs/thu-thach-hom-nay {token}; 404 / lỗi mạng / co:false / ok:false ⇒ null, KHÔNG ném', async () => {
    tra['/hs/thu-thach-hom-nay'] = { body: THU_THACH() }
    expect((await taiThuThachHomNay('tk'))!.loiMoi).toContain('Rồng Lửa')
    expect(goiTheo('/hs/thu-thach-hom-nay')[0].body).toEqual({ token: 'tk' })
    for (const t of [{ status: 404 }, { nem: true }, { body: { ok: true, co: false } }, { body: { ok: false, error: 'x' } }, { status: 500, body: THU_THACH() }] as Tra[]) {
      tra['/hs/thu-thach-hom-nay'] = t
      expect(await taiThuThachHomNay('tk')).toBeNull()
    }
    expect(await taiThuThachHomNay('')).toBeNull()
  })
})

describe('TheThuThachRieng — thẻ', () => {
  const moi = docThuThachRieng(THU_THACH())!
  const dung = (t: ThuThachRieng = moi, tay = { onLam: vi.fn(), onDeSau: vi.fn() }) => ({ ...tay, ...render(<div className="bnv"><TheThuThachRieng thuThach={t} hoTen="Minh Anh" {...tay} /></div>) })
  it('mời: nhãn "Bộ não A.I hỗ trợ riêng em <họ tên>", tiêu đề, lời mời nguyên văn, số câu + "không bắt buộc, không có hạn", MỘT nút chính + "Để sau"', () => {
    const { onLam, onDeSau } = dung()
    const the = screen.getByRole('region', { name: 'Thử thách riêng hôm nay' })
    expect(the.textContent).toContain('Bộ não A.I hỗ trợ riêng em Minh Anh')
    expect(the.textContent).toContain('Rồng Lửa còn thiếu 40 EXP để lên cấp 7. Hôm nay thử 2 câu Thuỷ phân ester, xong là đủ.')
    expect(within(the).getByText('2 câu')).toBeTruthy(); expect(within(the).getByText('Không bắt buộc, không có hạn')).toBeTruthy()
    expect(within(the).getByText('Mảnh khiên 3/12')).toBeTruthy()
    expect(within(the).getAllByRole('button').map((b) => b.textContent)).toEqual(['Làm mấy câu này', 'Để sau'])
    expect(the.querySelectorAll('.bnv-nut-chinh').length).toBe(0) // nút chính của màn vẫn là "Làm ngay" (luật C2)
    fireEvent.click(screen.getByRole('button', { name: 'Làm mấy câu này' })); expect(onLam).toHaveBeenCalledWith(moi)
    fireEvent.click(screen.getByRole('button', { name: 'Để sau' })); expect(onDeSau).toHaveBeenCalledWith(moi)
    expect(document.body.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
  })
  it('xong: chỉ một dòng kết quả, KHÔNG nút', () => {
    dung(docThuThachRieng(THU_THACH({ trangThai: 'xong', cau: [], soDaLam: 2, daNop: [{ qid: 'tt1', dung: true }, { qid: 'tt2', dung: true }] }))!)
    expect(screen.getByText('Em đã xong thử thách hôm nay · đúng 2 trong 2 câu')).toBeTruthy()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
  it('đang làm dở: nút "Làm tiếp N câu" với số thật; máy chủ chọn ít câu hơn ⇒ nói lý do thật', () => {
    dung(docThuThachRieng(THU_THACH({ trangThai: 'dang_lam', cau: [CAU[1]], soDaLam: 1, daNop: [{ qid: 'tt1', dung: true }], thieu: { soCau: 4, lyDo: 'Dạng này còn ít câu em chưa làm gần đây.' } }))!)
    expect(screen.getByRole('button', { name: 'Làm tiếp 1 câu' })).toBeTruthy()
    expect(screen.getByText('Dạng này còn ít câu em chưa làm gần đây.')).toBeTruthy()
  })
})

describe('cổng học sinh THẬT: thẻ → làm câu → nộp', () => {
  it('thẻ nằm NGAY dưới thanh tiến độ và TRÊN việc hôm nay; Bộ não + EXP xuống dưới việc (H1)', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    tra['/hs/thu-thach-hom-nay'] = { body: THU_THACH() }
    const { container } = render(<StudentPortalScreen />)
    const the = await screen.findByRole('region', { name: 'Thử thách riêng hôm nay' })
    const tienDo = container.querySelector('[data-vung="tien-do"]')!
    const lamNgay = await screen.findByRole('region', { name: /^Làm ngay: Ôn 3 câu/ })
    const boNao = await waitFor(() => { const e = container.querySelector('[data-vung="bo-nao"]'); if (!e) throw new Error('chưa có'); return e })
    const truoc = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(truoc(tienDo, the)).toBe(true); expect(truoc(the, lamNgay)).toBe(true); expect(truoc(lamNgay, boNao)).toBe(true)
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(1) // vẫn MỘT nút chính của cả màn
    expect(goiTheo('/hs/thu-thach-hom-nay')[0].body).toEqual({ token: 'test-token' })
  })
  it('bấm "Làm mấy câu này" ⇒ mở màn làm câu bằng câu SẴN của máy chủ (không gọi /hs/cau-theo-qid); nộp qua /hs/thu-thach-hom-nay/nop; đáp án chỉ hiện SAU nộp', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    tra['/hs/thu-thach-hom-nay'] = { body: THU_THACH() }
    tra['/hs/thu-thach-hom-nay/nop'] = { body: { ok: true, ketQua: [{ qid: 'tt1', dung: true, dapAnDung: 'A', loiGiai: { chot: 'Este etyl axetat cho ancol etylic.' }, anhLoiGiai: [] }], khongCo: [], chuaLam: ['tt2'], tienBo: null, exp: 4, trangThai: 'dang_lam' } }
    render(<StudentPortalScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Làm mấy câu này' }))
    await screen.findByText('Thuỷ phân ester nào cho ancol etylic?')
    expect(goiTheo('/hs/cau-theo-qid')).toHaveLength(0)
    expect(document.body.textContent).not.toContain('Este etyl axetat cho ancol etylic.') // chưa nộp: chưa có lời giải/đáp án
    fireEvent.click(within(document.querySelectorAll<HTMLElement>('.lco-the')[0]).getAllByRole('radio')[0])
    fireEvent.click(screen.getByRole('button', { name: /^Nộp/ }))
    await screen.findByText(/Este etyl axetat cho ancol etylic\./)
    const nop = goiTheo('/hs/thu-thach-hom-nay/nop')
    expect(nop).toHaveLength(1); expect(nop[0].body).toEqual({ token: 'test-token', traLoi: [{ qid: 'tt1', dapAn: 'A' }] })
    expect(goiTheo('/hs/on-lai/nop')).toHaveLength(0)
  })
  it('"Để sau" ẩn thẻ và nhớ tới hết ngày (tải lại trang vẫn ẩn); thẻ không xuất hiện khi máy chủ nói co:false hoặc 404', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    tra['/hs/thu-thach-hom-nay'] = { body: THU_THACH() }
    const a = render(<StudentPortalScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Để sau' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Thử thách riêng hôm nay' })).toBeNull())
    expect(docDeSau('test')).toBe(HOM_NAY)
    a.unmount()
    render(<StudentPortalScreen />)
    await screen.findByRole('region', { name: /^Làm ngay: Ôn 3 câu/ })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('region', { name: 'Thử thách riêng hôm nay' })).toBeNull()
    cleanup(); localStorage.removeItem('omr_thu_thach_de_sau:test')
    for (const t of [{ body: { ok: true, co: false } }, { status: 404 }, { nem: true }] as Tra[]) {
      tra['/hs/thu-thach-hom-nay'] = t
      const b = render(<StudentPortalScreen />)
      await screen.findByRole('region', { name: /^Làm ngay: Ôn 3 câu/ })
      await new Promise((r) => setTimeout(r, 30))
      expect(screen.queryByRole('region', { name: 'Thử thách riêng hôm nay' })).toBeNull()
      b.unmount()
    }
  })
})
