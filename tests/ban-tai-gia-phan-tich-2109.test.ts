// @vitest-environment node
// BỘ BẮN TẢI GIẢ — phần PHÂN TÍCH thuần (scripts/ban-tai-gia/phan-tich.mjs; Code 1, 21/09/2026): gom theo lệnh, ngân sách (≤ 8 truy vấn, ≤ 2.000 dòng; lệnh nộp ≤ 15 truy vấn), top truy vấn, bảng Markdown.
import { describe, expect, it } from 'vitest'
// @ts-expect-error — tệp .mjs không có kiểu
import { NGAN_SACH, gomTheoLenh, lapMarkdown, phanVi, topTruyVan } from '../scripts/ban-tai-gia/phan-tich.mjs'

const cau = (khung: string, doc: number, ms = 1) => ({ khung, doc, ghi: 0, msD1: ms, msTuong: ms, theoBatch: false })
const khach = (id: string, lenh: string, ms = 10, ma = 200, loi: string | null = null) => ({ id, lenh, ms, ma, loi })
const luot = (id: string, lenh: string, cacCau: ReturnType<typeof cau>[]) => ({ id, lenh, cau: cacCau })

describe('phanVi', () => {
  it('p50/p95 theo hạng gần nhất; rỗng ⇒ 0', () => {
    expect(phanVi([], 0.5)).toBe(0)
    expect(phanVi([5], 0.95)).toBe(5)
    expect(phanVi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.5)).toBe(5)
    expect(phanVi([10, 1, 5, 3, 2, 4, 9, 8, 7, 6], 0.95)).toBe(10)
  })
})

describe('gomTheoLenh — ngân sách', () => {
  const nhieuCau = (n: number, doc = 1) => Array.from({ length: n }, (_, i) => cau(`Q${i}`, doc))
  it('lệnh thường: > 8 truy vấn HOẶC > 2.000 dòng đọc là VƯỢT; đúng 8 truy vấn / 2.000 dòng thì không', () => {
    const k = [khach('a', 'hs/ke-hoach-ngay'), khach('b', 'hs/ca-dang-mo'), khach('c', 'hs/thi-dua-hom-nay')]
    const d = [luot('a', 'hs/ke-hoach-ngay', nhieuCau(9)), luot('b', 'hs/ca-dang-mo', nhieuCau(8, 250)), luot('c', 'hs/thi-dua-hom-nay', [cau('X', 2001)])]
    const b = gomTheoLenh(k, d)
    const theo = Object.fromEntries(b.map((x: { lenh: string }) => [x.lenh, x]))
    expect(theo['hs/ke-hoach-ngay'].vuot).toBe(true); expect(theo['hs/ke-hoach-ngay'].vuotTv).toBe(1)
    expect(theo['hs/ca-dang-mo'].vuot).toBe(false) // 8 truy vấn, đúng 2.000 dòng
    expect(theo['hs/thi-dua-hom-nay'].vuot).toBe(true); expect(theo['hs/thi-dua-hom-nay'].vuotDong).toBe(1)
  })
  it('lệnh NỘP có trần truy vấn 15: 12 truy vấn ở xong-lo không vượt, 12 ở ke-hoach-ngay vượt; 16 ở xong-lo vượt', () => {
    const k = [khach('a', 'btvn/xong-lo [nộp chặng]'), khach('b', 'hs/ke-hoach-ngay [nền]'), khach('c', 'hs/on-lai/nop [nộp ôn]')]
    const d = [luot('a', 'x', nhieuCau(12)), luot('b', 'y', nhieuCau(12)), luot('c', 'z', nhieuCau(16))]
    const theo = Object.fromEntries(gomTheoLenh(k, d).map((x: { lenh: string }) => [x.lenh, x]))
    expect(theo['btvn/xong-lo [nộp chặng]']).toMatchObject({ nop: true, tran: NGAN_SACH.truyVanNop, vuot: false })
    expect(theo['hs/ke-hoach-ngay [nền]']).toMatchObject({ nop: false, tran: NGAN_SACH.truyVan, vuot: true })
    expect(theo['hs/on-lai/nop [nộp ôn]']).toMatchObject({ nop: true, vuot: true })
  })
  it('đếm lỗi (mã ≥ 400 hoặc có `loi`); lượt thiếu sổ đo tính 0 truy vấn; trung bình và max đúng', () => {
    const k = [khach('a', 'L', 10, 200), khach('b', 'L', 30, 500), khach('c', 'L', 20, 200, 'từ chối'), khach('d', 'L', 40, 200)]
    const d = [luot('a', 'L', nhieuCau(2, 10)), luot('b', 'L', nhieuCau(4, 10)), luot('c', 'L', nhieuCau(6, 10))] // 'd' không có sổ
    const [b] = gomTheoLenh(k, d)
    expect(b).toMatchObject({ n: 4, loi: 2, tvMax: 6, docMax: 60 })
    expect(b.tvTb).toBeCloseTo(3, 5) // (2+4+6+0)/4
    expect(b.ms50).toBe(20)
  })
})

describe('topTruyVan + lapMarkdown', () => {
  const d = [
    luot('a', 'hs/thi-dua-hom-nay', [cau('SELECT NANG', 5000), cau('SELECT NHE', 3)]),
    luot('b', 'hs/thi-dua-hom-nay', [cau('SELECT NANG', 4000)]),
    luot('c', 'hs/ke-hoach-ngay', [cau('SELECT NHE', 3)]),
  ]
  it('gộp theo khung, xếp theo TỔNG dòng đọc, nêu lệnh gọi nhiều nhất', () => {
    const t = topTruyVan(d, 5)
    expect(t[0]).toMatchObject({ khung: 'SELECT NANG', lan: 2, doc: 9000, lenhChinh: 'hs/thi-dua-hom-nay' })
    expect(t[1]).toMatchObject({ khung: 'SELECT NHE', lan: 2, doc: 6 })
  })
  it('bảng Markdown: có tiêu đề mã commit, mục lệnh VƯỢT và top truy vấn; kết luận ❌ khi có lệnh vượt, ✅ khi không', () => {
    const cauHinh = { soEm: 250, phut: 10, nhanh: 1, nhipNenGiay: 180, thoiGianThatGiay: 600, saoLuu: 'omr-d1-x.sql' }
    const md = lapMarkdown({ ma: 'abc1234', batDau: '2026-09-21 22:00:00 (giờ VN)', cauHinh, khach: [khach('a', 'hs/thi-dua-hom-nay'), khach('c', 'hs/ke-hoach-ngay')], dump: d, ghiChu: ['ghi chú thử'] })
    expect(md).toContain('# Bản đo tải giả — abc1234')
    expect(md).toContain('## 2. Lệnh VƯỢT ngân sách')
    expect(md).toMatch(/❌ \*\*1\/2 lệnh VƯỢT ngân sách\*\*/)
    expect(md).toContain('`hs/thi-dua-hom-nay`')
    expect(md).toContain('SELECT NANG')
    expect(md).toContain('ghi chú thử')
    const sach = lapMarkdown({ ma: 'k', batDau: 'x', cauHinh, khach: [khach('c', 'hs/ke-hoach-ngay')], dump: [d[2]], ghiChu: [] })
    expect(sach).toContain('✅ không lệnh nào vượt ngân sách')
  })
})
