// LIVE BẢNG — CÂY BÚT CỦA THẦY TRÊN MÁY EM (thầy 11/11: «thay nút vàng bằng một cái bút nhỏ (làm tinh tế đẹp) đồng bộ tức thì theo nét của gv»).
// Cây bút được VẼ NGAY TRÊN lớp canvas «đang viết» (ve-bang.ts), cùng lượt vẽ với đuôi nét ⇒ ngòi và mực luôn khớp nhau trong cùng một khung hình, và
// không phải dời phần tử DOM nào mỗi khung. (Đo máy em CPU ×4 / ×6: một phần tử DOM dời bằng transform mỗi khung làm trang tính lại kiểu mỗi khung —
// luồng chính bận thêm ~10–20 điểm phần trăm, khung hình ×6 tụt từ ~56 còn ~45; vẽ trên canvas thì không tốn thêm.)
//   · đang viết (`cham`): NGÒI ở đúng đầu nét của khung đó, đậm đủ;
//   · lơ lửng: mờ hơn, nhấc lên một chút (đổi dần trong ~0,1 giây); chỗ mới cách chỗ cũ xa (bút rời bảng rồi vào lại chỗ khác, mất gói) ⇒ TRƯỢT tới, không nhảy cóc;
//   · thân nghiêng 42° như tay phải cầm bút, bóng rất nhẹ; đầu ngòi mang màu phấn thầy đang viết (màu là DỮ LIỆU của nét).
// Tệp này thuần: máy trạng thái chuyển động (`taoTroBut`) + hàm vẽ lên ngữ cảnh canvas (`veBut`). Màu thân / đai / bóng do nơi gọi đọc từ biến màu của app.

/** Hình cây bút của một khung: ngòi tại (x, y) px CSS trong hình; `nang` 0 = đang chạm … 1 = lơ lửng. */
export interface HinhBut { x: number; y: number; nang: number }
/** Màu cây bút: thân · đai (vòng màu sát ngòi) · ngòi · bóng — lấy từ biến màu sẵn có của bảng live; `muc` = màu phấn của nét gần nhất. */
export interface MauBut { than: string; dai: string; ngoi: string; bong: string; muc: string }
/** Hộp bao cây bút quanh ngòi (px CSS, đã gồm phần nhấc lên + bóng): [trái, trên, phải, dưới]. */
export const HOP_BUT: readonly [number, number, number, number] = [-6, -34, 30, 8]

/** Lơ lửng mà chỗ mới cách chỗ đang hiện quá ngần này (px) ⇒ trượt tới thay vì nhảy. */
const XA_PX = 26
const TRUOT_MS = 45
/** Nhấc lên / hạ xuống: hằng số thời gian (ms). */
const NANG_MS = 40
const NGHIENG = (42 * Math.PI) / 180

export function taoTroBut() {
  let x = 0, y = 0, nang = 1, hien = false, truot = false, luc = 0
  /** MỘT bước mỗi khung hình. `dich` = chỗ ngòi bút theo đệm phát (px CSS trong hình) hoặc null = ẩn. Trả hình để vẽ, hoặc null. */
  function buoc(dich: { x: number; y: number; cham: boolean } | null, nay: number): HinhBut | null {
    const dt = Math.min(64, Math.max(0, nay - luc))
    luc = nay
    if (!dich) { hien = false; return null }
    if (!hien || dich.cham) { x = dich.x; y = dich.y; truot = false; if (!hien) nang = dich.cham ? 0 : 1 }
    else {
      const q = Math.hypot(dich.x - x, dich.y - y)
      if (truot || q > XA_PX) {
        const k = 1 - Math.exp(-dt / TRUOT_MS)
        x += (dich.x - x) * k; y += (dich.y - y) * k
        truot = q * (1 - k) > 1
      } else { x = dich.x; y = dich.y }
    }
    hien = true
    const toi = dich.cham ? 0 : 1
    nang += (toi - nang) * (1 - Math.exp(-dt / NANG_MS))
    if (Math.abs(toi - nang) < 0.02) nang = toi
    return { x, y, nang }
  }
  return { buoc, /** Vị trí ngòi đang hiện (px CSS) hoặc null. */ viTri: (): [number, number] | null => (hien ? [x, y] : null) }
}
export type TroBut = ReturnType<typeof taoTroBut>

/** Vẽ cây bút lên `g`. Gốc canvas nằm ở (gx, gy) px CSS của hình; `dpr` = mật độ điểm ảnh. Bút dựng đứng (ngòi ở gốc, thân đi lên) rồi xoay nghiêng sang phải. */
export function veBut(g: CanvasRenderingContext2D, h: HinhBut, dpr: number, gx: number, gy: number, mau: MauBut): void {
  const c = Math.cos(NGHIENG) * dpr, s = Math.sin(NGHIENG) * dpr
  const than = (): void => { g.beginPath(); g.moveTo(-2.6, -11.4); g.lineTo(-2.6, -28.6); g.quadraticCurveTo(-2.6, -31, 0, -31); g.quadraticCurveTo(2.6, -31, 2.6, -28.6); g.lineTo(2.6, -11.4); g.closePath() }
  const ngoi = (r: number, cao: number): void => { g.beginPath(); g.moveTo(0, 0); g.lineTo(-r, -cao); g.lineTo(r, -cao); g.closePath() }
  // lơ lửng: nhấc lên (2, −4) px và mờ còn 62 %
  const x0 = (h.x - gx + 2 * h.nang) * dpr, y0 = (h.y - gy - 4 * h.nang) * dpr, mo = 1 - 0.38 * h.nang
  g.globalCompositeOperation = 'source-over'
  // bóng rất nhẹ: cùng dáng, lệch (1,4 · 1,3) px, lúc lơ lửng bóng rời xa hơn một chút
  g.setTransform(c, s, -s, c, x0 + (1.4 + h.nang) * dpr, y0 + (1.3 + 1.5 * h.nang) * dpr)
  g.globalAlpha = 0.3 * mo; g.fillStyle = mau.bong
  than(); g.fill(); ngoi(2.6, 11.4); g.fill()
  g.setTransform(c, s, -s, c, x0, y0)
  g.globalAlpha = mo
  g.fillStyle = mau.than; than(); g.fill()
  g.fillStyle = mau.ngoi; ngoi(2.6, 9); g.fill()
  g.fillStyle = mau.dai; g.fillRect(-2.6, -11.6, 5.2, 2.6)
  g.fillStyle = mau.muc || mau.than; ngoi(1.05, 3.4); g.fill()
  g.globalAlpha = 1
}
