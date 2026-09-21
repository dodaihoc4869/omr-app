// THẺ "BỘ NÃO A.I HỖ TRỢ RIÊNG EM <họ tên>" — học sinh (lời hôm nay + 7 lời gần nhất) và phụ huynh (lời + thư tuần).
// Đề bài: prompt-bo-nao.md CẬP NHẬT 3. Không có lời ⇒ KHÔNG thẻ. Không emoji. Chữ máy chủ gửi luôn vẽ như CHỮ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import TheBoNao from '../src/components/bang-nhiem-vu/TheBoNao'
import type { BoNaoHocSinh, BoNaoPhuHuynh } from '../src/lib/bo-nao-hien-thi'

const NOW = new Date(2026, 8, 21, 10, 0).getTime() // Thứ Hai 21/09
const LOI = 'Hôm nay em đúng lại 2 câu ester từng sai, tự sửa được mà không ai làm hộ.'
const bay = (n: number): BoNaoHocSinh['gan'] => Array.from({ length: n }, (_, i) => ({ ngay: `2026-09-${String(21 - i).padStart(2, '0')}`, loi: i === 0 ? LOI : `Lời của ngày ${21 - i}.` }))
const HS = (n = 7, over: Partial<BoNaoHocSinh> = {}): BoNaoHocSinh => ({ ngay: '2026-09-21', loi: LOI, gan: bay(n), ...over })
const PH: BoNaoPhuHuynh = { ngay: '2026-09-21', loiNhan: 'Hôm nay con lần đầu lên bậc Hiểu ở dạng thuỷ phân ester.', thuTuan: 'Thưa anh chị, tuần này con làm bài 5 trên 7 ngày.\nTuần tới anh chị chỉ cần nhắc con mở app trước 21 giờ.', tuanTu: '2026-09-14' }

const ve = (o: Partial<React.ComponentProps<typeof TheBoNao>> = {}) =>
  render(<TheBoNao vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} hs={HS()} ph={null} {...o} />)
const the = () => document.querySelector('[data-vung="bo-nao"]')

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

