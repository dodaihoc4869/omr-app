// ƯỚC LƯỢNG BẬC BỐ CỤC LÚC XẾP BUỔI — HÀM THUẦN, HIỆU CHỈNH BẰNG PHÉP ĐO CHROME (M2, 19/09/2026).
//
// Tờ chiếu ĐO THẬT (`bo-cuc-to-chieu.ts`) nên luôn đúng. Nhưng lúc XẾP BUỔI (màn giáo viên, chưa dựng tờ) thầy cần biết
// trước: câu nào ghép ĐÔI được (bậc 1), câu nào phải chiếm cả bảng (bậc 5, kèm cảnh báo). Việc ấy chạy đồng bộ trong
// lượt xếp nên không thể dựng iframe thật cho từng câu — nên ta ƯỚC LƯỢNG bằng cùng thang bậc và cùng hằng số, rồi để
// tờ chiếu đo lại: ước sai một bậc thì tờ tự tách/gộp, không bao giờ tràn chữ.
//
// MÔ HÌNH: chiều cao đề cần = dòng chữ (xuống dòng tham lam theo bề rộng ký tự trung bình) + phương án/ý (chia cột như
// `fitOptions`) + hình (chặn trên `30vh`) + bảng; so với chỗ sẵn có của vùng đề theo bậc. Duyệt thang bậc bằng ĐÚNG
// `leoBacBoCuc` của tờ chiếu — một thuật toán, hai nơi dùng.
//
// HIỆU CHỈNH (`UOC_LUONG_BO_CUC`): đo bằng Chrome 40 câu mẫu (`tests/fixtures/cau-mau-to-chieu.ts`) ở 1280×720 và
// 1920×1080 (`scripts/do-bo-cuc-to-chieu.mjs` → `docs/anh-man-chieu-1909/do-bo-cuc-40-cau.json`); test khoá sai lệch ≤ 1 bậc.
// M3 (giao diện mới) ĐỔI HÌNH HỌC — thanh dưới 50 px thay thanh trên, thẻ tên giấy to hơn, đệm thẻ đề tỉ lệ theo bề ngang,
// không viền, chip "Câu N" nằm trong thẻ đề ở đợt đơn — nên MỌI hằng số hình học dưới đây được đo lại (cùng phương pháp).
// Ước luôn nghiêng về PHÍA AN TOÀN: nghi ngờ thì cho bậc cao hơn (không ghép đôi câu có thể không vừa).
import type { CauLuyen } from './bai-tap-pdf'
import {
  BO_CUC_TO_CHIEU,
  leoBacBoCuc,
  type BacBoCuc,
  type CauHinhLeoBac,
  type KetQuaLeoBac,
} from './bo-cuc-to-chieu'

export interface KhungChieu {
  /** Bề ngang khung tờ chiếu, px. */
  rong: number
  /** Chiều cao khung, px. */
  cao: number
}

/** Ước lượng lúc xếp buổi tính ở khung 1920×1080 (máy chiếu Full HD thông dụng); tờ chiếu đo lại ở khung thật. */
export const KHUNG_UOC_MAC_DINH: KhungChieu = { rong: 1920, cao: 1080 }

