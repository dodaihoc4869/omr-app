// LỘ TRÌNH TUẦN TỰ TỪ TRÊN XUỐNG (thầy 29/10 «Làm tuần tự từ trên xuống dưới, chặng trước làm xong thì mở khoá chặng sau»): nút Tự sửa lỗi nằm SAU các chặng trước mốc ⇒ còn
// chặng phía trên chưa xong thì khoá xám (trước đây vẫn bấm được ngay dù chặng 1 chưa làm — ảnh thầy: nút đỏ «8» mở sẵn dưới chặng 2 khoá). Xong chặng ⇒ mở; đủ mức ⇒ mở;
// Bài tập về nhà (hạn riêng) không khoá theo chặng.
// 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): danh sách «Việc hôm nay» đã bỏ ⇒ thứ tự / khoá đọc qua NÚT CHÍNH `.kb-cta` (việc đang làm đầu tiên).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import { batGoiNgay, luuChangDangLam, xoaChangDangLam } from '../src/components/hoc-tap/mo-chang-truoc'

const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Amine', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 8, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [], ...them,
})
const so = (daLam: number, chang: number) => ({ daLam, muc: 30, chang, soChang: 5 }) as PropsMotTrang['so']
/** Nút chính duy nhất của Hôm nay (bản vẽ docs/ban-ve-mot-nut-1011): tiêu đề «Chặng n» / tên việc, nhãn việc, dòng phụ, màu. */
const cta = () => document.querySelector<HTMLButtonElement>('.kb-cta')!
const tieuDe = () => cta().querySelector('b')!.textContent
const nhanViec = () => cta().querySelector('.kb-cta-nhan')?.textContent
afterEach(() => { cleanup(); batGoiNgay(false); try { localStorage.clear() } catch { /* bỏ qua */ } })

