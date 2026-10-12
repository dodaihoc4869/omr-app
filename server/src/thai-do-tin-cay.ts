// ĐỘ TIN CẬY CỦA HỒ SƠ THÁI ĐỘ (thầy 12/10: "Hồ sơ của hs … đo kĩ hơn nữa thái độ của học sinh chính xác hơn 90%") — PHÉP THUẦN, không D1,
// không Env (test gọi thẳng). Dùng ở `tinhThaiDo` (bai-hang-ngay.ts — hồ sơ thầy / em / phụ huynh) và `/hs/nhip-hoc`, `/ph/nhip-hoc` (nhip-hoc-em.ts).
//
// KHÔNG ĐỔI NHÃN: luật kết luận `LUAT_KET_LUAN` (bai-hang-ngay-kieu.ts) và luật nhóm Nhịp học (`nhomNhipTheoLuat`, nhip-hoc-luat.ts) giữ nguyên —
// thầy đã duyệt. Tệp này chỉ trả lời hai câu: "với chừng này ngày / lượt, nhãn ấy chắc tới đâu" (`doTinCay`, 0–99) và "cần thêm bao nhiêu số liệu
// để chắc từ 90%" (`canThem`). Không đọc thêm gì từ D1: chỉ dùng các số đếm `tinhThaiDo` / `tomTatNhip` đã có.
//
// CÁCH TÍNH (in nguyên văn cho người đọc ở `CACH_TINH_TIN_CAY`):
//  1. Mỗi tỉ lệ (ngày đủ mức / số ngày, lượt quá nhanh / lượt có số giây, …) coi là k lần "có" trong n lần thử độc lập. Tỉ lệ THẬT θ (tỉ lệ sẽ thấy
//     nếu theo dõi rất lâu) có phân bố hậu nghiệm Beta(k + ½, n − k + ½) — tiên nghiệm Jeffreys, cho kết quả sát khoảng Wilson một phía (Brown, Cai &
//     DasGupta 2001). P(θ < t) = I_t(k + ½, n − k + ½) (hàm Beta chính quy hoá, tính bằng phân số liên tục — `betaChinhQuy`).
//  2. Độ tin cậy của một TÍN HIỆU = xác suất θ nằm CÙNG VÙNG (tốt / chú ý / xấu) với tỉ lệ đã đo, đúng ngưỡng `NGUONG_THAI_DO`:
//     · (b) quá nhanh: vùng xấu cần HAI điều (≥ 30% lượt quá nhanh VÀ nhóm ấy đúng < 50%) ⇒ nhân hai xác suất (coi hai tỉ lệ độc lập);
//     · (e) chọn lặp: các lượt trong một chuỗi không độc lập ⇒ đếm theo KHỐI 6 lượt (k/6 trên n/6) — thận trọng hơn đếm từng lượt;
//     · (f) độ đúng theo thời gian: hiệu hai tỉ lệ ⇒ xấp xỉ chuẩn với trung bình và phương sai của hai phân bố Beta.
//     Tín hiệu "chưa đủ dữ liệu" không có độ tin cậy (luật chưa đo).
//  3. Độ tin cậy của KẾT LUẬN = xác suất luật kết luận cho ĐÚNG nhãn ấy nếu biết tỉ lệ thật, tính trên các tín hiệu quyết định nhãn:
//     · Đối phó: 1 − Π(1 − p) trên các điều kiện đã kích hoạt (một điều kiện đúng là đủ);
//     · Lười / Chưa đều / Chăm chỉ: tỉ lệ ngày đủ mức (ngưỡng 40% và 80%) + (c) dồn bài; luật theo SỰ VIỆC đã xảy ra (≥ 3 ngày liền không làm câu
//       nào, đủ mức 6 ngày liền) là chắc chắn, không ước lượng. Không cộng khả năng có dấu hiệu đối phó chưa đo được.
//  4. Trần 99: không bao giờ nói chắc 100%. Các ngày liền nhau thường giống nhau hơn các lần thử độc lập ⇒ độ tin cậy thật có thể thấp hơn đôi chút;
//     vì vậy chỉ coi là chắc khi từ 90% (`NGUONG_CHAC`).
//  5. `canThem`: giữ nguyên các tỉ lệ đã đo, tăng dần số ngày (nhãn theo ngày) hoặc số lượt (đối phó) tới khi độ tin cậy đạt 90%; trong 90 ngày /
//     gấp 10 lần số lượt mà vẫn chưa đạt (tỉ lệ sát ngưỡng) ⇒ câu nói thật là thêm số liệu như cũ chưa làm rõ được.
import { NGUONG_THAI_DO as NG, type MaTinHieu, type MucTinHieu, type NhanThaiDo, type TinHieuThaiDo } from './bai-hang-ngay-kieu'

