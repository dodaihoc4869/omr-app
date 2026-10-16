// HỎI THẦY v2 · giao diện KHỐI HÌNH (bản vẽ docs/ban-ve-hoi-thay-v2-1410, thầy 14/10: "Làm mọi thứ tốt nhất để hs hỏi cái là hiểu được bài ngay"):
// sơ đồ · thí nghiệm ảo (ống theo mã hiện tượng, "Làm lại") · hiện tượng → nhóm chức · phương trình (chất chính viền) · tính nhanh (Đáp số) · bẫy;
// ++đúng++ xanh, !!sai!! đỏ gạch có chữ đọc màn hình; nhóm chức đứng riêng thành nhãn màu; câu trả lời cũ không có khối vẫn vẽ như trước.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TraLoiThay, { ChuTo, docCauTruc } from '../src/components/loi-giai/TraLoiThay'
import { docKhoi } from '../src/components/loi-giai/KhoiTraLoi'

afterEach(() => { cleanup() })

/** Đúng khuôn máy chủ trả (server/src/hoi-tro-ly-cau-truc.ts lamSachCauTruc). */
const MAY_CHU = {
  yChinh: 'Muối là ++CH3COONa++, không phải !!C2H5COONa!! ⇒ ==8,2 gam==.',
  buoc: [{ ten: 'Khoanh nhóm chức', chu: 'Tìm nhóm –NH2 và –CHO trong từng chất.' }],
  bang: null,
  ghiNho: 'Muối giữ **gốc acid** RCOO–.',
  hoiTiep: ['Gọi tên ester thế nào?'],
  soDo: { nut: [{ ten: 'Tinh bột', nhan: '' }, { ten: 'Glucose', nhan: 'X' }, { ten: '', nhan: 'Y' }], dk: ['H2O, H^+, t°', 'men rượu'] },
  thiNghiem: [
    { nhan: 'X', thuoc: 'Quỳ tím', hien: 'quy-xanh', chu: 'Quỳ hoá xanh', phu: 'môi trường base' },
    { nhan: 'Y', thuoc: 'AgNO3/NH3, t°', hien: 'trang-bac', chu: 'Lớp bạc sáng', phu: '' },
    { nhan: 'Z', thuoc: 'Nước bromine', hien: 'tua-trang', chu: 'Kết tủa trắng', phu: '' },
  ],
  nhanBiet: [{ thuoc: 'Quỳ tím', hien: 'quy-xanh', chu: 'hoá xanh', nhom: '–NH2 gắn gốc no' }],
  phuongTrinh: [{ trai: ['CH3COOC2H5', 'NaOH'], phai: ['CH3COONa', 'C2H5OH'], mui: '→', dk: 't°', chinh: 'CH3COONa' }],
  tinh: { dong: [{ nhan: 'n ester', phep: '8,8 : 88', kq: '0,1 mol' }], dapSo: '8,2 gam' },
  bay: { tieuDe: 'Chỗ em nhầm', chu: 'Em lấy !!gốc ethyl!! làm gốc muối.' },
}

