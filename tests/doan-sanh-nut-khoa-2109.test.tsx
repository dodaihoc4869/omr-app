// SẢNH ĐOÀN HỘ TỐNG · P0 thầy báo 19:5x "KHÔNG TẠO ĐƯỢC PHÒNG": nút "Mở đoàn mới" khoá mà CẠNH NÚT không nói lý do (lý do chỉ ở thẻ trên cùng); lỗi của `doan-mo {cheDo:'phong'}` cũng chỉ hiện ở thẻ trên
// ⇒ em đang ở cuối màn bấm xong không thấy gì. Sửa: nút khoá ⇒ dòng lý do NGAY DƯỚI nút (hết 200 câu / hết vé / đang mở); lỗi hiện cạnh nút vừa bấm + cuộn tới.
// Luật máy chủ KHÔNG đổi: `doan-mo` (cả cheDo phong) qua cổng vé `quaCongVe` (Code 3 xác nhận) ⇒ hết vé thì khoá cùng luật với nút LÊN ĐƯỜNG.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, within } from '@testing-library/react'
import DoanSanh from '../src/game/than-thu-v2/DoanSanh'
import type { SanhXem } from '../src/game/than-thu-v2/doan-kieu'

const sanh = (sua: Partial<SanhXem> = {}): SanhXem => ({
  lop: '12 - Tinh Hoa', tenDoan: 'Đoàn Hộ Tống', mua: { so: 3, conNgay: 12 }, ve: 2, mienPhiHomNay: false,
  chuoi: { ngay: 0, daDiHomNay: false, mocKe: 7, conNgay: 7 },
  doanLop: { lop: '12 - Tinh Hoa', tram: 5, tongTram: 12, changThang: 3, changMoiTram: 4, conChangToiTramKe: 2, mocKe: 8, tenMocKe: 'Cổng Ester', conTramToiMoc: 3, gopSucHomNay: 11, siSo: 30 },
  trumLop: { dangMo: false, chuNhat: '2026-09-27', moSauMs: 6 * 24 * 3_600_000, conMs: 0, daGop: 0, mucTieu: 300, daHa: false },
  quaMoi: [],
  ...sua,
})
const goiY = (hetLuot = false, them: { daDung?: number; tran?: number } = {}) => ({ tong: 9, nhom: [{ ten: 'Cấu tạo', so: 9 }], hetLuot, ...them })
const cb = () => ({ onLenDuong: vi.fn(), onMoPhong: vi.fn(), onVaoPhong: vi.fn(), onBatDau: vi.fn(), onRoi: vi.fn(), onDong: vi.fn() })
type P = Parameters<typeof DoanSanh>[0]
const goc = (sua: Partial<P> = {}): P => ({ pet: 0, cap: 12, tenDoan: 'Đoàn Hộ Tống', goiY: goiY(), sanh: sanh(), anThach: null, banDongHanh: null, phong: null, ban: false, loi: '', ...cb(), ...sua })

const CHU_HET_VE = 'Hết vé? Làm xong nhiệm vụ hôm nay để nhận 2 vé · xong một chặng Bài tập về nhà đúng kế hoạch nhận 1 vé.'
// Máy chủ CŨ chưa gửi trần ⇒ câu KHÔNG số (không viết cứng 200/60: thầy đã đổi trần 200 → 60)
const CHU_HET_LUOT = 'Em đã đi đủ số câu Đoàn Hộ Tống của hôm nay — mai mình đi tiếp nhé.'
const CHU_HET_LUOT_SO = 'Hôm nay em đã đi 60/60 câu Đoàn Hộ Tống — mai mình đi tiếp nhé.'
const LOI_HET_VE = 'Hôm nay em đã đi chặng miễn phí rồi và em chưa có vé. Vé chỉ kiếm bằng học.'

