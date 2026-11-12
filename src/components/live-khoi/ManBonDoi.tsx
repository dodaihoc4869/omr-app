// MÀN «BỐN ĐỘI» — hiện 3 giây lúc thầy bấm «Bắt đầu live», mở lại được từ khay «Bốn đội» (thầy duyệt bản vẽ 12/11; docs/ban-ve-live-moi-1211 ảnh 09).
// Phủ kín khung cha, nền xanh than CỐ ĐỊNH (không theo sáng / tối của máy): 4 cột = 4 đội, ngọn lửa đội, «N em · M kJ», tên từng em; đội của em viền màu đội.
// Chạm bất kỳ / Esc / hết `tuDong` ⇒ đóng. Thuần hiển thị: không gọi máy chủ.
import { useEffect, useRef, type CSSProperties } from 'react'
import { NgonLua } from '../bpu/ManBinhPhanUng'
import { DOI_BPU } from '../../lib/bpu/phong'
import type { NguoiLop } from '../../lib/live-khoi/kieu'
import './man-bon-doi.css'

export default function ManBonDoi({ ds, toi, kj, onDong, tuDong }: { ds: readonly NguoiLop[]; toi: NguoiLop | null; kj: readonly number[] /* kJ 4 đội */; onDong: () => void; tuDong?: number /* ms tự đóng, vd 3000 */ }) {
  const goc = useRef<HTMLDivElement>(null)
  const dong = useRef(onDong)
  useEffect(() => { dong.current = onDong }, [onDong])
  useEffect(() => {
    if (!tuDong || tuDong <= 0) return
    const h = window.setTimeout(() => dong.current(), tuDong)
    return () => clearTimeout(h)
  }, [tuDong])
  useEffect(() => { goc.current?.focus({ preventScroll: true }) }, [])

  const doiToi = toi && DOI_BPU[toi.doi] ? toi.doi : -1
  return (
    <div ref={goc} className="bd" role="dialog" aria-modal="true" aria-label="Bốn đội" tabIndex={-1} onClick={() => dong.current()} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dong.current() } }}>
      <header className="bd-dau">
        <span className="bd-vien"><i aria-hidden="true" />Thầy bắt đầu live</span>
        {doiToi >= 0 && <h2>Em thuộc {DOI_BPU[doiToi]!.ten}</h2>}
      </header>
      <div className="bd-luoi">
        {DOI_BPU.map((d, i) => {
          // Em đứng đầu danh sách đội mình để khỏi phải cuộn tìm.
          const nguoi = ds.filter((e) => e.doi === i).sort((a, b) => Number(b.sbd === toi?.sbd) - Number(a.sbd === toi?.sbd))
          return (
            <section key={d.ten} className="bd-cot" data-toi={i === doiToi ? '' : undefined} style={{ ['--doi' as string]: `var(${d.mau})` } as CSSProperties} aria-label={d.ten}>
              <NgonLua doi={i} ky={d.ky} to />
              <h3>{d.ten}</h3>
              <p>{nguoi.length} em · {Math.round(Number(kj[i]) || 0)} kJ</p>
              <ul>
                {nguoi.map((e) => {
                  const laToi = !!toi && e.sbd === toi.sbd
                  return <li key={e.sbd} data-toi={laToi ? '' : undefined}><i aria-hidden="true" /><span>{e.ten}{laToi ? ' (em)' : ''}</span></li>
                })}
              </ul>
            </section>
          )
        })}
      </div>
      <p className="bd-chan">Chạm màn hình để vào bài</p>
    </div>
  )
}
