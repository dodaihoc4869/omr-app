// MÁY CHỦ ĐỌC CẢ BẢNG — chỗ làm app chậm dần và treo lúc cả lớp nộp bài.
//
// ĐO ĐƯỢC (10/09 tối, thầy báo "vẫn treo"):
//
//   Mỗi lượt gọi máy chủ  2,5 – 5 giây, KỂ CẢ lệnh đọc vặt
//   CaKiemTra    83 dòng · 2 537 KB — riêng cột BankJson 2 523 KB, tức 99%
//   LuotThi     282 dòng ·   316 KB — ba cột JSON chiếm 267 KB, tức 85%
//   ChiTietCau 4 857 dòng ·  394 KB — dài ra mãi, không có gì dọn
//   layPhieu (đường của phụ huynh)  4 777 ms trung bình, 4 lượt đo
//
//   Lúc 14 em ca 817428 đang nộp: `danhSachCa` — lệnh đọc nhẹ nhất — QUÁ 25
//   GIÂY rồi hỏng. Phụ huynh mở link đúng lúc đó cũng hỏng y hệt.
//
// Nặng nhất là `submit`: nó GIỮ KHOÁ TOÀN CỤC rồi mới đọc cả bảng. Khoá toàn
// cục nghĩa là cả lớp xếp hàng một.
//
// PHÉP KIỂM NÀY CHẠY THẬT BA HÀM ĐỌC, không chỉ soi chữ trong mã: rút thân hàm
// từ chính tệp `.gs` rồi cho chạy trên một Sheet giả có đếm số ô đã đọc.
//
// ĐIỀU KIỆN SỐNG CÒN: `docKhoiLuotCuaCa_` phải GIỮ NGUYÊN CHỈ SỐ DÒNG.
// `ghiDiem` ghi điểm theo chỉ số dòng — lệch một bậc là ghi điểm của em này vào
// bài của em khác, sai lặng lẽ và chéo người.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

/** Rút một hàm khai bằng `function ten(...) { ... }` ra khỏi tệp .gs. */
function rutHam(ten: string): string {
  const dau = GS.indexOf(`function ${ten}(`)
  if (dau < 0) throw new Error(`Không thấy hàm ${ten} trong .gs`)
  let i = GS.indexOf('{', dau)
  let sau = 0
  for (let k = i; k < GS.length; k++) {
    if (GS[k] === '{') sau++
    else if (GS[k] === '}') {
      sau--
      if (sau === 0) return GS.slice(dau, k + 1)
    }
  }
  throw new Error(`Hàm ${ten} không đóng ngoặc`)
}