const nutMo = (c: HTMLElement) => within(c).getByRole('button', { name: /Mở đoàn mới/ }) as HTMLButtonElement
const nutDi = (c: HTMLElement) => c.querySelector('.dh-chang .dh-nut-vang') as HTMLButtonElement
const theDiCung = (c: HTMLElement) => c.querySelector('section[aria-label="Đi cùng bạn"]') as HTMLElement
const theChang = (c: HTMLElement) => c.querySelector('section[aria-label="Chuyến hôm nay"]') as HTMLElement
const lyDo = (c: HTMLElement) => theDiCung(c).querySelector('.dh-ly-do')
const canhBao = (root: HTMLElement) => [...root.querySelectorAll('[role="alert"]')].map((e) => e.textContent)

let cuon: ReturnType<typeof vi.fn>
beforeEach(() => {
  cuon = vi.fn()
  Element.prototype.scrollIntoView = cuon as unknown as typeof Element.prototype.scrollIntoView
})
afterEach(cleanup)

describe('nút "Mở đoàn mới" khoá ⇒ dòng lý do NGAY DƯỚI nút', () => {
  it('bình thường (còn vé, chưa hết 200 câu): nút bấm được, KHÔNG có dòng lý do', () => {
    const { container } = render(<DoanSanh {...goc()} />)
    expect(nutMo(container).disabled).toBe(false)
    expect(lyDo(container)).toBeNull()
  })
  it('hết lượt câu Đoàn: khoá + lý do "đã đi đủ số câu Đoàn Hộ Tống … mai mình đi tiếp"; dòng lý do đứng SÁT dưới nút; nút LÊN ĐƯỜNG cũng nói đúng lý do (không nói chuyện vé)', () => {
    const { container } = render(<DoanSanh {...goc({ goiY: goiY(true) })} />)
    expect(nutMo(container).disabled).toBe(true)
    expect(lyDo(container)!.textContent).toBe(CHU_HET_LUOT)
    expect(nutMo(container).nextElementSibling).toBe(lyDo(container)) // ngay dưới nút
    expect(nutDi(container).disabled).toBe(true)
    expect(theChang(container).querySelector('small')!.textContent).toBe(CHU_HET_LUOT)
  })
  it('hết vé (không còn chặng miễn phí, ve 0): khoá cùng luật với LÊN ĐƯỜNG + lý do "Hết vé? … nhận 2 vé"', () => {
    const { container } = render(<DoanSanh {...goc({ sanh: sanh({ ve: 0, mienPhiHomNay: false }) })} />)
    expect(nutMo(container).disabled).toBe(true)
    expect(nutDi(container).disabled).toBe(true)
    expect(lyDo(container)!.textContent).toBe(CHU_HET_VE)
    expect(nutMo(container).nextElementSibling).toBe(lyDo(container))
  })
  it('còn chặng MIỄN PHÍ hôm nay dù ve 0 ⇒ KHÔNG khoá; còn vé ⇒ không khoá; máy chủ chưa trả sảnh (null) ⇒ không khoá theo vé', () => {
    expect(nutMo(render(<DoanSanh {...goc({ sanh: sanh({ ve: 0, mienPhiHomNay: true }) })} />).container).disabled).toBe(false)
    cleanup()
    expect(nutMo(render(<DoanSanh {...goc({ sanh: sanh({ ve: 3 }) })} />).container).disabled).toBe(false)
    cleanup()
    const { container } = render(<DoanSanh {...goc({ sanh: null })} />)
    expect(nutMo(container).disabled).toBe(false)
    expect(lyDo(container)).toBeNull()
  })
  it('đang mở đường (ban): khoá + "Đang xử lý…"', () => {
    const { container } = render(<DoanSanh {...goc({ ban: true })} />)
    expect(nutMo(container).disabled).toBe(true)
    expect(lyDo(container)!.textContent).toMatch(/^Đang xử lý/)
  })
  it('thứ tự lý do: hết lượt câu thắng hết vé thắng đang xử lý', () => {
    const { container } = render(<DoanSanh {...goc({ goiY: goiY(true), sanh: sanh({ ve: 0 }), ban: true })} />)
    expect(lyDo(container)!.textContent).toBe(CHU_HET_LUOT)
    cleanup()
    const c2 = render(<DoanSanh {...goc({ sanh: sanh({ ve: 0 }), ban: true })} />).container
    expect(lyDo(c2)!.textContent).toBe(CHU_HET_VE)
  })
  it('máy chủ NÓI trần (tranNgay 60, dailyUsed 60): lý do ghi "60/60 câu Đoàn Hộ Tống" ở cả hai nút; dailyUsed hơn trần (đếm lượt) vẫn ghi 60/60', () => {
    for (const daDung of [60, 64]) {
      const { container } = render(<DoanSanh {...goc({ goiY: goiY(true, { daDung, tran: 60 }) })} />)
      expect(lyDo(container)!.textContent).toBe(CHU_HET_LUOT_SO)
      expect(theChang(container).querySelector('small')!.textContent).toBe(CHU_HET_LUOT_SO)
      expect(theChang(container).querySelector('p')!.textContent).toBe(CHU_HET_LUOT_SO)
      cleanup()
    }
  })
  it('trần có mà em CHƯA chạm (dailyUsed 58/60 nhưng máy chủ vẫn báo hết lượt) hoặc thiếu một trong hai số ⇒ câu KHÔNG số (không nói số sai)', () => {
    for (const them of [{ daDung: 58, tran: 60 }, { tran: 60 }, { daDung: 60 }, { daDung: 60, tran: 0 }]) {
      const { container } = render(<DoanSanh {...goc({ goiY: goiY(true, them) })} />)
      expect(lyDo(container)!.textContent, JSON.stringify(them)).toBe(CHU_HET_LUOT)
      cleanup()
    }
  })
  it('KHÔNG còn chữ "200 câu" cứng trong sảnh Đoàn', () => {
    for (const hetLuot of [true, false]) {
      const { container } = render(<DoanSanh {...goc({ goiY: goiY(hetLuot) })} />)
      expect(container.textContent).not.toMatch(/200 câu/)
      cleanup()
    }
  })
  it('dòng lý do là ghi chú cho trợ năng (role=note), không phải cảnh báo', () => {
    const { container } = render(<DoanSanh {...goc({ goiY: goiY(true) })} />)
    expect(lyDo(container)!.getAttribute('role')).toBe('note')
  })
})

