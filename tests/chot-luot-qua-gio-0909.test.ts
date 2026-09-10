// CA THI XONG MÀ EM VẪN "ĐANG LÀM", Ô ĐIỂM LÀ DẤU GẠCH — thầy báo 09/09 19:11,
// kèm ảnh màn Ca thi: bốn em vào lúc 18:00, đến 19:08 vẫn "Đang làm".
//
// NGUYÊN NHÂN GỐC: máy em hết giờ thì TỰ NỘP, nhưng em nào tắt app, hết pin hay
// mất mạng đúng lúc đó thì KHÔNG AI đóng lượt hộ. Máy chủ để `dang_lam` mãi, mà
// màn Ca thi chỉ chấm lượt `da_nop`/`khoa` ⇒ không có điểm, và không có gì trên
// màn nói vì sao.
//
// Nút KHOÁ CA có làm đúng việc này (chuyển `dang_lam` → `da_nop`, chấm theo bản
// lưu tạm), nhưng đó là việc thầy PHẢI NHỚ BẤM. Quên là em mất điểm.
//
// SỬA: `chiTietCa` tự chốt lượt đã QUÁ GIỜ trước khi trả về. Chỉ chốt lượt đã
// qua `hetGioLuc` cộng biên an toàn — quá giờ rồi thì em không làm thêm được
// nữa, nên không cướp bài của ai.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

function layHam(ten: string): string {
  const dau = GS.indexOf('function ' + ten + '(')
  expect(dau, 'không thấy ' + ten).toBeGreaterThan(0)
  let n = 0
  for (let i = GS.indexOf('{', dau); i < GS.length; i++) {
    if (GS[i] === '{') n++
    else if (GS[i] === '}') {
      n--
      if (n === 0) return GS.slice(dau, i + 1)
    }
  }
  throw new Error(ten + ' không đóng ngoặc')
}

/** Một dòng LuotThi giả, đủ các cột `docLuot_` đọc. */
function dong(maCa: string, sbd: string, trangThai: string, hetGioLuc: string) {
  const v = new Array(24).fill('')
  v[0] = maCa; v[1] = sbd; v[2] = 1; v[4] = ''; v[5] = hetGioLuc; v[7] = trangThai
  return v
}

/** Hằng biên an toàn đọc THẲNG từ .gs — không chép tay, không tin trí nhớ.
 * (Bản đầu của phép kiểm này quên truyền nó vào sandbox, hàm ném ReferenceError
 * rồi bị chính `catch` của nó nuốt, nên mọi phép kiểm đều thấy "chốt 0 lượt" mà
 * không thấy lỗi. Nuốt lỗi giúp màn Ca thi không chết, nhưng làm phép kiểm mù —
 * nên hằng phải nạp từ tệp thật.) */
function bienMs(): number {
  const m = GS.match(/const BIEN_CHOT_QUA_GIO_MS = ([^\n]+)/)
  expect(m, 'không thấy BIEN_CHOT_QUA_GIO_MS').toBeTruthy()
  return Number(new Function(`return ${m![1]}`)())
}

