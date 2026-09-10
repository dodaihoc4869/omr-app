// LÕI ĐO TẢI — phép tính phân vị mà sai thì cả bảng nghiệm thu sai theo, và
// không ai nhận ra vì con số vẫn trông như con số.
//
// KHACPHUCTREOHANGLOAT.md mục 1 bắt đo trước khi sửa, mục 3 bắt in TRƯỚC/SAU.
// Cả hai chỉ có nghĩa nếu phép đo đúng.
import { describe, expect, it } from 'vitest'
import { banDongThoi, doMot, dongBang, phanVi, sbdThu, tomTat, type MotLuot } from '../src/lib/do-tai-loi'

describe('PHÂN VỊ — luôn chỉ vào một lượt gọi CÓ THẬT', () => {
  const ds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

  it('p50 và p95 của 10 mẫu', () => {
    expect(phanVi(ds, 50)).toBe(50)
    expect(phanVi(ds, 95)).toBe(100)
  })

  it('KHÔNG nội suy — kết quả phải là một giá trị có trong mảng', () => {
    for (const p of [1, 25, 50, 75, 90, 95, 99, 100]) expect(ds).toContain(phanVi(ds, p))
  })

  it('không phụ thuộc thứ tự đầu vào', () => {
    expect(phanVi([...ds].reverse(), 95)).toBe(100)
    expect(phanVi([50, 10, 90, 30], 50)).toBe(30)
  })

  it('mảng rỗng trả 0, không nổ', () => {
    expect(phanVi([], 95)).toBe(0)
  })

  it('một mẫu thì mọi phân vị đều là nó', () => {
    expect(phanVi([7], 50)).toBe(7)
    expect(phanVi([7], 95)).toBe(7)
  })
})

describe('TÓM TẮT — lượt HỎNG vẫn phải vào bảng', () => {
  const ds: MotLuot[] = [
    { ms: 100, ok: true, khoaMs: 20 },
    { ms: 200, ok: true, khoaMs: 40 },
    { ms: 25000, ok: false, loi: 'Máy chủ không trả lời sau 25 giây' },
    { ms: 300, ok: true, khoaMs: 60 },
  ]
  const t = tomTat('vaoThi', ds)

  it('đếm đúng số hỏng và tỉ lệ', () => {
    expect(t.soHong).toBe(1)
    expect(t.tiLeHong).toBeCloseTo(0.25, 3)
  })

  it('thời gian của lượt HỎNG vẫn tính vào p95/max — hỏng ở giây 25 khác hỏng ở giây 1', () => {
    expect(t.max).toBe(25000)
    expect(t.p95).toBe(25000)
  })

  it('gộp các câu lỗi KHÁC NHAU, không in ba mươi dòng giống hệt', () => {
    const nhieu = tomTat('x', [
      { ms: 1, ok: false, loi: 'A' },
      { ms: 1, ok: false, loi: 'A' },
      { ms: 1, ok: false, loi: 'B' },
    ])
    expect(nhieu.loi.sort()).toEqual(['A', 'B'])
  })

  it('vùng khoá tính riêng, và chỉ khi máy chủ có báo', () => {
    expect(t.khoaP50).toBe(40)
    expect(t.khoaMax).toBe(60)
    expect(tomTat('y', [{ ms: 5, ok: true }]).khoaP50).toBeNull()
  })
})

describe('BẮN ĐỒNG THỜI — phải là đồng thời THẬT', () => {
  it('30 lượt khởi hành cùng lúc, không xếp hàng', async () => {
    let dangChay = 0
    let dinhCao = 0
    const ra = await banDongThoi(30, async () => {
      dangChay += 1
      dinhCao = Math.max(dinhCao, dangChay)
      await new Promise((r) => setTimeout(r, 20))
      dangChay -= 1
      return { ms: 20, ok: true }
    })
    // eslint-disable-next-line no-console
    console.log(`[đo tải] 30 lượt · đỉnh cao đồng thời ${dinhCao}`)
    expect(ra).toHaveLength(30)
    expect(dinhCao).toBe(30)
  })

  it('một lượt NÉM lỗi không được làm mất số liệu của cả lô', async () => {
    const ra = await banDongThoi(5, async (i) => {
      if (i === 2) throw new Error('mạng đứt')
      return { ms: 1, ok: true }
    })
    expect(ra).toHaveLength(5)
    expect(ra.filter((x) => !x.ok)).toHaveLength(1)
    expect(ra[2].loi).toBe('mạng đứt')
  })
})

describe('doMot — bấm giờ và nuốt lỗi', () => {
  it('máy chủ trả ok:false là HỎNG, dù lượt gọi mạng thành công', async () => {
    const r = await doMot(async () => ({ ok: false, error: 'Không có ca' }))
    expect(r.ok).toBe(false)
    expect(r.loi).toBe('Không có ca')
  })

  it('ném lỗi cũng ghi lại được thời gian tới lúc ném', async () => {
    const r = await doMot(async () => {
      await new Promise((x) => setTimeout(x, 15))
      throw new Error('đứt')
    })
    expect(r.ok).toBe(false)
    expect(r.ms).toBeGreaterThanOrEqual(10)
  })

  it('đọc `khoaMs` khi máy chủ báo về', async () => {
    expect((await doMot(async () => ({ ok: true, khoaMs: 123 }))).khoaMs).toBe(123)
  })
})

describe('SBD THỬ — mục 4 cấm chạm SBD thật', () => {
  it('luôn mang tiền tố TEST và đủ bốn chữ số', () => {
    expect(sbdThu(0)).toBe('TEST0001')
    expect(sbdThu(29)).toBe('TEST0030')
    for (let i = 0; i < 50; i++) expect(sbdThu(i)).toMatch(/^TEST\d{4}$/)
  })

  it('KHÔNG trùng dạng SBD thật của thầy (5 chữ số, bắt đầu bằng 1)', () => {
    expect(sbdThu(0)).not.toMatch(/^\d+$/)
  })
})

describe('DÒNG BẢNG đọc được bằng mắt', () => {
  it('in đủ hỏng, p50, p95, max', () => {
    const s = dongBang(tomTat('submit', [{ ms: 1200, ok: true }, { ms: 3400, ok: false, loi: 'x' }]))
    expect(s).toContain('submit')
    expect(s).toContain('hỏng')
    expect(s).toContain('p95')
  })
})
