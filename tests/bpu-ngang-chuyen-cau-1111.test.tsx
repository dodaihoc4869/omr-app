// LIVE · CHUYỂN CÂU KHI MÁY EM ĐANG NGANG (thầy 11/11 tối: «khi chuyển câu thì máy hs đang ở màn hình ngang live thì câu hiện luôn theo kiểu xoay ngang không về
// dạng dọc nữa nhé»). GỐC LỖI: (1) lớp bảng live (LopLive.tsx · BangLive) tự khoá ngang rồi GỠ là NHẢ khoá ⇒ thầy chuyển câu, máy Android khoá xoay hệ thống quay
// về dọc; (2) máy không khoá được (iPhone…) chỉ BẢNG xoay hình CSS, màn câu hỏi `.bpu-hs` không có đường xoay ⇒ câu hiện dọc. Bộ thử Chromium thật:
// scripts/thu-live-1011/thu-ngang-chuyen-cau-1111.mjs. Ở đây: luật chọn hướng (thuần) + hook trả thuộc tính xoay NGAY lượt dựng đầu (không nháy dọc).
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CAO_KHUNG_THAP, RONG_HAI_COT, buocHuongLive, useHuongLive, xoayManCau, type HuongLive } from '../src/components/bpu/luat-man-live'
import { canXoayCss, giuKhoaNgang } from '../src/components/live/bo-cuc'

type Che = 'an' | 'dau' | 'bang'
/** Chạy một chuỗi bước (màn live, live bật, trang dọc) qua luật nhớ hướng; trả hướng sau từng bước. */
function chay(buoc: [Che, boolean, boolean][]): HuongLive[] {
  let h: HuongLive = null
  return buoc.map(([che, bat, doc]) => (h = buocHuongLive(h, che, bat, doc)))
}

describe('luật nhớ hướng lúc live (buocHuongLive / xoayManCau / giuKhoaNgang)', () => {
  it('(1) iPhone khoá xoay: bảng xoay hình CSS (trang dọc) ⇒ thầy chuyển câu ⇒ màn câu hỏi XOAY hình, không về dọc', () => {
    expect(canXoayCss(390, 844, false)).toBe(true) // bảng xoay CSS trên trang dọc chưa khoá ⇒ em đang cầm ngang
    const h = chay([['dau', true, true], ['bang', true, true], ['dau', true, true]])
    expect(h).toEqual([null, 'xoay', 'xoay'])
    expect(xoayManCau(h[2]!, 'dau', true)).toBe(true)
  })
  it('(1) Android khoá xoay hệ thống: bảng đã khoá ngang (trang ngang) ⇒ chuyển câu GIỮ khoá, câu ngang theo trang, không xoay hình', () => {
    const h = chay([['bang', true, true], ['bang', true, false], ['dau', true, false]]) // trước khi khoá xong trang còn dọc thoáng qua
    expect(h).toEqual(['xoay', 'ngang', 'ngang'])
    expect(giuKhoaNgang('dau', h[2] !== null)).toBe(true) // màn câu hỏi thay bảng KHÔNG nhả khoá (trước: lớp bảng gỡ là nhả)
    expect(xoayManCau(h[2]!, 'dau', false)).toBe(false)
  })
  it('(2) chuyển câu rồi thầy «lên bảng» (ép vào live) rồi lại chuyển câu: hướng giữ nguyên suốt', () => {
    const h = chay([['bang', true, true], ['dau', true, true], ['bang', true, true], ['dau', true, true]])
    expect(h.every((x) => x === 'xoay')).toBe(true)
    expect(giuKhoaNgang('bang', true) && giuKhoaNgang('dau', true)).toBe(true)
  })
  it('(3) em gửi xong về bảng live: bảng vẫn tự xoay theo luật cũ (canXoayCss), không đụng gì thêm', () => {
    const h = chay([['bang', true, true], ['dau', true, true], ['bang', true, true]])
    expect(h[2]).toBe('xoay')
    expect(xoayManCau(h[2]!, 'bang', true)).toBe(false) // lúc ở bảng: gốc màn KHÔNG xoay (bảng `.lv` tự xoay)
  })
  it('máy cầm DỌC chưa từng vào bảng: câu dọc như cũ, không khoá ngang', () => {
    const h = chay([['dau', true, true], ['dau', true, true]])
    expect(h).toEqual([null, null])
    expect(xoayManCau(h[1]!, 'dau', true)).toBe(false)
    expect(giuKhoaNgang('dau', false)).toBe(false)
  })
  it('máy tự xoay: đang làm câu ngang mà em xoay máy về dọc ⇒ câu DỌC (theo máy), không xoay hình', () => {
    // vào bảng lúc trang dọc (xoay hình) → em xoay máy ngang (trang ngang) → câu mới → em xoay lại dọc
    const h = chay([['bang', true, true], ['bang', true, false], ['dau', true, false], ['dau', true, true]])
    expect(h).toEqual(['xoay', 'ngang', 'ngang', 'ngang'])
    expect(xoayManCau(h[3]!, 'dau', true)).toBe(false)
    // đang câu xoay hình mà trang thành ngang (khoá được / em tự xoay) ⇒ thôi xoay hình
    expect(chay([['bang', true, true], ['dau', true, true], ['dau', true, false], ['dau', true, true]])).toEqual(['xoay', 'xoay', 'ngang', 'ngang'])
  })
  it('đang hiện cảnh báo rời màn (màn `an` lúc live còn bật): giữ nhớ hướng; HẾT live ⇒ quên, nhả khoá', () => {
    expect(chay([['bang', true, true], ['an', true, true], ['dau', true, true]])).toEqual(['xoay', 'xoay', 'xoay'])
    const h = chay([['bang', true, false], ['an', false, false], ['dau', false, true]])
    expect(h).toEqual(['ngang', null, null])
    expect(giuKhoaNgang('an', h[1] !== null)).toBe(false)
  })
})

