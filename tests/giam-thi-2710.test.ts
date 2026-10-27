// GIÁM THỊ THEO MỨC CÂU (thầy chốt 27/10): chọn mức, kho lời càu nhàu, nhịp nói, kịch bản trạng thái, hình vẽ không màu thô.
import { describe, expect, it } from 'vitest'
import { mucGiamThi } from '../src/components/giam-thi/muc-giam-thi'
import { khoaMucDo } from '../src/lib/muc-do-nhan-thuc'
import { LOI_GIAM_THI, cauMoi, suLoi, taoNhip, type NguCanhLoi } from '../src/components/giam-thi/loi-giam-thi'
import { THU_TU_GT, duongL, gocTay, khuyetL, kichBan, veGiamThi, type TrangThaiGT } from '../src/components/giam-thi/giam-thi-ve'
import { readFileSync } from 'node:fs'

const TT: TrangThaiGT[] = ['yen', 'doc', 'cho', 'soi', 'dong-ho', 'nghi-ngo', 'nop', 'dung', 'sai', 'chua-tinh', 'combo', 'xong']

describe('chọn giám thị theo mức câu', () => {
  it('cùng luật khoaMucDo (không nhập tệp ấy để giữ precache)', () => {
    const THEO = { biet: 'nb', hieu: 'th', van_dung: 'vd', van_dung_cao: 'vdc' } as const
    for (const m of ['biet', 'hieu', 'van_dung', 'van_dung_cao', 'NB', 'TH', 'VD', 'VDC', 'Nhan biet', ' thong_hieu ', 'Van dung cao', '', 'la', null, undefined, 3]) {
      const k = khoaMucDo(m)
      expect(mucGiamThi({ mucDo: m }), String(m)).toBe(k ? THEO[k] : null)
    }
  })
  it('câu không mức ⇒ không giám thị; sao ≥ 2 ⇒ Vận dụng cao như máy chủ', () => {
    expect(mucGiamThi({ mucDo: null })).toBeNull()
    expect(mucGiamThi(undefined)).toBeNull()
    expect(mucGiamThi({ mucDo: 'van_dung', sao: 2 })).toBe('vdc')
    expect(mucGiamThi({ mucDo: 'hieu', sao: 0 })).toBe('th')
  })
})

