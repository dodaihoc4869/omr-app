// NỢ CÂU (thầy 11/11, bản vẽ docs/ban-ve-lam-bu-1111) — đọc CHẶT tóm tắt `goi7.noCau` của máy chủ (server/src/no-cau.ts `tomTatNo`). Lệch kiểu ⇒ null ⇒ không vẽ thẻ.
export type KieuTraNo = 'toi_thieu' | 'het'
export interface NoCau {
  /** nợ đầu ngày */ no: number
  theoLoai: { moi: number; sua: number; on: number; lai: number }
  /** số câu trả tối thiểu hôm nay */ toiThieu: number
  /** số lần đã trả tối thiểu (0–3) */ lan: number
  phaiTraHet: boolean
  kieu: KieuTraNo
  /** số câu trả nợ đã chọn hôm nay (đã nằm trong mức hôm nay) */ so: number
  /** lãi mỗi đêm (%) */ lai: number
}
const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null)
export function docNoCau(x: unknown): NoCau | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>, l = (r.theoLoai ?? {}) as Record<string, unknown>
  const no = so(r.no), toiThieu = so(r.toiThieu), lan = so(r.lan), chon = so(r.so), lai = so(r.lai)
  if (!no || toiThieu === null || lan === null || chon === null || lai === null || chon > no || toiThieu > no || (r.kieu !== 'toi_thieu' && r.kieu !== 'het')) return null
  return { no, theoLoai: { moi: so(l.moi) ?? 0, sua: so(l.sua) ?? 0, on: so(l.on) ?? 0, lai: so(l.lai) ?? 0 }, toiThieu, lan, phaiTraHet: r.phaiTraHet === true, kieu: r.kieu, so: chon, lai }
}
/** Số SỐNG theo «đã làm hôm nay» (cùng luật máy chủ): câu làm đầu tiên trong ngày tính vào trả nợ; làm vượt mức hôm nay thì trừ thêm. */
export function noCauLuc(nc: NoCau, daLam: number, muc: number): { daTra: number; con: number; conTra: number } {
  const lam = Math.max(0, Math.floor(daLam) || 0), daTra = muc > 0 && lam >= muc ? Math.min(nc.no, nc.so + (lam - muc)) : Math.min(nc.so, lam)
  return { daTra, con: nc.no - daTra, conTra: Math.max(0, nc.so - daTra) }
}
/** Lãi một đêm trên số câu còn nợ (làm tròn lên). */
export const laiDem = (con: number, phanTram: number): number => (con > 0 ? Math.ceil(con * phanTram / 100) : 0)
