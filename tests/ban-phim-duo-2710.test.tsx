// @vitest-environment jsdom
// BÀN PHÍM SỐ KIỂU DUOLINGO (thầy 27/10, ảnh bản sống câu trả lời ngắn: «Bấm chọn điền đáp án phải có hiệu ứng như dolingo nhé»). Khoá:
//  (1) hiệu ứng KHÔNG phá nhập liệu: bấm phím màn hình vẫn gọi onPhim đúng phím, đúng thứ tự; phím hết tác dụng vẫn khoá; phím máy tính chỉ làm phím
//      trên màn lún + phản hồi, KHÔNG tự nhập (màn cha nhập như cũ ⇒ không nhập đôi);
//  (2) phanHoi('chon') (rung + tiếng «tách») mỗi lần bấm phím màn hình và mỗi lần gõ phím máy tính có tác dụng;
//  (3) phím lún (data-an) ≥ 80 ms rồi bật lại; chữ số mới đánh dấu bật vào ô; xoá ⇒ bóng kí tự cũ rồi tự gỡ;
//  (4) phép thuần: doiO (ô nào vừa nhận / mất kí tự) và cuonThayBanPhim (cuộn vừa đủ, không cuộn mất ô đáp án).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { BanPhimSo, OTraLoiNgan } from '../src/components/hoc-tap/LamCau'
import { cuonThayBanPhim, doiO, LUN_TOI_THIEU_MS } from '../src/components/hoc-tap/ban-phim-hieu-ung'
import { nhanPhim, type PhimSo } from '../src/components/hoc-tap/lam-bai'
import { phanHoi } from '../src/lib/phan-hoi'

vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.mocked(phanHoi).mockClear() })

/** Màn cha tối giản như nhánh Duo của ManLamBaiTap: bàn phím màn hình + phím máy tính cùng nhập bằng `nhanPhim`. */
function Man({ soO = 3, onDoi }: { soO?: number; onDoi?: (v: string) => void }) {
  const [v, setV] = useState('')
  const doi = (p: PhimSo) => setV((cu) => { const moi = nhanPhim(cu, p, soO); onDoi?.(moi); return moi })
  return <div className="ht-app duo"><OTraLoiNgan value={v} soO={soO} /><BanPhimSo value={v} khoa={false} soO={soO} onPhim={doi} /></div>
}
const phim = (ten: string) => screen.getByRole('button', { name: ten })

describe('hiệu ứng không phá nhập liệu', () => {
  it('bấm 8 , 2 ⇒ onPhim đúng phím, đúng thứ tự; ô hiện 8,2; đủ ô thì phím số khoá', () => {
    const ds: string[] = []
    render(<Man onDoi={(v) => ds.push(v)} />)
    for (const p of ['8', 'Dấu phẩy', '2']) { fireEvent.pointerDown(phim(p)); fireEvent.pointerUp(phim(p)); fireEvent.click(phim(p), { detail: 1 }) }
    expect(ds).toEqual(['8', '8,', '8,2'])
    expect(screen.getByText('Đáp án của em: 8,2')).toBeTruthy()
    expect((phim('5') as HTMLButtonElement).disabled).toBe(true)
    expect((phim('Xoá một kí tự') as HTMLButtonElement).disabled).toBe(false)
  })
  it('mặt phím nằm TRONG nút: tên nút (đọc màn hình) giữ nguyên chữ số', () => {
    render(<Man />)
    expect(phim('7').querySelector('.ht2-lam-phim-mat')?.textContent).toBe('7')
  })
  it('gõ phím máy tính: phím màn hình lún + phanHoi, KHÔNG tự nhập (màn cha nhập)', () => {
    const onPhim = vi.fn()
    render(<div className="ht-app duo"><BanPhimSo value="" khoa={false} soO={3} onPhim={onPhim} /></div>)
    fireEvent.keyDown(window, { key: '4' })
    expect(onPhim).not.toHaveBeenCalled()
    expect(phim('4').hasAttribute('data-an')).toBe(true)
    expect(phanHoi).toHaveBeenCalledWith('chon')
    act(() => { vi.advanceTimersByTime(LUN_TOI_THIEU_MS + 5) })
    expect(phim('4').hasAttribute('data-an')).toBe(false)
  })
  it('phím máy tính hết tác dụng / đang khoá / đang gõ ô chữ ⇒ không lún, không phản hồi', () => {
    const { rerender } = render(<div className="ht-app duo"><BanPhimSo value="123" khoa={false} soO={3} onPhim={() => {}} /><input aria-label="ô chữ" /></div>)
    fireEvent.keyDown(window, { key: '5' }) // đủ 3 ô
    fireEvent.keyDown(screen.getByLabelText('ô chữ'), { key: 'Backspace' })
    rerender(<div className="ht-app duo"><BanPhimSo value="1" khoa onPhim={() => {}} /></div>)
    fireEvent.keyDown(window, { key: '2' })
    expect(phanHoi).not.toHaveBeenCalled()
    expect(document.querySelector('[data-an]')).toBeNull()
  })
})

