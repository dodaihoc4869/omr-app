// GHI CHÉO DÒNG TRONG LuotThi — tìm được khi rà soát lần hai trước ca thi đông
// tối 09/09. Chưa ai báo lỗi này; nó im lặng theo đúng nghĩa đen.
//
// HÌNH DẠNG LỖI. Bảng LuotThi được ghi theo CHỈ SỐ DÒNG:
//
//     const data = sh.getDataRange().getValues()   // đọc cả bảng
//     ... tìm ra luotRow ...
//     sh.getRange(luotRow, 7, 1, 6).setValues(...)  // ghi theo chỉ số
//
// Giữa lúc đọc và lúc ghi có vài lượt gọi Sheets — vài trăm mili giây tới hơn
// một giây. `choThiLai` là lệnh DUY NHẤT xoá dòng LuotThi khi ca đang chạy, và
// xoá một dòng là mọi dòng bên dưới dồn lên một bậc. Lệnh nào đang cầm chỉ số
// dòng trong cửa sổ đó sẽ ghi vào DÒNG CỦA EM KHÁC: bài làm, giờ nộp, trạng
// thái của em này đè lên lượt của em kia.
//
// "Cho thi lại" đúng là việc thầy làm GIỮA CA khi máy một em chết — nên cửa sổ
// này không phải giả tưởng, và ca càng đông càng dễ trúng.
//
// `vaoThi` và `luuTam` đã khoá đúng kiểu này từ trước. Bốn lệnh còn lại đụng
// LuotThi thì bị bỏ sót: `submit` · `choThiLai` · `moKhoa` · `duyetThiLai`.
//
// KHÔNG khoá `examStatus`: nó chỉ ghi bảng TrangThai theo khoá SBD, không cầm
// chỉ số dòng của LuotThi, và là nhịp nóng nhất của ca. Khoá nó là tự bóp cổ
// mình mà chẳng chặn được gì.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

/** Thân của một khối `if (action === '<tên>')`, cắt bằng KHỚP NGOẶC.
 *
 * Bản đầu của phép kiểm này cắt "tới khối action kế tiếp". Sai, và sai theo
 * hướng nguy hiểm nhất: khối `luuTam` không có khối action nào ngay sau nó ở
 * cùng mức thụt đầu dòng, nên lát cắt NUỐT LUÔN khối `khoaCa` bên dưới — mà
 * khối đó CÓ khoá. Thế là `luuTam` "đạt" trong khi thật ra nó không hề khoá.
 * Một phép kiểm nói dối còn tệ hơn không có phép kiểm nào. */
function khoiAction(ten: string): string {
  const neo = `  if (action === '${ten}') {`
  const a = GS.indexOf(neo)
  expect(a, `không thấy khối action '${ten}'`).toBeGreaterThanOrEqual(0)
  let i = a + neo.length - 1
  expect(GS[i]).toBe('{')
  let n = 0
  for (let j = i; j < GS.length; j++) {
    if (GS[j] === '{') n++
    else if (GS[j] === '}') {
      n--
      if (n === 0) return GS.slice(a, j + 1)
    }
  }
  throw new Error(`khối ${ten} không đóng ngoặc`)
}

/** Mọi tên action có trong tệp. */
function moiAction(): string[] {
  return [...GS.matchAll(/\n {2}if \(action === '([A-Za-z]+)'\)/g)].map((m) => m[1])
}

/** Lệnh này có GHI vào bảng LuotThi không — đọc để kiểm quyền thì KHÔNG tính.
 *
 * Phép dò đầu của tôi chỉ hỏi "có nhắc `sheetLuot_()` không", nên gắn cờ nhầm
 * `ghiPhieuKhacPhuc` — lệnh đó chỉ ĐỌC LuotThi để kiểm quyền rồi ghi bảng Phieu.
 * Bắt cả lệnh chỉ đọc là bắt khoá thừa, mà khoá thừa ở nhịp nóng thì tự bóp cổ
 * mình. Nay chỉ tính lệnh thật sự GHI: qua biến gán từ `sheetLuot_()`, hoặc gọi
 * thẳng `sheetLuot_().getRange(...).setValues`. */
function ghiVaoLuotThi(than: string): boolean {
  if (/sheetLuot_\(\)\s*\.\s*getRange\([^)]*\)\s*\.\s*setValues/.test(than)) return true
  for (const m of than.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*sheetLuot_\(\)/g)) {
    const v = m[1].replace(/[$]/g, '\\$')
    if (new RegExp(`\\b${v}\\s*\\.\\s*(?:appendRow|deleteRows?|insertRow)\\(`).test(than)) return true
    if (new RegExp(`\\b${v}\\s*\\.\\s*getRange\\([^)]*\\)\\s*\\.\\s*setValues?\\(`).test(than)) return true
  }
  // `choThiLai` dùng biến shTL lấy từ sheetLuot_() qua nhiều dòng.
  return /shTL\s*\.\s*(?:deleteRow|appendRow)\(/.test(than)
}

// Lệnh THƯA: đóng cửa sổ bằng khoá.
const PHAI_KHOA = ['vaoThi', 'submit', 'choThiLai', 'moKhoa', 'duyetThiLai', 'sendFeedback', 'ghiDiem', 'dongBoTenCa']