export const UOC_LUONG_BO_CUC = {
  /** Thanh điều khiển ở ĐÁY tờ: cao 42 px + cách đáy 8 px (M3; bản M2 là thanh trên 63 px). */
  THANH_DUOI_PX: 50,
  /** Lề trang + khe giữa các khối (10 px). */
  LE_PX: 10,
  /** Đệm thẻ đề theo bề ngang khung `w`: dọc = clamp(12, 1,72%·w, 30), ngang = clamp(14, 1,9%·w, 34) — mỗi bên; không viền. */
  DEM_DOC_TL: 0.0172,
  DEM_DOC_MIN: 12,
  DEM_DOC_MAX: 30,
  DEM_NGANG_TL: 0.019,
  DEM_NGANG_MIN: 14,
  DEM_NGANG_MAX: 34,
  /** Bậc 1: hai đệm trang (2×10) + hai khe giữa thẻ tên / thẻ đề / vùng làm bài (2×10). Nút giải + nút chấm nằm ĐÈ lên vùng làm bài. */
  BAC1_CO_DINH_PX: 40,
  /** Vùng làm bài tối thiểu ở bậc 1 (tỉ lệ chiều cao ray) — khớp `LAM_BAI_TOI_THIEU_TL`. */
  BAC1_LAM_BAI_TL: BO_CUC_TO_CHIEU.LAM_BAI_TOI_THIEU_TL,
  /** Thẻ tên (M3): đệm dọc mỗi bên = clamp(4, 0,62%·w, 12); ảnh thần thú vuông = min(cột 5,94%·w kẹp 46..116, 5,6%·w kẹp 44..108);
   * chữ: tên = clamp(20, 2,34%·w, 46) (đợt đơn: clamp(18, 2,03%·w, 40)) × 1,1, dòng phụ clamp(12, 1,25%·w, 24) × 1,3, khe 2. */
  THE_DEM_TL: 0.0062,
  THE_DEM_MIN: 4,
  THE_DEM_MAX: 12,
  THE_CAU_ANH_TL: 0.056,
  THE_CAU_ANH_MIN: 44,
  THE_CAU_ANH_MAX: 108,
  THE_CAU_COT_TL: 0.0594,
  THE_CAU_COT_MIN: 46,
  THE_CAU_COT_MAX: 116,
  THE_TEN_TL: 0.0234,
  THE_TEN_DON_TL: 0.0203,
  THE_PHU_TL: 0.0125,
  /** Dòng đầu thẻ đề ở đợt đơn (chip "Câu N" + chip phần): đệm chip 2×clamp(3, 0,47%·w, 9) + chữ clamp(13, 1,4%·w, 26) × 1,2 + cách dưới clamp(6, 1%·w, 16). */
  DAU_DE_TL_DEM: 0.0047,
  DAU_DE_CHU_TL: 0.014,
  DAU_DE_KHE_TL: 0.01,
  /** Hệ số hiệu chỉnh độ rộng chữ so với số liệu AFM Times (1 = đúng số liệu phông). */
  RONG_CHU: 1.01,
  /** Chỉ số dưới (H₂O, C₁₇H₃₅) nhỏ hơn chữ thường bấy nhiêu lần. */
  CHI_SO_DUOI: 0.75,
  DONG_DE: 1.45,
  DONG_PA: 1.4,
  /** Cỡ chữ phương án / ý so với đề. */
  CO_PA: 0.93,
  /** Khoảng cách giữa các khối: sau đề tới cụm phương án; giữa hai hàng phương án (6,4) và hai ý (6). */
  KHE_PA_PX: 10,
  KHE_HANG_PA_PX: 6.4,
  KHE_COT_PA_PX: 12.8,
  KHE_Y_PX: 6,
  KHE_Y_COT_PX: 22,
  /** Ô chữ cái A/B/C/D rộng 1,4 em + khe 0,35 em. */
  NHAN_PA_EM: 1.4 + 0.35,
  /** Ghi chú Phần III: cỡ 0,6 đề, dòng 1,5, cách trên 10 px, ~70 ký tự. */
  GHI_CHU_III_KY_TU: 70,
  GHI_CHU_III_PX: 10,
  /** Hình: chặn trên = 30% chiều cao khung × hệ số hình; cộng lề dọc. Không biết kích thước gốc ⇒ lấy chặn trên (an toàn). */
  HINH_TL_CAO: 0.3,
  HINH_LE_PX: 16,
  /** Bảng: chữ 0,72 đề, dòng 1,5, đệm ô 2×7 + viền (đo Chrome: hàng 63 px ở đề 44 px). */
  BANG_CO: 0.72,
  BANG_DONG: 1.5,
  BANG_DEM_PX: 15.5,
  /** Hệ số dư an toàn nhân vào chiều cao cần (công thức xuống dòng tham lam luôn lệch nhẹ so với trình duyệt). */
  DU_AN_TOAN: 1.01,
} as const