describe('chặng hôm nay (doan-sanh.changHomNay): chip "Đã đi N/6 chặng hôm nay"; đủ chặng ⇒ khoá cả hai nút + lý do', () => {
  const CHU_HET_CHANG = 'Hôm nay em đã đi đủ 6 chặng — mai mình đi tiếp nhé.'
  it('có changHomNay ⇒ chip số chặng (số do máy chủ nói); không có ⇒ không chip', () => {
    const { container } = render(<DoanSanh {...goc({ chang: { daDi: 2, toiDa: 6 } })} />)
    expect(container.querySelector('[data-vung="chang-hom-nay"]')!.textContent).toBe('Đã đi 2/6 chặng hôm nay')
    cleanup()
    expect(render(<DoanSanh {...goc()} />).container.querySelector('[data-vung="chang-hom-nay"]')).toBeNull()
    cleanup()
    // chip hiện cả khi sảnh chưa có vé/chuỗi (sanh null): vẫn là số máy chủ nói
    expect(render(<DoanSanh {...goc({ sanh: null, chang: { daDi: 0, toiDa: 6 } })} />).container.querySelector('[data-vung="chang-hom-nay"]')!.textContent).toBe('Đã đi 0/6 chặng hôm nay')
  })
  it('chưa đủ chặng ⇒ KHÔNG khoá (còn 1 chặng): hai nút bấm được', () => {
    const { container } = render(<DoanSanh {...goc({ chang: { daDi: 5, toiDa: 6 } })} />)
    expect(nutMo(container).disabled).toBe(false)
    expect(nutDi(container).disabled).toBe(false)
    expect(lyDo(container)).toBeNull()
  })
  it('ĐỦ chặng (6/6): khoá LÊN ĐƯỜNG + Mở đoàn mới; nhãn "ĐÃ ĐI ĐỦ CHẶNG HÔM NAY"; lý do ngay dưới cả hai nút', () => {
    const { container } = render(<DoanSanh {...goc({ chang: { daDi: 6, toiDa: 6 } })} />)
    expect(nutMo(container).disabled).toBe(true)
    expect(nutDi(container).disabled).toBe(true)
    expect(nutDi(container).textContent).toContain('ĐÃ ĐI ĐỦ CHẶNG HÔM NAY')
    expect(lyDo(container)!.textContent).toBe(CHU_HET_CHANG)
    expect(nutMo(container).nextElementSibling).toBe(lyDo(container))
    expect(theChang(container).querySelector('small')!.textContent).toBe(CHU_HET_CHANG)
  })
  it('trần chặng do máy chủ nói (toiDa 4 ⇒ "đủ 4 chặng", không cứng 6)', () => {
    const { container } = render(<DoanSanh {...goc({ chang: { daDi: 4, toiDa: 4 } })} />)
    expect(lyDo(container)!.textContent).toContain('đủ 4 chặng')
  })
  it('thứ tự lý do: hết lượt câu > đủ chặng > hết vé > đang xử lý', () => {
    const p = { chang: { daDi: 6, toiDa: 6 }, sanh: sanh({ ve: 0 }), ban: true }
    expect(lyDo(render(<DoanSanh {...goc({ ...p, goiY: goiY(true) })} />).container)!.textContent).toBe(CHU_HET_LUOT)
    cleanup()
    expect(lyDo(render(<DoanSanh {...goc(p)} />).container)!.textContent).toBe(CHU_HET_CHANG)
    cleanup()
    expect(lyDo(render(<DoanSanh {...goc({ sanh: sanh({ ve: 0 }), ban: true })} />).container)!.textContent).toBe(CHU_HET_VE)
  })
})