describe('phản hồi và phím lún', () => {
  it('mỗi lần bấm phím màn hình gọi phanHoi("chon") đúng một lần', () => {
    render(<Man />)
    fireEvent.click(phim('1'), { detail: 1 }); fireEvent.click(phim('2'), { detail: 1 }); fireEvent.click(phim('Xoá một kí tự'), { detail: 1 })
    expect(vi.mocked(phanHoi).mock.calls).toEqual([['chon'], ['chon'], ['chon']])
  })
  it('chạm thật nhanh: phím vẫn lún ≥ 80 ms rồi bật lại', () => {
    render(<Man />)
    fireEvent.pointerDown(phim('9'))
    expect(phim('9').hasAttribute('data-an')).toBe(true)
    fireEvent.pointerUp(phim('9'))
    act(() => { vi.advanceTimersByTime(LUN_TOI_THIEU_MS - 20) })
    expect(phim('9').hasAttribute('data-an')).toBe(true)
    act(() => { vi.advanceTimersByTime(30) })
    expect(phim('9').hasAttribute('data-an')).toBe(false)
  })
  it('bấm bằng bàn phím (Enter trên nút, detail = 0) cũng lún + nhập', () => {
    const ds: string[] = []
    render(<Man onDoi={(v) => ds.push(v)} />)
    fireEvent.click(phim('6'), { detail: 0 })
    expect(phim('6').hasAttribute('data-an')).toBe(true)
    expect(ds).toEqual(['6'])
  })
})

describe('ô đáp án: chữ số bật vào ô, xoá thu nhỏ', () => {
  it('chữ số mới đánh dấu data-moi ở đúng ô, ô ấy nảy (data-nay); con trỏ ở ô kế', () => {
    render(<Man />)
    fireEvent.click(phim('3'), { detail: 1 })
    const o = document.querySelectorAll('.ht2-lam-o')
    expect(o[0]!.querySelector('.ht2-lam-so[data-moi]')?.textContent).toBe('3')
    expect(o[0]!.getAttribute('data-nay')).toMatch(/^[ab]$/)
    expect(o[1]!.querySelector('.ht2-lam-con-tro')).toBeTruthy()
    fireEvent.click(phim('4'), { detail: 1 })
    expect(o[0]!.querySelector('[data-moi]')).toBeNull()
    expect(o[1]!.querySelector('.ht2-lam-so[data-moi]')?.textContent).toBe('4')
  })
  it('xoá: bóng chữ số cũ ở đúng ô rồi tự gỡ sau ~100 ms', () => {
    render(<Man />)
    fireEvent.click(phim('3'), { detail: 1 }); fireEvent.click(phim('4'), { detail: 1 })
    fireEvent.click(phim('Xoá một kí tự'), { detail: 1 })
    const o = document.querySelectorAll('.ht2-lam-o')
    expect(o[1]!.querySelector('.ht2-lam-bong')?.textContent).toBe('4')
    expect(screen.getByText('Đáp án của em: 3')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(150) })
    expect(document.querySelector('.ht2-lam-bong')).toBeNull()
  })
})

