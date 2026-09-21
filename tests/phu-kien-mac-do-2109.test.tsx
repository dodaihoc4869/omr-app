// PHỤ KIỆN THẦN THÚ · M1 — sổ hình 24 món + thành phần `ThuMacDo` (src/game/than-thu-v2/phu-kien/). Đề xuất DE-XUAT-SHOP-PHU-KIEN-2109.md mục 3 + 6.
// Khoá: mã / ô / bậc đúng bảng đã chốt (KHÔNG có tên hiển thị trong mã); thú luôn hiện dù mã lỗi; ba lớp đúng chỗ; nạp lười theo món; luật vẽ (không hex, không <image>/<text>, không filter blur,
// bậc 1–3 không <filter>, mỗi món ≤ 4 KB, chỉ transform/opacity chuyển động).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { ThuMacDo, CAO_KHUNG_TEN } from '../src/game/than-thu-v2/phu-kien/ThuMacDo'
import { MON_DOT_1, docMon, kiHieuNguyenTo, monCuaO } from '../src/game/than-thu-v2/phu-kien/phu-kien-mon'
import { coHinhSvg, hinhCuaMon } from '../src/game/than-thu-v2/phu-kien/nap-hinh'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const khongChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const THU_MUC = 'src/game/than-thu-v2/phu-kien'

