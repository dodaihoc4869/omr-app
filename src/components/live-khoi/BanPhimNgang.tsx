// BÀN PHÍM TRONG APP của ngăn «Tin nhắn lớp» máy em (thầy 13/11 «ép bàn phím xoay ngang»). Hình live đang xoay 90° bằng CSS (máy cầm dọc, không khoá ngang
// được) thì bàn phím HỆ THỐNG vẫn bật theo chiều dọc của máy: nằm ở cạnh bên của hình, chữ quay ngang, không gõ nổi — trang web không xoay được bàn phím hệ thống
// ⇒ vẽ bàn phím ngay trong ngăn (nằm trong lớp đã xoay nên tự ngang theo hình). Chỉ PHÁT PHÍM; ghép dấu Telex do nơi dùng làm (`src/lib/telex.ts`).
// Bấm bằng `pointerdown` + chặn mặc định: ô nhập không mất tiêu điểm, không trễ 300 ms; giữ phím xoá ⇒ xoá lặp (hẹn giờ nối chuỗi).
import { useCallback, useEffect, useRef, useState, type PointerEvent as TroReact, type ReactNode } from 'react'

const HANG_CHU = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const
const HANG_SO = ['1234567890', ',.?!()+-=→', ':;/%°*"'] as const
const XOA_CHO_MS = 380
const XOA_NHIP_MS = 70
const DUONG = {
  hoa: 'M12 4l7 8h-4v7H9v-7H5z',
  xoa: 'M9 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-6-6zM12 10l4 4M16 10l-4 4',
} as const
function Hinh({ ten, dac = false }: { ten: keyof typeof DUONG; dac?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={dac ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={DUONG[ten]} /></svg>
}
const nhan = (e: TroReact<HTMLElement>): void => { e.currentTarget.setAttribute('data-nhan', '') }
const nha = (e: TroReact<HTMLElement>): void => { e.currentTarget.removeAttribute('data-nhan') }

export default function BanPhimNgang({ onPhim, onXoa, onGui, khoa = false }: {
  /** một phím chữ / số / dấu / dấu cách (chữ đã theo Shift) */ onPhim: (k: string) => void
  onXoa: () => void; onGui: () => void
  /** thầy đang tắt nhắn tin ⇒ khoá cả bàn phím */ khoa?: boolean
}) {
  /** 0 = chữ thường · 1 = MỘT chữ hoa kế tiếp · 2 = khoá hoa */
  const [hoa, setHoa] = useState<0 | 1 | 2>(0)
  const [so, setSo] = useState(false)
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const xoaMoi = useRef(onXoa)
  useEffect(() => { xoaMoi.current = onXoa }, [onXoa])
  const dungXoa = useCallback(() => { clearTimeout(hen.current); hen.current = undefined }, [])
  useEffect(() => dungXoa, [dungXoa])
  useEffect(() => { if (khoa) dungXoa() }, [khoa, dungXoa])

  /** Phím thường: bấm xuống là ra chữ ngay. */
  const phim = (k: string, noiDung: ReactNode = k, lop = '', ten?: string) => (
    <button key={k.toLowerCase()} type="button" className={`lc-bp-p${lop}`} disabled={khoa} aria-label={ten} tabIndex={-1}
      onPointerDown={(e) => { e.preventDefault(); if (khoa) return; nhan(e); onPhim(k); if (hoa === 1 && !so) setHoa(0) }} onPointerUp={nha} onPointerCancel={nha} onPointerLeave={nha}>
      <span>{noiDung}</span>
    </button>
  )
  /** Phím chức năng (Shift, lớp số, Gửi). */
  const chucNang = (lop: string, ten: string, noiDung: ReactNode, lam: () => void, bat?: boolean) => (
    <button type="button" className={`lc-bp-p ${lop}`} disabled={khoa} aria-label={ten} aria-pressed={bat} tabIndex={-1}
      onPointerDown={(e) => { e.preventDefault(); if (khoa) return; nhan(e); lam() }} onPointerUp={nha} onPointerCancel={nha} onPointerLeave={nha}>
      <span>{noiDung}</span>
    </button>
  )
  const batXoa = (e: TroReact<HTMLElement>): void => {
    e.preventDefault()
    if (khoa) return
    nhan(e)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ }
    dungXoa()
    onXoa()
    const lap = (): void => { xoaMoi.current(); hen.current = setTimeout(lap, XOA_NHIP_MS) }
    hen.current = setTimeout(lap, XOA_CHO_MS)
  }
  const thoiXoa = (e: TroReact<HTMLElement>): void => { nha(e); dungXoa() }
  const hang = so ? HANG_SO : HANG_CHU
  const chu = (h: string) => [...h].map((c) => phim(so || !hoa ? c : c.toUpperCase()))
  return (
    <div className="lc-bp" role="group" aria-label="Bàn phím" data-hoa={hoa || undefined} onContextMenu={(e) => e.preventDefault()}>
      <p className="lc-bp-meo">Gõ kiểu Telex: aa â · dd đ · s f r x j</p>
      <div className="lc-bp-h">{chu(hang[0])}</div>
      <div className="lc-bp-h lc-bp-h2">{chu(hang[1])}</div>
      <div className="lc-bp-h">
        {so ? <i className="lc-bp-p rong" aria-hidden="true" /> : chucNang(`rong phu${hoa ? ' bat' : ''}${hoa === 2 ? ' khoa' : ''}`, hoa === 2 ? 'Đang khoá chữ hoa' : 'Chữ hoa', <Hinh ten="hoa" dac={hoa === 2} />, () => setHoa((h) => (h === 0 ? 1 : h === 1 ? 2 : 0)), hoa > 0)}
        {chu(hang[2])}
        <button type="button" className="lc-bp-p rong phu" disabled={khoa} aria-label="Xoá lùi" tabIndex={-1} onPointerDown={batXoa} onPointerUp={thoiXoa} onPointerCancel={thoiXoa} onLostPointerCapture={thoiXoa}><span><Hinh ten="xoa" /></span></button>
      </div>
      <div className="lc-bp-h">
        {chucNang('rong phu', so ? 'Về bàn phím chữ' : 'Sang số và dấu', so ? 'ABC' : '123', () => setSo((s) => !s))}
        {phim(' ', 'dấu cách', ' cach', 'Dấu cách')}
        {chucNang('gui', 'Gửi tin', 'Gửi', onGui)}
      </div>
    </div>
  )
}