/** Chữ hiển thị của một đoạn đề: bỏ thẻ HTML, `<br>` thành xuống dòng, công thức chỉ đếm phần chữ. */
function chuHienThi(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\\ce\{([^}]*)\}/g, '$1')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/[_^{}]/g, '')
}

/** Độ rộng (đơn vị 1/1000 em) của phông Times New Roman (số liệu AFM Times-Roman) — phông có chân mà tờ chiếu chọn
 * (`--mc-serif`). Chữ Việt có dấu lấy độ rộng của chữ gốc (ế → e, đ → d, ư → u). */
const RONG_TIMES: Record<string, number> = {
  a: 444, b: 500, c: 444, d: 500, e: 444, f: 333, g: 500, h: 500, i: 278, j: 278, k: 500, l: 278, m: 778, n: 500, o: 500, p: 500, q: 500, r: 333, s: 389, t: 278, u: 500, v: 500, w: 722, x: 500, y: 500, z: 444,
  A: 722, B: 667, C: 667, D: 722, E: 611, F: 556, G: 722, H: 722, I: 333, J: 389, K: 722, L: 611, M: 889, N: 722, O: 722, P: 556, Q: 722, R: 667, S: 556, T: 611, U: 722, V: 722, W: 944, X: 722, Y: 722, Z: 611,
  ' ': 250, ',': 250, '.': 250, ':': 278, ';': 278, '-': 333, '–': 500, '—': 1000, '(': 333, ')': 333, '?': 444, '!': 333, '/': 278, '=': 564, '+': 564, '%': 833, '°': 400, '"': 408, "'": 180,
}
const BAN_DAU = /[\u0300-\u036f]/g

/** Độ rộng (em) của một đoạn không xuống dòng. Chữ số ngay sau chữ cái/")" là chỉ số dưới (nhỏ ≈ 0,75) như `chuHtml`. */
export function rongChuEm(s: string): number {
  const U = UOC_LUONG_BO_CUC
  let tong = 0
  const nfd = s.normalize('NFD').replace(BAN_DAU, '')
  let truoc = ''
  for (const ch of nfd) {
    const dg = ch >= '0' && ch <= '9'
    let w = ch === 'đ' ? 500 : ch === 'Đ' ? 722 : dg ? 500 : (RONG_TIMES[ch] ?? 500)
    if (dg && /[A-Za-z)]/.test(truoc) && /^[A-Za-z()0-9]+$/.test(s.length > 0 ? s : '')) w *= U.CHI_SO_DUOI
    tong += w
    truoc = ch
  }
  return (tong / 1000) * U.RONG_CHU
}

/** Số dòng của đoạn chữ khi xuống dòng tham lam trong `rongPx` với cỡ chữ `co`, theo độ rộng THẬT của từng ký tự. */
export function demDong(s: string, co: number, rongPx: number): number {
  const U = UOC_LUONG_BO_CUC
  const cach = 0.25 * co * U.RONG_CHU
  const cap = Math.max(rongPx, co)
  let tong = 0
  for (const doan of s.split('\n')) {
    const tu = doan.split(/\s+/).filter(Boolean)
    if (tu.length === 0) {
      tong += 1
      continue
    }
    let dong = 1
    let cur = 0
    for (const w of tu) {
      const rw = rongChuEm(w) * co
      if (cur === 0) cur = rw
      else if (cur + cach + rw <= cap) cur += cach + rw
      else {
        dong++
        cur = rw
      }
      // Từ dài hơn cả dòng bị bẻ: mỗi `cap` một dòng thêm.
      while (cur > cap) {
        dong++
        cur -= cap
      }
    }
    tong += dong
  }
  return tong
}

