// HÌNH NƯỚNG SẴN của bản «Trang vở» — bé ma vô diện vẽ tay, 4 súng, đồ dùng học tập làm vật chặn, bụi nguệch ngoạc, hộp tiếp tế giấy nhớ, vết mực,
// cục giấy vo, Ma Mực (boss), bé ma Thầy. Mỗi hình nướng MỘT lần theo (cỡ, hệ số k); bé ma có 2 khung «nét rung» (vẽ tay sống), súng 1 khung.
import { mau, pha, type Bang, type Rgb } from './bang'
import { dat, duong, elip, gach, hcn, netTay, nguech, nuong, to, type Anh, type G, type P } from './net'

// ── Bé ma ──
export type Mu = 'tot-nghiep' | 'phu-thuy' | 'tai-nghe'
export type Ao = 'o-li' | 'sao-dem'
export interface KieuMa { mu?: Mu; ao?: Ao; thay?: boolean }
/** Hộp hình bé ma 70 × 84, neo ở điểm chạm đất (35, 72). Thân tâm ~ (35, 36). */
export const MA_W = 70, MA_H = 84, MA_OX = 35, MA_OY = 72

function hinhMa(): P[] {
  const cx = 35, cy = 30, R = 17, p: P[] = []
  for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; p.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]) }
  p.push([cx + R + 1, 44]); p.push([cx + R + 1, 51])
  for (let s = 0; s < 3; s++) {
    const xc = cx + R + 1 - 6 - 12 * s
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI; p.push([xc + Math.cos(a) * 6, 51 + Math.sin(a) * 7]) }
  }
  p.push([cx - R - 1, 44])
  return p
}
export const HINH_MA = hinhMa()

function ngon(g: G, b: Bang, doi: number, c: Rgb, nhat: Rgb, hat: number): void {
  const m = b.muc
  if (doi === 0) { // Natri: túm lửa nhỏ
    const p: P[] = [[35, 14], [31, 10], [32, 5], [35, 8], [37, 1], [40, 7], [39, 12]]
    to(g, p, c); netTay(g, b, p, { mau: m, day: 1.6, hat, bien: 0.8 })
  } else if (doi === 1) { // Kali: hai tai nhọn
    for (const s of [-1, 1]) { const p: P[] = [[35 + s * 5, 15], [35 + s * 12, 3], [35 + s * 14, 16]]; to(g, p, nhat); netTay(g, b, p, { mau: m, day: 1.6, hat: hat + s, bien: 0.8 }) }
  } else if (doi === 2) { // Đồng: râu ăng-ten có quả cầu
    netTay(g, b, [[36, 14], [38, 8], [41, 4]], { mau: m, day: 1.6, hat, kin: false, bien: 0.6 })
    const q = elip(42, 3, 3.6, 3.6, 12); to(g, q, c); netTay(g, b, q, { mau: m, day: 1.4, hat: hat + 3, bien: 0.5 })
  } else { // Canxi: nơ bên đầu
    for (const s of [-1, 1]) { const p: P[] = [[44, 15], [44 + s * 8, 9], [44 + s * 8, 19]]; to(g, p, c); netTay(g, b, p, { mau: m, day: 1.4, hat: hat + s, bien: 0.6 }) }
    const q = elip(44, 14, 2.4, 2.4, 10); to(g, q, nhat); netTay(g, b, q, { mau: m, day: 1.2, hat, bien: 0.3 })
  }
}

