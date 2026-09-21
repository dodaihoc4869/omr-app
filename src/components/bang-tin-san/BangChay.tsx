// BĂNG CHẠY "Vừa xảy ra": các sự kiện học mới nhất, chạy ngang 38 px/giây. Chữ do MÁY CHỦ soạn sẵn (không mã dạng); màn KHÔNG bịa sự kiện:
// tin mới (chưa từng thấy) nối vào cuối hàng đợi; tin đã chạy hết thì xoay về cuối (băng ngắn vẫn liền mạch). Tắt chuyển động ⇒ đứng yên, hiện các tin đầu.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TinSan } from '../../lib/bang-tin-san/kieu'
import { MuiTen } from './OSo'

const TOC_DO = 38 // px / giây
const KHE = 32 // px giữa hai tin (khớp `margin-right` của .bts-tin)
const TOI_DA = 24
const khoaTin = (t: TinSan): string => `${t.luc}|${t.chu}|${t.phu ?? ''}`

export function BangChay({ tin, itDong }: { tin: TinSan[]; itDong: boolean }) {
  const [hang, setHang] = useState<TinSan[]>(() => tin.slice(-TOI_DA))
  const daCo = useRef(new Set(tin.map(khoaTin)))
  const dayRef = useRef<HTMLDivElement>(null)
  const xRef = useRef(0)
  const choXoay = useRef(0)

  // tin mới ⇒ nối vào cuối (đã thấy rồi thì bỏ qua); giữ tối đa TOI_DA tin
  useEffect(() => {
    const moi = tin.filter((t) => !daCo.current.has(khoaTin(t)))
    if (moi.length === 0) return
    for (const t of moi) daCo.current.add(khoaTin(t))
    setHang((h) => [...h, ...moi].slice(-TOI_DA))
  }, [tin])

  // sau khi DOM đã xoay (tin đầu về cuối) mới bù lại độ rộng của nó ⇒ không có khung hình nhảy
  useLayoutEffect(() => {
    if (choXoay.current > 0) {
      xRef.current += choXoay.current
      choXoay.current = 0
      if (dayRef.current) dayRef.current.style.transform = `translate3d(${xRef.current.toFixed(2)}px,0,0)`
    }
  }, [hang])

  useEffect(() => {
    const day = dayRef.current
    if (itDong) {
      xRef.current = 0
      if (day) day.style.transform = ''
      return
    }
    let id = 0
    let t0 = performance.now()
    const buoc = (t: number) => {
      const dt = Math.min(0.1, Math.max(0, (t - t0) / 1000))
      t0 = t
      const d = dayRef.current
      if (d) {
        xRef.current -= TOC_DO * dt
        const dau = d.firstElementChild as HTMLElement | null
        if (dau && choXoay.current === 0) {
          const w = dau.offsetWidth + KHE
          if (-xRef.current >= w) {
            choXoay.current = w
            setHang((h) => (h.length > 1 ? [...h.slice(1), h[0]!] : h))
          }
        }
        d.style.transform = `translate3d(${xRef.current.toFixed(2)}px,0,0)`
      }
      id = requestAnimationFrame(buoc)
    }
    id = requestAnimationFrame(buoc)
    return () => cancelAnimationFrame(id)
  }, [itDong])

  return (
    <section className="bts-bang" aria-label="Sự kiện học mới nhất" data-khoi="bang-chay">
      <span className="bts-bang-nhan">Vừa xảy ra</span>
      <div className="bts-bang-khung">
        <div className="bts-bang-day" ref={dayRef}>
          {hang.map((t) => (
            <span className={`bts-tin bts-tin-${t.loai}`} key={khoaTin(t)}>
              <MuiTen h={t.loai === 'cham' ? 'ngang' : t.loai} />
              <span>
                <b>{t.chu}</b>
                {t.phu && <span className="bts-phu"> {t.phu}</span>}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
