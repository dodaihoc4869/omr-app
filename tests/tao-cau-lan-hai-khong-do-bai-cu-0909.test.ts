// TẠO CÂU LẦN 2 KHÔNG ĐƯỢC ĐỔ BÀI LÀM LẦN 1 VÀO.
//
// Thầy báo 09/09 khuya: "bấm tạo câu lần 2 thì hiện sẵn đáp án vào ô đáp án,
// phần đúng sai đáp án hiện chữ đậm, khắc phục hết đi".
//
// NGUYÊN NHÂN GỐC, tái hiện được trong jsdom trước khi sửa:
//   lần 1 làm q1=B · q2=S · q3=99 rồi nộp
//   lần 2 rút BỘ CÂU KHÁC nhưng CÙNG MÃ  →  oNhap vẫn ["99"], tfDaChon vẫn ["S"]
//
// Mã phiếu CỐ Ý dùng lại cho cùng một em trong cùng một ca: máy chủ tìm thấy
// dòng cũ thì trả lại mã cũ, để link đã phát ra vẫn sống (`ghiPhieuKhacPhuc`).
// Nhưng bấm "tạo câu" lần nữa lại rút một BỘ CÂU KHÁC. Hai bộ khác nhau dùng
// chung khoá `ddh.lam.<ma>` nên bài lần 1 đổ ngược vào phiếu lần 2.
//
// SỬA: khoá lưu bài mang thêm VÂN TAY của bộ câu (băm djb2 trên chuỗi qid).
// Cùng bộ mở lại thì vẫn khôi phục đúng như cũ; bộ khác thì tờ giấy trắng.
//
// TỆP NÀY CHẠY THẬT TRONG DOM, không soi chuỗi — vì đúng cái lỗi này là lỗi
// hành vi, chuỗi trong tệp sinh ra không nói lên điều gì.
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { dungPhieu } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const C = (id: string, phan: 'I' | 'II' | 'III'): CauLuyen =>
  ({
    id,
    phan,
    text: 'Câu ' + id,
    luaChon: phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : phan === 'I' ? ['a', 'b', 'c', 'd'] : undefined,
    dapAn: phan === 'II' ? 'ĐSĐS' : phan === 'III' ? '12,5' : 'A',
    mucDo: 'biet',
    chuyenDe: 'Ester – lipid',
    maDe: 'X',
    dang: 'chua_ro',
    sao: 0,
    chot: 'c',
    lyDo: null,
    buoc: null,
    ketQua: '',
  }) as unknown as CauLuyen

const TT = { hoTen: 'Nguyễn Văn A', sbd: '12050', ngay: new Date(2026, 8, 9), tenChuyenDe: 'Ester', ketQua: '', hienDapAn: false }
const NOP = (ma: string) => ({ ma, sbd: '12050', url: 'https://script.google.com/x/exec' })

const BO1 = [C('q1', 'I'), C('q2', 'II'), C('q3', 'III')]
const BO2 = [C('q3', 'III'), C('q4', 'I'), C('q2', 'II')]

let boNghe: Array<[string, EventListenerOrEventListenerObject, unknown]> = []
function mo(html: string) {
  for (const [t, h, c] of boNghe) document.removeEventListener(t, h, c as boolean)
  boNghe = []
  const themGoc = document.addEventListener.bind(document)
  document.addEventListener = ((t: string, h: EventListenerOrEventListenerObject, c?: unknown) => {
    boNghe.push([t, h, c])
    themGoc(t as keyof DocumentEventMap, h as EventListener, c as boolean)
  }) as typeof document.addEventListener
  const than = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  document.documentElement.innerHTML = than.replace(/<\/?body[^>]*>/g, '')
  document.body.className = /<body class="([^"]*)"/.exec(html)?.[1] ?? ''
  const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
  new Function(js)()
}

/** Ảnh chụp trạng thái em NHÌN THẤY. */
function anh() {
  return {
    oNhap: [...document.querySelectorAll<HTMLInputElement>('.lam-nhap')].map((i) => i.value),
    tfDaChon: [...document.querySelectorAll('.tf-badge[aria-checked="true"]')].map((e) => e.getAttribute('data-chon')),
    optDaChon: [...document.querySelectorAll('.q-opt[aria-checked="true"]')].map((e) => e.getAttribute('data-chon')),
    dem: document.getElementById('nop-dem')?.textContent,
  }
}

function lamBaiLan1() {
  ;(document.querySelector('.q-card[data-qid="q1"] .q-opt.lam-o[data-chon="B"]') as HTMLElement).click()
  const y0 = document.querySelectorAll('.q-card[data-qid="q2"] .tf-item')[0]
  ;(y0.querySelector('.tf-badge.lam-o[data-chon="S"]') as HTMLElement).click()
  const nh = document.querySelector('.q-card[data-qid="q3"] .lam-nhap') as HTMLInputElement
  nh.value = '99'
  nh.dispatchEvent(new Event('input', { bubbles: true }))
}