/** Đặt khổ trang (jsdom) — hook đọc innerWidth / innerHeight. */
function kho(w: number, h: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: w })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: h })
}
afterEach(() => kho(1024, 768))

describe('useHuongLive: thuộc tính xoay có NGAY lượt dựng đầu của màn câu hỏi (không nháy dọc)', () => {
  const lan: { the: ReturnType<typeof useHuongLive>['the']; giu: boolean; xoay: boolean }[] = []
  function Thu({ che, bat }: { che: Che; bat: boolean }) {
    const r = useHuongLive(che, bat)
    lan.push(r)
    return <div className="bpu-hs" {...r.the} />
  }
  it('iPhone 390 × 844: bảng ⇒ câu mới: lượt dựng ĐẦU TIÊN với màn câu hỏi đã có data-xoay + khổ hình 844 × 390, data-ngang (≥ 640), data-thap (≤ 500)', () => {
    kho(390, 844)
    lan.length = 0
    const { container, rerender } = render(<Thu che="bang" bat />)
    expect(container.querySelector('.bpu-hs')!.hasAttribute('data-xoay')).toBe(false) // ở bảng: gốc màn không xoay
    expect(lan.at(-1)!.giu).toBe(true)
    const truoc = lan.length
    rerender(<Thu che="dau" bat />)
    const dau = lan.slice(truoc)
    expect(dau.length).toBeGreaterThan(0)
    expect(dau.every((x) => x.xoay && 'data-xoay' in x.the)).toBe(true) // mọi lượt dựng của màn câu hỏi đều đã xoay — kể cả lượt đầu
    const g = container.querySelector<HTMLElement>('.bpu-hs')!
    expect(g.hasAttribute('data-xoay') && g.hasAttribute('data-ngang') && g.hasAttribute('data-thap')).toBe(true)
    expect([g.style.width, g.style.height]).toEqual(['844px', '390px'])
    expect(RONG_HAI_COT).toBe(640); expect(CAO_KHUNG_THAP).toBe(500) // 11/11 bố cục ngang: hai cột từ 640 (một ngưỡng với màn chặng), trước 700
  })
  it('máy dọc chưa vào bảng / máy ngang thật: không có thuộc tính xoay', () => {
    kho(390, 844)
    const a = render(<Thu che="dau" bat />)
    expect(a.container.querySelector('.bpu-hs')!.attributes.length).toBe(1)
    a.unmount()
    kho(844, 390)
    const b = render(<Thu che="bang" bat />)
    b.rerender(<Thu che="dau" bat />)
    expect(b.container.querySelector('.bpu-hs')!.hasAttribute('data-xoay')).toBe(false)
    expect(lan.at(-1)!.giu).toBe(true) // vẫn giữ khoá ngang (Android) suốt live
  })
  it('hình xoay iPhone SE 375 × 667 ⇒ hình 667 × 375: xoay VÀ hai cột (11/11: ngưỡng 640, đúng như máy ngang thật 667 px — @media ≥ 640 px khớp)', () => {
    kho(375, 667)
    const { container, rerender } = render(<Thu che="bang" bat />)
    rerender(<Thu che="dau" bat />)
    const g = container.querySelector<HTMLElement>('.bpu-hs')!
    expect(g.hasAttribute('data-xoay')).toBe(true)
    expect(g.hasAttribute('data-ngang')).toBe(true)
    expect(g.hasAttribute('data-thap')).toBe(true)
  })
  it('hình xoay hẹp (iPhone SE đời đầu 320 × 568 ⇒ hình 568 × 320): xoay nhưng KHÔNG hai cột — như máy ngang thật 568 px (@media ≥ 640 px không khớp)', () => {
    kho(320, 568)
    const { container, rerender } = render(<Thu che="bang" bat />)
    rerender(<Thu che="dau" bat />)
    const g = container.querySelector<HTMLElement>('.bpu-hs')!
    expect(g.hasAttribute('data-xoay')).toBe(true)
    expect(g.hasAttribute('data-ngang')).toBe(false)
    expect(g.hasAttribute('data-thap')).toBe(true)
  })
  it('hết live ⇒ gốc màn thôi xoay, nhả khoá', () => {
    kho(390, 844)
    const { container, rerender } = render(<Thu che="bang" bat />)
    rerender(<Thu che="dau" bat />)
    rerender(<Thu che="an" bat={false} />)
    expect(container.querySelector('.bpu-hs')!.hasAttribute('data-xoay')).toBe(false)
    expect(lan.at(-1)!.giu).toBe(false)
  })
})
