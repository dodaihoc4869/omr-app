/**
 * LÔNG THÚ — BỌC NHIỀU LỚP VỎ (shell fur).
 *
 * Thầy chốt 15-09: "con thú phải mềm mại đáng yêu, có lông mịn màng".
 *
 * ───────────────────────────────────────────────────────────────────────────
 * CÁCH LÀM, và tại sao là cách này chứ không phải cách khác:
 *
 * Lông thật trong đồ hoạ có ba lối: dựng từng sợi (đẹp nhất, nặng nhất — hàng
 * vạn khối, điện thoại chết), shader tuỳ biến (phải viết GLSL, mất đường lui
 * khi máy không dựng được), và BỌC LỚP VỎ. Lối thứ ba: chồng N bản sao của
 * thân, mỗi bản phình ra một chút theo pháp tuyến, mỗi bản khoét thủng theo một
 * ngưỡng alpha tăng dần. Sợi nào "ngắn" thì biến mất ở lớp ngoài, sợi "dài" còn
 * tới lớp cuối — mắt người đọc chồng lớp đó thành lông.
 *
 * Mấu chốt nằm ở TẤM VÂN: mỗi sợi là một chấm chuyển sắc tròn, tâm sáng viền
 * tối. Ngưỡng alpha càng lên cao càng cắt sát tâm, nên sợi TỰ THON LẠI thành
 * ngọn nhọn. Không có chuyển sắc thì ra búi trụ cụt, nhìn như cỏ nhựa.
 *
 * KHÔNG dùng `transparent: true`. Vỏ trong suốt phải sắp xếp lại theo chiều sâu
 * mỗi khung hình và vẫn sai khi thú xoay; dùng `alphaTest` thì vỏ vẫn là khối
 * đục, chiều sâu đúng tuyệt đối và nhanh hơn hẳn. Đây là lý do lông không nháy
 * khi em xoay thú 360 độ.
 *
 * KHÔNG MỘT TỆP TÀI NGUYÊN NÀO — tấm vân sinh bằng canvas lúc chạy.
 */

import * as THREE from 'three'

/** Số lớp vỏ. Máy cảm ứng (điện thoại) ít lớp hơn cho đỡ tốn pin. */
export const SO_LOP_MAY_BAN = 14
export const SO_LOP_DIEN_THOAI = 9

export function soLopTheoMay(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return SO_LOP_DIEN_THOAI
  }
  try {
    return window.matchMedia('(pointer: fine)').matches ? SO_LOP_MAY_BAN : SO_LOP_DIEN_THOAI
  } catch {
    return SO_LOP_DIEN_THOAI
  }
}

/**
 * TẤM VÂN SỢI LÔNG. Mỗi sợi một chấm chuyển sắc: tâm giá trị cao (sợi dài),
 * viền về 0 (nên khi ngưỡng alpha lên cao, chấm co lại → sợi thon thành ngọn).
 *
 * Giá trị tâm rải đều 0,30…1,00 chứ không để đồng loạt 1,00: lông dài đều nhau
 * nhìn như thảm chùi chân, dài ngắn xen kẽ mới ra bộ lông tơ.
 */
