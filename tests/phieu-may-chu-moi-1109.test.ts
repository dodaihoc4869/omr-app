// PHIẾU BÁO CÁO TRÊN MÁY CHỦ MỚI — 11/09.
//
// Đo đường cũ sau khi đã tối ưu hết mức (Apps Script v72): `layPhieu` 20 lượt
// đồng thời cho p50 5,13 s · p95 5,85 s. Phụ huynh bấm link rồi ngồi nhìn năm
// giây. R2 trả cùng gói ấy trong vài trăm mili giây.
//
// PHÉP KIỂM NÀY CANH HAI CHIỀU, và chiều thứ hai mới là chiều dễ mất phiếu:
//   · đường tắt có chạy — nếu không thì sửa để làm gì;
//   · và đường tắt hỏng KHÔNG BAO GIỜ được biến thành "phụ huynh không mở được
//     báo cáo". Mọi phiếu tạo trước hôm nay chỉ nằm bên Apps Script.
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { HAN_DOC_PHIEU_GIAY, dayPhieuMoi, layPhieuMoi } from '../src/lib/phieu-may-chu-moi'
import { chuanHoaMayChu } from '../src/lib/cau-hinh-may-chu'

const BAT = chuanHoaMayChu({ BAT: true, URL: 'https://omr.example' })
const TAT = chuanHoaMayChu({ BAT: false, URL: 'https://omr.example' })
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const GS = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ĐỌC PHIẾU — đường tắt', () => {
  it('có phiếu ở máy chủ mới ⇒ trả về ngay', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ma: 'abc', phieu: { diem: 8.5 } }), { status: 200 }))
    expect(await layPhieuMoi(BAT, 'abc')).toEqual({ diem: 8.5 })
  })

  it('CỜ TẮT ⇒ không chạm mạng, trả null để đi đường cũ', async () => {
    let cham = 0
    vi.stubGlobal('fetch', async () => {
      cham += 1
      return new Response('{}', { status: 200 })
    })
    expect(await layPhieuMoi(TAT, 'abc')).toBeNull()
    expect(cham).toBe(0)
  })

  it('404 (phiếu cũ, chỉ có bên Apps Script) ⇒ null, KHÔNG phải lỗi', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ok: false, lyDo: 'khong_co' }), { status: 404 }))
    expect(await layPhieuMoi(BAT, 'cu')).toBeNull()
  })

  it('mạng hỏng ⇒ null, KHÔNG ném lỗi ra cho phụ huynh', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('Failed to fetch')
    })
    expect(await layPhieuMoi(BAT, 'abc')).toBeNull()
  })

  it('phiếu ĐÃ THU HỒI ⇒ null, để đường cũ nói đúng câu phụ huynh vẫn thấy', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ma: 'x', thuHoi: true, phieu: null }), { status: 200 }))
    expect(await layPhieuMoi(BAT, 'x')).toBeNull()
  })

  it('hạn chờ đọc NGẮN — chờ lâu ở đường tắt chỉ làm phụ huynh đợi thêm', () => {
    expect(HAN_DOC_PHIEU_GIAY).toBeLessThanOrEqual(5)
  })
})

describe('GHI PHIẾU — không được chặn việc lưu', () => {
  it('đẩy được ⇒ true', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    expect(await dayPhieuMoi(BAT, 'mat', { ma: 'a', maCa: 'c', sbd: '1', hoTen: 'Em', phieu: {} })).toBe(true)
  })

  it('R2 chưa nối ⇒ false, và chỗ gọi vẫn lưu như hôm nay', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ok: false, error: 'Chưa nối R2' }), { status: 500 }))
    expect(await dayPhieuMoi(BAT, 'mat', { ma: 'a', maCa: 'c', sbd: '1', hoTen: 'Em', phieu: {} })).toBe(false)
  })

  it('mạng hỏng ⇒ false, không ném', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('Failed to fetch')
    })
    expect(await dayPhieuMoi(BAT, 'mat', { ma: 'a', maCa: 'c', sbd: '1', hoTen: 'Em', phieu: {} })).toBe(false)
  })

  it('gửi mã bí mật qua HEADER, không nhét vào thân', async () => {
    let head = ''
    vi.stubGlobal('fetch', async (_u: string, init: RequestInit) => {
      head = String((init.headers as Record<string, string>)['x-ma-bi-mat'] ?? '')
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    await dayPhieuMoi(BAT, 'mat-khau-that', { ma: 'a', maCa: 'c', sbd: '1', hoTen: 'Em', phieu: {} })
    expect(head).toBe('mat-khau-that')
  })
})

