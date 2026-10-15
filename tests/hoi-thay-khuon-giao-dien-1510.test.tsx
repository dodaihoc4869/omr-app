// HỎI THẦY v3 · giao diện KHUÔN (bản vẽ docs/ban-ve-hoi-thay-v3-1510, thầy chốt 15/10): Chỉ chỗ sai (so bài, dòng lệch) · Gợi ý từng nấc (em tự mở,
// khối gắn vào nấc, đáp án khoá) · Giải thích (thang dọc có ngưỡng, hình vẽ sẵn, đối chiếu gập) · Từng ý a–d (Em đúng x/4) · Tính từng bước (em thử,
// đúng mới mở bước sau); chung: Thầy hỏi lại 1 câu, "Em chưa hiểu chỗ nào?", "Giải thích dễ hơn"; câu trả lời cũ không có khuôn vẽ như v2.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
import TraLoiThay, { docCauTruc } from '../src/components/loi-giai/TraLoiThay'
import HoiThemThay from '../src/components/loi-giai/HoiThemThay'
import { docKhuon, thuDung } from '../src/components/loi-giai/KhuonTraLoi'

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear() })
const CO = { buoc: [], bang: null, ghiNho: '', hoiTiep: [] }
const ve = (o: Record<string, unknown>, onHoi?: (c: string) => void, dangLam = false) => render(<TraLoiThay ct={docCauTruc({ ...CO, ...o })!} onHoi={onHoi} dangLam={dangLam} />)

