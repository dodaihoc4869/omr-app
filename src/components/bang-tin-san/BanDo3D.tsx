// BẢN ĐỒ LỚP 3D: mỗi lớp một cột (cao = số câu hôm nay, màu = tỉ lệ đúng). three.js NẠP LƯỜI (import động ⇒ chunk riêng, không vào gói chính / precache); không có WebGL, không tải được three.js,
// hoặc mất ngữ cảnh WebGL ⇒ lùi về isometric Canvas 2D (`ban-do-iso.ts`). Giảm chuyển động ⇒ camera đứng yên, vẽ khi dữ liệu / màu / kích thước đổi. Dừng vòng vẽ khi tab ẩn; giải phóng WebGL khi rời màn.
// Nhãn HTML nổi trên đầu cột (tên lớp + số câu), tự đẩy lên khi chồng nhau, có dây dẫn. Rê chuột: dừng xoay + gợi ý chi tiết (chỉ ở bản 3D).
import { useEffect, useRef, useState } from 'react'
import type { LopSan } from '../../lib/bang-tin-san/kieu'
import { conNhanChong, datNhanChongLap, docRgb, tiLeLop, tyLeCao } from '../../lib/bang-tin-san/ban-do-chung'
import { veIso } from '../../lib/bang-tin-san/ban-do-iso'
import { phay } from '../../lib/bang-tin-san/trang-thai'
import { chuanBiCanvas, useKichThuoc, type MauSan } from './hooks'
import type { Ban3D } from './ban-do-3d-three'

const nghin = (n: number): string => Math.round(n).toLocaleString('vi-VN')

type Kieu = 'cho' | 'webgl' | 'iso'

