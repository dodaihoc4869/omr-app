/**
 * DỰNG THẦN THÚ BẰNG HÌNH KHỐI THREE.JS — 3D THẬT.
 *
 * Thầy chốt 15-09: "thần thú phải ở dạng 3D ngầu hơn… làm kĩ theo các game nuôi
 * thú hoạt hoạ".
 *
 * ───────────────────────────────────────────────────────────────────────────
 * KHÔNG MỘT TỆP TÀI NGUYÊN NÀO. Không .glb, không .png, không texture tải về —
 * luật kho cấm, và một PWA offline cho 300 em thì mỗi tệp thêm là một lần tải
 * hỏng trên mạng 3G. Toàn bộ con thú dựng bằng geometry gốc của three và màu
 * lấy thẳng từ `ThanThuInfo`. Chữ trên vòng rune vẽ bằng CanvasTexture sinh
 * trong lúc chạy, cũng không phải tệp.
 *
 * GIỮ NGUYÊN LUẬT CỘNG DỒN của `hinh-thai.ts`: cấp N có đủ mọi bộ phận cấp N−1
 * có, cộng ít nhất một bộ phận mới. Bản 2D đã khoá luật ấy bằng phép đếm; bản
 * 3D này đọc CÙNG một bảng `layHinhThai`, nên không thể lệch.
 */

import * as THREE from 'three'
import { layHinhThai, type HinhThai } from './hinh-thai'
import type { ThanThuInfo } from './he-thong-pet'

/** `rgb(239, 68, 68)` hoặc `rgba(...)` → THREE.Color. Kho chỉ dùng hai dạng này. */
export function mauTuChuoi(s: string): THREE.Color {
  const m = s.match(/-?\d+(\.\d+)?/g)
  if (m === null || m.length < 3) return new THREE.Color(0.8, 0.8, 0.8)
  return new THREE.Color(Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255)
}

/** Nhóm thần thú kèm những mốc mà hoạt ảnh cần chạm tới mỗi khung hình. */
export interface BoThanThu3D {
  goc: THREE.Group
  /** Thân — nơi áp squash-and-stretch khi thở và khi tung chiêu. */
  than: THREE.Group
  /** Đuôi vẫy. */
  duoi: THREE.Group | null
  canhTrai: THREE.Group | null
  canhPhai: THREE.Group | null
  /** Vòng quỹ đạo và vòng rune — xoay liên tục. */
  vongXoay: THREE.Object3D[]
  /** Miệng — điểm xuất phát của chiêu thức. */
  mieng: THREE.Vector3
  /** Mọi material đã tạo, để dọn sạch khi rời màn. */
  rac: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
}

function vatLieu(
  mau: THREE.Color,
  opts: { bong?: number; nham?: number; phat?: number; trong?: number } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: mau,
    metalness: opts.bong ?? 0.18,
    roughness: opts.nham ?? 0.42,
    emissive: opts.phat !== undefined && opts.phat > 0 ? mau : new THREE.Color(0, 0, 0),
    emissiveIntensity: opts.phat ?? 0,
    transparent: opts.trong !== undefined,
    opacity: opts.trong ?? 1,
  })
}

/** Vẽ ký hiệu hoá học lên texture — sinh trong lúc chạy, không phải tệp ảnh. */
function texVongRune(kyHieu: readonly string[], mau: THREE.Color): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.font = 'bold 82px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = `rgb(${Math.round(mau.r * 255)}, ${Math.round(mau.g * 255)}, ${Math.round(mau.b * 255)})`
    const buoc = c.width / kyHieu.length
    kyHieu.forEach((k, i) => ctx.fillText(k, buoc * (i + 0.5), c.height / 2))
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const KY_HIEU_HE: Record<string, readonly string[]> = {
  hoa: ['Al', 'Fe₂O₃', 'O₂', 'ΔH', 'C', 'Mg'],
  khi: ['F₂', 'Cl₂', 'Br₂', 'I₂', 'O₃', 'N₂'],
  kiem: ['OH⁻', 'Na', 'Ba', 'Ca', 'K', 'NH₃'],
  axit: ['H⁺', 'HCl', 'HNO₃', 'H₂SO₄', 'SO₄²⁻', 'NO₃⁻'],
  dien: ['e⁻', 'Zn', 'Cu²⁺', 'Anode', 'Fe²⁺', 'Ag'],
  huuco: ['CH₃', 'COO', 'C₆H₅', 'OH', 'NH₂', 'C=C'],
}

