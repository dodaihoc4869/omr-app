// MÀN CHIẾU NHỊP HỌC · Cách làm bài + Treo máy (bản vẽ docs/ban-ve-chieu-diem-danh-2310, thầy chốt 23/10: «hiển thị đủ thông tin treo máy»).
// Phép THUẦN trên số `/gv/muc-lam-lo` (14 ngày, mỗi em có mặt). Bản CÔNG KHAI (cả lớp nhìn): Cố tình treo máy GỘP vào Treo máy, không tách chữ.
// Không bịa số: em chưa có số không vào tổng; phút treo chỉ cộng khi MỌI em có treo đều có `giayTreo` (máy chủ cũ ⇒ null ⇒ màn ghi "—").
import type { MucLamEm } from '../../lib/muc-lam-lo-api'

export interface CachEm {
  voi: number
  nghi: number
  treo: number
}
/** Vội = Mức làm 1–2 · Có nghĩ = 3–4 · Treo = Treo máy + Cố tình (gộp). */
export const cachEm = (m: MucLamEm): CachEm => ({ voi: m.m[0] + m.m[1], nghi: m.m[2] + m.m[3], treo: m.soTreo + m.soCoTinh })

export interface TongCachLop extends CachEm {
  /** Số em có mặt / số em đã có số Mức làm. */
  soEm: number
  soEmCoSo: number
  soDo: number
  /** Lượt sai / lượt sai ở Mức 1–2 — null khi có em thiếu số lượt sai (máy chủ cũ). */
  sai: number | null
  saiVoi: number | null
  /** Tổng giây treo — null khi có em treo mà thiếu `giayTreo`. */
  giayTreo: number | null
  soEmTreo: number
  chuaDoTreo: number
}

export function tongCachLop(sbds: readonly string[], ml: ReadonlyMap<string, MucLamEm>): TongCachLop {
  const t: TongCachLop = { soEm: sbds.length, soEmCoSo: 0, voi: 0, nghi: 0, treo: 0, soDo: 0, sai: 0, saiVoi: 0, giayTreo: 0, soEmTreo: 0, chuaDoTreo: 0 }
  for (const s of new Set(sbds)) {
    const m = ml.get(s)
    if (!m) continue
    const c = cachEm(m)
    t.soEmCoSo++
    t.voi += c.voi
    t.nghi += c.nghi
    t.treo += c.treo
    t.soDo += m.soDo
    t.chuaDoTreo += m.soChuaDoTreo
    if (m.saiLamVoi === undefined || m.saiDuNghi === undefined) t.sai = t.saiVoi = null
    else if (t.sai !== null && t.saiVoi !== null) {
      t.sai += m.saiLamVoi + m.saiDuNghi
      t.saiVoi += m.saiLamVoi
    }
    if (c.treo > 0) {
      t.soEmTreo++
      if (m.giayTreo === undefined) t.giayTreo = null
      else if (t.giayTreo !== null) t.giayTreo += m.giayTreo
    }
  }
  return t
}

export interface DongTreo<E> {
  em: E
  treo: number
  /** Phút treo (làm tròn, tối thiểu 1 khi có giây) / số ngày có treo — null khi máy chủ chưa gửi. */
  phut: number | null
  soNgay: number | null
}
export const phutTreo = (giay: number): number => (giay > 0 ? Math.max(1, Math.round(giay / 60)) : 0)

/** Em có treo máy, nhiều lượt trước; cùng lượt ⇒ nhiều giây trước; rồi theo tên. */
export function dsTreoMay<E extends { sbd: string; hoTen: string }>(ds: readonly E[], ml: ReadonlyMap<string, MucLamEm>): DongTreo<E>[] {
  const ra: (DongTreo<E> & { g: number })[] = []
  for (const em of ds) {
    const m = ml.get(em.sbd)
    if (!m) continue
    const treo = m.soTreo + m.soCoTinh
    if (treo <= 0) continue
    ra.push({ em, treo, phut: m.giayTreo === undefined ? null : phutTreo(m.giayTreo), soNgay: m.soNgayTreo ?? null, g: m.giayTreo ?? -1 })
  }
  return ra.sort((a, b) => b.treo - a.treo || b.g - a.g || a.em.hoTen.localeCompare(b.em.hoTen, 'vi')).map(({ g: _g, ...d }) => d)
}