/** Độ tin cậy từ mức này trở lên mới coi là chắc (thầy: "chính xác hơn 90%"). */
export const NGUONG_CHAC = 90
/** Không bao giờ nói chắc 100%. */
export const TRAN_TIN_CAY = 99
/** `canThem` tìm tối đa thêm 90 ngày (nhãn theo ngày) / gấp 10 lần số lượt (đối phó). */
export const TOI_DA_NGAY_THEM = 90
export const TOI_DA_HE_SO_LUOT = 10

/** Câu "Cách tính" cho người đọc (app in nguyên văn dưới phần ngưỡng). */
export const CACH_TINH_TIN_CAY =
  'Độ tin cậy là xác suất (0–99%) để tỉ lệ THẬT của em nằm cùng phía ngưỡng với tỉ lệ đã đo, tính theo số ngày / số lượt đã có: coi mỗi ngày ' +
  '(mỗi lượt) là một lần thử, tỉ lệ thật theo phân bố Beta(số lần có + ½, số lần không + ½) — tiên nghiệm Jeffreys, sát khoảng Wilson một phía. ' +
  'Quá nhanh mà đúng thấp nhân hai xác suất; chọn lặp đếm theo khối 6 lượt; độ đúng theo thời gian dùng xấp xỉ chuẩn cho hiệu hai tỉ lệ. ' +
  'Kết luận: xác suất luật vẫn ra đúng nhãn ấy nếu biết tỉ lệ thật; sự việc đã xảy ra (3 ngày liền không làm, đủ mức 6 ngày liền) coi là chắc chắn. ' +
  `Ngày liền nhau thường giống nhau hơn các lần thử độc lập nên chỉ coi là chắc khi từ ${NGUONG_CHAC}%; không bao giờ ghi 100%.`

// ------------------------------------------------------------------ toán thuần

/** ln Γ(z), z > 0 — xấp xỉ Lanczos (g = 7, 9 hệ số), sai số ~1e-15. */
function lnGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z)
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  const x = z - 1
  let a = c[0]!
  const t = x + 7.5
  for (let i = 1; i < 9; i++) a += c[i]! / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** Phân số liên tục của hàm Beta chính quy hoá (Lentz, như Numerical Recipes `betacf`). */
function phanSoBeta(a: number, b: number, x: number): number {
  const NHO = 1e-300
  const qab = a + b, qap = a + 1, qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < NHO) d = NHO
  d = 1 / d
  let h = d
  for (let m = 1; m <= 5000; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < NHO) d = NHO
    c = 1 + aa / c
    if (Math.abs(c) < NHO) c = NHO
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < NHO) d = NHO
    c = 1 + aa / c
    if (Math.abs(c) < NHO) c = NHO
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-12) break
  }
  return h
}

/** Hàm Beta chính quy hoá I_x(a, b) = P(θ ≤ x) với θ ~ Beta(a, b); a, b > 0. */
export function betaChinhQuy(x: number, a: number, b: number): number {
  if (!(x > 0)) return 0
  if (x >= 1) return 1
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x))
  return x < (a + 1) / (a + b + 2) ? (bt * phanSoBeta(a, b, x)) / a : 1 - (bt * phanSoBeta(b, a, 1 - x)) / b
}

/** P(θ < t) khi đã thấy k lần "có" trong n lần (hậu nghiệm Jeffreys Beta(k + ½, n − k + ½)). k, n có thể lẻ (đếm theo khối / phóng to). */
export function xacSuatDuoi(k: number, n: number, t: number): number {
  const kk = Math.max(0, Math.min(k, n))
  return betaChinhQuy(t, kk + 0.5, Math.max(0, n - kk) + 0.5)
}
export const xacSuatTren = (k: number, n: number, t: number): number => 1 - xacSuatDuoi(k, n, t)

/** Trung bình, phương sai hậu nghiệm Jeffreys. */
function beta2(k: number, n: number): { tb: number; pv: number } {
  const a = Math.max(0, Math.min(k, n)) + 0.5, b = Math.max(0, n - Math.max(0, Math.min(k, n))) + 0.5
  return { tb: a / (a + b), pv: (a * b) / ((a + b) ** 2 * (a + b + 1)) }
}

/** Φ(z) — hàm phân phối chuẩn tắc (erf theo Abramowitz–Stegun 7.1.26, sai số < 1,5e-7). */
export function phanPhoiChuan(z: number): number {
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf)
}