/** Chạy ĐÚNG hàm `chotLuotQuaGio_` của tệp .gs trên một bảng giả. */
function chay(rows: unknown[][], now: number) {
  const ghi: { row: number; col: number; giaTri: unknown[][] }[] = []
  const env = {
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    // SHEET GIẢ PHẢI THEO KỊP API THẬT (cập nhật 10/09 khuya).
    //
    // `chotLuotQuaGio_` nay đọc bằng `docKhoiLuotCuaCa_` — một cột khoá cho cả
    // bảng rồi đúng khối dòng của ca — thay vì `getDataRange()`. Đổi vì hàm này
    // chạy TRONG KHOÁ và ở mỗi lượt `chiTietCa` của thầy.
    //
    // Bản giả cũ chỉ có `getDataRange` và một `getRange` chỉ biết `setValues`,
    // nên hàm mới không chạy được. Đây là bản giả của API Google, KHÔNG phải
    // phép kiểm — mở rộng nó cho khớp API thật là đúng việc; mọi câu kiểm tra
    // bên dưới giữ nguyên không đổi một chữ.
    sheetLuot_: () => ({
      getLastRow: () => rows.length,
      getDataRange: () => ({ getValues: () => rows }),
      getRange: (row: number, col: number, soDong?: number, soCot?: number) => ({
        setValues: (v: unknown[][]) => ghi.push({ row, col, giaTri: v }),
        getValues: () =>
          rows
            .slice(row - 1, row - 1 + (soDong ?? 1))
            .map((d) => (d as unknown[]).slice(col - 1, col - 1 + (soCot ?? 1))),
      }),
    }),
    docLuot_: (v: unknown[]) => ({
      maCa: String(v[0]), sbd: String(v[1]), lanThu: Number(v[2]) || 1,
      hetGioLuc: v[5] ? String(v[5]) : '', trangThai: v[7] ? String(v[7]) : '', ghiChu: v[19] ? String(v[19]) : '',
    }),
    msCua_: (iso: string) => { const t = new Date(iso).getTime(); return isFinite(t) ? t : NaN },
    BIEN_CHOT_QUA_GIO_MS: bienMs(),
    LUOT_HEADERS: JSON.parse((/const LUOT_HEADERS = (\[[^\]]*\])/.exec(GS) ?? ['', '[]'])[1].replace(/'/g, '"')) as string[],
    // Truyền ĐỦ mọi hằng hàm này dùng. Thiếu một hằng thì nó ném
    // ReferenceError, mà `chotLuotQuaGio_` nuốt lỗi (cố ý, để màn Ca thi không
    // chết) — nên phép kiểm sẽ thấy "chốt 0 lượt" chứ không thấy lỗi thật.
    docKhoiLuotCuaCa_: new Function('LUOT_HEADERS', 'NGUONG_DOC_KHOI', `${layHam('docKhoiLuotCuaCa_')}\nreturn docKhoiLuotCuaCa_`)(
      JSON.parse((/const LUOT_HEADERS = (\[[^\]]*\])/.exec(GS) ?? ['', '[]'])[1].replace(/'/g, '"')),
      Number((/const NGUONG_DOC_KHOI = (\d+)/.exec(GS) ?? ['', '1200'])[1]),
    ) as (sh: unknown, maCa: string) => unknown[][],
    Date: class extends Date { constructor(...a: unknown[]) { if (a.length === 0) super(now); else super(...(a as [])) } static now() { return now } },
  }
  const ten = Object.keys(env)
  const f = new Function(...ten, `${layHam('chotLuotQuaGio_')}\nreturn chotLuotQuaGio_`)(...ten.map((k) => (env as Record<string, unknown>)[k]))
  return { so: f('C1') as number, ghi }
}

const HET = '2026-09-09T12:00:00.000Z' // 19:00 giờ VN
const SAU_5P = new Date(HET).getTime() + 5 * 60 * 1000
const TRUOC_KHI_HET = new Date(HET).getTime() - 60 * 1000

describe('chốt lượt quá giờ', () => {
  it('TÁI HIỆN: lượt đang làm đã quá giờ ⇒ chốt thành da_nop', () => {
    const r = chay([[], dong('C1', '12071', 'dang_lam', HET)], SAU_5P)
    expect(r.so).toBe(1)
    const ghiTrangThai = r.ghi.find((g) => g.col === 7)
    expect(ghiTrangThai?.giaTri[0][1]).toBe('da_nop')
    // Giờ nộp ghi đúng MỐC HẾT GIỜ, không ghi giờ máy chủ đang chạy — em nộp
    // lúc hết giờ chứ không phải lúc thầy tình cờ mở màn Ca thi.
    expect(ghiTrangThai?.giaTri[0][0]).toBe(HET)
  })

  it('CHƯA quá giờ ⇒ KHÔNG đụng — không cướp bài em đang làm', () => {
    expect(chay([[], dong('C1', '12071', 'dang_lam', HET)], TRUOC_KHI_HET).so).toBe(0)
  })

  it('vừa hết giờ nhưng chưa qua biên an toàn ⇒ chưa chốt, để lượt nộp kịp về', () => {
    const vuaHet = new Date(HET).getTime() + 30 * 1000
    expect(chay([[], dong('C1', '12071', 'dang_lam', HET)], vuaHet).so).toBe(0)
  })

  it('lượt ĐÃ NỘP hoặc ĐÃ KHOÁ ⇒ không đụng', () => {
    const r = chay([[], dong('C1', '1', 'da_nop', HET), dong('C1', '2', 'khoa', HET)], SAU_5P)
    expect(r.so).toBe(0)
    expect(r.ghi).toEqual([])
  })

  it('KHÔNG có hetGioLuc ⇒ BỎ QUA, không đoán (bài tập về nhà có thể không hạn)', () => {
    expect(chay([[], dong('C1', '12071', 'dang_lam', '')], SAU_5P).so).toBe(0)
    expect(chay([[], dong('C1', '12071', 'dang_lam', 'linh tinh')], SAU_5P).so).toBe(0)
  })

  it('chỉ chốt ĐÚNG ca đang mở, không đụng ca khác', () => {
    const r = chay([[], dong('C2', '12071', 'dang_lam', HET)], SAU_5P)
    expect(r.so).toBe(0)
  })

  it('KHÔNG đụng cột 9 (bài lưu tạm) — đó chính là phần em đã làm', () => {
    const r = chay([[], dong('C1', '12071', 'dang_lam', HET)], SAU_5P)
    expect(r.ghi.some((g) => g.col === 9)).toBe(false)
    expect(r.ghi.map((g) => g.col).sort((a, b) => a - b)).toEqual([7, 20])
  })

  it('ghi chú nói rõ MÁY tự chốt, không giả vờ em tự nộp', () => {
    const r = chay([[], dong('C1', '12071', 'dang_lam', HET)], SAU_5P)
    const gc = String(r.ghi.find((g) => g.col === 20)?.giaTri[0][0] || '')
    expect(gc).toContain('hết giờ')
    expect(gc).toContain('máy tự chốt')
  })

  it('nhiều em thì chốt hết, đếm đúng', () => {
    const r = chay([[], dong('C1', '1', 'dang_lam', HET), dong('C1', '2', 'dang_lam', HET), dong('C1', '3', 'da_nop', HET)], SAU_5P)
    expect(r.so).toBe(2)
  })
})

describe('chỗ gọi và chốt an toàn', () => {
  it('chiTietCa gọi TRƯỚC khi đọc bảng, nếu không thì lần này vẫn trả số cũ', () => {
    const dau = GS.indexOf("if (action === 'chiTietCa')")
    const than = GS.slice(dau, dau + 2600)
    const viChot = than.indexOf('chotLuotQuaGio_(maCa)')
    // Mốc neo đổi 10/09 khuya: `chiTietCa` nay đọc bằng `docKhoiLuotCuaCa_`
    // (đúng khối dòng của ca) thay vì `getDataRange()`. Ý ĐỊNH GIỮ NGUYÊN —
    // chốt lượt quá giờ phải chạy TRƯỚC lượt đọc, bằng không lần này vẫn trả
    // số cũ và thầy phải bấm làm mới lần nữa.
    const viDoc = than.indexOf('const luotData = docKhoiLuotCuaCa_(sheetLuot_(), maCa)')
    expect(viChot).toBeGreaterThan(0)
    expect(viDoc).toBeGreaterThan(viChot)
  })

  it('không lấy được khoá thì BỎ QUA lượt này, không chờ — chiTietCa là nhịp nóng', () => {
    const than = layHam('chotLuotQuaGio_')
    expect(than).toContain('if (!lock.tryLock(5000)) return 0')
    expect(than).toMatch(/finally \{\s*\n\s*lock\.releaseLock\(\)/)
  })

  it('hỏng thì nuốt lỗi — chốt hộ không được phép làm chết màn Ca thi', () => {
    expect(layHam('chotLuotQuaGio_')).toMatch(/catch \(err\) \{\s*\n\s*return 0/)
  })

  it('biên an toàn là số dương và khai bằng hằng có tên, không rải số trần', () => {
    expect(bienMs()).toBeGreaterThan(0)
    expect(GS).toContain('const BIEN_CHOT_QUA_GIO_MS =')
    expect(layHam('chotLuotQuaGio_')).toContain('BIEN_CHOT_QUA_GIO_MS')
  })

  it('mã .gs vẫn hợp lệ cú pháp', () => {
    expect(() => new Function(GS)).not.toThrow()
  })
})