describe('lỗi của máy chủ hiện CẠNH nút vừa bấm', () => {
  it('bấm "Mở đoàn mới" (gọi onMoPhong) rồi máy chủ trả lỗi ⇒ cảnh báo nằm TRONG thẻ "Đi cùng bạn", ngay sau nút, KHÔNG ở thẻ trên; cuộn tới cảnh báo', () => {
    const p = goc()
    const { container, rerender } = render(<DoanSanh {...p} />)
    fireEvent.click(nutMo(container))
    expect(p.onMoPhong).toHaveBeenCalledTimes(1)
    rerender(<DoanSanh {...p} loi={LOI_HET_VE} />)
    expect(canhBao(container)).toEqual([LOI_HET_VE]) // một cảnh báo, không lặp ở thẻ trên
    expect(theDiCung(container).querySelector('[role="alert"]')).not.toBeNull()
    expect(theChang(container).querySelector('[role="alert"]')).toBeNull()
    expect(cuon).toHaveBeenCalled()
    expect(cuon.mock.contexts.some((el) => (el as Element).getAttribute('role') === 'alert')).toBe(true)
  })
  it('bấm LÊN ĐƯỜNG rồi lỗi ⇒ cảnh báo ở thẻ "Chuyến hôm nay" (như cũ), không cuộn', () => {
    const p = goc()
    const { container, rerender } = render(<DoanSanh {...p} />)
    fireEvent.click(nutDi(container))
    expect(p.onLenDuong).toHaveBeenCalledTimes(1)
    rerender(<DoanSanh {...p} loi="Lỗi mở đường" />)
    expect(theChang(container).querySelector('[role="alert"]')!.textContent).toBe('Lỗi mở đường')
    expect(theDiCung(container).querySelector('[role="alert"]')).toBeNull()
    expect(cuon).not.toHaveBeenCalled()
  })
  it('nhập mã + "Vào đoàn" rồi lỗi (mã sai) ⇒ cảnh báo ngay dưới ô nhập mã; onVaoPhong nhận mã viết HOA', () => {
    const p = goc()
    const { container, rerender } = render(<DoanSanh {...p} />)
    const o = container.querySelector('.dh-ma-doan input') as HTMLInputElement
    fireEvent.change(o, { target: { value: ' dh3f9a ' } })
    fireEvent.submit(container.querySelector('form.dh-ma-doan')!)
    expect(p.onVaoPhong).toHaveBeenCalledWith('DH3F9A')
    rerender(<DoanSanh {...p} loi="Không tìm thấy đoàn này" />)
    const form = container.querySelector('form.dh-ma-doan')!
    expect(form.nextElementSibling!.getAttribute('role')).toBe('alert')
    expect(canhBao(container)).toEqual(['Không tìm thấy đoàn này'])
    expect(theChang(container).querySelector('[role="alert"]')).toBeNull()
    expect(cuon).toHaveBeenCalled()
  })
  it('lỗi tới khi chưa bấm nút nào (vd. tải sảnh hỏng) ⇒ ở thẻ trên như cũ, không cuộn', () => {
    const { container } = render(<DoanSanh {...goc({ loi: 'Không tải được sảnh' })} />)
    expect(theChang(container).querySelector('[role="alert"]')!.textContent).toBe('Không tải được sảnh')
    expect(canhBao(container)).toHaveLength(1)
    expect(cuon).not.toHaveBeenCalled()
  })
  it('bấm "Mở đoàn mới" lúc nút đang khoá (bấm hụt) KHÔNG gọi máy chủ', () => {
    const p = goc({ goiY: goiY(true) })
    const { container } = render(<DoanSanh {...p} />)
    fireEvent.click(nutMo(container))
    expect(p.onMoPhong).not.toHaveBeenCalled()
  })
})

