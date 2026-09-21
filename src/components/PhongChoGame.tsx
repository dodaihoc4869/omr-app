import React, { useEffect, useRef, useState } from 'react'
import LogoHocSinh from './LogoHocSinh'
import { laManThi } from './m3'
import './m3/vao-thi.css'

interface PhongChoGameProps {
  cho?: {
    thoiGianPhut?: number
    tenCa?: string
    lop?: string
  } | null
  loiCho?: string | null
}

interface AtomItem {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  symbol: string
  name: string
  color: string
  score: number
  fact: string
}

const KHO_NGUYEN_TU = [
  { symbol: 'H₂O', name: 'Nước', score: 20, fact: 'H₂O tạo liên kết hydro liên phân tử' },
  { symbol: 'e⁻', name: 'Electron', score: 10, fact: 'Khối lượng me ≈ 9.109 × 10⁻³¹ kg' },
  { symbol: 'p⁺', name: 'Proton', score: 10, fact: 'Số hạt proton quy định số hiệu Z' },
  { symbol: 'CO₂', name: 'Khí carbonic', score: 25, fact: 'CO₂ làm đục nước vôi trong Ca(OH)₂' },
  { symbol: 'C₂H₅OH', name: 'Ethanol', score: 30, fact: 'Ethanol phản ứng với Na giải phóng khí H₂' },
  { symbol: 'CH₃COOC₂H₅', name: 'Ethyl acetate', score: 50, fact: 'Este có mùi thơm quả chín đặc trưng' },
  { symbol: 'Fe³⁺', name: 'Ion sắt(III)', score: 35, fact: 'Dung dịch FeCl₃ tác dụng với kiềm cho kết tủa nâu đỏ' },
]