/** Xác suất (0–1) ⇒ độ tin cậy 0–99 (làm tròn, trần 99). */
export const sangDoTinCay = (p: number): number => Math.max(0, Math.min(TRAN_TIN_CAY, Math.round(100 * (Number.isFinite(p) ? p : 0))))

// ------------------------------------------------------------------ số liệu thô của sáu tín hiệu

/** Số đếm thô `tinhThaiDo` đã có (không đọc thêm D1). Mọi số là SỐ ĐẾM, không mã câu. */
export interface SoLieuThaiDo {
  /** (a) ngày đủ mức / số ngày đã tính. */
  ngay: { du: number; n: number }
  /** (b) lượt quá nhanh / lượt có số giây · lượt quá nhanh đúng / lượt quá nhanh có kết quả. */
  nhanh: { nhanh: number; coGiay: number; dungNhanh: number; nhanhCoKq: number }
  /** (c) lượt 23:00–04:59 / mọi lượt. */
  don: { khuya: number; tong: number }
  /** (d) câu có gợi ý / đọc lời giải ÷ câu đã làm. */
  goiY: { hoTro: number; soCau: number }
  /** (e) lượt trắc nghiệm trong chuỗi chọn lặp / lượt trắc nghiệm có chữ chọn. */
  lap: { trongChuoi: number; tong: number }
  /** (f) đúng / có kết quả của 7 ngày gần nhất và trước đó. */
  xuHuong: { ganDung: number; gan: number; truocDung: number; truoc: number }
}

/** Xác suất (0–1) tỉ lệ thật rơi vào từng vùng của một tín hiệu. */
export interface XacSuatVung {
  tot: number
  chuY: number
  xau: number
}

const pt = (x: number): number => x / 100
const khongAm = (x: number): number => Math.max(0, Math.min(1, x))

/** Vùng của tỉ lệ "càng cao càng xấu" (dồn bài, gợi ý, chọn lặp): xấu ≥ `xau`%, chú ý ≥ `chuY`%. */
function vungCaoLaXau(k: number, n: number, chuY: number, xau: number): XacSuatVung {
  const pXau = xacSuatTren(k, n, pt(xau))
  const pTot = xacSuatDuoi(k, n, pt(chuY))
  return { tot: pTot, xau: pXau, chuY: khongAm(1 - pTot - pXau) }
}

/**
 * Xác suất từng vùng của một tín hiệu với số liệu `s` PHÓNG TO `heSo` lần (giữ nguyên tỉ lệ đã đo — dùng để tìm `canThem`; `heSo` = 1 là số thật).
 * Đúng các ngưỡng của `tinhThaiDo` (`NGUONG_THAI_DO`).
 */
export function xacSuatVung(ma: MaTinHieu, s: SoLieuThaiDo, heSo = 1): XacSuatVung {
  const h = heSo
  switch (ma) {
    case 'ngay-du-muc': {
      const tot = xacSuatTren(s.ngay.du * h, s.ngay.n * h, pt(NG.ngayDuTot))
      const xau = xacSuatDuoi(s.ngay.du * h, s.ngay.n * h, pt(NG.ngayDuChuY))
      return { tot, xau, chuY: khongAm(1 - tot - xau) }
    }
    case 'qua-nhanh': {
      const n = s.nhanh
      const tren15 = xacSuatTren(n.nhanh * h, n.coGiay * h, pt(NG.nhanChuY))
      const tren30 = xacSuatTren(n.nhanh * h, n.coGiay * h, pt(NG.nhanXau))
      const dungThap = xacSuatDuoi(n.dungNhanh * h, n.nhanhCoKq * h, pt(NG.nhanDungThap))
      const xau = tren30 * dungThap
      return { tot: 1 - tren15, xau, chuY: khongAm(tren15 - xau) }
    }
    case 'don-bai':
      return vungCaoLaXau(s.don.khuya * h, s.don.tong * h, NG.donChuY, NG.donXau)
    case 'goi-y':
      return vungCaoLaXau(s.goiY.hoTro * h, s.goiY.soCau * h, NG.goiYChuY, NG.goiYXau)
    case 'chon-lap':
      // Khối `chuoiLap` lượt: một chuỗi lặp kéo theo cả khối, các lượt trong đó không độc lập.
      return vungCaoLaXau((s.lap.trongChuoi * h) / NG.chuoiLap, (s.lap.tong * h) / NG.chuoiLap, NG.lapChuY, NG.lapXau)
    case 'xu-huong': {
      const g = beta2(s.xuHuong.ganDung * h, s.xuHuong.gan * h)
      const t = beta2(s.xuHuong.truocDung * h, s.xuHuong.truoc * h)
      const tb = g.tb - t.tb
      const dl = Math.sqrt(g.pv + t.pv) || 1e-9
      const xau = phanPhoiChuan((-pt(NG.giamXau) - tb) / dl)
      const duoi5 = phanPhoiChuan((-pt(NG.giamChuY) - tb) / dl)
      return { tot: 1 - duoi5, xau, chuY: khongAm(duoi5 - xau) }
    }
  }
}

