import { HOA_CHAT } from './hoa-chat'
export { MUOI_HAI_NGUOI } from './bo-nguoi'
export type { HocTro, KieuDau, BoMau } from './bo-nguoi'
import type { HocTro, KieuDau, BoMau } from './bo-nguoi'

// ============================================================================
// ĐẢO CÔNG CHÚA — BỘ VẼ NHÂN VẬT
//
// Vẽ bằng đường cong Bézier trên Canvas 2D, KHÔNG dùng ảnh sprite.
// Lý do: đường cong thì nét ở mọi độ phân giải — màn hình điện thoại 3× hay
// máy chiếu lớp học đều sắc, và đổi màu một nhân vật chỉ là đổi một chuỗi hex.
// Sprite thì phải xuất lại cả bộ ảnh mỗi lần chỉnh một chi tiết.
//
// BA THỨ LÀM NÊN "MỊN":
//   1. Viền dày thon — viền KHÔNG phải màu đen, mà là màu chính tối đi 55%.
//      Viền đen làm nhân vật trông rẻ tiền và bẩn màu.
//   2. Chuyển sắc hai tông trên mỗi mảng — sáng ở trên, đậm ở dưới.
//   3. Viền sáng ở mép trên trái — tách nhân vật khỏi nền, cho cảm giác có khối.
//
// Mọi nhân vật vẽ trong hệ toạ độ CỤC BỘ cao 100 đơn vị, gốc đặt DƯỚI CHÂN.
// Chỗ gọi tự co giãn và đặt vị trí.
// ============================================================================

export type { TuThe } from './bo-nguoi'
import type { TuThe } from './bo-nguoi'





/** Hoá chất em cầm vào trận. Quyết định dẫm ai thì thắng, dẫm ai thì tự mất mạng. */
/** Kiểu bình hoá chất — lấy nguyên từ nguồn sự thật `hoa-chat.ts`,
 *  KHÔNG khai lại ở đây. Hai bảng hoá chất là hai bảng sẽ lệch nhau. */
export type HoaChat = { ct: string; mau: string }



// ────────────────────────────────────────────────────────── màu

function tach(mau: string): [number, number, number] {
  // Đọc được CẢ HAI dạng: "#RRGGBB" và "rgb(r,g,b)".
  // Chỉ đọc hex là bẫy: `sangHon(sangHon(x))` trả "rgb(...)" ở vòng trong, vòng
  // ngoài parse ra NaN, và canvas tô NaN thành ĐEN. Đúng lỗi mảng đen ở mõm rồng.
  if (mau[0] === '#') {
    const n = parseInt(mau.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const m = mau.match(/-?\d+(\.\d+)?/g)
  if (m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])]
  return [128, 128, 128]
}
function ghep(r: number, g: number, b: number): string {
  const k = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `rgb(${k(r)},${k(g)},${k(b)})`
}
/** Tối đi: dùng cho viền và cho mảng khuất. */
export function toiHon(hex: string, k: number): string {
  const [r, g, b] = tach(hex)
  return ghep(r * (1 - k), g * (1 - k), b * (1 - k))
}
/** Sáng lên: dùng cho mảng hứng sáng và viền sáng. */
export function sangHon(hex: string, k: number): string {
  const [r, g, b] = tach(hex)
  return ghep(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k)
}

// ────────────────────────────────────────────── khối vẽ dùng chung

export interface KieuVe {
  /** Màu nền của mảng. */
  mau: string
  /** Bề dày viền, 0 là không viền. */
  vien?: number
  /** Chuyển sắc dọc: sáng ở trên, đậm ở dưới. Cho cảm giác có khối. */
  khoi?: boolean
  /** Chiều cao mảng, cần cho chuyển sắc. */
  tren?: number
  duoi?: number
}

/** Tô một đường đã dựng sẵn, kèm viền thon và chuyển sắc. */
export function to(ctx: CanvasRenderingContext2D, k: KieuVe): void {
  if (k.khoi && k.tren !== undefined && k.duoi !== undefined) {
    const g = ctx.createLinearGradient(0, k.tren, 0, k.duoi)
    g.addColorStop(0, sangHon(k.mau, 0.22))
    g.addColorStop(0.55, k.mau)
    g.addColorStop(1, toiHon(k.mau, 0.16))
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = k.mau
  }
  ctx.fill()
  if (k.vien && k.vien > 0) {
    ctx.lineWidth = k.vien
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    // VIỀN KHÔNG BAO GIỜ ĐEN — màu chính tối đi 55%.
    ctx.strokeStyle = toiHon(k.mau, 0.55)
    ctx.stroke()
  }
}

/** Hình bầu dục bo tròn, dùng cho thân, đầu, tay chân. */
export function bau(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, rx: number, ry: number,
  xoay = 0,
): void {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, xoay, 0, Math.PI * 2)
}

