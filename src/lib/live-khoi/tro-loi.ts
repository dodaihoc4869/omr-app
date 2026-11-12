// TRÒ «GIỮ LỬA» ở phòng chờ Live theo khối (thầy duyệt bản vẽ 12/11; đặc tả docs/dac-ta-live-moi-1211.md mục 4) — LÕI THUẦN: không DOM, không đồng hồ,
// không ngẫu nhiên ẩn. Mọi hàm nhận `nay` (ms) và hạt giống làm tham số ⇒ test được, mọi máy cùng giờ phòng ra cùng bản đồ hạt và cùng vòng lạnh.
// Máy em TỰ mô phỏng đốm của chính mình; phòng chỉ gom vị trí và phát ảnh chụp mỗi 250 ms (hợp đồng: ./kieu.ts).
import { SAN_CAO, SAN_RONG, type TroAnh, type TroGui } from './kieu'

/** Một ván dài 90 giây; `vanSo = floor(gioPhong / VAN_MS)` là hạt giống chung của cả phòng. */
export const VAN_MS = 90_000
export const M_MIN = 10
export const M_MAX = 400
/** Số hạt năng lượng trên sân mỗi ván. */
export const SO_HAT = 72
/** Hạt đã ăn tự mọc lại sau 8 giây (chỉ ẩn trên máy mình). */
export const HAT_MOC_MS = 8000
/** «Tăng tốc»: ×1,8 trong 1,2 giây, hồi 4 giây kể từ lúc bấm, tốn 5% khối lượng. */
export const TANG_HE = 1.8
export const TANG_MS = 1200
export const TANG_HOI_MS = 4000
const TANG_TON = 0.05
/** Ở ngoài vòng lạnh mất 4% khối lượng mỗi giây. */
const LANH_MAT = 0.04
/** Vòng lạnh co từ kín sân (elip ngoại tiếp sân, hệ số √2) về 55% bán trục sân. */
const VONG_DAU = Math.SQRT2
const VONG_CUOI = 0.55
/** Đốm khác đội nặng từ 1,15 lần mình trở lên mới thu phục được mình. */
const THU_PHUC_HE = 1.15
export const HOI_SINH_MS = 3000
/** Vừa hồi sinh được 2 giây không bị thu phục (chống đốm lớn đứng canh góc). */
export const BAT_TU_MS = 2000
/** Thu phục được đốm khác ⇒ cộng 50% khối lượng của đốm ấy. */
const THUONG_AN = 0.5
/** Nhịp gửi tối đa 4 lần / giây; đứng yên vẫn gửi nhắc mỗi 2 giây (phòng gỡ đốm im quá 5 giây). */
export const NHIP_GUI_MS = 250
export const NHIP_NHAC_MS = 2000
/** Phòng phát ảnh chụp mỗi 250 ms — khoảng nội suy đốm khác. */
export const ANH_MS = 250
/** Bán kính vùng góc đội (đơn vị sân). */
const BK_GOC = 110
/** Điểm đội mỗi 250 kJ lên một cấp lửa (tối đa cấp 9). */
const KJ_MOI_CAP = 250

export interface Hat { id: number; x: number; y: number; /** 0 = hạt vàng (3 kJ), 1 = hạt xanh (6 kJ). */ loai: 0 | 1; gt: number }
export interface Diem { x: number; y: number }
export interface VongLanh { cx: number; cy: number; rx: number; ry: number }
/** Đốm khác như máy mình đang thấy (đã nội suy). */
export interface DomKhac { sbd: string; x: number; y: number; m: number; doi: number }
/** Đốm khác giữa hai ảnh chụp: đi từ `tu` tới `den` trong ANH_MS kể từ `luc`. */
export interface DomNoiSuy { tu: [number, number, number]; den: [number, number, number]; luc: number; doi: number }
export interface DauVao { dx: number; dy: number; tang: boolean }