export function texSoiLong(soSoi = 11000, canh = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = canh
  c.height = canh
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, canh, canh)
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < soSoi; i++) {
      const x = Math.random() * canh
      const y = Math.random() * canh
      const r = 1.9 + Math.random() * 2.0
      const dai = 0.3 + Math.random() * 0.7
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const v = Math.round(dai * 255)
      g.addColorStop(0, `rgba(${v}, ${v}, ${v}, 1)`)
      g.addColorStop(0.55, `rgba(${Math.round(v * 0.62)}, ${Math.round(v * 0.62)}, ${Math.round(v * 0.62)}, 1)`)
      g.addColorStop(1, 'rgba(0, 0, 0, 1)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export interface BoLong {
  /** Các lớp vỏ, từ sát da ra ngoài cùng. */
  lop: THREE.Mesh[]
  rac: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
  /**
   * Rủ lông. `huong` là véc-tơ dịch của NGỌN lông (đơn vị: đơn vị cảnh) —
   * trọng lực cộng gió cộng quán tính khi thú xoay. Lớp sát da gần như không
   * nhúc nhích, lớp ngoài cùng đi trọn `huong`; đó là cái làm lông "mềm".
   */
  ruLong(huong: THREE.Vector3): void
}

export interface ThamSoLong {
  soLop?: number
  /** Bề dày bộ lông, tính theo tỉ lệ bán kính khối được bọc. */
  dayLong?: number
  /** Dùng chung một tấm vân cho cả con thú — đỡ bộ nhớ. */
  tex?: THREE.CanvasTexture
  /** Số lần lặp vân; khối to thì lặp nhiều cho sợi không bị kéo dãn. */
  lapVan?: number
  /** Độ nhám. Lông mịn ≈ 0,92; lông bóng như vảy ≈ 0,5. */
  nham?: number
}

/**
 * Bọc lông quanh một khối. Trả về các lớp vỏ đã gắn vào `vao`.
 *
 * Vỏ là ANH EM của khối gốc chứ không phải con — nhờ vậy `ruLong` chỉ cần dịch
 * `position` của từng lớp, không phải đụng tới ma trận của khối gốc đang bị
 * hoạt ảnh thở bóp méo.
 */
export function bocLong(
  vao: THREE.Object3D,
  hinh: THREE.BufferGeometry,
  cho: { vt: THREE.Vector3; co: THREE.Vector3; xoay?: THREE.Euler },
  mauGoc: THREE.Color,
  mauNgon: THREE.Color,
  ts: ThamSoLong = {},
): BoLong {
  const soLop = Math.max(2, ts.soLop ?? soLopTheoMay())
  const day = ts.dayLong ?? 0.17
  const lapVan = ts.lapVan ?? 5
  const nham = ts.nham ?? 0.92
  const rac: BoLong['rac'] = []

  const tex = ts.tex ?? texSoiLong()
  if (ts.tex === undefined) rac.push(tex)
  // Tấm vân dùng chung nên KHÔNG đổi `repeat` của bản gốc; nhân bản cho khối này.
  const van = tex.clone()
  van.needsUpdate = true
  van.wrapS = THREE.RepeatWrapping
  van.wrapT = THREE.RepeatWrapping
  van.repeat.set(lapVan, lapVan * 0.6)
  rac.push(van)

  const lop: THREE.Mesh[] = []
  const goc: THREE.Vector3[] = []

  for (let k = 0; k < soLop; k++) {
    const p = (k + 1) / soLop          // 0 < p ≤ 1, ra tới ngọn
    // Ngưỡng cắt: lớp ngoài cắt sát tâm chấm nên sợi thon dần thành ngọn.
    // Chừa 0,06 ở lớp trong cùng để lớp ấy gần như kín, che da.
    const nguong = 0.06 + p * 0.86
    // Màu: gốc lông sẫm (giả bóng đổ giữa các sợi), ngọn ngả sang màu phụ.
    const mau = mauGoc.clone().multiplyScalar(0.62 + p * 0.3).lerp(mauNgon, p * p * 0.42)
    const m = new THREE.MeshStandardMaterial({
      color: mau,
      alphaMap: van,
      alphaTest: nguong,
      transparent: false,
      roughness: nham,
      metalness: 0,
      side: THREE.FrontSide,
    })
    rac.push(m)

    const me = new THREE.Mesh(hinh, m)
    me.position.copy(cho.vt)
    if (cho.xoay !== undefined) me.rotation.copy(cho.xoay)
    me.scale.copy(cho.co).multiplyScalar(1 + day * p)
    // Chỉ lớp sát da đổ bóng: N lớp cùng đổ bóng là N lần vẽ bản đồ bóng.
    me.castShadow = k === 0
    vao.add(me)
    lop.push(me)
    goc.push(cho.vt.clone())
  }

  const tam = new THREE.Vector3()
  return {
    lop,
    rac,
    ruLong(huong: THREE.Vector3) {
      for (let k = 0; k < lop.length; k++) {
        const p = (k + 1) / lop.length
        const w = Math.pow(p, 1.7)      // lớp trong gần như đứng yên
        tam.copy(huong).multiplyScalar(w)
        lop[k]!.position.copy(goc[k]!).add(tam)
      }
    },
  }
}