/** Bóng đổ mềm dưới chân — thứ làm nhân vật "đứng trên mặt đất" thay vì trôi. */
export function bongDo(ctx: CanvasRenderingContext2D, x: number, rong: number, dam = 0.22): void {
  const g = ctx.createRadialGradient(x, 0, 0, x, 0, rong)
  g.addColorStop(0, `rgba(24,32,20,${dam})`)
  g.addColorStop(1, 'rgba(24,32,20,0)')
  ctx.save()
  ctx.scale(1, 0.3)
  ctx.beginPath()
  ctx.arc(x, 0, rong, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  ctx.restore()
}

/** Viền sáng mép trên trái — tách nhân vật khỏi nền. */
export function vienSang(ctx: CanvasRenderingContext2D, ve: () => void, mau: string): void {
  ctx.save()
  ctx.translate(-1.6, -1.6)
  ve()
  ctx.lineWidth = 2.4
  ctx.strokeStyle = sangHon(mau, 0.55)
  ctx.globalAlpha = 0.75
  ctx.stroke()
  ctx.restore()
}

// ────────────────────────────────────────────────────────── mắt

/**
 * ĐÔI MẮT LÀ THỨ QUYẾT ĐỊNH "DỄ THƯƠNG".
 * Ba lớp: lòng trắng lớn · con ngươi đậm · HAI đốm sáng (một to một nhỏ).
 * Thiếu đốm sáng thứ hai thì mắt chết, nhìn như búp bê nhựa.
 */
export function mat(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  nhin: number, nhay: number,
): void {
  if (nhay > 0.5) {
    // nháy mắt: một nét cong, không phải một gạch thẳng
    ctx.beginPath()
    ctx.moveTo(x - r * 0.9, y)
    ctx.quadraticCurveTo(x, y + r * 0.55, x + r * 0.9, y)
    ctx.lineWidth = r * 0.34
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#3A2A22'
    ctx.stroke()
    return
  }
  bau(ctx, x, y, r * 0.82, r)
  to(ctx, { mau: '#FFFFFF', vien: r * 0.22 })
  ctx.strokeStyle = '#3A2A22'
  ctx.lineWidth = r * 0.22
  ctx.stroke()

  const px = x + nhin * r * 0.26
  bau(ctx, px, y + r * 0.08, r * 0.46, r * 0.56)
  to(ctx, { mau: '#2E2118' })

  bau(ctx, px - r * 0.16, y - r * 0.26, r * 0.19, r * 0.22)
  to(ctx, { mau: '#FFFFFF' })
  bau(ctx, px + r * 0.16, y + r * 0.2, r * 0.1, r * 0.11)
  to(ctx, { mau: 'rgba(255,255,255,.75)' })
}

/** Má hồng — một vòng mờ, không viền. */
export function maHong(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, 'rgba(255,138,150,.62)')
  g.addColorStop(1, 'rgba(255,138,150,0)')
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
}

/** Miệng cười — cung cong, đầu bo tròn. */
export function cuoi(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ha: number): void {
  ctx.beginPath()
  ctx.moveTo(x - r, y)
  ctx.quadraticCurveTo(x, y + r * (0.85 + ha), x + r, y)
  ctx.lineWidth = r * 0.30
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#8A4038'
  ctx.stroke()
  if (ha > 0.5) {
    // miệng há: tô trong
    ctx.beginPath()
    ctx.moveTo(x - r, y)
    ctx.quadraticCurveTo(x, y + r * (0.85 + ha), x + r, y)
    ctx.quadraticCurveTo(x, y + r * 0.2, x - r, y)
    ctx.fillStyle = '#C4585A'
    ctx.fill()
  }
}

// ──────────────────────────────────────────────────── tư thế

interface Khop {
  /** Lệch thân theo trục dọc — nhún khi chạy, vươn khi nhảy. */
  than: number
  /** Nghiêng người. */
  nghieng: number
  /** Góc tay trái / phải, radian. */
  tayT: number
  tayP: number
  /** Góc chân trái / phải. */
  chanT: number
  chanP: number
  /** Co giãn: nhảy thì cao gầy, tiếp đất thì lùn mập. */
  coX: number
  coY: number
  /** Hệ số duỗi chân. Dẫm thì chân duỗi dài ra — dấu hiệu đọc nhanh nhất ở cỡ nhỏ. */
  chanDai: number
}

function khopTheoTuThe(tu: TuThe, t: number): Khop {
  const n = t / 1000
  switch (tu) {
    case 'chay': {
      const p = Math.sin(n * 11)
      return {
        than: Math.abs(Math.sin(n * 22)) * 3.2,
        nghieng: 0.12,
        tayT: p * 0.95 - 0.2, tayP: -p * 0.95 - 0.2,
        chanT: -p * 0.85, chanP: p * 0.85,
        coX: 1, coY: 1, chanDai: 1,
      }
    }
    // DẤU GÓC: `chi()` vẽ chi HƯỚNG XUỐNG khi góc = 0, rồi xoay quanh khớp.
    // Muốn giơ lên thì góc phải tiến về ±π, và HAI TAY NGƯỢC DẤU NHAU thì mới
    // xoè đều hai bên. Cho cùng dấu là cả hai tay chìa về một phía — đúng lỗi
    // bắt được ở ảnh chụp vòng đầu.
    case 'nhay':
      return { than: -4, nghieng: 0.05, tayT: 2.45, tayP: -2.45, chanT: -0.62, chanP: 0.34, coX: 0.92, coY: 1.10, chanDai: 0.80 }
    case 'dam':
      // DẪM ĐẦU: hai tay giơ THẲNG lên, hai chân duỗi THẲNG xuống và khép lại,
      // người co ngắn — bóng của dáng phải khác hẳn mọi tư thế khác, vì trên
      // màn điện thoại nhân vật chỉ cao chừng 40 px.
      return { than: 1, nghieng: 0, tayT: 2.35, tayP: -2.35, chanT: 0.01, chanP: -0.01, coX: 0.84, coY: 1.18, chanDai: 1.42 }
    case 'thang':
      return {
        than: -3 + Math.sin(n * 6) * 2.2, nghieng: 0,
        tayT: 2.7, tayP: -2.7, chanT: 0.1, chanP: -0.1, coX: 1, coY: 1, chanDai: 1,
      }
    default:
      return {
        than: Math.sin(n * 2.4) * 1.1, nghieng: 0,
        tayT: 0.22, tayP: -0.22, chanT: 0.05, chanP: -0.05, coX: 1, coY: 1, chanDai: 1,
      }
  }
}

