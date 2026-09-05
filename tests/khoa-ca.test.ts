// KHOÁ CA + LƯU TẠM (CATHIVAGOILENBANG mục 1) — phép kiểm 4–9 của đặc tả.
//
// Chạy THẲNG file Apps Script sẽ dán lên Google, trên một Google Sheet giả
// trong bộ nhớ. Không chụp màn hình, không bấm tay: mỗi phép kiểm là một lời
// gọi doPost và một khẳng định về nội dung sheet sau đó.
import { describe, expect, it, beforeEach } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'

const MAT = 'mat-khau-test'

/** Sheet giả: mảng hai chiều + đúng các phương thức Apps Script dùng tới. */
class SheetGia {
  o: unknown[][]
  constructor(headers: string[]) {
    this.o = [headers.slice()]
  }
  getDataRange() {
    return { getValues: () => this.o.map((r) => r.slice()) }
  }
  getLastColumn() {
    return this.o[0].length
  }
  appendRow(r: unknown[]) {
    this.o.push(r.slice())
  }
  private bd(r: number, c: number) {
    while (this.o.length < r) this.o.push([])
    const hang = this.o[r - 1]
    while (hang.length < c) hang.push('')
  }
  getRange(row: number, col: number, nr = 1, nc = 1) {
    const t = this
    return {
      getValues: () => {
        const ra: unknown[][] = []
        for (let i = 0; i < nr; i++) {
          t.bd(row + i, col + nc - 1)
          ra.push(t.o[row + i - 1].slice(col - 1, col - 1 + nc))
        }
        return ra
      },
      getValue: () => {
        t.bd(row, col)
        return t.o[row - 1][col - 1]
      },
      setValue: (v: unknown) => {
        t.bd(row, col)
        t.o[row - 1][col - 1] = v
      },
      setValues: (vs: unknown[][]) => {
        for (let i = 0; i < vs.length; i++) {
          t.bd(row + i, col + vs[i].length - 1)
          for (let j = 0; j < vs[i].length; j++) t.o[row + i - 1][col - 1 + j] = vs[i][j]
        }
      },
    }
  }
}

interface Gs {
  doPost: (e: { postData: { contents: string } }) => { _obj: Record<string, unknown> }
  CA_HEADERS: string[]
  LUOT_HEADERS: string[]
  caDangKhoa_: (ca: { trangThai: string } | null) => boolean
  quyetDinhVaoThi_: (ca: Record<string, unknown>, luot: unknown, id: string, now: number) => { ok: boolean; lyDo?: string }
  __sheets: Record<string, SheetGia>
}

function dungGs(): Gs {
  const sheets: Record<string, SheetGia> = {}
  const SpreadsheetApp = {
    openById: () => ({
      getSheetByName: (n: string) => sheets[n] ?? null,
      insertSheet: (n: string) => (sheets[n] = new SheetGia([])),
    }),
  }
  const ContentService = {
    MimeType: { JSON: 'json' },
    createTextOutput: (s: string) => ({ setMimeType: () => ({ _obj: JSON.parse(s) }) }),
  }
  const PropertiesService = { getScriptProperties: () => ({ getProperty: (k: string) => (k === 'MA_BI_MAT' ? MAT : '') }) }
  const LockService = { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) }
  const Utilities = { sleep: () => {} }
  const Logger = { log: () => {} }
  const DriveApp = {}
  const fn = new Function(
    'SpreadsheetApp',
    'ContentService',
    'PropertiesService',
    'LockService',
    'Utilities',
    'Logger',
    'DriveApp',
    `${gsCode}\nreturn { doPost, CA_HEADERS, LUOT_HEADERS, caDangKhoa_, quyetDinhVaoThi_ }`,
  )
  const g = fn(SpreadsheetApp, ContentService, PropertiesService, LockService, Utilities, Logger, DriveApp) as Gs
  g.__sheets = sheets
  return g
}

let gs: Gs
const goi = (body: Record<string, unknown>) => gs.doPost({ postData: { contents: JSON.stringify(body) } })._obj

