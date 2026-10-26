// TẤM GIẢI THÍCH khi chạm một chữ tô màu (bản vẽ docs/ban-ve-doc-de-2610 màn 2, 3, 3b, 3c và tấm xoay ngang).
//   ≤ 639px  ('day') : tấm trượt từ đáy, có thanh kéo + lớp phủ, nút «Đã hiểu» rộng hết.
//   640–900px ('cot'): CỘT PHẢI 320px, không phủ đề (thầy 26/10: «tối ưu cho giao diện xoay ngang»).
//   ≥ 901px  ('noi') : thẻ nổi neo ngay dưới chữ, có mũi nhọn; rê chuột hiện, bấm ghim (nơi gọi quyết định), Esc đóng.
// Gắn vào <body> (không bị khung cuộn của màn cắt); phông lấy đúng phông của chữ neo (không đặt phông riêng).
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { ChemText } from '../../lib/chem-format'
import type { TheGiaiNghia } from '../../lib/goi-y-cham/kieu'
import { BieuTuong, type TenBieuTuong } from './bieu-tuong'
import { CongThuc } from './so-do-thay'

export type KieuTam = 'day' | 'cot' | 'noi'
const MQ_DAY = '(max-width: 639px)', MQ_COT = '(max-width: 900px)'
function docKieu(): KieuTam {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'day'
  return window.matchMedia(MQ_DAY).matches ? 'day' : window.matchMedia(MQ_COT).matches ? 'cot' : 'noi'
}
function ngheKieu(bao: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const ds = [MQ_DAY, MQ_COT].map((q) => window.matchMedia(q))
  for (const m of ds) m.addEventListener?.('change', bao)
  return () => { for (const m of ds) m.removeEventListener?.('change', bao) }
}
/** Khổ hiện tại — đổi ngay khi xoay máy / kéo cửa sổ. */
export function useKieuTam(): KieuTam {
  return useSyncExternalStore(ngheKieu, docKieu, () => 'day')
}

const ICON: Record<TheGiaiNghia['nhan'], { ten: TenBieuTuong; mau: string; chip: string }> = {
  'Đơn vị': { ten: 'info', mau: 'gyc-tin', chip: 'gyc-tin' },
  'Chất': { ten: 'book', mau: 'gyc-dung', chip: 'gyc-dung' },
  'Công thức': { ten: 'book', mau: 'gyc-dung', chip: 'gyc-dung' },
  'Từ then chốt': { ten: 'flag', mau: 'gyc-chu-y', chip: '' },
  'Đề hỏi': { ten: 'alert', mau: 'gyc-chu-y', chip: 'gyc-chu-y' },
}
// Cột phải dùng chung cho thẻ giải nghĩa (640–900px) và gợi ý (≥ 640px): đếm số chỗ đang giữ, hết người giữ mới gỡ `data-gyc-cot-phai`.
let soGiu = 0
/** Báo khung màn chừa cột phải (`--gyc-cot-phai`) — trả hàm nhả. */
export function giuCotPhai(): () => void {
  soGiu++
  document.documentElement.setAttribute('data-gyc-cot-phai', '')
  let da = false
  return () => { if (da) return; da = true; if (--soGiu <= 0) { soGiu = 0; document.documentElement.removeAttribute('data-gyc-cot-phai') } }
}

const so = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',')

