// BẢN ĐỒ LỚP 3D bằng three.js — chỉ được NẠP LƯỜI (import động từ BanDo3D.tsx) ⇒ nằm trong chunk riêng, không vào gói chính, không vào precache của app học sinh/phụ huynh.
// Mỗi lớp một cột: chiều cao = số câu hôm nay, màu = tỉ lệ đúng (đỏ → vàng → xanh). Màu đọc từ token (`MauSan`); đổi sáng/tối ⇒ `datMau`. Không tạo được WebGL ⇒ `taoBan3D` trả null (màn lùi về isometric 2D).
import * as T from 'three'
import type { LopSan } from '../../lib/bang-tin-san/kieu'
import { boTriLop, docRgb, mauTheoTiLe, tiLeLop, tyLeCao, type ViTriNhan } from '../../lib/bang-tin-san/ban-do-chung'
import type { MauSan } from './hooks'

const BUOC_X = 3.0
const BUOC_Z = 1.35
const CANH = 1.5

export interface Ban3D {
  datLop(lop: readonly LopSan[]): void
  datMau(mau: MauSan): void
  /** Một bước: nội suy chiều cao cột (`dt` giây), xoay nhẹ khi không bị chặn, vẽ. `itDong` ⇒ cột về đích ngay, camera đứng yên. */
  buoc(dt: number, xoay: boolean, itDong: boolean): void
  doiKichThuoc(w: number, h: number): void
  /** Cột dưới con trỏ (toạ độ CSS trong khung); -1 nếu không có. */
  chon(px: number, py: number): number
  setChon(i: number): void
  /** Làm sáng cột `i` một nhịp (lớp vừa có câu mới). */
  loe(i: number): void
  vitriNhan(w: number, h: number): ViTriNhan[]
  giaiPhong(): void
}

interface Cot {
  mesh: T.Mesh<T.BoxGeometry, T.MeshStandardMaterial>
  vien: T.LineSegments
  cao: number
  loe: number
}

