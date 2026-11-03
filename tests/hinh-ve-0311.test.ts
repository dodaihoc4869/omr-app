// Bộ kiểm hình của đề vẽ lại (thầy 03/11): không thêm thông tin ngoài ảnh, hai lượt phiên âm phải khớp.
import { describe, expect, it } from 'vitest'
import { chuanChuHinh, hinhVeDungDuoc, kiemCanhHinh, phienAmKhop } from '../src/lib/hinh-ve/kieu'

const PHIEN_AM = ['NH3(g) + O2(g)', 'X(g)', 'Hợp chất T', 'Acid (Y)', '(1)', 't°, Pt(s)', '(2)', 'O2(g)']
const soDo = (o: object = {}) => ({ tieuDe: 'Sơ đồ chuyển hoá', canh: { loai: 'so-do', o: [{ id: 'a', chu: 'NH₃(g) + O₂(g)', x: 20, y: 6 }, { id: 'x', chu: 'X(g)', x: 20, y: 26 }, { id: 't', chu: 'Hợp chất T', x: 20, y: 46 }],
  noi: [{ tu: ['a'], den: 'x', so: '1', nhan: 't°, Pt(s)' }, { tu: ['x'], den: 't', so: '2', nhan: 'O₂(g)' }], ...o } })

describe('kiemCanhHinh', () => {
  it('chỉ số Unicode = chỉ số thường; chữ có trong ảnh ⇒ giữ', () => {
    expect(chuanChuHinh('H₂SO₄')).toBe(chuanChuHinh('H2SO4'))
    const k = kiemCanhHinh(soDo(), PHIEN_AM)
    expect(k.ok).toBe(true)
  })
  it('chữ ngoài ảnh (máy «đoán» danh chất cho ẩn X) ⇒ bỏ', () => {
    const sai = soDo({ o: [{ id: 'a', chu: 'NH3(g) + O2(g)', x: 20, y: 6 }, { id: 'x', chu: 'NO(g)', x: 20, y: 26 }, { id: 't', chu: 'Hợp chất T', x: 20, y: 46 }] })
    const k = kiemCanhHinh(sai, PHIEN_AM)
    expect(k.ok).toBe(false)
    expect((k as { lyDo: string }).lyDo).toMatch(/không có trong ảnh gốc/)
  })
  it('mũi tên trỏ ô không có / toạ độ ngoài khung ⇒ bỏ', () => {
    expect(kiemCanhHinh(soDo({ noi: [{ tu: ['a'], den: 'zz' }] }), PHIEN_AM).ok).toBe(false)
    expect(kiemCanhHinh(soDo({ o: [{ id: 'a', chu: 'X(g)', x: 150, y: 6 }, { id: 'x', chu: 'X(g)', x: 20, y: 26 }] }), PHIEN_AM).ok).toBe(false)
  })
  it('đồ thị: que trong trục, nhãn có trong ảnh', () => {
    const dt = { tieuDe: 'Đồ thị', canh: { loai: 'do-thi', truc: { x: 'm/z', y: 'Tỉ lệ %', xMin: 11.5, xMax: 13.5, yMax: 90, xVach: [12, 12.5, 13], yVach: [20, 40] }, que: [{ x: 12, y: 78.99, nhan: '24Mg (78,99%)' }] } }
    expect(kiemCanhHinh(dt, ['m/z', 'Tỉ lệ %', '12', '12,5', '13', '20', '40', '24Mg (78,99%)']).ok).toBe(true)
    expect(kiemCanhHinh({ ...dt, canh: { ...dt.canh, que: [{ x: 20, y: 5 }] } }, ['m/z', 'Tỉ lệ %', '12', '13', '20', '40']).ok).toBe(false)
  })
  it('tiêu đề tự đặt nêu thêm thông tin ⇒ bỏ; chú thích có trong ảnh ⇒ giữ', () => {
    expect(kiemCanhHinh({ ...soDo(), tieuDe: 'Sản xuất phân đạm urê' }, PHIEN_AM).ok).toBe(false)
    expect(kiemCanhHinh({ ...soDo(), tieuDe: 'Hợp chất T' }, PHIEN_AM).ok).toBe(true)
  })
  it('hai lượt phiên âm: khớp ⇒ true; lệch nhiều ⇒ false', () => {
    expect(phienAmKhop(['Bình cầu', 'Sinh hàn', 'Nước vào'], ['Nước vào', 'Bình cầu', 'Sinh hàn'])).toBe(true)
    expect(phienAmKhop(['Bình cầu', 'Sinh hàn', 'Nước vào'], ['Cốc', 'Phễu', 'Đèn cồn'])).toBe(false)
  })
  it('app: cảnh từ máy chủ đúng khuôn dùng được; sai phiên bản ⇒ null', () => {
    const k = kiemCanhHinh(soDo(), PHIEN_AM)
    expect(k.ok && hinhVeDungDuoc(k.hinh)).toBeTruthy()
    expect(hinhVeDungDuoc({ phienBan: 9, tieuDe: 'x', canh: {} })).toBeNull()
  })
})

it('app: cảnh có tiêu đề là chú thích trong ảnh vẫn dùng được', () => {
  const k = kiemCanhHinh({ ...soDo(), tieuDe: 'Hợp chất T' }, PHIEN_AM)
  expect(k.ok && hinhVeDungDuoc(k.hinh)).toBeTruthy()
})