function veMu(g: G, b: Bang, mu: Mu, hat: number): void {
  const m = b.muc
  if (mu === 'tot-nghiep') {
    const tren: P[] = [[20, 12], [35, 5], [50, 12], [35, 18]]; to(g, tren, pha(b.muc, b.giay, b.toi ? 0.7 : 0.15)); netTay(g, b, tren, { mau: m, day: 1.6, hat, bien: 0.6 })
    netTay(g, b, [[48, 12], [52, 22]], { mau: b.sao, day: 2.2, hat: hat + 1, kin: false, bien: 0.4 })
  } else if (mu === 'phu-thuy') {
    const non: P[] = [[23, 16], [33, -6], [37, -10], [36, -4], [47, 16]]; to(g, non, pha(b.hs, b.muc, 0.35)); netTay(g, b, non, { mau: m, day: 1.6, hat, bien: 0.7 })
    const vanh = elip(35, 16, 18, 4, 18); to(g, vanh, pha(b.hs, b.muc, 0.45)); netTay(g, b, vanh, { mau: m, day: 1.4, hat: hat + 2, bien: 0.5 })
    to(g, elip(33, 4, 2, 2, 8), b.sao)
  } else {
    netTay(g, b, [[19, 30], [21, 15], [35, 9], [49, 15], [51, 30]], { mau: m, day: 2.6, hat, kin: false, bien: 0.5 })
    for (const x of [17, 53]) { const q = elip(x, 31, 4, 6, 12); to(g, q, b.sai); netTay(g, b, q, { mau: m, day: 1.3, hat: hat + x, bien: 0.4 }) }
  }
}

/** Nướng một khung bé ma. `khung` 0 / 1 = hai lượt nét rung; `trai` = quay trái. */
export function nuongMa(b: Bang, k: number, doi: number, trai: boolean, khung: number, kieu: KieuMa = {}): Anh {
  const doiMau = kieu.thay ? b.hs : b.doi[doi]
  const ao = kieu.ao === 'sao-dem' ? pha(b.hs, b.toi ? b.giay : b.muc, 0.45) : pha(doiMau, b.giay, b.toi ? 0.18 : 0.42)
  const mat = kieu.thay ? pha(b.hs, b.toi ? b.giay : b.muc, 0.35) : doiMau
  const hat = doi * 31 + khung * 7 + (trai ? 3 : 0) + (kieu.thay ? 101 : 0)
  return nuong(MA_W, MA_H, k, MA_OX, MA_OY, (g) => {
    if (trai) { g.translate(MA_W, 0); g.scale(-1, 1) }
    // tay nhỏ
    for (const [x, y] of [[16, 40], [54, 38]] as P[]) { const q = elip(x, y, 4.2, 3.4, 12); to(g, q, ao); netTay(g, b, q, { mau: b.muc, day: 1.4, hat: hat + x, bien: 0.5 }) }
    to(g, HINH_MA, ao)
    if (kieu.ao === 'o-li') { g.save(); duong(g, HINH_MA, true); g.clip(); g.beginPath(); for (let x = 18; x < 54; x += 6) { g.moveTo(x, 10); g.lineTo(x, 60) } for (let y = 14; y < 60; y += 6) { g.moveTo(14, y); g.lineTo(56, y) } g.strokeStyle = mau(b.tin, 0.45); g.lineWidth = 0.7; g.stroke(); g.restore() }
    if (kieu.ao === 'sao-dem') for (const [x, y] of [[24, 40], [44, 46], [30, 52], [47, 34]] as P[]) { g.fillStyle = mau(b.sao); g.fillRect(x - 1, y - 1, 2.2, 2.2) }
    // bóng dạ ở vạt dưới bên trái
    g.save(); duong(g, HINH_MA, true); g.clip(); gach(g, elip(24, 50, 14, 9, 16), pha(doiMau, b.muc, 0.35), 0.28, 3.6, -0.85, 1.1, hat); g.restore()
    // mặt vô diện màu đội (lệch về phía nhìn)
    const matP = elip(38, 30, 10.5, 8.6, 22); to(g, matP, mat)
    gach(g, matP, pha(mat, b.muc, 0.3), 0.25, 3.2, 0.7, 0.9, hat + 5)
    netTay(g, b, matP, { mau: b.muc, day: 1.3, hat: hat + 9, bien: 0.5 })
    netTay(g, b, [[29, 25], [32, 23]], { mau: b.giay, day: 1.8, hat: hat + 4, kin: false, bien: 0.2, a: 0.9 })
    netTay(g, b, HINH_MA, { mau: b.muc, day: 2, hat, bien: 1.3 })
    if (!kieu.thay) ngon(g, b, doi, doiMau, pha(doiMau, b.giay, 0.5), hat + 11)
    if (kieu.mu) veMu(g, b, kieu.mu, hat + 13)
    if (kieu.thay) { // kính của Thầy trên khuôn mặt trống
      for (const x of [33, 44]) { const q = elip(x, 30, 4.4, 3.6, 14); g.fillStyle = mau(b.giay, 0.35); duong(g, q, true); g.fill(); netTay(g, b, q, { mau: b.muc, day: 1.4, hat: hat + x, bien: 0.3 }) }
      netTay(g, b, [[37.4, 30], [39.6, 30]], { mau: b.muc, day: 1.2, hat, kin: false, bien: 0.1 })
    }
  })
}

