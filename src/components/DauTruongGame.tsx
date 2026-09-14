import { useEffect, useRef, useState } from 'react'
import {
  FlaskConical,
  RotateCcw,
  Trophy,
  Radio,
  LogOut,
  Crosshair,
  PlusCircle,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import {
  DANH_SACH_CAP_DO,
  DANH_SACH_HOA_CHAT,
  DANH_SACH_SUNG,
  HANG_SO_GAME,
  MAP_HOA_CHAT,
  traCuuTuongTac,
} from '../game/dau-truong-hoa-chat/cau-hinh'
import {
  type BanDoMeCung,
  kiemTraVaChamTuong,
  sinhMeCung,
} from '../game/dau-truong-hoa-chat/me-cung'
import { amThanh } from '../game/dau-truong-hoa-chat/am-thanh'
import {
  taoMoHinhCay,
  taoMoHinhChibiCamSung,
  taoMoHinhQuaiVat,
  taoMoHinhBinhMau,
} from '../game/dau-truong-hoa-chat/mo-hinh'
import {
  HeToaDoCamera,
  bienDoiMoHinh,
  veBauTroi,
  veDanhSachKhoi,
  veSungGocNhinThuNhat,
  veTiaDanFreeFire,
} from '../game/dau-truong-hoa-chat/renderer-3d'
import type {
  BinhMauItem,
  CapDo,
  DanSung,
  IdHoaChat,
  Khoi3D,
  LoaiSung,
  NguoiChoiHoaChat,
  QuaiVat,
  ThongBaoPhanUng,
  VetChan,
} from '../game/dau-truong-hoa-chat/types'

export type NguoiChoiGame = NguoiChoiHoaChat

// ═══════════════════════════════════════════════════════
// RAYCASTING ENGINE — 3D FIRST-PERSON VIEW
// Kỹ thuật: Wolfenstein-style DDA raycasting
// ═══════════════════════════════════════════════════════

// Tạo texture gạch nét trực tiếp trên OffscreenCanvas (không cần file ảnh)
function taoBrickTexture(w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4)

  const MORTAR_R = 80, MORTAR_G = 70, MORTAR_B = 60
  const BRICK_ROWS = 4
  const ROW_H = Math.floor(h / BRICK_ROWS)
  const MORTAR = 2

  for (let py = 0; py < h; py++) {
    const row = Math.floor(py / ROW_H)
    const inMortarY = (py % ROW_H) < MORTAR || (py % ROW_H) >= ROW_H - MORTAR

    const bricksPerRow = 4
    const brickW = Math.floor(w / bricksPerRow)
    // Hàng chẵn/lẻ lệch nửa gạch
    const offset = row % 2 === 0 ? 0 : Math.floor(brickW / 2)

    for (let px = 0; px < w; px++) {
      const idx = (py * w + px) * 4
      const localX = (px + offset) % w
      const col = Math.floor(localX / brickW)
      const inMortarX = (localX % brickW) < MORTAR || (localX % brickW) >= brickW - MORTAR

      if (inMortarX || inMortarY) {
        // Mạch vữa
        data[idx + 0] = MORTAR_R
        data[idx + 1] = MORTAR_G
        data[idx + 2] = MORTAR_B
        data[idx + 3] = 255
      } else {
        // Màu gạch: đỏ/cam ấm với biến thiên noise
        const noise = ((px * 3 + py * 7 + col * 31 + row * 17) % 40) - 20
        const base = 200 + noise
        const green = 100 + Math.floor(noise * 0.5)
        const blue = 60 + Math.floor(noise * 0.3)
        data[idx + 0] = Math.max(140, Math.min(255, base))
        data[idx + 1] = Math.max(60, Math.min(150, green))
        data[idx + 2] = Math.max(30, Math.min(100, blue))
        data[idx + 3] = 255
      }
    }
  }
  return new ImageData(data, w, h)
}

// Texture sàn (đá xám nhạt)
function taoFloorTexture(w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4)
  const TILE = 16
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = (py * w + px) * 4
      const tx = Math.floor(px / TILE)
      const ty = Math.floor(py / TILE)
      const onEdgeX = (px % TILE) === 0
      const onEdgeY = (py % TILE) === 0
      const noise = ((px * 5 + py * 11) % 30) - 15
      if (onEdgeX || onEdgeY) {
        data[idx + 0] = 90; data[idx + 1] = 90; data[idx + 2] = 90
      } else {
        const base = ((tx + ty) % 2 === 0 ? 140 : 120) + noise
        data[idx + 0] = base; data[idx + 1] = base; data[idx + 2] = base
      }
      data[idx + 3] = 255
    }
  }
  return new ImageData(data, w, h)
}

const TEX_W = 64
const TEX_H = 64

// Khởi tạo textures (lazy, chỉ 1 lần)
let _brickTex: ImageData | null = null
let _floorTex: ImageData | null = null

function layBrickTex() { if (!_brickTex) _brickTex = taoBrickTexture(TEX_W, TEX_H); return _brickTex }
function layFloorTex() { if (!_floorTex) _floorTex = taoFloorTexture(TEX_W, TEX_H); return _floorTex }

const RAY_FOV = Math.PI / 2.5  // ~72°

// Bộ nhớ cache mô hình cây và mô hình quái/vật phẩm để tối ưu FPS
let _cayModelCache: Khoi3D[] | null = null
function layCayModel(): Khoi3D[] {
  if (!_cayModelCache) _cayModelCache = taoMoHinhCay()
  return _cayModelCache
}