describe('phép thuần', () => {
  it('doiO: thêm cuối / thêm dấu âm đầu / xoá cuối / xoá hết', () => {
    expect(doiO('8', '8,')).toEqual({ moi: 1, bong: null })
    expect(doiO('12', '-12')).toEqual({ moi: 0, bong: null })
    expect(doiO('8,2', '8,')).toEqual({ moi: -1, bong: { i: 2, ch: '2' } })
    expect(doiO('8,2', '')).toEqual({ moi: -1, bong: null })
    expect(doiO('-12', '12')).toEqual({ moi: -1, bong: null })
  })
  it('cuonThayBanPhim: cuộn vừa đủ, không cuộn mất ô đáp án, đã thấy trọn ⇒ 0', () => {
    // ảnh thầy (Safari ~416×560): đáy bàn phím 532, đỉnh thanh đáy 426, ô đáp án ở 302 ⇒ cuộn 114
    expect(cuonThayBanPhim({ phimDay: 532, thanhTren: 426, oTren: 302, khungTren: 0 })).toBe(114)
    expect(cuonThayBanPhim({ phimDay: 532, thanhTren: 426, oTren: 60, khungTren: 0 })).toBe(52)
    expect(cuonThayBanPhim({ phimDay: 400, thanhTren: 426, oTren: 200, khungTren: 0 })).toBe(0)
    expect(cuonThayBanPhim({ phimDay: 0, thanhTren: 0, oTren: 0, khungTren: 0 })).toBe(0)
  })
})

// ── THANH ĐÁY DUO GỌN (thầy 27/10: ba viên trợ giúp «rối quá, ẩn đi, bấm vào mới hiện»): nút tròn «Trợ giúp» + KIỂM TRA, tấm bật lên.
import { TroGiupDuo } from '../src/components/hoc-tap/TroGiupDuo'
const Kt = <button type="button" className="duo-nut">Kiểm tra</button>
describe('nút Trợ giúp của thanh đáy Duo', () => {
  it('không có trợ giúp nào ⇒ ẩn nút tròn, KIỂM TRA vẫn ở đó', () => {
    render(<div className="ht-app duo"><TroGiupDuo nut={Kt}>{null}<span className="duo-o-nut-cham" /></TroGiupDuo></div>)
    expect(screen.queryByRole('button', { name: 'Trợ giúp' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeTruthy()
  })
  it('bấm ⇒ tấm mở (rung chon), chọn mục ⇒ mục chạy việc của nó rồi tấm đóng; mục nằm sẵn trong DOM khi đóng', () => {
    const hoc = vi.fn()
    render(<div className="ht-app duo"><TroGiupDuo nut={Kt}><span className="duo-o-nut-cham" /><button type="button" className="duo-lien" onClick={hoc}>Học cách giải</button></TroGiupDuo></div>)
    const nut = screen.getByRole('button', { name: 'Trợ giúp' })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    const tam = document.getElementById(nut.getAttribute('aria-controls')!)!
    expect(tam.hidden).toBe(true)
    expect(tam.querySelector('.duo-o-nut-cham')).toBeTruthy() // ô portal «Bắt đầu từ đâu?» luôn có
    fireEvent.click(nut)
    expect(phanHoi).toHaveBeenCalledWith('chon')
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(tam.hidden).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Học cách giải' }))
    expect(hoc).toHaveBeenCalledTimes(1)
    expect(tam.hidden).toBe(true)
  })
  it('chạm ra ngoài ⇒ đóng; Esc ⇒ đóng và KHÔNG đi tiếp tới màn (không thoát / không mở tấm giữ chân)', () => {
    const thoat = vi.fn()
    window.addEventListener('keydown', thoat)
    render(<div className="ht-app duo"><p>đề</p><TroGiupDuo nut={Kt}><button type="button" className="duo-lien">Gợi ý</button></TroGiupDuo></div>)
    const nut = screen.getByRole('button', { name: 'Trợ giúp' })
    fireEvent.click(nut)
    fireEvent.pointerDown(screen.getByText('đề'))
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(nut)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(thoat).not.toHaveBeenCalled()
    window.removeEventListener('keydown', thoat)
  })
})