describe('ô mã đoàn: nhãn ngoài ô, placeholder ngắn (máy thật 360 px cắt "Nhập mã đoàn của bạn")', () => {
  it('nhãn "Mã đoàn của bạn" gắn với ô bằng for/id (bấm nhãn = chạm ô); placeholder "Nhập mã"', () => {
    const { container } = render(<DoanSanh {...goc()} />)
    const nhan = container.querySelector('label.dh-nhan-o') as HTMLLabelElement
    expect(nhan.textContent).toBe('Mã đoàn của bạn')
    const o = container.querySelector('.dh-ma-doan input') as HTMLInputElement
    expect(nhan.htmlFor).toBe(o.id)
    expect(o.placeholder).toBe('Nhập mã')
  })
})

describe('hen(): "còn N ngày" không kèm vế 0', () => {
  const trum = (ms: number) => render(<DoanSanh {...goc({ sanh: sanh({ trumLop: { dangMo: false, chuNhat: '', moSauMs: ms, conMs: 0, daGop: 0, mucTieu: 300, daHa: false } }) })} />).container.querySelector('[aria-label="Trùm lớp"] p')!.textContent!.split(' · ').pop()! // vế cuối = chuỗi hen()
  it('6 ngày tròn ⇒ "còn 6 ngày" (không "0 giờ"); 6 ngày 3 giờ ⇒ giữ; dưới 1 ngày ⇒ "còn 5 giờ" (không "0 phút"); dưới 1 giờ ⇒ phút', () => {
    expect(trum(6 * 24 * 3_600_000)).toContain('còn 6 ngày')
    expect(trum(6 * 24 * 3_600_000)).not.toMatch(/giờ/)
    cleanup()
    expect(trum((6 * 24 + 3) * 3_600_000)).toContain('còn 6 ngày 3 giờ')
    cleanup()
    expect(trum(5 * 3_600_000)).toContain('còn 5 giờ')
    expect(trum(5 * 3_600_000)).not.toMatch(/phút/)
    cleanup()
    expect(trum(5 * 3_600_000 + 20 * 60_000)).toContain('còn 5 giờ 20 phút')
    cleanup()
    expect(trum(12 * 60_000)).toContain('còn 12 phút')
  })
})
