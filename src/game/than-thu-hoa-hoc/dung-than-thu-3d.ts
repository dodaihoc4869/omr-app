/**
 * DỰNG THẦN THÚ BẰNG HÌNH KHỐI THREE.JS — 3D THẬT, LÔNG THẬT.
 *
 * Thầy chốt 15-09: "sửa lại con thú cho dễ thương, đẹp mịn đáng yêu và tri thức
 * hoá học… con thú phải mềm mại đáng yêu, có lông mịn màng."
 *
 * ───────────────────────────────────────────────────────────────────────────
 * BA ĐIỀU LÀM NÊN "ĐÁNG YÊU", và đây là lý do bản trước nhìn xấu:
 *
 * 1. **TỈ LỆ CHIBI.** Bản trước là MỘT khối cầu vừa làm đầu vừa làm thân, mắt
 *    dán lên giữa quả cầu — nhìn ra quả bóng có mặt, không ra con thú. Bản này
 *    tách hẳn: đầu to (bán kính 1,0) đội lên thân nhỏ (0,74 × 0,66), thêm chân
 *    mập và tay ngắn. Tỉ lệ đầu/thân ≈ 1,4 — đúng cái tỉ lệ mà mắt người đọc
 *    thành "con non", tức là đáng yêu.
 * 2. **LÔNG, không phải nhựa.** `long-thu-3d.ts` bọc mười mấy lớp vỏ quanh đầu,
 *    thân, tai, chỏm đuôi. Bản trước dùng `metalness 0.22 / roughness 0.36` nên
 *    khối nào cũng bóng như đồ nhựa.
 * 3. **MẮT CÓ HỒN.** Tròng to hơn hẳn, hai đốm sáng lệch nhau (một to một nhỏ),
 *    thêm vành mống mắt màu hệ. Mắt to + tròng to = tín hiệu "con non" thứ hai.
 *
 * TRI THỨC HOÁ HỌC gắn thẳng vào con thú, không đợi tới cấp 11: huy hiệu trước
 * ngực in đúng công thức gốc của thú (`nguyenToGoc`) — Al + Fe₂O₃, Zn | Cu²⁺,
 * (RCOO)₃C₃H₅… Em nhìn thú là thấy công thức, không phải đọc chú thích.
 *
 * KHÔNG MỘT TỆP TÀI NGUYÊN NÀO. Không .glb, không .png — luật kho cấm, và một
 * PWA offline cho 300 em thì mỗi tệp thêm là một lần tải hỏng trên mạng 3G.
 *
 * GIỮ NGUYÊN LUẬT CỘNG DỒN của `hinh-thai.ts`: cấp N có đủ mọi bộ phận cấp N−1
 * có, cộng ít nhất một bộ phận mới. Phép kiểm đếm khối bắt được nếu ai làm lệch.
 */

import * as THREE from 'three'
import { layHinhThai, type HinhThai } from './hinh-thai'
import { dangCua } from './dang-than-thu'
import type { ThanThuInfo } from './he-thong-pet'
import { bocLong, texSoiLong, soLopTheoMay, type BoLong } from './long-thu-3d'

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
  /** Đầu — gật gù, nghiêng theo hướng xoay. */
  dau: THREE.Group
  /** Hai mắt, bóp dẹt theo trục Y là thành cái chớp mắt. */
  mat: THREE.Group[]
  /** Mọi bộ lông — gọi `ruLong` mỗi khung hình cho lông mềm theo. */
  long: BoLong[]
  /** Đuôi vẫy. */
  duoi: THREE.Group | null
  canhTrai: THREE.Group | null
  canhPhai: THREE.Group | null
  /** Vòng quỹ đạo (cấp 9) và vòng rune (cấp 11) — xoay liên tục. */
  vongXoay: THREE.Object3D[]
  /** Vòng phép dưới chân (cấp 6) — quay chậm, sổ riêng để `vongXoay` giữ
   *  đúng nghĩa "quỹ đạo mọc từ cấp 9" mà phép kiểm đang đo. */
  vongPhep: THREE.Object3D[]
  /** Miệng — điểm xuất phát của chiêu thức. */
  mieng: THREE.Vector3
  /**
   * Cao độ BÀN CHÂN. Màn cha đặt mặt sàn đúng đây.
   * Không được đo bằng hộp bao cả con: vòng lửa cấp 12 và vòng rune thấp hơn
   * bàn chân, lấy đáy hộp bao thì thú lơ lửng trên không — ảnh chụp cấp 12 bản
   * đầu đúng như vậy.
   */
  chanY: number
  /** Mọi material đã tạo, để dọn sạch khi rời màn. */
  rac: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
}

/**
 * Da thú: nhám cao, kim loại gần bằng không. Đây là điểm sửa so với bản trước —
 * `metalness` cao làm con thú bóng như đồ chơi nhựa, không ra lông.
 */
