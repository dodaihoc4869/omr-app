// C10 bước 3 — THÂN màn thi thật ở đường M3: dải "Còn N câu chưa làm" bấm số để tới câu, đầu phần theo bản vẽ, nhãn "Mới x/4 ý" cho câu Phần II làm dở.
// Chỉ trình bày lại dữ liệu/hàm ĐÃ CÓ (`chuaLam`, `cuonToiCau`, mở lưới, đáp án Phần II); đường không phải học sinh giữ nguyên.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import DaiCauChuaLamM3, { KhungCauM3, SO_CAU_TOI_DA_TREN_DAI } from '../src/screens/DaiCauChuaLamM3'

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

const khung = (p: any = {}) => ({ soY: 0, daDanhDau: false, onDoiDau: () => {}, ...p })

describe('KhungCauM3 — nhãn "Mới x/4 ý", nút "Xem lại sau", và KHÔNG dựng lại thẻ câu', () => {
  it('nhãn chỉ khi 1–3 ý đã chọn; 0 và 4 thì không', () => {
    for (const [soY, co] of [[0, false], [1, true], [2, true], [3, true], [4, false]] as const) {
      const { container, unmount } = render(<KhungCauM3 {...khung({ soY })}><p>thẻ</p></KhungCauM3>)
      const nhan = container.querySelector('.thi-cau-nhan')
      expect(!!nhan, `soY=${soY}`).toBe(co)
      if (co) expect(nhan!.textContent).toBe(`Mới ${soY}/4 ý`)
      unmount()
    }
  })

  it('nút "Xem lại sau": type=button, aria-pressed theo dấu, bấm gọi ĐÚNG MỘT lần onDoiDau; nhãn chữ giữ nguyên cả hai trạng thái', () => {
    const doi = vi.fn()
    const a = render(<KhungCauM3 {...khung({ onDoiDau: doi })}><p>thẻ</p></KhungCauM3>)
    let nut = screen.getByRole('button', { name: 'Xem lại sau' })
    expect(nut.getAttribute('type')).toBe('button')
    expect(nut.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(nut)
    expect(doi).toHaveBeenCalledTimes(1)
    a.unmount()
    render(<KhungCauM3 {...khung({ daDanhDau: true })}><p>thẻ</p></KhungCauM3>)
    nut = screen.getByRole('button', { name: 'Xem lại sau' })
    expect(nut.getAttribute('aria-pressed')).toBe('true')
    expect(nut.textContent).toBe('Xem lại sau')
  })

  it('đi 0 → 1 → 3 → 4 → 0 ý VÀ bật/tắt dấu: phần tử DOM của thẻ câu vẫn là MỘT phần tử đó (không gỡ/dựng lại ⇒ không mất tiêu điểm khi em bấm); nhãn thật sự mọc/biến', () => {
    let dat: (n: number, d: boolean) => void = () => {}
    function Hop() {
      const [n, setN] = useState(0)
      const [d, setD] = useState(false)
      dat = (a, b) => {
        setN(a)
        setD(b)
      }
      return (
        <KhungCauM3 soY={n} daDanhDau={d} onDoiDau={() => {}}>
          <button data-the="1">thẻ câu</button>
        </KhungCauM3>
      )
    }
    const { container } = render(<Hop />)
    const nut0 = container.querySelector('[data-the]')!
    nut0.setAttribute('data-danh-dau', 'giu-nguyen')
    const thay = [] as string[]
    for (const [n, d] of [[1, false], [3, true], [4, true], [0, false]] as [number, boolean][]) {
      act(() => dat(n, d))
      thay.push(`${n}:${container.querySelector('.thi-cau-nhan')?.textContent ?? '-'}:${container.querySelector('.thi-cau-dau')!.getAttribute('aria-pressed')}`)
      const nay = container.querySelector('[data-the]')!
      expect(nay, `sau soY=${n} dấu=${d}`).toBe(nut0)
      expect(nay.getAttribute('data-danh-dau')).toBe('giu-nguyen')
    }
    expect(thay).toEqual(['1:Mới 1/4 ý:false', '3:Mới 3/4 ý:true', '4:-:true', '0:-:false'])
  })
})

describe('DaiCauChuaLamM3 — dấu "xem lại"', () => {
  it('câu chưa làm có đánh dấu: nút mang dấu + tên "(đã đánh dấu xem lại)"; hàng "Đã đánh dấu xem lại" liệt kê kể cả câu ĐÃ làm', () => {
    const toi = vi.fn()
    const { container } = render(<DaiCauChuaLamM3 chuaLam={[2, 5, 8]} daDanhDau={[5, 11]} onToiCau={toi} onMoLuoi={() => {}} />)
    const nut5 = screen.getAllByRole('button', { name: 'Tới câu 5 (đã đánh dấu xem lại)' })
    expect(nut5.length).toBe(2) // một trong hàng chưa làm, một trong hàng đã đánh dấu
    expect(container.querySelectorAll('[data-danh-dau]').length).toBe(3) // hàng chưa làm: câu 5; hàng đánh dấu: câu 5 và 11
    expect(screen.getByText('Đã đánh dấu xem lại: 2 câu')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tới câu 11 (đã đánh dấu xem lại)' }))
    expect(toi).toHaveBeenCalledWith(11)
    expect(screen.getByRole('button', { name: 'Tới câu 2' }).getAttribute('data-danh-dau')).toBeNull()
  })

  it('hết câu chưa làm nhưng còn câu đánh dấu: dải vẫn hiện (chỉ hàng đánh dấu); không có gì cả ⇒ không dựng', () => {
    const a = render(<DaiCauChuaLamM3 chuaLam={[]} daDanhDau={[3]} onToiCau={() => {}} onMoLuoi={() => {}} />)
    expect(screen.getByRole('region', { name: 'Câu đã đánh dấu xem lại' })).toBeTruthy()
    expect(a.container.querySelector('.thi-dai-chua-lam-so')!.textContent).toBe('Đã đánh dấu xem lại: 1 câu')
    a.unmount()
    const b = render(<DaiCauChuaLamM3 chuaLam={[]} daDanhDau={[]} onToiCau={() => {}} onMoLuoi={() => {}} />)
    expect(b.container.firstChild).toBeNull()
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

  it('dải chưa làm nối đúng vào dữ liệu/hàm sẵn có và chỉ ở dungM3; MỌI thẻ câu qua bocCau: khung bọc chỉ ở dungM3, đường khác trả thẳng thẻ', () => {
    expect(man).toContain('{dungM3() && <DaiCauChuaLamM3 chuaLam={chuaLam} daDanhDau={sttDanhDau} onToiCau={cuonToiCau} onMoLuoi={() => setShowGrid(true)} />}')
    expect(man).toMatch(/const soYDaChon = \(attempt\.answers\.phanII\[item\.qid\] \?\? \[\]\)\.filter\(\(x\) => x !== null && x !== undefined\)\.length/)
    expect(man).toMatch(/const bocCau = \(qid: string, soY: number, the: React\.ReactElement\) =>\s*dungM3\(\) \? \(\s*<KhungCauM3 key=\{qid\} soY=\{soY\} daDanhDau=\{xemLaiSau\.has\(qid\)\} onDoiDau=\{\(\) => doiDauCau\(qid\)\}>\s*\{the\}\s*<\/KhungCauM3>\s*\) : \(\s*the\s*\)/)
    expect((man.match(/return bocCau\(/g) || []).length).toBe(3) // Phần I, II, III
  })

  it('HỢP ĐỒNG "XEM LẠI SAU": chỉ trạng thái giao diện — mã đánh dấu chỉ ở khai báo, hiệu ứng nạp, hàm đổi dấu và phần vẽ; KHÔNG bao giờ trong gói nộp/lưu/đẩy/`attempt`', () => {
    const dong = man.split('\n')
    const chiSo = (re: RegExp) => dong.map((l, i) => (re.test(l) ? i : -1)).filter((i) => i >= 0)
    const dauVet = /xemLaiSau|sttDanhDau|doiDauCau|luuXemLai|docXemLai|doiDauXemLai|qidCuaCau/
    const dungDau = chiSo(dauVet)
    expect(dungDau.length).toBeGreaterThan(10)
    // 1) khai báo + hiệu ứng nạp nằm SỚM (cạnh saveFlash), phần còn lại nằm SAU `const chuaLam` (phần vẽ) — không có dòng nào ở giữa
    const iSave = chiSo(/const \[saveFlash, setSaveFlash\]/)[0]
    const iChua = chiSo(/const chuaLam = flat\.map/)[0]
    for (const i of dungDau) expect(dong[i].startsWith('import ') || (i > iSave - 1 && i < iSave + 14) || i >= iChua, `dòng ${i + 1}: ${dong[i].trim().slice(0, 80)}`).toBe(true)
    // 2) không dòng nào của các hàm ĐẨY/LƯU/NỘP chứa dấu vết (mọi lời gọi này nằm trước phần vẽ)
    const dayLuuNop = chiSo(/submitAnswers\(|saveAttempt\(|luuTamMoi\(|pushExamStatus\(|sendParentFee|gradeFromKeyBank\(/)
    expect(dayLuuNop.length).toBeGreaterThan(5)
    for (const i of dayLuuNop) expect(dauVet.test(dong.slice(Math.max(0, i - 6), i + 12).join('\n')), `quanh dòng ${i + 1}`).toBe(false)
    // 3) `attempt` không bao giờ được đặt/phủ giá trị đánh dấu
    expect(man).not.toMatch(/\.\.\.attempt,[^}]*(xemLai|danhDau|sttDanhDau)/)
    expect(man).not.toMatch(/setAttempt\([^)]*(xemLai|danhDau)/)
  })

  it('đổi dấu: tính tập MỚI từ tập hiện tại, đặt state, LƯU vào khoá riêng theo ca + SBD; số câu của dấu = vị trí hiển thị (i + 1)', () => {
    expect(man).toMatch(/const doiDauCau = \(qid: string\) => \{\s*const moi = doiDauXemLai\(xemLaiSau, qid\)\s*setXemLaiSau\(moi\)\s*luuXemLai\(attempt\.maCa, attempt\.sbd, moi\)\s*\}/)
    expect(man).toContain('const sttDanhDau = flat.map((f, i) => (xemLaiSau.has(qidCuaCau(f)) ? i + 1 : 0)).filter((x) => x > 0)')
    expect(man).toMatch(/useEffect\(\(\) => \{\s*if \(maCaXemLai && sbdXemLai\) setXemLaiSau\(docXemLai\(maCaXemLai, sbdXemLai\)\)\s*\}, \[maCaXemLai, sbdXemLai\]\)/)
  })

  it('ô số của lưới (cột trái + tấm trượt) và hộp xác nhận nộp mang dấu; MỌI chữ cũ còn nguyên', () => {
    expect((man.match(/className=\{`tap-target aspect-square flex items-center justify-center font-bold\$\{dungM3\(\) \? ' thi-o-cau' : ''\}`\}/g) || []).length).toBe(2)
    expect((man.match(/<span className="thi-o-cau-co" role="img" aria-label="đã đánh dấu xem lại">/g) || []).length).toBe(2)
    expect(man).toContain("{dungM3() && sttDanhDau.length > 0 && (")
    expect(man).toContain('Em đã đánh dấu xem lại: câu {sttDanhDau.join')
    for (const cu of ['Còn {chuaLam.length} câu chưa làm: câu {chuaLam.join(\', \')}.', 'Sau khi nộp không sửa được nữa.', 'title={`Câu ${i + 1}${done ? \' — đã làm\' : \' — chưa làm\'}']) expect(man, cu).toContain(cu)
  })

  it('CSS: ô ≥ 48 px, dải ẩn từ 880 px (lưới cột trái thay), mọi luật dưới `.m3`, chỉ token, không hex/fixed/z-index', () => {
    const css = doc('src/screens/man-thi-m3.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|position:\s*fixed|z-index/)
    for (const m of css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.m3 '), b).toBe(true)
    expect(css).toMatch(/\.thi-dai-chua-lam-o button \{[^}]*min-width: 48px; height: 48px/)
    expect(css).toMatch(/\.m3 \.thi-cau-dau \{[^}]*min-width: 48px; height: 48px/) // nút "Xem lại sau" ≥ 48 px
    expect(css).toMatch(/\.m3 \.thi-cau-dau\[aria-pressed='true'\] \{/)
    expect(css).toMatch(/\.m3 \.thi-o-cau-co \{[^}]*background: var\(--m3-primary\); color: var\(--m3-on-primary\)/) // dấu cờ có nền riêng: nhìn rõ trên ô sáng lẫn tối
    expect(css).toMatch(/@media \(min-width: 880px\) \{ \.m3 \.thi-dai-chua-lam \{ display: none; \} \}/)
    expect(doc('src/index.css')).toMatch(/@media \(min-width: 880px\) \{\s*\.thi-hai-cot/)
  })
})
