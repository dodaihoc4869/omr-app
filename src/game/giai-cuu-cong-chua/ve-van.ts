/**
 * VẼ — tách hẳn khỏi mô phỏng. Tệp này KHÔNG được đổi một giá trị nào của ván;
 * nhờ vậy mọi tiêu chí nghiệm thu chạy được bằng lệnh mà không cần trình duyệt.
 *
 * Trục y của ván hướng LÊN. Canvas hướng XUỐNG. Đổi trục đúng một chỗ: `mh()`.
 */
import { CAU_HINH } from './cau-hinh'
import { veHocTro, veCongChua, veRong, veMang, veQuai, veHoa } from './nhan-vat'
import { canhBaoDam } from './bang-khac-che'
import { HOA_CHAT } from './hoa-chat'
import { dinhDauRong } from './rong'
import type { VanChoi } from './van-choi'
import type { NguoiChoi } from './types'

/** Bề rộng nhìn thấy, tính bằng đơn vị logic. Máy to nhỏ cùng độ khó. */
export const RONG_NHIN = 760
/** nhan-vat.ts vẽ nhân vật cao ~120 đơn vị cục bộ. */
const CAO_CUC_BO = 120

export interface KhungNhin { W: number; H: number; camX: number; ti: number }

export function tinhKhung(W: number, H: number, camX: number): KhungNhin {
  return { W, H, camX, ti: W / RONG_NHIN }
}

/** Đổi toạ độ ván → toạ độ canvas. */
function mh(k: KhungNhin, x: number, y: number): [number, number] {
  const yNen = k.H - 74
  return [(x - k.camX) * k.ti + k.W / 2, yNen - y * k.ti]
}

function troiVaDoi(ctx: CanvasRenderingContext2D, k: KhungNhin, t: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, k.H)
  g.addColorStop(0, '#C9ECFB'); g.addColorStop(1, '#8FD4F5')
  ctx.fillStyle = g; ctx.fillRect(0, 0, k.W, k.H)

  for (let i = 0; i < 6; i++) {
    const x = ((i * 300 - k.camX * 0.25 + t * 0.008) % (k.W + 380)) - 190
    const y = 40 + i * 26, s = 0.8 + (i % 3) * 0.2
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s)
    ctx.beginPath()
    ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.arc(25, -7, 17, 0, Math.PI * 2)
    ctx.arc(46, 2, 20, 0, Math.PI * 2); ctx.arc(23, 11, 19, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fill(); ctx.restore()
  }
  // đồi xa
  const yNen = k.H - 74
  ctx.beginPath(); ctx.moveTo(0, yNen)
  for (let x = 0; x <= k.W; x += 26) {
    const u = (x + k.camX * 0.45) * 0.0016
    ctx.lineTo(x, yNen - 52 - Math.sin(u) * 34 - Math.sin(u * 2.3) * 16)
  }
  ctx.lineTo(k.W, k.H); ctx.lineTo(0, k.H); ctx.closePath()
  ctx.fillStyle = '#9FDE8C'; ctx.fill()   // nhạt hơn cỏ thật, để không nhầm là chỗ đứng
}

function nenVaBac(ctx: CanvasRenderingContext2D, k: KhungNhin, van: VanChoi): void {
  const yNen = k.H - 74
  // nền đất, chừa vực
  const moc: number[] = [0]
  for (const v of van.dao.vuc) { moc.push(v.x1, v.x2) }
  moc.push(van.dao.dai + 900)
  for (let i = 0; i < moc.length - 1; i += 2) {
    const [x1] = mh(k, moc[i]!, 0)
    const [x2] = mh(k, moc[i + 1]!, 0)
    if (x2 < -40 || x1 > k.W + 40) continue
    ctx.fillStyle = '#5CC24A'; ctx.fillRect(x1, yNen, x2 - x1, 15)
    ctx.fillStyle = '#B9793F'; ctx.fillRect(x1, yNen + 15, x2 - x1, k.H - yNen - 15)
  }
  for (const b of van.dao.bac) {
    const [x, y] = mh(k, b.x, b.y)
    const w = b.rong * k.ti
    if (x + w < -40 || x > k.W + 40) continue
    ctx.beginPath()
    const h = 22 * k.ti
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 8 * k.ti); else ctx.rect(x, y, w, h)
    ctx.fillStyle = '#B9793F'; ctx.fill()
    ctx.fillStyle = '#5CC24A'; ctx.fillRect(x, y, w, 6 * k.ti)
  }
}

