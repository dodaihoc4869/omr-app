// @vitest-environment jsdom
// THỬ THÁCH KIM CƯƠNG HIỆN HÌNH CỦA CÂU (thầy 10/11 gửi ảnh màn «Câu 2/10 … Hình vẽ phổ khối nào dưới đây là đúng?» — bốn phương án chỉ còn chữ «(xem hình)»,
// và bốn nút thanh tab đè lên nút «Kiểm tra»: «Ko có hình bị lỗi hình sửa luôn»).
// Nguyên nhân gốc: (1) máy chủ gửi đủ hình (`publicQuestion`) nhưng bộ đọc `docPhienKimCuong` chỉ giữ chữ, màn chỉ vẽ chữ; (2) nút tab tự khai
// `visibility: visible` nên không thừa hưởng lệnh ẩn của khối cha khi màn thưởng toàn khung mở (kiểm Chromium thật: trước visible, sau hidden).
import { readFileSync } from 'node:fs'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { docPhienKimCuong } from '../src/lib/thuong-api'
import { ManKimCuong } from '../src/components/thuong/ManKimCuong'

afterEach(cleanup)
const ANH = (k: string) => `data:image/png;base64,${k}`
// Hình dạng đúng như máy chủ gửi (publicQuestion): phương án là ảnh ⇒ chữ giữ chỗ + ảnh ở hinhAnh[sau_pa_X]
const MAY_CHU = { ok: true, phien: 'kc1', ong: 3, cau: [
  { qid: 'q1', phan: 'I', text: 'Hình vẽ phổ khối nào dưới đây là đúng?', choices: ['(xem hình)', '(xem hình)', '(xem hình)', '(xem hình)'], ideas: [],
    hinhAnh: ['A', 'B', 'C', 'D'].map((k) => ({ src: ANH(k), viTri: `sau_pa_${k}` })) },
  { qid: 'q2', phan: 'I', text: 'Cho đồ thị sau. Giá trị x là', choices: ['1', '2', '3', '4'], ideas: [], imageDataUrl: ANH('DT'), table: [['Chất', 'pH'], ['X', '3']],
    hinhAnh: [{ src: ANH('SD'), viTri: 'sau_de', alt: 'Sơ đồ' }, { src: ANH('LG'), viTri: 'cuoi_cau' }] },
  { qid: 'q3', phan: 'I', text: 'Chọn công thức đúng', choices: ['a', 'b', 'c', 'd'], ideas: [], choiceImgs: [ANH('P0'), ANH('P1'), ANH('P2'), ANH('P3')], hinhAnh: [] },
  { qid: 'q4', phan: 'II', text: 'Xét các phát biểu', choices: [], ideas: ['ý a', 'ý b', 'ý c', 'ý d'], ideaImgs: ['', ANH('Yb'), '', ''], hinhAnh: [{ src: ANH('Yc'), viTri: 'sau_y_c' }] },
  { qid: 'q5', phan: 'I', text: 'Câu chỉ có chữ', choices: ['Na', 'K', 'Li', 'Cs'], ideas: [], hinhAnh: [] },
] }
const phien = docPhienKimCuong(MAY_CHU)!
const ve = (viTri: number) => render(<ManKimCuong token="tk" chuyenDe="nt" tenChuyenDe="Cấu tạo nguyên tử" onDong={() => {}} batDau={{ buoc: 'lam', phien, viTri, vo: 0, dung: 0 }} />).container
const srcs = (c: HTMLElement, chon: string) => [...c.querySelectorAll<HTMLImageElement>(chon)].map((i) => i.getAttribute('src'))

