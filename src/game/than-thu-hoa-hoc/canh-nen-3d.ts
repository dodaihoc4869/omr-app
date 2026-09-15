/**
 * SÁU KHUNG CẢNH — MỖI HỆ MỘT NƠI Ở.
 *
 * Thầy chốt 15-09: "mỗi con phải xuất hiện ở một khung cảnh phù hợp khác nhau,
 * không để hình nền trắng."
 *
 * ───────────────────────────────────────────────────────────────────────────
 * Cảnh không phải để trang trí. Nền trắng làm con thú trông như ảnh cắt dán —
 * mắt không có gì để so bóng, so chiều sâu, nên khối nào cũng bẹt. Đặt thú vào
 * một cái lò, một bể acid, một hang tinh thể thì ánh sáng có nguồn, sương mù có
 * chiều sâu, và bộ lông có nền tối để bắt sáng viền.
 *
 * Mỗi cảnh cũng là một bài học: lò nhiệt nhôm, bể cường toan, hang kết tủa
 * BaSO₄, tầng mây halogen, buồng pin Zn–Cu, rừng ester–polymer. Em nhìn cảnh
 * là đoán được hệ, không cần đọc chữ.
 *
 * KHÔNG MỘT TỆP TÀI NGUYÊN NÀO — trời, sàn, hạt đều sinh bằng canvas lúc chạy.
 */

import * as THREE from 'three'
import { mauTuChuoi } from './dung-than-thu-3d'
import type { HeNguyenTo } from './tuong-khac'

type Rac = THREE.BufferGeometry | THREE.Material | THREE.Texture

interface CauHinhCanh {
  ten: string
  /** Ba nấc màu trời, từ đỉnh xuống chân. */
  troi: readonly [string, string, string]
  mu: string
  dacMu: number
  san: string
  bongSan: number
  denChinh: string
  denPhu: string
  denVien: string
  moiTruong: number
  hat: {
    mau: string
    so: number
    co: number
    kieu: 'len' | 'roi' | 'troi' | 'toe'
    toc: number
    cong: boolean
  }
}

export const CAU_HINH_CANH: Record<HeNguyenTo, CauHinhCanh> = {
  hoa: {
    ten: 'Lò Nhiệt Nhôm',
    troi: ['rgb(28, 8, 6)', 'rgb(86, 20, 10)', 'rgb(190, 68, 18)'],
    mu: 'rgb(72, 20, 10)', dacMu: 0.055,
    san: 'rgb(44, 22, 16)', bongSan: 0.86,
    denChinh: 'rgb(255, 178, 104)', denPhu: 'rgb(255, 96, 40)', denVien: 'rgb(255, 214, 150)',
    moiTruong: 0.44,
    hat: { mau: 'rgb(255, 156, 58)', so: 110, co: 0.17, kieu: 'len', toc: 0.62, cong: true },
  },
  axit: {
    ten: 'Bể Cường Toan',
    troi: ['rgb(16, 8, 34)', 'rgb(48, 22, 82)', 'rgb(108, 58, 166)'],
    mu: 'rgb(42, 20, 74)', dacMu: 0.06,
    san: 'rgb(58, 28, 96)', bongSan: 0.26,
    denChinh: 'rgb(226, 200, 255)', denPhu: 'rgb(140, 92, 246)', denVien: 'rgb(196, 152, 255)',
    moiTruong: 0.42,
    hat: { mau: 'rgb(206, 168, 255)', so: 100, co: 0.15, kieu: 'len', toc: 0.34, cong: false },
  },
  kiem: {
    ten: 'Hang Tinh Thể BaSO₄',
    troi: ['rgb(6, 20, 44)', 'rgb(16, 58, 104)', 'rgb(126, 190, 232)'],
    mu: 'rgb(22, 62, 108)', dacMu: 0.05,
    san: 'rgb(156, 196, 224)', bongSan: 0.52,
    denChinh: 'rgb(226, 244, 255)', denPhu: 'rgb(96, 170, 240)', denVien: 'rgb(180, 226, 255)',
    moiTruong: 0.52,
    hat: { mau: 'rgb(222, 244, 255)', so: 120, co: 0.12, kieu: 'troi', toc: 0.16, cong: true },
  },
  khi: {
    ten: 'Tầng Mây Halogen',
    troi: ['rgb(6, 34, 30)', 'rgb(14, 82, 62)', 'rgb(132, 204, 132)'],
    mu: 'rgb(22, 80, 62)', dacMu: 0.062,
    san: 'rgb(48, 104, 78)', bongSan: 0.9,
    denChinh: 'rgb(226, 255, 226)', denPhu: 'rgb(74, 210, 140)', denVien: 'rgb(170, 255, 200)',
    moiTruong: 0.5,
    hat: { mau: 'rgb(176, 240, 176)', so: 100, co: 0.2, kieu: 'troi', toc: 0.22, cong: false },
  },
  dien: {
    ten: 'Buồng Pin Zn–Cu',
    troi: ['rgb(8, 14, 26)', 'rgb(24, 44, 72)', 'rgb(64, 132, 186)'],
    mu: 'rgb(20, 38, 62)', dacMu: 0.055,
    san: 'rgb(48, 58, 74)', bongSan: 0.4,
    denChinh: 'rgb(224, 244, 255)', denPhu: 'rgb(56, 170, 248)', denVien: 'rgb(150, 224, 255)',
    moiTruong: 0.44,
    hat: { mau: 'rgb(150, 228, 255)', so: 130, co: 0.12, kieu: 'toe', toc: 1.5, cong: true },
  },
  huuco: {
    ten: 'Rừng Ester Polymer',
    troi: ['rgb(10, 30, 12)', 'rgb(38, 76, 24)', 'rgb(168, 176, 72)'],
    mu: 'rgb(38, 70, 30)', dacMu: 0.052,
    san: 'rgb(62, 86, 38)', bongSan: 0.94,
    denChinh: 'rgb(255, 244, 198)', denPhu: 'rgb(150, 204, 70)', denVien: 'rgb(220, 250, 160)',
    moiTruong: 0.48,
    hat: { mau: 'rgb(186, 220, 96)', so: 90, co: 0.13, kieu: 'roi', toc: 0.3, cong: false },
  },
}

