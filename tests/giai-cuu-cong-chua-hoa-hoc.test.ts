/**
 * CỔNG HOÁ HỌC của game Giải Cứu Công Chúa.
 *
 * Phép kiểm quan trọng nhất là `moi phuong trinh can bang`: một phương trình
 * lệch là hàng trăm em học sai. Cổng này không được nới.
 */
import { describe, it, expect } from 'vitest'
import { HOA_CHAT } from '../src/game/giai-cuu-cong-chua/hoa-chat'
import {
  xuLyHoaChat, biKhacChe, demDoiThu, PHUONG_TRINH, khoaCap,
} from '../src/game/giai-cuu-cong-chua/bang-khac-che'

/** Đổi chỉ số dưới ₀₁₂₃₄₅₆₇₈₉ về chữ số thường. */
const CHI_SO_DUOI = '₀₁₂₃₄₅₆₇₈₉'
function thuong(s: string): string {
  return s.replace(/[₀-₉]/g, (c) => String(CHI_SO_DUOI.indexOf(c)))
}

/**
 * Đếm nguyên tử của MỘT chất, xử được cả ngoặc tròn và ngoặc vuông lồng nhau:
 * Ca[Al(OH)₄]₂, Al₂(SO₄)₃, Na₂[Zn(OH)₄].
 */
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

/** Đếm nguyên tử của một VẾ: "2Al + 3CuSO₄". */
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

