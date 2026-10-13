// HỎI THẦY · giao diện câu trả lời CÓ CẤU TRÚC + ĐỀ CHUẨN (bản vẽ docs/ban-ve-hoi-thay-1310, thầy chốt 13/10): ý chính (đậm + làm nổi) → bước
// đánh số → bảng nhanh (cột cuối thành nhãn) → ghi nhớ → nút hỏi tiếp; câu trả lời cũ dạng chữ vẫn hiện; đề "Câu n." + phương án A–D / ý a–d,
// tự gập sau khi Thầy trả lời.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
import HoiThemThay from '../src/components/loi-giai/HoiThemThay'
import NutHoiThay from '../src/components/loi-giai/NutHoiThay'
import TraLoiThay, { chuHoa, docCauTruc } from '../src/components/loi-giai/TraLoiThay'

type PhanHoi = Record<string, unknown>
let phanHoi: PhanHoi[] = []
let moCau: PhanHoi = { ok: false }
const goi: { url: string; body: PhanHoi }[] = []
beforeEach(() => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tok-em' }))
  goi.length = 0
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    goi.push({ url, body: JSON.parse(String(init?.body ?? '{}')) })
    const j = url.endsWith('/hs/hoi-tro-ly') ? (phanHoi.shift() ?? { ok: false, error: 'hết' }) : url.endsWith('/hs/hoi-thay') ? moCau : { ok: false }
    return new Response(JSON.stringify(j), { status: 200, headers: { 'content-type': 'application/json' } })
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear() })

const CT = {
  yChinh: 'Em dùng **tính chất vật lý của amine**: có ==4 amine== ở thể khí.',
  buoc: [
    { ten: 'Nhớ quy tắc', chu: 'Amine phân tử khối nhỏ là **chất khí**.' },
    { ten: 'Xét từng chất', chu: 'So trạng thái của năm chất.' },
    { ten: 'Đếm', chu: 'Bốn chất khí.' },
  ],
  bang: { cot: ['Chất', 'Công thức', 'Thể'], dong: [['methylamine', 'CH3NH2', 'khí'], ['ethylamine', 'C2H5NH2', 'khí'], ['aniline', 'C6H5NH2', 'lỏng']], sauBuoc: 2 },
  ghiNho: 'Amine bậc thấp, ít C là chất khí.',
  hoiTiep: ['Vì sao aniline là chất lỏng?', 'Amine nào tan tốt trong nước?'],
}
const o = () => screen.getByLabelText('Chỗ em thắc mắc về câu này') as HTMLTextAreaElement

