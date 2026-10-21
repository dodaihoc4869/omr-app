// BẢNG NHẬP SỐ TRÊN PHIẾU HTML (thầy 21/10: "mọi chỗ trả lời ngắn … tuỳ theo đáp số mà hiện số ô"). Tờ là tệp độc lập nên chạy tờ THẬT trong DOM giả:
// bấm phím ⇒ ô <input class="lam-nhap"> (ẩn, nơi chứa giá trị) đổi + sự kiện input ⇒ LƯU như khi gõ tay; cùng luật nhanPhim (src/components/hoc-tap/lam-bai.ts).
import { describe, expect, it, beforeEach } from 'vitest'
import { dungPhieu, type ThongTinPhieu } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { nhanPhim, type PhimSo } from '../src/components/hoc-tap/lam-bai'
import { JS_PHIEU } from '../src/lib/html-phieu'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'III', id: 'x', maDe: 'X', chuyenDe: 'Amine', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: null, dapAn: '24', chot: 'c', lyDo: null, buoc: null, ketQua: '', ...o }) as CauLuyen
const CAU = [C({ id: 'q3', dapAn: '24' }), C({ id: 'q4', dapAn: '-92,4' }), C({ id: 'q5', dapAn: '1.237.500.000' })]
const TT: ThongTinPhieu = { hoTen: 'Đỗ Minh', sbd: '12121212', ngay: new Date(2026, 9, 21), tenChuyenDe: 'Amine', ketQua: '', hienDapAn: true }
const NOP = { ma: 'abcd1234ef', sbd: '12121212', url: 'https://may-chu.thu/exec' }

let boNghe: [string, EventListenerOrEventListenerObject, unknown][] = []
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
const the = (q: string) => document.querySelector<HTMLElement>(`.q-card[data-qid="${q}"]`)!
const o = (q: string) => the(q).querySelector<HTMLInputElement>('.lam-nhap')!
const bam = (q: string, k: string) => the(q).querySelector<HTMLButtonElement>(`.lbns-nut[data-phim="${k}"]`)!.click()
const chuO = (q: string) => [...the(q).querySelectorAll('.lbns-o')].map((x) => x.textContent).join('')
const luu = () => Object.keys(localStorage).filter((k) => k.indexOf('ddh.lam.') === 0).map((k) => localStorage.getItem(k) ?? '').join('|')

describe('markup', () => {
  it('đáp số gõ được ⇒ bảng nhập đúng số ô; gõ không được ⇒ ô tự do cũ', () => {
    const html = dungPhieu(TT, CAU, { nop: NOP })
    expect(html).toMatch(/class="lam-nhap-khoi lbns" data-so-o="2"/)
    expect(html).toMatch(/class="lam-nhap-khoi lbns" data-so-o="5"/)
    expect(html).toContain('data-lam-nut="am"') // câu q5 vẫn ô cũ
    expect(html).not.toMatch(/data-so-o="(?:1[0-9]|9)"/)
  })
  it('phiếu không làm được (bản chỉ đề) ⇒ không có bảng', () => {
    expect(dungPhieu(TT, CAU, {})).not.toContain('class="lam-nhap-khoi lbns"')
  })
})

describe('tờ THẬT trong DOM giả', () => {
  beforeEach(() => moPhieu(dungPhieu(TT, CAU, { nop: NOP })))
  it('bấm 2, 4 ⇒ ô ẩn "24", hàng ô hiện "24", LƯU như gõ tay; đủ ô thì phím số khoá', () => {
    bam('q3', '2'); bam('q3', '4')
    expect(o('q3').value).toBe('24')
    expect(chuO('q3')).toBe('24')
    expect(luu()).toContain('"q3":"24"')
    expect(the('q3').querySelector<HTMLButtonElement>('.lbns-nut[data-phim="7"]')!.disabled).toBe(true)
    bam('q3', 'xoa')
    expect(o('q3').value).toBe('2')
  })
  it('dấu âm + dấu phẩy: 9 2 , 4 − ⇒ "-92,4" (hiện "−92,4"); gõ phím máy tính khi bảng được chọn', () => {
    for (const k of ['9', '2', ',', '4', '-']) bam('q4', k)
    expect(o('q4').value).toBe('-92,4')
    expect(chuO('q4')).toBe('−92,4')
    bam('q4', 'xoa-het')
    const bang = the('q4').querySelector<HTMLElement>('.lbns')!
    for (const key of ['7', '.', '5']) bang.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    expect(o('q4').value).toBe('7,5')
  })
})

describe('luật phím của tờ ĐỐI CHIẾU nhanPhim', () => {
  const a = JS_PHIEU.indexOf('function lbnsNhan')
  const b = JS_PHIEU.indexOf('function lbnsVe', a)
  const lbnsNhan = new Function(`${JS_PHIEU.slice(a, b)}\nreturn lbnsNhan;`)() as (v: string, k: string, so: number) => string
  it('cùng kết quả trên lưới giá trị × phím × số ô', () => {
    const PHIM: PhimSo[] = ['0', '5', ',', '-', 'xoa', 'xoa-het']
    let dem = 0
    for (const v of ['', '5', '-5', '1,5', '12', '-12,5', '1234', '-'])
      for (const k of PHIM)
        for (const so of [1, 2, 4, 5, 8]) {
          expect(lbnsNhan(v, k, so), JSON.stringify([v, k, so])).toBe(nhanPhim(v, k, so))
          dem++
        }
    expect(dem).toBeGreaterThan(200)
  })
})
