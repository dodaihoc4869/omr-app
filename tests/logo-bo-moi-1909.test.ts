// BỘ LOGO MỚI (thầy chốt 19/09): tài nguyên trong public/ là bản sinh từ docs/logo-1909/ bằng scripts/sinh-logo-png.mjs.
// Nhóm 1 (tài nguyên + script): đủ tệp, đúng cỡ, SVG tự chứa và nhẹ, khớp nguồn, mobileconfig nhúng đúng biểu tượng.
// (Các nhóm sau — manifest/html, component — thêm phép kiểm vào cuối tệp này.)
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
// @ts-expect-error — tệp .mjs của scripts/, không có khai báo kiểu
import { BAN_CHEP, BAN_PNG, BAN_MOBILECONFIG, thayIcon } from '../scripts/sinh-logo-png.mjs'

const goc = process.cwd()
const docBuf = (p: string) => fs.readFileSync(path.join(goc, p))
const doc = (p: string) => docBuf(p).toString('utf8')
const VAI = ['gv', 'hs', 'ph'] as const

/** Đọc khối IHDR: rộng, cao, kiểu màu (2 = RGB không alpha, 6 = RGBA). */
function ihdr(buf: Buffer) {
  expect(buf.subarray(1, 4).toString()).toBe('PNG')
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), mau: buf[25] }
}

describe('SVG của app: tệp tĩnh trong public/, tự chứa, nhẹ', () => {
  for (const v of VAI) {
    for (const ten of [`logo-${v}-v3.svg`, `logo-${v}-nho-v3.svg`]) {
      it(`${ten}: viewBox 512, không script / ảnh ngoài / đường dẫn tuyệt đối; khớp nguồn docs/logo-1909 từng byte`, () => {
        const s = doc(`public/${ten}`)
        expect(s.startsWith('<svg')).toBe(true)
        expect(s).toContain('viewBox="0 0 512 512"')
        expect(s).not.toMatch(/<script|<image|<foreignObject|href=|https?:\/\/(?!www\.w3\.org)/)
        expect(s).not.toMatch(/url\((?!#)/) // chỉ tham chiếu cục bộ url(#id)
        const nguon = ten.replace('-v3', '')
        expect(docBuf(`public/${ten}`).equals(docBuf(`docs/logo-1909/${nguon}`))).toBe(true)
      })
    }
  }

  it('bản thường + bản nét đậm của mỗi app nhẹ hơn PNG 192 px cũ (59 KB) — cả cặp đọc chưa tới 60 KB, mỗi tệp dưới 40 KB', () => {
    for (const v of VAI) {
      const a = docBuf(`public/logo-${v}-v3.svg`).length
      const b = docBuf(`public/logo-${v}-nho-v3.svg`).length
      expect(a).toBeLessThan(40_000)
      expect(b).toBeLessThan(40_000)
      expect(a + b).toBeLessThan(60_000)
    }
  })

  it('favicon.svg là bản nét đậm của giáo viên, tự chứa (trước đây bọc <image> trỏ sang PNG)', () => {
    expect(docBuf('public/favicon.svg').equals(docBuf('public/logo-gv-nho-v3.svg'))).toBe(true)
    expect(doc('public/favicon.svg')).not.toContain('<image')
  })
})

describe('PNG sinh từ SVG: đủ tệp, đúng cỡ, icon cài máy là ảnh đặc (không alpha)', () => {
  it('19 PNG khai trong script đều có, đúng cỡ; tràn nền (icon cài máy, iOS) là RGB đặc, bản 64 px nét đậm là RGBA nền trong suốt', () => {
    expect(BAN_PNG).toHaveLength(19)
    for (const { co, den, tu } of BAN_PNG as { co: number; den: string; tu: string }[]) {
      const h = ihdr(docBuf(den))
      expect([h.w, h.h], den).toEqual([co, co])
      expect(h.mau, den).toBe(tu.endsWith('-day.svg') ? 2 : 6)
    }
  })

  it('mỗi app có đủ 64 / 180 / 192 / 512 và bản maskable 512; giáo viên có thêm apple-touch-icon, icon-192, icon-512, icon-512-maskable', () => {
    for (const v of VAI) for (const co of [64, 180, 192, 512]) expect(fs.existsSync(path.join(goc, `public/logo-${v}-${co}-v3.png`)), `${v} ${co}`).toBe(true)
    for (const v of VAI) expect(fs.existsSync(path.join(goc, `public/logo-${v}-512-maskable-v3.png`)), v).toBe(true)
    for (const t of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png']) expect(fs.existsSync(path.join(goc, 'public', t)), t).toBe(true)
    // giáo viên: cùng nội dung với bản có hậu tố -v3
    expect(docBuf('public/apple-touch-icon.png').equals(docBuf('public/logo-gv-180-v3.png'))).toBe(true)
    expect(docBuf('public/icon-192.png').equals(docBuf('public/logo-gv-192-v3.png'))).toBe(true)
    expect(docBuf('public/icon-512.png').equals(docBuf('public/logo-gv-512-v3.png'))).toBe(true)
    expect(docBuf('public/icon-512-maskable.png').equals(docBuf('public/logo-gv-512-maskable-v3.png'))).toBe(true)
  })

  it('cỡ gói: PNG 192 / 512 nhẹ hơn hẳn bản -v2 (59 KB / 377 KB)', () => {
    for (const v of VAI) {
      expect(docBuf(`public/logo-${v}-192-v3.png`).length).toBeLessThan(30_000)
      expect(docBuf(`public/logo-${v}-512-v3.png`).length).toBeLessThan(120_000)
    }
  })

  it('BAN_CHEP: mọi tệp chép khớp nguồn từng byte', () => {
    for (const [tu, den] of BAN_CHEP as [string, string][]) expect(docBuf(den).equals(docBuf(tu)), den).toBe(true)
  })
})

describe('hồ sơ iPhone (mobileconfig) nhúng đúng biểu tượng 180 px của app', () => {
  for (const { tep, png } of BAN_MOBILECONFIG as { tep: string; png: string }[]) {
    it(`${tep}: khoá Icon = base64 của ${png}; các khoá khác (URL, nhãn, mã) không đổi`, () => {
      const s = doc(tep)
      const m = /<key>Icon<\/key>\s*<data>([\s\S]*?)<\/data>/.exec(s)!
      expect(Buffer.from(m[1].replace(/\s+/g, ''), 'base64').equals(docBuf(png))).toBe(true)
      expect(s).toContain('<key>URL</key>')
      expect(s).toContain('<key>PayloadUUID</key>')
      expect(s).toContain('<key>Label</key>')
      expect(s.startsWith('<?xml')).toBe(true)
      // sinh lại từ chính nó không đổi (thayIcon là phép idempotent)
      expect(thayIcon(s, docBuf(png))).toBe(s)
    })
  }
})
