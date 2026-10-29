// KIỂM TRA CỦA SỬA CÂU THEO LUỒNG (thầy 29/10, video 09:47 «Bấm kiểm tra còn quá lâu. Phải tức thì luôn» — server/src/chua-gon-niem.ts).
// `gon-nop` kèm `luong: 1` + tem `sk` của gon-mo ⇒ NDJSON: dòng `tam` (kết quả suy từ tem, 0 đợt D1) đến ngay ⇒ `tam(k)`; dòng cuối = phản hồi gon-nop ĐẦY ĐỦ (đã ghi) như cũ.
// Máy chủ cũ / tem hỏng / hết hạn ⇒ JSON thường — đúng như `apiGonNop`. Tệp riêng (chỉ nằm trong mảnh Sửa câu, không vào lượt tải mở app).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docGon, type KetQuaGon } from './chua-cau-sai-api'

type Obj = Record<string, unknown>

/** Đọc thân NDJSON: dòng `tam` ⇒ `tam(o)`; trả dòng đầy đủ cuối cùng, hoặc `null` khi luồng đứt trước dòng ấy. */
async function docLuong(than: ReadableStream<Uint8Array>, tam: (o: Obj) => void): Promise<Obj | null> {
  const doc = than.getReader()
  const gm = new TextDecoder()
  let dem = ''
  let cuoi: Obj | null = null
  const xuLy = (d: string) => {
    if (!d.trim()) return
    let o: unknown
    try { o = JSON.parse(d) } catch { return }
    if (!o || typeof o !== 'object') return
    const x = o as Obj
    if (x.tam === true) { try { tam(x) } catch { /* lỗi giao diện không chặn phản hồi đầy đủ */ } } else cuoi = x
  }
  try {
    for (;;) {
      const { value, done } = await doc.read()
      if (value) dem += gm.decode(value, { stream: true })
      for (let i = dem.indexOf('\n'); i >= 0; i = dem.indexOf('\n')) { xuLy(dem.slice(0, i)); dem = dem.slice(i + 1) }
      if (done) { xuLy(dem); return cuoi }
    }
  } catch {
    return null
  }
}

/** Ghép dòng `tam` thành kết quả như máy chủ trả: `ct` + đề công khai đang làm (`de`) ⇒ `chiTiet` (ảnh sau lời giải nối vào ảnh đề). */
export function ketTuTam(t: KetQuaGon, de: KetQuaGon['de']): KetQuaGon {
  const { ct, sk2: _sk2, ...con } = t
  if (!ct || !de) return con
  return { ...con, chiTiet: { de: { ...de, hinhAnh: [...(de.hinhAnh ?? []), ...(Array.isArray(ct.hinhSau) ? ct.hinhSau : [])] }, dapAn: ct.dapAn, loiGiai: ct.loiGiai } }
}

export async function apiGonNopLuong(token: string, du: { dotId: string; ban: string; traLoi: string; khoa: string; qid?: string; sk: string }, tam: (t: KetQuaGon) => void): Promise<KetQuaGon> {
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), 20_000)
  try {
    const goc = await layDiaChiMayChu()
    if (!goc) return docGon(null)
    const { qid, ...rest } = du
    const r = await fetch(`${goc}/hs/chua-cau-sai/gon-nop`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: dk.signal,
      body: JSON.stringify({ ...rest, ...(qid ? { qid } : {}), luong: 1, token }),
    })
    let j: Obj | null = null
    if (r.body && /ndjson/i.test(r.headers.get('content-type') ?? '')) j = await docLuong(r.body, (o) => tam(docGon(o)))
    else { try { j = (await r.json()) as Obj } catch { j = null } }
    return docGon(j)
  } catch {
    return docGon(null)
  } finally {
    clearTimeout(hen)
  }
}
