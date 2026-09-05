// TỐI ƯU TỐC ĐỘ MÁY CHỦ (05-09, trước ca thi thật).
//
// Đo trên máy chủ thật trước khi sửa: mỗi lệnh gọi /exec mất 1,2–1,4 giây chi
// phí cố định (Apps Script dựng môi trường + chuyển hướng) — con số đó không
// sửa được bằng mã. Phần việc thật chiếm 1,0–1,3 giây nữa, VÀ ĐÓ LÀ CHỖ NÀY VÁ.
//
// Ba chỗ chậm nhất, đều nằm trên đường đi của lệnh Vào thi:
//   1. `findRowByKey_` kéo TOÀN BỘ sheet về chỉ để so một cột.
//   2. `luotMoiNhatTheoSbd_` kéo cả DapAnJson/IntegrityJson/GiayCauJson.
//   3. Đọc file đề từ Drive KHI ĐANG GIỮ KHOÁ — cả lớp xếp hàng nối tiếp.
//
// Các phép kiểm dưới đây ĐẾM số ô sheet mà máy chủ đọc. Đếm được thì mới biết
// tối ưu có thật hay không, và mới chặn được người sau vô tình gỡ nó ra.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'

/** Sheet giả có ĐẾM số ô đọc — đó là thứ cần đo. */
class SheetDem {
  o: unknown[][]
  soODoc = 0
  soLanDocCaBang = 0
  constructor(hang: unknown[][]) {
    this.o = hang.map((r) => r.slice())
  }
  getDataRange() {
    return {
      getValues: () => {
        this.soLanDocCaBang++
        this.soODoc += this.o.length * (this.o[0]?.length ?? 0)
        return this.o.map((r) => r.slice())
      },
    }
  }
  getLastRow() {
    return this.o.length
  }
  getLastColumn() {
    return this.o[0]?.length ?? 0
  }
  appendRow(r: unknown[]) {
    this.o.push(r.slice())
  }
  getRange(row: number, col: number, nr = 1, nc = 1) {
    const t = this
    return {
      getValues: () => {
        t.soODoc += nr * nc
        const ra: unknown[][] = []
        for (let i = 0; i < nr; i++) {
          const hang = t.o[row + i - 1] ?? []
          const d: unknown[] = []
          for (let j = 0; j < nc; j++) d.push(hang[col - 1 + j] ?? '')
          ra.push(d)
        }
        return ra
      },
      getValue: () => {
        t.soODoc += 1
        return (t.o[row - 1] ?? [])[col - 1]
      },
      setValue: () => {},
      setValues: () => {},
    }
  }
}

interface Gs {
  findRowByKey_: (sh: unknown, cot: number, gia: string) => number
  luotMoiNhatTheoSbd_: (sh: unknown, maCa: string, nhe?: boolean) => Record<string, Record<string, unknown>>
  getSheet_: (ten: string, headers: string[]) => unknown
  LUOT_HEADERS: string[]
}

function dungGs(sheets: Record<string, SheetDem>, dem: { moBang: number; timSheet: number }): Gs {
  const SpreadsheetApp = {
    openById: () => {
      dem.moBang++
      return {
        getSheetByName: (n: string) => {
          dem.timSheet++
          return sheets[n] ?? null
        },
        insertSheet: (n: string) => (sheets[n] = new SheetDem([[]])),
      }
    },
  }
  const ContentService = { MimeType: { JSON: 'json' }, createTextOutput: (s: string) => ({ setMimeType: () => ({ _obj: JSON.parse(s) }) }) }
  const PropertiesService = { getScriptProperties: () => ({ getProperty: () => 'x' }) }
  const LockService = { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) }
  const Utilities = { sleep: () => {} }
  const Logger = { log: () => {} }
  const DriveApp = {}
  return new Function(
    'SpreadsheetApp',
    'ContentService',
    'PropertiesService',
    'LockService',
    'Utilities',
    'Logger',
    'DriveApp',
    `${gsCode}\nreturn { findRowByKey_, luotMoiNhatTheoSbd_, getSheet_, LUOT_HEADERS }`,
  )(SpreadsheetApp, ContentService, PropertiesService, LockService, Utilities, Logger, DriveApp) as Gs
}

/** Một sheet CaKiemTra giả: 25 cột, trong đó BankJson và KeyBankJson là chuỗi
 * dài — đúng hình dạng thật. */
function caGia(soDong: number): SheetDem {
  const hang: unknown[][] = [Array.from({ length: 25 }, (_, i) => `H${i}`)]
  for (let i = 0; i < soDong; i++) {
    const d = Array.from({ length: 25 }, () => '')
    d[0] = String(100000 + i)
    d[4] = 'x'.repeat(2000) // BankJson
    d[6] = 'y'.repeat(2000) // KeyBankJson
    hang.push(d)
  }
  return new SheetDem(hang)
}