describe('bộ đọc giữ hình của câu', () => {
  it('giữ hinhAnh / choiceImgs / ideaImgs / imageDataUrl / table; câu không hình giữ nguyên hình dạng cũ', () => {
    expect(phien.cau[0]!.hinhAnh).toHaveLength(4)
    expect(phien.cau[1]).toMatchObject({ imageDataUrl: ANH('DT'), table: [['Chất', 'pH'], ['X', '3']] })
    expect(phien.cau[2]!.choiceImgs).toEqual([ANH('P0'), ANH('P1'), ANH('P2'), ANH('P3')])
    expect(phien.cau[3]!.ideaImgs).toEqual(['', ANH('Yb'), '', ''])
    expect(phien.cau[4]).toEqual({ qid: 'q5', phan: 'I', text: 'Câu chỉ có chữ', choices: ['Na', 'K', 'Li', 'Cs'], ideas: [] })
  })
  it('hình sai kiểu bị bỏ, không làm hỏng câu', () => {
    const p = docPhienKimCuong({ phien: 'x', cau: [{ qid: 'q', phan: 'I', text: 't', choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [{ src: 5, viTri: 'sau_de' }, null, { src: ANH('ok'), viTri: 'sau_de' }], choiceImgs: [null, 3], table: 'x' }] })!
    expect(p.cau[0]).toEqual({ qid: 'q', phan: 'I', text: 't', choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [{ src: ANH('ok'), viTri: 'sau_de' }] })
  })
})

describe('màn làm Thử thách Kim cương vẽ hình', () => {
  it('phương án là ảnh (ảnh thầy gửi): bốn ảnh nằm trong bốn ô, không còn chữ «(xem hình)», xếp một cột', () => {
    const c = ve(0)
    expect(srcs(c, '.tp-pa button img')).toEqual(['A', 'B', 'C', 'D'].map(ANH))
    expect(c.querySelector('.tp-pa')!.textContent).not.toContain('xem hình')
    expect(c.querySelector('.tp-pa')!.hasAttribute('data-luoi')).toBe(false)
    expect(c.querySelectorAll('.tp-pa button')).toHaveLength(4)
  })
  it('hình của đề: ảnh câu, hình sau đề, bảng số liệu, hình cuối câu', () => {
    const c = ve(1)
    expect(srcs(c, '.cau-hinh img')).toEqual([ANH('DT'), ANH('SD'), ANH('LG')])
    expect(c.querySelector('.cau-bang')!.textContent).toContain('pH')
    expect(c.querySelector('.tp-pa')!.hasAttribute('data-luoi')).toBe(true) // phương án chữ ngắn, không ảnh ⇒ vẫn lưới 2 cột như cũ
  })
  it('ảnh riêng của từng phương án (choiceImgs) và của từng ý Đúng/Sai (ideaImgs, sau_y_x)', () => {
    expect(srcs(ve(2), '.tp-pa button img')).toEqual([ANH('P0'), ANH('P1'), ANH('P2'), ANH('P3')])
    cleanup()
    const c = ve(3)
    expect(srcs(c, '.tp-ds img')).toEqual([ANH('Yb'), ANH('Yc')])
    expect(c.querySelector('.tp-ds')!.textContent).toContain('ý a')
  })
  it('câu chỉ có chữ: y như cũ, không sinh thẻ ảnh nào', () => {
    const c = ve(4)
    expect(c.querySelectorAll('img')).toHaveLength(0)
    expect(c.querySelector('.tp-pa')!.textContent).toContain('Na')
  })
})

describe('thanh tab không đè lên màn thưởng toàn khung', () => {
  it('tờ kiểu ẩn THẲNG từng nút tab khi <html data-tp-toan> / data-aid-tam (nút tự khai visibility: visible nên không thừa hưởng lệnh ẩn của khối cha)', () => {
    const css = readFileSync('src/styles/trong-kinh.css', 'utf8')
    expect(css).toMatch(/html\[data-trong='hs'\]:is\(\[data-aid-tam\], \[data-tp-toan\]\) \.kb-thanh :is\(\.kb-thanh-muc\.kb-thanh-muc, \.kb-thanh-ai\.kb-thanh-ai\) \{ visibility: hidden; \}/)
  })
})
