// LIVE BẢNG — BÀN TAY CẦM BÚT CỦA THẦY TRÊN MÁY EM (và trình phát «Xem lại Live»).
// Thầy 11/11 (lần 1): «thay nút vàng bằng một cái bút nhỏ … đồng bộ tức thì theo nét của gv».
// Thầy 11/11 (lần 2, sau khi thử Wacom thật): «cây bút hiện lên máy học sinh ngắn và nhỏ hơn để ko gây mất tập trung, có hiển thị tay cầm bút giống người
// viết, nhỏ phù hợp tinh tế đẹp và thân thiện ko bị rối mắt».
//   · HÌNH: bàn tay phải cầm một cây bút NGẮN, vẽ tối giản bằng hình khối mềm (mu bàn tay + ngón trỏ + ngón cái), hai tông + viền rất mảnh. NGÒI ở đúng điểm
//     viết; bàn tay nằm chếch PHẢI-DƯỚI ngòi nên không che chữ vừa viết (chữ đi từ trái sang, từ trên xuống). Cỡ tính theo bề cao bảng đen (≈ 5,5 %).
//   · HÌNH DỰNG SẴN: bàn tay vẽ MỘT lần vào một canvas rời (dựng lại chỉ khi đổi cỡ / dáng / màu mực); mỗi khung nơi vẽ dán nó bằng một lệnh `drawImage`
//     lên lớp «đang viết» — không đụng DOM, không thêm lớp (ve-bang.ts).
//   · ĐỘ RÕ: đang viết rõ nhất · lơ lửng mờ hơn, nhấc lên một chút · đứng yên lâu thì mờ gần hết. Ba mức, đổi dần; nhấc bút giữa hai nét của một chữ
//     (< 0,42 giây) thì giữ nguyên độ rõ, không nhấp nháy.
//   · CHUYỂN ĐỘNG: ngòi luôn ở ĐÚNG đầu nét của khung đó; thân tay ngả rất nhẹ theo hướng đi (≤ 5°, có quán tính); lơ lửng mà chỗ mới cách xa thì trượt tới.
//     Máy yếu: giữ bàn tay, bỏ bóng + bỏ ngả + bỏ chuyển êm.
// Tệp này thuần phần hình + phần chuyển động; việc dựng hình sẵn và dán nằm ở ve-bang.ts. Màu do nơi gọi đọc từ biến màu sẵn có của bảng live.

/** Dáng con trỏ: `but` = CHỈ cây bút ngắn, không bàn tay (MẶC ĐỊNH — thầy 11/11 lần 3: «Bỏ tay chỉ để lại bút») · `nam` = bàn tay mềm đủ ngón trỏ + ngón cái ·
 *  `gon` = một khối tròn gọn · `vien` = chỉ nét viền, ruột gần trong suốt. Ba dáng có bàn tay giữ lại để thầy đổi ý thì bật một dòng (`datDangTay`). */
export type DangTay = 'but' | 'nam' | 'gon' | 'vien'
/** Màu: `than` = bàn tay (tông sáng) · `bong` = tông tối (bóng, viền) · `dai` = thân bút · `muc` = màu nét gần nhất (ngòi bút mang màu này). */
export interface MauBut { than: string; dai: string; bong: string; muc: string }
/** Trạng thái hiện của một khung: ngòi tại (x, y) px CSS trong hình · `nang` 0 = chạm … 1 = lơ lửng · `goc` = độ ngả (rad) · `mo` = độ rõ 0..1. */
export interface HinhBut { x: number; y: number; nang: number; goc: number; mo: number }

/** Hình vẽ theo đơn vị thiết kế: ngòi ở gốc (0, 0), bàn tay cao ≈ 60 đơn vị. Ô bao cả hình (kể cả bóng + viền): x −4 … 72, y −50 … 44. */
const DV_TAY = 60
export const O_TAY = { trai: -4, tren: -50, phai: 72, duoi: 44 } as const
/** Cỡ bàn tay (px CSS) theo bề cao bảng đen: ≈ 5,5 %, kẹp 15 … 44 (điện thoại ngang bảng cao ~330 px ⇒ ~18 px). */
export const coTay = (caoBang: number): number => Math.max(15, Math.min(44, caoBang * 0.055))