/**
 * Dựng cả con thú. Gọi `donBoThanThu` khi rời màn để trả bộ nhớ GPU —
 * three không tự dọn geometry và material, và màn này dựng lại mỗi lần lên cấp.
 */
export function dungThanThu3D(info: ThanThuInfo, cap: number): BoThanThu3D {
  const h: HinhThai = layHinhThai(cap)
  const cChinh = mauTuChuoi(info.mauChinh)
  const cPhu = mauTuChuoi(info.mauPhu)
  const rac: BoThanThu3D['rac'] = []

  const goc = new THREE.Group()
  const than = new THREE.Group()
  goc.add(than)

  const ghi = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => {
    rac.push(x)
    return x
  }

  // ─── CẤP 1: VỎ TRỨNG, và chỉ có vỏ trứng ───
  if (h.vo) {
    const gVo = ghi(new THREE.SphereGeometry(1, 40, 32))
    const mVo = ghi(vatLieu(new THREE.Color(0.98, 0.94, 0.88), { nham: 0.62, bong: 0.05 }))
    const vo = new THREE.Mesh(gVo, mVo)
    vo.scale.set(0.86, 1.12, 0.86)
    vo.castShadow = true
    than.add(vo)

    // Vết nứt: ba thanh mảnh màu hệ, đủ để thấy trứng sắp nở.
    // Vết nứt phải THẤY ĐƯỢC: ảnh chụp bản đầu chỉ ra một gạch mảnh mờ.
    const gNut = ghi(new THREE.BoxGeometry(0.075, 0.5, 0.075))
    const mNut = ghi(vatLieu(cPhu, { phat: 0.7, nham: 0.3 }))
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45
      const nh = new THREE.Mesh(gNut, mNut)
      nh.position.set(Math.sin(a) * 0.82, 0.05 + (i % 2) * 0.26, Math.cos(a) * 0.82)
      nh.rotation.set(0.2, -a, 0.55 - i * 0.26)
      than.add(nh)
    }
    // Hai chấm mắt ló qua vỏ.
    const gMatVo = ghi(new THREE.SphereGeometry(0.1, 16, 14))
    const mMatVo = ghi(vatLieu(new THREE.Color(0.12, 0.14, 0.2), { nham: 0.2 }))
    for (const x of [-0.24, 0.24]) {
      const mv = new THREE.Mesh(gMatVo, mMatVo)
      mv.position.set(x, 0.12, 0.83)
      than.add(mv)
    }
    return {
      goc, than, duoi: null, canhTrai: null, canhPhai: null,
      vongXoay: [], mieng: new THREE.Vector3(0, 0, 0.95), rac,
    }
  }

  // ─── THÂN (cấp 2 trở lên) ───
  const gThan = ghi(new THREE.SphereGeometry(1, 48, 40))
  const mThan = ghi(vatLieu(cChinh, { nham: 0.36, bong: 0.22 }))
  const khoi = new THREE.Mesh(gThan, mThan)
  khoi.scale.set(1, 0.94, 0.96)
  khoi.castShadow = true
  khoi.receiveShadow = true
  than.add(khoi)

  // Bụng sáng màu hơn — khối cầu nhỏ đẩy ra trước, tạo chiều sâu.
  const mBung = ghi(vatLieu(cChinh.clone().lerp(new THREE.Color(1, 1, 1), 0.55), { nham: 0.5 }))
  const bung = new THREE.Mesh(gThan, mBung)
  // Ảnh chụp thử bản đầu: khối này to bằng nửa mặt, trông như cái mõm thò ra.
  bung.scale.set(0.5, 0.4, 0.34)
  bung.position.set(0, -0.46, 0.76)
  than.add(bung)

  // Má hồng
  const gMa = ghi(new THREE.SphereGeometry(0.16, 20, 16))
  const mMa = ghi(vatLieu(new THREE.Color(1, 0.62, 0.62), { nham: 0.7, trong: 0.72 }))
  for (const x of [-0.52, 0.52]) {
    const ma = new THREE.Mesh(gMa, mMa)
    ma.position.set(x, -0.22, 0.74)
    ma.scale.set(1, 0.72, 0.5)
    than.add(ma)
  }

  // ─── MẮT — ba lớp, có tròng sáng nên nhìn có hồn ───
  const gTrang = ghi(new THREE.SphereGeometry(0.3, 28, 24))
  const mTrang = ghi(vatLieu(new THREE.Color(1, 1, 1), { nham: 0.22 }))
  const gDen = ghi(new THREE.SphereGeometry(0.175, 24, 20))
  // Tròng LUÔN đen, kể cả cấp tối thượng. Ảnh chụp bản trước cho tròng vàng
  // phát sáng đặc: mắt thành hai quả bóng, thú mất hẳn cái nhìn.
  const mDen = ghi(vatLieu(new THREE.Color(0.11, 0.13, 0.2), { nham: 0.14 }))
  // Cấp 12 thêm một vành sáng quanh tròng — rực mà vẫn còn mắt.
  const gVanhMat = ghi(new THREE.TorusGeometry(0.2, 0.032, 10, 24))
  const mVanhMat = ghi(vatLieu(cPhu, { phat: 1.4, nham: 0.1 }))
  const gSang = ghi(new THREE.SphereGeometry(0.05, 14, 12))
  const mSang = ghi(vatLieu(new THREE.Color(1, 1, 1), { phat: 0.8 }))
  for (const x of [-0.36, 0.36]) {
    const t = new THREE.Mesh(gTrang, mTrang)
    t.position.set(x, 0.1, 0.78)
    t.scale.set(1, 1.08, 0.66)
    than.add(t)
    const d = new THREE.Mesh(gDen, mDen)
    d.position.set(x, 0.09, 0.95)
    than.add(d)
    const s = new THREE.Mesh(gSang, mSang)
    s.position.set(x + 0.07, 0.19, 1.04)
    than.add(s)
    if (h.toiThuong) {
      const v = new THREE.Mesh(gVanhMat, mVanhMat)
      v.position.set(x, 0.09, 0.97)
      than.add(v)
    }
  }

  // ─── CẤP 3: SỪNG ───
  if (h.sung) {
    const gSung = ghi(new THREE.ConeGeometry(0.13, h.toiThuong ? 0.62 : 0.44, 16))
    const mSung = ghi(vatLieu(h.toiThuong ? new THREE.Color(1, 0.84, 0.3) : cPhu, {
      bong: h.toiThuong ? 0.75 : 0.3, nham: 0.3, phat: h.toiThuong ? 0.35 : 0,
    }))
    for (const [x, ng] of [[-0.42, -0.34], [0.42, 0.34]] as const) {
      const s = new THREE.Mesh(gSung, mSung)
      s.position.set(x, 0.82, 0.16)
      s.rotation.z = -ng
      s.castShadow = true
      than.add(s)
    }
  }

  // ─── CẤP 4: ĐUÔI ───
  let duoi: THREE.Group | null = null
  if (h.duoi) {
    duoi = new THREE.Group()
    const duong = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.42, 0.1, -0.34),
      new THREE.Vector3(-0.86, 0.34, -0.5),
      new THREE.Vector3(-1.12, 0.74, -0.44),
    ])
    const gD = ghi(new THREE.TubeGeometry(duong, 28, 0.115, 12, false))
    const mD = ghi(vatLieu(cChinh, { nham: 0.38 }))
    const t = new THREE.Mesh(gD, mD)
    t.castShadow = true
    duoi.add(t)

    const gChom = ghi(new THREE.SphereGeometry(0.2, 22, 18))
    const mChom = ghi(vatLieu(cPhu, { phat: h.haoQuang ? 0.5 : 0.15, nham: 0.34 }))
    const chom = new THREE.Mesh(gChom, mChom)
    chom.position.set(-1.12, 0.74, -0.44)
    duoi.add(chom)

    duoi.position.set(-0.55, -0.2, -0.5)
    goc.add(duoi)
  }

  // ─── CẤP 5 / 8: CÁNH ───
  let canhTrai: THREE.Group | null = null
  let canhPhai: THREE.Group | null = null
  if (h.canhNho || h.canhLon) {
    const lon = h.canhLon
    const hinh = new THREE.Shape()
    hinh.moveTo(0, 0)
    hinh.bezierCurveTo(0.2, 0.55, 0.78, 0.86, 1.06, 0.62)
    if (lon) {
      // Mép khía răng cưa của Song Dực.
      hinh.lineTo(0.9, 0.44)
      hinh.lineTo(1.0, 0.3)
      hinh.lineTo(0.82, 0.16)
      hinh.lineTo(0.92, 0.0)
      hinh.lineTo(0.66, -0.12)
    } else {
      hinh.bezierCurveTo(0.86, 0.34, 0.6, 0.06, 0.4, -0.06)
    }
    hinh.bezierCurveTo(0.24, -0.1, 0.08, -0.08, 0, 0)
    const gCanh = ghi(new THREE.ExtrudeGeometry(hinh, {
      depth: 0.045, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2,
    }))
    const mCanh = ghi(vatLieu(cPhu, {
      nham: 0.26, bong: lon ? 0.4 : 0.15,
      trong: lon ? 0.95 : 0.86, phat: h.toiThuong ? 0.42 : 0,
    }))
    const co = lon ? 1.3 : 0.72
    for (const ben of [-1, 1] as const) {
      const g = new THREE.Group()
      const m = new THREE.Mesh(gCanh, mCanh)
      m.scale.set(co * ben, co, lon ? 2.4 : 1)
      m.castShadow = true
      g.add(m)
      g.position.set(ben * 0.6, lon ? 0.52 : 0.3, -0.52)
      g.rotation.y = ben * 0.5
      g.rotation.z = lon ? ben * 0.18 : 0

      // SONG DỰC nghĩa là HAI CẶP cánh, không phải một cặp to hơn.
      // Phép kiểm bắt được: bản đầu cấp 8 chỉ phóng to cánh cấp 5 nên số khối
      // đứng im ở 29, tức cấp 8 không ngầu hơn cấp 7 chút nào.
      if (lon) {
        const phu = new THREE.Mesh(gCanh, mCanh)
        phu.scale.set(co * 0.62 * ben, co * 0.58, 1.6)
        phu.position.set(0, -0.62, 0.1)
        phu.rotation.z = -ben * 0.34
        g.add(phu)
      }

      goc.add(g)
      if (ben < 0) canhTrai = g
      else canhPhai = g
    }
  }

  // ─── CẤP 6: HÀO QUANG — vỏ cầu trong suốt phát sáng ───
  if (h.haoQuang) {
    const gHq = ghi(new THREE.SphereGeometry(1.42, 32, 24))
    const mHq = ghi(new THREE.MeshBasicMaterial({
      color: cPhu, transparent: true, opacity: 0.07 + h.damHaoQuang * 0.07,
      side: THREE.BackSide, depthWrite: false,
    }))
    goc.add(new THREE.Mesh(gHq, mHq))
  }

  // ─── CẤP 7: VẢY trên lưng ───
  if (h.vay) {
    const gVay = ghi(new THREE.ConeGeometry(0.09, 0.2, 10))
    const mVay = ghi(vatLieu(cPhu, { bong: 0.45, nham: 0.3 }))
    for (let hang = 0; hang < 3; hang++) {
      for (let i = 0; i < 4; i++) {
        const v = new THREE.Mesh(gVay, mVay)
        const a = -0.5 + i * 0.32
        v.position.set((hang - 1) * 0.3, Math.cos(a) * 0.92, -Math.sin(a) * 0.92 - 0.1)
        v.rotation.x = a - Math.PI / 2
        than.add(v)
      }
    }
  }

  // ─── CẤP 9: QUỸ ĐẠO hạt ───
  const vongXoay: THREE.Object3D[] = []
  if (h.quyDao) {
    const gHat = ghi(new THREE.SphereGeometry(0.075, 12, 10))
    const mHat = ghi(vatLieu(cPhu, { phat: 1.1, nham: 0.2 }))
    for (let v = 0; v < 2; v++) {
      const vong = new THREE.Group()
      const soHat = h.soHat > 0 ? Math.min(10, h.soHat) : 4
      for (let i = 0; i < soHat; i++) {
        const hat = new THREE.Mesh(gHat, mHat)
        const a = (i / soHat) * Math.PI * 2
        hat.position.set(Math.cos(a) * 1.65, 0, Math.sin(a) * 1.65)
        vong.add(hat)
      }
      // Nghiêng gần nằm ngang: ảnh chụp bản đầu cho vòng cắt thẳng qua mặt thú.
      vong.rotation.set(v === 0 ? 1.18 : -1.05, 0, v === 0 ? 0.34 : -0.46)
      goc.add(vong)
      vongXoay.push(vong)
    }
  }

  // ─── CẤP 10: VƯƠNG MIỆN ───
  if (h.vuongMien) {
    const mien = new THREE.Group()
    const gVanh = ghi(new THREE.TorusGeometry(0.44, 0.052, 12, 30))
    const mVang = ghi(vatLieu(new THREE.Color(1, 0.82, 0.25), { bong: 0.9, nham: 0.18, phat: 0.25 }))
    const vanh = new THREE.Mesh(gVanh, mVang)
    vanh.rotation.x = Math.PI / 2
    mien.add(vanh)
    const gChop = ghi(new THREE.ConeGeometry(0.085, 0.26, 10))
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(gChop, mVang)
      const a = (i / 5) * Math.PI * 2
      c.position.set(Math.cos(a) * 0.44, 0.15, Math.sin(a) * 0.44)
      mien.add(c)
    }
    mien.position.set(0, 1.0, 0)
    than.add(mien)
  }

  // ─── CẤP 11: VÒNG RUNE ký hiệu hoá học ───
  if (h.vongRune) {
    const tex = ghi(texVongRune(KY_HIEU_HE[info.he] ?? KY_HIEU_HE['hoa']!, cPhu))
    const soVong = h.toiThuong ? 3 : 1
    for (let i = 0; i < soVong; i++) {
      const gR = ghi(new THREE.CylinderGeometry(1.5 + i * 0.16, 1.5 + i * 0.16, 0.24, 48, 1, true))
      const mR = ghi(new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false,
      }))
      const r = new THREE.Mesh(gR, mR)
      // Ảnh chụp bản đầu: dải chữ nằm đúng ngang tầm mắt, che kín mặt thú.
      // Hạ xuống quanh chân và nghiêng nhẹ — vẫn thấy chữ, không che mặt.
      r.position.y = -1.12 - i * 0.17
      r.rotation.z = (i - 1) * 0.12
      r.scale.setScalar(1 - i * 0.06)
      goc.add(r)
      vongXoay.push(r)
    }
  }

  // ─── CẤP 12: VIỀN LỬA TỐI THƯỢNG ───
  if (h.toiThuong) {
    const gLua = ghi(new THREE.TorusGeometry(1.3, 0.085, 14, 44))
    const mLua = ghi(new THREE.MeshBasicMaterial({
      color: cPhu, transparent: true, opacity: 0.6, depthWrite: false,
    }))
    const lua = new THREE.Mesh(gLua, mLua)
    lua.rotation.x = Math.PI / 2.06
    lua.position.y = -1.3
    goc.add(lua)
    vongXoay.push(lua)
  }

  return { goc, than, duoi, canhTrai, canhPhai, vongXoay, mieng: new THREE.Vector3(0, -0.05, 1.05), rac }
}

/** Trả bộ nhớ GPU. Three không tự dọn — quên là rò từng lần lên cấp. */
export function donBoThanThu3D(bo: BoThanThu3D): void {
  for (const r of bo.rac) r.dispose()
  bo.rac.length = 0
  bo.goc.clear()
}