// ──────────────────────────────────────────────── HỌC TRÒ

/** Một tay hoặc một chân: hình viên nang bo tròn, xoay quanh khớp. */
function chi(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, dai: number, day: number, goc: number, mau: string,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(goc)
  ctx.beginPath()
  ctx.moveTo(-day / 2, 0)
  ctx.lineTo(-day / 2, dai - day / 2)
  ctx.arc(0, dai - day / 2, day / 2, Math.PI, 0, true)
  ctx.lineTo(day / 2, 0)
  ctx.arc(0, 0, day / 2, 0, Math.PI, true)
  ctx.closePath()
  to(ctx, { mau, vien: 3.2, khoi: true, tren: 0, duoi: dai })
  ctx.restore()
}

function veKieuDau(ctx: CanvasRenderingContext2D, kieu: KieuDau, mau: BoMau, R: number): void {
  const dinh = -R * 0.55
  switch (kieu) {
    case 'muLuoiTrai':
      ctx.beginPath()
      ctx.arc(0, dinh, R * 1.02, Math.PI * 1.02, Math.PI * 1.98)
      ctx.closePath()
      to(ctx, { mau: mau.phu, vien: 3.4, khoi: true, tren: dinh - R, duoi: dinh })
      ctx.beginPath()
      ctx.ellipse(-R * 0.74, dinh + R * 0.1, R * 0.72, R * 0.2, -0.12, 0, Math.PI * 2)
      to(ctx, { mau: toiHon(mau.phu, 0.12), vien: 3.2 })
      break
    case 'muLen':
      ctx.beginPath()
      ctx.arc(0, dinh + R * 0.05, R * 1.03, Math.PI * 1.03, Math.PI * 1.97)
      ctx.closePath()
      to(ctx, { mau: mau.phu, vien: 3.4, khoi: true, tren: dinh - R, duoi: dinh })
      ctx.beginPath()
      ctx.rect(-R * 1.02, dinh + R * 0.02, R * 2.04, R * 0.3)
      to(ctx, { mau: sangHon(mau.phu, 0.35), vien: 3.2 })
      ctx.beginPath()
      ctx.arc(0, dinh - R * 0.98, R * 0.24, 0, Math.PI * 2)
      to(ctx, { mau: '#FFFFFF', vien: 3 })
      break
    case 'nonLa':
      // NÓN LÁ — nét riêng của trung tâm, không mượn của ai.
      ctx.beginPath()
      ctx.moveTo(-R * 1.5, dinh + R * 0.22)
      ctx.quadraticCurveTo(0, dinh - R * 1.5, R * 1.5, dinh + R * 0.22)
      ctx.quadraticCurveTo(0, dinh + R * 0.52, -R * 1.5, dinh + R * 0.22)
      ctx.closePath()
      to(ctx, { mau: '#F2D9A0', vien: 3.4, khoi: true, tren: dinh - R * 1.2, duoi: dinh + R * 0.4 })
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath()
        ctx.moveTo(0, dinh - R * 1.18)
        ctx.quadraticCurveTo(i * R * 0.42, dinh - R * 0.3, i * R * 0.62, dinh + R * 0.28)
        ctx.lineWidth = 1.7
        ctx.strokeStyle = 'rgba(150,110,50,.5)'
        ctx.stroke()
      }
      break
    case 'bangDo':
      ctx.beginPath()
      ctx.arc(0, dinh + R * 0.28, R * 1.0, Math.PI * 1.06, Math.PI * 1.94)
      ctx.closePath()
      to(ctx, { mau: mau.toc, vien: 3.2 })
      ctx.beginPath()
      ctx.rect(-R * 1.0, dinh + R * 0.06, R * 2.0, R * 0.26)
      to(ctx, { mau: mau.phu, vien: 3 })
      break
    case 'toc2':
      ctx.beginPath()
      ctx.arc(0, dinh + R * 0.2, R * 1.02, Math.PI * 1.0, Math.PI * 2.0)
      ctx.closePath()
      to(ctx, { mau: mau.toc, vien: 3.2, khoi: true, tren: dinh - R, duoi: dinh + R * 0.2 })
      // hai búi hai bên
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(s * R * 1.06, dinh + R * 0.34, R * 0.36, 0, Math.PI * 2)
        to(ctx, { mau: mau.toc, vien: 3 })
      }
      break
    default:
      ctx.beginPath()
      ctx.arc(0, dinh + R * 0.12, R * 1.03, Math.PI * 1.0, Math.PI * 2.0)
      ctx.closePath()
      to(ctx, { mau: mau.toc, vien: 3.2, khoi: true, tren: dinh - R, duoi: dinh + R * 0.2 })
      // mấy lọn tóc phất ra, cho đỡ giống mũ bảo hiểm
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(s * R * 0.9, dinh + R * 0.1)
        ctx.quadraticCurveTo(s * R * 1.34, dinh - R * 0.1, s * R * 1.12, dinh + R * 0.5)
        ctx.quadraticCurveTo(s * R * 0.98, dinh + R * 0.16, s * R * 0.9, dinh + R * 0.1)
        to(ctx, { mau: mau.toc, vien: 2.8 })
      }
  }
}

