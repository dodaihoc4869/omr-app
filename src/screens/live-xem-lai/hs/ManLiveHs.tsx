// XEM LẠI LIVE — MÁY EM: màn phủ mở từ dòng «Live» của tấm «Thêm» (đặc tả mục 2.1). Danh sách buổi ⇄ trang một buổi; đóng = «Về Lộ trình».
// Hai thành phần gốc của mảnh: `ManLiveHs` (app học sinh: danh sách + trang) và `XemBuoiLive` (điểm vào dùng chung, mở thẳng MỘT buổi — app thầy bấm «Mở»).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MAU_CHIEU } from '../../../lib/bpu/mau-chieu'
import DanhSachLive from './DanhSachLive'
import { tokenEm } from './may-chu'
import TrangBuoi from './TrangBuoi'
import './xem-lai.css'

/** Khung phủ kín: nền app + bảng màu màn chiếu cho ảnh bìa đoạn. Esc = lùi một bước (trình phát phủ kín đang mở thì để trình phát tự đóng). */
function Khung({ nhan, khoa, lui, children }: { nhan: string; khoa: string; lui: () => void; children: ReactNode }) {
  const goc = useRef<HTMLDivElement>(null)
  const luiRef = useRef(lui)
  luiRef.current = lui
  useEffect(() => {
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.xp:not([data-nhung])')) luiRef.current() }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [])
  useEffect(() => { const el = goc.current; if (el) { el.scrollTop = 0; el.focus({ preventScroll: true }) } }, [khoa])
  return createPortal(<div ref={goc} className="xl" tabIndex={-1} role="dialog" aria-modal="true" aria-label={nhan} style={MAU_CHIEU as CSSProperties}>{children}</div>, document.body)
}

export default function ManLiveHs({ token, dong }: { token: string; dong: () => void }) {
  const [mo, setMo] = useState<{ id: string; ve: string | null } | null>(null)
  return <Khung nhan="Xem lại Live" khoa={mo?.id ?? ''} lui={() => (mo ? setMo(null) : dong())}>
    {mo ? <TrangBuoi id={mo.id} ve={mo.ve} nguon="hs" token={token} dong={() => setMo(null)} /> : <DanhSachLive token={token} dong={dong} onMo={setMo} />}
  </Khung>
}

/** ĐIỂM VÀO DÙNG CHUNG: mở xem một buổi. `nguon: 'gv'` (app thầy, nút «Mở» ở Lịch sử Live) ⇒ không có phần riêng từng em. */
export function XemBuoiLive({ id, ve, nguon, dong }: { id: string; ve: string; nguon: 'hs' | 'gv'; dong: () => void }) {
  return <Khung nhan="Xem lại buổi live" khoa={id} lui={dong}>
    <TrangBuoi id={id} ve={ve} nguon={nguon} token={nguon === 'hs' ? tokenEm() || undefined : undefined} dong={dong} nhanLui={nguon === 'gv' ? 'Về Lịch sử Live' : 'Về danh sách buổi live'} />
  </Khung>
}
