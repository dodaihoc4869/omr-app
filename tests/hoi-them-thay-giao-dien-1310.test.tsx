// HỎI THẦY · giao diện (thầy 13/10): nhãn "Thầy Đỗ Đại Học" (thầy dặn: KHÔNG dùng chữ "trợ lý"), trần lượt, ngoài phạm vi;
// hai nút "Hỏi thầy" (⇒ hộp thoại hỏi Thầy nảy lên, có đề câu) và "Lời giải từng bước" (⇒ khung lời giải như cũ).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
import HoiThemThay from '../src/components/loi-giai/HoiThemThay'
import NutHoiThay from '../src/components/loi-giai/NutHoiThay'

type PhanHoi = Record<string, unknown>
let phanHoi: PhanHoi[] = []
let moCau: PhanHoi = { ok: false, error: 'chưa đặt' } // trả lời của /hs/hoi-thay
let choMoCau: Promise<void> | null = null // đặt ⇒ /hs/hoi-thay chờ tới khi lời hứa xong (giả máy chủ chậm)
const goi: { url: string; body: PhanHoi }[] = []
beforeEach(() => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tok-em' }))
  goi.length = 0
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    goi.push({ url, body: JSON.parse(String(init?.body ?? '{}')) })
    if (url.endsWith('/hs/hoi-thay') && choMoCau) await choMoCau
    const j = url.endsWith('/hs/hoi-tro-ly') ? (phanHoi.shift() ?? { ok: false, error: 'hết' }) : url.endsWith('/hs/hoi-thay') ? moCau : { ok: false }
    return new Response(JSON.stringify(j), { status: 200, headers: { 'content-type': 'application/json' } })
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); choMoCau = null })

const mo = () => fireEvent.click(screen.getByRole('button', { name: 'Em còn chỗ chưa hiểu? Nhắn hỏi Thầy' }))
const o = () => screen.getByLabelText('Chỗ em thắc mắc về câu này') as HTMLTextAreaElement