function veNguoi(
  ctx: CanvasRenderingContext2D, k: KhungNhin, n: NguoiChoi, t: number,
  toi: NguoiChoi | undefined, khongLo: boolean,
): void {
  const [x, y] = mh(k, n.x, n.y)
  if (x < -200 || x > k.W + 200) return
  const s = (CAU_HINH.CAO_NHAN_VAT / CAO_CUC_BO) * k.ti * (khongLo ? 1.8 : 1)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  // nhấp nháy khi bất tử
  if (n.batTuDen > van_giay(t) && Math.floor(t / 90) % 2 === 0) ctx.globalAlpha = 0.45

  // ——— viền cảnh báo: nhảy lên đầu người này thì CHÍNH MÌNH mất mạng
  if (toi && n !== toi && CAU_HINH.HIEN_CANH_BAO_KHAC_CHE) {
    const muc = canhBaoDam(toi.hoaChat, n.hoaChat)
    if (muc !== 'an' && toi.y > n.y + CAU_HINH.CAO_NHAN_VAT * 0.4) {
      ctx.save()
      ctx.beginPath(); ctx.ellipse(0, -46, 54, 74, 0, 0, Math.PI * 2)
      ctx.strokeStyle = muc === 'biKhacChe' ? 'rgba(255,59,48,.92)' : 'rgba(255,138,61,.92)'
      ctx.lineWidth = 5; ctx.setLineDash([9, 7]); ctx.stroke()
      ctx.restore()
    }
  }

  if (khongLo) {
    // quầng hồng: nhìn một cái là biết đừng lại gần người này
    const g = ctx.createRadialGradient(0, -60, 10, 0, -60, 130)
    g.addColorStop(0, 'rgba(255,90,158,.34)'); g.addColorStop(1, 'rgba(255,90,158,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(0, -60, 130, 0, Math.PI * 2); ctx.fill()
  }
  veHocTro(ctx, { ...n.hocTro, ten: n.hoaChat, hoaChat: chatCua(n.hoaChat) }, n.tuThe, t, n.huong)
  // công thức: viền trắng dày để đọc được trên mọi nền
  ctx.save()
  ctx.textAlign = 'center'
  const laToi = n === toi
  ctx.font = laToi ? '800 30px "Baloo 2",system-ui,sans-serif' : '800 22px "Baloo 2",system-ui,sans-serif'
  ctx.lineWidth = laToi ? 7 : 5.5
  ctx.globalAlpha = laToi ? 1 : 0.88
  ctx.strokeStyle = 'rgba(255,255,255,.92)'
  ctx.strokeText(n.hoaChat, 0, -128)
  ctx.fillStyle = chatCua(n.hoaChat).mau === '#EDF2F8' ? '#8E9CB4' : chatCua(n.hoaChat).mau
  ctx.fillText(n.hoaChat, 0, -128)
  ctx.restore()
  ctx.globalAlpha = 1
  // mạng: to rõ trên đầu chính mình, nhỏ mờ trên đầu người khác
  ctx.save()
  if (n !== toi) { ctx.globalAlpha = 0.5; ctx.scale(0.72, 0.72) }
  veMang(ctx, n.mang, -158)
  ctx.restore()
  ctx.restore()
}

function chatCua(ct: string): { ct: string; mau: string } {
  const h = HOA_CHAT.find((c) => c.ct === ct)
  return { ct, mau: h?.mau ?? '#999' }
}

/** nhan-vat dùng mốc thời gian mili-giây; ván dùng giây. Đổi ở đúng một chỗ. */
let _giay = 0
export function datGiay(g: number): void { _giay = g }
function van_giay(_t: number): number { return _giay }

export function veVan(ctx: CanvasRenderingContext2D, van: VanChoi, W: number, H: number, t: number): void {
  const toi = van.nguoiThat
  const camX = toi ? toi.x : van.dao.dai / 2
  const k = tinhKhung(W, H, camX)
  datGiay(van.giay)

  troiVaDoi(ctx, k, t)
  nenVaBac(ctx, k, van)

  // ——— hang rồng
  const [xh, yh] = mh(k, van.dao.xHang, 0)
  if (xh > -400 && xh < k.W + 900) {
    // vách đá, rồi khoét một vòm tối làm cửa hang
    ctx.beginPath()
    ctx.moveTo(xh - 90 * k.ti, yh)
    ctx.quadraticCurveTo(xh + 260 * k.ti, yh - 560 * k.ti, xh + 610 * k.ti, yh)
    ctx.closePath(); ctx.fillStyle = '#7A6A86'; ctx.fill()
    ctx.beginPath()
    ctx.moveTo(xh + 120 * k.ti, yh)
    ctx.quadraticCurveTo(xh + 260 * k.ti, yh - 330 * k.ti, xh + 400 * k.ti, yh)
    ctx.closePath(); ctx.fillStyle = '#2A1F33'; ctx.fill()
  }

  // ——— rồng
  if (van.pha === 'trum' && van.rong.pha !== 'nga') {
    const [rx, ry] = mh(k, van.rong.x, van.rong.y)
    ctx.save(); ctx.translate(rx, ry); ctx.scale(-k.ti * 1.45, k.ti * 1.45)   // lật: rồng quay về phía người chơi
    // cường độ lửa 0..1: bùng lên rồi tắt dần trong 1,2 giây phun
    const manhLua = van.rong.pha === 'phun'
      ? Math.min(1, (CAU_HINH.GIAY_PHUN_LUA - van.rong.conLai) / 0.25) * Math.min(1, van.rong.conLai / 0.3)
      : 0
    veRong(ctx, t, Math.max(0, manhLua))
    ctx.restore()
    // bình hoá chất của rồng
    const d = dinhDauRong(van.rong)
    const [dx, dy] = mh(k, d.x + 40, 250)
    ctx.save(); ctx.textAlign = 'center'
    ctx.font = `800 ${Math.round(26 * k.ti)}px "Baloo 2",system-ui,sans-serif`
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'
    ctx.strokeText(van.rong.hoaChat, dx, dy)
    ctx.fillStyle = chatCua(van.rong.hoaChat).mau
    ctx.fillText(van.rong.hoaChat, dx, dy)
    ctx.restore()
    // cột đá để nấp
    const [cx, cy] = mh(k, van.rong.x - 290, 0)
    ctx.fillStyle = van.rong.cotConLai > 0 ? '#6C5B7B' : '#8A7A6A'
    ctx.fillRect(cx - 16 * k.ti, cy - 210 * k.ti, 32 * k.ti, 210 * k.ti)
  }

  // ——— công chúa
  const [cx2, cy2] = mh(k, van.xCongChua, 0)
  if (cx2 > -150 && cx2 < k.W + 150) {
    const nep = van.pha === 'trum' && van.rong.pha === 'phun' && van.rong.mau > 0
    ctx.save(); ctx.translate(cx2, cy2)
    ctx.scale(k.ti * 1.1 * (nep ? 1.1 : 1), k.ti * 1.1 * (nep ? 0.78 : 1))
    veCongChua(ctx, t)
    ctx.restore()
  }

  // hoa trước, quái sau, người sau cùng — người luôn nằm trên
  for (const h of van.hoa) {
    if (!h.conDo) continue
    const [hx, hy] = mh(k, h.x, h.y)
    if (hx < -80 || hx > k.W + 80) continue
    ctx.save(); ctx.translate(hx, hy); ctx.scale(k.ti, k.ti); veHoa(ctx, t); ctx.restore()
  }
  for (const q of van.quai) {
    if (!q.song) continue
    const [qx, qy] = mh(k, q.x, q.y)
    if (qx < -120 || qx > k.W + 120) continue
    ctx.save(); ctx.translate(qx, qy); ctx.scale(k.ti, k.ti); veQuai(ctx, q.kieu, q.huong, t); ctx.restore()
  }
  for (const n of van.nguoi) if (n.song) veNguoi(ctx, k, n, t, toi, van.khongLo(n))

  // ——— hạt và chữ bay
  const hu = van.hieuUng
  if (hu) {
    for (const h of hu.hat) {
      const [px, py] = mh(k, h.x, h.y)
      ctx.globalAlpha = Math.max(0, 1 - h.song / h.toiDa)
      ctx.beginPath(); ctx.arc(px, py, h.r * k.ti, 0, Math.PI * 2)
      ctx.fillStyle = h.mau; ctx.fill()
    }
    ctx.globalAlpha = 1
    for (const c of hu.chu) {
      const [px, py] = mh(k, c.x, c.y)
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - c.song / c.toiDa); ctx.textAlign = 'center'
      ctx.font = `900 ${Math.round(26 * k.ti)}px "Baloo 2",system-ui,sans-serif`
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.9)'
      ctx.strokeText(c.chu, px, py); ctx.fillStyle = c.mau; ctx.fillText(c.chu, px, py)
      ctx.restore()
    }
  }
}
