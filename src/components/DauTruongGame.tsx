import { useEffect, useRef, useState } from 'react'
import {
  Gamepad2,
  Play,
  RotateCcw,
  Trophy,
  Zap,
  Radio,
  UserPlus,
  LogOut,
} from 'lucide-react'

export interface NguoiChoiGame {
  sbd: string
  hoTen: string
  mau: string
  x: number
  y: number
  vx: number
  vy: number
  banKinh: number
  song: boolean
  diem: number
  laBot?: boolean
  sanSang: boolean
  thoiGianDash: number
  coKhien: boolean
}

interface VatPhamGame {
  id: string
  loai: 'toc_do' | 'khien' | 'song_kich'
  x: number
  y: number
  banKinh: number
  mau: string
}

interface DauTruongGameProps {
  sbdHienTai: string
  hoTenHienTai: string
  onDong?: () => void
}

// Bảng 12 màu neon Google Material chuẩn RGB
const BANG_MAU_NEON = [
  'rgb(66, 133, 244)', // Google Blue
  'rgb(234, 67, 53)', // Google Red
  'rgb(251, 188, 5)', // Google Yellow
  'rgb(52, 168, 83)', // Google Green
  'rgb(168, 85, 247)', // Purple
  'rgb(236, 72, 153)', // Pink
  'rgb(6, 182, 212)', // Cyan
  'rgb(249, 115, 22)', // Orange
  'rgb(99, 102, 241)', // Indigo
  'rgb(20, 184, 166)', // Teal
  'rgb(244, 63, 94)', // Rose
  'rgb(132, 204, 22)', // Lime
]

const KENH_GAME = 'omr_neon_arena_channel_v1'