describe('Lộ trình tuần tự', () => {
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): dòng Tự sửa lỗi khoá (aria-label, huy hiệu, nhãn việc) đã bỏ ⇒ kiểm nút chính chỉ Chặng 1, bấm vào học (không vào Tự sửa lỗi)
  it('chặng 1 chưa làm (0 câu) ⇒ Tự sửa lỗi KHOÁ, thẻ không có nút «Sửa ngay»; chặng 2 trở đi cũng khoá', () => {
    const onHoc = vi.fn(), onChua = vi.fn()
    render(<MotTrangHs {...goc({ so: so(0, 1), onHoc, onChua })} />)
    expect(document.querySelectorAll('.kb-cta')).toHaveLength(1)
    expect(tieuDe()).toBe('Chặng 1')
    expect(nhanViec()).toBe('Bắt đầu')
    expect(cta().getAttribute('data-sac')).toBe('hs')
    fireEvent.click(cta())
    expect(onHoc).toHaveBeenCalledOnce()
    expect(onChua).not.toHaveBeenCalled()
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): data-tt / aria-label dòng Tự sửa lỗi ⇒ nút chính: giữa chặng 3 vẫn là Chặng 3; qua mốc ⇒ nút chính là Tự sửa lỗi (8 câu), bấm gọi onChua
  it('đang giữa chặng 3 (còn chặng trước mốc chưa xong) ⇒ vẫn khoá; làm xong các chặng trước mốc ⇒ MỞ và là việc hiện tại', () => {
    const onHoc = vi.fn(), onChua = vi.fn()
    render(<MotTrangHs {...goc({ so: so(12, 3), onHoc, onChua })} />)
    expect(tieuDe()).toBe('Chặng 3')
    fireEvent.click(cta())
    expect(onHoc).toHaveBeenCalledOnce()
    expect(onChua).not.toHaveBeenCalled()
    cleanup()
    // mốc = sau chặng 4 (chèn giữa hành trình); 4 chặng xong ⇒ tới nút Sửa lỗi
    render(<MotTrangHs {...goc({ so: so(24, 5), onHoc, onChua })} />)
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(nhanViec()).toBe('Sửa lỗi')
    expect(cta().getAttribute('data-sac')).toBe('sai')
    expect(cta().querySelector('.kb-phu')!.textContent).toBe('Hôm nay còn 8 câu cần sửa')
    fireEvent.click(cta())
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).toHaveBeenCalledOnce() // không gọi thêm lần nào
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): đủ mức ⇒ nút chính là Tự sửa lỗi; «không còn dòng bài tập» ⇒ không còn chữ Bài tập về nhà nào trên Hôm nay
  it('đủ mức (30/30) ⇒ Tự sửa lỗi mở; Bài tập về nhà không bị khoá theo chặng (hạn riêng)', () => {
    render(<MotTrangHs {...goc({ so: so(30, 5) })} />)
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(cta().getAttribute('data-sac')).toBe('sai')
    cleanup()
    const { container } = render(<MotTrangHs {...goc({ so: so(0, 1) })} />)
    // Bài tập về nhà đã bỏ khỏi app học sinh (thầy 02/11 «phần btvn không còn nữa bỏ đi») ⇒ không còn việc bài tập nào
    expect(container.textContent).not.toContain('Bài tập về nhà')
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): bỏ it «Tự sửa lỗi đã xong hôm nay ⇒ vẫn ✓ (không bị khoá lại)» — chỉ kiểm dòng ✓ của danh sách đã bỏ
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): dòng chặng (data-tt, vòng, thẻ bật ra «Chặng 3 / 5 · n câu») ⇒ nút chính «Chặng n» + chip «còn n câu»; bỏ vòng tiến độ
  it('chưa bấm nộp chưa tính câu; nộp xong câu cuối chặng mà thoát trước màn báo hoàn thành chặng ⇒ chưa tích ✓ chặng đó và chưa tràn sang chặng sau', () => {
    batGoiNgay(true)
    const dsCau = Array.from({ length: 6 }, (_, i) => ({ qid: `c3_${i + 1}`, phan: 'I', text: `Câu ${i + 1}`, choices: ['A', 'B', 'C', 'D'], hinhAnh: [], ideas: [], kienThuc: [] }))
    // Đang ở câu 3/6 của Chặng 3 (đã nộp 2 câu, câu 3 mới chọn đáp án nháp B chưa bấm nộp)
    luuChangDangLam('s1', {
      moLuc: Date.now(), phien: 'p3', cau: dsCau, soGoc: 6, viTri: 2,
      ket: { c3_1: { correct: true, answer: 'A' }, c3_2: { correct: true, answer: 'B' } }, tra: 'B',
      chang: 3, goi7: undefined, dem: { daLam: 14, muc: 30 },
      moi: { qids: ['c3_1', 'c3_2'], tiep: 0, d0: 18, ngay: '' }, // kể cả khi d0 lưu cũ bị lệch (18) ⇒ tự sửa về đúng đầu Chặng 3 (12)
      tuLam: true, goiY: false, moLoiGiai: false, msCau: {}, dhMs: 1000, dhT: { v: 1, a: 0, l: 0, n: 0, lang: 0 },
      daXinLamLai: false, luotChang: 0, daHoiThay: '', hoTroCham: '',
    })
    render(<MotTrangHs {...goc({ so: so(14, 3) })} />)
    expect(tieuDe()).toBe('Chặng 3') // Chặng 3 đang làm dở, chưa sang Chặng 4
    expect(nhanViec()).toBe('Học tiếp')
    expect(cta().querySelector('.kb-cta-con')!.textContent).toBe('còn 4 câu') // 6 − 2 câu đã nộp (không đếm câu 3 chưa nộp)
    cleanup()

    // Vừa bấm nộp câu cuối (6/6) của Chặng 3 nhưng thoát ra TRƯỚC màn báo hoàn thành chặng
    const ketDu6 = Object.fromEntries(dsCau.map((c) => [c.qid, { correct: true, answer: 'A' }]))
    luuChangDangLam('s1', {
      moLuc: Date.now(), phien: 'p3', cau: dsCau, soGoc: 6, viTri: 5,
      ket: ketDu6, tra: 'A',
      chang: 3, goi7: undefined, dem: { daLam: 18, muc: 30 },
      moi: { qids: dsCau.map((c) => c.qid), tiep: 0, d0: 12, ngay: '' },
      tuLam: true, goiY: false, moLoiGiai: false, msCau: {}, dhMs: 1000, dhT: { v: 1, a: 0, l: 0, n: 0, lang: 0 },
      daXinLamLai: false, luotChang: 0, daHoiThay: '', hoTroCham: '',
    })
    render(<MotTrangHs {...goc({ so: so(18, 4) })} />)
    expect(tieuDe()).toBe('Chặng 3') // Chặng 3 vẫn đang dở («Học tiếp»), chưa tích ✓, không bị tràn sang Chặng 4
    expect(nhanViec()).toBe('Học tiếp')
    expect(cta().querySelector('.kb-cta-con')!.textContent).toBe('còn 1 câu') // Còn bước hoàn thành chặng
    cleanup()

    // Khi màn báo hoàn thành chặng hiện ra (ketThuc xoá bản lưu chặng dở) ⇒ Chặng 3 tích ✓ (3/5 chặng) và mở Chặng 4
    xoaChangDangLam('s1')
    render(<MotTrangHs {...goc({ so: so(18, 4) })} />)
    expect(tieuDe()).toBe('Chặng 4')
  })
})
