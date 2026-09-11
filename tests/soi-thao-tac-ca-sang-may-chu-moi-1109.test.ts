// "TÔI KHÔNG XOÁ ĐƯỢC CA NÀY" — ca 432566, thầy báo chiều 11/09.
//
// NGUYÊN NHÂN GỐC, và nó là hệ quả trực tiếp của việc chuyển màn Ca thi sang D1
// cùng ngày: `xoaCa` CHỈ ghi sang Apps Script. Sheet đánh dấu `da_xoa` đúng như
// mọi khi, nhưng màn Ca thi nay đọc `/ca/danh-sach` trên D1, và dòng ca bên D1
// không hề đổi. Thầy bấm xoá, ca vẫn nằm nguyên đó; bấm mười lần cũng vậy, vì
// lần nào cũng xoá thành công ở chỗ không ai nhìn.
//
// Cùng lỗ hổng ấy có năm cửa, không phải một: xoá · khôi phục · khoá · mở khoá
// · đổi tên. Tệp này canh cả năm, và canh luôn việc hai bảng ô-sửa-được ở hai
// đầu phải khớp nhau — thêm ô một bên mà quên bên kia là ghi vào khoảng không,
// không câu lỗi nào bật lên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const WK = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const DAY = fs.readFileSync(path.join(process.cwd(), 'src/lib/day-ca-may-chu-moi.ts'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')

const URL_MOI = 'https://omr.example'

describe('WORKER — đường `/ca/sua`', () => {
  it('có đường, và nằm trong khối ĐÒI MÃ BÍ MẬT', () => {
    expect(WK).toContain("if (p === '/ca/sua') return suaCa(env, b)")
    const i = WK.indexOf('if (!laThay(req, env, b))')
    expect(i).toBeGreaterThan(0)
    expect(WK.indexOf("p === '/ca/sua'")).toBeGreaterThan(i)
  })

  it('CHỈ `UPDATE`, không bao giờ tự dựng dòng ca mới', () => {
    const than = WK.slice(WK.indexOf('async function suaCa('), WK.indexOf('async function suaCa(') + 1400)
    expect(than).toContain('UPDATE ca SET')
    expect(than).not.toContain('INSERT INTO ca')
    // Ca chưa lên D1 thì nói thẳng, để app biết mà đẩy cả ca sang.
    expect(than).toContain('coCa: false')
  })

  it('chỉ sửa ô trong danh sách trắng — không nhận tên cột từ thân gói', () => {
    const than = WK.slice(WK.indexOf('async function suaCa('), WK.indexOf('async function suaCa(') + 1400)
    expect(than).toContain('for (const [ten, o] of Object.entries(O_SUA_DUOC))')
    // Ô nào KHÔNG được đụng tới, kể cả khi thân gói có nhắc tên.
    const bang = WK.slice(WK.indexOf('const O_SUA_DUOC'), WK.indexOf('async function suaCa('))
    for (const cam of ['bank_r2', 'bat_dau_thi_luc', 'bo_theo_em_json', 'dem_da_vao', 'dem_da_nop']) {
      expect(bang, cam).not.toContain(cam)
    }
  })
})

describe('HAI BẢNG Ô-SỬA-ĐƯỢC PHẢI KHỚP NHAU', () => {
  it('tên ô bên Worker và bên máy thầy trùng đúng từng cái', () => {
    const bang = WK.slice(WK.indexOf('const O_SUA_DUOC'), WK.indexOf('}', WK.indexOf('const O_SUA_DUOC')))
    const oWorker = [...bang.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]).sort()

    const kieu = DAY.slice(DAY.indexOf('export interface OSuaCa'), DAY.indexOf('}', DAY.indexOf('export interface OSuaCa')))
    const oMay = [...kieu.matchAll(/^\s{2}(\w+)\?:/gm)].map((m) => m[1]).sort()

    expect(oWorker.length).toBeGreaterThan(0)
    expect(oMay).toEqual(oWorker)
  })
})

describe('NĂM LỆNH CỦA THẦY ĐỀU PHẢI SOI SANG D1', () => {
  const CUA: [string, string][] = [
    ['xoaCa', "action: 'xoaCa'"],
    ['khoiPhucCa', "action: 'khoiPhucCa'"],
    ['khoaCa', "action: 'khoaCa'"],
    ['moKhoaCa', "action: 'moKhoaCa'"],
    ['doiTenCa', "action: 'doiTenCa'"],
  ]
  for (const [ten, moc] of CUA) {
    it(`${ten} gọi soiCaSangMayChuMoi ngay sau khi Apps Script trả lời`, () => {
      const i = API.indexOf(moc)
      expect(i, moc).toBeGreaterThan(0)
      expect(API.slice(i, i + 700), ten).toContain('soiCaSangMayChuMoi(')
    })
  }

  it('soi hỏng KHÔNG được biến thành lỗi báo lên cho thầy', () => {
    const han = API.slice(API.indexOf('async function soiCaSangMayChuMoi('), API.indexOf('async function soiCaSangMayChuMoi(') + 400)
    expect(han).toContain('catch')
    expect(han).toContain('return false')
    expect(han).not.toContain('throw')
  })
})

describe('CHẠY THẬT — bấm xoá là D1 phải nhận được lệnh', () => {
  beforeEach(() => {
    vi.resetModules()
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
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doUnmock('../src/lib/may-chu-moi')
  })

  it('xoaCa gửi `/ca/sua` với trangThai da_xoa và mốc XoaLuc', async () => {
    const goi: { url: string; than: Record<string, unknown> }[] = []
    vi.stubGlobal('fetch', async (u: string, init?: RequestInit) => {
      const than = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
      goi.push({ url: String(u), than })
      return new Response(JSON.stringify({ ok: true, coCa: true }), { status: 200 })
    })
    const { xoaCa } = await import('../src/lib/exam-api')
    await xoaCa('https://script.example/exec', 'MAT', '432566', '432566')

    const sua = goi.find((g) => g.url.endsWith('/ca/sua'))
    expect(sua, 'không thấy lượt gọi /ca/sua').toBeTruthy()
    expect(sua!.than.maCa).toBe('432566')
    const dat = sua!.than.dat as Record<string, unknown>
    expect(dat.trangThai).toBe('da_xoa')
    expect(String(dat.xoaLuc)).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('máy chủ mới im lặng thì xoaCa VẪN coi là xong — Apps Script mới là nơi quyết', async () => {
    vi.stubGlobal('fetch', async (u: string) => {
      if (String(u).includes('/ca/sua')) throw new Error('Failed to fetch')
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const { xoaCa } = await import('../src/lib/exam-api')
    await expect(xoaCa('https://script.example/exec', 'MAT', '432566', '432566')).resolves.toBeUndefined()
  })

  it('Apps Script từ chối thì KHÔNG soi sang D1 — hai nơi không được lệch', async () => {
    const goi: string[] = []
    vi.stubGlobal('fetch', async (u: string) => {
      goi.push(String(u))
      return new Response(JSON.stringify({ ok: false, error: 'Mã ca xác nhận không khớp' }), { status: 200 })
    })
    const { xoaCa } = await import('../src/lib/exam-api')
    await expect(xoaCa('https://script.example/exec', 'MAT', '432566', 'sai')).rejects.toThrow()
    expect(goi.some((u) => u.endsWith('/ca/sua'))).toBe(false)
  })
})