/** Dựng sẵn một ca đang mở + ba em đang làm + một em đã nộp. */
function dungCa(maCa = '123456') {
  const ca = new SheetGia(gs.CA_HEADERS)
  const r: unknown[] = new Array(gs.CA_HEADERS.length).fill('')
  r[0] = maCa
  r[1] = '11A1'
  r[2] = 45
  r[9] = 'mo'
  ca.appendRow(r)
  gs.__sheets['CaKiemTra'] = ca

  const luot = new SheetGia(gs.LUOT_HEADERS)
  const them = (sbd: string, trangThai: string, dapAn: string) => {
    const l: unknown[] = new Array(gs.LUOT_HEADERS.length).fill('')
    l[0] = maCa
    l[1] = sbd
    l[2] = 1
    l[3] = 'may-' + sbd
    l[4] = '2026-09-05T01:00:00Z'
    l[5] = '2026-09-05T01:45:00Z'
    l[7] = trangThai
    l[8] = dapAn
    l[9] = 0
    l[10] = 0
    luot.appendRow(l)
  }
  them('001', 'dang_lam', '')
  them('002', 'dang_lam', '')
  them('003', 'dang_lam', '')
  them('009', 'da_nop', JSON.stringify({ phanI: { q1: 'A' } }))
  gs.__sheets['LuotThi'] = luot
  return { ca, luot }
}

const docLuot = (luot: SheetGia, sbd: string) => luot.o.slice(1).find((r) => String(r[1]) === sbd)!

beforeEach(() => {
  gs = dungGs()
})

describe('cột và hàm chung', () => {
  it('CaKiemTra có đủ ba cột dấu vết khoá ca', () => {
    expect(gs.CA_HEADERS.slice(-3)).toEqual(['KhoaLuc', 'KhoaBoi', 'MoKhoaLuc'])
  })
  it('caDangKhoa_ coi cả ca đã xoá là khoá', () => {
    expect(gs.caDangKhoa_({ trangThai: 'mo' })).toBe(false)
    expect(gs.caDangKhoa_({ trangThai: 'dong' })).toBe(true)
    expect(gs.caDangKhoa_({ trangThai: 'da_xoa' })).toBe(true)
    expect(gs.caDangKhoa_(null)).toBe(false)
  })
})

describe('lưu tạm bài đang làm', () => {
  it('ghi đáp án vào ĐÚNG dòng lượt, KHÔNG đổi trạng thái, KHÔNG ghi giờ nộp', () => {
    const { luot } = dungCa()
    const r = goi({ action: 'luuTam', maCa: '123456', sbd: '002', dapAn: { phanI: { q1: 'B' } } })
    expect(r.ok).toBe(true)
    const d = docLuot(luot, '002')
    expect(JSON.parse(String(d[8]))).toEqual({ phanI: { q1: 'B' } })
    expect(d[7]).toBe('dang_lam')
    expect(d[6]).toBe('')
  })

  it('lưu nhiều lần thì GHI ĐÈ cùng dòng, sheet không phình', () => {
    const { luot } = dungCa()
    const truoc = luot.o.length
    for (const v of ['A', 'B', 'C']) goi({ action: 'luuTam', maCa: '123456', sbd: '002', dapAn: { phanI: { q1: v } } })
    expect(luot.o.length).toBe(truoc)
    expect(JSON.parse(String(docLuot(luot, '002')[8]))).toEqual({ phanI: { q1: 'C' } })
  })

  it('em đã nộp thì không lưu tạm nữa', () => {
    dungCa()
    expect(goi({ action: 'luuTam', maCa: '123456', sbd: '009', dapAn: {} })).toMatchObject({ ok: false, lyDo: 'khong_dang_lam' })
  })

  it('em chưa vào thi thì báo rõ, không tự tạo lượt', () => {
    const { luot } = dungCa()
    const truoc = luot.o.length
    expect(goi({ action: 'luuTam', maCa: '123456', sbd: '777', dapAn: {} })).toMatchObject({ ok: false, lyDo: 'chua_vao' })
    expect(luot.o.length).toBe(truoc)
  })
})

