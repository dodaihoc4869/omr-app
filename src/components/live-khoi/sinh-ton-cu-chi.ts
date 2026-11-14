// CỬ CHỈ + BÀN PHÍM của trò «Sinh Tồn · Trang vở» (tách khỏi TroSinhTon.tsx 13/11, chỉ dời mã — không đổi hành vi). VUỐT ở đâu cũng là cần ảo vô hình;
// CHẠM nhanh một điểm = chạy tới đó; chạm trúng bé ma của em = mở bốn nhãn biểu cảm. Chỉ TroSinhTon.tsx nhập ⇒ nằm chung mảnh lười TroSinhTon.
import type { PointerEvent as SuKienTro, RefObject } from 'react'
import { toaDoXoay } from '../live/chieu-xoay'
import type { Diem } from '../../lib/live-khoi/sinh-ton-loi'
import { moAm } from './sinh-ton-am'
import { KY_BIEU_CAM, chamMaEm } from './sinh-ton-ve'

/** Bán kính «cần ảo» vô hình (px): kéo xa chừng này là chạy hết tốc. */
const BK_CAN = 46
const VUNG_CHET = 0.14
/** Ngón tay xê dịch quá chừng này (px) thì là VUỐT, chưa tới thì là CHẠM. */
const NGUONG_KEO = 12
const CHAM_MS = 350
export const PHIM: Record<string, [number, number]> = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
}

// `ma` / `ti` = tâm thân bé ma của em trên khung + tỉ lệ (vòng khung ghi; null = không chạm được: đang bị hạ / máy thầy) — chạm trúng ⇒ mở nhãn biểu cảm.
// `e` = biểu cảm chờ gửi (-1 = không), `moBc` = lúc mở bốn nhãn (0 = đóng).
export const taoVao = () => ({ cx: 0, cy: 0, phim: {} as Record<string, boolean>, id: -1, gx: 0, gy: 0, t0: 0, keo: false, cham: null as Diem | null, daDung: false, ma: null as Diem | null, ti: 1, e: -1, moBc: 0 })
export type Vao = ReturnType<typeof taoVao>

/** Bộ xử lý con trỏ (dựng lại mỗi lượt vẽ như cũ; tên `use…` vì nhận ref lúc vẽ — không gọi hook nào). Toạ độ đổi về hệ của KHUNG (lớp live có thể xoay 90° bằng CSS). */
export function useCuChi(vao: RefObject<Vao>, vaiRef: RefObject<HTMLCanvasElement | null>, gocRef: RefObject<HTMLDivElement | null>, xoay: boolean, setBieuCam: (d: Diem[] | null) => void) {
  const toaDo = (e: SuKienTro) => {
    const r = (vaiRef.current ?? e.currentTarget).getBoundingClientRect()
    return xoay ? toaDoXoay(e, r) : { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const xuong = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.id !== -1) return
    // Bốn nhãn biểu cảm đang mở mà em chạm chỗ khác ⇒ đóng, và cử chỉ vẫn chạy như thường.
    if (i.moBc) { i.moBc = 0; setBieuCam(null) }
    const p = toaDo(e)
    i.id = e.pointerId; i.gx = p.x; i.gy = p.y; i.cx = 0; i.cy = 0; i.keo = false; i.t0 = performance.now()
    moAm()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ: vẫn nhận sự kiện trong vùng */ }
    e.preventDefault()
  }
  const di = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.id !== e.pointerId) return
    const p = toaDo(e)
    let dx = p.x - i.gx, dy = p.y - i.gy
    const dai = Math.hypot(dx, dy)
    if (!i.keo && dai < NGUONG_KEO) return
    i.keo = true
    if (dai > BK_CAN) { dx = (dx / dai) * BK_CAN; dy = (dy / dai) * BK_CAN }
    const co = Math.min(dai, BK_CAN) / BK_CAN
    i.cx = co < VUNG_CHET ? 0 : dx / BK_CAN
    i.cy = co < VUNG_CHET ? 0 : dy / BK_CAN
  }
  const buong = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.id !== e.pointerId) return
    // CHẠM (không vuốt): trúng bé ma của em ⇒ mở bốn nhãn biểu cảm; chạm chỗ khác ⇒ chạy tới đó như cũ.
    if (!i.keo && e.type === 'pointerup' && performance.now() - i.t0 < CHAM_MS) {
      if (i.ma && chamMaEm(i.gx, i.gy, i.ma, i.ti)) {
        // Bốn nhãn tròn 56 px xếp vòng cung phía trên bé ma, kẹp trong khung.
        const W = gocRef.current?.clientWidth ?? 0, H = gocRef.current?.clientHeight ?? 0, ma = i.ma
        i.moBc = performance.now()
        setBieuCam(KY_BIEU_CAM.map((_, k) => { const a = ((-165 + k * 50) * Math.PI) / 180; return { x: Math.max(32, Math.min(W - 32, ma.x + Math.cos(a) * 84)), y: Math.max(32, Math.min(H - 32, ma.y - 4 + Math.sin(a) * 84)) } }))
      }
      else i.cham = { x: i.gx, y: i.gy }
    }
    i.id = -1; i.cx = 0; i.cy = 0; i.keo = false
  }
  /** Chọn một nhãn ⇒ gửi `e` ở nhịp kế (phòng nhận 1 lần / 2 giây mỗi em) + bong bóng của em hiện ngay. */
  const guiBieuCam = (so: number) => { const i = vao.current; i.e = so; i.moBc = 0; setBieuCam(null) }
  return { xuong, di, buong, guiBieuCam }
}

/** Bàn phím (máy tính): WASD / mũi tên để đi. Đang gõ chữ (chat) thì bỏ qua. */
export function taoBanPhim(vao: RefObject<Vao>) {
  const dangGo = (e: KeyboardEvent) => {
    const d = e.target as HTMLElement | null
    return !!d && (d.tagName === 'INPUT' || d.tagName === 'TEXTAREA' || d.tagName === 'SELECT' || d.isContentEditable)
  }
  const phimXuong = (e: KeyboardEvent) => {
    if (dangGo(e) || e.ctrlKey || e.metaKey || e.altKey) return
    if (PHIM[e.code]) { vao.current.phim[e.code] = true; moAm(); e.preventDefault() }
  }
  const phimLen = (e: KeyboardEvent) => { if (PHIM[e.code]) vao.current.phim[e.code] = false }
  const buongPhim = () => { vao.current.phim = {} }
  return { phimXuong, phimLen, buongPhim }
}