export default function PhongChoGame({ cho, loiCho }: PhongChoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [diemSo, setDiemSo] = useState(0)
  const [caoDo, setCaoDo] = useState(3200)
  const [meoHoaHoc, setMeoHoaHoc] = useState('Dùng phím ← → hoặc chạm/kéo để điều khiển phi công nhặt hạt nguyên tử!')

  // Trạng thái điều khiển
  const gameRef = useRef({
    playerX: 200,
    playerY: 180,
    targetX: 200,
    atoms: [] as AtomItem[],
    nextAtomId: 1,
    diem: 0,
    altitude: 3200,
    isRunning: true,
  })

  // Đếm giảm độ cao nhảy dù theo phong cách Free Fire
  useEffect(() => {
    const timer = setInterval(() => {
      setCaoDo((prev) => {
        if (prev <= 250) return 3200 // lặp lại vòng nhảy
        return prev - 8
      })
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // Khởi tạo và chạy Canvas game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const handleResize = () => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * (window.devicePixelRatio || 1)
      canvas.height = rect.height * (window.devicePixelRatio || 1)
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Lấy màu từ CSS tokens
    const computed = getComputedStyle(document.documentElement)
    const mauXanh = computed.getPropertyValue('--gg-xanh').trim() || 'rgb(66, 133, 244)'
    const mauDo = computed.getPropertyValue('--gg-do').trim() || 'rgb(234, 67, 53)'
    const mauVang = computed.getPropertyValue('--gg-vang').trim() || 'rgb(251, 188, 4)'
    const mauLuc = computed.getPropertyValue('--gg-luc').trim() || 'rgb(52, 168, 83)'

    const colors = [mauXanh, mauDo, mauVang, mauLuc]

    // Khởi tạo các hạt nguyên tử
    const spawnAtom = () => {
      const g = gameRef.current
      if (g.atoms.length >= 7) return
      const template = KHO_NGUYEN_TU[Math.floor(Math.random() * KHO_NGUYEN_TU.length)]
      const c = colors[Math.floor(Math.random() * colors.length)]
      const w = canvas.getBoundingClientRect().width || 360

      g.atoms.push({
        id: g.nextAtomId++,
        x: Math.random() * (w - 60) + 30,
        y: (canvas.getBoundingClientRect().height || 260) + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 1.8 + 1.2), // bay từ dưới lên như phi công đang rơi xuống
        symbol: template.symbol,
        name: template.name,
        color: c,
        score: template.score,
        fact: template.fact,
      })
    }

    let lastSpawn = 0

    // Vòng lặp game
    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const g = gameRef.current

      ctx.clearRect(0, 0, w, h)

      // 1. Vẽ mây bay ngang và dọc (hiệu ứng Free Fire nhảy dù)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      const mOffset = (time * 0.05) % 100
      ctx.beginPath()
      ctx.arc(40 + mOffset, 40, 24, 0, Math.PI * 2)
      ctx.arc(70 + mOffset, 35, 32, 0, Math.PI * 2)
      ctx.arc(100 + mOffset, 42, 20, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(w - 60 - mOffset, 120, 28, 0, Math.PI * 2)
      ctx.arc(w - 90 - mOffset, 115, 36, 0, Math.PI * 2)
      ctx.fill()

      // 2. Cập nhật vị trí nhân vật (smooth lerp)
      g.playerX += (g.targetX - g.playerX) * 0.12

      // Giới hạn trong biên canvas
      if (g.playerX < 35) g.playerX = 35
      if (g.playerX > w - 35) g.playerX = w - 35

      const px = g.playerX
      const py = 75 // vị trí người nhảy dù lơ lửng ở nửa trên

      // 3. Vẽ dù Free Fire phong cách Google 4 màu
      const sway = Math.sin(time * 0.003) * 6
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate((sway * Math.PI) / 180)

      // Vòm dù (4 múi 4 màu Google)
      const domeR = 34
      const segWidth = (domeR * 2) / 4

      // Múi 1: Xanh dương
      ctx.fillStyle = mauXanh
      ctx.beginPath()
      ctx.moveTo(-domeR, 0)
      ctx.quadraticCurveTo(-domeR * 0.8, -domeR * 0.9, -domeR + segWidth, -domeR * 0.85)
      ctx.lineTo(-domeR + segWidth, 0)
      ctx.closePath()
      ctx.fill()

      // Múi 2: Đỏ
      ctx.fillStyle = mauDo
      ctx.beginPath()
      ctx.moveTo(-domeR + segWidth, 0)
      ctx.lineTo(-domeR + segWidth, -domeR * 0.85)
      ctx.quadraticCurveTo(0, -domeR * 1.05, 0, -domeR * 0.95)
      ctx.lineTo(0, 0)
      ctx.closePath()
      ctx.fill()

      // Múi 3: Vàng
      ctx.fillStyle = mauVang
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -domeR * 0.95)
      ctx.quadraticCurveTo(domeR * 0.5, -domeR * 0.95, segWidth, -domeR * 0.85)
      ctx.lineTo(segWidth, 0)
      ctx.closePath()
      ctx.fill()

      // Múi 4: Lục
      ctx.fillStyle = mauLuc
      ctx.beginPath()
      ctx.moveTo(segWidth, 0)
      ctx.lineTo(segWidth, -domeR * 0.85)
      ctx.quadraticCurveTo(domeR * 0.8, -domeR * 0.9, domeR, 0)
      ctx.closePath()
      ctx.fill()

      // Dây dù
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(-domeR, 0)
      ctx.lineTo(0, 32)
      ctx.moveTo(-domeR + segWidth, 0)
      ctx.lineTo(0, 32)
      ctx.moveTo(segWidth, 0)
      ctx.lineTo(0, 32)
      ctx.moveTo(domeR, 0)
      ctx.lineTo(0, 32)
      ctx.stroke()

      // Nhân vật học sinh nhảy dù (Avatar tròn vui nhộn)
      ctx.fillStyle = 'rgb(30, 41, 59)'
      ctx.beginPath()
      ctx.arc(0, 36, 8, 0, Math.PI * 2) // đầu
      ctx.fill()

      // Balo nhảy dù Free Fire
      ctx.fillStyle = mauXanh
      ctx.fillRect(-6, 42, 12, 14)

      // Kính bảo hộ Google
      ctx.fillStyle = mauVang
      ctx.fillRect(-4, 34, 8, 3)

      ctx.restore()

      // 4. Sinh và cập nhật hạt nguyên tử
      if (time - lastSpawn > 1100) {
        spawnAtom()
        lastSpawn = time
      }

      for (let i = g.atoms.length - 1; i >= 0; i--) {
        const atom = g.atoms[i]
        atom.x += atom.vx
        atom.y += atom.vy

        // Vẽ bong bóng nguyên tử
        ctx.save()
        ctx.fillStyle = atom.color
        ctx.shadowColor = atom.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(atom.x, atom.y, 18, 0, Math.PI * 2)
        ctx.fill()

        // Viền bóng
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Ký hiệu hoá học
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgb(255, 255, 255)'
        ctx.font = 'bold 11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(atom.symbol, atom.x, atom.y)
        ctx.restore()

        // Kiểm tra va chạm với phi công
        const dist = Math.hypot(atom.x - px, atom.y - (py + 36))
        if (dist < 34) {
          // Ăn điểm!
          g.diem += atom.score
          setDiemSo(g.diem)
          setMeoHoaHoc(`🎉 +${atom.score}đ: ${atom.fact}`)
          g.atoms.splice(i, 1)
          continue
        }

        // Xoá nếu đã bay quá đỉnh canvas
        if (atom.y < -30) {
          g.atoms.splice(i, 1)
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    // Xử lý sự kiện bàn phím & chuột
    const handleKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        g.targetX -= 35
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        g.targetX += 35
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Xử lý kéo / chạm trực tiếp trên canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    gameRef.current.targetX = x
  }

  const phong = (
    <div className="w-full flex flex-col items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden text-center transition">
        {/* Thanh tiêu đề Free Fire X Google Parachute */}
        <div className="m3-phong-cho-dau bg-gradient-to-r from-blue-600 via-emerald-600 to-indigo-600 p-3.5 text-white flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>PHÒNG CHỜ THI TRỰC TUYẾN</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono">
            <span>Cao độ:</span>
            <span className="text-amber-300 font-bold">{caoDo}m</span>
          </div>
        </div>

        {/* Khung Canvas Mini-Game Nhảy dù thu thập nguyên tử */}
        <div className="relative w-full h-[220px] bg-gradient-to-b from-sky-100 via-blue-50 to-emerald-50 dark:from-slate-950 dark:via-blue-950/40 dark:to-slate-900 overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
          />

          {/* Huy hiệu điểm số góc trên canvas */}
          <div className="absolute top-2.5 left-3 flex items-center gap-2 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-xs text-xs font-bold text-slate-800 dark:text-slate-100">
            <span>Điểm nguyên tử:</span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">{diemSo}</span>
          </div>

          {/* Hướng dẫn tương tác nhỏ */}
          <div className="absolute bottom-2 inset-x-3 pointer-events-none">
            <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs text-[11px] text-slate-700 dark:text-slate-200 line-clamp-1 font-medium">
              {meoHoaHoc}
            </div>
          </div>
        </div>

        {/* Thông tin phòng chờ bắt buộc theo kiểm thử */}
        <div className="p-5 flex flex-col items-center">
          <div className="flex justify-center mb-3">
            <LogoHocSinh size={44} hienChu={false} />
          </div>

          {/* Chuỗi văn bản bắt buộc: Đang chờ Thầy bấm bắt đầu */}
          <div
            className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight"
            style={{ fontFamily: 'var(--serif)' }}
          >
            Đang chờ Thầy bấm bắt đầu
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xs">
            Em giữ nguyên màn hình này. Đề hiện ra ngay khi Thầy bắt đầu.
            {cho?.thoiGianPhut ? ` Bài làm trong ${cho.thoiGianPhut} phút, đồng hồ chạy từ lúc đó.` : ''}
          </div>

          {cho?.tenCa && (
            <div className="mt-3 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/60 dark:border-blue-800/60">
              Ca thi: {cho.tenCa} {cho.lop ? `· Lớp ${cho.lop}` : ''}
            </div>
          )}

          {loiCho && (
            <div className="mt-3 w-full p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
              {loiCho}
            </div>
          )}
        </div>
      </div>
    </div>
  )
  // chỉ ở màn thi của em mới tự mang `m3` (xem MaCaInput)
  return laManThi() ? <div className="m3">{phong}</div> : phong
}
