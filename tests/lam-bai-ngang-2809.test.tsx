// MÀN LÀM BÀI NGANG (thầy chốt bản vẽ 28/09, docs/ban-ve-lam-bai-ngang-2809): bố cục theo hướng, thanh kéo, phím tắt, đồng hồ đổi màu,
// tự vào toàn màn hình trong cú bấm + đường dự phòng, xoay qua lại không mất trạng thái. Kèm ô Phần III gọn: chỉ nút "−" trong ô ở iPhone/iPad, "." ⇒ ",".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { useState } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import LamBaiNgang, { type CauPhieu, type LamBaiNgangProps } from '../src/screens/LamBaiNgang'
import {
  chonBoCuc,
  docBoCucHienTai,
  useBoCuc,
  docPhim,
  docTiLe,
  ghiTiLe,
  kepTiLe,
  KHOA_TI_LE,
  mucDongHo,
  thoatToanManHinh,
  thuVaoToanManHinh,
  tiLeTheoPhim,
  TI_LE_MAC_DINH,
} from '../src/lib/lam-bai-ngang'
import { banPhimThieuDauTru, chuanDauGo } from '../src/lib/nhap-dap-so'
import { normalizeNumericAnswer } from '../src/engine/score'
import ONhapDapSo from '../src/components/ONhapDapSo'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------- BỐ CỤC THEO HƯỚNG
describe('chọn bố cục theo hướng máy', () => {
  it('dọc ⇒ giữ nguyên màn cũ ở mọi cỡ', () => {
    for (const [w, h] of [[390, 844], [768, 1024], [820, 1180], [1440, 900]]) expect(chonBoCuc(w, h, false)).toBe('doc')
  })
  it('ngang đủ rộng (máy tính, máy tính bảng 1024×768 / 1180×820) ⇒ ngang', () => {
    for (const [w, h] of [[1440, 900], [1180, 820], [1024, 768], [900, 600]]) expect(chonBoCuc(w, h, true)).toBe('ngang')
  })
  it('điện thoại xoay ngang (thấp) ⇒ ngang gọn; quá hẹp ⇒ dọc', () => {
    expect(chonBoCuc(844, 390, true)).toBe('ngang-gon')
    expect(chonBoCuc(1000, 450, true)).toBe('ngang-gon')
    expect(chonBoCuc(640, 360, true)).toBe('ngang-gon')
    expect(chonBoCuc(500, 320, true)).toBe('doc')
  })
  it('đọc từ matchMedia(orientation: landscape) + cỡ cửa sổ; không có matchMedia ⇒ dọc (an toàn)', () => {
    vi.stubGlobal('innerWidth', 1440)
    vi.stubGlobal('innerHeight', 900)
    const cu = window.matchMedia
    // @ts-expect-error — mô phỏng trình duyệt không có matchMedia
    window.matchMedia = undefined
    expect(docBoCucHienTai()).toBe('doc')
    window.matchMedia = ((q: string) => ({ matches: q.includes('landscape'), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
    expect(docBoCucHienTai()).toBe('ngang')
    window.matchMedia = cu
  })
  it('useBoCuc đổi theo sự kiện xoay máy (change của matchMedia / resize)', () => {
    let nam = false
    const ngheChange: (() => void)[] = []
    const cu = window.matchMedia
    window.matchMedia = ((q: string) => ({
      get matches() {
        return q.includes('landscape') ? nam : false
      },
      addEventListener: (_: string, f: () => void) => ngheChange.push(f),
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia
    vi.stubGlobal('innerWidth', 820)
    vi.stubGlobal('innerHeight', 1180)
    const { result } = renderHook(() => useBoCuc())
    expect(result.current).toBe('doc')
    act(() => {
      nam = true
      vi.stubGlobal('innerWidth', 1180)
      vi.stubGlobal('innerHeight', 820)
      ngheChange.forEach((f) => f())
    })
    expect(result.current).toBe('ngang')
    act(() => {
      vi.stubGlobal('innerWidth', 844)
      vi.stubGlobal('innerHeight', 390)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe('ngang-gon')
    window.matchMedia = cu
  })
})

// ---------------------------------------------------------------- THANH KÉO
describe('thanh kéo: 35–75 %, nhớ tỉ lệ, phím mũi tên', () => {
  it('kẹp giới hạn và giá trị hỏng', () => {
    expect(kepTiLe(0.1)).toBe(0.35)
    expect(kepTiLe(0.9)).toBe(0.75)
    expect(kepTiLe(Number.NaN)).toBe(TI_LE_MAC_DINH)
    expect(tiLeTheoPhim(0.58, 'ArrowRight', false)).toBe(0.6)
    expect(tiLeTheoPhim(0.58, 'ArrowLeft', true)).toBe(0.48)
    expect(tiLeTheoPhim(0.74, 'ArrowRight', true)).toBe(0.75)
    expect(tiLeTheoPhim(0.5, 'Home', false)).toBe(0.35)
    expect(tiLeTheoPhim(0.5, 'End', false)).toBe(0.75)
    expect(tiLeTheoPhim(0.5, 'a', false)).toBeNull()
  })
  it('nhớ trong localStorage; hỏng/vượt ⇒ về giới hạn hoặc mặc định', () => {
    expect(docTiLe()).toBe(TI_LE_MAC_DINH)
    ghiTiLe(0.7)
    expect(localStorage.getItem(KHOA_TI_LE)).toBe('0.7')
    expect(docTiLe()).toBe(0.7)
    localStorage.setItem(KHOA_TI_LE, '9')
    expect(docTiLe()).toBe(0.75)
    localStorage.setItem(KHOA_TI_LE, 'abc')
    expect(docTiLe()).toBe(TI_LE_MAC_DINH)
  })
  it('trên màn: phím ←/→/Home/End khi thanh có tiêu điểm, bấm đúp về mặc định; mở lại đọc tỉ lệ đã nhớ', () => {
    const { container, unmount } = render(<LamBaiNgang {...props()} />)
    const keo = container.querySelector('[role="separator"]') as HTMLElement
    expect(keo.getAttribute('aria-valuenow')).toBe('58')
    expect(keo.tabIndex).toBe(0)
    fireEvent.keyDown(keo, { key: 'ArrowRight' })
    expect(keo.getAttribute('aria-valuenow')).toBe('60')
    fireEvent.keyDown(keo, { key: 'End' })
    fireEvent.keyDown(keo, { key: 'ArrowRight', shiftKey: true })
    expect(keo.getAttribute('aria-valuenow')).toBe('75')
    expect(localStorage.getItem(KHOA_TI_LE)).toBe('0.75')
    fireEvent.keyDown(keo, { key: 'Home' })
    fireEvent.keyDown(keo, { key: 'ArrowLeft' })
    expect(keo.getAttribute('aria-valuenow')).toBe('35')
    fireEvent.keyDown(keo, { key: 'ArrowRight', shiftKey: true })
    unmount()
    const lai = render(<LamBaiNgang {...props()} />)
    const keo2 = lai.container.querySelector('[role="separator"]') as HTMLElement
    expect(keo2.getAttribute('aria-valuenow')).toBe('45')
    fireEvent.doubleClick(keo2)
    expect(keo2.getAttribute('aria-valuenow')).toBe('58')
    expect((lai.container.firstChild as HTMLElement).style.gridTemplateColumns).toContain('58fr')
  })
})

// ---------------------------------------------------------------- DỮ LIỆU MẪU
const mau = (): CauPhieu[] => [
  { stt: 1, phan: 'I', chon: null, daLam: false, danhDau: false },
  { stt: 2, phan: 'I', chon: 2, daLam: true, danhDau: true },
  { stt: 3, phan: 'II', y: ['D', null, null, null], daLam: true, danhDau: false },
  { stt: 4, phan: 'III', tl: '', daLam: false, danhDau: false },
]
function props(p: Partial<LamBaiNgangProps> = {}): LamBaiNgangProps {
  return {
    boCuc: 'ngang',
    tenCa: 'Ca kiểm tra Hoá 12',
    cau: mau(),
    onChonPa: () => {},
    onGhiY: () => {},
    onNhap: () => {},
    oDapSo: (o) => <ONhapDapSo chuanViet value={o.value} onChange={o.onChange} placeholder="Đáp số" ariaLabel={o.ariaLabel} />,
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
        {[1, 2, 3, 4].map((n) => (
          <div key={n} id={`cau-${n}`}>
            Câu {n}
          </div>
        ))}
      </>
    ),
    ...p,
  }
}

// ---------------------------------------------------------------- PHÍM TẮT
describe('phím tắt: A–D / 1–4, D/S, N/P, M, phím cách', () => {
  it('docPhim theo phần của câu đang xem (D ở Phần I = phương án D, ở Phần II = Đúng)', () => {
    expect(docPhim('b', 'I')).toEqual({ loai: 'chon-pa', viTri: 1 })
    expect(docPhim('3', 'I')).toEqual({ loai: 'chon-pa', viTri: 2 })
    expect(docPhim('D', 'I')).toEqual({ loai: 'chon-pa', viTri: 3 })
    expect(docPhim('d', 'II')).toEqual({ loai: 'ghi-y', gt: 'D' })
    expect(docPhim('s', 'II')).toEqual({ loai: 'ghi-y', gt: 'S' })
    expect(docPhim('2', 'II')).toEqual({ loai: 'chon-y', viTri: 1 })
    expect(docPhim('đ', 'II')).toBeNull() // thầy chốt D/S, không dùng Đ
    expect(docPhim('N', 'III')).toEqual({ loai: 'sau' })
    expect(docPhim('p', 'I')).toEqual({ loai: 'truoc' })
    expect(docPhim('m', 'II')).toEqual({ loai: 'danh-dau' })
    expect(docPhim('Enter', 'III')).toEqual({ loai: 'vao-o' })
    expect(docPhim('x', 'I')).toBeNull()
  })
  it('trên màn: chọn phương án, sang câu, đánh dấu, ghi Đúng/Sai theo ý rồi tự sang ý kế', () => {
    const chon = vi.fn()
    const ghi = vi.fn()
    const dau = vi.fn()
    const xem = vi.fn()
    const { container } = render(<LamBaiNgang {...props({ onChonPa: chon, onGhiY: ghi, onDoiDau: dau, onCauDangXem: xem })} />)
    fireEvent.keyDown(document, { key: 'b' })
    expect(chon).toHaveBeenLastCalledWith(1, 1)
    fireEvent.keyDown(document, { key: '4' })
    expect(chon).toHaveBeenLastCalledWith(1, 3)
    fireEvent.keyDown(document, { key: 'n' })
    expect(xem).toHaveBeenLastCalledWith(2)
    expect(container.querySelector('[data-hang="2"]')!.hasAttribute('data-dang-xem')).toBe(true)
    fireEvent.keyDown(document, { key: 'm' })
    expect(dau).toHaveBeenLastCalledWith(2)
    fireEvent.keyDown(document, { key: 'n' }) // câu 3 — Phần II
    fireEvent.keyDown(document, { key: '2' })
    fireEvent.keyDown(document, { key: 'd' })
    expect(ghi).toHaveBeenLastCalledWith(3, 1, 'D')
    fireEvent.keyDown(document, { key: 's' })
    expect(ghi).toHaveBeenLastCalledWith(3, 2, 'S')
    fireEvent.keyDown(document, { key: 'p' })
    expect(xem).toHaveBeenLastCalledWith(2)
  })
  it('phím cách bị chặn cuộn/bấm nút (dành cho Giữ để đọc); đang có hộp thoại hoặc đang gõ ô ⇒ phím tắt im', () => {
    const chon = vi.fn()
    const r = render(<LamBaiNgang {...props({ onChonPa: chon })} />)
    const ev = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true })
    document.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    const o = r.container.querySelector('.lb-o3 input') as HTMLInputElement
    o.focus()
    fireEvent.keyDown(o, { key: 'a' })
    expect(chon).not.toHaveBeenCalled()
    o.blur()
    r.rerender(<LamBaiNgang {...props({ onChonPa: chon, tatPhim: true })} />)
    fireEvent.keyDown(document, { key: 'a' })
    expect(chon).not.toHaveBeenCalled()
  })
  it('Giữ để đọc ở màn thi nhận PHÍM CÁCH như một ngón giữ (mã -1) ở bố cục ngang máy không cảm ứng', () => {
    const src = doc('src/screens/ExamTakeScreen.tsx')
    expect(src).toMatch(/chamXuong\(tt, -1, 0, 0, nay\)/)
    expect(src).toMatch(/chamLen\(tt, -1, performance\.now\(\)\)/)
    expect(src).toMatch(/!khaiCoCamUng && boCucRef\.current !== 'doc'/)
    expect(src).toContain("'Giữ phím cách để đọc tiếp'")
  })
})

// ---------------------------------------------------------------- PHIẾU + ĐỒNG HỒ
describe('phiếu đáp án + đồng hồ', () => {
  it('đồng hồ: bình thường → vàng ≤ 10 phút → đỏ ≤ 5 phút; bài tập về nhà không đổi màu', () => {
    expect(mucDongHo(601)).toBe('')
    expect(mucDongHo(600)).toBe('vang')
    expect(mucDongHo(301)).toBe('vang')
    expect(mucDongHo(300)).toBe('do')
    expect(mucDongHo(null)).toBe('')
    const r = render(<LamBaiNgang {...props({ conGiay: 570, dongHo: '09:30' })} />)
    const gio = r.container.querySelector('.lb-gio') as HTMLElement
    expect(gio.dataset.muc).toBe('vang')
    expect(gio.textContent).toContain('Còn dưới 10 phút')
    r.rerender(<LamBaiNgang {...props({ conGiay: 290, dongHo: '04:50' })} />)
    expect(gio.dataset.muc).toBe('do')
    expect(gio.textContent).toContain('Còn dưới 5 phút')
    r.rerender(<LamBaiNgang {...props({ conGiay: null, dongHo: null, chuThayDongHo: 'Hạn 30/09' })} />)
    expect(gio.dataset.muc).toBeUndefined()
    expect(gio.textContent).toContain('Hạn 30/09')
  })
  it('mọi con số có nhãn: "Đã làm 2/4 câu", "Chưa làm: 2 câu", "Xem lại: 1 câu"; trạng thái lưu', () => {
    const { container } = render(<LamBaiNgang {...props()} />)
    const dk = container.querySelector('.lb-dk')!.textContent!
    expect(dk).toContain('Đã làm2/4câu')
    expect(dk).toContain('Chưa làm: 2 câu')
    expect(dk).toContain('Xem lại: 1 câu')
    expect(dk).toContain('Đã lưu')
  })
  it('ô đã làm / chưa làm / đánh dấu khác nhau; bấm ô tròn gọi onChonPa(stt, vị trí hiện ra)', () => {
    const chon = vi.fn()
    const { container, getByRole } = render(<LamBaiNgang {...props({ onChonPa: chon })} />)
    const so1 = container.querySelector('[data-hang="1"] .lb-so') as HTMLElement
    const so2 = container.querySelector('[data-hang="2"] .lb-so') as HTMLElement
    expect(so1.dataset.tt).toBe('chua')
    expect(so2.dataset.tt).toBe('xong')
    expect(so2.hasAttribute('data-co')).toBe(true)
    expect(so2.getAttribute('aria-label')).toBe('Tới câu 2 — đã làm, đã đánh dấu xem lại')
    expect(getByRole('button', { name: 'Câu 2 phương án C' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(getByRole('button', { name: 'Câu 1 phương án D' }))
    expect(chon).toHaveBeenCalledWith(1, 3)
  })
  it('Nộp bài gọi onNop; ca chỉ nộp phút cuối ⇒ nút khoá + ghi chú', () => {
    const nop = vi.fn()
    const r = render(<LamBaiNgang {...props({ onNop: nop })} />)
    fireEvent.click(r.getByRole('button', { name: 'Nộp bài' }))
    expect(nop).toHaveBeenCalledTimes(1)
    r.rerender(<LamBaiNgang {...props({ onNop: nop, khoaNop: true, nhanNutNop: 'Nộp bài (còn 3:00)', ghiChuNop: 'Chỉ nộp bài trong 1 phút cuối' })} />)
    const nut = r.getByRole('button', { name: 'Nộp bài (còn 3:00)' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    fireEvent.click(nut)
    expect(nop).toHaveBeenCalledTimes(1)
    expect(r.container.textContent).toContain('Chỉ nộp bài trong 1 phút cuối')
  })
  it('bấm số câu trên phiếu ⇒ câu đó thành "đang xem" + viền trong đề', () => {
    const xem = vi.fn()
    const { container } = render(<LamBaiNgang {...props({ onCauDangXem: xem })} />)
    fireEvent.click(container.querySelector('[data-hang="3"] .lb-so')!)
    expect(xem).toHaveBeenLastCalledWith(3)
    expect(document.getElementById('cau-3')!.hasAttribute('data-lb-dang-xem')).toBe(true)
    expect(document.getElementById('cau-1')!.hasAttribute('data-lb-dang-xem')).toBe(false)
  })
})

// ---------------------------------------------------------------- XOAY GIỮA CHỪNG
describe('xoay dọc ↔ ngang giữa chừng không mất đáp án / cờ / câu đang xem', () => {
  function MoPhong() {
    const [boCuc, setBoCuc] = useState<'doc' | 'ngang'>('ngang')
    const [cau, setCau] = useState(mau())
    const [dangXem, setDangXem] = useState(1)
    return (
      <div>
        <button type="button" onClick={() => setBoCuc((b) => (b === 'doc' ? 'ngang' : 'doc'))}>
          xoay
        </button>
        {boCuc === 'doc' ? (
          <div data-doc>dọc · câu đang xem {dangXem}</div>
        ) : (
          <LamBaiNgang
            {...props({
              cau,
              cauBatDau: dangXem,
              onCauDangXem: setDangXem,
              onChonPa: (n, v) => setCau((c) => c.map((x) => (x.stt === n ? { ...x, chon: v, daLam: true } : x))),
              onDoiDau: (n) => setCau((c) => c.map((x) => (x.stt === n ? { ...x, danhDau: !x.danhDau } : x))),
            })}
          />
        )}
      </div>
    )
  }
  it('chọn + đánh dấu ở ngang → xoay dọc → xoay ngang: còn nguyên, mở đúng câu đang xem', () => {
    const r = render(<MoPhong />)
    fireEvent.click(r.getByRole('button', { name: 'Câu 1 phương án B' }))
    fireEvent.keyDown(document, { key: 'n' })
    fireEvent.keyDown(document, { key: 'm' })
    fireEvent.click(r.getByRole('button', { name: 'xoay' }))
    expect(r.container.querySelector('[data-doc]')!.textContent).toContain('câu đang xem 2')
    fireEvent.click(r.getByRole('button', { name: 'xoay' }))
    expect(r.getByRole('button', { name: 'Câu 1 phương án B' }).getAttribute('aria-pressed')).toBe('true')
    expect(r.container.querySelector('[data-hang="2"]')!.hasAttribute('data-dang-xem')).toBe(true)
    expect(r.container.querySelector('[data-hang="2"] .lb-so')!.hasAttribute('data-co')).toBe(false) // câu 2 mẫu có cờ, M bỏ cờ
  })
  it('ExamTakeScreen: một nguồn state cho cả hai bố cục (cùng setPhanI/II/III, xemLaiSau), câu đang xem giữ qua cauDangXemRef', () => {
    const src = doc('src/screens/ExamTakeScreen.tsx')
    expect(src).toContain("if (boCuc !== 'doc') {")
    expect(src).toMatch(/setPhanI\(it\.qid, 'ABCD'\[it\.choicePerm\[viTri\]\]/)
    expect(src).toMatch(/setPhanII\(it\.qid, thuTu\[viTri\], gt\)/)
    expect(src).toContain('cauBatDau={cauDangXemRef.current}')
    expect(src).toMatch(/scrollIntoView\?\.\(\{ block: 'start' \}\)/)
  })
})

// ---------------------------------------------------------------- TOÀN MÀN HÌNH
describe('tự vào toàn màn hình trong cú bấm + đường dự phòng', () => {
  const taiLieu = (p: Record<string, unknown>) => ({ fullscreenElement: null, documentElement: {}, ...p }) as unknown as Document
  it('gọi requestFullscreen ĐỒNG BỘ (không await trước), nuốt lời từ chối', async () => {
    const req = vi.fn(() => Promise.reject(new Error('từ chối')))
    const d = taiLieu({ documentElement: { requestFullscreen: req } })
    expect(thuVaoToanManHinh(d)).toBe(true)
    expect(req).toHaveBeenCalledTimes(1)
    await Promise.resolve()
  })
  it('webkit (Safari cũ) ⇒ webkitRequestFullscreen; không hỗ trợ (iPhone) ⇒ false, không ném; đang toàn màn hình ⇒ không gọi lại', () => {
    const wk = vi.fn()
    expect(thuVaoToanManHinh(taiLieu({ documentElement: { webkitRequestFullscreen: wk } }))).toBe(true)
    expect(wk).toHaveBeenCalledTimes(1)
    expect(thuVaoToanManHinh(taiLieu({}))).toBe(false)
    const req = vi.fn()
    expect(thuVaoToanManHinh(taiLieu({ fullscreenElement: {}, documentElement: { requestFullscreen: req } }))).toBe(false)
    expect(req).not.toHaveBeenCalled()
    const nem = vi.fn(() => {
      throw new Error('x')
    })
    expect(thuVaoToanManHinh(taiLieu({ documentElement: { requestFullscreen: nem } }))).toBe(false)
  })
  it('thoát: chỉ khi đang toàn màn hình', () => {
    const exit = vi.fn(() => Promise.resolve())
    thoatToanManHinh(taiLieu({ exitFullscreen: exit }))
    expect(exit).not.toHaveBeenCalled()
    thoatToanManHinh(taiLieu({ fullscreenElement: {}, exitFullscreen: exit }))
    expect(exit).toHaveBeenCalledTimes(1)
  })
  it('ExamTakeScreen: gọi trong handleJoin TRƯỚC mọi await; thoát khi rời pha làm bài; nút nhỏ "Vào lại toàn màn hình" chỉ khi đã thoát', () => {
    const src = doc('src/screens/ExamTakeScreen.tsx')
    const than = src.slice(src.indexOf('const handleJoin = async () => {'))
    const goi = than.indexOf('if (!laXemDiem) thuVaoToanManHinh()')
    expect(goi).toBeGreaterThan(0)
    expect(than.slice(0, goi)).not.toMatch(/\bawait\b/)
    expect(src).toMatch(/if \(phase !== 'exam'\) return\n\s+return \(\) => thoatToanManHinh\(\)/)
    expect(src).toMatch(/!toanManHinh && coTheBatToanManHinh\(\) \?/)
    expect(src).toContain('Vào lại toàn màn hình')
    // Nút "Bật toàn màn hình" thường trực trong phòng thi: KHÔNG có (chỉ còn ở màn nhập mã như cũ).
    expect(src.slice(src.indexOf('// ---------------------------------------------------------------- LÀM BÀI'))).not.toContain('Bật toàn màn hình')
  })
})

// ---------------------------------------------------------------- Ô PHẦN III
describe('ô trả lời ngắn gọn: không "," không nút xoá; "−" chỉ ở iPhone/iPad; "." ⇒ ","', () => {
  it('chuanDauGo: "." ⇒ ","; dấu trừ Unicode ⇒ "-"; chỉ giữ MỘT dấu thập phân', () => {
    expect(chuanDauGo('12.3')).toBe('12,3')
    expect(chuanDauGo('7,44')).toBe('7,44')
    expect(chuanDauGo('−0,5')).toBe('-0,5')
    expect(chuanDauGo('–2.5')).toBe('-2,5')
    expect(chuanDauGo('1,2.3')).toBe('1,23')
    expect(chuanDauGo('1..5')).toBe('1,5')
    expect(chuanDauGo('')).toBe('')
  })
  it('banPhimThieuDauTru: iPhone/iPad (kể cả iPad khai Macintosh) ⇒ có; Android, máy tính, Mac thật ⇒ không', () => {
    expect(banPhimThieuDauTru({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', maxTouchPoints: 5 })).toBe(true)
    expect(banPhimThieuDauTru({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)', maxTouchPoints: 5 })).toBe(true)
    expect(banPhimThieuDauTru({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 })).toBe(true)
    expect(banPhimThieuDauTru({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 })).toBe(false)
    expect(banPhimThieuDauTru({ userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) Chrome/126.0 Mobile', maxTouchPoints: 5 })).toBe(false)
    expect(banPhimThieuDauTru({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0', maxTouchPoints: 0 })).toBe(false)
    expect(banPhimThieuDauTru(undefined)).toBe(false)
  })
  function O({ dau = '', ghi }: { dau?: string; ghi: (v: string) => void }) {
    const [v, setV] = useState(dau)
    return (
      <ONhapDapSo
        chuanViet
        value={v}
        onChange={(x) => {
          setV(x)
          ghi(x)
        }}
      />
    )
  }
  it('iPhone: chỉ một nút "−" trong ô, bật rồi tắt; gõ "12.3" gửi "12,3"; bấm nút không lấy tiêu điểm khỏi ô', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)')
    const ghi = vi.fn()
    const r = render(<O ghi={ghi} />)
    const o = r.container.querySelector('input') as HTMLInputElement
    expect([...r.container.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['−'])
    fireEvent.change(o, { target: { value: '12.3' } })
    expect(ghi).toHaveBeenLastCalledWith('12,3')
    expect(o.value).toBe('12,3')
    fireEvent.click(r.getByRole('button', { name: 'Thêm dấu âm' }))
    expect(ghi).toHaveBeenLastCalledWith('-12,3')
    fireEvent.click(r.getByRole('button', { name: 'Bỏ dấu âm' }))
    expect(ghi).toHaveBeenLastCalledWith('12,3')
    o.focus()
    const pd = new Event('pointerdown', { bubbles: true, cancelable: true })
    r.container.querySelector('.ond-nut')!.dispatchEvent(pd)
    expect(pd.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(o)
    vi.restoreAllMocks()
  })
  it('Android / máy tính: KHÔNG nút nào; gõ "-" và "." trực tiếp vẫn nhận, gửi dạng chuẩn', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 14; SM-A546E) Chrome/126.0 Mobile')
    const ghi = vi.fn()
    const r = render(<O ghi={ghi} />)
    expect(r.container.querySelectorAll('button')).toHaveLength(0)
    fireEvent.change(r.container.querySelector('input')!, { target: { value: '-0.5' } })
    expect(ghi).toHaveBeenLastCalledWith('-0,5')
    vi.restoreAllMocks()
  })
  it('phiếu ngang: ô Phần III không còn nút "," và nút xoá; gửi dạng chuẩn', () => {
    const nhap = vi.fn()
    const r = render(<LamBaiNgang {...props({ onNhap: nhap })} />)
    const hang = r.container.querySelector('[data-hang="4"]')!
    expect([...hang.querySelectorAll('.ond-nut')].map((b) => b.textContent).filter((t) => t !== '−')).toEqual([])
    fireEvent.change(hang.querySelector('input')!, { target: { value: '0.54' } })
    expect(nhap).toHaveBeenLastCalledWith(4, '0,54')
  })
  it('thẻ câu thi (bố cục DỌC) cũng dùng ô gọn; không còn prop nút xoá ở đâu', () => {
    expect(doc('src/components/TheCau.tsx')).toMatch(/<ONhapDapSo\s+nutTruoc\s+chuanViet\s+value=/)
    expect(doc('src/components/ONhapDapSo.tsx')).not.toContain('⌫')
  })
})

// ---------------------------------------------------------------- CHẤM PHẦN III
describe('KIỂM CHẤM: "12.3" = "12,3", "-0,5" = "−0,5" = "-0.5" (máy chủ dùng chung normalizeNumericAnswer)', () => {
  it('cùng một dạng chuẩn', () => {
    expect(normalizeNumericAnswer('12.3')).toBe(normalizeNumericAnswer('12,3'))
    const am = ['-0,5', '−0,5', '-0.5', '−0.5', '– 0,5'].map(normalizeNumericAnswer)
    expect(new Set(am).size).toBe(1)
    expect(normalizeNumericAnswer('7,44')).toBe(normalizeNumericAnswer('7.44'))
    expect(normalizeNumericAnswer('12,3')).not.toBe(normalizeNumericAnswer('1,23'))
  })
  it('dạng máy em GỬI (sau chuanDauGo) chấm giống hệt dạng em gõ', () => {
    for (const go of ['12.3', '−0,5', '-0.5', '7.44', '1..5']) expect(normalizeNumericAnswer(chuanDauGo(go))).toBe(normalizeNumericAnswer(go.replace('..', '.')))
  })
  it('máy chủ chấm bằng CHÍNH hàm này (không có hàm chấm riêng)', () => {
    // 29/09/2026: máy chủ luyện đề quyết đúng/sai bằng `khopPhanIII` (cùng luật với normalizeNumericAnswer, so GIÁ TRỊ).
    expect(doc('server/src/luyen-de.ts')).toContain("import { khopPhanIII } from '../../src/lib/cham-so'")
  })
})
