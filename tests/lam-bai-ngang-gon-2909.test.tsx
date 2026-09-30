// ĐIỆN THOẠI XOAY NGANG (thầy 29/09): "Xoay ngang làm bài thi trên điện thoại bỏ phần điền ô đáp án để tối ưu hiển thị, câu nào dài quá
// tự động chia 2 màn hình, một bên là đề một bên là các ý đáp án để chọn, lúc chia cho hs tự điều chỉnh được. Đồng hồ, font chữ, nút dịu mắt
// thiết kế nhỏ và thật tinh tế để không ảnh hưởng tới nội dung đề bài." + Boss: "Trên máy tính và chiều dọc giữ nguyên hiện tại".
// Đo bố cục thật (chiều cao, thanh chia kéo bằng ngón tay) ở tests/lam-bai-ngang-gon-trinh-duyet-2909.test.ts (Chromium).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import LamBaiNgang, { type CauPhieu, type LamBaiNgangProps } from '../src/screens/LamBaiNgang'
import { canChiaDoi, CHIA_MAC_DINH, CHIA_MAX, CHIA_MIN, chiaTheoPhim, chiaTheoViTri, docChia, ghiChia, kepChia, KHOA_CHIA, KHOA_TI_LE } from '../src/lib/lam-bai-ngang'
import NutDiuMat from '../src/components/NutDiuMat'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const mau = (): CauPhieu[] => [
  { stt: 1, phan: 'I', chon: null, daLam: false, danhDau: false },
  { stt: 2, phan: 'I', chon: 2, daLam: true, danhDau: true },
  { stt: 3, phan: 'II', y: ['D', null, null, null], daLam: true, danhDau: false },
  { stt: 4, phan: 'III', tl: '', daLam: false, danhDau: false },
]
/** Thẻ câu giả ĐÚNG khuôn TheCau: #cau-N > [đầu thẻ, thân thẻ > [đề, khối lựa chọn]]. */
const The = ({ n }: { n: number }) => (
  <div className="thi-cau-boc">
    <div id={`cau-${n}`} className="the-cau">
      <div>đầu thẻ {n}</div>
      <div>
        <div className="cau-de">Đề câu {n}</div>
        {n === 4 ? (
          <div className="osl">
            <input aria-label={`Đáp số câu ${n}`} />
          </div>
        ) : (
          <div>
            <button type="button" className="pa-hang">
              A. phương án
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)
function props(p: Partial<LamBaiNgangProps> = {}): LamBaiNgangProps {
  return {
    boCuc: 'ngang-gon',
    tenCa: 'Ca kiểm tra Hoá 12',
    cau: mau(),
    onChonPa: () => {},
    onGhiY: () => {},
    onNhap: () => {},
    oDapSo: (o) => <input aria-label={o.ariaLabel} value={o.value} onChange={(e) => o.onChange(e.target.value)} />,
    onDoiDau: () => {},
    dongHo: '38:12',
    chuThayDongHo: 'Bài tập',
    conGiay: 38 * 60 + 12,
    daLam: 2,
    tong: 4,
    nhanLuu: 'đã lưu',
    mayNgoaiMang: false,
    dangLuu: false,
    nhanNutNop: 'Nộp bài',
    khoaNop: false,
    onNop: () => {},
    tatPhim: false,
    cauBatDau: 1,
    onCauDangXem: () => {},
    children: (
      <>
        <div className="thi-dau-phan">PHẦN I</div>
        {[1, 2, 3, 4].map((n) => (
          <The key={n} n={n} />
        ))}
      </>
    ),
    ...p,
  }
}
/** jsdom không dàn trang: giả chiều cao THẬT của khung đề (scrollHeight = câu xếp một cột, clientHeight = khung nhìn). */
function giaCao(caoCau: number, caoKhung: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('lb-gon-de') ? caoCau : 0
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('lb-gon-de') ? caoKhung : 300
  })
}