/** Như `dauVaoTuCau` nhưng đọc CÂU GỐC trong gói đề (`Teacher*Question`) — để màn xếp buổi ước bậc mà không phải dựng `CauLuyen`. */
export function dauVaoTuCauGoc(phan: 'I' | 'II' | 'III', q: unknown): DauVao {
  const o = (q ?? {}) as Record<string, unknown>
  const chuoi = (v: unknown) => (typeof v === 'string' ? v : '')
  const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  const anhThan = Boolean(chuoi(o.thanCauImg))
  const pa = phan === 'I' ? mang(o.choices) : phan === 'II' ? mang(o.ideas) : []
  const anhPa = phan === 'I' ? mang(o.choiceImgs) : phan === 'II' ? mang(o.ideaImgs) : []
  const coAnhPa = anhPa.some(Boolean)
  return {
    de: anhThan ? '' : chuHienThi(chuoi(o.text)),
    phan,
    pa: pa.map((x, i) => (anhPa[i] ? '' : chuHienThi(chuoi(x)))),
    soHinh: mang(o.hinhAnh).length + (chuoi(o.imageDataUrl) ? 1 : 0) + (anhThan ? 1 : 0) + (coAnhPa ? 1 : 0) + (/<img\b/i.test(chuoi(o.text)) ? 1 : 0),
    soDongBang: mang(o.table).length,
    soCotBang: mang(mang(o.table)[0]).length,
    deLaAnh: anhThan,
  }
}

export interface DauVao {
  de: string
  phan: 'I' | 'II' | 'III'
  pa: string[]
  soHinh: number
  soDongBang: number
  soCotBang: number
  deLaAnh: boolean
}

export function dauVaoTuCau(c: CauLuyen): DauVao {
  const anhThan = Boolean(c.anhThanCau)
  return {
    de: anhThan ? '' : chuHienThi(c.text),
    phan: c.phan,
    pa: (c.luaChon ?? []).map((x, i) => (c.anhLuaChon?.[i] ? '' : chuHienThi(x))),
    soHinh: (c.hinh?.length ?? 0) + (anhThan ? 1 : 0) + ((c.anhLuaChon ?? []).filter(Boolean).length > 0 ? 1 : 0) + (/<img\b/i.test(c.text || '') ? 1 : 0),
    soDongBang: c.bang?.length ?? 0,
    soCotBang: c.bang?.[0]?.length ?? 0,
    deLaAnh: anhThan,
  }
}

const kep = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** Chiều cao thẻ tên (border-box) ở khung `w`. `don` = đợt đơn / toàn bảng (tên nhỏ hơn, không chip). */
export function chieuCaoTheTen(w: number, don: boolean): number {
  const U = UOC_LUONG_BO_CUC
  const anh = Math.min(kep(U.THE_CAU_COT_TL * w, U.THE_CAU_COT_MIN, U.THE_CAU_COT_MAX), kep(U.THE_CAU_ANH_TL * w, U.THE_CAU_ANH_MIN, U.THE_CAU_ANH_MAX))
  const ten = don ? kep(U.THE_TEN_DON_TL * w, 18, 40) : kep(U.THE_TEN_TL * w, 20, 46)
  const chu = ten * 1.1 + 2 + kep(U.THE_PHU_TL * w, 12, 24) * 1.3
  return Math.max(anh, chu) + 2 * kep(U.THE_DEM_TL * w, U.THE_DEM_MIN, U.THE_DEM_MAX)
}

/** Đệm dọc + đệm ngang (cả hai bên) của thẻ đề ở khung `w`. */
export function demTheDe(w: number): { doc: number; ngang: number } {
  const U = UOC_LUONG_BO_CUC
  return { doc: 2 * kep(U.DEM_DOC_TL * w, U.DEM_DOC_MIN, U.DEM_DOC_MAX), ngang: 2 * kep(U.DEM_NGANG_TL * w, U.DEM_NGANG_MIN, U.DEM_NGANG_MAX) }
}

