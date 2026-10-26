// HỒ SƠ 6 MỨC — GIAO DIỆN BA GÓC NHÌN (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210, 22/10; chốt 4 điểm như đề xuất). Đặc tả mục 7:
// thầy thấy chip đầu tấm + thẻ bằng chứng Mức 6 + nút lọc; học sinh / phụ huynh có dữ liệu treo mà DOM, title, aria-label KHÔNG có "Cố tình", "Mức làm 6", "co_tinh";
// học sinh thấy "Câu này máy để treo X phút"; phụ huynh không có chữ "phút" ở lượt treo, chỉ chip + một dòng tổng.
// Dữ liệu: scripts/chup-v2/gia/lich-su-6-muc.ts (Mức 1–4 do hàm máy chủ `mucLamCuaLuot`, tổng do hàm thuần `mucLam6`).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import HoSoLamCauEm, { type CheDoHoSo, type NguonHoSo } from '../src/components/chien-dich/HoSoLamCauEm'
import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'
import { lichSu6MucGia } from '../scripts/chup-v2/gia/lich-su-6-muc'
import { choTamXong } from './_ho-so-6-muc'

const SBD = '11010'
const TD = { ...hoSoThaiDoGia(SBD), nhomNhip: 'chua-deu' as const, coDoiPho: true }
afterEach(cleanup)

async function mo(cheDo: CheDoHoSo, tuy: { cu?: boolean } = {}) {
  const nguon: NguonHoSo = {
    hoSoThaiDo: async () => ({ ok: true, du: TD }),
    lichSu: async () => ({ ok: true, du: JSON.parse(JSON.stringify(lichSu6MucGia(SBD, TD.em.hoTen, cheDo, tuy))) }),
  }
  render(<HoSoLamCauEm em={{ sbd: SBD, ten: TD.em.hoTen, khoi: '12' }} onDong={() => {}} nguon={nguon} cheDo={cheDo} />)
  const tam = await screen.findByRole('dialog')
  await choTamXong(tam)
  return tam
}
const chu = (e: Element | null | undefined) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim()
const dongCua = (tam: HTMLElement, cau: string) => [...tam.querySelectorAll('.hslc-lan')].filter((l) => chu(l).includes(cau))

