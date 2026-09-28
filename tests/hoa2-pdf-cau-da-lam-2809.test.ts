// GAME HÓA 2.0 — TỆP PDF "Câu đã làm" (src/components/hoa2/pdf-cau-da-lam.ts), bản vẽ docs/ban-ve-game-hoa-2-2709/HS-PDF.dc.html.
// Khoá: tên tệp, dòng đầu tờ, từng khối câu (đề đầy đủ · đáp án xanh ✓ / em chọn đỏ ✗ "(em chọn)" · "Em: Sai ✗" · LỜI GIẢI →
// KIẾN THỨC CỐT LÕI → từng phương án/ý ✓✗ · bước + kết quả · Lịch sử), công thức ra <sub>, chia trang, và đường jsPDF (thư viện giả).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { docChiTiet, type CauDaLamMuc } from '../src/components/hoa2/api'
import { cauChiDePdfHtml, cauPdfHtml, chanTrangPdf, chiaTrang, dauCauPdf, dongThongTinPdf, dungPdf, slugChu, tenTepPdf, tieuDePdf, type ThongTinIn } from '../src/components/hoa2/pdf-cau-da-lam'

const { anhGia, addPageGia, addImageGia, html2canvasGia } = vi.hoisted(() => ({
  anhGia: [] as string[],
  addPageGia: vi.fn(),
  addImageGia: vi.fn(),
  html2canvasGia: vi.fn(async (el: HTMLElement) => {
    anhGia.push(el.innerHTML)
    return { width: 1588, height: 2246, toDataURL: () => 'data:image/jpeg;base64,AAAA' }
  }),
}))
vi.mock('html2canvas-pro', () => ({ default: html2canvasGia }))
vi.mock('jspdf', () => ({
  jsPDF: class {
    internal = { pageSize: { getWidth: () => 595.28, getHeight: () => 841.89 } }
    addPage = addPageGia
    addImage = addImageGia
    setProperties = vi.fn()
    output = () => new Blob(['%PDF-1.3 giả'], { type: 'application/pdf' })
  },
}))
afterEach(() => {
  anhGia.length = 0
  vi.clearAllMocks()
})