describe('TraLoiThay', () => {
  it('ý chính có đậm + làm nổi; bước đánh số; bảng nằm trong bước 2, cột cuối thành nhãn (chỗ khác tô khác); ghi nhớ; công thức hạ chỉ số', () => {
    const onHoi = vi.fn()
    const { container } = render(<TraLoiThay ct={docCauTruc(CT)!} onHoi={onHoi} />)
    const chinh = container.querySelector('.lg-tl-chinh')!
    expect(chinh.querySelector('strong')!.textContent).toBe('tính chất vật lý của amine')
    expect(chinh.querySelector('mark')!.textContent).toBe('4 amine')
    expect(chinh.textContent).not.toMatch(/\*\*|==/)
    const buoc = container.querySelectorAll('.lg-tl-buoc > li')
    expect(buoc).toHaveLength(3)
    expect(buoc[0]!.querySelector('b')!.textContent).toBe('Nhớ quy tắc')
    expect(buoc[1]!.querySelector('table')).toBeTruthy()
    expect(container.querySelectorAll('table')).toHaveLength(1)
    const nhan = [...container.querySelectorAll('.lg-tl-nhan')]
    expect(nhan.map((n) => [n.textContent, n.hasAttribute('data-khac')])).toEqual([['khí', false], ['khí', false], ['lỏng', true]])
    expect(container.querySelector('table sub')!.textContent).toBe('3') // CH3NH2 ⇒ CH<sub>3</sub>NH<sub>2</sub>
    expect(screen.getByRole('complementary', { name: 'Ghi nhớ' }).textContent).toContain('Amine bậc thấp, ít C là chất khí.')
    fireEvent.click(screen.getByRole('button', { name: 'Vì sao aniline là chất lỏng?' }))
    expect(onHoi).toHaveBeenCalledWith('Vì sao aniline là chất lỏng?')
    expect(screen.queryByText('Gợi hướng')).toBeNull()
  })

  it('bảng không gắn bước ⇒ đứng riêng sau các bước; đang làm ⇒ nhãn "Gợi hướng"; không onHoi ⇒ không nút hỏi tiếp', () => {
    const { container } = render(<TraLoiThay ct={docCauTruc({ ...CT, bang: { ...CT.bang, sauBuoc: 0 } })!} dangLam />)
    expect(container.querySelector('.lg-tl-buoc table')).toBeNull()
    expect(container.querySelector('.lg-tl > .lg-tl-bang-cuon table')).toBeTruthy()
    expect(screen.getByText('Gợi hướng')).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Hỏi tiếp' })).toBeNull()
  })

  it('gốc hữu cơ có gạch (thầy báo 13/10, ảnh "gốc alkyl là gì ạ"): CH3-, C2H5-, C3H7- hạ đủ chỉ số, gạch giữ thường (không thành điện tích)', () => {
    const cau = 'Gốc methyl là CH3-, ethyl là C2H5-, propyl là C3H7-.'
    const { container } = render(<TraLoiThay ct={docCauTruc({ yChinh: 'Gốc alkyl là **C6H5-** thì sai.', buoc: [{ ten: 'Ví dụ gốc alkyl', chu: cau }] })!} />)
    const p = container.querySelector('.lg-tl-buoc p')!
    expect([...p.querySelectorAll('sub')].map((x) => x.textContent)).toEqual(['3', '2', '5', '3', '7'])
    expect(p.querySelector('sup')).toBeNull()
    expect(p.textContent).toBe('Gốc methyl là CH3-, ethyl là C2H5-, propyl là C3H7-.')
    expect([...container.querySelectorAll('.lg-tl-chinh strong sub')].map((x) => x.textContent)).toEqual(['6', '5'])
    // Không đụng: ion (đi bảng ion quen thuộc của ChemText), công thức cấu tạo, mã đề, chữ đã đánh dấu, chỉ số Unicode trộn.
    for (const giu of ['HCO3-', 'SO42-', 'NH4+', 'CH3-CH2-OH', 'C6H5-NH2', '12-C1-B2-D1', 'OH-', 'CH3COO-']) expect(chuHoa(giu)).toBe(giu)
    expect(chuHoa('gốc C₂H5- và (CH3)2CH2-')).toBe('gốc C_{2}H_{5}- và (CH_{3})_{2}CH_{2}-')
  })

  it('docCauTruc: sai khuôn / rỗng ⇒ null; thiếu phần nào hiện phần có được', () => {
    expect(docCauTruc(undefined)).toBeNull()
    expect(docCauTruc('chữ')).toBeNull()
    expect(docCauTruc({ yChinh: '', buoc: [] })).toBeNull()
    expect(docCauTruc({ yChinh: 'Chỉ có ý chính.' })).toEqual({ yChinh: 'Chỉ có ý chính.', buoc: [], bang: null, ghiNho: '', hoiTiep: [] })
    expect(docCauTruc({ yChinh: 'x', bang: { cot: ['một cột'], dong: [['a']] } })!.bang).toBeNull()
  })
})

