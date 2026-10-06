import { useEffect, useRef, useState } from 'react'
import './ban-nguyen-to.css'
import { ArrowLeft, ArrowRight, FlaskConical, Pause, Play, Sparkles } from 'lucide-react'
import { dprToiDa, giamHieuUng } from '../../lib/may-yeu'
import { HANG, LOAI_HAT, buoc, chamHat, datKichThuoc, dichTau, taoTrangThai, type TrangThai } from './ban-nguyen-to-loi'

type Pha = 'san-sang' | 'dang-choi' | 'tam-dung'
interface Chup { diem: number; lienTiep: number; gan: number; daKham: number }

const FONT = '"Be Vietnam Pro", sans-serif'
const BINH = 'M-8 -53 L8 -53 L8 -34 L26 -6 Q31 3 24 3 L-24 3 Q-31 3 -26 -6 L-8 -34 Z'
const SONG = 'M-21 -14 Q-10 -19 0 -14 T21 -14 L26 -6 Q31 3 24 3 L-24 3 Q-31 3 -26 -6 Z'
const chupTu = (tt: TrangThai): Chup => ({ diem: tt.diem, lienTiep: tt.lienTiep, gan: tt.gan, daKham: tt.daKham.length })

/** Lớp mỏng: canvas vẽ + React giữ chữ. Luật chơi nằm hết trong ban-nguyen-to-loi.ts. */
export default function BanNguyenTo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pha, setPha] = useState<Pha>('san-sang')
  const [giam, setGiam] = useState(() => giamHieuUng())
  const [khongCanvas, setKhongCanvas] = useState(false)
  const [chup, setChup] = useState<Chup>({ diem: 0, lienTiep: 0, gan: -1, daKham: 0 })
  const dk = useRef({ pha: 'san-sang' as Pha, dongBo: () => {}, ve: () => {}, cham: (_x: number, _y: number) => {}, dich: (_t: number) => {}, buocTau: (_d: number) => {}, giam: giamHieuUng() })
  dk.current.pha = pha

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let ctxThu: CanvasRenderingContext2D | null = null
    try { ctxThu = canvas.getContext('2d') } catch { /* thiếu Canvas: giữ màn chờ, hiện ô dự phòng */ }
    if (!ctxThu) { setKhongCanvas(true); return }
    const ctx = ctxThu
    const rng = Math.random
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, visible = true
    let tt: TrangThai | null = null
    let tgDem = 0, hen = 0
    const bg = document.createElement('canvas')
    const bc = bg.getContext('2d')
    const mau: Record<string, string> = {}
    const docMau = () => {
      const css = getComputedStyle(canvas)
      const lay = (ten: string, du: string) => css.getPropertyValue(ten).trim() || du
      Object.assign(mau, {
        ink: lay('--pc-ink', 'rgb(31, 57, 55)'), accent: lay('--pc-accent', 'rgb(57, 115, 98)'),
        troiTren: lay('--pc-sky', 'rgb(223, 238, 240)'), troiDuoi: lay('--pc-sky-bottom', 'rgb(243, 245, 220)'), page: lay('--pc-page', 'rgb(246, 247, 242)'),
        doiXa: lay('--pc-hill-far', 'rgb(199, 217, 189)'), doiGan: lay('--pc-bn-doi', 'rgb(176, 203, 168)'), may: lay('--pc-bn-may', 'rgba(255, 254, 247, .55)'),
        pill: lay('--pc-bn-pill', 'rgb(255, 254, 247)'), pillInk: lay('--pc-bn-pill-ink', 'rgb(39, 81, 79)'), dan: lay('--pc-bn-dan', 'rgb(214, 165, 72)'),
        binh: lay('--pc-bn-binh', 'rgba(255, 254, 247, .9)'), binhVien: lay('--pc-bn-binh-vien', 'rgb(39, 81, 79)'), bong: lay('--pc-bn-bong', 'rgba(31, 57, 55, .18)'),
        electron: lay('--pc-bn-xanh-duong', 'rgb(86, 142, 196)'), proton: lay('--pc-bn-hong', 'rgb(204, 102, 110)'), 'phan-tu': lay('--pc-bn-luc', 'rgb(57, 115, 98)'), ion: lay('--pc-bn-vang', 'rgb(201, 150, 60)'),
      })
    }
    docMau()

    const veNen = () => {
      if (!bc || !w || !h) return
      bg.width = Math.ceil(w * dpr); bg.height = Math.ceil(h * dpr); bc.setTransform(dpr * w / 340, 0, 0, dpr * h / 352, 0, 0)
      const g = bc.createLinearGradient(0, 0, 0, 352); g.addColorStop(0, mau.troiTren); g.addColorStop(1, mau.troiDuoi); bc.fillStyle = g; bc.fillRect(0, 0, 340, 352)
      bc.fillStyle = mau.may
      for (const [cx, cy, rx, ry] of [[46, 52, 48, 9], [30, 46, 18, 12], [56, 40, 22, 17], [292, 150, 40, 8], [278, 144, 15, 10], [300, 138, 18, 14]]) { bc.beginPath(); bc.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); bc.fill() }
      bc.fillStyle = mau.doiXa; bc.fill(new Path2D('M0 298 C58 262 92 290 150 296 C246 312 286 262 340 282 L340 352 L0 352 Z'))
      bc.fillStyle = mau.pill; bc.fillRect(286, 282, 18, 24); bc.fillRect(306, 290, 13, 16)
      bc.fillStyle = mau.accent; bc.fill(new Path2D('M283 282 L295 271 L307 282 Z')); bc.fillRect(292, 293, 6, 8)
      bc.fillStyle = mau.doiGan; bc.fill(new Path2D('M0 334 C84 304 196 352 340 318 L340 352 L0 352 Z'))
    }

    const veHat = (x: number, y: number, i: number, hp: number, mo: number) => {
      const loai = LOAI_HAT[i], rong = loai.rong
      ctx.save(); ctx.globalAlpha = mo; ctx.translate(x, y)
      ctx.fillStyle = mau.pill; ctx.strokeStyle = mau[loai.nhom]; ctx.lineWidth = 3
      ctx.beginPath(); ctx.roundRect(-rong / 2, -22, rong, 44, 22); ctx.fill(); ctx.stroke()
      ctx.fillStyle = mau.pillInk; ctx.font = `700 16px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(loai.kyHieu, 0, 1)
      ctx.fillStyle = mau[loai.nhom]
      for (let k = 0; k < hp; k++) { ctx.beginPath(); ctx.arc((k - (hp - 1) / 2) * 10, 31, 3, 0, Math.PI * 2); ctx.fill() }
      ctx.restore()
    }
    const veTau = (x: number, y: number) => {
      ctx.save(); ctx.translate(x, y)
      ctx.fillStyle = mau.bong; ctx.beginPath(); ctx.ellipse(0, 6, 26, 5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = mau.binhVien; ctx.beginPath(); ctx.roundRect(-11, -58, 22, 5, 2.5); ctx.fill()
      ctx.fillStyle = mau.binh; ctx.strokeStyle = mau.binhVien; ctx.lineWidth = 2; ctx.lineJoin = 'round'
      const p = new Path2D(BINH); ctx.fill(p); ctx.stroke(p)
      ctx.fillStyle = mau.accent; ctx.fill(new Path2D(SONG))
      ctx.fillStyle = 'rgba(255, 255, 255, .7)'
      for (const [cx, cy, r] of [[-8, -4, 3], [6, -8, 2], [11, -1, 2.4]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = mau.dan; ctx.beginPath(); ctx.arc(0, -61, 3.2, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
    const ve = () => {
      if (!tt || !w || !h) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h)
      if (bc && bg.width) ctx.drawImage(bg, 0, 0, w, h)
      for (const a of tt.hat) veHat(a.x, a.y, a.loai, a.hp, Math.max(0, a.mo))
      if (tt.giam && tt.hat[0]) {
        const a = tt.hat[0]
        ctx.save(); ctx.strokeStyle = mau.ink; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(a.x, a.y, 28, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = mau.ink; ctx.beginPath(); ctx.roundRect(a.x - 24, a.y + 36, 48, 20, 10); ctx.fill()
        ctx.fillStyle = mau.page; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Chạm', a.x, a.y + 46); ctx.restore()
      }
      ctx.fillStyle = mau.dan
      for (const d of tt.dan) { ctx.beginPath(); ctx.roundRect(d.x - 2, d.y - HANG.nuaDan, 4, 18, 2); ctx.fill() }
      for (const v of tt.vatPham) {
        ctx.save(); ctx.translate(v.x, v.y); ctx.fillStyle = mau.pill; ctx.strokeStyle = mau.dan; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        ctx.strokeStyle = mau.pillInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.6, 0.5, 0, Math.PI * 2); ctx.ellipse(0, 0, 9, 3.6, -0.5, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
      }
      for (const t of tt.tia) {
        const k = t.tuoi / HANG.tuoiTiaVo
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.strokeStyle = mau.dan; ctx.lineWidth = 2
        const r = 17 + k * 10; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.stroke()
        for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3; ctx.beginPath(); ctx.moveTo(t.x + Math.cos(a) * (r + 7), t.y + Math.sin(a) * (r + 7)); ctx.lineTo(t.x + Math.cos(a) * (r + 14), t.y + Math.sin(a) * (r + 14)); ctx.stroke() }
        ctx.fillStyle = mau.pillInk; ctx.font = `700 16px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(`+${t.diem}`, t.x, t.y - 26 - k * 22); ctx.restore()
      }
      if (!tt.giam) veTau(tt.tauX, tt.tauY)
      if (tt.xucTacCon > 0) {
        ctx.save(); ctx.translate(10, 44); ctx.fillStyle = mau.pill; ctx.strokeStyle = mau.dan; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.roundRect(0, 0, 104, 28, 14); ctx.fill(); ctx.stroke()
        ctx.fillStyle = mau.pillInk; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('Xúc tác', 12, 14)
        ctx.fillStyle = mau.dan; ctx.beginPath(); ctx.roundRect(66, 11, 28 * tt.xucTacCon / HANG.xucTacGiay, 6, 3); ctx.fill(); ctx.restore()
      }
    }
    const dongBoChup = () => {
      if (!tt) return
      if (tt.bien === tgDem) return
      tgDem = tt.bien; setChup(chupTu(tt))
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (t - last < 32) return
      const dt = last ? Math.min((t - last) / 1000, .07) : 0; last = t
      if (!tt || !dt) return
      buoc(tt, dt, rng); ve(); dongBoChup()
    }
    const chay = () => !document.hidden && visible && !dk.current.giam && dk.current.pha === 'dang-choi'
    const sync = () => { cancelAnimationFrame(raf); last = 0; if (chay()) raf = requestAnimationFrame(frame) }

    const datLai = (giamMoi: boolean) => {
      dk.current.giam = giamMoi; setGiam(giamMoi)
      tt = taoTrangThai(w || 340, h || 352, giamMoi, rng); tgDem = 0; setChup(chupTu(tt)); ve(); sync()
    }
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      w = r.width; h = r.height; dpr = dprToiDa(1.5); canvas.width = Math.ceil(w * dpr); canvas.height = Math.ceil(h * dpr)
      if (!tt) tt = taoTrangThai(w, h, dk.current.giam, rng); else datKichThuoc(tt, w, h)
      veNen(); ve()
    }
    const doiNen = () => { docMau(); veNen(); ve() }
    const doiGiam = () => { const g = giamHieuUng(); if (g !== dk.current.giam) datLai(g) }

    dk.current.ve = () => { ve() }
    dk.current.dongBo = () => { sync(); ve() }
    dk.current.dich = (ty) => { if (tt) { dichTau(tt, ty); if (!chay()) { buoc(tt, 1e-6, rng); ve() } } }
    dk.current.buocTau = (d) => { if (tt) dk.current.dich(tt.mucTieu + d) }
    dk.current.cham = (x, y) => {
      if (tt && tt.giam && dk.current.pha !== 'tam-dung' && chamHat(tt, x, y, rng)) {
        ve(); dongBoChup()
        // Giảm chuyển động không có vòng lặp: tia vỡ tự tắt sau một nhịp ngắn.
        clearTimeout(hen); hen = window.setTimeout(() => { if (tt) { tt.tia.length = 0; ve() } }, 700)
      }
    }

    const themeMedia = matchMedia('(prefers-color-scheme: dark)')
    const rootObserver = new MutationObserver(() => { doiNen(); doiGiam() })
    rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-giao-dien', 'class'] })
    const viewportObserver = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() }) : null
    viewportObserver?.observe(canvas)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(canvas); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', sync)
    media.addEventListener('change', doiGiam); themeMedia.addEventListener('change', doiNen)
    resize(); sync()
    return () => {
      cancelAnimationFrame(raf); clearTimeout(hen); observer?.disconnect(); viewportObserver?.disconnect(); rootObserver.disconnect()
      window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', sync)
      media.removeEventListener('change', doiGiam); themeMedia.removeEventListener('change', doiNen)
      dk.current.dongBo = () => {}; dk.current.ve = () => {}; dk.current.cham = () => {}; dk.current.dich = () => {}; dk.current.buocTau = () => {}
    }
  }, [])

  useEffect(() => { dk.current.dongBo() }, [pha])

  const dangChoi = pha === 'dang-choi'
  const ganLoai = chup.gan >= 0 ? LOAI_HAT[chup.gan] : null
  const tyLe = (clientX: number) => { const r = canvasRef.current!.getBoundingClientRect(); return (clientX - r.left) / r.width }
  const doiPha = () => setPha(pha === 'dang-choi' ? 'tam-dung' : 'dang-choi')
  const goiY = giam ? 'Chạm vào từng hạt để bắn' : pha === 'tam-dung' ? 'Đang tạm dừng' : 'Kéo để di chuyển'
  const nhanCanvas = giam ? 'Sân chơi: các hạt đứng yên, chạm vào hạt để bắn vỡ' : 'Sân chơi: tàu ở dưới cùng tự bắn lên các hạt hóa học, kéo sang trái hoặc phải để dời tàu'

  return <section className="pc-bn" aria-label="Mini-game Bắn nguyên tố">
    <div className="pc-bn-head">
      <div><div className="pc-bn-eyebrow">CHƠI MỘT CHÚT TRONG LÚC CHỜ</div><h2>Bắn nguyên tố</h2></div>
      <div className="pc-bn-score"><span>Điểm chơi</span><strong data-diem>{chup.diem}</strong></div>
    </div>
    <div className="pc-bn-scene">
      {khongCanvas && <div className="pc-bn-fallback"><FlaskConical size={48} /><span>Một chút thư giãn trước giờ học</span></div>}
      <canvas ref={canvasRef} aria-label={nhanCanvas} tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); dk.current.buocTau(e.key === 'ArrowLeft' ? -.09 : .09) }
          else if (e.key === ' ' && pha !== 'san-sang') { e.preventDefault(); doiPha() }
        }}
        onPointerDown={e => {
          try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* bỏ qua */ }
          dk.current.dich(tyLe(e.clientX)); const r = e.currentTarget.getBoundingClientRect(); dk.current.cham(e.clientX - r.left, e.clientY - r.top)
        }}
        onPointerMove={e => { if (e.pointerType === 'mouse' || e.buttons) dk.current.dich(tyLe(e.clientX)) }} />
      {!giam && dangChoi && chup.lienTiep > 1 && <span className="pc-bn-combo">Liên tiếp ×{chup.lienTiep}</span>}
      {pha !== 'san-sang' && <button className="pc-bn-pause" type="button" aria-label={pha === 'tam-dung' ? 'Tiếp tục game' : 'Tạm dừng game'} aria-pressed={pha === 'tam-dung'} onClick={doiPha}>{pha === 'tam-dung' ? <Play size={18} /> : <Pause size={18} />}</button>}
      <div className="pc-bn-bottom"><span>{goiY}</span><span className="pc-bn-dots" role="img" aria-label={`Đã khám phá ${chup.daKham} trên ${LOAI_HAT.length} hạt`}>{LOAI_HAT.map((l, i) => <i key={l.ma} className={i < chup.daKham ? 'pc-bn-dot-on' : ''} />)}</span></div>
      {pha === 'san-sang' && !giam && <div className="pc-bn-phu"><strong>Sẵn sàng?</strong><p>Kéo ngón tay để dời tàu. Tàu tự bắn, em chỉ cần ngắm.</p><button type="button" onClick={() => setPha('dang-choi')}><Play size={16} />Chơi</button></div>}
      {pha === 'tam-dung' && <div className="pc-bn-phu"><strong>Đang nghỉ một chút</strong><p>Thầy bắt đầu thì em vẫn vào bài bình thường.</p><button type="button" onClick={() => setPha('dang-choi')}><Play size={16} />Tiếp tục</button></div>}
    </div>
    <div className="pc-bn-fact" aria-live="polite">
      <span className="pc-bn-fact-icon"><Sparkles size={18} /></span>
      <div><strong>{ganLoai ? `Vừa khám phá · ${ganLoai.ten}` : 'Mỗi hạt, một điều thú vị'}</strong><p>{ganLoai?.dieuThuVi ?? 'Bắn vỡ hạt để đọc điều thú vị về nó.'}</p></div>
    </div>
    <div className="pc-bn-dk">
      <span>{giam ? 'Chơi bằng cách chạm vào hạt' : 'Kéo trên màn hình hoặc dùng phím ← →'}</span>
      {!giam && <div><button type="button" aria-label="Dời tàu sang trái" onClick={() => dk.current.buocTau(-.12)}><ArrowLeft size={20} /></button><button type="button" aria-label="Dời tàu sang phải" onClick={() => dk.current.buocTau(.12)}><ArrowRight size={20} /></button></div>}
    </div>
  </section>
}
