// PHIẾU LÀM BÀI MẶC MATERIAL 3 (việc B, 19/09) — nghiệm thu "thay áo, không thay xương".
//
// Ba điều phải giữ:
//  1. Áo M3 CHỈ có ở phiếu của học sinh (nộp được, hoặc chỗ gọi khai `giaoDienHocSinh`). Phiếu của giáo viên, bản chỉ
//     đề, tờ máy chiếu, bản in KHÔNG có một byte nào của khối này.
//  2. Xương giữ nguyên: mọi id/class/chuỗi mã lệnh cũ, dữ liệu #du-nop, luồng nộp (confirm → fetch → kết quả).
//  3. Không lộ đáp án: khối M3 không bao giờ bám vào [data-dung], không mở `.sol-*` trước khi nộp.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { cauHinhNop } from '../src/lib/cau-hinh-nop-khac-phuc'
import {
  CSS_PHIEU,
  CSS_PHIEU_M3,
  JS_PHIEU,
  JS_PHIEU_M3,
  chuHtml,
  dauTrangM3Html,
  dungPhieu,
  oGiaiHtml,
  taiLieuHtml,
  theCauHtml,
  type ThongTinPhieu,
} from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', maDe: 'X', chuyenDe: 'Este – lipit', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: ['Bước một.'], ketQua: '', ...o }) as CauLuyen
const CAU: CauLuyen[] = [
  C({ id: 'q1', dapAn: 'C', text: 'Este X có công thức C4H8O2, tên gọi là' }),
  C({ id: 'q2', phan: 'II', dapAn: 'DSDS', text: 'Xét đúng sai từng ý:', luaChon: ['ý a', 'ý b', 'ý c', 'ý d'] }),
  C({ id: 'q3', phan: 'III', luaChon: null, dapAn: '12,5', text: 'Tính giá trị m (gam).' }),
]
const TT: ThongTinPhieu = { hoTen: 'Đỗ Minh', sbd: '12121212', ngay: new Date(2026, 8, 19), tenChuyenDe: 'Este', ketQua: '', hienDapAn: true }
const NOP = { ma: 'abcd1234ef', sbd: '12121212', url: 'https://may-chu.thu/exec' }

const SRC_M3THEME = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/m3-theme.css'), 'utf8')

// ─────────────────────────── 1. CHỈ HỌC SINH MỚI MẶC ÁO M3 ───────────────────────────
describe('áo M3 chỉ đến với phiếu của học sinh', () => {
  beforeEach(() => document.documentElement.classList.remove('dark'))

  it('phiếu giáo viên / bản chỉ đề: KHÔNG một byte của khối M3, <html> trần, một thẻ <script> duy nhất', () => {
    for (const html of [dungPhieu(TT, CAU), dungPhieu(TT, CAU, { anGiai: true }), dungPhieu({ ...TT, nhanBia: 'BÀI TẬP VỀ NHÀ' }, CAU, { laBtvn: true })]) {
      expect(html).toContain('<html lang="vi"><head>')
      expect(html).toContain(`<style>${CSS_PHIEU}</style>`)
      expect(html).not.toContain('gd-m3')
      expect(html).not.toContain('gd-tren')
      expect(html).not.toContain(JS_PHIEU_M3)
      expect(html.match(/<script/g)?.length).toBe(1)
    }
  })

  it('phiếu nộp được: <html class="gd-m3">, CSS + JS M3 chèn SAU bản cũ, thanh trên có mặt, lớp của <body> KHÔNG đổi', () => {
    const html = dungPhieu(TT, CAU, { nop: NOP })
    expect(html).toContain('<html lang="vi" class="gd-m3"><head>')
    expect(html).toContain(`<style>${CSS_PHIEU}${CSS_PHIEU_M3}</style>`)
    expect(html).toContain(`<script>${JS_PHIEU}</script><script>${JS_PHIEU_M3}</script></body>`)
    // hợp đồng cũ của phiếu: nhiều bài kiểm khoá NGUYÊN VĂN chuỗi này.
    expect(html).toContain('<body class="co-lam chua-nop">')
    expect(html).toContain('id="gd-tren"')
    expect(html).toContain('Đã làm <b id="gd-dem">0</b>/<span id="gd-tong">3</span> câu')
  })

  it('phiếu chỉ đọc của học sinh (giaoDienHocSinh): có áo M3 nhưng KHÔNG có thanh trên; bản chỉ đề vẫn giấu lời giải', () => {
    const doc = dungPhieu({ ...TT, giaoDienHocSinh: true }, CAU)
    expect(doc).toContain('<html lang="vi" class="gd-m3">')
    expect(doc).not.toContain('id="gd-tren"')
    expect(doc).toContain('<body>')
    const chiDe = dungPhieu({ ...TT, giaoDienHocSinh: true }, CAU, { anGiai: true })
    expect(chiDe).toContain('class="gd-m3"')
    expect(chiDe).not.toContain('class="sol-box"')
    expect(dungPhieu({ ...TT, giaoDienHocSinh: true }, CAU)).toContain('class="sol-box"')
  })

  it('chế độ tối của app: lớp dark đi cùng gd-m3 trên <html>', () => {
    document.documentElement.classList.add('dark')
    expect(dungPhieu(TT, CAU, { nop: NOP })).toContain('<html lang="vi" class="gd-m3 dark">')
    expect(dungPhieu(TT, CAU)).toContain('<html lang="vi" class="dark">')
  })

  it('taiLieuHtml: tham số thứ tư mặc định TẮT', () => {
    expect(taiLieuHtml('<p>x</p>', 'T')).not.toContain('gd-m3')
    expect(taiLieuHtml('<p>x</p>', 'T', '', true)).toContain('<html lang="vi" class="gd-m3">')
  })

  it('hạn nộp (nếu chỗ gọi khai trong oBia) hiện trên thanh trên; dấu "—" thì bỏ', () => {
    expect(dauTrangM3Html('Bài tập về nhà', 5, '20:00 · 20/09')).toContain('<div class="gd-han">Hạn 20:00 · 20/09</div>')
    expect(dauTrangM3Html('Bài tập về nhà', 5)).not.toContain('class="gd-han"')
    const co = dungPhieu({ ...TT, oBia: [{ nhan: 'Hạn nộp', gia: '20:00 · 20/09' }] }, CAU, { nop: NOP })
    expect(co).toContain('Hạn 20:00 · 20/09')
    const khong = dungPhieu({ ...TT, oBia: [{ nhan: 'Hạn nộp', gia: '—' }] }, CAU, { nop: NOP })
    expect(khong).not.toContain('class="gd-han"')
  })
})

