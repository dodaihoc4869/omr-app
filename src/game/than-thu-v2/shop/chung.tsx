// CỬA HÀNG PHỤ KIỆN — mảnh dùng chung của bốn màn: đầu màn, số vàng (chạy xuống 300 ms), khối lỗi, huy hiệu bậc, hình giữ chỗ của món.
// Không chữ cứng: mọi chữ lấy từ chu-shop.ts.
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BtCanhBao, BtLui } from './bieu-tuong'
import { TEN_BAC, chuThuLai, so } from './chu-shop'
import type { Bac, OGan } from './kieu'

/** "Giảm chuyển động" của hệ thống. Không có `matchMedia` (máy chủ dựng, jsdom) ⇒ coi như không giảm. */
export function giamChuyenDong(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Số vàng của em. Số hiện ra CHỈ là số máy chủ trả (`vang`); khi số đổi thì chạy từ số cũ sang số mới trong 300 ms.
 * Trình đọc màn hình đọc đúng một lần số cuối (khối `.ps-doc`), không đọc các số chạy dở.
 */
export function SoVang({ vang, className = '' }: { vang: number; className?: string }) {
  const [chay, setChay] = useState<number | null>(null)
  const truoc = useRef(vang)
  useEffect(() => {
    const tu = truoc.current
    truoc.current = vang
    if (tu === vang || giamChuyenDong() || typeof requestAnimationFrame !== 'function') return
    let t0 = -1
    let raf = 0
    const buoc = (t: number) => {
      if (t0 < 0) t0 = t // mốc là khung hình đầu tiên (không trộn với performance.now: gốc thời gian mỗi môi trường một khác)
      const p = Math.min(1, (t - t0) / 300)
      setChay(p >= 1 ? null : Math.round(tu + (vang - tu) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(buoc)
    }
    raf = requestAnimationFrame(buoc)
    return () => {
      cancelAnimationFrame(raf)
      setChay(null)
    }
  }, [vang])
  return (
    <span className={`ps-so ${className}`.trim()}>
      <span aria-hidden="true" data-vang-hien="">
        {so(chay ?? vang)}
      </span>
      <span className="ps-doc" data-vang="">
        {so(vang)}
      </span>
    </span>
  )
}

/** Đầu màn: nút quay lại · tiêu đề + dòng phụ · việc bên phải. */
export function DauMan({ tieuDe, phu, nhanVe, onVe, phai }: { tieuDe: string; phu: string; nhanVe: string; onVe: () => void; phai?: ReactNode }) {
  return (
    <header className="ps-dau">
      <button type="button" className="ps-nut-tron" onClick={onVe} aria-label={nhanVe}>
        <BtLui />
      </button>
      <h2>
        {tieuDe}
        <small>{phu}</small>
      </h2>
      {phai}
    </header>
  )
}

/** Huy hiệu bậc: màu + chữ (không chỉ màu). */
export function HuyHieuBac({ bac, them = '' }: { bac: Bac; them?: string }) {
  return (
    <span className={`ps-bac ps-bac-${bac}`}>
      {TEN_BAC[bac]}
      {them}
    </span>
  )
}

/** Khối lỗi: lời máy chủ + "Thử lại". */
export function KhoiLoi({ loi, onThuLai, phu }: { loi: string; onThuLai?: () => void; phu?: ReactNode }) {
  return (
    <div className="ps-kinh ps-loi" role="alert">
      <div className="ps-loi-dong">
        <BtCanhBao c={22} />
        <p>{loi}</p>
      </div>
      {onThuLai && (
        <button type="button" className="ps-nut-mo" onClick={onThuLai}>
          {chuThuLai}
        </button>
      )}
      {phu}
    </div>
  )
}

/** Hình giữ chỗ của món (CSS): vòng sáng · vệt · khung tên · biểu tượng chung. Hình thật (SVG) do làn mỹ thuật thay qua `veHinhMon`. */
export function HinhGiuCho({ bac, oGan }: { bac: Bac; oGan: OGan }) {
  return (
    <span className={`ps-hgc ps-hgc-${oGan} ps-bac-${bac}`} aria-hidden="true">
      {oGan === 'hao-quang' && <i />}
      {oGan === 'vet' && (
        <>
          <i />
          <i />
          <i />
          <i />
          <i />
        </>
      )}
      {oGan === 'khung' && (
        <>
          <i />
          <i />
        </>
      )}
      {(oGan === 'dau' || oGan === 'co-lung') && <i />}
    </span>
  )
}