// Vẽ khung hình góc nhìn thứ nhất (FPS 3D) kết hợp Raycasting + 3D Primitives
function veGocNhinThuNhat(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  px: number,
  pz: number,
  yaw: number,
  meCung: BanDoMeCung,
  quaiVat: QuaiVat[],
  binhMau: BinhMauItem[],
  nguoiChoiKhac: NguoiChoiHoaChat[],
  danSung: DanSung[],
  mapHoaChat: Map<IdHoaChat, { mauGame: string }>,
  viTriCay: { x: number; z: number }[] = [],
  vuKhiNguoiChoi: LoaiSung = 'binh_xit',
  mauNguoiChoi = 'rgb(123, 47, 190)',
  recoilShoot = 0
) {
  const brickTex = layBrickTex()
  const floorTex = layFloorTex()

  const N = meCung.kichThuoc
  const canhO = HANG_SO_GAME.CANH_O
  const nuaKT = (N * canhO) / 2

  // ─── 0. BẦU TRỜI NGOÀI TRỜI (BỎ TRẦN BÊ TÔNG TỐI) ───
  veBauTroi(ctx, W, H, yaw)

  // ─── 1. RAYCASTING TƯỜNG & SÀN CỎ/ĐÁ ───
  const RAY_W = Math.ceil(W / 2)  // độ phân giải: mỗi ray = 2px
  const zBuffer = new Float32Array(RAY_W)
  const imgData = ctx.createImageData(W, H)
  const pixels = imgData.data

  // Camera plane vuông góc với hướng nhìn (FOV control)
  const planLen = Math.tan(RAY_FOV / 2)
  const dirX = Math.sin(yaw)
  const dirZ = Math.cos(yaw)
  const planeX = -dirZ * planLen
  const planeZ = dirX * planLen

  for (let col = 0; col < RAY_W; col++) {
    const camX = 2 * (col / (RAY_W - 1)) - 1  // -1 .. 1
    const rayDirX = dirX + planeX * camX
    const rayDirZ = dirZ + planeZ * camX

    // DDA: vị trí camera theo tọa độ thế giới → tọa độ lưới
    let mapX = Math.floor((px + nuaKT) / canhO)
    let mapZ = Math.floor((pz + nuaKT) / canhO)

    // Phòng chia 0
    const invRayDirX = Math.abs(rayDirX) < 1e-10 ? 1e10 : 1 / rayDirX
    const invRayDirZ = Math.abs(rayDirZ) < 1e-10 ? 1e10 : 1 / rayDirZ

    const deltaDistX = Math.abs(invRayDirX) * canhO
    const deltaDistZ = Math.abs(invRayDirZ) * canhO

    let sideDistX: number, sideDistZ: number
    let stepX: number, stepZ: number

    const localX = ((px + nuaKT) % canhO + canhO) % canhO
    const localZ = ((pz + nuaKT) % canhO + canhO) % canhO

    if (rayDirX < 0) {
      stepX = -1
      sideDistX = localX * Math.abs(invRayDirX)
    } else {
      stepX = 1
      sideDistX = (canhO - localX) * Math.abs(invRayDirX)
    }
    if (rayDirZ < 0) {
      stepZ = -1
      sideDistZ = localZ * Math.abs(invRayDirZ)
    } else {
      stepZ = 1
      sideDistZ = (canhO - localZ) * Math.abs(invRayDirZ)
    }

    let hit = false
    let side = 0  // 0 = tường X, 1 = tường Z
    let perpWallDist = 0

    for (let i = 0; i < 128; i++) {
      if (sideDistX < sideDistZ) {
        sideDistX += deltaDistX
        mapX += stepX
        side = 0
      } else {
        sideDistZ += deltaDistZ
        mapZ += stepZ
        side = 1
      }
      if (mapX < 0 || mapX >= N || mapZ < 0 || mapZ >= N) { hit = true; break }
      if (meCung.luoi[mapZ][mapX] === 1) { hit = true; break }
    }

    if (!hit) { zBuffer[col] = 1e9; continue }

    if (side === 0) perpWallDist = (sideDistX - deltaDistX)
    else perpWallDist = (sideDistZ - deltaDistZ)
    perpWallDist = Math.max(0.01, perpWallDist)
    zBuffer[col] = perpWallDist

    // Chiều cao slice tường
    const lineH = Math.floor(H / perpWallDist)
    const drawStart = Math.max(0, Math.floor(H / 2 - lineH / 2))
    const drawEnd = Math.min(H - 1, Math.floor(H / 2 + lineH / 2))

    // Texture X coordinate
    let wallX: number
    if (side === 0) {
      wallX = ((pz + perpWallDist * rayDirZ) % canhO + canhO) % canhO
    } else {
      wallX = ((px + perpWallDist * rayDirX) % canhO + canhO) % canhO
    }
    let texX = Math.floor((wallX / canhO) * TEX_W)
    if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirZ < 0)) texX = TEX_W - texX - 1

    // Hệ số ánh sáng: tường X sáng hơn tường Z
    const shade = side === 0 ? 1.0 : 0.78

    // Render wall strip
    for (let y = drawStart; y <= drawEnd; y++) {
      const d = (y * 2 - H + lineH) / 2
      const texY = Math.floor((d * TEX_H) / lineH) & (TEX_H - 1)
      const ti = (texY * TEX_W + texX) * 4
      const fogFactor = Math.max(0, 1 - perpWallDist / 22)

      for (let dupX = 0; dupX < 2; dupX++) {
        const screenX = col * 2 + dupX
        if (screenX >= W) continue
        const pi = (y * W + screenX) * 4
        pixels[pi + 0] = Math.round(brickTex.data[ti + 0] * shade * fogFactor + 40 * (1 - fogFactor))
        pixels[pi + 1] = Math.round(brickTex.data[ti + 1] * shade * fogFactor + 40 * (1 - fogFactor))
        pixels[pi + 2] = Math.round(brickTex.data[ti + 2] * shade * fogFactor + 50 * (1 - fogFactor))
        pixels[pi + 3] = 255
      }
    }

    // Render sàn mặt đất (phía trên là bầu trời trong suốt, để nguyên không ghi đè)
    for (let y = drawEnd + 1; y < H; y++) {
      const rowDist = (H * 0.5) / (y - H * 0.5)
      const floorX = px + rowDist * rayDirX
      const floorZ = pz + rowDist * rayDirZ
      const ftx = ((Math.floor((floorX + nuaKT) * TEX_W / canhO) % TEX_W) + TEX_W) % TEX_W
      const fty = ((Math.floor((floorZ + nuaKT) * TEX_H / canhO) % TEX_H) + TEX_H) % TEX_H
      const fti = (fty * TEX_W + ftx) * 4
      const fogF = Math.max(0, 1 - rowDist / 18)

      for (let dupX = 0; dupX < 2; dupX++) {
        const screenX = col * 2 + dupX
        if (screenX >= W) continue

        const fpi = (y * W + screenX) * 4
        pixels[fpi + 0] = Math.round(floorTex.data[fti + 0] * fogF + 45 * (1 - fogF))
        pixels[fpi + 1] = Math.round(floorTex.data[fti + 1] * fogF + 55 * (1 - fogF))
        pixels[fpi + 2] = Math.round(floorTex.data[fti + 2] * fogF + 45 * (1 - fogF))
        pixels[fpi + 3] = 255
      }
    }
  }

  // Đè tường và sàn lên canvas đã có bầu trời (alpha = 0 ở phần trời giúp bầu trời lộ ra hoàn hảo)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = W
  tempCanvas.height = H
  const tempCtx = tempCanvas.getContext('2d')
  if (tempCtx) {
    tempCtx.putImageData(imgData, 0, 0)
    ctx.drawImage(tempCanvas, 0, 0)
  }

  // ─── 2. HỆ THỐNG MÔ HÌNH 3D NGUYÊN THUỶ (NHÂN VẬT, QUÁI, CÂY RỪNG, BÌNH MÁU) ───
  // Khởi tạo camera 3D tương đương góc nhìn người chơi
  const camPos: [number, number, number] = [px, 1.4, pz]
  const camTgt: [number, number, number] = [px + dirX * 10, 1.4, pz + dirZ * 10]
  const cam3d = new HeToaDoCamera({ pos: camPos, tgt: camTgt, fov: RAY_FOV }, W, H)

  const toanBoKhoi3D: Khoi3D[] = []

  // (A) RỪNG CÂY 3D TRONG MÊ CUNG
  const cayGoc = layCayModel()
  for (const c of viTriCay) {
    const dX = c.x - px
    const dZ = c.z - pz
    if (dX * dX + dZ * dZ > 24 * 24) continue // Quá xa, bỏ qua
    const khoiCay = bienDoiMoHinh(cayGoc, [c.x, 0, c.z], 0, camPos)
    toanBoKhoi3D.push(...khoiCay)
  }

  // (B) CÁC NHÂN VẬT BOT (41 khối Chibi + Súng cầm ở tay sắc nét chuẩn bản vẽ)
  for (const p of nguoiChoiKhac) {
    if (!p.song || p.daThoat) continue
    const dX = p.x - px
    const dZ = p.z - pz
    if (dX * dX + dZ * dZ > 24 * 24) continue
    const hcInfo = mapHoaChat.get(p.hoaChat)
    const mauBinh = hcInfo?.mauGame || 'rgb(123, 47, 190)'
    const chibiCoSung = taoMoHinhChibiCamSung(p.mauAo, mauBinh, p.sung)
    const khoiBot = bienDoiMoHinh(chibiCoSung, [p.x, 0, p.z], p.yaw, camPos)
    toanBoKhoi3D.push(...khoiBot)
  }

  // (C) QUÁI VẬT 3D CHUẨN BẢN VẼ (12 khối nguyên thuỷ)
  const quaiGoc = taoMoHinhQuaiVat()
  for (const q of quaiVat) {
    if (!q.song) continue
    const dX = q.x - px
    const dZ = q.z - pz
    if (dX * dX + dZ * dZ > 24 * 24) continue
    const khoiQuai = bienDoiMoHinh(quaiGoc, [q.x, 0, q.z], q.yaw, camPos)
    toanBoKhoi3D.push(...khoiQuai)
  }

  // (D) BÌNH MÁU 3D CHUẨN BẢN VẼ (4 khối)
  const binhMauGoc = taoMoHinhBinhMau()
  for (const b of binhMau) {
    if (b.daNhat) continue
    const dX = b.x - px
    const dZ = b.z - pz
    if (dX * dX + dZ * dZ > 20 * 20) continue
    const khoiMau = bienDoiMoHinh(binhMauGoc, [b.x, 0.4, b.z], 0, camPos)
    toanBoKhoi3D.push(...khoiMau)
  }

  // Vẽ danh sách tất cả các khối 3D với Z-Buffer tường để không bị đè xuyên tường
  veDanhSachKhoi(ctx, cam3d, toanBoKhoi3D, 18, true, zBuffer)

  // ─── 3. CỔNG THOÁT RA (Cột ánh sáng ngọc bích phát quang) ───
  for (const c of meCung.danhSachCong) {
    if (!c.mo) continue
    const cd = cam3d.chieuDiem([c.x, 1.8, c.z])
    if (cd) {
      const col = Math.floor((cd.sx / W) * RAY_W)
      if (col >= 0 && col < RAY_W && cd.z < zBuffer[col] + 1.2) {
        const portalH = Math.max(30, cd.rp(3.6))
        const portalW = portalH * 0.45
        ctx.save()
        const portalGrad = ctx.createLinearGradient(0, cd.sy - portalH / 2, 0, cd.sy + portalH / 2)
        portalGrad.addColorStop(0, 'rgba(61, 214, 160, 0.95)')
        portalGrad.addColorStop(0.5, 'rgba(150, 255, 210, 0.85)')
        portalGrad.addColorStop(1, 'rgba(61, 214, 160, 0.95)')
        ctx.fillStyle = portalGrad
        ctx.shadowColor = 'rgb(61, 214, 160)'
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.roundRect(cd.sx - portalW / 2, cd.sy - portalH / 2, portalW, portalH, [16, 16, 4, 4])
        ctx.fill()
        ctx.font = '22px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('🚪', cd.sx, cd.sy - portalH / 2 - 8)
        ctx.restore()
      }
    }
  }

  // ─── 4. HIỆU ỨNG TIA ĐẠN FREE FIRE (Laser năng lượng rực sáng) ───
  for (const d of danSung) {
    veTiaDanFreeFire(ctx, cam3d, d)
  }

  // ─── 5. VŨ KHÍ CẦM TAY GÓC NHÌN THỨ NHẤT (FPS Viewmodel kiểu Free Fire) ───
  veSungGocNhinThuNhat(ctx, W, H, vuKhiNguoiChoi, mauNguoiChoi, recoilShoot)

  // ─── 6. MINI-MAP HIỆN ĐẠI (Góc trên bên phải) ───
  const MM = 130
  const mmX = W - MM - 12
  const mmY = 12
  ctx.save()
  ctx.fillStyle = 'rgba(11, 16, 24, 0.72)'
  ctx.beginPath()
  ctx.roundRect(mmX, mmY, MM, MM, [10, 10, 10, 10])
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const mmScale = MM / (N * canhO)

  // Tường mê cung
  ctx.fillStyle = 'rgba(180, 120, 70, 0.85)'
  for (let gz = 0; gz < N; gz++) {
    for (let gx = 0; gx < N; gx++) {
      if (meCung.luoi[gz][gx] === 1) {
        const wx = gx * canhO - nuaKT
        const wz = gz * canhO - nuaKT
        const sx = mmX + (wx + nuaKT) * mmScale
        const sy = mmY + (wz + nuaKT) * mmScale
        const sw = Math.max(1, canhO * mmScale)
        ctx.fillRect(sx, sy, sw, sw)
      }
    }
  }

  // Cây cối rừng trên mini-map (chấm xanh lục)
  ctx.fillStyle = 'rgb(34, 139, 34)'
  for (const c of viTriCay) {
    const sx = mmX + (c.x + nuaKT) * mmScale
    const sy = mmY + (c.z + nuaKT) * mmScale
    ctx.beginPath()
    ctx.arc(sx, sy, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Cổng ra
  for (const c of meCung.danhSachCong) {
    if (!c.mo) continue
    const sx = mmX + (c.x + nuaKT) * mmScale
    const sy = mmY + (c.z + nuaKT) * mmScale
    ctx.fillStyle = 'rgb(61, 214, 160)'
    ctx.fillRect(sx - 3.5, sy - 3.5, 7, 7)
  }

  // Người chơi (tam giác chỉ hướng)
  const playerSX = mmX + (px + nuaKT) * mmScale
  const playerSZ = mmY + (pz + nuaKT) * mmScale
  ctx.save()
  ctx.translate(playerSX, playerSZ)
  ctx.rotate(yaw)
  ctx.fillStyle = 'rgb(80, 200, 255)'
  ctx.beginPath()
  ctx.moveTo(0, -8)
  ctx.lineTo(-4.5, 5.5)
  ctx.lineTo(4.5, 5.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Quái vật (chấm đỏ)
  ctx.fillStyle = 'rgb(255, 60, 60)'
  for (const q of quaiVat) {
    if (!q.song) continue
    const sx = mmX + (q.x + nuaKT) * mmScale
    const sy = mmY + (q.z + nuaKT) * mmScale
    ctx.beginPath()
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // ─── 7. TÂM NGẮM CROSSHAIR CHUẨN FPS ───
  const cx = W / 2
  const cy = H / 2
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 3, cy)
  ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 10, cy)
  ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy - 3)
  ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 10)
  ctx.stroke()

  ctx.fillStyle = 'rgb(255, 255, 255)'
  ctx.beginPath()
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}