// ── Súng: 6 cấp (thầy 13/11 «cho tới 6 khẩu súng nhé, thiết kế đẹp vào, đạn cũng xịn nữa»), hướng phải, neo ở tay cầm (6, 13) ──
export const SUNG_TEN6 = ['Súng Hạt', 'Súng Đôi', 'Súng Bọt', 'Súng Sấm', 'Súng Lửa Màu', 'Pháo Sao'] as const
export const SUNG_DAI = [30, 38, 41, 46, 48, 51]
function saoP(cx: number, cy: number, r1: number, r2: number): P[] { const p: P[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? r2 : r1; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) } return p }
export function nuongSung(b: Bang, k: number, doi: number, cap: number, kieu: { butDo?: boolean } = {}): Anh {
  const c = b.doi[doi], than = b.toi ? pha(c, b.chu, 0.3) : pha(c, b.giay, 0.5), dam = pha(c, b.toi ? [0, 0, 0] : b.muc, 0.32), m = b.muc, hat = doi * 13 + cap * 5
  const sat = pha(b.giay, m, b.toi ? 0.35 : 0.55), sang = pha(b.giay, b.chu, b.toi ? 0.85 : 0)
  return nuong(60, 34, k, 6, 15, (g) => {
    g.translate(0, 2)
    const ve = (p: P[], f: Rgb, h: number, a = 1) => { to(g, p, f, a); netTay(g, b, p, { mau: m, day: 1.4, hat: hat + h, bien: 0.45 }) }
    const bong = (x: number, y: number, w: number) => netTay(g, b, [[x, y], [x + w, y]], { mau: sang, day: 1.6, hat: hat + 30, kin: false, bien: 0.2, a: 0.75 })
    if (kieu.butDo) { // bút đỏ của Thầy
      ve(hcn(2, 8, 34, 8, 3), b.sai, 1); ve([[36, 8], [46, 12], [36, 16]], pha(b.sai, b.giay, 0.5), 2); ve(hcn(6, 6, 10, 12, 2), pha(b.sai, b.muc, 0.35), 3)
      return
    }
    ve([[6, 15], [12, 15], [11, 26], [5, 26]], dam, 1) // báng cầm
    if (cap === 1) { // Súng Hạt: gọn, một nòng, kính ngắm tròn
      ve(hcn(19, 7, 11, 5, 2), sat, 2); ve(hcn(2, 4, 19, 11, 4), than, 3); ve(hcn(5, 7.5, 11, 3.5, 1.5), c, 4)
      ve(elip(13, 3, 3, 2.4, 10), sat, 5); bong(5, 5.6, 9)
    }
    if (cap === 2) { // Súng Đôi: hai nòng song song, khe tản nhiệt
      ve(hcn(21, 3.5, 17, 4, 1.5), sat, 2); ve(hcn(21, 10.5, 17, 4, 1.5), sat, 3); ve(hcn(2, 2, 21, 15, 4), than, 4)
      for (const x of [6, 10, 14]) ve(hcn(x, 5, 2, 9, 1), dam, 5 + x)
      ve(hcn(17, 6, 4, 7, 1), c, 6); bong(4, 3.6, 14)
    }
    if (cap === 3) { // Súng Bọt: bình bọt khí trong suốt trên lưng, loa phun
      ve([[23, 8], [35, 4], [41, 6], [41, 18], [35, 20], [23, 16]], sat, 2); ve(hcn(2, 7, 23, 11, 4), than, 3)
      const binh = elip(13, 2, 8, 6.5, 18); ve(binh, pha(c, b.giay, 0.72), 4, 0.9)
      for (const [x, y, r] of [[10, 3, 1.8], [15, 0, 1.3], [14, 5, 1.1], [17, 3, 0.9]] as [number, number, number][]) netTay(g, b, elip(x, y, r, r, 8), { mau: c, day: 1, hat: hat + x, bien: 0.1 })
      for (const x of [38, 41]) netTay(g, b, elip(x, 12, 2, 2, 8), { mau: c, day: 1, hat: hat + x, bien: 0.1, a: 0.7 })
      bong(5, 9.4, 14)
    }
    if (cap === 4) { // Súng Sấm: cuộn dây đồng ba vòng, ăng-ten tóe điện
      ve(hcn(22, 7.5, 24, 4.5, 1.5), sat, 2)
      for (const x of [27, 33, 39]) netTay(g, b, elip(x, 9.7, 2.6, 6.4, 12), { mau: b.sao, day: 2.2, hat: hat + x, bien: 0.25 })
      ve(hcn(1, 2, 23, 15, 5), than, 3); ve([[10, 4], [6.5, 10.5], [11, 10.5], [8, 16], [16, 8.5], [11.5, 8.5], [13.5, 4]], b.sao, 4)
      netTay(g, b, [[18, 2], [21, -4]], { mau: m, day: 1.4, hat, kin: false, bien: 0.2 }); ve(elip(21.5, -5, 2, 2, 8), b.sao, 5)
      bong(4, 3.8, 6)
    }
    if (cap === 5) { // Súng Lửa Màu: bình nhiên liệu màu đội, vòi phun, ngọn lửa mồi đúng màu thử ngọn lửa của nguyên tố đội
      ve(hcn(22, 6, 18, 7, 2), sat, 2); ve([[39, 4], [47, 1.5], [47, 17.5], [39, 15]], dam, 3)
      ve(hcn(2, 3, 22, 13, 5), than, 4); ve(hcn(9, 15, 15, 8, 3), c, 5); bong(11, 17, 8)
      const lua: P[] = [[48, 9.5], [53, 4], [52, 8], [57, 6], [54, 11], [57, 14], [52, 13], [53, 16]]; to(g, lua, c); to(g, [[49, 9.5], [52, 7.5], [53.5, 10], [52, 12]], b.sao)
      netTay(g, b, lua, { mau: m, day: 1.1, hat: hat + 40, bien: 0.3, a: 0.8 })
      ve([[7, 6], [5, 10], [8, 9], [7, 13], [11, 8], [8.5, 8.5]], b.sao, 6); bong(13, 5, 8)
    }
    if (cap === 6) { // Pháo Sao: nòng loe ba vòng đai, sao lớn giữa thân, đinh tán
      ve([[31, 1], [49, -3], [51, 9.5], [49, 22], [31, 18]], pha(c, b.giay, 0.35), 2)
      for (const x of [35, 41, 47]) netTay(g, b, [[x, -1 + (x - 35) * -0.2], [x, 20 + (x - 35) * 0.2]], { mau: m, day: 1.3, hat: hat + x, kin: false, bien: 0.2, a: 0.7 })
      ve(hcn(0, -1, 33, 21, 8), c, 3); ve(saoP(16, 9.5, 7.5, 3.2), b.sao, 4)
      for (const [x, y] of [[4, 2], [28, 2], [4, 17], [28, 17]] as P[]) to(g, elip(x, y, 1.3, 1.3, 6), m)
      bong(5, 1.6, 20)
    }
  })
}