/** Dòng đầu thẻ đề (chỉ có ở bậc ≥ 2). */
function chieuCaoDauDe(w: number): number {
  const U = UOC_LUONG_BO_CUC
  return 2 * kep(U.DAU_DE_TL_DEM * w, 3, 9) + 1.2 * kep(U.DAU_DE_CHU_TL * w, 13, 26) + kep(U.DAU_DE_KHE_TL * w, 6, 16)
}

/** Chỗ sẵn có (padding-box) của thẻ đề theo bậc — tính từ hình học của giao diện M3, kiểm bằng Chrome. */
export function choSanCo(bac: BacBoCuc, k: KhungChieu): { cao: number; rong: number } {
  const U = UOC_LUONG_BO_CUC
  const rayH = k.cao - U.THANH_DUOI_PX
  // bậc 1: hai ô, mỗi ô rộng nửa bảng; chiều cao = phần ray còn lại sau vùng làm bài tối thiểu, thẻ tên và các khe
  if (bac === 1) return { cao: (1 - U.BAC1_LAM_BAI_TL) * rayH - chieuCaoTheTen(k.rong, false) - U.BAC1_CO_DINH_PX, rong: (k.rong - 3 * U.LE_PX) / 2 }
  // bậc 5: cả bảng, trừ thẻ tên nằm trên
  if (bac === 5) return { cao: rayH - 2 * U.LE_PX - chieuCaoTheTen(k.rong, true) - U.LE_PX, rong: k.rong - 2 * U.LE_PX }
  // bậc 2, 3, 4: đề chiếm 2/3 bề ngang, cao suốt bảng
  return { cao: rayH - 2 * U.LE_PX, rong: ((k.rong - 3 * U.LE_PX) * 2) / 3 }
}

/** Chiều cao NỘI DUNG đề cần (padding-box) ở bố cục `(bac, co, hinh)`. */
export function chieuCaoCan(d: DauVao, bac: BacBoCuc, co: number, hinh: number, k: KhungChieu): number {
  const U = UOC_LUONG_BO_CUC
  const cho = choSanCo(bac, k)
  const dem = demTheDe(k.rong)
  const rongChu = cho.rong - dem.ngang
  let h = 0
  if (!d.deLaAnh && d.de) h += demDong(d.de, co, rongChu) * co * U.DONG_DE
  // hình: ảnh đề bọc cả thân + hình nhúng — mỗi hình tối đa 30% chiều cao khung × hệ số hình
  if (d.soHinh > 0) h += d.soHinh * (U.HINH_TL_CAO * k.cao * hinh + U.HINH_LE_PX)
  if (d.soDongBang > 0) h += d.soDongBang * (U.BANG_CO * co * U.BANG_DONG + U.BANG_DEM_PX)
  const coPa = co * U.CO_PA
  const nhan = U.NHAN_PA_EM * coPa
  if (d.phan === 'I' && d.pa.length > 0) {
    // chia cột giống `fitOptions` ở bậc 1–2; bậc ≥ 3 ép 2 cột
    const rong = d.pa.map((p) => nhan + rongChuEm(p) * U.RONG_CHU * coPa)
    const max = Math.max(...rong)
    const cot = bac >= 3 ? 2 : max * 4 + 3 * U.KHE_COT_PA_PX <= rongChu ? 4 : max * 2 + U.KHE_COT_PA_PX <= rongChu ? 2 : 1
    const rongCot = (rongChu - (cot - 1) * U.KHE_COT_PA_PX) / cot
    const hang = Math.ceil(d.pa.length / cot)
    let hp = 0
    for (let r = 0; r < hang; r++) {
      let cao = 0
      for (let c = 0; c < cot; c++) {
        const p = d.pa[r * cot + c]
        if (p === undefined) continue
        cao = Math.max(cao, demDong(p, coPa, rongCot - nhan) * coPa * U.DONG_PA)
      }
      hp += Math.max(cao, coPa * U.DONG_PA)
    }
    h += U.KHE_PA_PX + hp + (hang - 1) * U.KHE_HANG_PA_PX
  } else if (d.phan === 'II' && d.pa.length > 0) {
    const cot = bac >= 3 ? 2 : 1
    const rongCot = (rongChu - (cot - 1) * U.KHE_Y_COT_PX) / cot
    const hang = Math.ceil(d.pa.length / cot)
    let hp = 0
    for (let r = 0; r < hang; r++) {
      let cao = 0
      for (let c = 0; c < cot; c++) {
        const p = d.pa[r * cot + c]
        if (p === undefined) continue
        cao = Math.max(cao, demDong(p, coPa, rongCot - nhan) * coPa * U.DONG_PA)
      }
      hp += Math.max(cao, coPa * U.DONG_PA)
    }
    h += U.KHE_PA_PX + hp + (hang - 1) * U.KHE_Y_PX
  } else if (d.phan === 'III') {
    h += U.GHI_CHU_III_PX + Math.ceil((U.GHI_CHU_III_KY_TU * 0.44 * 0.6 * co) / rongChu) * 0.6 * co * 1.5
  }
  // dòng đầu thẻ đề (chip Câu N / phần) chỉ hiện ở đợt đơn (bậc ≥ 2); đệm dọc của thẻ đề
  return h * U.DU_AN_TOAN + dem.doc + (bac >= 2 ? chieuCaoDauDe(k.rong) : 0)
}