/** Trạng thái đốm của CHÍNH em. Các mốc giờ đều theo giờ phòng (ms); 0 = không có. */
export interface TrangThaiToi {
  x: number; y: number; m: number; doi: number
  /** Đang tăng tốc tới lúc này. */ tangDen: number
  /** Bấm «Tăng tốc» lại được từ lúc này. */ tangSan: number
  /** > 0: đang bị thu phục, hồi sinh lúc này. */ chetDen: number
  /** Không bị thu phục tới lúc này. */ batTuDen: number
  /** Khối lượng đã nộp về góc đội (điểm đội cục bộ). */ daNop: number
  /** Ván đang chơi. */ van: number
  /** Hạt đã ăn: id ⇒ giờ mọc lại. */ hatAn: Record<number, number>
}
export interface KetQuaBuoc {
  tt: TrangThaiToi
  /** id các hạt vừa gom ở bước này. */ anHat: number[]
  /** Khối lượng vừa nộp về góc đội (0 = không nộp). */ nop: number
  /** Vừa bị đốm này thu phục. */ biThuPhucBoi?: string
  /** Gói phải gửi ngay khi bị thu phục: vị trí + khối lượng LÚC bị thu phục, kèm `a`. */ goiThuPhuc?: TroGui
  hoiSinh?: boolean
  vanMoi?: boolean
  /** Vừa kích hoạt tăng tốc ở bước này. */ vuaTang?: boolean
  /** Đang đứng ngoài vòng lạnh. */ ngoaiVong: boolean
}

const kep = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

/** Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) — cùng hạt giống ⇒ cùng dãy số trên mọi máy. */
export function taoNgauNhien(hatGiong: number): () => number {
  let a = (Math.floor(hatGiong) ^ 0x9e3779b9) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function vanSo(gioPhong: number): number { return Math.floor(gioPhong / VAN_MS) }
/** Phần đã trôi của ván hiện tại, 0..1. */
function tienDoVan(gioPhong: number): number { return (((gioPhong % VAN_MS) + VAN_MS) % VAN_MS) / VAN_MS }

/** Tâm góc đội: 0 trên-trái · 1 trên-phải · 2 dưới-trái · 3 dưới-phải. */
export function gocDoi(doi: number): Diem {
  const d = ((Math.floor(doi) % 4) + 4) % 4
  return { x: d % 2 === 0 ? 90 : SAN_RONG - 90, y: d < 2 ? 100 : SAN_CAO - 100 }
}
/** Chỗ hồi sinh: trong góc đội, lệch về giữa sân để đốm không nằm dưới ngọn lửa. */
export function diemHoiSinh(doi: number): Diem {
  const g = gocDoi(doi)
  return { x: g.x + (g.x < SAN_RONG / 2 ? 70 : -70), y: g.y + (g.y < SAN_CAO / 2 ? 40 : -40) }
}
export function trongGoc(x: number, y: number, doi: number): boolean {
  const g = gocDoi(doi)
  return Math.hypot(x - g.x, y - g.y) <= BK_GOC
}

/** Bán kính vẽ (đơn vị sân) theo khối lượng: 10 ⇒ ≈ 11, 400 ⇒ 38. */
export function banKinh(m: number): number { return 6 + 1.6 * Math.sqrt(kep(m, M_MIN, M_MAX)) }
/** Tốc độ (đơn vị sân / giây): đốm càng nặng càng chậm. 10 ⇒ 220, 400 ⇒ ≈ 98. */
export function tocDo(m: number): number { return 220 * Math.pow(M_MIN / kep(m, M_MIN, M_MAX), 0.22) }

/** Bản đồ hạt của một ván — chỉ phụ thuộc số ván. Không đặt hạt trong góc đội (góc là chỗ nộp, không phải chỗ gom). */
export function sinhHat(van: number, soHat: number = SO_HAT, ngauNhien: () => number = taoNgauNhien(van * 7919 + 13)): Hat[] {
  const ds: Hat[] = []
  let thu = 0
  while (ds.length < soHat && thu < soHat * 20) {
    thu++
    const x = Math.round(24 + ngauNhien() * (SAN_RONG - 48))
    const y = Math.round(24 + ngauNhien() * (SAN_CAO - 48))
    const loai: 0 | 1 = ngauNhien() < 0.28 ? 1 : 0
    if (trongGoc(x, y, 0) || trongGoc(x, y, 1) || trongGoc(x, y, 2) || trongGoc(x, y, 3)) continue
    ds.push({ id: ds.length, x, y, loai, gt: loai === 1 ? 6 : 3 })
  }
  return ds
}
/** Hạt đang hiện trên máy mình (chưa ăn, hoặc đã mọc lại)? */
export function hatHien(tt: TrangThaiToi, id: number, nay: number): boolean {
  const moc = tt.hatAn[id]
  return moc === undefined || nay >= moc
}

/** Vòng lạnh tại giờ phòng: elip tâm sân, co đều từ VONG_DAU về VONG_CUOI trong một ván, sang ván mới mở lại. */
export function vongLanh(gioPhong: number): VongLanh {
  const he = VONG_DAU + (VONG_CUOI - VONG_DAU) * tienDoVan(gioPhong)
  return { cx: SAN_RONG / 2, cy: SAN_CAO / 2, rx: (SAN_RONG / 2) * he, ry: (SAN_CAO / 2) * he }
}
export function trongVong(x: number, y: number, v: VongLanh): boolean {
  const a = (x - v.cx) / v.rx, b = (y - v.cy) / v.ry
  return a * a + b * b <= 1
}

export function taoToi(doi: number, nay: number): TrangThaiToi {
  const p = diemHoiSinh(doi)
  return { x: p.x, y: p.y, m: M_MIN, doi, tangDen: 0, tangSan: 0, chetDen: 0, batTuDen: 0, daNop: 0, van: vanSo(nay), hatAn: {} }
}
export function dangChet(tt: TrangThaiToi, nay: number): boolean { return tt.chetDen > 0 && nay < tt.chetDen }
/** Phần đã hồi của nút «Tăng tốc», 0..1 (1 = bấm được). */
export function hoiTang(tt: TrangThaiToi, nay: number): number {
  return nay >= tt.tangSan ? 1 : kep(1 - (tt.tangSan - nay) / TANG_HOI_MS, 0, 1)
}

/** Gói gửi phòng: vị trí nguyên trong sân + khối lượng nguyên 10..400; `a` = số báo danh đốm vừa thu phục mình. */
export function dungGoi(tt: Pick<TrangThaiToi, 'x' | 'y' | 'm'>, a?: string): TroGui {
  const goi: TroGui = { p: [kep(Math.round(tt.x), 0, SAN_RONG), kep(Math.round(tt.y), 0, SAN_CAO), kep(Math.round(tt.m), M_MIN, M_MAX)] }
  if (a) goi.a = a
  return goi
}

/** Đốm khác có thu phục được mình không: khác đội, nặng ≥ 1,15 × mình, và tâm mình nằm trong thân đốm ấy. */
export function biThuPhuc(tt: Pick<TrangThaiToi, 'x' | 'y' | 'm' | 'doi'>, k: DomKhac): boolean {
  if (k.doi === tt.doi || k.m < tt.m * THU_PHUC_HE) return false
  return Math.hypot(k.x - tt.x, k.y - tt.y) <= banKinh(k.m)
}

/** MỘT BƯỚC mô phỏng đốm của chính em. `dtMs` = thời gian từ bước trước (kẹp 100 ms), `nay` = giờ phòng. Không sửa `tt` cũ. */
export function buoc(ttCu: TrangThaiToi, vao: DauVao, dtMs: number, nay: number, hat: readonly Hat[], khac: readonly DomKhac[]): KetQuaBuoc {
  const tt: TrangThaiToi = { ...ttCu }
  const kq: KetQuaBuoc = { tt, anHat: [], nop: 0, ngoaiVong: false }
  const dt = kep(dtMs, 0, 100) / 1000
  const van = vanSo(nay)
  if (van !== tt.van) { tt.van = van; tt.hatAn = {}; kq.vanMoi = true }

  if (tt.chetDen > 0) {
    if (nay < tt.chetDen) return kq
    // Hết 3 giây: hồi sinh ở góc đội (vị trí và khối lượng 10 đã đặt sẵn lúc bị thu phục).
    tt.chetDen = 0; tt.batTuDen = nay + BAT_TU_MS; kq.hoiSinh = true
  }

  // Tăng tốc: bấm khi đã hồi ⇒ ×1,8 trong 1,2 giây, tốn 5% khối lượng.
  if (vao.tang && nay >= tt.tangSan) {
    tt.tangDen = nay + TANG_MS; tt.tangSan = nay + TANG_HOI_MS
    tt.m = Math.max(M_MIN, tt.m * (1 - TANG_TON)); kq.vuaTang = true
  }

  // Di chuyển theo hướng cần (vector −1..1, dài quá 1 thì chuẩn hoá), kẹp trong sân.
  let dx = Number.isFinite(vao.dx) ? vao.dx : 0, dy = Number.isFinite(vao.dy) ? vao.dy : 0
  const dai = Math.hypot(dx, dy)
  if (dai > 1) { dx /= dai; dy /= dai }
  const v = tocDo(tt.m) * (nay < tt.tangDen ? TANG_HE : 1)
  const r = banKinh(tt.m)
  tt.x = kep(tt.x + dx * v * dt, r, SAN_RONG - r)
  tt.y = kep(tt.y + dy * v * dt, r, SAN_CAO - r)

  // Gom hạt chạm thân đốm.
  let moi: Record<number, number> | null = null
  for (const h of hat) {
    const moc = tt.hatAn[h.id]
    if (moc !== undefined && nay < moc) continue
    if (Math.abs(h.x - tt.x) > r + 4 || Math.hypot(h.x - tt.x, h.y - tt.y) > r + 4) continue
    if (!moi) moi = { ...tt.hatAn }
    moi[h.id] = nay + HAT_MOC_MS
    tt.m = Math.min(M_MAX, tt.m + h.gt)
    kq.anHat.push(h.id)
  }
  if (moi) tt.hatAn = moi

  // Vòng lạnh: ở ngoài mất 4% / giây (luỹ thừa theo dt ⇒ không phụ thuộc nhịp khung), không dưới 10.
  if (!trongVong(tt.x, tt.y, vongLanh(nay))) {
    kq.ngoaiVong = true
    tt.m = Math.max(M_MIN, tt.m * Math.pow(1 - LANH_MAT, dt))
  }

  // Thu phục: máy bị thu phục tự báo; gói báo mang vị trí + khối lượng lúc bị thu phục, rồi đốm về góc đội với khối lượng 10 và chờ 3 giây.
  if (nay >= tt.batTuDen) {
    for (const k of khac) {
      if (!biThuPhuc(tt, k)) continue
      kq.biThuPhucBoi = k.sbd
      kq.goiThuPhuc = dungGoi(tt, k.sbd)
      const p = diemHoiSinh(tt.doi)
      tt.x = p.x; tt.y = p.y; tt.m = M_MIN; tt.tangDen = 0; tt.chetDen = nay + HOI_SINH_MS
      return kq
    }
  }

  // Về góc đội mình: nộp phần khối lượng vượt 10 vào điểm đội.
  if (tt.m > M_MIN && trongGoc(tt.x, tt.y, tt.doi)) {
    kq.nop = tt.m - M_MIN
    tt.daNop += kq.nop
    tt.m = M_MIN
  }
  return kq
}

/** Ảnh chụp báo `an: [sbdThuPhuc, sbdBiThuPhuc, m]`: dòng nào mình là người thu phục ⇒ cộng 50% m (trần 400). Trả trạng thái mới + tổng vừa cộng. */
export function apThuong(tt: TrangThaiToi, an: TroAnh['an'] | undefined, sbdToi: string): { tt: TrangThaiToi; cong: number } {
  let cong = 0
  for (const d of an ?? []) {
    if (!Array.isArray(d) || d[0] !== sbdToi || d[1] === sbdToi) continue
    const m = Number(d[2])
    if (Number.isFinite(m) && m > 0) cong += m * THUONG_AN
  }
  if (cong <= 0) return { tt, cong: 0 }
  const m = Math.min(M_MAX, tt.m + cong)
  return { tt: { ...tt, m }, cong: m - tt.m }
}

/** Vị trí đốm khác tại `nay` (giờ máy, cùng đồng hồ với `luc`): nội suy thẳng từ `tu` tới `den` trong ANH_MS. */
export function viTriDom(d: DomNoiSuy, nay: number): { x: number; y: number; m: number } {
  const t = kep((nay - d.luc) / ANH_MS, 0, 1)
  return { x: d.tu[0] + (d.den[0] - d.tu[0]) * t, y: d.tu[1] + (d.den[1] - d.tu[1]) * t, m: d.tu[2] + (d.den[2] - d.tu[2]) * t }
}
/** Nhận ảnh chụp mới: đốm cũ đi tiếp TỪ chỗ đang nội suy tới chỗ mới (không giật); đốm mới hiện ngay; đốm vắng trong ảnh bị gỡ; bỏ chính mình. */
export function capNhatDomKhac(cu: Readonly<Record<string, DomNoiSuy>>, anh: TroAnh, sbdToi: string, nay: number): Record<string, DomNoiSuy> {
  const moi: Record<string, DomNoiSuy> = {}
  const ds = anh && typeof anh.ds === 'object' && anh.ds ? anh.ds : {}
  for (const sbd of Object.keys(ds)) {
    if (sbd === sbdToi) continue
    const v = ds[sbd]
    if (!Array.isArray(v) || !Number.isFinite(v[0]) || !Number.isFinite(v[1])) continue
    const den: [number, number, number] = [kep(v[0], 0, SAN_RONG), kep(v[1], 0, SAN_CAO), kep(Number(v[2]) || M_MIN, M_MIN, M_MAX)]
    const c = cu[sbd]
    const p = c ? viTriDom(c, nay) : null
    // Nhảy xa quá 300 đơn vị (vừa hồi sinh về góc) ⇒ hiện thẳng chỗ mới, không trượt ngang sân.
    const tu: [number, number, number] = p && Math.hypot(p.x - den[0], p.y - den[1]) < 300 ? [p.x, p.y, p.m] : den
    moi[sbd] = { tu, den, luc: nay, doi: ((Math.floor(Number(v[3]) || 0) % 4) + 4) % 4 }
  }
  return moi
}

/** Điểm 4 đội hiển thị = tổng khối lượng các đốm của đội trong ảnh chụp (đốm mình lấy số đang có trên máy) + phần mình đã nộp cho đội mình. */
export function diemDoi(ds: TroAnh['ds'] | undefined, toi: { sbd: string; doi: number; m: number; daNop: number }): [number, number, number, number] {
  const d: [number, number, number, number] = [0, 0, 0, 0]
  for (const sbd of Object.keys(ds ?? {})) {
    if (sbd === toi.sbd) continue
    const v = (ds as TroAnh['ds'])[sbd]
    const doi = Number(v?.[3])
    if (doi >= 0 && doi < 4 && Number.isFinite(v[2])) d[Math.floor(doi)] += v[2]
  }
  if (toi.doi >= 0 && toi.doi < 4) d[toi.doi] += toi.m + toi.daNop
  return [Math.round(d[0]), Math.round(d[1]), Math.round(d[2]), Math.round(d[3])]
}
/** Cấp lửa đội theo điểm đội: 1..9. */
export function capLua(diem: number): number { return kep(1 + Math.floor(Math.max(0, diem) / KJ_MOI_CAP), 1, 9) }

/** Bộ giới hạn nhịp gửi: tối đa 4 lần / giây, chỉ gửi khi gói đổi (đứng yên: nhắc mỗi 2 giây), gói thu phục xếp hàng gửi trước và không bao giờ bị bỏ. */
export interface NhipGui { /** Lần gửi gần nhất (−∞ = chưa gửi). */ luc: number; /** Gói đã gửi gần nhất. */ khoa: string; /** Gói thu phục đang chờ lượt. */ cho: TroGui[] }
export function taoNhipGui(): NhipGui { return { luc: Number.NEGATIVE_INFINITY, khoa: '', cho: [] } }
/** Hỏi «giờ có gửi không»: trả gói cần gửi (hoặc null) và trạng thái nhịp mới. `uuTien` = gói thu phục vừa phát sinh ở bước này. */
export function thuGui(nhip: NhipGui, goi: TroGui, nay: number, uuTien?: TroGui): { gui: TroGui | null; nhip: NhipGui } {
  const cho = uuTien ? [...nhip.cho, uuTien] : nhip.cho
  if (nay - nhip.luc < NHIP_GUI_MS) return { gui: null, nhip: cho === nhip.cho ? nhip : { ...nhip, cho } }
  if (cho.length) return { gui: cho[0], nhip: { luc: nay, khoa: '', cho: cho.slice(1) } }
  const khoa = goi.p.join(',')
  if (khoa === nhip.khoa && nay - nhip.luc < NHIP_NHAC_MS) return { gui: null, nhip }
  return { gui: goi, nhip: { luc: nay, khoa, cho } }
}
