// GIÁM THỊ «SỐNG ĐỘNG» (thầy duyệt 02/11 — bản vẽ docs/ban-ve-giam-thi-moi-0211/giam-thi.html, «Đây là bản giám thị mới»). Thay hình người v3 (27/10),
// GIỮ NGUYÊN API taoGiamThi / GiamThi cũ (GiamThi.tsx, GiamThiThi.tsx, GiamThiTinh, bộ chụp qua GT_DANG_SONG đều dùng như trước) + thêm phanUng / datThi / soiVao.
// Hình: giam-thi-hinh.ts (chép nguyên bản vẽ). Chuyển động: BỘ MÁY LÒ XO — mỗi tham số (dáng, mắt, mí, mày, tay…) chạy về đích bằng lò xo từ giá trị
// đang có ⇒ đổi dáng không nhảy cóc, có quá đà; chỉ đổi thuộc tính transform / opacity của ~30 nhóm SVG (đệm giá trị, không ghi lại giá trị cũ).
//   · Đứng chờ: động tác chọn NGẪU NHIÊN có trọng số theo từng người, không lặp liền (nhìn đề, đảo mắt, nghiêng đầu, lắc ống nghiệm / bình, đẩy kính, gõ bút,
//     nheo mắt, nhún chân), chớp mắt ngẫu nhiên (đôi khi chớp đôi); NGÁP chỉ khi lâu (≥ 15 s) không ai bấm.
//   · Em làm bài: chọn ⇒ liếc ô em chọn · đúng ⇒ gật đầu, giơ ngón cái (đúng liền ⇒ bật nhảy) · sai ⇒ nhíu mày, chỉ vào đề · bấm vội ⇒ liếc nghi ngờ, chỉ đề.
//   · Lúc thi: cầm đèn pha quét chậm; em chạm ô ⇒ đèn quay sang soi đúng ô ấy. Không dáng đúng / sai trong thi.
// HÌNH KHÔNG TỰ NÓI: mọi lời do màn gọi `noi` (GiamThi.tsx / GiamThiThi.tsx theo nhịp chung ở loi-giam-thi.ts) ⇒ không hai bong bóng, không vượt nhịp.
// TỐC ĐỘ (giữ mọi điều bản cũ đã đo): vòng rAF CHỈ chạy khi còn lò xo động / đang chớp / tay đang rê; vẽ tối đa ~30 khung/giây; em vừa chạm ⇒ nhường
// 140 ms cho phản hồi nút; khuất khỏi màn (IntersectionObserver) hoặc tab ẩn ⇒ nghỉ hẳn (không hẹn giờ, không rAF). Máy yếu (html.may-yeu) / giảm chuyển
// động ⇒ dáng đổi tức thì theo cảm xúc, không vòng lò xo, không động tác đứng chờ, chớp mắt bằng hẹn giờ (đổi mắt nhắm / mở, không rAF).
import type { MucGT, TrangThaiGT } from './giam-thi-ve'
import { MAT_X, MAT_Y, NV_GT4, TL, VB, veNguoi, type NhanRoi, type NvGT4 } from './giam-thi-hinh'

/** Bong bóng CO VỪA CHỮ (thầy 03/11 «Bong bóng của giám thị khung phải tự động vừa với chữ nhé»): `width: max-content` kẹp ở bề ngang tối đa ⇒ chữ xuống dòng
 *  (cân dòng) vẫn để khung rộng hết cỡ, thừa khoảng trống bên phải. Đo dòng chữ DÀI NHẤT (Range) rồi đặt bề rộng khung đúng bằng nó (+ đệm). Một lần đo mỗi lời. */
function coVuaChu(el: HTMLElement): void {
  try {
    const r = document.createRange(); r.selectNodeContents(el)
    const ds = [...r.getClientRects()]
    if (ds.length < 2) return // một dòng: max-content đã vừa
    const dong = new Map<number, [number, number]>()
    for (const d of ds) { if (!d.width) continue; const k = Math.round(d.top); const c = dong.get(k); dong.set(k, c ? [Math.min(c[0], d.left), Math.max(c[1], d.right)] : [d.left, d.right]) }
    let rong = 0
    for (const [a, b] of dong.values()) rong = Math.max(rong, b - a)
    const cs = getComputedStyle(el), dem = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)
    if (rong > 0 && rong + dem + 1 < el.getBoundingClientRect().width) el.style.width = `${Math.ceil(rong + dem + 1)}px`
  } catch { /* trình duyệt cũ: giữ như cũ */ }
}
import { rung } from '../../lib/rung'

export type PhanUngGT = 'chon' | 'nop' | 'voi' | 'dung' | 'dungLien' | 'sai' | 'saiLien' | 'choc' | 'roi'
/** Màu bong bóng lời theo tình huống (giam-thi.css `.gt-loi[data-cam]`). */
export type CamLoi = 'khen' | 'chan' | 'sai' | 'doi' | 'gian' | 'nghi'

export interface GiamThi {
  readonly muc: MucGT
  readonly svg: SVGSVGElement
  datTrangThai(ten: TrangThaiGT, o?: { buoc?: number; xong?: () => void; lien?: boolean }): GiamThi
  trangThai(): TrangThaiGT
  nhin(nx: number, ny: number): GiamThi
  nhinVao(el: Element | null | undefined): GiamThi
  noi(chu: string | null | undefined, o?: { giu?: number; cam?: CamLoi }): GiamThi
  /** Phản ứng một lần (liếc ô em chọn, đúng, sai, bấm vội…); `diem` = điểm trên màn (px) để liếc tới. */
  phanUng(loai: PhanUngGT, o?: { diem?: { x: number; y: number } }): GiamThi
  /** Lúc thi: cầm đèn pha quét chậm (bật) / trả về dáng thường (tắt). */
  datThi(bat: boolean): GiamThi
  /** Lúc thi: quay đèn soi đúng ô `el` em vừa chạm. Trả về tâm kính đèn (toạ độ màn, px) ở dáng ĐÍCH — tia của màn thi bắt đầu từ đó. */
  soiVao(el: Element | null | undefined): { x: number; y: number } | null
  tamDung(dung: boolean): void
  /** Chuyển giám thị (giữ nguyên hình đã dựng + tư thế đang có) sang khung chứa mới — câu mới dùng lại, không dựng lại hình. */
  doiCho(khung: HTMLElement, loiVao?: HTMLElement | null): void
  huy(): void
}

export const THU_TU_NGUOI: readonly MucGT[] = ['nb', 'th', 'vd', 'vdc']
/** Các giám thị đang sống (bộ chụp / máy quay video bản build điều khiển trạng thái qua đây). */
export const GT_DANG_SONG = new Set<GiamThi>()

const HUY = Symbol('huy')
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randI = (a: number, b: number) => Math.floor(rand(a, b + 1))
const kep = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const f = (v: number) => String(Math.round(v * 100) / 100)
const f3 = (v: number) => String(Math.round(v * 1000) / 1000)
function chonTS<T extends string>(ds: [T, number][]): T {
  let t = 0
  for (const [, w] of ds) t += w
  let r = Math.random() * t
  for (const [k, w] of ds) { r -= w; if (r <= 0) return k }
  return ds[ds.length - 1]![0]
}

