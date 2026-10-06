// LÕI THUẦN của mini-game phòng chờ "Bắn nguyên tố" — KHÔNG đụng DOM/canvas.
// Nhận `rng` và `dt` từ ngoài nên test được tất định. Lớp canvas/React (BanNguyenTo.tsx) chỉ vẽ và chuyển thao tác vào đây.
// Luật đã chốt: tàu tự bắn, không có thua (hạt chạm đáy chỉ mờ đi), điểm chỉ để vui,
// tối đa 6 hạt và 12 viên đạn cùng lúc, vật phẩm Xúc tác bắn nhanh gấp đôi, giảm chuyển động thì hạt đứng yên và em chạm để bắn vỡ.

export type NhomHat = 'electron' | 'proton' | 'phan-tu' | 'ion'
export type Rng = () => number

export interface LoaiHat {
  ma: string
  kyHieu: string
  /** Tên hiện ở thẻ "Vừa khám phá". */
  ten: string
  diem: number
  /** Số lần bắn để vỡ. */
  soLanBan: number
  nhom: NhomHat
  /** Bề ngang ô hạt (px logic). */
  rong: number
  dieuThuVi: string
}

/** Sáu hạt giữ đúng điểm và điều thú vị của game cũ. Thứ tự cố định: seed và test dựa vào chỉ số. */
export const LOAI_HAT: readonly LoaiHat[] = [
  { ma: 'h2o', kyHieu: 'H₂O', ten: 'Nước (H₂O)', diem: 20, soLanBan: 2, nhom: 'phan-tu', rong: 64, dieuThuVi: 'Giữa các phân tử nước có thể hình thành liên kết hydrogen.' },
  { ma: 'e', kyHieu: 'e⁻', ten: 'Electron', diem: 10, soLanBan: 1, nhom: 'electron', rong: 52, dieuThuVi: 'Electron mang điện tích âm và chuyển động quanh hạt nhân.' },
  { ma: 'p', kyHieu: 'p⁺', ten: 'Proton', diem: 10, soLanBan: 1, nhom: 'proton', rong: 52, dieuThuVi: 'Số proton trong hạt nhân bằng số hiệu nguyên tử Z.' },
  { ma: 'co2', kyHieu: 'CO₂', ten: 'Carbon dioxide (CO₂)', diem: 25, soLanBan: 2, nhom: 'phan-tu', rong: 64, dieuThuVi: 'Dẫn CO₂ vào nước vôi trong dư sẽ tạo kết tủa trắng.' },
  { ma: 'etanol', kyHieu: 'C₂H₅OH', ten: 'Ethanol (C₂H₅OH)', diem: 30, soLanBan: 3, nhom: 'phan-tu', rong: 96, dieuThuVi: 'Ethanol phản ứng với sodium, giải phóng khí hydrogen.' },
  { ma: 'fe3', kyHieu: 'Fe³⁺', ten: 'Ion sắt(III) (Fe³⁺)', diem: 35, soLanBan: 3, nhom: 'ion', rong: 68, dieuThuVi: 'Ion Fe³⁺ gặp ion OH⁻ tạo kết tủa nâu đỏ Fe(OH)₃.' },
]

/** Mọi hằng số chỉnh game nằm một chỗ. */
export const HANG = {
  toiDaHat: 6,
  toiDaDan: 12,
  /** Cách nhau giữa hai viên đạn (giây); Xúc tác chia đôi. */
  chuKyBan: 0.34,
  vanTocDan: 380,
  /** Xúc tác: bắn nhanh gấp đôi trong ngần này giây. */
  xucTacGiay: 6,
  /** Cứ ngần này hạt vỡ thì có một vật phẩm Xúc tác rơi ra. */
  moiXucTac: 8,
  vanTocXucTac: 90,
  chuKySinhHat: 1.8,
  /** Hạt xuống tới (cao − số này) thì bắt đầu mờ. */
  vachMo: 120,
  giayMo: 1,
  /** Quá ngần này giây không vỡ hạt nào thì "Liên tiếp" về 0. */
  hetLienTiep: 2.5,
  tuoiTiaVo: 0.65,
  banKinhHungXucTac: 34,
  /** Bề cao ô hạt (nửa bề cao = 22). */
  caoHat: 44,
  nuaDan: 9,
} as const

export interface Hat { id: number; loai: number; x: number; y: number; vx: number; vy: number; hp: number; mo: number }
export interface Dan { x: number; y: number }
export interface TiaVo { x: number; y: number; tuoi: number; diem: number }
export interface VatPham { x: number; y: number }

export interface TrangThai {
  rong: number
  cao: number
  giam: boolean
  tauX: number
  tauY: number
  /** Vị trí tàu muốn tới, tỉ lệ 0..1 theo bề ngang. */
  mucTieu: number
  hat: Hat[]
  dan: Dan[]
  tia: TiaVo[]
  vatPham: VatPham[]
  diem: number
  soVo: number
  lienTiep: number
  sauVoLanCuoi: number
  xucTacCon: number
  daBan: number
  tichBan: number
  tichSinh: number
  daKham: number[]
  /** Chỉ số loại hạt vừa vỡ (-1 chưa có). */
  gan: number
  /** Tăng mỗi khi một con số hiển thị đổi: lớp React chỉ setState khi số này đổi. */
  bien: number
  idKe: number
}

