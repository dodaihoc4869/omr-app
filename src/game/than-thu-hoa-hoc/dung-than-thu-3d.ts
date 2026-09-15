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
  const nLop = Math.max(2, soLop ?? soLopTheoMay())
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

  // ─── THÂN DƯỚI (nhỏ) ───
  // PHẢI thêm trước mọi thứ khác: phép kiểm lấy material đầu tiên gặp khi duyệt
  // cây để xác nhận mỗi hệ một màu.
  const mThan = ghi(vatLieu(cChinh, { nham: 0.9 }))
  const VT_THAN = new THREE.Vector3(0, -0.74, -0.04)
  const CO_THAN = new THREE.Vector3(0.74, 0.66, 0.7)
  const khoiThan = new THREE.Mesh(gCau, mThan)
  khoiThan.position.copy(VT_THAN)
  khoiThan.scale.copy(CO_THAN)
  khoiThan.receiveShadow = true
  than.add(khoiThan)
  nhan(bocLong(than, gCau, { vt: VT_THAN, co: CO_THAN }, cChinh, cPhu,
    { soLop: nLop, tex: texLong, dayLong: 0.14, lapVan: 7 }))

  // ─── ĐẦU (to) ───
  const dau = new THREE.Group()
  dau.position.set(0, 0.5, 0)
  than.add(dau)
  const mDau = ghi(vatLieu(cChinh, { nham: 0.9 }))
  const CO_DAU = new THREE.Vector3(1.02, 0.96, 0.98)
  const khoiDau = new THREE.Mesh(gCau, mDau)
  khoiDau.scale.copy(CO_DAU)
  khoiDau.castShadow = true
  khoiDau.receiveShadow = true
  dau.add(khoiDau)
  nhan(bocLong(dau, gCau, { vt: new THREE.Vector3(0, 0, 0), co: CO_DAU }, cChinh, cPhu,
    { soLop: nLop, tex: texLong, dayLong: 0.13, lapVan: 8 }))

  // ─── TAI tròn, có lông, trong tai màu hồng ───
  const mTrongTai = ghi(vatLieu(new THREE.Color(1, 0.68, 0.72), { nham: 0.8 }))
  for (const ben of [-1, 1] as const) {
    const vtTai = new THREE.Vector3(ben * 0.6, 0.76, -0.04)
    const coTai = new THREE.Vector3(0.3, 0.42, 0.22)
    const xoayTai = new THREE.Euler(0, 0, ben * 0.3)
    const mTai = ghi(vatLieu(cChinh, { nham: 0.9 }))
    const tai = new THREE.Mesh(gCau, mTai)
    tai.position.copy(vtTai)
    tai.scale.copy(coTai)
    tai.rotation.copy(xoayTai)
    dau.add(tai)
    nhan(bocLong(dau, gCau, { vt: vtTai, co: coTai, xoay: xoayTai }, cChinh, cPhu,
      { soLop: nLopNho, tex: texLong, dayLong: 0.22, lapVan: 4 }))
    const trong = new THREE.Mesh(gCau, mTrongTai)
    trong.position.set(ben * 0.58, 0.76, 0.24)
    trong.scale.set(0.16, 0.25, 0.09)
    trong.rotation.z = ben * 0.3
    dau.add(trong)
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
    dau.add(g)
    mat.push(g)
  }

  // ─── MÕM, MŨI, MIỆNG CƯỜI ───
  const mMom = ghi(vatLieu(cSang, { nham: 0.88 }))
  const mom = new THREE.Mesh(gCau, mMom)
  mom.position.set(0, -0.24, 1.0)
  mom.scale.set(0.33, 0.24, 0.26)
  dau.add(mom)
  const gMui = ghi(new THREE.SphereGeometry(0.09, 16, 14))
  const mMui = ghi(vatLieu(new THREE.Color(0.22, 0.13, 0.17), { nham: 0.3 }))
  const mui = new THREE.Mesh(gMui, mMui)
  mui.position.set(0, -0.17, 1.2)
  mui.scale.set(1.15, 0.8, 0.8)
  dau.add(mui)
  const gCuoi = ghi(new THREE.TorusGeometry(0.1, 0.021, 8, 18, Math.PI))
  const cuoi = new THREE.Mesh(gCuoi, mMui)
  cuoi.position.set(0, -0.3, 1.18)
  cuoi.rotation.z = Math.PI
  dau.add(cuoi)

  // ─── MÁ HỒNG ───
  const gMa = ghi(new THREE.SphereGeometry(0.19, 20, 16))
  const mMa = ghi(vatLieu(new THREE.Color(1, 0.6, 0.62), { nham: 0.85, trong: 0.66 }))
  for (const x of [-0.62, 0.62]) {
    const ma = new THREE.Mesh(gMa, mMa)
    ma.position.set(x, -0.2, 0.9)
    ma.scale.set(1, 0.68, 0.42)
    dau.add(ma)
  }

  // ─── TAY NGẮN, CHÂN MẬP ───
  const gChi = ghi(new THREE.CapsuleGeometry(0.19, 0.12, 6, 16))
  const mChi = ghi(vatLieu(cChinh.clone().multiplyScalar(0.92), { nham: 0.9 }))
  for (const ben of [-1, 1] as const) {
    const tay = new THREE.Mesh(gChi, mChi)
    tay.position.set(ben * 0.72, -0.72, 0.08)
    tay.rotation.z = ben * 0.5
    tay.scale.setScalar(0.88)
    tay.castShadow = true
    than.add(tay)
    const chan = new THREE.Mesh(gChi, mChi)
    chan.position.set(ben * 0.38, -1.26, 0.12)
    chan.rotation.x = Math.PI / 2.1
    chan.castShadow = true
    than.add(chan)
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
    const MOC: readonly { vt: THREE.Vector3; r: number; ngon: boolean }[] = [
      { vt: new THREE.Vector3(-0.18, 0.0, -0.14), r: 0.21, ngon: false },
      { vt: new THREE.Vector3(-0.46, 0.2, -0.26), r: 0.235, ngon: false },
      { vt: new THREE.Vector3(-0.72, 0.5, -0.32), r: 0.255, ngon: false },
      { vt: new THREE.Vector3(-0.9, 0.86, -0.3), r: 0.275, ngon: true },
    ]
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
    duoi.position.set(-0.46, -0.98, -0.4)
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
