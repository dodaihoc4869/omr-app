// LUẬT NHÓM NHỊP HỌC — MỘT CHỖ, PHÉP THUẦN (không D1, không Env). Dùng chung cho:
//   · app thầy `src/lib/nhip-hoc-thay.ts` (Hôm nay › Nhịp học: `nhomTheoLuat`, `phanNhomEm`),
//   · máy chủ `/gv/ho-so-thai-do` (trường `nhomNhip`, bai-hang-ngay.ts) và `/hs/nhip-hoc` (bảng "Nhịp học của em", nhip-hoc-em.ts)
// ⇒ thầy và em thấy CÙNG một nhóm, cùng một số.
//
// LUẬT (thầy 12/10 duyệt bản vẽ; 12/10 chốt thêm: "6 ngày liền làm đủ mới thoát nhóm lười nhé"), tính trên các ngày ĐÃ QUA được tính (từ ngày em
// vào học — kẹp ≥ 01/10 — tới hôm qua; hôm nay chưa hết ngày nên không tính là thiếu):
//   · Chưa đủ dữ liệu: dưới 3 ngày đã qua.
//   · Lười: (đủ mức ≤ 40% số ngày đã qua HOẶC có ≥ 3 ngày liền không làm câu nào) VÀ chuỗi ngày đủ mức liền GẦN NHẤT < 6.
//   · Chuỗi đủ mức liền gần nhất ≥ 6 ⇒ THOÁT Lười: ≥ 80% là Chăm, còn lại Chưa đều.
//   · Chăm: ≥ 80% (không Lười). Chưa đều: còn lại.
//   Chuỗi đủ mức liền gần nhất: đếm lùi từ hôm qua tới ngày đầu tiên chưa đủ mức; hôm nay đã đủ mức thì cộng hôm nay (hôm nay chưa đủ thì không cắt
//   chuỗi — ngày chưa hết). So sánh bằng số nguyên (đủ × 100 so với tỉ lệ × số ngày) — không làm tròn ở biên 80% / 40%.
import { LUAT_NHOM_NHIP as L, type NgayNhipEm, type NhomNhip, type ViecTiepNhip } from './nhip-hoc-kieu'

/** Tên nhóm hiện trên màn (một khái niệm một từ ở cả hai app). */
export const TEN_NHOM_NHIP: Readonly<Record<NhomNhip, string>> = { cham: 'Chăm', 'chua-deu': 'Chưa đều', luoi: 'Lười', 'chua-du': 'Chưa đủ dữ liệu' }

/** Chia nhóm. `n` = số ngày đã qua được tính · `du` = số ngày đủ mức trong đó · `chuoiKhongLam` = số ngày liền không làm dài nhất ·
 *  `chuoiDuGanNhat` = chuỗi ngày đủ mức liền gần nhất (mặc định 0 = luật cũ, chưa xét đường thoát). */
export function nhomNhipTheoLuat(n: number, du: number, chuoiKhongLam: number, chuoiDuGanNhat = 0): NhomNhip {
  if (n < L.soNgayToiThieu) return 'chua-du'
  if (laLuoiTheoTiLe(n, du, chuoiKhongLam) && chuoiDuGanNhat < L.ngayLienThoatLuoi) return 'luoi'
  if (du * 100 >= L.chamTu * n) return 'cham'
  return 'chua-deu'
}

/** Vế đầu của luật Lười (chưa xét đường thoát): đủ mức ≤ 40% số ngày HOẶC ≥ 3 ngày liền không làm. */
export const laLuoiTheoTiLe = (n: number, du: number, chuoiKhongLam: number): boolean =>
  du * 100 <= L.luoiDen * n || chuoiKhongLam >= L.ngayLienKhongLam

const du = (x: NgayNhipEm): boolean => x.lam >= x.muc

/** Chuỗi ngày đủ mức liền gần nhất. `ngay` = các ngày ĐƯỢC TÍNH (từ ngày vào, cũ → mới, liền nhau), có thể gồm hôm nay. */
export function chuoiDuGanNhat(ngay: readonly NgayNhipEm[], homNay: string): number {
  let chuoi = 0
  for (let i = ngay.length - 1; i >= 0; i--) {
    const x = ngay[i]!
    if (x.ngay > homNay) continue
    if (x.ngay === homNay) {
      if (du(x)) chuoi++
      continue
    }
    if (!du(x)) break
    chuoi++
  }
  return chuoi
}