// ═══════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ═══════════════════════════════════════════════════════

interface DauTruongGameProps {
  sbdHienTai: string
  hoTenHienTai: string
  onDong?: () => void
}

const MAU_AO_RGB = [
  'rgb(66,133,244)', 'rgb(219,68,55)', 'rgb(244,180,0)', 'rgb(15,157,88)',
  'rgb(171,71,188)', 'rgb(255,112,67)', 'rgb(38,166,154)', 'rgb(236,64,122)',
  'rgb(251,192,45)', 'rgb(102,187,106)', 'rgb(66,165,245)', 'rgb(239,83,80)',
]

export default function DauTruongGame({ sbdHienTai, hoTenHienTai, onDong }: DauTruongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [manHinh, setManHinh] = useState<
    'chon_cap_do' | 'phong_cho' | 'chon_sung_hoa_chat' | 'dang_choi' | 'ket_van'
  >('chon_cap_do')

  const [capDoChon, setCapDoChon] = useState<CapDo>('truot_dh')
  const [sungChon, setSungChon] = useState<LoaiSung>('binh_xit')
  const [hoaChatChon, setHoaChatChon] = useState<IdHoaChat>('Cl2')
  const [batAmThanh, setBatAmThanh] = useState(true)
  const [demNguocLobby, setDemNguocLobby] = useState(10)
  const [demNguocChonDo, setDemNguocChonDo] = useState(20)
  const [ketQuaCuoi, setKetQuaCuoi] = useState<{
    thang: boolean; lyDo: string; soHoaGiai: number; thoiGianSong: number
  }>({ thang: false, lyDo: '', soHoaGiai: 0, thoiGianSong: 0 })
  const [nhatKyPhanUng, setNhatKyPhanUng] = useState<
    { chatA: IdHoaChat; chatB: IdHoaChat; phuongTrinh: string; tieuChi: string; thoiDiem: string }[]
  >([])
  const [hudMau, setHudMau] = useState(100)
  const [hudMauToiDa, setHudMauToiDa] = useState(100)
  const [hudSoNguoiSong, setHudSoNguoiSong] = useState(12)
  const [hudDongHo, setHudDongHo] = useState('00:00')
  const [hudThongBao, setHudThongBao] = useState<ThongBaoPhanUng | null>(null)
  const [coTheNhatMau, setCoTheNhatMau] = useState(false)

  const gameRef = useRef<{
    meCung: BanDoMeCung | null
    nguoiChoi: NguoiChoiHoaChat[]
    quaiVat: QuaiVat[]
    binhMau: BinhMauItem[]
    dan: DanSung[]
    vetChan: VetChan[]
    viTriCay: { x: number; z: number }[]
    recoil: number
    thongBao: ThongBaoPhanUng | null
    thoiGianConLai: number
    diChuyenTrai: { dangCham: boolean; gocX: number; gocY: number; dx: number; dy: number }
    xoayPhai: { dangCham: boolean; gocX: number; gocY: number; pointerId: number }
    dangBan: boolean
    phim: Record<string, boolean>
    lanBanCuoi: number
    lastTime: number
    daKhoiTao: boolean
  }>({
    meCung: null, nguoiChoi: [], quaiVat: [], binhMau: [], dan: [], vetChan: [],
    viTriCay: [], recoil: 0,
    thongBao: null, thoiGianConLai: 0,
    diChuyenTrai: { dangCham: false, gocX: 0, gocY: 0, dx: 0, dy: 0 },
    xoayPhai: { dangCham: false, gocX: 0, gocY: 0, pointerId: -1 },
    dangBan: false, phim: {}, lanBanCuoi: 0, lastTime: 0, daKhoiTao: false,
  })

  // ── Đếm ngược phòng chờ
  useEffect(() => {
    if (manHinh !== 'phong_cho') return
    const t = setInterval(() => setDemNguocLobby(p => {
      if (p <= 1) { clearInterval(t); setManHinh('chon_sung_hoa_chat'); return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [manHinh])

  useEffect(() => {
    if (manHinh !== 'chon_sung_hoa_chat') return
    const t = setInterval(() => setDemNguocChonDo(p => {
      if (p <= 1) { clearInterval(t); batDauTranDau(); return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manHinh])

  // ── Khởi tạo trận đấu
  function batDauTranDau() {
    const cfgCapDo = DANH_SACH_CAP_DO[capDoChon]
    const seed = Math.floor(Math.random() * 1000000) + 1
    // Chơi 1 người: 1 cổng thoát. Tìm cổng đặt xa nhất rồi xoá bớt.
    const meCung = sinhMeCung(cfgCapDo.kichThuocMeCung, seed, 12)
    // Chỉ giữ lại 1 cổng mở (cổng xa player nhất)
    if (meCung.danhSachCong.length > 1) {
      const viTriGoc = meCung.oXuatPhat[0] || { x: 0, z: 0 }
      let farIdx = 0; let farDist = -1
      meCung.danhSachCong.forEach((c, i) => {
        const d = (c.x - viTriGoc.x) ** 2 + (c.z - viTriGoc.z) ** 2
        if (d > farDist) { farDist = d; farIdx = i }
      })
      meCung.danhSachCong = meCung.danhSachCong.map((c, i) => ({ ...c, mo: i === farIdx }))
    }

    const nguoiChoiList: NguoiChoiHoaChat[] = []
    const pos0 = meCung.oXuatPhat[0] || { x: 0, z: 0 }
    nguoiChoiList.push({
      id: 'player_main', sbd: sbdHienTai || '12001',
      hoTen: hoTenHienTai || 'Chiến Binh', laNguoiThat: true,
      x: pos0.x, z: pos0.z, yaw: 0,
      mauAo: MAU_AO_RGB[0], hoaChat: hoaChatChon, sung: sungChon,
      mau: cfgCapDo.mauDau, mauToiDa: cfgCapDo.mauDau,
      song: true, thoiGianMienNhiem: 0, daThoat: false, soDoiThuHoaGiai: 0, diem: 0,
    })

    const tenBot = [
      'Thủ Khoa Hoá', 'Á Khoa Chuyên', 'Chiến Binh HCl', 'Đại Tướng KMnO₄',
      'Sát Thủ Cl₂', 'Bậc Thầy NaOH', 'Cao Thủ H₂SO₄', 'Hiệp Sĩ Na',
      'Thần Đồng Zn', 'Phù Thuỷ AgNO₃', 'Dũng Sĩ NH₃',
    ]
    for (let i = 1; i < 12; i++) {
      const pos = meCung.oXuatPhat[i] || { x: 0, z: 0 }
      const chatBot = DANH_SACH_HOA_CHAT[(i + 2) % DANH_SACH_HOA_CHAT.length].id
      nguoiChoiList.push({
        id: `bot_${i}`, sbd: `BOT_${12000 + i}`, hoTen: tenBot[i - 1], laNguoiThat: false,
        x: pos.x, z: pos.z, yaw: Math.random() * Math.PI * 2,
        mauAo: MAU_AO_RGB[i % MAU_AO_RGB.length], hoaChat: chatBot,
        sung: i % 2 === 0 ? 'binh_xit' : 'ong_nho_giot',
        mau: cfgCapDo.mauDau, mauToiDa: cfgCapDo.mauDau,
        song: true, thoiGianMienNhiem: 0, daThoat: false, soDoiThuHoaGiai: 0, diem: 0,
      })
    }

    const quaiList: QuaiVat[] = []
    for (let i = 0; i < cfgCapDo.soQuai; i++) {
      const idx = (i * 3 + 4) % meCung.oXuatPhat.length
      const p = meCung.oXuatPhat[idx]
      quaiList.push({
        id: i + 1, x: p.x + (Math.random() - 0.5) * 4, z: p.z + (Math.random() - 0.5) * 4,
        yaw: Math.random() * Math.PI * 2,
        mau: HANG_SO_GAME.MAU_QUAI, mauToiDa: HANG_SO_GAME.MAU_QUAI,
        song: true, tocDo: 2.5 * cfgCapDo.tocDoQuaiTyLe,
      })
    }

    const binhMauList: BinhMauItem[] = []
    for (let i = 0; i < cfgCapDo.soBinhMau; i++) {
      const idx = (i * 4 + 1) % meCung.oXuatPhat.length
      const p = meCung.oXuatPhat[idx]
      binhMauList.push({ id: i + 1, x: p.x, z: p.z, daNhat: false })
    }

    // Tạo danh sách vị trí rừng cây trong mê cung (rải rác ở các hành lang thông thoáng)
    const canhO = HANG_SO_GAME.CANH_O
    const nuaKT = (meCung.kichThuoc * canhO) / 2
    const viTriCay: { x: number; z: number }[] = []
    for (let gz = 1; gz < meCung.kichThuoc - 1; gz += 2) {
      for (let gx = 1; gx < meCung.kichThuoc - 1; gx += 2) {
        if (meCung.luoi[gz][gx] === 0) {
          // Tránh quá gần ô xuất phát
          const wx = gx * canhO - nuaKT + canhO / 2
          const wz = gz * canhO - nuaKT + canhO / 2
          const ganXuatPhat = meCung.oXuatPhat.some(o => Math.hypot(o.x - wx, o.z - wz) < 3.0)
          if (!ganXuatPhat && (gx + gz) % 3 === 0) {
            viTriCay.push({ x: wx, z: wz })
          }
        }
      }
    }

    gameRef.current = {
      meCung, nguoiChoi: nguoiChoiList, quaiVat: quaiList,
      binhMau: binhMauList, dan: [], vetChan: [],
      viTriCay, recoil: 0,
      thongBao: null,
      thoiGianConLai: cfgCapDo.thoiGianGiay,
      diChuyenTrai: { dangCham: false, gocX: 0, gocY: 0, dx: 0, dy: 0 },
      xoayPhai: { dangCham: false, gocX: 0, gocY: 0, pointerId: -1 },
      dangBan: false, phim: {}, lanBanCuoi: 0, lastTime: performance.now(), daKhoiTao: true,
    }
    setHudMau(cfgCapDo.mauDau); setHudMauToiDa(cfgCapDo.mauDau)
    setHudSoNguoiSong(12); setNhatKyPhanUng([])
    setManHinh('dang_choi')
  }

  // ── Vòng lặp chính RAYCASTING
  useEffect(() => {
    if (manHinh !== 'dang_choi') return
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    const g = gameRef.current
    let animId: number

    function resize() {
      cvs!.width = window.innerWidth
      cvs!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function onKeyDown(e: KeyboardEvent) {
      g.phim[e.code] = true
      if (e.code === 'KeyE') nhatBinhMau()
      if (e.code === 'Space' || e.code === 'MouseLeft') g.dangBan = true
    }
    function onKeyUp(e: KeyboardEvent) {
      g.phim[e.code] = false
      if (e.code === 'Space') g.dangBan = false
    }
    function onMouseMove(e: MouseEvent) {
      if (!document.pointerLockElement) return
      const player = g.nguoiChoi[0]
      if (player) player.yaw += e.movementX * 0.003
    }
    function onMouseDown() {
      if (!document.pointerLockElement) cvs!.requestPointerLock()
      else g.dangBan = true
    }
    function onMouseUp() { g.dangBan = false }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    cvs.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    function nhatBinhMau() {
      const player = g.nguoiChoi[0]; if (!player || !player.song) return
      for (const b of g.binhMau) {
        if (!b.daNhat && Math.hypot(player.x - b.x, player.z - b.z) < 2.0) {
          b.daNhat = true
          player.mau = Math.min(player.mauToiDa, player.mau + HANG_SO_GAME.MAU_BINH_HOI_PHUC)
          setHudMau(player.mau)
          if (batAmThanh) amThanh.tiengNhatMau()
          break
        }
      }
    }

    function xuLyBanSung(nguoi: NguoiChoiHoaChat) {
      const now = performance.now()
      const sungCfg = DANH_SACH_SUNG[nguoi.sung]
      if (now - g.lanBanCuoi < sungCfg.nhipMs) return
      g.lanBanCuoi = now
      g.recoil = 1.0
      if (batAmThanh) amThanh.tiengBan(nguoi.sung)
      const hx = Math.sin(nguoi.yaw); const hz = Math.cos(nguoi.yaw)
      g.dan.push({
        x: nguoi.x + hx * 0.8, z: nguoi.z + hz * 0.8,
        vx: hx * 24, vz: hz * 24, quangDuongDaDi: 0,
        quangDuongToiDa: sungCfg.tamU,
        mau: MAP_HOA_CHAT.get(nguoi.hoaChat)?.mauGame || 'rgb(150,80,255)',
      })
    }

    const loop = (now: number) => {
      const dt = Math.min(0.08, (now - g.lastTime) / 1000)
      g.lastTime = now

      const player = g.nguoiChoi[0]; const meCung = g.meCung
      if (!player || !meCung) { animId = requestAnimationFrame(loop); return }

      const W = cvs!.width; const H = cvs!.height
      const cfgCapDo = DANH_SACH_CAP_DO[capDoChon]

      // ── Di chuyển người chơi
      if (player.song && !player.daThoat) {
        let vx = 0; let vz = 0
        const spd = 6.5
        if (g.phim['KeyW'] || g.phim['ArrowUp'])   { vx += Math.sin(player.yaw)*spd; vz += Math.cos(player.yaw)*spd }
        if (g.phim['KeyS'] || g.phim['ArrowDown'])  { vx -= Math.sin(player.yaw)*spd; vz -= Math.cos(player.yaw)*spd }
        if (g.phim['KeyA'] || g.phim['ArrowLeft'])  { vx -= Math.cos(player.yaw)*spd; vz += Math.sin(player.yaw)*spd }
        if (g.phim['KeyD'] || g.phim['ArrowRight']) { vx += Math.cos(player.yaw)*spd; vz -= Math.sin(player.yaw)*spd }
        if (g.phim['ArrowLeft'])  player.yaw -= 1.8 * dt
        if (g.phim['ArrowRight']) player.yaw += 1.8 * dt

        if (g.diChuyenTrai.dangCham) {
          const len = Math.hypot(g.diChuyenTrai.dx, g.diChuyenTrai.dy)
          if (len > 8) {
            const nx = g.diChuyenTrai.dx / Math.max(48, len)
            const ny = g.diChuyenTrai.dy / Math.max(48, len)
            vx += (Math.sin(player.yaw) * (-ny) + Math.cos(player.yaw) * nx) * spd
            vz += (Math.cos(player.yaw) * (-ny) - Math.sin(player.yaw) * nx) * spd
          }
        }

        const nx = player.x + vx * dt
        if (!kiemTraVaChamTuong(nx, player.z, 0.42, meCung)) player.x = nx
        const nz = player.z + vz * dt
        if (!kiemTraVaChamTuong(player.x, nz, 0.42, meCung)) player.z = nz

        if (g.dangBan) xuLyBanSung(player)

        // Kiểm tra bình máu
        let ganMau = false
        for (const b of g.binhMau) {
          if (!b.daNhat && Math.hypot(player.x - b.x, player.z - b.z) < 2.0) { ganMau = true; break }
        }
        setCoTheNhatMau(ganMau)

        // Kiểm tra cổng
        for (const cong of meCung.danhSachCong) {
          if (cong.mo && Math.hypot(player.x - cong.x, player.z - cong.z) < 2.2) {
            player.daThoat = true
            setKetQuaCuoi({ thang: true, lyDo: 'Thoát khỏi mê cung hoá chất thành công!', soHoaGiai: player.soDoiThuHoaGiai, thoiGianSong: Math.round(performance.now()/1000) })
            setManHinh('ket_van'); return
          }
        }
      }

      // ── Bot AI
      for (let i = 1; i < g.nguoiChoi.length; i++) {
        const bot = g.nguoiChoi[i]; if (!bot.song || bot.daThoat) continue
        if (Math.random() < 0.02) bot.yaw += (Math.random() - 0.5) * 1.5
        const bx = bot.x + Math.sin(bot.yaw) * 4.5 * dt
        const bz = bot.z + Math.cos(bot.yaw) * 4.5 * dt
        if (!kiemTraVaChamTuong(bx, bz, 0.42, meCung)) { bot.x = bx; bot.z = bz }
        else bot.yaw += Math.PI * 0.75
      }

      // ── Giảm miễn nhiễm
      for (const p of g.nguoiChoi) if (p.thoiGianMienNhiem > 0) p.thoiGianMienNhiem -= dt

      // ── Va chạm hoá học
      for (let i = 0; i < g.nguoiChoi.length; i++) {
        const pA = g.nguoiChoi[i]; if (!pA.song || pA.daThoat) continue
        for (let j = i + 1; j < g.nguoiChoi.length; j++) {
          const pB = g.nguoiChoi[j]; if (!pB.song || pB.daThoat) continue
          if (Math.hypot(pA.x - pB.x, pA.z - pB.z) < HANG_SO_GAME.BAN_KINH_CHAM_U) {
            if (pA.thoiGianMienNhiem <= 0 && pB.thoiGianMienNhiem <= 0) {
              pA.thoiGianMienNhiem = HANG_SO_GAME.GIAY_MIEN_NHIEM_SAU_CHAM
              pB.thoiGianMienNhiem = HANG_SO_GAME.GIAY_MIEN_NHIEM_SAU_CHAM
              const tt = traCuuTuongTac(pA.hoaChat, pB.hoaChat)
              if (tt.ketQuaA === 'khac_che') {
                pB.mau -= HANG_SO_GAME.SAT_THUONG_KHAC_CHE
                if (tt.phuongTrinh) {
                  const tb: ThongBaoPhanUng = { chatA: pA.hoaChat, chatB: pB.hoaChat, phuongTrinh: tt.phuongTrinh, tieuChi: tt.tieuChi || '', nguoiThang: pA.hoTen, nguoiThua: pB.hoTen, thoiGianHienConLai: 2 }
                  g.thongBao = tb; setHudThongBao(tb)
                  setNhatKyPhanUng(prev => [...prev, { chatA: pA.hoaChat, chatB: pB.hoaChat, phuongTrinh: tt.phuongTrinh!, tieuChi: tt.tieuChi || '', thoiDiem: new Date().toLocaleTimeString() }])
                }
                if (pB.mau <= 0) { pB.song = false; pA.soDoiThuHoaGiai++ }
              } else if (tt.ketQuaA === 'bi_khac_che') {
                pA.mau -= HANG_SO_GAME.SAT_THUONG_KHAC_CHE
                if (pA.mau <= 0) { pA.song = false; pB.soDoiThuHoaGiai++ }
              } else if (tt.ketQuaA === 'trung_hoa') {
                pA.mau -= HANG_SO_GAME.SAT_THUONG_TRUNG_HOA
                pB.mau -= HANG_SO_GAME.SAT_THUONG_TRUNG_HOA
                if (pA.mau <= 0) pA.song = false
                if (pB.mau <= 0) pB.song = false
              }
              if (pA.laNguoiThat) setHudMau(Math.max(0, pA.mau))
            }
          }
        }
      }

      // ── Quái vật
      for (const q of g.quaiVat) {
        if (!q.song) continue
        const dx = player.x - q.x; const dz = player.z - q.z
        const dist = Math.hypot(dx, dz)
        if (dist < 14) {
          q.yaw = Math.atan2(dx, dz)
          const qx = q.x + Math.sin(q.yaw) * q.tocDo * dt
          const qz = q.z + Math.cos(q.yaw) * q.tocDo * dt
          if (!kiemTraVaChamTuong(qx, qz, 0.6, meCung)) { q.x = qx; q.z = qz }
          if (dist < 1.3 && player.thoiGianMienNhiem <= 0) {
            player.mau -= HANG_SO_GAME.SAT_THUONG_QUAI
            player.thoiGianMienNhiem = 0.8
            setHudMau(Math.max(0, player.mau))
            if (batAmThanh) amThanh.rung(25)
          }
        }
      }

      // ── Đạn súng
      for (let i = g.dan.length - 1; i >= 0; i--) {
        const d = g.dan[i]
        d.x += d.vx * dt; d.z += d.vz * dt
        d.quangDuongDaDi += Math.hypot(d.vx * dt, d.vz * dt)
        if (kiemTraVaChamTuong(d.x, d.z, 0.1, meCung) || d.quangDuongDaDi >= d.quangDuongToiDa) {
          g.dan.splice(i, 1); continue
        }
        for (const q of g.quaiVat) {
          if (q.song && Math.hypot(d.x - q.x, d.z - q.z) < 1.0) {
            q.mau -= HANG_SO_GAME.SAT_THUONG_SUNG
            if (q.mau <= 0) q.song = false
            g.dan.splice(i, 1); break
          }
        }
      }

      // ── Thông báo
      if (g.thongBao) {
        g.thongBao.thoiGianHienConLai -= dt
        if (g.thongBao.thoiGianHienConLai <= 0) { g.thongBao = null; setHudThongBao(null) }
      }

      // ── Đồng hồ
      if (g.thoiGianConLai > 0) {
        g.thoiGianConLai -= dt
        const ph = Math.floor(g.thoiGianConLai / 60)
        const gi = Math.floor(g.thoiGianConLai % 60)
        setHudDongHo(`${ph}:${gi < 10 ? '0' : ''}${gi}`)
        if (g.thoiGianConLai <= 0 && player.song) {
          player.song = false
          setKetQuaCuoi({ thang: false, lyDo: 'Hết giờ! Bạn bị kẹt trong mê cung.', soHoaGiai: player.soDoiThuHoaGiai, thoiGianSong: cfgCapDo.thoiGianGiay })
          setManHinh('ket_van'); return
        }
      }

      const soSong = g.nguoiChoi.filter(p => p.song && !p.daThoat).length
      setHudSoNguoiSong(soSong)

      if (!player.song && !player.daThoat) {
        setKetQuaCuoi({ thang: false, lyDo: 'Bạn bị quái vật hoặc đối thủ hạ gục!', soHoaGiai: player.soDoiThuHoaGiai, thoiGianSong: Math.round(performance.now() / 1000) })
        setManHinh('ket_van'); return
      }

      // ── Hồi giật súng
      if (g.recoil > 0) {
        g.recoil = Math.max(0, g.recoil - dt * 5)
      }

      // ── RENDER RAYCASTING
      const mauHoaChatPlayer = MAP_HOA_CHAT.get(player.hoaChat)?.mauGame || 'rgb(123, 47, 190)'
      veGocNhinThuNhat(ctx, W, H, player.x, player.z, player.yaw, meCung,
        g.quaiVat, g.binhMau,
        g.nguoiChoi.slice(1),
        g.dan, MAP_HOA_CHAT,
        g.viTriCay, player.sung, mauHoaChatPlayer, g.recoil)

      // ── Joystick ảo cảm ứng trái
      if (g.diChuyenTrai.dangCham) {
        ctx.save()
        ctx.globalAlpha = 0.45
        ctx.beginPath()
        ctx.arc(g.diChuyenTrai.gocX, g.diChuyenTrai.gocY, 56, 0, 2*Math.PI)
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke()
        ctx.beginPath()
        ctx.arc(g.diChuyenTrai.gocX + g.diChuyenTrai.dx, g.diChuyenTrai.gocY + g.diChuyenTrai.dy, 24, 0, 2*Math.PI)
        ctx.fillStyle = 'rgb(66,133,244)'; ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      cvs!.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      if (document.pointerLockElement === cvs) document.exitPointerLock()
    }
  }, [manHinh, capDoChon, batAmThanh])

  // ── Touch controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left; const y = e.clientY - rect.top
    const midX = rect.width / 2
    if (x < midX && !g.diChuyenTrai.dangCham) {
      g.diChuyenTrai = { dangCham: true, gocX: x, gocY: y, dx: 0, dy: 0 }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } else if (x >= midX && !g.xoayPhai.dangCham) {
      g.xoayPhai = { dangCham: true, gocX: x, gocY: y, pointerId: e.pointerId }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      g.dangBan = true
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left; const y = e.clientY - rect.top
    if (g.diChuyenTrai.dangCham) {
      const dx = x - g.diChuyenTrai.gocX; const dy = y - g.diChuyenTrai.gocY
      const dist = Math.hypot(dx, dy); const maxR = 56
      g.diChuyenTrai.dx = dist > maxR ? (dx/dist)*maxR : dx
      g.diChuyenTrai.dy = dist > maxR ? (dy/dist)*maxR : dy
    }
    if (g.xoayPhai.dangCham && g.xoayPhai.pointerId === e.pointerId) {
      const deltaX = x - g.xoayPhai.gocX
      g.xoayPhai.gocX = x; g.xoayPhai.gocY = y
      const player = g.nguoiChoi[0]
      if (player) player.yaw += deltaX * 0.005
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current
    if (g.diChuyenTrai.dangCham) g.diChuyenTrai = { dangCham: false, gocX: 0, gocY: 0, dx: 0, dy: 0 }
    if (g.xoayPhai.dangCham && g.xoayPhai.pointerId === e.pointerId) {
      g.xoayPhai = { dangCham: false, gocX: 0, gocY: 0, pointerId: -1 }
      g.dangBan = false
    }
  }

  // ═══ RENDER JSX
  return (
    <div className="relative w-full h-full min-h-[640px] bg-slate-950 text-white select-none overflow-hidden rounded-2xl border border-slate-800 shadow-2xl flex flex-col font-sans">

      {/* ── MÀN 1: CHỌN CẤP ĐỘ */}
      {manHinh === 'chon_cap_do' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-black relative">
          {onDong && (
            <button onClick={onDong} className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer">
              <LogOut size={14} /> Về Cổng Học Sinh
            </button>
          )}
          <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Sparkles size={14} /> Mê cung 3D góc nhìn thứ nhất · Bắn súng diệt quái
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-3">
                <span>ĐẤU TRƯỜNG HOÁ CHẤT</span>
                <span className="text-emerald-400">🧪</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Mê cung gạch 3D · Góc nhìn thứ nhất FPS · 1 cổng thoát duy nhất · Quái vật bao vây toàn tuyến
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {(Object.keys(DANH_SACH_CAP_DO) as CapDo[]).map((key) => {
                const cd = DANH_SACH_CAP_DO[key]
                return (
                  <button key={key} onClick={() => setCapDoChon(key)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${capDoChon === key ? 'bg-emerald-950/40 border-emerald-500 shadow-lg scale-[1.02]' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-base text-white">{cd.ten}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${key === 'truot_dh' ? 'bg-blue-500/20 text-blue-400' : key === 'do_dh' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>{cd.tiLeThangUocTinh}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{cd.moTa}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Lưới: {cd.kichThuocMeCung}×{cd.kichThuocMeCung}</span>
                      <span>Quái: {cd.soQuai}</span>
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setManHinh('phong_cho')} className="px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-700/30 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105">
              <span>Vào Ghép Phòng 12 Người</span><ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── MÀN 2: PHÒNG CHỜ */}
      {manHinh === 'phong_cho' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 relative">
          <div className="max-w-3xl w-full flex flex-col items-center space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Radio size={14} className="animate-pulse" /> Đang tìm chiến binh…
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Phòng Đấu 12 Người</h2>
              <p className="text-slate-400 text-xs">Vào trận sau <span className="text-emerald-400 font-bold">{demNguocLobby}s</span></p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${idx === 0 ? 'bg-emerald-950/30 border-emerald-500/60' : 'bg-slate-900/60 border-slate-800'}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: MAU_AO_RGB[idx] }}>{idx === 0 ? 'Tôi' : `P${idx + 1}`}</div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate text-white">{idx === 0 ? (hoTenHienTai || 'Bạn') : `Bot ${12000 + idx}`}</div>
                    <div className="text-[10px] text-emerald-400">● Sẵn sàng</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setManHinh('chon_cap_do')} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Quay Lại</button>
              <button onClick={() => setManHinh('chon_sung_hoa_chat')} className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-emerald-700/30">Vào Chọn Hoá Chất Ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MÀN 3: CHỌN TRANG BỊ */}
      {manHinh === 'chon_sung_hoa_chat' && (
        <div className="flex-1 flex flex-col p-6 bg-slate-950 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Trang Bị Chiến Đấu</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Còn {demNguocChonDo}s</span>
                </h2>
                <p className="text-xs text-slate-400">Chọn súng diệt quái & hoá chất khắc chế đối thủ</p>
              </div>
              <button onClick={batDauTranDau} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer">Vào Trận Ngay</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Chọn Súng</h3>
                {(Object.keys(DANH_SACH_SUNG) as LoaiSung[]).map(key => {
                  const s = DANH_SACH_SUNG[key]
                  return (
                    <button key={key} onClick={() => setSungChon(key)} className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${sungChon === key ? 'bg-blue-950/40 border-blue-500' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex items-center justify-between"><span className="font-bold text-sm">{s.ten}</span><span className="text-[11px] text-blue-400">Tầm {s.tamU}u</span></div>
                      <p className="text-[11px] text-slate-400 mt-1">{s.moTa}</p>
                    </button>
                  )
                })}
              </div>
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Chọn Hoá Chất</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DANH_SACH_HOA_CHAT.map(hc => (
                    <button key={hc.id} onClick={() => setHoaChatChon(hc.id)} className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${hoaChatChon === hc.id ? 'bg-emerald-950/50 border-emerald-400 shadow-md scale-[1.02]' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: hc.mauGame }} />
                        <span className="font-bold text-xs text-white truncate">{hc.congThuc}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{hc.ten2018}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MÀN 4: ĐANG CHƠI */}
      {manHinh === 'dang_choi' && (
        <div className="relative w-full h-full flex-1">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block touch-none"
            style={{ cursor: 'none' }}
          />
          {/* HUD */}
          <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              {/* Máu & Hoá chất */}
              <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-500 font-black text-sm">♥</span>
                  <div className="w-24 sm:w-32 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                    <div className="bg-gradient-to-r from-rose-500 to-emerald-400 h-full transition-all duration-300" style={{ width: `${Math.max(0, (hudMau / hudMauToiDa) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white ml-1">{hudMau}/{hudMauToiDa}</span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: MAP_HOA_CHAT.get(hoaChatChon)?.mauGame }} />
                  <span className="font-bold text-xs text-white">{hoaChatChon}</span>
                </div>
              </div>

              {/* Đếm người sống */}
              <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-lg text-xs font-bold text-slate-300 pointer-events-auto hidden sm:flex items-center gap-3">
                <span>👥 <strong className="text-emerald-400">{hudSoNguoiSong}</strong> người</span>
                <span>⏱ <span className="text-amber-400 font-mono">{hudDongHo}</span></span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button onClick={() => setBatAmThanh(!batAmThanh)} className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer" title={batAmThanh ? 'Tắt âm' : 'Bật âm'}>
                  {batAmThanh ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                {onDong && (
                  <button onClick={onDong} className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer" title="Thoát">
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Banner phản ứng hoá học */}
            {hudThongBao && (
              <div className="self-center bg-slate-950/95 border-2 border-emerald-400 px-6 py-3 rounded-2xl shadow-2xl text-center max-w-xl animate-bounce">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-0.5">{hudThongBao.nguoiThang} Hoá Giải!</div>
                <div className="text-base sm:text-lg font-mono font-bold text-white">{hudThongBao.phuongTrinh}</div>
                <div className="text-[11px] text-slate-400 italic mt-0.5">({hudThongBao.tieuChi})</div>
              </div>
            )}

            {/* Góc dưới phải: nút bắn & nhặt máu (cảm ứng) */}
            <div className="flex items-end justify-between w-full">
              <div className="hidden sm:block text-[11px] text-slate-300 bg-slate-900/75 p-2 rounded-xl border border-slate-800">
                <div>WASD: Di chuyển · Chuột: Xoay · Click: Khoá chuột bắn</div>
                <div>Space: Bắn · E: Nhặt máu · Mini-map: góc trên phải</div>
              </div>
              <div className="flex items-center gap-3 ml-auto pointer-events-auto">
                {coTheNhatMau && (
                  <button
                    onPointerDown={() => {
                      const player = gameRef.current.nguoiChoi[0]
                      if (player) {
                        for (const b of gameRef.current.binhMau) {
                          if (!b.daNhat && Math.hypot(player.x - b.x, player.z - b.z) < 2.0) {
                            b.daNhat = true
                            player.mau = Math.min(player.mauToiDa, player.mau + HANG_SO_GAME.MAU_BINH_HOI_PHUC)
                            setHudMau(player.mau)
                            if (batAmThanh) amThanh.tiengNhatMau()
                            break
                          }
                        }
                      }
                    }}
                    className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center shadow-lg cursor-pointer animate-pulse"
                  >
                    <PlusCircle size={20} />
                    <span className="text-[9px] font-bold mt-0.5">NHẶT</span>
                  </button>
                )}
                <button
                  onPointerDown={() => { gameRef.current.dangBan = true }}
                  onPointerUp={() => { gameRef.current.dangBan = false }}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex flex-col items-center justify-center shadow-xl cursor-pointer border-2 border-emerald-400 select-none"
                >
                  <Crosshair size={22} />
                  <span className="text-[10px] font-black mt-0.5">BẮN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MÀN 5: KẾT VÁN */}
      {manHinh === 'ket_van' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 overflow-y-auto">
          <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-xl ${ketQuaCuoi.thang ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                {ketQuaCuoi.thang ? <Trophy size={32} /> : <ShieldAlert size={32} />}
              </div>
              <h2 className="text-3xl font-black text-white">{ketQuaCuoi.thang ? 'CHIẾN THẮNG!' : 'VÁN ĐẤU KẾT THÚC'}</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{ketQuaCuoi.lyDo}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Đối thủ đã hoá giải</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">{ketQuaCuoi.soHoaGiai}</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Thời gian sinh tồn</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{ketQuaCuoi.thoiGianSong}s</div>
              </div>
            </div>
            <div className="w-full text-left space-y-2 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <FlaskConical size={14} className="text-emerald-400" /> Ôn Tập Phản Ứng Hoá Học
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {nhatKyPhanUng.length === 0
                  ? <div className="text-xs text-slate-500 italic py-2">Không có phản ứng nào được ghi nhận.</div>
                  : nhatKyPhanUng.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-0.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-emerald-400">
                        <span>{item.chatA} × {item.chatB}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({item.tieuChi})</span>
                      </div>
                      <div className="font-mono text-white text-[11px]">{item.phuongTrinh}</div>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setManHinh('chon_cap_do')} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer">
                <RotateCcw size={15} /> Chơi Lại
              </button>
              {onDong && (
                <button onClick={onDong} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
                  Về Cổng Học Sinh
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
