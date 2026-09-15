/**
 * CẤP 120 — TAN THÀNH HƯ VÔ, NHẬP VỚI ĐẠI THỂ.
 *
 * Thầy chốt 15-09: *"cấp 120 thần thú tan thành hư vô NHẬP VỚI ĐẠI THỂ, làm
 * hiệu ứng tan thành hư vô thật ảo diệu và vũ trụ."*
 *
 * ───────────────────────────────────────────────────────────────────────────
 * Ý NGHĨA PHẢI GIỮ: đây KHÔNG phải hiệu ứng "chết" hay "biến mất". Thú đi tới
 * cùng đường tu thì tan ra, hoà vào cái lớn hơn nó. Nên ba lớp phải cùng kể
 * MỘT câu chuyện, theo đúng thứ tự:
 *
 *   1. RÃ RA   — thân thú mờ dần, từng mảng sáng bong khỏi hình hài.
 *   2. CUỐN LÊN — các hạt xoáy theo trục đứng, dâng lên thành một cột sáng.
 *   3. TOẢ RỘNG — cột vỡ ra thành thiên hà nhỏ, xoay chậm, không bao giờ tắt.
 *
 * Tới bước 3 thì DỪNG Ở ĐÓ: thú đã thành một phần của đại thể, không quay lại
 * hình cũ. Đó là lý do hàm này không có đường "kết thúc" — nó chạy mãi.
 *
 * KHÔNG dùng hệ hạt của thư viện ngoài: `Points` sẵn có của three cộng một
 * tấm vân chấm tròn tự sinh là đủ, và nhẹ hơn hẳn cho máy điện thoại của em.
 */

import * as THREE from 'three'

/** Số hạt. Máy cảm ứng ít hơn cho đỡ tốn pin. */
export const SO_HAT_MAY_BAN = 2600
export const SO_HAT_DIEN_THOAI = 1100

export function soHatTheoMay(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return SO_HAT_DIEN_THOAI
  }
  try {
    return window.matchMedia('(pointer: fine)').matches ? SO_HAT_MAY_BAN : SO_HAT_DIEN_THOAI
  } catch {
    return SO_HAT_DIEN_THOAI
  }
}

/** Ba pha, tính theo giây kể từ lúc bắt đầu tan. */
export const PHA_RA = 1.6
export const PHA_CUON = 3.4
/** Sau mốc này là pha toả rộng — chạy mãi, không kết thúc. */

/** Tấm vân một chấm tròn mềm — hạt vuông nhìn ra pixel vỡ, không ra bụi sao. */
export function texHatSao(canh = 64): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = canh
  c.height = canh
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    const g = ctx.createRadialGradient(canh / 2, canh / 2, 0, canh / 2, canh / 2, canh / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.75)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, canh, canh)
  }
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

export interface BoTanHuVo {
  nhom: THREE.Group
  /** Gọi mỗi khung hình. `t` là số giây kể từ lúc bắt đầu tan. */
  capNhat(t: number, dt: number): void
  /** 0…1 — thân thú phải mờ đi theo đúng con số này. */
  doMoThan(t: number): number
  don(): void
}

/**
 * Dựng bộ tan hư vô quanh một khối có bán kính ~`banKinh`.
 *
 * `mauChinh` / `mauPhu` lấy từ chính con thú: tan vào hư vô nhưng vẫn phải
 * nhận ra đó là con thú của em, không phải một đám bụi trắng chung chung.
 */
