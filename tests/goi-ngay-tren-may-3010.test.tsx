// @vitest-environment jsdom
// GÓI BÀI CẢ NGÀY TRÊN MÁY EM (thầy 29/10 22:05 «tìm mọi cách, cách khác hoàn toàn để app hs load tức thì ở mọi thời điểm, kể cả giờ cao điểm»).
// Khoá:
//   · kho gói: lưu gói máy chủ trả; chặng kế = chặng đầu còn câu máy này chưa làm; khác ngày ⇒ không dùng; máy chủ «tat» ⇒ nhớ, không hỏi lại;
//   · màn làm bài có gói ⇒ câu hiện NGAY (máy chủ chưa trả gì), KHÔNG gọi `hoc-tap-start`; «Kiểm tra» trước khi phiên về ⇒ đợi phiên, nộp đúng mã phiên + tem MỚI;
//   · máy chủ từ chối gói ⇒ bỏ gói, đường mở chặng cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { batGoiNgay, batMoChangTruoc, docChangDangLam, ghiCauXong, layChangGoi, moChangTruoc, napGoiNgay } from '../src/components/hoc-tap/mo-chang-truoc'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
beforeEach(() => { localStorage.clear(); batMoChangTruoc(true); batGoiNgay(true) })
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); batMoChangTruoc(false); batGoiNgay(false) })

const homNayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [] }
const TN = { ...nen, qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [], sk: 'tem-dai-1' }
const TN2 = { ...TN, qid: 'tn2', text: 'Chất nào là amine bậc ba?', sk: 'tem-dai-2' }
const TN3 = { ...TN, qid: 'tn3', text: 'Chất nào là amine thơm?', sk: 'tem-dai-3' }
const G7 = { bat: true, ngay: homNayVn(), goi: [], tuLamCon: 2, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, kienThucCu: [], daLamHomNay: 0, toiThieu: 24 }
const goiMau = () => ({ ok: true, sbd: 's1', ngay: homNayVn(), luc: Date.now(), goi7: G7, chang: [{ ve: 've-1', questions: [TN, TN2] }, { ve: 've-2', questions: [TN3] }] })
const lenh = (ten: string) => vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === ten)

describe('kho gói cả ngày', () => {
  it('lưu gói; chặng kế bỏ câu đã làm, ghép qua ranh chặng của gói cho đủ số câu; khác ngày ⇒ không dùng', async () => {
    const goi = vi.fn(async () => goiMau())
    await napGoiNgay('tk', goi)
    expect(goi).toHaveBeenCalledWith('hoc-tap-goi-ngay', 'tk', {}, 60)
    expect(layChangGoi('s1')).toMatchObject({ ves: ['ve-1', 've-2'] })
    expect(layChangGoi('s1', Date.now(), 2)).toMatchObject({ ves: ['ve-1'] }) // chặng 2 câu: chỉ chặng đầu của gói góp câu
    expect(layChangGoi('khac')).toBeNull() // gói gắn em
    ghiCauXong('s1', 'tn1')
    expect(layChangGoi('s1', Date.now(), 2)?.questions.map((q) => q.qid)).toEqual(['tn2', 'tn3'])
    ghiCauXong('s1', 'tn2')
    expect(layChangGoi('s1')).toMatchObject({ ves: ['ve-2'] })
    expect(layChangGoi('s1', Date.now() + 86_400_000)).toBeNull() // sang ngày khác
  })
  it('đã có chặng trong gói ⇒ Lộ trình KHÔNG mở trước bằng hoc-tap-start', async () => {
    await napGoiNgay('tk', vi.fn(async () => goiMau()))
    const goi = vi.fn(async () => ({ ok: true }))
    moChangTruoc('tk', goi)
    expect(goi).not.toHaveBeenCalled()
  })
  it('máy chủ «tat» ⇒ nhớ, không hỏi lại; không có gói', async () => {
    const goi = vi.fn(async () => ({ ok: true, tat: true, sbd: 's1' }))
    await napGoiNgay('tk', goi)
    await napGoiNgay('tk', goi, Date.now(), true)
    expect(goi).toHaveBeenCalledTimes(1)
    expect(layChangGoi('s1')).toBeNull()
  })
  it('lượt lập lỗi mạng ⇒ không ném, không có gói', async () => {
    await expect(napGoiNgay('tk', vi.fn(async () => { throw new Error('mất mạng') }))).resolves.toBeUndefined()
    expect(layChangGoi('s1')).toBeNull()
  })
})