const XA_PX = 26, TRUOT_MS = 45, NANG_MS = 60, NGA_MS = 130, RO_LEN_MS = 50, RO_XUONG_MS = 180
const NGA_TOI_DA = (5 * Math.PI) / 180
/** Độ rõ: đang viết · lơ lửng · đứng yên lâu. */
export const RO_TAY = { viet: 0.92, lo: 0.58, nghi: 0.14 } as const
/** Lơ lửng bao lâu mới coi là «đang lơ lửng» (nhấc bút giữa hai nét của một chữ thì bàn tay KHÔNG nhấp nháy mờ / rõ) · đứng yên bao lâu thì mờ gần hết. */
const LO_MS = 420, NGHI_MS = 1600

export function taoTroBut(tuy: { yeu?: boolean } = {}) {
  let x = 0, y = 0, nang = 1, goc = 0, mo = 0, lucCham = -1e9, hien = false, truot = false, luc = 0, lucDoi = 0, dx = 0, dy = 0
  /** MỘT bước mỗi khung hình. `dich` = chỗ ngòi bút theo đệm phát (px CSS trong hình) hoặc null = ẩn. Trả hình để dời lớp, hoặc null. */
  function buoc(dich: { x: number; y: number; cham: boolean; /** chỗ này đã mượt sẵn (trình phát xem lại tự lướt bút giữa hai nét) ⇒ bám đúng, không trượt thêm */ sat?: boolean } | null, nay: number): HinhBut | null {
    const dt = Math.min(64, Math.max(0, nay - luc))
    luc = nay
    if (!dich) { hien = false; mo = 0; return null }
    const x0 = x, y0 = y
    if (!hien || dich.cham || dich.sat || tuy.yeu) { x = dich.x; y = dich.y; truot = false; if (!hien) { nang = dich.cham ? 0 : 1; goc = 0; lucDoi = nay } }
    else {
      const q = Math.hypot(dich.x - x, dich.y - y)
      if (truot || q > XA_PX) {
        const k = 1 - Math.exp(-dt / TRUOT_MS)
        x += (dich.x - x) * k; y += (dich.y - y) * k
        truot = q * (1 - k) > 1
      } else { x = dich.x; y = dich.y }
    }
    if (hien && (Math.abs(x - x0) > 0.05 || Math.abs(y - y0) > 0.05)) lucDoi = nay
    if (dich.cham) lucDoi = lucCham = nay
    const toi = dich.cham ? 0 : 1
    if (tuy.yeu || dich.cham) nang = toi // chạm bảng: ngòi về ĐÚNG đầu nét ngay khung đó
    if (tuy.yeu) goc = 0
    else {
      if (!dich.cham) { nang += (toi - nang) * (1 - Math.exp(-dt / NANG_MS)); if (Math.abs(toi - nang) < 0.02) nang = toi }
      // ngả rất nhẹ theo hướng đi ngang: đi sang phải thì thân tay ngả về sau (ngược chiều kim), có quán tính
      const vx = hien && dt > 0 ? (x - x0) / dt : 0
      const dichGoc = Math.max(-NGA_TOI_DA, Math.min(NGA_TOI_DA, -vx * 0.12))
      goc += (dichGoc - goc) * (1 - Math.exp(-dt / NGA_MS))
      if (Math.abs(goc) < 0.002 && dichGoc === 0) goc = 0
    }
    dx = x; dy = y
    // độ rõ: ba mức, đổi dần (rõ lên nhanh, mờ đi chậm); làm tròn 0,02 để khung nào không đổi thì nơi vẽ khỏi làm gì
    const roDich = dich.cham || nay - lucCham < LO_MS ? RO_TAY.viet : nay - lucDoi > NGHI_MS ? RO_TAY.nghi : RO_TAY.lo
    if (tuy.yeu || !hien) mo = roDich
    else { mo += (roDich - mo) * (1 - Math.exp(-dt / (roDich > mo ? RO_LEN_MS : RO_XUONG_MS))); if (Math.abs(roDich - mo) < 0.02) mo = roDich }
    hien = true
    return { x, y, nang, goc, mo: Math.round(mo * 50) / 50 }
  }
  return { buoc, /** Vị trí ngòi đang hiện (px CSS) hoặc null. */ viTri: (): [number, number] | null => (hien ? [dx, dy] : null) }
}
export type TroBut = ReturnType<typeof taoTroBut>