export const TEN_CANH: Record<HeNguyenTo, string> = {
  hoa: CAU_HINH_CANH.hoa.ten,
  axit: CAU_HINH_CANH.axit.ten,
  kiem: CAU_HINH_CANH.kiem.ten,
  khi: CAU_HINH_CANH.khi.ten,
  dien: CAU_HINH_CANH.dien.ten,
  huuco: CAU_HINH_CANH.huuco.ten,
}

/** Trời: dải chuyển sắc dọc, sinh bằng canvas. Không bao giờ là nền trắng. */
function texTroi(c: CauHinhCanh): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 8
  cv.height = 512
  const ctx = cv.getContext('2d')
  if (ctx !== null) {
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, c.troi[0])
    g.addColorStop(0.58, c.troi[1])
    g.addColorStop(1, c.troi[2])
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 8, 512)
  }
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Chấm tròn mềm — dùng cho hạt và cho mép sàn tan vào sương. */
function texChamTron(cung = 0.25): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 128
  cv.height = 128
  const ctx = cv.getContext('2d')
  if (ctx !== null) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255, 255, 255, 1)')
    g.addColorStop(cung, 'rgba(255, 255, 255, 0.92)')
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  return new THREE.CanvasTexture(cv)
}

export interface BoCanhNen {
  ten: string
  /** Đạo cụ, sàn, hạt — thêm vào cảnh một lần. */
  nhom: THREE.Group
  troi: THREE.Texture
  suongMu: THREE.FogExp2
  denChinh: THREE.Color
  denPhu: THREE.Color
  denVien: THREE.Color
  moiTruong: number
  capNhat(t: number, dt: number): void
  rac: Rac[]
}

/**
 * Dựng cả khung cảnh cho một hệ. `dayNen` là cao độ mặt sàn — lấy từ đáy hộp
 * bao của con thú để thú nào cũng ĐỨNG trên sàn chứ không lơ lửng hay lún.
 */
