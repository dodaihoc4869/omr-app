// THỬ THÁCH KIM CƯƠNG MẤT HÌNH (thầy 09/11: «nhiều câu trong luyện kim cương bị mất hình ảnh»).
// Gốc: máy chủ gửi đủ hình (publicQuestion), nhưng bộ đọc `docPhienKimCuong` chỉ giữ chữ và màn chỉ vẽ `q.text` ⇒ câu có ảnh đề / ảnh phương án / hình
// sau đề mất hình (câu chỉ có ảnh cả đề `thanCauImg` hiện trống trơn). Sửa: bộ đọc giữ trường hình, màn vẽ đủ vị trí như màn luyện.
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { docPhienKimCuong } from '../src/lib/thuong-api'
import { ManKimCuong } from '../src/components/thuong/ManThuong'

afterEach(cleanup)

const cau = (o: Record<string, unknown>) => ({ qid: 'q', phan: 'I', text: 'Đề', choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], ...o })

describe('Kim cương giữ và vẽ hình câu', () => {
  it('bộ đọc giữ thanCauImg, imageDataUrl, table, choiceImgs, ideaImgs, hinhAnh', () => {
    const p = docPhienKimCuong({ phien: 'p', ong: 3, cau: [cau({ thanCauImg: 'https://x/than.png', imageDataUrl: 'data:image/png;base64,AA', table: [['A', 'B'], ['1', '2']],
      choiceImgs: ['', 'https://x/b.png', '', ''], ideaImgs: ['https://x/ya.png'], hinhAnh: [{ src: 'https://x/h.png', viTri: 'sau_de', alt: 'Đồ thị' }, { src: 1, viTri: 'sau_de' }] })] })!
    const q = p.cau[0]!
    expect(q.thanCauImg).toBe('https://x/than.png')
    expect(q.imageDataUrl).toBe('data:image/png;base64,AA')
    expect(q.table).toEqual([['A', 'B'], ['1', '2']])
    expect(q.choiceImgs).toEqual(['', 'https://x/b.png', '', ''])
    expect(q.ideaImgs).toEqual(['https://x/ya.png'])
    expect(q.hinhAnh).toEqual([{ src: 'https://x/h.png', viTri: 'sau_de', alt: 'Đồ thị' }])
  })
  it('màn làm câu vẽ ảnh đề, hình sau đề, ảnh phương án, hình sau phương án, hình cuối câu', () => {
    const q = docPhienKimCuong({ phien: 'p', ong: 3, cau: [cau({ text: '', thanCauImg: 'https://x/than.png', choices: ['', 'Hình B', 'c', 'd'], choiceImgs: ['https://x/a.png', '', '', ''],
      hinhAnh: [{ src: 'https://x/sau-de.png', viTri: 'sau_de' }, { src: 'https://x/pa-b.png', viTri: 'sau_pa_B' }, { src: 'https://x/cuoi.png', viTri: 'cuoi_cau' }, { src: 'https://x/lg.png', viTri: 'sau_loi_giai' }] })] })!
    const c = render(<ManKimCuong token="tk" chuyenDe="e" tenChuyenDe="Ester" onDong={() => {}} batDau={{ buoc: 'lam', phien: q, viTri: 0, vo: 0, dung: 0 }} />).container
    const src = [...c.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    for (const s of ['https://x/than.png', 'https://x/sau-de.png', 'https://x/a.png', 'https://x/pa-b.png', 'https://x/cuoi.png']) expect(src).toContain(s)
    expect(src).not.toContain('https://x/lg.png') // ảnh lời giải không hiện trước khi nộp
    expect(c.textContent).not.toMatch(/Hình B/) // chữ giữ chỗ nhường cho ảnh
  })
  it('câu Đúng/Sai: ảnh từng ý và hình sau ý', () => {
    const q = docPhienKimCuong({ phien: 'p', ong: 3, cau: [cau({ phan: 'II', choices: [], ideas: ['y1', 'y2', 'y3', 'y4'], ideaImgs: ['', 'https://x/yb.png', '', ''], hinhAnh: [{ src: 'https://x/sau-y-c.png', viTri: 'sau_y_c' }] })] })!
    const c = render(<ManKimCuong token="tk" chuyenDe="e" tenChuyenDe="Ester" onDong={() => {}} batDau={{ buoc: 'lam', phien: q, viTri: 0, vo: 0, dung: 0 }} />).container
    const src = [...c.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    expect(src).toEqual(expect.arrayContaining(['https://x/yb.png', 'https://x/sau-y-c.png']))
  })
})
