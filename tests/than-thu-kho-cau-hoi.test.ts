/**
 * CỔNG NỘI DUNG HOÁ HỌC của kho câu hỏi tháp.
 *
 * Một câu sai đáp án hoặc một phương trình lệch là hàng trăm em học sai.
 * Cổng này không được nới.
 */
import { describe, it, expect } from 'vitest'
import {
  KHO_CAU_HOI, bacTheoTang, chiSoTheoBac, type CauHoi,
} from '../src/game/than-thu-hoa-hoc/kho-cau-hoi'

const CHI_SO_DUOI = '₀₁₂₃₄₅₆₇₈₉'
function thuong(s: string): string {
  return s.replace(/[₀-₉]/g, (c) => String(CHI_SO_DUOI.indexOf(c)))
}

/** Đếm nguyên tử một chất, xử được ngoặc tròn và ngoặc vuông lồng nhau. */
function demNguyenTu(ct: string): Record<string, number> {
  const s = thuong(ct).replace(/[↓↑]/g, '')
  const ngan: Record<string, number>[] = [{}]
  let i = 0
  const nhan = (d: Record<string, number>, k: number) => {
    const r: Record<string, number> = {}
    for (const [e, n] of Object.entries(d)) r[e] = n * k
    return r
  }
  const gop = (a: Record<string, number>, b: Record<string, number>) => {
    for (const [e, n] of Object.entries(b)) a[e] = (a[e] ?? 0) + n
  }
  while (i < s.length) {
    const c = s[i]!
    if (c === '(' || c === '[') { ngan.push({}); i++; continue }
    if (c === ')' || c === ']') {
      i++
      let so = ''
      while (i < s.length && /\d/.test(s[i]!)) so += s[i++]!
      const trong = ngan.pop()!
      gop(ngan[ngan.length - 1]!, nhan(trong, so === '' ? 1 : Number(so)))
      continue
    }
    if (/[A-Z]/.test(c)) {
      let e = c; i++
      while (i < s.length && /[a-z]/.test(s[i]!)) e += s[i++]!
      let so = ''
      while (i < s.length && /\d/.test(s[i]!)) so += s[i++]!
      gop(ngan[ngan.length - 1]!, { [e]: so === '' ? 1 : Number(so) })
      continue
    }
    i++
  }
  return ngan[0]!
}

function demVe(ve: string): Record<string, number> {
  const tong: Record<string, number> = {}
  for (const hang of ve.split('+')) {
    const t = thuong(hang.trim())
    const m = /^(\d*)(.+)$/.exec(t)
    if (!m) continue
    const he = m[1] === '' ? 1 : Number(m[1])
    for (const [e, n] of Object.entries(demNguyenTu(m[2]!))) tong[e] = (tong[e] ?? 0) + n * he
  }
  return tong
}