describe('học sinh', () => {
  it('tên thẻ ghép họ tên; lời hôm nay; nhãn ngày; nút "Xem 7 lời gần nhất"', () => {
    ve()
    expect(screen.getByRole('heading', { level: 2, name: 'Bộ não A.I hỗ trợ riêng em Đỗ Minh' })).toBeTruthy()
    expect(the()!.getAttribute('aria-label')).toBe('Bộ não A.I hỗ trợ riêng em Đỗ Minh')
    expect(screen.getByText(LOI)).toBeTruthy()
    expect(screen.getByText('Lời hôm nay · Thứ Hai 21/09')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Xem 7 lời gần nhất/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ẩn hôm nay' })).toBeTruthy()
  })

  it('lời của ngày khác không nhận là "hôm nay"', () => {
    ve({ hs: HS(1, { ngay: '2026-09-20', loi: 'Lời hôm qua.', gan: [{ ngay: '2026-09-20', loi: 'Lời hôm qua.' }] }) })
    expect(screen.getByText('Lời ngày Chủ nhật 20/09')).toBeTruthy()
    expect(screen.queryByText(/Lời hôm nay/)).toBeNull()
  })

  it('bấm "Xem 7 lời gần nhất" mở tờ trượt: 7 lời, mới nhất trước, có ngày; đóng bằng nút X trả focus về nút mở', () => {
    ve()
    const mo = screen.getByRole('button', { name: /Xem 7 lời gần nhất/ })
    fireEvent.click(mo)
    const hop = screen.getByRole('dialog')
    expect(hop.getAttribute('aria-modal')).toBe('true')
    expect(within(hop).getByRole('heading', { level: 2, name: '7 lời gần nhất' })).toBeTruthy()
    const li = hop.querySelectorAll('li')
    expect(li).toHaveLength(7)
    expect(li[0].textContent).toContain('Hôm nay · Thứ Hai 21/09')
    expect(li[0].textContent).toContain(LOI)
    expect(li[1].textContent).toContain('Chủ nhật 20/09')
    expect(li[6].textContent).toContain('Lời của ngày 15.')
    expect(document.activeElement).toBe(within(hop).getByRole('button', { name: 'Đóng' }))
    fireEvent.click(within(hop).getByRole('button', { name: 'Đóng' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(mo)
  })

  it('Esc và bấm ra ngoài (nền mờ) đều đóng tờ trượt', () => {
    ve()
    fireEvent.click(screen.getByRole('button', { name: /Xem 7 lời gần nhất/ }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Xem 7 lời gần nhất/ }))
    const man = document.querySelector('.bnv-bn-man') as HTMLElement
    fireEvent.click(man)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('chỉ có lời hôm nay (chưa có lời cũ) ⇒ KHÔNG có nút "Xem … lời gần nhất"', () => {
    ve({ hs: HS(1) })
    expect(screen.queryByRole('button', { name: /lời gần nhất/ })).toBeNull()
    expect(screen.getByText(LOI)).toBeTruthy()
  })

  it('nút mở ghi ĐÚNG số lời có (3 lời ⇒ "Xem 3 lời gần nhất", tờ ghi "3 lời gần nhất")', () => {
    ve({ hs: HS(3) })
    fireEvent.click(screen.getByRole('button', { name: 'Xem 3 lời gần nhất' }))
    expect(screen.getByRole('heading', { level: 2, name: '3 lời gần nhất' })).toBeTruthy()
    expect(screen.getByRole('dialog').querySelectorAll('li')).toHaveLength(3)
  })

  it('không có lời ⇒ KHÔNG dựng thẻ (không khung rỗng, không "chưa có lời")', () => {
    const { container } = ve({ hs: null })
    expect(container.innerHTML).toBe('')
    expect(document.body.textContent).not.toMatch(/chưa có lời|Bộ não/)
  })
})

describe('"Ẩn hôm nay"', () => {
  it('ẩn thẻ, nhớ NGÀY đã ẩn; mở lại cùng ngày vẫn ẩn; sang ngày có lời mới thì hiện lại', () => {
    const { unmount } = ve()
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn hôm nay' }))
    expect(the()).toBeNull()
    expect(localStorage.getItem('ddh.bonao.an.hocsinh.Đỗ Minh')).toBe('2026-09-21')
    unmount()
    ve()
    expect(the()).toBeNull() // cùng ngày vẫn ẩn
    cleanup()
    ve({ hs: HS(7, { ngay: '2026-09-22', loi: 'Lời của ngày mới.', gan: [{ ngay: '2026-09-22', loi: 'Lời của ngày mới.' }] }) })
    expect(the()).not.toBeNull() // lời ngày 22 ⇒ hiện lại
  })

  it('mỗi vai và mỗi em có khoá ẩn riêng (anh chị em dùng chung máy)', () => {
    ve()
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn hôm nay' }))
    cleanup()
    ve({ hoTen: 'Lê An' })
    expect(the()).not.toBeNull()
  })

  it('máy chặn lưu (localStorage ném lỗi) ⇒ vẫn ẩn trong phiên, không vỡ', () => {
    const doc = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('chặn')
    })
    const ghi = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('chặn')
    })
    ve()
    expect(the()).not.toBeNull()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Ẩn hôm nay' }))
    })
    expect(the()).toBeNull()
    doc.mockRestore()
    ghi.mockRestore()
  })
})

