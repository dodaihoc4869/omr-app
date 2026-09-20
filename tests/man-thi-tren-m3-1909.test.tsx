// C10 bước 2 — THANH TRÊN màn thi thật, bản M3 (ThanhTrenThiM3; bản vẽ ThiDangLam/ThiCanhBao): viên thuốc đồng hồ, tên ca · số câu, "Đã làm x/y",
// trạng thái lưu, nút danh sách câu, tiến độ 4 px. Chỉ trình bày lại giá trị ĐÃ CÓ; cao đúng 56 px (CAO_THANH_TREN); đường không phải học sinh giữ thanh cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ThanhTrenThiM3 from '../src/screens/ThanhTrenThiM3'
import { CAO_THANH_TREN } from '../src/components/ManGiuDeDoc'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const goc = { dongHo: '32:15', chuThayDongHo: 'Bài tập', gap: false, tenCa: 'Ca Este', daLam: 12, tong: 28, nhanLuu: 'đã lưu', mayNgoaiMang: false, dangLuu: false, onMoLuoi: () => {} }
afterEach(() => cleanup())

describe('ThanhTrenThiM3 — nội dung', () => {
  it('viên thuốc đồng hồ + "Ca Este · 28 câu" + "Đã làm 12/28"; không đỏ khi còn nhiều giờ', () => {
    const { container } = render(<ThanhTrenThiM3 {...goc} />)
    expect(container.querySelector('.thi-vien-thuoc')!.textContent).toBe('32:15')
    expect(container.querySelector('.thi-tren-ten')!.textContent).toBe('Ca Este · 28 câu')
    expect(container.querySelector('.thi-tren-da-lam')!.textContent).toBe('Đã làm 12/28')
    expect(container.querySelector('.thi-tren')!.getAttribute('data-gap')).toBeNull()
  })

  it('còn ≤ 5 phút (gap): đánh dấu data-gap để viên thuốc đổi errorContainer', () => {
    const { container } = render(<ThanhTrenThiM3 {...goc} gap dongHo="04:32" />)
    expect(container.querySelector('.thi-tren')!.getAttribute('data-gap')).toBe('true')
    const css = doc('src/screens/man-thi-m3.css')
    expect(css).toMatch(/\.m3 \.thi-tren\[data-gap\] \.thi-vien-thuoc \{[^}]*background: var\(--m3-error-container\);[^}]*color: var\(--m3-on-error-container\)/)
  })

  it('không có tên ca: chỉ "28 câu"; tên toàn khoảng trắng cũng vậy', () => {
    const a = render(<ThanhTrenThiM3 {...goc} tenCa="" />)
    expect(a.container.querySelector('.thi-tren-ten')!.textContent).toBe('28 câu')
    a.unmount()
    const b = render(<ThanhTrenThiM3 {...goc} tenCa="   " />)
    expect(b.container.querySelector('.thi-tren-ten')!.textContent).toBe('28 câu')
  })

  it('bài tập về nhà: chữ hạn nộp thay đồng hồ, giữ chú thích "không tính giờ"', () => {
    const { container } = render(<ThanhTrenThiM3 {...goc} dongHo={null} chuThayDongHo="Hạn 21/09" />)
    const v = container.querySelector('.thi-vien-thuoc')!
    expect(v.textContent).toBe('Hạn 21/09')
    expect(v.getAttribute('title')).toBe('Bài tập về nhà — không tính giờ')
  })

  it('trạng thái lưu dùng NGUYÊN chữ của màn thi và mang tên cho trình đọc màn hình; ba trạng thái phân biệt được', () => {
    const cach: [string, boolean, boolean, string][] = [['đã lưu', false, false, 'da-luu'], ['đang lưu…', false, true, 'dang-luu'], ['mất mạng — đã lưu trên máy', true, false, 'ngoai-mang']]
    for (const [nhan, mang, luu, tt] of cach) {
      const { container, unmount } = render(<ThanhTrenThiM3 {...goc} nhanLuu={nhan} mayNgoaiMang={mang} dangLuu={luu} />)
      const e = container.querySelector('.thi-luu')!
      expect(e.getAttribute('role')).toBe('status')
      expect(e.getAttribute('aria-label')).toBe(nhan)
      expect(e.getAttribute('title')).toBe(nhan)
      expect(e.getAttribute('data-trang-thai')).toBe(tt)
      expect(e.querySelector('.thi-luu-chu')!.textContent).toBe(nhan)
      unmount()
    }
  })

  it('nút danh sách câu: tên "Danh sách câu", bấm gọi đúng hàm mở, type=button', () => {
    const mo = vi.fn()
    render(<ThanhTrenThiM3 {...goc} onMoLuoi={mo} />)
    const nut = screen.getByRole('button', { name: 'Danh sách câu' })
    expect(nut.getAttribute('type')).toBe('button')
    fireEvent.click(nut)
    expect(mo).toHaveBeenCalledTimes(1)
  })

  it('tiến độ: aria đúng, độ rộng theo tỉ lệ, kẹp 0–100, chia cho 0 câu không NaN', () => {
    const w = (p: any) => {
      const r = render(<ThanhTrenThiM3 {...goc} {...p} />)
      const bar = r.container.querySelector('.thi-tien-do') as HTMLElement
      const day = r.container.querySelector('.thi-tien-do-day') as HTMLElement
      const kq = [bar.getAttribute('aria-valuenow'), bar.getAttribute('aria-valuemax'), day.style.width]
      r.unmount()
      return kq
    }
    expect(w({ daLam: 12, tong: 28 })).toEqual(['12', '28', `${(12 / 28) * 100}%`])
    expect(w({ daLam: 30, tong: 28 })[2]).toBe('100%')
    expect(w({ daLam: 0, tong: 0 })[2]).toBe('0%')
  })
})

