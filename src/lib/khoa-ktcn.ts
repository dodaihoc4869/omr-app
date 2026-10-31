// KIỂM TRA ÔN TẬP — GÓI PHẦN CHỮA ĐÃ KHOÁ trên máy em (thầy 31/10; máy chủ: server/src/kiem-tra-ca-nhan-khoa.ts). Lúc em làm bài, máy tải ở nền gói phần chữa
// (đề + đáp án + lời giải từng câu) MÃ HOÁ bằng chìa riêng của em — máy KHÔNG có chìa trong lúc làm. Nộp / xem kết quả: báo máy chủ phiên bản gói đang giữ ⇒ máy
// chủ trả phần chữa GỌN (mã câu, câu trả lời, đúng / sai) + CHÌA ⇒ mở gói ghép lại đúng dạng phần chữa cũ ⇒ hiện tức thì. Mở hỏng ⇒ null (nơi gọi hỏi lại
// phần chữa nguyên như cũ). Nằm trong mảnh nạp lười của màn Kiểm tra ôn tập; tự mở AES-GCM (không kéo mảnh khác).
export interface GoiKt { phien: string; goi: string }
const khoaLuu = (sbd: string, id: string) => `ktcn:goi:${sbd}:${id}`
export const kemGoiKt = (id: string, sbd: string, phien: string): string => `ktcn|${id}|${sbd}|${phien}`

export function docGoiKt(sbd: string, id: string): GoiKt | null {
  try {
    const o = JSON.parse(localStorage.getItem(khoaLuu(sbd, id)) ?? 'null') as GoiKt | null
    return o && typeof o.phien === 'string' && typeof o.goi === 'string' && o.phien && o.goi ? o : null
  } catch { return null }
}
/** Cất gói của bài `id`; bỏ gói các bài cũ của em (mỗi em chỉ giữ một gói). */
export function luuGoiKt(sbd: string, id: string, g: GoiKt): void {
  try {
    const tien = `ktcn:goi:${sbd}:`
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith(tien) && k !== khoaLuu(sbd, id)) localStorage.removeItem(k) }
    localStorage.setItem(khoaLuu(sbd, id), JSON.stringify(g))
  } catch { /* đầy / bị chặn ⇒ không gói, nộp đi đường cũ */ }
}
/** Phần thân báo phiên bản gói đang giữ (không gói ⇒ rỗng: đường cũ). */
export const thanGoiKt = (sbd: string, id: string): Record<string, unknown> => { const g = docGoiKt(sbd, id); return g ? { phienKq: g.phien } : {} }

const tuB64u = (s: string): Uint8Array<ArrayBuffer> => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/')
  const r = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
  const b = new Uint8Array(new ArrayBuffer(r.length))
  for (let i = 0; i < r.length; i++) b[i] = r.charCodeAt(i)
  return b
}
type MucGoi = { de: unknown; dapAn: unknown; loiGiai: unknown }

/** Phản hồi máy chủ `r` (có `ketQua`) ⇒ phần chữa dạng cũ. Không gọn ⇒ trả nguyên `ketQua`. Gọn mà mở hỏng / thiếu câu ⇒ null. */
export async function moKetKt(sbd: string, id: string, r: Record<string, unknown>): Promise<unknown | null> {
  const k = r.ketQua as { gon?: unknown; cau?: unknown } | undefined
  if (!k || k.gon !== true) return k
  const g = docGoiKt(sbd, id)
  if (!g || typeof r.khoaKq !== 'string' || r.phienKq !== g.phien || !Array.isArray(k.cau)) return null
  try {
    const b = tuB64u(g.goi)
    const khoa = await crypto.subtle.importKey('raw', tuB64u(r.khoaKq), { name: 'AES-GCM' }, false, ['decrypt'])
    const ro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: new TextEncoder().encode(kemGoiKt(id, sbd, g.phien)) }, khoa, b.slice(12))
    const bang = JSON.parse(new TextDecoder().decode(ro)) as Record<string, MucGoi>
    const cau = (k.cau as { qid: string; tra: string; dung: boolean }[]).map((c) => { const m = bang[c.qid]; if (!m) throw new Error('thiếu câu'); return { de: m.de, tra: c.tra, dung: c.dung, dapAn: m.dapAn, loiGiai: m.loiGiai } })
    const { gon: _bo, ...con } = k
    return { ...con, cau }
  } catch { return null }
}