// ── Vật chặn = đồ dùng học tập (có bóng đổ nướng sẵn) ──
export type LoaiVat = 'thuoc' | 'butChi' | 'butDa' | 'tay'
export function loaiTuong(w: number, h: number, i: number): LoaiVat {
  const r = Math.max(w, h) / Math.min(w, h)
  return r >= 2.4 ? (i % 2 ? 'butChi' : 'thuoc') : 'butDa'
}
const BONG = 10
/** Chiều cao khối nổi (đơn vị sân): mặt trên nâng lên, mặt trước tối hơn lộ ra ở dưới ⇒ 2D mà có khối 3D (thầy 13/11 «vẫn là 2d nhưng vẽ đổ bóng 3d»). */
export const CAO_VAT = 16
export function mauVat(b: Bang, loai: LoaiVat): Rgb {
  return loai === 'thuoc' ? pha(b.giay, b.tin, b.toi ? 0.32 : 0.22) : loai === 'butChi' ? b.sao : loai === 'butDa' ? pha(b.giay, b.tin, b.toi ? 0.5 : 0.35) : pha(b.giay, b.tin, 0.55)
}
export function nuongVat(b: Bang, k: number, loai: LoaiVat, w: number, h: number, hat: number): Anh {
  const doc = h > w, cao = loai === 'tay' ? 20 : CAO_VAT, chinh = mauVat(b, loai), toi = b.toi ? [0, 0, 0] as Rgb : b.bong
  return nuong(w + BONG + 8, h + cao + BONG + 8, k, 2, 2 + cao, (g) => {
    g.translate(2, 2)
    // bóng đổ trên trang, tính từ chân khối (hai lớp mềm)
    to(g, hcn(BONG * 0.45, cao + BONG * 0.45, w, h, 6), b.bong, b.bongA * 0.75); to(g, hcn(BONG, cao + BONG, w, h, 9), b.bong, b.bongA * 0.5)
    // mặt trước của khối: tối hơn, có vân dọc
    const truoc = hcn(0, h * 0.4, w, h * 0.6 + cao, 6); to(g, truoc, pha(chinh, toi, 0.42))
    g.save(); duong(g, truoc, true); g.clip(); g.beginPath(); for (let x = 7; x < w; x += 9) { g.moveTo(x, h); g.lineTo(x - 3, h + cao) } g.strokeStyle = mau(toi, 0.18); g.lineWidth = 1.2; g.stroke(); g.restore()
    netTay(g, b, truoc, { mau: b.muc, day: 1.8, hat: hat + 20, bien: 0.8 })
    // mặt trên (nội dung đồ vật)
    if (doc) { g.translate(w, 0); g.rotate(Math.PI / 2) }
    const L = doc ? h : w, R = doc ? w : h, m = b.muc
    const net = (p: P[], d = 1.8, h2 = 0) => netTay(g, b, p, { mau: m, day: d, hat: hat + h2, bien: 0.9 })
    if (loai === 'thuoc') {
      const p = hcn(0, 0, L, R, 3); to(g, p, pha(b.giay, b.tin, b.toi ? 0.32 : 0.22), 0.94)
      g.beginPath(); for (let x = 6; x < L - 3; x += 6) { const dai = x % 30 < 6 ? R * 0.42 : R * 0.22; g.moveTo(x, 0); g.lineTo(x, dai) } g.strokeStyle = mau(m, 0.55); g.lineWidth = 1; g.stroke()
      g.fillStyle = mau(m, 0.5); g.font = `${Math.round(R * 0.26)}px "Patrick Hand", sans-serif`; for (let x = 30, n = 1; x < L - 8; x += 30, n++) g.fillText(String(n), x - 3, R * 0.78)
      net(p)
    } else if (loai === 'butChi') {
      const than = hcn(R * 0.9, 0, L - R * 1.9, R, 2); to(g, than, b.sao)
      g.beginPath(); g.moveTo(R * 0.9, R / 3); g.lineTo(L - R, R / 3); g.moveTo(R * 0.9, (R * 2) / 3); g.lineTo(L - R, (R * 2) / 3); g.strokeStyle = mau(pha(b.sao, m, 0.35), 0.7); g.lineWidth = 1.2; g.stroke()
      const tay = hcn(0, 2, R * 0.62, R - 4, 5); to(g, tay, pha(b.sai, b.giay, 0.45)); net(tay, 1.6, 1)
      const dai = hcn(R * 0.55, 0, R * 0.4, R, 1); to(g, dai, pha(b.giay, m, 0.3)); net(dai, 1.4, 2)
      const go: P[] = [[L - R, 0], [L - R * 0.18, R / 2], [L - R, R]]; to(g, go, pha(b.sao, m, b.toi ? 0.15 : 0.35)); net(go, 1.6, 3)
      const ngoi: P[] = [[L - R * 0.42, R * 0.34], [L - R * 0.05, R / 2], [L - R * 0.42, R * 0.66]]; to(g, ngoi, b.toi ? pha(m, b.giay, 0.4) : m)
      net(than, 1.8, 4)
    } else if (loai === 'butDa') {
      const than = hcn(0, 0, L * 0.72, R, 8); to(g, than, pha(b.giay, b.tin, b.toi ? 0.5 : 0.35))
      const nap = hcn(L * 0.68, 1, L * 0.32, R - 2, 7); to(g, nap, b.tin)
      gach(g, nap, pha(b.tin, m, 0.4), 0.3, 3.5, 0.9, 1, hat)
      g.beginPath(); g.moveTo(L * 0.74, R * 0.5); g.lineTo(L * 0.96, R * 0.5); g.strokeStyle = mau(m, 0.5); g.lineWidth = 2; g.stroke()
      net(than, 1.8, 5); net(nap, 1.6, 6)
    } else {
      const p = hcn(0, 0, L, R, 7); to(g, p, b.giay)
      const nua = hcn(0, 0, L * 0.58, R, 7); to(g, nua, pha(b.giay, b.tin, 0.55))
      const bao = hcn(L * 0.34, -1, L * 0.3, R + 2, 1); to(g, bao, pha(b.giay, b.sao, 0.35)); netTay(g, b, bao, { mau: m, day: 1.2, hat: hat + 8, bien: 0.5, a: 0.7 })
      net(p, 1.8, 7)
    }
    const L2 = doc ? h : w
    netTay(g, b, [[4, 2.5], [L2 - 6, 2.5]], { mau: b.toi ? b.muc : b.giay, day: 1.6, hat: hat + 21, kin: false, bien: 0.3, a: 0.45 })
  })
}