describe('màn làm bài mở chặng từ gói', () => {
  it('câu hiện NGAY khi máy chủ chưa trả gì; «Kiểm tra» đợi phiên rồi nộp đúng mã phiên + tem mới', async () => {
    await napGoiNgay('tk', vi.fn(async () => goiMau()))
    let moXong!: (v: Record<string, unknown>) => void
    vi.mocked(goiHoa2).mockImplementation(async (ten) => {
      if (ten === 'hoc-tap-mo-goi') return new Promise((r) => { moXong = r })
      if (ten === 'answer') return { ok: true, correct: true, answer: 'B', solution: '' }
      return { ok: true }
    })
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 24, chang: 1, soChang: 4 }} />)
    await screen.findByText(TN.text) // phiên chưa về mà câu đã hiện
    expect(lenh('hoc-tap-start')).toHaveLength(0)
    const mo = lenh('hoc-tap-mo-goi')
    expect(mo).toHaveLength(1)
    expect(mo[0]![2]).toEqual({ ves: ['ve-1', 've-2'], qids: ['tn1', 'tn2', 'tn3'], sk: { tn1: 'tem-dai-1', tn2: 'tem-dai-2', tn3: 'tem-dai-3' } })
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await new Promise((r) => setTimeout(r, 20))
    expect(lenh('answer')).toHaveLength(0) // chưa có phiên ⇒ đợi
    moXong({ ok: true, id: 'phien-goi', qids: ['tn1', 'tn2', 'tn3'], sk: { tn1: 'tem-moi-1', tn2: 'tem-moi-2' }, daLam: 0 })
    await waitFor(() => expect(lenh('answer')).toHaveLength(1))
    expect(lenh('answer')[0]![2]).toMatchObject({ session: 'phien-goi', qid: 'tn1', answer: 'B', sk: 'tem-moi-1' })
    await waitFor(() => expect(layChangGoi('s1')?.questions.map((q) => q.qid)).toEqual(['tn2', 'tn3'])) // câu vừa làm không vào chặng kế
  })
  it('máy chủ bỏ câu em đã làm (máy khác) ⇒ màn bỏ câu ấy', async () => {
    await napGoiNgay('tk', vi.fn(async () => goiMau()))
    vi.mocked(goiHoa2).mockImplementation(async (ten) => ten === 'hoc-tap-mo-goi' ? { ok: true, id: 'p', qids: ['tn2'], sk: {} } : { ok: true })
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
    await screen.findByText(TN2.text)
    await waitFor(() => expect(screen.queryByText(TN.text)).toBeNull())
  })
  it('máy chủ từ chối gói ⇒ bỏ gói, mở chặng đường cũ', async () => {
    await napGoiNgay('tk', vi.fn(async () => goiMau()))
    const CU = { ...TN, qid: 'cu1', text: 'Câu của đường cũ?', sk: undefined }
    vi.mocked(goiHoa2).mockImplementation(async (ten) => ten === 'hoc-tap-mo-goi' ? { ok: false, ma: 'GOI_CU' } : ten === 'hoc-tap-start' ? { ok: true, id: 'p-cu', questions: [CU] } : { ok: true })
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
    await screen.findByText(CU.text)
    expect(lenh('hoc-tap-start')).toHaveLength(1)
    expect(layChangGoi('s1')).toBeNull()
  })
  it('không có gói ⇒ đúng đường cũ, không gọi lệnh gói', async () => {
    vi.mocked(goiHoa2).mockImplementation(async (ten) => ten === 'hoc-tap-start' ? { ok: true, id: 'p1', questions: [TN] } : { ok: true })
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
    await screen.findByText(TN.text)
    expect(lenh('hoc-tap-start')).toHaveLength(1)
    expect(lenh('hoc-tap-mo-goi')).toHaveLength(0)
  })
  it('thoát app bất thình lình giữa chặng ⇒ mở lại nạp tức thì 0ms đúng câu đang làm dở, đúng tiến độ và nháp; kết thúc chặng thì xoá bản lưu', async () => {
    await napGoiNgay('tk', vi.fn(async () => goiMau()))
    vi.mocked(goiHoa2).mockImplementation(async (ten) => {
      if (ten === 'hoc-tap-mo-goi') return { ok: true, id: 'phien-dang-do', qids: ['tn1', 'tn2', 'tn3'], sk: { tn1: 'tem-1', tn2: 'tem-2', tn3: 'tem-3' }, daLam: 0 }
      if (ten === 'answer') return { ok: true, correct: true, answer: 'B', solution: 'Giải thích chuẩn' }
      return { ok: true }
    })
    const { unmount } = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 24, chang: 1, soChang: 4 }} />)
    await screen.findByText(TN.text)
    // Làm xong Câu 1/3
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await screen.findByRole('button', { name: /Câu tiếp theo/ })
    fireEvent.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))
    await screen.findByText(TN2.text)
    expect(screen.getByText(/Câu 2\/3/)).toBeTruthy()
    // Đang ở Câu 2/3, chọn đáp án nháp C rồi thoát bất thình lình
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)3N/ }))
    expect(screen.getByRole('button', { name: 'Nộp câu · đã chọn C' })).toBeTruthy()
    unmount()
    expect(docChangDangLam('s1')).toMatchObject({ phien: 'phien-dang-do', viTri: 1, tra: 'C' })

    // Mở lại app: hiện TỨC THÌ 0ms đúng Câu 2/3 kèm nháp C và tiến độ Câu 1 đã đúng, không gọi lại hoc-tap-start hay hoc-tap-mo-goi
    vi.mocked(goiHoa2).mockClear()
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 1, muc: 24, chang: 1, soChang: 4 }} />)
    expect(screen.getByText(TN2.text)).toBeTruthy()
    expect(screen.getByText(/Câu 2\/3/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nộp câu · đã chọn C' })).toBeTruthy()
    expect(lenh('hoc-tap-start')).toHaveLength(0)
    expect(lenh('hoc-tap-mo-goi')).toHaveLength(0)

    // Làm nốt Câu 2 và Câu 3 rồi Kết thúc chặng ⇒ bản lưu chặng dở được xoá sạch
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn C' }))
    await screen.findByRole('button', { name: /Câu tiếp theo/ })
    fireEvent.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))
    await screen.findByText(TN3.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    const nutKet = await screen.findByRole('button', { name: /Kết thúc chặng/ })
    fireEvent.click(nutKet)
    expect(docChangDangLam('s1')).toBeNull()
  })
  it('làm vài câu trong chặng (kể cả khi gói thiếu goi7) rồi thoát ra Lộ trình ⇒ đồng bộ tức thì số câu đã làm của chặng thông qua onVa và bản lưu chặng dở', async () => {
    await napGoiNgay('tk', vi.fn(async () => ({ ...goiMau(), goi7: undefined })))
    vi.mocked(goiHoa2).mockImplementation(async (ten) => {
      if (ten === 'hoc-tap-mo-goi') return { ok: true, id: 'phien-sync', qids: ['tn1', 'tn2', 'tn3'], sk: { tn1: 'tem-1', tn2: 'tem-2', tn3: 'tem-3' }, daLam: 0 }
      if (ten === 'answer') return { ok: true, correct: true, answer: 'B', solution: '' }
      return { ok: true }
    })
    let kqSanh = {
      cheDo2: true as const,
      sanh: {
        ngay: homNayVn(),
        goi7: { ...G7, daLamHomNay: 0, tuLamCon: 18, tiepCanCon: 6 },
        hanhTrinh: { tang: 1, toiThieu: 24, daLam: 0, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 1, cauTrongChang: 0 },
        chienDich: null,
        theLuc: { con: 24, tong: 24 },
        huyetChien: false,
        doan: { con: 0 },
        dao: { con: 0 },
        khoaDao: false,
        loiKhoaDao: '',
        ruong: { daLam: 0, tong: 24, moDuoc: false, daMo: false, qua: null },
        bia: null,
        tamGiuCa: 0,
        thuSucThem: { duoc: false, soCau: 0 },
      },
    }
    const onVa = vi.fn((f: (k: typeof kqSanh) => typeof kqSanh) => { kqSanh = f(kqSanh) })
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} onVa={onVa as never} homNay={{ daLam: 0, muc: 24, chang: 1, soChang: 4 }} />)
    await screen.findByText(TN.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await screen.findByRole('button', { name: /Câu tiếp theo/ })
    expect(onVa).toHaveBeenCalled()
    expect(kqSanh.sanh.goi7.daLamHomNay).toBe(1)
    expect(kqSanh.sanh.hanhTrinh.daLam).toBe(1)
    expect(kqSanh.sanh.theLuc.con).toBe(23)
  })
  it('khôi phục chặng đang dở khi homNay.daLam đã gồm câu đã nộp (kể cả khi d0 lưu lúc đầu là -1) ⇒ không bao giờ cộng đúp và chỉ xoá chặng dở khi mở màn báo hoàn thành chặng', async () => {
    await napGoiNgay('tk', vi.fn(async () => ({ ...goiMau(), goi7: undefined })))
    vi.mocked(goiHoa2).mockImplementation(async (ten) => {
      if (ten === 'hoc-tap-mo-goi') return { ok: true, id: 'phien-k-dup', qids: ['tn1', 'tn2', 'tn3'], sk: { tn1: 'tem-1', tn2: 'tem-2', tn3: 'tem-3' }, daLam: 0 }
      if (ten === 'answer') return { ok: true, correct: true, answer: 'B', solution: '' }
      return { ok: true }
    })
    let kqSanh = {
      cheDo2: true as const,
      sanh: {
        ngay: homNayVn(),
        goi7: { ...G7, daLamHomNay: 0, tuLamCon: 18, tiepCanCon: 6 },
        hanhTrinh: { tang: 1, toiThieu: 24, daLam: 0, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 1, cauTrongChang: 0 },
        chienDich: null,
        theLuc: { con: 24, tong: 24 },
        huyetChien: false,
        doan: { con: 0 },
        dao: { con: 0 },
        khoaDao: false,
        loiKhoaDao: '',
        ruong: { daLam: 0, tong: 24, moDuoc: false, daMo: false, qua: null },
        bia: null,
        tamGiuCa: 0,
        thuSucThem: { duoc: false, soCau: 0 },
      },
    }
    const onVa = vi.fn((f: (k: typeof kqSanh) => typeof kqSanh) => { kqSanh = f(kqSanh) })
    // Mở chặng 1 với homNay = null lúc đầu (giả lập d0 = -1), nộp Câu 1 và chọn nháp Câu 2 (chưa nộp) rồi thoát
    const { unmount } = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} onVa={onVa as never} homNay={null} />)
    await screen.findByText(TN.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await screen.findByRole('button', { name: /Câu tiếp theo/ })
    fireEvent.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))
    await screen.findByText(TN2.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)3N/ })) // chỉ chọn nháp Câu 2, chưa bấm nộp
    unmount()
    expect(docChangDangLam('s1')?.moi.qids).toEqual(['tn1']) // Câu 2 chưa nộp không được tính vào qids

    // Mở lại với homNay.daLam = 1 (đã gồm Câu 1 vừa làm)
    const { unmount: unmount2 } = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} onVa={onVa as never} homNay={{ daLam: 1, muc: 24, chang: 1, soChang: 4 }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn C' }))
    await screen.findByRole('button', { name: /Câu tiếp theo/ })
    expect(kqSanh.sanh.hanhTrinh.daLam).toBe(2) // Chính xác 2 câu (không bị cộng đúp 1 + 2 = 3)
    fireEvent.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))
    await screen.findByText(TN3.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await screen.findByRole('button', { name: /Kết thúc chặng/ })
    expect(kqSanh.sanh.hanhTrinh.daLam).toBe(3)
    // Thoát ra TRƯỚC khi bấm «Kết thúc chặng» ⇒ bản lưu chặng dở vẫn còn để Lộ trình chưa tích ✓ chặng đó
    unmount2()
    expect(docChangDangLam('s1')).not.toBeNull()

    // Vào lại đúng câu cuối đã chấm, bấm «Kết thúc chặng» hiện màn báo hoàn thành chặng ⇒ lúc này mới xoá bản lưu chặng dở
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} onVa={onVa as never} homNay={{ daLam: 3, muc: 24, chang: 1, soChang: 4 }} />)
    fireEvent.click(screen.getByRole('button', { name: /Kết thúc chặng/ }))
    expect(docChangDangLam('s1')).toBeNull()
  })
})