// ─────────────────────────── 2. KHỐI CSS ───────────────────────────
function boChuThich(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}
/** Cắt các khối ở CẤP NGOÀI CÙNG (theo độ sâu ngoặc nhọn). */
function khoiCapNgoai(css: string): string[] {
  const kq: string[] = []
  let sau = 0
  let dau = 0
  const s = boChuThich(css)
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') sau++
    else if (s[i] === '}') {
      sau--
      if (sau === 0) {
        kq.push(s.slice(dau, i + 1).trim())
        dau = i + 1
      }
    }
  }
  expect(sau).toBe(0)
  return kq
}

describe('khối CSS_PHIEU_M3', () => {
  it('phần tô kiểu nằm trong MỘT khối @media screen; ngoài màn hình chỉ có luật ẩn thanh bấm-được (bản in không đổi)', () => {
    const ngoai = khoiCapNgoai(CSS_PHIEU_M3)
    expect(ngoai.length).toBe(2)
    expect(ngoai[0].startsWith('@media not screen')).toBe(true)
    // khối "không phải màn hình" chỉ được ẩn, không được tô gì
    expect(ngoai[0].replace(/\s+/g, ' ')).toMatch(/^@media not screen \{ [^{}]+ \{ display: none !important; \} \}$/)
    expect(ngoai[1].startsWith('@media screen')).toBe(true)
    expect(CSS_PHIEU_M3).not.toMatch(/@media\s+print/)
  })

  it('mọi bộ chọn bắt đầu bằng html.gd-m3 (không thể rò sang phiếu khác)', () => {
    const s = boChuThich(CSS_PHIEU_M3)
    // các phần trước dấu { của luật thường: bỏ luật @ và bước keyframes.
    const truoc = [...s.matchAll(/(?:^|[};])\s*([^\s{};@][^{};]*)\{/g)].map((m) => m[1].trim())
    const chon = truoc.filter((t) => !/^\d+%$/.test(t) && !/^(from|to)$/.test(t) && !/^\d+%\s*,/.test(t))
    expect(chon.length).toBeGreaterThan(80)
    for (const t of chon) {
      for (const bo of t.split(',')) {
        const b = bo.trim()
        if (!b) continue
        // bước keyframes gộp như "0%, 100%" đã lọc; còn lại phải là bộ chọn html.gd-m3
        if (/^\d+%$/.test(b)) continue
        expect(b.startsWith('html.gd-m3'), `bộ chọn ngoài phạm vi gd-m3: ${b}`).toBe(true)
      }
    }
  })

  it('không mã màu thập lục phân nào NGOÀI khối token; khối token thì có', () => {
    const i = CSS_PHIEU_M3.indexOf('KHỐI TOKEN')
    const j = CSS_PHIEU_M3.indexOf('biểu tượng nét')
    expect(i).toBeGreaterThan(0)
    expect(j).toBeGreaterThan(i)
    const ngoai = boChuThich(CSS_PHIEU_M3.slice(0, i) + CSS_PHIEU_M3.slice(j))
    expect(ngoai.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
    expect(CSS_PHIEU_M3.slice(i, j).match(/#[0-9a-fA-F]{6}\b/g)?.length).toBeGreaterThan(30)
  })

  it('có chế độ tối theo hệ thống và giảm chuyển động (tắt sạch animation/transition)', () => {
    expect(CSS_PHIEU_M3).toContain('@media (prefers-color-scheme: dark)')
    expect(CSS_PHIEU_M3).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*animation: none !important; transition: none !important/)
  })

  it('khối nằm trong chuỗi mẫu nên cấm dấu huyền ngược, đô-la-ngoặc và gạch chéo ngược (CSS lẫn JS)', () => {
    for (const khoi of [CSS_PHIEU_M3, JS_PHIEU_M3]) {
      expect(khoi).not.toContain('`')
      expect(khoi).not.toContain('${')
      expect(khoi).not.toContain('\\')
    }
  })

  it('KHÔNG lộ đáp án: không bám [data-dung], không mở khối lời giải/nút giải, không đổi display của .sol-wrap', () => {
    expect(boChuThich(CSS_PHIEU_M3)).not.toContain('data-dung')
    expect(CSS_PHIEU_M3).not.toMatch(/\.sol-wrap[^{]*\{[^}]*display/)
    expect(CSS_PHIEU_M3).not.toMatch(/chua-nop[^{]*\.(sol-box|sol-wrap|sol-inner)[^{]*\{[^}]*(display\s*:\s*(block|grid|flex)|opacity\s*:\s*1|visibility\s*:\s*visible)/)
  })

  it('cỡ thêm vào phiếu học sinh ≤ 25 KB sau nén gzip', () => {
    const them = CSS_PHIEU_M3 + JS_PHIEU_M3 + dauTrangM3Html('Bài tập về nhà', 12, '20:00 · 20/09')
    expect(zlib.gzipSync(Buffer.from(them, 'utf8')).length).toBeLessThan(25 * 1024)
  })
})

// ─────────────────────────── 3. BẢNG TOKEN = BẢNG CỦA REACT ───────────────────────────
const hexRgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
function docTokenPhieu(css: string): { sang: Record<string, string>; toi: Record<string, string>; toiLopDark: Record<string, string> } {
  const doc = (khoi: string) => Object.fromEntries([...khoi.matchAll(/(--gm-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]))
  const i = CSS_PHIEU_M3.indexOf('KHỐI TOKEN')
  const iToi = CSS_PHIEU_M3.indexOf('@media (prefers-color-scheme: dark)', i)
  const iLop = CSS_PHIEU_M3.indexOf('html.gd-m3 body.dark {', iToi)
  const iIcon = CSS_PHIEU_M3.indexOf('biểu tượng nét')
  return { sang: doc(CSS_PHIEU_M3.slice(i, iToi)), toi: doc(CSS_PHIEU_M3.slice(iToi, iLop)), toiLopDark: doc(CSS_PHIEU_M3.slice(iLop, iIcon)) }
}
function docTokenReact(): { sang: Record<string, [number, number, number]>; toi: Record<string, [number, number, number]> } {
  const doc = (khoi: string) => Object.fromEntries([...khoi.matchAll(/(--m3-[a-z0-9-]+):\s*rgb\((\d+) (\d+) (\d+)\)/g)].map((m) => [m[1], [Number(m[2]), Number(m[3]), Number(m[4])] as [number, number, number]]))
  const iToi = SRC_M3THEME.indexOf('@media (prefers-color-scheme: dark)')
  const iTheme = SRC_M3THEME.indexOf('@theme inline')
  return { sang: doc(SRC_M3THEME.slice(0, iToi)), toi: doc(SRC_M3THEME.slice(iToi, iTheme)) }
}
const ANH_XA: Record<string, string> = {
  '--gm-primary': '--m3-primary', '--gm-on-primary': '--m3-on-primary',
  '--gm-primary-c': '--m3-primary-container', '--gm-on-primary-c': '--m3-on-primary-container',
  '--gm-secondary-c': '--m3-secondary-container', '--gm-on-secondary-c': '--m3-on-secondary-container',
  '--gm-tertiary': '--m3-tertiary', '--gm-tertiary-c': '--m3-tertiary-container', '--gm-on-tertiary-c': '--m3-on-tertiary-container',
  '--gm-error': '--m3-error', '--gm-error-c': '--m3-error-container', '--gm-on-error-c': '--m3-on-error-container',
  '--gm-surface': '--m3-surface', '--gm-lowest': '--m3-surface-container-lowest', '--gm-sc': '--m3-surface-container', '--gm-sc-high': '--m3-surface-container-high',
  '--gm-on-surface': '--m3-on-surface', '--gm-on-surface-v': '--m3-on-surface-variant', '--gm-outline': '--m3-outline',
}
describe('một bảng màu cho cả React và phiếu', () => {
  const p = docTokenPhieu(CSS_PHIEU_M3)
  const r = docTokenReact()
  it('mỗi vai trò của phiếu khớp từng kênh với m3-theme.css (sáng và tối)', () => {
    for (const [gm, m3] of Object.entries(ANH_XA)) {
      expect(p.sang[gm], `phiếu thiếu ${gm}`).toBeTruthy()
      expect(hexRgb(p.sang[gm]), `sáng ${gm} ≠ ${m3}`).toEqual(r.sang[m3])
      expect(hexRgb(p.toi[gm]), `tối ${gm} ≠ ${m3}`).toEqual(r.toi[m3])
    }
  })
  it('khối tối theo hệ thống và khối tối theo lớp .dark của app giống hệt nhau', () => {
    for (const gm of Object.keys(ANH_XA)) expect(p.toiLopDark[gm], gm).toBe(p.toi[gm])
  })
})

// ─────────────────────────── 4. TƯƠNG PHẢN ───────────────────────────
const lum = ([r, g, b]: [number, number, number]) => {
  const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const tuongPhan = (a: string, b: string) => { const [x, y] = [lum(hexRgb(a)), lum(hexRgb(b))]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
describe('tương phản chữ ≥ 4,5:1 ở cả hai chế độ', () => {
  const p = docTokenPhieu(CSS_PHIEU_M3)
  const CAP: [string, string][] = [
    ['--gm-on-surface', '--gm-surface'], ['--gm-on-surface', '--gm-sc'], ['--gm-on-surface', '--gm-sc-high'], ['--gm-on-surface', '--gm-lowest'],
    ['--gm-on-surface-v', '--gm-surface'], ['--gm-on-surface-v', '--gm-sc'], ['--gm-on-surface-v', '--gm-sc-high'], ['--gm-on-surface-v', '--gm-lowest'],
    ['--gm-on-primary', '--gm-primary'], ['--gm-on-primary-c', '--gm-primary-c'], ['--gm-on-secondary-c', '--gm-secondary-c'],
    ['--gm-on-tertiary-c', '--gm-tertiary-c'], ['--gm-on-error-c', '--gm-error-c'],
    ['--gm-primary', '--gm-sc'], ['--gm-primary', '--gm-sc-high'], ['--gm-tertiary', '--gm-sc-high'], ['--gm-tertiary', '--gm-surface'],
    ['--gm-error', '--gm-surface'], ['--gm-error', '--gm-sc'],
  ]
  for (const [ten, bang] of [['sáng', p.sang], ['tối', p.toi]] as const) {
    it(`chế độ ${ten}`, () => {
      for (const [chu, nen] of CAP) expect(tuongPhan(bang[chu], bang[nen]), `${chu} trên ${nen}`).toBeGreaterThanOrEqual(4.5)
    })
  }
})

// ─────────────────────────── 5. XƯƠNG GIỮ NGUYÊN ───────────────────────────
describe('nội dung và dữ liệu của phiếu không đổi', () => {
  const html = dungPhieu(TT, CAU, { nop: NOP })
  const phanCoThanTren = html.replace(/<header class="gd-tren"[\s\S]*?<\/header>/, '')

  it('mọi thẻ câu ra ĐÚNG như hàm dựng thẻ cũ (chuHtml, oGiaiHtml nằm trong đó)', () => {
    CAU.forEach((c, i) => {
      expect(phanCoThanTren).toContain(theCauHtml(c, i + 1, false, false, true, false, undefined))
      expect(phanCoThanTren).toContain(chuHtml(c.text))
      const g = oGiaiHtml(c)
      if (g) expect(phanCoThanTren).toContain(g)
    })
  })

  it('mã lệnh cũ nguyên văn; thanh nộp và các id/class mã lệnh cần vẫn còn', () => {
    expect(html).toContain(`<script>${JS_PHIEU}</script>`)
    for (const id of ['du-nop', 'nut-nop', 'nop-dem', 'nop-tong', 'nop-ket', 'nop-loi', 'thanh-nop']) expect(html).toContain(`id="${id}"`)
    for (const lop of ['q-card', 'q-opt lam-o', 'tf-badge', 'tf-item', 'lam-nhap', 'sa-vung', 'sol-wrap']) expect(html).toContain(lop)
    expect(html).toContain('Lời giải mở ra ngay sau khi em bấm Nộp bài.')
  })

  it('#du-nop: đúng dữ liệu, không thêm không bớt', () => {
    const m = /<script type="application\/json" id="du-nop">([\s\S]*?)<\/script>/.exec(html)!
    expect(JSON.parse(m[1])).toEqual({
      ma: NOP.ma, sbd: NOP.sbd, url: NOP.url, ch: cauHinhNop(undefined),
      cau: [{ id: 'q1', phan: 'I', dapAn: 'C' }, { id: 'q2', phan: 'II', dapAn: 'DSDS' }, { id: 'q3', phan: 'III', dapAn: '12,5' }],
    })
  })

  it('nhãn "Vòng" cũ vẫn nằm trong DOM (bài khác khoá chuỗi) nhưng áo M3 giấu nó', () => {
    const btvn = dungPhieu({ ...TT, nhanBia: 'BÀI TẬP VỀ NHÀ', tenChuyenDe: 'Bài tập về nhà' }, CAU, { nop: NOP, laBtvn: true, soCauSang: 2 })
    expect(btvn).toContain('vong-btvn')
    expect(CSS_PHIEU_M3).toMatch(/\.q-tag\.vong-btvn[^{]*\{\s*display: none/)
  })
})

// ─────────────────────────── 6. HÀNH VI TRONG TRÌNH DUYỆT GIẢ ───────────────────────────
let boNghe: Array<[string, EventListenerOrEventListenerObject, unknown]> = []
function moPhieu(html: string) {
  for (const [ten, ham, ch] of boNghe) document.removeEventListener(ten, ham, ch as boolean)
  boNghe = []
  for (const k of Object.keys(localStorage)) if (k.indexOf('ddh.lam.') === 0) localStorage.removeItem(k)
  const themGoc = document.addEventListener.bind(document)
  document.addEventListener = ((ten: string, ham: EventListenerOrEventListenerObject, ch?: unknown) => {
    boNghe.push([ten, ham, ch])
    themGoc(ten as keyof DocumentEventMap, ham as EventListener, ch as boolean)
  }) as typeof document.addEventListener
  const than = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  document.documentElement.innerHTML = than.replace(/<\/?body[^>]*>/g, '')
  document.body.className = /<body class="([^"]*)"/.exec(html)?.[1] ?? ''
  const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
  new Function(js)()
}
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!
const chonI = (qid: string, k: number) => document.querySelectorAll<HTMLElement>(`.q-card[data-qid="${qid}"] .q-opt.lam-o`)[k].click()
const chonYD = (qid: string, y: string, chon: 'D' | 'S') => $(`.q-card[data-qid="${qid}"] .tf-item[data-y="${y}"] .tf-badge.lam-o[data-chon="${chon}"]`).click()
const gõ = (qid: string, v: string) => { const i = $<HTMLInputElement>(`.q-card[data-qid="${qid}"] .lam-nhap`); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })) }
const cho = () => new Promise((r) => setTimeout(r, 0))

describe('mã lệnh trang trí: tiến độ, khích lệ, lưới số câu (chỉ trang trí, không đụng đáp án)', () => {
  it('chọn đáp án → số đã làm, thanh tiến độ, dấu tích trên thẻ, dòng "Còn N câu" ở đáy', async () => {
    moPhieu(dungPhieu(TT, CAU, { nop: NOP }))
    expect($('#gd-dem').textContent).toBe('0')
    expect($('#gd-con').textContent).toBe('Còn 3 câu chưa làm')
    expect(document.documentElement.classList.contains('gd-js')).toBe(true)
    chonI('q1', 2)
    await cho()
    expect($('#gd-dem').textContent).toBe('1')
    expect($('.q-card[data-qid="q1"]').classList.contains('gd-da-lam')).toBe(true)
    expect($('#gd-tren .gd-tien').getAttribute('aria-valuenow')).toBe('33')
    expect($('#gd-con').textContent).toBe('Còn 2 câu chưa làm')
    // Phần II chỉ tính là xong khi đủ bốn ý.
    chonYD('q2', 'a', 'D')
    await cho()
    expect($('.q-card[data-qid="q2"]').classList.contains('gd-da-lam')).toBe(false)
    for (const y of ['b', 'c', 'd']) chonYD('q2', y, 'S')
    await cho()
    expect($('.q-card[data-qid="q2"]').classList.contains('gd-da-lam')).toBe(true)
    gõ('q3', '12,5')
    await cho()
    expect($('#gd-dem').textContent).toBe('3')
    expect($('#gd-con').textContent).toBe('Đã làm hết các câu')
    expect($('#gd-khich').textContent).toBe('Đã làm hết các câu')
  })

  it('mốc 50% có lời khích lệ cố định; bỏ chọn thì lời ấy biến đi', async () => {
    moPhieu(dungPhieu(TT, CAU.slice(0, 2), { nop: NOP }))
    expect($<HTMLElement>('#gd-khich').hidden).toBe(true)
    chonI('q1', 0)
    await cho()
    expect($('#gd-khich').textContent).toBe('Được nửa đường rồi')
    chonI('q1', 0) // bấm lại = bỏ chọn
    await cho()
    expect($<HTMLElement>('#gd-khich').hidden).toBe(true)
  })

  it('lô BTVN: chỉ đếm câu sáng; xong lô hôm nay thì báo, câu mờ không tính', async () => {
    moPhieu(dungPhieu({ ...TT, nhanBia: 'BÀI TẬP VỀ NHÀ', tenChuyenDe: 'Bài tập về nhà' }, CAU, { nop: NOP, laBtvn: true, soCauSang: 1 }))
    expect($('#gd-tong').textContent).toBe('1')
    expect($('#gd-con').textContent).toBe('Còn 1 câu chưa làm')
    chonI('q1', 0)
    await cho()
    expect($('#gd-khich').textContent).toBe('Xong lô hôm nay')
    expect($('#gd-con').textContent).toBe('Đã làm hết các câu')
    // đếm của mã lệnh cũ vẫn theo TỔNG số câu, nằm trong DOM, không bị đụng tới
    expect($('#nop-tong').textContent).toBe('3')
    expect($('#nop-dem').textContent).toBe('1')
  })

  it('lưới số câu: mở/đóng bằng nút và phím Esc, bấm một ô chỉ nhảy tới câu, KHÔNG đổi đáp án', async () => {
    moPhieu(dungPhieu(TT, CAU, { nop: NOP }))
    const nhay = vi.fn()
    ;(Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = nhay
    chonI('q1', 1)
    await cho()
    const truoc = document.querySelectorAll('[aria-checked="true"]').length
    $('#gd-nut-luoi').click()
    const luoi = $('.gd-luoi')
    expect(luoi.getAttribute('role')).toBe('dialog')
    expect(luoi.querySelectorAll('button.gd-o').length).toBe(3)
    expect($('#gd-nut-luoi').getAttribute('aria-expanded')).toBe('true')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(document.querySelector('.gd-luoi')).toBeNull()
    $('#gd-nut-luoi').click()
    luoi.ownerDocument.querySelectorAll<HTMLElement>('.gd-luoi button.gd-o')[2].click()
    expect(document.querySelector('.gd-luoi')).toBeNull()
    expect(nhay).toHaveBeenCalledTimes(1)
    expect(document.querySelectorAll('[aria-checked="true"]').length).toBe(truoc)
  })
})

// ─────────────────────────── 7. LUỒNG NỘP: CÓ VÀ KHÔNG CÓ MÃ LỆNH M3 PHẢI Y HỆT ───────────────────────────
// Có mã lệnh M3 thì lời hỏi "Còn N câu chưa làm…" hiện bằng HỘP M3 thay vì window.confirm; mọi thứ sau đó phải như cũ.
describe('luồng nộp không đổi một bước khi có mã lệnh M3 (hộp xác nhận M3 = window.confirm)', () => {
  const KQ = { ok: true, soDung: 1, soCau: 3, lanThu: 1, qidSai: ['q2', 'q3'] }
  const LOI_HOI = 'Còn 2 câu chưa làm, mấy câu đó tính là sai. Nộp luôn?'
  type Cach = 'ok' | 'huy' | 'esc'
  function dung(html: string, confirmTraVe = true) {
    moPhieu(html)
    const confirm = vi.fn(() => confirmTraVe)
    window.confirm = confirm as unknown as typeof window.confirm
    const gui = vi.fn(async () => ({ json: async () => KQ }) as unknown as Response)
    globalThis.fetch = gui as unknown as typeof fetch
    return { confirm, gui }
  }
  const hop = () => document.querySelector<HTMLElement>('.gd-hop')
  const chup = (confirm: ReturnType<typeof vi.fn>, gui: ReturnType<typeof vi.fn>) => ({
    confirm: confirm.mock.calls,
    fetch: gui.mock.calls.map((c) => [c[0], (c[1] as RequestInit).method, (c[1] as RequestInit).headers, (c[1] as RequestInit).body]),
    nut: $('#nut-nop').textContent,
    nutTat: ($('#nut-nop') as HTMLButtonElement).disabled,
    ket: $('#nop-ket').textContent,
    lopBody: document.body.className,
    dem: $('#nop-dem').textContent,
    sai: [...document.querySelectorAll('.q-card.cau-sai')].map((e) => e.getAttribute('data-qid')),
    dung: [...document.querySelectorAll('.q-card.cau-dung')].map((e) => e.getAttribute('data-qid')),
  })
  /** Bấm Nộp khi còn câu trống. `cach` là cách người dùng trả lời hộp (hoặc confirm). */
  async function chayNop(html: string, cach: Cach = 'ok') {
    const { confirm, gui } = dung(html)
    chonI('q1', 2)
    $('#nut-nop').click()
    await cho()
    const h = hop()
    const hoi = h ? h.querySelector('.gd-hop-nd')!.textContent : null
    if (h) {
      if (cach === 'ok') h.querySelector<HTMLElement>('.gd-hop-ok')!.click()
      else if (cach === 'huy') h.querySelector<HTMLElement>('.gd-hop-huy')!.click()
      else if (cach === 'esc') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }
    if (cach === 'ok') await vi.waitFor(() => expect($('#nut-nop').textContent).toBe('Làm lại'))
    else await cho()
    return { ...chup(confirm, gui), hoi }
  }
  const day = dungPhieu(TT, CAU, { nop: NOP })
  const khongM3 = day.replace(`<script>${JS_PHIEU_M3}</script>`, '')

  it('bỏ mã lệnh M3 đi thì mọi thứ máy chủ và người dùng thấy vẫn y hệt; chỉ khác chỗ hỏi: hộp M3 thay confirm, CÙNG chuỗi', async () => {
    expect(khongM3).not.toContain(JS_PHIEU_M3)
    const a = await chayNop(khongM3)
    const b = await chayNop(day)
    // bản cũ: hỏi bằng window.confirm; bản M3: hỏi bằng hộp, KHÔNG gọi window.confirm
    expect(a.confirm).toEqual([[LOI_HOI]])
    expect(a.hoi).toBeNull()
    expect(b.confirm).toEqual([])
    expect(b.hoi).toBe(LOI_HOI)
    // còn lại y hệt: dữ liệu gửi, nút, kết quả, lớp thẻ
    expect({ ...b, confirm: null, hoi: null }).toEqual({ ...a, confirm: null, hoi: null })
    expect(a.fetch.length).toBe(1)
    expect(JSON.parse(a.fetch[0][3] as string)).toEqual({ action: 'nopKhacPhuc', ma: NOP.ma, sbd: NOP.sbd, dapAn: { q1: 'C' } })
    expect(a.lopBody).not.toContain('chua-nop')
  })

  it('Huỷ / Esc = như bấm Huỷ ở confirm: không gửi gì, nút Nộp còn nguyên, bấm lại vẫn hỏi lại', async () => {
    for (const cach of ['huy', 'esc'] as const) {
      const { confirm, gui } = dung(day)
      chonI('q1', 2)
      $('#nut-nop').click()
      await cho()
      const h = hop()!
      expect(h).not.toBeNull()
      if (cach === 'huy') h.querySelector<HTMLElement>('.gd-hop-huy')!.click()
      else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await cho()
      expect(hop(), cach).toBeNull()
      expect(gui, cach).not.toHaveBeenCalled()
      expect(confirm, cach).not.toHaveBeenCalled()
      expect($('#nut-nop').textContent, cach).toBe('Nộp bài')
      expect(($('#nut-nop') as HTMLButtonElement).disabled, cach).toBe(false)
      expect(document.activeElement, cach).toBe($('#nut-nop'))
      expect(document.querySelectorAll('[inert]').length, cach).toBe(0)
      // bấm lại: hỏi lại được
      $('#nut-nop').click()
      await cho()
      expect(hop(), cach).not.toBeNull()
    }
  })

  it('bấm vào nền mờ KHÔNG đóng hộp và không gửi gì (bấm đúp Nộp thì cú thứ hai rơi trúng nền)', async () => {
    const { confirm, gui } = dung(day)
    chonI('q1', 2)
    $('#nut-nop').click()
    await cho()
    document.querySelector<HTMLElement>('.gd-hop-nen')!.click()
    await cho()
    expect(hop()).not.toBeNull()
    expect(gui).not.toHaveBeenCalled()
    expect(confirm).not.toHaveBeenCalled()
  })

  it('bấm Nộp liên tục khi hộp đang mở: chỉ một hộp, chỉ MỘT lần gửi sau khi đồng ý', async () => {
    const { confirm, gui } = dung(day)
    chonI('q1', 2)
    const nut = $('#nut-nop')
    nut.click()
    await cho()
    nut.click()
    nut.click()
    await cho()
    expect(document.querySelectorAll('.gd-hop').length).toBe(1)
    expect(gui).not.toHaveBeenCalled()
    expect(nut.textContent).toBe('Nộp bài')
    hop()!.querySelector<HTMLElement>('.gd-hop-ok')!.click()
    nut.click() // bấm thêm ngay sau khi đồng ý (nút đã "Đang nộp…"/khoá)
    await vi.waitFor(() => expect(nut.textContent).toBe('Làm lại'))
    expect(gui).toHaveBeenCalledTimes(1)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('đủ câu (không còn câu trống): không hỏi gì cả, nộp thẳng như bản cũ', async () => {
    const { confirm, gui } = dung(day)
    chonI('q1', 2)
    for (const [y, c] of [['a', 'D'], ['b', 'S'], ['c', 'D'], ['d', 'S']] as const) chonYD('q2', y, c)
    gõ('q3', '12,5')
    $('#nut-nop').click()
    await vi.waitFor(() => expect($('#nut-nop').textContent).toBe('Làm lại'))
    expect(hop()).toBeNull()
    expect(confirm).not.toHaveBeenCalled()
    expect(gui).toHaveBeenCalledTimes(1)
  })

  it('thầy bật CAN_LAM_HET_MOI_NOP: vẫn chặn bằng dòng báo lỗi cũ, không hộp, không gửi', async () => {
    const chat = dungPhieu(TT, CAU, { nop: { ...NOP, cauHinh: { CAN_LAM_HET_MOI_NOP: true } } })
    const { confirm, gui } = dung(chat)
    chonI('q1', 2)
    $('#nut-nop').click()
    await cho()
    expect(hop()).toBeNull()
    expect($('#nop-loi').textContent).toBe('Còn 2 câu chưa làm.')
    expect(confirm).not.toHaveBeenCalled()
    expect(gui).not.toHaveBeenCalled()
  })

  it('không dựng được hộp → hỏi bằng window.confirm gốc, đúng chuỗi cũ: đồng ý thì nộp, huỷ thì thôi', async () => {
    for (const dongY of [true, false]) {
      const { confirm, gui } = dung(day, dongY)
      chonI('q1', 2)
      vi.spyOn(document.body, 'appendChild').mockImplementationOnce(() => { throw new Error('không dựng được') })
      $('#nut-nop').click()
      await cho()
      expect(hop()).toBeNull()
      expect(confirm.mock.calls).toEqual([[LOI_HOI]])
      if (dongY) {
        await vi.waitFor(() => expect($('#nut-nop').textContent).toBe('Làm lại'))
        expect(gui).toHaveBeenCalledTimes(1)
      } else {
        expect(gui).not.toHaveBeenCalled()
        expect($('#nut-nop').textContent).toBe('Nộp bài')
      }
      vi.restoreAllMocks()
    }
  })

  it('hộp đúng vai trò trợ năng: alertdialog, aria-modal, có tiêu đề + mô tả, tiêu điểm ở "Xem lại", Tab xoay vòng trong hộp, nền bị inert', async () => {
    dung(day)
    chonI('q1', 2)
    $('#nut-nop').click()
    await cho()
    const h = hop()!
    expect(h.getAttribute('role')).toBe('alertdialog')
    expect(h.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(h.getAttribute('aria-labelledby')!)!.textContent).toBe('Nộp bài?')
    expect(document.getElementById(h.getAttribute('aria-describedby')!)!.textContent).toBe(LOI_HOI)
    const huy = h.querySelector<HTMLElement>('.gd-hop-huy')!
    const ok = h.querySelector<HTMLElement>('.gd-hop-ok')!
    expect(document.activeElement).toBe(huy)
    ok.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(huy)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(ok)
    for (const sel of ['.khung', '#gd-tren', '#thanh-nop']) expect(document.querySelector(sel)!.hasAttribute('inert'), sel).toBe(true)
  })

  it('bấm Nộp chỉ ghi đè window.confirm trong đúng một lượt bấm, rồi trả lại nguyên vẹn', async () => {
    const { confirm } = dung(day)
    const truoc = window.confirm
    chonI('q1', 2)
    $('#nut-nop').click()
    await cho()
    expect(window.confirm).toBe(truoc)
    expect(window.confirm).toBe(confirm)
  })

  it('HỢP ĐỒNG CỦA CÁCH MƯỢN confirm: JS_PHIEU chỉ có ĐÚNG MỘT window.confirm (lời hỏi khi nộp thiếu câu)', () => {
    // Hộp M3 ghi lại lời hỏi của MỘT lượt bấm bằng cách thay window.confirm tạm thời. Nếu ai thêm lời hỏi thứ hai vào
    // luồng nộp, hộp sẽ nuốt nó: test này đỏ để buộc người đó xử lý hộp M3 trước.
    expect((JS_PHIEU.match(/window\.confirm\(/g) ?? []).length).toBe(1)
    expect((JS_PHIEU.match(/\bconfirm\(/g) ?? []).length).toBe(1)
    expect(JS_PHIEU).toContain("window.confirm('Còn ' + thieu + ' câu chưa làm, mấy câu đó tính là sai. Nộp luôn?')")
  })

  it('sau nộp, thanh đáy đọc kết quả từ #nop-ket (bỏ dấu chấm giữa đầu dòng)', async () => {
    await chayNop(day)
    await cho()
    expect($('#gd-con').textContent).toBe('Đúng 1/3 (lần 1)')
    expect($('#gd-con').classList.contains('ket')).toBe(true)
  })

  it('mã lệnh M3 hỏng giữa chừng không làm hỏng phiếu: chặn hết lỗi, luồng nộp cũ vẫn chạy bằng window.confirm', async () => {
    const hong = day.replace(`<script>${JS_PHIEU_M3}</script>`, '<script>(function(){ try { null.x } catch (e) {} })();</script>')
    const kq = await chayNop(hong)
    expect(kq.nut).toBe('Làm lại')
    expect(kq.confirm).toEqual([[LOI_HOI]])
  })
})