/** Bụi = đám mây nguệch ngoạc bút dạ xanh (bóng đổ thấp). */
export function nuongBui(b: Bang, k: number, w: number, h: number, hat: number): Anh {
  const xanh = b.doi[2], cx = w / 2 + 4, cy = h / 2 + 4
  const p: P[] = []
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 1 + 0.09 * Math.sin(a * 7 + hat) + 0.05 * Math.sin(a * 3); p.push([cx + Math.cos(a) * (w / 2) * r, cy + Math.sin(a) * (h / 2) * r]) }
  return nuong(w + 18, h + 30, k, 4, 4, (g) => {
    to(g, p.map(([x, y]) => [x + 7, y + 16] as P), b.bong, b.bongA * 0.8)
    const day = p.map(([x, y]) => [x, y + 11] as P); to(g, day, pha(xanh, b.toi ? [0, 0, 0] : b.bong, 0.45)); netTay(g, b, day, { mau: pha(xanh, b.muc, b.toi ? 0 : 0.45), day: 2, hat: hat + 2, bien: 1.2, a: 0.8 })
    to(g, p, pha(xanh, b.giay, b.toi ? 0.4 : 0.55), 1)
    nguech(g, p, pha(xanh, b.muc, b.toi ? 0 : 0.25), 0.45, 5, 2.2, hat)
    netTay(g, b, p, { mau: pha(xanh, b.muc, b.toi ? 0 : 0.45), day: 2.2, hat: hat + 1, bien: 1.4 })
  })
}

