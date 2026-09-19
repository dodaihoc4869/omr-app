// BỘ LOGO MỚI (thầy chốt 19/09): tài nguyên trong public/ là bản sinh từ docs/logo-1909/ bằng scripts/sinh-logo-png.mjs.
// Nhóm 1 (tài nguyên + script): đủ tệp, đúng cỡ, SVG tự chứa và nhẹ, khớp nguồn, mobileconfig nhúng đúng biểu tượng.
// (Các nhóm sau — manifest/html, component — thêm phép kiểm vào cuối tệp này.)
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import React from 'react'
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
// @ts-expect-error — tệp .mjs của scripts/, không có khai báo kiểu
import { BAN_CHEP, BAN_PNG, BAN_MOBILECONFIG, thayIcon } from '../scripts/sinh-logo-png.mjs'
import LogoGiaoVien from '../src/components/LogoGiaoVien'
import LogoPhuHuynh from '../src/components/LogoPhuHuynh'
import LogoHocSinh from '../src/components/LogoHocSinh'
import LogoDDH from '../src/components/LogoDDH'
import LogoApp from '../src/components/LogoApp'
import { AnhLogo, LogoDoc, LogoNgang, NHAN_VAI, tepLogo } from '../src/components/LogoVai'

const goc = process.cwd()
const docBuf = (p: string) => fs.readFileSync(path.join(goc, p))
const doc = (p: string) => docBuf(p).toString('utf8')
const VAI = ['gv', 'hs', 'ph'] as const
afterEach(cleanup)

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
  it('20 PNG khai trong script đều có, đúng cỡ; tràn nền (icon cài máy, iOS) là RGB đặc, bản 64 px nét đậm là RGBA nền trong suốt', () => {
    expect(BAN_PNG).toHaveLength(20)
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

// ───────────────────────── nhóm 2: manifest · index.html · trang cài app · service worker ─────────────────────────
describe('manifest 3 app: icon trỏ tới PNG -v3 có thật, đúng cỡ, có bản maskable', () => {
  for (const [v, tep] of [['gv', 'manifest.json'], ['hs', 'manifest-hs.json'], ['ph', 'manifest-ph.json']] as const) {
    it(`${tep}: 192 + 512 (any) và 512 (maskable) của app ${v}; tệp tồn tại, đúng cỡ khai, không còn -v2`, () => {
      const m = JSON.parse(doc(`public/${tep}`))
      const ra = m.icons.map((i: { src: string; sizes: string; purpose: string }) => [i.src, i.sizes, i.purpose])
      expect(ra).toEqual([
        [`logo-${v}-192-v3.png`, '192x192', 'any'],
        [`logo-${v}-512-v3.png`, '512x512', 'any'],
        [`logo-${v}-512-maskable-v3.png`, '512x512', 'maskable'],
      ])
      for (const i of m.icons) {
        const h = ihdr(docBuf(`public/${i.src}`))
        expect(`${h.w}x${h.h}`, i.src).toBe(i.sizes)
        expect(i.type).toBe('image/png')
      }
      expect(doc(`public/${tep}`)).not.toContain('-v2')
    })
  }
})

describe('index.html: favicon SVG nét đậm + PNG 64 + apple-touch-icon 180 theo vai — tệp có thật', () => {
  it('ba thẻ link -v3 theo vai (gv/hs/ph) và mọi tên ghép ra đều tồn tại; không còn -v2', () => {
    const h = doc('index.html')
    expect(h).toContain(`<link rel="icon" type="image/svg+xml" sizes="any" href="/logo-' + logoVai + '-nho-v3.svg">`)
    expect(h).toContain(`<link rel="icon" type="image/png" sizes="64x64" href="/logo-' + logoVai + '-64-v3.png">`)
    expect(h).toContain(`<link rel="apple-touch-icon" href="/logo-' + logoVai + '-180-v3.png">`)
    expect(h).not.toContain('-v2')
    for (const v of VAI) for (const t of [`logo-${v}-nho-v3.svg`, `logo-${v}-64-v3.png`, `logo-${v}-180-v3.png`]) expect(fs.existsSync(path.join(goc, 'public', t)), t).toBe(true)
  })
})

describe('trang cài app (cai-app.html · cai-dat.html · cai-app/index.html): ba bản y hệt nhau, dùng logo -v3', () => {
  it('giống nhau từng byte; favicon SVG + PNG; header là logo giáo viên 180; hai ô xem trước mở bằng icon học sinh 192, đổi tab thì -v3 theo vai', () => {
    const a = doc('public/cai-app.html')
    expect(doc('public/cai-dat.html')).toBe(a)
    expect(doc('public/cai-app/index.html')).toBe(a)
    expect(a).toContain('<link rel="icon" type="image/svg+xml" sizes="any" href="/logo-gv-nho-v3.svg">')
    expect(a).toContain('<link rel="apple-touch-icon" href="/logo-gv-180-v3.png">')
    expect(a).toContain('<img src="/logo-gv-180-v3.png" alt="Đỗ Đại Học Logo">')
    expect(a.match(/<img src="\/logo-hs-192-v3\.png" alt="App Icon">/g)).toHaveLength(2)
    expect(a).toContain("img.src = '/logo-' + (role === 'hs' ? 'hs' : 'ph') + '-192-v3.png';")
    expect(a).not.toMatch(/-v2|apple-touch-icon\.png/)
  })
})

describe('service worker + cấu hình PWA', () => {
  it('thông báo đẩy: icon là logo MÀU 192 của học sinh, huy hiệu là PNG đơn sắc chỉ-alpha (-v3, có thật)', () => {
    const s = doc('src/sw.ts')
    expect(s).toContain("icon:'/logo-hs-192-v3.png',badge:'/logo-huy-hieu-96-v3.png'")
    for (const t of ['logo-hs-192-v3.png', 'logo-huy-hieu-96-v3.png']) expect(fs.existsSync(path.join(goc, 'public', t)), t).toBe(true)
  })

  it('vite.config.ts: includeAssets chỉ nêu tệp có thật hoặc mẫu -v3 (trước đây liệt kê icon-hs-192… không tồn tại)', () => {
    const v = doc('vite.config.ts')
    const m = /includeAssets:\s*\[([^\]]*)\]/.exec(v)!
    const muc = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(muc).toEqual(expect.arrayContaining(['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'logo-*-v3.svg', 'logo-*-v3.png']))
    for (const t of muc.filter((x) => !x.includes('*'))) expect(fs.existsSync(path.join(goc, 'public', t)), t).toBe(true)
    expect(v).not.toMatch(/icon-(hs|ph)-/)
  })
})

// ───────────────────────── nhóm 3: component logo (giáo viên · phụ huynh · trần) + khối đăng nhập ─────────────────────────
const srcImg = (c: HTMLElement) => c.querySelector('img')!.getAttribute('src')!
describe('LogoVai: bản nét đậm cho cỡ ≤ 40 px, bản thường cho cỡ lớn; KHÔNG bo góc / cắt thêm', () => {
  it('tepLogo: 24, 38, 40 → -nho; 41, 54, 64 → thường; tên -v3', () => {
    for (const v of VAI) {
      for (const co of [24, 38, 40]) expect(tepLogo(v, co)).toBe(`logo-${v}-nho-v3.svg`)
      for (const co of [41, 54, 64]) expect(tepLogo(v, co)).toBe(`logo-${v}-v3.svg`)
    }
  })

  it('AnhLogo: <img> SVG tĩnh đúng cỡ, alt rỗng (trang trí) trừ khi truyền, KHÔNG có lớp rounded-* (hình khối đã nằm trong SVG)', () => {
    const { container } = render(<AnhLogo vai="hs" size={64} />)
    const i = container.querySelector('img')!
    expect(i.getAttribute('src')).toMatch(/logo-hs-v3\.svg$/)
    expect([i.getAttribute('width'), i.getAttribute('height'), i.getAttribute('alt')]).toEqual(['64', '64', ''])
    expect(i.className).not.toMatch(/rounded/)
    expect(render(<AnhLogo vai="gv" size={48} alt="Đỗ Đại Học" />).container.querySelector('img')!.getAttribute('alt')).toBe('Đỗ Đại Học')
  })

  it('không tệp component logo nào còn bo góc, trỏ -v2 hay nhúng mã màu', () => {
    for (const t of ['LogoVai', 'LogoGiaoVien', 'LogoPhuHuynh', 'LogoHocSinh', 'LogoDDH', 'LogoApp']) {
      const c = doc(`src/components/${t}.tsx`)
      expect(c, t).not.toMatch(/rounded-|-v2|#[0-9a-fA-F]{3,8}\b|rgb\(/)
    }
  })
})

describe('LogoGiaoVien / LogoPhuHuynh / LogoApp: hình + chữ theo bản vẽ đã chốt', () => {
  it('thanh trên 38 px: bản nét đậm; chữ ĐỖ ĐẠI HỌC + viên thuốc vai trò + `6,022 · 10²³`; hết dòng "Kiên Trì"', () => {
    for (const [C, v, nhan] of [[LogoGiaoVien, 'gv', 'GIÁO VIÊN'], [LogoPhuHuynh, 'ph', 'PHỤ HUYNH']] as const) {
      const { container, unmount } = render(<C size={38} hienChu />)
      expect(srcImg(container)).toMatch(new RegExp(`logo-${v}-nho-v3\\.svg$`))
      expect(container.querySelector('.logo-ddh-ten')!.textContent).toBe('ĐỖ ĐẠI HỌC')
      const vien = container.querySelector('.logo-ddh-vien') as HTMLElement
      expect([vien.textContent, vien.getAttribute('data-vai')]).toEqual([nhan, v])
      expect(container.querySelector('.logo-ddh-hang-so')!.textContent).toBe('6,022 · 10²³')
      expect(container.textContent).not.toContain('Kiên Trì')
      unmount()
    }
  })

  it('chỉ hình (hienChu=false): không chữ nào; cỡ 52 dùng bản thường; phuDe ghi đè nhãn vai trò', () => {
    const a = render(<LogoGiaoVien size={52} />)
    expect(srcImg(a.container)).toMatch(/logo-gv-v3\.svg$/)
    expect(a.container.textContent).toBe('')
    a.unmount()
    const b = render(<LogoPhuHuynh size={38} hienChu phuDe="PH · LỚP 12" />)
    expect(b.container.querySelector('.logo-ddh-vien')!.textContent).toBe('PH · LỚP 12')
  })

  it('LogoApp chọn đúng logo theo vai (mặc định giáo viên; phụ huynh) và truyền phuDe; LogoDDH là hình trần có alt', () => {
    expect(srcImg(render(<LogoApp size={56} />).container)).toMatch(/logo-gv-v3\.svg$/)
    cleanup()
    const { container } = render(<LogoApp vai="phuhuynh" size={38} hienChu phuDe="PHỤ HUYNH" />)
    expect(srcImg(container)).toMatch(/logo-ph-nho-v3\.svg$/)
    expect(container.querySelector('.logo-ddh-vien')!.textContent).toBe('PHỤ HUYNH')
    cleanup()
    const d = render(<LogoDDH size={48} />).container.querySelector('img')!
    expect([d.getAttribute('src'), d.getAttribute('alt')]).toEqual([expect.stringMatching(/logo-gv-v3\.svg$/), 'Đỗ Đại Học'])
  })

  it('LogoNgang: nhãn vai trò mặc định theo vai', () => {
    for (const v of VAI) expect(render(<LogoNgang vai={v} hienChu />).container.querySelector('.logo-ddh-vien')!.textContent).toBe(NHAN_VAI[v])
  })
})

describe('LogoDoc (khối thương hiệu dọc của màn đăng nhập)', () => {
  it('hình 64 px + ĐỖ ĐẠI HỌC + nhãn vai trò + hằng số, canh giữa; tieuDe → h1', () => {
    const { container } = render(<LogoDoc vai="ph" size={64} tieuDe />)
    expect(srcImg(container)).toMatch(/logo-ph-v3\.svg$/)
    expect(container.querySelector('h1')!.textContent).toBe('ĐỖ ĐẠI HỌC')
    expect(container.querySelector('.logo-ddh-vien')!.textContent).toBe('PHỤ HUYNH')
    expect(container.querySelector('.logo-ddh-hang-so')!.textContent).toBe('6,022 · 10²³')
    cleanup()
    expect(render(<LogoDoc vai="hs" />).container.querySelector('h1')).toBeNull()
  })

  it('3 màn đăng nhập (giáo viên khoá app, học sinh, phụ huynh) dùng LogoDoc; hết khối tay "ĐỖ ĐẠI HỌC" + "Kiên Trì"', () => {
    for (const [t, v] of [['KhoaAppScreen', 'gv'], ['StudentPortalScreen', 'hs'], ['ParentPortalScreen', 'ph']] as const) {
      const c = doc(`src/screens/${t}.tsx`)
      expect(c, t).toContain("import { LogoDoc } from '../components/LogoVai'")
      expect(c, t).toMatch(new RegExp(`<LogoDoc vai="${v}" size=\\{64\\}`))
      expect(c, t).not.toContain('Kiên Trì')
    }
  })
})

describe('logo-ddh.css: màu chữ qua biến, không mã hex; nhãn vai trò đạt tương phản 4,5:1 ở cả sáng lẫn tối', () => {
  const css = doc('src/components/logo-ddh.css')
  const rgb = (s: string) => s.match(/\d+/g)!.slice(0, 3).map(Number)
  const lum = ([r, g, b]: number[]) => {
    const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const tuongPhan = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const cap = (vai: string, khoi: string) => {
    const m = new RegExp(`\\.logo-ddh-vien\\[data-vai='${vai}'\\] \\{\\s*background: (rgb\\([^)]*\\));\\s*color: (rgb\\([^)]*\\));`).exec(khoi)!
    return { nen: rgb(m[1]), chu: rgb(m[2]) }
  }
  const [sang, toi] = [css.split('@media')[0], css.split('@media')[1]]

  it('không mã hex, không !important; tên và hằng số lấy --muc / --nhat', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('!important')
    expect(css).toMatch(/\.logo-ddh-ten \{[^}]*color: var\(--muc\)/)
    expect(css).toMatch(/\.logo-ddh-hang-so \{[^}]*color: var\(--nhat\)/)
    expect(css).toMatch(/\.logo-ddh-hang-so \{[^}]*font-style: italic/)
    expect(css).toMatch(/Didot, 'Bodoni 72', Georgia, serif/)
    expect(css).toMatch(/\.logo-ddh-ten \{[^}]*white-space: nowrap/)
  })

  for (const v of VAI) {
    it(`nhãn ${v}: chữ / nền ≥ 4,5:1 — sáng và tối`, () => {
      const a = cap(v, sang)
      const b = cap(v, toi)
      expect(tuongPhan(a.chu, a.nen), `${v} sáng`).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(b.chu, b.nen), `${v} tối`).toBeGreaterThanOrEqual(4.5)
    })
  }
})

// ───────────────────────── nhóm 4: học sinh + màn thi thật (chỉ đổi thẻ logo) ─────────────────────────
describe('LogoHocSinh (dùng trong màn thi thật + phòng chờ): bánh quy 12 múi xanh lá, cùng luật với hai app kia', () => {
  it('thanh trên 38 px: bản nét đậm, chữ + viên thuốc HỌC SINH + hằng số; 44/48/54 px chỉ hình: bản thường, không bo góc, không chữ', () => {
    const a = render(<LogoHocSinh size={38} hienChu />)
    expect(srcImg(a.container)).toMatch(/logo-hs-nho-v3\.svg$/)
    expect(a.container.querySelector('.logo-ddh-vien')!.getAttribute('data-vai')).toBe('hs')
    expect(a.container.querySelector('.logo-ddh-vien')!.textContent).toBe('HỌC SINH')
    expect(a.container.querySelector('.logo-ddh-hang-so')!.textContent).toBe('6,022 · 10²³')
    expect(a.container.textContent).not.toContain('Kiên Trì')
    a.unmount()
    for (const co of [44, 48, 54]) {
      const { container, unmount } = render(<LogoHocSinh size={co} hienChu={false} />)
      expect(srcImg(container)).toMatch(/logo-hs-v3\.svg$/)
      expect(container.querySelector('img')!.className).not.toMatch(/rounded/)
      expect(container.textContent).toBe('')
      unmount()
    }
  })

  it('LogoApp vai="hocsinh" (màn "app đã chuyển") ra logo học sinh mới', () => {
    expect(srcImg(render(<LogoApp vai="hocsinh" size={56} />).container)).toMatch(/logo-hs-v3\.svg$/)
  })
})

describe('màn thi thật: CHỈ đổi thẻ logo — luồng và các chỗ gọi khác nguyên vẹn', () => {
  it('ExamTakeScreen: màn vào thi dùng LogoDoc (học sinh, 64 px), hết khối tay + "Kiên Trì"; màn xác nhận vẫn LogoHocSinh 48 px như cũ', () => {
    const e = doc('src/screens/ExamTakeScreen.tsx')
    expect(e).toContain("import { LogoDoc } from '../components/LogoVai'")
    expect(e.match(/<LogoDoc vai="hs" size=\{64\} \/>/g)).toHaveLength(1)
    expect(e).toContain('<LogoHocSinh size={48} hienChu={false} />')
    expect(e).not.toContain('Kiên Trì')
    expect(e).not.toMatch(/logo-(gv|hs|ph)-/) // không nhúng tên tệp logo vào màn thi: mọi hình đi qua component
  })

  it('PhongChoGame không sửa một dòng nào: vẫn <LogoHocSinh size={44} hienChu={false} />', () => {
    expect(doc('src/components/PhongChoGame.tsx')).toContain('<LogoHocSinh size={44} hienChu={false} />')
  })
})

// ───────────────────────── dọn bản cũ: không tệp / chỗ nào còn trỏ tới logo -v2 ─────────────────────────
describe('bản logo cũ (-v2) đã gỡ hẳn', () => {
  it('public/ không còn logo-*-v2.png; không tệp nguồn nào (mã, html tĩnh, manifest, mobileconfig, kiểm thử) còn tên logo -v2', () => {
    expect(fs.readdirSync(path.join(goc, 'public')).filter((t) => /^logo-.*-v2\./.test(t))).toEqual([])
    const quet = (dir: string, ra: string[] = []) => {
      for (const t of fs.readdirSync(path.join(goc, dir), { withFileTypes: true })) {
        const p = `${dir}/${t.name}`
        if (t.isDirectory()) {
          if (!['graphify-out', 'than-thu-v2', 'assets'].includes(t.name)) quet(p, ra)
        } else if (/\.(tsx?|mjs|json|html|css|mobileconfig|svg)$/.test(t.name)) ra.push(p)
      }
      return ra
    }
    const tep = [...quet('src'), ...quet('public'), ...quet('scripts'), 'index.html', 'vite.config.ts'].filter((p) => !p.endsWith('logo-bo-moi-1909.test.tsx'))
    const con = tep.filter((p) => /logo-(gv|hs|ph)-[a-z0-9-]*v2\.png/.test(doc(p)))
    expect(con).toEqual([])
    const testCon = fs.readdirSync(path.join(goc, 'tests')).filter((t) => /\.(ts|tsx)$/.test(t) && t !== 'logo-bo-moi-1909.test.tsx').filter((t) => /logo-(gv|hs|ph)-[a-z0-9-]*v2\.png/.test(doc(`tests/${t}`)))
    expect(testCon).toEqual([])
  })
})

// ───────────────────────── huy hiệu thông báo Android + ghi chú icon mới ─────────────────────────
/** Giải mã PNG RGBA 8-bit không xen kẽ (đủ cho tệp Chromium sinh ra): trả về {w, h, d} với d là RGBA. */
function giaiMaRGBA(buf: Buffer) {
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  expect([buf[24], buf[25], buf[28]]).toEqual([8, 6, 0]) // 8 bit, RGBA, không xen kẽ
  const idat: Buffer[] = []
  for (let i = 8; i < buf.length; ) {
    const n = buf.readUInt32BE(i)
    if (buf.subarray(i + 4, i + 8).toString() === 'IDAT') idat.push(buf.subarray(i + 8, i + 8 + n))
    i += 12 + n
  }
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const d = Buffer.alloc(w * h * 4)
  const dong = w * 4
  for (let y = 0; y < h; y++) {
    const loc = raw[y * (dong + 1)]
    for (let x = 0; x < dong; x++) {
      const v = raw[y * (dong + 1) + 1 + x]
      const a = x >= 4 ? d[y * dong + x - 4] : 0
      const b = y > 0 ? d[(y - 1) * dong + x] : 0
      const c = x >= 4 && y > 0 ? d[(y - 1) * dong + x - 4] : 0
      const p = a + b - c
      const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)]
      const du = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][loc]
      d[y * dong + x] = (v + du) & 255
    }
  }
  return { w, h, d }
}

describe('huy hiệu thông báo Android (logo-huy-hieu-96-v3.png)', () => {
  const { w, h, d } = giaiMaRGBA(docBuf('public/logo-huy-hieu-96-v3.png'))

  it('96 × 96, nền trong suốt (4 góc alpha 0), có hình (≥ 500 điểm không trong suốt)', () => {
    expect([w, h]).toEqual([96, 96])
    for (const [x, y] of [[0, 0], [95, 0], [0, 95], [95, 95]]) expect(d[(y * w + x) * 4 + 3], `góc ${x},${y}`).toBe(0)
    let co = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) co++
    expect(co).toBeGreaterThan(500)
  })

  it('ĐƠN SẮC: mọi điểm có alpha > 0 đều màu trắng (Android chỉ đọc alpha; màu khác trắng là hình khối màu sẽ ra khối đặc)', () => {
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) expect([d[i], d[i + 1], d[i + 2]], `điểm ${i / 4}`).toEqual([255, 255, 255])
  })

  it('chữ A nằm gọn, chừa lề ≥ 8 px bốn phía (không chạm mép)', () => {
    let [x0, y0, x1, y1] = [w, h, -1, -1]
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)]
    expect(Math.min(x0, y0, w - 1 - x1, h - 1 - y1)).toBeGreaterThanOrEqual(8)
  })

  it('sinh từ logo-don-sac.svg (nét dày lên 24/20) — không phải hình khối màu', () => {
    const [b] = (BAN_PNG as { den: string; tu: string; thay?: string[][] }[]).filter((x) => x.den === 'public/logo-huy-hieu-96-v3.png')
    expect(b.tu).toBe('docs/logo-1909/logo-don-sac.svg')
    expect(b.thay!.some(([tu, sang]) => tu === 'stroke-width="13"' && sang === 'stroke-width="24"')).toBe(true)
  })
})

describe('trang cài app: dòng nhắc icon mới cho app đã cài', () => {
  it('cả 3 bản có đúng MỘT dòng "Muốn thấy icon mới: gỡ app khỏi màn hình chính rồi thêm lại."', () => {
    for (const t of ['public/cai-app.html', 'public/cai-dat.html', 'public/cai-app/index.html']) {
      const h = doc(t)
      expect(h.match(/Muốn thấy icon mới: gỡ app khỏi màn hình chính rồi thêm lại\./g), t).toHaveLength(1)
      expect(h).toContain('<p class="ghi-chu-icon-moi">')
    }
  })
})