export default function TamGiaiThich({ the, neo, kieu, id, onDong, onVao, onRoi }: {
  the: TheGiaiNghia
  neo: HTMLElement | null
  kieu: KieuTam
  id: string
  onDong: () => void
  /** chuột vào / rời thẻ (máy tính: rê từ chữ sang thẻ không làm thẻ tắt) */
  onVao?: () => void
  onRoi?: () => void
}) {
  const the_ = useRef<HTMLDivElement>(null)
  const [vt, setVt] = useState<{ top: number; left: number; mui: number; tren: boolean } | null>(null)
  const font = neo ? getComputedStyle(neo).fontFamily : undefined
  // Máy tính: đặt thẻ ngay dưới chữ (thiếu chỗ dưới ⇒ lật lên trên), không tràn mép; cuộn / đổi khổ ⇒ đặt lại.
  useLayoutEffect(() => {
    if (kieu !== 'noi' || !neo) { setVt(null); return }
    const dat = () => {
      const r = neo.getBoundingClientRect(), w = the_.current?.offsetWidth ?? 340, h = the_.current?.offsetHeight ?? 220
      const left = Math.max(12, Math.min(r.left - 8, window.innerWidth - w - 12))
      const tren = r.bottom + 14 + h > window.innerHeight - 12 && r.top - 14 - h > 12
      setVt({ top: tren ? r.top - 14 - h : r.bottom + 14, left, mui: Math.max(14, Math.min(r.left + Math.min(r.width / 2, 22) - left - 7, w - 28)), tren })
    }
    dat()
    window.addEventListener('scroll', dat, true)
    window.addEventListener('resize', dat)
    return () => { window.removeEventListener('scroll', dat, true); window.removeEventListener('resize', dat) }
  }, [kieu, neo, the])
  // 640–900px: thẻ là CỘT PHẢI ⇒ đề co lại bên trái, không bị che (thầy 26/10: «tối ưu cho giao diện xoay ngang»)
  useEffect(() => (kieu === 'cot' ? giuCotPhai() : undefined), [kieu])
  const ic = ICON[the.nhan] ?? ICON['Từ then chốt']
  // Thẻ của làn A (the-cham.ts `TheGiaiNghiaDu`) có thêm: loai (viên thuốc «Base mạnh», «Ester»), cachTinhM, congThucChat, tenIupac.
  // Bố cục theo bản vẽ màn 3/3b: tên to · [tên IUPAC đậm · tên cũ] · hộp «công thức · M = … g/mol» · dòng nhỏ «M tính từ nguyên tử khối …».
  const du = the as TheGiaiNghia & { loai?: string; cachTinhM?: string; congThucChat?: string; tenIupac?: string }
  const laHop = (d: string) => / · (?:M|M một mắt xích) = /.test(d)
  const laNho = (d: string) => !!du.cachTinhM && d.endsWith(du.cachTinhM)
  const doan = the.doan.filter((d) => !laHop(d) && !laNho(d) && d !== du.tenIupac)
  const hop = the.doan.find(laHop) ?? (the.congThuc ? `${the.congThuc}${the.M ? ` · M = ${so(the.M)} g/mol` : ''}` : the.M ? `M = ${so(the.M)} g/mol` : '')
  const nho = the.doan.find(laNho)
  return createPortal(
    <>
      {kieu === 'day' && <div className="gyc-phu" aria-hidden="true" onClick={onDong} />}
      <div
        ref={the_} id={id} className="gyc-bong" data-kieu={kieu} data-tren={vt?.tren || undefined} role="dialog" aria-label={`Giải nghĩa: ${the.ten}`}
        style={{ fontFamily: font, ...(kieu === 'noi' ? (vt ? { top: vt.top, left: vt.left } : { visibility: 'hidden', top: 0, left: 0 }) : {}) }}
        onMouseEnter={onVao} onMouseLeave={onRoi}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onDong() } }}
      >
        {kieu === 'noi' && vt && <span className="gyc-bong-mui" style={{ left: vt.mui }} aria-hidden="true" />}
        <span className="gyc-keo" aria-hidden="true" />
        <div className="gyc-b-dau">
          <span className={`gyc-o-icon ${ic.mau}`}><BieuTuong ten={ic.ten} /></span>
          <span className="gyc-b-ten"><ChemText text={the.ten} /></span>
          <span className={`gyc-chip gyc-b-loai ${ic.chip}`}>{du.loai || the.nhan}</span>
        </div>
        {(du.tenIupac || the.tenCu) && <p className="gyc-b-doan">{du.tenIupac && <b><ChemText text={du.tenIupac} /></b>}{du.tenIupac && the.tenCu ? ' · ' : ''}{the.tenCu && <>tên cũ: <ChemText text={the.tenCu} /></>}</p>}
        {doan.map((d, i) => <p key={i} className="gyc-b-doan"><ChemText text={d} /></p>)}
        {hop && <div className="gyc-b-ct"><CongThuc chu={hop} /></div>}
        {nho && <p className="gyc-b-nho">{nho}</p>}
        {the.nhoDoi && <p className="gyc-b-nho">Nhớ đổi: {the.nhoDoi}</p>}
        <div className="gyc-b-cuoi"><button type="button" className="gyc-nut gyc-nhe" data-gyc-da-hieu="" onClick={onDong}>Đã hiểu</button></div>
      </div>
    </>,
    document.body,
  )
}