export function dungTanHuVo(
  banKinh: number,
  mauChinh: THREE.Color,
  mauPhu: THREE.Color,
  soHat?: number,
): BoTanHuVo {
  const n = Math.max(200, soHat ?? soHatTheoMay())
  const nhom = new THREE.Group()
  const rac: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = []

  const tex = texHatSao()
  rac.push(tex)

  // ── HẠT ──
  const vt = new Float32Array(n * 3)
  const mau = new Float32Array(n * 3)
  const co = new Float32Array(n)
  /** Mỗi hạt giữ toạ độ cầu riêng để ba pha tính được mà không cần mảng phụ. */
  const goc = new Float32Array(n * 3)   // bán kính gốc, góc phương vị, góc cực
  const treTre = new Float32Array(n)    // mỗi hạt rã ở một nhịp khác nhau

  const c1 = mauChinh.clone()
  const c2 = mauPhu.clone().lerp(new THREE.Color(1, 1, 1), 0.45)
  for (let i = 0; i < n; i++) {
    // Rải đều TRONG khối cầu (căn bậc ba), không rải trên mặt cầu: thú là khối
    // đặc, rã ra phải thấy hạt bung từ trong lòng chứ không chỉ từ lớp vỏ.
    const r = banKinh * (0.25 + 1.15 * Math.cbrt(Math.random()))
    const a = Math.random() * Math.PI * 2
    const p = Math.acos(2 * Math.random() - 1)
    goc[i * 3] = r
    goc[i * 3 + 1] = a
    goc[i * 3 + 2] = p
    vt[i * 3] = r * Math.sin(p) * Math.cos(a)
    vt[i * 3 + 1] = r * Math.cos(p)
    vt[i * 3 + 2] = r * Math.sin(p) * Math.sin(a)
    const m = c1.clone().lerp(c2, Math.random())
    mau[i * 3] = m.r
    mau[i * 3 + 1] = m.g
    mau[i * 3 + 2] = m.b
    co[i] = 0.035 + Math.random() * 0.075
    treTre[i] = Math.random() * PHA_RA * 0.8
  }

  const hinh = new THREE.BufferGeometry()
  hinh.setAttribute('position', new THREE.BufferAttribute(vt, 3))
  hinh.setAttribute('color', new THREE.BufferAttribute(mau, 3))
  hinh.setAttribute('size', new THREE.BufferAttribute(co, 1))
  rac.push(hinh)

  const vl = new THREE.PointsMaterial({
    size: 0.07,
    map: tex,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  rac.push(vl)
  const hat = new THREE.Points(hinh, vl)
  nhom.add(hat)

  // ── CỘT SÁNG của pha cuốn lên ──
  const gCot = new THREE.CylinderGeometry(banKinh * 0.32, banKinh * 0.06, banKinh * 5, 26, 1, true)
  const mCot = new THREE.MeshBasicMaterial({
    color: c2, transparent: true, opacity: 0, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })
  rac.push(gCot, mCot)
  const cot = new THREE.Mesh(gCot, mCot)
  cot.position.y = banKinh * 1.6
  nhom.add(cot)

  // ── BA VÒNG THIÊN HÀ của pha toả rộng ──
  const vongs: THREE.Mesh[] = []
  for (let k = 0; k < 3; k++) {
    const g = new THREE.TorusGeometry(banKinh * (1.5 + k * 0.7), banKinh * 0.02, 8, 64)
    const m = new THREE.MeshBasicMaterial({
      color: k === 1 ? c1 : c2, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
    rac.push(g, m)
    const v = new THREE.Mesh(g, m)
    v.rotation.set(Math.PI / 2 - 0.25 + k * 0.22, 0, k * 0.4)
    nhom.add(v)
    vongs.push(v)
  }

  const viTri = hinh.getAttribute('position') as THREE.BufferAttribute
  const mang = viTri.array as Float32Array

  return {
    nhom,
    doMoThan(t: number): number {
      // Thân tan hết đúng lúc pha rã kết thúc.
      return Math.max(0, 1 - t / PHA_RA)
    },
    capNhat(t: number, dt: number): void {
      for (let i = 0; i < n; i++) {
        const u = Math.max(0, t - treTre[i]!)
        const r0 = goc[i * 3]!
        const a0 = goc[i * 3 + 1]!
        const p0 = goc[i * 3 + 2]!
        let r: number, a: number, y: number
        if (t < PHA_CUON) {
          // PHA 1–2: xoáy quanh trục đứng, bán kính co lại, dâng lên.
          const w = Math.min(1, u / PHA_CUON)
          a = a0 + w * w * 9
          r = r0 * (1 - w * 0.72)
          y = r0 * Math.cos(p0) + w * w * banKinh * 3.4
        } else {
          // PHA 3: toả ra thành đĩa thiên hà, xoay chậm mãi.
          const w = t - PHA_CUON
          a = a0 + w * 0.5 + r0 * 0.8
          r = r0 * 0.28 + Math.min(banKinh * 2.4, w * banKinh * 0.9) * (0.35 + r0 / banKinh)
          y = banKinh * 3.4 + Math.sin(a0 * 3 + w * 0.6) * banKinh * 0.3 - Math.min(w, 2) * banKinh * 1.1
        }
        mang[i * 3] = Math.cos(a) * r
        mang[i * 3 + 1] = y
        mang[i * 3 + 2] = Math.sin(a) * r
      }
      viTri.needsUpdate = true
      // Hạt hiện dần đúng nhịp thân mờ đi — không có khung hình nào trống trơn.
      vl.opacity = Math.min(1, t / (PHA_RA * 0.7)) * (t < PHA_CUON ? 1 : 0.85)
      vl.size = 0.07 + Math.min(1, t / PHA_CUON) * 0.05

      const uCot = t < PHA_CUON ? Math.sin(Math.min(1, t / PHA_CUON) * Math.PI) : 0
      mCot.opacity = uCot * 0.4
      cot.rotation.y += dt * 1.6
      cot.scale.setScalar(0.5 + uCot * 0.8)

      const uVong = Math.max(0, Math.min(1, (t - PHA_CUON) / 1.2))
      for (const [k, v] of vongs.entries()) {
        ;(v.material as THREE.MeshBasicMaterial).opacity = uVong * (0.34 - k * 0.07)
        v.rotation.z += dt * (0.22 + k * 0.1)
        v.position.y = banKinh * 3.4 - Math.min(t - PHA_CUON, 2) * banKinh * 1.1
        v.scale.setScalar(0.4 + uVong * 0.8)
      }
    },
    don(): void {
      for (const r of rac) r.dispose()
      rac.length = 0
      nhom.clear()
    },
  }
}
