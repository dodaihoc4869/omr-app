// GỘP LƯỢT GỌI `danhSachCa` — lệnh bị gọi nhiều nhất trong app.
//
// ĐO 10/09 tối, máy chủ RẢNH (không ca nào đang thi): mỗi lượt 3,1 – 4,9 giây.
// 11 chỗ trong app gọi lệnh này. Thầy mở màn Ca thi, sang màn Học sinh, quay
// lại — ba lượt gọi cho cùng một danh sách 10 ca, mười giây ngồi nhìn vòng
// xoay, trong khi danh sách ấy không đổi một chữ.
//
// Hai lớp: gộp lượt ĐANG BAY, và đệm ngắn 8 giây.
//
// PHÉP KIỂM NÀY PHẢI CHỨNG MINH ĐƯỢC CẢ HAI CHIỀU:
//   · bớt được lượt gọi lặp — nếu không thì sửa để làm gì;
//   · và KHÔNG BAO GIỜ trả số cũ sau khi thầy vừa đổi ca — thà chậm còn hơn
//     hiện sai, đây là bảng thầy nhìn để quyết định mở hay khoá ca.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const URL = 'https://script.example/exec'
const MAT = 'mat-khau'

let soLuotGoi = 0

/** Giả `fetch` ở tầng thấp nhất, để đếm đúng số lượt CHẠM MÁY CHỦ. */
function gaFetch(tre = 0) {
  soLuotGoi = 0
  vi.stubGlobal('fetch', async (_u: string, init: RequestInit) => {
    const b = JSON.parse(String(init.body))
    soLuotGoi += 1
    if (tre) await new Promise((r) => setTimeout(r, tre))
    if (b.action === 'danhSachCa') {
      return new Response(JSON.stringify({ ok: true, items: [{ maCa: '111', tenCa: '2009 - Lớp 1', lop: '12', trangThai: 'mo', daVao: 1, daNop: 1, canhBao: 0 }] }), { status: 200 })
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  })
}

describe('GỘP LƯỢT GỌI', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ba màn hỏi liên tiếp ⇒ CHỈ MỘT lượt chạm máy chủ', async () => {
    gaFetch()
    const { danhSachCa } = await import('../src/lib/exam-api')
    await danhSachCa(URL, MAT)
    await danhSachCa(URL, MAT)
    await danhSachCa(URL, MAT)
    // eslint-disable-next-line no-console
    console.log(`[danhSachCa] 3 lượt hỏi · ${soLuotGoi} lượt chạm máy chủ`)
    expect(soLuotGoi).toBe(1)
  })

  it('hai màn hỏi CÙNG LÚC ⇒ đi chung một lượt, không bắn hai lượt song song', async () => {
    gaFetch(30)
    const { danhSachCa } = await import('../src/lib/exam-api')
    const [a, b] = await Promise.all([danhSachCa(URL, MAT), danhSachCa(URL, MAT)])
    expect(soLuotGoi).toBe(1)
    expect(a).toEqual(b)
  })

  it('trả về ĐÚNG dữ liệu, không phải một mảng rỗng cho nhanh', async () => {
    gaFetch()
    const { danhSachCa } = await import('../src/lib/exam-api')
    const ds = await danhSachCa(URL, MAT)
    expect(ds).toHaveLength(1)
    expect(ds[0].maCa).toBe('111')
    expect(ds[0].tenCa).toBe('2009 - Lớp 1')
  })

  it('thùng rác và danh sách thường là HAI khoá đệm khác nhau', async () => {
    gaFetch()
    const { danhSachCa } = await import('../src/lib/exam-api')
    await danhSachCa(URL, MAT, false)
    await danhSachCa(URL, MAT, true)
    expect(soLuotGoi).toBe(2)
  })
})

describe('KHÔNG ĐƯỢC HIỆN SỐ CŨ SAU KHI THẦY ĐỔI CA', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('`xoaBoDemCa` làm lượt hỏi tiếp theo chạm máy chủ lại', async () => {
    gaFetch()
    const { danhSachCa, xoaBoDemCa } = await import('../src/lib/exam-api')
    await danhSachCa(URL, MAT)
    expect(soLuotGoi).toBe(1)
    xoaBoDemCa()
    await danhSachCa(URL, MAT)
    expect(soLuotGoi).toBe(2)
  })

  it('KHOÁ CA xong là danh sách tươi ngay, không phải chờ hết đệm', async () => {
    gaFetch()
    const { danhSachCa, khoaCa } = await import('../src/lib/exam-api')
    await danhSachCa(URL, MAT)
    const truoc = soLuotGoi
    await khoaCa(URL, MAT, '111')
    await danhSachCa(URL, MAT)
    // khoaCa tốn 1 lượt, rồi danhSachCa phải chạm máy chủ lại ⇒ tăng 2.
    expect(soLuotGoi).toBe(truoc + 2)
  })

  it('lượt gọi HỎNG không được cất vào đệm — lần sau phải thử lại', async () => {
    soLuotGoi = 0
    vi.stubGlobal('fetch', async () => {
      soLuotGoi += 1
      return new Response(JSON.stringify({ ok: false, error: 'Sai mã bí mật' }), { status: 200 })
    })
    const { danhSachCa } = await import('../src/lib/exam-api')
    await expect(danhSachCa(URL, MAT)).rejects.toThrow()
    await expect(danhSachCa(URL, MAT)).rejects.toThrow()
    expect(soLuotGoi).toBe(2)
  })
})

describe('MÃ NGUỒN — mọi lệnh làm đổi danh sách ca đều phải bỏ đệm', () => {
  it('sáu lệnh đổi ca đều gọi `xoaBoDemCa()`', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
    for (const ten of ['khoaCa', 'moKhoaCa', 'doiTenCa', 'xoaCa', 'khoiPhucCa', 'publishSession']) {
      const dau = s.indexOf(`export async function ${ten}`)
      expect(dau, ten).toBeGreaterThan(0)
      // CỬA SỔ NỚI 2 600 → 5 000 ngày 11/09. `publishSession` mọc thêm đoạn đẩy
      // ca lên máy chủ mới, đẩy lời gọi `xoaBoDemCa()` ra ngoài cửa sổ cũ. Ý
      // ĐỊNH KHÔNG ĐỔI: lệnh làm đổi danh sách ca thì phải bỏ đệm.
      expect(s.slice(dau, dau + 5000), ten).toContain('xoaBoDemCa()')
    }
  })

  it('đệm ngắn hơn nhịp làm mới của màn Theo dõi', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
    const m = /const DEM_CA_MS = (\d+)/.exec(s)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeLessThanOrEqual(10000)
  })
})
