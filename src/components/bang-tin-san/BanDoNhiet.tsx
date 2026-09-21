// BẢN ĐỒ NHIỆT: mỗi ô MỘT em, xếp theo lớp (tên lớp + "đã học/sĩ số" bên trái). Ô xanh đậm dần theo số câu hôm nay; xám = chưa học; viền đỏ = đang vấp; em vừa làm câu mới thì ô lóe một nhịp.
// Canvas 2D tự co ô cho vừa khung (một màn không cuộn). Rê ô ⇒ tên + số câu; chạm/bấm ô ⇒ Toàn cảnh em ấy. Chân khối: "Chưa học hôm nay" và "Đã học" lấy từ MỘT nguồn số (chotSo) ⇒ khớp ô "Em đã học hôm nay".
import { useEffect, useMemo, useRef, useState } from 'react'
import type { EmNhiet, LopSan } from '../../lib/bang-tin-san/kieu'
import { phay } from '../../lib/bang-tin-san/trang-thai'
import { chuanBiCanvas, phaMau, useKichThuoc, type MauSan } from './hooks'

const PHONG_CHU = '600 12px system-ui, sans-serif'
const PHONG_SO = '500 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
const LOE_MS = 900
/** Chiều cao tối thiểu của một khối lớp (px): đủ một dòng nhãn 12 px để chữ không đè lên lớp kế. */
export const CAO_NHAN = 16

export interface NhomNhiet {
  ten: string
  daHoc: number
  em: readonly EmNhiet[]
}

/** Gom em theo lớp, giữ thứ tự lớp của `theoLop` (rồi lớp lạ ở cuối); lớp không có em nào bị bỏ. */
export function gomTheoLop(nhiet: readonly EmNhiet[], theoLop: readonly LopSan[] | null): NhomNhiet[] {
  const nhom = new Map<string, EmNhiet[]>()
  for (const l of theoLop ?? []) nhom.set(l.lop, [])
  for (const e of nhiet) {
    const d = nhom.get(e.lop)
    if (d) d.push(e)
    else nhom.set(e.lop, [e])
  }
  return [...nhom].filter(([, em]) => em.length > 0).map(([ten, em]) => ({ ten, daHoc: em.filter((e) => e.soCau > 0).length, em }))
}

export interface BoTri {
  s: number
  g: number
  gN: number
  nhanW: number
  cot: number
  H: number
}

/** Cỡ ô `s` lớn nhất (≤ 15, ≥ 5) sao cho mọi lớp vừa `hToiDa`; không giới hạn cao ⇒ cỡ cố định theo bề rộng. */
export function boTriNhiet(w: number, nhom: readonly { em: readonly unknown[] }[], hToiDa: number): BoTri {
  const nhanW = w < 270 ? 98 : 106
  const g = 2
  const gN = 6
  const vungW = w - nhanW
  const tinh = (s: number) => {
    const cot = Math.max(1, Math.floor((vungW + g) / (s + g)))
    let H = 0
    for (const n of nhom) H += Math.max(Math.ceil(n.em.length / cot) * (s + g), CAO_NHAN) + gN // khối ô thấp hơn một dòng chữ vẫn chừa đủ chỗ cho nhãn lớp
    return { cot, H: Math.max(0, H - gN - g) }
  }
  let s = hToiDa > 0 ? 15 : w < 330 ? 10 : 11
  if (hToiDa > 0) while (s > 5 && tinh(s).H > hToiDa) s--
  return { s, g, gN, nhanW, ...tinh(s) }
}

export interface OVe {
  x: number
  y: number
  idx: number
}