/** Vị trí hạt mở màn theo bản vẽ (340 × 352), dạng tỉ lệ. [loại, x, y] */
const MO_MAN: ReadonlyArray<readonly [number, number, number]> = [[0, 62, 70], [1, 168, 44], [5, 272, 86], [2, 110, 150], [3, 234, 168]]
/** Chỗ đứng của hạt khi giảm chuyển động. */
const CHO_TINH: ReadonlyArray<readonly [number, number]> = [[80, 74], [190, 56], [270, 122], [70, 170], [196, 192]]
const GOC_RONG = 340
const GOC_CAO = 352

const kep = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function taoHat(tt: TrangThai, loai: number, x: number, y: number, rng: Rng): Hat {
  const dau = rng() < 0.5 ? -1 : 1
  return { id: tt.idKe++, loai, x, y, vx: tt.giam ? 0 : dau * (6 + rng() * 10), vy: tt.giam ? 0 : 20 + rng() * 12, hp: LOAI_HAT[loai].soLanBan, mo: 1 }
}

export function taoTrangThai(rong: number, cao: number, giam: boolean, rng: Rng): TrangThai {
  const tt: TrangThai = {
    rong, cao, giam, tauX: rong / 2, tauY: cao - 22, mucTieu: 0.5, hat: [], dan: [], tia: [], vatPham: [],
    diem: 0, soVo: 0, lienTiep: 0, sauVoLanCuoi: 0, xucTacCon: 0, daBan: 0, tichBan: 0, tichSinh: 0, daKham: [], gan: -1, bien: 0, idKe: 1,
  }
  if (giam) {
    CHO_TINH.forEach(([x, y], i) => tt.hat.push(taoHat(tt, i === 0 ? 0 : (i * 2 + 1) % LOAI_HAT.length, x / GOC_RONG * rong, y / GOC_CAO * cao, rng)))
  } else {
    MO_MAN.forEach(([loai, x, y]) => tt.hat.push(taoHat(tt, loai, x / GOC_RONG * rong, y / GOC_CAO * cao, rng)))
  }
  return tt
}

/** Đổi cỡ sân: dời mọi thứ theo tỉ lệ để không văng ra ngoài. */
export function datKichThuoc(tt: TrangThai, rong: number, cao: number): void {
  if (!(rong > 0) || !(cao > 0)) return
  const kx = rong / tt.rong, ky = cao / tt.cao
  for (const h of tt.hat) { h.x *= kx; h.y *= ky }
  for (const d of tt.dan) { d.x *= kx; d.y *= ky }
  for (const v of tt.vatPham) { v.x *= kx; v.y *= ky }
  for (const t of tt.tia) { t.x *= kx; t.y *= ky }
  tt.rong = rong; tt.cao = cao; tt.tauX = tt.mucTieu * rong; tt.tauY = cao - 22
}

/** Đặt chỗ tàu muốn tới, tỉ lệ 0..1. */
export function dichTau(tt: TrangThai, tyLe: number): void { tt.mucTieu = kep(tyLe, 0, 1) }

export const dangXucTac = (tt: TrangThai) => tt.xucTacCon > 0

function voHat(tt: TrangThai, i: number, rng: Rng): void {
  const h = tt.hat[i], loai = LOAI_HAT[h.loai]
  tt.diem += loai.diem; tt.soVo++; tt.lienTiep++; tt.sauVoLanCuoi = 0; tt.gan = h.loai
  if (!tt.daKham.includes(h.loai)) tt.daKham.push(h.loai)
  tt.tia.push({ x: h.x, y: h.y, tuoi: 0, diem: loai.diem })
  if (!tt.giam && tt.soVo % HANG.moiXucTac === 0 && tt.vatPham.length < 2) tt.vatPham.push({ x: h.x, y: h.y })
  tt.hat.splice(i, 1)
  // Giảm chuyển động: hạt mới hiện ngay ở chỗ cũ để em luôn có thứ để chạm.
  if (tt.giam) {
    const cho = CHO_TINH.find(([x, y]) => !tt.hat.some(k => Math.abs(k.x - x / GOC_RONG * tt.rong) < 4 && Math.abs(k.y - y / GOC_CAO * tt.cao) < 4))
    if (cho) tt.hat.push(taoHat(tt, Math.floor(rng() * LOAI_HAT.length), cho[0] / GOC_RONG * tt.rong, cho[1] / GOC_CAO * tt.cao, rng))
  }
  tt.bien++
}

/** Chạm vào hạt (chế độ giảm chuyển động): một chạm bắn vỡ hạt. Trả true nếu trúng hạt. */
export function chamHat(tt: TrangThai, x: number, y: number, rng: Rng): boolean {
  for (let i = tt.hat.length - 1; i >= 0; i--) {
    const h = tt.hat[i]
    if (h.mo < 1) continue
    if (Math.abs(x - h.x) <= LOAI_HAT[h.loai].rong / 2 + 8 && Math.abs(y - h.y) <= HANG.caoHat / 2 + 12) { h.hp = 0; voHat(tt, i, rng); return true }
  }
  return false
}