describe('khối hình', () => {
  it('vẽ đủ 6 loại khối đúng thứ tự: ý chính → sơ đồ → thí nghiệm → nhận biết → phương trình → tính nhanh → bước → bẫy → ghi nhớ', () => {
    const ct = docCauTruc(MAY_CHU)!
    const { container } = render(<TraLoiThay ct={ct} onHoi={() => {}} />)
    const thuTu = [...container.querySelectorAll('.lg-tl > *')].map((e) => e.getAttribute('aria-label') ?? e.className)
    // SỬA CÓ CHỦ ĐÍCH 16/10: nhãn trợ giảng AI đã được thầy duyệt; vẫn kiểm đủ thứ tự mọi khối học thuật.
    expect(thuTu).toEqual(['lg-tl-dau', 'lg-ht-ai', 'lg-tl-chinh', 'Sơ đồ chuyển hoá', 'Thí nghiệm ảo', 'Hiện tượng và nhóm chức', 'Phương trình', 'Tính nhanh', 'lg-tl-buoc', 'Chỗ em nhầm', 'Ghi nhớ', 'Hỏi tiếp'])
    expect(container.querySelector('.lg-ht-ai')!.textContent).toBe('Trợ giảng AI của thầy Học')
    // thí nghiệm: một ống mỗi chất, đúng mã hiện tượng, quỳ có mẩu giấy, tráng bạc có gương + lửa, kết tủa có lớp tủa
    const ong = [...container.querySelectorAll('.lg-tn')]
    expect(ong.map((o) => o.getAttribute('data-h'))).toEqual(['quy-xanh', 'trang-bac', 'tua-trang'])
    expect(ong[0]!.querySelector('.lg-tn-quy')).not.toBeNull()
    expect(ong[0]!.querySelector('.lg-tn-giot')).toBeNull()
    expect(ong[1]!.querySelector('.lg-tn-guong')).not.toBeNull()
    expect(ong[1]!.querySelector('.lg-tn-lua')).not.toBeNull()
    expect(ong[2]!.querySelector('.lg-tn-tua')).not.toBeNull()
    expect((ong[2] as HTMLElement).style.getPropertyValue('--mau-giot')).toBe('var(--cam)') // nước bromine: giọt cam
    expect(container.querySelector('.lg-tn-hang')!.hasAttribute('data-chay')).toBe(true) // máy không có IntersectionObserver ⇒ chạy ngay
    expect(screen.getByText(/X với Quỳ tím: Quỳ hoá xanh, môi trường base\./).className).toBe('sr-only')
    // phương trình: chất chính viền, sản phẩm khác màu, điều kiện trên mũi tên
    const pt = container.querySelector('.lg-pt')!
    expect([...pt.querySelectorAll('.c')].map((c) => c.textContent)).toEqual(['CH3COOC2H5', 'NaOH', 'CH3COONa', 'C2H5OH'])
    expect(pt.querySelector('.c[data-chinh]')!.textContent).toBe('CH3COONa')
    expect(pt.querySelectorAll('.c[data-sp]')).toHaveLength(2)
    expect(pt.querySelector('.mui')!.textContent).toContain('t°')
    expect(pt.querySelector('.c sub')!.textContent).toBe('3') // công thức hạ chỉ số
    // tính nhanh + sơ đồ
    expect(container.querySelector('.lg-tinh dd b')!.textContent).toBe('0,1 mol')
    expect(container.querySelector('.lg-tinh .cuoi')!.textContent).toBe('Đáp số8,2 gam')
    const nut = [...container.querySelectorAll('.lg-sd .nut')]
    expect(nut.map((n) => n.textContent)).toEqual(['Tinh bột', 'GlucoseX', 'Y'])
    expect(nut[0]!.hasAttribute('data-dau')).toBe(true)
    expect(nut[2]!.hasAttribute('data-cuoi')).toBe(true)
    expect(container.querySelectorAll('.lg-sd .mui')).toHaveLength(2)
    // nhận biết: thuốc thử tím, hiện tượng theo mã, nhóm chức thành nhãn
    expect(container.querySelector('.lg-nb .lg-hien')!.getAttribute('data-h')).toBe('quy-xanh')
    expect(container.querySelector('.lg-nb .lg-nhom')!.getAttribute('data-n')).toBe('nh2')
  })

  it('"Làm lại" có nhãn đọc màn hình và dựng lại ống (hoạt cảnh chạy lại)', () => {
    const { container } = render(<TraLoiThay ct={docCauTruc(MAY_CHU)!} />)
    const truoc = container.querySelector('.lg-tn')
    fireEvent.click(screen.getByRole('button', { name: 'Làm lại thí nghiệm' }))
    expect(container.querySelector('.lg-tn')).not.toBe(truoc)
    expect(container.querySelectorAll('.lg-tn')).toHaveLength(3)
  })

  it('câu trả lời cũ không có khối vẽ như trước; khối sai khuôn / mã hiện tượng lạ bị bỏ riêng', () => {
    const { container } = render(<TraLoiThay ct={docCauTruc({ yChinh: 'Em xem lại bước 2.', buoc: [], bang: null, ghiNho: '', hoiTiep: [] })!} />)
    expect(container.querySelector('.lg-k, .lg-bay')).toBeNull()
    expect(docKhoi({ thiNghiem: [{ thuoc: 'Quỳ', hien: 'no-tung', chu: 'x' }, 'rác'], soDo: { nut: [{ ten: 'A', nhan: '' }] }, phuongTrinh: [{ trai: [], phai: ['B'] }], tinh: { dong: [] }, bay: { chu: '' } })).toEqual({})
    expect(docCauTruc({ yChinh: '', buoc: [], nhanBiet: [{ thuoc: 'Quỳ', hien: 'quy-do', chu: 'đỏ', nhom: '–COOH' }] })).toMatchObject({ nhanBiet: [{ hien: 'quy-do' }] })
  })
})