export interface UocLuongBac extends KetQuaLeoBac {
  /** Đợt bắt đầu ở nửa bảng (bậc 1) hay đơn. */
  ghepDoiDuoc: boolean
}

function uocTuDauVao(d: DauVao, k: KhungChieu, heSoChu: number): UocLuongBac {
  const san = Math.round(k.rong * BO_CUC_TO_CHIEU.CO_SAN_TL_RONG * 10) / 10
  const cfg: CauHinhLeoBac = {
    coChuan: Math.max(Math.round(k.rong * BO_CUC_TO_CHIEU.CO_CHUAN_TL_RONG * heSoChu * 10) / 10, san),
    coSan: san,
    coDay: Math.round(k.rong * BO_CUC_TO_CHIEU.CO_DAY_TL_RONG * 10) / 10,
    buocCo: BO_CUC_TO_CHIEU.BUOC_CO_PX,
    hinhToiThieu: BO_CUC_TO_CHIEU.HINH_TOI_THIEU,
    buocHinh: BO_CUC_TO_CHIEU.BUOC_HINH,
    batDauOBac: 1,
    coBac3: d.pa.length > 0 || d.soHinh > 0 || d.soDongBang > 0,
    toiDaLanDo: BO_CUC_TO_CHIEU.TOI_DA_LAN_DO,
  }
  const r = leoBacBoCuc((bac, co, hinh) => chieuCaoCan(d, bac as BacBoCuc, co, hinh, k) <= choSanCo(bac as BacBoCuc, k).cao, cfg)
  return { ...r, ghepDoiDuoc: r.bac === 1 }
}

/** ƯỚC LƯỢNG bậc bố cục của một câu ở khung `k`. `heSoChu` là hệ số cỡ chữ thầy chọn (0,85…1,4). */
export function uocLuongBacCau(c: CauLuyen, k: KhungChieu = KHUNG_UOC_MAC_DINH, heSoChu = 1): UocLuongBac {
  return uocTuDauVao(dauVaoTuCau(c), k, heSoChu)
}

/** Như `uocLuongBacCau` nhưng cho CÂU GỐC trong gói đề. */
export function uocLuongBacCauGoc(phan: 'I' | 'II' | 'III', q: unknown, k: KhungChieu = KHUNG_UOC_MAC_DINH, heSoChu = 1): UocLuongBac {
  return uocTuDauVao(dauVaoTuCauGoc(phan, q), k, heSoChu)
}