describe('năm khuôn', () => {
  it('Chỉ chỗ sai: nhãn khuôn; so bài — dòng trước lệch ✓, dòng lệch, dòng sau gạch; phần tính gập lại', () => {
    const { container } = ve({ khuon: 'cho-sai', yChinh: 'Em lấy nhầm muối.', soSanh: [{ em: 'n = 0,1 mol', dung: 'n = 0,1 mol', lech: false }, { em: 'C2H5COONa', dung: 'CH3COONa', lech: true }, { em: 'm = 9,6', dung: 'm = 8,2', lech: false }],
      phuongTrinh: [{ trai: ['CH3COOC2H5', 'NaOH'], phai: ['CH3COONa', 'C2H5OH'], mui: '→', dk: 't°', chinh: 'CH3COONa' }], bay: { tieuDe: 'Chỗ em nhầm', chu: 'Muối giữ gốc acid.' } })
    expect(container.querySelector('.lg-tl-the[data-khuon]')!.textContent).toBe('Chỉ chỗ sai')
    const dong = [...container.querySelectorAll('.lg-ss-dong')]
    expect(dong.map((d) => ['data-giong', 'data-lech', 'data-keo'].find((a) => d.hasAttribute(a)))).toEqual(['data-giong', 'data-lech', 'data-keo'])
    expect(dong[1]!.querySelector('.lg-ss-co')!.textContent).toBe('Chỗ lệch')
    expect(dong[1]!.querySelector('.em')!.textContent).toBe('Em làm: C2H5COONa')
    const gon = container.querySelector('details.lg-gon') as HTMLDetailsElement
    expect(gon.open).toBe(false)
    expect(gon.querySelector('summary')!.textContent).toBe('Xem phương trình và cách tính đầy đủ')
    expect(gon.querySelector('.lg-pt')).not.toBeNull()
    expect(container.querySelector('.lg-bay')).not.toBeNull()
  })

  it('Gợi ý từng nấc: nấc 1 mở sẵn, bấm mở nấc kế (khối thí nghiệm gắn vào nấc 2), hết nấc thì nút biến mất; đáp án khoá khi đang làm', () => {
    const { container } = ve({ khuon: 'goi-y', yChinh: 'Thầy gợi ý 3 nấc.', nac: [{ ten: 'Đọc hiện tượng', chu: 'Gợi ý một.', khoi: '' }, { ten: 'Hiện tượng → nhóm chức', chu: 'Gợi ý hai.', khoi: 'thiNghiem' }, { ten: 'Loại phương án', chu: 'Gợi ý ba.', khoi: '' }],
      thiNghiem: [{ nhan: 'X', thuoc: 'Quỳ tím', hien: 'quy-xanh', chu: 'Quỳ hoá xanh', phu: '' }] }, undefined, true)
    expect(container.querySelector('.lg-tl-the[data-khuon]')!.textContent).toBe('Gợi ý từng nấc')
    expect(screen.getByRole('status').textContent).toContain('Đã mở 1/3 gợi ý')
    expect(container.querySelectorAll('.lg-nac > li:not([data-cho]):not([data-khoa])')).toHaveLength(1)
    expect(container.querySelector('.lg-tn')).toBeNull() // khối thí nghiệm nằm ở nấc 2, chưa mở
    fireEvent.click(screen.getByRole('button', { name: /Mở gợi ý 2/ }))
    expect(screen.getByRole('status').textContent).toContain('Đã mở 2/3 gợi ý')
    expect(container.querySelector('.lg-nac .lg-tn')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Mở gợi ý 3 · Loại phương án/ }))
    expect(screen.queryByRole('button', { name: /Mở gợi ý/ })).toBeNull()
    expect(container.querySelector('.lg-nac > li[data-khoa]')!.textContent).toContain('Đáp án: nộp bài rồi bấm Lời giải từng bước để xem.')
  })

  it('Giải thích: thang dọc — chất em hỏi nổi, ngưỡng sau đúng chất; hình vẽ sẵn; đối chiếu gập', () => {
    const { container } = ve({ khuon: 'giai-thich', yChinh: 'Vì cặp e của N bị vòng kéo.', xepHang: { tieuChi: 'Tính base', chat: [{ ct: '(CH3)2NH', ten: 'dimethylamine' }, { ct: 'NH3', ten: '' }, { ct: 'C6H5NH2', ten: 'aniline' }], hoi: 2, nguong: { sau: 1, tren: 'quỳ hoá xanh', duoi: 'quỳ không đổi' } },
      hinhDung: 'cap-e-amine', doiChieu: { a: 'Methylamine', b: 'Aniline', dong: [{ tieuChi: 'Gốc gắn N', a: 'đẩy e', b: 'hút e' }] } })
    const hang = [...container.querySelectorAll('.lg-xh-nhom')]
    expect(hang.map((h) => h.querySelector('.lg-xh-hang .ct')!.textContent)).toEqual(['(CH3)2NH', 'NH3', 'C6H5NH2'])
    expect(hang[2]!.querySelector('[data-hoi]')!.textContent).toContain('aniline · chất em hỏi')
    expect(hang.map((h) => !!h.querySelector('.lg-xh-nguong'))).toEqual([false, true, false])
    expect(container.querySelector('.lg-hd > svg')!.getAttribute('aria-label')).toContain('Aniline')
    expect(container.querySelector('details.lg-gon summary')!.textContent).toBe('So sánh chi tiết Methylamine và Aniline')
  })

  it('Từng ý a–d: "Em đúng 2/4 ý", ý em sai nổi, nhãn Em / Đáp án; không biết bài em thì không có dòng tổng', () => {
    const y = [{ y: 'a', noi: 'Có 5 nhóm –OH.', em: 'D', dapAn: 'D', lyDo: 'Đúng vậy.' }, { y: 'b', noi: 'Bị khử.', em: 'D', dapAn: 'S', lyDo: 'Bị oxi hoá.' }, { y: 'c', noi: 'Hoà tan Cu(OH)2.', em: 'S', dapAn: 'D', lyDo: '' }, { y: 'd', noi: 'Disaccharide.', em: 'S', dapAn: 'S', lyDo: '' }]
    const { container } = ve({ khuon: 'tung-y', yChinh: 'Em sai ý b, c.', yDS: y })
    expect(container.querySelector('.lg-y4-tong')!.textContent).toBe('Em đúng 2/4 ý')
    expect([...container.querySelectorAll('.lg-y4 > li')].map((li) => li.hasAttribute('data-em-sai'))).toEqual([false, true, true, false])
    expect([...container.querySelectorAll('.lg-y4 > li')][1]!.querySelector('.lg-y4-nhan')!.textContent).toBe('Em: ĐúngĐáp án: Sai')
    cleanup()
    const r = ve({ khuon: 'tung-y', yChinh: 'x', yDS: y.map((x) => ({ ...x, em: '' })) })
    expect(r.container.querySelector('.lg-y4-tong')).toBeNull()
    expect(r.container.querySelector('.lg-y4 > li[data-em-sai]')).toBeNull()
  })

  it('Tính từng bước: bước sau và tính nhanh ẩn tới khi em thử đúng; sai có gợi ý; "0.16" = "0,16"', () => {
    const { container } = ve({ khuon: 'tinh', yChinh: 'Đi 3 bước.', buoc: [{ ten: 'Mol glucose', chu: 'n = 0,1 mol' }, { ten: 'Mol CO2', chu: 'n = 0,16 mol' }, { ten: 'Thể tích', chu: 'V = 3,97 L' }],
      buocThu: { buoc: 2, hoi: 'Mol CO2 thu được?', dap: '0,16', goiYSai: 'Nhân 2 rồi nhân 80%.' }, tinh: { dong: [{ nhan: 'V', phep: '0,16 × 24,79', kq: '3,97 L' }], dapSo: '3,97 L' } })
    expect(container.querySelectorAll('.lg-tl-buoc > li')).toHaveLength(2)
    expect(container.querySelector('.lg-tinh')).toBeNull()
    const o = screen.getByRole('textbox', { name: 'Kết quả em tính' })
    fireEvent.change(o, { target: { value: '0,2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(container.querySelector('.lg-thu-kq')!.textContent).toBe('Nhân 2 rồi nhân 80%.')
    fireEvent.change(o, { target: { value: '0.16' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(container.querySelectorAll('.lg-tl-buoc > li')).toHaveLength(3)
    expect(container.querySelector('.lg-tinh .cuoi')!.textContent).toContain('3,97 L')
    expect(container.querySelector('.lg-tl-buoc > li:nth-child(2) p')!.textContent).toBe('n = 0,16 mol')
    expect(container.querySelector('.lg-tl-buoc > li:nth-child(2) .lg-thu-kq[data-kq="dung"]')!.textContent).toBe('Em tính đúng: 0,16.') // em biết mình đúng
  })

  it('"Xem luôn bước n" bỏ qua phần thử', () => {
    const { container } = ve({ khuon: 'tinh', yChinh: 'x', buoc: [{ ten: 'A', chu: 'a' }, { ten: 'B', chu: 'b' }], buocThu: { buoc: 1, hoi: 'A?', dap: '1', goiYSai: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xem luôn bước 1' }))
    expect(container.querySelectorAll('.lg-tl-buoc > li')).toHaveLength(2)
    expect(container.querySelector('.lg-thu-kq[data-kq="dung"]')).toBeNull()
    expect(container.querySelector('.lg-thu')).toBeNull()
  })
})

describe('phần chung', () => {
  it('Thầy hỏi lại 1 câu: chọn sai ⇒ đỏ + gợi ý, chọn lại đúng ⇒ xanh + vì sao', () => {
    const { container } = ve({ khuon: 'giai-thich', yChinh: 'x', kiemLai: { hoi: 'Chất nào làm quỳ hoá xanh?', lua: ['Aniline', 'Ethylamine', 'Phenol'], dung: 1, vi: 'Gốc ethyl đẩy e.', goiYSai: 'Xem gốc gắn N.' } })
    const nut = [...container.querySelectorAll('.lg-kiem-lua button')]
    fireEvent.click(nut[0]!)
    expect(nut[0]!.getAttribute('data-chon')).toBe('sai')
    expect(container.querySelector('.lg-kiem-kq')!.textContent).toBe('Chưa đúng. Xem gốc gắn N.')
    fireEvent.click(nut[1]!)
    expect(nut[0]!.hasAttribute('data-chon')).toBe(false)
    expect(nut[1]!.getAttribute('data-chon')).toBe('dung')
    expect(nut[1]!.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.lg-kiem-kq')!.textContent).toBe('Đúng. Gốc ethyl đẩy e.')
  })

  it('"Em chưa hiểu chỗ nào?" chạm là hỏi đúng chỗ; có khuôn thì luôn có "Giải thích dễ hơn"; câu trả lời cũ (không khuôn) không có', () => {
    const hoi = vi.fn()
    ve({ khuon: 'cho-sai', yChinh: 'x', chuaHieu: ['Chỗ lệch', 'Vì sao M = 82?'], hoiTiep: ['Gọi tên ester?'] }, hoi)
    fireEvent.click(screen.getByRole('button', { name: 'Chỗ lệch' }))
    expect(hoi).toHaveBeenLastCalledWith('Em chưa hiểu: Chỗ lệch')
    expect([...document.querySelectorAll('.lg-tl-hoi button')].map((b) => b.textContent)).toEqual(['Gọi tên ester?', 'Giải thích dễ hơn'])
    cleanup()
    ve({ yChinh: 'Câu trả lời cũ.', hoiTiep: ['Hỏi tiếp?'] }, hoi)
    expect([...document.querySelectorAll('.lg-tl-hoi button')].map((b) => b.textContent)).toEqual(['Hỏi tiếp?'])
    expect(document.querySelector('.lg-tl-the[data-khuon], .lg-chua, .lg-kiem')).toBeNull()
  })

  it('kiểm khuôn: phần sai khuôn bị bỏ riêng; so số em thử chấp nhận dấu chấm/phẩy, lệch ≤ 1%', () => {
    expect(docKhuon({ khuon: 'la', soSanh: [{ em: 'a' }], nac: [{ chu: 'một' }], kiemLai: { hoi: 'x', lua: ['a', 'b'], dung: 1 }, buocThu: { buoc: 1, hoi: 'x', dap: 'abc' }, yDS: [{ y: 'a', dapAn: 'X' }] })).toEqual({})
    expect(thuDung('0.16', '0,16')).toBe(true)
    expect(thuDung(' 3,97 ', '3,9664')).toBe(true)
    expect(thuDung('4', '3,97')).toBe(true)
    expect(thuDung('4,1', '3,97')).toBe(false)
    expect(thuDung('', '0')).toBe(false)
  })

  it('bài em đã nộp đi kèm câu hỏi (Thầy so được bài em); đang làm thì KHÔNG gửi', async () => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tok' }))
    const goi: Record<string, unknown>[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_u: RequestInfo | URL, init?: RequestInit) => { goi.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify({ ok: true, traLoi: 'Được.', conLai: 30 }), { status: 200 }) })
    const { unmount } = render(<HoiThemThay qid="Q-1" nguon="bai_hang_ngay" hop dapAnEm="DDSS" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Em sai ý nào ạ?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await screen.findByText('Được.')
    expect(goi[0]).toMatchObject({ qid: 'Q-1', cauHoi: 'Em sai ý nào ạ?', dapAnEm: 'DDSS' })
    unmount()
    render(<HoiThemThay qid="Q-1" nguon="bai_hang_ngay" hop dangLam dapAnEm="DDSS" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Câu này làm sao ạ?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await screen.findByText('Được.')
    expect(goi[1]).toMatchObject({ dapAnEm: '', dangLam: true })
  })
})
