import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, Sparkles } from 'lucide-react'

const HAT = [
  { symbol: 'H₂O', name: 'Nước', score: 20, fact: 'Giữa các phân tử nước có thể hình thành liên kết hydrogen.' },
  { symbol: 'e⁻', name: 'Electron', score: 10, fact: 'Electron mang điện tích âm và chuyển động quanh hạt nhân.' },
  { symbol: 'p⁺', name: 'Proton', score: 10, fact: 'Số proton trong hạt nhân bằng số hiệu nguyên tử Z.' },
  { symbol: 'CO₂', name: 'Carbon dioxide', score: 25, fact: 'Dẫn CO₂ vào nước vôi trong dư sẽ tạo kết tủa trắng.' },
  { symbol: 'C₂H₅OH', name: 'Ethanol', score: 30, fact: 'Ethanol phản ứng với sodium, giải phóng khí hydrogen.' },
  { symbol: 'Fe³⁺', name: 'Ion sắt(III)', score: 35, fact: 'Ion Fe³⁺ gặp ion OH⁻ tạo kết tủa nâu đỏ Fe(OH)₃.' },
]
type Hat = { x: number; y: number; vx: number; vy: number; t: number; phase: number }
type Pop = { x: number; y: number; life: number; score: number }

export default function ChuyenBay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [diem, setDiem] = useState(0)
  const [nhat, setNhat] = useState(0)
  const [fact, setFact] = useState<{ name: string; text: string } | null>(null)
  const [pause, setPause] = useState(false)
  const [giam, setGiam] = useState(false)
  const dieuKhien = useRef({ target: .5, pause: false, ve: () => {}, dongBo: () => {}, cham: (_x: number, _y: number) => {} })
  dieuKhien.current.pause = pause

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = media.matches
    setGiam(reduced)
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, spawn = 0, elapsed = 0, px = 0
    let score = 0, count = 0
    let atoms: Hat[] = [], pops: Pop[] = []
    const bg = document.createElement('canvas')
    const bc = bg.getContext('2d')!
    const css = getComputedStyle(canvas)
    const ink = css.getPropertyValue('--pc-stage-ink').trim()
    const green = css.getPropertyValue('--pc-accent').trim()
    const sky = css.getPropertyValue('--pc-sky').trim()
    const bottom = css.getPropertyValue('--pc-sky-bottom').trim()
    const hills = [css.getPropertyValue('--pc-hill-far').trim(), css.getPropertyValue('--pc-hill-near').trim()]
    const white = 'rgb(255, 254, 247)', skin = 'rgb(246, 207, 162)', navy = 'rgb(37, 71, 77)', gold = 'rgb(225, 183, 105)'
    const toi = document.documentElement.getAttribute('data-giao-dien') === 'toi'
    const cord = toi ? 'rgba(222, 238, 220, .65)' : 'rgba(37, 71, 77, .35)'

    const cloud = (x: number, y: number, scale: number) => {
      bc.save(); bc.translate(x, y); bc.scale(scale, scale); bc.fillStyle = white; bc.globalAlpha = .48
      bc.beginPath(); bc.ellipse(0, 5, 65, 13, 0, 0, Math.PI * 2); bc.ellipse(-22, -4, 25, 17, 0, 0, Math.PI * 2); bc.ellipse(10, -14, 32, 26, 0, 0, Math.PI * 2); bc.fill(); bc.restore()
    }
    const decor = () => {
      bg.width = Math.ceil(w * dpr); bg.height = Math.ceil(h * dpr); bc.setTransform(dpr, 0, 0, dpr, 0, 0)
      const grad = bc.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, sky); grad.addColorStop(1, bottom); bc.fillStyle = grad; bc.fillRect(0, 0, w, h)
      cloud(w * .08, h * .21, .78); cloud(w * .89, h * .34, .72); cloud(w * .52, h * .7, .35)
      bc.fillStyle = hills[0]; bc.beginPath(); bc.moveTo(0, h * .88); bc.bezierCurveTo(w * .18, h * .63, w * .22, h * .82, w * .4, h * .86); bc.bezierCurveTo(w * .73, h * .96, w * .78, h * .65, w, h * .78); bc.lineTo(w, h); bc.lineTo(0, h); bc.fill()
      bc.fillStyle = hills[1]; bc.beginPath(); bc.moveTo(0, h * .97); bc.bezierCurveTo(w * .25, h * .81, w * .58, h * 1.13, w, h * .91); bc.lineTo(w, h); bc.lineTo(0, h); bc.fill()
      // Một phòng thí nghiệm nhỏ trên đường chân trời.
      const x = w * .84, y = h * .88; bc.fillStyle = white; bc.fillRect(x - 10, y - 24, 20, 27); bc.fillRect(x + 12, y - 16, 15, 19)
      bc.fillStyle = green; bc.beginPath(); bc.moveTo(x - 14, y - 24); bc.lineTo(x, y - 36); bc.lineTo(x + 14, y - 24); bc.fill(); bc.fillRect(x - 3, y - 15, 6, 8)
    }
    const seed = () => {
      atoms = Array.from({ length: 5 }, (_, i) => ({ x: w * (.13 + i * .18), y: reduced ? h * (.4 + i % 2 * .22) : h * (.46 + i % 3 * .15), vx: (i % 2 ? 1 : -1) * 5, vy: -(23 + i * 3), t: i % HAT.length, phase: i * 1.4 }))
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); w = rect.width; h = rect.height
      if (!w || !h) return
      dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.ceil(w * dpr); canvas.height = Math.ceil(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); px = w * dieuKhien.current.target; decor(); seed(); draw(0)
    }
    const pilot = (x: number, y: number, time: number) => {
      const r = w < 480 ? 40 : 46
      ctx.save(); ctx.translate(x, y); ctx.rotate(reduced ? 0 : Math.sin(time * .85) * .025)
      // Dù vòm có múi, đường may và mép sáng.
      ctx.fillStyle = green; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.bezierCurveTo(-r, -r * 1.05, r, -r * 1.05, r, 0); ctx.quadraticCurveTo(r * .55, -7, r * .34, 0); ctx.quadraticCurveTo(0, -7, -r * .34, 0); ctx.quadraticCurveTo(-r * .65, -7, -r, 0); ctx.fill()
      ctx.fillStyle = white; ctx.beginPath(); ctx.moveTo(-r * .32, 0); ctx.bezierCurveTo(-r * .34, -r * .65, -r * .19, -r * .8, 0, -r * .8); ctx.bezierCurveTo(r * .19, -r * .8, r * .34, -r * .65, r * .32, 0); ctx.quadraticCurveTo(0, -7, -r * .32, 0); ctx.fill()
      ctx.strokeStyle = cord; ctx.lineWidth = 1.2
      for (const a of [-1, -.32, .32, 1]) { ctx.beginPath(); ctx.moveTo(r * a, 0); ctx.lineTo(a * 11, 41); ctx.stroke() }
      // Phi công nhỏ: mũ, kính, áo, balô, tay và chân.
      ctx.lineCap = 'round'; ctx.strokeStyle = toi ? 'rgb(182, 217, 205)' : navy; ctx.lineWidth = 7
      ctx.beginPath(); ctx.moveTo(-5, 65); ctx.lineTo(-10, 81); ctx.moveTo(5, 65); ctx.lineTo(12, 80); ctx.stroke()
      ctx.strokeStyle = skin; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-9, 48); ctx.lineTo(-16, 40); ctx.lineTo(-15, 31); ctx.moveTo(9, 48); ctx.lineTo(16, 40); ctx.lineTo(15, 31); ctx.stroke()
      ctx.fillStyle = gold; ctx.beginPath(); ctx.roundRect(-11, 44, 22, 25, 7); ctx.fill(); ctx.strokeStyle = navy; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, 46); ctx.lineTo(-4, 65); ctx.moveTo(5, 46); ctx.lineTo(4, 65); ctx.stroke()
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, 34, 10, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = white; ctx.beginPath(); ctx.arc(0, 31, 12, Math.PI, Math.PI * 2); ctx.lineTo(12, 34); ctx.lineTo(-12, 34); ctx.fill()
      ctx.fillStyle = navy; ctx.beginPath(); ctx.roundRect(-9, 32, 18, 7, 3); ctx.fill(); ctx.fillStyle = 'rgb(183, 220, 218)'; ctx.fillRect(-6, 34, 4, 2); ctx.fillRect(2, 34, 4, 2)
      ctx.restore()
    }
    const catchAtom = (i: number) => {
      const a = atoms[i], item = HAT[a.t]; score += item.score; count++; setDiem(score); setNhat(count); setFact({ name: item.name, text: item.fact }); pops.push({ x: a.x, y: a.y, life: .7, score: item.score }); atoms.splice(i, 1); if (reduced && !atoms.length) seed()
    }
    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h); ctx.drawImage(bg, 0, 0, w, h)
      const py = h < 330 ? 72 : 89
      px += (w * dieuKhien.current.target - px) * (reduced ? 1 : Math.min(1, dt * 11))
      px = Math.max(48, Math.min(w - 48, px)); spawn += dt; elapsed += dt
      if (dt && spawn > 1.9 && atoms.length < 6) { spawn = 0; atoms.push({ x: 36 + Math.random() * (w - 72), y: h + 30, vx: Math.random() * 8 - 4, vy: -28 - Math.random() * 12, t: Math.floor(Math.random() * HAT.length), phase: Math.random() * 5 }) }
      for (let i = atoms.length - 1; i >= 0; i--) {
        const a = atoms[i], item = HAT[a.t]; a.y += a.vy * dt; a.x += a.vx * dt
        if (a.x < 35 || a.x > w - 35) a.vx *= -1
        if (a.y < -40) { atoms.splice(i, 1); continue }
        const aw = item.symbol.length > 4 ? 78 : 52
        ctx.save(); ctx.translate(a.x, a.y); ctx.fillStyle = white; ctx.globalAlpha = .94
        ctx.beginPath(); ctx.roundRect(-aw / 2, -23, aw, 46, 23); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(73, 120, 119, .25)'; ctx.lineWidth = 1; ctx.stroke()
        ctx.fillStyle = ink; ctx.font = '600 15px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.symbol, 0, 0)
        ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(aw / 2 - 4, -16, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        if (dt && Math.hypot(a.x - px, a.y - (py + 43)) < 38) catchAtom(i)
      }
      pilot(px, py, elapsed)
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i]; p.life -= dt; if (p.life <= 0) { pops.splice(i, 1); continue }
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 3); ctx.strokeStyle = gold; ctx.lineWidth = 2
        for (let j = 0; j < 5; j++) { const a = j * Math.PI * .4, r = 12 + (.7 - p.life) * 35; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); ctx.lineTo(p.x + Math.cos(a) * (r + 5), p.y + Math.sin(a) * (r + 5)); ctx.stroke() }
        ctx.fillStyle = ink; ctx.font = '700 18px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`+${p.score}`, p.x, p.y - 24 - (.7 - p.life) * 32); ctx.restore()
      }
    }
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (t - last < 32) return
      const dt = last ? Math.min((t - last) / 1000, .07) : 0; last = t
      if (!dieuKhien.current.pause) draw(dt)
    }
    const sync = () => { cancelAnimationFrame(raf); last = 0; if (!document.hidden && !reduced && !dieuKhien.current.pause) raf = requestAnimationFrame(frame) }
    const preference = () => { reduced = media.matches; setGiam(reduced); seed(); draw(0); sync() }
    dieuKhien.current.ve = () => { if (reduced && !dieuKhien.current.pause) draw(0) }
    dieuKhien.current.dongBo = sync
    dieuKhien.current.cham = (x, y) => { if (!reduced || dieuKhien.current.pause) return; for (let i = atoms.length - 1; i >= 0; i--) if (Math.hypot(atoms[i].x - x, atoms[i].y - y) < 42) { catchAtom(i); draw(0); break } }
    const observer = new ResizeObserver(resize); observer.observe(canvas); document.addEventListener('visibilitychange', sync); media.addEventListener('change', preference); resize(); sync()
    return () => { cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener('visibilitychange', sync); media.removeEventListener('change', preference) }
  }, [])

  useEffect(() => { dieuKhien.current.dongBo() }, [pause])

  const move = (clientX: number) => { const r = canvasRef.current!.getBoundingClientRect(); dieuKhien.current.target = Math.max(0, Math.min(1, (clientX - r.left) / r.width)); dieuKhien.current.ve() }
  const step = (d: number) => { dieuKhien.current.target = Math.max(0, Math.min(1, dieuKhien.current.target + d)); dieuKhien.current.ve() }
  return <section className="pc-game" aria-label="Mini-game Chuyến bay hóa học">
    <div className="pc-game-head"><div><span className="pc-eyebrow">CHƠI MỘT CHÚT TRONG LÚC CHỜ</span><h2>Chuyến bay hóa học<span>✦</span></h2></div><div className="pc-score"><span>Điểm chơi</span><strong data-diem>{diem}</strong></div></div>
    <div className="pc-scene">
      <canvas ref={canvasRef} aria-label={giam ? 'Chạm vào hạt hóa học để nhặt' : 'Kéo phi công sang trái hoặc phải để nhặt hạt hóa học'} tabIndex={0} onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -.09 : .09) } }} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); const r = e.currentTarget.getBoundingClientRect(); dieuKhien.current.cham(e.clientX - r.left, e.clientY - r.top) }} onPointerMove={e => { if (e.pointerType === 'mouse' || e.buttons) move(e.clientX) }} />
      <div className="pc-flight-tag"><span>✧</span> Bay cùng kiến thức</div>
      <button className="pc-pause" type="button" aria-label={pause ? 'Tiếp tục game' : 'Tạm dừng game'} aria-pressed={pause} onClick={() => setPause(!pause)}>{pause ? <Play size={17} /> : <Pause size={17} />}</button>
      {pause && <div className="pc-paused"><span>Đang nghỉ một chút</span><small>Thầy bắt đầu thì em vẫn vào bài bình thường.</small></div>}
      <div className="pc-scene-bottom"><span>{giam ? 'Chạm vào từng hạt để khám phá' : 'Chạm và kéo để nhặt hạt'}</span><span className="pc-dots" aria-label={`Đã nhặt ${nhat} hạt`}>{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < (nhat % 5 || (nhat > 0 ? 5 : 0)) ? 'pc-dot-filled' : ''} />)}</span></div>
    </div>
    <div className="pc-discovery" aria-live="polite"><span className="pc-discovery-icon"><Sparkles size={19} /></span><div><strong>{fact ? `Vừa khám phá · ${fact.name}` : 'Mỗi hạt, một điều thú vị'}</strong><p>{fact?.text ?? 'Nhặt một hạt để mở một mẩu kiến thức hóa học.'}</p></div></div>
    <div className="pc-controls"><span>{giam ? 'Chơi bằng cách chạm vào hạt' : 'Kéo trên màn hình hoặc dùng phím ← →'}</span><div><button type="button" aria-label="Bay sang trái" onClick={() => step(-.12)}><ArrowLeft size={18} /></button><button type="button" aria-label="Bay sang phải" onClick={() => step(.12)}><ArrowRight size={18} /></button></div></div>
  </section>
}