describe('tỉ lệ chia đôi: 30–70 %, nhớ theo máy, phím, vị trí ngón tay', () => {
  it('kẹp giới hạn, giá trị hỏng về mặc định', () => {
    expect([CHIA_MIN, CHIA_MAX, CHIA_MAC_DINH]).toEqual([0.3, 0.7, 0.55])
    expect(kepChia(0.1)).toBe(0.3)
    expect(kepChia(0.9)).toBe(0.7)
    expect(kepChia(Number.NaN)).toBe(CHIA_MAC_DINH)
    expect(kepChia(0.4444)).toBe(0.444)
  })
  it('localStorage bọc try/catch; khoá RIÊNG với thanh kéo đề|phiếu của máy tính', () => {
    expect(KHOA_CHIA).not.toBe(KHOA_TI_LE)
    expect(docChia()).toBe(CHIA_MAC_DINH)
    ghiChia(0.35)
    expect(localStorage.getItem(KHOA_CHIA)).toBe('0.35')
    expect(docChia()).toBe(0.35)
    localStorage.setItem(KHOA_CHIA, '5')
    expect(docChia()).toBe(CHIA_MAX)
    const hong = { getItem: () => { throw new Error('chặn') }, setItem: () => { throw new Error('chặn') } }
    expect(docChia(hong)).toBe(CHIA_MAC_DINH)
    expect(() => ghiChia(0.4, hong)).not.toThrow()
  })
  it('phím trên thanh chia: ←/→ 2 %, Shift 10 %, Home/End biên, Enter mặc định', () => {
    expect(chiaTheoPhim(0.55, 'ArrowLeft', false)).toBe(0.53)
    expect(chiaTheoPhim(0.55, 'ArrowRight', true)).toBe(0.65)
    expect(chiaTheoPhim(0.69, 'ArrowRight', true)).toBe(0.7)
    expect(chiaTheoPhim(0.5, 'Home', false)).toBe(0.3)
    expect(chiaTheoPhim(0.5, 'End', false)).toBe(0.7)
    expect(chiaTheoPhim(0.4, 'Enter', false)).toBe(CHIA_MAC_DINH)
    expect(chiaTheoPhim(0.4, 'a', false)).toBeNull()
  })
  it('vị trí ngón tay ⇒ tỉ lệ cột đề (trừ khe giữa), kẹp 30–70 %', () => {
    expect(chiaTheoViTri(14 + 0.5 * 772, 800, 28)).toBe(0.5)
    expect(chiaTheoViTri(0, 800, 28)).toBe(0.3)
    expect(chiaTheoViTri(800, 800, 28)).toBe(0.7)
    expect(chiaTheoViTri(10, 0, 28)).toBe(CHIA_MAC_DINH)
  })
  it('chia khi chiều cao THẬT vượt khung (không đoán theo số ký tự)', () => {
    expect(canChiaDoi(500, 340)).toBe(true)
    expect(canChiaDoi(341, 340)).toBe(false)
    expect(canChiaDoi(300, 340)).toBe(false)
    expect(canChiaDoi(500, 0)).toBe(false)
  })
})