// ── Hộp tiếp tế = giấy nhớ có hình vẽ: máu · khiên · chạy nhanh · Pháo Sao ──
export type LoaiHop = 'mau' | 'khien' | 'nhanh' | 'sao'
export const TEN_HOP: Record<LoaiHop, string> = { mau: 'Hồi đầy máu', khien: 'Khiên 5 giây', nhanh: 'Chạy nhanh 6 giây', sao: 'Pháo Sao 10 giây' }
export function mauHop(b: Bang, l: LoaiHop): Rgb { return l === 'mau' ? b.dung : l === 'khien' ? b.tin : l === 'nhanh' ? b.sao : b.sai }
export function veBieuTuong(g: G, b: Bang, l: LoaiHop, cx: number, cy: number, s: number, hat: number): void {
  const m = b.muc, net = (p: P[], kin = true) => netTay(g, b, p, { mau: m, day: 1.8 * s, hat, bien: 0.5, kin })
  if (l === 'mau') { const p: P[] = [[-3, -9], [3, -9], [3, -3], [9, -3], [9, 3], [3, 3], [3, 9], [-3, 9], [-3, 3], [-9, 3], [-9, -3], [-3, -3]].map(([x, y]) => [cx + x * s, cy + y * s]); to(g, p, b.giay); net(p) }
  if (l === 'khien') { const p: P[] = [[0, -10], [9, -6], [8, 3], [0, 10], [-8, 3], [-9, -6]].map(([x, y]) => [cx + x * s, cy + y * s]); to(g, p, b.giay); net(p) }
  if (l === 'nhanh') { const p: P[] = [[2, -11], [-7, 1], [-1, 1], [-3, 11], [7, -2], [1, -2]].map(([x, y]) => [cx + x * s, cy + y * s]); to(g, p, b.giay); net(p) }
  if (l === 'sao') { const p: P[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = (i % 2 ? 4.5 : 10.5) * s; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) } to(g, p, b.giay); net(p) }
}
export function nuongHop(b: Bang, k: number, l: LoaiHop): Anh {
  return nuong(52, 56, k, 26, 30, (g) => {
    to(g, hcn(12, 20, 40, 34, 2), b.bong, b.bongA * 1.3)
    const truoc = hcn(6, 30, 40, 22, 2); to(g, truoc, pha(mauHop(b, l), b.toi ? [0, 0, 0] : b.bong, 0.42)); netTay(g, b, truoc, { mau: b.muc, day: 1.6, hat: 6, bien: 0.6 })
    const p = hcn(6, 6, 40, 38, 2)
    to(g, p, mauHop(b, l)); gach(g, p, pha(mauHop(b, l), b.muc, 0.25), 0.18, 4, 0.8, 1, 3)
    to(g, [[34, 44], [46, 44], [46, 32]], pha(mauHop(b, l), b.giay, 0.45))
    netTay(g, b, p, { mau: b.muc, day: 1.8, hat: 5, bien: 0.7 })
    const bang = hcn(16, 0, 20, 10, 1); to(g, bang, pha(b.giay, b.sao, 0.3), 0.75); netTay(g, b, bang, { mau: b.muc, day: 1, hat: 9, bien: 0.4, a: 0.5 })
    veBieuTuong(g, b, l, 26, 25, 1.05, 11)
  })
}

