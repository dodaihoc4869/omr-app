// PHIẾU HTML (src/lib/html-phieu.ts) — ô trả lời ngắn cũng có hai nút "−" và "," (thầy 21/09 "quét mọi chỗ mọi app"; phiếu làm bài chạy trên điện thoại, bàn phím số không có hai dấu ấy).
// Phép của nút chép bằng JS thuần vào tờ (tờ là tệp độc lập, không import được) ⇒ test ĐỐI CHIẾU với `src/lib/nhap-dap-so.ts` trên lưới giá trị × vị trí con trỏ, và chạy tờ THẬT trong DOM giả.
import { beforeEach, describe, expect, it } from 'vitest'
import { JS_PHIEU, dungPhieu, type ThongTinPhieu } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { suaChenPhay, suaDoiDau } from '../src/lib/nhap-dap-so'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', maDe: 'X', chuyenDe: 'Este – lipit', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: null, ketQua: '', ...o }) as CauLuyen
const CAU = [C({ id: 'q1', phan: 'I', dapAn: 'C' }), C({ id: 'q3', phan: 'III', luaChon: null, dapAn: '12,5' })]
const TT: ThongTinPhieu = { hoTen: 'Đỗ Minh', sbd: '12121212', ngay: new Date(2026, 8, 19), tenChuyenDe: 'Este', ketQua: '', hienDapAn: true }
const NOP = { ma: 'abcd1234ef', sbd: '12121212', url: 'https://may-chu.thu/exec' }

describe('markup của tờ', () => {
  it('phiếu LÀM ĐƯỢC: ô Phần III nằm trong khối có hai nút "−" (đổi dấu âm) và "," (dấu phẩy); ô vẫn mang lớp lam-nhap + inputmode decimal', () => {
    const html = dungPhieu(TT, CAU, { nop: NOP })
    expect(html).toContain('<div class="lam-nhap-khoi">')
    expect(html).toMatch(/<button type="button" class="lam-nut" data-lam-nut="am" aria-label="Đổi dấu âm">−<\/button><input class="lam-nhap" type="text" inputmode="decimal"/)
    expect(html).toMatch(/<button type="button" class="lam-nut" data-lam-nut="phay" aria-label="Thêm dấu phẩy">,<\/button>/)
  })
  it('tờ KHÔNG làm được (bản chỉ đề / của thầy): không có ô, không có nút', () => {
    const html = dungPhieu(TT, CAU, {})
    expect(html).not.toContain('data-lam-nut="am"') // CSS + mã lệnh có nhắc tên lớp/thuộc tính, MARKUP thì không
    expect(html).not.toContain('data-lam-nut="phay"')
    expect(html).not.toContain('<div class="lam-nhap-khoi">')
  })
  it('sau khi chấm khoá cả nút; áo M3 có kiểu nút ≥ 48 px; không nút nào nằm trong <label>', () => {
    const html = dungPhieu(TT, CAU, { nop: NOP })
    expect(html).toContain('.q-card.da-cham .lam-nut { pointer-events: none')
    expect(html).toMatch(/html\.gd-m3 body \.lam-nut \{[^}]*min-width: 48px; height: 56px/)
    expect(html).not.toMatch(/<label[^>]*>[^<]*<button type="button" class="lam-nut"/)
  })
})

/** Hai hàm của tờ, lấy từ JS_PHIEU THẬT (đã bỏ thoát chuỗi mẫu). */
const a = JS_PHIEU.indexOf('function phieuSuaDoiDau')
const b = JS_PHIEU.indexOf("['pointerdown', 'mousedown']", a)
expect(a).toBeGreaterThan(0)
expect(b).toBeGreaterThan(a)
const HAM = new Function(`${JS_PHIEU.slice(a, b)}\nreturn { doiDau: phieuSuaDoiDau, chenPhay: phieuSuaChenPhay };`)() as {
  doiDau: (s: string, den: number) => { value: string; caret: number }
  chenPhay: (s: string, tu: number, den: number) => { value: string; caret: number } | null
}