type G = CanvasRenderingContext2D
/** Viên thuốc (ngón tay) từ (x1, y1) tới (x2, y2), bán kính r. */
function vienThuoc(g: G, x1: number, y1: number, x2: number, y2: number, r: number): void {
  const a = Math.atan2(y2 - y1, x2 - x1)
  g.beginPath()
  g.arc(x1, y1, r, a + Math.PI / 2, a - Math.PI / 2)
  g.arc(x2, y2, r, a - Math.PI / 2, a + Math.PI / 2)
  g.closePath()
}
/** Mu bàn tay: khối tròn mềm nghiêng, chếch phải-dưới ngòi, thon nhẹ về phía cổ tay. */
function muTay(g: G, gon: boolean): void {
  g.beginPath()
  if (gon) g.ellipse(42, 12, 25, 19, -0.5, 0, Math.PI * 2)
  else {
    g.moveTo(24, -4)
    g.bezierCurveTo(30, -17, 50, -18, 59, -6)
    g.bezierCurveTo(66, 4, 68, 20, 61, 31)
    g.bezierCurveTo(54, 41, 40, 40, 31, 31)
    g.bezierCurveTo(23, 23, 19, 8, 24, -4)
  }
  g.closePath()
}
/** Cây bút NGẮN: từ ngòi (0, 0) đi lên-phải tới (30, −34); 11 đơn vị đầu là ngòi nhọn mang MÀU MỰC đang viết (phấn sáng trên bảng, mực sẫm trên giấy). */
function but(g: G, mau: MauBut, k = 1): void {
  const ux = 30 / 45.3, uy = -34 / 45.3, nx = -uy, ny = ux, r = 3.4
  const diem = (t: number, s: number): [number, number] => [(ux * t + nx * s) * k, (uy * t + ny * s) * k]
  // thân
  g.fillStyle = mau.dai
  g.beginPath()
  let p = diem(10, -r); g.moveTo(p[0], p[1])
  p = diem(42, -r); g.lineTo(p[0], p[1])
  p = diem(45.3, 0); const q = diem(42, r); g.quadraticCurveTo(diem(46, -r)[0], diem(46, -r)[1], p[0], p[1]); g.quadraticCurveTo(diem(46, r)[0], diem(46, r)[1], q[0], q[1])
  p = diem(10, r); g.lineTo(p[0], p[1])
  g.closePath(); g.fill()
  // ngòi
  g.fillStyle = mau.muc || mau.than
  g.beginPath(); g.moveTo(0, 0); p = diem(10, -r); g.lineTo(p[0], p[1]); p = diem(10, r); g.lineTo(p[0], p[1]); g.closePath(); g.fill()
}

/** Cây bút đứng một mình (dáng `but`) phóng bấy nhiêu lần so với cây bút trong bàn tay. */
export const K_BUT_LE = 1.3

/** VẼ con trỏ (cây bút, hoặc bàn tay cầm bút) vào `g` (đã đặt phép biến đổi sao cho gốc = ngòi bút, 1 đơn vị = `co / 60` px). Vẽ ĐẶC (nơi gọi dán cả hình với độ rõ cần có).
 *  `bong` = có bóng đổ nhẹ. */
/** CHẤM LAZE (thầy 13/11: «bút khi không viết thì hiện một chấm laze màu đỏ sáng rõ siêu nét để chỉ bài còn khi viết lại hiện bút bình thường»): vẽ tại
 *  gốc (0, 0), đơn vị px CSS — quầng đỏ ba bậc bán kính `LAZE_R`, lõi đỏ đặc mép nét, viền sáng mảnh, đốm sáng giữa. `yeu` ⇒ bỏ quầng. */