describe('ô hỏi thêm Thầy', () => {
  it('gửi câu hỏi ⇒ lời trả lời có nhãn "Thầy Đỗ Đại Học", đếm câu hỏi còn lại; không có chữ "trợ lý" ở đâu', async () => {
    phanHoi = [{ ok: true, traLoi: 'Ý b sai vì em nhầm chất.\nEm xem lại bước 2.', conLai: 19, ngoaiPhamVi: false }]
    const onTraLoi = vi.fn()
    const { container } = render(<HoiThemThay qid="DE-II-4" nguon="luyen_de" onTraLoi={onTraLoi} />)
    mo()
    expect(screen.getByRole('heading', { name: 'Hỏi thêm Thầy về câu này' })).toBeTruthy()
    fireEvent.change(o(), { target: { value: '  Vì sao ý b sai ạ?  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await screen.findByText('Thầy Đỗ Đại Học')
    expect(goi[0]!.url).toBe('https://may-thu/hs/hoi-tro-ly')
    expect(goi[0]!.body).toMatchObject({ token: 'tok-em', qid: 'DE-II-4', nguon: 'luyen_de', cauHoi: 'Vì sao ý b sai ạ?' })
    expect(screen.getByText('Vì sao ý b sai ạ?')).toBeTruthy()
    expect(container.textContent).toContain('Em xem lại bước 2.')
    expect(screen.getByText('Còn 19 câu hỏi hôm nay')).toBeTruthy()
    expect(onTraLoi).toHaveBeenCalledTimes(1)
    expect(o().value).toBe('')
    expect(container.textContent!.toLowerCase()).not.toContain('trợ lý')
    expect(screen.getByText('KIÊN TRÌ là vũ khí tối thượng để chiến thắng mọi thứ')).toBeTruthy() // thầy 13/10: thay dòng "Trả lời tự động…"
  })

  it('Enter gửi, Shift+Enter xuống dòng', async () => {
    phanHoi = [{ ok: true, traLoi: 'Được.', conLai: 5, ngoaiPhamVi: false }]
    render(<HoiThemThay qid="Q" nguon="on_lai" gon />)
    fireEvent.change(o(), { target: { value: 'Câu hỏi' } })
    fireEvent.keyDown(o(), { key: 'Enter', shiftKey: true })
    expect(goi).toHaveLength(0)
    fireEvent.keyDown(o(), { key: 'Enter' })
    await screen.findByText('Được.')
    expect(goi).toHaveLength(1)
  })

  it('hết lượt ⇒ báo đúng lời máy chủ, khoá ô nhập, trả lại chữ em vừa gõ, bỏ tin chưa gửi được', async () => {
    phanHoi = [{ ok: false, ma: 'het_luot', conLai: 0, error: 'Hôm nay em đã hỏi đủ 20 câu. Mai em hỏi tiếp nhé.' }]
    render(<HoiThemThay qid="Q" nguon="luyen" gon />)
    fireEvent.change(o(), { target: { value: 'Còn hỏi được không ạ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Hôm nay em đã hỏi đủ 20 câu. Mai em hỏi tiếp nhé.')
    expect(o().disabled).toBe(true)
    expect(o().value).toBe('Còn hỏi được không ạ')
    expect(screen.queryAllByText('Còn hỏi được không ạ').filter((x) => x.tagName === 'P')).toHaveLength(0)
  })

  it('câu ngoài phạm vi ⇒ hiện câu của máy chủ, KHÔNG tính là có trợ giúp', async () => {
    phanHoi = [{ ok: true, traLoi: 'Ở đây Thầy chỉ trả lời về câu em đang xem.', conLai: 18, ngoaiPhamVi: true }]
    const onTraLoi = vi.fn()
    render(<HoiThemThay qid="Q" nguon="dao" gon onTraLoi={onTraLoi} />)
    fireEvent.change(o(), { target: { value: 'Giải giúp em bài Lý' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await screen.findByText('Ở đây Thầy chỉ trả lời về câu em đang xem.')
    expect(onTraLoi).not.toHaveBeenCalled()
  })
})

describe('nút Hỏi thầy + Lời giải từng bước', () => {
  const cau = { qid: 'DE-I-1', so: 'Câu 1', nguon: 'DE', chuong: 'Ester', de: '<p>Đun nóng 8,8 gam ester X</p>', y: { A: '8,2 gam', B: '9,6 gam' } }
  const hoSo = { qid: 'DE-I-1', bam: 'b', dang: 'tn', ten: 'T', co: [] }

  it('hai nút; "Hỏi thầy" ⇒ hộp thoại "Hỏi Thầy" có đề câu + ô nhắn, KHÔNG mở lời giải từng bước; Esc đóng', async () => {
    moCau = { ok: true, coLoiGiai: true, cau, hoSo, hoiThem: true }
    render(<NutHoiThay qid="DE-I-1" nguon="luyen_de" />)
    expect(screen.getByRole('button', { name: 'Lời giải từng bước' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    const hop = await screen.findByRole('dialog', { name: 'Hỏi Thầy' })
    expect(hop.textContent).toContain('Câu 1 · Ester')
    expect(hop.textContent).toContain('Đun nóng 8,8 gam ester X')
    expect(hop.textContent).toContain('9,6 gam')
    expect(screen.getByLabelText('Chỗ em thắc mắc về câu này')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Em còn chỗ chưa hiểu? Nhắn hỏi Thầy' })).toBeNull() // trong hộp: mở sẵn ô nhắn
    expect(document.querySelector('iframe')).toBeNull()
    expect(goi.find((g) => g.url.endsWith('/hs/hoi-thay'))!.body).toEqual({ token: 'tok-em', qid: 'DE-I-1', nguon: 'luyen_de' })
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Hỏi Thầy' })).toBeNull())
  })

  it('TỐC ĐỘ (thầy 13/10): bấm "Hỏi thầy" ⇒ hộp nảy lên NGAY, đề đang tới; máy chủ trả xong mới hiện đề. Đóng hộp lúc chờ ⇒ không tự mở lại', async () => {
    moCau = { ok: true, coLoiGiai: true, cau: { ...cau, qid: 'DE-I-9' }, hoSo, hoiThem: true }
    let xong!: () => void
    choMoCau = new Promise<void>((r) => { xong = r })
    render(<NutHoiThay qid="DE-I-9" nguon="luyen_de" />)
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    const hop = await screen.findByRole('dialog', { name: 'Hỏi Thầy' })
    expect(hop.textContent).toContain('Đang mở đề câu')
    expect(hop.textContent).not.toContain('Đun nóng 8,8 gam ester X')
    expect(screen.getByLabelText('Chỗ em thắc mắc về câu này')).toBeTruthy() // gõ trước được
    xong()
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Hỏi Thầy' }).textContent).toContain('Đun nóng 8,8 gam ester X'))
    expect(screen.getByRole('dialog', { name: 'Hỏi Thầy' }).textContent).toContain('Câu 1 · Ester')
    // lần hai: mỗi lần bấm máy chủ đều được hỏi (kiểm chặn lại)
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    choMoCau = new Promise<void>((r) => { xong = r })
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    await screen.findByRole('dialog', { name: 'Hỏi Thầy' })
    expect(goi.filter((g) => g.url.endsWith('/hs/hoi-thay'))).toHaveLength(2)
    // đóng lúc máy chủ chưa trả ⇒ phản hồi tới muộn không mở lại hộp
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    xong()
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect((screen.getByRole('button', { name: 'Hỏi thầy' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('"Lời giải từng bước" ⇒ khung lời giải (iframe), không có hộp hỏi Thầy', async () => {
    moCau = { ok: true, coLoiGiai: true, cau, hoSo, hoiThem: true }
    render(<NutHoiThay qid="DE-I-1" nguon="on_lai" />)
    fireEvent.click(screen.getByRole('button', { name: 'Lời giải từng bước' }))
    await waitFor(() => expect(document.querySelector('iframe')).toBeTruthy())
    expect(screen.queryByRole('dialog', { name: 'Hỏi Thầy' })).toBeNull()
  })

  it('phần hỏi Thầy chưa bật cho em ⇒ "Hỏi thầy" mở lời giải như cũ (không nút chết)', async () => {
    moCau = { ok: true, coLoiGiai: true, cau, hoSo, hoiThem: false }
    render(<NutHoiThay qid="DE-I-1" nguon="game" />)
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    await waitFor(() => expect(document.querySelector('iframe')).toBeTruthy())
    expect(screen.queryByRole('dialog', { name: 'Hỏi Thầy' })).toBeNull()
  })

  it('em ĐANG LÀM: chỉ nút Hỏi thầy; xin đề không đáp án (chiHoi), hộp báo Thầy gợi hướng, câu hỏi gửi kèm dangLam', async () => {
    moCau = { ok: true, chiHoi: true, cau, hoiThem: true }
    phanHoi = [{ ok: true, traLoi: 'Em viết phương trình thuỷ phân trước.', conLai: 19, ngoaiPhamVi: false }]
    const onHoi = vi.fn()
    render(<NutHoiThay qid="DE-I-1" nguon="dao" dangLam onHoi={onHoi} />)
    expect(screen.queryByRole('button', { name: 'Lời giải từng bước' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    const hop = await screen.findByRole('dialog', { name: 'Hỏi Thầy' })
    expect(goi.find((g) => g.url.endsWith('/hs/hoi-thay'))!.body).toEqual({ token: 'tok-em', qid: 'DE-I-1', nguon: 'dao', chiHoi: true })
    expect(hop.textContent).toContain('Em đang làm câu này nên Thầy gợi hướng, chưa nói đáp án.')
    expect(screen.queryByRole('button', { name: 'Xem lời giải từng bước' })).toBeNull()
    fireEvent.change(o(), { target: { value: 'Câu này làm sao ạ?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await screen.findByText('Em viết phương trình thuỷ phân trước.')
    expect(goi.find((g) => g.url.endsWith('/hs/hoi-tro-ly'))!.body).toMatchObject({ qid: 'DE-I-1', nguon: 'dao', dangLam: true })
    expect(onHoi).toHaveBeenCalledTimes(1) // game: câu này "có trợ giúp"
  })

  it('em ĐANG LÀM mà phần hỏi Thầy chưa bật ⇒ nhắc làm xong, KHÔNG mở lời giải', async () => {
    moCau = { ok: true, chiHoi: true, cau, hoiThem: false }
    render(<NutHoiThay qid="DE-I-1" nguon="luyen" dangLam />)
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    await screen.findByText('Em làm xong câu này rồi bấm Hỏi thầy để xem lời giải nhé.')
    expect(document.querySelector('iframe')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('câu chưa có lời giải từng bước vẫn hỏi Thầy được; nút lời giải báo "đang soạn"', async () => {
    moCau = { ok: true, coLoiGiai: false, cau, loiGiaiChu: { dapAn: 'A', chot: 'x', tung: [], buoc: [], ketQua: '' }, hoiThem: true }
    render(<NutHoiThay qid="DE-I-1" nguon="btvn" />)
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
    expect(await screen.findByRole('dialog', { name: 'Hỏi Thầy' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lời giải từng bước' }))
    await screen.findByText(/Thầy đang soạn lời giải từng bước/)
  })
})
