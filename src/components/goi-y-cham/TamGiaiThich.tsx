// THẺ GIẢI NGHĨA khi chạm một chữ tô tím — kiểu DUOLINGO (thầy 27/10: «làm lại khung hiển thị cho tinh tế popup đẹp mắt dolingo»).
// Mọi khổ (điện thoại dọc, xoay ngang, máy tính) cùng MỘT kiểu: thẻ nhỏ neo ngay dưới chữ (hết chỗ dưới ⇒ lật lên trên), mũi nhọn chỉ vào chữ,
// rộng tối đa 300px, không vượt mép màn (lề 12px). Không tấm đáy, không nền xám che màn, không cột phải, không nút «Đã hiểu».
// Dòng đầu đậm (tên / ý chính) · 1–2 dòng chi tiết · (chất) một dòng nhỏ tên khác / tên cũ.
// Đóng: chạm ra ngoài, chạm chữ khác, cuộn làm chữ trôi đi, Esc (nơi gọi lo), Tab ra khỏi thẻ. Gắn vào <body> (không bị khung cuộn của màn cắt);
// phông lấy đúng phông của chữ neo.
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { ChemText } from '../../lib/chem-format'
import type { TheGiaiNghia } from '../../lib/goi-y-cham/kieu'
import { CongThuc } from './so-do-thay'

const MQ_RE = '(hover: hover) and (pointer: fine)'
function docCoRe(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(MQ_RE).matches
}
function ngheCoRe(bao: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const m = window.matchMedia(MQ_RE)
  m.addEventListener?.('change', bao)
  return () => m.removeEventListener?.('change', bao)
}
/** Máy có chuột (rê để xem trước): rê chữ là hiện thẻ, bấm thì ghim. Màn cảm ứng: chỉ chạm. */
export function useCoRe(): boolean {
  return useSyncExternalStore(ngheCoRe, docCoRe, () => false)
}

// Cột phải của «Gợi ý 3 tầng» (≥ 640px): đếm số chỗ đang giữ, hết người giữ mới gỡ `data-gyc-cot-phai`.
let soGiu = 0
/** Báo khung màn chừa cột phải (`--gyc-cot-phai`) — trả hàm nhả. */
export function giuCotPhai(): () => void {
  soGiu++
  document.documentElement.setAttribute('data-gyc-cot-phai', '')
  let da = false
  return () => { if (da) return; da = true; if (--soGiu <= 0) { soGiu = 0; document.documentElement.removeAttribute('data-gyc-cot-phai') } }
}

const LE = 12, KHE = 10, RONG = 300, TROI = 24

/** Khung chữ neo: dòng đầu của mảnh đầu, nối thêm các mảnh cùng dòng (FeS<sub>2</sub> = 2 mảnh). */
function khungNeo(manh: HTMLElement[]): DOMRect | null {
  const dau = manh[0]
  if (!dau?.isConnected) return null
  const r0 = dau.getClientRects()[0] ?? dau.getBoundingClientRect()
  let trai = r0.left, phai = r0.right, tren = r0.top, duoi = r0.bottom
  for (const m of manh.slice(1)) {
    const r = m.getClientRects()[0]
    if (!r || Math.abs(r.top - r0.top) > r0.height / 2) break
    trai = Math.min(trai, r.left); phai = Math.max(phai, r.right); tren = Math.min(tren, r.top); duoi = Math.max(duoi, r.bottom)
  }
  return new DOMRect(trai, tren, phai - trai, duoi - tren)
}

type ViTri = { top: number; left: number; mui: number; tren: boolean }

export default function TamGiaiThich({ the, neo, id, onDong, onVao, onRoi }: {
  the: TheGiaiNghia & { tenPhu?: string }
  /** các mảnh chữ của vùng đang mở (mảnh đầu là chữ nhận Tab) */
  neo: HTMLElement[]
  id: string
  /** `traTieuDiem`: đưa con trỏ bàn phím về lại chữ */
  onDong: (traTieuDiem: boolean) => void
  /** chuột vào / rời thẻ (máy tính: rê từ chữ sang thẻ không làm thẻ tắt) */
  onVao?: () => void
  onRoi?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [vt, setVt] = useState<ViTri | null>(null)
  const font = neo[0] ? getComputedStyle(neo[0]).fontFamily : undefined
  // Đặt thẻ dưới chữ (thiếu chỗ ⇒ lật lên trên), kẹp trong lề 12px; mũi nhọn chỉ đúng giữa chữ. Cuộn làm chữ trôi > 24px ⇒ đóng.
  useLayoutEffect(() => {
    const goc = khungNeo(neo)
    if (!goc) return
    const dat = () => {
      const r = khungNeo(neo)
      if (!r) return
      const vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight
      const w = ref.current?.offsetWidth || Math.min(RONG, vw - 2 * LE), h = ref.current?.offsetHeight || 96
      const tam = r.left + r.width / 2
      const left = Math.round(Math.max(LE, Math.min(tam - w / 2, vw - w - LE)))
      const tren = r.bottom + KHE + h > vh - LE && r.top - KHE - h >= LE
      setVt({ top: Math.round(tren ? r.top - KHE - h : r.bottom + KHE), left, mui: Math.round(Math.max(18, Math.min(tam - left, w - 18))), tren })
    }
    dat()
    const cuon = () => {
      const r = khungNeo(neo)
      if (!r || Math.abs(r.top - goc.top) > TROI || Math.abs(r.left - goc.left) > TROI) onDong(false)
      else dat()
    }
    window.addEventListener('scroll', cuon, true)
    window.addEventListener('resize', dat)
    return () => { window.removeEventListener('scroll', cuon, true); window.removeEventListener('resize', dat) }
  }, [neo, the]) // eslint-disable-line react-hooks/exhaustive-deps
  const idTen = `${id}-ten`
  return createPortal(
    <div
      ref={ref} id={id} className="gyc-bong" data-tren={vt?.tren || undefined} role="dialog" aria-modal="false" aria-labelledby={idTen} tabIndex={-1}
      style={{ fontFamily: font, ...(vt ? { top: vt.top, left: vt.left, ['--gyc-mui' as string]: `${vt.mui}px` } : { visibility: 'hidden', top: 0, left: 0 }) }}
      onMouseEnter={onVao} onMouseLeave={onRoi}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onDong(true) }
        // Tab ra khỏi thẻ ⇒ đóng, con trỏ về chữ rồi đi tiếp như thường (không chặn phím)
        else if (e.key === 'Tab') onDong(true)
      }}
    >
      <span className="gyc-bong-mui" aria-hidden="true" />
      <p className="gyc-b-ten" id={idTen}><ChemText text={the.ten} /></p>
      {the.doan.slice(0, 2).map((d, i) => <p key={i} className="gyc-b-doan"><CongThuc chu={d} /></p>)}
      {the.tenPhu && <p className="gyc-b-nho">{the.tenPhu}</p>}
    </div>,
    document.body,
  )
}