export const LAZE_R = 13, LAZE_TRE_MS = 320
export function veLaze(g: G, mauDo: string, mauSang: string, yeu: boolean): void {
  const tron = (r: number): void => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2) }
  g.fillStyle = mauDo
  if (!yeu) for (const [r, a] of [[LAZE_R, 0.16], [9.8, 0.3], [7.2, 0.5]] as const) { g.globalAlpha = a; tron(r); g.fill() }
  g.globalAlpha = 1; tron(5); g.fill()
  g.lineWidth = 1.2; g.strokeStyle = mauSang; g.globalAlpha = 0.95; tron(5.5); g.stroke()
  g.fillStyle = mauSang; g.globalAlpha = 1; tron(2); g.fill()
  g.globalAlpha = 1
}
export function veTay(g: G, dang: DangTay, mau: MauBut, bong: boolean): void {
  const vien = dang === 'vien', gon = dang === 'gon'
  g.lineJoin = 'round'; g.lineCap = 'round'
  // CHỈ cây bút (mặc định): không bàn tay, không bóng. Phóng 1,3 lần so với cây bút nằm trong bàn tay để một mình nó vẫn thấy rõ trên điện thoại (≈ 18 px), vẫn ngắn và nhỏ.
  if (dang === 'but') { but(g, mau, K_BUT_LE); return }
  // bóng rất nhẹ dưới bàn tay
  if (bong && !vien) { g.save(); g.translate(2, 2.6); g.globalAlpha = 0.26; g.fillStyle = mau.bong; muTay(g, gon); g.fill(); g.restore() }
  /** Một khối của bàn tay: tô tông sáng + viền rất mảnh tông tối. `toi` = phủ thêm một lớp tông tối mờ (khối nằm phía dưới). Dáng viền: hai nét chồng (tối rộng, sáng hẹp) — nền nào cũng thấy. */
  const khoi = (ve: () => void, toi = 0): void => {
    ve()
    if (vien) { g.globalAlpha = 0.5; g.strokeStyle = mau.bong; g.lineWidth = 4.2; g.stroke(); g.globalAlpha = 1; g.strokeStyle = mau.than; g.lineWidth = 2.2; g.stroke(); return }
    g.fillStyle = mau.than; g.fill()
    if (toi) { g.globalAlpha = toi; g.fillStyle = mau.bong; g.fill() }
    g.globalAlpha = 0.5; g.strokeStyle = mau.bong; g.lineWidth = 1.7; g.stroke()
    g.globalAlpha = 1
  }
  // ngón cái (nằm dưới cây bút, tông sẫm hơn một chút) vẽ trước, rồi cây bút, rồi mu bàn tay + ngón trỏ (đè lên thân bút như đang cầm)
  if (!gon) khoi(() => vienThuoc(g, 31, 15, 14, 2, 6), 0.1)
  but(g, mau)
  khoi(() => muTay(g, gon))
  khoi(() => (gon ? vienThuoc(g, 31, -6, 16, -12.5, 5.8) : vienThuoc(g, 40, -9, 16, -13, 5.8)))
  if (vien) return
  // che đường viền chỗ ngón trỏ nối vào mu bàn tay (một khối liền)
  g.fillStyle = mau.than; g.beginPath()
  if (gon) g.ellipse(32, -3, 6.5, 5.5, -0.3, 0, Math.PI * 2); else g.ellipse(39, -6, 7, 5.6, -0.3, 0, Math.PI * 2)
  g.fill()
  // hai nếp ngón co bên mép trái mu bàn tay (rất mờ; cỡ nhỏ gần như không thấy, cỡ lớn cho ra dáng bàn tay)
  if (!gon) {
    g.globalAlpha = 0.3; g.strokeStyle = mau.bong; g.lineWidth = 1.5
    g.beginPath(); g.moveTo(25, 9); g.quadraticCurveTo(33, 8.5, 35.5, 15.5); g.moveTo(29, 21); g.quadraticCurveTo(37, 19.5, 40, 26.5); g.stroke()
    g.globalAlpha = 1
  }
}
/** Tỉ lệ px CSS mỗi đơn vị thiết kế cho bàn tay cỡ `co`. */
export const tiLeTay = (co: number): number => co / DV_TAY
