// @vitest-environment jsdom
// LIVE BẢNG — HAI KHUNG ĐỘC LẬP (src/components/live/KhungDocLap.tsx; thầy 11/11: «Làm chuẩn cái này luôn nhé. Tối ưu cho hs nhất có thể»). Phần dùng chung của bảng
// live máy em và trình phát «Xem lại Live». Canvas giả. Khoá:
//   · vừa vào (bảng trống) ⇒ ưu tiên GIẤY (chữ đề to); thầy viết trên bảng ĐỦ 2 giây ⇒ khung bảng nở; thầy quay lại giấy 2 giây ⇒ giấy nở lại;
//   · vào live lúc bảng đã có nét ⇒ ưu tiên bảng ngay;
//   · máy yếu (không tự ưu tiên) ⇒ chia cố định ở mốc giữa;
//   · chạm hai lần vào khung ⇒ phóng kín / về lại; nơi dùng đã xử lí cú chạm (đang mở khay) ⇒ không tính;
//   · em vừa chạm giấy mà thầy trỏ ở phần khuất ⇒ mũi tên «Thầy đang viết ở dưới», không giật khung; hết 4 giây ⇒ khung tự trôi, mũi tên mất;
//   · em vuốt bảng ⇒ hiện «Về chỗ thầy đang viết»; bấm ⇒ về;
//   · em kéo vạch chia ⇒ nhớ trên máy + báo nơi dùng (hàng «Tự phóng theo thầy» tắt); bật lại ⇒ quên;
//   · trình phát (`lop="xp"`): cùng bố cục, lớp CSS «xp-…».
import { act, fireEvent, render } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VUNG_MAC_DINH, khungChieu, maTrang } from '../src/components/live/bo-cuc'
import { KHOA_CHIA, NHUONG_MS, TRE_UU_TIEN_MS, mocChia } from '../src/components/live/bo-cuc-doc-lap'
import KhungDocLap, { type TayKhungDL } from '../src/components/live/KhungDocLap'

