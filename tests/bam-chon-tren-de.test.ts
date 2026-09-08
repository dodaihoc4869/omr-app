// BẤM THẬT TRÊN PHIẾU — chạy đúng kịch bản của phiếu trong một DOM thật.
//
// Thầy báo hai lần liền "vẫn chưa bấm chọn đáp án ngay trên đề được". Mấy phép
// kiểm trước đó chỉ soi CHUỖI trong tệp sinh ra, nên chúng xanh cả trong khi
// thầy vẫn không bấm được — chuỗi đúng không chứng minh được nút chạy.
//
// Tệp này nạp phiếu vào jsdom, chạy đúng khối kịch bản nhúng trong phiếu, rồi
// bấm như em bấm. Đây mới là bằng chứng.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { dungPhieu } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const cau = (id: string, phan: 'I'|'II'|'III'): CauLuyen => ({
  id, phan, text: 'Câu ' + id,
  luaChon: phan === 'II' ? ['ý a','ý b','ý c','ý d'] : phan === 'I' ? ['a','b','c','d'] : undefined,
  dapAn: phan === 'II' ? 'ĐSĐS' : phan === 'III' ? '12,5' : 'A',
  mucDo: 'biet', chuyenDe: 'Ester – lipid',
  loiGiai: { buoc: ['B1'], dapAn: 'A' },
}) as unknown as CauLuyen

const tt = { hoTen: 'Đỗ Đại Học', sbd: '12121212', ngay: new Date('2026-09-08'), tenChuyenDe: 'Ester – lipid', ketQua: '', hienDapAn: false }

// GỠ SẠCH TRƯỚC KHI NẠP PHIẾU MỚI.
// jsdom giữ nguyên đối tượng document giữa các phép kiểm, nên mỗi lần nạp phiếu
// là chồng thêm một bộ nghe sự kiện lên document; bộ CŨ vẫn bắt cú bấm vào phần
// tử MỚI và lật ngược kết quả. Bài làm cũng cất chung khoá ddh.lam.<mã> nên
// trạng thái rò từ phép kiểm trước sang phép kiểm sau. Hai thứ đó làm phép kiểm
// nói dối theo cả hai chiều. Ở đây gỡ cả hai; giữ lại khoá màu vì phép kiểm màu
// cần nó sống qua hai lần mở phiếu.
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

