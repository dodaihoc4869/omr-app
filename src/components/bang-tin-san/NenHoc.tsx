// BIỂU ĐỒ NẾN "Nhịp học trực tiếp" (Canvas 2D): mỗi nến = 5 phút; thân nến = tỉ lệ đúng (%) trong khung ấy (mở → đóng), râu = cao/thấp; cột dưới = số câu; đường mảnh = trung bình 7 nến;
// nhãn giá bám giá trị hiện tại + "còn mm:ss" tới hết nến; chú giải ghi rõ "tỉ lệ đúng trong 5 phút" (KHÁC ô "Tỉ lệ đúng cả ngày"). Xanh = tăng trong khung, đỏ = giảm.
// Dữ liệu là `nen` của máy chủ (10 giây/lần); giữa hai lần chỉ NỘI SUY (nến cuối, trục) — KHÔNG bịa nến hay câu. Dừng vòng vẽ khi tab ẩn; giảm chuyển động ⇒ không nội suy, không vòng nhấp nháy.
import { useEffect, useRef } from 'react'
import type { NenSan } from '../../lib/bang-tin-san/kieu'
import { conLai, gioPhutMs, phay } from '../../lib/bang-tin-san/trang-thai'
import { chuanBiCanvas, phaMau, useKichThuoc, type MauSan } from './hooks'

const PHUT = 60_000
export const NEN_MS = 5 * PHUT
const PHONG_SO = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
const kep = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))

function hcnBo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

interface Hien {
  c: number
  h: number
  l: number
  v: number
  yMin: number
  yMax: number
  vMax: number
  soNen: number
  batDau: number
}

