// NỢ CÂU (thầy 11/11, bản vẽ docs/ban-ve-lam-bu-1111) — đọc tóm tắt `goi7.noCau` của máy chủ (server/src/no-cau.ts `tomTatNo`). Lệch kiểu ⇒ null ⇒ không vẽ thẻ.
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
/** Kiểm NHẸ cho lượt vẽ đầu (nút chính «Trả nợ câu trước»); thẻ ở mảnh lười kiểm chặt lại bằng `docNoCau` (TheNoCau.tsx). */
export const ncTho = (x: unknown): NoCau | null => { const r = x as NoCau | null; return r && typeof r.no === 'number' && r.no > 0 && typeof r.so === 'number' && r.so >= 0 && r.so <= r.no && (r.kieu === 'toi_thieu' || r.kieu === 'het') ? r : null }
/** Số SỐNG theo «đã làm hôm nay» (cùng luật máy chủ): câu làm đầu tiên trong ngày tính vào trả nợ; làm vượt mức hôm nay thì trừ thêm. */
export function noCauLuc(nc: NoCau, daLam: number, muc: number): { daTra: number; con: number; conTra: number } {
  const lam = Math.max(0, daLam), daTra = muc > 0 && lam >= muc ? Math.min(nc.no, nc.so + lam - muc) : Math.min(nc.so, lam)
  return { daTra, con: nc.no - daTra, conTra: Math.max(0, nc.so - daTra) }
}