export default function DauTruongGame({
  sbdHienTai,
  hoTenHienTai,
  onDong,
}: DauTruongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Trạng thái phòng & kết nối
  const [trangThai, setTrangThai] = useState<'lobby' | 'dang_choi' | 'ket_thuc'>('lobby')
  const [maPhong, setMaPhong] = useState<string>(sbdHienTai || '12001')
  const [sbdNhap, setSbdNhap] = useState('')
  const [_laChuPhong, setLaChuPhong] = useState(true)

  // Danh sách tối đa 12 người chơi
  const [dsNguoiChoi, setDsNguoiChoi] = useState<NguoiChoiGame[]>([
    {
      sbd: sbdHienTai || '12001',
      hoTen: hoTenHienTai || 'Tôi',
      mau: BANG_MAU_NEON[0],
      x: 300,
      y: 300,
      vx: 0,
      vy: 0,
      banKinh: 22,
      song: true,
      diem: 0,
      sanSang: true,
      thoiGianDash: 0,
      coKhien: false,
    },
  ])

  // Vòng bo & vật phẩm
  const [vongBo, setVongBo] = useState({ r: 280, maxR: 280, cx: 300, cy: 300 })
  const [vatPham, setVatPham] = useState<VatPhamGame[]>([])
  const [topRank, setTopRank] = useState<NguoiChoiGame[]>([])

  // Điều khiển
  const phimNhanRef = useRef<{ [key: string]: boolean }>({})
  const joystickRef = useRef<{ active: boolean; startX: number; startY: number; curX: number; curY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
  })

  const broadcastRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastRef.current = new BroadcastChannel(`${KENH_GAME}_${maPhong}`)
        broadcastRef.current.onmessage = (e) => {
          if (e.data.loai === 'join') {
            const playerMoi = e.data.player as NguoiChoiGame
            setDsNguoiChoi((prev) => {
              if (prev.some((p) => p.sbd === playerMoi.sbd) || prev.length >= 12) return prev
              return [...prev, playerMoi]
            })
          } else if (e.data.loai === 'start') {
            setTrangThai('dang_choi')
          } else if (e.data.loai === 'sync') {
            setDsNguoiChoi(e.data.players)
          }
        }
      }
    } catch {
      // ignore
    }

    return () => {
      broadcastRef.current?.close()
    }
  }, [maPhong])

  // Thêm Bot để đủ người chơi (tối đa 12)
  const themBot = () => {
    if (dsNguoiChoi.length >= 12) return
    const idBot = dsNguoiChoi.length + 1
    const tenBot = `Bot Chiến Thần #${idBot}`
    const mauBot = BANG_MAU_NEON[idBot % BANG_MAU_NEON.length]

    const goc = (Math.PI * 2 * dsNguoiChoi.length) / 12
    const kc = 180
    const botMoi: NguoiChoiGame = {
      sbd: `BOT_${String(idBot).padStart(3, '0')}`,
      hoTen: tenBot,
      mau: mauBot,
      x: 300 + Math.cos(goc) * kc,
      y: 300 + Math.sin(goc) * kc,
      vx: 0,
      vy: 0,
      banKinh: 22,
      song: true,
      diem: 0,
      laBot: true,
      sanSang: true,
      thoiGianDash: 0,
      coKhien: false,
    }

    setDsNguoiChoi((prev) => [...prev, botMoi])
  }

  // Vào phòng theo SBD
  const vaoPhongTheoSbd = () => {
    const sbdSach = sbdNhap.trim()
    if (!sbdSach) return
    setMaPhong(sbdSach)
    setLaChuPhong(false)

    // Báo cho chủ phòng
    broadcastRef.current?.postMessage({
      loai: 'join',
      player: dsNguoiChoi[0],
    })
  }

  // Bắt đầu trận đấu
  const batDauTran = () => {
    // Xếp đều vị trí các người chơi trên vòng tròn
    const soLuong = dsNguoiChoi.length
    const cacNguoiChoi = dsNguoiChoi.map((p, idx) => {
      const goc = (Math.PI * 2 * idx) / soLuong
      const r = Math.min(200, vongBo.maxR - 50)
      return {
        ...p,
        x: 300 + Math.cos(goc) * r,
        y: 300 + Math.sin(goc) * r,
        vx: 0,
        vy: 0,
        song: true,
        diem: 0,
        thoiGianDash: 0,
        coKhien: false,
      }
    })

    setDsNguoiChoi(cacNguoiChoi)
    setVongBo({ r: 280, maxR: 280, cx: 300, cy: 300 })
    setVatPham([])
    setTrangThai('dang_choi')

    broadcastRef.current?.postMessage({
      loai: 'start',
      players: cacNguoiChoi,
    })
  }

  // Lướt húc xung kích (Dash)
  function thucHienDash() {
    setDsNguoiChoi((prev) => {
      const nguoi = prev.find((p) => p.sbd === (sbdHienTai || '12001'))
      if (!nguoi || !nguoi.song || nguoi.thoiGianDash > 0) return prev

      const huongX = nguoi.vx !== 0 ? Math.sign(nguoi.vx) : 1
      const huongY = nguoi.vy !== 0 ? Math.sign(nguoi.vy) : 0

      return prev.map((p) => {
        if (p.sbd === nguoi.sbd) {
          return {
            ...p,
            vx: huongX * 16,
            vy: huongY * 16,
            thoiGianDash: 30, // Hồi chiêu 30 frame
          }
        }
        return p
      })
    })
  }

  // Phím bấm máy tính
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      phimNhanRef.current[e.key.toLowerCase()] = true
      if (e.code === 'Space') {
        thucHienDash()
      }
    }
    const onUp = (e: KeyboardEvent) => {
      phimNhanRef.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [dsNguoiChoi])

  // VÒNG LẶP GAME CHÍNH (60 FPS CANVAS)
  useEffect(() => {
    if (trangThai !== 'dang_choi') return
    let animId: number
    let frameCount = 0

    const loop = () => {
      frameCount++
      const cvs = canvasRef.current
      if (!cvs) return
      const ctx = cvs.getContext('2d')
      if (!ctx) return

      // 1. Cập nhật vòng bo co dần
      setVongBo((cu) => {
        const rMoi = Math.max(70, cu.r - 0.04)
        return { ...cu, r: rMoi }
      })

      // 2. Sinh vật phẩm ngẫu nhiên
      if (frameCount % 300 === 0) {
        setVatPham((vp) => {
          if (vp.length >= 4) return vp
          const goc = Math.random() * Math.PI * 2
          const r = Math.random() * (vongBo.r - 40)
          const loaiArr: Array<'toc_do' | 'khien' | 'song_kich'> = ['toc_do', 'khien', 'song_kich']
          const loai = loaiArr[Math.floor(Math.random() * loaiArr.length)]
          const mau = loai === 'toc_do' ? 'rgb(251, 188, 5)' : loai === 'khien' ? 'rgb(6, 182, 212)' : 'rgb(234, 67, 53)'
          return [
            ...vp,
            {
              id: String(Date.now()),
              loai,
              x: 300 + Math.cos(goc) * r,
              y: 300 + Math.sin(goc) * r,
              banKinh: 12,
              mau,
            },
          ]
        })
      }

      // 3. Cập nhật vị trí & vật lý từng người chơi
      setDsNguoiChoi((prevPlayers) => {
        const nextPlayers = prevPlayers.map((p) => {
          if (!p.song) return p

          let ax = 0
          let ay = 0

          if (!p.laBot && p.sbd === (sbdHienTai || '12001')) {
            // Điều khiển bàn phím
            const keys = phimNhanRef.current
            if (keys['arrowup'] || keys['w']) ay -= 1.2
            if (keys['arrowdown'] || keys['s']) ay += 1.2
            if (keys['arrowleft'] || keys['a']) ax -= 1.2
            if (keys['arrowright'] || keys['d']) ax += 1.2

            // Joystick cảm ứng
            const joy = joystickRef.current
            if (joy.active) {
              const dx = joy.curX - joy.startX
              const dy = joy.curY - joy.startY
              const len = Math.hypot(dx, dy)
              if (len > 8) {
                ax += (dx / len) * 1.4
                ay += (dy / len) * 1.4
              }
            }
          } else if (p.laBot) {
            // AI Bot: hướng vào tâm vòng bo hoặc tìm mục tiêu gần nhất
            const dxTam = 300 - p.x
            const dyTam = 300 - p.y
            const distTam = Math.hypot(dxTam, dyTam)

            if (distTam > vongBo.r * 0.7) {
              ax += (dxTam / distTam) * 0.9
              ay += (dyTam / distTam) * 0.9
            } else {
              // Tìm người chơi khác để húc
              const ganNhat = prevPlayers.find((khac) => khac.song && khac.sbd !== p.sbd)
              if (ganNhat) {
                const dxK = ganNhat.x - p.x
                const dyK = ganNhat.y - p.y
                const distK = Math.hypot(dxK, dyK)
                if (distK > 10) {
                  ax += (dxK / distK) * 0.7
                  ay += (dyK / distK) * 0.7
                }
              }
            }
          }

          let vx = (p.vx + ax) * 0.92 // Ma sát
          let vy = (p.vy + ay) * 0.92

          let x = p.x + vx
          let y = p.y + vy

          // Kiểm tra rơi ra ngoài vòng bo (bị loại)
          const distFromCenter = Math.hypot(x - 300, y - 300)
          let song: boolean = p.song
          if (distFromCenter > vongBo.r + p.banKinh) {
            song = false
          }

          const thoiGianDash = Math.max(0, p.thoiGianDash - 1)

          return {
            ...p,
            x,
            y,
            vx,
            vy,
            song,
            thoiGianDash,
          }
        })

        // Va chạm giữa các người chơi (đàn hồi)
        for (let i = 0; i < nextPlayers.length; i++) {
          for (let j = i + 1; j < nextPlayers.length; j++) {
            const p1 = nextPlayers[i]
            const p2 = nextPlayers[j]
            if (!p1.song || !p2.song) continue

            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.hypot(dx, dy)
            const minDist = p1.banKinh + p2.banKinh

            if (dist < minDist && dist > 0) {
              const nx = dx / dist
              const ny = dy / dist

              // Phản lực húc
              const lucHuc = p1.thoiGianDash > 20 ? 14 : p2.thoiGianDash > 20 ? 14 : 7
              p1.vx -= nx * lucHuc
              p1.vy -= ny * lucHuc
              p2.vx += nx * lucHuc
              p2.vy += ny * lucHuc
            }
          }
        }

        // Kiểm tra kết thúc trận đấu (còn lại 1 người sống sót)
        const conSong = nextPlayers.filter((p) => p.song)
        if (conSong.length <= 1 && prevPlayers.filter((p) => p.song).length > 1) {
          setTrangThai('ket_thuc')
          setTopRank(conSong)
        }

        return nextPlayers
      })

      // 4. VẼ CANVAS
      ctx.clearRect(0, 0, 600, 600)

      // Nền vũ trụ tối sâu
      ctx.fillStyle = 'rgb(15, 23, 42)'
      ctx.fillRect(0, 0, 600, 600)

      // Sàn đấu hình tròn
      ctx.beginPath()
      ctx.arc(300, 300, vongBo.maxR, 0, Math.PI * 2)
      ctx.fillStyle = 'rgb(30, 41, 59)'
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.stroke()

      // Vòng bo năng lượng sinh tồn co dần
      ctx.beginPath()
      ctx.arc(300, 300, vongBo.r, 0, Math.PI * 2)
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgb(234, 67, 53)' // Viền đỏ nguy hiểm
      ctx.stroke()
      ctx.fillStyle = 'rgba(234, 67, 53, 0.05)'
      ctx.fill()

      // Vẽ vật phẩm
      vatPham.forEach((vp) => {
        ctx.beginPath()
        ctx.arc(vp.x, vp.y, vp.banKinh, 0, Math.PI * 2)
        ctx.fillStyle = vp.mau
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'white'
        ctx.stroke()
      })

      // Vẽ người chơi
      dsNguoiChoi.forEach((p) => {
        if (!p.song) return

        // Vòng phát sáng Neon
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.banKinh + 4, 0, Math.PI * 2)
        ctx.fillStyle = p.mau.replace('rgb', 'rgba').replace(')', ', 0.3)')
        ctx.fill()

        // Thân quả cầu
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.banKinh, 0, Math.PI * 2)
        ctx.fillStyle = p.mau
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = 'white'
        ctx.stroke()

        // Tên và SBD trên đầu
        ctx.font = 'bold 10px sans-serif'
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.fillText(p.hoTen, p.x, p.y - p.banKinh - 8)
        ctx.font = '9px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillText(`[${p.sbd}]`, p.x, p.y - p.banKinh - 19)

        ctx.restore()
      })

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [trangThai, vongBo.r, vatPham, sbdHienTai])

  const nguoiSongConLai = dsNguoiChoi.filter((p) => p.song).length

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3"
      style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-[700px] rounded-2xl overflow-hidden flex flex-col border shadow-2xl"
        style={{ background: 'var(--the)', borderColor: 'var(--vien)' }}
      >
        {/* HEADER GAME */}
        <div
          className="px-4 py-3 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, rgb(66, 133, 244), rgb(168, 85, 247))' }}
        >
          <div className="flex items-center gap-2">
            <Gamepad2 size={24} />
            <div>
              <div className="font-extrabold text-sm leading-tight tracking-wide">
                ĐẤU TRƯỜNG NEON SINH TỒN
              </div>
              <div className="text-[11px] opacity-90">
                Đại chiến 12 người chơi qua Số Báo Danh (SBD)
              </div>
            </div>
          </div>
          {onDong && (
            <button
              type="button"
              onClick={onDong}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              title="Thoát game"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* NỘI DUNG 1: PHÒNG CHỜ (LOBBY 12 NGƯỜI) */}
        {trangThai === 'lobby' && (
          <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
            <div
              className="p-4 rounded-xl border flex flex-col gap-3"
              style={{ background: 'var(--the-2)', borderColor: 'var(--vien)' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--gg-xanh)' }}>
                  <Radio size={16} />
                  <span>MÃ PHÒNG (SBD CHỦ PHÒNG): <strong>{maPhong}</strong></span>
                </div>
                <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {dsNguoiChoi.length} / 12 Người chơi
                </div>
              </div>

              {/* Vào phòng theo SBD */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sbdNhap}
                  onChange={(e) => setSbdNhap(e.target.value)}
                  placeholder="Nhập SBD bạn bè để vào phòng chung..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={vaoPhongTheoSbd}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95"
                >
                  Vào phòng
                </button>
              </div>
            </div>

            {/* Danh sách người chơi trong phòng (tối đa 12) */}
            <div>
              <div className="text-xs font-bold mb-2 flex items-center justify-between text-slate-500">
                <span>DANH SÁCH CHIẾN BINH ({dsNguoiChoi.length}/12)</span>
                {dsNguoiChoi.length < 12 && (
                  <button
                    type="button"
                    onClick={themBot}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>+ Thêm Bot AI</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {dsNguoiChoi.map((p, idx) => (
                  <div
                    key={p.sbd}
                    className="p-2.5 rounded-xl border flex items-center gap-2.5 shadow-xs"
                    style={{ background: 'var(--the)', borderColor: 'var(--vien)' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ background: p.mau }}
                    >
                      {idx + 1}
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold truncate">{p.hoTen}</div>
                      <div className="text-[10px] opacity-60">SBD: {p.sbd}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hướng dẫn chơi nhanh */}
            <div
              className="p-3 rounded-xl border text-[11.5px] leading-relaxed text-slate-500 flex flex-col gap-1"
              style={{ background: 'var(--the-2)', borderColor: 'var(--vien)' }}
            >
              <div className="font-bold text-slate-700 dark:text-slate-300">🎮 LỐI CHƠI THUẦN GIẢI TRÍ:</div>
              <div>• <strong>Di chuyển:</strong> Dùng phím Mũi tên / WASD hoặc Joystick cảm ứng trên điện thoại.</div>
              <div>• <strong>Chiêu thức Dash:</strong> Bấm phím Space hoặc nút HÚC để húc văng đối thủ ra ngoài mép sàn đấu.</div>
              <div>• <strong>Vòng bo sinh tồn:</strong> Vòng bo năng lượng màu đỏ sẽ co dần, ai bị văng ra ngoài sẽ bị loại!</div>
            </div>

            {/* Nút bấm bắt đầu */}
            <button
              type="button"
              onClick={batDauTran}
              className="w-full py-3 rounded-xl font-extrabold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, rgb(66, 133, 244), rgb(52, 168, 83))' }}
            >
              <Play size={18} />
              <span>BẮT ĐẦU TRẬN ĐẤU (12 CHIẾN BINH)</span>
            </button>
          </div>
        )}

        {/* NỘI DUNG 2: SÀN ĐẤU 60 FPS */}
        {trangThai === 'dang_choi' && (
          <div className="relative flex flex-col items-center p-3 bg-slate-950">
            {/* Thanh thông số trận đấu */}
            <div className="w-full max-w-[600px] flex items-center justify-between text-white text-xs font-bold mb-2 px-2">
              <div className="flex items-center gap-1.5 text-rose-400">
                <Trophy size={16} />
                <span>Còn sống: {nguoiSongConLai} / {dsNguoiChoi.length}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Zap size={16} />
                <span>Bấm SPACE hoặc NÚT HÚC để Dash</span>
              </div>
            </div>

            {/* Khung Canvas Game */}
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="w-full max-w-[500px] aspect-square rounded-2xl border border-slate-800 shadow-2xl touch-none"
            />

            {/* Nút điều khiển cảm ứng cho điện thoại */}
            <div className="w-full max-w-[500px] flex items-center justify-between mt-3 px-2">
              <div
                className="w-24 h-24 rounded-full border-2 border-slate-700 bg-slate-900/60 flex items-center justify-center text-slate-400 text-xs font-bold touch-none select-none"
                onTouchStart={(e) => {
                  const t = e.touches[0]
                  joystickRef.current = { active: true, startX: t.clientX, startY: t.clientY, curX: t.clientX, curY: t.clientY }
                }}
                onTouchMove={(e) => {
                  if (!joystickRef.current.active) return
                  const t = e.touches[0]
                  joystickRef.current.curX = t.clientX
                  joystickRef.current.curY = t.clientY
                }}
                onTouchEnd={() => {
                  joystickRef.current.active = false
                }}
              >
                JOYSTICK
              </div>

              <button
                type="button"
                onClick={thucHienDash}
                className="w-20 h-20 rounded-full font-black text-white text-sm shadow-xl flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, rgb(234, 67, 53), rgb(249, 115, 22))' }}
              >
                <Zap size={22} />
                <span>HÚC</span>
              </button>
            </div>
          </div>
        )}

        {/* NỘI DUNG 3: KẾT THÚC & VINH DANH QUÁN QUÂN */}
        {trangThai === 'ket_thuc' && (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Trophy size={36} />
            </div>

            <div>
              <div className="text-xl font-extrabold" style={{ color: 'var(--muc)' }}>
                🎉 CHIẾN THẮNG SINH TỒN!
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Quán quân Top 1: <strong>{topRank[0]?.hoTen || 'Chiến binh quả cảm'}</strong> (SBD: {topRank[0]?.sbd || '---'})
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={batDauTran}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={15} />
                <span>Chơi lại trận mới</span>
              </button>
              <button
                type="button"
                onClick={() => setTrangThai('lobby')}
                className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Quay về Phòng chờ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