/** Vẽ MỘT khung hình. `dt` giây kể từ khung trước (0 = vẽ tĩnh); `hien` là trạng thái nội suy (đổi tại chỗ). Trả về `false` nếu hộp chưa có kích thước. */
/** `coLuoi = false` (điện thoại): KHÔNG vẽ lưới ngang / dọc (thầy 21/09 — vạch lưới đè lên nến trên màn nhỏ); vẫn giữ nhãn trục %, nhãn giờ, đường giá hiện tại. */
export function veNen(cv: HTMLCanvasElement, nen: readonly NenSan[], nowMs: number, hien: Hien, mau: MauSan, dt: number, itDong: boolean, nhipMs: number, coLuoi = true): boolean {
  const k0 = chuanBiCanvas(cv)
  if (!k0 || nen.length === 0) return false
  const { ctx, w, h } = k0
  const cuoi = nen[nen.length - 1]!
  const k = itDong ? 1 : 1 - Math.exp(-dt * 9)
  if (hien.soNen !== nen.length || hien.batDau !== nen[0]!.tu) {
    // nến mới (hoặc bộ nến đổi hẳn) ⇒ đặt thẳng, không trượt từ nến cũ
    Object.assign(hien, { c: cuoi.dong, h: cuoi.cao, l: cuoi.thap, v: cuoi.soCau, soNen: nen.length, batDau: nen[0]!.tu, yMax: 0 })
  }
  hien.c += (cuoi.dong - hien.c) * k
  hien.h += (cuoi.cao - hien.h) * k
  hien.l += (cuoi.thap - hien.l) * k
  hien.v += (cuoi.soCau - hien.v) * k

  const pL = 4
  const pR = 66
  const pT = 8
  const pB = 20
  const plotW = w - pL - pR
  const plotH = h - pT - pB
  if (plotW < 40 || plotH < 60) return true
  const volH = Math.round(plotH * 0.23)
  const giaH = plotH - volH - 12
  const yVol = pT + giaH + 12
  const khe = kep(plotW / (nen.length + 1.2), 10, 28)
  const nHien = Math.min(nen.length, Math.max(6, Math.floor(plotW / khe - 1.2)))
  const ds = nen.slice(nen.length - nHien)
  const xCuoi = pL + plotW - khe * 0.85
  const X = (i: number) => xCuoi - (nHien - 1 - i) * khe

  // thang đo (làm mượt để trục không giật)
  let lo = 1e9
  let hi = -1e9
  let vm = 1
  ds.forEach((n, i) => {
    const la = i === nHien - 1
    lo = Math.min(lo, la ? hien.l : n.thap)
    hi = Math.max(hi, la ? hien.h : n.cao)
    vm = Math.max(vm, la ? hien.v : n.soCau)
  })
  lo -= 0.9
  hi += 0.9
  if (!hien.yMax) {
    hien.yMin = lo
    hien.yMax = hi
    hien.vMax = vm
  }
  const k2 = itDong ? 1 : 1 - Math.exp(-dt * 5)
  hien.yMin += (lo - hien.yMin) * k2
  hien.yMax += (hi - hien.yMax) * k2
  hien.vMax += (vm - hien.vMax) * k2
  const Y = (v: number) => pT + giaH * (1 - (v - hien.yMin) / (hien.yMax - hien.yMin))
  const tang = hien.c >= cuoi.mo
  const mauGia = tang ? mau.la : mau.do
  const yG = kep(Y(hien.c), pT + 9, pT + giaH - 2)
  const yC = yG + 19 < pT + giaH ? yG + 17 : yG - 17

  // lưới ngang + nhãn trục phải (bỏ nhãn nào đè lên nhãn giá)
  const bien = hien.yMax - hien.yMin
  const buoc = bien > 16 ? 5 : bien > 7 ? 2 : 1
  ctx.font = `500 ${PHONG_SO}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.lineWidth = 1
  for (let v = Math.ceil(hien.yMin / buoc) * buoc; v <= hien.yMax; v += buoc) {
    const y = Math.round(Y(v)) + 0.5
    if (y < pT + 4 || y > pT + giaH - 2) continue
    if (coLuoi) {
      ctx.strokeStyle = mau.luoi
      ctx.beginPath()
      ctx.moveTo(pL, y)
      ctx.lineTo(pL + plotW, y)
      ctx.stroke()
    }
    if (Math.abs(y - yG) > 14 && Math.abs(y - yC) > 10) {
      ctx.fillStyle = mau['chu-mo']
      ctx.fillText(`${v} %`, pL + plotW + 8, y)
    }
  }
  // lưới dọc + nhãn giờ
  const moiMoc = khe * 6 >= 62 ? 30 * PHUT : 60 * PHUT
  ctx.textAlign = 'center'
  ds.forEach((n, i) => {
    if (n.tu % moiMoc) return
    const x = Math.round(X(i)) + 0.5
    if (x < pL + 18) return
    if (coLuoi) {
      ctx.strokeStyle = mau.luoi
      ctx.beginPath()
      ctx.moveTo(x, pT)
      ctx.lineTo(x, pT + plotH)
      ctx.stroke()
    }
    ctx.fillStyle = mau['chu-mo']
    ctx.fillText(gioPhutMs(n.tu), x, h - 8)
  })
  // vạch ngăn + nhãn cột số câu
  ctx.strokeStyle = mau.vien
  ctx.beginPath()
  ctx.moveTo(pL, yVol - 5.5)
  ctx.lineTo(pL + plotW, yVol - 5.5)
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.fillStyle = mau['chu-mo']
  ctx.fillText(`${Math.round(hien.vMax)} câu`, pL + plotW + 8, yVol + 5)
  // cột số câu + nến
  const rong = Math.max(3, Math.round(khe * 0.62))
  ds.forEach((n, i) => {
    const la = i === nHien - 1
    const x = X(i)
    const c = la ? hien.c : n.dong
    const hh = la ? hien.h : n.cao
    const ll = la ? hien.l : n.thap
    const v = la ? hien.v : n.soCau
    const vh = Math.max(1.5, (v / hien.vMax) * (volH - 2))
    ctx.fillStyle = phaMau(mau.duong, la ? 0.95 : 0.42)
    hcnBo(ctx, Math.round(x - rong / 2), yVol + volH - vh, rong, vh, 2)
    ctx.fill()
    const m = c >= n.mo ? mau.la : mau.do
    const xr = Math.round(x) + 0.5
    ctx.strokeStyle = m
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.moveTo(xr, Y(hh))
    ctx.lineTo(xr, Y(ll))
    ctx.stroke()
    const y1 = Y(Math.max(n.mo, c))
    const y2 = Y(Math.min(n.mo, c))
    ctx.fillStyle = m
    hcnBo(ctx, Math.round(x - rong / 2), y1, rong, Math.max(1.5, y2 - y1), 2)
    ctx.fill()
  })
  // đường trung bình 7 nến
  ctx.beginPath()
  let daMo = false
  ds.forEach((_, i) => {
    const gi = nen.length - nHien + i
    if (gi < 6) return
    let s = 0
    for (let j = gi - 6; j <= gi; j++) s += j === nen.length - 1 ? hien.c : nen[j]!.dong
    const y = Y(s / 7)
    if (daMo) ctx.lineTo(X(i), y)
    else {
      ctx.moveTo(X(i), y)
      daMo = true
    }
  })
  ctx.strokeStyle = phaMau(mau.duong, 0.9)
  ctx.lineWidth = 1.4
  ctx.lineJoin = 'round'
  ctx.stroke()
  // vạch giá hiện tại + nhãn giá bám theo
  ctx.setLineDash([3, 3])
  ctx.strokeStyle = phaMau(mauGia, 0.75)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pL, Math.round(yG) + 0.5)
  ctx.lineTo(pL + plotW, Math.round(yG) + 0.5)
  ctx.stroke()
  ctx.setLineDash([])
  if (!itDong) {
    const ph = (nhipMs / 1800) % 1
    ctx.beginPath()
    ctx.arc(xCuoi, yG, 3 + ph * 7, 0, 7)
    ctx.strokeStyle = phaMau(mauGia, 0.5 * (1 - ph))
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.fillStyle = mauGia
  hcnBo(ctx, pL + plotW + 3, yG - 9, pR - 5, 18, 5)
  ctx.fill()
  ctx.fillStyle = mau['tren-gia']
  ctx.font = `600 ${PHONG_SO}`
  ctx.textAlign = 'center'
  ctx.fillText(`${phay(hien.c, 1)} %`, pL + plotW + 3 + (pR - 5) / 2, yG + 0.5)
  ctx.fillStyle = mau['chu-phu']
  ctx.font = `500 ${PHONG_SO}`
  ctx.fillText(`còn ${conLai(cuoi.tu + NEN_MS, nowMs)}`, pL + plotW + 3 + (pR - 5) / 2, yC)
  return true
}

export function NenHoc({ nen, nowMs, mau, phienBanMau, itDong, dienThoai = false }: { nen: readonly NenSan[]; nowMs: number; mau: MauSan; phienBanMau: number; itDong: boolean; dienThoai?: boolean }) {
  const hopRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const kt = useKichThuoc(hopRef)
  const hien = useRef<Hien>({ c: 0, h: 0, l: 0, v: 0, yMin: 0, yMax: 0, vMax: 0, soNen: -1, batDau: 0 })
  const tuoi = useRef({ nen, nowMs, mau, itDong, dienThoai })
  tuoi.current = { nen, nowMs, mau, itDong, dienThoai }
  const cuoi = nen[nen.length - 1]

  // vẽ tĩnh khi dữ liệu / màu / kích thước / giờ đổi
  useEffect(() => {
    const cv = cvRef.current
    if (cv) veNen(cv, nen, nowMs, hien.current, mau, 0, itDong, 0, !dienThoai)
  }, [nen, nowMs, mau, phienBanMau, itDong, dienThoai, kt.w, kt.h])

  // nội suy mượt + vòng nhấp nháy: chỉ khi được phép chuyển động và tab đang hiện
  useEffect(() => {
    if (itDong) return
    let id = 0
    let truoc = performance.now()
    const buoc = (t: number) => {
      const dt = Math.min(0.1, Math.max(0, (t - truoc) / 1000))
      truoc = t
      const cv = cvRef.current
      const s = tuoi.current
      if (cv && !document.hidden) veNen(cv, s.nen, s.nowMs, hien.current, s.mau, dt, s.itDong, t, !s.dienThoai)
      id = requestAnimationFrame(buoc)
    }
    id = requestAnimationFrame(buoc)
    return () => cancelAnimationFrame(id)
  }, [itDong])

  return (
    <article className="bts-the bts-the-nen" data-khoi="nen">
      <div className="bts-the-dau">
        <h2 className="bts-ten">Nhịp học trực tiếp</h2>
        {cuoi && (
          <div className="bts-ohlc bts-so" id="bts-ohlc" data-khoi="ohlc">
            Mở <b>{phay(cuoi.mo)}</b> · Cao <b>{phay(cuoi.cao)}</b> · Thấp <b>{phay(cuoi.thap)}</b> · Hiện <b>{phay(cuoi.dong)} %</b> · <b>{cuoi.soCau}</b> câu
          </div>
        )}
      </div>
      <div className="bts-ve" ref={hopRef}>
        <canvas ref={cvRef} role="img" aria-label="Biểu đồ nến tỉ lệ đúng trong từng khung 5 phút, kèm cột số câu" aria-describedby="bts-ohlc" />
      </div>
      <div className="bts-chu-giai">
        <span>Mỗi nến 5 phút · tỉ lệ đúng trong 5 phút (khác ô “Tỉ lệ đúng” cả ngày)</span>
        <span>
          <i className="bts-cg bts-cg-la" />
          Nến xanh: tăng trong 5 phút
        </span>
        <span>
          <i className="bts-cg bts-cg-do" />
          Nến đỏ: giảm
        </span>
        <span>
          <i className="bts-cg bts-cg-duong" />
          Cột: số câu
        </span>
        <span>
          <i className="bts-cg bts-cg-duong-ke" />
          Đường mảnh: trung bình 7 nến
        </span>
      </div>
    </article>
  )
}