describe('PHÉP KIỂM 4 — khoá ca nộp hộ em đang làm, chấm theo phần đã làm', () => {
  it('cả 3 em đang làm bị nộp, đáp án đã lưu tạm GIỮ NGUYÊN', () => {
    const { ca, luot } = dungCa()
    goi({ action: 'luuTam', maCa: '123456', sbd: '001', dapAn: { phanI: { q1: 'A', q2: 'C' } } })
    goi({ action: 'luuTam', maCa: '123456', sbd: '002', dapAn: { phanI: { q1: 'B' } } })

    const r = goi({ action: 'khoaCa', secret: MAT, maCa: '123456', khoaBoi: 'thầy Đỗ' })
    expect(r).toMatchObject({ ok: true, trangThai: 'dong', soEmBiNop: 3 })

    for (const sbd of ['001', '002', '003']) expect(docLuot(luot, sbd)[7]).toBe('da_nop')
    expect(JSON.parse(String(docLuot(luot, '001')[8]))).toEqual({ phanI: { q1: 'A', q2: 'C' } })
    expect(JSON.parse(String(docLuot(luot, '002')[8]))).toEqual({ phanI: { q1: 'B' } })
    // Em chưa kịp lưu tạm lần nào: nộp với bài trống — nhưng KHÔNG mất dòng.
    expect(docLuot(luot, '003')[8]).toBe('')
    // Em đã nộp từ trước không bị đụng vào.
    expect(JSON.parse(String(docLuot(luot, '009')[8]))).toEqual({ phanI: { q1: 'A' } })
    for (const sbd of ['001', '002', '003']) expect(String(docLuot(luot, sbd)[19])).toContain('thầy khoá ca')

    // Dấu vết trên dòng ca: trạng thái, giờ khoá, ai khoá.
    expect(ca.o[1][9]).toBe('dong')
    expect(String(ca.o[1][19])).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(ca.o[1][20]).toBe('thầy Đỗ')
  })

  it('khoá hai lần thì lần sau bị từ chối, không nộp lại ai', () => {
    dungCa()
    goi({ action: 'khoaCa', secret: MAT, maCa: '123456' })
    expect(goi({ action: 'khoaCa', secret: MAT, maCa: '123456' })).toMatchObject({ ok: false })
  })

  it('sai mã bí mật thì không khoá được', () => {
    const { ca } = dungCa()
    expect(goi({ action: 'khoaCa', secret: 'sai', maCa: '123456' })).toMatchObject({ ok: false })
    expect(ca.o[1][9]).toBe('mo')
  })
})

describe('PHÉP KIỂM 5, 7, 8 — ca khoá thì máy chủ CHẶN, không dựa vào giao diện', () => {
  it('em thứ 4 vào sau khi khoá bị chặn ngay ở bảng quyết định', () => {
    dungCa()
    goi({ action: 'khoaCa', secret: MAT, maCa: '123456' })
    const ca = { trangThai: 'dong', batDau: '', hetHanVao: '', thoiGianPhut: 45 }
    expect(gs.quyetDinhVaoThi_(ca, null, 'may-moi', Date.now())).toMatchObject({ ok: false, lyDo: 'da_dong' })
  })

  it('PHÉP KIỂM 8 — gọi luuTam khi ca khoá nhận lỗi', () => {
    const { luot } = dungCa()
    goi({ action: 'luuTam', maCa: '123456', sbd: '001', dapAn: { phanI: { q1: 'A' } } })
    goi({ action: 'khoaCa', secret: MAT, maCa: '123456' })
    expect(goi({ action: 'luuTam', maCa: '123456', sbd: '001', dapAn: { phanI: { q1: 'D' } } })).toMatchObject({ ok: false, lyDo: 'da_dong' })
    // Bài đã nộp KHÔNG bị lời gọi muộn ghi đè.
    expect(JSON.parse(String(docLuot(luot, '001')[8]))).toEqual({ phanI: { q1: 'A' } })
  })

  it('gọi submit khi ca khoá nhận lỗi, không ghi đè bài đã nộp hộ', () => {
    const { luot } = dungCa()
    goi({ action: 'luuTam', maCa: '123456', sbd: '001', dapAn: { phanI: { q1: 'A' } } })
    goi({ action: 'khoaCa', secret: MAT, maCa: '123456' })
    const r = goi({ action: 'submit', maCa: '123456', sbd: '001', maDe: 'x', dapAn: { phanI: { q1: 'D' } }, integrity: { leaveCount: 0, totalHiddenMs: 0 }, lanThu: 1 })
    expect(r).toMatchObject({ ok: false, lyDo: 'da_dong' })
    expect(JSON.parse(String(docLuot(luot, '001')[8]))).toEqual({ phanI: { q1: 'A' } })
  })
})