describe('mọi lệnh ghi LuotThi phải cầm CÙNG một khoá', () => {
  for (const ten of PHAI_KHOA) {
    it(`${ten} có khoá`, () => {
      const than = khoiAction(ten)
      expect(ghiVaoLuotThi(than), `${ten} lẽ ra phải GHI vào LuotThi`).toBe(true)
      expect(than).toContain('LockService.getScriptLock()')
      expect(than).toContain('.waitLock(15000)')
      expect(than).toMatch(/finally \{[\s\S]{0,80}\.releaseLock\(\)/)
    })
  }

  it('KHÔNG SÓT: mọi lệnh GHI LuotThi đều có khoá hoặc có kiểm lại dòng', () => {
    const sot: string[] = []
    for (const ten of new Set(moiAction())) {
      const than = khoiAction(ten)
      if (!ghiVaoLuotThi(than)) continue
      // Hai cách đóng cửa sổ đều được: khoá, hoặc kiểm lại khoá dòng ngay trước
      // khi ghi. `luuTam` chọn cách thứ hai vì nó là nhịp ghi dày nhất của ca.
      if (!than.includes('LockService') && !than.includes('dungDongChua_')) sot.push(ten)
    }
    expect(sot, `còn sót: ${sot.join(', ')}`).toEqual([])
  })

  it('examStatus CỐ Ý không khoá — nhịp nóng nhất, và không cầm chỉ số LuotThi', () => {
    const than = khoiAction('examStatus')
    expect(than).not.toContain('LockService')
    expect(ghiVaoLuotThi(than)).toBe(false)
  })

  it('lệnh chỉ ĐỌC LuotThi thì KHÔNG bắt khoá — khoá thừa ở nhịp nóng là tự hại', () => {
    const than = khoiAction('ghiPhieuKhacPhuc')
    expect(than).toContain('sheetLuot_()')
    expect(ghiVaoLuotThi(than)).toBe(false)
  })

  it('choThiLai — lệnh xoá dòng — nằm TRỌN trong khoá', () => {
    const than = khoiAction('choThiLai')
    const viKhoa = than.indexOf('lockThiLai.waitLock(15000)')
    const viXoa = than.indexOf('deleteRow')
    const viNha = than.indexOf('lockThiLai.releaseLock()')
    expect(viKhoa).toBeGreaterThan(0)
    expect(viXoa).toBeGreaterThan(viKhoa)
    expect(viNha).toBeGreaterThan(viXoa)
  })

  it('submit — khoá bao TRỌN quãng từ lúc đọc bảng tới lúc ghi xong', () => {
    const than = khoiAction('submit')
    const viKhoa = than.indexOf('lockNopBai.waitLock(15000)')
    const viDoc = than.indexOf('sh.getDataRange().getValues()')
    const viGhi = than.indexOf('sh.getRange(luotRow, 20, 1, 3).setValues')
    const viNha = than.indexOf('lockNopBai.releaseLock()')
    expect(viKhoa).toBeGreaterThan(0)
    expect(viDoc).toBeGreaterThan(viKhoa)
    expect(viGhi).toBeGreaterThan(viDoc)
    expect(viNha).toBeGreaterThan(viGhi)
  })

  it('đọc keyBank nằm NGOÀI khoá — không giữ khoá lâu hơn mức cần', () => {
    const than = khoiAction('submit')
    expect(than.indexOf('docJsonLon_(ca.keyBankRef)')).toBeGreaterThan(than.indexOf('lockNopBai.releaseLock()'))
  })

  it('luuTam CỐ Ý không khoá — nhịp ghi dày nhất, đóng cửa sổ bằng kiểm lại dòng', () => {
    const than = khoiAction('luuTam')
    expect(ghiVaoLuotThi(than)).toBe(true)
    expect(than).not.toContain('LockService')
    expect(than).toContain('dungDongChua_(shT, dongT, maCa, sbd, luotT.lanThu)')
    // Kiểm phải đứng TRƯỚC mọi lượt ghi, không thì kiểm để làm gì.
    expect(than.indexOf('dungDongChua_')).toBeLessThan(than.indexOf('.setValue(JSON.stringify(body.dapAn'))
    // Lệch mà tìm lại vẫn lệch thì THÔI, không ghi liều.
    expect(than).toContain("lyDo: 'dong_da_doi'")
    // Và phải ghi theo dòng ĐÃ KIỂM, không phải dòng cũ.
    expect(than).toContain('shT.getRange(dongT, 9)')
    expect(than).not.toContain('shT.getRange(luotT.row, 9)')
  })

  it('dungDongChua_ so ĐỦ BA khoá: mã ca, số báo danh, lần thứ', () => {
    const d = GS.indexOf('function dungDongChua_(')
    expect(d).toBeGreaterThan(0)
    const than = GS.slice(d, d + 700)
    expect(than).toContain('sh.getRange(row, 1, 1, 3).getValues()[0]')
    expect(than).toContain('String(o[0]) === String(maCa)')
    expect(than).toContain('String(o[1]) === String(sbd)')
    expect(than).toContain('(Number(o[2]) || 1) === (Number(lanThu) || 1)')
    // Đọc hỏng thì coi như KHÔNG đúng dòng — thà bỏ nhịp còn hơn ghi nhầm.
    expect(than).toMatch(/catch \(err\) \{\s*\n\s*return false/)
  })

  it('mã .gs vẫn hợp lệ về cú pháp sau khi bọc khoá', () => {
    // Bọc khoá là chèn try/finally quanh cả khối — dễ lệch ngoặc nhất.
    expect(() => new Function(GS)).not.toThrow()
  })
})