/**
 * BÌNH HOÁ CHẤT LƠ LỬNG TRÊN ĐẦU.
 *
 * Đặt TRÊN ĐẦU chứ không cầm tay, vì hai lý do của lối chơi:
 *   1. Người đang rơi xuống dẫm thì nhìn thẳng vào đỉnh đầu đối thủ — bình nằm
 *      đúng chỗ mắt đang nhìn, đọc được trong nửa giây quyết định.
 *   2. Cầm tay thì tay vung lúc chạy che mất, và tư thế dẫm giơ tay lên còn che thêm.
 *
 * Kèm quầng sáng cùng màu: ở cỡ 40 px thân bình chỉ còn vài điểm ảnh, quầng sáng
 * mới là thứ đọc được.
 */
export function veBinhHoaChat(
  ctx: CanvasRenderingContext2D,
  hc: HoaChat,
  y: number,
  t: number,
): void {
  const bong = Math.sin(t / 1000 * 2.2) * 2.2
  ctx.save()
  ctx.translate(0, y + bong)

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 17)
  g.addColorStop(0, hc.mau)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.globalAlpha = 0.36
  ctx.beginPath()
  ctx.arc(0, 0, 17, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  ctx.globalAlpha = 1

  // bình tam giác: thân nón + cổ + miệng
  ctx.beginPath()
  ctx.moveTo(-7.5, 6)
  ctx.lineTo(-2.4, -4)
  ctx.lineTo(2.4, -4)
  ctx.lineTo(7.5, 6)
  ctx.quadraticCurveTo(0, 8.6, -7.5, 6)
  ctx.closePath()
  to(ctx, { mau: '#EAF2FA', vien: 2.2 })

  // dung dịch bên trong
  ctx.beginPath()
  ctx.moveTo(-5.6, 2.2)
  ctx.lineTo(5.6, 2.2)
  ctx.lineTo(7.5, 6)
  ctx.quadraticCurveTo(0, 8.6, -7.5, 6)
  ctx.closePath()
  to(ctx, { mau: hc.mau })

  ctx.beginPath()
  ctx.rect(-2.6, -7.6, 5.2, 3.8)
  to(ctx, { mau: '#D6E2EE', vien: 2 })
  ctx.restore()
}

/**
 * VẼ MỘT HỌC TRÒ.
 * Gốc toạ độ dưới chân, cao 100 đơn vị, mặt hướng theo `huong` (1 phải, −1 trái).
 */
export function veHocTro(
  ctx: CanvasRenderingContext2D,
  em: HocTro,
  tu: TuThe,
  t: number,
  huong: 1 | -1 = 1,
): void {
  const k = khopTheoTuThe(tu, t)
  const R = 26               // bán kính đầu
  const yThan = -38          // tâm thân
  const yDau = -70 + k.than  // tâm đầu

  bongDo(ctx, 0, 26, tu === 'nhay' || tu === 'dam' ? 0.1 : 0.22)

  ctx.save()
  ctx.scale(huong * k.coX, k.coY)
  ctx.rotate(k.nghieng * 0.12)

  // chân sau → thân → chân trước, để chân sau nằm dưới
  const beChan = tu === 'dam' ? 3.5 : 8   // dẫm thì hai chân khép sát, thành một mũi nhọn
  const dChan = 24 * k.chanDai
  chi(ctx, -beChan, yThan + 12, dChan, 12, k.chanT, em.mau.phu)
  chi(ctx, beChan, yThan + 12, dChan, 12, k.chanP, em.mau.phu)

  // giày
  for (const [sx, g] of [[-beChan, k.chanT], [beChan, k.chanP]] as [number, number][]) {
    ctx.save()
    ctx.translate(sx, yThan + 12)
    ctx.rotate(g)
    ctx.translate(0, dChan)
    ctx.beginPath()
    // dẫm: bàn chân xoay ngang thành mũi nhọn chúc xuống
    if (tu === 'dam') ctx.ellipse(0, 2, 6.6, 7.4, 0, 0, Math.PI * 2)
    else ctx.ellipse(2, 0, 9.5, 5.6, 0, 0, Math.PI * 2)
    to(ctx, { mau: '#4A3B52', vien: 3 })
    ctx.restore()
  }

  // tay sau
  chi(ctx, -15, yThan - 8, 22, 10.5, k.tayT, em.mau.chinh)

  // thân — hình quả lê nhẹ, trên hẹp dưới rộng
  ctx.beginPath()
  ctx.moveTo(-15, yThan + 14)
  ctx.quadraticCurveTo(-18.5, yThan - 6, -12, yThan - 17)
  ctx.quadraticCurveTo(0, yThan - 22, 12, yThan - 17)
  ctx.quadraticCurveTo(18.5, yThan - 6, 15, yThan + 14)
  ctx.quadraticCurveTo(0, yThan + 19, -15, yThan + 14)
  ctx.closePath()
  to(ctx, { mau: em.mau.chinh, vien: 3.6, khoi: true, tren: yThan - 22, duoi: yThan + 19 })

  // hai cúc áo
  for (const cy of [yThan - 6, yThan + 3]) {
    ctx.beginPath()
    ctx.arc(0, cy, 2.6, 0, Math.PI * 2)
    to(ctx, { mau: sangHon(em.mau.chinh, 0.55), vien: 1.8 })
  }

  // bàn tay trước + tay trước
  chi(ctx, 15, yThan - 8, 22, 10.5, k.tayP, em.mau.chinh)
  ctx.save()
  ctx.translate(15, yThan - 8)
  ctx.rotate(k.tayP)
  ctx.beginPath()
  ctx.arc(0, 22, 6.4, 0, Math.PI * 2)
  to(ctx, { mau: em.mau.da, vien: 3 })
  ctx.restore()
  ctx.save()
  ctx.translate(-15, yThan - 8)
  ctx.rotate(k.tayT)
  ctx.beginPath()
  ctx.arc(0, 22, 6.4, 0, Math.PI * 2)
  to(ctx, { mau: em.mau.da, vien: 3 })
  ctx.restore()

  // ĐẦU — hơi bè ngang, đó là thứ làm mặt chibi dễ thương
  ctx.save()
  ctx.translate(0, yDau)
  ctx.beginPath()
  ctx.ellipse(0, 0, R * 1.03, R * 0.97, 0, 0, Math.PI * 2)
  to(ctx, { mau: em.mau.da, vien: 3.6, khoi: true, tren: -R, duoi: R })

  veKieuDau(ctx, em.dau, em.mau, R)

  // NHÁY MẮT phải HIẾM, NGẮN và LỆCH NHAU.
  // Bản đầu dùng `sin(...) > 0.965`: nhắm quá lâu, và mọi nhân vật cùng một
  // đồng hồ nên cả đội nhắm mắt cùng lúc — ảnh chụp vòng đầu bắt được đúng thế.
  // Nay: chu kỳ 4,2 giây, nhắm 130 ms, lệch pha theo tên.
  const lech = (em.ten.charCodeAt(0) * 37) % 4200
  const nhay = ((t + lech) % 4200) < 130 ? 1 : 0
  const nhin = tu === 'chay' ? 0.7 : Math.sin(t / 1000 * 0.7) * 0.4
  mat(ctx, -9.5, 2, 7.4, nhin, nhay)
  mat(ctx, 9.5, 2, 7.4, nhin, nhay)
  maHong(ctx, -16, 11, 7)
  maHong(ctx, 16, 11, 7)
  cuoi(ctx, 0, 13, 6.2, tu === 'nhay' || tu === 'dam' || tu === 'thang' ? 0.8 : 0.1)

  // mũi chấm nhỏ
  ctx.beginPath()
  ctx.arc(0, 7.5, 1.9, 0, Math.PI * 2)
  to(ctx, { mau: toiHon(em.mau.da, 0.2) })
  ctx.restore()

  ctx.restore()

  // Bình vẽ NGOÀI khối lật `huong`, để dung dịch không bị lật ngược khi em quay trái.
  if (em.hoaChat) veBinhHoaChat(ctx, em.hoaChat, yDau - 44, t)
}