beforeEach(() => {
  for (const k of Object.keys(localStorage)) if (k.indexOf('ddh.lam.') === 0) localStorage.removeItem(k)
  ;(globalThis as unknown as { fetch: unknown }).fetch = async () => ({ ok: true, json: async () => ({ ok: true, soDung: 2, soCau: 3, lanThu: 1 }) })
  ;(window as unknown as { confirm: () => boolean }).confirm = () => true
})

describe('BỘ CÂU KHÁC thì phiếu phải TRẮNG', () => {
  it('TÁI HIỆN ĐÚNG LỖI THẦY BÁO: lần 2 không còn ô nào điền sẵn', async () => {
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-CHUNG') }))
    lamBaiLan1()
    expect(anh()).toEqual({ oNhap: ['99'], tfDaChon: ['S'], optDaChon: ['B'], dem: '3' })
    ;(document.getElementById('nut-nop') as HTMLElement).click()
    await new Promise((r) => setTimeout(r, 30))

    // LẦN 2 — bộ câu khác, CÙNG mã phiếu.
    mo(dungPhieu(TT, BO2, { nop: NOP('MA-CHUNG') }))
    const a = anh()
    expect(a.oNhap).toEqual([''])
    expect(a.tfDaChon).toEqual([])
    expect(a.optDaChon).toEqual([])
    expect(a.dem).toBe('0')
  })

  it('CÙNG BỘ mở lại thì VẪN GIỮ bài — không sửa lỗi này bằng cách bỏ tính năng', () => {
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-CHUNG') }))
    lamBaiLan1()
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-CHUNG') }))
    const a = anh()
    expect(a.oNhap).toEqual(['99'])
    expect(a.tfDaChon).toEqual(['S'])
    expect(a.optDaChon).toEqual(['B'])
    expect(a.dem).toBe('3')
  })

  it('ĐỔI THỨ TỰ cùng bộ câu là BỘ KHÁC — vân tay theo đúng chuỗi qid', () => {
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-CHUNG') }))
    lamBaiLan1()
    mo(dungPhieu(TT, [BO1[2], BO1[0], BO1[1]], { nop: NOP('MA-CHUNG') }))
    // Bộ đảo thứ tự là một tờ khác: không đổ bài cũ vào.
    expect(anh().dem).toBe('0')
  })

  it('MÃ KHÁC thì đương nhiên tách — hai em, hai tờ', () => {
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-EM-A') }))
    lamBaiLan1()
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-EM-B') }))
    expect(anh().dem).toBe('0')
  })
})

describe('CHUYỂN BÀI DỞ TỪ BẢN APP CŨ — không được mất bài', () => {
  it('khoá cũ CÙNG bộ câu thì chuyển sang khoá mới', () => {
    // Bản cũ lưu thẳng vào ddh.lam.<ma>, không có vân tay.
    localStorage.setItem('ddh.lam.MA-CHUNG', JSON.stringify({ q1: 'B', q3: '99' }))
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-CHUNG') }))
    const a = anh()
    expect(a.oNhap).toEqual(['99'])
    expect(a.optDaChon).toEqual(['B'])
    // Khoá cũ được dọn đi để lần sau không đổ nhầm lần nữa.
    expect(localStorage.getItem('ddh.lam.MA-CHUNG')).toBeNull()
  })

  it('khoá cũ có qid LẠ thì BỎ QUA — thà tờ trắng còn hơn đổ nhầm bộ khác', () => {
    localStorage.setItem('ddh.lam.MA-CHUNG', JSON.stringify({ q1: 'B', q9: 'X' }))
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-CHUNG') }))
    expect(anh().dem).toBe('0')
  })

  it('cờ CHỜ GỬI của bản cũ đi theo sang khoá mới — bài chưa gửi không bị bỏ rơi', () => {
    localStorage.setItem('ddh.lam.MA-CHUNG', JSON.stringify({ q1: 'B' }))
    localStorage.setItem('ddh.lam.MA-CHUNG.cho', '1')
    mo(dungPhieu(TT, BO1, { nop: NOP('MA-CHUNG') }))
    const khoaMoi = Object.keys(localStorage).filter((k) => k.indexOf('ddh.lam.MA-CHUNG.') === 0 && k.slice(-4) === '.cho')
    expect(khoaMoi.length).toBe(1)
    expect(localStorage.getItem('ddh.lam.MA-CHUNG.cho')).toBeNull()
  })
})
