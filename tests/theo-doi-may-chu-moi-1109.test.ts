// MÀN CHI TIẾT CA PHẢI THẤY EM ĐANG THI TRÊN MÁY CHỦ MỚI — 11/09.
//
// VÌ SAO: ca chạy trên máy chủ mới thì lượt VÀO THI không tạo dòng bên Apps
// Script — chỉ lượt NỘP mới ghi cả hai nơi. Không trộn thêm thì giữa ca thầy mở
// màn Chi tiết ca ra là thấy TRỐNG: không biết ai đã vào, ai đang làm, ai bị
// chặn, và không có gì để bấm mở khoá hay cho thi lại.
//
// Đây là loại hỏng không làm mất dữ liệu nhưng làm thầy mù giữa ca — và thầy
// dùng đúng màn ấy để xử lý mọi sự cố trong phòng thi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const URL_CU = 'https://script.example/exec'
const URL_MOI = 'https://omr.example'
const MAT = 'mat-khau'

function batCo() {
  vi.doMock('../src/lib/may-chu-moi', async (goc) => {
    const that = (await goc()) as Record<string, unknown>
    return {
      ...that,
      layCauHinhMayChu: async () => ({
        BAT: true, URL: URL_MOI, HAN_GIAY: 10, HAN_NONG_GIAY: 3,
        SO_LAN_THU: 3, LUI_VE_APPS_SCRIPT: true, GIAN_VAO_THI_GIAY: 0,
      }),
    }
  })
}

const CA = { maCa: 'ca1', lop: '12', danhSachMoi: '', nguoiTao: '' }

function luotSheet(sbd: string, lanThu = 1, tong: number | null = 8) {
  return { sbd, hoTen: 'Em ' + sbd, lanThu, trangThai: 'da_nop', vaoLuc: '', hetGioLuc: '', nopLuc: '', soLanRoiMan: 0, tongGiayRoiMan: 0, diemI: null, diemII: null, diemIII: null, tong, duyetBoi: '', duyetLuc: '', ghiChu: '', dapAn: null, integrity: null, giayCau: null }
}

function gaMang(luotCu: unknown[], dsMoi: unknown[] | null) {
  vi.stubGlobal('fetch', async (u: string) => {
    if (String(u).includes('/ca/luot')) {
      if (dsMoi === null) return new Response('{}', { status: 500 })
      return new Response(JSON.stringify({ ok: true, ds: dsMoi }), { status: 200 })
    }
    return new Response(JSON.stringify({ ok: true, ca: CA, luot: luotCu }), { status: 200 })
  })
}

beforeEach(() => {
  vi.resetModules()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.doUnmock('../src/lib/may-chu-moi')
})

describe('TRỘN LƯỢT TỪ MÁY CHỦ MỚI', () => {
  it('em đang thi bên máy chủ mới, Sheet chưa có ⇒ thầy VẪN thấy', async () => {
    batCo()
    gaMang([], [luotSheet('10001', 1, null)])
    const { chiTietCa } = await import('../src/lib/exam-api')
    const ct = await chiTietCa(URL_CU, MAT, 'ca1')
    expect(ct.luot).toHaveLength(1)
    expect(ct.luot[0].sbd).toBe('10001')
  })

  it('TRÙNG sbd+lanThu ⇒ DÒNG SHEET THẮNG, vì bên ấy có điểm và họ tên', async () => {
    batCo()
    gaMang([luotSheet('10001', 1, 9.5)], [luotSheet('10001', 1, null)])
    const { chiTietCa } = await import('../src/lib/exam-api')
    const ct = await chiTietCa(URL_CU, MAT, 'ca1')
    expect(ct.luot).toHaveLength(1)
    expect(ct.luot[0].tong).toBe(9.5)
  })

  it('trộn ĐÚNG phần còn thiếu, không nhân đôi ai', async () => {
    batCo()
    gaMang([luotSheet('10001')], [luotSheet('10001'), luotSheet('10002'), luotSheet('10003')])
    const { chiTietCa } = await import('../src/lib/exam-api')
    const ct = await chiTietCa(URL_CU, MAT, 'ca1')
    expect(ct.luot.map((l) => l.sbd).sort()).toEqual(['10001', '10002', '10003'])
  })

  it('THI LẠI: cùng sbd khác lanThu là HAI dòng, không được nuốt mất', async () => {
    batCo()
    gaMang([luotSheet('10001', 1)], [luotSheet('10001', 2)])
    const { chiTietCa } = await import('../src/lib/exam-api')
    const ct = await chiTietCa(URL_CU, MAT, 'ca1')
    expect(ct.luot).toHaveLength(2)
    expect(ct.luot.map((l) => l.lanThu).sort()).toEqual([1, 2])
  })
})

describe('KHÔNG BAO GIỜ LÀM VỠ MÀN CŨ', () => {
  it('cờ TẮT ⇒ giữ nguyên danh sách Sheet, không chạm máy chủ mới', async () => {
    let chamMoi = 0
    vi.stubGlobal('fetch', async (u: string) => {
      if (String(u).includes('omr.example')) chamMoi += 1
      return new Response(JSON.stringify({ ok: true, ca: CA, luot: [luotSheet('10001')] }), { status: 200 })
    })
    const { chiTietCa } = await import('../src/lib/exam-api')
    const ct = await chiTietCa(URL_CU, MAT, 'ca1')
    expect(ct.luot).toHaveLength(1)
    expect(chamMoi).toBe(0)
  })

  it('máy chủ mới HỎNG ⇒ vẫn trả danh sách Sheet, không ném lỗi', async () => {
    batCo()
    gaMang([luotSheet('10001')], null)
    const { chiTietCa } = await import('../src/lib/exam-api')
    const ct = await chiTietCa(URL_CU, MAT, 'ca1')
    expect(ct.luot).toHaveLength(1)
  })

  it('ca chưa từng chạy máy chủ mới ⇒ danh sách rỗng bên đó, không đổi gì', async () => {
    batCo()
    gaMang([luotSheet('10001')], [])
    const { chiTietCa } = await import('../src/lib/exam-api')
    const ct = await chiTietCa(URL_CU, MAT, 'ca1')
    expect(ct.luot).toHaveLength(1)
  })
})

describe('MÁY CHỦ — không kéo về thứ không cần', () => {
  it('`/ca/luot` KHÔNG trả ba gói JSON nặng', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
    const i = s.indexOf('async function luotCuaCa(')
    const than = s.slice(i, i + 2000)
    expect(than).toContain('dapAn: null')
    expect(than).toContain('integrity: null')
    expect(than).toContain('giayCau: null')
  })

  it('`/ca/luot` nằm SAU cổng mã bí mật', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
    expect(s.indexOf("p === '/ca/luot'")).toBeGreaterThan(s.indexOf("if (req.method !== 'POST')"))
  })
})