// ──────────────────────────────────────────────── CÔNG CHÚA

/** Công chúa áo dài — thiết kế riêng, vương miện hoa sen. */
export function veCongChua(ctx: CanvasRenderingContext2D, t: number): void {
  const n = t / 1000
  const day = Math.sin(n * 1.6) * 2.2
  const R = 25
  const yThan = -44 + day
  const yDau = -80 + day

  bongDo(ctx, 0, 28, 0.2)

  // tà áo dài — hai vạt mềm, bay nhẹ
  for (const s of [-1, 1] as const) {
    ctx.beginPath()
    ctx.moveTo(s * 13, yThan + 4)
    ctx.quadraticCurveTo(s * 22 + Math.sin(n * 2 + s) * 3, yThan + 30, s * 15, yThan + 46)
    ctx.quadraticCurveTo(s * 6, yThan + 44, s * 5, yThan + 20)
    ctx.closePath()
    to(ctx, { mau: '#FFE3F1', vien: 3.2, khoi: true, tren: yThan, duoi: yThan + 46 })
  }

  // quần lụa
  ctx.beginPath()
  ctx.moveTo(-11, yThan + 12)
  ctx.quadraticCurveTo(-14, yThan + 34, -9, yThan + 44)
  ctx.lineTo(9, yThan + 44)
  ctx.quadraticCurveTo(14, yThan + 34, 11, yThan + 12)
  ctx.closePath()
  to(ctx, { mau: '#F7F3FF', vien: 3.2 })

  // thân áo dài
  ctx.beginPath()
  ctx.moveTo(-13, yThan + 14)
  ctx.quadraticCurveTo(-15, yThan - 6, -11, yThan - 18)
  ctx.quadraticCurveTo(0, yThan - 23, 11, yThan - 18)
  ctx.quadraticCurveTo(15, yThan - 6, 13, yThan + 14)
  ctx.quadraticCurveTo(0, yThan + 18, -13, yThan + 14)
  ctx.closePath()
  to(ctx, { mau: '#FF8FC0', vien: 3.6, khoi: true, tren: yThan - 23, duoi: yThan + 18 })

  // hoa thêu trên áo
  for (const [hx, hy] of [[-5, yThan - 4], [6, yThan + 4], [-2, yThan + 10]] as [number, number][]) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(hx + Math.cos(a) * 2.6, hy + Math.sin(a) * 2.6, 1.9, 1.4, a, 0, Math.PI * 2)
      to(ctx, { mau: 'rgba(255,255,255,.85)' })
    }
  }

  // tay
  chi(ctx, -13, yThan - 9, 21, 9.5, 0.3 + Math.sin(n * 1.6) * 0.1, '#FF8FC0')
  chi(ctx, 13, yThan - 9, 21, 9.5, -0.3 - Math.sin(n * 1.6) * 0.1, '#FF8FC0')

  // tóc dài phía sau
  ctx.beginPath()
  ctx.moveTo(-R * 0.95, yDau)
  ctx.quadraticCurveTo(-R * 1.5, yDau + 34, -R * 0.7, yDau + 52)
  ctx.lineTo(R * 0.7, yDau + 52)
  ctx.quadraticCurveTo(R * 1.5, yDau + 34, R * 0.95, yDau)
  ctx.closePath()
  to(ctx, { mau: '#3B2A24', vien: 3.4, khoi: true, tren: yDau, duoi: yDau + 52 })

  // đầu
  ctx.save()
  ctx.translate(0, yDau)
  ctx.beginPath()
  ctx.ellipse(0, 0, R * 1.02, R * 0.97, 0, 0, Math.PI * 2)
  to(ctx, { mau: '#FFE0C4', vien: 3.6, khoi: true, tren: -R, duoi: R })

  // tóc mái
  ctx.beginPath()
  ctx.arc(0, -R * 0.4, R * 1.03, Math.PI * 1.0, Math.PI * 2.0)
  ctx.closePath()
  to(ctx, { mau: '#3B2A24', vien: 3.2, khoi: true, tren: -R * 1.4, duoi: -R * 0.4 })

  // VƯƠNG MIỆN HOA SEN — năm cánh, vàng
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.34
    ctx.save()
    ctx.rotate(a)
    ctx.beginPath()
    ctx.ellipse(0, -R * 1.28, 4.6 - Math.abs(i) * 0.7, 9 - Math.abs(i) * 1.6, 0, 0, Math.PI * 2)
    to(ctx, { mau: '#FFD166', vien: 2.8 })
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, -R * 1.12, 3.4, 0, Math.PI * 2)
  to(ctx, { mau: '#FF6FA5', vien: 2.4 })

  const nhay = (t % 5200) < 130 ? 1 : 0
  mat(ctx, -9, 2, 7.6, Math.sin(n * 0.6) * 0.3, nhay)
  mat(ctx, 9, 2, 7.6, Math.sin(n * 0.6) * 0.3, nhay)
  maHong(ctx, -15.5, 11, 7)
  maHong(ctx, 15.5, 11, 7)
  cuoi(ctx, 0, 13, 5.6, 0.2)
  ctx.beginPath()
  ctx.arc(0, 7.5, 1.8, 0, Math.PI * 2)
  to(ctx, { mau: '#E5B896' })
  ctx.restore()
}