describe('thầy: đủ 6 mức, Mức 6 ở ba chỗ (chip đầu tấm · thẻ bằng chứng · nút lọc)', () => {
  it('chip đầu tấm, thẻ bằng chứng (giờ + phút từng lượt), 6 ô đúng/sai, ba ô "lượt sai rơi vào đâu"', async () => {
    const tam = await mo('thay')
    await waitFor(() => expect(tam.querySelector('.hsv-chip-dau[data-t="6"]')).not.toBeNull())
    expect(chu(tam.querySelector('.hsv-chip-dau[data-t="6"]'))).toBe('Cố tình treo máy · 1 ngày trong 7 ngày')
    expect(chu(tam.querySelector('#gvv2-hs-phu'))).toMatch(/^SBD 11010 · Lớp .+ · 7 ngày gần nhất \(16\/10 – 22\/10\)$/)
    const canh = tam.querySelector('.hsv-canh')!
    expect(chu(canh.querySelector('.hsv-canh-dau'))).toBe('Mức làm 6 · Cố tình treo máy · Thứ Tư 21/10/2026')
    expect([...canh.querySelectorAll('li')].map((li) => chu(li))).toEqual(['14:05 · 6 phút', '14:21 · 8 phút', '14:40 · 7 phút', '15:02 · 11 phút'])
    expect(chu(canh)).toContain('Chỉ thầy thấy mức này.')
    const o = [...tam.querySelectorAll('.hsv-o')].map((li) => chu(li))
    expect(o[4]).toBe('Mức làm 5 Treo máy 2 lượt đúng 1 · sai 1')
    expect(o[5]).toBe('Mức làm 6 Cố tình treo máy 4 lượt đúng 1 · sai 3')
    const ba = [...tam.querySelectorAll('.hsv-ba p')].map((p) => chu(p))
    expect(ba).toHaveLength(3)
    expect(ba[2]).toMatch(/^4\/\d+ lượt sai sau khi máy để treo \(Mức làm 5–6\)$/)
    // thanh 6 mức: đoạn 5 sọc, đoạn 6 đặc — có số trên từng đoạn
    expect([...tam.querySelectorAll('.hsv-thanh i[data-t]')].map((i) => [i.getAttribute('data-t'), chu(i)])).toEqual([['5', '2'], ['6', '4']])
    // Làm bài 7 ngày: giây trung bình không tính lượt treo
    expect(chu(tam.querySelector('.hsv-so'))).toContain('không tính 6 lượt treo máy')
    // Theo ngày: 21/10 tên ngày hồng (Mức 6); ngày có lượt cũ đánh dấu *
    const ngay = [...tam.querySelectorAll('.hsv-ngay li')]
    expect(ngay).toHaveLength(7)
    expect(ngay[5]!.hasAttribute('data-co-tinh')).toBe(true)
    expect(chu(ngay[4]!.querySelector('.hsv-ngay-ten'))).toBe('Thứ Ba 20/10 *')
  })

  it('"Xem 4 lượt này" ⇒ lọc Treo máy đúng ngày; dòng treo thay thước giây bằng số phút; lượt cũ có nhãn "Chưa đo treo máy"', async () => {
    const tam = await mo('thay')
    const c7 = dongCua(tam, 'Câu 7 · Điện phân')[0]!
    expect(chu(c7.querySelector('.hslc-muc-luot'))).toBe('Mức làm 5 Treo máy Em không ở với câu 7 phút 14 giây (không chạm màn hoặc rời app).')
    expect(c7.querySelector('.hslc-thuoc-m')).toBeNull()
    expect(c7.querySelector('.hsv-phut-thanh i')).not.toBeNull()
    const c21 = dongCua(tam, 'Câu 21 · Điện phân dung dịch')[0]!
    expect(chu(c21.querySelector('.hsv-phut'))).toBe('Cùng ngày có 4 lượt treo máy. Em không ở với câu 11 phút (không chạm màn hoặc rời app).')
    expect(c21.getAttribute('data-t')).toBe('6')
    const c18 = dongCua(tam, 'Câu 18 · Ăn mòn kim loại')[0]!
    expect(chu(c18.querySelector('.hsv-chua-treo'))).toBe('Chưa đo treo máy')
    expect(dongCua(tam, 'Câu 16 · Ăn mòn kim loại')[0]!.querySelector('.hsv-chua-treo')).toBeNull() // lượt đã đo treo, không treo
    expect([...tam.querySelectorAll('.hsv-loc [role="tab"]')].map((t) => chu(t))).toEqual(['Tất cả · 16', 'Lượt sai · 9', 'Treo máy · 6', 'Chưa có số đo · 1'])
    fireEvent.click(within(tam).getByRole('button', { name: 'Xem 4 lượt này' }))
    expect(within(tam).getByRole('tab', { name: /^Treo máy/ }).getAttribute('aria-selected')).toBe('true')
    expect(tam.querySelectorAll('.hslc-lan')).toHaveLength(4)
    expect(tam.textContent).toContain('Đang hiện 4/4 lượt treo máy ngày 21/10')
    fireEvent.click(within(tam).getByRole('tab', { name: /^Treo máy/ }))
    expect(tam.querySelectorAll('.hslc-lan')).toHaveLength(6)
  })

  it('lượt cũ (máy em chưa có đồng hồ treo): ô Mức 5–6 nét đứt "Chưa đo treo máy", câu lý do, không thẻ bằng chứng, không lọc Treo máy', async () => {
    const tam = await mo('thay', { cu: true })
    expect(tam.querySelector('.hsv-canh')).toBeNull()
    expect(tam.querySelector('.hsv-chip-dau[data-t="6"]')).toBeNull()
    expect([...tam.querySelectorAll('.hsv-o[data-chua]')].map((li) => chu(li))).toEqual(['Mức làm 5 Treo máy Chưa đo treo máy', 'Mức làm 6 Cố tình treo máy Chưa đo treo máy'])
    expect(chu(tam.querySelector('.hslc-cl'))).toContain('chưa xếp được Mức làm 5–6 (không đoán)')
    expect(within(tam).queryByRole('tab', { name: /^Treo máy/ })).toBeNull()
  })
})

describe('học sinh: trạng thái rỗng có việc làm tiếp', () => {
  it('sổ rỗng ⇒ "Mở Bài tập về nhà" gọi đường của cổng học sinh; thầy / phụ huynh không có nút dù truyền đường', async () => {
    const rong = { ...lichSu6MucGia(SBD, TD.em.hoTen, 'hoc-sinh'), lan: [], cauSai: [], mucLam: undefined, mucLam6: undefined, tong: { soLuot: 0, soDung: 0, soSai: 0, soBoTrong: 0, soCau: 0, soCauSai: 0, giayTb: null, tongGiay: 0 } }
    for (const cheDo of ['hoc-sinh', 'thay', 'phu-huynh'] as const) {
      const onMoBaiTap = vi.fn()
      const nguon: NguonHoSo = { hoSoThaiDo: async () => ({ ok: true, du: TD }), lichSu: async () => ({ ok: true, du: rong }) }
      render(<HoSoLamCauEm em={{ sbd: SBD, ten: TD.em.hoTen, khoi: '12' }} onDong={() => {}} nguon={nguon} cheDo={cheDo} onMoBaiTap={onMoBaiTap} />)
      const tam = await screen.findByRole('dialog')
      await choTamXong(tam)
      const nut = within(tam).queryByRole('button', { name: 'Mở Bài tập về nhà' })
      if (cheDo === 'hoc-sinh') {
        fireEvent.click(nut!)
        expect(onMoBaiTap).toHaveBeenCalledTimes(1)
      } else expect(nut).toBeNull()
      cleanup()
    }
  })
})