describe('điện thoại xoay ngang: không phiếu đáp án, một câu một lần', () => {
  it('KHÔNG còn phiếu tô ô / lưới đáp án / chú giải / gợi ý phím; chỉ câu đang xem hiện', () => {
    giaCao(200, 340)
    const r = render(<LamBaiNgang {...props()} />)
    expect(r.container.querySelector('.lb-gon')).not.toBeNull()
    for (const sel of ['.lb-phieu', '.lb-hang', '.lb-bong', '.lb-chu-giai', '.lb-goi-y', '.lb-keo', '.lb-p-khoi']) expect(r.container.querySelector(sel), sel).toBeNull()
    expect(r.queryByRole('button', { name: /phương án B/ })).toBeNull()
    const hien = r.container.querySelectorAll('.lb-gon-de > [data-gon-hien]')
    expect(hien.length).toBe(1)
    expect(hien[0].querySelector('#cau-1')).not.toBeNull()
  })
  it('‹ › và bảng số câu đổi câu đang xem, báo lên màn thi (giữ qua xoay máy)', () => {
    giaCao(200, 340)
    const xem = vi.fn()
    const r = render(<LamBaiNgang {...props({ onCauDangXem: xem, cauBatDau: 2 })} />)
    expect(r.getByRole('button', { name: /Đang ở câu 2 trên 4/ })).toBeTruthy()
    fireEvent.click(r.getByRole('button', { name: 'Câu sau' }))
    expect(xem).toHaveBeenLastCalledWith(3)
    expect(r.container.querySelector('[data-gon-hien] #cau-3')).not.toBeNull()
    fireEvent.click(r.getByRole('button', { name: /Đang ở câu 3 trên 4/ }))
    const bang = r.getByRole('dialog', { name: 'Chọn câu' })
    expect(bang.textContent).toContain('Phần II · Đúng–sai')
    expect(r.getByRole('button', { name: 'Tới câu 2 — đã làm, đã đánh dấu xem lại' })).toBeTruthy()
    fireEvent.click(r.getByRole('button', { name: 'Tới câu 1 — chưa làm' }))
    expect(xem).toHaveBeenLastCalledWith(1)
    expect(r.queryByRole('dialog')).toBeNull()
    expect((r.getByRole('button', { name: 'Câu trước' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(r.getByRole('button', { name: /Đang ở câu 1/ }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(r.queryByRole('dialog')).toBeNull()
  })
  it('mọi con số có nhãn: "Câu 1/4", "Đã làm 2/4", tên phần; trạng thái lưu đọc được', () => {
    giaCao(200, 340)
    const r = render(<LamBaiNgang {...props({ mayNgoaiMang: true, nhanLuu: 'mất mạng — đã lưu trên máy' })} />)
    const thanh = r.container.querySelector('.lb-gon-thanh')!
    expect(thanh.textContent).toContain('Câu 1/4')
    expect(thanh.textContent).toContain('Đã làm 2/4')
    expect(thanh.textContent).toContain('Phần I')
    expect(r.getByRole('status').getAttribute('aria-label')).toBe('Mất mạng — đã lưu trên máy')
    expect(r.getByRole('status').textContent).toContain('Mất mạng')
  })
})

describe('đồng hồ, cỡ chữ, dịu mắt, nộp: nhỏ gọn trên thanh 32 px', () => {
  it('đồng hồ: số + nhãn đọc được; ≤ 10 phút "Dưới 10 phút", ≤ 5 phút "Sắp hết giờ" (màu + CHỮ)', () => {
    giaCao(200, 340)
    const r = render(<LamBaiNgang {...props()} />)
    const gio = () => r.getByRole('timer')
    expect(gio().getAttribute('data-muc')).toBeNull()
    expect(gio().getAttribute('aria-label')).toBe('Thời gian còn lại 38:12')
    r.rerender(<LamBaiNgang {...props({ dongHo: '08:20', conGiay: 500 })} />)
    expect(gio().getAttribute('data-muc')).toBe('vang')
    expect(gio().textContent).toContain('Dưới 10 phút')
    r.rerender(<LamBaiNgang {...props({ dongHo: '04:00', conGiay: 240 })} />)
    expect(gio().getAttribute('data-muc')).toBe('do')
    expect(gio().textContent).toBe('Sắp hết giờ04:00')
    expect(gio().getAttribute('aria-label')).toBe('Sắp hết giờ. Thời gian còn lại 04:00')
    r.rerender(<LamBaiNgang {...props({ dongHo: null, chuThayDongHo: 'Hạn 30/09', conGiay: null })} />)
    expect(gio().textContent).toBe('Hạn 30/09')
    expect(gio().getAttribute('data-muc')).toBeNull()
  })
  it('A−/A+ đổi cỡ chữ đề (15–22 px, nhớ theo máy); Nộp bài gọi onNop, khoá thì không', () => {
    giaCao(200, 340)
    const nop = vi.fn()
    const r = render(<LamBaiNgang {...props({ onNop: nop })} />)
    const de = r.container.querySelector<HTMLElement>('.lb-gon-de')!
    expect(de.style.getPropertyValue('--cx-3')).toBe('16px')
    fireEvent.click(r.getByRole('button', { name: 'Chữ đề to lên' }))
    expect(de.style.getPropertyValue('--cx-3')).toBe('17px')
    expect(localStorage.getItem('ddh.lamBaiNgang.coChuGon')).toBe('17')
    for (let i = 0; i < 5; i++) fireEvent.click(r.getByRole('button', { name: 'Chữ đề nhỏ lại' }))
    expect(de.style.getPropertyValue('--cx-3')).toBe('15px')
    expect((r.getByRole('button', { name: 'Chữ đề nhỏ lại' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(r.getByRole('button', { name: 'Nộp bài' }))
    expect(nop).toHaveBeenCalledTimes(1)
    r.rerender(<LamBaiNgang {...props({ onNop: nop, khoaNop: true, ghiChuNop: 'Chỉ nộp bài trong 1 phút cuối' })} />)
    const n = r.getByRole('button', { name: 'Nộp bài' }) as HTMLButtonElement
    expect(n.disabled).toBe(true)
    expect(n.title).toBe('Chỉ nộp bài trong 1 phút cuối')
  })
  it('nút Dịu mắt chỉ-biểu-tượng có aria-label ở ngang điện thoại; nơi khác giữ NGUYÊN (không thêm thuộc tính)', () => {
    const a = render(<NutDiuMat bat={false} onDoi={() => {}} chiBieuTuong />)
    expect(a.getByRole('button', { name: 'Dịu mắt' }).getAttribute('aria-label')).toBe('Dịu mắt')
    cleanup()
    const b = render(<NutDiuMat bat={false} onDoi={() => {}} />)
    expect(b.getByRole('button', { name: 'Dịu mắt' }).hasAttribute('aria-label')).toBe(false)
    const src = doc('src/screens/ExamTakeScreen.tsx')
    expect(src).toContain("congCu={<NutDiuMat bat={diuMat} onDoi={doiDiuMat} chiBieuTuong={boCuc === 'ngang-gon'} />}")
    // thanh trên bố cục DỌC không đổi
    expect(src).toContain('nutPhu={<NutDiuMat bat={diuMat} onDoi={doiDiuMat} />}')
  })
})

describe('câu dài tự chia 2 cột + thanh chia em tự chỉnh', () => {
  it('câu ngắn (vừa khung) ⇒ một cột, không thanh chia', () => {
    giaCao(300, 340)
    const r = render(<LamBaiNgang {...props()} />)
    expect(r.container.querySelector('.lb-gon-de')!.hasAttribute('data-chia')).toBe(false)
    expect(r.queryByRole('separator')).toBeNull()
  })
  it('câu dài ⇒ chia: khối phương án được đánh dấu cột phải; thanh chia có aria; phím ←/→ đổi + nhớ; nút ↺ và bấm đúp về mặc định', () => {
    giaCao(620, 340)
    const r = render(<LamBaiNgang {...props()} />)
    const de = r.container.querySelector('.lb-gon-de')!
    expect(de.hasAttribute('data-chia')).toBe(true)
    expect(de.querySelector('#cau-1 [data-lb-pa] .pa-hang')).not.toBeNull()
    expect(de.querySelectorAll('[data-lb-pa]').length).toBe(1)
    const thanh = r.getByRole('separator')
    expect(thanh.getAttribute('aria-valuemin')).toBe('30')
    expect(thanh.getAttribute('aria-valuemax')).toBe('70')
    expect(thanh.getAttribute('aria-valuenow')).toBe('55')
    expect(r.queryByRole('button', { name: /về độ rộng mặc định/ })).toBeNull()
    fireEvent.keyDown(thanh, { key: 'ArrowRight', shiftKey: true })
    expect(thanh.getAttribute('aria-valuenow')).toBe('65')
    expect(localStorage.getItem(KHOA_CHIA)).toBe('0.65')
    expect((r.container.querySelector('.lb-gon') as HTMLElement).style.getPropertyValue('--lb-chia-de')).toBe('0.65fr')
    fireEvent.click(r.getByRole('button', { name: /về độ rộng mặc định/ }))
    expect(thanh.getAttribute('aria-valuenow')).toBe('55')
    fireEvent.keyDown(thanh, { key: 'Home' })
    expect(thanh.getAttribute('aria-valuenow')).toBe('30')
    fireEvent.doubleClick(thanh)
    expect(thanh.getAttribute('aria-valuenow')).toBe('55')
  })
  it('Phần III: ô đáp số là khối cột phải; Phần II cũng chia đủ', () => {
    giaCao(620, 340)
    const r = render(<LamBaiNgang {...props({ cauBatDau: 4 })} />)
    expect(r.container.querySelector('#cau-4 [data-lb-pa]')!.classList.contains('osl')).toBe(true)
    fireEvent.click(r.getByRole('button', { name: 'Câu trước' }))
    expect(r.container.querySelector('#cau-3 [data-lb-pa] .pa-hang')).not.toBeNull()
  })
  it('mở lại đọc tỉ lệ đã nhớ', () => {
    localStorage.setItem(KHOA_CHIA, '0.4')
    giaCao(620, 340)
    const r = render(<LamBaiNgang {...props()} />)
    expect(r.getByRole('separator').getAttribute('aria-valuenow')).toBe('40')
  })
})

describe('máy tính / máy tính bảng xoay ngang và màn DỌC giữ nguyên', () => {
  it("boCuc 'ngang' vẫn là bố cục đề | thanh kéo | phiếu đáp án cũ", () => {
    const r = render(<LamBaiNgang {...props({ boCuc: 'ngang' })} />)
    expect(r.container.querySelector('.lb-gon')).toBeNull()
    expect(r.container.querySelector('.lb-khung[data-bo-cuc="ngang"] .lb-phieu')).not.toBeNull()
    expect(r.getByRole('button', { name: 'Câu 1 phương án B' })).toBeTruthy()
    expect(r.container.querySelectorAll('[data-gon-hien]').length).toBe(0)
  })
  it('CSS mới chỉ nằm dưới .lb-gon (không đụng .lb-khung / thanh trên dọc)', () => {
    const css = doc('src/screens/lam-bai-ngang.css')
    const khoi = css.slice(css.lastIndexOf('/*', css.indexOf('NGANG GỌN (điện thoại xoay ngang')), css.lastIndexOf('/*', css.indexOf('BẢNG PHÍM TẮT')))
    const boChon = Array.from(khoi.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g))
      .map((m) => m[1].trim())
      .filter((x) => !x.startsWith('@'))
      .flatMap((x) => x.split(',').map((y) => y.trim()))
    expect(boChon.length).toBeGreaterThan(30)
    for (const s of boChon) expect(s, s).toMatch(/^\.lb-gon/)
  })
})