describe('kho lời càu nhàu', () => {
  const tatCa = THU_TU_GT.flatMap((m) => Object.values(LOI_GIAM_THI[m]).flat())
  it('mỗi câu ≤ 42 kí tự (một dòng ở 360 px), không emoji, không rỗng', () => {
    for (const c of tatCa) {
      expect([...c].length, c).toBeLessThanOrEqual(42)
      expect(c.trim().length).toBeGreaterThan(0)
      expect(/\p{Extended_Pictographic}/u.test(c), c).toBe(false)
    }
  })
  it('có đủ các câu thầy đưa và câu theo ngữ cảnh', () => {
    expect(tatCa).toContain('Hừ.')
    expect(tatCa.some((c) => c.includes('Học với hành!'))).toBe(true)
    expect(tatCa).toContain('Làm nên trò trống gì không đây?')
    expect(LOI_GIAM_THI.vdc.ngauNhien).toContain('Hừ. Để xem em có qua được câu này không.')
    expect(LOI_GIAM_THI.vdc.dung).toContain('Được. Lần này tạm chấp nhận.')
    expect(LOI_GIAM_THI.nb.dung).toContain('Giỏi!')
    for (const m of THU_TU_GT) {
      for (const k of ['ngauNhien', 'cho', 'dongHo', 'voi', 'sai', 'sai2', 'dung', 'combo', 'xong'] as NguCanhLoi[]) expect(LOI_GIAM_THI[m][k].length, `${m}.${k}`).toBeGreaterThan(0)
      expect(LOI_GIAM_THI[m].ngauNhien.length).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('nhịp càu nhàu', () => {
  it('tối đa 1 lần mỗi 2–3 câu; sai 2 câu liền và xong chặng luôn nói', () => {
    const n = taoNhip('p'), luon = () => 0
    cauMoi(n, 'c1')
    expect(suLoi(n, 'th', 'sai', 10_000, luon)).toBeTruthy()
    expect(suLoi(n, 'th', 'ngauNhien', 10_000, luon)).toBeNull() // cùng câu: đã nói
    cauMoi(n, 'c2')
    expect(suLoi(n, 'th', 'cho', 10_000, luon)).toBeNull() // câu kế: còn nghỉ
    expect(suLoi(n, 'th', 'sai2', 10_000, luon)).toBe('Làm nên trò trống gì không đây?')
    cauMoi(n, 'c3'); cauMoi(n, 'c4'); cauMoi(n, 'c5')
    expect(suLoi(n, 'th', 'xong', 10_000, luon)).toBeTruthy()
  })
  it('không chen ngay sau khi em chạm phương án (1,5 giây)', () => {
    const n = taoNhip('p'), luon = () => 0
    cauMoi(n, 'c1'); n.lanCham = 9_000
    expect(suLoi(n, 'vd', 'ngauNhien', 10_000, luon)).toBeNull()
    expect(suLoi(n, 'vd', 'ngauNhien', 10_600, luon)).toBeTruthy()
  })
  it('mức cao hiếm khen hơn', () => {
    const n1 = taoNhip(), n2 = taoNhip(), r = () => 0.45
    cauMoi(n1, 'a'); cauMoi(n2, 'a')
    expect(suLoi(n1, 'nb', 'dung', 1e6, r)).toBeTruthy()
    expect(suLoi(n2, 'vdc', 'dung', 1e6, r)).toBeNull()
  })
})

describe('hình và kịch bản', () => {
  it('mọi mức × trạng thái có kịch bản, tư thế tay ra góc hữu hạn', () => {
    for (const m of THU_TU_GT) for (const t of TT) {
      const ds = kichBan(m, t)
      expect(ds.length).toBeGreaterThan(0)
      for (const b of ds) for (const g of gocTay(m, b.tay ?? 'tha')) expect(Number.isFinite(g)).toBe(true)
    }
  })
  it('mức càng cao càng khó tính: Kíp không cười to khi đúng, Tí thì có', () => {
    expect(kichBan('nb', 'dung')[0]?.mieng).toBe('cuoi')
    expect(kichBan('vdc', 'dung').some((b) => b.mieng === 'cuoi')).toBe(false)
    expect(kichBan('vdc', 'sai').some((b) => b.tay === 'ghi')).toBe(true) // đẩy kính, ghi sổ
  })
  it('SVG không có mã màu thô, id không trùng giữa hai lần vẽ', () => {
    for (const m of THU_TU_GT) {
      const a = veGiamThi(m), b = veGiamThi(m)
      expect(a.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull()
      expect(/\bfill="(?!none)[^"]+"/.test(a)).toBe(false)
      const id = (s: string) => s.match(/id="([^"]+)"/)?.[1]
      expect(id(a)).not.toBe(id(b))
      expect(a).toContain(`data-muc="${m}"`)
    }
  })
})

describe('khung chữ L ôm giám thị (đề dài, thầy 27/10 tối)', () => {
  it('khuyết cùng công thức với giam-thi.css', () => {
    const css = readFileSync('src/components/giam-thi/giam-thi.css', 'utf8')
    const heSo = (k: string) => { const m = css.match(new RegExp(`--gt-${k}: calc\\(var\\(--gt-nvw\\) \\* ([\\d.]+) ([-+]) (\\d+)px\\)`)); expect(m, k).not.toBeNull(); return (nvw: number) => nvw * Number(m![1]) + (m![2] === '-' ? -1 : 1) * Number(m![3]) }
    for (const nvw of [96, 100, 120, 136]) {
      const k = khuyetL(nvw)
      expect(k.kw).toBeCloseTo(heSo('kw')(nvw)); expect(k.kh).toBeCloseTo(heSo('kh')(nvw)); expect(k.kd).toBeCloseTo(heSo('kd')(nvw))
      expect(k.kd).toBeLessThan(k.kh)
    }
  })
  it('đường viền khép kín, có góc trong bo mềm và mũi nhọn, không NaN; bong bóng thấp vẫn vẽ được', () => {
    for (const [w, h] of [[358, 600], [328, 140], [400, 132]] as const) {
      const { kw, kh, kd } = khuyetL(120), d = duongL(w, h, kw, kh, kd)
      expect(d.startsWith('M')).toBe(true); expect(d.endsWith('Z')).toBe(true)
      expect(d).not.toMatch(/NaN|Infinity/)
      expect(d).toMatch(/ 0 0 0 /) // góc trong (lõm) bo mềm
      expect(d.match(/ L/g)?.length).toBe(2) // mũi nhọn
    }
  })
})

describe('bong bóng càu nhàu: nền màu thân giám thị, chữ trắng đạt tương phản', () => {
  const lum = (h: string) => { const v = [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0]! + 0.7152 * v[1]! + 0.0722 * v[2]! }
  const tron = (a: string, b: string, p: number) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * p / 100 + parseInt(b.slice(1 + i, 3 + i), 16) * (1 - p / 100)).toString(16).padStart(2, '0')).join('')
  const tuongPhan = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  it('cả 4 giám thị × sáng / tối ≥ 4,5 : 1 (đọc đúng tỉ lệ pha trong giam-thi.css và mã màu trong trong.css)', () => {
    const css = readFileSync('src/components/giam-thi/giam-thi.css', 'utf8'), tr = readFileSync('src/styles/trong.css', 'utf8')
    const mau = (m: string) => css.match(new RegExp(`--gt-mau-${m}: (#[0-9a-f]{6})`))![1]!
    const tiLe = (m: string) => Number(css.match(new RegExp(`--gt-loi-nen: color-mix\\(in srgb, var\\(--gt-mau-${m}\\) (\\d+)%, var\\(--gt-toi\\)\\)`))![1])
    const sangChu = tr.match(/--tr-chu: (#[0-9a-f]{6})/)![1]!, sangTrang = tr.match(/--tr-trang: (#[0-9a-f]{6})/)![1]!
    const toi = tr.slice(tr.indexOf('prefers-color-scheme: dark')), toiChu = toi.match(/--tr-chu: (#[0-9a-f]{6})/)![1]!, toiTrang = toi.match(/--tr-trang: (#[0-9a-f]{6})/)![1]!
    // .gt-loi: --gt-toi = --tr-chu (sáng) / --tr-trang (tối); chữ --gt-trang = --tr-trang (sáng) / --tr-chu (tối)
    for (const m of THU_TU_GT) for (const [nenToi, chu] of [[sangChu, sangTrang], [toiTrang, toiChu]] as const) {
      const nen = tron(mau(m), nenToi, tiLe(m))
      expect(tuongPhan(nen, chu), `${m} ${nen}/${chu}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})