describe('BẤM THẬT trên phiếu, không chỉ soi chuỗi', () => {
  it('Phần I: bấm phương án là ô đó được chọn, bấm lại là bỏ chọn', () => {
    moPhieu(dungPhieu(tt, [cau('q1','I')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const o = document.querySelectorAll<HTMLElement>('.q-card[data-qid="q1"] .q-opt.lam-o')
    expect(o.length).toBe(4)
    o[2].click()
    expect(o[2].getAttribute('aria-checked')).toBe('true')
    expect(document.getElementById('nop-dem')?.textContent).toBe('1')
    o[2].click()
    expect(o[2].getAttribute('aria-checked')).toBe('false')
    expect(document.getElementById('nop-dem')?.textContent).toBe('0')
  })

  it('Phần II: bấm Đ/S trên từng ý', () => {
    moPhieu(dungPhieu(tt, [cau('q2','II')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const y = document.querySelectorAll<HTMLElement>('.q-card[data-qid="q2"] .tf-item[data-y]')
    expect(y.length).toBe(4)
    const d = y[0].querySelector<HTMLElement>('.tf-badge.lam-o[data-chon="D"]')!
    d.click()
    expect(d.getAttribute('aria-checked')).toBe('true')
  })

  it('Phần III: gõ vào ô là tính là đã làm', () => {
    moPhieu(dungPhieu(tt, [cau('q3','III')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const i = document.querySelector<HTMLInputElement>('.q-card[data-qid="q3"] .lam-nhap')!
    i.value = '12,5'
    i.dispatchEvent(new Event('input', { bubbles: true }))
    expect(document.getElementById('nop-dem')?.textContent).toBe('1')
  })

  it('PHIẾU ĐỌC (không nop): không có ô bấm nào, dòng kẻ giữ nguyên', () => {
    moPhieu(dungPhieu(tt, [cau('q1','I'), cau('q3','III')]))
    expect(document.querySelectorAll('.lam-o').length).toBe(0)
    expect(document.querySelectorAll('.sa-blank').length).toBe(1)
  })

  it('MÀU: mở phiếu là có data-mau, mở lại nhích sang sắc kế tiếp', () => {
    const h = dungPhieu(tt, [cau('q1','I')])
    moPhieu(h)
    const m1 = Number(document.body.getAttribute('data-mau'))
    expect(m1).toBeGreaterThanOrEqual(1)
    moPhieu(h)
    const m2 = Number(document.body.getAttribute('data-mau'))
    expect(m2).toBe((m1 % 7) + 1)
    for (let i = 0; i < 7; i++) moPhieu(h)
    expect(Number(document.body.getAttribute('data-mau'))).toBe(m2)
  })
})

// ---------------------------------------------------------------------------
// Ô ĐÁP ÁN ĐÚNG CHỌN XONG PHẢI THẤY — thầy chỉ ra 08/09: "lựa chọn A chưa bao
// giờ bấm được", và A chính là đáp án đúng của câu đó.
//
// Gốc: luật giấu đáp án `body.chua-nop .q-opt.dung { ... !important }` đè luôn
// màu của ô ĐANG CHỌN. Cú bấm vẫn ăn — đếm lên, lưu lại — nhưng ô không đổi
// màu, nhìn y như không bấm được; bấm lại lần nữa là bỏ chọn.
//
// Ba đợt trước tôi đi sửa tầng sự kiện chạm. Sự kiện chưa bao giờ hỏng.
describe('Ô ĐÁP ÁN ĐÚNG: chọn xong phải ĐỔI MÀU, nhưng chưa chọn thì không lộ', () => {
  it('luật giấu đáp án chừa ô đang chọn ra, ở CẢ hai chế độ giấu', () => {
    const h = dungPhieu(tt, [cau('q1', 'I'), cau('q2', 'II')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } })
    for (const lop of ['chua-nop', 'chi-de']) {
      expect(h).toContain(`body.${lop} .q-opt.dung:not([aria-checked="true"]) {`)
      expect(h).toContain(`body.${lop} .q-opt.dung:not([aria-checked="true"]) .q-opt-letter {`)
      expect(h).toContain(`body.${lop} .tf-badge.dung:not([aria-checked="true"]) {`)
    }
    // Và KHÔNG còn luật trần nào đè lên mọi ô `dung`.
    expect(h).not.toContain('body.chua-nop .q-opt.dung { background')
    expect(h).not.toContain('body.chi-de .q-opt.dung { background')
    expect(h).not.toContain('body.chua-nop .tf-badge.dung { background')
  })

  it('BẤM THẬT vào đúng ô đáp án đúng: aria bật, đếm lên, lưu đúng', () => {
    moPhieu(dungPhieu(tt, [cau('q1', 'I')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    // Câu mẫu có đáp án 'A', nên ô A mang lớp `dung` — đúng ca thầy gặp.
    const oA = document.querySelector<HTMLElement>('.q-card[data-qid="q1"] .q-opt.lam-o[data-chon="A"]')!
    expect(oA.className).toContain('dung')
    oA.click()
    expect(oA.getAttribute('aria-checked')).toBe('true')
    expect(document.getElementById('nop-dem')?.textContent).toBe('1')
    // Bấm lại thì bỏ chọn — đúng luật, và đây là thứ thầy vô tình làm khi
    // tưởng cú bấm trước không ăn.
    oA.click()
    expect(oA.getAttribute('aria-checked')).toBe('false')
    expect(document.getElementById('nop-dem')?.textContent).toBe('0')
  })
})

// MỘT CÚ CHẠM CHỈ ĐƯỢC TÍNH MỘT LẦN, KỂ CẢ KHI TRÌNH DUYỆT KHÔNG CHO HUỶ.
//
// Thầy báo BỐN lần "nút bấm được nút không". Nguyên nhân còn lại: lưới an toàn
// chặn cú click giả bằng preventDefault, mà preventDefault chỉ ăn khi touchend
// còn huỷ được. Máy đang cuộn thì trình duyệt phát touchend KHÔNG huỷ được;
// lúc ấy click vẫn tới, ô bị chọn rồi bỏ chọn ngay trong một cú chạm.
//
// KHAI RÕ: jsdom không có elementFromPoint thật, nên ở đây tôi tạm thay nó bằng
// hàm trả đúng ô đang chạm. Phần được kiểm là LUẬT CHỐNG ĂN HAI LẦN, không phải
// phép dò toạ độ.
function chamVao(o: HTMLElement, huyDuoc: boolean) {
  const cu = (document as unknown as { elementFromPoint?: unknown }).elementFromPoint
  ;(document as unknown as { elementFromPoint: unknown }).elementFromPoint = () => o
  const cham = { clientX: 10, clientY: 10 }
  const e1 = new Event('touchstart', { bubbles: true }) as Event & { touches: unknown[] }
  e1.touches = [cham]
  document.dispatchEvent(e1)
  const e2 = new Event('touchend', { bubbles: true, cancelable: huyDuoc }) as Event & { changedTouches: unknown[] }
  e2.changedTouches = [cham]
  document.dispatchEvent(e2)
  ;(document as unknown as { elementFromPoint: unknown }).elementFromPoint = cu
  return e2.defaultPrevented
}

describe('MỘT CÚ CHẠM = MỘT LẦN CHỌN, trên mọi máy', () => {
  it('touchend HUỶ ĐƯỢC: lưới chặn click giả, ô chọn đúng một lần', () => {
    moPhieu(dungPhieu(tt, [cau('q1', 'I')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const oB = document.querySelector<HTMLElement>('.q-card[data-qid="q1"] .q-opt.lam-o[data-chon="B"]')!
    expect(chamVao(oB, true)).toBe(true)
    expect(oB.getAttribute('aria-checked')).toBe('true')
    expect(document.getElementById('nop-dem')?.textContent).toBe('1')
  })

  it('touchend KHÔNG huỷ được: click giả vẫn tới nhưng bị nuốt, ô vẫn chọn', () => {
    moPhieu(dungPhieu(tt, [cau('q1', 'I')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const oB = document.querySelector<HTMLElement>('.q-card[data-qid="q1"] .q-opt.lam-o[data-chon="B"]')!
    expect(chamVao(oB, false)).toBe(false)
    oB.click() // đúng cú click giả trình duyệt phát ra ngay sau đó
    expect(oB.getAttribute('aria-checked')).toBe('true')
    expect(document.getElementById('nop-dem')?.textContent).toBe('1')
  })

  it('CHẠM LẠI cùng ô vẫn BỎ CHỌN được — không bị khoá theo thời gian', () => {
    moPhieu(dungPhieu(tt, [cau('q1', 'I')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const oA = document.querySelector<HTMLElement>('.q-card[data-qid="q1"] .q-opt.lam-o[data-chon="A"]')!
    chamVao(oA, false)
    oA.click()
    expect(oA.getAttribute('aria-checked')).toBe('true')
    chamVao(oA, false)
    oA.click()
    expect(oA.getAttribute('aria-checked')).toBe('false')
    expect(document.getElementById('nop-dem')?.textContent).toBe('0')
  })

  it('CHUỘT và BÀN PHÍM không bị nuốt: click trần vẫn chọn', () => {
    moPhieu(dungPhieu(tt, [cau('q1', 'I')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const oC = document.querySelector<HTMLElement>('.q-card[data-qid="q1"] .q-opt.lam-o[data-chon="C"]')!
    oC.click()
    expect(oC.getAttribute('aria-checked')).toBe('true')
    // Nút là thẻ button thật nên Enter tự sinh click; không nghe keydown riêng.
    expect(oC.tagName).toBe('BUTTON')
  })

  it('Phần II: một cú chạm vào Đ không bị click giả lật ngược', () => {
    moPhieu(dungPhieu(tt, [cau('q2', 'II')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } }))
    const y = document.querySelectorAll<HTMLElement>('.q-card[data-qid="q2"] .tf-item[data-y]')
    const d = y[0].querySelector<HTMLElement>('.tf-badge.lam-o[data-chon="D"]')!
    chamVao(d, false)
    d.click()
    expect(d.getAttribute('aria-checked')).toBe('true')
  })
})
