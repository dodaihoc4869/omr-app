// CÂY KHO ĐỀ — thầy chốt 12/09: "cho chọn theo cây thư mục chuẩn theo kho đề
// nhé. Cho tick nhiều."
//
// Phép kiểm ở đây dùng ĐÚNG những mã đề thật trong kho của thầy (ảnh chụp màn
// 23:15 ngày 11/09), không phải mã bịa: `12-C3-B8-D2`, `12-C2-ON`,
// `DH-12-C2-B4`. Mã bịa thì cây đẹp trên giấy mà vỡ trên kho thật.
import { describe, expect, it } from 'vitest'
import { docMaDe, dungCayKhoDe, trangThaiTick, type DeKhoTom } from '../src/lib/cay-kho-de'

const KHO: DeKhoTom[] = [
  { maDe: 'DH-12-C2-B4', tenDe: 'Bài 4. Glucose và fructose — Chuyên đề bài tập dạy thêm', soCau: 138 },
  { maDe: 'DH-12-C1-B3-D2', tenDe: 'Bài 3. Ôn tập chương 1 (Đề 2) — Chuyên đề bài tập dạy thêm', soCau: 28 },
  { maDe: '12-C3-B8-D2', tenDe: 'Bài 8. Amine', soCau: 124 },
  { maDe: '12-C3-B8-D1', tenDe: 'Bài 8. Amine', soCau: 124 },
  { maDe: '12-C2-ON', tenDe: 'Ôn tập chương 2', soCau: 15 },
  { maDe: '12-C2-B6-D2', tenDe: 'Bài 6. Tinh bột và cellulose', soCau: 134 },
]

describe('ĐỌC MÃ ĐỀ', () => {
  it('đọc đủ bốn tầng của mã chuẩn', () => {
    expect(docMaDe('12-C3-B8-D2')).toMatchObject({ lop: '12', chuong: '3', bai: '8', de: '2', dayThem: false, la: false })
  })

  it('nhận tiền tố dạy thêm', () => {
    expect(docMaDe('DH-12-C2-B4')).toMatchObject({ dayThem: true, lop: '12', chuong: '2', bai: '4' })
  })

  it('ÔN TẬP CHƯƠNG không có số bài — không được coi là mã hỏng', () => {
    const p = docMaDe('12-C2-ON')
    expect(p.bai).toBe('ON')
    expect(p.la).toBe(false)
  })

  it('mã lạ thì khai là lạ, KHÔNG đoán bừa một lớp', () => {
    const p = docMaDe('DE-THI-THU-SO-1')
    expect(p.la).toBe(true)
    expect(p.lop).toBe('')
  })
})

describe('DỰNG CÂY', () => {
  const cay = dungCayKhoDe(KHO)

  it('tầng một là lớp, và tách riêng nhánh dạy thêm', () => {
    const nhan = cay.map((n) => n.nhan)
    expect(nhan).toContain('Lớp 12')
    expect(nhan).toContain('Lớp 12 · dạy thêm')
  })

  it('hai tờ cùng bài nằm CHUNG một nhánh — đó là lý do làm cây', () => {
    const lop12 = cay.find((n) => n.nhan === 'Lớp 12')!
    const c3 = lop12.con.find((n) => n.nhan === 'Chương 3')!
    const bai8 = c3.con[0]
    expect(bai8.nhan).toBe('Bài 8. Amine')
    expect(bai8.con.map((x) => x.de!.maDe).sort()).toEqual(['12-C3-B8-D1', '12-C3-B8-D2'])
  })

  it('nhãn bài cắt phần đuôi dài sau dấu gạch — điện thoại 360px không đọc nổi cả câu', () => {
    const dh = cay.find((n) => n.nhan === 'Lớp 12 · dạy thêm')!
    const moiNhan = dh.con.flatMap((c) => c.con.map((b) => b.nhan))
    expect(moiNhan).toContain('Bài 4. Glucose và fructose')
    for (const x of moiNhan) expect(x).not.toContain('Chuyên đề bài tập dạy thêm')
  })

  it('mỗi nhánh cộng đúng số câu và gom đủ mã đề dưới nó', () => {
    const lop12 = cay.find((n) => n.nhan === 'Lớp 12')!
    const c3 = lop12.con.find((n) => n.nhan === 'Chương 3')!
    expect(c3.tongCau).toBe(248)
    expect(c3.moiMaDe.sort()).toEqual(['12-C3-B8-D1', '12-C3-B8-D2'])
  })

  it('KHÔNG bỏ sót tờ nào — mọi mã trong kho đều có mặt trên cây', () => {
    const tren = cay.flatMap((n) => n.moiMaDe).sort()
    expect(tren).toEqual(KHO.map((d) => d.maDe).sort())
  })

  it('chương và bài xếp theo SỐ, không theo chữ — "Bài 10" không được đứng trước "Bài 2"', () => {
    const cay2 = dungCayKhoDe([
      { maDe: '12-C1-B10-D1', tenDe: 'Bài 10. Ester', soCau: 10 },
      { maDe: '12-C1-B2-D1', tenDe: 'Bài 2. Lipid', soCau: 10 },
    ])
    const bai = cay2[0].con[0].con.map((x) => x.nhan)
    expect(bai).toEqual(['Bài 2. Lipid', 'Bài 10. Ester'])
  })
})

describe('TICK NHIỀU', () => {
  const cay = dungCayKhoDe(KHO)
  const lop12 = cay.find((n) => n.nhan === 'Lớp 12')!
  const c3 = lop12.con.find((n) => n.nhan === 'Chương 3')!

  it('chưa tick gì thì nhánh ở trạng thái không', () => {
    expect(trangThaiTick(c3, new Set())).toBe('khong')
  })

  it('tick một nửa nhánh thì hiện MỘT PHẦN, không hiện đã tick hết', () => {
    expect(trangThaiTick(c3, new Set(['12-C3-B8-D1']))).toBe('mot_phan')
  })

  it('tick đủ thì nhánh báo hết', () => {
    expect(trangThaiTick(c3, new Set(['12-C3-B8-D1', '12-C3-B8-D2']))).toBe('het')
  })
})
