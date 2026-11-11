// NỢ CÂU cho THẦY và PHỤ HUYNH xem (thầy 11/11: «Làm tiếp cho thầy và phụ huynh xem nợ câu từng em») — đọc CHẶT trường `noCau` của `/gv/bai-hang-ngay`
// và `/ph/con-tong-quan` (server/src/no-cau-xem.ts) + chữ hiển thị. Một nguồn chữ cho hai app; luật ở máy chủ (server/src/no-cau.ts).
import type { NoCauXem } from '../../server/src/no-cau-xem'
export type { NoCauXem }

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null)
/** Lệch kiểu ⇒ null (không vẽ, không bịa số). */
export function docNoCauXem(x: unknown): NoCauXem | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>, l = (r.theoLoai ?? {}) as Record<string, unknown>
  const no = so(r.no), con = so(r.con), toiThieu = so(r.toiThieu), lan = so(r.lan), chon = so(r.so), daTra = so(r.daTra), lai = so(r.lai), laiDemNay = so(r.laiDemNay), muc = so(r.muc)
  if (!no || con === null || toiThieu === null || lan === null || chon === null || daTra === null || lai === null || laiDemNay === null || muc === null) return null
  if (con > no || chon > no || daTra > no || (r.kieu !== 'toi_thieu' && r.kieu !== 'het')) return null
  return { no, con, theoLoai: { moi: so(l.moi) ?? 0, sua: so(l.sua) ?? 0, on: so(l.on) ?? 0, lai: so(l.lai) ?? 0 }, toiThieu, lan, phaiTraHet: r.phaiTraHet === true, kieu: r.kieu, so: chon, daTra, lai, laiDemNay, muc, daChon: r.daChon === true }
}

const NHAN_LOAI: readonly (readonly [keyof NoCauXem['theoLoai'], string])[] = [['moi', 'câu mới'], ['sua', 'câu sửa'], ['on', 'câu ôn'], ['lai', 'câu lãi']]
/** «20 câu mới · 14 câu sửa · 6 câu ôn · 2 câu lãi» — nợ đầu ngày theo loại. */
export const chuLoaiNo = (nc: NoCauXem): string => NHAN_LOAI.filter(([k]) => nc.theoLoai[k] > 0).map(([k, ten]) => `${nc.theoLoai[k]} ${ten}`).join(' · ')
const chuKieu = (nc: NoCauXem): string => (nc.kieu === 'het' ? 'trả hết' : 'trả tối thiểu')

/** App thầy: dòng ngắn dưới tên em + câu đầy đủ (title / trình đọc màn hình). */
export function chuNoThay(nc: NoCauXem): { ngan: string; day: string } {
  const lan = nc.phaiTraHet ? 'hết 3 lần trả tối thiểu, phải trả hết' : `đã trả tối thiểu ${nc.lan}/3 lần`
  const homNay = nc.daChon ? `Hôm nay em chọn ${chuKieu(nc)} ${nc.so} câu, đã trả ${nc.daTra}.` : 'Hôm nay em chưa mở app.'
  return {
    ngan: `Nợ ${nc.con} câu${nc.phaiTraHet ? ' · phải trả hết' : ''}`, // một dòng trong cột tên (số lần trả tối thiểu nằm ở câu đầy đủ)
    day: `Nợ câu: còn ${nc.con} câu (đầu ngày ${nc.no} câu: ${chuLoaiNo(nc)}); ${lan}. ${homNay} Còn nợ thì đêm nay cộng ${nc.laiDemNay} câu lãi (${nc.lai} %).`,
  }
}
/** App phụ huynh: các câu nói thẳng, mỗi con số có nhãn. */
export function chuNoPhuHuynh(nc: NoCauXem): string[] {
  return [
    nc.daChon ? `Hôm nay con chọn ${chuKieu(nc)} ${nc.so} câu, đã trả ${nc.daTra} câu.` : 'Hôm nay con chưa mở app.',
    `Số còn nợ mỗi đêm cộng thêm ${nc.lai} % lãi (đêm nay ${nc.laiDemNay} câu). ${nc.phaiTraHet ? 'Con đã dùng hết 3 lần trả tối thiểu: hôm nay phải trả hết mới tính là xong bài.' : `Con được trả tối thiểu nhiều nhất 3 lần (đã dùng ${nc.lan}), lần thứ tư phải trả hết.`}`,
  ]
}
