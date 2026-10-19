// @vitest-environment jsdom
// MÀN LÀM BÀI CỦA HỌC SINH 12/10D (thầy 12/10 duyệt bản vẽ dot13 "trùng tu lại giao diện làm bài … tối ưu tối đa cho màn hình dọc"; "Chốt build đẩy lên luôn đi").
// Khoá: Đúng–sai đủ 4 ý mới nộp · bàn phím số ≤ 4 kí tự (dấu phẩy, dấu trừ, phím máy tính) · giá trị gửi đúng định dạng cũ · phản hồi từng ý ·
// câu hướng dẫn hai nút · thanh trên "đã làm/M câu hôm nay" · xong chặng. Phép thuần ở src/components/hoc-tap/lam-bai.ts.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ManLamBaiTap, { nopDuoc } from '../src/components/hoc-tap/ManLamBaiTap'
import { docSanh, goiHoa2 } from '../src/components/hoa2/api'
import { chuDanhSachCau, chuThoiGian, nhanPhim, phimCoTacDung, phimTuBanPhim, soChangXong, soHomNay, soSanhDungSai, type SoHomNay } from '../src/components/hoc-tap/lam-bai'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Tính acid của hydroxide', mucDo: 'hieu', sao: 0, kienThuc: [] }
const DS = { ...nen, qid: 'ds1', phan: 'II' as const, text: 'Xét dãy hydroxide chu kì 2.', choices: [], ideas: ['Tính base giảm dần.', 'Tính acid tăng dần.', 'HNO3 acid mạnh nhất.', 'H3BO3 mạnh hơn H2CO3.'] }
const TN = { ...nen, qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }
const TLN = { ...nen, qid: 'tl1', phan: 'III' as const, text: 'Giá trị của V là bao nhiêu?', choices: [], ideas: [] }
const HN: SoHomNay = { daLam: 6, muc: 24, chang: 2, soChang: 4 }
const moMan = (cau: object[], them: Record<string, unknown> = {}, homNay: SoHomNay | null = HN) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: cau, ...them })
  const onCapNhat = vi.fn(), onChua = vi.fn()
  const r = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={onCapNhat} onChua={onChua} homNay={homNay} />)
  return { ...r, onCapNhat, onChua }
}
const y = (chu: string) => within(screen.getByRole('group', { name: `Chọn cho ý ${chu}` }))

