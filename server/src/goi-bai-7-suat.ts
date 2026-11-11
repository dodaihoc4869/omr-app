// NỐI «ĐỀ 28 THEO SUẤT» (rut-28.ts) VÀO KẾ HOẠCH NGÀY GÓI 7 — thầy 10/11 duyệt «bản kịp hạn, build và đẩy lên bản sống luôn».
// Thuần CPU trên hồ sơ đã đọc (0 lệnh D1): ô của mọi câu (gói ⇒ meta gói; câu sửa / ôn ⇒ meta hồ sơ; bản song sinh «X~ss0» ⇒ câu gốc),
// hàng ôn và ôn sớm xếp lại theo NỢ ÔN của dạng (câu «Hỏi thầy» đến hạn kiểm vẫn đứng đầu như cũ).
// Nơi gọi (lapGoi7Tho, từ NGAY_DE_28, trừ ngày kiểm tra nhẹ cũ): mọi nguồn lấp 28 suất theo ô; ôn sớm chỉ nạp khi đề còn suất lệch ô hoặc thiếu câu
// (luật tốc độ: ngày thường không lọc + sắp cả kho câu đã làm).
import { oMaTran } from './ma-tran-rut-moi'
import { noOnDang, xepOnTheoNo } from './rut-28'
export { NGAY_DE_28 } from './rut-28'
import type { chonGoi7, CauGoi7 } from './goi-bai-7-loi'

type Vao = Parameters<typeof chonGoi7>[0]
type Meta = ReadonlyMap<string, { phan: string; mucDo: string | null; dang: string | null; tenDang: string | null }>
const goc = (q: string): string => { const i = q.indexOf('~'); return i < 0 ? q : q.slice(0, i) }

/** Gắn `suat` + xếp hàng ôn theo nợ ôn dạng. Trả hàm xếp hàng ÔN SỚM (nơi gọi chỉ nạp ôn sớm khi đề còn suất lệch ô hoặc thiếu câu). */
export function apSuat7(vao: Vao, hs: { meta: Meta; tt: ReadonlyMap<string, { lichSu: readonly { ngay: string; dung: boolean }[] }> }, cau: readonly CauGoi7[],
  daLam: ReadonlySet<string>, ngay: string, giuDau: ReadonlySet<string>, nc?: { muc: number; so: number; daTra: number; theoLoai: { lai: number } } | null): (onSom: readonly string[]) => string[] {
  const goi = new Map(cau.map((c) => [c.qid, c]))
  const metaCua = (q: string) => hs.meta.get(q) ?? hs.meta.get(goc(q))
  const oCua = (q: string): string => { const m = goi.get(q) ?? metaCua(q) ?? goi.get(goc(q)); return oMaTran(m?.phan, m?.mucDo) }
  const dang = (q: string): string => { const m = metaCua(q); return m?.dang || m?.tenDang?.trim() || '' }
  // nợ ôn chỉ tính khi thật sự có hàng ôn để xếp (một lượt duyệt lịch sử của em)
  let nho: Map<string, number> | undefined
  const no = () => (nho ??= noOnDang(hs.tt, dang, ngay))
  if (vao.on.length > 1) { const dau: string[] = [], con: string[] = []; for (const q of vao.on) (giuDau.has(q) ? dau : con).push(q); vao.on = [...dau, ...xepOnTheoNo(con, dang, no())] }
  // nợ câu: mức hôm nay (> 28) ⇒ suất theo tỉ lệ; câu lãi còn phải trả hôm nay = lãi trong số đã chọn trả − số đã trả (trả lãi trước)
  vao.suat = { oCua, daLamO: [...daLam].map(oCua), tong: nc?.muc, lai: nc ? Math.max(0, Math.min(nc.so, nc.theoLoai.lai) - nc.daTra) : 0 }
  return (onSom) => xepOnTheoNo(onSom, dang, no())
}
