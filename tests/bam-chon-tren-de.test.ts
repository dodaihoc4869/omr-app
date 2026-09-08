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

function moPhieu(html: string) {
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
