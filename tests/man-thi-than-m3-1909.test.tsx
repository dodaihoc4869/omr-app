// C10 bước 3 — THÂN màn thi thật ở đường M3: dải "Còn N câu chưa làm" bấm số để tới câu, đầu phần theo bản vẽ, nhãn "Mới x/4 ý" cho câu Phần II làm dở.
// Chỉ trình bày lại dữ liệu/hàm ĐÃ CÓ (`chuaLam`, `cuonToiCau`, mở lưới, đáp án Phần II); đường không phải học sinh giữ nguyên.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import DaiCauChuaLamM3, { KhungCauLamDoM3, SO_CAU_TOI_DA_TREN_DAI } from '../src/screens/DaiCauChuaLamM3'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
afterEach(() => cleanup())

describe('DaiCauChuaLamM3', () => {
  it('không còn câu nào chưa làm ⇒ không dựng gì', () => {
    const { container } = render(<DaiCauChuaLamM3 chuaLam={[]} onToiCau={() => {}} onMoLuoi={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('"Còn N câu chưa làm" + gợi ý; tối đa 6 số, rồi ô "+K" mở lưới; số đầu = câu kế tiếp; tên từng nút cho trình đọc màn hình', () => {
    expect(SO_CAU_TOI_DA_TREN_DAI).toBe(6)
    const cho = Array.from({ length: 12 }, (_, i) => i + 1)
    const { container } = render(<DaiCauChuaLamM3 chuaLam={cho} onToiCau={() => {}} onMoLuoi={() => {}} />)
    expect(screen.getByRole('region', { name: 'Còn 12 câu chưa làm' })).toBeTruthy()
    expect(container.querySelector('.thi-dai-chua-lam-so')!.textContent).toBe('Còn 12 câu chưa làm')
    expect(container.querySelector('.thi-dai-chua-lam-goi-y')!.textContent).toBe('chạm số để tới câu')
    const nut = [...container.querySelectorAll('button')]
    expect(nut.map((b) => b.textContent)).toEqual(['1', '2', '3', '4', '5', '6', '+6'])
    expect(nut.filter((b) => b.getAttribute('data-ke-tiep')).map((b) => b.textContent)).toEqual(['1'])
    expect(nut[0].getAttribute('aria-label')).toBe('Tới câu 1')
    expect(nut[6].getAttribute('aria-label')).toBe('Xem thêm 6 câu chưa làm')
    expect(nut.every((b) => b.getAttribute('type') === 'button')).toBe(true)
  })

  it('bấm một số gọi onToiCau đúng SỐ CÂU (kiểu number); bấm "+K" gọi onMoLuoi; đủ ≤ 6 câu thì không có ô "+K"', () => {
    const toi = vi.fn()
    const luoi = vi.fn()
    render(<DaiCauChuaLamM3 chuaLam={[4, 9, 13, 20, 21, 22, 30, 31]} onToiCau={toi} onMoLuoi={luoi} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tới câu 13' }))
    expect(toi).toHaveBeenCalledWith(13)
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm 2 câu chưa làm' }))
    expect(luoi).toHaveBeenCalledTimes(1)
    cleanup()
    render(<DaiCauChuaLamM3 chuaLam={[2, 3]} onToiCau={() => {}} onMoLuoi={() => {}} />)
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).toBeNull()
  })
})

describe('KhungCauLamDoM3 — nhãn "Mới x/4 ý" và KHÔNG dựng lại thẻ câu', () => {
  it('nhãn chỉ khi 1–3 ý đã chọn; 0 và 4 thì không', () => {
    for (const [soY, co] of [[0, false], [1, true], [2, true], [3, true], [4, false]] as const) {
      const { container, unmount } = render(<KhungCauLamDoM3 soY={soY}><p>thẻ</p></KhungCauLamDoM3>)
      const nhan = container.querySelector('.thi-cau-nhan')
      expect(!!nhan, `soY=${soY}`).toBe(co)
      if (co) expect(nhan!.textContent).toBe(`Mới ${soY}/4 ý`)
      unmount()
    }
  })

  it('đi 0 → 1 → 3 → 4 → 0 ý: phần tử DOM của thẻ câu vẫn là MỘT phần tử đó (không gỡ/dựng lại ⇒ không mất tiêu điểm khi em bấm ý đầu tiên); nhãn thật sự mọc/biến', () => {
    let dat: (n: number) => void = () => {}
    function Hop() {
      const [n, setN] = useState(0)
      dat = setN
      return (
        <KhungCauLamDoM3 soY={n}>
          <button data-the="1">thẻ câu</button>
        </KhungCauLamDoM3>
      )
    }
    const { container } = render(<Hop />)
    const nut0 = container.querySelector('[data-the]')!
    nut0.setAttribute('data-danh-dau', 'giu-nguyen')
    const thay = [] as string[]
    for (const n of [1, 3, 4, 0]) {
      act(() => dat(n))
      thay.push(`${n}:${container.querySelector('.thi-cau-nhan')?.textContent ?? '-'}`)
      const nay = container.querySelector('[data-the]')!
      expect(nay, `sau soY=${n}`).toBe(nut0)
      expect(nay.getAttribute('data-danh-dau')).toBe('giu-nguyen')
    }
    expect(thay).toEqual(['1:Mới 1/4 ý', '3:Mới 3/4 ý', '4:-', '0:-'])
  })
})

describe('nối vào màn thi (khoá nguồn) và CSS', () => {
  const man = doc('src/screens/ExamTakeScreen.tsx')

  it('đầu phần M3 dùng ĐÚNG chữ và số liệu của bản cũ (PHẦN {phan} — {tên} ({số} câu) + moTaBieuDiem); bản cũ nguyên văn cho đường khác', () => {
    expect(man).toMatch(/if \(dungM3\(\)\) \{\s*return \(\s*<div className="thi-dau-phan sticky z-20" style=\{\{ top: 56 \}\}>/)
    expect((man.match(/PHẦN \{phan\} — \{TEN_PHAN\[phan\]\} \(\{soCau\} câu\)/g) || []).length).toBe(2) // M3 + cũ
    expect((man.match(/\{moTaBieuDiem\(soCauBaPhan, phan\)\}/g) || []).length).toBe(2)
    expect(man).toContain(`<div className="sticky z-20 flex items-center" style={{ top: 56, background: 'var(--nen)', padding: 'var(--k3) 0', gap: 'var(--k3)' }}>`)
  })

  it('dải chưa làm nối đúng vào dữ liệu/hàm sẵn có và chỉ ở dungM3; Phần II: khung bọc chỉ ở dungM3, đường khác trả thẳng thẻ', () => {
    expect(man).toContain('{dungM3() && <DaiCauChuaLamM3 chuaLam={chuaLam} onToiCau={cuonToiCau} onMoLuoi={() => setShowGrid(true)} />}')
    expect(man).toMatch(/const soYDaChon = \(attempt\.answers\.phanII\[item\.qid\] \?\? \[\]\)\.filter\(\(x\) => x !== null && x !== undefined\)\.length/)
    expect(man).toMatch(/return dungM3\(\) \? \(\s*<KhungCauLamDoM3 key=\{item\.qid\} soY=\{soYDaChon\}>\s*\{theCau\}\s*<\/KhungCauLamDoM3>\s*\) : \(\s*theCau\s*\)/)
  })

  it('CSS: ô ≥ 48 px, dải ẩn từ 880 px (lưới cột trái thay), mọi luật dưới `.m3`, chỉ token, không hex/fixed/z-index', () => {
    const css = doc('src/screens/man-thi-m3.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|position:\s*fixed|z-index/)
    for (const m of css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.m3 '), b).toBe(true)
    expect(css).toMatch(/\.thi-dai-chua-lam-o button \{[^}]*min-width: 48px; height: 48px/)
    expect(css).toMatch(/@media \(min-width: 880px\) \{ \.m3 \.thi-dai-chua-lam \{ display: none; \} \}/)
    expect(doc('src/index.css')).toMatch(/@media \(min-width: 880px\) \{\s*\.thi-hai-cot/)
  })
})