describe('ThanhTrenThiM3 — hợp đồng với màn thi', () => {
  it('CAO_THANH_TREN = 56 và thanh M3 cao đúng 56 px (tấm giữ-để-đọc + dải cảnh báo rời màn dựa vào con số này)', () => {
    expect(CAO_THANH_TREN).toBe(56)
    const css = doc('src/screens/man-thi-m3.css')
    expect(css).toMatch(/\.m3 \.thi-tren \{[^}]*height: 56px/)
    expect(css).toMatch(/\.m3 \.thi-tren-hang \{[^}]*height: 56px/)
  })

  it('CSS: chỉ biến --m3-*, không hex/rgb, không position:fixed, không z-index (lớp z-30 do màn thi giữ), mọi luật dưới `.m3`, tắt chuyển động khi giảm chuyển động', () => {
    const css = doc('src/screens/man-thi-m3.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|position:\s*fixed|z-index/)
    for (const m of css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.m3 '), b).toBe(true)
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
  })

  it('ExamTakeScreen: đường học sinh (dungM3) dùng thanh M3 trong khung sticky z-30; đường khác giữ thanh cũ NGUYÊN VĂN', () => {
    const man = doc('src/screens/ExamTakeScreen.tsx')
    expect(man).toMatch(/import ThanhTrenThiM3 from '\.\/ThanhTrenThiM3'/)
    expect(man).toMatch(/\{dungM3\(\) \? \(\s*<div className="sticky top-0 z-30">\s*<ThanhTrenThiM3/)
    expect(man).toContain("style={{ height: 56, background: 'var(--the-mo)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--vien)' }}")
    // mọi giá trị đưa vào thanh là giá trị ĐÃ CÓ của màn (không tính mới, không gọi mới)
    for (const s of ['dongHo={laBaiTap ? null : formatClock(remaining ?? 0)}', 'gap={!laBaiTap && gapNow}', 'nhanLuu={dotLabel}', 'mayNgoaiMang={!online}', 'onMoLuoi={() => setShowGrid(true)}']) expect(man, s).toContain(s)
  })

  it('cổng học sinh chừa chỗ bên phải cho nút "Đóng phòng thi" (--thi-le-phai) để không che nút danh sách câu; thanh M3 đọc đúng biến ấy', () => {
    expect(doc('src/screens/StudentPortalScreen.tsx')).toMatch(/style=\{\{ '--thi-le-phai': '52px' \} as React\.CSSProperties\}/)
    expect(doc('src/screens/man-thi-m3.css')).toContain('var(--thi-le-phai, 0px)')
  })
})