type LoXo = { x: number; v: number; t: number; k: number; z: number }
type Ten = 'by' | 'sx' | 'sy' | 'br' | 'hr' | 'hx' | 'hy' | 'gx' | 'gy' | 'lid' | 'lidT' | 'lidP' | 'myT' | 'myP' | 'maT' | 'maP' | 'a1P' | 'a2P' | 'a1T' | 'a2T' | 'lac' | 'song' | 'kinh' | 'sao' | 'tia' | 'mp' | 'ma'
type Dich = Partial<Record<Ten, number>>
const gocNV = (n: NvGT4): Record<Ten, number> => ({ by: 0, sx: 1, sy: 1, br: 0, hr: 0, hx: 0, hy: 0, gx: 0.12, gy: 0.06, lid: n.lid, lidT: 0, lidP: 0, myT: 0, myP: 0, maT: n.ma0, maP: n.ma0,
  a1P: 10, a2P: -6, a1T: 12, a2T: -112, lac: 0, song: 0, kinh: 0, sao: 0, tia: 0, mp: 1, ma: 0.72 })
type Mieng = 'cuoi' | 'cuoiTo' | 'phang' | 'meo' | 'o' | 'ngap' | 'nhech' | 'hmm'
type Ban = 'mo' | 'chi' | 'cai' | 'but' | 'den'
type Mat = 'mo' | 'cong' | 'nham'

