// Tải chi tiết câu đã làm + NHỚ ở máy. Tách khỏi `api.ts` (tải mở app HS) — chỉ màn «Câu đã làm» (nạp lười) dùng.
import { docChiTiet, goiHoa2, type ChiTietCau } from './api'

/** Máy chủ nhận tối đa 60 câu một lượt (`hoa2-cau-chi-tiet`). */
export const TOI_DA_MOT_LUOT = 60

// «XEM LẠI» TỨC THÌ (thầy 29/10 «Bấm vào để xem lại chưa tức thì»): chi tiết (đề + đáp án + lời giải) đã tải một lần được NHỚ ở máy 3 phút — mở lại tab «Câu đã làm» / bấm lại
// một câu: có ngay, không gọi máy chủ. Theo (token, câu): em này không thấy bản của em khác; quá 300 câu nhớ ⇒ xoá sạch nhớ lại từ đầu.
const nhoChiTiet = new Map<string, { ct: ChiTietCau; luc: number }>()
/** Xoá bộ nhớ chi tiết (đăng xuất / test). */
export function xoaNhoChiTiet(): void { nhoChiTiet.clear() }

/** Lấy chi tiết nhiều câu, chia lượt ≤ 60 câu. `tienDo(da, tong)` báo sau mỗi lượt. */
export async function taiChiTiet(token: string, qids: string[], tienDo?: (da: number, tong: number) => void): Promise<ChiTietCau[]> {
  const ra: ChiTietCau[] = [], can: string[] = [], nay = Date.now()
  for (const q of qids) { const c = nhoChiTiet.get(`${token}|${q}`); if (c && nay - c.luc < 18e4) ra.push(c.ct); else can.push(q) }
  const daCo = ra.length
  if (!can.length) { if (daCo) tienDo?.(daCo, daCo); return ra }
  for (let i = 0; i < can.length; i += TOI_DA_MOT_LUOT) {
    const lo = can.slice(i, i + TOI_DA_MOT_LUOT)
    const o = await goiHoa2('hoa2-cau-chi-tiet', token, lo.length === 1 ? { qid: lo[0] } : { qids: lo }, 30)
    for (const c of Array.isArray(o.cau) ? o.cau : []) {
      const d = docChiTiet(c)
      if (d) { ra.push(d); if (nhoChiTiet.size > 299) nhoChiTiet.clear(); nhoChiTiet.set(`${token}|${d.de.qid}`, { ct: d, luc: Date.now() }) }
    }
    tienDo?.(Math.min(qids.length, daCo + i + lo.length), qids.length)
  }
  return ra
}