export function BanDo3D({ lop, mau, phienBanMau, itDong }: { lop: readonly LopSan[]; mau: MauSan; phienBanMau: number; itDong: boolean }) {
  const hopRef = useRef<HTMLDivElement>(null)
  const nhanRef = useRef<(HTMLDivElement | null)[]>([])
  const cvRef = useRef<HTMLCanvasElement | null>(null)
  const banRef = useRef<Ban3D | null>(null)
  const [kieu, setKieu] = useState<Kieu>('cho')
  const [chon, setChon] = useState(-1)
  const [vt, setVt] = useState<{ x: number; y: number } | null>(null)
  const kt = useKichThuoc(hopRef)
  const cao = useRef<number[]>([])
  const loe = useRef<number[]>([])
  const truoc = useRef<number[]>([])
  const banNhan = useRef({ khoa: '', ngan: false })
  const trang = useRef({ lop, mau, itDong, kieu, dung: false, px: 0, py: 0 })
  trang.current = { lop, mau, itDong, kieu, dung: trang.current.dung, px: trang.current.px, py: trang.current.py }

  // dựng canvas + thử three.js; hỏng ⇒ 2D
  useEffect(() => {
    const hop = hopRef.current
    if (!hop) return
    let huy = false
    const cv = document.createElement('canvas')
    hop.insertBefore(cv, hop.firstChild)
    cvRef.current = cv
    const lui = () => {
      if (huy) return
      banRef.current?.giaiPhong()
      banRef.current = null
      setKieu('iso')
    }
    import('./ban-do-3d-three')
      .then((m) => {
        if (huy) return
        const ban = m.taoBan3D(cv)
        if (!ban) return lui()
        banRef.current = ban
        ban.datLop(trang.current.lop)
        ban.datMau(trang.current.mau)
        setKieu('webgl')
        cv.addEventListener('webglcontextlost', (ev) => {
          ev.preventDefault()
          // đổi sang canvas MỚI cho bản 2D (canvas cũ đã gắn ngữ cảnh WebGL)
          const cv2 = document.createElement('canvas')
          cv.replaceWith(cv2)
          cvRef.current = cv2
          lui()
        })
      })
      .catch(lui)
    return () => {
      huy = true
      banRef.current?.giaiPhong()
      banRef.current = null
      cvRef.current?.remove()
      cvRef.current = null
    }
  }, [])

  // dữ liệu / màu đổi ⇒ báo bản 3D; lớp nào vừa tăng câu thì loé
  useEffect(() => {
    const ban = banRef.current
    if (ban) ban.datLop(lop)
    lop.forEach((l, i) => {
      if (truoc.current[i] !== undefined && l.soCau > truoc.current[i]!) {
        loe.current[i] = 1
        ban?.loe(i)
      }
    })
    truoc.current = lop.map((l) => l.soCau)
  }, [lop, kieu])
  useEffect(() => {
    banRef.current?.datMau(mau)
  }, [mau, phienBanMau, kieu])

  // vòng vẽ: chỉ khi được phép chuyển động và tab hiện; itDong ⇒ vẽ tĩnh khi có thay đổi
  useEffect(() => {
    if (kieu === 'cho') return
    let id = 0
    let t0 = performance.now()
    const khung = (dt: number, xoay: boolean, tinh: boolean) => {
      const hop = hopRef.current
      const cv = cvRef.current
      const s = trang.current
      if (!hop || !cv || s.lop.length === 0) return
      const w = hop.clientWidth
      const h = hop.clientHeight
      if (w < 2 || h < 2) return
      let vtri
      if (s.kieu === 'webgl' && banRef.current) {
        banRef.current.doiKichThuoc(w, h)
        banRef.current.buoc(dt, xoay, tinh)
        vtri = banRef.current.vitriNhan(w, h)
        cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
      } else {
        const k = chuanBiCanvas(cv)
        if (!k) return
        const he = tyLeCao(Math.max(0, ...s.lop.map((l) => l.soCau)))
        const e = tinh ? 1 : 1 - Math.exp(-dt * 5)
        s.lop.forEach((l, i) => {
          const goc = cao.current[i] ?? l.soCau * he // lần đầu: đúng chiều cao ngay
          cao.current[i] = goc + (l.soCau * he - goc) * e
          loe.current[i] = Math.max(0, (loe.current[i] ?? 0) - dt * 1.6)
        })
        const c = (m: string) => `rgb(${docRgb(m).join(',')})`
        vtri = veIso(k.ctx, k.w, k.h, s.lop, cao.current, loe.current, { nen: c(s.mau.nen), matNen: c(s.mau['mat-2']), vien: c(s.mau.vien), do: s.mau.do, vang: s.mau.vang, la: s.mau.la, xam: s.mau['xam-o'] })
      }
      // nhãn: đo bề rộng, đẩy lên khi chồng nhau, dây dẫn từ nhãn xuống đầu cột
      const gon = h < 260 // khung thấp: nhãn MỘT dòng (tên · số câu) để không chất đống ở mép trên
      hop.classList.toggle('bts-hop-3d--gon', gon)
      // hết chỗ dù đã đẩy lên + dời ngang ⇒ nhãn NGẮN (chỉ tên lớp; số câu vẫn có ở gợi ý khi rê). Chọn bản nhãn theo cỡ khung + danh sách lớp (KHÔNG theo camera) để nhãn không nhấp nháy giữa hai bản.
      const khoa = `${w}x${h}|${s.lop.map((l) => l.lop).join('|')}`
      if (banNhan.current.khoa !== khoa) banNhan.current = { khoa, ngan: false }
      const dat = (() => {
        for (const ngan of banNhan.current.ngan ? [true] : [false, true]) {
          hop.dataset.nhan = ngan ? 'ten' : 'day'
          const cn = gon || ngan ? 22 : 33
          const r = datNhanChongLap(
            vtri.map((p, i) => ({ ...p, w: nhanRef.current[i]?.offsetWidth ?? 80 })),
            w,
            cn,
          )
          if (ngan || !conNhanChong(r, cn)) { banNhan.current.ngan = ngan; return r }
        }
        return []
      })()
      dat.forEach((p, i) => {
        const el = nhanRef.current[i]
        if (!el) return
        el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`
        el.style.setProperty('--bts-day', `${Math.max(0, p.y0 - p.y).toFixed(0)}px`)
        el.style.setProperty('--bts-day-lech', `${(p.x0 - p.x).toFixed(0)}px`) // dời ngang ⇒ dây dẫn kéo lệch về đúng đầu cột
        el.style.zIndex = String(1 + Math.round(p.gan))
      })
      // chọn cột dưới con trỏ (bản 3D)
      if (s.dung && s.kieu === 'webgl' && banRef.current) {
        const i = banRef.current.chon(s.px, s.py)
        banRef.current.setChon(i)
        setChon((x) => (x === i ? x : i))
        setVt((x) => (i < 0 ? null : x && x.x === s.px && x.y === s.py ? x : { x: s.px, y: s.py }))
      }
    }
    if (itDong) {
      khung(0, false, true)
      return
    }
    const buoc = (t: number) => {
      const dt = Math.min(0.1, Math.max(0, (t - t0) / 1000))
      t0 = t
      if (!document.hidden) khung(dt, !trang.current.dung, false)
      id = requestAnimationFrame(buoc)
    }
    id = requestAnimationFrame(buoc)
    return () => cancelAnimationFrame(id)
  }, [kieu, itDong, lop, mau, phienBanMau, kt.w, kt.h])

  return (
    <article className="bts-the bts-the-3d" data-khoi="ban-do-lop" data-kieu={kieu}>
      <div className="bts-the-dau">
        <h2 className="bts-ten">Bản đồ lớp</h2>
        <span className="bts-the-phu">Cột cao = số câu hôm nay</span>
      </div>
      <div
        className="bts-ve bts-hop-3d"
        ref={hopRef}
        role="img"
        aria-label={`${lop.length} cột: số câu hôm nay và tỉ lệ đúng của từng lớp`}
        onPointerMove={(ev) => {
          const r = ev.currentTarget.getBoundingClientRect()
          trang.current.dung = true
          trang.current.px = ev.clientX - r.left
          trang.current.py = ev.clientY - r.top
          if (trang.current.itDong && banRef.current) {
            const i = banRef.current.chon(trang.current.px, trang.current.py)
            banRef.current.setChon(i)
            setChon(i)
            setVt(i < 0 ? null : { x: trang.current.px, y: trang.current.py })
          }
        }}
        onPointerLeave={() => {
          trang.current.dung = false
          banRef.current?.setChon(-1)
          setChon(-1)
          setVt(null)
        }}
      >
        {lop.map((l, i) => (
          <div className="bts-nhan3d" key={l.lop} ref={(el) => { nhanRef.current[i] = el }}>
            <b>{l.lop}</b>
            <span className="bts-so">{nghin(l.soCau)} câu</span>
          </div>
        ))}
        {vt && lop[chon] && (
          <div className="bts-goi-y" style={{ left: Math.max(100, vt.x), top: Math.max(70, vt.y) }} role="status">
            <b>{lop[chon]!.lop}</b>
            <br />
            {nghin(lop[chon]!.soCau)} câu hôm nay
            {tiLeLop(lop[chon]!) !== null && <> · đúng {phay(tiLeLop(lop[chon]!)!)} %</>}
            <br />
            {lop[chon]!.daHoc} / {lop[chon]!.siSo} em đã học
          </div>
        )}
      </div>
      <div className="bts-chu-giai">
        <span>
          Màu cột: tỉ lệ đúng thấp <i className="bts-thang" /> cao
        </span>
        {kieu === 'webgl' && <span>Rê chuột để dừng xoay</span>}
      </div>
    </article>
  )
}
