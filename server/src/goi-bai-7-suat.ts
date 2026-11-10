// NỐI «ĐỀ 28 THEO SUẤT» (rut-28.ts) VÀO KẾ HOẠCH NGÀY GÓI 7 — thầy 10/11 duyệt «bản kịp hạn, build và đẩy lên bản sống luôn».
// Thuần CPU trên hồ sơ đã đọc (0 lệnh D1): ô của mọi câu (gói ⇒ meta gói; câu sửa / ôn ⇒ meta hồ sơ; bản song sinh «X~ss0» ⇒ câu gốc),
// hàng ôn và ôn sớm xếp lại theo NỢ ÔN của dạng (câu «Hỏi thầy» đến hạn kiểm vẫn đứng đầu như cũ).
// Nơi gọi (lapGoi7Tho, từ NGAY_DE_28, trừ ngày kiểm tra nhẹ cũ): mọi nguồn lấp 28 suất theo ô; ôn sớm (đã đọc sớm, không thêm đợt D1) luôn sẵn để lấp đúng ô.
import { oMaTran } from './ma-tran-rut-moi'
import { noOnDang, xepOnTheoNo } from './rut-28'
export { NGAY_DE_28 } from './rut-28'
import type { chonGoi7, CauGoi7 } from './goi-bai-7-loi'

type Vao = Parameters<typeof chonGoi7>[0]
type Meta = ReadonlyMap<string, { phan: string; mucDo: string | null; dang: string | null; tenDang: string | null }>
const goc = (q: string): string => q.replace(/~.*$/, '')

export function apSuat7(vao: Vao, hs: { meta: Meta; tt: ReadonlyMap<string, { lichSu: readonly { ngay: string; dung: boolean }[] }> }, cau: readonly CauGoi7[],
  daLam: ReadonlySet<string>, ngay: string, giuDau: ReadonlySet<string>, onSom: readonly string[] | undefined): void {
  const goi = new Map(cau.map((c) => [c.qid, c]))
  const metaCua = (q: string) => hs.meta.get(q) ?? hs.meta.get(goc(q))
  const oCua = (q: string): string => { const c = goi.get(q) ?? goi.get(goc(q)), m = c ?? metaCua(q); return oMaTran(m?.phan, m?.mucDo) }
  const dang = (q: string): string => { const m = metaCua(q); return m?.dang || m?.tenDang?.trim() || '' }
  const no = noOnDang(hs.tt, dang, ngay)
  vao.on = [...vao.on.filter((q) => giuDau.has(q)), ...xepOnTheoNo(vao.on.filter((q) => !giuDau.has(q)), dang, no)]
  if (onSom) vao.onSom = xepOnTheoNo(onSom, dang, no)
  vao.suat = { oCua, daLamO: [...daLam].map(oCua) }
}