describe('bàn phím: ngăn gập nằm trong vòng Tab của tấm', () => {
  it('học sinh (không có nút chân tấm): Tab từ ngăn gập cuối về nút Đóng; Shift+Tab từ Đóng tới ngăn gập cuối', async () => {
    const tam = await mo('hoc-sinh')
    const gap = [...tam.querySelectorAll<HTMLElement>('.hsv-gap summary')]
    expect(gap.length).toBeGreaterThan(0)
    const cuoi = gap[gap.length - 1]!
    const dong = within(tam).getByRole('button', { name: 'Đóng' })
    dong.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(cuoi)
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(dong)
  })
})

describe('học sinh / phụ huynh: không bao giờ thấy Mức 6', () => {
  const sach = (tam: HTMLElement) => expect(tam.outerHTML).not.toMatch(/Cố tình|Mức làm 6|co_tinh|data-t="6"/)

  // 26/10 (thầy: Mức làm Bấm vội / Treo máy… CHỈ thầy + phụ huynh xem): học sinh KHÔNG còn Mức làm, «máy để treo», lọc treo — kể cả khi dữ liệu lỡ có.
  it('học sinh: không Mức làm, không «treo» (kể cả lượt đúng); điểm nhấn số lượt; lọc chỉ Tất cả · Lượt sai; lượt vẫn có kết quả + số giây', async () => {
    const tam = await mo('hoc-sinh')
    sach(tam)
    expect(chu(tam.querySelector('.hsv-nhan-so'))).toMatch(/^\d+ lượt làm câu · đúng \d+ lượt$/)
    expect(tam.querySelector('.hslc-chip-m, .hsv-phut, .hsv-nhe, .hslc-cl-em, [data-treo], [data-t]')).toBeNull()
    expect([...tam.querySelectorAll('.hsv-loc [role="tab"]')].map((t) => chu(t))).toEqual(['Tất cả · 16', 'Lượt sai · 9'])
    expect(tam.textContent).not.toMatch(/treo|Mức làm|vội/i)
    expect(chu(dongCua(tam, 'Câu 8 · Điện phân dung dịch')[0]!.querySelector('.gvv2-hs-kq'))).toBe('Đúng')
  })

  it('phụ huynh: lượt treo chỉ chip "Mức làm 5 · Máy để treo", KHÔNG số phút; một dòng tổng; "Xem mọi lượt của con" giữ đúng luật', async () => {
    const tam = await mo('phu-huynh')
    sach(tam)
    expect(tam.outerHTML).not.toMatch(/giayTreo/)
    expect(chu(tam.querySelector('.hsv-nhe'))).toBe('Máy để treo: 6 lượt trong 7 ngày.')
    // lượt treo ĐÃ đo — không bị đếm thành "chưa có số đo" (chỉ còn lượt bỏ trống của ca thi cũ)
    expect([...tam.querySelectorAll('.hslc-cl .hsv-ghi')].map((p) => chu(p))).toEqual(['1 lượt sai chưa có số đo (chưa có số giây đáng tin để xếp).'])
    const gan = [...tam.querySelectorAll('.hslc-lan')]
    expect(gan).toHaveLength(3)
    const treo = gan.filter((l) => l.hasAttribute('data-treo'))
    expect(treo.length).toBeGreaterThan(0)
    for (const l of treo) {
      expect(chu(l.querySelector('.hslc-muc-luot'))).toBe('Mức làm 5 Máy để treo')
      expect(chu(l)).not.toMatch(/phút/)
    }
    fireEvent.click(within(tam).getByRole('button', { name: 'Xem mọi lượt của con' }))
    expect(within(tam).getByRole('heading', { name: /^Từng lượt/ })).toBeTruthy()
    const moi = [...tam.querySelectorAll('.hslc-lan[data-treo]')]
    expect(moi).toHaveLength(6)
    for (const l of moi) expect(chu(l)).not.toMatch(/phút/)
    sach(tam)
  })
})