describe('findRowByKey_ chỉ đọc ĐÚNG MỘT CỘT', () => {
  it('tìm đúng dòng như trước', () => {
    const sh = caGia(50)
    const gs = dungGs({}, { moBang: 0, timSheet: 0 })
    expect(gs.findRowByKey_(sh, 0, '100000')).toBe(2)
    expect(gs.findRowByKey_(sh, 0, '100049')).toBe(51)
    expect(gs.findRowByKey_(sh, 0, 'khong-co')).toBe(-1)
  })

  it('đọc 51 ô chứ không phải 51 × 25 ô — 25 lần ít hơn', () => {
    const sh = caGia(50)
    const gs = dungGs({}, { moBang: 0, timSheet: 0 })
    gs.findRowByKey_(sh, 0, '100049')
    expect(sh.soODoc).toBe(51)
    // và TUYỆT ĐỐI không đọc cả bảng
    expect(sh.soLanDocCaBang).toBe(0)
  })

  it('sheet rỗng hoặc chỉ có tiêu đề → -1, không nổ', () => {
    const gs = dungGs({}, { moBang: 0, timSheet: 0 })
    expect(gs.findRowByKey_(new SheetDem([['A', 'B']]), 0, 'x')).toBe(-1)
    expect(gs.findRowByKey_(new SheetDem([[]]), 0, 'x')).toBe(-1)
  })
})

describe('luotMoiNhatTheoSbd_ bản NHẸ bỏ ba cột JSON nặng', () => {
  /** LuotThi giả: 22 cột, ba cột JSON mỗi cột 5000 ký tự. */
  function luotGia(soDong: number): SheetDem {
    const hang: unknown[][] = [Array.from({ length: 22 }, (_, i) => `H${i}`)]
    for (let i = 0; i < soDong; i++) {
      const d = Array.from({ length: 22 }, () => '')
      d[0] = '903093'
      d[1] = String(1000 + (i % 10))
      d[2] = 1 + Math.floor(i / 10)
      d[7] = 'da_nop'
      d[8] = 'A'.repeat(5000) // DapAnJson
      d[11] = 'B'.repeat(5000) // IntegrityJson
      d[12] = 'Em ' + i
      d[21] = 'C'.repeat(5000) // GiayCauJson
      hang.push(d)
    }
    return new SheetDem(hang)
  }

  it('bản nhẹ và bản đầy đủ cho ra CÙNG trạng thái lượt', () => {
    const gs = dungGs({}, { moBang: 0, timSheet: 0 })
    const day = gs.luotMoiNhatTheoSbd_(luotGia(30), '903093')
    const nhe = gs.luotMoiNhatTheoSbd_(luotGia(30), '903093', true)
    expect(Object.keys(nhe).sort()).toEqual(Object.keys(day).sort())
    for (const sbd of Object.keys(day)) {
      for (const k of ['maCa', 'sbd', 'lanThu', 'trangThai', 'hoTen', 'row', 'nopLuc', 'vaoLuc', 'idThietBi', 'ghiChu']) {
        expect(nhe[sbd][k], `${sbd}.${k}`).toEqual(day[sbd][k])
      }
    }
  })

  it('bản nhẹ CỐ Ý bỏ trống ba cột nặng — đường vào thi không cần bài làm', () => {
    const gs = dungGs({}, { moBang: 0, timSheet: 0 })
    const nhe = gs.luotMoiNhatTheoSbd_(luotGia(30), '903093', true)
    const m = nhe['1000']
    expect(m.dapAnJson).toBe('')
    expect(m.integrityJson).toBe('')
    expect(m.giayCauJson).toBe('')
  })

  it('bản đầy đủ VẪN trả bài làm — listSubmissions và chiTietCa cần nó', () => {
    const gs = dungGs({}, { moBang: 0, timSheet: 0 })
    const day = gs.luotMoiNhatTheoSbd_(luotGia(30), '903093')
    expect(String(day['1000'].dapAnJson)).toHaveLength(5000)
    expect(String(day['1000'].integrityJson)).toHaveLength(5000)
  })

  it('bản nhẹ đọc ít ô hơn hẳn', () => {
    const gs = dungGs({}, { moBang: 0, timSheet: 0 })
    const a = luotGia(30)
    const b = luotGia(30)
    gs.luotMoiNhatTheoSbd_(a, '903093')
    gs.luotMoiNhatTheoSbd_(b, '903093', true)
    expect(a.soODoc).toBe(31 * 22)
    expect(b.soODoc).toBe(31 * (8 + 2 + 9)) // ba dải, bỏ đúng ba cột JSON
    expect(b.soODoc).toBeLessThan(a.soODoc)
    expect(b.soLanDocCaBang).toBe(0)
  })
})

describe('getSheet_ mở bảng MỘT LẦN cho mỗi request', () => {
  it('gọi năm lần chỉ mở bảng một lần, tìm sheet một lần cho mỗi tên', () => {
    const dem = { moBang: 0, timSheet: 0 }
    const sheets: Record<string, SheetDem> = { A: new SheetDem([['x']]), B: new SheetDem([['x']]) }
    const gs = dungGs(sheets, dem)
    for (let i = 0; i < 5; i++) gs.getSheet_('A', ['x'])
    for (let i = 0; i < 5; i++) gs.getSheet_('B', ['x'])
    expect(dem.moBang).toBe(1)
    expect(dem.timSheet).toBe(2)
  })
})