describe('PHÉP KIỂM 6 — mở ca lại', () => {
  it('ca về trạng thái mở, ghi giờ mở, em đã bị nộp KHÔNG tự vào lại được', () => {
    const { ca, luot } = dungCa()
    goi({ action: 'khoaCa', secret: MAT, maCa: '123456' })
    const r = goi({ action: 'moKhoaCa', secret: MAT, maCa: '123456' })
    expect(r).toMatchObject({ ok: true, trangThai: 'mo' })
    expect(ca.o[1][9]).toBe('mo')
    expect(String(ca.o[1][21])).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    // Em mới vào được.
    const caMo = { trangThai: 'mo', batDau: '', hetHanVao: '', thoiGianPhut: 45 }
    expect(gs.quyetDinhVaoThi_(caMo, null, 'may-moi', Date.now())).toMatchObject({ ok: true })
    // Em bị nộp do khoá vẫn là da_nop → bảng quyết định chặn, phải duyệt thi lại.
    expect(docLuot(luot, '001')[7]).toBe('da_nop')
    expect(gs.quyetDinhVaoThi_(caMo, { trangThai: 'da_nop', idThietBi: 'may-001', lanThu: 1, nopLuc: '2026-09-05T01:20:00Z' }, 'may-001', Date.now())).toMatchObject({ ok: false, lyDo: 'da_nop' })
  })

  it('ca đang mở thì không có gì để mở lại', () => {
    dungCa()
    expect(goi({ action: 'moKhoaCa', secret: MAT, maCa: '123456' })).toMatchObject({ ok: false })
  })
})

// ---------------------------------------------------------------- MÁY EM
// PHÉP KIỂM 9 — mất mạng một nhịp thì bỏ qua nhịp đó, KHÔNG ném lỗi ra màn
// làm bài. Em đang làm bài mà hiện hộp lỗi đỏ vì rớt wifi là hỏng buổi thi.
describe('PHÉP KIỂM 9 — luuTam chịu được mất mạng', () => {
  it('mạng lỗi thì trả false, không ném; mạng lại thì ghi tiếp', async () => {
    const { luuTam } = await import('../src/lib/exam-api')
    const goc = globalThis.fetch
    globalThis.fetch = (async () => {
      throw new Error('Failed to fetch')
    }) as typeof fetch
    await expect(luuTam('https://x', '123456', '001', { phanI: {}, phanII: {}, phanIII: {} })).resolves.toBe(false)
    globalThis.fetch = (async () => ({ ok: true, json: async () => ({ ok: true, serverNow: Date.now() }) })) as unknown as typeof fetch
    await expect(luuTam('https://x', '123456', '001', { phanI: {}, phanII: {}, phanIII: {} })).resolves.toBe(true)
    globalThis.fetch = goc
  })

  it('máy chủ trả lỗi (ca đã khoá) cũng chỉ trả false, không ném', async () => {
    const { luuTam } = await import('../src/lib/exam-api')
    const goc = globalThis.fetch
    globalThis.fetch = (async () => ({ ok: true, json: async () => ({ ok: false, lyDo: 'da_dong' }) })) as unknown as typeof fetch
    await expect(luuTam('https://x', '123456', '001', { phanI: {}, phanII: {}, phanIII: {} })).resolves.toBe(false)
    globalThis.fetch = goc
  })
})