const KHONG = { trai: 0, phai: 0, duoi: 0, tren: 0 }, KC = khungChieu(VUNG_MAC_DINH, 16 / 9), TL = 17.67 / 489
const TRANG = maTrang('1', VUNG_MAC_DINH, false)
const MOC = mocChia(844, 390, KHONG, KC, TL), W = 844 - 8 - 5
// 13/11 (thầy «bảng đen xanh trên màn thầy với hs phải đồng bộ tỷ lệ … hiển thị đầy đủ»): ô bảng co VỪA TRỌN khung ⇒ khung bảng không rộng hơn mức ô bảng
// cần ở chiều cao khung (`TRAN_BANG`); phần dư trả cho giấy. `rG(p)` = bề ngang khung giấy khi vạch chia đòi phần `p`.
const TRAN_BANG = Math.ceil((KC.bang.w * (390 - 8 - 26)) / KC.bang.h) // 26 = chỗ của dải thẻ tên, luôn trừ sẵn
const rG = (p: number, rongChia = W, tran = TRAN_BANG): number => rongChia - Math.min(rongChia - Math.round(rongChia * p), tran)
const rong = (k: string): number => parseFloat(document.querySelector<HTMLElement>(k)!.style.width)
beforeEach(() => {
  const g = new Proxy({}, { get: (_, k) => (k === 'canvas' ? null : () => undefined), set: () => true })
  ;(HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = () => g
  localStorage.clear()
  document.documentElement.classList.remove('may-yeu')
})
afterEach(() => { vi.restoreAllMocks() })

function dung(them: Partial<Parameters<typeof KhungDocLap>[0]> = {}) {
  const tay = createRef<TayKhungDL>(), khiPhong = vi.fn(), khiTay = vi.fn()
  const r = render(<KhungDocLap ref={tay} lop="lv" layHinh={() => ({ w: 844, h: 390, xoay: false, at: KHONG })} layTrang={() => ({ trang: TRANG, tiLe: 16 / 9 })} netGiay tiLeChu={TL} tuUuTien dong={false}
    giay={({ rong: w }) => <p data-rong={Math.round(w)}>Đề</p>} bangTrong={<p>Bảng đen</p>} khiPhong={khiPhong} khiTay={khiTay} {...them} />)
  act(() => { tay.current!.ap({ loai: 'trang', trang: TRANG, tiLe: 16 / 9, net: [] }) })
  return { tay: tay.current!, khiPhong, khiTay, r }
}
/** Chạy vòng khung hình giả từ `t0` trong `ms` (60 khung / giây) với bút của thầy ở `but`. */
function chay(tay: TayKhungDL, t0: number, ms: number, but: { x: number; y: number; cham: boolean; net?: string } | null): number {
  let t = t0
  act(() => { for (; t <= t0 + ms; t += 1000 / 60) tay.khung(t, but?.cham && but.net ? [{ id: but.net, x: but.x, y: but.y }] : [], but) })
  return t
}
const BUT_BANG = { x: 0.8, y: 0.3, cham: true, net: 'b_1' }, BUT_GIAY = { x: 0.3, y: 0.2, cham: true, net: 'n1' }

describe('tự ưu tiên khung theo thầy', () => {
  it('vừa vào, bảng trống ⇒ ưu tiên GIẤY; thầy viết trên bảng: chưa đủ 2 giây chưa đổi, đủ 2 giây ⇒ bảng nở; quay lại giấy 2 giây ⇒ giấy nở lại', () => {
    const { tay } = dung()
    expect(rong('.lv-giay')).toBe(rG(MOC.giay))
    expect(rong('.lv-giay') + rong('.lv-bang')).toBe(W)
    let t = chay(tay, 1000, TRE_UU_TIEN_MS - 100, BUT_BANG)
    expect(rong('.lv-giay')).toBe(rG(MOC.giay))
    t = chay(tay, t, 300, BUT_BANG)
    expect(rong('.lv-giay')).toBe(rG(MOC.bang))
    expect(rong('.lv-bang')).toBeLessThanOrEqual(TRAN_BANG) // 13/11: bảng thấy TRỌN như bảng thầy (không còn nở quá mức phải trôi theo bút)
    // thầy nhấp sang giấy 1 giây rồi về bảng ⇒ không đổi
    t = chay(tay, t, 1000, BUT_GIAY); t = chay(tay, t, 1500, BUT_BANG)
    expect(rong('.lv-giay')).toBe(rG(MOC.bang))
    t = chay(tay, t, TRE_UU_TIEN_MS + 100, BUT_GIAY)
    expect(rong('.lv-giay')).toBe(rG(MOC.giay))
    // bút chỉ lơ lửng trên bảng (không chạm) ⇒ không tính là đang viết
    chay(tay, t, 3000, { x: 0.8, y: 0.3, cham: false })
    expect(rong('.lv-giay')).toBe(rG(MOC.giay))
  })
  it('vào live lúc bảng ĐÃ có nét ⇒ ưu tiên bảng ngay (không chờ 2 giây)', () => {
    const { tay } = dung()
    act(() => { tay.ap({ loai: 'trang', trang: TRANG, tiLe: 16 / 9, net: [{ id: 'b_9', cong: 'but', mau: 'rgb(244,239,228)', co: 1.7, diem: [[0.8, 0.3, 0.4, 0], [0.82, 0.3, 0.4, 5]] }] }) })
    expect(rong('.lv-giay')).toBe(rG(MOC.bang))
  })
  it('máy yếu (không tự ưu tiên) ⇒ chia cố định ở mốc GIỮA, thầy viết ở đâu cũng không đổi', () => {
    const { tay } = dung({ tuUuTien: false })
    expect(rong('.lv-giay')).toBe(rG(MOC.giua))
    chay(tay, 1000, 3000, BUT_BANG)
    expect(rong('.lv-giay')).toBe(rG(MOC.giua))
  })
  it('tấm giấy = ô giấy của thầy đã co theo bề ngang khung giấy; nơi dùng nhận đúng khổ tấm giấy để dựng chữ', () => {
    dung()
    const tam = document.querySelector<HTMLElement>('.lv-kg-tam')!
    expect(parseFloat(tam.style.width)).toBeCloseTo(rong('.lv-giay'), 0)
    expect(parseFloat(tam.style.height)).toBeGreaterThan(382) // cao hơn khung ⇒ cuộn
    expect(document.querySelector<HTMLElement>('.lv-kg-cuon')!.style.overflowY).toBe('auto')
    expect(Number(document.querySelector<HTMLElement>('[data-rong]')!.dataset.rong)).toBe(Math.round(parseFloat(tam.style.width)))
    expect(document.querySelector('.lv-giay canvas')).not.toBeNull() // lớp nét đã chốt của giấy cuộn cùng chữ
    expect(document.querySelector('.lv-bang .lv-cuon')).not.toBeNull() // khung cuộn của bảng nằm trong khung bảng
  })
})

describe('em điều khiển', () => {
  it('chạm hai lần vào giấy ⇒ giấy phủ kín, bảng ra ngoài màn; hai lần nữa ⇒ về hai khung. Nơi dùng đã xử lí cú chạm ⇒ không tính', () => {
    const { khiPhong } = dung()
    const cuon = document.querySelector('.lv-kg-cuon')!
    const cham = () => { fireEvent.pointerDown(cuon, { pointerId: 1, clientX: 200, clientY: 100 }); fireEvent.pointerUp(cuon, { pointerId: 1, clientX: 201, clientY: 100 }) }
    // hai cú VUỐT nhanh (ấn rồi bị trình duyệt huỷ để cuộn, hoặc nhả ở chỗ khác) không phải chạm hai lần
    fireEvent.pointerDown(cuon, { pointerId: 1, clientX: 200, clientY: 300 }); fireEvent.pointerCancel(cuon, { pointerId: 1 }); fireEvent.pointerDown(cuon, { pointerId: 1, clientX: 200, clientY: 300 }); fireEvent.pointerUp(cuon, { pointerId: 1, clientX: 200, clientY: 180 })
    expect(khiPhong).not.toHaveBeenCalled()
    cham(); cham()
    expect(khiPhong).toHaveBeenLastCalledWith('giay')
    expect(rong('.lv-giay')).toBe(844 - 8); expect(parseFloat(document.querySelector<HTMLElement>('.lv-bang')!.style.left)).toBeGreaterThan(844)
    expect(document.querySelector('.lv-vach-chia')).toBeNull()
    cham(); cham()
    expect(khiPhong).toHaveBeenLastCalledWith(null); expect(rong('.lv-giay')).toBe(rG(MOC.giay))
  })
  it('đang mở khay (nơi dùng trả true) ⇒ hai cú chạm không phóng khung', () => {
    const { khiPhong } = dung({ khiCham: () => true })
    const cuon = document.querySelector('.lv-kg-cuon')!
    for (let i = 0; i < 2; i++) { fireEvent.pointerDown(cuon, { pointerId: 1, clientX: 200, clientY: 100 }); fireEvent.pointerUp(cuon, { pointerId: 1, clientX: 200, clientY: 100 }) }
    expect(khiPhong).not.toHaveBeenCalled()
  })
  it('chạm hai lần vào bảng ⇒ bảng phủ kín, giấy ra ngoài màn', () => {
    const { khiPhong } = dung()
    const b = document.querySelector('.lv-bang')!
    for (let i = 0; i < 2; i++) { fireEvent.pointerDown(b, { pointerId: 1, clientX: 760, clientY: 200 }); fireEvent.pointerUp(b, { pointerId: 1, clientX: 760, clientY: 200 }) }
    expect(khiPhong).toHaveBeenLastCalledWith('bang')
    expect(rong('.lv-bang')).toBe(844 - 8); expect(parseFloat(document.querySelector<HTMLElement>('.lv-giay')!.style.left)).toBeLessThan(-100)
  })
  it('em vừa chạm giấy, thầy trỏ ở phần khuất phía dưới ⇒ mũi tên «Thầy đang viết ở dưới» (khung không trôi); hết 4 giây ⇒ khung tự trôi, mũi tên mất', () => {
    const { tay } = dung()
    const giay = document.querySelector('.lv-giay')!, cuon = document.querySelector<HTMLElement>('.lv-kg-cuon')!
    expect(giay.querySelector('[data-huong="duoi"]')!.textContent).toBe('Thầy đang viết ở dưới ↓')
    const t0 = performance.now()
    fireEvent.pointerDown(cuon, { pointerId: 1 })
    const duoi = { x: 0.3, y: 0.88, cham: false } // sát đáy ô giấy của thầy
    let t = chay(tay, t0 + 50, 500, duoi)
    expect(giay.getAttribute('data-mui')).toBe('duoi'); expect(cuon.scrollTop).toBe(0)
    t = chay(tay, t0 + NHUONG_MS + 100, 1500, duoi)
    expect(giay.hasAttribute('data-mui')).toBe(false); expect(cuon.scrollTop).toBeGreaterThan(40)
    // bút về đầu giấy ⇒ trôi ngược lên
    chay(tay, t, 1500, { x: 0.3, y: 0.03, cham: false })
    expect(cuon.scrollTop).toBe(0)
  })
  it('bấm mũi tên ⇒ thôi nhường, khung trôi tới chỗ thầy ngay', () => {
    const { tay } = dung()
    const giay = document.querySelector('.lv-giay')!, cuon = document.querySelector<HTMLElement>('.lv-kg-cuon')!
    const t0 = performance.now()
    fireEvent.pointerDown(cuon, { pointerId: 1 })
    chay(tay, t0 + 50, 200, { x: 0.3, y: 0.88, cham: false })
    expect(giay.getAttribute('data-mui')).toBe('duoi')
    fireEvent.click(giay.querySelector('[data-huong="duoi"]')!)
    chay(tay, t0 + 300, 1500, { x: 0.3, y: 0.88, cham: false })
    expect(giay.hasAttribute('data-mui')).toBe(false); expect(cuon.scrollTop).toBeGreaterThan(40)
  })
  it('em vuốt bảng xem lại ⇒ nút «Về chỗ thầy đang viết»; bấm ⇒ về (nút mất)', () => {
    const { tay } = dung()
    act(() => { tay.ap({ loai: 'net-moi', trang: TRANG, net: { id: 'b_2', cong: 'but', mau: 'rgb(244,239,228)', co: 1.7, diem: [[0.8, 1.5, 0.4, 0], [0.82, 1.5, 0.4, 5]] }, xong: true }) })
    let t = chay(tay, 1000, 3000, BUT_BANG)
    const b = document.querySelector<HTMLElement>('.lv-bang')!
    fireEvent.pointerDown(b, { pointerId: 1, clientX: 700, clientY: 100 }); fireEvent.pointerMove(b, { pointerId: 1, clientX: 700, clientY: 160 }); fireEvent.pointerUp(b, { pointerId: 1, clientX: 700, clientY: 160 })
    t = chay(tay, t, 50, null)
    expect(b.hasAttribute('data-tay')).toBe(true); expect(tay.ve()!.cuon().tay).toBe(true)
    expect(b.querySelector('.lv-ve')!.textContent).toBe('Về chỗ thầy đang viết')
    fireEvent.click(b.querySelector('.lv-ve')!)
    chay(tay, t, 50, null)
    expect(b.hasAttribute('data-tay')).toBe(false); expect(tay.ve()!.cuon().tay).toBe(false)
  })
  it('em kéo vạch chia ⇒ theo em, NHỚ trên máy, báo nơi dùng; thầy viết ở đâu cũng không tự đổi nữa; bật lại «tự phóng» ⇒ quên, về tự ưu tiên', () => {
    const { tay, khiTay } = dung()
    expect(khiTay).toHaveBeenLastCalledWith(false)
    const v = document.querySelector<HTMLElement>('.lv-vach-chia')!, x0 = parseFloat(v.style.left) + 15
    fireEvent.pointerDown(v, { pointerId: 1, clientX: x0, clientY: 200 }); fireEvent.pointerMove(v, { pointerId: 1, clientX: x0 - 150, clientY: 200 }); fireEvent.pointerUp(v, { pointerId: 1, clientX: x0 - 150, clientY: 200 })
    expect(khiTay).toHaveBeenLastCalledWith(true)
    const giu = rong('.lv-giay')
    // máy NHỚ phần em đòi; bề ngang thật vẫn theo luật «bảng thấy trọn» (điện thoại ngang: bảng đã ở mức rộng nhất nó cần ⇒ giấy không hẹp thêm)
    const nho = Number(localStorage.getItem(KHOA_CHIA))
    expect(nho).toBeCloseTo((rG(MOC.giay) - 150) / W, 1)
    expect(giu).toBe(rG(nho))
    chay(tay, 1000, 3000, BUT_BANG)
    expect(rong('.lv-giay')).toBe(giu)
    act(() => { tay.boTay() })
    expect(khiTay).toHaveBeenLastCalledWith(false); expect(localStorage.getItem(KHOA_CHIA)).toBeNull()
    expect(rong('.lv-giay')).toBe(rG(MOC.bang)) // thầy đã viết trên bảng quá 2 giây
    // tắt «tự phóng» ⇒ giữ chỗ đang đứng
    act(() => { tay.giuTay() })
    expect(khiTay).toHaveBeenLastCalledWith(true); expect(Number(localStorage.getItem(KHOA_CHIA))).toBeCloseTo(MOC.bang, 2)
  })
  it('máy đã nhớ vạch chia từ buổi trước ⇒ vào là dùng luôn', () => {
    localStorage.setItem(KHOA_CHIA, '0.550')
    const { khiTay } = dung()
    expect(rong('.lv-giay')).toBe(rG(0.55)); expect(khiTay).toHaveBeenLastCalledWith(true)
  })
})

describe('giấy dựng thường + trình phát', () => {
  it('giấy không soi được (câu có ảnh / bảng / sơ đồ): chữ dựng theo khung của em, nét trên giấy ẨN (canvas giấy ẩn, lớp «đang viết» cắt khỏi khung giấy); ba mốc cố định', () => {
    dung({ netGiay: false, tiLeChu: null })
    expect(rong('.lv-giay')).toBe(rG(0.6))
    const tam = document.querySelector<HTMLElement>('.lv-kg-tam')!
    expect(tam.style.height).toBe('100%'); expect(document.querySelector<HTMLElement>('.lv-kg-cuon')!.style.overflowY).toBe('hidden')
    expect(document.querySelector<HTMLElement>('.lv-giay canvas')!.style.display).toBe('none')
    expect(document.querySelector<HTMLElement>('.lv-net')!.style.clipPath).toBe(`inset(0 0 0 ${4 + rG(0.6)}px)`)
    expect(Number(document.querySelector<HTMLElement>('[data-rong]')!.dataset.rong)).toBe(rG(0.6))
  })
  it('trình phát «Xem lại Live» (lop="xp"): cùng hai khung, lớp CSS «xp-…»; đang phát nét trên bảng 2 giây ⇒ bảng nở', () => {
    const { tay } = dung({ lop: 'xp', tiLeChu: null })
    expect(document.querySelector('.xp-giay')).not.toBeNull(); expect(document.querySelector('.xp-bang .lv-cuon')).not.toBeNull(); expect(document.querySelector('.xp-vach-chia')).not.toBeNull()
    expect(rong('.xp-giay')).toBe(rG(0.6))
    chay(tay, 1000, TRE_UU_TIEN_MS + 200, BUT_BANG)
    expect(rong('.xp-giay')).toBe(rG(0.42))
  })
})