describe('ĐỌC ĐỀ NGOÀI KHOÁ — cả lớp vào thi cùng lúc không xếp hàng', () => {
  const vaoThi = gsCode.slice(gsCode.indexOf("if (action === 'vaoThi')"), gsCode.indexOf("if (action === 'duyetThiLai')"))

  it('docJsonLon_ của đề chạy TRƯỚC lock.waitLock', () => {
    const iDoc = vaoThi.indexOf('const bankGui =')
    const iKhoa = vaoThi.indexOf('lock.waitLock(')
    expect(iDoc).toBeGreaterThan(0)
    expect(iKhoa).toBeGreaterThan(0)
    expect(iDoc).toBeLessThan(iKhoa)
  })

  it('trong vùng khoá KHÔNG còn lệnh đọc Drive nào', () => {
    const i = vaoThi.indexOf('lock.waitLock(')
    const j = vaoThi.indexOf('lock.releaseLock()')
    const trongKhoa = vaoThi.slice(i, j)
    expect(trongKhoa).not.toContain('docJsonLon_')
    expect(trongKhoa).not.toContain('DriveApp')
  })

  it('đề vẫn được gửi đúng khi máy em chưa có bản cache', () => {
    expect(vaoThi).toContain('if (body.canBank) out.bank = bankGui')
  })
})

// ---------------------------------------------------------------------------
// GIẢM TẢI TỪ PHÍA MÁY HỌC SINH
//
// Đây mới là con số quyết định một ca thi ba mươi em: mỗi em bắn 270 lệnh trạng
// thái + 135 lệnh lưu tạm = 405 lệnh trong 45 phút. Ba mươi em là hơn 12.000
// lệnh, và cả lớp vào cùng lúc nên mọi máy đập cùng một nhịp.

describe('lệch pha — ba mươi máy không đập cùng một nhịp', () => {
  it('chu kỳ giãn ra trong khoảng đã định, không bao giờ ngắn hơn gốc', async () => {
    const { LECH_PHA, chuKyLechPha } = await import('../src/lib/exam-api')
    expect(chuKyLechPha(20, () => 0)).toBe(20)
    expect(chuKyLechPha(20, () => 1)).toBe(Math.round(20 * (1 + LECH_PHA)))
    for (let i = 0; i < 200; i++) {
      const c = chuKyLechPha(20)
      expect(c).toBeGreaterThanOrEqual(20)
      expect(c).toBeLessThanOrEqual(Math.round(20 * (1 + LECH_PHA)))
    }
  })

  it('ba mươi máy cho ra nhiều chu kỳ khác nhau — đó là cả mục đích', async () => {
    const { chuKyLechPha } = await import('../src/lib/exam-api')
    const may = new Set(Array.from({ length: 30 }, () => chuKyLechPha(20)))
    expect(may.size).toBeGreaterThan(3)
  })

  it('màn thi tính chu kỳ MỘT LẦN rồi giữ nguyên cả ca', async () => {
    // Tính lại mỗi nhịp thì các nhịp lại xô về nhau, mất tác dụng lệch pha.
    const man = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(man).toContain('const chuKyRef = useRef({ trangThai: chuKyLechPha(10), luuTam: chuKyLechPha(CHU_KY_LUU_TAM_GIAY) })')
    expect(man).toContain('chuKyRef.current.trangThai * 1000')
    expect(man).toContain('chuKyRef.current.luuTam * 1000')
  })
})

describe('bỏ nhịp khi không có gì đổi', () => {
  const man = () => import('../src/screens/ExamTakeScreen.tsx?raw').then((m) => m.default)

  it('lưu tạm bỏ nhịp khi đáp án y nguyên, nhưng nhịp CUỐI vẫn gửi', async () => {
    const ma = await man()
    expect(ma).toContain('if (chiKhiDoi && van === daGuiRef.current.luuTam) return')
    // nhịp cuối lúc rời màn gọi không tham số ⇒ chiKhiDoi = false ⇒ gửi vô điều kiện
    expect(ma).toContain('const luu = (chiKhiDoi = false) => {')
    expect(ma).toMatch(/clearInterval\(id\)[\s\S]{0,200}luu\(\)/)
  })

  it('trạng thái vẫn BÁO SỐNG dù không đổi — thầy phải phân biệt "đang nghĩ" với "tắt máy"', async () => {
    const ma = await man()
    expect(ma).toContain('nay - daGuiRef.current.mocBaoSong < NHIP_BAO_SONG_GIAY * 1000')
  })

  it('nộp bài và khoá bài KHÔNG đi qua đường bỏ nhịp', async () => {
    const ma = await man()
    // Tham số thứ BA là `chiKhiDoi`. Chỉ đúng một chỗ truyền nó — nhịp nền.
    // Nộp bài, khoá bài, vào bài đều gọi hai tham số ⇒ gửi vô điều kiện.
    expect((ma.match(/pushStatusNow\([^)]*,[^,)]*,\s*true\)/g) || []).length).toBe(1)
  })
})
