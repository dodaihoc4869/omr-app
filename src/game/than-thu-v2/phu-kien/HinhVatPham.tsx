// Cùng tệp hình với món mặc trên thú; tải lười theo món, không dùng ảnh giữ chỗ.
import { Suspense, useEffect, useId, useRef, useState } from 'react'
import { hinhCuaMon } from './nap-hinh'
import { docMon } from './phu-kien-mon'
import { DaTrangSuc } from './TrangSuc'
import './phu-kien.css'

export function HinhVatPham({ ma }: { ma: string }) {
  const id = useId().replace(/:/g, '')
  const hop = useRef<HTMLSpanElement>(null)
  const [ganMan, datGanMan] = useState(false)
  useEffect(() => {
    if (!hop.current || typeof IntersectionObserver === 'undefined') { datGanMan(true); return }
    // Chỉ nạp mảnh hình gần khung nhìn; cuộn tới đâu chuẩn bị hình tới đó.
    const theoDoi = new IntersectionObserver(ds => {
      if (ds.some(x => x.isIntersecting)) { datGanMan(true); theoDoi.disconnect() }
    }, { rootMargin: '180px' })
    theoDoi.observe(hop.current)
    return () => theoDoi.disconnect()
  }, [])
  const mon = docMon(ma)
  if (!mon) return null
  const Hinh = hinhCuaMon(ma)
  const lop = `pk-m-${ma.toLowerCase()}`
  return <span ref={hop} className={`pk-vat-pham pk-b${mon.bac} ${lop} pk-tinh`} data-hinh-vat-pham={ma}>
    {!ganMan ? <span className="pk-dang-nap" /> : Hinh ? <Suspense fallback={<span className="pk-dang-nap" />}><Hinh id={`${id}the`} /></Suspense> :
      <span className={`pk-khung pk-k-${mon.kieu}`}><DaTrangSuc kieu={mon.kieu} /><span className="pk-khung-chu"><small>Thần thú</small><strong>{mon.kieu === 'gold' ? 'Au · 999' : 'Ngọc Linh'}</strong></span></span>}
  </span>
}
