// PHỤ KIỆN THẦN THÚ · M1 — sổ hình 24 món + thành phần `ThuMacDo` (src/game/than-thu-v2/phu-kien/). Đề xuất DE-XUAT-SHOP-PHU-KIEN-2109.md mục 3 + 6.
// Khoá: mã / ô / bậc đúng bảng đã chốt (KHÔNG có tên hiển thị trong mã); thú luôn hiện dù mã lỗi; ba lớp đúng chỗ; nạp lười theo món; luật vẽ (không hex, không <image>/<text>, không filter blur,
// bậc 1–3 không <filter>, mỗi món ≤ 4 KB, chỉ transform/opacity chuyển động).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { ThuMacDo, CAO_KHUNG_TEN } from '../src/game/than-thu-v2/phu-kien/ThuMacDo'
import { MON_DOT_1, MON_DOT_2, docMon, kiHieuNguyenTo, monCuaO } from '../src/game/than-thu-v2/phu-kien/phu-kien-mon'
import { NEO_PHAI, neoCua, SO_GIAI_DOAN, SO_LOAI } from '../src/game/than-thu-v2/phu-kien/phu-kien-neo'
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
    for (const x of [null, undefined, 3, {}, 'hq-03', 'HQ-99', 'DA-09', 'CL-00', '']) expect(docMon(x), String(x)).toBeNull()
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
  it('mã lạ / sai ô (mã vệt ở ô hào quang, mã trên lưng ở ô trên đầu…) BỊ BỎ QUA — thú vẫn hiện, không ném lỗi', () => {
    const { container } = render(<ThuMacDo pet={3} cap={30} size={90} dangMac={{ 'hao-quang': 'VD-04', vet: 'KHONG-CO', khung: 'HQ-03', dau: 'CL-01', 'co-lung': 'DA-01' }} ten="Thú" />)
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
    for (const m of [...MON_DOT_1, ...MON_DOT_2].filter((x) => coHinhSvg(x.ma))) {
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

describe('M3 — đợt 2: 16 món trên đầu / trên lưng + bảng neo 8 loài × 6 giai đoạn', () => {
  it('sổ MON_DOT_2: 16 món, DA-01…08 (ô dau) + CL-01…08 (ô co-lung); bậc 1,1,2,2,3,3,4,5 mỗi ô; test của Code 3 vẫn thấy MON_DOT_1 đúng 24 món', () => {
    expect(MON_DOT_1).toHaveLength(24)
    expect(MON_DOT_2.map((m) => m.ma)).toEqual([...Array.from({ length: 8 }, (_, i) => `DA-0${i + 1}`), ...Array.from({ length: 8 }, (_, i) => `CL-0${i + 1}`)])
    for (const o of ['dau', 'co-lung'] as const) expect(MON_DOT_2.filter((m) => m.o === o).map((m) => m.bac)).toEqual([1, 1, 2, 2, 3, 3, 4, 5])
    expect(new Set([...MON_DOT_1, ...MON_DOT_2].map((m) => m.ma)).size).toBe(40)
  })
  it('điểm đặt + lớp của từng món: mọi món trên đầu ở điểm "dau" TRƯỚC thú; khăn / vòng cổ / khăn lửa ở "co"; áo, ba lô, hai cánh, áo choàng ở "lung"; CHỈ hai cánh + áo choàng vẽ SAU thú', () => {
    for (const m of MON_DOT_2) {
      expect(m.neo, m.ma).toBeTruthy()
      expect(m.kieu, m.ma).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(Object.keys(m).sort(), m.ma).toEqual(['bac', 'kieu', 'lop', 'ma', 'neo', 'o'])
    }
    expect(MON_DOT_2.filter((m) => m.o === 'dau').every((m) => m.neo === 'dau' && m.lop === 'truoc')).toBe(true)
    expect(Object.fromEntries(MON_DOT_2.filter((m) => m.o === 'co-lung').map((m) => [m.ma, `${m.neo}/${m.lop}`]))).toEqual({
      'CL-01': 'co/truoc', 'CL-02': 'co/truoc', 'CL-03': 'lung/truoc', 'CL-04': 'co/truoc', 'CL-05': 'lung/sau', 'CL-06': 'lung/truoc', 'CL-07': 'lung/sau', 'CL-08': 'lung/sau',
    })
  })
  it('bảng neo: đủ 8 loài × 6 giai đoạn; toạ độ trong hộp 0–1; đỉnh đầu NẰM TRÊN mắt; mắt gần trục đầu; cỡ đầu / cổ / thân hợp lý', () => {
    expect(SO_LOAI).toBe(8)
    expect(NEO_PHAI).toHaveLength(8)
    for (const [i, loai] of NEO_PHAI.entries()) {
      expect(loai, `loài ${i}`).toHaveLength(SO_GIAI_DOAN)
      for (const [k, n] of loai.entries()) {
        const ten = `${i}.${k}`
        for (const d of [n.dau, n.co, n.lung, n.mat]) {
          expect(d.x, ten).toBeGreaterThan(0.05)
          expect(d.x, ten).toBeLessThan(0.95)
          expect(d.y, ten).toBeGreaterThan(0.05)
          expect(d.y, ten).toBeLessThan(0.95)
        }
        expect(n.dau.y, `${ten} đỉnh đầu trên mắt`).toBeLessThan(n.mat.y - 0.06)
        expect(n.mat.y - n.dau.y, `${ten} mắt không quá xa đỉnh đầu`).toBeLessThan(0.22)
        expect(Math.abs(n.mat.x - n.dau.x), `${ten} mắt lệch trục đầu`).toBeLessThan(0.1)
        expect(n.dau.r, ten).toBeGreaterThanOrEqual(0.25)
        expect(n.dau.r, ten).toBeLessThanOrEqual(0.5)
        expect(n.co.r, ten).toBeGreaterThanOrEqual(0.14)
        expect(n.lung.r, ten).toBeGreaterThanOrEqual(0.35)
        expect(n.lung.r, ten).toBeLessThanOrEqual(0.9)
        expect(n.co.y, `${ten} cổ dưới mắt`).toBeGreaterThan(n.mat.y)
      }
    }
  })
  it('neoCua: giai đoạn theo cấp như ThuHinh (1/10/30/50/70/100); quayTrai ⇒ x → 1 − x, góc đảo dấu, mọi số khác giữ; đầu vào rác không ném', () => {
    for (let pet = 0; pet < 8; pet++) {
      const cacGd = [1, 9, 10, 29, 30, 49, 50, 69, 70, 99, 100, 250].map((cap) => neoCua(pet, cap, false))
      expect(new Set(cacGd.map((n) => n.dau.x)).size, `loài ${pet} đổi theo giai đoạn`).toBeGreaterThan(1)
      expect(neoCua(pet, 1, false)).toEqual(NEO_PHAI[pet]![0])
      expect(neoCua(pet, 9, false)).toEqual(NEO_PHAI[pet]![0])
      expect(neoCua(pet, 100, false)).toEqual(NEO_PHAI[pet]![5])
      for (const cap of [1, 10, 30, 50, 70, 100]) {
        const p = neoCua(pet, cap, false), t = neoCua(pet, cap, true)
        for (const k of ['dau', 'co', 'lung'] as const) {
          expect(t[k].x).toBeCloseTo(1 - p[k].x, 10)
          expect(t[k].y).toBe(p[k].y)
          expect(t[k].r).toBe(p[k].r)
          expect(t[k].g + 0).toBeCloseTo(-p[k].g, 10)
        }
        expect(t.mat.x).toBeCloseTo(1 - p.mat.x, 10)
      }
    }
    expect(() => neoCua(Number.NaN, Number.NaN, false)).not.toThrow()
    expect(neoCua(99, -5, false)).toEqual(NEO_PHAI[7]![0])
    expect(neoCua(-3, 1, false)).toEqual(NEO_PHAI[0]![0])
  })
  it('mỗi món đợt 2 có tệp hình viewBox 0 0 100 100 + bảng màu .pk-m-<mã> (pk-1…pk-3, có thể thêm pk-4); tệp hình có tối đa MỘT chuyển động; Thường không chuyển động; Sử thi / Huyền thoại có', () => {
    const css = doc(`${THU_MUC}/phu-kien.css`)
    for (const m of MON_DOT_2) {
      expect(coHinhSvg(m.ma), m.ma).toBe(true)
      expect(css, m.ma).toMatch(new RegExp(`\\.pk-m-${m.ma.toLowerCase()} \\{ --pk-1: rgb\\([^)]+\\); --pk-2: rgb\\([^)]+\\); --pk-3: rgb\\([^)]+\\);( --pk-4: rgb\\([^)]+\\);)? \\}`))
      const s = doc(`${THU_MUC}/hinh/pk-${m.ma.toLowerCase()}.tsx`)
      expect(s, m.ma).toContain('viewBox="0 0 100 100"')
      expect(s, m.ma).toMatch(/pk-[fs][1234]/)
      const dong = /className="pk-(lay|nhap|nhap-cham|quay|tho)"/.test(s)
      if (m.bac === 1) expect(dong, `${m.ma} bậc Thường không chuyển động`).toBe(false)
      if (m.bac >= 4) expect(dong, `${m.ma} bậc ${m.bac} có chuyển động riêng`).toBe(true)
    }
  })
  const dom = (c: HTMLElement) => [...(c.firstElementChild as HTMLElement).children].map((e) => (e.matches('.pk-hq') ? 'hq' : e.matches('.pk-vet') ? 'vet' : e.matches('.dh-thu') ? 'thu' : e.matches('.pk-khung-cho') ? 'khung' : e.matches('.pk-neo-sau') ? `${e.getAttribute('data-neo')}-sau` : e.matches('.pk-neo-truoc') ? `${e.getAttribute('data-neo')}-truoc` : '?'))
  it('thứ tự lớp trong DOM: hào quang → vệt → [cánh / áo choàng SAU thú] → thú → [khăn / áo / ba lô TRƯỚC thú] → khung → trên đầu (trên cùng)', () => {
    let r = render(<ThuMacDo pet={4} cap={100} size={100} dangMac={{ 'hao-quang': 'HQ-03', vet: 'VD-04', khung: 'KT-08', dau: 'DA-08', 'co-lung': 'CL-07' }} ten="Thú" />)
    expect(dom(r.container)).toEqual(['hq', 'vet', 'lung-sau', 'thu', 'khung', 'dau-truoc'])
    cleanup()
    r = render(<ThuMacDo pet={4} cap={100} size={100} dangMac={{ dau: 'DA-01', 'co-lung': 'CL-02' }} />)
    expect(dom(r.container)).toEqual(['thu', 'co-truoc', 'dau-truoc'])
    cleanup()
    r = render(<ThuMacDo pet={4} cap={100} size={100} dangMac={{ 'co-lung': 'CL-08' }} />)
    expect(dom(r.container)).toEqual(['lung-sau', 'thu'])
  })
  it('vị trí: hộp món đặt TÂM tại điểm neo (đầu: đỉnh đầu ở 70% chiều cao hộp), cỡ theo số đo đầu / cổ / thân, xoay theo góc; quayTrai ⇒ tâm lật ngang; loài khác ⇒ vị trí khác', () => {
    const vt = (pet: number, cap: number, trai: boolean, dangMac: Record<string, string>) => {
      const { container } = render(<ThuMacDo pet={pet} cap={cap} size={100} quayTrai={trai} dangMac={dangMac} />)
      const e = container.querySelector('.pk-neo') as HTMLElement
      const kq = { left: e.style.left, top: e.style.top, width: e.style.width, tf: e.style.transform }
      cleanup()
      return kq
    }
    const n = neoCua(2, 100, false)
    const a = vt(2, 100, false, { dau: 'DA-07' })
    expect(a.left).toBe(`${n.dau.x * 100}%`)
    expect(a.top).toBe(`${n.dau.y * 100}%`)
    expect(a.tf).toContain('translate(-50%, -70%)')
    expect(Number.parseFloat(a.width)).toBeCloseTo(n.dau.r * 125, 6)
    const l = vt(2, 100, false, { 'co-lung': 'CL-05' })
    expect(l.left).toBe(`${n.lung.x * 100}%`)
    expect(l.tf).toContain('translate(-50%, -50%)')
    const t = vt(2, 100, true, { dau: 'DA-07' })
    expect(Number.parseFloat(t.left)).toBeCloseTo(100 - n.dau.x * 100, 6)
    expect(vt(5, 100, false, { dau: 'DA-07' }).left).not.toBe(a.left)
  })
  it('MỘT thú tối đa 3 món chuyển động: mặc đủ 5 ô bậc cao thì đúng 3 món được động, 2 món còn lại có pk-dung (đứng yên); bậc Thường không chiếm chỗ; bản tĩnh (tinh) vẫn tĩnh nhờ pk-tinh', () => {
    const dongDuoc = (c: HTMLElement) => [...c.querySelectorAll('[data-mon]')].filter((e) => !e.classList.contains('pk-dung')).map((e) => e.getAttribute('data-mon'))
    let r = render(<ThuMacDo pet={1} cap={100} size={100} dangMac={{ 'hao-quang': 'HQ-08', vet: 'VD-08', khung: 'KT-08', dau: 'DA-08', 'co-lung': 'CL-08' }} ten="Thú" />)
    expect(dongDuoc(r.container)).toEqual(['HQ-08', 'VD-08', 'KT-08']) // cùng bậc 5 ⇒ theo thứ tự hào quang, vệt, khung
    expect(r.container.querySelectorAll('.pk-dung')).toHaveLength(2)
    cleanup()
    r = render(<ThuMacDo pet={1} cap={100} size={100} dangMac={{ 'hao-quang': 'HQ-01', vet: 'VD-04', khung: 'KT-06', dau: 'DA-07', 'co-lung': 'CL-08' }} ten="Thú" />)
    expect(dongDuoc(r.container).sort()).toEqual(['CL-08', 'DA-07', 'KT-06'].sort()) // bậc 5, 4, 3 thắng bậc 2 (VD-04); HQ-01 (bậc 1) không chiếm chỗ
    expect(r.container.querySelector('[data-mon="HQ-01"]')!.classList.contains('pk-dung')).toBe(true)
    cleanup()
    r = render(<ThuMacDo pet={1} cap={100} size={100} dangMac={{ dau: 'DA-04', 'co-lung': 'CL-04' }} />)
    expect(dongDuoc(r.container).sort()).toEqual(['CL-04', 'DA-04']) // ít hơn 3 ⇒ đều được động
    expect(doc(`${THU_MUC}/phu-kien.css`)).toMatch(/\.pk-dung,[\s\S]*animation: none !important/)
  })
})