// ──────────────────────────────────────────────── RỒNG

/**
 * TRÙM CUỐI — RỒNG LỬA VIỆT.
 *
 * Thân dài uốn khúc, sừng nai, bờm, hai sợi râu dài. Đây là dáng rồng Á Đông,
 * KHÔNG phải rồng phương Tây cánh dơi, và cũng không phải con rùa gai của bất
 * kỳ game nào — vừa là thiết kế riêng của trung tâm, vừa hợp mắt học sinh Việt.
 *
 * Cao 100 đơn vị như mọi nhân vật khác, nhưng chỗ gọi thường co giãn 2,2×.
 */
export function veRong(ctx: CanvasRenderingContext2D, t: number, phunLua: number): void {
  const n = t / 1000
  // Thân và chân rồng vẽ quanh gốc, chân thò xuống tới +23. Nhấc cả con lên
  // ngần ấy thì bàn chân mới CHẠM nền thay vì lún xuống dưới nền.
  ctx.save()
  ctx.translate(0, -23)
  const THAN = '#4FBF6A'
  const BUNG = '#F6E08A'
  const SUNG = '#E8C070'

  bongDo(ctx, 6, 42, 0.22)

  // ── THÂN UỐN: MỘT ỐNG THON LIỀN MẠCH.
  // Bản đầu vẽ chuỗi hình tròn rời — mỗi hạt một viền nên trông như con sâu đo.
  // Nay dựng đường bao chạy dọc một bên rồi vòng về bên kia, tô và viền MỘT lần.
  const dot = 26
  const diem: [number, number, number][] = []
  for (let i = 0; i < dot; i++) {
    const u = i / (dot - 1)
    const x = 44 - u * 96
    const y = -30 - Math.sin(u * Math.PI * 1.75 + n * 1.5) * 21 - u * 4
    const r = 18 * (1 - u * 0.82)
    diem.push([x, y, r])
  }
  const bienTren: [number, number][] = []
  const bienDuoi: [number, number][] = []
  for (let i = 0; i < dot; i++) {
    const [x, y, r] = diem[i]
    const a = diem[Math.min(dot - 1, i + 1)]
    const b = diem[Math.max(0, i - 1)]
    const tx = a[0] - b[0], ty = a[1] - b[1]
    const d = Math.hypot(tx, ty) || 1
    const nx = -ty / d, ny = tx / d
    bienTren.push([x + nx * r, y + ny * r])
    bienDuoi.push([x - nx * r, y - ny * r])
  }
  ctx.beginPath()
  ctx.moveTo(bienTren[0][0], bienTren[0][1])
  for (let i = 1; i < dot; i++) ctx.lineTo(bienTren[i][0], bienTren[i][1])
  for (let i = dot - 1; i >= 0; i--) ctx.lineTo(bienDuoi[i][0], bienDuoi[i][1])
  ctx.closePath()
  to(ctx, { mau: THAN, vien: 3.6, khoi: true, tren: -56, duoi: 2 })

  // vảy bụng: chuỗi cung mềm chạy dọc bụng, KHÔNG viền
  for (let i = 2; i < dot - 2; i += 2) {
    const [x, y, r] = diem[i]
    ctx.beginPath()
    ctx.ellipse(x, y + r * 0.30, r * 0.52, r * 0.34, 0, 0, Math.PI * 2)
    to(ctx, { mau: BUNG })
  }
  // gai lưng
  for (let i = 1; i < dot - 1; i += 3) {
    const [x, y, r] = diem[i]
    ctx.beginPath()
    ctx.moveTo(x - r * 0.42, y - r * 0.78)
    ctx.quadraticCurveTo(x - r * 0.1, y - r * 1.75, x + r * 0.42, y - r * 0.78)
    ctx.closePath()
    to(ctx, { mau: SUNG, vien: 2.4 })
  }

  // ── ĐẦU
  const [hx, hy] = [diem[0][0], diem[0][1]]
  ctx.save()
  ctx.translate(hx, hy)

  // bờm sau gáy
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(-4, -2)
    ctx.quadraticCurveTo(-20 - Math.abs(i) * 2, -6 + i * 7, -30 - Math.abs(i), i * 11 + Math.sin(n * 3 + i) * 2)
    ctx.lineWidth = 5.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#E07A3C'
    ctx.stroke()
  }

  // sừng nai
  for (const s of [-1, 1] as const) {
    ctx.beginPath()
    ctx.moveTo(s * 7, -14)
    ctx.quadraticCurveTo(s * 13, -30, s * 8, -38)
    ctx.lineWidth = 5.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = SUNG
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s * 11, -27)
    ctx.lineTo(s * 20, -31)
    ctx.lineWidth = 4.4
    ctx.stroke()
  }

  // sọ
  ctx.beginPath()
  ctx.ellipse(0, 0, 23, 19, 0, 0, Math.PI * 2)
  to(ctx, { mau: THAN, vien: 3.8, khoi: true, tren: -19, duoi: 19 })

  // mõm
  ctx.beginPath()
  ctx.moveTo(6, -6)
  ctx.quadraticCurveTo(30, -8, 32, 2)
  ctx.quadraticCurveTo(30, 12, 6, 11)
  ctx.closePath()
  to(ctx, { mau: sangHon(THAN, 0.12), vien: 3.4, khoi: true, tren: -8, duoi: 12 })

  // lỗ mũi + khói
  ctx.beginPath()
  ctx.arc(27, -1, 2.2, 0, Math.PI * 2)
  to(ctx, { mau: toiHon(THAN, 0.45) })

  // răng nanh — hai cái, cong, không nhọn hoắt (người chơi có vị thành niên)
  for (const [tx, ty] of [[16, 10], [25, 9]] as [number, number][]) {
    ctx.beginPath()
    ctx.moveTo(tx - 2.4, ty - 2)
    ctx.quadraticCurveTo(tx, ty + 5.5, tx + 2.4, ty - 2)
    ctx.closePath()
    to(ctx, { mau: '#FFFFFF', vien: 2 })
  }

  // mắt — to, tròn, hơi hung nhưng vẫn dễ thương
  bau(ctx, 4, -5, 8.4, 9.2)
  to(ctx, { mau: '#FFF6D8', vien: 3 })
  bau(ctx, 5.4, -4, 4.2, 5.6)
  to(ctx, { mau: '#C0392B' })
  bau(ctx, 4.2, -6.6, 1.9, 2.1)
  to(ctx, { mau: '#FFFFFF' })
  // chân mày gồ, cho ra vẻ trùm
  ctx.beginPath()
  ctx.moveTo(-3, -15)
  ctx.quadraticCurveTo(5, -19.5, 12.5, -15)
  ctx.lineWidth = 3.0
  ctx.lineCap = 'round'
  ctx.strokeStyle = toiHon(THAN, 0.42)
  ctx.stroke()

  // hai sợi râu dài
  for (const s of [-1, 1] as const) {
    ctx.beginPath()
    ctx.moveTo(24, s * 6 + 2)
    ctx.bezierCurveTo(
      40, s * 16 + 4 + Math.sin(n * 2.4 + s) * 5,
      52, s * 2 + 20 + Math.sin(n * 2 + s) * 6,
      66, s * 12 + 16 + Math.sin(n * 1.7 + s) * 8,
    )
    ctx.lineWidth = 3.2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#E07A3C'
    ctx.stroke()
  }

  // ── LỬA PHUN
  if (phunLua > 0) {
    const L = phunLua
    ctx.save()
    ctx.translate(32, 2)
    for (let i = 0; i < 22; i++) {
      const u = i / 21
      const x = u * 118 * L
      const rn = Math.sin(i * 2.7 + n * 22) * 0.5 + 0.5
      const y = (rn - 0.5) * (10 + u * 34)
      const r = (5 + u * 17) * (0.55 + rn * 0.6) * L
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const nong = u < 0.35
      g.addColorStop(0, nong ? '#FFF9D0' : '#FFD25A')
      g.addColorStop(0.5, nong ? '#FFC93C' : '#FF8A2B')
      g.addColorStop(1, 'rgba(255,92,20,0)')
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
    }
    ctx.restore()
  }
  ctx.restore()

  // ── HAI CHÂN TRƯỚC, có vuốt
  for (const [cx, cy] of [[22, -6], [2, -2]] as [number, number][]) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.beginPath()
    ctx.ellipse(0, 8, 8.5, 11, -0.15, 0, Math.PI * 2)
    to(ctx, { mau: THAN, vien: 3.2, khoi: true, tren: -3, duoi: 19 })
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 4, 16)
      ctx.quadraticCurveTo(i * 5, 21, i * 4.5, 23)
      ctx.lineWidth = 2.6
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#FFF3D0'
      ctx.stroke()
    }
    ctx.restore()
  }
  ctx.restore()
}