describe('kho câu hỏi tháp tri thức', () => {
  it('đủ 60 câu, chia ba bậc', () => {
    expect(KHO_CAU_HOI.length).toBe(60)
    expect(chiSoTheoBac(1).length).toBe(20)
    expect(chiSoTheoBac(2).length).toBe(20)
    expect(chiSoTheoBac(3).length).toBe(20)
  })

  it('MỌI câu có đúng 4 phương án và đáp án nằm trong khoảng', () => {
    const sai: string[] = []
    KHO_CAU_HOI.forEach((c: CauHoi, i) => {
      if (c.phuongAn.length !== 4) sai.push(`câu ${i}: có ${c.phuongAn.length} phương án`)
      if (!(c.dung >= 0 && c.dung <= 3)) sai.push(`câu ${i}: dung = ${c.dung}`)
      if (c.phuongAn[c.dung] === undefined) sai.push(`câu ${i}: dung trỏ vào chỗ trống`)
      if (new Set(c.phuongAn).size !== 4) sai.push(`câu ${i}: có phương án trùng nhau`)
    })
    expect(sai).toEqual([])
  })

  it('không câu nào trùng đề bài', () => {
    const de = KHO_CAU_HOI.map((c) => c.cau.trim())
    expect(new Set(de).size).toBe(de.length)
  })

  it('mọi câu có giải thích ĐỦ DÀI — không chỉ nhắc lại đáp án', () => {
    const cut = KHO_CAU_HOI.filter((c) => c.giaiThich.trim().length < 30)
    expect(cut.map((c) => c.cau)).toEqual([])
  })

  it('MỌI PHƯƠNG TRÌNH CÂN BẰNG — 0 phương trình lệch', () => {
    const lech: string[] = []
    let soPt = 0
    for (const c of KHO_CAU_HOI) {
      if (!c.pt) continue
      soPt++
      const [trai, phai] = c.pt.split('→')
      if (trai === undefined || phai === undefined) { lech.push(c.pt + ' · thiếu mũi tên'); continue }
      const t = demVe(trai), p = demVe(phai)
      for (const e of new Set([...Object.keys(t), ...Object.keys(p)])) {
        if ((t[e] ?? 0) !== (p[e] ?? 0)) {
          lech.push(`${c.pt} · ${e}: trái ${t[e] ?? 0} ≠ phải ${p[e] ?? 0}`)
        }
      }
    }
    // eslint-disable-next-line no-console
    console.log(`  đã kiểm ${soPt} phương trình`)
    expect(lech).toEqual([])
    expect(soPt).toBeGreaterThan(15)
  })

  it('bậc khó tăng theo tầng', () => {
    expect(bacTheoTang(1)).toBe(1)
    expect(bacTheoTang(10)).toBe(1)
    expect(bacTheoTang(11)).toBe(2)
    expect(bacTheoTang(25)).toBe(2)
    expect(bacTheoTang(26)).toBe(3)
    expect(bacTheoTang(999)).toBe(3)
  })

  it('mọi câu có chuyên đề, và phủ được nhiều chuyên đề', () => {
    expect(KHO_CAU_HOI.every((c) => c.chuyenDe.trim() !== '')).toBe(true)
    expect(new Set(KHO_CAU_HOI.map((c) => c.chuyenDe)).size).toBeGreaterThanOrEqual(25)
  })

  it('DANH PHÁP 2018 — tên nguyên tố trong phương án dùng tên mới', () => {
    // Luật đúng: TÊN NGUYÊN TỐ phải theo 2018. Nhưng TỪ GHÉP tiếng Việt thì
    // giữ nguyên — "số oxi hoá", "phản ứng nhiệt nhôm", "phản ứng tráng bạc",
    // "đồng phân", "đồng thời" đều chuẩn, chặn chúng là chặn nhầm.
    const TEN_CU: Record<string, string> = {
      natri: 'sodium', kali: 'potassium', 'can-xi': 'calcium',
      oxi: 'oxygen', 'nitơ': 'nitrogen', hiđro: 'hydrogen',
      cacbon: 'carbon', magie: 'magnesium', 'photpho': 'phosphorus',
      clo: 'chlorine', flo: 'fluorine', brom: 'bromine', iot: 'iodine',
      'lưu huỳnh': 'sulfur', 'thuỷ ngân': 'mercury',
    }
    const dinh: string[] = []
    for (const c of KHO_CAU_HOI) {
      for (const pa of c.phuongAn) {
        // chỉ soi phần trong ngoặc của dạng "Na (sodium)"
        const m = /\(([^)]+)\)/.exec(pa)
        if (!m) continue
        const trong = m[1]!.toLowerCase().trim()
        if (TEN_CU[trong]) dinh.push(`"${pa}" — 2018 là ${TEN_CU[trong]}`)
      }
    }
    expect(dinh).toEqual([])
  })

  it('DANH PHÁP 2018 — không còn axit / bazơ / este / ancol / anđehit', () => {
    const cu = ['axit', 'bazơ', 'este', 'ancol', 'anđehit', 'clohiđric', 'ete']
    const dinh: string[] = []
    for (const c of KHO_CAU_HOI) {
      const chu = (c.cau + ' ' + c.phuongAn.join(' ') + ' ' + c.giaiThich).toLowerCase()
      for (const t of cu) {
        if (new RegExp(`(^|[^\\p{L}])${t}([^\\p{L}]|$)`, 'u').test(chu)) {
          dinh.push(`"${t}" trong: ${c.cau.slice(0, 44)}…`)
        }
      }
    }
    expect(dinh).toEqual([])
  })

  it('bộ đếm nguyên tử tự nó phải đúng trước đã', () => {
    expect(demNguyenTu('H₂SO₄')).toEqual({ H: 2, S: 1, O: 4 })
    expect(demNguyenTu('Na[Al(OH)₄]')).toEqual({ Na: 1, Al: 1, O: 4, H: 4 })
    expect(demVe('2Al + 3CuSO₄')).toEqual({ Al: 2, Cu: 3, S: 3, O: 12 })
  })
})
