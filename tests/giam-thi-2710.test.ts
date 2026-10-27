// GIÁM THỊ THEO MỨC CÂU (thầy chốt 27/10): chọn mức, kho lời càu nhàu, nhịp nói, kịch bản trạng thái, hình vẽ không màu thô.
import { describe, expect, it } from 'vitest'
import { deDaiGiamThi, mucGiamThi } from '../src/components/giam-thi/muc-giam-thi'
import { khoaMucDo } from '../src/lib/muc-do-nhan-thuc'
import { LOI_GIAM_THI, cauMoi, suLoi, taoNhip, type NguCanhLoi } from '../src/components/giam-thi/loi-giam-thi'
import { THU_TU_GT, gocTay, kichBan, veGiamThi, type TrangThaiGT } from '../src/components/giam-thi/giam-thi-ve'

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
  it('đề dài / có hình ⇒ giám thị nhỏ', () => {
    expect(deDaiGiamThi({ text: 'Chất nào sau đây làm quỳ tím hoá xanh?' })).toBe(false)
    expect(deDaiGiamThi({ text: 'x'.repeat(120) })).toBe(true)
    expect(deDaiGiamThi({ text: 'ngắn', hinhAnh: [{ viTri: 'sau_de' }] })).toBe(true)
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