// ──────────────────────────────────────────────── MƯỜI HAI NGƯỜI CHƠI

/** Bộ 12 người chơi. Màu áo là thứ duy nhất phân biệt trên màn khi đang chạy. */
/**
 * MƯỜI HAI HOÁ CHẤT — danh pháp 2018, màu quy ước trong game.
 * Lấy nguyên bảng đã dùng ở `DAU-TRUONG-BAN-VE.md`, không dựng bảng thứ hai.
 */
export const MUOI_HAI_HOA_CHAT: readonly HoaChat[] = HOA_CHAT



/** Ba mạng — vẽ thành ba trái tim nhỏ trên đầu bình. */
export function veMang(ctx: CanvasRenderingContext2D, con: number, y: number): void {
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 11
    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    ctx.moveTo(0, 3.4)
    ctx.bezierCurveTo(-5.4, -1.4, -3.2, -6.2, 0, -3.2)
    ctx.bezierCurveTo(3.2, -6.2, 5.4, -1.4, 0, 3.4)
    ctx.closePath()
    to(ctx, { mau: i < con ? '#FF5A7A' : 'rgba(255,255,255,.28)', vien: 1.8 })
    ctx.restore()
  }
}

/* ═══════════════════ QUÁI VÀ HOA ═══════════════════ */