/** Lấy nguyên văn một hằng số mảng tiêu đề từ .gs — dùng đúng giá trị thật. */
function rutHang(ten: string): string[] {
  const m = new RegExp(`const ${ten} = (\\[[^\\]]*\\])`).exec(GS)
  if (!m) throw new Error(`Không thấy hằng ${ten}`)
  return JSON.parse(m[1].replace(/'/g, '"')) as string[]
}

const LUOT_HEADERS = rutHang('LUOT_HEADERS')
const CA_HEADERS = rutHang('CA_HEADERS')

interface Doc {
  o: number
  lan: number
}

/** Sheet giả: trả dữ liệu, và ĐẾM số ô mỗi lượt đọc chạm vào. */
function sheetGia(bang: unknown[][], dem: Doc) {
  return {
    getLastRow: () => bang.length,
    getRange(r: number, c: number, sr = 1, sc = 1) {
      dem.o += sr * sc
      dem.lan += 1
      return {
        getValues: () => bang.slice(r - 1, r - 1 + sr).map((d) => d.slice(c - 1, c - 1 + sc)),
      }
    },
  }
}

/** Hằng số đọc THẲNG từ .gs — không chép tay, không tin trí nhớ. (Bản đầu của
 * phép kiểm này quên truyền `NGUONG_DOC_KHOI` vào sandbox, hàm ném
 * ReferenceError ngay lúc dựng nên cả tệp báo "no tests" chứ không báo lỗi thật.) */
function rutSo(ten: string): number {
  const m = new RegExp(`const ${ten} = (\\d+)`).exec(GS)
  if (!m) throw new Error(`Không thấy hằng ${ten}`)
  return Number(m[1])
}
const NGUONG_DOC_KHOI = rutSo('NGUONG_DOC_KHOI')

const chay = new Function(
  'LUOT_HEADERS',
  'CA_HEADERS',
  'NGUONG_DOC_KHOI',
  `${rutHam('docLuotNhe_')}\n${rutHam('docKhoiLuotCuaCa_')}\n${rutHam('docCaNhe_')}\n${rutHam('docKhoaChiTiet_')}
   return { docLuotNhe_, docKhoiLuotCuaCa_, docCaNhe_, docKhoaChiTiet_ }`,
) as (l: string[], c: string[], n: number) => Record<string, (...a: unknown[]) => unknown[][]>

const H = chay(LUOT_HEADERS, CA_HEADERS, NGUONG_DOC_KHOI)

/** Bảng LuotThi giả đúng dáng thật: 22 cột, ba cột JSON nặng. */
function bangLuot(soCa: number, emMoiCa: number) {
  const b: unknown[][] = [LUOT_HEADERS.slice()]
  for (let c = 0; c < soCa; c++) {
    for (let e = 0; e < emMoiCa; e++) {
      const d = new Array(LUOT_HEADERS.length).fill('')
      d[0] = `ca${c}`
      d[1] = `1${String(e).padStart(4, '0')}`
      d[2] = 1
      d[7] = 'da_nop'
      d[8] = 'X'.repeat(500) // DapAnJson
      d[11] = 'Y'.repeat(120) // IntegrityJson
      d[12] = `Em ${e}`
      d[16] = 7.5
      d[21] = 'Z'.repeat(400) // GiayCauJson
      b.push(d)
    }
  }
  return b
}

describe('docLuotNhe_ — bỏ ba cột JSON, giữ nguyên mọi cột khác', () => {
  const b = bangLuot(10, 28)
  const dem = { o: 0, lan: 0 }
  const ra = H.docLuotNhe_(sheetGia(b, dem))

  it('trả ĐÚNG dáng cũ: cùng số dòng, cùng số cột', () => {
    expect(ra.length).toBe(b.length)
    expect(ra[1].length).toBe(LUOT_HEADERS.length)
  })

  it('giữ nguyên các cột mọi lệnh đang dùng', () => {
    expect(ra[1][0]).toBe('ca0') // MaCa
    expect(ra[1][1]).toBe('10000') // SBD
    expect(ra[1][2]).toBe(1) // LanThu
    expect(ra[1][7]).toBe('da_nop') // TrangThai
    expect(ra[1][12]).toBe('Em 0') // HoTen
    expect(ra[1][16]).toBe(7.5) // Tong
  })

  it('BA CỘT JSON trả về rỗng — cố ý, để chỗ nào lỡ đọc thì thấy trống chứ không thấy dữ liệu lạ', () => {
    expect(ra[1][8]).toBe('')
    expect(ra[1][11]).toBe('')
    expect(ra[1][21]).toBe('')
  })

  // ĐO BẰNG KHỐI LƯỢNG CHỮ, KHÔNG PHẢI SỐ Ô. Ba cột JSON chỉ là 3 ô trên 22,
  // nhưng chúng mang 85% khối lượng của bảng — đếm ô thì con số trông như không
  // cải thiện gì, mà thứ Apps Script phải kéo về là byte chứ không phải ô.
  it('KHỐI LƯỢNG CHỮ giảm hẳn — ba cột JSON là chỗ nặng thật', () => {
    const nang = (m: unknown[][]) => m.reduce((t, d) => t + d.reduce((u: number, o) => u + String(o ?? '').length, 0), 0)
    const truoc = nang(b)
    const sau = nang(ra)
    // eslint-disable-next-line no-console
    console.log(`[LuotThi] đọc cả bảng ${(truoc / 1024) | 0} KB · đọc hẹp ${(sau / 1024) | 0} KB — giảm ${(1 - sau / truoc) * 100 | 0}%`)
    expect(sau).toBeLessThan(truoc * 0.2)
  })
})

describe('docKhoiLuotCuaCa_ — CHỈ SỐ DÒNG PHẢI GIỮ NGUYÊN', () => {
  const b = bangLuot(10, 28)
  const dem = { o: 0, lan: 0 }
  const ra = H.docKhoiLuotCuaCa_(sheetGia(b, dem), 'ca5')

  it('dòng của ca nằm ĐÚNG chỉ số cũ — `ghiDiem` ghi theo `i + 1`', () => {
    for (let i = 1; i < b.length; i++) {
      if (String(b[i][0]) === 'ca5') {
        expect(ra[i][0]).toBe('ca5')
        expect(ra[i][1]).toBe(b[i][1])
        expect(ra[i][8]).toBe(b[i][8]) // CẦN nội dung bài làm, không bỏ trống
      }
    }
  })

  it('dòng NGOÀI khối là mảng rỗng — vòng lặp cũ lọc theo MaCa nên tự bỏ qua', () => {
    const ngoai = b.findIndex((d, i) => i > 0 && String(d[0]) !== 'ca5')
    expect(ra[ngoai].length).toBe(0)
    expect(String(ra[ngoai][0])).toBe('undefined') // không khớp mã ca nào
  })

  // NGƯỠNG — thêm sau khi ĐO THẬT trên bản v71 vừa triển khai.
  //
  // Đường "một cột khoá rồi một khối dòng" tốn HAI lượt gọi Sheets. Với bảng
  // nhỏ, hai lượt gọi đắt hơn một lượt đọc cả bảng dù số ô ít hơn hẳn:
  // `chiTietCa` 10 lượt đồng thời đo được p50 5–6 giây ở v70 nhưng 8,98 giây ở
  // v71. Nên dưới ngưỡng thì đi một lượt, trên ngưỡng mới tách hai.
  it('bảng LỚN thì đọc ít hơn hẳn — đường hai lượt bật lên', () => {
    const to = bangLuot(60, 30) // 1 801 dòng, trên ngưỡng
    const d = { o: 0, lan: 0 }
    H.docKhoiLuotCuaCa_(sheetGia(to, d), 'ca5')
    const caBang = to.length * LUOT_HEADERS.length
    // eslint-disable-next-line no-console
    console.log(`[một ca · bảng lớn ${to.length} dòng] cả bảng ${caBang} ô · đọc khối ${d.o} ô — giảm ${(1 - d.o / caBang) * 100 | 0}%`)
    expect(d.lan).toBe(2)
    expect(d.o).toBeLessThan(caBang / 3)
  })

  it('bảng NHỎ thì CHỈ MỘT lượt gọi Sheets — hai lượt đắt hơn', () => {
    const nho = bangLuot(10, 28) // 281 dòng, cỡ thật hiện nay
    const d = { o: 0, lan: 0 }
    const ra2 = H.docKhoiLuotCuaCa_(sheetGia(nho, d), 'ca5')
    expect(d.lan).toBe(1)
    // và vẫn phải trả ĐÚNG dữ liệu, đúng chỉ số dòng
    for (let i = 1; i < nho.length; i++) {
      if (String(nho[i][0]) === 'ca5') expect(ra2[i][1]).toBe(nho[i][1])
      else expect(ra2[i].length).toBe(0)
    }
  })

  it('ca không có dòng nào thì trả mảng rỗng an toàn, không nổ', () => {
    const d2 = { o: 0, lan: 0 }
    const ra2 = H.docKhoiLuotCuaCa_(sheetGia(bangLuot(3, 2), d2), 'ca-khong-co')
    expect(ra2.every((x) => x.length === 0)).toBe(true)
  })

  it('bảng rỗng (chưa ai thi) không nổ', () => {
    const d3 = { o: 0, lan: 0 }
    expect(() => H.docKhoiLuotCuaCa_(sheetGia([LUOT_HEADERS.slice()], d3), 'ca0')).not.toThrow()
  })
})

describe('docCaNhe_ — bỏ cột BankJson, tức 99% khối lượng của CaKiemTra', () => {
  const b: unknown[][] = [CA_HEADERS.slice()]
  for (let i = 0; i < 83; i++) {
    const d = new Array(CA_HEADERS.length).fill('')
    d[0] = `ma${i}`
    d[1] = '12'
    d[4] = 'B'.repeat(31000) // BankJson — cỡ thật đo được
    d[9] = 'mo'
    d[10] = `2009 - Lớp ${i}`
    d[17] = 'thi'
    b.push(d)
  }
  const dem = { o: 0, lan: 0 }
  const ra = H.docCaNhe_(sheetGia(b, dem))

  it('giữ nguyên mọi cột `danhSachCa` dùng', () => {
    expect(ra[1][0]).toBe('ma0')
    expect(ra[1][9]).toBe('mo')
    expect(ra[1][10]).toBe('2009 - Lớp 0')
    expect(ra[1][17]).toBe('thi')
    expect(ra[1].length).toBe(CA_HEADERS.length)
  })

  it('cột BankJson trả rỗng', () => {
    expect(ra[1][4]).toBe('')
  })

  it('KHỐI LƯỢNG CHỮ giảm gần hết — đây là con số thầy sẽ thấy', () => {
    const nang = (m: unknown[][]) => m.reduce((t, d) => t + d.reduce((u: number, o) => u + String(o ?? '').length, 0), 0)
    const truoc = nang(b)
    const sau = nang(ra)
    // eslint-disable-next-line no-console
    console.log(`[CaKiemTra] đọc cả bảng ${(truoc / 1024) | 0} KB · đọc hẹp ${(sau / 1024) | 0} KB — giảm ${(1 - sau / truoc) * 100 | 0}%`)
    expect(sau).toBeLessThan(truoc * 0.05)
  })
})

describe('docKhoaChiTiet_ — bảng dài nhất, chỉ cần ba cột khoá', () => {
  it('trả đúng ba cột', () => {
    const b: unknown[][] = [['MaCa', 'SBD', 'LanThu', 'Phan', 'SoCau', 'Qid']]
    for (let i = 0; i < 4857; i++) b.push(['ca1', '10001', 1, 'I', i, 'q' + i])
    const dem = { o: 0, lan: 0 }
    const ra = H.docKhoaChiTiet_(sheetGia(b, dem))
    expect(ra[1]).toEqual(['ca1', '10001', 1])
    // eslint-disable-next-line no-console
    console.log(`[ChiTietCau] đọc cả bảng ${b.length * 13} ô · đọc khoá ${dem.o} ô`)
    expect(dem.o).toBeLessThan(b.length * 13)
  })
})

describe('MÃ NGUỒN — hai bảng nặng KHÔNG còn chỗ nào đọc cả bảng', () => {
  const dong = GS.split('\n')

  function chuaGetDataRange(tenHam: string): string[] {
    const ra: string[] = []
    let act = ''
    for (let i = 0; i < dong.length; i++) {
      const m = /action === '([A-Za-z0-9_]+)'/.exec(dong[i])
      if (m) act = m[1]
      if (!dong[i].includes('getDataRange()')) continue
      const ctx = dong.slice(Math.max(0, i - 10), i).join('\n')
      if (ctx.includes(tenHam) || dong[i].includes(tenHam)) ra.push(`${i + 1} (${act})`)
    }
    return ra
  }

  it('KHÔNG lệnh nào đọc cả bảng LuotThi nữa', () => {
    expect(chuaGetDataRange('sheetLuot_()')).toEqual([])
  })

  it('KHÔNG lệnh nào đọc cả bảng CaKiemTra nữa', () => {
    expect(chuaGetDataRange('sheetCa_()')).toEqual([])
    expect(GS).not.toContain('getSheet_(SHEET_CA, CA_HEADERS).getDataRange()')
  })

  it('VÙNG KHOÁ CỦA `submit` chỉ đọc ba cột khoá rồi đọc một dòng', () => {
    const dau = GS.indexOf('lockNopBai.waitLock(15000)')
    const cuoi = GS.indexOf('lockNopBai.releaseLock()')
    expect(dau).toBeGreaterThan(0)
    const than = GS.slice(dau, cuoi)
    expect(than).not.toContain('getDataRange()')
    expect(than).toContain('sh.getRange(1, 1, soDongL, 3).getValues()')
    expect(than).toContain('sh.getRange(luotRow, 1, 1, LUOT_HEADERS.length).getValues()[0]')
  })

  it('`chotLuotQuaGio_` chạy trong khoá nên cũng phải đọc hẹp', () => {
    const than = GS.slice(GS.indexOf('function chotLuotQuaGio_('), GS.indexOf('function chotLuotQuaGio_(') + 2000)
    expect(than).toContain('docKhoiLuotCuaCa_(sh, maCa)')
    expect(than).not.toContain('sh.getDataRange()')
  })

  it('`layPhieu` — đường của phụ huynh — chỉ MỘT lượt đọc và MỘT lượt ghi cho bộ đếm', () => {
    const dau = GS.indexOf("if (action === 'layPhieu')")
    const than = GS.slice(dau, dau + 1400)
    expect(than).toContain('sh.getRange(row, 7, 1, 2)')
    expect(than).not.toContain('sh.getRange(row, 7).setValue')
    expect(than).not.toContain('sh.getRange(row, 8).setValue')
  })
})