// ── Hiệu ứng nhỏ ──
export function nuongVetMuc(b: Bang, k: number, doi: number, hat: number): Anh {
  const p: P[] = []
  for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2, r = 11 + Math.sin(a * 5 + hat) * 3.5 + Math.sin(a * 9 + hat * 2) * 1.6; p.push([22 + Math.cos(a) * r, 22 + Math.sin(a) * r]) }
  return nuong(44, 44, k, 22, 22, (g) => {
    to(g, p, b.doi[doi], 0.55)
    for (let i = 0; i < 4; i++) { const a = hat + i * 1.7; to(g, elip(22 + Math.cos(a) * 18, 22 + Math.sin(a) * 18, 2.2, 2.2, 8), b.doi[doi], 0.5) }
  })
}
export function nuongGiayVo(b: Bang, k: number): Anh {
  return nuong(30, 30, k, 15, 15, (g) => {
    const p = elip(15, 15, 11, 10, 14).map(([x, y], i) => [x + (i % 2 ? 1.6 : -1.2), y + (i % 3 ? 1 : -1.4)] as P)
    to(g, p, b.giay); netTay(g, b, p, { mau: b.muc, day: 1.5, hat: 3, bien: 0.5 })
    netTay(g, b, [[9, 10], [15, 16], [21, 12]], { mau: b.muc, day: 1, hat: 4, kin: false, a: 0.6, bien: 0.3 })
    netTay(g, b, [[12, 21], [17, 17]], { mau: b.muc, day: 1, hat: 5, kin: false, a: 0.6, bien: 0.3 })
  })
}
export function nuongLua(b: Bang, k: number, doi: number): Anh {
  return nuong(20, 28, k, 10, 26, (g) => {
    const p: P[] = [[10, 26], [3, 18], [5, 10], [8, 13], [9, 3], [14, 11], [16, 8], [17, 18]]
    to(g, p, b.doi[doi]); to(g, [[10, 24], [7, 19], [10, 13], [13, 19]], b.sao)
    netTay(g, b, p, { mau: b.muc, day: 1.5, hat: 7, bien: 0.5 })
  })
}
export function nuongVuongMien(b: Bang, k: number): Anh {
  return nuong(34, 24, k, 17, 22, (g) => {
    const p: P[] = [[4, 20], [3, 6], [10, 13], [17, 3], [24, 13], [31, 6], [30, 20]]
    to(g, p, b.sao); gach(g, p, pha(b.sao, b.muc, 0.3), 0.25, 3, 0.8, 1, 2); netTay(g, b, p, { mau: b.muc, day: 1.6, hat: 8, bien: 0.5 })
    for (const x of [10, 17, 24]) to(g, elip(x, 16, 1.8, 1.8, 8), b.sai)
  })
}
export function nuongSao(b: Bang, k: number, c: Rgb): Anh {
  return nuong(24, 24, k, 12, 12, (g) => {
    const p: P[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 4.2 : 10; p.push([12 + Math.cos(a) * r, 12 + Math.sin(a) * r]) }
    to(g, p, c); netTay(g, b, p, { mau: b.muc, day: 1.4, hat: 2, bien: 0.3 })
  })
}