describe('bảng khắc chế — sinh từ luật', () => {
  const CT = HOA_CHAT.map((h) => h.ct)

  it('bộ đếm nguyên tử tự nó phải đúng trước đã', () => {
    expect(demNguyenTu('H₂SO₄')).toEqual({ H: 2, S: 1, O: 4 })
    expect(demNguyenTu('Al₂(SO₄)₃')).toEqual({ Al: 2, S: 3, O: 12 })
    expect(demNguyenTu('Ca[Al(OH)₄]₂')).toEqual({ Ca: 1, Al: 2, O: 8, H: 8 })
    expect(demVe('2Al + 3CuSO₄')).toEqual({ Al: 2, Cu: 3, S: 3, O: 12 })
  })

  it('MỌI PHƯƠNG TRÌNH CÂN BẰNG — 0 phương trình lệch', () => {
    const lech: string[] = []
    for (const [cap, pt] of Object.entries(PHUONG_TRINH)) {
      const [trai, phai] = pt.split('→')
      if (trai === undefined || phai === undefined) { lech.push(cap + ' · thiếu mũi tên'); continue }
      const t = demVe(trai), p = demVe(phai)
      const ngto = new Set([...Object.keys(t), ...Object.keys(p)])
      for (const e of ngto) {
        if ((t[e] ?? 0) !== (p[e] ?? 0)) {
          lech.push(`${cap} · ${pt} · ${e}: trái ${t[e] ?? 0} ≠ phải ${p[e] ?? 0}`)
        }
      }
    }
    expect(lech).toEqual([])
  })

  it('phủ kín 66 cặp, không cặp nào trả về undefined', () => {
    let n = 0
    for (let i = 0; i < CT.length; i++) {
      for (let j = i + 1; j < CT.length; j++) {
        const kq = xuLyHoaChat(CT[i]!, CT[j]!)
        expect(kq, `${CT[i]} + ${CT[j]}`).toBeDefined()
        expect(['khacChe', 'trungHoa', 'khongPhanUng']).toContain(kq.loai)
        n++
      }
    }
    expect(n).toBe(66)
  })

  it('đối xứng — đổi chiều vẫn cùng một kẻ thắng', () => {
    for (let i = 0; i < CT.length; i++) {
      for (let j = i + 1; j < CT.length; j++) {
        const xuoi = xuLyHoaChat(CT[i]!, CT[j]!)
        const nguoc = xuLyHoaChat(CT[j]!, CT[i]!)
        expect(nguoc.loai, `${CT[i]} ↔ ${CT[j]}`).toBe(xuoi.loai)
        expect(nguoc.thang, `${CT[i]} ↔ ${CT[j]}`).toBe(xuoi.thang)
        expect(nguoc.luat).toBe(xuoi.luat)
      }
    }
  })

  it('mọi cặp CÓ phản ứng đều có phương trình và mã luật', () => {
    const thieu: string[] = []
    for (let i = 0; i < CT.length; i++) {
      for (let j = i + 1; j < CT.length; j++) {
        const kq = xuLyHoaChat(CT[i]!, CT[j]!)
        if (kq.loai === 'khongPhanUng') continue
        if (kq.pt === '') thieu.push(khoaCap(CT[i]!, CT[j]!) + ' · thiếu phương trình')
        if (kq.luat === '—') thieu.push(khoaCap(CT[i]!, CT[j]!) + ' · thiếu mã luật')
      }
    }
    expect(thieu).toEqual([])
  })

  it('không thừa phương trình — mỗi dòng trong bảng phải ứng với một cặp có phản ứng', () => {
    const thua: string[] = []
    for (const cap of Object.keys(PHUONG_TRINH)) {
      const [a, b] = cap.split('+') as [string, string]
      // Ca(OH)₂ và Ba(OH)₂ có dấu '+' đâu — khoá tách được vì công thức không chứa '+'
      const kq = xuLyHoaChat(a, b)
      if (kq.loai === 'khongPhanUng') thua.push(cap)
    }
    expect(thua).toEqual([])
  })

  it('CẶP TRƠ ≤ 35% — dưới ngưỡng thì game nhạt', () => {
    let tro = 0, khac = 0, trung = 0
    for (let i = 0; i < CT.length; i++) {
      for (let j = i + 1; j < CT.length; j++) {
        const l = xuLyHoaChat(CT[i]!, CT[j]!).loai
        if (l === 'khongPhanUng') tro++
        else if (l === 'trungHoa') trung++
        else khac++
      }
    }
    // eslint-disable-next-line no-console
    console.log(`  khắc chế ${khac} · trung hoà ${trung} · trơ ${tro} → ${Math.round((tro / 66) * 100)}%`)
    expect(tro / 66).toBeLessThanOrEqual(0.35)
    expect(khac).toBeGreaterThanOrEqual(30)
  })

  it('mười hai chất, không trùng công thức, không trùng màu', () => {
    expect(CT.length).toBe(12)
    expect(new Set(CT).size).toBe(12)
    expect(new Set(HOA_CHAT.map((h) => h.mau)).size).toBe(12)
  })

  it('vài ca lõi đúng như thầy chốt', () => {
    // Zn dẫm CuSO₄: Zn mạnh hơn Cu ⇒ Zn thắng
    expect(xuLyHoaChat('Zn', 'CuSO₄')).toMatchObject({ loai: 'khacChe', thang: 'Zn', luat: 'L2' })
    // CuSO₄ dẫm Zn: vẫn Zn thắng ⇒ người nhảy lên tự mất mạng
    expect(biKhacChe('CuSO₄', 'Zn')).toBe(true)
    expect(biKhacChe('Zn', 'CuSO₄')).toBe(false)
    // axit gặp bazơ ⇒ cả hai mất mạng
    expect(xuLyHoaChat('H₂SO₄', 'NaOH').loai).toBe('trungHoa')
    // HCl + CuSO₄ không có kết tủa, không khí, không nước ⇒ trơ
    expect(xuLyHoaChat('HCl', 'CuSO₄').loai).toBe('khongPhanUng')
    // ai bị kết tủa thì mất mạng: AgCl↓ ⇒ AgNO₃ thua
    expect(xuLyHoaChat('HCl', 'AgNO₃')).toMatchObject({ thang: 'HCl', luat: 'L4' })
  })

  it('demDoiThu đếm đúng trên đúng người đang trong ván', () => {
    const d = demDoiThu('Zn', ['CuSO₄', 'AgNO₃', 'NaOH', 'Cl₂', 'HCl'])
    // Zn khắc CuSO₄, AgNO₃, HCl · bị NaOH và Cl₂ khắc
    expect(d).toEqual({ khac: 3, biKhac: 2, trung: 0, tro: 0 })
  })
})
