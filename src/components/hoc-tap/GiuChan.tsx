// GIỮ CHÂN KHI THOÁT (thầy 27/10, ảnh Duolingo): phần NHỎ nằm trong mảnh màn làm bài — móc `useGiuChan` (nút X, phím Esc, nút back Android) (băng nhắc nằm trong dòng nhãn câu).
// Tấm đáy (Bi buồn + lời nhắn + «Tiếp tục học» / «Thoát») và CSS của nó là mảnh RIÊNG nạp lười (`TamGiuChan.tsx` + styles/trong-giu-chan.css), nạp sẵn
// ngay khi vào màn Duo ⇒ bấm X là tấm trượt lên liền, không chờ mạng. Chữ dựng ở giu-chan.ts (hàm thuần). KHÔNG dùng ở màn bài kiểm tra / ca thi.
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { rung } from '../../lib/rung'

const napTam = () => import('./TamGiuChan')
// Mảnh không tải được (mất mạng, chưa cất sẵn) ⇒ thoát như cũ thay vì vỡ màn.
type PropsTam = { tieuDe: string; phu: readonly string[]; onTiep: () => void; onThoat: () => void }
const TamGiuChan = lazy((): Promise<{ default: ComponentType<PropsTam> }> => napTam().catch(() => ({ default: ThoatLuon })))
function ThoatLuon({ onThoat }: { onThoat: () => void }) {
  useEffect(() => { onThoat() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
/** Nạp sẵn mảnh tấm + CSS (màn Duo vừa mở). Lỗi im lặng — lúc bấm X sẽ thử lại / thoát như cũ. */
export const napSanGiuChan = () => { void napTam().catch(() => {}) }

/**
 * `bat` = đang có điều để giữ (đã chấm ≥ 1 câu, chặng chưa xong — `canGiuChan`). Trả `xinThoat` cho nút X: `bat` ⇒ mở tấm (rung 'chon'), không ⇒ `onThoat`.
 * Esc: mở tấm (đang mở ⇒ đóng = học tiếp); bỏ qua khi một hộp thoại khác đang mở (lời giải, hỏi thầy). Back Android / trình duyệt: khi `bat`, đẩy MỘT mục
 * lịch sử canh; back ⇒ đẩy lại + mở tấm (đang mở ⇒ đóng). Hết `bat` / rời màn ⇒ gỡ mục canh nếu nó còn trên đỉnh. Hàm gọi lại giữ trong ref (không chạy
 * lại hiệu ứng lịch sử mỗi lần vẽ — bài học KhungXemPhieu 06/09).
 */
export function useGiuChan({ bat, onThoat }: { bat: boolean; onThoat: () => void }) {
  const [mo, setMo] = useState(false)
  const batRef = useRef(bat), thoatRef = useRef(onThoat), moRef = useRef(mo)
  batRef.current = bat; thoatRef.current = onThoat; moRef.current = mo
  const moTam = useCallback(() => { setMo(true); rung('chon') }, [])
  const xinThoat = useCallback(() => { if (batRef.current) moTam(); else thoatRef.current() }, [moTam])
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (moRef.current) { e.preventDefault(); setMo(false); return }
      if (!batRef.current || document.querySelector('[aria-modal="true"]')) return
      e.preventDefault(); moTam()
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [moTam])
  useEffect(() => {
    if (!bat) { setMo(false); return }
    const dau = { giuChan: Date.now() }
    try { history.pushState(dau, '') } catch { return }
    const f = () => {
      if ((history.state as { giuChan?: number } | null)?.giuChan === dau.giuChan) return
      try { history.pushState(dau, '') } catch { /* vẫn mở tấm */ }
      if (moRef.current) setMo(false); else moTam()
    }
    window.addEventListener('popstate', f)
    return () => {
      window.removeEventListener('popstate', f)
      try { if ((history.state as { giuChan?: number } | null)?.giuChan === dau.giuChan) history.back() } catch { /* bỏ qua */ }
    }
  }, [bat, moTam])
  const tiepTuc = useCallback(() => setMo(false), [])
  const thoat = useCallback(() => { setMo(false); thoatRef.current() }, [])
  return { mo, xinThoat, tiepTuc, thoat }
}

/** Tấm đáy giữ chân (nạp lười). Đặt TRONG khung `.duo` của màn. */
export function TamGiuChanLuoi(p: PropsTam) {
  return <Suspense fallback={null}><TamGiuChan {...p} /></Suspense>
}

// Băng nhắc mở chặng / trước câu cuối: nay nằm TRONG dòng nhãn câu của ManLamBaiTap (thầy 27/10: viên nổi đè lên nhãn).