export function taoBan3D(cv: HTMLCanvasElement): Ban3D | null {
  let rd: T.WebGLRenderer
  try {
    rd = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true })
  } catch {
    return null
  }
  rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  rd.setClearColor(0x000000, 0)
  rd.shadowMap.enabled = true
  rd.shadowMap.type = T.PCFSoftShadowMap

  const canh = new T.Scene()
  const may = new T.PerspectiveCamera(30, 1.6, 0.1, 100)
  const troi = new T.HemisphereLight(0xffffff, 0x8899aa, 1.4)
  canh.add(troi)
  const nang = new T.DirectionalLight(0xffffff, 2.2)
  nang.position.set(6, 11, 5)
  nang.castShadow = true
  nang.shadow.mapSize.set(1024, 1024)
  const sc = nang.shadow.camera
  sc.left = -8
  sc.right = 8
  sc.top = 8
  sc.bottom = -8
  sc.near = 1
  sc.far = 32
  nang.shadow.bias = -0.0006
  nang.shadow.normalBias = 0.03
  canh.add(nang)

  // mặt lưới: tấm đế mỏng nhận bóng + các đường lưới
  const de = new T.Mesh(new T.BoxGeometry(10.6, 0.18, 6.9), new T.MeshStandardMaterial({ roughness: 0.95, metalness: 0 }))
  de.position.y = -0.09
  de.receiveShadow = true
  canh.add(de)
  const dd: number[] = []
  for (let x = -4.95; x <= 4.96; x += 0.9) dd.push(x, 0.004, -3.15, x, 0.004, 3.15)
  for (let z = -3.15; z <= 3.16; z += 0.9) dd.push(-4.95, 0.004, z, 4.95, 0.004, z)
  const hinhLuoi = new T.BufferGeometry()
  hinhLuoi.setAttribute('position', new T.Float32BufferAttribute(dd, 3))
  const luoi = new T.LineSegments(hinhLuoi, new T.LineBasicMaterial({ transparent: true, opacity: 0.9 }))
  canh.add(luoi)

  const hinhCot = new T.BoxGeometry(CANH, 1, CANH)
  hinhCot.translate(0, 0.5, 0)
  const hinhVien = new T.EdgesGeometry(hinhCot)
  const cacCot: Cot[] = []
  let lopHienTai: readonly LopSan[] = []
  let mauHienTai: MauSan | null = null
  let chonI = -1
  let t = 0
  let rong = 0
  let caoPx = 0
  const tia = new T.Raycaster()
  const v = new T.Vector3()
  const chuot = new T.Vector2()

  const xoaCot = (c: Cot) => {
    canh.remove(c.mesh)
    c.mesh.material.dispose()
    ;(c.vien.material as T.Material).dispose()
  }

  const tinhMau = (i: number): [number, number, number] | null => {
    const tl = tiLeLop(lopHienTai[i]!)
    return tl === null || !mauHienTai ? null : mauTheoTiLe(tl, mauHienTai.do, mauHienTai.vang, mauHienTai.la)
  }

  const datMauCot = (i: number) => {
    const c = cacCot[i]!
    const rgb = tinhMau(i)
    if (rgb) c.mesh.material.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, T.SRGBColorSpace)
    else if (mauHienTai) c.mesh.material.color.setRGB(...(docRgb(mauHienTai['xam-o']).map((x) => x / 255) as [number, number, number]), T.SRGBColorSpace)
    c.mesh.material.emissive.copy(c.mesh.material.color)
  }

  const b: Ban3D = {
    datLop(lop) {
      lopHienTai = lop
      while (cacCot.length > lop.length) xoaCot(cacCot.pop()!)
      const vi = boTriLop(lop.length)
      lop.forEach((_, i) => {
        if (!cacCot[i]) {
          const mesh = new T.Mesh(hinhCot, new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.04 }))
          mesh.castShadow = true
          mesh.receiveShadow = true
          const vien = new T.LineSegments(hinhVien, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }))
          mesh.add(vien)
          canh.add(mesh)
          cacCot[i] = { mesh, vien, cao: lop[i]!.soCau * tyLeCao(Math.max(0, ...lop.map((l) => l.soCau))), loe: 0 } // cột mới hiện NGAY ở đúng chiều cao (không mọc từ 0)
        }
        cacCot[i]!.mesh.position.set(vi[i]!.x * BUOC_X, 0, vi[i]!.z * BUOC_Z)
        datMauCot(i)
      })
    },
    datMau(mau) {
      mauHienTai = mau
      const toi = docRgb(mau.nen)[0] < 80
      de.material.color.setRGB(...(docRgb(mau['mat-2']).map((x) => x / 255) as [number, number, number]), T.SRGBColorSpace)
      luoi.material.color.setRGB(...(docRgb(mau.vien).map((x) => x / 255) as [number, number, number]), T.SRGBColorSpace)
      troi.intensity = toi ? 1.0 : 1.5
      nang.intensity = toi ? 1.7 : 2.2
      troi.groundColor.set(toi ? 0x1a2230 : 0xa9b4c2)
      lopHienTai.forEach((_, i) => datMauCot(i))
    },
    buoc(dt, xoay, itDong) {
      const k = itDong ? 1 : 1 - Math.exp(-dt * 5)
      const he = tyLeCao(Math.max(0, ...lopHienTai.map((l) => l.soCau)))
      cacCot.forEach((c, i) => {
        c.cao += (lopHienTai[i]!.soCau * he - c.cao) * k
        c.loe = Math.max(0, c.loe - dt * 1.6)
        c.mesh.scale.y = Math.max(0.05, c.cao)
        c.mesh.material.emissiveIntensity = 0.05 + c.loe * 0.55 + (chonI === i ? 0.3 : 0)
      })
      if (xoay && !itDong) t += dt
      const goc = 0.5 + 0.5 * Math.sin(t * 0.16)
      const xa = 16.5 * Math.max(1, 1.8 / (rong / Math.max(1, caoPx) || 1.8))
      const nghieng = 0.5
      may.position.set(Math.sin(goc) * Math.cos(nghieng) * xa, 2.0 + Math.sin(nghieng) * xa, Math.cos(goc) * Math.cos(nghieng) * xa)
      may.lookAt(0, 2.15, 0)
      if (rong > 1 && caoPx > 1) rd.render(canh, may)
    },
    doiKichThuoc(w, h) {
      if (w === rong && h === caoPx) return
      rong = w
      caoPx = h
      rd.setSize(w, h, false)
      may.aspect = w / Math.max(1, h)
      may.updateProjectionMatrix()
    },
    chon(px, py) {
      if (rong < 2 || caoPx < 2) return -1
      chuot.set((px / rong) * 2 - 1, -(py / caoPx) * 2 + 1)
      tia.setFromCamera(chuot, may)
      const tr = tia.intersectObjects(
        cacCot.map((c) => c.mesh),
        false,
      )
      return tr.length ? cacCot.findIndex((c) => c.mesh === tr[0]!.object) : -1
    },
    setChon(i) {
      chonI = i
    },
    loe(i) {
      if (cacCot[i]) cacCot[i]!.loe = 1
    },
    vitriNhan(w, h) {
      may.updateMatrixWorld()
      return cacCot.map((c) => {
        v.set(c.mesh.position.x, c.cao + 0.12, c.mesh.position.z).project(may)
        return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h - 4, w: 0, gan: (1 - v.z) * 4000 }
      })
    },
    giaiPhong() {
      cacCot.splice(0).forEach(xoaCot)
      canh.traverse((o) => {
        const m = o as T.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = m.material as T.Material | T.Material[] | undefined
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose())
      })
      hinhCot.dispose()
      hinhVien.dispose()
      rd.dispose()
      rd.forceContextLoss?.()
    },
  }
  return b
}
