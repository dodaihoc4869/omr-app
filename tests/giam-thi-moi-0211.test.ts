// LỜI + BONG BÓNG của giám thị «sống động» (thầy 02/11: «Câu nói: dùng các câu của thầy, tôi đã tự ghép theo từng tình huống. Lúc thi giám thị im lặng,
// chỉ nói khi em rời màn hình»). Khoá: câu thầy NGUYÊN VĂN loi-mol.ts, đúng tình huống, chân ngôn ~1/3 lượt khen (không hai lượt liền), bong bóng màu theo
// tình huống đạt tương phản ≥ 4,5 : 1 ở cả nền sáng / tối của app học sinh.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { GAN_LOI, LOI_THAY, LUON_NOI, cauMoi, chonCau, suLoi, taoNhip, type NguCanhLoi } from '../src/components/giam-thi/loi-giam-thi'

const loiMol = readFileSync('src/lib/loi-mol.ts', 'utf8')

describe('câu của thầy', () => {
  it('chép nguyên văn từ loi-mol.ts', () => {
    for (const c of Object.values(LOI_THAY).flat()) expect(loiMol.includes(`'${c}'`), c).toBe(true)
  })
  it('ghép đúng tình huống bản vẽ', () => {
    expect(GAN_LOI.voi.thay).toBe(LOI_THAY.doiPho)
    expect(GAN_LOI.saiLien.thay).toBe(LOI_THAY.doiPho)
    expect(GAN_LOI.sai.thay).toBe(LOI_THAY.sai)
    expect(GAN_LOI.thiRoi.thay).toBe(LOI_THAY.thiRoi)
    expect(GAN_LOI.thiRoi.gt('th')).toHaveLength(0) // lúc thi chỉ câu của thầy
    expect([...LUON_NOI].sort()).toEqual(['saiLien', 'thiRoi'])
    const cam: Record<NguCanhLoi, string> = { voi: 'doi', saiLien: 'doi', sai: 'sai', dung: 'khen', dungLien: 'khen', thiRoi: 'gian', cho: 'nghi' }
    for (const k of Object.keys(cam) as NguCanhLoi[]) expect(GAN_LOI[k].cam, k).toBe(cam[k])
  })
  it('túi xoay vòng: lượt đầu mở bằng câu thầy, đủ mọi câu trước khi lặp', () => {
    const n = taoNhip()
    const dau = chonCau(n, 'vd', 'sai')!
    expect(LOI_THAY.sai as readonly string[]).toContain(dau.chu)
    const tui = new Set([dau.chu])
    for (let i = 1; i < 6; i++) tui.add(chonCau(n, 'vd', 'sai')!.chu)
    expect(tui.size).toBe(6) // 3 câu thầy + 3 lời Chú Tam, không lặp trong một túi
  })
  it('khen: chân ngôn của thầy, không hai lượt liền, không quá hai lượt khen ngắn liền nhau', () => {
    const n = taoNhip()
    let truoc = false, ngan = 0, coChan = 0
    for (let i = 0; i < 60; i++) {
      const c = chonCau(n, 'nb', i % 3 ? 'dung' : 'dungLien')!
      const chan = c.cam === 'chan'
      if (chan) { expect(truoc).toBe(false); expect(LOI_THAY.chanNgon as readonly string[]).toContain(c.chu); coChan++; ngan = 0 } else { ngan++; expect(ngan).toBeLessThanOrEqual(2) }
      truoc = chan
    }
    expect(coChan).toBeGreaterThanOrEqual(15)
  })
  it('rời màn lúc thi luôn nói (kể cả vừa nói)', () => {
    const n = taoNhip('thi')
    cauMoi(n, 'c1')
    expect(suLoi(n, 'th', 'thiRoi', 1000)?.cam).toBe('gian')
    expect(suLoi(n, 'th', 'thiRoi', 1200)).toBeTruthy()
  })
  it('cách nhau ≥ 5 giây', () => {
    const n = taoNhip(), luon = () => 0
    cauMoi(n, 'a'); expect(suLoi(n, 'nb', 'dung', 10_000, luon)).toBeTruthy()
    n.nghi = 0; cauMoi(n, 'b')
    expect(suLoi(n, 'nb', 'sai', 13_000, luon)).toBeNull()
    expect(suLoi(n, 'nb', 'sai', 15_100, luon)).toBeTruthy()
  })
})

describe('bong bóng màu theo tình huống', () => {
  const lum = (h: string) => { const v = [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0]! + 0.7152 * v[1]! + 0.0722 * v[2]! }
  const tron = (a: string, b: string, p: number) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * p / 100 + parseInt(b.slice(1 + i, 3 + i), 16) * (1 - p / 100)).toString(16).padStart(2, '0')).join('')
  const tuongPhan = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const hs = readFileSync('src/styles/trong-hs-mau.css', 'utf8'), css = readFileSync('src/components/giam-thi/giam-thi.css', 'utf8')
  const sang = hs.slice(0, hs.indexOf('prefers-color-scheme: dark')), toi = hs.slice(hs.indexOf('prefers-color-scheme: dark'))
  const tk = (khoi: string, k: string) => khoi.match(new RegExp(`--tr-${k}: (#[0-9a-f]{6})`))![1]!
  it('mỗi màu ≥ 4,5 : 1 ở nền sáng và tối (đọc đúng luật trong giam-thi.css)', () => {
    for (const cam of ['khen', 'chan', 'sai', 'doi', 'gian', 'nghi']) {
      const luat = css.match(new RegExp(`\\.gt-loi\\[data-cam='${cam}'\\] \\{([^}]*)\\}`))![1]!
      for (const [ten, khoi] of [['sáng', sang], ['tối', toi]] as const) {
        // .gt-loi: --gt-toi = --tr-chu (sáng) / --tr-trang (tối); --gt-trang = --tr-trang (sáng) / --tr-chu (tối)
        const gtToi = ten === 'sáng' ? tk(khoi, 'chu') : tk(khoi, 'trang'), gtTrang = ten === 'sáng' ? tk(khoi, 'trang') : tk(khoi, 'chu')
        const gia = (bien: string): string => {
          const v = luat.match(new RegExp(`--gt-loi-${bien}: ([^;]+);`))![1]!.trim()
          const m = v.match(/^color-mix\(in srgb, var\(--([\w-]+)\) (\d+)%, var\(--([\w-]+)\)\)$/)
          const doc = (b: string) => (b === 'gt-toi' ? gtToi : b === 'gt-trang' ? gtTrang : tk(khoi, b.replace(/^tr-/, '')))
          if (m) return tron(doc(m[1]!), doc(m[3]!), Number(m[2]))
          return doc(v.match(/^var\(--([\w-]+)\)$/)![1]!)
        }
        expect(tuongPhan(gia('nen'), gia('chu')), `${cam} ${ten}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})