describe('tô màu chữ', () => {
  it('++đúng++ xanh, !!sai!! đỏ gạch kèm chữ "(sai)" cho máy đọc; ion "NH4^+ + OH^-" giữ nguyên', () => {
    const { container } = render(<p className="lg-tl"><ChuTo text="Muối ++CH3COONa++, không phải !!C2H5COONa!!; NH4^+ + OH^- → NH3" /></p>)
    expect(container.querySelector('.lg-dung')!.textContent).toBe('CH3COONa')
    expect(container.querySelector('.lg-sai')!.textContent).toBe('(sai) C2H5COONa')
    expect(container.querySelector('.lg-sai .sr-only')).not.toBeNull()
    expect(container.querySelectorAll('.lg-dung, .lg-sai')).toHaveLength(2)
    expect(container.textContent).not.toMatch(/\+\+|!!/)
  })

  it('nhóm chức đứng riêng thành nhãn màu; công thức liền ("CH3NH2", "C6H5-NH2") không đổi', () => {
    const { container } = render(<p><ChuTo text="Nhóm –NH2, -CHO và –OH; –COOH khác –COO–. CH3NH2 và C6H5-NH2 giữ nguyên. **có –OH**" /></p>)
    expect([...container.querySelectorAll('.lg-nhom')].map((n) => `${n.getAttribute('data-n')}:${n.textContent}`)).toEqual(['nh2:–NH2', 'cho:–CHO', 'oh:–OH', 'coo:–COOH', 'coo:–COO–', 'oh:–OH'])
    expect(container.querySelector('strong .lg-nhom')).not.toBeNull()
    expect(container.textContent).toContain('CH3NH2 và C6H5-NH2 giữ nguyên.')
  })

  it('polymer "(C6H10O5)n" hạ chỉ số n; "(1)n", chữ thường trong ngoặc giữ nguyên; 4 ống nghiệm cùng một hàng', () => {
    const { container } = render(<p><ChuTo text="(C6H10O5)n + nH2O; (-CH2-CH2-)n. Ý (1)n và (abc)n giữ nguyên." /></p>)
    expect([...container.querySelectorAll('sub')].filter((x) => x.textContent === 'n')).toHaveLength(2)
    expect(container.textContent).toContain('(1)n và (abc)n giữ nguyên.')
    const ong = Array.from({ length: 4 }, (_x, i) => ({ nhan: `(${i + 1})`, thuoc: 'Nước', hien: 'tach-lop', chu: 'Tách lớp', phu: '' }))
    const r = render(<TraLoiThay ct={docCauTruc({ yChinh: 'Xem ống.', buoc: [], thiNghiem: ong })!} />)
    expect((r.container.querySelector('.lg-tn-hang') as HTMLElement).style.getPropertyValue('--so')).toBe('4')
  })
})
