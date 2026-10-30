// LỘ TRÌNH TUẦN TỰ TỪ TRÊN XUỐNG (thầy 29/10 «Làm tuần tự từ trên xuống dưới, chặng trước làm xong thì mở khoá chặng sau»): nút Tự sửa lỗi nằm SAU các chặng trước mốc ⇒ còn
// chặng phía trên chưa xong thì khoá xám (trước đây vẫn bấm được ngay dù chặng 1 chưa làm — ảnh thầy: nút đỏ «8» mở sẵn dưới chặng 2 khoá). Xong chặng ⇒ mở; đủ mức ⇒ mở;
// Bài tập về nhà (hạn riêng) không khoá theo chặng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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
const nut = () => within(screen.getByRole('list', { name: 'Lộ trình hôm nay' })).getAllByRole('listitem').map((li) => li.firstElementChild as HTMLElement)
const sua = () => nut().find((n) => n.getAttribute('data-loai') === 'sua')!
afterEach(() => { cleanup(); batGoiNgay(false); try { localStorage.clear() } catch { /* bỏ qua */ } })

describe('Lộ trình tuần tự', () => {
  it('chặng 1 chưa làm (0 câu) ⇒ Tự sửa lỗi KHOÁ, thẻ không có nút «Sửa ngay»; chặng 2 trở đi cũng khoá', () => {
    render(<MotTrangHs {...goc({ so: so(0, 1) })} />)
    expect(sua().getAttribute('data-tt')).toBe('khoa')
    expect(sua().getAttribute('aria-label')).toBe('Tự sửa lỗi: làm xong các chặng phía trên để mở khoá')
    expect(sua().querySelector('.da-dem')).toBeNull()
    expect(sua().querySelector('.da-bong')).toBeNull()
    expect(nut().filter((n) => n.getAttribute('data-loai') === 'hoc' && n.getAttribute('data-tt') === 'khoa').length).toBeGreaterThan(0)
  })
  it('đang giữa chặng 3 (còn chặng trước mốc chưa xong) ⇒ vẫn khoá; làm xong các chặng trước mốc ⇒ MỞ và là việc hiện tại', () => {
    render(<MotTrangHs {...goc({ so: so(12, 3) })} />)
    expect(sua().getAttribute('data-tt')).toBe('khoa')
    cleanup()
    // mốc = sau chặng 4 (chèn giữa hành trình); 4 chặng xong ⇒ tới nút Sửa lỗi
    render(<MotTrangHs {...goc({ so: so(24, 5) })} />)
    expect(sua().getAttribute('data-tt')).toBe('dang')
    expect(sua().getAttribute('aria-label')).toBe('Tự sửa lỗi: hôm nay còn 8 câu')
  })
  it('đủ mức (30/30) ⇒ Tự sửa lỗi mở; Bài tập về nhà không bị khoá theo chặng (hạn riêng)', () => {
    render(<MotTrangHs {...goc({ so: so(30, 5) })} />)
    expect(sua().getAttribute('data-tt')).toBe('dang')
    cleanup()
    render(<MotTrangHs {...goc({ so: so(0, 1) })} />)
    const bt = nut().find((n) => n.getAttribute('data-loai') === 'bt')!
    expect(bt.getAttribute('data-tt')).not.toBe('khoa')
  })
  it('Tự sửa lỗi đã xong hôm nay ⇒ vẫn ✓ (không bị khoá lại)', () => {
    render(<MotTrangHs {...goc({ so: so(0, 1), soSua: 0 })} />)
    expect(nut().some((n) => n.getAttribute('data-loai') === 'sua' && n.getAttribute('data-tt') === 'khoa')).toBe(false)
  })
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
    const cacChang1 = nut().filter((n) => n.getAttribute('data-loai') === 'hoc')
    expect(cacChang1[2]!.getAttribute('data-tt')).toBe('dang')
    expect(cacChang1[2]!.getAttribute('aria-label')).toBe('Học tiếp · 16 câu') // 30 - (12 + 2 câu đã nộp) = 16 câu còn lại (không đếm câu 3 chưa nộp)
    expect(cacChang1[2]!.querySelector('.da-vong circle.chay')).not.toBeNull()
    fireEvent.click(cacChang1[2]!)
    expect(screen.getByText('Chặng 3 / 5 · 4 câu')).toBeTruthy()
    expect(cacChang1[3]!.getAttribute('data-tt')).toBe('khoa')
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
    const cacChang2 = nut().filter((n) => n.getAttribute('data-loai') === 'hoc')
    expect(screen.getByText('2/5 chặng')).toBeTruthy() // Chặng 3 chưa qua màn hoàn thành ⇒ mới tính 2/5 chặng xong
    expect(cacChang2[2]!.getAttribute('data-tt')).toBe('dang') // Chặng 3 vẫn đang dở («HỌC TIẾP»), chưa có dấu tích ✓
    fireEvent.click(cacChang2[2]!)
    expect(screen.getByText('Chặng 3 / 5 · 1 câu')).toBeTruthy() // Còn bước hoàn thành chặng
    expect(cacChang2[3]!.getAttribute('data-tt')).toBe('khoa') // Chặng 4 vẫn khoá, không bị tràn vạch sang Chặng 4
    cleanup()

    // Khi màn báo hoàn thành chặng hiện ra (ketThuc xoá bản lưu chặng dở) ⇒ Chặng 3 tích ✓ (3/5 chặng) và mở Chặng 4
    xoaChangDangLam('s1')
    render(<MotTrangHs {...goc({ so: so(18, 4) })} />)
    const cacChang3 = nut().filter((n) => n.getAttribute('data-loai') === 'hoc')
    expect(screen.getByText('3/5 chặng')).toBeTruthy()
    expect(cacChang3[2]!.getAttribute('data-tt')).toBe('xong')
    expect(cacChang3[3]!.getAttribute('data-tt')).toBe('dang')
  })
})