export interface TomTatNhip {
  nhom: NhomNhip
  /** Số ngày đã qua được tính (tới hôm qua). */
  soNgayQua: number
  soNgayDu: number
  soNgayThieu: number
  /** Tổng câu còn thiếu so với mức qua các ngày đã qua. */
  tongCauThieu: number
  soNgayKhongLam: number
  /** Tổng câu đã làm qua các ngày đã qua (KHÔNG gồm hôm nay). */
  tongLam: number
  /** Chuỗi ngày liền không làm câu nào DÀI NHẤT (ngày đã qua; hoà ⇒ chuỗi gần đây hơn). */
  chuoiKhongLam: { dai: number; tu: string; den: string } | null
  chuoiDuGanNhat: number
  /** Ngày đủ mức gần nhất (gồm hôm nay khi đã đủ). */
  ngayDuGanNhat: string | null
  /** Hôm nay tới lúc tải; dãy không có hôm nay ⇒ null. */
  homNay: { muc: number; lam: number } | null
}

/** Tóm tắt một em từ dãy ngày ĐƯỢC TÍNH (đã bỏ ngày trước khi em vào học). Thuần. */
export function tomTatNhip(ngay: readonly NgayNhipEm[], homNay: string): TomTatNhip {
  const qua = ngay.filter((x) => x.ngay < homNay)
  const h = ngay.find((x) => x.ngay === homNay)
  let lon: { dai: number; tu: string; den: string } | null = null
  for (let i = 0, dau = -1; i < qua.length; i++) {
    if (qua[i]!.lam > 0) {
      dau = -1
      continue
    }
    if (dau < 0) dau = i
    const dai = i - dau + 1
    if (!lon || dai >= lon.dai) lon = { dai, tu: qua[dau]!.ngay, den: qua[i]!.ngay }
  }
  const soDu = qua.filter(du).length
  const chuoi = chuoiDuGanNhat(ngay, homNay)
  let ganNhat: string | null = null
  for (const x of ngay) if (x.ngay <= homNay && du(x)) ganNhat = x.ngay
  return {
    nhom: nhomNhipTheoLuat(qua.length, soDu, lon?.dai ?? 0, chuoi),
    soNgayQua: qua.length,
    soNgayDu: soDu,
    soNgayThieu: qua.length - soDu,
    tongCauThieu: qua.reduce((t, x) => t + Math.max(0, x.muc - x.lam), 0),
    soNgayKhongLam: qua.filter((x) => x.lam <= 0).length,
    tongLam: qua.reduce((t, x) => t + x.lam, 0),
    chuoiKhongLam: lon,
    chuoiDuGanNhat: chuoi,
    ngayDuGanNhat: ganNhat,
    homNay: h ? { muc: h.muc, lam: h.lam } : null,
  }
}

/**
 * Số ngày đủ mức CẦN THÊM để lên Chăm, giả sử từ nay ngày nào cũng đủ (mỗi ngày đủ cộng 1 vào cả số ngày đủ lẫn số ngày đã qua).
 * Hôm nay đã đủ ⇒ đã tính hôm nay vào (kết quả là số ngày SAU hôm nay); hôm nay chưa đủ ⇒ kết quả tính cả hôm nay.
 * Nhỏ nhất k ≥ 0 với (du + k) × 100 ≥ 80 × (n + k). Đã ≥ 80% ⇒ 0.
 */
export function ngayDuCanThemDeCham(n: number, soDu: number, homNayDu: boolean): number {
  const nn = n + (homNayDu ? 1 : 0)
  const dd = soDu + (homNayDu ? 1 : 0)
  const thieu = L.chamTu * nn - 100 * dd
  return thieu <= 0 ? 0 : Math.ceil(thieu / (100 - L.chamTu))
}

/** Việc tiếp theo nhóm (bảng "Nhịp học của em"). Thuần. */
export function viecTiepNhip(t: TomTatNhip): ViecTiepNhip {
  const h = t.homNay
  const homNayDu = !!h && h.lam >= h.muc
  const cauConHomNay = h ? Math.max(0, h.muc - h.lam) : 0
  if (t.nhom === 'chua-du') return { loai: 'chua-du', conNgay: Math.max(0, L.soNgayToiThieu - t.soNgayQua), cauConHomNay, homNayDu }
  if (t.nhom === 'luoi') return { loai: 'thoat-luoi', coNgay: Math.min(t.chuoiDuGanNhat, L.ngayLienThoatLuoi), canNgay: L.ngayLienThoatLuoi, cauConHomNay, homNayDu }
  if (t.nhom === 'chua-deu') {
    const nhoChuoi = laLuoiTheoTiLe(t.soNgayQua, t.soNgayDu, t.chuoiKhongLam?.dai ?? 0)
    return { loai: 'len-cham', ngayCanThem: ngayDuCanThemDeCham(t.soNgayQua, t.soNgayDu, homNayDu), cauConHomNay, homNayDu, nhoChuoi, chuoi: t.chuoiDuGanNhat }
  }
  return { loai: 'giu-chuoi', cauConHomNay, homNayDu, chuoiNeuDu: t.chuoiDuGanNhat + (homNayDu || !h ? 0 : 1) }
}