const MAU_QUAI = ['#8A5AC8', '#E8674C', '#2FA8A0'] as const

/**
 * Quái đi tuần. Ba kiểu, phân biệt bằng SỪNG và CHÂN chứ không bằng chi tiết nhỏ —
 * ở 40 px trên điện thoại thì chi tiết nhỏ biến mất hết.
 *
 * Vẽ quanh gốc = giữa CHÂN, thân vươn lên trên (y âm), để khớp với toạ độ ván.
 */
export function veQuai(ctx: CanvasRenderingContext2D, kieu: number, huong: 1 | -1, t: number): void {
  const mau = MAU_QUAI[kieu % 3]!
  const n = t / 1000
  const nhun = Math.sin(n * 6 + kieu) * 3
  bongDo(ctx, 0, 30, 0.2)
  ctx.save()
  ctx.scale(huong, 1)

  // chân
  const soChan = kieu === 1 ? 4 : 2
  for (let i = 0; i < soChan; i++) {
    const x = soChan === 2 ? (i === 0 ? -13 : 13) : -18 + i * 12
    const dao = Math.sin(n * 9 + i * 1.7) * 3
    ctx.beginPath()
    ctx.ellipse(x + dao, -7, 7, 9, 0, 0, Math.PI * 2)
    to(ctx, { mau: toiHon(mau, 0.3), vien: 2.6 })
  }

  // thân
  ctx.beginPath()
  if (kieu === 2) {
    ctx.moveTo(-24, -8); ctx.quadraticCurveTo(-16, -62 + nhun, 0, -64 + nhun)
    ctx.quadraticCurveTo(16, -62 + nhun, 24, -8); ctx.closePath()
  } else {
    ctx.ellipse(0, -32 + nhun, 27, kieu === 1 ? 22 : 28, 0, 0, Math.PI * 2)
  }
  const g = ctx.createLinearGradient(0, -60, 0, -6)
  g.addColorStop(0, sangHon(mau, 0.26)); g.addColorStop(1, mau)
  ctx.fillStyle = g
  ctx.strokeStyle = toiHon(mau, 0.55); ctx.lineWidth = 3.2; ctx.lineJoin = 'round'
  ctx.fill(); ctx.stroke()

  // sừng
  if (kieu !== 1) {
    for (const sx of [-13, 13]) {
      ctx.beginPath()
      ctx.moveTo(sx, -52 + nhun)
      ctx.lineTo(sx * 1.35, -72 + nhun)
      ctx.lineTo(sx * 0.55, -56 + nhun)
      ctx.closePath()
      to(ctx, { mau: '#F6E08A', vien: 2.4 })
    }
  }

  // mắt ba lớp — thiếu đốm sáng thứ hai là mắt chết
  mat(ctx, -9, -36 + nhun, 8, 0, 0)
  mat(ctx, 9, -36 + nhun, 8, 0, 0)
  // miệng răng cưa
  ctx.beginPath()
  ctx.moveTo(-11, -22 + nhun)
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(-11 + i * 7.3 + 3.6, -15 + nhun)
    ctx.lineTo(-11 + (i + 1) * 7.3, -22 + nhun)
  }
  ctx.closePath()
  to(ctx, { mau: '#FFF6E8', vien: 2 })
  ctx.restore()
}

/** Hoa khổng lồ. Nhấp nhô nhẹ để mắt bắt được giữa lúc chạy. */
export function veHoa(ctx: CanvasRenderingContext2D, t: number): void {
  const n = t / 1000
  const len = Math.sin(n * 2.4) * 4
  ctx.save()
  ctx.translate(0, len)
  // quầng sáng
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 40)
  g.addColorStop(0, 'rgba(255,90,158,.38)'); g.addColorStop(1, 'rgba(255,90,158,0)')
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill()
  // sáu cánh
  for (let i = 0; i < 6; i++) {
    ctx.save()
    ctx.rotate((i / 6) * Math.PI * 2 + n * 0.6)
    ctx.beginPath()
    ctx.ellipse(0, -17, 9, 15, 0, 0, Math.PI * 2)
    to(ctx, { mau: i % 2 ? '#FF7AB0' : '#FF5A9E', vien: 2.4 })
    ctx.restore()
  }
  // nhuỵ
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2)
  to(ctx, { mau: '#FFC13D', vien: 2.4 })
  ctx.restore()
}