describe('NỐI VÀO ĐƯỜNG PHIẾU THẬT', () => {
  it('`luuPhieu` ghi CẢ HAI nơi, và Apps Script vẫn là nguồn sự thật', () => {
    const i = API.indexOf('export async function luuPhieu')
    const than = API.slice(i, i + 2200)
    const iMoi = than.indexOf('dayPhieuMoi(')
    const iCu = than.indexOf("action: 'luuPhieu'")
    expect(iMoi).toBeGreaterThan(0)
    expect(iCu).toBeGreaterThan(iMoi) // máy chủ mới TRƯỚC
    // Chỉ đường CŨ được phép ném lỗi.
    expect(than).toContain("throw new Error(r.error || 'Không lưu được phiếu')")
  })

  it('đẩy lên máy chủ mới HỎNG thì KHÔNG chặn việc lưu', () => {
    const i = API.indexOf('export async function luuPhieu')
    const than = API.slice(i, i + 2200)
    const iMoi = than.indexOf('dayPhieuMoi(')
    // Lượt đẩy phải nằm trong một try/catch riêng.
    expect(than.slice(Math.max(0, iMoi - 400), iMoi)).toContain('try {')
  })

  it('`layPhieu` hỏi máy chủ mới TRƯỚC, rồi mới tới đường cũ', () => {
    const i = API.indexOf('export async function layPhieu')
    const than = API.slice(i, i + 2200)
    const iMoi = than.indexOf('layPhieuMoi(')
    const iCu = than.indexOf("action: 'layPhieu'")
    expect(iMoi).toBeGreaterThan(0)
    expect(iCu).toBeGreaterThan(iMoi)
  })

  it('đường cũ KHÔNG bị gỡ — phiếu tạo trước hôm nay vẫn mở được', () => {
    const i = API.indexOf('export async function layPhieu')
    const than = API.slice(i, i + 2200)
    expect(than).toContain('HAN_GIAY_LAY_PHIEU')
    expect(than).toContain("action: 'layPhieu'")
  })
})

describe('MÁY CHỦ — đường đọc phiếu phải CÔNG KHAI và KHÔNG liệt kê được', () => {
  it('`GET /phieu/:ma` đặt TRƯỚC mọi cổng mã bí mật', () => {
    const iDoc = GS.indexOf("p.startsWith('/phieu/')")
    const iCong = GS.indexOf("if (req.method !== 'POST')")
    expect(iDoc).toBeGreaterThan(0)
    expect(iCong).toBeGreaterThan(iDoc)
  })

  it('đường GHI và THU HỒI thì nằm SAU cổng mã bí mật', () => {
    const iCong = GS.indexOf("if (req.method !== 'POST')")
    expect(GS.indexOf("p === '/phieu/day'")).toBeGreaterThan(iCong)
    expect(GS.indexOf("p === '/phieu/xoa'")).toBeGreaterThan(iCong)
  })

  it('KHÔNG có đường nào trả danh sách mã phiếu', () => {
    expect(GS).not.toMatch(/FROM\s+phieu|list\(\s*\{\s*prefix:\s*'phieu/)
  })

  it('KHÔNG đặt bộ đệm — thầy sửa phiếu là phụ huynh thấy bản mới ngay', () => {
    const i = GS.indexOf('async function layPhieuR2')
    expect(GS.slice(i, i + 900)).toContain("'cache-control': 'no-store'")
  })
})