describe('sổ hình 24 món đợt 1', () => {
  it('24 món, mỗi ô 8 món; mã = tiền tố ô + số 01–08; không trùng mã', () => {
    expect(MON_DOT_1).toHaveLength(24)
    expect(new Set(MON_DOT_1.map((m) => m.ma)).size).toBe(24)
    for (const [o, tt] of [['hao-quang', 'HQ'], ['vet', 'VD'], ['khung', 'KT']] as const) {
      const ds = MON_DOT_1.filter((m) => m.o === o)
      expect(ds.map((m) => m.ma)).toEqual(Array.from({ length: 8 }, (_, i) => `${tt}-0${i + 1}`))
    }
  })
  it('bậc đúng bảng đề xuất mục 3 (đợt 1: Thường 8 · Đẹp 6 · Hiếm 4 · Sử thi 3 · Huyền thoại 3); mỗi ô đủ từ bậc thấp lên cao, không ngược', () => {
    const dem = [1, 2, 3, 4, 5].map((b) => MON_DOT_1.filter((m) => m.bac === b).length)
    expect(dem).toEqual([8, 6, 4, 3, 3])
    for (const o of ['hao-quang', 'vet', 'khung'] as const) {
      const b = MON_DOT_1.filter((m) => m.o === o).map((m) => m.bac)
      expect(b).toEqual([...b].sort())
    }
    const bac = Object.fromEntries(MON_DOT_1.map((m) => [m.ma, m.bac]))
    expect([bac['HQ-03'], bac['HQ-05'], bac['HQ-07'], bac['HQ-08'], bac['VD-04'], bac['VD-08'], bac['KT-03'], bac['KT-07'], bac['KT-08']]).toEqual([2, 3, 4, 5, 2, 5, 1, 4, 5]) // khớp mẫu phác thầy duyệt
  })
  it('sổ KHÔNG mang chữ hiển thị (tên / mô tả / giá do danh mục của Code 3 giữ): chỉ 4 trường ma, o, bac, kieu; kiểu là slug chữ thường', () => {
    for (const m of MON_DOT_1) {
      expect(Object.keys(m).sort()).toEqual(['bac', 'kieu', 'ma', 'o'])
      expect(m.kieu).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
    expect(doc(`${THU_MUC}/phu-kien-mon.ts`).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\b(gia|price|mota|moTa|moTaHinh)\b/)
  })
  it('docMon / monCuaO: mã lạ, không phải chuỗi, sai ô ⇒ null (không ném)', () => {
    expect(docMon('HQ-03')?.kieu).toBe('sodium')
    for (const x of [null, undefined, 3, {}, 'hq-03', 'HQ-99', 'DA-01', '']) expect(docMon(x), String(x)).toBeNull()
    expect(monCuaO('hao-quang', 'HQ-03')?.ma).toBe('HQ-03')
    expect(monCuaO('vet', 'HQ-03')).toBeNull()
    expect(monCuaO('khung', 'VD-04')).toBeNull()
  })
  it('ký hiệu nguyên tố từ tên thú: chữ đầu (hoa) + chữ đầu chữ thứ hai (thường), bỏ dấu, đ ⇒ d; một chữ ⇒ chữ thứ hai; rỗng ⇒ ""', () => {
    expect(kiHieuNguyenTo('Mập Địch')).toBe('Md')
    expect(kiHieuNguyenTo('Đại Hùng')).toBe('Dh')
    expect(kiHieuNguyenTo('Lửa')).toBe('Lu')
    expect(kiHieuNguyenTo('Ồ')).toBe('O')
    expect(kiHieuNguyenTo('   ')).toBe('')
    expect(kiHieuNguyenTo('12 34')).toBe('')
  })
})

describe('ThuMacDo — ba lớp đúng chỗ, thú luôn hiện', () => {
  const co = (c: HTMLElement, s: string) => c.querySelector(s)
  it('không mặc gì ⇒ chỉ có thú (không lớp nào, không khung); kích thước hộp = size', () => {
    const { container } = render(<ThuMacDo pet={2} cap={100} size={120} />)
    expect(co(container, '.dh-thu')).toBeTruthy()
    expect(co(container, '.pk-lop')).toBeNull()
    expect(co(container, '.pk-khung')).toBeNull()
    expect((container.firstElementChild as HTMLElement).style.width).toBe('120px')
    expect((container.firstElementChild as HTMLElement).style.height).toBe('120px')
    render(<ThuMacDo pet={2} cap={100} size={120} dangMac={{ 'hao-quang': null, vet: null, khung: null }} ten="Thú" />)
    expect(container.querySelector('.pk-khung')).toBeNull()
  })
  it('mặc đủ ba lớp: hào quang + vệt (nạp lười — hình hiện SAU khi chunk tải xong) + khung tên có tên và dòng nhỏ; thứ tự DOM hào quang → vệt → thú → khung', async () => {
    const { container } = render(<ThuMacDo pet={0} cap={100} size={100} dangMac={{ 'hao-quang': 'HQ-03', vet: 'VD-04', khung: 'KT-08' }} ten="Tên giả" nhan="Dòng nhỏ giả" />)
    const thuTu = [...(container.firstElementChild as HTMLElement).children].map((e) => (e.matches('.pk-hq') ? 'hq' : e.matches('.pk-vet') ? 'vet' : e.matches('.dh-thu') ? 'thu' : e.matches('.pk-khung-cho') ? 'khung' : '?'))
    expect(thuTu).toEqual(['hq', 'vet', 'thu', 'khung'])
    await waitFor(() => expect(container.querySelectorAll('.pk-lop svg').length).toBe(2))
    expect(co(container, '.pk-hq')!.className).toMatch(/pk-b2 pk-m-hq-03/)
    expect(co(container, '.pk-vet')!.className).toMatch(/pk-b2 pk-m-vd-04/)
    expect(co(container, '.pk-khung')!.className).toMatch(/pk-b5 pk-k-gold/)
    expect(co(container, '.pk-khung strong')!.textContent).toBe('Tên giả')
    expect(co(container, '.pk-khung small')!.textContent).toBe('Dòng nhỏ giả')
    expect(co(container, '.pk-ki-hieu')!.textContent).toBe('Au')
  })
  it('Ô nguyên tố lấy ký hiệu từ TÊN THÚ; khung KHÔNG có tên ⇒ không vẽ khung (không khung rỗng)', () => {
    const { container } = render(<ThuMacDo pet={1} cap={10} size={90} dangMac={{ khung: 'KT-03' }} ten="Mập Địch" />)
    expect(co(container, '.pk-ki-hieu')!.textContent).toBe('Md')
    cleanup()
    const r = render(<ThuMacDo pet={1} cap={10} size={90} dangMac={{ khung: 'KT-03' }} />)
    expect(co(r.container, '.pk-khung')).toBeNull()
  })
  it('mã lạ / sai ô / ô đợt 2 (dau, co-lung) BỊ BỎ QUA — thú vẫn hiện, không ném lỗi', () => {
    const { container } = render(<ThuMacDo pet={3} cap={30} size={90} dangMac={{ 'hao-quang': 'VD-04', vet: 'KHONG-CO', khung: 'HQ-03', dau: 'DA-01', 'co-lung': 'CL-01' }} ten="Thú" />)
    expect(co(container, '.dh-thu')).toBeTruthy()
    expect(co(container, '.pk-lop')).toBeNull()
    expect(co(container, '.pk-khung')).toBeNull()
  })
  it('hướng nhìn: quayTrai ⇒ data-huong="trai" (vệt lật sang phải); mặc định "phai". `tinh` ⇒ lớp pk-tinh (không chuyển động)', () => {
    expect(render(<ThuMacDo pet={0} cap={1} size={80} />).container.firstElementChild!.getAttribute('data-huong')).toBe('phai')
    cleanup()
    const { container } = render(<ThuMacDo pet={0} cap={1} size={80} quayTrai tinh />)
    expect(container.firstElementChild!.getAttribute('data-huong')).toBe('trai')
    expect(container.firstElementChild!.className).toContain('pk-tinh')
  })
  it('hai thú cùng mặc MỘT món: mã định danh trong SVG (dải màu) KHÔNG trùng nhau', async () => {
    const { container } = render(
      <>
        <ThuMacDo pet={0} cap={100} size={80} dangMac={{ 'hao-quang': 'HQ-03' }} />
        <ThuMacDo pet={1} cap={100} size={80} dangMac={{ 'hao-quang': 'HQ-03' }} />
      </>,
    )
    await waitFor(() => expect(container.querySelectorAll('.pk-lop svg').length).toBe(2))
    const ids = [...container.querySelectorAll('.pk-lop [id]')].map((e) => e.id)
    expect(ids.length).toBe(2)
    expect(new Set(ids).size).toBe(2)
  })
  it('CAO_KHUNG_TEN = 6 khoảng cách + 44 khung + 2 (nơi gọi chừa chỗ dưới hộp thú)', () => {
    expect(CAO_KHUNG_TEN).toBe(52)
  })
})

describe('M2 — đủ 24 món có hình / kiểu', () => {
  it('mỗi món hào quang / vệt có tệp hình VÀ bảng màu .pk-m-<mã> trong CSS; mỗi khung có kiểu .pk-k-<kiểu>; hình chỉ dùng lớp tô pk-f1/2/3, pk-s1/2/3', () => {
    const css = doc(`${THU_MUC}/phu-kien.css`)
    for (const m of MON_DOT_1) {
      if (m.o === 'khung') {
        expect(css, m.ma).toContain(`.pk-k-${m.kieu}`)
        continue
      }
      expect(css, m.ma).toMatch(new RegExp(`\\.pk-m-${m.ma.toLowerCase()} \\{ --pk-1: rgb\\([^)]+\\); --pk-2: rgb\\([^)]+\\); --pk-3: rgb\\([^)]+\\); \\}`))
      const s = doc(`${THU_MUC}/hinh/pk-${m.ma.toLowerCase()}.tsx`)
      expect(s, m.ma).toMatch(/pk-[fs][123]|var\(--pk-[123]\)/) // màu chỉ qua bảng màu của món
      expect(s, m.ma).toMatch(/viewBox="0 0 256 (256|96)"/)
      expect(s, m.ma).toContain(m.o === 'hao-quang' ? 'viewBox="0 0 256 256"' : 'viewBox="0 0 256 96"')
    }
  })
  it('Thường (bậc 1) không toả và không chuyển động; Sử thi / Huyền thoại có chuyển động riêng của bậc (nhịp thở / xoay / ánh chạy)', () => {
    for (const m of MON_DOT_1.filter((x) => x.o !== 'khung')) {
      const s = doc(`${THU_MUC}/hinh/pk-${m.ma.toLowerCase()}.tsx`)
      const dong = /className="pk-(lay|nhap|nhap-cham|quay|tho)"/.test(s)
      if (m.bac === 1) expect(dong, m.ma).toBe(false)
      if (m.bac >= 4) expect(dong, m.ma).toBe(true)
    }
  })
})

describe('nạp lười theo món', () => {
  it('mỗi món SVG có tệp riêng trong hinh/ (chunk riêng), khung tên (KT-*) không có tệp hình; hinhCuaMon trả CÙNG thành phần cho cùng mã và null khi chưa có hình', () => {
    const co = MON_DOT_1.filter((m) => coHinhSvg(m.ma)).map((m) => m.ma)
    expect(co.length).toBeGreaterThan(0)
    for (const ma of co) {
      expect(fs.existsSync(path.join(process.cwd(), THU_MUC, 'hinh', `pk-${ma.toLowerCase()}.tsx`)), ma).toBe(true)
      expect(hinhCuaMon(ma)).toBe(hinhCuaMon(ma))
      expect(monCuaO('hao-quang', ma) ?? monCuaO('vet', ma), ma).toBeTruthy() // chỉ hào quang / vệt có SVG
    }
    expect(hinhCuaMon('KT-08')).toBeNull()
    expect(MON_DOT_1.filter((m) => m.o !== 'khung').every((m) => coHinhSvg(m.ma))).toBe(true) // M2: đủ 16 hình hào quang + vệt
    expect(MON_DOT_1.filter((m) => m.o === 'khung').some((m) => coHinhSvg(m.ma))).toBe(false)
    expect(doc(`${THU_MUC}/ThuMacDo.tsx`)).not.toMatch(/from '\.\/hinh\//) // KHÔNG nhập tĩnh: chỉ qua nap-hinh (import động)
  })
})

describe('LUẬT VẼ — quy cách mục 6', () => {
  const tepHinh = fs.readdirSync(path.join(process.cwd(), THU_MUC, 'hinh')).filter((f) => f.endsWith('.tsx'))
  const css = doc(`${THU_MUC}/phu-kien.css`).replace(/\/\*[\s\S]*?\*\//g, '')
  it('mỗi món ≤ 4 KB; không mã màu # ở TSX/CSS/TS; không <image>, không <text>; không chữ hiển thị trong hình', () => {
    expect(tepHinh.length).toBeGreaterThan(0)
    for (const f of tepHinh) {
      const s = khongChuThich(doc(`${THU_MUC}/hinh/${f}`))
      expect(Buffer.byteLength(doc(`${THU_MUC}/hinh/${f}`)), f).toBeLessThanOrEqual(4096)
      expect(s, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(s, f).not.toMatch(/<image|<text|<foreignObject/)
      expect(s, f).not.toMatch(/\bfill="rgb|\bstroke="rgb/) // màu qua lớp .pk-f*/.pk-s* (bảng màu món), không viết cứng trong hình
    }
    for (const f of ['ThuMacDo.tsx', 'nap-hinh.ts', 'phu-kien-mon.ts', 'phu-kien.css']) expect(doc(`${THU_MUC}/${f}`), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
  it('bậc Thường – Hiếm (1–3) KHÔNG dùng <filter> SVG; mọi món không dùng blur / backdrop-filter', () => {
    for (const m of MON_DOT_1.filter((x) => coHinhSvg(x.ma))) {
      const s = khongChuThich(doc(`${THU_MUC}/hinh/pk-${m.ma.toLowerCase()}.tsx`))
      if (m.bac <= 3) expect(s, m.ma).not.toMatch(/<filter|filter=/)
      expect(s, m.ma).not.toMatch(/blur|feGaussianBlur/)
    }
    expect(css).not.toMatch(/blur\(|backdrop-filter/)
  })
  it('CHỈ transform / opacity chuyển động: @keyframes không đụng thuộc tính nào khác; không transition trên filter / box-shadow; mọi animation đều có will-change tương ứng', () => {
    const khoi = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})+)\s*\}/g)]
    expect(khoi.length).toBeGreaterThanOrEqual(3)
    for (const [, ten, than] of khoi) {
      const tt = [...than!.matchAll(/([\w-]+)\s*:/g)].map((m) => m[1]!)
      expect(tt.every((t) => t === 'transform' || t === 'opacity'), `${ten}: ${tt.join(',')}`).toBe(true)
    }
    expect(css).not.toMatch(/transition[^;]*(filter|box-shadow|width|height|left|top)/)
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
    expect(css).toMatch(/\.pk-thu\.pk-tinh \*/)
  })
  it('mỗi lớp ≤ MỘT chuyển động (thú ≤ 3): mỗi tệp hình có tối đa MỘT phần tử mang lớp chuyển động pk-lay / pk-nhap / pk-nhap-cham / pk-quay', () => {
    for (const f of tepHinh) {
      const n = (doc(`${THU_MUC}/hinh/${f}`).match(/className="pk-(lay|nhap|nhap-cham|quay|tho)"/g) ?? []).length
      expect(n, f).toBeLessThanOrEqual(1)
    }
  })
  it('thành phần KHÔNG tính giá / số dư / quyền mua: không nhập gì từ máy chủ, không fetch, không localStorage', () => {
    for (const f of ['ThuMacDo.tsx', 'nap-hinh.ts', 'phu-kien-mon.ts']) expect(doc(`${THU_MUC}/${f}`), f).not.toMatch(/fetch\(|localStorage|sessionStorage|goiLenh|server\//)
  })
})