export function dungCanhNen(he: HeNguyenTo, dayNen = -1.45): BoCanhNen {
  const c = CAU_HINH_CANH[he]
  const rac: Rac[] = []
  const nhom = new THREE.Group()
  const viec: ((t: number, dt: number) => void)[] = []

  const ghi = <T extends Rac>(x: T): T => { rac.push(x); return x }

  // LUẬT ĐẠO CỤ: máy quay đứng ở +Z. Đạo cụ nằm ở z dương mà gần trục đứng sẽ
  // chắn ngay trước mặt thú. Ảnh chụp bản trước bắt được hai ca: vòng sáu cạnh
  // hữu cơ xiên qua mặt, ba vòng khí halogen cắt thân thành khoanh. Nên mọi
  // đạo cụ chỉ đứng ở NỬA SAU (z ≤ −1,2) hoặc dạt hẳn sang bên (|x| ≥ 2,8).
  const khongChanMat = (x: number, z: number): boolean => z <= -1.2 || Math.abs(x) >= 2.8

  const troi = ghi(texTroi(c))
  const mauSan = mauTuChuoi(c.san)
  const mauHat = mauTuChuoi(c.hat.mau)
  const mauPhu = mauTuChuoi(c.denPhu)

  // ─── SÀN: đĩa tròn, mép tan dần vào sương nên không thấy đường cắt ───
  const nhoeSan = ghi(texChamTron(0.52))
  const gSan = ghi(new THREE.CircleGeometry(6.4, 72))
  const mSan = ghi(new THREE.MeshStandardMaterial({
    color: mauSan, roughness: c.bongSan, metalness: c.bongSan < 0.45 ? 0.35 : 0.04,
    alphaMap: nhoeSan, transparent: true, depthWrite: false,
  }))
  const san = new THREE.Mesh(gSan, mSan)
  san.rotation.x = -Math.PI / 2
  san.position.y = dayNen
  san.receiveShadow = true
  nhom.add(san)

  // ─── HẠT MÔI TRƯỜNG ───
  const soHat = c.hat.so
  const vt = new Float32Array(soHat * 3)
  const nhip = new Float32Array(soHat)
  const reset = (i: number, caoNgauNhien: boolean) => {
    const a = Math.random() * Math.PI * 2
    const r = 0.9 + Math.random() * 5.2
    vt[i * 3] = Math.cos(a) * r
    vt[i * 3 + 2] = Math.sin(a) * r
    if (c.hat.kieu === 'roi') vt[i * 3 + 1] = caoNgauNhien ? dayNen + Math.random() * 6 : dayNen + 6
    else if (c.hat.kieu === 'len') vt[i * 3 + 1] = caoNgauNhien ? dayNen + Math.random() * 3.6 : dayNen
    else vt[i * 3 + 1] = dayNen + Math.random() * 5.4
    nhip[i] = Math.random() * Math.PI * 2
  }
  for (let i = 0; i < soHat; i++) reset(i, true)
  const gHat = ghi(new THREE.BufferGeometry())
  gHat.setAttribute('position', new THREE.BufferAttribute(vt, 3))
  const texHat = ghi(texChamTron(c.hat.kieu === 'troi' ? 0.05 : 0.3))
  const mHat = ghi(new THREE.PointsMaterial({
    color: mauHat, size: c.hat.co, map: texHat, transparent: true, depthWrite: false,
    opacity: c.hat.kieu === 'troi' ? 0.3 : 0.85,
    blending: c.hat.cong ? THREE.AdditiveBlending : THREE.NormalBlending,
    sizeAttenuation: true,
  }))
  const hat = new THREE.Points(gHat, mHat)
  nhom.add(hat)
  viec.push((_t, dt) => {
    const p = gHat.getAttribute('position') as THREE.BufferAttribute
    const m = p.array as Float32Array
    for (let i = 0; i < soHat; i++) {
      nhip[i] = nhip[i]! + dt * 2.2
      const lac = Math.sin(nhip[i]!) * dt * 0.42
      if (c.hat.kieu === 'roi') {
        m[i * 3 + 1] = m[i * 3 + 1]! - dt * c.hat.toc
        m[i * 3] = m[i * 3]! + lac
        if (m[i * 3 + 1]! < dayNen) reset(i, false)
      } else if (c.hat.kieu === 'len' || c.hat.kieu === 'toe') {
        m[i * 3 + 1] = m[i * 3 + 1]! + dt * c.hat.toc * (c.hat.kieu === 'toe' ? 0.5 + Math.random() : 1)
        m[i * 3] = m[i * 3]! + lac
        if (m[i * 3 + 1]! > dayNen + 3.6) reset(i, false)
      } else {
        m[i * 3] = m[i * 3]! + Math.cos(nhip[i]!) * dt * c.hat.toc
        m[i * 3 + 2] = m[i * 3 + 2]! + Math.sin(nhip[i]! * 0.7) * dt * c.hat.toc
        m[i * 3 + 1] = m[i * 3 + 1]! + Math.sin(nhip[i]! * 0.4) * dt * c.hat.toc * 0.4
      }
    }
    p.needsUpdate = true
  })

  // ─── ĐẠO CỤ RIÊNG TỪNG HỆ ───
  const phat = (mau: THREE.Color, manh: number, nham = 0.4) =>
    ghi(new THREE.MeshStandardMaterial({
      color: mau, emissive: mau, emissiveIntensity: manh, roughness: nham, metalness: 0.1,
    }))

  if (he === 'hoa') {
    // Than hồng rải quanh chân lò, thở sáng theo nhịp.
    const gDa = ghi(new THREE.IcosahedronGeometry(0.13, 0))
    const mDa = phat(mauTuChuoi('rgb(178, 52, 14)'), 0.55, 0.78)
    const ds: THREE.Mesh[] = []
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.4
      const r = 2.9 + (i % 3) * 0.86
      if (!khongChanMat(Math.cos(a) * r, Math.sin(a) * r)) continue
      const d = new THREE.Mesh(gDa, mDa)
      d.position.set(Math.cos(a) * r, dayNen + 0.1, Math.sin(a) * r)
      d.scale.setScalar(0.7 + (i % 4) * 0.22)
      nhom.add(d)
      ds.push(d)
    }
    viec.push((t) => { mDa.emissiveIntensity = 0.42 + Math.sin(t * 2.4) * 0.26 })
    viec.push((t) => { for (const [i, d] of ds.entries()) d.rotation.y = t * 0.2 + i })
  } else if (he === 'axit') {
    // Ba bình thuỷ tinh đựng cường toan đứng phía sau.
    const gBinh = ghi(new THREE.CylinderGeometry(0.42, 0.5, 1.9, 22, 1, true))
    const mBinh = ghi(new THREE.MeshStandardMaterial({
      color: mauTuChuoi('rgb(206, 190, 255)'), roughness: 0.08, metalness: 0.05,
      transparent: true, opacity: 0.22, side: THREE.DoubleSide,
    }))
    const gNuoc = ghi(new THREE.CylinderGeometry(0.38, 0.46, 1.05, 22))
    const mNuoc = phat(mauTuChuoi('rgb(158, 92, 246)'), 0.55, 0.2)
    for (const [i, x] of [-3.3, 3.2, -1.9].entries()) {
      const z = i === 2 ? -3.6 : -2.4
      const b = new THREE.Mesh(gBinh, mBinh)
      b.position.set(x, dayNen + 0.95, z)
      nhom.add(b)
      const n = new THREE.Mesh(gNuoc, mNuoc)
      n.position.set(x, dayNen + 0.52, z)
      nhom.add(n)
    }
    viec.push((t) => { mNuoc.emissiveIntensity = 0.42 + Math.sin(t * 1.6) * 0.18 })
  } else if (he === 'kiem') {
    // Măng tinh thể BaSO₄ mọc lên từ sàn hang.
    const gTinh = ghi(new THREE.ConeGeometry(0.26, 1.5, 5))
    const mTinh = ghi(new THREE.MeshStandardMaterial({
      color: mauTuChuoi('rgb(206, 234, 255)'), roughness: 0.12, metalness: 0.2,
      transparent: true, opacity: 0.72,
      emissive: mauTuChuoi('rgb(120, 190, 240)'), emissiveIntensity: 0.3,
    }))
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.25
      const r = 2.6 + (i % 4) * 0.66
      if (!khongChanMat(Math.cos(a) * r, Math.sin(a) * r)) continue
      const m = new THREE.Mesh(gTinh, mTinh)
      const co = 0.55 + ((i * 7) % 5) * 0.3
      m.scale.set(co, co * (0.7 + ((i * 3) % 4) * 0.35), co)
      m.position.set(Math.cos(a) * r, dayNen + 0.74 * m.scale.y, Math.sin(a) * r)
      m.rotation.z = (((i * 5) % 7) - 3) * 0.06
      nhom.add(m)
    }
  } else if (he === 'khi') {
    // Dải mây khí halogen dồn về phía sau, không còn vòng nào chạy qua trước mặt.
    const gMay = ghi(new THREE.SphereGeometry(1, 24, 16))
    const mMay = ghi(new THREE.MeshStandardMaterial({
      color: mauTuChuoi('rgb(138, 226, 162)'), transparent: true, opacity: 0.2,
      emissive: mauTuChuoi('rgb(74, 210, 140)'), emissiveIntensity: 0.3,
      roughness: 0.95, depthWrite: false,
    }))
    const ds: THREE.Mesh[] = []
    const CHO: readonly [number, number, number, number][] = [
      [-3.6, 1.1, -3.4, 1.0], [3.4, 1.9, -4.0, 1.25], [-0.6, 3.0, -4.6, 1.1],
      [4.6, 0.5, -2.6, 0.85], [-4.8, 2.5, -5.0, 1.15],
    ]
    for (const [x, y, z, k] of CHO) {
      const m = new THREE.Mesh(gMay, mMay)
      m.position.set(x, dayNen + y, z)
      m.scale.set(2.3 * k, 0.56 * k, 1.5 * k)
      nhom.add(m)
      ds.push(m)
    }
    viec.push((t) => {
      for (const [i, m] of ds.entries()) {
        m.position.x += Math.sin(t * 0.22 + i) * 0.004
        m.rotation.y = Math.sin(t * 0.14 + i) * 0.2
      }
    })
  } else if (he === 'dien') {
    // Hai điện cực: kẽm bên trái (cực âm), đồng bên phải (cực dương).
    const gCuc = ghi(new THREE.CylinderGeometry(0.3, 0.3, 3.4, 20))
    const mZn = ghi(new THREE.MeshStandardMaterial({
      color: mauTuChuoi('rgb(176, 184, 196)'), roughness: 0.3, metalness: 0.92,
    }))
    const mCu = ghi(new THREE.MeshStandardMaterial({
      color: mauTuChuoi('rgb(206, 122, 62)'), roughness: 0.26, metalness: 0.95,
    }))
    for (const [x, m] of [[-3.5, mZn], [3.5, mCu]] as const) {
      const cuc = new THREE.Mesh(gCuc, m)
      cuc.position.set(x, dayNen + 1.7, -1.5)
      cuc.castShadow = true
      nhom.add(cuc)
    }
    // Hồ quang chập chờn nối hai cực.
    const gHq = ghi(new THREE.TorusGeometry(3.5, 0.035, 6, 48, Math.PI))
    const mHq = ghi(new THREE.MeshBasicMaterial({
      color: mauTuChuoi('rgb(168, 232, 255)'), transparent: true, opacity: 0.5, depthWrite: false,
    }))
    const hq = new THREE.Mesh(gHq, mHq)
    hq.position.set(0, dayNen + 3.4, -1.5)
    nhom.add(hq)
    viec.push((t) => {
      mHq.opacity = 0.16 + Math.abs(Math.sin(t * 7.3)) * 0.5
      hq.scale.y = 0.8 + Math.sin(t * 5.1) * 0.2
    })
  } else {
    // Hữu cơ: mạch polymer vắt thành vòng cung phía sau lưng thú. Bản trước
    // rải vòng quanh trục đứng nên có vòng rơi đúng trước mặt, xiên qua mõm.
    const gVong = ghi(new THREE.TorusGeometry(0.34, 0.062, 5, 6))
    const mVong = ghi(new THREE.MeshStandardMaterial({
      color: mauTuChuoi('rgb(174, 214, 92)'), roughness: 0.42, metalness: 0.15,
      emissive: mauTuChuoi('rgb(120, 170, 50)'), emissiveIntensity: 0.22,
    }))
    const mach = new THREE.Group()
    const SO = 11
    for (let i = 0; i < SO; i++) {
      const u = i / (SO - 1)
      const v = new THREE.Mesh(gVong, mVong)
      v.position.set((u - 0.5) * 8.4, dayNen + 0.7 + Math.sin(u * Math.PI) * 2.6, -3.2 - Math.sin(u * Math.PI * 2) * 0.8)
      v.rotation.set(0.42, (u - 0.5) * 1.1, u * Math.PI * 1.6)
      mach.add(v)
    }
    nhom.add(mach)
    viec.push((t) => {
      mach.position.y = Math.sin(t * 0.5) * 0.14
      mach.rotation.z = Math.sin(t * 0.32) * 0.045
    })
  }

  const suongMu = new THREE.FogExp2(mauTuChuoi(c.mu).getHex(), c.dacMu)

  return {
    ten: c.ten,
    nhom,
    troi,
    suongMu,
    denChinh: mauTuChuoi(c.denChinh),
    denPhu: mauPhu,
    denVien: mauTuChuoi(c.denVien),
    moiTruong: c.moiTruong,
    capNhat(t, dt) { for (const v of viec) v(t, dt) },
    rac,
  }
}

/** Trả bộ nhớ GPU của cảnh. Quên là rò mỗi lần đổi thần thú. */
export function donCanhNen(bo: BoCanhNen): void {
  for (const r of bo.rac) r.dispose()
  bo.rac.length = 0
  bo.nhom.clear()
}
