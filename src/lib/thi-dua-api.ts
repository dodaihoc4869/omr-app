// `POST /hs/thi-dua-hom-nay {token}` (Code 4). Không ném lỗi: thiếu token / mất mạng / 404 / thân lạ ⇒ null ⇒ ô không hiện. Máy chủ chưa có lệnh (Pages đi trước Worker) cũng chỉ là null.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docThiDua, type ThiDua } from './thi-dua'

export async function taiThiDua(token: string): Promise<ThiDua | null> {
  if (!token) return null
  try {
    const url = await layDiaChiMayChu()
    if (!url) return null
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), 12_000)
    try {
      const r = await fetch(`${String(url).replace(/\/+$/, '')}/hs/thi-dua-hom-nay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }), signal: bo.signal })
      if (!r.ok) return null
      return docThiDua(await r.json().catch(() => null))
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return null
  }
}