function sinhHat(tt: TrangThai, rng: Rng): void {
  if (tt.hat.length >= HANG.toiDaHat) return
  const loai = Math.floor(rng() * LOAI_HAT.length) % LOAI_HAT.length
  const nua = LOAI_HAT[loai].rong / 2 + 6
  // Chọn trong vài ứng viên chỗ xa các hạt ở phía trên nhất để khỏi dính nhau.
  let tot = nua + rng() * Math.max(1, tt.rong - 2 * nua), xa = -1
  for (let k = 0; k < 4; k++) {
    const x = nua + rng() * Math.max(1, tt.rong - 2 * nua)
    const gan = tt.hat.reduce((m, h) => (h.y < 80 ? Math.min(m, Math.abs(h.x - x)) : m), 9999)
    if (gan > xa) { xa = gan; tot = x }
  }
  tt.hat.push(taoHat(tt, loai, tot, -HANG.caoHat / 2, rng))
}

/** Một bước thời gian. `dt` tính bằng giây. */
export function buoc(tt: TrangThai, dt: number, rng: Rng): void {
  if (!(dt > 0)) return
  // Tia vỡ già đi ở mọi chế độ.
  for (let i = tt.tia.length - 1; i >= 0; i--) { tt.tia[i].tuoi += dt; if (tt.tia[i].tuoi >= HANG.tuoiTiaVo) tt.tia.splice(i, 1) }
  tt.sauVoLanCuoi += dt
  if (tt.lienTiep > 0 && tt.sauVoLanCuoi > HANG.hetLienTiep && !tt.giam) { tt.lienTiep = 0; tt.bien++ }
  // Tàu bám mục tiêu.
  const dich = kep(tt.mucTieu * tt.rong, 48, Math.max(48, tt.rong - 48))
  tt.tauX = tt.giam ? dich : tt.tauX + (dich - tt.tauX) * Math.min(1, dt * 11)
  if (tt.giam) return // hạt đứng yên, không tự bắn

  // Xúc tác.
  if (tt.xucTacCon > 0) { tt.xucTacCon = Math.max(0, tt.xucTacCon - dt); if (tt.xucTacCon === 0) tt.bien++ }
  for (let i = tt.vatPham.length - 1; i >= 0; i--) {
    const v = tt.vatPham[i]; v.y += HANG.vanTocXucTac * dt
    if (v.y >= tt.tauY - 66 && Math.abs(v.x - tt.tauX) <= HANG.banKinhHungXucTac) { tt.xucTacCon = HANG.xucTacGiay; tt.vatPham.splice(i, 1); tt.bien++; continue }
    if (v.y > tt.cao + 24) tt.vatPham.splice(i, 1)
  }

  // Tự bắn đều.
  const chuKy = tt.xucTacCon > 0 ? HANG.chuKyBan / 2 : HANG.chuKyBan
  tt.tichBan += dt
  while (tt.tichBan >= chuKy) {
    tt.tichBan -= chuKy
    if (tt.dan.length < HANG.toiDaDan) { tt.dan.push({ x: tt.tauX, y: tt.tauY - 62 }); tt.daBan++ }
  }

  // Hạt trôi xuống, mờ dần khi chạm vạch đáy (không mất điểm).
  const vach = tt.cao - HANG.vachMo
  for (let i = tt.hat.length - 1; i >= 0; i--) {
    const h = tt.hat[i], nua = LOAI_HAT[h.loai].rong / 2 + 4
    h.x += h.vx * dt; h.y += h.vy * dt
    if (h.x < nua) { h.x = nua; h.vx = Math.abs(h.vx) } else if (h.x > tt.rong - nua) { h.x = tt.rong - nua; h.vx = -Math.abs(h.vx) }
    if (h.y >= vach || h.mo < 1) { h.mo -= dt / HANG.giayMo; if (h.mo <= 0) tt.hat.splice(i, 1) }
  }

  // Đạn bay lên và va chạm hạt.
  for (let i = tt.dan.length - 1; i >= 0; i--) {
    const d = tt.dan[i]; d.y -= HANG.vanTocDan * dt
    if (d.y < -HANG.nuaDan) { tt.dan.splice(i, 1); continue }
    for (let j = 0; j < tt.hat.length; j++) {
      const h = tt.hat[j]
      if (h.mo < 1) continue
      if (Math.abs(d.x - h.x) <= LOAI_HAT[h.loai].rong / 2 + 2 && Math.abs(d.y - h.y) <= HANG.caoHat / 2 + HANG.nuaDan) {
        tt.dan.splice(i, 1); h.hp--
        if (h.hp <= 0) voHat(tt, j, rng)
        break
      }
    }
  }

  tt.tichSinh += dt
  if (tt.tichSinh >= HANG.chuKySinhHat) { tt.tichSinh = 0; sinhHat(tt, rng) }
}