describe('phụ huynh', () => {
  const phv = (ph: BoNaoPhuHuynh | null = PH) => ve({ vaiTro: 'phuhuynh', hs: null, ph })

  it('cùng tên thẻ; nhãn "Lời cho anh chị"; lời; thư tuần GẬP sẵn; KHÔNG có "Xem … lời gần nhất"', () => {
    phv()
    expect(screen.getByRole('heading', { level: 2, name: 'Bộ não A.I hỗ trợ riêng em Đỗ Minh' })).toBeTruthy()
    expect(screen.getByText('Lời cho anh chị · Thứ Hai 21/09')).toBeTruthy()
    expect(screen.getByText(PH.loiNhan)).toBeTruthy()
    const thu = screen.getByRole('button', { name: /Thư tuần này/ })
    expect(thu.getAttribute('aria-expanded')).toBe('false')
    expect(thu.textContent).toContain('14–20/09')
    expect(document.body.textContent).not.toContain('tuần này con làm bài 5 trên 7 ngày')
    expect(screen.queryByRole('button', { name: /lời gần nhất/ })).toBeNull()
  })

  it('mở thư tuần: hiện từng đoạn; gập lại thì ẩn', () => {
    phv()
    const thu = screen.getByRole('button', { name: /Thư tuần này/ })
    fireEvent.click(thu)
    expect(thu.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Thưa anh chị, tuần này con làm bài 5 trên 7 ngày.')).toBeTruthy()
    expect(screen.getByText('Tuần tới anh chị chỉ cần nhắc con mở app trước 21 giờ.')).toBeTruthy()
    fireEvent.click(thu)
    expect(screen.queryByText('Thưa anh chị, tuần này con làm bài 5 trên 7 ngày.')).toBeNull()
  })

  it('chỉ có thư tuần (không lời hôm nay) ⇒ thư MỞ sẵn, không đoạn lời rỗng', () => {
    phv({ ...PH, loiNhan: '' })
    expect(screen.getByRole('button', { name: /Thư tuần này/ }).getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('.bnv-bn-loi')).toBeNull()
  })

  it('chỉ có lời hôm nay (không thư) ⇒ không nút thư', () => {
    phv({ ...PH, thuTuan: '' })
    expect(screen.queryByRole('button', { name: /Thư tuần/ })).toBeNull()
    expect(screen.getByText(PH.loiNhan)).toBeTruthy()
  })

  it('không có gì ⇒ không thẻ', () => {
    const { container } = phv(null)
    expect(container.innerHTML).toBe('')
  })
})

describe('mỗi vai chỉ thấy phần CỦA MÌNH', () => {
  it('học sinh không bao giờ thấy lời phụ huynh, kể cả khi bị truyền nhầm', () => {
    ve({ hs: null, ph: PH })
    expect(the()).toBeNull()
    expect(document.body.textContent).not.toContain('Thư tuần')
  })
  it('phụ huynh không thấy lời của em', () => {
    ve({ vaiTro: 'phuhuynh', hs: HS(), ph: null })
    expect(the()).toBeNull()
  })
})

describe('an toàn và giọng văn', () => {
  it('chữ máy chủ gửi luôn được vẽ như CHỮ (không thành HTML)', () => {
    const doc = '<img src="x" onerror="alert(1)"> và <b>đậm</b>'
    ve({ hs: HS(1, { loi: doc, gan: [{ ngay: '2026-09-21', loi: doc }] }) })
    expect(the()!.querySelector('img')).toBeNull()
    expect(the()!.querySelector('b')).toBeNull()
    expect(the()!.textContent).toContain('<img src="x" onerror="alert(1)">')
  })

  it('không emoji ở bất kỳ chỗ nào của thẻ (học sinh, tờ trượt, phụ huynh)', () => {
    ve()
    fireEvent.click(screen.getByRole('button', { name: /Xem 7 lời gần nhất/ }))
    expect(document.body.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
    cleanup()
    ve({ vaiTro: 'phuhuynh', hs: null, ph: PH })
    fireEvent.click(screen.getByRole('button', { name: /Thư tuần này/ }))
    expect(document.body.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
  })

  it('đích bấm đủ lớn: nút của thẻ có chiều cao tối thiểu 48 px trong CSS', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/components/bang-nhiem-vu/bo-nao.css', 'utf8')
    expect(css).toMatch(/\.bnv-bn-nut \{[^}]*min-height: 48px/)
    expect(css).toMatch(/\.bnv-bn-dong \{[^}]*width: 48px; height: 48px/)
    expect(css).toMatch(/\.bnv-bn-thu-dau \{[^}]*min-height: 48px/)
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/) // không mã màu thô (check:mau)
  })
})