/** Độ tin cậy (0–99) của MỘT tín hiệu: xác suất tỉ lệ thật cùng vùng với mức đã đo. 'chua-du' ⇒ undefined (luật chưa đo). */
export function doTinCayTinHieu(ma: MaTinHieu, muc: MucTinHieu, s: SoLieuThaiDo): number | undefined {
  if (muc === 'chua-du') return undefined
  const v = xacSuatVung(ma, s)
  return sangDoTinCay(muc === 'tot' ? v.tot : muc === 'chu-y' ? v.chuY : v.xau)
}

// ------------------------------------------------------------------ độ tin cậy của nhãn

/** Nhãn theo NGÀY (Lười / Chưa đều / Chăm chỉ): đầu vào chung cho hồ sơ thái độ và Nhịp học. */
export interface DauVaoNhanNgay {
  /** Số ngày đã tính / số ngày đủ mức. */
  n: number
  du: number
  /** Chuỗi ngày liền không làm dài nhất · chuỗi ngày đủ mức liền gần nhất (sự việc, không ước lượng). */
  chuoiKhongLam: number
  chuoiDuGanNhat: number
  /** Xác suất (theo hệ số phóng) (c) dồn bài thật ở vùng xấu; luật chưa đo (c) ⇒ bỏ trống (= 0: luật chưa thể kích hoạt). */
  donXau?: (heSo: number) => number
}

/** Xác suất (0–1) luật cho đúng nhãn theo ngày `nhan` nếu biết tỉ lệ thật — xem mục 3 đầu tệp. Nhãn khác ⇒ null. */
export function xacSuatNhanNgay(nhan: NhanThaiDo, d: DauVaoNhanNgay, heSo = 1): number | null {
  const n = d.n * heSo, du = d.du * heSo
  const thoat = d.chuoiDuGanNhat >= NG.ngayLienThoatLuoi // sự việc: đủ mức 6 ngày liền ⇒ không thể Lười
  const boNgay = d.chuoiKhongLam >= NG.ngayLienKhongLam // sự việc: 3 ngày liền không làm
  const thap = xacSuatDuoi(du, n, pt(NG.ngayDuLuoi)) // θ ≤ 40%
  const cao = xacSuatTren(du, n, pt(NG.ngayDuTot)) // θ ≥ 80%
  const giua = khongAm(1 - thap - cao)
  const pc = d.donXau ? khongAm(d.donXau(heSo)) : 0
  if (nhan === 'luoi') return thoat ? 0 : boNgay ? 1 : thap
  if (nhan === 'chua-deu') return thoat ? 1 - cao * (1 - pc) : boNgay ? 0 : giua + cao * pc
  if (nhan === 'cham-chi') return !thoat && boNgay ? 0 : cao * (1 - pc)
  return null
}

/** Ngưỡng tỉ lệ ngày đủ mức gần nhất với tỉ lệ đã đo (để nói thật "đang sát ngưỡng …"). */
function nguongGan(nhan: NhanThaiDo, d: DauVaoNhanNgay): number {
  if (nhan === 'luoi') return NG.ngayDuLuoi
  if (nhan === 'cham-chi' || d.chuoiDuGanNhat >= NG.ngayLienThoatLuoi) return NG.ngayDuTot
  const p = d.n ? (100 * d.du) / d.n : 0
  return Math.abs(p - NG.ngayDuLuoi) <= Math.abs(p - NG.ngayDuTot) ? NG.ngayDuLuoi : NG.ngayDuTot
}

/** Nhỏ nhất k ∈ [1, tran] với f((goc + k) / goc) ≥ 0,9 (tìm nhị phân; f tăng theo cỡ mẫu khi tỉ lệ không đổi). Không đạt ⇒ null. */
function timThem(f: (heSo: number) => number, goc: number, tran: number): number | null {
  if (goc <= 0) return null
  const dat = (k: number) => f((goc + k) / goc) * 100 >= NGUONG_CHAC - 0.5
  if (!dat(tran)) return null
  let lo = 1, hi = tran
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (dat(mid)) hi = mid
    else lo = mid + 1
  }
  return lo
}

