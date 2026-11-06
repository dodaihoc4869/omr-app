// «KHÔNG» TRONG ĐỀ THI (thầy 07/11: «in đậm chữ không trong đề thi nữa»): lib/chem-trinh-bay.tsx nay nạp CÙNG gói KaTeX (katex-goi.ts) ⇒ màn thi
// (TheCau `div.cau-de`) có đánh dấu. Chỉ cắm khi <html data-trong='hs'> — app thầy ('gv') và test không có data-trong giữ DOM y nguyên.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChemText } from '../src/lib/chem-format'
import { camNeuHs } from '../src/lib/chem-trinh-bay'

const DE = 'Phát biểu nào sau đây không đúng? Khí X không màu, có HCl.'
const ve = () => render(<div className="cau-de"><ChemText text={DE} /></div>).container

describe('«không» trong đề thi', () => {
  it('gói KaTeX kéo theo trình bày chữ app học sinh; ManLamBaiTap không import riêng; CSS đậm trong thân đề thi thắng luật chữ mảnh', () => {
    expect(readFileSync('src/lib/katex-goi.ts', 'utf8')).toMatch(/^import '\.\/chem-trinh-bay'/m)
    expect(readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')).not.toMatch(/^import '\.\.\/\.\.\/lib\/chem-trinh-bay'/m)
    expect(readFileSync('src/styles/trong-lam-bai.css', 'utf8')).toContain("html:root[data-trong='hs'] div.cau-de .ct-khong { font-weight: 900 !important; }")
  })

  it('không data-trong (test) / app thầy: gói KaTeX đã nạp nhưng KHÔNG cắm — DOM y nguyên', () => {
    expect(ve().querySelector('.ct-khong, .ct-l')).toBeNull()
    document.documentElement.dataset.trong = 'gv'
    try {
      expect(camNeuHs()).toBe(false)
      expect(ve().querySelector('.ct-khong, .ct-l')).toBeNull()
    } finally {
      delete document.documentElement.dataset.trong
    }
  })

  it('màn thi link /t (data-trong=hs, KHÔNG data-ht2): chỉ bọc «không» phủ định, không thêm span phương trình; «không màu» bỏ qua; chữ giữ nguyên', () => {
    document.documentElement.dataset.trong = 'hs'
    try {
      expect(camNeuHs()).toBe(true)
      const c = ve()
      expect([...c.querySelectorAll('div.cau-de .ct-khong')].map((x) => x.textContent?.normalize('NFC'))).toEqual(['không'])
      expect(c.querySelector('.ct-l')).toBeNull()
      expect(c.textContent).toBe(DE)
    } finally {
      delete document.documentElement.dataset.trong
    }
  })

  it('cổng học sinh (data-trong=hs + data-ht2): «không» + trình bày phương trình đủ (HCl có «l» đuôi)', () => {
    const g = document.documentElement
    g.dataset.trong = 'hs'
    g.setAttribute('data-ht2', '')
    try {
      const c = ve()
      expect(c.querySelectorAll('.ct-khong')).toHaveLength(1)
      expect(c.querySelector('.ct-l')?.textContent).toBe('HCl')
      expect(c.textContent).toBe(DE)
    } finally {
      delete g.dataset.trong
      g.removeAttribute('data-ht2')
    }
  })
})