const MUC = (x: Partial<CauDaLamMuc>): CauDaLamMuc => ({
  qid: 'q', chienDichId: 'cd1', stt: 1, phan: 'I', mucDo: 'hieu', tenDang: '', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [], ...x,
})
const CT_17 = docChiTiet({
  de: { qid: 'q17', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH dư, đun nóng. Khối lượng muối thu được là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester', mucDo: 'van_dung', maDe: 'D' },
  dapAn: 'B',
  loiGiai: {
    chot: 'CH3COOC2H5 + NaOH → CH3COONa + C2H5OH; tỉ lệ mol ester : muối = 1 : 1.',
    tung_pa: { A: { dung: false, vi_sao: 'Tính nhầm n(ester) = 0,05 mol.' }, B: { dung: true, vi_sao: 'n(ester) = 0,1 mol → 8,2 gam.' }, C: { dung: false, vi_sao: 'Lấy nhầm gốc C₂H₅–.' }, D: { dung: false, vi_sao: 'Sai gốc acid.' } },
  },
  emTraLoi: 'C',
})!
const M_17 = MUC({ qid: 'q17', stt: 17, mucDo: 'VD', trangThai: 'can_day_lai', lichSu: [{ ngay: '2026-09-29', dung: false, coGoiY: false }, { ngay: '2026-10-01', dung: false, coGoiY: true }] })
const CT_5 = docChiTiet({
  de: { qid: 'q5', phan: 'II', text: 'Cho các phát biểu về chất béo, mỗi phát biểu đúng hay sai?', choices: [], ideas: ['Chất béo là triester của glycerol với acid béo.', 'Tristearin ở trạng thái lỏng.', 'Thuỷ phân trong kiềm thu được glycerol.', 'Chất béo tan tốt trong nước.'], hinhAnh: [], tenDang: 'Chất béo', mucDo: 'hieu', maDe: 'D' },
  dapAn: 'DSDS',
  loiGiai: { chot: 'Chất béo không tan trong nước.', tung_y: { a: { dung: true, vi_sao: 'Định nghĩa.' }, b: { dung: false, vi_sao: 'Rắn.' }, c: { dung: true, vi_sao: 'Xà phòng hoá.' }, d: { dung: false, vi_sao: 'Không tan.' } } },
  emTraLoi: 'SSDS',
})!
const CT_31 = docChiTiet({
  de: { qid: 'q31', phan: 'III', text: 'Số đồng phân cấu tạo ester ứng với công thức phân tử C4H8O2 là bao nhiêu?', choices: [], ideas: [], hinhAnh: [], tenDang: '', mucDo: 'hieu', maDe: 'D' },
  dapAn: '4',
  loiGiai: { chot: 'Ester no, đơn chức, mạch hở.', buoc: ['HCOO– ghép với C₃H₇–: 2 đồng phân.', 'CH₃COO– ghép với C₂H₅–: 1.', 'C₂H₅COO– ghép với CH₃–: 1.'] },
  emTraLoi: '2',
})!
// 20:15 Chủ Nhật 04/10/2026 giờ Việt Nam
const LUC = Date.UTC(2026, 9, 4, 13, 15)
const TT: ThongTinIn = { hoTen: 'Nguyễn An', lop: '12A1', sbd: '123', tenChienDich: 'Ester – Lipid', nhanBoLoc: 'Sai lần gần nhất', inLuc: LUC }

describe('tờ PDF Câu đã làm — khớp bản vẽ HS-PDF', () => {
  it('tên tệp cau-da-lam-<bộ-lọc>-<ngày>.pdf (bỏ dấu, giờ Việt Nam); tiêu đề + dòng thông tin + chân trang', () => {
    expect(tenTepPdf('Sai lần gần nhất', LUC)).toBe('cau-da-lam-sai-lan-gan-nhat-04-10-2026.pdf')
    expect(tenTepPdf('Cần thầy dạy lại', Date.UTC(2026, 8, 28, 17, 30))).toBe('cau-da-lam-can-thay-day-lai-29-09-2026.pdf')
    expect(slugChu('Đang ôn')).toBe('dang-on')
    expect(tieuDePdf('Sai lần gần nhất')).toBe('Câu đã làm — Sai lần gần nhất')
    expect(dongThongTinPdf(TT, 14)).toBe('Nguyễn An · Lớp 12A1 · Chiến dịch Ester – Lipid · 14 câu · In lúc 20:15 Chủ Nhật 04/10/2026')
    expect(chanTrangPdf(TT)).toBe('Câu đã làm · Nguyễn An · 12A1')
  })

  it('Trắc nghiệm: đầu câu, đề đầy đủ, đáp án xanh ✓, em chọn đỏ ✗ (em chọn), LỜI GIẢI → KIẾN THỨC CỐT LÕI → 4 dòng ✓✗, lịch sử', () => {
    expect(dauCauPdf({ muc: M_17, ct: CT_17 })).toBe('Câu 17 · Trắc nghiệm · Vận dụng · Cần thầy dạy lại')
    const h = cauPdfHtml({ muc: M_17, ct: CT_17 })
    const d = document.createElement('div')
    d.innerHTML = h
    expect(d.querySelector('.pdfc-de')!.textContent).toContain('Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH dư, đun nóng. Khối lượng muối thu được là')
    expect(d.querySelector('[data-pa="dung"]')!.textContent).toBe('B. 8,2 gam ✓')
    expect(d.querySelector('[data-pa="sai"]')!.textContent).toBe('C. 9,6 gam ✗ (em chọn)')
    const lg = d.querySelector('.pdfc-lg')!
    expect(lg.querySelector('.pdfc-lgn')!.textContent).toBe('LỜI GIẢI')
    expect(lg.querySelector('.pdfc-chotn')!.textContent).toBe('KIẾN THỨC CỐT LÕI')
    expect(lg.querySelector('.pdfc-chott')!.innerHTML).toContain('CH<sub>3</sub>COONa') // công thức ra chỉ số dưới
    const dong = Array.from(lg.querySelectorAll('.pdfc-ly')).map((x) => x.textContent)
    expect(dong).toEqual(['✗A.Tính nhầm n(ester) = 0,05 mol.', '✓B.n(ester) = 0,1 mol8,2 gam.', '✗C.Lấy nhầm gốc C₂H₅–.', '✗D.Sai gốc acid.'])
    expect(lg.querySelectorAll('.pdfc-ly')[1]!.querySelector('.mt .mt-than.mt-phai')).not.toBeNull() // mũi tên vẽ nét như phiếu
    expect(d.querySelector('.pdfc-ls')!.textContent).toBe('Lịch sử: Sai 29/09 · Sai 01/10 (có gợi ý)')
    expect(h).not.toContain('q17') // không mã nội bộ trên tờ
  })

  it('Đúng–sai: "em sai ý a)", từng ý "Em: Sai ✗/✓", lời giải từng ý ✓✗; Trả lời ngắn: "Em trả lời: 2", bước đánh số + kết quả', () => {
    const m5 = MUC({ qid: 'q5', stt: 5, phan: 'II', lichSu: [{ ngay: '2026-09-29', dung: true, coGoiY: false }, { ngay: '2026-10-03', dung: false, coGoiY: false }] })
    expect(dauCauPdf({ muc: m5, ct: CT_5 })).toBe('Câu 5 · Đúng–sai · Thông hiểu · Đang ôn · em sai ý a)')
    const d = document.createElement('div')
    d.innerHTML = cauPdfHtml({ muc: m5, ct: CT_5 })
    const y = Array.from(d.querySelectorAll('.pdfc-y')).map((x) => x.textContent)
    expect(y[0]).toBe('a) Chất béo là triester của glycerol với acid béo. Em: Sai ✗')
    expect(y[1]).toBe('b) Tristearin ở trạng thái lỏng. Em: Sai ✓')
    expect(y[2]).toContain('Em: Đúng ✓')
    expect(Array.from(d.querySelectorAll('.pdfc-ly')).map((x) => x.textContent!.slice(0, 3))).toEqual(['✓a)', '✗b)', '✓c)', '✗d)'])
    expect(d.querySelector('.pdfc-ls')!.textContent).toBe('Lịch sử: Đúng 29/09 · Sai 03/10')

    const m31 = MUC({ qid: 'q31', stt: 31, phan: 'III' })
    const e = document.createElement('div')
    e.innerHTML = cauPdfHtml({ muc: m31, ct: CT_31 })
    expect(dauCauPdf({ muc: m31, ct: CT_31 })).toBe('Câu 31 · Trả lời ngắn · Thông hiểu · Đang ôn')
    expect(e.querySelector('.pdfc-de')!.textContent).toBe('Số đồng phân cấu tạo ester ứng với công thức phân tử C4H8O2 là bao nhiêu? Em trả lời: 2 ✗')
    expect(e.querySelector('.pdfc-de')!.innerHTML).toContain('C<sub>4</sub>H<sub>8</sub>O<sub>2</sub>')
    expect(e.querySelectorAll('.pdfc-b')).toHaveLength(3)
    expect(e.querySelector('.pdfc-kq')!.textContent).toBe('4')
  })

  it('kho chưa có lời giải ⇒ nói thật + vẫn in đáp án (không bịa)', () => {
    const ct = { ...CT_17, loiGiai: null }
    const d = document.createElement('div')
    d.innerHTML = cauPdfHtml({ muc: M_17, ct })
    expect(d.querySelector('.pdfc-lg')!.textContent).toContain('Câu này trong kho chưa có lời giải.')
    expect(d.querySelector('.pdfc-lg')!.textContent).toContain('Đáp án: B')
    expect(d.querySelector('.pdfc-chot')).toBeNull()
  })

  it('chia trang: không cắt đôi câu, câu dài hơn một trang đứng riêng', () => {
    expect(chiaTrang([100, 400, 400, 300], 1000)).toEqual([[0, 1, 2], [3]])
    expect(chiaTrang([100, 1500, 50], 1000)).toEqual([[0], [1], [2]])
    expect(chiaTrang([], 1000)).toEqual([])
  })

  it('dungPdf: chụp từng trang A4 (có tiêu đề, câu, chân "Trang i/N") rồi ghép bằng jsPDF ⇒ Blob application/pdf; dọn DOM tạm', async () => {
    const tienDo = vi.fn()
    const blob = await dungPdf(TT, [{ muc: M_17, ct: CT_17 }, { muc: MUC({ qid: 'q31', stt: 31, phan: 'III' }), ct: CT_31 }], tienDo)
    expect(blob.type).toBe('application/pdf')
    expect(html2canvasGia).toHaveBeenCalledTimes(1) // jsdom đo cao 0 ⇒ một trang
    expect(anhGia[0]).toContain('Câu đã làm — Sai lần gần nhất')
    expect(anhGia[0]).toContain('Câu 17 · Trắc nghiệm · Vận dụng · Cần thầy dạy lại')
    expect(anhGia[0]).toContain('Câu 31 · Trả lời ngắn')
    expect(anhGia[0]).toContain('Trang 1/1')
    expect(addImageGia).toHaveBeenCalledTimes(1)
    expect(addImageGia.mock.calls[0]!.slice(1, 6)).toEqual(['JPEG', 0, -0, 595.28, expect.any(Number)])
    expect(addPageGia).not.toHaveBeenCalled()
    expect(tienDo).toHaveBeenLastCalledWith(1, 1)
    expect(document.querySelector('.pdfc-goc')).toBeNull()
  })
})

// Thầy 28/09: "cho thêm chế độ chỉ tải nguyên đề" + "độ nét của pdf chưa ổn".
describe('PDF chế độ CHỈ ĐỀ + độ nét', () => {
  it('chỉ đề: có đề + phương án, KHÔNG lời giải / đáp án / dấu ✓✗ / bài làm / lịch sử', () => {
    for (const [muc, ct] of [[M_17, CT_17], [MUC({ qid: 'q5', stt: 5 }), CT_5], [MUC({ qid: 'q31', stt: 31 }), CT_31]] as const) {
      const h = cauChiDePdfHtml({ muc, ct })
      expect(h).toContain(`Câu ${muc.stt}`)
      expect(h).not.toMatch(/LỜI GIẢI|KIẾN THỨC CỐT LÕI|✓|✗|em chọn|Em trả lời|Em:|Lịch sử|Đang ôn|Cần dạy lại/)
    }
  })
  it('tên tệp + tiêu đề có hậu tố chỉ đề', () => {
    expect(tenTepPdf('Sai lần gần nhất', LUC, true)).toBe('cau-da-lam-sai-lan-gan-nhat-chi-de-04-10-2026.pdf')
    expect(tieuDePdf('Sai lần gần nhất', true)).toBe('Câu đã làm — Sai lần gần nhất · Chỉ đề')
  })
  it('độ nét: chụp trang ở scale 3 (tờ ngắn)', async () => {
    html2canvasGia.mockClear()
    await dungPdf({ ...TT, chiDe: true }, [{ muc: M_17, ct: CT_17 }])
    expect(html2canvasGia.mock.calls[0]![1]).toMatchObject({ scale: 3 })
  })
})