describe('phép thuần', () => {
  it('bàn phím số: tối đa 4 kí tự, một dấu phẩy, dấu trừ bật/tắt ở đầu, xoá một / xoá hết', () => {
    let v = ''
    for (const p of ['1', ',', '2', '5', '7'] as const) v = nhanPhim(v, p)
    expect(v).toBe('1,25') // phím thứ 5 không vào
    expect(phimCoTacDung(v, '7')).toBe(false)
    expect(nhanPhim('1,2', ',')).toBe('1,2') // không hai dấu phẩy
    expect(nhanPhim('12', '-')).toBe('-12'); expect(nhanPhim('-12', '-')).toBe('12')
    expect(nhanPhim('1,25', '-')).toBe('1,25') // thêm dấu sẽ vượt 4 kí tự
    expect(nhanPhim('-0,5', 'xoa')).toBe('-0,'); expect(nhanPhim('-0,5', 'xoa-het')).toBe('')
    expect(nhanPhim('', '-')).toBe('-')
    expect(['5', ',', '.', '-', '−', 'Backspace', 'Delete', 'a', 'Enter'].map(phimTuBanPhim)).toEqual(['5', ',', ',', '-', '-', 'xoa', 'xoa-het', null, null])
    // "-" hay "," trơn chưa phải đáp án
    expect(nopDuoc('III', '-')).toBe(false); expect(nopDuoc('III', ',')).toBe(false); expect(nopDuoc('III', '-0,5')).toBe(true)
  })
  it('số hôm nay cùng nguồn vòng tròn Hôm nay; thiếu số ⇒ null (không bịa)', () => {
    const ht = docSanh({ cheDo2: true, theLuc: { con: 18, tong: 24 }, hanhTrinh: { tang: 1, toiThieu: 24, daLam: 6, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 2, cauTrongChang: 6 } })
    expect(soHomNay(ht)).toEqual({ daLam: 6, muc: 24, chang: 2, soChang: 4 })
    const goi7 = { bat: true, ngay: '2026-10-12', toiThieu: 24, daLamHomNay: 13, tuLamCon: 9, tiepCanCon: 2, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, goi: [{ id: 'g', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-16', tong: 40, daGap: 10, con: 30, quota: 6, gapHomNay: 2, quaHan: false, canBoSung: 0, to: ['de-8'] }], diemDaDo: [] }
    expect(soHomNay(docSanh({ cheDo2: true, theLuc: { con: 11, tong: 24 }, goi7 }))).toEqual({ daLam: 13, muc: 24, chang: 3, soChang: 4 })
    expect(soHomNay(null)).toBeNull(); expect(soHomNay({ cheDo2: false })).toBeNull()
    expect(soHomNay(null, { daLam: 3, mucTieu: 0 })).toBeNull()
    expect(soChangXong({ daLam: 12, muc: 24, chang: 3, soChang: 4 })).toBe(2)
  })
  it('chữ phản hồi', () => {
    expect(chuDanhSachCau([2])).toBe('Câu 2'); expect(chuDanhSachCau([2, 4])).toBe('Câu 2 và 4'); expect(chuDanhSachCau([1, 2, 4])).toBe('Câu 1, 2 và 4')
    expect(chuThoiGian(41_200)).toBe('Làm trong 41 giây'); expect(chuThoiGian(65_000)).toBe('Làm trong 1 phút 05 giây'); expect(chuThoiGian(undefined)).toBe('')
    expect(soSanhDungSai('DDDD', 'DDDS').map((x) => x.dung)).toEqual([true, true, true, false])
  })
})

describe('màn làm bài', () => {
  it('thanh trên: "Chặng 2 · Câu 1/2", vạch từng câu, "6/24 câu hôm nay"; số tự cập nhật sau khi nộp, chặng giữ nguyên', async () => {
    const { rerender } = moMan([TN, TLN])
    await screen.findByText(TN.text)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chặng 2 · Câu 1/2')
    expect(screen.getByText('6/24')).toBeTruthy(); expect(screen.getByText('câu hôm nay')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'đang làm câu 1, câu 2 chưa làm' })).toBeTruthy()
    rerender(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 12, muc: 24, chang: 3, soChang: 4 }} />)
    expect(screen.getByText('12/24')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chặng 2 · Câu 1/2') // chặng chốt lúc mở
  })
  it('thiếu số hôm nay ⇒ ẩn ô số và tiêu đề không ghi chặng', async () => {
    moMan([TN], {}, null)
    await screen.findByText(TN.text)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Câu 1/1')
    expect(screen.queryByText('câu hôm nay')).toBeNull()
  })
  it('Đúng–sai: chọn đủ 4 ý mới nộp; gửi "DDDD" đúng định dạng cũ; phản hồi từng ý + giải thích ý sai mở sẵn', async () => {
    const { onCapNhat } = moMan([DS])
    await screen.findByText(DS.text)
    const nut = () => screen.getByRole('button', { name: /^Còn \d ý chưa chọn$|^Nộp câu$/ })
    expect(nut().textContent).toBe('Còn 4 ý chưa chọn'); expect((nut() as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('region', { name: 'Ý a' }).getAttribute('data-noi')).toBe('true') // ý đầu chưa chọn có viền nổi
    fireEvent.click(y('a').getByRole('button', { name: 'Đúng' })); fireEvent.click(y('b').getByRole('button', { name: 'Đúng' })); fireEvent.click(y('c').getByRole('button', { name: 'Đúng' }))
    expect(y('a').getByRole('button', { name: 'Đúng' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('img', { name: 'Đã chọn 3 trên 4 ý' }).textContent).toBe('a · Đb · Đc · Đd')
    expect(nut().textContent).toBe('Còn 1 ý chưa chọn'); expect((nut() as HTMLButtonElement).disabled).toBe(true)
    expect(localStorage.getItem('hoc-tap:nhap:s1:ds1:v1')).toBe('DDD-') // nháp cũ: ý chưa chọn là "-"
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: false, answer: 'DDDS', solution: { chot: 'Tính phi kim tăng dần trong chu kì.', tung_y: { a: { dung: true, vi_sao: 'Đúng.' }, b: { dung: true, vi_sao: 'Đúng.' }, c: { dung: true, vi_sao: 'Đúng.' }, d: { dung: false, vi_sao: 'B đứng trước C nên tính acid H3BO3 yếu hơn H2CO3.' } } } })
    fireEvent.click(y('d').getByRole('button', { name: 'Đúng' }))
    expect(nut().textContent).toBe('Nộp câu'); fireEvent.click(nut())
    await screen.findByText('Đúng 3/4 ý · sai ý d')
    expect(goiHoa2).toHaveBeenLastCalledWith('answer', 'tk', expect.objectContaining({ session: 'p1', qid: 'ds1', answer: 'DDDD', assisted: false, msLam: expect.any(Number) }), 15)
    expect(screen.getByText(/câu này vào lịch ôn 1 · 3 · 7 ngày/)).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Ý d, sai' })).getByText('Em chọn Đúng · đáp án Sai')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Ý a, đúng' })).getByText('Em chọn Đúng · đáp án Đúng')).toBeTruthy()
    expect(screen.getByText(/B đứng trước C nên tính acid/)).toBeTruthy() // giải thích ý sai mở sẵn (công thức tách thẻ sub)
    fireEvent.click(screen.getByRole('button', { name: 'Xem lời giải đầy đủ cả 4 ý' }))
    expect(screen.getByText('Tính phi kim tăng dần trong chu kì.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sửa câu này' })).toBeTruthy(); expect(onCapNhat).toHaveBeenCalledOnce()
  })
  it('Trả lời ngắn: 4 ô + bàn phím số riêng, KHÔNG có ô nhập (không bật bàn phím điện thoại); phím máy tính vẫn nhập; gửi "-1,5"', async () => {
    moMan([TLN])
    await screen.findByText(TLN.text)
    expect(screen.queryByRole('textbox')).toBeNull(); expect(document.querySelector('input')).toBeNull()
    const phim = within(screen.getByRole('group', { name: 'Bàn phím số' }))
    expect(screen.getByRole('button', { name: 'Nhập đáp án để nộp' }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(phim.getByRole('button', { name: '1' })); fireEvent.click(phim.getByRole('button', { name: 'Dấu phẩy' })); fireEvent.click(phim.getByRole('button', { name: '5' }))
    fireEvent.click(phim.getByRole('button', { name: 'Dấu trừ' }))
    expect(screen.getByText('Đáp án của em: −1,5')).toBeTruthy()
    expect((phim.getByRole('button', { name: '7' }) as HTMLButtonElement).disabled).toBe(true) // đủ 4 kí tự
    fireEvent.keyDown(window, { key: '9' }); expect(localStorage.getItem('hoc-tap:nhap:s1:tl1:v1')).toBe('-1,5')
    fireEvent.keyDown(window, { key: 'Backspace' }); fireEvent.keyDown(window, { key: '.' }); expect(localStorage.getItem('hoc-tap:nhap:s1:tl1:v1')).toBe('-1,')
    fireEvent.keyDown(window, { key: '5' })
    fireEvent.click(phim.getByRole('button', { name: 'Xoá một kí tự' })); fireEvent.keyDown(window, { key: '5' })
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: '-1,5', solution: { chot: 'Bảo toàn nguyên tố N.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · −1,5' }))
    await screen.findByText('Đúng · tự làm')
    expect(goiHoa2).toHaveBeenLastCalledWith('answer', 'tk', expect.objectContaining({ answer: '-1,5' }), 15)
    fireEvent.click(phim.queryByRole('button', { name: '1' }) ?? document.body) // bàn phím đã thu sau khi nộp
    expect(screen.queryByRole('group', { name: 'Bàn phím số' })).toBeNull()
    expect(screen.getByText('Bảo toàn nguyên tố N.')).toBeTruthy()
  })
  it('Trắc nghiệm: 4 ô role=radio, "Nộp câu · đã chọn B"; sau khi nộp đánh dấu ô em chọn / đáp án', async () => {
    moMan([TN])
    await screen.findByText(TN.text)
    const nhom = within(screen.getByRole('radiogroup', { name: 'Chọn một đáp án' }))
    expect(nhom.getAllByRole('radio')).toHaveLength(4)
    fireEvent.click(nhom.getByRole('radio', { name: /\(CH3\)2NH/ }))
    expect(nhom.getByRole('radio', { name: /\(CH3\)2NH/ }).getAttribute('aria-checked')).toBe('true')
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: 'N liên kết với 2 gốc hydrocarbon.' })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await screen.findByText('Đúng · tự làm')
    expect(screen.getByText('Em chọn · đáp án')).toBeTruthy()
    expect(screen.getByText('N liên kết với 2 gốc hydrocarbon.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Sửa câu này' })).toBeNull()
    expect(screen.getByRole('button', { name: /Kết thúc chặng/ })).toBeTruthy()
  })
  it('câu Gói 7 có hướng dẫn: chip "Câu mới · <tên bài>", thẻ chọn cách, hai nút; "Tự làm câu này" mở khu trả lời', async () => {
    const goi7 = { bat: true, ngay: '2026-10-12', toiThieu: 24, daLamHomNay: 12, tuLamCon: 9, tiepCanCon: 3, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, goi: [{ id: 'g', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-16', tong: 40, daGap: 10, con: 30, quota: 6, gapHomNay: 2, quaHan: false, canBoSung: 0, to: ['de-8'] }], diemDaDo: [] }
    moMan([{ ...TLN, vaiGoi7: 'moi', huongDan7: true, coGoi7: true }], { goi7 })
    await screen.findByText(TLN.text)
    expect(screen.getByText('Câu mới · Bài 8. Amine')).toBeTruthy()
    expect(screen.getByText('Câu này em chọn làm thế nào?')).toBeTruthy()
    // Đợt 18 (làn H): bỏ dòng giải thích "Cách nào cũng được tính vào … Thầy xem riêng …"; mỗi cách còn MỘT dòng ngắn nói cách tính.
    expect(screen.queryByText(/Cách nào cũng được tính vào/)).toBeNull()
    expect(screen.getByText(/tính là câu tự làm/)).toBeTruthy(); expect(screen.getByText(/tính là có hỗ trợ/)).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Bàn phím số' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Học cách giải' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tự làm câu này' }))
    expect(screen.getByRole('group', { name: 'Bàn phím số' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chưa làm được? Học cách giải' })).toBeTruthy()
  })
  it('không có số hôm nay ⇒ thẻ chọn cách không hứa "tính vào M câu"', async () => {
    moMan([{ ...TN, vaiGoi7: 'tiep_can', huongDan7: true }], {}, null)
    await screen.findByText(TN.text)
    expect(screen.getByText('Câu này em chọn làm thế nào?')).toBeTruthy()
    expect(screen.queryByText(/Cách nào cũng được tính vào/)).toBeNull()
  })
  it('gợi ý: nút bóng đèn mở khối gợi ý; giữ dòng ngắn "Câu có gợi ý: tính là có hỗ trợ."; gửi assisted', async () => {
    moMan([{ ...TN, goiY: { cotLoi: 'Bậc amine = số gốc hydrocarbon gắn vào N.' } }])
    await screen.findByText(TN.text)
    expect(screen.getByText('Câu có gợi ý: tính là có hỗ trợ.')).toBeTruthy()
    expect(screen.queryByText('Bậc amine = số gốc hydrocarbon gắn vào N.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Xem gợi ý' }))
    expect(screen.getByText('Bậc amine = số gốc hydrocarbon gắn vào N.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thu gọn gợi ý' }).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await screen.findByText('Đúng · có gợi ý')
    expect(goiHoa2).toHaveBeenLastCalledWith('answer', 'tk', expect.objectContaining({ assisted: true }), 15)
  })
  it('xong chặng: "Đã lưu chặng 2", số câu tự làm đúng, câu sai vào lịch ôn, thẻ Hôm nay + nút học tiếp / nghỉ', async () => {
    const { rerender, onCapNhat } = moMan([TN, DS])
    await screen.findByText(TN.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await screen.findByText(DS.text)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chặng 2 · Câu 2/2')
    for (const c of ['a', 'b', 'c', 'd']) fireEvent.click(y(c).getByRole('button', { name: 'Sai' }))
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: false, answer: 'DDDS', solution: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu' }))
    fireEvent.click(await screen.findByRole('button', { name: /Kết thúc chặng/ }))
    rerender(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={onCapNhat} onChua={vi.fn()} homNay={{ daLam: 8, muc: 24, chang: 2, soChang: 4 }} />)
    expect(screen.getByRole('heading', { name: 'Đã lưu chặng 2' })).toBeTruthy()
    expect(screen.getByText(/câu tự làm đúng/).textContent).toBe('1/2 câu tự làm đúng')
    expect(screen.getByText('Câu 2 đã vào lịch ôn 1 · 3 · 7 ngày.')).toBeTruthy()
    expect(screen.getByText('Hôm nay 8/24 câu')).toBeTruthy(); expect(screen.getByText('còn 16 câu · 3 chặng')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Xong 1 trên 4 chặng' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Học tiếp chặng 3/ })).toBeTruthy(); expect(screen.getByRole('button', { name: 'Nghỉ và về Hôm nay' })).toBeTruthy()
    await waitFor(() => expect(onCapNhat).toHaveBeenCalledTimes(3)) // 2 câu + xong chặng
  })
})