/** Vẽ bản đồ nhiệt lên `ctx`; trả toạ độ từng ô (để dò chuột) và cỡ ô. `loe` = Map sbd → thời điểm hết lóe (ms, cùng gốc `nowMs`). */
export function veNhiet(ctx: CanvasRenderingContext2D, w: number, h: number, nhom: readonly NhomNhiet[], mau: MauSan, loe: ReadonlyMap<string, number>, nowMs: number, itDong: boolean, motMan: boolean, chonI: number | null = null): { o: OVe[]; s: number; cot: number } {
  const b = boTriNhiet(w, nhom, motMan ? h - 2 : 0)
  const s = b.s
  const o: OVe[] = []
  let y = 1
  let idx = 0
  for (const n of nhom) {
    const hang = Math.ceil(n.em.length / b.cot)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = mau.chu
    ctx.font = PHONG_CHU
    // nhãn lớp: hai dòng (tên + "đã học/sĩ số") chỉ khi khối ô đủ cao cho hai dòng chữ; hẹp hơn thì MỘT dòng tên (số đã học/sĩ số có ở gợi ý khi rê chuột) — không để chữ đè lên nhau
    const caoKhoi = hang * (s + b.g) - b.g
    ctx.fillText(n.ten, 0, caoKhoi >= 30 ? y + 7 : y + Math.min(caoKhoi, 14) / 2 + 0.5, b.nhanW - 6)
    if (caoKhoi >= 30) {
      ctx.fillStyle = mau['chu-mo']
      ctx.font = PHONG_SO
      ctx.fillText(`${n.daHoc}/${n.em.length} em đã học`, 0, y + 22, b.nhanW - 6)
    }
    n.em.forEach((e, i) => {
      const x = b.nhanW + (i % b.cot) * (s + b.g)
      const yy = y + Math.floor(i / b.cot) * (s + b.g)
      o.push({ x, y: yy, idx: idx + i })
      ctx.fillStyle = e.soCau > 0 ? phaMau(mau.duong, 0.26 + 0.74 * Math.min(1, e.soCau / 85)) : mau['xam-o']
      hcn(ctx, x, yy, s, s, 2.2)
      ctx.fill()
      if (e.dangVap) {
        ctx.strokeStyle = mau.do
        ctx.lineWidth = 1.5
        hcn(ctx, x + 0.75, yy + 0.75, s - 1.5, s - 1.5, 2)
        ctx.stroke()
      }
      if (chonI === idx + i) {
        // ô đang được chọn bằng bàn phím: viền dày màu chữ (đọc được ở cả sáng và tối)
        ctx.strokeStyle = mau.chu
        ctx.lineWidth = 2
        hcn(ctx, x - 1.5, yy - 1.5, s + 3, s + 3, 3)
        ctx.stroke()
      }
      const het = loe.get(e.sbd)
      if (het !== undefined && het > nowMs && !itDong) {
        const p = 1 - (het - nowMs) / LOE_MS
        ctx.strokeStyle = phaMau(mau.duong, 0.85 * (1 - p))
        ctx.lineWidth = 1.6
        hcn(ctx, x - 1 - p * 3.5, yy - 1 - p * 3.5, s + 2 + p * 7, s + 2 + p * 7, 3 + p * 2)
        ctx.stroke()
        ctx.fillStyle = phaMau(mau.mat, 0.55 * (1 - p))
        hcn(ctx, x, yy, s, s, 2.2)
        ctx.fill()
      }
    })
    idx += n.em.length
    y += Math.max(hang * (s + b.g), CAO_NHAN) + b.gN
  }
  return { o, s, cot: b.cot }
}

function hcn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export interface BanDoNhietProps {
  nhiet: readonly EmNhiet[]
  theoLop: readonly LopSan[] | null
  soLieu: { soEmHoc: number; tongEm: number; chuaHoc: number }
  mau: MauSan
  phienBanMau: number
  itDong: boolean
  nowMs: number
  motMan: boolean
  onMoEm: (sbd: string) => void
}