describe('phép của tờ ĐỐI CHIẾU với src/lib/nhap-dap-so.ts', () => {
  const GIA_TRI = ['', '5', '-5', '1,5', '1.5', '  5', '  -5', ' 5', ' -5', '-', ',', '12', '--3', '0,54', '-0,5', '5 mol', '\t7']
  it('"−": cùng chuỗi mới + cùng con trỏ ở MỌI vị trí con trỏ', () => {
    let dem = 0
    for (const v of GIA_TRI)
      for (let d = 0; d <= v.length; d++) {
        expect(HAM.doiDau(v, d), JSON.stringify([v, d])).toEqual(suaDoiDau(v, d, d, undefined)!)
        dem++
      }
    expect(dem).toBeGreaterThan(50)
  })
  it('",": cùng kết quả (kể cả null khi đã có dấu thập phân) với MỌI vùng chọn', () => {
    let dem = 0
    for (const v of GIA_TRI)
      for (let tu = 0; tu <= v.length; tu++)
        for (let den = 0; den <= v.length; den++) {
          expect(HAM.chenPhay(v, tu, den), JSON.stringify([v, tu, den])).toEqual(suaChenPhay(v, tu, den, undefined))
          dem++
        }
    expect(dem).toBeGreaterThan(200)
  })
})

// ───────────── chạy tờ THẬT trong DOM giả (cùng cách `phieu-m3-1909`)
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
const oIII = () => $<HTMLInputElement>('.q-card[data-qid="q3"] .lam-nhap')
const nut = (k: 'am' | 'phay') => $<HTMLButtonElement>(`.q-card[data-qid="q3"] .lam-nut[data-lam-nut="${k}"]`)
const gõ = (v: string) => { oIII().value = v; oIII().dispatchEvent(new Event('input', { bubbles: true })) }
const luuDuoc = () => Object.keys(localStorage).filter((k) => k.indexOf('ddh.lam.') === 0).map((k) => localStorage.getItem(k) ?? '').join('|')

describe('tờ THẬT trong DOM giả', () => {
  beforeEach(() => moPhieu(dungPhieu(TT, CAU, { nop: NOP })))

  it('gõ bằng nút ra "-1,5": − → 1 → , → 5; giá trị được LƯU như khi gõ tay (sự kiện input được bắn)', () => {
    nut('am').click()
    expect(oIII().value).toBe('-')
    gõ('-1')
    nut('phay').click()
    expect(oIII().value).toBe('-1,')
    gõ('-1,5')
    expect(oIII().value).toBe('-1,5')
    expect(luuDuoc()).toContain('-1,5')
    nut('am').click()
    expect(oIII().value).toBe('1,5')
    expect(luuDuoc()).toContain('"q3":"1,5"')
  })
  it('"," chèn TẠI CON TRỎ khi ô có tiêu điểm; con trỏ đứng sau dấu; đã có dấu thập phân thì không chèn thêm', () => {
    gõ('15')
    oIII().focus()
    oIII().setSelectionRange(1, 1)
    nut('phay').click()
    expect(oIII().value).toBe('1,5')
    expect(oIII().selectionStart).toBe(2)
    nut('phay').click()
    expect(oIII().value).toBe('1,5')
  })
  it('ô KHÔNG có tiêu điểm: chèn ở CUỐI', () => {
    gõ('15')
    oIII().blur()
    oIII().setSelectionRange(0, 0)
    nut('phay').click()
    expect(oIII().value).toBe('15,')
  })
  it('không lấy tiêu điểm: pointerdown và mousedown trên nút bị chặn mặc định', () => {
    for (const ten of ['pointerdown', 'mousedown']) {
      const e = new Event(ten, { bubbles: true, cancelable: true })
      nut('am').dispatchEvent(e)
      expect(e.defaultPrevented, ten).toBe(true)
    }
    const ngoai = new Event('mousedown', { bubbles: true, cancelable: true })
    oIII().dispatchEvent(ngoai)
    expect(ngoai.defaultPrevented).toBe(false) // chỉ chặn trên hai nút, không chặn ô nhập
  })
})