describe('HoiThemThay vẽ câu trả lời có cấu trúc', () => {
  it('có cauTruc ⇒ vẽ TraLoiThay; bấm hỏi tiếp ⇒ gửi ngay câu đó, chữ em đang gõ dở giữ nguyên; nút hỏi tiếp chỉ ở câu trả lời mới nhất', async () => {
    phanHoi = [
      { ok: true, traLoi: 'chữ phẳng', cauTruc: CT, conLai: 19, ngoaiPhamVi: false },
      { ok: true, traLoi: 'Aniline có vòng benzene nên lỏng.', conLai: 18, ngoaiPhamVi: false },
    ]
    const { container } = render(<HoiThemThay qid="Q" nguon="luyen_de" hop />)
    fireEvent.change(o(), { target: { value: 'Em dùng kiến thức gì ạ?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => expect(container.querySelector('.lg-tl')).toBeTruthy())
    expect(container.textContent).not.toContain('chữ phẳng')
    fireEvent.change(o(), { target: { value: 'đang gõ dở' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vì sao aniline là chất lỏng?' }))
    await screen.findByText('Aniline có vòng benzene nên lỏng.') // câu trả lời không cấu trúc (bản cũ) ⇒ đoạn chữ như trước
    expect(goi.filter((g) => g.url.endsWith('/hs/hoi-tro-ly')).map((g) => g.body.cauHoi)).toEqual(['Em dùng kiến thức gì ạ?', 'Vì sao aniline là chất lỏng?'])
    expect(o().value).toBe('đang gõ dở')
    expect(screen.queryByRole('group', { name: 'Hỏi tiếp' })).toBeNull()
  })

  it('hết lượt sau câu trả lời ⇒ ẩn nút hỏi tiếp', async () => {
    phanHoi = [{ ok: true, traLoi: 'x', cauTruc: CT, conLai: 0, ngoaiPhamVi: false }]
    const { container } = render(<HoiThemThay qid="Q" nguon="luyen" hop />)
    fireEvent.change(o(), { target: { value: 'Câu cuối ạ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => expect(container.querySelector('.lg-tl')).toBeTruthy())
    expect(screen.queryByRole('group', { name: 'Hỏi tiếp' })).toBeNull()
  })
})

describe('đề chuẩn trong hộp Hỏi Thầy', () => {
  const hoSo = { qid: 'DE-I-1', bam: 'b', dang: 'tn', ten: 'T', co: [] }
  const moHop = async (cau: PhanHoi) => {
    moCau = { ok: true, coLoiGiai: true, cau, hoSo, hoiThem: true }
    render(<NutHoiThay qid={String(cau.qid)} nguon="luyen_de" />)
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    return screen.findByRole('dialog', { name: 'Hỏi Thầy' })
  }

  it('trắc nghiệm: "Câu 1." đậm, công thức hạ chỉ số, 4 phương án A–D có nhãn đọc màn hình; Thầy trả lời ⇒ đề gập thành một dòng tóm tắt', async () => {
    phanHoi = [{ ok: true, traLoi: 'x', cauTruc: CT, conLai: 19, ngoaiPhamVi: false }]
    const hop = await moHop({ qid: 'DE-I-1', so: 'Câu 1', chuong: 'Amine', de: '<p>Cho các chất: CH3NH2, C6H5NH2.<br>Số chất khí là</p>', y: { A: '1', B: '2', C: '3', D: '4' } })
    const chu = hop.querySelector('.lg-de-chu')!
    expect(chu.querySelector('b')!.textContent).toBe('Câu 1.')
    expect(chu.querySelector('sub')!.textContent).toBe('3')
    const pa = within(hop).getAllByRole('listitem')
    expect(pa.map((li) => li.textContent)).toEqual(['APhương án A: 1', 'BPhương án B: 2', 'CPhương án C: 3', 'DPhương án D: 4'])
    expect(hop.querySelector('.lg-de-pa')!.hasAttribute('data-ngan')).toBe(true)
    expect(hop.querySelector('.lg-de-loai')!.textContent).toBe('Trắc nghiệm')
    const de = hop.querySelector('details')!
    expect(de.open).toBe(true)
    expect(hop.querySelector('.lg-de-tom')).toBeNull()
    fireEvent.change(o(), { target: { value: 'Em dùng kiến thức gì ạ?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => expect(de.open).toBe(false))
    expect(hop.querySelector('.lg-de-tom')!.textContent).toBe('Cho các chất: CH3NH2, C6H5NH2. Số chất khí là')
  })

  it('đúng/sai: ý a–d nhãn "Ý a"; đề mở đầu bằng bảng/hình ⇒ giữ HTML như cũ', async () => {
    const hop = await moHop({ qid: 'DE-II-2', so: 'Câu 2', de: '<table><tr><td>Chất</td></tr></table><p>Xét các phát biểu</p>', y: { a: 'Ý một', b: 'Ý hai', c: 'Ý ba', d: 'Ý bốn' } })
    expect(hop.querySelector('.lg-de-chu')).toBeNull()
    expect(hop.querySelector('.lg-chu-de table')).toBeTruthy()
    expect(within(hop).getAllByRole('listitem')[0]!.textContent).toBe('aÝ a: Ý một')
    expect(hop.querySelector('.lg-de-pa')!.hasAttribute('data-ds')).toBe(true)
    expect(hop.querySelector('.lg-de-loai')!.textContent).toBe('Đúng / Sai')
  })

  it('trả lời ngắn: không danh sách phương án', async () => {
    const hop = await moHop({ qid: 'DE-III-1', so: 'Câu 3', de: '<p>Tính khối lượng muối.</p>', y: {} })
    expect(hop.querySelector('.lg-de-pa')).toBeNull()
    expect(hop.querySelector('.lg-de-loai')!.textContent).toBe('Trả lời ngắn')
  })
})