/** Độ tin cậy + câu "cần thêm" của một nhãn theo ngày (Nhịp học dùng thẳng; hồ sơ thái độ dùng qua `tinCayKetLuan`). */
export function tinCayNhanNgay(nhan: NhanThaiDo, d: DauVaoNhanNgay): { doTinCay?: number; canThem?: string } {
  const p = xacSuatNhanNgay(nhan, d)
  if (p === null || d.n <= 0) return {}
  const doTinCay = sangDoTinCay(p)
  if (doTinCay >= NGUONG_CHAC) return { doTinCay }
  const k = timThem((h) => xacSuatNhanNgay(nhan, d, h) ?? 0, d.n, TOI_DA_NGAY_THEM)
  if (k !== null) return { doTinCay, canThem: `Cần thêm khoảng ${k} ngày có số liệu (giữ nhịp như hiện nay) để độ tin cậy đạt ${NGUONG_CHAC}%.` }
  const tl = Math.round((100 * d.du) / d.n)
  return {
    doTinCay,
    canThem: `Tỉ lệ ngày đủ mức (${tl}%) đang sát ngưỡng ${nguongGan(nhan, d)}% — giữ nhịp như hiện nay thì thêm ${TOI_DA_NGAY_THEM} ngày cũng chưa chắc được ${NGUONG_CHAC}%; nhãn chỉ rõ khi những ngày tới nghiêng hẳn về một phía.`,
  }
}

/**
 * Độ tin cậy của KẾT LUẬN hồ sơ thái độ (mục 3 đầu tệp). `nhan` là nhãn `ketLuanThaiDo` đã trả (KHÔNG tính lại nhãn); `tinHieu` để biết điều kiện nào
 * đã kích hoạt. 'chua-du-du-lieu' ⇒ {} (giữ nguyên như cũ).
 */
export function tinCayKetLuan(
  nhan: NhanThaiDo,
  tinHieu: readonly TinHieuThaiDo[],
  s: SoLieuThaiDo,
  chuoiKhongLam: number,
  chuoiDuGanNhat: number,
): { doTinCay?: number; canThem?: string } {
  if (nhan === 'chua-du-du-lieu') return {}
  const muc = (ma: MaTinHieu): MucTinHieu => tinHieu.find((x) => x.ma === ma)?.muc ?? 'chua-du'
  if (nhan === 'doi-pho') {
    // Các điều kiện ĐÃ kích hoạt (đúng luật 1 của `ketLuanThaiDo`), mỗi điều kiện một xác suất theo hệ số phóng.
    const dk: ((h: number) => number)[] = []
    if (muc('qua-nhanh') === 'xau') dk.push((h) => xacSuatVung('qua-nhanh', s, h).xau)
    if (muc('chon-lap') === 'xau') dk.push((h) => xacSuatVung('chon-lap', s, h).xau)
    if (muc('goi-y') === 'xau' && (muc('xu-huong') === 'xau' || muc('xu-huong') === 'chu-y')) {
      dk.push((h) => {
        const f = xacSuatVung('xu-huong', s, h)
        return xacSuatVung('goi-y', s, h).xau * (f.chuY + f.xau)
      })
    }
    if (!dk.length) return {}
    const f = (h: number) => 1 - dk.reduce((t, g) => t * (1 - khongAm(g(h))), 1)
    const doTinCay = sangDoTinCay(f(1))
    if (doTinCay >= NGUONG_CHAC) return { doTinCay }
    const goc = Math.max(s.don.tong, s.nhanh.coGiay, s.lap.tong, 1)
    const k = timThem(f, goc, goc * TOI_DA_HE_SO_LUOT)
    return {
      doTinCay,
      canThem: k !== null
        ? `Cần thêm khoảng ${k} lượt làm câu (làm như hiện nay) để độ tin cậy đạt ${NGUONG_CHAC}%.`
        : `Các tỉ lệ đang sát ngưỡng — làm thêm gấp ${TOI_DA_HE_SO_LUOT} lần số lượt hiện có theo cách như hiện nay cũng chưa chắc được ${NGUONG_CHAC}%.`,
    }
  }
  const coDon = muc('don-bai') !== 'chua-du'
  return tinCayNhanNgay(nhan, {
    n: s.ngay.n,
    du: s.ngay.du,
    chuoiKhongLam,
    chuoiDuGanNhat,
    donXau: coDon ? (h) => xacSuatVung('don-bai', s, h).xau : undefined,
  })
}