/** Ma Mực (boss giữa ván): vũng mực khổng lồ có vạt tua, vô diện như bé ma. Hộp 240 × 220, neo (120, 200). */
export function nuongMaMuc(b: Bang, k: number, khung: number): Anh {
  const muc = b.toi ? pha(b.hs, b.giay, 0.2) : pha(b.hs, b.muc, 0.55)
  return nuong(240, 220, k, 120, 200, (g) => {
    const cx = 120, cy = 95, p: P[] = []
    for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI; p.push([cx + Math.cos(a) * 82, cy + Math.sin(a) * 78]) }
    for (let t = 0; t <= 6; t++) { const x = cx + 82 - (164 * t) / 6; p.push([x, 150 + (t % 2 ? 22 : 0) + Math.sin(t + khung) * 4]) }
    to(g, p, muc)
    gach(g, p, pha(muc, b.giay, 0.3), 0.18, 7, -0.8, 2, khung)
    for (const [x, d] of [[70, 34], [118, 52], [165, 28]]) { const q: P[] = [[x - 6, 168], [x + 6, 168], [x + 3, 168 + d], [x - 3, 168 + d]]; to(g, q, muc) }
    const mat = elip(cx + 6, cy - 2, 44, 34, 26); to(g, mat, pha(muc, b.sai, 0.35))
    netTay(g, b, mat, { mau: b.toi ? b.muc : b.giay, day: 2, hat: 4 + khung, bien: 1, a: 0.6 })
    netTay(g, b, [[70, 60], [84, 46], [100, 40]], { mau: b.giay, day: 4, hat: 3, kin: false, bien: 0.5, a: 0.7 })
    netTay(g, b, p, { mau: b.toi ? b.muc : pha(b.muc, b.hs, 0.2), day: 3.4, hat: 9 + khung, bien: 2.4 })
  })
}

export { dat }