function vatLieu(
  mau: THREE.Color,
  opts: { bong?: number; nham?: number; phat?: number; trong?: number } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: mau,
    metalness: opts.bong ?? 0.02,
    roughness: opts.nham ?? 0.86,
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

/**
 * HUY HIỆU TRƯỚC NGỰC — in công thức gốc của thần thú.
 *
 * Cỡ chữ tự co cho vừa vành tròn: `Ba(OH)₂ + Na₂SO₄` dài gấp đôi `F₂, Cl₂`, để
 * cứng một cỡ chữ là công thức dài tràn ra ngoài vành.
 */
function texHuyHieu(congThuc: string, mau: THREE.Color): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 512
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    ctx.clearRect(0, 0, 512, 512)
    const nen = ctx.createRadialGradient(256, 256, 40, 256, 256, 250)
    nen.addColorStop(0, 'rgba(14, 18, 30, 0.94)')
    nen.addColorStop(0.78, 'rgba(14, 18, 30, 0.88)')
    nen.addColorStop(1, 'rgba(14, 18, 30, 0)')
    ctx.fillStyle = nen
    ctx.beginPath()
    ctx.arc(256, 256, 250, 0, Math.PI * 2)
    ctx.fill()

    const rgb = `rgb(${Math.round(mau.r * 255)}, ${Math.round(mau.g * 255)}, ${Math.round(mau.b * 255)})`
    ctx.strokeStyle = rgb
    ctx.lineWidth = 14
    ctx.beginPath()
    ctx.arc(256, 256, 218, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = 'rgb(248, 250, 255)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let co = 104
    ctx.font = `bold ${co}px ui-monospace, monospace`
    while (co > 34 && ctx.measureText(congThuc).width > 372) {
      co -= 4
      ctx.font = `bold ${co}px ui-monospace, monospace`
    }
    ctx.fillText(congThuc, 256, 256)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * TẤM VÂN VỎ TRỨNG — đốm hoa văn và vết nứt vẽ THẲNG LÊN VỎ.
 *
 * Bản trước đắp vết nứt bằng mấy thanh hộp dựng đứng quanh vỏ; ảnh chụp cho ra
 * mấy que vàng lơ lửng cạnh mắt, không ai đọc ra vết nứt. Vẽ lên vân thì nứt
 * bám đúng mặt cong của vỏ và uốn theo hình quả trứng.
 */
function texVoTrung(mau: THREE.Color): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    ctx.fillStyle = 'rgb(246, 238, 226)'
    ctx.fillRect(0, 0, 1024, 512)
    const rgb = `rgb(${Math.round(mau.r * 255)}, ${Math.round(mau.g * 255)}, ${Math.round(mau.b * 255)})`

    // Đốm lốm đốm như vỏ trứng thật.
    ctx.globalAlpha = 0.2
    ctx.fillStyle = rgb
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 1024
      const y = 60 + Math.random() * 392
      const r = 6 + Math.random() * 17
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.5), Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Hai vết nứt zíc-zắc: viền tối bên dưới, lõi sáng màu hệ bên trên.
    ctx.globalAlpha = 1
    for (const [x0, doDai] of [[300, 1], [690, 0.72]] as const) {
      const diem: [number, number][] = []
      let x = x0
      for (let i = 0; i <= 9; i++) {
        diem.push([x, 96 + i * 32 * doDai])
        x += (i % 2 === 0 ? 1 : -1) * (16 + Math.random() * 22)
      }
      for (const [rong, mauNet, alpha] of
        [[13, 'rgb(96, 74, 58)', 0.5], [6, rgb, 0.95]] as const) {
        ctx.globalAlpha = alpha
        ctx.strokeStyle = mauNet
        ctx.lineWidth = rong
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(diem[0]![0], diem[0]![1])
        for (const d of diem.slice(1)) ctx.lineTo(d[0], d[1])
        ctx.stroke()
      }
      // Nhánh nứt con cho vết trông tự nhiên.
      ctx.globalAlpha = 0.8
      ctx.lineWidth = 4
      ctx.strokeStyle = rgb
      for (const k of [2, 5, 7]) {
        const d = diem[k]
        if (d === undefined) continue
        ctx.beginPath()
        ctx.moveTo(d[0], d[1])
        ctx.lineTo(d[0] + (k % 2 === 0 ? 46 : -46), d[1] + 26)
        ctx.stroke()
      }
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Vòng phép khắc dưới chân — thay cho quả cầu hào quang trông như bong bóng. */
function texVongPhep(mau: THREE.Color): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    ctx.clearRect(0, 0, 256, 256)
    const rgb = `rgb(${Math.round(mau.r * 255)}, ${Math.round(mau.g * 255)}, ${Math.round(mau.b * 255)})`
    ctx.strokeStyle = rgb
    ctx.lineWidth = 9
    ctx.globalAlpha = 0.95
    ctx.beginPath()
    ctx.arc(128, 128, 112, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 3.5
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    ctx.arc(128, 128, 88, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 6
    ctx.globalAlpha = 0.8
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(128 + Math.cos(a) * 94, 128 + Math.sin(a) * 94)
      ctx.lineTo(128 + Math.cos(a) * 107, 128 + Math.sin(a) * 107)
      ctx.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
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
 * Dựng cả con thú. Gọi `donBoThanThu3D` khi rời màn để trả bộ nhớ GPU —
 * three không tự dọn geometry và material, và màn này dựng lại mỗi lần lên cấp.
 *
 * `soLop` cho phép phép kiểm ép một con số cố định; để trống thì tự đo máy.
 */
export function dungThanThu3D(info: ThanThuInfo, cap: number, soLop?: number): BoThanThu3D {
  const h: HinhThai = layHinhThai(cap)
  const cChinh = mauTuChuoi(info.mauChinh)
  const cPhu = mauTuChuoi(info.mauPhu)
  const rac: BoThanThu3D['rac'] = []
  const long: BoLong[] = []
  // DÁNG RIÊNG của từng con — thầy chốt 15-09 "mỗi con 1 hình dạng khác nhau".
  const d = dangCua(info.id)
  const nLop = Math.max(2, (soLop ?? soLopTheoMay()) + d.themLop)
  const nLopNho = Math.max(2, Math.round(nLop * 0.6))

  const goc = new THREE.Group()
  const than = new THREE.Group()
  goc.add(than)

  const ghi = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => {
    rac.push(x)
    return x
  }
  const nhan = (b: BoLong) => {
    long.push(b)
    for (const r of b.rac) rac.push(r)
  }

  // ─── CẤP 1: VỎ TRỨNG, và chỉ có vỏ trứng ───
  if (h.vo) {
    const gVo = ghi(new THREE.SphereGeometry(1, 52, 40))
    const texVo = ghi(texVoTrung(cPhu))
    const mVo = ghi(new THREE.MeshStandardMaterial({
      map: texVo, roughness: 0.66, metalness: 0.02,
    }))
    const vo = new THREE.Mesh(gVo, mVo)
    vo.scale.set(0.84, 1.1, 0.84)
    vo.castShadow = true
    vo.receiveShadow = true
    than.add(vo)

    // Hai mắt ngái ngủ ló qua vỏ — trứng cũng phải đáng yêu.
    const gMatVo = ghi(new THREE.SphereGeometry(0.155, 22, 18))
    const mMatVo = ghi(vatLieu(new THREE.Color(0.09, 0.11, 0.17), { nham: 0.16 }))
    const gLoeVo = ghi(new THREE.SphereGeometry(0.05, 14, 12))
    const gLoeNho = ghi(new THREE.SphereGeometry(0.026, 10, 8))
    const mLoeVo = ghi(vatLieu(new THREE.Color(1, 1, 1), { phat: 0.95 }))
    const matVo: THREE.Group[] = []
    for (const ben of [-1, 1] as const) {
      const g = new THREE.Group()
      const mv = new THREE.Mesh(gMatVo, mMatVo)
      mv.scale.set(1, 0.92, 0.66)
      g.add(mv)
      const lo = new THREE.Mesh(gLoeVo, mLoeVo)
      lo.position.set(ben * 0.045, 0.062, 0.12)
      g.add(lo)
      const lo2 = new THREE.Mesh(gLoeNho, mLoeVo)
      lo2.position.set(-ben * 0.05, -0.05, 0.12)
      g.add(lo2)
      g.position.set(ben * 0.26, 0.1, 0.81)
      than.add(g)
      matVo.push(g)
    }
    // Má hồng cho quả trứng — cùng một tín hiệu đáng yêu với thú đã nở.
    const gMaVo = ghi(new THREE.SphereGeometry(0.15, 18, 14))
    const mMaVo = ghi(vatLieu(new THREE.Color(1, 0.6, 0.62), { nham: 0.85, trong: 0.55 }))
    for (const x of [-0.5, 0.5]) {
      const ma = new THREE.Mesh(gMaVo, mMaVo)
      ma.position.set(x, -0.08, 0.68)
      ma.scale.set(1, 0.66, 0.36)
      than.add(ma)
    }
    return {
      goc, than, dau: than, mat: matVo, long, duoi: null, canhTrai: null, canhPhai: null,
      vongXoay: [], vongPhep: [], mieng: new THREE.Vector3(0, 0, 0.95), chanY: -1.1, rac,
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TỪ CẤP 2: THÚ CHIBI — đầu to, thân nhỏ, tay chân mập
  // ═══════════════════════════════════════════════════════════════════════
  // Bàn chân chạm đây. Mọi thứ thấp hơn (vòng rune, vòng lửa) phải nâng lên
  // trên mức này, nếu không sẽ chui xuống dưới sàn.
  const CHAN_Y = -1.46
  const texLong = ghi(texSoiLong())
  const gCau = ghi(new THREE.SphereGeometry(1, 40, 30))
  const cSang = cChinh.clone().lerp(new THREE.Color(1, 1, 1), 0.34)

  // ═══════════════════════════════════════════════════════════════════════
  // THÂN — SÁU KHUNG XƯƠNG KHÁC HẲN NHAU.
  //
  // Thầy chốt 15-09: *"Mỗi thần thú phải khác nhau hoàn toàn về hình dáng. Có
  // con dáng long ly quy phượng. Không con nào được giống con nào."*
  //
  // Bản trước sáu con chung một khung chibi, chỉ khác màu và tai — che màu đi
  // là ra sáu con gấu bông cùng khuôn. Nay khác ở CẤU TRÚC: số chân, thân nằm
  // ngang hay đứng, có mai hay không, có cổ hay không.
  //
  // `mThan` PHẢI là vật liệu đầu tiên thêm vào cây: phép kiểm lấy material đầu
  // tiên gặp khi duyệt để xác nhận mỗi hệ một màu.
  // ═══════════════════════════════════════════════════════════════════════
  const mThan = ghi(vatLieu(cChinh, { nham: 0.9 }))
  const mThanPhu = ghi(vatLieu(cChinh.clone().multiplyScalar(0.9), { nham: 0.9 }))
  const VT_THAN = new THREE.Vector3(0, d.yThan, -0.04)
  const CO_THAN = new THREE.Vector3(d.coThan[0], d.coThan[1], d.coThan[2])

  /** Thêm một khối cầu bọc lông vào `than`. Dùng lại cho mọi khung. */
  const dotThan = (vt: THREE.Vector3, co: THREE.Vector3, vl = mThan, day = d.dayLong) => {
    const m = new THREE.Mesh(gCau, vl)
    m.position.copy(vt)
    m.scale.copy(co)
    m.castShadow = true
    m.receiveShadow = true
    than.add(m)
    nhan(bocLong(than, gCau, { vt, co }, cChinh, cPhu,
      { soLop: nLop, tex: texLong, dayLong: day, lapVan: 6 }))
  }

  /** Vị trí đặt đầu, mỗi khung một chỗ. */
  let vtDau = new THREE.Vector3(0, 0.5, 0)

  if (d.khung === 'long') {
    // LONG — thân rắn năm đốt uốn khúc dựng đứng, cổ vươn ra trước.
    for (let i = 0; i < 5; i++) {
      const u = i / 4
      const r = 0.62 - u * 0.2
      dotThan(
        new THREE.Vector3(Math.sin(u * 3.1) * 0.26, d.yThan - u * 0.42, -0.08 - u * 0.3),
        new THREE.Vector3(r, r * 0.92, r),
      )
    }
    // Cổ: ba đốt nhỏ nối lên đầu.
    for (let i = 0; i < 3; i++) {
      const u = i / 2
      const r = 0.38 - u * 0.06
      dotThan(new THREE.Vector3(0, d.yThan + 0.34 + u * 0.4, 0.06 + u * 0.12),
        new THREE.Vector3(r, r, r), mThanPhu, d.dayLong * 0.8)
    }
    vtDau = new THREE.Vector3(0, 0.78, 0.2)
  } else if (d.khung === 'quy') {
    // QUY — mai vòm to trên lưng, thân thấp bè, cổ ngắn chìa ra trước.
    dotThan(VT_THAN, CO_THAN)
    const mMai = ghi(vatLieu(cPhu.clone().multiplyScalar(0.85), { bong: 0.35, nham: 0.55 }))
    const gMai = ghi(new THREE.SphereGeometry(1, 30, 20, 0, Math.PI * 2, 0, Math.PI / 2))
    const mai = new THREE.Mesh(gMai, mMai)
    mai.position.set(0, d.yThan - 0.02, -0.16)
    mai.scale.set(1.16, 0.78, 1.12)
    mai.castShadow = true
    than.add(mai)
    // Vảy mai: sáu miếng lục giác nổi trên vòm.
    const gO = ghi(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 6))
    const mO = ghi(vatLieu(cPhu, { bong: 0.4, nham: 0.4 }))
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const o = new THREE.Mesh(gO, mO)
      o.position.set(Math.cos(a) * 0.66, d.yThan + 0.36, Math.sin(a) * 0.62 - 0.16)
      o.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5)
      than.add(o)
    }
    dotThan(new THREE.Vector3(0, d.yThan + 0.32, 0.5), new THREE.Vector3(0.3, 0.28, 0.34), mThanPhu)
    vtDau = new THREE.Vector3(0, 0.12, 0.78)
  } else if (d.khung === 'ly') {
    // LY — kỳ lân bốn chân, thân NẰM NGANG, cổ vươn chéo lên.
    dotThan(new THREE.Vector3(0, d.yThan, -0.28), new THREE.Vector3(0.66, 0.6, 0.98))
    for (let i = 0; i < 3; i++) {
      const u = i / 2
      const r = 0.42 - u * 0.07
      dotThan(new THREE.Vector3(0, d.yThan + 0.3 + u * 0.36, 0.26 + u * 0.2),
        new THREE.Vector3(r, r, r), mThanPhu, d.dayLong * 0.85)
    }
    vtDau = new THREE.Vector3(0, 0.66, 0.74)
  } else if (d.khung === 'phuong' || d.khung === 'daiBang') {
    // PHƯỢNG — thân trứng ĐỨNG, ngực ưỡn, cổ mảnh, không có tay.
    dotThan(new THREE.Vector3(0, d.yThan + 0.02, 0.04), new THREE.Vector3(0.6, 0.86, 0.6))
    for (let i = 0; i < 3; i++) {
      const u = i / 2
      const r = 0.3 - u * 0.05
      dotThan(new THREE.Vector3(0, d.yThan + 0.78 + u * 0.3, 0.02 + u * 0.06),
        new THREE.Vector3(r, r, r), mThanPhu, d.dayLong * 0.7)
    }
    vtDau = new THREE.Vector3(0, 0.82, 0.06)
  } else if (d.khung === 'ho') {
    // HỔ — bốn chân, thân NẰM NGANG, VAI U gồ cao hơn hông, ngực nở.
    dotThan(new THREE.Vector3(0, d.yThan, -0.26), new THREE.Vector3(0.7, 0.62, 1.0))
    // U vai: cái bướu cơ trên vai là thứ làm dáng hổ ra hổ.
    dotThan(new THREE.Vector3(0, d.yThan + 0.36, 0.24), new THREE.Vector3(0.62, 0.42, 0.56), mThanPhu)
    dotThan(new THREE.Vector3(0, d.yThan + 0.12, 0.62), new THREE.Vector3(0.5, 0.46, 0.44), mThanPhu)
    vtDau = new THREE.Vector3(0, 0.62, 0.86)
  } else {
    // ĐẠI BÀNG — thân chim nghiêng tới trước, ngực nở, cổ ngắn khoẻ.
    dotThan(new THREE.Vector3(0, d.yThan, 0.0), new THREE.Vector3(0.62, 0.9, 0.7))
    dotThan(new THREE.Vector3(0, d.yThan + 0.62, 0.2), new THREE.Vector3(0.44, 0.4, 0.44), mThanPhu)
    vtDau = new THREE.Vector3(0, 0.74, 0.34)
  }

  // ─── ĐẦU ───
  const dau = new THREE.Group()
  dau.position.copy(vtDau)
  than.add(dau)
  const mDau = ghi(vatLieu(cChinh, { nham: 0.9 }))
  const CO_DAU = new THREE.Vector3(d.coDau[0], d.coDau[1], d.coDau[2])
  const khoiDau = new THREE.Mesh(gCau, mDau)
  khoiDau.scale.copy(CO_DAU)
  khoiDau.castShadow = true
  khoiDau.receiveShadow = true
  dau.add(khoiDau)
  nhan(bocLong(dau, gCau, { vt: new THREE.Vector3(0, 0, 0), co: CO_DAU }, cChinh, cPhu,
    { soLop: nLop, tex: texLong, dayLong: d.dayLong * 0.92, lapVan: 8 }))

  /**
   * KHUNG MẶT — co đúng theo cỡ đầu.
   *
   * Sáu khung xương có sáu cỡ đầu khác hẳn nhau (rồng đầu dài hẹp, phượng đầu
   * bé tròn, gấu đầu to). Mắt, mõm, tai trước nay đặt theo toạ độ TUYỆT ĐỐI
   * trên một quả cầu bán kính 1 — đầu nhỏ đi là mắt và mõm lơ lửng ngoài đầu.
   * Nhét hết vào một khung co theo `CO_DAU` thì mặt luôn bám đúng da.
   */
  const matKhung = new THREE.Group()
  matKhung.scale.copy(CO_DAU)
  dau.add(matKhung)

  // ─── TAI — SÁU KIỂU, mỗi con một kiểu. Bóng đổ của đầu là thứ mắt nhận ra
  // đầu tiên, nên tai chính là chỗ tách sáu con ra khỏi nhau rõ nhất. ───
  const mTrongTai = ghi(vatLieu(new THREE.Color(1, 0.68, 0.72), { nham: 0.8 }))
  const SO_TAI: Record<string, { co: [number, number, number]; x: number; y: number; ngA: number }> = {
    tron: { co: [0.3, 0.42, 0.22], x: 0.6, y: 0.76, ngA: 0.3 },
    nhon: { co: [0.22, 0.56, 0.16], x: 0.56, y: 0.84, ngA: 0.46 },
    vay: { co: [0.42, 0.3, 0.08], x: 0.68, y: 0.6, ngA: 0.95 },
    dai: { co: [0.2, 0.78, 0.17], x: 0.44, y: 0.98, ngA: 0.2 },
    chop: { co: [0.24, 0.5, 0.18], x: 0.58, y: 0.82, ngA: 0.6 },
    la: { co: [0.44, 0.36, 0.1], x: 0.64, y: 0.72, ngA: 0.72 },
  }
  const kt = SO_TAI[d.kieuTai] ?? SO_TAI['tron']!
  for (const ben of [-1, 1] as const) {
    const vtTai = new THREE.Vector3(ben * kt.x, kt.y, -0.04)
    const coTai = new THREE.Vector3(kt.co[0], kt.co[1], kt.co[2])
    const xoayTai = new THREE.Euler(0, 0, ben * kt.ngA)
    const mTai = ghi(vatLieu(cChinh, { nham: 0.9 }))
    const tai = new THREE.Mesh(gCau, mTai)
    tai.position.copy(vtTai)
    tai.scale.copy(coTai)
    tai.rotation.copy(xoayTai)
    matKhung.add(tai)
    nhan(bocLong(matKhung, gCau, { vt: vtTai, co: coTai, xoay: xoayTai }, cChinh, cPhu,
      { soLop: nLopNho, tex: texLong, dayLong: 0.22, lapVan: 4 }))
    const trong = new THREE.Mesh(gCau, mTrongTai)
    trong.position.set(ben * (kt.x - 0.02), kt.y, 0.2)
    trong.scale.set(kt.co[0] * 0.53, kt.co[1] * 0.6, 0.09)
    trong.rotation.z = ben * kt.ngA
    matKhung.add(trong)
  }

  // ─── MẮT: tròng to, vành mống màu hệ, HAI đốm sáng lệch nhau ───
  const gTrang = ghi(new THREE.SphereGeometry(0.31, 30, 24))
  // Thêm chút tự phát sáng: cảnh nào cũng có màu (lò đỏ, hang xanh), tròng
  // trắng không tự sáng thì bị ám màu cảnh, nhìn ra con mắt bẩn.
  const mTrang = ghi(vatLieu(new THREE.Color(1, 1, 1), { nham: 0.34, phat: 0.1 }))
  const gTrong = ghi(new THREE.SphereGeometry(0.205, 26, 22))
  // Tròng LUÔN đen, kể cả cấp tối thượng. Ảnh chụp bản trước cho tròng vàng
  // phát sáng đặc: mắt thành hai quả bóng, thú mất hẳn cái nhìn.
  const mTrong = ghi(vatLieu(new THREE.Color(0.08, 0.1, 0.16), { nham: 0.12 }))
  const gMong = ghi(new THREE.TorusGeometry(0.155, 0.042, 12, 26))
  const mMong = ghi(vatLieu(cPhu, { phat: h.toiThuong ? 1.5 : 0.6, nham: 0.2 }))
  const gLoeTo = ghi(new THREE.SphereGeometry(0.072, 16, 14))
  const gLoeNho = ghi(new THREE.SphereGeometry(0.036, 12, 10))
  const mLoe = ghi(vatLieu(new THREE.Color(1, 1, 1), { phat: 0.95 }))
  const mat: THREE.Group[] = []
  for (const ben of [-1, 1] as const) {
    const g = new THREE.Group()
    const t = new THREE.Mesh(gTrang, mTrang)
    t.scale.set(1, 1.14, 0.64)
    g.add(t)
    const tr = new THREE.Mesh(gTrong, mTrong)
    tr.position.z = 0.12
    tr.scale.set(1, 1.06, 0.72)
    g.add(tr)
    const mo = new THREE.Mesh(gMong, mMong)
    mo.position.z = 0.15
    g.add(mo)
    const l1 = new THREE.Mesh(gLoeTo, mLoe)
    l1.position.set(ben * 0.075, 0.1, 0.24)
    g.add(l1)
    const l2 = new THREE.Mesh(gLoeNho, mLoe)
    l2.position.set(-ben * 0.08, -0.09, 0.23)
    g.add(l2)
    // z = 1,02: nhô hẳn qua mặt lông (≈ 1,07 trừ bán kính cầu mắt) nên không
    // có sợi nào cắt ngang tròng. Bản đầu để 0,84 — mắt chìm trong lông.
    g.position.set(ben * 0.38, 0.08, 1.02)
    g.rotation.y = ben * 0.12
    matKhung.add(g)
    mat.push(g)
  }

  // ─── MÕM, MŨI, MIỆNG CƯỜI ───
  const mMom = ghi(vatLieu(cSang, { nham: 0.88 }))
  const mom = new THREE.Mesh(gCau, mMom)
  mom.position.set(0, -0.24, 1.0)
  // Rồng và kỳ lân có MÕM DÀI thật, không phải cục tròn dán trước mặt.
  const momDai = d.khung === 'long' || d.khung === 'ly'
  mom.scale.set(0.33 * d.coMom, 0.24 * d.coMom, (momDai ? 0.62 : 0.26) * d.coMom)
  if (momDai) mom.position.set(0, -0.24, 1.2)
  matKhung.add(mom)
  const gMui = ghi(new THREE.SphereGeometry(0.09, 16, 14))
  const mMui = ghi(vatLieu(new THREE.Color(0.22, 0.13, 0.17), { nham: 0.3 }))
  const mui = new THREE.Mesh(gMui, mMui)
  mui.position.set(0, -0.17, 1.2)
  mui.scale.set(1.15, 0.8, 0.8)
  matKhung.add(mui)
  const gCuoi = ghi(new THREE.TorusGeometry(0.1, 0.021, 8, 18, Math.PI))
  const cuoi = new THREE.Mesh(gCuoi, mMui)
  cuoi.position.set(0, -0.3, 1.18)
  cuoi.rotation.z = Math.PI
  matKhung.add(cuoi)

  // ─── MÁ HỒNG ───
  const gMa = ghi(new THREE.SphereGeometry(0.19, 20, 16))
  const mMa = ghi(vatLieu(new THREE.Color(1, 0.6, 0.62), { nham: 0.85, trong: 0.66 }))
  for (const x of [-0.62, 0.62]) {
    const ma = new THREE.Mesh(gMa, mMa)
    ma.position.set(x, -0.2, 0.9)
    ma.scale.set(1, 0.68, 0.42)
    matKhung.add(ma)
  }

  // ─── CHI — BỐN CHÂN, HAI CHÂN, hay CHÂN CHIM, theo khung xương ───
  const gChi = ghi(new THREE.CapsuleGeometry(0.19, 0.12, 6, 16))
  const mChi = ghi(vatLieu(cChinh.clone().multiplyScalar(0.92), { nham: 0.9 }))
  const datChi = (x: number, y: number, z: number, co: number, xoayX = Math.PI / 2.1) => {
    const c = new THREE.Mesh(gChi, mChi)
    c.position.set(x, y, z)
    c.rotation.x = xoayX
    c.scale.setScalar(co)
    c.castShadow = true
    than.add(c)
  }
  if (d.khung === 'ly' || d.khung === 'ho' || d.khung === 'quy') {
    // BỐN CHÂN — hai trước hai sau, thân nằm ngang bên trên.
    const dai = d.khung === 'quy' ? 0.72 : 1
    for (const ben of [-1, 1] as const) {
      datChi(ben * 0.46, -1.24, 0.42, 0.95 * dai)
      datChi(ben * 0.46, -1.24, -0.52, 0.95 * dai)
    }
  } else if (d.khung === 'phuong') {
    // CHÂN CHIM — hai que mảnh, cao, không có tay.
    const gQue = ghi(new THREE.CylinderGeometry(0.07, 0.06, 0.62, 8))
    const mQue = ghi(vatLieu(cPhu, { bong: 0.3, nham: 0.5 }))
    for (const ben of [-1, 1] as const) {
      const q = new THREE.Mesh(gQue, mQue)
      q.position.set(ben * 0.25, -1.16, 0.06)
      q.castShadow = true
      than.add(q)
      const ban = new THREE.Mesh(gChi, mQue)
      ban.position.set(ben * 0.25, -1.44, 0.16)
      ban.rotation.x = Math.PI / 2
      ban.scale.set(0.5, 0.45, 0.8)
      than.add(ban)
    }
  } else if (d.khung === 'long') {
    // LONG — hai chân trước nhỏ như vuốt rồng, không có chân sau: thân là đuôi.
    for (const ben of [-1, 1] as const) {
      datChi(ben * 0.62, -0.58, 0.28, 0.72, ben * 0.4)
    }
  } else {
    for (const ben of [-1, 1] as const) datChi(ben * 0.38, -1.28, 0.14, 1)
  }

  // ─── VUỐT — hổ, long, đại bàng, phượng đều có vuốt thật, ba ngón ───
  if (d.khung === 'ho' || d.khung === 'long' || d.khung === 'daiBang' || d.khung === 'phuong') {
    const gVuot = ghi(new THREE.ConeGeometry(0.045, 0.2, 5))
    const mVuot = ghi(vatLieu(new THREE.Color(0.96, 0.94, 0.88), { bong: 0.6, nham: 0.25 }))
    const chanTruoc: [number, number, number][] = d.khung === 'ho'
      ? [[-0.46, -1.42, 0.56], [0.46, -1.42, 0.56]]
      : d.khung === 'long'
        ? [[-0.62, -0.74, 0.42], [0.62, -0.74, 0.42]]
        : [[-0.25, -1.5, 0.3], [0.25, -1.5, 0.3]]
    for (const [x, y, z] of chanTruoc) {
      for (let i = -1; i <= 1; i++) {
        const v = new THREE.Mesh(gVuot, mVuot)
        v.position.set(x + i * 0.11, y, z + 0.06)
        v.rotation.set(Math.PI / 2 + 0.5, 0, i * 0.3)
        than.add(v)
      }
    }
  }

  // ─── RÂU RỒNG — chỉ khung `long` mới có ───
  if (d.khung === 'long') {
    const gRau = ghi(new THREE.CapsuleGeometry(0.028, 0.72, 4, 8))
    const mRau = ghi(vatLieu(cPhu, { nham: 0.6, phat: 0.25 }))
    for (const ben of [-1, 1] as const) {
      const r = new THREE.Mesh(gRau, mRau)
      r.position.set(ben * 0.34, -0.22, 0.92)
      r.rotation.set(0.5, 0, ben * 0.9)
      matKhung.add(r)
    }
  }

  // ─── MỎ PHƯỢNG — thay mõm, chỉ khung `phuong` ───
  if (d.khung === 'phuong') {
    const gMo = ghi(new THREE.ConeGeometry(0.16, 0.44, 8))
    const mMo = ghi(vatLieu(cPhu, { bong: 0.4, nham: 0.35 }))
    const mo = new THREE.Mesh(gMo, mMo)
    mo.position.set(0, -0.14, 0.96)
    mo.rotation.x = Math.PI / 2
    matKhung.add(mo)
  }

  // ─── SỪNG ĐỘC KỲ LÂN — chỉ khung `ly` ───
  if (d.khung === 'ly') {
    const gSungLy = ghi(new THREE.ConeGeometry(0.1, 0.72, 7))
    const mSungLy = ghi(vatLieu(cPhu, { bong: 0.55, nham: 0.3, phat: 0.3 }))
    const sl = new THREE.Mesh(gSungLy, mSungLy)
    sl.position.set(0, 0.86, 0.34)
    sl.rotation.x = -0.4
    sl.castShadow = true
    matKhung.add(sl)
  }

  // ─── HUY HIỆU CÔNG THỨC TRƯỚC NGỰC — tri thức hoá học nằm ngay trên thú ───
  const texHH = ghi(texHuyHieu(info.nguyenToGoc, cPhu))
  const gHH = ghi(new THREE.CircleGeometry(0.3, 40))
  const mHH = ghi(new THREE.MeshBasicMaterial({
    map: texHH, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }))
  const hh = new THREE.Mesh(gHH, mHH)
  hh.position.set(0, -0.6, 0.86)
  hh.rotation.x = -0.12
  than.add(hh)

  // ═══════════════════════════════════════════════════════════════════════
  // BỘ NHẬN DẠNG THẦN THÚ — long · ly · quy · phượng · hổ · đại bàng.
  //
  // Thầy chốt 15-09: *"phải vẽ lại rực rỡ nhất có thể, đẹp và phức tạp tới mức
  // nhìn là phải trầm trồ, phải đạt đỉnh cao của thần thú"*.
  //
  // Mỗi khung được một bộ chi tiết RIÊNG, không dùng chung với khung nào: vây
  // sống lưng, bờm, nanh, sừng, lông vũ, vảy, móng. Đây là chỗ sáu con tách
  // nhau ra ở mức "nhìn phát biết ngay", không phải đoán qua màu.
  // ═══════════════════════════════════════════════════════════════════════
  if (h.than) {
    const k = h.coCon
    const mVang = ghi(vatLieu(new THREE.Color(1, 0.84, 0.36), { bong: 0.75, nham: 0.22, phat: 0.35 }))
    const mNgaVoi = ghi(vatLieu(new THREE.Color(0.98, 0.96, 0.9), { bong: 0.6, nham: 0.25 }))
    const mRuc = ghi(vatLieu(cPhu, { bong: 0.5, nham: 0.3, phat: h.haoQuang ? 0.7 : 0.3 }))

    if (d.khung === 'long') {
      // LONG — VÂY SỐNG LƯNG chạy suốt thân, SỪNG NAI phân nhánh, NANH.
      const gVay = ghi(new THREE.ConeGeometry(0.15, 0.4, 3))
      for (let i = 0; i < 9; i++) {
        const u = i / 8
        const v = new THREE.Mesh(gVay, mRuc)
        v.position.set(Math.sin(u * 3.1) * 0.24, 0.5 - u * 1.9, -0.44 - u * 0.24)
        v.rotation.set(-0.35, 0, Math.sin(u * 3.1) * 0.4)
        v.scale.setScalar((1.25 - u * 0.5) * k)
        goc.add(v)
      }
      // Sừng nai hai nhánh.
      const gNhanh = ghi(new THREE.CapsuleGeometry(0.045, 0.34, 4, 8))
      for (const ben of [-1, 1] as const) {
        for (const [i, ng] of [0.0, 0.5, -0.4].entries()) {
          const n = new THREE.Mesh(gNhanh, mVang)
          n.position.set(ben * (0.3 + i * 0.1), 0.8 + i * 0.22, -0.16 - i * 0.08)
          n.rotation.set(-0.3 + ng * 0.4, 0, ben * (0.5 + ng))
          n.scale.setScalar(1 - i * 0.2)
          dau.add(n)
        }
      }
      // Nanh dưới mõm.
      const gNanh = ghi(new THREE.ConeGeometry(0.05, 0.2, 5))
      for (const ben of [-1, 1] as const) {
        const nn = new THREE.Mesh(gNanh, mNgaVoi)
        nn.position.set(ben * 0.16, -0.42, 1.22)
        nn.rotation.x = Math.PI
        matKhung.add(nn)
      }
    } else if (d.khung === 'ly') {
      // LY — BỜM DÀI xoã hai bên cổ, GIÁP VAI, MÓNG GUỐC.
      const gBom = ghi(new THREE.ConeGeometry(0.14, 0.56, 5))
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const b = new THREE.Mesh(gBom, mRuc)
        b.position.set(Math.cos(a) * 0.46, 0.16 + Math.sin(a) * 0.2, 0.34 + Math.sin(a) * 0.12)
        b.rotation.set(-0.7, 0, a)
        b.scale.setScalar((1.1 + Math.sin(a) * 0.25) * k)
        goc.add(b)
      }
      const gGiap = ghi(new THREE.CylinderGeometry(0.3, 0.26, 0.09, 6))
      for (const ben of [-1, 1] as const) {
        const g = new THREE.Mesh(gGiap, mVang)
        g.position.set(ben * 0.6, -0.5, 0.2)
        g.rotation.set(Math.PI / 2, 0, ben * 0.4)
        g.castShadow = true
        goc.add(g)
      }
    } else if (d.khung === 'quy') {
      // QUY — GAI MAI nhọn quanh rìa, VIỀN MAI dày, RÂU CẰM.
      const gGaiMai = ghi(new THREE.ConeGeometry(0.11, 0.3, 5))
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        const g = new THREE.Mesh(gGaiMai, mVang)
        g.position.set(Math.cos(a) * 1.06, d.yThan + 0.06, Math.sin(a) * 1.0 - 0.16)
        g.rotation.set(Math.PI / 2 - 0.3, 0, -a)
        g.scale.setScalar(k)
        goc.add(g)
      }
      const gVien = ghi(new THREE.TorusGeometry(1.08, 0.08, 8, 34))
      const vien = new THREE.Mesh(gVien, mRuc)
      vien.position.set(0, d.yThan - 0.02, -0.16)
      vien.rotation.x = Math.PI / 2
      goc.add(vien)
    } else if (d.khung === 'phuong') {
      // PHƯỢNG — MÀO BA LÔNG dựng, LÔNG CỔ xoè, ĐUÔI BA PHIẾN dài rực.
      const gLong = ghi(new THREE.CircleGeometry(0.3, 3))
      for (const [i, ng] of [-0.5, 0, 0.5].entries()) {
        const m = new THREE.Mesh(gLong, mVang)
        m.position.set(ng * 0.2, 0.92 + (i === 1 ? 0.22 : 0.06), -0.1)
        m.rotation.set(-0.25, 0, ng)
        m.scale.set((i === 1 ? 1.5 : 1.1) * k, (i === 1 ? 2.1 : 1.5) * k, 1)
        dau.add(m)
      }
      const gPhien = ghi(new THREE.CircleGeometry(0.42, 3))
      for (const [i, ng] of [-0.45, 0, 0.45].entries()) {
        const t = new THREE.Mesh(gPhien, mRuc)
        t.position.set(ng * 0.5, -0.9 - i * 0.06, -1.1 - i * 0.14)
        t.rotation.set(-1.15, 0, ng * 1.3)
        t.scale.set((1.4 - i * 0.1) * k, (3.4 - i * 0.5) * k, 1)
        goc.add(t)
      }
    } else if (d.khung === 'ho') {
      // HỔ — VẰN thân, NANH DÀI, BỜM MÁ hai bên, TAI vểnh.
      const gVan = ghi(new THREE.TorusGeometry(0.52, 0.045, 6, 18, Math.PI * 1.1))
      const mVan = ghi(vatLieu(new THREE.Color(0.08, 0.07, 0.1), { nham: 0.85 }))
      for (let i = 0; i < 6; i++) {
        const u = i / 5
        const v = new THREE.Mesh(gVan, mVan)
        v.position.set(0, d.yThan + 0.2 - u * 0.1, 0.36 - u * 0.86)
        v.rotation.set(Math.PI / 2, 0, Math.PI * 1.45 + (i % 2) * 0.2)
        v.scale.set(1.28 - u * 0.12, 1.28 - u * 0.12, 1)
        goc.add(v)
      }
      const gNanh = ghi(new THREE.ConeGeometry(0.055, 0.26, 5))
      for (const ben of [-1, 1] as const) {
        const n = new THREE.Mesh(gNanh, mNgaVoi)
        n.position.set(ben * 0.17, -0.42, 1.0)
        n.rotation.x = Math.PI
        matKhung.add(n)
      }
      const gMa = ghi(new THREE.ConeGeometry(0.12, 0.4, 4))
      for (const ben of [-1, 1] as const) {
        for (let i = 0; i < 3; i++) {
          const m = new THREE.Mesh(gMa, mRuc)
          m.position.set(ben * 0.78, 0.2 - i * 0.28, 0.16)
          m.rotation.set(0, 0, ben * (1.2 + i * 0.25))
          m.scale.setScalar((1 - i * 0.12) * k)
          matKhung.add(m)
        }
      }
    } else {
      // ĐẠI BÀNG — MỎ QUẶP, CHÙM LÔNG GÁY, LÔNG CÁNH nhiều tầng, MÓNG THÉP.
      const gMoTren = ghi(new THREE.ConeGeometry(0.19, 0.46, 7))
      const mo = new THREE.Mesh(gMoTren, mVang)
      mo.position.set(0, -0.12, 0.92)
      mo.rotation.x = Math.PI / 2 + 0.25
      matKhung.add(mo)
      const gQuap = ghi(new THREE.ConeGeometry(0.1, 0.22, 6))
      const quap = new THREE.Mesh(gQuap, mVang)
      quap.position.set(0, -0.3, 1.06)
      quap.rotation.x = Math.PI - 0.3
      matKhung.add(quap)
      const gGay = ghi(new THREE.ConeGeometry(0.15, 0.42, 4))
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        const g = new THREE.Mesh(gGay, mRuc)
        g.position.set(Math.cos(a) * 0.62, -0.42, Math.sin(a) * 0.5)
        g.rotation.set(0.8, 0, a)
        g.scale.setScalar(k)
        dau.add(g)
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NÉT KÝ RIÊNG — sáu con sáu nét, không con nào có nét của con nào.
  // Đây là thứ trả lời câu "che màu đi thì có phân biệt được không".
  // Hiện từ cấp 2 (lúc nở khỏi trứng), lớn dần theo cỡ thú.
  // ═══════════════════════════════════════════════════════════════════════
  if (h.than) {
    const k = h.coCon
    if (d.netKy === 'bomGay') {
      // HOẢ — bờm gáy dựng: năm chùm lông cứng chạy từ gáy xuống lưng.
      const mBom = ghi(vatLieu(cPhu.clone().lerp(cChinh, 0.3), { nham: 0.85, phat: h.haoQuang ? 0.28 : 0 }))
      const gBom = ghi(new THREE.ConeGeometry(0.13, 0.42, 7))
      for (let i = 0; i < 5; i++) {
        const u = i / 4
        const b = new THREE.Mesh(gBom, mBom)
        // Phải NHÔ KHỎI đường viền đầu mới thấy; nằm sau lưng là khuất sạch.
        b.position.set((u - 0.5) * 0.5, 1.02 - u * 0.5, -0.32 - u * 0.34)
        b.rotation.set(-0.5 - u * 0.45, 0, (u - 0.5) * 0.7)
        b.scale.setScalar((1.5 - u * 0.5) * k)
        b.castShadow = true
        goc.add(b)
      }
    } else if (d.netKy === 'vayLung') {
      // ACID — vây lưng: ba tấm vây mỏng trong suốt chạy dọc sống lưng.
      const mVay = ghi(vatLieu(cPhu, { nham: 0.4, trong: 0.62, phat: h.haoQuang ? 0.35 : 0.1 }))
      const gVay = ghi(new THREE.CircleGeometry(0.34, 3))
      for (let i = 0; i < 3; i++) {
        const u = i / 2
        const v = new THREE.Mesh(gVay, mVay)
        v.position.set(0, 0.52 - u * 0.62, -0.44 - u * 0.22)
        v.rotation.set(0.25, Math.PI / 2, 0.32 - u * 0.34)
        v.scale.setScalar((1.55 - u * 0.4) * k)
        goc.add(v)
      }
    } else if (d.netKy === 'gaiVai') {
      // BASE — gai tinh thể trên vai: hai cụm khối bát diện mọc ra hai bên.
      const mGai = ghi(vatLieu(cPhu, { bong: 0.5, nham: 0.25, phat: h.haoQuang ? 0.45 : 0.12 }))
      const gGai = ghi(new THREE.OctahedronGeometry(0.17, 0))
      for (const ben of [-1, 1] as const) {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Mesh(gGai, mGai)
          g.position.set(ben * (0.82 + i * 0.16), -0.2 - i * 0.2, 0.06 - i * 0.22)
          g.rotation.set(i * 0.6, ben * 0.4, ben * (0.5 + i * 0.25))
          g.scale.setScalar((1.25 - i * 0.2) * k)
          g.castShadow = true
          goc.add(g)
        }
      }
    } else if (d.netKy === 'longXu') {
      // KHÍ — lông xù bay: sáu chùm lông tơ dựng quanh cổ, xoè như bồ công anh.
      const mXu = ghi(vatLieu(cSang, { nham: 0.95 }))
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const vt = new THREE.Vector3(Math.cos(a) * 0.95, -0.3, Math.sin(a) * 0.72 - 0.06)
        const co = new THREE.Vector3(0.3, 0.22, 0.3)
        const x = new THREE.Mesh(gCau, mXu)
        x.position.copy(vt); x.scale.copy(co)
        goc.add(x)
        nhan(bocLong(goc, gCau, { vt, co }, cSang, cPhu,
          { soLop: nLopNho, tex: texLong, dayLong: 0.55, lapVan: 3 }))
      }
    } else if (d.netKy === 'chomToc') {
      // ĐIỆN — chỏm tóc dựng đứng: ba ngọn lệch nhau, đúng chất tinh nghịch.
      const mToc = ghi(vatLieu(cPhu, { nham: 0.8, phat: h.haoQuang ? 0.5 : 0.15 }))
      const gToc = ghi(new THREE.ConeGeometry(0.11, 0.46, 6))
      for (const [i, x] of [-0.22, 0.02, 0.24].entries()) {
        const t = new THREE.Mesh(gToc, mToc)
        t.position.set(x, 1.04 + (i === 1 ? 0.16 : 0), -0.02)
        t.rotation.z = (i - 1) * 0.42
        t.rotation.x = -0.18
        t.scale.setScalar((i === 1 ? 1.5 : 1.15) * k)
        dau.add(t)
      }
    } else {
      // HỮU CƠ — lá vai: bốn phiến lá bè xoè hai bên, mềm và hiền.
      const mLa = ghi(vatLieu(cPhu, { nham: 0.75, trong: 0.9 }))
      const gLa = ghi(new THREE.CircleGeometry(0.3, 6))
      for (const ben of [-1, 1] as const) {
        for (let i = 0; i < 2; i++) {
          const l = new THREE.Mesh(gLa, mLa)
          l.position.set(ben * (0.86 + i * 0.2), -0.12 + i * 0.3, -0.12 - i * 0.24)
          l.rotation.set(-0.35 - i * 0.25, ben * 0.85, ben * (0.55 + i * 0.3))
          l.scale.setScalar((1.35 - i * 0.25) * k)
          goc.add(l)
        }
      }
    }
  }

  const vongXoay: THREE.Object3D[] = []
  const vongPhep: THREE.Object3D[] = []

  // ─── CẤP 3: SỪNG mềm, bo đầu ───
  if (h.sung) {
    const gSung = ghi(new THREE.CapsuleGeometry(0.1, h.toiThuong ? 0.52 : 0.34, 6, 14))
    const mSung = ghi(vatLieu(h.toiThuong ? new THREE.Color(1, 0.85, 0.34) : cPhu, {
      bong: h.toiThuong ? 0.6 : 0.1, nham: 0.5, phat: h.toiThuong ? 0.4 : 0,
    }))
    for (const ben of [-1, 1] as const) {
      const s = new THREE.Mesh(gSung, mSung)
      s.position.set(ben * 0.28, 1.0, 0.2)
      s.rotation.z = -ben * 0.36
      s.rotation.x = -0.24
      s.castShadow = true
      dau.add(s)
    }
  }

  // ─── CẤP 4: ĐUÔI — chuỗi cục lông xù, KHÔNG phải ống nhựa nhẵn ───
  // Ảnh chụp bản đầu: đuôi là một khúc ống trơn bóng nằm cạnh bộ lông xù, nhìn
  // như hai con thú khác nhau ghép lại. Đuôi giờ là bốn cục cầu bọc lông, to
  // dần ra ngọn — đúng dáng đuôi cáo, và cùng chất liệu với cả con.
  let duoi: THREE.Group | null = null
  if (h.duoi) {
    duoi = new THREE.Group()
    // Số đốt theo dáng: Phong Lôi năm đốt vút dài, Bảo Thần hai đốt cụt chắc.
    const soDot = Math.max(2, Math.min(6, d.soDotDuoi))
    const MOC: { vt: THREE.Vector3; r: number; ngon: boolean }[] = []
    for (let i = 0; i < soDot; i++) {
      const u = i / (soDot - 1)
      MOC.push({
        vt: new THREE.Vector3(-0.18 - u * 0.78, u * u * 0.9, -0.14 - u * 0.2),
        r: 0.2 + u * 0.085,
        ngon: i === soDot - 1,
      })
    }
    for (const m of MOC) {
      const mauCuc = m.ngon ? cPhu : cChinh
      const mCuc = ghi(vatLieu(mauCuc, { nham: 0.9, phat: m.ngon && h.haoQuang ? 0.3 : 0 }))
      const co = new THREE.Vector3(m.r, m.r, m.r)
      const cuc = new THREE.Mesh(gCau, mCuc)
      cuc.position.copy(m.vt)
      cuc.scale.copy(co)
      cuc.castShadow = true
      duoi.add(cuc)
      nhan(bocLong(duoi, gCau, { vt: m.vt, co }, mauCuc, m.ngon ? cChinh : cPhu,
        { soLop: nLopNho, tex: texLong, dayLong: 0.34, lapVan: 3 }))
    }
    // Vị trí gốc đuôi theo khung: chim xoè sau lưng cao, bốn chân thì thấp và
    // lùi hẳn ra sau, rồng thì thân đã là đuôi nên đuôi rời chỉ là chỏm ngọn.
    if (d.khung === 'phuong') {
      duoi.position.set(0, -0.5, -0.86)
      duoi.scale.set(1.5, 1.5, 1.5)
    } else if (d.khung === 'ly' || d.khung === 'ho' || d.khung === 'quy') {
      duoi.position.set(0, -1.0, -1.0)
    } else if (d.khung === 'long') {
      duoi.position.set(0.1, -1.6, -1.05)
      duoi.scale.setScalar(0.85)
    } else {
      duoi.position.set(-0.46, -0.98, -0.4)
    }
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
    // Ảnh chụp bản trước: cánh đục và phẳng lì nên nhìn ra miếng bìa dán sau
    // lưng. Trong mờ + tự phát sáng nhẹ + hai mặt đều vẽ → ra màng năng lượng.
    const mCanh = ghi(vatLieu(cPhu, {
      nham: 0.22, bong: 0.05,
      trong: lon ? 0.68 : 0.58, phat: h.toiThuong ? 0.75 : 0.42,
    }))
    mCanh.side = THREE.DoubleSide
    mCanh.depthWrite = false
    const co = lon ? 1.5 : 0.95
    for (const ben of [-1, 1] as const) {
      const g = new THREE.Group()
      const m = new THREE.Mesh(gCanh, mCanh)
      m.scale.set(co * ben, co, lon ? 2.4 : 1)
      m.castShadow = true
      g.add(m)
      // Mặt lông ĐẦU vươn ra sau tới z ≈ −0,72 ở cao độ này, lưng tới −0,74.
      // Đặt cánh ở −0,56 như bản đầu là cánh nằm lọt trong lông, không thấy gì.
      // Bản trước chỉ thấy MỘT cánh: hai cánh ngửa ra sau quá nhiều nên cánh
      // bên kia lọt hẳn sau thân. Xoè sang ngang thì cả đôi cùng lộ.
      g.position.set(ben * 0.66, -0.16, -0.8)
      g.rotation.y = ben * 0.42
      g.rotation.z = lon ? ben * 0.38 : ben * 0.24

      // SONG DỰC nghĩa là HAI CẶP cánh, không phải một cặp to hơn.
      // Phép kiểm bắt được: bản đầu cấp 8 chỉ phóng to cánh cấp 5 nên số khối
      // đứng im, tức cấp 8 không ngầu hơn cấp 7 chút nào.
      if (lon) {
        const phu = new THREE.Mesh(gCanh, mCanh)
        phu.scale.set(co * 0.62 * ben, co * 0.58, 1.6)
        phu.position.set(0, -0.58, 0.1)
        phu.rotation.z = -ben * 0.34
        g.add(phu)
      }

      than.add(g)
      if (ben < 0) canhTrai = g
      else canhPhai = g
    }
  }

  // ─── CẤP 6: HÀO QUANG — vòng phép dưới chân, KHÔNG phải quả cầu kính ───
  // Ảnh chụp bản đầu: vỏ cầu trong suốt cho ra một đường viền tròn cứng chạy
  // ngang cảnh, nhìn ra cái lồng thuỷ tinh úp lên thú. Vòng phép nằm sát đất
  // vừa sáng vừa không cắt ngang thứ gì.
  if (h.haoQuang) {
    const texVP = ghi(texVongPhep(cPhu))
    const gVP = ghi(new THREE.CircleGeometry(1.72, 48))
    const mVP = ghi(new THREE.MeshBasicMaterial({
      map: texVP, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.45 + h.damHaoQuang * 0.4,
    }))
    const vp = new THREE.Mesh(gVP, mVP)
    vp.rotation.x = -Math.PI / 2
    vp.position.y = CHAN_Y + 0.06
    // Sàn cảnh cũng là mặt trong suốt; không ép thứ tự vẽ thì vòng phép bị sàn
    // phủ lên và biến mất hẳn — ảnh chụp bản trước không thấy vòng nào.
    vp.renderOrder = 3
    goc.add(vp)
    vongPhep.push(vp)

    // Ba lớp lông ngoài cùng rực lên: chỉ sợi dài nhất mới còn ở lớp ấy, nên
    // hào quang chạy đúng theo mép bộ lông thay vì bọc một quả cầu quanh thú.
    for (const b of long) {
      for (let k = Math.max(0, b.lop.length - 3); k < b.lop.length; k++) {
        const vl = b.lop[k]!.material as THREE.MeshStandardMaterial
        vl.emissive = cPhu.clone()
        vl.emissiveIntensity = 0.08 + (k - b.lop.length + 3) * 0.09 + h.damHaoQuang * 0.12
      }
    }
  }

  // ─── CẤP 7: VẢY nguyên tố trên lưng ───
  if (h.vay) {
    const gVay = ghi(new THREE.ConeGeometry(0.085, 0.19, 10))
    const mVay = ghi(vatLieu(cPhu, { bong: 0.3, nham: 0.45 }))
    for (let hang = 0; hang < 3; hang++) {
      for (let i = 0; i < 4; i++) {
        const v = new THREE.Mesh(gVay, mVay)
        const a = -0.45 + i * 0.3
        v.position.set((hang - 1) * 0.26, 0.5 + Math.cos(a) * 1.0, -Math.sin(a) * 1.0 - 0.08)
        v.rotation.x = a - Math.PI / 2
        than.add(v)
      }
    }
  }

  // ─── CẤP 9: QUỸ ĐẠO hạt ───
  if (h.quyDao) {
    const gHat = ghi(new THREE.SphereGeometry(0.058, 12, 10))
    // Màu thuần, không qua đèn: hạt năng lượng phải rực đúng màu hệ. Dùng
    // vật liệu có đổ bóng thì hạt ra màu kem nhờ nhờ — ảnh chụp bản đầu vậy.
    const mHat = ghi(new THREE.MeshBasicMaterial({ color: cPhu }))
    for (let v = 0; v < 2; v++) {
      const vong = new THREE.Group()
      const soHat = h.soHat > 0 ? Math.min(10, h.soHat) : 4
      for (let i = 0; i < soHat; i++) {
        const hat = new THREE.Mesh(gHat, mHat)
        const a = (i / soHat) * Math.PI * 2
        hat.position.set(Math.cos(a) * 1.95, 0, Math.sin(a) * 1.95)
        vong.add(hat)
      }
      // Nghiêng gần nằm ngang: ảnh chụp bản đầu cho vòng cắt thẳng qua mặt thú.
      vong.rotation.set(v === 0 ? 1.2 : -1.08, 0, v === 0 ? 0.3 : -0.42)
      vong.position.y = -0.1
      goc.add(vong)
      vongXoay.push(vong)
    }
  }

  // ─── CẤP 10: VƯƠNG MIỆN ───
  if (h.vuongMien) {
    const mien = new THREE.Group()
    const gVanh = ghi(new THREE.TorusGeometry(0.42, 0.05, 12, 30))
    const mVang = ghi(vatLieu(new THREE.Color(1, 0.83, 0.28), { bong: 0.85, nham: 0.24, phat: 0.25 }))
    const vanh = new THREE.Mesh(gVanh, mVang)
    vanh.rotation.x = Math.PI / 2
    mien.add(vanh)
    const gChop = ghi(new THREE.ConeGeometry(0.08, 0.25, 10))
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(gChop, mVang)
      const a = (i / 5) * Math.PI * 2
      c.position.set(Math.cos(a) * 0.42, 0.15, Math.sin(a) * 0.42)
      mien.add(c)
    }
    mien.position.set(0, 1.2, 0)
    dau.add(mien)
  }

  // ─── CẤP 11: VÒNG RUNE ký hiệu hoá học, chạy quanh chân ───
  if (h.vongRune) {
    const tex = ghi(texVongRune(KY_HIEU_HE[info.he] ?? KY_HIEU_HE['hoa']!, cPhu))
    tex.repeat.set(5, 1)
    const soVong = h.toiThuong ? 3 : 1
    for (let i = 0; i < soVong; i++) {
      // Vành cao 0,30 và lặp vân 5 lần: chu vi ≈ 12,6 chia 5 còn 2,5, chia cho
      // 0,30 ra tỉ lệ ≈ 8,4 — sát tỉ lệ 8 : 1 của tấm chữ, nên chữ không bị kéo
      // cao. Ảnh chụp bản đầu (lặp 1 lần) cho chữ "Mg" to bằng cả con thú.
      // Bán kính 2,0 đẩy vành ra ngoài hẳn bộ lông (bán kính ≈ 0,9) nên chữ
      // chạy vòng quanh chứ không cắt ngang chân.
      const gR = ghi(new THREE.CylinderGeometry(1.95 + i * 0.2, 1.95 + i * 0.2, 0.3, 48, 1, true))
      // CHỈ vẽ mặt ngoài. Vẽ hai mặt thì nửa vành phía sau hiện xuyên qua nửa
      // trước và chữ ở đó bị LẬT NGƯỢC — ảnh chụp bản trước đầy chữ "HCl" soi
      // gương nằm chồng lên sàn.
      const mR = ghi(new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.92, side: THREE.FrontSide, depthWrite: false,
      }))
      const r = new THREE.Mesh(gR, mR)
      // Ảnh chụp bản đầu: dải chữ nằm đúng ngang tầm mắt, che kín mặt thú.
      // Hạ xuống quanh chân — vẫn đọc được chữ, không che mặt.
      r.position.y = -1.05 - i * 0.13
      r.rotation.z = (i - 1) * 0.1
      r.scale.setScalar(1 - i * 0.06)
      goc.add(r)
      vongXoay.push(r)
    }
  }

  // ─── CẤP 12: VIỀN LỬA TỐI THƯỢNG ───
  if (h.toiThuong) {
    const gLua = ghi(new THREE.TorusGeometry(1.52, 0.085, 14, 44))
    const mLua = ghi(new THREE.MeshBasicMaterial({
      color: cPhu, transparent: true, opacity: 0.6, depthWrite: false,
    }))
    const lua = new THREE.Mesh(gLua, mLua)
    lua.rotation.x = Math.PI / 2.06
    lua.position.y = CHAN_Y + 0.08
    goc.add(lua)
    vongXoay.push(lua)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SÁU MỐC MỚI CỦA ĐƯỜNG 120 CẤP (60 · 70 · 81 · 92 · 104 · 116).
  // Mỗi mốc thêm khối thật, nên "cấp sau ngầu hơn cấp trước" vẫn đếm được.
  // ═══════════════════════════════════════════════════════════════════════

  // ─── CẤP 60: GAI SỐNG LƯNG ───
  if (h.gaiLung) {
    const mG = ghi(vatLieu(cPhu, { bong: 0.45, nham: 0.3, phat: 0.55 }))
    const gG = ghi(new THREE.ConeGeometry(0.1, 0.38, 5))
    for (let i = 0; i < 7; i++) {
      const u = i / 6
      const g = new THREE.Mesh(gG, mG)
      g.position.set(0, 0.5 - u * 1.4, -0.72 - Math.sin(u * Math.PI) * 0.12)
      g.rotation.x = -0.35 - u * 0.5
      g.scale.setScalar(1.05 - u * 0.35)
      g.castShadow = true
      goc.add(g)
    }
  }

  // ─── CẤP 70: ĐUÔI LỬA ───
  if (h.duoiLua && duoi !== null) {
    const mL = ghi(new THREE.MeshBasicMaterial({
      color: cPhu, transparent: true, opacity: 0.72, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    const gL = ghi(new THREE.ConeGeometry(0.26, 0.72, 10, 1, true))
    for (let i = 0; i < 3; i++) {
      const l = new THREE.Mesh(gL, mL)
      l.position.set(-0.96 - i * 0.05, 0.9 + i * 0.22, -0.3)
      l.rotation.z = -0.3 + i * 0.12
      l.scale.setScalar(1 - i * 0.22)
      duoi.add(l)
      vongXoay.push(l)
    }
  }

  // ─── CẤP 81: HÀO QUANG SONG TẦNG ───
  if (h.haoQuangKep) {
    const gH = ghi(new THREE.SphereGeometry(1.62, 26, 18))
    const mH = ghi(new THREE.MeshBasicMaterial({
      color: cPhu, transparent: true, opacity: 0.16, side: THREE.BackSide,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    const hq = new THREE.Mesh(gH, mH)
    hq.position.y = -0.3
    goc.add(hq)
    const gH2 = ghi(new THREE.TorusGeometry(1.34, 0.035, 10, 52))
    const mH2 = ghi(new THREE.MeshBasicMaterial({
      color: cChinh.clone().lerp(new THREE.Color(1, 1, 1), 0.5),
      transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    for (const nghieng of [0.35, -0.55] as const) {
      const v = new THREE.Mesh(gH2, mH2)
      v.rotation.set(Math.PI / 2 + nghieng, 0, nghieng)
      v.position.y = -0.3
      goc.add(v)
      vongXoay.push(v)
    }
  }

  // ─── CẤP 92: MẮT THỨ BA ───
  if (h.matThuBa) {
    const gM3 = ghi(new THREE.SphereGeometry(0.15, 20, 16))
    const mM3 = ghi(vatLieu(cPhu, { phat: 1.6, nham: 0.15 }))
    const m3 = new THREE.Mesh(gM3, mM3)
    m3.position.set(0, 0.52, 0.94)
    m3.scale.set(1, 1.3, 0.7)
    dau.add(m3)
    const gVanh = ghi(new THREE.TorusGeometry(0.19, 0.028, 10, 22))
    const vanh = new THREE.Mesh(gVanh, mM3)
    vanh.position.set(0, 0.52, 0.96)
    dau.add(vanh)
  }

  // ─── CẤP 104: GIÁP NGỰC ───
  if (h.giapNguc) {
    const gGn = ghi(new THREE.CylinderGeometry(0.46, 0.38, 0.1, 6))
    const mGn = ghi(vatLieu(cPhu, { bong: 0.75, nham: 0.18, phat: 0.35 }))
    const gn = new THREE.Mesh(gGn, mGn)
    gn.position.set(0, -0.62, 0.66)
    gn.rotation.set(Math.PI / 2 - 0.14, 0, 0)
    gn.castShadow = true
    than.add(gn)
    const gVien = ghi(new THREE.TorusGeometry(0.5, 0.04, 8, 6))
    const vien = new THREE.Mesh(gVien, mGn)
    vien.position.set(0, -0.62, 0.7)
    vien.rotation.x = -0.14
    than.add(vien)
  }

  // ─── CẤP 116: RUNE NGHỊCH CHUYỂN ───
  if (h.runeKep) {
    const texN = ghi(texVongRune(KY_HIEU_HE[info.he] ?? KY_HIEU_HE['hoa']!, cChinh))
    const gN = ghi(new THREE.CylinderGeometry(2.55, 2.55, 0.34, 52, 1, true))
    const mN = ghi(new THREE.MeshBasicMaterial({
      map: texN, transparent: true, opacity: 0.8, side: THREE.FrontSide, depthWrite: false,
    }))
    const n = new THREE.Mesh(gN, mN)
    n.position.y = -0.72
    n.rotation.z = 0.24
    goc.add(n)
    // Quay NGƯỢC chiều ba vòng kia — đây là chỗ "nghịch chuyển".
    vongPhep.push(n)
  }

  return {
    goc, than, dau, mat, long, duoi, canhTrai, canhPhai, vongXoay, vongPhep,
    mieng: new THREE.Vector3(0, 0.2, 1.3), chanY: CHAN_Y, rac,
  }
}

/** Trả bộ nhớ GPU. Three không tự dọn — quên là rò từng lần lên cấp. */
export function donBoThanThu3D(bo: BoThanThu3D): void {
  for (const r of bo.rac) r.dispose()
  bo.rac.length = 0
  bo.long.length = 0
  bo.goc.clear()
}
