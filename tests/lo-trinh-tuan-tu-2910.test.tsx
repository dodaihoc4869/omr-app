// LỘ TRÌNH TUẦN TỰ TỪ TRÊN XUỐNG (thầy 29/10 «Làm tuần tự từ trên xuống dưới, chặng trước làm xong thì mở khoá chặng sau»): nút Tự sửa lỗi nằm SAU các chặng trước mốc ⇒ còn
// chặng phía trên chưa xong thì khoá xám (trước đây vẫn bấm được ngay dù chặng 1 chưa làm — ảnh thầy: nút đỏ «8» mở sẵn dưới chặng 2 khoá). Xong chặng ⇒ mở; đủ mức ⇒ mở;
// Bài tập về nhà (hạn riêng) không khoá theo chặng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'

const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Amine', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 8, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [], ...them,
})
const so = (daLam: number, chang: number) => ({ daLam, muc: 30, chang, soChang: 5 }) as PropsMotTrang['so']
const nut = () => within(screen.getByRole('list', { name: 'Lộ trình hôm nay' })).getAllByRole('listitem').map((li) => li.firstElementChild as HTMLElement)
const sua = () => nut().find((n) => n.getAttribute('data-loai') === 'sua')!
afterEach(() => { cleanup(); try { localStorage.clear() } catch { /* bỏ qua */ } })

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
})