export function BanDoNhiet(p: BanDoNhietProps) {
  const hopRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const kt = useKichThuoc(hopRef)
  const nhom = useMemo(() => gomTheoLop(p.nhiet, p.theoLop), [p.nhiet, p.theoLop])
  const phang = useMemo(() => nhom.flatMap((n) => n.em), [nhom])
  const oRef = useRef<{ o: OVe[]; s: number; cot: number }>({ o: [], s: 10, cot: 1 })
  const [phim, setPhim] = useState<number | null>(null)
  const loe = useRef(new Map<string, number>())
  const truoc = useRef(new Map<string, number>())
  const [chon, setChon] = useState<{ i: number; x: number; y: number } | null>(null)
  const [cao, setCao] = useState<number | null>(null)

  // em nào vừa tăng câu ⇒ lóe
  useEffect(() => {
    const now = performance.now()
    for (const e of p.nhiet) {
      const cu = truoc.current.get(e.sbd)
      if (cu !== undefined && e.soCau > cu) loe.current.set(e.sbd, now + LOE_MS)
      truoc.current.set(e.sbd, e.soCau)
    }
  }, [p.nhiet])

  // một màn: canvas lấp đầy khung; nhiều màn (cuộn): khung co theo nội dung
  useEffect(() => {
    if (p.motMan || kt.w < 10) return setCao(null)
    setCao(boTriNhiet(kt.w, nhom, 0).H + 2)
  }, [p.motMan, kt.w, nhom])

  const phimRef = useRef<number | null>(null)
  phimRef.current = phim
  const ve = (now: number) => {
    const cv = cvRef.current
    if (!cv) return
    const k = chuanBiCanvas(cv)
    if (!k) return
    oRef.current = veNhiet(k.ctx, k.w, k.h, nhom, p.mau, loe.current, now, p.itDong, p.motMan, phimRef.current)
  }
  useEffect(() => {
    ve(performance.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nhom, p.mau, p.phienBanMau, p.itDong, p.motMan, kt.w, kt.h, cao, phim])
  // chỉ chạy vòng vẽ khi còn ô đang lóe
  useEffect(() => {
    if (p.itDong) return
    let id = 0
    const buoc = (t: number) => {
      const dangLoe = [...loe.current.values()].some((v) => v > t)
      if (dangLoe && !document.hidden) ve(t)
      id = requestAnimationFrame(buoc)
    }
    id = requestAnimationFrame(buoc)
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nhom, p.mau, p.itDong, p.motMan])

  const dungO = (ev: { clientX: number; clientY: number }): { i: number; x: number; y: number } | null => {
    const r = hopRef.current!.getBoundingClientRect()
    const px = ev.clientX - r.left
    const py = ev.clientY - r.top
    const { o, s } = oRef.current
    for (const c of o) if (px >= c.x - 1 && px <= c.x + s + 1 && py >= c.y - 1 && py <= c.y + s + 1) return { i: c.idx, x: c.x + s / 2, y: c.y }
    return null
  }
  const oPhim = phim !== null ? oRef.current.o.find((c) => c.idx === phim) : undefined
  const hien = chon ?? (oPhim ? { i: oPhim.idx, x: oPhim.x + oRef.current.s / 2, y: oPhim.y } : null)
  const e = hien ? phang[hien.i] : undefined
  const phimDi = (ev: React.KeyboardEvent) => {
    const n = phang.length
    if (n === 0) return
    const cur = phim ?? 0
    const buoc: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: oRef.current.cot, ArrowUp: -oRef.current.cot }
    if (ev.key in buoc) {
      ev.preventDefault()
      setPhim(Math.min(n - 1, Math.max(0, cur + buoc[ev.key]!)))
    } else if (ev.key === 'Home' || ev.key === 'End') {
      ev.preventDefault()
      setPhim(ev.key === 'Home' ? 0 : n - 1)
    } else if ((ev.key === 'Enter' || ev.key === ' ') && phim !== null && phang[phim]) {
      ev.preventDefault()
      p.onMoEm(phang[phim]!.sbd)
    } else if (ev.key === 'Escape') setPhim(null)
  }
  return (
    <article className="bts-the" data-khoi="ban-do-nhiet">
      <div className="bts-the-dau">
        <h2 className="bts-ten">Bản đồ nhiệt {p.soLieu.tongEm} em</h2>
        <span className="bts-the-phu">mỗi ô một em</span>
      </div>
      <div className="bts-nhiet-giai">
        <span>
          <i className="bts-og bts-og-0" />
          chưa học
        </span>
        <span>
          <i className="bts-og bts-og-1" />
          <i className="bts-og bts-og-2" />
          <i className="bts-og" />
          ít → nhiều câu
        </span>
        <span>
          <i className="bts-og bts-og-v" />
          đang vấp
        </span>
      </div>
      <div
        className="bts-ve bts-nhiet-hop"
        ref={hopRef}
        style={cao ? { height: cao, flex: 'none' } : undefined}
        onPointerMove={(ev) => {
          const c = dungO(ev)
          setChon((x) => (x?.i === c?.i ? x : c))
        }}
        onPointerLeave={() => setChon(null)}
      >
        <canvas
          ref={cvRef}
          role="application"
          tabIndex={0}
          aria-label={`Bản đồ nhiệt: mỗi ô là một em, xếp theo lớp; ${p.soLieu.soEmHoc} em đã học, ${p.soLieu.chuaHoc} em chưa học. Dùng phím mũi tên để chọn một em, Enter để mở toàn cảnh.`}
          onKeyDown={phimDi}
          onFocus={() => setPhim((x) => x ?? 0)}
          onBlur={() => setPhim(null)}
          onClick={(ev) => {
            const c = dungO(ev)
            const em = c ? phang[c.i] : undefined
            if (em) p.onMoEm(em.sbd)
          }}
        />
        {hien && e && (
          <div className="bts-goi-y" style={{ left: Math.min(Math.max(hien.x, 90), Math.max(90, (hopRef.current?.clientWidth ?? 0) - 90)), top: Math.max(38, hien.y) }} role="status">
            <b>{e.hoTen}</b> · {e.lop}
            <br />
            {e.soCau > 0 ? `${e.soCau} câu hôm nay · đúng ${e.soCau ? phay((e.soCauDung / e.soCau) * 100, 0) : 0} %` : 'chưa học hôm nay'}
            {e.dangVap ? ' · đang vấp' : ''}
          </div>
        )}
      </div>
      <div className="bts-nhiet-chan">
        <span>
          Chưa học<span className="bts-hn"> hôm nay</span>: <b className="bts-so">{p.soLieu.chuaHoc}</b> em
        </span>
        <span>
          Đã học: <b className="bts-so">{p.soLieu.soEmHoc}</b> em
        </span>
      </div>
    </article>
  )
}
