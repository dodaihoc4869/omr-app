// C10 bước 5 — cảnh báo rời màn, tấm giữ-để-đọc, thẻ khoá bài ở đường M3 (bản vẽ ThiCanhBao / ThiGiuDeDoc / ThiVaoVaKhoa).
// CHỈ đổi dáng: câu chữ, mức, role="alert", vị trí/z-index/cách bật-tắt của tấm giữ-để-đọc, mọi chữ của thẻ khoá giữ NGUYÊN; đường không phải học sinh y hệt cũ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ManGiuDeDoc, { CAO_THANH_TREN } from '../src/components/ManGiuDeDoc'
import { DaiCanhBaoRoiM3, KhungKhoaM3 } from '../src/screens/ThongBaoThiM3'
import { CHU_TAM_PHU } from '../src/lib/giu-de-doc'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  datDuong('/')
})

describe('DaiCanhBaoRoiM3 / KhungKhoaM3', () => {
  it('dải cảnh báo: chữ NGUYÊN VĂN của màn thi, mức nhe/dam đi vào data-muc, biểu tượng không đọc lên', () => {
    for (const muc of ['nhe', 'dam'] as const) {
      const loi = muc === 'nhe' ? 'Em vừa rời khỏi bài làm (lần 1). Thầy sẽ thấy điều này.' : 'Rời khỏi bài làm lần 2. Còn 1 lần nữa là bài bị khoá — rời quá 10 giây cũng khoá.'
      const { container, unmount } = render(<DaiCanhBaoRoiM3 muc={muc} loi={loi} />)
      const e = container.querySelector('.thi-canh-bao')!
      expect(e.getAttribute('data-muc')).toBe(muc)
      expect(e.querySelector('.thi-canh-bao-loi')!.textContent).toBe(loi)
      expect(e.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
      unmount()
    }
  })

  it('khung khoá: bọc nguyên nội dung truyền vào, không thêm chữ', () => {
    const { container } = render(<KhungKhoaM3><p>BÀI THI ĐÃ KHOÁ</p><button>Gửi lại ngay</button></KhungKhoaM3>)
    expect(container.querySelector('.thi-khoa')!.textContent).toBe('BÀI THI ĐÃ KHOÁGửi lại ngay')
    expect(screen.getByRole('button', { name: 'Gửi lại ngay' })).toBeTruthy()
  })
})

describe('ManGiuDeDoc — chỉ đổi dáng ở đường học sinh', () => {
  it('đường học sinh (/hs): bàn tay 52 trong vòng `thi-giu-de-tron`; thẻ ngoài NGUYÊN: data-giu-de-phu, aria-hidden, fixed top CAO_THANH_TREN, z-index token, nhận chạm, chữ CHU_TAM_PHU', () => {
    datDuong('/hs')
    const { container } = render(<ManGiuDeDoc />)
    const t = container.querySelector('[data-giu-de-phu]') as HTMLElement
    expect(t.getAttribute('aria-hidden')).toBe('true')
    expect(t.style.position).toBe('fixed')
    expect(t.style.top).toBe(`${CAO_THANH_TREN}px`)
    expect(t.style.zIndex).toBe('var(--z-giu-de)')
    expect(t.style.pointerEvents).not.toBe('none')
    expect(t.style.touchAction).toBe('none')
    expect(t.textContent).toBe(CHU_TAM_PHU)
    const tron = t.querySelector('.thi-giu-de-tron')!
    expect(tron.querySelector('svg')!.getAttribute('width')).toBe('52')
  })

  it('đường giáo viên/mặc định (`/`): KHÔNG có vòng tròn M3, bàn tay 40 màu --mo như cũ', () => {
    datDuong('/')
    const { container } = render(<ManGiuDeDoc />)
    expect(container.querySelector('.thi-giu-de-tron')).toBeNull()
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('40')
    expect(svg.getAttribute('style')).toContain('var(--mo)')
    expect(container.querySelector('[data-giu-de-phu]')!.textContent).toBe(CHU_TAM_PHU)
  })
})

describe('nối vào màn thi (khoá nguồn)', () => {
  const man = doc('src/screens/ExamTakeScreen.tsx')

  it('dải cảnh báo rời màn: đường học sinh dùng dải M3 trong khung sticky z-30 top 56 GIỮ role="alert" + data-canh-bao; đường khác NGUYÊN VĂN', () => {
    expect(man).toMatch(/\{canhBaoRoi &&\s*\(dungM3\(\) \? \(\s*<div className="sticky z-30" style=\{\{ top: 56 \}\} role="alert" data-canh-bao=\{canhBaoRoi\.muc\}>\s*<DaiCanhBaoRoiM3 muc=\{canhBaoRoi\.muc\} loi=\{canhBaoRoi\.loi\} \/>/)
    expect(man).toContain(`<div className="sticky z-30 px-3 sm:px-4" style={{ top: 56, paddingTop: 'var(--k2)', background: 'var(--nen)' }} role="alert" data-canh-bao={canhBaoRoi.muc}>`)
    expect(man).toContain("<OThongBao tone={canhBaoRoi.muc === 'dam' ? 'do' : 'cam'}>")
  })

  it('thẻ khoá bài: khung chọn theo dungM3, biểu tượng khoá chỉ ở M3 (cũ giữ TriangleAlert), MỌI câu chữ và điều kiện cũ còn nguyên', () => {
    expect(man).toContain("const KhungKhoa: React.ComponentType<{ children: React.ReactNode }> = dungM3() ? KhungKhoaM3 : TheNoiDung")
    expect(man).toContain("{dungM3() ? <Lock size={32} aria-hidden=\"true\" /> : <TriangleAlert size={40} style={{ color: 'var(--do)' }} />}")
    expect((man.match(/<KhungKhoa>/g) || []).length).toBe(1)
    expect((man.match(/<\/KhungKhoa>/g) || []).length).toBe(1)
    for (const cu of ['BÀI THI ĐÃ KHOÁ', 'Phần đã làm được <b>nộp và khoá</b>. Hệ thống đã báo cho thầy. <b>Em giơ tay gọi Thầy</b>', 'LOI_KHOA[attempt.integrity.lyDoKhoa as LyDoKhoaMoi]', "attempt.integrity.lyDoKhoa === 'roi_qua_lau'", 'if (attempt?.integrity.blocked && !xemLai) {', 'Gửi lại ngay', "'Đang gửi lên hệ thống… đừng tắt trình duyệt'"]) expect(man, cu).toContain(cu)
  })
})

describe('CSS', () => {
  const css = doc('src/screens/man-thi-m3.css').replace(/\/\*[\s\S]*?\*\//g, '')
  it('mọi luật dưới `.m3`, chỉ token, không hex/rgb/fixed/z-index', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|position:\s*fixed|z-index/)
    for (const m of css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.m3 '), b).toBe(true)
  })

  it('tấm giữ-để-đọc: CSS M3 chỉ đổi TOKEN cục bộ + vòng tròn 112 px — KHÔNG chạm display / position / top / z-index / pointer-events (chốt an toàn chống chụp đề)', () => {
    const luat = css.match(/\.m3 \[data-giu-de-phu\][^{]*\{[^}]*\}/g) || []
    expect(luat.length).toBe(1)
    expect(luat[0]).toMatch(/--nen: var\(--m3-surface-container\);\s*--cx-3: 22px;/)
    expect(luat[0]).not.toMatch(/display|position|top:|bottom|left|right|z-index|pointer-events|visibility|opacity/)
    expect(css).toMatch(/\.m3 \.thi-giu-de-tron \{[^}]*width: 112px; height: 112px/)
    const g = doc('src/index.css')
    expect(g).toMatch(/\[data-giu-de-phu\] \{\s*display: none;/)
    expect(g).toMatch(/html\[data-giu-de-an\] \[data-giu-de-phu\] \{\s*display: flex;/)
  })

  it('dải cảnh báo: nặng = errorContainer; thẻ khoá: errorContainer + chữ onErrorContainer', () => {
    expect(css).toMatch(/\.m3 \.thi-canh-bao\[data-muc='dam'\] \{ background: var\(--m3-error-container\); color: var\(--m3-on-error-container\); \}/)
    expect(css).toMatch(/\.m3 \.thi-khoa \{[^}]*background: var\(--m3-error-container\); color: var\(--m3-on-error-container\);/)
  })
})