// ── nghe chung (một lần cho mọi giám thị) ──
const DS = new Set<Nguoi>()
let tayX = 0, tayY = 0, tayLuc = -1e9, lanBam = typeof performance !== 'undefined' ? performance.now() : 0
// NHƯỜNG KHUNG CHO LƯỢT CHẠM (27/10 MƯỢT, đo scripts/do-muot-hs.mjs): một khung giám thị chen giữa lượt chạm và lần vẽ phản hồi (nút lún, ô được chọn)
// là phản hồi chậm thêm một khung ⇒ em vừa chạm / gõ phím: giám thị nghỉ 320 ms (02/11: phủ trọn lượt chuyển câu ~170–190 ms ở CPU ×4; trước 140 ms).
let nhuongDen = 0
let quan: IntersectionObserver | null = null
let daNghe = false
function ngheChung(): void {
  if (daNghe || typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  daNghe = true
  const reTay = (e: PointerEvent) => { tayX = e.clientX; tayY = e.clientY; tayLuc = performance.now(); for (const g of DS) g.chay() }
  // 02/11 MƯỢT (hồ sơ «Tiếp tục» CPU ×4): mắt dõi CHUỘT (máy tính); chạm cảm ứng không dõi — trang cuộn về đầu câu mới làm mất đệm khung SVG ⇒ dõi ngón
  // sau chạm = đo lại bố cục mỗi khung giữa lượt dựng câu. Chạm đã có phản ứng «liếc ô em chọn».
  window.addEventListener('pointerdown', (e) => { const t = performance.now(); nhuongDen = t + 320; lanBam = t; if (e.pointerType === 'mouse') reTay(e) }, { capture: true, passive: true })
  window.addEventListener('keydown', () => { const t = performance.now(); nhuongDen = t + 320; lanBam = t }, { capture: true, passive: true })
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') reTay(e) }, { passive: true })
  const boHop = () => { for (const g of DS) g.hop = null }
  window.addEventListener('scroll', boHop, { capture: true, passive: true })
  window.addEventListener('resize', boHop, { passive: true })
  document.addEventListener('visibilitychange', () => { for (const g of DS) g.capNhatSong() })
  if (typeof IntersectionObserver !== 'undefined') quan = new IntersectionObserver((ds) => {
    for (const d of ds) for (const g of DS) if (g.vo === d.target) { g.hien = d.isIntersecting; g.hop = null; g.capNhatSong() }
  }, { rootMargin: '40px' })
}
const lauKhongBam = () => performance.now() - lanBam > 15000
const laGiam = () => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('may-yeu')
let soU = 0

type Fn = (this: Nguoi) => Promise<void>

// ───────────────── LÚC THI: đèn pha quét chậm ─────────────────
const vongThi: Fn = async function () {
  const n = this.n
  if (this.rm.ban !== 'den') {
    this.datBan('den'); this.datMieng('phang')
    this.dat({ a1P: 58, a2P: -4, tia: 1, lid: n.lid + 0.08, maT: n.ma0 + 4, maP: n.ma0 + 4, myT: 0, myP: 0, ma: 0.6, sao: 0 }, 140, 0.8)
    await this.ngu(700)
  } else { await this.ngu(rand(1200, 2000)); this.dat({ tia: 1, lid: n.lid + 0.08, maT: n.ma0 + 4, maP: n.ma0 + 4 }, 140, 0.8) } // sau lượt soi: đứng thêm rồi mới bật lại chùm sáng
  if (this.giam) { this.dat({ tia: 0 }); return } // máy yếu / giảm chuyển động: cầm đèn đứng yên, không chùm sáng tĩnh (tia soi khi chạm vẫn có — den-soi.ts)
  let phai = Math.random() < 0.5
  for (;;) {
    phai = !phai
    // 02/11 MƯỢT (đo màn thi CPU ×4: quét liên tục ⇒ phần vẽ sau mỗi lần chạm ô dài thêm ~15 ms): quay đèn gọn ~0,7 s rồi GIỮ yên 2,2–3,6 s
    // (không vẽ khung nào lúc giữ) — vẫn là soi đèn đi lại, nhưng số khung vẽ lại giảm ~¾.
    this.dat({ a1P: phai ? rand(80, 104) : rand(26, 48), a2P: rand(-8, 6) }, 36, 0.95)
    await this.ngu(rand(2900, 4300))
    if (Math.random() < 0.32) {
      this.dat({ lid: n.lid + 0.42, maT: n.ma0 + 10, maP: n.ma0 + 10, myT: 2, myP: 2 }, 260, 0.7); this.datMieng(this.muc === 'nb' ? 'hmm' : 'phang')
      await this.ngu(rand(650, 1100))
      this.dat({ lid: n.lid + 0.08, maT: n.ma0 + 4, maP: n.ma0 + 4, myT: 0, myP: 0 }, 200, 0.7)
    } else if (Math.random() < 0.3) await this.ngu(rand(500, 900))
  }
}

// ───────────────── ĐỘNG TÁC ĐỨNG CHỜ (nguyên bản vẽ; hình không tự nói) ─────────────────
const DT: Record<NhanRoi, Fn> = {
  async nhinDe() {
    const gx = rand(0.62, 0.95), gy = rand(-0.38, -0.05)
    this.dat({ gx, gy, hr: rand(2, 5) }, 130, 0.75)
    await this.ngu(rand(450, 750))
    const lan = randI(1, 3)
    for (let i = 0; i < lan; i++) {
      this.dat({ gx: gx - rand(0.28, 0.5), gy: gy + 0.08 }, 300, 0.8); await this.ngu(rand(240, 380))
      this.dat({ gx, gy: gy + rand(0, 0.12) }, 260, 0.8); await this.ngu(rand(380, 700))
    }
    if (Math.random() < 0.45) { this.dat({ hy: 2.5 }, 300, 0.6); await this.ngu(170); this.dat({ hy: 0 }, 220, 0.6); await this.ngu(240) }
  },
  async daoMat() {
    const lan = randI(2, 3)
    let gx0 = this.s.gx.t
    for (let i = 0; i < lan; i++) {
      let gx = rand(-0.95, 0.95); if (Math.abs(gx - gx0) < 0.5) gx = -Math.sign(gx0 || 1) * rand(0.5, 0.95); gx0 = gx
      this.dat({ gx, gy: rand(-0.5, 0.45), hr: gx * rand(2, 4) }, rand(220, 340), 0.78)
      await this.ngu(rand(420, 900))
      if (Math.random() < 0.35) this.nhay()
    }
    if (Math.random() < 0.5) { this.dat({ gx: 0, gy: 0.02, hr: 0 }, 200, 0.8); await this.ngu(rand(500, 800)) }
  },
  async nghieng() {
    const s = Math.random() < 0.5 ? -1 : 1
    this.dat({ hr: s * rand(7, 10), hx: s * 2, gx: s * 0.3, gy: -0.1, [s > 0 ? 'myT' : 'myP']: -4.5, br: s * 1.2 }, 140, 0.55)
    this.datMieng(this.muc === 'vdc' ? 'phang' : Math.random() < 0.5 ? 'hmm' : 'o')
    await this.ngu(rand(900, 1500))
    if (Math.random() < 0.4) { this.nhay(); await this.ngu(rand(250, 400)) }
  },
  async lac() {
    const nb = this.muc === 'nb'
    this.dat({ gx: -0.35, gy: 0.55, a1T: 16 }, 200, 0.7)
    await this.ngu(240)
    const lan = nb ? 4 : 5
    for (let i = 0; i < lan; i++) {
      const s = i % 2 ? 1 : -1
      this.dat({ lac: s * (nb ? rand(9, 13) : rand(11, 16)), a1T: 16 + s * 3, a2T: -112 + (nb ? s * 4 : 0) }, nb ? 260 : 420, 0.5)
      await this.ngu(nb ? rand(170, 230) : rand(110, 150))
    }
    this.dat({ lac: 0, a1T: 12, a2T: -112 }, 170, 0.6)
    await this.ngu(rand(500, 800))
    if (Math.random() < 0.5) { this.dat({ gx: 0.3, gy: 0, myT: -2, myP: -2 }, 200); this.datMieng(this.muc === 'nb' ? 'cuoi' : 'hmm'); await this.ngu(rand(400, 700)) }
  },
  async kinh() {
    if (this.muc === 'nb') {
      for (let i = 0; i < 2; i++) {
        this.dat({ myT: -6, myP: -6, kinh: -7 }, 520, 0.45); this.datMieng('o'); await this.ngu(150)
        this.dat({ myT: 0, myP: 0, kinh: 0 }, 260, 0.5); await this.ngu(rand(200, 300))
      }
      this.datMieng('cuoi'); await this.ngu(400)
      return
    }
    this.datBan('chi')
    this.dat({ a1P: 150, a2P: 55, gx: 0.05, gy: -0.05 }, 210, 0.72)
    await this.ngu(rand(300, 380))
    this.nhay()
    this.dat({ kinh: -3.4, lid: Math.max(0, this.n.lid - 0.06) }, 520, 0.55)
    await this.ngu(rand(160, 220))
    this.dat({ kinh: 0 }, 180, 0.6)
    await this.ngu(rand(140, 220))
    this.dat({ a1P: 10, a2P: -6 }, 150, 0.72)
    await this.ngu(260); this.datBan('mo'); await this.ngu(rand(250, 450))
  },
  async goBut() {
    this.datBan('but')
    this.dat({ a1P: -12, a2P: -86, gx: -0.32, gy: 0.8, hr: -2 }, 170, 0.72)
    await this.ngu(rand(380, 460))
    const lan = randI(3, 5)
    for (let i = 0; i < lan; i++) {
      this.dat({ a2P: -96 }, 640, 0.5); await this.ngu(rand(90, 120))
      this.dat({ a2P: -86 }, 640, 0.5); await this.ngu(i === 1 && Math.random() < 0.5 ? rand(380, 600) : rand(140, 200))
    }
    if (Math.random() < 0.5) { this.dat({ gx: 0.5, gy: -0.1 }, 220); await this.ngu(rand(300, 500)) }
    this.dat({ a1P: 10, a2P: -6, hr: 0 }, 150, 0.72)
    await this.ngu(280); this.datBan('mo'); await this.ngu(rand(250, 400))
  },
  async ngap() {
    this.dat({ hr: -5, hy: -2.5, myT: -4, myP: -4, sy: 1.025, sx: 0.99, a1T: 18, gy: -0.3 }, 90, 0.7)
    this.datMat('nham'); this.datMieng('o')
    await this.ngu(260)
    this.datMieng('ngap')
    await this.ngu(rand(850, 1150))
    this.datMieng('o'); this.dat({ hr: 2, hy: 0, sy: 1, sx: 1, myT: 0, myP: 0, a1T: 12 }, 120, 0.6)
    await this.ngu(220); this.datMat('mo'); this.datMieng(this.n.mieng)
    this.nhay(); await this.ngu(240); this.nhay()
    await this.ngu(rand(500, 800))
  },
  async nheo() {
    const s = Math.random() < 0.5 ? -1 : 1
    this.dat({ lid: this.n.lid + 0.4, maT: this.n.ma0 + 9, maP: this.n.ma0 + 9, myT: 2, myP: 2, gx: s * rand(0.4, 0.7), gy: rand(0.1, 0.4), hr: s * 2 }, 220, 0.7)
    this.datMieng('phang')
    await this.ngu(rand(850, 1350))
    if (Math.random() < 0.5) { this.dat({ gx: -s * 0.5 }, 200, 0.7); await this.ngu(rand(500, 800)) }
  },
  async nhun() {
    this.dat({ sy: 0.94, sx: 1.04, by: 1 }, 480, 0.55); await this.ngu(110)
    this.dat({ sy: 1.04, sx: 0.97, by: -7, hr: rand(-3, 3) }, 300, 0.5); await this.ngu(170)
    this.dat({ sy: 0.96, sx: 1.03, by: 0 }, 380, 0.45); await this.ngu(140)
    this.dat({ sy: 1, sx: 1 }, 260, 0.5)
    if (Math.random() < 0.5) { this.datMieng('cuoiTo'); await this.ngu(500); this.datMieng('cuoi') }
    await this.ngu(rand(300, 500))
  },
}

// ───────────────── PHẢN ỨNG (nguyên bản vẽ; lời do màn gọi `noi`) ─────────────────
type DiemMan = { x: number; y: number } | undefined
const PU: { [K in PhanUngGT]: (this: Nguoi, d?: DiemMan) => Promise<void> } = {
  async chon(d) {
    this.khoaMat = true
    const g = d ? this.huong(d.x, d.y, 120) : { gx: 0.55, gy: 0.78 }
    this.dat({ gx: g.gx, gy: g.gy, hr: g.gx * 3, myT: -2.5, myP: -2.5, lid: this.n.lid * 0.6 }, 380, 0.72)
    if (this.muc === 'vdc') this.dat({ myP: -5, myT: 1, lidT: 0.1 }, 380, 0.72)
    this.datMieng(this.muc === 'nb' ? 'o' : 'hmm')
    await this.ngu(rand(360, 480)); this.nhay()
    await this.ngu(rand(480, 800))
    this.dat({ hy: 1.8 }, 300, 0.6); await this.ngu(170); this.dat({ hy: 0 }, 220, 0.6)
    await this.ngu(rand(320, 600))
  },
  // bấm Kiểm tra (không vội): cúi nhìn ô đã chọn, gật nhẹ
  async nop(d) {
    this.khoaMat = true
    const g = d ? this.huong(d.x, d.y, 120) : { gx: 0.55, gy: 0.78 }
    this.dat({ gx: g.gx, gy: g.gy, hy: 1.5, lid: this.n.lid + 0.12 }, 300, 0.72); this.datMieng('phang')
    await this.ngu(rand(900, 1400))
  },
  async voi(d) {
    this.khoaMat = true
    const g = d ? this.huong(d.x, d.y, 120) : { gx: 0.55, gy: 0.78 }
    this.dat({ gx: g.gx, gy: g.gy, lidT: 0.26, myP: -5.5, myT: 2.5, maT: this.n.ma0 + 9, hr: -3 }, 420, 0.65)
    this.datMieng('hmm')
    await this.ngu(420)
    this.dat({ maT: 12, maP: 12, myT: 2.5, myP: 2.5, lidT: 0.12, lidP: 0.12 }, 300, 0.7); this.datMieng('meo')
    await this.ngu(240)
    this.chiDe()
    await this.ngu(520)
    for (let i = 0; i < 2; i++) { this.dat({ a1P: 91 }, 620, 0.5); await this.ngu(140); this.dat({ a1P: 100 }, 620, 0.5); await this.ngu(170) }
    await this.ngu(rand(900, 1200))
  },
  async sai() {
    this.khoaMat = true
    this.dat({ by: -2.5, sy: 1.03 }, 520, 0.5)
    this.dat({ maT: 10, maP: 10, myT: 2, myP: 2, lid: this.n.lid + 0.1, gy: 0.25, gx: 0.1 }, 280, 0.7); this.datMieng('meo')
    await this.ngu(140); this.dat({ by: 0, sy: 1 }, 260, 0.55)
    await this.ngu(rand(240, 340))
    for (const s of [-1, 1]) { this.dat({ hr: s * 4 }, 440, 0.5); await this.ngu(150) }
    this.dat({ hr: 0 }, 300, 0.6)
    this.chiDe()
    await this.ngu(620)
    this.dat({ a1P: 93 }, 580, 0.5); await this.ngu(160); this.dat({ a1P: 100 }, 580, 0.5)
    await this.ngu(rand(900, 1200))
  },
  async saiLien() {
    this.khoaMat = true
    this.dat({ maT: 14, maP: 14, myT: 3, myP: 3, lid: this.n.lid + 0.16, gy: 0.2 }, 300, 0.7); this.datMieng('meo')
    for (const s of [-1, 1, -1]) { this.dat({ hr: s * 5, gx: -s * 0.2 }, 460, 0.5); await this.ngu(160) }
    this.dat({ hr: 0, gx: 0.1 }, 300, 0.6)
    if (this.muc === 'vd' || this.muc === 'vdc') { // ghi sổ: gõ bút vào bảng kẹp / sổ
      this.datBan('but'); this.dat({ a1P: -12, a2P: -86, gx: -0.32, gy: 0.8 }, 190, 0.72)
      await this.ngu(420)
      for (let i = 0; i < 4; i++) { this.dat({ a2P: i % 2 ? -86 : -98, a1P: -12 + (i % 2) * 3 }, 520, 0.55); await this.ngu(130) }
      this.dat({ a1P: 10, a2P: -6 }, 160, 0.72); await this.ngu(260); this.datBan('mo')
    } else {
      this.chiDe(); await this.ngu(560)
      for (let i = 0; i < 2; i++) { this.dat({ a1P: 90 }, 620, 0.5); await this.ngu(140); this.dat({ a1P: 100 }, 620, 0.5); await this.ngu(170) }
    }
    await this.ngu(rand(900, 1200))
  },
  async dung() { await khen.call(this, false) },
  async dungLien() { await khen.call(this, true) },
  async choc() {
    this.khoaMat = true
    this.dat({ sy: 0.9, sx: 1.06, by: 2 }, 520, 0.5); await this.ngu(90)
    this.dat({ sy: 1.06, sx: 0.96, by: -6, gx: 0, gy: 0.05, myT: -5, myP: -5 }, 320, 0.5)
    this.datMieng(this.muc === 'vdc' ? 'hmm' : 'o')
    await this.ngu(200); this.dat({ sy: 1, sx: 1, by: 0 }, 300, 0.5)
    await this.ngu(240)
    if (this.muc === 'vdc' || this.muc === 'vd') { this.dat({ lidT: 0.9 }, 400, 0.7); this.datMieng('nhech'); await this.ngu(380); this.dat({ lidT: 0 }, 300, 0.7) }
    else { this.datMat('cong'); this.datMieng('cuoiTo'); this.dat({ ma: 1 }, 200); await this.ngu(600); this.datMat('mo') }
    await this.ngu(400)
  },
  // lúc thi, em rời màn rồi quay lại: hạ đèn về phía em, nheo mắt, gõ nhẹ đèn (lời do màn gọi)
  async roi() {
    this.khoaMat = true
    const n = this.n
    this.dat({ a1P: 16, a2P: -4, gx: 0, gy: 0.06, hr: 0 }, 150, 0.8)
    this.dat({ lid: n.lid + 0.36, maT: n.ma0 + 13, maP: n.ma0 + 13, myT: 2.5, myP: 2.5 }, 280, 0.7); this.datMieng('meo')
    await this.ngu(380)
    for (let i = 0; i < 2; i++) { this.dat({ a2P: 14 }, 520, 0.5); await this.ngu(140); this.dat({ a2P: -4 }, 520, 0.5); await this.ngu(170) }
    await this.ngu(2200)
    this.dat({ lid: n.lid + 0.08, maT: n.ma0 + 4, maP: n.ma0 + 4, myT: 0, myP: 0 }, 200, 0.7); this.datMieng('phang')
  },
}
async function khen(this: Nguoi, lien: boolean): Promise<void> {
  this.khoaMat = true
  const k = this.muc, gia = k === 'vdc'
  this.dat({ sy: 0.93, sx: 1.04, by: 1.5 }, 520, 0.55); this.dat({ gx: 0, gy: -0.05, hr: 0 }, 300, 0.7)
  await this.ngu(90)
  const nhay = !gia && (lien || k === 'nb')
  this.dat({ sy: 1.05, sx: 0.97, by: nhay ? (lien ? -13 : -7) : 0 }, 300, 0.5)
  this.datBan('cai'); this.dat({ a1P: 35, a2P: 130 }, 260, 0.55)
  if (gia) { this.datMieng(lien ? 'cuoi' : 'nhech'); this.dat({ lidT: 0.88, lidP: 0, lid: 0.12, myT: 2, myP: -3.5, ma: 1, maT: 0, maP: 0 }, 300, 0.7) }
  else { this.datMat(k === 'vd' && !lien ? 'mo' : 'cong'); this.datMieng(k === 'vd' && !lien ? 'cuoi' : 'cuoiTo'); this.dat({ ma: 1, myT: -3, myP: -3, lid: 0, maT: -2, maP: -2 }, 300, 0.7) }
  this.dat({ sao: 1 }, 220, 0.5)
  await this.ngu(lien ? 260 : 200)
  this.dat({ by: 0, sy: 1, sx: 1 }, 320, 0.45)
  for (let i = 0; i < 2; i++) { this.dat({ hy: 4.5, gy: 0.25 }, 430, 0.55); await this.ngu(160); this.dat({ hy: -1, gy: 0 }, 430, 0.55); await this.ngu(170) }
  if (lien && !gia) {
    this.dat({ sy: 0.93, sx: 1.04, by: 1.5 }, 520, 0.55); await this.ngu(90)
    this.dat({ sy: 1.05, sx: 0.97, by: -10, hr: -4 }, 300, 0.5); await this.ngu(220)
    this.dat({ by: 0, sy: 1, sx: 1, hr: 0 }, 320, 0.45)
  }
  this.dat({ hy: 0 }, 300, 0.6)
  await this.ngu(rand(800, 1100))
  this.dat({ sao: 0 }, 140, 0.7)
  if (gia) this.dat({ lidT: 0 }, 300, 0.7)
  await this.ngu(200)
}
// lúc thi: em chạm ô ⇒ đèn quay sang soi đúng ô ấy (không bàn về câu). Tia trong hình tắt lúc soi — màn thi vẽ tia chính xác tới ô (den-soi.ts).
/** Góc tay đèn để soi điểm `d` + tâm kính đèn ở góc ấy (toạ độ màn). Vai phải (33, −92), kính cách vai 25 + 27 + 21,4 theo tay (a2P = 0). */
function gocSoi(p: Nguoi, d: { x: number; y: number }): { th: number; kinh: { x: number; y: number } } {
  const r = p.svg.getBoundingClientRect(), sc = r.width / VB.w
  const vx = r.left + (33 * TL - VB.x) * sc, vy = r.top + (-92 * TL - VB.y) * sc
  const th = kep((Math.atan2(d.x - vx, d.y - vy) * 180) / Math.PI, 8, 125), L = 73.4 * TL * sc, a = (th * Math.PI) / 180
  return { th, kinh: { x: vx + L * Math.sin(a), y: vy + L * Math.cos(a) } }
}
async function soi(this: Nguoi, d: { x: number; y: number }): Promise<void> {
  // 02/11 MƯỢT (đo màn thi CPU ×4: chuỗi quay tay rồi nheo mắt 2 nhịp ~1,7 s chồng lên lần chạm ô kế ⇒ phần vẽ sau chạm dài thêm ~15 ms): MỘT lượt —
  // tay + mắt + nheo cùng lúc (lò xo cứng, lắng ~0,3 s) rồi đứng yên.
  this.khoaMat = true
  const { th } = gocSoi(this, d), g = this.huong(d.x, d.y, 110)
  this.dat({ a1P: th, a2P: 0, tia: 0, gx: g.gx, gy: g.gy, lid: this.n.lid + 0.3, maT: this.n.ma0 + 8, maP: this.n.ma0 + 8 }, 220, 0.9) // tia màn thi vươn 260 ms từ kính ở dáng đích
  await this.ngu(rand(2200, 2800))
}

// MÁY YẾU / GIẢM CHUYỂN ĐỘNG (02/11, đo CPU ×6: chuỗi bước của phản ứng — mỗi bước vẽ lại cả hình — trùng lúc hiệu ứng ăn mừng ⇒ «Tiếp tục» / khung
// hiệu ứng chậm hơn bản cũ): như bản cũ, chỉ đổi MỘT dáng tĩnh theo cảm xúc, giữ ~1,4 s rồi về dáng thường (2 lần vẽ cho mỗi phản ứng).
function dangTinh(p: Nguoi, loai: PhanUngGT, d?: DiemMan): Dich & { mieng?: Mieng; ban?: Ban; mat?: Mat } {
  const n = p.n
  switch (loai) {
    case 'chon': case 'nop': { const g = d ? p.huong(d.x, d.y, 120) : { gx: 0.55, gy: 0.78 }; return { gx: g.gx, gy: g.gy, lid: n.lid * 0.6, mieng: p.muc === 'nb' ? 'o' : 'hmm' } }
    case 'voi': case 'sai': case 'saiLien': return { ban: 'chi', a1P: 100, a2P: 6, gx: 0.9, gy: -0.3, hr: 4, maT: n.ma0 + 10, maP: n.ma0 + 10, myT: 2, myP: 2, lid: n.lid + 0.1, mieng: 'meo' }
    case 'dung': case 'dungLien': return p.muc === 'vdc'
      ? { ban: 'cai', a1P: 35, a2P: 130, ma: 1, sao: 1, lidT: 0.88, myP: -3.5, maT: 0, maP: 0, mieng: 'nhech' }
      : { ban: 'cai', a1P: 35, a2P: 130, ma: 1, sao: 1, myT: -3, myP: -3, lid: 0, maT: -2, maP: -2, mat: 'cong', mieng: 'cuoiTo' }
    case 'choc': return { mat: 'cong', mieng: 'cuoiTo', ma: 1 }
    case 'roi': return { a1P: 16, a2P: -4, gx: 0, gy: 0.06, lid: n.lid + 0.36, maT: n.ma0 + 13, maP: n.ma0 + 13, myT: 2.5, myP: 2.5, mieng: 'meo' }
  }
}
function chayPhanUng(p: Nguoi, loai: PhanUngGT, d?: DiemMan, xong?: (() => void) | null): void {
  if (p.giam) { const dich = dangTinh(p, loai, d); void p.lam(loai, async function () { this.khoaMat = true; this.dat(dich); await this.ngu(1400); this.dat({ sao: 0 }) }, xong); return }
  const f2 = PU[loai]
  void p.lam(loai, function () { return f2.call(this, d) }, xong)
}
// ───────────────── MỘT GIÁM THỊ (khai sau các bảng động tác / phản ứng mà nó gọi) ─────────────────
class Nguoi {
  readonly n: NvGT4
  readonly u: string
  readonly vo: HTMLDivElement
  readonly tho: HTMLDivElement
  readonly svg: SVGSVGElement
  khung: HTMLElement
  loiVao: HTMLElement | null
  readonly tinh: boolean
  readonly giam: boolean
  readonly goc: Record<Ten, number>
  readonly s = {} as Record<Ten, LoXo>
  readonly e: Record<string, Element> = {}
  readonly m: Record<string, Element> = {}
  readonly b: Record<string, Element> = {}
  readonly rm: { mieng?: Mieng; ban?: Ban; mat?: Mat } = {}
  readonly cache = new Map<string, string>()
  hop: { left: number; top: number; width: number; height: number } | null = null
  hien = true
  song = false
  dung = false
  thi = false
  khoaMat = false
  dangLam: string | null = null
  truoc: NhanRoi | null = null
  tenTT: TrangThaiGT = 'yen'
  tok = 0
  raf = 0
  last = 0
  ve30 = 0
  chopTu = -1e9
  hen = new Set<number>()
  hNR = 0
  hC = 0
  hLoi: number[] = []
  hNhuong = 0

  readonly muc: MucGT

  constructor(muc: MucGT, khung: HTMLElement, o: { tinh?: boolean; xam?: boolean; mo?: boolean; loiVao?: HTMLElement | null }) {
    this.muc = muc; this.n = NV_GT4[muc]; this.u = 'gm' + ++soU + '_'; this.khung = khung; this.loiVao = o.loiVao ?? null
    this.tinh = !!o.tinh; this.giam = !this.tinh && laGiam()
    khung.innerHTML = ''
    if (this.tinh) khung.classList.add('gt-tinh')
    if (o.xam) khung.classList.add('gt-xam')
    if (o.mo) khung.classList.add('gt-mo-nhat')
    const vo = document.createElement('div'); vo.className = 'gtm'; vo.dataset.muc = muc
    vo.style.setProperty('--tho', rand(3.4, 4.6).toFixed(2) + 's'); vo.style.setProperty('--tre', (-rand(0, 4)).toFixed(2) + 's')
    vo.innerHTML = `<div class="gtm-tho"><svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" aria-hidden="true" focusable="false">${veNguoi(muc, this.u)}</svg></div>`
    this.vo = vo; this.tho = vo.firstElementChild as HTMLDivElement; this.svg = vo.querySelector('svg')!
    this.svg.querySelectorAll<SVGElement>('[data-k]').forEach((el) => { this.e[el.dataset.k!] = el })
    this.svg.querySelectorAll<SVGElement>('[data-m]').forEach((el) => { this.m[el.dataset.m!] = el })
    this.svg.querySelectorAll<SVGElement>('[data-b]').forEach((el) => { this.b[el.dataset.b!] = el })
    this.goc = gocNV(this.n)
    for (const t in this.goc) { const v = this.goc[t as Ten]; this.s[t as Ten] = { x: v, v: 0, t: v, k: 170, z: 0.62 } }
    this.datMieng(this.n.mieng, true); this.datBan('mo'); this.datMat('mo')
    this.khung.appendChild(vo)
    this.ve(0)
    if (!this.tinh) {
      ngheChung()
      DS.add(this); quan?.observe(vo)
      vo.addEventListener('click', this.choc)
      this.capNhatSong()
    }
  }

  // ── trạng thái rời (miệng / bàn tay / kiểu mắt): bật đúng một hình ──
  datMieng(m: Mieng, ngay?: boolean): void {
    if (this.rm.mieng === m) return
    this.rm.mieng = m
    for (const t in this.m) this.m[t]!.setAttribute('display', t === m ? 'inline' : 'none')
    if (!ngay && !this.giam && !this.tinh) { const p = this.s.mp; p.x = 0.72; p.t = 1; p.k = 420; p.z = 0.45; this.chay() }
  }
  datBan(b: Ban): void { if (this.rm.ban === b) return; this.rm.ban = b; for (const t in this.b) this.b[t]!.setAttribute('display', t === b ? 'inline' : 'none') }
  datMat(m: Mat): void {
    this.rm.mat = m
    for (const b of ['T', 'P']) {
      this.e['mo' + b]?.setAttribute('opacity', m === 'mo' ? '1' : '0')
      this.e['cong' + b]?.setAttribute('opacity', m === 'cong' ? '1' : '0')
      this.e['nham' + b]?.setAttribute('opacity', m === 'nham' ? '1' : '0')
    }
    this.cache.delete('nhamT#o'); this.cache.delete('nhamP#o'); this.cache.delete('moT'); this.cache.delete('moP')
  }
  // ── đặt đích lò xo ──
  dat(p: Dich & { mieng?: Mieng; ban?: Ban; mat?: Mat }, k = 170, z = 0.62): void {
    for (const t in p) {
      if (t === 'mieng') { this.datMieng(p.mieng!); continue }
      if (t === 'ban') { this.datBan(p.ban!); continue }
      if (t === 'mat') { this.datMat(p.mat!); continue }
      const s = this.s[t as Ten], v = p[t as Ten]
      if (!s || v === undefined) continue
      s.t = v; s.k = k; s.z = z
      if (this.giam || this.tinh) { s.x = v; s.v = 0 }
    }
    if (this.giam || this.tinh) this.ve(performance.now()); else this.chay()
  }
  veGoc(k = 150, z = 0.7): void {
    const g: Dich = { ...this.goc }
    if (this.thi) Object.assign(g, { a1P: this.s.a1P.t, a2P: this.s.a2P.t, tia: 1, lid: this.n.lid + 0.08, maT: this.n.ma0 + 4, maP: this.n.ma0 + 4 })
    this.dat(g, k, z)
    this.datMieng(this.thi ? 'phang' : this.n.mieng); this.datMat('mo'); if (!this.thi) this.datBan('mo')
  }
  nhay(): void {
    if (this.rm.mat !== 'mo') return
    if (this.giam) { // máy yếu: chớp bằng đổi mắt (hai lần đổi thuộc tính, không rAF)
      this.datMat('nham')
      window.setTimeout(() => { if (this.rm.mat === 'nham' && !this.dangLam) this.datMat('mo') }, 120)
      return
    }
    this.chopTu = performance.now(); this.chay()
  }

  // ── vòng khung ──
  chay(): void { if (this.raf || !this.song || this.tinh || this.giam || this.dung) return; this.last = performance.now(); this.raf = requestAnimationFrame(this.khungVe) }
  khungVe = (now: number): void => {
    this.raf = 0
    if (!this.song || this.dung) return
    if (now < nhuongDen) { // em vừa chạm: nhường khung cho phản hồi nút / chuyển câu — ngủ MỘT hẹn giờ tới hết lượt nhường (không thức mỗi khung)
      this.raf = -1; this.hNhuong = window.setTimeout(() => { this.raf = 0; this.last = performance.now(); this.chay() }, nhuongDen - now + 1); return
    }
    const tay = now - tayLuc < 1400 && !this.khoaMat && this.hien && !this.thi
    const chop = now - this.chopTu < 180
    // ~30 khung/giây (28/10 MƯỢT: 60 khung/giây giữ luồng chính bận gần trọn mỗi khung ở CPU ×4); lò xo vẫn tích phân bước nhỏ theo thời gian thật.
    // lúc thi đèn quét chậm (lò xo mềm) ⇒ ~15 khung/giây là đủ mượt; em làm bài cả ca nên bớt nửa số lần vẽ (02/11, đo màn thi CPU ×4)
    const cach = this.thi && !this.khoaMat && this.dangLam === 'thi' ? 66 : 30
    if (now - this.ve30 < cach && this.ve30) {
      if (cach > 30) { this.raf = -1; this.hNhuong = window.setTimeout(() => { this.raf = this.song && !this.dung ? requestAnimationFrame(this.khungVe) : 0 }, cach - (now - this.ve30) - 8); return } // ngủ tới khung kế, không thức mỗi khung
      this.raf = requestAnimationFrame(this.khungVe); return
    }
    const dt = Math.min(0.1, Math.max(0.001, (now - this.last) / 1000)); this.last = now; this.ve30 = now
    if (tay) this.theoTay()
    if (this.thi && !this.khoaMat) {
      const th = ((this.s.a1P.x + this.s.a2P.x) * Math.PI) / 180, gx = this.s.gx, gy = this.s.gy
      gx.t = Math.sin(th) * 0.95; gy.t = Math.cos(th) * 0.85; gx.k = gy.k = 120; gx.z = gy.z = 0.8
    }
    let yen = true
    const so = Math.max(1, Math.ceil(dt * 120))
    for (let i = 0; i < so; i++) yen = this.buoc(dt / so)
    this.ve(now)
    if (!yen || chop || tay) this.raf = requestAnimationFrame(this.khungVe)
  }
  buoc(dt: number): boolean {
    const s = this.s
    s.song.t = -s.lac.x * 1.15 - s.lac.v * 0.035; s.song.k = 70; s.song.z = 0.28
    let yen = true
    for (const t in s) {
      const p = s[t as Ten]
      const c = 2 * Math.sqrt(p.k) * p.z
      p.v += (p.k * (p.t - p.x) - c * p.v) * dt; p.x += p.v * dt
      if (Math.abs(p.t - p.x) < 0.004 && Math.abs(p.v) < 0.03) { p.x = p.t; p.v = 0 } else yen = false
    }
    return yen
  }
  chop(now: number): number { const t = now - this.chopTu; if (t < 0 || t > 170) return 0; if (t < 62) return t / 62; if (t < 84) return 1; return 1 - (t - 84) / 86 }
  tf(k: string, v: string): void { if (this.cache.get(k) !== v) { this.cache.set(k, v); this.e[k]?.setAttribute('transform', v) } }
  op(k: string, v: string): void { const kk = k + '#o'; if (this.cache.get(kk) !== v) { this.cache.set(kk, v); this.e[k]?.setAttribute('opacity', v) } }
  ve(now: number): void {
    const x = {} as Record<Ten, number>
    for (const t in this.s) x[t as Ten] = this.s[t as Ten].x
    const gx = kep(x.gx, -1.2, 1.2), gy = kep(x.gy, -1.2, 1.2)
    this.tf('goc', `translate(0 ${f(x.by)}) scale(${f3(x.sx)} ${f3(x.sy)})`)
    const cao = Math.max(0, -x.by), sb = kep(1 - cao / 60, 0.55, 1.1)
    this.tf('bong', `scale(${f3(sb * x.sx)} 1)`); this.op('bong', f3(kep(1 - cao / 90, 0.4, 1)))
    this.tf('than', `rotate(${f(x.br)} 0 -24)`)
    this.tf('dau', `translate(${f(x.hx + gx * 1.6)} ${f(x.hy + gy * 1.3)}) rotate(${f(x.hr + gx * 2.4)} 0 -100)`)
    this.tf('mat', `translate(${f(gx * 4.2)} ${f(gy * 2.8)})`)
    this.tf('tocT', `translate(${f(gx * 1.8)} ${f(gy * 0.9)})`)
    this.tf('tai', `translate(${f(-gx * 2.2)} 0)`)
    this.tf('kinh', `translate(${f(gx * 3.8)} ${f(gy * 2.6 + x.kinh)})`)
    const b = this.chop(now)
    for (const [ben, lx] of [['T', x.lidT], ['P', x.lidP]] as const) {
      this.tf('con' + ben, `translate(${f(gx * 5)} ${f(gy * 5.2)})`)
      const L = kep(x.lid + lx, 0, 1)
      this.tf('mi' + ben, `translate(0 ${f(-19.5 + L * 36)})`)
      if (this.rm.mat === 'mo') { this.tf('mo' + ben, `scale(1 ${f3(1 - 0.92 * b)})`); this.op('nham' + ben, f3(kep((b - 0.55) / 0.45, 0, 1))) }
    }
    const my = this.n.mayY
    this.tf('mayT', `translate(${-MAT_X} ${f(my + x.myT)}) rotate(${f(x.maT)})`)
    this.tf('mayP', `translate(${MAT_X} ${f(my + x.myP)}) rotate(${f(-x.maP)})`)
    this.tf('mieng', `translate(0 ${this.n.miengY}) scale(${f3(x.mp)})`)
    this.op('ma', f3(kep(x.ma, 0, 1)))
    this.tf('tayP', `translate(33 -92) rotate(${f(-x.a1P)})`); this.tf('khuyuP', `translate(0 25) rotate(${f(-x.a2P)})`)
    this.tf('tayT', `translate(-33 -92) rotate(${f(x.a1T)})`); this.tf('khuyuT', `translate(0 25) rotate(${f(x.a2T)})`)
    this.tf('vat', `rotate(${f(-(x.a1T + x.a2T) + x.lac)})`)
    if (this.e.song) this.tf('song', `rotate(${f(x.song)} 0 ${this.muc === 'th' ? 8 : 16})`)
    const sv = kep(x.sao, 0, 1.3)
    this.op('sao', f3(kep(x.sao, 0, 1))); this.tf('sao', `translate(0 -150) scale(${f3(0.55 + 0.45 * sv)}) rotate(${f(sv * 12)}) translate(0 150)`)
    if (this.e.tia) this.op('tia', f3(kep(x.tia, 0, 1)))
  }
  // ── mắt dõi theo tay / nhìn một điểm (khung SVG đo một lần, bỏ đệm khi cuộn / đổi cỡ / khuất / đổi chỗ) ──
  diemMat(): { x: number; y: number; sc: number } {
    const r = this.hop ?? (this.hop = hopHinh(this.svg))
    return { x: r.left + ((0 - VB.x) / VB.w) * r.width, y: r.top + ((MAT_Y * TL - VB.y) / VB.h) * r.height, sc: r.width / VB.w }
  }
  huong(px: number, py: number, xa = 170): { gx: number; gy: number } {
    const c = this.diemMat(), dx = px - c.x, dy = py - c.y, d = Math.hypot(dx, dy) || 1, kk = Math.min(1, d / xa)
    return { gx: (dx / d) * kk, gy: (dy / d) * kk * 0.9 }
  }
  theoTay(): void { const g = this.huong(tayX, tayY), s = this.s; s.gx.t = g.gx; s.gy.t = g.gy; s.gx.k = s.gy.k = 150; s.gx.z = s.gy.z = 0.72 }
  // ── hẹn giờ có huỷ ──
  ngu(ms: number): Promise<void> {
    const tok = this.tok
    return new Promise((res, rej) => { const id = window.setTimeout(() => { this.hen.delete(id); if (tok === this.tok) res(); else rej(HUY) }, ms); this.hen.add(id) })
  }
  huyLam(): void { this.tok++; for (const id of this.hen) clearTimeout(id); this.hen.clear() }
  async lam(ten: string, fn: Fn, xong?: (() => void) | null): Promise<void> {
    this.huyLam(); const tok = this.tok
    this.dangLam = ten; this.khoaMat = false
    try { await fn.call(this) } catch (e) { if (e !== HUY) console.error(e); return }
    if (tok !== this.tok) return
    this.dangLam = null; this.khoaMat = false
    if (xong) xong()
    if (tok !== this.tok) return // `xong` đã đặt việc khác
    if (this.thi && ten !== 'thi') { void this.lam('thi', vongThi); return }
    if (!this.thi) { this.veGoc(); this.tenTT = 'yen' }
    this.henNhanRoi()
  }
  // ── sống / nghỉ (khuất khỏi màn / tab ẩn / tamDung ⇒ nghỉ hết) ──
  capNhatSong(): void {
    const b = !this.tinh && this.hien && !this.dung && typeof document !== 'undefined' && !document.hidden
    if (b === this.song) return
    this.song = b
    this.vo.toggleAttribute('data-nghi', !b)
    if (b) { this.henChop(); if (this.thi) void this.lam('thi', vongThi); else if (!this.dangLam) this.henNhanRoi() }
    else { this.huyLam(); clearTimeout(this.hNR); clearTimeout(this.hC); clearTimeout(this.hNhuong); if (this.raf > 0) cancelAnimationFrame(this.raf); this.raf = 0; this.dangLam = null; this.khoaMat = false }
  }
  henChop(): void {
    clearTimeout(this.hC); if (!this.song) return
    const d = this.giam ? rand(4200, 8000) : rand(1700, 5400)
    this.hC = window.setTimeout(() => { this.nhay(); if (!this.giam && Math.random() < 0.22) window.setTimeout(() => this.nhay(), rand(190, 270)); this.henChop() }, d)
  }
  henNhanRoi(): void {
    clearTimeout(this.hNR); if (!this.song || this.giam || this.thi) return
    this.hNR = window.setTimeout(() => this.nhanRoi(), rand(1300, 3900) * this.n.nhip)
  }
  nhanRoi(): void {
    if (this.dangLam) { this.henNhanRoi(); return }
    const lau = lauKhongBam()
    const ds = (Object.entries(this.n.nhanRoi) as [NhanRoi, number][]).filter(([t]) => t !== this.truoc && (t !== 'ngap' || lau)).map(([t, w]) => [t, t === 'ngap' ? w * 2.2 : w] as [NhanRoi, number])
    if (!ds.length) { this.henNhanRoi(); return }
    const ten = chonTS(ds)
    this.truoc = ten
    void this.lam(ten, DT[ten])
  }
  // ── chỉ vào đề (đề nằm bên phải giám thị) ──
  chiDe(): void { this.datBan('chi'); this.dat({ a1P: 100, a2P: 6, gx: 0.9, gy: -0.3, hr: 4 }, 230, 0.6) }
  choc = (): void => {
    if (this.tinh || this.thi) return
    try { rung('chon') } catch { /* máy không rung */ }
    chayPhanUng(this, 'choc')
  }
  batThi(bat: boolean): void {
    if (bat === this.thi) return
    this.thi = bat
    this.vo.toggleAttribute('data-thi', bat)
    if (bat) { if (this.tinh) { this.datBan('den'); this.dat({ a1P: 58, a2P: -4, tia: 1, lid: this.n.lid + 0.08, maT: this.n.ma0 + 4, maP: this.n.ma0 + 4, ma: 0.6 }); this.datMieng('phang'); return } void this.lam('thi', vongThi) }
    else { this.huyLam(); this.dangLam = null; this.dat({ tia: 0 }, 200, 0.9); this.veGoc(); this.henNhanRoi() }
  }
  xoaLoi(): void {
    this.hLoi.forEach((x) => { clearTimeout(x); clearInterval(x) }); this.hLoi = []
    ;(this.loiVao ?? this.khung).querySelectorAll(':scope > .gt-loi').forEach((e) => e.remove())
  }
}

/** Hộp của phần tử theo TRỤC CỦA HÌNH (11/11 tối): màn đang xoay hình 90° bằng CSS (`[data-xoay]`, Bình Phản Ứng lúc live — iPhone cầm ngang, màn câu hỏi xoay
 *  y như bảng) ⇒ đổi trục: x hình = y màn, y hình = bề ngang màn − x màn. Không xoay ⇒ đúng `getBoundingClientRect()`. Mắt / tay giám thị đo theo trục này. */
export function hopHinh(el: Element): { left: number; top: number; width: number; height: number } {
  const r = el.getBoundingClientRect()
  return el.closest('[data-xoay]') ? { left: r.top, top: window.innerWidth - r.right, width: r.height, height: r.width } : r
}
const tamCua = (el: Element) => { const r = hopHinh(el); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
const PU_THEO_TT: Partial<Record<TrangThaiGT, PhanUngGT>> = { 'nghi-ngo': 'voi', nop: 'nop', dung: 'dung', combo: 'dungLien', sai: 'sai', xong: 'dungLien' }
const DT_THEO_TT: Partial<Record<TrangThaiGT, NhanRoi>> = { doc: 'nhinDe', cho: 'ngap', soi: 'nheo', 'dong-ho': 'nheo', 'chua-tinh': 'nghieng' }

export function taoGiamThi(khung: HTMLElement, o: { muc: MucGT; tinh?: boolean; xam?: boolean; mo?: boolean; trangThai?: TrangThaiGT; buoc?: number; loiVao?: HTMLElement | null; den?: boolean }): GiamThi {
  const p = new Nguoi(o.muc, khung, o)
  const gt: GiamThi = {
    muc: o.muc, svg: p.svg,
    datTrangThai(ten, oo = {}) {
      p.tenTT = ten
      const xong = oo.xong ?? null
      if (p.tinh || p.thi || !p.song) { // hình tĩnh / đang thi (đèn) / đang nghỉ: không đổi dáng, vẫn báo xong
        if (p.tinh && ten !== 'yen') { const pu = PU_THEO_TT[ten]; if (pu === 'dung' || pu === 'dungLien') { p.datBan('cai'); p.datMat('cong'); p.datMieng('cuoiTo'); p.dat({ a1P: 35, a2P: 130, ma: 1 }) } }
        if (xong) window.setTimeout(xong, 0)
        return gt
      }
      if (ten === 'yen') { p.huyLam(); p.dangLam = null; p.khoaMat = false; p.veGoc(); p.henNhanRoi(); if (xong) window.setTimeout(xong, 0); return gt }
      const pu = ten === 'sai' && oo.lien ? 'saiLien' : PU_THEO_TT[ten]
      if (pu) { chayPhanUng(p, pu, undefined, xong); return gt }
      const dt = DT_THEO_TT[ten]
      if (dt && p.giam) { p.veGoc(); if (xong) window.setTimeout(xong, 0) } // máy yếu: không động tác đứng chờ
      else if (dt) { p.truoc = dt; void p.lam(dt, DT[dt], xong) }
      return gt
    },
    trangThai: () => p.tenTT,
    nhin(nx, ny) {
      if (p.thi) return gt
      p.dat({ gx: kep(+nx || 0, -1, 1), gy: kep(+ny || 0, -1, 1) }, 220, 0.75)
      return gt
    },
    nhinVao(el) {
      if (!el) return gt.nhin(0, 0)
      if (p.thi) return gt
      const c = tamCua(el), g = p.huong(c.x, c.y, 120)
      p.dat({ gx: g.gx, gy: g.gy }, 220, 0.75)
      return gt
    },
    phanUng(loai, oo = {}) {
      if (p.tinh || !p.song) return gt
      if (loai === 'roi') { if (!p.thi) p.batThi(true); chayPhanUng(p, 'roi'); return gt }
      if (p.thi) return gt // lúc thi: không phản ứng về câu
      chayPhanUng(p, loai, oo.diem)
      return gt
    },
    datThi(bat) { p.batThi(bat); return gt },
    soiVao(el) {
      if (!el || !p.thi || p.tinh) return null
      const d = tamCua(el), dich = gocSoi(p, d)
      // máy yếu (02/11, đo màn thi CPU ×6: chuỗi 5 bước quay đèn chồng lên lần chạm kế ⇒ chạm / «Câu tiếp» chậm hơn bản cũ): quay đèn MỘT bước, giữ hướng
      if (p.song && !p.giam) void p.lam('soi', function () { return soi.call(this, d) })
      else { p.huyLam(); p.dangLam = null; p.datBan('den'); p.dat({ a1P: dich.th, a2P: 0, tia: 0 }) }
      return dich.kinh
    },
    noi(chu, oo = {}) {
      p.xoaLoi()
      if (!chu) return gt
      const vao = p.loiVao ?? p.khung
      const el = document.createElement('div'); el.className = 'gt-loi'; el.setAttribute('role', 'status'); el.dataset.muc = o.muc
      if (oo.cam) el.dataset.cam = oo.cam
      const da = document.createElement('span'), con = document.createElement('span'); con.className = 'an'
      el.append(da, con)
      const lech = vao === p.khung ? 0 : p.khung.getBoundingClientRect().left - vao.getBoundingClientRect().left
      el.style.setProperty('--gt-loi-duoi', Math.max(14, lech + p.khung.clientWidth * 0.5 - 7).toFixed(1) + 'px')
      vao.appendChild(el)
      const goChu = !p.tinh && !p.giam && !p.dung
      if (goChu) con.textContent = chu; else da.textContent = chu
      coVuaChu(el) // khung vừa dòng chữ dài nhất (đo lúc đủ chữ — phần gõ dần giữ chỗ bằng chữ ẩn)
      if (p.tinh) return gt
      if (typeof el.animate === 'function') el.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.05)', offset: 0.65 }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' })
      if (goChu) { // gõ từng chữ (giữ chỗ bằng phần chữ ẩn ⇒ bong bóng không đổi cỡ khi gõ)
        let i = 0
        const go = window.setInterval(() => { i++; da.textContent = chu.slice(0, i); con.textContent = chu.slice(i); if (i >= chu.length) clearInterval(go) }, 28)
        p.hLoi.push(go)
      }
      const giu = oo.giu ?? kep(1700 + chu.length * 50, 2300, 5200)
      p.hLoi.push(window.setTimeout(() => {
        if (typeof el.animate !== 'function') { el.remove(); return }
        const an = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) scale(.96)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' })
        an.onfinish = () => el.remove()
      }, giu + (goChu ? chu.length * 28 : 0)))
      return gt
    },
    tamDung(d) {
      if (d === p.dung || p.tinh) return
      p.dung = d
      p.khung.classList.toggle('gt-dung', d)
      p.capNhatSong()
    },
    doiCho(moi, loiVao) {
      p.xoaLoi()
      p.hop = null
      if (moi === p.khung) { p.loiVao = loiVao ?? null; return }
      moi.innerHTML = ''
      moi.appendChild(p.vo)
      if (p.dung) moi.classList.add('gt-dung')
      p.khung.classList.remove('gt-dung')
      p.khung = moi; p.loiVao = loiVao ?? null
    },
    huy() {
      p.dung = true; p.capNhatSong()
      p.huyLam(); clearTimeout(p.hNR); clearTimeout(p.hC)
      clearTimeout(p.hNhuong); if (p.raf > 0) cancelAnimationFrame(p.raf); p.raf = 0
      quan?.unobserve(p.vo); DS.delete(p)
      p.vo.removeEventListener('click', p.choc)
      p.xoaLoi()
      p.khung.innerHTML = ''; p.khung.classList.remove('gt-tinh', 'gt-xam', 'gt-mo-nhat', 'gt-dung')
      GT_DANG_SONG.delete(gt)
    },
  }
  GT_DANG_SONG.add(gt)
  if (o.den) p.batThi(true)
  else if (o.trangThai && o.trangThai !== 'yen') gt.datTrangThai(o.trangThai)
  return gt
}
